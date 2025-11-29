"use client";

import { useState, useEffect } from "react";
import { DeckBrowser } from "./deck-browser";
import { DeckStudySession } from "./deck-study-session";
import { Sparkles, Loader2 } from "lucide-react";

interface Category {
    id: number;
    name: string;
    description: string;
}

export function FlashcardManager() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [studyingDeckId, setStudyingDeckId] = useState<number | null>(null);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generateCount, setGenerateCount] = useState(10);
    const [isGenerating, setIsGenerating] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            if (data.categories) {
                setCategories(data.categories);
                if (data.categories.length > 0 && !selectedCategory) {
                    setSelectedCategory(data.categories[0].id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    const handleGenerateCards = async (deckId: number) => {
        setIsGenerating(true);
        try {
            const res = await fetch("/api/flashcards/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    deckId,
                    count: generateCount,
                }),
            });
            if (res.ok) {
                setShowGenerateModal(false);
                // Refresh the deck browser
            }
        } catch (error) {
            console.error("Failed to generate cards", error);
        } finally {
            setIsGenerating(false);
        }
    };

    if (studyingDeckId) {
        return (
            <DeckStudySession
                deckId={studyingDeckId}
                onBack={() => {
                    setStudyingDeckId(null);
                    setRefreshTrigger(prev => prev + 1); // Refresh decks when returning from study
                }}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Knowledge Base Selector */}
            <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-300">Knowledge Base:</label>
                <select
                    value={selectedCategory || ""}
                    onChange={(e) => setSelectedCategory(parseInt(e.target.value))}
                    className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500"
                >
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            {selectedCategory && (
                <DeckBrowser
                    categoryId={selectedCategory}
                    onStudyDeck={(deckId) => setStudyingDeckId(deckId)}
                    refreshTrigger={refreshTrigger}
                />
            )}

            {/* Generate Cards Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-slate-100 mb-4">Generate Flashcards</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-slate-300 mb-2 block">Number of cards</label>
                                <input
                                    type="number"
                                    value={generateCount}
                                    onChange={(e) => setGenerateCount(parseInt(e.target.value))}
                                    min={1}
                                    max={50}
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleGenerateCards(0)} // TODO: Pass actual deckId
                                    disabled={isGenerating}
                                    className="flex-1 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isGenerating ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                    Generate
                                </button>
                                <button
                                    onClick={() => setShowGenerateModal(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
