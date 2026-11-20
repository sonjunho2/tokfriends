// apps/mobile/src/components/common/ExtendedFAB.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '../../theme/tokens';

const FAB_HEIGHT = 52;
const FAB_COLLAPSED_WIDTH = 52;

/**
 * 당근마켓/토스 스타일 가변 플로팅 액션 버튼 (Extended Floating Action Button)
 * - 최상단/정지: 가로 캡슐 알약형 (+ 아이콘 + 텍스트 라벨)
 * - 스크롤 중: 52x52 원형 (+ 아이콘만 노출)
 */
export default function ExtendedFAB({
  label = '+ 방만들기',
  iconName = 'add',
  onPress,
  isExtended = true,
  bottomOffset = 80,
  style,
}) {
  const displayLabel = label.startsWith('+') ? label.replace(/^\+\s*/, '') : label;
  const targetExpandedWidth = displayLabel.length <= 3 ? 92 : (displayLabel.length <= 4 ? 102 : 116);

  const animValue = useRef(new Animated.Value(isExtended ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: isExtended ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isExtended, animValue]);

  const fabWidth = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [FAB_COLLAPSED_WIDTH, targetExpandedWidth],
  });

  const textOpacity = animValue.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const textWidth = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, targetExpandedWidth - 44],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          width: fabWidth,
          bottom: bottomOffset,
        },
        style,
      ]}
    >
      <TouchableOpacity
        style={styles.touchable}
        activeOpacity={0.88}
        onPress={onPress}
      >
        <LinearGradient
          colors={['#FF4E78', '#FF3B6B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Ionicons name={iconName} size={20} color="#FFFFFF" style={styles.icon} />
          <Animated.View
            style={[
              styles.labelWrap,
              {
                width: textWidth,
                opacity: textOpacity,
              },
            ]}
          >
            <Text style={styles.label} numberOfLines={1}>
              {displayLabel}
            </Text>
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function useExtendedFabScroll(threshold = 24) {
  const [isExtended, setIsExtended] = useState(true);
  const lastOffsetY = useRef(0);
  const scrollTimeout = useRef(null);

  const handleScroll = useCallback(
    (event) => {
      const currentY = event.nativeEvent.contentOffset.y;

      if (currentY <= threshold) {
        setIsExtended((prev) => (prev ? prev : true));
        lastOffsetY.current = Math.max(0, currentY);
        return;
      }

      const diff = currentY - lastOffsetY.current;

      if (Math.abs(diff) > 18) {
        if (diff > 0) {
          setIsExtended((prev) => (!prev ? prev : false));
        } else {
          setIsExtended((prev) => (prev ? prev : true));
        }
        lastOffsetY.current = currentY;
      }

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      scrollTimeout.current = setTimeout(() => {
        setIsExtended(true);
      }, 700);
    },
    [threshold]
  );

  return { isExtended, handleScroll, setIsExtended };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 18,
    height: FAB_HEIGHT,
    borderRadius: FAB_HEIGHT / 2,
    zIndex: 9999,
    ...tokens.shadows.fab,
  },
  touchable: {
    flex: 1,
    borderRadius: FAB_HEIGHT / 2,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 0,
  },
  labelWrap: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginLeft: 5,
    includeFontPadding: false,
  },
});
