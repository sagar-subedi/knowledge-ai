import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { decks, flashcards } from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";

// Helper to recursively get all descendant deck IDs
async function getDescendantDeckIds(deckId: number): Promise<number[]> {
    const subdecks = await db
        .select({ id: decks.id })
        .from(decks)
        .where(eq(decks.parentDeckId, deckId));

    let ids: number[] = [];
    for (const subdeck of subdecks) {
        ids.push(subdeck.id);
        const childIds = await getDescendantDeckIds(subdeck.id);
        ids = [...ids, ...childIds];
    }
    return ids;
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

        const [deck] = await db
            .select()
            .from(decks)
            .where(and(eq(decks.id, deckId), eq(decks.userId, userId)));

        if (!deck) {
            return NextResponse.json({ error: "Deck not found" }, { status: 404 });
        }

        // Get own card count
        const [ownCardCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(flashcards)
            .where(eq(flashcards.deckId, deckId));

        // Get total card count (including subdecks)
        const descendantIds = await getDescendantDeckIds(deckId);
        const allDeckIds = [deckId, ...descendantIds];

        const [totalCardCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(flashcards)
            .where(inArray(flashcards.deckId, allDeckIds));

        // Get subdeck count
        const [subdeckCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(decks)
            .where(eq(decks.parentDeckId, deckId));

        return NextResponse.json({
            deck: {
                ...deck,
                ownCardCount: Number(ownCardCount.count),
                totalCardCount: Number(totalCardCount.count),
                subdeckCount: Number(subdeckCount.count),
            }
        });

    } catch (error) {
        logger.error({ error }, "Failed to fetch deck");
        return NextResponse.json({ error: "Failed to fetch deck" }, { status: 500 });
    }
}

export async function PUT(
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
        const { name, description } = await request.json();

        const [updatedDeck] = await db
            .update(decks)
            .set({ name, description, updatedAt: new Date() })
            .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
            .returning();

        if (!updatedDeck) {
            return NextResponse.json({ error: "Deck not found" }, { status: 404 });
        }

        return NextResponse.json({ deck: updatedDeck });

    } catch (error) {
        logger.error({ error }, "Failed to update deck");
        return NextResponse.json({ error: "Failed to update deck" }, { status: 500 });
    }
}

export async function DELETE(
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

        await db
            .delete(decks)
            .where(and(eq(decks.id, deckId), eq(decks.userId, userId)));

        return NextResponse.json({ success: true });

    } catch (error) {
        logger.error({ error }, "Failed to delete deck");
        return NextResponse.json({ error: "Failed to delete deck" }, { status: 500 });
    }
}
