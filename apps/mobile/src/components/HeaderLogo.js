import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { tokens } from '../theme/tokens';

export default function HeaderLogo({ size = 'medium', style }) {
  const height =
    typeof size === 'number'
      ? size
      : size === 'small'
      ? 20
      : size === 'large'
      ? 36
      : 26;

  const fontSize = Math.round(height * 0.85);

  return (
    <View style={[styles.wrap, style]}>
      <Text
        accessible
        accessibilityRole="header"
        style={[styles.logoText, { fontSize }]}
      >
        <Text style={styles.brand}>MOCCO</Text>
      </Text>
      <View style={styles.dot} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  brand: {
    color: tokens.colors.primary,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: tokens.colors.secondary,
    marginLeft: 3,
    marginBottom: 4,
  },
});
