"use client";

import { useState, useEffect } from "react";
import { Zap, BookOpen, Loader2, RotateCw, Check, X, Brain, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
    id: number;
    name: string;
    description: string;
    color: string;
}

interface Flashcard {
    id: number;
    front: string;
    back: string;
    nextReviewAt: string;
    interval: number;
    easeFactor: number;
    repetitions: number;
}

export function FlashcardManager() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeMode, setActiveMode] = useState<"dashboard" | "study">("dashboard");
    const [studyDeck, setStudyDeck] = useState<Flashcard[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [generatingFor, setGeneratingFor] = useState<number | null>(null);
    const [studyStats, setStudyStats] = useState({ reviewed: 0, correct: 0 });

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

    const startStudy = async (categoryId: number) => {
        setIsLoading(true);
        try {
            // Fetch all flashcards for this category (not just due ones)
            const res = await fetch(`/api/flashcards?categoryId=${categoryId}`);
            const data = await res.json();
            console.log("Start study API response:", { status: res.status, data });

            if (data.flashcards && data.flashcards.length > 0) {
                setStudyDeck(data.flashcards);
                setCurrentCardIndex(0);
                setIsFlipped(false);
                setStudyStats({ reviewed: 0, correct: 0 });
                setActiveMode("study");
            } else {
                alert("No flashcards found in this category! Generate some first.");
            }
        } catch (error) {
            console.error("Failed to fetch flashcards", error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateCards = async (categoryId: number) => {
        setGeneratingFor(categoryId);
        try {
            const res = await fetch("/api/flashcards/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ categoryId }),
            });

            const data = await res.json();
            console.log("Generate flashcards API response:", { status: res.status, data });

            if (!res.ok) {
                alert(`Generation failed: ${data.error || res.statusText}`);
                throw new Error("Generation failed");
            }

            alert(`Flashcards generated successfully! Created ${data.flashcards?.length || 0} cards.`);
        } catch (error) {
            console.error("Failed to generate cards", error);
            alert("Failed to generate cards. Make sure you have documents in this category.");
        } finally {
            setGeneratingFor(null);
        }
    };

    const handleRating = async (quality: number) => {
        const currentCard = studyDeck[currentCardIndex];

        // Optimistic update
        const nextIndex = currentCardIndex + 1;

        try {
            await fetch("/api/flashcards/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ flashcardId: currentCard.id, quality }),
            });

            setStudyStats(prev => ({
                reviewed: prev.reviewed + 1,
                correct: quality >= 3 ? prev.correct + 1 : prev.correct
            }));

            if (nextIndex < studyDeck.length) {
                setIsFlipped(false);
                setCurrentCardIndex(nextIndex);
            } else {
                // End of session
                alert(`Session complete! Reviewed ${studyDeck.length} cards.`);
                setActiveMode("dashboard");
            }
        } catch (error) {
            console.error("Failed to submit review", error);
        }
    };

    if (activeMode === "study") {
        const currentCard = studyDeck[currentCardIndex];
        const progress = ((currentCardIndex) / studyDeck.length) * 100;

        return (
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex items-center justify-between text-slate-400">
                    <button
                        onClick={() => setActiveMode("dashboard")}
                        className="hover:text-slate-200 transition-colors"
                    >
                        ← Back to Dashboard
                    </button>
                    <span>{currentCardIndex + 1} / {studyDeck.length}</span>
                </div>

                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-violet-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div
                    className="min-h-[400px] perspective-1000 cursor-pointer group"
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <div className={cn(
                        "relative w-full h-full transition-all duration-500 transform-style-3d",
                        isFlipped ? "rotate-y-180" : ""
                    )}>
                        {/* Front */}
                        <div className="absolute w-full h-full backface-hidden">
                            <div className="h-full bg-slate-800 border border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xl group-hover:border-violet-500/50 transition-colors">
                                <span className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-4">Question</span>
                                <h3 className="text-2xl font-medium text-slate-100">{currentCard.front}</h3>
                                <p className="text-sm text-slate-500 mt-8">Click to flip</p>
                            </div>
                        </div>

                        {/* Back */}
                        <div className="absolute w-full h-full backface-hidden rotate-y-180">
                            <div className="h-full bg-slate-800 border border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xl">
                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4">Answer</span>
                                <p className="text-xl text-slate-200 leading-relaxed">{currentCard.back}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {isFlipped ? (
                    <div className="grid grid-cols-4 gap-4">
                        <button
                            onClick={() => handleRating(0)}
                            className="p-4 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all font-medium"
                        >
                            Again
                        </button>
                        <button
                            onClick={() => handleRating(3)}
                            className="p-4 rounded-xl bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 transition-all font-medium"
                        >
                            Hard
                        </button>
                        <button
                            onClick={() => handleRating(4)}
                            className="p-4 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all font-medium"
                        >
                            Good
                        </button>
                        <button
                            onClick={() => handleRating(5)}
                            className="p-4 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all font-medium"
                        >
                            Easy
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <button
                            onClick={() => setIsFlipped(true)}
                            className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-violet-500/25"
                        >
                            Show Answer
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
                <div key={category.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-violet-500/50 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                            <Brain className="w-6 h-6 text-violet-400" />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => generateCards(category.id)}
                                disabled={generatingFor === category.id}
                                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                                title="Generate Cards"
                            >
                                {generatingFor === category.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Zap className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-100 mb-2">{category.name}</h3>
                    <p className="text-sm text-slate-400 mb-6 line-clamp-2">{category.description}</p>

                    <button
                        onClick={() => startStudy(category.id)}
                        disabled={isLoading}
                        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 group-hover:bg-violet-600 group-hover:hover:bg-violet-500"
                    >
                        <BookOpen className="w-4 h-4" />
                        Study Now
                    </button>
                </div>
            ))}

            {categories.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500">
                    <p>No categories found. Create a category in the Knowledge Base to get started.</p>
                </div>
            )}
        </div>
    );
}
