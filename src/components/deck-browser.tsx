"use client";

import { useState, useEffect } from "react";
import { Book, ChevronRight, ChevronDown, Plus, Play, FileText, Sparkles, Layers, FileStack } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentSelector } from "./document-selector";

interface Deck {
    id: number;
    name: string;
    description: string;
    subdecks: Deck[];
    ownCardCount?: number;
    totalCardCount?: number;
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
    const [hoveredDeckId, setHoveredDeckId] = useState<number | null>(null);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generateDeckId, setGenerateDeckId] = useState<number | null>(null);
    const [generateCount, setGenerateCount] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateTab, setGenerateTab] = useState<"quick" | "advanced">("quick");
    const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
    const [selectedSections, setSelectedSections] = useState<{ documentId: number; sectionIndexes: number[] }[]>([]);

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

    const handleGenerateCards = async () => {
        if (!generateDeckId) return;
        setIsGenerating(true);
        try {
            const res = await fetch("/api/flashcards/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    deckId: generateDeckId,
                    count: generateCount,
                    documentIds: generateTab === "advanced" ? selectedDocs : undefined,
                    sections: generateTab === "advanced" ? selectedSections : undefined,
                }),
            });
            if (res.ok) {
                setShowGenerateModal(false);
                setGenerateDeckId(null);
                fetchDecks(); // Refresh deck list
            }
        } catch (error) {
            console.error("Failed to generate cards", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCreateDeck = async () => {
        if (!newDeckName.trim()) return;
        setIsLoading(true);
        try {
            let res;
            if (parentDeckId) {
                // Create subdeck
                res = await fetch(`/api/decks/${parentDeckId}/subdecks`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: newDeckName,
                        description: newDeckDesc,
                    }),
                });
            } else {
                // Create top-level deck
                res = await fetch("/api/decks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        categoryId,
                        name: newDeckName,
                        description: newDeckDesc,
                    }),
                });
            }
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
                    onMouseEnter={() => setHoveredDeckId(deck.id)}
                    onMouseLeave={() => setHoveredDeckId(null)}
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
                            {deck.ownCardCount !== undefined && (
                                <span className="text-slate-400">
                                    {deck.ownCardCount}
                                    {deck.totalCardCount !== deck.ownCardCount && (
                                        <span className="text-violet-400"> (+{deck.totalCardCount! - deck.ownCardCount})</span>
                                    )}
                                </span>
                            )}
                            {deck.newCount !== undefined && deck.newCount > 0 && (
                                <span className="text-blue-400 font-medium">{deck.newCount} new</span>
                            )}
                            {deck.dueCount !== undefined && deck.dueCount > 0 && (
                                <span className="text-orange-400 font-medium">{deck.dueCount} due</span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {hoveredDeckId === deck.id && (
                                <button
                                    onClick={() => {
                                        setParentDeckId(deck.id);
                                        setShowCreateForm(true);
                                    }}
                                    className="p-2 hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-white"
                                    title="Create subdeck"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            )}
                            {hoveredDeckId === deck.id && (
                                <button
                                    onClick={() => {
                                        setGenerateDeckId(deck.id);
                                        setShowGenerateModal(true);
                                    }}
                                    className="p-2 hover:bg-violet-700 rounded-lg transition-all text-slate-400 hover:text-white"
                                    title="Generate flashcards"
                                >
                                    <Sparkles className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => onStudyDeck(deck.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-violet-600 rounded-lg transition-all text-white"
                            >
                                <Play className="w-4 h-4" />
                            </button>
                        </div>
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
                    <h3 className="font-semibold text-slate-100">
                        {parentDeckId ? "New Subdeck" : "New Deck"}
                    </h3>
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

            {/* Generate Flashcards Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-slate-100 mb-4">Generate Flashcards</h3>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-6 bg-slate-900/50 p-1 rounded-lg">
                            <button
                                onClick={() => setGenerateTab("quick")}
                                className={cn(
                                    "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                                    generateTab === "quick"
                                        ? "bg-violet-600 text-white shadow-lg"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                )}
                            >
                                <Sparkles className="w-4 h-4" />
                                Quick Generate
                            </button>
                            <button
                                onClick={() => setGenerateTab("advanced")}
                                className={cn(
                                    "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                                    generateTab === "advanced"
                                        ? "bg-violet-600 text-white shadow-lg"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                )}
                            >
                                <FileStack className="w-4 h-4" />
                                Advanced Selection
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-sm text-slate-300 mb-2 block font-medium">Number of cards</label>
                                <input
                                    type="number"
                                    value={generateCount}
                                    onChange={(e) => setGenerateCount(parseInt(e.target.value))}
                                    min={1}
                                    max={20}
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Generate between 1 and 20 cards at once.
                                </p>
                            </div>

                            {generateTab === "advanced" && (
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-300 block font-medium">
                                        Select Source Content
                                    </label>
                                    <div className="bg-slate-900/30 border border-slate-700/50 rounded-xl p-4">
                                        <DocumentSelector
                                            categoryId={categoryId}
                                            selectedDocs={selectedDocs}
                                            onSelectDocs={setSelectedDocs}
                                            selectedSections={selectedSections}
                                            onSelectSections={setSelectedSections}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Select specific documents or expand them to select individual sections.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleGenerateCards}
                                    disabled={isGenerating || (generateTab === "advanced" && selectedDocs.length === 0)}
                                    className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-4 py-3 rounded-xl font-medium transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Generate Cards
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowGenerateModal(false)}
                                    disabled={isGenerating}
                                    className="px-6 py-3 text-slate-400 hover:text-slate-200 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
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
