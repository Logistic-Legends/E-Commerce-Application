import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (product: WishlistItem) => Promise<void>;
  removeFromWishlist: (id: string) => Promise<void>;
  isInWishlist: (id: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const { user } = useAuth();

  // Load wishlist from backend when user changes
  useEffect(() => {
    loadWishlist();
  }, [user?._id]);

  const loadWishlist = async () => {
    try {
      if (!user?._id) {
        setItems([]);
        return;
      }

      console.log('📦 Loading wishlist from Supabase for user:', user._id);

      // Fetch wishlist from Supabase
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', user._id);

      if (wishlistError) {
        console.log('⚠️ Wishlist load error:', wishlistError.message);
        setItems([]);
        return;
      }

      if (!wishlistData || wishlistData.length === 0) {
        console.log('ℹ️ Wishlist is empty');
        setItems([]);
        return;
      }

      // Get product IDs
      const productIds = wishlistData.map(w => w.product_id);

      // Fetch product details from Supabase with timeout
      const { data: products, error: productsError } = await Promise.race([
        supabase
          .from('products')
          .select('*')
          .in('id', productIds),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Wishlist load timeout')), 10000)
        )
      ]) as any;

      if (productsError) {
        console.log('⚠️ Products load error:', productsError.message);
        setItems([]);
        return;
      }

      // Transform to wishlist items
      const transformedItems = (products || []).map((product: any) => ({
        id: product.id,
        name: product.name || 'Product',
        price: product.price || 0,
        image: product.image || product.images?.[0] || '',
        category: product.category || 'General'
      }));

      setItems(transformedItems);
      console.log(`✅ Loaded ${transformedItems.length} wishlist items`);
    } catch (error: any) {
      console.log('⚠️ Error loading wishlist:', error.message);
      setItems([]);
    }
  };

  const addToWishlist = async (product: WishlistItem) => {
    try {
      if (!user?._id) {
        console.log('⚠️ No user logged in');
        return;
      }

      // Check if already in wishlist
      const exists = items.some(item => item.id === product.id);
      if (exists) {
        console.log('ℹ️ Product already in wishlist');
        return;
      }

      // Add to Supabase
      const { error } = await supabase
        .from('wishlists')
        .insert([{
          user_id: user._id,
          product_id: product.id
        }]);

      if (error) {
        console.log('⚠️ Failed to add to wishlist:', error.message);
        return;
      }

      // Add to local state
      setItems(prevItems => [...prevItems, product]);
      console.log(`✅ Added ${product.name} to wishlist`);
    } catch (error: any) {
      console.log('⚠️ Error adding to wishlist:', error.message);
    }
  };

  const removeFromWishlist = async (id: string) => {
    try {
      if (!user?._id) {
        console.log('⚠️ No user logged in');
        return;
      }

      // Remove from Supabase
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user._id)
        .eq('product_id', id);

      if (error) {
        console.log('⚠️ Failed to remove from wishlist:', error.message);
        return;
      }

      // Remove from local state
      setItems(prevItems => prevItems.filter(item => item.id !== id));
      console.log(`✅ Removed product from wishlist`);
    } catch (error: any) {
      console.log('⚠️ Error removing from wishlist:', error.message);
    }
  };

  const refreshWishlist = async () => {
    await loadWishlist();
  };

  const isInWishlist = (id: string) => {
    return items.some(item => item.id === id);
  };

  return (
    <WishlistContext.Provider value={{
      items,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      refreshWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}