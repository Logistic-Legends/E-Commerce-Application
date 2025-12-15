import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, resolveUrl } from '../../config/api';
import { 
  ArrowLeft, 
  MessageSquare, 
  AlertCircle, 
  Package, 
  CheckCircle, 
  Clock, 
  Filter,
  Search,
  Send
} from 'lucide-react-native';

interface Ticket {
  _id: string;
  ticketNumber: string;
  userId: {
    name: string;
    email: string;
    phone?: string;
  };
  type: string;
  subject: string;
  message: string;
  status: 'Open' | 'Seen' | 'Responded' | 'In Progress' | 'Resolved' | 'Closed';
  priority: string;
  orderId?: string;
  createdAt: string;
  conversation?: Array<{
    sender: 'user' | 'admin';
    senderName: string;
    message: string;
    timestamp: string;
    read: boolean;
  }>;
}

interface DashboardStats {
  total: number;
  pending: number;
  resolved: number;
  todayNew: number;
}

interface OrderRequest {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  items: any[];
  total: number;
  status: string;
  cancelRequest?: {
    requested: boolean;
    reason: string;
    requestedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  };
  returnRequest?: {
    requested: boolean;
    reason: string;
    requestedAt: string;
    status: 'pending' | 'approved' | 'rejected';
    refundAmount: number;
  };
  createdAt: string;
}

