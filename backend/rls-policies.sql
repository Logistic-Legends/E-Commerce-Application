-- Row Level Security (RLS) Policies for Supabase
-- Run this AFTER running supabase-schema.sql and seed-supabase.sql

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
DROP POLICY IF EXISTS "Allow authenticated read access to all products" ON products;
DROP POLICY IF EXISTS "Allow public user registration" ON users;
DROP POLICY IF EXISTS "Allow users to read their own data" ON users;
DROP POLICY IF EXISTS "Allow users to update their own data" ON users;

-- ============================================
-- PRODUCTS - Allow public read access
-- ============================================
CREATE POLICY "Allow public read access to products"
ON products FOR SELECT
TO anon
USING (is_active = true);

CREATE POLICY "Allow authenticated read access to all products"
ON products FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- USERS - Allow public insert for registration
-- ============================================
CREATE POLICY "Allow public user registration"
ON users FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow users to read their own data"
ON users FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow users to update their own data"
ON users FOR UPDATE
TO authenticated
USING (true);

-- ============================================
-- ORDERS - User-specific access
-- ============================================
CREATE POLICY "Users can read their own orders"
ON orders FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- ADDRESSES - User-specific access
-- ============================================
CREATE POLICY "Users can manage their own addresses"
ON addresses FOR ALL
TO authenticated
USING (true);

-- ============================================
-- WISHLISTS - User-specific access
-- ============================================
CREATE POLICY "Users can manage their own wishlist"
ON wishlists FOR ALL
TO authenticated
USING (true);

-- ============================================
-- NOTIFICATIONS - User-specific access
-- ============================================
CREATE POLICY "Users can read their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (true);

-- ============================================
-- SUPPORT TICKETS - User-specific access
-- ============================================
CREATE POLICY "Users can manage their own tickets"
ON support_tickets FOR ALL
TO authenticated
USING (true);

-- ============================================
-- BUG REPORTS - User-specific access
-- ============================================
CREATE POLICY "Users can manage their own bug reports"
ON bug_reports FOR ALL
TO authenticated
USING (true);

-- ============================================
-- CATEGORIES - Public read access, admin write access
-- ============================================
CREATE POLICY "Allow public read access to categories"
ON categories FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow authenticated users to manage categories"
ON categories FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public read access to subcategories"
ON subcategories FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow authenticated users to manage subcategories"
ON subcategories FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- PRODUCTS - Admin write access
-- ============================================
CREATE POLICY "Allow authenticated users to manage products"
ON products FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

COMMIT;
