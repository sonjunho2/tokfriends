// apps/mobile/src/screens/main/HomeScreen.js
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  RefreshControl,
  StatusBar,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { tokens } from '../../theme/tokens';
import { UserAvatar } from '../../components/common';
import { apiClient } from '../../api/client';
import { fetchMarketProducts, INITIAL_MARKET_PRODUCTS } from '../../services/marketService';
import { fetchSudaPosts, INITIAL_SUDA_POSTS } from '../../services/sudaService';
import {
  fetchAdsByPlacement,
  recordAdImpression,
  recordAdClick,
} from '../../services/adsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LIVE_CARD_WIDTH = 148;
const LIVE_CARD_HEIGHT = 196; // 3:4 세로 비율 근사

// 시간 포맷 헬퍼
function formatTimeAgo(dateString) {
  if (!dateString) return '방금 전';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '방금 전';
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return '방금 전';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// 1. 실시간 LIVE 기본 추천 데이터
const DEFAULT_LIVES = [
  {
    id: 'live-def-1',
    title: '🎵 힐링 어쿠스틱 & 퇴근길 소통',
    viewerCount: 1240,
    hostName: '민우',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    coverUri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
    tag: '음악·소통',
  },
  {
    id: 'live-def-2',
    title: '☕ 역삼동 카페에서 소소한 수다방',
    viewerCount: 890,
    hostName: '지수',
    hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    coverUri: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600',
    tag: '동네·일상',
  },
  {
    id: 'live-def-3',
    title: '🎨 드로잉 일러스트 & 고민 상담',
    viewerCount: 650,
    hostName: '서연',
    hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    coverUri: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600',
    tag: '취미·예술',
  },
  {
    id: 'live-def-4',
    title: '🏃 저녁 한강 러닝 메이트 구해요',
    viewerCount: 420,
    hostName: '도현',
    hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    coverUri: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600',
    tag: '운동·러닝',
  },
];

export default function HomeScreen({ navigation }) {
  // 상태 관리
  const [liveRooms, setLiveRooms] = useState(DEFAULT_LIVES);
  const [hotDeals, setHotDeals] = useState(INITIAL_MARKET_PRODUCTS.filter((p) => p.type === 'B2C_GROUP'));
  const [sudaList, setSudaList] = useState(INITIAL_SUDA_POSTS.slice(0, 3));
  const [refreshing, setRefreshing] = useState(false);

  // 홈 상단 히어로 광고 배너 상태
  const [homeAds, setHomeAds] = useState([]);
  const [currentHomeAdIdx, setCurrentHomeAdIdx] = useState(0);
  const homeAdListRef = useRef(null);
  const seenHomeAdRef = useRef(new Set());

  // 데이터 로드
  const loadHomeData = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    try {
      const [liveRes, adsRes] = await Promise.allSettled([
        apiClient.getLiveRooms(),
        fetchAdsByPlacement('HOME_BANNER'),
      ]);

      if (adsRes.status === 'fulfilled' && Array.isArray(adsRes.value) && adsRes.value.length > 0) {
        setHomeAds(adsRes.value);
        if (adsRes.value[0]?.id && !seenHomeAdRef.current.has(adsRes.value[0].id)) {
          seenHomeAdRef.current.add(adsRes.value[0].id);
          recordAdImpression(adsRes.value[0].id);
        }
      }

      // 1. 실시간 라이브 목록
      if (liveRes.status === 'fulfilled') {
        const rooms = Array.isArray(liveRes.value)
          ? liveRes.value
          : Array.isArray(liveRes.value?.items)
          ? liveRes.value.items
          : [];
        if (rooms.length > 0) {
          setLiveRooms(
            rooms.map((r) => ({
              id: r.id,
              title: r.title || '라이브 소통 방송',
              viewerCount: r.viewerCount || 10,
              hostName: r.host?.displayName || r.host?.nickname || r.host?.name || r.hostName || '호스트',
              hostAvatar: r.host?.avatarUrl || r.host?.avatar || r.hostAvatar,
              coverUri: r.coverImage || r.coverUri || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
              tag: r.category || '라이브',
            }))
          );
        }
      }

      // 5. 마켓 특가 공구 & 수다 TOP 3 로드
      try {
        const [marketData, sudaData] = await Promise.allSettled([
          fetchMarketProducts({ type: 'B2C_GROUP' }),
          fetchSudaPosts(),
        ]);
        if (marketData.status === 'fulfilled' && Array.isArray(marketData.value) && marketData.value.length > 0) {
          setHotDeals(marketData.value.slice(0, 5));
        }
        if (sudaData.status === 'fulfilled' && Array.isArray(sudaData.value) && sudaData.value.length > 0) {
          setSudaList(sudaData.value.slice(0, 3));
        }
      } catch {}
    } catch {
      // 에러 시 풍부한 기본 데이터 유지
    } finally {
      if (refresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData])
  );

  // 배너 3.5초 자동 롤링 타이머
  useEffect(() => {
    if (homeAds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentHomeAdIdx((prev) => {
        const next = (prev + 1) % homeAds.length;
        homeAdListRef.current?.scrollToOffset({
          offset: next * (SCREEN_WIDTH - 32),
          animated: true,
        });
        const cur = homeAds[next];
        if (cur?.id && !seenHomeAdRef.current.has(cur.id)) {
          seenHomeAdRef.current.add(cur.id);
          recordAdImpression(cur.id);
        }
        return next;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [homeAds]);

  // 라이브 룸 진입
  const handleOpenLiveRoom = (room) => {
    navigation.navigate('LiveRoom', {
      roomId: room.id,
      roomTitle: room.title,
      hostName: room.hostName,
      hostAvatar: room.hostAvatar,
    });
  };

  // =================================================================
  // 1. 상단 MOCCO 브랜드 로고 & 알림 버튼 렌더링 (슬림 클린 헤더)
  // =================================================================
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 좌측: 솜구름 마스코트 + MOCCO 브랜드 로고 */}
      <View style={styles.logoRow}>
        <Image
          source={require('../../../assets/mocco-mascot.png')}
          style={styles.headerMascotLogo}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>MOCCO</Text>
        <View style={styles.logoSparkleDot} />
      </View>

      {/* 우측: 알림 버튼 */}
      <TouchableOpacity
        style={styles.headerIconBtn}
        onPress={() => navigation.navigate('Notifications')}
        hitSlop={8}
        activeOpacity={0.8}
      >
        <Ionicons name="notifications-outline" size={24} color="#0F172A" />
        <View style={styles.unreadDot} />
      </TouchableOpacity>
    </View>
  );

  // =================================================================
  // 0. 홈 상단 히어로 광고 배너 (HOME_BANNER)
  // =================================================================
  const renderHeroAdBannerSection = () => {
    if (homeAds.length === 0) return null;
    return (
      <View style={styles.homeHeroWrap}>
        <FlatList
          ref={homeAdListRef}
          data={homeAds}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
            if (idx >= 0 && idx < homeAds.length) {
              setCurrentHomeAdIdx(idx);
              const cur = homeAds[idx];
              if (cur?.id && !seenHomeAdRef.current.has(cur.id)) {
                seenHomeAdRef.current.add(cur.id);
                recordAdImpression(cur.id);
              }
            }
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.homeHeroCard}
              activeOpacity={0.92}
              onPress={() => {
                recordAdClick(item.id);
                if (item.targetUrl) {
                  Linking.openURL(item.targetUrl).catch(() => {});
                }
              }}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.homeHeroImg} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(15, 23, 42, 0.88)']}
                style={styles.homeHeroGradient}
              >
                <View style={styles.homeHeroBadgeRow}>
                  <View style={styles.homeHeroAdBadge}>
                    <Text style={styles.homeHeroAdBadgeText}>SPONSORED</Text>
                  </View>
                  <Text style={styles.homeHeroCategory}>✨ 모꼬 특별 혜택</Text>
                </View>
                <Text style={styles.homeHeroTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.description ? (
                  <Text style={styles.homeHeroDesc} numberOfLines={1}>
                    {item.description}
                  </Text>
                ) : null}
              </LinearGradient>
            </TouchableOpacity>
          )}
        />
        {homeAds.length > 1 && (
          <View style={styles.homeHeroDots}>
            {homeAds.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.homeHeroDot,
                  currentHomeAdIdx === i && styles.homeHeroDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  // =================================================================
  // 0.5. [🔥 지금 가장 핫한 모꼬 LIVE 1위] 미니 라이브 플레이어 카드
  // =================================================================
  const renderHotLiveTop1Player = () => {
    const topLive = liveRooms?.[0] || DEFAULT_LIVES[0];
    if (!topLive) return null;

    return (
      <View style={styles.topLiveWrap}>
        <View style={styles.topLiveHeaderRow}>
          <View style={styles.topLiveTitleGroup}>
            <Text style={styles.topLiveFlame}>🔥</Text>
            <Text style={styles.topLiveSectionTitle}>지금 가장 핫한 모꼬 LIVE 1위</Text>
            <View style={styles.topLiveCrownBadge}>
              <Text style={styles.topLiveCrownText}>👑 실시간 1위</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.topLiveMoreBtn}
            onPress={() => navigation.navigate('Live')}
            hitSlop={8}
          >
            <Text style={styles.topLiveMoreText}>랭킹 전체보기</Text>
            <Ionicons name="chevron-forward" size={13} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.topLivePlayerCard}
          activeOpacity={0.92}
          onPress={() => handleOpenLiveRoom(topLive)}
        >
          <Image
            source={{ uri: topLive.coverUri || topLive.hostAvatar }}
            style={styles.topLivePlayerImg}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(15, 23, 42, 0.92)']}
            style={styles.topLivePlayerGradient}
          >
            <View style={styles.topLivePlayerBadgeRow}>
              <View style={styles.topLiveLiveTag}>
                <View style={styles.topLiveDotPulse} />
                <Text style={styles.topLiveLiveText}>LIVE</Text>
              </View>
              <View style={styles.topLiveViewerBadge}>
                <Ionicons name="eye" size={11} color="#FFFFFF" />
                <Text style={styles.topLiveViewerCount}>
                  {(topLive.viewerCount || 1240).toLocaleString()}명 시청 중
                </Text>
              </View>
            </View>

            <View style={styles.topLiveInfoRow}>
              <View style={styles.topLiveHostInfo}>
                <Image
                  source={{ uri: topLive.hostAvatar }}
                  style={styles.topLiveHostAvatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.topLiveRoomTitle} numberOfLines={1}>
                    {topLive.title}
                  </Text>
                  <Text style={styles.topLiveHostName}>
                    {topLive.hostName || '모꼬 호스트'} · {topLive.tag || '실시간 라이브'}
                  </Text>
                </View>
              </View>
              <View style={styles.topLiveEnterBtn}>
                <Text style={styles.topLiveEnterText}>입장하기</Text>
                <Ionicons name="play" size={10} color="#FFFFFF" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  // =================================================================
  // 1. 실시간 LIVE 프리뷰 섹션 (3:4 비율 오버레이 카드)
  // =================================================================
  const renderLiveSection = () => (
    <View style={styles.sectionWrap}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>실시간 LIVE</Text>
          <View style={styles.livePulseBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.livePulseText}>NOW</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.sectionMoreBtn}
          onPress={() => navigation.navigate('Live')}
          hitSlop={8}
        >
          <Text style={styles.sectionMoreText}>전체보기</Text>
          <Ionicons name="chevron-forward" size={14} color={tokens.colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={liveRooms}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.liveListContent}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.liveCard}
            activeOpacity={0.9}
            onPress={() => handleOpenLiveRoom(item)}
          >
            <Image source={{ uri: item.coverUri }} style={styles.liveCardCover} />

            {/* 상단 뱃지: 🔴 LIVE 네온 뱃지 & 시청자 수 */}
            <View style={styles.liveCardTopOverlay}>
              <View style={styles.liveTagChip}>
                <View style={styles.liveDot} />
                <Text style={styles.liveTagText}>LIVE</Text>
              </View>
              <View style={styles.viewerChip}>
                <Ionicons name="eye" size={11} color="#FFFFFF" style={{ marginRight: 3 }} />
                <Text style={styles.viewerText}>
                  {item.viewerCount >= 1000 ? `${(item.viewerCount / 1000).toFixed(1)}k` : item.viewerCount}
                </Text>
              </View>
            </View>

            {/* 하단 딤드 그라데이션 오버레이 */}
            <LinearGradient
              colors={tokens.colors.gradients.darkOverlay}
              style={styles.liveCardBottomOverlay}
            >
              <View style={styles.liveHostRow}>
                <UserAvatar
                  uri={item.hostAvatar}
                  name={item.hostName}
                  size={24}
                  showBorder={true}
                  borderColor="#FFFFFF"
                  style={styles.liveHostAvatar}
                />
                <Text style={styles.liveHostName} numberOfLines={1}>
                  {item.hostName}
                </Text>
              </View>
              <Text style={styles.liveRoomTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.liveCategoryTag}>
                <Text style={styles.liveCategoryText}>#{item.tag}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  // =================================================================
  // 3. 오늘의 핫딜 B2C 공동구매 특가 섹션 (에스크로 안전결제)
  // =================================================================
  const renderHotDealsSection = () => (
    <View style={styles.sectionWrap}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>오늘의 마켓 특가 공구</Text>
          <View style={styles.dealTimeBadge}>
            <Ionicons name="flash" size={11} color="#EF4444" />
            <Text style={styles.dealTimeBadgeText}>마감임박</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.sectionMoreBtn}
          onPress={() => navigation.navigate('Market', { screen: 'MarketMain' })}
          hitSlop={8}
        >
          <Text style={styles.sectionMoreText}>마켓 전체보기</Text>
          <Ionicons name="chevron-forward" size={14} color={tokens.colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={hotDeals}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hotDealListContent}
        renderItem={({ item }) => {
          const discountRate = item.originalPrice
            ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
            : 30;
          const progressPercent = item.targetQuantity
            ? Math.min(100, Math.round(((item.currentQuantity || 0) / item.targetQuantity) * 100))
            : 85;

          return (
            <TouchableOpacity
              style={styles.hotDealCard}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate('Market', {
                  screen: 'ProductDetail',
                  params: { productId: item.id, product: item },
                })
              }
            >
              <Image source={{ uri: item.images[0] }} style={styles.hotDealThumb} resizeMode="cover" />
              <View style={styles.dealTimerChip}>
                <Ionicons name="time-outline" size={12} color="#FFFFFF" />
                <Text style={styles.dealTimerText}>05:42:19 남음</Text>
              </View>

              <View style={styles.hotDealInfo}>
                <Text style={styles.hotDealTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.hotDealPriceRow}>
                  <Text style={styles.hotDealDiscount}>{discountRate}%</Text>
                  <Text style={styles.hotDealPrice}>{item.price.toLocaleString()}원</Text>
                </View>

                {/* 달성률 프로그레스바 */}
                <View style={styles.dealProgressWrap}>
                  <View style={styles.dealProgressBarBg}>
                    <View style={[styles.dealProgressBarFill, { width: `${progressPercent}%` }]} />
                  </View>
                  <View style={styles.dealProgressTextRow}>
                    <Text style={styles.dealProgressQty}>
                      {item.currentQuantity || 0}/{item.targetQuantity || 30}명
                    </Text>
                    <Text style={styles.dealProgressPercent}>{progressPercent}% 달성</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  // =================================================================
  // 4. 실시간 동네 수다 TOP 3 섹션 (1줄 토크 타임라인)
  // =================================================================
  const renderSudaSection = () => (
    <View style={styles.sectionWrap}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>동네 실시간 수다</Text>
          <View style={styles.sudaLiveBadge}>
            <View style={styles.sudaLiveDot} />
            <Text style={styles.sudaLiveText}>LIVE</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.sectionMoreBtn}
          onPress={() => navigation.navigate('Chat', { screen: 'ChatsMain' })}
          hitSlop={8}
        >
          <Text style={styles.sectionMoreText}>수다방 가기</Text>
          <Ionicons name="chevron-forward" size={14} color={tokens.colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.homeSudaList}>
        {sudaList.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={styles.homeSudaCard}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Chat', { screen: 'ChatsMain' })}
          >
            <View style={styles.homeSudaLeft}>
              <Image source={{ uri: post.author.avatarUrl }} style={styles.homeSudaAvatar} />
              <View style={styles.homeSudaMeta}>
                <View style={styles.homeSudaNameRow}>
                  <Text style={styles.homeSudaAuthor}>{post.author.nickname}</Text>
                  <View style={styles.homeSudaBadge}>
                    <Text style={styles.homeSudaBadgeText}>{post.neighborhood}</Text>
                  </View>
                  <Text style={styles.homeSudaDistance}>{post.distanceKm}km</Text>
                </View>
                <Text style={styles.homeSudaContent} numberOfLines={1}>
                  {post.content}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.homeSudaDirectBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Chat', { screen: 'ChatsMain' })}
            >
              <Ionicons name="chatbubble-ellipses" size={13} color="#FF3B6B" />
              <Text style={styles.homeSudaDirectText}>답장</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 상단 통합 헤더 */}
      {renderHeader()}

      {/* 메인 피드 스크롤 */}
      <FlatList
        data={[1]}
        keyExtractor={() => 'home-main-sections'}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={1}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadHomeData({ refresh: true })}
            colors={[tokens.colors.primary]}
            tintColor={tokens.colors.primary}
          />
        }
        renderItem={() => (
          <View>
            {/* 0. 홈 상단 스폰서/프로모션 히어로 배너 */}
            {renderHeroAdBannerSection()}

            {/* 0.5. 지금 가장 핫한 모꼬 LIVE 1위 미니 플레이어 */}
            {renderHotLiveTop1Player()}

            {/* 1. 실시간 LIVE 프리뷰 섹션 */}
            {renderLiveSection()}

            {/* 2. 오늘의 마켓 특가 공구 (B2C & 에스크로 안전거래) */}
            {renderHotDealsSection()}

            {/* 3. 실시간 동네 수다 TOP 3 (1줄 토크 타임라인) */}
            {renderSudaSection()}

            {/* 하단 여백 (하단 탭 바 높이 고려) */}
            <View style={{ height: 90 }} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  scrollContainer: {
    paddingBottom: 20,
  },

  // 0. 홈 히어로 광고 배너 스타일
  homeHeroWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  homeHeroCard: {
    width: SCREEN_WIDTH - 32,
    height: 128,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  homeHeroImg: {
    width: '100%',
    height: '100%',
  },
  homeHeroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    justifyContent: 'flex-end',
    padding: 14,
  },
  homeHeroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  homeHeroAdBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  homeHeroAdBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  homeHeroCategory: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  homeHeroTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  homeHeroDesc: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '500',
  },
  homeHeroDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  homeHeroDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E2E8F0',
  },
  homeHeroDotActive: {
    width: 14,
    backgroundColor: tokens.colors.primary,
  },

  // 1. MOCCO 슬림 클린 헤더 스타일
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: tokens.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  // 1.5 빠른 친구 탐색 칩 바 스타일
  quickFilterSectionWrap: {
    backgroundColor: tokens.colors.surface,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
  },
  quickFilterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  quickFilterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickFilterTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: tokens.colors.text,
    letterSpacing: -0.3,
  },
  quickFilterLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.primary,
  },
  quickFilterMoreText: {
    fontSize: 12,
    color: tokens.colors.primary,
    fontWeight: '600',
  },
  quickFilterScrollContent: {
    paddingHorizontal: 18,
    gap: 8,
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    ...tokens.shadows.soft,
  },
  quickFilterIcon: {
    fontSize: 13,
  },
  quickFilterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  headerLeftCol: {
    gap: 6,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerMascotLogo: {
    width: 34,
    height: 34,
    marginRight: 6,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6,
    color: '#0F172A',
  },
  logoSparkleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B6B',
    marginBottom: 10,
  },

  // 0.5 지금 가장 핫한 모꼬 LIVE 1위 스타일
  topLiveWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  topLiveHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topLiveTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topLiveFlame: {
    fontSize: 14,
  },
  topLiveSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  topLiveCrownBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  topLiveCrownText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#B45309',
  },
  topLiveMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  topLiveMoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  topLivePlayerCard: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  topLivePlayerImg: {
    width: '100%',
    height: '100%',
  },
  topLivePlayerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    justifyContent: 'space-between',
    padding: 10,
  },
  topLivePlayerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topLiveLiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  topLiveDotPulse: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  topLiveLiveText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  topLiveViewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  topLiveViewerCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  topLiveInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLiveHostInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 10,
  },
  topLiveHostAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  topLiveRoomTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 3,
  },
  topLiveHostName: {
    fontSize: 11,
    color: '#E2E8F0',
    fontWeight: '600',
    marginTop: 1,
  },
  topLiveEnterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  topLiveEnterText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storyRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  storyRingInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: tokens.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTextWrap: {
    justifyContent: 'center',
  },
  welcomeName: {
    ...tokens.typography.h3,
    fontSize: 14,
    lineHeight: 18,
  },
  welcomeSub: {
    ...tokens.typography.caption,
    fontSize: 11,
    color: tokens.colors.textSecondary,
  },
  headerRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goldCoinBadge: {
    borderRadius: tokens.radius.full,
    overflow: 'hidden',
    ...tokens.shadows.soft,
  },
  goldCoinGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    gap: 4,
    borderRadius: tokens.radius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  coinIcon: {
    fontSize: 13,
  },
  coinAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  coinUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unreadDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF3B6B',
  },

  // 섹션 공통 스타일
  sectionWrap: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    ...tokens.typography.h2,
    fontSize: 18,
  },
  sectionEmoji: {
    fontSize: 16,
  },
  sectionSub: {
    ...tokens.typography.caption,
    color: tokens.colors.textTertiary,
  },
  sectionMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sectionMoreText: {
    ...tokens.typography.caption,
    color: tokens.colors.textSecondary,
    fontWeight: '600',
  },

  // 2. LIVE 섹션 스타일
  liveListContent: {
    paddingHorizontal: 18,
    gap: 12,
  },
  livePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: tokens.radius.full,
    gap: 4,
  },
  livePulseText: {
    fontSize: 9,
    fontWeight: '800',
    color: tokens.colors.primary,
  },
  liveCard: {
    width: LIVE_CARD_WIDTH,
    height: LIVE_CARD_HEIGHT,
    borderRadius: tokens.radius.card,
    overflow: 'hidden',
    backgroundColor: tokens.colors.surfaceSecondary,
    ...tokens.shadows.card,
  },
  liveCardCover: {
    width: '100%',
    height: '100%',
  },
  liveCardTopOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: tokens.radius.xs,
    gap: 3,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  liveTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  viewerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: tokens.radius.full,
  },
  viewerText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },
  liveCardBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 24,
  },
  liveHostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  liveHostAvatar: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  liveHostName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  liveRoomTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  liveCategoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  liveCategoryText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 9,
    fontWeight: '600',
  },

  // 핫딜 공동구매 스타일
  dealTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  dealTimeBadgeText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
  hotDealListContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  hotDealCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  hotDealThumb: {
    width: '100%',
    height: 120,
    backgroundColor: '#F8FAFC',
  },
  dealTimerChip: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dealTimerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  hotDealInfo: {
    padding: 10,
  },
  hotDealTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  hotDealPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  hotDealDiscount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#EF4444',
  },
  hotDealPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4F46E5',
  },
  dealProgressWrap: {
    marginTop: 2,
  },
  dealProgressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  dealProgressBarFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 3,
  },
  dealProgressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  dealProgressQty: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  dealProgressPercent: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '800',
  },

  // 실시간 동네 수다 TOP 3 스타일
  sudaLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  sudaLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  sudaLiveText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  homeSudaList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  homeSudaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  homeSudaLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  homeSudaAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  homeSudaMeta: {
    flex: 1,
    marginLeft: 10,
  },
  homeSudaNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  homeSudaAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  homeSudaBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  homeSudaBadgeText: {
    fontSize: 10,
    color: '#4F46E5',
    fontWeight: '700',
  },
  homeSudaDistance: {
    fontSize: 11,
    color: '#94A3B8',
  },
  homeSudaContent: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  homeSudaDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  homeSudaDirectText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF3B6B',
  },
});
