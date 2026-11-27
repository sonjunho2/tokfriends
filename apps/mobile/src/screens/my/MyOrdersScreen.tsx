// apps/mobile/src/screens/my/MyOrdersScreen.tsx
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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import {
  fetchMyOrders,
  confirmEscrowOrder,
  resolveMobileImageUrl,
} from '../../services/marketService';

interface OrderItem {
  id: string;
  orderNumber: string;
  title: string;
  sellerName: string;
  price: number;
  status: 'SHIPPED' | 'DELIVERED' | 'COMPLETED';
  statusText: string;
  paymentType: string;
  image: string;
  date: string;
  location: string;
  courier: string;
  trackingNumber: string;
  selectedOption: string;
  autoConfirmDays: number;
}

const mapServerOrder = (raw: any): OrderItem => {
  const statusStr = String(raw.status || '').toUpperCase();
  let status: 'SHIPPED' | 'DELIVERED' | 'COMPLETED' = 'SHIPPED';
  let statusText = '에스크로 안전결제 완료 (배송준비중)';
  if (statusStr === 'COMPLETED') {
    status = 'COMPLETED';
    statusText = '구매확정 완료 (정산지급)';
  } else if (statusStr === 'DELIVERED') {
    status = 'DELIVERED';
    statusText = '배송완료 (구매확정 대기)';
  } else if (statusStr === 'PAID_ESCROW' || statusStr === 'SHIPPED') {
    status = 'SHIPPED';
    statusText = raw.trackingNumber ? '배송중' : '안전결제 예치중';
  }

  const product = raw.product || {};
  const imgs = Array.isArray(product.images) ? product.images : [];
  return {
    id: raw.id,
    orderNumber: raw.orderNumber || raw.id,
    title: product.title || raw.title || '모꼬 안전거래 상품',
    sellerName: raw.seller?.nickname || raw.sellerName || '모꼬 판매자',
    price: Number(raw.amount || product.price || 0),
    status,
    statusText,
    paymentType: '에스크로 안전결제',
    image: imgs[0] || '',
    date: raw.createdAt ? String(raw.createdAt).slice(0, 10) : '',
    location: raw.trackingNumber ? '택배 배송' : '안전결제 거래',
    courier: raw.pgProvider || '안전택배',
    trackingNumber: raw.trackingNumber || '',
    selectedOption: '',
    autoConfirmDays: status === 'COMPLETED' ? 0 : 7,
  };
};

