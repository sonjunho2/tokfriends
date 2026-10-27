// apps/mobile/src/screens/my/SettlementScreen.js
import React, { useCallback, useEffect, useState } from 'react';
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

export default function SettlementScreen({ navigation, route }) {
  const { user, refreshMe } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // activeTab: 'market' (중고/마켓 원화 출금), 'points' (모꼬 포인트 환전), 'history' (신청 내역)
  const initialMode = route?.params?.initialTab || (route?.params?.type === 'points' ? 'points' : 'market');
  const [activeTab, setActiveTab] = useState(initialMode);

  // Settlement Overview data
  const [overview, setOverview] = useState({
    marketCashBalance: 185000, // 원화 정산금
    redeemableBalance: 4020, // 포인트 잔액
    pendingEarnings: 0,
    minSettlementPoints: 10000,
    minMarketCash: 1000,
    taxRatePercent: 3.3,
    recentRequests: [],
  });

  // Inputs for Market Cash withdrawal
  const [cashAmountInput, setCashAmountInput] = useState('');
  const [cashBankName, setCashBankName] = useState('국민은행');
  const [cashAccountNumber, setCashAccountNumber] = useState('');
  const [cashAccountHolder, setCashAccountHolder] = useState(
    user?.profile?.nickname || user?.displayName || '테스트게스트',
  );

  // Inputs for Points exchange
  const [pointsAmountInput, setPointsAmountInput] = useState('');
  const [pointsBankName, setPointsBankName] = useState('국민은행');
  const [pointsAccountNumber, setPointsAccountNumber] = useState('');
  const [pointsAccountHolder, setPointsAccountHolder] = useState(
    user?.profile?.nickname || user?.displayName || '테스트게스트',
  );

  const loadOverview = useCallback(async () => {
    try {
      const data = await apiClient.getSettlementOverview();
      if (data) {
        setOverview({
          marketCashBalance: Number(data.marketCashBalance ?? 185000),
          redeemableBalance: Number(data.redeemableBalance ?? user?.profile?.points ?? 4020),
          pendingEarnings: Number(data.pendingEarnings ?? 0),
          minSettlementPoints: Number(data.minSettlementPoints ?? 10000),
          minMarketCash: Number(data.minMarketCash ?? 1000),
          taxRatePercent: Number(data.taxRatePercent ?? 3.3),
          recentRequests: Array.isArray(data.recentRequests) ? data.recentRequests : [],
        });
      }
    } catch (e) {
      console.warn('Failed to load settlement overview', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

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

  // Points tax calculation
  const parsedPoints = parseInt(pointsAmountInput.replace(/\D/g, ''), 10) || 0;
  const pointsGrossKrw = parsedPoints; // 1 P = 1 KRW
  const pointsTaxAmount = Math.round(pointsGrossKrw * 0.033);
  const pointsNetKrw = Math.max(0, pointsGrossKrw - pointsTaxAmount);

  // Market Cash calculation
  const parsedCash = parseInt(cashAmountInput.replace(/\D/g, ''), 10) || 0;

  // Handle Market Cash withdrawal submit
  const handleCashSubmit = async () => {
    if (parsedCash < overview.minMarketCash) {
      Alert.alert('출금 안내', `최소 출금 신청 금액은 ${overview.minMarketCash.toLocaleString()}원입니다.`);
      return;
    }
    if (parsedCash > overview.marketCashBalance) {
      Alert.alert('잔액 부족', '출금 가능한 판매 정산금을 초과하여 신청할 수 없습니다.');
      return;
    }
    if (!cashBankName.trim() || !cashAccountNumber.trim() || !cashAccountHolder.trim()) {
      Alert.alert('입력 확인', '입금 받으실 은행명, 계좌번호, 예금주를 모두 입력해 주세요.');
      return;
    }

    Alert.alert(
      '원화 출금 신청 확인',
      `신청 금액: ${parsedCash.toLocaleString()}원\n수수료: 0원 (비과세 정산)\n실 입금액: ${parsedCash.toLocaleString()}원\n\n입금 계좌: ${cashBankName.trim()} ${cashAccountNumber.trim()} (예금주: ${cashAccountHolder.trim()})\n\n정말로 출금 신청을 진행하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '신청하기',
          onPress: async () => {
            setSubmitting(true);
            try {
              await apiClient.requestSettlement({
                type: 'MARKET_CASH',
                cashAmount: parsedCash,
                bankName: cashBankName.trim(),
                accountNumber: cashAccountNumber.trim(),
                accountHolder: cashAccountHolder.trim(),
              });
              Alert.alert(
                '출금 신청 완료',
                '판매 정산금 출금 신청이 정상 접수되었습니다.\n영업일 기준 1일 이내에 등록하신 계좌로 입금 처리됩니다.',
                [{ text: '확인', onPress: () => setActiveTab('history') }],
              );
              setCashAmountInput('');
              setOverview((prev) => ({
                ...prev,
                marketCashBalance: Math.max(0, prev.marketCashBalance - parsedCash),
              }));
              await Promise.allSettled([loadOverview(), refreshMe ? refreshMe() : Promise.resolve()]);
            } catch (e) {
              Alert.alert('신청 실패', e?.message || '출금 신청 중 오류가 발생했습니다.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  // Handle Points exchange submit
  const handlePointsSubmit = async () => {
    const minPoints = overview.minSettlementPoints || 10000;
    if (parsedPoints < minPoints) {
      Alert.alert('환전 안내', `최소 모꼬 포인트 환전 수량은 ${minPoints.toLocaleString()} P입니다.`);
      return;
    }
    if (parsedPoints > overview.redeemableBalance) {
      Alert.alert('잔액 부족', '환전 가능한 보유 포인트를 초과하여 신청할 수 없습니다.');
      return;
    }
    if (!pointsBankName.trim() || !pointsAccountNumber.trim() || !pointsAccountHolder.trim()) {
      Alert.alert('입력 확인', '입금 받으실 은행명, 계좌번호, 예금주를 모두 입력해 주세요.');
      return;
    }

    Alert.alert(
      '포인트 환전 신청 확인',
      `신청 포인트: ${parsedPoints.toLocaleString()} P\n환전 기준액: ${pointsGrossKrw.toLocaleString()}원\n원천징수세(3.3%): -${pointsTaxAmount.toLocaleString()}원\n실 입금액: ${pointsNetKrw.toLocaleString()}원\n\n입금 계좌: ${pointsBankName.trim()} ${pointsAccountNumber.trim()} (예금주: ${pointsAccountHolder.trim()})\n\n정말로 환전 신청을 진행하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '신청하기',
          onPress: async () => {
            setSubmitting(true);
            try {
              await apiClient.requestSettlement({
                type: 'POINTS_EXCHANGE',
                pointsAmount: parsedPoints,
                bankName: pointsBankName.trim(),
                accountNumber: pointsAccountNumber.trim(),
                accountHolder: pointsAccountHolder.trim(),
              });
              Alert.alert(
                '환전 신청 완료',
                '모꼬 포인트 환전 신청이 정상 접수되었습니다.\n사업소득세(3.3%) 원천징수 후 영업일 기준 1~3일 이내에 계좌로 입금됩니다.',
                [{ text: '확인', onPress: () => setActiveTab('history') }],
              );
              setPointsAmountInput('');
              setOverview((prev) => ({
                ...prev,
                redeemableBalance: Math.max(0, prev.redeemableBalance - parsedPoints),
              }));
              await Promise.allSettled([loadOverview(), refreshMe ? refreshMe() : Promise.resolve()]);
            } catch (e) {
              Alert.alert('신청 실패', e?.message || '환전 신청 중 오류가 발생했습니다.');
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
          <Ionicons name="chevron-back" size={24} color="#191919" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>정산 및 출금 센터</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('PointCharge')}
          style={styles.headerChargeBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.headerChargeBtnText}>포인트 충전</Text>
        </TouchableOpacity>
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
          {/* Dual Balance Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryMainTitle}>내 출금 가능 자산</Text>

            <View style={styles.summaryRow}>
              {/* Box 1: 중고거래/마켓 판매 정산금 (원) */}
              <TouchableOpacity
                style={[
                  styles.balanceSubBox,
                  activeTab === 'market' && styles.balanceSubBoxActive,
                ]}
                onPress={() => setActiveTab('market')}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 14 }}>💵</Text>
                  <Text style={styles.subBoxLabel}>중고·마켓 판매금</Text>
                </View>
                <Text style={styles.subBoxAmountGreen}>
                  {overview.marketCashBalance.toLocaleString()}{' '}
                  <Text style={{ fontSize: 13, color: '#374151' }}>원</Text>
                </Text>
                <View style={styles.subBoxTag}>
                  <Text style={styles.subBoxTagText}>수수료 0원 · 비과세</Text>
                </View>
              </TouchableOpacity>

              {/* Box 2: 후원 모꼬 포인트 (P) */}
              <TouchableOpacity
                style={[
                  styles.balanceSubBox,
                  activeTab === 'points' && styles.balanceSubBoxActive,
                ]}
                onPress={() => setActiveTab('points')}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 14 }}>🟡</Text>
                  <Text style={styles.subBoxLabel}>후원·선물 포인트</Text>
                </View>
                <Text style={styles.subBoxAmountGold}>
                  {overview.redeemableBalance.toLocaleString()}{' '}
                  <Text style={{ fontSize: 13, color: '#374151' }}>P</Text>
                </Text>
                <View style={[styles.subBoxTag, { backgroundColor: '#EDE9FE' }]}>
                  <Text style={[styles.subBoxTagText, { color: '#6D28D9' }]}>
                    원천징수 3.3% 환전
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.summaryNoticeRow}>
              <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
              <Text style={styles.summaryNoticeText}>
                중고거래 정산금과 크리에이터 후원 포인트는 회계 기준에 따라 별도 출금 신청됩니다.
              </Text>
            </View>
          </View>

          {/* 3-Way Segment Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'market' && styles.tabButtonActive]}
              onPress={() => setActiveTab('market')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'market' && styles.tabTextActive]}>
                💵 중고·마켓 출금 (원)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'points' && styles.tabButtonActive]}
              onPress={() => setActiveTab('points')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'points' && styles.tabTextActive]}>
                🟡 포인트 환전 (P)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
              onPress={() => setActiveTab('history')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                신청 내역 ({overview.recentRequests.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: 중고/마켓 판매금 출금 (원화) */}
          {activeTab === 'market' && (
            <View style={styles.formContainer}>
              <View style={styles.formSectionHeader}>
                <Text style={styles.formSectionTitle}>중고·마켓 판매대금 출금 신청</Text>
                <Text style={styles.formSectionSub}>
                  안전결제 및 직거래 완료로 정산된 원화 잔액을 본인 계좌로 이체합니다.
                </Text>
              </View>

              {/* 금액 입력 */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>출금 신청 금액 (원)</Text>
                  <TouchableOpacity
                    onPress={() => setCashAmountInput(String(overview.marketCashBalance))}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.allInText}>전액 입력</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={`최소 ${overview.minMarketCash.toLocaleString()}원 이상 입력`}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={cashAmountInput}
                    onChangeText={(t) => setCashAmountInput(t.replace(/[^0-9]/g, ''))}
                  />
                  <Text style={styles.inputAffix}>원</Text>
                </View>

                {/* 빠른 증액 칩 */}
                <View style={styles.amountChipRow}>
                  <TouchableOpacity
                    style={styles.amountChip}
                    onPress={() =>
                      setCashAmountInput(
                        String(Math.min(overview.marketCashBalance, parsedCash + 10000)),
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.amountChipText}>+1만 원</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.amountChip}
                    onPress={() =>
                      setCashAmountInput(
                        String(Math.min(overview.marketCashBalance, parsedCash + 50000)),
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.amountChipText}>+5만 원</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.amountChip}
                    onPress={() =>
                      setCashAmountInput(
                        String(Math.min(overview.marketCashBalance, parsedCash + 100000)),
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.amountChipText}>+10만 원</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.amountChip, styles.amountChipReset]}
                    onPress={() => setCashAmountInput('')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.amountChipResetText}>초기화</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 실지급액 안내 카드 */}
              {parsedCash > 0 && (
                <View style={styles.calcCardGreen}>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>신청 금액</Text>
                    <Text style={styles.calcVal}>{parsedCash.toLocaleString()}원</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>정산 수수료</Text>
                    <Text style={[styles.calcVal, { color: '#059669' }]}>0원 (무료)</Text>
                  </View>
                  <View style={styles.calcDivider} />
                  <View style={styles.calcRow}>
                    <Text style={styles.calcNetLabel}>실제 입금 예정액</Text>
                    <Text style={styles.calcNetVal}>{parsedCash.toLocaleString()}원</Text>
                  </View>
                </View>
              )}

              {/* 계좌 정보 */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>입금 은행</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.bankChipScroll}
                >
                  {MAJOR_BANKS.map((b) => (
                    <TouchableOpacity
                      key={b}
                      style={[styles.bankChip, cashBankName === b && styles.bankChipActive]}
                      onPress={() => setCashBankName(b)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.bankChipText,
                          cashBankName === b && styles.bankChipTextActive,
                        ]}
                      >
                        {b}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TextInput
                  style={[styles.textInput, { marginTop: 8 }]}
                  placeholder="또는 직접 은행명 입력"
                  placeholderTextColor="#9CA3AF"
                  value={cashBankName}
                  onChangeText={setCashBankName}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>계좌번호</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="숫자만 입력"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={cashAccountNumber}
                  onChangeText={(t) => setCashAccountNumber(t.replace(/[^0-9]/g, ''))}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>예금주 성명</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="본인 실명 입력"
                  placeholderTextColor="#9CA3AF"
                  value={cashAccountHolder}
                  onChangeText={setCashAccountHolder}
                />
                <Text style={styles.fieldHelper}>
                  * 중고거래 사기 방지를 위해 본인 명의 계좌로만 출금됩니다.
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (submitting ||
                    parsedCash < overview.minMarketCash ||
                    !cashBankName ||
                    !cashAccountNumber ||
                    !cashAccountHolder) &&
                    styles.submitBtnDisabled,
                ]}
                disabled={
                  submitting ||
                  parsedCash < overview.minMarketCash ||
                  !cashBankName ||
                  !cashAccountNumber ||
                  !cashAccountHolder
                }
                activeOpacity={0.85}
                onPress={handleCashSubmit}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#191919" />
                ) : (
                  <Text style={styles.submitBtnText}>원화 정산금 출금 신청하기</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 2: 모꼬 포인트 환전 출금 (P) */}
          {activeTab === 'points' && (
            <View style={styles.formContainer}>
              <View style={styles.formSectionHeader}>
                <Text style={styles.formSectionTitle}>모꼬 포인트(P) 현금 환전 신청</Text>
                <Text style={styles.formSectionSub}>
                  라이브 방송 후원 및 1:1 대화로 획득한 포인트를 원화로 환전 입금합니다.
                </Text>
              </View>

              {/* 포인트 입력 */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>환전 신청 포인트 (P)</Text>
                  <TouchableOpacity
                    onPress={() => setPointsAmountInput(String(overview.redeemableBalance))}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.allInText}>전액 입력</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={`최소 ${overview.minSettlementPoints.toLocaleString()} P 이상 입력`}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={pointsAmountInput}
                    onChangeText={(t) => setPointsAmountInput(t.replace(/[^0-9]/g, ''))}
                  />
                  <Text style={styles.inputAffix}>P</Text>
                </View>

                {/* 빠른 증액 칩 */}
                <View style={styles.amountChipRow}>
                  <TouchableOpacity
                    style={styles.amountChip}
                    onPress={() =>
                      setPointsAmountInput(
                        String(Math.min(overview.redeemableBalance, parsedPoints + 10000)),
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.amountChipText}>+1만 P</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.amountChip}
                    onPress={() =>
                      setPointsAmountInput(
                        String(Math.min(overview.redeemableBalance, parsedPoints + 50000)),
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.amountChipText}>+5만 P</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.amountChip}
                    onPress={() =>
                      setPointsAmountInput(
                        String(Math.min(overview.redeemableBalance, parsedPoints + 100000)),
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.amountChipText}>+10만 P</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.amountChip, styles.amountChipReset]}
                    onPress={() => setPointsAmountInput('')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.amountChipResetText}>초기화</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 세금 및 실수령 계산기 */}
              {parsedPoints > 0 && (
                <View style={styles.calcCardGold}>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>환전 기준액 (1 P = 1원)</Text>
                    <Text style={styles.calcVal}>{pointsGrossKrw.toLocaleString()}원</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={[styles.calcLabel, { color: '#EF4444' }]}>
                      원천징수 사업소득세 (3.3%)
                    </Text>
                    <Text style={[styles.calcVal, { color: '#EF4444' }]}>
                      -{pointsTaxAmount.toLocaleString()}원
                    </Text>
                  </View>
                  <View style={styles.calcDivider} />
                  <View style={styles.calcRow}>
                    <Text style={styles.calcNetLabelGold}>실제 입금 예정액</Text>
                    <Text style={styles.calcNetValGold}>{pointsNetKrw.toLocaleString()}원</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>
                    ※ 크리에이터 사업소득세 3.3%가 원천징수된 후 입금됩니다.
                  </Text>
                </View>
              )}

              {/* 계좌 정보 */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>입금 은행</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.bankChipScroll}
                >
                  {MAJOR_BANKS.map((b) => (
                    <TouchableOpacity
                      key={b}
                      style={[styles.bankChip, pointsBankName === b && styles.bankChipActive]}
                      onPress={() => setPointsBankName(b)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.bankChipText,
                          pointsBankName === b && styles.bankChipTextActive,
                        ]}
                      >
                        {b}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TextInput
                  style={[styles.textInput, { marginTop: 8 }]}
                  placeholder="또는 직접 은행명 입력"
                  placeholderTextColor="#9CA3AF"
                  value={pointsBankName}
                  onChangeText={setPointsBankName}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>계좌번호</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="숫자만 입력"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={pointsAccountNumber}
                  onChangeText={(t) => setPointsAccountNumber(t.replace(/[^0-9]/g, ''))}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>예금주 성명</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="본인 실명 입력"
                  placeholderTextColor="#9CA3AF"
                  value={pointsAccountHolder}
                  onChangeText={setPointsAccountHolder}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (submitting ||
                    parsedPoints < overview.minSettlementPoints ||
                    !pointsBankName ||
                    !pointsAccountNumber ||
                    !pointsAccountHolder) &&
                    styles.submitBtnDisabled,
                ]}
                disabled={
                  submitting ||
                  parsedPoints < overview.minSettlementPoints ||
                  !pointsBankName ||
                  !pointsAccountNumber ||
                  !pointsAccountHolder
                }
                activeOpacity={0.85}
                onPress={handlePointsSubmit}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#191919" />
                ) : (
                  <Text style={styles.submitBtnText}>모꼬 포인트 환전 신청하기</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 3: 신청 내역 */}
          {activeTab === 'history' && (
            <View style={styles.historyContainer}>
              {overview.recentRequests.length === 0 ? (
                <View style={styles.emptyHistoryBox}>
                  <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyHistoryTitle}>신청 내역이 없습니다.</Text>
                  <Text style={styles.emptyHistorySubtitle}>
                    중고거래 정산금 및 크리에이터 포인트를 모아 첫 출금을 신청해보세요!
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyHistoryBtn}
                    onPress={() => setActiveTab('market')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.emptyHistoryBtnText}>첫 출금 신청하러 가기</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                overview.recentRequests.map((req) => {
                  const isMarket = req.type === 'MARKET_CASH' || Boolean(req.cashAmount);
                  const isApproved = req.status === 'APPROVED';
                  const isRejected = req.status === 'REJECTED';
                  const statusText = isApproved ? '입금완료' : isRejected ? '반려됨' : '심사중';
                  const badgeStyle = isApproved
                    ? styles.badgeApproved
                    : isRejected
                    ? styles.badgeRejected
                    : styles.badgePending;
                  const textStyle = isApproved
                    ? styles.badgeTextApproved
                    : isRejected
                    ? styles.badgeTextRejected
                    : styles.badgeTextPending;

                  return (
                    <View key={req.id} style={styles.historyCard}>
                      <View style={styles.historyCardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View
                            style={[
                              styles.typeBadge,
                              isMarket ? { backgroundColor: '#ECFDF5' } : { backgroundColor: '#FEF3C7' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.typeBadgeText,
                                isMarket ? { color: '#059669' } : { color: '#D97706' },
                              ]}
                            >
                              {isMarket ? '💵 중고/마켓 출금' : '🟡 포인트 환전'}
                            </Text>
                          </View>
                          <View style={badgeStyle}>
                            <Text style={textStyle}>{statusText}</Text>
                          </View>
                        </View>
                        <Text style={styles.historyDate}>
                          {new Date(req.createdAt || req.requestedAt || Date.now()).toLocaleDateString(
                            'ko-KR',
                            { month: 'short', day: 'numeric' },
                          )}
                        </Text>
                      </View>

                      <View style={styles.historyCardBody}>
                        <View style={styles.historyRow}>
                          <Text style={styles.historyLabel}>신청 내역</Text>
                          <Text style={styles.historyAmount}>
                            {isMarket
                              ? `${Number(req.cashAmount || req.requestedAmount).toLocaleString()}원`
                              : `${Number(req.pointsAmount || req.requestedAmount).toLocaleString()} P`}
                          </Text>
                        </View>

                        <View style={styles.historyRow}>
                          <Text style={styles.historyLabel}>실 입금 예정액</Text>
                          <Text style={[styles.historyAmount, { color: '#059669', fontWeight: '800' }]}>
                            {Number(req.netAmount || req.cashAmount || req.pointsAmount).toLocaleString()}원
                          </Text>
                        </View>

                        <View style={styles.historyRow}>
                          <Text style={styles.historyLabel}>입금 계좌</Text>
                          <Text style={styles.historyValue}>
                            {req.bankName} {req.accountNumber} ({req.accountHolder})
                          </Text>
                        </View>
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
  headerChargeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF08A',
    borderRadius: 10,
  },
  headerChargeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#854D0E',
  },
  summaryCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 14,
  },
  summaryMainTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#191919',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  balanceSubBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  balanceSubBoxActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  subBoxLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  subBoxAmountGreen: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: -0.4,
  },
  subBoxAmountGold: {
    fontSize: 18,
    fontWeight: '900',
    color: '#D97706',
    letterSpacing: -0.4,
  },
  subBoxTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  subBoxTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  summaryNoticeRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryNoticeText: {
    fontSize: 11,
    color: '#6B7280',
    flex: 1,
    lineHeight: 15,
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
    fontSize: 12,
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
  formSectionHeader: {
    gap: 4,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#191919',
  },
  formSectionSub: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
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
    fontSize: 13,
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
  calcCardGreen: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    gap: 8,
  },
  calcCardGold: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
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
    backgroundColor: '#E5E7EB',
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
  calcNetLabelGold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  calcNetValGold: {
    fontSize: 16,
    fontWeight: '900',
    color: '#D97706',
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
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 15,
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
    fontSize: 15,
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
    textAlign: 'center',
    paddingHorizontal: 20,
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
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
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
    fontSize: 14,
    fontWeight: '800',
    color: '#191919',
  },
  historyValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
});
