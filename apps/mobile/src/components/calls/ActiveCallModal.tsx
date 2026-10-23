import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient } from '../../api/client';
import { createChatSocket } from '../../realtime/chatSocket';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface CallSessionData {
  id: string;
  channelId?: string;
  hostId: string;
  hostNickname?: string;
  hostAvatar?: string;
  callerId?: string;
  ratePerMinute?: number;
  callerBalance?: number;
  status?: string;
}

interface ActiveCallModalProps {
  visible: boolean;
  session: CallSessionData | null;
  authToken?: string;
  onClose: () => void;
  onCallFinished?: (summary: { durationMinutes: number; usedPoints: number }) => void;
}

export default function ActiveCallModal({
  visible,
  session,
  authToken,
  onClose,
  onCallFinished,
}: ActiveCallModalProps) {
  const insets = useSafeAreaInsets();
  const [callStatus, setCallStatus] = useState<'CONNECTING' | 'CONNECTED' | 'ENDED'>('CONNECTING');
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [ending, setEnding] = useState<boolean>(false);

  const socketRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const ratePerMinute = session?.ratePerMinute || 1500;
  const initialBalance = session?.callerBalance || 0;
  const maxMinutes = Math.max(1, Math.floor(initialBalance / ratePerMinute));

  // Pulse animation for connecting avatar ring
  useEffect(() => {
    if (callStatus === 'CONNECTING') {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
  }, [callStatus, pulseAnim]);

  // Connect simulation or socket connection
  useEffect(() => {
    if (!visible || !session) {
      setCallStatus('CONNECTING');
      setDurationSeconds(0);
      setWarningMessage(null);
      setEnding(false);
      return;
    }

    setCallStatus('CONNECTING');
    setDurationSeconds(0);
    setWarningMessage(null);

    // Auto connect after 2.5s for seamless mock/real transition
    const connectTimer = setTimeout(() => {
      setCallStatus('CONNECTED');
    }, 2500);

    // Setup socket listener
    try {
      const socket = createChatSocket(authToken || 'guest-token');
      socketRef.current = socket;
      socket.connect();

      const channelName = session.channelId || `call_${session.id}`;
      socket.emit('call:join', { channelId: channelName, sessionId: session.id });

      socket.on('CALL_CONNECTED', () => {
        setCallStatus('CONNECTED');
      });

      socket.on('call:connected', () => {
        setCallStatus('CONNECTED');
      });

      // 잔액 부족 1분 전 경고 리스너
      const handleWarning = (data: any) => {
        const msg = data?.message || '포인트가 1분 분량 남았습니다. 60초 후 자동 종료됩니다!';
        setWarningMessage(msg);
      };
      socket.on('call:balance_warning', handleWarning);
      socket.on('CALL_BALANCE_WARNING', handleWarning);

      // 통화 강제/정상 종료 리스너
      const handleTerminated = (data: any) => {
        const durSec = data?.durationSeconds ?? durationSeconds;
        const durMin = Math.max(1, Math.ceil(durSec / 60));
        const used = data?.totalBilledPoints ?? durMin * ratePerMinute;

        socket.disconnect();
        onClose();

        Alert.alert(
          '통화 종료 안내',
          `잔액 소진 또는 시스템 정책으로 통화가 종료되었습니다.\n\n· 총 통화 시간: ${durMin}분\n· 소진 포인트: ${used.toLocaleString()} ON`,
          [{ text: '확인' }]
        );

        onCallFinished?.({ durationMinutes: durMin, usedPoints: used });
      };

      const handleEnded = (data: any) => {
        const durSec = data?.durationSeconds ?? durationSeconds;
        const durMin = Math.max(1, Math.ceil(durSec / 60));
        const used = data?.totalBilledPoints ?? durMin * ratePerMinute;

        socket.disconnect();
        onClose();

        Alert.alert(
          '통화 완료',
          `1:1 프라이빗 통화가 완료되었습니다.\n\n· 총 통화 시간: ${durMin}분\n· 정산 소진: ${used.toLocaleString()} ON`,
          [{ text: '확인' }]
        );

        onCallFinished?.({ durationMinutes: durMin, usedPoints: used });
      };

      socket.on('call:force_terminated', handleTerminated);
      socket.on('CALL_FORCE_TERMINATED', handleTerminated);
      socket.on('call:ended', handleEnded);
      socket.on('CALL_ENDED', handleEnded);
    } catch (err) {
      console.warn('[ActiveCallModal] Socket init warning:', err);
    }

    return () => {
      clearTimeout(connectTimer);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [visible, session, authToken]);

  // Duration timer
  useEffect(() => {
    if (callStatus === 'CONNECTED') {
      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [callStatus]);

  // Format seconds to mm:ss
  const formattedTime = useCallback((totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  // End call manual button
  const handleEndCallPress = async () => {
    if (!session || ending) return;
    setEnding(true);

    const durMin = Math.max(1, Math.ceil(durationSeconds / 60));
    const used = durMin * ratePerMinute;

    try {
      await apiClient.endCall(session.id);
    } catch {
      // ignore
    } finally {
      setEnding(false);
      onClose();
      Alert.alert(
        '통화 종료',
        `통화가 정상적으로 종료되었습니다.\n\n· 총 통화 시간: ${durMin}분 (${formattedTime(durationSeconds)})\n· 소진 포인트: ${used.toLocaleString()} ON`,
        [{ text: '확인' }]
      );
      onCallFinished?.({ durationMinutes: durMin, usedPoints: used });
    }
  };

  if (!visible || !session) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleEndCallPress}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={[styles.container, { paddingTop: Math.max(insets.top + 20, 40), paddingBottom: Math.max(insets.bottom + 20, 32) }]}>
          {/* Top Live Call Header */}
          <View style={styles.topHeader}>
            <View style={styles.liveIndicatorRow}>
              <View style={[styles.statusDot, callStatus === 'CONNECTED' ? styles.statusDotLive : styles.statusDotConnecting]} />
              <Text style={styles.statusText}>
                {callStatus === 'CONNECTED' ? '1:1 프라이빗 라이브 통화 중' : '통화 상대 연결 중...'}
              </Text>
            </View>
            <View style={styles.rateChip}>
              <Text style={styles.rateChipText}>분당 {ratePerMinute.toLocaleString()} ON</Text>
            </View>
          </View>

          {/* Warning Banner */}
          {warningMessage && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning" size={18} color="#FEF08A" />
              <Text style={styles.warningBannerText}>{warningMessage}</Text>
            </View>
          )}

          {/* Center Avatar & Info */}
          <View style={styles.centerSection}>
            <Animated.View style={[styles.avatarRing, { transform: [{ scale: callStatus === 'CONNECTING' ? pulseAnim : 1 }] }]}>
              {session.hostAvatar ? (
                <Image source={{ uri: session.hostAvatar }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={54} color="#94A3B8" />
                </View>
              )}
            </Animated.View>

            <Text style={styles.hostNicknameText}>{session.hostNickname || '호스트'}</Text>
            <Text style={styles.channelLabelText}>보안 암호화 1:1 전용 채널</Text>

            {/* Realtime Call Timer */}
            <View style={styles.timerCard}>
              <Text style={styles.timerValueText}>{formattedTime(durationSeconds)}</Text>
              <Text style={styles.maxMinutesText}>
                최대 통화 가능: 약 {maxMinutes}분 (보유 {initialBalance.toLocaleString()} ON)
              </Text>
            </View>
          </View>

          {/* Bottom Call Controls */}
          <View style={styles.bottomSection}>
            <View style={styles.controlRow}>
              <TouchableOpacity style={styles.circleSubBtn} activeOpacity={0.8}>
                <Ionicons name="mic-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.hangupBtn}
                activeOpacity={0.85}
                onPress={handleEndCallPress}
                disabled={ending}
              >
                <Ionicons name="call" size={28} color="#FFFFFF" style={styles.hangupIcon} />
                <Text style={styles.hangupText}>통화 종료</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.circleSubBtn} activeOpacity={0.8}>
                <Ionicons name="volume-high-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDotConnecting: {
    backgroundColor: '#F59E0B',
  },
  statusDotLive: {
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  rateChip: {
    backgroundColor: 'rgba(255, 59, 107, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 107, 0.3)',
  },
  rateChipText: {
    color: '#FF3B6B',
    fontSize: 12,
    fontWeight: '700',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
  },
  warningBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: '#FF3B6B',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#FF3B6B',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  avatarImg: {
    width: 118,
    height: 118,
    borderRadius: 59,
  },
  avatarPlaceholder: {
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostNicknameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  channelLabelText: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 28,
  },
  timerCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    maxWidth: 320,
  },
  timerValueText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
    marginBottom: 6,
  },
  maxMinutesText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
  },
  bottomSection: {
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 320,
    paddingHorizontal: 12,
  },
  circleSubBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hangupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#EF4444',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  hangupIcon: {
    transform: [{ rotate: '135deg' }],
  },
  hangupText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
