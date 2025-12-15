import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, resolveUrl } from '../../config/api';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Edit3, 
  Shield, 
  Bell, 
  Key, 
  Activity,
  ShoppingBag,
  Users,
  TrendingUp,
  Clock,
  Camera,
  Package,
  ShoppingCart,
  UserPlus,
  Settings,
  LogOut,
  CheckCircle
} from 'lucide-react-native';

interface AdminProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  joinDate: string;
  lastLogin: string;
  profileImage: string;
}

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  type: 'product' | 'order' | 'user' | 'system';
}

interface QuickStats {
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  monthlyGrowth: number;
}

const mockAdminProfile: AdminProfile = {
  name: 'John Smith',
  email: 'john.smith@admin.com',
  phone: '+880 1234 567890',
  role: 'Super Admin',
  joinDate: '2023-01-15',
  lastLogin: '2024-01-02 10:30 AM',
  profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
};

const recentActivities: ActivityLog[] = [
    { id: '1', action: 'Added new product "Wireless Headphones"', timestamp: '2 hours ago', type: 'product' },
    { id: '2', action: 'Updated order #1234 status to Delivered', timestamp: '4 hours ago', type: 'order' },
    { id: '3', action: 'Approved customer account for Sarah Wilson', timestamp: '6 hours ago', type: 'user' },
    { id: '4', action: 'Updated payment gateway settings', timestamp: '1 day ago', type: 'system' },
    { id: '5', action: 'Generated monthly sales report', timestamp: '2 days ago', type: 'system' }
];

const quickStats: QuickStats = {
  totalOrders: 1234,
  totalProducts: 456,
  totalCustomers: 789,
  monthlyGrowth: 12.5
};

