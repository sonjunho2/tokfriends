// apps/mobile/src/components/LiveParticipantProfileSheet.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import { apiClient } from '../api/client';
import Avatar from './Avatar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PHOTO_WIDTH = SCREEN_WIDTH - 32;
const PHOTO_HEIGHT = 280;
const ACCENT_COLOR = '#FF3B6B'; // Live accent pink/coral

export default function LiveParticipantProfileSheet({
  visible,
  onClose,
  participant,
  currentUser,
  onNavigateToShop,
  onOpenReport,
  onBlockUser,
}) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [fullUser, setFullUser] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [calling, setCalling] = useState(false);

  const flatListRef = useRef(null);

  const targetUserId = participant?.id || participant?.userId;
  const isSelf = currentUser?.id && targetUserId === currentUser?.id;

  const loadUserData = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);
    setActivePhotoIndex(0);

    try {
      const [userRes, photosRes] = await Promise.allSettled([
        apiClient.getUserById(targetUserId),
        apiClient.getUserPhotos(targetUserId),
      ]);

      let fetchedUser = null;
      if (userRes.status === 'fulfilled' && userRes.value) {
        fetchedUser = userRes.value;
        setFullUser(fetchedUser);
      }

      // Photos extraction
      let userPhotoList = [];
      if (photosRes.status === 'fulfilled' && Array.isArray(photosRes.value) && photosRes.value.length > 0) {
        userPhotoList = photosRes.value.map((p) => (typeof p === 'string' ? { url: p } : p));
      } else if (fetchedUser?.photos && Array.isArray(fetchedUser.photos) && fetchedUser.photos.length > 0) {
        userPhotoList = fetchedUser.photos;
      }

      // If no photo entries in UserPhoto, fallback to avatar
      const primaryAvatar =
        fetchedUser?.avatarUrl ||
        fetchedUser?.profile?.avatarUri ||
        participant?.avatar ||
        participant?.avatarUri ||
        participant?.avatarUrl;

      if (userPhotoList.length === 0 && primaryAvatar) {
        userPhotoList = [{ id: 'primary-avatar', url: primaryAvatar, isPrimary: true }];
      }

      setPhotos(userPhotoList);

      // Follow status
      const targetAccountId =
        fetchedUser?.targetAccountId ||
        participant?.targetAccountId ||
        participant?.activityAccountId;

      if (targetAccountId && !isSelf) {
        try {
          const status = await apiClient.getFollowStatus(targetAccountId);
          setIsFollowing(Boolean(status?.following));
        } catch {
          setIsFollowing(false);
        }
      }
    } catch (e) {
      console.warn('Failed to load participant profile:', e);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, participant, isSelf]);

  useEffect(() => {
    if (visible && targetUserId) {
      loadUserData();
    } else {
      setFullUser(null);
      setPhotos([]);
      setActivePhotoIndex(0);
      setIsFollowing(false);
    }
  }, [visible, targetUserId, loadUserData]);

  // Combined profile display data
  const displayName =
    fullUser?.profile?.nickname ||
    fullUser?.displayName ||
    participant?.name ||
    participant?.displayName ||
    '참여자';

  const headline =
    fullUser?.profile?.headline ||
    participant?.headline ||
    '';

  const bio =
    fullUser?.profile?.bio ||
    participant?.bio ||
    '';

  const region = [
    fullUser?.region1 || participant?.region1,
    fullUser?.region2 || participant?.region2,
  ]
    .filter(Boolean)
    .join(' ') || participant?.region || '지역 미설정';

  const interests =
    fullUser?.profile?.interests ||
    participant?.interests ||
    [];

  const callRatePerMinute =
    fullUser?.callRatePerMinute ||
    participant?.callRatePerMinute ||
    1500;

  // Follow Toggle Action
  const handleToggleFollow = async () => {
    const targetAccountId =
      fullUser?.targetAccountId ||
      participant?.targetAccountId ||
      participant?.activityAccountId ||
      targetUserId;

    if (!targetAccountId || followLoading) return;
    setFollowLoading(true);

    try {
      if (isFollowing) {
        await apiClient.unfollowAccount(targetAccountId);
        setIsFollowing(false);
      } else {
        await apiClient.followAccount(targetAccountId);
        setIsFollowing(true);
      }
    } catch (e) {
      Alert.alert('팔로우 오류', e?.message || '처리에 실패했습니다.');
    } finally {
      setFollowLoading(false);
    }
  };

  // 1:1 통화 신청 Action
  const handleRequestCall = () => {
    if (isSelf) {
      Alert.alert('알림', '본인에게는 1:1 통화를 신청할 수 없습니다.');
      return;
    }

    Alert.alert(
      '1:1 프라이빗 통화 신청',
      `'${displayName}'님에게 1:1 영상 통화를 신청하시겠습니까?\n\n· 통화 요금: 분당 ${Number(callRatePerMinute).toLocaleString()}P 차감`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '통화 신청하기',
          style: 'default',
          onPress: async () => {
            setCalling(true);
            try {
              const res = await apiClient.startCall({
                hostUserId: targetUserId,
              });

              Alert.alert(
                '통화 신청 완료',
                `'${displayName}'님에게 통화 요청이 전송되었습니다.\n상대방이 수락하면 연결됩니다.`,
                [{ text: '확인', onPress: onClose }]
              );
            } catch (err) {
              const msg = err?.message || '';
              if (msg.includes('포인트') || msg.includes('balance') || msg.includes('잔액')) {
                Alert.alert(
                  '포인트 부족',
                  `통화를 시작하기 위한 포인트가 부족합니다.\n상점에서 포인트를 충전해 주세요.`,
                  [
                    { text: '닫기', style: 'cancel' },
                    {
                      text: '충전하기',
                      onPress: () => {
                        onClose?.();
                        onNavigateToShop?.();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('통화 신청 실패', msg || '통화 신청 중 오류가 발생했습니다.');
              }
            } finally {
              setCalling(false);
            }
          },
        },
      ]
    );
  };

  // 관리 메뉴 (신고 / 차단)
  const handleOpenMenu = () => {
    if (isSelf) return;

    Alert.alert(
      `${displayName} 관리`,
      '원하시는 작업을 선택하세요.',
      [
        {
          text: '사용자 신고하기',
          style: 'destructive',
          onPress: () => {
            onClose?.();
            onOpenReport?.({
              type: 'user',
              name: displayName,
              userId: targetUserId,
            });
          },
        },
        {
          text: '사용자 차단하기',
          style: 'destructive',
          onPress: () => {
            onClose?.();
            onBlockUser?.(targetUserId, displayName);
          },
        },
        { text: '취소', style: 'cancel' },
      ]
    );
  };

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / PHOTO_WIDTH);
    if (index >= 0 && index !== activePhotoIndex) {
      setActivePhotoIndex(index);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.dismissBackdrop} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          {/* Top Drag Handle */}
          <View style={styles.dragHandleBar} />

          {/* Header Controls */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetHeaderTitle}>프로필 정보</Text>
            <View style={styles.headerRightActions}>
              {!isSelf && (
                <TouchableOpacity
                  style={styles.headerIconBtn}
                  onPress={handleOpenMenu}
                  hitSlop={8}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color="#CBD5E1" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={onClose}
                hitSlop={8}
              >
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={ACCENT_COLOR} />
              <Text style={styles.loadingText}>프로필 불러오는 중...</Text>
            </View>
          ) : (
            <View style={styles.contentWrap}>
              {/* Photo Carousel (Azar / Bigo style Paging) */}
              <View style={styles.carouselContainer}>
                {photos.length > 0 ? (
                  <FlatList
                    ref={flatListRef}
                    data={photos}
                    keyExtractor={(item, idx) => item?.id || `photo_${idx}`}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    snapToInterval={PHOTO_WIDTH}
                    decelerationRate="fast"
                    renderItem={({ item, index }) => (
                      <View style={styles.photoSlide}>
                        <Image
                          source={{ uri: item.url }}
                          style={styles.carouselPhoto}
                          resizeMode="cover"
                        />
                        {item.isPrimary && (
                          <View style={styles.primaryBadge}>
                            <Ionicons name="star" size={11} color="#FFFFFF" />
                            <Text style={styles.primaryBadgeText}>대표</Text>
                          </View>
                        )}
                      </View>
                    )}
                  />
                ) : (
                  <View style={styles.noPhotoPlaceholder}>
                    <Avatar
                      size={96}
                      name={displayName}
                      uri={participant?.avatar || participant?.avatarUri}
                    />
                    <Text style={styles.noPhotoText}>등록된 사진이 없습니다</Text>
                  </View>
                )}

                {/* Page Indicator Badge */}
                {photos.length > 1 && (
                  <View style={styles.pagingBadge}>
                    <Text style={styles.pagingBadgeText}>
                      {activePhotoIndex + 1} / {photos.length}
                    </Text>
                  </View>
                )}

                {/* Dots indicator */}
                {photos.length > 1 && (
                  <View style={styles.dotsRow}>
                    {photos.map((_, i) => (
                      <View
                        key={`dot_${i}`}
                        style={[
                          styles.dot,
                          i === activePhotoIndex && styles.dotActive,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>

              {/* Profile Details */}
              <View style={styles.metaContainer}>
                <View style={styles.nameRow}>
                  <Text style={styles.nameText} numberOfLines={1}>
                    {displayName}
                  </Text>
                  {participant?.gender && (
                    <View
                      style={[
                        styles.genderPill,
                        participant.gender === 'female'
                          ? styles.femalePill
                          : styles.malePill,
                      ]}
                    >
                      <Ionicons
                        name={participant.gender === 'female' ? 'female' : 'male'}
                        size={12}
                        color={participant.gender === 'female' ? '#EC4899' : '#3B82F6'}
                      />
                    </View>
                  )}
                  <View style={styles.regionPill}>
                    <Ionicons name="location-sharp" size={11} color="#A1A1AA" />
                    <Text style={styles.regionText}>{region}</Text>
                  </View>
                </View>

                {Boolean(headline) && (
                  <Text style={styles.headlineText} numberOfLines={1}>
                    {headline}
                  </Text>
                )}

                {Boolean(bio) && (
                  <Text style={styles.bioText} numberOfLines={2}>
                    {bio}
                  </Text>
                )}

                {/* Interests Tags */}
                {Array.isArray(interests) && interests.length > 0 && (
                  <View style={styles.interestsRow}>
                    {interests.slice(0, 4).map((tag, i) => (
                      <View key={`tag_${i}`} style={styles.tagPill}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Call Rate Card */}
                <View style={styles.rateCard}>
                  <View style={styles.rateCardLeft}>
                    <View style={styles.rateIconWrap}>
                      <Ionicons name="videocam" size={16} color="#F59E0B" />
                    </View>
                    <View>
                      <Text style={styles.rateCardTitle}>1:1 프라이빗 영상 통화</Text>
                      <Text style={styles.rateCardSub}>실시간 고화질 영상 통화</Text>
                    </View>
                  </View>
                  <View style={styles.ratePriceBadge}>
                    <Text style={styles.ratePriceText}>
                      {Number(callRatePerMinute).toLocaleString()} P
                    </Text>
                    <Text style={styles.ratePriceUnit}> / 분</Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons (Bigo/Azar style Bottom Bar) */}
              <View style={styles.actionsBar}>
                {!isSelf && (
                  <TouchableOpacity
                    style={[
                      styles.followBtn,
                      isFollowing && styles.followingBtn,
                    ]}
                    onPress={handleToggleFollow}
                    disabled={followLoading}
                    activeOpacity={0.8}
                  >
                    {followLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={isFollowing ? '#A1A1AA' : '#FFFFFF'}
                      />
                    ) : (
                      <>
                        <Ionicons
                          name={isFollowing ? 'checkmark' : 'add'}
                          size={18}
                          color={isFollowing ? '#CBD5E1' : '#FFFFFF'}
                        />
                        <Text
                          style={[
                            styles.followBtnText,
                            isFollowing && styles.followingBtnText,
                          ]}
                        >
                          {isFollowing ? '팔로잉' : '팔로우'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.callBtn,
                    isSelf && { flex: 1 },
                  ]}
                  onPress={handleRequestCall}
                  disabled={calling}
                  activeOpacity={0.85}
                >
                  {calling ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="call" size={18} color="#FFFFFF" />
                      <Text style={styles.callBtnText}>1:1 통화 신청</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  dismissBackdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: 'rgba(24, 24, 27, 0.96)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  dragHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 4,
  },
  sheetHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F4F4F5',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    padding: 4,
  },
  loadingBox: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  contentWrap: {
    gap: 12,
  },
  carouselContainer: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1E1E24',
    position: 'relative',
    alignSelf: 'center',
  },
  photoSlide: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    position: 'relative',
  },
  carouselPhoto: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
  },
  primaryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noPhotoPlaceholder: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  noPhotoText: {
    fontSize: 13,
    color: '#71717A',
  },
  pagingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pagingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    width: 14,
    backgroundColor: '#FFFFFF',
  },
  metaContainer: {
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  genderPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  femalePill: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
  },
  malePill: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  regionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  regionText: {
    fontSize: 11,
    color: '#A1A1AA',
    fontWeight: '500',
  },
  headlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E4E4E7',
  },
  bioText: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  tagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tagText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  rateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rateCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rateIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rateCardSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  ratePriceBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ratePriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F59E0B',
  },
  ratePriceUnit: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  followBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: ACCENT_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  followingBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  followBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  followingBtnText: {
    color: '#CBD5E1',
  },
  callBtn: {
    flex: 1.4,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#10B981', // Emerald Call Green
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  callBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
