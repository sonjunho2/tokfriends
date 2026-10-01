// src/screens/live/LiveRoomScreen.js
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import Avatar from '../../components/Avatar';
import ReportModal from '../../components/ReportModal';
import GiftEffectOverlay from '../../components/GiftEffectOverlay';
import GiftPickerSheet from '../../components/GiftPickerSheet';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { createChatSocket, LIVE_SOCKET_EVENTS } from '../../realtime/chatSocket';

const LIVE_ACCENT = '#FF3B6B';

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

  // 3D Gift System States
  const giftOverlayRef = useRef(null);
  const [giftPickerVisible, setGiftPickerVisible] = useState(false);
  const [myPoints, setMyPoints] = useState(currentUser?.pointsBalance || 0);
  const processedGiftMessageIdsRef = useRef(new Set());

  // Agora Live Streaming States (Video + Audio)
  const [agoraTokenData, setAgoraTokenData] = useState(null);
  const [streamConnecting, setStreamConnecting] = useState(true);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('front'); // 'front' | 'back'
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  const flatListRef = useRef(null);

  const isHost =
    currentUser?.id &&
    room?.host?.id &&
    String(currentUser.id) === String(room.host.id);

  // Join room on mount, leave on unmount
  useEffect(() => {
    if (!roomId) return;
    let mounted = true;

    apiClient.joinLiveRoom(roomId).then((res) => {
      if (mounted && res?.viewerCount) {
        setViewerCount(res.viewerCount);
      }
    });

    const loadRoomDetails = async () => {
      try {
        const details = await apiClient.getLiveRoom(roomId);
        if (mounted && details) {
          setRoom(details);
          setViewerCount(details.viewerCount || 1);
          setLikeCount(details.totalLikes || 0);
        }
      } catch (e) {
        console.warn('Failed to load room details', e);
      }
    };

    loadRoomDetails();

    return () => {
      mounted = false;
      apiClient.leaveLiveRoom(roomId).catch(() => {});
    };
  }, [roomId]);

  // Agora Live Streaming Token initialization (Audio + Video)
  useEffect(() => {
    if (!roomId) return;
    let mounted = true;

    const initAgoraStream = async () => {
      try {
        setStreamConnecting(true);
        const role = isHost ? 'publisher' : 'subscriber';
        const res = await apiClient.getLiveAgoraToken(roomId, role);
        if (mounted && res) {
          setAgoraTokenData(res);
        }
      } catch (err) {
        console.warn('Agora token initialization error', err);
      } finally {
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
        } else if (msg.type === 'gift') {
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

      if (res?.data?.newBalance !== undefined) {
        setMyPoints(res.data.newBalance);
      }

      // 내 화면에서도 3D 투명 비디오/애니메이션 이펙트 큐에 즉시 삽입
      giftOverlayRef.current?.enqueueGift({
        giftId: gift.id,
        giftName: gift.name,
        pricePoints: gift.pricePoints,
        senderNickname: currentUser?.displayName || '나',
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
        <Text style={styles.chatAuthor}>{item.sender?.name || '참여자'}</Text>
        <Text style={[styles.chatContent, isGift && styles.giftContent]}>
          {item.content}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Background Live Video / Stream Canvas */}
      <View style={styles.streamCanvas}>
        {streamConnecting ? (
          <View style={styles.connectingBox}>
            <ActivityIndicator size="large" color={LIVE_ACCENT} />
            <Text style={styles.connectingText}>Agora 라이브 스트림 연결 중...</Text>
          </View>
        ) : !isCameraOff ? (
          // Video Canvas Mode (Camera ON: Host local video or Viewer remote video)
          <View style={styles.videoStreamContainer}>
            {/* Viewfinder simulation & camera layout */}
            <View style={styles.viewfinderGrid}>
              <View style={[styles.cornerMarker, styles.cornerTL]} />
              <View style={[styles.cornerMarker, styles.cornerTR]} />
              <View style={[styles.cornerMarker, styles.cornerBL]} />
              <View style={[styles.cornerMarker, styles.cornerBR]} />
            </View>

            {/* Video status overlay */}
            <View style={styles.videoOverlayBadge}>
              <Ionicons name="videocam" size={14} color="#10B981" />
              <Text style={styles.videoOverlayText}>
                Agora RTC HD 1080p · {isHost ? (cameraFacing === 'front' ? '전면 카메라' : '후면 카메라') : '라이브 영상 수신'}
              </Text>
            </View>

            {/* Simulated Live Broadcast Avatar Watermark / Stream Center */}
            <View style={styles.videoCenterBadge}>
              <Avatar
                size={88}
                name={room?.host?.name}
                uri={room?.host?.avatar}
                showBorder
                style={styles.hostAvatarVisual}
              />
              <Text style={styles.videoHostCaption}>
                {room?.host?.name || '호스트'}님의 실시간 영상 방송
              </Text>
            </View>

            {/* Audio waveform meter */}
            <View style={styles.audioWaveContainer}>
              <View style={[styles.waveBar, { height: isMicMuted ? 4 : 18 }]} />
              <View style={[styles.waveBar, { height: isMicMuted ? 4 : 32 }]} />
              <View style={[styles.waveBar, { height: isMicMuted ? 4 : 24 }]} />
              <View style={[styles.waveBar, { height: isMicMuted ? 4 : 36 }]} />
              <View style={[styles.waveBar, { height: isMicMuted ? 4 : 20 }]} />
            </View>
          </View>
        ) : (
          // Audio Only Mode (Camera turned OFF)
          <View style={styles.audioOnlyContainer}>
            <Avatar
              size={110}
              name={room?.host?.name}
              uri={room?.host?.avatar}
              showBorder
              style={styles.hostAvatarVisual}
            />
            <View style={styles.audioWaveContainer}>
              <View style={[styles.waveBar, { height: isMicMuted ? 4 : 18 }]} />
              <View style={[styles.waveBar, { height: isMicMuted ? 4 : 32 }]} />
              <View style={[styles.waveBar, { height: isMicMuted ? 4 : 24 }]} />
              <View style={[styles.waveBar, { height: isMicMuted ? 4 : 36 }]} />
              <View style={[styles.waveBar, { height: isMicMuted ? 4 : 20 }]} />
            </View>
            <Text style={styles.liveNoticeText}>
              카메라를 끄고 음성 라이브로 진행 중입니다
            </Text>
          </View>
        )}
      </View>

      {/* Top Header Overlay */}
      <View style={styles.topHeader}>
        <View style={styles.hostPill}>
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
        </View>

        <View style={styles.topHeaderRight}>
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

      {/* Media Streaming Quick Controls Toolbar */}
      <View style={styles.mediaToolBar}>
        {isHost ? (
          <>
            <TouchableOpacity
              style={[styles.mediaToolBtn, isMicMuted && styles.mediaToolBtnActive]}
              onPress={() => setIsMicMuted((prev) => !prev)}
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
              onPress={() => setIsCameraOff((prev) => !prev)}
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
              onPress={() => setCameraFacing((prev) => (prev === 'front' ? 'back' : 'front'))}
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
            onPress={() => setIsSpeakerMuted((prev) => !prev)}
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
    backgroundColor: '#111827',
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
  chatContent: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  giftContent: {
    color: '#FDE68A',
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
});
