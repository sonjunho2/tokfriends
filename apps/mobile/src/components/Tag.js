import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { tokens } from '../theme/tokens';

export default function Tag({
  label,
  onPress,
  color = 'primary',
  size = 'small',
  selected = false,
  style,
  textStyle,
}) {
  const colorMap = {
    primary: {
      bg: selected ? tokens.colors.primary : tokens.colors.primaryLight,
      text: selected ? '#FFFFFF' : tokens.colors.primary,
      border: selected ? tokens.colors.primary : 'transparent',
    },
    secondary: {
      bg: selected ? tokens.colors.secondary : tokens.colors.secondaryLight,
      text: selected ? '#FFFFFF' : tokens.colors.secondary,
      border: selected ? tokens.colors.secondary : 'transparent',
    },
    neutral: {
      bg: selected ? tokens.colors.text : tokens.colors.surfaceSecondary,
      text: selected ? '#FFFFFF' : tokens.colors.textSecondary,
      border: selected ? tokens.colors.text : tokens.colors.borderLight,
    },
    outline: {
      bg: 'transparent',
      text: selected ? tokens.colors.primary : tokens.colors.textSecondary,
      border: selected ? tokens.colors.primary : tokens.colors.border,
    },
  };

  const sizeMap = {
    tiny: { paddingH: 6, paddingV: 2, fontSize: 10, minHeight: 20 },
    small: { paddingH: 8, paddingV: 4, fontSize: 11, minHeight: 24 },
    medium: { paddingH: 12, paddingV: 6, fontSize: 13, minHeight: 30 },
  };

  const currentColor = colorMap[color] || colorMap.primary;
  const currentSize = sizeMap[size] || sizeMap.small;

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[
        styles.tag,
        {
          backgroundColor: currentColor.bg,
          borderColor: currentColor.border,
          borderWidth: currentColor.border !== 'transparent' ? 1 : 0,
          paddingHorizontal: currentSize.paddingH,
          paddingVertical: currentSize.paddingV,
          minHeight: currentSize.minHeight,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text
        style={[
          styles.text,
          {
            color: currentColor.text,
            fontSize: currentSize.fontSize,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Component>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: tokens.radius.pill,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
