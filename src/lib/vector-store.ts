import { PGVectorStore } from "@llamaindex/postgres";
import { VectorStoreIndex, storageContextFromDefaults } from "llamaindex";

export async function getIndex() {
    const vectorStore = new PGVectorStore({
        clientConfig: {
            connectionString: process.env.DATABASE_URL,
        },
    });

    const storageContext = await storageContextFromDefaults({ vectorStore });

    return await VectorStoreIndex.fromVectorStore(vectorStore);
}

export async function createIndexFromDocuments(documents: any[], userId?: number) {
    const vectorStore = new PGVectorStore({
        clientConfig: {
            connectionString: process.env.DATABASE_URL,
        },
    });

    const storageContext = await storageContextFromDefaults({ vectorStore });

    return await VectorStoreIndex.fromDocuments(documents, { storageContext });
}
