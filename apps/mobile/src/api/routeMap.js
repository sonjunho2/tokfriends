// src/api/routeMap.js
// 앱에서 호출하는 경로를 실제 API 경로로 자동 변환하는 어댑터입니다.
/*
불일치 목록 (대표)
- /auth/otp/request        -> /auth/phone/request-otp
- /auth/otp/verify         -> /auth/phone/verify
- /chat/direct             -> /chats/direct
- /store/purchases/confirm -> /payments/confirm
*/

export const PATH_MAP = [
  { from: /^\/auth\/otp\/request\/?$/, to: '/auth/phone/request-otp' },
  { from: /^\/auth\/otp\/verify\/?$/,  to: '/auth/phone/verify' },
  { from: /^\/chat\/direct\/?$/,       to: '/chats/direct' },
  { from: /^\/store\/purchases\/confirm\/?$/, to: '/payments/confirm' },
];

export function mapPath(original) {
  if (!original || typeof original !== 'string') return original;
  const hashIndex = original.indexOf('#');
  const hash = hashIndex >= 0 ? original.slice(hashIndex) : '';
  const pathAndQuery = hashIndex >= 0 ? original.slice(0, hashIndex) : original;
  const queryIndex = pathAndQuery.indexOf('?');
  const query = queryIndex >= 0 ? pathAndQuery.slice(queryIndex) : '';
  const pathOnly = queryIndex >= 0 ? pathAndQuery.slice(0, queryIndex) : pathAndQuery;

  let rewritten = pathOnly;
  for (const rule of PATH_MAP) {
    if (rule.from.test(pathOnly)) {
      rewritten = pathOnly.replace(rule.from, rule.to);
      break;
    }
  }
  if (rewritten === pathOnly) return original;
  return `${rewritten}${query}${hash}`;
}

export function applyRouteMapToAxiosConfig(config) {
  if (!config) return config;
  try {
    const isAbsolute = /^https?:\/\//i.test(config.url);
    if (!isAbsolute) {
      const mapped = mapPath(config.url);
      if (mapped) config.url = mapped;
      return config;
    }
    const parsed = new URL(config.url);
    const mappedPath = mapPath(parsed.pathname);
    if (mappedPath !== parsed.pathname) {
      parsed.pathname = mappedPath;
      config.url = parsed.toString();
    }
    return config;
  } catch {
    return config;
  }
}
