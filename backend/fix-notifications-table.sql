-- ============================================
-- Fix Notifications Table for MongoDB User IDs
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Drop the foreign key constraint first
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- 2. Change user_id to TEXT type (using USING clause to handle conversion)
ALTER TABLE notifications ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- 3. Add is_admin_notification column if it doesn't exist
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_admin_notification BOOLEAN DEFAULT FALSE;

-- 4. Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_admin ON notifications(is_admin_notification);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 5. Update RLS policies to work with TEXT user_id
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;

-- Create new RLS policies
CREATE POLICY "Anyone can insert notifications"
ON notifications FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Anyone can view notifications"
ON notifications FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can update notifications"
ON notifications FOR UPDATE
TO public
USING (true);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
