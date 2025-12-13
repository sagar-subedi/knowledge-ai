import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documents, flashcards, decks } from "@/lib/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { OpenAI } from "@llamaindex/openai";
import { logger } from "@/lib/logger";
import { extractMultipleSections, TOCSection } from "@/lib/toc-extractor";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const { deckId, count = 5, documentIds, sections } = await request.json();

        if (!deckId) {
            return NextResponse.json({ error: "Deck ID is required" }, { status: 400 });
        }

        // Verify deck exists and get its categoryId
        const [deck] = await db
            .select()
            .from(decks)
            .where(and(eq(decks.id, deckId), eq(decks.userId, userId)));

        if (!deck) {
            return NextResponse.json({ error: "Deck not found" }, { status: 404 });
        }

        // Fetch documents
        let docs;
        if (documentIds && documentIds.length > 0) {
            // Fetch specific documents
            docs = await db
                .select()
                .from(documents)
                .where(and(
                    eq(documents.userId, userId),
                    inArray(documents.id, documentIds)
                ));
        } else {
            // Fetch documents for the category (fallback)
            docs = await db
                .select()
                .from(documents)
                .where(and(eq(documents.userId, userId), eq(documents.categoryId, deck.categoryId)))
                .limit(5);
        }

        logger.info({
            userId,
            deckId,
            categoryId: deck.categoryId,
            docsFound: docs.length,
            specificDocs: !!documentIds
        }, "Fetching docs for flashcard generation");

        if (docs.length === 0) {
            return NextResponse.json({ error: "No documents found" }, { status: 404 });
        }

        // Prepare context content
        let context = "";

        if (sections && sections.length > 0) {
            // Extract specific sections
            const contentParts = [];

            for (const doc of docs) {
                const docSections = sections.find((s: any) => s.documentId === doc.id);

                if (docSections && doc.toc) {
                    // Get specific sections from TOC
                    const tocSections = (doc.toc as TOCSection[]).filter((_, idx) =>
                        docSections.sectionIndexes.includes(idx)
                    );

                    if (tocSections.length > 0) {
                        const extractedText = extractMultipleSections(doc.content, tocSections);
                        contentParts.push(`From ${(doc.metadata as any)?.filename || 'Document'}:\n${extractedText}`);
                    } else {
                        // Fallback if no valid sections found in TOC
                        contentParts.push(`From ${(doc.metadata as any)?.filename || 'Document'}:\n${doc.content.substring(0, 2000)}`);
                    }
                } else if (documentIds?.includes(doc.id)) {
                    // If doc selected but no specific sections, use full content (truncated)
                    contentParts.push(`From ${(doc.metadata as any)?.filename || 'Document'}:\n${doc.content.substring(0, 5000)}`);
                }
            }

            context = contentParts.join("\n\n");
        } else {
            // Use full content of selected documents (truncated)
            context = docs
                .map(d => `From ${(d.metadata as any)?.filename || 'Document'}:\n${d.content}`)
                .join("\n\n")
                .substring(0, 15000); // Increased limit for specific docs
        }

        if (!context.trim()) {
            return NextResponse.json({ error: "No content available from selected documents/sections" }, { status: 400 });
        }

        // Fetch existing flashcards to avoid duplicates
        const existingCards = await db
            .select({ front: flashcards.front })
            .from(flashcards)
            .where(and(eq(flashcards.deckId, deckId), eq(flashcards.userId, userId)))
            .orderBy(desc(flashcards.createdAt))
            .limit(50);

        const existingQuestions = existingCards.map(c => c.front).join("\n- ");

        // Generate flashcards using OpenAI
        const llm = new OpenAI({ model: "gpt-4o" });

        let prompt = `You are an expert tutor. Create ${count} high-quality flashcards based on the following text.
Each flashcard should have a "front" (question/concept) and a "back" (answer/explanation).
Focus on key concepts, definitions, and important details.

Return the result as a JSON array of objects with "front" and "back" keys.
Do not include any markdown formatting or code blocks, just the raw JSON string.`;

        if (existingQuestions) {
            prompt += `\n\nAVOID DUPLICATES:
Do not generate flashcards that are semantically similar to the following existing questions:
- ${existingQuestions}`;
        }

        prompt += `\n\nText:
${context}`;

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
                    deckId,
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
