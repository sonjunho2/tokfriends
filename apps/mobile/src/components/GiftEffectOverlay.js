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
 * -----------------------------------------------------------------------------
 * 선물 금액(포인트) 기반 3단계 티어(Tier) 산정 유틸 (틱톡/비고라이브 스타일)
 * -----------------------------------------------------------------------------
 * [1단계 - 소형 (Tier 1)]: 100P ~ 1,000P (따뜻한 커피, 꽃다발, 아이스크림, 케이크 등)
 * [2단계 - 중형 (Tier 2)]: 3,000P ~ 10,000P (네온 슈퍼카, 화려한 3D 폭죽, 샴페인, 다이아몬드 등)
 * [3단계 - 대형 (Tier 3)]: 30,000P 이상 (골드 드래곤 등 화면 전체를 압도하는 초대형 3D 특수 연출)
 */
export const getGiftTier = (gift) => {
  if (!gift) return 1;

  // 명시적 tier / level 전달 시 우선 적용
  if (gift.tier === 1 || gift.tier === 2 || gift.tier === 3) {
    return gift.tier;
  }
  if (gift.level === 1 || gift.level === 2 || gift.level === 3) {
    return gift.level;
  }

  const points = Number(
    gift.pricePoints ?? gift.amount ?? gift.points ?? gift.giftPoints ?? 0
  );
  const name = String(gift.giftName || gift.name || '').toLowerCase();
  const type = String(gift.animationType || '').toLowerCase();

  // [3단계 - 대형]: 30,000P 이상 또는 골드 드래곤 등 초대형 특수 연출
  if (
    points >= 30000 ||
    name.includes('드래곤') ||
    name.includes('dragon') ||
    type === 'dragon' ||
    type === 'large_vip' ||
    type === 'tier3'
  ) {
    return 3;
  }

  // [2단계 - 중형]: 3,000P ~ 10,000P (폭죽, 슈퍼카, 샴페인, 다이아몬드 등)
  if (
    points >= 3000 ||
    name.includes('슈퍼카') ||
    name.includes('폭죽') ||
    name.includes('샴페인') ||
    name.includes('다이아몬드') ||
    name.includes('supercar') ||
    type === 'fireworks' ||
    type === 'supercar' ||
    type === 'tier2'
  ) {
    return 2;
  }

  // [1단계 - 소형]: 100P ~ 1,000P (따뜻한 커피, 꽃다발 등 기본)
  return 1;
};

/**
 * 하위 호환용 이펙트 타입 산정 유틸
 */
export const getGiftEffectType = (gift) => {
  if (!gift) return 'small';
  const tier = getGiftTier(gift);
  if (tier === 3) return 'large';
  if (tier === 2) return 'medium';

  const type = String(gift.animationType || '').toLowerCase();
  if (type === 'fireworks') return 'fireworks';
  if (type === '3d_heart') return '3d_heart';
  if (type === 'lottie' || (gift.animationUrl && gift.animationUrl.endsWith('.json'))) return 'lottie';
  if (type === 'alpha_video' || (gift.animationUrl && !gift.animationUrl.endsWith('.json'))) return 'alpha_video';
  return 'small';
};

/**
 * 포인트 금액에 따른 동적 크기(Scale) 보정 배율 계산
 */
const calculateDynamicScale = (tier, points) => {
  if (tier === 3) {
    // 초대형 3단계: 기본 1.45배 ~ 최대 1.75배
    const extra = Math.min(0.3, Math.max(0, (points - 30000) / 70000) * 0.3);
    return 1.45 + extra;
  }
  if (tier === 2) {
    // 중형 2단계: 기본 1.15배 ~ 최대 1.35배
    const extra = Math.min(0.2, Math.max(0, (points - 3000) / 27000) * 0.2);
    return 1.15 + extra;
  }
  // 소형 1단계: 기본 0.9배 ~ 최대 1.05배
  const extra = Math.min(0.15, Math.max(0, points / 2000) * 0.15);
  return 0.9 + extra;
};

