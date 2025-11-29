import { pgTable, serial, text, timestamp, vector, index, jsonb, varchar, boolean, integer } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: varchar('name', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Refresh tokens for JWT auth
export const refreshTokens = pgTable('refresh_tokens', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// Categories table
export const categories = pgTable('categories', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    color: varchar('color', { length: 20 }).default('blue'), // UI color theme
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Decks table (hierarchical)
export const decks = pgTable('decks', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    categoryId: integer('category_id').references(() => categories.id).notNull(),
    parentDeckId: integer('parent_deck_id').references((): any => decks.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Flashcards table (SRS) - now references decks
export const flashcards = pgTable('flashcards', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    deckId: integer('deck_id').references(() => decks.id).notNull(),
    front: text('front').notNull(),
    back: text('back').notNull(),
    // SRS fields (SuperMemo-2 based)
    nextReviewAt: timestamp('next_review_at').defaultNow(),
    interval: integer('interval').default(0), // Days until next review
    easeFactor: integer('ease_factor').default(250), // 2.5 * 100 to store as int
    repetitions: integer('repetitions').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Study sessions
export const studySessions = pgTable('study_sessions', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    deckId: integer('deck_id').references(() => decks.id).notNull(),
    startedAt: timestamp('started_at').defaultNow(),
    completedAt: timestamp('completed_at'),
    cardsReviewed: integer('cards_reviewed').default(0),
    cardsTotal: integer('cards_total').default(0),
    isActive: boolean('is_active').default(true),
});

// Card reviews (history)
export const cardReviews = pgTable('card_reviews', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    flashcardId: integer('flashcard_id').references(() => flashcards.id).notNull(),
    sessionId: integer('session_id').references(() => studySessions.id),
    rating: integer('rating').notNull(), // 1=Again, 2=Hard, 3=Good, 4=Easy
    timeTakenMs: integer('time_taken_ms'),
    reviewedAt: timestamp('reviewed_at').defaultNow(),
});

// Documents - updated with user_id and category_id
export const documents = pgTable('documents', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    categoryId: integer('category_id').references(() => categories.id), // Optional category
    content: text('content').notNull(),
    metadata: jsonb('metadata'),
    toc: jsonb('toc'), // Table of contents metadata
    createdAt: timestamp('created_at').defaultNow(),
});

// Embeddings - updated with user_id
export const embeddings = pgTable('embeddings', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    documentId: integer('document_id').references(() => documents.id),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }), // OpenAI default
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    embeddingIndex: index('embeddingIndex').using('hnsw', table.embedding.op('vector_cosine_ops')),
}));

// Chat histories
export const chatHistories = pgTable('chat_histories', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    title: varchar('title', { length: 255 }),
    messages: jsonb('messages').notNull(), // Array of {role, content, sources}
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// User settings
export const userSettings = pgTable('user_settings', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull().unique(),
    theme: varchar('theme', { length: 50 }).default('dark'),
    model: varchar('model', { length: 50 }).default('gpt-4o'),
    preferences: jsonb('preferences'), // Additional settings
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Activity logs
export const activityLogs = pgTable('activity_logs', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id),
    action: varchar('action', { length: 100 }).notNull(), // e.g., 'document_upload', 'query', 'login'
    metadata: jsonb('metadata'), // Additional context
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow(),
});
// Quizzes
export const quizzes = pgTable('quizzes', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    categoryId: integer('category_id').references(() => categories.id).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    timeLimit: integer('time_limit').notNull(), // in minutes
    difficulty: varchar('difficulty', { length: 20 }).notNull(), // easy, medium, hard
    questionCount: integer('question_count').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// Questions
export const questions = pgTable('questions', {
    id: serial('id').primaryKey(),
    quizId: integer('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
    text: text('text').notNull(),
    options: jsonb('options').notNull(), // Array of strings
    correctAnswer: text('correct_answer').notNull(),
    explanation: text('explanation'),
    createdAt: timestamp('created_at').defaultNow(),
});

// Quiz Attempts
export const quizAttempts = pgTable('quiz_attempts', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    quizId: integer('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
    score: integer('score').notNull(),
    totalQuestions: integer('total_questions').notNull(),
    startedAt: timestamp('started_at').notNull(),
    completedAt: timestamp('completed_at').defaultNow(),
});

// Quiz Answers (User's answers for an attempt)
export const quizAnswers = pgTable('quiz_answers', {
    id: serial('id').primaryKey(),
    attemptId: integer('attempt_id').references(() => quizAttempts.id, { onDelete: 'cascade' }).notNull(),
    questionId: integer('question_id').references(() => questions.id, { onDelete: 'cascade' }).notNull(),
    userAnswer: text('user_answer').notNull(),
    isCorrect: boolean('is_correct').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});
