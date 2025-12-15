import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { API_URL, resolveUrl } from '../../config/api';
import { ArrowLeft, Send } from 'lucide-react-native';

export default function CreateTicketScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedTicketType, setSelectedTicketType] = useState<string>('Order Issue');
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    orderId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const ticketTypes = ['Order Issue', 'Payment Issue', 'Refund Issue', 'Account Issue', 'App Bug', 'Others'];

  const handleSubmitTicket = async () => {
    if (!contactForm.subject || !contactForm.message) {
      Alert.alert('⚠️ Required', 'Please fill in all required fields');
      return;
    }

    if (!user?._id) {
      Alert.alert('❌ Error', 'Please login to create a support ticket');
      return;
    }

    setSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(resolveUrl(`/support/tickets`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          type: selectedTicketType,
          subject: contactForm.subject,
          message: contactForm.message,
          orderId: contactForm.orderId || null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('✅ Success', 'Your support ticket has been created successfully!', [
          {
            text: 'OK',
            onPress: () => router.push('/support/my-tickets')
          }
        ]);
        setContactForm({ subject: '', message: '', orderId: '' });
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Support Ticket</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📋 Submit Your Issue</Text>
          <Text style={styles.infoText}>
            Our support team will respond within 24 hours. Please provide detailed information about your issue.
          </Text>
        </View>

        <Text style={styles.inputLabel}>Ticket Type *</Text>
        <View style={styles.ticketTypes}>
          {ticketTypes.map((type) => (
            <TouchableOpacity 
              key={type} 
              style={[styles.ticketTypeButton, selectedTicketType === type && styles.ticketTypeButtonActive]}
              onPress={() => setSelectedTicketType(type)}
            >
              <Text style={[styles.ticketTypeText, selectedTicketType === type && styles.ticketTypeTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.inputLabel}>Order ID (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="ORD-XXXXXX (if related to an order)"
          placeholderTextColor="#9CA3AF"
          value={contactForm.orderId}
          onChangeText={(text) => setContactForm(prev => ({ ...prev, orderId: text }))}
        />

        <Text style={styles.inputLabel}>Subject *</Text>
        <TextInput
          style={styles.input}
          placeholder="Brief description of your issue"
          placeholderTextColor="#9CA3AF"
          value={contactForm.subject}
          onChangeText={(text) => setContactForm(prev => ({ ...prev, subject: text }))}
        />

        <Text style={styles.inputLabel}>Message *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your issue in detail..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={6}
          value={contactForm.message}
          onChangeText={(text) => setContactForm(prev => ({ ...prev, message: text }))}
        />

        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmitTicket}
          disabled={submitting}
        >
          <Send size={20} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Ticket'}
          </Text>
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
  infoCard: {
    backgroundColor: '#EBF5FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1E40AF',
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  ticketTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  ticketTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  ticketTypeButtonActive: {
    backgroundColor: '#EBF5FF',
    borderColor: '#3B82F6',
  },
  ticketTypeText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  ticketTypeTextActive: {
    color: '#3B82F6',
    fontFamily: 'Inter-SemiBold',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});
