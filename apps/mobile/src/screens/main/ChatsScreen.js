import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import { apiClient } from '../../api/client';
import ScrollExpandableFAB from '../../components/common/ScrollExpandableFAB';
import SudaCreateModal from '../../components/suda/SudaCreateModal';
import {
  fetchSudaPosts,
  fetchChatRooms,
} from '../../services/sudaService';

const { width } = Dimensions.get('window');

// 전국 단위 초기 친구들 목록 (전남, 전북 등 전국 17개 시도 고루 배치)
const INITIAL_FRIENDS = [
  {
    id: 'friend-1',
    nickname: '민지 (모꼬지)',
    gender: '여성',
    age: 26,
    region: '서울',
    subRegion: '강남구',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    statusMessage: '오늘 날씨 너무 좋아요 ☀️ 실시간 소통 환영해요!',
    isOnline: true,
  },
  {
    id: 'friend-2',
    nickname: '준호',
    gender: '남성',
    age: 29,
    region: '전남',
    subRegion: '여수시',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    statusMessage: '여수 밤바다 보며 일상 수다 나눌 친구 찾아요 🌊',
    isOnline: true,
  },
  {
    id: 'friend-3',
    nickname: '지은',
    gender: '여성',
    age: 24,
    region: '전북',
    subRegion: '전주시',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    statusMessage: '한옥마을 카페 투어 & 음악 감상 좋아합니다 ☕',
    isOnline: true,
  },
  {
    id: 'friend-4',
    nickname: '도윤',
    gender: '남성',
    age: 34,
    region: '부산',
    subRegion: '해운대구',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    statusMessage: '비즈니스 & 맛집 정보 공유해요 ✨',
    isOnline: true,
  },
  {
    id: 'friend-5',
    nickname: '하은',
    gender: '여성',
    age: 31,
    region: '경기',
    subRegion: '성남시 분당',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
    statusMessage: '퇴근 후 소소한 대화 신청 환영해요!',
    isOnline: true,
  },
  {
    id: 'friend-6',
    nickname: '태우',
    gender: '남성',
    age: 42,
    region: '인천',
    subRegion: '송도',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
    statusMessage: '골프 & 등산 취미 나누실 분 계신가요 ⛳',
    isOnline: false,
  },
  {
    id: 'friend-7',
    nickname: '수진',
    gender: '여성',
    age: 38,
    region: '대전',
    subRegion: '유성구',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300',
    statusMessage: '책 읽고 소소하게 이야기 나누는 것 좋아해요 📚',
    isOnline: true,
  },
  {
    id: 'friend-8',
    nickname: '현우',
    gender: '남성',
    age: 23,
    region: '광주',
    subRegion: '상무지구',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300',
    statusMessage: '대학생 일상 소통! 편하게 대화해요 🎧',
    isOnline: false,
  },
  {
    id: 'friend-9',
    nickname: '미숙',
    gender: '여성',
    age: 52,
    region: '강원',
    subRegion: '춘천시',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300',
    statusMessage: '자연과 꽃 가꾸기 좋아하는 편안한 이웃입니다 🌸',
    isOnline: true,
  },
  {
    id: 'friend-10',
    nickname: '재원',
    gender: '남성',
    age: 55,
    region: '제주',
    subRegion: '제주시',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
    statusMessage: '제주 라이프 5년차, 여행 꿀팁 알려드려요 🍊',
    isOnline: true,
  },
  {
    id: 'friend-11',
    nickname: '영호',
    gender: '남성',
    age: 36,
    region: '대구',
    subRegion: '수성구',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    statusMessage: '주말 러닝 크루 메이트 구합니다 🏃‍♂️',
    isOnline: true,
  },
  {
    id: 'friend-12',
    nickname: '유리',
    gender: '여성',
    age: 28,
    region: '충남',
    subRegion: '천안시',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    statusMessage: '반려견 산책 같이 할 친구 환영해요 🐶',
    isOnline: true,
  },
];

// 전국 17대 시/도 옵션 (전남, 전북, 서울, 부산, 경기 등 순서 배치)
const REGION_OPTIONS = [
  '전체',
  '전남',
  '전북',
  '서울',
  '부산',
  '경기',
  '인천',
  '대구',
  '대전',
  '광주',
  '울산',
  '세종',
  '강원',
  '충북',
  '충남',
  '경북',
  '경남',
  '제주',
];

const GENDER_OPTIONS = ['전체', '여성', '남성'];

// 슬라이더 기본 상수
const MIN_POSSIBLE_AGE = 20;
const MAX_POSSIBLE_AGE = 65;

