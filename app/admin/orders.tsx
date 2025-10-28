import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Package, Eye, Edit2, Calendar, User, CreditCard, Truck, Search, Filter, ChevronDown } from 'lucide-react-native';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalPrice: number;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  paymentMethod: 'Cash' | 'Card' | 'Mobile Banking' | 'Bank Transfer';
  orderStatus: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  orderDate: string;
  orderTime: string;
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
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailVisible, setIsOrderDetailVisible] = useState(false);
  const [isStatusUpdateVisible, setIsStatusUpdateVisible] = useState(false);
  const [newOrderStatus, setNewOrderStatus] = useState<Order['orderStatus']>('Pending');
  const [newPaymentStatus, setNewPaymentStatus] = useState<Order['paymentStatus']>('Pending');
  
  // Filter and Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('All');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

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

  const handleUpdateStatus = (order: Order) => {
    setSelectedOrder(order);
    setNewOrderStatus(order.orderStatus);
    setNewPaymentStatus(order.paymentStatus);
    setIsStatusUpdateVisible(true);
  };

  const saveStatusUpdate = () => {
    if (selectedOrder) {
      const updatedOrders = orders.map(order =>
        order.id === selectedOrder.id
          ? { ...order, orderStatus: newOrderStatus, paymentStatus: newPaymentStatus }
          : order
      );
      setOrders(updatedOrders);
      setIsStatusUpdateVisible(false);
      setSelectedOrder(null);
    }
  };

  return (
    <View style={styles.container}>
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
      <ScrollView style={styles.ordersList}>
        {filteredOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderId}>#{order.id}</Text>
                <View style={styles.customerInfo}>
                  <User size={16} color="#6B7280" />
                  <Text style={styles.customerName}>{order.customerName}</Text>
                </View>
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
        ))}
      </ScrollView>

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
            <ScrollView style={styles.modalContent}>
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
});
