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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import {
  MarketProduct,
  fetchMarketProductById,
} from '../../services/marketService';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { productId } = route.params || {};

  const [product, setProduct] = useState<MarketProduct | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [showEscrowModal, setShowEscrowModal] = useState<boolean>(false);
  const [purchaseProcessing, setPurchaseProcessing] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      if (!productId) return;
      try {
        const item = await fetchMarketProductById(productId);
        setProduct(item);
      } catch (err) {
        console.warn('[ProductDetailScreen] load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  if (loading || !product) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
        <Text style={styles.loadingText}>상품 정보를 불러오는 중...</Text>
      </View>
    );
  }

  const isB2C = product.type === 'B2C_GROUP';
  const progressPercent =
    isB2C && product.targetQuantity
      ? Math.min(100, Math.round(((product.currentQuantity || 0) / product.targetQuantity) * 100))
      : 0;

  const handleEscrowPayment = () => {
    setPurchaseProcessing(true);
    setTimeout(() => {
      setPurchaseProcessing(false);
      setShowEscrowModal(false);
      Alert.alert(
        '🎉 에스크로 안전결제 완료',
        `물품 대금 ${product.price.toLocaleString()} ON이 안전하게 예치되었습니다.\n\n물품을 정상적으로 수령하신 후 [구매 확정]을 눌러주시면 판매자에게 대금이 정산됩니다.`,
        [
          {
            text: '거래 톡으로 이동',
            onPress: () => {
              navigation.navigate('ChatRoom', {
                peerId: product.seller.id,
                peerName: product.seller.nickname,
                marketOrder: {
                  productId: product.id,
                  title: product.title,
                  price: product.price,
                  status: 'ESCROW_HOLD',
                },
              });
            },
          },
          { text: '확인' },
        ]
      );
    }, 1200);
  };

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
          <TouchableOpacity style={styles.headerCircleBtn} activeOpacity={0.8}>
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
              <Text style={styles.escrowGuaranteeTitle}>ON 포인트 에스크로 100% 안전거래</Text>
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
          onPress={() => setIsLiked(!isLiked)}
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
            {product.price.toLocaleString()} <Text style={styles.bottomCurrencyUnit}>ON</Text>
          </Text>
          <Text style={styles.bottomPriceSub}>1 ON = 1원</Text>
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
            onPress={() => setShowEscrowModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
            <Text style={styles.buyBtnText}>안전결제</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 7. 에스크로 바로구매 확인 모달 */}
      <Modal
        visible={showEscrowModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEscrowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalShieldCircle}>
                <Ionicons name="shield-checkmark" size={28} color="#10B981" />
              </View>
              <Text style={styles.modalTitle}>에스크로 안전결제</Text>
              <Text style={styles.modalSubtitle}>
                물품 대금이 플랫폼에 안전하게 예치됩니다
              </Text>
            </View>

            <View style={styles.modalSummaryBox}>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>상품명</Text>
                <Text style={styles.modalSummaryValue} numberOfLines={1}>
                  {product.title}
                </Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>판매자</Text>
                <Text style={styles.modalSummaryValue}>{product.seller.nickname}</Text>
              </View>
              <View style={styles.modalDivider} />
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalTotalLabel}>결제 예정 포인트</Text>
                <Text style={styles.modalTotalValue}>
                  {product.price.toLocaleString()} ON <Text style={styles.modalWonText}>({product.price.toLocaleString()}원)</Text>
                </Text>
              </View>
            </View>

            <View style={styles.modalNoticeBox}>
              <Ionicons name="information-circle-outline" size={15} color="#64748B" />
              <Text style={styles.modalNoticeText}>
                물품 수령 후 [구매 확정] 시에만 판매자에게 정산됩니다.
              </Text>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowEscrowModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleEscrowPayment}
                activeOpacity={0.85}
                disabled={purchaseProcessing}
              >
                {purchaseProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>안전 예치 결제하기</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  floatingHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  carouselWrapper: {
    width: width,
    height: width,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  carouselImage: {
    width: width,
    height: width,
  },
  pageIndicator: {
    position: 'absolute',
    bottom: 14,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pageIndicatorText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sellerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sellerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sellerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E2E8F0',
  },
  sellerNameBox: {
    justifyContent: 'center',
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
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedStoreText: {
    color: '#4338CA',
    fontSize: 10,
    fontWeight: '800',
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
    width: 65,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  trustScoreBarFill: {
    height: '100%',
    backgroundColor: '#FF3B6B',
  },
  trustScoreLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  contentSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  dotSeparator: {
    color: '#CBD5E1',
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  productTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 26,
    marginTop: 8,
  },
  groupDealCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  groupDealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupDealTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EA580C',
  },
  groupDealTimer: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9A3412',
  },
  groupDealProgressBarBg: {
    height: 6,
    backgroundColor: '#FED7AA',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  groupDealProgressBarFill: {
    height: '100%',
    backgroundColor: '#EA580C',
  },
  groupDealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  groupDealPercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C',
  },
  groupDealCountText: {
    fontSize: 11,
    color: '#7C2D12',
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#334155',
    marginTop: 16,
  },
  escrowGuaranteeCard: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 14,
    padding: 14,
    marginTop: 24,
    gap: 12,
  },
  escrowGuaranteeIconBox: {
    marginTop: 2,
  },
  escrowGuaranteeTextBox: {
    flex: 1,
  },
  escrowGuaranteeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  escrowGuaranteeDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: '#15803D',
    marginTop: 3,
  },
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
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  likeBtn: {
    padding: 6,
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
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  bottomCurrencyUnit: {
    fontSize: 13,
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FF3B6B',
  },
  buyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    alignItems: 'center',
  },
  modalShieldCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  modalSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  modalSummaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  modalSummaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: '65%',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  modalTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalTotalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FF3B6B',
  },
  modalWonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modalNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  modalNoticeText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  modalConfirmBtn: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
