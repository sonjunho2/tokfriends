// src/screens/live/LiveRoomScreen.js
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import colors from '../../theme/colors';
import Avatar from '../../components/Avatar';
import ReportModal from '../../components/ReportModal';
import GiftEffectOverlay from '../../components/GiftEffectOverlay';
import GiftPickerSheet from '../../components/GiftPickerSheet';
import FloatingHeartsOverlay from '../../components/FloatingHeartsOverlay';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
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
  const { user: currentUser, token: authToken } = useAuth();
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
  const giftOverlayRef = useRef(null);
  const floatingHeartsRef = useRef(null);
  const [giftPickerVisible, setGiftPickerVisible] = useState(false);
  const [myPoints, setMyPoints] = useState(currentUser?.pointsBalance || 0);
  const processedGiftMessageIdsRef = useRef(new Set());

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

  const flatListRef = useRef(null);

  const isHost = Boolean(
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

      socket.on(LIVE_SOCKET_EVENTS.AUTH_READY, () => {
        socket.emit(LIVE_SOCKET_EVENTS.JOIN, { roomId });
      });

      socket.on(LIVE_SOCKET_EVENTS.MESSAGE, (msg) => {
        if (!msg?.id) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        if (msg.type === 'like') {
          setLikeCount((c) => c + 1);
          floatingHeartsRef.current?.addHeart();
        } else if (msg.type === 'gift') {
          if (typeof msg.giftPoints === 'number' && msg.giftPoints > 0) {
            setRoom((prev) =>
              prev
                ? {
                    ...prev,
                    totalGiftsPoints: (prev.totalGiftsPoints || 0) + msg.giftPoints,
                  }
                : prev,
            );
          }
          if (!processedGiftMessageIdsRef.current.has(msg.id)) {
            processedGiftMessageIdsRef.current.add(msg.id);
            try {
              const giftMeta = JSON.parse(msg.content);
              giftOverlayRef.current?.enqueueGift({
                giftId: giftMeta.giftId,
                giftName: giftMeta.giftName,
                pricePoints: giftMeta.pricePoints || msg.giftPoints,
                senderNickname:
                  giftMeta.senderNickname ||
                  msg.sender?.name ||
                  msg.sender?.profile?.nickname ||
                  '시청자',
                animationUrl: giftMeta.animationUrl,
                animationType: giftMeta.animationType || 'alpha_video',
                thumbnailUrl: giftMeta.thumbnailUrl,
              });
            } catch {
              giftOverlayRef.current?.enqueueGift({
                giftId: 'gift',
                giftName: '선물',
                pricePoints: msg.giftPoints,
                senderNickname:
                  msg.sender?.name || msg.sender?.profile?.nickname || '시청자',
              });
            }
          }
        }
      });

      socket.on(LIVE_SOCKET_EVENTS.VIEWER_COUNT, (data) => {
        if (typeof data?.viewerCount === 'number') {
          setViewerCount(data.viewerCount);
        }
      });

      socket.on(LIVE_SOCKET_EVENTS.ROOM_ENDED, (data) => {
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
          socket.emit(LIVE_SOCKET_EVENTS.LEAVE, { roomId });
        }
        socket.disconnect();
      }
    };
  }, [roomId, authToken, navigation]);

  const fetchMyPoints = useCallback(async () => {
    try {
      const me = await apiClient.getMe();
      if (me && typeof me.pointsBalance === 'number') {
        setMyPoints(me.pointsBalance);
      } else if (me && typeof me.points === 'number') {
        setMyPoints(me.points);
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
      setMessages(msgs);

      // 수신된 3D 선물 메시지 자동 감지 및 FIFO 큐 재생
      if (Array.isArray(msgs)) {
        msgs.forEach((msg) => {
          if (msg.type === 'gift' && msg.id && !processedGiftMessageIdsRef.current.has(msg.id)) {
            processedGiftMessageIdsRef.current.add(msg.id);
            try {
              const giftMeta = JSON.parse(msg.content);
              giftOverlayRef.current?.enqueueGift({
                giftId: giftMeta.giftId,
                giftName: giftMeta.giftName,
                pricePoints: giftMeta.pricePoints || msg.giftPoints,
                senderNickname:
                  giftMeta.senderNickname ||
                  msg.sender?.profile?.nickname ||
                  msg.sender?.displayName ||
                  '시청자',
                animationUrl: giftMeta.animationUrl,
                animationType: giftMeta.animationType || 'alpha_video',
                thumbnailUrl: giftMeta.thumbnailUrl,
              });
            } catch {
              giftOverlayRef.current?.enqueueGift({
                giftId: 'gift',
                giftName: '선물',
                pricePoints: msg.giftPoints,
                senderNickname:
                  msg.sender?.profile?.nickname || msg.sender?.displayName || '시청자',
              });
            }
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
    try {
      const newMsg = await apiClient.sendLiveMessage({
        roomId,
        content: text,
        type: 'chat',
      });
      setInputText('');
      setMessages((prev) => [...prev, newMsg]);
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
    try {
      await apiClient.sendLiveMessage({
        roomId,
        content: '❤️ 하트를 보냈습니다!',
        type: 'like',
      });
      fetchMessages();
    } catch {
      // quiet fallback
    }
  };

  const handleOpenGiftPicker = () => {
    fetchMyPoints();
    setGiftPickerVisible(true);
  };

  const handleSendGiftItem = async (gift) => {
    if (!gift || !roomId) return;
    try {
      const idempotencyKey = `live_${roomId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const res = await apiClient.sendLiveGift(roomId, {
        giftId: gift.id,
        idempotencyKey,
      });

      const updatedBalance = res?.newBalance ?? res?.data?.newBalance;
      if (updatedBalance !== undefined && updatedBalance !== null) {
        setMyPoints(Number(updatedBalance));
      }
      const updatedTotalGifts = res?.totalGiftsPoints ?? res?.data?.totalGiftsPoints;
      if (typeof updatedTotalGifts === 'number') {
        setRoom((prev) => (prev ? { ...prev, totalGiftsPoints: updatedTotalGifts } : prev));
      }

      // 내 화면에서도 3D 투명 비디오/애니메이션 이펙트 큐에 즉시 삽입
      giftOverlayRef.current?.enqueueGift({
        giftId: gift.id,
        giftName: gift.name,
        pricePoints: gift.pricePoints,
        senderNickname: currentUser?.displayName || currentUser?.name || '나',
        animationUrl: gift.animationUrl,
        animationType: gift.animationType || 'alpha_video',
        thumbnailUrl: gift.thumbnailUrl,
      });

      fetchMessages();
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
            await apiClient.endLiveRoom(roomId);
            Alert.alert('종료 완료', '라이브 방송이 종료되었습니다.', [
              { text: '확인', onPress: () => navigation.goBack() },
            ]);
          } catch (e) {
            Alert.alert('종료 실패', e?.message || '방송 종료에 실패했습니다.');
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

  const handleMessagePress = (msg) => {
    const sender = msg?.sender;
    if (!sender?.id || sender?.id === currentUser?.id) return;

    Alert.alert(
      `${sender.name || '참여자'} 관리`,
      '작업을 선택하세요.',
      [
        {
          text: '사용자 신고하기',
          style: 'destructive',
          onPress: () => {
            setReportTarget({
              type: 'user',
              name: sender.name || '참여자',
              userId: sender.id,
            });
            setReportModalVisible(true);
          },
        },
        {
          text: '사용자 차단하기',
          style: 'destructive',
          onPress: () => handleBlockUser(sender.id, sender.name || '참여자'),
        },
        { text: '취소', style: 'cancel' },
      ],
    );
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

  const renderMessageItem = ({ item }) => {
    const isGift = item.type === 'gift';
    const isLike = item.type === 'like';

    let displayContent = item.content;
    let giftMeta = null;

    if (isGift) {
      try {
        giftMeta = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
        const giftTitle = giftMeta?.giftName || '선물';
        const points = giftMeta?.pricePoints || item.giftPoints || 0;
        const note = giftMeta?.message ? ` "${giftMeta.message}"` : '';
        displayContent = `🎁 [${giftTitle}] 후원! (${Number(points).toLocaleString()} 온)${note}`;
      } catch {
        displayContent = `🎁 선물 후원! (${Number(item.giftPoints || 0).toLocaleString()} 온)`;
      }
    }

    const authorName =
      (isGift && giftMeta?.senderNickname) ||
      item.sender?.name ||
      item.sender?.profile?.nickname ||
      '참여자';

    return (
      <TouchableOpacity
        style={[
          styles.chatBubble,
          isGift && styles.giftBubble,
          isLike && styles.likeBubble,
        ]}
        onPress={() => handleMessagePress(item)}
        activeOpacity={0.8}
      >
        <Text style={[styles.chatAuthor, isGift && styles.giftAuthor]}>{authorName}</Text>
        <Text style={[styles.chatContent, isGift && styles.giftContent]}>
          {displayContent}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
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
                <CameraView
                  style={styles.cameraPreview}
                  facing={cameraFacing}
                  enableTorch={false}
                  mirror={cameraFacing === 'front'}
                  active={!isCameraOff}
                />
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

            {/* Viewfinder simulation & camera layout */}
            <View style={styles.viewfinderGrid} pointerEvents="none">
              <View style={[styles.cornerMarker, styles.cornerTL]} />
              <View style={[styles.cornerMarker, styles.cornerTR]} />
              <View style={[styles.cornerMarker, styles.cornerBL]} />
              <View style={[styles.cornerMarker, styles.cornerBR]} />
            </View>

            {/* Video status overlay badge */}
            <View
              style={[
                styles.videoOverlayBadge,
                agoraTokenData?.streamDeliveryMode === 'CDN_HLS' && styles.videoOverlayBadgeCdn,
              ]}
              pointerEvents="none"
            >
              <Ionicons
                name={agoraTokenData?.streamDeliveryMode === 'CDN_HLS' ? 'flash' : 'videocam'}
                size={14}
                color={agoraTokenData?.streamDeliveryMode === 'CDN_HLS' ? '#38BDF8' : '#10B981'}
              />
              <Text style={styles.videoOverlayText}>
                {agoraTokenData?.streamDeliveryMode === 'CDN_HLS'
                  ? isHost
                    ? 'CDN 중계 송출 (Agora RTMP 푸시)'
                    : 'CDN HLS 중계 · 대규모 시청 최적화'
                  : `Agora RTC HD 1080p · ${isHost ? (cameraFacing === 'front' ? '전면 카메라 (LIVE)' : '후면 카메라 (LIVE)') : '라이브 영상 수신'}`}
              </Text>
            </View>

            {/* Audio waveform meter */}
            <LiveAudioWaveform isMuted={isMicMuted} />
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

      {/* Top Header Overlay */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.hostPill}
          activeOpacity={0.85}
          onPress={() => {
            if (room?.host?.id) {
              navigation.navigate('ProfileDetail', {
                profile: {
                  id: room.host.id,
                  targetUserId: room.host.id,
                  name: room.host.name,
                  avatar: room.host.avatar,
                  location: room.host.region,
                  headline: room.title || '라이브 방송 진행 중',
                },
              });
            }
          }}
        >
          <Avatar
            size={36}
            name={room?.host?.name}
            uri={room?.host?.avatar}
          />
          <View style={styles.hostPillMeta}>
            <Text style={styles.hostPillName} numberOfLines={1}>
              {room?.host?.name || '호스트'}
            </Text>
            <Text style={styles.hostPillRegion}>
              {room?.host?.region || '지역 미설정'}
            </Text>
          </View>
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTagText}>LIVE</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.topHeaderRight}>
          {agoraTokenData && (
            <View
              style={[
                styles.rtcBadge,
                agoraTokenData?.streamDeliveryMode === 'CDN_HLS' && styles.cdnHlsBadge,
                (!isVideoSubscribed || isCameraOff) && styles.rtcBadgeAudio,
              ]}
            >
              <View
                style={[
                  styles.rtcDot,
                  agoraTokenData?.streamDeliveryMode === 'CDN_HLS' && styles.cdnHlsDot,
                  (!isVideoSubscribed || isCameraOff) && styles.rtcDotAudio,
                ]}
              />
              <Text
                style={[
                  styles.rtcBadgeText,
                  agoraTokenData?.streamDeliveryMode === 'CDN_HLS' && styles.cdnHlsBadgeText,
                ]}
              >
                {agoraTokenData?.streamDeliveryMode === 'CDN_HLS'
                  ? 'CDN HLS'
                  : !isVideoSubscribed || isCameraOff
                  ? 'RTC Audio'
                  : 'RTC HD'}
              </Text>
            </View>
          )}
          {Boolean(room?.totalGiftsPoints && room.totalGiftsPoints > 0) && (
            <View style={styles.giftTotalBadge}>
              <Ionicons name="gift" size={13} color="#F59E0B" />
              <Text style={styles.giftTotalBadgeText}>
                {Number(room.totalGiftsPoints).toLocaleString()}P
              </Text>
            </View>
          )}
          <View style={styles.viewerBadge}>
            <Ionicons name="eye" size={14} color="#FFFFFF" />
            <Text style={styles.viewerBadgeText}>{viewerCount}</Text>
          </View>
          {!isHost && (
            <TouchableOpacity
              style={styles.safetyButton}
              onPress={handleOpenRoomSafetyMenu}
              hitSlop={8}
            >
              <Ionicons name="ellipsis-vertical" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
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

      {/* Media Streaming Quick Controls Toolbar */}
      <View style={styles.mediaToolBar}>
        {isHost ? (
          <>
            <TouchableOpacity
              style={[styles.mediaToolBtn, isMicMuted && styles.mediaToolBtnActive]}
              onPress={toggleMic}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isMicMuted ? 'mic-off' : 'mic'}
                size={16}
                color={isMicMuted ? '#EF4444' : '#FFFFFF'}
              />
              <Text style={[styles.mediaToolText, isMicMuted && styles.mediaToolTextActive]}>
                {isMicMuted ? '마이크 꺼짐' : '마이크 켜짐'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mediaToolBtn, isCameraOff && styles.mediaToolBtnActive]}
              onPress={toggleCamera}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isCameraOff ? 'videocam-off' : 'videocam'}
                size={16}
                color={isCameraOff ? '#EF4444' : '#FFFFFF'}
              />
              <Text style={[styles.mediaToolText, isCameraOff && styles.mediaToolTextActive]}>
                {isCameraOff ? '카메라 꺼짐' : '카메라 켜짐'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mediaToolBtn}
              onPress={toggleCameraFacing}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-reverse" size={16} color="#FFFFFF" />
              <Text style={styles.mediaToolText}>
                {cameraFacing === 'front' ? '전면 전환' : '후면 전환'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.mediaToolBtn, isSpeakerMuted && styles.mediaToolBtnActive]}
            onPress={toggleSpeaker}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isSpeakerMuted ? 'volume-mute' : 'volume-high'}
              size={16}
              color={isSpeakerMuted ? '#EF4444' : '#FFFFFF'}
            />
            <Text style={[styles.mediaToolText, isSpeakerMuted && styles.mediaToolTextActive]}>
              {isSpeakerMuted ? '음소거' : '소리 켜짐'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Area: Chat stream + Controls */}
      <KeyboardAvoidingView
        style={styles.bottomOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Chat message list */}
        <View style={styles.chatListWrap}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.chatListContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        </View>

        {/* Action Controls Bar */}
        <View style={styles.controlsBar}>
          <TextInput
            style={styles.chatInput}
            placeholder="실시간 대화에 참여해보세요..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={inputText}
            onChangeText={setInputText}
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
              {/* Gift Picker Button */}
              <TouchableOpacity
                style={styles.giftIconBtn}
                onPress={handleOpenGiftPicker}
                activeOpacity={0.8}
              >
                <Ionicons name="gift" size={20} color="#FBBF24" />
              </TouchableOpacity>

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

          {isHost && (
            <TouchableOpacity
              style={styles.endBroadcastBtn}
              onPress={handleEndBroadcast}
              activeOpacity={0.85}
            >
              <Text style={styles.endBroadcastText}>종료</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      <ReportModal
        visible={reportModalVisible}
        targetName={reportTarget?.name || '방송'}
        targetType={reportTarget?.type || 'room'}
        onClose={() => setReportModalVisible(false)}
        onSubmit={handleReportSubmit}
      />

      {/* Floating Animated Hearts Reaction Overlay */}
      <FloatingHeartsOverlay ref={floatingHeartsRef} />

      {/* Fullscreen 3D Gift Effect Overlay (FIFO Queue) */}
      <GiftEffectOverlay ref={giftOverlayRef} />

      {/* Gift Picker Bottom Sheet */}
      <GiftPickerSheet
        visible={giftPickerVisible}
        onClose={() => setGiftPickerVisible(false)}
        onSendGift={handleSendGiftItem}
        myPoints={myPoints}
        onGoToShop={() => navigation.navigate('Shop')}
        context="live"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  streamCanvas: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0F19',
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  cameraPreview: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    zIndex: 1,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
    padding: 4,
    paddingRight: 10,
    gap: 8,
    maxWidth: '65%',
  },
  hostPillMeta: {
    flex: 1,
  },
  hostPillName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hostPillRegion: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: LIVE_ACCENT,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  cdnHlsBadgeText: {
    color: '#BAE6FD',
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
  },
  viewerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
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
    top: 105,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  mediaToolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mediaToolBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: 'rgba(239, 68, 68, 0.6)',
  },
  mediaToolText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mediaToolTextActive: {
    color: '#F87171',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
    zIndex: 10,
  },
  chatListWrap: {
    height: 180,
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  chatListContent: {
    gap: 6,
    justifyContent: 'flex-end',
  },
  chatBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '85%',
  },
  giftBubble: {
    backgroundColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  likeBubble: {
    backgroundColor: 'rgba(255, 59, 107, 0.3)',
  },
  chatAuthor: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A5B4FC',
    marginBottom: 2,
  },
  giftAuthor: {
    color: '#FDE68A',
  },
  chatContent: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  giftContent: {
    color: '#FDE68A',
    fontWeight: '700',
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
