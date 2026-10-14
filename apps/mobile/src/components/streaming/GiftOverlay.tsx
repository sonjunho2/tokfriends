import React, { memo, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import LottieView from 'lottie-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface GiftItem {
  id: string;
  senderName: string;
  senderAvatar?: string;
  giftName: string;
  points: number;
  effectTier?: 1 | 2 | 3;
}

interface GiftOverlayProps {
  currentGift: GiftItem | null;
  onAnimationEnd?: () => void;
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

export const GiftOverlay = memo(({ currentGift, onAnimationEnd }: GiftOverlayProps) => {
  // If no gift is currently playing, return null immediately to keep GPU/CPU usage at 0
  if (!currentGift) {
    return null;
  }

  return (
    <GiftAnimationInner
      gift={currentGift}
      onAnimationEnd={onAnimationEnd}
    />
  );
});

interface GiftAnimationInnerProps {
  gift: GiftItem;
  onAnimationEnd?: () => void;
}

const GiftAnimationInner = memo(({ gift, onAnimationEnd }: GiftAnimationInnerProps) => {
  const tier = useMemo(() => getTier(gift.points, gift.effectTier), [gift.points, gift.effectTier]);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const darkBackdropAnim = useRef(new Animated.Value(0)).current;

  const handleEnd = useCallback(() => {
    if (onAnimationEnd) {
      onAnimationEnd();
    }
  }, [onAnimationEnd]);

  useEffect(() => {
    // Reset values
    fadeAnim.setValue(0);
    scaleAnim.setValue(tier === 3 ? 0.3 : 0.6);
    translateYAnim.setValue(20);
    rotateAnim.setValue(0);
    darkBackdropAnim.setValue(0);

    const duration = tier === 3 ? 3500 : tier === 2 ? 2500 : 1800;

    // Parallel entrance animations
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
          toValue: 0.85,
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
        handleEnd();
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
      {/* Tier 3 Special Dark Background */}
      {tier === 3 && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.darkBackdrop,
            { opacity: darkBackdropAnim },
          ]}
        />
      )}

      {/* Main Effect Layer */}
      <View style={styles.centerContainer}>
        {/* Tier 1: Small (40% width) - Simple Particle */}
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
            <View style={styles.lottiePlaceholder}>
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

        {/* Tier 2: Medium (75% width) - Dynamic 3D Display */}
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

        {/* Tier 3: Large (100% fullscreen) - Golden Dragon Fullscreen Effect */}
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
    width: SCREEN_WIDTH * 0.4,
    backgroundColor: 'rgba(20, 20, 30, 0.85)',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  lottiePlaceholder: {
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
    width: SCREEN_WIDTH * 0.75,
    backgroundColor: 'rgba(15, 15, 35, 0.92)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#A855F7',
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  glowRing: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  tier2Emoji: {
    fontSize: 64,
    marginBottom: 10,
  },
  badgeContainerTier2: {
    alignItems: 'center',
  },
  senderTextTier2: {
    color: '#F472B6',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  giftInfoTextTier2: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  tier3Box: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragonBanner: {
    width: '90%',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 20, 5, 0.95)',
    borderWidth: 3,
    borderColor: '#F59E0B',
    borderRadius: 32,
    paddingVertical: 36,
    paddingHorizontal: 20,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 25,
  },
  vipCrown: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FBBF24',
    letterSpacing: 2,
    marginBottom: 8,
  },
  tier3Dragon: {
    fontSize: 82,
    marginVertical: 12,
  },
  tier3SenderName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    textShadowColor: 'rgba(245, 158, 11, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tier3GiftDetails: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FCD34D',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default GiftOverlay;
