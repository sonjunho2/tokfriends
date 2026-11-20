// apps/mobile/src/screens/my/MyOrdersScreen.tsx
import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import { resolveMobileImageUrl } from '../../services/marketService';

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

export default function MyOrdersScreen({ navigation }: any) {
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  const [ordersList, setOrdersList] = useState<OrderItem[]>([
    {
      id: 'ord-safe-01',
      orderNumber: 'ORD-20261104-5892',
      title: '소니 WH-1000XM5 노이즈캔슬링 무선 헤드폰',
      sellerName: '(주)사운드코리아 공식수입원',
      price: 320000,
      status: 'SHIPPED',
      statusText: '배송중 (내일 도착 예정)',
      paymentType: '에스크로 안전결제',
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400',
      date: '2026.11.04',
      location: '택배 이동중',
      courier: 'CJ대한통운',
      trackingNumber: '5892-0192-4411',
      selectedOption: '실버 / 무상보증 1년',
      autoConfirmDays: 5,
    },
    {
      id: 'ord-safe-02',
      orderNumber: 'ORD-20261103-1024',
      title: '[입점사특가] 제주 산지직송 프리미엄 1등급 흑돼지 오겹살 1kg',
      sellerName: '제주푸드 본사 직영',
      price: 32900,
      status: 'DELIVERED',
      statusText: '배송완료 (구매확정 대기)',
      paymentType: '안전결제 택배배송',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
      date: '2026.11.03',
      location: '문 앞 배송완료',
      courier: '우체국택배',
      trackingNumber: '6891-2200-9182',
      selectedOption: '오겹살 1kg (+14,000원)',
      autoConfirmDays: 3,
    },
    {
      id: 'ord-safe-03',
      orderNumber: 'ORD-20261028-7712',
      title: '아이폰 15 프로 256GB 내추럴 티타늄',
      sellerName: '테크러버',
      price: 980000,
      status: 'COMPLETED',
      statusText: '구매확정 완료 (정산지급)',
      paymentType: '에스크로 안전직거래',
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400',
      date: '2026.10.28',
      location: '직거래 완료',
      courier: '',
      trackingNumber: '',
      selectedOption: '단말기 본체 풀박스',
      autoConfirmDays: 0,
    },
  ]);

  const filteredList = ordersList.filter((item) => {
    if (filterTab === 'ALL') return true;
    if (filterTab === 'ACTIVE') return item.status !== 'COMPLETED';
    return item.status === 'COMPLETED';
  });

  const handleTracking = (order: OrderItem) => {
    if (!order.trackingNumber) {
      Alert.alert('배송조회 안내', '직거래 거래건으로 택배 송장 정보가 없습니다.');
      return;
    }
    Alert.alert(
      '실시간 배송조회',
      `택배사: ${order.courier}\n송장번호: ${order.trackingNumber}\n현재위치: ${order.location}`
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
          onPress: () => {
            setOrdersList((prev) =>
              prev.map((o) =>
                o.id === orderId
                  ? { ...o, status: 'COMPLETED', statusText: '구매확정 완료 (정산지급)', autoConfirmDays: 0 }
                  : o
              )
            );
            Alert.alert('확정 완료', '구매확정이 완료되었습니다. 이용해 주셔서 감사합니다!');
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
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.textSecondary,
  },
  tabItemTextActive: {
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.primary,
  },
  listContent: {
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    ...tokens.shadows.sm,
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
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: tokens.borderRadius.xs,
    backgroundColor: tokens.colors.surfaceAlt,
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
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
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
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.surfaceAlt,
  },
  orderInfo: {
    flex: 1,
    marginLeft: tokens.spacing.md,
    justifyContent: 'center',
  },
  orderTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.textPrimary,
    lineHeight: 18,
    marginBottom: 2,
  },
  orderOption: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.textTertiary,
    marginBottom: 4,
  },
  orderPrice: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.textPrimary,
    marginBottom: 2,
  },
  sellerName: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.textTertiary,
  },
  autoConfirmNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: tokens.borderRadius.xs,
    marginBottom: tokens.spacing.sm,
  },
  autoConfirmText: {
    fontSize: tokens.typography.fontSize.xs,
    color: '#B45309',
    fontWeight: tokens.typography.fontWeight.medium,
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
    borderRadius: tokens.borderRadius.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    gap: 3,
  },
  actionBtnOutlineText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.textSecondary,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.primary,
    gap: 3,
  },
  actionBtnPrimaryText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  actionBtnChat: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.surfaceAlt,
    gap: 3,
  },
  actionBtnChatText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
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
});
