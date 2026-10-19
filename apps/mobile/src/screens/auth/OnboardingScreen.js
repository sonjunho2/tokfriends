// apps/mobile/src/screens/auth/OnboardingScreen.js
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { tokens } from '../../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'slide-1',
    badge: '인연의 발견',
    title: '새로운 사람이 다가오고,\n새로운 인연이 시작돼요',
    desc: '동네 이웃부터 취향이 통하는 특별한 대화까지,\n당신에게 꼭 맞는 인연을 찾아보세요.',
    accentColor: '#FF3B6B',
  },
  {
    key: 'slide-2',
    badge: '3D 실시간 라이브',
    title: '감동을 선물하는\n생생한 3D 실시간 라이브',
    desc: '화려한 3D 애니메이션 선물 폭죽과 함께\n호스트 및 시청자들과 실시간으로 소통하세요.',
    accentColor: '#8B5CF6',
  },
  {
    key: 'slide-3',
    badge: '안심 케어 24/7',
    title: '언제나 안심할 수 있는\nAI 클린 & 세이프티 소통',
    desc: '철저한 동네 인증과 24시간 실시간 AI 가디언으로\n모두가 믿고 즐길 수 있는 환경을 만듭니다.',
    accentColor: '#10B981',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 애니메이션 컨트롤
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scanAnim = useRef(new Animated.Value(-60)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const contentSlideAnim = useRef(new Animated.Value(0)).current;

  // 1. 펄스 & 플로팅 루프 애니메이션
  useEffect(() => {
    // 펄스 애니메이션
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    // 부드러운 상하 플로팅
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    // 홀로그램 스캔 레이저 (슬라이드 3)
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 60,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: -60,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    floatLoop.start();
    scanLoop.start();

    return () => {
      pulseLoop.stop();
      floatLoop.stop();
      scanLoop.stop();
    };
  }, [pulseAnim, floatAnim, scanAnim]);

  // 온보딩 완료 처리 및 로그인 화면 전환
  const handleFinishOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem('@dagaon_onboarded', 'true');
    } catch (e) {
      console.warn('Failed to save onboarding state:', e);
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }, [navigation]);

  // 슬라이드 전환
  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      Animated.parallel([
        Animated.timing(contentFadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(contentSlideAnim, {
          toValue: -15,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex((prev) => prev + 1);
        contentSlideAnim.setValue(15);
        Animated.parallel([
          Animated.timing(contentFadeAnim, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(contentSlideAnim, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      handleFinishOnboarding();
    }
  };

  const currentSlide = SLIDES[currentIndex];

  // =========================================================================
  // 3D 비주얼 렌더러 (너비 280px, 높이 280px 중심)
  // =========================================================================
  const renderVisual = () => {
    if (currentIndex === 0) {
      // 슬라이드 1: 3D 플로팅 매칭 카드 스택 & 코랄 핑크 앰비언트 글로우
      return (
        <View style={styles.visualContainer}>
          {/* 네온 코랄 핑크 앰비언트 글로우 */}
          <Animated.View
            style={[
              styles.ambientGlow,
              {
                backgroundColor: 'rgba(255, 59, 107, 0.22)',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />

          {/* 뒤쪽 서브 카드 2 (기울어짐) */}
          <View style={[styles.matchCard, styles.matchCardBack2]}>
            <View style={styles.cardHeaderSmall}>
              <View style={[styles.avatarCircleSmall, { backgroundColor: '#C084FC' }]} />
              <View style={styles.cardBarSmall} />
            </View>
          </View>

          {/* 뒤쪽 서브 카드 1 (반대편 기울어짐) */}
          <View style={[styles.matchCard, styles.matchCardBack1]}>
            <View style={styles.cardHeaderSmall}>
              <View style={[styles.avatarCircleSmall, { backgroundColor: '#38BDF8' }]} />
              <View style={styles.cardBarSmall} />
            </View>
          </View>

          {/* 앞면 메인 3D 매칭 카드 */}
          <Animated.View
            style={[
              styles.matchCard,
              styles.matchCardFront,
              { transform: [{ translateY: floatAnim }] },
            ]}
          >
            {/* 카드 상단 배지 */}
            <View style={styles.matchScoreBadge}>
              <Ionicons name="sparkles" size={12} color="#FFFFFF" />
              <Text style={styles.matchScoreText}>98% MATCH</Text>
            </View>

            {/* 유저 아바타 & 정보 */}
            <View style={styles.frontCardAvatarWrap}>
              <LinearGradient
                colors={tokens.colors.gradients.primaryPink}
                style={styles.frontAvatarGrad}
              >
                <Ionicons name="person" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <Text style={styles.frontCardName}>서연, 25</Text>
            <Text style={styles.frontCardMeta}>📍 역삼동 • 카페 탐방 & 음악</Text>

            {/* 카드 액션 하트 */}
            <View style={styles.frontCardActionRow}>
              <View style={styles.frontCardHeartBtn}>
                <Ionicons name="heart" size={20} color="#FF3B6B" />
              </View>
            </View>
          </Animated.View>

          {/* 플로팅 3D 이모지 배지 */}
          <Animated.View
            style={[
              styles.floatingBadgeLeft,
              { transform: [{ translateY: floatAnim }] },
            ]}
          >
            <Text style={styles.floatingBadgeText}>💌 톡 도착!</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.floatingBadgeRight,
              { transform: [{ translateY: floatAnim }] },
            ]}
          >
            <Text style={styles.floatingBadgeText}>✨ 새로운 매칭</Text>
          </Animated.View>
        </View>
      );
    }

    if (currentIndex === 1) {
      // 슬라이드 2: 3D 실시간 라이브 & 화면 밖으로 튀어나오는 선물 폭죽
      return (
        <View style={styles.visualContainer}>
          {/* 퍼플-코랄 앰비언트 글로우 */}
          <Animated.View
            style={[
              styles.ambientGlow,
              {
                backgroundColor: 'rgba(139, 92, 246, 0.22)',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />

          {/* 3D 라이브 스트림 프레임 */}
          <Animated.View
            style={[
              styles.liveFrame,
              { transform: [{ translateY: floatAnim }] },
            ]}
          >
            <LinearGradient
              colors={['#1E1B4B', '#312E81']}
              style={styles.liveFrameInner}
            >
              {/* 상단 🔴 LIVE & 시청자 배지 */}
              <View style={styles.liveTopBar}>
                <View style={styles.liveRedDot}>
                  <Text style={styles.liveRedText}>🔴 LIVE</Text>
                </View>
                <View style={styles.liveViewerBadge}>
                  <Ionicons name="eye" size={10} color="#FFFFFF" />
                  <Text style={styles.liveViewerText}>1.4k</Text>
                </View>
              </View>

              {/* 중앙 실시간 소통 비주얼 */}
              <View style={styles.liveCenterHost}>
                <Ionicons name="videocam" size={36} color="#A78BFA" />
                <Text style={styles.liveHostText}>라이브 방송 중</Text>
              </View>

              {/* 하단 채팅 말풍선 */}
              <View style={styles.liveCommentBubble}>
                <Text style={styles.liveCommentUser}>민우</Text>
                <Text style={styles.liveCommentMsg}>오늘 분위기 너무 좋아요! ✨</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* 화면 밖으로 튀어나오는 3D 선물 폭죽 1: 슈퍼카 배지 */}
          <Animated.View
            style={[
              styles.giftBadgeSupercar,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <LinearGradient
              colors={['#F43F5E', '#BE123C']}
              style={styles.giftBadgeGrad}
            >
              <Text style={styles.giftBadgeEmoji}>🏎️</Text>
              <Text style={styles.giftBadgeLabel}>VIP 슈퍼카</Text>
            </LinearGradient>
          </Animated.View>

          {/* 화면 밖으로 튀어나오는 3D 선물 폭죽 2: 골든 스타 */}
          <Animated.View
            style={[
              styles.giftBadgeStar,
              { transform: [{ translateY: floatAnim }] },
            ]}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.giftBadgeGradSmall}
            >
              <Text style={styles.giftStarEmoji}>👑 50,000P</Text>
            </LinearGradient>
          </Animated.View>
        </View>
      );
    }

    // 슬라이드 3: 안심 케어 24/7 (에메랄드 글래스모피즘 방패 & 스캔 홀로그램)
    return (
      <View style={styles.visualContainer}>
        {/* 에메랄드 앰비언트 글로우 */}
        <Animated.View
          style={[
            styles.ambientGlow,
            {
              backgroundColor: 'rgba(16, 185, 129, 0.22)',
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        {/* 3D 글래스모피즘 방패 */}
        <Animated.View
          style={[
            styles.shieldBox,
            { transform: [{ translateY: floatAnim }] },
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(209, 250, 229, 0.75)']}
            style={styles.shieldGrad}
          >
            {/* 방패 중앙 아이콘 */}
            <View style={styles.shieldCenterIconCircle}>
              <Ionicons name="shield-checkmark" size={68} color="#10B981" />
            </View>

            {/* 홀로그램 스캔 레이저 라인 */}
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanAnim }] },
              ]}
            >
              <LinearGradient
                colors={['transparent', '#10B981', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scanLineGrad}
              />
            </Animated.View>

            <View style={styles.shieldMetaBox}>
              <Text style={styles.shieldMetaTitle}>AI GUARDIAN 24/7</Text>
              <Text style={styles.shieldMetaSub}>실시간 비전 AI 안심 보호 가동 중</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* 좌측 안심 뱃지 */}
        <View style={styles.safetyChipLeft}>
          <Ionicons name="lock-closed" size={13} color="#059669" />
          <Text style={styles.safetyChipText}>개인정보 암호화</Text>
        </View>

        {/* 우측 클린 뱃지 */}
        <View style={styles.safetyChipRight}>
          <Ionicons name="checkmark-done-circle" size={14} color="#059669" />
          <Text style={styles.safetyChipText}>100% 동네 인증</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 상단 건너뛰기 버튼 */}
      <View style={styles.topHeader}>
        <View style={styles.brandTitleWrap}>
          <Text style={styles.brandTitle}>다가온</Text>
          <View style={styles.brandDot} />
        </View>

        <TouchableOpacity
          onPress={handleFinishOnboarding}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.skipBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>건너뛰기</Text>
        </TouchableOpacity>
      </View>

      {/* 중앙 3D 비주얼 영역 */}
      <View style={styles.visualSection}>
        {renderVisual()}
      </View>

      {/* 하단 텍스트 및 인터랙션 */}
      <View style={styles.bottomSection}>
        <Animated.View
          style={{
            opacity: contentFadeAnim,
            transform: [{ translateY: contentSlideAnim }],
          }}
        >
          {/* 슬라이드 뱃지 */}
          <View style={[styles.slideBadge, { borderColor: currentSlide.accentColor + '40' }]}>
            <Text style={[styles.slideBadgeText, { color: currentSlide.accentColor }]}>
              {currentSlide.badge}
            </Text>
          </View>

          {/* 타이틀 및 설명 */}
          <Text style={styles.titleText}>{currentSlide.title}</Text>
          <Text style={styles.descText}>{currentSlide.desc}</Text>
        </Animated.View>

        {/* 가로형 알약(Pill) 페이징 인디케이터 */}
        <View style={styles.indicatorRow}>
          {SLIDES.map((s, idx) => {
            const isActive = idx === currentIndex;
            return (
              <View
                key={s.key}
                style={[
                  styles.indicatorDot,
                  isActive ? styles.indicatorPillActive : styles.indicatorDotInactive,
                ]}
              />
            );
          })}
        </View>

        {/* 하단 메인 CTA 버튼 (tokens.colors.primary 네온 그라데이션 풀 캡슐 56px) */}
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={handleNext}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={tokens.colors.gradients.primaryPink}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtnGradient}
          >
            <Text style={styles.ctaBtnText}>
              {currentIndex === SLIDES.length - 1 ? '✨ 다가온 시작하기' : '다음으로 ➔'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  brandTitleWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: tokens.colors.primary,
    letterSpacing: -0.5,
  },
  brandDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: tokens.colors.secondary,
    marginLeft: 3,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  visualSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualContainer: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  // 슬라이드 1: 3D 매칭 카드 스택
  matchCard: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    ...tokens.shadows.card,
  },
  matchCardBack2: {
    width: 170,
    height: 210,
    transform: [{ rotate: '-12deg' }, { translateY: -4 }],
    opacity: 0.6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  matchCardBack1: {
    width: 180,
    height: 220,
    transform: [{ rotate: '8deg' }, { translateY: -2 }],
    opacity: 0.85,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  matchCardFront: {
    width: 196,
    height: 236,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF1F4',
    ...tokens.shadows.float,
  },
  matchScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
    marginBottom: 10,
  },
  matchScoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  frontCardAvatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
    overflow: 'hidden',
  },
  frontAvatarGrad: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frontCardName: {
    fontSize: 16,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  frontCardMeta: {
    fontSize: 11,
    color: tokens.colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  frontCardActionRow: {
    marginTop: 10,
  },
  frontCardHeartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarCircleSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  cardBarSmall: {
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  floatingBadgeLeft: {
    position: 'absolute',
    left: -12,
    top: 40,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...tokens.shadows.card,
  },
  floatingBadgeRight: {
    position: 'absolute',
    right: -10,
    bottom: 45,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...tokens.shadows.card,
  },
  floatingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  // 슬라이드 2: 3D 라이브 프레임 & 선물 폭죽
  liveFrame: {
    width: 200,
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    ...tokens.shadows.float,
  },
  liveFrameInner: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  liveTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveRedDot: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveRedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  liveViewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveViewerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  liveCenterHost: {
    alignItems: 'center',
  },
  liveHostText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E0E7FF',
    marginTop: 6,
  },
  liveCommentBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    padding: 8,
  },
  liveCommentUser: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F472B6',
  },
  liveCommentMsg: {
    fontSize: 11,
    color: '#FFFFFF',
    marginTop: 1,
  },
  giftBadgeSupercar: {
    position: 'absolute',
    right: -16,
    top: 20,
    borderRadius: 16,
    overflow: 'hidden',
    ...tokens.shadows.float,
  },
  giftBadgeGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  giftBadgeEmoji: {
    fontSize: 18,
  },
  giftBadgeLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  giftBadgeStar: {
    position: 'absolute',
    left: -14,
    bottom: 25,
    borderRadius: 14,
    overflow: 'hidden',
    ...tokens.shadows.card,
  },
  giftBadgeGradSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  giftStarEmoji: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // 슬라이드 3: 안심 케어 글래스모피즘 방패
  shieldBox: {
    width: 200,
    height: 230,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#10B981',
    ...tokens.shadows.float,
  },
  shieldGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    position: 'relative',
  },
  shieldCenterIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 4,
    top: '50%',
  },
  scanLineGrad: {
    width: '100%',
    height: '100%',
  },
  shieldMetaBox: {
    alignItems: 'center',
  },
  shieldMetaTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#065F46',
    letterSpacing: 1,
  },
  shieldMetaSub: {
    fontSize: 10,
    color: '#047857',
    marginTop: 2,
  },
  safetyChipLeft: {
    position: 'absolute',
    left: -10,
    top: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    ...tokens.shadows.card,
  },
  safetyChipRight: {
    position: 'absolute',
    right: -10,
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    ...tokens.shadows.card,
  },
  safetyChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  // 하단 텍스트 및 CTA 영역
  bottomSection: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 24 : 28,
  },
  slideBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: tokens.radii.pill,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  slideBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
    lineHeight: 30,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    color: tokens.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  indicatorDot: {
    height: 6,
    borderRadius: 3,
  },
  indicatorPillActive: {
    width: 24,
    backgroundColor: tokens.colors.primary,
  },
  indicatorDotInactive: {
    width: 6,
    backgroundColor: '#E2E8F0',
  },
  ctaBtn: {
    borderRadius: 28,
    overflow: 'hidden',
    ...tokens.shadows.float,
  },
  ctaBtnGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
