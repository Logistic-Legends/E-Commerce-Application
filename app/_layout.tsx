// Ensure the runtime API override is set before any other modules are imported.
import './globalDev';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
// Development-time override: allow setting a runtime API base from global or process env.
// This helps testing with custom host IPs without needing to change source later.
// (We use `app/globalDev.ts` to set the runtime override early)
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { ProductProvider } from '@/context/ProductContext';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const [appReady, setAppReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // Initialize app and check storage health
  useEffect(() => {
    async function initializeApp() {
      try {
        // Test AsyncStorage availability
        await AsyncStorage.getItem('app_initialized');
        await AsyncStorage.setItem('app_initialized', 'true');
        setAppReady(true);
      } catch (error) {
        console.error('Storage initialization error:', error);
        // Even if storage fails, allow app to continue
        setAppReady(true);
      }
    }
    initializeApp();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Fallback: if fonts hang for some reason, hide splash after 5s to avoid permanent blank screen
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (!fontsLoaded && !fontError) {
      timer = setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {});
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer as any);
    };
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (!appReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Initializing Kinun24...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
            <WishlistProvider>
              <Stack 
            screenOptions={{
              headerShown: false,
              animation: 'none',
            }}
          >
            <Stack.Screen 
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="(auth)"
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="product/[id]"
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="checkout"
              options={{
                headerShown: false,
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen 
              name="orders"
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="+not-found"
              options={{
                presentation: 'modal',
              }}
            />
          </Stack>
          <StatusBar style="auto" />
            </WishlistProvider>
          </CartProvider>
        </ProductProvider>
      </AuthProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
});