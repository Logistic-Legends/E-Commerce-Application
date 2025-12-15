import { supabase } from './supabase';
import type { Database } from './database.types';

type User = Database['public']['Tables']['users']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];

// ============= USER OPERATIONS =============

export const userService = {
  async signUp(email: string, password: string, name: string) {
    // Note: Using custom password field, not Supabase Auth
    // If you want Supabase Auth, use: supabase.auth.signUp()
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password, name, role: 'user' }])
      .select()
      .single();
    
    return { data, error };
  },

  async signIn(email: string, password: string) {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();
    
    if (error) return { user: null, error };
    
    // Update last login
    await supabase
      .from('users')
      .update({ last_login_activity: new Date().toISOString() })
      .eq('id', user.id);
    
    return { user, error: null };
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },

  async updateProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  },

  async uploadAvatar(userId: string, fileUri: string, fileExtension: string = 'jpg') {
    try {
      // Use fetch to read the file and convert to base64
      const response = await fetch(fileUri);
      const blob = await response.blob();
      
      // Use FileReader to convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Convert base64 to Uint8Array
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Generate unique filename
      const fileName = `avatar_${userId}_${Date.now()}.${fileExtension}`;
      const filePath = `avatars/${fileName}`;

      // Upload Uint8Array to Supabase Storage
      const { data, error } = await supabase.storage
        .from('products')
        .upload(filePath, bytes, {
          contentType: `image/${fileExtension}`,
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      return { url: urlData.publicUrl, error: null };
    } catch (error) {
      console.error('Avatar upload error:', error);
      return { url: null, error };
    }
  },

  async getByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    return { data, error };
  },

  async create(userData: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    return { data, error };
  },
};

// ============= PRODUCT OPERATIONS =============

export const productService = {
  async getAll() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  },

  async search(query: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async getByCategory(category: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('category', category)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async getFeatured() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(10);
    
    return { data, error };
  },
};

// ============= ORDER OPERATIONS =============

export const orderService = {
  async create(orderData: Database['public']['Tables']['orders']['Insert']) {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();
    
    return { data, error };
  },

  async getUserOrders(userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async getById(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    return { data, error };
  },

  async updateStatus(orderId: string, status: Order['status']) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();
    
    return { data, error };
  },
};

// ============= CATEGORY OPERATIONS =============

export const categoryService = {
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(categoryData: Database['public']['Tables']['categories']['Insert']) {
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(categoryId: string, updates: Database['public']['Tables']['categories']['Update']) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(categoryId: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);
    
    if (error) throw error;
    return true;
  },
};

// ============= SUBCATEGORY OPERATIONS =============

export const subcategoryService = {
  async getAll() {
    const { data, error } = await supabase
      .from('subcategories')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async getByCategoryId(categoryId: string) {
    const { data, error } = await supabase
      .from('subcategories')
      .select('*')
      .eq('category_id', categoryId)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async create(subcategoryData: Database['public']['Tables']['subcategories']['Insert']) {
    const { data, error } = await supabase
      .from('subcategories')
      .insert([subcategoryData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(subcategoryId: string, updates: Database['public']['Tables']['subcategories']['Update']) {
    const { data, error } = await supabase
      .from('subcategories')
      .update(updates)
      .eq('id', subcategoryId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(subcategoryId: string) {
    const { error } = await supabase
      .from('subcategories')
      .delete()
      .eq('id', subcategoryId);
    
    if (error) throw error;
    return true;
  },
};

// ============= ADDRESS OPERATIONS =============

export const addressService = {
  async getUserAddresses(userId: string) {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });
    
    return { data, error };
  },

  async create(addressData: Database['public']['Tables']['addresses']['Insert']) {
    const { data, error } = await supabase
      .from('addresses')
      .insert([addressData])
      .select()
      .single();
    
    return { data, error };
  },

  async update(addressId: string, updates: Database['public']['Tables']['addresses']['Update']) {
    const { data, error } = await supabase
      .from('addresses')
      .update(updates)
      .eq('id', addressId)
      .select()
      .single();
    
    return { data, error };
  },

  async delete(addressId: string) {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId);
    
    return { error };
  },

  async setDefault(addressId: string, userId: string) {
    // First, unset all default addresses for this user
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId);
    
    // Then set the new default
    const { data, error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .select()
      .single();
    
    return { data, error };
  },
};

// ============= NOTIFICATION OPERATIONS =============

export const notificationService = {
  async getUserNotifications(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${userId},type.eq.broadcast`)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  },

  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${userId},type.eq.broadcast`)
      .eq('is_read', false);
    
    return { count: count || 0, error };
  },

  async markAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single();
    
    return { data, error };
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .or(`user_id.eq.${userId},type.eq.broadcast`)
      .eq('is_read', false);
    
    return { error };
  },
};

// ============= WISHLIST OPERATIONS =============

export const wishlistService = {
  async getUserWishlist(userId: string) {
    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        *,
        products (*)
      `)
      .eq('user_id', userId)
      .order('added_at', { ascending: false });
    
    return { data, error };
  },

  async add(userId: string, productId: string) {
    const { data, error } = await supabase
      .from('wishlists')
      .insert([{ user_id: userId, product_id: productId }])
      .select()
      .single();
    
    return { data, error };
  },

  async remove(userId: string, productId: string) {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    
    return { error };
  },

  async isInWishlist(userId: string, productId: string) {
    const { data, error } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();
    
    return { exists: !!data, error };
  },
};

// ============= REALTIME SUBSCRIPTIONS =============

export const realtimeService = {
  subscribeToOrders(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },

  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },

  unsubscribe(channel: any) {
    return supabase.removeChannel(channel);
  },
};

// ============= STORAGE OPERATIONS =============

export const storageService = {
  async uploadImage(bucket: string, path: string, file: File | Blob) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    
    return { data, error };
  },

  async deleteImage(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    return { error };
  },

  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  },
};
