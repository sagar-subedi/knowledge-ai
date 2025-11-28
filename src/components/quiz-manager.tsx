"use client";

import { useState, useEffect } from "react";
import { Plus, Clock, Trophy, ArrowRight, Loader2, History } from "lucide-react";
import { QuizGenerator } from "./quiz-generator";
import { QuizInterface } from "./quiz-interface";
import { QuizResult } from "./quiz-result";

interface Quiz {
    id: number;
    title: string;
    description: string;
    difficulty: string;
    questionCount: number;
    timeLimit: number;
    createdAt: string;
    categoryName: string;
    color: string;
    attempts: number;
    bestScore: number | null;
    latestAttemptDate: string | null;
}

export function QuizManager() {
    const [view, setView] = useState<"dashboard" | "generator" | "active" | "result">("dashboard");
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
    const [resultData, setResultData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (view === "dashboard") {
            fetchQuizzes();
        }
    }, [view]);

    const fetchQuizzes = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/quizzes");
            const data = await res.json();
            if (data.quizzes) setQuizzes(data.quizzes);
        } catch (error) {
            console.error("Failed to fetch quizzes", error);
        } finally {
            setIsLoading(false);
        }
    };

    const startQuiz = (quizId: number) => {
        setActiveQuizId(quizId);
        setView("active");
    };

    const handleQuizComplete = (result: any) => {
        setResultData(result);
        setView("result");
    };

    if (view === "generator") {
        return (
            <QuizGenerator
                onCancel={() => setView("dashboard")}
                onSuccess={() => setView("dashboard")}
            />
        );
    }

    if (view === "active" && activeQuizId) {
        return (
            <QuizInterface
                quizId={activeQuizId}
                onComplete={handleQuizComplete}
                onExit={() => setView("dashboard")}
            />
        );
    }

    if (view === "result" && resultData) {
        return (
            <QuizResult
                result={resultData}
                onExit={() => setView("dashboard")}
            />
        );
    }

    return (
        <div className="space-y-8">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-200">Your Quizzes</h2>
                <button
                    onClick={() => setView("generator")}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create New Quiz
                </button>
            </div>

            {/* Quiz Grid */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                </div>
            ) : quizzes.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                    <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <History className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-300 mb-2">No quizzes yet</h3>
                    <p className="text-slate-500 mb-6">Generate your first AI-powered quiz to get started!</p>
                    <button
                        onClick={() => setView("generator")}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                        Generate Quiz
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map((quiz) => (
                        <div key={quiz.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-violet-500/30 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${quiz.color || 'blue'}-500/10 text-${quiz.color || 'blue'}-400`}>
                                    {quiz.categoryName}
                                </span>
                                <span className={`text-xs font-medium px-2 py-1 rounded border ${quiz.difficulty === 'hard' ? 'border-red-500/30 text-red-400' :
                                        quiz.difficulty === 'medium' ? 'border-orange-500/30 text-orange-400' :
                                            'border-emerald-500/30 text-emerald-400'
                                    }`}>
                                    {quiz.difficulty.toUpperCase()}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-violet-400 transition-colors">
                                {quiz.title}
                            </h3>
                            <p className="text-sm text-slate-400 mb-6 line-clamp-2">
                                {quiz.description}
                            </p>

                            <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {quiz.timeLimit}m
                                </div>
                                <div className="flex items-center gap-1">
                                    <Trophy className="w-4 h-4" />
                                    {quiz.bestScore !== null ? `${Math.round((quiz.bestScore / quiz.questionCount) * 100)}%` : '--'}
                                </div>
                                <div className="flex items-center gap-1">
                                    <History className="w-4 h-4" />
                                    {quiz.attempts} attempts
                                </div>
                            </div>

                            <button
                                onClick={() => startQuiz(quiz.id)}
                                className="w-full py-2.5 bg-slate-700 hover:bg-violet-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-violet-500/20"
                            >
                                {quiz.attempts > 0 ? 'Retake Quiz' : 'Start Quiz'}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
