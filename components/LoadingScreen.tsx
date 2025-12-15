import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import AnimatedLogo from './AnimatedLogo';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <AnimatedLogo size={100} />
      <Text style={styles.message}>{message}</Text>
      <ActivityIndicator size="large" color="#3B82F6" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 24,
    marginBottom: 16,
    fontFamily: 'Inter-Medium',
  },
  spinner: {
    marginTop: 8,
  },
});
