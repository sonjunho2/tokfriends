import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import ButtonPrimary from '../../components/ButtonPrimary';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { USE_DUMMY_AUTH } from '../../config/env';

const GENDER_OPTIONS = [
  { key: 'female', label: '여성' },
  { key: 'male', label: '남성' },
];

const REGION_OPTIONS = [
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
  const { authenticateWithToken } = useAuth();
  const { phone, verificationId: initialVerificationId, adminOverride } = route.params || {};

  const [nickname, setNickname] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [region, setRegion] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [regionModalVisible, setRegionModalVisible] = useState(false);

  const birthYearValid = useMemo(() => {
    const numeric = parseInt(birthYear, 10);
    const current = new Date().getFullYear();
    return numeric >= current - 100 && numeric <= current;
  }, [birthYear]);

  const canSubmit =
    nickname.trim().length >= 2 &&
    birthYearValid &&
    gender &&
    headline.trim().length >= 5 &&
    bio.trim().length >= 10 &&
    !submitting;

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
        quality: 0.85,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setImageUri(res.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('오류', '사진을 선택하지 못했어요. 다시 시도해 주세요.');
    }
  };

  const handleSubmit = async () => {
    // verificationId와 adminOverride 플래그 결정
    let verificationId = initialVerificationId;
    let overrideFlag = adminOverride;

    // 더미 모드에서는 verificationId 없이도 진행
    if (USE_DUMMY_AUTH) {
      if (!verificationId) {
        verificationId = 'admin-override';  // dummy verificationId
      }
      overrideFlag = true;  // 관리자 우회
    }

    if (!verificationId) {
      Alert.alert('오류', '인증 정보가 만료되었습니다. 처음부터 다시 진행해 주세요.');
      return;
    }
    if (!canSubmit) {
      Alert.alert('안내', '필수 정보를 모두 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const shouldIncludeAvatar = !USE_DUMMY_AUTH && imageUri;
      const payload = {
        verificationId,
        phone,
        nickname: nickname.trim(),
        birthYear: parseInt(birthYear, 10),
        gender,
        region: region.trim() || null,
        headline: headline.trim(),
        bio: bio.trim(),
        ...(shouldIncludeAvatar ? { avatarUri: imageUri } : {}),
        // dummy 모드이거나 adminOverride가 true이거나 verificationId 접두사가 'admin-'인 경우 adminOverride 전달
        ...(overrideFlag || String(verificationId).startsWith('admin-')
          ? { adminOverride: true }
          : {}),
      };
      const response = await apiClient.completePhoneSignup(payload);
      const token =
        response?.token || response?.accessToken || response?.access_token;
      if (!token) {
        Alert.alert(
          '가입 실패',
          response?.error?.message || '서버에서 토큰을 받지 못했습니다. 잠시 후 다시 시도해 주세요.',
        );
        return;
      }
      const authResult = await authenticateWithToken(token, response?.user || null);
      if (!authResult.success) {
        Alert.alert('로그인 실패', authResult.error || '세션을 생성하지 못했습니다.');
        return;
      }
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (error) {
      Alert.alert(
        '가입 실패',
        error?.message || '회원가입 처리 중 문제가 발생했습니다.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>프로필을 입력해 주세요</Text>

          <TouchableOpacity style={styles.avatarWrap} onPress={handlePickImage} activeOpacity={0.85}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={42} color={colors.textTertiary} />
                <Text style={styles.avatarHint}>프로필 사진 등록 (선택)</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>기본 정보</Text>
            <View style={styles.field}>
              <Text style={styles.label}>닉네임 *</Text>
              <TextInput
                style={styles.input}
                placeholder="닉네임을 입력하세요"
                placeholderTextColor={colors.textTertiary}
                value={nickname}
                onChangeText={setNickname}
                editable={!submitting}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>출생연도 *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1996"
                  placeholderTextColor={colors.textTertiary}
                  value={birthYear}
                  onChangeText={setBirthYear}
                  keyboardType="number-pad"
                  maxLength={4}
                  editable={!submitting}
                />
                {!birthYearValid && birthYear.length === 4 && (
                  <Text style={styles.errorText}>올바른 연도를 입력해 주세요.</Text>
                )}
              </View>
              <View style={{ width: 16 }} />
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>거주 지역</Text>
                <TouchableOpacity
                  style={[styles.input, styles.selectInput]}
                  activeOpacity={0.8}
                  onPress={() => !submitting && setRegionModalVisible(true)}
                  disabled={submitting}
                >
                  <Text
                    style={[
                      styles.selectInputText,
                      !region ? styles.selectInputPlaceholder : null,
                    ]}
                  >
                    {region || '지역선택'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>성별 *</Text>
              <View style={styles.genderRow}>
                {GENDER_OPTIONS.map((option) => {
                  const active = gender === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[styles.genderButton, active && styles.genderButtonActive]}
                      onPress={() => setGender(option.key)}
                      disabled={submitting}
                    >
                      <Text style={[styles.genderText, active && styles.genderTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>한 줄 소개 *</Text>
              <TextInput
                style={styles.input}
                placeholder="예) 주말엔 등산 함께해요!"
                placeholderTextColor={colors.textTertiary}
                value={headline}
                onChangeText={setHeadline}
                editable={!submitting}
                maxLength={40}
              />
              <Text style={styles.helper}>{headline.length}/40</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>자기소개 *</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="관심사, 취미 등을 소개해 주세요."
                placeholderTextColor={colors.textTertiary}
                value={bio}
                onChangeText={setBio}
                editable={!submitting}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.helper}>{bio.length}/500</Text>
            </View>
          </View>

          <ButtonPrimary
            title="가입 완료하기"
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}
            style={{ marginTop: 32 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        visible={regionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRegionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>거주 지역 선택</Text>
            <ScrollView style={styles.modalList}>
              {REGION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.modalOption}
                  onPress={() => {
                    setRegion(option);
                    setRegionModalVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setRegionModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>닫기</Text>
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
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  avatarWrap: {
    marginTop: 28,
    alignSelf: 'center',
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
  },
  avatarHint: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    resizeMode: 'cover',
  },
  formCard: {
    marginTop: 32,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 18,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  selectInput: {
    justifyContent: 'center',
  },
  selectInputText: {
    fontSize: 16,
    color: colors.text,
  },
  selectInputPlaceholder: {
    color: colors.textTertiary,
  },
  multiline: {
    height: 150,
    paddingVertical: 14,
  },
  helper: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderButtonActive: {
    backgroundColor: `${colors.primary}1A`,
    borderColor: colors.primary,
  },
  genderText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  genderTextActive: {
    color: colors.primary,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: colors.error || '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalList: {
    maxHeight: 320,
  },
  modalOption: {
    paddingVertical: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  modalCloseButton: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCloseText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
