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
} from 'react-native';
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

export default function ShopScreen() {
  const { user, refreshMe } = useAuth();
  const [packages, setPackages] = useState([]);
  const [iapProducts, setIapProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [purchaseProcessing, setPurchaseProcessing] = useState(false);

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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([loadPointProducts(), refreshMe()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadPointProducts, refreshMe]);

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
                        await refreshMe();
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

        await loadPointProducts();
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
  }, [loadPointProducts, refreshMe]);

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
                  await refreshMe();
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

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Points</Text>
        <View style={styles.pointBadge}>
          <Text style={styles.pointIcon}>P</Text>
          <Text style={styles.pointText}>{balance}</Text>
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
      </ScrollView>
    </View>
  );
}

const RADIUS = 16;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg || '#F7F7FA',
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary || '#222',
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
});
