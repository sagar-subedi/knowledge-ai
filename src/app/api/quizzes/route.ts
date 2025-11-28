import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { quizzes, quizAttempts, categories } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        // Fetch quizzes with category info
        const userQuizzes = await db
            .select({
                id: quizzes.id,
                title: quizzes.title,
                description: quizzes.description,
                difficulty: quizzes.difficulty,
                questionCount: quizzes.questionCount,
                timeLimit: quizzes.timeLimit,
                createdAt: quizzes.createdAt,
                categoryName: categories.name,
                color: categories.color,
            })
            .from(quizzes)
            .leftJoin(categories, eq(quizzes.categoryId, categories.id))
            .where(eq(quizzes.userId, userId))
            .orderBy(desc(quizzes.createdAt));

        // Fetch recent attempts
        const attempts = await db
            .select()
            .from(quizAttempts)
            .where(eq(quizAttempts.userId, userId))
            .orderBy(desc(quizAttempts.completedAt));

        // Map attempts to quizzes
        const quizzesWithAttempts = userQuizzes.map(quiz => {
            const quizAttemptsList = attempts.filter(a => a.quizId === quiz.id);
            const bestScore = quizAttemptsList.length > 0
                ? Math.max(...quizAttemptsList.map(a => a.score))
                : null;
            const latestAttempt = quizAttemptsList[0] || null;

            return {
                ...quiz,
                attempts: quizAttemptsList.length,
                bestScore,
                latestAttemptDate: latestAttempt?.completedAt,
            };
        });

        return NextResponse.json({ quizzes: quizzesWithAttempts });

    } catch (error) {
        logger.error({ error }, "Failed to fetch quizzes");
        return NextResponse.json({ error: "Failed to fetch quizzes" }, { status: 500 });
    }
}
