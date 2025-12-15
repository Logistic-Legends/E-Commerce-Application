# 🛒 E-Commerce Application - Complete Setup Guide

## 📋 Database Setup Instructions

### Step 1: Supabase SQL Setup

1. Go to your Supabase Dashboard: https://fcxcfwmtzcbjmksegybw.supabase.co
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire content from `backend/complete-database-setup.sql`
5. Paste it into the SQL Editor
6. Click **Run** button

This will:
- ✅ Create all necessary tables (users, products, orders, addresses, wishlist, notifications, support_tickets, categories, reviews)
- ✅ Set up proper relationships and foreign keys
- ✅ Create indexes for performance
- ✅ Enable Row Level Security (RLS)
- ✅ Create RLS policies for data access control
- ✅ Set up storage bucket for product images
- ✅ Insert default admin user
- ✅ Insert 10 sample products
- ✅ Insert sample categories

### Step 2: Verify Setup

Run this query to verify everything is set up:

```sql
SELECT 
  'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Categories', COUNT(*) FROM categories
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders;
```

Expected output:
- Users: 1 (admin user)
- Products: 10 (sample products)
- Categories: 5
- Orders: 0 (will be created when orders are placed)

## 🔐 Default Admin Credentials

```
Email: admin@gmail.com
Password: admin123
```

## 📱 Application Features

### Admin Panel Features:
1. **Dashboard** - Real-time statistics and analytics
2. **Product Management** - Add/Edit/Delete products with image upload
3. **Order Management** - View and manage all customer orders
4. **Customer Management** - User list, details, order history
5. **Payment Management** - Transaction history, payment tracking
6. **Notification Control** - Send broadcast and individual notifications
7. **Support Tickets** - Manage customer support requests
8. **System Settings** - Configure application settings
9. **Admin Profile** - Profile management with stats

### Customer Features:
1. **Product Browse** - Search, filter, and view products
2. **Shopping Cart** - Add items, update quantities
3. **Wishlist** - Save favorite products
4. **Orders** - Place orders and track status
5. **Profile** - Manage personal information
6. **Addresses** - Save multiple delivery addresses
7. **Support** - Create and track support tickets
8. **Notifications** - Receive order updates

## 🚀 Running the Application

### Start the App:

```bash
cd "d:\project e-commerce\project original\project original\project"
npm start
```

### Test Admin Panel:

1. Open the app on your device/emulator
2. Login with admin credentials (admin@gmail.com / admin123)
3. You'll be redirected to Admin Dashboard
4. Navigate through different sections using the drawer menu

### Test Customer Features:

1. Register a new user account
2. Browse products
3. Add items to cart
4. Place an order
5. Check order history

## 🗂️ Database Schema Overview

### Core Tables:

1. **users** - User accounts (customers & admins)
   - Role-based access (user/admin)
   - Loyalty points & membership tiers
   - Notification & privacy settings

2. **products** - Product catalog
   - Categories & subcategories
   - Pricing & discounts
   - Stock management
   - Images & ratings

3. **orders** - Customer orders
   - Order items (JSONB)
   - Shipping address
   - Payment information
   - Status tracking

4. **addresses** - Delivery addresses
   - Multiple addresses per user
   - Default address flag

5. **wishlist** - Saved products
   - User-Product relationship

6. **notifications** - System notifications
   - Broadcast & individual
   - Priority levels

7. **support_tickets** - Customer support
   - Ticket management
   - Message history (JSONB)

8. **categories** - Product categories
   - Hierarchical structure

9. **reviews** - Product reviews
   - Ratings & comments
   - User reviews

## 🔧 Troubleshooting

### If products don't show:

1. Check API connection in `config/api.ts`
2. Verify Supabase credentials in `.env`
3. Run the SQL setup again
4. Check console logs for errors

### If images don't upload:

1. Verify storage bucket exists in Supabase
2. Check RLS policies are set correctly
3. Run storage setup from `backend/create-storage-bucket.sql`

### If authentication fails:

1. Verify user exists in database
2. Check email and password
3. Clear AsyncStorage and try again
4. Check network connection

## 📝 Environment Variables

Make sure `.env` file exists with:

```env
EXPO_PUBLIC_SUPABASE_URL=https://fcxcfwmtzcbjmksegybw.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🎯 Next Steps

1. ✅ Run database setup SQL
2. ✅ Start the application
3. ✅ Login with admin credentials
4. ✅ Test all admin features
5. ✅ Create test customer account
6. ✅ Place test orders
7. ✅ Verify notifications work
8. ✅ Test support tickets

## 📚 Additional Files

- `backend/complete-database-setup.sql` - Complete database schema
- `backend/create-storage-bucket.sql` - Storage bucket setup
- `backend/supabase-schema.sql` - Original schema (reference)
- `backend/seed-supabase.sql` - Additional seed data

## 🆘 Support

If you encounter any issues:
1. Check console logs in the app
2. Check Supabase logs in dashboard
3. Verify all SQL scripts ran successfully
4. Ensure network connectivity
5. Clear cache: `npm start -- --clear`

---

**Built with:** React Native • Expo • Supabase • TypeScript

**Status:** ✅ Production Ready
