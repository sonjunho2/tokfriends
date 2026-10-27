// apps/mobile/src/components/ReportModal.js
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import { apiClient } from '../api/client';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// 당근 스타일 게시글 신고 사유 목록 및 가이드
const POST_REPORT_REASONS = [
  {
    id: 'privacy',
    title: '사생활, 초상권 등 타인의 권리를 침해하는 글이에요',
    desc: '타인의 개인정보, 사진, 연락처 등이 동의 없이 노출되었거나 사생활을 침해하는 경우 신고해 주세요.',
    examples: [
      '동의 없이 타인의 사진, 얼굴, 개인정보를 게시한 경우',
      '타인의 주소, 전화번호, SNS 계정을 무단 유출한 경우',
      '명예훼손 및 허위사실 유포로 권리를 침해한 경우',
    ],
  },
  {
    id: 'copyright',
    title: '지적재산권을 침해하는 글이에요',
    desc: '저작권, 상표권 등 타인의 지적재산권을 무단으로 도용하거나 침해한 경우 신고해 주세요.',
    examples: [
      '타인의 창작물, 사진, 글을 무단으로 복제하여 게시한 경우',
      '가품, 위조품 판매 또는 저작권 위반 미디어를 공유한 경우',
    ],
  },
  {
    id: 'job_ad',
    title: '구인구직 · 불법 알바 게시글이에요',
    desc: '승인되지 않은 불법 구인구직, 다단계, 성매매 유인 목적의 구인 글인 경우 신고해 주세요.',
    examples: [
      '고수익 보장, 다단계, 코인 리딩방 유도 알바',
      '성인 아르바이트 및 유흥업소 관련 구인 글',
    ],
  },
  {
    id: 'investment',
    title: '투자상품을 권유하거나 수익성을 강조하는 글이에요',
    desc: '가상자산, 주식 리딩방, 불법 금융투자 유도 및 유사수신 행위 게시글을 신고해 주세요.',
    examples: [
      '원금 보장, 일 10% 수익 등 허위 과장 투자 홍보',
      '텔레그램, 오픈채팅방 링크로 유도하는 투자 권유',
    ],
  },
  {
    id: 'commercial',
    title: '광고 · 홍보 글이에요',
    desc: '커뮤니티 목적에 맞지 않는 상업적 스팸, 쇼핑몰 링크 홍보 글인 경우 신고해 주세요.',
    examples: [
      '동일한 홍보 문구를 반복적으로 도배하는 글',
      '제휴 마케팅 링크, 수익형 블로그 링크 홍보',
    ],
  },
  {
    id: 'app_redirect',
    title: '다른 어플에서 활동하도록 유도해요',
    desc: '다양한 핑계로 다른 앱 설치를 요구하거나 외부 메신저로 유도하여 안전을 위협하는 경우 신고해 주세요.',
    examples: [
      '악성 APK 파일 다운로드 링크를 게시한 경우',
      '타 소개팅 앱, 불법 사이트 가입을 종용하는 경우',
    ],
  },
  {
    id: 'violence_adult',
    title: '폭력 · 선정적인 내용이나 사진이 포함된 글이에요',
    desc: '음란물, 성적 수치심을 유발하는 표현, 잔혹하거나 폭력적인 미디어가 포함된 경우 신고해 주세요.',
    examples: [
      '신체 노출 사진 및 성적 불쾌감을 주는 성인용 미디어',
      '욕설, 자해, 동물학대, 폭력적인 사진 및 묘사',
    ],
  },
  {
    id: 'hate_speech',
    title: '욕설 · 비방 · 혐오표현을 해요',
    desc: '특정 회원이나 집단에 대해 모욕, 비방, 혐오 발언을 게시한 경우 신고해 주세요.',
    examples: [
      '특정 이웃을 지목하여 비난하거나 비방하는 글',
      '지역, 성별, 연령, 인종 등을 차별하거나 비하하는 혐오 표현',
    ],
  },
  {
    id: 'other',
    title: '기타 커뮤니티 가이드라인 위반 글이에요',
    desc: '그 외 모꼬 이웃 커뮤니티의 건전한 운영을 방해하거나 부적절한 게시글인 경우 신고해 주세요.',
    examples: [
      '허위 사실 유포 및 사회적 불안을 조장하는 글',
      '분란을 야기하거나 도배성으로 등록된 글',
    ],
  },
];

