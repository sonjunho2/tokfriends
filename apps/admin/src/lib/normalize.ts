// tokfriends-admin/admin-web/src/lib/normalize.ts
// API 응답을 UI에서 사용하기 쉬운 형태로 정규화하는 헬퍼 모음.

export const DEFAULT_ARRAY_KEYS = ['items', 'results', 'data', 'list', 'records']

export function unwrapArray<T>(payload: unknown, extraKeys: string[] = []): T[] {
  if (Array.isArray(payload)) {
    return payload as T[]
  }

  if (payload && typeof payload === 'object') {
    const probeKeys = [...extraKeys, ...DEFAULT_ARRAY_KEYS]
    for (const key of probeKeys) {
      const value = (payload as Record<string, unknown>)[key]
      if (Array.isArray(value)) {
        return value as T[]
      }
    }
  }

  return []
}

export function ensureStringId(value: unknown, fallbackPrefix: string) {
  if (typeof value === 'string' && value.trim().length > 0) return value
  if (typeof value === 'number') return String(value)
  return `${fallbackPrefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`
}

export function unwrapObject(payload: unknown, objectKeys: string[] = ['data', 'result', 'user']): Record<string, unknown> {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const raw = payload as Record<string, unknown>
    for (const key of objectKeys) {
      const value = raw[key]
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>
      }
    }
    return raw
  }
  return {}
}

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (value === undefined || value === null) return []
  return [value as T]
}

function coerceBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase()
    if (lowered === 'true') return true
    if (lowered === 'false') return false
  }
  return undefined
}

export interface AdminUserSummaryNormalized {
  id: string
  phoneNumber?: string
  nickname?: string
  status?: string
  createdAt?: string
  lastActiveAt?: string
  marketingOptIn?: boolean
  riskLevel?: string
  reportsCount?: number
  segments?: unknown
  [key: string]: unknown
}

