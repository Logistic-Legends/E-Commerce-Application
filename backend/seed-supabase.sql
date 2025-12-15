-- Seed data for Supabase (Prices in BDT)
-- Run this AFTER running supabase-schema.sql

-- Delete existing products first
DELETE FROM products;

-- Insert sample products with BDT prices
INSERT INTO products (name, regular_price, discount_price, description, category, brand, images, available_sizes, available_colors, total_stock, featured, is_active) VALUES
('Wireless Bluetooth Headphones', 16499, 10999, 'Premium wireless headphones with active noise cancellation and 30-hour battery life. Experience crystal-clear audio with deep bass and crisp highs.', 'Electronics', 'TechBrand', 
 ARRAY['https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500', 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=500'], 
 NULL, ARRAY['Black', 'White', 'Blue'], 50, true, true),

('Minimalist Watch', 27499, NULL, 'Elegant minimalist watch with premium leather strap. Swiss movement with scratch-resistant sapphire crystal.', 'Fashion', 'WatchCo', 
 ARRAY['https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=500', 'https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=500'], 
 NULL, ARRAY['Brown', 'Black', 'Navy'], 30, true, true),

('Organic Cotton T-Shirt', 4399, 3299, 'Comfortable organic cotton t-shirt with perfect fit. Sustainably sourced and ethically made.', 'Fashion', 'EcoWear', 
 ARRAY['https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=500'], 
 ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['White', 'Black', 'Gray', 'Navy'], 100, false, true),

('Smart Fitness Tracker', 14299, NULL, 'Advanced fitness tracker with heart rate monitor, sleep tracking, and GPS. Water-resistant up to 50m.', 'Electronics', 'FitTech', 
 ARRAY['https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=500'], 
 NULL, ARRAY['Black', 'Blue', 'Pink'], 75, true, true),

('Leather Messenger Bag', 20899, 16499, 'Handcrafted genuine leather messenger bag with vintage design. Perfect for work or travel.', 'Fashion', 'LeatherCraft', 
 ARRAY['https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=500'], 
 NULL, ARRAY['Brown', 'Black', 'Tan'], 40, false, true),

('Wireless Charging Pad', 5499, 4399, 'Fast wireless charging pad compatible with all Qi-enabled devices. Sleek aluminum design.', 'Electronics', 'ChargeTech', 
 ARRAY['https://images.pexels.com/photos/4219861/pexels-photo-4219861.jpeg?auto=compress&cs=tinysrgb&w=500'], 
 NULL, ARRAY['Silver', 'Black'], 150, false, true),

('Running Shoes', 17599, 14299, 'Professional running shoes with advanced cushioning and breathable mesh. Perfect for marathon training.', 'Fashion', 'RunPro', 
 ARRAY['https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=500'], 
 ARRAY['7', '8', '9', '10', '11', '12'], ARRAY['Black', 'White', 'Blue', 'Red'], 80, true, true),

('Portable Bluetooth Speaker', 8799, 6599, 'Waterproof portable speaker with 360° sound and 12-hour battery life. Perfect for outdoor adventures.', 'Electronics', 'SoundWave', 
 ARRAY['https://images.pexels.com/photos/1279119/pexels-photo-1279119.jpeg?auto=compress&cs=tinysrgb&w=500'], 
 NULL, ARRAY['Black', 'Blue', 'Red', 'Green'], 120, false, true);

-- Insert a sample admin user (password: admin123 - should be hashed in production)
INSERT INTO users (name, email, password, role, phone, loyalty_points, membership_tier) VALUES
('Admin User', 'admin@example.com', '$2b$10$YourHashedPasswordHere', 'admin', '+1234567890', 0, 'Platinum');

-- Insert a sample regular user (password: user123 - should be hashed in production)
INSERT INTO users (name, email, password, role, phone, loyalty_points, membership_tier) VALUES
('John Doe', 'user@example.com', '$2b$10$YourHashedPasswordHere', 'user', '+1234567890', 150, 'Silver');

COMMIT;
