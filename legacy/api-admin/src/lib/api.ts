// 공용 API 클라이언트 (Next.js App Router 클라이언트/서버 겸용)

const API_BASE =
  process.env.NEXT_PUBLIC_TOK_API_BASE?.replace(/\/+$/, '') || '';

const ADMIN_JWT_STORAGE_KEY = 'tokfriends.admin.jwt';

function getAdminJwt(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_JWT_STORAGE_KEY);
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export function assertApiBase() {
  if (!API_BASE) {
    throw new Error('NEXT_PUBLIC_TOK_API_BASE is not configured');
  }
}

async function req<T = any>(
  path: string,
  init: { method?: HttpMethod; body?: any; auth?: boolean } = {},
): Promise<T> {
  assertApiBase();

  const url = `${API_BASE}/${path.replace(/^\/+/, '')}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (init.auth) {
    const token = getAdminJwt();
    if (!token) throw new Error('관리자 로그인이 필요합니다.');
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: init.method || 'GET',
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });

  if (res.status === 204) return {} as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

/** 이하 API 엔드포인트 정의들 (metricsApi, adminAnnouncementsApi, adminReportsApi, adminBlocksApi, adminUsersApi 등)
 * 기존 내용 그대로 유지
 */
export const metricsApi = {
  async summary() {
    return req<{ ok: boolean; data: any }>('metrics', { method: 'GET', auth: true });
  },
};

// ... 생략: announcements, reports, blocks, users API 그대로
