import { useAuth } from '@/context/AuthContext';
import { Drawer } from 'expo-router/drawer';
import { ActivitySquare, Box, Users, ShoppingCart, CreditCard, Megaphone, MessageSquare, BarChart2, Settings, Package2, User, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function AdminLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after loading is complete
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.replace('/(auth)/login');
    }
  }, [user, isLoading]);

  // Show nothing while loading or if not authorized
  if (isLoading || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <Drawer
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1E40AF',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontFamily: 'Inter-SemiBold',
        },
        drawerStyle: {
          backgroundColor: '#FFFFFF',
        },
        drawerActiveTintColor: '#1E40AF',
        drawerInactiveTintColor: '#4B5563',
        drawerLabelStyle: {
          fontFamily: 'Inter-Medium',
        }
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Dashboard',
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color, size }) => <ActivitySquare size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="products"
        options={{
          title: 'Products',
          drawerLabel: 'Product Management',
          drawerIcon: ({ color, size }) => <Box size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="orders"
        options={{
          title: 'Orders',
          drawerLabel: 'Order Management',
          drawerIcon: ({ color, size }) => <Package2 size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="customers"
        options={{
          title: 'Customers',
          drawerLabel: 'Customer Management',
          drawerIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="payments"
        options={{
          title: 'Payments',
          drawerLabel: 'Payment Management',
          drawerIcon: ({ color, size }) => <CreditCard size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          drawerLabel: 'Notification Control',
          drawerIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="support"
        options={{
          title: 'Support',
          drawerLabel: 'Support Tickets',
          drawerIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          drawerLabel: 'System Settings',
          drawerIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: 'Profile',
          drawerLabel: 'Admin Profile',
          drawerIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Drawer>
  );
}
