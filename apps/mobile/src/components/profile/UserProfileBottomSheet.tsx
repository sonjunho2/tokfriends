import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
  PanResponder,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ActiveCallModal, { CallSessionData } from '../calls/ActiveCallModal';
import { apiClient } from '../../api/client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PHOTO_SIZE = SCREEN_WIDTH - 48;

export interface ProfileUserPhoto {
  id: string;
  imageUrl: string;
  order: number;
}

export interface UserProfileData {
  id: string;
  nickname: string;
  avatarUrl?: string | null;
  bio?: string | null;
  callRatePerMinute?: number | null;
  status?: string;
  role?: string;
  photos?: ProfileUserPhoto[];
}

interface UserProfileBottomSheetProps {
  visible: boolean;
  user: UserProfileData | null;
  defaultCallRate?: number;
  onClose: () => void;
  onRequestPrivateCall?: (targetUserId: string, rate: number) => void;
}

export const UserProfileBottomSheet = memo(({
  visible,
  user,
  defaultCallRate = 1500,
  onClose,
  onRequestPrivateCall,
}: UserProfileBottomSheetProps) => {
  const insets = useSafeAreaInsets();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [activeCallSession, setActiveCallSession] = useState<CallSessionData | null>(null);
  const [showActiveCallModal, setShowActiveCallModal] = useState<boolean>(false);

  // Effective call rate (User-defined or system default)
  const effectiveRate = useMemo(() => {
    return user?.callRatePerMinute ?? defaultCallRate;
  }, [user?.callRatePerMinute, defaultCallRate]);

  // Max 9 photos sorted by order
  const photoList = useMemo(() => {
    if (!user?.photos || user.photos.length === 0) {
      if (user?.avatarUrl) {
        return [{ id: 'avatar', imageUrl: user.avatarUrl, order: 0 }];
      }
      return [];
    }
    return [...user.photos]
      .sort((a, b) => a.order - b.order)
      .slice(0, 9);
  }, [user?.photos, user?.avatarUrl]);

  // PanResponder for smooth bottom-sheet drag down gesture
  const panY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.8) {
          Animated.timing(panY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleRequestCall = useCallback(async () => {
    if (!user) return;
    try {
      // 1. 잔액 확인 (최소 1,500 ON)
      const balanceRes = await apiClient.getPointBalance();
      const currentBalance = Number(balanceRes?.balance ?? 0);
      const minRequired = effectiveRate || 1500;

      if (currentBalance < minRequired) {
        Alert.alert(
          '포인트 부족',
          `1:1 유료 통화를 신청하려면 최소 ${minRequired.toLocaleString()} ON이 필요합니다.\n현재 보유 잔액: ${currentBalance.toLocaleString()} ON\n\n온(ON)을 충전하시겠습니까?`,
          [
            { text: '취소', style: 'cancel' },
            {
              text: '온 충전하기',
              onPress: () => {
                onClose();
              },
            },
          ]
        );
        return;
      }

      // 2. POST /api/calls/start 세션 개설
      const res = await apiClient.startCall({
        hostUserId: user.id,
      });

      const sessionData: CallSessionData = {
        id: res?.id || res?.sessionId || `call-sess-${Date.now()}`,
        channelId: res?.channelId || res?.channelName,
        hostId: user.id,
        hostNickname: user.nickname,
        hostAvatar: user.avatarUrl || undefined,
        callerBalance: currentBalance,
        ratePerMinute: minRequired,
        status: 'RINGING',
      };

      setActiveCallSession(sessionData);
      setShowActiveCallModal(true);

      if (onRequestPrivateCall) {
        onRequestPrivateCall(user.id, effectiveRate);
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('포인트') || msg.includes('balance') || msg.includes('잔액')) {
        Alert.alert(
          '포인트 부족',
          '통화를 시작하기 위한 온(ON)이 부족합니다.\n충전소에서 포인트를 충전해 주세요.',
          [{ text: '확인', onPress: onClose }]
        );
      } else {
        Alert.alert('통화 신청 실패', msg || '통화 세션을 개설하지 못했습니다.');
      }
    }
  }, [user, effectiveRate, onClose, onRequestPrivateCall]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActivePhotoIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Optimized Photo RenderItem
  const renderPhotoItem = useCallback(({ item }: { item: ProfileUserPhoto }) => (
    <View style={styles.photoContainer}>
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.photoImage}
        resizeMode="cover"
      />
    </View>
  ), []);

  const keyExtractor = useCallback((item: ProfileUserPhoto) => item.id, []);

  if (!visible && !showActiveCallModal) {
    return null;
  }

  return (
    <>
      {visible && user && (
        <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY: panY }],
            },
          ]}
        >
          {/* Top Drag Handle */}
          <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
            <View style={styles.dragIndicator} />
          </View>

          {/* User Header Profile (Avatar + Nickname + Bio) */}
          <View style={styles.headerInfoRow}>
            {user.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatarThumbnail}
              />
            ) : (
              <View style={[styles.avatarThumbnail, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={28} color="#94A3B8" />
              </View>
            )}
            <View style={styles.headerTextGroup}>
              <View style={styles.nicknameBadgeRow}>
                <Text style={styles.nicknameText}>{user.nickname}</Text>
                {user.role === 'CREATOR' && (
                  <View style={styles.creatorBadge}>
                    <Text style={styles.creatorBadgeText}>CREATOR</Text>
                  </View>
                )}
              </View>
              {user.bio ? (
                <Text style={styles.bioText} numberOfLines={2}>
                  {user.bio}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          {/* Photo Gallery: Optimized Horizontal FlatList (Max 9 Photos) */}
          {photoList.length > 0 ? (
            <View style={styles.galleryWrapper}>
              <FlatList
                data={photoList}
                renderItem={renderPhotoItem}
                keyExtractor={keyExtractor}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                removeClippedSubviews={true}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                getItemLayout={(_, index) => ({
                  length: PHOTO_SIZE,
                  offset: PHOTO_SIZE * index,
                  index,
                })}
              />
              {/* Pagination Indicators */}
              {photoList.length > 1 && (
                <View style={styles.paginationDots}>
                  {photoList.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i === activePhotoIndex ? styles.activeDot : null,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyGalleryBox}>
              <Ionicons name="images-outline" size={40} color="#475569" />
              <Text style={styles.emptyGalleryText}>등록된 사진이 없습니다</Text>
            </View>
          )}

          {/* Action Button: 1:1 Video Call Application */}
          <TouchableOpacity
            style={styles.callActionButton}
            activeOpacity={0.85}
            onPress={handleRequestCall}
          >
            <Ionicons name="videocam" size={22} color="#FFF" style={styles.callBtnIcon} />
            <Text style={styles.callActionText}>
              📞 1:1 유료 통화 신청 (분당 1,500 ON)
            </Text>
            <View style={styles.rateBadge}>
              <Text style={styles.rateBadgeText}>
                {effectiveRate.toLocaleString()} ON/분
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
      {/* 1:1 유료 통화 활성화 모달 */}
        </Modal>
      )}
      {/* 1:1 유료 통화 활성화 모달 */}
      <ActiveCallModal
        visible={showActiveCallModal}
        session={activeCallSession}
        onClose={() => {
          setShowActiveCallModal(false);
          setActiveCallSession(null);
          onClose();
        }}
      />
    </>
  );
});

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    maxHeight: SCREEN_HEIGHT * 0.82,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dragHandleArea: {
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  dragIndicator: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#475569',
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E293B',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextGroup: {
    flex: 1,
    marginLeft: 14,
  },
  nicknameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nicknameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  creatorBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  creatorBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  bioText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 6,
  },
  galleryWrapper: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 0.9,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    marginBottom: 16,
  },
  photoContainer: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 0.9,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 3,
  },
  activeDot: {
    width: 16,
    backgroundColor: '#38BDF8',
  },
  emptyGalleryBox: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    marginBottom: 16,
  },
  emptyGalleryText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 8,
  },
  callActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E11D48',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  callBtnIcon: {
    marginRight: 8,
  },
  callActionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  rateBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 10,
  },
  rateBadgeText: {
    color: '#FDE047',
    fontSize: 12,
    fontWeight: '800',
  },
});

export default UserProfileBottomSheet;
