import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { CreditCard, Eye, Download, RefreshCw, AlertTriangle, TrendingUp, Filter, Search, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Transaction {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
  paymentMethod: 'bKash' | 'Nagad' | 'Card' | 'Bank Transfer' | 'Cash on Delivery';
  status: 'Success' | 'Pending' | 'Failed' | 'Refunded';
  gateway: string;
  date: string;
  time: string;
  refundAmount?: number;
  orderStatus: string;
  createdAt: string;
}

interface PaymentStats {
  totalRevenue: number;
  pendingAmount: number;
  refundedAmount: number;
  failedAmount: number;
  totalTransactions: number;
  successfulTransactions: number;
  successRate: number;
  todayRevenue: number;
  monthRevenue: number;
}

interface PaymentGateway {
  id: string;
  name: string;
  type: 'Mobile Banking' | 'Card' | 'Bank' | 'Digital Wallet' | 'Cash';
  status: 'Active' | 'Inactive';
  transactionFee: number;
  monthlyVolume: number;
  transactionCount: number;
}

export default function PaymentManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    pendingAmount: 0,
    refundedAmount: 0,
    failedAmount: 0,
    totalTransactions: 0,
    successfulTransactions: 0,
    successRate: 0,
    todayRevenue: 0,
    monthRevenue: 0,
  });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isRefundModalVisible, setIsRefundModalVisible] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'gateways' | 'reports'>('transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [methodFilter, setMethodFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchPaymentData();

    // Auto-refresh every 25 seconds
    const interval = setInterval(() => {
      console.log('💳 Auto-refreshing payment data...');
      fetchPaymentData();
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  const fetchPaymentData = async () => {
    await Promise.all([
      fetchTransactions(),
      fetchPaymentGateways(),
    ]);
    setLastUpdated(new Date());
  };

  const fetchTransactions = async () => {
    try {
      console.log('💳 Fetching payment transactions from Supabase...');
      
      // Fetch orders first
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('❌ Error fetching orders:', ordersError);
        throw ordersError;
      }

      if (!orders || orders.length === 0) {
        console.log('ℹ️ No orders found');
        setTransactions([]);
        calculateStats([]);
        return;
      }

      // Fetch users separately
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, _id, name, email');

      if (usersError) {
        console.warn('⚠️ Error fetching users:', usersError);
      }

      // Create a map of users by both id and _id for quick lookup
      const usersMap = new Map();
      if (users) {
        users.forEach((user: any) => {
          if (user.id) usersMap.set(user.id, user);
          if (user._id) usersMap.set(user._id, user);
        });
      }

      // Transform orders to transactions
      const txns: Transaction[] = orders.map((order: any) => {
        const createdAt = new Date(order.created_at);
        const paymentStatus = order.payment_status || 'pending';
        
        // Try to find user by user_id
        const user = usersMap.get(order.user_id);
        
        return {
          id: order.id,
          orderId: order.id,
          orderNumber: order.order_number || `ORD-${order.id.slice(0, 8)}`,
          customerId: order.user_id || 'Unknown',
          customerName: order.shipping_address?.name || user?.name || 'Guest',
          customerEmail: user?.email || '',
          amount: parseFloat(order.total_price) || parseFloat(order.total_amount) || 0,
          paymentMethod: order.payment_method || 'Cash on Delivery',
          status: paymentStatus === 'paid' ? 'Success' : 
                  paymentStatus === 'pending' ? 'Pending' :
                  paymentStatus === 'failed' ? 'Failed' :
                  paymentStatus === 'refunded' ? 'Refunded' : 'Pending',
          gateway: order.payment_method === 'bKash' ? 'bKash Payment Gateway' :
                   order.payment_method === 'Nagad' ? 'Nagad Payment Gateway' :
                   order.payment_method === 'Card' ? 'SSLCOMMERZ Gateway' :
                   order.payment_method === 'Bank Transfer' ? 'Bank Transfer' : 
                   'Cash on Delivery',
          date: createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          time: createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          refundAmount: 0,
          orderStatus: order.status || 'pending',
          createdAt: order.created_at,
        };
      });

      setTransactions(txns);
      calculateStats(txns);
      console.log(`✅ Loaded ${txns.length} payment transactions`);
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
      Alert.alert('Error', 'Failed to load payment transactions');
      setTransactions([]);
      calculateStats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (txns: Transaction[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalRevenue = txns.filter(t => t.status === 'Success').reduce((sum, t) => sum + t.amount, 0);
    const pendingAmount = txns.filter(t => t.status === 'Pending').reduce((sum, t) => sum + t.amount, 0);
    const refundedAmount = txns.filter(t => t.status === 'Refunded').reduce((sum, t) => sum + t.amount, 0);
    const failedAmount = txns.filter(t => t.status === 'Failed').reduce((sum, t) => sum + t.amount, 0);
    const totalTransactions = txns.length;
    const successfulTransactions = txns.filter(t => t.status === 'Success').length;
    const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;
    
    const todayRevenue = txns
      .filter(t => t.status === 'Success' && new Date(t.createdAt) >= today)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthRevenue = txns
      .filter(t => t.status === 'Success' && new Date(t.createdAt) >= firstDayOfMonth)
      .reduce((sum, t) => sum + t.amount, 0);

    setStats({
      totalRevenue,
      pendingAmount,
      refundedAmount,
      failedAmount,
      totalTransactions,
      successfulTransactions,
      successRate,
      todayRevenue,
      monthRevenue,
    });
  };

  const fetchPaymentGateways = async () => {
    try {
      console.log('💳 Calculating payment gateway statistics...');
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('payment_method, payment_status, total_price, created_at');

      if (error) throw error;

      if (orders) {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Group by payment method
        const gatewayData: { [key: string]: { volume: number; count: number } } = {};

        orders.forEach((order: any) => {
          const method = order.payment_method || 'Cash on Delivery';
          const orderDate = new Date(order.created_at);
          const amount = parseFloat(order.total_price) || 0;

          if (!gatewayData[method]) {
            gatewayData[method] = { volume: 0, count: 0 };
          }

          if (order.payment_status === 'paid' && orderDate >= firstDayOfMonth) {
            gatewayData[method].volume += amount;
            gatewayData[method].count += 1;
          }
        });

        const gateways: PaymentGateway[] = [
          {
            id: '1',
            name: 'bKash',
            type: 'Mobile Banking',
            status: 'Active',
            transactionFee: 1.5,
            monthlyVolume: gatewayData['bKash']?.volume || 0,
            transactionCount: gatewayData['bKash']?.count || 0,
          },
          {
            id: '2',
            name: 'Nagad',
            type: 'Mobile Banking',
            status: 'Active',
            transactionFee: 1.2,
            monthlyVolume: gatewayData['Nagad']?.volume || 0,
            transactionCount: gatewayData['Nagad']?.count || 0,
          },
          {
            id: '3',
            name: 'SSLCOMMERZ',
            type: 'Card',
            status: 'Active',
            transactionFee: 2.8,
            monthlyVolume: gatewayData['Card']?.volume || 0,
            transactionCount: gatewayData['Card']?.count || 0,
          },
          {
            id: '4',
            name: 'Bank Transfer',
            type: 'Bank',
            status: 'Active',
            transactionFee: 0.5,
            monthlyVolume: gatewayData['Bank Transfer']?.volume || 0,
            transactionCount: gatewayData['Bank Transfer']?.count || 0,
          },
          {
            id: '5',
            name: 'Cash on Delivery',
            type: 'Cash',
            status: 'Active',
            transactionFee: 0,
            monthlyVolume: gatewayData['Cash on Delivery']?.volume || 0,
            transactionCount: gatewayData['Cash on Delivery']?.count || 0,
          },
        ];

        setGateways(gateways);
        console.log('✅ Payment gateway statistics calculated');
      }
    } catch (error) {
      console.error('❌ Error fetching gateway data:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPaymentData();
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailVisible(true);
  };

  const handleRefund = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setRefundAmount(transaction.amount.toString());
    setRefundReason('');
    setIsRefundModalVisible(true);
  };

  const processRefund = async () => {
    if (!selectedTransaction) return;

    if (!refundAmount || parseFloat(refundAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid refund amount');
      return;
    }

    if (parseFloat(refundAmount) > selectedTransaction.amount) {
      Alert.alert('Invalid Amount', 'Refund amount cannot exceed transaction amount');
      return;
    }

    try {
      console.log('🔄 Processing refund for order:', selectedTransaction.orderId);

      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'refunded',
          notes: `Refund: ৳${refundAmount}${refundReason ? ` - ${refundReason}` : ''}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedTransaction.orderId);

      if (error) throw error;

      Alert.alert('Success', 'Refund processed successfully');
      setIsRefundModalVisible(false);
      setRefundAmount('');
      setRefundReason('');
      fetchPaymentData();
    } catch (error) {
      console.error('❌ Error processing refund:', error);
      Alert.alert('Error', 'Failed to process refund');
    }
  };

  const updatePaymentStatus = async (orderId: string, status: string) => {
    try {
      console.log('📝 Updating payment status:', orderId, status);

      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      Alert.alert('Success', 'Payment status updated successfully');
      fetchPaymentData();
    } catch (error) {
      console.error('❌ Error updating payment status:', error);
      Alert.alert('Error', 'Failed to update payment status');
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Payment method filter
    if (methodFilter !== 'All') {
      filtered = filtered.filter(t => t.paymentMethod === methodFilter);
    }

    // Date filter
    const now = new Date();
    if (dateFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(t => new Date(t.createdAt) >= today);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => new Date(t.createdAt) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filtered = filtered.filter(t => new Date(t.createdAt) >= monthAgo);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const calculatePaymentMethodBreakdown = () => {
    const total = transactions.filter(t => t.status === 'Success').length;
    if (total === 0) return [];

    const breakdown: { [key: string]: number } = {};
    transactions
      .filter(t => t.status === 'Success')
      .forEach(t => {
        breakdown[t.paymentMethod] = (breakdown[t.paymentMethod] || 0) + 1;
      });

    return Object.entries(breakdown).map(([method, count]) => ({
      method,
      count,
      percentage: ((count / total) * 100).toFixed(1),
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Success': 
      case 'Active': 
        return '#10B981';
      case 'Pending': return '#F59E0B';
      case 'Failed': return '#EF4444';
      case 'Refunded': return '#6B7280';
      case 'Inactive': return '#9CA3AF';
      default: return '#6B7280';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'bKash': return '#E91E63';
      case 'Nagad': return '#FF9800';
      case 'Card': return '#2196F3';
      case 'Bank Transfer': return '#4CAF50';
      case 'Cash on Delivery': return '#795548';
      default: return '#6B7280';
    }
  };

  const filteredTransactions = filterTransactions();
  const paymentBreakdown = calculatePaymentMethodBreakdown();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <CreditCard size={24} color="#1F2937" />
          <View>
            <Text style={styles.headerTitle}>Payment Management</Text>
            <Text style={styles.headerSubtitle}>Monitor all transactions and gateways</Text>
          </View>
        </View>
        {lastUpdated && (
          <Text style={styles.lastUpdated}>
            Updated: {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
          onPress={() => setActiveTab('transactions')}
        >
          <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>Transactions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'gateways' && styles.activeTab]}
          onPress={() => setActiveTab('gateways')}
        >
          <Text style={[styles.tabText, activeTab === 'gateways' && styles.activeTabText]}>Gateways</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>Reports</Text>
        </TouchableOpacity>
      </View>

      {/* Payment Stats */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
        contentContainerStyle={styles.statsContent}
      >
        <View style={[styles.statCard, { borderLeftColor: '#10B981', borderLeftWidth: 4 }]}>
          <View style={styles.statHeader}>
            <DollarSign size={20} color="#10B981" />
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
          <Text style={styles.statValue}>৳{stats.totalRevenue.toLocaleString()}</Text>
          <Text style={styles.statSubtext}>{stats.successfulTransactions} transactions</Text>
        </View>
        
        <View style={[styles.statCard, { borderLeftColor: '#F59E0B', borderLeftWidth: 4 }]}>
          <View style={styles.statHeader}>
            <Clock size={20} color="#F59E0B" />
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <Text style={styles.statValue}>৳{stats.pendingAmount.toLocaleString()}</Text>
          <Text style={styles.statSubtext}>Awaiting payment</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#6B7280', borderLeftWidth: 4 }]}>
          <View style={styles.statHeader}>
            <RefreshCw size={20} color="#6B7280" />
            <Text style={styles.statLabel}>Refunded</Text>
          </View>
          <Text style={styles.statValue}>৳{stats.refundedAmount.toLocaleString()}</Text>
          <Text style={styles.statSubtext}>Total refunds</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#3B82F6', borderLeftWidth: 4 }]}>
          <View style={styles.statHeader}>
            <TrendingUp size={20} color="#3B82F6" />
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
          <Text style={styles.statValue}>{stats.successRate.toFixed(1)}%</Text>
          <Text style={styles.statSubtext}>{stats.totalTransactions} total</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#8B5CF6', borderLeftWidth: 4 }]}>
          <View style={styles.statHeader}>
            <CheckCircle size={20} color="#8B5CF6" />
            <Text style={styles.statLabel}>Today's Revenue</Text>
          </View>
          <Text style={styles.statValue}>৳{stats.todayRevenue.toLocaleString()}</Text>
          <Text style={styles.statSubtext}>This month: ৳{stats.monthRevenue.toLocaleString()}</Text>
        </View>
      </ScrollView>

      {activeTab === 'transactions' && (
        <>
          {/* Search and Filter */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInput}>
              <Search size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Search by name, order, email..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setIsFilterVisible(true)}
            >
              <Filter size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          {/* Active Filters */}
          {(statusFilter !== 'All' || methodFilter !== 'All' || dateFilter !== 'all') && (
            <View style={styles.activeFilters}>
              <Text style={styles.filterLabel}>Active Filters:</Text>
              {statusFilter !== 'All' && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{statusFilter}</Text>
                  <TouchableOpacity onPress={() => setStatusFilter('All')}>
                    <Text style={styles.filterChipClose}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
              {methodFilter !== 'All' && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{methodFilter}</Text>
                  <TouchableOpacity onPress={() => setMethodFilter('All')}>
                    <Text style={styles.filterChipClose}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
              {dateFilter !== 'all' && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{dateFilter}</Text>
                  <TouchableOpacity onPress={() => setDateFilter('all')}>
                    <Text style={styles.filterChipClose}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Transaction List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : filteredTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <CreditCard size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || statusFilter !== 'All' || methodFilter !== 'All' 
                  ? 'Try adjusting your filters' 
                  : 'Transactions will appear here when orders are placed'}
              </Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.transactionList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
              }
            >
              {filteredTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionId}>#{transaction.orderNumber}</Text>
                    <Text style={styles.customerName}>{transaction.customerName}</Text>
                    {transaction.customerEmail && (
                      <Text style={styles.customerEmail}>{transaction.customerEmail}</Text>
                    )}
                  </View>
                  <View style={styles.transactionActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleViewTransaction(transaction)}
                    >
                      <Eye size={16} color="#3B82F6" />
                    </TouchableOpacity>
                    {transaction.status === 'Success' && (
                      <TouchableOpacity
                        style={styles.refundButton}
                        onPress={() => handleRefund(transaction)}
                      >
                        <RefreshCw size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                    {transaction.status === 'Pending' && (
                      <TouchableOpacity
                        style={styles.successButton}
                        onPress={() => updatePaymentStatus(transaction.orderId, 'paid')}
                      >
                        <CheckCircle size={16} color="#10B981" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                
                <View style={styles.transactionDetails}>
                  <View style={styles.amountContainer}>
                    <Text style={styles.amount}>৳{transaction.amount.toLocaleString()}</Text>
                    <View style={[styles.methodBadge, { backgroundColor: getPaymentMethodColor(transaction.paymentMethod) }]}>
                      <Text style={styles.methodText}>{transaction.paymentMethod}</Text>
                    </View>
                  </View>
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) }]}>
                      <Text style={styles.statusText}>{transaction.status}</Text>
                    </View>
                    <Text style={styles.dateTime}>{transaction.date} • {transaction.time}</Text>
                  </View>
                  <Text style={styles.gatewayText}>via {transaction.gateway}</Text>
                </View>
              </View>
              ))}
            </ScrollView>
          )}
        </>
      )}

      {activeTab === 'gateways' && (
        <ScrollView 
          style={styles.gatewayList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
          }
        >
          {gateways
            .sort((a, b) => b.monthlyVolume - a.monthlyVolume)
            .map((gateway) => (
            <View key={gateway.id} style={styles.gatewayCard}>
              <View style={styles.gatewayHeader}>
                <View style={styles.gatewayTitleSection}>
                  <Text style={styles.gatewayName}>{gateway.name}</Text>
                  <Text style={styles.gatewayType}>{gateway.type}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(gateway.status) }]}>
                  <Text style={styles.statusText}>{gateway.status}</Text>
                </View>
              </View>
              
              <View style={styles.gatewayStats}>
                <View style={styles.gatewayStat}>
                  <Text style={styles.gatewayStatLabel}>Transaction Fee</Text>
                  <Text style={styles.gatewayStatValue}>{gateway.transactionFee}%</Text>
                </View>
                <View style={styles.gatewayStat}>
                  <Text style={styles.gatewayStatLabel}>Monthly Volume</Text>
                  <Text style={styles.gatewayStatValue}>৳{gateway.monthlyVolume.toLocaleString()}</Text>
                </View>
                <View style={styles.gatewayStat}>
                  <Text style={styles.gatewayStatLabel}>Transactions</Text>
                  <Text style={styles.gatewayStatValue}>{gateway.transactionCount}</Text>
                </View>
              </View>

              {gateway.monthlyVolume > 0 && (
                <View style={styles.gatewayProgress}>
                  <View 
                    style={[
                      styles.gatewayProgressBar,
                      { width: `${Math.min((gateway.monthlyVolume / Math.max(...gateways.map(g => g.monthlyVolume))) * 100, 100)}%` }
                    ]}
                  />
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {activeTab === 'reports' && (
        <ScrollView 
          style={styles.reportsContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
          }
        >
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Payment Method Distribution</Text>
            {paymentBreakdown.length > 0 ? (
              paymentBreakdown.map((item, index) => (
                <View key={index} style={styles.reportItem}>
                  <View style={styles.reportItemLeft}>
                    <View style={[styles.reportDot, { backgroundColor: getPaymentMethodColor(item.method) }]} />
                    <Text style={styles.reportLabel}>{item.method}</Text>
                  </View>
                  <View style={styles.reportItemRight}>
                    <Text style={styles.reportCount}>{item.count} txns</Text>
                    <Text style={styles.reportValue}>{item.percentage}%</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No payment data available</Text>
            )}
          </View>

          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Revenue Summary</Text>
            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>Total Revenue</Text>
              <Text style={[styles.reportValue, { color: '#10B981' }]}>৳{stats.totalRevenue.toLocaleString()}</Text>
            </View>
            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>This Month</Text>
              <Text style={styles.reportValue}>৳{stats.monthRevenue.toLocaleString()}</Text>
            </View>
            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>Today</Text>
              <Text style={styles.reportValue}>৳{stats.todayRevenue.toLocaleString()}</Text>
            </View>
            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>Pending Payments</Text>
              <Text style={[styles.reportValue, { color: '#F59E0B' }]}>৳{stats.pendingAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>Total Refunds</Text>
              <Text style={[styles.reportValue, { color: '#EF4444' }]}>৳{stats.refundedAmount.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Performance Metrics</Text>
            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>Success Rate</Text>
              <Text style={[styles.reportValue, { color: '#10B981' }]}>{stats.successRate.toFixed(1)}%</Text>
            </View>
            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>Total Transactions</Text>
              <Text style={styles.reportValue}>{stats.totalTransactions}</Text>
            </View>
            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>Successful Payments</Text>
              <Text style={[styles.reportValue, { color: '#10B981' }]}>{stats.successfulTransactions}</Text>
            </View>
            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>Average Transaction</Text>
              <Text style={styles.reportValue}>
                ৳{stats.successfulTransactions > 0 
                  ? (stats.totalRevenue / stats.successfulTransactions).toFixed(0) 
                  : '0'}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Filter Modal */}
      <Modal
        visible={isFilterVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsFilterVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Transactions</Text>
              <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.filterContent}>
              <Text style={styles.filterSectionTitle}>Payment Status</Text>
              <View style={styles.filterOptions}>
                {['All', 'Success', 'Pending', 'Failed', 'Refunded'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.filterOption, statusFilter === status && styles.filterOptionActive]}
                    onPress={() => setStatusFilter(status)}
                  >
                    <Text style={[styles.filterOptionText, statusFilter === status && styles.filterOptionTextActive]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Payment Method</Text>
              <View style={styles.filterOptions}>
                {['All', 'bKash', 'Nagad', 'Card', 'Bank Transfer', 'Cash on Delivery'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[styles.filterOption, methodFilter === method && styles.filterOptionActive]}
                    onPress={() => setMethodFilter(method)}
                  >
                    <Text style={[styles.filterOptionText, methodFilter === method && styles.filterOptionTextActive]}>
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Date Range</Text>
              <View style={styles.filterOptions}>
                {[
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'Last 7 Days' },
                  { value: 'month', label: 'Last 30 Days' },
                  { value: 'all', label: 'All Time' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.filterOption, dateFilter === option.value && styles.filterOptionActive]}
                    onPress={() => setDateFilter(option.value as any)}
                  >
                    <Text style={[styles.filterOptionText, dateFilter === option.value && styles.filterOptionTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.filterActions}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setStatusFilter('All');
                  setMethodFilter('All');
                  setDateFilter('all');
                }}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setIsFilterVisible(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Transaction Detail Modal */}
      <Modal
        visible={isDetailVisible}
        animationType="slide"
        onRequestClose={() => setIsDetailVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Transaction Details</Text>
            <TouchableOpacity onPress={() => setIsDetailVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          {selectedTransaction && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Transaction Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order Number:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.orderNumber}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.id.slice(0, 16)}...</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Customer:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.customerName}</Text>
                </View>
                {selectedTransaction.customerEmail && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.customerEmail}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={[styles.detailValue, { fontSize: 18, fontFamily: 'Inter-Bold', color: '#10B981' }]}>
                    ৳{selectedTransaction.amount.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Method:</Text>
                  <View style={[styles.methodBadge, { backgroundColor: getPaymentMethodColor(selectedTransaction.paymentMethod) }]}>
                    <Text style={styles.methodText}>{selectedTransaction.paymentMethod}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gateway:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.gateway}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedTransaction.status) }]}>
                    <Text style={styles.statusText}>{selectedTransaction.status}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order Status:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.orderStatus}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.time}</Text>
                </View>
              </View>

              {selectedTransaction.status === 'Success' && (
                <TouchableOpacity
                  style={styles.refundButtonLarge}
                  onPress={() => {
                    setIsDetailVisible(false);
                    setTimeout(() => handleRefund(selectedTransaction), 300);
                  }}
                >
                  <RefreshCw size={20} color="#FFFFFF" />
                  <Text style={styles.refundButtonLargeText}>Process Refund</Text>
                </TouchableOpacity>
              )}

              {selectedTransaction.status === 'Pending' && (
                <TouchableOpacity
                  style={styles.markPaidButton}
                  onPress={() => {
                    setIsDetailVisible(false);
                    updatePaymentStatus(selectedTransaction.orderId, 'paid');
                  }}
                >
                  <CheckCircle size={20} color="#FFFFFF" />
                  <Text style={styles.markPaidButtonText}>Mark as Paid</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Refund Modal */}
      <Modal
        visible={isRefundModalVisible}
        animationType="slide"
        onRequestClose={() => setIsRefundModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Process Refund</Text>
            <TouchableOpacity onPress={() => setIsRefundModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {selectedTransaction && (
              <>
                <View style={styles.refundInfo}>
                  <Text style={styles.refundInfoLabel}>Order: {selectedTransaction.orderNumber}</Text>
                  <Text style={styles.refundInfoLabel}>Customer: {selectedTransaction.customerName}</Text>
                  <Text style={styles.refundInfoAmount}>
                    Transaction Amount: ৳{selectedTransaction.amount.toLocaleString()}
                  </Text>
                </View>

                <Text style={styles.refundLabel}>Refund Amount (৳) *</Text>
                <TextInput
                  style={styles.refundInput}
                  value={refundAmount}
                  onChangeText={setRefundAmount}
                  keyboardType="numeric"
                  placeholder="Enter refund amount"
                />

                <Text style={styles.refundLabel}>Reason (Optional)</Text>
                <TextInput
                  style={[styles.refundInput, styles.refundTextArea]}
                  value={refundReason}
                  onChangeText={setRefundReason}
                  placeholder="Enter reason for refund"
                  multiline
                  numberOfLines={4}
                />

                <View style={styles.refundWarning}>
                  <AlertTriangle size={20} color="#F59E0B" />
                  <Text style={styles.refundWarningText}>
                    This action will update the payment status to "Refunded". Make sure to process the actual refund through your payment gateway.
                  </Text>
                </View>

                <View style={styles.refundActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setIsRefundModalVisible(false);
                      setRefundAmount('');
                      setRefundReason('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.processButton}
                    onPress={processRefund}
                  >
                    <Text style={styles.processButtonText}>Process Refund</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsContent: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: '#EBF4FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
  },
  filterChipClose: {
    fontSize: 14,
    color: '#3B82F6',
  },
  transactionList: {
    flex: 1,
    padding: 16,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionId: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  customerName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  customerEmail: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 2,
  },
  transactionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    backgroundColor: '#EBF4FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refundButton: {
    width: 32,
    height: 32,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successButton: {
    width: 32,
    height: 32,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDetails: {
    gap: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  methodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  methodText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  dateTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  gatewayText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  gatewayList: {
    flex: 1,
    padding: 16,
  },
  gatewayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gatewayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gatewayTitleSection: {
    flex: 1,
  },
  gatewayName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  gatewayType: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  gatewayStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  gatewayStat: {
    flex: 1,
  },
  gatewayStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  gatewayStatValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  gatewayProgress: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  gatewayProgressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  reportsContainer: {
    flex: 1,
    padding: 16,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reportTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  reportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reportItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reportItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reportDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  reportLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  reportCount: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  reportValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  noDataText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  filterContent: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterOptionActive: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },
  filterOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  filterOptionTextActive: {
    color: '#3B82F6',
  },
  filterActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  closeButton: {
    fontSize: 24,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  refundButtonLarge: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  refundButtonLargeText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  markPaidButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  markPaidButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  refundInfo: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  refundInfoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  refundInfoAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 8,
  },
  refundLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  refundInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  refundTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  refundWarning: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    gap: 12,
    marginBottom: 20,
  },
  refundWarningText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#92400E',
  },
  refundActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  processButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  processButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
