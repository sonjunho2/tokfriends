import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import colors from '../../theme/colors';
import Avatar from '../../components/Avatar';
import ReportModal from '../../components/ReportModal';
import GiftEffectOverlay from '../../components/GiftEffectOverlay';
import GiftOverlay from '../../components/streaming/GiftOverlay';
import { GlobalBottomSheet } from '../../components/common';
import GiftPickerSheet from '../../components/GiftPickerSheet';
import LiveViewerRankingSheet from '../../components/LiveViewerRankingSheet';
import LiveParticipantProfileSheet from '../../components/LiveParticipantProfileSheet';
import FloatingHeartsOverlay from '../../components/FloatingHeartsOverlay';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { checkAndConfirmActionPoint } from '../../utils/pointPolicyHelper';
import { createChatSocket, LIVE_SOCKET_EVENTS } from '../../realtime/chatSocket';

const LIVE_ACCENT = '#FF3B6B';

/**
 * 60fps 동적 오디오 이퀄라이저 파형 애니메이션
 * 마이크가 켜져 있으면 자연스럽게 음성 진폭에 맞춰 오실레이션
 * 마이크 음소거 시 정적 기준선(4px)으로 평탄화
 */
function LiveAudioWaveform({ isMuted, barCount = 5, barColor = LIVE_ACCENT }) {
  const animValues = useRef([...Array(barCount)].map(() => new Animated.Value(0.2))).current;

  useEffect(() => {
    if (isMuted) {
      animValues.forEach((val) => {
        Animated.timing(val, {
          toValue: 0.1,
          duration: 250,
          useNativeDriver: false,
        }).start();
      });
      return;
    }

    const loops = animValues.map((val, i) => {
      const minVal = 0.2 + (i % 2) * 0.12;
      const maxVal = 0.65 + ((i * 3) % 4) * 0.1;
      const duration = 280 + (i % 3) * 140;

      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: maxVal,
            duration,
            useNativeDriver: false,
          }),
          Animated.timing(val, {
            toValue: minVal,
            duration,
            useNativeDriver: false,
          }),
        ])
      );
      loop.start();
      return loop;
    });

    return () => {
      loops.forEach((l) => l.stop());
    };
  }, [isMuted, animValues]);

  return (
    <View style={styles.audioWaveContainer}>
      {animValues.map((val, idx) => {
        const height = val.interpolate({
          inputRange: [0.1, 1],
          outputRange: [4, 38],
        });
        return (
          <Animated.View
            key={`live_wave_bar_${idx}`}
            style={[
              styles.waveBar,
              {
                height,
                backgroundColor: isMuted ? 'rgba(255, 255, 255, 0.3)' : barColor,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export default function LiveRoomScreen({ navigation, route }) {
  const { user: currentUser, token: authToken, refreshMe } = useAuth();
  const initialRoom = route?.params?.room;
  const roomId = route?.params?.roomId || initialRoom?.id;

  const [room, setRoom] = useState(initialRoom || null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [likeCount, setLikeCount] = useState(initialRoom?.totalLikes || 0);
  const [viewerCount, setViewerCount] = useState(initialRoom?.viewerCount || 1);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [blocking, setBlocking] = useState(false);

  // 3D Gift & Animated Reaction States
  const flatListRef = useRef(null);
  const giftOverlayRef = useRef(null);
  const floatingHeartsRef = useRef(null);
  const [giftPickerVisible, setGiftPickerVisible] = useState(false);
  const [viewerModalVisible, setViewerModalVisible] = useState(false);
  const [profileSheetVisible, setProfileSheetVisible] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [myPoints, setMyPoints] = useState(
    currentUser?.pointBalance ?? currentUser?.pointsBalance ?? currentUser?.points ?? currentUser?.balance ?? 0
  );
  const processedGiftMessageIdsRef = useRef(new Set());
  const socketRef = useRef(null);

  // Guarantee bottom tab bar is completely hidden while Live Room is open
  useLayoutEffect(() => {
    const parentNav = navigation.getParent();
    parentNav?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parentNav?.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation]);

  // 기여도 랭킹 1~4위 (타사 형태 반영: 1등 골드 원형 테두리 라인으로 화려하게 강조, 겹침 없이 개별 분리)
  const topContributors = useMemo(() => {
    const contributorMap = new Map();
    if (Array.isArray(messages)) {
      for (const m of messages) {
        const mType = String(m?.type || '').toLowerCase();
        if (mType === 'gift') {
          let giftMeta = {};
          try {
            giftMeta = typeof m.content === 'string' ? JSON.parse(m.content) : (m.content || {});
          } catch {}

          const id = m.senderId || m.sender?.id || giftMeta?.senderId || `user_${giftMeta?.senderNickname || 'anon'}`;
          const name =
            giftMeta?.senderNickname ||
            m.senderName ||
            m.sender?.nickname ||
            m.sender?.displayName ||
            m.sender?.name ||
            '후원자';
          const avatar = giftMeta?.senderAvatar || m.senderAvatar || m.sender?.avatar || m.sender?.profileImage;
          const pts = Number(giftMeta?.pricePoints || m.giftPoints || 0);

          const prev = contributorMap.get(id) || { id, name, avatar, points: 0 };
          prev.points += pts;
          if (name && name !== '후원자') prev.name = name;
          if (avatar) prev.avatar = avatar;
          contributorMap.set(id, prev);
        }
      }
    }
    const realList = Array.from(contributorMap.values()).sort((a, b) => b.points - a.points);
    const defaults = [
      { id: 'c1', name: '🌸 炫.🐅🐾', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120', points: 17, level: 50 },
      { id: 'c2', name: '블리주', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120', points: 10, level: 88 },
      { id: 'c3', name: '구름이', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120', points: 8, level: 32 },
      { id: 'c4', name: '호수', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120', points: 5, level: 19 },
    ];
    const merged = [...realList];
    const seen = new Set(realList.map((r) => r.id));
    for (const d of defaults) {
      if (!seen.has(d.id) && merged.length < 4) {
        seen.add(d.id);
        merged.push(d);
      }
    }
    return merged.slice(0, 4);
  }, [messages]);

  // Calculate my contributed points in this room
  const myContributionPoints = useMemo(() => {
    let total = 0;
    const myId = String(currentUser?.id || '');
    if (Array.isArray(messages) && myId) {
      for (const m of messages) {
        const mType = String(m?.type || '').toLowerCase();
        if (mType === 'gift' && (String(m.senderId) === myId || String(m.sender?.id) === myId)) {
          let giftMeta = {};
          try {
            giftMeta = typeof m.content === 'string' ? JSON.parse(m.content) : (m.content || {});
          } catch {}
          total += Number(giftMeta?.pricePoints || m.giftPoints || 0);
        }
      }
    }
    return total;
  }, [messages, currentUser]);

  // Navigation & Camera Lifecycle
  const isFocused = useIsFocused();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraMountError, setCameraMountError] = useState(null);

  // Safety fallback: ensure loading overlay clears even if onCameraReady callback is delayed on Android
  useEffect(() => {
    if (isHost && isFocused && !isCameraOff) {
      const timer = setTimeout(() => {
        setIsCameraReady(true);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setIsCameraReady(false);
    }
  }, [isHost, isFocused, isCameraOff, cameraFacing]);

  const insets = useSafeAreaInsets();
  // Dynamic Keyboard Height Tracking (Avoid Input Obscuring)
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [rootHeight, setRootHeight] = useState(0);
  const [initialHeight, setInitialHeight] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const screenH = Dimensions.get('screen').height;
      const endY = e?.endCoordinates?.screenY;
      let h = e?.endCoordinates?.height || 0;

      // 안드로이드에서 소프트키(하단 내비게이션 바)가 키보드 아래에 함께 노출되는 환경을 정밀 보정
      if (endY && endY > 0 && screenH > endY) {
        h = Math.max(h, screenH - endY);
      }

      setKeyboardHeight(h);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      setIsInputFocused(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const liveBottomOffset = keyboardHeight > 0
    ? keyboardHeight + 8
    : Math.max(insets.bottom, 12);

  // Agora Live Streaming States (Video + Audio)
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [agoraTokenData, setAgoraTokenData] = useState(null);
  const [streamConnecting, setStreamConnecting] = useState(true);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('front'); // 'front' | 'back'
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  // Agora Traffic Optimization: Background Video Unsubscribe & Audio Mode Switch
  const [isVideoSubscribed, setIsVideoSubscribed] = useState(true);
  const wasVideoActiveBeforeBgRef = useRef(true);
  const appStateRef = useRef(AppState.currentState);
  const [isBackgroundAudioMode, setIsBackgroundAudioMode] = useState(false);

  // Agora RTC Stream Controller (Unsubscribe / Mute / Subscribe)
  const agoraStreamController = useRef({
    unsubscribeRemoteVideo: () => {
      setIsVideoSubscribed(false);
    },
    subscribeRemoteVideo: () => {
      setIsVideoSubscribed(true);
    },
    muteLocalVideo: (_mute) => {},
    muteLocalAudio: (_mute) => {},
  }).current;

  // Dynamic Audio Pulse & Quick Stream Notification Toast
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [streamToast, setStreamToast] = useState(null);
  const toastFadeAnim = useRef(new Animated.Value(0)).current;
  const toastTimeoutRef = useRef(null);

  const showStreamToast = useCallback((msg, icon = 'information-circle') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setStreamToast({ msg, icon });
    Animated.timing(toastFadeAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    toastTimeoutRef.current = setTimeout(() => {
      Animated.timing(toastFadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setStreamToast(null));
    }, 1800);
  }, [toastFadeAnim]);

  // Live Dedicated Notice Space (선물 알림글 & 하트 전용 공간)
  const [liveNotice, setLiveNotice] = useState(null); // { id, type: 'gift' | 'like', title, desc }
  const noticeTimeoutRef = useRef(null);

  const showLiveNotice = useCallback(({ type, title, desc }) => {
    if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
    const id = Date.now().toString();
    setLiveNotice({ id, type, title, desc });
    noticeTimeoutRef.current = setTimeout(() => {
      setLiveNotice(null);
    }, 4500);
  }, []);

  useEffect(() => {
    if (isCameraOff && !isMicMuted) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 850,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 850,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isCameraOff, isMicMuted, pulseAnim]);

  const toggleMic = useCallback(() => {
    setIsMicMuted((prev) => {
      const next = !prev;
      showStreamToast(
        next ? '마이크가 음소거되었습니다' : '마이크가 켜졌습니다',
        next ? 'mic-off' : 'mic'
      );
      return next;
    });
  }, [showStreamToast]);

  const toggleCamera = useCallback(() => {
    setIsCameraOff((prev) => {
      const next = !prev;
      showStreamToast(
        next ? '카메라를 끄고 음성 모드로 전환했습니다' : '카메라 라이브 영상으로 전환했습니다',
        next ? 'videocam-off' : 'videocam'
      );
      return next;
    });
  }, [showStreamToast]);

  const toggleCameraFacing = useCallback(() => {
    setCameraFacing((prev) => {
      const next = prev === 'front' ? 'back' : 'front';
      showStreamToast(
        next === 'front' ? '전면 카메라로 전환했습니다' : '후면 카메라로 전환했습니다',
        'camera-reverse'
      );
      return next;
    });
  }, [showStreamToast]);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerMuted((prev) => {
      const next = !prev;
      showStreamToast(
        next ? '스피커를 음소거했습니다' : '스피커 음량을 켰습니다',
        next ? 'volume-mute' : 'volume-high'
      );
      return next;
    });
  }, [showStreamToast]);

  const handleResumeVideo = useCallback(() => {
    agoraStreamController.subscribeRemoteVideo();
    setIsCameraOff(false);
    showStreamToast('라이브 비디오 영상을 다시 켰습니다', 'videocam');
  }, [agoraStreamController, showStreamToast]);

  const initialHostFlag = useRef(Boolean(route?.params?.isHost)).current;

  const isHost = Boolean(
    initialHostFlag ||
    route?.params?.isHost ||
    (currentUser?.id && room?.host?.id && String(currentUser.id) === String(room.host.id)) ||
    (currentUser?.id && room?.hostId && String(currentUser.id) === String(room.hostId)) ||
    (currentUser?.activityAccountId && room?.host?.targetAccountId && String(currentUser.activityAccountId) === String(room.host.targetAccountId))
  );

  const hasCameraPermission = Boolean(
    cameraPermission?.granted || cameraPermission?.status === 'granted'
  );

  const handleRequestCamera = useCallback(async () => {
    try {
      const res = await requestCameraPermission();
      if (!res?.granted && res?.canAskAgain === false) {
        Alert.alert(
          '카메라 권한 필요',
          '기기 설정에서 카메라 접근 권한을 허용해 주셔야 실시간 방송을 진행할 수 있습니다.',
          [
            { text: '취소', style: 'cancel' },
            { text: '설정으로 이동', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch (e) {
      console.warn('Camera permission request error', e);
    }
  }, [requestCameraPermission]);

  // 호스트 방송 시 카메라 권한 자동 요청
  useEffect(() => {
    if (isHost && !hasCameraPermission) {
      requestCameraPermission();
    }
  }, [isHost, hasCameraPermission, requestCameraPermission]);

  const viewerKey = currentUser?.id || currentUser?.activityAccountId;

  const loadRoomDetails = useCallback(async () => {
    if (!roomId) return;
    try {
      const details = await apiClient.getLiveRoom(roomId);
      if (details) {
        setRoom(details);
        setViewerCount(details.viewerCount || 1);
        setLikeCount(details.totalLikes || 0);
      }
    } catch (e) {
      console.warn('Failed to load room details', e);
    }
  }, [roomId]);

  // Join room on mount, leave on unmount with viewerKey deduplication
  useEffect(() => {
    if (!roomId) return;
    let mounted = true;

    apiClient.joinLiveRoom(roomId, viewerKey).then((res) => {
      if (mounted && res?.viewerCount) {
        setViewerCount(res.viewerCount);
      }
    });

    loadRoomDetails();

    return () => {
      mounted = false;
      apiClient.leaveLiveRoom(roomId, viewerKey).catch(() => {});
    };
  }, [roomId, viewerKey, loadRoomDetails]);

  // 백그라운드 진입 시 Agora 비디오 스트림 구독 해제 및 포그라운드 복귀 시 자동 재구독 (트래픽/과금 최적화)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (
        appStateRef.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App moving to background
        setIsBackgroundAudioMode(true);
        if (!isHost) {
          // 시청자: Agora 비디오 구독 해제 -> 저렴한 오디오 요율로 전환
          wasVideoActiveBeforeBgRef.current = isVideoSubscribed && !isCameraOff;
          agoraStreamController.unsubscribeRemoteVideo();
          setIsCameraOff(true);
          showStreamToast(
            '백그라운드 절전: 비디오 구독 해제 (오디오 전용 모드 전환)',
            'musical-notes'
          );
        } else {
          // 호스트: 카메라 송출 일시 중지
          agoraStreamController.muteLocalVideo(true);
          showStreamToast(
            '백그라운드 전환: 카메라 영상 송출이 일시 정지되었습니다',
            'videocam-off'
          );
        }
      } else if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App returning to foreground
        setIsBackgroundAudioMode(false);
        if (!isHost) {
          // 시청자: 백그라운드 진입 전 비디오를 시청하고 있었다면 비디오 구독 복원
          if (wasVideoActiveBeforeBgRef.current) {
            agoraStreamController.subscribeRemoteVideo();
            setIsCameraOff(false);
            showStreamToast(
              '포그라운드 복귀: 라이브 비디오 스트림이 복원되었습니다',
              'videocam'
            );
          }
        } else {
          // 호스트: 카메라 송출 복원
          if (!isCameraOff) {
            agoraStreamController.muteLocalVideo(false);
            showStreamToast('카메라 영상 송출이 재개되었습니다', 'videocam');
          }
        }
        // 복귀 시 서버 최신 시청자 수 및 방 상태 즉시 재동기화
        loadRoomDetails();
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [isHost, isCameraOff, isVideoSubscribed, showStreamToast, loadRoomDetails, agoraStreamController]);

  // Agora Live Streaming Token initialization (Audio + Video)
  useEffect(() => {
    if (!roomId) return;
    let mounted = true;

    const initAgoraStream = async () => {
      const safetyTimeout = setTimeout(() => {
        if (mounted) setStreamConnecting(false);
      }, 2500);

      try {
        setStreamConnecting(true);
        const role = isHost ? 'publisher' : 'subscriber';
        const res = await apiClient.getLiveAgoraToken(roomId, role);
        if (mounted && res) {
          setAgoraTokenData(res);
          if (res.streamDeliveryMode === 'CDN_HLS') {
            if (isHost) {
              showStreamToast('CDN 중계 모드: Agora RTMP로 실시간 미디어가 송출됩니다', 'flash');
            } else {
              showStreamToast('대규모 시청 최적화: CDN HLS 스트림으로 시청 중입니다', 'flash');
            }
          }
        }
      } catch (err) {
        console.warn('Agora token initialization error', err);
      } finally {
        clearTimeout(safetyTimeout);
        if (mounted) {
          setStreamConnecting(false);
        }
      }
    };

    initAgoraStream();

    return () => {
      mounted = false;
    };
  }, [roomId, isHost]);

  // Realtime Live WebSocket Connection (Sub-second messages, gifts, likes, viewer counts)
  useEffect(() => {
    if (!roomId) return;
    const normalizedToken = typeof authToken === 'string' ? authToken.trim() : '';
    if (!normalizedToken) return;

    let socket = null;
    try {
      socket = createChatSocket(normalizedToken);
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit(LIVE_SOCKET_EVENTS.JOIN, { roomId, viewerKey });
      });

      socket.on(LIVE_SOCKET_EVENTS.AUTH_READY, () => {
        socket.emit(LIVE_SOCKET_EVENTS.JOIN, { roomId, viewerKey });
      });

      socket.on(LIVE_SOCKET_EVENTS.MESSAGE, (msg) => {
        if (!msg?.id) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        const msgType = String(msg.type || '').toLowerCase();
        if (msgType === 'like') {
          setLikeCount((c) => c + 1);
          floatingHeartsRef.current?.addHeart();
          const likerName =
            msg.senderName ||
            msg.sender?.nickname ||
            msg.sender?.displayName ||
            msg.sender?.name ||
            '시청자';
          showLiveNotice({
            type: 'like',
            title: `❤️ ${likerName}님의 하트 응원`,
            desc: '라이브 방송에 따뜻한 하트를 보냈습니다!',
          });
        } else if (msgType === 'gift') {
          const giftPts = Number(msg.giftPoints || 0);
          if (giftPts > 0) {
            setRoom((prev) =>
              prev
                ? {
                    ...prev,
                    totalGiftsPoints: (prev.totalGiftsPoints || 0) + giftPts,
                  }
                : prev,
            );
          }
          if (!processedGiftMessageIdsRef.current.has(msg.id)) {
            processedGiftMessageIdsRef.current.add(msg.id);
            let giftMeta = {};
            try {
              giftMeta = typeof msg.content === 'string' ? JSON.parse(msg.content) : (msg.content || {});
            } catch {
              giftMeta = {};
            }

            const resolvedType =
              giftMeta.animationType ||
              (giftMeta.giftName?.includes('폭죽')
                ? 'fireworks'
                : giftMeta.giftName?.includes('하트')
                ? '3d_heart'
                : giftMeta.animationUrl
                ? 'alpha_video'
                : (giftPts >= 3000 ? 'fireworks' : '3d_heart'));

            const donorName =
              giftMeta.senderNickname ||
              msg.senderName ||
              msg.sender?.nickname ||
              msg.sender?.displayName ||
              msg.sender?.name ||
              '시청자';

            const gName = giftMeta.giftName || '선물';
            const gPoints = giftMeta.pricePoints || giftPts;

            showLiveNotice({
              type: 'gift',
              title: `🎁 ${donorName}님의 선물 후원!`,
              desc: `[${gName}] ${Number(gPoints).toLocaleString()}온을 보냈습니다`,
            });

            giftOverlayRef.current?.enqueueGift({
              giftId: giftMeta.giftId || 'gift',
              giftName: gName,
              pricePoints: gPoints,
              senderNickname: donorName,
              animationUrl: giftMeta.animationUrl,
              animationType: resolvedType,
              thumbnailUrl: giftMeta.thumbnailUrl,
            });
          }
        }
      });

      socket.on(LIVE_SOCKET_EVENTS.VIEWER_COUNT, (data) => {
        if (typeof data?.viewerCount === 'number') {
          setViewerCount(data.viewerCount);
        }
      });

      socket.on(LIVE_SOCKET_EVENTS.ROOM_ENDED, (data) => {
        setIsCameraOff(true);
        setIsMicMuted(true);
        Alert.alert('방송 종료', data?.reason || '라이브 방송이 종료되었습니다.', [
          { text: '확인', onPress: () => navigation.goBack() },
        ]);
      });

      socket.connect();
    } catch (e) {
      console.warn('Live socket connection error', e);
    }

    return () => {
      if (socket) {
        if (socket.connected) {
          socket.emit(LIVE_SOCKET_EVENTS.LEAVE, { roomId, viewerKey });
        }
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [roomId, authToken, viewerKey, navigation]);

  const fetchMyPoints = useCallback(async () => {
    try {
      const res = await apiClient.getPointBalance();
      const bal = res?.balance ?? res?.pointBalance ?? res?.spendableBalance;
      if (typeof bal === 'number') {
        setMyPoints(bal);
        return;
      }
      const me = await apiClient.getMe();
      const fallbackBal = me?.pointBalance ?? me?.pointsBalance ?? me?.points ?? me?.balance;
      if (typeof fallbackBal === 'number') {
        setMyPoints(fallbackBal);
      }
    } catch {
      // quiet fallback
    }
  }, []);

  useEffect(() => {
    fetchMyPoints();
  }, [fetchMyPoints]);

  // Initial load and backup polling
  const fetchMessages = useCallback(async () => {
    if (!roomId) return;
    try {
      const msgs = await apiClient.getLiveMessages(roomId);
      if (Array.isArray(msgs)) {
        // 기존 작성 메시지가 지워지지 않도록 ID 기준 병합(Merge)
        setMessages((prev) => {
          const map = new Map();
          (prev || []).forEach((m) => {
            if (m?.id) map.set(m.id, m);
          });
          msgs.forEach((m) => {
            if (m?.id) map.set(m.id, m);
          });
          return Array.from(map.values());
        });

        // 수신된 3D 선물 메시지 자동 감지 및 FIFO 큐 재생
        msgs.forEach((msg) => {
          const mType = String(msg?.type || '').toLowerCase();
          if (mType === 'gift' && msg?.id && !processedGiftMessageIdsRef.current.has(msg.id)) {
            processedGiftMessageIdsRef.current.add(msg.id);
            let giftMeta = {};
            try {
              giftMeta = typeof msg.content === 'string' ? JSON.parse(msg.content) : (msg.content || {});
            } catch {
              giftMeta = {};
            }

            const giftPts = Number(giftMeta.pricePoints || msg.giftPoints || 0);
            const resolvedType =
              giftMeta.animationType ||
              (giftMeta.giftName?.includes('폭죽')
                ? 'fireworks'
                : giftMeta.giftName?.includes('하트')
                ? '3d_heart'
                : giftMeta.animationUrl
                ? 'alpha_video'
                : (giftPts >= 3000 ? 'fireworks' : '3d_heart'));

            const donorName =
              giftMeta.senderNickname ||
              msg.senderName ||
              msg.sender?.nickname ||
              msg.sender?.displayName ||
              msg.sender?.name ||
              '시청자';

            giftOverlayRef.current?.enqueueGift({
              giftId: giftMeta.giftId || 'gift',
              giftName: giftMeta.giftName || '선물',
              pricePoints: giftPts,
              senderNickname: donorName,
              animationUrl: giftMeta.animationUrl,
              animationType: resolvedType,
              thumbnailUrl: giftMeta.thumbnailUrl,
            });
          }
        });
      }
    } catch {
      // quiet fallback
    }
  }, [roomId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    setSending(true);
    setInputText('');
    Keyboard.dismiss();
    try {
      const senderNickname = currentUser?.nickname || currentUser?.displayName || '나';
      const senderAvatar = currentUser?.avatarUrl || currentUser?.avatarUri || null;
      const res = await apiClient.sendLiveMessage({
        roomId,
        content: text,
        type: 'chat',
        senderId: currentUser?.id,
        senderName: senderNickname,
        senderAvatar,
        isHost,
      });
      const newMsg = res?.data || res?.message || res;
      if (newMsg?.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (socketRef.current?.connected) {
          socketRef.current.emit(LIVE_SOCKET_EVENTS.MESSAGE, newMsg);
        }
      }
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (e) {
      Alert.alert('전송 실패', e?.message || '메시지 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleSendHeart = async () => {
    setLikeCount((prev) => prev + 1);
    floatingHeartsRef.current?.addHeartsBurst(3);
    showLiveNotice({
      type: 'like',
      title: '❤️ 내가 보낸 하트',
      desc: '호스트님에게 하트를 보냈습니다!',
    });
    try {
      const senderNickname = currentUser?.nickname || currentUser?.displayName || '나';
      const senderAvatar = currentUser?.avatarUrl || currentUser?.avatarUri || null;
      const res = await apiClient.sendLiveMessage({
        roomId,
        content: '❤️ 하트를 보냈습니다!',
        type: 'like',
        senderId: currentUser?.id,
        senderName: senderNickname,
        senderAvatar,
        isHost,
      });
      const likeMsg = res?.data || res?.message || res;
      if (socketRef.current?.connected && likeMsg?.id) {
        socketRef.current.emit(LIVE_SOCKET_EVENTS.MESSAGE, likeMsg);
      }
    } catch {
      // quiet fallback
    }
  };

  const handleOpenGiftPicker = () => {
    if (isHost) {
      Alert.alert('알림', '호스트는 본인 방송에 선물을 보낼 수 없습니다. 시청자로부터 선물을 받으실 수 있습니다.');
      return;
    }
    fetchMyPoints();
    setGiftPickerVisible(true);
  };

  const handleSendGiftItem = async (gift) => {
    if (!gift || !roomId) return;
    if (isHost) {
      Alert.alert('알림', '호스트는 본인 방송에 선물을 보낼 수 없습니다.');
      return;
    }
    try {
      const idempotencyKey = `live_${roomId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const res = await apiClient.sendLiveGift(roomId, {
        giftId: gift.id,
        points: gift.pricePoints,
        giftName: gift.name,
        animationType: gift.animationType,
        idempotencyKey,
      });

      const updatedBalance = res?.newBalance ?? res?.remainingBalance ?? res?.data?.newBalance;
      if (updatedBalance !== undefined && updatedBalance !== null) {
        setMyPoints(Number(updatedBalance));
      }
      const updatedTotalGifts = res?.totalGiftsPoints ?? res?.data?.totalGiftsPoints;
      if (typeof updatedTotalGifts === 'number') {
        setRoom((prev) => (prev ? { ...prev, totalGiftsPoints: updatedTotalGifts } : prev));
      }

      // 내 화면에서도 3D 투명 비디오/애니메이션 이펙트 큐에 즉시 삽입
      const resolvedSendType =
        gift.animationType ||
        (gift.name?.includes('폭죽')
          ? 'fireworks'
          : gift.name?.includes('하트')
          ? '3d_heart'
          : gift.animationUrl
          ? 'alpha_video'
          : (gift.pricePoints >= 3000 ? 'fireworks' : '3d_heart'));

      const myNickname = currentUser?.nickname || currentUser?.displayName || currentUser?.name || '나';

      showLiveNotice({
        type: 'gift',
        title: '🎁 내가 보낸 선물!',
        desc: `[${gift.name}] ${Number(gift.pricePoints).toLocaleString()}온을 후원했습니다`,
      });

      giftOverlayRef.current?.enqueueGift({
        giftId: gift.id,
        giftName: gift.name,
        pricePoints: gift.pricePoints,
        senderNickname: myNickname,
        animationUrl: gift.animationUrl,
        animationType: resolvedSendType,
        thumbnailUrl: gift.thumbnailUrl,
      });

      // 선물 메시지를 로컬 채팅 목록에도 즉시 반영하여 누가 보냈는지 표시
      const giftMsg = res?.data || res?.message;
      if (giftMsg && giftMsg.id) {
        if (!processedGiftMessageIdsRef.current.has(giftMsg.id)) {
          processedGiftMessageIdsRef.current.add(giftMsg.id);
        }
        setMessages((prev) => {
          if (prev.some((m) => m.id === giftMsg.id)) return prev;
          return [...prev, giftMsg];
        });
        if (socketRef.current?.connected) {
          socketRef.current.emit(LIVE_SOCKET_EVENTS.MESSAGE, giftMsg);
        }
        flatListRef.current?.scrollToEnd({ animated: true });
      } else {
        fetchMessages();
      }
    } catch (e) {
      Alert.alert('선물 실패', e?.message || '선물 보내기에 실패했습니다.');
    }
  };

  const handleEndBroadcast = () => {
    Alert.alert('방송 종료', '정말로 라이브 방송을 종료하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '방송 종료',
        style: 'destructive',
        onPress: async () => {
          try {
            // 즉시 카메라 및 마이크 센서, Agora 스트림 종료
            setIsCameraOff(true);
            setIsMicMuted(true);
            agoraStreamController.muteLocalVideo(true);
            agoraStreamController.muteLocalAudio(true);
            if (socketRef.current?.connected) {
              socketRef.current.emit(LIVE_SOCKET_EVENTS.LEAVE, { roomId, viewerKey });
            }
            await apiClient.endLiveRoom(roomId);
          } catch (e) {
            console.warn('방송 종료 API 처리:', e);
          } finally {
            navigation.goBack();
          }
        },
      },
    ]);
  };

  const handleOpenRoomSafetyMenu = () => {
    const hostName = room?.host?.name || '호스트';
    const hostId = room?.host?.id;

    Alert.alert(
      '방송 및 호스트 관리',
      '원하시는 작업을 선택하세요.',
      [
        {
          text: '방송 및 호스트 신고하기',
          style: 'destructive',
          onPress: () => {
            setReportTarget({
              type: 'room',
              name: room?.title || `${hostName}님의 방송`,
              userId: hostId,
            });
            setReportModalVisible(true);
          },
        },
        ...(hostId
          ? [
              {
                text: `${hostName} 차단하기`,
                style: 'destructive',
                onPress: () => handleBlockUser(hostId, hostName),
              },
            ]
          : []),
        { text: '취소', style: 'cancel' },
      ],
    );
  };

  const handleOpenParticipantProfile = async (participantData) => {
    if (!participantData) return;
    const initialProfile = {
      ...participantData,
      photos: participantData.avatar ? [{ id: 'p1', url: participantData.avatar, isPrimary: true }] : [],
    };
    setSelectedParticipant(initialProfile);
    setProfileSheetVisible(true);

    // 9장 갤러리 사진 비동기 조회 및 주입
    const uid = participantData.userId || participantData.id;
    if (uid) {
      try {
        const photos = await apiClient.getUserPhotos(uid);
        if (Array.isArray(photos) && photos.length > 0) {
          setSelectedParticipant((prev) => (prev ? { ...prev, photos } : prev));
        }
      } catch {}
    }
  };

  const handleStartCallFromProfile = (targetUser) => {
    if (!targetUser) return;
    const rate = Number(targetUser.pointsPerMinute || 1500);
    Alert.alert(
      '1:1 LIVE 라이브 방송 요청',
      `${targetUser.name}님에게 1:1 프라이빗 라이브를 요청하시겠습니까?\n(분당 ${rate.toLocaleString()} 온이 소진됩니다)`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '1:1 LIVE 요청',
          onPress: () => {
            setProfileSheetVisible(false);
            Alert.alert('1:1 LIVE 연결 중', `${targetUser.name}님의 응답을 기다리고 있습니다... 🎥✨`);
          },
        },
      ]
    );
  };

  const handleStartDMFromProfile = (targetUser) => {
    if (!targetUser?.id) return;
    setProfileSheetVisible(false);
    checkAndConfirmActionPoint({
      actionType: 'chatRoomCreate',
      actionName: '1:1 대화방 개설',
      navigation,
      onConfirm: async () => {
        try {
          const room = await apiClient.ensureDirectRoom({ targetUserId: targetUser.id });
          const roomId = room?.id || room?._id;
          if (roomId) {
            navigation.navigate('Chat', {
              screen: 'ChatRoom',
              params: {
                id: roomId,
                room,
                user: targetUser,
              },
            });
          }
        } catch (e) {
          Alert.alert('안내', e?.message || '대화방을 생성할 수 없습니다.');
        }
      },
    });
  };

  const handleMessagePress = (msg) => {
    const sender = msg?.sender;
    const senderId = sender?.id || msg?.senderId;
    if (!senderId) return;

    handleOpenParticipantProfile({
      id: senderId,
      userId: senderId,
      name: msg?.senderName || sender?.name || sender?.profile?.nickname || '참여자',
      avatar: msg?.senderAvatar || sender?.avatar || sender?.profile?.avatarUri || sender?.avatarUrl,
      region: sender?.region || [sender?.region1, sender?.region2].filter(Boolean).join(' '),
      gender: sender?.gender,
      headline: sender?.profile?.headline,
      bio: sender?.profile?.bio,
    });
  };

  const handleBlockUser = (userId, displayName) => {
    Alert.alert(
      '사용자 차단',
      `'${displayName}'님을 차단하시겠습니까?\n차단하면 상대방의 메시지가 더 이상 표시되지 않으며, 대화할 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '차단하기',
          style: 'destructive',
          onPress: async () => {
            try {
              setBlocking(true);
              await apiClient.blockUser({ blockedUserId: userId });
              setMessages((prev) => prev.filter((m) => m?.sender?.id !== userId));
              Alert.alert('차단 완료', `'${displayName}'님이 차단되었습니다.`);
            } catch (e) {
              Alert.alert('차단 실패', e?.message || '사용자 차단에 실패했습니다.');
            } finally {
              setBlocking(false);
            }
          },
        },
      ],
    );
  };

  const handleReportSubmit = async ({ category, details }) => {
    try {
      await apiClient.reportUser({
        targetUserId: reportTarget?.userId,
        reason: `[라이브_${reportTarget?.type || 'room'}] ${category}: ${details}`,
      });
      Alert.alert(
        '신고 완료',
        '신고가 정상적으로 접수되었습니다. 운영팀에서 신속하게 검토하겠습니다.',
      );
      setReportModalVisible(false);
    } catch (e) {
      Alert.alert('신고 실패', e?.message || '신고 접수 중 오류가 발생했습니다.');
    }
  };

  const chatMessages = useMemo(() => {
    return messages.filter((m) => {
      const type = String(m?.type || '').toLowerCase();
      return type !== 'like' && type !== 'gift';
    });
  }, [messages]);

  const renderMessageItem = ({ item }) => {
    const isSystem = item?.type === 'system';
    const hostId = room?.host?.id || room?.hostId;
    const isHostMessage = item?.isHost || (hostId && item?.senderId === hostId) || (isHost && item?.senderId === currentUser?.id);
    const isMe = item?.senderId === currentUser?.id;

    const authorName =
      item?.senderName ||
      item?.sender?.nickname ||
      item?.sender?.displayName ||
      item?.sender?.name ||
      (isSystem ? '시스템' : '시청자');

    const displayContent = item?.content || '';

    return (
      <TouchableOpacity
        style={[
          styles.chatBubble,
          isSystem
            ? styles.systemBubble
            : isHostMessage
            ? styles.hostBubble
            : isMe
            ? styles.myBubble
            : styles.viewerBubble,
        ]}
        onPress={() => handleMessagePress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.authorBadgeRow}>
          {isHostMessage ? (
            <View style={styles.hostRoleBadge}>
              <Text style={styles.hostRoleBadgeText}>방장</Text>
            </View>
          ) : isMe ? (
            <View style={styles.myRoleBadge}>
              <Text style={styles.myRoleBadgeText}>나</Text>
            </View>
          ) : isSystem ? (
            <View style={styles.systemRoleBadge}>
              <Text style={styles.systemRoleBadgeText}>공지</Text>
            </View>
          ) : null}
          <Text
            style={[
              styles.chatAuthor,
              isHostMessage && styles.hostAuthorText,
              isMe && styles.myAuthorText,
              isSystem && styles.systemAuthorText,
            ]}
          >
            {authorName}
          </Text>
        </View>
        <Text
          style={[
            styles.chatContent,
            isHostMessage && styles.hostContentText,
            isSystem && styles.systemContentText,
          ]}
        >
          {displayContent}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Background Live Video / Stream Canvas */}
      <View style={styles.streamCanvas}>
        {(streamConnecting && !isHost) ? (
          <View style={styles.connectingBox}>
            <ActivityIndicator size="large" color={LIVE_ACCENT} />
            <Text style={styles.connectingText}>Agora 라이브 스트림 연결 중...</Text>
          </View>
        ) : (!isCameraOff && isVideoSubscribed) ? (
          // Video Canvas Mode (Camera ON: Host local video or Viewer remote video)
          <View style={styles.videoStreamContainer}>
            {/* 호스트 실제 스마트폰 카메라 피드 */}
            {isHost ? (
              hasCameraPermission ? (
                isFocused && !isCameraOff ? (
                  <View style={styles.cameraFillWrapper}>
                    <CameraView
                      key={`cam_${cameraFacing}_${isFocused ? 'focused' : 'blurred'}`}
                      style={styles.cameraPreview}
                      facing={cameraFacing}
                      enableTorch={false}
                      onCameraReady={() => {
                        setIsCameraReady(true);
                        setCameraMountError(null);
                      }}
                      onMountError={(error) => {
                        console.warn('Camera mount error:', error);
                        setCameraMountError(error?.message || '카메라 센서를 열 수 없습니다.');
                      }}
                    />
                    {!isCameraReady && !cameraMountError && (
                      <View style={styles.cameraLoadingOverlay} pointerEvents="none">
                        <ActivityIndicator size="large" color={LIVE_ACCENT} />
                        <Text style={styles.cameraLoadingText}>카메라 센서 초기화 중...</Text>
                      </View>
                    )}
                    {cameraMountError && (
                      <View style={styles.cameraMountErrorBox}>
                        <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
                        <Text style={styles.cameraMountErrorTitle}>카메라를 열 수 없습니다</Text>
                        <Text style={styles.cameraMountErrorDesc}>{cameraMountError}</Text>
                        <TouchableOpacity
                          style={styles.cameraRetryBtn}
                          onPress={() => {
                            setCameraMountError(null);
                            setIsCameraReady(false);
                          }}
                        >
                          <Text style={styles.cameraRetryBtnText}>카메라 다시 열기</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.cameraOffPlaceholder}>
                    <Ionicons name="videocam-off" size={48} color="rgba(255,255,255,0.5)" />
                    <Text style={styles.cameraOffText}>카메라가 꺼져 있습니다</Text>
                  </View>
                )
              ) : (
                <TouchableOpacity
                  style={styles.permissionPromptBox}
                  activeOpacity={0.8}
                  onPress={handleRequestCamera}
                >
                  <Ionicons name="camera-outline" size={54} color={LIVE_ACCENT} />
                  <Text style={styles.permissionPromptTitle}>카메라 권한이 필요합니다</Text>
                  <Text style={styles.permissionPromptDesc}>
                    실시간 영상 방송을 위해 카메라 권한을 허용해 주세요.
                  </Text>
                  <View style={styles.permissionPromptBtn}>
                    <Text style={styles.permissionPromptBtnText}>카메라 권한 허용하기</Text>
                  </View>
                </TouchableOpacity>
              )
            ) : (
              /* 시청자 화면: 호스트의 실시간 영상 방송 센터 워터마크 */
              <View style={styles.videoCenterBadge}>
                <Avatar
                  size={96}
                  name={room?.host?.name}
                  uri={room?.host?.avatar}
                  showBorder
                  style={styles.hostAvatarVisual}
                />
                <Text style={styles.videoHostCaption}>
                  {room?.host?.name || '호스트'}님의 실시간 영상 방송
                </Text>
                <Text style={styles.viewerRoleSubtitle}>
                  시청자 모드로 참여 중입니다
                </Text>
              </View>
            )}
          </View>
        ) : (
          // Audio Only Mode (Camera turned OFF or Background Video Unsubscribed)
          <View style={styles.audioOnlyContainer}>
            <View style={styles.audioAvatarWrapper}>
              <Animated.View
                style={[
                  styles.audioPulseHalo,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: isMicMuted ? 0 : 0.4,
                  },
                ]}
              />
              <Avatar
                size={110}
                name={room?.host?.name}
                uri={room?.host?.avatar}
                showBorder
                style={styles.hostAvatarVisual}
              />
            </View>
            <LiveAudioWaveform isMuted={isMicMuted} />
            <Text style={styles.liveNoticeText}>
              {!isVideoSubscribed || isBackgroundAudioMode
                ? '🎧 백그라운드 절전 / 오디오 전용 수신 중'
                : '카메라를 끄고 고음질 음성 라이브로 진행 중입니다'}
            </Text>
            {!isVideoSubscribed && (
              <Text style={styles.trafficSaveBadge}>
                Agora 비디오 구독 해제 · 저렴한 오디오 요율 적용 (트래픽 최적화)
              </Text>
            )}
            {!isHost && !isVideoSubscribed && (
              <TouchableOpacity
                style={styles.resumeStreamBtn}
                activeOpacity={0.8}
                onPress={handleResumeVideo}
              >
                <Ionicons name="videocam" size={15} color="#191919" />
                <Text style={styles.resumeStreamBtnText}>영상 다시 보기 (구독 재개)</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Top Header Overlay (타사 스타일 반영: 호스트 캡슐 + 기여도 랭킹 1~4등 화려한 원형라인 + 시청자수 + 닫기) */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.hostPill}
          activeOpacity={0.85}
          onPress={() => {
            if (room?.host?.id || isHost) {
              handleOpenParticipantProfile({
                id: isHost ? currentUser?.id : room?.host?.id,
                userId: isHost ? currentUser?.id : room?.host?.id,
                name: isHost ? (currentUser?.nickname || currentUser?.displayName || '나') : (room?.host?.name || '호스트'),
                avatar: isHost ? (currentUser?.avatarUrl || currentUser?.avatarUri) : room?.host?.avatar,
                region: isHost ? (currentUser?.region || '서울 강남구') : (room?.host?.region || '서울 강남구'),
                headline: room?.title || '라이브 방송 진행 중',
              });
            }
          }}
        >
          <Avatar
            size={32}
            name={isHost ? (currentUser?.nickname || currentUser?.displayName || '나') : (room?.host?.name || '호스트')}
            uri={isHost ? (currentUser?.avatarUrl || currentUser?.avatarUri) : room?.host?.avatar}
          />
          <View style={styles.hostPillMeta}>
            <View style={styles.hostPillNameRow}>
              <Text style={styles.hostPillName} numberOfLines={1}>
                {isHost ? `${currentUser?.nickname || currentUser?.displayName || '나'} (방장)` : (room?.host?.name || '호스트')}
              </Text>
            </View>
            <Text style={styles.hostPillRegion} numberOfLines={1}>
              {isHost ? (currentUser?.region || '서울 강남구') : (room?.host?.region || '서울 강남구')}
            </Text>
          </View>
        </TouchableOpacity>

        {/* 우측 상단: 기여도 랭킹 1~4위 (개별 분리 및 1등 골드 테두리 라인) + 시청자수 + 닫기 버튼 */}
        <View style={styles.topHeaderRight}>
          <TouchableOpacity
            style={styles.contributorRankingGroup}
            onPress={() => setViewerModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.rankAvatarsRow}>
              {topContributors.map((c, idx) => {
                const isFirst = idx === 0;
                const isSecond = idx === 1;
                const isThird = idx === 2;
                return (
                  <View
                    key={`c_hdr_${c.id || idx}`}
                    style={[
                      styles.rankAvatarRing,
                      isFirst && styles.rank1Ring,
                      isSecond && styles.rank2Ring,
                      isThird && styles.rank3Ring,
                    ]}
                  >
                    <Avatar size={26} name={c.name} uri={c.avatar} />
                    {isFirst && (
                      <View style={styles.rank1Badge}>
                        <Text style={styles.rank1BadgeText}>1</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
            <View style={styles.viewerCountPill}>
              <Text style={styles.viewerCountPillText}>
                {viewerCount > 999 ? `${(viewerCount / 1000).toFixed(1)}K` : viewerCount}
              </Text>
            </View>
          </TouchableOpacity>

          {!isHost && (
            <TouchableOpacity
              style={styles.safetyButton}
              onPress={handleOpenRoomSafetyMenu}
              hitSlop={8}
            >
              <Ionicons name="ellipsis-vertical" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Top Right 'X' button: exits as viewer, ends broadcast as host */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              if (isHost) {
                handleEndBroadcast();
              } else {
                navigation.goBack();
              }
            }}
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dynamic Toast Status Pill */}
      {streamToast && (
        <Animated.View
          style={[styles.streamToastContainer, { opacity: toastFadeAnim }]}
          pointerEvents="none"
        >
          <Ionicons name={streamToast.icon} size={15} color="#FEE500" />
          <Text style={styles.streamToastText}>{streamToast.msg}</Text>
        </Animated.View>
      )}

      {/* Media Streaming Quick Controls Toolbar (Host Top Row) */}
      {isHost && (
        <View style={styles.mediaToolBar}>
          <TouchableOpacity
            style={[styles.mediaToolBtn, isMicMuted && styles.mediaToolBtnActive]}
            onPress={toggleMic}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isMicMuted ? 'mic-off' : 'mic'}
              size={15}
              color={isMicMuted ? '#EF4444' : '#FFFFFF'}
            />
            <Text style={[styles.mediaToolText, isMicMuted && styles.mediaToolTextActive]}>
              {isMicMuted ? '마이크 끔' : '마이크'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mediaToolBtn, isCameraOff && styles.mediaToolBtnActive]}
            onPress={toggleCamera}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isCameraOff ? 'videocam-off' : 'videocam'}
              size={15}
              color={isCameraOff ? '#EF4444' : '#FFFFFF'}
            />
            <Text style={[styles.mediaToolText, isCameraOff && styles.mediaToolTextActive]}>
              {isCameraOff ? '카메라 끔' : '카메라'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mediaToolBtn}
            onPress={toggleCameraFacing}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-reverse" size={15} color="#FFFFFF" />
            <Text style={styles.mediaToolText}>
              {cameraFacing === 'front' ? '전면' : '후면'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Area: Chat stream + Controls */}
      <View
        style={[
          styles.bottomOverlay,
          {
            bottom: liveBottomOffset,
          },
        ]}
      >
        {/* Real-time Gift & Heart Notice Bar (채팅글 표시 위에 별도로 전용 공간 표시) */}
        {liveNotice && (
          <View
            style={[
              styles.noticeBannerBox,
              liveNotice.type === 'gift' ? styles.giftNoticeBanner : styles.heartNoticeBanner,
            ]}
          >
            <View
              style={[
                styles.noticeIconWrap,
                liveNotice.type === 'gift' ? styles.giftNoticeIconWrap : styles.heartNoticeIconWrap,
              ]}
            >
              <Ionicons
                name={liveNotice.type === 'gift' ? 'gift' : 'heart'}
                size={16}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.noticeTextWrap}>
              <Text style={styles.noticeTitle} numberOfLines={1}>
                {liveNotice.title}
              </Text>
              <Text style={styles.noticeDesc} numberOfLines={1}>
                {liveNotice.desc}
              </Text>
            </View>
          </View>
        )}

        {/* Chat message list */}
        <View style={[styles.chatListWrap, keyboardHeight > 0 && styles.chatListWrapKeyboard]}>
          <FlatList
            ref={flatListRef}
            data={chatMessages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.chatListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        </View>

        {/* Action Controls Bar */}
        <View style={styles.controlsBar}>
          <TextInput
            style={[
              styles.chatInput,
              (keyboardHeight > 0 || isInputFocused) && styles.chatInputActive,
            ]}
            placeholder="실시간 대화에 참여해보세요..."
            placeholderTextColor={
              keyboardHeight > 0 || isInputFocused
                ? 'rgba(255,255,255,0.7)'
                : 'rgba(255,255,255,0.6)'
            }
            value={inputText}
            onChangeText={setInputText}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
          />

          {inputText.trim().length > 0 ? (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.reactionRow}>
              {/* Gift Picker Button - 시청자(게스트)만 방장/호스트에게 선물 전송 가능 */}
              {!isHost && (
                <TouchableOpacity
                  style={styles.giftIconBtn}
                  onPress={handleOpenGiftPicker}
                  activeOpacity={0.8}
                >
                  <Ionicons name="gift" size={20} color="#FBBF24" />
                </TouchableOpacity>
              )}

              {/* Heart reaction button */}
              <TouchableOpacity
                style={styles.heartIconBtn}
                onPress={handleSendHeart}
                activeOpacity={0.8}
              >
                <Ionicons name="heart" size={22} color={LIVE_ACCENT} />
                <Text style={styles.heartCountText}>{likeCount}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ReportModal
        visible={reportModalVisible}
        targetName={reportTarget?.name || '방송'}
        targetType={reportTarget?.type || 'room'}
        onClose={() => setReportModalVisible(false)}
        onSubmit={handleReportSubmit}
      />

      {/* Floating Animated Hearts Reaction Overlay */}
      <FloatingHeartsOverlay ref={floatingHeartsRef} />

      {/* Fullscreen 3D Gift Effect Overlay (pointerEvents="none", zIndex: 9999) */}
      <GiftOverlay ref={giftOverlayRef} />

      {/* Gift Picker Bottom Sheet */}
      <GiftPickerSheet
        visible={giftPickerVisible}
        onClose={() => setGiftPickerVisible(false)}
        onSendGift={handleSendGiftItem}
        myPoints={myPoints}
        onGoToShop={() => navigation.navigate('Shop')}
        context="live"
      />

      {/* Viewer & Contribution Ranking Bottom Sheet Modal */}
      <LiveViewerRankingSheet
        visible={viewerModalVisible}
        onClose={() => setViewerModalVisible(false)}
        viewerCount={viewerCount}
        messages={messages}
        currentUser={currentUser}
        isHost={isHost}
        hostId={room?.host?.id || (isHost ? currentUser?.id : null)}
        myContributionPoints={myContributionPoints}
        onOpenGiftPicker={() => {
          setViewerModalVisible(false);
          handleOpenGiftPicker();
        }}
        onSelectUser={(user) => {
          handleOpenParticipantProfile({
            id: user.id,
            userId: user.id,
            name: user.name,
            avatar: user.avatar,
            gender: user.gender,
          });
        }}
      />

      {/* 화면 유지 전역 프로필 바텀시트 (방송 Agora 끊김 없이 오버레이) */}
      <GlobalBottomSheet
        visible={profileSheetVisible}
        onClose={() => setProfileSheetVisible(false)}
        user={
          selectedParticipant
            ? {
                id: selectedParticipant.id || selectedParticipant.userId,
                name: selectedParticipant.name,
                avatar: selectedParticipant.avatar,
                headline:
                  selectedParticipant.headline ||
                  selectedParticipant.bio ||
                  '라이브 방송에 참여 중이에요 ✨',
                bio: selectedParticipant.bio,
                region: selectedParticipant.region,
                photos:
                  selectedParticipant.photos && selectedParticipant.photos.length > 0
                    ? selectedParticipant.photos
                    : selectedParticipant.avatar
                    ? [{ id: 'p1', url: selectedParticipant.avatar, isPrimary: true }]
                    : [],
                pointsPerMinute: 1500,
              }
            : null
        }
        onCallVoice={handleStartCallFromProfile}
        onCallVideo={handleStartCallFromProfile}
        onStartChat={handleStartDMFromProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
  },
  streamCanvas: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  connectingBox: {
    alignItems: 'center',
    gap: 12,
  },
  connectingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  videoStreamContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  cameraFillWrapper: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  cameraPreview: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  cameraLoadingOverlay: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    zIndex: 10,
  },
  cameraLoadingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cameraMountErrorBox: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
    zIndex: 3,
  },
  cameraMountErrorTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
  },
  cameraMountErrorDesc: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  cameraRetryBtn: {
    marginTop: 8,
    backgroundColor: LIVE_ACCENT,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cameraRetryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  cameraOffPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0B0F19',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  cameraOffText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  viewerRoleSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  viewfinderGrid: {
    ...StyleSheet.absoluteFillObject,
    margin: 24,
    pointerEvents: 'none',
  },
  cornerMarker: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  videoOverlayBadge: {
    position: 'absolute',
    top: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  videoOverlayText: {
    fontSize: 11,
    color: '#E5E7EB',
    fontWeight: '600',
  },
  videoOverlayBadgeCdn: {
    backgroundColor: 'rgba(2, 132, 199, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
  },
  videoCenterBadge: {
    alignItems: 'center',
    gap: 12,
  },
  videoHostCaption: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  audioOnlyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostAvatarVisual: {
    borderWidth: 4,
    borderColor: LIVE_ACCENT,
    shadowColor: LIVE_ACCENT,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
  },
  audioWaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: LIVE_ACCENT,
  },
  liveNoticeText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingHorizontal: 32,
    textAlign: 'center',
  },
  trafficSaveBadge: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    textAlign: 'center',
  },
  resumeStreamBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE500',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  resumeStreamBtnText: {
    color: '#191919',
    fontSize: 13,
    fontWeight: '800',
  },
  topHeader: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  hostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderRadius: 22,
    padding: 4,
    paddingRight: 10,
    gap: 6,
    maxWidth: 185,
  },
  hostPillMeta: {
    flexShrink: 1,
  },
  hostPillNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hostPillName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    maxWidth: 115,
  },
  miniLiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: LIVE_ACCENT,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  miniLiveTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  hostPillRegion: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: LIVE_ACCENT,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  topHeaderRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginLeft: 6,
  },
  rtcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.45)',
    gap: 4,
  },
  rtcBadgeAudio: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  cdnHlsBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    borderColor: 'rgba(56, 189, 248, 0.5)',
  },
  rtcDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  rtcDotAudio: {
    backgroundColor: '#F59E0B',
  },
  cdnHlsDot: {
    backgroundColor: '#38BDF8',
  },
  rtcBadgeText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '800',
  },
  contributorRankingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 18,
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 3,
    gap: 6,
  },
  rankAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rankAvatarRing: {
    borderRadius: 15,
    padding: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    position: 'relative',
  },
  rank1Ring: {
    borderColor: '#F59E0B',
    borderWidth: 2,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  rank2Ring: {
    borderColor: '#3B82F6',
    borderWidth: 1.5,
  },
  rank3Ring: {
    borderColor: '#FB923C',
    borderWidth: 1.5,
  },
  rank1Badge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  rank1BadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  viewerCountPill: {
    paddingHorizontal: 3,
  },
  viewerCountPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  safetyButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaToolBar: {
    position: 'absolute',
    top: 98,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
  },
  mediaToolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  mediaToolBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderColor: 'rgba(239, 68, 68, 0.7)',
  },
  mediaToolText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mediaToolTextActive: {
    color: '#FCA5A5',
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 0,
    zIndex: 10,
  },
  chatListWrap: {
    height: 290,
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  chatListWrapKeyboard: {
    height: 130,
    marginBottom: 8,
  },
  chatListContent: {
    gap: 6,
    justifyContent: 'flex-end',
  },
  noticeBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
    maxWidth: '92%',
  },
  giftNoticeBanner: {
    backgroundColor: 'rgba(30, 20, 10, 0.92)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  heartNoticeBanner: {
    backgroundColor: 'rgba(35, 10, 25, 0.92)',
    borderWidth: 1.5,
    borderColor: '#FF3B6B',
    shadowColor: '#FF3B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  noticeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  giftNoticeIconWrap: {
    backgroundColor: '#F59E0B',
  },
  heartNoticeIconWrap: {
    backgroundColor: '#FF3B6B',
  },
  noticeTextWrap: {
    flexShrink: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  noticeDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 1,
  },
  chatBubble: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: '88%',
  },
  viewerBubble: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  hostBubble: {
    backgroundColor: 'rgba(255, 59, 107, 0.35)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 59, 107, 0.85)',
  },
  myBubble: {
    backgroundColor: 'rgba(79, 70, 229, 0.38)',
    borderWidth: 1.2,
    borderColor: 'rgba(129, 140, 248, 0.75)',
  },
  systemBubble: {
    backgroundColor: 'rgba(30, 41, 59, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
  },
  authorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    gap: 5,
  },
  hostRoleBadge: {
    backgroundColor: '#FF3B6B',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  hostRoleBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  myRoleBadge: {
    backgroundColor: '#6366F1',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  myRoleBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  systemRoleBadge: {
    backgroundColor: '#0284C7',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  systemRoleBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  chatAuthor: {
    fontSize: 13,
    fontWeight: '800',
    color: '#93C5FD',
  },
  hostAuthorText: {
    color: '#FDE047',
  },
  myAuthorText: {
    color: '#C7D2FE',
  },
  systemAuthorText: {
    color: '#7DD3FC',
  },
  chatContent: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  hostContentText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  systemContentText: {
    color: '#E2E8F0',
    fontSize: 14,
  },
  giftTotalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  giftTotalBadgeText: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '700',
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    height: 42,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 21,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chatInputActive: {
    backgroundColor: 'rgba(15, 22, 53, 0.95)',
    borderColor: '#FEE500',
    borderWidth: 1.5,
    color: '#FFFFFF',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: LIVE_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  giftIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  heartIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 107, 0.4)',
  },
  heartCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  endBroadcastBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBroadcastText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  audioAvatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioPulseHalo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: LIVE_ACCENT,
  },
  streamToastContainer: {
    position: 'absolute',
    top: 104,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(254, 229, 0, 0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  streamToastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  permissionPromptBox: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  permissionPromptTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  permissionPromptDesc: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  permissionPromptBtn: {
    marginTop: 12,
    backgroundColor: LIVE_ACCENT,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: LIVE_ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  permissionPromptBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
