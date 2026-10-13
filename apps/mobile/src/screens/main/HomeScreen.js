// apps/mobile/src/screens/main/HomeScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../theme/colors';
import Avatar from '../../components/Avatar';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

// 라이브 기본 추천 목업 (서버 방이 없을 때도 생동감 넘치게 노출)
const DEFAULT_HOT_LIVES = [
  {
    id: 'live-default-1',
    title: '🎵 힐링 어쿠스틱 라이브 & 소통',
    viewerCount: 142,
    hostName: '민우',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    coverUri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
    tag: '음악·소통',
  },
  {
    id: 'live-default-2',
    title: '☕ 퇴근길 소소한 동네 수다방',
    viewerCount: 98,
    hostName: '지수',
    hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    coverUri: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600',
    tag: '동네·일상',
  },
  {
    id: 'live-default-3',
    title: '🎨 일러스트 드로잉 & 고민 나눔',
    viewerCount: 76,
    hostName: '서연',
    hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    coverUri: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600',
    tag: '취미·예술',
  },
];

// 신규 추천 기본 매력 이웃 리스트
const DEFAULT_NEW_USERS = [
  {
    id: 'user-new-1',
    name: '유진',
    age: 24,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
    location: '강남구 역삼동',
    headline: '새로 왔어요! 카페 투어 같이 갈 친구 구해요 ☕',
    bio: '새로 왔어요! 카페 투어 같이 갈 친구 구해요 ☕',
    online: true,
  },
  {
    id: 'user-new-2',
    name: '도현',
    age: 28,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600',
    location: '송파구 잠실동',
    headline: '퇴근하고 러닝이나 헬스 함께해요 🏃',
    bio: '퇴근하고 러닝이나 헬스 함께해요 🏃',
    online: true,
  },
  {
    id: 'user-new-3',
    name: '채원',
    age: 26,
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600',
    location: '서초구 반포동',
    headline: '전시회랑 맛집 탐방 좋아하는 직장인입니다 ✨',
    bio: '전시회랑 맛집 탐방 좋아하는 직장인입니다 ✨',
    online: false,
  },
];

// BEST 인기 기본 대표 이웃 리스트
const DEFAULT_BEST_USERS = [
  {
    id: 'user-best-1',
    name: '민서',
    age: 27,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
    location: '마포구 연남동',
    headline: '음악과 드라이브를 사랑하는 다가온 인기 이웃 🎵',
    bio: '음악과 드라이브를 사랑하는 다가온 인기 이웃 🎵',
    online: true,
  },
  {
    id: 'user-best-2',
    name: '준호',
    age: 30,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600',
    location: '용산구 한남동',
    headline: '소소하게 일상 나누며 좋은 인연 만들어가요 🌿',
    bio: '소소하게 일상 나누며 좋은 인연 만들어가요 🌿',
    online: true,
  },
  {
    id: 'user-best-3',
    name: '하은',
    age: 25,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600',
    location: '성동구 성수동',
    headline: '오늘도 다가온에서 활발하게 소통 중입니다 🌸',
    bio: '오늘도 다가온에서 활발하게 소통 중입니다 🌸',
    online: true,
  },
];

function mapHomeDiscoverUser(user) {
  const profile = user?.profile ?? {};
  const targetAccountId =
    typeof user?.targetAccountId === 'string'
      ? user.targetAccountId.trim()
      : '';

  return {
    id: user?.id,
    targetUserId: user?.id,
    targetAccountId: targetAccountId || undefined,
    name: profile?.nickname || user?.displayName || '회원',
    age: typeof user?.age === 'number' ? user.age : undefined,
    avatar: profile?.avatarUri || undefined,
    location:
      [user?.region1, user?.region2].filter(Boolean).join(' · ') || '동네 이웃',
    bio: profile?.bio || profile?.headline || '반가워요!',
    headline: profile?.headline || '새로운 인연을 기다려요 ✨',
    points: typeof user?.points === 'number' ? user.points : 500,
    online: Boolean(profile?.lastSeenAt && !profile?.hideOnlineStatus),
  };
}

