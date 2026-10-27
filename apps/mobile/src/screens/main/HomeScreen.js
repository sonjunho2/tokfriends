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
  RefreshControl,
  StatusBar,
  Platform,
  Linking,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
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

// 3열 고정 Top3 카드 너비
const TOP3_CARD_WIDTH = Math.floor((SCREEN_WIDTH - 24 - 16) / 3);

// 2열 듀얼 박스 너비
const DUAL_BOX_WIDTH = Math.floor((SCREEN_WIDTH - 32 - 12) / 2);

// 실시간 LIVE 기본 추천 데이터
const DEFAULT_LIVES = [
  {
    id: 'live-def-1',
    title: '🎵 힐링 어쿠스틱 & 퇴근길 소통',
    viewerCount: 1420,
    hostName: '민우',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    coverUri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
    tag: '음악·소통',
  },
  {
    id: 'live-def-2',
    title: '☕ 역삼동 카페에서 소소한 수다방',
    viewerCount: 980,
    hostName: '지수',
    hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    coverUri: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600',
    tag: '동네·일상',
  },
  {
    id: 'live-def-3',
    title: '🎨 드로잉 일러스트 & 고민 상담',
    viewerCount: 750,
    hostName: '서연',
    hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    coverUri: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600',
    tag: '취미·예술',
  },
  {
    id: 'live-def-4',
    title: '🏃 저녁 한강 러닝 메이트 구해요',
    viewerCount: 620,
    hostName: '도현',
    hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    coverUri: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600',
    tag: '운동·러닝',
  },
  {
    id: 'live-def-5',
    title: '🍖 한남동 심야 야식 먹방 라이브',
    viewerCount: 510,
    hostName: '준호',
    hostAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300',
    coverUri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600',
    tag: '먹방·야식',
  },
  {
    id: 'live-def-6',
    title: '🎸 감성 인디 밴드 어쿠스틱 세션',
    viewerCount: 430,
    hostName: '유나',
    hostAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
    coverUri: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
    tag: '음악·인디',
  },
];

// 중고마켓 기본 데이터
const DEFAULT_USED_PRODUCTS = [
  {
    id: 'used-prod-01',
    title: '아이폰 15 프로 256GB 내추럴 티타늄 풀박스',
    price: 1150000,
    region: '역삼동',
    condition: '특S급',
    likes: 18,
    chats: 7,
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400'],
  },
  {
    id: 'used-prod-02',
    title: '소니 WH-1000XM5 노이즈캔슬링 헤드폰 실버',
    price: 320000,
    region: '서초동',
    condition: '거의새것',
    likes: 24,
    chats: 12,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
  },
  {
    id: 'used-prod-03',
    title: '애플워치 울트라 2 알파인루프 올리브 풀박스',
    price: 740000,
    region: '한남동',
    condition: '미개봉급',
    likes: 15,
    chats: 5,
    images: ['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400'],
  },
  {
    id: 'used-prod-04',
    title: 'M2 맥북 에어 15인치 16GB 512GB 스페이스그레이',
    price: 1480000,
    region: '삼성동',
    condition: '특S급',
    likes: 31,
    chats: 14,
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'],
  },
  {
    id: 'used-prod-05',
    title: '닌텐도 스위치 OLED 화이트 + 젤다 티어스 세트',
    price: 290000,
    region: '청담동',
    condition: '거의새것',
    likes: 29,
    chats: 9,
    images: ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400'],
  },
  {
    id: 'used-prod-06',
    title: '헬리녹스 체어원 블랙 에디션 캠핑의자 2개 세트',
    price: 190000,
    region: '신사동',
    condition: '상태양호',
    likes: 13,
    chats: 6,
    images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400'],
  },
];

