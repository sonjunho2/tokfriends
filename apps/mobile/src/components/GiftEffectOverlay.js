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
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import LottieView from 'lottie-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 선물 등급 및 이펙트 타입 산정 유틸
 * - fireworks: 3D 입체 폭죽쇼
 * - 3d_heart: 3D 입체 하트 폭풍
 * - lottie: Lottie 벡터 애니메이션
 * - alpha_video: 3D 투명 알파 비디오 (대형 VIP)
 * - small/medium/large: 일반 선물 티어별 3D 파티클 & 오라
 */
export const getGiftEffectType = (gift) => {
  if (!gift) return 'small';
  const type = String(gift.animationType || '').toLowerCase();
  const name = String(gift.giftName || gift.name || '');

  if (type === 'fireworks' || name.includes('폭죽') || name.includes('샴페인')) {
    return 'fireworks';
  }
  if (type === '3d_heart' || name.includes('하트') || name.includes('러브')) {
    return '3d_heart';
  }
  if (type === 'lottie' || (gift.animationUrl && gift.animationUrl.endsWith('.json'))) {
    return 'lottie';
  }
  if (type === 'alpha_video' || (gift.animationUrl && !gift.animationUrl.endsWith('.json'))) {
    return 'alpha_video';
  }

  const points = Number(gift.pricePoints || gift.amount || gift.points || 0);
  if (points >= 15000) return 'large';
  if (points >= 3000) return 'medium';
  return 'small';
};

// -----------------------------------------------------------------------------
// 1. 화려한 3D 입체 폭죽 파티클 컴포넌트 (Fireworks Particle System)
// -----------------------------------------------------------------------------
const FIREWORK_PARTICLE_COUNT = 36;
const FIREWORK_COLORS = ['#FFD700', '#FF3B6B', '#00F0FF', '#FF8500', '#A855F7', '#FFFFFF', '#4ADE80'];

