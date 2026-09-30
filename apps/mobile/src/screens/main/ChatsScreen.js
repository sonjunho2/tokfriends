// src/screens/main/ChatsScreen.js
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../../api/client';
import colors from '../../theme/colors';
import ChatListItem from '../../components/ChatListItem';

const normalizeChats = (response) => {
  if (!Array.isArray(response)) {
    throw new Error('대화 목록 응답 형식이 올바르지 않습니다.');
  }

  return response.map((chat) => {
    if (!chat?.id || !chat?.counterpart?.id) {
      throw new Error('대화 목록 응답 형식이 올바르지 않습니다.');
    }

    return {
      id: chat.id,
      counterpartAccountId: chat.counterpart.id,
      title: chat.counterpart.displayName || chat.counterpart.handle || '대화',
      avatar: chat.counterpart.avatarUrl || chat.counterpart.avatarUri || null,
      lastMessageAt: chat.lastMessageAt ?? null,
      lastMessage: typeof chat.lastMessage === 'string' ? chat.lastMessage : null,
      unreadCount: typeof chat.unreadCount === 'number' ? chat.unreadCount : 0,
    };
  });
};

export default function ChatsScreen({ navigation }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const loadChats = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await apiClient.getChats();
      setChats(normalizeChats(response));
    } catch (requestError) {
      setError(requestError?.message || '대화 목록을 불러오지 못했습니다.');
    } finally {
      if (refresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats])
  );

  const handleOpenChat = useCallback(
    (item) => {
      navigation.navigate('ChatRoom', {
        id: item.id,
        chatId: item.id,
        title: item.title,
        counterpartAccountId: item.counterpartAccountId,
      });
    },
    [navigation]
  );

  const filteredChats = chats.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    );
  });

  const canGoBack = (navigation.getState()?.index ?? 0) > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* =================================================================
          1. 카카오톡 스타일 GNB 헤더 (56px)
          ================================================================= */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {canGoBack && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={8}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={24} color="#191919" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>대화</Text>
        </View>

        <View style={styles.headerRight}>
          {/* 검색 아이콘 */}
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setIsSearchOpen((prev) => !prev)}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSearchOpen ? 'close' : 'search'}
              size={22}
              color="#191919"
            />
          </TouchableOpacity>

          {/* 새 대화 시작 / 인연 찾기 */}
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('HotRecommend')}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#191919" />
          </TouchableOpacity>

          {/* 설정 아이콘 */}
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('My')}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={21} color="#191919" />
          </TouchableOpacity>
        </View>
      </View>

      {/* =================================================================
          검색바 (토글 시 부드럽게 노출)
          ================================================================= */}
      {isSearchOpen && (
        <View style={styles.searchBarWrap}>
          <View style={styles.searchInputBox}>
            <Ionicons name="search" size={16} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="대화방 또는 메시지 검색"
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* =================================================================
          대화 목록 리스트 (카카오톡 인셋 디바이더)
          ================================================================= */}
      {loading ? (
        <View style={styles.stateWrap}>
          <ActivityIndicator size="large" color="#FEE500" />
          <Text style={styles.stateMessage}>대화 목록을 불러오는 중이에요...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateWrap}>
          <Text style={styles.errorTitle}>대화 목록을 불러오지 못했어요</Text>
          <Text style={styles.stateMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadChats()}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={filteredChats}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ChatListItem item={item} onPress={() => handleOpenChat(item)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.insetDivider} />}
          contentContainerStyle={[
            styles.listContent,
            !filteredChats.length && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadChats({ refresh: true })}
              tintColor="#FEE500"
              colors={['#FEE500']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="chatbubbles" size={38} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? '검색 결과가 없어요' : '새로운 대화를 시작해 보세요'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? '다른 검색어로 다시 시도해 보세요.'
                  : '관심사가 맞는 동네 이웃에게 따뜻한 첫 인사를 건네보세요.'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.findFriendsBtn}
                  onPress={() => navigation.navigate('HotRecommend')}
                  activeOpacity={0.88}
                >
                  <Text style={styles.findFriendsBtnText}>새로운 인연 찾기</Text>
                  <Ionicons name="arrow-forward" size={16} color="#191919" />
                </TouchableOpacity>
              )}
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3F5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtn: {
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#191919',
    letterSpacing: -0.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    padding: 4,
  },
  searchBarWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3F5',
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 18,
    paddingHorizontal: 12,
    height: 38,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#191919',
    paddingVertical: 0,
  },
  list: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
  },
  insetDivider: {
    height: 1,
    backgroundColor: '#F2F3F5',
    marginLeft: 82,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  stateWrap: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  stateMessage: {
    marginTop: 12,
    fontSize: 13,
    color: '#71717A',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#191919',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FEE500',
  },
  retryButtonText: {
    color: '#191919',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyWrap: {
    paddingVertical: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F7F8FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#191919',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  findFriendsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE500',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  findFriendsBtnText: {
    color: '#191919',
    fontSize: 14,
    fontWeight: '800',
  },
});
