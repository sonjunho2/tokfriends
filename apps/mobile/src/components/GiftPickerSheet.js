// apps/mobile/src/components/GiftPickerSheet.js
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import typography from '../theme/typography';
import { apiClient } from '../api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: 'mocco_special', label: '3D 모꼬' },
  { key: 'mocco_vip', label: 'VIP 모꼬' },
  { key: 'general', label: '일반/카페' },
];

const DEFAULT_MOCCO_GIFTS = [
  {
    id: 'gift-mocco-1',
    code: 'gift-blushing-mocco',
    name: '볼빨간 모꼬 (소형)',
    description: '모꼬가 부끄러워하며 화면에 핑크빛 하트 구름 방울을 퐁퐁 뿜어냅니다 ☁️💖',
    pricePoints: 1000,
    amount: 1000,
    animationType: 'BLUSHING_MOCCO',
    category: 'mocco_special',
    icon: '☁️💖',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
  },
  {
    id: 'gift-mocco-2',
    code: 'gift-cloud-car-mocco',
    name: '구름카 탄 모꼬 (중형)',
    description: '모꼬가 핑크빛 오픈카를 타고 화면을 가로지르며 꽃가루 폭죽을 쏘아 올립니다 🚗🎉',
    pricePoints: 5000,
    amount: 5000,
    animationType: 'CLOUD_CAR_MOCCO',
    category: 'mocco_special',
    icon: '🚗🎉',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  },
  {
    id: 'gift-mocco-3',
    code: 'gift-golden-king-mocco',
    name: '골든 킹 모꼬의 축제 (VIP 대형)',
    description: '황금 왕관을 쓴 거대 황금 모꼬가 나타나 화면 전체에 골드 코인과 축제 폭죽을 쏟아붓습니다 👑🪙🎆',
    pricePoints: 30000,
    amount: 30000,
    animationType: 'GOLDEN_KING_MOCCO',
    category: 'mocco_vip',
    icon: '👑🪙',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200',
  },
  {
    id: 'gift-cafe-1',
    code: 'gift-macaron',
    name: '달콤 마카롱 세트',
    description: '따뜻한 대화에 달콤한 활력을 주는 5색 프리미엄 마카롱 세트 🍬',
    pricePoints: 3000,
    amount: 3000,
    animationType: 'none',
    category: 'general',
    icon: '🍬',
    thumbnailUrl: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=200',
  },
  {
    id: 'gift-cafe-2',
    code: 'gift-starbucks',
    name: '스타벅스 아메리카노',
    description: '기분 좋은 하루를 응원하는 모바일 커피 쿠폰 ☕',
    pricePoints: 4500,
    amount: 4500,
    animationType: 'none',
    category: 'general',
    icon: '☕',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200',
  },
  {
    id: 'gift-special-1',
    code: 'gift-coffee',
    name: '따뜻한 커피',
    description: '친구에게 마음을 전하는 따뜻한 커피 한 잔',
    pricePoints: 100,
    amount: 100,
    animationType: 'none',
    category: 'general',
    icon: '☕',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200',
  },
  {
    id: 'gift-special-2',
    code: 'gift-icecream',
    name: '달콤한 아이스크림',
    description: '기분 좋은 시원하고 달콤한 선물',
    pricePoints: 300,
    amount: 300,
    animationType: 'none',
    category: 'general',
    icon: '🍦',
    thumbnailUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=200',
  },
  {
    id: 'gift-special-3',
    code: 'gift-cake',
    name: '조각 케이크',
    description: '특별한 날을 축하하는 달콤한 케이크',
    pricePoints: 500,
    amount: 500,
    animationType: 'none',
    category: 'general',
    icon: '🍰',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200',
  },
  {
    id: 'gift-special-4',
    code: 'gift-bouquet',
    name: '아름다운 꽃다발',
    description: '진심 어린 감동을 전하는 꽃다발 선물',
    pricePoints: 1000,
    amount: 1000,
    animationType: 'none',
    category: 'general',
    icon: '💐',
    thumbnailUrl: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=200',
  },
  {
    id: 'gift-special-5',
    code: 'gift-diamond',
    name: '영롱한 다이아몬드',
    description: '최고의 찬사를 보내는 영롱한 보석',
    pricePoints: 5000,
    amount: 5000,
    animationType: '3d_heart',
    category: 'general',
    icon: '💎',
    thumbnailUrl: 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=200',
  },
  {
    id: 'gift-vip-1',
    code: 'gift-supercar',
    name: '네온 슈퍼카 (3D)',
    description: '화려한 라이브를 수놓는 3D 슈퍼카 이펙트',
    pricePoints: 10000,
    amount: 10000,
    animationType: 'alpha_video',
    category: 'mocco_vip',
    icon: '🏎️',
    thumbnailUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=200',
  },
  {
    id: 'gift-vip-2',
    code: 'gift-dragon',
    name: '골든 드래곤 (3D)',
    description: '화면 전체를 압도하는 헐리우드급 3D 황금 드래곤',
    pricePoints: 50000,
    amount: 50000,
    animationType: 'alpha_video',
    category: 'mocco_vip',
    icon: '🐉',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200',
  },
];

