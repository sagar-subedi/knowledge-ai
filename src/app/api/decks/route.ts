import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { decks, flashcards } from "@/lib/db/schema";
import { eq, and, isNull, sql, lte } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId");

        if (!categoryId) {
            return NextResponse.json({ error: "categoryId is required" }, { status: 400 });
        }

        // Get all decks for this category (hierarchical)
        const allDecks = await db
            .select()
            .from(decks)
            .where(and(
                eq(decks.userId, userId),
                eq(decks.categoryId, parseInt(categoryId))
            ));

        // Get card counts per deck
        const now = new Date();
        const cardCounts = await db
            .select({
                deckId: flashcards.deckId,
                newCount: sql<number>`count(case when ${flashcards.repetitions} = 0 then 1 end)`,
                learningCount: sql<number>`count(case when ${flashcards.repetitions} > 0 and ${flashcards.interval} < 3 and ${flashcards.nextReviewAt} <= ${now} then 1 end)`,
                reviewCount: sql<number>`count(case when ${flashcards.repetitions} > 0 and ${flashcards.interval} >= 3 and ${flashcards.nextReviewAt} <= ${now} then 1 end)`,
            })
            .from(flashcards)
            .where(eq(flashcards.userId, userId))
            .groupBy(flashcards.deckId);

        const countsMap = new Map(cardCounts.map(c => [c.deckId, c]));

        // Build hierarchical structure
        const deckMap = new Map(allDecks.map(d => {
            const counts = countsMap.get(d.id) || { newCount: 0, learningCount: 0, reviewCount: 0 };
            return [d.id, {
                ...d,
                subdecks: [] as any[],
                newCount: Number(counts.newCount),
                learningCount: Number(counts.learningCount),
                reviewCount: Number(counts.reviewCount)
            }];
        }));

        const rootDecks: any[] = [];

        allDecks.forEach(deck => {
            const deckWithSubdecks = deckMap.get(deck.id)!;
            if (deck.parentDeckId) {
                const parent = deckMap.get(deck.parentDeckId);
                if (parent) {
                    parent.subdecks.push(deckWithSubdecks);
                    // Aggregate counts to parent (optional, but good for UX)
                    // For now, let's just show own counts, or we can implement recursive aggregation later if needed
                }
            } else {
                rootDecks.push(deckWithSubdecks);
            }
        });

        return NextResponse.json({ decks: rootDecks });

    } catch (error) {
        logger.error({ error }, "Failed to fetch decks");
        return NextResponse.json({ error: "Failed to fetch decks" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const { categoryId, parentDeckId, name, description } = await request.json();

        if (!categoryId || !name) {
            return NextResponse.json({ error: "categoryId and name are required" }, { status: 400 });
        }

        const [newDeck] = await db.insert(decks).values({
            userId,
            categoryId: parseInt(categoryId),
            parentDeckId: parentDeckId ? parseInt(parentDeckId) : null,
            name,
            description: description || null,
        }).returning();

        return NextResponse.json({ deck: newDeck });

    } catch (error) {
        logger.error({ error }, "Failed to create deck");
        return NextResponse.json({ error: "Failed to create deck" }, { status: 500 });
    }
}
