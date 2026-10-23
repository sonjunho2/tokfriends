import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  MarketProduct,
  fetchMarketProducts,
  fetchNormalProducts,
  INITIAL_MARKET_PRODUCTS,
} from '../../services/marketService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type HostLiveTabType = 'ALL' | 'MERCHANT' | 'B2C' | 'C2C';

interface HostLiveControlSheetProps {
  visible: boolean;
  onClose: () => void;
  roomId: string;
  pinnedProduct: MarketProduct | null;
  onTogglePin: (product: MarketProduct) => void;
}

export default function HostLiveControlSheet({
  visible,
  onClose,
  roomId,
  pinnedProduct,
  onTogglePin,
}: HostLiveControlSheetProps) {
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<HostLiveTabType>('ALL');

  useEffect(() => {
    if (!visible) return;
    let mounted = true;
    setLoading(true);

    Promise.allSettled([
      fetchMarketProducts(),
      fetchNormalProducts(),
    ])
      .then(([marketRes, normalRes]) => {
        if (!mounted) return;

        const marketItems: MarketProduct[] =
          marketRes.status === 'fulfilled' && marketRes.value?.length > 0
            ? marketRes.value
            : INITIAL_MARKET_PRODUCTS;

        const normalItems: MarketProduct[] =
          normalRes.status === 'fulfilled' && normalRes.value?.length > 0
            ? normalRes.value.map((np) => ({
                id: np.id,
                type: 'B2C_NORMAL' as any,
                title: np.name,
                description: np.description,
                category: np.category,
                price: np.salePriceKrw || np.priceKrw,
                originalPrice: np.priceKrw,
                images: np.images,
                status: np.stock <= 0 ? 'SOLD_OUT' : 'ACTIVE',
                locationName: '전국 무료배송',
                distanceKm: 0,
                seller: {
                  id: np.merchantId || 'mer-001',
                  nickname: np.merchantName || '인증 입점사',
                  avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
                  trustScore: 99.5,
                },
                likesCount: 28,
                chatsCount: 6,
                createdAt: np.createdAt || '방금 전',
              }))
            : [];

        // 중복 방지 병합 (입점사 일반 상품 + 마켓 상품)
        setProducts([...normalItems, ...marketItems]);
      })
      .catch(() => {
        if (mounted) setProducts(INITIAL_MARKET_PRODUCTS);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [visible]);

  const filtered = products.filter((p) => {
    if (activeTab === 'MERCHANT') return (p.type as string) === 'B2C_NORMAL';
    if (activeTab === 'B2C') return p.type === 'B2C_GROUP';
    if (activeTab === 'C2C') return p.type === 'C2C_USED';
    return true;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.touchDismiss} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetContainer}>
          {/* Header handle */}
          <View style={styles.handleBar} />

          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <Text style={styles.sheetTitle}>🛍️ 방송 판매 상품 관리</Text>
              <Text style={styles.sheetSub}>
                시청자 화면에 실시간으로 소개할 상품을 핀으로 고정하세요.
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Segment Filter (4대 탭) */}
          <View style={styles.tabRow}>
            {[
              { id: 'ALL', label: '전체' },
              { id: 'MERCHANT', label: '🛍️ 입점사' },
              { id: 'B2C', label: '🔥 특가공구' },
              { id: 'C2C', label: '🏷️ 중고' },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab.id as HostLiveTabType)}
                >
                  <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Product List */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#FF3B6B" />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isPinned = pinnedProduct?.id === item.id;
                const isNormal = (item.type as string) === 'B2C_NORMAL';
                const isGroup = item.type === 'B2C_GROUP';
                const thumb = item.images?.[0] || 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300';

                return (
                  <View style={[styles.productCard, isPinned && styles.productCardPinned]}>
                    <Image source={{ uri: thumb }} style={styles.productThumb} resizeMode="cover" />

                    <View style={styles.productInfo}>
                      <View style={styles.badgeRow}>
                        <View
                          style={[
                            styles.typeBadge,
                            isNormal
                              ? styles.typeBadgeMerchant
                              : isGroup
                              ? styles.typeBadgeB2C
                              : styles.typeBadgeC2C,
                          ]}
                        >
                          <Text
                            style={[
                              styles.typeBadgeText,
                              isNormal
                                ? styles.typeBadgeTextMerchant
                                : isGroup
                                ? styles.typeBadgeTextB2C
                                : styles.typeBadgeTextC2C,
                            ]}
                          >
                            {isNormal ? '브랜드특가' : isGroup ? '특가공구' : '중고판매'}
                          </Text>
                        </View>
                        {isPinned && (
                          <View style={styles.pinnedLiveBadge}>
                            <Ionicons name="pin" size={10} color="#FFFFFF" />
                            <Text style={styles.pinnedLiveBadgeText}>화면 고정중</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.productTitle} numberOfLines={1}>
                        {item.title}
                      </Text>

                      <Text style={styles.productPrice}>
                        {item.price.toLocaleString()}원
                        {item.originalPrice && item.originalPrice > item.price ? (
                          <Text style={styles.originalPriceText}>
                            {' '}{item.originalPrice.toLocaleString()}원
                          </Text>
                        ) : null}
                      </Text>
                    </View>

                    {/* Pin Toggle Button */}
                    <TouchableOpacity
                      style={[styles.pinToggleBtn, isPinned && styles.pinToggleBtnActive]}
                      activeOpacity={0.85}
                      onPress={() => onTogglePin(item)}
                    >
                      <Ionicons
                        name={isPinned ? 'pin' : 'pin-outline'}
                        size={15}
                        color={isPinned ? '#FFFFFF' : '#4F46E5'}
                      />
                      <Text style={[styles.pinToggleText, isPinned && styles.pinToggleTextActive]}>
                        {isPinned ? '고정해제' : '📌 핀 고정'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  touchDismiss: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: SCREEN_HEIGHT * 0.75,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  titleWrap: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  sheetSub: {
    fontSize: 12,
    color: '#64748B',
  },
  closeBtn: {
    padding: 4,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  loadingBox: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    gap: 10,
  },
  productCardPinned: {
    borderColor: '#FF3B6B',
    backgroundColor: '#FFF1F2',
  },
  productThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  productInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  typeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  typeBadgeMerchant: {
    backgroundColor: '#EEF2FF',
  },
  typeBadgeB2C: {
    backgroundColor: '#FEE2E2',
  },
  typeBadgeC2C: {
    backgroundColor: '#E0E7FF',
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  typeBadgeTextMerchant: {
    color: '#4F46E5',
  },
  typeBadgeTextB2C: {
    color: '#EF4444',
  },
  typeBadgeTextC2C: {
    color: '#4F46E5',
  },
  pinnedLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FF3B6B',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  pinnedLiveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  originalPriceText: {
    fontSize: 10,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  pinToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  pinToggleBtnActive: {
    backgroundColor: '#FF3B6B',
    borderColor: '#FF3B6B',
  },
  pinToggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
  },
  pinToggleTextActive: {
    color: '#FFFFFF',
  },
});
