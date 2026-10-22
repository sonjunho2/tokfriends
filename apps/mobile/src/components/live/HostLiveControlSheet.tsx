import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketProduct, fetchMarketProducts, INITIAL_MARKET_PRODUCTS } from '../../services/marketService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HostLiveControlSheetProps {
  visible: boolean;
  onClose: () => void;
  roomId: string;
  pinnedProduct: MarketProduct | null;
  onTogglePin: (product: MarketProduct) => void;
}

export default function HostLiveControlSheet({
  visible,
  onClose,
  roomId,
  pinnedProduct,
  onTogglePin,
}: HostLiveControlSheetProps) {
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'B2C' | 'C2C'>('ALL');

  useEffect(() => {
    if (!visible) return;
    let mounted = true;
    setLoading(true);
    fetchMarketProducts()
      .then((items) => {
        if (mounted) {
          setProducts(items && items.length > 0 ? items : INITIAL_MARKET_PRODUCTS);
        }
      })
      .catch(() => {
        if (mounted) setProducts(INITIAL_MARKET_PRODUCTS);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [visible]);

  const filtered = products.filter((p) => {
    if (activeTab === 'B2C') return p.type === 'B2C_GROUP';
    if (activeTab === 'C2C') return p.type === 'C2C_USED';
    return true;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.touchDismiss} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetContainer}>
          {/* Header handle */}
          <View style={styles.handleBar} />

          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <Text style={styles.sheetTitle}>🛍️ 방송 판매 상품 관리</Text>
              <Text style={styles.sheetSub}>
                시청자 화면에 실시간으로 소개할 상품을 핀으로 고정하세요.
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Segment Filter */}
          <View style={styles.tabRow}>
            {[
              { id: 'ALL', label: '전체 상품' },
              { id: 'B2C', label: '🔥 특가 공구' },
              { id: 'C2C', label: '🏷️ 중고 매물' },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab.id as any)}
                >
                  <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Product List */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#FF3B6B" />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isPinned = pinnedProduct?.id === item.id;
                const isB2C = item.type === 'B2C_GROUP';
                const thumb = item.images?.[0] || 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300';

                return (
                  <View style={[styles.productCard, isPinned && styles.productCardPinned]}>
                    <Image source={{ uri: thumb }} style={styles.productThumb} resizeMode="cover" />

                    <View style={styles.productInfo}>
                      <View style={styles.badgeRow}>
                        <View style={[styles.typeBadge, isB2C ? styles.typeBadgeB2C : styles.typeBadgeC2C]}>
                          <Text style={[styles.typeBadgeText, isB2C ? styles.typeBadgeTextB2C : styles.typeBadgeTextC2C]}>
                            {isB2C ? '특가공구' : '중고판매'}
                          </Text>
                        </View>
                        {isPinned && (
                          <View style={styles.pinnedLiveBadge}>
                            <Ionicons name="pin" size={10} color="#FFFFFF" />
                            <Text style={styles.pinnedLiveBadgeText}>화면 고정중</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.productTitle} numberOfLines={1}>
                        {item.title}
                      </Text>

                      <Text style={styles.productPrice}>
                        {item.price.toLocaleString()}원
                      </Text>
                    </View>

                    {/* Pin Toggle Button */}
                    <TouchableOpacity
                      style={[styles.pinToggleBtn, isPinned && styles.pinToggleBtnActive]}
                      activeOpacity={0.85}
                      onPress={() => onTogglePin(item)}
                    >
                      <Ionicons
                        name={isPinned ? 'pin' : 'pin-outline'}
                        size={15}
                        color={isPinned ? '#FFFFFF' : '#4F46E5'}
                      />
                      <Text style={[styles.pinToggleText, isPinned && styles.pinToggleTextActive]}>
                        {isPinned ? '고정해제' : '핀 고정'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  touchDismiss: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: SCREEN_HEIGHT * 0.75,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  titleWrap: {
    flex: 1,
    marginRight: 10,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  sheetSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabBtnActive: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  loadingBox: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
    gap: 10,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  productCardPinned: {
    borderColor: '#FF3B6B',
    backgroundColor: '#FFF1F2',
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeB2C: {
    backgroundColor: '#FEE2E2',
  },
  typeBadgeC2C: {
    backgroundColor: '#E0E7FF',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  typeBadgeTextB2C: {
    color: '#EF4444',
  },
  typeBadgeTextC2C: {
    color: '#4F46E5',
  },
  pinnedLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FF3B6B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pinnedLiveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  pinToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  pinToggleBtnActive: {
    backgroundColor: '#FF3B6B',
    borderColor: '#FF3B6B',
  },
  pinToggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
  },
  pinToggleTextActive: {
    color: '#FFFFFF',
  },
});
