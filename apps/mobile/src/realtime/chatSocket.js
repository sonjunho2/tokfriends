import { io } from 'socket.io-client';
import { WS_BASE_URL } from '../config/env';

export const CHAT_SOCKET_EVENTS = Object.freeze({
  AUTH_READY: 'connected',
  JOIN: 'chat:join',
  LEAVE: 'chat:leave',
  TYPING: 'chat:typing',
  MESSAGE: 'chat:message',
  READ: 'chat:read',
});

export const LIVE_SOCKET_EVENTS = Object.freeze({
  AUTH_READY: 'connected',
  JOIN: 'live:join',
  LEAVE: 'live:leave',
  MESSAGE: 'live:message',
  VIEWER_COUNT: 'live:viewer_count',
  ROOM_ENDED: 'live:ended',
});

export const createChatSocket = (token) => {
  const normalizedToken =
    typeof token === 'string'
      ? token.trim()
      : '';

  if (!normalizedToken) {
    throw new Error('Chat socket auth token is required');
  }

  return io(WS_BASE_URL, {
    path: '/socket.io',
    autoConnect: false,
    auth: {
      token: normalizedToken,
    },
  });
};
