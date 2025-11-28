"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, Loader2, CheckCircle2, XCircle, Clock, Folder, Plus, Trash2, ArrowLeft, Book, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadStatus {
    filename: string;
    status: "uploading" | "success" | "error";
    message?: string;
}

interface Category {
    id: number;
    name: string;
    description: string;
    color: string;
    createdAt: string;
    documentCount?: number; // Optional, if we add this to API later
}

interface Document {
    id: number;
    content: string;
    metadata: Record<string, unknown>;
    createdAt: string;
    categoryId: number | null;
}

export function KnowledgeManager() {
    // View State
    const [view, setView] = useState<"list" | "create" | "details">("list");
    const [selectedKb, setSelectedKb] = useState<Category | null>(null);
    const [detailsTab, setDetailsTab] = useState<"documents" | "upload">("documents");

    // Data State
    const [categories, setCategories] = useState<Category[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [uploads, setUploads] = useState<UploadStatus[]>([]);

    // UI State
    const [isDragging, setIsDragging] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryDesc, setNewCategoryDesc] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
        fetchDocuments(); // We fetch all for now, filter client-side or update API later
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

    const fetchDocuments = async () => {
        try {
            const res = await fetch("/api/documents");
            const data = await res.json();
            if (data.documents) setDocuments(data.documents);
        } catch (error) {
            console.error("Failed to fetch documents", error);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        setIsLoading(true);
        try {
            const res = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newCategoryName,
                    description: newCategoryDesc || "No description"
                }),
            });
            if (res.ok) {
                setNewCategoryName("");
                setNewCategoryDesc("");
                fetchCategories();
                setView("list");
            }
        } catch (error) {
            console.error("Failed to create category", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0 || !selectedKb) return;

        const fileArray = Array.from(files);

        for (const file of fileArray) {
            const uploadStatus: UploadStatus = {
                filename: file.name,
                status: "uploading",
            };

            setUploads((prev) => [...prev, uploadStatus]);

            try {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("categoryId", selectedKb.id.toString());

                const response = await fetch("/api/ingest", {
                    method: "POST",
                    body: formData,
                });

                const data = await response.json();

                setUploads((prev) =>
                    prev.map((u) =>
                        u.filename === file.name && u.status === "uploading"
                            ? {
                                ...u,
                                status: response.ok ? "success" : "error",
                                message: response.ok
                                    ? "Successfully indexed"
                                    : data.error || "Upload failed",
                            }
                            : u
                    )
                );

                if (response.ok) {
                    fetchDocuments(); // Refresh list
                }
            } catch (error) {
                setUploads((prev) =>
                    prev.map((u) =>
                        u.filename === file.name && u.status === "uploading"
                            ? { ...u, status: "error", message: "Network error" }
                            : u
                    )
                );
            }
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const filteredDocuments = selectedKb
        ? documents.filter(doc => doc.categoryId === selectedKb.id)
        : [];

    // --- VIEWS ---

    if (view === "list") {
        return (
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">Knowledge Bases</h2>
                        <p className="text-slate-400">Manage your organized collections of documents</p>
                    </div>
                    <button
                        onClick={() => setView("create")}
                        className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create New
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Create New Card (Visual Shortcut) */}
                    <button
                        onClick={() => setView("create")}
                        className="border-2 border-dashed border-slate-700 hover:border-violet-500/50 hover:bg-slate-800/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all group h-48"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-violet-500/20 flex items-center justify-center transition-colors">
                            <Plus className="w-6 h-6 text-slate-400 group-hover:text-violet-400" />
                        </div>
                        <span className="font-medium text-slate-400 group-hover:text-violet-400">Create Knowledge Base</span>
                    </button>

                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => {
                                setSelectedKb(category);
                                setView("details");
                                setDetailsTab("documents");
                            }}
                            className="bg-slate-800/50 border border-slate-700/50 hover:border-violet-500/50 rounded-2xl p-6 text-left transition-all group h-48 flex flex-col"
                        >
                            <div className="flex items-start justify-between w-full mb-4">
                                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                    <Book className="w-5 h-5 text-violet-400" />
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowLeft className="w-4 h-4 text-slate-500 rotate-180" />
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-100 mb-2">{category.name}</h3>
                            <p className="text-sm text-slate-400 line-clamp-2 mb-auto">{category.description}</p>

                            <div className="pt-4 border-t border-slate-700/50 flex items-center gap-2 text-xs text-slate-500">
                                <Clock className="w-3 h-3" />
                                Created {new Date(category.createdAt).toLocaleDateString()}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (view === "create") {
        return (
            <div className="max-w-2xl mx-auto space-y-8">
                <button
                    onClick={() => setView("list")}
                    className="text-slate-400 hover:text-slate-200 flex items-center gap-2 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Knowledge Bases
                </button>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-slate-100 mb-6">Create New Knowledge Base</h2>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Name</label>
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="e.g., Computer Science, Project Alpha"
                                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Description</label>
                            <textarea
                                value={newCategoryDesc}
                                onChange={(e) => setNewCategoryDesc(e.target.value)}
                                placeholder="What is this knowledge base about?"
                                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors h-32 resize-none"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={handleCreateCategory}
                                disabled={isLoading || !newCategoryName.trim()}
                                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                Create Knowledge Base
                            </button>
                            <button
                                onClick={() => setView("list")}
                                className="px-6 py-3 rounded-xl font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Details View
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={() => setView("list")}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">{selectedKb?.name}</h2>
                    <p className="text-sm text-slate-400">{selectedKb?.description}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-800/50 pb-4">
                <button
                    onClick={() => setDetailsTab("documents")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        detailsTab === "documents"
                            ? "bg-violet-500/10 text-violet-400"
                            : "text-slate-400 hover:text-slate-100"
                    )}
                >
                    <FileText className="w-4 h-4" />
                    Documents ({filteredDocuments.length})
                </button>
                <button
                    onClick={() => setDetailsTab("upload")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        detailsTab === "upload"
                            ? "bg-violet-500/10 text-violet-400"
                            : "text-slate-400 hover:text-slate-100"
                    )}
                >
                    <Upload className="w-4 h-4" />
                    Upload New
                </button>
            </div>

            {detailsTab === "documents" && (
                <div className="space-y-6">
                    <div className="relative border-l-2 border-slate-800 ml-3 space-y-8 py-4">
                        {filteredDocuments.map((doc) => (
                            <div key={doc.id} className="relative pl-8">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-violet-500" />
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-violet-500/50 transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-semibold text-slate-100">
                                                {doc.metadata?.filename as string || "Untitled Document"}
                                            </h3>
                                            <p className="text-sm text-slate-400">
                                                Uploaded on {new Date(doc.createdAt).toLocaleDateString()} at {new Date(doc.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <FileText className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div className="mt-4 text-sm text-slate-300 line-clamp-3">
                                        {doc.content.substring(0, 300)}...
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredDocuments.length === 0 && (
                            <div className="pl-8 py-8 text-slate-500 flex flex-col items-start gap-4">
                                <p>No documents found in this knowledge base.</p>
                                <button
                                    onClick={() => setDetailsTab("upload")}
                                    className="text-violet-400 hover:text-violet-300 text-sm font-medium flex items-center gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    Upload your first document
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {detailsTab === "upload" && (
                <div className="space-y-8">
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={cn(
                            "border-2 border-dashed rounded-3xl p-16 text-center transition-all",
                            isDragging
                                ? "border-violet-500 bg-violet-500/10"
                                : "border-slate-700 hover:border-slate-600 bg-slate-800/30"
                        )}
                    >
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-violet-500/20">
                                <Upload className="w-10 h-10 text-white" />
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-2xl font-bold text-slate-100">
                                    Upload to {selectedKb?.name}
                                </h3>
                                <p className="text-base text-slate-400 max-w-md mx-auto leading-relaxed">
                                    Drag and drop files here to add them to this knowledge base
                                </p>
                            </div>

                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer bg-gradient-to-br from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-xl hover:shadow-violet-500/25"
                            >
                                Choose Files
                            </label>
                            <input
                                id="file-upload"
                                type="file"
                                multiple
                                onChange={(e) => handleFileUpload(e.target.files)}
                                className="hidden"
                                accept=".txt,.md,.pdf"
                            />
                        </div>
                    </div>

                    {/* Upload History */}
                    {uploads.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-xl font-semibold text-slate-100">
                                Recent Uploads
                            </h4>
                            <div className="space-y-3">
                                {uploads.map((upload, index) => (
                                    <div
                                        key={index}
                                        className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 flex items-center gap-4 shadow-lg"
                                    >
                                        <div className="flex-shrink-0">
                                            {upload.status === "uploading" && (
                                                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                                            )}
                                            {upload.status === "success" && (
                                                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                            )}
                                            {upload.status === "error" && (
                                                <XCircle className="w-6 h-6 text-red-400" />
                                            )}
                                        </div>

                                        <FileText className="w-6 h-6 text-slate-400" />

                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-medium text-slate-100 truncate">
                                                {upload.filename}
                                            </p>
                                            {upload.message && (
                                                <p
                                                    className={cn(
                                                        "text-sm mt-1",
                                                        upload.status === "success"
                                                            ? "text-emerald-400"
                                                            : upload.status === "error"
                                                                ? "text-red-400"
                                                                : "text-slate-400"
                                                    )}
                                                >
                                                    {upload.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
