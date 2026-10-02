// apps/mobile/src/screens/main/NotificationsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { apiClient } from '../../api/client';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return '방금 전';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

const ACTIVITY_TYPE_CONFIG = {
  gift: {
    iconName: 'gift',
    iconBg: '#FEF2F2',
    iconColor: '#EF4444',
    badgeText: '선물',
    actionHint: '선물·정산 확인',
  },
  settlement: {
    iconName: 'card',
    iconBg: '#EFF6FF',
    iconColor: '#3B82F6',
    badgeText: '정산',
    actionHint: '정산 내역 확인',
  },
  visit: {
    iconName: 'eye',
    iconBg: '#ECFDF5',
    iconColor: '#10B981',
    badgeText: '방문',
    actionHint: '방문자 확인',
  },
  follow: {
    iconName: 'person-add',
    iconBg: '#F5F3FF',
    iconColor: '#8B5CF6',
    badgeText: '팔로우',
    actionHint: '팔로우 목록',
  },
  chat: {
    iconName: 'chatbubble-ellipses',
    iconBg: '#FEF9C3',
    iconColor: '#CA8A04',
    badgeText: '대화',
    actionHint: '대화방 바로가기',
  },
  post_comment: {
    iconName: 'chatbox-ellipses',
    iconBg: '#FFF7ED',
    iconColor: '#EA580C',
    badgeText: '댓글',
    actionHint: '게시물 확인',
  },
  post_like: {
    iconName: 'heart',
    iconBg: '#FDF2F8',
    iconColor: '#EC4899',
    badgeText: '공감',
    actionHint: '게시물 확인',
  },
};

