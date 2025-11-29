-- Migration: Add Deck System (Anki-inspired)
-- This migration adds support for hierarchical decks, study sessions, and card reviews

-- Decks table (hierarchical structure)
CREATE TABLE IF NOT EXISTS decks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    parent_deck_id INTEGER REFERENCES decks(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Study sessions to track progress
CREATE TABLE IF NOT EXISTS study_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    cards_reviewed INTEGER DEFAULT 0,
    cards_total INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Card reviews (history)
CREATE TABLE IF NOT EXISTS card_reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flashcard_id INTEGER NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES study_sessions(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 4), -- 1=Again, 2=Hard, 3=Good, 4=Easy
    time_taken_ms INTEGER,
    reviewed_at TIMESTAMP DEFAULT NOW()
);

-- Add deck_id to flashcards (temporarily nullable for migration)
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS deck_id INTEGER REFERENCES decks(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_decks_category ON decks(category_id);
CREATE INDEX IF NOT EXISTS idx_decks_parent ON decks(parent_deck_id);
CREATE INDEX IF NOT EXISTS idx_decks_user ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_deck ON flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(next_review_at);
CREATE INDEX IF NOT EXISTS idx_study_sessions_active ON study_sessions(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_card_reviews_flashcard ON card_reviews(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_card_reviews_session ON card_reviews(session_id);

-- Migrate existing flashcards to default decks per category
-- Create a default deck for each category that has flashcards
INSERT INTO decks (user_id, category_id, parent_deck_id, name, description)
SELECT DISTINCT 
    f.user_id, 
    f.category_id, 
    NULL::INTEGER,
    CONCAT(c.name, ' - Default Deck'),
    'Auto-created deck for existing flashcards'
FROM flashcards f
JOIN categories c ON f.category_id = c.id
WHERE f.category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM decks d 
    WHERE d.category_id = f.category_id 
      AND d.user_id = f.user_id 
      AND d.name LIKE '% - Default Deck'
  );

-- Update flashcards to reference the default deck
UPDATE flashcards f
SET deck_id = d.id
FROM decks d
WHERE f.category_id = d.category_id 
  AND f.user_id = d.user_id
  AND d.parent_deck_id IS NULL
  AND d.name LIKE '% - Default Deck'
  AND f.deck_id IS NULL;

-- For any flashcards without a category, create a general default deck
INSERT INTO decks (user_id, category_id, parent_deck_id, name, description)
SELECT DISTINCT 
    f.user_id,
    (SELECT id FROM categories WHERE user_id = f.user_id LIMIT 1),
    NULL::INTEGER,
    'Uncategorized - Default Deck',
    'Auto-created deck for flashcards without category'
FROM flashcards f
WHERE f.category_id IS NULL
  AND f.deck_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM decks d 
    WHERE d.user_id = f.user_id 
      AND d.name = 'Uncategorized - Default Deck'
  );

-- Update uncategorized flashcards
UPDATE flashcards f
SET deck_id = d.id,
    category_id = d.category_id
FROM decks d
WHERE f.user_id = d.user_id
  AND d.name = 'Uncategorized - Default Deck'
  AND f.deck_id IS NULL;

-- Now make deck_id NOT NULL (all flashcards should have a deck now)
-- First check if there are any remaining NULL values
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM flashcards WHERE deck_id IS NULL) THEN
        RAISE EXCEPTION 'Some flashcards still have NULL deck_id. Migration cannot proceed.';
    END IF;
END $$;

ALTER TABLE flashcards ALTER COLUMN deck_id SET NOT NULL;

-- Drop the old category_id column from flashcards (deck now references category)
ALTER TABLE flashcards DROP COLUMN IF EXISTS category_id;
