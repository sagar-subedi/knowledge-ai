import { QuizManager } from "@/components/quiz-manager";

export default function QuizzesPage() {
    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-100">Quiz & Exam System</h1>
                <p className="text-slate-400 mt-2">Test your knowledge with AI-generated exams</p>
            </div>
            <QuizManager />
        </div>
    );
}