// -----------------------------------------------------------------------------
// [1단계 파티클] 귀엽고 아기자기한 플로팅 스파클 & 하트 이펙트
// -----------------------------------------------------------------------------
const TIER1_PARTICLE_COUNT = 14;
const TIER1_EMOJIS = ['✨', '💖', '🌸', '⭐', '☕', '🌷', '✨', '💕'];

function Tier1CuteSparklesEffect({ isPlaying }) {
  const particles = useRef(
    Array.from({ length: TIER1_PARTICLE_COUNT }, (_, index) => {
      const angle = (index / TIER1_PARTICLE_COUNT) * 2 * Math.PI;
      const distance = 55 + (index % 3) * 25;
      return {
        id: index,
        emoji: TIER1_EMOJIS[index % TIER1_EMOJIS.length],
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 35, // 상공으로 살짝 떠오름
        size: 16 + (index % 4) * 4,
        anim: new Animated.Value(0),
        delay: (index % 4) * 90,
      };
    })
  ).current;

  useEffect(() => {
    if (!isPlaying) return;
    const anims = particles.map((p) => {
      p.anim.setValue(0);
      return Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(p.anim, {
          toValue: 1,
          duration: 1600 + Math.random() * 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
    });
    Animated.parallel(anims).start();
  }, [isPlaying, particles]);

  if (!isPlaying) return null;

  return (
    <View style={styles.absoluteCenter} pointerEvents="none">
      {particles.map((p) => {
        const translateX = p.anim.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0, p.x * 0.7, p.x],
        });
        const translateY = p.anim.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0, p.y * 0.7, p.y - 30],
        });
        const scale = p.anim.interpolate({
          inputRange: [0, 0.2, 0.8, 1],
          outputRange: [0.1, 1.2, 0.95, 0],
        });
        const opacity = p.anim.interpolate({
          inputRange: [0, 0.15, 0.8, 1],
          outputRange: [0, 1, 0.9, 0],
        });

        return (
          <Animated.View
            key={`t1_p_${p.id}`}
            style={[
              styles.sparkleItem,
              {
                transform: [{ translateX }, { translateY }, { scale }],
                opacity,
              },
            ]}
          >
            <Text style={{ fontSize: p.size }}>{p.emoji}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

// -----------------------------------------------------------------------------
// [2단계 파티클] 360도 화려한 3D 입체 폭죽쇼 & 네온 쇼크웨이브
// -----------------------------------------------------------------------------
const TIER2_PARTICLE_COUNT = 36;
const TIER2_COLORS = [
  '#FFD700',
  '#FF3B6B',
  '#00F0FF',
  '#FF8500',
  '#A855F7',
  '#FFFFFF',
  '#4ADE80',
  '#F43F5E',
];

function Tier2FireworksEffect({ isPlaying }) {
  const particles = useRef(
    Array.from({ length: TIER2_PARTICLE_COUNT }, (_, index) => {
      const angle = (index / TIER2_PARTICLE_COUNT) * 2 * Math.PI + (Math.random() * 0.3 - 0.15);
      const distance = 90 + Math.random() * 160;
      return {
        id: index,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 25,
        color: TIER2_COLORS[index % TIER2_COLORS.length],
        size: 6 + Math.random() * 7,
        anim: new Animated.Value(0),
        delay: (index % 5) * 60,
      };
    })
  ).current;

  const shockwaveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isPlaying) return;

    shockwaveAnim.setValue(0);
    Animated.timing(shockwaveAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    const anims = particles.map((p) => {
      p.anim.setValue(0);
      return Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(p.anim, {
          toValue: 1,
          duration: 1800 + Math.random() * 400,
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
    outputRange: [0.3, 3.2],
  });
  const shockwaveOpacity = shockwaveAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.95, 0.6, 0],
  });

  return (
    <View style={styles.absoluteCenter} pointerEvents="none">
      {/* 네온 쇼크웨이브 링 */}
      <Animated.View
        style={[
          styles.shockwaveRingTier2,
          {
            transform: [{ scale: shockwaveScale }],
            opacity: shockwaveOpacity,
          },
        ]}
      />

      {/* 360도 방사형 파티클 */}
      {particles.map((p) => {
        const translateX = p.anim.interpolate({
          inputRange: [0, 0.35, 1],
          outputRange: [0, p.x * 0.7, p.x],
        });
        const translateY = p.anim.interpolate({
          inputRange: [0, 0.35, 0.75, 1],
          outputRange: [0, p.y * 0.7, p.y, p.y + 35],
        });
        const scale = p.anim.interpolate({
          inputRange: [0, 0.2, 0.8, 1],
          outputRange: [0, 1.4, 0.9, 0],
        });
        const opacity = p.anim.interpolate({
          inputRange: [0, 0.1, 0.85, 1],
          outputRange: [0, 1, 0.85, 0],
        });

        return (
          <Animated.View
            key={`t2_fw_${p.id}`}
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
// [3단계 파티클] 화면을 압도하는 골드 드래곤 파이어 폭풍 & 듀얼 메가 쇼크웨이브
// -----------------------------------------------------------------------------
const TIER3_EMBER_COUNT = 48;
const TIER3_COLORS = ['#FFD700', '#F59E0B', '#EF4444', '#FEF08A', '#F97316', '#FFFFFF'];
const TIER3_SYMBOLS = ['🔥', '⚡', '✨', '🌟', '👑', '💫'];

function Tier3GoldenDragonStormEffect({ isPlaying }) {
  const embers = useRef(
    Array.from({ length: TIER3_EMBER_COUNT }, (_, index) => {
      const angle = (index / TIER3_EMBER_COUNT) * 2 * Math.PI;
      const distance = 110 + Math.random() * 200;
      return {
        id: index,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - (40 + Math.random() * 80), // 용의 불꽃처럼 치솟음
        color: TIER3_COLORS[index % TIER3_COLORS.length],
        symbol: TIER3_SYMBOLS[index % TIER3_SYMBOLS.length],
        isSymbol: index % 3 === 0,
        size: index % 3 === 0 ? 20 + (index % 3) * 6 : 7 + Math.random() * 8,
        anim: new Animated.Value(0),
        delay: (index % 6) * 70,
      };
    })
  ).current;

  const shockwave1 = useRef(new Animated.Value(0)).current;
  const shockwave2 = useRef(new Animated.Value(0)).current;
  const sunburstRot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isPlaying) return;

    // 1차 메가 쇼크웨이브
    shockwave1.setValue(0);
    Animated.timing(shockwave1, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // 2차 골든 쇼크웨이브
    shockwave2.setValue(0);
    Animated.sequence([
      Animated.delay(250),
      Animated.timing(shockwave2, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // 썬버스트 광선 회전
    sunburstRot.setValue(0);
    const sunburstAnim = Animated.loop(
      Animated.timing(sunburstRot, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    sunburstAnim.start();

    // 골든 드래곤 파이어 엠버 폭풍
    const anims = embers.map((e) => {
      e.anim.setValue(0);
      return Animated.sequence([
        Animated.delay(e.delay),
        Animated.timing(e.anim, {
          toValue: 1,
          duration: 2200 + Math.random() * 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
    });
    Animated.parallel(anims).start();

    return () => {
      sunburstAnim.stop();
    };
  }, [isPlaying, embers, shockwave1, shockwave2, sunburstRot]);

  if (!isPlaying) return null;

  const sw1Scale = shockwave1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 4.2],
  });
  const sw1Opacity = shockwave1.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [1, 0.7, 0],
  });

  const sw2Scale = shockwave2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 5.0],
  });
  const sw2Opacity = shockwave2.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.9, 0.5, 0],
  });

  const sunburstAngle = sunburstRot.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.absoluteCenter} pointerEvents="none">
      {/* 360도 황금빛 갓레이 (God Rays / Sunburst Beams) */}
      <Animated.View
        style={[
          styles.sunburstBeams,
          {
            transform: [{ rotate: sunburstAngle }],
          },
        ]}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <View
            key={`sunbeam_${i}`}
            style={[
              styles.sunbeamRay,
              {
                transform: [{ rotate: `${i * 45}deg` }],
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* 1차 골드 쇼크웨이브 링 */}
      <Animated.View
        style={[
          styles.megaShockwave1,
          {
            transform: [{ scale: sw1Scale }],
            opacity: sw1Opacity,
          },
        ]}
      />

      {/* 2차 루비/엠버 쇼크웨이브 링 */}
      <Animated.View
        style={[
          styles.megaShockwave2,
          {
            transform: [{ scale: sw2Scale }],
            opacity: sw2Opacity,
          },
        ]}
      />

      {/* 48개 골든 드래곤 파이어 & 심볼 파티클 */}
      {embers.map((e) => {
        const translateX = e.anim.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0, e.x * 0.6, e.x],
        });
        const translateY = e.anim.interpolate({
          inputRange: [0, 0.3, 0.7, 1],
          outputRange: [0, e.y * 0.6, e.y, e.y - 40], // 위로 승천
        });
        const scale = e.anim.interpolate({
          inputRange: [0, 0.2, 0.75, 1],
          outputRange: [0.1, 1.5, 1.1, 0],
        });
        const opacity = e.anim.interpolate({
          inputRange: [0, 0.1, 0.8, 1],
          outputRange: [0, 1, 0.9, 0],
        });

        if (e.isSymbol) {
          return (
            <Animated.View
              key={`t3_sym_${e.id}`}
              style={[
                styles.sparkleItem,
                {
                  transform: [{ translateX }, { translateY }, { scale }],
                  opacity,
                },
              ]}
            >
              <Text style={{ fontSize: e.size }}>{e.symbol}</Text>
            </Animated.View>
          );
        }

        return (
          <Animated.View
            key={`t3_emb_${e.id}`}
            style={[
              styles.dragonEmber,
              {
                width: e.size,
                height: e.size,
                borderRadius: e.size / 2,
                backgroundColor: e.color,
                shadowColor: e.color,
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
// 메인 GiftEffectOverlay 컴포넌트
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
  const screenShakeAnim = useRef(new Animated.Value(0)).current;
  const ambientDimAnim = useRef(new Animated.Value(0)).current;

  // 비디오 소스 URL
  const [videoSource, setVideoSource] = useState(null);
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.muted = false;
  });

  // 큐에 선물 이벤트 추가 (FIFO)
  const enqueueGift = useCallback((giftEvent) => {
    if (!giftEvent) return;
    setQueue((prev) => [
      ...prev,
      {
        ...giftEvent,
        qId: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      },
    ]);
  }, []);

  // 외부 ref 공개 API (대기열 추가 및 단계별 테스트 트리거 지원)
  useImperativeHandle(ref, () => ({
    enqueueGift,
    triggerMockGift: (option = 2) => {
      // 1, 2, 3 단계 직접 지정 또는 Mock 객체 지원
      const tierChoice =
        typeof option === 'number'
          ? option
          : option?.tier || (option?.pricePoints >= 30000 ? 3 : option?.pricePoints >= 3000 ? 2 : 1);

      if (tierChoice === 1) {
        // [1단계 - 소형 (100P)]: 따뜻한 커피
        enqueueGift({
          giftId: 'mock-coffee',
          giftName: '따뜻한 커피',
          senderNickname: '마음천사',
          pricePoints: 100,
          thumbnailUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150',
          tier: 1,
        });
      } else if (tierChoice === 3) {
        // [3단계 - 대형 (50,000P)]: 골든 드래곤
        enqueueGift({
          giftId: 'mock-dragon',
          giftName: '골든 드래곤 (3D VIP)',
          senderNickname: 'VIP회장님',
          pricePoints: 50000,
          thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150',
          animationUrl:
            'https://assets.mixkit.co/videos/preview/mixkit-fire-sparks-rising-in-the-dark-42352-large.mp4',
          animationType: 'alpha_video',
          tier: 3,
        });
      } else {
        // [2단계 - 중형 (3,000P)]: 화려한 3D 폭죽
        enqueueGift({
          giftId: 'mock-fireworks',
          giftName: '화려한 3D 폭죽',
          senderNickname: '축제요정',
          pricePoints: 3000,
          thumbnailUrl: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=150',
          animationType: 'fireworks',
          tier: 2,
        });
      }
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

      const tier = getGiftTier(nextGift);
      if (
        (tier === 3 || nextGift.animationType === 'alpha_video') &&
        nextGift.animationUrl &&
        !nextGift.animationUrl.endsWith('.json')
      ) {
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
        toValue: 0.15,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(ambientDimAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsPlaying(false);
      setCurrentGift(null);
      setVideoSource(null);
      screenShakeAnim.setValue(0);
      if (onEffectEnd) onEffectEnd();
    });
  }, [bannerAnim, bannerScale, effectScale, ambientDimAnim, screenShakeAnim, onEffectEnd]);

  // 이펙트 애니메이션 및 재생 라이프사이클
  useEffect(() => {
    if (!currentGift) return;

    const tier = getGiftTier(currentGift);
    const points = Number(
      currentGift.pricePoints ?? currentGift.amount ?? currentGift.points ?? 0
    );
    const dynamicTargetScale = calculateDynamicScale(tier, points);

    // 초기화
    bannerAnim.setValue(0);
    bannerScale.setValue(0.7);
    effectScale.setValue(0.1);
    spinAnim.setValue(0);
    pulseAnim.setValue(1);
    cardTilt.setValue(0);
    screenShakeAnim.setValue(0);
    ambientDimAnim.setValue(0);

    // 아우라 회전 루프 (대형일수록 더 빠르고 웅장하게 회전)
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: tier === 3 ? 3000 : tier === 2 ? 4000 : 5500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();

    // 펄스 루프
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: tier === 3 ? 1.14 : tier === 2 ? 1.08 : 1.05,
          duration: tier === 3 ? 550 : 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.96,
          duration: tier === 3 ? 550 : 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 3단계 전용 시네마틱 백드롭 딤 & 화면 쉐이크 연출
    if (tier === 3) {
      Animated.timing(ambientDimAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      Animated.sequence([
        Animated.timing(screenShakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(screenShakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(screenShakeAnim, { toValue: -4, duration: 60, useNativeDriver: true }),
        Animated.timing(screenShakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
        Animated.timing(screenShakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]).start();
    }

    // 3D 틸트 바운스
    Animated.sequence([
      Animated.timing(cardTilt, {
        toValue: -1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(cardTilt, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(cardTilt, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();

    // 등장 스프링 애니메이션 (포인트에 비례한 동적 스케일로 확장)
    Animated.parallel([
      Animated.timing(bannerAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.spring(bannerScale, {
        toValue: 1,
        friction: tier === 3 ? 5 : 6,
        tension: 85,
        useNativeDriver: true,
      }),
      Animated.spring(effectScale, {
        toValue: dynamicTargetScale,
        friction: tier === 3 ? 4.5 : 5.5,
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

    // 단계별 노출 지속 시간: 1단계 ~2.4초 / 2단계 ~3.4초 / 3단계 ~4.8초
    const displayDuration = tier === 3 ? 4800 : tier === 2 ? 3400 : 2400;

    const timer = setTimeout(() => {
      spinLoop.stop();
      pulseLoop.stop();
      finishCurrentEffect();
    }, displayDuration);

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
    screenShakeAnim,
    ambientDimAnim,
    finishCurrentEffect,
  ]);

  if (!currentGift) {
    return null;
  }

  const tier = getGiftTier(currentGift);
  const giftName = currentGift.giftName || currentGift.name || '선물';
  const senderNickname = currentGift.senderNickname || currentGift.senderName || '친구';
  const pricePoints = Number(
    currentGift.pricePoints ?? currentGift.amount ?? currentGift.points ?? 0
  );
  const thumbUrl = currentGift.thumbnailUrl || currentGift.icon;

  const isVideo = Boolean(videoSource) && Boolean(player);
  const isLottie = Boolean(currentGift.animationUrl?.endsWith('.json'));

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const tiltInterpolation = cardTilt.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: tier === 3 ? ['-14deg', '0deg', '14deg'] : ['-10deg', '0deg', '10deg'],
  });

  return (
    <View style={styles.overlayContainer} pointerEvents="none">
      {/* 3단계 전용 시네마틱 앰비언트 암전 & 골든 네뷸라 백드롭 */}
      {tier === 3 && (
        <Animated.View
          style={[
            styles.cinematicVeil,
            {
              opacity: ambientDimAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.65],
              }),
            },
          ]}
        />
      )}

      {/* 단계별 파티클 시스템 */}
      {tier === 1 && <Tier1CuteSparklesEffect isPlaying={isPlaying} />}
      {tier === 2 && <Tier2FireworksEffect isPlaying={isPlaying} />}
      {tier === 3 && <Tier3GoldenDragonStormEffect isPlaying={isPlaying} />}

      {/* 화면 진동 쉐이크 및 3D 플로팅 스테이지 컨테이너 */}
      <Animated.View
        style={[
          styles.stageAnchor,
          {
            transform: [{ translateX: screenShakeAnim }],
          },
        ]}
      >
        {/* 중앙 3D 입체 스테이지 */}
        <Animated.View
          style={[
            styles.effectStageBase,
            tier === 1 && styles.stageTier1,
            tier === 2 && styles.stageTier2,
            tier === 3 && styles.stageTier3,
            {
              opacity: bannerAnim,
              transform: [{ scale: effectScale }],
            },
          ]}
        >
          {/* 회전하는 아우라 링 (단계별 광채 차등화) */}
          <Animated.View
            style={[
              styles.auraRingBase,
              tier === 1 && styles.auraTier1,
              tier === 2 && styles.auraTier2,
              tier === 3 && styles.auraTier3,
              {
                transform: [{ rotate: spinInterpolation }, { scale: pulseAnim }],
              },
            ]}
          />

          {/* 3단계 대형 전용 다이아몬드 글로우 링 */}
          {tier === 3 && (
            <Animated.View
              style={[
                styles.largeRadiantGlowRing,
                {
                  transform: [
                    {
                      rotate: spinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['360deg', '0deg'], // 역회전
                      }),
                    },
                    { scale: pulseAnim },
                  ],
                },
              ]}
            />
          )}

          {/* 중앙 3D 선물 엠블럼 카드 */}
          <Animated.View
            style={[
              styles.iconContainerBase,
              tier === 1 && styles.iconContainerTier1,
              tier === 2 && styles.iconContainerTier2,
              tier === 3 && styles.iconContainerTier3,
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
                style={[
                  tier === 1 && styles.lottieTier1,
                  tier === 2 && styles.lottieTier2,
                  tier === 3 && styles.lottieTier3,
                ]}
              />
            ) : thumbUrl ? (
              <Image
                source={{ uri: thumbUrl }}
                style={[
                  tier === 1 && styles.thumbTier1,
                  tier === 2 && styles.thumbTier2,
                  tier === 3 && styles.thumbTier3,
                ]}
                resizeMode="contain"
              />
            ) : (
              <Text style={{ fontSize: tier === 3 ? 90 : tier === 2 ? 65 : 44 }}>
                {tier === 3 ? '🐉' : tier === 2 ? '🎆' : '🎁'}
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

            {/* 단계별 상단 3D 뱃지 */}
            <View
              style={[
                styles.topBadgeBase,
                tier === 1 && styles.topBadgeTier1,
                tier === 2 && styles.topBadgeTier2,
                tier === 3 && styles.topBadgeTier3,
              ]}
            >
              <Text style={styles.topBadgeText}>
                {tier === 3
                  ? '👑 3단계 LEGENDARY VIP'
                  : tier === 2
                  ? '🎆 2단계 SPECIAL'
                  : '🌸 1단계 BASIC'}
              </Text>
            </View>
          </Animated.View>

          {/* 미세 스파클 반짝임 장식 */}
          <View style={styles.particleContainer}>
            <Text style={[styles.sparkleParticle, styles.sparkleTopLeft]}>✨</Text>
            <Text style={[styles.sparkleParticle, styles.sparkleBottomRight]}>⭐</Text>
            <Text style={[styles.sparkleParticle, styles.sparkleTopRight]}>🌟</Text>
            <Text style={[styles.sparkleParticle, styles.sparkleBottomLeft]}>✨</Text>
          </View>
        </Animated.View>

        {/* 하단 글래스모피즘 후원 배너 (단계별 테두리 및 텍스트 하이라이트 차등) */}
        <Animated.View
          style={[
            styles.bannerBadgeBase,
            tier === 1 && styles.bannerBadgeTier1,
            tier === 2 && styles.bannerBadgeTier2,
            tier === 3 && styles.bannerBadgeTier3,
            {
              opacity: bannerAnim,
              transform: [{ scale: bannerScale }],
            },
          ]}
        >
          {thumbUrl ? (
            <Image source={{ uri: thumbUrl }} style={styles.bannerBadgeThumb} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 22, marginRight: 8 }}>
              {tier === 3 ? '🐉' : tier === 2 ? '🎆' : '🎁'}
            </Text>
          )}

          <View style={styles.bannerBadgeTextCol}>
            <Text style={styles.bannerBadgeSenderText} numberOfLines={1}>
              <Text style={styles.senderHighlight}>{senderNickname}</Text>님의{' '}
              {tier === 3 ? '위대한 후원 👑' : tier === 2 ? '화려한 후원 🔥' : '따뜻한 선물 🎁'}
            </Text>
            <Text style={styles.bannerBadgeGiftText} numberOfLines={1}>
              <Text
                style={[
                  styles.bannerBadgeHighlight,
                  tier === 1 && styles.highlightTier1,
                  tier === 2 && styles.highlightTier2,
                  tier === 3 && styles.highlightTier3,
                ]}
              >
                {giftName}
              </Text>
              {pricePoints > 0 ? ` (${pricePoints.toLocaleString()} 온)` : ''}이 도착했습니다!
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
});

GiftEffectOverlay.displayName = 'GiftEffectOverlay';

export default GiftEffectOverlay;

const styles = StyleSheet.create({
  // ---------------------------------------------------------------------------
  // 최상단 투명 오버레이 컨테이너:
  // 절대 위치(position: absolute)로 전체 화면을 덮으며,
  // 어떠한 경우에도 하단 채팅 입력창이나 메시지 리스트의 레이아웃을 밀어내지 않습니다.
  // ---------------------------------------------------------------------------
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 999999,
    elevation: 999999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    pointerEvents: 'none',
  },
  absoluteCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  stageAnchor: {
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },

  // 3단계 시네마틱 다크 백드롭
  cinematicVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#050301',
    pointerEvents: 'none',
  },

  // ---------------------------------------------------------------------------
  // 단계별 3D 플로팅 스테이지 규격
  // ---------------------------------------------------------------------------
  effectStageBase: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  stageTier1: {
    width: 130,
    height: 130,
  },
  stageTier2: {
    width: 195,
    height: 195,
  },
  stageTier3: {
    width: 270,
    height: 270,
  },

  // ---------------------------------------------------------------------------
  // 단계별 아우라 링 & 글로우 효과
  // ---------------------------------------------------------------------------
  auraRingBase: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 3,
  },
  auraTier1: {
    width: 130,
    height: 130,
    borderStyle: 'dashed',
    borderColor: 'rgba(251, 146, 60, 0.75)',
    backgroundColor: 'rgba(251, 146, 60, 0.08)',
    shadowColor: '#F97316',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  auraTier2: {
    width: 195,
    height: 195,
    borderStyle: 'dashed',
    borderWidth: 3.5,
    borderColor: 'rgba(245, 158, 11, 0.95)',
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.75,
    shadowRadius: 20,
    elevation: 12,
  },
  auraTier3: {
    width: 270,
    height: 270,
    borderWidth: 5,
    borderColor: 'rgba(255, 215, 0, 0.98)',
    backgroundColor: 'rgba(245, 158, 11, 0.24)',
    shadowColor: '#EF4444',
    shadowOpacity: 0.95,
    shadowRadius: 32,
    elevation: 20,
  },
  largeRadiantGlowRing: {
    position: 'absolute',
    width: 285,
    height: 285,
    borderRadius: 142.5,
    borderWidth: 2.5,
    borderStyle: 'dotted',
    borderColor: 'rgba(254, 240, 138, 0.85)',
    backgroundColor: 'transparent',
  },

  // ---------------------------------------------------------------------------
  // 3단계 썬버스트 갓레이 (God Rays)
  // ---------------------------------------------------------------------------
  sunburstBeams: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_WIDTH * 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  sunbeamRay: {
    position: 'absolute',
    width: 4,
    height: SCREEN_WIDTH * 1.1,
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
    borderRadius: 2,
  },

  // ---------------------------------------------------------------------------
  // 쇼크웨이브 링 & 파티클 스타일
  // ---------------------------------------------------------------------------
  shockwaveRingTier2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: 'rgba(255, 215, 0, 0.9)',
    backgroundColor: 'rgba(255, 215, 0, 0.14)',
  },
  megaShockwave1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 5,
    borderColor: 'rgba(255, 215, 0, 0.95)',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  megaShockwave2: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 3.5,
    borderColor: 'rgba(239, 68, 68, 0.85)',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  fireworkSpark: {
    position: 'absolute',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
  dragonEmber: {
    position: 'absolute',
    shadowOpacity: 0.95,
    shadowRadius: 10,
    elevation: 10,
  },
  sparkleItem: {
    position: 'absolute',
  },

  // ---------------------------------------------------------------------------
  // 중앙 3D 엠블럼 카드 규격
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
  iconContainerTier1: {
    width: 88,
    height: 88,
    borderWidth: 2.5,
    borderColor: '#FB923C',
  },
  iconContainerTier2: {
    width: 135,
    height: 135,
    borderWidth: 4,
    borderColor: '#F59E0B',
  },
  iconContainerTier3: {
    width: 195,
    height: 195,
    borderWidth: 5.5,
    borderColor: '#EAB308',
  },

  thumbTier1: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  thumbTier2: {
    width: 98,
    height: 98,
    borderRadius: 49,
  },
  thumbTier3: {
    width: 145,
    height: 145,
    borderRadius: 72.5,
  },

  lottieTier1: {
    width: 75,
    height: 75,
  },
  lottieTier2: {
    width: 120,
    height: 120,
  },
  lottieTier3: {
    width: 175,
    height: 175,
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
  topBadgeBase: {
    position: 'absolute',
    top: -14,
    paddingHorizontal: 11,
    paddingVertical: 3.5,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  topBadgeTier1: {
    backgroundColor: '#F97316',
    borderColor: '#FFEDD5',
  },
  topBadgeTier2: {
    backgroundColor: '#EA580C',
    borderColor: '#FEF08A',
  },
  topBadgeTier3: {
    backgroundColor: '#DC2626',
    borderColor: '#FEF08A',
    paddingHorizontal: 14,
    paddingVertical: 4.5,
  },
  topBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  // 미세 파티클
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  sparkleParticle: {
    position: 'absolute',
    fontSize: 20,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sparkleTopLeft: {
    top: 2,
    left: 4,
  },
  sparkleTopRight: {
    top: 4,
    right: 4,
  },
  sparkleBottomRight: {
    bottom: 4,
    right: 4,
  },
  sparkleBottomLeft: {
    bottom: 4,
    left: 4,
  },

  // ---------------------------------------------------------------------------
  // 하단 글래스모피즘 후원 배너 규격
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
  },
  bannerBadgeTier1: {
    borderColor: 'rgba(251, 146, 60, 0.8)',
    backgroundColor: 'rgba(23, 23, 23, 0.94)',
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  bannerBadgeTier2: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(17, 24, 39, 0.96)',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.65,
    shadowRadius: 16,
  },
  bannerBadgeTier3: {
    borderWidth: 2.5,
    borderColor: '#EAB308',
    backgroundColor: 'rgba(15, 12, 10, 0.98)',
    paddingVertical: 13,
    paddingHorizontal: 22,
    shadowColor: '#EAB308',
    shadowOpacity: 0.85,
    shadowRadius: 24,
    elevation: 18,
  },

  bannerBadgeThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontWeight: '900',
  },
  highlightTier1: {
    color: '#FB923C',
  },
  highlightTier2: {
    color: '#FBBF24',
  },
  highlightTier3: {
    color: '#FEF08A',
  },
});
