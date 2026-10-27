// src/screens/my/FollowsScreen.js
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function FollowsScreen({ navigation, route }) {
  const initialTab = route?.params?.initialTab === 'following' ? 'following' : 'followers';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { user } = useAuth();

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionProcessingId, setActionProcessingId] = useState(null);

  const accountId = user?.activityAccountId || user?.id;

  const loadData = useCallback(async () => {
    if (!accountId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [followersRes, followingRes] = await Promise.allSettled([
        apiClient.getFollowers(accountId, { limit: 50 }),
        apiClient.getFollowing(accountId, { limit: 50 }),
      ]);

      if (followersRes.status === 'fulfilled') {
        const list = Array.isArray(followersRes.value?.items)
          ? followersRes.value.items
          : Array.isArray(followersRes.value)
          ? followersRes.value
          : [];
        setFollowers(list);
      }

      if (followingRes.status === 'fulfilled') {
        const list = Array.isArray(followingRes.value?.items)
          ? followingRes.value.items
          : Array.isArray(followingRes.value)
          ? followingRes.value
          : [];
        setFollowing(list);
      }
    } catch (err) {
      console.warn('Failed to load follows data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handlePressUser = (item) => {
    const avatar = item.avatarUri || item.avatarUrl || item.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300';
    const profilePayload = {
      id: item.userId || item.id,
      targetAccountId: item.id,
      targetUserId: item.userId || item.id,
      name: item.displayName || item.nickname || '회원',
      nickname: item.nickname || item.displayName || '회원',
      avatar,
      avatarUrl: avatar,
      avatarUri: avatar,
      location: [item.region1, item.region2].filter(Boolean).join(' ') || item.region || '서울 강남구',
      headline: item.headline || '반가워요! 소통하며 지내요 ✨',
      age: item.age || 25,
      gender: item.gender || '여',
    };
    navigation.navigate('ProfileDetail', { profile: profilePayload });
  };

  // 1:1 대화방 열기
  const handleStartChat = (item) => {
    const avatar = item.avatarUri || item.avatarUrl || item.avatar;
    navigation.navigate('ChatRoom', {
      counterpartAccountId: item.id,
      targetUserId: item.userId || item.id,
      title: item.displayName || item.nickname || '친구',
      user: {
        id: item.userId || item.id,
        name: item.displayName || item.nickname || '친구',
        avatar,
        avatarUrl: avatar,
        avatarUri: avatar,
        location: [item.region1, item.region2].filter(Boolean).join(' ') || '서울 강남구',
      },
    });
  };

  // 실시간 라이브 방송방 입장
  const handleEnterLive = (item) => {
    const roomId = item.liveRoomId || 'live-def-1';
    const avatar = item.avatarUri || item.avatarUrl || item.avatar;
    navigation.navigate('LiveRoom', {
      roomId,
      roomTitle: item.liveTitle || `${item.displayName}님의 라이브 방송`,
      hostName: item.displayName || item.nickname || '호스트',
      hostAvatar: avatar,
    });
  };

  // 언팔로우 액션
  const handleUnfollow = (item) => {
    if (actionProcessingId) return;

    Alert.alert(
      '팔로우 취소',
      `'${item.displayName || '회원'}'님의 팔로우를 취소하시겠습니까?`,
      [
        { text: '닫기', style: 'cancel' },
        {
          text: '팔로우 취소',
          style: 'destructive',
          onPress: async () => {
            setActionProcessingId(item.id);
            try {
              await apiClient.unfollowAccount(item.id);
              setFollowing((prev) => prev.filter((u) => u.id !== item.id));
              Alert.alert('완료', '팔로우가 취소되었습니다.');
            } catch (err) {
              Alert.alert('오류', err?.message || '처리에 실패했습니다.');
            } finally {
              setActionProcessingId(null);
            }
          },
        },
      ],
    );
  };

  // 맞팔로우 액션
  const handleFollowBack = async (item) => {
    if (actionProcessingId) return;
    setActionProcessingId(item.id);
    try {
      await apiClient.followAccount(item.id);
      Alert.alert('팔로우 완료', `'${item.displayName || '회원'}'님을 팔로우했습니다!`);
      await loadData();
    } catch (err) {
      Alert.alert('오류', err?.message || '팔로우에 실패했습니다.');
    } finally {
      setActionProcessingId(null);
    }
  };

  const isUserFollowedByMe = (targetId) => {
    return following.some((u) => u.id === targetId);
  };

  const currentList = activeTab === 'followers' ? followers : following;

  const renderUserItem = ({ item }) => {
    const location = [item.region1, item.region2].filter(Boolean).join(' ') || item.region || '';
    const isFollowed = isUserFollowedByMe(item.id);
    const isProcessing = actionProcessingId === item.id;
    const avatar = item.avatarUri || item.avatarUrl || item.avatar;

    return (
      <View style={styles.userCard}>
        {/* 아바타 (라이브 중이면 네온 링 표시) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => (item.isLive ? handleEnterLive(item) : handlePressUser(item))}
          style={{ position: 'relative' }}
        >
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={[styles.avatar, item.isLive && { borderColor: '#EF4444', borderWidth: 2 }]}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={24} color="#A1A1AA" />
            </View>
          )}
          {item.isLive && (
            <View style={styles.liveBadgeOverlay}>
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 유저 정보 */}
        <TouchableOpacity
          style={styles.cardInfo}
          activeOpacity={0.85}
          onPress={() => handlePressUser(item)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.displayName} numberOfLines={1}>
              {item.displayName || item.nickname || '회원'}
            </Text>
            {item.age ? (
              <Text style={styles.ageBadgeText}>
                {item.age}세 · {item.gender || '여'}
              </Text>
            ) : null}
          </View>
          {location ? (
            <Text style={styles.locationText} numberOfLines={1}>
              📍 {location}
            </Text>
          ) : null}
          {item.isLive ? (
            <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '700' }} numberOfLines={1}>
              🔴 {item.liveTitle || '라이브 방송 중입니다'}
            </Text>
          ) : item.headline ? (
            <Text style={styles.headlineText} numberOfLines={1}>
              {item.headline}
            </Text>
          ) : null}
        </TouchableOpacity>

        {/* 우측 연계 액션 버튼군 (1:1 채팅 & 라이브 & 팔로우 토글) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {/* 1:1 채팅 바로가기 버튼 */}
          <TouchableOpacity
            style={styles.chatActionBtn}
            onPress={() => handleStartChat(item)}
            activeOpacity={0.8}
            hitSlop={6}
          >
            <Ionicons name="chatbubble-ellipses" size={15} color="#4F46E5" />
          </TouchableOpacity>

          {/* 라이브 방송 중이면 LIVE 입장 버튼 */}
          {item.isLive && (
            <TouchableOpacity
              style={styles.liveActionBtn}
              onPress={() => handleEnterLive(item)}
              activeOpacity={0.8}
              hitSlop={6}
            >
              <Ionicons name="radio" size={14} color="#FFFFFF" />
              <Text style={styles.liveActionBtnText}>시청</Text>
            </TouchableOpacity>
          )}

          {/* 팔로우 상태 버튼 */}
          {activeTab === 'following' ? (
            <TouchableOpacity
              style={styles.unfollowBtn}
              onPress={() => handleUnfollow(item)}
              disabled={isProcessing}
              hitSlop={6}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#71717A" />
              ) : (
                <Text style={styles.unfollowBtnText}>팔로잉</Text>
              )}
            </TouchableOpacity>
          ) : isFollowed ? (
            <TouchableOpacity
              style={styles.mutualFollowBtn}
              onPress={() => handleUnfollow(item)}
              disabled={isProcessing}
              hitSlop={6}
            >
              <Text style={styles.mutualFollowText}>맞팔로우 중</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.followBtn}
              onPress={() => handleFollowBack(item)}
              disabled={isProcessing}
              hitSlop={6}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#191919" />
              ) : (
                <>
                  <Ionicons name="person-add" size={13} color="#191919" />
                  <Text style={styles.followBtnText}>맞팔로우</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#191919" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>팔로우 관리</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* 듀얼 탭 세그먼트 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'followers' && styles.tabItemActive]}
          onPress={() => setActiveTab('followers')}
        >
          <Text
            style={[styles.tabText, activeTab === 'followers' && styles.tabTextActive]}
          >
            팔로워 ({followers.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'following' && styles.tabItemActive]}
          onPress={() => setActiveTab('following')}
        >
          <Text
            style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}
          >
            팔로잉 ({following.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>목록을 불러오는 중...</Text>
        </View>
      ) : currentList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons
              name={activeTab === 'followers' ? 'people-outline' : 'person-add-outline'}
              size={44}
              color="#A1A1AA"
            />
          </View>
          <Text style={styles.emptyTitle}>
            {activeTab === 'followers'
              ? '아직 나를 팔로우한 회원이 없습니다'
              : '아직 팔로우한 회원이 없습니다'}
          </Text>
          <Text style={styles.emptySub}>
            {activeTab === 'followers'
              ? '커뮤니티와 라이브 방송에서 활발하게 소통해 보세요!'
              : '마음에 드는 이웃의 프로필에서 팔로우를 시작해 보세요.'}
          </Text>
          <TouchableOpacity
            style={styles.emptyCtaButton}
            onPress={() => navigation.navigate('CommunityFeed')}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyCtaText}>새로운 이웃 탐색하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
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
    backgroundColor: '#F7F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191919',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#191919',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#71717A',
  },
  tabTextActive: {
    color: '#191919',
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E4E4E7',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    gap: 2,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191919',
  },
  locationText: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
  },
  headlineText: {
    fontSize: 13,
    color: '#52525B',
    fontWeight: '500',
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE500',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191919',
  },
  unfollowBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  unfollowBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52525B',
  },
  mutualFollowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  chatActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  liveActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 3,
  },
  liveActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  liveBadgeOverlay: {
    position: 'absolute',
    bottom: -3,
    left: '50%',
    marginLeft: -16,
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    zIndex: 10,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  ageBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#71717A',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: -40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#191919',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyCtaButton: {
    backgroundColor: '#FEE500',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyCtaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191919',
  },
});
