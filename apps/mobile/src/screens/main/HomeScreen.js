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
      [user?.region1, user?.region2].filter(Boolean).join(' · ') || '지역 미설정',
    bio: profile?.bio || profile?.headline || '반가워요!',
    headline: profile?.headline || '새로운 인연을 기다려요',
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

  // 배너 자동 롤링 (4초 주기)
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [banners.length]);

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

  // 화면 포커스 시 잔여 포인트 및 실시간 라이브 빠른 동기화
  useFocusEffect(
    useCallback(() => {
      apiClient.getPointBalance().then((res) => {
        if (res?.balance !== undefined) setMyPoints(Number(res.balance));
      }).catch(() => {});

      apiClient.getLiveRooms().then((rooms) => {
        if (Array.isArray(rooms) && rooms.length > 0) {
          const activeOnes = rooms.filter(
            (r) => r.status === 'ACTIVE' || r.status === 'LIVE' || !r.status,
          );
          if (activeOnes.length > 0) setLiveRooms(activeOnes);
        }
      }).catch(() => {});
    }, [])
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* =================================================================
          1. 카카오톡 스타일 GNB 상단 앱바
          ================================================================= */}
      <View style={styles.appbar}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>다가온</Text>
          <View style={styles.brandDot} />
        </View>

        <View style={styles.appbarRightActions}>
          {/* 내 포인트 잔액 칩 (카카오 옐로우 포인트) */}
          <TouchableOpacity
            style={styles.pointChip}
            onPress={() => navigation.navigate('Shop')}
            activeOpacity={0.8}
          >
            <View style={styles.pointIconBg}>
              <Ionicons name="sparkles" size={12} color="#191919" />
            </View>
            <Text style={styles.pointChipText}>{myPoints.toLocaleString()}P</Text>
          </TouchableOpacity>

          {/* 검색 아이콘 */}
          <TouchableOpacity
            style={styles.appbarIconBtn}
            onPress={() => navigation.navigate('HotRecommend', { openFilter: true })}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={20} color="#191919" />
          </TouchableOpacity>

          {/* 알림 아이콘 */}
          <TouchableOpacity
            style={styles.appbarIconBtn}
            onPress={() => navigation.navigate('Notifications')}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color="#191919" />
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
            2. 카카오톡 상단 웰컴 & 내 프로필 미니 바
            ================================================================= */}
        <TouchableOpacity
          style={styles.myProfileBanner}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('My')}
        >
          <View style={styles.myProfileLeft}>
            <View style={styles.myAvatarWrap}>
              <Avatar
                size={46}
                name={authUser?.displayName || '나'}
                uri={authUser?.profile?.avatarUri}
              />
              <View style={styles.onlineBadge} />
            </View>
            <View style={styles.myProfileMeta}>
              <View style={styles.myProfileNameRow}>
                <Text style={styles.myProfileName}>
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
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>

        {/* =================================================================
            3. 4대 핵심 숏컷 그리드 (카카오톡 스타일 원터치 포털)
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

          {/* 1:1 대화 */}
          <TouchableOpacity
            style={styles.shortcutItem}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Chat')}
          >
            <View style={[styles.shortcutIconBg, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="chatbubbles" size={24} color="#D97706" />
            </View>
            <Text style={styles.shortcutLabel}>새로운 대화</Text>
            <Text style={styles.shortcutSub}>실시간 채팅</Text>
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
            <Text style={styles.shortcutLabel}>무료 포인트</Text>
            <Text style={styles.shortcutSub}>출석 & 리워드</Text>
          </TouchableOpacity>
        </View>

        {/* =================================================================
            4. 🔴 실시간 LIVE HOT 방송 쇼케이스 (가로 스크롤 카드)
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
                  이웃들과 소통하고{'\n'}선물 포인트를 받아보세요!
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* =================================================================
            5. ✨ 지금 접속 중인 친구들 (카카오톡/인스타 스토리 아바타 링)
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
              onPress={() => navigation.navigate('HotRecommend')}
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
                onPress={() => navigation.navigate('HotRecommend')}
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
            6. 🎁 카카오톡 스타일 스마트 프로모션 배너 (동적 슬라이드)
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
                    프로필 완성하고 50P 즉시 받기
                  </Text>
                  <Text style={styles.defaultBannerDesc}>
                    동네 이웃에게 나를 소개하고 포인트를 충전하세요!
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
            7. 📰 다가온 동네 커뮤니티 이야기 피드 (생생한 이웃 일상)
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
            8. 🛡️ 다가온 안심 케어 시스템 배너
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
  // 1. 카카오 스타일 상단 앱바
  appbar: {
    height: 56,
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
    marginTop: 4,
  },
  appbarRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEE500',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointIconBg: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#191919',
  },
  appbarIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7F8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scrollContent: {
    paddingBottom: 130, // 하단 탭 바 위로 안전 스크롤
  },

  // 2. 카카오톡 상단 웰컴 & 내 프로필 미니 배너
  myProfileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  myProfileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  myAvatarWrap: {
    position: 'relative',
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
  },
  myProfileName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#191919',
  },
  verifiedTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  myProfileStatus: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },

  // 3. 4대 숏컷 그리드
  shortcutGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
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
    marginBottom: 8,
    position: 'relative',
  },
  shortcutPulseDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  shortcutLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#191919',
  },
  shortcutSub: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 1,
  },

  // 섹션 공통 스타일
  sectionContainer: {
    marginTop: 20,
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
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#191919',
    letterSpacing: -0.4,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  sectionBadgeRed: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sectionBadgeTextRed: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '900',
  },
  sectionSubCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  sectionMoreLink: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  },

  // 4. 실시간 LIVE 방송 쇼케이스
  liveScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  liveCard: {
    width: 170,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EAED',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  liveThumbWrap: {
    width: '100%',
    height: 120,
    position: 'relative',
    backgroundColor: '#1E293B',
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
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  liveViewerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveViewerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  liveBottomHost: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveHostName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
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
    color: '#F59E0B',
    fontWeight: '600',
  },
  liveCreateCard: {
    width: 150,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  liveCreateGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  liveCreateIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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

  // 5. 지금 접속 중인 친구들
  onlineCountBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  onlineCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  storyScrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 66,
  },
  storyAvatarRing: {
    position: 'relative',
    padding: 2,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: '#FEE500',
    marginBottom: 6,
  },
  storyActiveDot: {
    position: 'absolute',
    bottom: 2,
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
    textAlign: 'center',
    width: '100%',
  },
  storyLoc: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 1,
  },

  // 6. 배너 영역
  bannerSection: {
    marginHorizontal: 16,
    marginTop: 22,
  },
  adBannerCard: {
    height: 100,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  adBannerImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  adBannerOverlay: {
    padding: 12,
    backgroundColor: 'rgba(25, 25, 25, 0.65)',
  },
  adBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  adBadgeKakao: {
    backgroundColor: '#FEE500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adBadgeTextKakao: {
    color: '#191919',
    fontSize: 9,
    fontWeight: '900',
  },
  bannerPageBadge: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  bannerPageText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },
  adBannerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  adBannerDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginTop: 2,
  },
  defaultBannerCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  defaultBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  defaultBannerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  defaultBannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  defaultBannerBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#191919',
  },
  defaultBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#191919',
  },
  defaultBannerDesc: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  defaultBannerArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },

  // 7. 동네 커뮤니티 이야기 피드
  topicChipScroll: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  topicChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  topicChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  postList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  postTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  postAuthorMeta: {
    marginLeft: 8,
    flex: 1,
  },
  postAuthorName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#191919',
  },
  postTime: {
    fontSize: 11,
    color: '#8E8E93',
  },
  postCategoryBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  postCategoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  postContent: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
    marginBottom: 10,
  },
  postBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F7F8FA',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
  },
  postReadMore: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '700',
  },
  emptyPostPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  emptyPostPromptText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
    marginLeft: 8,
  },

  // 8. 안심 케어 시스템
  safeCareCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  safeCareLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  safeCareIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeCareTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#191919',
  },
  safeCareDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 15,
  },
  emptyDiscoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EAED',
    marginRight: 16,
    minWidth: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyDiscoverIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEE500',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emptyDiscoverTextWrap: {
    flex: 1,
  },
  emptyDiscoverTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#191919',
  },
  emptyDiscoverSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
});
