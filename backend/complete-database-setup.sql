-- ============================================
-- E-Commerce Complete Database Setup
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. ENABLE UUID EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE STORAGE BUCKET FOR PRODUCT IMAGES
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. DROP EXISTING POLICIES (Clean slate)
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

-- 4. CREATE STORAGE POLICIES
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public updates"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public deletes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'product-images');

-- 5. CREATE USERS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  _id TEXT UNIQUE,  -- For backward compatibility with MongoDB orders
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  phone TEXT,
  avatar TEXT,
  gender TEXT,
  date_of_birth DATE,
  full_address TEXT,
  membership_status TEXT DEFAULT 'Bronze' CHECK (membership_status IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Titanium')),
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create trigger to auto-generate _id from id
CREATE OR REPLACE FUNCTION generate_user_text_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW._id IS NULL THEN
    NEW._id := NEW.id::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_text_id ON users;
CREATE TRIGGER set_user_text_id
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION generate_user_text_id();

-- 6. CREATE PRODUCTS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  discount_price NUMERIC(10, 2),
  discount_type TEXT CHECK (discount_type IN ('percentage', 'amount')),
  discount_value NUMERIC(10, 2),
  category TEXT NOT NULL,
  subcategory TEXT,
  stock INTEGER DEFAULT 0,
  image TEXT,
  images TEXT[],
  rating NUMERIC(2, 1) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CREATE ORDERS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,  -- Changed to TEXT to accept MongoDB _id
  order_number TEXT UNIQUE,
  items JSONB NOT NULL,
  subtotal NUMERIC(10, 2) DEFAULT 0,
  shipping_price NUMERIC(10, 2) DEFAULT 0,
  total_price NUMERIC(10, 2) NOT NULL,
  total_amount NUMERIC(10, 2),  -- Keep for backward compatibility
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  shipping_address JSONB NOT NULL,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- 8. CREATE ADDRESSES TABLE (if not exists)
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Home', 'Office', 'Shipping')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'Bangladesh',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. CREATE WISHLIST TABLE (if not exists)
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 10. CREATE NOTIFICATIONS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_broadcast BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. CREATE SUPPORT TICKETS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ticket_number TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
  description TEXT NOT NULL,
  attachments TEXT[],
  messages JSONB DEFAULT '[]'::jsonb,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- 12. CREATE CATEGORIES TABLE (if not exists)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. CREATE REVIEWS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[],
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- 14. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- 15. CREATE UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 16. ADD TRIGGERS TO TABLES
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_addresses_updated_at ON addresses;
CREATE TRIGGER update_addresses_updated_at
    BEFORE UPDATE ON addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 17. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 17.1 CREATE LOYALTY POINTS HISTORY TABLE
CREATE TABLE IF NOT EXISTS loyalty_points_history (
  _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_loyalty_points_history_user_id ON loyalty_points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_history_created_at ON loyalty_points_history(created_at DESC);

-- Enable RLS
ALTER TABLE loyalty_points_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy for loyalty points history
DROP POLICY IF EXISTS "Users can view own loyalty history" ON loyalty_points_history;
CREATE POLICY "Users can view own loyalty history" ON loyalty_points_history FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage loyalty history" ON loyalty_points_history;
CREATE POLICY "Admins can manage loyalty history" ON loyalty_points_history FOR ALL TO authenticated USING (true);

-- 18. CREATE RLS POLICIES

-- Products: Everyone can read, only admins can write
DROP POLICY IF EXISTS "Anyone can view products" ON products;
CREATE POLICY "Anyone can view products" ON products FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products FOR ALL TO authenticated USING (true);

-- Orders: Users can view their own, admins can view all
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can create orders" ON orders;
CREATE POLICY "Users can create orders" ON orders FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage orders" ON orders;
CREATE POLICY "Admins can manage orders" ON orders FOR UPDATE TO authenticated USING (true);

-- Wishlist: Users can manage their own
DROP POLICY IF EXISTS "Users can manage own wishlist" ON wishlist;
CREATE POLICY "Users can manage own wishlist" ON wishlist FOR ALL TO authenticated USING (true);

-- Addresses: Users can manage their own
DROP POLICY IF EXISTS "Users can manage own addresses" ON addresses;
CREATE POLICY "Users can manage own addresses" ON addresses FOR ALL TO authenticated USING (true);

-- Notifications: Users can view their own
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;
CREATE POLICY "Admins can create notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Support Tickets: Users can manage their own
DROP POLICY IF EXISTS "Users can manage own tickets" ON support_tickets;
CREATE POLICY "Users can manage own tickets" ON support_tickets FOR ALL TO authenticated USING (true);

-- Categories: Everyone can read
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT TO public USING (true);

-- Reviews: Everyone can read, users can write
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (true);

-- 19. INSERT DEFAULT ADMIN USER (password: admin123)
-- Note: In production, use proper password hashing
INSERT INTO users (id, email, name, password, role, phone, membership_status, loyalty_points)
VALUES (
  '2d1aca92-c809-41c5-97ec-fa5e0693dfe5',
  'admin@gmail.com',
  'Admin User',
  'admin123', -- In production, this should be hashed
  'admin',
  '+880 1712 345678',
  'Platinum',
  5000
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- 20. INSERT SAMPLE CATEGORIES
INSERT INTO categories (name, description) VALUES
  ('Electronics', 'Electronic devices and gadgets'),
  ('Clothing', 'Fashion and apparel'),
  ('Home & Living', 'Home decor and furniture'),
  ('Books', 'Books and magazines'),
  ('Sports', 'Sports equipment and gear')
ON CONFLICT (name) DO NOTHING;

-- 21. INSERT SAMPLE PRODUCTS (10 products)
INSERT INTO products (name, description, price, discount_price, category, subcategory, stock, image, rating, reviews_count, featured)
VALUES
  ('Wireless Headphones', 'Premium noise-cancelling wireless headphones', 4500.00, 3999.00, 'Electronics', 'Audio', 50, 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500', 4.5, 128, true),
  ('Smart Watch', 'Fitness tracker with heart rate monitor', 8500.00, NULL, 'Electronics', 'Wearables', 30, 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=500', 4.8, 256, true),
  ('Cotton T-Shirt', 'Comfortable cotton t-shirt', 599.00, 499.00, 'Clothing', 'Men', 100, 'https://images.pexels.com/photos/1152994/pexels-photo-1152994.jpeg?auto=compress&cs=tinysrgb&w=500', 4.2, 89, false),
  ('Running Shoes', 'Professional running shoes', 3500.00, 2999.00, 'Sports', 'Footwear', 45, 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=500', 4.6, 178, true),
  ('Desk Lamp', 'LED desk lamp with adjustable brightness', 1200.00, NULL, 'Home & Living', 'Lighting', 75, 'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=500', 4.3, 56, false),
  ('Backpack', 'Water-resistant laptop backpack', 2500.00, 1999.00, 'Accessories', 'Bags', 60, 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=500', 4.4, 92, false),
  ('Coffee Maker', 'Automatic drip coffee maker', 3800.00, NULL, 'Home & Living', 'Kitchen', 25, 'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&w=500', 4.7, 134, true),
  ('Yoga Mat', 'Non-slip exercise yoga mat', 1500.00, 1299.00, 'Sports', 'Fitness', 80, 'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=500', 4.1, 67, false),
  ('Bluetooth Speaker', 'Portable waterproof speaker', 2800.00, 2499.00, 'Electronics', 'Audio', 55, 'https://images.pexels.com/photos/1279428/pexels-photo-1279428.jpeg?auto=compress&cs=tinysrgb&w=500', 4.5, 145, true),
  ('Novel Book', 'Bestselling fiction novel', 450.00, NULL, 'Books', 'Fiction', 120, 'https://images.pexels.com/photos/159866/books-book-pages-read-159866.jpeg?auto=compress&cs=tinysrgb&w=500', 4.9, 234, false)
ON CONFLICT DO NOTHING;

-- 22. GRANT PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, anon;

-- ============================================
-- SETUP COMPLETE! 
-- You can now use the application with:
-- - Admin login: admin@gmail.com / admin123
-- - 10 sample products
-- - Storage bucket for images
-- - All tables with proper relationships
-- ============================================

SELECT 'Database setup completed successfully!' as status;
