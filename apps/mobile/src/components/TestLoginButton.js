// apps/mobile/src/components/TestLoginButton.js
/**
 * 🧪 [개발 및 스토어 심사용 테스트 간편 로그인 버튼]
 * 
 * - 역할: 별도 외부 소셜 인증(카카오/네이버/구글/애플) 절차 없이,
 *         백엔드에 등록된 전용 테스트 계정(test_user@dagaon.com)으로 즉시 인증 토큰을 수령하고
 *         세션을 활성화하여 메인 화면으로 다이렉트 진입합니다.
 * 
 * - 상용 배포(Production) 시 제거 방법:
 *   LoginScreen.js에서 <TestLoginButton /> 컴포넌트 호출 라인만 주석 처리하거나 제거하면
 *   깔끔하게 비활성화됩니다.
 */
import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function TestLoginButton({ onSuccess, style }) {
  const { testLogin } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleTestLogin = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const result = await testLogin();
      if (result.success) {
        onSuccess?.(result.user);
      } else {
        Alert.alert(
          '테스트 로그인 실패',
          result.error || '테스트 서버와 통신 중 문제가 발생했습니다.',
        );
      }
    } catch (error) {
      Alert.alert(
        '테스트 로그인 오류',
        error?.message || '알 수 없는 오류가 발생했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.button}
        onPress={handleTestLogin}
        disabled={loading}
        activeOpacity={0.85}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>DEV ONLY</Text>
        </View>

        <View style={styles.contentRow}>
          {loading ? (
            <ActivityIndicator size="small" color="#6366F1" />
          ) : (
            <Ionicons name="flask" size={18} color="#6366F1" />
          )}
          <Text style={styles.buttonText}>
            {loading ? '테스트 계정 로그인 중...' : '🧪 테스트 간편 로그인 (다가온테스터)'}
          </Text>
        </View>
        <Text style={styles.hintText}>인증 없이 즉시 앱 기능 전체 탐색</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  button: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -9,
    right: 14,
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: -0.3,
  },
  hintText: {
    fontSize: 11,
    color: '#818CF8',
    marginTop: 4,
    fontWeight: '500',
  },
});
