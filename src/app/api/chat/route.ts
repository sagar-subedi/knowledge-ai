import { NextRequest, NextResponse } from "next/server";
import { getIndex } from "@/lib/vector-store";
import "@/lib/llamaindex-config";

export async function POST(request: NextRequest) {
    try {
        const { message } = await request.json();

        if (!message) {
            return NextResponse.json({ error: "No message provided" }, { status: 400 });
        }

        console.log(`Query: ${message}`);

        // Get the index
        const index = await getIndex();

        // Create a query engine
        const queryEngine = index.asQueryEngine();

        // Query
        const response = await queryEngine.query({ query: message });

        return NextResponse.json({
            response: response.response,
            sources: response.sourceNodes?.map((node: any) => ({
                text: node.node.text.substring(0, 200),
                metadata: node.node.metadata,
                score: node.score,
            })),
        });
    } catch (error) {
        console.error("Chat error:", error);
        return NextResponse.json({
            error: "Failed to process query",
            details: error instanceof Error ? error.message : "Unknown error",
        }, { status: 500 });
    }
}
