import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import ScrollExpandableFAB from '../../components/common/ScrollExpandableFAB';
import {
  MarketProduct,
  MARKET_CATEGORIES,
  fetchMarketProducts,
} from '../../services/marketService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 36) / 2;

export default function MarketScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<'C2C_USED' | 'B2C_GROUP'>('C2C_USED');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isFabExpanded, setIsFabExpanded] = useState<boolean>(true);

  const lastScrollY = useRef<number>(0);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchMarketProducts({
        type: selectedType,
        category: selectedCategory,
      });
      setProducts(data);
    } catch (err) {
      console.warn('[MarketScreen] load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedType, selectedCategory]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // 스크롤 감지에 따른 가변 FAB 상태 전환
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    if (currentY <= 15) {
      setIsFabExpanded(true);
    } else if (currentY > lastScrollY.current + 8) {
      setIsFabExpanded(false); // 아래로 스크롤 시 축소
    } else if (currentY < lastScrollY.current - 12) {
      setIsFabExpanded(true);  // 위로 스크롤 시 확장
    }
    lastScrollY.current = currentY;
  };

  const renderProductItem = ({ item }: { item: MarketProduct }) => {
    const isB2C = item.type === 'B2C_GROUP';
    const discountRate =
      isB2C && item.originalPrice && item.originalPrice > item.price
        ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
        : 0;

    const progressPercent =
      isB2C && item.targetQuantity
        ? Math.min(100, Math.round(((item.currentQuantity || 0) / item.targetQuantity) * 100))
        : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      >
        {/* 상품 이미지 */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: item.images[0] }} style={styles.cardImage} resizeMode="cover" />
          {/* 에스크로 안전결제 뱃지 */}
          <View style={styles.escrowBadge}>
            <Ionicons name="shield-checkmark" size={11} color="#FFFFFF" />
            <Text style={styles.escrowBadgeText}>안전결제</Text>
          </View>
          {isB2C && discountRate > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountRate}% OFF</Text>
            </View>
          )}
        </View>

        {/* 상품 정보 */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {/* B2C 공동구매 달성률 게이지 */}
          {isB2C ? (
            <View style={styles.groupInfoBox}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
              <View style={styles.groupMetaRow}>
                <Text style={styles.groupPercentText}>🔥 {progressPercent}% 달성</Text>
                <Text style={styles.groupRemainingText}>
                  {Math.max(0, (item.targetQuantity || 0) - (item.currentQuantity || 0))}명 남음
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.locationText}>
              {item.locationName} · {item.distanceKm > 0 ? `${item.distanceKm}km` : '우리동네'}
            </Text>
          )}

          {/* 가격 (1 ON = 1원) */}
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>
              {item.price.toLocaleString()} <Text style={styles.currencyUnit}>ON</Text>
            </Text>
            {isB2C && item.originalPrice ? (
              <Text style={styles.originalPriceText}>
                {item.originalPrice.toLocaleString()}원
              </Text>
            ) : null}
          </View>

          {/* 하단 반응 정보 */}
          <View style={styles.cardFooter}>
            <Text style={styles.timeText}>{item.createdAt}</Text>
            <View style={styles.reactionsRow}>
              {item.chatsCount > 0 && (
                <View style={styles.reactionItem}>
                  <Ionicons name="chatbubble-ellipses-outline" size={12} color={tokens.colors.textTertiary} />
                  <Text style={styles.reactionCount}>{item.chatsCount}</Text>
                </View>
              )}
              {item.likesCount > 0 && (
                <View style={styles.reactionItem}>
                  <Ionicons name="heart-outline" size={12} color={tokens.colors.textTertiary} />
                  <Text style={styles.reactionCount}>{item.likesCount}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 1. 상단 통일 56px 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>마켓</Text>
          <TouchableOpacity style={styles.locationSelector} activeOpacity={0.7}>
            <Text style={styles.locationSelectorText}>역삼1동</Text>
            <Ionicons name="chevron-down" size={14} color={tokens.colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
            <Ionicons name="search-outline" size={22} color={tokens.colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={22} color={tokens.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. 상단 듀얼 세그먼트: [동네 중고거래] vs [핫딜 공동구매] */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, selectedType === 'C2C_USED' && styles.segmentBtnActive]}
          onPress={() => setSelectedType('C2C_USED')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="cart-outline"
            size={16}
            color={selectedType === 'C2C_USED' ? tokens.colors.primary : tokens.colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              selectedType === 'C2C_USED' && styles.segmentTextActive,
            ]}
          >
            동네 중고거래
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, selectedType === 'B2C_GROUP' && styles.segmentBtnActive]}
          onPress={() => setSelectedType('B2C_GROUP')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="flame"
            size={16}
            color={selectedType === 'B2C_GROUP' ? '#FF5722' : tokens.colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              selectedType === 'B2C_GROUP' && styles.segmentTextActiveGroup,
            ]}
          >
            핫딜 공동구매
          </Text>
          <View style={styles.hotBadge}>
            <Text style={styles.hotBadgeText}>특가</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 3. 카테고리 캡슐 가로 스크롤 필터 */}
      <View style={styles.categoryContainer}>
        <FlatList
          data={MARKET_CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoryContent}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item.id;
            return (
              <TouchableOpacity
                style={[styles.categoryCapsule, isSelected && styles.categoryCapsuleActive]}
                onPress={() => setSelectedCategory(item.id)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.categoryCapsuleText,
                    isSelected && styles.categoryCapsuleTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* 4. 2열 상품 그리드 */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
          <Text style={styles.loadingText}>안전거래 상품을 불러오는 중...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          renderItem={renderProductItem}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tokens.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="basket-outline" size={48} color={tokens.colors.textTertiary} />
              <Text style={styles.emptyTitle}>등록된 상품이 없습니다</Text>
              <Text style={styles.emptySubtitle}>가장 먼저 물품을 등록하고 이웃과 거래를 시작해보세요!</Text>
            </View>
          }
        />
      )}

      {/* 5. 우측 하단 가변 FAB: + 물품등록 */}
      <ScrollExpandableFAB
        label="물품등록"
        iconName="add"
        isExpanded={isFabExpanded}
        onPress={() => navigation.navigate('MarketCreate')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationSelectorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  segmentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  segmentBtn: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  segmentBtnActive: {
    backgroundColor: '#FFF0F3',
    borderColor: '#FF3B6B',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#FF3B6B',
    fontWeight: '800',
  },
  segmentTextActiveGroup: {
    color: '#FF5722',
    fontWeight: '800',
  },
  hotBadge: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  hotBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  categoryContainer: {
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryCapsule: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
  },
  categoryCapsuleActive: {
    backgroundColor: '#0F172A',
  },
  categoryCapsuleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  categoryCapsuleTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  gridContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 110,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  imageWrapper: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  escrowBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  escrowBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF3B6B',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  cardContent: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
    height: 36,
  },
  groupInfoBox: {
    marginVertical: 4,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF5722',
  },
  groupMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  groupPercentText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF5722',
  },
  groupRemainingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  locationText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  currencyUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF3B6B',
  },
  originalPriceText: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  timeText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reactionCount: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
