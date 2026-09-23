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
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const LIVE_ACCENT = '#FF3B6B';

export default function LiveRoomScreen({ navigation, route }) {
  const { user: currentUser } = useAuth();
  const initialRoom = route?.params?.room;
  const roomId = route?.params?.roomId || initialRoom?.id;

  const [room, setRoom] = useState(initialRoom || null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [likeCount, setLikeCount] = useState(initialRoom?.totalLikes || 0);
  const [viewerCount, setViewerCount] = useState(initialRoom?.viewerCount || 1);

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

  // Poll messages every 2.5s for realtime live experience
  const fetchMessages = useCallback(async () => {
    if (!roomId) return;
    try {
      const msgs = await apiClient.getLiveMessages(roomId);
      setMessages(msgs);
    } catch {
      // quiet fallback
    }
  }, [roomId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2500);
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

  const handleSendGift = (giftPoints) => {
    Alert.alert(
      '선물 보내기',
      `${giftPoints}P 선물을 호스트에게 보내시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '보내기',
          onPress: async () => {
            try {
              const newMsg = await apiClient.sendLiveMessage({
                roomId,
                content: `🎁 ${giftPoints}P 선물을 보냈습니다!`,
                type: 'gift',
                giftPoints,
              });
              setMessages((prev) => [...prev, newMsg]);
              Alert.alert('선물 완료', `${giftPoints}P 선물이 전달되었습니다!`);
              fetchMessages();
            } catch (e) {
              Alert.alert('선물 실패', e?.message || '선물 보내기에 실패했습니다.');
            }
          },
        },
      ],
    );
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

  const renderMessageItem = ({ item }) => {
    const isGift = item.type === 'gift';
    const isLike = item.type === 'like';

    return (
      <View
        style={[
          styles.chatBubble,
          isGift && styles.giftBubble,
          isLike && styles.likeBubble,
        ]}
      >
        <Text style={styles.chatAuthor}>{item.sender?.name || '참여자'}</Text>
        <Text style={[styles.chatContent, isGift && styles.giftContent]}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Background Visual Canvas */}
      <View style={styles.streamCanvas}>
        <Avatar
          size={110}
          name={room?.host?.name}
          uri={room?.host?.avatar}
          showBorder
          style={styles.hostAvatarVisual}
        />
        <View style={styles.audioWaveContainer}>
          <View style={[styles.waveBar, { height: 18 }]} />
          <View style={[styles.waveBar, { height: 32 }]} />
          <View style={[styles.waveBar, { height: 24 }]} />
          <View style={[styles.waveBar, { height: 36 }]} />
          <View style={[styles.waveBar, { height: 20 }]} />
        </View>
        <Text style={styles.liveNoticeText}>
          {room?.title || '라이브 방송이 진행 중입니다'}
        </Text>
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
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
              {/* Gift 50P Button */}
              <TouchableOpacity
                style={styles.giftIconBtn}
                onPress={() => handleSendGift(50)}
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
    backgroundColor: '#1E293B',
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
    fontSize: 16,
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
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
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
