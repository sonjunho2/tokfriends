// apps/mobile/src/screens/community/PostDetailScreen.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Share,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import Avatar from '../../components/Avatar';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { checkAndConfirmActionPoint } from '../../utils/pointPolicyHelper';

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

export default function PostDetailScreen({ navigation, route }) {
  const { user: currentUser } = useAuth();
  const inputRef = useRef(null);

  const initialPost = route?.params?.post || null;
  const postId = route?.params?.postId || initialPost?.id;

  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(!initialPost);
  const [refreshing, setRefreshing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likeProcessing, setLikeProcessing] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState(null);

  const EMOJI_LIST = ['❤️', '👍', '😊', '👏', '✨', '🔥', '☕'];

  const handleAddEmoji = (emoji) => {
    setCommentText((prev) => `${prev}${emoji}`);
    inputRef.current?.focus();
  };

  // Load post details & comments
  const loadData = useCallback(async () => {
    if (!postId) return;
    try {
      const [postRes, commentsRes] = await Promise.allSettled([
        apiClient.getPost(postId),
        apiClient.getPostComments(postId),
      ]);

      if (postRes.status === 'fulfilled' && postRes.value) {
        setPost(postRes.value);
      }
      if (commentsRes.status === 'fulfilled') {
        const cList = Array.isArray(commentsRes.value) ? commentsRes.value : [];
        setComments(cList);
      }
    } catch (e) {
      console.warn('Failed to load post details', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Like Toggle
  const handleToggleLike = async () => {
    if (!post?.id || likeProcessing) return;
    setLikeProcessing(true);

    const currentLiked = Boolean(post.isLiked);
    const currentCount = post.likesCount || 0;
    const nextLiked = !currentLiked;
    const nextCount = Math.max(0, currentCount + (nextLiked ? 1 : -1));

    // Optimistic UI
    setPost((prev) => ({
      ...prev,
      isLiked: nextLiked,
      likesCount: nextCount,
    }));

    try {
      const res = await apiClient.togglePostLike(post.id);
      if (res && typeof res.isLiked === 'boolean') {
        setPost((prev) => ({
          ...prev,
          isLiked: res.isLiked,
          likesCount: typeof res.likesCount === 'number' ? res.likesCount : nextCount,
        }));
      }
    } catch (e) {
      // Rollback
      setPost((prev) => ({
        ...prev,
        isLiked: currentLiked,
        likesCount: currentCount,
      }));
    } finally {
      setLikeProcessing(false);
    }
  };

  // Submit Comment
  const handleCreateComment = async () => {
    const trimmed = commentText.trim();
    if (!post?.id || !trimmed || submittingComment) return;

    setSubmittingComment(true);
    try {
      const created = await apiClient.createPostComment(post.id, {
        content: trimmed,
      });

      setComments((prev) => [...prev, created]);
      setCommentText('');
      setPost((prev) => ({
        ...prev,
        commentsCount: (prev?.commentsCount || 0) + 1,
      }));
    } catch (e) {
      Alert.alert('댓글 등록 실패', e?.message || '댓글을 등록하지 못했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = (commentId) => {
    if (!post?.id || !commentId) return;
    Alert.alert('댓글 삭제', '이 댓글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.deletePostComment(post.id, commentId);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
            setPost((prev) => ({
              ...prev,
              commentsCount: Math.max(0, (prev?.commentsCount || 1) - 1),
            }));
          } catch (e) {
            Alert.alert('삭제 실패', e?.message || '댓글 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  // 1:1 Chat with Post Author
  const handleStartChat = async (author) => {
    if (!author?.id) return;
    checkAndConfirmActionPoint({
      actionType: 'chatRoomCreate',
      actionName: '1:1 채팅방 개설',
      navigation,
      onConfirm: async () => {
        try {
          const room = await apiClient.ensureDirectRoom(author.id);
          navigation.navigate('ChatRoom', {
            chatId: room?.id || `room-${author.id}`,
            room: {
              id: room?.id || `room-${author.id}`,
              counterpart: {
                id: author.id,
                targetAccountId: author.targetAccountId,
                name: author.name,
                avatar: author.avatar,
                headline: author.headline,
              },
            },
          });
        } catch (e) {
          Alert.alert('대화 시작 실패', e?.message || '대화방을 연결할 수 없습니다.');
        }
      },
    });
  };

  // Open Author Profile
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

  // Delete Post
  const handleDeletePost = () => {
    Alert.alert('게시글 삭제', '이 게시글을 정말로 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.deletePost(post.id);
            Alert.alert('완료', '게시글이 삭제되었습니다.', [
              { text: '확인', onPress: () => navigation.goBack() },
            ]);
          } catch (e) {
            Alert.alert('삭제 실패', e?.message || '게시글 삭제 중 오류가 발생했습니다.');
          }
        },
      },
    ]);
  };

  // Report Post
  const handleReportPost = () => {
    Alert.prompt
      ? Alert.prompt('게시글 신고', '신고 사유를 작성해주세요 (광고, 음란물, 욕설 등):', [
          { text: '취소', style: 'cancel' },
          {
            text: '신고',
            onPress: async (reason) => {
              if (!reason?.trim()) return;
              try {
                await apiClient.reportPost({
                  postId: post.id,
                  targetUserId: post.author?.id,
                  reason: reason.trim(),
                });
                Alert.alert('신고 접수', '신고가 정상 접수되었습니다. 검토 후 처리하겠습니다.');
              } catch (e) {
                Alert.alert('신고 실패', e?.message || '신고 처리 중 문제가 발생했습니다.');
              }
            },
          },
        ])
      : Alert.alert('게시글 신고', '운영정책에 위배되는 부적절한 게시글로 신고하시겠습니까?', [
          { text: '취소', style: 'cancel' },
          {
            text: '신고',
            onPress: async () => {
              try {
                await apiClient.reportPost({
                  postId: post.id,
                  targetUserId: post.author?.id,
                  reason: '부적절한 게시글 신고',
                });
                Alert.alert('신고 접수', '신고가 접수되었습니다. 검토 후 조치하겠습니다.');
              } catch (e) {
                Alert.alert('신고 실패', e?.message || '신고 처리 중 문제가 발생했습니다.');
              }
            },
          },
        ]);
  };

  // Block Author
  const handleBlockAuthor = () => {
    const author = post?.author;
    if (!author?.id) return;
    Alert.alert(
      '작성자 차단',
      `${author.name}님을 차단하시겠습니까?\n차단하면 해당 사용자의 글과 채팅이 숨겨집니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '차단',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.blockUser({ blockedUserId: author.id });
              Alert.alert('차단 완료', `${author.name}님을 차단했습니다.`, [
                { text: '확인', onPress: () => navigation.goBack() },
              ]);
            } catch (e) {
              Alert.alert('차단 실패', e?.message || '차단 처리에 실패했습니다.');
            }
          },
        },
      ],
    );
  };

  // Post Options Menu
  const handlePostOptions = () => {
    const author = post?.author;
    const isMine =
      currentUser?.id && author?.id && String(currentUser.id) === String(author.id);

    if (isMine) {
      Alert.alert('게시글 관리', '원하시는 작업을 선택해주세요.', [
        { text: '취소', style: 'cancel' },
        { text: '게시글 삭제', style: 'destructive', onPress: handleDeletePost },
      ]);
    } else {
      Alert.alert('게시글 옵션', '원하시는 작업을 선택해주세요.', [
        { text: '취소', style: 'cancel' },
        { text: '게시글 신고', onPress: handleReportPost },
        { text: '작성자 차단', style: 'destructive', onPress: handleBlockAuthor },
      ]);
    }
  };

  // Share Post
  const handleShare = async () => {
    try {
      await Share.share({
        message: `[다가온] ${post?.author?.name}님의 이야기:\n${post?.content || ''}`,
      });
    } catch {
      // silent
    }
  };

  const author = post?.author || {};
  const isMine =
    currentUser?.id && author.id && String(currentUser.id) === String(author.id);

  if (loading && !post) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>게시글을 불러오고 있습니다...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary || '#111827'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>동네생활 이야기</Text>
        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.headerIconButton} onPress={handleShare} hitSlop={8}>
            <Ionicons name="share-social-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={handlePostOptions}
            hitSlop={8}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Post Detail Card */}
          <View style={styles.postCard}>
            {/* Author Profile Header */}
            <View style={styles.authorHeader}>
              <TouchableOpacity
                style={styles.authorProfileRow}
                activeOpacity={0.8}
                onPress={() => handleOpenAuthorProfile(author)}
              >
                <Avatar size={48} name={author.name} uri={author.avatar} showBorder />
                <View style={styles.authorMeta}>
                  <View style={styles.authorNameRow}>
                    <Text style={styles.authorName} numberOfLines={1}>
                      {author.name || '익명 이웃'}
                    </Text>
                    {isMine && <Text style={styles.myBadge}>내 글</Text>}
                  </View>
                  <Text style={styles.authorSubMeta}>
                    {[author.region, formatTimeAgo(post?.createdAt)]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
              </TouchableOpacity>

              {post?.topicName && (
                <View style={styles.topicBadge}>
                  <Text style={styles.topicBadgeText}>#{post.topicName}</Text>
                </View>
              )}
            </View>

            {/* Post Main Content */}
            <Text style={styles.postBodyText}>{post?.content}</Text>

            {/* Post Media Images */}
            {Array.isArray(post?.mediaUrls) && post.mediaUrls.length > 0 && (
              <View style={styles.mediaContainer}>
                {post.mediaUrls.map((url, idx) => (
                  <TouchableOpacity
                    key={`detail-img-${idx}-${url}`}
                    activeOpacity={0.9}
                    onPress={() => setPreviewImageUri(url)}
                  >
                    <Image
                      source={{ uri: url }}
                      style={styles.postDetailImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Action Bar (Like, Comment Count, 1:1 Chat) */}
            <View style={styles.postActionBar}>
              <View style={styles.actionLeft}>
                <TouchableOpacity
                  style={[styles.actionBtn, post?.isLiked && styles.actionBtnLiked]}
                  onPress={handleToggleLike}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={post?.isLiked ? 'heart' : 'heart-outline'}
                    size={18}
                    color={post?.isLiked ? '#EF4444' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      post?.isLiked && styles.actionBtnTextLiked,
                    ]}
                  >
                    좋아요 {post?.likesCount > 0 ? post.likesCount : ''}
                  </Text>
                </TouchableOpacity>

                <View style={styles.actionBtnStatic}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.actionBtnText}>
                    댓글 {comments.length > 0 ? comments.length : ''}
                  </Text>
                </View>
              </View>

              {!isMine && (
                <TouchableOpacity
                  style={styles.chatAuthorBtn}
                  activeOpacity={0.85}
                  onPress={() => handleStartChat(author)}
                >
                  <Ionicons name="chatbubbles" size={14} color="#191919" />
                  <Text style={styles.chatAuthorBtnText}>작성자와 1:1 대화</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Comments Section Header */}
          <View style={styles.commentsSectionHeader}>
            <Text style={styles.commentsSectionTitle}>
              댓글 <Text style={styles.commentsCountText}>{comments.length}</Text>
            </Text>
          </View>

          {/* Comments List */}
          {comments.length === 0 ? (
            <View style={styles.emptyCommentsBox}>
              <Ionicons name="chatbubbles-outline" size={44} color="#D1D5DB" />
              <Text style={styles.emptyCommentsTitle}>아직 등록된 댓글이 없습니다.</Text>
              <Text style={styles.emptyCommentsSubtitle}>
                따뜻한 첫 댓글을 남겨 이웃과 이야기를 시작해보세요!
              </Text>
            </View>
          ) : (
            <View style={styles.commentsList}>
              {comments.map((item) => {
                const isCommentMine =
                  currentUser?.id &&
                  item.author?.id &&
                  String(currentUser.id) === String(item.author.id);

                return (
                  <View key={`comment-${item.id}`} style={styles.commentItem}>
                    <TouchableOpacity
                      onPress={() => handleOpenAuthorProfile(item.author)}
                      activeOpacity={0.8}
                    >
                      <Avatar
                        size={38}
                        name={item.author?.name}
                        uri={item.author?.avatar}
                        showBorder
                      />
                    </TouchableOpacity>

                    <View style={styles.commentContentWrapper}>
                      <View style={styles.commentHeaderRow}>
                        <TouchableOpacity
                          onPress={() => handleOpenAuthorProfile(item.author)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.commentAuthorName}>{item.author?.name}</Text>
                        </TouchableOpacity>
                        <Text style={styles.commentTimeAgo}>
                          {formatTimeAgo(item.createdAt)}
                        </Text>
                        {isCommentMine && (
                          <TouchableOpacity
                            onPress={() => handleDeleteComment(item.id)}
                            style={styles.commentDeleteBtn}
                            hitSlop={8}
                          >
                            <Text style={styles.commentDeleteText}>삭제</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={styles.commentBodyText}>{item.content}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Quick Emoji Reactions */}
        <View style={styles.quickEmojiBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickEmojiScroll}
          >
            <Text style={styles.quickEmojiLabel}>빠른 반응</Text>
            {EMOJI_LIST.map((emoji) => (
              <TouchableOpacity
                key={`emoji-${emoji}`}
                style={styles.emojiBtn}
                onPress={() => handleAddEmoji(emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiChar}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bottom Interactive Comment Input Bar */}
        <View style={styles.bottomInputBar}>
          <TextInput
            ref={inputRef}
            style={styles.commentInput}
            placeholder="따뜻한 댓글을 입력해 보세요..."
            placeholderTextColor="#9CA3AF"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.commentSendBtn,
              (!commentText.trim() || submittingComment) && styles.commentSendBtnDisabled,
            ]}
            onPress={handleCreateComment}
            disabled={!commentText.trim() || submittingComment}
            activeOpacity={0.85}
          >
            {submittingComment ? (
              <ActivityIndicator size="small" color="#191919" />
            ) : (
              <Ionicons name="arrow-up" size={20} color="#191919" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Fullscreen Image Preview Modal */}
      <Modal
        visible={Boolean(previewImageUri)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <View style={styles.fullscreenModalBackdrop}>
          <TouchableOpacity
            style={styles.fullscreenCloseBtn}
            onPress={() => setPreviewImageUri(null)}
            hitSlop={14}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          {previewImageUri && (
            <Image
              source={{ uri: previewImageUri }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary || '#191919',
    letterSpacing: -0.4,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#F3F4F6',
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  authorMeta: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary || '#191919',
  },
  myBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#854D0E',
    backgroundColor: '#FEF08A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  authorSubMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  topicBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topicBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  postBodyText: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 25,
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  mediaContainer: {
    marginTop: 16,
    gap: 12,
  },
  postDetailImage: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  postActionBar: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionBtnLiked: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  actionBtnStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  actionBtnTextLiked: {
    color: '#EF4444',
  },
  chatAuthorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary || '#FEE500',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  chatAuthorBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#191919',
  },
  commentsSectionHeader: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#191919',
  },
  commentsCountText: {
    color: colors.primary || '#D97706',
  },
  commentsList: {
    backgroundColor: '#FFFFFF',
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  commentContentWrapper: {
    flex: 1,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentAuthorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191919',
  },
  commentTimeAgo: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
    flex: 1,
  },
  commentDeleteBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  commentDeleteText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  commentBodyText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  emptyCommentsBox: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyCommentsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4B5563',
  },
  emptyCommentsSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  bottomInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 10,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: '#191919',
  },
  commentSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary || '#FEE500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSendBtnDisabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.7,
  },
  quickEmojiBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingVertical: 7,
  },
  quickEmojiScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 6,
  },
  quickEmojiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    marginRight: 4,
  },
  emojiBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  emojiChar: {
    fontSize: 16,
  },
  fullscreenModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
});
