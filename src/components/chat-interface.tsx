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

    const [history, setHistory] = useState<any[]>([]);
    const [currentChatId, setCurrentChatId] = useState<number | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch("/api/chat-history");
            const data = await res.json();
            if (data.histories) setHistory(data.histories);
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const loadChat = async (chatId: number) => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/chat-history/${chatId}`);
            const data = await res.json();

            if (data.history) {
                setMessages(data.history.messages);
                setCurrentChatId(chatId);
                // Mobile: close sidebar on selection
                if (window.innerWidth < 768) setIsHistoryOpen(false);
            }
        } catch (error) {
            console.error("Failed to load chat", error);
        } finally {
            setIsLoading(false);
        }
    };

    const startNewChat = () => {
        setMessages([]);
        setCurrentChatId(null);
        setInput("");
        // Mobile: close sidebar
        if (window.innerWidth < 768) setIsHistoryOpen(false);
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
                    categoryId: selectedCategory ? parseInt(selectedCategory) : undefined,
                    historyId: currentChatId
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

                if (data.chatId && data.chatId !== currentChatId) {
                    setCurrentChatId(data.chatId);
                    // We need to wait a bit for the DB write to propagate or just refresh
                    setTimeout(fetchHistory, 100);
                } else if (currentChatId) {
                    // Also refresh if we're in an existing chat to update the timestamp/order
                    fetchHistory();
                }
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
        <div className="flex h-full bg-slate-950 overflow-hidden">
            {/* History Sidebar */}
            <div className={cn(
                "bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col",
                isHistoryOpen ? "w-80" : "w-0 opacity-0 overflow-hidden"
            )}>
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-200">History</h2>
                    <button
                        onClick={startNewChat}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                        title="New Chat"
                    >
                        <Bot className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <button
                        onClick={startNewChat}
                        className={cn(
                            "w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 text-sm font-medium mb-4",
                            currentChatId === null
                                ? "bg-violet-600/10 text-violet-400 border border-violet-500/20"
                                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        )}
                    >
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                            <Bot className="w-4 h-4" />
                        </div>
                        New Chat
                    </button>

                    {history.map((chat) => (
                        <button
                            key={chat.id}
                            onClick={() => loadChat(chat.id)}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-xl transition-all block truncate text-sm",
                                currentChatId === chat.id
                                    ? "bg-slate-800 text-slate-100 shadow-sm"
                                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                            )}
                        >
                            {chat.title || "Untitled Chat"}
                            <span className="block text-xs text-slate-600 mt-1">
                                {new Date(chat.updatedAt).toLocaleDateString()}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full relative">
                {/* Toggle Sidebar Button (Mobile/Desktop) */}
                <button
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className="absolute top-4 left-4 z-10 p-2 bg-slate-800/80 backdrop-blur rounded-lg text-slate-400 hover:text-white border border-slate-700/50 shadow-lg"
                >
                    <Filter className={cn("w-4 h-4 transition-transform", isHistoryOpen ? "rotate-180" : "")} />
                </button>

                <div className="flex-1 overflow-y-auto px-4 py-8 w-full">
                    <div className="w-full max-w-4xl mx-auto space-y-6">
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
                    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
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
        </div>
    );
}