export default function ChatsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  // 3대 메인 탭: 'FRIENDS' (친구들) vs 'SUDA' (전체수다) vs 'CHATS' (대화함)
  const [activeMainTab, setActiveMainTab] = useState('FRIENDS');

  // 대화함 서브 세그먼트: 'SUDA' (수다 톡) vs 'MARKET' (거래 톡)
  const [activeChatSubTab, setActiveChatSubTab] = useState('SUDA');

  // 필터 상태 (지역, 성별, 연령 범위)
  const [filterRegion, setFilterRegion] = useState('전체');
  const [filterGender, setFilterGender] = useState('전체');
  const [minAge, setMinAge] = useState(MIN_POSSIBLE_AGE);
  const [maxAge, setMaxAge] = useState(MAX_POSSIBLE_AGE);
  const [isAgeAll, setIsAgeAll] = useState(true); // true면 전체 연령

  // 인라인 드롭다운 아코디언 상태 ('REGION' | 'GENDER' | 'AGE' | null)
  const [openDropdown, setOpenDropdown] = useState(null);

  // 데이터 상태
  const [friendsList, setFriendsList] = useState(INITIAL_FRIENDS);
  const [sudaPosts, setSudaPosts] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 프로필 모달 상태
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // FAB 가변 스크롤 상태
  const [isFabExpanded, setIsFabExpanded] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const lastScrollY = useRef(0);

  // 슬라이더 트랙 너비 측정
  const [trackWidth, setTrackWidth] = useState(width - 64);

  // 드롭다운 토글
  const toggleDropdown = (type) => {
    setOpenDropdown((prev) => (prev === type ? null : type));
  };

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      if (activeMainTab === 'FRIENDS') {
        try {
          const res = await apiClient.getDiscover();
          const items = Array.isArray(res) ? res : res?.items || res?.data;
          if (Array.isArray(items) && items.length > 0) {
            const mapped = items.map((u, idx) => ({
              id: u.id || `user-${idx}`,
              nickname: u.displayName || u.profile?.nickname || `모꼬이웃${idx + 1}`,
              gender: u.gender === 'female' ? '여성' : u.gender === 'male' ? '남성' : (idx % 2 === 0 ? '여성' : '남성'),
              age: typeof u.age === 'number' ? u.age : (22 + (idx * 3) % 35),
              region: u.region1 || REGION_OPTIONS[(idx % 16) + 1] || '서울',
              subRegion: u.region2 || '',
              avatarUrl: u.avatar || u.profile?.avatarUri || INITIAL_FRIENDS[idx % INITIAL_FRIENDS.length].avatarUrl,
              statusMessage: u.headline || u.profile?.headline || '새로운 모꼬 인연을 기다려요 ✨',
              isOnline: Boolean(u.profile?.lastSeenAt) || idx % 2 === 0,
            }));
            setFriendsList(mapped);
          }
        } catch {
          // fallback to INITIAL_FRIENDS
        }
      } else if (activeMainTab === 'SUDA') {
        const posts = await fetchSudaPosts();
        setSudaPosts(posts);
      } else {
        const rooms = await fetchChatRooms(activeChatSubTab);
        setChatRooms(rooms);
      }
    } catch (err) {
      console.warn('[ChatsScreen] load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeMainTab, activeChatSubTab]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleScroll = (event: any) => {
    const currentY = event.nativeEvent.contentOffset.y;
    if (currentY <= 15) {
      setIsFabExpanded(true);
    } else if (currentY > lastScrollY.current + 8) {
      setIsFabExpanded(false);
    } else if (currentY < lastScrollY.current - 12) {
      setIsFabExpanded(true);
    }
    lastScrollY.current = currentY;
  };

  // 1:1 대화방 이동
  const handleStartDirectChat = (targetUser: any) => {
    setProfileModalVisible(false);
    navigation.navigate('ChatRoom', {
      id: `direct_${targetUser.id}`,
      chatId: `direct_${targetUser.id}`,
      peerId: targetUser.id,
      peerName: targetUser.nickname || targetUser.name,
      title: targetUser.nickname || targetUser.name,
      initialType: 'SUDA',
      user: {
        id: targetUser.id,
        name: targetUser.nickname || targetUser.name,
        displayName: targetUser.nickname || targetUser.name,
        avatar: targetUser.avatarUrl || targetUser.avatar,
        avatarUrl: targetUser.avatarUrl || targetUser.avatar,
        location: targetUser.region || targetUser.neighborhood || '전국',
      },
    });
  };

  // 필터링된 친구들 목록 (지역 / 성별 / 연령 범위)
  const filteredFriends = useMemo(() => {
    return friendsList.filter((item) => {
      // 지역 필터
      if (filterRegion !== '전체' && !item.region.includes(filterRegion)) {
        return false;
      }
      // 성별 필터
      if (filterGender !== '전체' && item.gender !== filterGender) {
        return false;
      }
      // 연령 범위 필터 (isAgeAll이 아닐 때)
      if (!isAgeAll) {
        const age = Number(item.age) || 25;
        if (age < minAge || age > maxAge) {
          return false;
        }
      }
      return true;
    });
  }, [friendsList, filterRegion, filterGender, isAgeAll, minAge, maxAge]);

  // 필터링된 전체수다 목록
  const filteredSudaPosts = useMemo(() => {
    return sudaPosts.filter((post: any) => {
      if (filterRegion !== '전체') {
        const postReg = post.neighborhood || post.author?.neighborhood || '';
        if (!postReg.includes(filterRegion)) return false;
      }
      return true;
    });
  }, [sudaPosts, filterRegion]);

  // 슬라이더 트랙 터치 처리
  const handleSliderTrackTouch = (evt) => {
    if (trackWidth <= 0) return;
    const touchX = evt.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, touchX / trackWidth));
    const targetAge = Math.round(MIN_POSSIBLE_AGE + ratio * (MAX_POSSIBLE_AGE - MIN_POSSIBLE_AGE));

    setIsAgeAll(false);
    const distMin = Math.abs(targetAge - minAge);
    const distMax = Math.abs(targetAge - maxAge);
    if (distMin <= distMax) {
      if (targetAge <= maxAge) {
        setMinAge(targetAge);
      } else {
        setMinAge(maxAge);
      }
    } else {
      if (targetAge >= minAge) {
        setMaxAge(targetAge);
      } else {
        setMaxAge(minAge);
      }
    }
  };

  // 1. [친구들] 한 줄(Row) 항목 렌더링 (아담하고 조화로운 대화신청 버튼)
  const renderFriendItem = ({ item }) => (
    <View style={styles.friendRowCard}>
      {/* 좌측 아바타: 터치 시 프로필 창 팝업 */}
      <TouchableOpacity
        style={styles.friendAvatarWrapper}
        activeOpacity={0.85}
        onPress={() => {
          setSelectedProfileUser(item);
          setProfileModalVisible(true);
        }}
      >
        <Image source={{ uri: item.avatarUrl }} style={styles.friendAvatar} />
        {item.isOnline && <View style={styles.friendOnlineBadge} />}
      </TouchableOpacity>

      {/* 중앙 텍스트 정보 */}
      <TouchableOpacity
        style={styles.friendInfoCol}
        activeOpacity={0.85}
        onPress={() => {
          setSelectedProfileUser(item);
          setProfileModalVisible(true);
        }}
      >
        <View style={styles.friendNameRow}>
          <Text style={styles.friendName} numberOfLines={1}>{item.nickname}</Text>
          <View style={styles.friendGenderBadge}>
            <Text style={styles.friendGenderText}>
              {item.gender ? `${item.gender === '여성' ? '여' : '남'} · ${item.age}세` : `${item.age}세`}
            </Text>
          </View>
          <View style={styles.friendRegionBadge}>
            <Text style={styles.friendRegionText}>{item.region} {item.subRegion}</Text>
          </View>
        </View>
        <Text style={styles.friendStatusMsg} numberOfLines={1}>
          {item.statusMessage || '반가워요! 편하게 대화 걸어주세요 ✨'}
        </Text>
      </TouchableOpacity>

      {/* 우측 조화로운 소프트 틴트 [대화신청] 버튼 */}
      <TouchableOpacity
        style={styles.applyChatBtn}
        activeOpacity={0.8}
        onPress={() => handleStartDirectChat(item)}
      >
        <Ionicons name="chatbubble-outline" size={12} color="#E11D48" />
        <Text style={styles.applyChatBtnText}>대화신청</Text>
      </TouchableOpacity>
    </View>
  );

  // 2. [전체수다] 항목 렌더링
  const renderSudaItem = ({ item }) => (
    <View style={styles.sudaCard}>
      <View style={styles.sudaHeader}>
        <TouchableOpacity
          style={styles.sudaAuthorLeft}
          activeOpacity={0.85}
          onPress={() => {
            setSelectedProfileUser({
              id: item.author.id,
              nickname: item.author.nickname,
              avatarUrl: item.author.avatarUrl,
              region: item.neighborhood,
              subRegion: '',
              gender: '회원',
              age: 26,
              statusMessage: item.content,
              isOnline: true,
            });
            setProfileModalVisible(true);
          }}
        >
          <Image source={{ uri: item.author.avatarUrl }} style={styles.authorAvatar} />
          <View style={styles.authorInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName}>{item.author.nickname}</Text>
              <View style={styles.neighborhoodBadge}>
                <Text style={styles.neighborhoodText}>{item.neighborhood}</Text>
              </View>
              <Text style={styles.distanceText}>· {item.distanceKm}km</Text>
            </View>
            <Text style={styles.timeText}>{item.createdAt}</Text>
          </View>
        </TouchableOpacity>

        {/* 우측 슬림 [대화신청] 버튼 */}
        <TouchableOpacity
          style={styles.applyChatBtn}
          activeOpacity={0.8}
          onPress={() =>
            handleStartDirectChat({
              id: item.author.id,
              nickname: item.author.nickname,
              avatarUrl: item.author.avatarUrl,
              region: item.neighborhood,
            })
          }
        >
          <Ionicons name="chatbubble-outline" size={12} color="#E11D48" />
          <Text style={styles.applyChatBtnText}>대화신청</Text>
        </TouchableOpacity>
      </View>

      {/* 1줄 본문 */}
      <Text style={styles.sudaContent}>{item.content}</Text>
    </View>
  );

  // 3. [대화함] 항목 렌더링
  const renderChatRoomItem = ({ item }) => {
    const isMarket = item.type === 'MARKET';

    return (
      <TouchableOpacity
        style={styles.chatRoomCard}
        activeOpacity={0.8}
        onPress={() => {
          navigation.navigate('ChatRoom', {
            id: item.id,
            chatId: item.id,
            peerId: item.peer.id,
            peerName: item.peer.nickname,
            marketOrder: item.marketOrder,
            user: item.peer,
          });
        }}
      >
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: item.peer.avatarUrl }} style={styles.peerAvatar} />
          {item.peer.isOnline && <View style={styles.onlineBadge} />}
        </View>

        <View style={styles.chatRoomContent}>
          <View style={styles.chatRoomHeaderRow}>
            <View style={styles.peerNameRow}>
              <Text style={styles.peerName}>{item.peer.nickname}</Text>
              {isMarket && (
                <View style={styles.marketBadge}>
                  <Text style={styles.marketBadgeText}>거래톡</Text>
                </View>
              )}
            </View>
            <Text style={styles.chatTimeText}>{item.lastMessageTime}</Text>
          </View>

          {isMarket && item.marketOrder && (
            <View style={styles.orderSummaryBar}>
              <Image source={{ uri: item.marketOrder.productImage }} style={styles.orderThumb} />
              <View style={styles.orderTextBox}>
                <Text style={styles.orderTitle} numberOfLines={1}>
                  {item.marketOrder.productTitle}
                </Text>
                <Text style={styles.orderPrice}>
                  {item.marketOrder.price.toLocaleString()} MC
                </Text>
              </View>
              <View style={styles.escrowStateTag}>
                <Text style={styles.escrowStateText}>
                  {item.marketOrder.escrowStatus === 'ESCROW_HOLD' ? '보호예치중' : '발송완료'}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.lastMessageRow}>
            <Text style={styles.lastMessageText} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCountText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 1. 상단 모꼬쳇 공식 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>모꼬쳇</Text>
          <View style={styles.locationBadge}>
            <Ionicons name="globe-outline" size={12} color="#FF3B6B" />
            <Text style={styles.locationBadgeText}>전국 실시간 소통</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
            <Ionicons name="search-outline" size={22} color={tokens.colors.textPrimary} />
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

      {/* 2. 상단 3대 서브탭 버튼: [친구들] / [전체수다] / [대화함] */}
      <View style={styles.mainSegmentContainer}>
        <TouchableOpacity
          style={[styles.mainSegmentBtn, activeMainTab === 'FRIENDS' && styles.mainSegmentBtnActive]}
          onPress={() => {
            setActiveMainTab('FRIENDS');
            setOpenDropdown(null);
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="people"
            size={16}
            color={activeMainTab === 'FRIENDS' ? '#FF3B6B' : '#64748B'}
          />
          <Text
            style={[
              styles.mainSegmentText,
              activeMainTab === 'FRIENDS' && styles.mainSegmentTextActive,
            ]}
          >
            친구들
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainSegmentBtn, activeMainTab === 'SUDA' && styles.mainSegmentBtnActive]}
          onPress={() => {
            setActiveMainTab('SUDA');
            setOpenDropdown(null);
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="chatbubbles"
            size={16}
            color={activeMainTab === 'SUDA' ? '#FF3B6B' : '#64748B'}
          />
          <Text
            style={[
              styles.mainSegmentText,
              activeMainTab === 'SUDA' && styles.mainSegmentTextActive,
            ]}
          >
            전체수다
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainSegmentBtn, activeMainTab === 'CHATS' && styles.mainSegmentBtnActive]}
          onPress={() => {
            setActiveMainTab('CHATS');
            setOpenDropdown(null);
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="mail-unread"
            size={16}
            color={activeMainTab === 'CHATS' ? '#FF3B6B' : '#64748B'}
          />
          <Text
            style={[
              styles.mainSegmentText,
              activeMainTab === 'CHATS' && styles.mainSegmentTextActive,
            ]}
          >
            대화함
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. [친구들] 및 [전체수다] 하부 필터 바: 균등 분할 정렬된 [지역] / [성별] / [연령] */}
      {(activeMainTab === 'FRIENDS' || activeMainTab === 'SUDA') && (
        <View style={styles.filterSection}>
          <View style={styles.filterBarContainer}>
            {/* 지역 버튼 */}
            <TouchableOpacity
              style={[styles.filterBtn, (filterRegion !== '전체' || openDropdown === 'REGION') && styles.filterBtnActive]}
              activeOpacity={0.8}
              onPress={() => toggleDropdown('REGION')}
            >
              <Ionicons
                name="location-sharp"
                size={12}
                color={filterRegion !== '전체' || openDropdown === 'REGION' ? '#FF3B6B' : '#64748B'}
              />
              <Text
                style={[
                  styles.filterBtnText,
                  (filterRegion !== '전체' || openDropdown === 'REGION') && styles.filterBtnTextActive,
                ]}
                numberOfLines={1}
              >
                {filterRegion === '전체' ? '지역: 전체' : filterRegion}
              </Text>
              <Ionicons
                name={openDropdown === 'REGION' ? 'chevron-up' : 'chevron-down'}
                size={12}
                color={filterRegion !== '전체' || openDropdown === 'REGION' ? '#FF3B6B' : '#94A3B8'}
              />
            </TouchableOpacity>

            {/* 성별 버튼 */}
            <TouchableOpacity
              style={[styles.filterBtn, (filterGender !== '전체' || openDropdown === 'GENDER') && styles.filterBtnActive]}
              activeOpacity={0.8}
              onPress={() => toggleDropdown('GENDER')}
            >
              <Ionicons
                name="people-sharp"
                size={12}
                color={filterGender !== '전체' || openDropdown === 'GENDER' ? '#FF3B6B' : '#64748B'}
              />
              <Text
                style={[
                  styles.filterBtnText,
                  (filterGender !== '전체' || openDropdown === 'GENDER') && styles.filterBtnTextActive,
                ]}
                numberOfLines={1}
              >
                {filterGender === '전체' ? '성별: 전체' : filterGender}
              </Text>
              <Ionicons
                name={openDropdown === 'GENDER' ? 'chevron-up' : 'chevron-down'}
                size={12}
                color={filterGender !== '전체' || openDropdown === 'GENDER' ? '#FF3B6B' : '#94A3B8'}
              />
            </TouchableOpacity>

            {/* 연령 버튼 (몇세~몇세) */}
            <TouchableOpacity
              style={[styles.filterBtn, (!isAgeAll || openDropdown === 'AGE') && styles.filterBtnActive]}
              activeOpacity={0.8}
              onPress={() => toggleDropdown('AGE')}
            >
              <Ionicons
                name="calendar-sharp"
                size={12}
                color={!isAgeAll || openDropdown === 'AGE' ? '#FF3B6B' : '#64748B'}
              />
              <Text
                style={[
                  styles.filterBtnText,
                  (!isAgeAll || openDropdown === 'AGE') && styles.filterBtnTextActive,
                ]}
                numberOfLines={1}
              >
                {isAgeAll ? '연령: 전체' : `${minAge}~${maxAge}세`}
              </Text>
              <Ionicons
                name={openDropdown === 'AGE' ? 'chevron-up' : 'chevron-down'}
                size={12}
                color={!isAgeAll || openDropdown === 'AGE' ? '#FF3B6B' : '#94A3B8'}
              />
            </TouchableOpacity>
          </View>

          {/* 인라인 드롭다운: 1. [지역 목록] 아래로 촤르륵 펼쳐짐 */}
          {openDropdown === 'REGION' && (
            <View style={styles.dropdownPanel}>
              <View style={styles.dropdownPanelHeader}>
                <Text style={styles.dropdownPanelTitle}>📍 지역을 선택하세요</Text>
                <TouchableOpacity onPress={() => setOpenDropdown(null)}>
                  <Ionicons name="close-circle" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.regionListScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator={true}
              >
                {REGION_OPTIONS.map((reg) => (
                  <TouchableOpacity
                    key={reg}
                    style={[
                      styles.regionItemRow,
                      filterRegion === reg && styles.regionItemRowSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setFilterRegion(reg);
                      setOpenDropdown(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.regionItemText,
                        filterRegion === reg && styles.regionItemTextSelected,
                      ]}
                    >
                      {reg === '전체' ? '🌐 전체 지역' : reg}
                    </Text>
                    {filterRegion === reg && (
                      <Ionicons name="checkmark-sharp" size={18} color="#FF3B6B" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* 인라인 드롭다운: 2. [성별 목록] */}
          {openDropdown === 'GENDER' && (
            <View style={styles.dropdownPanel}>
              <View style={styles.dropdownPanelHeader}>
                <Text style={styles.dropdownPanelTitle}>👥 성별을 선택하세요</Text>
                <TouchableOpacity onPress={() => setOpenDropdown(null)}>
                  <Ionicons name="close-circle" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <View style={styles.genderOptionsContainer}>
                {GENDER_OPTIONS.map((gen) => (
                  <TouchableOpacity
                    key={gen}
                    style={[
                      styles.genderOptionBtn,
                      filterGender === gen && styles.genderOptionBtnSelected,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => {
                      setFilterGender(gen);
                      setOpenDropdown(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.genderOptionText,
                        filterGender === gen && styles.genderOptionTextSelected,
                      ]}
                    >
                      {gen === '전체' ? '전체 (모두)' : gen}
                    </Text>
                    {filterGender === gen && (
                      <Ionicons name="checkmark" size={16} color="#FF3B6B" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* 인라인 드롭다운: 3. [연령 레인지 슬라이더] 몇세~몇세 설정 */}
          {openDropdown === 'AGE' && (
            <View style={styles.dropdownPanel}>
              <View style={styles.dropdownPanelHeader}>
                <Text style={styles.dropdownPanelTitle}>🎂 연령 범위 설정</Text>
                <TouchableOpacity onPress={() => setOpenDropdown(null)}>
                  <Ionicons name="close-circle" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* 현재 선택 연령 디스플레이 */}
              <View style={styles.ageDisplayBox}>
                <Text style={styles.ageDisplayText}>
                  {isAgeAll ? '전체 연령대 (모든 회원)' : `${minAge}세  ~  ${maxAge}세`}
                </Text>
              </View>

              {/* 슬라이더 트랙 인터랙티브 바 */}
              <View
                style={styles.sliderTrackWrapper}
                onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                onTouchEnd={handleSliderTrackTouch}
              >
                <View style={styles.sliderTrackBg}>
                  {/* 선택된 하이라이트 구간 */}
                  {!isAgeAll && (
                    <View
                      style={[
                        styles.sliderHighlightBar,
                        {
                          left: `${((minAge - MIN_POSSIBLE_AGE) / (MAX_POSSIBLE_AGE - MIN_POSSIBLE_AGE)) * 100}%`,
                          right: `${(1 - (maxAge - MIN_POSSIBLE_AGE) / (MAX_POSSIBLE_AGE - MIN_POSSIBLE_AGE)) * 100}%`,
                        },
                      ]}
                    />
                  )}
                  {/* Min Thumb */}
                  {!isAgeAll && (
                    <View
                      style={[
                        styles.sliderThumb,
                        {
                          left: `${((minAge - MIN_POSSIBLE_AGE) / (MAX_POSSIBLE_AGE - MIN_POSSIBLE_AGE)) * 100}%`,
                          marginLeft: -10,
                        },
                      ]}
                    />
                  )}
                  {/* Max Thumb */}
                  {!isAgeAll && (
                    <View
                      style={[
                        styles.sliderThumb,
                        {
                          left: `${((maxAge - MIN_POSSIBLE_AGE) / (MAX_POSSIBLE_AGE - MIN_POSSIBLE_AGE)) * 100}%`,
                          marginLeft: -10,
                        },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.sliderScaleLabels}>
                  <Text style={styles.scaleText}>20세</Text>
                  <Text style={styles.scaleText}>30세</Text>
                  <Text style={styles.scaleText}>40세</Text>
                  <Text style={styles.scaleText}>50세</Text>
                  <Text style={styles.scaleText}>65세</Text>
                </View>
              </View>

              {/* 직관적인 세밀 조절 스텝 버튼 */}
              <View style={styles.ageStepRow}>
                <View style={styles.stepControlCol}>
                  <Text style={styles.stepLabel}>최소 연령</Text>
                  <View style={styles.stepBtnGroup}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => {
                        setIsAgeAll(false);
                        setMinAge((v) => Math.max(MIN_POSSIBLE_AGE, v - 1));
                      }}
                    >
                      <Ionicons name="remove" size={16} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={styles.stepValueText}>{minAge}세</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => {
                        setIsAgeAll(false);
                        setMinAge((v) => Math.min(maxAge, v + 1));
                      }}
                    >
                      <Ionicons name="add" size={16} color="#0F172A" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.stepDivider} />

                <View style={styles.stepControlCol}>
                  <Text style={styles.stepLabel}>최대 연령</Text>
                  <View style={styles.stepBtnGroup}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => {
                        setIsAgeAll(false);
                        setMaxAge((v) => Math.max(minAge, v - 1));
                      }}
                    >
                      <Ionicons name="remove" size={16} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={styles.stepValueText}>{maxAge}세</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => {
                        setIsAgeAll(false);
                        setMaxAge((v) => Math.min(MAX_POSSIBLE_AGE, v + 1));
                      }}
                    >
                      <Ionicons name="add" size={16} color="#0F172A" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* 빠른 프리셋 칩 */}
              <View style={styles.presetChipsRow}>
                <TouchableOpacity
                  style={[styles.presetChip, isAgeAll && styles.presetChipActive]}
                  onPress={() => {
                    setIsAgeAll(true);
                    setMinAge(MIN_POSSIBLE_AGE);
                    setMaxAge(MAX_POSSIBLE_AGE);
                  }}
                >
                  <Text style={[styles.presetChipText, isAgeAll && styles.presetChipTextActive]}>
                    전체
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.presetChip, !isAgeAll && minAge === 20 && maxAge === 29 && styles.presetChipActive]}
                  onPress={() => {
                    setIsAgeAll(false);
                    setMinAge(20);
                    setMaxAge(29);
                  }}
                >
                  <Text style={[styles.presetChipText, !isAgeAll && minAge === 20 && maxAge === 29 && styles.presetChipTextActive]}>
                    20대
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.presetChip, !isAgeAll && minAge === 30 && maxAge === 39 && styles.presetChipActive]}
                  onPress={() => {
                    setIsAgeAll(false);
                    setMinAge(30);
                    setMaxAge(39);
                  }}
                >
                  <Text style={[styles.presetChipText, !isAgeAll && minAge === 30 && maxAge === 39 && styles.presetChipTextActive]}>
                    30대
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.presetChip, !isAgeAll && minAge === 40 && maxAge === 49 && styles.presetChipActive]}
                  onPress={() => {
                    setIsAgeAll(false);
                    setMinAge(40);
                    setMaxAge(49);
                  }}
                >
                  <Text style={[styles.presetChipText, !isAgeAll && minAge === 40 && maxAge === 49 && styles.presetChipTextActive]}>
                    40대
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.presetChip, !isAgeAll && minAge === 50 && maxAge === 65 && styles.presetChipActive]}
                  onPress={() => {
                    setIsAgeAll(false);
                    setMinAge(50);
                    setMaxAge(65);
                  }}
                >
                  <Text style={[styles.presetChipText, !isAgeAll && minAge === 50 && maxAge === 65 && styles.presetChipTextActive]}>
                    50대+
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 완료 버튼 */}
              <TouchableOpacity
                style={styles.confirmAgeBtn}
                activeOpacity={0.85}
                onPress={() => setOpenDropdown(null)}
              >
                <Text style={styles.confirmAgeBtnText}>설정 완료</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* 4. [대화함] 선택 시 서브 세그먼트: [수다 톡] vs [거래 톡] */}
      {activeMainTab === 'CHATS' && (
        <View style={styles.subSegmentContainer}>
          <TouchableOpacity
            style={[
              styles.subSegmentPill,
              activeChatSubTab === 'SUDA' && styles.subSegmentPillActive,
            ]}
            onPress={() => setActiveChatSubTab('SUDA')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.subSegmentText,
                activeChatSubTab === 'SUDA' && styles.subSegmentTextActive,
              ]}
            >
              수다 톡
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.subSegmentPill,
              activeChatSubTab === 'MARKET' && styles.subSegmentPillActive,
            ]}
            onPress={() => setActiveChatSubTab('MARKET')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.subSegmentText,
                activeChatSubTab === 'MARKET' && styles.subSegmentTextActive,
              ]}
            >
              거래 톡
            </Text>
            <View style={styles.safeTag}>
              <Text style={styles.safeTagText}>에스크로</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* 5. 본문 리스트 (친구들 한줄 목록 OR 전체수다 목록 OR 대화함 목록) */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      ) : activeMainTab === 'FRIENDS' ? (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriendItem}
          contentContainerStyle={styles.listContent}
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
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>조건에 맞는 친구가 없습니다</Text>
              <Text style={styles.emptySub}>지역/성별/연령 필터 설정을 변경해보세요!</Text>
            </View>
          }
        />
      ) : activeMainTab === 'SUDA' ? (
        <FlatList
          data={filteredSudaPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderSudaItem}
          contentContainerStyle={styles.listContent}
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
            <View style={styles.emptyBox}>
              <Ionicons name="chatbubbles-outline" size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>등록된 수다가 없습니다</Text>
              <Text style={styles.emptySub}>새로운 수다를 가장 먼저 시작해보세요!</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={chatRooms}
          keyExtractor={(item) => item.id}
          renderItem={renderChatRoomItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tokens.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="mail-open-outline" size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>대화 내역이 없습니다</Text>
              <Text style={styles.emptySub}>
                {activeChatSubTab === 'SUDA'
                  ? '친구들 목록에서 마음에 드는 이웃에게 대화를 신청해보세요!'
                  : '마켓에서 상품을 선택하고 안전거래 톡을 시작해보세요!'}
              </Text>
            </View>
          }
        />
      )}

      {/* 6. [전체수다] 탭일 때 우측 하단 가변 FAB: + 글쓰기 */}
      {activeMainTab === 'SUDA' && (
        <ScrollExpandableFAB
          label="글쓰기"
          iconName="pencil"
          isExpanded={isFabExpanded}
          onPress={() => setShowCreateModal(true)}
        />
      )}

      {/* 7. 1줄 수다 작성 모달 */}
      <SudaCreateModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          loadData();
        }}
      />

      {/* 8. 회원 아바타 터치 시 [프로필 확인 모달] (1:1 대화 신청 단독, 1:1 통화 완전 삭제) */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setProfileModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.bottomSheetCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />

            {selectedProfileUser && (
              <View style={styles.sheetContent}>
                <Image
                  source={{ uri: selectedProfileUser.avatarUrl }}
                  style={styles.sheetAvatar}
                />
                <Text style={styles.sheetNickname}>{selectedProfileUser.nickname}</Text>
                <View style={styles.sheetMetaRow}>
                  <View style={styles.sheetLocationChip}>
                    <Ionicons name="location-sharp" size={12} color="#FF3B6B" />
                    <Text style={styles.sheetLocationText}>
                      {selectedProfileUser.region} {selectedProfileUser.subRegion || ''}
                    </Text>
                  </View>
                  {selectedProfileUser.gender && (
                    <View style={styles.sheetGenderChip}>
                      <Text style={styles.sheetGenderText}>
                        {selectedProfileUser.gender} · {selectedProfileUser.age}세
                      </Text>
                    </View>
                  )}
                  {selectedProfileUser.isOnline && (
                    <View style={styles.sheetOnlineChip}>
                      <View style={styles.onlineStatusDotSmall} />
                      <Text style={styles.sheetOnlineText}>실시간 접속 중</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.sheetStatusMessage}>
                  {selectedProfileUser.statusMessage || '모꼬에서 즐겁게 대화 나누고 싶어요 ✨'}
                </Text>

                {/* 1:1 대화 신청 버튼 단독 배치 (1:1 통화 삭제) */}
                <TouchableOpacity
                  style={styles.chatActionBtnFull}
                  activeOpacity={0.88}
                  onPress={() => handleStartDirectChat(selectedProfileUser)}
                >
                  <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
                  <Text style={styles.chatActionBtnText}>💬 1:1 대화 신청하기</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerMascotLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 6,
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
    gap: 6,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  // 3대 메인 탭 세그먼트
  mainSegmentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mainSegmentBtn: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mainSegmentBtnActive: {
    backgroundColor: '#FFF0F3',
    borderColor: '#FF3B6B',
  },
  mainSegmentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  mainSegmentTextActive: {
    color: '#FF3B6B',
    fontWeight: '900',
  },

  // 필터 섹션 (필터 바 + 인라인 드롭다운 패널)
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  // 3개 버튼 균등 3분할 정렬 필터 바
  filterBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterBtn: {
    flex: 1, // 균등 분할로 중앙 정렬 및 좌측 쏠림 완전 해결
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 6,
  },
  filterBtnActive: {
    backgroundColor: '#FFF0F3',
    borderColor: '#FF3B6B',
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterBtnTextActive: {
    color: '#FF3B6B',
    fontWeight: '800',
  },

  // 인라인 드롭다운 아코디언 패널
  dropdownPanel: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dropdownPanelTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },

  // 지역 스크롤 리스트 (아래로 계속 내려오며 선택)
  regionListScroll: {
    maxHeight: 220,
  },
  regionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 2,
  },
  regionItemRowSelected: {
    backgroundColor: '#FFF0F3',
  },
  regionItemText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  regionItemTextSelected: {
    color: '#FF3B6B',
    fontWeight: '800',
  },

  // 성별 옵션 컨테이너
  genderOptionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  genderOptionBtn: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  genderOptionBtnSelected: {
    backgroundColor: '#FFF0F3',
    borderColor: '#FF3B6B',
  },
  genderOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  genderOptionTextSelected: {
    color: '#FF3B6B',
    fontWeight: '800',
  },

  // 연령 레인지 슬라이더 스타일
  ageDisplayBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginBottom: 14,
  },
  ageDisplayText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FF3B6B',
    letterSpacing: 0.5,
  },
  sliderTrackWrapper: {
    paddingVertical: 10,
    marginBottom: 12,
  },
  sliderTrackBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    position: 'relative',
    justifyContent: 'center',
  },
  sliderHighlightBar: {
    position: 'absolute',
    height: 8,
    backgroundColor: '#FF3B6B',
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FF3B6B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    top: -6,
  },
  sliderScaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  scaleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  ageStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  stepControlCol: {
    alignItems: 'center',
    gap: 6,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  stepBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValueText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    minWidth: 36,
    textAlign: 'center',
  },
  stepDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  presetChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipActive: {
    backgroundColor: '#FF3B6B',
  },
  presetChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  confirmAgeBtn: {
    height: 40,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmAgeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 서브 세그먼트 (대화함)
  subSegmentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  subSegmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  subSegmentPillActive: {
    backgroundColor: '#0F172A',
  },
  subSegmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  subSegmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  safeTag: {
    backgroundColor: '#10B981',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  safeTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingBottom: 110,
  },

  // [친구들] 한줄(Row) 카드 스타일
  friendRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  friendAvatarWrapper: {
    position: 'relative',
  },
  friendAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E2E8F0',
  },
  friendOnlineBadge: {
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
  friendInfoCol: {
    flex: 1,
  },
  friendNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  friendName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    maxWidth: 110,
  },
  friendGenderBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  friendGenderText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },
  friendRegionBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  friendRegionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  friendStatusMsg: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },

  // 우측 슬림 & 조화로운 [대화신청] 버튼
  applyChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 12,
    backgroundColor: '#FFF1F5',
    borderWidth: 1,
    borderColor: '#FFE4E8',
  },
  applyChatBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#E11D48',
  },

  // [전체수다] 카드 스타일
  sudaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sudaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sudaAuthorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
  },
  authorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  authorName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  neighborhoodBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  neighborhoodText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
  },
  distanceText: {
    fontSize: 10.5,
    color: '#64748B',
  },
  timeText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  sudaContent: {
    fontSize: 13.5,
    lineHeight: 19,
    color: '#1E293B',
    fontWeight: '500',
  },

  // [대화함] 카드 스타일
  chatRoomCard: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  peerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
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
  chatRoomContent: {
    flex: 1,
  },
  chatRoomHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  peerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  peerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  marketBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  marketBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
  },
  chatTimeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  orderSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 8,
    marginBottom: 6,
    gap: 8,
  },
  orderThumb: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  orderTextBox: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  orderPrice: {
    fontSize: 10.5,
    color: '#FF3B6B',
    fontWeight: '800',
  },
  escrowStateTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  escrowStateText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
  },
  lastMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#FF3B6B',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginLeft: 6,
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#94A3B8',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },

  // 프로필 모달 스타일
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  bottomSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 16,
  },
  sheetContent: {
    alignItems: 'center',
    width: '100%',
  },
  sheetAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#FF3B6B',
  },
  sheetNickname: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  sheetMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sheetLocationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF0F3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sheetLocationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF3B6B',
  },
  sheetGenderChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sheetGenderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  sheetOnlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  onlineStatusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  sheetOnlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  sheetStatusMessage: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  chatActionBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FF3B6B',
    shadowColor: '#FF3B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  chatActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
