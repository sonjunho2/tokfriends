// apps/mobile/src/screens/auth/OnboardingScreen.js
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Image,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'slide-1',
    badge: '우리 동네 잔치',
    title: '우리 동네 매일매일\n열리는 잔치!',
    desc: '모꼬에서 이웃들과 따뜻한 이야기와\n핫딜을 만나보세요!',
    btnText: '시작하기',
    accentColor: '#FF6445',
  },
  {
    key: 'slide-2',
    badge: '실시간 LIVE & 통화',
    title: '실시간 LIVE 소통과\n생생한 1:1 대화!',
    desc: '인기 크리에이터의 라이브 방송과 프라이빗 통화,\n화려한 3D 선물로 마음을 전해보세요!',
    btnText: '다음으로',
    accentColor: '#8B5CF6',
  },
  {
    key: 'slide-3',
    badge: '안심 직거래 & 특가',
    title: '이웃과 함께하는\n안심 직거래 & 특가 마켓!',
    desc: '수수료 없는 안전 정산과 검증된 이웃들,\n우리 동네에서 매일 열리는 특별한 거래!',
    btnText: '모꼬 시작하기 ✨',
    accentColor: '#FF6445',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 부드러운 애니메이션
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const contentSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 마스코트 부드러운 상하 플로팅
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    // 펄스 효과
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    floatLoop.start();
    pulseLoop.start();

    return () => {
      floatLoop.stop();
      pulseLoop.stop();
    };
  }, [floatAnim, pulseAnim]);

  // 로그인 화면으로 바로 이동
  const goToLogin = useCallback(async () => {
    try {
      await AsyncStorage.multiSet([
        ['@mocco_onboarded', 'true'],
        ['@dagaon_onboarded', 'true'],
      ]);
    } catch (e) {
      console.warn('Failed to save onboarding state:', e);
    }
    if (navigation?.navigate) {
      navigation.navigate('Login');
    } else if (navigation?.reset) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [navigation]);

  const handleFinishOnboarding = goToLogin;

  // 슬라이드 변경 애니메이션
  const goToSlide = (nextIndex) => {
    if (nextIndex < 0 || nextIndex >= SLIDES.length) return;
    Animated.parallel([
      Animated.timing(contentFadeAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(contentSlideAnim, {
        toValue: -15,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentIndex(nextIndex);
      contentSlideAnim.setValue(15);
      Animated.parallel([
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentSlideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (currentIndex === 0) {
      // 슬라이드 1 시안의 '시작하기' 누르면 즉시 로그인 화면으로 이동!
      goToLogin();
    } else if (currentIndex < SLIDES.length - 1) {
      goToSlide(currentIndex + 1);
    } else {
      goToLogin();
    }
  };

  // 스와이프 제스처 핸들러
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 25 && Math.abs(gestureState.dy) < 40;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          // 좌로 스와이프 -> 다음 슬라이드
          if (currentIndex < SLIDES.length - 1) {
            goToSlide(currentIndex + 1);
          } else {
            handleFinishOnboarding();
          }
        } else if (gestureState.dx > 50) {
          // 우로 스와이프 -> 이전 슬라이드
          if (currentIndex > 0) {
            goToSlide(currentIndex - 1);
          }
        }
      },
    })
  ).current;

  const currentSlide = SLIDES[currentIndex];

  // 슬라이드별 비주얼 렌더링
  const renderVisual = () => {
    if (currentIndex === 0) {
      // 슬라이드 1: 참고 이미지의 귀여운 마스코트 캐릭터 & MOCCO 버블 로고
      return (
        <Animated.View
          style={[
            styles.slide1HeroContainer,
            { transform: [{ translateY: floatAnim }] },
          ]}
        >
          <View style={styles.slide1CropBox}>
            <Image
              source={require('../../../assets/mocco-onboarding-welcome.png')}
              style={styles.slide1MascotImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>
      );
    }

    if (currentIndex === 1) {
      // 슬라이드 2: 헤드폰을 쓴 3D 캐릭터 & 라이브/1:1 대화 플로팅 칩
      return (
        <Animated.View
          style={[
            styles.slide2HeroContainer,
            { transform: [{ translateY: floatAnim }] },
          ]}
        >
          <View style={styles.headphoneCard}>
            <Image
              source={require('../../../assets/mocco-character-headphones.jpg')}
              style={styles.headphoneImg}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.55)']}
              style={styles.headphoneGradientOverlay}
            />
            <View style={styles.liveTagPill}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveTagText}>MOCCO LIVE</Text>
            </View>
          </View>

          {/* 플로팅 칩 1: 1:1 대화 */}
          <View style={styles.floatChipTalk}>
            <Ionicons name="chatbubbles" size={15} color="#8B5CF6" />
            <Text style={styles.floatChipText}>1:1 프라이빗 통화</Text>
          </View>

          {/* 플로팅 칩 2: 3D 선물 */}
          <View style={styles.floatChipGift}>
            <Ionicons name="gift" size={15} color="#EC4899" />
            <Text style={styles.floatChipText}>3D 선물 폭죽 🎁</Text>
          </View>
        </Animated.View>
      );
    }

    // 슬라이드 3: 마스코트 & 안심 마켓 직거래
    return (
      <Animated.View
        style={[
          styles.slide3HeroContainer,
          { transform: [{ translateY: floatAnim }] },
        ]}
      >
        <View style={styles.marketCircleBg}>
          <Image
            source={require('../../../assets/mocco-mascot.png')}
            style={styles.marketMascotImg}
            resizeMode="contain"
          />
        </View>

        {/* 플로팅 칩 1: 오늘의 핫딜 */}
        <View style={styles.floatChipHotdeal}>
          <Ionicons name="pricetag" size={15} color="#EA580C" />
          <Text style={styles.floatChipText}>오늘의 특가 공구 ⚡</Text>
        </View>

        {/* 플로팅 칩 2: 수수료 0원 */}
        <View style={styles.floatChipSafeTrade}>
          <Ionicons name="shield-checkmark" size={15} color="#059669" />
          <Text style={styles.floatChipText}>판매 수수료 0원 · 안전정산</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <LinearGradient
      colors={['#FFE6D5', '#FFF3EB', '#F2E8FF', '#EAE0FF']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFE6D5" />

        {/* 1. 상단 바 (건너뛰기) */}
        <View style={styles.topHeader}>
          <View style={{ width: 60 }} />
          <TouchableOpacity
            onPress={handleFinishOnboarding}
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            style={styles.skipBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>건너뛰기</Text>
          </TouchableOpacity>
        </View>

        {/* 2. 중앙 캐릭터 및 비주얼 영역 (스와이프 지원) */}
        <View style={styles.visualSection} {...panResponder.panHandlers}>
          {renderVisual()}
        </View>

        {/* 3. 하단 텍스트 및 인터랙션 */}
        <View style={styles.bottomSection}>
          <Animated.View
            style={{
              opacity: contentFadeAnim,
              transform: [{ translateY: contentSlideAnim }],
              alignItems: 'center',
            }}
          >
            {/* 타이틀 및 서브타이틀 */}
            <Text style={styles.titleText}>{currentSlide.title}</Text>
            <Text style={styles.descText}>{currentSlide.desc}</Text>
          </Animated.View>

          {/* 4. 메인 CTA 버튼 (참고 이미지 '시작하기' 완벽 일치) */}
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handleNext}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#FF6B4A', '#FF5533']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaBtnGradient}
            >
              <Text style={styles.ctaBtnText}>{currentSlide.btnText}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* 5. 3개 원형 인디케이터 도트 */}
          <View style={styles.indicatorRow}>
            {SLIDES.map((s, idx) => {
              const isActive = idx === currentIndex;
              return (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => goToSlide(idx)}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.indicatorDot,
                      isActive ? styles.indicatorDotActive : styles.indicatorDotInactive,
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 로그인 바로가기 링크 */}
          <TouchableOpacity
            onPress={goToLogin}
            hitSlop={{ top: 10, bottom: 10, left: 16, right: 16 }}
            style={{ marginTop: 12, paddingVertical: 4 }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600' }}>
              이미 계정이 있으신가요? <Text style={{ color: '#FF5A36', fontWeight: '800' }}>로그인</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topHeader: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },

  // 비주얼 영역
  visualSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  // 슬라이드 1 비주얼
  slide1HeroContainer: {
    width: SCREEN_WIDTH * 0.92,
    height: 330,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide1CropBox: {
    width: SCREEN_WIDTH * 0.92,
    height: 330,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  slide1MascotImage: {
    width: SCREEN_WIDTH * 0.92,
    height: (SCREEN_WIDTH * 0.92) * (1024 / 571),
    marginTop: -42, // 건너뛰기 텍스트 제외하고 캐릭터+로고 포커싱
  },

  // 슬라이드 2 비주얼 (헤드폰 3D 캐릭터)
  slide2HeroContainer: {
    width: 270,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headphoneCard: {
    width: 220,
    height: 250,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  headphoneImg: {
    width: '100%',
    height: '100%',
  },
  headphoneGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  liveTagPill: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  floatChipTalk: {
    position: 'absolute',
    top: 15,
    left: -10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  floatChipGift: {
    position: 'absolute',
    bottom: 25,
    right: -10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  floatChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1F2937',
  },

  // 슬라이드 3 비주얼 (안심 마켓)
  slide3HeroContainer: {
    width: 270,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  marketCircleBg: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6445',
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 6,
  },
  marketMascotImg: {
    width: 170,
    height: 170,
  },
  floatChipHotdeal: {
    position: 'absolute',
    top: 25,
    right: -8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  floatChipSafeTrade: {
    position: 'absolute',
    bottom: 25,
    left: -10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // 하단 텍스트 및 액션
  bottomSection: {
    paddingHorizontal: 28,
    paddingBottom: 24,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 27,
    fontWeight: '900',
    color: '#1E1E24',
    textAlign: 'center',
    lineHeight: 37,
    letterSpacing: -0.6,
    marginBottom: 10,
  },
  descText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 23,
    letterSpacing: -0.2,
    marginBottom: 28,
  },

  // 메인 CTA 버튼
  ctaBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    shadowColor: '#FF5533',
    shadowOpacity: 0.38,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    marginBottom: 22,
  },
  ctaBtnGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  // 3개 인디케이터 도트
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicatorDot: {
    height: 7,
    borderRadius: 3.5,
  },
  indicatorDotActive: {
    width: 22,
    backgroundColor: '#FF6445',
  },
  indicatorDotInactive: {
    width: 7,
    backgroundColor: '#D1D5DB',
  },
});
