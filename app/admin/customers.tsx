import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Switch } from 'react-native';
import { Users, Eye, Edit2, Mail, Phone, MapPin, Package, Star, Gift, Shield, Search, Filter } from 'lucide-react-native';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  membershipLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  joinDate: string;
  lastActive: string;
  address: {
    street: string;
    city: string;
    country: string;
  };
  orderHistory: Array<{
    id: string;
    date: string;
    total: number;
    status: string;
  }>;
}

const mockCustomers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+880123456789',
    status: 'Active',
    membershipLevel: 'Gold',
    totalOrders: 15,
    totalSpent: 25000,
    loyaltyPoints: 1250,
    joinDate: '2023-01-15',
    lastActive: '2024-01-20',
    address: {
      street: '123 Main St',
      city: 'Dhaka',
      country: 'Bangladesh'
    },
    orderHistory: [
      { id: 'ORD-001', date: '2024-01-20', total: 1500, status: 'Delivered' },
      { id: 'ORD-002', date: '2024-01-15', total: 2300, status: 'Processing' }
    ]
  },
  {
    id: 'CUST-002',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+880987654321',
    status: 'Active',
    membershipLevel: 'Silver',
    totalOrders: 8,
    totalSpent: 12000,
    loyaltyPoints: 600,
    joinDate: '2023-06-10',
    lastActive: '2024-01-18',
    address: {
      street: '456 Oak Ave',
      city: 'Chittagong',
      country: 'Bangladesh'
    },
    orderHistory: [
      { id: 'ORD-003', date: '2024-01-18', total: 800, status: 'Shipped' }
    ]
  }
];

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(mockCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isEditVisible, setIsEditVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [membershipFilter, setMembershipFilter] = useState<string>('All');

  React.useEffect(() => {
    let filtered = customers;
    
    if (searchQuery) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (statusFilter !== 'All') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }
    
    if (membershipFilter !== 'All') {
      filtered = filtered.filter(customer => customer.membershipLevel === membershipFilter);
    }
    
    setFilteredCustomers(filtered);
  }, [customers, searchQuery, statusFilter, membershipFilter]);

  const getMembershipColor = (level: string) => {
    switch (level) {
      case 'Platinum': return '#8B5CF6';
      case 'Gold': return '#F59E0B';
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

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailVisible(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditVisible(true);
  };

  const toggleCustomerStatus = (customerId: string) => {
    setCustomers(prev => prev.map(customer =>
      customer.id === customerId
        ? { ...customer, status: customer.status === 'Active' ? 'Inactive' : 'Active' }
        : customer
    ));
  };

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
          />
        </View>
        <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{customers.length}</Text>
          <Text style={styles.statLabel}>Total Customers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{customers.filter(c => c.status === 'Active').length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{customers.filter(c => c.membershipLevel === 'Gold').length}</Text>
          <Text style={styles.statLabel}>Gold Members</Text>
        </View>
      </View>

      {/* Customer List */}
      <ScrollView style={styles.customerList}>
        {filteredCustomers.map((customer) => (
          <View key={customer.id} style={styles.customerCard}>
            <View style={styles.customerHeader}>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerId}>#{customer.id}</Text>
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
                <Text style={styles.statText}>৳{customer.totalSpent.toLocaleString()}</Text>
              </View>
              <View style={styles.statItem}>
                <Star size={16} color="#F59E0B" />
                <Text style={styles.statText}>{customer.loyaltyPoints} pts</Text>
              </View>
            </View>
          </View>
        ))}
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
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedCustomer && (
            <ScrollView style={styles.modalContent}>
              {/* Basic Info */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedCustomer.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedCustomer.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{selectedCustomer.phone}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedCustomer.status) }]}>
                    <Text style={styles.statusText}>{selectedCustomer.status}</Text>
                  </View>
                </View>
              </View>

              {/* Address */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Address</Text>
                <Text style={styles.addressText}>
                  {selectedCustomer.address.street}, {selectedCustomer.address.city}, {selectedCustomer.address.country}
                </Text>
              </View>

              {/* Order History */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Recent Orders</Text>
                {selectedCustomer.orderHistory.map((order) => (
                  <View key={order.id} style={styles.orderRow}>
                    <Text style={styles.orderId}>#{order.id}</Text>
                    <Text style={styles.orderDate}>{order.date}</Text>
                    <Text style={styles.orderTotal}>৳{order.total}</Text>
                    <Text style={styles.orderStatus}>{order.status}</Text>
                  </View>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.actionSection}>
                <TouchableOpacity style={styles.actionButtonLarge}>
                  <Mail size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Send Email</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButtonLarge}>
                  <Gift size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Add Loyalty Points</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    height: 32,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'Inter-Regular',
    height: 24,
    paddingVertical: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: '#EBF4FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
