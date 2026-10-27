// apps/mobile/src/screens/my/PointChargeScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';

const POINT_PACKAGES = [
  {
    id: 'pkg-1000',
    points: 1000,
    bonus: 0,
    price: 1100,
    badge: null,
  },
  {
    id: 'pkg-3000',
    points: 3000,
    bonus: 0,
    price: 3300,
    badge: null,
  },
  {
    id: 'pkg-5000',
    points: 5000,
    bonus: 250,
    price: 5500,
    badge: '인기',
  },
  {
    id: 'pkg-10000',
    points: 10000,
    bonus: 1000,
    price: 11000,
    badge: 'HOT 추천',
  },
  {
    id: 'pkg-30000',
    points: 30000,
    bonus: 3500,
    price: 33000,
    badge: '혜택 +11%',
  },
  {
    id: 'pkg-50000',
    points: 50000,
    bonus: 7000,
    price: 55000,
    badge: '혜택 +14%',
  },
  {
    id: 'pkg-100000',
    points: 100000,
    bonus: 18000,
    price: 110000,
    badge: 'VIP 최대혜택',
  },
];

const PAYMENT_METHODS = [
  { id: 'kakaopay', name: '카카오페이', icon: 'chatbubble-ellipses', color: '#FEE500' },
  { id: 'naverpay', name: '네이버페이', icon: 'logo-tableau', color: '#03C75A' },
  { id: 'card', name: '신용/체크카드', icon: 'card-outline', color: '#3B82F6' },
  { id: 'toss', name: '토스페이', icon: 'flash', color: '#0064FF' },
  { id: 'phone', name: '휴대폰 결제', icon: 'phone-portrait-outline', color: '#6B7280' },
];

