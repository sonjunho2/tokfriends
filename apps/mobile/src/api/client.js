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

    try {
      const { data } = await client.post('/chats/direct', body);
      if (data?.data?.room) return data.data.room;
      if (data?.room) return data.room;
      return data?.data ?? data;
    } catch (err) {
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
        { id: 'dummy1', name: '테스트 상품 1', price: 0 },
        { id: 'dummy2', name: '테스트 상품 2', price: 1000 },
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

  async getMe() {
        // When dummy auth is enabled, return a fake user profile
    if (USE_DUMMY_AUTH) {
      return {
        id: 'dummy-user',
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
    try {
      const { data } = await client.get('/chats');
      return data?.data ?? data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async getChatMessages(chatId, cursor) {
    const target = String(chatId || '').trim();
    if (!target) {
      throw normalizeError(new Error('대화방 ID가 필요합니다.'));
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
      throw normalizeError(e);
    }
  },

  async sendChatMessage({ chatId, content, clientMessageId, type = 'text' } = {}) {
    const target = String(chatId || '').trim();
    const text = String(content ?? '').trim();
    const requestId = String(clientMessageId || '').trim();
    const msgType = String(type || 'text').trim();
    if (!target) {
      throw normalizeError(new Error('대화방 ID가 필요합니다.'));
    }
    if (!text) {
      throw normalizeError(new Error('메시지 내용을 입력해 주세요.'));
    }

    if (!requestId) {
      throw normalizeError(new Error('Client message ID is required.'));
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
    try {
      const { data } = await client.get('/live/rooms');
      return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async getLiveRoom(roomId) {
    if (!roomId) throw normalizeError(new Error('라이브 룸 ID가 필요합니다.'));
    try {
      const { data } = await client.get(`/live/rooms/${encodeURIComponent(roomId)}`);
      return data?.data ?? data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async createLiveRoom({ title, category = 'talk', coverUri } = {}) {
    const trimmedTitle = String(title || '').trim();
    if (!trimmedTitle) {
      throw normalizeError(new Error('방송 제목을 입력해 주세요.'));
    }
    try {
      const { data } = await client.post('/live/rooms', {
        title: trimmedTitle,
        category,
        ...(coverUri ? { coverUri } : {}),
      });
      return data?.data ?? data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async endLiveRoom(roomId) {
    if (!roomId) throw normalizeError(new Error('라이브 룸 ID가 필요합니다.'));
    try {
      const { data } = await client.post(`/live/rooms/${encodeURIComponent(roomId)}/end`);
      return data?.data ?? data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async joinLiveRoom(roomId) {
    if (!roomId) return { success: false };
    try {
      const { data } = await client.post(`/live/rooms/${encodeURIComponent(roomId)}/join`);
      return data?.data ?? data;
    } catch {
      return { success: false };
    }
  },

  async leaveLiveRoom(roomId) {
    if (!roomId) return { success: false };
    try {
      const { data } = await client.post(`/live/rooms/${encodeURIComponent(roomId)}/leave`);
      return data?.data ?? data;
    } catch {
      return { success: false };
    }
  },

  async getLiveMessages(roomId) {
    if (!roomId) return [];
    try {
      const { data } = await client.get(`/live/rooms/${encodeURIComponent(roomId)}/messages`);
      return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async sendLiveMessage({ roomId, content, type = 'chat', giftPoints } = {}) {
    if (!roomId) throw normalizeError(new Error('라이브 룸 ID가 필요합니다.'));
    const trimmedContent = String(content || '').trim();
    if (!trimmedContent) throw normalizeError(new Error('메시지 내용을 입력해 주세요.'));
    try {
      const { data } = await client.post(`/live/rooms/${encodeURIComponent(roomId)}/messages`, {
        content: trimmedContent,
        type,
        ...(giftPoints ? { giftPoints } : {}),
      });
      return data?.data ?? data;
    } catch (e) {
      throw normalizeError(e);
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

  // Live Module
  async getActiveLiveRooms() {
    try {
      const { data } = await client.get('/live/rooms');
      return data?.data ?? data ?? [];
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async createLiveRoom(body = {}) {
    const { data } = await client.post('/live/rooms', body);
    return data?.data ?? data;
  },

  async getLiveRoom(roomId) {
    if (!roomId) throw normalizeError(new Error('방 ID가 필요합니다.'));
    const { data } = await client.get(`/live/rooms/${encodeURIComponent(roomId)}`);
    return data?.data ?? data;
  },

  async endLiveRoom(roomId) {
    if (!roomId) throw normalizeError(new Error('방 ID가 필요합니다.'));
    const { data } = await client.post(`/live/rooms/${encodeURIComponent(roomId)}/end`);
    return data?.data ?? data;
  },

  async joinLiveRoom(roomId) {
    if (!roomId) throw normalizeError(new Error('방 ID가 필요합니다.'));
    const { data } = await client.post(`/live/rooms/${encodeURIComponent(roomId)}/join`);
    return data?.data ?? data;
  },

  async leaveLiveRoom(roomId) {
    if (!roomId) return;
    try {
      const { data } = await client.post(`/live/rooms/${encodeURIComponent(roomId)}/leave`);
      return data?.data ?? data;
    } catch {
      // quiet leave
    }
  },

  async getLiveMessages(roomId, limit = 50) {
    if (!roomId) return [];
    try {
      const { data } = await client.get(`/live/rooms/${encodeURIComponent(roomId)}/messages`, {
        params: { limit },
      });
      return data?.data ?? data ?? [];
    } catch {
      return [];
    }
  },

  async sendLiveMessage({ roomId, content, type = 'chat', giftPoints = 0 } = {}) {
    if (!roomId) throw normalizeError(new Error('방 ID가 필요합니다.'));
    const { data } = await client.post(`/live/rooms/${encodeURIComponent(roomId)}/messages`, {
      content: content || '',
      type,
      giftPoints,
    });
    return data?.data ?? data;
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
    try {
      const { data } = await client.get('/topics');
      return data?.data ?? data ?? [];
    } catch (e) {
      if (USE_DUMMY_AUTH) return [{ id: 'topic_daily', name: '일상 / 수다' }];
      throw normalizeError(e);
    }
  },

  async getPosts(params = {}) {
    try {
      const { data } = await client.get('/posts', { params });
      return data?.data ?? data ?? { items: [] };
    } catch (e) {
      if (USE_DUMMY_AUTH) return { items: [], nextCursor: null, hasMore: false };
      throw normalizeError(e);
    }
  },

  async getTopicPosts(topicId, params = {}) {
    if (!topicId) return this.getPosts(params);
    try {
      const { data } = await client.get(`/topics/${encodeURIComponent(topicId)}/posts`, { params });
      return data?.data ?? data ?? { items: [] };
    } catch (e) {
      if (USE_DUMMY_AUTH) return { items: [], nextCursor: null, hasMore: false };
      throw normalizeError(e);
    }
  },

  async createPost({ topicId, content } = {}) {
    if (!content) throw normalizeError(new Error('게시글 내용을 입력해 주세요.'));
    const { data } = await client.post('/posts', {
      topicId: topicId || undefined,
      content: String(content).trim(),
    });
    return data?.data ?? data;
  },

  async deletePost(postId) {
    if (!postId) throw normalizeError(new Error('삭제할 게시글 ID가 필요합니다.'));
    const { data } = await client.delete(`/posts/${encodeURIComponent(postId)}`);
    return data?.data ?? data;
  },

  // Post Comments
  async getPostComments(postId) {
    if (!postId) return [];
    try {
      const { data } = await client.get(`/posts/${encodeURIComponent(postId)}/comments`);
      return data?.data ?? data ?? [];
    } catch (e) {
      if (USE_DUMMY_AUTH) return [];
      throw normalizeError(e);
    }
  },

  async createPostComment(postId, { content } = {}) {
    if (!postId) throw normalizeError(new Error('게시글 ID가 필요합니다.'));
    if (!content || !content.trim()) throw normalizeError(new Error('댓글 내용을 입력해 주세요.'));
    const { data } = await client.post(`/posts/${encodeURIComponent(postId)}/comments`, {
      content: String(content).trim(),
    });
    return data?.data ?? data;
  },

  async deletePostComment(postId, commentId) {
    if (!postId || !commentId) throw normalizeError(new Error('게시글 및 댓글 ID가 필요합니다.'));
    const { data } = await client.delete(
      `/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
    );
    return data?.data ?? data;
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
};

export default client;
