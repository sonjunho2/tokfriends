import React, { useState, useEffect, useCallback, useRef } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import ScrollExpandableFAB from '../../components/common/ScrollExpandableFAB';
import SudaCreateModal from '../../components/suda/SudaCreateModal';
import {
  SudaPostItem,
  ChatRoomItem,
  fetchSudaPosts,
  fetchChatRooms,
} from '../../services/sudaService';

const { width } = Dimensions.get('window');

export default function ChatsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  // 상단 듀얼 세그먼트: 'TALK' (실시간 토크) vs 'CHATS' (내 대화함)
  const [activeMainTab, setActiveMainTab] = useState('TALK');

  // 대화함 서브 세그먼트: 'SUDA' (수다 톡) vs 'MARKET' (거래 톡)
  const [activeChatSubTab, setActiveChatSubTab] = useState('SUDA');

  const [sudaPosts, setSudaPosts] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // FAB 가변 스크롤 상태
  const [isFabExpanded, setIsFabExpanded] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const lastScrollY = useRef(0);

  const loadData = useCallback(async () => {
    try {
      if (activeMainTab === 'TALK') {
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

  // 실시간 1줄 수다 카드 렌더링
  const renderSudaItem = ({ item }) => (
    <View style={styles.sudaCard}>
      <View style={styles.sudaHeader}>
        <View style={styles.sudaAuthorLeft}>
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
        </View>

        {/* 원터치 [💌 쪽지보내기] 버튼: 친구 수락 대기 없이 1:1 즉시 연결 */}
        <TouchableOpacity
          style={styles.directMessageBtn}
          onPress={() => {
            navigation.navigate('ChatRoom', {
              peerId: item.author.id,
              peerName: item.author.nickname,
              initialType: 'SUDA',
            });
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="mail" size={14} color="#FF3B6B" />
          <Text style={styles.directMessageText}>쪽지보내기</Text>
        </TouchableOpacity>
      </View>

      {/* 1줄 본문 */}
      <Text style={styles.sudaContent}>{item.content}</Text>

      {/* 하단 공감 & 댓글 */}
      <View style={styles.sudaFooter}>
        <View style={styles.reactionsRow}>
          <TouchableOpacity style={styles.reactionBtn} activeOpacity={0.7}>
            <Ionicons name="heart-outline" size={16} color="#64748B" />
            <Text style={styles.reactionCount}>{item.likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reactionBtn} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={15} color="#64748B" />
            <Text style={styles.reactionCount}>{item.repliesCount}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // 대화함 항목 렌더링 (수다 톡 or 거래 톡)
  const renderChatRoomItem = ({ item }) => {
    const isMarket = item.type === 'MARKET';

    return (
      <TouchableOpacity
        style={styles.chatRoomCard}
        activeOpacity={0.8}
        onPress={() => {
          navigation.navigate('ChatRoom', {
            peerId: item.peer.id,
            peerName: item.peer.nickname,
            marketOrder: item.marketOrder,
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

          {/* 거래 톡일 경우 상단에 고정된 상품 정보 요약 노출 */}
          {isMarket && item.marketOrder && (
            <View style={styles.orderSummaryBar}>
              <Image source={{ uri: item.marketOrder.productImage }} style={styles.orderThumb} />
              <View style={styles.orderTextBox}>
                <Text style={styles.orderTitle} numberOfLines={1}>
                  {item.marketOrder.productTitle}
                </Text>
                <Text style={styles.orderPrice}>
                  {item.marketOrder.price.toLocaleString()} ON
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
      {/* 1. 상단 56px 통일 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>수다</Text>
          <View style={styles.locationBadge}>
            <Ionicons name="location-sharp" size={12} color="#FF3B6B" />
            <Text style={styles.locationBadgeText}>역삼1동</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
            <Ionicons name="search-outline" size={22} color={tokens.colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={22} color={tokens.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. 상단 듀얼 메인 세그먼트: [⚡ 실시간 토크] vs [💬 내 대화함] */}
      <View style={styles.mainSegmentContainer}>
        <TouchableOpacity
          style={[styles.mainSegmentBtn, activeMainTab === 'TALK' && styles.mainSegmentBtnActive]}
          onPress={() => setActiveMainTab('TALK')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="flash"
            size={16}
            color={activeMainTab === 'TALK' ? '#FF3B6B' : '#64748B'}
          />
          <Text
            style={[
              styles.mainSegmentText,
              activeMainTab === 'TALK' && styles.mainSegmentTextActive,
            ]}
          >
            실시간 토크
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainSegmentBtn, activeMainTab === 'CHATS' && styles.mainSegmentBtnActive]}
          onPress={() => setActiveMainTab('CHATS')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="chatbubbles"
            size={16}
            color={activeMainTab === 'CHATS' ? '#FF3B6B' : '#64748B'}
          />
          <Text
            style={[
              styles.mainSegmentText,
              activeMainTab === 'CHATS' && styles.mainSegmentTextActive,
            ]}
          >
            내 대화함
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. [내 대화함] 선택 시 서브 세그먼트: [수다 톡] vs [거래 톡] */}
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

      {/* 4. 본문 리스트 (1줄 토크 피드 OR 대화방 목록) */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      ) : activeMainTab === 'TALK' ? (
        <FlatList
          data={sudaPosts}
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
              <Text style={styles.emptyTitle}>첫 번째 동네 수다를 시작해보세요!</Text>
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
                  ? '실시간 토크에서 이웃에게 쪽지를 보내 대화를 시작해보세요!'
                  : '마켓에서 상품을 선택하고 안전거래 톡을 시작해보세요!'}
              </Text>
            </View>
          }
        />
      )}

      {/* 5. [실시간 토크] 탭일 때 우측 하단 가변 FAB: + 글쓰기 */}
      {activeMainTab === 'TALK' && (
        <ScrollExpandableFAB
          label="글쓰기"
          iconName="pencil"
          isExpanded={isFabExpanded}
          onPress={() => setShowCreateModal(true)}
        />
      )}

      {/* 6. 1줄 수다 작성 모달 */}
      <SudaCreateModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          loadData();
        }}
      />
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
    fontSize: 12,
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
  mainSegmentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
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
    gap: 6,
    borderRadius: 14,
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
    fontWeight: '800',
  },
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
    padding: 16,
    paddingBottom: 110,
  },
  sudaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sudaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sudaAuthorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  directMessageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF0F3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE4E8',
  },
  directMessageText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF3B6B',
  },
  sudaContent: {
    fontSize: 14,
    lineHeight: 21,
    color: '#1E293B',
    fontWeight: '500',
    marginVertical: 4,
  },
  sudaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
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
});
