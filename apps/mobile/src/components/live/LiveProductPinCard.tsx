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

  const isB2C = product.type === 'B2C_GROUP';
  const discountRate =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;
  const progressPercent = product.targetQuantity
    ? Math.min(100, Math.round(((product.currentQuantity || 0) / product.targetQuantity) * 100))
    : 80;

  const thumb = product.images?.[0] || 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300';

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
            <View style={[styles.badge, isB2C ? styles.badgeB2C : styles.badgeC2C]}>
              <Text style={[styles.badgeText, isB2C ? styles.badgeTextB2C : styles.badgeTextC2C]}>
                {isB2C ? '특가공구' : '중고매물'}
              </Text>
            </View>
            <Text style={styles.sellerName} numberOfLines={1}>
              {product.seller?.nickname || '판매자'}
            </Text>
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {product.title}
          </Text>

          <View style={styles.priceRow}>
            {discountRate && <Text style={styles.discount}>{discountRate}%</Text>}
            <Text style={styles.price}>{product.price.toLocaleString()}원</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>{product.originalPrice.toLocaleString()}원</Text>
            )}
          </View>

          {/* Progress bar for group buy */}
          {isB2C && (
            <View style={styles.progressWrap}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.progressText}>{progressPercent}% 달성</Text>
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
            colors={['#FF3B6B', '#E11D48']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buyGradient}
          >
            <Ionicons name="card" size={14} color="#FFFFFF" style={{ marginRight: 2 }} />
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
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 107, 0.4)',
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#334155',
  },
  pinTag: {
    position: 'absolute',
    top: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255, 59, 107, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pinTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  infoWrap: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
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
  badgeB2C: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  badgeC2C: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  badgeTextB2C: {
    color: '#F87171',
  },
  badgeTextC2C: {
    color: '#A5B4FC',
  },
  sellerName: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  discount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FF3B6B',
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  originalPrice: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
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
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF3B6B',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 9,
    color: '#FF3B6B',
    fontWeight: '800',
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
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    marginLeft: 6,
    padding: 2,
  },
});
