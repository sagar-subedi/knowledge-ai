import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documents, categories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        const userDocuments = await db
            .select({
                id: documents.id,
                content: documents.content,
                metadata: documents.metadata,
                createdAt: documents.createdAt,
                categoryId: documents.categoryId,
                categoryName: categories.name,
                categoryColor: categories.color,
                toc: documents.toc,
            })
            .from(documents)
            .leftJoin(categories, eq(documents.categoryId, categories.id))
            .where(eq(documents.userId, userId))
            .orderBy(desc(documents.createdAt));

        return NextResponse.json({ documents: userDocuments });
    } catch (error) {
        logger.error({ error }, "Failed to fetch documents");
        return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }
}
