import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { flashcards, studySessions, cardReviews, decks } from "@/lib/db/schema";
import { eq, and, lte, or, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";

// Helper function to get all descendant deck IDs (recursive)
async function getDescendantDeckIds(deckId: number, userId: number): Promise<number[]> {
    const allDeckIds = [deckId];
    
    // Get direct children
    const children = await db
        .select()
        .from(decks)
        .where(and(
            eq(decks.parentDeckId, deckId),
            eq(decks.userId, userId)
        ));
    
    // Recursively get descendants
    for (const child of children) {
        const descendants = await getDescendantDeckIds(child.id, userId);
        allDeckIds.push(...descendants);
    }
    
    return allDeckIds;
}

// SM-2 Algorithm for spaced repetition
function calculateNextReview(
    rating: 1 | 2 | 3 | 4,
    card: {
        interval: number;
        easeFactor: number;
        repetitions: number;
    }
) {
    let { interval, easeFactor, repetitions } = card;

    if (rating === 1) {
        // Again - restart the card
        repetitions = 0;
        interval = 0;
    } else {
        // Calculate new interval
        if (repetitions === 0) {
            interval = rating === 3 ? 1 : rating === 4 ? 4 : 1;
        } else if (repetitions === 1) {
            interval = rating === 3 ? 6 : rating === 4 ? 10 : 3;
        } else {
            interval = Math.round(interval * (easeFactor / 100));
        }

        repetitions += 1;

        // Update ease factor
        const efDelta = 0.1 - (4 - rating) * (0.08 + (4 - rating) * 0.02);
        easeFactor = Math.max(130, easeFactor + efDelta * 100);
    }

    const nextReviewAt = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);

    return {
        interval,
        easeFactor: Math.round(easeFactor),
        repetitions,
        nextReviewAt,
    };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const { id } = await params;
        const deckId = parseInt(id);

        // Get all descendant deck IDs (includes current deck)
        const deckIds = await getDescendantDeckIds(deckId, userId);

        // Get or create active study session
        let [activeSession] = await db
            .select()
            .from(studySessions)
            .where(and(
                eq(studySessions.userId, userId),
                eq(studySessions.deckId, deckId),
                eq(studySessions.isActive, true)
            ));

        const now = new Date();

        // Get new cards (never reviewed) from this deck and all subdecks
        const newCards = await db
            .select()
            .from(flashcards)
            .where(and(
                inArray(flashcards.deckId, deckIds),
                eq(flashcards.userId, userId),
                eq(flashcards.repetitions, 0)
            ))
            .limit(20);

        // Get due cards (nextReviewAt <= now and repetitions > 0) from this deck and all subdecks
        const dueCards = await db
            .select()
            .from(flashcards)
            .where(and(
                inArray(flashcards.deckId, deckIds),
                eq(flashcards.userId, userId),
                lte(flashcards.nextReviewAt, now),
                or(
                    eq(flashcards.repetitions, 1),
                    eq(flashcards.repetitions, 2),
                    eq(flashcards.repetitions, 3)
                )
            ))
            .limit(50);

        const totalCards = newCards.length + dueCards.length;

        if (!activeSession && totalCards > 0) {
            // Create new session
            [activeSession] = await db.insert(studySessions).values({
                userId,
                deckId,
                cardsTotal: totalCards,
                cardsReviewed: 0,
                isActive: true,
            }).returning();
        }

        return NextResponse.json({
            session: activeSession || null,
            newCards,
            dueCards,
            totalCards,
        });

    } catch (error) {
        logger.error({ error }, "Failed to get study session");
        return NextResponse.json({ error: "Failed to get study session" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const { id } = await params;
        const deckId = parseInt(id);
        const { cardId, rating, timeTakenMs } = await request.json();

        if (!cardId || !rating || rating < 1 || rating > 4) {
            return NextResponse.json({ error: "Invalid card review data" }, { status: 400 });
        }

        // Get the card
        const [card] = await db
            .select()
            .from(flashcards)
            .where(and(
                eq(flashcards.id, parseInt(cardId)),
                eq(flashcards.userId, userId)
            ));

        if (!card) {
            return NextResponse.json({ error: "Card not found" }, { status: 404 });
        }

        // Calculate next review using SM-2
        const srsUpdate = calculateNextReview(rating as 1 | 2 | 3 | 4, {
            interval: card.interval || 0,
            easeFactor: card.easeFactor || 250,
            repetitions: card.repetitions || 0,
        });

        // Update the card
        await db
            .update(flashcards)
            .set({
                interval: srsUpdate.interval,
                easeFactor: srsUpdate.easeFactor,
                repetitions: srsUpdate.repetitions,
                nextReviewAt: srsUpdate.nextReviewAt,
                updatedAt: new Date(),
            })
            .where(eq(flashcards.id, card.id));

        // Get active session
        const [activeSession] = await db
            .select()
            .from(studySessions)
            .where(and(
                eq(studySessions.userId, userId),
                eq(studySessions.deckId, deckId),
                eq(studySessions.isActive, true)
            ));

        // Record the review
        await db.insert(cardReviews).values({
            userId,
            flashcardId: card.id,
            sessionId: activeSession?.id || null,
            rating,
            timeTakenMs: timeTakenMs || null,
        });

        // Update session progress
        if (activeSession) {
            const newCardsReviewed = (activeSession.cardsReviewed || 0) + 1;
            const isComplete = newCardsReviewed >= (activeSession.cardsTotal || 0);

            await db
                .update(studySessions)
                .set({
                    cardsReviewed: newCardsReviewed,
                    completedAt: isComplete ? new Date() : null,
                    isActive: !isComplete,
                })
                .where(eq(studySessions.id, activeSession.id));
        }

        return NextResponse.json({
            success: true,
            card: {
                ...card,
                ...srsUpdate,
            },
        });

    } catch (error) {
        logger.error({ error }, "Failed to submit card review");
        return NextResponse.json({ error: "Failed to submit card review" }, { status: 500 });
    }
}
