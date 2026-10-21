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

const FAB_ACCENT = '#FF3B6B';
const FAB_HEIGHT = 52;

/**
 * 당근마켓 스타일 가변 플로팅 액션 버튼 (Extended Floating Action Button)
 * - 최상단/정지: 가로 캡슐 알약형 (+ 아이콘 + 텍스트 라벨)
 * - 스크롤 중: 52x52 원형 (+ 아이콘만 노출)
 * 
 * @param {string} label 버튼 텍스트 (예: '+ 방만들기', '+ 글쓰기', '+ LIVE')
 * @param {string} iconName Ionicons 아이콘 이름 (기본값: 'add')
 * @param {function} onPress 클릭 핸들러
 * @param {boolean} isExtended 확장 여부 (true: 캡슐형, false: 원형)
 * @param {number} bottomOffset 하단 여백 (기본값: 20)
 * @param {object} style 추가 컨테이너 스타일
 */
export default function ExtendedFAB({
  label = '+ 방만들기',
  iconName = 'add',
  onPress,
  isExtended = true,
  bottomOffset = 20,
  style,
}) {
  // 애니메이션 값 (0: 축소 원형, 1: 가로 확장 캡슐)
  const animValue = useRef(new Animated.Value(isExtended ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: isExtended ? 1 : 0,
      friction: 8,
      tension: 65,
      useNativeDriver: false, // width/layout 보간을 위해 false 사용
    }).start();
  }, [isExtended, animValue]);

  // 너비 가변 보간: 52px (원형) ~ 124px (라벨 포함 캡슐)
  const fabWidth = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [52, 128],
  });

  // 텍스트 투명도 보간
  const textOpacity = animValue.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
  });

  // 텍스트 가로 너비 보간
  const textWidth = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 72],
  });

  // 아이콘 표시 ('+' 기호가 라벨에 포함되어 있으면 'add' 아이콘과 분리 처리)
  const displayLabel = label.startsWith('+') ? label.replace(/^\+\s*/, '') : label;

  return (
    <Animated.View
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
          colors={['#FF527F', '#FF3B6B', '#F43F5E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Ionicons name={iconName} size={22} color="#FFFFFF" style={styles.icon} />
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

/**
 * FlatList의 onScroll 이벤트와 연동하여 스크롤 방향 및 최상단 여부를 감지하는 편의 훅
 */
export function useExtendedFabScroll(threshold = 20) {
  const [isExtended, setIsExtended] = useState(true);
  const lastOffsetY = useRef(0);

  const handleScroll = useCallback(
    (event) => {
      const currentY = event.nativeEvent.contentOffset.y;
      // 최상단 근처일 때는 무조건 확장
      if (currentY <= threshold) {
        setIsExtended(true);
        lastOffsetY.current = currentY;
        return;
      }

      const diff = currentY - lastOffsetY.current;
      if (Math.abs(diff) > 10) {
        if (diff > 0) {
          // 아래로 스크롤 중 -> 원형으로 축소
          setIsExtended(false);
        } else {
          // 위로 스크롤 중 -> 캡슐형으로 확장
          setIsExtended(true);
        }
        lastOffsetY.current = currentY;
      }
    },
    [threshold]
  );

  return { isExtended, handleScroll, setIsExtended };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    height: FAB_HEIGHT,
    borderRadius: FAB_HEIGHT / 2,
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: FAB_ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
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
    paddingHorizontal: 15,
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
    fontWeight: '800',
    letterSpacing: -0.2,
    marginLeft: 6,
  },
});
