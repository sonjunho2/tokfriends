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
import { MarketProduct } from '../../services/marketService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LiveCommercePinOverlayProps {
  product: MarketProduct | null;
  onPress: (product: MarketProduct) => void;
  onClose?: () => void;
}

export default function LiveCommercePinOverlay({
  product,
  onPress,
  onClose,
}: LiveCommercePinOverlayProps) {
  if (!product) return null;

  const discountRate =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100
        )
      : null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => onPress(product)}
      >
        <Image
          source={{
            uri:
              product.images?.[0] ||
              'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300',
          }}
          style={styles.thumb}
        />

        <View style={styles.infoCol}>
          <View style={styles.badgeRow}>
            <View style={styles.liveDealBadge}>
              <Text style={styles.liveDealText}>방송특가</Text>
            </View>
            <View style={styles.escrowBadge}>
              <Ionicons name="shield-checkmark" size={10} color="#10B981" />
              <Text style={styles.escrowText}>안전결제</Text>
            </View>
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {product.title}
          </Text>

          <View style={styles.priceRow}>
            {discountRate ? (
              <Text style={styles.discountRate}>{discountRate}%</Text>
            ) : null}
            <Text style={styles.priceText}>
              {product.price.toLocaleString()} ON
            </Text>
            {product.originalPrice ? (
              <Text style={styles.originalPrice}>
                {product.originalPrice.toLocaleString()}원
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.buyBtnWrap}>
          <TouchableOpacity
            style={styles.buyBtn}
            activeOpacity={0.85}
            onPress={() => onPress(product)}
          >
            <Text style={styles.buyBtnText}>구매</Text>
          </TouchableOpacity>
        </View>

        {onClose ? (
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={6}
          >
            <Ionicons name="close" size={14} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 84,
    left: 14,
    right: 14,
    zIndex: 200,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#334155',
  },
  infoCol: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  liveDealBadge: {
    backgroundColor: '#FF3B6B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveDealText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  escrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  escrowText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '700',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  discountRate: {
    color: '#FF3B6B',
    fontSize: 13,
    fontWeight: '900',
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  originalPrice: {
    color: '#94A3B8',
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  buyBtnWrap: {
    justifyContent: 'center',
    paddingRight: 4,
  },
  buyBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  closeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: 4,
  },
});
