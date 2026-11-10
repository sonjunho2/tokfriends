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
import { apiClient } from '../../api/client';
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

  // 📝 회원가입 표준 약관 동의 상태
  const [agreements, setAgreements] = useState({
    age14: true,
    tos: true,
    privacy: true,
    location: false,
    marketing: false,
  });

  const isAllAgreed =
    agreements.age14 &&
    agreements.tos &&
    agreements.privacy &&
    agreements.location &&
    agreements.marketing;

  const toggleAllAgreements = () => {
    const nextVal = !isAllAgreed;
    setAgreements({
      age14: nextVal,
      tos: nextVal,
      privacy: nextVal,
      location: nextVal,
      marketing: nextVal,
    });
  };

  const toggleAgreement = (key) => {
    setAgreements((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 약관 세부 내용 팝업 모달 상태
  const [termModalVisible, setTermModalVisible] = useState(false);
  const [termModalTitle, setTermModalTitle] = useState('');
  const [termModalContent, setTermModalContent] = useState('');
  const [termModalLoading, setTermModalLoading] = useState(false);

  const viewTermDetail = async (slug, title) => {
    setTermModalTitle(title);
    setTermModalVisible(true);
    setTermModalLoading(true);
    setTermModalContent('');
    try {
      const res = await apiClient.getLegalDocument(slug);
      const text =
        res?.content ||
        res?.body ||
        res?.text ||
        res?.data?.content ||
        '';
      if (text) {
        setTermModalContent(text);
      } else {
        throw new Error('Fallback needed');
      }
    } catch {
      if (slug === 'terms-of-service') {
        setTermModalContent(
          '제1조 (목적)\n본 약관은 모꼬(MOCCO)가 제공하는 동네 라이브 방송, 커머스 및 이웃 소통 서비스의 이용조건 및 절차, 권리와 의무를 규정함을 목적으로 합니다.\n\n제2조 (이용자의 의무)\n이용자는 건전하고 따뜻한 이웃 공동체 조성을 위해 상호 배려하며 법령 및 본 약관을 준수해야 합니다.\n\n제3조 (서비스의 제공 및 변경)\n모꼬는 실시간 라이브 스트리밍, 이웃 간 안심 직거래, 채팅 및 3D 후원 선물 서비스를 연중무휴 제공합니다.'
        );
      } else if (slug === 'privacy-policy') {
        setTermModalContent(
          '1. 수집하는 개인정보 항목\n- 필수: 이메일 주소, 비밀번호, 닉네임\n- 서비스 이용 과정에서 자동 생성: 기기정보, 접속 로그, 서비스 이용 기록\n\n2. 개인정보의 수집 및 이용목적\n- 회원 가입 의사 확인 및 본인 식별\n- 실시간 방송, 채팅 및 모꼬몰 안전거래 서비스 제공\n- 불법 이용 방지 및 분쟁 조정을 위한 기록 보존\n\n3. 개인정보의 보유 및 이용기간\n- 회원 탈퇴 시까지 (관계 법령에 의한 보존 필요 시 해당 기간 동안 안전하게 보관)'
        );
      } else if (slug === 'location-based-service') {
        setTermModalContent(
          '제1조 (위치기반 서비스)\n모꼬는 이용자의 현재 위치를 기반으로 인근 이웃의 라이브 방송 추천, 우리 동네 핫딜 상품 매칭 및 안전 직거래 서비스를 제공합니다.\n\n제2조 (위치정보의 이용 및 보관)\n회사는 서비스 제공을 위해 필요한 최소한의 위치정보만을 일시적으로 활용하며, 목적 달성 시 즉시 파기합니다.'
        );
      }
    } finally {
      setTermModalLoading(false);
    }
  };

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
        ['@mocco_permission_guided', 'true'],
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
        if (!agreements.age14 || !agreements.tos || !agreements.privacy) {
          Alert.alert(
            '약관 동의 필요',
            '모꼬 서비스 가입을 위해 필수 약관([필수] 만 14세 이상, 서비스 이용약관, 개인정보 수집 및 이용)에 모두 동의해 주세요.'
          );
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
                <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: '#FFF0F5',
                      borderColor: '#FF3B6B',
                      borderWidth: 1,
                      borderRadius: 10,
                      paddingVertical: 8,
                      paddingHorizontal: 6,
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      setEmail('test01@te.te');
                      setPassword('12345678');
                      setIsSignupMode(false);
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#FF3B6B' }}>👑 테스터01 (방송용)</Text>
                    <Text style={{ fontSize: 9, color: '#888', marginTop: 2 }}>test01 / 12345678</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: '#F0F9FF',
                      borderColor: '#0284C7',
                      borderWidth: 1,
                      borderRadius: 10,
                      paddingVertical: 8,
                      paddingHorizontal: 6,
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      setEmail('test02@te.te');
                      setPassword('12345678');
                      setIsSignupMode(false);
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#0284C7' }}>🎁 테스터02 (시청용)</Text>
                    <Text style={{ fontSize: 9, color: '#888', marginTop: 2 }}>test02 / 12345678</Text>
                  </TouchableOpacity>
                </View>
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
                      placeholder="example@mocco.app"
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

                  {/* 📜 [가입 시 표준 약관 동의 체크리스트] */}
                  {isSignupMode && (
                    <View style={styles.termsAgreementBox}>
                      {/* 전체 동의 버튼 */}
                      <TouchableOpacity
                        style={styles.allAgreeRow}
                        onPress={toggleAllAgreements}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.checkboxCircle, isAllAgreed && styles.checkboxCircleActive]}>
                          {isAllAgreed && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                        </View>
                        <Text style={styles.allAgreeText}>모꼬 약관 전체 동의하기</Text>
                      </TouchableOpacity>

                      <View style={styles.termsDivider} />

                      {/* 필수 1: 만 14세 이상 */}
                      <TouchableOpacity
                        style={styles.termRow}
                        onPress={() => toggleAgreement('age14')}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.termCheckbox, agreements.age14 && styles.termCheckboxActive]}>
                          {agreements.age14 && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                        </View>
                        <Text style={styles.termText}>
                          <Text style={styles.requiredTag}>[필수]</Text> 만 14세 이상입니다
                        </Text>
                      </TouchableOpacity>

                      {/* 필수 2: 서비스 이용약관 */}
                      <View style={styles.termRowWithLink}>
                        <TouchableOpacity
                          style={styles.termRowLeft}
                          onPress={() => toggleAgreement('tos')}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.termCheckbox, agreements.tos && styles.termCheckboxActive]}>
                            {agreements.tos && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                          </View>
                          <Text style={styles.termText}>
                            <Text style={styles.requiredTag}>[필수]</Text> 모꼬 서비스 이용약관 동의
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => viewTermDetail('terms-of-service', '모꼬 서비스 이용약관')}>
                          <Text style={styles.termDetailLink}>보기</Text>
                        </TouchableOpacity>
                      </View>

                      {/* 필수 3: 개인정보 수집 및 이용 동의 */}
                      <View style={styles.termRowWithLink}>
                        <TouchableOpacity
                          style={styles.termRowLeft}
                          onPress={() => toggleAgreement('privacy')}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.termCheckbox, agreements.privacy && styles.termCheckboxActive]}>
                            {agreements.privacy && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                          </View>
                          <Text style={styles.termText}>
                            <Text style={styles.requiredTag}>[필수]</Text> 개인정보 수집 및 이용 동의
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => viewTermDetail('privacy-policy', '개인정보 수집 및 이용 동의')}>
                          <Text style={styles.termDetailLink}>보기</Text>
                        </TouchableOpacity>
                      </View>

                      {/* 선택 4: 위치기반 서비스 이용약관 */}
                      <View style={styles.termRowWithLink}>
                        <TouchableOpacity
                          style={styles.termRowLeft}
                          onPress={() => toggleAgreement('location')}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.termCheckbox, agreements.location && styles.termCheckboxActive]}>
                            {agreements.location && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                          </View>
                          <Text style={styles.termText}>
                            <Text style={styles.optionalTag}>[선택]</Text> 위치기반 서비스 이용약관 동의
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => viewTermDetail('location-based-service', '위치기반 서비스 이용약관')}>
                          <Text style={styles.termDetailLink}>보기</Text>
                        </TouchableOpacity>
                      </View>

                      {/* 선택 5: 마케팅 정보 수신 및 혜택 알림 동의 */}
                      <TouchableOpacity
                        style={styles.termRow}
                        onPress={() => toggleAgreement('marketing')}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.termCheckbox, agreements.marketing && styles.termCheckboxActive]}>
                          {agreements.marketing && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                        </View>
                        <Text style={styles.termText}>
                          <Text style={styles.optionalTag}>[선택]</Text> 마케팅 정보 및 혜택 알림 동의
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

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

      {/* 📄 약관 세부 내용 뷰어 모달 */}
      <Modal
        visible={termModalVisible}
        animationType="slide"
        onRequestClose={() => setTermModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'bottom', 'left', 'right']}>
          <View style={{
            height: 54,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 18,
            borderBottomWidth: 1,
            borderBottomColor: '#F1F5F9'
          }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>{termModalTitle}</Text>
            <TouchableOpacity onPress={() => setTermModalVisible(false)} hitSlop={8}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          {termModalLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color="#FF3B6B" />
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text style={{ fontSize: 14, color: '#334155', lineHeight: 22 }}>
                {termModalContent}
              </Text>
            </ScrollView>
          )}
        </SafeAreaView>
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
  termsAgreementBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  allAgreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  checkboxCircleActive: {
    backgroundColor: '#FF3B6B',
    borderColor: '#FF3B6B',
  },
  allAgreeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  termsDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  termRowWithLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  termRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  termCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  termCheckboxActive: {
    backgroundColor: '#FF3B6B',
    borderColor: '#FF3B6B',
  },
  termText: {
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '500',
  },
  requiredTag: {
    color: '#FF3B6B',
    fontWeight: '700',
  },
  optionalTag: {
    color: '#64748B',
    fontWeight: '600',
  },
  termDetailLink: {
    fontSize: 11.5,
    color: '#64748B',
    textDecorationLine: 'underline',
    paddingHorizontal: 4,
  },
  termsAgreementBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  allAgreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  checkboxCircleActive: {
    backgroundColor: '#FF3B6B',
    borderColor: '#FF3B6B',
  },
  allAgreeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  termsDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  termRowWithLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  termRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  termCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  termCheckboxActive: {
    backgroundColor: '#FF3B6B',
    borderColor: '#FF3B6B',
  },
  termText: {
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '500',
  },
  requiredTag: {
    color: '#FF3B6B',
    fontWeight: '700',
  },
  optionalTag: {
    color: '#64748B',
    fontWeight: '600',
  },
  termDetailLink: {
    fontSize: 11.5,
    color: '#64748B',
    textDecorationLine: 'underline',
    paddingHorizontal: 4,
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
