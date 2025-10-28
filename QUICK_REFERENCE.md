# 🎯 Quick Reference Guide - Team Members

## 📋 Member 1: Authentication & Profile

### Your Main Files:
```
app/(auth)/login.tsx
app/(auth)/register.tsx
app/(tabs)/profile.tsx
app/settings/index.tsx
app/settings/edit-profile.tsx
```

### Your Context:
```typescript
// Use this for authentication
import { useAuth } from '@/context/AuthContext';

const { user, login, register, logout, isAuthenticated } = useAuth();
```

### Your API Endpoints:
```typescript
// Login
POST /api/auth/login
Body: { email, password }

// Register
POST /api/auth/register
Body: { email, password, name }

// Get user info
GET /api/auth/me
Headers: { Authorization: Bearer TOKEN }

// Update profile
PUT /api/users/profile
Body: { name, phone, avatar }
```

### Sample Code:
```typescript
const handleLogin = async () => {
  try {
    await login(email, password);
    router.push('/(tabs)');
  } catch (error) {
    alert(error.message);
  }
};
```

---

## 📋 Member 2: Products & Search

### Your Main Files:
```
app/(tabs)/index.tsx          ✅ Already updated
app/(tabs)/search.tsx         ✅ Already updated
app/product/[id].tsx          ✅ Already updated
components/ProductCard.tsx    ⭐ Create this
```

### Your Context:
```typescript
// Use this for products
import { useProducts } from '@/context/ProductContext';

const { products, addProduct, updateProduct, deleteProduct, getProductById } = useProducts();
```

### Your API Endpoints:
```typescript
// Get all products
GET /api/products
Query: ?search=keyword&category=Electronics&page=1&limit=10

// Get single product
GET /api/products/:id

// Get categories
GET /api/categories

// Add review
POST /api/products/:id/reviews
Body: { rating, comment }
```

### Sample Code:
```typescript
const { products } = useProducts();

const filteredProducts = products.filter(p => 
  p.category === selectedCategory
);
```

---

## 📋 Member 3: Cart & Checkout

### Your Main Files:
```
app/(tabs)/cart.tsx
app/checkout.tsx
app/orders.tsx
components/CartItem.tsx       ⭐ Create this
```

### Your Context:
```typescript
// Use this for cart
import { useCart } from '@/context/CartContext';

const { cart, addToCart, removeFromCart, updateQuantity, clearCart, total } = useCart();
```

### Your API Endpoints:
```typescript
// Create order
POST /api/orders
Body: {
  items: [{ product, quantity, price }],
  shippingAddress: {...},
  paymentMethod: 'cash'
}

// Get my orders
GET /api/orders/myorders

// Get order details
GET /api/orders/:id

// Mark as paid
POST /api/orders/:id/pay

// Manage addresses
GET /api/users/addresses
POST /api/users/addresses
DELETE /api/users/addresses/:id
```

### Sample Code:
```typescript
const { cart, total } = useCart();

const handleCheckout = async () => {
  const order = {
    items: cart,
    shippingAddress: selectedAddress,
    paymentMethod: 'cash',
    totalAmount: total
  };
  
  const response = await apiClient.post(
    API_ENDPOINTS.ORDERS.CREATE, 
    order, 
    userToken
  );
};
```

---

## 📋 Member 4: Admin Panel

### Your Main Files:
```
app/admin/_layout.tsx         ✅ Done
app/admin/index.tsx           ⭐ Dashboard
app/admin/products.tsx        ✅ Done
app/admin/orders.tsx          ⭐ To do
app/admin/customers.tsx       ⭐ To do
app/admin/payments.tsx        ⭐ To do
```

### Your Context:
```typescript
// Use all contexts
import { useProducts } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';

// Check if user is admin
const { user } = useAuth();
if (user?.role !== 'admin') {
  router.push('/');
}
```

### Your API Endpoints:
```typescript
// Products (Admin)
GET /api/products (all)
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id

// Orders (Admin)
GET /api/orders (all orders)
PUT /api/orders/:id (update status)

// Users (Admin)
GET /api/users (all users)
PUT /api/users/:id (update user)
DELETE /api/users/:id

// Categories
POST /api/categories
PUT /api/categories/:id
DELETE /api/categories/:id
```

