# ============================================
# QUICK VERIFICATION QUERIES
# Run these to check if setup is complete
# ============================================

-- 1. Check all tables exist
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'products', 'orders', 'addresses', 'wishlist', 'notifications', 'support_tickets', 'categories', 'reviews')
ORDER BY tablename;

-- Expected: 9 rows

-- 2. Check record counts
SELECT 
    'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Categories', COUNT(*) FROM categories
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'Addresses', COUNT(*) FROM addresses
UNION ALL
SELECT 'Wishlist', COUNT(*) FROM wishlist
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'Support Tickets', COUNT(*) FROM support_tickets
UNION ALL
SELECT 'Reviews', COUNT(*) FROM reviews;

-- Expected:
-- Users: 1 (admin)
-- Products: 10
-- Categories: 5
-- Others: 0 (empty initially)

-- 3. Verify admin user exists
SELECT 
    id,
    name,
    email,
    role,
    membership_status as membership,
    loyalty_points as points,
    created_at
FROM users 
WHERE role = 'admin';

-- Expected: 1 admin user

-- 4. Check products with categories
SELECT 
    p.name,
    p.category,
    p.price,
    p.discount_price,
    p.stock,
    p.rating,
    p.featured
FROM products p
ORDER BY p.featured DESC, p.rating DESC;

-- Expected: 10 products

-- 5. Verify storage bucket exists
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE id = 'product-images';

-- Expected: 1 bucket

-- 6. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected: Multiple policies for each table

-- 7. Check indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('products', 'orders', 'wishlist', 'notifications')
ORDER BY tablename, indexname;

-- Expected: Multiple indexes for performance

-- 8. Verify triggers exist
SELECT
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%updated_at%';

-- Expected: update triggers on multiple tables

-- ============================================
-- SAMPLE DATA QUERIES
-- ============================================

-- Get featured products
SELECT 
    name,
    category,
    price,
    discount_price,
    rating,
    stock
FROM products
WHERE featured = true
ORDER BY rating DESC;

-- Get all categories
SELECT 
    name,
    description,
    (SELECT COUNT(*) FROM products WHERE category = categories.name) as product_count
FROM categories
ORDER BY name;

-- ============================================
-- HEALTH CHECK SUMMARY
-- ============================================

SELECT 
    'Database Setup' as check_item,
    CASE 
        WHEN (SELECT COUNT(*) FROM users WHERE role = 'admin') = 1 
        AND (SELECT COUNT(*) FROM products) = 10
        AND (SELECT COUNT(*) FROM categories) = 5
        AND (SELECT COUNT(*) FROM storage.buckets WHERE id = 'product-images') = 1
        THEN '✅ PASSED'
        ELSE '❌ FAILED'
    END as status,
    CASE 
        WHEN (SELECT COUNT(*) FROM users WHERE role = 'admin') = 1 
        AND (SELECT COUNT(*) FROM products) = 10
        AND (SELECT COUNT(*) FROM categories) = 5
        AND (SELECT COUNT(*) FROM storage.buckets WHERE id = 'product-images') = 1
        THEN 'All checks passed. Database is ready!'
        ELSE 'Please run complete-database-setup.sql again'
    END as message;
