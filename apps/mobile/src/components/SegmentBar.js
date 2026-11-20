// src/components/SegmentBar.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { tokens } from '../theme/tokens';

export const DEFAULT_SEGMENTS = [
  '전체',
  'HOT추천',
  '접속중',
  '가까운',
  '20대',
  '30대',
  '40대이상',
  '이성친구',
  '즉석만남',
];

export default function SegmentBar({
  segments = DEFAULT_SEGMENTS,
  value,
  onChange,
  style,
  contentContainerStyle,
}) {
  return (
    <View style={[styles.wrap, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.inner, contentContainerStyle]}
      >
        {segments.map((label) => {
          const on = value === label;
          return (
            <TouchableOpacity
              key={label}
              activeOpacity={0.85}
              onPress={() => onChange?.(label)}
              style={[styles.seg, on && styles.segOn]}
            >
              <Text style={[styles.segTxt, on && styles.segTxtOn]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
  },
  inner: {
    gap: tokens.spacing.xs + 2,
    alignItems: 'center',
  },
  seg: {
    minHeight: 36,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segOn: {
    backgroundColor: tokens.colors.text,
    borderColor: tokens.colors.text,
  },
  segTxt: {
    color: tokens.colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  segTxtOn: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