function FireworksEffect({ isPlaying }) {
  const particles = useRef(
    Array.from({ length: FIREWORK_PARTICLE_COUNT }, (_, index) => {
      const angle = (index / FIREWORK_PARTICLE_COUNT) * 2 * Math.PI + (Math.random() * 0.4 - 0.2);
      const distance = 80 + Math.random() * 160;
      return {
        id: index,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 20, // 살짝 상공으로 치솟음
        color: FIREWORK_COLORS[index % FIREWORK_COLORS.length],
        size: 5 + Math.random() * 7,
        anim: new Animated.Value(0),
        delay: (index % 4) * 80,
      };
    })
  ).current;

  const shockwaveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isPlaying) return;

    // 쇼크웨이브 링 애니메이션
    shockwaveAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shockwaveAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // 파티클 방사 폭발 애니메이션
    const anims = particles.map((p) => {
      p.anim.setValue(0);
      return Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(p.anim, {
          toValue: 1,
          duration: 1600 + Math.random() * 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(anims).start();
  }, [isPlaying, particles, shockwaveAnim]);

  if (!isPlaying) return null;

  const shockwaveScale = shockwaveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 2.8],
  });

  const shockwaveOpacity = shockwaveAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.9, 0.5, 0],
  });

  return (
    <View style={styles.absoluteCenter} pointerEvents="none">
      {/* 폭죽 충격파 글로우 링 */}
      <Animated.View
        style={[
          styles.shockwaveRing,
          {
            transform: [{ scale: shockwaveScale }],
            opacity: shockwaveOpacity,
          },
        ]}
      />

      {/* 360도 입체 파티클 불꽃 */}
      {particles.map((p) => {
        const translateX = p.anim.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0, p.x * 0.7, p.x],
        });
        const translateY = p.anim.interpolate({
          inputRange: [0, 0.3, 0.7, 1],
          outputRange: [0, p.y * 0.7, p.y, p.y + 40], // 중력에 의해 떨어짐
        });
        const scale = p.anim.interpolate({
          inputRange: [0, 0.15, 0.8, 1],
          outputRange: [0, 1.4, 0.9, 0],
        });
        const opacity = p.anim.interpolate({
          inputRange: [0, 0.1, 0.8, 1],
          outputRange: [0, 1, 0.85, 0],
        });

        return (
          <Animated.View
            key={`fw_${p.id}`}
            style={[
              styles.fireworkSpark,
              {
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: p.color,
                shadowColor: p.color,
                transform: [{ translateX }, { translateY }, { scale }],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

// -----------------------------------------------------------------------------
// 2. 화려한 3D 입체 하트 폭풍 컴포넌트 (3D Exploding / Floating Hearts)
// -----------------------------------------------------------------------------
const HEART_PARTICLE_COUNT = 24;
const HEART_EMOJIS = ['💖', '💕', '❤️', '💗', '💓', '✨', '💝'];

function Exploding3DHeartsEffect({ isPlaying }) {
  const heartParticles = useRef(
    Array.from({ length: HEART_PARTICLE_COUNT }, (_, i) => {
      const angle = (i / HEART_PARTICLE_COUNT) * 2 * Math.PI;
      const distance = 70 + Math.random() * 150;
      return {
        id: i,
        emoji: HEART_EMOJIS[i % HEART_EMOJIS.length],
        targetX: Math.cos(angle) * distance,
        targetY: Math.sin(angle) * distance - 40,
        size: 18 + (i % 3) * 10,
        anim: new Animated.Value(0),
        rotate: `${(Math.random() - 0.5) * 60}deg`,
        delay: (i % 5) * 70,
      };
    })
  ).current;

  useEffect(() => {
    if (!isPlaying) return;

    const anims = heartParticles.map((h) => {
      h.anim.setValue(0);
      return Animated.sequence([
        Animated.delay(h.delay),
        Animated.timing(h.anim, {
          toValue: 1,
          duration: 1800 + Math.random() * 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(anims).start();
  }, [isPlaying, heartParticles]);

  if (!isPlaying) return null;

  return (
    <View style={styles.absoluteCenter} pointerEvents="none">
      {heartParticles.map((h) => {
        const translateX = h.anim.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0, h.targetX * 0.8, h.targetX],
        });
        const translateY = h.anim.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0, h.targetY * 0.8, h.targetY - 50], // 상공으로 날아감
        });
        const scale = h.anim.interpolate({
          inputRange: [0, 0.2, 0.7, 1],
          outputRange: [0.1, 1.3, 1.0, 0],
        });
        const opacity = h.anim.interpolate({
          inputRange: [0, 0.1, 0.75, 1],
          outputRange: [0, 1, 0.9, 0],
        });

        return (
          <Animated.View
            key={`ht_${h.id}`}
            style={[
              styles.heartItem,
              {
                transform: [
                  { translateX },
                  { translateY },
                  { scale },
                ],
                opacity,
              },
            ]}
          >
            <Text style={{ fontSize: h.size }}>{h.emoji}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

// -----------------------------------------------------------------------------
// 3. 메인 GiftEffectOverlay 컴포넌트
// -----------------------------------------------------------------------------
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
  const cardTilt = useRef(new Animated.Value(0)).current;

  // 비디오 소스 URL
  const [videoSource, setVideoSource] = useState(null);
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.muted = false;
  });

  // 큐에 선물 이벤트 추가 (FIFO)
  const enqueueGift = useCallback((giftEvent) => {
    if (!giftEvent) return;
    setQueue((prev) => [...prev, { ...giftEvent, qId: `q_${Date.now()}_${Math.random()}` }]);
  }, []);

  // 외부 ref 공개 API (대기열 추가 및 테스트 트리거)
  useImperativeHandle(ref, () => ({
    enqueueGift,
    triggerMockGift: (mock = {}) => {
      enqueueGift({
        giftId: mock.giftId || 'gift-fireworks',
        giftName: mock.giftName || '화려한 3D 폭죽',
        senderNickname: mock.senderNickname || '익명의 후원자',
        pricePoints: mock.pricePoints || 3000,
        thumbnailUrl:
          mock.thumbnailUrl ||
          'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=150',
        animationType: mock.animationType || 'fireworks',
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

      const effectType = getGiftEffectType(nextGift);
      if (effectType === 'alpha_video' && nextGift.animationUrl) {
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
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(bannerScale, {
        toValue: 0.8,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(effectScale, {
        toValue: 0.2,
        duration: 350,
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

    const effectType = getGiftEffectType(currentGift);

    // 초기화
    bannerAnim.setValue(0);
    bannerScale.setValue(0.7);
    effectScale.setValue(0.2);
    spinAnim.setValue(0);
    pulseAnim.setValue(1);
    cardTilt.setValue(0);

    // 아우라 회전 루프
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();

    // 펄스 루프
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 3D 틸트 바운스
    Animated.sequence([
      Animated.timing(cardTilt, {
        toValue: -1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardTilt, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(cardTilt, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // 등장 스프링 애니메이션
    Animated.parallel([
      Animated.timing(bannerAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.spring(bannerScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.spring(effectScale, {
        toValue: 1,
        friction: 5,
        tension: 75,
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

    // 최적 노출 시간
    const duration =
      effectType === 'alpha_video' || effectType === 'large'
        ? 4500
        : effectType === 'fireworks' || effectType === '3d_heart' || effectType === 'lottie'
        ? 3800
        : effectType === 'medium'
        ? 3200
        : 2600;

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
    cardTilt,
    finishCurrentEffect,
  ]);

  if (!currentGift) {
    return null;
  }

  const effectType = getGiftEffectType(currentGift);
  const isVideo = effectType === 'alpha_video' && Boolean(currentGift.animationUrl) && Boolean(player);
  const isLottie = effectType === 'lottie' && Boolean(currentGift.animationUrl);
  const isFireworks = effectType === 'fireworks';
  const is3DHeart = effectType === '3d_heart';
  const isVip = effectType === 'alpha_video' || effectType === 'large';

  const giftName = currentGift.giftName || currentGift.name || '선물';
  const senderNickname = currentGift.senderNickname || currentGift.senderName || '친구';
  const pricePoints = Number(currentGift.pricePoints || currentGift.amount || currentGift.points || 0);
  const thumbUrl = currentGift.thumbnailUrl || currentGift.icon;

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const tiltInterpolation = cardTilt.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  return (
    <View style={styles.overlayContainer} pointerEvents="none">
      {/* 1. 화면 전체 파티클 레이어 (폭죽 / 3D 하트) */}
      {isFireworks && <FireworksEffect isPlaying={isPlaying} />}
      {is3DHeart && <Exploding3DHeartsEffect isPlaying={isPlaying} />}

      {/* 2. 화면 중앙 3D 플로팅 스테이지 */}
      <View style={styles.stageAnchor}>
        <Animated.View
          style={[
            styles.effectStageBase,
            isVip && styles.largeStage,
            (isFireworks || is3DHeart || effectType === 'medium') && styles.mediumStage,
            effectType === 'small' && styles.smallStage,
            {
              opacity: bannerAnim,
              transform: [{ scale: effectScale }],
            },
          ]}
        >
          {/* 회전하는 황금빛 / 네온 아우라 링 */}
          <Animated.View
            style={[
              styles.auraRing,
              isFireworks && styles.fireworksAura,
              is3DHeart && styles.heartAura,
              isVip && styles.largeAura,
              {
                transform: [{ rotate: spinInterpolation }, { scale: pulseAnim }],
              },
            ]}
          />

          {/* VIP 전용 방사형 광선 (Radiant Light Rays) */}
          {isVip && (
            <Animated.View
              style={[
                styles.largeRadiantGlow,
                {
                  transform: [{ rotate: spinInterpolation }, { scale: pulseAnim }],
                },
              ]}
            />
          )}

          {/* 중앙 3D 선물 엠블럼 카드 */}
          <Animated.View
            style={[
              styles.iconContainerBase,
              isVip && styles.largeIconContainer,
              (isFireworks || is3DHeart || effectType === 'medium') && styles.mediumIconContainer,
              effectType === 'small' && styles.smallIconContainer,
              {
                transform: [{ rotate: tiltInterpolation }, { scale: pulseAnim }],
              },
            ]}
          >
            {/* Lottie 애니메이션 지원 */}
            {isLottie ? (
              <LottieView
                source={{ uri: currentGift.animationUrl }}
                autoPlay
                loop={false}
                style={styles.lottieView}
              />
            ) : thumbUrl ? (
              <Image
                source={{ uri: thumbUrl }}
                style={[
                  isVip && styles.largeThumb,
                  (isFireworks || is3DHeart || effectType === 'medium') && styles.mediumThumb,
                  effectType === 'small' && styles.smallThumb,
                ]}
                resizeMode="contain"
              />
            ) : (
              <Text style={{ fontSize: isVip ? 80 : 60 }}>
                {isFireworks ? '🎆' : is3DHeart ? '💖' : '🎁'}
              </Text>
            )}

            {/* 비디오 레이어 오버레이 (대형 VIP 비디오인 경우) */}
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

            {/* 상단 3D 뱃지 */}
            <View
              style={[
                styles.topBadge,
                isFireworks && { backgroundColor: '#F59E0B' },
                is3DHeart && { backgroundColor: '#EC4899' },
                isVip && { backgroundColor: '#DC2626' },
              ]}
            >
              <Text style={styles.topBadgeText}>
                {isFireworks ? '🎆 3D 폭죽' : is3DHeart ? '💖 3D 하트' : isVip ? '👑 3D VIP' : '✨ 3D'}
              </Text>
            </View>
          </Animated.View>

          {/* 스파클 파티클 장식 */}
          <View style={styles.particleContainer}>
            <Text style={[styles.sparkleParticle, styles.sparkleTopLeft]}>✨</Text>
            <Text style={[styles.sparkleParticle, styles.sparkleBottomRight]}>⭐</Text>
            <Text style={[styles.sparkleParticle, styles.sparkleTopRight]}>🌟</Text>
            <Text style={[styles.sparkleParticle, styles.sparkleBottomLeft]}>✨</Text>
          </View>
        </Animated.View>

        {/* 3. 이펙트 바로 하단에 밀착되는 화려한 글래스모피즘 후원 배너 */}
        <Animated.View
          style={[
            styles.bannerBadgeBase,
            isFireworks && styles.fireworksBannerBadge,
            is3DHeart && styles.heartBannerBadge,
            isVip && styles.largeBannerBadge,
            {
              opacity: bannerAnim,
              transform: [{ scale: bannerScale }],
            },
          ]}
        >
          {thumbUrl ? (
            <Image source={{ uri: thumbUrl }} style={styles.bannerBadgeThumb} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 20, marginRight: 8 }}>
              {isFireworks ? '🎆' : is3DHeart ? '💖' : '🎁'}
            </Text>
          )}

          <View style={styles.bannerBadgeTextCol}>
            <Text style={styles.bannerBadgeSenderText} numberOfLines={1}>
              <Text style={styles.senderHighlight}>{senderNickname}</Text>님의 따뜻한 후원
            </Text>
            <Text style={styles.bannerBadgeGiftText} numberOfLines={1}>
              <Text
                style={[
                  styles.bannerBadgeHighlight,
                  isFireworks && { color: '#FCD34D' },
                  is3DHeart && { color: '#F472B6' },
                  isVip && styles.vipHighlight,
                ]}
              >
                {giftName}
              </Text>
              {pricePoints > 0 ? ` (${pricePoints.toLocaleString()} 온)` : ''}이 도착했습니다!
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
    zIndex: 999999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  absoluteCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageAnchor: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---------------------------------------------------------------------------
  // 폭죽 & 하트 파티클 스타일
  // ---------------------------------------------------------------------------
  shockwaveRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: 'rgba(255, 215, 0, 0.9)',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  fireworkSpark: {
    position: 'absolute',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
  heartItem: {
    position: 'absolute',
  },

  // ---------------------------------------------------------------------------
  // 그래픽 이펙트 스테이지 규격
  // ---------------------------------------------------------------------------
  effectStageBase: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  smallStage: {
    width: 140,
    height: 140,
  },
  mediumStage: {
    width: 220,
    height: 220,
  },
  largeStage: {
    width: 300,
    height: 300,
  },

  // ---------------------------------------------------------------------------
  // 아우라 링 & 광채 효과
  // ---------------------------------------------------------------------------
  auraRing: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 999,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: 'rgba(251, 191, 36, 0.9)',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 8,
  },
  fireworksAura: {
    width: 220,
    height: 220,
    borderColor: 'rgba(245, 158, 11, 0.95)',
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    shadowColor: '#EF4444',
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 12,
  },
  heartAura: {
    width: 210,
    height: 210,
    borderColor: 'rgba(236, 72, 153, 0.95)',
    backgroundColor: 'rgba(236, 72, 153, 0.16)',
    shadowColor: '#EC4899',
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 12,
  },
  largeAura: {
    width: 280,
    height: 280,
    borderWidth: 4,
    borderColor: 'rgba(245, 158, 11, 0.95)',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    shadowColor: '#EAB308',
    shadowOpacity: 0.9,
    shadowRadius: 30,
    elevation: 16,
  },
  largeRadiantGlow: {
    position: 'absolute',
    width: 290,
    height: 290,
    borderRadius: 145,
    borderWidth: 2.5,
    borderStyle: 'dotted',
    borderColor: 'rgba(254, 240, 138, 0.7)',
    backgroundColor: 'rgba(254, 240, 138, 0.18)',
  },

  // ---------------------------------------------------------------------------
  // 중앙 3D 엠블럼 카드
  // ---------------------------------------------------------------------------
  iconContainerBase: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 14,
  },
  smallIconContainer: {
    width: 100,
    height: 100,
    borderWidth: 3,
    borderColor: '#FBBF24',
  },
  mediumIconContainer: {
    width: 150,
    height: 150,
    borderWidth: 4,
    borderColor: '#F59E0B',
  },
  largeIconContainer: {
    width: 190,
    height: 190,
    borderWidth: 5,
    borderColor: '#EAB308',
  },

  smallThumb: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  mediumThumb: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  largeThumb: {
    width: 145,
    height: 145,
    borderRadius: 72,
  },

  lottieView: {
    width: 140,
    height: 140,
  },

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

  // 상단 3D 뱃지
  topBadge: {
    position: 'absolute',
    top: -15,
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  topBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  // 파티클 장식
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  sparkleParticle: {
    position: 'absolute',
    fontSize: 22,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sparkleTopLeft: {
    top: 0,
    left: 2,
  },
  sparkleTopRight: {
    top: 4,
    right: 2,
  },
  sparkleBottomRight: {
    bottom: 2,
    right: 4,
  },
  sparkleBottomLeft: {
    bottom: 4,
    left: 2,
  },

  // ---------------------------------------------------------------------------
  // 하단 후원 알림 배너 뱃지
  // ---------------------------------------------------------------------------
  bannerBadgeBase: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 18,
    maxWidth: SCREEN_WIDTH * 0.92,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
  },
  fireworksBannerBadge: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(17, 24, 39, 0.96)',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  heartBannerBadge: {
    borderColor: '#EC4899',
    backgroundColor: 'rgba(24, 15, 30, 0.96)',
    shadowColor: '#EC4899',
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  largeBannerBadge: {
    borderWidth: 2.5,
    borderColor: '#EAB308',
    backgroundColor: 'rgba(17, 24, 39, 0.97)',
    paddingVertical: 12,
    paddingHorizontal: 22,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 16,
  },
  bannerBadgeThumb: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 12,
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
  senderHighlight: {
    color: '#F9FAFB',
    fontWeight: '800',
  },
  bannerBadgeGiftText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  bannerBadgeHighlight: {
    color: '#FBBF24',
    fontWeight: '900',
  },
  vipHighlight: {
    color: '#FEF08A',
    fontWeight: '900',
  },
});
