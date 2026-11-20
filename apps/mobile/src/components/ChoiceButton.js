// src/components/ChoiceButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

export default function ChoiceButton({ label, selected, onPress, style, textStyle }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.box,
        selected && styles.selectedBox,
        style,
      ]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel, textStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: 56,
    borderRadius: tokens.radius.card,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
  },
  selectedBox: {
    borderColor: tokens.colors.primary,
    backgroundColor: tokens.colors.primaryLight,
  },
  label: {
    fontSize: 16,
    color: tokens.colors.textSecondary,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  selectedLabel: {
    color: tokens.colors.primary,
    fontWeight: '700',
  },
});
