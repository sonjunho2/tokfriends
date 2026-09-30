// src/screens/my/FriendsScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import Avatar from '../../components/Avatar';
import { apiClient } from '../../api/client';

const TABS = [
  { key: 'friends', label: '친구 목록' },
  { key: 'received', label: '받은 요청' },
  { key: 'sent', label: '보낸 요청' },
];

export default function FriendsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('friends');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const loadFriendships = useCallback(async () => {
    try {
      const data = await apiClient.getFriendships();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setItems(list);
    } catch (error) {
      console.warn('Failed to load friendships', error);
      Alert.alert('알림', error?.message || '친구 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFriendships();
  }, [loadFriendships]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFriendships();
  }, [loadFriendships]);

  const acceptedFriends = useMemo(
    () => items.filter((f) => f.status === 'accepted'),
    [items],
  );

  const receivedRequests = useMemo(
    () => items.filter((f) => f.status === 'requested' && !f.isRequester),
    [items],
  );

  const sentRequests = useMemo(
    () => items.filter((f) => f.status === 'requested' && f.isRequester),
    [items],
  );

  const tabCounts = useMemo(
    () => ({
      friends: acceptedFriends.length,
      received: receivedRequests.length,
      sent: sentRequests.length,
    }),
    [acceptedFriends.length, receivedRequests.length, sentRequests.length],
  );

  const currentList = useMemo(() => {
    if (activeTab === 'received') return receivedRequests;
    if (activeTab === 'sent') return sentRequests;
    return acceptedFriends;
  }, [activeTab, acceptedFriends, receivedRequests, sentRequests]);

  const handleAccept = async (friendshipId) => {
    if (processingId) return;
    setProcessingId(friendshipId);
    try {
      await apiClient.acceptFriendRequest(friendshipId);
      Alert.alert('완료', '친구 요청을 수락했습니다.');
      await loadFriendships();
    } catch (error) {
      Alert.alert('수락 실패', error?.message || '요청 수락에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = (friendshipId) => {
    if (processingId) return;
    Alert.alert('친구 요청 거절', '친구 요청을 거절하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '거절',
        style: 'destructive',
        onPress: async () => {
          setProcessingId(friendshipId);
          try {
            await apiClient.declineFriendRequest(friendshipId);
            Alert.alert('완료', '친구 요청을 거절했습니다.');
            await loadFriendships();
          } catch (error) {
            Alert.alert('거절 실패', error?.message || '요청 거절에 실패했습니다.');
          } finally {
            setProcessingId(null);
          }
        },
      },
    ]);
  };

  const handleCancel = (friendshipId) => {
    if (processingId) return;
    Alert.alert('요청 취소', '보낸 친구 요청을 취소하시겠습니까?', [
      { text: '아니오', style: 'cancel' },
      {
        text: '취소하기',
        style: 'destructive',
        onPress: async () => {
          setProcessingId(friendshipId);
          try {
            await apiClient.cancelFriendRequest(friendshipId);
            Alert.alert('완료', '친구 요청이 취소되었습니다.');
            await loadFriendships();
          } catch (error) {
            Alert.alert('취소 실패', error?.message || '요청 취소에 실패했습니다.');
          } finally {
            setProcessingId(null);
          }
        },
      },
    ]);
  };

  const handleStartChat = async (user) => {
    try {
      const targetUserId = user?.id;
      const targetAccountId = user?.targetAccountId;
      const room = await apiClient.ensureDirectRoom(
        targetUserId ? { targetUserId } : { targetAccountId },
      );
      const roomId = room?.id || room?._id;
      if (!roomId) throw new Error('대화방을 생성할 수 없습니다.');

      navigation.navigate('Chat', {
        screen: 'ChatRoom',
        params: {
          id: roomId,
          room,
          user: {
            id: targetUserId,
            targetAccountId,
            name: user.name,
            avatar: user.avatar,
            headline: user.bio,
          },
        },
      });
    } catch (error) {
      Alert.alert('대화 시작 실패', error?.message || '채팅방을 열지 못했습니다.');
    }
  };

  const handleOpenProfile = (user) => {
    navigation.navigate('ProfileDetail', {
      profile: {
        targetUserId: user.id,
        targetAccountId: user.targetAccountId,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        title: user.bio,
      },
    });
  };

  const renderItem = ({ item }) => {
    const user = item?.user || {};
    const isProcessing = processingId === item.id;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.userInfo}
          activeOpacity={0.8}
          onPress={() => handleOpenProfile(user)}
        >
          <Avatar size={50} name={user.name} uri={user.avatar} showBorder />
          <View style={styles.textContainer}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.name}
            </Text>
            {!!user.bio && (
              <Text style={styles.userBio} numberOfLines={1}>
                {user.bio}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.actionContainer}>
          {activeTab === 'friends' && (
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => handleStartChat(user)}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
              <Text style={styles.chatButtonText}>대화하기</Text>
            </TouchableOpacity>
          )}

          {activeTab === 'received' && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.acceptButton, isProcessing && styles.buttonDisabled]}
                onPress={() => handleAccept(item.id)}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Text style={styles.acceptButtonText}>수락</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.declineButton, isProcessing && styles.buttonDisabled]}
                onPress={() => handleDecline(item.id)}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                <Text style={styles.declineButtonText}>거절</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'sent' && (
            <TouchableOpacity
              style={[styles.cancelButton, isProcessing && styles.buttonDisabled]}
              onPress={() => handleCancel(item.id)}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <Text style={styles.cancelButtonText}>요청 취소</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const getEmptyMessage = () => {
    if (activeTab === 'received') {
      return {
        icon: 'mail-unread-outline',
        title: '받은 친구 요청이 없습니다.',
        desc: '새로운 인연이 친구 요청을 보내면 여기에 표시됩니다.',
      };
    }
    if (activeTab === 'sent') {
      return {
        icon: 'paper-plane-outline',
        title: '보낸 친구 요청이 없습니다.',
        desc: '프로필 상세에서 마음에 드는 분께 친구 요청을 보내보세요.',
      };
    }
    return {
      icon: 'people-outline',
      title: '아직 등록된 친구가 없습니다.',
      desc: '추천 회원의 프로필을 확인하고 먼저 친구를 신청해보세요!',
    };
  };

  const emptyInfo = getEmptyMessage();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>친구 관리</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tabCounts[tab.key] || 0;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.badge, isActive && styles.badgeActive]}>
                  <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={
            currentList.length > 0 ? styles.listContent : styles.emptyListContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name={emptyInfo.icon} size={48} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>{emptyInfo.title}</Text>
              <Text style={styles.emptySubtitle}>{emptyInfo.desc}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeActive: {
    backgroundColor: colors.primary,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  badgeTextActive: {
    color: colors.textInverse,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  userBio: {
    marginTop: 3,
    fontSize: 13,
    color: colors.textSecondary,
  },
  actionContainer: {
    marginLeft: 8,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.pillActiveBg,
  },
  chatButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 6,
  },
  acceptButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: colors.primary,
    minWidth: 48,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textInverse,
  },
  declineButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: colors.border,
  },
  declineButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
