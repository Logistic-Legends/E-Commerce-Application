-- Add _id field to users table for backward compatibility
-- Run this in Supabase SQL Editor

-- Add _id column
ALTER TABLE users ADD COLUMN IF NOT EXISTS _id TEXT UNIQUE;

-- Create trigger function to auto-generate _id from id
CREATE OR REPLACE FUNCTION generate_user_text_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW._id IS NULL THEN
    NEW._id := NEW.id::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS set_user_text_id ON users;

-- Create trigger
CREATE TRIGGER set_user_text_id
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION generate_user_text_id();

-- Update existing users to have _id
UPDATE users SET _id = id::TEXT WHERE _id IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_text_id ON users(_id);
