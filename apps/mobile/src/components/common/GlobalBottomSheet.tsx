import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { tokens } from '../../theme/tokens';
import UserAvatar, { AvatarStatus } from './UserAvatar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface UserPhoto {
  id?: string;
  url: string;
  isPrimary?: boolean;
}

export interface SheetUserProfile {
  id: string;
  name: string;
  avatar?: string | null;
  headline?: string;
  bio?: string;
  age?: number | string;
  region?: string;
  status?: AvatarStatus;
  isOnline?: boolean;
  isLive?: boolean;
  photos?: UserPhoto[];
  pointsPerMinute?: number;
}

export interface GlobalBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  user?: SheetUserProfile | null;
  onCallVoice?: (user: SheetUserProfile) => void;
  onCallVideo?: (user: SheetUserProfile) => void;
  onStartChat?: (user: SheetUserProfile) => void;
}

export default function GlobalBottomSheet({
  visible,
  onClose,
  user,
  onCallVoice,
  onCallVideo,
  onStartChat,
}: GlobalBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  if (!visible || !user) return null;

  // 최대 9장 갤러리 사진 슬라이스
  const galleryPhotos = (user.photos || [])
    .slice(0, 9)
    .filter((p) => Boolean(p.url));

  const pointRate = user.pointsPerMinute || 1500;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlayContainer}>
        {/* 백드롭 터치 시 닫기 */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* 바텀 시트 컨텐츠 */}
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* 드래그 핸들 바 */}
          <View style={styles.handleBar} />

          {/* 닫기 버튼 */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color={tokens.colors.textSecondary} />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 유저 기본 정보 헤더 */}
            <View style={styles.profileHeader}>
              <UserAvatar
                uri={user.avatar}
                name={user.name}
                size="lg"
                status={user.status}
                isOnline={user.isOnline}
                isLive={user.isLive}
                showBorder
              />
              <View style={styles.headerInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{user.name}</Text>
                  {user.age ? <Text style={styles.userAge}>({user.age}세)</Text> : null}
                </View>
                {user.region ? (
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={13} color={tokens.colors.textTertiary} />
                    <Text style={styles.locationText}>{user.region}</Text>
                  </View>
                ) : null}
                <Text style={styles.userHeadline} numberOfLines={2}>
                  {user.headline || user.bio || '새로운 인연을 기다리고 있어요 ✨'}
                </Text>
              </View>
            </View>

            {/* 등록된 갤러리 (최대 9장 그리드) */}
            <View style={styles.gallerySection}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>
                  등록된 갤러리{' '}
                  <Text style={styles.photoCountText}>
                    ({galleryPhotos.length}/9)
                  </Text>
                </Text>
              </View>

              {galleryPhotos.length > 0 ? (
                <View style={styles.photoGrid}>
                  {galleryPhotos.map((photo, idx) => (
                    <TouchableOpacity
                      key={photo.id || idx}
                      style={styles.gridItem}
                      activeOpacity={0.88}
                      onPress={() => setSelectedPhotoIndex(idx)}
                    >
                      <Image source={{ uri: photo.url }} style={styles.gridImage} />
                      {photo.isPrimary && (
                        <View style={styles.primaryTag}>
                          <Text style={styles.primaryTagText}>대표</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyGalleryBox}>
                  <Ionicons name="images-outline" size={28} color={tokens.colors.textTertiary} />
                  <Text style={styles.emptyGalleryText}>등록된 사진이 없습니다.</Text>
                </View>
              )}
            </View>

            {/* 1:1 LIVE 및 대화 시작 액션 버튼 바 */}
            <View style={styles.actionSection}>
              {/* 1:1 프라이빗 LIVE 요청 버튼 (네온 코랄 그라데이션) */}
              <TouchableOpacity
                style={styles.callButtonWrapper}
                activeOpacity={0.85}
                onPress={() => {
                  if (onCallVideo) onCallVideo(user);
                  else if (onCallVoice) onCallVoice(user);
                }}
              >
                <LinearGradient
                  colors={tokens.colors.gradients.primaryPurple}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.callButton}
                >
                  <View style={styles.callIconBox}>
                    <Ionicons name="videocam" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.callTextCol}>
                    <Text style={styles.callTitle}>1:1 LIVE (프라이빗 방송)</Text>
                    <Text style={styles.callSub}>{pointRate.toLocaleString()} 온 / 분</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.8)" />
                </LinearGradient>
              </TouchableOpacity>

              {/* 1:1 대화 시작 버튼 */}
              <View style={styles.secondaryActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.subActionButton,
                    styles.chatActionButton,
                    { flex: 1 },
                  ]}
                  onPress={() => onStartChat && onStartChat(user)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chatbubble-ellipses" size={18} color={tokens.colors.text} />
                  <Text style={[styles.subActionText, { color: tokens.colors.text }]}>
                    1:1 대화 시작
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* 사진 전체 화면 뷰어 모달 */}
          {selectedPhotoIndex !== null && (
            <Modal
              transparent
              visible={selectedPhotoIndex !== null}
              animationType="fade"
              onRequestClose={() => setSelectedPhotoIndex(null)}
            >
              <View style={styles.lightboxContainer}>
                <TouchableOpacity
                  style={styles.lightboxCloseBtn}
                  onPress={() => setSelectedPhotoIndex(null)}
                >
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </TouchableOpacity>
                <Image
                  source={{ uri: galleryPhotos[selectedPhotoIndex]?.url }}
                  style={styles.lightboxImage}
                  resizeMode="contain"
                />
                <Text style={styles.lightboxCounter}>
                  {selectedPhotoIndex + 1} / {galleryPhotos.length}
                </Text>
              </View>
            </Modal>
          )}
        </View>
      </View>
    </Modal>
  );
}

