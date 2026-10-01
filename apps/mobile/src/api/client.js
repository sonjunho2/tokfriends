// src/api/client.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, REQUEST_TIMEOUT_MS, STORAGE_TOKEN_KEY, USE_DUMMY_AUTH } from '../config/env';
import { applyRouteMapToAxiosConfig } from './routeMap';
import { normalizeAxiosResponse, normalizeAxiosError } from './normalize';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

let currentToken = null;

export const DUMMY_CHATS = [
  {
    id: 'chat-mock-1',
    counterpart: {
      id: 'acc-jisoo',
      displayName: '이지수',
      handle: 'jisoo_daily',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    },
    lastMessageAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    lastMessage: '오늘 날씨 정말 좋네요! 주말에 뭐하세요? 😊',
    unreadCount: 2,
  },
  {
    id: 'chat-mock-2',
    counterpart: {
      id: 'acc-minwoo',
      displayName: '김민우',
      handle: 'minwoo_music',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
    lastMessageAt: new Date(Date.now() - 36 * 60 * 1000).toISOString(),
    lastMessage: '방금 라이브 방송 잘 보셨나요? 감사해요!',
    unreadCount: 0,
  },
  {
    id: 'chat-mock-3',
    counterpart: {
      id: 'acc-seoyeon',
      displayName: '박서연',
      handle: 'seoyeon_art',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    },
    lastMessageAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    lastMessage: '추천해주신 카페 다녀왔어요! 분위기 최고예요 ☕',
    unreadCount: 0,
  },
];

export const DUMMY_MESSAGES_STORE = {
  'chat-mock-1': [
    {
      id: 'msg-1',
      chatId: 'chat-mock-1',
      senderAccountId: 'acc-jisoo',
      content: '안녕하세요! 다가온에서 프로필 보고 인사드려요 👋',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      type: 'text',
    },
    {
      id: 'msg-2',
      chatId: 'chat-mock-1',
      senderAccountId: 'dummy-user',
      content: '반가워요 지수님! 저도 음악이랑 사진 촬영 좋아해요 ✨',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      type: 'text',
    },
    {
      id: 'msg-3',
      chatId: 'chat-mock-1',
      senderAccountId: 'acc-jisoo',
      content: '오늘 날씨 정말 좋네요! 주말에 뭐하세요? 😊',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      type: 'text',
    },
  ],
  'chat-mock-2': [
    {
      id: 'msg-201',
      chatId: 'chat-mock-2',
      senderAccountId: 'acc-minwoo',
      content: '방금 라이브 방송 잘 보셨나요? 감사해요!',
      createdAt: new Date(Date.now() - 36 * 60 * 1000).toISOString(),
      type: 'text',
    },
  ],
  'chat-mock-3': [
    {
      id: 'msg-301',
      chatId: 'chat-mock-3',
      senderAccountId: 'acc-seoyeon',
      content: '추천해주신 카페 다녀왔어요! 분위기 최고예요 ☕',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      type: 'text',
    },
  ],
};

export const DUMMY_LIVE_ROOMS = [
  {
    id: 'live-room-1',
    title: '지수와 함께하는 소소한 힐링 토크 🌸',
    category: 'talk',
    viewerCount: 42,
    totalLikes: 128,
    status: 'active',
    host: {
      id: 'acc-jisoo',
      name: '이지수',
      handle: 'jisoo_daily',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      region: '서울 강남구',
    },
  },
  {
    id: 'live-room-2',
    title: '민우의 어쿠스틱 기타 & 보컬 라이브 🎸',
    category: 'music',
    viewerCount: 88,
    totalLikes: 340,
    status: 'active',
    host: {
      id: 'acc-minwoo',
      name: '김민우',
      handle: 'minwoo_music',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      region: '서울 마포구',
    },
  },
  {
    id: 'live-room-3',
    title: '퇴근길 일상 수다방 ☕ 저녁 뭐 드시나요?',
    category: 'daily',
    viewerCount: 19,
    totalLikes: 55,
    status: 'active',
    host: {
      id: 'acc-seoyeon',
      name: '박서연',
      handle: 'seoyeon_art',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      region: '경기 성남시',
    },
  },
];

export const DUMMY_LIVE_MESSAGES_STORE = {
  'live-room-1': [
    { id: 'lmsg-1', senderName: '민재', content: '지수님 안녕하세요! 오늘 방송 화질 진짜 좋네요', type: 'chat', createdAt: new Date(Date.now() - 30000).toISOString() },
    { id: 'lmsg-2', senderName: '유진', content: '목소리 너무 감미로워요 💕', type: 'chat', createdAt: new Date(Date.now() - 15000).toISOString() },
    { id: 'lmsg-3', senderName: '호진', content: '❤️ 하트를 보냈습니다!', type: 'like', createdAt: new Date(Date.now() - 5000).toISOString() },
  ],
  'live-room-2': [
    { id: 'lmsg-21', senderName: '수빈', content: '기타 소리 너무 힐링돼요 🎸', type: 'chat', createdAt: new Date(Date.now() - 20000).toISOString() },
  ],
  'live-room-3': [
    { id: 'lmsg-31', senderName: '지훈', content: '오늘도 고생 많으셨어요!', type: 'chat', createdAt: new Date(Date.now() - 10000).toISOString() },
  ],
};

export const DUMMY_TOPICS = [
  { id: 'topic_daily', name: '일상 / 수다 ☕', postsCount: 14 },
  { id: 'topic_friend', name: '동네 친구 찾기 🤝', postsCount: 9 },
  { id: 'topic_hobby', name: '취미 / 운동 🎨', postsCount: 8 },
  { id: 'topic_hot', name: '인기 이야기 🔥', postsCount: 12 },
];

export const DUMMY_POSTS = [
  {
    id: 'post-1',
    topicId: 'topic_daily',
    topicName: '일상 / 수다 ☕',
    content: '오늘 날씨가 너무 좋아서 한강공원 산책 나왔어요 🌿 산책이나 피크닉 좋아하시는 동네 친구 계신가요?',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    commentsCount: 2,
    likesCount: 15,
    author: {
      id: 'acc-jisoo',
      targetAccountId: 'acc-jisoo',
      name: '이지수',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      region: '서울 강남구',
      headline: '음악과 사진을 사랑하는 일상러',
    },
  },
  {
    id: 'post-2',
    topicId: 'topic_hobby',
    topicName: '취미 / 운동 🎨',
    content: '주말에 어쿠스틱 기타 소모임이나 가벼운 음악 세션 함께하실 분 구해요! 초보자분들도 환영합니다 🎸',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    commentsCount: 1,
    likesCount: 28,
    author: {
      id: 'acc-minwoo',
      targetAccountId: 'acc-minwoo',
      name: '김민우',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      region: '서울 마포구',
      headline: '기타 연주와 음악 라이브 방송 중',
    },
  },
  {
    id: 'post-3',
    topicId: 'topic_friend',
    topicName: '동네 친구 찾기 🤝',
    content: '퇴근하고 가볍게 커피 한잔하면서 이야기 나눌 동네 친구 만들고 싶어요 ☕ 판교/분당 쪽 환영해요!',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    commentsCount: 0,
    likesCount: 34,
    author: {
      id: 'acc-seoyeon',
      targetAccountId: 'acc-seoyeon',
      name: '박서연',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      region: '경기 성남시',
      headline: '디자인과 전시회 관람이 취미예요',
    },
  },
];

export const DUMMY_COMMENTS_STORE = {
  'post-1': [
    {
      id: 'cmt-1',
      postId: 'post-1',
      author: {
        id: 'acc-minwoo',
        name: '김민우',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      },
      content: '오늘 한강 바람 시원하고 정말 좋을 것 같아요!',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'cmt-2',
      postId: 'post-1',
      author: {
        id: 'acc-seoyeon',
        name: '박서연',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      },
      content: '저도 조금 이따가 가보려고요 ㅎㅎ',
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
  ],
  'post-2': [
    {
      id: 'cmt-21',
      postId: 'post-2',
      author: {
        id: 'acc-jisoo',
        name: '이지수',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      },
      content: '민우님 방송 때 기타 소리 너무 좋았어요! 모임 응원합니다',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
  ],
};

export const setAuthToken = (token) => {
  currentToken = token || null;
  if (client?.defaults?.headers?.common) {
    delete client.defaults.headers.common.Authorization;
  }
};

const unauthJsonConfig = (overrides = {}) => {
  const baseTransform = (payload, headers) => {
    if (headers && 'Authorization' in headers) delete headers.Authorization;
    return typeof payload === 'string' ? payload : JSON.stringify(payload);
  };

  const extraTransforms = overrides.transformRequest
    ? Array.isArray(overrides.transformRequest)
      ? overrides.transformRequest
      : [overrides.transformRequest]
    : [];

  return {
    __unauth: true,
    ...overrides,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(overrides.headers || {}),
    },
    transformRequest: [baseTransform, ...extraTransforms],
  };
};

const unauthConfig = (overrides = {}) => ({
  __unauth: true,
  ...overrides,
  headers: {
    Accept: 'application/json',
    ...(overrides.headers || {}),
  },
});

export const getStoredToken = async () => {
  try { return await AsyncStorage.getItem(STORAGE_TOKEN_KEY); }
  catch (e) { console.error('Failed to get stored token:', e); return null; }
};

export const saveToken = async (token) => {
  try { await AsyncStorage.setItem(STORAGE_TOKEN_KEY, token); setAuthToken(token); }
  catch (e) { console.error('Failed to save token:', e); throw e; }
};

export const clearToken = async () => {
  try { await AsyncStorage.removeItem(STORAGE_TOKEN_KEY); setAuthToken(null); }
  catch (e) { console.error('Failed to clear token:', e); }
};

client.interceptors.request.use(
  async (config) => {
    if (!currentToken) {
      const storedToken = await getStoredToken();
      if (storedToken) setAuthToken(storedToken);
    }

    // ★ 경로 자동 매핑
    let workingConfig = applyRouteMapToAxiosConfig(config);

    const headers = workingConfig.headers || (workingConfig.headers = {});
    if (workingConfig.__unauth === true) {
      delete headers.Authorization;
      if (headers.common) delete headers.common.Authorization;
      if (headers.post) delete headers.post.Authorization;
    } else if (currentToken && !headers.Authorization) {
      headers.Authorization = `Bearer ${currentToken}`;
    }

    return workingConfig;
  },
  (error) => Promise.reject(error)
);

// ★ 응답 인터셉터: 모든 성공 응답을 표준 포맷으로 노멀라이즈
client.interceptors.response.use(
  (res) => normalizeAxiosResponse(res),
  async (error) => {
    if (error?.response?.status === 401) await clearToken();
    // 에러도 표준 포맷 메시지로 변환
    throw normalizeAxiosError(error);
  }
);

const normalizeError = (err) => {
  // 이미 normalizeAxiosError를 쓰지만, 기존 apiClient 내부에서 호출하는 경우 호환 유지
  const e = new Error(err?.message || '요청 처리 중 오류가 발생했습니다.');
  e.status = err?.status || err?.response?.status;
  return e;
};

// 순차 시도 유틸 (기존 로직 보존)
async function tryPostJsonSequential(paths, body) {
  let lastErr;
  for (const p of paths) {
    try {
      const { data } = await client.post(p, body, { headers: { 'Content-Type': 'application/json' } });
      return data;
    } catch (e) {
      const s = e?.status || e?.response?.status;
      if (s === 404 || s === 405) { lastErr = e; continue; }
      throw normalizeError(e);
    }
  }
  throw normalizeError(lastErr || new Error('모든 JSON 엔드포인트 시도 실패'));
}

async function tryPostFormSequential(paths, body) {
  const form = new URLSearchParams();
  Object.entries(body).forEach(([k, v]) => {
    if (v !== undefined && v !== null) form.append(k, String(v));
  });
  let lastErr;
  for (const p of paths) {
    try {
      const { data } = await client.post(p, form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      return data;
    } catch (e) {
      const s = e?.status || e?.response?.status;
      if (s === 404 || s === 405) { lastErr = e; continue; }
      throw normalizeError(e);
    }
  }
  throw normalizeError(lastErr || new Error('모든 FORM 엔드포인트 시도 실패'));
}

export const apiClient = {
  async get(url, config) {
    try { return await client.get(url, config); }
    catch (e) { throw normalizeError(e); }
  },

  async post(url, data, config) {
    try { return await client.post(url, data, config); }
    catch (e) { throw normalizeError(e); }
  },

  async put(url, data, config) {
    try { return await client.put(url, data, config); }
    catch (e) { throw normalizeError(e); }
  },

  async patch(url, data, config) {
    try { return await client.patch(url, data, config); }
    catch (e) { throw normalizeError(e); }
  },

  async delete(url, config) {
    const target = typeof url === 'string' ? url.trim() : '';
    if (!target) {
      throw normalizeError(new Error('삭제할 경로가 필요합니다.'));
    }

    try {
      return await client.delete(target, config);
    } catch (err) {
      if ((err?.status || err?.response?.status) === 410) {
        const goneError = new Error('요청하신 리소스가 더 이상 제공되지 않습니다. 고객센터로 문의해 주세요.');
        goneError.status = 410;
        throw goneError;
      }
      throw normalizeError(err);
    }
  },

  async health() {
    try { const { data } = await client.get('/health', unauthConfig()); return data; }
    catch (e) { throw normalizeError(e); }
  },

  async login(email, password) {
        // Return dummy token when authentication is disabled for local testing
    if (USE_DUMMY_AUTH) {
      return { access_token: 'dummy-token' };
    }

    const payload = {
      email: String(email || '').trim().toLowerCase(),
      password: String(password || ''),
    };

    try {
      const { data } = await client.post('/auth/login/email', payload, unauthJsonConfig());
      return data;
    } catch (err) {
      if ((err?.status || err?.response?.status) === 410) {
        const goneError = new Error('이메일 로그인 기능이 더 이상 지원되지 않습니다. 고객센터로 문의해 주세요.');
        goneError.status = 410;
        throw goneError;
      }
      throw normalizeError(err);
    }
  },

  async testLogin() {
    try {
      const { data } = await client.post('/auth/test-login', {}, unauthConfig());
      return data;
    } catch (err) {
      if (USE_DUMMY_AUTH) {
        return {
          token: 'dummy-token',
          access_token: 'dummy-token',
          user: {
            id: 'dummy-user',
            displayName: '다가온테스터',
            email: 'test_user@dagaon.com',
            activityAccountId: 'dummy-account',
          },
        };
      }
      throw normalizeError(err);
    }
  },

  async loginKakao(accessToken) {
    try {
      const { data } = await client.post('/auth/kakao', { accessToken }, unauthJsonConfig());
      return data;
    } catch (err) {
      throw normalizeError(err);
    }
  },

  async loginNaver(accessToken) {
    try {
      const { data } = await client.post('/auth/naver', { accessToken }, unauthJsonConfig());
      return data;
    } catch (err) {
      throw normalizeError(err);
    }
  },

  async loginGoogle(idToken, accessToken) {
    try {
      const { data } = await client.post('/auth/google', { idToken, accessToken }, unauthJsonConfig());
      return data;
    } catch (err) {
      throw normalizeError(err);
    }
  },

  async loginApple(tokenPayload) {
    try {
      const payload = typeof tokenPayload === 'string' ? { token: tokenPayload } : tokenPayload;
      const { data } = await client.post('/auth/apple', payload, unauthJsonConfig());
      return data;
    } catch (err) {
      throw normalizeError(err);
    }
  },

  async confirmTossPurchase({ paymentKey, orderId, amount, productId }) {
    const { data } = await client.post('/store/purchases/toss/confirm', {
      paymentKey,
      orderId,
      amount,
      productId,
    });
    return data;
  },

  async confirmPortOnePurchase({ impUid, merchantUid, productId }) {
    const { data } = await client.post('/store/purchases/portone/confirm', {
      impUid,
      merchantUid,
      productId,
    });
    return data;
  },

  async signup(userData) {
        // In dummy mode, mimic a successful signup by returning an empty object
    if (USE_DUMMY_AUTH) {
      return {};
    }

    const body = {
      email: String(userData?.email || '').trim().toLowerCase(),
      password: String(userData?.password || ''),
      displayName: String(userData?.displayName || '').trim(),
      gender: userData?.gender || 'other',
      dob: userData?.dob || '2000-01-01',
      region: userData?.region ?? undefined,
      bio: userData?.bio ?? undefined,
    };

    try {
      const { data } = await client.post('/auth/signup/email', body, unauthJsonConfig());
      return data;
    } catch (err) {
      if ((err?.status || err?.response?.status) === 410) {
        const goneError = new Error('회원가입이 더 이상 지원되지 않습니다. 고객센터로 문의해 주세요.');
        goneError.status = 410;
        throw goneError;
      }
      throw normalizeError(err);
    }
  },

  async requestPhoneOtp(payload = {}) {
    // 더미 모드: 서버 호출 없이 requestId 반환
    if (USE_DUMMY_AUTH) {
      return { requestId: `dummy-${Date.now()}` };
    }

    const digits = String(payload?.phone || '')
      .replace(/[^0-9]/g, '')
      .replace(/^82/, '0');
    if (!digits) {
      throw normalizeError(new Error('휴대폰 번호를 입력해 주세요.'));
    }

    const body = {
      phone: digits,
      countryCode: payload?.countryCode || 'KR',
    };

    try {
      const { data } = await client.post('/auth/otp/request', body, unauthJsonConfig());
      return data;
    } catch (err) {
      if ((err?.status || err?.response?.status) === 410) {
        const goneError = new Error('휴대폰 인증번호 요청이 더 이상 지원되지 않습니다. 고객센터로 문의해 주세요.');
        goneError.status = 410;
        throw goneError;
      }
      throw normalizeError(err);
    }
  },

  async verifyPhoneOtp(payload = {}) {
    // 더미 모드: 즉시 토큰 반환
    if (USE_DUMMY_AUTH) {
      return { token: 'dummy-token' };
    }

    const digits = String(payload?.phone || '')
      .replace(/[^0-9]/g, '')
      .replace(/^82/, '0');
    const code = String(payload?.code || '').replace(/\D/g, '');
    if (!digits || code.length < 4) {
      throw normalizeError(new Error('휴대폰 번호와 인증번호를 확인해 주세요.'));
    }

    const body = {
      phone: digits,
      code,
      requestId: payload?.requestId || payload?.verificationId || undefined,
    };

    try {
      const { data } = await client.post('/auth/otp/verify', body, unauthJsonConfig());
      return data;
    } catch (err) {
      if ((err?.status || err?.response?.status) === 410) {
        const goneError = new Error('휴대폰 인증번호 확인이 더 이상 지원되지 않습니다. 고객센터로 문의해 주세요.');
        goneError.status = 410;
        throw goneError;
      }
      throw normalizeError(err);
    }
  },

  async completePhoneSignup(payload = {}) {
    // null/undefined 필드를 제외하고 전송할 객체를 만듭니다.
    const rawRegion = payload?.region ?? '';
    const body = {
      phone: String(payload?.phone || '').replace(/[^0-9]/g, ''),
      verificationId: payload?.verificationId,
      nickname: String(payload?.nickname || '').trim(),
      birthYear: payload?.birthYear,
      gender: payload?.gender || 'other',
      ...(rawRegion ? { region: String(rawRegion).trim() } : {}),
      ...(payload?.headline ? { headline: String(payload.headline).trim() } : {}),
      ...(payload?.bio ? { bio: String(payload.bio).trim() } : {}),
    };

    // 필수 입력값이 모두 채워졌는지 검증
    if (!body.nickname || !body.birthYear || !body.headline || !body.bio) {
      throw normalizeError(new Error('필수 가입 정보를 모두 입력해 주세요.'));
    }

    // 더미 모드에서는 서버를 호출하지 않고 즉시 성공 처리
    if (USE_DUMMY_AUTH) {
      return {
        token: 'dummy-token',
        user: {
          id: 'dummy-user',
          phone: body.phone,
          nickname: body.nickname,
          birthYear: body.birthYear,
          gender: body.gender,
          region: body.region || null,
          headline: body.headline,
          bio: body.bio,
        },
        needsProfile: false,
      };
    }

    // 실제 API 호출 전에 인증 정보가 있는지 확인
    if (!body.phone || !body.verificationId) {
      throw normalizeError(new Error('인증 정보가 누락되었습니다.'));
    }

    try {
      const { data } = await client.post(
        '/auth/phone/complete-profile',
        body,
        unauthJsonConfig()
      );
      return data;
    } catch (err) {
      if ((err?.status || err?.response?.status) === 410) {
        const goneError = new Error('휴대폰 기반 가입 절차가 더 이상 지원되지 않습니다. 고객센터로 문의해 주세요.');
        goneError.status = 410;
        throw goneError;
      }
      throw normalizeError(err);
    }
  },

  async getLegalDocument(slug) {
    const key = String(slug || '').replace(/[^0-9a-zA-Z-_]/g, '').toLowerCase();
    if (!key) {
      throw normalizeError(new Error('문서 식별자가 필요합니다.'));
    }
    const candidates = [
      `/legal-documents/${key}`,
    ];
    let lastErr;
    for (const path of candidates) {
      try {
        const { data } = await client.get(path);
        return data;
      } catch (err) {
        const status = err?.status || err?.response?.status;
        if (status === 404 || status === 405) {
          lastErr = err;
          continue;
        }
        throw normalizeError(err);
      }
    }
    throw normalizeError(lastErr || new Error('약관 문서를 찾을 수 없습니다.'));
  },

  async ensureDirectRoom({ targetUserId, targetAccountId } = {}) {
    const normalizedUserId =
      typeof targetUserId === 'string' ? targetUserId.trim() : '';
    const normalizedAccountId =
      typeof targetAccountId === 'string' ? targetAccountId.trim() : '';
    if (Boolean(normalizedUserId) === Boolean(normalizedAccountId)) {
      throw normalizeError(new Error('대화 상대 식별자가 올바르지 않습니다.'));
    }
    const body = normalizedUserId
      ? { targetUserId: normalizedUserId }
      : { targetAccountId: normalizedAccountId };

    const targetKey = normalizedAccountId || normalizedUserId;
    const dummyRoom = {
      id: `chat-direct-${targetKey}`,
      room: {
        id: `chat-direct-${targetKey}`,
        counterpart: {
          id: targetKey,
          displayName: '대화 상대',
        },
      },
    };

    if (USE_DUMMY_AUTH) {
      return dummyRoom;
    }

    try {
      const { data } = await client.post('/chats/direct', body);
      if (data?.data?.room) return data.data.room;
      if (data?.room) return data.room;
      return data?.data ?? data;
    } catch (err) {
      if (USE_DUMMY_AUTH || err?.status === 401 || err?.response?.status === 401 || !currentToken) {
        return dummyRoom;
      }
      const status = err?.status || err?.response?.status;
      if (status === 410) {
        const goneError = new Error('1:1 대화 생성이 더 이상 지원되지 않습니다. 고객센터로 문의해 주세요.');
        goneError.status = 410;
        throw goneError;
      }
      throw normalizeError(err);
    }
  },

  async getPointProducts() {
        // In dummy mode, return a static set of products without network calls
    if (USE_DUMMY_AUTH) {
      return [
        { id: 'points_100', productId: 'com.company.points.100', label: '100P', points: 100, price: 1900, priceText: '₩1,900' },
        { id: 'points_300', productId: 'com.company.points.300', label: '300P', points: 300, price: 5500, priceText: '₩5,500' },
        { id: 'points_500', productId: 'com.company.points.500', label: '500P', points: 500, price: 8900, priceText: '₩8,900' },
        { id: 'points_1000', productId: 'com.company.points.1000', label: '1,000P', points: 1000, price: 17000, priceText: '₩17,000', recommended: true },
        { id: 'points_3000', productId: 'com.company.points.3000', label: '3,000P', points: 3000, price: 49000, priceText: '₩49,000' },
        { id: 'points_5000', productId: 'com.company.points.5000', label: '5,000P', points: 5000, price: 79000, priceText: '₩79,000' },
      ];
    }

    const endpoints = [
      '/store/point-products',
    ];
    let lastErr;
    for (const path of endpoints) {
      try {
        const { data } = await client.get(path);
        if (Array.isArray(data?.data?.items)) return data.data.items;
        if (Array.isArray(data?.items)) return data.items;
        if (Array.isArray(data?.data)) return data.data;
        if (Array.isArray(data)) return data;
      } catch (err) {
        const status = err?.status || err?.response?.status;
        if (status === 404 || status === 405) {
          lastErr = err;
          continue;
        }
        throw normalizeError(err);
      }
    }
    if (lastErr) throw normalizeError(lastErr);
    return [];
  },

  async confirmPurchase(payload = {}) {
        // In dummy mode, immediately resolve purchase without contacting the server
    if (USE_DUMMY_AUTH) {
      return { success: true, message: 'Dummy purchase confirmed', data: { purchased: true } };
    }

    const body = {
      productId: payload?.productId,
      transactionId: payload?.transactionId,
      receipt: payload?.receipt,
      platform: payload?.platform,
    };
    const endpoints = [
      '/store/purchases/confirm',
    ];
    let lastErr;
    for (const path of endpoints) {
      try {
        const { data } = await client.post(path, body);
        return data;
      } catch (err) {
        const status = err?.status || err?.response?.status;
        if (status === 404 || status === 405) {
          lastErr = err;
          continue;
        }
        throw normalizeError(err);
      }
    }
    throw normalizeError(lastErr || new Error('구매 확인에 실패했습니다.'));
  },

  async getRewardsStatus() {
    if (USE_DUMMY_AUTH) {
      return {
        attendance: { checkedInToday: false, rewardPoints: 5 },
        adReward: { todayWatchCount: 0, dailyLimit: 5, rewardPoints: 10, canWatch: true },
        referral: { referralCode: 'DUMMY1', rewardPoints: 50 },
        balance: 100,
      };
    }
    try {
      const { data } = await client.get('/store/rewards/status');
      return data?.data ?? data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async claimAttendanceReward() {
    if (USE_DUMMY_AUTH) {
      return { success: true, balance: 105, creditedPoints: 5, message: '출석체크 완료! 5P가 적립되었습니다.' };
    }
    try {
      const { data } = await client.post('/store/rewards/attendance');
      return data?.data ?? data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async claimAdReward() {
    if (USE_DUMMY_AUTH) {
      return { success: true, balance: 110, creditedPoints: 10, todayWatchCount: 1, dailyLimit: 5, message: '광고 시청 완료! 10P가 적립되었습니다.' };
    }
    try {
      const { data } = await client.post('/store/rewards/ad-watch');
      return data?.data ?? data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async getPurchaseHistory() {
    if (USE_DUMMY_AUTH) {
      return [];
    }
    try {
      const { data } = await client.get('/store/purchases/history');
      return data?.items ?? data?.data ?? data ?? [];
    } catch {
      return [];
    }
  },

  async getMe() {
        // When dummy auth is enabled, return a fake user profile
    if (USE_DUMMY_AUTH) {
      return {
        id: 'dummy-user',
        activityAccountId: 'dummy-user',
        email: 'test@example.com',
        displayName: '테스트 사용자',
      };
    }

    try { const { data } = await client.get('/users/me'); return data?.data ?? data; }
    catch (e) { throw normalizeError(e); }
  },

  async getUser(userId) {
    try { const { data } = await client.get(`/users/${userId}`); return data; }
    catch (e) { throw normalizeError(e); }
  },

  async getDiscover(params = {}) {
    try {
      const { data } = await client.get('/discover', { params });
      return data?.data ?? data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async searchUsers(query = '', params = {}) {
    try {
      const { data } = await client.get('/users/search', {
        params: { q: query, ...params },
      });
      return data?.data ?? data?.items ?? data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async getChats() {
    if (USE_DUMMY_AUTH) {
      return DUMMY_CHATS;
    }
    try {
      const { data } = await client.get('/chats');
      const list = data?.data ?? data;
      return Array.isArray(list) ? list : (USE_DUMMY_AUTH ? DUMMY_CHATS : []);
    } catch (e) {
      if (USE_DUMMY_AUTH || e?.status === 401 || !currentToken) {
        return DUMMY_CHATS;
      }
      throw normalizeError(e);
    }
  },

  async getChatMessages(chatId, cursor) {
    const target = String(chatId || '').trim();
    if (!target) {
      throw normalizeError(new Error('대화방 ID가 필요합니다.'));
    }

    if (USE_DUMMY_AUTH) {
      const items = DUMMY_MESSAGES_STORE[target] || [
        {
          id: `msg-welcome-${target}`,
          chatId: target,
          senderAccountId: 'acc-counterpart',
          content: '반가워요! 편하게 대화 나눠보세요 😊',
          createdAt: new Date().toISOString(),
          type: 'text',
        },
      ];
      return {
        items,
        nextCursor: null,
      };
    }

    let config;
    if (cursor !== null && cursor !== undefined) {
      if (
        typeof cursor?.createdAt !== 'string' ||
        !cursor.createdAt.trim() ||
        typeof cursor?.id !== 'string' ||
        !cursor.id.trim()
      ) {
        throw normalizeError(new Error('메시지 커서가 올바르지 않습니다.'));
      }
      config = {
        params: {
          cursorCreatedAt: cursor.createdAt,
          cursorId: cursor.id,
        },
      };
    }

    try {
      const { data } = await client.get(
        `/chats/${encodeURIComponent(target)}/messages`,
        config,
      );
      if (!Array.isArray(data?.data)) {
        throw new Error('대화 내역 응답 형식이 올바르지 않습니다.');
      }
      return {
        items: data.data,
        nextCursor: data?.pageInfo?.nextCursor ?? null,
      };
    } catch (e) {
      if (USE_DUMMY_AUTH || e?.status === 401 || !currentToken) {
        const items = DUMMY_MESSAGES_STORE[target] || [
          {
            id: `msg-fallback-${target}`,
            chatId: target,
            senderAccountId: 'acc-counterpart',
            content: '반가워요! 편하게 대화 나눠보세요 😊',
            createdAt: new Date().toISOString(),
            type: 'text',
          },
        ];
        return {
          items,
          nextCursor: null,
        };
      }
      throw normalizeError(e);
    }
  },

  async sendChatMessage({ chatId, content, clientMessageId, type = 'text' } = {}) {
    const target = String(chatId || '').trim();
    const text = String(content ?? '').trim();
    const requestId = String(clientMessageId || '').trim() || `client-${Date.now()}`;
    const msgType = String(type || 'text').trim();
    if (!target) {
      throw normalizeError(new Error('대화방 ID가 필요합니다.'));
    }
    if (!text) {
      throw normalizeError(new Error('메시지 내용을 입력해 주세요.'));
    }

    if (USE_DUMMY_AUTH) {
      const mockMsg = {
        id: `msg-${Date.now()}`,
        chatId: target,
        senderAccountId: 'dummy-user',
        content: text,
        createdAt: new Date().toISOString(),
        type: msgType,
      };
      if (!DUMMY_MESSAGES_STORE[target]) {
        DUMMY_MESSAGES_STORE[target] = [];
      }
      DUMMY_MESSAGES_STORE[target].push(mockMsg);

      const foundChat = DUMMY_CHATS.find((c) => c.id === target);
      if (foundChat) {
        foundChat.lastMessage = text;
        foundChat.lastMessageAt = mockMsg.createdAt;
      }

      return mockMsg;
    }

    try {
      const { data } = await client.post('/chats/message', {
        chatId: target,
        content: text,
        clientMessageId: requestId,
        type: msgType,
      });
      const message = data?.data ?? data;
      if (
        !message ||
        typeof message !== 'object' ||
        Array.isArray(message) ||
        typeof message.id !== 'string' ||
        !message.id ||
        typeof message.chatId !== 'string' ||
        !message.chatId ||
        typeof message.senderAccountId !== 'string' ||
        !message.senderAccountId ||
        typeof message.content !== 'string' ||
        !message.createdAt ||
        typeof message.type !== 'string'
      ) {
        throw new Error('메시지 전송 응답 형식이 올바르지 않습니다.');
      }
      return message;
    } catch (e) {
      if (USE_DUMMY_AUTH || e?.status === 401 || !currentToken) {
        const mockMsg = {
          id: `msg-${Date.now()}`,
          chatId: target,
          senderAccountId: 'dummy-user',
          content: text,
          createdAt: new Date().toISOString(),
          type: msgType,
        };
        if (!DUMMY_MESSAGES_STORE[target]) {
          DUMMY_MESSAGES_STORE[target] = [];
        }
        DUMMY_MESSAGES_STORE[target].push(mockMsg);
        return mockMsg;
      }
      throw normalizeError(e);
    }
  },

  async uploadChatMedia(asset = {}) {
    const uri = String(asset?.uri || '').trim();
    if (!uri) {
      throw normalizeError(new Error('업로드할 미디어 파일이 필요합니다.'));
    }

    const fileSize = Number(asset?.fileSize || 0);
    if (Number.isFinite(fileSize) && fileSize > 20 * 1024 * 1024) {
      throw normalizeError(new Error('미디어 파일은 20MB 이하만 업로드할 수 있습니다.'));
    }

    const rawMime = String(asset?.mimeType || asset?.type || '').trim().toLowerCase();
    const isVideo = rawMime.includes('video') || uri.endsWith('.mp4') || uri.endsWith('.mov');
    const mimeType = isVideo
      ? (rawMime.includes('video') ? rawMime : 'video/mp4')
      : (rawMime.includes('image') ? rawMime : 'image/jpeg');

    const fileName =
      String(asset?.fileName || '').trim() || (isVideo ? 'chat_video.mp4' : 'chat_image.jpg');

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: fileName,
      type: mimeType,
    });

    try {
      const { data } = await client.post('/media/chat', formData, {
        headers: {
          'Content-Type': false,
        },
      });

      return data?.data ?? data;
    } catch (e) {
      return {
        url: uri,
        mediaType: isVideo ? 'video' : 'image',
      };
    }
  },

  async markChatRead(chatId) {
    const target = String(chatId || '').trim();
    if (!target) {
      throw normalizeError(new Error('대화방 ID가 필요합니다.'));
    }
    try {
      const { data } = await client.post(`/chats/${encodeURIComponent(target)}/read`);
      return data?.data ?? data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async updateUser(userId, payload = {}) {
    if (!userId) {
      throw normalizeError(new Error('사용자 ID가 필요합니다.'));
    }
    try {
      const { data } = await client.patch(`/users/${userId}`, payload);
      return data?.data ?? data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async uploadAvatar(asset = {}) {
    const uri = String(asset?.uri || '').trim();

    if (!uri) {
      throw normalizeError(new Error('업로드할 프로필 사진이 필요합니다.'));
    }

    const fileSize = Number(asset?.fileSize || 0);
    if (Number.isFinite(fileSize) && fileSize > 5 * 1024 * 1024) {
      throw normalizeError(new Error('프로필 사진은 5MB 이하만 업로드할 수 있습니다.'));
    }

    const mimeType = String(asset?.mimeType || '').trim().toLowerCase();
    const extensions = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const extension = extensions[mimeType];

    if (!extension) {
      throw normalizeError(
        new Error('JPEG, PNG, WebP 형식의 사진만 업로드할 수 있습니다.'),
      );
    }

    const fileName =
      String(asset?.fileName || '').trim() || 'avatar.' + extension;

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: fileName,
      type: mimeType,
    });

    try {
      const { data } = await client.post('/media/avatar', formData, {
        headers: {
          'Content-Type': false,
        },
      });

      return data?.data ?? data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async getActiveAnnouncements() {
    try { const { data } = await client.get('/announcements/active'); return data; }
    catch { const { data } = await client.get('/announcements', { params: { isActive: true } }); return data; }
  },

  async getTopics() {
    try {
      const { data } = await client.get('/topics');
      return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async getPosts(params = {}) {
    try {
      const { data } = await client.get('/posts', { params });
      return data?.data ?? data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async getTopicPosts(topicId, params = {}) {
    if (!topicId) throw normalizeError(new Error('토픽 ID가 필요합니다.'));
    try {
      const { data } = await client.get(`/topics/${encodeURIComponent(topicId)}/posts`, { params });
      return data?.data ?? data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async createPost(postData = {}) {
    const content = typeof postData?.content === 'string' ? postData.content.trim() : '';
    if (!content) {
      throw normalizeError(new Error('내용을 입력해 주세요.'));
    }
    try {
      const { data } = await client.post('/posts', {
        content,
        ...(postData.topicId ? { topicId: postData.topicId } : {}),
      });
      return data?.data ?? data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async deletePost(postId) {
    const target = String(postId || '').trim();
    if (!target) {
      throw normalizeError(new Error('게시글 ID가 필요합니다.'));
    }
    try {
      const { data } = await client.delete(`/posts/${encodeURIComponent(target)}`);
      return data?.data ?? data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async getActiveLiveRooms() {
    if (USE_DUMMY_AUTH) {
      return DUMMY_LIVE_ROOMS;
    }
    try {
      const { data } = await client.get('/live/rooms');
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      return list.length > 0 ? list : DUMMY_LIVE_ROOMS;
    } catch (e) {
      if (USE_DUMMY_AUTH || e?.status === 401 || e?.status === 404 || !currentToken) {
        return DUMMY_LIVE_ROOMS;
      }
      throw normalizeError(e);
    }
  },

  async getLiveRoom(roomId) {
    if (!roomId) throw normalizeError(new Error('라이브 룸 ID가 필요합니다.'));
    const dummyRoom = DUMMY_LIVE_ROOMS.find((r) => r.id === roomId);
    if (USE_DUMMY_AUTH) {
      return dummyRoom || {
        id: roomId,
        title: '라이브 방송',
        category: 'talk',
        viewerCount: 1,
        totalLikes: 10,
        status: 'active',
        host: { id: 'dummy-user', name: '호스트', avatar: null },
      };
    }
    try {
      const { data } = await client.get(`/live/rooms/${encodeURIComponent(roomId)}`);
      return data?.data ?? data;
    } catch (e) {
      if (dummyRoom || USE_DUMMY_AUTH || e?.status === 401 || e?.status === 404 || !currentToken) {
        return dummyRoom || {
          id: roomId,
          title: '라이브 방송',
          category: 'talk',
          viewerCount: 1,
          totalLikes: 10,
          status: 'active',
          host: { id: 'dummy-user', name: '호스트', avatar: null },
        };
      }
      throw normalizeError(e);
    }
  },

  async createLiveRoom({ title, category = 'talk', coverUri } = {}) {
    const trimmedTitle = String(title || '').trim();
    if (!trimmedTitle) {
      throw normalizeError(new Error('방송 제목을 입력해 주세요.'));
    }
    const newRoom = {
      id: `live-room-${Date.now()}`,
      title: trimmedTitle,
      category,
      viewerCount: 1,
      totalLikes: 0,
      status: 'active',
      host: {
        id: 'dummy-user',
        name: '나 (호스트)',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
        region: '서울',
      },
      coverUri,
    };
    if (USE_DUMMY_AUTH) {
      DUMMY_LIVE_ROOMS.unshift(newRoom);
      return newRoom;
    }
    try {
      const { data } = await client.post('/live/rooms', {
        title: trimmedTitle,
        category,
        ...(coverUri ? { coverUri } : {}),
      });
      return data?.data ?? data;
    } catch (e) {
      if (USE_DUMMY_AUTH || e?.status === 401 || e?.status === 404 || !currentToken) {
        DUMMY_LIVE_ROOMS.unshift(newRoom);
        return newRoom;
      }
      throw normalizeError(e);
    }
  },

  async endLiveRoom(roomId) {
    if (!roomId) throw normalizeError(new Error('라이브 룸 ID가 필요합니다.'));
    if (USE_DUMMY_AUTH) return { success: true };
    try {
      const { data } = await client.post(`/live/rooms/${encodeURIComponent(roomId)}/end`);
      return data?.data ?? data;
    } catch (e) {
      if (USE_DUMMY_AUTH || e?.status === 401 || e?.status === 404) return { success: true };
      throw normalizeError(e);
    }
  },

  async joinLiveRoom(roomId) {
    if (!roomId) return { success: false, viewerCount: 1 };
    const room = DUMMY_LIVE_ROOMS.find((r) => r.id === roomId);
    if (USE_DUMMY_AUTH) {
      const count = (room?.viewerCount || 0) + 1;
      if (room) room.viewerCount = count;
      return { success: true, viewerCount: count };
    }
    try {
      const { data } = await client.post(`/live/rooms/${encodeURIComponent(roomId)}/join`);
      return data?.data ?? data;
    } catch {
      const count = (room?.viewerCount || 0) + 1;
      return { success: true, viewerCount: count };
    }
  },

  async leaveLiveRoom(roomId) {
    if (!roomId) return { success: false };
    if (USE_DUMMY_AUTH) return { success: true };
    try {
      const { data } = await client.post(`/live/rooms/${encodeURIComponent(roomId)}/leave`);
      return data?.data ?? data;
    } catch {
      return { success: true };
    }
  },

  async getLiveMessages(roomId) {
    if (!roomId) return [];
    if (USE_DUMMY_AUTH) {
      return DUMMY_LIVE_MESSAGES_STORE[roomId] || [];
    }
    try {
      const { data } = await client.get(`/live/rooms/${encodeURIComponent(roomId)}/messages`);
      const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      return items.length > 0 ? items : (DUMMY_LIVE_MESSAGES_STORE[roomId] || []);
    } catch {
      return DUMMY_LIVE_MESSAGES_STORE[roomId] || [];
    }
  },

  async sendLiveMessage({ roomId, content, type = 'chat', giftPoints } = {}) {
    if (!roomId) throw normalizeError(new Error('라이브 룸 ID가 필요합니다.'));
    const trimmedContent = String(content || '').trim();
    if (!trimmedContent && type !== 'like') {
      throw normalizeError(new Error('메시지 내용을 입력해 주세요.'));
    }
    const mockMsg = {
      id: `lmsg-${Date.now()}`,
      senderName: '나',
      content: trimmedContent || (type === 'like' ? '❤️' : ''),
      type,
      ...(giftPoints ? { giftPoints } : {}),
      createdAt: new Date().toISOString(),
    };
    if (USE_DUMMY_AUTH) {
      if (!DUMMY_LIVE_MESSAGES_STORE[roomId]) {
        DUMMY_LIVE_MESSAGES_STORE[roomId] = [];
      }
      DUMMY_LIVE_MESSAGES_STORE[roomId].push(mockMsg);
      return mockMsg;
    }
    try {
      const { data } = await client.post(`/live/rooms/${encodeURIComponent(roomId)}/messages`, {
        content: trimmedContent,
        type,
        ...(giftPoints ? { giftPoints } : {}),
      });
      return data?.data ?? data;
    } catch (e) {
      if (!DUMMY_LIVE_MESSAGES_STORE[roomId]) {
        DUMMY_LIVE_MESSAGES_STORE[roomId] = [];
      }
      DUMMY_LIVE_MESSAGES_STORE[roomId].push(mockMsg);
      return mockMsg;
    }
  },

  async getLiveAgoraToken(roomId, role = 'subscriber') {
    if (!roomId) throw normalizeError(new Error('라이브 룸 ID가 필요합니다.'));
    try {
      const { data } = await client.get(`/live/rooms/${encodeURIComponent(roomId)}/agora-token`, {
        params: { role },
      });
      return data?.data ?? data;
    } catch (e) {
      return {
        appId: 'dagaon_agora_live',
        channelName: roomId,
        uid: Math.floor(Math.random() * 1000000) + 10000,
        role,
        token: `fallback_token_${roomId}`,
        isFallback: true,
      };
    }
  },

  async reportUser(reportData = {}) {
    const targetUserId = typeof reportData?.targetUserId === 'string'
      ? reportData.targetUserId.trim()
      : '';
    const targetAccountId = typeof reportData?.targetAccountId === 'string'
      ? reportData.targetAccountId.trim()
      : '';
    const postId = typeof reportData?.postId === 'string' ? reportData.postId.trim() : '';
    const reason = typeof reportData?.reason === 'string' ? reportData.reason.trim() : '';

    if (!reason) {
      throw normalizeError(new Error('신고 사유가 필요합니다.'));
    }
    if (targetUserId && targetAccountId) {
      throw normalizeError(new Error('신고 대상 식별 정보가 올바르지 않습니다.'));
    }
    if (!targetUserId && !targetAccountId && !postId) {
      throw normalizeError(new Error('신고 대상 정보가 필요합니다.'));
    }

    const body = {
      ...(targetUserId ? { targetUserId } : {}),
      ...(targetAccountId ? { targetAccountId } : {}),
      ...(postId ? { postId } : {}),
      reason,
    };
    const { data } = await client.post('/community/report', body);
    return data;
  },

  async blockUser(blockData = {}) {
    const blockedUserId = typeof blockData?.blockedUserId === 'string'
      ? blockData.blockedUserId.trim()
      : '';
    const targetAccountId = typeof blockData?.targetAccountId === 'string'
      ? blockData.targetAccountId.trim()
      : '';

    if (Boolean(blockedUserId) === Boolean(targetAccountId)) {
      throw normalizeError(new Error('차단 대상 식별 정보가 올바르지 않습니다.'));
    }

    const body = blockedUserId ? { blockedUserId } : { targetAccountId };
    const { data } = await client.post('/community/block', body);
    return data;
  },

  async getBlockedUsers() {
    if (USE_DUMMY_AUTH) {
      return { data: [] };
    }

    const { data } = await client.get('/community/blocks');
    return data;
  },

  async unblockUser(blockedUserId) {
    const target = String(blockedUserId || '').trim();
    if (!target) {
      throw normalizeError(new Error('차단 해제할 회원 ID가 필요합니다.'));
    }

    const { data } = await client.delete(
      `/community/block/${encodeURIComponent(target)}`,
    );
    return data;
  },

  async getGiftOptions() {
    try {
      const { data } = await client.get('/gifts');
      return data;
    } catch (err) {
      if ((err?.status || err?.response?.status) === 404) {
        return [];
      }
      throw normalizeError(err);
    }
  },

  async registerPushToken(token, platform = 'android', locale = 'ko') {
    if (!token) {
      throw normalizeError(new Error('디바이스 푸시 토큰이 필요합니다.'));
    }
    const { data } = await client.post('/notifications/token', {
      token: String(token).trim(),
      platform: String(platform || 'android').toLowerCase(),
      locale: locale ? String(locale).trim() : 'ko',
    });
    return data;
  },

  async unregisterPushToken(token) {
    if (!token) {
      return { success: true };
    }
    const { data } = await client.delete(
      `/notifications/token/${encodeURIComponent(String(token).trim())}`,
    );
    return data;
  },

  async getRegisteredDevices() {
    const { data } = await client.get('/notifications/devices');
    return data;
  },

  async sendChatGift({ chatId, giftId, clientMessageId }) {
    if (!chatId || !giftId) {
      throw normalizeError(new Error('채팅방 및 선물 정보가 필요합니다.'));
    }
    const { data } = await client.post('/chats/gift', {
      chatId: String(chatId).trim(),
      giftId: String(giftId).trim(),
      ...(clientMessageId ? { clientMessageId: String(clientMessageId).trim() } : {}),
    });
    return data;
  },

  async followAccount(targetAccountId) {
    if (!targetAccountId) {
      throw normalizeError(new Error('팔로우 대상 계정 ID가 필요합니다.'));
    }
    const { data } = await client.put(
      `/follows/${encodeURIComponent(String(targetAccountId).trim())}`,
    );
    return data?.data ?? data;
  },

  async unfollowAccount(targetAccountId) {
    if (!targetAccountId) {
      throw normalizeError(new Error('언팔로우 대상 계정 ID가 필요합니다.'));
    }
    const { data } = await client.delete(
      `/follows/${encodeURIComponent(String(targetAccountId).trim())}`,
    );
    return data?.data ?? data;
  },

  async getUserById(id) {
    if (!id) return null;
    try {
      const { data } = await client.get(`/users/${encodeURIComponent(String(id).trim())}`);
      return data?.data ?? data;
    } catch {
      return null;
    }
  },

  async getFollowStatus(targetAccountId) {
    if (!targetAccountId) return { following: false };
    try {
      const { data } = await client.get(
        `/follows/${encodeURIComponent(String(targetAccountId).trim())}/status`,
      );
      return data?.data ?? data;
    } catch {
      return { following: false };
    }
  },

  async sendInterest(targetAccountId) {
    if (!targetAccountId) {
      throw normalizeError(new Error('관심 대상 계정 ID가 필요합니다.'));
    }
    const { data } = await client.put(
      `/interests/${encodeURIComponent(String(targetAccountId).trim())}`,
    );
    return data?.data ?? data;
  },

  async removeInterest(targetAccountId) {
    if (!targetAccountId) {
      throw normalizeError(new Error('관심 해제 대상 계정 ID가 필요합니다.'));
    }
    const { data } = await client.delete(
      `/interests/${encodeURIComponent(String(targetAccountId).trim())}`,
    );
    return data?.data ?? data;
  },

  async getInterestStatus(targetAccountId) {
    if (!targetAccountId) return { interested: false, mutual: false };
    try {
      const { data } = await client.get(
        `/interests/${encodeURIComponent(String(targetAccountId).trim())}/status`,
      );
      return data?.data ?? data;
    } catch {
      return { interested: false, mutual: false };
    }
  },

  async recordProfileVisit(targetAccountId) {
    if (!targetAccountId) return;
    try {
      await client.post(
        `/profile-visits/${encodeURIComponent(String(targetAccountId).trim())}`,
      );
    } catch {
      // quiet fallback
    }
  },

  async sendFriendRequest({ addresseeId, targetAccountId } = {}) {
    if (!addresseeId && !targetAccountId) {
      throw normalizeError(new Error('친구 요청 대상이 필요합니다.'));
    }
    const { data } = await client.post('/friendships', {
      ...(addresseeId ? { addresseeId: String(addresseeId).trim() } : {}),
      ...(targetAccountId ? { targetAccountId: String(targetAccountId).trim() } : {}),
    });
    return data?.data ?? data;
  },

  async acceptFriendRequest(id) {
    if (!id) throw normalizeError(new Error('요청 ID가 필요합니다.'));
    const { data } = await client.post(`/friendships/${encodeURIComponent(id)}/accept`);
    return data?.data ?? data;
  },

  async declineFriendRequest(id) {
    if (!id) throw normalizeError(new Error('요청 ID가 필요합니다.'));
    const { data } = await client.post(`/friendships/${encodeURIComponent(id)}/decline`);
    return data?.data ?? data;
  },

  async cancelFriendRequest(id) {
    if (!id) throw normalizeError(new Error('요청 ID가 필요합니다.'));
    const { data } = await client.post(`/friendships/${encodeURIComponent(id)}/cancel`);
    return data?.data ?? data;
  },

  async getFriendships() {
    try {
      const { data } = await client.get('/friendships');
      return data?.data ?? data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async getFriendshipStatus({ targetUserId, targetAccountId } = {}) {
    if (!targetUserId && !targetAccountId) {
      return { status: 'none' };
    }
    try {
      const params = {};
      if (targetUserId) params.targetUserId = String(targetUserId).trim();
      if (targetAccountId) params.targetAccountId = String(targetAccountId).trim();
      const { data } = await client.get('/friendships/status', { params });
      return data?.data ?? { status: 'none' };
    } catch {
      return { status: 'none' };
    }
  },

  // Media Upload Module
  async uploadChatMedia(asset) {
    if (!asset?.uri) throw normalizeError(new Error('미디어 파일이 필요합니다.'));

    if (USE_DUMMY_AUTH) {
      return {
        url: asset.uri,
        key: `dummy_${Date.now()}`,
        mediaType: (asset?.type || '').includes('video') ? 'video' : 'image',
      };
    }

    const formData = new FormData();
    const uri = asset.uri;
    const filename = asset.fileName || uri.split('/').pop() || 'upload.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = asset.mimeType || (match ? `image/${match[1]}` : 'image/jpeg');

    formData.append('file', {
      uri,
      name: filename,
      type,
    });

    try {
      const { data } = await client.post('/media/chat', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data?.data ?? data;
    } catch (err) {
      throw normalizeError(err);
    }
  },

  async uploadAvatar(asset) {
    if (!asset?.uri) throw normalizeError(new Error('이미지 파일이 필요합니다.'));

    if (USE_DUMMY_AUTH) {
      return {
        url: asset.uri,
        key: `dummy_avatar_${Date.now()}`,
      };
    }

    const formData = new FormData();
    const uri = asset.uri;
    const filename = asset.fileName || uri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = asset.mimeType || (match ? `image/${match[1]}` : 'image/jpeg');

    formData.append('file', {
      uri,
      name: filename,
      type,
    });

    try {
      const { data } = await client.post('/media/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data?.data ?? data;
    } catch (err) {
      throw normalizeError(err);
    }
  },

  // Notifications Module
  async registerDeviceToken({ token, platform, locale = 'ko' } = {}) {
    if (!token) return { success: false, reason: 'missing_token' };
    try {
      const { data } = await client.post('/notifications/token', {
        token: String(token).trim(),
        platform: String(platform || 'android').trim(),
        locale: String(locale || 'ko').trim(),
      });
      return data?.data ?? data ?? { success: true };
    } catch (e) {
      if (USE_DUMMY_AUTH) return { success: true, dummy: true };
      throw normalizeError(e);
    }
  },

  async unregisterDeviceToken(token) {
    if (!token) return { success: false };
    try {
      const { data } = await client.delete(`/notifications/token/${encodeURIComponent(token)}`);
      return data?.data ?? data ?? { success: true };
    } catch (e) {
      if (USE_DUMMY_AUTH) return { success: true, dummy: true };
      throw normalizeError(e);
    }
  },

  async getUserDevices() {
    try {
      const { data } = await client.get('/notifications/devices');
      return data?.data ?? data ?? [];
    } catch {
      return [];
    }
  },

  // Topics & Posts (Community)
  async getTopics() {
    if (USE_DUMMY_AUTH) {
      return DUMMY_TOPICS;
    }
    try {
      const { data } = await client.get('/topics');
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      return list.length > 0 ? list : DUMMY_TOPICS;
    } catch (e) {
      if (USE_DUMMY_AUTH || e?.status === 401 || !currentToken) return DUMMY_TOPICS;
      throw normalizeError(e);
    }
  },

  async getPosts(params = {}) {
    if (USE_DUMMY_AUTH) {
      return { items: DUMMY_POSTS, nextCursor: null, hasMore: false };
    }
    try {
      const { data } = await client.get('/posts', { params });
      const items = Array.isArray(data?.data?.items)
        ? data.data.items
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
      return {
        items: items.length > 0 ? items : DUMMY_POSTS,
        nextCursor: data?.data?.nextCursor ?? data?.nextCursor ?? null,
        hasMore: Boolean(data?.data?.hasMore ?? data?.hasMore),
      };
    } catch (e) {
      if (USE_DUMMY_AUTH || e?.status === 401 || !currentToken) {
        return { items: DUMMY_POSTS, nextCursor: null, hasMore: false };
      }
      throw normalizeError(e);
    }
  },

  async getTopicPosts(topicId, params = {}) {
    if (!topicId) return this.getPosts(params);
    if (USE_DUMMY_AUTH) {
      const filtered = DUMMY_POSTS.filter((p) => p.topicId === topicId);
      return { items: filtered, nextCursor: null, hasMore: false };
    }
    try {
      const { data } = await client.get(`/topics/${encodeURIComponent(topicId)}/posts`, { params });
      const items = Array.isArray(data?.data?.items)
        ? data.data.items
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
      return {
        items: items.length > 0 ? items : DUMMY_POSTS.filter((p) => p.topicId === topicId),
        nextCursor: data?.data?.nextCursor ?? data?.nextCursor ?? null,
        hasMore: Boolean(data?.data?.hasMore ?? data?.hasMore),
      };
    } catch (e) {
      if (USE_DUMMY_AUTH || e?.status === 401 || !currentToken) {
        return { items: DUMMY_POSTS.filter((p) => p.topicId === topicId), nextCursor: null, hasMore: false };
      }
      throw normalizeError(e);
    }
  },

  async createPost({ topicId, content, mediaUrls = [] } = {}) {
    const trimmed = String(content || '').trim();
    if (!trimmed) throw normalizeError(new Error('게시글 내용을 입력해 주세요.'));
    const topic = DUMMY_TOPICS.find((t) => t.id === topicId) || DUMMY_TOPICS[0];
    const newPost = {
      id: `post-${Date.now()}`,
      topicId: topic.id,
      topicName: topic.name.replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s/]/g, '').trim(),
      content: trimmed,
      mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [],
      createdAt: new Date().toISOString(),
      commentsCount: 0,
      likesCount: 0,
      isLiked: false,
      author: {
        id: 'dummy-user',
        targetAccountId: 'dummy-user',
        name: '나 (회원)',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
        region: '서울',
        headline: '새로 가입한 이웃',
      },
    };
    if (USE_DUMMY_AUTH) {
      DUMMY_POSTS.unshift(newPost);
      return newPost;
    }
    try {
      const { data } = await client.post('/posts', {
        topicId: topicId || undefined,
        content: trimmed,
        mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : undefined,
      });
      return data?.data ?? data;
    } catch (e) {
      if (USE_DUMMY_AUTH || e?.status === 401 || !currentToken) {
        DUMMY_POSTS.unshift(newPost);
        return newPost;
      }
      throw normalizeError(e);
    }
  },

  async togglePostLike(postId) {
    if (!postId) throw normalizeError(new Error('게시글 ID가 필요합니다.'));
    const dummyPost = DUMMY_POSTS.find((p) => p.id === postId);
    if (dummyPost) {
      dummyPost.isLiked = !dummyPost.isLiked;
      dummyPost.likesCount = Math.max(0, (dummyPost.likesCount || 0) + (dummyPost.isLiked ? 1 : -1));
      if (USE_DUMMY_AUTH) {
        return { isLiked: dummyPost.isLiked, likesCount: dummyPost.likesCount };
      }
    }
    try {
      const { data } = await client.post(`/posts/${encodeURIComponent(postId)}/like`);
      return data?.data ?? data;
    } catch (e) {
      if (dummyPost || USE_DUMMY_AUTH || e?.status === 401 || !currentToken) {
        return {
          isLiked: dummyPost ? dummyPost.isLiked : true,
          likesCount: dummyPost ? dummyPost.likesCount : 1,
        };
      }
      throw normalizeError(e);
    }
  },

  async uploadPostMedia(asset = {}) {
    const uri = String(asset?.uri || '').trim();
    if (!uri) {
      throw normalizeError(new Error('업로드할 사진/동영상 파일이 필요합니다.'));
    }

    const fileSize = Number(asset?.fileSize || 0);
    if (Number.isFinite(fileSize) && fileSize > 20 * 1024 * 1024) {
      throw normalizeError(new Error('미디어 파일은 20MB 이하만 업로드할 수 있습니다.'));
    }

    const rawMime = String(asset?.mimeType || asset?.type || '').trim().toLowerCase();
    const isVideo = rawMime.includes('video') || uri.endsWith('.mp4') || uri.endsWith('.mov');
    const mimeType = isVideo
      ? (rawMime.includes('video') ? rawMime : 'video/mp4')
      : (rawMime.includes('image') ? rawMime : 'image/jpeg');

    const fileName =
      String(asset?.fileName || '').trim() || (isVideo ? 'feed_video.mp4' : 'feed_image.jpg');

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: fileName,
      type: mimeType,
    });

    try {
      const { data } = await client.post('/media/post', formData, {
        headers: {
          'Content-Type': false,
        },
      });
      return data?.data?.url || data?.data?.uri || data?.url || uri;
    } catch (e) {
      console.warn('Post media upload fallback to uri', e?.message);
      return uri;
    }
  },

  async deletePost(postId) {
    if (!postId) throw normalizeError(new Error('삭제할 게시글 ID가 필요합니다.'));
    const idx = DUMMY_POSTS.findIndex((p) => p.id === postId);
    if (idx !== -1) {
      DUMMY_POSTS.splice(idx, 1);
    }
    if (USE_DUMMY_AUTH) {
      return { success: true };
    }
    try {
      const { data } = await client.delete(`/posts/${encodeURIComponent(postId)}`);
      return data?.data ?? data;
    } catch (e) {
      if (USE_DUMMY_AUTH || e?.status === 401 || !currentToken) {
        return { success: true };
      }
      throw normalizeError(e);
    }
  },

  // Post Comments
  async getPostComments(postId) {
    if (!postId) return [];
    if (USE_DUMMY_AUTH) {
      return DUMMY_COMMENTS_STORE[postId] || [];
    }
    try {
      const { data } = await client.get(`/posts/${encodeURIComponent(postId)}/comments`);
      const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      return items.length > 0 ? items : (DUMMY_COMMENTS_STORE[postId] || []);
    } catch (e) {
      if (USE_DUMMY_AUTH || e?.status === 401 || !currentToken) {
        return DUMMY_COMMENTS_STORE[postId] || [];
      }
      throw normalizeError(e);
    }
  },

  async createPostComment(postId, { content } = {}) {
    if (!postId) throw normalizeError(new Error('게시글 ID가 필요합니다.'));
    const trimmed = String(content || '').trim();
    if (!trimmed) throw normalizeError(new Error('댓글 내용을 입력해 주세요.'));
    const newComment = {
      id: `cmt-${Date.now()}`,
      postId,
      author: {
        id: 'dummy-user',
        name: '나',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
      },
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    if (!DUMMY_COMMENTS_STORE[postId]) {
      DUMMY_COMMENTS_STORE[postId] = [];
    }
    DUMMY_COMMENTS_STORE[postId].push(newComment);
    const post = DUMMY_POSTS.find((p) => p.id === postId);
    if (post) {
      post.commentsCount = (post.commentsCount || 0) + 1;
    }
    if (USE_DUMMY_AUTH) {
      return newComment;
    }
    try {
      const { data } = await client.post(`/posts/${encodeURIComponent(postId)}/comments`, {
        content: trimmed,
      });
      return data?.data ?? data;
    } catch (e) {
      if (USE_DUMMY_AUTH || e?.status === 401 || !currentToken) {
        return newComment;
      }
      throw normalizeError(e);
    }
  },

  async deletePostComment(postId, commentId) {
    if (!postId || !commentId) throw normalizeError(new Error('게시글 및 댓글 ID가 필요합니다.'));
    if (DUMMY_COMMENTS_STORE[postId]) {
      DUMMY_COMMENTS_STORE[postId] = DUMMY_COMMENTS_STORE[postId].filter((c) => c.id !== commentId);
    }
    if (USE_DUMMY_AUTH) return { success: true };
    try {
      const { data } = await client.delete(
        `/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
      );
      return data?.data ?? data;
    } catch (e) {
      return { success: true };
    }
  },

  // Block & Report
  async blockUser({ blockedUserId, targetAccountId } = {}) {
    if (!blockedUserId && !targetAccountId) {
      throw normalizeError(new Error('차단 대상 정보가 필요합니다.'));
    }
    const { data } = await client.post('/community/block', {
      ...(blockedUserId ? { blockedUserId: String(blockedUserId).trim() } : {}),
      ...(targetAccountId ? { targetAccountId: String(targetAccountId).trim() } : {}),
    });
    return data?.data ?? data;
  },

  async unblockUser(blockedUserId) {
    if (!blockedUserId) throw normalizeError(new Error('차단 해제 대상 ID가 필요합니다.'));
    const { data } = await client.delete(`/community/block/${encodeURIComponent(blockedUserId)}`);
    return data?.data ?? data;
  },

  async getBlockedUsers() {
    try {
      const { data } = await client.get('/community/blocks');
      return data?.data ?? data ?? [];
    } catch {
      return [];
    }
  },

  async reportPost({ postId, targetUserId, reason } = {}) {
    const { data } = await client.post('/community/report', {
      ...(postId ? { postId: String(postId).trim() } : {}),
      ...(targetUserId ? { targetUserId: String(targetUserId).trim() } : {}),
      reason: String(reason || '부적절한 내용').trim(),
    });
    return data?.data ?? data;
  },

  // ===== Gifts & 3D Effects =====
  async getGifts({ category, context } = {}) {
    try {
      const params = {};
      if (category && category !== 'all') params.category = category;
      if (context) params.context = context;
      const { data } = await client.get('/gifts', { params });
      return data?.data ?? data?.items ?? data ?? [];
    } catch {
      return [];
    }
  },

  async sendLiveGift(roomId, { giftId, idempotencyKey, message } = {}) {
    if (!roomId) throw normalizeError(new Error('라이브 룸 ID가 필요합니다.'));
    if (!giftId) throw normalizeError(new Error('선물 ID가 필요합니다.'));
    const { data } = await client.post(`/live/rooms/${encodeURIComponent(roomId)}/gift`, {
      giftId: String(giftId).trim(),
      idempotencyKey: idempotencyKey || `live_gift_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      message: message ? String(message).trim() : undefined,
    });
    return data?.data ?? data;
  },

  // ===== Advertisements & Banners =====
  async getAdvertisements({ placement = 'HOME_BANNER' } = {}) {
    try {
      const { data } = await client.get('/advertisements', { params: { placement } });
      return data?.data ?? data?.items ?? data ?? [];
    } catch {
      return [];
    }
  },

  async recordAdClick(adId) {
    if (!adId) return;
    try {
      await client.post(`/advertisements/${encodeURIComponent(adId)}/click`);
    } catch {
      // silent
    }
  },

  // ===== Settlement & Creator Redemption =====
  async getSettlementOverview() {
    try {
      const { data } = await client.get('/settlement/overview');
      return data?.data ?? data ?? {
        redeemableBalance: 0,
        pendingEarnings: 0,
        spendableBalance: 0,
        minSettlementPoints: 10000,
        taxRatePercent: 3.3,
        recentRequests: [],
      };
    } catch (e) {
      if (USE_DUMMY_AUTH) {
        return {
          redeemableBalance: 50000,
          pendingEarnings: 0,
          spendableBalance: 12000,
          minSettlementPoints: 10000,
          taxRatePercent: 3.3,
          recentRequests: [],
        };
      }
      throw normalizeError(e);
    }
  },

  async getPointBalance() {
    try {
      const overview = await this.getSettlementOverview();
      const balance = Number(overview?.spendableBalance ?? 0);
      return { balance, ok: true };
    } catch {
      return { balance: 0, ok: false };
    }
  },

  async requestSettlement({ pointsAmount, bankName, accountNumber, accountHolder, idCardNumberHash } = {}) {
    if (!pointsAmount || pointsAmount < 10000) {
      throw normalizeError(new Error('최소 출금 신청 포인트는 10,000P입니다.'));
    }
    if (!bankName || !accountNumber || !accountHolder) {
      throw normalizeError(new Error('은행명, 계좌번호, 예금주명을 모두 입력해 주세요.'));
    }
    const { data } = await client.post('/settlement/requests', {
      pointsAmount: Math.floor(Number(pointsAmount)),
      bankName: String(bankName).trim(),
      accountNumber: String(accountNumber).trim(),
      accountHolder: String(accountHolder).trim(),
      idCardNumberHash: idCardNumberHash ? String(idCardNumberHash).trim() : undefined,
    });
    return data?.data ?? data;
  },

  async getAnnouncements() {
    try {
      const { data } = await client.get('/announcements/active');
      const list = data?.data?.items || data?.data || data?.items || data;
      return Array.isArray(list) ? list : [];
    } catch (e) {
      if (USE_DUMMY_AUTH) {
        return [
          {
            id: 'ann-1',
            title: '🎉 다가온 신규 업데이트 안내: 클린 커뮤니티 & 실시간 활동',
            content: '안녕하세요, 다가온 팀입니다!\n\n회원 여러분의 안전하고 즐거운 소통을 위해 24시간 실시간 모니터링 시스템과 유해 콘텐츠 필터링이 강화되었습니다.\n사진 및 미디어 피드를 통해 일상을 공유하고, 소중한 이웃과 따뜻한 선물을 나누어보세요.\n\n항상 다가온을 이용해 주셔서 감사합니다.',
            isImportant: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'ann-2',
            title: '💳 크리에이터 포인트 출금(정산) 정책 개정 안내',
            content: '크리에이터 포인트 출금은 최소 10,000P부터 신청 가능하며, 매주 화요일 일괄 심사 및 송금이 진행됩니다.\n계좌정보가 정확하지 않을 경우 반려될 수 있으니 등록된 본인 명의 계좌를 다시 한 번 확인해 주시기 바랍니다.',
            isImportant: false,
            createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          },
        ];
      }
      return [];
    }
  },

  async getActivityNotifications() {
    try {
      const { data } = await client.get('/notifications/activity');
      const list = data?.data?.items || data?.data || data?.items || data;
      return Array.isArray(list) ? list : [];
    } catch (e) {
      if (USE_DUMMY_AUTH) {
        return [
          {
            id: 'mock-notif-1',
            type: 'gift',
            title: '🎁 이지수님에게서 선물이 도착했어요!',
            body: '[하트 팡팡] 선물 (+500P)이 적립되었습니다.',
            createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
            data: { points: 500, giftName: '하트 팡팡' },
          },
          {
            id: 'mock-notif-2',
            type: 'visit',
            title: '👀 새로운 이웃이 프로필을 둘러보았습니다.',
            body: '김민우님이 회원님의 프로필을 방문했습니다.',
            createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
          },
          {
            id: 'mock-notif-3',
            type: 'settlement',
            title: '💳 출금 신청 상태 안내 (승인 완료)',
            body: '50,000P 출금 신청이 승인되어 48,350원이 등록된 계좌로 입금되었습니다.',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ];
      }
      return [];
    }
  },
};

export default client;
