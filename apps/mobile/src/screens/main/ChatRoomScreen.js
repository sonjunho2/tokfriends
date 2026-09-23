import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
  Image,
  Keyboard,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { uuid } from 'expo-modules-core';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import Avatar from '../../components/Avatar';
import colors from '../../theme/colors';
import { listGiftOptions } from '../../api/gifts';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  CHAT_SOCKET_EVENTS,
  createChatSocket,
} from '../../realtime/chatSocket';

const LOCAL_TYPING_IDLE_MS = 1500;
const REMOTE_TYPING_EXPIRY_MS = 3000;

function ChatVideoAttachment({ uri }) {
  const player = useVideoPlayer(uri);

  return (
    <VideoView
      player={player}
      style={styles.videoAttachment}
      contentFit="cover"
      nativeControls
    />
  );
}

const formatMessageTime = (createdAt) => {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const normalizeHistoryMessage = (message, currentActivityAccountId) => {
  if (
    !message?.id ||
    !message?.chatId ||
    typeof message.content !== 'string' ||
    !message?.createdAt
  ) {
    throw new Error('대화 내역 응답 형식이 올바르지 않습니다.');
  }

  const senderAccountId = message.senderAccountId;
  const sender =
    senderAccountId === currentActivityAccountId
      ? 'me'
      : typeof senderAccountId === 'string' && senderAccountId
        ? 'other'
        : 'unknown';

  const backendType = message.type || 'text';
  const isMedia =
    backendType === 'media' ||
    backendType === 'image' ||
    backendType === 'video';
  const isVideo =
    backendType === 'video' ||
    (typeof message.content === 'string' &&
      (message.content.includes('.mp4') || message.content.includes('.mov')));
  const isGift = backendType === 'gift';
  let giftData = null;
  if (isGift) {
    try {
      giftData = JSON.parse(message.content);
    } catch {
      giftData = { name: '선물', amount: 0, description: message.content };
    }
  }
  const resolvedType = isMedia ? 'media' : (isGift ? 'gift' : 'text');
  const mediaType = isVideo ? 'video' : 'image';

  return {
    id: message.id,
    chatId: message.chatId,
    sender,
    senderAccountId: senderAccountId ?? null,
    text: isMedia || isGift ? '' : message.content,
    timestamp: formatMessageTime(message.createdAt),
    readAt: message.readAt ?? null,
    type: resolvedType,
    mediaType,
    media: isMedia ? { uri: message.content } : null,
    gift: giftData,
    backendType,
  };
};

const resolveParticipantTarget = (user, routeParams) => {
  const targetUserId =
    typeof user?.targetUserId === 'string' ? user.targetUserId.trim() : '';
  const userTargetAccountId =
    typeof user?.targetAccountId === 'string' ? user.targetAccountId.trim() : '';
  const routeAccountId =
    typeof routeParams?.counterpartAccountId === 'string'
      ? routeParams.counterpartAccountId.trim()
      : '';

  if (
    userTargetAccountId &&
    routeAccountId &&
    userTargetAccountId !== routeAccountId
  ) {
    return null;
  }

  const targetAccountId = userTargetAccountId || routeAccountId;
  if (Boolean(targetUserId) === Boolean(targetAccountId)) {
    return null;
  }

  return targetUserId ? { targetUserId } : { targetAccountId };
};

export default function ChatRoomScreen({ route, navigation }) {
  const { user: paramUser, title: paramTitle } = route.params || {};
  const user = paramUser || { name: paramTitle || '친구' };
  const chatId = String(
    route?.params?.chatId || route?.params?.id || route?.params?.room?.id || ''
  ).trim();
  const routeCounterpartAccountId =
    typeof route?.params?.counterpartAccountId === 'string'
      ? route.params.counterpartAccountId.trim()
      : '';
  const userCounterpartAccountId =
    typeof user?.targetAccountId === 'string'
      ? user.targetAccountId.trim()
      : '';
  const hasCounterpartIdentityConflict = Boolean(
    routeCounterpartAccountId &&
    userCounterpartAccountId &&
    routeCounterpartAccountId !== userCounterpartAccountId,
  );
  const counterpartAccountId = hasCounterpartIdentityConflict
    ? ''
    : routeCounterpartAccountId || userCounterpartAccountId;
  const { user: authUser, token: authToken } = useAuth();
  const currentActivityAccountId = authUser?.activityAccountId;
  const [messages, setMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderHistoryError, setOlderHistoryError] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isCounterpartTyping, setIsCounterpartTyping] = useState(false);
  const flatListRef = useRef(null);
  const historyRequestRef = useRef(0);
  const shouldScrollToEndRef = useRef(false);
  const socketRef = useRef(null);
  const socketAuthReadyRef = useRef(false);
  const localTypingActiveRef = useRef(false);
  const localTypingSentRef = useRef(false);
  const localTypingTimerRef = useRef(null);
  const remoteTypingTimerRef = useRef(null);
  const inputTextRef = useRef('');
  const pendingMessageRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [composerHeight, setComposerHeight] = useState(0);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [attachSheetVisible, setAttachSheetVisible] = useState(false);
  const [cameraModeVisible, setCameraModeVisible] = useState(false);
  const [giftSheetVisible, setGiftSheetVisible] = useState(false);
  const [giftOptions, setGiftOptions] = useState([]);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [giftError, setGiftError] = useState(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(route?.params?.isFavorite ?? false);
  const insets = useSafeAreaInsets();

  const appendUniquePersistedMessage = useCallback((nextMessage) => {
    if (!nextMessage?.id) return;

    setMessages((currentMessages) => {
      if (currentMessages.some((message) => message.id === nextMessage.id)) {
        return currentMessages;
      }
      return [...currentMessages, nextMessage];
    });
  }, []);

  const clearLocalTypingTimer = useCallback(() => {
    if (localTypingTimerRef.current) {
      clearTimeout(localTypingTimerRef.current);
      localTypingTimerRef.current = null;
    }
  }, []);

  const clearRemoteTypingTimer = useCallback(() => {
    if (remoteTypingTimerRef.current) {
      clearTimeout(remoteTypingTimerRef.current);
      remoteTypingTimerRef.current = null;
    }
  }, []);

  const emitTyping = useCallback((typing) => {
    const socket = socketRef.current;
    if (
      !socket ||
      !socket.connected ||
      !socketAuthReadyRef.current ||
      !chatId
    ) {
      return false;
    }

    socket.emit(CHAT_SOCKET_EVENTS.TYPING, {
      chatId,
      typing,
    });
    return true;
  }, [chatId]);

  const handleInputTextChange = useCallback((nextText) => {
    if (
      pendingMessageRef.current &&
      pendingMessageRef.current.content !== nextText.trim()
    ) {
      pendingMessageRef.current = null;
    }
    setInputText(nextText);
    inputTextRef.current = nextText;
    clearLocalTypingTimer();

    if (!nextText.trim()) {
      localTypingActiveRef.current = false;
      if (localTypingSentRef.current) {
        emitTyping(false);
      }
      localTypingSentRef.current = false;
      return;
    }

    localTypingActiveRef.current = true;
    if (!localTypingSentRef.current && emitTyping(true)) {
      localTypingSentRef.current = true;
    }

    localTypingTimerRef.current = setTimeout(() => {
      localTypingActiveRef.current = false;
      if (localTypingSentRef.current) {
        emitTyping(false);
      }
      localTypingSentRef.current = false;
      localTypingTimerRef.current = null;
    }, LOCAL_TYPING_IDLE_MS);
  }, [clearLocalTypingTimer, emitTyping]);

  const loadHistory = useCallback(async () => {
    const requestId = historyRequestRef.current + 1;
    historyRequestRef.current = requestId;
    setMessages([]);
    setHistoryError('');
    setNextCursor(null);
    setLoadingOlder(false);
    setOlderHistoryError('');
    shouldScrollToEndRef.current = false;

    if (!chatId) {
      setHistoryLoading(false);
      setHistoryError('대화방 정보를 확인할 수 없습니다.');
      return;
    }
    if (!currentActivityAccountId) {
      setHistoryLoading(false);
      setHistoryError('활성 프로필 정보를 확인할 수 없습니다.');
      return;
    }

    setHistoryLoading(true);
    try {
      const response = await apiClient.getChatMessages(chatId);
      const nextMessages = response.items.map((message) =>
        normalizeHistoryMessage(message, currentActivityAccountId),
      );

      if (historyRequestRef.current === requestId) {
        shouldScrollToEndRef.current = true;
        setMessages((currentMessages) => {
          const historyIds = new Set(
            nextMessages.map((message) => message.id),
          );

          const currentOnlyMessages = currentMessages.filter(
            (message) =>
              message?.id &&
              !historyIds.has(message.id),
          );

          return [...nextMessages, ...currentOnlyMessages];
        });
        setNextCursor(response.nextCursor || null);
        try {
          apiClient.markChatRead(chatId).catch(() => {});
          if (socketRef.current?.connected && socketAuthReadyRef.current) {
            socketRef.current.emit(CHAT_SOCKET_EVENTS.READ, { chatId });
          }
        } catch {}
      }
    } catch (error) {
      if (historyRequestRef.current === requestId) {
        setHistoryError(error?.message || '대화 내역을 불러오지 못했습니다.');
      }
    } finally {
      if (historyRequestRef.current === requestId) {
        setHistoryLoading(false);
      }
    }
  }, [chatId, currentActivityAccountId]);

  const loadOlderHistory = useCallback(async () => {
    if (
      !chatId ||
      !currentActivityAccountId ||
      !nextCursor ||
      historyLoading ||
      historyError ||
      loadingOlder
    ) {
      return;
    }

    const requestId = historyRequestRef.current;
    const cursor = nextCursor;
    setLoadingOlder(true);
    setOlderHistoryError('');

    try {
      const response = await apiClient.getChatMessages(chatId, cursor);
      const olderMessages = response.items.map((message) =>
        normalizeHistoryMessage(message, currentActivityAccountId),
      );

      if (historyRequestRef.current === requestId) {
        setMessages((currentMessages) => {
          const currentIds = new Set(currentMessages.map((message) => message.id));
          const pageIds = new Set();
          const uniqueOlderMessages = olderMessages.filter((message) => {
            if (currentIds.has(message.id) || pageIds.has(message.id)) return false;
            pageIds.add(message.id);
            return true;
          });
          return [...uniqueOlderMessages, ...currentMessages];
        });
        setNextCursor(response.nextCursor || null);
      }
    } catch (error) {
      if (historyRequestRef.current === requestId) {
        setOlderHistoryError(
          error?.message || '이전 대화를 불러오지 못했습니다.',
        );
      }
    } finally {
      if (historyRequestRef.current === requestId) {
        setLoadingOlder(false);
      }
    }
  }, [
    chatId,
    currentActivityAccountId,
    nextCursor,
    historyLoading,
    historyError,
    loadingOlder,
  ]);

  useEffect(() => {
    loadHistory();
    return () => {
      historyRequestRef.current += 1;
    };
  }, [loadHistory]);

  useEffect(() => {
    clearRemoteTypingTimer();
    setIsCounterpartTyping(false);

    const normalizedToken =
      typeof authToken === 'string'
        ? authToken.trim()
        : '';

    if (!normalizedToken || !chatId || !currentActivityAccountId) {
      return undefined;
    }

    const socket = createChatSocket(normalizedToken);
    socketRef.current = socket;
    socketAuthReadyRef.current = false;
    localTypingSentRef.current = false;

    const handleAuthReady = (payload) => {
      if (payload?.ok !== true) return;

      socketAuthReadyRef.current = true;
      localTypingSentRef.current = false;
      socket.emit(CHAT_SOCKET_EVENTS.JOIN, {
        chatId,
      });

      if (localTypingActiveRef.current && emitTyping(true)) {
        localTypingSentRef.current = true;
      }
    };

    const handleRealtimeMessage = (message) => {
      if (message?.chatId !== chatId) return;

      try {
        const nextMessage = normalizeHistoryMessage(
          message,
          currentActivityAccountId,
        );

        appendUniquePersistedMessage(nextMessage);

        if (nextMessage.sender === 'other') {
          try {
            apiClient.markChatRead(chatId).catch(() => {});
            if (socket.connected && socketAuthReadyRef.current) {
              socket.emit(CHAT_SOCKET_EVENTS.READ, { chatId });
            }
          } catch {}
        }

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch {
        // Ignore malformed realtime payloads without affecting HTTP chat flows.
      }
    };

    const handleRealtimeTyping = (payload) => {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;
      if (payload.chatId !== chatId || typeof payload.typing !== 'boolean') return;

      const senderAccountId =
        typeof payload.senderAccountId === 'string'
          ? payload.senderAccountId.trim()
          : '';
      if (!senderAccountId || senderAccountId === currentActivityAccountId) return;
      if (hasCounterpartIdentityConflict) return;
      if (counterpartAccountId && senderAccountId !== counterpartAccountId) return;

      clearRemoteTypingTimer();
      if (!payload.typing) {
        setIsCounterpartTyping(false);
        return;
      }

      setIsCounterpartTyping(true);
      remoteTypingTimerRef.current = setTimeout(() => {
        setIsCounterpartTyping(false);
        remoteTypingTimerRef.current = null;
      }, REMOTE_TYPING_EXPIRY_MS);
    };

    const handleRealtimeRead = (payload) => {
      if (!payload || payload.chatId !== chatId) return;
      const readerAccountId =
        typeof payload.readerAccountId === 'string'
          ? payload.readerAccountId.trim()
          : '';
      if (readerAccountId && readerAccountId !== currentActivityAccountId) {
        const readAt = payload.readAt || new Date().toISOString();
        setMessages((currentMessages) =>
          currentMessages.map((msg) =>
            msg.sender === 'me' && !msg.readAt ? { ...msg, readAt } : msg,
          ),
        );
      }
    };

    socket.on(CHAT_SOCKET_EVENTS.AUTH_READY, handleAuthReady);
    socket.on(CHAT_SOCKET_EVENTS.MESSAGE, handleRealtimeMessage);
    socket.on(CHAT_SOCKET_EVENTS.TYPING, handleRealtimeTyping);
    socket.on(CHAT_SOCKET_EVENTS.READ, handleRealtimeRead);
    socket.connect();

    return () => {
      clearLocalTypingTimer();
      clearRemoteTypingTimer();
      if (
        socket.connected &&
        socketAuthReadyRef.current &&
        localTypingSentRef.current
      ) {
        socket.emit(CHAT_SOCKET_EVENTS.TYPING, {
          chatId,
          typing: false,
        });
      }
      localTypingActiveRef.current = false;
      localTypingSentRef.current = false;
      socketAuthReadyRef.current = false;

      if (socket.connected) {
        socket.emit(CHAT_SOCKET_EVENTS.LEAVE, {
          chatId,
        });
      }

      socket.off(
        CHAT_SOCKET_EVENTS.AUTH_READY,
        handleAuthReady,
      );
      socket.off(
        CHAT_SOCKET_EVENTS.MESSAGE,
        handleRealtimeMessage,
      );
      socket.off(
        CHAT_SOCKET_EVENTS.TYPING,
        handleRealtimeTyping,
      );
      socket.off(
        CHAT_SOCKET_EVENTS.READ,
        handleRealtimeRead,
      );
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [
    authToken,
    chatId,
    currentActivityAccountId,
    counterpartAccountId,
    hasCounterpartIdentityConflict,
    appendUniquePersistedMessage,
    clearLocalTypingTimer,
    clearRemoteTypingTimer,
    emitTyping,
  ]);

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({
        tabBarStyle: { display: 'none' },
      });
      
      return () => {
        parent?.setOptions({ tabBarStyle: undefined });
      };
    }, [navigation])
  );

    useEffect(() => {
    if (typeof route?.params?.isFavorite === 'boolean') {
      setIsFavorite(route.params.isFavorite);
    }
  }, [route?.params?.isFavorite]);

  const formatPoints = useCallback((amount) => {
    const numeric = Number(amount);
    if (!Number.isFinite(numeric)) return '0';
    try {
      if (typeof Intl !== 'undefined' && typeof Intl.NumberFormat === 'function') {
        return new Intl.NumberFormat('ko-KR').format(numeric);
      }
    } catch (error) {
      console.warn('Intl format failed:', error);
    }
    return Math.round(numeric)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }, []);

  const appendMessage = useCallback((message = {}) => {
    const { sender = 'me', timestamp, ...rest } = message;
    const resolvedTimestamp =
      timestamp ??
      new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });

    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        sender,
        timestamp: resolvedTimestamp,
        ...rest,
      },
    ]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
      }, []);

  const appendMediaMessage = useCallback(
    async (asset) => {
      if (!asset?.uri || !chatId || !currentActivityAccountId) return;
      const assetType = (asset?.type || '').toLowerCase();
      const mediaType = assetType.includes('video') ? 'video' : 'image';
      const clientMessageId = uuid.v4();

      try {
        const uploadResult = await apiClient.uploadChatMedia(asset);
        const mediaUrl = uploadResult?.url || asset.uri;

        const confirmedMessage = await apiClient.sendChatMessage({
          chatId,
          content: mediaUrl,
          type: mediaType,
          clientMessageId,
        });

        const normalized = normalizeHistoryMessage(
          confirmedMessage,
          currentActivityAccountId,
        );
        appendUniquePersistedMessage(normalized);

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        Alert.alert(
          '전송 실패',
          error?.message || '사진/동영상을 전송하지 못했습니다. 다시 시도해 주세요.',
        );
      }
    },
    [chatId, currentActivityAccountId, appendUniquePersistedMessage]
  );

  const ensureCameraPermission = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라 접근을 허용해 주세요. 설정에서 권한을 변경할 수 있습니다.');
      return false;
    }
    return true;
  }, []);

  const ensureLibraryPermission = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '앨범 접근 권한이 필요합니다. 설정에서 권한을 허용해 주세요.');
      return false;
    }
    return true;
  }, []);

  const handleLaunchCamera = useCallback(
    async (mode) => {
      setCameraModeVisible(false);
      const hasPermission = await ensureCameraPermission();
      if (!hasPermission) return;

      try {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes:
            mode === 'video'
              ? ImagePicker.MediaTypeOptions.Videos
              : ImagePicker.MediaTypeOptions.Images,
          quality: 1,
          videoMaxDuration: 60,
        });

        if (!result.canceled && Array.isArray(result.assets)) {
          result.assets.forEach(appendMediaMessage);
        }
      } catch (error) {
        console.error('Camera launch error:', error);
        Alert.alert('오류', '카메라를 여는 중 문제가 발생했습니다.');
      }
    },
    [appendMediaMessage, ensureCameraPermission]
  );

  const handlePickFromLibrary = useCallback(async () => {
    setKeyboardVisible(false);
    setAttachSheetVisible(false);
    const hasPermission = await ensureLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && Array.isArray(result.assets)) {
        result.assets.forEach(appendMediaMessage);
      }
    } catch (error) {
      console.error('Library pick error:', error);
      Alert.alert('오류', '앨범을 여는 중 문제가 발생했습니다.');
    }
  }, [appendMediaMessage, ensureLibraryPermission]);

  const handleOpenCameraOptions = useCallback(() => {
    setKeyboardVisible(false);
    setAttachSheetVisible(false);
    setCameraModeVisible(true);
  }, []);

  const handleOpenGiftSheet = useCallback(() => {
    setKeyboardVisible(false);
    setAttachSheetVisible(false);
    setGiftSheetVisible(true);
  }, []);

    const handleToggleFavorite = useCallback(() => {
    setOptionsVisible(false);
    setIsFavorite((prev) => {
      const next = !prev;
      route?.params?.onToggleFavorite?.(next);
      navigation.setParams({ isFavorite: next });
      Alert.alert(
        '즐겨찾기',
        next
          ? `${user.name}님을 즐겨찾기에 추가했어요.`
          : `${user.name}님을 즐겨찾기에서 삭제했어요.`
      );
      return next;
    });
  }, [navigation, route?.params, user.name]);

  const handleSendGift = useCallback(
    async (gift) => {
      if (!gift?.id || !chatId || !currentActivityAccountId) return;
      const clientMessageId = uuid.v4();
      setGiftSheetVisible(false);

      try {
        const response = await apiClient.sendChatGift({
          chatId,
          giftId: gift.id,
          clientMessageId,
        });

        const confirmedMessage = response?.message;
        if (confirmedMessage) {
          const normalized = normalizeHistoryMessage(
            confirmedMessage,
            currentActivityAccountId,
          );
          appendUniquePersistedMessage(normalized);
        }

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        Alert.alert(
          '선물 전송 완료',
          `${gift.name} (${formatPoints(gift.amount)}P)을(를) 선물했습니다.`,
        );
      } catch (error) {
        Alert.alert(
          '선물 전송 실패',
          error?.message || '선물을 전송하지 못했습니다. 보유 포인트를 확인해 주세요.',
        );
      }
    },
    [chatId, currentActivityAccountId, appendUniquePersistedMessage, formatPoints]
  );

  const loadGiftOptions = useCallback(async () => {
    setLoadingGifts(true);
    setGiftError(null);
    try {
      const gifts = await listGiftOptions();
      setGiftOptions(gifts);
      if (gifts.length === 0) {
        setGiftError('선물 기능이 준비 중입니다.');
      }
    } catch (error) {
      console.error('Failed to load gift options:', error);
      setGiftOptions([]);
      setGiftError('선물 기능이 준비 중입니다.');
    } finally {
      setLoadingGifts(false);
    }
  }, []);

  useEffect(() => {
    if (giftSheetVisible) {
      loadGiftOptions();
    }
  }, [giftSheetVisible, loadGiftOptions]);

  const sendMessage = async () => {
    if (sendingMessage) return;
    const content = inputText.trim();
    if (
      !content ||
      !chatId ||
      !currentActivityAccountId ||
      historyLoading ||
      historyError
    ) {
      return;
    }

    clearLocalTypingTimer();
    localTypingActiveRef.current = false;
    if (localTypingSentRef.current) {
      emitTyping(false);
    }
    localTypingSentRef.current = false;

    setSendingMessage(true);
    try {
      const pendingMessage =
        pendingMessageRef.current?.chatId === chatId &&
        pendingMessageRef.current?.content === content
          ? pendingMessageRef.current
          : {
              chatId,
              content,
              clientMessageId: uuid.v4(),
            };
      pendingMessageRef.current = pendingMessage;

      const sent = await apiClient.sendChatMessage(pendingMessage);
      if (
        sent.chatId !== chatId ||
        sent.senderAccountId !== currentActivityAccountId
      ) {
        throw new Error('메시지 전송 응답의 대화 또는 발신자 정보가 올바르지 않습니다.');
      }

      const nextMessage = {
        id: sent.id,
        chatId: sent.chatId,
        sender: 'me',
        senderAccountId: sent.senderAccountId,
        text: sent.content,
        timestamp: formatMessageTime(sent.createdAt),
        type: 'text',
        backendType: sent.type,
      };

      appendUniquePersistedMessage(nextMessage);
      pendingMessageRef.current = null;
      setInputText((current) => {
        const nextInput = current.trim() === content ? '' : current;
        inputTextRef.current = nextInput;
        return nextInput;
      });
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert(
        '메시지 전송 실패',
        error?.message || '메시지를 전송하지 못했습니다.',
      );
    } finally {
      setSendingMessage(false);
    }
  };

  const openReport = () => {
    setOptionsVisible(false);
    setReportVisible(true);
  };

  const handleBlockUser = () => {
    if (blocking) return;

    const participantTarget = resolveParticipantTarget(user, route?.params);
    if (!participantTarget) {
      setOptionsVisible(false);
      Alert.alert('차단 실패', '차단할 회원 정보를 찾을 수 없습니다.');
      return;
    }

    setOptionsVisible(false);

    Alert.alert(
      '회원 차단',
      '이 회원을 차단하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '차단',
          style: 'destructive',
          onPress: async () => {
            setBlocking(true);

            try {
              await apiClient.blockUser(
                participantTarget.targetUserId
                  ? { blockedUserId: participantTarget.targetUserId }
                  : { targetAccountId: participantTarget.targetAccountId },
              );
              Alert.alert('차단 완료', '회원이 차단되었습니다.', [
                {
                  text: '확인',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              Alert.alert(
                '차단 실패',
                error?.message || '회원을 차단하지 못했습니다.',
              );
            } finally {
              setBlocking(false);
            }
          },
        },
      ],
    );
  };

  const submitReport = async () => {
    if (reporting) return;

    const reason = reportText.trim();
    if (!reason) {
      Alert.alert('알림', '신고 내용을 입력해 주세요.');
      return;
    }

    const participantTarget = resolveParticipantTarget(user, route?.params);
    if (!participantTarget) {
      Alert.alert('신고 실패', '신고할 회원 정보를 찾을 수 없습니다.');
      return;
    }

    setReporting(true);

    try {
      await apiClient.reportUser({ ...participantTarget, reason });

      setReportVisible(false);
      setReportText('');
      Alert.alert('신고 완료', '신고가 정상적으로 접수되었습니다.');
    } catch (error) {
      Alert.alert(
        '신고 실패',
        error?.message || '신고를 접수하지 못했습니다.',
      );
    } finally {
      setReporting(false);
    }
  };

  const renderMessage = ({ item }) => {
        if (item.type === 'date') {
      return (
        <View style={styles.daySeparator}>
          <Text style={styles.daySeparatorText}>{item.text}</Text>
        </View>
      );
    }

    const isMe = item.sender === 'me';
    const bubbleStyles = [
      styles.messageBubble,
      isMe ? styles.myMessageBubble : styles.otherMessageBubble,
    ];

    if (item.type === 'media') {
      bubbleStyles.push(styles.mediaMessageBubble);
    }

    if (item.type === 'gift') {
      bubbleStyles.push(styles.giftMessageBubble);
    }

    const renderBubbleContent = () => {
      if (item.type === 'media' && item.media?.uri) {
        if (item.mediaType === 'video') {
          return (
            <View style={styles.videoAttachmentContainer}>
              <ChatVideoAttachment uri={item.media.uri} />
            </View>
          );
        }

        return (
          <Image
            source={{ uri: item.media.uri }}
            style={styles.imageAttachment}
            resizeMode="cover"
          />
        );
      }

      if (item.type === 'gift' && item.gift) {
        const giftTextColor = isMe ? '#3F2A00' : colors.text;
        const giftAccentColor = isMe ? '#3F2A00' : colors.primary;

        return (
          <View style={styles.giftContent}>
            <View style={[styles.giftIconBadge, { borderColor: giftAccentColor }]}>
              <Ionicons name="gift-outline" size={18} color={giftAccentColor} />
            </View>
            <View style={styles.giftTextWrapper}>
              <Text style={[styles.giftTitle, { color: giftTextColor }]}>{item.gift.name}</Text>
              <Text style={[styles.giftAmount, { color: giftAccentColor }]}>
                {formatPoints(item.gift.amount)}P 전송
              </Text>
              {item.gift.description ? (
                <Text style={styles.giftDescription}>{item.gift.description}</Text>
              ) : null}
            </View>
          </View>
        );
      }

      return (
        <Text
          style={[
            styles.messageText,
            isMe ? styles.myMessageText : styles.otherMessageText,
          ]}
        >
          {item.text}
        </Text>
      );
    };
 
    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {item.sender === 'other' && (
          <Avatar
            name={user.name}
            size={40}
            shape="circle"
            style={styles.messageAvatar}
          />
        )}
        <View style={styles.messageContent}>
          <View style={bubbleStyles}>{renderBubbleContent()}</View>
          <View style={[styles.messageFooterRow, isMe && styles.myMessageFooterRow]}>
            {isMe && !item.readAt && (
              <Text style={styles.unreadCountBadge}>1</Text>
            )}
            <Text
              style={[
                styles.messageTime,
                isMe ? styles.myMessageTime : styles.otherMessageTime,
              ]}
            >
              {item.timestamp}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderGiftOption = ({ item }) => (
    <TouchableOpacity
      style={styles.giftOptionButton}
      onPress={() => handleSendGift(item)}
    >
      <View style={styles.giftOptionTextWrapper}>
        <Text style={styles.giftOptionAmount}>{formatPoints(item.amount)}P</Text>
        <Text style={styles.giftOptionName}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.giftOptionDescription}>{item.description}</Text>
        ) : null}
      </View>
      <Ionicons name="paper-plane" size={18} color={colors.primary} />
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#DCE6FF', '#F5F6FB']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.gradient}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View
          style={styles.header}
          onLayout={(event) => {
            const nextHeight = event.nativeEvent.layout.height;
            if (nextHeight !== headerHeight) {
              setHeaderHeight(nextHeight);
            }
          }}
        >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#202436" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Avatar
            name={user.name}
            size={46}
            shape="circle"
            style={styles.headerAvatar}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{user.name}</Text>
            <View style={styles.onlineStatus}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>
                {isCounterpartTyping ? '입력 중...' : '온라인'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.favoriteButton,
              isFavorite && styles.favoriteButtonActive,
            ]}
            onPress={handleToggleFavorite}
            hitSlop={8}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isFavorite ? 'star' : 'star-outline'}
              size={22}
              color={isFavorite ? '#FFC93D' : '#202436'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => setOptionsVisible(true)}
            hitSlop={8}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#202436" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        enabled={Platform.OS === 'ios' ? true : isKeyboardVisible}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesListContainer}
          contentContainerStyle={[
            styles.messagesList,
            { paddingBottom: composerHeight + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          onContentSizeChange={() => {
            if (!shouldScrollToEndRef.current) return;
            shouldScrollToEndRef.current = false;
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
          ListHeaderComponent={
            messages.length > 0 && (nextCursor || loadingOlder || olderHistoryError) ? (
              <View style={styles.olderHistoryContainer}>
                {loadingOlder ? (
                  <>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.olderHistoryText}>이전 대화를 불러오는 중...</Text>
                  </>
                ) : olderHistoryError ? (
                  <>
                    <Text style={styles.olderHistoryErrorText}>{olderHistoryError}</Text>
                    <TouchableOpacity
                      style={styles.olderHistoryButton}
                      onPress={loadOlderHistory}
                    >
                      <Text style={styles.olderHistoryButtonText}>다시 시도</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.olderHistoryButton}
                    onPress={loadOlderHistory}
                  >
                    <Text style={styles.olderHistoryButtonText}>이전 대화 불러오기</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.historyStateContainer}>
              {historyLoading ? (
                <>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.historyStateText}>대화 내역을 불러오는 중...</Text>
                </>
              ) : historyError ? (
                <>
                  <Text style={styles.historyStateText}>{historyError}</Text>
                  <TouchableOpacity style={styles.historyRetryButton} onPress={loadHistory}>
                    <Text style={styles.historyRetryText}>다시 시도</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.historyStateText}>아직 메시지가 없어요</Text>
              )}
            </View>
          }
        />

        <View
          style={[
            styles.inputContainer,
            { paddingBottom: insets.bottom + 8 },
          ]}
          onLayout={(event) => {
            const nextHeight = event.nativeEvent.layout.height;
            if (nextHeight !== composerHeight) {
              setComposerHeight(nextHeight);
            }
          }}
        >
          <TouchableOpacity
            style={styles.attachButton}
            onPress={() => {
              Keyboard.dismiss();
              setKeyboardVisible(false);
              setAttachSheetVisible(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={28} color="#8E97B5" />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="메시지 입력..."
              placeholderTextColor={colors.textTertiary}
              value={inputText}
              onChangeText={handleInputTextChange}
              multiline
              maxLength={500}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (
                inputText.trim() === '' ||
                sendingMessage ||
                historyLoading ||
                !!historyError ||
                !chatId ||
                !currentActivityAccountId
              ) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={
              inputText.trim() === '' ||
              sendingMessage ||
              historyLoading ||
              !!historyError ||
              !chatId ||
              !currentActivityAccountId
            }
          >
            {sendingMessage ? (
              <ActivityIndicator size="small" color="#2B230A" />
            ) : (
              <Ionicons
               name="paper-plane"
                size={20}
                color={inputText.trim() ? '#2B230A' : colors.textTertiary}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

              <Modal
        transparent
        visible={attachSheetVisible}
        animationType="fade"
        onRequestClose={() => {
          Keyboard.dismiss();
          setKeyboardVisible(false);
          setAttachSheetVisible(false);
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            setKeyboardVisible(false);
            setAttachSheetVisible(false);
          }}
        >
          <View style={styles.bottomSheetBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.bottomSheetContainer, { paddingBottom: insets.bottom + 16 }]}>
                <Text style={styles.sheetTitle}>빠른 첨부</Text>
                <View style={styles.sheetActionsRow}>
                  <TouchableOpacity
                    style={styles.sheetActionButton}
                    onPress={handleOpenCameraOptions}
                  >
                    <View style={styles.sheetActionIcon}>
                      <Ionicons name="camera-outline" size={22} color={colors.primary} />
                    </View>
                    <Text style={styles.sheetActionLabel}>카메라</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sheetActionButton}
                    onPress={handlePickFromLibrary}
                  >
                    <View style={styles.sheetActionIcon}>
                      <Ionicons name="images-outline" size={22} color={colors.primary} />
                    </View>
                    <Text style={styles.sheetActionLabel}>앨범</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sheetActionButton}
                    onPress={handleOpenGiftSheet}
                  >
                    <View style={styles.sheetActionIcon}>
                      <Ionicons name="gift-outline" size={22} color={colors.primary} />
                    </View>
                    <Text style={styles.sheetActionLabel}>선물하기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        transparent
        visible={cameraModeVisible}
        animationType="fade"
        onRequestClose={() => setCameraModeVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setCameraModeVisible(false)}>
          <View style={styles.bottomSheetBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.bottomSheetContainer, { paddingBottom: insets.bottom + 16 }]}>
                <Text style={styles.sheetTitle}>촬영 모드 선택</Text>
                <TouchableOpacity
                  style={styles.sheetOptionButton}
                  onPress={() => handleLaunchCamera('photo')}
                >
                  <Ionicons name="camera" size={20} color={colors.primary} style={styles.sheetOptionIcon} />
                  <Text style={styles.sheetOptionLabel}>사진 촬영</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sheetOptionButton}
                  onPress={() => handleLaunchCamera('video')}
                >
                  <Ionicons name="videocam" size={20} color={colors.primary} style={styles.sheetOptionIcon} />
                  <Text style={styles.sheetOptionLabel}>동영상 촬영</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        transparent
        visible={giftSheetVisible}
        animationType="fade"
        onRequestClose={() => setGiftSheetVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setGiftSheetVisible(false)}>
          <View style={styles.bottomSheetBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.bottomSheetContainer, styles.giftSheetContainer, { paddingBottom: insets.bottom + 16 }]}>
                <View style={styles.giftSheetHeader}>
                  <Text style={styles.sheetTitle}>선물하기</Text>
                  <View style={styles.giftSheetHeaderActions}>
                    <TouchableOpacity
                      style={[styles.giftHeaderButton, loadingGifts && styles.giftHeaderButtonDisabled]}
                      onPress={loadGiftOptions}
                      disabled={loadingGifts}
                    >
                      <Ionicons
                        name="refresh"
                        size={20}
                        color={loadingGifts ? colors.textTertiary : colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                {loadingGifts ? (
                  <View style={styles.giftLoadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.giftLoadingText}>선물 목록을 불러오는 중...</Text>
                  </View>
                ) : giftOptions.length > 0 ? (
                  <FlatList
                    data={giftOptions}
                    keyExtractor={(item) => item.id}
                    renderItem={renderGiftOption}
                    contentContainerStyle={styles.giftList}
                    ItemSeparatorComponent={() => <View style={styles.giftSeparator} />}
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  <View style={styles.giftErrorContainer}>
                    <Text style={styles.giftErrorText}>{giftError || '선물 기능이 준비 중입니다.'}</Text>
                    <TouchableOpacity style={styles.giftRetryButton} onPress={loadGiftOptions}>
                      <Text style={styles.giftRetryText}>다시 시도</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      <Modal
        transparent
        visible={optionsVisible}
        animationType="fade"
        onRequestClose={() => setOptionsVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOptionsVisible(false)}>
          <View style={styles.optionsBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.optionCard}>
                <TouchableOpacity style={styles.optionItem} onPress={handleToggleFavorite}>
                  <Ionicons
                    name={isFavorite ? 'star' : 'star-outline'}
                    size={18}
                    color={isFavorite ? '#FFC93D' : '#1F2A44'}
                  />
                  <Text style={styles.optionText}>
                    {isFavorite ? '즐겨찾기 삭제' : '즐겨찾기 추가'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.optionDivider} />
                <TouchableOpacity style={styles.optionItem} onPress={openReport}>
                  <Ionicons name="flag-outline" size={18} color={colors.primary} />
                  <Text style={styles.optionText}>신고하기</Text>
                </TouchableOpacity>
                <View style={styles.optionDivider} />
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={handleBlockUser}
                  disabled={blocking}
                >
                  {blocking ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="ban-outline" size={18} color={colors.primary} />
                  )}
                  <Text style={styles.optionText}>차단하기</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        transparent
        visible={reportVisible}
        animationType="fade"
        onRequestClose={() => setReportVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setReportVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.reportCard}>
                <Text style={styles.reportTitle}>신고하기</Text>
                <Text style={styles.reportDescription}>
                  문제가 되는 내용을 자세히 작성해 주세요. 확인 후 신속히 조치하겠습니다.
                </Text>
                <TextInput
                  style={styles.reportInput}
                  multiline
                  placeholder="신고 내용을 입력하세요"
                  placeholderTextColor={colors.textTertiary}
                  value={reportText}
                  onChangeText={setReportText}
                  maxLength={500}
                />
                <View style={styles.reportActions}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => setReportVisible(false)}
                  >
                    <Text style={styles.secondaryBtnTxt}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, (reportText.trim() === '' || reporting) && styles.primaryBtnDisabled]}
                    onPress={submitReport}
                    disabled={reportText.trim() === '' || reporting}
                    activeOpacity={0.85}
                  >
                    {reporting ? (
                      <ActivityIndicator size="small" color={colors.textInverse} />
                    ) : (
                      <Text style={styles.primaryBtnTxt}>신고 보내기</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
    gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: 'rgba(243, 247, 255, 0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(192, 205, 238, 0.65)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(204, 214, 244, 0.9)',
    marginRight: 10,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    marginRight: 0,
    borderWidth: 2,
    borderColor: '#D6E0FF',
    borderRadius: 30,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202436',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3CCB89',
    marginRight: 6,
  },
  onlineText: {
    fontSize: 12,
    color: '#4D7A64',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    padding: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(204, 214, 244, 0.8)',
  },
  favoriteButtonActive: {
    backgroundColor: 'rgba(255, 213, 96, 0.28)',
  },
  moreButton: {
    padding: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(204, 214, 244, 0.8)',
  },
  chatContainer: {
    flex: 1,
  },
  messagesListContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  historyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  historyStateText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  historyRetryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#E2E8F5',
  },
  historyRetryText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  olderHistoryContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
    gap: 8,
  },
  olderHistoryText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  olderHistoryErrorText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  olderHistoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#E2E8F5',
  },
  olderHistoryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  messageContainer: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
    flexDirection: 'row',
  },
  messageAvatar: {
    marginHorizontal: 10,
    marginBottom: 4,
  },
  messageContent: {
    maxWidth: '82%',
  },
  daySeparator: {
    alignSelf: 'center',
    marginVertical: 12,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(206, 214, 234, 0.6)',
  },
  daySeparatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#75809D',
  },
  messageBubble: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
  },
  mediaMessageBubble: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  giftMessageBubble: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  myMessageBubble: {
    backgroundColor: '#FFE27A',
    borderBottomRightRadius: 8,
    borderWidth: 0,
  },
  otherMessageBubble: {
    backgroundColor: '#EEF1F8',
    borderBottomLeftRadius: 8,
    borderWidth: 0,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#2F2608',
    fontWeight: '600',
  },
  otherMessageText: {
    color: '#20263A',
  },
  messageFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  myMessageFooterRow: {
    justifyContent: 'flex-end',
  },
  unreadCountBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF9500',
    marginRight: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    color: 'rgba(44, 34, 6, 0.55)',
  },
  otherMessageTime: {
    color: '#8D96B5',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(243, 247, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(202, 212, 235, 0.7)',
  },
  attachButton: {
    padding: 6,
    marginBottom: 4,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(200, 210, 236, 0.85)',
    marginHorizontal: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 46,
    maxHeight: 140,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#202436',
    paddingTop: 0,
    paddingBottom: 0,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE27A',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 18,
    shadowColor: '#7EA0FF',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2A44',
  },
  sheetActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sheetActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F5',
    backgroundColor: '#F8FAFF',
    gap: 8,
  },
  sheetActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(243,108,147,0.18)',
    alignItems: 'center',
    justifyContent: 'center',    
  },
  sheetActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2A44',
  },
  sheetOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F5',
    paddingHorizontal: 14,
    marginTop: 4,
    gap: 12,
    backgroundColor: '#F8FAFF',
  },
  sheetOptionIcon: {
    width: 28,
    textAlign: 'center',
  },
  sheetOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2A44',
  },
  giftSheetContainer: {
    gap: 16,
  },
  giftSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  giftSheetHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  giftHeaderButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  giftHeaderButtonDisabled: {
    opacity: 0.6,
  },
  giftList: {
    gap: 12,
    paddingBottom: 8,
  },
  giftSeparator: {
    height: 10,
  },
  giftOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F5',
    backgroundColor: '#FFFFFF',
    gap: 16,
    shadowColor: '#E2E8F5',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  giftOptionTextWrapper: {
    flex: 1,
  },
  giftOptionAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  giftOptionName: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2A44',
  },
  giftOptionDescription: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },
  giftLoadingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  giftLoadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  giftErrorContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  giftErrorText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  giftRetryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: '#E2E8F5',
  },
  giftRetryText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  imageAttachment: {
    width: 220,
    height: 220,
    borderRadius: 18,
  },
  videoAttachmentContainer: {
    width: 220,
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoAttachment: {
    width: '100%',
    height: '100%',
  },
  giftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  giftIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(243,108,147,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF6FB',
  },
  giftTextWrapper: {
    flex: 1,
  },
  giftTitle: {
    fontSize: 15,
    fontWeight: '700',    
    color: '#1F2A44',
  },
  giftAmount: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  giftDescription: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },
  optionsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.25)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingHorizontal: 18,
    paddingTop: 72,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  optionCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    minWidth: 160,
    shadowColor: '#8BA9FF',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#E4E9F6',
    marginVertical: 6,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2A44',
  },
  reportCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 24,
    paddingHorizontal: 26,
    paddingVertical: 26,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#7EA0FF',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2A44',
  },
  reportDescription: {
    marginTop: 10,
    color: '#5B657A',
    lineHeight: 20,
  },
  reportInput: {
    marginTop: 18,
    minHeight: 130,
    borderWidth: 1,
    borderColor: '#E2E8F5',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    textAlignVertical: 'top',
    backgroundColor: '#FFFFFF',
    color: colors.text,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  secondaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F2F4FF',
  },
  secondaryBtnTxt: {
    color: '#5B657A',
    fontWeight: '700',
  },
  primaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.primary,
    shadowColor: '#F36C93',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnTxt: {
    color: colors.textInverse,
    fontWeight: '800',
  },
});
