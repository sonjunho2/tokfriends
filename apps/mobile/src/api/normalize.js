// src/api/normalize.js
// 목적: API 응답 형태가 제각각이어도, 앱이 항상 동일한 구조로 다루게 하는 어댑터.
// 최종 출력 표준: { ok: boolean, data: any, error: { message, code, status }|null, pageInfo?: { page?, limit?, total?, nextCursor?, prevCursor? } }

// 1) 유틸: snake_case -> camelCase (얕은 변환 + 일부 깊은 키 변환)
function toCamelKey(k) {
  return k.replace(/[_-]([a-z0-9])/g, (_, c) => c.toUpperCase());
}
function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}
function shallowCamelize(obj) {
  if (!isPlainObject(obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[toCamelKey(k)] = v;
  }
  return out;
}

// 2) 공통 “응답 봉투” 추출: data/result/items 등 다양한 케이스 흡수
function unwrapCommonEnvelopes(raw) {
  // 이미 표준 형태인 경우
  if (raw && typeof raw.ok === 'boolean' && ('data' in raw || 'error' in raw)) {
    return { ok: raw.ok, data: raw.data ?? null, error: raw.error ?? null, extra: {} };
  }

  // 흔한 패턴들
  const c = shallowCamelize(raw ?? {});
  if ('data' in c && c.data != null) {
    return { ok: true, data: c.data, error: null, extra: c };
  }
  if ('result' in c && c.result != null) {
    return { ok: true, data: c.result, error: null, extra: c };
  }
  if ('items' in c && Array.isArray(c.items)) {
    return { ok: true, data: c.items, error: null, extra: c };
  }
  if ('success' in c && c.success === true) {
    const d = ('payload' in c) ? c.payload : ('data' in c ? c.data : c);
    return { ok: true, data: d, error: null, extra: c };
  }

  // 그냥 원본이 배열/객체인 경우도 그대로 data로
  if (Array.isArray(raw) || isPlainObject(raw)) {
    return { ok: true, data: raw, error: null, extra: c };
  }

  // 그 외(문자열/숫자 등)는 data에 그대로
  return { ok: true, data: raw, error: null, extra: c };
}

// 3) 페이지네이션/커서 정보 통합
function extractPageInfo(extra) {
  const c = shallowCamelize(extra || {});
  // page/limit/total
  const meta = isPlainObject(c.meta) ? shallowCamelize(c.meta) : null;
  const page = c.page ?? c.currentPage ?? meta?.page ?? meta?.currentPage ?? undefined;
  const limit = c.limit ?? c.pageSize ?? c.perPage ?? meta?.limit ?? meta?.pageSize ?? undefined;
  const total = c.total ?? c.totalCount ?? meta?.total ?? meta?.totalCount ?? undefined;

  // cursor 류
  const nextCursor = c.nextCursor ?? c.next ?? meta?.nextCursor ?? undefined;
  const prevCursor = c.prevCursor ?? c.prev ?? meta?.prevCursor ?? undefined;

  if (
    page !== undefined || limit !== undefined || total !== undefined ||
    nextCursor !== undefined || prevCursor !== undefined
  ) {
    return { page, limit, total, nextCursor, prevCursor };
  }
  return undefined;
}

// 4) 엔드포인트 별 특수 케이스 보정 (경로 기반 라우팅)
function normalizeByEndpoint(urlPath, method, data) {
  // 안전 처리
  let d = data;

  // a) 휴대폰 OTP 요청/검증 결과의 키 통일
  if (/^\/auth\/(otp\/request|phone\/request-otp)$/i.test(urlPath)) {
    // API마다 requestId/verificationId 명칭이 다를 수 있음 → requestId로 통일
    const c = shallowCamelize(d || {});
    const requestId = c.requestId ?? c.verificationId ?? c.reqId ?? null;
    d = { ...c, requestId };
  }
  if (/^\/auth\/(otp\/verify|phone\/verify)$/i.test(urlPath)) {
    const c = shallowCamelize(d || {});
    const verificationId = c.verificationId ?? c.requestId ?? c.verifyId ?? null;
    d = { ...c, verificationId, isVerified: !!(c.isVerified ?? c.verified ?? c.success) };
  }

  // b) 1:1 채팅 생성: { room } 또는 본문 최상위에 오기도 함 → room으로 통일
  if (method === 'post' && /^\/chats?\/direct$/i.test(urlPath)) {
    const c = shallowCamelize(d || {});
    const room = c.room ?? c.data ?? c.result ?? c;
    d = { ...c, room };
  }

  // c) 구매 확인: success/receipt/orderId 등 통일
  if (method === 'post' && /^\/(store\/purchases\/confirm|payments\/confirm|iap\/confirm)$/i.test(urlPath)) {
    const c = shallowCamelize(d || {});
    const success = !!(c.success ?? c.ok ?? true);
    const orderId = c.orderId ?? c.id ?? c.transactionId ?? null;
    d = { ...c, success, orderId };
  }

  // d) 이메일/휴대폰 가입·로그인 토큰 필드 통합
  if (
    method === 'post' &&
    /^\/auth\/(login\/email|signup\/email|phone\/complete-profile)$/i.test(urlPath)
  ) {
    const c = shallowCamelize(d || {});
    const accessToken = c.accessToken ?? c.access_token ?? c.token ?? null;
    const token = c.token ?? accessToken ?? null;
    const user = c.user ?? c.profile ?? null;
    const normalized = { ...c };
    if (accessToken != null) {
      normalized.accessToken = accessToken;
      normalized.access_token = accessToken;
    }
    if (token != null) {
      normalized.token = token;
    }
    if (user != null) {
      normalized.user = user;
    }
    d = normalized;
  }

  return d;
}

// 5) 최종 노멀라이저: Axios 응답 객체 → 표준 형태
export function normalizeAxiosResponse(axiosResponse) {
  const { data: raw, config, status, headers } = axiosResponse || {};
  const url = (config?.url || '').toString();
  const method = (config?.method || 'get').toLowerCase();

  // 절대 URL이면 path만 뽑기
  let path = url;
  try {
    const isAbs = /^https?:\/\//i.test(url);
    if (isAbs) {
      const u = new URL(url);
      path = u.pathname;
    }
  } catch {
    // ignore
  }

  const unwrapped = unwrapCommonEnvelopes(raw);
  const pageInfo = extractPageInfo(unwrapped.extra);

  // 엔드포인트 별 보정
  const normalizedData = normalizeByEndpoint(path, method, unwrapped.data);

  // 최종 표준 포맷
  const isHttpOk = status === undefined ? true : status >= 200 && status < 300;
  const envelope = {
    ok: (unwrapped.ok ?? true) && isHttpOk,
    data: normalizedData,
    error: unwrapped.error ?? null,
    ...(status !== undefined ? { httpStatus: status } : {}),
    ...(headers ? { responseHeaders: headers } : {}),
    ...(pageInfo ? { pageInfo } : {}),
  };

  if (isPlainObject(normalizedData)) {
    for (const [key, value] of Object.entries(normalizedData)) {
      if (!(key in envelope)) {
        envelope[key] = value;
      }
    }
  }

  return {
    ...axiosResponse,
    data: envelope,
  };
}

// 6) 에러 표준화 (선택적으로 사용 가능)
export function normalizeAxiosError(axiosError) {
  const status = axiosError?.response?.status;
  const payload = axiosError?.response?.data;
  const c = shallowCamelize(payload || {});
  const message =
    (typeof c.message === 'string' && c.message) ||
    (typeof c.error === 'string' && c.error) ||
    (typeof c.detail === 'string' && c.detail) ||
    axiosError?.message ||
    '요청 처리 중 오류가 발생했습니다.';
  const code =
    c.code ||
    (status === 401 ? 'UNAUTHORIZED' :
     status === 403 ? 'FORBIDDEN' :
     status === 404 ? 'NOT_FOUND' :
     status === 410 ? 'GONE' :
     status === 422 ? 'UNPROCESSABLE' :
     status === 429 ? 'TOO_MANY_REQUESTS' :
     status === 500 ? 'INTERNAL' : 'UNKNOWN');

  const err = new Error(message);
  err.status = status;
  err.code = code;
  err.response = axiosError?.response;
  err.data = payload;
  err.originalError = axiosError;
  return err;
}
