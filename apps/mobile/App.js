import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, { Component, useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_700Bold,
} from '@expo-google-fonts/noto-sans-kr';

import Navigation from './src/navigation';
import colors from './src/theme/colors';
import { AuthProvider } from './src/context/AuthContext';

/** 전역 크래시 방어용 ErrorBoundary */
class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[GlobalErrorBoundary] Caught rendering error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
          <View style={styles.errorCard}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorTitle}>화면을 불러오는 중 오류가 발생했습니다</Text>
            <Text style={styles.errorDesc}>
              일시적인 네트워크 지연 또는 렌더링 오류일 수 있습니다. 아래 버튼을 눌러 다시 시도해 주세요.
            </Text>
            {this.state.error?.message ? (
              <Text style={styles.errorDetail} numberOfLines={3}>
                {this.state.error.message}
              </Text>
            ) : null}
            <TouchableOpacity style={styles.retryBtn} onPress={this.handleRetry} activeOpacity={0.85}>
              <Text style={styles.retryBtnText}>다시 시도하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold,
  });
  const [shouldRenderApp, setShouldRenderApp] = useState(false);

  useEffect(() => {
    // 250ms 타이머: 폰트 로딩 대기 시간으로 인한 앱 멈춤 방어 (시스템 폰트로 즉시 진입)
    const timer = setTimeout(() => {
      setShouldRenderApp(true);
    }, 250);

    if (fontsLoaded || fontError) {
      setShouldRenderApp(true);
    }

    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (fontError) {
      console.warn('Failed to load custom fonts, falling back to system fonts.', fontError);
    }
  }, [fontError]);

  if (!shouldRenderApp) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Image
          source={require('./assets/mocco-mascot.png')}
          style={styles.splashMascot}
          resizeMode="contain"
        />
        <Text style={styles.splashTitle}>모꼬 (Mocco)</Text>
        <Text style={styles.splashSubtitle}>새로운 인연과 즐거운 라이브 커머스 ☁️</Text>
        <ActivityIndicator size="small" color="#FF3B6B" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <GlobalErrorBoundary>
      <SafeAreaProvider style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.container}>
          <AuthProvider>
            <Navigation />
          </AuthProvider>
        </View>
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  splashMascot: {
    width: 120,
    height: 120,
    borderRadius: 24,
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  splashSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  errorCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  errorDetail: {
    fontSize: 11,
    color: '#EF4444',
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#FF3B6B',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
