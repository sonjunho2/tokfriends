// apps/mobile/src/screens/main/MyPageScreen.js
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { tokens } from '../../theme/tokens';
import { UserAvatar } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';

export default function MyPageScreen({ navigation }) {
  const { user, logout, refreshMe } = useAuth();
  const userProfile = user?.profile ?? {};

  // 프로필 정보
  const nickname = userProfile?.nickname || user?.displayName || '다온이';
  const locationLabel = [user?.region1, user?.region2].filter(Boolean).join(' · ') || '서울 강남구 역삼1동';
  const tagline = userProfile?.headline || userProfile?.bio || '동네 친구들과 따뜻하고 즐거운 소통 나누고 싶어요 ✨';

  // 보유 온(ON) 자산
  const balance = useMemo(() => {
    const p = user?.pointsBalance ?? 1250;
    if (typeof p === 'number') return p;
    const numeric = parseInt(String(p).replace(/\D/g, ''), 10);
    return Number.isFinite(numeric) ? numeric : 1250;
  }, [user]);

  // 소셜 통계 카운터 상태
  const [stats, setStats] = useState({
    visitors: 48,
    followers: 124,
    following: 58,
    friends: 19,
  });

  // 통화 단가 설정 상태 (분당 ON)
  const [callRateModalVisible, setCallRateModalVisible] = useState(false);
  const [currentCallRate, setCurrentCallRate] = useState(1500);

  // 알림 설정 모달 상태
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [chatPush, setChatPush] = useState(true);
  const [livePush, setLivePush] = useState(true);
  const [nightPush, setNightPush] = useState(false);

  // AI 안심 케어 센터 모달 상태
  const [safetyModalVisible, setSafetyModalVisible] = useState(false);

  // 약관/고객센터 모달 상태
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  // 캐시 상태
  const [cacheSize, setCacheSize] = useState('12.4 MB');

  // 화면 진입 시 최신 데이터 로드
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      if (refreshMe) {
        refreshMe().catch(() => {});
      }

      // 저장된 설정 로드
      AsyncStorage.multiGet([
        'dagaon_call_rate',
        'dagaon_chat_push',
        'dagaon_live_push',
        'dagaon_night_push',
      ]).then((pairs) => {
        if (!isMounted) return;
        pairs.forEach(([key, val]) => {
          if (!val) return;
          if (key === 'dagaon_call_rate') setCurrentCallRate(Number(val) || 1500);
          if (key === 'dagaon_chat_push') setChatPush(val === 'true');
          if (key === 'dagaon_live_push') setLivePush(val === 'true');
          if (key === 'dagaon_night_push') setNightPush(val === 'true');
        });
      });

      return () => {
        isMounted = false;
      };
    }, [refreshMe])
  );

  // 통화 단가 저장
  const handleSaveCallRate = useCallback(async (rate) => {
    setCurrentCallRate(rate);
    await AsyncStorage.setItem('dagaon_call_rate', String(rate));
    setCallRateModalVisible(false);
    Alert.alert('설정 완료', `1:1 영상/음성 통화 단가가 분당 ${rate.toLocaleString()} ON으로 변경되었습니다.`);
  }, []);

  // 캐시 정리
  const handleClearCache = useCallback(() => {
    Alert.alert('캐시 정리', '임시 이미지 및 네트워크 캐시를 정리하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '정리하기',
        onPress: () => {
          setCacheSize('0 KB');
          Alert.alert('완료', '임시 캐시가 모두 정리되어 쾌적해졌습니다.');
        },
      },
    ]);
  }, []);

  // 로그아웃
  const handleLogout = useCallback(() => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          if (logout) await logout();
        },
      },
    ]);
  }, [logout]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. 상단 내비 바 */}
      <View style={styles.navBar}>
        <Text style={styles.navTitle}>마이페이지</Text>
        <TouchableOpacity
          style={styles.navIconBtn}
          onPress={() => navigation.navigate('ProfileEdit', { profile: userProfile })}
          activeOpacity={0.8}
        >
          <Ionicons name="settings-outline" size={22} color={tokens.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. 상단 프로필 헤더 카드 */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            {/* 코랄-퍼플 그라데이션 스토리 링 */}
            <LinearGradient
              colors={tokens.colors.gradients.primaryPurple}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.storyRing}
            >
              <View style={styles.storyRingInner}>
                <UserAvatar
                  uri={userProfile?.avatarUri || user?.avatarUrl}
                  name={nickname}
                  size="lg"
                  isOnline={true}
                  onPress={() => navigation.navigate('ProfileEdit', { profile: userProfile })}
                />
              </View>
            </LinearGradient>

            <View style={styles.profileInfoCol}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName} numberOfLines={1}>{nickname}</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={13} color={tokens.colors.primary} />
                  <Text style={styles.verifiedText}>인증회원</Text>
                </View>
              </View>
              <Text style={styles.locationText}>📍 {locationLabel}</Text>
              <Text style={styles.taglineText} numberOfLines={2}>{tagline}</Text>
            </View>

            {/* 우측 [✏️ 프로필 수정] 캡슐 버튼 */}
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => navigation.navigate('ProfileEdit', { profile: userProfile })}
              activeOpacity={0.85}
            >
              <Ionicons name="pencil" size={13} color={tokens.colors.primary} />
              <Text style={styles.editProfileText}>수정</Text>
            </TouchableOpacity>
          </View>

          {/* 프로필 완성도 프로그레스 바 유도 UI */}
          <TouchableOpacity
            style={styles.profileCompletionContainer}
            onPress={() => navigation.navigate('ProfileEdit', { profile: userProfile })}
            activeOpacity={0.88}
          >
            <View style={styles.completionLabelRow}>
              <Text style={styles.completionTitle}>내 프로필 매력도 <Text style={styles.completionHighlight}>65% 📈</Text></Text>
              <Text style={styles.completionHint}>사진 2장 더 등록하면 매칭 확률 3배!</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <LinearGradient
                colors={tokens.colors.gradients.primaryPink || ['#FF3B6B', '#FF758C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: '65%' }]}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* 3. 온(ON) 지갑 카드 (VIP Asset Box - 토스/프리미엄 스타일) */}
        <View style={styles.walletCardWrapper}>
          <LinearGradient
            colors={['#0F172A', '#1E293B', '#334155']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.walletGradient}
          >
            {/* 상단 레이블 & VIP 태그 */}
            <View style={styles.walletTopRow}>
              <View style={styles.walletLabelGroup}>
                <Text style={styles.walletLabel}>내 보유 온 (ON)</Text>
                <View style={styles.vipAssetTag}>
                  <Text style={styles.vipAssetTagText}>👑 VIP 크리에이터</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Shop')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* 잔액 표시 */}
            <View style={styles.balanceRow}>
              <Text style={styles.balanceCoin}>🪙</Text>
              <Text style={styles.balanceValue}>{balance.toLocaleString()}</Text>
              <Text style={styles.balanceUnit}>ON</Text>
            </View>
            <Text style={styles.balanceSubText}>이번 달 리워드 및 선물 적립 +3,450 ON</Text>

            {/* 듀얼 버튼: 충전하기 & 크리에이터 정산/출금 */}
            <View style={styles.walletActionRow}>
              <TouchableOpacity
                style={styles.chargeBtn}
                onPress={() => navigation.navigate('Shop')}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={tokens.colors.gradients.primaryPink || ['#FF3B6B', '#FF758C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.chargeBtnGradient}
                >
                  <Ionicons name="flash" size={15} color="#FFFFFF" />
                  <Text style={styles.chargeBtnText}>충전하기</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settleBtn}
                onPress={() => navigation.navigate('Settlement')}
                activeOpacity={0.85}
              >
                <Ionicons name="wallet-outline" size={15} color="#F8FAFC" />
                <Text style={styles.settleBtnText}>크리에이터 정산/출금</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* 4. 소셜 스탯 카운터 (방문자, 팔로워, 팔로잉, 내 인연) */}
        <View style={styles.socialStatsCard}>
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => navigation.navigate('Visitors')}
            activeOpacity={0.75}
          >
            <Text style={styles.statCount}>{stats.visitors}</Text>
            <Text style={styles.statLabel}>방문자</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statItem}
            onPress={() => navigation.navigate('Follows', { initialTab: 'followers' })}
            activeOpacity={0.75}
          >
            <Text style={styles.statCount}>{stats.followers}</Text>
            <Text style={styles.statLabel}>팔로워</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statItem}
            onPress={() => navigation.navigate('Follows', { initialTab: 'following' })}
            activeOpacity={0.75}
          >
            <Text style={styles.statCount}>{stats.following}</Text>
            <Text style={styles.statLabel}>팔로잉</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statItem}
            onPress={() => navigation.navigate('Friends')}
            activeOpacity={0.75}
          >
            <Text style={styles.statCount}>{stats.friends}</Text>
            <Text style={styles.statLabel}>내 인연</Text>
          </TouchableOpacity>
        </View>

        {/* 5. 그룹형 메뉴 리스트 1: 소셜 & 활동 설정 */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupHeader}>소셜 & 크리에이터 설정</Text>
          <View style={styles.menuContainer}>
            {/* 📸 갤러리 관리 */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('ProfileEdit', { profile: userProfile })}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#FFE4E6' }]}>
                <Ionicons name="images" size={18} color="#FF3B6B" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>갤러리 관리 (최대 9장)</Text>
                <Text style={styles.menuDesc}>매칭 및 바텀시트에 노출될 대표 사진</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* 📞 1:1 통화 단가 설정 */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setCallRateModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="call" size={18} color="#10B981" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>1:1 통화 단가 설정</Text>
                <Text style={styles.menuDesc}>현재 분당 {currentCallRate.toLocaleString()} ON 설정됨</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* 🔔 알림 설정 */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setNotifModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="notifications" size={18} color="#3B82F6" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>알림 설정</Text>
                <Text style={styles.menuDesc}>채팅, 실시간 LIVE 및 야간 알림 제어</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. 그룹형 메뉴 리스트 2: 안심 케어 & 지원 */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupHeader}>안심 보호 & 지원</Text>
          <View style={styles.menuContainer}>
            {/* 🛡️ AI 안심 케어 센터 */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setSafetyModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#8B5CF6" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>AI 안심 케어 센터</Text>
                <Text style={styles.menuDesc}>24시간 AI 실시간 클린 필터링 가동 중</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* 🚫 내가 차단한 회원 */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('BlockedUsers')}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="ban" size={18} color="#EF4444" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>내가 차단한 회원 관리</Text>
                <Text style={styles.menuDesc}>차단 목록 및 해제 설정</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* 🧹 캐시 정리 */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={handleClearCache}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#FFEDD5' }]}>
                <Ionicons name="trash-bin" size={18} color="#F97316" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>임시 캐시 및 저장공간 정리</Text>
                <Text style={styles.menuDesc}>{cacheSize}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* 📄 고객센터 & 약관 */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setTermsModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="help-circle" size={18} color="#64748B" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>고객센터 & 약관</Text>
                <Text style={styles.menuDesc}>커뮤니티 가이드라인 및 이용약관</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 7. 하단 로그아웃 */}
        <View style={styles.footerSection}>
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>다가온 v1.2.0 • Expo SDK 57</Text>
        </View>
      </ScrollView>

      {/* =================================================================== */}
      {/* 모달 1: 1:1 통화 단가 설정 */}
      {/* =================================================================== */}
      <Modal
        visible={callRateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCallRateModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.dialogCard}>
            <View style={styles.dialogHeader}>
              <View style={[styles.dialogIconBox, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="call" size={20} color="#10B981" />
              </View>
              <Text style={styles.dialogTitle}>1:1 통화 단가 설정</Text>
              <Text style={styles.dialogSub}>
                상대방이 나와 음성/영상 통화를 요청할 때 분당 차감되어 나에게 적립될 온(ON) 단가를 설정하세요.
              </Text>
            </View>

            <View style={styles.rateOptionsContainer}>
              {[1000, 1500, 2000, 3000].map((rate) => {
                const isSelected = currentCallRate === rate;
                return (
                  <TouchableOpacity
                    key={rate}
                    style={[
                      styles.rateOptionBtn,
                      isSelected ? styles.rateOptionActive : styles.rateOptionInactive,
                    ]}
                    onPress={() => handleSaveCallRate(rate)}
                  >
                    <Text
                      style={[
                        styles.rateOptionText,
                        isSelected ? styles.rateOptionTextActive : styles.rateOptionTextInactive,
                      ]}
                    >
                      분당 {rate.toLocaleString()} ON
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color="#FF3B6B" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.dialogCancelBtn}
              onPress={() => setCallRateModalVisible(false)}
            >
              <Text style={styles.dialogCancelText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* =================================================================== */}
      {/* 모달 2: 알림 설정 */}
      {/* =================================================================== */}
      <Modal
        visible={notifModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotifModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.dialogCard}>
            <View style={styles.dialogHeader}>
              <View style={[styles.dialogIconBox, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="notifications" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.dialogTitle}>알림 수신 설정</Text>
              <Text style={styles.dialogSub}>실시간 소통과 편안한 휴식을 위해 알림을 맞춤 조정하세요.</Text>
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>1:1 대화 알림</Text>
                <Text style={styles.switchSub}>새로운 메시지가 도착했을 때 푸시 알림</Text>
              </View>
              <Switch
                value={chatPush}
                onValueChange={(val) => {
                  setChatPush(val);
                  AsyncStorage.setItem('dagaon_chat_push', String(val));
                }}
                trackColor={{ false: '#CBD5E1', true: tokens.colors.primary }}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>관심 크리에이터 LIVE 알림</Text>
                <Text style={styles.switchSub}>팔로우한 크리에이터가 방송을 시작할 때 알림</Text>
              </View>
              <Switch
                value={livePush}
                onValueChange={(val) => {
                  setLivePush(val);
                  AsyncStorage.setItem('dagaon_live_push', String(val));
                }}
                trackColor={{ false: '#CBD5E1', true: tokens.colors.primary }}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>야간 알림 제한 (22:00 ~ 08:00)</Text>
                <Text style={styles.switchSub}>수면 시간 동안 소리/진동을 차단합니다</Text>
              </View>
              <Switch
                value={nightPush}
                onValueChange={(val) => {
                  setNightPush(val);
                  AsyncStorage.setItem('dagaon_night_push', String(val));
                }}
                trackColor={{ false: '#CBD5E1', true: tokens.colors.primary }}
              />
            </View>

            <TouchableOpacity
              style={styles.dialogCancelBtn}
              onPress={() => setNotifModalVisible(false)}
            >
              <Text style={styles.dialogCancelText}>완료</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* =================================================================== */}
      {/* 모달 3: AI 안심 케어 센터 안내 */}
      {/* =================================================================== */}
      <Modal
        visible={safetyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSafetyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.dialogCard}>
            <View style={styles.dialogHeader}>
              <View style={[styles.dialogIconBox, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="shield-checkmark" size={22} color="#8B5CF6" />
              </View>
              <Text style={styles.dialogTitle}>AI 안심 케어 센터</Text>
              <Text style={styles.dialogSub}>
                회원님의 안전하고 건강한 소통을 위해 24시간 실시간 AI 가디언 시스템이 작동합니다.
              </Text>
            </View>

            <View style={styles.safetyBulletList}>
              <View style={styles.safetyBullet}>
                <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" />
                <Text style={styles.safetyBulletText}>
                  <Text style={{ fontWeight: '700' }}>실시간 비전 AI 채증:</Text> 방송 중 유해 영상이나 불법 콘텐츠 감지 시 즉시 블라인드 및 자동 차단
                </Text>
              </View>
              <View style={styles.safetyBullet}>
                <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" />
                <Text style={styles.safetyBulletText}>
                  <Text style={{ fontWeight: '700' }}>클린 텍스트 필터링:</Text> 비방, 욕설, 금전 요구 등 사기성 메시지 실시간 마스킹
                </Text>
              </View>
              <View style={styles.safetyBullet}>
                <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" />
                <Text style={styles.safetyBulletText}>
                  <Text style={{ fontWeight: '700' }}>철저한 개인정보 보호:</Text> 휴대폰 번호 및 실제 위치는 상대방에게 절대 노출되지 않습니다.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.dialogCancelBtn}
              onPress={() => setSafetyModalVisible(false)}
            >
              <Text style={styles.dialogCancelText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* =================================================================== */}
      {/* 모달 4: 고객센터 & 약관 */}
      {/* =================================================================== */}
      <Modal
        visible={termsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.dialogCard}>
            <View style={styles.dialogHeader}>
              <View style={[styles.dialogIconBox, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="help-circle" size={22} color="#64748B" />
              </View>
              <Text style={styles.dialogTitle}>고객센터 & 이용약관</Text>
              <Text style={styles.dialogSub}>
                다가온 운영팀은 공정하고 투명한 커뮤니티 운영을 위해 최선을 다하고 있습니다.
              </Text>
            </View>

            <View style={styles.termsList}>
              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => Alert.alert('이용약관', '다가온 서비스 이용약관 전문입니다.')}
              >
                <Text style={styles.termsText}>서비스 이용약관</Text>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => Alert.alert('개인정보처리방침', '개인정보 처리방침 전문입니다.')}
              >
                <Text style={styles.termsText}>개인정보 처리방침</Text>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => Alert.alert('커뮤니티 가이드라인', '건전한 소통을 위한 커뮤니티 가이드라인입니다.')}
              >
                <Text style={styles.termsText}>커뮤니티 운영 가이드라인</Text>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => Alert.alert('고객문의', '문의: support@tokfriends.app\n운영시간: 평일 10:00 ~ 18:00')}
              >
                <Text style={styles.termsText}>1:1 고객센터 문의하기</Text>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.dialogCancelBtn}
              onPress={() => setTermsModalVisible(false)}
            >
              <Text style={styles.dialogCancelText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  navBar: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: tokens.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // 프로필 헤더 카드
  profileCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radii.card,
    padding: 16,
    marginBottom: 14,
    ...tokens.shadows.card,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRingInner: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfoCol: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    fontSize: 19,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
    maxWidth: 130,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFF1F4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  locationText: {
    fontSize: 12,
    color: tokens.colors.textSecondary,
    marginTop: 2,
  },
  taglineText: {
    fontSize: 13,
    color: tokens.colors.textPrimary,
    marginTop: 4,
    lineHeight: 18,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF1F4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: tokens.radii.pill,
    alignSelf: 'flex-start',
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  profileCompletionContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.borderLight,
  },
  completionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  completionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  completionHighlight: {
    color: tokens.colors.primary,
  },
  completionHint: {
    fontSize: 11,
    color: tokens.colors.textSecondary,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  // 온(ON) 지갑 카드 (VIP Asset Box)
  walletCardWrapper: {
    borderRadius: tokens.radii.card,
    overflow: 'hidden',
    marginBottom: 14,
    ...tokens.shadows.float,
  },
  walletGradient: {
    padding: 20,
  },
  walletTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  walletLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  vipAssetTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  vipAssetTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FBBF24',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  balanceCoin: {
    fontSize: 22,
  },
  balanceValue: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  balanceUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  balanceSubText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 16,
  },
  walletActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chargeBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  chargeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
  },
  chargeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settleBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  settleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  // 소셜 스탯 카운터
  socialStatsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radii.card,
    paddingVertical: 14,
    marginBottom: 16,
    ...tokens.shadows.card,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statCount: {
    fontSize: 17,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: tokens.colors.textSecondary,
    marginTop: 3,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: tokens.colors.borderLight,
  },
  // 그룹형 메뉴 리스트
  menuGroup: {
    marginBottom: 18,
  },
  groupHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.textSecondary,
    marginBottom: 8,
    paddingLeft: 4,
  },
  menuContainer: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radii.card,
    overflow: 'hidden',
    ...tokens.shadows.card,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextBox: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  menuDesc: {
    fontSize: 12,
    color: tokens.colors.textSecondary,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: tokens.colors.borderLight,
    marginLeft: 64,
  },
  footerSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
  versionText: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  // 모달 공통 스타일
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    ...tokens.shadows.float,
  },
  dialogHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
    marginBottom: 4,
  },
  dialogSub: {
    fontSize: 13,
    color: tokens.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  rateOptionsContainer: {
    gap: 8,
    marginBottom: 14,
  },
  rateOptionBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  rateOptionActive: {
    backgroundColor: '#FFF1F4',
    borderColor: tokens.colors.primary,
  },
  rateOptionInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  rateOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rateOptionTextActive: {
    color: tokens.colors.primary,
    fontWeight: '700',
  },
  rateOptionTextInactive: {
    color: tokens.colors.textPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  switchSub: {
    fontSize: 12,
    color: tokens.colors.textSecondary,
    marginTop: 2,
  },
  safetyBulletList: {
    gap: 12,
    marginVertical: 10,
  },
  safetyBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  safetyBulletText: {
    flex: 1,
    fontSize: 13,
    color: tokens.colors.textSecondary,
    lineHeight: 18,
  },
  termsList: {
    marginVertical: 8,
  },
  termsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  termsText: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.textPrimary,
  },
  dialogCancelBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.textSecondary,
  },
});
