# 🚀 Serverless E-Commerce App with Supabase

Your app is now fully serverless! No backend server needed.

## 🎯 Architecture

```
┌─────────────────────────────────────────┐
│         React Native App (Expo)         │
│  ┌───────────────────────────────────┐  │
│  │   Components & Screens            │  │
│  └───────────────────────────────────┘  │
│               ↓                          │
│  ┌───────────────────────────────────┐  │
│  │   Supabase Services              │  │
│  │   (lib/supabase-services.ts)     │  │
│  └───────────────────────────────────┘  │
│               ↓                          │
│  ┌───────────────────────────────────┐  │
│  │   Supabase Client                │  │
│  │   (lib/supabase.ts)              │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
               ↓ Direct Connection
┌─────────────────────────────────────────┐
│         Supabase Cloud                  │
│  ┌───────────────────────────────────┐  │
│  │   PostgreSQL Database            │  │
│  │   - Users, Products, Orders      │  │
│  │   - Real-time Subscriptions      │  │
│  │   - Row Level Security           │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │   Supabase Storage               │  │
│  │   - Product Images               │  │
│  │   - User Avatars                 │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │   Supabase Edge Functions        │  │
│  │   (optional for complex logic)   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 📦 What Was Changed

### ❌ Removed:
- Express.js backend server
- MongoDB models
- Backend API routes
- Server-side authentication
- Multer file uploads
- Backend utilities

### ✅ Added:
- `lib/supabase.ts` - Supabase client configuration
- `lib/database.types.ts` - TypeScript types from database schema
- `lib/supabase-services.ts` - All database operations

## 🔧 Setup Instructions

### 1. Create Supabase Project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Run Database Schema

In Supabase Dashboard → SQL Editor, run the schema from:
`backend/supabase-schema.sql`

### 3. Get API Keys

From Supabase Dashboard → Settings → API:
- Copy **Project URL**
- Copy **anon public** key (NOT service_role)

### 4. Configure Environment Variables

Create `.env` in project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **Important**: Use `EXPO_PUBLIC_` prefix so variables are available in your app!

### 5. Install Dependencies

```bash
npm install react-native-url-polyfill
```

### 6. Set Up Storage Buckets (for images)

In Supabase Dashboard → Storage:

1. Create bucket: `products`
   - Public: Yes
   - Allowed MIME types: image/*

2. Create bucket: `avatars`
   - Public: Yes
   - Allowed MIME types: image/*

### 7. Configure Row Level Security (RLS)

Run these policies in SQL Editor:

```sql
-- Users can read all active products
CREATE POLICY "Anyone can view active products"
ON products FOR SELECT
USING (is_active = true);

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (auth.uid()::text = user_id);

-- Users can create orders
CREATE POLICY "Users can create orders"
ON orders FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid()::text = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid()::text = id);

-- Users can view their wishlist
CREATE POLICY "Users can view own wishlist"
ON wishlists FOR SELECT
USING (auth.uid()::text = user_id);

-- Users can manage their wishlist
CREATE POLICY "Users can manage own wishlist"
ON wishlists FOR ALL
USING (auth.uid()::text = user_id);

-- Users can view their notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid()::text = user_id OR type = 'broadcast');
```

## 💻 Usage Examples

### Authentication

```typescript
import { userService } from '@/lib/supabase-services';

// Sign Up
const { data: user, error } = await userService.signUp(
  'user@example.com',
  'password123',
  'John Doe'
);

// Sign In
const { user, error } = await userService.signIn(
  'user@example.com',
  'password123'
);

// Get Profile
const { data: profile, error } = await userService.getProfile(userId);

// Update Profile
const { data, error } = await userService.updateProfile(userId, {
  name: 'New Name',
  phone: '1234567890'
});
```

### Products

```typescript
import { productService } from '@/lib/supabase-services';

// Get all products
const { data: products, error } = await productService.getAll();

// Get product by ID
const { data: product, error } = await productService.getById(productId);

// Search products
const { data: results, error } = await productService.search('shirt');

// Get by category
const { data: products, error } = await productService.getByCategory('Clothing');

// Get featured products
const { data: featured, error } = await productService.getFeatured();
```

### Orders

```typescript
import { orderService } from '@/lib/supabase-services';

