import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { flashcards } from "@/lib/db/schema";
import { eq, and, lte, asc } from "drizzle-orm";
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
        const dueOnly = searchParams.get("dueOnly") === "true";

        // Build conditions array, filtering out undefined
        const conditions = [eq(flashcards.userId, userId)];
        if (categoryId) {
            conditions.push(eq(flashcards.categoryId, parseInt(categoryId)));
        }
        if (dueOnly) {
            conditions.push(lte(flashcards.nextReviewAt, new Date()));
        }

        const query = db
            .select()
            .from(flashcards)
            .where(and(...conditions))
            .orderBy(asc(flashcards.nextReviewAt));

        const cards = await query;

        logger.info({ userId, categoryId, dueOnly, cardsFound: cards.length }, "Fetched flashcards");

        return NextResponse.json({ flashcards: cards });
    } catch (error) {
        logger.error({ error }, "Failed to fetch flashcards");
        return NextResponse.json({ error: "Failed to fetch flashcards" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const { categoryId, front, back } = await request.json();

        if (!categoryId || !front || !back) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const [newCard] = await db
            .insert(flashcards)
            .values({
                userId,
                categoryId,
                front,
                back,
            })
            .returning();

        return NextResponse.json({ flashcard: newCard }, { status: 201 });
    } catch (error) {
        logger.error({ error }, "Failed to create flashcard");
        return NextResponse.json({ error: "Failed to create flashcard" }, { status: 500 });
    }
}
