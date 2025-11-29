"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, RotateCcw, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Flashcard {
    id: number;
    front: string;
    back: string;
    interval: number;
    easeFactor: number;
    repetitions: number;
}

interface StudySession {
    id: number;
    cardsReviewed: number;
    cardsTotal: number;
}

interface DeckStudySessionProps {
    deckId: number;
    onBack: () => void;
}

export function DeckStudySession({ deckId, onBack }: DeckStudySessionProps) {
    const [session, setSession] = useState<StudySession | null>(null);
    const [newCards, setNewCards] = useState<Flashcard[]>([]);
    const [dueCards, setDueCards] = useState<Flashcard[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reviewStartTime, setReviewStartTime] = useState<number>(Date.now());

    const allCards = [...newCards, ...dueCards];
    const currentCard = allCards[currentCardIndex];
    const cardsRemaining = allCards.length - currentCardIndex;

    useEffect(() => {
        fetchStudySession();
    }, [deckId]);

    const fetchStudySession = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/decks/${deckId}/study`);
            const data = await res.json();

            if (data.session) setSession(data.session);
            if (data.newCards) setNewCards(data.newCards);
            if (data.dueCards) setDueCards(data.dueCards);
        } catch (error) {
            console.error("Failed to fetch study session", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRating = async (rating: 1 | 2 | 3 | 4) => {
        if (!currentCard || isSubmitting) return;

        setIsSubmitting(true);
        const timeTaken = Date.now() - reviewStartTime;

        try {
            const res = await fetch(`/api/decks/${deckId}/study`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cardId: currentCard.id,
                    rating,
                    timeTakenMs: timeTaken,
                }),
            });

            if (res.ok) {
                // Move to next card
                if (currentCardIndex < allCards.length - 1) {
                    setCurrentCardIndex(currentCardIndex + 1);
                    setIsFlipped(false);
                    setReviewStartTime(Date.now());
                } else {
                    // Session complete
                    setSession(null);
                }
            }
        } catch (error) {
            console.error("Failed to submit review", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
            </div>
        );
    }

    if (allCards.length === 0) {
        return (
            <div className="text-center py-12 space-y-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-100 mb-2">All Done!</h3>
                    <p className="text-slate-400">No cards due for review right now.</p>
                </div>
                <button
                    onClick={onBack}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors"
                >
                    Back to Decks
                </button>
            </div>
        );
    }

    if (!currentCard) {
        return (
            <div className="text-center py-12 space-y-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-100 mb-2">Session Complete!</h3>
                    <p className="text-slate-400">You've reviewed all cards in this session.</p>
                </div>
                <button
                    onClick={onBack}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors"
                >
                    Back to Decks
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                <div className="text-sm text-slate-400">
                    {cardsRemaining} card{cardsRemaining !== 1 ? 's' : ''} remaining
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
                    style={{ width: `${((currentCardIndex) / allCards.length) * 100}%` }}
                />
            </div>

            {/* Card */}
            <div
                onClick={() => !isFlipped && setIsFlipped(true)}
                className={cn(
                    "relative min-h-[400px] cursor-pointer perspective-1000",
                    !isFlipped && "hover:scale-[1.02]"
                )}
            >
                <div
                    className={cn(
                        "w-full h-full transition-transform duration-500 transform-style-3d",
                        isFlipped && "rotate-y-180"
                    )}
                >
                    {/* Front */}
                    <div className={cn(
                        "absolute inset-0 backface-hidden bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl p-12 flex flex-col items-center justify-center",
                        !isFlipped ? "block" : "hidden"
                    )}>
                        <div className="text-center space-y-4">
                            <p className="text-sm text-slate-500 uppercase tracking-wide">Question</p>
                            <p className="text-2xl text-slate-100 leading-relaxed whitespace-pre-wrap">
                                {currentCard.front}
                            </p>
                        </div>
                        <p className="absolute bottom-6 text-sm text-slate-500">Click to reveal answer</p>
                    </div>

                    {/* Back */}
                    <div className={cn(
                        "absolute inset-0 backface-hidden bg-gradient-to-br from-violet-900/30 to-fuchsia-900/30 border-2 border-violet-500/50 rounded-2xl p-12 flex flex-col items-center justify-center",
                        isFlipped ? "block" : "hidden"
                    )}>
                        <div className="text-center space-y-4">
                            <p className="text-sm text-violet-400 uppercase tracking-wide">Answer</p>
                            <p className="text-2xl text-slate-100 leading-relaxed whitespace-pre-wrap">
                                {currentCard.back}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rating Buttons */}
            {isFlipped && (
                <div className="grid grid-cols-4 gap-4 animate-in fade-in-0 slide-in-from-bottom-4">
                    <button
                        onClick={() => handleRating(1)}
                        disabled={isSubmitting}
                        className="flex flex-col items-center gap-2 p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-all disabled:opacity-50"
                    >
                        <RotateCcw className="w-5 h-5 text-red-400" />
                        <span className="text-sm font-medium text-red-400">Again</span>
                        <span className="text-xs text-slate-500">&lt;1 min</span>
                    </button>
                    <button
                        onClick={() => handleRating(2)}
                        disabled={isSubmitting}
                        className="flex flex-col items-center gap-2 p-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-xl transition-all disabled:opacity-50"
                    >
                        <span className="text-lg">😕</span>
                        <span className="text-sm font-medium text-orange-400">Hard</span>
                        <span className="text-xs text-slate-500">&lt;6 min</span>
                    </button>
                    <button
                        onClick={() => handleRating(3)}
                        disabled={isSubmitting}
                        className="flex flex-col items-center gap-2 p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all disabled:opacity-50"
                    >
                        <span className="text-lg">🙂</span>
                        <span className="text-sm font-medium text-emerald-400">Good</span>
                        <span className="text-xs text-slate-500">&lt;10 min</span>
                    </button>
                    <button
                        onClick={() => handleRating(4)}
                        disabled={isSubmitting}
                        className="flex flex-col items-center gap-2 p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl transition-all disabled:opacity-50"
                    >
                        <span className="text-lg">😄</span>
                        <span className="text-sm font-medium text-blue-400">Easy</span>
                        <span className="text-xs text-slate-500">4 days</span>
                    </button>
                </div>
            )}
        </div>
    );
}