// Create order
const { data: order, error } = await orderService.create({
  user_id: userId,
  items: [
    { product_id: '...', quantity: 2, price: 29.99 }
  ],
  total: 59.98,
  shipping_address: { /* ... */ },
  status: 'pending'
});

// Get user's orders
const { data: orders, error } = await orderService.getUserOrders(userId);

// Get order by ID
const { data: order, error } = await orderService.getById(orderId);
```

### Wishlist

```typescript
import { wishlistService } from '@/lib/supabase-services';

// Get user wishlist
const { data: wishlist, error } = await wishlistService.getUserWishlist(userId);

// Add to wishlist
const { data, error } = await wishlistService.add(userId, productId);

// Remove from wishlist
const { error } = await wishlistService.remove(userId, productId);

// Check if in wishlist
const { exists } = await wishlistService.isInWishlist(userId, productId);
```

### Real-time Subscriptions

```typescript
import { realtimeService } from '@/lib/supabase-services';
import { useEffect } from 'react';

// Subscribe to order updates
useEffect(() => {
  const channel = realtimeService.subscribeToOrders(userId, (payload) => {
    console.log('Order updated:', payload);
    // Update UI
  });

  return () => {
    realtimeService.unsubscribe(channel);
  };
}, [userId]);

// Subscribe to notifications
useEffect(() => {
  const channel = realtimeService.subscribeToNotifications(userId, (payload) => {
    console.log('New notification:', payload.new);
    // Show notification toast
  });

  return () => {
    realtimeService.unsubscribe(channel);
  };
}, [userId]);
```

### File Upload

```typescript
import { storageService } from '@/lib/supabase-services';

// Upload image
const file = /* ... get file from image picker ... */;
const fileName = `${Date.now()}-${Math.random()}.jpg`;

const { data, error } = await storageService.uploadImage(
  'products', // bucket name
  `images/${fileName}`, // path
  file
);

// Get public URL
const publicUrl = storageService.getPublicUrl('products', `images/${fileName}`);

// Delete image
await storageService.deleteImage('products', `images/${fileName}`);
```

## 🎯 Benefits of Serverless

✅ **No server maintenance** - Supabase handles everything
✅ **Auto-scaling** - Scales automatically with traffic
✅ **Real-time updates** - Built-in WebSocket connections
✅ **Offline support** - Works with React Query or SWR
✅ **Global CDN** - Fast worldwide
✅ **Automatic backups** - Point-in-time recovery
✅ **Cost-effective** - Pay only for what you use
✅ **Type-safe** - Full TypeScript support
✅ **Row Level Security** - Database-level permissions

## 🔐 Security Best Practices

1. **Never expose service_role key** - Use anon key in the app
2. **Enable RLS policies** - Protect your data at database level
3. **Validate input** - Even with RLS, validate user input
4. **Use HTTPS** - Supabase uses HTTPS by default
5. **Rotate keys** - If compromised, regenerate in dashboard

## 🚀 Deployment

### App Deployment (EAS Build):
```bash
npm install -g eas-cli
eas build:configure
eas build --platform android
eas build --platform ios
```

### Database is already deployed!
- Supabase handles all infrastructure
- Automatic backups
- Built-in monitoring
- No DevOps needed!

## 📊 Monitoring & Analytics

Access in Supabase Dashboard:
- **Database** - Table editor, SQL editor
- **Authentication** - User management
- **Storage** - File browser
- **Logs** - API logs, database logs
- **Reports** - Usage statistics

## 🆘 Troubleshooting

### "No connection to Supabase"
- Check EXPO_PUBLIC_SUPABASE_URL is correct
- Verify anon key is correct
- Ensure network connectivity

### "Row Level Security policy violation"
- Check RLS policies are set up
- Verify user authentication
- Use proper user_id in queries

### "File upload failed"
- Check storage bucket exists
- Verify bucket is public
- Check file size limits

### "Real-time not working"
- Enable Realtime in Supabase dashboard
- Check table replication settings
- Verify WebSocket connection

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [Real-time Docs](https://supabase.com/docs/guides/realtime)
- [Storage Docs](https://supabase.com/docs/guides/storage)

## 🎉 You're Done!

Your app is now fully serverless with Supabase! No backend server to maintain. 🚀

Start building features directly in your React Native app using the services in `lib/supabase-services.ts`.
