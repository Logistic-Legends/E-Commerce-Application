import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import RNPicker from '@react-native-picker/picker';

interface CustomPickerProps {
  items: { label: string; value: string }[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  style?: object;
}

export function CustomPicker({
  items,
  selectedValue,
  onValueChange,
  style,
}: CustomPickerProps) {
  if (Platform.OS === 'web') {
    return (
      <select
        value={selectedValue}
        onChange={(e) => onValueChange(e.target.value)}
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 8,
          border: '1px solid #E5E7EB',
          backgroundColor: 'white',
          ...(style as object),
        }}
      >
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <View style={[styles.pickerContainer, style]}>
      <RNPicker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        style={styles.picker}
      >
        {items.map((item) => (
          <RNPicker.Item
            key={item.value}
            label={item.label}
            value={item.value}
          />
        ))}
      </RNPicker>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  picker: {
    width: '100%',
    height: 50,
  },
});
