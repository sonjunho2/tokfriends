// apps/mobile/src/screens/auth/WelcomeScreen.js
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';

const { width } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    key: 'slide-1',
    badge: '인연의 발견',
    icon: 'heart-circle',
    iconColor: '#F43F5E',
    title: '새로운 사람이 다가오고,\n새로운 이야기가 시작된다',
    desc: '동네 이웃부터 관심사 기반의 대화까지,\n당신에게 꼭 맞는 특별한 인연을 만나보세요.',
    accentGradient: ['#FFF1F2', '#FFE4E6'],
  },
  {
    key: 'slide-2',
    badge: '3D 실시간 라이브',
    icon: 'sparkles',
    iconColor: '#F59E0B',
    title: '감동을 선물하는\n생생한 3D 실시간 라이브',
    desc: '화려한 3D 애니메이션 선물과 함께\n호스트 및 시청자들과 실시간으로 소통하세요.',
    accentGradient: ['#FEF3C7', '#FDE68A'],
  },
  {
    key: 'slide-3',
    badge: '안심 케어 24/7',
    icon: 'shield-checkmark',
    iconColor: '#10B981',
    title: '언제나 안심할 수 있는\n클린 & 세이프티 소통',
    desc: '철저한 본인 인증과 24시간 실시간 모니터링으로\n모두가 믿고 즐길 수 있는 환경을 만듭니다.',
    accentGradient: ['#ECFDF5', '#D1FAE5'],
  },
];

export default function WelcomeScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 시작하기 버튼 페이드인
    Animated.timing(buttonFadeAnim, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();
  }, [buttonFadeAnim]);

  const changeSlide = (nextIndex) => {
    if (nextIndex === currentIndex) return;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: nextIndex > currentIndex ? -20 : 20,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentIndex(nextIndex);
      slideAnim.setValue(nextIndex > currentIndex ? 20 : -20);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const currentSlide = ONBOARDING_SLIDES[currentIndex];

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      changeSlide(currentIndex + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 배경 장식 원형 블러 */}
      <View style={styles.bgDecorTop} />
      <View style={styles.bgDecorBottom} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        {/* 상단 56px 규격 브랜드 앱바 */}
        <View style={styles.appbar}>
          <View style={styles.brandRow}>
            <Text style={styles.brandTitle}>다가온</Text>
            <View style={styles.brandDot} />
            <Text style={styles.brandSub}>DAGAON</Text>
          </View>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>건너뛰기</Text>
          </TouchableOpacity>
        </View>

        {/* 온보딩 슬라이드 비주얼 & 내용 영역 */}
        <View style={styles.contentWrap}>
          <Animated.View
            style={[
              styles.slideCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* 감각적인 그래픽 심볼 컨테이너 */}
            <LinearGradient
              colors={currentSlide.accentGradient}
              style={styles.iconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons
                name={currentSlide.icon}
                size={64}
                color={currentSlide.iconColor}
              />
            </LinearGradient>

            {/* 배지 */}
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{currentSlide.badge}</Text>
            </View>

            {/* 타이틀 및 설명 */}
            <Text style={styles.title}>{currentSlide.title}</Text>
            <Text style={styles.desc}>{currentSlide.desc}</Text>
          </Animated.View>
        </View>

        {/* 인디케이터 도트 */}
        <View style={styles.indicatorRow}>
          {ONBOARDING_SLIDES.map((_, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => changeSlide(idx)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.dot,
                  idx === currentIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* 하단 액션 영역: 시작하기 버튼 */}
        <Animated.View style={[styles.bottomActions, { opacity: buttonFadeAnim }]}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
            activeOpacity={0.88}
          >
            <View style={styles.gradientBtn}>
              <Text style={styles.primaryButtonText}>
                {currentIndex === ONBOARDING_SLIDES.length - 1
                  ? '다가온 시작하기'
                  : '다음으로'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#191919" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.loginLinkText}>
              이미 계정이 있으신가요? <Text style={styles.loginLinkBold}>로그인하기</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  bgDecorTop: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FEF3C7',
    opacity: 0.5,
  },
  bgDecorBottom: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#FDE68A',
    opacity: 0.3,
  },
  appbar: {
    height: 56,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1F2937',
    letterSpacing: -0.6,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginTop: 4,
  },
  brandSub: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  contentWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  slideCard: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  badgeContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: -0.2,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.6,
    marginBottom: 14,
  },
  desc: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#FEE500',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#E5E7EB',
  },
  bottomActions: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  primaryButton: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FEE500',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  primaryButtonText: {
    color: '#191919',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLinkBold: {
    fontWeight: '800',
    color: '#1F2937',
    textDecorationLine: 'underline',
  },
});
