import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';

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
      bg: selected ? colors.primary : colors.primaryLight + '20',
      text: selected ? colors.textInverse : colors.primary,
    },
    mint: {
      bg: selected ? colors.accentMint : colors.accentMint + '20',
      text: selected ? colors.textInverse : colors.accentMintDark,
    },
    neutral: {
      bg: selected ? colors.text : colors.backgroundTertiary,
      text: selected ? colors.textInverse : colors.textSecondary,
    },
  };
  
  const sizeMap = {
    tiny: { paddingH: 8, paddingV: 4, fontSize: 11 },
    small: { paddingH: 12, paddingV: 6, fontSize: 12 },
    medium: { paddingH: 16, paddingV: 8, fontSize: 14 },
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
          paddingHorizontal: currentSize.paddingH,
          paddingVertical: currentSize.paddingV,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
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
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
