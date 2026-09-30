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
import colors from '../theme/colors';
import typography from '../theme/typography';
import { apiClient } from '../api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: 'general', label: '일반' },
  { key: 'special', label: '스페셜' },
  { key: 'vip', label: '3D VIP' },
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

  const loadGifts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getGifts({
        category: activeCategory !== 'all' ? activeCategory : undefined,
        context,
      });
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res)
        ? res
        : [];
      setGifts(list);
      if (list.length > 0 && !selectedGift) {
        setSelectedGift(list[0]);
      }
    } catch {
      setGifts([]);
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
            <View style={styles.sheetContainer}>
              {/* 시트 헤더 */}
              <View style={styles.header}>
                <View style={styles.pointsBadgeRow}>
                  <Text style={styles.headerTitle}>마음 전하기 (선물)</Text>
                  <View style={styles.myPointsPill}>
                    <Ionicons name="sparkles" size={13} color="#D97706" />
                    <Text style={styles.myPointsText}>
                      보유 {myPoints?.toLocaleString() ?? 0}P
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
                    const isVip = item.animationType === 'alpha_video';
                    return (
                      <TouchableOpacity
                        style={[
                          styles.giftItemCard,
                          isSelected && styles.giftItemCardSelected,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setSelectedGift(item)}
                      >
                        {isVip && (
                          <View style={styles.vipTag}>
                            <Text style={styles.vipTagText}>3D</Text>
                          </View>
                        )}
                        <View style={styles.giftIconWrap}>
                          {item.thumbnailUrl ? (
                            <Image
                              source={{ uri: item.thumbnailUrl }}
                              style={styles.giftImage}
                            />
                          ) : (
                            <Text style={{ fontSize: 26 }}>🎁</Text>
                          )}
                        </View>
                        <Text style={styles.giftName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.giftPrice}>
                          {item.pricePoints?.toLocaleString()}P
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
                      {selectedGift.pricePoints?.toLocaleString()}P 차감
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
                        ? '포인트 충전하기'
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
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: 460,
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
