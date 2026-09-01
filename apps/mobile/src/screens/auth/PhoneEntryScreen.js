// src/screens/auth/PhoneEntryScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import ButtonPrimary from '../../components/ButtonPrimary';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

function sanitizePhone(input) {
  return String(input || '')
    .replace(/[^0-9]/g, '')
    .replace(/^82/, '0');
}

function formatPhone(input) {
  const digits = sanitizePhone(input);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

export default function PhoneEntryScreen({ navigation }) {
  const [phoneRaw, setPhoneRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const formatted = useMemo(() => formatPhone(phoneRaw), [phoneRaw]);
  const digits = useMemo(() => sanitizePhone(phoneRaw), [phoneRaw]);
  const codeDigits = useMemo(
    () => String(codeInput || '').replace(/\D/g, '').slice(0, 6),
    [codeInput],
  );
  const valid = digits.length >= 10 && digits.length <= 11;
  const canVerify =
    !verificationLoading && otpRequested && codeDigits.length >= 4;
  const { authenticateWithToken } = useAuth();
  
  useEffect(() => {
    setOtpRequested(false);
    setCodeInput('');
    setRequestId(null);
  }, [digits]);

  const completeVerification = async (response) => {
    const token = response?.token || response?.accessToken || response?.access_token;
    const needsProfile =
      response?.needsProfile ?? response?.isNewUser ?? !token;

    if (token) {
      const result = await authenticateWithToken(token, response?.user || null);
      if (!result.success) {
        throw new Error(result.error || '세션 생성 실패');
      }
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      return;
    }

    if (needsProfile) {
      const nextVerificationId =
        response?.verificationId || response?.sessionId || requestId;

      if (!nextVerificationId) {
        Alert.alert('오류', '인증 정보가 확인되지 않습니다. 다시 인증해 주세요.');
        return;
      }

      navigation.replace('Agreement', {
        phone: digits,
        formattedPhone: formatted,
        verificationId: nextVerificationId,
      });
      return;
    }

    Alert.alert('안내', '추가 정보가 필요합니다. 다시 시도해 주세요.');
  };

  const handleRequestOtp = async () => {
    if (!valid) {
      Alert.alert('안내', '휴대폰 번호를 정확히 입력해 주세요.');
      return;
    }
    if (loading) return;
    setLoading(true);
    setOtpRequested(true);
    setCodeInput('');
    try {
      const response = await apiClient.requestPhoneOtp({ phone: digits });
      const nextRequestId = response?.requestId || response?.id || response?.request_id;
      setRequestId(nextRequestId || requestId || null);
      Alert.alert('전송 완료', '인증번호를 전송했어요. 메시지를 확인해 주세요.');
    } catch (error) {
      Alert.alert('전송 실패', error?.message || '인증번호를 전송하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!valid) {
      Alert.alert('안내', '휴대폰 번호를 정확히 입력해 주세요.');
      return;
    }
    if (!otpRequested) {
      Alert.alert('안내', '먼저 인증번호를 전송해 주세요.');
      return;
    }
    if (codeDigits.length < 4) {
      Alert.alert('안내', '인증번호를 정확히 입력해 주세요.');
      return;
    }
    if (!requestId) {
      Alert.alert('안내', '인증번호 요청 정보가 확인되지 않아요. 다시 시도해 주세요.');
      return;
    }
    if (verificationLoading) return;

    setVerificationLoading(true);
    try {
      const response = await apiClient.verifyPhoneOtp({
        phone: digits,
        code: codeDigits,
        requestId,
      });
      await completeVerification(response);
    } catch (error) {
      Alert.alert(
        '인증 실패',
        error?.message || '인증번호가 올바르지 않아요. 다시 확인해 주세요.',
      );
    } finally {
      setVerificationLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          <Text style={styles.title}>휴대폰 번호로 로그인해요</Text>
          <Text style={styles.description}>
            인증번호를 전송할 수 있는 휴대폰 번호를 입력해 주세요.
          </Text>

          <View style={styles.inputCard}>
            <Text style={styles.label}>휴대폰 번호</Text>
            <TextInput
              style={styles.input}
              placeholder="010-1234-5678"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
              value={formatted}
              onChangeText={(next) => setPhoneRaw(next)}
              editable={!loading && !verificationLoading}
              returnKeyType="done"
              onSubmitEditing={handleRequestOtp}
            />
          </View>

          {otpRequested && (
            <View style={styles.codeCard}>
              <Text style={styles.label}>인증번호</Text>
              <TextInput
                style={styles.codeInput}
                keyboardType="number-pad"
                value={codeDigits}
                onChangeText={(next) => setCodeInput(String(next || '').replace(/\D/g, ''))}
                placeholder="000000"
                placeholderTextColor={colors.textTertiary}
                maxLength={6}
                editable={!verificationLoading}
                returnKeyType="done"
                onSubmitEditing={handleVerify}
              />
            </View>
          )}

          <View style={{ flex: 1 }} />

          <ButtonPrimary
            title={otpRequested ? '인증번호 다시 보내기' : '인증번호 보내기'}
            onPress={handleRequestOtp}
            disabled={!valid || loading || verificationLoading}
            loading={loading}
          />
          {otpRequested && (
            <ButtonPrimary
              style={styles.verifyButton}
              title="인증하기"
              onPress={handleVerify}
              disabled={!canVerify}
              loading={verificationLoading}
            />
          )}
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
    fontSize: 28,
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
  inputCard: {
    marginTop: 36,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderRadius: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeCard: {
    marginTop: 24,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
    gap: 12,
  },
  codeInput: {
    height: 56,
    borderRadius: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.primary,
    letterSpacing: 6,
  },
  hint: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  verifyButton: {
    marginTop: 16,
  },
});
