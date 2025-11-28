import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documents, quizzes, questions } from "@/lib/db/schema";
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
        const { categoryId, difficulty, questionCount } = await request.json();

        if (!categoryId || !difficulty || !questionCount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Fetch documents for the category
        const categoryDocs = await db
            .select()
            .from(documents)
            .where(and(eq(documents.userId, userId), eq(documents.categoryId, categoryId)))
            .limit(10); // Limit context to 10 docs

        if (categoryDocs.length === 0) {
            return NextResponse.json({ error: "No documents found in this category" }, { status: 404 });
        }

        const context = categoryDocs.map(d => d.content).join("\n\n").substring(0, 15000);

        // Generate quiz using OpenAI
        const llm = new OpenAI({ model: "gpt-4o" });

        const prompt = `
            You are an expert examiner. Create a ${difficulty} difficulty quiz with ${questionCount} multiple-choice questions based on the following text.
            
            Return the result as a JSON object with the following structure:
            {
                "title": "A short, descriptive title for the quiz",
                "description": "A brief description of what the quiz covers",
                "questions": [
                    {
                        "text": "Question text",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correctAnswer": "Option A", // Must match one of the options exactly
                        "explanation": "Explanation of why this is the correct answer"
                    }
                ]
            }

            Text:
            ${context}
            
            IMPORTANT: Return ONLY the raw JSON string. Do not include markdown formatting like \`\`\`json.
        `;

        const response = await llm.complete({ prompt });
        const text = response.text;

        let quizData;
        try {
            const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
            quizData = JSON.parse(jsonStr);
        } catch (e) {
            logger.error({ error: e, text }, "Failed to parse LLM response");
            return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });
        }

        // Save quiz to DB
        const [newQuiz] = await db.insert(quizzes).values({
            userId,
            categoryId,
            title: quizData.title,
            description: quizData.description,
            timeLimit: questionCount * 2, // 2 minutes per question
            difficulty,
            questionCount,
        }).returning();

        // Save questions
        await Promise.all(quizData.questions.map((q: any) =>
            db.insert(questions).values({
                quizId: newQuiz.id,
                text: q.text,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
            })
        ));

        return NextResponse.json({ quizId: newQuiz.id });

    } catch (error) {
        logger.error({ error }, "Failed to generate quiz");
        return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });
    }
}
