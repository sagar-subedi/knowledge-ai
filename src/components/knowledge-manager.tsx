"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, Loader2, CheckCircle2, XCircle, Clock, Folder, Plus, Trash2 } from "lucide-react";
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
}

interface Document {
    id: number;
    content: string;
    metadata: Record<string, unknown>;
    createdAt: string;
    categoryId: number | null;
}

export function KnowledgeManager() {
    const [activeTab, setActiveTab] = useState<"upload" | "timeline" | "categories">("upload");
    const [uploads, setUploads] = useState<UploadStatus[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
        if (activeTab === "timeline") {
            fetchDocuments();
        }
    }, [activeTab]);

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
                body: JSON.stringify({ name: newCategoryName, description: "Created via UI" }),
            });
            if (res.ok) {
                setNewCategoryName("");
                fetchCategories();
            }
        } catch (error) {
            console.error("Failed to create category", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

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
                if (selectedCategory) {
                    formData.append("categoryId", selectedCategory);
                }

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

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-800/50 pb-4">
                <button
                    onClick={() => setActiveTab("upload")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        activeTab === "upload"
                            ? "bg-violet-500/10 text-violet-400"
                            : "text-slate-400 hover:text-slate-100"
                    )}
                >
                    <Upload className="w-4 h-4" />
                    Upload
                </button>
                <button
                    onClick={() => setActiveTab("timeline")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        activeTab === "timeline"
                            ? "bg-violet-500/10 text-violet-400"
                            : "text-slate-400 hover:text-slate-100"
                    )}
                >
                    <Clock className="w-4 h-4" />
                    Timeline
                </button>
                <button
                    onClick={() => setActiveTab("categories")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        activeTab === "categories"
                            ? "bg-violet-500/10 text-violet-400"
                            : "text-slate-400 hover:text-slate-100"
                    )}
                >
                    <Folder className="w-4 h-4" />
                    Categories
                </button>
            </div>

            {/* Upload Tab */}
            {activeTab === "upload" && (
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-violet-500"
                        >
                            <option value="">Select Category (Optional)</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

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
                                    Upload Documents
                                </h3>
                                <p className="text-base text-slate-400 max-w-md mx-auto leading-relaxed">
                                    Drag and drop files here, or click to browse
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
                            <p className="text-sm text-slate-500">
                                Supported formats: TXT, Markdown, PDF
                            </p>
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

            {/* Categories Tab */}
            {activeTab === "categories" && (
                <div className="space-y-6">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="New Category Name"
                            className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500"
                        />
                        <button
                            onClick={handleCreateCategory}
                            disabled={isLoading || !newCategoryName.trim()}
                            className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map((category) => (
                            <div key={category.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-violet-500/50 transition-all">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-100">{category.name}</h3>
                                        <p className="text-sm text-slate-400 mt-1">{category.description}</p>
                                    </div>
                                    <Folder className="w-5 h-5 text-violet-400" />
                                </div>
                                <div className="mt-4 text-xs text-slate-500">
                                    Created {new Date(category.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Timeline Tab */}
            {activeTab === "timeline" && (
                <div className="space-y-6">
                    <div className="relative border-l-2 border-slate-800 ml-3 space-y-8 py-4">
                        {documents.map((doc) => (
                            <div key={doc.id} className="relative pl-8">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-violet-500" />
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-violet-500/50 transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-semibold text-slate-100">
                                                    {doc.metadata?.filename || "Untitled Document"}
                                                </h3>
                                                {doc.categoryId && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                                        {categories.find(c => c.id === doc.categoryId)?.name || "Category"}
                                                    </span>
                                                )}
                                            </div>
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
                        {documents.length === 0 && (
                            <div className="pl-8 text-slate-500">No documents found. Start uploading!</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
