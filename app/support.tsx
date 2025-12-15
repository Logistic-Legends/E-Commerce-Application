import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '../config/api';
import { 
  ArrowLeft, 
  HelpCircle, 
  MessageCircle, 
  Phone, 
  Mail, 
  FileText, 
  Shield, 
  ChevronRight
} from 'lucide-react-native';

export default function SupportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const supportCategories = [
    { 
      id: 'faq', 
      title: 'Help Center / FAQ', 
      icon: HelpCircle, 
      color: '#3B82F6',
      description: 'Find answers to common questions',
      route: '/support/faq'
    },
    { 
      id: 'tickets', 
      title: 'My Support Tickets', 
      icon: FileText, 
      color: '#F59E0B',
      description: 'View and manage your tickets',
      route: '/support/my-tickets'
    },
    { 
      id: 'create', 
      title: 'Create Support Ticket', 
      icon: MessageCircle, 
      color: '#10B981',
      description: 'Report an issue or request help',
      route: '/support/create-ticket'
    },
    { 
      id: 'contact', 
      title: 'Contact Us', 
      icon: Phone, 
      color: '#8B5CF6',
      description: 'Call or email our support team',
      route: 'contact'
    },
  ];

  const faqData = [
    {
      question: 'কিভাবে অর্ডার করবো?',
      answer: 'প্রোডাক্ট সিলেক্ট করুন → Add to Cart → Checkout → পেমেন্ট করুন'
    },
    {
      question: 'কিভাবে পেমেন্ট করবো?',
      answer: 'Checkout পেজে যান → পেমেন্ট মেথড সিলেক্ট করুন (Card/bKash/Nagad/Cash on Delivery)'
    },
    {
      question: 'ডেলিভারি কত দিনে হবে?',
      answer: 'ঢাকার মধ্যে: ১-২ দিন | ঢাকার বাইরে: ৩-৫ দিন'
    },
    {
      question: 'ডেলিভারি চার্জ কত?',
      answer: 'ঢাকার মধ্যে: ৬০ টাকা | ঢাকার বাইরে: ১২০ টাকা | ১০০০ টাকার উপরে ফ্রি'
    },
    {
      question: 'কিভাবে রিটার্ন/রিফান্ড চাইবো?',
      answer: 'Profile → Orders → Order সিলেক্ট → Return Request করুন। ৭ দিনের মধ্যে রিফান্ড হবে।'
    },
    {
      question: 'কিভাবে পাসওয়ার্ড রিসেট করবো?',
      answer: 'Login পেজে যান → Forgot Password → ইমেইল দিন → Reset লিঙ্ক পাবেন'
    },
    {
      question: 'কিভাবে প্রোফাইল আপডেট করবো?',
      answer: 'Profile Tab → Edit বাটন → তথ্য পরিবর্তন করুন → Save করুন'
    },
  ];

  const handleCall = () => {
    Linking.openURL('tel:+8801712345678');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@yourapp.com');
  };



  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Contact Options */}
        <View style={styles.quickContact}>
          <TouchableOpacity style={styles.quickContactButton} onPress={handleCall}>
            <View style={[styles.quickContactIcon, { backgroundColor: '#DBEAFE' }]}>
              <Phone size={24} color="#3B82F6" />
            </View>
            <Text style={styles.quickContactText}>Call Us</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickContactButton} onPress={handleEmail}>
            <View style={[styles.quickContactIcon, { backgroundColor: '#D1FAE5' }]}>
              <Mail size={24} color="#10B981" />
            </View>
            <Text style={styles.quickContactText}>Email Us</Text>
          </TouchableOpacity>
        </View>

        {/* Support Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How can we help you?</Text>
          {supportCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => {
                  if (category.route === 'contact') {
                    setSelectedCategory('contact');
                  } else {
                    router.push(category.route as any);
                  }
                }}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                  <IconComponent size={24} color={category.color} />
                </View>
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Contact Section */}
        {selectedCategory === 'contact' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📞 Contact Information</Text>
            
            <View style={styles.policyCard}>
              <Phone size={24} color="#3B82F6" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.policyText}>Phone</Text>
                <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>+880 1234-567890</Text>
                <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Available 24/7</Text>
              </View>
            </View>
            
            <View style={styles.policyCard}>
              <Mail size={24} color="#10B981" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.policyText}>Email</Text>
                <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>support@example.com</Text>
                <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Response within 24 hours</Text>
              </View>
            </View>
          </View>
        )}

        {/* Contact Information */}
        <View style={styles.contactInfo}>
          <Text style={styles.contactInfoTitle}>Contact Information</Text>
          <Text style={styles.contactInfoText}>📞 Phone: +880 1712-345678</Text>
          <Text style={styles.contactInfoText}>📧 Email: support@yourapp.com</Text>
          <Text style={styles.contactInfoText}>🕐 Available: 24/7</Text>
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
  },
  quickContact: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  quickContactButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickContactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickContactText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  faqQuestion: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  chatCard: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  chatTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginTop: 16,
  },
  chatDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  startChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startChatText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  ticketTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  ticketTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  ticketTypeText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
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
    height: 120,
    textAlignVertical: 'top',
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    marginBottom: 16,
  },
  attachmentText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  orderSupportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  orderSupportContent: {
    flex: 1,
    marginLeft: 12,
  },
  orderSupportTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  orderSupportDesc: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  policyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  policyText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginLeft: 12,
  },
  contactInfo: {
    backgroundColor: '#DBEAFE',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    marginBottom: 40,
  },
  contactInfoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1E40AF',
    marginBottom: 12,
  },
  contactInfoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1E3A8A',
    marginBottom: 6,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketNumber: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#3B82F6',
  },
  ticketStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ticketStatusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  ticketSubject: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  ticketType: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  ticketTypeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  ticketTypeTextActive: {
    color: '#3B82F6',
    fontFamily: 'Inter-SemiBold',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter-Bold',
  },
  lastReply: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 6,
  },
  viewAllButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
  },
});