export default function MyOrdersScreen({ navigation }: any) {
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [ordersList, setOrdersList] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const list = await fetchMyOrders('buyer');
      setOrdersList(list.map(mapServerOrder));
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredList = ordersList.filter((item) => {
    if (filterTab === 'ALL') return true;
    if (filterTab === 'ACTIVE') return item.status !== 'COMPLETED';
    return item.status === 'COMPLETED';
  });

  const handleTracking = (order: OrderItem) => {
    if (!order.trackingNumber) {
      Alert.alert('배송조회 안내', '직거래 또는 송장 등록 대기 중인 거래건입니다.');
      return;
    }
    Alert.alert(
      '실시간 배송조회',
      `택배사: ${order.courier}\n송장번호: ${order.trackingNumber}\n현재상태: ${order.location}`
    );
  };

  const handleConfirmPurchase = (orderId: string) => {
    Alert.alert(
      '구매확정',
      '물품을 이상 없이 수령하셨습니까?\n구매확정 시 판매자에게 안전정산 대금이 즉시 지급됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '구매확정 완료',
          onPress: async () => {
            try {
              await confirmEscrowOrder(orderId);
              setOrdersList((prev) =>
                prev.map((o) =>
                  o.id === orderId
                    ? { ...o, status: 'COMPLETED', statusText: '구매확정 완료 (정산지급)', autoConfirmDays: 0 }
                    : o
                )
              );
              Alert.alert('확정 완료', '구매확정이 완료되었습니다. 이용해 주셔서 감사합니다.');
            } catch (e: any) {
              Alert.alert('구매확정 실패', e?.message || '잠시 후 다시 시도해주세요.');
            }
          },
        },
      ]
    );
  };

  const handleClaim = (order: OrderItem) => {
    Alert.alert(
      '반품 / 교환 접수',
      `주문번호: ${order.orderNumber}\n반품/교환 사유를 선택하시면 에스크로 정산이 일시보류되며 고객센터에서 지원해 드립니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '고객센터 연결',
          onPress: () => navigation.navigate('CustomerCenter'),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: OrderItem }) => {
    const thumbUri = resolveMobileImageUrl(item.image);
    const isCompleted = item.status === 'COMPLETED';

    return (
      <View style={styles.card}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <View
            style={[
              styles.statusBadge,
              item.status === 'SHIPPED' && styles.statusBadgeShipped,
              item.status === 'DELIVERED' && styles.statusBadgeDelivered,
              item.status === 'COMPLETED' && styles.statusBadgeCompleted,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                item.status === 'SHIPPED' && styles.statusTextShipped,
                item.status === 'DELIVERED' && styles.statusTextDelivered,
                item.status === 'COMPLETED' && styles.statusTextCompleted,
              ]}
            >
              {item.statusText}
            </Text>
          </View>
        </View>

        <View style={styles.orderBody}>
          <Image source={{ uri: thumbUri }} style={styles.orderThumb} resizeMode="cover" />
          <View style={styles.orderInfo}>
            <Text style={styles.orderTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {item.selectedOption ? (
              <Text style={styles.orderOption}>선택: {item.selectedOption}</Text>
            ) : null}
            <Text style={styles.orderPrice}>{item.price.toLocaleString()}원</Text>
            <Text style={styles.sellerName}>판매자: {item.sellerName}</Text>
          </View>
        </View>

        {item.autoConfirmDays > 0 ? (
          <View style={styles.autoConfirmNotice}>
            <Ionicons name="time-outline" size={13} color="#D97706" />
            <Text style={styles.autoConfirmText}>
              배송완료 {item.autoConfirmDays}일 후 판매자 자동 정산 (D-{item.autoConfirmDays})
            </Text>
          </View>
        ) : null}

        {/* 액션 버튼 바 */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtnOutline}
            onPress={() => handleTracking(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="bus-outline" size={14} color={tokens.colors.textSecondary} />
            <Text style={styles.actionBtnOutlineText}>배송조회</Text>
          </TouchableOpacity>

          {!isCompleted ? (
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => handleConfirmPurchase(item.id)}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={14} color="#FFFFFF" />
              <Text style={styles.actionBtnPrimaryText}>구매확정</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.actionBtnOutline}
            onPress={() => handleClaim(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnOutlineText}>반품/교환</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnChat}
            onPress={() =>
              navigation.navigate('Chats', {
                screen: 'ChatsMain',
              })
            }
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubbles-outline" size={14} color={tokens.colors.primary} />
            <Text style={styles.actionBtnChatText}>대화</Text>
          </TouchableOpacity>
        </View>
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
        <Text style={styles.headerTitle}>구매 및 예약내역</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* 서브 탭 바 */}
      <View style={styles.tabBar}>
        {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((tab) => {
          const label = tab === 'ALL' ? '전체' : tab === 'ACTIVE' ? '진행중' : '완료내역';
          const isActive = filterTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setFilterTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabItemText, isActive && styles.tabItemTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 목록 */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadOrders();
              }}
              tintColor={tokens.colors.primary}
            />
          }
          ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="receipt-outline" size={36} color={tokens.colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>구매 및 예약 내역이 없습니다.</Text>
            <Text style={styles.emptyDesc}>모꼬에서 안전결제로 안심하고 쇼핑을 즐겨보세요!</Text>
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
      )}
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
    fontSize: 17,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: tokens.colors.primary,
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: tokens.colors.textSecondary,
  },
  tabItemTextActive: {
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  listContent: {
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    ...tokens.shadows.soft,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: tokens.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
    marginBottom: tokens.spacing.sm,
  },
  orderNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: tokens.radius.xs,
    backgroundColor: tokens.colors.surfaceSecondary,
  },
  statusBadgeShipped: {
    backgroundColor: '#EFF6FF',
  },
  statusBadgeDelivered: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgeCompleted: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextShipped: {
    color: '#2563EB',
  },
  statusTextDelivered: {
    color: '#059669',
  },
  statusTextCompleted: {
    color: tokens.colors.textTertiary,
  },
  orderBody: {
    flexDirection: 'row',
    marginBottom: tokens.spacing.sm,
  },
  orderThumb: {
    width: 76,
    height: 76,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surfaceSecondary,
  },
  orderInfo: {
    flex: 1,
    marginLeft: tokens.spacing.md,
    justifyContent: 'center',
  },
  orderTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.textPrimary,
    lineHeight: 18,
    marginBottom: 2,
  },
  orderOption: {
    fontSize: 11,
    color: tokens.colors.textTertiary,
    marginBottom: 4,
  },
  orderPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: 2,
  },
  sellerName: {
    fontSize: 11,
    color: tokens.colors.textTertiary,
  },
  autoConfirmNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: tokens.radius.xs,
    marginBottom: tokens.spacing.sm,
  },
  autoConfirmText: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: tokens.spacing.xs,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    gap: 3,
  },
  actionBtnOutlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.colors.primary,
    gap: 3,
  },
  actionBtnPrimaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionBtnChat: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.colors.surfaceSecondary,
    gap: 3,
  },
  actionBtnChatText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.primary,
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
    backgroundColor: tokens.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.xs,
  },
  emptyDesc: {
    fontSize: 13,
    color: tokens.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: tokens.spacing.lg,
  },
  exploreBtn: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: 12,
    borderRadius: tokens.radius.full,
    ...tokens.shadows.soft,
  },
  exploreBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
