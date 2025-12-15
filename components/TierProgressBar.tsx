import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface TierProgressBarProps {
  currentPoints: number;
  currentTier: string;
  nextTier: string | null;
  pointsToNextTier: number;
  progressPercentage: number;
}

const TIER_COLORS: Record<string, readonly [string, string]> = {
  Bronze: ['#CD7F32', '#B8732D'] as const,
  Silver: ['#C0C0C0', '#A8A8A8'] as const,
  Titanium: ['#878681', '#6E6D69'] as const,
  Gold: ['#FFD700', '#FFA500'] as const,
  Platinum: ['#E5E4E2', '#D3D3D3'] as const,
  Diamond: ['#B9F2FF', '#00CED1'] as const
};

export default function TierProgressBar({
  currentPoints,
  currentTier,
  nextTier,
  pointsToNextTier,
  progressPercentage
}: TierProgressBarProps) {
  const colors = TIER_COLORS[currentTier] || TIER_COLORS.Bronze;
  
  if (!nextTier) {
    return (
      <View style={styles.container}>
        <View style={styles.maxTierContainer}>
          <Text style={styles.maxTierText}>🏆 Maximum Tier Achieved!</Text>
          <Text style={styles.maxTierSubtext}>You're at the top! Enjoy all Diamond benefits.</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.currentTierText}>{currentTier}</Text>
          <Text style={styles.pointsText}>{currentPoints.toLocaleString()} Points</Text>
        </View>
        <View style={styles.nextTierContainer}>
          <Text style={styles.nextTierLabel}>Next Tier</Text>
          <Text style={styles.nextTierText}>{nextTier}</Text>
        </View>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${Math.min(100, progressPercentage)}%` }]}
          />
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.remainingText}>
          {pointsToNextTier.toLocaleString()} points to {nextTier}
        </Text>
        <Text style={styles.percentageText}>{progressPercentage.toFixed(1)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  currentTierText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4
  },
  pointsText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500'
  },
  nextTierContainer: {
    alignItems: 'flex-end'
  },
  nextTierLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2
  },
  nextTierText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6'
  },
  progressBarContainer: {
    marginBottom: 12
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  remainingText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500'
  },
  percentageText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600'
  },
  maxTierContainer: {
    alignItems: 'center',
    padding: 20
  },
  maxTierText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 8
  },
  maxTierSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center'
  }
});
