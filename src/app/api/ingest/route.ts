import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import * as osModule from "os";
import { Document } from "llamaindex";
import { createIndexFromDocuments } from "@/lib/vector-store";
import "@/lib/llamaindex-config"; // Initialize settings

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Read file content
        const text = await file.text();

        // Create a LlamaIndex Document with metadata
        const document = new Document({
            text,
            metadata: {
                filename: file.name,
                mimeType: file.type,
                uploadedAt: new Date().toISOString(),
            },
        });

        console.log(`Processing document: ${file.name}`);

        // Index the document
        await createIndexFromDocuments([document]);

        return NextResponse.json({
            success: true,
            filename: file.name,
            size: file.size
        });
    } catch (error) {
        console.error("Ingestion error:", error);
        return NextResponse.json({
            error: "Failed to ingest file",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
