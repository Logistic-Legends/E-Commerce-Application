// Ensure the runtime API override is set before any other modules are imported.
import './globalDev';
import { useEffect } from 'react';
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

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

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

  return (
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
  );
}