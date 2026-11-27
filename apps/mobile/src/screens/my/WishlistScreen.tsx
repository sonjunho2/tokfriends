// apps/mobile/src/screens/my/WishlistScreen.tsx
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
import { fetchWishlist, toggleWishlistServer, resolveMobileImageUrl } from '../../services/marketService';

export default function WishlistScreen({ navigation }: any) {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWishlist = useCallback(async () => {
    try {
      const items = await fetchWishlist();
      setWishlist(items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleRemoveItem = (item: any) => {
    Alert.alert('관심 상품 해제', '관심목록에서 제거하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '제거',
        style: 'destructive',
        onPress: async () => {
          setWishlist((prev) => prev.filter((p) => p.id !== item.id));
          try {
            await toggleWishlistServer(item.id, item.productType || 'MARKET_PRODUCT');
          } catch {}
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const rawImg = Array.isArray(item.images) && item.images.length > 0
      ? item.images[0]
      : typeof item.images === 'string'
      ? (item.images.startsWith('[') ? (JSON.parse(item.images)?.[0] || item.images) : item.images)
      : item.image;
    const thumbUri = resolveMobileImageUrl(rawImg);
    const isNormal = item.productType === 'NORMAL_PRODUCT';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() =>
          navigation.navigate('Market', {
            screen: 'ProductDetail',
            params: { productId: item.id, isNormalProduct: isNormal },
          })
        }
      >
        <Image source={{ uri: thumbUri }} style={styles.cardThumb} resizeMode="cover" />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.cardPrice}>{Number(item.price || 0).toLocaleString()}원</Text>
          <View style={styles.cardMetaRow}>
            <Ionicons name="location-outline" size={12} color={tokens.colors.textTertiary} />
            <Text style={styles.cardLocation}>{item.locationName || item.region || '전국 택배배송'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleRemoveItem(item)}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color={tokens.colors.textTertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>관심목록</Text>
        <View style={styles.headerRightBadge}>
          <Text style={styles.headerRightText}>{wishlist.length}개</Text>
        </View>
      </View>

      {/* 목록 */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadWishlist();
              }}
              tintColor={tokens.colors.primary}
            />
          }
          ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="heart-dislike-outline" size={36} color={tokens.colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>관심목록이 비어 있습니다.</Text>
            <Text style={styles.emptyDesc}>마음에 드는 상품의 하트를 눌러 관심목록에 담아보세요!</Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Market', { screen: 'MarketMain' })}
            >
              <Text style={styles.exploreBtnText}>모꼬마켓 둘러보기</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
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
  headerRightBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: tokens.colors.surfaceSecondary,
    borderRadius: tokens.radius.full,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  headerRightText: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  listContent: {
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.sm,
    ...tokens.shadows.soft,
  },
  cardThumb: {
    width: 76,
    height: 76,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surfaceSecondary,
  },
  cardBody: {
    flex: 1,
    marginLeft: tokens.spacing.md,
    justifyContent: 'center',
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
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardLocation: {
    fontSize: 11,
    color: tokens.colors.textTertiary,
  },
  deleteBtn: {
    padding: tokens.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
