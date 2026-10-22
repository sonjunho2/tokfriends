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
 *
 * 규격:
 * - 상태 A (정지 및 최상단): 높이 52px, 모서리 26px 캡슐 형태 (아이콘 + 볼드 텍스트)
 * - 상태 B (스크롤 탐색 중): 가로 52px × 세로 52px 정원형 (텍스트 페이드아웃 후 아이콘 단독 노출)
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

  // 너비: 원형(52px) ➔ 캡슐(132px)
  const widthAnim = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [52, 132],
  });

  // 텍스트 투명도: 0 ➔ 1
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
          colors={['#FF3B6B', '#FF6B8B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Ionicons name={iconName} size={22} color="#FFFFFF" />
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
    shadowColor: '#FF3B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
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
    paddingHorizontal: 15,
  },
  textContainer: {
    marginLeft: 6,
    overflow: 'hidden',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
