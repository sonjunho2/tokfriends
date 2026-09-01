// App.js
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_700Bold,
} from '@expo-google-fonts/noto-sans-kr';

import Navigation from './src/navigation';
import colors from './src/theme/colors';
import { AuthProvider } from './src/context/AuthContext';

export default function App() {
  // Snack 환경에서 TTF 파일을 업로드하지 않도록 Google Fonts 패키지에서 직접 불러옵니다
  const [fontsLoaded, fontError] = useFonts({
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold,
  });
  const [shouldRenderApp, setShouldRenderApp] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      setShouldRenderApp(true);
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (fontError) {
      console.error('Failed to load fonts, falling back to system fonts.', fontError);
    }
  }, [fontError]);

  if (!shouldRenderApp) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.backgroundSecondary} />
        <AuthProvider>
          <Navigation />
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
