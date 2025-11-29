"use client";

import { useState, useEffect } from "react";
import { Book, ChevronRight, ChevronDown, Plus, Play, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Deck {
    id: number;
    name: string;
    description: string;
    subdecks: Deck[];
    cardCount?: number;
    newCount?: number;
    dueCount?: number;
}

interface DeckBrowserProps {
    categoryId: number;
    onStudyDeck: (deckId: number) => void;
    refreshTrigger?: number; // Add this to force refresh
}

export function DeckBrowser({ categoryId, onStudyDeck, refreshTrigger }: DeckBrowserProps) {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [expandedDecks, setExpandedDecks] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [newDeckName, setNewDeckName] = useState("");
    const [newDeckDesc, setNewDeckDesc] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [parentDeckId, setParentDeckId] = useState<number | null>(null);

    useEffect(() => {
        if (categoryId) {
            fetchDecks();
        }
    }, [categoryId, refreshTrigger]);

    const fetchDecks = async () => {
        try {
            const res = await fetch(`/api/decks?categoryId=${categoryId}`);
            const data = await res.json();
            if (data.decks) setDecks(data.decks);
        } catch (error) {
            console.error("Failed to fetch decks", error);
        }
    };

    const handleCreateDeck = async () => {
        if (!newDeckName.trim()) return;
        setIsLoading(true);
        try {
            const res = await fetch("/api/decks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    categoryId,
                    parentDeckId,
                    name: newDeckName,
                    description: newDeckDesc,
                }),
            });
            if (res.ok) {
                setNewDeckName("");
                setNewDeckDesc("");
                setShowCreateForm(false);
                setParentDeckId(null);
                fetchDecks();
            }
        } catch (error) {
            console.error("Failed to create deck", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpand = (deckId: number) => {
        const newExpanded = new Set(expandedDecks);
        if (newExpanded.has(deckId)) {
            newExpanded.delete(deckId);
        } else {
            newExpanded.add(deckId);
        }
        setExpandedDecks(newExpanded);
    };

    const renderDeck = (deck: Deck, level: number = 0) => {
        const hasSubdecks = deck.subdecks && deck.subdecks.length > 0;
        const isExpanded = expandedDecks.has(deck.id);

        return (
            <div key={deck.id} className="space-y-1">
                <div
                    className={cn(
                        "group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors",
                        level > 0 && "ml-6"
                    )}
                >
                    {hasSubdecks && (
                        <button
                            onClick={() => toggleExpand(deck.id)}
                            className="p-1 hover:bg-slate-700 rounded"
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                        </button>
                    )}
                    {!hasSubdecks && <div className="w-6" />}

                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                        <Book className="w-4 h-4 text-violet-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-100 truncate">{deck.name}</h3>
                        {deck.description && (
                            <p className="text-xs text-slate-500 truncate">{deck.description}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex gap-3">
                            {deck.newCount !== undefined && deck.newCount > 0 && (
                                <span className="text-blue-400 font-medium">{deck.newCount} new</span>
                            )}
                            {deck.dueCount !== undefined && deck.dueCount > 0 && (
                                <span className="text-orange-400 font-medium">{deck.dueCount} due</span>
                            )}
                        </div>
                        <button
                            onClick={() => onStudyDeck(deck.id)}
                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-violet-600 rounded-lg transition-all text-white"
                        >
                            <Play className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {hasSubdecks && isExpanded && (
                    <div className="space-y-1">
                        {deck.subdecks.map(subdeck => renderDeck(subdeck, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-100">Decks</h2>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create Deck
                </button>
            </div>

            {showCreateForm && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold text-slate-100">New Deck</h3>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={newDeckName}
                            onChange={(e) => setNewDeckName(e.target.value)}
                            placeholder="Deck name"
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500"
                        />
                        <textarea
                            value={newDeckDesc}
                            onChange={(e) => setNewDeckDesc(e.target.value)}
                            placeholder="Description (optional)"
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500 h-20 resize-none"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={handleCreateDeck}
                                disabled={isLoading || !newDeckName.trim()}
                                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setNewDeckName("");
                                    setNewDeckDesc("");
                                }}
                                className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {decks.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No decks yet. Create your first deck to get started!</p>
                    </div>
                ) : (
                    decks.map(deck => renderDeck(deck))
                )}
            </div>
        </div>
    );
}
