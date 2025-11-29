import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard") ||
        req.nextUrl.pathname.startsWith("/knowledge") ||
        req.nextUrl.pathname.startsWith("/quizzes") ||
        req.nextUrl.pathname.startsWith("/flashcards") ||
        req.nextUrl.pathname.startsWith("/chat") ||
        req.nextUrl.pathname.startsWith("/settings");

    const isAuthPage = req.nextUrl.pathname.startsWith("/login") ||
        req.nextUrl.pathname.startsWith("/register");

    if (isOnDashboard) {
        if (isLoggedIn) return NextResponse.next();
        return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    if (isAuthPage) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL("/knowledge", req.nextUrl)); // Changed to /knowledge since /dashboard might not exist
        }
        return NextResponse.next();
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
