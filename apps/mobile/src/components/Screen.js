// tokfriends-app/src/components/Screen.js
import React from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen({
  children,
  scrollable = true,
  keyboardAvoiding = true,
  style,
  contentContainerStyle,
  safeArea = true,
  padding = true,
  refreshControl,
  ...props
}) {
  const content = (
    <>
      {scrollable ? (
        <ScrollView
          style={[styles.scrollView, style]}
          contentContainerStyle={[
            styles.scrollContent,
            padding && styles.padding,
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          {...props}
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.container,
            padding && styles.padding,
            style,
          ]}
          {...props}
        >
          {children}
        </View>
      )}
    </>
  );

  const wrappedContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return safeArea ? (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      {wrappedContent}
    </SafeAreaView>
  ) : (
    wrappedContent
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollContent: {
    flexGrow: 1,
  },
  padding: {
    padding: 16,
  },
});
