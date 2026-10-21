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
const FAB_COLLAPSED_WIDTH = 52;
const FAB_EXPANDED_WIDTH = 132;

/**
 * 당근마켓 스타일 가변 플로팅 액션 버튼 (Extended Floating Action Button)
 * - 최상단/정지: 가로 캡슐 알약형 (+ 아이콘 + 텍스트 라벨)
 * - 스크롤 중: 52x52 원형 (+ 아이콘만 노출)
 * 
 * @param {string} label 버튼 텍스트 (예: '+ 방만들기', '+ 글쓰기', '+ LIVE')
 * @param {string} iconName Ionicons 아이콘 이름 (기본값: 'add')
 * @param {function} onPress 클릭 핸들러
 * @param {boolean} isExtended 확장 여부 (true: 캡슐형, false: 원형)
 * @param {number} bottomOffset 하단 여백 (하단 탭 바 위 16~20px 기준: 기본값 84)
 * @param {object} style 추가 컨테이너 스타일
 */
export default function ExtendedFAB({
  label = '+ 방만들기',
  iconName = 'add',
  onPress,
  isExtended = true,
  bottomOffset = 84, // 하단 탭 바(약 65px) 위 19px 상단 고정
  style,
}) {
  // 애니메이션 값 (0: 축소 원형, 1: 가로 확장 캡슐)
  const animValue = useRef(new Animated.Value(isExtended ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: isExtended ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [isExtended, animValue]);

  // 너비 가변 보간: 52px (원형) ~ 132px (라벨 포함 캡슐)
  const fabWidth = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [FAB_COLLAPSED_WIDTH, FAB_EXPANDED_WIDTH],
  });

  // 텍스트 투명도 보간 (0일 때는 완전히 보이지 않음)
  const textOpacity = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  // 텍스트 가로 너비 보간
  const textWidth = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 76],
    extrapolate: 'clamp',
  });

  // 아이콘 표시 ('+' 기호가 라벨에 포함되어 있으면 'add' 아이콘과 분리 처리)
  const displayLabel = label.startsWith('+') ? label.replace(/^\+\s*/, '') : label;

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
 * 떨림 방지를 위한 스크롤 델타 필터링 적용
 */
export function useExtendedFabScroll(threshold = 24) {
  const [isExtended, setIsExtended] = useState(true);
  const lastOffsetY = useRef(0);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef(null);

  const handleScroll = useCallback(
    (event) => {
      const currentY = event.nativeEvent.contentOffset.y;

      // 1. 최상단 근처일 때는 즉시 확장
      if (currentY <= threshold) {
        setIsExtended((prev) => (prev ? prev : true));
        lastOffsetY.current = Math.max(0, currentY);
        return;
      }

      const diff = currentY - lastOffsetY.current;

      // 2. 미세한 손떨림(18px 미만)은 무시하여 플리커링 원천 차단
      if (Math.abs(diff) > 18) {
        if (diff > 0) {
          // 아래로 스크롤 시 원형으로 축소
          setIsExtended((prev) => (!prev ? prev : false));
        } else {
          // 위로 스크롤 시 캡슐형으로 확장
          setIsExtended((prev) => (prev ? prev : true));
        }
        lastOffsetY.current = currentY;
      }

      // 3. 스크롤이 멈췄을 때 600ms 후 자동으로 다시 캡슐형으로 펼침 (정지 상태 복원)
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
    right: 16,
    height: FAB_HEIGHT,
    borderRadius: FAB_HEIGHT / 2,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: FAB_ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
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
    paddingHorizontal: 0,
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
    includeFontPadding: false,
  },
});