export default function PointChargeScreen({ navigation }) {
  const { user, refreshMe, updateUserProfile } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState(POINT_PACKAGES[3]); // 10,000 P 기본 선택
  const [paymentMethod, setPaymentMethod] = useState('kakaopay');
  const [loading, setLoading] = useState(false);

  const currentPoints = user?.profile?.points ?? user?.points ?? 4020;

  const totalPoints = selectedPackage.points + selectedPackage.bonus;

  const handleCharge = async () => {
    Alert.alert(
      '모꼬 포인트 충전',
      `선택 상품: ${selectedPackage.points.toLocaleString()} P ${
        selectedPackage.bonus > 0 ? `(+보너스 ${selectedPackage.bonus.toLocaleString()} P)` : ''
      }\n결제 금액: ${selectedPackage.price.toLocaleString()}원 (VAT 포함)\n결제 수단: ${
        PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.name
      }\n\n정말로 결제를 진행하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '결제하기',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await apiClient.confirmPurchase({
                productId: selectedPackage.id,
                points: totalPoints,
                amount: selectedPackage.price,
                paymentMethod: PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.name || '간편결제',
              });

              // 유저 프로필 로컬/서버 동기화
              const nextPoints = currentPoints + totalPoints;
              if (updateUserProfile) {
                updateUserProfile({ points: nextPoints });
              }
              if (refreshMe) {
                await refreshMe();
              }

              Alert.alert(
                '🎉 충전 완료',
                `${totalPoints.toLocaleString()} P가 정상적으로 충전되었습니다!\n현재 보유 포인트: ${nextPoints.toLocaleString()} P\n라이브 방송 후원 및 1:1 대화에서 자유롭게 사용해보세요.`,
                [
                  {
                    text: '확인',
                    onPress: () => navigation.goBack(),
                  },
                ],
              );
            } catch (err) {
              Alert.alert('충전 실패', err?.message || '결제 진행 중 오류가 발생했습니다.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#191919" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>모꼬 포인트 충전</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.coinIcon}>🟡</Text>
              <Text style={styles.balanceCardTitle}>현재 보유 포인트</Text>
            </View>
            <View style={styles.balanceUsageBadge}>
              <Text style={styles.balanceUsageBadgeText}>라이브 후원 · 1:1 대화용</Text>
            </View>
          </View>
          <Text style={styles.balanceNumber}>
            {currentPoints.toLocaleString()} <Text style={styles.balanceUnit}>P</Text>
          </Text>
          <Text style={styles.balanceSubtext}>
            모꼬 포인트는 유효기간 없이 라이브 후원, 통화, 대화 신청에 즉시 사용 가능합니다.
          </Text>
        </View>

        {/* Free Rewards Quick Banner */}
        <TouchableOpacity
          style={styles.freeRewardBanner}
          activeOpacity={0.85}
          onPress={async () => {
            try {
              const res = await apiClient.claimAdReward();
              if (res?.ok || res?.success) {
                const nextPoints = currentPoints + 10;
                if (updateUserProfile) updateUserProfile({ points: nextPoints });
                if (refreshMe) refreshMe();
                Alert.alert('🎬 무료 포인트 적립 완료', '+10 P가 즉시 적립되었습니다!');
              } else {
                Alert.alert('알림', res?.message || '오늘 시청 가능한 무료 광고를 모두 완료했습니다.');
              }
            } catch (e) {
              Alert.alert('알림', e?.message || '광고 시청 후 10 P가 적립됩니다.');
            }
          }}
        >
          <View style={styles.freeRewardLeft}>
            <Text style={{ fontSize: 24 }}>🎬</Text>
            <View style={{ gap: 2 }}>
              <Text style={styles.freeRewardTitle}>무료 충전소 (+10 P 즉시 적립)</Text>
              <Text style={styles.freeRewardSubtitle}>광고 시청 완료 시 10 P 무료 제공 (오늘 잔여: 5회)</Text>
            </View>
          </View>
          <View style={styles.freeRewardBtn}>
            <Text style={styles.freeRewardBtnText}>받기</Text>
          </View>
        </TouchableOpacity>

        {/* Package Selector */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>충전 포인트 선택</Text>
          <Text style={styles.sectionCaption}>VAT(부가가치세) 포함</Text>
        </View>

        <View style={styles.packagesList}>
          {POINT_PACKAGES.map((pkg) => {
            const isSelected = selectedPackage.id === pkg.id;
            return (
              <TouchableOpacity
                key={pkg.id}
                style={[styles.packageCard, isSelected && styles.packageCardSelected]}
                onPress={() => setSelectedPackage(pkg)}
                activeOpacity={0.8}
              >
                <View style={styles.packageLeft}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.packagePoints}>
                      {pkg.points.toLocaleString()} <Text style={{ fontSize: 14 }}>P</Text>
                    </Text>
                    {pkg.bonus > 0 && (
                      <View style={styles.bonusBadge}>
                        <Text style={styles.bonusBadgeText}>+{pkg.bonus.toLocaleString()} P 추가</Text>
                      </View>
                    )}
                  </View>
                  {pkg.badge && (
                    <Text style={[styles.packageTag, isSelected && styles.packageTagSelected]}>
                      ★ {pkg.badge}
                    </Text>
                  )}
                </View>

                <View style={styles.packageRight}>
                  <Text style={[styles.packagePrice, isSelected && styles.packagePriceSelected]}>
                    {pkg.price.toLocaleString()}원
                  </Text>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Payment Methods */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>결제 수단</Text>
        </View>

        <View style={styles.paymentMethodsRow}>
          {PAYMENT_METHODS.map((pm) => {
            const isSelected = paymentMethod === pm.id;
            return (
              <TouchableOpacity
                key={pm.id}
                style={[styles.paymentMethodChip, isSelected && styles.paymentMethodChipSelected]}
                onPress={() => setPaymentMethod(pm.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={pm.icon}
                  size={18}
                  color={isSelected ? '#191919' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.paymentMethodName,
                    isSelected && styles.paymentMethodNameSelected,
                  ]}
                >
                  {pm.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notices */}
        <View style={styles.noticeBox}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#6B7280" />
          <Text style={styles.noticeText}>
            충전된 모꼬 포인트는 서비스 내 크리에이터 후원, 1:1 대화, 미디어 통화 시 사용됩니다. 결제 후 미사용 포인트는 7일 이내 고객센터를 통해 환불이 가능합니다.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Floating Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceInfo}>
          <Text style={styles.bottomLabel}>최종 결제 금액</Text>
          <Text style={styles.bottomPrice}>
            {selectedPackage.price.toLocaleString()}{' '}
            <Text style={{ fontSize: 15, fontWeight: '700' }}>원</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.checkoutBtn, loading && styles.checkoutBtnDisabled]}
          onPress={handleCharge}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#191919" />
          ) : (
            <Text style={styles.checkoutBtnText}>
              {totalPoints.toLocaleString()} P 충전하기
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#191919',
    letterSpacing: -0.4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  balanceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coinIcon: {
    fontSize: 16,
  },
  balanceCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  balanceUsageBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  balanceUsageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  balanceNumber: {
    marginTop: 10,
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  balanceUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: '#94A3B8',
  },
  balanceSubtext: {
    marginTop: 8,
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  freeRewardBanner: {
    marginTop: 12,
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  freeRewardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  freeRewardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  freeRewardSubtitle: {
    fontSize: 11,
    color: '#E9D5FF',
  },
  freeRewardBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  freeRewardBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7C3AED',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#191919',
    letterSpacing: -0.3,
  },
  sectionCaption: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  packagesList: {
    gap: 10,
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  packageCardSelected: {
    borderColor: '#FEE500',
    backgroundColor: '#FFFDE7',
  },
  packageLeft: {
    gap: 4,
  },
  packagePoints: {
    fontSize: 18,
    fontWeight: '900',
    color: '#191919',
  },
  bonusBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bonusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  packageTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  packageTagSelected: {
    color: '#B45309',
  },
  packageRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4B5563',
  },
  packagePriceSelected: {
    color: '#191919',
    fontWeight: '900',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#EAB308',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EAB308',
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentMethodChipSelected: {
    borderColor: '#191919',
    backgroundColor: '#F3F4F6',
  },
  paymentMethodName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  paymentMethodNameSelected: {
    fontWeight: '800',
    color: '#191919',
  },
  noticeBox: {
    marginTop: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  noticeText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomPriceInfo: {
    gap: 2,
  },
  bottomLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  bottomPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#191919',
    letterSpacing: -0.4,
  },
  checkoutBtn: {
    height: 48,
    paddingHorizontal: 28,
    backgroundColor: colors.primary || '#FEE500',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnDisabled: {
    opacity: 0.6,
  },
  checkoutBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#191919',
  },
});
