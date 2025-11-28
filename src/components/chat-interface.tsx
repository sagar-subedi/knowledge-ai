"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, FileText, User, Bot, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    role: "user" | "assistant";
    content: string;
    sources?: Array<{ text: string; metadata: Record<string, unknown>; score: number }>;
}

interface Category {
    id: number;
    name: string;
}

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            if (data.categories) setCategories(data.categories);
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: input,
                    categoryId: selectedCategory ? parseInt(selectedCategory) : undefined
                }),
            });

            const data = await response.json();

            if (response.ok) {
                const assistantMessage: Message = {
                    role: "assistant",
                    content: data.response,
                    sources: data.sources,
                };
                setMessages((prev) => [...prev, assistantMessage]);
            } else {
                const errorMessage: Message = {
                    role: "assistant",
                    content: `Error: ${data.error}`,
                };
                setMessages((prev) => [...prev, errorMessage]);
            }
        } catch (error) {
            const errorMessage: Message = {
                role: "assistant",
                content: "Failed to get response. Please try again.",
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-8 w-full">
                <div className="w-full max-w-4xl mx-auto space-y-6" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                    {messages.length === 0 && (
                        <div className="flex items-center justify-center min-h-[60vh]">
                            <div className="text-center space-y-6 px-4">
                                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-violet-500/20">
                                    <Bot className="w-10 h-10 text-white" />
                                </div>
                                <div className="space-y-3">
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                                        Your Knowledge AI
                                    </h2>
                                    <p className="text-lg text-slate-400 max-w-lg mx-auto leading-relaxed">
                                        Ask me anything about your documents. I&apos;ll search through your knowledge base and provide detailed, cited answers.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={cn(
                                "flex gap-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500",
                                message.role === "user" ? "justify-end" : "justify-start"
                            )}
                        >
                            {message.role === "assistant" && (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                            )}

                            <div
                                className={cn(
                                    "max-w-[75%] rounded-2xl px-5 py-4 shadow-xl",
                                    message.role === "user"
                                        ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white"
                                        : "bg-slate-800/80 backdrop-blur-sm text-slate-100 border border-slate-700/50"
                                )}
                            >
                                <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>

                                {message.sources && message.sources.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                                        <p className="text-xs text-slate-400 font-semibold mb-3 uppercase tracking-wide">Sources</p>
                                        <div className="space-y-2">
                                            {message.sources.map((source, idx) => (
                                                <div
                                                    key={idx}
                                                    className="text-xs bg-slate-900/50 rounded-lg p-3 border border-slate-700/30"
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <FileText className="w-3 h-3 text-violet-400" />
                                                        <span className="font-medium text-slate-300">
                                                            {source.metadata.filename || "Untitled"}
                                                        </span>
                                                        {source.score && (
                                                            <span className="ml-auto text-slate-500">
                                                                {(source.score * 100).toFixed(1)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-400 line-clamp-2">{source.text}...</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {message.role === "user" && (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-4 animate-in fade-in-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl px-5 py-4 border border-slate-700/50">
                                <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Form */}
            <div className="border-t border-slate-800/50 backdrop-blur-sm bg-slate-900/50 p-6 w-full">
                <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                    <div className="flex flex-col gap-3">
                        {/* Category Selector */}
                        {categories.length > 0 && (
                            <div className="flex items-center gap-2 self-start">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="bg-slate-800/50 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-violet-500"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex gap-3 items-center bg-slate-800/50 rounded-2xl border border-slate-700/50 p-2 focus-within:ring-2 focus-within:ring-violet-500/50 transition-all shadow-xl">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about your documents..."
                                className="flex-1 bg-transparent px-4 py-3 text-base text-slate-100 placeholder-slate-500 focus:outline-none"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="bg-gradient-to-br from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-xl px-5 py-3 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-violet-500/25 font-medium"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
