import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
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
  LogOut
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
  const { logout } = useAuth();
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(mockAdminProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<AdminProfile>(mockAdminProfile);

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
      quality: 1,
    });

    if (!result.canceled) {
      setEditForm((prev: AdminProfile) => ({ ...prev, profileImage: result.assets[0].uri }));
    }
  };

  const handleSaveProfile = () => {
    setAdminProfile(editForm);
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
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
          onPress: () => {
            logout(); // Clear authentication state
            router.replace('/(auth)' as any);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                  <TextInput
                    style={styles.editInput}
                    value={editForm.email}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
                    placeholder="Email Address"
                  />
                  <TextInput
                    style={styles.editInput}
                    value={editForm.phone}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
                    placeholder="Phone Number"
                  />
                  <TextInput
                    style={styles.editInput}
                    value={editForm.joinDate}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, joinDate: text }))}
                    placeholder="Join Date (YYYY-MM-DD)"
                  />
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
            >
              <Edit3 size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>

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
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <ShoppingBag size={24} color="#3B82F6" />
              <Text style={styles.statNumber}>{quickStats.totalOrders}</Text>
              <Text style={styles.statLabel}>Orders Managed</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={24} color="#10B981" />
              <Text style={styles.statNumber}>{quickStats.totalProducts}</Text>
              <Text style={styles.statLabel}>Products Added</Text>
            </View>
            <View style={styles.statCard}>
              <Users size={24} color="#8B5CF6" />
              <Text style={styles.statNumber}>{quickStats.totalCustomers}</Text>
              <Text style={styles.statLabel}>Customers</Text>
            </View>
            <View style={styles.statCard}>
              <Activity size={24} color="#F59E0B" />
              <Text style={styles.statNumber}>+{quickStats.monthlyGrowth}%</Text>
              <Text style={styles.statLabel}>Monthly Growth</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {recentActivities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  {getActivityIcon(activity.type)}
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityAction}>{activity.action}</Text>
                  <Text style={styles.activityTime}>{activity.timestamp}</Text>
                </View>
              </View>
            ))}
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

          <TouchableOpacity style={styles.settingItem}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
});
