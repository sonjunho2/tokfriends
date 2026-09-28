// src/screens/main/ChatsScreen.js
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
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

  const canGoBack = navigation.canGoBack();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerSide}>
          {canGoBack && (
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerTitle}>대화</Text>
        <View style={styles.headerSideRight} />
      </View>

      {loading ? (
        <View style={styles.stateWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateMessage}>대화 목록을 불러오는 중이에요.</Text>
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
          data={chats}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ChatListItem item={item} onPress={() => handleOpenChat(item)} />
          )}
          contentContainerStyle={[styles.listContent, !chats.length && styles.emptyListContent]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadChats({ refresh: true })}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="chatbubbles-outline" size={36} color={colors.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>대화가 아직 없어요</Text>
              <Text style={styles.emptySubtitle}>
                새로운 친구를 찾고 첫 인사를 건네보세요.
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerSide: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerSideRight: { minWidth: 40, alignItems: 'flex-end', justifyContent: 'center' },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  list: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
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
    marginTop: 10,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyWrap: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textTertiary,
  },
});
