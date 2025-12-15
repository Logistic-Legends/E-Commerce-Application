import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Box, Package2, Users, CreditCard, MessageSquare, Settings, TrendingUp, 
  DollarSign, ShoppingBag, UserPlus, ChevronUp, ChevronDown, Award } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, resolveUrl } from '../../config/api';
import { supabase } from '@/lib/supabase';

const StatCard = ({ title, value, subtext }: { title: string; value: string; subtext?: string }) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricTitle}>{title}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    {subtext && <Text style={styles.metricPeriod}>{subtext}</Text>}
  </View>
);

interface DashboardSection {
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  stats?: { value: string; label: string; }[];
}

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders?: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalSales: number;
  thisMonthSales: number;
  thisWeekSales: number;
  ordersChange: number; // Percentage change from last month
  salesChange: number; // Percentage change from last month
  // Profit metrics
  totalGrossProfit: number;
  totalRevenue: number;
  totalCost: number;
  profitMargin: number;
  thisMonthProfit: number;
  profitChange: number;
  // Other metrics
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  newCustomers: number;
  avgRating: number;
  newReviews: number;
  salesData: number[];
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
    trend: string;
  }>;
  supportStats?: {
    openTickets: number;
    totalBugReports: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchDashboardStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard...');
      fetchDashboardStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardStats();
    setRefreshing(false);
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading dashboard from Supabase...');
      setLastUpdated(new Date());
      
      // Fetch orders from Supabase
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*');
      
      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      }
      
      const orders = ordersData || [];
      console.log('📦 Total orders:', orders.length);
      
      // Filter only PAID orders for sales calculations
      const paidOrders = orders.filter((o: any) => o.is_paid === true);
      console.log('💰 Paid orders:', paidOrders.length);
      
      // Calculate order statistics (all orders)
      const totalOrders = orders.length;
      const pendingOrders = orders.filter((o: any) => o.status === 'pending').length;
      const processingOrders = orders.filter((o: any) => o.status === 'processing').length;
      const deliveredOrders = orders.filter((o: any) => o.status === 'delivered').length;
      const cancelledOrders = orders.filter((o: any) => o.status === 'cancelled').length;
      
      // Calculate sales statistics (ONLY PAID ORDERS)
      const totalSales = paidOrders.reduce((sum: number, order: any) => 
        sum + (order.total_price || order.total_amount || 0), 0);
      
      // This month sales (ONLY PAID)
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthPaidOrders = paidOrders.filter((o: any) => 
        new Date(o.created_at) >= firstDayOfMonth
      );
      const thisMonthSales = thisMonthPaidOrders.reduce((sum: number, order: any) => 
        sum + (order.total_price || order.total_amount || 0), 0);
      
      // This week sales (ONLY PAID)
      const firstDayOfWeek = new Date(now);
      firstDayOfWeek.setDate(now.getDate() - now.getDay());
      firstDayOfWeek.setHours(0, 0, 0, 0);
      const thisWeekPaidOrders = paidOrders.filter((o: any) => 
        new Date(o.created_at) >= firstDayOfWeek
      );
      const thisWeekSales = thisWeekPaidOrders.reduce((sum: number, order: any) => 
        sum + (order.total_price || order.total_amount || 0), 0);
      
      // Last month comparison (ONLY PAID)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const lastMonthPaidOrders = paidOrders.filter((o: any) => {
        const orderDate = new Date(o.created_at);
        return orderDate >= lastMonthStart && orderDate <= lastMonthEnd;
      });
      const lastMonthSales = lastMonthPaidOrders.reduce((sum: number, order: any) => 
        sum + (order.total_price || order.total_amount || 0), 0);
      
      const ordersChange = lastMonthPaidOrders.length > 0 
        ? ((thisMonthPaidOrders.length - lastMonthPaidOrders.length) / lastMonthPaidOrders.length * 100)
        : 0;
      const salesChange = lastMonthSales > 0 
        ? ((thisMonthSales - lastMonthSales) / lastMonthSales * 100)
        : 0;
      
      // Calculate profit (assuming 30% profit margin) - ONLY PAID ORDERS
      const totalRevenue = totalSales;
      const totalCost = totalSales * 0.7; // 70% cost
      const totalGrossProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue * 100) : 0;
      const thisMonthProfit = thisMonthSales * 0.3;
      const lastMonthProfit = lastMonthSales * 0.3;
      const profitChange = lastMonthProfit > 0 
        ? ((thisMonthProfit - lastMonthProfit) / lastMonthProfit * 100)
        : 0;
      
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');
      
      if (productsError) {
        console.error('Error fetching products:', productsError);
      }
      
      const products = productsData || [];
      const totalProducts = products.length;
      const lowStockProducts = products.filter((p: any) => 
        (p.total_stock || 0) < 10
      ).length;
      
      // Fetch users (customers)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, role, created_at');
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
      }
      
      const users = usersData || [];
      const totalCustomers = users.filter((u: any) => u.role === 'user').length;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const newCustomers = users.filter((u: any) => 
        u.role === 'user' && new Date(u.created_at) >= thirtyDaysAgo
      ).length;
      
      // Sales data for last 7 days (ONLY PAID ORDERS)
      const salesData: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const daySales = paidOrders
          .filter((o: any) => {
            const orderDate = new Date(o.created_at);
            return orderDate >= date && orderDate < nextDate;
          })
          .reduce((sum: number, order: any) => 
            sum + (order.total_price || order.total_amount || 0), 0);
        
        salesData.push(daySales);
      }
      
      // Top products (by order frequency in items) - ONLY PAID ORDERS
      const productSalesMap: { [key: string]: { name: string; sales: number; revenue: number } } = {};
      paidOrders.forEach((order: any) => {
        const items = order.items || [];
        items.forEach((item: any) => {
          const productId = item.product || item.id;
          if (!productSalesMap[productId]) {
            productSalesMap[productId] = {
              name: item.name || 'Unknown Product',
              sales: 0,
              revenue: 0
            };
          }
          productSalesMap[productId].sales += item.quantity || 1;
          productSalesMap[productId].revenue += (item.price || 0) * (item.quantity || 1);
        });
      });
      
      const topProducts = Object.values(productSalesMap)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)
        .map(p => ({
          ...p,
          trend: '+' + (Math.random() * 20).toFixed(1) + '%'
        }));
      
      // Fetch support tickets
      const { data: ticketsData } = await supabase
        .from('support_tickets')
        .select('status');
      
      const tickets = ticketsData || [];
      const openTickets = tickets.filter((t: any) => 
        t.status === 'open' || t.status === 'in_progress'
      ).length;
      
      const supportStats = {
        openTickets,
        totalBugReports: tickets.filter((t: any) => t.status === 'open').length
      };
      
      setStats({
        totalOrders,
        pendingOrders,
        processingOrders,
        deliveredOrders,
        cancelledOrders,
        totalSales,
        thisMonthSales,
        thisWeekSales,
        ordersChange: Math.round(ordersChange * 10) / 10,
        salesChange: Math.round(salesChange * 10) / 10,
        totalGrossProfit,
        totalRevenue,
        totalCost,
        profitMargin,
        thisMonthProfit,
        profitChange: Math.round(profitChange * 10) / 10,
        totalProducts,
        lowStockProducts,
        totalCustomers,
        newCustomers,
        avgRating: 4.5,
        newReviews: 0,
        salesData,
        topProducts,
        supportStats,
      });
      
      setLastUpdated(new Date());
      console.log('✅ Dashboard loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const sections: DashboardSection[] = [
    {
      title: 'Overview',
      description: 'Sales and performance metrics',
      icon: <TrendingUp size={24} color="#3B82F6" />,
      route: '/admin',
      stats: [
        { value: stats?.totalOrders.toString() || '0', label: 'Orders' },
        { value: '৳' + (stats?.totalSales.toFixed(0) || '0'), label: 'Revenue' },
      ]
    },
    {
      title: 'Product Management',
      description: 'Manage products and inventory',
      icon: <Box size={24} color="#8B5CF6" />,
      route: '/admin/products',
      stats: [
        { value: stats?.totalProducts.toString() || '0', label: 'Products' },
        { value: stats?.lowStockProducts.toString() || '0', label: 'Low Stock' },
      ]
    },
    {
      title: 'Order Management',
      description: 'Track and manage orders',
      icon: <Package2 size={24} color="#EC4899" />,
      route: '/admin/orders',
      stats: [
        { value: stats?.totalOrders.toString() || '0', label: 'Total Orders' },
        { value: stats?.pendingOrders.toString() || '0', label: 'Pending' },
      ]
    },
    {
      title: 'Customer Management',
      description: 'Manage users and customers',
      icon: <Users size={24} color="#10B981" />,
      route: '/admin/customers',
      stats: [
        { value: stats?.totalCustomers.toString() || '0', label: 'Users' },
        { value: stats?.newCustomers.toString() || '0', label: 'New' },
      ]
    },
    {
      title: 'User Support',
      description: 'Manage support tickets and bug reports',
      icon: <MessageSquare size={24} color="#EF4444" />,
      route: '/admin/support',
      stats: [
        { value: stats?.supportStats?.openTickets.toString() || '0', label: 'Open Tickets' },
        { value: stats?.supportStats?.totalBugReports.toString() || '0', label: 'Bug Reports' },
      ]
    },
    {
      title: 'Payment Management',
      description: 'Track payments and transactions',
      icon: <CreditCard size={24} color="#F59E0B" />,
      route: '/admin/payments',
      stats: [
        { value: '৳' + (stats?.totalSales.toFixed(0) || '0'), label: 'Total' },
        { value: stats?.totalOrders.toString() || '0', label: 'Transactions' },
      ]
    },
    {
      title: 'Settings',
      description: 'System configuration',
      icon: <Settings size={24} color="#6B7280" />,
      route: '/admin/settings',
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
        }
      >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Manage your e-commerce platform</Text>
        </View>
        {lastUpdated && (
          <Text style={styles.lastUpdated}>
            Updated: {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsSection}>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <ShoppingBag size={20} color="#3B82F6" />
              <Text style={styles.metricTitle}>Total Orders</Text>
            </View>
            <Text style={styles.metricValue}>{stats?.totalOrders || 0}</Text>
            <View style={styles.metricFooter}>
              {(stats?.ordersChange || 0) >= 0 ? (
                <ChevronUp size={16} color="#10B981" />
              ) : (
                <ChevronDown size={16} color="#EF4444" />
              )}
              <Text style={[styles.metricTrend, { color: (stats?.ordersChange || 0) >= 0 ? '#10B981' : '#EF4444' }]}>
                {(stats?.ordersChange || 0) >= 0 ? '+' : ''}{stats?.ordersChange || 0}%
              </Text>
              <Text style={styles.metricPeriod}>vs last month</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Package2 size={20} color="#F59E0B" />
              <Text style={styles.metricTitle}>Pending Orders</Text>
            </View>
            <Text style={styles.metricValue}>{stats?.pendingOrders || 0}</Text>
            <View style={styles.metricFooter}>
              <Text style={styles.metricPeriod}>Awaiting processing</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Award size={20} color="#10B981" />
              <Text style={styles.metricTitle}>Delivered Orders</Text>
            </View>
            <Text style={styles.metricValue}>{stats?.deliveredOrders || 0}</Text>
            <View style={styles.metricFooter}>
              <Text style={styles.metricPeriod}>Successfully completed</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <ChevronDown size={20} color="#EF4444" />
              <Text style={styles.metricTitle}>Cancelled Orders</Text>
            </View>
            <Text style={styles.metricValue}>{stats?.cancelledOrders || 0}</Text>
            <View style={styles.metricFooter}>
              <Text style={styles.metricPeriod}>Need attention</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, styles.salesCard]}>
            <View style={styles.metricHeader}>
              <DollarSign size={20} color="#8B5CF6" />
              <Text style={styles.metricTitle}>Total Sales</Text>
            </View>
            <Text style={styles.metricValue}>৳{stats?.totalSales.toLocaleString() || 0}</Text>
            <View style={styles.metricFooter}>
              {(stats?.salesChange || 0) >= 0 ? (
                <ChevronUp size={16} color="#10B981" />
              ) : (
                <ChevronDown size={16} color="#EF4444" />
              )}
              <Text style={[styles.metricTrend, { color: (stats?.salesChange || 0) >= 0 ? '#10B981' : '#EF4444' }]}>
                {(stats?.salesChange || 0) >= 0 ? '+' : ''}{stats?.salesChange || 0}%
              </Text>
              <Text style={styles.metricPeriod}>vs last month</Text>
            </View>
            <View style={styles.salesBreakdown}>
              <View style={styles.salesItem}>
                <Text style={styles.salesLabel}>This Month</Text>
                <Text style={styles.salesValue}>৳{stats?.thisMonthSales.toLocaleString() || 0}</Text>
              </View>
              <View style={styles.salesItem}>
                <Text style={styles.salesLabel}>This Week</Text>
                <Text style={styles.salesValue}>৳{stats?.thisWeekSales.toLocaleString() || 0}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Gross Profit Card */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, styles.profitCard]}>
            <View style={styles.metricHeader}>
              <TrendingUp size={20} color="#10B981" />
              <Text style={styles.metricTitle}>Gross Profit</Text>
            </View>
            <Text style={styles.metricValue}>৳{stats?.totalGrossProfit.toLocaleString() || 0}</Text>
            <View style={styles.metricFooter}>
              {(stats?.profitChange || 0) >= 0 ? (
                <ChevronUp size={16} color="#10B981" />
              ) : (
                <ChevronDown size={16} color="#EF4444" />
              )}
              <Text style={[styles.metricTrend, { color: (stats?.profitChange || 0) >= 0 ? '#10B981' : '#EF4444' }]}>
                {(stats?.profitChange || 0) >= 0 ? '+' : ''}{stats?.profitChange || 0}%
              </Text>
              <Text style={styles.metricPeriod}>vs last month</Text>
            </View>
            <View style={styles.salesBreakdown}>
              <View style={styles.salesItem}>
                <Text style={styles.salesLabel}>Profit Margin</Text>
                <Text style={styles.salesValue}>{stats?.profitMargin.toFixed(1) || 0}%</Text>
              </View>
              <View style={styles.salesItem}>
                <Text style={styles.salesLabel}>This Month</Text>
                <Text style={styles.salesValue}>৳{stats?.thisMonthProfit.toLocaleString() || 0}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Sales Overview Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Sales Overview</Text>
        <LineChart
          data={{
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
              data: stats?.salesData.length ? stats.salesData : [0, 0, 0, 0, 0, 0, 0]
            }]
          }}
          width={Dimensions.get('window').width - 32}
          height={220}
          chartConfig={{
            backgroundColor: '#FFFFFF',
            backgroundGradientFrom: '#FFFFFF',
            backgroundGradientTo: '#FFFFFF',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            style: {
              borderRadius: 16
            }
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Top Selling Products */}
      <View style={styles.productsSection}>
        <Text style={styles.sectionTitle}>Top Selling Products</Text>
        {(stats?.topProducts || []).map((product, index) => (
          <View key={index} style={styles.productRow}>
            <View style={styles.productInfo}>
              <Award size={20} color="#3B82F6" style={styles.productIcon} />
              <View>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productSales}>{product.sales} sales</Text>
              </View>
            </View>
            <View style={styles.productStats}>
              <Text style={styles.productRevenue}>৳{product.revenue.toLocaleString()}</Text>
              <Text style={styles.productTrend}>{product.trend}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.sectionsGrid}>
        {sections.map((section, index) => (
          <TouchableOpacity
            key={index}
            style={styles.sectionCard}
            onPress={() => router.push(section.route as any)}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                {section.icon}
              </View>
              <View style={styles.sectionTitles}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionDescription}>{section.description}</Text>
              </View>
            </View>
            {section.stats && (
              <View style={styles.sectionStats}>
                {section.stats.map((stat, statIndex) => (
                  <View key={statIndex} style={styles.statItem}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  lastUpdated: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metricsSection: {
    padding: 16,
    gap: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  metricFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricTrend: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
  },
  metricPeriod: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  chartSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chart: {
    marginTop: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  productsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productIcon: {
    backgroundColor: '#EBF5FF',
    padding: 8,
    borderRadius: 8,
  },
  productName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  productSales: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  productStats: {
    alignItems: 'flex-end',
  },
  productRevenue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  productTrend: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
  },
  sectionsGrid: {
    padding: 16,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitles: {
    flex: 1,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  sectionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  salesCard: {
    flex: 1,
  },
  profitCard: {
    flex: 1,
  },
  salesBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  salesItem: {
    alignItems: 'center',
  },
  salesLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  salesValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
    marginTop: 2,
  },
});
