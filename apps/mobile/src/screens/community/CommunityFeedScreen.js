// apps/mobile/src/screens/community/CommunityFeedScreen.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  RefreshControl,
  StatusBar,
  Alert,
  TextInput,
  Modal,
  Platform,
  Animated,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import { tokens } from '../../theme/tokens';
import {
  UserAvatar,
  GlobalBottomSheet,
  EmptyStateView,
} from '../../components/common';
import ReportModal from '../../components/ReportModal';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { checkAndConfirmActionPoint } from '../../utils/pointPolicyHelper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 1열 카테고리 캡슐 필터 목록
const CAPSULE_CATEGORIES = [
  '전체',
  '🔥 동네인기',
  '☕ 일상·소통',
  '🏃 취미·운동',
  '🐶 반려견',
  '🍽️ 동네맛집',
  '❓ 질문·고민',
];

// 실시간 동네 인기 토픽 키워드
const TRENDING_KEYWORDS = [
  '#양재천산책',
  '#신상브런치카페',
  '#주말러닝크루',
  '#강아지수제간식',
  '#역삼역맛집',
  '#테니스초보',
];

// 시간 포맷 헬퍼
function formatTimeAgo(dateString) {
  if (!dateString) return '방금 전';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '방금 전';
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

// 감성적인 기본 피드 폴백 데이터 (고화질 사진 포함 5건)
const FALLBACK_POSTS = [
  {
    id: 'post-fb-1',
    category: '☕ 일상·소통',
    keyword: '#양재천산책',
    author: {
      id: 'author-1',
      name: '소희',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      region: '역삼1동',
      headline: '산책과 커피를 사랑하는 디자이너 ☕',
    },
    title: '오늘 저녁 양재천 산책길 노을이 유난히 예쁘네요 🌅',
    content: '선선한 바람 맞으며 걷다 보니 하루 피로가 싹 풀리네요. 강아지 산책 나온 이웃분들도 많아서 덩달아 힐링했습니다! 오늘 하루 다들 고생 많으셨어요 ✨',
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800',
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    likesCount: 34,
    commentsCount: 8,
    isLiked: false,
    isPopular: true,
  },
  {
    id: 'post-fb-2',
    category: '🍽️ 동네맛집',
    keyword: '#신상브런치카페',
    author: {
      id: 'author-2',
      name: '도현',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
      region: '반포동',
      headline: '퇴근 후 맛집 탐방 & 러닝 좋아해요 🏃',
    },
    title: '동네에 새로 생긴 프렌치 토스트 브런치 카페 다녀왔어요 🥞',
    content: '버터 향 가득하고 겉바속촉 제대로네요! 주말 오전에 가볍게 브런치 먹으면서 책 읽기 딱 좋은 분위기입니다. 혹시 주말에 같이 가실 동네 친구 계신가요?',
    images: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    likesCount: 42,
    commentsCount: 15,
    isLiked: true,
    isPopular: true,
  },
  {
    id: 'post-fb-3',
    category: '🏃 취미·운동',
    keyword: '#주말러닝크루',
    author: {
      id: 'author-3',
      name: '민우',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      region: '잠실동',
      headline: '한강 러닝 5km 페이스 메이커 👟',
    },
    title: '이번 주 토요일 오전 8시 한강 러닝 가볍게 하실 분! 🏃‍♂️',
    content: '잠실나루역에서 출발해서 잠실대교 왕복 5km 코스입니다. 6분 30초 페이스로 천천히 이야기 나누면서 달릴 예정이에요. 초보자분들도 부담 없이 오세요!',
    images: [
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800',
      'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800',
      'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800',
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    likesCount: 28,
    commentsCount: 12,
    isLiked: false,
    isPopular: false,
  },
  {
    id: 'post-fb-4',
    category: '🐶 반려견',
    keyword: '#강아지수제간식',
    author: {
      id: 'author-4',
      name: '유진',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
      region: '역삼동',
      headline: '3살 골든리트리버 집사입니다 🐶',
    },
    title: '우리 강아지 단호박 오리말이 수제간식 나눔해요 💛',
    content: '주말에 넉넉하게 만들었는데 양이 꽤 많네요! 근처 사시는 견주분들께 조금씩 소분해서 나눠드리고 싶어요. 댓글 남겨주시면 산책길에 전해드릴게요.',
    images: [
      'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=800',
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    likesCount: 56,
    commentsCount: 21,
    isLiked: false,
    isPopular: true,
  },
];

export default function CommunityFeedScreen({ navigation, route }) {
  const { user: currentUser } = useAuth();

  // 1. 카테고리 필터 및 검색 상태
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedTrendingKeyword, setSelectedTrendingKeyword] = useState('');

  // 2. 피드 데이터 상태
  const [posts, setPosts] = useState(FALLBACK_POSTS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 3. 글쓰기 모달 상태
  const [writeModalVisible, setWriteModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('☕ 일상·소통');
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // 4. 전역 바텀 시트 (GlobalBottomSheet)
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // 5. 신고 모달 상태
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportTargetPost, setReportTargetPost] = useState(null);

  // 데이터 로드
  const loadPosts = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    try {
      const res = await apiClient.getPosts({ take: 20 });
      const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      if (items.length > 0) {
        const mapped = items.map((p, idx) => {
          const fallback = FALLBACK_POSTS[idx % FALLBACK_POSTS.length];
          const author = p.author || {};
          const profile = author.profile || {};
          const imgs = Array.isArray(p.images) && p.images.length > 0
            ? p.images
            : p.imageUrl
            ? [p.imageUrl]
            : fallback.images;

          return {
            id: p.id || fallback.id,
            category: p.topic?.name ? `#${p.topic.name}` : fallback.category,
            keyword: fallback.keyword,
            author: {
              id: author.id || fallback.author.id,
              name: author.displayName || profile.nickname || fallback.author.name,
              avatar: author.avatarUrl || profile.avatarUri || fallback.author.avatar,
              region: author.region || fallback.author.region,
              headline: profile.headline || fallback.author.headline,
            },
            title: p.title || fallback.title,
            content: p.content || fallback.content,
            images: imgs,
            createdAt: p.createdAt || fallback.createdAt,
            likesCount: p.likesCount || p.likeCount || fallback.likesCount,
            commentsCount: p.commentsCount || p.commentCount || fallback.commentsCount,
            isLiked: Boolean(p.isLiked),
            isPopular: idx % 2 === 0,
          };
        });
        setPosts(mapped);
      }
    } catch {
      // 에러 발생 시 감성적인 기본 데이터 유지 (시스템 에러 노출 방지)
    } finally {
      if (refresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  // 카테고리 및 트렌딩 키워드 필터링
  const filteredPosts = useMemo(() => {
    let result = posts;

    // 트렌딩 키워드 필터링
    if (selectedTrendingKeyword) {
      result = result.filter(
        (p) =>
          p.keyword === selectedTrendingKeyword ||
          p.title?.includes(selectedTrendingKeyword.replace('#', '')) ||
          p.content?.includes(selectedTrendingKeyword.replace('#', ''))
      );
    }

    // 카테고리 필터링
    if (selectedCategory === '🔥 동네인기') {
      return result.filter((p) => p.isPopular || p.likesCount >= 30);
    }
    if (selectedCategory !== '전체') {
      const cleanCat = selectedCategory.replace(/[^가-힣a-zA-Z]/g, '');
      return result.filter(
        (p) =>
          p.category?.includes(cleanCat) ||
          p.title?.includes(cleanCat) ||
          p.content?.includes(cleanCat)
      );
    }
    return result;
  }, [posts, selectedCategory, selectedTrendingKeyword]);

  // 작성자 UserAvatar 터치 시 GlobalBottomSheet 열기
  const handleOpenAuthorSheet = async (author) => {
    if (!author) return;
    const initialProfile = {
      id: author.id,
      name: author.name,
      avatar: author.avatar,
      headline: author.headline || `${author.region}에 살고 있는 동네 이웃이에요 ✨`,
      region: author.region,
      photos: author.avatar ? [{ id: 'p1', url: author.avatar, isPrimary: true }] : [],
      pointsPerMinute: 1500,
    };
    setSelectedUser(initialProfile);
    setBottomSheetVisible(true);

    if (author.id) {
      try {
        const photos = await apiClient.getUserPhotos(author.id);
        if (Array.isArray(photos) && photos.length > 0) {
          setSelectedUser((prev) => (prev ? { ...prev, photos } : prev));
        }
      } catch {}
    }
  };

  // 좋아요 토글 & 스케일 애니메이션 처리
  const handleToggleLike = async (post) => {
    const nextIsLiked = !post.isLiked;
    const nextCount = post.likesCount + (nextIsLiked ? 1 : -1);

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, isLiked: nextIsLiked, likesCount: Math.max(0, nextCount) }
          : p
      )
    );

    try {
      await apiClient.toggleLikePost(post.id);
    } catch {}
  };

  // 공유하기 핸들러
  const handleShare = async (post) => {
    try {
      await Share.share({
        title: post.title,
        message: `[다가온 동네 커뮤니티]\n"${post.title}"\n${post.content?.slice(0, 80)}...`,
      });
    } catch {}
  };

  // 사진 선택 핸들러
  const handlePickImages = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!res.canceled && res.assets) {
        setSelectedPhotos((prev) => [...prev, ...res.assets.map((a) => a.uri)].slice(0, 5));
      }
    } catch {
      Alert.alert('안내', '사진을 선택할 수 없습니다.');
    }
  };

  // 새 글 등록
  const handleSubmitPost = async () => {
    const trimmedTitle = newTitle.trim();
    const trimmedContent = newContent.trim();
    if (!trimmedTitle || !trimmedContent) {
      Alert.alert('알림', '제목과 내용을 모두 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const userNickname = currentUser?.nickname || currentUser?.displayName || currentUser?.profile?.nickname || '나';
      const userAvatar = currentUser?.avatarUrl || currentUser?.avatarUri || currentUser?.profile?.avatarUri || null;
      const userRegion = [currentUser?.region1, currentUser?.region2].filter(Boolean).join(' ') || '역삼동';

      const created = await apiClient.createPost({
        title: trimmedTitle,
        content: trimmedContent,
        category: newCategory,
        images: selectedPhotos,
        mediaUrls: selectedPhotos,
        authorId: currentUser?.id,
        authorNickname: userNickname,
        authorAvatarUrl: userAvatar,
      });

      const newPostObj = {
        id: created?.id || `post-user-${Date.now()}`,
        category: newCategory,
        author: created?.author || {
          id: currentUser?.id || 'me',
          name: userNickname,
          displayName: userNickname,
          nickname: userNickname,
          avatar: userAvatar,
          region: userRegion,
          headline: currentUser?.profile?.headline || '동네 이웃',
        },
        title: trimmedTitle,
        content: trimmedContent,
        images: selectedPhotos,
        mediaUrls: selectedPhotos,
        createdAt: created?.createdAt || new Date().toISOString(),
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        isPopular: false,
      };

      setPosts((prev) => [newPostObj, ...prev]);
      setWriteModalVisible(false);
      setNewTitle('');
      setNewContent('');
      setSelectedPhotos([]);
      Alert.alert('등록 완료', '동네 이야기가 성공적으로 등록되었습니다! ✨');
      loadPosts();
    } catch (e) {
      Alert.alert('등록 실패', e?.message || '게시글 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 1:1 통화 및 대화 시작
  const handleStartCall = (user) => {
    Alert.alert(
      '1:1 다이렉트 통화 신청',
      `${user.name}님에게 통화를 연결하시겠습니까?\n(분당 1,500P가 소진됩니다)`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '통화 연결',
          onPress: () => {
            setBottomSheetVisible(false);
            Alert.alert('통화 연결 중', `${user.name}님의 응답을 기다리고 있습니다... 📞`);
          },
        },
      ]
    );
  };

  const handleStartChat = (user) => {
    if (!user?.id) return;
    setBottomSheetVisible(false);
    checkAndConfirmActionPoint({
      actionType: 'chatRoomCreate',
      actionName: '1:1 대화방 개설',
      navigation,
      onConfirm: async () => {
        try {
          const room = await apiClient.ensureDirectRoom({ targetUserId: user.id });
          const roomId = room?.id || room?._id;
          if (roomId) {
            navigation.navigate('Chat', {
              screen: 'ChatRoom',
              params: { id: roomId, room, user },
            });
          }
        } catch (e) {
          Alert.alert('안내', e?.message || '대화방을 생성할 수 없습니다.');
        }
      },
    });
  };

  // =========================================================================
  // 1. 상단 헤더 & 카테고리 1열 캡슐 필터 바
  // =========================================================================
  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      {/* 헤더 바 */}
      <View style={styles.topBar}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>동네 커뮤니티</Text>
          <View style={styles.locationPill}>
            <Ionicons name="location-sharp" size={12} color={tokens.colors.primary} />
            <Text style={styles.locationText}>
              {[currentUser?.region1, currentUser?.region2].filter(Boolean)[0] || '역삼동'}
            </Text>
          </View>
        </View>

        {/* [✍️ 글쓰기] 네온 핑크 캡슐 버튼 */}
        <TouchableOpacity
          style={styles.writeButton}
          activeOpacity={0.85}
          onPress={() => setWriteModalVisible(true)}
        >
          <LinearGradient
            colors={tokens.colors.gradients.primaryPurple}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.writeButtonGradient}
          >
            <Ionicons name="create-outline" size={15} color="#FFFFFF" />
            <Text style={styles.writeButtonText}>글쓰기</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* 가로 스크롤 1열 캡슐 필터 바 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContent}
        style={styles.categoryScrollBar}
      >
        {CAPSULE_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryCapsule,
                isSelected ? styles.categoryCapsuleActive : styles.categoryCapsuleInactive,
              ]}
              activeOpacity={0.85}
              onPress={() => {
                setSelectedCategory(cat);
                setSelectedTrendingKeyword('');
              }}
            >
              <Text
                style={[
                  styles.categoryText,
                  isSelected ? styles.categoryTextActive : styles.categoryTextInactive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // =========================================================================
  // 2. 실시간 동네 인기 토픽 랭킹 바 (Trending Topic Bar)
  // =========================================================================
  const renderTrendingTopicBar = () => (
    <View style={styles.trendingContainer}>
      <View style={styles.trendingHeaderRow}>
        <Ionicons name="flash" size={14} color={tokens.colors.primary} />
        <Text style={styles.trendingTitle}>실시간 인기 토픽</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trendingScrollContent}
      >
        {TRENDING_KEYWORDS.map((kw) => {
          const isSelected = selectedTrendingKeyword === kw;
          return (
            <TouchableOpacity
              key={kw}
              style={[
                styles.trendingChip,
                isSelected && styles.trendingChipActive,
              ]}
              activeOpacity={0.8}
              onPress={() => {
                setSelectedTrendingKeyword(isSelected ? '' : kw);
                setSelectedCategory('전체');
              }}
            >
              <Text
                style={[
                  styles.trendingChipText,
                  isSelected && styles.trendingChipTextActive,
                ]}
              >
                {kw}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // =========================================================================
  // 3. 감성 소셜 피드 카드 (Instagram/Karrot Style Feed Card)
  // =========================================================================
  const renderFeedCard = ({ item }) => {
    const hasMultipleImages = Array.isArray(item.images) && item.images.length > 1;
    const hasSingleImage = Array.isArray(item.images) && item.images.length === 1;

    return (
      <View style={styles.feedCard}>
        {/* 작성자 헤더: UserAvatar(size='sm') + 닉네임 + 동네 인증 뱃지 + 작성 시간 */}
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.authorGroup}
            activeOpacity={0.85}
            onPress={() => handleOpenAuthorSheet(item.author)}
          >
            <UserAvatar
              uri={item.author?.avatar}
              name={item.author?.name}
              size={40}
              isOnline
            />
            <View style={styles.authorMeta}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>{item.author?.name}</Text>
                <View style={styles.verifiedRegionBadge}>
                  <Ionicons name="location-sharp" size={10} color={tokens.colors.primary} />
                  <Text style={styles.verifiedRegionText}>
                    {item.author?.region || '동네인증'}
                  </Text>
                </View>
              </View>
              <Text style={styles.postTimeText}>{formatTimeAgo(item.createdAt)}</Text>
            </View>
          </TouchableOpacity>

          {/* 더보기 (신고/차단) */}
          <TouchableOpacity
            style={styles.menuButton}
            hitSlop={8}
            onPress={() => {
              setReportTargetPost(item);
              setReportModalVisible(true);
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={tokens.colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* 카테고리 태그 */}
        <View style={styles.cardCategoryBadge}>
          <Text style={styles.cardCategoryText}>{item.category}</Text>
        </View>

        {/* 본문 제목 & 내용 */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('PostDetail', { post: item, postId: item.id })}
        >
          <Text style={styles.postTitle}>{item.title}</Text>
          <Text style={styles.postContent} numberOfLines={3}>
            {item.content}
          </Text>
        </TouchableOpacity>

        {/* 이미지 레이아웃: 1장이면 16:9 와이드, 2장 이상이면 2열 그리드/캐러셀 */}
        {hasSingleImage && (
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => navigation.navigate('PostDetail', { post: item, postId: item.id })}
          >
            <Image source={{ uri: item.images[0] }} style={styles.singleImage} resizeMode="cover" />
          </TouchableOpacity>
        )}

        {hasMultipleImages && (
          <View style={styles.multiImageContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.multiImageScroll}>
              {item.images.map((imgUri, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.92}
                  onPress={() => navigation.navigate('PostDetail', { post: item, postId: item.id })}
                >
                  <Image source={{ uri: imgUri }} style={styles.multiImageItem} resizeMode="cover" />
                  <View style={styles.imageIndexBadge}>
                    <Text style={styles.imageIndexText}>{idx + 1}/{item.images.length}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 하단 소셜 인터랙션 바: 좋아요, 댓글, 공유하기 */}
        <View style={styles.socialBar}>
          <View style={styles.socialLeftActions}>
            {/* 좋아요 버튼 (스케일 팝) */}
            <TouchableOpacity
              style={styles.socialActionBtn}
              activeOpacity={0.7}
              onPress={() => handleToggleLike(item)}
            >
              <Ionicons
                name={item.isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={item.isLiked ? tokens.colors.primary : tokens.colors.textSecondary}
              />
              <Text
                style={[
                  styles.socialActionText,
                  item.isLiked && { color: tokens.colors.primary, fontWeight: '800' },
                ]}
              >
                {item.likesCount}
              </Text>
            </TouchableOpacity>

            {/* 댓글 버튼 */}
            <TouchableOpacity
              style={styles.socialActionBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('PostDetail', { post: item, postId: item.id })}
            >
              <Ionicons name="chatbubble-outline" size={19} color={tokens.colors.textSecondary} />
              <Text style={styles.socialActionText}>{item.commentsCount}</Text>
            </TouchableOpacity>
          </View>

          {/* 공유하기 버튼 */}
          <TouchableOpacity
            style={styles.shareBtn}
            hitSlop={8}
            activeOpacity={0.7}
            onPress={() => handleShare(item)}
          >
            <Ionicons name="share-social-outline" size={18} color={tokens.colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. 상단 헤더 & 카테고리 1열 캡슐 필터 바 */}
      {renderHeader()}

      {/* 2. 실시간 동네 인기 토픽 랭킹 바 */}
      {renderTrendingTopicBar()}

      {/* 3. 소셜 피드 리스트 */}
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderFeedCard}
        contentContainerStyle={styles.feedScrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPosts({ refresh: true })}
            colors={[tokens.colors.primary]}
            tintColor={tokens.colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyStateView
            preset="feed"
            title="우리 동네의 첫 번째 이야기 주인공이 되어보세요! ✨"
            description="이웃들과 나누고 싶은 소소한 일상이나 궁금한 점을 남겨보세요."
            ctaLabel="✍️ 첫 동네 이야기 쓰기"
            onCtaPress={() => setWriteModalVisible(true)}
            style={{ marginTop: 40 }}
          />
        }
      />

      {/* 작성자 터치 시 무전환 GlobalBottomSheet */}
      <GlobalBottomSheet
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        user={selectedUser}
        onCallVoice={handleStartCall}
        onCallVideo={handleStartCall}
        onStartChat={handleStartChat}
      />

      {/* 새 글 작성 모달 */}
      <Modal
        visible={writeModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setWriteModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setWriteModalVisible(false)} hitSlop={8}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>동네 이야기 쓰기</Text>
            <TouchableOpacity
              onPress={handleSubmitPost}
              disabled={submitting}
              style={[styles.modalSubmitBtn, submitting && { opacity: 0.6 }]}
            >
              <Text style={styles.modalSubmitText}>등록</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* 카테고리 선택 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modalCategoryRow}>
              {CAPSULE_CATEGORIES.filter((c) => c !== '전체' && c !== '🔥 동네인기').map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.modalCatChip,
                    newCategory === c && styles.modalCatChipActive,
                  ]}
                  onPress={() => setNewCategory(c)}
                >
                  <Text style={[styles.modalCatText, newCategory === c && styles.modalCatTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.modalTitleInput}
              placeholder="제목을 입력하세요"
              placeholderTextColor={tokens.colors.textTertiary}
              value={newTitle}
              onChangeText={setNewTitle}
              maxLength={60}
            />

            <TextInput
              style={styles.modalContentInput}
              placeholder="우리 동네 이웃들과 나눌 소소한 일상을 적어보세요 ✨"
              placeholderTextColor={tokens.colors.textTertiary}
              value={newContent}
              onChangeText={setNewContent}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />

            {/* 사진 첨부 목록 */}
            {selectedPhotos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachPhotoRow}>
                {selectedPhotos.map((uri, idx) => (
                  <View key={idx} style={styles.attachThumbWrap}>
                    <Image source={{ uri }} style={styles.attachThumb} />
                    <TouchableOpacity
                      style={styles.attachRemoveBtn}
                      onPress={() => setSelectedPhotos((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Ionicons name="close" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.addPhotoBar} onPress={handlePickImages} activeOpacity={0.8}>
              <Ionicons name="image-outline" size={20} color={tokens.colors.primary} />
              <Text style={styles.addPhotoBarText}>사진 첨부하기 ({selectedPhotos.length}/5)</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 신고 모달 */}
      <ReportModal
        visible={reportModalVisible}
        targetName={reportTargetPost?.title || '게시글'}
        targetType="post"
        onClose={() => setReportModalVisible(false)}
        onSubmit={async ({ category, details }) => {
          try {
            await apiClient.reportPost({
              targetPostId: reportTargetPost?.id,
              reason: `[커뮤니티] ${category}: ${details}`,
            });
            Alert.alert('신고 접수', '신고가 정상 접수되었습니다. 신속히 조치하겠습니다.');
            setReportModalVisible(false);
          } catch {
            Alert.alert('신고 실패', '신고 접수 중 오류가 발생했습니다.');
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },

  // 1. 상단 헤더 & 카테고리 필터 바
  headerWrapper: {
    backgroundColor: tokens.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: tokens.colors.text,
    letterSpacing: -0.5,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: tokens.radius.full,
    gap: 3,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  writeButton: {
    borderRadius: tokens.radius.full,
    overflow: 'hidden',
    ...tokens.shadows.soft,
  },
  writeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 4,
  },
  writeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  categoryScrollBar: {
    paddingVertical: 8,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryCapsule: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: tokens.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCapsuleActive: {
    backgroundColor: tokens.colors.primary,
    ...tokens.shadows.soft,
  },
  categoryCapsuleInactive: {
    backgroundColor: tokens.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  categoryText: {
    fontSize: 13,
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  categoryTextInactive: {
    color: tokens.colors.textSecondary,
    fontWeight: '600',
  },

  // 2. 실시간 인기 토픽 티커
  trendingContainer: {
    backgroundColor: tokens.colors.surface,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trendingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: tokens.colors.primary,
  },
  trendingScrollContent: {
    gap: 6,
  },
  trendingChip: {
    backgroundColor: tokens.colors.surfaceSecondary,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: tokens.radius.full,
    borderWidth: 1,
    borderColor: tokens.colors.borderLight,
  },
  trendingChipActive: {
    backgroundColor: tokens.colors.primaryLight,
    borderColor: tokens.colors.primary,
  },
  trendingChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  trendingChipTextActive: {
    color: tokens.colors.primary,
    fontWeight: '800',
  },

  // 3. 소셜 피드 카드
  feedScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
  },
  feedCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.card,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: tokens.colors.borderLight,
    ...tokens.shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorMeta: {
    gap: 2,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    ...tokens.typography.h3,
    fontSize: 14,
  },
  verifiedRegionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: tokens.radius.xs,
    gap: 2,
  },
  verifiedRegionText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  postTimeText: {
    ...tokens.typography.caption,
    color: tokens.colors.textTertiary,
  },
  menuButton: {
    padding: 4,
  },
  cardCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.colors.surfaceSecondary,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
    marginBottom: 6,
  },
  cardCategoryText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: tokens.colors.textSecondary,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: tokens.colors.text,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 22,
    color: tokens.colors.textSecondary,
    marginBottom: 12,
  },
  singleImage: {
    width: '100%',
    height: 200,
    borderRadius: tokens.radius.md,
    marginBottom: 12,
  },
  multiImageContainer: {
    marginBottom: 12,
  },
  multiImageScroll: {
    gap: 8,
  },
  multiImageItem: {
    width: SCREEN_WIDTH * 0.65,
    height: 180,
    borderRadius: tokens.radius.md,
  },
  imageIndexBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: tokens.radius.full,
  },
  imageIndexText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  socialBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: tokens.colors.borderLight,
    paddingTop: 12,
  },
  socialLeftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  socialActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  socialActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  shareBtn: {
    padding: 4,
  },

  // 4. 모달 스타일
  modalSafeContainer: {
    flex: 1,
    backgroundColor: tokens.colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
  },
  modalCancelText: {
    fontSize: 15,
    color: tokens.colors.textSecondary,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: tokens.colors.text,
  },
  modalSubmitBtn: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: tokens.radius.full,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  modalBody: {
    padding: 16,
  },
  modalCategoryRow: {
    gap: 8,
    marginBottom: 16,
  },
  modalCatChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.surfaceSecondary,
  },
  modalCatChipActive: {
    backgroundColor: tokens.colors.primary,
  },
  modalCatText: {
    fontSize: 12,
    color: tokens.colors.textSecondary,
    fontWeight: '600',
  },
  modalCatTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modalTitleInput: {
    fontSize: 17,
    fontWeight: '700',
    color: tokens.colors.text,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
    paddingVertical: 10,
    marginBottom: 14,
  },
  modalContentInput: {
    fontSize: 15,
    lineHeight: 22,
    color: tokens.colors.text,
    minHeight: 180,
    marginBottom: 16,
  },
  attachPhotoRow: {
    gap: 10,
    marginBottom: 16,
  },
  attachThumbWrap: {
    width: 80,
    height: 80,
    borderRadius: tokens.radius.md,
    overflow: 'hidden',
  },
  attachThumb: {
    width: '100%',
    height: '100%',
  },
  attachRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.borderLight,
  },
  addPhotoBarText: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.primary,
  },
});
