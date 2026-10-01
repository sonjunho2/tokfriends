// tokfriends-admin/admin-web/src/lib/api.ts
import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
  isAxiosError,
} from 'axios'


import { buildRoutePath } from './routeMap'
import {
  ensureStringId,
  normalizeAdminUserDetail,
  normalizeAdminUserSummaryList,
  unwrapArray,
} from './normalize'

const API_BASE_URL = '/api/backend'

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 8000,
})

const TOKEN_KEY = 'tokfriends_admin_token'
const ACCESS_KEY = 'access_token'

export function clearAuthStorage() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
}

let logoutInProgress = false

/** ?��? 로그?�웃: ?�버 ?�션�?기존 브라?��? ?�증 ?�보�??�리????/login ?�동 */
export async function logoutToLogin() {
  if (typeof window === 'undefined' || logoutInProgress) return
  logoutInProgress = true

  clearAuthStorage()

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      cache: 'no-store',
    })
  } catch {
    // 로그?�웃 ?�청 ?�패?� 관계없??로그???�면?�로 ?�동?�니??
  }

  window.location.href = '/login'
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers = config.headers || {}
  if (!config.headers['Accept']) {
    config.headers['Accept'] = config.responseType === 'blob' ? 'application/octet-stream' : 'application/json'
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const status = error.response?.status
    const message = (error.response?.data as any)?.message || error.message || ''

    // ?�전?�게 ?�체 URL 구성 (strict 모드 ?�??
    const fullUrl = `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`

    if (status === 401) {
      // eslint-disable-next-line no-console
      console.warn('[TokFriends Admin] 401 from', fullUrl, '| message =', message)
      // refresh ?�로?��? ?�다�?즉시 ?�로그인
      logoutToLogin()
    } else {
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.error('[TokFriends Admin] API error @', fullUrl || API_BASE_URL, error)
      }
    }
    return Promise.reject(error)
  }
)

export function postJson<T = any>(url: string, data?: any, config?: AxiosRequestConfig<T>) {
  return api.post<T>(url, data, {
    headers: { 'Content-Type': 'application/json' },
    ...(config || {}),
  })
}

export function postForm<T = any>(url: string, data?: Record<string, any>, config?: AxiosRequestConfig<T>) {
  const body = new URLSearchParams()
  Object.entries(data || {}).forEach(([k, v]) => body.append(k, String(v ?? '')))
  return api.post<T>(url, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    ...(config || {}),
  })
}


// ?�?�보??메트�?��
export async function getDashboardMetrics() {
  const route = buildRoutePath('dashboard.metrics')
  const res = await api.get(route)
  return res.data
}

// ---------------------------------------------------------------------------
// ?�증 & ?�스체크
// ---------------------------------------------------------------------------

export interface LoginWithEmailRequest {
  email: string
  password: string
}

export interface LoginWithEmailResponse {
  ok: boolean
  user: unknown
}

export async function loginWithEmail(payload: LoginWithEmailRequest) {
  const response = await axios.post<LoginWithEmailResponse>('/api/auth/login', payload, {
    headers: { 'Content-Type': 'application/json' },
  })
  return response.data
}

export async function getCurrentUser() {
  const route = buildRoutePath('users.me')
  const response = await api.get(route)
  return response.data
}

export async function checkHealth() {
  const route = buildRoutePath('auth.health')
  const response = await api.get(route)
  return response.data
}

// ---------------------------------------------------------------------------
// ?�틸리티
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// ?�용??// ---------------------------------------------------------------------------

export interface UserSearchParams {
  query?: string
  phoneNumber?: string
  nickname?: string
  status?: string
  page?: number
  limit?: number
  [key: string]: unknown
}

export interface UserSummary {
  id: string
  phoneNumber?: string
  nickname?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  lastActiveAt?: string
  [key: string]: unknown
}

export type UserDetail = UserSummary & {
  profile?: unknown
  memo?: string
  marketingOptIn?: boolean
  [key: string]: unknown
}

export type UserUpdatePayload = Record<string, unknown>

function mapAdminUserSearchParams(params: UserSearchParams) {
  const { query, phoneNumber, nickname, status, page, limit, ...rest } = params
  const searchTerms = [query, nickname]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length > 0)

  const mapped: Record<string, unknown> = { ...rest }

  if (searchTerms.length > 0) {
    mapped.search = searchTerms.join(' ')
  }

  if (typeof phoneNumber === 'string' && phoneNumber.trim().length > 0) {
    mapped.phone = phoneNumber.trim()
  }

  if (status && status.trim().length > 0) {
    mapped.status = status
  }

  if (typeof page === 'number') {
    mapped.page = page
  }

  if (typeof limit === 'number') {
    mapped.limit = limit
  }

  return mapped
}

function normalizeAdminUserUpdatePayload(payload: UserUpdatePayload) {
  const body: Record<string, unknown> = { ...payload }

  const booleanKeys = ['marketingOptIn', 'marketing_opt_in', 'verified', 'isActive', 'isBlocked']
  for (const key of booleanKeys) {
    const value = body[key]
    if (typeof value === 'string') {
      const lowered = value.trim().toLowerCase()
      if (lowered === 'true') body[key] = true
      else if (lowered === 'false') body[key] = false
    }
  }

  if (typeof body.memo === 'string' && !body.auditMemo) {
    body.auditMemo = body.memo
  }

  return body
}

export async function searchUsers(params: UserSearchParams = {}) {
  const route = buildRoutePath('users.search')
  const response = await api.get(route, { params: mapAdminUserSearchParams(params) })
  const { items } = normalizeAdminUserSummaryList(response.data)
  return items as UserSummary[]
}

export async function getUserById(userId: string) {
  const route = buildRoutePath('users.detail', { userId })
  const response = await api.get(route)
  const normalized = normalizeAdminUserDetail(response.data, userId)
  return normalized as UserDetail
}

export async function updateUserProfile(userId: string, payload: UserUpdatePayload) {
  const route = buildRoutePath('users.update', { userId })
  const response = await api.patch(route, normalizeAdminUserUpdatePayload(payload))
  const normalized = normalizeAdminUserDetail(response.data, userId)
  return normalized as UserDetail
}

export async function updateUserStatus(userId: string, status: string) {
  const route = buildRoutePath('users.status', { userId })
  const response = await api.patch(route, { status })
  const normalized = normalizeAdminUserDetail(response.data, userId)
  return normalized as UserDetail
}

// ---------------------------------------------------------------------------
// ?�고 / 차단
// ---------------------------------------------------------------------------

export interface ReportPayload {
  type?: string
  reason: string
  reportedUserId?: string
  targetId?: string
  postId?: string
  description?: string
  [key: string]: unknown
}

export interface BlockPayload {
  userId: string
  reason?: string
  expiresAt?: string | null
  [key: string]: unknown
}

function normalizeReportPayload(payload: ReportPayload) {
  const body: Record<string, unknown> = {
    reason: payload.reason,
    description: payload.description,
  }

  const reportedUserId = payload.reportedUserId ?? payload.targetId
  if (reportedUserId) {
    body.targetUserId = reportedUserId
  }

  const postId = payload.postId ?? (payload.type === 'POST' ? payload.targetId : undefined)
  if (postId) {
    body.postId = postId
  }

  return body
}

function normalizeBlockPayload(payload: BlockPayload) {
  const body: Record<string, unknown> = {
    reason: payload.reason,
    expiresAt: payload.expiresAt ?? undefined,
    blockedUserId: payload.userId,
  }

  return body
}

export function submitUserReport(payload: ReportPayload) {
  const route = buildRoutePath('community.report')
  return api.post(route, normalizeReportPayload(payload))
}

export function submitUserBlock(payload: BlockPayload) {
  const route = buildRoutePath('community.block')
  return api.post(route, normalizeBlockPayload(payload))
}

// ---------------------------------------------------------------------------
// ?�픽 / 게시글
// ---------------------------------------------------------------------------

export interface TopicQuery {
  status?: string
  page?: number
  limit?: number
  [key: string]: unknown
}

