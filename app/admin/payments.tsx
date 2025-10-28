import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { CreditCard, Eye, Download, RefreshCw, AlertTriangle, TrendingUp, Filter, Search } from 'lucide-react-native';

interface Transaction {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: 'bKash' | 'Nagad' | 'Card' | 'Bank Transfer' | 'Cash on Delivery';
  status: 'Success' | 'Pending' | 'Failed' | 'Refunded';
  gateway: string;
  date: string;
  time: string;
  refundAmount?: number;
}

interface PaymentGateway {
  id: string;
  name: string;
  type: 'Mobile Banking' | 'Card' | 'Bank' | 'Digital Wallet';
  status: 'Active' | 'Inactive';
  transactionFee: number;
  monthlyVolume: number;
}

const mockTransactions: Transaction[] = [
  {
    id: 'TXN-001',
    orderId: 'ORD-001',
    customerId: 'CUST-001',
    customerName: 'John Doe',
    amount: 2500,
    paymentMethod: 'bKash',
    status: 'Success',
    gateway: 'bKash API',
    date: '2024-01-20',
    time: '10:30 AM'
  },
  {
    id: 'TXN-002',
    orderId: 'ORD-002',
    customerId: 'CUST-002',
    customerName: 'Jane Smith',
    amount: 1800,
    paymentMethod: 'Card',
    status: 'Pending',
    gateway: 'SSLCOMMERZ',
    date: '2024-01-20',
    time: '11:15 AM'
  },
  {
    id: 'TXN-003',
    orderId: 'ORD-003',
    customerId: 'CUST-003',
    customerName: 'Mike Johnson',
    amount: 3200,
    paymentMethod: 'Nagad',
    status: 'Failed',
    gateway: 'Nagad Gateway',
    date: '2024-01-19',
    time: '09:45 PM'
  }
];

const mockGateways: PaymentGateway[] = [
  { id: '1', name: 'bKash', type: 'Mobile Banking', status: 'Active', transactionFee: 1.5, monthlyVolume: 125000 },
  { id: '2', name: 'SSLCOMMERZ', type: 'Card', status: 'Active', transactionFee: 2.8, monthlyVolume: 89000 },
  { id: '3', name: 'Nagad', type: 'Mobile Banking', status: 'Active', transactionFee: 1.2, monthlyVolume: 67000 },
  { id: '4', name: 'Stripe', type: 'Card', status: 'Inactive', transactionFee: 2.9, monthlyVolume: 0 }
];

export default function PaymentManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [gateways, setGateways] = useState<PaymentGateway[]>(mockGateways);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isRefundModalVisible, setIsRefundModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'gateways' | 'reports'>('transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [refundAmount, setRefundAmount] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Success': return '#10B981';
      case 'Pending': return '#F59E0B';
      case 'Failed': return '#EF4444';
      case 'Refunded': return '#6B7280';
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

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailVisible(true);
  };

  const handleRefund = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setRefundAmount(transaction.amount.toString());
    setIsRefundModalVisible(true);
  };

  const processRefund = () => {
    if (selectedTransaction) {
      setTransactions(prev => prev.map(txn =>
        txn.id === selectedTransaction.id
          ? { ...txn, status: 'Refunded', refundAmount: parseFloat(refundAmount) }
          : txn
      ));
      setIsRefundModalVisible(false);
      setRefundAmount('');
    }
  };

  const totalRevenue = transactions.filter(t => t.status === 'Success').reduce((sum, t) => sum + t.amount, 0);
  const pendingAmount = transactions.filter(t => t.status === 'Pending').reduce((sum, t) => sum + t.amount, 0);
  const refundedAmount = transactions.filter(t => t.status === 'Refunded').reduce((sum, t) => sum + (t.refundAmount || 0), 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <CreditCard size={24} color="#1F2937" />
        <Text style={styles.headerTitle}>Payment Management</Text>
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
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>৳{totalRevenue.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>৳{pendingAmount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>৳{refundedAmount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Refunded</Text>
        </View>
      </View>

      {activeTab === 'transactions' && (
        <>
          {/* Search and Filter */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInput}>
              <Search size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Search transactions..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          {/* Transaction List */}
          <ScrollView style={styles.transactionList}>
            {transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <View>
                    <Text style={styles.transactionId}>#{transaction.id}</Text>
                    <Text style={styles.customerName}>{transaction.customerName}</Text>
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
                    <Text style={styles.dateTime}>{transaction.date} {transaction.time}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      )}

      {activeTab === 'gateways' && (
        <ScrollView style={styles.gatewayList}>
          {gateways.map((gateway) => (
            <View key={gateway.id} style={styles.gatewayCard}>
              <View style={styles.gatewayHeader}>
                <Text style={styles.gatewayName}>{gateway.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(gateway.status) }]}>
                  <Text style={styles.statusText}>{gateway.status}</Text>
                </View>
              </View>
              <Text style={styles.gatewayType}>{gateway.type}</Text>
              <View style={styles.gatewayStats}>
                <Text style={styles.gatewayStat}>Fee: {gateway.transactionFee}%</Text>
                <Text style={styles.gatewayStat}>Volume: ৳{gateway.monthlyVolume.toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {activeTab === 'reports' && (
        <ScrollView style={styles.reportsContainer}>
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Payment Method Breakdown</Text>
            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>bKash</Text>
              <Text style={styles.reportValue}>45%</Text>
            </View>
            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>Card Payments</Text>
              <Text style={styles.reportValue}>30%</Text>
            </View>
            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>Nagad</Text>
              <Text style={styles.reportValue}>20%</Text>
            </View>
            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>Cash on Delivery</Text>
              <Text style={styles.reportValue}>5%</Text>
            </View>
          </View>
        </ScrollView>
      )}

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
                  <Text style={styles.detailLabel}>Transaction ID:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.id}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order ID:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.orderId}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Customer:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.customerName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={styles.detailValue}>৳{selectedTransaction.amount}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Method:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.paymentMethod}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gateway:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.gateway}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedTransaction.status) }]}>
                    <Text style={styles.statusText}>{selectedTransaction.status}</Text>
                  </View>
                </View>
              </View>
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
          <View style={styles.modalContent}>
            <Text style={styles.refundLabel}>Refund Amount (৳)</Text>
            <TextInput
              style={styles.refundInput}
              value={refundAmount}
              onChangeText={setRefundAmount}
              keyboardType="numeric"
              placeholder="Enter refund amount"
            />
            <View style={styles.refundActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsRefundModalVisible(false)}
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
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  transactionDetails: {
    gap: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  methodBadge: {
    paddingHorizontal: 8,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  gatewayName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  gatewayType: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
  },
  gatewayStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gatewayStat: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  reportsContainer: {
    flex: 1,
    padding: 16,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reportLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  reportValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
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
    fontSize: 18,
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
    marginBottom: 24,
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
});
