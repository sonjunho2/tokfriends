// src/screens/community/CommunityFeedScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import * as ImagePicker from 'expo-image-picker';
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
  const [selectedImages, setSelectedImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  // Comments modal state
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

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

  const handlePickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진을 첨부하려면 사진 보관함 접근 권한이 필요합니다.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      });
      if (!result.canceled && Array.isArray(result.assets)) {
        setSelectedImages((prev) => [...prev, ...result.assets].slice(0, 5));
      }
    } catch (e) {
      console.warn('Pick image error', e);
      Alert.alert('오류', '사진을 불러오는 중 문제가 발생했습니다.');
    }
  };

  const handleRemoveSelectedImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    const text = newPostContent.trim();
    if (!text && selectedImages.length === 0) {
      Alert.alert('알림', '게시글 내용 또는 사진을 첨부해 주세요.');
      return;
    }
    setSubmitting(true);
    setUploadProgressText('게시글을 준비하고 있습니다...');
    try {
      const uploadedUrls = [];
      let currentIdx = 0;
      for (const asset of selectedImages) {
        currentIdx++;
        setUploadProgressText(`사진 업로드 중... (${currentIdx}/${selectedImages.length})`);
        const url = await apiClient.uploadPostMedia(asset);
        if (url) uploadedUrls.push(url);
      }

      setUploadProgressText('게시글 등록 중...');
      await apiClient.createPost({
        content: text || '사진을 공유했습니다.',
        topicId: newPostTopicId || undefined,
        mediaUrls: uploadedUrls,
      });
      setModalVisible(false);
      setNewPostContent('');
      setSelectedImages([]);
      setUploadProgressText('');
      Alert.alert('등록 완료', '게시글이 성공적으로 등록되었습니다.');
      onRefresh();
    } catch (e) {
      Alert.alert('등록 실패', e?.message || '게시글 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
      setUploadProgressText('');
    }
  };

  const handleToggleLike = async (post) => {
    if (!post?.id) return;
    const currentLiked = Boolean(post.isLiked);
    const currentCount = post.likesCount || 0;
    const nextLiked = !currentLiked;
    const nextCount = Math.max(0, currentCount + (nextLiked ? 1 : -1));

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, isLiked: nextLiked, likesCount: nextCount }
          : p,
      ),
    );

    try {
      const res = await apiClient.togglePostLike(post.id);
      if (res && typeof res.isLiked === 'boolean') {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  isLiked: res.isLiked,
                  likesCount: typeof res.likesCount === 'number' ? res.likesCount : nextCount,
                }
              : p,
          ),
        );
      }
    } catch (e) {
      // Rollback on failure
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, isLiked: currentLiked, likesCount: currentCount }
            : p,
        ),
      );
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

  const handleOpenComments = useCallback(async (post) => {
    setActivePost(post);
    setCommentsModalVisible(true);
    setLoadingComments(true);
    try {
      const data = await apiClient.getPostComments(post.id);
      setComments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Failed to load comments', e);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  const handleCreateComment = useCallback(async () => {
    if (!activePost?.id || !newCommentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const created = await apiClient.createPostComment(activePost.id, {
        content: newCommentText.trim(),
      });
      setComments((prev) => [...prev, created]);
      setNewCommentText('');
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === activePost.id
            ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
            : p,
        ),
      );
    } catch (e) {
      Alert.alert('댓글 작성 실패', e?.message || '댓글을 작성하지 못했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  }, [activePost, newCommentText, submittingComment]);

  const handleDeleteComment = useCallback(async (commentId) => {
    if (!activePost?.id || !commentId) return;
    Alert.alert('댓글 삭제', '댓글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.deletePostComment(activePost.id, commentId);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
            setPosts((prevPosts) =>
              prevPosts.map((p) =>
                p.id === activePost.id
                  ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 1) - 1) }
                  : p,
              ),
            );
          } catch (e) {
            Alert.alert('삭제 실패', e?.message || '댓글 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  }, [activePost]);

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

        {/* Post Content & Media - Tap to open PostDetail */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('PostDetail', { post: item, postId: item.id })}
        >
          {Boolean(item.content) && <Text style={styles.postContent}>{item.content}</Text>}

          {/* Post Media Attachment */}
          {Array.isArray(item.mediaUrls) && item.mediaUrls.length > 0 && (
            <View style={styles.postMediaContainer}>
              {item.mediaUrls.length === 1 ? (
                <Image
                  source={{ uri: item.mediaUrls[0] }}
                  style={styles.singlePostImage}
                  resizeMode="cover"
                />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.postMediaScroll}
                >
                  {item.mediaUrls.map((url, idx) => (
                    <Image
                      key={`feed-img-${idx}-${url}`}
                      source={{ uri: url }}
                      style={styles.multiPostImage}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Post Bottom Bar */}
        <View style={styles.postFooter}>
          <View style={styles.footerActionsLeft}>
            <TouchableOpacity
              style={styles.footerActionButton}
              onPress={() => handleToggleLike(item)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={item.isLiked ? 'heart' : 'heart-outline'}
                size={16}
                color={item.isLiked ? '#EF4444' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.footerActionText,
                  item.isLiked && styles.footerActionTextLiked,
                ]}
              >
                좋아요 {item.likesCount > 0 ? item.likesCount : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerActionButton}
              onPress={() => handleOpenComments(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.footerActionText}>
                댓글 {item.commentsCount > 0 ? item.commentsCount : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {!isMine && (
            <TouchableOpacity
              style={styles.footerChatButton}
              onPress={() => handleStartChat(author)}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
              <Text style={styles.footerChatText}>1:1 대화</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const canGoBack = (navigation.getState()?.index ?? 0) > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {canGoBack && (
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.goBack()}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary || '#111827'} />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>커뮤니티</Text>
        </View>
        <TouchableOpacity
          style={styles.writeButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={17} color={colors.textInverse || '#FFFFFF'} />
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
                onPress={() => {
                  setModalVisible(false);
                  setSelectedImages([]);
                }}
                hitSlop={8}
                style={styles.modalCloseButton}
                disabled={submitting}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>새 글 작성</Text>
              <TouchableOpacity
                onPress={handleCreatePost}
                disabled={submitting || (!newPostContent.trim() && selectedImages.length === 0)}
                style={[
                  styles.modalSubmitButton,
                  ((!newPostContent.trim() && selectedImages.length === 0) || submitting) &&
                    styles.modalSubmitButtonDisabled,
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

            {/* Selected Images Preview Strip */}
            {selectedImages.length > 0 && (
              <View style={styles.modalImageStrip}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
                >
                  {selectedImages.map((asset, idx) => (
                    <View key={`selected-img-${idx}`} style={styles.modalImageThumbWrapper}>
                      <Image source={{ uri: asset.uri }} style={styles.modalImageThumb} />
                      {idx === 0 && (
                        <View style={styles.modalCoverBadge}>
                          <Text style={styles.modalCoverBadgeText}>대표</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.modalImageRemoveBtn}
                        onPress={() => handleRemoveSelectedImage(idx)}
                        hitSlop={6}
                      >
                        <Ionicons name="close" size={13} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Bottom Toolbar: Add Photos */}
            <View style={styles.modalBottomBar}>
              <TouchableOpacity
                style={styles.modalAddPhotoBtn}
                onPress={handlePickImages}
                disabled={submitting || selectedImages.length >= 5}
                activeOpacity={0.8}
              >
                <Ionicons name="camera-outline" size={20} color={colors.primary} />
                <Text style={styles.modalAddPhotoText}>
                  사진 첨부 ({selectedImages.length}/5)
                </Text>
              </TouchableOpacity>
              {submitting && (
                <Text style={styles.modalUploadingHint}>
                  {uploadProgressText || '사진 업로드 및 등록 중...'}
                </Text>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={commentsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCommentsModalVisible(false)}
      >
        <SafeAreaView style={styles.commentsModalContainer}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Modal Header */}
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsHeaderTitle}>
                댓글 {comments.length > 0 ? `(${comments.length})` : ''}
              </Text>
              <TouchableOpacity
                style={styles.commentsCloseBtn}
                onPress={() => setCommentsModalVisible(false)}
                hitSlop={8}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Post Summary Preview */}
            {activePost ? (
              <View style={styles.commentsPostPreview}>
                <Text style={styles.commentsPostAuthor}>
                  {activePost.author?.name}님의 글
                </Text>
                <Text style={styles.commentsPostSnippet} numberOfLines={2}>
                  {activePost.content}
                </Text>
              </View>
            ) : null}

            {/* Comments List */}
            {loadingComments ? (
              <View style={styles.commentsLoadingBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.commentsLoadingText}>댓글을 불러오고 있습니다...</Text>
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.commentsListContent}
                ListEmptyComponent={
                  <View style={styles.commentsEmptyBox}>
                    <Ionicons name="chatbubbles-outline" size={36} color={colors.textTertiary} />
                    <Text style={styles.commentsEmptyText}>첫 댓글의 주인공이 되어보세요!</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isCommentMine =
                    currentUser?.id &&
                    item.author?.id &&
                    String(currentUser.id) === String(item.author.id);
                  return (
                    <View style={styles.commentItem}>
                      <Avatar size={34} name={item.author?.name} uri={item.author?.avatar} />
                      <View style={styles.commentBody}>
                        <View style={styles.commentAuthorRow}>
                          <Text style={styles.commentAuthorName}>{item.author?.name}</Text>
                          <Text style={styles.commentTime}>{formatTimeAgo(item.createdAt)}</Text>
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
                        <Text style={styles.commentContent}>{item.content}</Text>
                      </View>
                    </View>
                  );
                }}
              />
            )}

            {/* Comment Input Row */}
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentTextInput}
                placeholder="따뜻한 댓글을 남겨보세요..."
                placeholderTextColor={colors.textTertiary}
                value={newCommentText}
                onChangeText={setNewCommentText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.commentSubmitBtn,
                  (!newCommentText.trim() || submittingComment) && styles.commentSubmitBtnDisabled,
                ]}
                onPress={handleCreateComment}
                disabled={!newCommentText.trim() || submittingComment}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="arrow-up" size={18} color="#fff" />
                )}
              </TouchableOpacity>
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
    borderBottomColor: colors.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
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
  postMediaContainer: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  singlePostImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  postMediaScroll: {
    gap: 8,
  },
  multiPostImage: {
    width: 180,
    height: 180,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  postFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  footerActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  footerActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  footerActionTextLiked: {
    color: '#EF4444',
    fontWeight: '700',
  },
  footerCommentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  footerCommentText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
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
  modalImageStrip: {
    paddingVertical: 10,
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalImageThumbWrapper: {
    position: 'relative',
    width: 68,
    height: 68,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalImageThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  modalImageRemoveBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCoverBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#FEE500',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  modalCoverBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#191919',
  },
  modalBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  modalAddPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: colors.pillActiveBg,
  },
  modalAddPhotoText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  modalUploadingHint: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  // Comments modal styles
  commentsModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  commentsHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  commentsHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  commentsCloseBtn: {
    padding: 6,
  },
  commentsPostPreview: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.pillBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  commentsPostAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  commentsPostSnippet: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  commentsLoadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  commentsLoadingText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  commentsListContent: {
    padding: 16,
    gap: 16,
  },
  commentsEmptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  commentsEmptyText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  commentBody: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  commentAuthorName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  commentTime: {
    fontSize: 11,
    color: colors.textTertiary,
    flex: 1,
  },
  commentDeleteBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  commentDeleteText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    gap: 8,
  },
  commentTextInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.pillBg,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
  },
  commentSubmitBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSubmitBtnDisabled: {
    opacity: 0.4,
  },
});
