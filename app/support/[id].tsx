import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, resolveUrl } from '../../config/api';
import { ArrowLeft, Send, Clock, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

interface Message {
  sender: 'user' | 'admin';
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface Ticket {
  _id: string;
  ticketNumber: string;
  type: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  conversation: Message[];
  createdAt: string;
  lastReplyAt?: string;
  lastReplyBy?: string;
}

export default function TicketDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  useEffect(() => {
    if (ticket) {
      // Mark as read when user opens the ticket
      markAsRead();
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [ticket?.conversation?.length]);

  const fetchTicketDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(resolveUrl(`/support/tickets/${id}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTicket(data.data);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch ticket');
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
      Alert.alert('Error', 'Failed to load ticket details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(resolveUrl(`/support/tickets/${id}/mark-read`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reader: 'user' }),
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      Alert.alert('Error', 'Please write a message');
      return;
    }

    setSending(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(resolveUrl(`/support/tickets/${id}/reply`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: replyMessage,
          sender: 'user',
          senderName: user?.name || 'User'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReplyMessage('');
        setTicket(data.data);
        Alert.alert('✅ Success', 'Reply sent successfully');
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTicketDetails();
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading ticket details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Ticket not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>#{ticket.ticketNumber}</Text>
            <View style={styles.statusContainer}>
              {getStatusIcon(ticket.status)}
              <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                {ticket.status}
              </Text>
            </View>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* Ticket Info */}
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketSubject}>{ticket.subject}</Text>
          <Text style={styles.ticketType}>📋 {ticket.type}</Text>
          <Text style={styles.ticketDate}>
            Created: {new Date(ticket.createdAt).toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>

        {/* Conversation */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.conversation}
          contentContainerStyle={styles.conversationContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Initial Message */}
          <View style={[styles.messageCard, styles.userMessage]}>
            <Text style={styles.messageSender}>You</Text>
            <Text style={styles.messageText}>{ticket.message}</Text>
            <Text style={styles.messageTime}>
              {new Date(ticket.createdAt).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>

          {/* Conversation Messages */}
          {(ticket.conversation || []).map((msg, index) => (
            <View 
              key={index} 
              style={[
                styles.messageCard, 
                msg.sender === 'user' ? styles.userMessage : styles.adminMessage
              ]}
            >
              <Text style={styles.messageSender}>
                {msg.sender === 'user' ? 'You' : `${msg.senderName} (Support)`}
              </Text>
              <Text style={styles.messageText}>{msg.message}</Text>
              <View style={styles.messageFooter}>
                <Text style={styles.messageTime}>
                  {new Date(msg.timestamp).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
                {msg.sender === 'user' && (
                  <Text style={styles.readStatus}>
                    {msg.read ? '✓✓' : '✓'}
                  </Text>
                )}
              </View>
            </View>
          ))}

          {ticket.status === 'Resolved' || ticket.status === 'Closed' ? (
            <View style={styles.resolvedNotice}>
              <CheckCircle size={20} color="#10B981" />
              <Text style={styles.resolvedText}>
                This ticket has been {ticket.status.toLowerCase()}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Reply Box */}
        {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
          <View style={styles.replyContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Write your reply..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={replyMessage}
              onChangeText={setReplyMessage}
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={handleSendReply}
              disabled={sending}
            >
              <Send size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
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
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  ticketInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  ticketSubject: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  ticketType: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  ticketDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  conversation: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  conversationContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageCard: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#3B82F6',
  },
  adminMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageSender: {
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
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  readStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  resolvedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    marginTop: 12,
  },
  resolvedText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