export interface Topic {
  id: string
  title?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface Post {
  id: string
  topicId?: string
  title?: string
  body?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export async function listTopics(params: TopicQuery = {}) {
  const response = await api.get('/topics', { params })
  return unwrapArray<Topic>(response.data, ['topics'])
}

export async function listTopicPosts(topicId: string, params: Record<string, unknown> = {}) {
  const response = await api.get(`/topics/${topicId}/posts`, { params })
  return unwrapArray<Post>(response.data, ['posts'])
}

export async function listPosts(params: Record<string, unknown> = {}) {
  const response = await api.get('/posts', { params })
  return unwrapArray<Post>(response.data, ['posts'])
}

export async function updatePost(postId: string, payload: Record<string, unknown>) {
  const response = await api.patch(`/posts/${postId}`, payload)
  const data = response.data as Post
  const id = ensureStringId(data?.id ?? postId, 'post')
  return { ...data, id }
}

export async function deletePost(postId: string) {
  await api.delete(`/posts/${postId}`)
}

// ---------------------------------------------------------------------------
// 공�? / 배너
// ---------------------------------------------------------------------------

export interface AnnouncementWritePayload {
  title?: string
  body?: string | null
  content?: string | null
  audience?: string | null
  link?: string | null
  isActive?: boolean
  startsAt?: string | null
  endsAt?: string | null
  status?: string | null
  [key: string]: unknown
}

export interface Announcement {
  id: string
  title: string
  body?: string | null
  content?: string | null
  audience?: string | null
  link?: string | null
  isActive?: boolean
  startsAt?: string | null
  endsAt?: string | null
  scheduledAt?: string | null
  status?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  [key: string]: unknown
}

export async function getAnnouncements(params: Record<string, unknown> = {}) {
  const response = await api.get('/announcements', { params })
  return unwrapArray<Announcement>(response.data, ['announcements'])
}

export async function getActiveAnnouncements() {
  const response = await api.get('/announcements/active')
  return unwrapArray<Announcement>(response.data, ['announcements'])
}

export async function createAnnouncement(payload: AnnouncementWritePayload) {
  const response = await api.post('/announcements', payload)
  const data = response.data as Announcement
  const id = ensureStringId(data?.id, 'announcement')
  return { ...data, id }
}

export async function updateAnnouncement(announcementId: string, payload: AnnouncementWritePayload) {
  const response = await api.patch(`/announcements/${announcementId}`, payload)
  const data = response.data as Announcement
  const id = ensureStringId(data?.id ?? announcementId, 'announcement')
  return { ...data, id }
}

// ---------------------------------------------------------------------------
// ?�물 / ?�이??// ---------------------------------------------------------------------------

export interface Gift {
  id: string
  name?: string
  description?: string
  price?: number
  isActive?: boolean
  [key: string]: unknown
}

export type GiftPayload = Record<string, unknown>

export async function getGifts(params: Record<string, unknown> = {}) {
  try {
    const response = await api.get('/gifts', { params })
    return unwrapArray<Gift>(response.data, ['gifts'])
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return []
    }
    throw error
  }
}

export async function createGift(payload: GiftPayload) {
  const response = await api.post('/gifts', payload)
  const data = response.data as Gift
  const id = ensureStringId(data?.id, 'gift')
  return { ...data, id }
}

export async function updateGift(giftId: string, payload: GiftPayload) {
  const response = await api.patch(`/gifts/${giftId}`, payload)
  const data = response.data as Gift
  const id = ensureStringId(data?.id ?? giftId, 'gift')
  return { ...data, id }
}

export async function deleteGift(giftId: string) {
  await api.delete(`/gifts/${giftId}`)
}

// ---------------------------------------------------------------------------
// ?��? / ?�책 문서
// ---------------------------------------------------------------------------

export interface LegalDocumentVersion {
  version?: number
  title?: string
  body?: string | null
  updatedAt?: string | null
  updatedBy?: string | null
  memo?: string | null
  [key: string]: unknown
}

export interface LegalDocument {
  slug: string
  title?: string | null
  body?: string | null
  updatedAt?: string | null
  updatedBy?: string | null
  version?: number | null
  history?: LegalDocumentVersion[]
  [key: string]: unknown
}

export interface LegalDocumentPayload {
  title: string
  body: string
  updatedBy?: string
  memo?: string
  [key: string]: unknown
}

function normalizeVersion(entry: LegalDocumentVersion | undefined, index: number) {
  if (!entry) return undefined
  const normalized: LegalDocumentVersion = {
    ...entry,
    version: entry.version ?? (entry as any)?.revision ?? (entry as any)?.sequence ?? index + 1,
    updatedAt: entry.updatedAt ?? (entry as any)?.updated_at ?? (entry as any)?.createdAt ?? null,
    updatedBy: entry.updatedBy ?? (entry as any)?.updated_by ?? null,
    memo: entry.memo ?? (entry as any)?.memo ?? (entry as any)?.note ?? (entry as any)?.changelog ?? null,
  }
  return normalized
}

export async function getLegalDocument(slug: string) {
  try {
    const response = await api.get(`/legal-documents/${slug}`)
    const raw = response.data as any
    const document = (raw?.document ?? raw) as Record<string, unknown>
    const history = unwrapArray<LegalDocumentVersion>(
      raw?.history ?? document?.history ?? document?.versions ?? (document as any)?.revisions ?? [],
      ['history', 'versions', 'revisions']
    )

    const normalizedHistory = history
      .map((entry, index) => normalizeVersion(entry, index))
      .filter((entry): entry is LegalDocumentVersion => Boolean(entry))

    const normalized: LegalDocument = {
      slug: ensureStringId((document?.slug as string | undefined) ?? slug, 'legal-document'),
      title: (document?.title as string | undefined) ?? (document?.name as string | undefined) ?? null,
      body: (document?.body as string | undefined) ?? (document?.content as string | undefined) ?? null,
      updatedAt:
        (document?.updatedAt as string | undefined) ??
        (document?.updated_at as string | undefined) ??
        (document?.modifiedAt as string | undefined) ??
        null,
      updatedBy:
        (document?.updatedBy as string | undefined) ??
        (document?.updated_by as string | undefined) ??
        (document?.editor as string | undefined) ??
        null,
      version:
        (document?.version as number | undefined) ??
        (document?.latestVersion as number | undefined) ??
        (document?.revision as number | undefined) ??
        null,
      history: normalizedHistory,
    }

    return normalized
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return {
        slug,
        title: '',
        body: '',
        history: [],
      } as LegalDocument
    }
    throw error
  }
}

export async function saveLegalDocument(slug: string, payload: LegalDocumentPayload) {
  const response = await api.put(`/legal-documents/${slug}`, payload)
  const raw = response.data as any
  const history = unwrapArray<LegalDocumentVersion>(raw?.history ?? raw?.versions ?? raw?.revisions ?? [], [
    'history',
    'versions',
    'revisions',
  ])

  const normalizedHistory = history
    .map((entry, index) => normalizeVersion(entry, index))
    .filter((entry): entry is LegalDocumentVersion => Boolean(entry))

  const normalized: LegalDocument = {
    slug: ensureStringId((raw?.slug as string | undefined) ?? slug, 'legal-document'),
    title: (raw?.title as string | undefined) ?? payload.title,
    body: (raw?.body as string | undefined) ?? (raw?.content as string | undefined) ?? payload.body,
    updatedAt: (raw?.updatedAt as string | undefined) ?? (raw?.updated_at as string | undefined) ?? new Date().toISOString(),
    updatedBy: (raw?.updatedBy as string | undefined) ?? (raw?.updated_by as string | undefined) ?? payload.updatedBy,
    version:
      (raw?.version as number | undefined) ??
      (raw?.latestVersion as number | undefined) ??
      (raw?.revision as number | undefined) ??
      (normalizedHistory[0]?.version ?? null),
    history: normalizedHistory,
  }

  return normalized
}

// ---------------------------------------------------------------------------
// ?��????�증
// ---------------------------------------------------------------------------

export interface PhoneOtpLog {
  id?: string
  phoneNumber: string
  requestedAt?: string
  status: 'SUCCESS' | 'FAILED' | string
  failureReason?: string | null
  verificationId?: string | null
  [key: string]: unknown
}

