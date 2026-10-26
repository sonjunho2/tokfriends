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
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '../../api/client';
import ScrollExpandableFAB from '../../components/common/ScrollExpandableFAB';
import SudaCreateModal from '../../components/suda/SudaCreateModal';
import {
  fetchSudaPosts,
  fetchChatRooms,
} from '../../services/sudaService';

const { width } = Dimensions.get('window');

// 전국 단위 초기 친구들 목록 (지역/성별/연령 다양화)
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
    region: '서울',
    subRegion: '서초구',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    statusMessage: '퇴근하고 일상 수다 나눌 친구 찾아요 🏃',
    isOnline: true,
  },
  {
    id: 'friend-3',
    nickname: '지은',
    gender: '여성',
    age: 24,
    region: '경기',
    subRegion: '분당구',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    statusMessage: '주말 카페 투어 & 음악 감상 좋아합니다 ☕',
    isOnline: true,
  },
  {
    id: 'friend-4',
    nickname: '도윤',
    gender: '남성',
    age: 34,
    region: '인천',
    subRegion: '연수구 송도',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    statusMessage: '비즈니스 & 맛집 정보 공유해요 ✨',
    isOnline: true,
  },
  {
    id: 'friend-5',
    nickname: '하은',
    gender: '여성',
    age: 31,
    region: '부산',
    subRegion: '해운대구',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
    statusMessage: '바다 보며 힐링 중 🌊 대화 신청 환영!',
    isOnline: true,
  },
  {
    id: 'friend-6',
    nickname: '태우',
    gender: '남성',
    age: 42,
    region: '대구',
    subRegion: '수성구',
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
    subRegion: '서구 상무',
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
];

// 필터 옵션 상수
const REGION_OPTIONS = ['전체', '서울', '경기', '인천', '부산', '대구', '대전', '광주', '강원', '제주'];
const GENDER_OPTIONS = ['전체', '여성', '남성'];
const AGE_OPTIONS = ['전체', '20대', '30대', '40대', '50대 이상'];

