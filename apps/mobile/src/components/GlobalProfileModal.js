// src/components/GlobalProfileModal.js
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useProfileModal } from '../context/ProfileModalContext';
import Avatar from './Avatar';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../api/client';
import { checkAndConfirmActionPoint } from '../utils/pointPolicyHelper';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function GlobalProfileModal() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { visible, profile, closeProfile } = useProfileModal();
  const { user } = useAuth();
  const [sending, setSending] = useState(false);

  // 다중 프로필 사진 상태
  const [photos, setPhotos] = useState([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const carouselScrollRef = useRef(null);

  const targetUserId =
    typeof profile?.targetUserId === 'string'
      ? profile.targetUserId.trim()
      : typeof profile?.id === 'string' && !profile.id.startsWith('acc_')
      ? profile.id.trim()
      : user?.id || '';

  const loadPhotos = useCallback(async () => {
    if (!visible) return;
    try {
      if (Array.isArray(profile?.photos) && profile.photos.length > 0) {
        setPhotos(profile.photos);
        return;
      }
      if (targetUserId) {
        const res = await apiClient.getUserPhotos(targetUserId);
        if (Array.isArray(res) && res.length > 0) {
          setPhotos(res);
          return;
        }
      }
    } catch {}
  }, [visible, profile?.photos, targetUserId]);

  useEffect(() => {
    if (visible) {
      setActivePhotoIndex(0);
      loadPhotos();
    }
  }, [visible, loadPhotos]);

  const profileData = useMemo(() => {
    if (profile) return profile;
    if (!user) return null;

    const userProfile = user?.profile ?? {};
    const location =
      [user?.region1, user?.region2].filter(Boolean).join(' · ') || '지역 미설정';

    return {
      name: userProfile?.nickname || user?.displayName || '회원님',
      location,
      title: userProfile?.headline || '한줄 소개가 없습니다.',
      bio: userProfile?.bio || '소개가 없습니다.',
      avatar: userProfile?.avatarUri || null,
      coverImage: userProfile?.avatarUri || null,
    };
  }, [profile, user]);

  const displayPhotos = useMemo(() => {
    if (photos.length > 0) {
      return photos.map((p, idx) => ({
        id: p.id || `photo-${idx}`,
        url: p.url,
        isPrimary: Boolean(p.isPrimary),
      }));
    }
    const fallback = profileData?.avatar || profileData?.coverImage;
    if (fallback) {
      return [{ id: 'primary-fallback', url: fallback, isPrimary: true }];
    }
    return [];
  }, [photos, profileData?.avatar, profileData?.coverImage]);

  const handleClose = () => {
    closeProfile();
  };

  const handleOpenMyPage = () => {
    closeProfile();
  };

  const handleOpenSettings = () => {
    closeProfile();
    setTimeout(() => {
      navigation.navigate('My', { screen: 'MyPageMain' });
    }, 0);
  };

  const handleMessage = () => {
    if (sending) return;
    const targetUserId =
      typeof profile?.targetUserId === 'string' ? profile.targetUserId.trim() : '';
    const targetAccountId =
      typeof profile?.targetAccountId === 'string' ? profile.targetAccountId.trim() : '';
    if (!targetUserId && !targetAccountId) {
      Alert.alert('안내', '대화할 회원 정보를 찾을 수 없습니다.');
      return;
    }
    if (targetUserId && targetAccountId) {
      Alert.alert('안내', '대화 상대 식별 정보가 올바르지 않습니다.');
      return;
    }

    checkAndConfirmActionPoint({
      actionType: 'chatRoomCreate',
      actionName: '1:1 대화방 개설',
      navigation,
      onConfirm: async () => {
        setSending(true);
        try {
          const room = await apiClient.ensureDirectRoom(
            targetUserId ? { targetUserId } : { targetAccountId },
          );
          const roomId = room?.id || room?._id;
          if (!roomId) {
            throw new Error('채팅방 정보를 확인할 수 없습니다.');
          }
          const participant = {
            ...(targetUserId ? { id: targetUserId, targetUserId } : { targetAccountId }),
            name: profileData?.name,
            avatar: profileData?.avatar,
            headline: profileData?.title,
          };
          closeProfile();
          setTimeout(() => {
            navigation.navigate('Chat', {
              screen: 'ChatRoom',
              params: { id: roomId, room, user: participant },
            });
          }, 120);
        } catch (error) {
          Alert.alert('메시지 시작 실패', error?.message || '채팅방을 생성하지 못했습니다.');
        } finally {
          setSending(false);
        }
      },
    });
  };

  if (!visible || !profileData) return null;

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* 상단 다중 사진 캐러셀 */}
        <View style={styles.carouselContainer}>
          {displayPhotos.length > 0 ? (
            <ScrollView
              ref={carouselScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const newIndex = Math.round(offsetX / SCREEN_WIDTH);
                setActivePhotoIndex(newIndex);
              }}
              style={styles.carouselScrollView}
            >
              {displayPhotos.map((photo, pIdx) => (
                <View key={photo.id || pIdx} style={[styles.carouselSlide, { width: SCREEN_WIDTH }]}>
                  <Image source={{ uri: photo.url }} style={styles.coverImage} />
                  <View style={styles.coverOverlay} />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.coverPlaceholder} />
          )}

          {/* 스토리 인디케이터 바 */}
          {displayPhotos.length > 1 && (
            <View style={[styles.storyIndicatorsRow, { top: insets.top + 60 }]}>
              {displayPhotos.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.storyIndicatorBar,
                    idx === activePhotoIndex && styles.storyIndicatorBarActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* 사진 장수 뱃지 */}
          {displayPhotos.length > 1 && (
            <View style={styles.photoCountBadge}>
              <Ionicons name="images" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.photoCountBadgeText}>
                {activePhotoIndex + 1} / {displayPhotos.length}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}> 
          <TouchableOpacity style={styles.topButton} onPress={handleClose} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.textInverse} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topButton} onPress={handleOpenSettings} hitSlop={8}>
            <Ionicons name="settings-outline" size={22} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarWrap}>
            <Avatar
              size={88}
              uri={displayPhotos[activePhotoIndex]?.url || profileData.avatar}
              name={profileData.name}
              shape="circle"
              showBorder
              style={styles.avatar}
            />
          </View>

          <Text style={styles.joinedLabel}>{profileData.title}</Text>
          <Text style={styles.name}>{profileData.name}님의 프로필</Text>
          <Text style={styles.location}>{profileData.location}</Text>

          <View style={styles.infoCard}>
            <Ionicons name="paw-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>{profileData.bio}</Text>
          </View>

          {/* 등록된 사진 앨범 (다중 사진일 때) */}
          {displayPhotos.length > 1 && (
            <View style={styles.albumSection}>
              <View style={styles.albumHeader}>
                <Text style={styles.albumTitle}>등록된 사진 ({displayPhotos.length})</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.albumScroll}>
                {displayPhotos.map((photo, pIdx) => (
                  <TouchableOpacity
                    key={photo.id || pIdx}
                    style={[
                      styles.albumThumbWrap,
                      pIdx === activePhotoIndex && styles.albumThumbWrapActive,
                    ]}
                    onPress={() => {
                      carouselScrollRef.current?.scrollTo({ x: pIdx * SCREEN_WIDTH, animated: true });
                      setActivePhotoIndex(pIdx);
                    }}
                  >
                    <Image source={{ uri: photo.url }} style={styles.albumThumb} />
                    {photo.isPrimary && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryBadgeText}>대표</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, sending && { opacity: 0.6 }]}
            onPress={handleMessage}
            activeOpacity={0.85}
            disabled={sending}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textInverse} />
            <Text style={styles.primaryButtonText}>메시지 보내기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleOpenMyPage}>
            <Text style={styles.secondaryButtonText}>마이페이지 열기</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  carouselContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: colors.backgroundSecondary,
  },
  carouselScrollView: {
    width: '100%',
    height: '100%',
  },
  carouselSlide: {
    height: 320,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  storyIndicatorsRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 4,
    zIndex: 10,
  },
  storyIndicatorBar: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  storyIndicatorBarActive: {
    backgroundColor: '#FFFFFF',
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  photoCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundSecondary,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 2,
  },
  topButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: 280,
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  avatarWrap: {
    alignItems: 'center',
    marginTop: -60,
  },
  avatar: {
    borderWidth: 4,
    borderColor: colors.background,
  },
  joinedLabel: {
    alignSelf: 'center',
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  name: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  location: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.backgroundSecondary,
    padding: 18,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  albumSection: {
    marginTop: 6,
    gap: 8,
  },
  albumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  albumTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  albumScroll: {
    gap: 8,
  },
  albumThumbWrap: {
    width: 64,
    height: 76,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    backgroundColor: colors.backgroundSecondary,
  },
  albumThumbWrapActive: {
    borderColor: colors.primary,
  },
  albumThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  primaryBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  primaryBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