export default function NotificationsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('announcements'); // 'announcements' | 'activity'
  const [announcements, setAnnouncements] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedAnnounceId, setExpandedAnnounceId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      if (activeTab === 'announcements') {
        const data = await apiClient.getAnnouncements();
        setAnnouncements(Array.isArray(data) ? data : []);
      } else {
        const data = await apiClient.getActivityNotifications();
        setActivities(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('알림 로딩 오류:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggleAccordion = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedAnnounceId((prev) => (prev === id ? null : id));
  };

  const handleMarkAllAsRead = async () => {
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setActivities((prev) => prev.map((a) => ({ ...a, isRead: true })));
      await apiClient.markAllNotificationsAsRead();
    } catch (e) {
      console.warn('모두 읽음 처리 중 오류:', e);
    }
  };

  const handleNotificationPress = (item) => {
    // 읽음 상태로 업데이트
    setActivities((prev) =>
      prev.map((a) => (a.id === item.id ? { ...a, isRead: true } : a))
    );

    switch (item.type) {
      case 'visit':
        navigation.navigate('Visitors');
        break;
      case 'follow':
        navigation.navigate('Follows', { initialTab: 'followers' });
        break;
      case 'settlement':
      case 'gift':
        navigation.navigate('Settlement');
        break;
      case 'chat':
        if (item.data?.chatId) {
          navigation.navigate('ChatRoom', {
            chatId: item.data.chatId,
            counterpartAccountId: item.data?.senderAccountId || item.senderAccountId,
            counterpartNickname: item.data?.senderNickname || '대화 상대',
            counterpartAvatar: item.avatar,
          });
        } else {
          navigation.navigate('ChatsMain');
        }
        break;
      case 'post':
      case 'post_comment':
      case 'post_like':
        if (item.data?.postId) {
          navigation.navigate('PostDetail', { postId: item.data.postId });
        } else {
          navigation.navigate('CommunityFeed');
        }
        break;
      default:
        if (item.data?.targetScreen) {
          navigation.navigate(item.data.targetScreen, item.data?.params || {});
        }
        break;
    }
  };

  const handleAvatarPress = (item) => {
    const targetAccountId =
      item.data?.senderAccountId || item.data?.visitorId || item.senderAccountId;
    if (targetAccountId) {
      navigation.navigate('ProfileDetail', { accountId: targetAccountId });
    } else {
      handleNotificationPress(item);
    }
  };

  const renderAnnouncementItem = ({ item }) => {
    const isExpanded = expandedAnnounceId === item.id;
    return (
      <View style={styles.announceCard}>
        <TouchableOpacity
          style={styles.announceHeader}
          activeOpacity={0.7}
          onPress={() => toggleAccordion(item.id)}
        >
          <View style={styles.announceHeaderContent}>
            <View style={styles.announceMetaRow}>
              {item.isImportant && (
                <View style={styles.badgeImportant}>
                  <Text style={styles.badgeImportantText}>중요</Text>
                </View>
              )}
              <Text style={styles.announceDate}>{formatRelativeTime(item.createdAt)}</Text>
            </View>
            <Text style={styles.announceTitle} numberOfLines={isExpanded ? undefined : 2}>
              {item.title}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#8E8E93"
            style={styles.expandChevron}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.announceBody}>
            <View style={styles.announceDivider} />
            <Text style={styles.announceText}>{item.content}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderActivityItem = ({ item }) => {
    const config = ACTIVITY_TYPE_CONFIG[item.type] || {
      iconName: 'notifications',
      iconBg: '#F3F4F6',
      iconColor: '#4B5563',
      badgeText: '알림',
      actionHint: '자세히 보기',
    };

    const isUnread = item.isRead === false;

    return (
      <TouchableOpacity
        style={[styles.activityCard, isUnread && styles.activityCardUnread]}
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)}
      >
        <TouchableOpacity
          style={styles.activityAvatarBox}
          activeOpacity={0.8}
          onPress={() => handleAvatarPress(item)}
        >
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.activityAvatar} />
          ) : (
            <View style={[styles.activityIconCircle, { backgroundColor: config.iconBg }]}>
              <Ionicons name={config.iconName} size={20} color={config.iconColor} />
            </View>
          )}
          {item.avatar && (
            <View style={[styles.activitySubBadge, { backgroundColor: config.iconBg }]}>
              <Ionicons name={config.iconName} size={11} color={config.iconColor} />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.activityContent}>
          <View style={styles.activityHeaderRow}>
            <View style={styles.activityTitleRow}>
              <View style={[styles.activityTypeBadge, { backgroundColor: config.iconBg }]}>
                <Text style={[styles.activityTypeBadgeText, { color: config.iconColor }]}>
                  {config.badgeText}
                </Text>
              </View>
              <Text style={styles.activityTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {isUnread && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.activityTime}>{formatRelativeTime(item.createdAt)}</Text>
          </View>
          <Text style={styles.activityBody} numberOfLines={2}>
            {item.body}
          </Text>
          <View style={styles.activityActionRow}>
            <Text style={[styles.activityActionText, { color: config.iconColor }]}>
              {config.actionHint}
            </Text>
            <Ionicons name="chevron-forward" size={13} color={config.iconColor} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const currentList = activeTab === 'announcements' ? announcements : activities;
  const hasUnreadActivities = activities.some((a) => a.isRead === false);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 상단 네비게이션 바 */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBackBtn}
          onPress={() => navigation.goBack()}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>알림 및 소식</Text>
        {activeTab === 'activity' && hasUnreadActivities ? (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={handleMarkAllAsRead}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-done" size={15} color="#4B5563" style={{ marginRight: 3 }} />
            <Text style={styles.markAllText}>모두 읽음</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.navRightPlaceholder} />
        )}
      </View>

      {/* 세그먼트 탭 */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === 'announcements' && styles.segmentBtnActive,
          ]}
          onPress={() => setActiveTab('announcements')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="megaphone-outline"
            size={16}
            color={activeTab === 'announcements' ? colors.primary : '#6B7280'}
            style={styles.segmentIcon}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'announcements' && styles.segmentTextActive,
            ]}
          >
            공지사항
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === 'activity' && styles.segmentBtnActive,
          ]}
          onPress={() => setActiveTab('activity')}
          activeOpacity={0.8}
        >
          <View style={styles.tabIconWrapper}>
            <Ionicons
              name="notifications-outline"
              size={16}
              color={activeTab === 'activity' ? colors.primary : '#6B7280'}
              style={styles.segmentIcon}
            />
            {hasUnreadActivities && <View style={styles.tabBadgeDot} />}
          </View>
          <Text
            style={[
              styles.segmentText,
              activeTab === 'activity' && styles.segmentTextActive,
            ]}
          >
            활동 알림
          </Text>
        </TouchableOpacity>
      </View>

      {/* 리스트 영역 */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>소식을 불러오는 중입니다...</Text>
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => String(item.id)}
          renderItem={
            activeTab === 'announcements' ? renderAnnouncementItem : renderActivityItem
          }
          contentContainerStyle={
            currentList.length === 0 ? styles.emptyContainer : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons
                name={
                  activeTab === 'announcements'
                    ? 'information-circle-outline'
                    : 'notifications-off-outline'
                }
                size={54}
                color="#D1D5DB"
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 'announcements'
                  ? '등록된 공지사항이 없습니다'
                  : '새로운 활동 알림이 없습니다'}
              </Text>
              <Text style={styles.emptyDesc}>
                {activeTab === 'announcements'
                  ? '새로운 소식과 업데이트가 등록되면 바로 알려드릴게요.'
                  : '선물 수신, 포인트 정산, 프로필 방문 등의 소식이 표시됩니다.'}
              </Text>
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
    backgroundColor: '#F8F9FA',
  },
  navBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  navBackBtn: {
    padding: 4,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  navRightPlaceholder: {
    width: 32,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 4,
  },
  segmentBtnActive: {
    backgroundColor: '#FFF0F2',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  tabIconWrapper: {
    position: 'relative',
  },
  tabBadgeDot: {
    position: 'absolute',
    top: -2,
    right: 3,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  segmentIcon: {
    marginRight: 6,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  segmentTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  announceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  announceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  announceHeaderContent: {
    flex: 1,
    paddingRight: 10,
  },
  announceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeImportant: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeImportantText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  announceDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  announceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 22,
  },
  expandChevron: {
    marginTop: 2,
  },
  announceDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  announceBody: {},
  announceText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  activityCardUnread: {
    backgroundColor: '#FFFEF7',
    borderColor: '#FDE68A',
    borderWidth: 1.2,
  },
  activityAvatarBox: {
    position: 'relative',
    marginRight: 12,
  },
  activityAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  activityIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activitySubBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  activityContent: {
    flex: 1,
  },
  activityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  activityTypeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginRight: 6,
  },
  activityTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginLeft: 6,
  },
  activityTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  activityTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  activityBody: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  activityActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  activityActionText: {
    fontSize: 11.5,
    fontWeight: '600',
    marginRight: 2,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 14,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
