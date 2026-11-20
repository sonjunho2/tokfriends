// src/components/FormTextInput.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

export default function FormTextInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  multiline,
  numberOfLines,
  maxLength,
  editable = true,
  onFocus,
  onBlur,
  style,
  inputStyle,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          !editable && styles.inputDisabled,
          inputStyle,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={tokens.colors.textTertiary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        editable={editable}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
    marginBottom: tokens.spacing.xs,
    letterSpacing: -0.2,
  },
  input: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    fontSize: 15,
    fontWeight: '400',
    color: tokens.colors.text,
    minHeight: 48,
    letterSpacing: -0.2,
  },
  inputFocused: {
    borderColor: tokens.colors.primary,
    backgroundColor: tokens.colors.surface,
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: tokens.spacing.md,
  },
  inputError: {
    borderColor: tokens.colors.error,
  },
  inputDisabled: {
    backgroundColor: tokens.colors.surfaceSecondary,
    color: tokens.colors.textTertiary,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: tokens.colors.error,
    marginTop: 4,
    letterSpacing: -0.1,
  },
});
