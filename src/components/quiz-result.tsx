"use client";

import { CheckCircle, XCircle, ArrowLeft, Trophy, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultDetail {
    questionId: number;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
}

interface QuizResultProps {
    result: {
        score: number;
        totalQuestions: number;
        percentage: number;
        results: ResultDetail[];
    };
    onExit: () => void;
}

export function QuizResult({ result, onExit }: QuizResultProps) {
    const { score, totalQuestions, percentage, results } = result;
    const isPass = percentage >= 70;

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Score Card */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center relative overflow-hidden">
                <div className={cn(
                    "absolute top-0 left-0 w-full h-2",
                    isPass ? "bg-emerald-500" : "bg-red-500"
                )} />

                <div className="mb-6">
                    <div className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4",
                        isPass ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" : "bg-red-500/10 border-red-500 text-red-500"
                    )}>
                        {isPass ? <Trophy className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                    </div>
                    <h2 className="text-3xl font-bold text-slate-100 mb-2">
                        {isPass ? "Excellent Job!" : "Keep Practicing!"}
                    </h2>
                    <p className="text-slate-400">
                        You scored <span className="text-slate-100 font-bold">{score}</span> out of <span className="text-slate-100 font-bold">{totalQuestions}</span>
                    </p>
                </div>

                <div className="text-5xl font-bold text-slate-100 mb-8">
                    {percentage}%
                </div>

                <button
                    onClick={onExit}
                    className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors inline-flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </button>
            </div>

            {/* Detailed Review */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-100">Detailed Review</h3>

                {results.map((item, idx) => (
                    <div
                        key={item.questionId}
                        className={cn(
                            "bg-slate-800/50 border rounded-xl p-6 transition-all",
                            item.isCorrect ? "border-emerald-500/30" : "border-red-500/30"
                        )}
                    >
                        <div className="flex items-start gap-4 mb-4">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                                item.isCorrect ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                            )}>
                                {item.isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            </div>
                            <div>
                                <span className="text-xs font-mono text-slate-500 mb-1 block">Question {idx + 1}</span>
                                <p className="text-slate-200 font-medium">
                                    {/* Ideally we'd have the question text here, but for now we rely on context or fetch it if needed. 
                                       Since the result object from API doesn't include question text, we might want to update the API 
                                       or pass questions from the parent. For simplicity, we'll show the explanation which usually gives context. */}
                                    Review your answer:
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pl-12">
                            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                <span className="text-xs text-slate-500 block mb-1">Your Answer</span>
                                <p className={cn(
                                    "font-medium",
                                    item.isCorrect ? "text-emerald-400" : "text-red-400"
                                )}>
                                    {item.userAnswer || "(No answer)"}
                                </p>
                            </div>
                            {!item.isCorrect && (
                                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                    <span className="text-xs text-slate-500 block mb-1">Correct Answer</span>
                                    <p className="text-emerald-400 font-medium">
                                        {item.correctAnswer}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="pl-12">
                            <div className="bg-violet-500/5 border border-violet-500/10 rounded-lg p-4">
                                <span className="text-xs font-bold text-violet-400 uppercase tracking-wider block mb-2">Explanation</span>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    {item.explanation}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
