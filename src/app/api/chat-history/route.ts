import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { chatHistories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        const history = await db
            .select()
            .from(chatHistories)
            .where(eq(chatHistories.userId, userId))
            .orderBy(desc(chatHistories.updatedAt));

        return NextResponse.json({ history });
    } catch (error) {
        logger.error({ error }, "Failed to fetch chat history");
        return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
        }

        await db
            .delete(chatHistories)
            .where(eq(chatHistories.id, parseInt(id)));

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error({ error }, "Failed to delete chat history");
        return NextResponse.json({ error: "Failed to delete chat history" }, { status: 500 });
    }
}
