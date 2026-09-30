// src/screens/main/HomeScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import Card from '../../components/Card';
import Avatar from '../../components/Avatar';
import { apiClient } from '../../api/client';

const GRID = [
  { key: '전체', label: '전체' },
  { key: '20대', label: '20대' },
  { key: '30대', label: '30대' },
  { key: '40대이상', label: '40대이상' },
];

const CARD_H = 200;

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
    bio: profile?.bio || profile?.headline || undefined,
    title: profile?.headline || '프로필',
  };
}

export default function HomeScreen({ navigation }) {
  const [leftSec, setLeftSec] = useState(30 * 60);
  const [idxNew, setIdxNew] = useState(0);
  const [idxBest, setIdxBest] = useState(0);
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [communityTopics, setCommunityTopics] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [liveRooms, setLiveRooms] = useState([]);
  const [myPoints, setMyPoints] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setLeftSec((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const leftStr = useMemo(() => {
    const m = Math.floor(leftSec / 60);
    const s = String(leftSec % 60).padStart(2, '0');
    return `${m}분 ${s}초`;
  }, [leftSec]);

  // 배너 자동 롤링
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
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

        if (!active) return;

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
          setLiveRooms(rooms.filter((r) => r.status === 'ACTIVE' || r.status === 'LIVE' || !r.status));
        }

        if (balanceResult.status === 'fulfilled' && balanceResult.value?.balance !== undefined) {
          setMyPoints(Number(balanceResult.value.balance));
        }
      } catch {
        // silent fallback
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const len = discoverUsers.length;
    if (len === 0) return;

    const interval = setInterval(() => {
      setIdxNew((prev) => (prev + 1) % len);
      setIdxBest((prev) => (prev + 1) % len);
    }, 4500);

    return () => clearInterval(interval);
  }, [discoverUsers.length]);

  const newItem =
    discoverUsers.length > 0
      ? discoverUsers[idxNew % discoverUsers.length]
      : null;

  const bestItem =
    discoverUsers.length > 0
      ? discoverUsers[(idxBest + 1) % discoverUsers.length]
      : null;

  const handleHighlightPress = (item) => {
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
        title: item.title,
        bio: item.bio,
        avatar: item.avatar,
        coverImage: item.avatar,
        age: item.age,
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
      {/* 상단 앱바: 브랜드 로고 + 내 포인트 잔액 칩 + 빠른 액션 */}
      <View style={styles.appbar}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>다가온</Text>
          <View style={styles.brandDot} />
        </View>
        <View style={styles.appbarRightActions}>
          {/* 내 포인트 칩 */}
          <TouchableOpacity
            style={styles.pointChip}
            onPress={() => navigation.navigate('Shop')}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={13} color="#F59E0B" />
            <Text style={styles.pointChipText}>{myPoints.toLocaleString()}P</Text>
          </TouchableOpacity>

          <TouchableOpacity
            hitSlop={8}
            style={styles.appbarIconBtn}
            onPress={() => navigation.navigate('HotRecommend', { openFilter: true })}
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 상단 프로모션/광고 배너 (동적 배너 or 이벤트 배너) */}
        {currentBanner ? (
          <TouchableOpacity
            style={styles.adBannerCard}
            activeOpacity={0.9}
            onPress={() => handleBannerPress(currentBanner)}
          >
            {currentBanner.imageUrl ? (
              <Image source={{ uri: currentBanner.imageUrl }} style={styles.adBannerImage} />
            ) : null}
            <View style={styles.adBannerOverlay}>
              <View style={styles.adBadgeRow}>
                <View style={styles.adBadge}>
                  <Text style={styles.adBadgeText}>EVENT</Text>
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
          <Card style={styles.greenCard}>
            <View style={{ paddingRight: 110 }}>
              <View style={styles.greenTagRow}>
                <View style={styles.greenBadge}>
                  <Text style={styles.greenBadgeTxt}>EVENT</Text>
                </View>
                <Text style={styles.greenTitle}>오직 첫 가입자만!</Text>
              </View>
              <Text style={styles.greenDesc}>
                30분 내 프로필 완성 시{'\n'}50포인트 즉시 지급
              </Text>
            </View>
            <TouchableOpacity style={styles.timerBtn} activeOpacity={0.88}>
              <Text style={styles.timerTxt}>{leftStr}</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </Card>
        )}

        {/* HOT 실시간 라이브 방송 섹션 */}
        {liveRooms.length > 0 && (
          <View style={styles.liveSection}>
            <View style={styles.liveSectionHeader}>
              <View style={styles.liveTitleRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveSectionTitle}>실시간 LIVE</Text>
                <View style={styles.liveCountBadge}>
                  <Text style={styles.liveCountText}>{liveRooms.length}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Live')}
                activeOpacity={0.8}
              >
                <Text style={styles.link}>전체보기 ›</Text>
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
                  activeOpacity={0.88}
                  onPress={() =>
                    navigation.navigate('Live', {
                      screen: 'LiveRoom',
                      params: {
                        roomId: room.id,
                        roomTitle: room.title,
                        hostName: room.host?.displayName || '호스트',
                        hostAvatar: room.host?.avatarUrl,
                      },
                    })
                  }
                >
                  <View style={styles.liveThumbContainer}>
                    {room.thumbnailUrl ? (
                      <Image source={{ uri: room.thumbnailUrl }} style={styles.liveThumb} />
                    ) : (
                      <View style={styles.liveThumbPlaceholder}>
                        <Ionicons name="radio" size={32} color="#EF4444" />
                      </View>
                    )}
                    <View style={styles.liveBadgeTop}>
                      <View style={styles.liveOnAirPill}>
                        <Text style={styles.liveOnAirText}>ON AIR</Text>
                      </View>
                      <View style={styles.liveViewerPill}>
                        <Ionicons name="eye" size={11} color="#FFFFFF" />
                        <Text style={styles.liveViewerText}>
                          {room.viewerCount || 0}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.liveCardMeta}>
                    <Text style={styles.liveCardTitle} numberOfLines={1}>
                      {room.title || '즐거운 실시간 방송'}
                    </Text>
                    <Text style={styles.liveHostName} numberOfLines={1}>
                      {room.host?.displayName || '호스트'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 무료 포인트 충전소 배너 */}
        <TouchableOpacity
          style={styles.rewardBanner}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('Shop')}
        >
          <View style={styles.rewardBannerLeft}>
            <View style={styles.rewardBadgeIcon}>
              <Ionicons name="gift" size={16} color="#D97706" />
            </View>
            <View>
              <Text style={styles.rewardBannerTitle}>매일 무료 포인트 충전소</Text>
              <Text style={styles.rewardBannerDesc}>
                출석체크 +5P · 광고시청 +10P · 친구초대 +50P
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#D97706" />
        </TouchableOpacity>

        {/* 빠른 필터 캡슐 탭 바 */}
        <View style={styles.filterChipRow}>
          {GRID.map((g) => (
            <TouchableOpacity
              key={g.key}
              style={styles.filterChip}
              activeOpacity={0.85}
              onPress={() => {
                navigation.navigate('HotRecommend', { selected: g.label });
              }}
            >
              <Text style={styles.filterChipText}>{g.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 나에게 관심있는 친구들 바로가기 카드 */}
        <Card style={styles.wideCard}>
          <View style={styles.wideRow}>
            <View>
              <Text style={styles.wideTitle}>나에게 관심있는 친구들</Text>
              <Text style={styles.wideSub}>내 프로필을 방문하고 하트를 보낸 친구</Text>
            </View>
            <TouchableOpacity
              style={styles.linkPill}
              onPress={() => {
                const parentNav = navigation.getParent?.();
                if (parentNav && typeof parentNav.navigate === 'function') {
                  parentNav.navigate('Chat', { screen: 'ChatsMain', params: { initialSeg: '신규' } });
                } else if (typeof navigation.navigate === 'function') {
                  navigation.navigate('Chat');
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.linkText}>확인하기 ›</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* 새로운 친구 / 추천 친구 듀얼 쇼케이스 */}
        <View style={styles.dualRow}>
          {/* 새로운 친구 */}
          <View style={styles.dualCol}>
            <View style={styles.dualHeader}>
              <Text style={styles.dualTitle}>새로운 친구</Text>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => handleHighlightPress(newItem)}
            >
              <Card style={[styles.dualCard, { height: CARD_H }]}>
                {newItem?.avatar ? (
                  <View style={styles.cardImageContainer}>
                    <Image source={{ uri: newItem.avatar }} style={styles.image} />
                    <View style={styles.imageScrim} />
                    <View style={styles.cardOverlayMeta}>
                      <Text style={styles.cardOverlayName} numberOfLines={1}>
                        {newItem.name}
                        {newItem.age ? `, ${newItem.age}` : ''}
                      </Text>
                      <Text style={styles.cardOverlayLoc} numberOfLines={1}>
                        {newItem.location}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.placeholderCardContent}>
                    <Avatar size={54} name={newItem?.name || '새친구'} />
                    <Text style={styles.placeholderCardName}>{newItem?.name || '새로운 친구'}</Text>
                    <Text style={styles.placeholderCardLoc}>{newItem?.location || '방금 가입'}</Text>
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          </View>

          {/* 추천 친구 */}
          <View style={styles.dualCol}>
            <View style={styles.dualHeader}>
              <Text style={styles.dualTitle}>추천 친구</Text>
              <View style={styles.bestBadge}>
                <Text style={styles.bestBadgeText}>HOT</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => handleHighlightPress(bestItem)}
            >
              <Card style={[styles.dualCard, { height: CARD_H }]}>
                {bestItem?.avatar ? (
                  <View style={styles.cardImageContainer}>
                    <Image source={{ uri: bestItem.avatar }} style={styles.image} />
                    <View style={styles.imageScrim} />
                    <View style={styles.cardOverlayMeta}>
                      <Text style={styles.cardOverlayName} numberOfLines={1}>
                        {bestItem.name}
                        {bestItem.age ? `, ${bestItem.age}` : ''}
                      </Text>
                      <Text style={styles.cardOverlayLoc} numberOfLines={1}>
                        {bestItem.location}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.placeholderCardContent}>
                    <Avatar size={54} name={bestItem?.name || '추천'} />
                    <Text style={styles.placeholderCardName}>{bestItem?.name || '추천 친구'}</Text>
                    <Text style={styles.placeholderCardLoc}>{bestItem?.location || '매력적인 인연'}</Text>
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          </View>
        </View>

        {/* 커뮤니티 토픽 피드 섹션 */}
        <View style={styles.communitySection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>동네 토픽 이야기</Text>
              <Text style={styles.sectionSub}>다양한 관심사로 이웃과 소통해보세요</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleOpenCommunity()}
              activeOpacity={0.8}
            >
              <Text style={styles.link}>전체보기 ›</Text>
            </TouchableOpacity>
          </View>

          {/* 토픽 칩 리스트 */}
          {communityTopics.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topicChipScroll}
            >
              {communityTopics.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  style={styles.homeTopicChip}
                  onPress={() => handleOpenCommunity(topic.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.homeTopicChipText}>#{topic.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* 최근 게시글 미리보기 */}
          {recentPosts.length > 0 ? (
            <View style={styles.recentPostsList}>
              {recentPosts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.postPreviewCard}
                  onPress={() => handleOpenCommunity(post.topicId)}
                  activeOpacity={0.85}
                >
                  <View style={styles.previewTop}>
                    <Avatar
                      size={28}
                      name={post.author?.name}
                      uri={post.author?.avatar}
                    />
                    <Text style={styles.previewAuthor}>{post.author?.name}</Text>
                    <View style={styles.previewTopicBadge}>
                      <Text style={styles.previewTopicText}>#{post.topicName}</Text>
                    </View>
                  </View>
                  <Text style={styles.previewContent} numberOfLines={2}>
                    {post.content}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.emptyPostPrompt}
              onPress={() => handleOpenCommunity()}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
              <Text style={styles.emptyPostPromptText}>
                첫 이야기를 남기고 이웃들과 소통을 시작해보세요!
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* 다가온 안심 서비스 안내 */}
        <Card style={styles.guideCard}>
          <View style={styles.guideHeader}>
            <View style={styles.guideShieldIcon}>
              <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
            </View>
            <Text style={styles.guideTitle}>다가온 안심 케어 시스템</Text>
          </View>
          <Text style={styles.guideSub}>
            철저한 본인 인증과 24시간 실시간 AI 모니터링으로 안전하고 깨끗한 소통 문화를 지원합니다.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  appbar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  appbarRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pointChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  appbarIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 광고 배너 스타일
  adBannerCard: {
    marginHorizontal: 16,
    marginTop: 12,
    height: 120,
    borderRadius: 16,
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
    padding: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  adBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  adBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  bannerPageBadge: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  bannerPageText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  adBannerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  adBannerDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  // 실시간 라이브 섹션 스타일
  liveSection: {
    marginTop: 20,
  },
  liveSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  liveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  liveCountBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
  },
  liveScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  liveCard: {
    width: 160,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  liveThumbContainer: {
    width: '100%',
    height: 110,
    backgroundColor: '#1E293B',
    position: 'relative',
  },
  liveThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  liveThumbPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  liveBadgeTop: {
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
  liveCardMeta: {
    padding: 10,
  },
  liveCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  liveHostName: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  greenCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
    borderWidth: 1,
    padding: 16,
    position: 'relative',
  },
  greenTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  greenBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  greenBadgeTxt: {
    color: '#15803D',
    fontWeight: '800',
    fontSize: 10,
  },
  greenTitle: {
    color: '#166534',
    fontWeight: '800',
    fontSize: 13,
  },
  greenDesc: {
    color: '#14532D',
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 21,
  },
  timerBtn: {
    position: 'absolute',
    right: 14,
    top: 18,
    backgroundColor: '#16A34A',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  rewardBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  rewardBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rewardBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  rewardBannerDesc: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  filterChip: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  wideCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
  },
  wideRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wideTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  wideSub: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 3,
  },
  linkPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  link: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  dualRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  dualCol: {
    flex: 1,
  },
  dualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  dualTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  newBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  bestBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bestBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  dualCard: {
    overflow: 'hidden',
    padding: 0,
  },
  cardImageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  cardOverlayMeta: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  cardOverlayName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardOverlayLoc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  placeholderCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
  },
  placeholderCardName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  placeholderCardLoc: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  communitySection: {
    marginTop: 22,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  topicChipScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  homeTopicChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  homeTopicChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  recentPostsList: {
    gap: 8,
    marginTop: 2,
  },
  postPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  previewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  previewAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  previewTopicBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  previewTopicText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  previewContent: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  emptyPostPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyPostPromptText: {
    flex: 1,
    fontSize: 13,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  guideCard: {
    marginHorizontal: 16,
    marginTop: 18,
    padding: 16,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guideShieldIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  guideSub: {
    marginTop: 6,
    color: colors.textTertiary,
    fontSize: 12,
    lineHeight: 18,
  },
});
