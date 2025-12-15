import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, TextInput, Modal, Switch, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { API_URL, resolveUrl } from '../../config/api';
import RealTimeActivity from '@/components/RealTimeActivity';
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
  Database,
  Activity
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { validateBangladeshPhone, formatBangladeshPhone, bangladeshDistricts, thanasByDistrict } from '@/data/bangladeshData';
import { userService } from '@/lib/supabase-services';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  gender?: string;
  dateOfBirth?: string;
  fullAddress?: string;
  membershipStatus: string;
  loyaltyPoints: number;
}

interface Address {
  _id: string;
  userId: string;
  type: 'Home' | 'Office' | 'Shipping';
  name: string;
  phone: string;
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
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
  const { user, logout, updateUser } = useAuth();
  const { items: wishlistItems, removeFromWishlist } = useWishlist();
  const router = useRouter();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [privacySettings, setPrivacySettings] = useState({
    analytics: true,
    personalizedAds: false,
    locationSharing: false
  });
  const [notificationSettings, setNotificationSettings] = useState({
    orderUpdates: true,
    supportUpdates: true,
    profileUpdates: true,
    promotions: true,
    appUpdates: true
  });
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses' | 'payments' | 'settings'>('overview');
  
  // Address form state
  const [addressForm, setAddressForm] = useState({
    type: 'Home',
    name: '',
    phone: '',
    houseRoad: '',
    area: '',
    district: '',
    thana: '',
    postalCode: '',
  });
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [availableThanas, setAvailableThanas] = useState<string[]>([]);
  
