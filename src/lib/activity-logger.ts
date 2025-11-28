import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

export async function logActivity(
    userId: number | null,
    action: string,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string
) {
    try {
        await db.insert(activityLogs).values({
            userId,
            action,
            metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
        });
    } catch (error) {
        logger.error({ error, action, userId }, "Failed to log activity");
    }
}

export async function logDocumentUpload(
    userId: number,
    documentId: number,
    filename: string,
    ipAddress?: string,
    userAgent?: string
) {
    return logActivity(
        userId,
        "document_upload",
        { documentId, filename },
        ipAddress,
        userAgent
    );
}

export async function logQuery(
    userId: number,
    query: string,
    responseTime: number,
    ipAddress?: string,
    userAgent?: string
) {
    return logActivity(
        userId,
        "query",
        { query, responseTime },
        ipAddress,
        userAgent
    );
}

export async function logError(
    userId: number | null,
    error: any,
    context?: string,
    ipAddress?: string,
    userAgent?: string
) {
    return logActivity(
        userId,
        "error",
        { error: error.message || String(error), context },
        ipAddress,
        userAgent
    );
}
