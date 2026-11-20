// apps/mobile/src/screens/my/CustomerCenterScreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function CustomerCenterScreen({ navigation }: any) {
  const { user } = useAuth();
  const nickname = user?.nickname || user?.displayName || '모꼬이웃';

  // FAQ 목록 상태
  const [faqs, setFaqs] = useState<any[]>([
    {
      id: 'faq-1',
      category: 'ON_STORE',
      question: '결제한 온(ON) 코인은 어떻게 환불받을 수 있나요?',
      answer:
        '충전 후 미사용한 온(ON) 코인은 결제일로부터 7일 이내에 고객센터 문의를 통해 전액 결제취소 및 환불이 가능합니다. 단, 일부라도 선물/채팅에 사용된 코인은 환불 대상에서 제외될 수 있습니다.',
    },
    {
      id: 'faq-2',
      category: 'SETTLEMENT',
      question: '크리에이터 출금 환전 시 실수령액과 원천징수세(3.3%)는 어떻게 계산되나요?',
      answer:
        '라이브 후원 및 채팅을 통해 획득한 모꼬 꿀떡은 1P = 1원 기준으로 현금 환전 정산이 가능합니다. 사업소득세 3% 및 지방소득세 0.3% 총 3.3%가 원천징수 공제된 후 등록하신 계좌로 입금됩니다.',
    },
    {
      id: 'faq-3',
      category: 'SAFETY',
      question: '불쾌한 언행이나 비매너 회원을 마주쳤을 때 어떻게 조치해야 하나요?',
      answer:
        '해당 유저의 프로필 또는 채팅방 우측 상단 더보기 [⋮] 메뉴에서 [차단하기] 또는 [신고하기]를 즉시 진행하실 수 있습니다. AI 안전 모니터링 시스템과 24시간 운영팀이 확인 후 즉시 이용 제한 조치합니다.',
    },
    {
      id: 'faq-4',
      category: 'CHAT_LIVE',
      question: '3D 선물 이펙트가 방송 화면에 보이지 않아요.',
      answer:
        '저전력 모드가 켜져 있거나 기기 그래픽 가속 설정에 따라 3D 파티클 이펙트가 간소화되어 표시될 수 있습니다. 설정 > 그래픽 효과가 켜져 있는지 확인해 주세요.',
    },
    {
      id: 'faq-5',
      category: 'ESCROW',
      question: '중고거래 안심 에스크로 결제는 어떻게 진행되나요?',
      answer:
        '구매자가 대금을 결제하면 모꼬 안전 에스크로 금고에 안전하게 보관되며, 물품을 전달받고 구매확정을 누르면 판매자에게 정산금이 즉시 지급됩니다.',
    },
  ]);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // 1:1 문의 모달
  const [inquiryModalVisible, setInquiryModalVisible] = useState(false);
  const [inquiryCategory, setInquiryCategory] = useState('거래/결제');
  const [inquiryContact, setInquiryContact] = useState(user?.phoneNumber || '');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiClient
      .getFaqs()
      .then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          setFaqs(items);
        }
      })
      .catch(() => {});
  }, []);

  const toggleFaq = (id: string) => {
    setExpandedFaqId((prev) => (prev === id ? null : id));
  };

  const handleSubmitInquiry = async () => {
    if (!inquiryMessage.trim()) {
      Alert.alert('입력 안내', '문의 내용을 입력해주세요.');
      return;
    }
    try {
      setSubmitting(true);
      await apiClient.submitSupportTicket({
        category: inquiryCategory,
        contact: inquiryContact.trim(),
        userName: nickname,
        message: inquiryMessage.trim(),
      });
      setSubmitting(false);
      setInquiryModalVisible(false);
      setInquiryMessage('');
      Alert.alert(
        '접수 완료',
        '1:1 고객 문의가 정상 접수되었습니다.\n운영팀이 확인 후 신속하게 답변해 드리겠습니다.'
      );
    } catch (e: any) {
      setSubmitting(false);
      Alert.alert('접수 오류', e?.message || '잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={tokens.colors.surface} />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={8}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={24} color={tokens.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>고객센터 & FAQ</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1:1 고객 문의 카드 */}
        <TouchableOpacity
          style={styles.inquiryCard}
          activeOpacity={0.88}
          onPress={() => setInquiryModalVisible(true)}
        >
          <View style={styles.inquiryIconWrap}>
            <Ionicons name="headset" size={24} color={tokens.colors.primary} />
          </View>
          <View style={styles.inquiryTextWrap}>
            <Text style={styles.inquiryCardTitle}>1:1 고객센터 문의하기</Text>
            <Text style={styles.inquiryCardDesc}>운영팀이 실시간으로 확인 후 친절히 도와드립니다.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={tokens.colors.textTertiary} />
        </TouchableOpacity>

        {/* 운영시간 안내 박스 */}
        <View style={styles.operatingBox}>
          <Ionicons name="information-circle-outline" size={16} color={tokens.colors.textSecondary} />
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={styles.operatingTitle}>고객센터 운영시간: 평일 09:30 ~ 18:30</Text>
            <Text style={styles.operatingDesc}>주말 및 공휴일은 긴급 안전 신고 위주로 처리됩니다.</Text>
          </View>
        </View>

        {/* FAQ 섹션 */}
        <View style={styles.faqHeader}>
          <Text style={styles.faqSectionTitle}>자주 묻는 질문 (FAQ)</Text>
          <Text style={styles.faqSectionCount}>총 {faqs.length}건</Text>
        </View>

        <View style={styles.faqList}>
          {faqs.map((faq) => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <View key={faq.id} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqQuestionRow}
                  activeOpacity={0.8}
                  onPress={() => toggleFaq(faq.id)}
                >
                  <View style={styles.faqCategoryBadge}>
                    <Text style={styles.faqCategoryText}>{faq.category || 'FAQ'}</Text>
                  </View>
                  <Text style={styles.faqQuestionText} numberOfLines={isExpanded ? undefined : 2}>
                    {faq.question}
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={tokens.colors.textTertiary}
                  />
                </TouchableOpacity>

                {isExpanded ? (
                  <View style={styles.faqAnswerBox}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* 1:1 문의 작성 모달 */}
      <Modal
        visible={inquiryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInquiryModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>1:1 고객 문의 작성</Text>
              <TouchableOpacity
                onPress={() => setInquiryModalVisible(false)}
                hitSlop={8}
              >
                <Ionicons name="close" size={24} color={tokens.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>문의 유형</Text>
              <View style={styles.categoryChipRow}>
                {['거래/결제', '계정/인증', '라이브/채팅', '오류/기타'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      inquiryCategory === cat && styles.categoryChipActive,
                    ]}
                    onPress={() => setInquiryCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        inquiryCategory === cat && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>연락처 (전화번호 / 이메일)</Text>
              <TextInput
                style={styles.input}
                value={inquiryContact}
                onChangeText={setInquiryContact}
                placeholder="답변 받으실 연락처를 입력해주세요."
                placeholderTextColor={tokens.colors.textTertiary}
              />

              <Text style={styles.inputLabel}>문의 내용</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={inquiryMessage}
                onChangeText={setInquiryMessage}
                placeholder="상세한 문의 내용을 입력해주세요. (최대 1,000자)"
                placeholderTextColor={tokens.colors.textTertiary}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmitInquiry}
                disabled={submitting}
                activeOpacity={0.88}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>문의 접수하기</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.textPrimary,
  },
  scrollContent: {
    padding: tokens.spacing.md,
    paddingBottom: 40,
  },
  inquiryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderRadius: tokens.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  inquiryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inquiryTextWrap: {
    flex: 1,
    marginLeft: tokens.spacing.md,
  },
  inquiryCardTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.primary,
    marginBottom: 2,
  },
  inquiryCardDesc: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.textSecondary,
  },
  operatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.surfaceAlt,
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
  },
  operatingTitle: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.textPrimary,
  },
  operatingDesc: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.textTertiary,
    marginTop: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.sm,
  },
  faqSectionTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.textPrimary,
  },
  faqSectionCount: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.textTertiary,
  },
  faqList: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    overflow: 'hidden',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.md,
  },
  faqCategoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: tokens.borderRadius.xs,
    backgroundColor: tokens.colors.surfaceAlt,
    marginRight: 8,
  },
  faqCategoryText: {
    fontSize: 10,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.textSecondary,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.textPrimary,
    lineHeight: 18,
    marginRight: 8,
  },
  faqAnswerBox: {
    backgroundColor: tokens.colors.surfaceAlt,
    padding: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  faqAnswerText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.textSecondary,
    lineHeight: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: tokens.colors.surface,
    borderTopLeftRadius: tokens.borderRadius.xl,
    borderTopRightRadius: tokens.borderRadius.xl,
    padding: tokens.spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  modalTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.textPrimary,
  },
  inputLabel: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.textSecondary,
    marginBottom: 6,
    marginTop: tokens.spacing.sm,
  },
  categoryChipRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: tokens.spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: tokens.borderRadius.full,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
  },
  categoryChipActive: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  categoryChipText: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: tokens.typography.fontWeight.bold,
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.borderRadius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 10,
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.textPrimary,
    backgroundColor: tokens.colors.surface,
  },
  textArea: {
    height: 120,
    paddingTop: 10,
  },
  submitBtn: {
    backgroundColor: tokens.colors.primary,
    paddingVertical: 14,
    borderRadius: tokens.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: tokens.spacing.lg,
    marginBottom: 20,
  },
  submitBtnText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
});
