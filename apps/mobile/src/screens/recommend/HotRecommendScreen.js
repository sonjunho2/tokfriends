// src/screens/recommend/HotRecommendScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import UserListItem from '../../components/UserListItem';
import SegmentBar from '../../components/SegmentBar';
import { apiClient } from '../../api/client';

const SUPPORTED_SEGMENTS = ['전체', '20대', '30대', '40대이상'];

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

  return {
    id: user?.id,
    name: profile?.nickname || user?.displayName || '회원',
    age: typeof user?.age === 'number' ? user.age : calculateAge(user?.dob),
    subtitle: profile?.headline || profile?.bio || undefined,
    bio: profile?.bio || undefined,
    headline: profile?.headline || undefined,
    avatar: profile?.avatarUri || undefined,
    lastSeenLabel: formatLastSeen(profile?.lastSeenAt),
    regionLabel:
      [user?.region1, user?.region2].filter(Boolean).join(' · ') || undefined,
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

  useEffect(() => {
    let active = true;

    const loadUsers = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const result = await apiClient.getDiscover();
        const list = Array.isArray(result) ? result : [];

        if (active) {
          setUsers(list.map(mapDiscoverUser).filter((item) => item.id));
        }
      } catch (error) {
        if (active) {
          setUsers([]);
          setLoadError(error?.message || '회원 목록을 불러오지 못했습니다.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      active = false;
    };
  }, []);

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
    navigation.navigate('ProfileDetail', {
      profile: {
        id: item?.id,
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

        <View style={{ width: 26 }} />
      </View>

      <SegmentBar
        segments={SUPPORTED_SEGMENTS}
        value={seg}
        onChange={setSeg}
      />

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