// 당근 스타일 사용자/채팅/라이브 신고 사유 목록 및 가이드
const USER_REPORT_REASONS = [
  {
    id: 'manner',
    title: '비매너 사용자예요',
    desc: '상대방을 존중하지 않고 불친절하거나 비매너적인 태도로 불쾌감을 주는 경우 신고해 주세요.',
    examples: [
      '약속을 일방적으로 파기하거나 잠수를 타는 행위',
      '반말, 조롱, 공격적인 어투로 불쾌감을 주는 행위',
    ],
  },
  {
    id: 'hate_speech',
    title: '욕설 · 비방 · 혐오표현을 해요',
    desc: '어떤 상황에서도 욕설, 비방, 혐오표현 등의 언행을 지양하고 있어요. 상대방의 언행으로 속상하셨다면 신고할 수 있어요.',
    examples: [
      '인신공격성 발언, 모욕적인 욕설을 하는 행위',
      '성별, 지역, 외모 등을 비하하거나 혐오감을 표출하는 행위',
    ],
  },
  {
    id: 'sexual',
    title: '원치않는 연애 · 성적 대화 또는 만남을 요구해요',
    desc: '상대가 원치 않는 연애 · 성적 목적의 대화나 행동을 시도할 때 이 항목으로 신고해 주세요.',
    examples: [
      '개인적인 만남이나 신체 접촉을 반복적으로 요구하는 대화',
      '성적인 내용이나 사진을 보내 상대에게 수치심 또는 혐오감을 줄 수 있는 언행',
      '거절하거나 응답하지 않았는데 계속 연락해 불안감 또는 스트레스를 주는 행위',
    ],
  },
  {
    id: 'fraud',
    title: '사기 피해를 입었어요 / 금전을 요구해요',
    desc: '금전 차용, 온(ON) 상품권 편취, 사기 피해를 유발하는 행위를 신고해 주세요.',
    examples: [
      '돈을 빌려달라고 하거나 기프티콘, 포인트를 요구하는 행위',
      '계좌이체, 상품권 번호 등을 요구하며 사기 행위를 시도하는 경우',
    ],
  },
  {
    id: 'app_redirect',
    title: '다른 어플에서 활동하도록 유도해요',
    desc: '외부 메신저(카카오톡, 라인, 텔레그램)나 외부 앱으로 이동을 강요하여 안전을 위협하는 경우 신고해 주세요.',
    examples: [
      '첫 대화부터 외부 메신저 아이디를 주며 대화를 강요하는 경우',
      '타 사이트 가입이나 특정 앱 설치 링크를 전달하는 경우',
    ],
  },
  {
    id: 'other',
    title: '부적절한 행위가 있어요',
    desc: '도용, 사칭, 허위 프로필 등 기타 안전하지 않은 행위가 의심되는 경우 신고해 주세요.',
    examples: [
      '타인의 사진이나 신분을 도용하여 사칭하는 행위',
      '미성년자 음주/흡연 유도 또는 불법 행위를 조장하는 행위',
    ],
  },
];

