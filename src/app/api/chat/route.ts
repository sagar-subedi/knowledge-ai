import { NextRequest, NextResponse } from "next/server";
import { getIndex } from "@/lib/vector-store";
import "@/lib/llamaindex-config";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { chatHistories } from "@/lib/db/schema";
import { logQuery, logError } from "@/lib/activity-logger";
import { logger } from "@/lib/logger";
import { MetadataMode } from "llamaindex";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Check authentication
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const { message, historyId, categoryId } = await request.json();

        if (!message) {
            return NextResponse.json({ error: "No message provided" }, { status: 400 });
        }

        logger.info({ userId, query: message, categoryId }, "Processing chat query");

        // Get the index
        const index = await getIndex();

        // Build filters
        const filters: any[] = [
            {
                key: "userId",
                value: userId,
                operator: "==",
            },
        ];

        if (categoryId) {
            filters.push({
                key: "categoryId",
                value: parseInt(categoryId),
                operator: "==",
            });
        }

        // Create a query engine with user filter
        const queryEngine = index.asQueryEngine({
            similarityTopK: 5,
            preFilters: {
                filters,
            },
        });

        // Query
        const response = await queryEngine.query({ query: message });

        const duration = Date.now() - startTime;

        // Log activity
        await logQuery(
            userId,
            message,
            duration,
            request.headers.get("x-forwarded-for") || undefined,
            request.headers.get("user-agent") || undefined
        );

        // Save to chat history
        let savedChatId = historyId;

        const userMessageEntry = {
            role: "user",
            content: message,
            createdAt: new Date().toISOString(),
        };

        const assistantMessageEntry = {
            role: "assistant",
            content: response.toString(),
            sources: response.sourceNodes?.map((node: any) => ({
                text: node.node.text.substring(0, 200),
                metadata: node.node.metadata,
                score: node.score,
            })),
            createdAt: new Date().toISOString(),
        };

        if (savedChatId) {
            // Update existing history
            const [existingHistory] = await db
                .select()
                .from(chatHistories)
                .where(and(eq(chatHistories.id, savedChatId), eq(chatHistories.userId, userId)));

            if (existingHistory) {
                const updatedMessages = [
                    ...(existingHistory.messages as any[]),
                    userMessageEntry,
                    assistantMessageEntry
                ];

                await db
                    .update(chatHistories)
                    .set({
                        messages: updatedMessages,
                        updatedAt: new Date()
                    })
                    .where(eq(chatHistories.id, savedChatId));
            }
        } else {
            // Create new history
            const title = message.substring(0, 50) + (message.length > 50 ? "..." : "");
            const [newHistory] = await db.insert(chatHistories).values({
                userId,
                title,
                messages: [userMessageEntry, assistantMessageEntry],
            }).returning();

            savedChatId = newHistory.id;
        }

        return NextResponse.json({
            response: response.toString(),
            sources: response.sourceNodes?.map((node: any) => ({
                text: node.node.text.substring(0, 200),
                metadata: node.node.metadata,
                score: node.score,
            })),
            chatId: savedChatId,
        });
    } catch (error) {
        const session = await auth();
        const userId = session?.user?.id ? parseInt(session.user.id) : null;

        logger.error({ error, userId }, "Chat error");

        if (userId) {
            await logError(
                userId,
                error,
                "chat_query",
                request.headers.get("x-forwarded-for") || undefined,
                request.headers.get("user-agent") || undefined
            );
        }

        return NextResponse.json({
            error: "Failed to process query",
            details: error instanceof Error ? error.message : "Unknown error",
        }, { status: 500 });
    }
}