export default function AdminProfile() {
  const { logout, user, updateUser } = useAuth();
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(mockAdminProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<AdminProfile>(mockAdminProfile);
  const [stats, setStats] = useState<QuickStats>(quickStats);
  const [activities, setActivities] = useState<ActivityLog[]>(recentActivities);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempJoinDate, setTempJoinDate] = useState(new Date());
  const [saving, setSaving] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotificationPreferences, setShowNotificationPreferences] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetchProfileData(true); // Initial load with spinner
    fetchUnreadNotifications();
    
    // Auto-refresh notifications every 30 seconds
    const notifInterval = setInterval(() => {
      fetchUnreadNotifications();
    }, 30000);
    
    return () => clearInterval(notifInterval);
  }, []);

  const fetchProfileData = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    
    // Set loading to false quickly to show UI, stats can load in background
    if (showLoadingSpinner) {
      setTimeout(() => setLoading(false), 100);
    }
    
    try {
      console.log('🔑 Fetching admin profile data from Supabase...');
      console.log('🔑 Current user:', user);
      
      // Fetch user profile data from Supabase using _id
      if (user?._id) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user._id)
          .single();
        
        if (!userError && userData) {
          console.log('✅ User data from Supabase:', userData);
          
          const joinDate = userData.created_at 
            ? new Date(userData.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })
            : new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              });

          const lastLogin = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });

          const profileData = {
            name: userData.name || user.name || 'Admin User',
            email: userData.email || user.email || 'admin@example.com',
            phone: userData.phone || '+880 1712 345678',
            role: userData.role === 'admin' ? 'Super Admin' : 'Admin',
            joinDate,
            lastLogin,
            profileImage: userData.avatar || mockAdminProfile.profileImage,
          };

          // Only update if data changed
          setAdminProfile(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(profileData)) {
              return profileData;
            }
            return prev;
          });
          
          setEditForm(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(profileData)) {
              return profileData;
            }
            return prev;
          });
        }
      }

      // Fetch stats from Supabase (fast and direct)
      try {
        // Calculate date ranges for monthly growth
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

        // Fetch counts from Supabase in parallel - much faster than API calls
        const [
          ordersCount, 
          productsCount, 
          usersCount, 
          currentMonthOrders, 
          lastMonthOrders
        ] = await Promise.all([
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user'),
          supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', currentMonthStart),
          supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd)
        ]);

        // Calculate monthly growth percentage
        let monthlyGrowth = 0;
        const currentCount = currentMonthOrders.count || 0;
        const lastCount = lastMonthOrders.count || 0;
        
        if (lastCount > 0) {
          monthlyGrowth = parseFloat((((currentCount - lastCount) / lastCount) * 100).toFixed(1));
        } else if (currentCount > 0) {
          monthlyGrowth = 100; // 100% growth if no orders last month but have orders this month
        }

        const realTimeStats = {
          totalOrders: ordersCount.count || quickStats.totalOrders,
          totalProducts: productsCount.count || quickStats.totalProducts,
          totalCustomers: usersCount.count || quickStats.totalCustomers,
          monthlyGrowth: monthlyGrowth,
        };

        console.log('📊 Stats calculated:', realTimeStats);

        // Only update if stats changed
        setStats(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(realTimeStats)) {
            return realTimeStats;
          }
          return prev;
        });
      } catch (apiError) {
        console.log('⚠️ Stats fetch error, using defaults:', apiError);
      }
      
      console.log('✅ Profile data loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching profile data:', error);
      // Set default stats on error
      setStats(quickStats);
    }
    
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData(false);
    fetchUnreadNotifications();
  };

  const fetchUnreadNotifications = async () => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_admin_notification', true)
        .eq('is_read', false);
      
      if (!error && count !== null) {
        setUnreadNotifications(count);
      }
    } catch (error) {
      console.log('⚠️ Error fetching notifications:', error);
    }
  };

  const fetchRecentNotifications = async () => {
    try {
      console.log('🔔 Fetching recent notifications...');
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_admin_notification', true)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('❌ Error fetching notifications:', error);
        return;
      }
      
      console.log('✅ Fetched notifications:', data?.length || 0, 'items');
      if (data && data.length > 0) {
        console.log('📋 First notification:', data[0]);
      }
      
      if (data) {
        setRecentNotifications(data);
      }
    } catch (error) {
      console.log('⚠️ Error fetching recent notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
      
      // Refresh notifications
      fetchRecentNotifications();
      fetchUnreadNotifications();
    } catch (error) {
      console.log('⚠️ Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('is_admin_notification', true)
        .eq('is_read', false);
      
      // Refresh notifications
      fetchRecentNotifications();
      fetchUnreadNotifications();
    } catch (error) {
      console.log('⚠️ Error marking all as read:', error);
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  const parseTimeAgo = (timeStr: string): number => {
    const match = timeStr.match(/(\d+)\s+(min|hour|day)/);
    if (!match) return 0;
    const value = parseInt(match[1]);
    const unit = match[2];
    if (unit === 'min') return value;
    if (unit === 'hour') return value * 60;
    return value * 1440;
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true, // Get base64 data
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      const base64 = result.assets[0].base64;
      
      // Upload to Supabase Storage
      try {
        Alert.alert('Uploading...', 'Please wait while we upload your profile picture');
        
        if (!base64) {
          throw new Error('Failed to read image data');
        }
        
        // Convert base64 to array buffer for Supabase
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Generate unique filename
        const fileName = `profile-${user?._id || Date.now()}-${Date.now()}.jpg`;
        const filePath = `avatars/${fileName}`;
        
        // Upload to Supabase Storage using ArrayBuffer
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, bytes.buffer, {
            contentType: 'image/jpeg',
            upsert: true
          });
        
        if (uploadError) {
          throw uploadError;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        
        console.log('✅ Profile image uploaded:', publicUrl);
        setEditForm((prev: AdminProfile) => ({ ...prev, profileImage: publicUrl }));
        
        Alert.alert('Success', 'Profile picture uploaded successfully!');
      } catch (error: any) {
        console.error('❌ Image upload error:', error);
        Alert.alert('Upload Failed', error.message || 'Failed to upload image. Please try again.');
      }
    }
  };

  const validateBangladeshiPhone = (phone: string): boolean => {
    // Remove spaces, dashes, and parentheses
    const cleaned = phone.replace(/[\s\-()]/g, '');
    
    // Bangladeshi phone patterns (11 digits):
    // Must start with 01 followed by 3,4,5,6,7,8,9
    // +88 01XXXXXXXXX (total 11 digits for phone part)
    // 88 01XXXXXXXXX (total 11 digits for phone part)
    // 01XXXXXXXXX (11 digits)
    
    // Check if it's exactly 11 digits starting with 01
    if (/^01[3-9]\d{8}$/.test(cleaned)) {
      return true;
    }
    
    // Check if it has country code +88 or 88
    if (/^\+?8801[3-9]\d{8}$/.test(cleaned)) {
      return true;
    }
    
    return false;
  };

  const handleSaveProfile = async () => {
    console.log('🔵 Save button clicked!');
    console.log('Current editForm:', editForm);
    
    // Validate name
    if (!editForm.name || editForm.name.trim().length < 2) {
      Alert.alert('Invalid Name', 'Name must be at least 2 characters long.');
      return;
    }

    // Validate phone number (required for admin)
    if (!editForm.phone || !validateBangladeshiPhone(editForm.phone)) {
      Alert.alert(
        'Invalid Phone Number',
        'Please enter a valid 11-digit Bangladeshi phone number.\n\nAccepted formats:\n• +880 1XXX XXX XXX (11 digits)\n• 01XXX XXX XXX (11 digits)\n\nNote: Must start with 013, 014, 015, 016, 017, 018, or 019'
      );
      return;
    }

    setSaving(true);
    console.log('🟡 Starting save process...');
    
    try {
      if (!user?._id) {
        console.error('❌ No user ID found:', user);
        Alert.alert('Error', 'User not found. Please login again.');
        setSaving(false);
        return;
      }
      
      console.log('🟢 User ID:', user._id);
      
      // Prepare update data for Supabase
      const updateData: any = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        updated_at: new Date().toISOString()
      };
      
      // Add profile image if changed
      if (editForm.profileImage && editForm.profileImage !== adminProfile.profileImage) {
        updateData.avatar = editForm.profileImage;
        console.log('🖼️ Updating avatar:', editForm.profileImage);
      }
      
      console.log('🔄 Updating profile in Supabase with data:', updateData);
      
      // Update profile in Supabase users table
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user._id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Supabase update error:', updateError);
        throw new Error(updateError.message || 'Failed to update profile');
      }
      
      console.log('✅ Profile updated successfully in database:', updatedUser);
      
      // Update local state
      const updatedProfile = {
        ...adminProfile,
        name: editForm.name,
        phone: editForm.phone,
        profileImage: editForm.profileImage
      };
      
      setAdminProfile(updatedProfile);
      setEditForm(updatedProfile);
      setIsEditing(false);
      
      // Update AuthContext to sync profile changes
      await updateUser({
        name: editForm.name,
        phone: editForm.phone,
        avatar: editForm.profileImage
      });
      
      Alert.alert(
        '✅ Success', 
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('✅ Alert dismissed, refreshing data...');
              fetchProfileData(false);
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change functionality will be implemented here.');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout(); // Clear authentication state
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'product': return <ShoppingBag size={16} color="#3B82F6" />;
      case 'order': return <TrendingUp size={16} color="#10B981" />;
      case 'user': return <Users size={16} color="#8B5CF6" />;
      case 'system': return <Activity size={16} color="#F59E0B" />;
      default: return <Activity size={16} color="#6B7280" />;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Notification Bell */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Admin Profile</Text>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => router.push('/admin/notifications' as any)}
        >
          <Bell size={24} color="#111827" />
          {unreadNotifications > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
        }
      >
        {/* Profile Summary Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={isEditing ? handleImagePicker : undefined}>
              <Image source={{ uri: isEditing ? editForm.profileImage : adminProfile.profileImage }} style={styles.profileImage} />
              {isEditing && (
                <View style={styles.imageEditOverlay}>
                  <Edit3 size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              {isEditing ? (
                <View style={styles.editForm}>
                  <TextInput
                    style={styles.editInput}
                    value={editForm.name}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                    placeholder="Full Name"
                  />
                  <View style={styles.readOnlyField}>
                    <Text style={styles.readOnlyLabel}>Email (Cannot be changed)</Text>
                    <Text style={styles.readOnlyValue}>{editForm.email}</Text>
                  </View>
                  <TextInput
                    style={styles.editInput}
                    value={editForm.phone}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
                    placeholder="Phone (11 digits, e.g., 01712345678)"
                    keyboardType="phone-pad"
                    maxLength={14}
                  />
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => {
                      try {
                        const currentDate = new Date(editForm.joinDate);
                        setTempJoinDate(isNaN(currentDate.getTime()) ? new Date() : currentDate);
                      } catch {
                        setTempJoinDate(new Date());
                      }
                      setShowDatePicker(true);
                    }}
                  >
                    <Text style={styles.datePickerLabel}>Join Date</Text>
                    <Text style={styles.datePickerValue}>{editForm.joinDate}</Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={tempJoinDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, selectedDate) => {
                        if (Platform.OS === 'android') {
                          setShowDatePicker(false);
                        }
                        if (selectedDate && event.type !== 'dismissed') {
                          const formatted = selectedDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });
                          setEditForm(prev => ({ ...prev, joinDate: formatted }));
                          setTempJoinDate(selectedDate);
                          if (Platform.OS === 'ios') {
                            setShowDatePicker(false);
                          }
                        } else if (Platform.OS === 'ios' && event.type === 'dismissed') {
                          setShowDatePicker(false);
                        }
                      }}
                      maximumDate={new Date()}
                      minimumDate={new Date(2020, 0, 1)}
                    />
                  )}
                </View>
              ) : (
                <>
                  <Text style={styles.profileName}>{adminProfile.name}</Text>
                  <Text style={styles.profileRole}>{adminProfile.role}</Text>
                </>
              )}
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                if (isEditing) {
                  handleSaveProfile();
                } else {
                  setIsEditing(true);
                  setEditForm(adminProfile);
                }
              }}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Edit3 size={20} color="#3B82F6" />
              )}
            </TouchableOpacity>
          </View>

          {!isEditing && (
            <View style={styles.profileDetails}>
              <View style={styles.detailRow}>
                <Mail size={16} color="#6B7280" />
                <Text style={styles.detailText}>{adminProfile.email}</Text>
              </View>
              <View style={styles.detailRow}>
                <Phone size={16} color="#6B7280" />
                <Text style={styles.detailText}>{adminProfile.phone}</Text>
              </View>
              <View style={styles.detailRow}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.detailText}>Joined: {adminProfile.joinDate}</Text>
              </View>
              <View style={styles.detailRow}>
                <Clock size={16} color="#6B7280" />
                <Text style={styles.detailText}>Last Login: {adminProfile.lastLogin}</Text>
              </View>
            </View>
          )}
          
          {/* Save/Cancel Buttons for Edit Mode */}
          {isEditing && (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  console.log('🔴 Cancel button clicked');
                  setIsEditing(false);
                  setEditForm(adminProfile);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton, saving && { opacity: 0.6 }]}
                onPress={() => {
                  console.log('🟢 Save button pressed!');
                  handleSaveProfile();
                }}
                activeOpacity={0.7}
              >
                {saving ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Saving...</Text>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Save Profile</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <ShoppingBag size={24} color="#3B82F6" />
              <Text style={styles.statNumber}>{stats.totalOrders}</Text>
              <Text style={styles.statLabel}>Orders Managed</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={24} color="#10B981" />
              <Text style={styles.statNumber}>{stats.totalProducts}</Text>
              <Text style={styles.statLabel}>Products Added</Text>
            </View>
            <View style={styles.statCard}>
              <Users size={24} color="#8B5CF6" />
              <Text style={styles.statNumber}>{stats.totalCustomers}</Text>
              <Text style={styles.statLabel}>Customers</Text>
            </View>
            <View style={styles.statCard}>
              <Activity size={24} color="#F59E0B" />
              <Text style={styles.statNumber}>{stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth}%</Text>
              <Text style={styles.statLabel}>Monthly Growth</Text>
            </View>
          </View>
        </View>

        {/* Security & Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Security & Settings</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleChangePassword}>
            <View style={styles.settingLeft}>
              <Key size={20} color="#3B82F6" />
              <Text style={styles.settingText}>Change Password</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Shield size={20} color="#10B981" />
              <Text style={styles.settingText}>Two-Factor Authentication</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => {
              setShowNotificationPreferences(true);
              fetchRecentNotifications();
            }}
          >
            <View style={styles.settingLeft}>
              <Bell size={20} color="#F59E0B" />
              <Text style={styles.settingText}>Notification Preferences</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, styles.logoutButton]} onPress={handleLogout}>
            <View style={styles.settingLeft}>
              <LogOut size={20} color="#EF4444" />
              <Text style={[styles.settingText, styles.logoutText]}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Notification Preferences Modal */}
      <Modal
        visible={showNotificationPreferences}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotificationPreferences(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Center</Text>
              <TouchableOpacity 
                onPress={() => setShowNotificationPreferences(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.notificationActions}>
              <Text style={styles.notificationCount}>
                {unreadNotifications} unread notifications
              </Text>
              {unreadNotifications > 0 && (
                <TouchableOpacity 
                  onPress={markAllAsRead}
                  style={styles.markAllReadButton}
                >
                  <CheckCircle size={16} color="#10B981" />
                  <Text style={styles.markAllReadText}>Mark all as read</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.notificationList}>
              {recentNotifications.length === 0 ? (
                <View style={styles.emptyNotifications}>
                  <Bell size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No notifications yet</Text>
                </View>
              ) : (
                recentNotifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      !notification.is_read && styles.unreadNotification
                    ]}
                    onPress={() => {
                      // Mark as read
                      if (!notification.is_read) {
                        markNotificationAsRead(notification.id);
                      }
                      // Close modal
                      setShowNotificationPreferences(false);
                      // Navigate to order management page with order ID
                      if (notification.data?.orderId) {
                        router.push({
                          pathname: '/admin/orders',
                          params: { orderId: notification.data.orderId }
                        } as any);
                      } else {
                        router.push('/admin/orders' as any);
                      }
                    }}
                  >
                    <View style={styles.notificationIconContainer}>
                      <Package size={24} color="#3B82F6" />
                    </View>
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationHeader}>
                        <Text style={styles.notificationTitle}>
                          {notification.title}
                        </Text>
                        {notification.data?.orderNumber && (
                          <View style={styles.orderBadge}>
                            <Text style={styles.orderBadgeText}>
                              {notification.data.orderNumber}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.notificationMessage}>
                        {notification.message}
                      </Text>
                      {notification.data && (
                        <View style={styles.notificationDetails}>
                          <View style={styles.detailRow}>
                            <User size={14} color="#6B7280" />
                            <Text style={styles.detailText}>
                              {notification.data.customerName}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Package size={14} color="#6B7280" />
                            <Text style={styles.detailText}>
                              {notification.data.itemsCount} {notification.data.itemsCount === 1 ? 'item' : 'items'}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <TrendingUp size={14} color="#10B981" />
                            <Text style={[styles.detailText, styles.amountText]}>
                              ৳{notification.data.totalAmount?.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      )}
                      <View style={styles.notificationFooter}>
                        <Clock size={12} color="#9CA3AF" />
                        <Text style={styles.notificationTime}>
                          {new Date(notification.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                        <Text style={styles.viewOrderText}>Tap to manage →</Text>
                      </View>
                    </View>
                    {!notification.is_read && (
                      <View style={styles.unreadDot} />
                    )}
                  </TouchableOpacity>
                ))
              )}
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
  },
  editForm: {
    gap: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#F9FAFB',
  },
  editButton: {
    padding: 8,
  },
  profileDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
  },
  activitySection: {
    marginBottom: 24,
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  settingArrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  imageEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  logoutButton: {
    borderColor: '#FEE2E2',
    borderWidth: 1,
    backgroundColor: '#FEF2F2',
  },
  logoutText: {
    color: '#EF4444',
  },
  readOnlyField: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  readOnlyLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  readOnlyValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  datePickerButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  datePickerLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  datePickerValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  notificationModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 20,
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
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6B7280',
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  notificationCount: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  markAllReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
  },
  markAllReadText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
  },
  notificationList: {
    flex: 1,
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  unreadNotification: {
    backgroundColor: '#EBF5FF',
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  orderBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  orderBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 12,
  },
  notificationDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  amountText: {
    color: '#10B981',
    fontFamily: 'Inter-Bold',
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  viewOrderText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
    marginLeft: 'auto',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
    marginTop: 6,
  },
});
