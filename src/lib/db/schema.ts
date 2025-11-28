import { pgTable, serial, text, timestamp, vector, index, jsonb } from 'drizzle-orm/pg-core';

export const documents = pgTable('documents', {
    id: serial('id').primaryKey(),
    content: text('content').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const embeddings = pgTable('embeddings', {
    id: serial('id').primaryKey(),
    documentId: serial('document_id').references(() => documents.id),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }), // OpenAI default
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    embeddingIndex: index('embeddingIndex').using('hnsw', table.embedding.op('vector_cosine_ops')),
}));
