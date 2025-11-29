import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { decks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/logger";

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
        const parentDeckId = parseInt(id);
        const { name, description } = await request.json();

        // Verify parent deck exists and belongs to user
        const [parentDeck] = await db
            .select()
            .from(decks)
            .where(and(eq(decks.id, parentDeckId), eq(decks.userId, userId)));

        if (!parentDeck) {
            return NextResponse.json({ error: "Parent deck not found" }, { status: 404 });
        }

        // Create subdeck
        const [newDeck] = await db
            .insert(decks)
            .values({
                name,
                description,
                userId,
                categoryId: parentDeck.categoryId, // Inherit category from parent
                parentDeckId,
            })
            .returning();

        return NextResponse.json({ deck: newDeck }, { status: 201 });

    } catch (error) {
        logger.error({ error }, "Failed to create subdeck");
        return NextResponse.json({ error: "Failed to create subdeck" }, { status: 500 });
    }
}
