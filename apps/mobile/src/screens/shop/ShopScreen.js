import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Modal,
  Share,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import InAppPurchases, {
  IAP_UNAVAILABLE_MESSAGE,
  isIapAvailable,
} from '../../utils/inAppPurchases';
import { apiClient } from '../../api/client';

const FALLBACK_PACKAGES = [
  { id: 'com.company.points.100', productId: 'com.company.points.100', label: '100P', price: '₩1,900', points: 100 },
  { id: 'com.company.points.300', productId: 'com.company.points.300', label: '300P', price: '₩5,500', points: 300 },
  { id: 'com.company.points.500', productId: 'com.company.points.500', label: '500P', price: '₩8,900', points: 500 },
  { id: 'com.company.points.1000', productId: 'com.company.points.1000', label: '1,000P', price: '₩17,000', points: 1000, recommended: true },
  { id: 'com.company.points.3000', productId: 'com.company.points.3000', label: '3,000P', price: '₩49,000', points: 3000 },
  { id: 'com.company.points.5000', productId: 'com.company.points.5000', label: '5,000P', price: '₩79,000', points: 5000 },
];

export default function ShopScreen({ navigation }) {
  const { user, refreshMe } = useAuth();
  const [packages, setPackages] = useState([]);
  const [iapProducts, setIapProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [purchaseProcessing, setPurchaseProcessing] = useState(false);
  const [rewards, setRewards] = useState({
    attendance: { checkedInToday: false, rewardPoints: 5 },
    adReward: { todayWatchCount: 0, dailyLimit: 5, rewardPoints: 10, canWatch: true },
    referral: { referralCode: '', rewardPoints: 50 },
  });
  const [rewardProcessing, setRewardProcessing] = useState(false);
  const [adModalVisible, setAdModalVisible] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);

  // Settlement & Creator Redemption State
  const [settlementOverview, setSettlementOverview] = useState({
    redeemableBalance: 0,
    pendingEarnings: 0,
    spendableBalance: 0,
    minSettlementPoints: 10000,
    taxRatePercent: 3.3,
    recentRequests: [],
  });
  const [settlementModalVisible, setSettlementModalVisible] = useState(false);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [settlementSubmitting, setSettlementSubmitting] = useState(false);

  // Point Purchase History State
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [purchaseHistoryLoading, setPurchaseHistoryLoading] = useState(false);
  const [purchaseHistoryModalVisible, setPurchaseHistoryModalVisible] = useState(false);

  const balance = useMemo(() => {
    const p = user?.pointsBalance ?? user?.points ?? user?.balance ?? 0;
    return typeof p === 'number' ? p : parseInt(String(p).replace(/\D/g, ''), 10) || 0;
  }, [user]);

  const loadPointProducts = useCallback(async () => {
    try {
      const fetched = await apiClient.getPointProducts();
      const rawList = Array.isArray(fetched?.items)
        ? fetched.items
        : Array.isArray(fetched)
        ? fetched
        : [];

      const normalized = rawList.map((item, index) => ({
        id: item?.id || item?.productId || `pkg-${index + 1}`,
        productId: item?.productId || item?.id || item?.sku,
        label: item?.label || item?.title || `${item?.points || ''}P`,
        price: item?.priceText || item?.price || '',
        points: item?.points || Number.parseInt(item?.label, 10) || null,
        recommended: Boolean(item?.recommended),
      }));

      if (normalized.length > 0) {
        setPackages(normalized);
      }

      const productIds = normalized
        .map((pkg) => pkg.productId)
        .filter((id) => typeof id === 'string' && id.length > 0);

      if (isIapAvailable && productIds.length > 0) {
        const { responseCode, results } = await InAppPurchases.getProductsAsync(productIds);
        if (responseCode === InAppPurchases.IAPResponseCode.OK && Array.isArray(results)) {
          setIapProducts(results);
        }
      }
    } catch (err) {
      console.warn('Point products load failed', err);
      setError(err?.message || '상품 정보를 불러오지 못했습니다.');
    }
  }, []);

  const loadRewards = useCallback(async () => {
    try {
      const data = await apiClient.getRewardsStatus();
      if (data) setRewards(data);
    } catch (e) {
      console.warn('Failed to load rewards status', e);
    }
  }, []);

  const loadSettlementOverview = useCallback(async () => {
    try {
      const data = await apiClient.getSettlementOverview();
      if (data) setSettlementOverview(data);
    } catch (e) {
      console.warn('Failed to load settlement overview', e);
    }
  }, []);

  const loadPurchaseHistory = useCallback(async () => {
    try {
      setPurchaseHistoryLoading(true);
      const items = await apiClient.getPurchaseHistory();
      if (Array.isArray(items)) {
        setPurchaseHistory(items);
      }
    } catch (e) {
      console.warn('Failed to load purchase history', e);
    } finally {
      setPurchaseHistoryLoading(false);
    }
  }, []);

  const handleOpenPurchaseHistory = () => {
    loadPurchaseHistory();
    setPurchaseHistoryModalVisible(true);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        loadPointProducts(),
        refreshMe(),
        loadRewards(),
        loadSettlementOverview(),
        loadPurchaseHistory(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadPointProducts, refreshMe, loadRewards, loadSettlementOverview, loadPurchaseHistory]);

  const handleSubmitSettlement = async () => {
    const pts = parseInt(settlementAmount, 10);
    if (isNaN(pts) || pts < (settlementOverview.minSettlementPoints || 10000)) {
      Alert.alert(
        '출금 신청 안내',
        `최소 출금 신청 포인트는 ${(settlementOverview.minSettlementPoints || 10000).toLocaleString()}P입니다.`,
      );
      return;
    }
    if (pts > (settlementOverview.redeemableBalance || 0)) {
      Alert.alert('출금 신청 오류', '출금 가능한 포인트 잔액을 초과할 수 없습니다.');
      return;
    }
    if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      Alert.alert('입력 확인', '입금 은행, 계좌번호, 예금주명을 모두 입력해 주세요.');
      return;
    }

    try {
      setSettlementSubmitting(true);
      await apiClient.requestSettlement({
        pointsAmount: pts,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
      });
      Alert.alert('신청 완료', '출금 신청이 정상 접수되었습니다.\n관리자 심사 후 등록하신 계좌로 입금 처리됩니다.');
      setSettlementAmount('');
      setBankName('');
      setAccountNumber('');
      setAccountHolder('');
      setSettlementModalVisible(false);
      await Promise.allSettled([loadSettlementOverview(), refreshMe()]);
    } catch (e) {
      Alert.alert('출금 신청 실패', e?.message || '출금 신청 중 오류가 발생했습니다.');
    } finally {
      setSettlementSubmitting(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let subscription;

    const initialize = async () => {
      try {
        if (isIapAvailable) {
          await InAppPurchases.connectAsync();
          subscription = InAppPurchases.setPurchaseListener(
            async ({ responseCode, results, errorCode }) => {
              if (!mounted) return;

              if (responseCode === InAppPurchases.IAPResponseCode.OK) {
                if (Array.isArray(results)) {
                  for (const purchase of results) {
                    if (
                      purchase?.purchaseState === InAppPurchases.InAppPurchaseState.PURCHASED &&
                      !purchase?.acknowledged
                    ) {
                      try {
                        await apiClient.confirmPurchase({
                          productId: purchase.productId,
                          transactionId: purchase.orderId || purchase.transactionId,
                          receipt: purchase.transactionReceipt || purchase.receipt,
                          platform: Platform.OS,
                        });
                        await InAppPurchases.finishTransactionAsync(purchase, false);
                        await Promise.allSettled([refreshMe(), loadPurchaseHistory()]);
                        Alert.alert('구매 완료', '결제가 정상적으로 처리되었습니다.');
                      } catch (confirmError) {
                        Alert.alert(
                          '구매 확인 실패',
                          confirmError?.message || '결제 검증에 실패했습니다. 고객센터로 문의해 주세요.',
                        );
                      }
                    }
                  }
                }
                setPurchaseProcessing(false);
              } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
                setPurchaseProcessing(false);
              } else {
                setPurchaseProcessing(false);
                const code = errorCode ? ` (code: ${errorCode})` : '';
                Alert.alert('결제 오류', `결제 처리 중 문제가 발생했습니다${code}. 잠시 후 다시 시도해 주세요.`);
              }
            },
          );
        }

        await Promise.allSettled([loadPointProducts(), loadRewards(), loadSettlementOverview()]);
      } catch (initError) {
        if (!mounted) return;
        console.warn('Shop init failed', initError);
        setError(initError?.message || '상품 정보를 불러오지 못했습니다.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      if (subscription) subscription.remove();
      if (isIapAvailable) {
        InAppPurchases.disconnectAsync().catch(() => {});
      }
    };
  }, [loadPointProducts, loadRewards, loadSettlementOverview, refreshMe]);

  const displayPackages = useMemo(() => (packages.length > 0 ? packages : FALLBACK_PACKAGES), [packages]);

  const getPriceLabel = useCallback(
    (item) => {
      if (!item?.productId) return item?.price || '가격 정보 없음';
      const meta = iapProducts.find((p) => p.productId === item.productId);
      if (meta?.priceString) return meta.priceString;
      if (meta?.price) return `${meta.price} ${meta.currencyCode || ''}`.trim();
      return item?.price || '가격 정보 없음';
    },
    [iapProducts],
  );

  const handlePurchase = useCallback(
    async (item) => {
      if (purchaseProcessing) return;

      const targetProductId = item?.productId || item?.id;
      if (!targetProductId) {
        Alert.alert('준비중', '상품 식별 정보가 올바르지 않습니다.');
        return;
      }

      // If native IAP is unavailable (Expo Go, dev client, or simulator), offer developer/sandbox instant test purchase
      if (!isIapAvailable) {
        Alert.alert(
          '포인트 충전',
          `[${item.label}] 상품을 충전하시겠습니까? (${getPriceLabel(item)})\n* 개발/테스트 모드로 즉시 충전 및 적립됩니다.`,
          [
            { text: '취소', style: 'cancel' },
            {
              text: '충전하기',
              onPress: async () => {
                try {
                  setPurchaseProcessing(true);
                  const txId = `dev_tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                  const res = await apiClient.confirmPurchase({
                    productId: targetProductId,
                    transactionId: txId,
                    receipt: `receipt_${txId}`,
                    platform: Platform.OS || 'android',
                  });
                  await Promise.allSettled([refreshMe(), loadPurchaseHistory()]);
                  const newBal = res?.balance ?? '반영 완료';
                  Alert.alert('충전 완료', `${item.label} 포인트 충전이 완료되었습니다.\n(현재 잔액: ${newBal}P)`);
                } catch (err) {
                  Alert.alert('충전 실패', err?.message || '포인트 충전에 실패했습니다.');
                } finally {
                  setPurchaseProcessing(false);
                }
              },
            },
          ],
        );
        return;
      }

      try {
        setPurchaseProcessing(true);
        await InAppPurchases.requestPurchaseAsync(targetProductId);
      } catch (err) {
        setPurchaseProcessing(false);
        Alert.alert('결제 요청 실패', err?.message || '결제를 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
    },
    [getPriceLabel, purchaseProcessing, refreshMe],
  );

  const handleAttendance = async () => {
    if (rewards.attendance?.checkedInToday) {
      Alert.alert('출석 완료', '오늘 이미 출석체크를 완료했습니다. 내일 다시 만나요!');
      return;
    }
    setRewardProcessing(true);
    try {
      const res = await apiClient.claimAttendanceReward();
      await Promise.allSettled([refreshMe(), loadRewards()]);
      Alert.alert('출석체크 완료', res?.message || '5P가 지급되었습니다!');
    } catch (err) {
      Alert.alert('알림', err?.message || '출석체크 처리에 실패했습니다.');
    } finally {
      setRewardProcessing(false);
    }
  };

  const handleStartAdWatch = () => {
    if (!rewards.adReward?.canWatch) {
      Alert.alert(
        '시청 한도 초과',
        `오늘 시청 가능한 광고(${rewards.adReward?.dailyLimit || 5}회)를 모두 시청하셨습니다.`,
      );
      return;
    }
    setAdCountdown(5);
    setAdModalVisible(true);
  };

  useEffect(() => {
    let timer;
    if (adModalVisible && adCountdown > 0) {
      timer = setTimeout(() => setAdCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [adModalVisible, adCountdown]);

  const handleFinishAd = async () => {
    setAdModalVisible(false);
    setRewardProcessing(true);
    try {
      const res = await apiClient.claimAdReward();
      await Promise.allSettled([refreshMe(), loadRewards()]);
      Alert.alert('보상 지급 완료', res?.message || '10P가 적립되었습니다!');
    } catch (err) {
      Alert.alert('알림', err?.message || '보상 지급에 실패했습니다.');
    } finally {
      setRewardProcessing(false);
    }
  };

  const handleShareReferral = async () => {
    const code =
      rewards.referral?.referralCode ||
      user?.id?.substring(Math.max(0, (user?.id?.length || 6) - 6)).toUpperCase() ||
      'DAGAON1';
    try {
      await Share.share({
        message: `[다가온] 새로운 사람이 다가오고, 새로운 이야기가 시작됩니다!\n가입 시 추천인 코드 [${code}]를 입력하면 ${rewards.referral?.rewardPoints || 50}P를 무료 충전해 드립니다!`,
      });
    } catch (e) {
      console.warn('Share error', e);
    }
  };

  const navState = navigation?.getState?.();
  const isStack = navState?.type === 'stack';
  const canGoBack = isStack && (navState?.index ?? 0) > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {canGoBack && (
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary || '#111827'} />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>포인트 충전소</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={handleOpenPurchaseHistory}
            hitSlop={6}
            activeOpacity={0.8}
          >
            <Ionicons name="receipt-outline" size={15} color="#475569" />
            <Text style={styles.historyBtnText}>충전 내역</Text>
          </TouchableOpacity>
          <View style={styles.pointBadge}>
            <Text style={styles.pointIcon}>P</Text>
            <Text style={styles.pointText}>{balance.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}

        {!!error && !loading && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.banner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerSmall}>+50%의 추가 혜택</Text>
            <Text style={styles.bannerBig}>무통장 계좌결제 시{'\n'}1.5배 더 드려요!</Text>
          </View>
          <TouchableOpacity
            style={styles.bannerCta}
            activeOpacity={0.9}
            onPress={() => {
              Alert.alert('준비중', '무통장 스토어 기능을 준비중입니다.');
            }}
          >
            <Text style={styles.bannerCtaText}>무통장 스토어{'\n'}바로가기</Text>
            <Text style={styles.bannerCtaArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 크리에이터 수익금 출금/환전 카드 */}
        <View style={styles.settlementCard}>
          <View style={styles.settlementTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="wallet-outline" size={20} color="#059669" />
              <Text style={styles.settlementTitle}>크리에이터 출금 / 환전</Text>
            </View>
            <TouchableOpacity
              style={styles.settlementBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Settlement')}
            >
              <Text style={styles.settlementBtnText}>출금 신청</Text>
              <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.settlementBalanceRow}>
            <View style={styles.settlementBalanceCol}>
              <Text style={styles.settlementBalanceLabel}>출금 가능 수익</Text>
              <Text style={styles.settlementBalanceVal}>
                {(settlementOverview.redeemableBalance || 0).toLocaleString()}P
              </Text>
            </View>
            <View style={styles.settlementDivider} />
            <View style={styles.settlementBalanceCol}>
              <Text style={styles.settlementBalanceLabel}>정산 심사 대기</Text>
              <Text style={[styles.settlementBalanceVal, { color: '#D97706' }]}>
                {(settlementOverview.pendingEarnings || 0).toLocaleString()}P
              </Text>
            </View>
          </View>
        </View>

        {/* 무료 포인트 충전소 */}
        <View style={styles.rewardsSection}>
          <View style={styles.rewardsHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="gift" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>무료 포인트 충전소</Text>
            </View>
            <Text style={styles.sectionSubtitle}>미션을 완료하고 매일 무료 포인트를 받으세요</Text>
          </View>

          <View style={styles.rewardsCardList}>
            {/* 1. 일일 출석체크 */}
            <View style={styles.rewardCard}>
              <View style={styles.rewardCardLeft}>
                <View style={[styles.rewardIconBox, { backgroundColor: '#EBF4FF' }]}>
                  <Ionicons
                    name={rewards.attendance?.checkedInToday ? 'checkmark-circle' : 'calendar-outline'}
                    size={22}
                    color="#2B6CB0"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rewardCardTitle}>
                    매일 출석체크{' '}
                    <Text style={styles.rewardPointHighlight}>
                      +{rewards.attendance?.rewardPoints || 5}P
                    </Text>
                  </Text>
                  <Text style={styles.rewardCardDesc}>
                    {rewards.attendance?.checkedInToday
                      ? '오늘 출석 완료! 내일 또 방문해 주세요'
                      : '하루 한 번 접속하고 무료 포인트 받기'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.rewardActionBtn,
                  rewards.attendance?.checkedInToday ? styles.rewardActionDoneBtn : styles.rewardActionActiveBtn,
                ]}
                activeOpacity={0.85}
                disabled={rewards.attendance?.checkedInToday || rewardProcessing}
                onPress={handleAttendance}
              >
                <Text
                  style={[
                    styles.rewardActionBtnText,
                    rewards.attendance?.checkedInToday ? styles.rewardActionDoneText : styles.rewardActionActiveText,
                  ]}
                >
                  {rewards.attendance?.checkedInToday ? '출석 완료' : '출석하기'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. 보상형 동영상 광고 */}
            <View style={styles.rewardCard}>
              <View style={styles.rewardCardLeft}>
                <View style={[styles.rewardIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="play-circle-outline" size={22} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rewardCardTitle}>
                    보상형 광고 시청{' '}
                    <Text style={styles.rewardPointHighlight}>
                      +{rewards.adReward?.rewardPoints || 10}P
                    </Text>
                  </Text>
                  <Text style={styles.rewardCardDesc}>
                    오늘 시청: {rewards.adReward?.todayWatchCount || 0}/{rewards.adReward?.dailyLimit || 5}회
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.rewardActionBtn,
                  !rewards.adReward?.canWatch ? styles.rewardActionDoneBtn : styles.rewardActionActiveBtn,
                ]}
                activeOpacity={0.85}
                disabled={!rewards.adReward?.canWatch || rewardProcessing}
                onPress={handleStartAdWatch}
              >
                <Text
                  style={[
                    styles.rewardActionBtnText,
                    !rewards.adReward?.canWatch ? styles.rewardActionDoneText : styles.rewardActionActiveText,
                  ]}
                >
                  {rewards.adReward?.canWatch ? '광고 시청' : '한도 초과'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. 친구 초대 리워드 */}
            <View style={styles.rewardCard}>
              <View style={styles.rewardCardLeft}>
                <View style={[styles.rewardIconBox, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="share-social-outline" size={22} color="#7E22CE" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rewardCardTitle}>
                    친구 초대하기{' '}
                    <Text style={styles.rewardPointHighlight}>
                      +{rewards.referral?.rewardPoints || 50}P
                    </Text>
                  </Text>
                  <Text style={styles.rewardCardDesc}>
                    코드: {rewards.referral?.referralCode || user?.id?.substring(0, 6)?.toUpperCase()} (친구 가입 시 지급)
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.rewardActionBtn, styles.rewardActionActiveBtn]}
                activeOpacity={0.85}
                onPress={handleShareReferral}
              >
                <Text style={[styles.rewardActionBtnText, styles.rewardActionActiveText]}>초대 공유</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 포인트 상품 목록 헤더 */}
        <View style={styles.packageSectionHeader}>
          <Text style={styles.sectionTitle}>포인트 상품 충전</Text>
          <Text style={styles.sectionSubtitle}>안전한 인앱 결제로 포인트를 즉시 충전하세요</Text>
        </View>

        <View style={{ gap: 14 }}>
          {displayPackages.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.pointImg}>
                  <Ionicons
                    name={item.recommended ? 'sparkles' : 'ellipse'}
                    size={26}
                    color={item.recommended ? colors.primary : colors.textSecondary}
                  />
                </View>
                <Text style={styles.rowLabel}>
                  {item.label}{' '}
                  {item.recommended ? <Text style={styles.reco}>추천</Text> : null}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.buyBtn}
                activeOpacity={0.9}
                onPress={() => handlePurchase(item)}
                disabled={purchaseProcessing}
              >
                {purchaseProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buyBtnText}>{getPriceLabel(item)}</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* 포인트 상품 충전 안내 및 부가세 고지 */}
        <View style={styles.legalNoticeBox}>
          <Ionicons name="information-circle-outline" size={18} color="#64748B" />
          <Text style={styles.legalNoticeText}>
            모든 결제 금액은 VAT(부가세 10%) 포함 금액입니다.{'\n'}
            충전된 포인트는 다가온 앱 내 선물 및 소통 기능 이용에 사용되며, 미사용 포인트의 청약철회 및 환불은 전자상거래법 및 앱마켓 규정에 따라 처리됩니다.
          </Text>
        </View>
      </ScrollView>

      {/* Rewarded Video Ad Modal */}
      <Modal visible={adModalVisible} transparent animationType="fade">
        <View style={styles.adModalBackdrop}>
          <View style={styles.adModalBox}>
            <View style={styles.adModalHeader}>
              <Ionicons name="tv-outline" size={36} color={colors.primary} />
              <Text style={styles.adModalTitle}>보상형 광고 시청 중</Text>
              <Text style={styles.adModalDesc}>
                영상 시청 완료 후 {rewards.adReward?.rewardPoints || 10}P가 즉시 지급됩니다.
              </Text>
            </View>

            <View style={styles.adCountdownCircle}>
              {adCountdown > 0 ? (
                <Text style={styles.adCountdownNum}>{adCountdown}</Text>
              ) : (
                <Ionicons name="checkmark" size={36} color="#059669" />
              )}
            </View>

            <Text style={styles.adCountdownLabel}>
              {adCountdown > 0
                ? `보상 지급까지 ${adCountdown}초 남음...`
                : '시청 완료! 보상을 수령하세요.'}
            </Text>

            <TouchableOpacity
              style={[
                styles.adFinishBtn,
                adCountdown > 0 ? styles.adFinishBtnDisabled : styles.adFinishBtnEnabled,
              ]}
              disabled={adCountdown > 0}
              onPress={handleFinishAd}
              activeOpacity={0.9}
            >
              <Text style={styles.adFinishBtnText}>
                {adCountdown > 0 ? '시청 중 (닫기 불가)' : '보상 10P 받기'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Creator Settlement Request Modal */}
      <Modal visible={settlementModalVisible} transparent animationType="slide">
        <View style={styles.settlementModalBackdrop}>
          <View style={styles.settlementModalBox}>
            <View style={styles.settlementModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="cash" size={22} color="#059669" />
                <Text style={styles.settlementModalTitle}>크리에이터 수익금 출금</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSettlementModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* 잔액 요약 카드 */}
              <View style={styles.modalBalanceBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalBalanceLabel}>출금 가능 잔액</Text>
                  <Text style={styles.modalBalanceNum}>
                    {(settlementOverview.redeemableBalance || 0).toLocaleString()}P
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalAllBtn}
                  onPress={() => setSettlementAmount(String(settlementOverview.redeemableBalance || 0))}
                >
                  <Text style={styles.modalAllBtnText}>전액 입력</Text>
                </TouchableOpacity>
              </View>

              {/* 출금 금액 입력 */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>출금 신청 포인트 (최소 10,000P)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="예: 50000"
                  keyboardType="numeric"
                  value={settlementAmount}
                  onChangeText={setSettlementAmount}
                />
              </View>

              {/* 실시간 계산 박스 */}
              {(() => {
                const amt = parseInt(settlementAmount, 10) || 0;
                const tax = Math.round(amt * 0.033);
                const net = Math.max(0, amt - tax);
                return (
                  <View style={styles.calcBox}>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>신청 금액 (1P=1원):</Text>
                      <Text style={styles.calcVal}>{amt.toLocaleString()}원</Text>
                    </View>
                    <View style={styles.calcRow}>
                      <Text style={[styles.calcLabel, { color: '#E11D48' }]}>원천징수세액 (3.3%):</Text>
                      <Text style={[styles.calcVal, { color: '#E11D48' }]}>-{tax.toLocaleString()}원</Text>
                    </View>
                    <View style={[styles.calcRow, { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 6, marginTop: 4 }]}>
                      <Text style={[styles.calcLabel, { fontWeight: '700', color: '#0F172A' }]}>실제 입금 예정액:</Text>
                      <Text style={[styles.calcVal, { fontWeight: '800', color: '#059669', fontSize: 15 }]}>
                        {net.toLocaleString()}원
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {/* 계좌 정보 입력 */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>입금 은행</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="예: 국민은행, 신한은행, 카카오뱅크..."
                  value={bankName}
                  onChangeText={setBankName}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>계좌번호</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="숫자 및 하이픈(-) 포함 입력"
                  keyboardType="numeric"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>예금주 성명</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="본인 실명 입력"
                  value={accountHolder}
                  onChangeText={setAccountHolder}
                />
              </View>

              {/* 최근 신청 내역 */}
              {Array.isArray(settlementOverview.recentRequests) && settlementOverview.recentRequests.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.modalInputLabel, { marginBottom: 6 }]}>최근 신청 내역</Text>
                  {settlementOverview.recentRequests.slice(0, 3).map((r) => {
                    const statusText =
                      r.status === 'APPROVED' ? '승인완료' : r.status === 'REJECTED' ? '반려됨' : '심사중';
                    const statusColor =
                      r.status === 'APPROVED' ? '#059669' : r.status === 'REJECTED' ? '#E11D48' : '#D97706';
                    return (
                      <View key={r.id} style={styles.historyRow}>
                        <View>
                          <Text style={styles.historyAmt}>{Number(r.pointsAmount).toLocaleString()}P</Text>
                          <Text style={styles.historyDate}>
                            {new Date(r.createdAt).toLocaleDateString('ko-KR')} · {r.bankName}
                          </Text>
                        </View>
                        <Text style={[styles.historyStatus, { color: statusColor }]}>{statusText}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSettlementModalVisible(false)}
                disabled={settlementSubmitting}
              >
                <Text style={styles.modalCancelBtnText}>닫기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitSettlement}
                disabled={settlementSubmitting}
              >
                {settlementSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>출금 신청 완료</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Point Purchase History Modal */}
      <Modal visible={purchaseHistoryModalVisible} transparent animationType="slide">
        <View style={styles.settlementModalBackdrop}>
          <View style={styles.settlementModalBox}>
            <View style={styles.settlementModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="receipt" size={22} color={colors.primary} />
                <Text style={styles.settlementModalTitle}>포인트 충전 내역</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPurchaseHistoryModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {purchaseHistoryLoading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 12, color: '#64748B', fontSize: 13 }}>
                  충전 내역을 불러오는 중...
                </Text>
              </View>
            ) : purchaseHistory.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Ionicons name="folder-open-outline" size={44} color="#CBD5E1" />
                <Text style={{ marginTop: 12, color: '#64748B', fontSize: 14, fontWeight: '600' }}>
                  충전 내역이 없습니다.
                </Text>
                <Text style={{ marginTop: 4, color: '#94A3B8', fontSize: 12 }}>
                  포인트를 충전하시면 여기에 내역이 표시됩니다.
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                <View style={{ gap: 10, paddingVertical: 8 }}>
                  {purchaseHistory.map((item) => {
                    const dateStr = item?.createdAt
                      ? new Date(item.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-';

                    const platformLabel =
                      item.platform === 'ios'
                        ? 'App Store'
                        : item.platform === 'android'
                        ? 'Google Play'
                        : item.platform === 'toss'
                        ? '토스페이'
                        : item.platform === 'portone'
                        ? '포트원'
                        : item.platform || '인앱 결제';

                    return (
                      <View key={item.id} style={styles.purchaseHistoryCard}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Text style={styles.purchaseHistoryPoints}>
                              +{Number(item.points).toLocaleString()}P 충전
                            </Text>
                            <View style={styles.platformBadge}>
                              <Text style={styles.platformBadgeText}>{platformLabel}</Text>
                            </View>
                          </View>
                          <Text style={styles.purchaseHistoryDate}>{dateStr}</Text>
                        </View>
                        <View style={styles.purchaseHistoryStatusBadge}>
                          <Text style={styles.purchaseHistoryStatusText}>결제 완료</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            <View style={{ marginTop: 16 }}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPurchaseHistoryModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const RADIUS = 16;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary || '#111827',
    letterSpacing: -0.5,
  },
  pointBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointIcon: {
    backgroundColor: colors.primary || '#7B61FF',
    color: '#fff',
    width: 22,
    height: 22,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 11,
    fontWeight: '800',
  },
  pointText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary || '#7B61FF',
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  historyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  purchaseHistoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  purchaseHistoryPoints: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  platformBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  platformBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
  },
  purchaseHistoryDate: {
    fontSize: 12,
    color: '#64748B',
  },
  purchaseHistoryStatusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  purchaseHistoryStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  legalNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  legalNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  scroll: {
    paddingHorizontal: 16,
  },
    loadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#B91C1C',
    fontWeight: '700',
    textAlign: 'center',
  },
  banner: {
    backgroundColor: '#D9ECFF',
    borderRadius: RADIUS,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    marginBottom: 18,
  },
  bannerSmall: {
    fontSize: 13,
    color: '#2C6FB8',
    fontWeight: '700',
    marginBottom: 6,
  },
  bannerBig: {
    fontSize: 18,
    color: '#2C6FB8',
    fontWeight: '800',
    lineHeight: 24,
  },
  bannerCta: {
    width: 112,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B7D6F7',
  },
  bannerCtaText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#2C6FB8',
    fontWeight: '700',
  },
  bannerCtaArrow: {
    marginTop: 6,
    fontSize: 22,
    color: '#2C6FB8',
    fontWeight: '800',
    lineHeight: 22,
  },
  row: {
    backgroundColor: '#fff',
    borderRadius: RADIUS,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary || '#222',
  },
  reco: {
    fontSize: 14,
    color: colors.primary || '#7B61FF',
    fontWeight: '800',
  },
  buyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.primary || '#7B61FF',
  },
  buyBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  rewardsSection: {
    marginBottom: 20,
  },
  rewardsHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary || '#1A202C',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary || '#718096',
    marginTop: 2,
  },
  rewardsCardList: {
    gap: 10,
  },
  rewardCard: {
    backgroundColor: '#fff',
    borderRadius: RADIUS,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  rewardCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  rewardIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary || '#222',
  },
  rewardPointHighlight: {
    color: '#D97706',
    fontWeight: '800',
  },
  rewardCardDesc: {
    fontSize: 11,
    color: colors.textSecondary || '#718096',
    marginTop: 2,
  },
  rewardActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardActionActiveBtn: {
    backgroundColor: colors.primary || '#7B61FF',
  },
  rewardActionDoneBtn: {
    backgroundColor: '#E2E8F0',
  },
  rewardActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rewardActionActiveText: {
    color: '#fff',
  },
  rewardActionDoneText: {
    color: '#718096',
  },
  packageSectionHeader: {
    marginBottom: 12,
  },
  adModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  adModalBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  adModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  adModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary || '#1A202C',
    marginTop: 8,
  },
  adModalDesc: {
    fontSize: 12,
    color: colors.textSecondary || '#718096',
    textAlign: 'center',
    marginTop: 4,
  },
  adCountdownCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    borderWidth: 3,
    borderColor: colors.primary || '#7B61FF',
  },
  adCountdownNum: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary || '#7B61FF',
  },
  adCountdownLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary || '#718096',
    marginBottom: 20,
  },
  adFinishBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adFinishBtnEnabled: {
    backgroundColor: '#059669',
  },
  adFinishBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  adFinishBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  // ===== Settlement Card & Modal Styles =====
  settlementCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: RADIUS,
    padding: 16,
  },
  settlementTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  settlementTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#065F46',
  },
  settlementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  settlementBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  settlementBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  settlementBalanceCol: {
    flex: 1,
    alignItems: 'center',
  },
  settlementDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  settlementBalanceLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  settlementBalanceVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  settlementModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  settlementModalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  settlementModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settlementModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBalanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalBalanceLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  modalBalanceNum: {
    fontSize: 20,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  modalAllBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modalAllBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  modalInputGroup: {
    marginBottom: 12,
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  modalTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  calcBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  calcLabel: {
    fontSize: 12,
    color: '#334155',
  },
  calcVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  modalSubmitBtn: {
    flex: 2,
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyAmt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  historyDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  historyStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
});
