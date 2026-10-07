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
 * - large: 15,000 온 이상 또는 3D 비디오 (골든 드래곤, 슈퍼카 등 대형 3D/VIP 팡파레)
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
 * 3D 선물 이펙트 투명 비디오 & 3단계 티어(소/중/대) 플로팅 이펙트 오버레이
 * - 라이브 방송 및 채팅방 화면 위 정중앙(화면 중앙 상공)에 플로팅 앵커 배치
 * - 배경 화면(채팅방 메시지/하단 입력창, 라이브 스트림)은 100% 그대로 유지
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
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(bannerScale, {
        toValue: 0.8,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(effectScale, {
        toValue: 0.2,
        duration: 320,
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
        duration: 5000,
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
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.96,
          duration: 800,
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
        duration: 250,
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
        if (typeof player.replace === 'function') {
          player.replace(videoSource);
        }
        player.play();
      } catch {
        try {
          player.play();
        } catch {}
      }
    }

    // 티어별 최적 노출 시간 (중앙 플로팅 지속 시간)
    const duration =
      tier === 'large' ? 4200 : tier === 'medium' ? 3200 : 2400;

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
      {/* 앵커: 화면 정중앙 플로팅 스테이지 (라이브 방송 / 채팅방 화면 위에서 3D 폭발) */}
      <View style={styles.stageAnchor}>
        {/* ========================================================
            1. 티어별 3D 비주얼 이펙트 공간 (소형 120px / 중형 200px / 대형 VIP 290px)
           ======================================================== */}
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
          {/* [중형/대형 전용] 회전하는 황금빛 아우라 광채 링 */}
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

          {/* [대형 VIP 전용] 방사형 럭셔리 라이트 레이 (3D 광선 회전) */}
          {tier === 'large' && (
            <Animated.View
              style={[
                styles.largeRadiantGlow,
                {
                  transform: [{ rotate: spinInterpolation }, { scale: pulseAnim }],
                },
              ]}
            />
          )}

          {/* 중앙 3D 선물 엠블럼 / 아이콘 카드 */}
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
                  fontSize: tier === 'small' ? 40 : tier === 'medium' ? 62 : 84,
                }}
              >
                🎁
              </Text>
            )}

            {/* 비디오 레이어 오버레이 (대형 VIP 비디오가 재생 가능한 경우 위에 오버랩) */}
            {isVideo && player && (
              <View style={styles.videoOverlay}>
                <VideoView
                  style={styles.videoView}
                  player={player}
                  allowsFullscreen={false}
                  allowsPictureInPicture={false}
                  startsPictureInPictureAutomatically={false}
                  contentFit="contain"
                  nativeControls={false}
                />
              </View>
            )}

            {/* 티어별 상단 장식 뱃지 */}
            {tier === 'large' && (
              <View style={styles.crownBadge}>
                <Text style={styles.crownBadgeText}>👑 3D VIP</Text>
              </View>
            )}
          </View>

          {/* 반짝임 파티클 장식 */}
          <View style={styles.particleContainer}>
            <Text style={[styles.sparkleParticle, styles.sparkleTopLeft]}>✨</Text>
            <Text style={[styles.sparkleParticle, styles.sparkleBottomRight]}>⭐</Text>
            {tier !== 'small' && (
              <Text style={[styles.sparkleParticle, styles.sparkleTopRight]}>✨</Text>
            )}
            {tier === 'large' && (
              <Text style={[styles.sparkleParticle, styles.sparkleBottomLeft]}>🌟</Text>
            )}
          </View>
        </Animated.View>

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
            <Text style={{ fontSize: 16, marginRight: 8 }}>🎁</Text>
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
    // 화면 전체 정중앙에 플로팅 (라이브 방송 / 채팅방 화면 위에서 바로 폭발)
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  stageAnchor: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---------------------------------------------------------------------------
  // 그래픽 이펙트 스테이지 규격 (소 / 중 / 대)
  // ---------------------------------------------------------------------------
  effectStageBase: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  // 1단계: 작은 크기 (Small - 120x120)
  smallStage: {
    width: 120,
    height: 120,
  },
  // 2단계: 중간 크기 (Medium - 200x200)
  mediumStage: {
    width: 200,
    height: 200,
  },
  // 3단계: 완전 큰 크기 (Large - 290x290)
  largeStage: {
    width: 290,
    height: 290,
  },

  // ---------------------------------------------------------------------------
  // 아우라 및 배경 효과 (회전 링 & 방사 광채)
  // ---------------------------------------------------------------------------
  auraRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(251, 191, 36, 0.9)',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  mediumAura: {
    width: 190,
    height: 190,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  largeAura: {
    width: 280,
    height: 280,
    borderWidth: 3.5,
    borderColor: 'rgba(245, 158, 11, 0.95)',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    shadowColor: '#EAB308',
    shadowOpacity: 0.7,
    shadowRadius: 26,
    elevation: 14,
  },
  largeRadiantGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    borderStyle: 'dotted',
    borderColor: 'rgba(254, 240, 138, 0.6)',
    backgroundColor: 'rgba(254, 240, 138, 0.16)',
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  smallIconContainer: {
    width: 90,
    height: 90,
    borderWidth: 2.5,
    borderColor: 'rgba(251, 191, 36, 0.8)',
  },
  mediumIconContainer: {
    width: 140,
    height: 140,
    borderWidth: 3.5,
    borderColor: '#F59E0B',
  },
  largeIconContainer: {
    width: 185,
    height: 185,
    borderWidth: 4.5,
    borderColor: '#EAB308',
  },

  // 썸네일 이미지 크기
  smallThumb: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  mediumThumb: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  largeThumb: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },

  // 비디오 오버레이
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  videoView: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },

  // VIP 왕관 뱃지
  crownBadge: {
    position: 'absolute',
    top: -14,
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  crownBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  // 파티클 장식
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  sparkleParticle: {
    position: 'absolute',
    fontSize: 20,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sparkleTopLeft: {
    top: 4,
    left: 4,
  },
  sparkleTopRight: {
    top: 6,
    right: 4,
  },
  sparkleBottomRight: {
    bottom: 6,
    right: 8,
  },
  sparkleBottomLeft: {
    bottom: 6,
    left: 8,
  },

  // ---------------------------------------------------------------------------
  // 알림 배너 뱃지 (이펙트 바로 하단에 밀착)
  // ---------------------------------------------------------------------------
  bannerBadgeBase: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderRadius: 26,
    paddingVertical: 9,
    paddingHorizontal: 16,
    maxWidth: SCREEN_WIDTH * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  smallBannerBadge: {
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.6)',
  },
  mediumBannerBadge: {
    borderWidth: 2,
    borderColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  largeBannerBadge: {
    borderWidth: 2.5,
    borderColor: '#EAB308',
    backgroundColor: 'rgba(17, 24, 39, 0.96)',
    paddingVertical: 11,
    paddingHorizontal: 20,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  bannerBadgeThumb: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  bannerBadgeTextCol: {
    flexShrink: 1,
  },
  bannerBadgeSenderText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
  },
  bannerBadgeGiftText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
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
