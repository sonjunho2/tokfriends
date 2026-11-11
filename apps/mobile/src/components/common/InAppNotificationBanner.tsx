import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../context/AuthContext';
import { createChatSocket } from '../../realtime/chatSocket';
import { navigationRef } from '../../navigation';

const { width } = Dimensions.get('window');

interface NotificationPayload {
  chatId: string;
  sender: {
    id: string;
    nickname: string;
    avatarUrl?: string | null;
  };
  content: string;
  type?: string;
  createdAt?: string;
}

interface InAppNotificationContextType {
  showNotification: (data: NotificationPayload) => void;
  playMoccoSound: () => void;
}

const InAppNotificationContext = createContext<InAppNotificationContextType>({
  showNotification: () => {},
  playMoccoSound: () => {},
});

export const useInAppNotification = () => useContext(InAppNotificationContext);

// Global active chat room tracker to prevent duplicate in-room popup banners
export let currentActiveChatRoomId: string | null = null;
export const setActiveChatRoomId = (id: string | null) => {
  currentActiveChatRoomId = id;
};

// Hidden HTML Audio Player using Web Audio API for crystal-clear "모~꼬!" melodic chime
const AUDIO_HTML = `
<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:transparent;">
<script>
  var audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  window.playMoccoChime = function() {
    try {
      var ctx = getAudioCtx();
      var now = ctx.currentTime;

      // 1. "모" (E5 659.25Hz -> G5 783.99Hz)
      var osc1 = ctx.createOscillator();
      var gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(659.25, now);
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.12);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.4, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // 2. "꼬" (C6 1046.5Hz bell ding)
      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, now + 0.14);

      gain2.gain.setValueAtTime(0.001, now + 0.14);
      gain2.gain.linearRampToValueAtTime(0.5, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.65);
    } catch(e) {}
  };
</script>
</body>
</html>
`;

export function InAppNotificationProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const [notification, setNotification] = useState<NotificationPayload | null>(null);
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const timerRef = useRef<any>(null);
  const webViewRef = useRef<WebView>(null);
  const socketRef = useRef<any>(null);

  const playMoccoSound = useCallback(() => {
    try {
      webViewRef.current?.injectJavaScript('if(window.playMoccoChime) window.playMoccoChime(); true;');
    } catch {}
  }, []);

  const dismissNotification = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.timing(slideAnim, {
      toValue: -140,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setNotification(null);
    });
  }, [slideAnim]);

  const showNotification = useCallback((data: NotificationPayload) => {
    if (!data) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setNotification(data);
    playMoccoSound();

    slideAnim.setValue(-140);
    Animated.spring(slideAnim, {
      toValue: Math.max(insets.top, 12),
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();

    timerRef.current = setTimeout(() => {
      dismissNotification();
    }, 4500);
  }, [insets.top, playMoccoSound, slideAnim, dismissNotification]);

  // Global socket listener for incoming chat messages & notifications
  useEffect(() => {
    const normToken = typeof token === 'string' && token.trim() ? token.trim() : '';
    if (!normToken || !user?.id) return;

    const socket = createChatSocket(normToken);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('connected', { userId: user.id });
    });

    socket.on('chat:incoming', (payload: any) => {
      if (!payload) return;
      // Don't notify if sent by me
      if (payload.sender?.id && String(payload.sender.id) === String(user.id)) return;

      // Don't show popup notification if user is currently inside this chat room
      if (currentActiveChatRoomId && String(currentActiveChatRoomId) === String(payload.chatId)) {
        return;
      }
      try {
        if (navigationRef.isReady()) {
          const currentRoute = navigationRef.getCurrentRoute();
          if (currentRoute?.name === 'ChatRoom') {
            const activeId = (currentRoute.params as any)?.id || (currentRoute.params as any)?.chatId;
            if (activeId && String(activeId) === String(payload.chatId)) {
              return;
            }
          }
        }
      } catch {}

      showNotification({
        chatId: payload.chatId,
        sender: {
          id: payload.sender?.id || 'unknown',
          nickname: payload.sender?.nickname || '대화 상대',
          avatarUrl: payload.sender?.avatarUrl || null,
        },
        content: payload.content || '새로운 메시지가 도착했습니다.',
        type: payload.type || 'text',
        createdAt: payload.createdAt,
      });
    });

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [token, user?.id, showNotification]);

  const handleBannerPress = () => {
    if (!notification) return;
    const targetChatId = notification.chatId;
    const peer = notification.sender;
    dismissNotification();

    if (navigationRef.isReady()) {
      navigationRef.navigate('ChatRoom', {
        id: targetChatId,
        chatId: targetChatId,
        peerId: peer.id,
        peerName: peer.nickname,
        title: peer.nickname,
        counterpartAccountId: peer.id,
        user: {
          id: peer.id,
          name: peer.nickname,
          displayName: peer.nickname,
          avatar: peer.avatarUrl,
          avatarUrl: peer.avatarUrl,
        },
      });
    }
  };

  return (
    <InAppNotificationContext.Provider value={{ showNotification, playMoccoSound }}>
      {children}

      {/* Invisible Web Audio Player for "모꼬" Sound */}
      <View style={styles.hiddenAudioContainer} pointerEvents="none">
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: AUDIO_HTML }}
          javaScriptEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          style={styles.hiddenWebView}
        />
      </View>

      {/* Floating In-App Toast Notification Banner */}
      {notification && (
        <Animated.View
          style={[
            styles.bannerContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.bannerCard}
            activeOpacity={0.92}
            onPress={handleBannerPress}
          >
            {/* Mascot Icon / Sender Avatar */}
            <View style={styles.avatarWrapper}>
              {notification.sender?.avatarUrl ? (
                <Image
                  source={{ uri: notification.sender.avatarUrl }}
                  style={styles.senderAvatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>☁️</Text>
                </View>
              )}
              <View style={styles.badgeMocco}>
                <Text style={styles.badgeMoccoText}>모꼬</Text>
              </View>
            </View>

            {/* Notification Text Info */}
            <View style={styles.textWrapper}>
              <View style={styles.titleRow}>
                <Text style={styles.senderName} numberOfLines={1}>
                  {notification.sender.nickname}
                </Text>
                <Text style={styles.timeLabel}>방금 전</Text>
              </View>
              <Text style={styles.messageContent} numberOfLines={1}>
                {notification.content}
              </Text>
            </View>

            {/* Quick Action Button */}
            <View style={styles.actionPill}>
              <Text style={styles.actionPillText}>답장 ›</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </InAppNotificationContext.Provider>
  );
}

const styles = StyleSheet.create({
  hiddenAudioContainer: {
    width: 0,
    height: 0,
    position: 'absolute',
    opacity: 0,
    overflow: 'hidden',
  },
  hiddenWebView: {
    width: 1,
    height: 1,
  },
  bannerContainer: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 0,
    zIndex: 9999,
    shadowColor: '#0F172A',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: '#FFE4E6', // pink-100
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 11,
  },
  senderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 22,
  },
  badgeMocco: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: '#FF3B6B',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeMoccoText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  textWrapper: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 6,
  },
  timeLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  messageContent: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  actionPill: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF3B6B',
  },
});
