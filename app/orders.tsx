import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Package, Truck, CircleCheck as CheckCircle, Clock, X, MapPin, CreditCard } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveUrl } from '../config/api';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

const statusIcons = {
  pending: Clock,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: Package,
};

const statusColors = {
  pending: '#F59E0B',
  shipped: '#3B82F6',
  delivered: '#10B981',
  cancelled: '#EF4444',
};

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchOrders = async () => {
    // Show UI immediately
    setTimeout(() => setLoading(false), 100);
    
    try {
      if (!user?._id) {
        setOrders([]);
        setRefreshing(false);
        return;
      }

      console.log('📦 Fetching orders from Supabase for user:', user._id);
      
      // Fetch directly from Supabase - much faster than API
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user._id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Supabase error:', error);
        setOrders([]);
        setRefreshing(false);
        return;
      }
      
      if (data) {
        const transformedOrders = data.map((order: any) => ({
          _id: order.id,
          id: order.order_number || `ORD-${order.id.toString().slice(-6).toUpperCase()}`,
          status: (order.status || 'pending').toLowerCase(),
          date: order.created_at || new Date().toISOString(),
          items: (order.items || []).map((item: any) => ({
            name: item.name || 'Product',
            quantity: item.quantity || 1,
            price: item.price || 0,
            image: item.image || ''
          })),
          total: order.total_price || 0,
          subtotal: order.subtotal || order.total_price || 0,
          shippingPrice: order.shipping_price || 0,
          paymentMethod: order.payment_method || 'cash_on_delivery',
          shippingAddress: order.shipping_address || {},
          paymentStatus: order.payment_status || 'pending'
        }));
        
        console.log('✅ Orders loaded:', transformedOrders.length);
        setOrders(transformedOrders);
      } else {
        setOrders([]);
      }
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      setOrders([]);
    }
    
    setRefreshing(false);
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing user orders...');
        fetchOrders();
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const viewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash_on_delivery': return 'Cash on Delivery';
      case 'credit_card': return 'Credit Card';
      case 'debit_card': return 'Debit Card';
      case 'mobile_banking': return 'Mobile Banking';
      case 'bank_transfer': return 'Bank Transfer';
      default: return method;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Order History</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>
            {!user ? 'Please Login' : 'No orders yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {!user ? 'Login to view your order history' : 'Start shopping to see your orders here'}
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
          }
        >
          {orders.map((order) => {
            const StatusIcon = statusIcons[order.status as keyof typeof statusIcons] || Package;
            const statusColor = statusColors[order.status as keyof typeof statusColors] || '#6B7280';
            
            return (
              <View key={order._id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>Order #{order.id}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
                  </View>
                  
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                    <StatusIcon size={16} color={statusColor} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderItems}>
                  {order.items.map((item: any, index: number) => (
                    <View key={index} style={styles.orderItem}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemDetails}>
                        Qty: {item.quantity} × ৳{item.price.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.orderFooter}>
                  <Text style={styles.orderTotal}>Total: ৳{order.total.toFixed(2)}</Text>
                  <TouchableOpacity 
                    style={styles.viewDetailsButton}
                    onPress={() => viewOrderDetails(order)}
                  >
                    <Text style={styles.viewDetailsText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Order Details Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <X size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Order Info */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Order Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Order ID:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.id}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedOrder.date)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={[styles.detailValue, { 
                      color: statusColors[selectedOrder.status as keyof typeof statusColors] || '#6B7280',
                      fontWeight: '600'
                    }]}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Status:</Text>
                    <Text style={[styles.detailValue, { 
                      color: selectedOrder.paymentStatus === 'paid' ? '#10B981' : '#F59E0B',
                      fontWeight: '600'
                    }]}>
                      {selectedOrder.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </Text>
                  </View>
                </View>

                {/* Items */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Items</Text>
                  {selectedOrder.items.map((item: any, index: number) => (
                    <View key={index} style={styles.detailItemRow}>
                      <View style={styles.detailItemInfo}>
                        <Text style={styles.detailItemName}>{item.name}</Text>
                        <Text style={styles.detailItemQty}>Qty: {item.quantity}</Text>
                      </View>
                      <Text style={styles.detailItemPrice}>৳{(item.price * item.quantity).toFixed(2)}</Text>
                    </View>
                  ))}
                </View>

                {/* Payment & Shipping */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Payment Method</Text>
                  <View style={styles.detailPaymentRow}>
                    <CreditCard size={20} color="#3B82F6" />
                    <Text style={styles.detailPaymentText}>
                      {getPaymentMethodLabel(selectedOrder.paymentMethod)}
                    </Text>
                  </View>
                </View>

                {/* Shipping Address */}
                {selectedOrder.shippingAddress && Object.keys(selectedOrder.shippingAddress).length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Shipping Address</Text>
                    <View style={styles.detailAddressRow}>
                      <MapPin size={20} color="#3B82F6" />
                      <View style={styles.detailAddressInfo}>
                        <Text style={styles.detailAddressText}>
                          {selectedOrder.shippingAddress.name || ''}
                        </Text>
                        <Text style={styles.detailAddressText}>
                          {selectedOrder.shippingAddress.phone || ''}
                        </Text>
                        <Text style={styles.detailAddressText}>
                          {selectedOrder.shippingAddress.street || ''}
                        </Text>
                        <Text style={styles.detailAddressText}>
                          {selectedOrder.shippingAddress.city || ''} {selectedOrder.shippingAddress.zipCode || ''}
                        </Text>
                        <Text style={styles.detailAddressText}>
                          {selectedOrder.shippingAddress.country || 'Bangladesh'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Price Summary */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Price Summary</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Subtotal:</Text>
                    <Text style={styles.detailValue}>৳{selectedOrder.subtotal.toFixed(2)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Shipping:</Text>
                    <Text style={styles.detailValue}>৳{selectedOrder.shippingPrice.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.detailRow, styles.detailTotalRow]}>
                    <Text style={styles.detailTotalLabel}>Total:</Text>
                    <Text style={styles.detailTotalValue}>৳{selectedOrder.total.toFixed(2)}</Text>
                  </View>
                </View>
              </ScrollView>
            )}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  orderDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  orderItems: {
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  itemDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  orderTotal: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  viewDetailsButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
    paddingVertical: 80,
    paddingHorizontal: 40,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  detailItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailItemInfo: {
    flex: 1,
  },
  detailItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  detailItemQty: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  detailPaymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailPaymentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  detailAddressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailAddressInfo: {
    flex: 1,
  },
  detailAddressText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
    lineHeight: 20,
  },
  detailTotalRow: {
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 12,
  },
  detailTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  detailTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
});