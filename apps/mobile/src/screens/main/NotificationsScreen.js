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
    let iconName = 'notifications';
    let iconBg = '#F3F4F6';
    let iconColor = '#4B5563';

    if (item.type === 'gift') {
      iconName = 'gift';
      iconBg = '#FEF2F2';
      iconColor = '#EF4444';
    } else if (item.type === 'settlement') {
      iconName = 'card';
      iconBg = '#EFF6FF';
      iconColor = '#3B82F6';
    } else if (item.type === 'visit') {
      iconName = 'eye';
      iconBg = '#ECFDF5';
      iconColor = '#10B981';
    }

    return (
      <View style={styles.activityCard}>
        <View style={styles.activityAvatarBox}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.activityAvatar} />
          ) : (
            <View style={[styles.activityIconCircle, { backgroundColor: iconBg }]}>
              <Ionicons name={iconName} size={20} color={iconColor} />
            </View>
          )}
          {item.avatar && (
            <View style={[styles.activitySubBadge, { backgroundColor: iconBg }]}>
              <Ionicons name={iconName} size={11} color={iconColor} />
            </View>
          )}
        </View>

        <View style={styles.activityContent}>
          <View style={styles.activityHeaderRow}>
            <Text style={styles.activityTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.activityTime}>{formatRelativeTime(item.createdAt)}</Text>
          </View>
          <Text style={styles.activityBody}>{item.body}</Text>
        </View>
      </View>
    );
  };

  const currentList = activeTab === 'announcements' ? announcements : activities;

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
        <View style={styles.navRightPlaceholder} />
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
          <Ionicons
            name="notifications-outline"
            size={16}
            color={activeTab === 'activity' ? colors.primary : '#6B7280'}
            style={styles.segmentIcon}
          />
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
  activityTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
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
