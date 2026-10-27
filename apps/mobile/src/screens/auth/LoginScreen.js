// apps/mobile/src/screens/auth/LoginScreen.js
import React, { useState, useEffect } from 'react';
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
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { tokens } from '../../theme/tokens';
import { useAuth } from '../../context/AuthContext';
import TestLoginButton from '../../components/TestLoginButton';

export default function LoginScreen({ navigation }) {
  const { login, signup, socialLogin } = useAuth();
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);

  // Dynamic Keyboard Height Tracking to avoid obscuring inputs
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // 로그인 성공 후처리
  const onLoginSuccess = async () => {
    try {
      await AsyncStorage.multiSet([
        ['@mocco_onboarded', 'true'],
        ['@dagaon_onboarded', 'true'],
      ]);
    } catch (e) {
      console.warn('Failed to save onboarded state:', e);
    }
  };

  // 소셜 로그인 핸들러 (카카오, 네이버, 애플, 구글)
  const handleSocialLogin = async (platform) => {
    const platformKey = platform.toLowerCase();
    setSocialLoading(platformKey);
    try {
      const mockToken = `token_${platformKey}_${Date.now()}`;
      const res = await socialLogin(platformKey, mockToken);
      if (res.success) {
        await onLoginSuccess();
      } else {
        Alert.alert('로그인 실패', res.error || `${platform} 로그인에 실패했습니다.`);
      }
    } catch (e) {
      Alert.alert('로그인 오류', e?.message || '처리 중 오류가 발생했습니다.');
    } finally {
      setSocialLoading(null);
    }
  };

  // 이메일 로그인 / 회원가입 핸들러
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
        await onLoginSuccess();
      } else {
        const res = await login(trimmedEmail, trimmedPassword);
        if (!res.success) {
          Alert.alert('로그인 실패', res.error || '이메일 또는 비밀번호가 일치하지 않습니다.');
          return;
        }
        await onLoginSuccess();
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

      {/* 상단 56px 헤더 */}
      <View style={styles.appbar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Onboarding');
            }
          }}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={tokens.colors.textPrimary} />
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
            <Text style={styles.logoBadgeText}>MOCCO</Text>
          </View>
          <Text style={styles.title}>
            우리 동네 매일매일 열리는 잔치,{'\n'}
            <Text style={styles.titleHighlight}>모꼬</Text>에 오신 것을 환영해요
          </Text>
          <Text style={styles.subtitle}>
            선호하시는 간편 로그인으로 빠르고 안전하게 시작하세요.
          </Text>
        </View>

        {/* 소셜 로그인 버튼 목록 (16px 라운딩 통일 규격) */}
        <View style={styles.socialButtonGroup}>
          {/* 1. 카카오 로그인 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.kakaoButton]}
            onPress={() => handleSocialLogin('카카오')}
            disabled={socialLoading !== null}
            activeOpacity={0.88}
          >
            <View style={styles.socialIconWrap}>
              <Ionicons name="chatbubble" size={20} color="#191919" />
            </View>
            <Text style={styles.kakaoButtonText}>카카오로 시작하기</Text>
            <View style={{ width: 24 }}>
              {socialLoading === '카카오' && (
                <ActivityIndicator size="small" color="#191919" />
              )}
            </View>
          </TouchableOpacity>

          {/* 2. 네이버 로그인 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.naverButton]}
            onPress={() => handleSocialLogin('네이버')}
            disabled={socialLoading !== null}
            activeOpacity={0.88}
          >
            <View style={styles.socialIconWrap}>
              <Text style={styles.naverIconText}>N</Text>
            </View>
            <Text style={styles.naverButtonText}>네이버로 시작하기</Text>
            <View style={{ width: 24 }}>
              {socialLoading === '네이버' && (
                <ActivityIndicator size="small" color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>

          {/* 3. Apple 로그인 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.appleButton]}
            onPress={() => handleSocialLogin('Apple')}
            disabled={socialLoading !== null}
            activeOpacity={0.88}
          >
            <View style={styles.socialIconWrap}>
              <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.appleButtonText}>Apple로 계속하기</Text>
            <View style={{ width: 24 }}>
              {socialLoading === 'apple' && (
                <ActivityIndicator size="small" color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>

          {/* 4. Google 로그인 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton]}
            onPress={() => handleSocialLogin('Google')}
            disabled={socialLoading !== null}
            activeOpacity={0.88}
          >
            <View style={styles.socialIconWrap}>
              <Ionicons name="logo-google" size={20} color="#EA4335" />
            </View>
            <Text style={styles.googleButtonText}>Google로 계속하기</Text>
            <View style={{ width: 24 }}>
              {socialLoading === 'google' && (
                <ActivityIndicator size="small" color="#EA4335" />
              )}
            </View>
          </TouchableOpacity>

          {/* 5. 휴대폰 번호 간편 인증 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.phoneButton]}
            onPress={() => navigation.navigate('PhoneEntry')}
            activeOpacity={0.88}
          >
            <View style={styles.socialIconWrap}>
              <Ionicons name="call" size={19} color={tokens.colors.primary} />
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
          <Ionicons name="mail-outline" size={18} color={tokens.colors.textSecondary} />
          <Text style={styles.emailButtonText}>이메일로 로그인 및 회원가입</Text>
        </TouchableOpacity>

        {/* 🧪 [개발/테스트 전용] 테스트 간편 로그인 버튼 정상 유지 */}
        <View style={styles.testSection}>
          <TestLoginButton onLoginSuccess={onLoginSuccess} />
        </View>

        {/* 하단 약관 고지 */}
        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            로그인 시 모꼬의{' '}
            <Text
              style={styles.footerNoteLink}
              onPress={() => navigation.navigate('Agreement')}
            >
              이용약관
            </Text>
            {' 및 '}
            <Text
              style={styles.footerNoteLink}
              onPress={() => navigation.navigate('Agreement')}
            >
              개인정보처리방침
            </Text>
            에 동의하는 것으로 간주됩니다.
          </Text>
        </View>
      </ScrollView>

      {/* 이메일 로그인 / 회원가입 모달 (토큰 규격 라운딩 16px 및 소프트 보더) */}
      <Modal
        visible={emailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalSheet,
                  keyboardHeight > 0 && { paddingBottom: keyboardHeight + 16 },
                ]}
              >
                {/* 상단 닫기 바 */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {isSignupMode ? '이메일 간편 회원가입' : '이메일 로그인'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setEmailModalVisible(false)}
                    hitSlop={8}
                    style={styles.modalCloseBtn}
                  >
                    <Ionicons name="close" size={22} color={tokens.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.modalBody}
                >
                  {isSignupMode && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>닉네임</Text>
                      <TextInput
                        style={styles.inputField}
                        placeholder="활동에 사용할 닉네임을 입력하세요"
                        placeholderTextColor={tokens.colors.textTertiary}
                        value={displayName}
                        onChangeText={setDisplayName}
                        autoCapitalize="none"
                      />
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>이메일 주소</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="example@dagaon.app"
                      placeholderTextColor={tokens.colors.textTertiary}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>비밀번호</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="비밀번호 (6자 이상)"
                      placeholderTextColor={tokens.colors.textTertiary}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleEmailSubmit}
                    disabled={emailLoading}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={tokens.colors.gradients.primaryPink || ['#FF3B6B', '#FF758C']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitButtonGrad}
                    >
                      {emailLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.submitButtonText}>
                          {isSignupMode ? '회원가입 완료하기' : '로그인하기'}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modeSwitchBtn}
                    onPress={() => setIsSignupMode((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modeSwitchText}>
                      {isSignupMode
                        ? '이미 계정이 있으신가요? 로그인'
                        : '아직 회원이 아니신가요? 회원가입'}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
    borderBottomColor: tokens.colors.borderLight,
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
    color: tokens.colors.textPrimary,
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
    marginBottom: 26,
  },
  logoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF1F4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  logoBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: tokens.colors.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: tokens.colors.textPrimary,
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  titleHighlight: {
    color: tokens.colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: tokens.colors.textSecondary,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  socialButtonGroup: {
    gap: 12,
  },
  socialButton: {
    height: 54,
    borderRadius: tokens.radii.card, // 16px 라운딩 통일
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    ...tokens.shadows.card,
  },
  socialIconWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
  },
  kakaoButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191919',
  },
  naverButton: {
    backgroundColor: '#03C75A',
  },
  naverIconText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  naverButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  appleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: tokens.colors.borderMedium,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  phoneButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: tokens.colors.borderMedium,
  },
  phoneButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: tokens.colors.borderLight,
  },
  dividerText: {
    fontSize: 12,
    color: tokens.colors.textTertiary,
  },
  emailButton: {
    height: 50,
    borderRadius: tokens.radii.card,
    borderWidth: 1,
    borderColor: tokens.colors.borderMedium,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emailButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.textSecondary,
  },
  testSection: {
    marginTop: 18,
  },
  footerNote: {
    marginTop: 28,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  footerNoteText: {
    fontSize: 12,
    color: tokens.colors.textTertiary,
    lineHeight: 18,
    textAlign: 'center',
  },
  footerNoteLink: {
    color: tokens.colors.primary,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  // 모달 폼
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: tokens.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: tokens.colors.borderLight,
    ...tokens.shadows.float,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  inputField: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.borderMedium,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    fontSize: 14,
    color: tokens.colors.textPrimary,
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    ...tokens.shadows.card,
  },
  submitButtonGrad: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modeSwitchBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modeSwitchText: {
    fontSize: 13,
    color: tokens.colors.textSecondary,
    fontWeight: '600',
  },
});
