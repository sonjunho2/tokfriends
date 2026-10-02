// apps/mobile/src/screens/my/SettlementScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';

const MAJOR_BANKS = [
  '국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  '카카오뱅크',
  '토스뱅크',
  '농협은행',
  '기업은행',
];

export default function SettlementScreen({ navigation }) {
  const { user, refreshMe } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Settlement Overview data
  const [overview, setOverview] = useState({
    redeemableBalance: 0,
    pendingEarnings: 0,
    spendableBalance: 0,
    minSettlementPoints: 10000,
    taxRatePercent: 3.3,
    recentRequests: [],
  });

  // Form input state
  const [amountInput, setAmountInput] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState(
    user?.profile?.nickname || user?.displayName || '',
  );

  // Active tab: 'request' (신청) vs 'history' (내역)
  const [activeTab, setActiveTab] = useState('request');

  const loadOverview = useCallback(async () => {
    try {
      const data = await apiClient.getSettlementOverview();
      if (data) {
        setOverview({
          redeemableBalance: data.redeemableBalance ?? 0,
          pendingEarnings: data.pendingEarnings ?? 0,
          spendableBalance: data.spendableBalance ?? 0,
          minSettlementPoints: data.minSettlementPoints ?? 10000,
          taxRatePercent: data.taxRatePercent ?? 3.3,
          recentRequests: Array.isArray(data.recentRequests) ? data.recentRequests : [],
        });
      }
    } catch (e) {
      console.warn('Failed to load settlement overview', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOverview();
    if (typeof refreshMe === 'function') {
      refreshMe();
    }
  }, [loadOverview, refreshMe]);

  // Tax calculation
  const parsedAmount = parseInt(amountInput.replace(/\D/g, ''), 10) || 0;
  const taxAmount = Math.round(parsedAmount * 0.033);
  const netEstimatedAmount = Math.max(0, parsedAmount - taxAmount);

  const handleAddAmount = (add) => {
    const next = Math.min(overview.redeemableBalance || 0, parsedAmount + add);
    setAmountInput(String(next));
  };

  const handleResetAmount = () => {
    setAmountInput('');
  };

  const handleAccountNumberChange = (text) => {
    const numeric = text.replace(/[^0-9]/g, '');
    setAccountNumber(numeric);
  };

  // Handle Submit Settlement Request
  const handleSubmit = async () => {
    const minPoints = overview.minSettlementPoints || 10000;
    if (parsedAmount < minPoints) {
      Alert.alert('출금 안내', `최소 출금 신청 포인트는 ${minPoints.toLocaleString()}P입니다.`);
      return;
    }
    if (parsedAmount > overview.redeemableBalance) {
      Alert.alert('잔액 부족', '출금 가능 수익 포인트를 초과하여 신청할 수 없습니다.');
      return;
    }
    if (!bankName.trim()) {
      Alert.alert('입력 확인', '입금 받으실 은행명을 선택 또는 입력해 주세요.');
      return;
    }
    if (!accountNumber.trim()) {
      Alert.alert('입력 확인', '계좌번호를 입력해 주세요.');
      return;
    }
    if (!accountHolder.trim()) {
      Alert.alert('입력 확인', '예금주 성명을 입력해 주세요.');
      return;
    }

    Alert.alert(
      '출금 신청 확인',
      `신청 포인트: ${parsedAmount.toLocaleString()}P\n원천징수(3.3%): -${taxAmount.toLocaleString()}원\n실 입금액: ${netEstimatedAmount.toLocaleString()}원\n\n입금 계좌: ${bankName.trim()} ${accountNumber.trim()} (예금주: ${accountHolder.trim()})\n\n정말로 출금 신청을 진행하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '신청하기',
          onPress: async () => {
            setSubmitting(true);
            try {
              await apiClient.requestSettlement({
                pointsAmount: parsedAmount,
                bankName: bankName.trim(),
                accountNumber: accountNumber.trim(),
                accountHolder: accountHolder.trim(),
              });
              Alert.alert(
                '출금 신청 완료',
                '출금 신청이 정상적으로 접수되었습니다.\n영업일 기준 1~3일 이내에 관리자 심사 후 등록하신 계좌로 입금됩니다.',
                [{ text: '확인', onPress: () => setActiveTab('history') }],
              );
              setAmountInput('');
              await Promise.allSettled([loadOverview(), refreshMe ? refreshMe() : Promise.resolve()]);
            } catch (e) {
              Alert.alert('신청 실패', e?.message || '출금 신청 처리 중 오류가 발생했습니다.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>정산 정보를 불러오고 있습니다...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary || '#191919'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>크리에이터 수익 정산</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Revenue Balance Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="wallet" size={20} color="#059669" />
                <Text style={styles.summaryTopTitle}>내 크리에이터 수익금</Text>
              </View>
              <View style={styles.taxBadge}>
                <Text style={styles.taxBadgeText}>원천징수 3.3% 적용</Text>
              </View>
            </View>

            <View style={styles.summaryMainRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>출금 가능 수익</Text>
                <Text style={styles.summaryAmountHighlight}>
                  {(overview.redeemableBalance || 0).toLocaleString()}
                  <Text style={styles.summaryUnit}> P</Text>
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>심사/정산 대기</Text>
                <Text style={[styles.summaryAmountHighlight, { color: '#D97706' }]}>
                  {(overview.pendingEarnings || 0).toLocaleString()}
                  <Text style={styles.summaryUnit}> P</Text>
                </Text>
              </View>
            </View>

            <View style={styles.summaryNoticeRow}>
              <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
              <Text style={styles.summaryNoticeText}>
                1P = 1원으로 환산되며, 최소 {overview.minSettlementPoints?.toLocaleString()}P부터 출금 신청이 가능합니다.
              </Text>
            </View>
          </View>

          {/* Tab Selector: 신청하기 vs 신청 내역 */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'request' && styles.tabButtonActive]}
              onPress={() => setActiveTab('request')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'request' && styles.tabTextActive]}>
                출금 신청하기
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
              onPress={() => setActiveTab('history')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                신청 내역 ({overview.recentRequests?.length || 0})
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'request' ? (
            /* TAB 1: 출금 신청 양식 */
            <View style={styles.formContainer}>
              {/* 포인트 입력 필드 */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>출금 신청 포인트</Text>
                  <TouchableOpacity
                    onPress={() => setAmountInput(String(overview.redeemableBalance || 0))}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.allInText}>전액 입력</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="최소 10,000P 이상 입력"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={amountInput}
                    onChangeText={setAmountInput}
                  />
                  <Text style={styles.inputAffix}>P</Text>
                </View>

                {/* 빠른 증액 칩 */}
                <View style={styles.amountChipRow}>
                  <TouchableOpacity
                    style={styles.amountChip}
                    onPress={() => handleAddAmount(10000)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.amountChipText}>+1만P</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.amountChip}
                    onPress={() => handleAddAmount(50000)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.amountChipText}>+5만P</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.amountChip}
                    onPress={() => handleAddAmount(100000)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.amountChipText}>+10만P</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.amountChip, styles.amountChipReset]}
                    onPress={handleResetAmount}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.amountChipResetText}>초기화</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 실시간 세금 계산 카드 */}
              {parsedAmount > 0 && (
                <View style={styles.calcCard}>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>환전 기준액</Text>
                    <Text style={styles.calcVal}>{parsedAmount.toLocaleString()}원</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={[styles.calcLabel, { color: '#EF4444' }]}>원천징수세액 (3.3%)</Text>
                    <Text style={[styles.calcVal, { color: '#EF4444' }]}>
                      -{taxAmount.toLocaleString()}원
                    </Text>
                  </View>
                  <View style={styles.calcDivider} />
                  <View style={styles.calcRow}>
                    <Text style={styles.calcNetLabel}>실제 입금 예정액</Text>
                    <Text style={styles.calcNetVal}>{netEstimatedAmount.toLocaleString()}원</Text>
                  </View>
                </View>
              )}

              {/* 계좌 정보 입력 */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>입금 은행</Text>
                {/* 주요 은행 칩 */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.bankChipScroll}
                >
                  {MAJOR_BANKS.map((bank) => {
                    const isSelected = bankName === bank;
                    return (
                      <TouchableOpacity
                        key={bank}
                        style={[styles.bankChip, isSelected && styles.bankChipActive]}
                        onPress={() => setBankName(bank)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.bankChipText, isSelected && styles.bankChipTextActive]}>
                          {bank}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TextInput
                  style={[styles.textInput, { marginTop: 8 }]}
                  placeholder="또는 직접 은행명 입력"
                  placeholderTextColor="#9CA3AF"
                  value={bankName}
                  onChangeText={setBankName}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>계좌번호</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="숫자만 입력 (하이픈 자동 처리)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={accountNumber}
                  onChangeText={handleAccountNumberChange}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>예금주 성명</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="본인 실명 입력"
                  placeholderTextColor="#9CA3AF"
                  value={accountHolder}
                  onChangeText={setAccountHolder}
                />
                <Text style={styles.fieldHelper}>
                  * 반드시 본인 명의의 계좌만 승인되며 타인 명의 계좌는 반려될 수 있습니다.
                </Text>
              </View>

              {/* 신청 제출 버튼 */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (submitting || parsedAmount < 10000 || !bankName || !accountNumber || !accountHolder) &&
                    styles.submitBtnDisabled,
                ]}
                disabled={
                  submitting ||
                  parsedAmount < 10000 ||
                  !bankName ||
                  !accountNumber ||
                  !accountHolder
                }
                activeOpacity={0.85}
                onPress={handleSubmit}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#191919" />
                ) : (
                  <Text style={styles.submitBtnText}>출금 신청하기</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* TAB 2: 신청 내역 */
            <View style={styles.historyContainer}>
              {overview.recentRequests.length === 0 ? (
                <View style={styles.emptyHistoryBox}>
                  <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyHistoryTitle}>신청 내역이 없습니다.</Text>
                  <Text style={styles.emptyHistorySubtitle}>
                    크리에이터 수익을 모아 첫 출금을 신청해보세요!
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyHistoryBtn}
                    onPress={() => setActiveTab('request')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.emptyHistoryBtnText}>첫 출금 신청하러 가기</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                overview.recentRequests.map((req) => {
                  const isApproved = req.status === 'APPROVED';
                  const isRejected = req.status === 'REJECTED';
                  const statusText = isApproved ? '승인완료' : isRejected ? '반려됨' : '심사중';
                  const statusBadgeStyle = isApproved
                    ? styles.badgeApproved
                    : isRejected
                    ? styles.badgeRejected
                    : styles.badgePending;
                  const statusTextStyle = isApproved
                    ? styles.badgeTextApproved
                    : isRejected
                    ? styles.badgeTextRejected
                    : styles.badgeTextPending;

                  return (
                    <View key={req.id} style={styles.historyCard}>
                      <View style={styles.historyCardHeader}>
                        <View style={statusBadgeStyle}>
                          <Text style={statusTextStyle}>{statusText}</Text>
                        </View>
                        <Text style={styles.historyDate}>
                          {new Date(req.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>

                      <View style={styles.historyCardBody}>
                        <View style={styles.historyRow}>
                          <Text style={styles.historyLabel}>신청 금액</Text>
                          <Text style={styles.historyAmount}>
                            {Number(req.pointsAmount).toLocaleString()}P
                          </Text>
                        </View>
                        <View style={styles.historyRow}>
                          <Text style={styles.historyLabel}>입금 계좌</Text>
                          <Text style={styles.historyValue}>
                            {req.bankName} {req.accountNumber} ({req.accountHolder})
                          </Text>
                        </View>

                        {Boolean(req.rejectReason) && (
                          <View style={styles.rejectReasonBox}>
                            <Ionicons name="alert-circle" size={14} color="#EF4444" />
                            <Text style={styles.rejectReasonText}>
                              반려 사유: {req.rejectReason}
                            </Text>
                          </View>
                        )}

                        {Boolean(req.adminMemo) && (
                          <View style={styles.memoBox}>
                            <Ionicons name="checkmark-circle" size={14} color="#059669" />
                            <Text style={styles.memoText}>{req.adminMemo}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#191919',
    letterSpacing: -0.4,
  },
  summaryCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTopTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#191919',
  },
  taxBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  taxBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  summaryMainRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  summaryAmountHighlight: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: -0.5,
  },
  summaryUnit: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  summaryNoticeRow: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryNoticeText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
    lineHeight: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    fontWeight: '800',
    color: '#191919',
  },
  formContainer: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    gap: 18,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191919',
  },
  allInText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: '#191919',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputAffix: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
  },
  calcCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    gap: 8,
  },
  calcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calcLabel: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  calcVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191919',
  },
  calcDivider: {
    height: 1,
    backgroundColor: '#DCFCE7',
    marginVertical: 2,
  },
  calcNetLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  calcNetVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  bankChipScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  bankChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  bankChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  bankChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  bankChipTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  fieldHelper: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  submitBtn: {
    marginTop: 8,
    height: 52,
    backgroundColor: colors.primary || '#FEE500',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  submitBtnDisabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#191919',
  },
  historyContainer: {
    margin: 16,
    gap: 12,
  },
  emptyHistoryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyHistoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B5563',
  },
  emptyHistorySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 12,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeTextPending: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  badgeApproved: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeTextApproved: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  badgeRejected: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeTextRejected: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  historyDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  historyCardBody: {
    gap: 6,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#191919',
  },
  historyValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  rejectReasonBox: {
    marginTop: 6,
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rejectReasonText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    flex: 1,
  },
  memoBox: {
    marginTop: 6,
    padding: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memoText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    flex: 1,
  },
  amountChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  amountChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  amountChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  amountChipReset: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    marginLeft: 'auto',
  },
  amountChipResetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  emptyHistoryBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.primary || '#FEE500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistoryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#191919',
  },
});
