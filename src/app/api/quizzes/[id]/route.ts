import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { quizzes, questions } from "@/lib/db/schema";
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
        const quizId = parseInt(id);

        // Fetch quiz details
        const [quiz] = await db
            .select()
            .from(quizzes)
            .where(and(eq(quizzes.id, quizId), eq(quizzes.userId, userId)));

        if (!quiz) {
            return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
        }

        // Fetch questions (exclude correct answer and explanation)
        const quizQuestions = await db
            .select({
                id: questions.id,
                text: questions.text,
                options: questions.options,
            })
            .from(questions)
            .where(eq(questions.quizId, quizId));

        return NextResponse.json({
            quiz,
            questions: quizQuestions
        });

    } catch (error) {
        logger.error({ error }, "Failed to fetch quiz details");
        return NextResponse.json({ error: "Failed to fetch quiz details" }, { status: 500 });
    }
}
