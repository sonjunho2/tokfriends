import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';

export default function Card({
  children,
  onPress,
  padding = 16,
  margin = 0,
  borderRadius = 18,
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
        activeOpacity={0.92}
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2F4F6',
  },
  shadow: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
});
