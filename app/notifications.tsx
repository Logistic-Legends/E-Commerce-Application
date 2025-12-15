import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, resolveUrl } from '../config/api';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Bell,
  BellOff,
  Package,
  MessageSquare,
  Shield,
  Gift,
  Smartphone,
  ChevronRight,
  Check,
  Trash2,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react-native';

interface Notification {
  _id: string;
  type: 'order' | 'support' | 'profile' | 'promotion' | 'app' | 'broadcast';
  category: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data?: any;
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
    
    // Auto-refresh every 15 seconds for real-time notifications
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing notifications...');
      fetchNotifications();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      if (!user?._id) return;

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user._id)
        .order('created_at', { ascending: false })
        .limit(100);

      // Filter by read status if needed
      if (filter === 'unread') {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
      } else {
        // Transform data to match interface
        const transformedData = (data || []).map((notif: any) => ({
          _id: notif.id,
          type: notif.type,
          category: notif.category || notif.type,
          title: notif.title,
          message: notif.message,
          isRead: notif.is_read,
          createdAt: notif.created_at,
          readAt: notif.read_at,
          actionUrl: notif.action_url,
          priority: notif.priority || 'medium',
          data: notif.data
        }));

        setNotifications(transformedData);

        // Count unread
        const unreadData = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user._id)
          .eq('is_read', false);

        setUnreadCount(unreadData.count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (!error) {
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId
              ? { ...notif, isRead: true, readAt: new Date().toISOString() }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!user?._id) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user._id)
        .eq('is_read', false);

      if (!error) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
        Alert.alert('✅ Success', 'All notifications marked as read');
      } else {
        Alert.alert('❌ Error', 'Failed to mark all as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('❌ Error', 'Failed to mark all as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

              if (!error) {
                const deletedNotif = notifications.find(n => n._id === notificationId);
                setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
                if (deletedNotif && !deletedNotif.isRead) {
                  setUnreadCount(prev => Math.max(0, prev - 1));
                }
              } else {
                Alert.alert('❌ Error', 'Failed to delete notification');
              }
            } catch (error) {
              console.error('Error deleting notification:', error);
              Alert.alert('❌ Error', 'Failed to delete notification');
            }
          }
        }
      ]
    );
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user?._id) return;
              
              // Delete all notifications for this user
              const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', user._id);

              if (!error) {
                setNotifications([]);
                setUnreadCount(0);
                Alert.alert('✅ Success', 'All notifications cleared');
              } else {
                Alert.alert('❌ Error', 'Failed to clear notifications');
              }
            } catch (error) {
              console.error('Error clearing notifications:', error);
              Alert.alert('❌ Error', 'Failed to clear notifications');
            }
          }
        }
      ]
    );
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate based on actionUrl or type
    if (notification.actionUrl) {
      router.push(notification.actionUrl as any);
    } else {
      // Default navigation based on type
      switch (notification.type) {
        case 'order':
          router.push('/orders' as any);
          break;
        case 'support':
          router.push('/support' as any);
          break;
        case 'profile':
          router.push('/(tabs)/profile' as any);
          break;
        default:
          // Show detail modal or do nothing
          break;
      }
    }
  };

  const getNotificationIcon = (type: string, category: string) => {
    switch (type) {
      case 'order':
        return { Icon: Package, color: '#3B82F6', bg: '#EFF6FF' };
      case 'support':
        return { Icon: MessageSquare, color: '#10B981', bg: '#D1FAE5' };
      case 'profile':
        return { Icon: Shield, color: '#F59E0B', bg: '#FEF3C7' };
      case 'promotion':
        return { Icon: Gift, color: '#EF4444', bg: '#FEE2E2' };
      case 'app':
        return { Icon: Smartphone, color: '#8B5CF6', bg: '#EDE9FE' };
      default:
        return { Icon: Bell, color: '#6B7280', bg: '#F3F4F6' };
    }
  };

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { color: '#EF4444', label: 'Urgent' };
      case 'high':
        return { color: '#F59E0B', label: 'High' };
      case 'medium':
        return { color: '#3B82F6', label: 'Medium' };
      case 'low':
        return { color: '#6B7280', label: 'Low' };
      default:
        return { color: '#6B7280', label: '' };
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Bell size={24} color="#111827" />
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Filter and Actions */}
      <View style={styles.filterContainer}>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
              All ({notifications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'unread' && styles.filterButtonActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterButtonText, filter === 'unread' && styles.filterButtonTextActive]}>
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.actionButton} onPress={markAllAsRead}>
              <CheckCircle2 size={16} color="#10B981" />
              <Text style={styles.actionButtonText}>Mark all read</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity style={styles.actionButton} onPress={clearAllNotifications}>
              <Trash2 size={16} color="#EF4444" />
              <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <BellOff size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {filter === 'unread'
                ? "You're all caught up!"
                : "You'll see notifications here when you receive them"}
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => {
              const { Icon, color, bg } = getNotificationIcon(notification.type, notification.category);
              const priority = getPriorityIndicator(notification.priority);

              return (
                <TouchableOpacity
                  key={notification._id}
                  style={[
                    styles.notificationCard,
                    !notification.isRead && styles.notificationCardUnread
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                  activeOpacity={0.7}
                >
                  {/* Unread indicator */}
                  {!notification.isRead && <View style={styles.unreadIndicator} />}

                  <View style={styles.notificationContent}>
                    {/* Icon */}
                    <View style={[styles.notificationIcon, { backgroundColor: bg }]}>
                      <Icon size={20} color={color} />
                    </View>

                    {/* Text Content */}
                    <View style={styles.notificationText}>
                      <View style={styles.notificationHeader}>
                        <Text style={styles.notificationTitle} numberOfLines={1}>
                          {notification.title}
                        </Text>
                        {notification.priority !== 'medium' && (
                          <View style={[styles.priorityBadge, { backgroundColor: priority.color + '20' }]}>
                            <Text style={[styles.priorityText, { color: priority.color }]}>
                              {priority.label}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.notificationMessage} numberOfLines={2}>
                        {notification.message}
                      </Text>
                      <View style={styles.notificationFooter}>
                        <Clock size={12} color="#9CA3AF" />
                        <Text style={styles.notificationTime}>{getTimeAgo(notification.createdAt)}</Text>
                        {notification.isRead && (
                          <>
                            <Text style={styles.separator}>•</Text>
                            <Check size={12} color="#10B981" />
                            <Text style={styles.readText}>Read</Text>
                          </>
                        )}
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.notificationActions}>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        style={styles.deleteButton}
                      >
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                      <ChevronRight size={18} color="#9CA3AF" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 4,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  actionButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  notificationsList: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  notificationCardUnread: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#3B82F6',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  separator: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 4,
  },
  readText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 4,
  },
});
