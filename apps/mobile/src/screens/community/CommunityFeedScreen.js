// src/screens/community/CommunityFeedScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import Avatar from '../../components/Avatar';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return '방금 전';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export default function CommunityFeedScreen({ navigation, route }) {
  const { user: currentUser } = useAuth();
  const initialTopicId = route?.params?.initialTopicId || null;

  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopicId);
  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Write modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTopicId, setNewPostTopicId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load topics
  const loadTopics = useCallback(async () => {
    try {
      const data = await apiClient.getTopics();
      const list = Array.isArray(data) ? data : [];
      setTopics(list);
      if (!newPostTopicId && list.length > 0) {
        setNewPostTopicId(list[0].id);
      }
    } catch (e) {
      console.warn('Failed to load topics', e);
    }
  }, [newPostTopicId]);

  // Load posts
  const loadPosts = useCallback(
    async (topicId, cursor = null, isRefresh = false) => {
      try {
        let res;
        if (topicId) {
          res = await apiClient.getTopicPosts(topicId, cursor ? { cursor } : {});
        } else {
          res = await apiClient.getPosts(cursor ? { cursor } : {});
        }

        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
        const next = res?.nextCursor || null;
        const more = Boolean(res?.hasMore);

        if (cursor && !isRefresh) {
          setPosts((prev) => [...prev, ...items]);
        } else {
          setPosts(items);
        }
        setNextCursor(next);
        setHasMore(more);
      } catch (e) {
        console.warn('Failed to load posts', e);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadTopics();
    loadPosts(selectedTopicId);
  }, [loadTopics, loadPosts, selectedTopicId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTopics();
    loadPosts(selectedTopicId, null, true);
  }, [loadTopics, loadPosts, selectedTopicId]);

  const onEndReached = useCallback(() => {
    if (!hasMore || loadingMore || !nextCursor) return;
    setLoadingMore(true);
    loadPosts(selectedTopicId, nextCursor);
  }, [hasMore, loadingMore, nextCursor, selectedTopicId, loadPosts]);

  const handleSelectTopic = (topicId) => {
    setSelectedTopicId(topicId);
    setLoading(true);
    setPosts([]);
    setNextCursor(null);
  };

  const handleCreatePost = async () => {
    const text = newPostContent.trim();
    if (!text) {
      Alert.alert('알림', '게시글 내용을 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.createPost({
        content: text,
        topicId: newPostTopicId || undefined,
      });
      setModalVisible(false);
      setNewPostContent('');
      Alert.alert('등록 완료', '게시글이 성공적으로 등록되었습니다.');
      onRefresh();
    } catch (e) {
      Alert.alert('등록 실패', e?.message || '게시글 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = (postId) => {
    Alert.alert('게시글 삭제', '이 게시글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.deletePost(postId);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            Alert.alert('완료', '게시글이 삭제되었습니다.');
          } catch (e) {
            Alert.alert('삭제 실패', e?.message || '게시글 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const handleReportPost = (post) => {
    Alert.prompt
      ? Alert.prompt(
          '게시글 신고',
          '신고 사유를 입력해 주세요 (부적절한 내용, 욕설, 광고 등):',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '신고',
              onPress: async (reason) => {
                if (!reason?.trim()) return;
                try {
                  await apiClient.reportUser({
                    postId: post.id,
                    targetUserId: post.author?.id,
                    reason: reason.trim(),
                  });
                  Alert.alert('신고 접수', '신고가 접수되었습니다. 검토 후 조치하겠습니다.');
                } catch (e) {
                  Alert.alert('신고 실패', e?.message || '신고 처리에 실패했습니다.');
                }
              },
            },
          ],
        )
      : Alert.alert('게시글 신고', '부적절한 게시글로 신고하시겠습니까?', [
          { text: '취소', style: 'cancel' },
          {
            text: '신고',
            onPress: async () => {
              try {
                await apiClient.reportUser({
                  postId: post.id,
                  targetUserId: post.author?.id,
                  reason: '부적절한 커뮤니티 게시글 신고',
                });
                Alert.alert('신고 접수', '신고가 접수되었습니다. 검토 후 조치하겠습니다.');
              } catch (e) {
                Alert.alert('신고 실패', e?.message || '신고 처리에 실패했습니다.');
              }
            },
          },
        ]);
  };

  const handleBlockAuthor = (post) => {
    const author = post.author;
    if (!author?.id) return;
    Alert.alert(
      '작성자 차단',
      `${author.name}님을 차단하시겠습니까?\n차단하면 해당 사용자의 글과 메시지가 보이지 않습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '차단',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.blockUser({ blockedUserId: author.id });
              setPosts((prev) => prev.filter((p) => p.author?.id !== author.id));
              Alert.alert('차단 완료', `${author.name}님을 차단했습니다.`);
            } catch (e) {
              Alert.alert('차단 실패', e?.message || '차단 처리에 실패했습니다.');
            }
          },
        },
      ],
    );
  };

  const handlePostOptions = (post) => {
    const isMine =
      currentUser?.id && post.author?.id && String(currentUser.id) === String(post.author.id);

    if (isMine) {
      Alert.alert('게시글 관리', '원하시는 작업을 선택해 주세요.', [
        { text: '취소', style: 'cancel' },
        { text: '게시글 삭제', style: 'destructive', onPress: () => handleDeletePost(post.id) },
      ]);
    } else {
      Alert.alert('게시글 옵션', '원하시는 작업을 선택해 주세요.', [
        { text: '취소', style: 'cancel' },
        { text: '게시글 신고', onPress: () => handleReportPost(post) },
        {
          text: '작성자 차단',
          style: 'destructive',
          onPress: () => handleBlockAuthor(post),
        },
      ]);
    }
  };

  const handleOpenAuthorProfile = (author) => {
    if (!author) return;
    navigation.navigate('ProfileDetail', {
      profile: {
        id: author.id,
        targetUserId: author.id,
        targetAccountId: author.targetAccountId,
        name: author.name,
        avatar: author.avatar,
        location: author.region,
        headline: author.headline,
        bio: author.headline,
      },
    });
  };

  const handleStartChat = async (author) => {
    if (!author) return;
    try {
      const room = await apiClient.ensureDirectRoom(
        author.id ? { targetUserId: author.id } : { targetAccountId: author.targetAccountId },
      );
      const roomId = room?.id || room?._id;
      if (!roomId) throw new Error('대화방을 생성할 수 없습니다.');

      navigation.navigate('Chat', {
        screen: 'ChatRoom',
        params: {
          id: roomId,
          room,
          user: {
            id: author.id,
            targetAccountId: author.targetAccountId,
            name: author.name,
            avatar: author.avatar,
            headline: author.headline,
          },
        },
      });
    } catch (e) {
      Alert.alert('대화 시작 실패', e?.message || '대화방 연결에 실패했습니다.');
    }
  };

  const renderPostItem = ({ item }) => {
    const author = item.author || {};
    const isMine =
      currentUser?.id && author.id && String(currentUser.id) === String(author.id);

    return (
      <View style={styles.postCard}>
        {/* Post Top Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity
            style={styles.authorRow}
            activeOpacity={0.8}
            onPress={() => handleOpenAuthorProfile(author)}
          >
            <Avatar size={44} name={author.name} uri={author.avatar} showBorder />
            <View style={styles.authorMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.authorName} numberOfLines={1}>
                  {author.name}
                </Text>
                {isMine && <Text style={styles.myBadge}>내 글</Text>}
              </View>
              <Text style={styles.subMeta}>
                {[author.region, formatTimeAgo(item.createdAt)].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <View style={styles.topicBadge}>
              <Text style={styles.topicBadgeText}>#{item.topicName}</Text>
            </View>
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => handlePostOptions(item)}
              hitSlop={8}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Post Content */}
        <Text style={styles.postContent}>{item.content}</Text>

        {/* Post Bottom Bar */}
        <View style={styles.postFooter}>
          {!isMine && (
            <TouchableOpacity
              style={styles.footerChatButton}
              onPress={() => handleStartChat(author)}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-outline" size={15} color={colors.primary} />
              <Text style={styles.footerChatText}>1:1 대화하기</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>커뮤니티</Text>
        <TouchableOpacity
          style={styles.writeButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={18} color={colors.textInverse} />
          <Text style={styles.writeButtonText}>글쓰기</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Topics Bar */}
      <View style={styles.topicFilterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, name: '전체' }, ...topics]}
          keyExtractor={(item) => String(item.id ?? 'all')}
          contentContainerStyle={styles.topicScroll}
          renderItem={({ item }) => {
            const isSelected = selectedTopicId === item.id;
            return (
              <TouchableOpacity
                style={[styles.topicChip, isSelected && styles.topicChipActive]}
                onPress={() => handleSelectTopic(item.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.topicChipText, isSelected && styles.topicChipTextActive]}
                >
                  {item.name}
                  {typeof item.postsCount === 'number' && item.postsCount > 0 ? (
                    ` (${item.postsCount})`
                  ) : null}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Post List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPostItem}
          contentContainerStyle={
            posts.length > 0 ? styles.feedList : styles.emptyFeedList
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>게시글이 없습니다.</Text>
              <Text style={styles.emptySubtitle}>
                첫 번째 이야기를 나누고 다양한 이웃들과 교류해보세요!
              </Text>
              <TouchableOpacity
                style={styles.emptyWriteButton}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="pencil" size={16} color={colors.textInverse} />
                <Text style={styles.emptyWriteButtonText}>첫 글 작성하기</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Create Post Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={8}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>새 글 작성</Text>
              <TouchableOpacity
                onPress={handleCreatePost}
                disabled={submitting || !newPostContent.trim()}
                style={[
                  styles.modalSubmitButton,
                  (!newPostContent.trim() || submitting) && styles.modalSubmitButtonDisabled,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Text style={styles.modalSubmitText}>등록</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Topic selector for new post */}
            <View style={styles.modalTopicSection}>
              <Text style={styles.modalTopicLabel}>토픽 선택</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={topics}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item }) => {
                  const isSelected = newPostTopicId === item.id;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.modalTopicChip,
                        isSelected && styles.modalTopicChipActive,
                      ]}
                      onPress={() => setNewPostTopicId(item.id)}
                    >
                      <Text
                        style={[
                          styles.modalTopicChipText,
                          isSelected && styles.modalTopicChipTextActive,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>

            {/* Text Input */}
            <View style={styles.modalInputWrapper}>
              <TextInput
                style={styles.modalTextInput}
                placeholder="따뜻하고 매너 있는 이야기를 나눠보세요. (최대 1,000자)"
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={1000}
                value={newPostContent}
                onChangeText={setNewPostContent}
                textAlignVertical="top"
                autoFocus
              />
              <Text style={styles.charCounter}>
                {newPostContent.length} / 1000
              </Text>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
  headerIconButton: {
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
  writeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  writeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textInverse,
  },
  topicFilterBar: {
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topicScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  topicChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.pillBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topicChipActive: {
    backgroundColor: colors.pillActiveBg,
    borderColor: colors.pillActiveBorder,
  },
  topicChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  topicChipTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedList: {
    padding: 16,
    gap: 14,
  },
  emptyFeedList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  postCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  authorMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  myBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.pillActiveBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  subMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topicBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  topicBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  moreButton: {
    padding: 4,
  },
  postContent: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  postFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  footerChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: colors.pillActiveBg,
  },
  footerChatText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  emptyWriteButton: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyWriteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textInverse,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  modalCloseButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  modalCancelText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  modalSubmitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
  },
  modalSubmitButtonDisabled: {
    opacity: 0.5,
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textInverse,
  },
  modalTopicSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  modalTopicLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  modalTopicChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.pillBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTopicChipActive: {
    backgroundColor: colors.pillActiveBg,
    borderColor: colors.primary,
  },
  modalTopicChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalTopicChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  modalInputWrapper: {
    flex: 1,
    padding: 16,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  charCounter: {
    textAlign: 'right',
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 8,
  },
});
