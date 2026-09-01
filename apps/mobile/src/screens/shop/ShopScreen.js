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
  { id: 'p300', label: '300P', price: '5,900원', points: 300 },
  { id: 'p600', label: '600P', price: '11,000원', points: 600 },
  { id: 'p1200', label: '1200P', price: '17,000원', points: 1200 },
  { id: 'p2700', label: '2700P', price: '31,000원', points: 2700, recommended: true },
  { id: 'p9000', label: '9000P', price: '89,000원', points: 9000 },
  { id: 'p20000', label: '20000P', price: '180,000원', points: 20000 },
];

export default function ShopScreen() {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [iapProducts, setIapProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchaseProcessing, setPurchaseProcessing] = useState(false);

  const balance = useMemo(() => {
    const p = user?.points ?? user?.balance ?? 0;
    return typeof p === 'number' ? p : parseInt(String(p).replace(/\D/g, ''), 10) || 0;
  }, [user]);

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

        const fetched = await apiClient.getPointProducts();
        if (!mounted) return;
        const normalized = Array.isArray(fetched)
          ? fetched.map((item, index) => ({
              id: item?.id || item?.productId || `pkg-${index + 1}`,
              productId: item?.productId || item?.sku,
              label: item?.label || item?.title || `${item?.points || ''}P`,
              price: item?.priceText || item?.price || '',
              points: item?.points || Number.parseInt(item?.label, 10) || null,
              recommended: Boolean(item?.recommended),
            }))
          : [];
        setPackages(normalized);

        const productIds = normalized
          .map((pkg) => pkg.productId)
          .filter((id) => typeof id === 'string' && id.length > 0);
        if (isIapAvailable && productIds.length > 0) {
          const { responseCode, results } = await InAppPurchases.getProductsAsync(productIds);
          if (responseCode === InAppPurchases.IAPResponseCode.OK && Array.isArray(results)) {
            setIapProducts(results);
          }
        }
        if (!isIapAvailable) {
          setError(IAP_UNAVAILABLE_MESSAGE);
        }
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
  }, [isIapAvailable]);

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
      if (!isIapAvailable) {
        Alert.alert('지원되지 않음', IAP_UNAVAILABLE_MESSAGE);
        return;
      }
      if (!item?.productId) {
        Alert.alert('준비중', '이 상품은 아직 스토어 상품ID가 연결되지 않았습니다. 관리자에서 설정해 주세요.');
        return;
      }
      try {
        setPurchaseProcessing(true);
        await InAppPurchases.requestPurchaseAsync(item.productId);
      } catch (err) {
        setPurchaseProcessing(false);
        Alert.alert('결제 요청 실패', err?.message || '결제를 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
    },
    [isIapAvailable, purchaseProcessing],
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>상점</Text>
        <View style={styles.pointBadge}>
          <Text style={styles.pointIcon}>P</Text>
          <Text style={styles.pointText}>{balance}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
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
                <Text style={styles.buyBtnText}>{getPriceLabel(item)}</Text>
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
