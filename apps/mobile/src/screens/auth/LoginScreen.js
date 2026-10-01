// apps/mobile/src/screens/auth/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import TestLoginButton from '../../components/TestLoginButton';
import colors from '../../theme/colors';

export default function LoginScreen({ navigation }) {
  const { login, signup, socialLogin } = useAuth();
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);

  // 소셜 로그인 핸들러 (관리자 키 연동 & 원터치 다이렉트 로그인)
  const handleSocialLogin = async (platform) => {
    const platformKey = platform.toLowerCase();
    setSocialLoading(platformKey);
    try {
      const mockToken = `token_${platformKey}_${Date.now()}`;
      const res = await socialLogin(platformKey, mockToken);
      if (!res.success) {
        Alert.alert('로그인 실패', res.error || `${platform} 로그인에 실패했습니다.`);
      }
    } catch (e) {
      Alert.alert('로그인 오류', e?.message || '처리 중 오류가 발생했습니다.');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleEmailSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('알림', '이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    setEmailLoading(true);
    try {
      if (isSignupMode) {
        if (!displayName.trim()) {
          Alert.alert('알림', '닉네임을 입력해 주세요.');
          setEmailLoading(false);
          return;
        }
        const res = await signup({
          email: trimmedEmail,
          password: trimmedPassword,
          displayName: displayName.trim(),
        });
        if (!res.success) {
          Alert.alert('회원가입 실패', res.error || '회원가입을 완료하지 못했습니다.');
          return;
        }
      } else {
        const res = await login(trimmedEmail, trimmedPassword);
        if (!res.success) {
          Alert.alert('로그인 실패', res.error || '이메일 또는 비밀번호가 일치하지 않습니다.');
          return;
        }
      }
      setEmailModalVisible(false);
    } catch (e) {
      Alert.alert('오류', e?.message || '처리 중 오류가 발생했습니다.');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 56px 표준 헤더 */}
      <View style={styles.appbar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>로그인 / 시작하기</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 상단 브랜드 헤더 영역 */}
        <View style={styles.headerSection}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>DAGAON</Text>
          </View>
          <Text style={styles.title}>
            새로운 인연이 다가오는 곳,{'\n'}
            <Text style={styles.titleHighlight}>다가온</Text>에 오신 것을 환영해요
          </Text>
          <Text style={styles.subtitle}>
            선호하시는 간편 로그인으로 빠르고 안전하게 시작하세요.
          </Text>
        </View>

        {/* 소셜 로그인 버튼 목록 (공식 가이드라인 규격) */}
        <View style={styles.socialButtonGroup}>
          {/* 1. 카카오 로그인 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.kakaoButton]}
            onPress={() => handleSocialLogin('카카오')}
            activeOpacity={0.88}
          >
            <View style={styles.socialIconWrap}>
              <Ionicons name="chatbubble" size={20} color="#191919" />
            </View>
            <Text style={styles.kakaoButtonText}>카카오로 시작하기</Text>
            <View style={{ width: 24 }} />
          </TouchableOpacity>

          {/* 2. 네이버 로그인 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.naverButton]}
            onPress={() => handleSocialLogin('네이버')}
            activeOpacity={0.88}
          >
            <View style={styles.socialIconWrap}>
              <Text style={styles.naverIconText}>N</Text>
            </View>
            <Text style={styles.naverButtonText}>네이버로 시작하기</Text>
            <View style={{ width: 24 }} />
          </TouchableOpacity>

          {/* 3. Apple 로그인 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.appleButton]}
            onPress={() => handleSocialLogin('Apple')}
            activeOpacity={0.88}
          >
            <View style={styles.socialIconWrap}>
              <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.appleButtonText}>Apple로 계속하기</Text>
            <View style={{ width: 24 }} />
          </TouchableOpacity>

          {/* 4. Google 로그인 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton]}
            onPress={() => handleSocialLogin('Google')}
            activeOpacity={0.88}
          >
            <View style={styles.socialIconWrap}>
              <Ionicons name="logo-google" size={20} color="#EA4335" />
            </View>
            <Text style={styles.googleButtonText}>Google로 계속하기</Text>
            <View style={{ width: 24 }} />
          </TouchableOpacity>

          {/* 5. 휴대폰 번호 간편 인증 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.phoneButton]}
            onPress={() => navigation.navigate('PhoneEntry')}
            activeOpacity={0.88}
          >
            <View style={styles.socialIconWrap}>
              <Ionicons name="call" size={19} color="#2563EB" />
            </View>
            <Text style={styles.phoneButtonText}>휴대폰 번호로 시작하기</Text>
            <View style={{ width: 24 }} />
          </TouchableOpacity>
        </View>

        {/* 구분선 */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* 이메일 로그인 / 회원가입 */}
        <TouchableOpacity
          style={styles.emailButton}
          onPress={() => {
            setIsSignupMode(false);
            setEmailModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="mail-outline" size={18} color="#4B5563" />
          <Text style={styles.emailButtonText}>이메일로 로그인 및 회원가입</Text>
        </TouchableOpacity>

        {/* 🧪 [개발/테스트 전용] 테스트 간편 로그인 버튼 */}
        <View style={styles.testSection}>
          <TestLoginButton />
        </View>

        {/* 하단 약관 고지 */}
        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            로그인 시 다가온의{' '}
            <Text
              style={styles.footerNoteLink}
              onPress={() => navigation.navigate('Agreement')}
            >
              이용약관
            </Text>{' '}
            및{' '}
            <Text
              style={styles.footerNoteLink}
              onPress={() => navigation.navigate('Agreement')}
            >
              개인정보처리방침
            </Text>
            에 동의하게 됩니다.
          </Text>
        </View>
      </ScrollView>

      {/* 이메일 로그인 / 가입 모달 */}
      <Modal
        visible={emailModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isSignupMode ? '이메일 간편 회원가입' : '이메일 로그인'}
              </Text>
              <TouchableOpacity
                onPress={() => setEmailModalVisible(false)}
                hitSlop={8}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {isSignupMode && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>닉네임</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="사용하실 닉네임을 입력하세요"
                  placeholderTextColor="#9CA3AF"
                  value={displayName}
                  onChangeText={setDisplayName}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>이메일 주소</Text>
              <TextInput
                style={styles.textInput}
                placeholder="example@dagaon.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>비밀번호</Text>
              <TextInput
                style={styles.textInput}
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={handleEmailSubmit}
              disabled={emailLoading}
            >
              {emailLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSubmitText}>
                  {isSignupMode ? '가입 완료하기' : '로그인'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeSwitchBtn}
              onPress={() => setIsSignupMode((prev) => !prev)}
            >
              <Text style={styles.modeSwitchText}>
                {isSignupMode
                  ? '이미 계정이 있으신가요? 로그인'
                  : '아직 회원이 아니신가요? 회원가입'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  appbar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appbarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 28,
  },
  logoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  logoBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#D97706',
    letterSpacing: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  titleHighlight: {
    color: '#D97706',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  socialButtonGroup: {
    gap: 12,
  },
  socialButton: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  socialIconWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 카카오 스타일 (#FEE500 / #191919)
  kakaoButton: {
    backgroundColor: '#FEE500',
  },
  kakaoButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191919',
    letterSpacing: -0.3,
  },
  // 네이버 스타일 (#03C75A / #FFFFFF)
  naverButton: {
    backgroundColor: '#03C75A',
  },
  naverIconText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  naverButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  // 애플 스타일 (#000000 / #FFFFFF)
  appleButton: {
    backgroundColor: '#000000',
  },
  appleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  // 구글 스타일 (#FFFFFF / 테두리 / #1F2937)
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  // 휴대폰 번호 간편 인증 (#F8FAFC / 테두리 / #2563EB)
  phoneButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  phoneButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  dividerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  emailButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  testSection: {
    marginTop: 18,
  },
  footerNote: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerNoteText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerNoteLink: {
    color: '#6B7280',
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  // 모달 스타일
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  modalSubmitButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modeSwitchBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 4,
  },
  modeSwitchText: {
    fontSize: 13,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
});
