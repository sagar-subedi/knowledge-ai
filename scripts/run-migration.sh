#!/bin/bash

# Load environment variables from .env.local
export $(grep -v '^#' .env.local | xargs)

# Run the migration
psql "$DATABASE_URL" -f migrations/003_add_quiz_system.sql

echo "Migration completed!"