export default function AdminSupportScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tickets' | 'bugs' | 'orders'>('dashboard');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [bugReports, setBugReports] = useState<any[]>([]);
  const [cancelRequests, setCancelRequests] = useState<OrderRequest[]>([]);
  const [returnRequests, setReturnRequests] = useState<OrderRequest[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    resolved: 0,
    todayNew: 0
  });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSupportData();
  }, [activeTab, filterStatus]);

  const fetchSupportData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (activeTab === 'tickets' || activeTab === 'dashboard') {
        const url = filterStatus !== 'all' 
          ? resolveUrl(`/support/tickets?status=${filterStatus}`)
          : resolveUrl(`/support/tickets`);
          
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        if (response.ok && data.success) {
          setTickets(data.data);
          
          // Calculate stats
          const today = new Date().toDateString();
          setStats({
            total: data.data.length,
            pending: data.data.filter((t: Ticket) => t.status === 'Open' || t.status === 'In Progress').length,
            resolved: data.data.filter((t: Ticket) => t.status === 'Resolved').length,
            todayNew: data.data.filter((t: Ticket) => new Date(t.createdAt).toDateString() === today).length
          });
        }
      }
      
      if (activeTab === 'bugs' || activeTab === 'dashboard') {
        const response = await fetch(resolveUrl(`/support/bugs`), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        if (response.ok && data.success) {
          setBugReports(data.data);
        }
      }
      
      if (activeTab === 'orders' || activeTab === 'dashboard') {
        const [cancelResponse, returnResponse] = await Promise.all([
          fetch(resolveUrl(`/orders/cancel-requests`), {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(resolveUrl(`/orders/return-requests`), {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        const cancelData = await cancelResponse.json();
        const returnData = await returnResponse.json();
        
        if (cancelData.success) setCancelRequests(cancelData.data);
        if (returnData.success) setReturnRequests(returnData.data);
      }
    } catch (error) {
      console.error('Error fetching support data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendReply = async () => {
    if (!adminReply.trim() || !selectedTicket) return;

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(resolveUrl(`/support/tickets/${selectedTicket._id}/reply`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: adminReply,
          sender: 'admin',
          senderName: 'Admin Support'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('✅ Success', 'Reply sent successfully');
        setAdminReply('');
        setSelectedTicket(data.data);
        fetchSupportData();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'Failed to send reply');
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(resolveUrl(`/support/tickets/${ticketId}/status`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('✅ Success', `Ticket status updated to ${newStatus}`);
        setSelectedTicket(null);
        fetchSupportData();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'Failed to update ticket');
    }
  };

  const handleUpdatePriority = async (ticketId: string, priority: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(resolveUrl(`/support/tickets/${ticketId}/priority`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('✅ Success', `Priority updated to ${priority}`);
        setSelectedTicket(data.data);
        fetchSupportData();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'Failed to update priority');
    }
  };

  const handleUpdateBugStatus = async (bugId: string, newStatus: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(resolveUrl(`/support/bugs/${bugId}/status`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('✅ Success', `Bug report status updated to ${newStatus}`);
        fetchSupportData();
      }
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'Failed to update bug report');
    }
  };

  const handleCancelRequest = async (orderId: string, action: 'approve' | 'reject') => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(resolveUrl(`/orders/${orderId}/cancel/${action}`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminName: 'Admin' }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('✅ Success', `Cancellation request ${action}d`);
        fetchSupportData();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'Failed to process request');
    }
  };

  const handleReturnRequest = async (orderId: string, action: 'approve' | 'reject') => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(resolveUrl(`/orders/${orderId}/return/${action}`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminName: 'Admin' }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('✅ Success', `Return request ${action}d`);
        fetchSupportData();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'Failed to process request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return '#3B82F6';
      case 'In Progress': return '#F59E0B';
      case 'Resolved': return '#10B981';
      case 'Closed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return '#10B981';
      case 'Medium': return '#F59E0B';
      case 'High': return '#EF4444';
      case 'Urgent': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const filteredTickets = tickets.filter(ticket => 
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.userId.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSupportData();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Support</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'tickets' && styles.activeTab]}
          onPress={() => setActiveTab('tickets')}
        >
          <Text style={[styles.tabText, activeTab === 'tickets' && styles.activeTabText]}>Tickets</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'bugs' && styles.activeTab]}
          onPress={() => setActiveTab('bugs')}
        >
          <Text style={[styles.tabText, activeTab === 'bugs' && styles.activeTabText]}>Bugs</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>Orders</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <View style={styles.dashboard}>
            <Text style={styles.sectionTitle}>Support Overview</Text>
            
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderLeftColor: '#3B82F6' }]}>
                <MessageSquare size={24} color="#3B82F6" />
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total Tickets</Text>
              </View>

              <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
                <Clock size={24} color="#F59E0B" />
                <Text style={styles.statNumber}>{stats.pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>

              <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
                <CheckCircle size={24} color="#10B981" />
                <Text style={styles.statNumber}>{stats.resolved}</Text>
                <Text style={styles.statLabel}>Resolved</Text>
              </View>

              <View style={[styles.statCard, { borderLeftColor: '#8B5CF6' }]}>
                <AlertCircle size={24} color="#8B5CF6" />
                <Text style={styles.statNumber}>{stats.todayNew}</Text>
                <Text style={styles.statLabel}>Today's New</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Recent Bug Reports</Text>
            <Text style={styles.statNumber}>{bugReports.length}</Text>
            <Text style={styles.statLabel}>Total Reports</Text>
          </View>
        )}

        {/* Tickets List */}
        {activeTab === 'tickets' && (
          <View style={styles.ticketsSection}>
            {/* Search and Filter */}
            <View style={styles.searchBar}>
              <Search size={20} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search tickets..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.filterBar}>
              {['all', 'Open', 'In Progress', 'Resolved'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterButton, filterStatus === status && styles.activeFilterButton]}
                  onPress={() => setFilterStatus(status)}
                >
                  <Text style={[styles.filterButtonText, filterStatus === status && styles.activeFilterButtonText]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {filteredTickets.map((ticket) => (
              <TouchableOpacity
                key={ticket._id}
                style={styles.ticketCard}
                onPress={() => setSelectedTicket(ticket)}
              >
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketNumber}>#{ticket.ticketNumber}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                      {ticket.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                <Text style={styles.ticketUser}>👤 {ticket.userId.name}</Text>
                <Text style={styles.ticketType}>📋 {ticket.type}</Text>
                <View style={styles.ticketFooter}>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) + '20' }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(ticket.priority) }]}>
                      {ticket.priority}
                    </Text>
                  </View>
                  <Text style={styles.ticketDate}>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bug Reports */}
        {activeTab === 'bugs' && (
          <View style={styles.bugsSection}>
            {bugReports.map((bug) => (
              <View key={bug._id} style={styles.bugCard}>
                <View style={styles.bugHeader}>
                  <Text style={styles.bugNumber}>#{bug.reportNumber}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bug.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(bug.status) }]}>
                      {bug.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.bugType}>🐛 {bug.problemType}</Text>
                <Text style={styles.bugDescription} numberOfLines={2}>{bug.description}</Text>
                <Text style={styles.bugUser}>
                  👤 {bug.userId?.name} • {bug.deviceInfo?.platform}
                </Text>
                
                <View style={styles.bugActions}>
                  <TouchableOpacity 
                    style={styles.bugActionButton}
                    onPress={() => handleUpdateBugStatus(bug._id, 'Investigating')}
                  >
                    <Text style={styles.bugActionText}>Investigating</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.bugActionButton, { backgroundColor: '#10B981' }]}
                    onPress={() => handleUpdateBugStatus(bug._id, 'Fixed')}
                  >
                    <Text style={[styles.bugActionText, { color: '#FFFFFF' }]}>Mark Fixed</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Order Support */}
        {activeTab === 'orders' && (
          <View style={styles.ordersSection}>
            <Text style={styles.sectionTitle}>Cancellation Requests</Text>
            {cancelRequests.filter(o => o.cancelRequest?.status === 'pending').map((order) => (
              <View key={order._id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>Order #{order._id.slice(-6)}</Text>
                  <Text style={styles.orderAmount}>৳{order.total}</Text>
                </View>
                <Text style={styles.orderUser}>👤 {order.user.name}</Text>
                <Text style={styles.orderUser}>📧 {order.user.email}</Text>
                <Text style={styles.orderReason}>
                  Reason: {order.cancelRequest?.reason}
                </Text>
                <Text style={styles.orderDate}>
                  Requested: {new Date(order.cancelRequest?.requestedAt || '').toLocaleDateString()}
                </Text>
                
                <View style={styles.orderActions}>
                  <TouchableOpacity 
                    style={[styles.orderActionButton, { backgroundColor: '#10B981' }]}
                    onPress={() => handleCancelRequest(order._id, 'approve')}
                  >
                    <Text style={styles.orderActionText}>✓ Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.orderActionButton, { backgroundColor: '#EF4444' }]}
                    onPress={() => handleCancelRequest(order._id, 'reject')}
                  >
                    <Text style={styles.orderActionText}>✕ Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Return/Refund Requests</Text>
            {returnRequests.filter(o => o.returnRequest?.status === 'pending').map((order) => (
              <View key={order._id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>Order #{order._id.slice(-6)}</Text>
                  <Text style={styles.orderAmount}>৳{order.total}</Text>
                </View>
                <Text style={styles.orderUser}>👤 {order.user.name}</Text>
                <Text style={styles.orderUser}>📧 {order.user.email}</Text>
                <Text style={styles.orderReason}>
                  Reason: {order.returnRequest?.reason}
                </Text>
                <Text style={styles.orderRefund}>
                  Refund Amount: ৳{order.returnRequest?.refundAmount}
                </Text>
                <Text style={styles.orderDate}>
                  Requested: {new Date(order.returnRequest?.requestedAt || '').toLocaleDateString()}
                </Text>
                
                <View style={styles.orderActions}>
                  <TouchableOpacity 
                    style={[styles.orderActionButton, { backgroundColor: '#10B981' }]}
                    onPress={() => handleReturnRequest(order._id, 'approve')}
                  >
                    <Text style={styles.orderActionText}>✓ Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.orderActionButton, { backgroundColor: '#EF4444' }]}
                    onPress={() => handleReturnRequest(order._id, 'reject')}
                  >
                    <Text style={styles.orderActionText}>✕ Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ticket Details</Text>
                <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.ticketDetails}>
                <Text style={styles.detailLabel}>Ticket Number</Text>
                <Text style={styles.detailValue}>#{selectedTicket.ticketNumber}</Text>

                <Text style={styles.detailLabel}>User</Text>
                <Text style={styles.detailValue}>{selectedTicket.userId.name}</Text>
                <Text style={styles.detailSubValue}>{selectedTicket.userId.email}</Text>
                {selectedTicket.userId.phone && (
                  <Text style={styles.detailSubValue}>📞 {selectedTicket.userId.phone}</Text>
                )}

                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailValue}>{selectedTicket.type}</Text>

                {selectedTicket.orderId && (
                  <>
                    <Text style={styles.detailLabel}>Order ID</Text>
                    <Text style={styles.detailValue}>{selectedTicket.orderId}</Text>
                  </>
                )}

                <Text style={styles.detailLabel}>Subject</Text>
                <Text style={styles.detailValue}>{selectedTicket.subject}</Text>

                <Text style={styles.detailLabel}>Initial Message</Text>
                <View style={styles.conversationBox}>
                  <View style={styles.userMessageBubble}>
                    <Text style={styles.messageUser}>User: {selectedTicket.userId.name}</Text>
                    <Text style={styles.messageText}>{selectedTicket.message}</Text>
                    <Text style={styles.messageTime}>
                      {new Date(selectedTicket.createdAt).toLocaleString('en-GB')}
                    </Text>
                  </View>

                  {/* Conversation */}
                  {(selectedTicket.conversation || []).map((msg: any, index: number) => (
                    <View 
                      key={index} 
                      style={msg.sender === 'admin' ? styles.adminMessageBubble : styles.userMessageBubble}
                    >
                      <Text style={styles.messageUser}>
                        {msg.sender === 'admin' ? msg.senderName : selectedTicket.userId.name}
                      </Text>
                      <Text style={styles.messageText}>{msg.message}</Text>
                      <Text style={styles.messageTime}>
                        {new Date(msg.timestamp).toLocaleString('en-GB')}
                      </Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.detailLabel}>Send Reply</Text>
                <View style={styles.replyBox}>
                  <TextInput
                    style={styles.replyInput}
                    placeholder="Write your reply to the user..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    value={adminReply}
                    onChangeText={setAdminReply}
                  />
                  <TouchableOpacity 
                    style={styles.sendReplyButton}
                    onPress={handleSendReply}
                  >
                    <Text style={styles.sendReplyText}>📨 Send Reply</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.detailLabel}>Priority</Text>
                <View style={styles.priorityButtons}>
                  {['Low', 'Medium', 'High', 'Urgent'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityButton,
                        selectedTicket.priority === priority && styles.priorityButtonActive,
                        { borderColor: getPriorityColor(priority) }
                      ]}
                      onPress={() => handleUpdatePriority(selectedTicket._id, priority)}
                    >
                      <Text style={[
                        styles.priorityButtonText,
                        selectedTicket.priority === priority && { color: getPriorityColor(priority) }
                      ]}>
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.detailLabel}>Update Status</Text>
                <View style={styles.statusButtons}>
                  <TouchableOpacity
                    style={[styles.statusButton, { backgroundColor: '#8B5CF6' }]}
                    onPress={() => handleUpdateTicketStatus(selectedTicket._id, 'Seen')}
                  >
                    <Text style={styles.statusButtonText}>Seen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusButton, { backgroundColor: '#10B981' }]}
                    onPress={() => handleUpdateTicketStatus(selectedTicket._id, 'Resolved')}
                  >
                    <Text style={styles.statusButtonText}>Resolved</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusButton, { backgroundColor: '#6B7280' }]}
                    onPress={() => handleUpdateTicketStatus(selectedTicket._id, 'Closed')}
                  >
                    <Text style={styles.statusButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
  },
  dashboard: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 4,
  },
  ticketsSection: {
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  activeFilterButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketNumber: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#3B82F6',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  ticketSubject: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 6,
  },
  ticketUser: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  ticketType: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
  ticketDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  bugsSection: {
    padding: 16,
  },
  bugCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  bugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bugNumber: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#EF4444',
  },
  bugType: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 6,
  },
  bugDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
  },
  bugUser: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 12,
  },
  bugActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bugActionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
  },
  bugActionText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
  },
  ticketDetails: {
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginTop: 8,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  detailSubValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  detailMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
  },
  replyInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  ordersSection: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#F59E0B',
  },
  orderAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  orderUser: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  orderReason: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  orderRefund: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 12,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  orderActionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  orderActionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  conversationBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    maxHeight: 300,
  },
  userMessageBubble: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  adminMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  messageUser: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  replyBox: {
    marginTop: 8,
  },
  sendReplyButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  sendReplyText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  priorityButtonActive: {
    backgroundColor: '#F3F4F6',
  },
  priorityButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
});
