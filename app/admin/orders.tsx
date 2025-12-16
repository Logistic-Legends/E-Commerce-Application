import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, Eye, Edit2, Calendar, User, CreditCard, Truck, Search, Filter, ChevronDown } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, resolveUrl } from '../../config/api';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams } from 'expo-router';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id?: string;  // User text ID for backward compatibility
  id: string;    // Order number for display
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalPrice: number;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  paymentMethod: 'Cash' | 'Card' | 'Mobile Banking' | 'Bank Transfer';
  orderStatus: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  orderDate: string;
  orderTime: string;
  shippingAddress?: {
    street: string;
    city: string;
    state?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
  };
}

const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    items: [
      { id: '1', name: 'Smartphone', quantity: 1, price: 299.99 },
      { id: '2', name: 'Phone Case', quantity: 2, price: 19.99 }
    ],
    totalPrice: 339.97,
    paymentStatus: 'Paid',
    paymentMethod: 'Card',
    orderStatus: 'Processing',
    orderDate: '2024-01-15',
    orderTime: '10:30 AM'
  },
  {
    id: 'ORD-002',
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    items: [
      { id: '3', name: 'Laptop', quantity: 1, price: 899.99 }
    ],
    totalPrice: 899.99,
    paymentStatus: 'Pending',
    paymentMethod: 'Mobile Banking',
    orderStatus: 'Pending',
    orderDate: '2024-01-15',
    orderTime: '02:15 PM'
  },
  {
    id: 'ORD-003',
    customerName: 'Mike Johnson',
    customerEmail: 'mike@example.com',
    items: [
      { id: '4', name: 'T-Shirt', quantity: 3, price: 25.99 },
      { id: '5', name: 'Jeans', quantity: 1, price: 59.99 }
    ],
    totalPrice: 137.96,
    paymentStatus: 'Paid',
    paymentMethod: 'Cash',
    orderStatus: 'Shipped',
    orderDate: '2024-01-14',
    orderTime: '09:45 AM'
  }
];

