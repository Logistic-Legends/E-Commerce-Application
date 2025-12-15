import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface TierBadgeProps {
  tier: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const TIER_CONFIG: Record<string, { colors: readonly [string, string]; icon: string }> = {
  Bronze: { colors: ['#CD7F32', '#B8732D'] as const, icon: '🥉' },
  Silver: { colors: ['#C0C0C0', '#A8A8A8'] as const, icon: '🥈' },
  Titanium: { colors: ['#878681', '#6E6D69'] as const, icon: '🔩' },
  Gold: { colors: ['#FFD700', '#FFA500'] as const, icon: '🥇' },
  Platinum: { colors: ['#E5E4E2', '#D3D3D3'] as const, icon: '🔸' },
  Diamond: { colors: ['#B9F2FF', '#00CED1'] as const, icon: '♦️' }
};

export default function TierBadge({ tier = 'Bronze', size = 'medium', showLabel = true }: TierBadgeProps) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.Bronze;
  
  const sizeStyles = {
    small: { width: 50, height: 50, iconSize: 20, fontSize: 10 },
    medium: { width: 70, height: 70, iconSize: 28, fontSize: 12 },
    large: { width: 100, height: 100, iconSize: 40, fontSize: 14 }
  };
  
  const { width, height, iconSize, fontSize } = sizeStyles[size];
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={config.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.badge, { width, height, borderRadius: width / 2 }]}
      >
        <Text style={[styles.icon, { fontSize: iconSize }]}>{config.icon}</Text>
      </LinearGradient>
      {showLabel && (
        <Text style={[styles.tierLabel, { fontSize }]}>{tier}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8
  },
  icon: {
    textAlign: 'center'
  },
  tierLabel: {
    marginTop: 8,
    fontWeight: '600',
    color: '#1F2937',
    textTransform: 'uppercase',
    letterSpacing: 1
  }
});
