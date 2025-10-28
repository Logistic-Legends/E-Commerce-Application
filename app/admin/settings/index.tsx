import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import type { AdminSettingsParamList } from '@/types/navigation';

type SettingsCategory = {
  id: keyof AdminSettingsParamList;
  title: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  iconColor: string;
};
import { 
  Settings, 
  Users, 
  Package, 
  ShoppingCart, 
  Bell, 
  Layout, 
  Shield, 
  Database, 
  Zap,
  ChevronRight
} from 'lucide-react-native';

const settingsCategories: SettingsCategory[] = [
  {
    id: 'general',
    title: 'General Settings',
    description: 'Store name, logo, currency, language, tax',
    icon: Settings,
    iconColor: '#3B82F6',
  },
  {
    id: 'users',
    title: 'User & Role Management',
    description: 'Admin, staff, seller, and customer roles',
    icon: Users,
    iconColor: '#10B981',
  },
  {
    id: 'products',
    title: 'Product Settings',
    description: 'Stock rules, categories, discounts',
    icon: Package,
    iconColor: '#F59E0B',
  },
  {
    id: 'orders',
    title: 'Order & Checkout',
    description: 'Payment, shipping, invoices',
    icon: ShoppingCart,
    iconColor: '#8B5CF6',
  },
  {
    id: 'notifications',
    title: 'Notification Settings',
    description: 'Email, SMS, push notifications',
    icon: Bell,
    iconColor: '#EC4899',
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Payment gateways, delivery, analytics',
    icon: Zap,
    iconColor: '#F97316',
  },
  {
    id: 'theme',
    title: 'Theme & UI',
    description: 'Layout, banners, colors, fonts',
    icon: Layout,
    iconColor: '#6366F1',
  },
  {
    id: 'security',
    title: 'Security',
    description: '2FA, login limits, data backup',
    icon: Shield,
    iconColor: '#EF4444',
  },
  {
    id: 'advanced',
    title: 'Advanced Settings',
    description: 'SEO, database, maintenance',
    icon: Database,
    iconColor: '#6B7280',
  },
];

export default function AdminSettings() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Settings</Text>
        <Text style={styles.subtitle}>Manage your store's configuration and preferences</Text>
      </View>

      <View style={styles.cardsContainer}>
        {settingsCategories.map((category) => {
          const Icon = category.icon;
          return (
            <TouchableOpacity 
              key={category.id}
              style={styles.card}
              onPress={() => {
                router.push(`/(admin)/settings/${category.id}` as any);
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${category.iconColor}20` }]}>
                <Icon size={20} color={category.iconColor} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{category.title}</Text>
                <Text style={styles.cardDescription}>{category.description}</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  cardsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
});
