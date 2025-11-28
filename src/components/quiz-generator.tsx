"use client";

import { useState, useEffect } from "react";
import { Loader2, Brain, AlertCircle } from "lucide-react";

interface Category {
    id: number;
    name: string;
}

interface QuizGeneratorProps {
    onCancel: () => void;
    onSuccess: () => void;
}

export function QuizGenerator({ onCancel, onSuccess }: QuizGeneratorProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
    const [questionCount, setQuestionCount] = useState<5 | 10 | 20>(10);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const handleGenerate = async () => {
        if (!selectedCategory) {
            setError("Please select a category");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const res = await fetch("/api/quizzes/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    categoryId: selectedCategory,
                    difficulty,
                    questionCount,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to generate quiz");
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-100">Generate New Quiz</h2>
                    <p className="text-sm text-slate-400">AI will create a custom exam from your knowledge base</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <p>{error}</p>
                </div>
            )}

            <div className="space-y-6">
                {/* Category Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Select Category</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`p-3 rounded-xl border text-left transition-all ${selectedCategory === category.id
                                        ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20"
                                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                                    }`}
                            >
                                <span className="block font-medium truncate">{category.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Difficulty Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty Level</label>
                    <div className="flex gap-3">
                        {(["easy", "medium", "hard"] as const).map((level) => (
                            <button
                                key={level}
                                onClick={() => setDifficulty(level)}
                                className={`flex-1 p-3 rounded-xl border capitalize transition-all ${difficulty === level
                                        ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20"
                                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Question Count */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Number of Questions</label>
                    <div className="flex gap-3">
                        {([5, 10, 20] as const).map((count) => (
                            <button
                                key={count}
                                onClick={() => setQuestionCount(count)}
                                className={`flex-1 p-3 rounded-xl border transition-all ${questionCount === count
                                        ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20"
                                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                                    }`}
                            >
                                {count} Questions
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Estimated time: {questionCount * 2} minutes
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <button
                        onClick={onCancel}
                        disabled={isGenerating}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !selectedCategory}
                        className="flex-[2] py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating Quiz...
                            </>
                        ) : (
                            "Generate Quiz"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
