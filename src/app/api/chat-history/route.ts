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

        const histories = await db
            .select({
                id: chatHistories.id,
                title: chatHistories.title,
                createdAt: chatHistories.createdAt,
                updatedAt: chatHistories.updatedAt,
            })
            .from(chatHistories)
            .where(eq(chatHistories.userId, userId))
            .orderBy(desc(chatHistories.updatedAt));

        return NextResponse.json({ histories });

    } catch (error) {
        logger.error({ error }, "Failed to fetch chat histories");
        return NextResponse.json({ error: "Failed to fetch chat histories" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        const [newChat] = await db.insert(chatHistories).values({
            userId,
            title: "New Chat",
            messages: [],
        }).returning();

        return NextResponse.json({ chat: newChat });

    } catch (error) {
        logger.error({ error }, "Failed to create chat history");
        return NextResponse.json({ error: "Failed to create chat history" }, { status: 500 });
    }
}
