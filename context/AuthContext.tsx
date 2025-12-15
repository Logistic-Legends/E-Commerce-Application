import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/authService';

interface User {
  _id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'seller';
  avatar?: string;
  phone?: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userDataString = await AsyncStorage.getItem('user');
      
      if (token && userDataString) {
        const userData = JSON.parse(userDataString);
        setUser({ ...userData, token });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Please enter email and password');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Call Supabase for login
      const response = await authService.login({ email, password });
      
      console.log('Login response:', response);
      
      const userData: User = {
        _id: response.data.user?.id || response.data.user?._id || response.data._id,
        email: response.data.user?.email || response.data.email,
        name: response.data.user?.name || response.data.name,
        role: (response.data.user?.role || response.data.role || 'user') as 'user' | 'admin' | 'seller',
        avatar: response.data.user?.avatar || response.data.avatar,
        token: response.data.token,
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem('token', userData.token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      return userData;

    } catch (error: any) {
      console.error('Login error:', error);
      
      // Better error messages
      let errorMessage = 'Invalid email or password';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<User> => {
    setIsLoading(true);
    try {
      console.log('🔵 Starting registration...', { email, name });
      
      // Validate input
      if (!email || !password || !name) {
        throw new Error('Please fill in all fields');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Password validation
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Name validation
      if (name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters long');
      }

      console.log('✅ Validation passed, calling API...');

      // Call Supabase for registration
      const response = await authService.register({ email, password, name });
      
      console.log('✅ API response received:', response);

      const userData: User = {
        _id: response.data.user?.id || response.data.user?._id || response.data._id,
        email: response.data.user?.email || response.data.email,
        name: response.data.user?.name || response.data.name,
        role: (response.data.user?.role || response.data.role || 'user') as 'user' | 'admin' | 'seller',
        avatar: response.data.user?.avatar || response.data.avatar,
        token: response.data.token,
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem('token', userData.token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      console.log('✅ Registration successful!');
      return userData;

    } catch (error: any) {
      console.error('❌ Registration error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Better error messages
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === 'Network Error' || error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to server. Please make sure backend is running.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      // Clear all user-specific data
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('cart');
      await AsyncStorage.removeItem('wishlist');
      setUser(null);
      console.log('✅ User logged out and all data cleared');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (user) {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('✅ User updated in AuthContext');
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        login, 
        register, 
        logout,
        updateUser,
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}