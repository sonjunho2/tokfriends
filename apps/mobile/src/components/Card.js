import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { tokens } from '../theme/tokens';

export default function Card({
  children,
  onPress,
  padding = tokens.spacing.lg,
  margin = 0,
  borderRadius = tokens.radius.card,
  shadow = true,
  bordered = true,
  style,
  ...props
}) {
  const cardStyle = [
    styles.card,
    bordered && styles.bordered,
    shadow && tokens.shadows.card,
    {
      padding,
      margin,
      borderRadius,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.88}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.surface,
  },
  bordered: {
    borderWidth: 1,
    borderColor: tokens.colors.borderLight,
  },
});
