import { OpenAI, OpenAIEmbedding } from "@llamaindex/openai";
import { Settings } from "llamaindex";

// Use OpenAI for both LLM and Embeddings by default
// Ensure OPENAI_API_KEY is set in environment variables

Settings.llm = new OpenAI({
    model: "gpt-4o",
    temperature: 0,
});

Settings.embedModel = new OpenAIEmbedding({
    model: "text-embedding-3-small",
    dimensions: 1536,
});

export { Settings };
