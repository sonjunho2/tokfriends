// apps/mobile/src/components/chat/CreateRoomModal.js
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { tokens } from '../../theme/tokens';
import { apiClient } from '../../api/client';
import Avatar from '../Avatar';
import { useAuth } from '../../context/AuthContext';

// 추천 인연 후보 목록
const CANDIDATE_USERS = [
  { id: 'u-seed-1', name: '박서연', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' },
  { id: 'u-seed-2', name: '김도현', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200' },
  { id: 'u-seed-3', name: '한유진', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200' },
  { id: 'user-disc-1', name: '서연', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' },
  { id: 'user-disc-2', name: '민준', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
  { id: 'user-disc-3', name: '지민', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200' },
];

// 카테고리 칩 목록
const CATEGORIES = ['#친목', '#취미', '#고민', '#운동', '#동네', '#자유'];

// 입장료 프리셋 칩 목록
const ENTRY_FEE_PRESETS = [
  { label: '무료', value: 0 },
  { label: '10 ON', value: 10 },
  { label: '30 ON', value: 30 },
  { label: '50 ON', value: 50 },
  { label: '100 ON', value: 100 },
  { label: '직접 입력', value: -1 },
];

/**
 * 대화방 개설 모달 (위피/토스 스타일 프리미엄 소셜 UI)
 */
export default function CreateRoomModal({
  visible = false,
  onClose,
  onRoomCreated,
  navigation,
}) {
  const { user: authUser } = useAuth();

  // 1:1 대화방 전용 개설 모드
  // 0. 대화 상대 (null: 누구나 입장 가능한 대기방)
  const [selectedTargetUser, setSelectedTargetUser] = useState(null);

  // 1. 방 제목
  const [title, setTitle] = useState('');

  // 2. 카테고리
  const [selectedCategory, setSelectedCategory] = useState('#친목');

  // 3. 입장료 선택
  const [selectedFeePreset, setSelectedFeePreset] = useState(0);
  const [customFeeInput, setCustomFeeInput] = useState('');

  // 4. 로딩 상태
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 실질적 입장료 계산
  const effectiveEntryFee = useMemo(() => {
    if (selectedFeePreset === -1) {
      const parsed = parseInt(customFeeInput.replace(/\D/g, ''), 10);
      return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    }
    return selectedFeePreset;
  }, [selectedFeePreset, customFeeInput]);

  // 50 ON 이상일 때 VIP 프라이빗 룸 여부
  const isVipPrivateRoom = effectiveEntryFee >= 50;

  // 폼 초기화
  const resetForm = useCallback(() => {
    setTitle('');
    setSelectedTargetUser(null);
    setSelectedCategory('#친목');
    setSelectedFeePreset(0);
    setCustomFeeInput('');
    setIsSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    resetForm();
    if (onClose) onClose();
  }, [onClose, resetForm]);

  // 방 개설 제출
  const handleSubmit = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('알림', '대화방 제목 또는 주제를 입력해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanCategory = selectedCategory.replace('#', '');

      const newRoom = await apiClient.createChatRoom({
        title: trimmedTitle,
        category: cleanCategory,
        entryFee: effectiveEntryFee,
        isGroup: false,
        targetUserId: selectedTargetUser?.id || null,
        targetUserName: selectedTargetUser?.name || null,
        targetUserAvatar: selectedTargetUser?.avatar || null,
        hostUser: authUser,
      });

      const counterpartInfo = newRoom?.counterpart || (selectedTargetUser
        ? {
            id: selectedTargetUser.id,
            displayName: selectedTargetUser.name,
            name: selectedTargetUser.name,
            avatarUrl: selectedTargetUser.avatar,
            avatar: selectedTargetUser.avatar,
          }
        : {
            id: '',
            displayName: '대화 상대 대기 중',
            name: '대화 상대 대기 중',
            avatarUrl: null,
          });

      Alert.alert(
        '개설 완료',
        selectedTargetUser
          ? `"${selectedTargetUser.name}"님과의 1:1 대화방이 생성되었습니다! 🎉`
          : `"${trimmedTitle}" 1:1 대기방이 생성되었습니다! 🎉\n(상대방이 입장하면 대화가 시작됩니다)`,
      );
      handleClose();

      if (onRoomCreated) {
        onRoomCreated(newRoom);
      } else if (navigation && newRoom?.id) {
        navigation.navigate('ChatRoom', {
          id: newRoom.id,
          room: newRoom,
          user: counterpartInfo,
          counterpart: counterpartInfo,
        });
      }
    } catch (err) {
      console.warn('Failed to create chat room:', err);
      Alert.alert('개설 실패', err?.message || '대화방 개설 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    title,
    selectedTargetUser,
    selectedCategory,
    effectiveEntryFee,
    authUser,
    handleClose,
    onRoomCreated,
    navigation,
  ]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoid}
          >
            <View style={styles.sheetContainer}>
              {/* 드래그 인디케이터 바 */}
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>

              {/* 상단 헤더 */}
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.headerTitle}>새 대화방 개설</Text>
                  <Text style={styles.headerSubtitle}>
                    동네 친구들과 설레는 소통을 시작해 보세요
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={handleClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={22} color={tokens.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* 1. 1:1 대화방 정책 안내 카드 */}
                <View style={styles.section}>
                  <View style={styles.directChatInfoBanner}>
                    <View style={styles.directChatInfoIconWrap}>
                      <Ionicons name="chatbubble-ellipses" size={20} color="#FF5A79" />
                    </View>
                    <View style={styles.directChatInfoTextWrap}>
                      <Text style={styles.directChatInfoTitle}>1:1 프라이빗 대화방</Text>
                      <Text style={styles.directChatInfoDesc}>
                        대화 상대를 지정하여 바로 대화를 나누거나, 공개 대기방을 열어 새로운 인연의 입장을 기다릴 수 있습니다.
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 2. 대화 상대 선택 (인연 선택 또는 누구나 대기방) */}
                <View style={styles.section}>
                  <View style={styles.labelWithCounter}>
                    <Text style={styles.sectionLabel}>대화 상대 선택</Text>
                    <Text style={styles.targetStatusText}>
                      {selectedTargetUser ? `선택: ${selectedTargetUser.name}` : '🌐 누구나 입장 (대기방)'}
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.usersScrollContainer}
                  >
                    {/* 옵션 1: 누구나 (공개 대기방) */}
                    <TouchableOpacity
                      style={[
                        styles.userSelectChip,
                        !selectedTargetUser && styles.userSelectChipActive,
                      ]}
                      onPress={() => setSelectedTargetUser(null)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.userSelectAvatarRing,
                          !selectedTargetUser && styles.userSelectAvatarRingActive,
                        ]}
                      >
                        <Ionicons
                          name="globe-outline"
                          size={20}
                          color={!selectedTargetUser ? '#FF5A79' : '#9CA3AF'}
                        />
                      </View>
                      <Text
                        style={[
                          styles.userSelectName,
                          !selectedTargetUser && styles.userSelectNameActive,
                        ]}
                      >
                        누구나 (대기)
                      </Text>
                    </TouchableOpacity>

                    {/* 추천 인연 목록 */}
                    {CANDIDATE_USERS.map((u) => {
                      const isSelected = selectedTargetUser?.id === u.id;
                      return (
                        <TouchableOpacity
                          key={u.id}
                          style={[
                            styles.userSelectChip,
                            isSelected && styles.userSelectChipActive,
                          ]}
                          onPress={() => {
                            setSelectedTargetUser(u);
                            if (!title) {
                              setTitle(`${u.name}님과의 1:1 대화`);
                            }
                          }}
                          activeOpacity={0.8}
                        >
                          <View
                            style={[
                              styles.userSelectAvatarRing,
                              isSelected && styles.userSelectAvatarRingActive,
                            ]}
                          >
                            <Avatar size={34} uri={u.avatar} name={u.name} />
                          </View>
                          <Text
                            style={[
                              styles.userSelectName,
                              isSelected && styles.userSelectNameActive,
                            ]}
                            numberOfLines={1}
                          >
                            {u.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  {!selectedTargetUser ? (
                    <Text style={styles.waitingNotice}>
                      💡 상대를 지정하지 않으면 다른 회원이 입장할 때까지 '공개 대기방' 상태로 개설됩니다.
                    </Text>
                  ) : (
                    <Text style={styles.waitingNoticeActive}>
                      ✨ {selectedTargetUser.name}님과의 1:1 대화방이 바로 개설되어 대화와 선물을 나누실 수 있습니다.
                    </Text>
                  )}
                </View>

                {/* 3. 대화방 제목 입력 */}
                <View style={styles.section}>
                  <View style={styles.labelWithCounter}>
                    <Text style={styles.sectionLabel}>대화방 제목 / 주제</Text>
                    <Text style={styles.counterText}>{title.length}/30</Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="예: 퇴근 후 가볍게 대화 나눌 분 찾아요 💬"
                      placeholderTextColor={tokens.colors.textTertiary}
                      value={title}
                      onChangeText={(t) => setTitle(t.slice(0, 30))}
                      maxLength={30}
                      returnKeyType="done"
                    />
                  </View>
                </View>

                {/* 3. 카테고리 칩 바 */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>카테고리</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsScroll}
                  >
                    {CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.categoryChip,
                            isSelected
                              ? styles.categoryChipActive
                              : styles.categoryChipInactive,
                          ]}
                          onPress={() => setSelectedCategory(cat)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              isSelected
                                ? styles.categoryChipTextActive
                                : styles.categoryChipTextInactive,
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* 4. 참여자 입장료(ON) 선택 칩 */}
                <View style={styles.section}>
                  <View style={styles.labelWithBadgeRow}>
                    <Text style={styles.sectionLabel}>참여자 입장료 설정 (ON)</Text>
                    {isVipPrivateRoom && (
                      <View style={styles.vipBadge}>
                        <Ionicons name="lock-closed" size={11} color="#B45309" />
                        <Text style={styles.vipBadgeText}>🔒 VIP 프라이빗 룸</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.feeChipsContainer}>
                    {ENTRY_FEE_PRESETS.map((item) => {
                      const isSelected = selectedFeePreset === item.value;
                      return (
                        <TouchableOpacity
                          key={item.label}
                          style={[
                            styles.feeChip,
                            isSelected ? styles.feeChipActive : styles.feeChipInactive,
                          ]}
                          onPress={() => setSelectedFeePreset(item.value)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.feeChipText,
                              isSelected
                                ? styles.feeChipTextActive
                                : styles.feeChipTextInactive,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* 직접 입력 시 인풋 */}
                  {selectedFeePreset === -1 && (
                    <View style={styles.customFeeRow}>
                      <TextInput
                        style={styles.customFeeInput}
                        placeholder="직접 입력 (예: 200)"
                        placeholderTextColor={tokens.colors.textTertiary}
                        keyboardType="numeric"
                        value={customFeeInput}
                        onChangeText={setCustomFeeInput}
                        maxLength={5}
                      />
                      <Text style={styles.customFeeUnit}>ON</Text>
                    </View>
                  )}

                  {/* VIP 프라이빗 룸 혜택 알림 배너 */}
                  {isVipPrivateRoom && (
                    <View style={styles.vipNoticeBox}>
                      <View style={styles.vipIconCircle}>
                        <Ionicons name="star" size={14} color="#D97706" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.vipNoticeTitle}>VIP 프라이빗 룸 인증</Text>
                        <Text style={styles.vipNoticeDesc}>
                          50 ON 이상 설정 시 VIP 프라이빗 뱃지가 자동 부여되며 진정성 있는 인연들과 더 깊이 있는 대화가 가능합니다.
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* 5. 하단 정책 안내 박스 (토스/애플 스타일 클린 인포) */}
                <View style={styles.policyCard}>
                  <Ionicons
                    name="shield-checkmark"
                    size={18}
                    color={tokens.colors.primary}
                    style={styles.policyIcon}
                  />
                  <View style={styles.policyTextCol}>
                    <Text style={styles.policyText}>
                      • 클린하고 안전한 소통을 위해 24시간 AI 안심 케어 센터가 가동됩니다.
                    </Text>
                    <Text style={styles.policyText}>
                      • 유료 입장료(ON)는 방 입장 시 차감되며 개설자에게 크리에이터 포인트로 적립됩니다.
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* 6. 하단 CTA 버튼 */}
              <View style={styles.bottomBar}>
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={tokens.colors.gradients.primaryPink || ['#FF3B6B', '#FF758C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitGradient}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                        <Text style={styles.submitText}>✨ 대화방 개설하기</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    width: '100%',
  },
  sheetContainer: {
    backgroundColor: tokens.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    ...tokens.shadows.float,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: tokens.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    maxHeight: 460,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: 8,
  },
  labelWithCounter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  counterText: {
    fontSize: 12,
    color: tokens.colors.textTertiary,
  },
  directChatInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFE4E9',
    gap: 12,
  },
  directChatInfoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE4E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directChatInfoTextWrap: {
    flex: 1,
  },
  directChatInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E11D48',
    marginBottom: 2,
  },
  directChatInfoDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: tokens.colors.primary,
    ...tokens.shadows.card,
  },
  segmentBtnInactive: {
    backgroundColor: 'transparent',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  segmentTextInactive: {
    color: tokens.colors.textSecondary,
  },
  segmentCaption: {
    fontSize: 12,
    color: tokens.colors.textSecondary,
    marginTop: 8,
    lineHeight: 16,
  },
  inputWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.borderMedium,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  textInput: {
    fontSize: 15,
    color: tokens.colors.textPrimary,
  },
  chipsScroll: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: tokens.radii.pill,
    borderWidth: 1,
  },
  categoryChipActive: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  categoryChipInactive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  categoryChipTextInactive: {
    color: tokens.colors.textSecondary,
  },
  labelWithBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  vipBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  feeChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feeChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  feeChipActive: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
    ...tokens.shadows.card,
  },
  feeChipInactive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  feeChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  feeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  feeChipTextInactive: {
    color: tokens.colors.textSecondary,
  },
  customFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: tokens.colors.borderMedium,
    paddingHorizontal: 12,
  },
  customFeeInput: {
    flex: 1,
    height: 42,
    fontSize: 14,
    color: tokens.colors.textPrimary,
  },
  customFeeUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.primary,
    paddingLeft: 8,
  },
  vipNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  vipIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  vipNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  vipNoticeDesc: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
  },
  policyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: tokens.colors.borderLight,
    gap: 10,
  },
  policyIcon: {
    marginTop: 2,
  },
  policyTextCol: {
    flex: 1,
    gap: 4,
  },
  policyText: {
    fontSize: 12,
    color: tokens.colors.textSecondary,
    lineHeight: 17,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  submitBtn: {
    borderRadius: tokens.radii.button,
    overflow: 'hidden',
    ...tokens.shadows.float,
  },
  submitGradient: {
    flexDirection: 'row',
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  targetStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF5A79',
  },
  usersScrollContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  userSelectChip: {
    alignItems: 'center',
    width: 68,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  userSelectChipActive: {
    backgroundColor: '#FFF1F4',
    borderColor: '#FF5A79',
  },
  userSelectAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
    marginBottom: 6,
  },
  userSelectAvatarRingActive: {
    backgroundColor: '#FFE4E9',
  },
  userSelectName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  userSelectNameActive: {
    color: '#FF3366',
    fontWeight: '700',
  },
  waitingNotice: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  waitingNoticeActive: {
    fontSize: 12,
    color: '#E11D48',
    lineHeight: 16,
    marginTop: 8,
    backgroundColor: '#FFF1F2',
    padding: 8,
    borderRadius: 8,
    fontWeight: '600',
  },
});
