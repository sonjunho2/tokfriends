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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import UserListItem from '../../components/UserListItem';
import SegmentBar from '../../components/SegmentBar';
import { apiClient } from '../../api/client';

const SUPPORTED_SEGMENTS = ['전체', '20대', '30대', '40대이상'];

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

function mapDiscoverUser(user) {
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
    age: typeof user?.age === 'number' ? user.age : calculateAge(user?.dob),
    subtitle: profile?.headline || profile?.bio || undefined,
    bio: profile?.bio || undefined,
    headline: profile?.headline || undefined,
    avatar: profile?.avatarUri || undefined,
    lastSeenLabel: formatLastSeen(profile?.lastSeenAt),
    regionLabel:
      [user?.region1, user?.region2].filter(Boolean).join(' · ') || undefined,
    interests: Array.isArray(profile?.interests) ? profile.interests : [],
  };
}

export default function HotRecommendScreen({ navigation, route }) {
  const requestedSegment = route?.params?.selected;
  const initial = SUPPORTED_SEGMENTS.includes(requestedSegment)
    ? requestedSegment
    : '전체';

  const [seg, setSeg] = useState(initial);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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
      setUsers(list.map(mapDiscoverUser).filter((item) => item.id));
    } catch (error) {
      setUsers([]);
      setLoadError(error?.message || '회원 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 최초 로딩
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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
    switch (seg) {
      case '20대':
        return users.filter(
          (user) => typeof user.age === 'number' && user.age >= 20 && user.age < 30,
        );
      case '30대':
        return users.filter(
          (user) => typeof user.age === 'number' && user.age >= 30 && user.age < 40,
        );
      case '40대이상':
        return users.filter(
          (user) => typeof user.age === 'number' && user.age >= 40,
        );
      case '전체':
      default:
        return users;
    }
  }, [seg, users]);

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

  const hasActiveFilter = Boolean(searchQuery.trim() || regionFilter.trim() || selectedInterest);

  const emptyMessage = loading
    ? '회원 목록을 불러오는 중입니다.'
    : loadError || '표시할 회원이 없습니다.';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{seg}</Text>

        <TouchableOpacity
          onPress={() => setShowFilter((v) => !v)}
          hitSlop={8}
          style={[styles.filterBtn, hasActiveFilter && styles.filterBtnActive]}
        >
          <Ionicons
            name="options-outline"
            size={22}
            color={hasActiveFilter ? colors.primary : colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* 검색 + 필터 패널 */}
      {showFilter && (
        <View style={styles.filterPanel}>
          {/* 키워드 검색 */}
          <View style={styles.searchRow}>
            <Ionicons name="search" size={16} color={colors.textTertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="이름·소개·관심사 검색"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={6}>
                <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* 지역 필터 */}
          <View style={styles.searchRow}>
            <Ionicons name="location-outline" size={16} color={colors.textTertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={regionFilter}
              onChangeText={setRegionFilter}
              placeholder="지역 필터 (예: 서울)"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="done"
              clearButtonMode="while-editing"
            />
            {regionFilter.length > 0 && (
              <TouchableOpacity onPress={() => setRegionFilter('')} hitSlop={6}>
                <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
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
                  {tag}
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
              <Ionicons name="close" size={14} color={colors.primary} />
              <Text style={styles.clearBtnText}>필터 초기화</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <SegmentBar
        segments={SUPPORTED_SEGMENTS}
        value={seg}
        onChange={setSeg}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <UserListItem
              item={item}
              onPress={() => handleOpenProfile(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{emptyMessage}</Text>
            </View>
          }
          contentContainerStyle={[
            styles.listContent,
            data.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  filterBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.backgroundTertiary,
  },
  filterBtnActive: {
    backgroundColor: colors.primaryLight,
  },
  filterPanel: {
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  chipScroll: {
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.pillBg,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: colors.pillActiveBg,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primary,
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
    backgroundColor: colors.primaryLight,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textSecondary,
  },
});
