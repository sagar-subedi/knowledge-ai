#!/bin/bash

# Load environment variables
export $(grep -v '^#' .env.local | xargs)

echo "=== Checking Database ==="
echo ""

echo "1. Categories:"
psql "$DATABASE_URL" -c "SELECT id, name, user_id FROM categories;"
echo ""

echo "2. Documents (with categories):"
psql "$DATABASE_URL" -c "SELECT id, user_id, category_id, LEFT(content, 50) as content_preview, created_at FROM documents ORDER BY created_at DESC LIMIT 5;"
echo ""

echo "3. Flashcards:"
psql "$DATABASE_URL" -c "SELECT id, user_id, category_id, front, back, next_review_at FROM flashcards ORDER BY created_at DESC LIMIT 10;"
echo ""

echo "4. Count of documents per category:"
psql "$DATABASE_URL" -c "SELECT c.id, c.name, COUNT(d.id) as doc_count FROM categories c LEFT JOIN documents d ON c.id = d.category_id GROUP BY c.id, c.name;"
echo ""

echo "5. Count of flashcards per category:"
psql "$DATABASE_URL" -c "SELECT c.id, c.name, COUNT(f.id) as flashcard_count FROM categories c LEFT JOIN flashcards f ON c.id = f.category_id GROUP BY c.id, c.name;"
