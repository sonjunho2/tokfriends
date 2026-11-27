// apps/mobile/src/screens/my/MySalesScreen.tsx
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

type SaleStatus = 'SELLING' | 'RESERVED' | 'COMPLETED';

interface SaleItem {
  id: string;
  title: string;
  price: number;
  status: SaleStatus;
  statusLabel: string;
  image: string;
  likes: number;
  chats: number;
  createdAt: string;
  region: string;
}

export default function MySalesScreen({ navigation }: any) {
  const [filterTab, setFilterTab] = useState<'ALL' | SaleStatus>('ALL');

  const [salesList, setSalesList] = useState<SaleItem[]>([
    {
      id: 'my-sale-01',
      title: '소니 WH-1000XM5 노이즈캔슬링 헤드폰 실버 풀박스',
      price: 320000,
      status: 'SELLING',
      statusLabel: '판매중',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      likes: 19,
      chats: 7,
      createdAt: '2시간 전',
      region: '역삼1동',
    },
    {
      id: 'my-sale-02',
      title: 'M2 맥북 에어 15인치 16GB 512GB 스페이스그레이',
      price: 1480000,
      status: 'RESERVED',
      statusLabel: '예약중',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
      likes: 35,
      chats: 12,
      createdAt: '어제',
      region: '역삼1동',
    },
    {
      id: 'my-sale-03',
      title: '닌텐도 스위치 OLED 화이트 본체 풀박스',
      price: 290000,
      status: 'COMPLETED',
      statusLabel: '판매완료',
      image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400',
      likes: 27,
      chats: 14,
      createdAt: '3일 전',
      region: '역삼1동',
    },
  ]);

  const filteredList = salesList.filter((item) => {
    if (filterTab === 'ALL') return true;
    return item.status === filterTab;
  });

  const handleChangeStatus = (itemId: string, nextStatus: SaleStatus) => {
    setSalesList((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const label = nextStatus === 'SELLING' ? '판매중' : nextStatus === 'RESERVED' ? '예약중' : '판매완료';
          return { ...item, status: nextStatus, statusLabel: label };
        }
        return item;
      })
    );
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert('판매 상품 삭제', '이 상품을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          setSalesList((prev) => prev.filter((i) => i.id !== itemId));
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: SaleItem }) => {
    const thumbUri = resolveMobileImageUrl(item.image);
    const isSelling = item.status === 'SELLING';
    const isReserved = item.status === 'RESERVED';
    const isCompleted = item.status === 'COMPLETED';

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <Image source={{ uri: thumbUri }} style={styles.cardThumb} resizeMode="cover" />
          <View style={styles.cardInfo}>
            <View style={styles.statusBadgeRow}>
              <View
                style={[
                  styles.statusBadge,
                  isSelling && styles.statusBadgeSelling,
                  isReserved && styles.statusBadgeReserved,
                  isCompleted && styles.statusBadgeCompleted,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isSelling && styles.statusTextSelling,
                    isReserved && styles.statusTextReserved,
                    isCompleted && styles.statusTextCompleted,
                  ]}
                >
                  {item.statusLabel}
                </Text>
              </View>
              <Text style={styles.createdText}>{item.createdAt}</Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.cardPrice}>{item.price.toLocaleString()}원</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="heart-outline" size={12} color={tokens.colors.textTertiary} />
                <Text style={styles.metaText}>{item.likes}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="chatbubble-outline" size={12} color={tokens.colors.textTertiary} />
                <Text style={styles.metaText}>{item.chats}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 상태 변경 및 삭제 액션 버튼 바 */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.statusBtn, isSelling && styles.statusBtnActive]}
            onPress={() => handleChangeStatus(item.id, 'SELLING')}
          >
            <Text style={[styles.statusBtnText, isSelling && styles.statusBtnTextActive]}>
              판매중
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusBtn, isReserved && styles.statusBtnActive]}
            onPress={() => handleChangeStatus(item.id, 'RESERVED')}
          >
            <Text style={[styles.statusBtnText, isReserved && styles.statusBtnTextActive]}>
              예약중
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusBtn, isCompleted && styles.statusBtnActive]}
            onPress={() => handleChangeStatus(item.id, 'COMPLETED')}
          >
            <Text style={[styles.statusBtnText, isCompleted && styles.statusBtnTextActive]}>
              판매완료
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteItem(item.id)}
            hitSlop={6}
          >
            <Ionicons name="trash-outline" size={16} color={tokens.colors.error} />
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
        <Text style={styles.headerTitle}>판매물품 관리</Text>
        <TouchableOpacity
          style={styles.headerAddBtn}
          onPress={() => navigation.navigate('MarketCreate')}
          hitSlop={8}
        >
          <Ionicons name="add" size={20} color={tokens.colors.primary} />
          <Text style={styles.headerAddText}>등록</Text>
        </TouchableOpacity>
      </View>

      {/* 서브 탭 바 */}
      <View style={styles.tabBar}>
        {(['ALL', 'SELLING', 'RESERVED', 'COMPLETED'] as const).map((tab) => {
          const label =
            tab === 'ALL'
              ? '전체'
              : tab === 'SELLING'
              ? '판매중'
              : tab === 'RESERVED'
              ? '예약중'
              : '판매완료';
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

      {/* 리스트 */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="pricetag-outline" size={36} color={tokens.colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>해당 상태의 판매 상품이 없습니다.</Text>
            <Text style={styles.emptyDesc}>안 쓰는 물건을 등록하고 이웃과 따뜻한 거래를 시작해보세요!</Text>
            <TouchableOpacity
              style={styles.createBtn}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('MarketCreate')}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.createBtnText}>판매 상품 등록하기</Text>
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
    fontSize: 17,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerAddText: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.primary,
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
  cardTopRow: {
    flexDirection: 'row',
    marginBottom: tokens.spacing.sm,
  },
  cardThumb: {
    width: 80,
    height: 80,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surfaceSecondary,
  },
  cardInfo: {
    flex: 1,
    marginLeft: tokens.spacing.md,
    justifyContent: 'center',
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: tokens.radius.xs,
    backgroundColor: tokens.colors.surfaceSecondary,
  },
  statusBadgeSelling: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgeReserved: {
    backgroundColor: '#FFFBEB',
  },
  statusBadgeCompleted: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextSelling: {
    color: '#059669',
  },
  statusTextReserved: {
    color: '#D97706',
  },
  statusTextCompleted: {
    color: tokens.colors.textTertiary,
  },
  createdText: {
    fontSize: 11,
    color: tokens.colors.textTertiary,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.textPrimary,
    lineHeight: 18,
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: tokens.colors.textTertiary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: tokens.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtnActive: {
    backgroundColor: tokens.colors.textPrimary,
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  statusBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  deleteBtn: {
    width: 34,
    height: 32,
    borderRadius: tokens.radius.sm,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
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
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: 12,
    borderRadius: tokens.radius.full,
    ...tokens.shadows.soft,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
