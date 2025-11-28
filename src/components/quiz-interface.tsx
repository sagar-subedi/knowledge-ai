"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Clock, ChevronRight, ChevronLeft, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
    id: number;
    text: string;
    options: string[];
}

interface Quiz {
    id: number;
    title: string;
    timeLimit: number;
    questionCount: number;
}

interface QuizInterfaceProps {
    quizId: number;
    onComplete: (result: any) => void;
    onExit: () => void;
}

export function QuizInterface({ quizId, onComplete, onExit }: QuizInterfaceProps) {
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchQuizData();
    }, [quizId]);

    useEffect(() => {
        if (!timeLeft || isSubmitting) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(); // Auto-submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isSubmitting]);

    const fetchQuizData = async () => {
        try {
            const res = await fetch(`/api/quizzes/${quizId}`);
            const data = await res.json();

            if (data.quiz && data.questions) {
                setQuiz(data.quiz);
                setQuestions(data.questions);
                setTimeLeft(data.quiz.timeLimit * 60); // Convert minutes to seconds
            }
        } catch (error) {
            console.error("Failed to fetch quiz", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerSelect = (option: string) => {
        const questionId = questions[currentQuestionIndex].id;
        setAnswers(prev => ({
            ...prev,
            [questionId]: option
        }));
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
                questionId: parseInt(qId),
                answer: ans
            }));

            const res = await fetch(`/api/quizzes/${quizId}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers: formattedAnswers }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error);

            onComplete(result);
        } catch (error) {
            console.error("Failed to submit quiz", error);
            alert("Failed to submit quiz. Please try again.");
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-4" />
                <p className="text-slate-400">Loading quiz...</p>
            </div>
        );
    }

    if (!quiz || questions.length === 0) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-100 mb-2">Failed to load quiz</h3>
                <button onClick={onExit} className="text-violet-400 hover:text-violet-300">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                <div>
                    <h2 className="font-bold text-slate-100">{quiz.title}</h2>
                    <p className="text-sm text-slate-400">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </p>
                </div>
                <div className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-medium",
                    timeLeft < 60 ? "bg-red-500/10 text-red-400" : "bg-slate-700/50 text-slate-300"
                )}>
                    <Clock className="w-4 h-4" />
                    {formatTime(timeLeft)}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-slate-800 rounded-full mb-8 overflow-hidden">
                <div
                    className="h-full bg-violet-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Question Card */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 mb-8">
                <h3 className="text-xl font-medium text-slate-100 mb-8 leading-relaxed">
                    {currentQuestion.text}
                </h3>

                <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => {
                        const isSelected = answers[currentQuestion.id] === option;
                        return (
                            <button
                                key={idx}
                                onClick={() => handleAnswerSelect(option)}
                                className={cn(
                                    "w-full p-4 rounded-xl text-left transition-all border flex items-center justify-between group",
                                    isSelected
                                        ? "bg-violet-600/10 border-violet-500 text-violet-100"
                                        : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:border-slate-600"
                                )}
                            >
                                <span className="flex items-center gap-3">
                                    <span className={cn(
                                        "w-6 h-6 rounded-full border flex items-center justify-center text-xs",
                                        isSelected ? "border-violet-500 bg-violet-500 text-white" : "border-slate-600 text-slate-500"
                                    )}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    {option}
                                </span>
                                {isSelected && <CheckCircle className="w-5 h-5 text-violet-500" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
                <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-2 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </button>

                {isLastQuestion ? (
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                Submit Exam
                                <span className="text-xs opacity-75 ml-1">({answeredCount}/{questions.length})</span>
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
