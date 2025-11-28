import { PGVectorStore } from "@llamaindex/postgres";
import { VectorStoreIndex, storageContextFromDefaults } from "llamaindex";

export async function getIndex() {
    const vectorStore = new PGVectorStore({
        clientConfig: {
            connectionString: process.env.DATABASE_URL,
        },
    });

    const storageContext = await storageContextFromDefaults({ vectorStore });

    return await VectorStoreIndex.fromVectorStore(vectorStore, storageContext);
}

export async function createIndexFromDocuments(documents: any[]) {
    const vectorStore = new PGVectorStore({
        clientConfig: {
            connectionString: process.env.DATABASE_URL,
        },
    });

    const storageContext = await storageContextFromDefaults({ vectorStore });

    return await VectorStoreIndex.fromDocuments(documents, { storageContext });
}
