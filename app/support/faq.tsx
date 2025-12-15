import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, HelpCircle, ChevronRight } from 'lucide-react-native';

export default function FAQScreen() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

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
      question: 'কিভাবে অ্যাকাউন্ট ডিলিট করবো?',
      answer: 'Profile → Settings → Account Settings → Delete Account ক্লিক করুন'
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center / FAQ</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.banner}>
          <HelpCircle size={48} color="#3B82F6" />
          <Text style={styles.bannerTitle}>Frequently Asked Questions</Text>
          <Text style={styles.bannerSubtitle}>Find quick answers to common questions</Text>
        </View>

        {faqData.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.faqCard}
            onPress={() => setExpandedIndex(expandedIndex === index ? null : index)}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <ChevronRight 
                size={20} 
                color="#6B7280" 
                style={{ 
                  transform: [{ rotate: expandedIndex === index ? '90deg' : '0deg' }] 
                }}
              />
            </View>
            {expandedIndex === index && (
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactSubtitle}>Create a support ticket or contact us directly</Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => router.push('/support/create-ticket')}
          >
            <Text style={styles.contactButtonText}>Create Support Ticket</Text>
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
  banner: {
    backgroundColor: '#EBF5FF',
    padding: 24,
    alignItems: 'center',
    margin: 16,
    borderRadius: 12,
  },
  bannerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginTop: 12,
  },
  bannerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  faqAnswer: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 12,
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  contactSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  contactButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  contactButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});
