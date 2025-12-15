import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
  size?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user } = useAuth();

  // Load cart from AsyncStorage when user changes
  useEffect(() => {
    loadCart();
  }, [user?._id]);

  const loadCart = async () => {
    try {
      if (!user?._id) {
        setItems([]);
        return;
      }
      const cartKey = `cart_${user._id}`;
      const cartData = await AsyncStorage.getItem(cartKey);
      if (cartData) {
        setItems(JSON.parse(cartData));
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setItems([]);
    }
  };

  const saveCart = async (cartItems: CartItem[]) => {
    try {
      if (user?._id) {
        const cartKey = `cart_${user._id}`;
        await AsyncStorage.setItem(cartKey, JSON.stringify(cartItems));
      }
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = (product: Omit<CartItem, 'quantity'>) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => 
        item.id === product.id && 
        item.color === product.color && 
        item.size === product.size
      );
      
      let newItems;
      if (existingItem) {
        newItems = prevItems.map(item =>
          item.id === product.id && 
          item.color === product.color && 
          item.size === product.size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...prevItems, { ...product, quantity: 1 }];
      }
      
      saveCart(newItems);
      return newItems;
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== id);
      saveCart(newItems);
      return newItems;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      saveCart(newItems);
      return newItems;
    });
  };

  const clearCart = async () => {
    setItems([]);
    if (user?._id) {
      const cartKey = `cart_${user._id}`;
      await AsyncStorage.removeItem(cartKey);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}