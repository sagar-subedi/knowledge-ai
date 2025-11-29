import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { flashcards } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/logger";

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
        const { searchParams } = new URL(request.url);
        const includeSubdecks = searchParams.get("includeSubdecks") === "true";

        // For now, just get cards from this deck
        // TODO: Add subdeck support
        const cards = await db
            .select()
            .from(flashcards)
            .where(and(
                eq(flashcards.deckId, deckId),
                eq(flashcards.userId, userId)
            ));

        return NextResponse.json({ cards });

    } catch (error) {
        logger.error({ error }, "Failed to fetch cards");
        return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
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
        const { front, back } = await request.json();

        if (!front || !back) {
            return NextResponse.json({ error: "front and back are required" }, { status: 400 });
        }

        const [newCard] = await db.insert(flashcards).values({
            userId,
            deckId,
            front,
            back,
        }).returning();

        return NextResponse.json({ card: newCard });

    } catch (error) {
        logger.error({ error }, "Failed to create card");
        return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
    }
}
