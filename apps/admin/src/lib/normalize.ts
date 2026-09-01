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
