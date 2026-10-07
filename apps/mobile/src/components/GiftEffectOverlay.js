// apps/mobile/src/components/GiftEffectOverlay.js
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import colors from '../theme/colors';
import typography from '../theme/typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 선물 등급 산정 유틸 (타사 라이브 벤치마크 3단계 이펙트 규격)
 * - small: 3,000 온 미만 (커피, 하트 등 소형 바운스 & 스파클)
 * - medium: 3,000 ~ 15,000 온 (꽃다발, 샴페인 등 중형 회전 골드 아우라 & 스타버스트)
 * - large: 15,000 온 이상 또는 3D 비디오 (골든 드래곤, 스포츠카 등 대형 3D/VIP 팡파레)
 */
export const getGiftTier = (gift) => {
  if (!gift) return 'small';
  const points = Number(gift.pricePoints || gift.amount || gift.points || 0);
  const isAlpha = gift.animationType === 'alpha_video' || Boolean(gift.animationUrl);
  if (isAlpha || points >= 15000) return 'large';
  if (points >= 3000) return 'medium';
  return 'small';
};

/**
 * 3D 선물 이펙트 투명 비디오 & 3단계 티어(소/중/대) 이펙트 오버레이
 * - 타사 라이브(틱톡, SOOP/아프리카) 표준에 따라 화면 하단 1/3 중앙 영역에 플로팅 앵커
 * - pointerEvents="none" 으로 채팅창 스크롤 및 입력창 터치를 100% 방해하지 않음
 * - FIFO 순차 대기열 처리로 연속 후원 시 씹힘 없이 매끄럽게 재생
 */
