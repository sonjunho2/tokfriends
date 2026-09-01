// tokfriends-app/src/components/FormTextInput.js
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

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
 ...props
}) {
 return (
   <View style={styles.container}>
     {label && <Text style={styles.label}>{label}</Text>}
     <TextInput
       style={[
         styles.input,
         multiline && styles.multilineInput,
         error && styles.inputError,
         !editable && styles.inputDisabled,
       ]}
       value={value}
       onChangeText={onChangeText}
       placeholder={placeholder}
       placeholderTextColor="#6B7280"
       secureTextEntry={secureTextEntry}
       keyboardType={keyboardType}
       autoCapitalize={autoCapitalize}
       multiline={multiline}
       numberOfLines={numberOfLines}
       maxLength={maxLength}
       editable={editable}
       {...props}
     />
     {error && <Text style={styles.errorText}>{error}</Text>}
   </View>
 );
}

const styles = StyleSheet.create({
 container: {
   marginBottom: 16,
 },
 label: {
   fontSize: 14,
   fontFamily: 'NotoSansKR_500Medium',
   color: '#D1D5DB',
   marginBottom: 6,
 },
 input: {
   backgroundColor: '#1F2937',
   borderRadius: 8,
   borderWidth: 1,
   borderColor: '#374151',
   padding: 12,
   fontSize: 16,
   fontFamily: 'NotoSansKR_400Regular',
   color: '#F3F4F6',
   minHeight: 48,
 },
 multilineInput: {
   minHeight: 100,
   textAlignVertical: 'top',
 },
 inputError: {
   borderColor: '#EF4444',
 },
 inputDisabled: {
   backgroundColor: '#111827',
   opacity: 0.6,
 },
 errorText: {
   fontSize: 12,
   fontFamily: 'NotoSansKR_400Regular',
   color: '#EF4444',
   marginTop: 4,
 },
});