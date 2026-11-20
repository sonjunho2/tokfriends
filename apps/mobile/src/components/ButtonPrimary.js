// src/components/ButtonPrimary.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { tokens } from '../theme/tokens';

export default function ButtonPrimary({
  title,
  onPress,
  disabled,
  loading = false,
  style,
  textStyle,
  variant = 'primary', // 'primary' | 'outline' | 'secondary' | 'ghost'
  size = 'large', // 'small' | 'medium' | 'large'
}) {
  const isOutline = variant === 'outline';
  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';
  const isDisabled = disabled || loading;

  const sizeStyle = size === 'small' ? styles.btnSmall : size === 'medium' ? styles.btnMedium : styles.btnLarge;
  const textSizeStyle = size === 'small' ? styles.txtSmall : size === 'medium' ? styles.txtMedium : styles.txtLarge;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.btn,
        sizeStyle,
        isOutline
          ? styles.outline
          : isSecondary
          ? styles.secondary
          : isGhost
          ? styles.ghost
          : styles.primary,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isOutline || isGhost ? tokens.colors.primary : isSecondary ? tokens.colors.text : '#FFFFFF'}
        />
      ) : (
        <Text
          style={[
            styles.txt,
            textSizeStyle,
            isOutline || isGhost
              ? { color: tokens.colors.primary }
              : isSecondary
              ? { color: tokens.colors.text }
              : { color: '#FFFFFF' },
            isDisabled && { color: tokens.colors.textTertiary },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: tokens.radius.button,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  btnLarge: {
    minHeight: 52,
    paddingHorizontal: tokens.spacing.xl,
  },
  btnMedium: {
    minHeight: 44,
    paddingHorizontal: tokens.spacing.lg,
  },
  btnSmall: {
    minHeight: 36,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.sm,
  },
  primary: {
    backgroundColor: tokens.colors.primary,
  },
  secondary: {
    backgroundColor: tokens.colors.surfaceSecondary,
  },
  outline: {
    backgroundColor: tokens.colors.surface,
    borderWidth: 1.5,
    borderColor: tokens.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  txt: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  txtLarge: {
    fontSize: 16,
    lineHeight: 22,
  },
  txtMedium: {
    fontSize: 14,
    lineHeight: 20,
  },
  txtSmall: {
    fontSize: 13,
    lineHeight: 18,
  },
  disabled: {
    backgroundColor: tokens.colors.surfaceSecondary,
    borderColor: tokens.colors.border,
    opacity: 0.6,
  },
});