export interface PhoneVerificationSession {
  verificationId: string
  phoneNumber: string
  lastOtpSentAt?: string | null
  verifiedAt?: string | null
  expiresAt?: string | null
  profileCompleted?: boolean
  attempts?: number
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

export interface ManualProfileCompletionPayload {
  verificationId: string
  nickname?: string
  note?: string
  [key: string]: unknown
}

export async function getPhoneOtpLogs(params: Record<string, unknown> = {}) {
  const response = await api.get('/verifications/phone/otp-logs', { params })
  return unwrapArray<PhoneOtpLog>(response.data, ['logs', 'items'])
}

export async function getPendingPhoneVerifications(params: Record<string, unknown> = {}) {
  const response = await api.get('/verifications/phone/pending', { params })
  return unwrapArray<PhoneVerificationSession>(response.data, ['sessions', 'items'])
}

export function resendPhoneOtp(verificationId: string) {
  return api.post(`/verifications/phone/${verificationId}/resend`)
}

export function approvePhoneVerification(verificationId: string) {
  return api.post(`/verifications/phone/${verificationId}/approve`)
}

export function expirePhoneVerificationSession(verificationId: string) {
  return api.post(`/verifications/phone/${verificationId}/expire`)
}

export function completePhoneVerificationProfile(payload: ManualProfileCompletionPayload) {
  return api.post('/verifications/phone/manual-complete', payload)
}

// ---------------------------------------------------------------------------
// ?�인???�품
// ---------------------------------------------------------------------------

export interface PointProduct {
  id: string
  name?: string
  points?: number
  price?: number
  isRecommended?: boolean
  isActive?: boolean
  androidProductId?: string | null
  iosProductId?: string | null
  order?: number
  note?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  [key: string]: unknown
}

export interface PointProductPayload {
  name?: string
  points?: number
  price?: number
  isRecommended?: boolean
  isActive?: boolean
  androidProductId?: string | null
  iosProductId?: string | null
  order?: number
  note?: string | null
  [key: string]: unknown
}

export interface PointProductOrderInput {
  id: string
  order: number
}

export async function getPointProducts(params: Record<string, unknown> = {}) {
  try {
    const response = await api.get('/store/point-products', { params })
    return unwrapArray<PointProduct>(response.data, ['items', 'products', 'pointProducts']).map((item) => ({
      ...item,
      id: ensureStringId(item?.id, 'point-product'),
    }))
  } catch (error) {
    if (isAxiosError(error)) {
      try {
        const fallbackResponse = await api.get('/gifts', { params })
        return unwrapArray<PointProduct>(fallbackResponse.data, ['gifts']).map((item) => ({
          ...item,
          id: ensureStringId(item?.id, 'point-product'),
        }))
      } catch (innerError) {
        if (isAxiosError(innerError)) {
          return []
        }
        throw innerError
      }
    }
    throw error
  }
}

export async function createPointProduct(payload: PointProductPayload) {
  const response = await api.post('/store/point-products', payload)
  const data = response.data as PointProduct
  const id = ensureStringId(data?.id, 'point-product')
  return { ...data, id }
}

export async function updatePointProduct(productId: string, payload: PointProductPayload) {
  const response = await api.put(`/store/point-products/${productId}`, payload)
  const data = response.data as PointProduct
  const id = ensureStringId(data?.id ?? productId, 'point-product')
  return { ...data, id }
}

export async function deletePointProduct(productId: string) {
  await api.delete(`/store/point-products/${productId}`)
}

export async function syncPointProductOrder(items: PointProductOrderInput[]) {
  await api.post('/store/point-products/reorder', { items })
}

// ---------------------------------------------------------------------------
// 매칭 & ?�색
// ---------------------------------------------------------------------------

export interface MatchQueueStat {
  id: string
  segment?: string
  waiting?: number
  medianWait?: string
  dropOffRate?: string
  [key: string]: unknown
}

export interface MatchPresetWeights {
  distance?: number
  interest?: number
  aiAffinity?: number
  recency?: number
  [key: string]: number | undefined
}

export interface MatchPreset {
  id: string
  name?: string
  isActive?: boolean
  weights: MatchPresetWeights
  createdAt?: string
  author?: string
  [key: string]: unknown
}

export interface MatchQuickFilter {
  id: string
  label?: string
  segment?: string
  description?: string
  [key: string]: unknown
}

export interface MatchRecommendationPool {
  id: string
  title?: string
  sortRule?: string
  metrics?: string
  owner?: string
  [key: string]: unknown
}

export interface MatchHeatRegion {
  id: string
  name?: string
  activeUsers?: number
  flagged?: number
  trend?: string
  [key: string]: unknown
}

export interface MatchControlPanelSnapshot {
  queueStats: MatchQueueStat[]
  presets: MatchPreset[]
  quickFilters: MatchQuickFilter[]
  recommendationPools: MatchRecommendationPool[]
  heatRegions: MatchHeatRegion[]
  memo?: string | null
  [key: string]: unknown
}

function normalizeMatchPresetWeights(payload: unknown): MatchPresetWeights {
  const base: MatchPresetWeights = { distance: 0, interest: 0, aiAffinity: 0, recency: 0 }
  if (payload && typeof payload === 'object') {
    for (const key of Object.keys(base)) {
      const value = (payload as Record<string, unknown>)[key]
      if (typeof value === 'number') {
        base[key as keyof MatchPresetWeights] = value
      }
    }
  }
  return base
}

function normalizeMatchPreset(payload: unknown, fallbackIdPrefix: string): MatchPreset {
  const raw = (payload as Record<string, unknown>) ?? {}
  const id = ensureStringId(raw.id, fallbackIdPrefix)
  const weights = normalizeMatchPresetWeights(raw.weights)
  return {
    id,
    name: typeof raw.name === 'string' ? raw.name : undefined,
    isActive: Boolean(raw.isActive ?? raw.active ?? raw.enabled),
    weights,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : (raw.created_at as string | undefined),
    author: typeof raw.author === 'string' ? raw.author : (raw.createdBy as string | undefined),
  }
}

function normalizeMatchArray<T>(payload: unknown, keys: string[], mapper: (value: unknown, index: number) => T): T[] {
  if (Array.isArray(payload)) {
    return payload.map(mapper)
  }
  if (payload && typeof payload === 'object') {
    for (const key of keys) {
      const value = (payload as Record<string, unknown>)[key]
      if (Array.isArray(value)) {
        return value.map(mapper)
      }
    }
  }
  return []
}

function normalizeMatchSnapshot(payload: unknown): MatchControlPanelSnapshot {
  const raw = (payload as Record<string, unknown>) ?? {}

  const queueStats = normalizeMatchArray(raw.queueStats ?? raw.queues ?? raw.queue_statistics, ['queueStats', 'queues'], (value, index) => {
    const item = (value as Record<string, unknown>) ?? {}
    return {
      id: ensureStringId(item.id ?? item.segment, `match-queue-${index}`),
      segment: typeof item.segment === 'string' ? item.segment : (item.name as string | undefined),
      waiting: typeof item.waiting === 'number' ? item.waiting : Number(item.waiting ?? 0),
      medianWait: typeof item.medianWait === 'string' ? item.medianWait : (item.median_wait as string | undefined),
      dropOffRate: typeof item.dropOffRate === 'string' ? item.dropOffRate : (item.drop_off_rate as string | undefined),
    }
  })

  const presets = normalizeMatchArray(raw.presets ?? raw.matchPresets, ['presets', 'matchPresets'], (value, index) =>
    normalizeMatchPreset(value, `match-preset-${index}`)
  )

  const quickFilters = normalizeMatchArray(raw.quickFilters ?? raw.filters, ['quickFilters', 'filters'], (value, index) => {
    const item = (value as Record<string, unknown>) ?? {}
    return {
      id: ensureStringId(item.id ?? item.label, `match-filter-${index}`),
      label: typeof item.label === 'string' ? item.label : (item.name as string | undefined),
      segment: typeof item.segment === 'string' ? item.segment : (item.type as string | undefined),
      description: typeof item.description === 'string' ? item.description : (item.detail as string | undefined),
    }
  })

  const recommendationPools = normalizeMatchArray(
    raw.recommendationPools ?? raw.pools ?? raw.recommendations,
    ['recommendationPools', 'pools'],
    (value, index) => {
      const item = (value as Record<string, unknown>) ?? {}
      return {
        id: ensureStringId(item.id ?? item.title, `match-pool-${index}`),
        title: typeof item.title === 'string' ? item.title : (item.name as string | undefined),
        sortRule: typeof item.sortRule === 'string' ? item.sortRule : (item.rule as string | undefined),
        metrics: typeof item.metrics === 'string' ? item.metrics : (item.metric as string | undefined),
        owner: typeof item.owner === 'string' ? item.owner : (item.createdBy as string | undefined),
      }
    }
  )

  const heatRegions = normalizeMatchArray(raw.heatRegions ?? raw.regions, ['heatRegions', 'regions'], (value, index) => {
    const item = (value as Record<string, unknown>) ?? {}
    return {
      id: ensureStringId(item.id ?? item.name, `match-region-${index}`),
      name: typeof item.name === 'string' ? item.name : (item.region as string | undefined),
      activeUsers:
        typeof item.activeUsers === 'number'
          ? item.activeUsers
          : Number((item as Record<string, unknown>).active_users ?? (item as Record<string, unknown>).active ?? 0),
      flagged:
        typeof item.flagged === 'number'
          ? item.flagged
          : Number((item as Record<string, unknown>).flagged ?? (item as Record<string, unknown>).alerts ?? 0),
      trend: typeof item.trend === 'string' ? item.trend : (item.direction as string | undefined),
    }
  })

  return {
    queueStats,
    presets,
    quickFilters,
    recommendationPools,
    heatRegions,
    memo: typeof raw.memo === 'string' ? raw.memo : (raw.heatMemo as string | null | undefined) ?? null,
  }
}

export async function getMatchControlPanelSnapshot(params: Record<string, unknown> = {}) {
  try {
    const response = await api.get('/matches/control-panel', { params })
    return normalizeMatchSnapshot(response.data)
  } catch (error) {
    if (isAxiosError(error)) {
      return normalizeMatchSnapshot({})
    }
    throw error
  }
}

export interface MatchPresetPayload {
  name?: string
  isActive?: boolean
  weights?: MatchPresetWeights
  [key: string]: unknown
}

export async function updateMatchPreset(presetId: string, payload: MatchPresetPayload) {
  const response = await api.patch(`/matches/presets/${presetId}`, payload)
  return normalizeMatchPreset(response.data, presetId)
}

export async function activateMatchPreset(presetId: string) {
  const response = await api.post(`/matches/presets/${presetId}/activate`)
  return normalizeMatchPreset(response.data, presetId)
}

export async function duplicateMatchPreset(presetId: string) {
  const response = await api.post(`/matches/presets/${presetId}/duplicate`)
  return normalizeMatchPreset(response.data, `${presetId}-copy`)
}

export interface MatchQuickFilterPayload {
  label: string
  segment: string
  description?: string
  [key: string]: unknown
}

export async function createMatchQuickFilter(payload: MatchQuickFilterPayload): Promise<MatchQuickFilter> {
  const response = await api.post('/matches/quick-filters', payload)
  const normalized = normalizeMatchArray(response.data, ['filters'], (value) => value)[0]
  if (normalized && typeof normalized === 'object') {
    const raw = normalized as Record<string, unknown>
    return {
      id: ensureStringId(raw.id ?? payload.label, 'match-filter-new'),
      label: typeof raw.label === 'string' ? raw.label : payload.label,
      segment: typeof raw.segment === 'string' ? raw.segment : payload.segment,
      description: typeof raw.description === 'string' ? raw.description : payload.description,
    }
  }
  return {
    id: ensureStringId(null, 'match-filter'),
    label: payload.label,
    segment: payload.segment,
    description: payload.description,
  }
}

export async function deleteMatchQuickFilter(filterId: string) {
  await api.delete(`/matches/quick-filters/${filterId}`)
}

export interface MatchRecommendationPoolPayload {
  title?: string
  sortRule?: string
  metrics?: string
  owner?: string
  [key: string]: unknown
}

export async function updateMatchRecommendationPool(poolId: string, payload: MatchRecommendationPoolPayload) {
  const response = await api.patch(`/matches/recommendation-pools/${poolId}`, payload)
  const raw = (response.data as Record<string, unknown>) ?? {}
  return {
    id: ensureStringId(raw.id ?? poolId, 'match-pool'),
    title: typeof raw.title === 'string' ? raw.title : (raw.name as string | undefined),
    sortRule: typeof raw.sortRule === 'string' ? raw.sortRule : (raw.rule as string | undefined),
    metrics: typeof raw.metrics === 'string' ? raw.metrics : (raw.metric as string | undefined),
    owner: typeof raw.owner === 'string' ? raw.owner : (raw.createdBy as string | undefined),
  }
}

export async function saveMatchHeatMemo(payload: { memo: string }) {
  const response = await api.post('/matches/heat-map/memo', payload)
  return (response.data as { memo?: string } | undefined)?.memo ?? payload.memo
}

// ---------------------------------------------------------------------------
// 채팅 & ?�전
// ---------------------------------------------------------------------------

export interface ChatRoomSummary {
  id: string
  title?: string
  category?: string
  region?: string
  distanceKm?: number
  unread?: number
  newMessages?: number
  participants?: number
  status?: string
  isFallback?: boolean
  createdAt?: string
  lastMessageAt?: string
  [key: string]: unknown
}

export interface ChatSafetyReport {
  id: string
  roomId?: string
  reporter?: string
  reason?: string
  status?: string
  createdAt?: string
  [key: string]: unknown
}

export interface ChatPolicyRule {
  id: string
  name?: string
  description?: string
  enabled?: boolean
  autoAction?: string
  [key: string]: unknown
}

export interface ChatSafetySnapshot {
  rooms: ChatRoomSummary[]
  reports: ChatSafetyReport[]
  policyRules: ChatPolicyRule[]
  cannedResponses?: string[]
  memo?: string
  [key: string]: unknown
}

function normalizeChatSnapshot(payload: unknown): ChatSafetySnapshot {
  const raw = (payload as Record<string, unknown>) ?? {}
  const rooms = normalizeMatchArray(raw.rooms ?? raw.chatRooms, ['rooms', 'chatRooms'], (value, index) => {
    const item = (value as Record<string, unknown>) ?? {}
    return {
      id: ensureStringId(item.id ?? item.roomId, `chat-room-${index}`),
      title: typeof item.title === 'string' ? item.title : (item.name as string | undefined),
      category: typeof item.category === 'string' ? item.category : (item.segment as string | undefined),
      region: typeof item.region === 'string' ? item.region : (item.location as string | undefined),
      distanceKm: typeof item.distanceKm === 'number' ? item.distanceKm : Number(item.distance_km ?? item.distance ?? 0),
      unread: typeof item.unread === 'number' ? item.unread : Number(item.unread ?? 0),
      newMessages: typeof item.newMessages === 'number' ? item.newMessages : Number(item.new_messages ?? item.new ?? 0),
      participants:
        typeof item.participants === 'number'
          ? item.participants
          : Number(item.participant_count ?? item.members ?? 0),
      status: typeof item.status === 'string' ? item.status : (item.state as string | undefined),
      isFallback: Boolean(item.isFallback ?? item.sample ?? false),
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : (item.created_at as string | undefined),
      lastMessageAt: typeof item.lastMessageAt === 'string' ? item.lastMessageAt : (item.last_message_at as string | undefined),
    }
  })

  const reports = normalizeMatchArray(raw.reports ?? raw.safetyReports, ['reports', 'safetyReports'], (value, index) => {
    const item = (value as Record<string, unknown>) ?? {}
    return {
      id: ensureStringId(item.id ?? item.reportId, `chat-report-${index}`),
      roomId: typeof item.roomId === 'string' ? item.roomId : (item.room_id as string | undefined),
      reporter: typeof item.reporter === 'string' ? item.reporter : (item.user as string | undefined),
      reason: typeof item.reason === 'string' ? item.reason : (item.detail as string | undefined),
      status: typeof item.status === 'string' ? item.status : (item.state as string | undefined),
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : (item.created_at as string | undefined),
    }
  })

  const policyRules = normalizeMatchArray(raw.policyRules ?? raw.rules, ['policyRules', 'rules'], (value, index) => {
    const item = (value as Record<string, unknown>) ?? {}
    return {
      id: ensureStringId(item.id ?? item.ruleId, `chat-rule-${index}`),
      name: typeof item.name === 'string' ? item.name : (item.title as string | undefined),
      description: typeof item.description === 'string' ? item.description : (item.detail as string | undefined),
      enabled: Boolean(item.enabled ?? item.active ?? false),
      autoAction: typeof item.autoAction === 'string' ? item.autoAction : (item.action as string | undefined),
    }
  })

  const cannedResponses = normalizeMatchArray(raw.cannedResponses, ['cannedResponses'], (value) => String(value))

  return {
    rooms,
    reports,
    policyRules,
    cannedResponses: cannedResponses.length > 0 ? cannedResponses : undefined,
    memo: typeof raw.memo === 'string' ? raw.memo : (raw.safetyMemo as string | undefined),
  }
}

export async function getChatSafetySnapshot(params: Record<string, unknown> = {}) {
  try {
    const response = await api.get('/chats/control-panel', { params })
    return normalizeChatSnapshot(response.data)
  } catch (error) {
    if (isAxiosError(error)) {
      return normalizeChatSnapshot({})
    }
    throw error
  }
}

export interface ChatRoomUpdatePayload {
  allowEntry?: boolean
  cannedMessage?: string
  status?: string
  [key: string]: unknown
}

export async function updateChatRoom(roomId: string, payload: ChatRoomUpdatePayload) {
  const response = await api.patch(`/chats/rooms/${roomId}`, payload)
  return normalizeChatSnapshot({ rooms: [response.data] }).rooms[0]
}

export async function resolveChatReport(reportId: string, payload: Record<string, unknown>) {
  const response = await api.post(`/chats/reports/${reportId}/resolve`, payload)
  return normalizeChatSnapshot({ reports: [response.data] }).reports[0]
}

export async function updateChatPolicyRule(ruleId: string, payload: Record<string, unknown>) {
  const response = await api.patch(`/chats/policy-rules/${ruleId}`, payload)
  return normalizeChatSnapshot({ policyRules: [response.data] }).policyRules[0]
}

export async function saveChatSafetyMemo(payload: { memo: string }) {
  const response = await api.post('/chats/control-panel/memo', payload)
  return (response.data as { memo?: string } | undefined)?.memo ?? payload.memo
}

// ---------------------------------------------------------------------------
// 분석 & 리포??// ---------------------------------------------------------------------------

export interface AnalyticsMetric {
  id: string
  name?: string
  value?: string
  delta?: string
  description?: string
  pinned?: boolean
  [key: string]: unknown
}

export interface AnalyticsReportJob {
  id: string
  name?: string
  cadence?: string
  destination?: string
  format?: string
  active?: boolean
  [key: string]: unknown
}

export interface AnalyticsExportLog {
  id: string
  title?: string
  generatedAt?: string
  status?: string
  [key: string]: unknown
}

export interface AnalyticsOverviewSnapshot {
  metrics: AnalyticsMetric[]
  reportJobs: AnalyticsReportJob[]
  exportLogs: AnalyticsExportLog[]
  [key: string]: unknown
}

function normalizeAnalyticsSnapshot(payload: unknown): AnalyticsOverviewSnapshot {
  const raw = (payload as Record<string, unknown>) ?? {}

  const metrics = normalizeMatchArray(raw.metrics ?? raw.metricWidgets, ['metrics', 'metricWidgets'], (value, index) => {
    const item = (value as Record<string, unknown>) ?? {}
    return {
      id: ensureStringId(item.id ?? item.metricId, `analytics-metric-${index}`),
      name: typeof item.name === 'string' ? item.name : (item.title as string | undefined),
      value: typeof item.value === 'string' ? item.value : (item.current as string | undefined),
      delta: typeof item.delta === 'string' ? item.delta : (item.change as string | undefined),
      description: typeof item.description === 'string' ? item.description : (item.detail as string | undefined),
      pinned: Boolean(item.pinned ?? item.isPinned ?? item.highlighted ?? false),
    }
  })

  const reportJobs = normalizeMatchArray(raw.reportJobs ?? raw.jobs, ['reportJobs', 'jobs'], (value, index) => {
    const item = (value as Record<string, unknown>) ?? {}
    return {
      id: ensureStringId(item.id ?? item.jobId, `analytics-job-${index}`),
      name: typeof item.name === 'string' ? item.name : (item.title as string | undefined),
      cadence: typeof item.cadence === 'string' ? item.cadence : (item.schedule as string | undefined),
      destination: typeof item.destination === 'string' ? item.destination : (item.channel as string | undefined),
      format: typeof item.format === 'string' ? item.format : (item.fileType as string | undefined),
      active: Boolean(item.active ?? item.enabled ?? false),
    }
  })

  const exportLogs = normalizeMatchArray(raw.exportLogs ?? raw.exports, ['exportLogs', 'exports'], (value, index) => {
    const item = (value as Record<string, unknown>) ?? {}
    return {
      id: ensureStringId(item.id ?? item.exportId, `analytics-export-${index}`),
      title: typeof item.title === 'string' ? item.title : (item.name as string | undefined),
      generatedAt: typeof item.generatedAt === 'string' ? item.generatedAt : (item.generated_at as string | undefined),
      status: typeof item.status === 'string' ? item.status : (item.state as string | undefined),
    }
  })

  return { metrics, reportJobs, exportLogs }
}

export async function getAnalyticsOverview(params: Record<string, unknown> = {}) {
  try {
    const response = await api.get('/analytics/overview', { params })
    return normalizeAnalyticsSnapshot(response.data)
  } catch (error) {
    if (isAxiosError(error)) {
      return normalizeAnalyticsSnapshot({})
    }
    throw error
  }
}

export async function updateAnalyticsMetric(metricId: string, payload: Record<string, unknown>) {
  const response = await api.patch(`/analytics/metrics/${metricId}`, payload)
  return normalizeAnalyticsSnapshot({ metrics: [response.data] }).metrics[0]
}

export async function createAnalyticsMetric(payload: Record<string, unknown>) {
  const response = await api.post('/analytics/metrics', payload)
  return normalizeAnalyticsSnapshot({ metrics: [response.data] }).metrics[0]
}

export async function updateAnalyticsReportJob(jobId: string, payload: Record<string, unknown>) {
  const response = await api.patch(`/analytics/report-jobs/${jobId}`, payload)
  return normalizeAnalyticsSnapshot({ reportJobs: [response.data] }).reportJobs[0]
}

export async function toggleAnalyticsReportJob(jobId: string, active: boolean) {
  const response = await api.post(`/analytics/report-jobs/${jobId}/${active ? 'activate' : 'deactivate'}`)
  return normalizeAnalyticsSnapshot({ reportJobs: [response.data] }).reportJobs[0]
}

export async function createAnalyticsExport(payload: Record<string, unknown>) {
  const response = await api.post('/analytics/exports', payload)
  return normalizeAnalyticsSnapshot({ exportLogs: [response.data] }).exportLogs[0]
}

// ---------------------------------------------------------------------------
// ?�정 & ?�합
// ---------------------------------------------------------------------------

export interface AdminTeamMember {
  id: string
  email?: string
  name?: string
  username?: string
  phoneNumber?: string
  role?: string
  status?: string
  twoFactor?: boolean
  permissions?: string[]
  lastLoginAt?: string
  [key: string]: unknown
}

export interface AdminFeatureFlag {
  id: string
  name?: string
  description?: string
  environment?: string
  enabled?: boolean
  [key: string]: unknown
}

export interface AdminIntegrationSetting {
  id: string
  label?: string
  value?: string
  placeholder?: string
  [key: string]: unknown
}

export interface AdminSettingsSnapshot {
  members: AdminTeamMember[]
  featureFlags: AdminFeatureFlag[]
  integrations: AdminIntegrationSetting[]
  auditMemo?: string
  [key: string]: unknown
}

function normalizeAdminSettings(payload: unknown): AdminSettingsSnapshot {
  const raw = (payload as Record<string, unknown>) ?? {}
  const members = normalizeMatchArray(raw.members ?? raw.teamMembers, ['members', 'teamMembers'], (value, index) => {
    const item = (value as Record<string, unknown>) ?? {}
    const permissions = Array.isArray(item.permissions)
      ? (item.permissions as unknown[]).map((permission) => String(permission))
      : typeof item.permission === 'string'
      ? [item.permission]
      : []
    const status = typeof item.status === 'string' ? item.status : (item.state as string | undefined)
    const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : undefined
    return {
      id: ensureStringId(item.id ?? item.email ?? item.phoneNumber, `team-member-${index}`),
      email: typeof item.email === 'string' ? item.email : (item.username as string | undefined),
      username: typeof item.username === 'string' ? item.username : undefined,
      name: typeof item.name === 'string' ? item.name : (item.displayName as string | undefined),
      phoneNumber: typeof item.phoneNumber === 'string' ? item.phoneNumber : (item.phone as string | undefined),
      role: typeof item.role === 'string' ? item.role : (item.permission as string | undefined),
      status: normalizedStatus ?? undefined,
      twoFactor: Boolean(item.twoFactor ?? item.two_factor ?? item.mfa ?? false),
      permissions,
      lastLoginAt: typeof item.lastLoginAt === 'string' ? item.lastLoginAt : (item.last_login as string | undefined),
    }
  })

  const featureFlags = normalizeMatchArray(raw.featureFlags ?? raw.flags, ['featureFlags', 'flags'], (value, index) => {
    const item = (value as Record<string, unknown>) ?? {}
    return {
      id: ensureStringId(item.id ?? item.key, `feature-flag-${index}`),
      name: typeof item.name === 'string' ? item.name : (item.key as string | undefined),
      description: typeof item.description === 'string' ? item.description : (item.detail as string | undefined),
      environment: typeof item.environment === 'string' ? item.environment : (item.env as string | undefined),
      enabled: Boolean(item.enabled ?? item.active ?? false),
    }
  })

  const integrations = normalizeMatchArray(raw.integrations ?? raw.integrationSettings, ['integrations', 'integrationSettings'], (value, index) => {
    const item = (value as Record<string, unknown>) ?? {}
    return {
      id: ensureStringId(item.id ?? item.key, `integration-${index}`),
      label: typeof item.label === 'string' ? item.label : (item.name as string | undefined),
      value: typeof item.value === 'string' ? item.value : (item.current as string | undefined),
      placeholder: typeof item.placeholder === 'string' ? item.placeholder : (item.hint as string | undefined),
    }
  })

  return {
    members,
    featureFlags,
    integrations,
    auditMemo: typeof raw.auditMemo === 'string' ? raw.auditMemo : (raw.audit_log as string | undefined),
  }
}

const EMPTY_ADMIN_SETTINGS: AdminSettingsSnapshot = {
  members: [],
  featureFlags: [],
  integrations: [],
  auditMemo: '',
}

export async function getAdminSettingsSnapshot(params: Record<string, unknown> = {}) {
  const response = await api.get('/admin/settings/snapshot', { params })
  return normalizeAdminSettings(response.data)
}

export async function createAdminTeamMember(payload: Record<string, unknown>) {
  const response = await api.post('/admin/settings/team', payload)
  return normalizeAdminSettings({ members: [response.data] }).members[0]
}

export async function updateAdminTeamMember(memberId: string, payload: Record<string, unknown>) {
  const response = await api.patch(`/admin/settings/team/${memberId}`, payload)
  return normalizeAdminSettings({ members: [response.data] }).members[0]
}

export async function deleteAdminTeamMember(memberId: string) {
  await api.delete(`/admin/settings/team/${memberId}`)
  return { success: true }
}

export async function updateAdminTeamMemberPassword(memberId: string, payload: { password: string }) {
  const response = await api.patch(`/admin/settings/team/${memberId}/password`, payload)
  return normalizeAdminSettings({ members: [response.data] }).members[0]
}

export async function updateAdminFeatureFlag(flagId: string, payload: Record<string, unknown>) {
  const response = await api.patch(`/admin/settings/feature-flags/${flagId}`, payload)
  return normalizeAdminSettings({ featureFlags: [response.data] }).featureFlags[0]
}

export async function updateAdminIntegrationSetting(settingId: string, payload: Record<string, unknown>) {
  const response = await api.patch(`/admin/settings/integrations/${settingId}`, payload)
  return normalizeAdminSettings({ integrations: [response.data] }).integrations[0]
}

export async function saveAdminAuditMemo(payload: { memo: string }) {
  const response = await api.post('/admin/settings/audit-log', payload)
  return (response.data as { memo?: string } | undefined)?.memo ?? payload.memo
}

// =============================================
// Admin Notification Broadcast
// =============================================

export interface BroadcastResult {
  sent: number
  failed: number
  total: number
  reason?: string
}

export interface BroadcastDeviceStats {
  totalRegisteredDevices: number
  platformBreakdown: { platform: string; count: number }[]
}

export async function sendAdminBroadcast(payload: {
  title: string
  body: string
  role?: string
  data?: Record<string, string>
}): Promise<BroadcastResult> {
  const { role, ...body } = payload
  const params: Record<string, string> = {}
  if (role) params.role = role
  const response = await api.post('/notifications/broadcast', body, { params })
  const d = (response.data as any) ?? {}
  return {
    sent: typeof d.sent === 'number' ? d.sent : 0,
    failed: typeof d.failed === 'number' ? d.failed : 0,
    total: typeof d.total === 'number' ? d.total : 0,
    reason: typeof d.reason === 'string' ? d.reason : undefined,
  }
}

export async function getAdminBroadcastStats(): Promise<BroadcastDeviceStats> {
  try {
    const response = await api.get('/notifications/broadcast/history')
    const d = (response.data as any)?.data ?? {}
    return {
      totalRegisteredDevices: typeof d.totalRegisteredDevices === 'number' ? d.totalRegisteredDevices : 0,
      platformBreakdown: Array.isArray(d.platformBreakdown)
        ? d.platformBreakdown.map((p: any) => ({ platform: String(p.platform ?? 'unknown'), count: Number(p.count ?? 0) }))
        : [],
    }
  } catch {
    return { totalRegisteredDevices: 0, platformBreakdown: [] }
  }
}

// =============================================
// Admin API Manager
// =============================================

export interface ApiEndpointInfo {
  id: string
  method: string
  path: string
  module: string
  description: string
  rateLimitPerMin: number
  enabled: boolean
}

export interface ApiRequestLog {
  id: string
  method: string
  path: string
  statusCode: number
  durationMs: number
  timestamp: string
  userId?: string
}

export interface ApiManagerSnapshot {
  endpoints: ApiEndpointInfo[]
  recentLogs: ApiRequestLog[]
  totalRequests24h: number
  errorRate24h: number
}

const FALLBACK_ENDPOINTS: ApiEndpointInfo[] = [
  { id: 'ep-discover', method: 'GET', path: '/discover', module: 'Discover', description: 'User discovery search & filter', rateLimitPerMin: 60, enabled: true },
  { id: 'ep-users-search', method: 'GET', path: '/users/search', module: 'Users', description: 'User search', rateLimitPerMin: 30, enabled: true },
  { id: 'ep-posts', method: 'GET', path: '/posts', module: 'Posts', description: 'Community posts feed', rateLimitPerMin: 60, enabled: true },
  { id: 'ep-chats-direct', method: 'POST', path: '/chats/direct', module: 'Chats', description: '1:1 direct chat room', rateLimitPerMin: 20, enabled: true },
  { id: 'ep-chats-message', method: 'POST', path: '/chats/message', module: 'Chats', description: 'Send chat message', rateLimitPerMin: 120, enabled: true },
  { id: 'ep-follows', method: 'PUT', path: '/follows/:id', module: 'Follows', description: 'Follow user', rateLimitPerMin: 30, enabled: true },
  { id: 'ep-interests', method: 'PUT', path: '/interests/:id', module: 'Interests', description: 'Send interest', rateLimitPerMin: 20, enabled: true },
  { id: 'ep-live', method: 'POST', path: '/live/rooms', module: 'Live', description: 'Create live room', rateLimitPerMin: 5, enabled: true },
  { id: 'ep-broadcast', method: 'POST', path: '/notifications/broadcast', module: 'Notifications', description: 'Admin broadcast push', rateLimitPerMin: 10, enabled: true },
  { id: 'ep-store-products', method: 'GET', path: '/store/point-products', module: 'Store', description: 'Point products list', rateLimitPerMin: 60, enabled: true },
];

export async function getApiManagerSnapshot(): Promise<ApiManagerSnapshot> {
  try {
    const response = await api.get('/metrics/dashboard')
    const d = (response.data as any)?.data ?? {}
    return {
      endpoints: FALLBACK_ENDPOINTS,
      recentLogs: [],
      totalRequests24h: typeof d.totalRequests24h === 'number' ? d.totalRequests24h : 0,
      errorRate24h: typeof d.errorRate24h === 'number' ? d.errorRate24h : 0,
    }
  } catch {
    return { endpoints: FALLBACK_ENDPOINTS, recentLogs: [], totalRequests24h: 0, errorRate24h: 0 }
  }
}

export async function updateApiEndpoint(
  id: string,
  payload: Partial<Pick<ApiEndpointInfo, 'enabled' | 'rateLimitPerMin'>>,
): Promise<ApiEndpointInfo> {
  // In a real system this would call PATCH /admin/api-manager/endpoints/:id
  // For now it's a client-side optimistic update stub
  await new Promise((r) => setTimeout(r, 200))
  const found = FALLBACK_ENDPOINTS.find((ep) => ep.id === id)
  return { ...(found ?? FALLBACK_ENDPOINTS[0]), ...payload } as ApiEndpointInfo
}

// =============================================
// Admin Reports & Safety
// =============================================

export type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED'

export interface ReportItem {
  id: number
  reason: string
  status: ReportStatus
  createdAt: string
  reporter: { id: string; email?: string; displayName?: string } | null
  reported: { id: string; email?: string; displayName?: string } | null
}

export interface ReportListResponse {
  ok: boolean
  page: number
  limit: number
  total: number
  totalPages: number
  items: ReportItem[]
}

function normalizeReportItem(raw: any): ReportItem {
  return {
    id: typeof raw?.id === 'number' ? raw.id : Number(raw?.id ?? 0),
    reason: typeof raw?.reason === 'string' ? raw.reason : '',
    status: (raw?.status ?? 'PENDING') as ReportStatus,
    createdAt: raw?.createdAt ?? raw?.created_at ?? new Date().toISOString(),
    reporter: raw?.reporter ?? null,
    reported: raw?.reported ?? null,
  }
}

export async function getAdminReports(params: {
  status?: string
  page?: number
  limit?: number
} = {}): Promise<ReportListResponse> {
  const response = await api.get('/admin/reports', { params })
  const d = response.data as any
  const items = (d?.items ?? d?.data ?? []).map(normalizeReportItem)
  return {
    ok: true,
    page: d?.page ?? 1,
    limit: d?.limit ?? 20,
    total: d?.total ?? items.length,
    totalPages: d?.totalPages ?? 1,
    items,
  }
}

export async function updateAdminReportStatus(
  id: number,
  status: Exclude<ReportStatus, 'PENDING'>,
): Promise<ReportItem> {
  const response = await api.patch(`/admin/reports/${id}/status`, { status })
  const d = (response.data as any)?.data ?? response.data
  return normalizeReportItem(d)
}

export async function blockReportedUser(
  id: number,
  reason?: string,
): Promise<{ reportId: number; reportedId: string; blocked: boolean }> {
  const response = await api.post(`/admin/reports/${id}/block-user`, { reason })
  const d = (response.data as any)?.data ?? response.data
  return {
    reportId: typeof d?.reportId === 'number' ? d.reportId : id,
    reportedId: String(d?.reportedId ?? ''),
    blocked: Boolean(d?.blocked ?? true),
  }
}

// =============================================
// Admin Settlement & Refunds
// =============================================

export interface AdminRefundRequest {
  id: string
  userId: string
  platform: string
  productId: string
  receiptId: string
  reason?: string | null
  status: 'pending' | 'approved' | 'denied' | string
  createdAt: string
  decidedAt?: string | null
  user?: {
    id: string
    email?: string
    displayName?: string
    pointsBalance?: number
  } | null
}

export interface SettlementSummary {
  totalPurchasesCount: number
  totalPointsPurchased: number
  pendingRefundsCount: number
  pendingSettlementsCount?: number
  pendingSettlementsPoints?: number
  pendingSettlementsNetAmount?: number
  totalWallets: number
  totalSpendableBalance: number
  totalRedeemableBalance: number
  totalPendingEarnings: number
  recentPurchases: PointPurchaseItem[]
}

export interface SettlementRequestItem {
  id: string
  activityAccountId: string
  pointsAmount: number
  krwAmount: number
  taxAmount: number
  netAmount: number
  bankName: string
  accountNumber: string
  accountHolder: string
  idCardNumberHash?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  adminMemo?: string | null
  processedAt?: string | null
  processedById?: string | null
  createdAt: string
  updatedAt: string
  activityAccount?: {
    id: string
    displayName?: string | null
    handle?: string | null
    ownerId?: string | null
    legacyUserId?: string | null
  } | null
  processedBy?: {
    id: string
    displayName?: string | null
    email?: string | null
  } | null
}

export interface SettlementRequestsResponse {
  ok: boolean
  page: number
  limit: number
  total: number
  totalPages: number
  items: SettlementRequestItem[]
}

export interface PointPurchaseItem {
  id: string
  userId: string
  productId: string
  transactionId: string
  platform: string
  points: number
  status: string
  createdAt: string
  user?: {
    id: string
    email?: string
    displayName?: string
  } | null
}

export interface SettlementPurchasesResponse {
  ok: boolean
  page: number
  limit: number
  total: number
  totalPages: number
  items: PointPurchaseItem[]
}

export interface WalletLedgerItem {
  id: string
  walletId: string
  kind: string
  source: string
  deltaSpendable: number
  deltaRedeemable: number
  deltaPending: number
  spendableAfter: number
  redeemableAfter: number
  pendingAfter: number
  idempotencyKey: string
  createdAt: string
  wallet?: {
    id: string
    activityAccountId: string
    activityAccount?: {
      displayName?: string
      handle?: string
    } | null
  } | null
}

export async function getAdminRefunds(): Promise<AdminRefundRequest[]> {
  const response = await api.get('/admin/refunds')
  const d = response.data
  return Array.isArray(d) ? d : []
}

export async function approveAdminRefund(id: string): Promise<AdminRefundRequest> {
  const response = await api.patch(`/admin/refunds/${id}/approve`)
  return response.data
}

export async function denyAdminRefund(id: string): Promise<AdminRefundRequest> {
  const response = await api.patch(`/admin/refunds/${id}/deny`)
  return response.data
}

export async function getSettlementSummary(): Promise<SettlementSummary> {
  const response = await api.get('/admin/settlement/summary')
  const d = (response.data as any)?.data ?? {}
  return {
    totalPurchasesCount: Number(d.totalPurchasesCount ?? 0),
    totalPointsPurchased: Number(d.totalPointsPurchased ?? 0),
    pendingRefundsCount: Number(d.pendingRefundsCount ?? 0),
    pendingSettlementsCount: Number(d.pendingSettlementsCount ?? 0),
    pendingSettlementsPoints: Number(d.pendingSettlementsPoints ?? 0),
    pendingSettlementsNetAmount: Number(d.pendingSettlementsNetAmount ?? 0),
    totalWallets: Number(d.totalWallets ?? 0),
    totalSpendableBalance: Number(d.totalSpendableBalance ?? 0),
    totalRedeemableBalance: Number(d.totalRedeemableBalance ?? 0),
    totalPendingEarnings: Number(d.totalPendingEarnings ?? 0),
    recentPurchases: Array.isArray(d.recentPurchases) ? d.recentPurchases : [],
  }
}

export async function getSettlementPurchases(params: {
  page?: number
  limit?: number
  platform?: string
} = {}): Promise<SettlementPurchasesResponse> {
  const response = await api.get('/admin/settlement/purchases', { params })
  const d = response.data as any
  return {
    ok: Boolean(d?.ok ?? true),
    page: Number(d?.page ?? 1),
    limit: Number(d?.limit ?? 20),
    total: Number(d?.total ?? 0),
    totalPages: Number(d?.totalPages ?? 1),
    items: Array.isArray(d?.items) ? d.items : [],
  }
}

export async function getSettlementLedger(take = 20): Promise<WalletLedgerItem[]> {
  const response = await api.get('/admin/settlement/ledger', { params: { take } })
  const d = response.data as any
  return Array.isArray(d?.items) ? d.items : []
}

export async function getSettlementRequests(params: {
  page?: number
  limit?: number
  status?: string
  search?: string
} = {}): Promise<SettlementRequestsResponse> {
  const response = await api.get('/admin/settlement/requests', { params })
  const d = response.data as any
  return {
    ok: Boolean(d?.ok ?? true),
    page: Number(d?.page ?? 1),
    limit: Number(d?.limit ?? 15),
    total: Number(d?.total ?? 0),
    totalPages: Number(d?.totalPages ?? 1),
    items: Array.isArray(d?.items) ? d.items : [],
  }
}

export async function approveSettlementRequest(
  id: string,
  adminMemo?: string,
): Promise<SettlementRequestItem> {
  const response = await api.post(`/admin/settlement/requests/${id}/approve`, { adminMemo })
  return response.data
}

export async function rejectSettlementRequest(
  id: string,
  reason: string,
): Promise<SettlementRequestItem> {
  const response = await api.post(`/admin/settlement/requests/${id}/reject`, { reason })
  return response.data
}

// =============================================
// Admin Live Rooms & Moderation
// =============================================

export interface AdminLiveRoom {
  id: string
  title: string
  category: string
  status: string
  viewerCount: number
  totalLikes: number
  totalGiftsPoints: number
  coverUri: string | null
  startedAt: string
  endedAt: string | null
  host: {
    id: string
    name: string
    avatar: string | null
    region: string
    headline: string | null
    targetAccountId?: string | null
  }
}

export interface AdminLiveSummary {
  totalRooms: number
  activeLiveRooms: number
  totalGiftPoints: number
  totalLikes: number
  currentViewers: number
}

export interface AdminLiveRoomsResponse {
  ok: boolean
  page: number
  limit: number
  total: number
  totalPages: number
  items: AdminLiveRoom[]
}

export interface AdminLiveMessage {
  id: string
  roomId: string
  type: string
  content: string
  giftPoints: number | null
  createdAt: string
  sender: {
    id: string
    name: string
    avatar: string | null
  }
}

export async function getAdminLiveSummary(): Promise<AdminLiveSummary> {
  const response = await api.get('/live/admin/summary')
  const d = (response.data as any)?.data ?? {}
  return {
    totalRooms: Number(d.totalRooms ?? 0),
    activeLiveRooms: Number(d.activeLiveRooms ?? 0),
    totalGiftPoints: Number(d.totalGiftPoints ?? 0),
    totalLikes: Number(d.totalLikes ?? 0),
    currentViewers: Number(d.currentViewers ?? 0),
  }
}

export async function getAdminLiveRooms(params: {
  status?: string
  page?: number
  limit?: number
} = {}): Promise<AdminLiveRoomsResponse> {
  const response = await api.get('/live/admin/rooms', { params })
  const d = response.data as any
  return {
    ok: Boolean(d?.ok ?? true),
    page: Number(d?.page ?? 1),
    limit: Number(d?.limit ?? 20),
    total: Number(d?.total ?? 0),
    totalPages: Number(d?.totalPages ?? 1),
    items: Array.isArray(d?.items) ? d.items : [],
  }
}

export async function forceEndAdminLiveRoom(id: string, reason?: string): Promise<AdminLiveRoom> {
  const response = await api.post(`/live/admin/rooms/${id}/force-end`, { reason })
  return (response.data as any)?.data ?? response.data
}

export async function getAdminLiveMessages(roomId: string, limit = 50): Promise<AdminLiveMessage[]> {
  const response = await api.get(`/live/rooms/${roomId}/messages`, { params: { limit } })
  const d = (response.data as any)?.data
  return Array.isArray(d) ? d : []
}

// =============================================
// Admin Permissions, Approvals & Audit
// =============================================

export interface AdminApprovalItem {
  id: string
  action: string
  target: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  createdAt: string
  decidedAt?: string | null
  decisionReason?: string | null
  expiresAt?: string | null
  requestedBy: {
    id: string
    email: string
    displayName?: string
  }
  decidedBy?: {
    id: string
    email: string
    displayName?: string
  } | null
}

export interface AdminAuditLogItem {
  id: string
  action: string
  target: string
  reason?: string | null
  notes?: string | null
  createdAt: string
  actor?: {
    id: string
    email: string
    displayName?: string
  } | null
  context?: any
}

export interface AdminProfileItem {
  userId: string
  role: 'SUPER_ADMIN' | 'MANAGER' | 'MODERATOR' | 'SUPPORT' | 'EDITOR' | 'VIEWER' | string
  status: 'ACTIVE' | 'SUSPENDED' | string
  permissions: string[]
  twoFactorEnabled: boolean
  lastLoginAt?: string | null
  createdAt: string
  user?: {
    id: string
    email?: string
    displayName?: string
    status: string
    role: string
  } | null
}

export async function getAdminApprovals(status?: string): Promise<AdminApprovalItem[]> {
  const response = await api.get('/admin/approvals', { params: { status } })
  const d = response.data as any
  return Array.isArray(d?.items) ? d.items : Array.isArray(d?.data) ? d.data : []
}

export async function createAdminApprovalRequest(payload: {
  action: string
  target: string
  reason: string
  context?: any
  metadata?: any
  expiresAt?: string
}): Promise<AdminApprovalItem> {
  const response = await api.post('/admin/approvals', payload)
  return (response.data as any)?.data ?? response.data
}

export async function decideAdminApproval(
  id: string,
  decision: 'APPROVED' | 'REJECTED',
  reason?: string,
): Promise<AdminApprovalItem> {
  const response = await api.patch(`/admin/approvals/${id}/decision`, { decision, reason })
  return (response.data as any)?.data ?? response.data
}

export async function getAdminAuditLogs(limit = 50): Promise<AdminAuditLogItem[]> {
  const response = await api.get('/admin/approvals/audit-logs', { params: { limit } })
  const d = response.data as any
  return Array.isArray(d?.items) ? d.items : []
}

export async function getAdminProfiles(): Promise<AdminProfileItem[]> {
  const response = await api.get('/admin/approvals/profiles')
  const d = response.data as any
  return Array.isArray(d?.items) ? d.items : []
}

export async function updateAdminProfile(
  userId: string,
  payload: { role?: string; status?: string; permissions?: string[] },
): Promise<AdminProfileItem> {
  const response = await api.patch(`/admin/approvals/profiles/${userId}`, payload)
  return (response.data as any)?.data ?? response.data
}


// =============================================
// Admin Ads & Rewards
// =============================================

export interface AdsRewardsStats {
  totalRewardEvents: number;
  totalPointsDistributed: number;
  totalEligibleUsers: number;
  activeCampaignsCount: number;
}

export interface AdsRewardsPolicies {
  dailyAdLimit: number;
  pointsPerAd: number;
  admobAppId: string;
  admobUnitId: string;
  attendancePoints: number;
  referralPoints: number;
  enabled: boolean;
}

export interface AdsRewardsOverviewResponse {
  stats: AdsRewardsStats;
  policies: AdsRewardsPolicies;
  recentRewards: {
    id: string;
    deltaSpendable: number;
    createdAt: string;
    kind: string;
    source: string;
    wallet?: {
      activityAccount?: {
        displayName?: string;
        handle?: string;
      } | null;
    } | null;
  }[];
}

export async function getAdsRewardsOverview(): Promise<AdsRewardsOverviewResponse> {
  const response = await api.get('/admin/ads-rewards/overview');
  const d = (response.data as any)?.data ?? {};
  return {
    stats: {
      totalRewardEvents: Number(d.stats?.totalRewardEvents ?? 0),
      totalPointsDistributed: Number(d.stats?.totalPointsDistributed ?? 0),
      totalEligibleUsers: Number(d.stats?.totalEligibleUsers ?? 0),
      activeCampaignsCount: Number(d.stats?.activeCampaignsCount ?? 0),
    },
    policies: {
      dailyAdLimit: Number(d.policies?.dailyAdLimit ?? 5),
      pointsPerAd: Number(d.policies?.pointsPerAd ?? 10),
      admobAppId: String(d.policies?.admobAppId ?? ''),
      admobUnitId: String(d.policies?.admobUnitId ?? ''),
      attendancePoints: Number(d.policies?.attendancePoints ?? 5),
      referralPoints: Number(d.policies?.referralPoints ?? 50),
      enabled: Boolean(d.policies?.enabled ?? true),
    },
    recentRewards: Array.isArray(d.recentRewards) ? d.recentRewards : [],
  };
}

export async function updateAdsRewardsPolicies(payload: Partial<AdsRewardsPolicies>): Promise<any> {
  const response = await api.patch('/admin/ads-rewards/policies', payload);
  return (response.data as any)?.data ?? response.data;
}

// ===== 선물(Gift) 관리 API =====
export interface AdminGiftItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  animationUrl?: string | null;
  animationType: string;
  category: string;
  sortOrder: number;
  amount: number;
  points: number;
  pricePoints: number;
  isActive: boolean;
  chatEnabled: boolean;
  liveEnabled: boolean;
  isNew: boolean;
}

