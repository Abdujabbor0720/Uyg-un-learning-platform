-- Migration: Update existing video filenames to match new upload system
-- Run this SQL in your PostgreSQL database

-- Check existing videos
SELECT id, title, filename, url FROM videos;

-- Update video URLs to use filename only (not full path)
UPDATE videos 
SET url = filename 
WHERE url LIKE '/uploads/%' OR url LIKE 'http%';

-- Show updated videos
SELECT id, title, filename, url FROM videos;

-- Note: Make sure video files are in public/uploads/ directory
-- Copy files from client/uploads/ to public/uploads/ if needed:
-- cp client/uploads/*.mp4 public/uploads/
