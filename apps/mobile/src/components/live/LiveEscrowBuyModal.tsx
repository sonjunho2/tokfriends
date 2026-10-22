import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketProduct } from '../../services/marketService';

interface LiveEscrowBuyModalProps {
  visible: boolean;
  product: MarketProduct | null;
  userBalance?: number;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export default function LiveEscrowBuyModal({
  visible,
  product,
  userBalance = 50000,
  onClose,
  onSuccess,
}: LiveEscrowBuyModalProps) {
  const [address, setAddress] = useState('서울특별시 강남구 테헤란로 152 강남파이낸스센터 12층');
  const [submitting, setSubmitting] = useState(false);

  if (!product) return null;

  const isBalanceEnough = userBalance >= product.price;

  const handleConfirmPurchase = async () => {
    if (!isBalanceEnough) {
      Alert.alert(
        '포인트 부족',
        `보유 포인트(${userBalance.toLocaleString()} ON)가 상품 금액(${product.price.toLocaleString()} ON)보다 부족합니다. 충전 후 다시 이용해주세요.`
      );
      return;
    }

    if (!address.trim()) {
      Alert.alert('배송지 입력', '배송받으실 주소를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      // 실시간 에스크로 주문 생성 시뮬레이션
      await new Promise((r) => setTimeout(r, 800));
      const orderId = `ORD-LIVE-${Date.now().toString().slice(-6)}`;
      Alert.alert(
        '🎉 주문 및 결제 완료',
        `방송 특가 주문이 정상 접수되었습니다!\n\n주문번호: ${orderId}\n결제금액: ${product.price.toLocaleString()} ON\n구매확정 시까지 안전하게 에스크로에 보관됩니다.`,
        [
          {
            text: '확인',
            onPress: () => {
              onSuccess(orderId);
              onClose();
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('오류', '주문 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.outside} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          <View style={styles.handleBar} />

          {/* 모달 헤더 */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="shield-checkmark" size={18} color="#10B981" />
              <Text style={styles.headerTitle}>라이브 에스크로 1초 안전결제</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* 상품 정보 카드 */}
            <View style={styles.productCard}>
              <Image
                source={{
                  uri:
                    product.images?.[0] ||
                    'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300',
                }}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <View style={styles.badgeRow}>
                  <Text style={styles.liveSpecialBadge}>LIVE 특가</Text>
                  <Text style={styles.sellerName}>판매자: {product.seller.nickname}</Text>
                </View>
                <Text style={styles.productTitle} numberOfLines={2}>
                  {product.title}
                </Text>
                <Text style={styles.productPrice}>
                  {product.price.toLocaleString()} ON{' '}
                  <Text style={styles.wonUnit}>({product.price.toLocaleString()}원)</Text>
                </Text>
              </View>
            </View>

            {/* 에스크로 보호 안내 배너 */}
            <View style={styles.escrowBanner}>
              <Ionicons name="lock-closed" size={16} color="#4F46E5" />
              <Text style={styles.escrowBannerText}>
                결제된 온(ON) 포인트는 수령 후 구매확정 전까지 안전하게 보관됩니다.
              </Text>
            </View>

            {/* 배송지 정보 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>배송지 주소</Text>
              <TextInput
                style={styles.textInput}
                value={address}
                onChangeText={setAddress}
                placeholder="상세 주소를 입력하세요"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* 결제 금액 및 잔액 비교 */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>보유 포인트 잔액</Text>
                <Text style={styles.summaryVal}>{userBalance.toLocaleString()} ON</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>차감 예정 포인트</Text>
                <Text style={styles.summaryValRed}>- {product.price.toLocaleString()} ON</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                <Text style={styles.summaryTotalLabel}>결제 후 예상 잔액</Text>
                <Text
                  style={[
                    styles.summaryTotalVal,
                    { color: isBalanceEnough ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {(userBalance - product.price).toLocaleString()} ON
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* 결제 버튼 */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!isBalanceEnough || submitting) && styles.submitBtnDisabled,
              ]}
              onPress={handleConfirmPurchase}
              disabled={!isBalanceEnough || submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isBalanceEnough
                    ? `${product.price.toLocaleString()} ON 결제하기`
                    : '포인트 충전 필요'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  outside: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  productImage: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  liveSpecialBadge: {
    backgroundColor: '#FF3B6B',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sellerName: {
    fontSize: 11,
    color: '#64748B',
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 18,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4F46E5',
  },
  wonUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
  },
  escrowBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: 16,
  },
  escrowBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#4338CA',
    lineHeight: 16,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  summaryValRed: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginBottom: 0,
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryTotalVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
