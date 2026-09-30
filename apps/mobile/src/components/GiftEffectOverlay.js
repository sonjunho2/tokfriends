// apps/mobile/src/components/GiftEffectOverlay.js
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import colors from '../theme/colors';
import typography from '../theme/typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 3D 선물 이펙트 투명 비디오 & FIFO 큐 오버레이
 * - 실시간 WebSocket 선물 이벤트 수신 시 화면 상단/중앙에 헐리우드급 CG 이펙트 오버레이
 * - FIFO 순차 대기열 처리로 연속 후원 시 씹힘 없는 매끄러운 60fps 연출
 * - 동적 닉네임 배너 슬라이드 & 페이드 애니메이션 동기화
 */
const GiftEffectOverlay = forwardRef(({ onEffectEnd }, ref) => {
  const [queue, setQueue] = useState([]);
  const [currentGift, setCurrentGift] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 닉네임 배너 애니메이션
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const bannerScale = useRef(new Animated.Value(0.8)).current;

  // 비디오 소스 URL
  const [videoSource, setVideoSource] = useState(null);

  // expo-video player 인스턴스
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.muted = false;
  });

  // 큐에 선물 이벤트 추가
  const enqueueGift = useCallback((giftEvent) => {
    if (!giftEvent) return;
    setQueue((prev) => [...prev, { ...giftEvent, qId: `q_${Date.now()}_${Math.random()}` }]);
  }, []);

  // 외부 ref 공개 API (FIFO 대기열 추가 및 테스트 트리거)
  useImperativeHandle(ref, () => ({
    enqueueGift,
    // 개발/테스트용 목 트리거
    triggerMockGift: (mock = {}) => {
      enqueueGift({
        giftId: mock.giftId || 'gift-dragon',
        giftName: mock.giftName || '골든 드래곤 (3D)',
        senderNickname: mock.senderNickname || '익명의 후원자',
        pricePoints: mock.pricePoints || 30000,
        thumbnailUrl:
          mock.thumbnailUrl ||
          'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150',
        animationUrl:
          mock.animationUrl ||
          'https://assets.mixkit.co/videos/preview/mixkit-fire-sparks-rising-in-the-dark-42352-large.mp4',
        animationType: mock.animationType || 'alpha_video',
      });
    },
  }));

  // 다음 선물 순차 재생 프로세서 (FIFO)
  const processNextInQueue = useCallback(() => {
    if (isPlaying) return;

    setQueue((prevQueue) => {
      if (prevQueue.length === 0) {
        setCurrentGift(null);
        setVideoSource(null);
        return prevQueue;
      }

      const [nextGift, ...rest] = prevQueue;
      setCurrentGift(nextGift);
      setIsPlaying(true);

      // 비디오 URL이 있으면 재생, 없으면 3초 타이머 후 종료
      if (nextGift.animationUrl) {
        setVideoSource(nextGift.animationUrl);
      } else {
        setVideoSource(null);
      }

      return rest;
    });
  }, [isPlaying]);

  // 큐 변화 감지하여 재생 시작
  useEffect(() => {
    if (!isPlaying && queue.length > 0) {
      processNextInQueue();
    }
  }, [queue, isPlaying, processNextInQueue]);

  // 현재 선물 재생 완료 처리
  const finishCurrentEffect = useCallback(() => {
    // 닉네임 배너 퇴장 애니메이션
    Animated.parallel([
      Animated.timing(bannerAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(bannerScale, {
        toValue: 0.8,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsPlaying(false);
      setCurrentGift(null);
      setVideoSource(null);
      if (onEffectEnd) onEffectEnd();
    });
  }, [bannerAnim, bannerScale, onEffectEnd]);

  // 비디오 플레이어 재생 제어 및 이벤트 감지
  useEffect(() => {
    if (!currentGift) return;

    // 배너 등장 애니메이션
    bannerAnim.setValue(0);
    bannerScale.setValue(0.8);
    Animated.parallel([
      Animated.spring(bannerAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.spring(bannerScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // expo-video 재생
    if (player && videoSource) {
      try {
        player.replay();
      } catch {
        // silent fallback
      }
    }

    // 재생 완료 타이머 (비디오는 최대 4.5초 또는 애니메이션 완료 시 자동 퇴장)
    const duration = currentGift.animationUrl ? 4200 : 2800;
    const timer = setTimeout(() => {
      finishCurrentEffect();
    }, duration);

    return () => clearTimeout(timer);
  }, [currentGift, videoSource, player, bannerAnim, bannerScale, finishCurrentEffect]);

  if (!currentGift) {
    return null;
  }

  const isVideo = Boolean(currentGift.animationUrl);

  return (
    <View style={styles.overlayContainer} pointerEvents="none">
      {/* 1. 3D 투명 비디오 이펙트 뷰 레이어 */}
      {isVideo && player && (
        <View style={styles.videoWrapper}>
          <VideoView
            style={styles.videoView}
            player={player}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            startsPictureInPictureAutomatically={false}
            contentFit="contain"
            nativeControls={false}
          />
        </View>
      )}

      {/* 2. 일반 아이콘 선물인 경우 중앙 팝업 이펙트 */}
      {!isVideo && currentGift.thumbnailUrl && (
        <Animated.View
          style={[
            styles.fallbackIconContainer,
            {
              opacity: bannerAnim,
              transform: [{ scale: bannerScale }],
            },
          ]}
        >
          <Image
            source={{ uri: currentGift.thumbnailUrl }}
            style={styles.fallbackIconImage}
            resizeMode="contain"
          />
        </Animated.View>
      )}

      {/* 3. 텍스트 / 닉네임 동적 오버레이 배너 (화면 상단) */}
      <Animated.View
        style={[
          styles.bannerCard,
          {
            opacity: bannerAnim,
            transform: [
              {
                translateY: bannerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-40, 0],
                }),
              },
              { scale: bannerScale },
            ],
          },
        ]}
      >
        <View style={styles.bannerAvatarBox}>
          {currentGift.thumbnailUrl ? (
            <Image
              source={{ uri: currentGift.thumbnailUrl }}
              style={styles.bannerThumb}
            />
          ) : (
            <Text style={{ fontSize: 18 }}>🎁</Text>
          )}
        </View>
        <View style={styles.bannerTextBox}>
          <Text style={styles.bannerSenderText} numberOfLines={1}>
            {currentGift.senderNickname || '시청자'}님이
          </Text>
          <Text style={styles.bannerGiftText} numberOfLines={1}>
            <Text style={styles.bannerHighlight}>{currentGift.giftName || '선물'}</Text>
            {currentGift.pricePoints ? ` (${currentGift.pricePoints.toLocaleString()}P)` : ''}을 보냈습니다!
          </Text>
        </View>
      </Animated.View>
    </View>
  );
});

GiftEffectOverlay.displayName = 'GiftEffectOverlay';

export default GiftEffectOverlay;

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  videoView: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  fallbackIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  fallbackIconImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  bannerCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 70 : 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.88)',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    maxWidth: SCREEN_WIDTH * 0.88,
  },
  bannerAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  bannerThumb: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  bannerTextBox: {
    flexShrink: 1,
  },
  bannerSenderText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: typography.caption.fontFamily,
  },
  bannerGiftText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: typography.bodyMedium.fontFamily,
    marginTop: 1,
  },
  bannerHighlight: {
    color: '#FBBF24',
    fontWeight: '800',
  },
});
