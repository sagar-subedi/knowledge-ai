"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Database, MessageSquare, Settings, LogOut, Zap, ClipboardList, Brain, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";

const navigation = [
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Knowledge Base", href: "/knowledge", icon: Database },
    { name: "Flashcards", href: "/flashcards", icon: Zap },
    { name: "Quizzes", href: "/quizzes", icon: ClipboardList },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <div className="flex h-full w-64 flex-col bg-slate-950 border-r border-slate-800/50">
            <div className="flex h-16 items-center gap-2 px-6 border-b border-slate-800/50">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
                    <Brain className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-100">Knowledge AI</span>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-6">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                                isActive
                                    ? "bg-violet-500/10 text-violet-400"
                                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </div>

            <div className="p-6 border-t border-slate-800/50 space-y-4">
                {session?.user && (
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                            <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">
                                {session.user.name || "User"}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                                {session.user.email}
                            </p>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-slate-100 transition-all"
                >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