### Sample Code:
```typescript
const { products, addProduct, deleteProduct } = useProducts();

const handleAddProduct = () => {
  const newProduct = {
    id: Date.now().toString(),
    name: formData.name,
    price: parseFloat(formData.price),
    category: formData.category,
    stock: parseInt(formData.stock),
    images: [formData.image],
    description: formData.description,
    rating: 4.5,
    reviews: 0,
    isNew: true
  };
  
  addProduct(newProduct);
};
```

---

## 🔧 Common Code Snippets

### Navigation:
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// Navigate to screen
router.push('/product/123');
router.push('/(tabs)/cart');
router.back();
```

### API Call:
```typescript
import { apiClient, API_ENDPOINTS } from '@/config/api';

// GET request
const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.LIST);

// POST request with auth
const token = await AsyncStorage.getItem('userToken');
const response = await apiClient.post(
  API_ENDPOINTS.PRODUCTS.LIST,
  { name: 'Product' },
  token
);
```

### Loading State:
```typescript
const [isLoading, setIsLoading] = useState(false);

const fetchData = async () => {
  setIsLoading(true);
  try {
    const response = await apiClient.get(url);
    setData(response.data);
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    setIsLoading(false);
  }
};

// In JSX
{isLoading ? (
  <Text>Loading...</Text>
) : (
  <View>...</View>
)}
```

### Form Handling:
```typescript
const [formData, setFormData] = useState({
  name: '',
  email: '',
  password: ''
});

const handleChange = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};

// In JSX
<TextInput
  value={formData.name}
  onChangeText={(text) => handleChange('name', text)}
  placeholder="Enter name"
/>
```

---

## 🎨 Styling Guide

### Colors:
```typescript
const colors = {
  primary: '#3B82F6',      // Blue
  success: '#10B981',      // Green
  danger: '#EF4444',       // Red
  warning: '#F59E0B',      // Orange
  gray: '#6B7280',         // Gray
  lightGray: '#F3F4F6',    // Light Gray
  white: '#FFFFFF',
  black: '#111827'
};
```

### Common Styles:
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  }
});
```

---

## 🐛 Common Issues & Solutions

### Issue: Context not working
```typescript
// ❌ Wrong
const products = useProducts();

// ✅ Correct
const { products } = useProducts();
```

### Issue: Navigation not working
```typescript
// ❌ Wrong
router.push('/tabs/cart');

// ✅ Correct
router.push('/(tabs)/cart');
```

### Issue: Image not showing
```typescript
// ❌ Wrong
<Image source={product.image} />

// ✅ Correct
<Image source={{ uri: product.images[0] }} />
```

### Issue: API not connecting
```typescript
// Check config/api.ts
export const API_URL = 'http://YOUR_IP:5000/api';

// Get your IP:
// Windows: ipconfig
// Mac/Linux: ifconfig
```

---

## 📱 Testing Checklist

### Before Pushing Code:

- [ ] Code compiles: `npm start`
- [ ] No TypeScript errors
- [ ] Tested on web browser
- [ ] Tested on mobile (if possible)
- [ ] API calls work
- [ ] Loading states work
- [ ] Error handling works
- [ ] Navigation works
- [ ] Styling looks good
- [ ] No console errors

---

## 🚀 Git Commands

```bash
# Get latest code
git pull origin main

# Create your branch
git checkout -b feature/your-feature

# Check status
git status

# Add files
git add .

# Commit
git commit -m "Add login screen"

# Push
git push origin feature/your-feature

# Switch branch
git checkout main
```

---

## 💡 Pro Tips

### Member 1:
- Use `react-hook-form` for complex forms
- Add email validation regex
- Store token in AsyncStorage
- Test with different user roles

### Member 2:
- Use FlatList for long product lists
- Add pull-to-refresh
- Cache images
- Add skeleton loading

### Member 3:
- Calculate totals carefully
- Validate quantities
- Handle empty cart
- Add order confirmation

### Member 4:
- Add confirmation dialogs
- Validate admin role
- Show statistics
- Add export features

---

## 📞 Need Help?

### Ask Team:
- Stuck? Ask in team chat
- Found bug? Report immediately
- Need review? Tag team member

### Resources:
- Expo Docs: https://docs.expo.dev
- React Native: https://reactnative.dev
- TypeScript: https://typescriptlang.org

---

**Happy Coding! 🎉**
