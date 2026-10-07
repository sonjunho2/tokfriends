// src/screens/main/ChatsScreen.js
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
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
import { checkAndConfirmActionPoint } from '../../utils/pointPolicyHelper';

const CHAT_CATEGORIES = ['친목', '취미', '고민', '운동', '동네', '자유'];

const normalizeChats = (response) => {
  if (!Array.isArray(response)) {
    return [];
  }

  return response.map((chat) => {
    const counterpartId = chat?.counterpart?.id || chat?.id || 'counterpart';
    const title = chat?.title || chat?.counterpart?.displayName || chat?.counterpart?.handle || '대화방';
    const avatar = chat?.avatar || chat?.counterpart?.avatarUrl || chat?.counterpart?.avatarUri || null;
    return {
      id: chat.id,
      counterpartAccountId: counterpartId,
      title,
      avatar,
      lastMessageAt: chat.lastMessageAt ?? null,
      lastMessage: typeof chat.lastMessage === 'string' ? chat.lastMessage : null,
      unreadCount: typeof chat.unreadCount === 'number' ? chat.unreadCount : 0,
      entryFee: Number(chat?.entryFee ?? 0),
      category: chat?.category || null,
      isGroup: Boolean(chat?.isGroup),
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

  // 채팅방 개설 모달 상태
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('친목');
  const [newEntryFee, setNewEntryFee] = useState(0);
  const [isGroup, setIsGroup] = useState(false);
  const [creating, setCreating] = useState(false);

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

  // 채팅방 입장: 호스트가 설정한 entryFee 적용 (0온이면 무료)
  const handleOpenChat = useCallback(
    (item) => {
      const fee = Number(item.entryFee ?? 0);
      const actionName = fee > 0 ? `채팅방 참여(입장료 ${fee.toLocaleString()} 온)` : '채팅방 무료 참여';

      checkAndConfirmActionPoint({
        actionType: 'chatRoomJoin',
        actionName,
        overrideAmount: fee,
        navigation,
        onConfirm: () => {
          navigation.navigate('ChatRoom', {
            id: item.id,
            chatId: item.id,
            title: item.title,
            counterpartAccountId: item.counterpartAccountId,
            room: item,
            isGroup: item.isGroup,
          });
        },
      });
    },
    [navigation]
  );

  // 채팅방 신규 개설: 관리자 개설 정책 포인트 소모 + 개설자가 참여비(entryFee) 설정
  const handleCreateRoom = async () => {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) {
      Alert.alert('알림', '대화방 제목을 입력해 주세요.');
      return;
    }

    const fee = Math.max(0, Number(newEntryFee || 0));

    checkAndConfirmActionPoint({
      actionType: 'chatRoomCreate',
      actionName: '대화방 개설',
      navigation,
      onConfirm: async () => {
        setCreating(true);
        try {
          const createdRoom = await apiClient.createChatRoom({
            title: trimmedTitle,
            category: newCategory,
            entryFee: fee,
            isGroup,
          });
          setCreateModalVisible(false);
          setNewTitle('');
          setNewEntryFee(0);
          setIsGroup(false);
          loadChats();
          navigation.navigate('ChatRoom', {
            id: createdRoom.id,
            chatId: createdRoom.id,
            title: createdRoom.title,
            counterpartAccountId: createdRoom.counterpart?.id || createdRoom.id,
            room: createdRoom,
            isGroup,
          });
        } catch (e) {
          Alert.alert('개설 실패', e?.message || '대화방을 개설하지 못했습니다.');
        } finally {
          setCreating(false);
        }
      },
    });
  };

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
          1. GNB 헤더 (56px) - 방 개설 버튼 추가
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
          {/* 채팅방 개설 상단 버튼 */}
          <TouchableOpacity
            style={styles.headerCreateBtn}
            onPress={() => setCreateModalVisible(true)}
            hitSlop={6}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={17} color="#191919" />
            <Text style={styles.headerCreateBtnText}>방 개설</Text>
          </TouchableOpacity>

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

          {/* 인연 찾기 */}
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('HotRecommend')}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#191919" />
          </TouchableOpacity>

          {/* 마이/설정 */}
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
          검색바 (토글 시 노출)
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
          대화 목록 리스트
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
                  : '관심사가 맞는 동네 이웃과 대화방을 만들고 이야기를 나눠보세요.'}
              </Text>
              {!searchQuery && (
                <View style={styles.emptyActionRow}>
                  <TouchableOpacity
                    style={styles.emptyCreateBtn}
                    onPress={() => setCreateModalVisible(true)}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="add-circle" size={18} color="#191919" />
                    <Text style={styles.emptyCreateBtnText}>대화방 개설하기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.findFriendsBtn}
                    onPress={() => navigation.navigate('HotRecommend')}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.findFriendsBtnText}>인연 찾기</Text>
                    <Ionicons name="arrow-forward" size={15} color="#191919" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          }
        />
      )}

      {/* 플로팅 채팅방 개설 버튼 (FAB) */}
      <TouchableOpacity
        style={styles.floatingCreateBtn}
        onPress={() => setCreateModalVisible(true)}
        activeOpacity={0.88}
      >
        <Ionicons name="chatbubbles" size={20} color="#191919" />
        <Text style={styles.floatingCreateBtnText}>방 만들기</Text>
      </TouchableOpacity>

      {/* =================================================================
          새 대화방 개설 모달 (참여 비용 자율 설정)
          ================================================================= */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setCreateModalVisible(false)}
              hitSlop={8}
            >
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>새 대화방 개설</Text>
            <TouchableOpacity
              onPress={handleCreateRoom}
              disabled={creating || !newTitle.trim()}
              style={[
                styles.modalSubmitButton,
                (!newTitle.trim() || creating) && styles.modalSubmitButtonDisabled,
              ]}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#191919" />
              ) : (
                <Text style={styles.modalSubmitText}>개설</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. 대화방 제목 */}
            <Text style={styles.inputLabel}>대화방 제목</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="예: 주말에 커피 한 잔 하실 분 ☕"
              placeholderTextColor="#8E8E93"
              value={newTitle}
              onChangeText={setNewTitle}
              maxLength={60}
              autoFocus
            />

            {/* 2. 대화 유형 */}
            <Text style={[styles.inputLabel, { marginTop: 22 }]}>대화 유형</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeChip, !isGroup && styles.typeChipActive]}
                onPress={() => setIsGroup(false)}
              >
                <Ionicons
                  name="person"
                  size={15}
                  color={!isGroup ? '#191919' : '#8E8E93'}
                />
                <Text
                  style={[styles.typeChipText, !isGroup && styles.typeChipTextActive]}
                >
                  1:1 대화방
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeChip, isGroup && styles.typeChipActive]}
                onPress={() => setIsGroup(true)}
              >
                <Ionicons
                  name="people"
                  size={15}
                  color={isGroup ? '#191919' : '#8E8E93'}
                />
                <Text
                  style={[styles.typeChipText, isGroup && styles.typeChipTextActive]}
                >
                  그룹 대화방
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. 카테고리 */}
            <Text style={[styles.inputLabel, { marginTop: 22 }]}>카테고리</Text>
            <View style={styles.categoryRow}>
              {CHAT_CATEGORIES.map((cat) => {
                const isSelected = newCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipActive,
                    ]}
                    onPress={() => setNewCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 4. 참여자 입장료 (참여 온 설정 - 방 개설자 자율 지정) */}
            <Text style={[styles.inputLabel, { marginTop: 22 }]}>
              참여자 입장료 (참여 온 설정)
            </Text>
            <Text style={styles.inputSubLabel}>
              개설자가 직접 참여자 입장 시 소모될 온(ON)을 설정합니다. (0 온은 무료)
            </Text>
            <View style={styles.feeChipRow}>
              {[0, 10, 30, 50, 100].map((feeVal) => {
                const isSelected = newEntryFee === feeVal;
                return (
                  <TouchableOpacity
                    key={feeVal}
                    style={[
                      styles.feeChip,
                      isSelected && styles.feeChipActive,
                    ]}
                    onPress={() => setNewEntryFee(feeVal)}
                  >
                    <Text
                      style={[
                        styles.feeChipText,
                        isSelected && styles.feeChipTextActive,
                      ]}
                    >
                      {feeVal === 0 ? '무료' : `${feeVal} 온`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.customFeeRow}>
              <Text style={styles.customFeeLabel}>직접 입력:</Text>
              <TextInput
                style={styles.customFeeInput}
                placeholder="0"
                placeholderTextColor="#8E8E93"
                keyboardType="number-pad"
                value={String(newEntryFee)}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '');
                  const num = parseInt(cleaned, 10);
                  setNewEntryFee(isNaN(num) ? 0 : Math.min(num, 50000));
                }}
              />
              <Text style={styles.customFeeUnit}>온(ON)</Text>
            </View>

            {/* 5. 개설 안내 카드 */}
            <View style={styles.tipCard}>
              <Ionicons name="information-circle-outline" size={18} color="#D97706" />
              <Text style={styles.tipText}>
                대화방 개설 시 관리자 정책에 따른 온(ON)이 소모되며, 참여자는 개설자가 지정한 입장료({newEntryFee > 0 ? `${newEntryFee} 온` : '무료'})를 지불하고 참여하게 됩니다.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    gap: 10,
  },
  headerCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE500',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  headerCreateBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#191919',
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
    paddingBottom: 80,
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
    paddingVertical: 80,
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
  emptyActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE500',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 20,
  },
  emptyCreateBtnText: {
    color: '#191919',
    fontSize: 13,
    fontWeight: '800',
  },
  findFriendsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 20,
  },
  findFriendsBtnText: {
    color: '#191919',
    fontSize: 13,
    fontWeight: '700',
  },
  floatingCreateBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE500',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingCreateBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#191919',
  },
  // 모달 스타일
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3F5',
    backgroundColor: '#FFFFFF',
  },
  modalCancelText: {
    fontSize: 15,
    color: '#71717A',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#191919',
  },
  modalSubmitButton: {
    backgroundColor: '#FEE500',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
  },
  modalSubmitButtonDisabled: {
    opacity: 0.45,
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#191919',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalScrollContent: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#191919',
    marginBottom: 8,
  },
  inputSubLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 10,
    lineHeight: 16,
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#191919',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeChipActive: {
    backgroundColor: '#FFFBE6',
    borderColor: '#FEE500',
    borderWidth: 1.5,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  typeChipTextActive: {
    color: '#191919',
    fontWeight: '800',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#FFFBE6',
    borderColor: '#FEE500',
    borderWidth: 1.5,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
  },
  categoryChipTextActive: {
    color: '#191919',
    fontWeight: '800',
  },
  feeChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  feeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  feeChipActive: {
    backgroundColor: '#FFFBE6',
    borderColor: '#FEE500',
    borderWidth: 1.5,
  },
  feeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
  },
  feeChipTextActive: {
    color: '#191919',
    fontWeight: '800',
  },
  customFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  customFeeLabel: {
    fontSize: 13,
    color: '#71717A',
    fontWeight: '600',
  },
  customFeeInput: {
    minWidth: 80,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    color: '#191919',
    textAlign: 'right',
  },
  customFeeUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: '#71717A',
  },
  tipCard: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
});
