// src/components/ButtonPrimary.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import colors from '../theme/colors';

export default function ButtonPrimary({
  title,
  onPress,
  disabled,
  loading = false,
  style,
  variant = 'primary', // 'primary' | 'outline'
}) {
  const isOutline = variant === 'outline';
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.btn,
        isOutline ? styles.outline : styles.primary,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isOutline ? colors.primary : '#fff'} />
      ) : (
        <Text
          style={[
            styles.txt,
            isOutline ? { color: colors.primary } : { color: '#fff' },
            isDisabled && { opacity: 0.7 },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  primary: { backgroundColor: colors.primary },
  outline: { backgroundColor: '#fff', borderWidth: 2, borderColor: colors.primary },
  txt: { fontSize: 18, fontWeight: '700' },
  disabled: { opacity: 0.9 },
});
