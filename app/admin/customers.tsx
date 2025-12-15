import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Users, Eye, Edit2, Mail, Phone, MapPin, Package, Star, Gift, Shield, Search, Filter, X, Save, DollarSign, Calendar } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Customer {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  membershipLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Titanium';
  totalOrders: number;
  totalSpent: number;
  avgOrderValue?: number;
  loyaltyPoints: number;
  joinDate: string;
  lastActive: string;
  avatar?: string;
  gender?: string;
  dateOfBirth?: string;
  fullAddress?: string;
  addresses?: any[];
  orderHistory?: Array<{
    id: string;
    orderId: string;
    date: string;
    total: number;
    status: string;
    itemCount: number;
    paymentMethod: string;
  }>;
  pointsHistory?: Array<{
    points: number;
    reason: string;
    createdAt: string;
  }>;
}

interface Stats {
  totalCustomers: number;
  activeCustomers: number;
  goldMembers: number;
  silverMembers: number;
  platinumMembers: number;
  bronzeMembers: number;
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    activeCustomers: 0,
    goldMembers: 0,
    silverMembers: 0,
    platinumMembers: 0,
    bronzeMembers: 0
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isEditVisible, setIsEditVisible] = useState(false);
  const [isPointsModalVisible, setIsPointsModalVisible] = useState(false);
  const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [membershipFilter, setMembershipFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    fullAddress: '',
    membershipTier: ''
  });
  
  // Points form state
  const [pointsForm, setPointsForm] = useState({
    points: '',
    reason: ''
  });
  
  // Email form state
  const [emailForm, setEmailForm] = useState({
    subject: '',
    message: ''
  });

  useEffect(() => {
    fetchCustomers();
    
    // Auto-refresh every 60 seconds (customers don't change as frequently)
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing customers...');
      fetchCustomers();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [customers, searchQuery, membershipFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      console.log('🔑 Fetching customers from Supabase...');
      
      // Fetch users from Supabase
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (usersError) {
        console.warn('⚠️ Supabase users error:', usersError);
        // If no users table in Supabase, show empty state
        setCustomers([]);
        setFilteredCustomers([]);
        setStats({
          totalCustomers: 0,
          activeCustomers: 0,
          goldMembers: 0,
          silverMembers: 0,
          platinumMembers: 0,
          bronzeMembers: 0
        });
        setLoading(false);
        return;
      }
      
      if (!users || users.length === 0) {
        console.log('ℹ️ No users found in Supabase');
        setCustomers([]);
        setFilteredCustomers([]);
        setStats({
          totalCustomers: 0,
          activeCustomers: 0,
          goldMembers: 0,
          silverMembers: 0,
          platinumMembers: 0,
          bronzeMembers: 0
        });
        setLoading(false);
        return;
      }
      
      // Fetch all orders to calculate customer stats
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*');
      
      if (ordersError) console.warn('⚠️ Orders error:', ordersError);
      
      // Transform users data to customer format with calculated stats
      const customersData: Customer[] = await Promise.all((users || []).map(async (user: any) => {
        // Filter orders for this user - use _id for matching with orders
        const userOrders = orders?.filter((o: any) => o.user_id === (user._id || user.id)) || [];
        const paidOrders = userOrders.filter((o: any) => o.is_paid === true);
        
        // Calculate stats
        const totalOrders = userOrders.length;
        const totalSpent = paidOrders.reduce((sum: number, order: any) => sum + (order.total_price || 0), 0);
        const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
        
        // Get loyalty points and tier
        const loyaltyPoints = user.loyalty_points || 0;
        const membershipLevel = user.membership_status || 'Bronze';
        
        // Determine status based on last activity
        const lastOrderDate = userOrders.length > 0 
          ? new Date(Math.max(...userOrders.map((o: any) => new Date(o.created_at).getTime())))
          : new Date(user.created_at);
        const daysSinceLastOrder = Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
        const status = daysSinceLastOrder > 90 ? 'Inactive' : 'Active';
        
        return {
          id: user.id,
          customerId: `CUS-${user.id.substring(0, 8).toUpperCase()}`,
          name: user.name || 'N/A',
          email: user.email || 'N/A',
          phone: user.phone || 'N/A',
          status: status as 'Active' | 'Inactive' | 'Suspended',
          membershipLevel: membershipLevel as 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Titanium',
          totalOrders,
          totalSpent,
          avgOrderValue,
          loyaltyPoints,
          joinDate: user.created_at,
          lastActive: lastOrderDate.toISOString(),
          avatar: user.avatar || undefined,
          gender: user.gender || undefined,
          dateOfBirth: user.date_of_birth || undefined,
          fullAddress: user.full_address || undefined,
          addresses: user.addresses || [],
        };
      }));
      
      // Calculate stats
      const activeCustomers = customersData.filter(c => c.status === 'Active').length;
      const goldMembers = customersData.filter(c => c.membershipLevel === 'Gold').length;
      const silverMembers = customersData.filter(c => c.membershipLevel === 'Silver').length;
      const platinumMembers = customersData.filter(c => c.membershipLevel === 'Platinum').length;
      const bronzeMembers = customersData.filter(c => c.membershipLevel === 'Bronze').length;
      
      setCustomers(customersData);
      setStats({
        totalCustomers: customersData.length,
        activeCustomers,
        goldMembers,
        silverMembers,
        platinumMembers,
        bronzeMembers
      });
      setFilteredCustomers(customersData);
      
      console.log('✅ Customers loaded:', customersData.length);
    } catch (error) {
      console.error('❌ Error fetching customers:', error);
      Alert.alert('Error', 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = customers;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.customerId.toLowerCase().includes(query) ||
        customer.phone.includes(query)
      );
    }
    
    if (membershipFilter !== 'All') {
      filtered = filtered.filter(customer => customer.membershipLevel === membershipFilter);
    }
    
    setFilteredCustomers(filtered);
  };

  const fetchCustomerDetails = async (customerId: string) => {
    try {
      console.log('🔍 Fetching customer details for:', customerId);
      
      // Fetch user details
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', customerId)
        .single();
      
      if (userError) throw userError;
      
      // Fetch customer's orders with details
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', customerId)
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;
      
      // Fetch loyalty points history
      const { data: pointsHistory, error: pointsError } = await supabase
        .from('loyalty_points_history')
        .select('*')
        .eq('user_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      // Transform order history
      const orderHistory = (orders || []).map((order: any) => ({
        id: order._id,
        orderId: order.order_number || `ORD-${order._id.substring(0, 8)}`,
        date: order.created_at,
        total: order.total_price || 0,
        status: order.order_status || 'Pending',
        itemCount: order.items?.length || 0,
        paymentMethod: order.payment_method || 'N/A'
      }));
      
      // Calculate stats
      const paidOrders = orders?.filter((o: any) => o.is_paid === true) || [];
      const totalSpent = paidOrders.reduce((sum: number, order: any) => sum + (order.total_price || 0), 0);
      
      const detailedCustomer: Customer = {
        id: user.id,
        customerId: `CUS-${user.id.substring(0, 8).toUpperCase()}`,
        name: user.name || 'N/A',
        email: user.email || 'N/A',
        phone: user.phone || 'N/A',
        status: 'Active' as 'Active',
        membershipLevel: (user.membership_status || 'Bronze') as any,
        totalOrders: orders?.length || 0,
        totalSpent,
        avgOrderValue: orders?.length ? totalSpent / orders.length : 0,
        loyaltyPoints: user.loyalty_points || 0,
        joinDate: user.created_at,
        lastActive: orders?.[0]?.created_at || user.created_at,
        avatar: user.avatar || undefined,
        gender: user.gender || undefined,
        dateOfBirth: user.date_of_birth || undefined,
        fullAddress: user.full_address || undefined,
        addresses: user.addresses || [],
        orderHistory,
        pointsHistory: (pointsHistory || []).map((ph: any) => ({
          points: ph.points || 0,
          reason: ph.reason || 'N/A',
          createdAt: ph.created_at
        }))
      };
      
      setSelectedCustomer(detailedCustomer);
      console.log('✅ Customer details loaded');
    } catch (error) {
      console.error('❌ Error fetching customer details:', error);
      Alert.alert('Error', 'Failed to fetch customer details');
    }
  };

  const getMembershipColor = (level: string) => {
    switch (level) {
      case 'Diamond': return '#B9F2FF';
      case 'Platinum': return '#8B5CF6';
      case 'Gold': return '#F59E0B';
      case 'Titanium': return '#4A5568';
      case 'Silver': return '#6B7280';
      case 'Bronze': return '#92400E';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#10B981';
      case 'Inactive': return '#6B7280';
      case 'Suspended': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleViewCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailVisible(true);
    // Fetch full details
    await fetchCustomerDetails(customer.id);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      gender: customer.gender || '',
      fullAddress: customer.fullAddress || '',
      membershipTier: customer.membershipLevel
    });
    setIsEditVisible(true);
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;
    
    try {
      console.log('💾 Updating customer:', selectedCustomer.id);
      
      const { error } = await supabase
        .from('users')
        .update({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          gender: editForm.gender,
          full_address: editForm.fullAddress,
          membership_status: editForm.membershipTier,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedCustomer.id);
      
      if (error) throw error;
      
      Alert.alert('Success', 'Customer updated successfully');
      setIsEditVisible(false);
      await fetchCustomers();
      console.log('✅ Customer updated');
    } catch (error) {
      console.error('❌ Error updating customer:', error);
      Alert.alert('Error', 'Failed to update customer');
    }
  };

  const handleAddPoints = async () => {
    if (!selectedCustomer) return;
    
    const points = parseInt(pointsForm.points);
    if (isNaN(points) || points === 0) {
      Alert.alert('Error', 'Please enter a valid points value');
      return;
    }
    
    try {
      console.log('🎁 Updating loyalty points:', points);
      
      // Get current points
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('loyalty_points, membership_status')
        .eq('id', selectedCustomer.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentPoints = userData.loyalty_points || 0;
      const newPoints = currentPoints + points;
      
      // Determine new tier based on points
      let newTier = userData.membership_status;
      let tierUpgraded = false;
      
      if (newPoints >= 10000) {
        newTier = 'Diamond';
      } else if (newPoints >= 5000) {
        newTier = 'Platinum';
      } else if (newPoints >= 2000) {
        newTier = 'Gold';
      } else if (newPoints >= 500) {
        newTier = 'Silver';
      } else {
        newTier = 'Bronze';
      }
      
      if (newTier !== userData.membership_status) {
        tierUpgraded = true;
      }
      
      // Update user points and tier
      const { error: updateError } = await supabase
        .from('users')
        .update({
          loyalty_points: Math.max(0, newPoints),
          membership_status: newTier,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedCustomer.id);
      
      if (updateError) throw updateError;
      
      // Add to points history
      const { error: historyError } = await supabase
        .from('loyalty_points_history')
        .insert([{
          user_id: selectedCustomer.id,
          points: points,
          reason: pointsForm.reason || 'Admin adjustment',
          created_at: new Date().toISOString()
        }]);
      
      if (historyError) console.warn('History insert failed:', historyError);
      
      Alert.alert(
        'Success', 
        `${points > 0 ? 'Added' : 'Deducted'} ${Math.abs(points)} points\n${tierUpgraded ? `Tier upgraded to ${newTier}!` : ''}`
      );
      setIsPointsModalVisible(false);
      setPointsForm({ points: '', reason: '' });
      await fetchCustomerDetails(selectedCustomer.id);
      await fetchCustomers();
      
      console.log('✅ Points updated. New tier:', newTier);
    } catch (error) {
      console.error('❌ Error updating points:', error);
      Alert.alert('Error', 'Failed to update points');
    }
  };

  const handleSendEmail = async () => {
    if (!selectedCustomer) return;
    
    if (!emailForm.subject || !emailForm.message) {
      Alert.alert('Error', 'Please enter subject and message');
      return;
    }
    
    try {
      console.log('📧 Sending email notification to:', selectedCustomer.email);
      
      // Create notification for the customer
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: selectedCustomer.id,
          type: 'email',
          category: 'Admin Message',
          title: emailForm.subject,
          message: emailForm.message,
          is_admin_notification: false,
          is_read: false,
          created_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
      
      Alert.alert('Success', 'Email notification sent successfully');
      setIsEmailModalVisible(false);
      setEmailForm({ subject: '', message: '' });
      
      console.log('✅ Email notification sent');
    } catch (error) {
      console.error('❌ Error sending email:', error);
      Alert.alert('Error', 'Failed to send notification');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading customers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Users size={24} color="#1F2937" />
        <Text style={styles.headerTitle}>Customer Management</Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {['All', 'Gold', 'Silver', 'Platinum', 'Bronze'].map((tier) => (
              <TouchableOpacity
                key={tier}
                style={[
                  styles.filterChip,
                  membershipFilter === tier && styles.filterChipActive
                ]}
                onPress={() => setMembershipFilter(tier)}
              >
                <Text style={[
                  styles.filterChipText,
                  membershipFilter === tier && styles.filterChipTextActive
                ]}>
                  {tier}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalCustomers}</Text>
          <Text style={styles.statLabel}>Total Customers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.activeCustomers}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.goldMembers}</Text>
          <Text style={styles.statLabel}>Gold Members</Text>
        </View>
      </View>

      {/* Customer List */}
      <ScrollView 
        style={styles.customerList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredCustomers.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No customers found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || membershipFilter !== 'All' 
                ? 'Try adjusting your filters' 
                : 'Customers will appear here'}
            </Text>
          </View>
        ) : (
          filteredCustomers.map((customer) => (
            <View key={customer.id} style={styles.customerCard}>
              <View style={styles.customerHeader}>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  <Text style={styles.customerId}>#{customer.customerId}</Text>
                  <View style={styles.customerMeta}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(customer.status) }]}>
                      <Text style={styles.statusText}>{customer.status}</Text>
                    </View>
                    <View style={[styles.membershipBadge, { backgroundColor: getMembershipColor(customer.membershipLevel) }]}>
                      <Text style={styles.membershipText}>{customer.membershipLevel}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.customerActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.viewButton]}
                    onPress={() => handleViewCustomer(customer)}
                  >
                    <Eye size={16} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditCustomer(customer)}
                  >
                    <Edit2 size={16} color="#10B981" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.customerStats}>
                <View style={styles.statItem}>
                  <Package size={16} color="#6B7280" />
                  <Text style={styles.statText}>{customer.totalOrders} Orders</Text>
                </View>
                <View style={styles.statItem}>
                  <DollarSign size={16} color="#6B7280" />
                  <Text style={styles.statText}>{formatCurrency(customer.totalSpent)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Star size={16} color="#F59E0B" />
                  <Text style={styles.statText}>{customer.loyaltyPoints} pts</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Customer Detail Modal */}
      <Modal
        visible={isDetailVisible}
        animationType="slide"
        onRequestClose={() => setIsDetailVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Customer Details</Text>
            <TouchableOpacity
              onPress={() => setIsDetailVisible(false)}
              style={styles.closeButton}
            >
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {selectedCustomer && (
            <ScrollView style={styles.modalContent}>
              {/* Customer Summary Card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <View>
                    <Text style={styles.summaryName}>{selectedCustomer.name}</Text>
                    <Text style={styles.summaryId}>#{selectedCustomer.customerId}</Text>
                  </View>
                  <View style={[styles.membershipBadge, { backgroundColor: getMembershipColor(selectedCustomer.membershipLevel) }]}>
                    <Text style={styles.membershipText}>{selectedCustomer.membershipLevel}</Text>
                  </View>
                </View>
                <View style={styles.summaryStats}>
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatValue}>{selectedCustomer.totalOrders}</Text>
                    <Text style={styles.summaryStatLabel}>Orders</Text>
                  </View>
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatValue}>{formatCurrency(selectedCustomer.totalSpent)}</Text>
                    <Text style={styles.summaryStatLabel}>Total Spent</Text>
                  </View>
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatValue}>{selectedCustomer.loyaltyPoints}</Text>
                    <Text style={styles.summaryStatLabel}>Points</Text>
                  </View>
                </View>
              </View>

              {/* Basic Info */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedCustomer.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{selectedCustomer.phone}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gender:</Text>
                  <Text style={styles.detailValue}>{selectedCustomer.gender || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedCustomer.status) }]}>
                    <Text style={styles.statusText}>{selectedCustomer.status}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Join Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedCustomer.joinDate)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Last Active:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedCustomer.lastActive)}</Text>
                </View>
              </View>

              {/* Address */}
              {selectedCustomer.fullAddress && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Address</Text>
                  <Text style={styles.addressText}>{selectedCustomer.fullAddress}</Text>
                </View>
              )}

              {/* Order History */}
              {selectedCustomer.orderHistory && selectedCustomer.orderHistory.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Order History ({selectedCustomer.orderHistory.length})</Text>
                  {selectedCustomer.orderHistory.slice(0, 5).map((order) => (
                    <View key={order.id} style={styles.orderCard}>
                      <View style={styles.orderHeader}>
                        <Text style={styles.orderId}>{order.orderId}</Text>
                        <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
                      </View>
                      <View style={styles.orderDetails}>
                        <Text style={styles.orderDetailText}>
                          {formatDate(order.date)} • {order.itemCount} items
                        </Text>
                        <View style={[styles.orderStatusBadge, { backgroundColor: order.status === 'Delivered' ? '#10B981' : '#F59E0B' }]}>
                          <Text style={styles.orderStatusText}>{order.status}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Points History */}
              {selectedCustomer.pointsHistory && selectedCustomer.pointsHistory.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Recent Points Activity</Text>
                  {selectedCustomer.pointsHistory.slice(0, 5).map((entry, index) => (
                    <View key={index} style={styles.pointsHistoryRow}>
                      <View style={styles.pointsHistoryLeft}>
                        <Text style={[styles.pointsValue, { color: entry.points > 0 ? '#10B981' : '#EF4444' }]}>
                          {entry.points > 0 ? '+' : ''}{entry.points}
                        </Text>
                        <Text style={styles.pointsReason}>{entry.reason}</Text>
                      </View>
                      <Text style={styles.pointsDate}>{formatDate(entry.createdAt)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Actions */}
              <View style={styles.actionSection}>
                <TouchableOpacity 
                  style={styles.actionButtonLarge}
                  onPress={() => setIsEmailModalVisible(true)}
                >
                  <Mail size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Send Email</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButtonLarge, { backgroundColor: '#10B981' }]}
                  onPress={() => setIsPointsModalVisible(true)}
                >
                  <Gift size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Manage Points</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        visible={isEditVisible}
        animationType="slide"
        onRequestClose={() => setIsEditVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Customer</Text>
            <TouchableOpacity
              onPress={() => setIsEditVisible(false)}
              style={styles.closeButton}
            >
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Name</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.name}
                onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                placeholder="Enter name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.email}
                onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                placeholder="Enter email"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.phone}
                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                placeholder="Enter phone"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Gender</Text>
              <View style={styles.genderButtons}>
                {['male', 'female', 'other'].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderButton,
                      editForm.gender === gender && styles.genderButtonActive
                    ]}
                    onPress={() => setEditForm({ ...editForm, gender })}
                  >
                    <Text style={[
                      styles.genderButtonText,
                      editForm.gender === gender && styles.genderButtonTextActive
                    ]}>
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Address</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={editForm.fullAddress}
                onChangeText={(text) => setEditForm({ ...editForm, fullAddress: text })}
                placeholder="Enter full address"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Membership Tier</Text>
              <View style={styles.tierButtons}>
                {['Bronze', 'Silver', 'Gold', 'Titanium', 'Platinum', 'Diamond'].map((tier) => (
                  <TouchableOpacity
                    key={tier}
                    style={[
                      styles.tierButton,
                      editForm.membershipTier === tier && { backgroundColor: getMembershipColor(tier) }
                    ]}
                    onPress={() => setEditForm({ ...editForm, membershipTier: tier })}
                  >
                    <Text style={styles.tierButtonText}>{tier}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleUpdateCustomer}
            >
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Points Management Modal */}
      <Modal
        visible={isPointsModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsPointsModalVisible(false)}
      >
        <View style={styles.overlayModal}>
          <View style={styles.modalCard}>
            <Text style={styles.modalCardTitle}>Manage Loyalty Points</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Points (use negative for deduction)</Text>
              <TextInput
                style={styles.formInput}
                value={pointsForm.points}
                onChangeText={(text) => setPointsForm({ ...pointsForm, points: text })}
                placeholder="e.g., 100 or -50"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Reason</Text>
              <TextInput
                style={styles.formInput}
                value={pointsForm.reason}
                onChangeText={(text) => setPointsForm({ ...pointsForm, reason: text })}
                placeholder="Enter reason for adjustment"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setIsPointsModalVisible(false);
                  setPointsForm({ points: '', reason: '' });
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleAddPoints}
              >
                <Text style={styles.modalButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Email Modal */}
      <Modal
        visible={isEmailModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsEmailModalVisible(false)}
      >
        <View style={styles.overlayModal}>
          <View style={styles.modalCard}>
            <Text style={styles.modalCardTitle}>Send Email to Customer</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Subject</Text>
              <TextInput
                style={styles.formInput}
                value={emailForm.subject}
                onChangeText={(text) => setEmailForm({ ...emailForm, subject: text })}
                placeholder="Email subject"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Message</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={emailForm.message}
                onChangeText={(text) => setEmailForm({ ...emailForm, message: text })}
                placeholder="Email message"
                multiline
                numberOfLines={5}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setIsEmailModalVisible(false);
                  setEmailForm({ subject: '', message: '' });
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleSendEmail}
              >
                <Text style={styles.modalButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  searchFilterContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'Inter-Regular',
  },
  filterContainer: {
    marginTop: 8,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 4,
  },
  customerList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 4,
  },
  customerCard: {
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
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  customerId: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 8,
  },
  customerMeta: {
    flexDirection: 'row',
    gap: 8,
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
  membershipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  membershipText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  customerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: '#EBF4FF',
  },
  editButton: {
    backgroundColor: '#D1FAE5',
  },
  customerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  summaryName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  summaryId: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 2,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  summaryStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDetailText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderStatusText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  pointsHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pointsHistoryLeft: {
    flex: 1,
  },
  pointsValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  pointsReason: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  pointsDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  genderButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  genderButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  tierButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tierButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tierButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  overlayModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalCardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  modalButtonConfirm: {
    backgroundColor: '#3B82F6',
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
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
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  addressText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    lineHeight: 20,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  orderId: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    flex: 1,
  },
  orderDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    flex: 1,
  },
  orderTotal: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  orderStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
    flex: 1,
    textAlign: 'right',
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButtonLarge: {
    flex: 1,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});
