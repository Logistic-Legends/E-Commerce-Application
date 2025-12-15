-- ============================================
-- Create Wishlists Table
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  product_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 2. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);

-- 3. Enable RLS
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlists;
DROP POLICY IF EXISTS "Users can add to own wishlist" ON wishlists;
DROP POLICY IF EXISTS "Users can remove from own wishlist" ON wishlists;

CREATE POLICY "Anyone can view wishlists"
ON wishlists FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can add to wishlist"
ON wishlists FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Anyone can remove from wishlist"
ON wishlists FOR DELETE
TO public
USING (true);

-- 5. Verify table creation
SELECT * FROM wishlists LIMIT 0;
