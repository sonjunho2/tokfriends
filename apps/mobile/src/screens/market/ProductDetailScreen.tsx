import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '../../theme/tokens';
import {
  MarketProduct,
  NormalProduct,
  fetchMarketProductById,
  fetchNormalProductById,
  toggleProductLike,
} from '../../services/marketService';
import PgPaymentBottomSheet from '../../components/live/PgPaymentBottomSheet';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { productId, isNormalProduct: paramIsNormal, normalProduct: paramNormal } = route.params || {};

  const [product, setProduct] = useState<MarketProduct | null>(null);
  const [normalProduct, setNormalProduct] = useState<NormalProduct | null>(paramNormal || null);
  const [isNormal, setIsNormal] = useState<boolean>(
    Boolean(paramIsNormal || (productId && String(productId).startsWith('np-')))
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [showPgBottomSheet, setShowPgBottomSheet] = useState<boolean>(false);

  // 추천/좋아요(하트) 토글 핸들러
  const handleToggleLike = () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    if (product) {
      setProduct({
        ...product,
        likesCount: Math.max(0, (product.likesCount || 0) + (nextLiked ? 1 : -1)),
        isLiked: nextLiked,
      });
    }
    const pId = productId || (isNormal ? normalProduct?.id : product?.id);
    if (pId) {
      toggleProductLike(pId).catch(() => {});
    }
    Alert.alert(
      nextLiked ? '❤️ 관심 상품 등록' : '관심 상품 해제',
      nextLiked
        ? '관심 상품(추천)에 등록되었습니다.'
        : '관심 상품(추천)에서 해제되었습니다.'
    );
  };

  // SNS 공유하기 (React Native Share.share)
  const handleShareProduct = async () => {
    try {
      const pId = productId || (isNormal ? normalProduct?.id : product?.id);
      const name = isNormal ? normalProduct?.name : product?.name;
      const shareUrl = `https://dagaon.app/share/market/${pId}`;
      let discountRate = 0;
      if (isNormal && normalProduct) {
        const orig = normalProduct.priceKrw || 0;
        const sale = normalProduct.salePriceKrw || normalProduct.priceKrw || 0;
        if (orig > sale) {
          discountRate = Math.round(((orig - sale) / orig) * 100);
        }
      } else if (product && product.originalPrice && product.originalPrice > product.price) {
        discountRate = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
      }

      const discountMsg = discountRate > 0 ? ` - ${discountRate}% 특가 할인!` : '';
      const message = `[다가온] ${name || '특가 상품'}${discountMsg} 지금 확인해보세요.\n${shareUrl}`;

      await Share.share({
        title: `[다가온] ${name || '상품 안내'}`,
        message,
        url: shareUrl,
      });
    } catch (err: any) {
      console.warn('Share error:', err?.message);
    }
  };

  useEffect(() => {
    async function load() {
      if (!productId) return;
      try {
        if (isNormal) {
          if (!normalProduct) {
            const np = await fetchNormalProductById(productId);
            if (np) {
              setNormalProduct(np);
            }
          }
        } else {
          const item = await fetchMarketProductById(productId);
          if (item) {
            setProduct(item);
            setIsLiked(Boolean(item.isLiked));
          } else {
            // C2C에서 못 찾으면 B2C 일반 상품에서 탐색
            const np = await fetchNormalProductById(productId);
            if (np) {
              setNormalProduct(np);
              setIsNormal(true);
            }
          }
        }
      } catch (err) {
        console.warn('[ProductDetailScreen] load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId, isNormal]);

  if (loading || (!product && !normalProduct)) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
        <Text style={styles.loadingText}>상품 정보를 불러오는 중...</Text>
      </View>
    );
  }

  // B2C 일반 상품 뷰 렌더링
  if (isNormal && normalProduct) {
    const images = normalProduct.images?.length > 0
      ? normalProduct.images
      : ['https://images.unsplash.com/photo-1544025162-d76694265947?w=600'];
    const originalPrice = normalProduct.priceKrw;
    const finalPrice = normalProduct.salePriceKrw || normalProduct.priceKrw;
    const discountRate =
      originalPrice && originalPrice > finalPrice
        ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
        : 0;
    const isOutOfStock = normalProduct.stock <= 0 || normalProduct.status === 'OUT_OF_STOCK';
    const merchantInfo = normalProduct.merchant || {
      businessName: normalProduct.merchantName || '제주푸드 본사 직영',
      representative: '고성훈',
      businessNumber: '616-81-99201',
      onlineOrderNumber: '2025-제주오라-0112',
    };

    // PgPaymentBottomSheet 호환 객체
    const convertedMarketProduct: MarketProduct = {
      id: normalProduct.id,
      type: 'B2C_GROUP',
      title: normalProduct.name,
      description: normalProduct.description,
      category: normalProduct.category,
      price: finalPrice,
      originalPrice: originalPrice,
      images: images,
      status: isOutOfStock ? 'SOLD_OUT' : 'ACTIVE',
      locationName: '전국 무료배송',
      distanceKm: 0,
      seller: {
        id: normalProduct.merchantId || 'merchant-seller',
        nickname: merchantInfo.businessName,
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
        trustScore: 99.5,
      },
      likesCount: 38,
      chatsCount: 5,
      createdAt: normalProduct.createdAt || '방금 전',
    };

    return (
      <View style={styles.container}>
        {/* 상단 플로팅 헤더 */}
        <View style={[styles.floatingHeader, { top: insets.top }]}>
          <TouchableOpacity
            style={styles.headerCircleBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerRightActions}>
            <TouchableOpacity style={styles.headerCircleBtn} activeOpacity={0.8} onPress={handleShareProduct}>
              <Ionicons name="share-social-outline" size={20} color="#0F172A" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerCircleBtn} activeOpacity={0.8}>
              <Ionicons name="ellipsis-vertical" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* 1. 상품 이미지 슬라이더 */}
          <View style={styles.carouselWrapper}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const x = e.nativeEvent.contentOffset.x;
                setActiveImageIndex(Math.round(x / width));
              }}
              scrollEventThrottle={16}
            >
              {images.map((img, idx) => (
                <Image key={idx} source={{ uri: img }} style={styles.carouselImage} resizeMode="cover" />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.pageIndicator}>
                <Text style={styles.pageIndicatorText}>
                  {activeImageIndex + 1} / {images.length}
                </Text>
              </View>
            )}
          </View>

          {/* 2. 입점사 정보 카드 (상호, 대표자, 사업자번호 등) */}
          <View style={styles.merchantSection}>
            <View style={styles.merchantHeaderRow}>
              <View style={styles.merchantBadgeBox}>
                <Ionicons name="shield-checkmark" size={13} color="#4F46E5" />
                <Text style={styles.merchantBadgeText}>공식인증 입점사</Text>
              </View>
              <Text style={styles.merchantTrustScore}>신뢰도 99.5%</Text>
            </View>

            <Text style={styles.merchantTitle}>{merchantInfo.businessName}</Text>

            <View style={styles.merchantDetailsGrid}>
              <View style={styles.merchantDetailRow}>
                <Text style={styles.merchantDetailKey}>대표자</Text>
                <Text style={styles.merchantDetailVal}>{merchantInfo.representative || '대표'}</Text>
              </View>
              <View style={styles.merchantDetailRow}>
                <Text style={styles.merchantDetailKey}>사업자등록번호</Text>
                <Text style={styles.merchantDetailVal}>{merchantInfo.businessNumber || '미등록'}</Text>
              </View>
              {merchantInfo.onlineOrderNumber ? (
                <View style={styles.merchantDetailRow}>
                  <Text style={styles.merchantDetailKey}>통신판매업신고</Text>
                  <Text style={styles.merchantDetailVal}>{merchantInfo.onlineOrderNumber}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.divider} />

          {/* 3. 상품 상세 본문 */}
          <View style={styles.contentSection}>
            <View style={styles.categoryBadgeRow}>
              <Text style={styles.categoryText}>{normalProduct.category}</Text>
              <Text style={styles.dotSeparator}>·</Text>
              <Text style={styles.timeText}>{normalProduct.createdAt || '최근 등록'}</Text>
            </View>

            <Text style={styles.productTitle}>{normalProduct.name}</Text>

            {/* 가격 정보 */}
            <View style={styles.b2cPriceContainer}>
              {discountRate > 0 && (
                <View style={styles.discountRow}>
                  <Text style={styles.discountBigText}>{discountRate}% OFF</Text>
                  <Text style={styles.originalBigPriceText}>
                    {originalPrice.toLocaleString()}원
                  </Text>
                </View>
              )}
              <View style={styles.finalPriceRow}>
                <Text style={styles.finalPriceText}>
                  {finalPrice.toLocaleString()}원
                </Text>
                <Text style={styles.finalPriceSubText}>(에스크로 안전결제)</Text>
              </View>
            </View>

            {/* 배송비 및 재고 안내 카드 */}
            <View style={styles.shippingNoticeBox}>
              <View style={styles.shippingNoticeRow}>
                <Ionicons name="cube-outline" size={18} color="#059669" />
                <View style={styles.shippingNoticeTextCol}>
                  <Text style={styles.shippingNoticeTitle}>
                    {normalProduct.shippingFee === 0
                      ? '전국 무료배송 (제주/도서산간 3,000원 추가)'
                      : `배송비: ${normalProduct.shippingFee?.toLocaleString()}원`}
                  </Text>
                  <Text style={styles.shippingNoticeSub}>
                    오후 2시 이전 결제 완료 시 오늘 출발 · 안심포장 배송
                  </Text>
                </View>
              </View>
              <View style={styles.stockStatusRow}>
                <Text style={styles.stockStatusLabel}>재고 상태</Text>
                <Text style={[styles.stockStatusVal, isOutOfStock && styles.stockStatusOutOfStock]}>
                  {isOutOfStock ? '일시품절' : `구매가능 (잔여 ${normalProduct.stock}개)`}
                </Text>
              </View>
            </View>

            {/* 상품 설명 */}
            <Text style={styles.descriptionText}>{normalProduct.description}</Text>

            {/* 4. 에스크로 안전결제 보증 카드 */}
            <View style={styles.escrowGuaranteeCard}>
              <View style={styles.escrowGuaranteeIconBox}>
                <Ionicons name="shield-checkmark" size={24} color="#10B981" />
              </View>
              <View style={styles.escrowGuaranteeTextBox}>
                <Text style={styles.escrowGuaranteeTitle}>토스페이먼츠 PG 에스크로 100% 안전결제</Text>
                <Text style={styles.escrowGuaranteeDesc}>
                  주문하신 상품을 정상 수령하고 [구매 확정]을 누르기 전까지 결제 대금이 플랫폼 금고에 안전하게 보관됩니다.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* 5. 하단 고정 바: [안전구매 하기] */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={handleToggleLike}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? '#FF3B6B' : tokens.colors.textSecondary}
            />
          </TouchableOpacity>

          <View style={styles.bottomDivider} />

          <View style={styles.bottomPriceBox}>
            <Text style={styles.bottomPriceText}>
              {finalPrice.toLocaleString()}원
            </Text>
            <Text style={styles.bottomPriceSub}>(에스크로 안전결제)</Text>
          </View>

          <TouchableOpacity
            style={[styles.b2cBuyBtn, isOutOfStock && styles.b2cBuyBtnDisabled]}
            disabled={isOutOfStock}
            onPress={() => setShowPgBottomSheet(true)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isOutOfStock ? ['#94A3B8', '#64748B'] : ['#4F46E5', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.b2cBuyBtnGradient}
            >
              <Ionicons name="shield-checkmark" size={17} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.b2cBuyBtnText}>
                {isOutOfStock ? '품절된 상품' : '안전구매 하기'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* PG 에스크로 결제 바텀시트 */}
        <PgPaymentBottomSheet
          visible={showPgBottomSheet}
          product={convertedMarketProduct}
          onClose={() => setShowPgBottomSheet(false)}
          onSuccess={(orderId, orderNumber) => {
            setShowPgBottomSheet(false);
            Alert.alert(
              '🎉 안전결제(에스크로) 승인 완료',
              `주문번호: ${orderNumber}\n\n입점사에서 확인 후 신속하게 발송을 시작합니다. 배송 현황은 마이페이지에서 확인하실 수 있습니다.`,
              [
                {
                  text: '확인',
                  onPress: () => navigation.goBack(),
                },
              ]
            );
          }}
        />
      </View>
    );
  }

  // C2C 중고 & 기존 B2C 공구 뷰
  if (!product) return null;
  const isB2C = product.type === 'B2C_GROUP';
  const progressPercent =
    isB2C && product.targetQuantity
      ? Math.min(100, Math.round(((product.currentQuantity || 0) / product.targetQuantity) * 100))
      : 0;

  return (
    <View style={styles.container}>
      {/* 1. 상단 플로팅 헤더 (뒤로가기 / 공유 / 옵션) */}
      <View style={[styles.floatingHeader, { top: insets.top }]}>
        <TouchableOpacity
          style={styles.headerCircleBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.headerCircleBtn} activeOpacity={0.8} onPress={handleShareProduct}>
            <Ionicons name="share-social-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerCircleBtn} activeOpacity={0.8}>
            <Ionicons name="ellipsis-vertical" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* 2. 사진 캐러셀 슬라이더 */}
        <View style={styles.carouselWrapper}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              setActiveImageIndex(Math.round(x / width));
            }}
            scrollEventThrottle={16}
          >
            {product.images.map((img, idx) => (
              <Image key={idx} source={{ uri: img }} style={styles.carouselImage} resizeMode="cover" />
            ))}
          </ScrollView>
          {product.images.length > 1 && (
            <View style={styles.pageIndicator}>
              <Text style={styles.pageIndicatorText}>
                {activeImageIndex + 1} / {product.images.length}
              </Text>
            </View>
          )}
        </View>

        {/* 3. 판매자 프로필 정보 (매너온도 / 신뢰지수) */}
        <View style={styles.sellerSection}>
          <View style={styles.sellerLeft}>
            <Image source={{ uri: product.seller.avatarUrl }} style={styles.sellerAvatar} />
            <View style={styles.sellerNameBox}>
              <View style={styles.sellerBadgeRow}>
                <Text style={styles.sellerNickname}>{product.seller.nickname}</Text>
                {isB2C && (
                  <View style={styles.verifiedStoreBadge}>
                    <Text style={styles.verifiedStoreText}>입점인증</Text>
                  </View>
                )}
              </View>
              <Text style={styles.sellerLocation}>
                {product.locationName} · {product.distanceKm > 0 ? `${product.distanceKm}km 이내` : '로컬 인증'}
              </Text>
            </View>
          </View>

          <View style={styles.trustScoreBox}>
            <View style={styles.trustScoreRow}>
              <Text style={styles.trustScoreValue}>{product.seller.trustScore}°C</Text>
              <Ionicons name="happy" size={18} color="#FF3B6B" />
            </View>
            <View style={styles.trustScoreBarBg}>
              <View
                style={[
                  styles.trustScoreBarFill,
                  { width: `${Math.min(100, product.seller.trustScore)}%` },
                ]}
              />
            </View>
            <Text style={styles.trustScoreLabel}>매너신뢰온도</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* 4. 상품 상세 본문 */}
        <View style={styles.contentSection}>
          <View style={styles.categoryBadgeRow}>
            <Text style={styles.categoryText}>{product.category}</Text>
            <Text style={styles.dotSeparator}>·</Text>
            <Text style={styles.timeText}>{product.createdAt}</Text>
          </View>

          <Text style={styles.productTitle}>{product.title}</Text>

          {/* B2C 공구 달성률 프로그레스 카드 */}
          {isB2C && (
            <View style={styles.groupDealCard}>
              <View style={styles.groupDealHeader}>
                <Text style={styles.groupDealTitle}>🔥 마감임박 공동구매</Text>
                <Text style={styles.groupDealTimer}>마감 카운트다운</Text>
              </View>
              <View style={styles.groupDealProgressBarBg}>
                <View style={[styles.groupDealProgressBarFill, { width: `${progressPercent}%` }]} />
              </View>
              <View style={styles.groupDealFooter}>
                <Text style={styles.groupDealPercentText}>{progressPercent}% 달성</Text>
                <Text style={styles.groupDealCountText}>
                  목표 {product.targetQuantity}명 중 {product.currentQuantity}명 참여 완료
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.descriptionText}>{product.description}</Text>

          {/* 5. 에스크로 안전결제 보증 카드 */}
          <View style={styles.escrowGuaranteeCard}>
            <View style={styles.escrowGuaranteeIconBox}>
              <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            </View>
            <View style={styles.escrowGuaranteeTextBox}>
              <Text style={styles.escrowGuaranteeTitle}>모꼬 에스크로 100% 안전거래</Text>
              <Text style={styles.escrowGuaranteeDesc}>
                구매자가 물품을 정상 수령하고 [구매 확정]을 누르기 전까지 결제 대금이 플랫폼 금고에 안전하게 보관됩니다.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 6. 하단 고정 액션 바 */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <TouchableOpacity
          style={styles.likeBtn}
          onPress={handleToggleLike}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={isLiked ? '#FF3B6B' : tokens.colors.textSecondary}
          />
        </TouchableOpacity>

        <View style={styles.bottomDivider} />

        <View style={styles.bottomPriceBox}>
          <Text style={styles.bottomPriceText}>
            {product.price.toLocaleString()}원
          </Text>
          <Text style={styles.bottomPriceSub}>(에스크로 안전거래)</Text>
        </View>

        <View style={styles.bottomBtnGroup}>
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => {
              navigation.navigate('ChatRoom', {
                peerId: product.seller.id,
                peerName: product.seller.nickname,
                marketOrder: {
                  productId: product.id,
                  title: product.title,
                  price: product.price,
                },
              });
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#0F172A" />
            <Text style={styles.chatBtnText}>거래 톡</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buyBtn}
            onPress={() => setShowPgBottomSheet(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
            <Text style={styles.buyBtnText}>안전구매 하기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* PG 에스크로 결제 바텀시트 */}
      <PgPaymentBottomSheet
        visible={showPgBottomSheet}
        product={product}
        onClose={() => setShowPgBottomSheet(false)}
        onSuccess={(orderId, orderNumber) => {
          setShowPgBottomSheet(false);
          Alert.alert(
            '🎉 안전결제(에스크로) 완료',
            `주문번호: ${orderNumber}\n대금이 안전하게 예치되었습니다. 물품 수령 후 [구매 확정]을 진행해주세요.`,
            [
              {
                text: '거래 톡으로 이동',
                onPress: () => {
                  navigation.navigate('ChatRoom', {
                    peerId: product.seller.id,
                    peerName: product.seller.nickname,
                    marketOrder: {
                      productId: product.id,
                      orderNumber,
                      title: product.title,
                      price: product.price,
                      escrowStatus: 'PAID_ESCROW',
                    },
                  });
                },
              },
              { text: '확인' },
            ]
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  floatingHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  carouselWrapper: {
    width,
    height: width,
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  carouselImage: {
    width,
    height: width,
  },
  pageIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pageIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // 입점사 정보 카드
  merchantSection: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  merchantHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  merchantBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  merchantBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
  },
  merchantTrustScore: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  merchantTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  merchantDetailsGrid: {
    gap: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  merchantDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  merchantDetailKey: {
    fontSize: 11,
    color: '#64748B',
  },
  merchantDetailVal: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },

  // C2C 판매자 섹션
  sellerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  sellerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  sellerNameBox: {
    flex: 1,
  },
  sellerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerNickname: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifiedStoreBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedStoreText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4F46E5',
  },
  sellerLocation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  trustScoreBox: {
    alignItems: 'flex-end',
  },
  trustScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustScoreValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FF3B6B',
  },
  trustScoreBarBg: {
    width: 60,
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 2,
  },
  trustScoreBarFill: {
    height: '100%',
    backgroundColor: '#FF3B6B',
  },
  trustScoreLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },

  divider: {
    height: 8,
    backgroundColor: '#F8FAFC',
  },

  // 본문 상세
  contentSection: {
    padding: 18,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  dotSeparator: {
    marginHorizontal: 6,
    color: '#CBD5E1',
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 24,
    marginBottom: 12,
  },

  // B2C 가격 컨테이너
  b2cPriceContainer: {
    backgroundColor: '#FFF1F2',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  discountBigText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#E11D48',
  },
  originalBigPriceText: {
    fontSize: 13,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  finalPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  finalPriceText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  finalPriceUnit: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF3B6B',
  },
  finalPriceSubText: {
    fontSize: 11,
    color: '#64748B',
  },

  // 배송 및 재고 안내
  shippingNoticeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shippingNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  shippingNoticeTextCol: {
    flex: 1,
  },
  shippingNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  shippingNoticeSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  stockStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  stockStatusLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  stockStatusVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  stockStatusOutOfStock: {
    color: '#EF4444',
  },

  // 공구 카드
  groupDealCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  groupDealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupDealTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C2410C',
  },
  groupDealTimer: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
  },
  groupDealProgressBarBg: {
    height: 6,
    backgroundColor: '#FFEDD5',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  groupDealProgressBarFill: {
    height: '100%',
    backgroundColor: '#EA580C',
  },
  groupDealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  groupDealPercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C',
  },
  groupDealCountText: {
    fontSize: 11,
    color: '#9A3412',
  },

  descriptionText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 20,
  },

  escrowGuaranteeCard: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    alignItems: 'center',
  },
  escrowGuaranteeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  escrowGuaranteeTextBox: {
    flex: 1,
  },
  escrowGuaranteeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 2,
  },
  escrowGuaranteeDesc: {
    fontSize: 11,
    color: '#047857',
    lineHeight: 16,
  },

  // 하단 고정 바
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  likeBtn: {
    padding: 8,
  },
  bottomDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },
  bottomPriceBox: {
    flex: 1,
  },
  bottomPriceText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  bottomCurrencyUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF3B6B',
  },
  bottomPriceSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  bottomBtnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
  },
  chatBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF3B6B',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
  },
  buyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  b2cBuyBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  b2cBuyBtnDisabled: {
    opacity: 0.6,
  },
  b2cBuyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  b2cBuyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
