import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { API_URL, resolveUrl } from '../../config/api';
import { ArrowLeft, MessageCircle, Clock, CheckCircle, AlertCircle } from 'lucide-react-native';

export default function MyTicketsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchMyTickets = async () => {
    try {
      if (!user?._id) return;
      
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(resolveUrl(`/support/tickets/user/${user._id}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setMyTickets(data.data);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      Alert.alert('Error', 'Failed to load tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyTickets();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return '#3B82F6';
      case 'Seen': return '#8B5CF6';
      case 'Responded': return '#10B981';
      case 'Resolved': return '#6B7280';
      case 'Closed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open': return <Clock size={16} color="#3B82F6" />;
      case 'Seen': return <AlertCircle size={16} color="#8B5CF6" />;
      case 'Responded': return <CheckCircle size={16} color="#10B981" />;
      case 'Resolved': return <CheckCircle size={16} color="#6B7280" />;
      case 'Closed': return <CheckCircle size={16} color="#6B7280" />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Support Tickets</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading tickets...</Text>
          </View>
        ) : myTickets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MessageCircle size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Tickets Yet</Text>
            <Text style={styles.emptyText}>You haven't created any support tickets</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push('/support/create-ticket')}
            >
              <Text style={styles.createButtonText}>Create Ticket</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {myTickets.map((ticket) => (
              <TouchableOpacity 
                key={ticket._id} 
                style={styles.ticketCard}
                onPress={() => router.push(`/support/${ticket._id}` as any)}
              >
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketNumber}>#{ticket.ticketNumber}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {ticket.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{ticket.unreadCount}</Text>
                      </View>
                    )}
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
                      {getStatusIcon(ticket.status)}
                      <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                        {ticket.status}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                <Text style={styles.ticketType}>📋 {ticket.type}</Text>
                
                {ticket.lastReplyAt && (
                  <Text style={styles.lastReply}>
                    Last reply: {new Date(ticket.lastReplyAt).toLocaleDateString('en-GB')} by {ticket.lastReplyBy === 'admin' ? 'Support' : 'You'}
                  </Text>
                )}

                <Text style={styles.ticketDate}>
                  Created: {new Date(ticket.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 8,
  },
  createButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
  },
  createButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketNumber: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#3B82F6',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter-Bold',
  },
  ticketSubject: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 6,
  },
  ticketType: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
  },
  lastReply: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
    marginBottom: 8,
  },
  ticketDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
});
