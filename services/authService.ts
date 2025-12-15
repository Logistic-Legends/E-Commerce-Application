import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService } from '@/lib/supabase-services';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    _id?: string;
    id: string;
    name: string;
    email: string;
    role: string;
    token: string;
    avatar?: string;
  };
}

export const authService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const { data: users, error } = await userService.getByEmail(credentials.email);
      
      if (error || !users || users.length === 0) {
        throw new Error('Invalid email or password');
      }
      
      const user = users[0];
      
      // Verify password (simple check - in production use proper hashing)
      if (user.password !== credentials.password) {
        throw new Error('Invalid email or password');
      }
      
      // Create auth response
      const authData: AuthResponse = {
        success: true,
        data: {
          id: user.id,
          _id: user._id || user.id, // Use _id if available, fallback to id
          name: user.name,
          email: user.email,
          role: user.role,
          token: `token_${user.id}`, // Simple token
          avatar: user.avatar || undefined,
        }
      };
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('token', authData.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(authData.data));
      
      return authData;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  },

  // Register
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      // Check if user already exists
      const { data: existingUsers } = await userService.getByEmail(userData.email);
      if (existingUsers && existingUsers.length > 0) {
        throw new Error('Email already registered');
      }
      
      // Create new user
      const { data: newUser, error } = await userService.create({
        name: userData.name,
        email: userData.email,
        password: userData.password, // In production, hash this
        role: 'user',
        phone: userData.phone || null,
        loyalty_points: 0,
        membership_status: 'Bronze',
      });
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Registration failed');
      }
      
      if (!newUser) {
        throw new Error('Failed to create user');
      }
      
      // Create auth response
      const authData: AuthResponse = {
        success: true,
        data: {
          id: newUser.id,
          _id: newUser._id || newUser.id, // Use _id if available, fallback to id
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          token: `token_${newUser.id}`,
          avatar: newUser.avatar || undefined,
        }
      };
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('token', authData.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(authData.data));
      
      return authData;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Get token
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },
};
