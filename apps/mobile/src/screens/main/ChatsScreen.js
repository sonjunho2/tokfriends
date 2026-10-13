// src/screens/main/ChatsScreen.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../../api/client';
import colors from '../../theme/colors';
import ChatListItem from '../../components/ChatListItem';
import UserListItem from '../../components/UserListItem';
import SegmentBar from '../../components/SegmentBar';
import { useAuth } from '../../context/AuthContext';
import { checkAndConfirmActionPoint } from '../../utils/pointPolicyHelper';

const CHAT_CATEGORIES = ['친목', '취미', '고민', '운동', '동네', '자유'];

const SUPPORTED_SEGMENTS = [
  '전체',
  '🔥 HOT추천',
  '🟢 접속중',
  '📍 내 주변',
  '20대',
  '30대',
  '40대이상',
];

const INTEREST_CHIPS = [
  '음악', '영화', '독서', '카페', '맛집', '여행', '운동',
  '게임', '요리', '등산', '사진', '반려동물', '패션', '미술',
];

function calculateAge(dob) {
  if (!dob) return undefined;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return undefined;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();

  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());

  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : undefined;
}

function formatLastSeen(lastSeenAt) {
  if (!lastSeenAt) return undefined;
  const seen = new Date(lastSeenAt);
  if (Number.isNaN(seen.getTime())) return undefined;

  const diffMs = Date.now() - seen.getTime();
  if (diffMs < 0) return undefined;

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분`;

  const hours = Math.floor(minutes / 24);
  if (hours < 24) return `${hours}시간`;

  const days = Math.floor(hours / 24);
  return `${days}일`;
}

function simpleHash(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function mapDiscoverUser(user, myRegion = '') {
  const profile = user?.profile ?? {};
  const targetAccountId =
    typeof user?.targetAccountId === 'string'
      ? user.targetAccountId.trim()
      : '';

  const h = simpleHash(String(user?.id || user?.displayName || 'user'));
  const isNearby = myRegion && (
    (user?.region1 && myRegion.includes(user.region1)) ||
    (user?.region2 && myRegion.includes(user.region2))
  );

  const distanceKm = typeof user?.distanceKm === 'number'
    ? user.distanceKm
    : isNearby
      ? ((h % 25) + 5) / 10
      : ((h % 150) + 35) / 10;

  const lastSeen = formatLastSeen(profile?.lastSeenAt);
  const isOnline = lastSeen === '방금' || (h % 4 === 0);

  return {
    id: user?.id,
    targetUserId: user?.id,
    targetAccountId: targetAccountId || undefined,
    name: profile?.nickname || user?.displayName || '회원',
    age: typeof user?.age === 'number' ? user.age : calculateAge(user?.dob),
    subtitle: profile?.headline || profile?.bio || undefined,
    bio: profile?.bio || undefined,
    headline: profile?.headline || undefined,
    avatar: profile?.avatarUri || undefined,
    lastSeenLabel: isOnline ? '방금' : (lastSeen || `${(h % 40) + 5}분`),
    online: isOnline,
    regionLabel:
      [user?.region1, user?.region2].filter(Boolean).join(' · ') || '동네 이웃',
    interests: Array.isArray(profile?.interests) && profile.interests.length > 0
      ? profile.interests
      : ['음악', '카페', '여행', '운동'].slice(0, (h % 3) + 2),
    distanceKm,
    points: typeof user?.points === 'number' ? user.points : ((h % 8) + 1) * 500,
  };
}

const normalizeChats = (response) => {
  if (!Array.isArray(response)) {
    return [];
  }

  return response.map((chat) => {
    const counterpartId = chat?.counterpart?.id || chat?.id || 'counterpart';
    const title = chat?.title || chat?.counterpart?.displayName || chat?.counterpart?.handle || '대화방';
    const avatar = chat?.avatar || chat?.counterpart?.avatarUrl || chat?.counterpart?.avatarUri || null;
    return {
      id: chat.id,
      counterpartAccountId: counterpartId,
      title,
      avatar,
      lastMessageAt: chat.lastMessageAt ?? null,
      lastMessage: typeof chat.lastMessage === 'string' ? chat.lastMessage : null,
      unreadCount: typeof chat.unreadCount === 'number' ? chat.unreadCount : 0,
      entryFee: Number(chat?.entryFee ?? 0),
      category: chat?.category || null,
      isGroup: Boolean(chat?.isGroup),
    };
  });
};

export default function ChatsScreen({ navigation, route }) {
  const { user: authUser } = useAuth();
  const myRegion = authUser?.region1 || authUser?.region2 || '';
  const myInterests = authUser?.profile?.interests || [];

  // 1. 상단 듀얼 탭 상태 (기본값: 'discover' 인연 찾기)
  const initialTab = route?.params?.tab || 'discover';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (route?.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route?.params?.tab]);

  // 2. 인연 찾기(Discover) 상태
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(true);
  const [discoverRefreshing, setDiscoverRefreshing] = useState(false);
  const [discoverError, setDiscoverError] = useState('');
  const [seg, setSeg] = useState('전체');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'nearby' | 'popular'
  const [discoverSearchQuery, setDiscoverSearchQuery] = useState('');
  const [selectedInterest, setSelectedInterest] = useState('');
  const [isDiscoverSearchOpen, setIsDiscoverSearchOpen] = useState(false);
  const debounceRef = useRef(null);

  // 3. 내 대화방(Chats) 상태
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [chatsRefreshing, setChatsRefreshing] = useState(false);
  const [chatsError, setChatsError] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);

  // 채팅방 개설 모달 상태
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('친목');
  const [newEntryFee, setNewEntryFee] = useState(0);
  const [isGroup, setIsGroup] = useState(false);
  const [creating, setCreating] = useState(false);

  // =========================================================================
  // 데이터 로드: 인연 찾기
  // =========================================================================
  const loadDiscoverUsers = useCallback(async (params = {}, { refresh = false } = {}) => {
    if (refresh) setDiscoverRefreshing(true);
    else setDiscoverLoading(true);
    setDiscoverError('');

    try {
      const result = await apiClient.getDiscover(params);
      const list = Array.isArray(result) ? result : [];
      setDiscoverUsers(list.map((u) => mapDiscoverUser(u, myRegion)).filter((item) => item.id));
    } catch (error) {
      setDiscoverUsers([]);
      setDiscoverError(error?.message || '추천 회원 목록을 불러오지 못했습니다.');
    } finally {
      setDiscoverLoading(false);
      setDiscoverRefreshing(false);
    }
  }, [myRegion]);

  // =========================================================================
  // 데이터 로드: 내 대화방 목록
  // =========================================================================
  const loadChats = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setChatsRefreshing(true);
    else setChatsLoading(true);
    setChatsError('');

    try {
      const response = await apiClient.getChats();
      setChats(normalizeChats(response));
    } catch (requestError) {
      setChatsError(requestError?.message || '대화 목록을 불러오지 못했습니다.');
    } finally {
      if (refresh) setChatsRefreshing(false);
      else setChatsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDiscoverUsers();
      loadChats();
    }, [loadDiscoverUsers, loadChats])
  );

  // 인연 검색 debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = {};
      if (discoverSearchQuery.trim()) params.q = discoverSearchQuery.trim();
      if (selectedInterest) params.interest = selectedInterest;
      loadDiscoverUsers(params);
    }, 450);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [discoverSearchQuery, selectedInterest, loadDiscoverUsers]);

  // 인연 필터링 및 정렬
  const filteredDiscoverUsers = useMemo(() => {
    let list = [...discoverUsers];

    switch (seg) {
      case '🔥 HOT추천':
        list.sort((a, b) => (b.points || 0) - (a.points || 0));
        break;
      case '🟢 접속중':
        list = list.filter((user) => user.online || user.lastSeenLabel === '방금');
        break;
      case '📍 내 주변':
        list.sort((a, b) => (a.distanceKm || 99) - (b.distanceKm || 99));
        break;
      case '20대':
        list = list.filter(
          (user) => typeof user.age === 'number' && user.age >= 20 && user.age < 30,
        );
        break;
      case '30대':
        list = list.filter(
          (user) => typeof user.age === 'number' && user.age >= 30 && user.age < 40,
        );
        break;
      case '40대이상':
        list = list.filter(
          (user) => typeof user.age === 'number' && user.age >= 40,
        );
        break;
      case '전체':
      default:
        break;
    }

    if (sortBy === 'nearby') {
      list.sort((a, b) => (a.distanceKm || 99) - (b.distanceKm || 99));
    } else if (sortBy === 'popular') {
      list.sort((a, b) => (b.points || 0) - (a.points || 0));
    } else if (sortBy === 'recent') {
      list.sort((a, b) => {
        if (a.online && !b.online) return -1;
        if (!a.online && b.online) return 1;
        return 0;
      });
    }

    return list;
  }, [seg, discoverUsers, sortBy]);

  // 내 대화 검색 필터링
  const filteredChats = useMemo(() => {
    if (!chatSearchQuery.trim()) return chats;
    const q = chatSearchQuery.toLowerCase();
    return chats.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.lastMessage?.toLowerCase().includes(q)
    );
  }, [chats, chatSearchQuery]);

  const totalUnreadCount = useMemo(() => {
    return chats.reduce((acc, c) => acc + (Number(c.unreadCount) || 0), 0);
  }, [chats]);

  // =========================================================================
  // 인연 프로필 보기 및 1:1 대화 시작
  // =========================================================================
  const handleOpenProfile = useCallback((item) => {
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
        id: item?.id,
        ...targetIdentity,
        name: item?.name,
        location: item?.regionLabel || '지역 미설정',
        title: item?.headline || '프로필',
        bio: item?.bio || item?.subtitle,
        avatar: item?.avatar,
        coverImage: item?.avatar,
        age: item?.age,
        photos: item?.photos,
      },
    });
  }, [navigation]);

  const handleQuickChat = useCallback((item) => {
    checkAndConfirmActionPoint({
      actionType: 'chatRoomCreate',
      actionName: '1:1 대화 시작',
      navigation,
      onConfirm: async () => {
        const targetAccountId = item.targetAccountId || `acc_${item.id}`;
        let chatId = `chat_${item.id}`;
        try {
          const room = await apiClient.ensureDirectRoom(targetAccountId);
          if (room?.id) chatId = room.id;
        } catch {
          // fallback
        }

        navigation.navigate('ChatRoom', {
          id: chatId,
          chatId,
          counterpartAccountId: targetAccountId,
          counterpartNickname: item.name,
          counterpartAvatar: item.avatar,
        });
      },
    });
  }, [navigation]);

  // =========================================================================
  // 대화방 입장
  // =========================================================================
  const handleOpenChat = useCallback(
    (item) => {
      const fee = Number(item.entryFee ?? 0);
      const actionName = fee > 0 ? `채팅방 참여(입장료 ${fee.toLocaleString()} 온)` : '채팅방 무료 참여';

      checkAndConfirmActionPoint({
        actionType: 'chatRoomJoin',
        actionName,
        overrideAmount: fee,
        navigation,
        onConfirm: () => {
          navigation.navigate('ChatRoom', {
            id: item.id,
            chatId: item.id,
            title: item.title,
            counterpartAccountId: item.counterpartAccountId,
            room: item,
            isGroup: item.isGroup,
          });
        },
      });
    },
    [navigation]
  );

  // =========================================================================
  // 대화방 삭제 / 나가기 (신규 요구사항)
  // =========================================================================
  const handleDeleteChat = useCallback(
    (item) => {
      Alert.alert(
        '대화방 나가기',
        `'${item.title}' 대화방을 나가시겠습니까?\n나가면 이전 대화 기록이 삭제되며 대화방 목록에서 완전히 제거됩니다.`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '나가기',
            style: 'destructive',
            onPress: async () => {
              try {
                await apiClient.deleteChat(item.id);
                setChats((prev) => prev.filter((c) => String(c.id) !== String(item.id)));
              } catch (e) {
                Alert.alert('알림', '대화방 삭제 중 오류가 발생했습니다.');
              }
            },
          },
        ]
      );
    },
    []
  );

  // =========================================================================
  // 새 채팅방 개설
  // =========================================================================
  const handleCreateRoom = async () => {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) {
      Alert.alert('알림', '대화방 제목을 입력해 주세요.');
      return;
    }

    const fee = Math.max(0, Number(newEntryFee || 0));

    checkAndConfirmActionPoint({
      actionType: 'chatRoomCreate',
      actionName: '대화방 개설',
      navigation,
      onConfirm: async () => {
        setCreating(true);
        try {
          const createdRoom = await apiClient.createChatRoom({
            title: trimmedTitle,
            category: newCategory,
            entryFee: fee,
            isGroup,
          });
          setCreateModalVisible(false);
          setNewTitle('');
          setNewEntryFee(0);
          setIsGroup(false);
          loadChats();
          navigation.navigate('ChatRoom', {
            id: createdRoom.id,
            chatId: createdRoom.id,
            title: createdRoom.title,
            counterpartAccountId: createdRoom.counterpart?.id || createdRoom.id,
            room: createdRoom,
            isGroup,
          });
        } catch (e) {
          Alert.alert('개설 실패', e?.message || '대화방을 개설하지 못했습니다.');
        } finally {
          setCreating(false);
        }
      },
    });
  };

  const canGoBack = (navigation.getState()?.index ?? 0) > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* =================================================================
          1. GNB 헤더 (인연 · 대화)
          ================================================================= */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {canGoBack && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={8}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={24} color="#191919" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>인연 · 대화</Text>
        </View>

        <View style={styles.headerRight}>
          {/* 내 대화 탭일 때: 방 개설 버튼 */}
          {activeTab === 'chats' && (
            <TouchableOpacity
              style={styles.headerCreateBtn}
              onPress={() => setCreateModalVisible(true)}
              hitSlop={6}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={17} color="#191919" />
              <Text style={styles.headerCreateBtnText}>방 개설</Text>
            </TouchableOpacity>
          )}

          {/* 검색 토글 아이콘 */}
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => {
              if (activeTab === 'discover') {
                setIsDiscoverSearchOpen((prev) => !prev);
              } else {
                setIsChatSearchOpen((prev) => !prev);
              }
            }}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                (activeTab === 'discover' ? isDiscoverSearchOpen : isChatSearchOpen)
                  ? 'close'
                  : 'search'
              }
              size={22}
              color="#191919"
            />
          </TouchableOpacity>

          {/* 마이/설정 */}
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('My')}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={21} color="#191919" />
          </TouchableOpacity>
        </View>
      </View>

      {/* =================================================================
          2. 상단 듀얼 세그먼트 탭 ([ 💖 인연 찾기 ] | [ 💬 내 대화 ])
          ================================================================= */}
      <View style={styles.dualTabWrap}>
        <View style={styles.dualTabContainer}>
          <TouchableOpacity
            style={[
              styles.dualTabBtn,
              activeTab === 'discover' && styles.dualTabBtnActive,
            ]}
            onPress={() => setActiveTab('discover')}
            activeOpacity={0.85}
          >
            <Ionicons
              name={activeTab === 'discover' ? 'sparkles' : 'sparkles-outline'}
              size={15}
              color={activeTab === 'discover' ? '#18181B' : '#71717A'}
            />
            <Text
              style={[
                styles.dualTabLabel,
                activeTab === 'discover' && styles.dualTabLabelActive,
              ]}
            >
              인연 찾기
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dualTabBtn,
              activeTab === 'chats' && styles.dualTabBtnActive,
            ]}
            onPress={() => setActiveTab('chats')}
            activeOpacity={0.85}
          >
            <Ionicons
              name={activeTab === 'chats' ? 'chatbubbles' : 'chatbubbles-outline'}
              size={15}
              color={activeTab === 'chats' ? '#18181B' : '#71717A'}
            />
            <Text
              style={[
                styles.dualTabLabel,
                activeTab === 'chats' && styles.dualTabLabelActive,
              ]}
            >
              내 대화
            </Text>
            {totalUnreadCount > 0 && (
              <View style={styles.dualTabBadge}>
                <Text style={styles.dualTabBadgeText}>
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* =================================================================
          3-A. [인연 찾기 (Discover)] 뷰
          ================================================================= */}
      {activeTab === 'discover' ? (
        <View style={styles.tabContentFlex}>
          {/* 검색바 (토글 시 노출) */}
          {isDiscoverSearchOpen && (
            <View style={styles.searchBarWrap}>
              <View style={styles.searchInputBox}>
                <Ionicons name="search" size={16} color="#8E8E93" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="닉네임, 동네, 관심사로 인연 검색"
                  placeholderTextColor="#8E8E93"
                  value={discoverSearchQuery}
                  onChangeText={setDiscoverSearchQuery}
                  autoFocus
                  clearButtonMode="while-editing"
                />
                {discoverSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setDiscoverSearchQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color="#8E8E93" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* 세그먼트 필터 (전체, HOT추천, 접속중, 내 주변 등) */}
          <View style={styles.discoverSegmentWrap}>
            <SegmentBar
              segments={SUPPORTED_SEGMENTS}
              value={seg}
              onChange={setSeg}
              style={styles.segmentBarInner}
            />
          </View>

          {/* 관심사 칩 필터 */}
          <View style={styles.interestWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.interestScroll}
            >
              {INTEREST_CHIPS.map((chip) => {
                const isSelected = selectedInterest === chip;
                return (
                  <TouchableOpacity
                    key={chip}
                    style={[styles.interestChip, isSelected && styles.interestChipActive]}
                    onPress={() => setSelectedInterest(isSelected ? '' : chip)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.interestChipText,
                        isSelected && styles.interestChipTextActive,
                      ]}
                    >
                      #{chip}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 정렬 필터 바 */}
          <View style={styles.sortBar}>
            <Text style={styles.userCountText}>
              추천 인연 <Text style={styles.userCountHighlight}>{filteredDiscoverUsers.length}</Text>명
            </Text>
            <View style={styles.sortBtnsRow}>
              {[
                { id: 'recent', label: '접속순' },
                { id: 'nearby', label: '거리순' },
                { id: 'popular', label: '인기순' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.sortBtn, sortBy === opt.id && styles.sortBtnActive]}
                  onPress={() => setSortBy(opt.id)}
                >
                  <Text
                    style={[
                      styles.sortBtnText,
                      sortBy === opt.id && styles.sortBtnTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 인연 리스트 */}
          {discoverLoading ? (
            <View style={styles.stateWrap}>
              <ActivityIndicator size="large" color="#FEE500" />
              <Text style={styles.stateMessage}>새로운 인연을 탐색하는 중이에요...</Text>
            </View>
          ) : discoverError ? (
            <View style={styles.stateWrap}>
              <Text style={styles.errorTitle}>인연 목록을 불러오지 못했어요</Text>
              <Text style={styles.stateMessage}>{discoverError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadDiscoverUsers()}
              >
                <Text style={styles.retryButtonText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              style={styles.list}
              data={filteredDiscoverUsers}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <UserListItem
                  item={item}
                  onPress={() => handleOpenProfile(item)}
                  onChatPress={() => handleQuickChat(item)}
                  myInterests={myInterests}
                />
              )}
              contentContainerStyle={[
                styles.discoverListContent,
                !filteredDiscoverUsers.length && styles.emptyListContent,
              ]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={discoverRefreshing}
                  onRefresh={() => loadDiscoverUsers({}, { refresh: true })}
                  tintColor="#FEE500"
                  colors={['#FEE500']}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="sparkles" size={36} color="#D1D5DB" />
                  </View>
                  <Text style={styles.emptyTitle}>해당 조건의 인연을 찾지 못했어요</Text>
                  <Text style={styles.emptySubtitle}>
                    필터를 초기화하거나 다른 관심사/검색어로 다시 둘러보세요.
                  </Text>
                  <TouchableOpacity
                    style={styles.resetFilterBtn}
                    onPress={() => {
                      setSeg('전체');
                      setSelectedInterest('');
                      setDiscoverSearchQuery('');
                      loadDiscoverUsers();
                    }}
                  >
                    <Text style={styles.resetFilterBtnText}>전체 인연 보기</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </View>
      ) : (
        /* =================================================================
            3-B. [내 대화 (Chats)] 뷰
            ================================================================= */
        <View style={styles.tabContentFlex}>
          {/* 검색바 (토글 시 노출) */}
          {isChatSearchOpen && (
            <View style={styles.searchBarWrap}>
              <View style={styles.searchInputBox}>
                <Ionicons name="search" size={16} color="#8E8E93" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="대화방 또는 메시지 검색"
                  placeholderTextColor="#8E8E93"
                  value={chatSearchQuery}
                  onChangeText={setChatSearchQuery}
                  autoFocus
                  clearButtonMode="while-editing"
                />
                {chatSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setChatSearchQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color="#8E8E93" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* 대화방 안내 및 카운터 바 */}
          <View style={styles.chatHeaderInfoBar}>
            <Text style={styles.chatCountText}>
              진행 중인 대화 <Text style={styles.userCountHighlight}>{filteredChats.length}</Text>개
            </Text>
            <Text style={styles.chatHintText}>길게 누르면 대화방을 나갈 수 있어요</Text>
          </View>

          {/* 대화방 목록 리스트 */}
          {chatsLoading ? (
            <View style={styles.stateWrap}>
              <ActivityIndicator size="large" color="#FEE500" />
              <Text style={styles.stateMessage}>대화 목록을 불러오는 중이에요...</Text>
            </View>
          ) : chatsError ? (
            <View style={styles.stateWrap}>
              <Text style={styles.errorTitle}>대화 목록을 불러오지 못했어요</Text>
              <Text style={styles.stateMessage}>{chatsError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadChats()}>
                <Text style={styles.retryButtonText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              style={styles.list}
              data={filteredChats}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <ChatListItem
                  item={item}
                  onPress={() => handleOpenChat(item)}
                  onLongPress={() => handleDeleteChat(item)}
                  onDeletePress={() => handleDeleteChat(item)}
                />
              )}
              ItemSeparatorComponent={() => <View style={styles.insetDivider} />}
              contentContainerStyle={[
                styles.listContent,
                !filteredChats.length && styles.emptyListContent,
              ]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={chatsRefreshing}
                  onRefresh={() => loadChats({ refresh: true })}
                  tintColor="#FEE500"
                  colors={['#FEE500']}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="chatbubbles" size={38} color="#D1D5DB" />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {chatSearchQuery ? '검색 결과가 없어요' : '아직 진행 중인 대화가 없어요'}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {chatSearchQuery
                      ? '다른 검색어로 다시 시도해 보세요.'
                      : "'인연 찾기'에서 마음에 드는 이웃에게 첫 메시지를 건네보세요!"}
                  </Text>
                  {!chatSearchQuery && (
                    <View style={styles.emptyActionRow}>
                      <TouchableOpacity
                        style={styles.emptyCreateBtn}
                        onPress={() => setActiveTab('discover')}
                        activeOpacity={0.88}
                      >
                        <Ionicons name="sparkles" size={17} color="#191919" />
                        <Text style={styles.emptyCreateBtnText}>인연 찾으러 가기</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.findFriendsBtn}
                        onPress={() => setCreateModalVisible(true)}
                        activeOpacity={0.88}
                      >
                        <Text style={styles.findFriendsBtnText}>방 개설하기</Text>
                        <Ionicons name="add" size={17} color="#191919" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              }
            />
          )}

          {/* 플로팅 채팅방 개설 버튼 (FAB) */}
          <TouchableOpacity
            style={styles.floatingCreateBtn}
            onPress={() => setCreateModalVisible(true)}
            activeOpacity={0.88}
          >
            <Ionicons name="chatbubbles" size={20} color="#191919" />
            <Text style={styles.floatingCreateBtnText}>방 만들기</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* =================================================================
          새 대화방 개설 모달 (참여 비용 자율 설정)
          ================================================================= */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setCreateModalVisible(false)}
              hitSlop={8}
            >
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>새 대화방 개설</Text>
            <TouchableOpacity
              onPress={handleCreateRoom}
              disabled={creating || !newTitle.trim()}
              style={[
                styles.modalSubmitButton,
                (!newTitle.trim() || creating) && styles.modalSubmitButtonDisabled,
              ]}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#191919" />
              ) : (
                <Text style={styles.modalSubmitText}>개설</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. 대화방 제목 */}
            <Text style={styles.inputLabel}>대화방 제목</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="예: 주말에 커피 한 잔 하실 분 ☕"
              placeholderTextColor="#8E8E93"
              value={newTitle}
              onChangeText={setNewTitle}
              maxLength={60}
              autoFocus
            />

            {/* 2. 대화 유형 */}
            <Text style={[styles.inputLabel, { marginTop: 22 }]}>대화 유형</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeChip, !isGroup && styles.typeChipActive]}
                onPress={() => setIsGroup(false)}
              >
                <Ionicons
                  name="person"
                  size={15}
                  color={!isGroup ? '#191919' : '#8E8E93'}
                />
                <Text
                  style={[styles.typeChipText, !isGroup && styles.typeChipTextActive]}
                >
                  1:1 대화방
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeChip, isGroup && styles.typeChipActive]}
                onPress={() => setIsGroup(true)}
              >
                <Ionicons
                  name="people"
                  size={15}
                  color={isGroup ? '#191919' : '#8E8E93'}
                />
                <Text
                  style={[styles.typeChipText, isGroup && styles.typeChipTextActive]}
                >
                  그룹 대화방
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. 카테고리 */}
            <Text style={[styles.inputLabel, { marginTop: 22 }]}>카테고리</Text>
            <View style={styles.categoryRow}>
              {CHAT_CATEGORIES.map((cat) => {
                const isSelected = newCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipActive,
                    ]}
                    onPress={() => setNewCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 4. 참여자 입장료 */}
            <Text style={[styles.inputLabel, { marginTop: 22 }]}>
              참여자 입장료 (참여 온 설정)
            </Text>
            <Text style={styles.inputSubLabel}>
              개설자가 직접 참여자 입장 시 소모될 온(ON)을 설정합니다. (0 온은 무료)
            </Text>
            <View style={styles.feeChipRow}>
              {[0, 10, 30, 50, 100].map((feeVal) => {
                const isSelected = newEntryFee === feeVal;
                return (
                  <TouchableOpacity
                    key={feeVal}
                    style={[
                      styles.feeChip,
                      isSelected && styles.feeChipActive,
                    ]}
                    onPress={() => setNewEntryFee(feeVal)}
                  >
                    <Text
                      style={[
                        styles.feeChipText,
                        isSelected && styles.feeChipTextActive,
                      ]}
                    >
                      {feeVal === 0 ? '무료' : `${feeVal} 온`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.customFeeRow}>
              <Text style={styles.customFeeLabel}>직접 입력:</Text>
              <TextInput
                style={styles.customFeeInput}
                placeholder="0"
                placeholderTextColor="#8E8E93"
                keyboardType="number-pad"
                value={String(newEntryFee)}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '');
                  const num = parseInt(cleaned, 10);
                  setNewEntryFee(isNaN(num) ? 0 : Math.min(num, 50000));
                }}
              />
              <Text style={styles.customFeeUnit}>온(ON)</Text>
            </View>

            {/* 5. 개설 안내 카드 */}
            <View style={styles.tipCard}>
              <Ionicons name="information-circle-outline" size={18} color="#D97706" />
              <Text style={styles.tipText}>
                대화방 개설 시 관리자 정책에 따른 온(ON)이 소모되며, 참여자는 개설자가 지정한 입장료({newEntryFee > 0 ? `${newEntryFee} 온` : '무료'})를 지불하고 참여하게 됩니다.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3F5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtn: {
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#191919',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE500',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 2,
  },
  headerCreateBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#191919',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* 듀얼 상단 세그먼트 탭 */
  dualTabWrap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  dualTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F4F4F5',
    borderRadius: 12,
    padding: 3,
  },
  dualTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  dualTabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dualTabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717A',
  },
  dualTabLabelActive: {
    fontWeight: '800',
    color: '#18181B',
  },
  dualTabBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dualTabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  tabContentFlex: {
    flex: 1,
  },

  /* 검색바 */
  searchBarWrap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3F5',
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#191919',
    paddingVertical: 0,
  },

  /* 인연 찾기 필터 영역 */
  discoverSegmentWrap: {
    backgroundColor: '#FFFFFF',
  },
  segmentBarInner: {
    paddingVertical: 8,
  },
  interestWrap: {
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  interestScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  interestChipActive: {
    backgroundColor: '#FFFBE6',
    borderColor: '#FEE500',
  },
  interestChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717A',
  },
  interestChipTextActive: {
    color: '#191919',
    fontWeight: '800',
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3F5',
  },
  userCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
  },
  userCountHighlight: {
    color: '#18181B',
    fontWeight: '800',
  },
  sortBtnsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  sortBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sortBtnActive: {
    backgroundColor: '#E4E4E7',
  },
  sortBtnText: {
    fontSize: 12,
    color: '#A1A1AA',
    fontWeight: '600',
  },
  sortBtnTextActive: {
    color: '#18181B',
    fontWeight: '800',
  },

  /* 내 대화 헤더 인포 바 */
  chatHeaderInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3F5',
  },
  chatCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
  },
  chatHintText: {
    fontSize: 11,
    color: '#A1A1AA',
    fontWeight: '500',
  },

  /* 리스트 */
  list: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  discoverListContent: {
    paddingBottom: 24,
  },
  listContent: {
    paddingBottom: 80,
  },
  insetDivider: {
    height: 1,
    backgroundColor: '#F4F4F5',
    marginLeft: 82,
  },

  /* 상태 & 엠티 뷰 */
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  stateMessage: {
    marginTop: 14,
    fontSize: 14,
    color: '#71717A',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#191919',
    marginBottom: 6,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#FEE500',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 18,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#191919',
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#191919',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE500',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#FEE500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyCreateBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#191919',
  },
  findFriendsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  findFriendsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191919',
  },
  resetFilterBtn: {
    backgroundColor: '#FEE500',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 18,
    marginTop: 6,
  },
  resetFilterBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#191919',
  },

  /* 플로팅 방 만들기 버튼 */
  floatingCreateBtn: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE500',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  floatingCreateBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#191919',
  },

  /* 모달 */
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3F5',
  },
  modalCancelText: {
    fontSize: 15,
    color: '#71717A',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#191919',
  },
  modalSubmitButton: {
    backgroundColor: '#FEE500',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  modalSubmitButtonDisabled: {
    backgroundColor: '#E4E4E7',
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#191919',
  },
  modalBody: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191919',
    marginBottom: 8,
  },
  inputSubLabel: {
    fontSize: 12,
    color: '#71717A',
    marginBottom: 10,
  },
  modalInput: {
    backgroundColor: '#F4F4F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#191919',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  typeChipActive: {
    backgroundColor: '#FFFBE6',
    borderColor: '#FEE500',
    borderWidth: 1.5,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  typeChipTextActive: {
    color: '#191919',
    fontWeight: '800',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  categoryChipActive: {
    backgroundColor: '#FFFBE6',
    borderColor: '#FEE500',
    borderWidth: 1.5,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
  },
  categoryChipTextActive: {
    color: '#191919',
    fontWeight: '800',
  },
  feeChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  feeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  feeChipActive: {
    backgroundColor: '#FFFBE6',
    borderColor: '#FEE500',
    borderWidth: 1.5,
  },
  feeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
  },
  feeChipTextActive: {
    color: '#191919',
    fontWeight: '800',
  },
  customFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  customFeeLabel: {
    fontSize: 13,
    color: '#71717A',
    fontWeight: '600',
  },
  customFeeInput: {
    minWidth: 80,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    color: '#191919',
    textAlign: 'right',
  },
  customFeeUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: '#71717A',
  },
  tipCard: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
});
