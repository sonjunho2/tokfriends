import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '../../theme/tokens';

interface ScrollExpandableFABProps {
  label: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  isExpanded: boolean;
  onPress: () => void;
  bottomOffset?: number;
}

/**
 * ScrollExpandableFAB (가변 플로팅 액션 버튼)
 * - 슬레이트 톤의 자연스러운 그림자 및 절제된 그라데이션 적용
 */
export default function ScrollExpandableFAB({
  label,
  iconName = 'add',
  isExpanded,
  onPress,
  bottomOffset = 88,
}: ScrollExpandableFABProps) {
  const animValue = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 60,
    }).start();
  }, [isExpanded]);

  const widthAnim = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [52, 132],
  });

  const textOpacityAnim = animValue.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          width: widthAnim,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        style={styles.touchable}
      >
        <LinearGradient
          colors={['#FF4E78', '#FF3B6B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Ionicons name={iconName} size={21} color="#FFFFFF" />
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: textOpacityAnim,
              },
            ]}
          >
            <Text style={styles.label} numberOfLines={1}>
              {label}
            </Text>
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 18,
    height: 52,
    borderRadius: 26,
    zIndex: 999,
    ...tokens.shadows.fab,
  },
  touchable: {
    flex: 1,
    borderRadius: 26,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  textContainer: {
    marginLeft: 6,
    overflow: 'hidden',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
