import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, apiClient } from '../config/api';

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
      const token = await AsyncStorage.getItem('userToken');
      const userDataString = await AsyncStorage.getItem('userData');
      
      if (token && userDataString) {
        // Load from stored data (mock mode)
        const userData = JSON.parse(userDataString);
        setUser(userData);
      }
      
      // Uncomment below for real API when backend is ready
      /*
      if (token) {
        const response = await apiClient.get(API_ENDPOINTS.AUTH.ME, token);
        if (response.success) {
          setUser({ ...response.data, token });
        }
      }
      */
    } catch (error) {
      console.error('Error loading user:', error);
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      // Mock login - works without backend
      // Check for demo accounts
      let role: 'user' | 'admin' | 'seller' = 'user';
      
      if (email === 'admin@test.com' && password === 'admin123') {
        role = 'admin';
      } else if (email === 'user@test.com' && password === 'user123') {
        role = 'user';
      } else if (!email || !password) {
        throw new Error('Please enter email and password');
      }
      
      // Create mock user data
      const userData: User = {
        _id: Math.random().toString(36).substr(2, 9),
        email: email,
        name: email.split('@')[0],
        role: role,
        token: 'mock-token-' + Math.random().toString(36).substr(2, 9),
      };
      
      await AsyncStorage.setItem('userToken', userData.token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
      
      return userData;
      
      // Uncomment below for real API when backend is ready
      /*
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });

      if (response.success) {
        const userData = response.data;
        await AsyncStorage.setItem('userToken', userData.token);
        setUser(userData);
      } else {
        throw new Error(response.message || 'Login failed');
      }
      */
    } catch (error: any) {
      console.error('Login error:', error);
      setIsLoading(false);
      throw new Error(error.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<User> => {
    setIsLoading(true);
    try {
      // Mock registration - works without backend
      if (!email || !password || !name) {
        throw new Error('Please fill in all fields');
      }
      
      // Create mock user data
      const userData: User = {
        _id: Math.random().toString(36).substr(2, 9),
        email: email,
        name: name,
        role: 'user',
        token: 'mock-token-' + Math.random().toString(36).substr(2, 9),
      };
      
      await AsyncStorage.setItem('userToken', userData.token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
      
      return userData;
      
      // Uncomment below for real API when backend is ready
      /*
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        email,
        password,
        name,
      });

      if (response.success) {
        const userData = response.data;
        await AsyncStorage.setItem('userToken', userData.token);
        setUser(userData);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
      */
    } catch (error: any) {
      console.error('Registration error:', error);
      setIsLoading(false);
      throw new Error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
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