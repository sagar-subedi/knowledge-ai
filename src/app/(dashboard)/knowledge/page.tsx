import { KnowledgeManager } from "@/components/knowledge-manager";

export default function KnowledgePage() {
    return (
        <div className="h-full overflow-y-auto p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100">Knowledge Base</h1>
                    <p className="text-slate-400 mt-2">
                        Manage your documents and data sources here. Upload files to index them for the AI.
                    </p>
                </div>
                <KnowledgeManager />
            </div>
        </div>
    );
}
