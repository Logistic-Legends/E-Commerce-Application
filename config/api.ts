// API Configuration (Legacy - Now using Supabase directly)
// This file is kept for backward compatibility and support tickets feature
// Most features now use direct Supabase queries

import { Platform } from 'react-native';

// Legacy API endpoints - Support tickets still use this
export const API_URL = 'http://localhost:5000/api';

export function resolveUrl(pathOrFull: string) {
  // Simple resolver for support tickets API
  if (/^https?:\/\//i.test(pathOrFull)) return pathOrFull;
  if (pathOrFull.startsWith('/')) return `${API_URL}${pathOrFull}`;
  return `${API_URL}/${pathOrFull}`;
}

// Helper function to create headers
export const createHeaders = (token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export default API_URL;
