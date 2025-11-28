import "../lib/llamaindex-config";
import { PGVectorStore } from "@llamaindex/postgres";

const vs = new PGVectorStore({
    clientConfig: {
        connectionString: process.env.DATABASE_URL,
    }
});

console.log("Created vector store", vs);
