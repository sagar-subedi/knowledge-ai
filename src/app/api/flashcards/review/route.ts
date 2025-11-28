import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { flashcards } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { calculateSRS } from "@/lib/srs";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const { cardId, quality } = await request.json();

        if (!cardId || quality === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Fetch current card state
        const card = await db
            .select()
            .from(flashcards)
            .where(and(eq(flashcards.id, cardId), eq(flashcards.userId, userId)))
            .limit(1);

        if (card.length === 0) {
            return NextResponse.json({ error: "Card not found" }, { status: 404 });
        }

        const currentCard = card[0];

        // Calculate new SRS state
        const srsResult = calculateSRS(
            quality,
            currentCard.repetitions || 0,
            currentCard.easeFactor || 250,
            currentCard.interval || 0
        );

        // Update card
        const [updatedCard] = await db
            .update(flashcards)
            .set({
                nextReviewAt: srsResult.nextReviewAt,
                interval: srsResult.interval,
                easeFactor: srsResult.easeFactor,
                repetitions: srsResult.repetitions,
                updatedAt: new Date(),
            })
            .where(eq(flashcards.id, cardId))
            .returning();

        return NextResponse.json({ flashcard: updatedCard });
    } catch (error) {
        logger.error({ error }, "Failed to review flashcard");
        return NextResponse.json({ error: "Failed to review flashcard" }, { status: 500 });
    }
}
