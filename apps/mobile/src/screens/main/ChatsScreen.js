// apps/mobile/src/screens/main/ChatsScreen.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  TextInput,
  Platform,
  Animated,
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
import CreateRoomModal from '../../components/chat/CreateRoomModal';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { checkAndConfirmActionPoint } from '../../utils/pointPolicyHelper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.36; // 세로형 1:1.36 황금 비율

// 1열 가로 스크롤 캡슐 필터 목록
const CAPSULE_FILTERS = [
  '전체',
  '🔥 HOT추천',
  '🟢 지금 접속중',
  '📍 내 주변',
  '#운동',
  '#카페',
  '#반려견',
  '#음악',
  '#여행',
  '#사진',
];

// 감성적인 기본 인연 카드 데이터 (10명, 9장 갤러리 지원)
const FALLBACK_DISCOVER_USERS = [
  {
    id: 'user-disc-1',
    name: '수아',
    age: 24,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
    location: '강남구 역삼동',
    distanceKm: 0.8,
    distanceLabel: '800m',
    headline: '디저트 카페 탐방 좋아해요 🍰',
    bio: '주말에 소소하게 커피 마시며 이야기 나눌 편안한 친구 찾고 있어요! 음악과 사진 촬영도 즐겨요 ✨',
    tags: ['#카페', '#디저트', '#음악'],
    status: 'online',
    isOnline: true,
    isHot: true,
    pointsPerMinute: 1500,
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600', isPrimary: true },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600' },
      { id: 'p3', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600' },
      { id: 'p4', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600' },
      { id: 'p5', url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600' },
    ],
  },
  {
    id: 'user-disc-2',
    name: '도현',
    age: 28,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600',
    location: '서초구 반포동',
    distanceKm: 1.2,
    distanceLabel: '1.2km',
    headline: '한강 러닝이나 헬스 같이 가요 🏃',
    bio: '퇴근 후 운동하고 맛있는 저녁 먹는 걸 좋아합니다. 밝고 에너지 넘치는 분과 소통하고 싶어요!',
    tags: ['#운동', '#러닝', '#헬스'],
    status: 'online',
    isOnline: true,
    isHot: true,
    pointsPerMinute: 1500,
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600', isPrimary: true },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600' },
      { id: 'p3', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600' },
    ],
  },
  {
    id: 'user-disc-3',
    name: '유진',
    age: 26,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
    location: '송파구 잠실동',
    distanceKm: 1.5,
    distanceLabel: '1.5km',
    headline: '강아지랑 산책 다니는 거 좋아해요 🐶',
    bio: '골든리트리버 3살 키우고 있어요. 반려동물 사랑하시는 분 언제든 환영합니다!',
    tags: ['#반려견', '#산책', '#동물'],
    status: 'online',
    isOnline: true,
    isHot: false,
    pointsPerMinute: 1500,
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600', isPrimary: true },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600' },
      { id: 'p3', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600' },
    ],
  },
  {
    id: 'user-disc-4',
    name: '민우',
    age: 29,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
    location: '마포구 연남동',
    distanceKm: 2.1,
    distanceLabel: '2.1km',
    headline: '어쿠스틱 기타 & 인디음악 좋아해요 🎸',
    bio: '소소하게 버스킹도 하고 라이브 방송도 진행합니다. 음악 얘기 나누실 분 편하게 연락주세요!',
    tags: ['#음악', '#기타', '#공연'],
    status: 'live',
    isLive: true,
    isHot: true,
    pointsPerMinute: 1500,
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', isPrimary: true },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600' },
    ],
  },
  {
    id: 'user-disc-5',
    name: '지우',
    age: 25,
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600',
    location: '강남구 논현동',
    distanceKm: 0.6,
    distanceLabel: '600m',
    headline: '필름 카메라로 일상 담기 📸',
    bio: '예쁜 골목길 걷는 것 좋아해요. 서로 예쁜 사진 찍어주며 좋은 추억 만들어봐요.',
    tags: ['#사진', '#필름', '#전시'],
    status: 'online',
    isOnline: true,
    isHot: false,
    pointsPerMinute: 1500,
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600', isPrimary: true },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600' },
    ],
  },
  {
    id: 'user-disc-6',
    name: '준혁',
    age: 27,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600',
    location: '성동구 성수동',
    distanceKm: 2.8,
    distanceLabel: '2.8km',
    headline: '국내외 배낭여행 마니아 ✈️',
    bio: '새로운 도시와 새로운 사람을 만나는 걸 가장 좋아합니다. 여행 이야기 나누며 친해져요!',
    tags: ['#여행', '#맛집', '#캠핑'],
    status: 'offline',
    isOnline: false,
    isHot: true,
    pointsPerMinute: 1500,
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600', isPrimary: true },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600' },
    ],
  },
  {
    id: 'user-disc-7',
    name: '채원',
    age: 24,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600',
    location: '서초구 양재동',
    distanceKm: 1.8,
    distanceLabel: '1.8km',
    headline: '양재천 자전거 라이딩 메이트 구해요 🚲',
    bio: '선선한 저녁에 따릉이 타는 게 취미입니다. 긍정적이고 즐거운 소통 좋아해요!',
    tags: ['#운동', '#라이딩', '#산책'],
    status: 'online',
    isOnline: true,
    isHot: false,
    pointsPerMinute: 1500,
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600', isPrimary: true },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600' },
    ],
  },
  {
    id: 'user-disc-8',
    name: '태우',
    age: 30,
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600',
    location: '강남구 대치동',
    distanceKm: 1.1,
    distanceLabel: '1.1km',
    headline: '테니스 & 배드민턴 입문자 환영 🏸',
    bio: '주말 오전에 같이 땀 흘리고 브런치 드실 분 찾고 있어요. 직장인 취미 공유해요!',
    tags: ['#운동', '#테니스', '#브런치'],
    status: 'online',
    isOnline: true,
    isHot: false,
    pointsPerMinute: 1500,
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600', isPrimary: true },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600' },
    ],
  },
];

