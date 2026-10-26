import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MarketProduct } from '../../services/marketService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LiveProductPinCardProps {
  product: MarketProduct | null;
  onPressBuy: (product: MarketProduct) => void;
  onClose?: () => void;
}

export default function LiveProductPinCard({
  product,
  onPressBuy,
  onClose,
}: LiveProductPinCardProps) {
  if (!product) return null;

  const isAffiliate = Boolean(
    (product as any).isAffiliate ||
    (product.type as string) === 'AFFILIATE' ||
    (product as any).affiliateCommissionRate
  );
  const isNormal = (product.type as string) === 'B2C_NORMAL';
  const isGroup = product.type === 'B2C_GROUP';
  const discountRate =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;
  const progressPercent = product.targetQuantity
    ? Math.min(100, Math.round(((product.currentQuantity || 0) / product.targetQuantity) * 100))
    : 80;

  const thumb =
    product.images?.[0] ||
    'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300';
  const merchantLabel =
    product.seller?.nickname || (product as any).merchantName || (isAffiliate ? '제휴 공식사' : '인증 입점사');

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Left: Thumbnail & Live Pin Tag */}
        <View style={styles.thumbWrap}>
          <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" />
          <View style={styles.pinTag}>
            <Ionicons name="pin" size={10} color="#FFFFFF" />
            <Text style={styles.pinTagText}>소개중</Text>
          </View>
        </View>

        {/* Center: Info */}
        <View style={styles.infoWrap}>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.badge,
                isAffiliate
                  ? styles.badgeAffiliate
                  : isNormal
                  ? styles.badgeMerchant
                  : isGroup
                  ? styles.badgeB2C
                  : styles.badgeC2C,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  isAffiliate
                    ? styles.badgeTextAffiliate
                    : isNormal
                    ? styles.badgeTextMerchant
                    : isGroup
                    ? styles.badgeTextB2C
                    : styles.badgeTextC2C,
                ]}
              >
                {isAffiliate
                  ? '🎙️ 스트리머 추천 특가'
                  : isNormal
                  ? '🛍️ 브랜드 특가'
                  : isGroup
                  ? '특가공구'
                  : '중고매물'}
              </Text>
            </View>
            <Text style={styles.sellerName} numberOfLines={1}>
              {merchantLabel}
            </Text>
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {product.title}
          </Text>

          <View style={styles.priceRow}>
            {discountRate ? (
              <Text style={styles.discount}>{discountRate}%</Text>
            ) : null}
            <Text style={styles.price}>{product.price.toLocaleString()}원</Text>
            {product.originalPrice && product.originalPrice > product.price ? (
              <Text style={styles.originalPrice}>
                {product.originalPrice.toLocaleString()}원
              </Text>
            ) : null}
          </View>

          {/* Progress bar for group buy */}
          {isGroup && (
            <View style={styles.progressWrap}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.progressText}>{progressPercent}% 달성</Text>
            </View>
          )}

          {/* Tag for normal merchant product */}
          {isNormal && (
            <View style={styles.escrowNoticeRow}>
              <Ionicons name="shield-checkmark" size={11} color="#059669" />
              <Text style={styles.escrowNoticeText}>토스페이먼츠 에스크로 원화 안전결제</Text>
            </View>
          )}
        </View>

        {/* Right: Buy Button */}
        <TouchableOpacity
          style={styles.buyButton}
          activeOpacity={0.88}
          onPress={() => onPressBuy(product)}
        >
          <LinearGradient
            colors={isNormal ? ['#4F46E5', '#6366F1'] : ['#FF3B6B', '#E11D48']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buyGradient}
          >
            <Ionicons name="card" size={13} color="#FFFFFF" style={{ marginRight: 2 }} />
            <Text style={styles.buyText}>지금 구매</Text>
          </LinearGradient>
        </TouchableOpacity>

        {onClose && (
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={6}>
            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 10,
    gap: 10,
    position: 'relative',
  },
  thumbWrap: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#334155',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  pinTag: {
    position: 'absolute',
    top: 3,
    left: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pinTagText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  infoWrap: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeAffiliate: {
    backgroundColor: '#FF6B6B',
    borderWidth: 1,
    borderColor: '#FA5252',
  },
  badgeMerchant: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  badgeB2C: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  badgeC2C: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  badgeTextAffiliate: {
    color: '#FFFFFF',
  },
  badgeTextMerchant: {
    color: '#FF3B6B',
  },
  badgeTextB2C: {
    color: '#F87171',
  },
  badgeTextC2C: {
    color: '#A5B4FC',
  },
  sellerName: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  discount: {
    color: '#FF3B6B',
    fontSize: 12,
    fontWeight: '900',
  },
  price: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  originalPrice: {
    color: '#64748B',
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  progressBarBg: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF3B6B',
  },
  progressText: {
    color: '#F87171',
    fontSize: 9,
    fontWeight: '700',
  },
  escrowNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  escrowNoticeText: {
    fontSize: 9,
    color: '#10B981',
    fontWeight: '700',
  },
  buyButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  buyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  buyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  closeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});
