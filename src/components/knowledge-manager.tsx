"use client";

import { useState } from "react";
import { Upload, FileText, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadStatus {
    filename: string;
    status: "uploading" | "success" | "error";
    message?: string;
}

export function KnowledgeManager() {
    const [uploads, setUploads] = useState<UploadStatus[]>([]);
    const [isDragging, setIsDragging] = useState(false);

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
        <div className="space-y-8">
            {/* Upload Zone */}
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
    );
}
