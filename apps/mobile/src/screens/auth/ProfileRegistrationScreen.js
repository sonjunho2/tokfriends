// src/screens/auth/ProfileRegistrationScreen.js
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { USE_DUMMY_AUTH } from '../../config/env';

const GENDER_OPTIONS = [
  { key: 'female', label: '여성', icon: 'female' },
  { key: 'male', label: '남성', icon: 'male' },
];

const PRESET_INTERESTS = [
  '음악', '영화', '독서', '카페', '맛집', '여행', '운동',
  '게임', '요리', '등산', '사진', '반려동물', '패션', '미술',
  '드라이브', '재테크',
];

const KOREA_REGIONS = [
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '강원특별자치도',
  '충청북도',
  '충청남도',
  '전북특별자치도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주특별자치도',
];

export default function ProfileRegistrationScreen({ navigation, route }) {
  const { authenticateWithToken, setUser } = useAuth();
  const { phone, verificationId: initialVerificationId } = route.params || {};

  const [nickname, setNickname] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [region1, setRegion1] = useState('');
  const [region2, setRegion2] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [imageAsset, setImageAsset] = useState(null);
  const [interests, setInterests] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // 닉네임 중복 확인 상태: 'initial' | 'checking' | 'available' | 'unavailable' | 'modified'
  const [nicknameCheckStatus, setNicknameCheckStatus] = useState('initial');
  const [nicknameMessage, setNicknameMessage] = useState('닉네임 중복 확인이 필요합니다.');
  const [checkingNickname, setCheckingNickname] = useState(false);

  // 시/도 선택 모달 상태
  const [regionModalVisible, setRegionModalVisible] = useState(false);

  // 출생연도 유효성 (1920 ~ 올해)
  const birthYearValid = useMemo(() => {
    const numeric = parseInt(birthYear, 10);
    const current = new Date().getFullYear();
    return numeric >= current - 100 && numeric <= current;
  }, [birthYear]);

  // 가입 버튼 활성화 조건
  const canSubmit =
    nickname.trim().length >= 2 &&
    birthYearValid &&
    Boolean(gender) &&
    headline.trim().length >= 2 &&
    bio.trim().length >= 5 &&
    !submitting;

  // 닉네임 변경 시 상태 리셋
  const handleNicknameChange = (text) => {
    setNickname(text);
    setNicknameCheckStatus('modified');
    setNicknameMessage('닉네임 변경 시 중복 확인이 필요합니다.');
  };

  // 닉네임 중복 확인 실행
  const handleCheckNickname = async (overrideText) => {
    const target = (typeof overrideText === 'string' ? overrideText : nickname).trim();
    if (!target) {
      Alert.alert('알림', '확인할 닉네임을 입력해 주세요.');
      return false;
    }

    setCheckingNickname(true);
    try {
      const res = await apiClient.checkNickname(target);
      if (res?.available) {
        setNicknameCheckStatus('available');
        setNicknameMessage(res.message || '✓ 사용 가능한 닉네임입니다.');
        return true;
      } else {
        setNicknameCheckStatus('unavailable');
        setNicknameMessage(res.reason || '✕ 이미 사용 중이거나 사용할 수 없는 닉네임입니다.');
        return false;
      }
    } catch (err) {
      setNicknameCheckStatus('unavailable');
      setNicknameMessage(err?.message || '닉네임 확인 중 오류가 발생했습니다.');
      return false;
    } finally {
      setCheckingNickname(false);
    }
  };

  // 관심사 태그 토글
  const handleToggleInterest = (tag) => {
    if (interests.includes(tag)) {
      setInterests((prev) => prev.filter((t) => t !== tag));
    } else {
      if (interests.length >= 10) {
        Alert.alert('관심사 안내', '관심사는 최대 10개까지 선택할 수 있습니다.');
        return;
      }
      setInterests((prev) => [...prev, tag]);
    }
  };

  // 사진 선택
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요합니다.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setImageAsset(res.assets[0]);
        setImageUri(res.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('오류', '사진을 선택하지 못했습니다. 다시 시도해 주세요.');
    }
  };

  // 가입 제출
  const handleSubmit = async () => {
    let verificationId = initialVerificationId;

    if (USE_DUMMY_AUTH && !verificationId) {
      verificationId = 'dummy-verification';
    }

    if (!verificationId) {
      Alert.alert('오류', '인증 정보가 만료되었습니다. 처음부터 다시 진행해 주세요.');
      return;
    }

    if (!canSubmit) {
      Alert.alert('안내', '필수 정보를 모두 올바르게 입력해 주세요.');
      return;
    }

    const trimmedNickname = nickname.trim();

    // 닉네임 중복 확인 미완료 시 선제 검증
    if (nicknameCheckStatus !== 'available') {
      const isAvailable = await handleCheckNickname(trimmedNickname);
      if (!isAvailable) {
        Alert.alert('닉네임 확인', nicknameMessage || '사용 가능한 닉네임을 입력해 주세요.');
        return;
      }
    }

    setSubmitting(true);
    try {
      // 사진이 선택된 경우 먼저 업로드 시도
      let uploadedAvatarUrl = null;
      if (!USE_DUMMY_AUTH && imageAsset) {
        try {
          const uploadedAvatar = await apiClient.uploadAvatar(imageAsset);
          uploadedAvatarUrl = String(uploadedAvatar?.url || '').trim() || null;
        } catch {
          // 사진 업로드 실패 시에도 기본 가입은 계속 진행
        }
      }

      const fullRegion = [region1.trim(), region2.trim()].filter(Boolean).join(' ');

      const payload = {
        verificationId,
        phone,
        nickname: trimmedNickname,
        birthYear: parseInt(birthYear, 10),
        gender,
        region: fullRegion || null,
        headline: headline.trim(),
        bio: bio.trim(),
        interests,
        ...(uploadedAvatarUrl ? { avatarUri: uploadedAvatarUrl } : {}),
      };

      const response = await apiClient.completePhoneSignup(payload);
      const token =
        response?.token || response?.accessToken || response?.access_token;
      if (!token) {
        Alert.alert(
          '가입 실패',
          response?.error?.message ||
            '서버에서 인증 토큰을 수신하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        );
        return;
      }

      const authResult = await authenticateWithToken(token);
      if (!authResult.success) {
        Alert.alert('로그인 실패', authResult.error || '세션을 수립하지 못했습니다.');
        return;
      }

      // 만약 가입 시 사진이 업로드되지 못했으나 로컬에 이미지가 남아있는 경우 후속 업데이트 보완
      if (!USE_DUMMY_AUTH && imageAsset && !uploadedAvatarUrl) {
        try {
          const uploaded = await apiClient.uploadAvatar(imageAsset);
          const nextUrl = String(uploaded?.url || '').trim();
          const userId = authResult?.user?.id || response?.user?.id;
          if (nextUrl && userId) {
            await apiClient.updateUser(userId, { avatarUri: nextUrl });
            const canonicalMe = await apiClient.getMe();
            await setUser(canonicalMe);
          }
        } catch {}
      }

      // 성공 시 자동으로 메인 대시보드로 이동 (AuthContext 상태 변경)
    } catch (error) {
      Alert.alert(
        '가입 실패',
        error?.message || '회원가입 처리 중 문제가 발생했습니다.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const nicknameColor = useMemo(() => {
    switch (nicknameCheckStatus) {
      case 'available':
        return '#10B981';
      case 'unavailable':
        return '#EF4444';
      default:
        return '#F59E0B';
    }
  }, [nicknameCheckStatus]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#191919" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 등록</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>2 / 2 단계</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.welcomeTitle}>다가온에서 사용할{'\n'}프로필을 완성해 주세요 ✨</Text>
          <Text style={styles.welcomeSub}>이웃과 첫인사를 나눌 멋진 프로필을 등록하세요.</Text>

          {/* 아바타 사진 등록 */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={handlePickImage}
              activeOpacity={0.85}
              disabled={submitting}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={46} color="#A1A1AA" />
                </View>
              )}
              <View style={styles.avatarCameraBadge}>
                <Ionicons name="camera" size={17} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePickImage} disabled={submitting}>
              <Text style={styles.avatarHint}>
                {imageUri ? '사진 변경하기' : '프로필 사진 등록 (선택)'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 메인 폼 카드 */}
          <View style={styles.formCard}>
            {/* 1. 닉네임 입력 & 중복 확인 */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>
                닉네임 <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.nicknameRow}>
                <TextInput
                  style={[styles.input, styles.nicknameInput]}
                  placeholder="2~12자 닉네임을 입력하세요"
                  placeholderTextColor="#A1A1AA"
                  value={nickname}
                  onChangeText={handleNicknameChange}
                  maxLength={12}
                  autoCapitalize="none"
                  editable={!submitting}
                />
                <TouchableOpacity
                  style={[
                    styles.checkButton,
                    (checkingNickname || !nickname.trim()) && styles.checkButtonDisabled,
                  ]}
                  onPress={() => handleCheckNickname()}
                  disabled={checkingNickname || !nickname.trim()}
                  activeOpacity={0.8}
                >
                  {checkingNickname ? (
                    <ActivityIndicator size="small" color="#191919" />
                  ) : (
                    <Text style={styles.checkButtonText}>중복확인</Text>
                  )}
                </TouchableOpacity>
              </View>
              {nicknameMessage ? (
                <View style={styles.feedbackRow}>
                  <Ionicons
                    name={
                      nicknameCheckStatus === 'available'
                        ? 'checkmark-circle'
                        : nicknameCheckStatus === 'unavailable'
                        ? 'alert-circle'
                        : 'information-circle'
                    }
                    size={14}
                    color={nicknameColor}
                  />
                  <Text style={[styles.feedbackText, { color: nicknameColor }]}>
                    {nicknameMessage}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* 2. 출생연도 & 성별 선택 */}
            <View style={styles.row}>
              {/* 출생연도 */}
              <View style={[styles.fieldBlock, { flex: 1 }]}>
                <Text style={styles.label}>
                  출생연도 <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="예) 1998"
                  placeholderTextColor="#A1A1AA"
                  value={birthYear}
                  onChangeText={setBirthYear}
                  keyboardType="number-pad"
                  maxLength={4}
                  editable={!submitting}
                />
                {!birthYearValid && birthYear.length === 4 ? (
                  <Text style={styles.errorSubText}>올바른 연도를 입력해 주세요.</Text>
                ) : null}
              </View>

              {/* 성별 선택 */}
              <View style={[styles.fieldBlock, { flex: 1 }]}>
                <Text style={styles.label}>
                  성별 <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <View style={styles.genderRow}>
                  {GENDER_OPTIONS.map((opt) => {
                    const active = gender === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        style={[styles.genderCard, active && styles.genderCardActive]}
                        onPress={() => setGender(opt.key)}
                        disabled={submitting}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={opt.icon}
                          size={16}
                          color={active ? '#191919' : '#71717A'}
                        />
                        <Text style={[styles.genderText, active && styles.genderTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* 3. 활동 지역 선택 (시/도 + 시/군/구) */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>활동 지역 (선택)</Text>
              <View style={styles.regionRow}>
                <TouchableOpacity
                  style={styles.regionPickerBtn}
                  onPress={() => !submitting && setRegionModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.regionPickerText, !region1 && styles.placeholderText]}>
                    {region1 || '시/도 선택'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#71717A" />
                </TouchableOpacity>

                <TextInput
                  style={[styles.input, styles.region2Input]}
                  placeholder="시/군/구 (예: 강남구)"
                  placeholderTextColor="#A1A1AA"
                  value={region2}
                  onChangeText={setRegion2}
                  maxLength={20}
                  editable={!submitting}
                />
              </View>
            </View>

            {/* 4. 온보딩 관심사 선택 */}
            <View style={styles.fieldBlock}>
              <View style={styles.labelBetweenRow}>
                <Text style={styles.label}>관심사 선택 ({interests.length}/10)</Text>
                <Text style={styles.subInfoText}>관심사로 이웃을 찾아요</Text>
              </View>

              <View style={styles.interestChipContainer}>
                {PRESET_INTERESTS.map((tag) => {
                  const isSelected = interests.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.interestChip, isSelected && styles.interestChipActive]}
                      onPress={() => handleToggleInterest(tag)}
                      disabled={submitting}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.interestChipText,
                          isSelected && styles.interestChipTextActive,
                        ]}
                      >
                        {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 5. 한줄 소개 */}
            <View style={styles.fieldBlock}>
              <View style={styles.labelBetweenRow}>
                <Text style={styles.label}>
                  한 줄 소개 <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <Text style={styles.counterText}>{headline.length}/40</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="예) 커피 한잔 마시며 이야기 나눠요!"
                placeholderTextColor="#A1A1AA"
                value={headline}
                onChangeText={setHeadline}
                maxLength={40}
                editable={!submitting}
              />
            </View>

            {/* 6. 자기소개 (다줄 입력) */}
            <View style={styles.fieldBlock}>
              <View style={styles.labelBetweenRow}>
                <Text style={styles.label}>
                  자기소개 <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <Text style={styles.counterText}>{bio.length}/300</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="어떤 사람인지, 좋아하는 취미나 취향을 자유롭게 적어보세요."
                placeholderTextColor="#A1A1AA"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={300}
                editable={!submitting}
              />
            </View>
          </View>

          {/* 가입 완료 버튼 */}
          <TouchableOpacity
            style={[styles.submitButton, (!canSubmit || submitting) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#191919" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>다가온 시작하기 ✨</Text>
                <Ionicons name="arrow-forward" size={18} color="#191919" />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 대한민국 17개 시/도 선택 모달 */}
      <Modal
        visible={regionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRegionModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRegionModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>활동 시/도 선택</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setRegionModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#191919" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {KOREA_REGIONS.map((option) => {
                const isSelected = region1 === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.modalItem, isSelected && styles.modalItemActive]}
                    onPress={() => {
                      setRegion1(option);
                      setRegionModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
                      {option}
                    </Text>
                    {isSelected ? (
                      <Ionicons name="checkmark" size={18} color="#191919" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191919',
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#191919',
    lineHeight: 30,
    marginTop: 8,
  },
  welcomeSub: {
    fontSize: 14,
    fontWeight: '500',
    color: '#71717A',
    marginTop: 6,
    marginBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrap: {
    position: 'relative',
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#E4E4E7',
  },
  avatarPlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#191919',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarHint: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 20,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  fieldBlock: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191919',
  },
  requiredAsterisk: {
    color: '#EF4444',
  },
  labelBetweenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  subInfoText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#71717A',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#191919',
    backgroundColor: '#FAFAFA',
  },
  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nicknameInput: {
    flex: 1,
  },
  checkButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FEE500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonDisabled: {
    backgroundColor: '#E4E4E7',
    opacity: 0.7,
  },
  checkButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191919',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  errorSubText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 2,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FAFAFA',
  },
  genderCardActive: {
    backgroundColor: '#FEE500',
    borderColor: '#FEE500',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717A',
  },
  genderTextActive: {
    color: '#191919',
    fontWeight: '800',
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  regionPickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  regionPickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#191919',
  },
  placeholderText: {
    color: '#A1A1AA',
    fontWeight: '400',
  },
  region2Input: {
    flex: 1,
  },
  interestChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  interestChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  interestChipActive: {
    backgroundColor: '#FEE500',
    borderColor: '#FEE500',
  },
  interestChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52525B',
  },
  interestChipTextActive: {
    color: '#191919',
    fontWeight: '700',
  },
  textarea: {
    minHeight: 100,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 28,
    backgroundColor: '#FEE500',
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FEE500',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#E4E4E7',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#191919',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#191919',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalList: {
    maxHeight: 380,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  modalItemActive: {
    backgroundColor: '#FEE500',
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3F3F46',
  },
  modalItemTextActive: {
    fontWeight: '800',
    color: '#191919',
  },
});
