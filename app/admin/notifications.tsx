import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, Switch, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, resolveUrl } from '../../config/api';
import { router } from 'expo-router';
import { 
  Bell, 
  Send, 
  Users, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Gift,
  Megaphone,
  Shield,
  Package,
  MessageSquare,
  Settings as SettingsIcon,
  X,
  Image as ImageIcon,
  Search,
  Filter,
  Eye,
  Trash2
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

interface NotificationHistory {
  _id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  userId?: string;
  userName?: string;
  createdAt: string;
  priority: string;
  isBroadcast: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminNotifications() {
  const [activeTab, setActiveTab] = useState<'send' | 'history' | 'settings'>('send');
  const [sendType, setSendType] = useState<'all' | 'specific'>('all');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Notification Form
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'promotion' as 'order' | 'support' | 'profile' | 'promotion' | 'app',
    category: 'new_discount',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    image: '',
    actionUrl: '',
  });

  // Automated Settings
  const [automatedSettings, setAutomatedSettings] = useState({
    orderUpdates: true,
    supportUpdates: true,
    securityAlerts: true,
    promotionalOffers: true,
  });

  useEffect(() => {
    fetchUsers();
    if (activeTab === 'history') {
      fetchNotificationHistory();
      
      // Auto-refresh every 10 seconds to show new order notifications
      const interval = setInterval(() => {
        fetchNotificationHistory();
      }, 10000);
      
      return () => clearInterval(interval);
    }
    if (activeTab === 'settings') {
      loadAutomationSettings();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      console.log('🔑 Fetching users from Supabase...');
      
      // Fetch users from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'user')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
        return;
      }
      
      // Transform to match expected format
      const transformedUsers = (data || []).map((user: any) => ({
        _id: user._id || user.id,
        name: user.name || 'N/A',
        email: user.email || 'N/A',
        role: user.role || 'user'
      }));
      
      setUsers(transformedUsers);
      console.log('✅ Users loaded:', transformedUsers.length);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchNotificationHistory = async () => {
    try {
      setHistoryLoading(true);
      
      // Fetch from Supabase notifications table
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_admin_notification', true)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Supabase error:', error);
        return;
      }
      
      // Transform data to match expected format
      const transformedData = (data || []).map((notif: any) => ({
        _id: notif.id,
        type: notif.type || 'order',
        category: 'order_placed',
        title: notif.title,
        message: notif.message,
        userId: notif.user_id,
        userName: notif.data?.customerName || 'Customer',
        createdAt: notif.created_at,
        priority: 'medium',
        isBroadcast: false,
        data: notif.data // Keep the full data including orderId
      }));
      
      setNotificationHistory(transformedData);
    } catch (error) {
      console.error('Error fetching notification history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadAutomationSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('automationSettings');
      if (savedSettings) {
        setAutomatedSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading automation settings:', error);
    }
  };

  const saveAutomationSettings = async () => {
    try {
      await AsyncStorage.setItem('automationSettings', JSON.stringify(automatedSettings));
      Alert.alert('✅ Success', 'Automation settings updated successfully!');
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'Failed to update automation settings');
      console.error('Update automation settings error:', error);
    }
  };

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNotificationForm(prev => ({ ...prev, image: result.assets[0].uri }));
    }
  };

  const handleSendNotification = async () => {
    // Validation
    if (!notificationForm.title.trim() || !notificationForm.message.trim()) {
      Alert.alert('❌ Error', 'Please fill in title and message');
      return;
    }

    if (sendType === 'specific' && !selectedUser) {
      Alert.alert('❌ Error', 'Please select a user');
      return;
    }

    setLoading(true);

    try {
      console.log('📤 Sending notification via Supabase...');

      if (sendType === 'all') {
        // Broadcast to all users
        console.log('Broadcasting to all users');
        
        // Get all user IDs
        const { data: allUsers, error: userError } = await supabase
          .from('users')
          .select('_id, id')
          .eq('role', 'user');
        
        if (userError) throw userError;
        
        // Create notification for each user
        const notifications = (allUsers || []).map((user: any) => ({
          user_id: user._id || user.id,
          type: notificationForm.type,
          category: notificationForm.category || 'Promotion',
          title: notificationForm.title,
          message: notificationForm.message,
          is_admin_notification: false,
          is_read: false,
          created_at: new Date().toISOString()
        }));
        
        const { error: insertError } = await supabase
          .from('notifications')
          .insert(notifications);
        
        if (insertError) throw insertError;

        Alert.alert('✅ Success', `Notification sent to ${notifications.length} users!`);
        resetForm();
      } else {
        // Send to specific user
        console.log('Sending to specific user:', selectedUser?.name);
        
        const { error } = await supabase
          .from('notifications')
          .insert([{
            user_id: selectedUser?._id,
            type: notificationForm.type,
            category: notificationForm.category || 'Admin Message',
            title: notificationForm.title,
            message: notificationForm.message,
            is_admin_notification: false,
            is_read: false,
            created_at: new Date().toISOString()
          }]);
        
        if (error) throw error;

        Alert.alert('✅ Success', `Notification sent to ${selectedUser?.name}!`);
        resetForm();
        setSelectedUser(null);
        setShowUserPicker(false);
      }
      
      console.log('✅ Notification sent successfully');
    } catch (error: any) {
      console.error('❌ Send notification error:', error);
      Alert.alert('❌ Error', error.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNotificationForm({
      title: '',
      message: '',
      type: 'promotion',
      category: 'new_discount',
      priority: 'medium',
      image: '',
      actionUrl: '',
    });
    setSelectedUser(null);
  };

  const getCategoryOptions = (type: string) => {
    switch (type) {
      case 'order':
        return [
          { value: 'order_placed', label: 'Order Placed' },
          { value: 'order_confirmed', label: 'Order Confirmed' },
          { value: 'order_shipped', label: 'Order Shipped' },
          { value: 'order_delivered', label: 'Order Delivered' },
        ];
      case 'support':
        return [
          { value: 'ticket_created', label: 'Ticket Created' },
          { value: 'admin_replied', label: 'Admin Replied' },
          { value: 'ticket_closed', label: 'Ticket Closed' },
        ];
      case 'profile':
        return [
          { value: 'phone_updated', label: 'Phone Updated' },
          { value: 'password_changed', label: 'Password Changed' },
          { value: 'suspicious_login', label: 'Suspicious Login' },
        ];
      case 'promotion':
        return [
          { value: 'new_discount', label: 'New Discount' },
          { value: 'flash_sale', label: 'Flash Sale' },
          { value: 'voucher_added', label: 'Voucher Added' },
        ];
      case 'app':
        return [
          { value: 'app_update', label: 'App Update' },
          { value: 'server_maintenance', label: 'Server Maintenance' },
          { value: 'new_feature', label: 'New Feature' },
        ];
      default:
        return [];
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order': return { Icon: Package, color: '#3B82F6' };
      case 'support': return { Icon: MessageSquare, color: '#10B981' };
      case 'profile': return { Icon: Shield, color: '#F59E0B' };
      case 'promotion': return { Icon: Gift, color: '#EF4444' };
      case 'app': return { Icon: Bell, color: '#8B5CF6' };
      default: return { Icon: Bell, color: '#6B7280' };
    }
  };

  const filteredHistory = notificationHistory.filter(notif => 
    notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notif.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notif.userName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Bell size={24} color="#3B82F6" />
          <Text style={styles.headerTitle}>Notification Control</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'send' && styles.activeTab]}
          onPress={() => setActiveTab('send')}
        >
          <Send size={18} color={activeTab === 'send' ? '#3B82F6' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'send' && styles.activeTabText]}>
            Send
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Clock size={18} color={activeTab === 'history' ? '#3B82F6' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <SettingsIcon size={18} color={activeTab === 'settings' ? '#3B82F6' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            Automation
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Send Notification Tab */}
        {activeTab === 'send' && (
          <View style={styles.sendContainer}>
            {/* Send Type Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Send To</Text>
              <View style={styles.sendTypeButtons}>
                <TouchableOpacity
                  style={[styles.sendTypeButton, sendType === 'all' && styles.sendTypeButtonActive]}
                  onPress={() => setSendType('all')}
                >
                  <Users size={20} color={sendType === 'all' ? '#FFFFFF' : '#6B7280'} />
                  <Text style={[styles.sendTypeText, sendType === 'all' && styles.sendTypeTextActive]}>
                    All Users
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sendTypeButton, sendType === 'specific' && styles.sendTypeButtonActive]}
                  onPress={() => setSendType('specific')}
                >
                  <User size={20} color={sendType === 'specific' ? '#FFFFFF' : '#6B7280'} />
                  <Text style={[styles.sendTypeText, sendType === 'specific' && styles.sendTypeTextActive]}>
                    Specific User
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* User Selection (if specific) */}
            {sendType === 'specific' && (
              <View style={styles.section}>
                <Text style={styles.label}>Select User *</Text>
                <TouchableOpacity
                  style={styles.userSelector}
                  onPress={() => setShowUserPicker(true)}
                >
                  <User size={20} color="#6B7280" />
                  <Text style={[styles.userSelectorText, selectedUser && { color: '#111827' }]}>
                    {selectedUser ? selectedUser.name : 'Choose a user'}
                  </Text>
                  <Filter size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            )}

            {/* Notification Type */}
            <View style={styles.section}>
              <Text style={styles.label}>Notification Type *</Text>
              <View style={styles.typeButtons}>
                {['promotion', 'app', 'order', 'support', 'profile'].map((type) => {
                  const { Icon, color } = getTypeIcon(type);
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        notificationForm.type === type && { borderColor: color, backgroundColor: color + '10' }
                      ]}
                      onPress={() => {
                        setNotificationForm(prev => ({ 
                          ...prev, 
                          type: type as any,
                          category: getCategoryOptions(type)[0]?.value || ''
                        }));
                      }}
                    >
                      <Icon size={18} color={notificationForm.type === type ? color : '#6B7280'} />
                      <Text style={[
                        styles.typeButtonText,
                        notificationForm.type === type && { color }
                      ]}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.label}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {getCategoryOptions(notificationForm.type).map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryChip,
                      notificationForm.category === cat.value && styles.categoryChipActive
                    ]}
                    onPress={() => setNotificationForm(prev => ({ ...prev, category: cat.value }))}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      notificationForm.category === cat.value && styles.categoryChipTextActive
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Priority */}
            <View style={styles.section}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityButtons}>
                {[
                  { value: 'low', color: '#6B7280', label: 'Low' },
                  { value: 'medium', color: '#3B82F6', label: 'Medium' },
                  { value: 'high', color: '#F59E0B', label: 'High' },
                  { value: 'urgent', color: '#EF4444', label: 'Urgent' },
                ].map((priority) => (
                  <TouchableOpacity
                    key={priority.value}
                    style={[
                      styles.priorityButton,
                      notificationForm.priority === priority.value && {
                        backgroundColor: priority.color + '20',
                        borderColor: priority.color
                      }
                    ]}
                    onPress={() => setNotificationForm(prev => ({ ...prev, priority: priority.value as any }))}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      notificationForm.priority === priority.value && { color: priority.color }
                    ]}>
                      {priority.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Title */}
            <View style={styles.section}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={notificationForm.title}
                onChangeText={(text) => setNotificationForm(prev => ({ ...prev, title: text }))}
                placeholder="Enter notification title"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Message */}
            <View style={styles.section}>
              <Text style={styles.label}>Message *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notificationForm.message}
                onChangeText={(text) => setNotificationForm(prev => ({ ...prev, message: text }))}
                placeholder="Enter notification message"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Optional Image */}
            <View style={styles.section}>
              <Text style={styles.label}>Image (Optional)</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={handleImagePicker}>
                {notificationForm.image ? (
                  <Image source={{ uri: notificationForm.image }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <ImageIcon size={32} color="#9CA3AF" />
                    <Text style={styles.imagePickerText}>Tap to upload image</Text>
                  </View>
                )}
              </TouchableOpacity>
              {notificationForm.image && (
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setNotificationForm(prev => ({ ...prev, image: '' }))}
                >
                  <Text style={styles.removeImageText}>Remove Image</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Action URL */}
            <View style={styles.section}>
              <Text style={styles.label}>Action URL (Optional)</Text>
              <TextInput
                style={styles.input}
                value={notificationForm.actionUrl}
                onChangeText={(text) => setNotificationForm(prev => ({ ...prev, actionUrl: text }))}
                placeholder="/orders or /support"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Send Button */}
            <TouchableOpacity
              style={[styles.sendButton, loading && styles.sendButtonDisabled]}
              onPress={handleSendNotification}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Send size={20} color="#FFFFFF" />
                  <Text style={styles.sendButtonText}>
                    {sendType === 'all' ? 'Send to All Users' : 'Send to User'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <View style={styles.historyContainer}>
            {/* Search */}
            <View style={styles.searchContainer}>
              <Search size={20} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search notifications..."
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {historyLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : filteredHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <Clock size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No notification history</Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {filteredHistory.map((notif) => {
                  const { Icon, color } = getTypeIcon(notif.type);
                  return (
                    <TouchableOpacity 
                      key={notif._id} 
                      style={styles.historyCard}
                      onPress={() => {
                        console.log('📋 Notification clicked:', {
                          type: notif.type,
                          hasData: !!notif.data,
                          orderId: notif.data?.orderId,
                          fullData: notif.data
                        });
                        
                        // If it's an order notification, navigate to order management
                        if (notif.type === 'order' && notif.data?.orderId) {
                          console.log('✅ Navigating to order:', notif.data.orderId);
                          router.push({
                            pathname: '/admin/orders',
                            params: { orderId: notif.data.orderId }
                          } as any);
                        } else {
                          console.log('⚠️ Cannot navigate - missing data or not order type');
                        }
                      }}
                    >
                      <View style={[styles.historyIcon, { backgroundColor: color + '20' }]}>
                        <Icon size={20} color={color} />
                      </View>
                      <View style={styles.historyContent}>
                        <Text style={styles.historyTitle}>{notif.title}</Text>
                        <Text style={styles.historyMessage} numberOfLines={2}>
                          {notif.message}
                        </Text>
                        {notif.data && (
                          <View style={styles.historyOrderDetails}>
                            <Text style={styles.historyOrderText}>
                              Order: {notif.data.orderNumber} • Customer: {notif.data.customerName} • ৳{notif.data.totalAmount?.toFixed(2)}
                            </Text>
                          </View>
                        )}
                        <View style={styles.historyMeta}>
                          <Text style={styles.historyMetaText}>
                            {notif.isBroadcast || notif.type === 'broadcast' 
                              ? '📢 Broadcast to all users' 
                              : `👤 ${notif.userName || 'Specific user'}`}
                          </Text>
                          <Text style={styles.historyMetaText}>•</Text>
                          <Text style={styles.historyMetaText}>
                            {new Date(notif.createdAt).toLocaleString()}
                          </Text>
                        </View>
                        {notif.type === 'order' && (
                          <Text style={styles.tapToManageText}>Tap to manage order →</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Automation Settings Tab */}
        {activeTab === 'settings' && (
          <View style={styles.settingsContainer}>
            <Text style={styles.settingsTitle}>Automated Notifications</Text>
            <Text style={styles.settingsSubtitle}>
              Control which events automatically trigger notifications
            </Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Package size={20} color="#3B82F6" />
                <View>
                  <Text style={styles.settingTitle}>Order Updates</Text>
                  <Text style={styles.settingDescription}>
                    Auto-send notifications for order status changes
                  </Text>
                </View>
              </View>
              <Switch
                value={automatedSettings.orderUpdates}
                onValueChange={(value) => setAutomatedSettings(prev => ({ ...prev, orderUpdates: value }))}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <MessageSquare size={20} color="#10B981" />
                <View>
                  <Text style={styles.settingTitle}>Support Ticket Updates</Text>
                  <Text style={styles.settingDescription}>
                    Notify users when admin replies or closes tickets
                  </Text>
                </View>
              </View>
              <Switch
                value={automatedSettings.supportUpdates}
                onValueChange={(value) => setAutomatedSettings(prev => ({ ...prev, supportUpdates: value }))}
                trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Shield size={20} color="#F59E0B" />
                <View>
                  <Text style={styles.settingTitle}>Security Alerts</Text>
                  <Text style={styles.settingDescription}>
                    Alert users about password changes and suspicious activity
                  </Text>
                </View>
              </View>
              <Switch
                value={automatedSettings.securityAlerts}
                onValueChange={(value) => setAutomatedSettings(prev => ({ ...prev, securityAlerts: value }))}
                trackColor={{ false: '#E5E7EB', true: '#F59E0B' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Gift size={20} color="#EF4444" />
                <View>
                  <Text style={styles.settingTitle}>Promotional Offers</Text>
                  <Text style={styles.settingDescription}>
                    Send promotional notifications to opted-in users
                  </Text>
                </View>
              </View>
              <Switch
                value={automatedSettings.promotionalOffers}
                onValueChange={(value) => setAutomatedSettings(prev => ({ ...prev, promotionalOffers: value }))}
                trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TouchableOpacity style={styles.saveSettingsButton} onPress={saveAutomationSettings}>
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.saveSettingsText}>Save Automation Settings</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* User Picker Modal */}
      <Modal
        visible={showUserPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUserPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select User</Text>
              <TouchableOpacity onPress={() => setShowUserPicker(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.userList}>
              {users.map((user) => (
                <TouchableOpacity
                  key={user._id}
                  style={[
                    styles.userItem,
                    selectedUser?._id === user._id && styles.userItemSelected
                  ]}
                  onPress={() => {
                    setSelectedUser(user);
                    setShowUserPicker(false);
                  }}
                >
                  <View style={styles.userAvatar}>
                    <User size={20} color="#6B7280" />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>
                  {selectedUser?._id === user._id && (
                    <CheckCircle size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  sendContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  sendTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sendTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sendTypeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
  },
  sendTypeText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  sendTypeTextActive: {
    color: '#FFFFFF',
  },
  userSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userSelectorText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  typeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#DBEAFE',
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#3B82F6',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imagePicker: {
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imagePickerText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  removeImageButton: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  removeImageText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#EF4444',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  historyContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 16,
  },
  historyList: {
    padding: 20,
    gap: 12,
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  historyMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  historyOrderDetails: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  historyOrderText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  historyMetaText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  tapToManageText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
    marginTop: 4,
  },
  settingsContainer: {
    padding: 20,
  },
  settingsTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  settingsSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 18,
  },
  saveSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  saveSettingsText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  userList: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  userItemSelected: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
});
