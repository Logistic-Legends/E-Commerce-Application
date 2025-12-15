import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Custom fetch for better Android compatibility
const customFetch: typeof fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  console.log(`🌐 [${Platform.OS}] Fetching:`, url);
  
  try {
    const response = await fetch(input, init);
    console.log(`✅ [${Platform.OS}] Response:`, response.status);
    return response;
  } catch (error) {
    console.error(`❌ [${Platform.OS}] Fetch failed:`, url, error);
    throw error;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: customFetch,
  },
});