export interface AdminGiftStats {
  totalGifts: number;
  activeGifts: number;
  totalTransactions: number;
  totalPointsSent: number;
}

export async function getAdminGifts(): Promise<AdminGiftItem[]> {
  const response = await api.get('/gifts/admin/list');
  const d = response.data;
  return Array.isArray(d?.data) ? d.data : Array.isArray(d?.items) ? d.items : [];
}

export async function getAdminGiftStats(): Promise<AdminGiftStats> {
  const response = await api.get('/gifts/admin/stats');
  return (response.data as any)?.data ?? {
    totalGifts: 0,
    activeGifts: 0,
    totalTransactions: 0,
    totalPointsSent: 0,
  };
}

export async function createAdminGift(payload: Partial<AdminGiftItem>): Promise<AdminGiftItem> {
  const response = await api.post('/gifts/admin', payload);
  return (response.data as any)?.data ?? response.data;
}

export async function updateAdminGift(id: string, payload: Partial<AdminGiftItem>): Promise<AdminGiftItem> {
  const response = await api.patch(`/gifts/admin/${id}`, payload);
  return (response.data as any)?.data ?? response.data;
}

export async function deleteAdminGift(id: string): Promise<boolean> {
  const response = await api.delete(`/gifts/admin/${id}`);
  return (response.data as any)?.ok ?? true;
}

