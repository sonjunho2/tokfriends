// apps/mobile/src/components/ReportModal.js
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

const REPORT_CATEGORIES = [
  '욕설 / 비방 / 혐오 표현',
  '음란물 및 부적절한 미디어',
  '사기 / 스팸 / 상업적 광고',
  '도용 및 허위 정보',
  '불건전 만남 및 조건 제안',
  '기타 불건전 행위',
];

export default function ReportModal({
  visible,
  targetName = '회원',
  targetType = 'user', // 'user' | 'post' | 'room'
  onClose,
  onSubmit,
}) {
  const [selectedCategory, setSelectedCategory] = useState(REPORT_CATEGORIES[0]);
  const [detailText, setDetailText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetState = () => {
    setSelectedCategory(REPORT_CATEGORIES[0]);
    setDetailText('');
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) return;
    resetState();
    onClose?.();
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const fullReason = detailText.trim()
      ? `[${selectedCategory}] ${detailText.trim()}`
      : `[${selectedCategory}]`;

    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({ category: selectedCategory, reason: fullReason, detail: detailText.trim() });
      }
      resetState();
      onClose?.();
    } catch (err) {
      Alert.alert('신고 실패', err?.message || '신고 접수 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const typeLabel =
    targetType === 'post' ? '게시물' : targetType === 'room' ? '방송' : '회원';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoid}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalCard}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerTitleRow}>
                    <Ionicons name="shield-alert-outline" size={22} color={colors.error} />
                    <Text style={styles.headerTitle}>{typeLabel} 신고하기</Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={submitting}
                    hitSlop={8}
                    style={styles.closeBtn}
                  >
                    <Ionicons name="close" size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.targetInfo}>
                  <Text style={styles.targetNameHighlight}>{targetName}</Text> {typeLabel}에
                  문제가 있나요? 사유를 선택해 주세요.
                </Text>

                <ScrollView
                  style={styles.scrollArea}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Category Chips */}
                  <Text style={styles.sectionLabel}>신고 사유 선택</Text>
                  <View style={styles.categoryGrid}>
                    {REPORT_CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.categoryChip,
                            isSelected && styles.categoryChipSelected,
                          ]}
                          onPress={() => setSelectedCategory(cat)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                            size={16}
                            color={isSelected ? colors.primary : colors.textTertiary}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={[
                              styles.categoryText,
                              isSelected && styles.categoryTextSelected,
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Detail Input */}
                  <Text style={styles.sectionLabel}>상세 내용 (선택)</Text>
                  <TextInput
                    style={styles.textInput}
                    multiline
                    numberOfLines={4}
                    placeholder="신고 사유를 구체적으로 적어주시면 신속한 조치에 도움이 됩니다."
                    placeholderTextColor={colors.textTertiary}
                    value={detailText}
                    onChangeText={setDetailText}
                    maxLength={500}
                    textAlignVertical="top"
                    editable={!submitting}
                  />
                  <Text style={styles.charCount}>{detailText.length}/500</Text>

                  <Text style={styles.guideNotice}>
                    * 허위 신고 시 이용 제한 등의 불이익을 받을 수 있습니다.
                  </Text>
                </ScrollView>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={handleClose}
                    disabled={submitting}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelBtnText}>취소</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                    activeOpacity={0.85}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={colors.textInverse} />
                    ) : (
                      <Text style={styles.submitBtnText}>신고 접수</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardAvoid: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  targetInfo: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  targetNameHighlight: {
    fontWeight: '700',
    color: colors.primary,
  },
  scrollArea: {
    maxHeight: 380,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 6,
  },
  categoryGrid: {
    gap: 8,
    marginBottom: 14,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  categoryChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '30',
  },
  categoryText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  textInput: {
    height: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    lineHeight: 18,
  },
  charCount: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 8,
  },
  guideNotice: {
    fontSize: 11,
    color: colors.textTertiary,
    lineHeight: 15,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
