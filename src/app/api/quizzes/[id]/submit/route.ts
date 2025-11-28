import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { quizzes, questions, quizAttempts, quizAnswers } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
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
        const quizId = parseInt(id);
        const { answers } = await request.json(); // Array of { questionId, answer }

        if (!answers || !Array.isArray(answers)) {
            return NextResponse.json({ error: "Invalid answers format" }, { status: 400 });
        }

        // Fetch all questions for this quiz to compare answers
        const quizQuestions = await db
            .select()
            .from(questions)
            .where(eq(questions.quizId, quizId));

        if (quizQuestions.length === 0) {
            return NextResponse.json({ error: "Quiz not found or has no questions" }, { status: 404 });
        }

        // Calculate score
        let score = 0;
        const processedAnswers = [];

        for (const question of quizQuestions) {
            const userAnswer = answers.find((a: any) => a.questionId === question.id)?.answer;
            const isCorrect = userAnswer === question.correctAnswer;

            if (isCorrect) {
                score++;
            }

            processedAnswers.push({
                questionId: question.id,
                userAnswer: userAnswer || "",
                isCorrect,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation,
            });
        }

        // Record attempt
        const [attempt] = await db.insert(quizAttempts).values({
            userId,
            quizId,
            score,
            totalQuestions: quizQuestions.length,
            startedAt: new Date(Date.now() - 1000 * 60 * 10), // Approximate start time if not tracked strictly
            completedAt: new Date(),
        }).returning();

        // Record individual answers
        if (processedAnswers.length > 0) {
            await db.insert(quizAnswers).values(
                processedAnswers.map(a => ({
                    attemptId: attempt.id,
                    questionId: a.questionId,
                    userAnswer: a.userAnswer,
                    isCorrect: a.isCorrect,
                }))
            );
        }

        return NextResponse.json({
            attemptId: attempt.id,
            score,
            totalQuestions: quizQuestions.length,
            percentage: Math.round((score / quizQuestions.length) * 100),
            results: processedAnswers.map(a => ({
                questionId: a.questionId,
                isCorrect: a.isCorrect,
                userAnswer: a.userAnswer,
                correctAnswer: a.correctAnswer,
                explanation: a.explanation,
            }))
        });

    } catch (error) {
        logger.error({ error }, "Failed to submit quiz");
        return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 });
    }
}
