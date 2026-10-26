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
  Linking,
  Share,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '../../theme/tokens';
import ScrollExpandableFAB from '../../components/common/ScrollExpandableFAB';
import {
  MarketProduct,
  NormalProduct,
  MARKET_CATEGORIES,
  fetchMarketProducts,
  fetchNormalProducts,
  toggleProductLike,
} from '../../services/marketService';
import {
  AdvertisementItem,
  fetchAdsByPlacement,
  recordAdImpression,
  recordAdClick,
} from '../../services/adsService';

const { width } = Dimensions.get('window');
const SCREEN_PADDING = 14;
const CARD_GAP = 10;
const BANNER_WIDTH = width - SCREEN_PADDING * 2;
const CARD_WIDTH = (width - SCREEN_PADDING * 2 - CARD_GAP) / 2;

type MarketTabType = 'C2C_USED' | 'B2C_NORMAL' | 'B2C_GROUP';
type NormalSortType = 'recent' | 'priceAsc' | 'priceDesc' | 'popular';

export default function MarketScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<MarketTabType>('C2C_USED');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSort, setSelectedSort] = useState<NormalSortType>('recent');

  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [normalProducts, setNormalProducts] = useState<NormalProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isFabExpanded, setIsFabExpanded] = useState<boolean>(true);

  // 검색 상태
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 찜하기/추천 상태
  const [likedProductIds, setLikedProductIds] = useState<Set<string>>(new Set());

  // 상단 광고 배너 캐러셀 상태
  const [ads, setAds] = useState<AdvertisementItem[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState<number>(0);
  const bannerFlatListRef = useRef<FlatList>(null);
  const seenImpressionRef = useRef<Set<string>>(new Set());
  const lastScrollY = useRef<number>(0);

  // 1. 광고 배너 데이터 로드
  useEffect(() => {
    let mounted = true;
    fetchAdsByPlacement('MARKET_BANNER')
      .then((items) => {
        if (mounted && items && items.length > 0) {
          setAds(items);
          if (items[0]?.id && !seenImpressionRef.current.has(items[0].id)) {
            seenImpressionRef.current.add(items[0].id);
            recordAdImpression(items[0].id).catch(() => {});
          }
        }
      })
      .catch((err) => console.warn('[MarketScreen] ads error:', err));
    return () => {
      mounted = false;
    };
  }, []);

  // 2. 광고 3초 자동 슬라이드 타이머
  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % ads.length;
        bannerFlatListRef.current?.scrollToOffset({
          offset: nextIndex * (BANNER_WIDTH + 10),
          animated: true,
        });
        const currentAd = ads[nextIndex];
        if (currentAd?.id && !seenImpressionRef.current.has(currentAd.id)) {
          seenImpressionRef.current.add(currentAd.id);
          recordAdImpression(currentAd.id).catch(() => {});
        }
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [ads]);

  // 3. 상품 목록 로드 (선택된 서브 탭에 따라 분기)
  const loadData = useCallback(async () => {
    try {
      if (selectedType === 'B2C_NORMAL') {
        const data = await fetchNormalProducts({
          category: selectedCategory,
          sort: selectedSort,
        });
        setNormalProducts(data);
      } else {
        const data = await fetchMarketProducts({
          type: selectedType,
          category: selectedCategory,
        });
        setProducts(data);
      }
    } catch (err) {
      console.warn('[MarketScreen] load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedType, selectedCategory, selectedSort]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // 배너 클릭 핸들러
  const handleBannerPress = (ad: AdvertisementItem) => {
    recordAdClick(ad.id).catch(() => {});
    if (ad.targetUrl) {
      Linking.openURL(ad.targetUrl).catch((err) => {
        console.warn('Cannot open ad url:', err);
      });
    }
  };

  // 각 상품 추천/좋아요(하트) 토글 핸들러
  const handleToggleLike = (productId: string, e?: any) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    const isNowLiked = !likedProductIds.has(productId);
    setLikedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });

    // 목록 내 likesCount 실시간 업데이트
    setProducts((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          return {
            ...item,
            isLiked: isNowLiked,
            likesCount: Math.max(0, (item.likesCount || 0) + (isNowLiked ? 1 : -1)),
          };
        }
        return item;
      })
    );

    // 서비스 API 백그라운드 호출
    toggleProductLike(productId).catch(() => {});
  };

  // 스크롤 감지에 따른 가변 FAB 상태 전환
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    if (currentY <= 15) {
      setIsFabExpanded(true);
    } else if (currentY > lastScrollY.current + 8) {
      setIsFabExpanded(false); // 아래로 스크롤 시 축소
    } else if (currentY < lastScrollY.current - 12) {
      setIsFabExpanded(true); // 위로 스크롤 시 확장
    }
    lastScrollY.current = currentY;
  };

  // C2C 중고 & B2C 공구 렌더 아이템
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

    const isLiked = likedProductIds.has(item.id) || !!item.isLiked;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id, isNormalProduct: false })}
      >
        {/* 상품 이미지 */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: item.images[0] }} style={styles.cardImage} resizeMode="cover" />
          <View style={styles.topLeftBadges}>
            {(item as any).isHqDirect && (
              <LinearGradient
                colors={['#F59E0B', '#FBBF24', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.hqDirectBadge}
              >
                <Text style={styles.hqDirectBadgeText}>👑 본사직영</Text>
              </LinearGradient>
            )}
            {/* 에스크로 안전결제 뱃지 */}
            <View style={styles.escrowBadge}>
              <Ionicons name="shield-checkmark" size={11} color="#FFFFFF" />
              <Text style={styles.escrowBadgeText}>모꼬 안심결제</Text>
            </View>
          </View>

          {/* 우상단 추천/찜하기 터치 버튼 */}
          <TouchableOpacity
            style={styles.favBadgeBtn}
            activeOpacity={0.8}
            onPress={(e) => handleToggleLike(item.id, e)}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={18}
              color={isLiked ? '#FF3B6B' : '#FFFFFF'}
            />
          </TouchableOpacity>

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
              {item.locationName || '전국'}
            </Text>
          )}

          {/* 가격 (원) */}
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>
              {item.price.toLocaleString()}원
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
              <TouchableOpacity
                style={styles.reactionItem}
                activeOpacity={0.7}
                onPress={(e) => handleToggleLike(item.id, e)}
              >
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={12}
                  color={isLiked ? '#FF3B6B' : tokens.colors.textTertiary}
                />
                <Text style={[styles.reactionCount, isLiked && { color: '#FF3B6B', fontWeight: '700' }]}>
                  {item.likesCount || 0}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // B2C 일반 브랜드 상품 렌더 아이템
  const renderNormalProductItem = ({ item }: { item: NormalProduct }) => {
    const isOutOfStock = item.stock <= 0 || item.status === 'OUT_OF_STOCK';
    const originalPrice = item.priceKrw;
    const finalPrice = item.salePriceKrw || item.priceKrw;
    const discountRate =
      originalPrice && originalPrice > finalPrice
        ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
        : 0;

    const merchantLabel = (item as any).isHqDirect ? '👑 모꼬 본사 직영관' : (item.merchantName || item.merchant?.businessName || '공식인증 입점사');
    const isLiked = likedProductIds.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.card, isOutOfStock && styles.cardOutOfStock]}
        activeOpacity={0.88}
        onPress={() =>
          navigation.navigate('ProductDetail', {
            productId: item.id,
            isNormalProduct: true,
            normalProduct: item,
          })
        }
      >
        {/* 상품 이미지 */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: item.images?.[0] || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600' }}
            style={[styles.cardImage, isOutOfStock && styles.dimmedImage]}
            resizeMode="cover"
          />

          {/* 우상단 추천/찜하기 터치 버튼 */}
          <TouchableOpacity
            style={styles.favBadgeBtn}
            activeOpacity={0.8}
            onPress={(e) => handleToggleLike(item.id, e)}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={18}
              color={isLiked ? '#FF3B6B' : '#FFFFFF'}
            />
          </TouchableOpacity>

          {/* 품절 안내 오버레이 */}
          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>일시 품절</Text>
            </View>
          )}

          <View style={styles.topLeftBadges}>
            {(item as any).isHqDirect && (
              <LinearGradient
                colors={['#F59E0B', '#FBBF24', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.hqDirectBadge}
              >
                <Text style={styles.hqDirectBadgeText}>👑 본사직영</Text>
              </LinearGradient>
            )}
            {/* 에스크로 안전결제 뱃지 */}
            <View style={styles.escrowBadge}>
              <Ionicons name="shield-checkmark" size={11} color="#FFFFFF" />
              <Text style={styles.escrowBadgeText}>모꼬 안심결제</Text>
            </View>
          </View>

          {/* 할인율 뱃지 */}
          {discountRate > 0 && !isOutOfStock && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountRate}% OFF</Text>
            </View>
          )}
        </View>

        {/* 상품 정보 */}
        <View style={styles.cardContent}>
          {/* 입점사 상호명 회색 뱃지 */}
          <View style={styles.merchantBadge}>
            <Ionicons name="business-outline" size={11} color="#475569" style={{ marginRight: 3 }} />
            <Text style={styles.merchantBadgeText} numberOfLines={1}>
              {merchantLabel}
            </Text>
          </View>

          {/* 상품명 */}
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.name}
          </Text>

          {/* 무료배송 / 배송비 안내 뱃지 */}
          <View style={styles.shippingBadgeRow}>
            {item.shippingFee === 0 ? (
              <View style={styles.freeShippingBadge}>
                <Ionicons name="checkmark-circle" size={11} color="#059669" />
                <Text style={styles.freeShippingText}>무료배송</Text>
              </View>
            ) : (
              <Text style={styles.paidShippingText}>배송비 {item.shippingFee?.toLocaleString()}원</Text>
            )}
            <Text style={styles.stockRemainingText}>재고 {item.stock}개</Text>
          </View>

          {/* 가격 (원) */}
          <View style={styles.priceRow}>
            {discountRate > 0 && (
              <Text style={styles.normalDiscountRateText}>{discountRate}%</Text>
            )}
            <Text style={styles.priceText}>
              {finalPrice.toLocaleString()}원
            </Text>
            {discountRate > 0 && (
              <Text style={styles.originalPriceText}>
                {originalPrice.toLocaleString()}원
              </Text>
            )}
          </View>

          {/* 하단 브랜드 인증 마크 */}
          <View style={styles.cardFooter}>
            <Text style={styles.brandVerifiedLabel}>✓ 모꼬 검증 브랜드</Text>
            <Ionicons name="chevron-forward" size={12} color="#CBD5E1" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 1. 상단 광고 배너 롤링 캐러셀 컴포넌트
  const renderAdBannerSection = () => {
    if (ads.length === 0) return null;

    return (
      <View style={styles.bannerContainer}>
        <FlatList
          ref={bannerFlatListRef}
          data={ads}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled={false}
          snapToInterval={BANNER_WIDTH + 10}
          snapToAlignment="start"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bannerScrollContent}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / (BANNER_WIDTH + 10));
            if (index >= 0 && index < ads.length) {
              setCurrentAdIndex(index);
              const cur = ads[index];
              if (cur?.id && !seenImpressionRef.current.has(cur.id)) {
                seenImpressionRef.current.add(cur.id);
                recordAdImpression(cur.id).catch(() => {});
              }
            }
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.bannerCard}
              activeOpacity={0.92}
              onPress={() => handleBannerPress(item)}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(15, 23, 42, 0.85)']}
                style={styles.bannerGradient}
              >
                <View style={styles.bannerTagRow}>
                  <View style={styles.bannerAdTag}>
                    <Text style={styles.bannerAdTagText}>AD</Text>
                  </View>
                  <Text style={styles.bannerSubTag}>모꼬 제휴 파트너스</Text>
                </View>
                <Text style={styles.bannerTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.description ? (
                  <Text style={styles.bannerDesc} numberOfLines={1}>
                    {item.description}
                  </Text>
                ) : null}
              </LinearGradient>
            </TouchableOpacity>
          )}
        />
        {/* 인디케이터 도트 */}
        {ads.length > 1 && (
          <View style={styles.indicatorContainer}>
            {ads.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.indicatorDot,
                  currentAdIndex === idx && styles.indicatorDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  // 검색어에 따른 실시간 필터링
  const trimmedQuery = searchQuery.trim().toLowerCase();

  const filteredProducts = products.filter((p) => {
    if (!trimmedQuery) return true;
    const matchTitle = (p.title || '').toLowerCase().includes(trimmedQuery);
    const matchDesc = (p.description || '').toLowerCase().includes(trimmedQuery);
    const matchLoc = (p.locationName || '').toLowerCase().includes(trimmedQuery);
    return matchTitle || matchDesc || matchLoc;
  });

  const filteredNormalProducts = normalProducts.filter((p) => {
    if (!trimmedQuery) return true;
    const matchName = (p.name || '').toLowerCase().includes(trimmedQuery);
    const matchDesc = (p.description || '').toLowerCase().includes(trimmedQuery);
    const merchantName = p.merchantName || p.merchant?.businessName || '';
    const matchMerchant = merchantName.toLowerCase().includes(trimmedQuery);
    return matchName || matchDesc || matchMerchant;
  });

  const currentListCount = selectedType === 'B2C_NORMAL' ? filteredNormalProducts.length : filteredProducts.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 1. 상단 통일 56px 헤더 (공유 아이콘 제거, 검색/알림 동작) */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../../assets/mocco-mascot.png')}
            style={styles.headerMascotLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>모꼬마켓</Text>
          <View style={styles.locationBadge}>
            <Ionicons name="globe-outline" size={12} color="#FF3B6B" />
            <Text style={styles.locationBadgeText}>전국 특가장터</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerIconBtn, isSearchVisible && styles.headerIconBtnActive]}
            activeOpacity={0.7}
            onPress={() => {
              setIsSearchVisible((prev) => !prev);
              if (isSearchVisible) {
                setSearchQuery('');
              }
            }}
          >
            <Ionicons
              name={isSearchVisible ? 'close' : 'search-outline'}
              size={22}
              color={isSearchVisible ? '#FF3B6B' : tokens.colors.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color={tokens.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 검색 입력창 (검색버튼 클릭 시 슬라이드다운) */}
      {isSearchVisible && (
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              selectedType === 'C2C_USED'
                ? '중고마켓 상품명, 설명, 지역 검색...'
                : selectedType === 'B2C_NORMAL'
                ? '브랜드 상품명, 입점사 검색...'
                : '특가 공구 상품 검색...'
            }
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ marginRight: 6 }}
            >
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 2. 상단 3대 서브 탭 캡슐 바: [중고마켓] / [브랜드 쇼핑] / [특가 공구] */}
      <View style={styles.segmentContainer}>
        {/* 1) 중고마켓 (C2C) */}
        <TouchableOpacity
          style={[styles.segmentBtn, selectedType === 'C2C_USED' && styles.segmentBtnActive]}
          onPress={() => setSelectedType('C2C_USED')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.segmentText,
              selectedType === 'C2C_USED' && styles.segmentTextActive,
            ]}
          >
            🏷️ 중고마켓
          </Text>
        </TouchableOpacity>

        {/* 2) 브랜드 쇼핑 (B2C) */}
        <TouchableOpacity
          style={[styles.segmentBtn, selectedType === 'B2C_NORMAL' && styles.segmentBtnActive]}
          onPress={() => setSelectedType('B2C_NORMAL')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.segmentText,
              selectedType === 'B2C_NORMAL' && styles.segmentTextActiveBrand,
            ]}
          >
            🛍️ 브랜드 쇼핑
          </Text>
        </TouchableOpacity>

        {/* 3) 특가 공구 (B2C) */}
        <TouchableOpacity
          style={[styles.segmentBtn, selectedType === 'B2C_GROUP' && styles.segmentBtnActive]}
          onPress={() => setSelectedType('B2C_GROUP')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.segmentText,
              selectedType === 'B2C_GROUP' && styles.segmentTextActiveGroup,
            ]}
          >
            🔥 특가 공구
          </Text>
          <View style={styles.hotBadge}>
            <Text style={styles.hotBadgeText}>HOT</Text>
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

      {/* 검색어 활성화 시 결과 안내 바 */}
      {trimmedQuery.length > 0 && (
        <View style={styles.searchResultBar}>
          <Text style={styles.searchResultText}>
            <Text style={styles.searchResultKeyword}>'{trimmedQuery}'</Text> 검색 결과 총 {currentListCount}개
          </Text>
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.searchResultResetText}>전체보기</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 4. 브랜드 쇼핑(B2C) 탭 정렬 셀렉터 */}
      {selectedType === 'B2C_NORMAL' && !trimmedQuery && (
        <View style={styles.sortBar}>
          <Text style={styles.sortTotalCount}>
            총 <Text style={styles.sortHighlight}>{filteredNormalProducts.length}</Text>개 정품 상품
          </Text>
          <View style={styles.sortChipsRow}>
            {[
              { key: 'recent', label: '최신순' },
              { key: 'popular', label: '인기순' },
              { key: 'priceAsc', label: '낮은가격순' },
              { key: 'priceDesc', label: '높은가격순' },
            ].map((s) => {
              const isSelected = selectedSort === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.sortChip, isSelected && styles.sortChipActive]}
                  onPress={() => setSelectedSort(s.key as NormalSortType)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.sortChipText, isSelected && styles.sortChipTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* 5. 2열 상품 그리드 (상단에 광고 배너 롤링 캐러셀 포함) */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
          <Text style={styles.loadingText}>안전거래 상품을 불러오는 중...</Text>
        </View>
      ) : (
        <FlatList
          data={selectedType === 'B2C_NORMAL' ? (filteredNormalProducts as any[]) : (filteredProducts as any[])}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          ListHeaderComponent={!trimmedQuery ? renderAdBannerSection : null}
          renderItem={
            selectedType === 'B2C_NORMAL'
              ? (renderNormalProductItem as any)
              : (renderProductItem as any)
          }
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
              <Text style={styles.emptyTitle}>
                {trimmedQuery
                  ? `'${trimmedQuery}'에 대한 검색 결과가 없습니다`
                  : selectedType === 'B2C_NORMAL'
                  ? '입점 브랜드 상품이 준비 중입니다'
                  : '등록된 상품이 없습니다'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {trimmedQuery
                  ? '다른 검색어를 입력하시거나 카테고리를 변경해보세요.'
                  : selectedType === 'B2C_NORMAL'
                  ? '인증 입점사의 프리미엄 신상품이 곧 업데이트됩니다.'
                  : '가장 먼저 물품을 등록하고 이웃과 거래를 시작해보세요!'}
              </Text>
            </View>
          }
        />
      )}

      {/* 6. 우측 하단 가변 FAB: + 물품등록 (오직 중고마켓에서만 노출, 특가공구/브랜드쇼핑은 미노출) */}
      {selectedType === 'C2C_USED' && (
        <ScrollExpandableFAB
          label="물품등록"
          iconName="add"
          isExpanded={isFabExpanded}
          onPress={() => navigation.navigate('MarketCreate')}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
  headerMascotLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 2,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFF0F3',
    borderRadius: 12,
  },
  locationBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF3B6B',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    padding: 6,
  },

  // 광고 배너 캐러셀 (그리드 라인과 1px 오차 없는 완벽 정렬)
  bannerContainer: {
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 12,
  },
  bannerScrollContent: {
    gap: 10,
  },
  bannerCard: {
    width: BANNER_WIDTH,
    height: 124,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    justifyContent: 'flex-end',
    padding: 12,
  },
  bannerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bannerAdTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  bannerAdTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  bannerSubTag: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  bannerDesc: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '500',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  indicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E2E8F0',
  },
  indicatorDotActive: {
    width: 14,
    backgroundColor: tokens.colors.primary,
  },

  // 3대 서브 탭 캡슐 세그먼트
  segmentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: tokens.colors.primary,
    shadowColor: tokens.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTextActive: {
    color: tokens.colors.primary,
    fontWeight: '800',
  },
  segmentTextActiveBrand: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  segmentTextActiveGroup: {
    color: '#FF5722',
    fontWeight: '800',
  },
  brandNewBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  brandNewBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4F46E5',
  },
  hotBadge: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  hotBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 카테고리 가로 필터
  categoryContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  categoryCapsule: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryCapsuleActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  categoryCapsuleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryCapsuleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // B2C 정렬 바
  sortBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  sortTotalCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  sortHighlight: {
    color: '#0F172A',
    fontWeight: '800',
  },
  sortChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sortChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  sortChipActive: {
    backgroundColor: '#EEF2FF',
  },
  sortChipText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  sortChipTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },

  // 2열 그리드 (배너와 100% 동일한 여백 일치)
  gridContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardOutOfStock: {
    opacity: 0.8,
  },
  imageWrapper: {
    width: '100%',
    height: CARD_WIDTH * 0.95,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  dimmedImage: {
    opacity: 0.4,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  topLeftBadges: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    zIndex: 2,
  },
  hqDirectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  hqDirectBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: -0.3,
  },
  escrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  escrowBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF3B6B',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cardContent: {
    padding: 10,
  },
  merchantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 5,
  },
  merchantBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 18,
    marginBottom: 6,
    minHeight: 36,
  },
  shippingBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  freeShippingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeShippingText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  paidShippingText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  stockRemainingText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  groupInfoBox: {
    marginBottom: 6,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF5722',
  },
  groupMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupPercentText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF5722',
  },
  groupRemainingText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  locationText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  normalDiscountRateText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FF3B6B',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  currencyUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF3B6B',
  },
  originalPriceText: {
    fontSize: 10,
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
  brandVerifiedLabel: {
    fontSize: 10,
    color: '#4F46E5',
    fontWeight: '700',
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
    paddingVertical: 60,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 15,
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
  headerIconBtnActive: {
    backgroundColor: '#FFF0F3',
    borderRadius: 8,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 12,
    height: 42,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  searchResultBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchResultText: {
    fontSize: 12,
    color: '#64748B',
  },
  searchResultKeyword: {
    fontWeight: '800',
    color: '#0F172A',
  },
  searchResultResetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF3B6B',
  },
  favBadgeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
