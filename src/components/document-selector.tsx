"use client";

import { useState, useEffect } from "react";
import { Check, ChevronRight, ChevronDown, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TOCSection {
    title: string;
    level: number;
    startChar: number;
    endChar: number;
}

interface Document {
    id: number;
    metadata: {
        filename: string;
    };
    toc: TOCSection[] | null;
}

interface DocumentSelectorProps {
    categoryId: number;
    selectedDocs: number[];
    onSelectDocs: (docIds: number[]) => void;
    selectedSections: { documentId: number; sectionIndexes: number[] }[];
    onSelectSections: (sections: { documentId: number; sectionIndexes: number[] }[]) => void;
}

export function DocumentSelector({
    categoryId,
    selectedDocs,
    onSelectDocs,
    selectedSections,
    onSelectSections
}: DocumentSelectorProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedDocs, setExpandedDocs] = useState<number[]>([]);

    useEffect(() => {
        fetchDocuments();
    }, [categoryId]);

    const fetchDocuments = async () => {
        try {
            const res = await fetch(`/api/documents?categoryId=${categoryId}`);
            const data = await res.json();
            if (data.documents) {
                setDocuments(data.documents);
                // Select all docs by default
                onSelectDocs(data.documents.map((d: Document) => d.id));
            }
        } catch (error) {
            console.error("Failed to fetch documents", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleDocExpansion = (docId: number) => {
        setExpandedDocs(prev =>
            prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        );
    };

    const handleDocSelect = (docId: number) => {
        if (selectedDocs.includes(docId)) {
            onSelectDocs(selectedDocs.filter(id => id !== docId));
            // Also remove any selected sections for this doc
            onSelectSections(selectedSections.filter(s => s.documentId !== docId));
        } else {
            onSelectDocs([...selectedDocs, docId]);
        }
    };

    const handleSectionSelect = (docId: number, sectionIndex: number) => {
        const existingDocSections = selectedSections.find(s => s.documentId === docId);

        if (existingDocSections) {
            const newIndexes = existingDocSections.sectionIndexes.includes(sectionIndex)
                ? existingDocSections.sectionIndexes.filter(i => i !== sectionIndex)
                : [...existingDocSections.sectionIndexes, sectionIndex];

            if (newIndexes.length === 0) {
                onSelectSections(selectedSections.filter(s => s.documentId !== docId));
            } else {
                onSelectSections(selectedSections.map(s =>
                    s.documentId === docId ? { ...s, sectionIndexes: newIndexes } : s
                ));
            }
        } else {
            onSelectSections([...selectedSections, { documentId: docId, sectionIndexes: [sectionIndex] }]);
        }

        // Ensure parent doc is selected
        if (!selectedDocs.includes(docId)) {
            onSelectDocs([...selectedDocs, docId]);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400">
                No documents found in this knowledge base.
            </div>
        );
    }

    return (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {documents.map(doc => {
                const isSelected = selectedDocs.includes(doc.id);
                const isExpanded = expandedDocs.includes(doc.id);
                const hasToc = doc.toc && doc.toc.length > 0;
                const docSections = selectedSections.find(s => s.documentId === doc.id)?.sectionIndexes || [];

                return (
                    <div key={doc.id} className="bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden">
                        <div className="flex items-center p-3 gap-3 hover:bg-slate-800/50 transition-colors">
                            <button
                                onClick={() => handleDocSelect(doc.id)}
                                className={cn(
                                    "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                    isSelected
                                        ? "bg-violet-600 border-violet-600 text-white"
                                        : "border-slate-600 hover:border-slate-500"
                                )}
                            >
                                {isSelected && <Check className="w-3 h-3" />}
                            </button>

                            <div className="flex-1 flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <span className="text-sm text-slate-200 truncate font-medium">
                                    {doc.metadata.filename}
                                </span>
                            </div>

                            {hasToc && (
                                <button
                                    onClick={() => toggleDocExpansion(doc.id)}
                                    className="p-1 hover:bg-slate-700 rounded text-slate-400"
                                >
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                            )}
                        </div>

                        {/* TOC Sections */}
                        {isExpanded && hasToc && (
                            <div className="border-t border-slate-700/50 bg-slate-900/30 p-2 space-y-1">
                                {doc.toc!.map((section, idx) => {
                                    const isSectionSelected = docSections.includes(idx);
                                    return (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-3 py-1.5 px-2 hover:bg-slate-800/50 rounded cursor-pointer group"
                                            style={{ paddingLeft: `${(section.level - 1) * 12 + 8}px` }}
                                            onClick={() => handleSectionSelect(doc.id, idx)}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                                                isSectionSelected
                                                    ? "bg-violet-500/80 border-violet-500/80 text-white"
                                                    : "border-slate-700 group-hover:border-slate-600"
                                            )}>
                                                {isSectionSelected && <Check className="w-2.5 h-2.5" />}
                                            </div>
                                            <span className="text-xs text-slate-300 truncate">
                                                {section.title}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
