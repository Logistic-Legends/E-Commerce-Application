import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Activity, Clock, User, Package, ShoppingCart, Settings, LogIn } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, resolveUrl } from '../config/api';

interface ActivityItem {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: string;
  actionType: string;
  description: string;
  metadata: any;
  status: string;
  createdAt: string;
}

interface RealTimeActivityProps {
  userId?: string;
  userRole?: string;
  limit?: number;
  showAll?: boolean; // if true, shows all activities (admin view)
  onRefresh?: () => void;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'product': return Package;
    case 'order': return ShoppingCart;
    case 'user': return User;
    case 'auth': return LogIn;
    case 'system': return Settings;
    default: return Activity;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'product': return '#3B82F6';
    case 'order': return '#10B981';
    case 'user': return '#8B5CF6';
    case 'auth': return '#F59E0B';
    case 'system': return '#6B7280';
    default: return '#3B82F6';
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString();
};

export default function RealTimeActivity({ 
  userId, 
  userRole, 
  limit = 10, 
  showAll = false,
  onRefresh 
}: RealTimeActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchActivities(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [userId, userRole, limit, showAll]);

  const fetchActivities = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('token');
      let url = '';
      
      if (showAll) {
        // Admin view - show all activities
        url = resolveUrl(`/activities/all?limit=${limit}${userRole ? `&role=${userRole}` : ''}`);
      } else if (userId) {
        // User view - show only their activities
        url = resolveUrl(`/activities/my?userId=${userId}&limit=${limit}`);
      } else {
        // Recent activities
        url = resolveUrl(`/activities/recent?limit=${limit}`);
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setActivities(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch activities');
      }
    } catch (err: any) {
      console.error('Error fetching activities:', err);
      setError(err.message || 'Failed to fetch activities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities();
    onRefresh?.();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading activities...</Text>
      </View>
    );
  }

  if (error && activities.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchActivities()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Activity size={20} color="#1F2937" />
        <Text style={styles.title}>Recent Activity</Text>
        <View style={styles.liveDot} />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Activity size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No recent activities</Text>
          </View>
        ) : (
          activities.map((activity) => {
            const Icon = getActivityIcon(activity.actionType);
            const color = getActivityColor(activity.actionType);
            
            return (
              <View key={activity._id} style={styles.activityItem}>
                <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                  <Icon size={18} color={color} />
                </View>
                
                <View style={styles.activityContent}>
                  <Text style={styles.activityAction}>{activity.action}</Text>
                  {showAll && (
                    <Text style={styles.activityUser}>
                      by {activity.userName} ({activity.userRole})
                    </Text>
                  )}
                  {activity.description && (
                    <Text style={styles.activityDescription} numberOfLines={2}>
                      {activity.description}
                    </Text>
                  )}
                  <View style={styles.activityFooter}>
                    <Clock size={12} color="#9CA3AF" />
                    <Text style={styles.activityTime}>
                      {formatTimeAgo(activity.createdAt)}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: activity.status === 'success' ? '#D1FAE5' : '#FEE2E2' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: activity.status === 'success' ? '#059669' : '#DC2626' }
                      ]}>
                        {activity.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  scrollView: {
    maxHeight: 400,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  activityUser: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  activityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityTime: {
    fontSize: 11,
    color: '#9CA3AF',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
});
