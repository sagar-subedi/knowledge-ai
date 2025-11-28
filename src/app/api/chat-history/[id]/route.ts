import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { chatHistories } from "@/lib/db/schema";
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
        const chatId = parseInt(id);

        const [history] = await db
            .select()
            .from(chatHistories)
            .where(and(eq(chatHistories.id, chatId), eq(chatHistories.userId, userId)));

        if (!history) {
            return NextResponse.json({ error: "Chat history not found" }, { status: 404 });
        }

        return NextResponse.json({ history });

    } catch (error) {
        logger.error({ error }, "Failed to fetch chat history");
        return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 });
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
        const chatId = parseInt(id);

        await db
            .delete(chatHistories)
            .where(and(eq(chatHistories.id, chatId), eq(chatHistories.userId, userId)));

        return NextResponse.json({ success: true });

    } catch (error) {
        logger.error({ error }, "Failed to delete chat history");
        return NextResponse.json({ error: "Failed to delete chat history" }, { status: 500 });
    }
}
