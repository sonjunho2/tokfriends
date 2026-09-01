import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';

export default function Card({
  children,
  onPress,
  padding = 16,
  margin = 0,
  borderRadius = 16,
  shadow = true,
  style,
  ...props
}) {
  const cardStyle = [
    styles.card,
    shadow && styles.shadow,
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
        activeOpacity={0.95}
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
    backgroundColor: colors.backgroundSecondary,
  },
  shadow: {
    shadowColor: colors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});
