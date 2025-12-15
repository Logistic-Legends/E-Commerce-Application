// Example: How to use Supabase services in your React Native components

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { productService, wishlistService, realtimeService } from '@/lib/supabase-services';

// ============= Example 1: Fetch and Display Products =============
export function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data, error } = await productService.getAll();
    if (error) {
      console.error('Error loading products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  if (loading) return <ActivityIndicator />;

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View>
          <Text>{item.name}</Text>
          <Text>${item.regular_price}</Text>
        </View>
      )}
    />
  );
}

// ============= Example 2: Search Products =============
export function ProductSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  async function handleSearch(searchQuery: string) {
    setQuery(searchQuery);
    if (searchQuery.length > 2) {
      const { data, error } = await productService.search(searchQuery);
      if (!error) {
        setResults(data || []);
      }
    }
  }

  return (
    <View>
      {/* Add TextInput for search */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.name}</Text>}
      />
    </View>
  );
}

// ============= Example 3: Wishlist with Real-time =============
export function WishlistScreen({ userId }: { userId: string }) {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    loadWishlist();
  }, []);

  async function loadWishlist() {
    const { data, error } = await wishlistService.getUserWishlist(userId);
    if (!error) {
      setWishlist(data || []);
    }
  }

  async function toggleWishlist(productId: string) {
    const { exists } = await wishlistService.isInWishlist(userId, productId);
    
    if (exists) {
      await wishlistService.remove(userId, productId);
    } else {
      await wishlistService.add(userId, productId);
    }
    
    // Refresh wishlist
    loadWishlist();
  }

  return (
    <FlatList
      data={wishlist}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View>
          <Text>{item.products.name}</Text>
          <TouchableOpacity onPress={() => toggleWishlist(item.product_id)}>
            <Text>Remove</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

// ============= Example 4: Orders with Real-time Updates =============
export function OrdersScreen({ userId }: { userId: string }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadOrders();

    // Subscribe to real-time order updates
    const channel = realtimeService.subscribeToOrders(userId, (payload) => {
      console.log('Order updated:', payload);
      loadOrders(); // Refresh orders
    });

    return () => {
      realtimeService.unsubscribe(channel);
    };
  }, [userId]);

  async function loadOrders() {
    const { data, error } = await orderService.getUserOrders(userId);
    if (!error) {
      setOrders(data || []);
    }
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View>
          <Text>Order #{item.order_number}</Text>
          <Text>Status: {item.status}</Text>
          <Text>Total: ${item.total}</Text>
        </View>
      )}
    />
  );
}

// ============= Example 5: Create Order =============
export function CheckoutScreen({ userId, cartItems }: any) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);

    const total = cartItems.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    );

    const { data: order, error } = await orderService.create({
      user_id: userId,
      items: cartItems.map((item: any) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        name: item.name
      })),
      total,
      status: 'pending',
      payment_method: 'Cash on Delivery',
      shipping_address: {
        // Get from address form
        name: 'John Doe',
        street: '123 Main St',
        city: 'New York',
        postal_code: '10001'
      }
    });

    setLoading(false);

    if (error) {
      alert('Order failed: ' + error.message);
    } else {
      alert('Order placed successfully!');
      // Navigate to order confirmation
    }
  }

  return (
    <TouchableOpacity onPress={handleCheckout} disabled={loading}>
      <Text>{loading ? 'Processing...' : 'Place Order'}</Text>
    </TouchableOpacity>
  );
}

// ============= Example 6: User Profile =============
export function ProfileScreen({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data, error } = await userService.getProfile(userId);
    if (!error) {
      setProfile(data);
    }
  }

  async function updateProfile(updates: any) {
    const { data, error } = await userService.updateProfile(userId, updates);
    if (!error) {
      setProfile(data);
      alert('Profile updated!');
    }
  }

  if (!profile) return <ActivityIndicator />;

  return (
    <View>
      <Text>Name: {profile.name}</Text>
      <Text>Email: {profile.email}</Text>
      <Text>Points: {profile.loyalty_points}</Text>
      <Text>Tier: {profile.membership_tier}</Text>
      {/* Add edit form */}
    </View>
  );
}

// ============= Example 7: Notifications with Real-time =============
export function NotificationsScreen({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();

    // Subscribe to new notifications
    const channel = realtimeService.subscribeToNotifications(userId, (payload) => {
      console.log('New notification:', payload.new);
      loadNotifications();
      loadUnreadCount();
      // Show toast notification
    });

    return () => {
      realtimeService.unsubscribe(channel);
    };
  }, [userId]);

  async function loadNotifications() {
    const { data, error } = await notificationService.getUserNotifications(userId);
    if (!error) {
      setNotifications(data || []);
    }
  }

  async function loadUnreadCount() {
    const { count } = await notificationService.getUnreadCount(userId);
    setUnreadCount(count);
  }

  async function markAsRead(notificationId: string) {
    await notificationService.markAsRead(notificationId);
    loadNotifications();
    loadUnreadCount();
  }

  return (
    <View>
      <Text>Unread: {unreadCount}</Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => markAsRead(item.id)}>
            <View style={{ opacity: item.is_read ? 0.5 : 1 }}>
              <Text>{item.title}</Text>
              <Text>{item.message}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
