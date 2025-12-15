-- ============================================
-- Loyalty Points History Table Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- Create loyalty_points_history table
CREATE TABLE IF NOT EXISTS loyalty_points_history (
  _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_loyalty_points_history_user_id 
  ON loyalty_points_history(user_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_points_history_created_at 
  ON loyalty_points_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE loyalty_points_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own loyalty history" ON loyalty_points_history;
DROP POLICY IF EXISTS "Admins can manage loyalty history" ON loyalty_points_history;

-- Create RLS policies
CREATE POLICY "Users can view own loyalty history" 
  ON loyalty_points_history 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Admins can manage loyalty history" 
  ON loyalty_points_history 
  FOR ALL 
  TO authenticated 
  USING (true);

-- Grant permissions
GRANT ALL ON loyalty_points_history TO postgres, authenticated, anon;

-- ============================================
-- Setup Complete!
-- ============================================

-- Test query to verify
-- SELECT * FROM loyalty_points_history LIMIT 5;
