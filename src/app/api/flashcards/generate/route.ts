import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documents, flashcards } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { OpenAI } from "@llamaindex/openai";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const { categoryId } = await request.json();

        if (!categoryId) {
            return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
        }

        // Fetch documents for the category
        const categoryDocs = await db
            .select()
            .from(documents)
            .where(and(eq(documents.userId, userId), eq(documents.categoryId, categoryId)))
            .limit(5); // Limit to 5 docs for now to avoid token limits

        logger.info({ userId, categoryId, docsFound: categoryDocs.length }, "Fetching docs for flashcard generation");

        if (categoryDocs.length === 0) {
            return NextResponse.json({ error: "No documents found in this category" }, { status: 404 });
        }

        // Combine text
        const context = categoryDocs.map(d => d.content).join("\n\n").substring(0, 10000); // Truncate context

        // Generate flashcards using OpenAI
        const llm = new OpenAI({ model: "gpt-4o" });

        const prompt = `
            You are an expert tutor.Create 5 high - quality flashcards based on the following text.
            Each flashcard should have a "front"(question / concept) and a "back"(answer / explanation).
            Focus on key concepts, definitions, and important details.
            
            Return the result as a JSON array of objects with "front" and "back" keys.
            Do not include any markdown formatting or code blocks, just the raw JSON string.

    Text:
            ${context}
`;

        const response = await llm.complete({ prompt });
        const text = response.text;

        // Parse JSON
        let cards: { front: string; back: string }[] = [];
        try {
            // Clean up potential markdown code blocks
            const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
            cards = JSON.parse(jsonStr);
        } catch (e) {
            logger.error({ error: e, text }, "Failed to parse LLM response");
            return NextResponse.json({ error: "Failed to generate flashcards" }, { status: 500 });
        }

        // Save to database
        const createdCards = await Promise.all(
            cards.map(card =>
                db.insert(flashcards).values({
                    userId,
                    categoryId,
                    front: card.front,
                    back: card.back,
                }).returning()
            )
        );

        return NextResponse.json({ flashcards: createdCards.map(c => c[0]) });
    } catch (error) {
        logger.error({ error }, "Failed to generate flashcards");
        return NextResponse.json({ error: "Failed to generate flashcards" }, { status: 500 });
    }
}