// 기본 대화 목록 데이터
const DEFAULT_CHATS = [
  {
    id: 'chat-mock-1',
    title: '서연',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    lastMessage: '네! 주말에 역삼역 근처 카페에서 봬요 ✨',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    unreadCount: 2,
    isOnline: true,
    counterpart: { id: 'u-seoyeon', name: '서연' },
  },
  {
    id: 'chat-mock-2',
    title: '도현',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
    lastMessage: '오늘 저녁 한강 러닝 코스 어떠세요?',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    unreadCount: 0,
    isOnline: true,
    counterpart: { id: 'u-dohyun', name: '도현' },
  },
  {
    id: 'chat-mock-3',
    title: '유진',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
    lastMessage: '사진 속 강아지가 너무 귀여워요 🐶',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    unreadCount: 0,
    isOnline: false,
    counterpart: { id: 'u-yujin', name: '유진' },
  },
];

export default function ChatsScreen({ navigation, route }) {
  const { user: authUser } = useAuth();

  // 1. 상단 세그먼트 탭 ('discover' | 'chats')
  const initialTab = route?.params?.tab === 'chats' ? 'chats' : 'discover';
  const [activeTab, setActiveTab] = useState(initialTab);

  // 2. 가로 1열 캡슐 필터 선택 상태
  const [selectedFilter, setSelectedFilter] = useState('전체');

  // 3. 인연 데이터 상태
  const [discoverUsers, setDiscoverUsers] = useState(FALLBACK_DISCOVER_USERS);
  const [refreshing, setRefreshing] = useState(false);

  // 4. 대화 목록 상태
  const [chats, setChats] = useState(DEFAULT_CHATS);
  const [chatSearchText, setChatSearchText] = useState('');

  // 5. 전역 바텀 시트 (GlobalBottomSheet)
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // 6. 대화방 개설 모달 (CreateRoomModal)
  const [createRoomModalVisible, setCreateRoomModalVisible] = useState(false);

  // 레이더 펄스 애니메이션
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // 데이터 로드
  const loadData = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    try {
      const [discoverRes, chatsRes] = await Promise.allSettled([
        apiClient.getDiscover(),
        apiClient.getChats(),
      ]);

      if (discoverRes.status === 'fulfilled' && Array.isArray(discoverRes.value) && discoverRes.value.length > 0) {
        const mapped = discoverRes.value.map((u, idx) => {
          const profile = u?.profile || {};
          const fallback = FALLBACK_DISCOVER_USERS[idx % FALLBACK_DISCOVER_USERS.length];
          return {
            id: u.id || fallback.id,
            name: profile.nickname || u.displayName || fallback.name,
            age: typeof u.age === 'number' ? u.age : fallback.age,
            avatar: profile.avatarUri || u.avatar || fallback.avatar,
            location: [u.region1, u.region2].filter(Boolean).join(' ') || fallback.location,
            distanceKm: u.distanceKm || fallback.distanceKm,
            distanceLabel: u.distanceKm ? `${u.distanceKm}km` : fallback.distanceLabel,
            headline: profile.headline || profile.bio || fallback.headline,
            bio: profile.bio || profile.headline || fallback.bio,
            tags: profile.interests?.length > 0 ? profile.interests.map((t) => `#${t}`) : fallback.tags,
            status: profile.lastSeenAt ? 'online' : fallback.status,
            isOnline: Boolean(profile.lastSeenAt) || fallback.isOnline,
            isHot: idx % 3 === 0,
            pointsPerMinute: 1500,
            photos: Array.isArray(u.photos) && u.photos.length > 0
              ? u.photos
              : (profile.avatarUri ? [{ id: 'p1', url: profile.avatarUri, isPrimary: true }] : fallback.photos),
          };
        });
        setDiscoverUsers(mapped);
      }

      if (chatsRes.status === 'fulfilled' && Array.isArray(chatsRes.value) && chatsRes.value.length > 0) {
        setChats(
          chatsRes.value.map((c) => ({
            id: c.id,
            title: c.title || c.counterpart?.displayName || '대화 상대',
            avatar: c.avatar || c.counterpart?.avatarUrl || null,
            lastMessage: c.lastMessage || '대화가 시작되었습니다.',
            lastMessageAt: c.lastMessageAt || new Date().toISOString(),
            unreadCount: c.unreadCount || 0,
            isOnline: Boolean(c.counterpart?.online),
            counterpart: c.counterpart || {},
          }))
        );
      }
    } catch {
      // 에러 발생 시 감성적인 기본 데이터 유지 (시스템 에러 노출 방지)
    } finally {
      if (refresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // 1열 필터링 적용된 인연 목록
  const filteredUsers = useMemo(() => {
    if (!discoverUsers || discoverUsers.length === 0) return [];

    switch (selectedFilter) {
      case '🔥 HOT추천':
        return discoverUsers.filter((u) => u.isHot || u.isLive);
      case '🟢 지금 접속중':
        return discoverUsers.filter((u) => u.isOnline);
      case '📍 내 주변':
        return [...discoverUsers].sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
      case '#운동':
      case '#카페':
      case '#반려견':
      case '#음악':
      case '#여행':
      case '#사진': {
        const keyword = selectedFilter.replace('#', '');
        return discoverUsers.filter((u) =>
          u.tags?.some((t) => t.includes(keyword)) ||
          u.headline?.includes(keyword) ||
          u.bio?.includes(keyword)
        );
      }
      case '전체':
      default:
        return discoverUsers;
    }
  }, [discoverUsers, selectedFilter]);

  // 카드 터치 시 GlobalBottomSheet 열기
  const handleOpenUserSheet = (user) => {
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
            navigation.navigate('ChatRoom', {
              id: roomId,
              room,
              user: {
                id: targetUser.id,
                name: targetUser.name,
                avatar: targetUser.avatar,
                headline: targetUser.headline,
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

  // =========================================================================
  // 1. 상단 세그먼트 탭 헤더
  // =========================================================================
  const renderTopSegment = () => (
    <View style={styles.topBar}>
      <View style={styles.segmentContainer}>
        {/* [⚡ 인연 찾기] 세그먼트 */}
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'discover' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('discover')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="flash"
            size={16}
            color={activeTab === 'discover' ? tokens.colors.primary : tokens.colors.textTertiary}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'discover' && styles.segmentTextActive,
            ]}
          >
            인연 찾기
          </Text>
          {activeTab === 'discover' && <View style={styles.activeSegmentIndicator} />}
        </TouchableOpacity>

        {/* [💬 내 대화] 세그먼트 */}
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'chats' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('chats')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="chatbubbles"
            size={16}
            color={activeTab === 'chats' ? tokens.colors.primary : tokens.colors.textTertiary}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'chats' && styles.segmentTextActive,
            ]}
          >
            내 대화
          </Text>
          {chats.some((c) => c.unreadCount > 0) && <View style={styles.chatBadgeDot} />}
          {activeTab === 'chats' && <View style={styles.activeSegmentIndicator} />}
        </TouchableOpacity>
      </View>

      {/* 우측 보조 액션 */}
      {activeTab === 'discover' ? (
        <TouchableOpacity
          style={styles.topIconBtn}
          onPress={() => navigation.navigate('HotRecommend')}
          hitSlop={8}
        >
          <Ionicons name="sparkles" size={20} color={tokens.colors.primary} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.topCreateChatBtn}
          onPress={() => setCreateRoomModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.topCreateChatText}>새 대화</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // =========================================================================
  // 2. 가로 1열 캡슐 필터 바
  // =========================================================================
  const renderCapsuleFilterBar = () => (
    <View style={styles.filterBarContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        {CAPSULE_FILTERS.map((filter) => {
          const isSelected = selectedFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.capsuleBtn,
                isSelected ? styles.capsuleBtnActive : styles.capsuleBtnInactive,
              ]}
              onPress={() => setSelectedFilter(filter)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.capsuleText,
                  isSelected ? styles.capsuleTextActive : styles.capsuleTextInactive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // =========================================================================
  // 3. 실시간 접속 레이더 배너 (Radar Pulse Banner)
  // =========================================================================
  const renderRadarBanner = () => (
    <View style={styles.radarBanner}>
      <LinearGradient
        colors={['#FFF1F4', '#F5F3FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.radarGradient}
      >
        <View style={styles.radarLeftGroup}>
          {/* 은은하게 핑을 쏘는 레이더 펄스 아이콘 */}
          <View style={styles.radarIconWrap}>
            <Animated.View
              style={[
                styles.radarPulseWave,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.25],
                    outputRange: [0.6, 0],
                  }),
                },
              ]}
            />
            <View style={styles.radarCenterDot} />
          </View>

          <View style={styles.radarTextCol}>
            <View style={styles.radarTitleRow}>
              <Text style={styles.radarTitle}>
                지금 내 주변 3km 이내 접속자 <Text style={styles.radarHighlight}>84명</Text>
              </Text>
              <View style={styles.radarOnlineDot} />
            </View>
            <Text style={styles.radarSub}>마음에 드는 프로필에 먼저 톡을 건네보세요 ✨</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.radarRefreshBtn}
          onPress={() => loadData({ refresh: true })}
          hitSlop={8}
        >
          <Ionicons name="refresh" size={15} color={tokens.colors.primary} />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  // =========================================================================
  // 4. 인연 매칭 2열 그리드 카드 렌더링
  // =========================================================================
  const renderMatchCard = ({ item }) => (
    <TouchableOpacity
      style={styles.matchCard}
      activeOpacity={0.92}
      onPress={() => handleOpenUserSheet(item)}
    >
      {/* 풀 블리드 프로필 사진 */}
      <Image source={{ uri: item.avatar }} style={styles.cardImage} resizeMode="cover" />

      {/* 좌상단: 실시간 상태 뱃지 (🟢 접속중 또는 📍 800m) */}
      <View style={styles.cardTopBadgeRow}>
        {item.isOnline ? (
          <View style={styles.statusBadgeOnline}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusBadgeText}>접속중</Text>
          </View>
        ) : (
          <View style={styles.statusBadgeDistance}>
            <Ionicons name="location-sharp" size={10} color="#FFFFFF" />
            <Text style={styles.statusBadgeText}>{item.distanceLabel}</Text>
          </View>
        )}
      </View>

      {/* 하단 딤드 그라데이션 오버레이 */}
      <LinearGradient
        colors={['transparent', 'rgba(15, 23, 42, 0.45)', 'rgba(15, 23, 42, 0.95)']}
        style={styles.cardBottomOverlay}
      >
        <View style={styles.cardInfoCol}>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.cardAge}>{item.age}</Text>
          </View>

          <Text style={styles.cardHeadline} numberOfLines={1}>
            {item.headline || item.bio}
          </Text>

          {item.tags?.[0] && (
            <View style={styles.cardTagChip}>
              <Text style={styles.cardTagText}>{item.tags[0]}</Text>
            </View>
          )}
        </View>

        {/* 우측 하단 플로팅 미니 버튼: 원터치 톡 / 통화 */}
        <TouchableOpacity
          style={styles.miniActionBtn}
          activeOpacity={0.85}
          onPress={(e) => {
            e.stopPropagation();
            handleStartChat(item);
          }}
          hitSlop={4}
        >
          <LinearGradient
            colors={tokens.colors.gradients.primaryPurple}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.miniActionGradient}
          >
            <Ionicons name="chatbubble-ellipses" size={15} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );

  // =========================================================================
  // 5. 내 대화방 목록 렌더링
  // =========================================================================
  const renderChatListItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      activeOpacity={0.85}
      onPress={() =>
        navigation.navigate('ChatRoom', {
          id: item.id,
          room: item,
          user: item.counterpart,
        })
      }
    >
      <UserAvatar
        uri={item.avatar}
        name={item.title}
        size="md"
        isOnline={item.isOnline}
      />
      <View style={styles.chatItemBody}>
        <View style={styles.chatItemHeader}>
          <Text style={styles.chatItemTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.chatItemTime}>
            {new Date(item.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.chatItemBottomRow}>
          <Text style={styles.chatItemLastMsg} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadCountBadge}>
              <Text style={styles.unreadCountText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. 상단 세그먼트 탭 */}
      {renderTopSegment()}

      {activeTab === 'discover' ? (
        <View style={{ flex: 1 }}>
          {/* 2. 가로 1열 캡슐 필터 바 */}
          {renderCapsuleFilterBar()}

          {/* 3. 실시간 접속 레이더 배너 */}
          {renderRadarBanner()}

          {/* 4. 인연 매칭 2열 그리드 리스트 */}
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            numColumns={2}
            renderItem={renderMatchCard}
            contentContainerStyle={styles.gridContentContainer}
            columnWrapperStyle={styles.gridColumnWrapper}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={Platform.OS === 'android'}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={7}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData({ refresh: true })}
                colors={[tokens.colors.primary]}
                tintColor={tokens.colors.primary}
              />
            }
            ListEmptyComponent={
              <EmptyStateView
                preset="search"
                title="주변의 새로운 인연을 찾고 있어요"
                description="현재 선택한 필터에 맞는 인연이 없습니다. 다른 필터를 둘러보세요!"
                ctaLabel="필터 초기화"
                onCtaPress={() => setSelectedFilter('전체')}
                style={{ marginTop: 40 }}
              />
            }
          />
        </View>
      ) : (
        /* 내 대화 탭 */
        <View style={{ flex: 1 }}>
          <FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            renderItem={renderChatListItem}
            contentContainerStyle={styles.chatsContentContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData({ refresh: true })}
                colors={[tokens.colors.primary]}
                tintColor={tokens.colors.primary}
              />
            }
            ListEmptyComponent={
              <EmptyStateView
                preset="chats"
                title="진행 중인 대화가 없습니다"
                description="마음에 드는 프로필에 먼저 인사를 건네보세요!"
                ctaLabel="인연 찾기 바로가기"
                onCtaPress={() => setActiveTab('discover')}
                style={{ marginTop: 60 }}
              />
            }
          />
        </View>
      )}

      {/* 전역 바텀 시트 (카드 터치 시 무전환 노출) */}
      <GlobalBottomSheet
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        user={selectedUser}
        onCallVoice={handleCallUser}
        onCallVideo={handleCallUser}
        onStartChat={handleStartChat}
      />

      {/* 대화방 개설 모달 */}
      <CreateRoomModal
        visible={createRoomModalVisible}
        onClose={() => setCreateRoomModalVisible(false)}
        onRoomCreated={(newRoom) => {
          loadData();
          if (newRoom?.id) {
            navigation.navigate('ChatRoom', {
              id: newRoom.id,
              room: newRoom,
              user: newRoom.counterpart,
            });
          }
        }}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },

  // 1. 상단 탭 스타일
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    backgroundColor: tokens.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
  },
  segmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: tokens.radius.full,
    gap: 5,
  },
  segmentBtnActive: {
    backgroundColor: tokens.colors.primaryLight,
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.textTertiary,
  },
  segmentTextActive: {
    color: tokens.colors.primary,
    fontWeight: '800',
  },
  activeSegmentIndicator: {
    display: 'none',
  },
  chatBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.primary,
    marginLeft: 2,
  },
  topIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tokens.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topCreateChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: tokens.radius.full,
    gap: 3,
    ...tokens.shadows.soft,
  },
  topCreateChatText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // 2. 가로 1열 캡슐 필터 바 스타일
  filterBarContainer: {
    backgroundColor: tokens.colors.surface,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  capsuleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7.5,
    borderRadius: tokens.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capsuleBtnActive: {
    backgroundColor: tokens.colors.primary,
    ...tokens.shadows.soft,
  },
  capsuleBtnInactive: {
    backgroundColor: tokens.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  capsuleText: {
    fontSize: 13,
  },
  capsuleTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  capsuleTextInactive: {
    color: tokens.colors.textSecondary,
    fontWeight: '600',
  },

  // 3. 실시간 접속 레이더 배너
  radarBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: tokens.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFE4EC',
    ...tokens.shadows.soft,
  },
  radarGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  radarLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  radarIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarPulseWave: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: tokens.colors.primary,
  },
  radarCenterDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tokens.colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  radarTextCol: {
    flex: 1,
  },
  radarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  radarTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  radarHighlight: {
    color: tokens.colors.primary,
    fontWeight: '900',
  },
  radarOnlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.status.online,
  },
  radarSub: {
    fontSize: 11,
    color: tokens.colors.textSecondary,
    marginTop: 1,
  },
  radarRefreshBtn: {
    padding: 6,
  },

  // 4. 인연 매칭 2열 그리드 스타일
  gridContentContainer: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: 12,
    paddingBottom: 90,
  },
  gridColumnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  matchCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: tokens.radius.card,
    overflow: 'hidden',
    backgroundColor: tokens.colors.surfaceSecondary,
    ...tokens.shadows.card,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardTopBadgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusBadgeOnline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: tokens.radius.full,
    gap: 4,
  },
  statusBadgeDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: tokens.radius.full,
    gap: 3,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.status.online,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  cardBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 36,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardInfoCol: {
    flex: 1,
    marginRight: 6,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 2,
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardAge: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  cardHeadline: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 4,
  },
  cardTagChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardTagText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },
  miniActionBtn: {
    borderRadius: 17,
    overflow: 'hidden',
    ...tokens.shadows.card,
  },
  miniActionGradient: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // 5. 내 대화방 리스트 스타일
  chatsContentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 90,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
    padding: 14,
    borderRadius: tokens.radius.card,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: tokens.colors.borderLight,
    ...tokens.shadows.soft,
  },
  chatItemBody: {
    flex: 1,
    marginLeft: 12,
  },
  chatItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatItemTitle: {
    ...tokens.typography.h3,
    fontSize: 15,
  },
  chatItemTime: {
    ...tokens.typography.caption,
    color: tokens.colors.textTertiary,
  },
  chatItemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatItemLastMsg: {
    ...tokens.typography.body2,
    color: tokens.colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  unreadCountBadge: {
    backgroundColor: tokens.colors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
