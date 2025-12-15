import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, CreditCard, Truck } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { userService } from '@/lib/supabase-services';

export default function CheckoutScreen() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    postalCode: '',
  });

  // Auto-fill shipping address from user profile
  useEffect(() => {
    const loadUserAddress = async () => {
      if (user?._id) {
        try {
          const { data, error } = await userService.getProfile(user._id);
          
          if (data && !error) {
            // Auto-fill the form with user's saved data
            setShippingAddress({
              name: data.name || '',
              phone: data.phone || '',
              street: data.full_address || '',
              city: '', // Can be parsed from full_address if structured
              postalCode: '', // Can be parsed from full_address if structured
            });
          }
        } catch (error) {
          console.error('Error loading user address:', error);
        }
      }
    };
    
    loadUserAddress();
  }, [user]);

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card' | 'mobile'>('cod');

  const handlePlaceOrder = async () => {
    if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city) {
      Alert.alert('Error', 'Please fill in all required shipping address fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please login to place an order');
      router.push('/(auth)/login' as any);
      return;
    }

    setLoading(true);

    try {
      // Prepare order data
      const orderData = {
        items: items.map(item => ({
          product: item.id,
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          price: item.price,
          variant: item.color && item.size ? `${item.color} / ${item.size}` : item.color || item.size || ''
        })),
        shippingAddress: {
          name: shippingAddress.name,
          email: user.email || '',
          phone: shippingAddress.phone,
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.city, // Using city as state for now
          zipCode: shippingAddress.postalCode || '0000',
          country: 'Bangladesh'
        },
        paymentMethod: paymentMethod === 'cod' ? 'cash_on_delivery' : 
                       paymentMethod === 'card' ? 'credit_card' : 'bank_transfer',
        itemsPrice: totalPrice,
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: totalPrice
      };


      // Generate unique order number
      const orderNumber = `ORD-${Date.now().toString().slice(-8).toUpperCase()}`;

      // Insert order into Supabase (use separate price columns)
      const { data: newOrder, error } = await supabase
        .from('orders')
        .insert([{
          user_id: user._id,
          order_number: orderNumber,
          items: orderData.items,
          shipping_address: orderData.shippingAddress,
          payment_method: orderData.paymentMethod,
          subtotal: orderData.itemsPrice,
          shipping_price: orderData.shippingPrice,
          total_price: orderData.totalPrice,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to place order');
      }

      // Create notification for admin about new order
      try {
        await supabase
          .from('notifications')
          .insert([{
            user_id: user._id,
            type: 'order',
            category: 'New Order',
            title: '🛒 New Order Placed',
            message: `New order ${orderNumber} placed by ${shippingAddress.name}. Total: ৳${totalPrice.toFixed(2)}`,
            data: {
              orderId: newOrder.id,
              orderNumber: orderNumber,
              customerName: shippingAddress.name,
              totalAmount: totalPrice,
              itemsCount: items.length
            },
            is_admin_notification: true,
            is_read: false
          }]);
        
        console.log('✅ Admin notification created for order:', orderNumber);
      } catch (notifError: any) {
        console.error('⚠️ Failed to create admin notification:', notifError.message);
        // Don't fail the order if notification fails
      }

      // Update loyalty points (1 point per 100 taka spent)
      try {
        const pointsEarned = Math.floor(totalPrice / 100);
        
        if (pointsEarned > 0) {
          // Get current loyalty points
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('loyalty_points')
            .eq('id', user._id)
            .single();

          if (!userError && userData) {
            const currentPoints = userData.loyalty_points || 0;
            const newPoints = currentPoints + pointsEarned;

            // Update loyalty points
            const { error: updateError } = await supabase
              .from('users')
              .update({ loyalty_points: newPoints })
              .eq('id', user._id);

            if (!updateError) {
              console.log(`✅ Added ${pointsEarned} loyalty points. Total: ${newPoints}`);
            }
          }
        }
      } catch (pointsError: any) {
        console.error('⚠️ Failed to update loyalty points:', pointsError.message);
        // Don't fail the order if points update fails
      }

      // Show success alert
      Alert.alert(
        '✅ Order Placed Successfully!',
        `Your order ${orderNumber} has been placed successfully.\n\nTotal: ৳${totalPrice.toFixed(2)}\nPayment: ${paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'card' ? 'Card' : 'Mobile Banking'}\n\nYou will receive a confirmation shortly.`,
        [
          {
            text: 'View Orders',
            onPress: () => {
              clearCart();
              router.replace('/orders' as any);
            }
          },
          {
            text: 'Continue Shopping',
            onPress: () => {
              clearCart();
              router.replace('/(tabs)/' as any);
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Order placement error:', error);
      Alert.alert('Error', error.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Truck size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Shipping Address</Text>
          </View>
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={shippingAddress.name}
                onChangeText={(text) => setShippingAddress(prev => ({ ...prev, name: text }))}
                placeholder="Enter your full name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={shippingAddress.phone}
                onChangeText={(text) => setShippingAddress(prev => ({ ...prev, phone: text }))}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street Address *</Text>
              <TextInput
                style={styles.input}
                value={shippingAddress.street}
                onChangeText={(text) => setShippingAddress(prev => ({ ...prev, street: text }))}
                placeholder="Enter your street address"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  value={shippingAddress.city}
                  onChangeText={(text) => setShippingAddress(prev => ({ ...prev, city: text }))}
                  placeholder="City"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Postal Code</Text>
                <TextInput
                  style={styles.input}
                  value={shippingAddress.postalCode}
                  onChangeText={(text) => setShippingAddress(prev => ({ ...prev, postalCode: text }))}
                  placeholder="12345"
                />
              </View>
            </View>

          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'cod' && styles.selectedPaymentOption]}
            onPress={() => setPaymentMethod('cod')}
          >
            <View style={styles.paymentOptionContent}>
              <Text style={[styles.paymentTitle, paymentMethod === 'cod' && styles.selectedPaymentTitle]}>Cash on Delivery</Text>
              <Text style={[styles.paymentSubtitle, paymentMethod === 'cod' && styles.selectedPaymentSubtitle]}>Pay when your order arrives</Text>
            </View>
            <View style={[styles.radio, paymentMethod === 'cod' && styles.selectedRadio]}>
              {paymentMethod === 'cod' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'card' && styles.selectedPaymentOption]}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={styles.paymentOptionContent}>
              <Text style={[styles.paymentTitle, paymentMethod === 'card' && styles.selectedPaymentTitle]}>Credit/Debit Card</Text>
              <Text style={[styles.paymentSubtitle, paymentMethod === 'card' && styles.selectedPaymentSubtitle]}>Pay securely with your card</Text>
            </View>
            <View style={[styles.radio, paymentMethod === 'card' && styles.selectedRadio]}>
              {paymentMethod === 'card' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'mobile' && styles.selectedPaymentOption]}
            onPress={() => setPaymentMethod('mobile')}
          >
            <View style={styles.paymentOptionContent}>
              <Text style={[styles.paymentTitle, paymentMethod === 'mobile' && styles.selectedPaymentTitle]}>Mobile Banking</Text>
              <Text style={[styles.paymentSubtitle, paymentMethod === 'mobile' && styles.selectedPaymentSubtitle]}>bKash, Nagad, Rocket</Text>
            </View>
            <View style={[styles.radio, paymentMethod === 'mobile' && styles.selectedRadio]}>
              {paymentMethod === 'mobile' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          
          {items.map((item) => (
            <View key={`${item.id}-${item.color}-${item.size}`} style={styles.orderItem}>
              <Text style={styles.orderItemName}>{item.name}</Text>
              <Text style={styles.orderItemDetails}>
                Qty: {item.quantity} × ৳{item.price}
              </Text>
              <Text style={styles.orderItemTotal}>
                ৳{(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>৳{totalPrice.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.placeOrderButton, loading && styles.placeOrderButtonDisabled]} 
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginLeft: 8,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#F9FAFB',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  selectedPaymentOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  paymentOptionContent: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  paymentSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadio: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  selectedPaymentTitle: {
    color: '#3B82F6',
  },
  selectedPaymentSubtitle: {
    color: '#3B82F6',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  orderItemName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  orderItemDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginHorizontal: 8,
  },
  orderItemTotal: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#3B82F6',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  placeOrderButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
});