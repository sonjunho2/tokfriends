// apps/mobile/src/screens/main/HomeScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { tokens } from '../../theme/tokens';
import {
  UserAvatar,
  GlobalBottomSheet,
  EmptyStateView,
} from '../../components/common';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { checkAndConfirmActionPoint } from '../../utils/pointPolicyHelper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MATCH_CARD_WIDTH = SCREEN_WIDTH - 36;
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

// 2. 오늘의 추천 인연 기본 데이터 (갤러리 9장 완비)
const DEFAULT_MATCH_USERS = [
  {
    id: 'user-match-1',
    name: '서연',
    age: 26,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
    location: '강남구 역삼동',
    distance: '1.2km',
    headline: '전시회랑 분위기 좋은 카페 투어 좋아하는 직장인입니다 ☕',
    bio: '주말에 가볍게 커피 한잔하면서 편안하게 이야기 나눌 동네 친구 찾아요! 성격은 밝고 이야기 잘 들어주는 편이에요 ✨',
    tags: ['☕ 카페 투어', '🎨 전시회', '🎵 인디음악'],
    status: 'online',
    isOnline: true,
    pointsPerMinute: 1500,
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600', isPrimary: true },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600' },
      { id: 'p3', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600' },
      { id: 'p4', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600' },
      { id: 'p5', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600' },
      { id: 'p6', url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600' },
      { id: 'p7', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600' },
      { id: 'p8', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600' },
      { id: 'p9', url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600' },
    ],
  },
  {
    id: 'user-match-2',
    name: '도현',
    age: 28,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600',
    location: '송파구 잠실동',
    distance: '2.5km',
    headline: '퇴근하고 러닝이나 헬스 함께할 메이트 구해요 🏃',
    bio: '운동과 맛있는 음식 좋아하는 긍정적인 사람입니다! 서로에게 좋은 에너지를 줄 수 있는 인연을 찾고 있어요.',
    tags: ['🏃 러닝', '💪 헬스', '🍣 오마카세'],
    status: 'live',
    isLive: true,
    pointsPerMinute: 1500,
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600', isPrimary: true },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600' },
      { id: 'p3', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600' },
      { id: 'p4', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600' },
    ],
  },
  {
    id: 'user-match-3',
    name: '유진',
    age: 25,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
    location: '서초구 반포동',
    distance: '3.1km',
    headline: '강아지 산책이나 한강 피크닉 같이 가요 🐶',
    bio: '골든리트리버 키우고 있어요. 동물 좋아하시는 분 환영합니다! 주말 힐링 소통 좋아해요.',
    tags: ['🐶 반려견', '🌿 피크닉', '📸 사진촬영'],
    status: 'online',
    isOnline: true,
    pointsPerMinute: 1500,
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600', isPrimary: true },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600' },
      { id: 'p3', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600' },
    ],
  },
];

// 3. 동네 커뮤니티 기본 피드 데이터
const DEFAULT_COMMUNITY_POSTS = [
  {
    id: 'post-def-1',
    title: '역삼역 근처에 조용하고 분위기 좋은 북카페 있을까요?',
    content: '주말에 책 읽으면서 작업할 만한 콘센트 많은 카페 추천 부탁드려요! 디저트도 맛있으면 더 좋아요 🍰',
    authorName: '소희',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    authorRegion: '역삼1동',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    likesCount: 24,
    commentsCount: 9,
    topicName: '동네질문',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600',
  },
  {
    id: 'post-def-2',
    title: '오늘 저녁 양재천 산책길 노을 정말 예쁘네요 🌅',
    content: '바람도 선선하고 걷기 딱 좋은 날씨예요. 오늘 하루 다들 고생 많으셨습니다!',
    authorName: '준혁',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    authorRegion: '양재동',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    likesCount: 38,
    commentsCount: 14,
    topicName: '일상소통',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
  },
  {
    id: 'post-def-3',
    title: '주말 오전 배드민턴이나 테니스 가볍게 치실 분 구해요!',
    content: '초보자도 대환영입니다. 땀 흘리고 시원한 이온음료 한잔해요 🏸',
    authorName: '태우',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    authorRegion: '서초동',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    likesCount: 19,
    commentsCount: 7,
    topicName: '취미모임',
    imageUrl: null,
  },
];

export default function HomeScreen({ navigation }) {
  const { user: authUser } = useAuth();

  // 상태 관리
  const [liveRooms, setLiveRooms] = useState(DEFAULT_LIVES);
  const [matchUsers, setMatchUsers] = useState(DEFAULT_MATCH_USERS);
  const [communityPosts, setCommunityPosts] = useState(DEFAULT_COMMUNITY_POSTS);
  const [myPoints, setMyPoints] = useState(1250);
  const [refreshing, setRefreshing] = useState(false);

  // 전역 바텀 시트 상태 (1단계 GlobalBottomSheet)
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // 데이터 로드
  const loadHomeData = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    try {
      const [discoverRes, liveRes, postsRes, balanceRes] = await Promise.allSettled([
        apiClient.getDiscover(),
        apiClient.getLiveRooms(),
        apiClient.getPosts({ take: 5 }),
        apiClient.getPointBalance(),
      ]);

      // 1. 추천 인연
      if (discoverRes.status === 'fulfilled' && Array.isArray(discoverRes.value) && discoverRes.value.length > 0) {
        const mapped = discoverRes.value.map((u) => {
          const profile = u?.profile || {};
          return {
            id: u.id,
            name: profile.nickname || u.displayName || '회원',
            age: typeof u.age === 'number' ? u.age : 26,
            avatar: profile.avatarUri || u.avatar || null,
            location: [u.region1, u.region2].filter(Boolean).join(' ') || '동네 이웃',
            distance: u.distance ? `${u.distance}km` : '1.5km',
            headline: profile.headline || '새로운 인연을 기다려요 ✨',
            bio: profile.bio || profile.headline || '반가워요!',
            tags: profile.interests || ['☕ 커피', '🎵 음악', '💬 수다'],
            status: profile.lastSeenAt ? 'online' : 'offline',
            isOnline: Boolean(profile.lastSeenAt),
            photos: Array.isArray(u.photos) && u.photos.length > 0 ? u.photos : (profile.avatarUri ? [{ id: 'p1', url: profile.avatarUri, isPrimary: true }] : []),
            pointsPerMinute: 1500,
          };
        });
        setMatchUsers(mapped);
      }

      // 2. 실시간 라이브
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
              hostName: r.host?.displayName || r.hostName || '호스트',
              hostAvatar: r.host?.avatarUrl || r.hostAvatar,
              coverUri: r.coverImage || r.coverUri || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
              tag: r.category || '라이브',
            }))
          );
        }
      }

      // 3. 커뮤니티 피드
      if (postsRes.status === 'fulfilled') {
        const posts = Array.isArray(postsRes.value?.items)
          ? postsRes.value.items
          : Array.isArray(postsRes.value)
          ? postsRes.value
          : [];
        if (posts.length > 0) {
          setCommunityPosts(
            posts.map((p) => ({
              id: p.id,
              title: p.title || p.content?.slice(0, 30) || '동네 이야기',
              content: p.content || '',
              authorName: p.author?.displayName || '이웃',
              authorAvatar: p.author?.avatarUrl || p.author?.profile?.avatarUri,
              authorRegion: p.author?.region || '우리동네',
              createdAt: p.createdAt || new Date().toISOString(),
              likesCount: p.likesCount || p.likeCount || 0,
              commentsCount: p.commentsCount || p.commentCount || 0,
              topicName: p.topic?.name || '동네소통',
              imageUrl: p.images?.[0] || p.imageUrl || null,
            }))
          );
        }
      }

      // 4. 포인트 잔액
      if (balanceRes.status === 'fulfilled' && balanceRes.value?.balance !== undefined) {
        setMyPoints(Number(balanceRes.value.balance));
      }
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

  // 카드 터치 시 바텀 시트 열기
  const handleOpenBottomSheet = (user) => {
    setSelectedUser(user);
    setBottomSheetVisible(true);
  };

  // 원터치 1:1 대화 시작
  const handleStartChat = (targetUser) => {
    if (!targetUser?.id) return;
    checkAndConfirmActionPoint({
      actionType: 'chatRoomCreate',
      actionName: '1:1 대화방 개설',
      navigation,
      onConfirm: async () => {
        try {
          const room = await apiClient.ensureDirectRoom({ targetUserId: targetUser.id });
          const roomId = room?.id || room?._id;
          if (roomId) {
            setBottomSheetVisible(false);
            navigation.navigate('Chat', {
              screen: 'ChatRoom',
              params: {
                id: roomId,
                room,
                user: {
                  id: targetUser.id,
                  name: targetUser.name,
                  avatar: targetUser.avatar,
                  headline: targetUser.headline,
                },
              },
            });
          }
        } catch (e) {
          Alert.alert('안내', e?.message || '대화방을 생성할 수 없습니다.');
        }
      },
    });
  };

  // 1:1 다이렉트 통화 신청
  const handleCallUser = (targetUser) => {
    Alert.alert(
      '1:1 다이렉트 통화',
      `${targetUser.name}님에게 통화를 연결하시겠습니까?\n(분당 1,500P가 소진됩니다)`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '통화 연결',
          onPress: () => {
            setBottomSheetVisible(false);
            Alert.alert('통화 연결 중', `${targetUser.name}님의 응답을 기다리고 있습니다... 📞`);
          },
        },
      ]
    );
  };

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
  // 1. 상단 유저 헤더 & 포인트 카드 렌더링
  // =================================================================
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 좌측: 로고 & 내 프로필 무지개 링 아바타 */}
      <View style={styles.headerLeftCol}>
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>다가온</Text>
          <View style={styles.logoSparkleDot} />
        </View>

        <TouchableOpacity
          style={styles.profileRow}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('My')}
        >
          {/* 스토리 무지개 링 아바타 */}
          <LinearGradient
            colors={tokens.colors.gradients.primaryPurple}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.storyRing}
          >
            <View style={styles.storyRingInner}>
              <UserAvatar
                uri={authUser?.profile?.avatarUri}
                name={authUser?.displayName || authUser?.profile?.nickname || '나'}
                size={34}
              />
            </View>
          </LinearGradient>
          <View style={styles.welcomeTextWrap}>
            <Text style={styles.welcomeName} numberOfLines={1}>
              {authUser?.displayName || authUser?.profile?.nickname || '회원'}님
            </Text>
            <Text style={styles.welcomeSub}>새로운 인연을 만나보세요 ✨</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 우측: 입체적인 골드 코인 뱃지 & 알림 */}
      <View style={styles.headerRightCol}>
        {/* 입체 골드 코인 뱃지 (🪙 1,250 ON >) */}
        <TouchableOpacity
          style={styles.goldCoinBadge}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Points')}
        >
          <LinearGradient
            colors={['#FFFBEB', '#FEF3C7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.goldCoinGradient}
          >
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.coinAmount}>{myPoints.toLocaleString()}</Text>
            <Text style={styles.coinUnit}>ON</Text>
            <Ionicons name="chevron-forward" size={13} color="#D97706" />
          </LinearGradient>
        </TouchableOpacity>

        {/* 알림 버튼 */}
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation.navigate('Notifications')}
          hitSlop={8}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-outline" size={22} color={tokens.colors.text} />
          <View style={styles.unreadDot} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // =================================================================
  // 2. 실시간 LIVE 프리뷰 섹션 (3:4 비율 오버레이 카드)
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
  // 3. 오늘의 추천 인연 섹션 (풀 블리드 매칭 카드)
  // =================================================================
  const renderMatchSection = () => (
    <View style={styles.sectionWrap}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>오늘의 추천 인연</Text>
          <Text style={styles.sectionEmoji}>💘</Text>
        </View>
        <Text style={styles.sectionSub}>내 주변 설레는 매칭</Text>
      </View>

      <FlatList
        data={matchUsers}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={false}
        snapToInterval={MATCH_CARD_WIDTH + 14}
        decelerationRate="fast"
        contentContainerStyle={styles.matchListContent}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.matchCard}
            activeOpacity={0.92}
            onPress={() => handleOpenBottomSheet(item)}
          >
            {/* 메인 프로필 인물 사진 */}
            <Image
              source={{ uri: item.photos?.[0]?.url || item.avatar }}
              style={styles.matchCardImage}
              resizeMode="cover"
            />

            {/* 좌상단 거리 뱃지 */}
            <View style={styles.matchTopBadgeRow}>
              <View style={styles.distanceBadge}>
                <Ionicons name="location-sharp" size={12} color="#FFFFFF" />
                <Text style={styles.distanceText}>{item.distance} · {item.location}</Text>
              </View>
              {item.isOnline && (
                <View style={styles.matchOnlineBadge}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.matchOnlineText}>지금 활동 중</Text>
                </View>
              )}
            </View>

            {/* 하단 딤드 그라데이션 정보 오버레이 */}
            <LinearGradient
              colors={tokens.colors.gradients.cardOverlay}
              style={styles.matchCardBottomOverlay}
            >
              <View style={styles.matchInfoCol}>
                <View style={styles.matchNameRow}>
                  <Text style={styles.matchName}>{item.name}</Text>
                  <Text style={styles.matchAge}>{item.age}</Text>
                </View>

                <Text style={styles.matchHeadline} numberOfLines={2}>
                  {item.headline || item.bio}
                </Text>

                {/* 취미/관심사 태그 칩 */}
                <View style={styles.matchTagsRow}>
                  {(item.tags || []).slice(0, 3).map((tag, tIdx) => (
                    <View key={tIdx} style={styles.matchTagChip}>
                      <Text style={styles.matchTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 우측 하단: 원터치 플로팅 코랄 핑크 액션 버튼 (💌 톡 / 📞 통화) */}
              <View style={styles.matchFloatingActions}>
                <TouchableOpacity
                  style={[styles.floatingActionBtn, styles.callBtn]}
                  activeOpacity={0.85}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleCallUser(item);
                  }}
                  hitSlop={4}
                >
                  <Ionicons name="call" size={17} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.floatingActionBtn, styles.chatBtn]}
                  activeOpacity={0.85}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleStartChat(item);
                  }}
                  hitSlop={4}
                >
                  <LinearGradient
                    colors={tokens.colors.gradients.primaryPurple}
                    style={styles.chatBtnGradient}
                  >
                    <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
                    <Text style={styles.chatBtnLabel}>톡</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  // =================================================================
  // 4. 동네 커뮤니티 실시간 피드 섹션 (Local Community Feed)
  // =================================================================
  const renderCommunitySection = () => (
    <View style={styles.sectionWrap}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>우리 동네 이야기 (실시간 HOT)</Text>
          <Text style={styles.sectionEmoji}>🌿</Text>
        </View>
        <TouchableOpacity
          style={styles.sectionMoreBtn}
          onPress={() => navigation.navigate('Community')}
          hitSlop={8}
        >
          <Text style={styles.sectionMoreText}>피드 더보기</Text>
          <Ionicons name="chevron-forward" size={14} color={tokens.colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.communityFeedList}>
        {communityPosts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={styles.communityCard}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('PostDetail', { post, postId: post.id })}
          >
            {/* 작성자 정보 헤더 */}
            <View style={styles.postAuthorRow}>
              <UserAvatar
                uri={post.authorAvatar}
                name={post.authorName}
                size={38}
              />
              <View style={styles.postAuthorMeta}>
                <View style={styles.postAuthorNameRow}>
                  <Text style={styles.postAuthorName}>{post.authorName}</Text>
                  <View style={styles.regionBadge}>
                    <Text style={styles.regionBadgeText}>{post.authorRegion}</Text>
                  </View>
                </View>
                <Text style={styles.postTimeText}>{formatTimeAgo(post.createdAt)}</Text>
              </View>

              <View style={styles.topicBadge}>
                <Text style={styles.topicBadgeText}>#{post.topicName}</Text>
              </View>
            </View>

            {/* 본문 텍스트 */}
            <Text style={styles.postTitle} numberOfLines={1}>
              {post.title}
            </Text>
            {post.content ? (
              <Text style={styles.postBody} numberOfLines={2}>
                {post.content}
              </Text>
            ) : null}

            {/* 사진 썸네일 (있을 경우) */}
            {post.imageUrl && (
              <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
            )}

            {/* 하단 반응 (좋아요 / 댓글) */}
            <View style={styles.postFooterRow}>
              <View style={styles.reactionGroup}>
                <View style={styles.reactionItem}>
                  <Ionicons name="heart-outline" size={15} color={tokens.colors.primary} />
                  <Text style={styles.reactionText}>{post.likesCount}</Text>
                </View>
                <View style={styles.reactionItem}>
                  <Ionicons name="chatbubble-outline" size={14} color={tokens.colors.textTertiary} />
                  <Text style={styles.reactionText}>{post.commentsCount}</Text>
                </View>
              </View>

              <Text style={styles.joinTalkText}>대화 참여하기 ›</Text>
            </View>
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
            {/* 1. 실시간 LIVE 프리뷰 섹션 */}
            {renderLiveSection()}

            {/* 2. 오늘의 추천 인연 섹션 */}
            {renderMatchSection()}

            {/* 3. 동네 커뮤니티 실시간 피드 섹션 */}
            {renderCommunitySection()}

            {/* 하단 여백 (하단 탭 바 높이 고려) */}
            <View style={{ height: 90 }} />
          </View>
        )}
      />

      {/* 전역 바텀 시트 (카드 터치 시 열림) */}
      <GlobalBottomSheet
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        user={selectedUser}
        onCallVoice={handleCallUser}
        onCallVideo={handleCallUser}
        onStartChat={handleStartChat}
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

  // 1. 헤더 스타일
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: tokens.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
  },
  headerLeftCol: {
    gap: 6,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.8,
    color: tokens.colors.text,
  },
  logoSparkleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.primary,
    marginBottom: 8,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tokens.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.primary,
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
    borderWidth: 1,
    borderColor: '#FFFFFF',
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

  // 3. 오늘의 추천 인연 섹션 스타일
  matchListContent: {
    paddingHorizontal: 18,
    gap: 14,
  },
  matchCard: {
    width: MATCH_CARD_WIDTH,
    height: 380,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: tokens.colors.surfaceSecondary,
    ...tokens.shadows.card,
  },
  matchCardImage: {
    width: '100%',
    height: '100%',
  },
  matchTopBadgeRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: tokens.radius.full,
    gap: 4,
  },
  distanceText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  matchOnlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: tokens.radius.full,
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  matchOnlineText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  matchCardBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 48,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  matchInfoCol: {
    flex: 1,
    marginRight: 12,
  },
  matchNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 4,
  },
  matchName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  matchAge: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
    fontWeight: '600',
  },
  matchHeadline: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  matchTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  matchTagChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: tokens.radius.full,
  },
  matchTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  matchFloatingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingActionBtn: {
    borderRadius: tokens.radius.full,
    overflow: 'hidden',
    ...tokens.shadows.card,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBtn: {
    borderRadius: tokens.radius.full,
  },
  chatBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: tokens.radius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  chatBtnLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // 4. 동네 커뮤니티 피드 스타일
  communityFeedList: {
    paddingHorizontal: 18,
    gap: 12,
  },
  communityCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.colors.borderLight,
    ...tokens.shadows.soft,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAuthorMeta: {
    flex: 1,
    marginLeft: 10,
  },
  postAuthorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postAuthorName: {
    ...tokens.typography.h3,
    fontSize: 14,
  },
  regionBadge: {
    backgroundColor: tokens.colors.surfaceSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  regionBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  postTimeText: {
    ...tokens.typography.caption,
    color: tokens.colors.textTertiary,
    marginTop: 2,
  },
  topicBadge: {
    backgroundColor: tokens.colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: tokens.radius.full,
  },
  topicBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  postTitle: {
    ...tokens.typography.h3,
    fontSize: 15,
    marginBottom: 4,
  },
  postBody: {
    ...tokens.typography.body2,
    color: tokens.colors.textSecondary,
    lineHeight: 19,
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 160,
    borderRadius: tokens.radius.md,
    marginBottom: 10,
  },
  postFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: tokens.colors.borderLight,
    paddingTop: 10,
    marginTop: 4,
  },
  reactionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  joinTalkText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
});
