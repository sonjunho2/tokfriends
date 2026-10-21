import React, {
  memo,
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface GiftItem {
  id: string;
  senderName: string;
  senderAvatar?: string;
  giftName: string;
  points: number;
  effectTier?: 1 | 2 | 3;
  animationUrl?: string;
  thumbnailUrl?: string;
}

export interface GiftOverlayProps {
  currentGift?: GiftItem | null;
  onAnimationFinish?: () => void;
  onAnimationEnd?: () => void;
}

export interface GiftOverlayRef {
  showGift: (gift: GiftItem) => void;
  enqueueGift: (gift: any) => void;
  clearQueue: () => void;
}

// Tier determination based on points
const getTier = (points: number, explicitTier?: number): 1 | 2 | 3 => {
  if (explicitTier === 1 || explicitTier === 2 || explicitTier === 3) {
    return explicitTier;
  }
  if (points >= 30000) return 3;
  if (points >= 3000) return 2;
  return 1;
};

export const GiftOverlay = memo(
  forwardRef<GiftOverlayRef, GiftOverlayProps>(
    ({ currentGift: propGift, onAnimationFinish, onAnimationEnd }, ref) => {
      const [activeGift, setActiveGift] = useState<GiftItem | null>(null);
      const queueRef = useRef<GiftItem[]>([]);

      const handleEnd = useCallback(() => {
        setActiveGift(null);
        if (onAnimationFinish) {
          onAnimationFinish();
        } else if (onAnimationEnd) {
          onAnimationEnd();
        }

        // Process next gift in queue if any
        if (queueRef.current.length > 0) {
          const next = queueRef.current.shift()!;
          setTimeout(() => {
            setActiveGift(next);
          }, 50);
        }
      }, [onAnimationFinish, onAnimationEnd]);

      useImperativeHandle(ref, () => ({
        showGift: (gift: GiftItem) => {
          if (!activeGift) {
            setActiveGift(gift);
          } else {
            queueRef.current.push(gift);
          }
        },
        enqueueGift: (gift: any) => {
          const item: GiftItem = {
            id: gift.giftId || String(Date.now()),
            senderName: gift.senderNickname || gift.senderName || '팬',
            giftName: gift.giftName || '선물',
            points: Number(gift.pricePoints || gift.points || 1000),
            animationUrl: gift.animationUrl,
            thumbnailUrl: gift.thumbnailUrl,
          };
          if (!activeGift) {
            setActiveGift(item);
          } else {
            queueRef.current.push(item);
          }
        },
        clearQueue: () => {
          queueRef.current = [];
          setActiveGift(null);
        },
      }));

      useEffect(() => {
        if (propGift) {
          setActiveGift(propGift);
        }
      }, [propGift]);

      // If no gift is active, return null completely to ensure 0 CPU/GPU usage
      const displayedGift = activeGift || propGift;
      if (!displayedGift) {
        return null;
      }

      return (
        <GiftAnimationInner
          key={displayedGift.id}
          gift={displayedGift}
          onAnimationFinish={handleEnd}
        />
      );
    }
  )
);

interface GiftAnimationInnerProps {
  gift: GiftItem;
  onAnimationFinish?: () => void;
}

const GiftAnimationInner = memo(({ gift, onAnimationFinish }: GiftAnimationInnerProps) => {
  const tier = useMemo(() => getTier(gift.points, gift.effectTier), [gift.points, gift.effectTier]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const darkBackdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(tier === 3 ? 0.3 : 0.6);
    translateYAnim.setValue(20);
    rotateAnim.setValue(0);
    darkBackdropAnim.setValue(0);

    const duration = tier === 3 ? 3500 : tier === 2 ? 2500 : 1800;

    const animations = [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ];

    if (tier === 3) {
      animations.push(
        Animated.timing(darkBackdropAnim, {
          toValue: 0.88,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 2000,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        )
      );
    } else if (tier === 2) {
      animations.push(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 0.05,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -0.05,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ])
      );
    }

    Animated.parallel(animations).start();

    // Auto dismiss timer
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(darkBackdropAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onAnimationFinish) {
          onAnimationFinish();
        }
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [gift.id, tier]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.absoluteContainer} pointerEvents="none">
      {/* 3단계: 화면 100% 점유 시 배경 일시 암전 */}
      {tier === 3 && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.darkBackdrop,
            { opacity: darkBackdropAnim },
          ]}
        />
      )}

      {/* 메인 이펙트 렌더링 레이어 */}
      <View style={styles.centerContainer}>
        {/* 1단계(소형, 1,000P 이하): 가로 40% 영역 파티클 */}
        {tier === 1 && (
          <Animated.View
            style={[
              styles.tier1Box,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
              },
            ]}
          >
            <View style={styles.particleWrap}>
              <Text style={styles.tier1Emoji}>✨🎁✨</Text>
            </View>
            <View style={styles.badgeContainer}>
              <Text style={styles.senderText}>{gift.senderName}</Text>
              <Text style={styles.giftInfoText}>
                {gift.giftName} ({gift.points.toLocaleString()}P)
              </Text>
            </View>
          </Animated.View>
        )}

        {/* 2단계(중형, 3,000~10,000P): 가로 75% 영역 3D 효과 */}
        {tier === 2 && (
          <Animated.View
            style={[
              styles.tier2Box,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateY: translateYAnim },
                  { rotate: spin },
                ],
              },
            ]}
          >
            <View style={styles.glowRing} />
            <Text style={styles.tier2Emoji}>💎🎆🚀</Text>
            <View style={styles.badgeContainerTier2}>
              <Text style={styles.senderTextTier2}>🔥 {gift.senderName} 님이 선물 투척! 🔥</Text>
              <Text style={styles.giftInfoTextTier2}>
                {gift.giftName} • {gift.points.toLocaleString()} ON
              </Text>
            </View>
          </Animated.View>
        )}

        {/* 3단계(대형, 30,000P 이상): 화면 100% 점유 + 골든 드래곤 풀스크린 연출 */}
        {tier === 3 && (
          <Animated.View
            style={[
              styles.tier3Box,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.dragonBanner}>
              <Text style={styles.vipCrown}>👑 VIP SUPREME 👑</Text>
              <Text style={styles.tier3Dragon}>🐉⚡️🌟🐉</Text>
              <Text style={styles.tier3SenderName}>{gift.senderName}</Text>
              <Text style={styles.tier3GiftDetails}>
                {gift.giftName} {gift.points.toLocaleString()}P 대폭발!
              </Text>
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
});

export default GiftOverlay;

const styles = StyleSheet.create({
  absoluteContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
  },
  centerContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tier1Box: {
    width: SCREEN_WIDTH * 0.45,
    backgroundColor: 'rgba(20, 20, 30, 0.92)',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    marginTop: -SCREEN_HEIGHT * 0.12,
  },
  particleWrap: {
    marginVertical: 4,
  },
  tier1Emoji: {
    fontSize: 36,
  },
  badgeContainer: {
    alignItems: 'center',
    marginTop: 6,
  },
  senderText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  giftInfoText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tier2Box: {
    width: SCREEN_WIDTH * 0.78,
    backgroundColor: 'rgba(30, 10, 45, 0.95)',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF3B6B',
    shadowColor: '#FF3B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
    marginTop: -SCREEN_HEIGHT * 0.14,
  },
  glowRing: {
    position: 'absolute',
    width: '110%',
    height: '110%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 107, 0.4)',
  },
  tier2Emoji: {
    fontSize: 54,
    marginVertical: 8,
  },
  badgeContainerTier2: {
    alignItems: 'center',
  },
  senderTextTier2: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  giftInfoTextTier2: {
    color: '#FF3B6B',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  tier3Box: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: SCREEN_HEIGHT * 0.22,
  },
  dragonBanner: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  vipCrown: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 2,
    marginBottom: 8,
    textShadowColor: 'rgba(255, 215, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tier3Dragon: {
    fontSize: 72,
    marginVertical: 12,
  },
  tier3SenderName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  tier3GiftDetails: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFD700',
    marginTop: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 215, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
