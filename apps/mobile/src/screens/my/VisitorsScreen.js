// src/screens/my/VisitorsScreen.js
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

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return '방금 전';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;

  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${m}월 ${d}일`;
}

export default function VisitorsScreen({ navigation }) {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVisitors = useCallback(async () => {
    try {
      const res = await apiClient.getProfileVisits({ type: 'received', limit: 50 });
      const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      setVisitors(items);
    } catch (err) {
      console.warn('Failed to load profile visitors:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadVisitors();
  }, [loadVisitors]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadVisitors();
  };

  const handlePressUser = (item) => {
    const profilePayload = {
      id: item.userId || item.id,
      targetAccountId: item.id,
      targetUserId: item.userId || undefined,
      name: item.displayName || '회원',
      avatar: item.avatarUri,
      location: [item.region1, item.region2].filter(Boolean).join(' ') || '지역 미설정',
      title: item.headline || '한줄 소개가 없습니다.',
    };
    navigation.navigate('ProfileDetail', { profile: profilePayload });
  };

  const handleStartChat = async (item) => {
    try {
      const targetParams = item.userId
        ? { targetUserId: item.userId }
        : { targetAccountId: item.id };
      const room = await apiClient.ensureDirectRoom(targetParams);
      const roomId = room?.id || room?._id;
      if (roomId) {
        navigation.navigate('ChatRoom', {
          chatId: roomId,
          counterpart: {
            id: item.userId || item.id,
            name: item.displayName || '회원',
            avatar: item.avatarUri,
          },
        });
      }
    } catch (e) {
      Alert.alert('대화 시작 실패', e?.message || '대화방을 생성하지 못했습니다.');
    }
  };

  const renderVisitorItem = ({ item }) => {
    const location = [item.region1, item.region2].filter(Boolean).join(' ');

    return (
      <TouchableOpacity
        style={styles.visitorCard}
        activeOpacity={0.85}
        onPress={() => handlePressUser(item)}
      >
        {/* 아바타 */}
        {item.avatarUri ? (
          <Image source={{ uri: item.avatarUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={24} color="#A1A1AA" />
          </View>
        )}

        {/* 상세 정보 */}
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName} numberOfLines={1}>
              {item.displayName || '회원'}
            </Text>
            <Text style={styles.visitedTime}>{formatRelativeTime(item.visitedAt)}</Text>
          </View>

          {location ? (
            <Text style={styles.locationText} numberOfLines={1}>
              📍 {location}
            </Text>
          ) : null}

          {item.headline ? (
            <Text style={styles.headlineText} numberOfLines={1}>
              {item.headline}
            </Text>
          ) : null}
        </View>

        {/* 대화 바로가기 액션 */}
        <TouchableOpacity
          style={styles.chatActionBtn}
          onPress={() => handleStartChat(item)}
          hitSlop={6}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#191919" />
          <Text style={styles.chatActionText}>대화</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* GNB 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#191919" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 방문자</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* 안내 배너 */}
      <View style={styles.noticeBanner}>
        <Ionicons name="eye-outline" size={20} color="#D97706" />
        <Text style={styles.noticeBannerText}>
          최근 내 프로필을 둘러본 이웃들입니다.{'\n'}마음에 드는 이웃에게 대화나 선물을 건네보세요 ✨
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>방문자 목록을 불러오는 중...</Text>
        </View>
      ) : visitors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="people-outline" size={44} color="#A1A1AA" />
          </View>
          <Text style={styles.emptyTitle}>아직 프로필 방문자가 없습니다</Text>
          <Text style={styles.emptySub}>
            동네 피드에 일상을 공유하거나 라이브 방송에 참여해{'\n'}새로운 이웃과 소통해 보세요!
          </Text>
          <TouchableOpacity
            style={styles.emptyCtaButton}
            onPress={() => navigation.navigate('CommunityFeed')}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyCtaText}>동네 피드 둘러보기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visitors}
          keyExtractor={(item, index) => `${item.id}-${item.visitedAt || index}`}
          renderItem={renderVisitorItem}
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
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 10,
  },
  noticeBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  visitorCard: {
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
    width: 52,
    height: 52,
    borderRadius: 26,
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
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  displayName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191919',
    maxWidth: '65%',
  },
  visitedTime: {
    fontSize: 12,
    color: '#A1A1AA',
    fontWeight: '500',
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
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE500',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  chatActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191919',
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