  // Date of birth separate fields
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: user?.name || 'John Doe',
    email: user?.email || 'john@example.com',
    phone: '+880 1234 567890',
    avatar: user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    membershipStatus: 'Gold Member',
    loyaltyPoints: 2450
  });
  const [tierInfo, setTierInfo] = useState<any>({
    membershipTier: 'Bronze',
    loyaltyPoints: 0,
    tierColor: '#CD7F32',
    progress: {
      nextTier: 'Silver',
      pointsToNextTier: 1000,
      progressPercentage: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    fetchTierInfo();
    fetchOrders();
    fetchUnreadNotificationCount();
    if (user?._id) {
      fetchAddresses();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      if (user?._id) {
        // Fetch fresh profile data from Supabase
        const { data, error } = await userService.getProfile(user._id);
        
        if (error) {
          console.error('Error fetching user profile from Supabase:', error);
          // Fallback to AuthContext data
          setUserProfile({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            avatar: user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            gender: undefined,
            dateOfBirth: undefined,
            fullAddress: undefined,
            membershipStatus: 'Bronze',
            loyaltyPoints: 0
          });
        } else if (data) {
          // Use Supabase data
          const profileData = {
            name: data.name || user.name,
            email: data.email || user.email,
            phone: data.phone || '',
            avatar: data.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            gender: data.gender || undefined,
            dateOfBirth: data.date_of_birth || undefined,
            fullAddress: data.full_address || undefined,
            membershipStatus: data.membership_tier || 'Bronze',
            loyaltyPoints: data.loyalty_points || 0
          };
          
          setUserProfile(profileData);
          
          // Load notification settings if available
          if (data.notification_settings) {
            setNotificationSettings(data.notification_settings);
            console.log('✅ Notification settings loaded');
          }

          // Load privacy settings if available
          if (data.privacy_settings) {
            setPrivacySettings(data.privacy_settings);
            console.log('✅ Privacy settings loaded');
          }
          
          console.log('✅ Profile loaded from Supabase');
          console.log('📷 Avatar from database:', data.avatar);
          console.log('📷 Avatar set in state:', profileData.avatar);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchOrders = async () => {
    try {
      if (!user?._id) {
        setOrders([]);
        return;
      }

      const { data, error } = await userService.getProfile(user._id);
      
      if (error) {
        console.error('❌ Error fetching orders:', error);
        setOrders([]);
        return;
      }

      // Fetch orders from Supabase
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user._id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (ordersData) {
        const transformedOrders = ordersData.map((order: any) => ({
          id: order.order_number || `ORD-${order.id.toString().slice(-6)}`,
          date: order.created_at || new Date().toISOString(),
          status: (order.status || 'Pending') as 'Delivered' | 'Pending' | 'Cancelled' | 'Processing',
          total: order.total_price || 0,
          items: order.items?.length || 0,
        }));
        setOrders(transformedOrders);
      }
    } catch (error) {
      console.error('❌ Error fetching profile orders:', error);
      setOrders([]);
    }
  };

  const fetchAddresses = async () => {
    try {
      if (!user?._id) {
        setAddresses([]);
        return;
      }

      const { data: addressesData, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user._id)
        .order('is_default', { ascending: false });

      if (error) {
        console.error('❌ Error fetching addresses:', error);
        setAddresses([]);
        return;
      }

      if (addressesData) {
        const transformedAddresses = addressesData.map((addr: any) => ({
          _id: addr.id,
          userId: addr.user_id,
          type: addr.type as 'Home' | 'Office' | 'Shipping',
          name: addr.name,
          phone: addr.phone,
          street: addr.street,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postal_code,
          country: addr.country,
          isDefault: addr.is_default,
        }));
        setAddresses(transformedAddresses);
      }
    } catch (error) {
      console.error('❌ Error fetching addresses:', error);
      setAddresses([]);
    }
  };

  const fetchTierInfo = async () => {
    try {
      if (!user?._id) {
        setTierInfo({
          membershipTier: 'Bronze',
          loyaltyPoints: 0,
          tierColor: '#CD7F32',
          progress: {
            nextTier: 'Silver',
            pointsToNextTier: 1000,
            progressPercentage: 0
          }
        });
        return;
      }

      const { data, error } = await userService.getProfile(user._id);
      
      if (error || !data) {
        console.error('❌ Error fetching tier info:', error);
        setTierInfo({
          membershipTier: 'Bronze',
          loyaltyPoints: 0,
          tierColor: '#CD7F32',
          progress: {
            nextTier: 'Silver',
            pointsToNextTier: 1000,
            progressPercentage: 0
          }
        });
        return;
      }

      const membershipTier = data.membership_status || 'Bronze';
      const loyaltyPoints = data.loyalty_points || 0;

      // Calculate tier progress
      let tierColor = '#CD7F32'; // Bronze
      let nextTier = 'Silver';
      let pointsToNextTier = 1000;
      let progressPercentage = (loyaltyPoints / 1000) * 100;

      if (membershipTier === 'Silver') {
        tierColor = '#C0C0C0';
        nextTier = 'Gold';
        pointsToNextTier = 5000 - loyaltyPoints;
        progressPercentage = ((loyaltyPoints - 1000) / 4000) * 100;
      } else if (membershipTier === 'Gold') {
        tierColor = '#FFD700';
        nextTier = 'Platinum';
        pointsToNextTier = 10000 - loyaltyPoints;
        progressPercentage = ((loyaltyPoints - 5000) / 5000) * 100;
      } else if (membershipTier === 'Platinum') {
        tierColor = '#E5E4E2';
        nextTier = 'Platinum (Max)';
        pointsToNextTier = 0;
        progressPercentage = 100;
      }

      setTierInfo({
        membershipTier,
        loyaltyPoints,
        tierColor,
        progress: {
          nextTier,
          pointsToNextTier: Math.max(0, pointsToNextTier),
          progressPercentage: Math.min(100, Math.max(0, progressPercentage))
        }
      });
    } catch (error) {
      console.error('❌ Error fetching tier info:', error);
      setTierInfo({
        membershipTier: 'Bronze',
        loyaltyPoints: 0,
        tierColor: '#CD7F32',
        progress: {
          nextTier: 'Silver',
          pointsToNextTier: 1000,
          progressPercentage: 0
        }
      });
    }
  };

  const fetchUnreadNotificationCount = async () => {
    try {
      if (!user?._id) {
        setUnreadNotificationCount(0);
        return;
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${user._id},type.eq.broadcast`)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching unread notification count:', error);
        setUnreadNotificationCount(0);
        return;
      }

      setUnreadNotificationCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      setUnreadNotificationCount(0);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserProfile();
    fetchOrders();
    fetchUnreadNotificationCount();
    if (user?._id) {
      fetchAddresses();
    }
  };
  
  const [editForm, setEditForm] = useState(userProfile);
  const [addresses, setAddresses] = useState<Address[]>([]);
  
  const [orders, setOrders] = useState<Order[]>([]);
  
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
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "⚠️ Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.\n\n⚠️ All your data will be permanently deleted:\n• Personal information\n• Order history\n• Addresses\n• Wishlist\n• Notifications",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete Account", 
          style: "destructive",
          onPress: async () => {
            try {
              if (!user?._id) {
                Alert.alert('Error', 'Please login again');
                return;
              }

              // Delete user from Supabase
              const { error } = await userService.updateProfile(user._id, {
                is_active: false,
                deleted_at: new Date().toISOString()
              });

              if (error) {
                throw new Error('Failed to delete account');
              }

              Alert.alert(
                '✅ Account Deleted',
                'Your account has been successfully deleted.',
                [
                  {
                    text: 'OK',
                    onPress: async () => {
                      await logout();
                      router.replace('/(auth)/login');
                    }
                  }
                ]
              );
            } catch (error: any) {
              console.error('Error deleting account:', error);
              Alert.alert('❌ Error', error.message || 'Failed to delete account. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleUpdatePassword = async () => {
    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('❌ Missing Fields', 'Please fill in all password fields');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      Alert.alert('❌ Weak Password', 'New password must be at least 6 characters long');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('❌ Password Mismatch', 'New password and confirm password do not match');
      return;
    }
    
    try {
      if (!user?._id) {
        throw new Error('User not found');
      }

      // First, verify current password
      const { data: userData, error: fetchError } = await userService.getProfile(user._id);
      
      if (fetchError || !userData) {
        throw new Error('Failed to fetch user data');
      }

      // Check if current password matches
      if (userData.password !== passwordForm.currentPassword) {
        Alert.alert('❌ Incorrect Password', 'Current password is incorrect');
        return;
      }

      // Update password in Supabase
      const { data, error } = await userService.updateProfile(user._id, {
        password: passwordForm.newPassword
      });

      if (error) {
        throw new Error('Failed to update password');
      }

      Alert.alert('✅ Success', 'Your password has been updated successfully!');
      setShowChangePassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      console.log('✅ Password updated successfully');
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'Failed to update password. Please check your current password.');
      console.error('Password update error:', error);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await fetch(resolveUrl(`/addresses/${addressId}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (response.ok) {
                Alert.alert('Success', 'Address deleted successfully');
                fetchAddresses();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete address');
              console.error('Delete address error:', error);
            }
          }
        }
      ]
    );
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(resolveUrl(`/addresses/${addressId}/set-default`), {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Default address updated');
        fetchAddresses();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to set default address');
      console.error('Set default address error:', error);
    }
  };

  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Gallery access permission is required to change profile photo!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedUri = result.assets[0].uri;
        console.log('🖼️ Image selected from gallery');
        console.log('📁 Selected URI:', selectedUri);
        
        // Check if it's a local file URI
        const isLocalFile = selectedUri.startsWith('file://') || 
                          selectedUri.startsWith('content://') || 
                          selectedUri.includes('/data/') ||
                          !selectedUri.startsWith('http');
        
        console.log('🔍 Is local file?', isLocalFile);
        
        if (isLocalFile && user?._id) {
          // Try to upload to Supabase Storage
          console.log('📤 Attempting Supabase Storage upload...');
          
          const fileExtension = selectedUri.split('.').pop()?.toLowerCase() || 'jpg';
          const { url, error: uploadError } = await userService.uploadAvatar(
            user._id,
            selectedUri,
            fileExtension
          );
          
          if (uploadError || !url) {
            console.warn('⚠️ Supabase Storage upload failed, converting to base64...');
            
            // Fallback: Convert to base64 data URI
            try {
              const response = await fetch(selectedUri);
              const blob = await response.blob();
              
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              
              console.log('✅ Photo converted to base64');
              setEditForm(prev => ({ ...prev, avatar: base64 }));
              Alert.alert('✅ Photo Selected', 'Photo ready! Click Save to update your profile.\n\nNote: Using local storage since Supabase Storage RLS is not configured.');
            } catch (base64Error) {
              console.error('❌ Base64 conversion failed:', base64Error);
              Alert.alert('❌ Error', 'Could not process photo. Please try again.');
            }
            return;
          }
          
          console.log('✅ Photo uploaded to Supabase!');
          console.log('📷 URL:', url);
          
          setEditForm(prev => ({ ...prev, avatar: url }));
          Alert.alert('✅ Success', 'Photo uploaded! Click Save to update your profile.');
        } else {
          // If already a URL, just set it
          console.log('📷 Using existing URL');
          setEditForm(prev => ({ ...prev, avatar: selectedUri }));
        }
      }
    } catch (error) {
      console.error('❌ Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleSaveProfile = async () => {
    // Validate name
    if (!editForm.name || editForm.name.trim().length < 2) {
      Alert.alert('Invalid Name', 'Name must be at least 2 characters long.');
      return;
    }

    // Validate phone number with BD format
    if (editForm.phone && !validateBangladeshPhone(editForm.phone)) {
      Alert.alert(
        '❌ Invalid Phone Number',
        '📱 Please enter a valid Bangladeshi phone number.\n\n✅ Valid formats:\n• 01712345678 (11 digits)\n• +880 1712345678\n\n⚠️ Must start with: 013, 014, 015, 016, 017, 018, or 019'
      );
      return;
    }

    try {
      setLoading(true);
      
      // Avatar is already uploaded in handleImagePicker, just use it
      const finalAvatarUrl = editForm.avatar || userProfile.avatar;
      
      console.log('💾 Saving profile with avatar:', finalAvatarUrl);

      // Update profile in Supabase database
      if (user?._id) {
        const updateData: any = {
          name: editForm.name,
          phone: editForm.phone,
          gender: editForm.gender as 'male' | 'female' | 'other' | null,
          date_of_birth: editForm.dateOfBirth,
          full_address: editForm.fullAddress,
          avatar: finalAvatarUrl, // Always update avatar
        };

        const { data, error } = await userService.updateProfile(user._id, updateData);

        if (error) {
          console.error('❌ Database update error:', error);
        } else {
          console.log('✅ Profile saved to database');
          console.log('📷 Avatar in database:', data?.avatar);
        }
      }

      // Update local state immediately
      const updatedProfile = { 
        ...editForm, 
        avatar: finalAvatarUrl 
      };
      
      setUserProfile(updatedProfile);
      setEditForm(updatedProfile);
      setIsEditingProfile(false);
      
      // Update AuthContext user state and AsyncStorage IMMEDIATELY
      await updateUser({
        ...user,
        name: editForm.name,
        phone: editForm.phone,
        avatar: finalAvatarUrl,
      });
      
      console.log('✅ AuthContext updated with avatar:', finalAvatarUrl);
      
      Alert.alert('✅ Success', 'Profile and photo updated successfully!');
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'Failed to update profile. Please try again.');
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
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

  const handleUseCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          '📍 Location Permission Required',
          'Please allow location access to use GPS auto-detect feature.',
          [{ text: 'OK' }]
        );
        setLoadingLocation(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      // Reverse geocoding to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        
        // Map to Bangladesh address format
        const detectedAddress = {
          houseRoad: address.street || address.name || '',
          area: address.subregion || address.district || '',
          thana: address.subregion || '',
          district: address.city || address.region || '',
          postalCode: address.postalCode || '',
        };

        // Update form with detected address
        setAddressForm(prev => ({
          ...prev,
          houseRoad: detectedAddress.houseRoad,
          area: detectedAddress.area,
          thana: detectedAddress.thana,
          district: detectedAddress.district,
          postalCode: detectedAddress.postalCode,
        }));

        // Set district and load thanas
        if (detectedAddress.district) {
          setSelectedDistrict(detectedAddress.district);
          setAvailableThanas(thanasByDistrict[detectedAddress.district] || []);
        }

        Alert.alert(
          '✅ Location Detected',
          `📍 Latitude: ${latitude.toFixed(6)}\n📍 Longitude: ${longitude.toFixed(6)}\n\n⚠️ Please verify and edit the address if needed.`,
          [{ text: 'OK' }]
        );
      }
      
      setLoadingLocation(false);
    } catch (error: any) {
      setLoadingLocation(false);
      console.error('Location error:', error);
      Alert.alert(
        '❌ Location Error',
        'Failed to get your location. Please enter address manually or try again.',
        [{ text: 'OK' }]
      );
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Edit Profile Modal */}
      <Modal
        visible={isEditingProfile}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsEditingProfile(false)}
      >
        <SafeAreaView style={styles.editModalContainer}>
          <View style={styles.editModalHeader}>
            <TouchableOpacity 
              style={styles.editModalCloseButton}
              onPress={() => setIsEditingProfile(false)}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.editModalTitle}>Edit Profile</Text>
            <TouchableOpacity 
              style={styles.editModalSaveButton}
              onPress={handleSaveProfile}
            >
              <Check size={24} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.editModalContent} showsVerticalScrollIndicator={false}>
            <TouchableOpacity onPress={handleImagePicker} style={styles.editAvatarContainer}>
              <Image source={{ uri: editForm.avatar }} style={styles.editAvatar} />
              <View style={styles.editAvatarOverlay}>
                <Edit3 size={20} color="#FFFFFF" />
                <Text style={styles.editAvatarText}>Change Photo</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.editFormContainer}>
              <Text style={styles.editInputLabel}>Full Name *</Text>
              <TextInput
                style={styles.editInputField}
                value={editForm.name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.editInputLabel}>Phone Number</Text>
              <TextInput
                style={styles.editInputField}
                value={editForm.phone}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
                placeholder="01XXXXXXXXX"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={11}
              />

              <Text style={styles.editInputLabel}>Gender</Text>
              <View style={styles.genderButtonGroup}>
                {['male', 'female', 'other'].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderButton,
                      editForm.gender === gender && styles.genderButtonActive
                    ]}
                    onPress={() => setEditForm(prev => ({ ...prev, gender }))}
                  >
                    <Text style={[
                      styles.genderButtonText,
                      editForm.gender === gender && styles.genderButtonTextActive
                    ]}>
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.editInputLabel}>Date of Birth</Text>
              <View style={styles.dobInputContainer}>
                <View style={styles.dobInputGroup}>
                  <Text style={styles.dobLabel}>Day</Text>
                  <TextInput
                    style={styles.dobInput}
                    value={birthDay}
                    onChangeText={(text) => {
                      if (text.length <= 2 && /^\d*$/.test(text)) {
                        setBirthDay(text);
                        if (text.length === 2 && parseInt(text) >= 1 && parseInt(text) <= 31) {
                          const fullDate = `${birthYear}-${birthMonth.padStart(2, '0')}-${text.padStart(2, '0')}`;
                          setEditForm(prev => ({ ...prev, dateOfBirth: fullDate }));
                        }
                      }
                    }}
                    placeholder="DD"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
                <View style={styles.dobInputGroup}>
                  <Text style={styles.dobLabel}>Month</Text>
                  <TextInput
                    style={styles.dobInput}
                    value={birthMonth}
                    onChangeText={(text) => {
                      if (text.length <= 2 && /^\d*$/.test(text)) {
                        setBirthMonth(text);
                        if (text.length === 2 && parseInt(text) >= 1 && parseInt(text) <= 12) {
                          const fullDate = `${birthYear}-${text.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
                          setEditForm(prev => ({ ...prev, dateOfBirth: fullDate }));
                        }
                      }
                    }}
                    placeholder="MM"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
                <View style={styles.dobInputGroup}>
                  <Text style={styles.dobLabel}>Year</Text>
                  <TextInput
                    style={styles.dobInput}
                    value={birthYear}
                    onChangeText={(text) => {
                      if (text.length <= 4 && /^\d*$/.test(text)) {
                        setBirthYear(text);
                        if (text.length === 4 && parseInt(text) >= 1900 && parseInt(text) <= 2024) {
                          const fullDate = `${text}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
                          setEditForm(prev => ({ ...prev, dateOfBirth: fullDate }));
                        }
                      }
                    }}
                    placeholder="YYYY"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>
              </View>

              <Text style={styles.editInputLabel}>Full Address</Text>
              <TextInput
                style={[styles.editInputField, styles.textAreaInput]}
                value={editForm.fullAddress || ''}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, fullAddress: text }))}
                placeholder="Enter your complete address"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
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
          
          {false ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.editInput}
                value={editForm.name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                placeholder="Full Name"
              />
              <TextInput
                style={styles.editInput}
                value={editForm.phone}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
                placeholder="Phone (01XXXXXXXXX)"
                keyboardType="phone-pad"
                maxLength={11}
              />
              
              {/* Gender Selection with Radio Buttons */}
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setEditForm(prev => ({ ...prev, gender: 'male' }))}
                >
                  <View style={styles.radioCircle}>
                    {editForm.gender === 'male' && <View style={styles.radioCircleSelected} />}
                  </View>
                  <Text style={styles.radioLabel}>Male</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setEditForm(prev => ({ ...prev, gender: 'female' }))}
                >
                  <View style={styles.radioCircle}>
                    {editForm.gender === 'female' && <View style={styles.radioCircleSelected} />}
                  </View>
                  <Text style={styles.radioLabel}>Female</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setEditForm(prev => ({ ...prev, gender: 'other' }))}
                >
                  <View style={styles.radioCircle}>
                    {editForm.gender === 'other' && <View style={styles.radioCircleSelected} />}
                  </View>
                  <Text style={styles.radioLabel}>Others</Text>
                </TouchableOpacity>
              </View>

              {/* Date of Birth - Separate Fields */}
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <View style={styles.dateInputContainer}>
                <View style={styles.dateInputWrapper}>
                  <Text style={styles.dateLabel}>Day</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={birthDay}
                    onChangeText={(text) => {
                      if (text.length <= 2 && /^\d*$/.test(text)) {
                        setBirthDay(text);
                        if (text.length === 2 && parseInt(text) >= 1 && parseInt(text) <= 31) {
                          const fullDate = `${birthYear}-${birthMonth.padStart(2, '0')}-${text.padStart(2, '0')}`;
                          setEditForm(prev => ({ ...prev, dateOfBirth: fullDate }));
                        }
                      }
                    }}
                    placeholder="DD"
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
                <View style={styles.dateInputWrapper}>
                  <Text style={styles.dateLabel}>Month</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={birthMonth}
                    onChangeText={(text) => {
                      if (text.length <= 2 && /^\d*$/.test(text)) {
                        setBirthMonth(text);
                        if (text.length === 2 && parseInt(text) >= 1 && parseInt(text) <= 12) {
                          const fullDate = `${birthYear}-${text.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
                          setEditForm(prev => ({ ...prev, dateOfBirth: fullDate }));
                        }
                      }
                    }}
                    placeholder="MM"
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
                <View style={styles.dateInputWrapper}>
                  <Text style={styles.dateLabel}>Year</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={birthYear}
                    onChangeText={(text) => {
                      if (text.length <= 4 && /^\d*$/.test(text)) {
                        setBirthYear(text);
                        if (text.length === 4 && parseInt(text) >= 1900 && parseInt(text) <= 2024) {
                          const fullDate = `${text}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
                          setEditForm(prev => ({ ...prev, dateOfBirth: fullDate }));
                        }
                      }
                    }}
                    placeholder="YYYY"
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>
              </View>

              <TextInput
                style={styles.editInput}
                value={editForm.fullAddress || ''}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, fullAddress: text }))}
                placeholder="Full Address"
                multiline
                numberOfLines={3}
              />
            </View>
          ) : (
            <>
              <Text style={styles.userName}>{userProfile.name}</Text>
              <Text style={styles.userEmail}>{userProfile.email}</Text>
              <View style={styles.membershipBadge}>
                <Star size={16} color="#F59E0B" />
                <Text style={styles.membershipText}>{tierInfo?.membershipTier || 'Bronze'} Member</Text>
              </View>
              {userProfile.fullAddress && (
                <View style={styles.addressInfo}>
                  <MapPin size={14} color="#6B7280" />
                  <Text style={styles.addressText}>{userProfile.fullAddress}</Text>
                </View>
              )}
            </>
          )}
          
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setIsEditingProfile(true);
              setEditForm(userProfile);
              
              // Parse existing date of birth
              if (userProfile.dateOfBirth) {
                const dateParts = userProfile.dateOfBirth.split('-');
                if (dateParts.length === 3) {
                  setBirthYear(dateParts[0]);
                  setBirthMonth(dateParts[1]);
                  setBirthDay(dateParts[2]);
                }
              }
            }}
          >
            <Edit3 size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNavigationWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            {[
              { key: 'overview', label: 'Overview', icon: Eye },
              { key: 'orders', label: 'Orders', icon: Package },
              { key: 'activity', label: 'Activity', icon: Activity },
              { key: 'addresses', label: 'Addresses', icon: MapPin },
              { key: 'payments', label: 'Payments', icon: CreditCard },
              { key: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <tab.icon size={18} color={activeTab === tab.key ? '#3B82F6' : '#6B7280'} />
                <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            {/* Membership Tier Section */}
            {tierInfo && (
              <View style={styles.tierSection}>
                <View style={styles.tierHeader}>
                  <Text style={styles.tierSectionTitle}>Membership Tier</Text>
                  <View style={styles.tierBadgeContainer}>
                    <Text style={styles.tierBadgeText}>{tierInfo.tierIcon} {tierInfo.membershipTier}</Text>
                  </View>
                </View>
                
                {/* Tier Progress */}
                <View style={styles.tierProgressCard}>
                  <View style={styles.tierProgressHeader}>
                    <View>
                      <Text style={styles.tierPointsLabel}>Your Points</Text>
                      <Text style={styles.tierPointsValue}>{tierInfo.loyaltyPoints.toLocaleString()} 💎</Text>
                    </View>
                    {tierInfo.progress.nextTier && (
                      <View style={styles.tierNextContainer}>
                        <Text style={styles.tierNextLabel}>Next Tier</Text>
                        <Text style={styles.tierNextValue}>{tierInfo.progress.nextTier}</Text>
                      </View>
                    )}
                  </View>
                  
                  {tierInfo.progress.nextTier ? (
                    <>
                      <View style={styles.progressBarContainer}>
                        <View style={styles.progressBarBg}>
                          <View 
                            style={[
                              styles.progressBarFill, 
                              { 
                                width: `${Math.min(100, tierInfo.progress.progressPercentage)}%`,
                                backgroundColor: tierInfo.tierColor
                              }
                            ]} 
                          />
                        </View>
                      </View>
                      <View style={styles.tierProgressFooter}>
                        <Text style={styles.tierRemainingText}>
                          {tierInfo.progress.pointsToNextTier.toLocaleString()} points to {tierInfo.progress.nextTier}
                        </Text>
                        <Text style={[styles.tierPercentageText, { color: tierInfo.tierColor }]}>
                          {tierInfo.progress.progressPercentage.toFixed(1)}%
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.maxTierBanner}>
                      <Text style={styles.maxTierText}>🏆 Maximum Tier Achieved!</Text>
                      <Text style={styles.maxTierSubtext}>Enjoy all exclusive Diamond benefits</Text>
                    </View>
                  )}
                </View>
                
                {/* Tier Benefits */}
                <View style={styles.tierBenefitsCard}>
                  <Text style={styles.tierBenefitsTitle}>Your Benefits</Text>
                  {tierInfo.benefits && tierInfo.benefits.slice(0, 4).map((benefit: string, index: number) => (
                    <View key={index} style={styles.benefitRow}>
                      <Text style={styles.benefitCheck}>✓</Text>
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                  {tierInfo.benefits && tierInfo.benefits.length > 4 && (
                    <Text style={styles.moreBenefits}>+{tierInfo.benefits.length - 4} more benefits</Text>
                  )}
                </View>
              </View>
            )}

            {/* Loyalty Points */}
            <View style={styles.loyaltyCard}>
              <View style={styles.loyaltyHeader}>
                <Gift size={24} color="#F59E0B" />
                <Text style={styles.loyaltyTitle}>Loyalty Points</Text>
              </View>
              <Text style={styles.loyaltyPoints}>{tierInfo?.loyaltyPoints?.toLocaleString() || userProfile.loyaltyPoints}</Text>
              <Text style={styles.loyaltySubtitle}>Earn 1 point for every ৳10 spent</Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => router.push('/(tabs)/wishlist')}
              >
                {wishlistItems.length > 0 && (
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>{wishlistItems.length}</Text>
                  </View>
                )}
                <Heart size={24} color="#EF4444" fill="#EF4444" />
                <Text style={styles.quickActionText}>Wishlist</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => router.push('/orders' as any)}
              >
                {orders.length > 0 && (
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>{orders.length}</Text>
                  </View>
                )}
                <Package size={24} color="#3B82F6" />
                <Text style={styles.quickActionText}>Track Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => router.push('/support' as any)}
              >
                <HelpCircle size={24} color="#10B981" />
                <Text style={styles.quickActionText}>Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'orders' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Order History</Text>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push('/orders' as any)}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <ChevronRight size={16} color="#3B82F6" />
              </TouchableOpacity>
            </View>
            {orders.length === 0 ? (
              <View style={styles.emptyOrders}>
                <Package size={48} color="#9CA3AF" />
                <Text style={styles.emptyOrdersText}>No orders yet</Text>
                <Text style={styles.emptyOrdersSubtext}>Start shopping to see your orders here</Text>
              </View>
            ) : (
              orders.map((order) => (
                <TouchableOpacity 
                  key={order.id} 
                  style={styles.orderCard}
                  onPress={() => router.push('/orders' as any)}
                >
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
                    <Text style={styles.orderTotal}>৳{order.total.toFixed(2)}</Text>
                    <Text style={styles.orderItems}>{order.items} items</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
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
            {addresses.length === 0 ? (
              <View style={styles.emptyState}>
                <MapPin size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>No addresses yet</Text>
                <Text style={styles.emptyStateSubtext}>Add your delivery addresses</Text>
              </View>
            ) : (
              addresses.map((address) => {
                const IconComponent = getAddressIcon(address.type);
                return (
                  <TouchableOpacity 
                    key={address._id} 
                    style={styles.addressCard}
                    onLongPress={() => handleSetDefaultAddress(address._id)}
                  >
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
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity onPress={() => {
                          // Parse street back to form fields
                          const streetParts = address.street.split(', ');
                          const houseRoad = streetParts[0] || '';
                          const area = streetParts[1] || '';
                          const thana = streetParts[2] || '';
                          
                          setEditingAddressId(address._id);
                          setAddressForm({
                            type: address.type,
                            name: address.name,
                            phone: address.phone,
                            houseRoad: houseRoad,
                            area: area,
                            district: address.city,
                            thana: thana,
                            postalCode: address.postalCode,
                          });
                          setSelectedDistrict(address.city);
                          setAvailableThanas(thanasByDistrict[address.city] || []);
                          setShowAddressModal(true);
                        }}>
                          <Edit3 size={16} color="#3B82F6" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteAddress(address._id)}>
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.addressName}>{address.name}</Text>
                    <Text style={styles.addressDetails}>{address.phone}</Text>
                    <Text style={styles.addressDetails}>{address.street}</Text>
                    <Text style={styles.addressDetails}>{address.city} - {address.postalCode}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'activity' && (
          <View style={styles.tabContent}>
            <RealTimeActivity 
              userId={user?.id}
              userRole="user"
              limit={20}
              showAll={false}
            />
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
              onPress={() => router.push('/notifications' as any)}
            >
              <View style={styles.settingLeft}>
                <Bell size={20} color="#10B981" />
                <Text style={styles.settingText}>View Notifications</Text>
              </View>
              <View style={styles.settingRight}>
                {unreadNotificationCount > 0 && (
                  <View style={styles.unreadCountBadge}>
                    <Text style={styles.unreadCountText}>{unreadNotificationCount}</Text>
                  </View>
                )}
                <ChevronRight size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setShowNotifications(true)}
            >
              <View style={styles.settingLeft}>
                <Settings size={20} color="#6B7280" />
                <Text style={styles.settingText}>Notification Settings</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
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

            {/* Logout Button */}
            <TouchableOpacity 
              style={styles.logoutSettingItem}
              onPress={handleLogout}
            >
              <View style={styles.settingLeft}>
                <LogOut size={20} color="#EF4444" />
                <Text style={[styles.settingText, { color: '#EF4444' }]}>Logout</Text>
              </View>
              <ChevronRight size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* Add Address Modal */}
        <Modal
          visible={showAddressModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddressModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingAddressId ? '✏️ Edit Address' : '📍 Add New Address'}</Text>
                <TouchableOpacity onPress={() => {
                  setShowAddressModal(false);
                  setEditingAddressId(null);
                  setAddressForm({
                    type: 'Home',
                    name: '',
                    phone: '',
                    houseRoad: '',
                    area: '',
                    district: '',
                    thana: '',
                    postalCode: '',
                  });
                  setSelectedDistrict('');
                  setAvailableThanas([]);
                }}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
                {/* GPS Location Button */}
                {!editingAddressId && (
                  <TouchableOpacity
                    style={styles.gpsButton}
                    onPress={handleUseCurrentLocation}
                    disabled={loadingLocation}
                  >
                    {loadingLocation ? (
                      <>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.gpsButtonText}>Detecting Location...</Text>
                      </>
                    ) : (
                      <>
                        <MapPin size={20} color="#FFFFFF" />
                        <Text style={styles.gpsButtonText}>📍 Use Current Location (GPS)</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Address Type Selection */}
                <Text style={styles.inputLabel}>Address Type</Text>
                <View style={styles.addressTypeButtons}>
                  {['Home', 'Office', 'Shipping'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.addressTypeButton,
                        addressForm.type === type && styles.addressTypeButtonActive
                      ]}
                      onPress={() => setAddressForm(prev => ({ ...prev, type }))}
                    >
                      <Text style={[
                        styles.addressTypeText,
                        addressForm.type === type && styles.addressTypeTextActive
                      ]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Recipient Name */}
                <Text style={styles.inputLabel}>Recipient Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.name}
                  onChangeText={(text) => setAddressForm(prev => ({ ...prev, name: text }))}
                />

                {/* Phone Number */}
                <Text style={styles.inputLabel}>Phone Number * (01XXXXXXXXX)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="01712345678"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={11}
                  value={addressForm.phone}
                  onChangeText={(text) => setAddressForm(prev => ({ ...prev, phone: text }))}
                />

                {/* House/Road/Village */}
                <Text style={styles.inputLabel}>House / Road / Village *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="House 10, Road 5"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.houseRoad}
                  onChangeText={(text) => setAddressForm(prev => ({ ...prev, houseRoad: text }))}
                />

                {/* Area/Thana */}
                <Text style={styles.inputLabel}>Area / Union / Thana *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Dhanmondi"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.area}
                  onChangeText={(text) => setAddressForm(prev => ({ ...prev, area: text }))}
                />

                {/* District Dropdown */}
                <Text style={styles.inputLabel}>District *</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.districtScroll}
                  >
                    {bangladeshDistricts.map((district) => (
                      <TouchableOpacity
                        key={district.id}
                        style={[
                          styles.districtButton,
                          selectedDistrict === district.name && styles.districtButtonActive
                        ]}
                        onPress={() => {
                          setSelectedDistrict(district.name);
                          setAddressForm(prev => ({ ...prev, district: district.name }));
                          setAvailableThanas(thanasByDistrict[district.name] || []);
                        }}
                      >
                        <Text style={[
                          styles.districtButtonText,
                          selectedDistrict === district.name && styles.districtButtonTextActive
                        ]}>{district.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Thana Selection (if district selected) */}
                {selectedDistrict && availableThanas.length > 0 && (
                  <>
                    <Text style={styles.inputLabel}>Thana / Upazila</Text>
                    <View style={styles.thanaContainer}>
                      {availableThanas.slice(0, 6).map((thana, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.thanaChip,
                            addressForm.thana === thana && styles.thanaChipActive
                          ]}
                          onPress={() => setAddressForm(prev => ({ ...prev, thana }))}
                        >
                          <Text style={[
                            styles.thanaChipText,
                            addressForm.thana === thana && styles.thanaChipTextActive
                          ]}>{thana}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {/* Postal Code */}
                <Text style={styles.inputLabel}>Postal Code *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1205"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={addressForm.postalCode}
                  onChangeText={(text) => setAddressForm(prev => ({ ...prev, postalCode: text }))}
                />
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowAddressModal(false);
                    setAddressForm({
                      type: 'Home',
                      name: '',
                      phone: '',
                      houseRoad: '',
                      area: '',
                      district: '',
                      thana: '',
                      postalCode: '',
                    });
                    setSelectedDistrict('');
                    setAvailableThanas([]);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={async () => {
                    // Validation
                    if (!addressForm.name || !addressForm.phone || !addressForm.houseRoad || 
                        !addressForm.area || !addressForm.district || !addressForm.postalCode) {
                      Alert.alert('❌ Missing Fields', 'Please fill all required fields (*)');
                      return;
                    }

                    if (!validateBangladeshPhone(addressForm.phone)) {
                      Alert.alert('❌ Invalid Phone', 'Please enter a valid BD phone number (01XXXXXXXXX)');
                      return;
                    }

                    try {
                      const token = await AsyncStorage.getItem('token');
                      const street = `${addressForm.houseRoad}, ${addressForm.area}${addressForm.thana ? ', ' + addressForm.thana : ''}`;
                      
                      const url = editingAddressId 
                        ? resolveUrl(`/addresses/${editingAddressId}`)
                        : resolveUrl(`/addresses`);
                      
                      const method = editingAddressId ? 'PUT' : 'POST';
                      
                      const response = await fetch(url, {
                        method: method,
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          userId: user?._id,
                          type: addressForm.type,
                          name: addressForm.name,
                          phone: addressForm.phone,
                          street: street,
                          city: addressForm.district,
                          postalCode: addressForm.postalCode,
                          country: 'Bangladesh',
                        }),
                      });

                      const data = await response.json();

                      if (response.ok && data.success) {
                        Alert.alert('✅ Success', editingAddressId ? 'Address updated successfully!' : 'Address added successfully!');
                        setShowAddressModal(false);
                        setEditingAddressId(null);
                        fetchAddresses();
                        // Reset form
                        setAddressForm({
                          type: 'Home',
                          name: '',
                          phone: '',
                          houseRoad: '',
                          area: '',
                          district: '',
                          thana: '',
                          postalCode: '',
                        });
                        setSelectedDistrict('');
                        setAvailableThanas([]);
                      } else {
                        throw new Error(data.message || `Failed to ${editingAddressId ? 'update' : 'add'} address`);
                      }
                    } catch (error: any) {
                      Alert.alert('❌ Error', error.message || `Failed to ${editingAddressId ? 'update' : 'add'} address`);
                      console.error(`${editingAddressId ? 'Update' : 'Add'} address error:`, error);
                    }
                  }}
                >
                  <Text style={styles.saveButtonText}>Save Address</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Settings Modals */}
        <Modal
          visible={showChangePassword}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowChangePassword(false)}
        >
          <SafeAreaView style={styles.fullScreenModal}>
            <View style={styles.modalHeaderBar}>
              <TouchableOpacity 
                onPress={() => {
                  setShowChangePassword(false);
                  setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Change Password</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <ScrollView style={styles.fullScreenContent}>
              <View style={styles.passwordFormContainer}>
                <View style={styles.passwordInfo}>
                  <Shield size={48} color="#3B82F6" />
                  <Text style={styles.passwordInfoTitle}>Update Your Password</Text>
                  <Text style={styles.passwordInfoText}>
                    Choose a strong password to keep your account secure
                  </Text>
                </View>

                <View style={styles.passwordInputGroup}>
                  <Text style={styles.passwordLabel}>Current Password *</Text>
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter current password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showCurrentPassword}
                      value={passwordForm.currentPassword}
                      onChangeText={(text) => setPasswordForm(prev => ({ ...prev, currentPassword: text }))}
                    />
                    <TouchableOpacity 
                      style={styles.passwordToggle}
                      onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      <Eye size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.passwordInputGroup}>
                  <Text style={styles.passwordLabel}>New Password *</Text>
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter new password (min 6 characters)"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showNewPassword}
                      value={passwordForm.newPassword}
                      onChangeText={(text) => setPasswordForm(prev => ({ ...prev, newPassword: text }))}
                    />
                    <TouchableOpacity 
                      style={styles.passwordToggle}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                    >
                      <Eye size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  {passwordForm.newPassword.length > 0 && passwordForm.newPassword.length < 6 && (
                    <Text style={styles.passwordError}>Password must be at least 6 characters</Text>
                  )}
                </View>

                <View style={styles.passwordInputGroup}>
                  <Text style={styles.passwordLabel}>Confirm New Password *</Text>
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Re-enter new password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showConfirmPassword}
                      value={passwordForm.confirmPassword}
                      onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))}
                    />
                    <TouchableOpacity 
                      style={styles.passwordToggle}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Eye size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  {passwordForm.confirmPassword.length > 0 && passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <Text style={styles.passwordError}>Passwords do not match</Text>
                  )}
                </View>

                <View style={styles.passwordTips}>
                  <Text style={styles.passwordTipsTitle}>Password Requirements:</Text>
                  <View style={styles.passwordTip}>
                    <Text style={styles.passwordTipBullet}>•</Text>
                    <Text style={styles.passwordTipText}>At least 6 characters long</Text>
                  </View>
                  <View style={styles.passwordTip}>
                    <Text style={styles.passwordTipBullet}>•</Text>
                    <Text style={styles.passwordTipText}>Use a mix of letters and numbers</Text>
                  </View>
                  <View style={styles.passwordTip}>
                    <Text style={styles.passwordTipBullet}>•</Text>
                    <Text style={styles.passwordTipText}>Avoid common words or patterns</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.updatePasswordButton}
                  onPress={handleUpdatePassword}
                >
                  <Shield size={20} color="#FFFFFF" />
                  <Text style={styles.updatePasswordText}>Update Password</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        <Modal
          visible={showNotifications}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowNotifications(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🔔 Notification Settings</Text>
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
                {/* Order Notifications */}
                <View style={styles.notificationCategory}>
                  <View style={styles.categoryHeader}>
                    <Package size={20} color="#3B82F6" />
                    <Text style={styles.categoryTitle}>Order Notifications</Text>
                  </View>
                  <View style={styles.notificationSetting}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notificationTitle}>Order Updates</Text>
                      <Text style={styles.notificationSubtitle}>
                        Placed, confirmed, packed, shipped, delivered, cancelled
                      </Text>
                    </View>
                    <Switch 
                      value={notificationSettings.orderUpdates}
                      onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, orderUpdates: value }))}
                      trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                {/* Support Notifications */}
                <View style={styles.notificationCategory}>
                  <View style={styles.categoryHeader}>
                    <HelpCircle size={20} color="#10B981" />
                    <Text style={styles.categoryTitle}>Support & Tickets</Text>
                  </View>
                  <View style={styles.notificationSetting}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notificationTitle}>Support Updates</Text>
                      <Text style={styles.notificationSubtitle}>
                        Ticket created, admin replied, status changed, resolved
                      </Text>
                    </View>
                    <Switch 
                      value={notificationSettings.supportUpdates}
                      onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, supportUpdates: value }))}
                      trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                {/* Profile & Security Notifications */}
                <View style={styles.notificationCategory}>
                  <View style={styles.categoryHeader}>
                    <Shield size={20} color="#F59E0B" />
                    <Text style={styles.categoryTitle}>Profile & Security</Text>
                  </View>
                  <View style={styles.notificationSetting}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notificationTitle}>Account Updates</Text>
                      <Text style={styles.notificationSubtitle}>
                        Profile changes, password updates, suspicious login alerts
                      </Text>
                    </View>
                    <Switch 
                      value={notificationSettings.profileUpdates}
                      onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, profileUpdates: value }))}
                      trackColor={{ false: '#E5E7EB', true: '#F59E0B' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                {/* Promotion Notifications */}
                <View style={styles.notificationCategory}>
                  <View style={styles.categoryHeader}>
                    <Gift size={20} color="#EF4444" />
                    <Text style={styles.categoryTitle}>Offers & Promotions</Text>
                  </View>
                  <View style={styles.notificationSetting}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notificationTitle}>Special Offers</Text>
                      <Text style={styles.notificationSubtitle}>
                        New discounts, flash sales, vouchers, loyalty points
                      </Text>
                    </View>
                    <Switch 
                      value={notificationSettings.promotions}
                      onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, promotions: value }))}
                      trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                {/* App Notifications */}
                <View style={styles.notificationCategory}>
                  <View style={styles.categoryHeader}>
                    <Bell size={20} color="#8B5CF6" />
                    <Text style={styles.categoryTitle}>App Updates</Text>
                  </View>
                  <View style={styles.notificationSetting}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notificationTitle}>App Announcements</Text>
                      <Text style={styles.notificationSubtitle}>
                        New features, maintenance, version updates
                      </Text>
                    </View>
                    <Switch 
                      value={notificationSettings.appUpdates}
                      onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, appUpdates: value }))}
                      trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowNotifications(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={async () => {
                    try {
                      if (!user?._id) return;

                      // Update notification settings in Supabase
                      const { error } = await userService.updateProfile(user._id, {
                        notification_settings: notificationSettings
                      });

                      if (error) {
                        throw new Error('Failed to update notification settings');
                      }

                      Alert.alert('✅ Success', 'Notification settings updated successfully!');
                      setShowNotifications(false);
                      console.log('✅ Notification settings saved:', notificationSettings);
                    } catch (error: any) {
                      Alert.alert('❌ Error', error.message || 'Failed to update settings');
                      console.error('Update notification settings error:', error);
                    }
                  }}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
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
            <View style={[styles.modalContent, { maxHeight: '90%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Privacy & Security</Text>
                <TouchableOpacity onPress={() => setShowPrivacy(false)}>
                  <X size={24} color="#1F2937" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
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
                    onPress={() => router.push('/settings/privacy-policy')}
                  >
                    <FileText size={20} color="#3B82F6" />
                    <Text style={styles.privacyActionText}>View Privacy Policy</Text>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.privacyAction}
                    onPress={() => router.push('/settings/data-usage')}
                  >
                    <Database size={20} color="#10B981" />
                    <Text style={styles.privacyActionText}>Data Usage</Text>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.privacyAction, { borderBottomWidth: 0 }]}
                    onPress={() => {
                      setShowPrivacy(false);
                      // Delay to allow modal to close first
                      setTimeout(() => {
                        handleDeleteAccount();
                      }, 300);
                    }}
                  >
                    <Trash2 size={20} color="#EF4444" />
                    <Text style={[styles.privacyActionText, { color: '#EF4444' }]}>Delete Account</Text>
                    <ChevronRight size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </ScrollView>
              
              <View style={[styles.privacyFooter, { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 16 }]}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton, { flex: 1, marginRight: 8 }]}
                  onPress={() => setShowPrivacy(false)}
                >
                  <Text style={styles.cancelButtonText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton, { flex: 1 }]}
                  onPress={async () => {
                    try {
                      if (!user?._id) return;

                      // Update privacy settings in Supabase
                      const { error } = await userService.updateProfile(user._id, {
                        privacy_settings: privacySettings
                      });

                      if (error) {
                        throw new Error('Failed to update privacy settings');
                      }

                      Alert.alert('✅ Success', 'Your privacy settings have been updated!');
                      setShowPrivacy(false);
                    } catch (error: any) {
                      Alert.alert('❌ Error', error.message || 'Failed to update privacy settings');
                      console.error('Update privacy settings error:', error);
                    }
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
  logoutSettingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
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
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    gap: 8,
    maxWidth: 280,
  },
  addressText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 18,
    flex: 1,
  },
  editButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
  },
  tabNavigationWrapper: {
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  tabScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeTab: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
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
  actionBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  actionBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
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
  unreadCountBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
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
  notificationCategory: {
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  notificationSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 18,
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
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
  },
  emptyOrders: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyOrdersText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginTop: 16,
  },
  emptyOrdersSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  genderButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  genderButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  genderButtonTextActive: {
    color: '#3B82F6',
    fontFamily: 'Inter-SemiBold',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  gpsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  addressTypeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  addressTypeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  addressTypeButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  addressTypeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  addressTypeTextActive: {
    color: '#3B82F6',
    fontFamily: 'Inter-SemiBold',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  districtScroll: {
    maxHeight: 120,
  },
  districtButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    marginBottom: 8,
  },
  districtButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
  },
  districtButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  districtButtonTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  thanaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  thanaChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  thanaChipActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  thanaChipText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  thanaChipTextActive: {
    color: '#3B82F6',
    fontFamily: 'Inter-SemiBold',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioCircleSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
  },
  radioLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  pickerButton_old: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  dateInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
  },
  // Tier styles
  tierSection: {
    marginBottom: 16,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierSectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  tierBadgeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tierBadgeText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  tierProgressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tierProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierPointsLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  tierPointsValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  tierNextContainer: {
    alignItems: 'flex-end',
  },
  tierNextLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 2,
  },
  tierNextValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  tierProgressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierRemainingText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  tierPercentageText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  maxTierBanner: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
  },
  maxTierText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#059669',
    marginBottom: 4,
  },
  maxTierSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  tierBenefitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tierBenefitsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  benefitCheck: {
    fontSize: 16,
    color: '#10B981',
    marginRight: 8,
    fontFamily: 'Inter-Bold',
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    lineHeight: 20,
  },
  moreBenefits: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
    marginTop: 8,
    textAlign: 'center',
  },
  // Edit Modal Styles
  editModalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  editModalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  editModalSaveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalContent: {
    flex: 1,
  },
  editAvatarContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginBottom: 2,
  },
  editAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  editAvatarOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 20,
  },
  editAvatarText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  editFormContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  editInputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  editInputField: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  textAreaInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  genderButtonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },
  genderButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  genderButtonTextActive: {
    color: '#3B82F6',
  },
  dobInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dobInputGroup: {
    flex: 1,
  },
  dobLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 6,
  },
  dobInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    textAlign: 'center',
  },
  // Password Modal Styles
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  fullScreenContent: {
    flex: 1,
  },
  passwordFormContainer: {
    padding: 20,
  },
  passwordInfo: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  passwordInfoTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  passwordInfoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  passwordInputGroup: {
    marginBottom: 20,
  },
  passwordLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  passwordToggle: {
    paddingHorizontal: 12,
  },
  passwordError: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#EF4444',
    marginTop: 6,
  },
  passwordTips: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  passwordTipsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#92400E',
    marginBottom: 12,
  },
  passwordTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  passwordTipBullet: {
    fontSize: 14,
    color: '#F59E0B',
    marginRight: 8,
    fontFamily: 'Inter-Bold',
  },
  passwordTipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#78350F',
    lineHeight: 18,
  },
  updatePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  updatePasswordText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
});