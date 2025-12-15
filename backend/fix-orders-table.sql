-- ============================================
-- Fix Orders Table for MongoDB User IDs
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Drop the foreign key constraint first
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- 2. Change user_id to TEXT type (using USING clause to handle conversion)
ALTER TABLE orders ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- 3. Update any NULL user_id values
UPDATE orders 
SET user_id = 'unknown-user' 
WHERE user_id IS NULL OR user_id = '';

-- 4. Set NOT NULL constraint
ALTER TABLE orders ALTER COLUMN user_id SET NOT NULL;

-- 3. Add missing columns if they don't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_price NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_price NUMERIC(10, 2);

-- 4. Update total_price from total_amount for existing records
UPDATE orders 
SET total_price = total_amount 
WHERE total_price IS NULL AND total_amount IS NOT NULL;

-- 5. Create index for faster user_id lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 6. Update RLS policies to work with TEXT user_id
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

-- Create new RLS policies
CREATE POLICY "Anyone can create orders"
ON orders FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Anyone can view orders"
ON orders FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can update orders"
ON orders FOR UPDATE
TO public
USING (true);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
