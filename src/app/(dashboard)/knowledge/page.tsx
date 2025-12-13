import { KnowledgeManager } from "@/components/knowledge-manager";

export default function KnowledgePage() {
    return (
        <div className="h-full overflow-y-auto p-8">
            <div className="mx-auto max-w-5xl space-y-8">

                <KnowledgeManager />
            </div>
        </div>
    );
}