// ===== 자체 광고(Advertisement) 관리 API =====
export interface AdminAdvertisementItem {
  id: string;
  title: string;
  description?: string | null;
  imageUrl: string;
  targetUrl?: string | null;
  placement: string;
  priority: number;
  isActive: boolean;
  rewardPoints: number;
  clickCount: number;
  impressionCount: number;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminAdStats {
  totalAds: number;
  activeAds: number;
  totalClicks: number;
  totalImpressions: number;
}

export async function getAdminAds(placement?: string): Promise<AdminAdvertisementItem[]> {
  const params = placement && placement !== 'ALL' ? { placement } : {};
  const response = await api.get('/advertisements/admin/list', { params });
  const d = response.data;
  return Array.isArray(d?.data) ? d.data : Array.isArray(d?.items) ? d.items : [];
}

export async function getAdminAdStats(): Promise<AdminAdStats> {
  const response = await api.get('/advertisements/admin/stats');
  return (response.data as any)?.data ?? {
    totalAds: 0,
    activeAds: 0,
    totalClicks: 0,
    totalImpressions: 0,
  };
}

export async function createAdminAd(payload: Partial<AdminAdvertisementItem>): Promise<AdminAdvertisementItem> {
  const response = await api.post('/advertisements/admin', payload);
  return (response.data as any)?.data ?? response.data;
}

export async function updateAdminAd(id: string, payload: Partial<AdminAdvertisementItem>): Promise<AdminAdvertisementItem> {
  const response = await api.patch(`/advertisements/admin/${id}`, payload);
  return (response.data as any)?.data ?? response.data;
}

export async function deleteAdminAd(id: string): Promise<boolean> {
  const response = await api.delete(`/advertisements/admin/${id}`);
  return (response.data as any)?.ok ?? true;
}