const GiftEffectOverlay = forwardRef(({ onEffectEnd }, ref) => {
  const [queue, setQueue] = useState([]);
  const [currentGift, setCurrentGift] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 애니메이션 컨트롤러
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const bannerScale = useRef(new Animated.Value(0.7)).current;
  const effectScale = useRef(new Animated.Value(0.2)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 비디오 소스 URL
  const [videoSource, setVideoSource] = useState(null);

  // expo-video player 인스턴스
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.muted = false;
  });

  // 큐에 선물 이벤트 추가
  const enqueueGift = useCallback((giftEvent) => {
    if (!giftEvent) return;
    setQueue((prev) => [...prev, { ...giftEvent, qId: `q_${Date.now()}_${Math.random()}` }]);
  }, []);

  // 외부 ref 공개 API (FIFO 대기열 추가 및 테스트 트리거)
  useImperativeHandle(ref, () => ({
    enqueueGift,
    // 개발/테스트용 목 트리거
    triggerMockGift: (mock = {}) => {
      enqueueGift({
        giftId: mock.giftId || 'gift-dragon',
        giftName: mock.giftName || '골든 드래곤 (3D)',
        senderNickname: mock.senderNickname || '익명의 후원자',
        pricePoints: mock.pricePoints || 30000,
        thumbnailUrl:
          mock.thumbnailUrl ||
          'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150',
        animationUrl:
          mock.animationUrl ||
          'https://assets.mixkit.co/videos/preview/mixkit-fire-sparks-rising-in-the-dark-42352-large.mp4',
        animationType: mock.animationType || 'alpha_video',
      });
    },
  }));

  // 다음 선물 순차 재생 프로세서 (FIFO)
  const processNextInQueue = useCallback(() => {
    if (isPlaying) return;

    setQueue((prevQueue) => {
      if (prevQueue.length === 0) {
        setCurrentGift(null);
        setVideoSource(null);
        return prevQueue;
      }

      const [nextGift, ...rest] = prevQueue;
      setCurrentGift(nextGift);
      setIsPlaying(true);

      if (nextGift.animationUrl) {
        setVideoSource(nextGift.animationUrl);
      } else {
        setVideoSource(null);
      }

      return rest;
    });
  }, [isPlaying]);

  // 큐 변화 감지하여 재생 시작
  useEffect(() => {
    if (!isPlaying && queue.length > 0) {
      processNextInQueue();
    }
  }, [queue, isPlaying, processNextInQueue]);

  // 현재 선물 재생 완료 처리
  const finishCurrentEffect = useCallback(() => {
    Animated.parallel([
      Animated.timing(bannerAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(bannerScale, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(effectScale, {
        toValue: 0.2,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsPlaying(false);
      setCurrentGift(null);
      setVideoSource(null);
      if (onEffectEnd) onEffectEnd();
    });
  }, [bannerAnim, bannerScale, effectScale, onEffectEnd]);

  // 이펙트 애니메이션 및 재생 라이프사이클
  useEffect(() => {
    if (!currentGift) return;

    const tier = getGiftTier(currentGift);

    // 초기화
    bannerAnim.setValue(0);
    bannerScale.setValue(0.7);
    effectScale.setValue(0.2);
    spinAnim.setValue(0);
    pulseAnim.setValue(1);

    // 아우라 회전 루프 (중형/대형)
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();

    // 펄스 루프 (중형/대형)
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.96,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 등장 스프링 애니메이션
    Animated.parallel([
      Animated.timing(bannerAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(bannerScale, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.spring(effectScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // expo-video 재생
    if (player && videoSource) {
      try {
        player.replay();
      } catch {
        // silent fallback
      }
    }

    // 티어별 최적 노출 시간
    const duration =
      tier === 'large' ? (currentGift.animationUrl ? 4400 : 3800) : tier === 'medium' ? 3000 : 2200;

    const timer = setTimeout(() => {
      spinLoop.stop();
      pulseLoop.stop();
      finishCurrentEffect();
    }, duration);

    return () => {
      clearTimeout(timer);
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [
    currentGift,
    videoSource,
    player,
    bannerAnim,
    bannerScale,
    effectScale,
    spinAnim,
    pulseAnim,
    finishCurrentEffect,
  ]);

  if (!currentGift) {
    return null;
  }

  const tier = getGiftTier(currentGift);
  const isVideo = Boolean(currentGift.animationUrl) && Boolean(player);
  const giftName = currentGift.giftName || currentGift.name || '선물';
  const senderNickname = currentGift.senderNickname || currentGift.senderName || '친구';
  const pricePoints = Number(currentGift.pricePoints || currentGift.amount || currentGift.points || 0);
  const thumbUrl = currentGift.thumbnailUrl || currentGift.icon;

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.overlayContainer} pointerEvents="none">
      {/* 앵커: 화면 하단 1/3 중앙 플로팅 스테이지 */}
      <View style={styles.stageAnchor}>
        {/* ========================================================
            1. 티어별 비주얼 이펙트 공간 (소형 110px / 중형 190px / 대형 280px)
           ======================================================== */}
        {isVideo ? (
          /* 투명 비디오 이펙트 (대형 VIP 비디오) */
          <Animated.View
            style={[
              styles.videoStage,
              {
                opacity: bannerAnim,
                transform: [{ scale: effectScale }],
              },
            ]}
          >
            <VideoView
              style={styles.videoView}
              player={player}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
              startsPictureInPictureAutomatically={false}
              contentFit="contain"
              nativeControls={false}
            />
          </Animated.View>
        ) : (
          /* 그래픽/썸네일 이펙트 (티어별 맞춤 공간) */
          <Animated.View
            style={[
              styles.effectStageBase,
              tier === 'small' && styles.smallStage,
              tier === 'medium' && styles.mediumStage,
              tier === 'large' && styles.largeStage,
              {
                opacity: bannerAnim,
                transform: [{ scale: effectScale }],
              },
            ]}
          >
            {/* [중형/대형 전용] 회전하는 골드 아우라 광채 링 */}
            {tier !== 'small' && (
              <Animated.View
                style={[
                  styles.auraRing,
                  tier === 'medium' ? styles.mediumAura : styles.largeAura,
                  {
                    transform: [{ rotate: spinInterpolation }, { scale: pulseAnim }],
                  },
                ]}
              />
            )}

            {/* [대형 VIP 전용] 방사형 럭셔리 라이트 레이 */}
            {tier === 'large' && (
              <Animated.View
                style={[
                  styles.largeRadiantGlow,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
            )}

            {/* 중앙 선물 썸네일 / 아이콘 카드 */}
            <View
              style={[
                styles.iconContainerBase,
                tier === 'small' && styles.smallIconContainer,
                tier === 'medium' && styles.mediumIconContainer,
                tier === 'large' && styles.largeIconContainer,
              ]}
            >
              {thumbUrl ? (
                <Image
                  source={{ uri: thumbUrl }}
                  style={[
                    tier === 'small' && styles.smallThumb,
                    tier === 'medium' && styles.mediumThumb,
                    tier === 'large' && styles.largeThumb,
                  ]}
                  resizeMode="contain"
                />
              ) : (
                <Text
                  style={{
                    fontSize: tier === 'small' ? 36 : tier === 'medium' ? 56 : 76,
                  }}
                >
                  🎁
                </Text>
              )}

              {/* 티어별 상단 장식 뱃지 */}
              {tier === 'large' && (
                <View style={styles.crownBadge}>
                  <Text style={styles.crownBadgeText}>👑 VIP</Text>
                </View>
              )}
            </View>

            {/* [소형/중형/대형 공통] 반짝임 파티클 장식 */}
            <View style={styles.particleContainer}>
              <Text style={[styles.sparkleParticle, styles.sparkleTopLeft]}>✨</Text>
              <Text style={[styles.sparkleParticle, styles.sparkleBottomRight]}>⭐</Text>
              {tier !== 'small' && (
                <Text style={[styles.sparkleParticle, styles.sparkleTopRight]}>✨</Text>
              )}
            </View>
          </Animated.View>
        )}

        {/* ========================================================
            2. 이펙트 바로 아래에 밀착되는 선물 알림 배너 뱃지
           ======================================================== */}
        <Animated.View
          style={[
            styles.bannerBadgeBase,
            tier === 'small' && styles.smallBannerBadge,
            tier === 'medium' && styles.mediumBannerBadge,
            tier === 'large' && styles.largeBannerBadge,
            {
              opacity: bannerAnim,
              transform: [{ scale: bannerScale }],
            },
          ]}
        >
          {thumbUrl ? (
            <Image source={{ uri: thumbUrl }} style={styles.bannerBadgeThumb} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 14, marginRight: 6 }}>🎁</Text>
          )}

          <View style={styles.bannerBadgeTextCol}>
            <Text style={styles.bannerBadgeSenderText} numberOfLines={1}>
              {senderNickname}님이
            </Text>
            <Text style={styles.bannerBadgeGiftText} numberOfLines={1}>
              <Text style={[styles.bannerBadgeHighlight, tier === 'large' && styles.vipHighlight]}>
                {giftName}
              </Text>
              {pricePoints > 0 ? ` (${pricePoints.toLocaleString()} 온)` : ''}을 선물했습니다!
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
});

GiftEffectOverlay.displayName = 'GiftEffectOverlay';

export default GiftEffectOverlay;

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    justifyContent: 'flex-end',
    alignItems: 'center',
    // 화면 하단 1/3 중앙 영역에 이펙트 배치 (입력창 위 ~ 중앙 하단 플로팅)
    paddingBottom: Platform.OS === 'ios' ? 140 : 120,
  },
  stageAnchor: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---------------------------------------------------------------------------
  // 비디오 스테이지 (투명 비디오 이펙트)
  // ---------------------------------------------------------------------------
  videoStage: {
    width: Math.min(SCREEN_WIDTH * 0.85, 300),
    height: Math.min(SCREEN_WIDTH * 0.85, 300),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  videoView: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },

  // ---------------------------------------------------------------------------
  // 그래픽 이펙트 스테이지 규격 (소 / 중 / 대)
  // ---------------------------------------------------------------------------
  effectStageBase: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  // 1단계: 작은 크기 (Small - 110x110)
  smallStage: {
    width: 110,
    height: 110,
  },
  // 2단계: 중간 크기 (Medium - 190x190)
  mediumStage: {
    width: 190,
    height: 190,
  },
  // 3단계: 완전 큰 크기 (Large - 280x280)
  largeStage: {
    width: 280,
    height: 280,
  },

  // ---------------------------------------------------------------------------
  // 아우라 및 배경 효과 (회전 링 & 방사 광채)
  // ---------------------------------------------------------------------------
  auraRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(251, 191, 36, 0.85)',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  mediumAura: {
    width: 180,
    height: 180,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  largeAura: {
    width: 270,
    height: 270,
    borderWidth: 3,
    borderColor: 'rgba(245, 158, 11, 0.95)',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    shadowColor: '#EAB308',
    shadowOpacity: 0.65,
    shadowRadius: 24,
    elevation: 12,
  },
  largeRadiantGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(254, 240, 138, 0.2)',
  },

  // ---------------------------------------------------------------------------
  // 중앙 아이콘 카드 컨테이너
  // ---------------------------------------------------------------------------
  iconContainerBase: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  smallIconContainer: {
    width: 84,
    height: 84,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.7)',
  },
  mediumIconContainer: {
    width: 128,
    height: 128,
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  largeIconContainer: {
    width: 170,
    height: 170,
    borderWidth: 4,
    borderColor: '#EAB308',
  },

  // 썸네일 이미지 크기
  smallThumb: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  mediumThumb: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  largeThumb: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },

  // VIP 왕관 뱃지
  crownBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FEF08A',
  },
  crownBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  // 파티클 장식
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  sparkleParticle: {
    position: 'absolute',
    fontSize: 18,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sparkleTopLeft: {
    top: 4,
    left: 8,
  },
  sparkleTopRight: {
    top: 6,
    right: 8,
  },
  sparkleBottomRight: {
    bottom: 8,
    right: 12,
  },

  // ---------------------------------------------------------------------------
  // 알림 배너 뱃지 (이펙트 바로 하단에 밀착)
  // ---------------------------------------------------------------------------
  bannerBadgeBase: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 24,
    paddingVertical: 7,
    paddingHorizontal: 14,
    maxWidth: SCREEN_WIDTH * 0.88,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  smallBannerBadge: {
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.5)',
  },
  mediumBannerBadge: {
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  largeBannerBadge: {
    borderWidth: 2,
    borderColor: '#EAB308',
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    paddingVertical: 9,
    paddingHorizontal: 18,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  bannerBadgeThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  bannerBadgeTextCol: {
    flexShrink: 1,
  },
  bannerBadgeSenderText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '600',
  },
  bannerBadgeGiftText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  bannerBadgeHighlight: {
    color: '#FBBF24',
    fontWeight: '800',
  },
  vipHighlight: {
    color: '#FEF08A',
    fontWeight: '900',
  },
});
