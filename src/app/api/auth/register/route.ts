import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
    try {
        const { name, email, password } = await request.json();

        // Validate input
        if (!email || !password || password.length < 8) {
            return NextResponse.json(
                { error: "Invalid input. Password must be at least 8 characters." },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (existingUser.length > 0) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await db
            .insert(users)
            .values({
                email,
                passwordHash,
                name: name || null,
            })
            .returning();

        // Create default user settings
        await db.insert(userSettings).values({
            userId: newUser[0].id,
            theme: "dark",
            model: "gpt-4o",
        });

        return NextResponse.json(
            { message: "User created successfully", userId: newUser[0].id },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
        );
    }
}
