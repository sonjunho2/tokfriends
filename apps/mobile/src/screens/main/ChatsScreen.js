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
  ExtendedFAB,
  useExtendedFabScroll,
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

// 1열 가로 스크롤 캡슐 필터 목록 (관리자 '소셜 & 매칭' 설정과 실시간 연동)
const DEFAULT_QUICK_FILTERS = [
  { id: 'T-ALL', label: '전체', segment: '전체', icon: '✨' },
  { id: 'T1', label: '지금 접속중', segment: '접속중', icon: '🔥' },
  { id: 'T2', label: '가까운 동네', segment: '가까운 거리', icon: '📍' },
  { id: 'T3', label: '20대 또래', segment: '연령대', icon: '🎂' },
  { id: 'T4', label: '취미·운동', segment: '의도', icon: '🏃' },
  { id: 'T5', label: '가벼운 커피', segment: '의도', icon: '☕' },
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

  // 1. 상단 4단 세그먼트 탭 ('discover' | 'openRooms' | 'chats' | 'requests')
  // 인연찾기 / 추천대화방 / 대화중(기존내대화) / 신청목록
  const initialTab = ['discover', 'openRooms', 'chats', 'requests'].includes(route?.params?.tab)
    ? route.params.tab
    : (route?.params?.tab === 'chats' ? 'chats' : 'discover');
  const [activeTab, setActiveTab] = useState(initialTab);

  // 2. 가변 플로팅 액션 버튼(Extended FAB) 스크롤 리스너 (60fps 인터랙션)
  const { isExtended, handleScroll } = useExtendedFabScroll(15);

  // 3. 가로 1열 캡슐 필터 선택 상태 (관리자 소셜 & 매칭 설정 실시간 연동)
  const [quickFilters, setQuickFilters] = useState(DEFAULT_QUICK_FILTERS);
  const [selectedFilterId, setSelectedFilterId] = useState('T-ALL');
  const [selectedFilter, setSelectedFilter] = useState('전체');

  // 4. 인연 데이터 상태
  const [discoverUsers, setDiscoverUsers] = useState(FALLBACK_DISCOVER_USERS);
  const [refreshing, setRefreshing] = useState(false);

  // 5. 추천 대화방 목록 (현재 대기중인 공개 대화방)
  const [openRooms, setOpenRooms] = useState([]);

  // 6. 대화 목록 상태 (실제 1:1 대화중)
  const [chats, setChats] = useState(DEFAULT_CHATS);
  const [chatSearchText, setChatSearchText] = useState('');

  // 7. 대화 신청 목록 (나에게 온 1:1 대화 신청)
  const [chatRequests, setChatRequests] = useState([]);

  // 8. 전역 바텀 시트 (GlobalBottomSheet)
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // 9. 대화방 개설 모달 (CreateRoomModal)
  const [createRoomModalVisible, setCreateRoomModalVisible] = useState(false);

  // 대기 중인 신청 건수 (뱃지 카운트)
  const pendingRequestsCount = useMemo(() => {
    return chatRequests.filter((r) => r.status === 'PENDING').length;
  }, [chatRequests]);

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

  // 전체 데이터 통합 로드
  const loadData = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    try {
      const [discoverRes, chatsRes, filtersRes, openRoomsRes, requestsRes] = await Promise.allSettled([
        apiClient.getDiscover(),
        apiClient.getChats(),
        apiClient.getMatchQuickFilters(),
        apiClient.getOpenChatRooms(),
        apiClient.getChatRequests(),
      ]);

      // 0. 관리자 설정 빠른 탐색 태그 실시간 동기화
      if (filtersRes.status === 'fulfilled' && Array.isArray(filtersRes.value) && filtersRes.value.length > 0) {
        setQuickFilters([
          { id: 'T-ALL', label: '전체', segment: '전체', icon: '✨' },
          ...filtersRes.value,
        ]);
      }

      // 1. 인연 찾기 데이터 동기화
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
            chatEntryFee: u.chatEntryFee || 30,
            photos: Array.isArray(u.photos) && u.photos.length > 0
              ? u.photos
              : (profile.avatarUri ? [{ id: 'p1', url: profile.avatarUri, isPrimary: true }] : fallback.photos),
          };
        });
        setDiscoverUsers(mapped);
      }

      // 2. 추천 대화방 데이터 동기화 (방장 프로필 온전 매핑)
      if (openRoomsRes.status === 'fulfilled' && Array.isArray(openRoomsRes.value)) {
        const myId = authUser?.id || authUser?.activityAccountId;
        const myAvatar = authUser?.avatarUrl || authUser?.profile?.avatarUri || authUser?.avatar;
        const myName = authUser?.nickname || authUser?.displayName || '나';

        setOpenRooms(
          openRoomsRes.value.map((r) => {
            const isMyRoom = (myId && r.hostId === myId) || r.isMyRoom;
            const hostObj = r.host || {};
            const hostName = isMyRoom ? myName : (hostObj.name || r.hostName || '대기 회원');
            const hostAvatar = isMyRoom ? myAvatar : (hostObj.avatar || hostObj.avatarUrl || r.hostAvatar || null);
            return {
              ...r,
              isMyRoom,
              hostName,
              hostAvatar,
              host: {
                id: r.hostId || hostObj.id || (isMyRoom ? myId : 'u-host'),
                name: hostName,
                displayName: hostName,
                avatar: hostAvatar,
                avatarUrl: hostAvatar,
                age: hostObj.age || r.hostAge || 26,
                location: hostObj.location || hostObj.region || r.hostRegion || '서울 강남구',
                headline: r.title,
                bio: hostObj.bio || (isMyRoom ? '내가 개설한 대기방입니다.' : `${hostName}님의 추천 대화방입니다.`),
                isOnline: true,
              },
            };
          })
        );
      }

      // 3. 대화 신청 목록 데이터 동기화 (신청자 프로필 온전 매핑)
      if (requestsRes.status === 'fulfilled' && Array.isArray(requestsRes.value)) {
        setChatRequests(
          requestsRes.value.map((req) => {
            const senderObj = req.sender || {};
            const senderName = senderObj.name || req.senderName || '새로운 인연';
            const senderAvatar = senderObj.avatar || senderObj.avatarUrl || req.senderAvatar || null;
            return {
              ...req,
              senderName,
              senderAvatar,
              sender: {
                id: req.senderId || senderObj.id,
                name: senderName,
                displayName: senderName,
                avatar: senderAvatar,
                avatarUrl: senderAvatar,
                age: senderObj.age || req.senderAge || 26,
                location: senderObj.location || senderObj.region || req.senderRegion || '서울 강남구',
                headline: req.message,
                bio: senderObj.bio || `${senderName}님이 보낸 1:1 대화 신청입니다 ✨`,
                isOnline: true,
              },
            };
          })
        );
      }

      // 4. 대화중(내 대화) 데이터 동기화
      if (chatsRes.status === 'fulfilled' && Array.isArray(chatsRes.value) && chatsRes.value.length > 0) {
        setChats(
          chatsRes.value.map((c) => {
            const myId = authUser?.id || authUser?.activityAccountId || 'guest';
            const isMyCreatedRoom =
              c.creatorId === myId ||
              c.hostId === myId ||
              c.host?.id === myId ||
              c.isWaiting ||
              (c.participantIds && c.participantIds.length === 1 && c.participantIds[0] === myId);

            const hasCounterpart =
              c.counterpart &&
              c.counterpart.id &&
              c.counterpart.id !== myId &&
              !String(c.counterpart.displayName || '').includes('대기');

            let displayTitle = '';
            let displayAvatar = null;

            if (hasCounterpart) {
              displayTitle = c.counterpart.displayName || c.counterpart.name || c.title || '대화 상대';
              displayAvatar = c.counterpart.avatarUrl || c.counterpart.avatar || c.avatar || null;
            } else if (isMyCreatedRoom) {
              displayTitle = c.title ? `[내가 개설] ${c.title}` : '내가 개설한 1:1 대화방';
              displayAvatar = authUser?.avatarUrl || authUser?.profile?.avatarUri || c.host?.avatarUrl || null;
            } else {
              displayTitle = c.title || c.counterpart?.displayName || '대화 상대';
              displayAvatar = c.avatar || c.counterpart?.avatarUrl || null;
            }

            return {
              id: c.id,
              title: displayTitle,
              rawTitle: c.title,
              avatar: displayAvatar,
              lastMessage: c.lastMessage || (isMyCreatedRoom && !hasCounterpart ? '대화 상대를 기다리는 중입니다 ⏳' : '대화가 시작되었습니다.'),
              lastMessageAt: c.lastMessageAt || new Date().toISOString(),
              unreadCount: c.unreadCount || 0,
              isOnline: Boolean(c.counterpart?.online),
              counterpart: hasCounterpart ? c.counterpart : { id: '', displayName: '대화 상대 대기 중', avatarUrl: null },
              isMyCreatedRoom,
              isWaiting: !hasCounterpart,
              host: c.host,
            };
          })
        );
      }
    } catch {
      // 에러 발생 시 기존 데이터 유지
    } finally {
      if (refresh) setRefreshing(false);
    }
  }, [authUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // 홈 화면 등 외부에서 넘어온 필터 파라미터 처리
  useEffect(() => {
    if (route?.params?.filter) {
      const targetFilter = String(route.params.filter);
      const matched = quickFilters.find(
        (f) => targetFilter.includes(f.label) || f.label.includes(targetFilter) || (f.segment && targetFilter.includes(f.segment))
      );
      if (matched) {
        setSelectedFilterId(matched.id);
        setSelectedFilter(matched.label);
      } else {
        setSelectedFilter(targetFilter);
      }
    }
  }, [route?.params?.filter, quickFilters]);

  // 1열 필터링 적용된 인연 목록 (관리자 설정 및 세그먼트 완전 연동)
  const filteredUsers = useMemo(() => {
    if (!discoverUsers || discoverUsers.length === 0) return [];

    const activeFilterObj = quickFilters.find((f) => f.id === selectedFilterId) || { label: selectedFilter };
    const label = activeFilterObj.label || selectedFilter;
    const segment = activeFilterObj.segment || '';

    // 1. 전체
    if (label === '전체' || activeFilterObj.id === 'T-ALL') {
      return discoverUsers;
    }

    // 2. HOT/인기
    if (label.includes('HOT') || label.includes('인기')) {
      return discoverUsers.filter((u) => u.isHot || u.isLive);
    }

    // 3. 지금 접속중
    if (segment === '접속중' || label.includes('접속')) {
      return discoverUsers.filter((u) => u.isOnline);
    }

    // 4. 가까운 동네 / 내 주변
    if (segment === '가까운 거리' || label.includes('동네') || label.includes('주변') || label.includes('거리')) {
      return [...discoverUsers].sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }

    // 5. 20대 또래 / 연령대
    if (segment === '연령대' || label.includes('20대') || label.includes('또래')) {
      return discoverUsers.filter((u) => u.age >= 20 && u.age < 30);
    }

    // 6. 취미, 운동, 커피 등 의도 및 관리자 커스텀 태그
    const cleanKeyword = label.replace(/[🔥📍🎂🏃☕✨#]/g, '').trim();
    if (!cleanKeyword) return discoverUsers;

    const keywords = cleanKeyword.split(/[·\s,/]+/).filter(Boolean);
    return discoverUsers.filter((u) => {
      const matchTag = u.tags?.some((t) => keywords.some((k) => t.includes(k)));
      const matchHeadline = keywords.some((k) => u.headline?.includes(k));
      const matchBio = keywords.some((k) => u.bio?.includes(k));
      return matchTag || matchHeadline || matchBio;
    });
  }, [discoverUsers, selectedFilterId, selectedFilter, quickFilters]);

  // 카드 터치 시 GlobalBottomSheet 열기
  const handleOpenUserSheet = (user) => {
    setSelectedUser(user);
    setBottomSheetVisible(true);
  };

  // 원터치 1:1 대화 시작 또는 대화 신청
  const handleStartChat = (targetUser) => {
    if (!targetUser?.id) return;
    const entryFee = targetUser.chatEntryFee || targetUser.entryFee || 30;
    Alert.alert(
      '대화 신청',
      `${targetUser.name}님에게 1:1 대화를 신청하시겠습니까?\n\n• 상대방 입장료: ${entryFee} ON\n• 상대방이 수락하면 1:1 대화방이 즉시 개설되고 입장료가 상대방에게 지급됩니다. (거절 시 환불)`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '대화 신청',
          onPress: async () => {
            try {
              setBottomSheetVisible(false);
              await apiClient.sendChatRequest({
                targetUserId: targetUser.id,
                message: '안녕하세요! 프로필 보고 대화 신청드립니다 😊',
              });
              Alert.alert('신청 완료', `${targetUser.name}님에게 대화 신청을 전달했습니다! 상대방이 수락하면 대화방이 생성됩니다.`);
              loadData();
            } catch (e) {
              Alert.alert('신청 실패', e?.message || '대화 신청을 전송할 수 없습니다.');
            }
          },
        },
      ]
    );
  };

  // 추천 대화방 입장하기 (게스트 -> 방장 1:1 대화방 생성 및 입장료 포인트 적립)
  const handleJoinOpenRoom = async (room) => {
    const fee = room.entryFee || 0;
    const myId = authUser?.id || authUser?.activityAccountId;
    const isMyRoom = (myId && room.hostId === myId) || room.isMyRoom;

    if (isMyRoom) {
      Alert.alert(
        '내가 개설한 대기방',
        `"${room.title}" 방은 내가 개설한 1:1 추천 대화방입니다.\n현재 다른 회원의 입장을 대기하고 있습니다 ⏳\n(게스트가 입장하면 알림과 함께 1:1 대화방이 생성됩니다)`,
        [{ text: '확인' }]
      );
      return;
    }

    Alert.alert(
      '대화방 입장',
      fee > 0
        ? `"${room.title}" 대화방에 입장하시겠습니까?\n\n※ 입장료 ${fee} ON이 차감되며 방장(${room.host?.name || '방장'})님에게 적립됩니다.`
        : `"${room.title}" 대화방에 입장하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '대화 시작하기',
          onPress: async () => {
            try {
              const res = await apiClient.joinOpenChatRoom(room.id);
              if (res?.chatRoom) {
                Alert.alert('입장 성공', '1:1 대화방이 생성되었습니다! 대화를 시작해보세요 🎉');
                navigation.navigate('ChatRoom', {
                  id: res.chatRoom.id,
                  room: res.chatRoom,
                  user: res.chatRoom.counterpart || room.host,
                });
                loadData();
              }
            } catch (err) {
              Alert.alert('입장 실패', err?.message || '대화방 입장에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  // 대화 신청 수락 (나의 1:1 대화방 즉시 생성 & 입장료 포인트 수락자 적립)
  const handleAcceptRequest = async (req) => {
    try {
      const res = await apiClient.acceptChatRequest(req.id);
      Alert.alert('대화 수락', `${req.sender?.name || '상대방'}님의 대화 신청을 수락했습니다! 대화방으로 이동합니다 🎉`);
      if (res?.chatRoom) {
        navigation.navigate('ChatRoom', {
          id: res.chatRoom.id,
          room: res.chatRoom,
          user: res.chatRoom.counterpart || req.sender,
        });
      }
      loadData();
    } catch (err) {
      Alert.alert('수락 실패', err?.message || '신청을 수락하지 못했습니다.');
    }
  };

  // 대화 신청 거절 (신청자에게 포인트 자동 환불)
  const handleRejectRequest = async (req) => {
    Alert.alert(
      '신청 거절',
      `${req.sender?.name || '상대방'}님의 대화 신청을 거절하시겠습니까?\n상대방에게 결제된 포인트가 환불됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '거절',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.rejectChatRequest(req.id);
              Alert.alert('거절 완료', '대화 신청을 거절했습니다.');
              loadData();
            } catch (err) {
              Alert.alert('오류', err?.message || '거절 처리 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
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

  // 1:1 대화방 삭제 처리 (어느 한쪽이라도 삭제하면 양쪽 모두에서 대화창 영구 종료)
  const handleDeleteChatRoom = useCallback((room) => {
    if (!room?.id) return;
    const roomTitle = room.title || room.counterpart?.displayName || '대화방';
    Alert.alert(
      '대화방 삭제',
      `"${roomTitle}" 1:1 대화방을 삭제하시겠습니까?\n\n※ 1:1 대화방 특성상 삭제 시 대화방이 즉시 완전히 종료 및 삭제되며 복구할 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '대화방 삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.deleteChat(room.id);
              setChats((prev) => prev.filter((c) => String(c.id) !== String(room.id)));
              Alert.alert('삭제 완료', '대화방이 삭제되었습니다.');
            } catch (err) {
              console.warn('대화방 삭제 실패:', err);
              Alert.alert('오류', '대화방을 삭제하지 못했습니다.');
            }
          },
        },
      ]
    );
  }, []);

  // =========================================================================
  // 1. 상단 4단 세그먼트 탭 헤더 (인연찾기 | 추천대화방 | 대화중 | 신청목록)
  // =========================================================================
  const renderTopSegment = () => (
    <View style={styles.topBar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.segmentScrollContent}
      >
        {/* [1. ⚡ 인연 찾기] */}
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'discover' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('discover')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="flash"
            size={15}
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

        {/* [2. 🔥 추천 대화방] */}
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'openRooms' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('openRooms')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="flame"
            size={15}
            color={activeTab === 'openRooms' ? tokens.colors.primary : tokens.colors.textTertiary}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'openRooms' && styles.segmentTextActive,
            ]}
          >
            추천 대화방
          </Text>
          {openRooms.length > 0 && (
            <View style={styles.tabSmallCountBadge}>
              <Text style={styles.tabSmallCountText}>{openRooms.length}</Text>
            </View>
          )}
          {activeTab === 'openRooms' && <View style={styles.activeSegmentIndicator} />}
        </TouchableOpacity>

        {/* [3. 💬 대화중 (기존 내 대화)] */}
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'chats' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('chats')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="chatbubbles"
            size={15}
            color={activeTab === 'chats' ? tokens.colors.primary : tokens.colors.textTertiary}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'chats' && styles.segmentTextActive,
            ]}
          >
            대화중
          </Text>
          {chats.some((c) => c.unreadCount > 0) && <View style={styles.chatBadgeDot} />}
          {activeTab === 'chats' && <View style={styles.activeSegmentIndicator} />}
        </TouchableOpacity>

        {/* [4. 📬 신청 목록] */}
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'requests' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('requests')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="mail-unread"
            size={15}
            color={activeTab === 'requests' ? tokens.colors.primary : tokens.colors.textTertiary}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'requests' && styles.segmentTextActive,
            ]}
          >
            신청 목록
          </Text>
          {pendingRequestsCount > 0 && (
            <View style={styles.tabReqBadge}>
              <Text style={styles.tabReqBadgeText}>{pendingRequestsCount}</Text>
            </View>
          )}
          {activeTab === 'requests' && <View style={styles.activeSegmentIndicator} />}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // =========================================================================
  // 2. 가로 1열 캡슐 필터 바 (관리자 '소셜 & 매칭' 설정과 실시간 연동)
  // =========================================================================
  const renderCapsuleFilterBar = () => (
    <View style={styles.filterBarContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        {quickFilters.map((filter) => {
          const isSelected = selectedFilterId === filter.id || selectedFilter === filter.label;
          const displayIcon = filter.icon && filter.label !== '전체' ? `${filter.icon} ` : '';
          return (
            <TouchableOpacity
              key={filter.id || filter.label}
              style={[
                styles.capsuleBtn,
                isSelected ? styles.capsuleBtnActive : styles.capsuleBtnInactive,
              ]}
              onPress={() => {
                setSelectedFilterId(filter.id);
                setSelectedFilter(filter.label);
              }}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.capsuleText,
                  isSelected ? styles.capsuleTextActive : styles.capsuleTextInactive,
                ]}
              >
                {displayIcon}{filter.label}
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
  // =========================================================================
  // 5. 추천 대화방 목록 렌더링 (현재 대기 중인 1:1 공개 방)
  // =========================================================================
  const renderOpenRoomItem = ({ item }) => {
    const myId = authUser?.id || authUser?.activityAccountId;
    const isMyRoom = (myId && item.hostId === myId) || item.isMyRoom;
    const fee = item.entryFee || 0;

    const hostUser = {
      id: item.host?.id || item.hostId || (isMyRoom ? myId : 'u-host'),
      name: isMyRoom ? (authUser?.nickname || authUser?.displayName || '나') : (item.host?.name || item.hostName || '대기 회원'),
      displayName: isMyRoom ? (authUser?.nickname || authUser?.displayName || '나') : (item.host?.name || item.hostName || '대기 회원'),
      avatar: isMyRoom ? (authUser?.avatarUrl || authUser?.profile?.avatarUri || authUser?.avatar) : (item.host?.avatar || item.host?.avatarUrl || item.hostAvatar),
      age: item.host?.age || item.hostAge || (isMyRoom ? authUser?.age : 26),
      location: item.host?.location || item.hostRegion || (isMyRoom ? [authUser?.region1, authUser?.region2].filter(Boolean).join(' ') : '서울 강남구'),
      headline: item.title,
      bio: isMyRoom ? '내가 개설한 1:1 대화방입니다. 상대방의 입장을 기다리고 있습니다 ✨' : (item.host?.bio || `${item.host?.name || item.hostName || '회원'}님의 추천 대화방입니다.`),
      isOnline: true,
      photos: item.host?.avatar ? [{ id: 'p1', url: item.host.avatar, isPrimary: true }] : [],
    };

    return (
      <View style={styles.openRoomCard}>
        <View style={styles.openRoomHeaderRow}>
          {/* 프로필 아이콘 누르면 프로필 창 오픈 */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleOpenUserSheet(hostUser)}
            style={{ marginRight: 2 }}
          >
            <UserAvatar
              uri={hostUser.avatar}
              name={hostUser.name}
              size="md"
              isOnline={Boolean(item.host?.isOnline || isMyRoom)}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.openRoomInfoCol}
            activeOpacity={0.85}
            onPress={() => handleOpenUserSheet(hostUser)}
          >
            <View style={styles.openRoomTitleRow}>
              <Text style={styles.openRoomTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {isMyRoom && (
                <View style={styles.myRoomTag}>
                  <Text style={styles.myRoomTagText}>내가 개설</Text>
                </View>
              )}
            </View>

            <View style={styles.openRoomMetaRow}>
              <Text style={styles.openRoomHostName}>
                {isMyRoom ? '나 (대기중)' : `${hostUser.name} (${hostUser.age ? `${hostUser.age}세` : '회원'})`}
              </Text>
              <Text style={styles.openRoomDot}>·</Text>
              <Text style={styles.openRoomCategory}>#{item.category || '친목'}</Text>
            </View>
          </TouchableOpacity>

          {/* 입장료 뱃지 */}
          <View style={[styles.entryFeeBadge, fee > 0 ? styles.entryFeeBadgePaid : styles.entryFeeBadgeFree]}>
            <Text style={[styles.entryFeeText, fee > 0 ? styles.entryFeeTextPaid : styles.entryFeeTextFree]}>
              {fee > 0 ? `${fee} ON` : '무료'}
            </Text>
          </View>
        </View>

        {/* 하단 액션 버튼 */}
        <View style={styles.openRoomActionRow}>
          <Text style={styles.openRoomNoticeText}>
            {isMyRoom
              ? '다른 회원이 입장하면 1:1 대화방이 즉시 개설됩니다 ⏳'
              : '입장 시 1:1 대화방이 개설되며 방장과 대화가 시작됩니다 ✨'}
          </Text>

          <TouchableOpacity
            style={[styles.openRoomJoinBtn, isMyRoom && styles.openRoomMyBtn]}
            onPress={() => handleJoinOpenRoom(item)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isMyRoom ? 'time-outline' : 'chatbubble-ellipses'}
              size={14}
              color="#FFFFFF"
            />
            <Text style={styles.openRoomJoinText}>
              {isMyRoom ? '대기 현황' : '대화하기'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // =========================================================================
  // 6. 나에게 온 대화 신청 목록 렌더링
  // =========================================================================
  const renderRequestItem = ({ item }) => {
    const isPending = item.status === 'PENDING';
    const fee = item.entryFee || 30;

    const senderUser = {
      id: item.sender?.id || item.senderId,
      name: item.sender?.name || item.senderName || '새로운 인연',
      displayName: item.sender?.name || item.senderName || '새로운 인연',
      avatar: item.sender?.avatar || item.sender?.avatarUrl || item.senderAvatar,
      age: item.sender?.age || item.senderAge || 26,
      location: item.sender?.location || item.senderRegion || '서울 강남구',
      headline: item.message || '안녕하세요! 1:1 대화 신청드려요 😊',
      bio: item.sender?.bio || `${item.sender?.name || item.senderName || '회원'}님이 보낸 1:1 대화 신청입니다 ✨`,
      isOnline: Boolean(item.sender?.isOnline),
      photos: (item.sender?.avatar || item.senderAvatar) ? [{ id: 'p1', url: item.sender?.avatar || item.senderAvatar, isPrimary: true }] : [],
    };

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeaderRow}>
          {/* 신청자 프로필 아이콘 누르면 프로필 창 오픈 */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleOpenUserSheet(senderUser)}
            style={{ marginRight: 2 }}
          >
            <UserAvatar
              uri={senderUser.avatar}
              name={senderUser.name}
              size="md"
              isOnline={Boolean(senderUser.isOnline)}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.requestInfoCol}
            activeOpacity={0.85}
            onPress={() => handleOpenUserSheet(senderUser)}
          >
            <View style={styles.requestNameRow}>
              <Text style={styles.requestSenderName}>{senderUser.name}</Text>
              <Text style={styles.requestTimeText}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <Text style={styles.requestMessageText} numberOfLines={2}>
              "{item.message || '안녕하세요! 대화 신청드려요 😊'}"
            </Text>
          </TouchableOpacity>
        </View>

        {/* 포인트 적립 안내 및 수락/거절 액션 */}
        <View style={styles.requestBottomRow}>
          <View style={styles.requestPointEarnBadge}>
            <Ionicons name="sparkles" size={12} color="#FF3B6B" />
            <Text style={styles.requestPointEarnText}>수락 시 +{fee} ON 적립</Text>
          </View>

          {isPending ? (
            <View style={styles.requestActionBtns}>
              <TouchableOpacity
                style={styles.requestRejectBtn}
                onPress={() => handleRejectRequest(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.requestRejectText}>거절</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.requestAcceptBtn}
                onPress={() => handleAcceptRequest(item)}
                activeOpacity={0.85}
              >
                <Text style={styles.requestAcceptText}>대화하기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.requestStatusBadge}>
              <Text style={styles.requestStatusText}>
                {item.status === 'ACCEPTED' ? '수락 완료' : '거절됨'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // =========================================================================
  // 7. 대화중(내 대화방) 목록 렌더링
  // =========================================================================
  const renderChatListItem = ({ item }) => {
    const counterpartUser = {
      id: item.counterpart?.id || item.id,
      name: item.title,
      displayName: item.title,
      avatar: item.avatar,
      isOnline: item.isOnline,
      headline: item.lastMessage || '1:1 대화 중인 인연입니다.',
      bio: '즐거운 대화를 나누고 있어요 ✨',
      photos: item.avatar ? [{ id: 'p1', url: item.avatar, isPrimary: true }] : [],
    };

    return (
      <TouchableOpacity
        style={styles.chatItem}
        activeOpacity={0.85}
        onLongPress={() => handleDeleteChatRoom(item)}
        onPress={() =>
          navigation.navigate('ChatRoom', {
            id: item.id,
            room: item,
            user: item.counterpart,
          })
        }
      >
        {/* 상대방 프로필 아이콘 누르면 프로필 창 오픈 */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={(e) => {
            e.stopPropagation();
            handleOpenUserSheet(counterpartUser);
          }}
          style={{ marginRight: 2 }}
        >
          <UserAvatar
            uri={item.avatar}
            name={item.title}
            size="md"
            isOnline={item.isOnline}
          />
        </TouchableOpacity>
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
          <View style={styles.chatItemActionsRight}>
            {item.unreadCount > 0 && (
              <View style={styles.unreadCountBadge}>
                <Text style={styles.unreadCountText}>{item.unreadCount}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.chatItemDeleteBtn}
              onPress={() => handleDeleteChatRoom(item)}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. 상단 4단 세그먼트 탭 */}
      {renderTopSegment()}

      {/* 2. 탭별 뷰 렌더링 */}
      {activeTab === 'discover' && (
        <View style={{ flex: 1 }}>
          {/* 가로 1열 캡슐 필터 바 */}
          {renderCapsuleFilterBar()}

          {/* 실시간 접속 레이더 배너 */}
          {renderRadarBanner()}

          {/* 인연 매칭 2열 그리드 리스트 (스크롤 시 Extended FAB 축소 연동) */}
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            numColumns={2}
            renderItem={renderMatchCard}
            contentContainerStyle={styles.gridContentContainer}
            columnWrapperStyle={styles.gridColumnWrapper}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
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
      )}

      {activeTab === 'openRooms' && (
        /* 추천 대화방 탭 */
        <View style={{ flex: 1 }}>
          <FlatList
            data={openRooms}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderOpenRoomItem}
            contentContainerStyle={styles.openRoomsContentContainer}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData({ refresh: true })}
                colors={[tokens.colors.primary]}
                tintColor={tokens.colors.primary}
              />
            }
            ListHeaderComponent={
              <View style={styles.openRoomHeaderBanner}>
                <Ionicons name="sparkles" size={16} color="#FF3B6B" />
                <Text style={styles.openRoomHeaderBannerText}>
                  지금 대기 중인 추천 대화방입니다. 마음에 드는 방에 입장해 보세요!
                </Text>
              </View>
            }
            ListEmptyComponent={
              <EmptyStateView
                preset="chats"
                title="대기 중인 추천 대화방이 없습니다"
                description="하단의 '+ 방만들기' 버튼을 눌러 내가 먼저 대화방을 열어보세요!"
                ctaLabel="+ 대화방 만들기"
                onCtaPress={() => setCreateRoomModalVisible(true)}
                style={{ marginTop: 60 }}
              />
            }
          />
        </View>
      )}

      {activeTab === 'chats' && (
        /* 대화중(내 대화) 탭 */
        <View style={{ flex: 1 }}>
          <FlatList
            data={chats}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderChatListItem}
            contentContainerStyle={styles.chatsContentContainer}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
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
                description="추천 대화방이나 인연 찾기에서 대화를 시작해 보세요!"
                ctaLabel="추천 대화방 보기"
                onCtaPress={() => setActiveTab('openRooms')}
                style={{ marginTop: 60 }}
              />
            }
          />
        </View>
      )}

      {activeTab === 'requests' && (
        /* 신청 목록 탭 */
        <View style={{ flex: 1 }}>
          <FlatList
            data={chatRequests}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderRequestItem}
            contentContainerStyle={styles.requestsContentContainer}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
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
                preset="empty"
                title="도착한 대화 신청이 없습니다"
                description="내 프로필을 매력적으로 꾸미고 방을 만들어 대화를 기다려보세요!"
                ctaLabel="인연 찾기 둘러보기"
                onCtaPress={() => setActiveTab('discover')}
                style={{ marginTop: 60 }}
              />
            }
          />
        </View>
      )}

      {/* 당근마켓 스타일 가변 플로팅 액션 버튼 (Extended FAB) */}
      <ExtendedFAB
        label="+ 방만들기"
        iconName="add"
        isExtended={isExtended}
        onPress={() => setCreateRoomModalVisible(true)}
      />

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
          setActiveTab('openRooms');
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
  chatItemActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatItemDeleteBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },

  // 6. 4단 세그먼트 탭 보강 스타일
  segmentScrollContent: {
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 6,
  },
  tabSmallCountBadge: {
    backgroundColor: tokens.colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 3,
  },
  tabSmallCountText: {
    color: tokens.colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  tabReqBadge: {
    backgroundColor: '#FF3B6B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 3,
  },
  tabReqBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // 7. 추천 대화방 스타일
  openRoomsContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
  },
  openRoomHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F4',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: tokens.radius.card,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFE4E8',
  },
  openRoomHeaderBannerText: {
    flex: 1,
    color: '#E11D48',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  openRoomCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: tokens.colors.borderLight,
    ...tokens.shadows.soft,
  },
  openRoomHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openRoomInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  openRoomTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  openRoomTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
    flex: 1,
  },
  myRoomTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  myRoomTagText: {
    color: '#4F46E5',
    fontSize: 10,
    fontWeight: '700',
  },
  openRoomMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openRoomHostName: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  openRoomDot: {
    color: tokens.colors.textTertiary,
    fontSize: 12,
  },
  openRoomCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  entryFeeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: tokens.radius.full,
  },
  entryFeeBadgePaid: {
    backgroundColor: '#FFF1F4',
    borderWidth: 1,
    borderColor: '#FFD4DD',
  },
  entryFeeBadgeFree: {
    backgroundColor: '#F3F4F6',
  },
  entryFeeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  entryFeeTextPaid: {
    color: '#FF3B6B',
  },
  entryFeeTextFree: {
    color: tokens.colors.textSecondary,
  },
  openRoomActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  openRoomNoticeText: {
    fontSize: 11,
    color: tokens.colors.textTertiary,
    flex: 1,
    marginRight: 10,
  },
  openRoomJoinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B6B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: tokens.radius.full,
    gap: 4,
    ...tokens.shadows.soft,
  },
  openRoomMyBtn: {
    backgroundColor: '#4B5563',
  },
  openRoomJoinText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // 8. 신청 목록 스타일
  requestsContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
  },
  requestCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: tokens.colors.borderLight,
    ...tokens.shadows.soft,
  },
  requestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  requestInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  requestNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  requestSenderName: {
    fontSize: 15,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  requestTimeText: {
    fontSize: 11,
    color: tokens.colors.textTertiary,
  },
  requestMessageText: {
    fontSize: 13,
    color: tokens.colors.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  requestBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  requestPointEarnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  requestPointEarnText: {
    color: '#FF3B6B',
    fontSize: 11,
    fontWeight: '800',
  },
  requestActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestRejectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: tokens.radius.full,
    backgroundColor: '#F3F4F6',
  },
  requestRejectText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
  },
  requestAcceptBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: tokens.radius.full,
    backgroundColor: '#FF3B6B',
    ...tokens.shadows.soft,
  },
  requestAcceptText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  requestStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  requestStatusText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '700',
  },
});