export default function HomeScreen({ navigation }) {
  // 상태 관리
  const [liveRooms, setLiveRooms] = useState(DEFAULT_LIVES);
  const [hotDeals, setHotDeals] = useState(
    INITIAL_MARKET_PRODUCTS.filter((p) => p.type === 'B2C_GROUP')
  );
  const [sudaListAll, setSudaListAll] = useState(INITIAL_SUDA_POSTS);
  const [usedProducts, setUsedProducts] = useState(DEFAULT_USED_PRODUCTS);
  const [refreshing, setRefreshing] = useState(false);

  // 자동 슬라이드/롤링 인덱스 상태
  const [livePairIndex, setLivePairIndex] = useState(0);
  const [dealPairIndex, setDealPairIndex] = useState(0);
  const [sudaRollingIndex, setSudaRollingIndex] = useState(0);
  const [usedPairIndex, setUsedPairIndex] = useState(0);

  // 상단 히어로 광고 배너 상태
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

      // 실시간 라이브 목록
      if (liveRes.status === 'fulfilled') {
        const rooms = Array.isArray(liveRes.value)
          ? liveRes.value
          : Array.isArray(liveRes.value?.items)
          ? liveRes.value.items
          : [];
        if (rooms.length > 0) {
          const mapped = rooms.map((r, idx) => ({
            id: r.id,
            title: r.title || '라이브 소통 방송',
            viewerCount: r.viewerCount || (1200 - idx * 150),
            hostName: r.host?.displayName || r.host?.nickname || r.host?.name || r.hostName || '호스트',
            hostAvatar: r.host?.avatarUrl || r.host?.avatar || r.hostAvatar,
            coverUri: r.coverImage || r.coverUri || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
            tag: r.category || '라이브',
          }));
          setLiveRooms(mapped.length >= 3 ? mapped : [...mapped, ...DEFAULT_LIVES]);
        }
      }

      // 마켓 특가 공구 & 중고마켓 & 실시간 수다
      try {
        const [marketDeals, marketUsed, sudaData] = await Promise.allSettled([
          fetchMarketProducts({ type: 'B2C_GROUP' }),
          fetchMarketProducts({ type: 'C2C' }),
          fetchSudaPosts(),
        ]);
        if (marketDeals.status === 'fulfilled' && Array.isArray(marketDeals.value) && marketDeals.value.length > 0) {
          setHotDeals(marketDeals.value);
        }
        if (marketUsed.status === 'fulfilled' && Array.isArray(marketUsed.value) && marketUsed.value.length > 0) {
          setUsedProducts(marketUsed.value);
        }
        if (sudaData.status === 'fulfilled' && Array.isArray(sudaData.value) && sudaData.value.length > 0) {
          setSudaListAll(sudaData.value);
        }
      } catch {}
    } catch {
      // 풍부한 기본 데이터 유지
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

  // 1) 배너 3.5초 자동 롤링 타이머
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

  // 2) 실시간 LIVE 2개 박스 3.5초 슬라이드 순환 타이머
  useEffect(() => {
    if (liveRooms.length <= 2) return;
    const timer = setInterval(() => {
      setLivePairIndex((prev) => (prev + 2) % liveRooms.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [liveRooms.length]);

  // 3) 오늘의 마켓특가공구 2개 박스 4초 슬라이드 순환 타이머
  useEffect(() => {
    if (hotDeals.length <= 2) return;
    const timer = setInterval(() => {
      setDealPairIndex((prev) => (prev + 2) % hotDeals.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [hotDeals.length]);

  // 4) 실시간수다 3개 목록 4초 롤링 순환 타이머
  useEffect(() => {
    if (sudaListAll.length <= 3) return;
    const timer = setInterval(() => {
      setSudaRollingIndex((prev) => (prev + 1) % sudaListAll.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [sudaListAll.length]);

  // 5) 중고마켓 2개 박스 3.8초 슬라이드 순환 타이머
  useEffect(() => {
    if (usedProducts.length <= 2) return;
    const timer = setInterval(() => {
      setUsedPairIndex((prev) => (prev + 2) % usedProducts.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [usedProducts.length]);

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
  // 1. 상단 MOCCO 브랜드 헤더 (구름 삭제, 가운데 정렬 & 확대)
  // =================================================================
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 완전 가운데 정렬된 볼드 MOCCO 타이틀 */}
      <View style={styles.headerCenterLogoWrap} pointerEvents="box-none">
        <Text style={styles.headerCenterLogoText}>MOCCO</Text>
      </View>

      {/* 우측: 알림 버튼 */}
      <TouchableOpacity
        style={styles.headerNotificationBtn}
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
  // 2. 홈 상단 히어로 광고 배너 (HOME_BANNER)
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
  // 3. [🔥 실시간 LIVE Top3] (모꼬라이브와 동일한 3열 고정 & 화려한 원형 엠블럼)
  // =================================================================
  const renderLiveTop3Section = () => {
    const top3 = liveRooms.slice(0, 3);
    if (top3.length === 0) return null;

    // 모꼬라이브와 일치하는 화려한 원형 엠블럼 렌더러
    const renderRankEmblem = (rank) => {
      const isRank1 = rank === 1;
      const isRank2 = rank === 2;

      const emblemColors = isRank1
        ? {
            ringBorder: '#F59E0B',
            ringInner: '#FBBF24',
            crown: '#FBBF24',
            noText: '#FDE68A',
            numText: '#FBBF24',
            star: '#F59E0B',
            bg: '#181204',
            shadow: '#F59E0B',
          }
        : isRank2
        ? {
            ringBorder: '#CBD5E1',
            ringInner: '#94A3B8',
            crown: '#E2E8F0',
            noText: '#E2E8F0',
            numText: '#FFFFFF',
            star: '#94A3B8',
            bg: '#0F172A',
            shadow: '#94A3B8',
          }
        : {
            ringBorder: '#D97706',
            ringInner: '#B45309',
            crown: '#FDBA74',
            noText: '#FED7AA',
            numText: '#FDBA74',
            star: '#D97706',
            bg: '#1C120A',
            shadow: '#D97706',
          };

      return (
        <View style={[styles.emblemContainer, isRank1 && styles.emblemContainerGold, { shadowColor: emblemColors.shadow }]}>
          <View
            style={[
              styles.emblemOuterRing,
              isRank1 && styles.emblemOuterRingGold,
              { borderColor: emblemColors.ringBorder, backgroundColor: emblemColors.bg },
            ]}
          >
            <View
              style={[
                styles.emblemInnerRing,
                isRank1 && styles.emblemInnerRingGold,
                { borderColor: emblemColors.ringInner },
              ]}
            >
              {/* 상단 미니 왕관 */}
              <FontAwesome5
                name="crown"
                size={isRank1 ? 8.5 : 7}
                color={emblemColors.crown}
                style={styles.emblemCrownIcon}
              />
              {/* No. 레이블 & 순위 숫자 */}
              <View style={styles.emblemCenterRow}>
                <Text style={[styles.emblemNoText, isRank1 && styles.emblemNoTextGold, { color: emblemColors.noText }]}>No.</Text>
                <Text style={[styles.emblemNumText, isRank1 && styles.emblemNumTextGold, { color: emblemColors.numText }]}>{rank}</Text>
              </View>
              {/* 하단 미니 별 3개 */}
              <Text style={[styles.emblemStarsText, isRank1 && styles.emblemStarsTextGold, { color: emblemColors.star }]}>★ ★ ★</Text>
            </View>
          </View>
        </View>
      );
    };

    return (
      <View style={styles.top3SectionWrap}>
        {/* 상단 타이틀 행 (실시간 LIVE Top3) */}
        <View style={styles.top3HeaderRow}>
          <View style={styles.top3TitleGroup}>
            <Text style={styles.top3FlameEmoji}>🔥</Text>
            <Text style={styles.top3SectionTitle}>실시간 LIVE Top3</Text>
            <View style={styles.top3LiveDotBadge}>
              <View style={styles.top3LiveDot} />
              <Text style={styles.top3LiveDotText}>LIVE RANK</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.top3MoreBtn}
            onPress={() => navigation.navigate('Live')}
            hitSlop={8}
          >
            <Text style={styles.top3MoreText}>랭킹 전체보기</Text>
            <Ionicons name="chevron-forward" size={13} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* 3열 고정 그리드 (1~3위 동시 노출 & 스크롤 없음) */}
        <View style={styles.top3RowContainer}>
          {top3.map((item, index) => {
            const rank = index + 1;
            const isRank1 = rank === 1;
            const isRank2 = rank === 2;

            const cardBorderColor = isRank1 ? '#F59E0B' : isRank2 ? '#94A3B8' : '#D97706';
            const viewerFormatted =
              item.viewerCount >= 1000
                ? `${(item.viewerCount / 1000).toFixed(1)}k`
                : (item.viewerCount || 0).toLocaleString();

            return (
              <View
                key={item.id || String(index)}
                style={[
                  styles.top3CardOuter,
                  isRank1 && styles.top3CardOuterGold,
                  isRank2 && styles.top3CardOuterSilver,
                  !isRank1 && !isRank2 && styles.top3CardOuterBronze,
                ]}
              >
                {/* 상단 중앙 오버랩 화려한 엠블럼 */}
                {renderRankEmblem(rank)}

                <TouchableOpacity
                  style={[styles.top3CardInner, { borderColor: cardBorderColor }]}
                  activeOpacity={0.9}
                  onPress={() => handleOpenLiveRoom(item)}
                >
                  <Image
                    source={{ uri: item.coverUri || item.hostAvatar }}
                    style={styles.top3Cover}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(15, 23, 42, 0.4)', 'rgba(15, 23, 42, 0.95)']}
                    style={styles.top3Gradient}
                  >
                    {/* 상단 시청자수 미니 배지 */}
                    <View style={styles.top3TopRow}>
                      <View style={styles.top3ViewerBadgeMini}>
                        <View style={styles.top3RedDot} />
                        <Text style={styles.top3ViewerTextMini}>{viewerFormatted}</Text>
                      </View>
                    </View>

                    {/* 하단 호스트 정보 */}
                    <View style={styles.top3BottomInfo}>
                      <View style={styles.top3HostRow}>
                        <Image
                          source={{ uri: item.hostAvatar || item.coverUri }}
                          style={[styles.top3HostAvatarMini, { borderColor: cardBorderColor }]}
                        />
                        <Text style={styles.top3HostNameMini} numberOfLines={1}>
                          {item.hostName || '호스트'}
                        </Text>
                      </View>
                      <Text style={styles.top3RoomTitleMini} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // =================================================================
  // 4. [실시간 LIVE] (어지럽지 않게 2개 박스 & 슬라이드 순환 변경)
  // =================================================================
  const renderLiveDualSection = () => {
    if (liveRooms.length === 0) return null;
    const item1 = liveRooms[livePairIndex % liveRooms.length];
    const item2 = liveRooms[(livePairIndex + 1) % liveRooms.length];
    const pairItems = [item1, item2].filter(Boolean);

    return (
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

        {/* 좌/우 2개 박스 슬라이드 배치 */}
        <View style={styles.dualBoxRow}>
          {pairItems.map((item, idx) => {
            const viewerFormatted =
              item.viewerCount >= 1000
                ? `${(item.viewerCount / 1000).toFixed(1)}k`
                : (item.viewerCount || 0).toLocaleString();

            return (
              <TouchableOpacity
                key={`${item.id}-${idx}`}
                style={styles.dualLiveCard}
                activeOpacity={0.9}
                onPress={() => handleOpenLiveRoom(item)}
              >
                <Image source={{ uri: item.coverUri }} style={styles.dualLiveCover} resizeMode="cover" />

                {/* 상단 오버레이 배지 */}
                <View style={styles.dualLiveTopOverlay}>
                  <View style={styles.dualLiveTagChip}>
                    <View style={styles.liveDot} />
                    <Text style={styles.dualLiveTagText}>LIVE</Text>
                  </View>
                  <View style={styles.dualViewerChip}>
                    <Ionicons name="eye" size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
                    <Text style={styles.dualViewerText}>{viewerFormatted}</Text>
                  </View>
                </View>

                {/* 하단 정보 오버레이 */}
                <LinearGradient
                  colors={['transparent', 'rgba(15, 23, 42, 0.55)', 'rgba(15, 23, 42, 0.95)']}
                  style={styles.dualLiveBottomOverlay}
                >
                  <View style={styles.dualLiveHostRow}>
                    <UserAvatar
                      uri={item.hostAvatar}
                      name={item.hostName}
                      size={20}
                      showBorder={true}
                      borderColor="#FFFFFF"
                    />
                    <Text style={styles.dualLiveHostName} numberOfLines={1}>
                      {item.hostName}
                    </Text>
                  </View>
                  <Text style={styles.dualLiveTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.dualLiveCategoryBadge}>
                    <Text style={styles.dualLiveCategoryText}>#{item.tag}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // =================================================================
  // 5. [오늘의 마켓 특가 공구] (2개 박스 & 슬라이드 순환 변경)
  // =================================================================
  const renderHotDealsDualSection = () => {
    if (hotDeals.length === 0) return null;
    const item1 = hotDeals[dealPairIndex % hotDeals.length];
    const item2 = hotDeals[(dealPairIndex + 1) % hotDeals.length];
    const pairItems = [item1, item2].filter(Boolean);

    return (
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

        {/* 좌/우 2개 박스 슬라이드 배치 */}
        <View style={styles.dualBoxRow}>
          {pairItems.map((item, idx) => {
            const discountRate = item.originalPrice
              ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
              : 30;
            const progressPercent = item.targetQuantity
              ? Math.min(100, Math.round(((item.currentQuantity || 0) / item.targetQuantity) * 100))
              : 85;

            return (
              <TouchableOpacity
                key={`${item.id}-${idx}`}
                style={styles.dualDealCard}
                activeOpacity={0.9}
                onPress={() =>
                  navigation.navigate('Market', {
                    screen: 'ProductDetail',
                    params: { productId: item.id, product: item },
                  })
                }
              >
                <View style={styles.dualDealThumbWrap}>
                  <Image
                    source={{ uri: item.images?.[0] || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300' }}
                    style={styles.dualDealThumb}
                    resizeMode="cover"
                  />
                  <View style={styles.dualDealTimerChip}>
                    <Ionicons name="time-outline" size={10} color="#FFFFFF" />
                    <Text style={styles.dualDealTimerText}>05:42:19</Text>
                  </View>
                </View>

                <View style={styles.dualDealInfo}>
                  <Text style={styles.dualDealTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.dualDealPriceRow}>
                    <Text style={styles.dualDealDiscount}>{discountRate}%</Text>
                    <Text style={styles.dualDealPrice}>{item.price.toLocaleString()}원</Text>
                  </View>

                  {/* 달성률 프로그레스바 */}
                  <View style={styles.dualDealProgressWrap}>
                    <View style={styles.dualDealProgressBarBg}>
                      <View style={[styles.dualDealProgressBarFill, { width: `${progressPercent}%` }]} />
                    </View>
                    <View style={styles.dualDealProgressTextRow}>
                      <Text style={styles.dualDealProgressQty}>
                        {item.currentQuantity || 0}/{item.targetQuantity || 30}명
                      </Text>
                      <Text style={styles.dualDealProgressPercent}>{progressPercent}%</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // =================================================================
  // 6. [실시간수다] (동네실시간 수다 -> 실시간수다 이름 변경 & 3개 목록 순환 변경)
  // =================================================================
  const renderSudaSection = () => {
    if (sudaListAll.length === 0) return null;
    // 3개씩 롤링 순환
    const active3 = [
      sudaListAll[sudaRollingIndex % sudaListAll.length],
      sudaListAll[(sudaRollingIndex + 1) % sudaListAll.length],
      sudaListAll[(sudaRollingIndex + 2) % sudaListAll.length],
    ].filter(Boolean);

    return (
      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>실시간수다</Text>
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
          {active3.map((post, idx) => (
            <TouchableOpacity
              key={`${post.id}-${idx}`}
              style={styles.homeSudaCard}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Chat', { screen: 'ChatsMain' })}
            >
              <View style={styles.homeSudaLeft}>
                <Image
                  source={{ uri: post.author?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }}
                  style={styles.homeSudaAvatar}
                />
                <View style={styles.homeSudaMeta}>
                  <View style={styles.homeSudaNameRow}>
                    <Text style={styles.homeSudaAuthor}>{post.author?.nickname || '동네이웃'}</Text>
                    <View style={styles.homeSudaBadge}>
                      <Text style={styles.homeSudaBadgeText}>{post.neighborhood || '우리동네'}</Text>
                    </View>
                    <Text style={styles.homeSudaDistance}>{post.distanceKm || '0.5'}km</Text>
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
                <Ionicons name="chatbubble-ellipses" size={12} color="#FF3B6B" />
                <Text style={styles.homeSudaDirectText}>답장</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // =================================================================
  // 7. [중고마켓] (신규 추가, 2개 박스 & 슬라이드 순환 변경)
  // =================================================================
  const renderUsedMarketDualSection = () => {
    if (usedProducts.length === 0) return null;
    const item1 = usedProducts[usedPairIndex % usedProducts.length];
    const item2 = usedProducts[(usedPairIndex + 1) % usedProducts.length];
    const pairItems = [item1, item2].filter(Boolean);

    return (
      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>중고마켓</Text>
            <View style={styles.usedBadge}>
              <Ionicons name="shield-checkmark" size={11} color="#059669" />
              <Text style={styles.usedBadgeText}>직거래·택배</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.sectionMoreBtn}
            onPress={() => navigation.navigate('Market', { screen: 'MarketMain' })}
            hitSlop={8}
          >
            <Text style={styles.sectionMoreText}>중고 전체보기</Text>
            <Ionicons name="chevron-forward" size={14} color={tokens.colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* 좌/우 2개 박스 슬라이드 배치 */}
        <View style={styles.dualBoxRow}>
          {pairItems.map((item, idx) => (
            <TouchableOpacity
              key={`${item.id}-${idx}`}
              style={styles.dualUsedCard}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate('Market', {
                  screen: 'ProductDetail',
                  params: { productId: item.id, product: item },
                })
              }
            >
              <View style={styles.dualUsedThumbWrap}>
                <Image
                  source={{ uri: item.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400' }}
                  style={styles.dualUsedThumb}
                  resizeMode="cover"
                />
                {item.condition ? (
                  <View style={styles.dualUsedCondChip}>
                    <Text style={styles.dualUsedCondText}>{item.condition}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.dualUsedInfo}>
                <View style={styles.dualUsedMetaRow}>
                  <Text style={styles.dualUsedRegion}>{item.region || '동네 인증'}</Text>
                </View>
                <Text style={styles.dualUsedTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.dualUsedPrice}>{item.price?.toLocaleString()}원</Text>

                <View style={styles.dualUsedFooterRow}>
                  <View style={styles.dualUsedStat}>
                    <Ionicons name="heart-outline" size={11} color="#94A3B8" />
                    <Text style={styles.dualUsedStatText}>{item.likes || 12}</Text>
                  </View>
                  <View style={styles.dualUsedStat}>
                    <Ionicons name="chatbubble-outline" size={11} color="#94A3B8" />
                    <Text style={styles.dualUsedStatText}>{item.chats || 5}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 상단 MOCCO 헤더 */}
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
            {/* 1. 홈 상단 스폰서/프로모션 히어로 배너 */}
            {renderHeroAdBannerSection()}

            {/* 2. 🔥 실시간 LIVE Top3 (화려한 3열 고정 엠블럼) */}
            {renderLiveTop3Section()}

            {/* 3. 실시간 LIVE (2개 박스 슬라이드) */}
            {renderLiveDualSection()}

            {/* 4. 오늘의 마켓 특가 공구 (2개 박스 슬라이드) */}
            {renderHotDealsDualSection()}

            {/* 5. 실시간수다 (3개 목록 롤링 순환) */}
            {renderSudaSection()}

            {/* 6. 중고마켓 (2개 박스 슬라이드 신규 추가) */}
            {renderUsedMarketDualSection()}

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
    backgroundColor: '#FAFAFB',
  },
  scrollContainer: {
    paddingBottom: 20,
  },

  // 1. 헤더 (MOCCO 로고 정중앙 & 확대 & 구름 제거)
  headerContainer: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    position: 'relative',
  },
  headerCenterLogoWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenterLogoText: {
    fontSize: 25,
    fontWeight: '900',
    color: '#FF3B6B',
    letterSpacing: 2,
  },
  headerNotificationBtn: {
    marginLeft: 'auto',
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // 2. 홈 히어로 광고 배너 스타일
  homeHeroWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  homeHeroCard: {
    width: SCREEN_WIDTH - 32,
    height: 124,
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
    marginTop: 6,
    gap: 4,
  },
  homeHeroDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#CBD5E1',
  },
  homeHeroDotActive: {
    width: 14,
    backgroundColor: '#FF3B6B',
  },

  // 3. [🔥 실시간 LIVE Top3] (화려한 3열 고정 엠블럼)
  top3SectionWrap: {
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  top3HeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  top3TitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  top3FlameEmoji: {
    fontSize: 18,
  },
  top3SectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  top3LiveDotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  top3LiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EF4444',
  },
  top3LiveDotText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#DC2626',
  },
  top3MoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  top3MoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  top3RowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 22,
  },
  top3CardOuter: {
    width: TOP3_CARD_WIDTH,
    height: 154,
    position: 'relative',
    overflow: 'visible',
  },
  top3CardOuterGold: {
    width: TOP3_CARD_WIDTH,
    height: 162,
    zIndex: 3,
  },
  top3CardOuterSilver: {
    width: TOP3_CARD_WIDTH,
    height: 154,
    zIndex: 2,
  },
  top3CardOuterBronze: {
    width: TOP3_CARD_WIDTH,
    height: 154,
    zIndex: 1,
  },
  emblemContainer: {
    position: 'absolute',
    top: -16,
    left: 0,
    right: 0,
    width: '100%',
    alignItems: 'center',
    zIndex: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 8,
  },
  emblemContainerGold: {
    top: -19,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 10,
  },
  emblemOuterRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemOuterRingGold: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2.2,
  },
  emblemInnerRing: {
    width: 31,
    height: 31,
    borderRadius: 15.5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 1,
  },
  emblemInnerRingGold: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.2,
  },
  emblemCrownIcon: {
    marginTop: -1,
    marginBottom: 0,
  },
  emblemCenterRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: -1,
  },
  emblemNoText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginRight: 0.5,
  },
  emblemNoTextGold: {
    fontSize: 7.5,
  },
  emblemNumText: {
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 14,
  },
  emblemNumTextGold: {
    fontSize: 15,
    lineHeight: 16,
  },
  emblemStarsText: {
    fontSize: 4.5,
    letterSpacing: 0.5,
    marginTop: -1,
  },
  emblemStarsTextGold: {
    fontSize: 5,
  },
  top3CardInner: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
  },
  top3Cover: {
    width: '100%',
    height: '100%',
  },
  top3Gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    justifyContent: 'space-between',
    padding: 7,
    paddingTop: 22,
  },
  top3TopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  top3ViewerBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    gap: 3,
  },
  top3RedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EF4444',
  },
  top3ViewerTextMini: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  top3BottomInfo: {
    gap: 2,
  },
  top3HostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  top3HostAvatarMini: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
  },
  top3HostNameMini: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E2E8F0',
    flex: 1,
  },
  top3RoomTitleMini: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 14,
  },

  // 섹션 공통 스타일
  sectionWrap: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sectionMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sectionMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },

  // 2열 듀얼 박스 공통 행
  dualBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // 4. [실시간 LIVE] 2개 박스 스타일
  livePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  livePulseText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EF4444',
  },
  dualLiveCard: {
    width: DUAL_BOX_WIDTH,
    height: 196,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  dualLiveCover: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  dualLiveTopOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  dualLiveTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FF3B6B',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dualLiveTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  dualViewerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dualViewerText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  dualLiveBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    paddingTop: 28,
  },
  dualLiveHostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  dualLiveHostName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  dualLiveTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 16,
    marginBottom: 4,
  },
  dualLiveCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dualLiveCategoryText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // 5. [오늘의 마켓 특가 공구] 2개 박스 스타일
  dealTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dealTimeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EF4444',
  },
  dualDealCard: {
    width: DUAL_BOX_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dualDealThumbWrap: {
    width: '100%',
    height: 118,
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  dualDealThumb: {
    width: '100%',
    height: '100%',
  },
  dualDealTimerChip: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  dualDealTimerText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dualDealInfo: {
    padding: 9,
  },
  dualDealTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  dualDealPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 6,
  },
  dualDealDiscount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#EF4444',
  },
  dualDealPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  dualDealProgressWrap: {
    gap: 3,
  },
  dualDealProgressBarBg: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  dualDealProgressBarFill: {
    height: '100%',
    backgroundColor: '#FF3B6B',
    borderRadius: 2,
  },
  dualDealProgressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dualDealProgressQty: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
  },
  dualDealProgressPercent: {
    fontSize: 9,
    color: '#FF3B6B',
    fontWeight: '800',
  },

  // 6. [실시간수다] 3개 롤링 순환 스타일
  sudaLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sudaLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  sudaLiveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EF4444',
  },
  homeSudaList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  homeSudaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  homeSudaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  homeSudaAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#F1F5F9',
  },
  homeSudaMeta: {
    flex: 1,
  },
  homeSudaNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  homeSudaAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  homeSudaBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  homeSudaBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
  },
  homeSudaDistance: {
    fontSize: 10,
    color: '#94A3B8',
  },
  homeSudaContent: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  homeSudaDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  homeSudaDirectText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF3B6B',
  },

  // 7. [중고마켓] 2개 박스 스타일
  usedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  usedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  dualUsedCard: {
    width: DUAL_BOX_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dualUsedThumbWrap: {
    width: '100%',
    height: 118,
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  dualUsedThumb: {
    width: '100%',
    height: '100%',
  },
  dualUsedCondChip: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dualUsedCondText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dualUsedInfo: {
    padding: 9,
  },
  dualUsedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dualUsedRegion: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  dualUsedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  dualUsedPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  dualUsedFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dualUsedStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dualUsedStatText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