export default function OrderManagement() {
  const params = useLocalSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailVisible, setIsOrderDetailVisible] = useState(false);
  const [isStatusUpdateVisible, setIsStatusUpdateVisible] = useState(false);
  const [newOrderStatus, setNewOrderStatus] = useState<Order['orderStatus']>('Pending');
  const [newPaymentStatus, setNewPaymentStatus] = useState<Order['paymentStatus']>('Pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter and Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('All');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // Fetch orders from backend
  const fetchOrders = async () => {
    // Show UI quickly, load data in background
    setTimeout(() => setLoading(false), 100);
    
    try {
      console.log('🔑 Admin fetching all orders from Supabase...');
      
      // Fetch all orders directly from Supabase - much faster
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Supabase error:', error.message);
        setOrders([]);
        setFilteredOrders([]);
        setRefreshing(false);
        return;
      }
      
      console.log('📡 Orders received:', data?.length || 0);
      
      if (data && Array.isArray(data)) {
        console.log('✅ Processing', data.length, 'orders');
        
        // Get all unique user IDs to fetch user emails
        const userIds = [...new Set(data.map((o: any) => o.user_id).filter(Boolean))];
        
        // Fetch user emails from users table
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);
        
        const userEmailMap: { [key: string]: string } = {};
        (usersData || []).forEach((u: any) => {
          userEmailMap[u.id] = u.email;
        });
        
        // Transform Supabase data to match frontend interface
        const transformedOrders = data.map((order: any) => {
          const userName = order.shipping_address?.name || 'Guest';
          const userEmail = order.shipping_address?.email || userEmailMap[order.user_id] || 'no-email@example.com';
          
          return {
            _id: order.id,
            id: order.order_number || `ORD-${order.id.toString().slice(-6).toUpperCase()}`,
            customerName: userName,
            customerEmail: userEmail,
            items: (order.items || []).map((item: any) => ({
              id: item.product || item.id,
              name: item.name || 'Product',
              quantity: item.quantity || 1,
              price: item.price || 0
            })),
            totalPrice: order.total_price || 0,
            paymentStatus: order.is_paid ? 'Paid' : 'Pending',
            paymentMethod: order.payment_method === 'cash_on_delivery' ? 'Cash' : 
                          order.payment_method === 'credit_card' ? 'Card' : 
                          order.payment_method === 'mobile_banking' ? 'Mobile Banking' :
                          order.payment_method === 'bank_transfer' ? 'Bank Transfer' : 
                          'Cash',
            orderStatus: (order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending') as Order['orderStatus'],
            orderDate: order.created_at ? new Date(order.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            orderTime: order.created_at ? new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
            shippingAddress: order.shipping_address ? {
              street: order.shipping_address.street || '',
              city: order.shipping_address.city || '',
              state: order.shipping_address.state || '',
              zipCode: order.shipping_address.zipCode || '',
              country: order.shipping_address.country || 'Bangladesh',
              phone: order.shipping_address.phone || ''
            } : undefined
          };
        });
        
        console.log('✅ Successfully transformed', transformedOrders.length, 'orders');
        
        setOrders(transformedOrders);
        setFilteredOrders(transformedOrders);
      } else {
        console.error('❌ No orders data');
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      setOrders([]);
      setFilteredOrders([]);
    }
    
    setRefreshing(false);
  };

  useEffect(() => {
    fetchOrders();
    
    // Auto-refresh every 20 seconds
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing orders...');
      fetchOrders();
    }, 20000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-open order details when orderId parameter is present
  useEffect(() => {
    console.log('🔍 Order auto-open effect:', {
      hasOrderId: !!params.orderId,
      orderId: params.orderId,
      ordersCount: orders.length,
      orderIds: orders.slice(0, 5).map((o: any) => o._id)
    });
    
    if (params.orderId && orders.length > 0) {
      console.log('🔍 Looking for order:', params.orderId);
      const orderToOpen = orders.find(o => (o as any)._id === params.orderId);
      
      if (orderToOpen) {
        console.log('✅ Found order, opening details:', {
          _id: (orderToOpen as any)._id,
          orderNumber: (orderToOpen as any).order_number
        });
        setSelectedOrder(orderToOpen);
        setIsOrderDetailVisible(true);
      } else {
        console.log('⚠️ Order not found:', params.orderId);
        console.log('Available order IDs:', orders.map((o: any) => o._id));
      }
    }
  }, [params.orderId, orders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // Filter and search logic
  React.useEffect(() => {
    let filtered = orders;

    // Search by order ID or customer name
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by order status
    if (statusFilter !== 'All') {
      filtered = filtered.filter(order => order.orderStatus === statusFilter);
    }

    // Filter by payment status
    if (paymentStatusFilter !== 'All') {
      filtered = filtered.filter(order => order.paymentStatus === paymentStatusFilter);
    }

    // Filter by payment method
    if (paymentMethodFilter !== 'All') {
      filtered = filtered.filter(order => order.paymentMethod === paymentMethodFilter);
    }

    // Filter by date range
    if (dateFromFilter) {
      filtered = filtered.filter(order => order.orderDate >= dateFromFilter);
    }
    if (dateToFilter) {
      filtered = filtered.filter(order => order.orderDate <= dateToFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter, paymentStatusFilter, paymentMethodFilter, dateFromFilter, dateToFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setPaymentStatusFilter('All');
    setPaymentMethodFilter('All');
    setDateFromFilter('');
    setDateToFilter('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return '#10B981';
      case 'Pending': return '#F59E0B';
      case 'Failed': return '#EF4444';
      case 'Processing': return '#3B82F6';
      case 'Shipped': return '#8B5CF6';
      case 'Delivered': return '#10B981';
      case 'Cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailVisible(true);
  };

  const handleOrderAction = async (orderId: string, status: string, note: string) => {
    try {
      // Find the order by id (orderNumber) or _id
      const orderToUpdate = orders.find(o => o.id === orderId || (o as any)._id === orderId);
      if (!orderToUpdate) {
        console.error('Order not found:', orderId);
        Alert.alert('Error', 'Order not found');
        return;
      }

      // Use the Supabase order ID (_id)
      const supabaseOrderId = (orderToUpdate as any)._id || orderId;
      console.log('Updating order:', supabaseOrderId, 'to status:', status);

      // Fetch the full order data to get user_id
      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', supabaseOrderId)
        .single();

      if (fetchError || !orderData) {
        throw new Error('Failed to fetch order details');
      }

      // Update order status in Supabase
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: status.toLowerCase() })
        .eq('id', supabaseOrderId);

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update order status');
      }

      // Create notification for the user
      if (orderData.user_id) {
        const notificationTitle = status === 'processing' 
          ? '✅ Order Accepted' 
          : status === 'cancelled' 
          ? '❌ Order Rejected' 
          : '📦 Order Updated';
        
        const notificationMessage = status === 'processing'
          ? `Your order ${orderToUpdate.id} has been accepted and is being processed.`
          : status === 'cancelled'
          ? `Your order ${orderToUpdate.id} has been rejected. Please contact support for more information.`
          : `Your order ${orderToUpdate.id} status has been updated to ${status}.`;

        try {
          await supabase
            .from('notifications')
            .insert([{
              user_id: orderData.user_id,
              type: 'order',
              category: 'Order Update',
              title: notificationTitle,
              message: notificationMessage,
              data: {
                orderId: supabaseOrderId,
                orderNumber: orderToUpdate.id,
                status: status,
                note: note
              },
              is_admin_notification: false,
              is_read: false
            }]);
          
          console.log('✅ User notification created for order:', orderToUpdate.id);
        } catch (notifError: any) {
          console.error('⚠️ Failed to create user notification:', notifError.message);
          // Don't fail the order update if notification fails
        }
      }

      Alert.alert('Success', `Order ${status === 'processing' ? 'accepted' : status === 'cancelled' ? 'rejected' : 'updated'} successfully`);
      setIsOrderDetailVisible(false);
      fetchOrders(); // Refresh orders
    } catch (error: any) {
      console.error('Order action error:', error);
      Alert.alert('Error', error.message || 'Failed to update order status');
    }
  };

  const handleUpdateStatus = (order: Order) => {
    setSelectedOrder(order);
    setNewOrderStatus(order.orderStatus);
    setNewPaymentStatus(order.paymentStatus);
    setIsStatusUpdateVisible(true);
  };

  const saveStatusUpdate = async () => {
    if (!selectedOrder) return;
    
    try {
      // Use the Supabase order ID (_id)
      const supabaseOrderId = (selectedOrder as any)._id || selectedOrder.id;
      console.log('Updating order status for:', supabaseOrderId);
      
      const updates: any = {};
      
      // Update order status if changed
      if (newOrderStatus !== selectedOrder.orderStatus) {
        updates.status = newOrderStatus.toLowerCase();
      }
      
      // Update payment status if changed
      if (newPaymentStatus !== selectedOrder.paymentStatus) {
        updates.is_paid = newPaymentStatus === 'Paid';
        if (newPaymentStatus === 'Paid') {
          updates.paid_at = new Date().toISOString();
        }
      }
      
      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('orders')
          .update(updates)
          .eq('id', supabaseOrderId);
        
        if (error) {
          throw new Error(error.message || 'Failed to update order');
        }
        
        // Fetch the full order data to get user_id for notification
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('id', supabaseOrderId)
          .single();
        
        // Create notification for user if status changed
        if (orderData && orderData.user_id && newOrderStatus !== selectedOrder.orderStatus) {
          const notificationTitle = newOrderStatus === 'Processing' 
            ? '✅ Order Accepted' 
            : newOrderStatus === 'Cancelled' 
            ? '❌ Order Rejected'
            : newOrderStatus === 'Shipped'
            ? '🚚 Order Shipped'
            : newOrderStatus === 'Delivered'
            ? '✓ Order Delivered'
            : '📦 Order Updated';
          
          const notificationMessage = newOrderStatus === 'Processing'
            ? `Your order ${selectedOrder.id} has been accepted and is being processed.`
            : newOrderStatus === 'Cancelled'
            ? `Your order ${selectedOrder.id} has been rejected. Please contact support for more information.`
            : newOrderStatus === 'Shipped'
            ? `Your order ${selectedOrder.id} has been shipped and is on the way.`
            : newOrderStatus === 'Delivered'
            ? `Your order ${selectedOrder.id} has been delivered successfully.`
            : `Your order ${selectedOrder.id} status has been updated to ${newOrderStatus}.`;

          try {
            await supabase
              .from('notifications')
              .insert([{
                user_id: orderData.user_id,
                type: 'order',
                category: 'Order Update',
                title: notificationTitle,
                message: notificationMessage,
                data: {
                  orderId: supabaseOrderId,
                  orderNumber: selectedOrder.id,
                  status: newOrderStatus.toLowerCase()
                },
                is_admin_notification: false,
                is_read: false
              }]);
            
            console.log('✅ User notification created for order:', selectedOrder.id);
          } catch (notifError: any) {
            console.error('⚠️ Failed to create user notification:', notifError.message);
          }
        }
      }
      
      Alert.alert('Success', 'Order updated successfully');
      setIsStatusUpdateVisible(false);
      setSelectedOrder(null);
      fetchOrders(); // Refresh orders
    } catch (error: any) {
      console.error('Update status error:', error);
      Alert.alert('Error', error.message || 'Failed to update order');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Package size={24} color="#1F2937" />
        <Text style={styles.headerTitle}>Order Management</Text>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Order ID or Customer Name..."
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

      {/* Active Filters Display */}
      {(statusFilter !== 'All' || paymentStatusFilter !== 'All' || paymentMethodFilter !== 'All' || dateFromFilter || dateToFilter) && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersTitle}>Active Filters:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersList}>
            {statusFilter !== 'All' && (
              <View style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>Status: {statusFilter}</Text>
              </View>
            )}
            {paymentStatusFilter !== 'All' && (
              <View style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>Payment: {paymentStatusFilter}</Text>
              </View>
            )}
            {paymentMethodFilter !== 'All' && (
              <View style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>Method: {paymentMethodFilter}</Text>
              </View>
            )}
            {dateFromFilter && (
              <View style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>From: {dateFromFilter}</Text>
              </View>
            )}
            {dateToFilter && (
              <View style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>To: {dateToFilter}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
      <ScrollView 
        style={styles.ordersList}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
        }
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>Orders will appear here when customers place them</Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderId}>#{order.id}</Text>
                <View style={styles.customerInfo}>
                  <User size={16} color="#6B7280" />
                  <Text style={styles.customerName}>{order.customerName}</Text>
                </View>
                {order.shippingAddress?.phone && (
                  <Text style={styles.customerPhone}>📞 {order.shippingAddress.phone}</Text>
                )}
              </View>
              <View style={styles.orderActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.viewButton]}
                  onPress={() => handleViewOrder(order)}
                >
                  <Eye size={16} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleUpdateStatus(order)}
                >
                  <Edit2 size={16} color="#10B981" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.orderDetails}>
              <View style={styles.orderInfo}>
                <Text style={styles.itemCount}>
                  {order.items.length} item{order.items.length > 1 ? 's' : ''}
                </Text>
                <Text style={styles.totalPrice}>৳{order.totalPrice.toFixed(2)}</Text>
              </View>

              <View style={styles.statusRow}>
                <View style={styles.statusContainer}>
                  <Text style={styles.statusLabel}>Payment:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.paymentStatus) }]}>
                    <Text style={styles.statusText}>{order.paymentStatus}</Text>
                  </View>
                </View>
                <View style={styles.statusContainer}>
                  <Text style={styles.statusLabel}>Order:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.orderStatus) }]}>
                    <Text style={styles.statusText}>{order.orderStatus}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.dateTimeRow}>
                <Calendar size={14} color="#6B7280" />
                <Text style={styles.dateTime}>{order.orderDate} at {order.orderTime}</Text>
              </View>
            </View>
          </View>
        ))
        )}
      </ScrollView>
      )}

      {/* Order Detail Modal */}
      <Modal
        visible={isOrderDetailVisible}
        animationType="slide"
        onRequestClose={() => setIsOrderDetailVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Order Details</Text>
            <TouchableOpacity
              onPress={() => setIsOrderDetailVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedOrder && (
            <ScrollView 
              style={styles.modalContent}
              contentContainerStyle={{ paddingBottom: 150 }}
            >
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Order Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order ID:</Text>
                  <Text style={styles.detailValue}>#{selectedOrder.id}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Customer:</Text>
                  <Text style={styles.detailValue}>{selectedOrder.customerName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedOrder.customerEmail}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date & Time:</Text>
                  <Text style={styles.detailValue}>{selectedOrder.orderDate} at {selectedOrder.orderTime}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Method:</Text>
                  <Text style={styles.detailValue}>{selectedOrder.paymentMethod}</Text>
                </View>
              </View>

              {selectedOrder.shippingAddress && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Shipping Address</Text>
                  {selectedOrder.shippingAddress.phone && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Phone:</Text>
                      <Text style={styles.detailValue}>{selectedOrder.shippingAddress.phone}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address:</Text>
                    <Text style={styles.detailValue}>
                      {selectedOrder.shippingAddress.street}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>City:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.shippingAddress.city}</Text>
                  </View>
                  {selectedOrder.shippingAddress.zipCode && selectedOrder.shippingAddress.zipCode !== '0000' && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Postal Code:</Text>
                      <Text style={styles.detailValue}>{selectedOrder.shippingAddress.zipCode}</Text>
                    </View>
                  )}
                  {selectedOrder.shippingAddress.country && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Country:</Text>
                      <Text style={styles.detailValue}>{selectedOrder.shippingAddress.country}</Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Order Items</Text>
                {selectedOrder.items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                    <Text style={styles.itemPrice}>৳{(item.price * item.quantity).toFixed(2)}</Text>
                  </View>
                ))}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount:</Text>
                  <Text style={styles.totalAmount}>৳{selectedOrder.totalPrice.toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Status</Text>
                <View style={styles.statusDetailRow}>
                  <Text style={styles.detailLabel}>Payment Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.paymentStatus) }]}>
                    <Text style={styles.statusText}>{selectedOrder.paymentStatus}</Text>
                  </View>
                </View>
                <View style={styles.statusDetailRow}>
                  <Text style={styles.detailLabel}>Order Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.orderStatus) }]}>
                    <Text style={styles.statusText}>{selectedOrder.orderStatus}</Text>
                  </View>
                </View>
              </View>

              {selectedOrder.orderStatus === 'Pending' && (
                <View style={styles.actionSection}>
                  <Text style={styles.sectionTitle}>Order Actions</Text>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.acceptBtn]}
                      onPress={() => handleOrderAction(selectedOrder.id, 'processing', 'Order accepted by admin')}
                    >
                      <Text style={styles.actionBtnText}>✓ Accept Order</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleOrderAction(selectedOrder.id, 'cancelled', 'Order rejected by admin')}
                    >
                      <Text style={styles.actionBtnText}>✕ Reject Order</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {selectedOrder.orderStatus === 'Processing' && (
                <View style={styles.actionSection}>
                  <Text style={styles.sectionTitle}>Order Actions</Text>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.shipBtn]}
                    onPress={() => handleOrderAction(selectedOrder.id, 'shipped', 'Order shipped')}
                  >
                    <Text style={styles.actionBtnText}>🚚 Mark as Shipped</Text>
                  </TouchableOpacity>
                </View>
              )}

              {selectedOrder.orderStatus === 'Shipped' && (
                <View style={styles.actionSection}>
                  <Text style={styles.sectionTitle}>Order Actions</Text>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.deliverBtn]}
                    onPress={() => handleOrderAction(selectedOrder.id, 'delivered', 'Order delivered')}
                  >
                    <Text style={styles.actionBtnText}>✓ Mark as Delivered</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={isFilterVisible}
        animationType="slide"
        onRequestClose={() => setIsFilterVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Orders</Text>
            <TouchableOpacity
              onPress={() => setIsFilterVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Order Status Filter */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Order Status</Text>
              <View style={styles.statusOptions}>
                {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      statusFilter === status && styles.selectedStatusOption
                    ]}
                    onPress={() => setStatusFilter(status)}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      statusFilter === status && styles.selectedStatusOptionText
                    ]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Payment Status Filter */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Payment Status</Text>
              <View style={styles.statusOptions}>
                {['All', 'Pending', 'Paid', 'Failed'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      paymentStatusFilter === status && styles.selectedStatusOption
                    ]}
                    onPress={() => setPaymentStatusFilter(status)}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      paymentStatusFilter === status && styles.selectedStatusOptionText
                    ]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Payment Method Filter */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Payment Method</Text>
              <View style={styles.statusOptions}>
                {['All', 'Cash', 'Card', 'Mobile Banking', 'Bank Transfer'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.statusOption,
                      paymentMethodFilter === method && styles.selectedStatusOption
                    ]}
                    onPress={() => setPaymentMethodFilter(method)}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      paymentMethodFilter === method && styles.selectedStatusOptionText
                    ]}>
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date Range Filter */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Date Range</Text>
              <View style={styles.dateInputs}>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>From:</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD"
                    value={dateFromFilter}
                    onChangeText={setDateFromFilter}
                  />
                </View>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>To:</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD"
                    value={dateToFilter}
                    onChangeText={setDateToFilter}
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={clearFilters}
              >
                <Text style={styles.cancelButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => setIsFilterVisible(false)}
              >
                <Text style={styles.saveButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        visible={isStatusUpdateVisible}
        animationType="slide"
        onRequestClose={() => setIsStatusUpdateVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Order Status</Text>
            <TouchableOpacity
              onPress={() => setIsStatusUpdateVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Order Status</Text>
              <View style={styles.statusOptions}>
                {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      newOrderStatus === status && styles.selectedStatusOption
                    ]}
                    onPress={() => setNewOrderStatus(status as Order['orderStatus'])}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      newOrderStatus === status && styles.selectedStatusOptionText
                    ]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Payment Status</Text>
              <View style={styles.statusOptions}>
                {['Pending', 'Paid', 'Failed'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      newPaymentStatus === status && styles.selectedStatusOption
                    ]}
                    onPress={() => setNewPaymentStatus(status as Order['paymentStatus'])}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      newPaymentStatus === status && styles.selectedStatusOptionText
                    ]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsStatusUpdateVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveStatusUpdate}
              >
                <Text style={styles.saveButtonText}>Update Status</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingBottom: 100, // Add padding to prevent navigation overlap
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
  ordersList: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  customerPhone: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
    marginLeft: 22,
  },
  orderActions: {
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
  orderDetails: {
    gap: 12,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  totalPrice: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  statusContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
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
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
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
  closeButtonText: {
    fontSize: 16,
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  itemQuantity: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginHorizontal: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  statusDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  selectedStatusOption: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  statusOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  selectedStatusOptionText: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
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
  activeFiltersContainer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  activeFiltersTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginBottom: 8,
  },
  activeFiltersList: {
    flexDirection: 'row',
  },
  activeFilter: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  clearFiltersButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearFiltersText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  dateInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
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
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  actionSection: {
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 40,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: '#10B981',
  },
  rejectBtn: {
    backgroundColor: '#EF4444',
  },
  shipBtn: {
    backgroundColor: '#3B82F6',
  },
  deliverBtn: {
    backgroundColor: '#10B981',
  },
  actionBtnText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});
