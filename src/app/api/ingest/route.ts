import { NextRequest, NextResponse } from "next/server";
import { Document } from "llamaindex";
import { createIndexFromDocuments } from "@/lib/vector-store";
import "@/lib/llamaindex-config"; // Initialize settings
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { logDocumentUpload, logError } from "@/lib/activity-logger";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Check authentication
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const categoryId = formData.get("categoryId") ? parseInt(formData.get("categoryId") as string) : null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        logger.info({ userId, filename: file.name, size: file.size, categoryId }, "Starting document ingestion");

        // Read file content
        const text = await file.text();

        // Save document to database first
        const [dbDocument] = await db.insert(documents).values({
            userId,
            categoryId,
            content: text,
            metadata: {
                filename: file.name,
                mimeType: file.type,
                uploadedAt: new Date().toISOString(),
                size: file.size,
            },
        }).returning();

        // Create a LlamaIndex Document with metadata including user_id and category_id
        const document = new Document({
            text,
            metadata: {
                userId,
                categoryId,
                documentId: dbDocument.id,
                filename: file.name,
                mimeType: file.type,
                uploadedAt: new Date().toISOString(),
            },
        });

        // Index the document with user context
        await createIndexFromDocuments([document], userId);

        const duration = Date.now() - startTime;
        logger.info({ userId, filename: file.name, duration }, "Document ingestion completed");

        // Log activity
        await logDocumentUpload(
            userId,
            dbDocument.id,
            file.name,
            request.headers.get("x-forwarded-for") || undefined,
            request.headers.get("user-agent") || undefined
        );

        return NextResponse.json({
            success: true,
            filename: file.name,
            size: file.size,
            documentId: dbDocument.id,
        });
    } catch (error) {
        const session = await auth();
        const userId = session?.user?.id ? parseInt(session.user.id) : null;

        logger.error({ error, userId }, "Ingestion error");

        if (userId) {
            await logError(
                userId,
                error,
                "document_ingestion",
                request.headers.get("x-forwarded-for") || undefined,
                request.headers.get("user-agent") || undefined
            );
        }

        return NextResponse.json({
            error: "Failed to ingest file",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
