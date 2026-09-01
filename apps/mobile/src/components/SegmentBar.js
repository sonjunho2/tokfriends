// src/components/SegmentBar.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import colors from '../theme/colors';

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
              activeOpacity={0.9}
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
  wrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  inner: { gap: 10, alignItems: 'center' },
  seg: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: colors.pillBg,
    borderWidth: 1,
    borderColor: colors.border,
        justifyContent: 'center',
    alignItems: 'center',
  },
  segOn: {
    backgroundColor: colors.pillActiveBg,
    borderColor: colors.pillActiveBorder,
  },
  segTxt: { color: colors.textSecondary, fontWeight: '700', fontSize: 14, lineHeight: 20 },
  segTxtOn: { color: colors.primary },
});
