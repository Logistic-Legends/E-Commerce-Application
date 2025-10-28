// API Configuration
const isDevelopment = process.env.NODE_ENV === 'development';

// Backend API URL
// Use your computer's IP address for React Native to connect
export const API_URL = isDevelopment
  ? 'http://192.168.10.169:5000/api'  // Local development - your computer's IP
  : 'https://your-production-api.com/api';  // Production (update this)

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: `${API_URL}/auth/register`,
    LOGIN: `${API_URL}/auth/login`,
    ME: `${API_URL}/auth/me`,
  },
  
  // Products
  PRODUCTS: {
    LIST: `${API_URL}/products`,
    DETAIL: (id: string) => `${API_URL}/products/${id}`,
    REVIEW: (id: string) => `${API_URL}/products/${id}/reviews`,
  },
  
  // Categories
  CATEGORIES: {
    LIST: `${API_URL}/categories`,
    DETAIL: (id: string) => `${API_URL}/categories/${id}`,
  },
  
  // Orders
  ORDERS: {
    CREATE: `${API_URL}/orders`,
    MY_ORDERS: `${API_URL}/orders/myorders`,
    DETAIL: (id: string) => `${API_URL}/orders/${id}`,
    PAY: (id: string) => `${API_URL}/orders/${id}/pay`,
  },
  
  // User
  USER: {
    PROFILE: `${API_URL}/users/profile`,
    ADDRESSES: `${API_URL}/users/addresses`,
    ADDRESS_DETAIL: (id: string) => `${API_URL}/users/addresses/${id}`,
    WISHLIST: (productId: string) => `${API_URL}/users/wishlist/${productId}`,
  },
};

// Helper function to create headers with auth token
export const createHeaders = (token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// API Helper functions
export const apiClient = {
  get: async (url: string, token?: string) => {
    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(token),
    });
    return response.json();
  },
  
  post: async (url: string, data: any, token?: string) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: createHeaders(token),
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  put: async (url: string, data: any, token?: string) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: createHeaders(token),
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  delete: async (url: string, token?: string) => {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: createHeaders(token),
    });
    return response.json();
  },
};

export default API_URL;
