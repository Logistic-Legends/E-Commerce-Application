import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, TextInput, Modal, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { 
  ChevronRight, 
  Package, 
  MapPin, 
  CreditCard, 
  CircleHelp as HelpCircle, 
  Settings, 
  LogOut,
  Edit3,
  Star,
  Gift,
  Heart,
  Plus,
  Trash2,
  Home,
  Building2,
  Bell,
  Shield,
  Eye,
  X,
  Check,
  Clock,
  Truck,
  CheckCircle,
  FileText,
  Database
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  membershipStatus: string;
  loyaltyPoints: number;
}

interface Address {
  id: string;
  type: 'Home' | 'Office' | 'Other';
  name: string;
  street: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}

interface Order {
  id: string;
  date: string;
  status: 'Delivered' | 'Pending' | 'Cancelled' | 'Processing';
  total: number;
  items: number;
}

interface PaymentMethod {
  id: string;
  type: 'Card' | 'Mobile Banking';
  name: string;
  lastFour: string;
  isDefault: boolean;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { items: wishlistItems, removeFromWishlist } = useWishlist();
  const router = useRouter();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    analytics: true,
    personalizedAds: false,
    locationSharing: false
  });
  const [notificationSettings, setNotificationSettings] = useState({
    orderUpdates: true,
    promotions: true
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses' | 'payments' | 'settings'>('overview');
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: user?.name || 'John Doe',
    email: user?.email || 'john@example.com',
    phone: '+880 1234 567890',
    avatar: user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    membershipStatus: 'Gold Member',
    loyaltyPoints: 2450
  });
  
  const [editForm, setEditForm] = useState(userProfile);
  
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      type: 'Home',
      name: 'Home Address',
      street: '123 Main Street, Apt 4B',
      city: 'Dhaka',
      postalCode: '1000',
      isDefault: true
    },
    {
      id: '2',
      type: 'Office',
      name: 'Work Address',
      street: '456 Business District',
      city: 'Dhaka',
      postalCode: '1205',
      isDefault: false
    }
  ]);
  
  const [orders, setOrders] = useState<Order[]>([
    { id: 'ORD-001', date: '2024-01-15', status: 'Delivered', total: 2500, items: 3 },
    { id: 'ORD-002', date: '2024-01-10', status: 'Processing', total: 1200, items: 1 },
    { id: 'ORD-003', date: '2024-01-05', status: 'Delivered', total: 3200, items: 5 }
  ]);
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '1', type: 'Card', name: 'Visa Card', lastFour: '4532', isDefault: true },
    { id: '2', type: 'Mobile Banking', name: 'bKash', lastFour: '7890', isDefault: false }
  ]);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  const handleUpdatePassword = () => {
    // TODO: Implement password update logic
    Alert.alert("Success", "Your password has been updated successfully!");
    setShowChangePassword(false);
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
      quality: 1,
    });

    if (!result.canceled) {
      setEditForm(prev => ({ ...prev, avatar: result.assets[0].uri }));
    }
  };

  const handleSaveProfile = () => {
    setUserProfile(editForm);
    setIsEditingProfile(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return '#10B981';
      case 'Processing': return '#F59E0B';
      case 'Pending': return '#3B82F6';
      case 'Cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'Home': return Home;
      case 'Office': return Building2;
      default: return MapPin;
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedIn}>
          <Text style={styles.notLoggedInTitle}>Please Log In</Text>
          <Text style={styles.notLoggedInSubtitle}>
            Sign in to access your profile and order history
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={isEditingProfile ? handleImagePicker : undefined}>
            <Image source={{ uri: isEditingProfile ? editForm.avatar : userProfile.avatar }} style={styles.avatar} />
            {isEditingProfile && (
              <View style={styles.imageEditOverlay}>
                <Edit3 size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          
          {isEditingProfile ? (
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
                placeholder="Email"
              />
              <TextInput
                style={styles.editInput}
                value={editForm.phone}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
                placeholder="Phone"
              />
            </View>
          ) : (
            <>
              <Text style={styles.userName}>{userProfile.name}</Text>
              <Text style={styles.userEmail}>{userProfile.email}</Text>
              <View style={styles.membershipBadge}>
                <Star size={16} color="#F59E0B" />
                <Text style={styles.membershipText}>{userProfile.membershipStatus}</Text>
              </View>
            </>
          )}
          
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              if (isEditingProfile) {
                handleSaveProfile();
              } else {
                setIsEditingProfile(true);
                setEditForm(userProfile);
              }
            }}
          >
            <Edit3 size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {[
            { key: 'overview', label: 'Overview', icon: Eye },
            { key: 'orders', label: 'Orders', icon: Package },
            { key: 'addresses', label: 'Addresses', icon: MapPin },
            { key: 'payments', label: 'Payments', icon: CreditCard },
            { key: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <tab.icon size={16} color={activeTab === tab.key ? '#3B82F6' : '#6B7280'} />
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            {/* Loyalty Points */}
            <View style={styles.loyaltyCard}>
              <View style={styles.loyaltyHeader}>
                <Gift size={24} color="#F59E0B" />
                <Text style={styles.loyaltyTitle}>Loyalty Points</Text>
              </View>
              <Text style={styles.loyaltyPoints}>{userProfile.loyaltyPoints}</Text>
              <Text style={styles.loyaltySubtitle}>Redeem for exclusive rewards</Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => router.push('/(tabs)/wishlist')}
              >
                <View style={styles.wishlistBadge}>
                  <Text style={styles.wishlistCount}>{wishlistItems.length}</Text>
                </View>
                <Heart size={24} color="#EF4444" fill="#EF4444" />
                <Text style={styles.quickActionText}>Wishlist</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => setActiveTab('orders')}
              >
                <Package size={24} color="#3B82F6" fill="#3B82F6" />
                <Text style={styles.quickActionText}>Track Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction}>
                <HelpCircle size={24} color="#10B981" />
                <Text style={styles.quickActionText}>Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'orders' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Order History</Text>
            {orders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                      {order.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.orderDate}>{order.date}</Text>
                <View style={styles.orderFooter}>
                  <Text style={styles.orderTotal}>৳{order.total}</Text>
                  <Text style={styles.orderItems}>{order.items} items</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'addresses' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Saved Addresses</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => setShowAddressModal(true)}>
                <Plus size={20} color="#3B82F6" />
              </TouchableOpacity>
            </View>
            {addresses.map((address) => {
              const IconComponent = getAddressIcon(address.type);
              return (
                <View key={address.id} style={styles.addressCard}>
                  <View style={styles.addressHeader}>
                    <View style={styles.addressLeft}>
                      <IconComponent size={20} color="#3B82F6" />
                      <Text style={styles.addressType}>{address.type}</Text>
                      {address.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity>
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.addressName}>{address.name}</Text>
                  <Text style={styles.addressDetails}>{address.street}</Text>
                  <Text style={styles.addressDetails}>{address.city} - {address.postalCode}</Text>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'payments' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Payment Methods</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => setShowPaymentModal(true)}>
                <Plus size={20} color="#3B82F6" />
              </TouchableOpacity>
            </View>
            {paymentMethods.map((method) => (
              <View key={method.id} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentLeft}>
                    <CreditCard size={20} color="#3B82F6" />
                    <Text style={styles.paymentName}>{method.name}</Text>
                    {method.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity>
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.paymentDetails}>**** **** **** {method.lastFour}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'settings' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setShowChangePassword(true)}
            >
              <View style={styles.settingLeft}>
                <Shield size={20} color="#3B82F6" />
                <Text style={styles.settingText}>Change Password</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setShowNotifications(true)}
            >
              <View style={styles.settingLeft}>
                <Bell size={20} color="#10B981" />
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.notificationBadge}>3</Text>
                <ChevronRight size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setShowPrivacy(true)}
            >
              <View style={styles.settingLeft}>
                <Eye size={20} color="#F59E0B" />
                <Text style={styles.settingText}>Privacy</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Settings Modals */}
        <Modal
          visible={showChangePassword}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowChangePassword(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Current Password"
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowChangePassword(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleUpdatePassword}
                >
                  <Text style={styles.saveButtonText}>Update Password</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showNotifications}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowNotifications(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Notification Settings</Text>
              <View style={styles.notificationSetting}>
                <View>
                  <Text style={styles.notificationTitle}>Order Updates</Text>
                  <Text style={styles.notificationSubtitle}>Get updates about your orders</Text>
                </View>
                <Switch 
                  value={true}
                  trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View style={styles.notificationSetting}>
                <View>
                  <Text style={styles.notificationTitle}>Promotions</Text>
                  <Text style={styles.notificationSubtitle}>Get updates about special offers</Text>
                </View>
                <Switch 
                  value={true}
                  trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton, { marginTop: 20 }]}
                onPress={() => setShowNotifications(false)}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showPrivacy}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPrivacy(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Privacy Settings</Text>
              <ScrollView style={styles.privacyScroll}>
                <Text style={styles.privacyText}>
                  We respect your privacy and are committed to protecting your personal data. 
                  Your information is used in accordance with our Privacy Policy.
                </Text>
                
                <View style={styles.privacySection}>
                  <Text style={styles.privacySectionTitle}>Privacy Settings</Text>
                  
                  <View style={styles.privacySetting}>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingTitle}>Analytics</Text>
                      <Text style={styles.settingDescription}>Help us improve our app by sharing usage data</Text>
                    </View>
                    <Switch 
                      value={privacySettings.analytics}
                      onValueChange={(value) => setPrivacySettings(prev => ({...prev, analytics: value}))}
                      trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                  
                  <View style={styles.privacySetting}>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingTitle}>Personalized Ads</Text>
                      <Text style={styles.settingDescription}>Show personalized ads based on your interests</Text>
                    </View>
                    <Switch 
                      value={privacySettings.personalizedAds}
                      onValueChange={(value) => setPrivacySettings(prev => ({...prev, personalizedAds: value}))}
                      trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                  
                  <View style={styles.privacySetting}>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingTitle}>Location Sharing</Text>
                      <Text style={styles.settingDescription}>Allow access to your location for better services</Text>
                    </View>
                    <Switch 
                      value={privacySettings.locationSharing}
                      onValueChange={(value) => setPrivacySettings(prev => ({...prev, locationSharing: value}))}
                      trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
                
                <View style={styles.privacySection}>
                  <Text style={styles.privacySectionTitle}>Privacy Actions</Text>
                  
                  <TouchableOpacity 
                    style={styles.privacyAction}
                    onPress={() => router.push('/(tabs)/settings/privacy-policy')}
                  >
                    <FileText size={20} color="#3B82F6" />
                    <Text style={styles.privacyActionText}>View Privacy Policy</Text>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.privacyAction}
                    onPress={() => router.push('/(tabs)/settings/data-usage')}
                  >
                    <Database size={20} color="#10B981" />
                    <Text style={styles.privacyActionText}>Data Usage</Text>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.privacyAction, { borderBottomWidth: 0 }]}
                    onPress={() => {
                      Alert.alert(
                        "Delete Account",
                        "Are you sure you want to delete your account? This action cannot be undone.",
                        [
                          {
                            text: "Cancel",
                            style: "cancel"
                          },
                          { 
                            text: "Delete", 
                            style: "destructive",
                            onPress: () => {
                              // TODO: Implement account deletion logic
                              Alert.alert("Account Deletion", "Your account has been scheduled for deletion.");
                              setShowPrivacy(false);
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Trash2 size={20} color="#EF4444" />
                    <Text style={[styles.privacyActionText, { color: '#EF4444' }]}>Delete Account</Text>
                    <ChevronRight size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </ScrollView>
              
              <View style={styles.privacyFooter}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton, { flex: 1, marginRight: 8 }]}
                  onPress={() => setShowPrivacy(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton, { flex: 1 }]}
                  onPress={() => {
                    // TODO: Save privacy settings
                    Alert.alert("Success", "Your privacy settings have been updated!");
                    setShowPrivacy(false);
                  }}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { marginTop: 20 }]}
                onPress={() => setShowPrivacy(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
  },
  notLoggedIn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  notLoggedInSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
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
  editForm: {
    gap: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#F9FAFB',
    width: 250,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    gap: 4,
  },
  membershipText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#92400E',
  },
  editButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 4,
  },
  activeTab: {
    backgroundColor: '#EFF6FF',
  },
  tabText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  tabContent: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  loyaltyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  loyaltyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  loyaltyPoints: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: '#F59E0B',
    marginBottom: 4,
  },
  loyaltySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    minHeight: 100,
  },
  quickActionText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
  },
  wishlistBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  wishlistCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 20,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  orderDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#3B82F6',
  },
  orderItems: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressType: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  defaultBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
  },
  addressName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  paymentDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBadge: {
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    lineHeight: 20,
    marginRight: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#4B5563',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  notificationSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  privacyScroll: {
    flex: 1,
    marginBottom: 16,
  },
  privacyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 24,
  },
  privacySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  privacySectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  privacySetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  privacyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  privacyActionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginLeft: 12,
  },
  privacyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
});