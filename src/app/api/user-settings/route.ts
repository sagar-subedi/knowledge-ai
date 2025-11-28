import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        const settings = await db
            .select()
            .from(userSettings)
            .where(eq(userSettings.userId, userId))
            .limit(1);

        if (settings.length === 0) {
            // Create default settings if not exists
            const [newSettings] = await db.insert(userSettings).values({
                userId,
                theme: "dark",
                model: "gpt-4o",
            }).returning();

            return NextResponse.json({ settings: newSettings });
        }

        return NextResponse.json({ settings: settings[0] });
    } catch (error) {
        logger.error({ error }, "Failed to fetch user settings");
        return NextResponse.json({ error: "Failed to fetch user settings" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const body = await request.json();

        const [updatedSettings] = await db
            .update(userSettings)
            .set({
                ...body,
                updatedAt: new Date(),
            })
            .where(eq(userSettings.userId, userId))
            .returning();

        return NextResponse.json({ settings: updatedSettings });
    } catch (error) {
        logger.error({ error }, "Failed to update user settings");
        return NextResponse.json({ error: "Failed to update user settings" }, { status: 500 });
    }
}
