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
  KeyboardAvoidingView,
  Keyboard,
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
  ExtendedFAB,
  useExtendedFabScroll,
} from '../../components/common';
import ReportModal from '../../components/ReportModal';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { checkAndConfirmActionPoint } from '../../utils/pointPolicyHelper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 기본 카테고리 목록 (서버 미응답 시 폴백)
const DEFAULT_CATEGORIES = [
  '전체',
  '🔥 동네인기',
  '☕ 일상·소통',
  '🏃 취미·운동',
  '🐶 반려견',
  '🍽️ 동네맛집',
  '❓ 질문·고민',
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

  // 당근마켓 스타일 가변 플로팅 액션 버튼(Extended FAB) 스크롤 리스너 (60fps 인터랙션)
  const { isExtended, handleScroll } = useExtendedFabScroll(15);

  // 1. 카테고리 필터 및 동적 카테고리 상태 (관리자 연동)
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  // 2. 피드 데이터 상태
  const [posts, setPosts] = useState(FALLBACK_POSTS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 3. 글쓰기 모달 상태
  const [writeModalVisible, setWriteModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('☕ 일상소통');
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // 4. 전역 바텀 시트 (GlobalBottomSheet)
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // 5. 신고 모달 상태
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportTargetPost, setReportTargetPost] = useState(null);

  // 카테고리 목록 로드 (서버/관리자 연동)
  const loadCategories = useCallback(async () => {
    try {
      const res = await apiClient.getCommunityCategories();
      const items = Array.isArray(res) ? res : res?.items;
      if (Array.isArray(items) && items.length > 0) {
        const list = ['전체'];
        items.forEach((c) => {
          const label = c.icon ? `${c.icon} ${c.name}` : c.name;
          if (c.name !== '전체' && !list.includes(label)) {
            list.push(label);
          }
        });
        setCategories(list);
        // 글쓰기 기본 카테고리 설정
        const firstWritable = list.find((c) => c !== '전체' && !c.includes('동네인기'));
        if (firstWritable) {
          setNewCategory((prev) => prev || firstWritable);
        }
      }
    } catch {
      // 실패 시 DEFAULT_CATEGORIES 유지
    }
  }, []);

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
    loadCategories();
    loadPosts();
  }, [loadCategories, loadPosts]);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      loadPosts();
    }, [loadCategories, loadPosts])
  );

  // 카테고리 필터링
  const filteredPosts = useMemo(() => {
    if (!selectedCategory || selectedCategory === '전체') {
      return posts;
    }
    if (selectedCategory.includes('동네인기') || selectedCategory.includes('인기')) {
      return posts.filter((p) => p.isPopular || p.likesCount >= 30);
    }
    const cleanCat = selectedCategory.replace(/[^가-힣a-zA-Z0-9]/g, '');
    return posts.filter((p) => {
      const pCat = (p.category || '').replace(/[^가-힣a-zA-Z0-9]/g, '');
      const pTitle = (p.title || '').replace(/[^가-힣a-zA-Z0-9]/g, '');
      const pContent = (p.content || '').replace(/[^가-힣a-zA-Z0-9]/g, '');
      return pCat.includes(cleanCat) || pTitle.includes(cleanCat) || pContent.includes(cleanCat);
    });
  }, [posts, selectedCategory]);

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
  // 1. 상단 헤더 & 카테고리 1열 캡슐 필터 바 (동적 카테고리 연동)
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
      </View>

      {/* 가로 스크롤 1열 캡슐 필터 바 (관리자/서버 동적 카테고리) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContent}
        style={styles.categoryScrollBar}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryCapsule,
                isSelected ? styles.categoryCapsuleActive : styles.categoryCapsuleInactive,
              ]}
              activeOpacity={0.85}
              onPress={() => setSelectedCategory(cat)}
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
  // 3. 감성 소셜 피드 카드 (Instagram/Karrot Style Feed Card)
  // =========================================================================
  const renderFeedCard = ({ item }) => {
    const imageList = Array.isArray(item.images) && item.images.length > 0
      ? item.images
      : (item.mediaUrls && Array.isArray(item.mediaUrls) && item.mediaUrls.length > 0)
        ? item.mediaUrls
        : (item.imageUrl ? [item.imageUrl] : []);
    const firstImageUri = imageList[0] || null;
    const hasMultipleImages = imageList.length > 1;

    return (
      <View style={styles.feedCard}>
        {/* 작성자 헤더: UserAvatar(size=38, 원형) + 닉네임 + 동네 인증 뱃지 + 작성 시간 */}
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.authorGroup}
            activeOpacity={0.85}
            onPress={() => handleOpenAuthorSheet(item.author)}
          >
            <UserAvatar
              uri={item.author?.avatar}
              name={item.author?.name}
              size={38}
              isOnline
            />
            <View style={styles.authorMeta}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>{item.author?.name || '익명 이웃'}</Text>
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

        {/* 당근(Karrot) 스타일: 좌측 글(카테고리/제목/본문 요약), 우측 정방형 썸네일(76x76) */}
        <TouchableOpacity
          style={styles.cardContentRow}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('PostDetail', { post: item, postId: item.id })}
        >
          <View style={styles.cardTextCol}>
            {item.category ? (
              <View style={styles.cardCategoryBadge}>
                <Text style={styles.cardCategoryText}>{item.category}</Text>
              </View>
            ) : null}
            <Text style={styles.postTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {item.content ? (
              <Text style={styles.postContent} numberOfLines={2}>
                {item.content}
              </Text>
            ) : null}
          </View>

          {/* 우측 썸네일 이미지 (사진이 있는 경우) */}
          {firstImageUri ? (
            <View style={styles.thumbnailContainer}>
              <Image source={{ uri: firstImageUri }} style={styles.cardThumbnail} resizeMode="cover" />
              {hasMultipleImages && (
                <View style={styles.multiImageCountBadge}>
                  <Ionicons name="images" size={10} color="#FFFFFF" />
                  <Text style={styles.multiImageCountText}>{imageList.length}</Text>
                </View>
              )}
            </View>
          ) : null}
        </TouchableOpacity>

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

      {/* 2. 소셜 피드 리스트 (스크롤 시 Extended FAB 축소 연동) */}
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderFeedCard}
        contentContainerStyle={styles.feedScrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              loadCategories();
              loadPosts({ refresh: true });
            }}
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

      {/* 당근마켓 스타일 가변 플로팅 액션 버튼 (Extended FAB) */}
      <ExtendedFAB
        label="+ 글쓰기"
        iconName="add"
        isExtended={isExtended}
        onPress={() => setWriteModalVisible(true)}
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

      {/* 세련된 새 글 작성 모달 (카테고리 선택 연동 & UX 개선) */}
      <Modal
        visible={writeModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setWriteModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeContainer}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* 상단 모달 헤더 */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setWriteModalVisible(false)} hitSlop={12} style={styles.modalHeaderSideBtn}>
                <Ionicons name="close" size={24} color={tokens.colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>동네 이야기 쓰기</Text>
              <TouchableOpacity
                onPress={handleSubmitPost}
                disabled={submitting || !newTitle.trim() || !newContent.trim()}
                style={[
                  styles.modalSubmitBtn,
                  (submitting || !newTitle.trim() || !newContent.trim()) && { opacity: 0.45 },
                ]}
              >
                <Text style={styles.modalSubmitText}>{submitting ? '등록 중...' : '완료'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* 카테고리(주제) 선택 섹션 */}
              <View style={styles.writeSection}>
                <View style={styles.writeSectionHeader}>
                  <Text style={styles.writeSectionLabel}>게시판 주제 선택</Text>
                  <Text style={styles.writeSectionSubLabel}>작성하실 글의 주제를 선택해주세요</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.modalCategoryRow}
                >
                  {categories
                    .filter((c) => c !== '전체' && !c.includes('동네인기') && !c.includes('인기'))
                    .map((c) => {
                      const isSelected = newCategory === c;
                      return (
                        <TouchableOpacity
                          key={c}
                          style={[
                            styles.modalCatChip,
                            isSelected && styles.modalCatChipActive,
                          ]}
                          activeOpacity={0.8}
                          onPress={() => setNewCategory(c)}
                        >
                          <Text
                            style={[
                              styles.modalCatText,
                              isSelected && styles.modalCatTextActive,
                            ]}
                          >
                            {c}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              </View>

              {/* 입력 본문 카드 */}
              <View style={styles.writeInputCard}>
                <TextInput
                  style={styles.modalTitleInput}
                  placeholder="제목을 입력하세요"
                  placeholderTextColor={tokens.colors.textTertiary}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  maxLength={60}
                />
                <View style={styles.writeInputDivider} />
                <TextInput
                  style={styles.modalContentInput}
                  placeholder="우리 동네 이웃들과 나눌 따뜻한 일상이나 유용한 정보를 자유롭게 나눠보세요 ✨"
                  placeholderTextColor={tokens.colors.textTertiary}
                  value={newContent}
                  onChangeText={setNewContent}
                  multiline
                  textAlignVertical="top"
                  maxLength={1000}
                />
                <View style={styles.writeCharCountRow}>
                  <Text style={styles.writeCharCountText}>{newContent.length} / 1000</Text>
                </View>
              </View>

              {/* 사진 첨부 섹션 */}
              <View style={styles.writePhotoSection}>
                <View style={styles.writeSectionHeader}>
                  <Text style={styles.writeSectionLabel}>사진 첨부</Text>
                  <Text style={styles.writeSectionSubLabel}>최대 5장까지 첨부할 수 있어요 ({selectedPhotos.length}/5)</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.attachPhotoRow}
                >
                  {selectedPhotos.length < 5 && (
                    <TouchableOpacity
                      style={styles.addPhotoSquareBtn}
                      onPress={handlePickImages}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="camera-outline" size={26} color={tokens.colors.primary} />
                      <Text style={styles.addPhotoSquareText}>{selectedPhotos.length}/5</Text>
                    </TouchableOpacity>
                  )}

                  {selectedPhotos.map((uri, idx) => (
                    <View key={idx} style={styles.attachThumbWrap}>
                      <Image source={{ uri }} style={styles.attachThumb} />
                      {idx === 0 && (
                        <View style={styles.attachMainBadge}>
                          <Text style={styles.attachMainBadgeText}>대표</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.attachRemoveBtn}
                        hitSlop={6}
                        onPress={() => setSelectedPhotos((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Ionicons name="close" size={13} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
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
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTextCol: {
    flex: 1,
    marginRight: 12,
  },
  postTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: tokens.colors.text,
    letterSpacing: -0.3,
    marginBottom: 5,
    lineHeight: 21,
  },
  postContent: {
    fontSize: 13.5,
    lineHeight: 20,
    color: tokens.colors.textSecondary,
  },
  thumbnailContainer: {
    position: 'relative',
    width: 76,
    height: 76,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: tokens.colors.surfaceSecondary,
  },
  cardThumbnail: {
    width: 76,
    height: 76,
    borderRadius: 10,
  },
  multiImageCountBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  multiImageCountText: {
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

  // 4. 모달 및 글쓰기 스타일
  modalSafeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
  },
  modalHeaderSideBtn: {
    padding: 4,
  },
  modalCancelText: {
    fontSize: 15,
    color: tokens.colors.textSecondary,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: tokens.colors.text,
  },
  modalSubmitBtn: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: tokens.radius.full,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalBody: {
    padding: 16,
  },
  writeSection: {
    marginBottom: 16,
  },
  writeSectionHeader: {
    marginBottom: 8,
  },
  writeSectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: tokens.colors.text,
    marginBottom: 2,
  },
  writeSectionSubLabel: {
    fontSize: 12,
    color: tokens.colors.textTertiary,
  },
  modalCategoryRow: {
    gap: 8,
    paddingVertical: 4,
  },
  modalCatChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: tokens.radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: tokens.colors.borderLight,
  },
  modalCatChipActive: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  modalCatText: {
    fontSize: 13,
    color: tokens.colors.textSecondary,
    fontWeight: '600',
  },
  modalCatTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  writeInputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: tokens.radius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: tokens.colors.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  modalTitleInput: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.text,
    paddingVertical: 6,
  },
  writeInputDivider: {
    height: 1,
    backgroundColor: tokens.colors.borderLight,
    marginVertical: 12,
  },
  modalContentInput: {
    fontSize: 15,
    lineHeight: 22,
    color: tokens.colors.text,
    minHeight: 160,
  },
  writeCharCountRow: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  writeCharCountText: {
    fontSize: 12,
    color: tokens.colors.textTertiary,
  },
  writePhotoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: tokens.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.colors.borderLight,
  },
  attachPhotoRow: {
    gap: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  addPhotoSquareBtn: {
    width: 80,
    height: 80,
    borderRadius: tokens.radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: tokens.colors.primary,
    backgroundColor: '#FDF2F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoSquareText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.primary,
    marginTop: 2,
  },
  attachThumbWrap: {
    width: 80,
    height: 80,
    borderRadius: tokens.radius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  attachThumb: {
    width: '100%',
    height: '100%',
  },
  attachMainBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(235, 78, 147, 0.85)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  attachMainBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  attachRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
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
