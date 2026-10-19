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
  // 1. 방 유형: 'secret'(1:1) vs 'group'(오픈 라운지)
  const [roomType, setRoomType] = useState('group'); // 'secret' | 'group'

  // 2. 방 제목
  const [title, setTitle] = useState('');

  // 3. 카테고리
  const [selectedCategory, setSelectedCategory] = useState('#친목');

  // 4. 입장료 선택
  const [selectedFeePreset, setSelectedFeePreset] = useState(0);
  const [customFeeInput, setCustomFeeInput] = useState('');

  // 5. 로딩 상태
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
    setRoomType('group');
    setTitle('');
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
      const isGroup = roomType === 'group';
      const cleanCategory = selectedCategory.replace('#', '');

      const newRoom = await apiClient.createChatRoom({
        title: trimmedTitle,
        category: cleanCategory,
        entryFee: effectiveEntryFee,
        isGroup,
      });

      Alert.alert('개설 완료', `"${trimmedTitle}" 대화방이 생성되었습니다! 🎉`);
      handleClose();

      if (onRoomCreated) {
        onRoomCreated(newRoom);
      } else if (navigation && newRoom?.id) {
        navigation.navigate('ChatRoom', {
          id: newRoom.id,
          room: newRoom,
          user: newRoom.counterpart,
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
    roomType,
    selectedCategory,
    effectiveEntryFee,
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
                {/* 1. 대화방 유형 선택 세그먼트 */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>대화방 유형</Text>
                  <View style={styles.segmentContainer}>
                    <TouchableOpacity
                      style={[
                        styles.segmentBtn,
                        roomType === 'secret'
                          ? styles.segmentBtnActive
                          : styles.segmentBtnInactive,
                      ]}
                      onPress={() => setRoomType('secret')}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="person"
                        size={16}
                        color={roomType === 'secret' ? '#FFFFFF' : tokens.colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.segmentText,
                          roomType === 'secret'
                            ? styles.segmentTextActive
                            : styles.segmentTextInactive,
                        ]}
                      >
                        1:1 시크릿 대화
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.segmentBtn,
                        roomType === 'group'
                          ? styles.segmentBtnActive
                          : styles.segmentBtnInactive,
                      ]}
                      onPress={() => setRoomType('group')}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="people"
                        size={17}
                        color={roomType === 'group' ? '#FFFFFF' : tokens.colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.segmentText,
                          roomType === 'group'
                            ? styles.segmentTextActive
                            : styles.segmentTextInactive,
                        ]}
                      >
                        그룹 오픈 라운지
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.segmentCaption}>
                    {roomType === 'secret'
                      ? '🔒 초대한 회원 또는 1명과 1:1로 은밀하게 대화하는 방입니다.'
                      : '👥 관심사가 맞는 동네 이웃 누구나 자유롭게 입장 가능한 오픈형 라운지입니다.'}
                  </Text>
                </View>

                {/* 2. 대화방 제목 입력 */}
                <View style={styles.section}>
                  <View style={styles.labelWithCounter}>
                    <Text style={styles.sectionLabel}>대화방 제목 / 주제</Text>
                    <Text style={styles.counterText}>{title.length}/30</Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder={
                        roomType === 'secret'
                          ? '예: 퇴근길 가볍게 통화/소통할 분 💬'
                          : '예: 퇴근 후 한강 러닝 & 브런치 번개 🏃'
                      }
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
                    colors={tokens.colors.gradients.primaryPink}
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
});
