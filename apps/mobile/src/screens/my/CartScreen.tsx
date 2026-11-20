// apps/mobile/src/screens/my/CartScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import { resolveMobileImageUrl } from '../../services/marketService';

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity?: number;
  image?: string;
  images?: any;
  selectedOption?: string;
  sellerName?: string;
}

export default function CartScreen({ navigation }: any) {
  const [cartList, setCartList] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCart = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('@mocco_cart');
      if (stored) {
        setCartList(JSON.parse(stored));
      } else {
        setCartList([]);
      }
    } catch (e) {
      console.warn('Failed to load cart', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const updateQuantity = async (id: string, delta: number) => {
    const updated = cartList
      .map((item) => {
        if (item.id === id) {
          const newQty = (item.quantity || 1) + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    setCartList(updated);
    await AsyncStorage.setItem('@mocco_cart', JSON.stringify(updated));
  };

  const removeItem = async (id: string) => {
    Alert.alert('장바구니 삭제', '선택하신 상품을 장바구니에서 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          const updated = cartList.filter((item) => item.id !== id);
          setCartList(updated);
          await AsyncStorage.setItem('@mocco_cart', JSON.stringify(updated));
        },
      },
    ]);
  };

  const handleCheckout = () => {
    if (cartList.length === 0) return;
    Alert.alert(
      '주문서 작성 & 안전결제',
      `총 ${totalCount}개 상품 (${totalPrice.toLocaleString()}원)을 모꼬 안심 에스크로 결제로 주문하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '결제 진행',
          onPress: () => {
            Alert.alert('결제 완료', '주문 및 안전결제가 정상적으로 완료되었습니다! 배송 현황은 마이모꼬 > 구매내역에서 확인하실 수 있습니다.');
            setCartList([]);
            AsyncStorage.removeItem('@mocco_cart');
            navigation.navigate('MyOrders');
          },
        },
      ]
    );
  };

  const totalPrice = cartList.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);
  const totalCount = cartList.reduce((acc, item) => acc + (item.quantity || 1), 0);

  const renderItem = ({ item }: { item: CartItem }) => {
    const rawImg = Array.isArray(item.images) && item.images.length > 0
      ? item.images[0]
      : typeof item.images === 'string'
      ? (item.images.startsWith('[') ? (JSON.parse(item.images)?.[0] || item.images) : item.images)
      : item.image;
    const thumbUri = resolveMobileImageUrl(rawImg);
    const qty = item.quantity || 1;

    return (
      <View style={styles.card}>
        <Image source={{ uri: thumbUri }} style={styles.cardThumb} resizeMode="cover" />
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.selectedOption ? (
            <Text style={styles.cardOption}>{item.selectedOption}</Text>
          ) : null}
          <Text style={styles.cardPrice}>{(item.price * qty).toLocaleString()}원</Text>

          {/* 수량 변경 버튼 바 */}
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item.id, -1)}
              hitSlop={6}
            >
              <Ionicons name="remove" size={14} color={tokens.colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{qty}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item.id, 1)}
              hitSlop={6}
            >
              <Ionicons name="add" size={14} color={tokens.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => removeItem(item.id)}
          hitSlop={8}
        >
          <Ionicons name="close" size={18} color={tokens.colors.textTertiary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={tokens.colors.surface} />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={8}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={24} color={tokens.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>장바구니</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* 목록 */}
      <FlatList
        data={cartList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="cart-outline" size={36} color={tokens.colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>장바구니가 비어 있습니다.</Text>
            <Text style={styles.emptyDesc}>모꼬마켓의 엄선된 특가 상품을 담아보세요!</Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Market', { screen: 'MarketMain' })}
            >
              <Text style={styles.exploreBtnText}>모꼬마켓 쇼핑하러 가기</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* 하단 주문 결제 CTA 바 */}
      {cartList.length > 0 ? (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>총 {totalCount}개 결제예정금액</Text>
            <Text style={styles.totalPrice}>{totalPrice.toLocaleString()}원</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={handleCheckout}
            activeOpacity={0.88}
          >
            <Text style={styles.checkoutBtnText}>안전결제 주문하기</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.textPrimary,
  },
  listContent: {
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  cardThumb: {
    width: 76,
    height: 76,
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.surfaceAlt,
  },
  cardInfo: {
    flex: 1,
    marginLeft: tokens.spacing.md,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.textPrimary,
    lineHeight: 18,
    marginBottom: 2,
  },
  cardOption: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.textTertiary,
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.textPrimary,
    marginBottom: 6,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.textPrimary,
    paddingHorizontal: 8,
  },
  deleteBtn: {
    padding: tokens.spacing.xs,
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.xl,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: tokens.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  emptyTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.xs,
  },
  emptyDesc: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: tokens.spacing.lg,
  },
  exploreBtn: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: 12,
    borderRadius: tokens.borderRadius.full,
    ...tokens.shadows.sm,
  },
  exploreBtnText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: tokens.colors.surface,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.md,
    paddingBottom: 24,
    ...tokens.shadows.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  totalLabel: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.textSecondary,
  },
  totalPrice: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.textPrimary,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.primary,
    paddingVertical: 14,
    borderRadius: tokens.borderRadius.md,
    ...tokens.shadows.sm,
  },
  checkoutBtnText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
});
