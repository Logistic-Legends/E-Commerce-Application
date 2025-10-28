import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Box, Package2, Users, CreditCard, MessageSquare, Settings, TrendingUp, 
  DollarSign, ShoppingBag, UserPlus, ChevronUp, ChevronDown, Award } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';

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

export default function AdminDashboard() {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;

  const sections: DashboardSection[] = [
    {
      title: 'Overview',
      description: 'Sales and performance metrics',
      icon: <TrendingUp size={24} color="#3B82F6" />,
      route: '/admin',
      stats: [
        { value: '1,234', label: 'Orders' },
        { value: '$12,345', label: 'Revenue' },
      ]
    },
    {
      title: 'Product Management',
      description: 'Manage products and inventory',
      icon: <Box size={24} color="#8B5CF6" />,
      route: '/admin/products',
      stats: [
        { value: '789', label: 'Products' },
        { value: '12', label: 'Low Stock' },
      ]
    },
    {
      title: 'Order Management',
      description: 'Track and manage orders',
      icon: <Package2 size={24} color="#EC4899" />,
      route: '/admin/orders',
      stats: [
        { value: '156', label: 'New Orders' },
        { value: '43', label: 'Pending' },
      ]
    },
    {
      title: 'Customer Management',
      description: 'Manage users and customers',
      icon: <Users size={24} color="#10B981" />,
      route: '/admin/customers',
      stats: [
        { value: '2.1k', label: 'Users' },
        { value: '156', label: 'New' },
      ]
    },
    {
      title: 'Payment Management',
      description: 'Track payments and transactions',
      icon: <CreditCard size={24} color="#F59E0B" />,
      route: '/admin/payments',
      stats: [
        { value: '$9.2k', label: 'Pending' },
        { value: '89', label: 'Transactions' },
      ]
    },
    {
      title: 'Review Management',
      description: 'Manage customer reviews',
      icon: <MessageSquare size={24} color="#6366F1" />,
      route: '/admin/reviews',
      stats: [
        { value: '4.8', label: 'Avg Rating' },
        { value: '23', label: 'New Reviews' },
      ]
    },
    {
      title: 'Settings',
      description: 'System configuration',
      icon: <Settings size={24} color="#6B7280" />,
      route: '/admin/settings',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage your e-commerce platform</Text>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsSection}>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <ShoppingBag size={20} color="#3B82F6" />
              <Text style={styles.metricTitle}>Total Orders</Text>
            </View>
            <Text style={styles.metricValue}>1,234</Text>
            <View style={styles.metricFooter}>
              <ChevronUp size={16} color="#10B981" />
              <Text style={styles.metricTrend}>+12.5%</Text>
              <Text style={styles.metricPeriod}>vs last month</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Package2 size={20} color="#F59E0B" />
              <Text style={styles.metricTitle}>Pending Orders</Text>
            </View>
            <Text style={styles.metricValue}>156</Text>
            <View style={styles.metricFooter}>
              <ChevronUp size={16} color="#F59E0B" />
              <Text style={styles.metricTrend}>+8.3%</Text>
              <Text style={styles.metricPeriod}>vs last week</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Award size={20} color="#10B981" />
              <Text style={styles.metricTitle}>Delivered Orders</Text>
            </View>
            <Text style={styles.metricValue}>987</Text>
            <View style={styles.metricFooter}>
              <ChevronUp size={16} color="#10B981" />
              <Text style={styles.metricTrend}>+15.2%</Text>
              <Text style={styles.metricPeriod}>vs last month</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <ChevronDown size={20} color="#EF4444" />
              <Text style={styles.metricTitle}>Cancelled Orders</Text>
            </View>
            <Text style={styles.metricValue}>91</Text>
            <View style={styles.metricFooter}>
              <ChevronDown size={16} color="#EF4444" />
              <Text style={styles.metricTrend}>-3.1%</Text>
              <Text style={styles.metricPeriod}>vs last month</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, styles.salesCard]}>
            <View style={styles.metricHeader}>
              <DollarSign size={20} color="#8B5CF6" />
              <Text style={styles.metricTitle}>Total Sales</Text>
            </View>
            <Text style={styles.metricValue}>৳4,56,789</Text>
            <View style={styles.metricFooter}>
              <ChevronUp size={16} color="#10B981" />
              <Text style={styles.metricTrend}>+18.7%</Text>
              <Text style={styles.metricPeriod}>vs last month</Text>
            </View>
            <View style={styles.salesBreakdown}>
              <View style={styles.salesItem}>
                <Text style={styles.salesLabel}>This Month</Text>
                <Text style={styles.salesValue}>৳1,23,456</Text>
              </View>
              <View style={styles.salesItem}>
                <Text style={styles.salesLabel}>This Week</Text>
                <Text style={styles.salesValue}>৳34,567</Text>
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
              data: [12000, 19000, 15000, 25000, 22000, 30000, 28000]
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
        {[
          { name: 'Product A', sales: 234, revenue: '$2,345', trend: '+12.3%' },
          { name: 'Product B', sales: 189, revenue: '$1,890', trend: '+8.7%' },
          { name: 'Product C', sales: 145, revenue: '$1,450', trend: '+5.2%' },
          { name: 'Product D', sales: 126, revenue: '$1,260', trend: '+3.8%' }
        ].map((product, index) => (
          <View key={index} style={styles.productRow}>
            <View style={styles.productInfo}>
              <Award size={20} color="#3B82F6" style={styles.productIcon} />
              <View>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productSales}>{product.sales} sales</Text>
              </View>
            </View>
            <View style={styles.productStats}>
              <Text style={styles.productRevenue}>{product.revenue}</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
