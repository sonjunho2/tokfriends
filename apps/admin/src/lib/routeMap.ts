// tokfriends-admin/admin-web/src/lib/routeMap.ts
// 맵핑 표: 관리자 콘솔에서 기대하는 엔드포인트와 실제 API 제공 경로를 1:1로 정리합니다.
// UI 코드가 기능 키(route key)를 통해 경로를 요청하면, 여기에서 현재 API의 실제 경로를 돌려줍니다.

export type HttpVerb = 'get' | 'post' | 'patch' | 'put' | 'delete'

type RouteDefinition = {
  key: string
  required: string
  actual: string
  method: HttpVerb
  description?: string
}

function defineRouteMap<const T extends Record<string, RouteDefinition>>(map: T) {
  return map
}

const routeMap = defineRouteMap({
  'auth.health': {
    key: 'auth.health',
    required: '/health',
    actual: '/health',
    method: 'get',
    description: '로그인 화면의 상태 점검용 헬스체크.',
  },
  'auth.login.email': {
    key: 'auth.login.email',
    required: '/auth/login/email',
    actual: '/auth/login/email',
    method: 'post',
    description: '이메일 아이디 + 비밀번호 기반 관리자 로그인. 백엔드 미구현 시 로컬 슈퍼 관리자 계정을 사용합니다.',
  },
  'dashboard.metrics': {
    key: 'dashboard.metrics',
    required: '/metrics/dashboard',
    actual: '/metrics/dashboard',
    method: 'get',
    description: '대시보드 KPI 메트릭 스냅샷.',
  },
  'reports.recent': {
    key: 'reports.recent',
    required: '/admin/reports/recent',
    actual: '/admin/reports/recent',
    method: 'get',
    description: '최근 커뮤니티 신고 내역.',
  },
  'users.search': {
    key: 'users.search',
    required: '/users/search',
    actual: '/users/search',
    method: 'get',
    description: '관리자 전용 사용자 목록/검색. 정렬/필터/페이지를 모두 지원하는 실제 API로 매핑.',
  },
  'users.detail': {
    key: 'users.detail',
    required: '/users/{userId}',
    actual: '/admin/users/:userId',
    method: 'get',
    description: '관리자 상세 보기. 감사 로그/노트 포함.',
  },
  'users.update': {
    key: 'users.update',
    required: '/users/{userId}',
    actual: '/admin/users/:userId',
    method: 'patch',
    description: '관리자 권한으로 사용자 프로필/상태 수정.',
  },
  'users.status': {
    key: 'users.status',
    required: '/users/{userId}/status',
    actual: '/users/:userId/status',
    method: 'put',
    description: '사용자 상태 변경 전용 엔드포인트.',
  },
  'community.report': {
    key: 'community.report',
    required: '/community/report',
    actual: '/community/report',
    method: 'post',
    description: '관리자 수동 신고 작성.',
  },
  'community.block': {
    key: 'community.block',
    required: '/community/block',
    actual: '/community/block',
    method: 'post',
    description: '관리자 차단 등록.',
  },
  'admin.overrideCodes.list': {
    key: 'admin.overrideCodes.list',
    required: '/admin/override-codes',
    actual: '/admin/override-codes',
    method: 'get',
    description: '관리자 비상 인증번호 조회.',
  },
  'admin.overrideCodes.update': {
    key: 'admin.overrideCodes.update',
    required: '/admin/override-codes',
    actual: '/admin/override-codes',
    method: 'put',
    description: '관리자 비상 인증번호 저장.',
  },
} as const)

export type RouteKey = keyof typeof routeMap
export type RouteEntry = (typeof routeMap)[RouteKey]

function replaceToken(path: string, token: string, value: string) {
  return path.replace(new RegExp(`:${token}\\b`, 'g'), value).replace(new RegExp(`{${token}}`, 'g'), value)
}

function applyPathParams(pattern: string, params: Record<string, string | number | undefined> = {}) {
  let path = pattern
  for (const [token, value] of Object.entries(params)) {
    if (value === undefined) continue
    path = replaceToken(path, token, encodeURIComponent(String(value)))
  }
  return path
}

export function resolveRoute(key: RouteKey): RouteEntry {
  const entry = routeMap[key]
  if (!entry) {
    throw new Error(`routeMap: unknown route key "${key}"`)
  }
  return entry
}

export function buildRoutePath(key: RouteKey, params: Record<string, string | number | undefined> = {}) {
  const entry = resolveRoute(key)
  return applyPathParams(entry.actual, params)
}

export function listRouteMap(): RouteEntry[] {
  return Object.values(routeMap)
}
