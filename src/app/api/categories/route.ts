import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        const allCategories = await db
            .select()
            .from(categories)
            .where(eq(categories.userId, userId))
            .orderBy(desc(categories.createdAt));

        return NextResponse.json({ categories: allCategories });
    } catch (error) {
        logger.error({ error }, "Failed to fetch categories");
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const { name, description, color } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const [newCategory] = await db
            .insert(categories)
            .values({
                userId,
                name,
                description,
                color: color || "blue",
            })
            .returning();

        return NextResponse.json({ category: newCategory }, { status: 201 });
    } catch (error) {
        logger.error({ error }, "Failed to create category");
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}