export default function GiftPickerSheet({
  visible,
  onClose,
  onSendGift,
  myPoints = 0,
  onGoToShop,
  context = 'chat', // 'chat' | 'live'
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  const filterGifts = (items, category) => {
    if (!Array.isArray(items)) return [];
    if (category === 'all') return items;
    if (category === 'mocco_special') return items.filter((g) => g.category === 'mocco_special' || g.category === 'special');
    if (category === 'mocco_vip') return items.filter((g) => g.category === 'mocco_vip' || g.category === 'vip');
    return items.filter((g) => g.category === category);
  };

  const loadGifts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getGifts({ context });
      let list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res)
        ? res
        : [];
      if (!list || list.length === 0) {
        list = DEFAULT_MOCCO_GIFTS;
      }
      const filtered = filterGifts(list, activeCategory);
      setGifts(filtered);
      if (filtered.length > 0 && !selectedGift) {
        setSelectedGift(filtered[0]);
      }
    } catch {
      const fallbackList = filterGifts(DEFAULT_MOCCO_GIFTS, activeCategory);
      setGifts(fallbackList);
      if (fallbackList.length > 0 && !selectedGift) {
        setSelectedGift(fallbackList[0]);
      }
    } finally {
      setLoading(false);
    }
  }, [activeCategory, context, selectedGift]);

  useEffect(() => {
    if (visible) {
      loadGifts();
    }
  }, [visible, activeCategory, loadGifts]);

  const handleSendPress = async () => {
    if (!selectedGift || submitting) return;

    if (myPoints < selectedGift.pricePoints) {
      if (onGoToShop) {
        onGoToShop();
      }
      return;
    }

    setSubmitting(true);
    try {
      await onSendGift(selectedGift);
      onClose();
    } finally {
      setSubmitting(false);
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
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheetContainer,
                { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 34 : 28) },
              ]}
            >
              {/* 시트 헤더 */}
              <View style={styles.header}>
                <View style={styles.pointsBadgeRow}>
                  <Text style={styles.headerTitle}>모꼬 3D 선물상자</Text>
                  <View style={styles.myPointsPill}>
                    <Text style={{ fontSize: 13 }}>🪙</Text>
                    <Text style={styles.myPointsText}>
                      보유 {myPoints?.toLocaleString() ?? 0} 꿀떡
                    </Text>
                    {onGoToShop && (
                      <TouchableOpacity
                        style={styles.chargeBtn}
                        onPress={() => {
                          onClose();
                          onGoToShop();
                        }}
                      >
                        <Text style={styles.chargeBtnText}>충전</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* 카테고리 탭 */}
              <View style={styles.categoryRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryTab,
                      activeCategory === cat.key && styles.categoryTabActive,
                    ]}
                    onPress={() => setActiveCategory(cat.key)}
                  >
                    <Text
                      style={[
                        styles.categoryLabel,
                        activeCategory === cat.key && styles.categoryLabelActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 선물 아이템 그리드 */}
              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>선물 목록을 불러오는 중...</Text>
                </View>
              ) : gifts.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>준비된 선물이 없습니다.</Text>
                </View>
              ) : (
                <FlatList
                  data={gifts}
                  keyExtractor={(item) => item.id || item.code}
                  numColumns={4}
                  contentContainerStyle={styles.gridContent}
                  renderItem={({ item }) => {
                    const isSelected = selectedGift?.id === item.id;
                    const isVipTier = item.animationType === 'GOLDEN_KING_MOCCO' || item.category === 'mocco_vip' || item.pricePoints >= 10000;
                    const isCloudCar = item.animationType === 'CLOUD_CAR_MOCCO' || (item.category === 'mocco_special' && item.pricePoints >= 5000);
                    const isBlushing = item.animationType === 'BLUSHING_MOCCO' || item.category === 'mocco_special';

                    const emojiTag = isVipTier ? '👑 VIP' : isCloudCar ? '🚗 3D' : isBlushing ? '☁️ 3D' : '🎁 일반';
                    const fallbackIcon = item.icon || (isVipTier ? '👑' : isCloudCar ? '🚗' : isBlushing ? '☁️' : '🎁');
                    const hasValidImage = item.thumbnailUrl && (item.thumbnailUrl.startsWith('http://') || item.thumbnailUrl.startsWith('https://'));

                    return (
                      <TouchableOpacity
                        style={[
                          styles.giftItemCard,
                          isSelected && styles.giftItemCardSelected,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setSelectedGift(item)}
                      >
                        <View
                          style={[
                            styles.vipTag,
                            isVipTier && { backgroundColor: '#EAB308' },
                            isCloudCar && { backgroundColor: '#EC4899' },
                            isBlushing && { backgroundColor: '#F472B6' },
                          ]}
                        >
                          <Text style={styles.vipTagText}>{emojiTag}</Text>
                        </View>
                        <View style={styles.giftIconWrap}>
                          {hasValidImage ? (
                            <Image
                              source={{ uri: item.thumbnailUrl }}
                              style={styles.giftImage}
                            />
                          ) : (
                            <Text style={{ fontSize: 26 }}>{fallbackIcon}</Text>
                          )}
                        </View>
                        <Text style={styles.giftName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.giftPrice}>
                          {item.pricePoints?.toLocaleString()} 꿀떡
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}

              {/* 하단 전송 액션 바 */}
              <View style={styles.bottomBar}>
                {selectedGift ? (
                  <View style={styles.selectedGiftMeta}>
                    <Text style={styles.selectedGiftLabel}>
                      선택: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{selectedGift.name}</Text>
                    </Text>
                    <Text style={styles.selectedGiftPrice}>
                      {selectedGift.pricePoints?.toLocaleString()} 꿀떡 선물하기
                    </Text>
                  </View>
                ) : (
                  <View style={styles.selectedGiftMeta}>
                    <Text style={styles.selectedGiftLabel}>선물을 선택해주세요</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    (!selectedGift || submitting) && styles.sendBtnDisabled,
                  ]}
                  disabled={!selectedGift || submitting}
                  onPress={handleSendPress}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.sendBtnText}>
                      {myPoints < (selectedGift?.pricePoints || 0)
                        ? '꿀떡 충전하기'
                        : '선물 보내기'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: 480,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  pointsBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: typography.titleSmall.fontFamily,
  },
  myPointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 8,
    gap: 4,
  },
  myPointsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  chargeBtn: {
    backgroundColor: '#D97706',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 2,
  },
  chargeBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  categoryTab: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
  },
  categoryTabActive: {
    backgroundColor: colors.primaryLight,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  gridContent: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  giftItemCard: {
    flex: 1 / 4,
    alignItems: 'center',
    paddingVertical: 10,
    margin: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: '#FFFFFF',
  },
  giftItemCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  vipTag: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  vipTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  giftIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    marginBottom: 6,
    overflow: 'hidden',
  },
  giftImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  giftName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  giftPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  loadingBox: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 8,
  },
  emptyBox: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  selectedGiftMeta: {
    flex: 1,
  },
  selectedGiftLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  selectedGiftPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 1,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 110,
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.textDisabled,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
