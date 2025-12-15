import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function TabScreenContainer({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container,
      { 
        paddingBottom: Platform.select({
          android: 70, // Adjusted for new tab bar position
          ios: 60 + insets.bottom
        })
      }
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