export default function HomeScreen({ navigation }) {
  const { user: authUser } = useAuth();
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [communityTopics, setCommunityTopics] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [liveRooms, setLiveRooms] = useState([]);
  const [myPoints, setMyPoints] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // 신규 추천 / BEST 인기 슬라이드 인덱스
  const [activeNewIdx, setActiveNewIdx] = useState(0);
  const [activeBestIdx, setActiveBestIdx] = useState(0);

  // 1. 배너 자동 롤링 (4.5초 주기)
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [banners.length]);

  // 2. 신규 추천 / BEST 슬라이드 자동 전환
  const newUsers = useMemo(() => {
    if (discoverUsers.length >= 2) {
      return discoverUsers.slice(0, Math.ceil(discoverUsers.length / 2));
    }
    return DEFAULT_NEW_USERS;
  }, [discoverUsers]);

  const bestUsers = useMemo(() => {
    if (discoverUsers.length >= 2) {
      return [...discoverUsers]
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, 5);
    }
    return DEFAULT_BEST_USERS;
  }, [discoverUsers]);

  const [isPausedNew, setIsPausedNew] = useState(false);
  const [isPausedBest, setIsPausedBest] = useState(false);

  useEffect(() => {
    if (newUsers.length <= 1 || isPausedNew) return;
    const interval = setInterval(() => {
      setActiveNewIdx((prev) => (prev + 1) % newUsers.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [newUsers.length, isPausedNew]);

  useEffect(() => {
    if (bestUsers.length <= 1 || isPausedBest) return;
    const interval = setInterval(() => {
      setActiveBestIdx((prev) => (prev + 1) % bestUsers.length);
    }, 4300);
    return () => clearInterval(interval);
  }, [bestUsers.length, isPausedBest]);

  const handleNextNew = (e) => {
    e?.stopPropagation?.();
    setActiveNewIdx((prev) => (prev + 1) % newUsers.length);
  };

  const handleNextBest = (e) => {
    e?.stopPropagation?.();
    setActiveBestIdx((prev) => (prev + 1) % bestUsers.length);
  };

  const loadHomeData = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    try {
      const [
        discoverResult,
        topicsResult,
        postsResult,
        bannersResult,
        liveResult,
        balanceResult,
      ] = await Promise.allSettled([
        apiClient.getDiscover(),
        apiClient.getTopics(),
        apiClient.getPosts({ take: 3 }),
        apiClient.getAdvertisements({ placement: 'HOME_BANNER' }),
        apiClient.getLiveRooms(),
        apiClient.getPointBalance(),
      ]);

      if (discoverResult.status === 'fulfilled') {
        const list = Array.isArray(discoverResult.value) ? discoverResult.value : [];
        setDiscoverUsers(
          list.map(mapHomeDiscoverUser).filter((item) => item.id),
        );
      }

      if (topicsResult.status === 'fulfilled') {
        const list = Array.isArray(topicsResult.value) ? topicsResult.value : [];
        setCommunityTopics(list);
      }

      if (postsResult.status === 'fulfilled') {
        const items = Array.isArray(postsResult.value?.items)
          ? postsResult.value.items
          : Array.isArray(postsResult.value)
          ? postsResult.value
          : [];
        setRecentPosts(items);
      }

      if (bannersResult.status === 'fulfilled') {
        const ads = Array.isArray(bannersResult.value) ? bannersResult.value : [];
        setBanners(ads);
      }

      if (liveResult.status === 'fulfilled') {
        const rooms = Array.isArray(liveResult.value)
          ? liveResult.value
          : Array.isArray(liveResult.value?.items)
          ? liveResult.value.items
          : [];
        const activeOnes = rooms.filter(
          (r) => r.status === 'ACTIVE' || r.status === 'LIVE' || !r.status,
        );
        setLiveRooms(activeOnes.length > 0 ? activeOnes : DEFAULT_HOT_LIVES);
      } else {
        setLiveRooms(DEFAULT_HOT_LIVES);
      }

      if (balanceResult.status === 'fulfilled' && balanceResult.value?.balance !== undefined) {
        setMyPoints(Number(balanceResult.value.balance));
      }
    } catch {
      setLiveRooms(DEFAULT_HOT_LIVES);
    } finally {
      if (refresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  // 화면 포커스 시 홈 데이터 자동 새로고침
  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData])
  );

  const handleProfilePress = (item) => {
    if (!item) return;
    const targetAccountId =
      typeof item?.targetAccountId === 'string'
        ? item.targetAccountId.trim()
        : '';
    const targetUserId =
      typeof item?.targetUserId === 'string' ? item.targetUserId.trim() : '';
    const targetIdentity = targetAccountId
      ? { targetAccountId }
      : targetUserId
        ? { targetUserId }
        : {};
    navigation.navigate('ProfileDetail', {
      profile: {
        id: item.id,
        ...targetIdentity,
        name: item.name,
        location: item.location,
        bio: item.bio,
        avatar: item.avatar,
        coverImage: item.avatar,
        age: item.age,
        photos: item.photos,
      },
    });
  };

  const handleOpenLiveRoom = (room) => {
    navigation.navigate('Live', {
      screen: 'LiveRoom',
      params: {
        roomId: room.id,
        roomTitle: room.title,
        hostName: room.host?.displayName || room.hostName || '호스트',
        hostAvatar: room.host?.avatarUrl || room.hostAvatar,
      },
    });
  };

  const handleOpenCommunity = (topicId = null) => {
    navigation.navigate('Community', {
      screen: 'CommunityMain',
      params: { initialTopicId: topicId },
    });
  };

  const handleBannerPress = (banner) => {
    if (!banner) return;
    if (banner.id) {
      apiClient.recordAdClick(banner.id).catch(() => {});
    }
    if (banner.linkUrl) {
      if (banner.linkUrl.startsWith('route:')) {
        const routeName = banner.linkUrl.replace('route:', '');
        navigation.navigate(routeName);
      } else {
        navigation.navigate('Shop');
      }
    } else {
      navigation.navigate('Shop');
    }
  };

  const currentBanner = banners.length > 0 ? banners[activeBannerIdx % banners.length] : null;

  // 현재 슬라이드 카드 선택
  const curNewUser = newUsers[activeNewIdx % newUsers.length];
  const curBestUser = bestUsers[activeBestIdx % bestUsers.length];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* =================================================================
          1. GNB 상단 앱바 (검색 & 잔여온 제거 -> 로고와 알림만으로 극대화된 심플함)
          ================================================================= */}
      <View style={styles.appbar}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>다가온</Text>
          <View style={styles.brandDot} />
        </View>

        <View style={styles.appbarRightActions}>
          {/* 알림 아이콘 */}
          <TouchableOpacity
            style={styles.appbarIconBtn}
            onPress={() => navigation.navigate('Notifications')}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color="#191919" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadHomeData({ refresh: true })}
            colors={['#191919', colors.primary]}
            tintColor="#191919"
          />
        }
      >
        {/* =================================================================
            2. 내 프로필 정보 & 통합 보유 온(ON) 충전 박스
            ================================================================= */}
        <View style={styles.myProfileBanner}>
          <TouchableOpacity
            style={styles.myProfileLeft}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('My')}
          >
            <View style={styles.myAvatarWrap}>
              <Avatar
                size={48}
                name={authUser?.displayName || '나'}
                uri={authUser?.profile?.avatarUri}
              />
              {!authUser?.profile?.hideOnlineStatus && <View style={styles.onlineBadge} />}
            </View>
            <View style={styles.myProfileMeta}>
              <View style={styles.myProfileNameRow}>
                <Text style={styles.myProfileName} numberOfLines={1}>
                  {authUser?.displayName || authUser?.profile?.nickname || '다가온 회원'}
                </Text>
                <View style={styles.verifiedTag}>
                  <Text style={styles.verifiedTagText}>인증회원</Text>
                </View>
              </View>
              <Text style={styles.myProfileStatus} numberOfLines={1}>
                {authUser?.profile?.headline || '오늘도 다가온에서 새로운 인연을 만나보세요 ✨'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 우측: 내 온(ON) 통합 칩 & 충전 버튼 */}
          <TouchableOpacity
            style={styles.myPointsChip}
            onPress={() => navigation.navigate('Shop')}
            activeOpacity={0.82}
          >
            <View style={styles.myPointsIconRow}>
              <Ionicons name="sparkles" size={13} color="#D97706" />
              <Text style={styles.myPointsAmount}>{myPoints.toLocaleString()} 온</Text>
            </View>
            <View style={styles.myPointsChargeTag}>
              <Text style={styles.myPointsChargeText}>충전 ›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* =================================================================
            3. 🎁 스마트 프로모션/이벤트 롤링 배너 (최상단으로 전진 배치!)
            ================================================================= */}
        <View style={styles.bannerSection}>
          {currentBanner ? (
            <TouchableOpacity
              style={styles.adBannerCard}
              activeOpacity={0.9}
              onPress={() => handleBannerPress(currentBanner)}
            >
              {currentBanner.imageUrl ? (
                <Image
                  source={{ uri: currentBanner.imageUrl }}
                  style={styles.adBannerImage}
                />
              ) : null}
              <View style={styles.adBannerOverlay}>
                <View style={styles.adBadgeRow}>
                  <View style={styles.adBadgeKakao}>
                    <Text style={styles.adBadgeTextKakao}>EVENT</Text>
                  </View>
                  {banners.length > 1 && (
                    <View style={styles.bannerPageBadge}>
                      <Text style={styles.bannerPageText}>
                        {(activeBannerIdx % banners.length) + 1} / {banners.length}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.adBannerTitle} numberOfLines={1}>
                  {currentBanner.title}
                </Text>
                {currentBanner.description ? (
                  <Text style={styles.adBannerDesc} numberOfLines={1}>
                    {currentBanner.description}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.defaultBannerCard}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Shop')}
            >
              <LinearGradient
                colors={['#FFFBEB', '#FEF3C7']}
                style={styles.defaultBannerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.defaultBannerLeft}>
                  <View style={styles.defaultBannerBadge}>
                    <Text style={styles.defaultBannerBadgeText}>SPECIAL</Text>
                  </View>
                  <Text style={styles.defaultBannerTitle}>
                    프로필 완성하고 50 온 즉시 받기
                  </Text>
                  <Text style={styles.defaultBannerDesc}>
                    동네 이웃에게 나를 소개하고 온을 충전하세요!
                  </Text>
                </View>
                <View style={styles.defaultBannerArrowBtn}>
                  <Ionicons name="arrow-forward" size={16} color="#191919" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* =================================================================
            4. 4대 핵심 숏컷 그리드 (원터치 빠른 이동)
            ================================================================= */}
        <View style={styles.shortcutGrid}>
          {/* 라이브 방송 */}
          <TouchableOpacity
            style={styles.shortcutItem}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Live')}
          >
            <View style={[styles.shortcutIconBg, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="radio" size={24} color="#EF4444" />
              <View style={styles.shortcutPulseDot} />
            </View>
            <Text style={styles.shortcutLabel}>실시간 라이브</Text>
            <Text style={styles.shortcutSub}>HOT 생방송</Text>
          </TouchableOpacity>

          {/* 동네 커뮤니티 */}
          <TouchableOpacity
            style={styles.shortcutItem}
            activeOpacity={0.8}
            onPress={() => handleOpenCommunity()}
          >
            <View style={[styles.shortcutIconBg, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="people" size={24} color="#4F46E5" />
            </View>
            <Text style={styles.shortcutLabel}>동네 피드</Text>
            <Text style={styles.shortcutSub}>이웃 이야기</Text>
          </TouchableOpacity>

          {/* 인연·대화 */}
          <TouchableOpacity
            style={styles.shortcutItem}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Chat')}
          >
            <View style={[styles.shortcutIconBg, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="chatbubbles" size={24} color="#D97706" />
            </View>
            <Text style={styles.shortcutLabel}>인연 · 대화</Text>
            <Text style={styles.shortcutSub}>새로운 친구</Text>
          </TouchableOpacity>

          {/* 무료 충전소 */}
          <TouchableOpacity
            style={styles.shortcutItem}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Shop')}
          >
            <View style={[styles.shortcutIconBg, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="gift" size={24} color="#16A34A" />
            </View>
            <Text style={styles.shortcutLabel}>무료 온(ON)</Text>
            <Text style={styles.shortcutSub}>출석 & 리워드</Text>
          </TouchableOpacity>
        </View>

        {/* =================================================================
            5. 🔴 실시간 LIVE HOT 방송 쇼케이스
            ================================================================= */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.livePulseDot} />
              <Text style={styles.sectionTitle}>지금 뜨거운 실시간 LIVE</Text>
              <View style={styles.sectionBadgeRed}>
                <Text style={styles.sectionBadgeTextRed}>ON AIR</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Live')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionMoreLink}>전체보기 ›</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.liveScrollContent}
          >
            {liveRooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={styles.liveCard}
                activeOpacity={0.9}
                onPress={() => handleOpenLiveRoom(room)}
              >
                <View style={styles.liveThumbWrap}>
                  <Image
                    source={{
                      uri:
                        room.coverUri ||
                        room.thumbnailUrl ||
                        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
                    }}
                    style={styles.liveThumbImage}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.75)']}
                    style={styles.liveGradientOverlay}
                  />

                  {/* 상단 ON AIR 배지 & 시청자 수 */}
                  <View style={styles.liveTopBadges}>
                    <View style={styles.liveOnAirPill}>
                      <Text style={styles.liveOnAirText}>LIVE</Text>
                    </View>
                    <View style={styles.liveViewerPill}>
                      <Ionicons name="eye" size={11} color="#FFFFFF" />
                      <Text style={styles.liveViewerText}>
                        {room.viewerCount || 42}
                      </Text>
                    </View>
                  </View>

                  {/* 하단 호스트 정보 */}
                  <View style={styles.liveBottomHost}>
                    <Avatar
                      size={26}
                      name={room.host?.displayName || room.hostName}
                      uri={room.host?.avatarUrl || room.hostAvatar}
                    />
                    <Text style={styles.liveHostName} numberOfLines={1}>
                      {room.host?.displayName || room.hostName || '호스트'}
                    </Text>
                  </View>
                </View>

                {/* 카드 제목 */}
                <View style={styles.liveMeta}>
                  <Text style={styles.liveTitle} numberOfLines={1}>
                    {room.title}
                  </Text>
                  <Text style={styles.liveTagText}>
                    #{room.tag || '실시간소통'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* 나도 방송하기 카드 */}
            <TouchableOpacity
              style={styles.liveCreateCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Live')}
            >
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                style={styles.liveCreateGradient}
              >
                <View style={styles.liveCreateIconCircle}>
                  <Ionicons name="add" size={28} color="#D97706" />
                </View>
                <Text style={styles.liveCreateTitle}>라이브 시작하기</Text>
                <Text style={styles.liveCreateSub}>
                  이웃들과 소통하고{'\n'}선물 온(ON)을 받아보세요!
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* =================================================================
            6. ✨ 지금 접속 중인 이웃 (스토리 아바타 링)
            ================================================================= */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>지금 접속 중인 이웃</Text>
              <View style={styles.onlineCountBadge}>
                <Text style={styles.onlineCountText}>{discoverUsers.length || 8}명 ON</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Chat', { tab: 'discover' })}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionMoreLink}>인연 찾기 ›</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storyScrollContent}
          >
            {discoverUsers.length > 0 ? (
              discoverUsers.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.storyItem}
                  activeOpacity={0.8}
                  onPress={() => handleProfilePress(item)}
                >
                  <View style={styles.storyAvatarRing}>
                    <Avatar size={58} name={item.name} uri={item.avatar} />
                    <View style={styles.storyActiveDot} />
                  </View>
                  <Text style={styles.storyName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.storyLoc} numberOfLines={1}>
                    {item.location?.split(' ')[0] || '동네이웃'}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <TouchableOpacity
                style={styles.emptyDiscoverCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Chat', { tab: 'discover' })}
              >
                <View style={styles.emptyDiscoverIconBg}>
                  <Ionicons name="sparkles" size={20} color="#191919" />
                </View>
                <View style={styles.emptyDiscoverTextWrap}>
                  <Text style={styles.emptyDiscoverTitle}>주변 새로운 인연 찾기</Text>
                  <Text style={styles.emptyDiscoverSubtitle}>
                    동네 이웃과 소통을 시작해보세요 ›
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* =================================================================
            7. 💎 [신규 신설] 오늘의 추천 인연 (신규 추천 / BEST 인기 듀얼 쇼케이스)
            ================================================================= */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>오늘의 추천 인연</Text>
              <View style={styles.showcaseSectionBadge}>
                <Text style={styles.showcaseSectionBadgeText}>NEW & BEST</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Chat', { tab: 'discover' })}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionMoreLink}>인연 더보기 ›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.showcaseDualRow}>
            {/* 좌측: 신규 추천 카드 (슬라이드 전환) */}
            <TouchableOpacity
              style={styles.showcaseCard}
              activeOpacity={0.92}
              onPress={() => handleProfilePress(curNewUser)}
              onPressIn={() => setIsPausedNew(true)}
              onPressOut={() => setIsPausedNew(false)}
            >
              <Image
                source={{
                  uri:
                    curNewUser?.avatar ||
                    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
                }}
                style={styles.showcaseImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(0,0,0,0.85)']}
                style={styles.showcaseGradient}
              >
                <View style={styles.showcaseTopRow}>
                  <View style={styles.showcaseBadgeNew}>
                    <Text style={styles.showcaseBadgeText}>✨ 신규 추천</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.showcaseCounterPill}
                    onPress={handleNextNew}
                    hitSlop={8}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.showcaseCounterText}>
                      {(activeNewIdx % newUsers.length) + 1}/{newUsers.length} ›
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.showcaseBottomMeta}>
                  <View style={styles.showcaseNameRow}>
                    <View style={styles.showcaseOnlineDot} />
                    <Text style={styles.showcaseNameText} numberOfLines={1}>
                      {curNewUser?.name}
                      {curNewUser?.age ? `, ${curNewUser.age}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.showcaseLocText} numberOfLines={1}>
                    📍 {curNewUser?.location?.split(' ')[0] || '동네 이웃'}
                  </Text>
                  <Text style={styles.showcaseHeadline} numberOfLines={1}>
                    {curNewUser?.headline || '새로운 인연을 찾고 있어요 ☕'}
                  </Text>
                  <Text style={styles.showcaseActionHint}>프로필 보기 ›</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* 우측: BEST 인기 카드 (슬라이드 전환) */}
            <TouchableOpacity
              style={styles.showcaseCard}
              activeOpacity={0.92}
              onPress={() => handleProfilePress(curBestUser)}
              onPressIn={() => setIsPausedBest(true)}
              onPressOut={() => setIsPausedBest(false)}
            >
              <Image
                source={{
                  uri:
                    curBestUser?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
                }}
                style={styles.showcaseImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(0,0,0,0.85)']}
                style={styles.showcaseGradient}
              >
                <View style={styles.showcaseTopRow}>
                  <View style={styles.showcaseBadgeBest}>
                    <Text style={styles.showcaseBadgeText}>👑 BEST 인기</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.showcaseCounterPill}
                    onPress={handleNextBest}
                    hitSlop={8}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.showcaseCounterText}>
                      {(activeBestIdx % bestUsers.length) + 1}/{bestUsers.length} ›
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.showcaseBottomMeta}>
                  <View style={styles.showcaseNameRow}>
                    <View style={styles.showcaseOnlineDot} />
                    <Text style={styles.showcaseNameText} numberOfLines={1}>
                      {curBestUser?.name}
                      {curBestUser?.age ? `, ${curBestUser.age}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.showcaseLocText} numberOfLines={1}>
                    📍 {curBestUser?.location?.split(' ')[0] || '동네 이웃'}
                  </Text>
                  <Text style={styles.showcaseHeadline} numberOfLines={1}>
                    {curBestUser?.headline || '인기 회원과 대화해 보세요 🌸'}
                  </Text>
                  <Text style={styles.showcaseActionHint}>프로필 보기 ›</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* =================================================================
            8. 📰 다가온 동네 커뮤니티 이야기 피드 (생생한 이웃 일상)
            ================================================================= */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>동네 커뮤니티 이야기</Text>
              <Text style={styles.sectionSubCount}>실시간</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleOpenCommunity()}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionMoreLink}>피드 더보기 ›</Text>
            </TouchableOpacity>
          </View>

          {/* 토픽 캡슐 칩 */}
          {communityTopics.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topicChipScroll}
            >
              {communityTopics.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  style={styles.topicChip}
                  onPress={() => handleOpenCommunity(topic.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.topicChipText}>#{topic.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* 최근 게시글 피드 목록 */}
          <View style={styles.postList}>
            {recentPosts.length > 0 ? (
              recentPosts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.postCard}
                  activeOpacity={0.85}
                  onPress={() => handleOpenCommunity(post.topicId)}
                >
                  <View style={styles.postTopRow}>
                    <Avatar
                      size={32}
                      name={post.author?.name || '이웃'}
                      uri={post.author?.avatar}
                    />
                    <View style={styles.postAuthorMeta}>
                      <Text style={styles.postAuthorName}>
                        {post.author?.name || '동네 이웃'}
                      </Text>
                      <Text style={styles.postTime}>
                        {post.topicName ? `#${post.topicName} · ` : ''}방금 전
                      </Text>
                    </View>
                    <View style={styles.postCategoryBadge}>
                      <Text style={styles.postCategoryText}>
                        {post.topicName || '소통'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.postContent} numberOfLines={2}>
                    {post.content}
                  </Text>

                  <View style={styles.postBottomRow}>
                    <View style={styles.postStats}>
                      <View style={styles.statItem}>
                        <Ionicons name="heart-outline" size={14} color="#9CA3AF" />
                        <Text style={styles.statText}>
                          {post.likesCount || 12}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons
                          name="chatbubble-ellipses-outline"
                          size={14}
                          color="#9CA3AF"
                        />
                        <Text style={styles.statText}>
                          {post.commentsCount || 3}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.postReadMore}>자세히 보기</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <TouchableOpacity
                style={styles.emptyPostPrompt}
                onPress={() => handleOpenCommunity()}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color="#F59E0B"
                />
                <Text style={styles.emptyPostPromptText}>
                  첫 번째 동네 이야기를 올리고 이웃들과 소통해 보세요!
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* =================================================================
            9. 🛡️ 다가온 안심 케어 시스템 배너
            ================================================================= */}
        <View style={styles.safeCareCard}>
          <View style={styles.safeCareLeft}>
            <View style={styles.safeCareIcon}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            </View>
            <View>
              <Text style={styles.safeCareTitle}>다가온 24/7 클린 안심 케어</Text>
              <Text style={styles.safeCareDesc}>
                100% 본인 인증과 AI 실시간 모니터링으로 안전한 소통을 지원합니다.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // 1. 심플 프리미엄 앱바
  appbar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3F5',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#191919',
    letterSpacing: -0.6,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FEE500',
    marginTop: 2,
  },
  appbarRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appbarIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // 2. 내 프로필 & 통합 잔여 온 칩 카드
  myProfileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  myProfileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  myAvatarWrap: {
    position: 'relative',
    marginRight: 10,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  myProfileMeta: {
    flex: 1,
  },
  myProfileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  myProfileName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#191919',
    letterSpacing: -0.3,
  },
  verifiedTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284C7',
  },
  myProfileStatus: {
    fontSize: 12,
    color: '#71717A',
    lineHeight: 16,
  },
  myPointsChip: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  myPointsIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  myPointsAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#B45309',
  },
  myPointsChargeTag: {
    marginTop: 2,
  },
  myPointsChargeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },

  // 3. 배너 섹션 (최상단)
  bannerSection: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  adBannerCard: {
    height: 94,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#191919',
    position: 'relative',
  },
  adBannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  adBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 12,
    justifyContent: 'center',
  },
  adBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  adBadgeKakao: {
    backgroundColor: '#FEE500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adBadgeTextKakao: {
    fontSize: 9,
    fontWeight: '900',
    color: '#191919',
  },
  bannerPageBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  bannerPageText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  adBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  adBannerDesc: {
    fontSize: 11,
    color: '#E5E7EB',
  },
  defaultBannerCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  defaultBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: 14,
  },
  defaultBannerLeft: {
    flex: 1,
    marginRight: 10,
  },
  defaultBannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginBottom: 4,
  },
  defaultBannerBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  defaultBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  defaultBannerDesc: {
    fontSize: 11,
    color: '#B45309',
  },
  defaultBannerArrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 4. 4대 숏컷 그리드
  shortcutGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 14,
  },
  shortcutItem: {
    alignItems: 'center',
    flex: 1,
  },
  shortcutIconBg: {
    width: 52,
    height: 52,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  shortcutPulseDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  shortcutLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191919',
    letterSpacing: -0.2,
  },
  shortcutSub: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 1,
  },

  // 공통 섹션 컨테이너
  sectionContainer: {
    marginTop: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#191919',
    letterSpacing: -0.4,
  },
  sectionBadgeRed: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  sectionBadgeTextRed: {
    fontSize: 9,
    fontWeight: '900',
    color: '#EF4444',
  },
  sectionSubCount: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  sectionMoreLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
  },

  // 5. 실시간 LIVE 카드
  liveScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  liveCard: {
    width: 172,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2F3F5',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  liveThumbWrap: {
    width: '100%',
    height: 130,
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  liveThumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  liveGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  liveTopBadges: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveOnAirPill: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveOnAirText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  liveViewerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveViewerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  liveBottomHost: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveHostName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  liveMeta: {
    padding: 10,
  },
  liveTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191919',
    marginBottom: 2,
  },
  liveTagText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
  },
  liveCreateCard: {
    width: 140,
    height: 194,
    borderRadius: 16,
    overflow: 'hidden',
  },
  liveCreateGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
  },
  liveCreateIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 2,
  },
  liveCreateTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 4,
  },
  liveCreateSub: {
    fontSize: 10,
    color: '#B45309',
    textAlign: 'center',
    lineHeight: 14,
  },

  // 6. 지금 접속 중인 이웃 (스토리)
  onlineCountBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  onlineCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  storyScrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 64,
  },
  storyAvatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#FEE500',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  storyActiveDot: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  storyName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191919',
    width: 60,
    textAlign: 'center',
  },
  storyLoc: {
    fontSize: 10,
    color: '#8E8E93',
    width: 60,
    textAlign: 'center',
  },
  emptyDiscoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8F9FA',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: width - 32,
  },
  emptyDiscoverIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDiscoverTextWrap: {
    flex: 1,
  },
  emptyDiscoverTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#191919',
  },
  emptyDiscoverSubtitle: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },

  // 7. [신규 신설] 신규 추천 & BEST 인기 듀얼 쇼케이스
  showcaseSectionBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  showcaseSectionBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#D97706',
  },
  showcaseDualRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  showcaseCard: {
    flex: 1,
    height: 234,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    position: 'relative',
  },
  showcaseImage: {
    width: '100%',
    height: '100%',
  },
  showcaseGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 12,
  },
  showcaseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  showcaseBadgeNew: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  showcaseBadgeBest: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  showcaseBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  showcaseCounterPill: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  showcaseCounterText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  showcaseBottomMeta: {
    gap: 2,
  },
  showcaseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  showcaseOnlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  showcaseNameText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  showcaseLocText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  showcaseHeadline: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  showcaseActionHint: {
    color: '#FCD34D',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },

  // 8. 커뮤니티 피드
  topicChipScroll: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  topicChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  topicChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  postList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  postCard: {
    backgroundColor: '#FAFAFA',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F2F3F5',
  },
  postTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  postAuthorMeta: {
    flex: 1,
    marginLeft: 8,
  },
  postAuthorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191919',
  },
  postTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  postCategoryBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  postCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  postContent: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 10,
  },
  postBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  postReadMore: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
  },
  emptyPostPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  emptyPostPromptText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    flex: 1,
  },

  // 9. 안심 케어 카드
  safeCareCard: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  safeCareLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  safeCareIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeCareTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  safeCareDesc: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
    lineHeight: 15,
  },
});
