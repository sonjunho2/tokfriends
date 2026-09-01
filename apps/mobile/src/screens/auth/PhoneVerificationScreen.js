// src/screens/auth/PhoneVerificationScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import ButtonPrimary from '../../components/ButtonPrimary';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_EXPIRES = 180;

export default function PhoneVerificationScreen({ navigation, route }) {
  const { authenticateWithToken } = useAuth();
  const { phone, formattedPhone, requestId, expiresIn = DEFAULT_EXPIRES } = route.params || {};
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(expiresIn);
  const timerRef = useRef(null);

  const digits = useMemo(() => String(code || '').replace(/\D/g, '').slice(0, 6), [code]);
  const canSubmit = digits.length === 6 && !loading;

  useEffect(() => {
    setCode('');
  }, [phone]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleVerify = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const response = await apiClient.verifyPhoneOtp({
        phone,
        code: digits,
        requestId,
      });
      const token = response?.token || response?.accessToken || response?.access_token;
      const needsProfile = response?.needsProfile ?? response?.isNewUser ?? !token;
      if (token) {
        const result = await authenticateWithToken(token, response?.user || null);
        if (!result.success) {
          throw new Error(result.error || '세션 생성 실패');
        }
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        return;
      }
      if (needsProfile) {
        navigation.replace('Agreement', {
          phone,
          formattedPhone,
          verificationId: response?.verificationId || response?.sessionId || requestId,
        });
        return;
      }
      Alert.alert('안내', '추가 정보가 필요합니다. 다시 시도해 주세요.');
    } catch (error) {
      Alert.alert('인증 실패', error?.message || '인증번호가 올바르지 않아요. 다시 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await apiClient.requestPhoneOtp({ phone });
      const nextRequestId = res?.requestId || res?.id || requestId;
      setTimer(res?.expiresIn ?? DEFAULT_EXPIRES);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      navigation.setParams({ requestId: nextRequestId });
      Alert.alert('전송 완료', '새 인증번호를 전송했어요.');
    } catch (error) {
      Alert.alert('전송 실패', error?.message || '인증번호를 다시 전송하지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const minutes = Math.floor(timer / 60);
  const seconds = String(timer % 60).padStart(2, '0');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          <Text style={styles.title}>인증번호를 입력해 주세요</Text>
          <Text style={styles.description}>
            {formattedPhone || phone} 번호로 전송된 6자리 인증번호를 입력하면
            {"\n"}바로 시작할 수 있어요.
          </Text>

          <View style={styles.codeWrapper}>
            <TextInput
              style={styles.codeInput}
              keyboardType="number-pad"
              value={digits}
              onChangeText={setCode}
              placeholder="000000"
              placeholderTextColor={colors.textTertiary}
              maxLength={6}
              textAlign="center"
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleVerify}
            />
            <Text style={styles.timer}>남은 시간 {minutes}:{seconds}</Text>
          </View>

          <TouchableOpacity style={styles.resend} onPress={handleResend} disabled={loading || timer > 0}>
            <Text style={[styles.resendText, (loading || timer > 0) && { opacity: 0.4 }]}>인증번호 다시 받기</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          <ButtonPrimary
            title="인증하고 계속하기"
            onPress={handleVerify}
            disabled={!canSubmit}
            loading={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    marginTop: 12,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  codeWrapper: {
    marginTop: 36,
    alignItems: 'center',
    gap: 12,
  },
  codeInput: {
    width: '80%',
    height: 70,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.primary,
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 8,
  },
  timer: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  resend: {
    marginTop: 16,
    alignSelf: 'center',
  },
  resendText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '700',
  },
});
