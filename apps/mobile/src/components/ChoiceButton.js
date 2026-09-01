// src/components/ChoiceButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function ChoiceButton({ label, selected, onPress, style }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.box,
        selected && { borderColor: colors.primary, backgroundColor: '#fff' },
        style,
      ]}
    >
      <Text style={[styles.label, selected && { color: '#111', fontWeight: '800' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 96,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E6E8EC',
    backgroundColor: '#F7F8FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { fontSize: 22, color: '#A1A8B0', fontWeight: '700' },
});