export default function ChatsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  // 3대 메인 탭: 'FRIENDS' (친구들) vs 'SUDA' (전체수다) vs 'CHATS' (대화함)
  const [activeMainTab, setActiveMainTab] = useState('FRIENDS');

  // 대화함 서브 세그먼트: 'SUDA' (수다 톡) vs 'MARKET' (거래 톡)
  const [activeChatSubTab, setActiveChatSubTab] = useState('SUDA');

  // 필터 상태
  const [filterRegion, setFilterRegion] = useState('전체');
  const [filterGender, setFilterGender] = useState('전체');
  const [filterAgeGroup, setFilterAgeGroup] = useState('전체');
  const [activeFilterModal, setActiveFilterModal] = useState(null); // 'REGION' | 'GENDER' | 'AGE' | null

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
              region: u.region1 || (['서울', '경기', '인천', '부산', '대구', '대전'][idx % 6]),
              subRegion: u.region2 || '',
              avatarUrl: u.avatar || u.profile?.avatarUri || INITIAL_FRIENDS[idx % INITIAL_FRIENDS.length].avatarUrl,
              statusMessage: u.headline || u.profile?.headline || '새로운 모꼬지 인연을 기다려요 ✨',
              isOnline: Boolean(u.profile?.lastSeenAt) || idx % 2 === 0,
            }));
            setFriendsList(mapped);
          }
        } catch {
          // fallback to rich INITIAL_FRIENDS
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

  // 1:1 대화방 즉시 개설 및 이동
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

  // 필터링된 친구들 목록
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
      // 연령 필터
      if (filterAgeGroup !== '전체') {
        const age = Number(item.age) || 25;
        if (filterAgeGroup === '20대' && (age < 20 || age >= 30)) return false;
        if (filterAgeGroup === '30대' && (age < 30 || age >= 40)) return false;
        if (filterAgeGroup === '40대' && (age < 40 || age >= 50)) return false;
        if (filterAgeGroup === '50대 이상' && age < 50) return false;
      }
      return true;
    });
  }, [friendsList, filterRegion, filterGender, filterAgeGroup]);

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

  // 1. [친구들] 한 줄(Row) 항목 렌더링
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

      {/* 우측 [대화신청] 버튼 */}
      <TouchableOpacity
        style={styles.applyChatBtn}
        activeOpacity={0.85}
        onPress={() => handleStartDirectChat(item)}
      >
        <LinearGradient
          colors={tokens.colors.gradients.primaryPurple}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.applyChatBtnGradient}
        >
          <Ionicons name="chatbubble" size={13} color="#FFFFFF" />
          <Text style={styles.applyChatBtnText}>대화신청</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // 2. [전체수다] 항목 렌더링 (하트/말풍선 완전 삭제, 우측 대화신청 버튼)
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

        {/* 원터치 [대화신청] 버튼 */}
        <TouchableOpacity
          style={styles.applyChatBtn}
          activeOpacity={0.85}
          onPress={() =>
            handleStartDirectChat({
              id: item.author.id,
              nickname: item.author.nickname,
              avatarUrl: item.author.avatarUrl,
              region: item.neighborhood,
            })
          }
        >
          <LinearGradient
            colors={tokens.colors.gradients.primaryPurple}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.applyChatBtnGradient}
          >
            <Ionicons name="chatbubble" size={13} color="#FFFFFF" />
            <Text style={styles.applyChatBtnText}>대화신청</Text>
          </LinearGradient>
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
      {/* 1. 상단 모꼬지대화 공식 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../../assets/mocco-mascot.png')}
            style={styles.headerMascotLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>모꼬지대화</Text>
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
          onPress={() => setActiveMainTab('FRIENDS')}
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
          onPress={() => setActiveMainTab('SUDA')}
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
          onPress={() => setActiveMainTab('CHATS')}
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

      {/* 3. [친구들] 및 [전체수다] 하부 필터 바: [지역] / [성별] / [연령] */}
      {(activeMainTab === 'FRIENDS' || activeMainTab === 'SUDA') && (
        <View style={styles.filterBarContainer}>
          <TouchableOpacity
            style={[styles.filterBtn, filterRegion !== '전체' && styles.filterBtnActive]}
            activeOpacity={0.8}
            onPress={() => setActiveFilterModal('REGION')}
          >
            <Ionicons name="location-sharp" size={12} color={filterRegion !== '전체' ? '#FF3B6B' : '#64748B'} />
            <Text style={[styles.filterBtnText, filterRegion !== '전체' && styles.filterBtnTextActive]}>
              지역: {filterRegion}
            </Text>
            <Ionicons name="chevron-down" size={12} color={filterRegion !== '전체' ? '#FF3B6B' : '#94A3B8'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filterGender !== '전체' && styles.filterBtnActive]}
            activeOpacity={0.8}
            onPress={() => setActiveFilterModal('GENDER')}
          >
            <Ionicons name="people-sharp" size={12} color={filterGender !== '전체' ? '#FF3B6B' : '#64748B'} />
            <Text style={[styles.filterBtnText, filterGender !== '전체' && styles.filterBtnTextActive]}>
              성별: {filterGender}
            </Text>
            <Ionicons name="chevron-down" size={12} color={filterGender !== '전체' ? '#FF3B6B' : '#94A3B8'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filterAgeGroup !== '전체' && styles.filterBtnActive]}
            activeOpacity={0.8}
            onPress={() => setActiveFilterModal('AGE')}
          >
            <Ionicons name="calendar-sharp" size={12} color={filterAgeGroup !== '전체' ? '#FF3B6B' : '#64748B'} />
            <Text style={[styles.filterBtnText, filterAgeGroup !== '전체' && styles.filterBtnTextActive]}>
              연령: {filterAgeGroup}
            </Text>
            <Ionicons name="chevron-down" size={12} color={filterAgeGroup !== '전체' ? '#FF3B6B' : '#94A3B8'} />
          </TouchableOpacity>
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
              <Text style={styles.emptySub}>필터 설정을 변경해보세요!</Text>
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

      {/* 8. 필터 선택 드롭다운 모달 (지역 / 성별 / 연령) */}
      <Modal
        visible={activeFilterModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveFilterModal(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setActiveFilterModal(null)}
        >
          <View style={styles.filterSheetCard}>
            <View style={styles.sheetHandle} />
            <Text style={styles.filterSheetTitle}>
              {activeFilterModal === 'REGION' && '📍 지역 선택'}
              {activeFilterModal === 'GENDER' && '👥 성별 선택'}
              {activeFilterModal === 'AGE' && '🎂 연령대 선택'}
            </Text>

            <View style={styles.filterOptionsGrid}>
              {activeFilterModal === 'REGION' &&
                REGION_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.filterOptionChip,
                      filterRegion === opt && styles.filterOptionChipActive,
                    ]}
                    onPress={() => {
                      setFilterRegion(opt);
                      setActiveFilterModal(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filterRegion === opt && styles.filterOptionTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}

              {activeFilterModal === 'GENDER' &&
                GENDER_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.filterOptionChip,
                      filterGender === opt && styles.filterOptionChipActive,
                    ]}
                    onPress={() => {
                      setFilterGender(opt);
                      setActiveFilterModal(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filterGender === opt && styles.filterOptionTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}

              {activeFilterModal === 'AGE' &&
                AGE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.filterOptionChip,
                      filterAgeGroup === opt && styles.filterOptionChipActive,
                    ]}
                    onPress={() => {
                      setFilterAgeGroup(opt);
                      setActiveFilterModal(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filterAgeGroup === opt && styles.filterOptionTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 9. 회원 아바타 터치 시 [프로필 확인 모달] (1:1 통화 삭제, 1:1 대화 신청 단독) */}
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
                  {selectedProfileUser.statusMessage || '모꼬지에서 즐겁게 대화 나누고 싶어요 ✨'}
                </Text>

                {/* 1:1 대화 신청 버튼 단독 배치 (1:1 통화 완전 제거) */}
                <TouchableOpacity
                  style={styles.chatActionBtnFull}
                  activeOpacity={0.88}
                  onPress={() => handleStartDirectChat(selectedProfileUser)}
                >
                  <LinearGradient
                    colors={tokens.colors.gradients.primaryPurple}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.chatActionBtnGradient}
                  >
                    <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
                    <Text style={styles.chatActionBtnText}>💬 1:1 대화 신청하기</Text>
                  </LinearGradient>
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
  // 드롭다운 필터 바
  filterBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  friendAvatarWrapper: {
    position: 'relative',
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginBottom: 4,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    maxWidth: 120,
  },
  friendGenderBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  friendGenderText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4F46E5',
  },
  friendRegionBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  friendRegionText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  friendStatusMsg: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  applyChatBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  applyChatBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  applyChatBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
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
    width: 38,
    height: 38,
    borderRadius: 19,
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
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  neighborhoodBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  neighborhoodText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  distanceText: {
    fontSize: 11,
    color: '#64748B',
  },
  timeText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  sudaContent: {
    fontSize: 14,
    lineHeight: 20,
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
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  marketBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  chatTimeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  orderSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 6,
    marginVertical: 4,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderThumb: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  orderTextBox: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  orderPrice: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF3B6B',
  },
  escrowStateTag: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  escrowStateText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  lastMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  lastMessageText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#FF3B6B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
  },
  emptySub: {
    marginTop: 4,
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  // 모달 스타일
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  filterSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  filterSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  filterOptionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterOptionChipActive: {
    backgroundColor: '#FFF0F3',
    borderColor: '#FF3B6B',
  },
  filterOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  filterOptionTextActive: {
    color: '#FF3B6B',
    fontWeight: '900',
  },
  bottomSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 16,
    alignSelf: 'center',
  },
  sheetContent: {
    width: '100%',
    alignItems: 'center',
  },
  sheetAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FF3B6B',
    marginBottom: 10,
  },
  sheetNickname: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  sheetMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sheetLocationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
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
    borderRadius: 6,
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
    borderRadius: 6,
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
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  chatActionBtnFull: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  chatActionBtnGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  chatActionBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