const GRID_GAP = 8;
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 40 - GRID_GAP * 2) / 3;

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    backgroundColor: tokens.colors.surface,
    borderTopLeftRadius: tokens.radius.sheet,
    borderTopRightRadius: tokens.radius.sheet,
    maxHeight: SCREEN_HEIGHT * 0.88,
    paddingTop: 12,
    ...tokens.shadows.sheet,
  },
  handleBar: {
    width: 44,
    height: 5,
    backgroundColor: tokens.colors.borderStrong,
    borderRadius: tokens.radius.full,
    alignSelf: 'center',
    marginBottom: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: tokens.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 14,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    ...tokens.typography.h2,
  },
  userAge: {
    ...tokens.typography.body2,
    color: tokens.colors.textSecondary,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  locationText: {
    ...tokens.typography.caption,
    color: tokens.colors.textTertiary,
  },
  userHeadline: {
    ...tokens.typography.body2,
    color: tokens.colors.textSecondary,
    marginTop: 4,
  },
  gallerySection: {
    marginBottom: 22,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    ...tokens.typography.h3,
  },
  photoCountText: {
    color: tokens.colors.primary,
    fontSize: 14,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  gridItem: {
    width: GRID_ITEM_WIDTH,
    height: GRID_ITEM_WIDTH,
    borderRadius: tokens.radius.card,
    overflow: 'hidden',
    backgroundColor: tokens.colors.surfaceSecondary,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  primaryTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: tokens.radius.xs,
  },
  primaryTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyGalleryBox: {
    backgroundColor: tokens.colors.surfaceSecondary,
    borderRadius: tokens.radius.card,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyGalleryText: {
    ...tokens.typography.caption,
  },
  actionSection: {
    gap: 10,
  },
  callButtonWrapper: {
    borderRadius: tokens.radius.card,
    overflow: 'hidden',
    ...tokens.shadows.card,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  callIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callTextCol: {
    flex: 1,
  },
  callTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  callSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  subActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: tokens.colors.primaryLight,
    paddingVertical: 13,
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: tokens.colors.primaryMuted,
  },
  chatActionButton: {
    backgroundColor: tokens.colors.surfaceSecondary,
    borderColor: tokens.colors.border,
  },
  subActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  lightboxContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  lightboxImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  lightboxCounter: {
    position: 'absolute',
    bottom: 40,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