export interface AdminUserSummaryListNormalized {
  items: AdminUserSummaryNormalized[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export function normalizeAdminUserSummaryList(payload: unknown): AdminUserSummaryListNormalized {
  const container = unwrapObject(payload, ['data', 'items', 'result'])
  const source = unwrapArray(container, ['data', 'items', 'results'])
  const items = source.map((entry, index) => {
    const raw = (entry as Record<string, unknown>) ?? {}
    const profile = unwrapObject(raw.profile, ['profile'])
    const marketing = unwrapObject(raw.marketing, ['marketing'])

    const id = ensureStringId(raw.id, `user-${index}`)
    const phoneNumber = typeof raw.phoneNumber === 'string' ? raw.phoneNumber : (raw.phone as string | undefined)
    const nickname =
      typeof raw.nickname === 'string'
        ? raw.nickname
        : typeof profile.nickname === 'string'
        ? (profile.nickname as string)
        : (raw.displayName as string | undefined)
    const status = typeof raw.status === 'string' ? raw.status : (raw.state as string | undefined)
    const createdAt =
      typeof raw.createdAt === 'string' ? raw.createdAt : (raw.joinedAt as string | undefined) ?? (raw.created_at as string | undefined)
    const lastActiveAt =
      typeof raw.lastActiveAt === 'string'
        ? raw.lastActiveAt
        : (raw.lastActivity as string | undefined) ?? (raw.last_active_at as string | undefined)
    const marketingOptIn =
      typeof raw.marketingOptIn === 'boolean'
        ? raw.marketingOptIn
        : coerceBoolean(marketing.optIn ?? marketing.opt_in)
    const riskLevel = typeof raw.riskLevel === 'string' ? raw.riskLevel : (raw.trustLevel as string | undefined)
    const reportsCount =
      typeof raw.reportsCount === 'number'
        ? raw.reportsCount
        : Number((raw.reports as number | string | undefined) ?? (raw.reportCount as number | string | undefined) ?? 0)
    const segments = Array.isArray(raw.segments) ? raw.segments : toArray(raw.segments)

    return {
      ...raw,
      id,
      phoneNumber,
      nickname,
      status,
      createdAt,
      lastActiveAt,
      marketingOptIn,
      riskLevel,
      reportsCount,
      segments,
    }
  }) as AdminUserSummaryNormalized[]

  const page = Number((container.page as number | string | undefined) ?? 1)
  const rawLimit = (container.limit as number | string | undefined) ?? items.length
  const limit = Number(rawLimit || 20)
  const total = Number((container.total as number | string | undefined) ?? items.length)
  const totalPages = Number((container.totalPages as number | string | undefined) ?? Math.ceil(total / Math.max(limit, 1)))

  return { items, page, limit, total, totalPages }
}

export interface AdminUserDetailNormalized extends AdminUserSummaryNormalized {
  memo?: string | null
  marketing?: Record<string, unknown>
  profile?: Record<string, unknown>
  notes?: Record<string, unknown>[]
}

export function normalizeAdminUserDetail(payload: unknown, fallbackId: string): AdminUserDetailNormalized {
  const data = unwrapObject(payload, ['data', 'user', 'result'])
  const profile = unwrapObject(data.profile, ['profile'])
  const marketing = unwrapObject(data.marketing, ['marketing'])
  const notes = unwrapArray<Record<string, unknown>>(data.notes ?? data.auditLog, ['notes', 'auditLog']).map((entry, index) => {
    const note = entry ?? {}
    const base: Record<string, unknown> = { ...note }
    base.id = ensureStringId(note.id ?? (note as any)?.noteId ?? (note as any)?.logId, `note-${index}`)
    base.note = typeof note.note === 'string' ? note.note : (note.body as string | undefined) ?? (note.message as string | undefined)
    return base
  })

  const marketingOptIn =
    typeof data.marketingOptIn === 'boolean'
      ? data.marketingOptIn
      : coerceBoolean(marketing.optIn ?? marketing.opt_in)

  const nickname =
    typeof data.nickname === 'string'
      ? data.nickname
      : typeof profile.nickname === 'string'
      ? (profile.nickname as string)
      : (data.displayName as string | undefined)

  const memo =
    typeof data.memo === 'string'
      ? data.memo
      : (data.auditMemo as string | undefined) ?? (data.note as string | undefined) ?? null

  return {
    ...data,
    id: ensureStringId(data.id ?? fallbackId, 'user'),
    nickname,
    profile,
    marketing,
    marketingOptIn,
    memo,
    notes,
  }
}

/**
 * 미디어 파일 URL을 브라우저 보안(CORS/CORP) 제약 없이 로드할 수 있도록 프록시 또는 원본으로 변환
 */
export function getCategoryFallbackImage(category?: string): string {
  const cat = (category || '').toUpperCase()
  if (cat.includes('BEAUTY') || cat.includes('화장') || cat.includes('뷰티') || cat.includes('감성')) {
    return 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800'
  }
  if (cat.includes('FURNITURE') || cat.includes('가구') || cat.includes('인테리어')) {
    return 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800'
  }
  if (cat.includes('DIGITAL') || cat.includes('가전') || cat.includes('스마트') || cat.includes('폰')) {
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=800'
  }
  if (cat.includes('FASHION') || cat.includes('패션') || cat.includes('의류') || cat.includes('잡화')) {
    return 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800'
  }
  if (cat.includes('SPORTS') || cat.includes('캠핑') || cat.includes('스포츠') || cat.includes('레저')) {
    return 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800'
  }
  if (cat.includes('FOOD') || cat.includes('식품') || cat.includes('신선') || cat.includes('공구')) {
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800'
  }
  return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'
}

/**
 * 이미지 URL 정규화 헬퍼 (웹 브라우저 및 관리자 화면용)
 * 모바일 로컬 file:/// 경로는 브라우저 보안상 로드가 불가하므로 카테고리별 고화질 대체 이미지로 변환합니다.
 */
export function resolveDisplayImageUrl(url: string | null | undefined, category?: string): string {
  if (!url || typeof url !== 'string') return getCategoryFallbackImage(category)
  const trimmed = url.trim()
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) return trimmed

  // 모바일 로컬 기기 전용 file:// 및 content:// 경로는 웹 브라우저 로딩 불가
  if (trimmed.startsWith('file:') || trimmed.startsWith('content:')) {
    return getCategoryFallbackImage(category)
  }

  // 실서버 및 백엔드 미디어 정규화
  if (trimmed.includes('/v1/media/files/')) {
    const filename = trimmed.split('/v1/media/files/')[1]
    if (filename) {
      return `https://tok-friends-api.onrender.com/v1/media/files/${filename}`
    }
  }
  if (trimmed.startsWith('/media/files/')) {
    return `https://tok-friends-api.onrender.com/v1${trimmed}`
  }
  if (trimmed.startsWith('/api/backend/media/files/')) {
    const filename = trimmed.split('/api/backend/media/files/')[1]
    if (filename) {
      return `https://tok-friends-api.onrender.com/v1/media/files/${filename}`
    }
  }
  if (trimmed.startsWith('http://localhost:4000/v1/media/files/')) {
    const filename = trimmed.split('http://localhost:4000/v1/media/files/')[1]
    return `https://tok-friends-api.onrender.com/v1/media/files/${filename}`
  }

  return trimmed
}
