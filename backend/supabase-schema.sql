-- E-Commerce Application - Supabase Schema Migration
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'seller')),
    phone TEXT,
    avatar TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    date_of_birth DATE,
    full_address TEXT,
    reset_password_token TEXT,
    reset_password_expires TIMESTAMPTZ,
    last_login_activity TIMESTAMPTZ,
    
    -- Loyalty & Membership
    loyalty_points INTEGER DEFAULT 0,
    membership_tier TEXT DEFAULT 'Bronze' CHECK (membership_tier IN ('Bronze', 'Silver', 'Titanium', 'Gold', 'Platinum', 'Diamond')),
    tier_achieved_at TIMESTAMPTZ,
    
    -- Settings stored as JSONB
    notification_settings JSONB DEFAULT '{"orderUpdates": true, "supportUpdates": true, "profileUpdates": true, "promotions": true, "appUpdates": true}'::jsonb,
    privacy_settings JSONB DEFAULT '{"analytics": true, "personalizedAds": false, "locationSharing": false}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Points History as separate table for better normalization
CREATE TABLE points_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT,
    order_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    regular_price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2),
    cogs DECIMAL(10, 2) DEFAULT 0,
    description TEXT,
    category TEXT,
    brand TEXT,
    images TEXT[], -- Array of image URLs
    
    -- Available sizes and colors
    available_sizes TEXT[],
    available_colors TEXT[],
    
    -- Total stock (if no variants)
    total_stock INTEGER DEFAULT 0,
    
    -- Specifications stored as JSONB
    specifications JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    
    -- Legacy support
    price DECIMAL(10, 2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product variants as separate table
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    size TEXT,
    color TEXT,
    stock INTEGER DEFAULT 0,
    sku TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    order_number TEXT UNIQUE,
    
    -- Order items stored as JSONB array
    items JSONB NOT NULL,
    
    -- Total amount
    total DECIMAL(10, 2),
    total_amount DECIMAL(10, 2),
    
    -- Order Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')),
    
    -- Payment
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMPTZ,
    payment_method TEXT DEFAULT 'Cash on Delivery',
    
    -- Cancel/Return requests stored as JSONB
    cancel_request JSONB,
    return_request JSONB,
    
    -- Shipping address stored as JSONB
    shipping_address JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADDRESSES TABLE
-- ============================================
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'Home' CHECK (type IN ('Home', 'Office', 'Shipping')),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    postal_code TEXT NOT NULL,
    country TEXT DEFAULT 'Bangladesh',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUPPORT TICKETS TABLE
-- ============================================
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ticket_number TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Order Issue', 'Payment Issue', 'Refund Issue', 'Account Issue', 'App Bug', 'Others')),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    order_id TEXT,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Seen', 'Responded', 'Resolved', 'Closed')),
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    attachments TEXT[],
    conversation JSONB DEFAULT '[]'::jsonb,
    admin_notes JSONB DEFAULT '[]'::jsonb,
    last_reply_at TIMESTAMPTZ,
    last_reply_by TEXT CHECK (last_reply_by IN ('user', 'admin')),
    unread_count INTEGER DEFAULT 0,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BUG REPORTS TABLE
-- ============================================
CREATE TABLE bug_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_number TEXT UNIQUE NOT NULL,
    problem_type TEXT NOT NULL CHECK (problem_type IN ('App Crash', 'Page Not Loading', 'Lag/Freeze', 'Wrong Display', 'Payment Error', 'Others')),
    description TEXT NOT NULL,
    device_info JSONB,
    screenshots TEXT[],
    status TEXT DEFAULT 'Reported' CHECK (status IN ('Reported', 'Investigating', 'Fixed', 'Closed')),
    severity TEXT DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('order', 'support', 'profile', 'promotion', 'app', 'broadcast')),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    action_url TEXT,
    icon TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_role TEXT NOT NULL CHECK (user_role IN ('user', 'admin', 'seller')),
    user_name TEXT,
    user_email TEXT,
    action TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('product', 'order', 'user', 'system', 'auth', 'cart', 'wishlist', 'payment', 'support', 'profile')),
    description TEXT,
    metadata JSONB,
    ip_address TEXT,
    user_agent TEXT,
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUTOMATION SETTINGS TABLE
-- ============================================
CREATE TABLE automation_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_updates BOOLEAN DEFAULT TRUE,
    support_updates BOOLEAN DEFAULT TRUE,
    security_alerts BOOLEAN DEFAULT TRUE,
    promotional_offers BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WISHLISTS TABLE
-- ============================================
CREATE TABLE wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_membership_tier ON users(membership_tier);

-- Products indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(featured);

-- Orders indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Support tickets indexes
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_ticket_number ON support_tickets(ticket_number);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_user_role ON activity_logs(user_role);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Wishlists indexes
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlists_product_id ON wishlists(product_id);

-- ============================================
-- FUNCTIONS FOR AUTO-GENERATING NUMBERS
-- ============================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := 'ORD-' || LPAD((SELECT COUNT(*) + 1 FROM orders)::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_number();

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := 'TKT-' || LPAD((SELECT COUNT(*) + 1 FROM support_tickets)::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_ticket_number
BEFORE INSERT ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_number();

-- Function to generate bug report number
CREATE OR REPLACE FUNCTION generate_report_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.report_number IS NULL THEN
        NEW.report_number := 'BUG-' || LPAD((SELECT COUNT(*) + 1 FROM bug_reports)::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_report_number
BEFORE INSERT ON bug_reports
FOR EACH ROW
EXECUTE FUNCTION generate_report_number();

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bug_reports_updated_at BEFORE UPDATE ON bug_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activity_logs_updated_at BEFORE UPDATE ON activity_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automation_settings_updated_at BEFORE UPDATE ON automation_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wishlists_updated_at BEFORE UPDATE ON wishlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Note: For backend service, use the service role key which bypasses RLS
-- For client-side access, you'll need to define appropriate RLS policies

-- ============================================
-- COMPLETED
-- ============================================
-- Schema migration complete!
-- Next steps:
-- 1. Add your SUPABASE_URL and SUPABASE_SERVICE_KEY to .env file
-- 2. Update your backend code to use Supabase instead of MongoDB
-- 3. Migrate your existing data if needed
