import { FlashcardManager } from "@/components/flashcard-manager";

export default function FlashcardsPage() {
    return (
        <div className="h-full overflow-y-auto p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100">Flashcards</h1>
                    <p className="text-slate-400 mt-2">
                        Master your knowledge with spaced repetition. Review cards or generate new ones from your documents.
                    </p>
                </div>
                <FlashcardManager />
            </div>
        </div>
    );
}
