-- Blog Feature Database Migration
-- Run this script to update existing database schema for blog feature

-- Step 1: Add new columns to blogs table if they don't exist
-- Note: If your blogs table is empty, you can recreate it using the ecommerce_db.sql file
-- If your blogs table has data, run these ALTER statements carefully

ALTER TABLE blogs ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general';
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS thumbnail_image VARCHAR(255);
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;

-- Step 2: If you want to remove old columns (optional, only if no data)
-- ALTER TABLE blogs DROP COLUMN IF EXISTS user_id;
-- ALTER TABLE blogs DROP COLUMN IF EXISTS thumbnail;

-- Step 3: Update blog_comments table column name if needed
-- Check if 'comment' column exists and rename to 'content'
-- Note: This is safer to do manually via MySQL Workbench to avoid data loss

-- Step 4: Verify the tables structure
-- Run these SELECT statements to verify:
-- DESCRIBE blogs;
-- DESCRIBE blog_images;
-- DESCRIBE blog_comments;
