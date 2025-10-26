-- Migration: add course_id column and FK to user_courses
-- Run this on your production server with psql (as the DB user) or using DATABASE_URL

BEGIN;

-- Add column if missing
ALTER TABLE user_courses
  ADD COLUMN IF NOT EXISTS course_id INTEGER;

-- Add foreign key constraint only if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'user_courses'
      AND kcu.column_name = 'course_id'
  ) THEN
    ALTER TABLE user_courses
      ADD CONSTRAINT fk_user_courses_course_id FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
  END IF;
END$$;

COMMIT;

-- Optional: verify the result
-- \d user_courses
