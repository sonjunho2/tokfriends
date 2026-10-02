// apps/mobile/src/components/FloatingHeartsOverlay.js
import React, { forwardRef, useImperativeHandle, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HEART_COLORS = [
  '#FF3B6B',
  '#F43F5E',
  '#EC4899',
  '#F59E0B',
  '#8B5CF6',
  '#10B981',
  '#3B82F6',
  '#FEE500',
];

function FloatingHeartItem({ id, color, onComplete }) {
  const positionY = useRef(new Animated.Value(0)).current;
  const positionX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.4)).current;

  // Random horizontal sway trajectory
  const swayTarget = (Math.random() - 0.5) * 120;
  const size = Math.floor(Math.random() * 14) + 24; // 24 ~ 38px

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(positionY, {
        toValue: -320 - Math.random() * 80,
        duration: 2200 + Math.random() * 500,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(positionX, {
          toValue: swayTarget,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(positionX, {
          toValue: swayTarget * -0.6,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.1,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.3,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(1400),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      if (typeof onComplete === 'function') {
        onComplete(id);
      }
    });
  }, [id, onComplete, opacity, positionX, positionY, scale, swayTarget]);

  return (
    <Animated.View
      style={[
        styles.heartWrap,
        {
          transform: [
            { translateY: positionY },
            { translateX: positionX },
            { scale },
          ],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <Ionicons name="heart" size={size} color={color} />
    </Animated.View>
  );
}

const FloatingHeartsOverlay = forwardRef((props, ref) => {
  const [hearts, setHearts] = useState([]);

  const addHeart = useCallback(() => {
    const id = `heart_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const randomColor = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
    setHearts((prev) => [...prev.slice(-25), { id, color: randomColor }]);
  }, []);

  const removeHeart = useCallback((id) => {
    setHearts((prev) => prev.filter((h) => h.id !== id));
  }, []);

  useImperativeHandle(ref, () => ({
    addHeart,
    addHeartsBurst: (count = 5) => {
      for (let i = 0; i < count; i++) {
        setTimeout(() => addHeart(), i * 80);
      }
    },
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {hearts.map((h) => (
        <FloatingHeartItem
          key={h.id}
          id={h.id}
          color={h.color}
          onComplete={removeHeart}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 140,
    height: 380,
    alignItems: 'center',
    justifyContent: 'flex-end',
    pointerEvents: 'none',
    zIndex: 99,
  },
  heartWrap: {
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});

export default FloatingHeartsOverlay;