export default function ReportModal({
  visible,
  targetName = '회원',
  targetType = 'post', // 'post' | 'user' | 'chat' | 'room'
  targetId = '',
  targetUserId = '',
  targetAccountId = '',
  postId = '',
  onClose,
  onSubmit,
}) {
  const insets = useSafeAreaInsets();
  const isPostType = targetType === 'post';
  const reasonList = isPostType ? POST_REPORT_REASONS : USER_REPORT_REASONS;

  // Step 1: 사유 선택, Step 2: 상세 작성 및 확인
  const [step, setStep] = useState(1);
  const [selectedReason, setSelectedReason] = useState(null);
  const [detailText, setDetailText] = useState('');
  const [blockUser, setBlockUser] = useState(true); // 당근 기본값: 차단 체크 권장
  const [submitting, setSubmitting] = useState(false);

  const resetState = () => {
    setStep(1);
    setSelectedReason(null);
    setDetailText('');
    setBlockUser(true);
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) return;
    resetState();
    onClose?.();
  };

  const handleSelectReason = (item) => {
    setSelectedReason(item);
    setStep(2);
  };

  const handleBackToStep1 = () => {
    if (submitting) return;
    Keyboard.dismiss();
    setStep(1);
  };

  const handleSubmit = async () => {
    if (submitting || !selectedReason) return;

    const fullReason = detailText.trim()
      ? `[${selectedReason.title}] ${detailText.trim()}`
      : `[${selectedReason.title}]`;

    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({
          category: selectedReason.title,
          reason: fullReason,
          detail: detailText.trim(),
          blockUser,
        });
      } else {
        // 기본 API 전송 파이프라인
        if (isPostType || postId) {
          await apiClient.reportPost({
            postId: postId || targetId,
            targetUserId: targetUserId || undefined,
            reason: fullReason,
            blockUser,
          });
        } else {
          await apiClient.reportUser({
            targetUserId: targetUserId || targetId,
            targetAccountId: targetAccountId || undefined,
            reason: fullReason,
            blockUser,
          });
        }
        Alert.alert(
          '신고가 접수되었습니다',
          '관리자가 내용을 검토한 후 운영정책에 따라 신속히 조치하겠습니다.',
          [{ text: '확인', onPress: handleClose }]
        );
        return;
      }

      handleClose();
    } catch (err) {
      Alert.alert('신고 실패', err?.message || '신고 접수 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidWrap}
        >
          <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {/* Header */}
            <View style={styles.header}>
              {step === 2 ? (
                <TouchableOpacity
                  style={styles.headerBackBtn}
                  onPress={handleBackToStep1}
                  hitSlop={10}
                  disabled={submitting}
                >
                  <Ionicons name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>
              ) : (
                <View style={styles.headerSpacer} />
              )}

              <Text style={styles.headerTitle} numberOfLines={1}>
                {step === 1
                  ? isPostType
                    ? '게시글을 신고하는 이유를 선택해주세요'
                    : '사용자를 신고하는 이유를 선택해주세요'
                  : '신고 사유 확인'}
              </Text>

              <TouchableOpacity
                style={styles.headerCloseBtn}
                onPress={handleClose}
                hitSlop={10}
                disabled={submitting}
              >
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* =========================================================
                STEP 1: 신고 사유 선택 목록 (당근 1단계 화면)
                ========================================================= */}
            {step === 1 && (
              <ScrollView
                style={styles.step1List}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.step1Content}
              >
                {reasonList.map((item, idx) => (
                  <TouchableOpacity
                    key={item.id || idx}
                    style={styles.reasonRow}
                    activeOpacity={0.7}
                    onPress={() => handleSelectReason(item)}
                  >
                    <Text style={styles.reasonRowText}>{item.title}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* =========================================================
                STEP 2: 상세 가이드 및 입력/차단 확인 (당근 2단계 화면)
                ========================================================= */}
            {step === 2 && selectedReason && (
              <ScrollView
                style={styles.step2ScrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.step2Content}
                keyboardShouldPersistTaps="handled"
              >
                {/* 선택한 사유 제목 */}
                <Text style={styles.selectedReasonTitle}>{selectedReason.title}</Text>

                {/* 가이드 설명 */}
                <Text style={styles.selectedReasonDesc}>{selectedReason.desc}</Text>

                {/* 예시 사례 박스 */}
                {Array.isArray(selectedReason.examples) && selectedReason.examples.length > 0 && (
                  <View style={styles.exampleBox}>
                    <Text style={styles.exampleBoxHeader}>예를 들어, 아래와 같은 경우에 해당해요.</Text>
                    {selectedReason.examples.map((ex, i) => (
                      <Text key={`ex_${i}`} style={styles.exampleItemText}>
                        • {ex}
                      </Text>
                    ))}
                    <Text style={styles.exampleNoteText}>
                      * 서로의 동의 하에 나눈 단순 의견 차이나 일상 대화는 신고 대상이 아닐 수 있어요.
                    </Text>
                  </View>
                )}

                {/* 상세 설명 입력란 */}
                <View style={styles.inputSection}>
                  <View style={styles.inputHeaderRow}>
                    <Text style={styles.inputLabel}>상세 설명 (필수)</Text>
                    <Text style={styles.charCount}>{detailText.length}/300</Text>
                  </View>
                  <TextInput
                    style={styles.detailInput}
                    placeholder="신고 내용을 구체적으로 입력해 주세요."
                    placeholderTextColor="#9CA3AF"
                    value={detailText}
                    onChangeText={(t) => setDetailText(t.slice(0, 300))}
                    multiline
                    numberOfLines={4}
                    maxLength={300}
                  />
                </View>

                {/* 이 사용자의 글 더 이상 보지 않기 (차단 체크박스) */}
                <TouchableOpacity
                  style={styles.blockCheckRow}
                  activeOpacity={0.8}
                  onPress={() => setBlockUser(!blockUser)}
                >
                  <Ionicons
                    name={blockUser ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={blockUser ? '#FF6F0F' : '#9CA3AF'}
                  />
                  <Text style={styles.blockCheckLabel}>이 사용자의 글을 더 이상 보지 않기 (차단)</Text>
                </TouchableOpacity>

                <Text style={styles.blockNoticeText}>
                  이 항목으로 신고하면 서로의 게시글이 보이지 않고, 서로 더 이상 채팅을 보낼 수 없어요.
                </Text>

                {/* 신고하기 제출 버튼 (모꼬 브랜드) */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!detailText.trim() || submitting) && styles.submitButtonDisabled,
                  ]}
                  activeOpacity={0.85}
                  disabled={!detailText.trim() || submitting}
                  onPress={handleSubmit}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>신고하기</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidWrap: {
    width: '100%',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.9,
    paddingTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  headerCloseBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Step 1: 사유 목록
  step1List: {
    maxHeight: SCREEN_HEIGHT * 0.65,
  },
  step1Content: {
    paddingBottom: 24,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reasonRowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    letterSpacing: -0.2,
    paddingRight: 12,
    lineHeight: 22,
  },
  // Step 2: 상세 화면
  step2ScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.72,
  },
  step2Content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  selectedReasonTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  selectedReasonDesc: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 21,
    marginBottom: 16,
  },
  exampleBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exampleBoxHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  exampleItemText: {
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 19,
    marginBottom: 4,
  },
  exampleNoteText: {
    fontSize: 11.5,
    color: '#9CA3AF',
    marginTop: 6,
    lineHeight: 16,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  detailInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  blockCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  blockCheckLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  blockNoticeText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 20,
    paddingLeft: 30,
  },
  submitButton: {
    backgroundColor: '#FF6F0F', // 당근마켓 시그니처 웜 오렌지
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6F0F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
