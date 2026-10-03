// src/screens/recommend/HotRecommendScreen.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import UserListItem from '../../components/UserListItem';
import SegmentBar from '../../components/SegmentBar';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { checkAndConfirmActionPoint } from '../../utils/pointPolicyHelper';

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

  const hours = Math.floor(minutes / 60);
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

export default function HotRecommendScreen({ navigation, route }) {
  const { user: authUser } = useAuth();
  const myRegion = authUser?.region1 || authUser?.region2 || '';
  const myInterests = authUser?.profile?.interests || [];

  const requestedSegment = route?.params?.selected;
  const initial = SUPPORTED_SEGMENTS.includes(requestedSegment)
    ? requestedSegment
    : '전체';

  const [seg, setSeg] = useState(initial);
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'nearby' | 'popular'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  // 검색 / 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [selectedInterest, setSelectedInterest] = useState('');
  const [showFilter, setShowFilter] = useState(Boolean(route?.params?.openFilter));
  const debounceRef = useRef(null);

  const loadUsers = useCallback(async (params = {}) => {
    setLoading(true);
    setLoadError('');

    try {
      const result = await apiClient.getDiscover(params);
      const list = Array.isArray(result) ? result : [];
      setUsers(list.map((u) => mapDiscoverUser(u, myRegion)).filter((item) => item.id));
    } catch (error) {
      setUsers([]);
      setLoadError(error?.message || '회원 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [myRegion]);

  // 최초 로딩
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  // 검색어 / 관심사 / 지역 변경 시 debounce 조회
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const params = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (regionFilter.trim()) params.region = regionFilter.trim();
      if (selectedInterest) params.interest = selectedInterest;
      loadUsers(params);
    }, 450);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, regionFilter, selectedInterest, loadUsers]);

  const data = useMemo(() => {
    let list = [...users];

    // 1. 세그먼트 필터링
    switch (seg) {
      case '🔥 HOT추천':
        list = list.sort((a, b) => (b.points || 0) - (a.points || 0));
        break;
      case '🟢 접속중':
        list = list.filter((user) => user.online || user.lastSeenLabel === '방금');
        break;
      case '📍 내 주변':
        list = list.sort((a, b) => (a.distanceKm || 99) - (b.distanceKm || 99));
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

    // 2. 추가 정렬 조건
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
  }, [seg, users, sortBy]);

  const handleOpenProfile = (item) => {
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
      },
    });
  };

  const handleQuickChat = async (item) => {
    checkAndConfirmActionPoint({
      actionType: 'chatRoomCreate',
      actionName: '1:1 채팅방 개설',
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
          chatId,
          counterpartAccountId: targetAccountId,
          counterpartNickname: item.name,
          counterpartAvatar: item.avatar,
        });
      },
    });
  };

  const hasActiveFilter = Boolean(searchQuery.trim() || regionFilter.trim() || selectedInterest);

  const emptyMessage = loading
    ? '회원 목록을 불러오는 중입니다.'
    : loadError || '조건에 맞는 회원이 없습니다.';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>인연 추천</Text>
          <Text style={styles.headerSubTitle}>새로운 이웃과 소통해보세요</Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowFilter((v) => !v)}
          hitSlop={8}
          style={[styles.filterBtn, hasActiveFilter && styles.filterBtnActive]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={hasActiveFilter ? '#111827' : '#6B7280'}
          />
          {hasActiveFilter && <View style={styles.filterActiveDot} />}
        </TouchableOpacity>
      </View>

      {/* 다가온 추천 가이드 배너 */}
      <View style={styles.guideBanner}>
        <Ionicons name="sparkles" size={15} color="#D97706" style={{ marginRight: 6 }} />
        <Text style={styles.guideBannerText} numberOfLines={1}>
          나와 취향과 동네가 통하는 소중한 인연을 만나보세요
        </Text>
      </View>

      {/* 검색 + 필터 패널 */}
      {showFilter && (
        <View style={styles.filterPanel}>
          {/* 키워드 검색 */}
          <View style={styles.searchRow}>
            <Ionicons name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="이름·소개·관심사 검색"
              placeholderTextColor="#9CA3AF"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={6}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* 지역 필터 */}
          <View style={styles.searchRow}>
            <Ionicons name="location-outline" size={16} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={regionFilter}
              onChangeText={setRegionFilter}
              placeholder="지역 필터 (예: 서울, 강남)"
              placeholderTextColor="#9CA3AF"
              returnKeyType="done"
              clearButtonMode="while-editing"
            />
            {regionFilter.length > 0 && (
              <TouchableOpacity onPress={() => setRegionFilter('')} hitSlop={6}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* 관심사 칩 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <TouchableOpacity
              style={[styles.chip, !selectedInterest && styles.chipActive]}
              onPress={() => setSelectedInterest('')}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, !selectedInterest && styles.chipTextActive]}>전체</Text>
            </TouchableOpacity>
            {INTEREST_CHIPS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.chip, selectedInterest === tag && styles.chipActive]}
                onPress={() => setSelectedInterest((v) => (v === tag ? '' : tag))}
                activeOpacity={0.85}
              >
                <Text style={[styles.chipText, selectedInterest === tag && styles.chipTextActive]}>
                  #{tag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {hasActiveFilter && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                setSearchQuery('');
                setRegionFilter('');
                setSelectedInterest('');
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={13} color="#4B5563" />
              <Text style={styles.clearBtnText}>필터 초기화</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 세그먼트 바 */}
      <SegmentBar
        segments={SUPPORTED_SEGMENTS}
        value={seg}
        onChange={setSeg}
      />

      {/* 정렬 & 카운터 바 */}
      <View style={styles.sortBar}>
        <Text style={styles.countText}>
          총 <Text style={styles.countTextBold}>{data.length}</Text>명
        </Text>

        <View style={styles.sortButtonGroup}>
          <TouchableOpacity
            style={[styles.sortBtn, sortBy === 'recent' && styles.sortBtnActive]}
            onPress={() => setSortBy('recent')}
            activeOpacity={0.8}
          >
            <Text style={[styles.sortBtnText, sortBy === 'recent' && styles.sortBtnTextActive]}>
              접속순
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortBtn, sortBy === 'nearby' && styles.sortBtnActive]}
            onPress={() => setSortBy('nearby')}
            activeOpacity={0.8}
          >
            <Text style={[styles.sortBtnText, sortBy === 'nearby' && styles.sortBtnTextActive]}>
              거리순
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortBtn, sortBy === 'popular' && styles.sortBtnActive]}
            onPress={() => setSortBy('popular')}
            activeOpacity={0.8}
          >
            <Text style={[styles.sortBtnText, sortBy === 'popular' && styles.sortBtnTextActive]}>
              인기순
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 회원 리스트 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>새로운 인연을 찾는 중입니다...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <UserListItem
              item={item}
              onPress={() => handleOpenProfile(item)}
              onChatPress={handleQuickChat}
              myInterests={myInterests}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={54} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>추천 이웃이 없습니다</Text>
              <Text style={styles.emptyText}>{emptyMessage}</Text>
            </View>
          }
          contentContainerStyle={[
            styles.listContent,
            data.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backBtn: {
    padding: 4,
  },
  headerTitleBox: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubTitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  filterBtn: {
    position: 'relative',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
  },
  filterBtnActive: {
    backgroundColor: '#FEE500',
  },
  filterActiveDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  guideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF0',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
  },
  guideBannerText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#92400E',
  },
  filterPanel: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#111827',
    padding: 0,
  },
  chipScroll: {
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: '#FEE500',
    borderColor: '#FEE500',
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#191919',
    fontWeight: '700',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    marginTop: 4,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  countText: {
    fontSize: 13,
    color: '#6B7280',
  },
  countTextBold: {
    fontWeight: '700',
    color: '#111827',
  },
  sortButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  sortBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sortBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  sortBtnText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  sortBtnTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#6B7280',
  },
  listContent: {
    padding: 14,
    paddingBottom: 24,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#9CA3AF',
  },
});
