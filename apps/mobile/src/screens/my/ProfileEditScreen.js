// src/screens/my/ProfileEditScreen.js
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

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

export default function ProfileEditScreen({ navigation, route }) {
  const profile = route?.params?.profile ?? {};
  const preferredFont = route?.params?.preferredFont;
  const { user, refreshMe } = useAuth();
  const userProfile = user?.profile ?? {};

  const initialName = (
    userProfile?.nickname ??
    profile?.name ??
    user?.displayName ??
    ''
  ).trim();

  const [name, setName] = useState(initialName);
  const [region1, setRegion1] = useState(user?.region1 ?? '');
  const [region2, setRegion2] = useState(user?.region2 ?? '');
  const [title, setTitle] = useState(userProfile?.headline ?? profile?.title ?? '');
  const [bio, setBio] = useState(userProfile?.bio ?? profile?.bio ?? '');
  const [avatarUri, setAvatarUri] = useState(
    userProfile?.avatarUri ?? profile?.avatarUri ?? profile?.image ?? null,
  );
  const [avatarAsset, setAvatarAsset] = useState(null);
  const [interests, setInterests] = useState(
    Array.isArray(userProfile?.interests) ? userProfile.interests : [],
  );
  const [interestInput, setInterestInput] = useState('');
  const [saving, setSaving] = useState(false);

  // 닉네임 중복 확인 상태: 'initial' | 'checking' | 'available' | 'unavailable' | 'modified'
  const [nicknameCheckStatus, setNicknameCheckStatus] = useState('initial');
  const [nicknameMessage, setNicknameMessage] = useState(
    initialName ? '현재 등록된 닉네임입니다.' : '',
  );
  const [checkingNickname, setCheckingNickname] = useState(false);

  // 지역 선택 모달 상태
  const [regionModalVisible, setRegionModalVisible] = useState(false);

  const previewFontStyle = useMemo(() => {
    if (!preferredFont || preferredFont === 'system') {
      return null;
    }
    return { fontFamily: preferredFont };
  }, [preferredFont]);

  // 닉네임 텍스트 변경 시 상태 갱신
  const handleNameChange = (text) => {
    setName(text);
    const trimmed = text.trim();
    if (trimmed === initialName) {
      setNicknameCheckStatus('initial');
      setNicknameMessage('현재 등록된 닉네임입니다.');
    } else {
      setNicknameCheckStatus('modified');
      setNicknameMessage('닉네임 변경 시 중복 확인이 필요합니다.');
    }
  };

  // 닉네임 중복 확인 실행
  const handleCheckNickname = async (overrideText) => {
    const targetName = (typeof overrideText === 'string' ? overrideText : name).trim();
    if (!targetName) {
      Alert.alert('알림', '확인할 닉네임을 입력해 주세요.');
      return false;
    }

    if (targetName === initialName) {
      setNicknameCheckStatus('initial');
      setNicknameMessage('현재 등록된 닉네임입니다.');
      return true;
    }

    setCheckingNickname(true);
    try {
      const res = await apiClient.checkNickname(targetName);
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

  // 관심사 추가
  const handleAddInterest = () => {
    const tag = interestInput.trim();
    if (!tag) return;
    if (interests.includes(tag)) {
      setInterestInput('');
      return;
    }
    if (interests.length >= 10) {
      Alert.alert('관심사 안내', '관심사는 최대 10개까지 추가할 수 있습니다.');
      return;
    }
    setInterests((prev) => [...prev, tag]);
    setInterestInput('');
  };

  // 관심사 제거
  const handleRemoveInterest = (tag) => {
    setInterests((prev) => prev.filter((t) => t !== tag));
  };

  // 프리셋 관심사 토글
  const handleTogglePreset = (tag) => {
    if (interests.includes(tag)) {
      handleRemoveInterest(tag);
    } else {
      if (interests.length >= 10) {
        Alert.alert('관심사 안내', '관심사는 최대 10개까지 추가할 수 있습니다.');
        return;
      }
      setInterests((prev) => [...prev, tag]);
    }
  };

  // 아바타 사진 선택
  const handlePickAvatar = async () => {
    if (saving) return;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '권한 필요',
          '사진을 선택하려면 갤러리 접근 권한이 필요합니다.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setAvatarAsset(result.assets[0]);
        setAvatarUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('프로필 사진', '사진을 선택하지 못했습니다. 다시 시도해 주세요.');
    }
  };

  // 아바타 사진 기본값으로 초기화
  const handleResetAvatar = () => {
    Alert.alert('사진 초기화', '기본 프로필 사진으로 변경하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '기본 사진 적용',
        onPress: () => {
          setAvatarAsset(null);
          setAvatarUri(null);
        },
      },
    ]);
  };

  // 최종 저장
  const handleSave = async () => {
    if (saving) return;

    if (!user?.id) {
      Alert.alert('프로필 저장 실패', '로그인 사용자 정보를 확인할 수 없습니다.');
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('입력 확인', '닉네임을 입력해 주세요.');
      return;
    }

    // 닉네임이 변경되었으나 아직 중복 확인을 안 거친 경우 자동 검증
    if (trimmedName !== initialName && nicknameCheckStatus !== 'available') {
      const isAvailable = await handleCheckNickname(trimmedName);
      if (!isAvailable) {
        Alert.alert('닉네임 확인', nicknameMessage || '사용 가능한 닉네임을 입력해 주세요.');
        return;
      }
    }

    setSaving(true);

    try {
      let nextAvatarUri = avatarUri;

      if (avatarAsset) {
        const uploadedAvatar = await apiClient.uploadAvatar(avatarAsset);
        nextAvatarUri = String(uploadedAvatar?.url || '').trim();

        if (!nextAvatarUri) {
          throw new Error('프로필 사진 저장 정보를 확인하지 못했습니다.');
        }
      }

      await apiClient.updateUser(user.id, {
        nickname: trimmedName,
        region1: region1.trim(),
        region2: region2.trim(),
        headline: title.trim(),
        bio: bio.trim(),
        interests,
        ...(nextAvatarUri !== undefined ? { avatarUri: nextAvatarUri } : {}),
      });

      await refreshMe();

      Alert.alert('프로필 저장 완료', '프로필 정보가 성공적으로 반영되었습니다.', [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        '프로필 저장 실패',
        error?.message || '프로필을 저장하지 못했습니다. 다시 시도해 주세요.',
      );
    } finally {
      setSaving(false);
    }
  };

  const nicknameBadgeColor = useMemo(() => {
    switch (nicknameCheckStatus) {
      case 'available':
      case 'initial':
        return '#10B981'; // green
      case 'unavailable':
        return '#EF4444'; // red
      case 'modified':
        return '#F59E0B'; // yellow/amber
      default:
        return colors.textSecondary;
    }
  }, [nicknameCheckStatus]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* 상단 GNB 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 수정</Text>
        <TouchableOpacity
          style={[styles.headerDoneButton, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          hitSlop={8}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.headerDoneText}>완료</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 아바타 사진 섹션 */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarButton}
            activeOpacity={0.85}
            onPress={handlePickAvatar}
            disabled={saving}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color="#A1A1AA" />
              </View>
            )}

            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.avatarActionRow}>
            <TouchableOpacity onPress={handlePickAvatar} disabled={saving}>
              <Text style={styles.avatarHelp}>사진 변경</Text>
            </TouchableOpacity>
            {avatarUri ? (
              <>
                <Text style={styles.avatarDot}>·</Text>
                <TouchableOpacity onPress={handleResetAvatar} disabled={saving}>
                  <Text style={styles.avatarReset}>기본 사진</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>

        {/* 기본 프로필 폼 카드 */}
        <View style={styles.formCard}>
          {/* 1. 닉네임 입력 및 중복 확인 */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>닉네임</Text>
            <View style={styles.nicknameInputRow}>
              <TextInput
                style={[styles.input, styles.nicknameInput]}
                value={name}
                onChangeText={handleNameChange}
                placeholder="2~12자 닉네임을 입력하세요"
                placeholderTextColor={colors.textTertiary}
                maxLength={12}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[
                  styles.checkButton,
                  (checkingNickname || name.trim() === initialName) && styles.checkButtonDisabled,
                ]}
                onPress={() => handleCheckNickname()}
                disabled={checkingNickname || name.trim() === initialName}
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
              <View style={styles.nicknameFeedbackRow}>
                <Ionicons
                  name={
                    nicknameCheckStatus === 'available' || nicknameCheckStatus === 'initial'
                      ? 'checkmark-circle'
                      : nicknameCheckStatus === 'unavailable'
                      ? 'alert-circle'
                      : 'information-circle'
                  }
                  size={14}
                  color={nicknameBadgeColor}
                />
                <Text style={[styles.nicknameFeedbackText, { color: nicknameBadgeColor }]}>
                  {nicknameMessage}
                </Text>
              </View>
            ) : null}
          </View>

          {/* 2. 지역 선택 (지역 1: 시/도, 지역 2: 시/군/구) */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>활동 지역</Text>
            <View style={styles.regionRow}>
              {/* 지역 1 (시/도 선택 버튼) */}
              <TouchableOpacity
                style={styles.regionSelectButton}
                onPress={() => setRegionModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.regionSelectText, !region1 && styles.placeholderText]}>
                  {region1 || '시/도 선택'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* 지역 2 (구/군 텍스트 입력) */}
              <TextInput
                style={[styles.input, styles.region2Input]}
                value={region2}
                onChangeText={setRegion2}
                placeholder="시/군/구 (예: 강남구)"
                placeholderTextColor={colors.textTertiary}
                maxLength={20}
              />
            </View>
          </View>

          {/* 3. 한줄 소개 */}
          <View style={styles.fieldBlock}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>한줄 소개</Text>
              <Text style={styles.counterText}>{title.length}/40</Text>
            </View>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="나를 나타내는 멋진 한 줄을 적어보세요"
              placeholderTextColor={colors.textTertiary}
              maxLength={40}
            />
          </View>

          {/* 4. 자기소개 (다줄 입력) */}
          <View style={styles.fieldBlock}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>자기 소개</Text>
              <Text style={styles.counterText}>{bio.length}/300</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={bio}
              onChangeText={setBio}
              multiline
              textAlignVertical="top"
              placeholder="취향, 취미, 관심사에 대해 자유롭게 작성해보세요."
              placeholderTextColor={colors.textTertiary}
              maxLength={300}
            />
          </View>

          {/* 5. 관심사 (Interests) 태그 칩 시스템 */}
          <View style={styles.fieldBlock}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>내 관심사 ({interests.length}/10)</Text>
              <Text style={styles.subHelpText}>최대 10개 선택</Text>
            </View>

            {/* 선택된 태그 목록 */}
            {interests.length > 0 && (
              <View style={styles.selectedInterestRow}>
                {interests.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.selectedTagPill}
                    onPress={() => handleRemoveInterest(tag)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.selectedTagText}>{tag}</Text>
                    <Ionicons name="close" size={13} color="#191919" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 직접 입력 인풋 */}
            <View style={styles.interestInputRow}>
              <TextInput
                style={styles.interestInput}
                value={interestInput}
                onChangeText={setInterestInput}
                placeholder="관심사 직접 입력 (최대 12자)"
                placeholderTextColor={colors.textTertiary}
                returnKeyType="done"
                onSubmitEditing={handleAddInterest}
                maxLength={12}
              />
              <TouchableOpacity
                style={styles.interestAddBtn}
                onPress={handleAddInterest}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={20} color="#191919" />
              </TouchableOpacity>
            </View>

            {/* 추천 관심사 칩 그리드 */}
            <Text style={styles.presetLabel}>인기 추천 관심사</Text>
            <View style={styles.presetRow}>
              {PRESET_INTERESTS.map((tag) => {
                const isSelected = interests.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.presetTag, isSelected && styles.presetTagActive]}
                    onPress={() => handleTogglePreset(tag)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.presetTagText, isSelected && styles.presetTagTextActive]}>
                      {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 실시간 프로필 미리보기 카드 */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>✨ 프로필 미리보기</Text>
          <View style={styles.previewBox}>
            <View style={styles.previewHeaderRow}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.previewAvatar} />
              ) : (
                <View style={[styles.previewAvatar, styles.previewAvatarPlaceholder]}>
                  <Ionicons name="person" size={24} color="#A1A1AA" />
                </View>
              )}
              <View style={styles.previewHeaderInfo}>
                <Text style={[styles.previewName, previewFontStyle]}>
                  {name || '닉네임 미설정'}
                </Text>
                <Text style={[styles.previewLocation, previewFontStyle]}>
                  📍 {[region1, region2].filter(Boolean).join(' · ') || '지역 미설정'}
                </Text>
              </View>
            </View>

            <Text style={[styles.previewTagline, previewFontStyle]}>
              {title || '한줄 소개를 작성해 보세요.'}
            </Text>
            <Text style={[styles.previewBio, previewFontStyle]}>
              {bio || '자기소개를 통해 이웃에게 나를 소개해 보세요.'}
            </Text>

            {interests.length > 0 && (
              <View style={styles.previewTagRow}>
                {interests.map((tag) => (
                  <View key={tag} style={styles.previewTagPill}>
                    <Text style={styles.previewTagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* 하단 변경사항 저장 버튼 */}
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#191919" />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={20} color="#191919" />
              <Text style={styles.saveButtonText}>변경사항 저장하기</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* 대한민국 17개 광역시·도 선택 모달 */}
      <Modal
        visible={regionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRegionModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
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
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {KOREA_REGIONS.map((item) => {
                const isCurrent = region1 === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.regionOptionItem, isCurrent && styles.regionOptionItemActive]}
                    onPress={() => {
                      setRegion1(item);
                      setRegionModalVisible(false);
                    }}
                  >
                    <Text
                      style={[styles.regionOptionText, isCurrent && styles.regionOptionTextActive]}
                    >
                      {item}
                    </Text>
                    {isCurrent ? (
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
  headerButton: {
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
  headerDoneButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FEE500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDoneText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191919',
  },
  avatarSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  avatarButton: {
    position: 'relative',
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  avatarImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#E4E4E7',
  },
  avatarPlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#191919',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  avatarHelp: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  avatarDot: {
    fontSize: 13,
    color: '#A1A1AA',
  },
  avatarReset: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
  },
  formCard: {
    marginTop: 18,
    marginHorizontal: 16,
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191919',
  },
  counterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  subHelpText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#71717A',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#191919',
    backgroundColor: '#FAFAFA',
  },
  nicknameInputRow: {
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
  nicknameFeedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  nicknameFeedbackText: {
    fontSize: 12,
    fontWeight: '600',
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  regionSelectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#FAFAFA',
  },
  regionSelectText: {
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
  textarea: {
    minHeight: 110,
    lineHeight: 20,
  },
  selectedInterestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  selectedTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE500',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191919',
  },
  interestInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  interestInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#191919',
    backgroundColor: '#FAFAFA',
  },
  interestAddBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FEE500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717A',
    marginTop: 10,
    marginBottom: 4,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetTag: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  presetTagActive: {
    backgroundColor: '#191919',
    borderColor: '#191919',
  },
  presetTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52525B',
  },
  presetTagTextActive: {
    color: '#FEE500',
    fontWeight: '700',
  },
  previewCard: {
    marginTop: 22,
    marginHorizontal: 16,
    gap: 10,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191919',
    marginLeft: 4,
  },
  previewBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E4E4E7',
  },
  previewAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewHeaderInfo: {
    flex: 1,
    gap: 3,
  },
  previewName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#191919',
  },
  previewLocation: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717A',
  },
  previewTagline: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
    backgroundColor: '#FFFBEB',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  previewBio: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3F3F46',
    lineHeight: 19,
  },
  previewTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 4,
  },
  previewTagPill: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  previewTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#52525B',
  },
  saveButton: {
    marginTop: 26,
    marginHorizontal: 16,
    backgroundColor: '#FEE500',
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#FEE500',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#191919',
  },
  modalBackdrop: {
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
  modalScroll: {
    maxHeight: 380,
  },
  regionOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  regionOptionItemActive: {
    backgroundColor: '#FEE500',
  },
  regionOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3F3F46',
  },
  regionOptionTextActive: {
    fontWeight: '800',
    color: '#191919',
  },
});
