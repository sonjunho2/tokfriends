// tokfriends-admin/admin-web/src/lib/api.ts
import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
  isAxiosError,
} from 'axios'

import {
  AdminAuthError,
  authenticateAdminAccount,
  createAdminAccount,
  deleteAdminAccount,
  ensureDefaultSuperAdminAccount,
  getAuditMemoSnapshot,
  listAdminAccounts,
  saveAuditMemoSnapshot,
  updateAdminAccount,
  updateAdminPassword,
  type AdminAccount,
} from './admin-auth'

import { buildRoutePath } from './routeMap'
import {
  ensureStringId,
  normalizeAdminUserDetail,
  normalizeAdminUserSummaryList,
  unwrapArray,
} from './normalize'

const ENV_BASE_CANDIDATES = [
  process.env.TOK_API_BASE_URL,
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_API_BASE_URL,
  process.env.REACT_APP_API_URL,
  process.env.VITE_API_URL,
].filter((value): value is string => Boolean(value && value.trim().length > 0))

const RAW_BASE = (ENV_BASE_CANDIDATES[0] ?? '').trim()
const API_BASE_URL = RAW_BASE.replace(/\/+$/, '')
const API_ORIGIN =
  API_BASE_URL && /^https?:\/\//i.test(API_BASE_URL)
    ? new URL(API_BASE_URL).origin
    : ''
const SHOULD_SEND_CREDENTIALS =
  typeof window !== 'undefined' && API_ORIGIN ? API_ORIGIN === window.location.origin : false

if (!RAW_BASE) {
  throw new Error(
    '[TokFriends Admin] API_BASE_URL is undefined. Set NEXT_PUBLIC_API_BASE_URL in your .env file.'
  )
} else if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log('[TokFriends Admin] API_BASE_URL =', API_BASE_URL, '(env)')
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: SHOULD_SEND_CREDENTIALS,
  timeout: 8000,
})

const TOKEN_KEY = 'tokfriends_admin_token'
const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(ACCESS_KEY) || null
}
export function setAccessToken(token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ACCESS_KEY, token)
}
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_KEY)
}
export function setRefreshToken(token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(REFRESH_KEY, token)
}
export function clearAuthStorage() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem('user')
}

/** 표준 로그아웃: 저장 토큰 삭제 후 /login 이동 */
export function logoutToLogin() {
  clearAuthStorage()
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  config.headers = config.headers || {}

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  if (!config.headers['Accept']) {
    config.headers['Accept'] = config.responseType === 'blob' ? 'application/octet-stream' : 'application/json'
  }

  // 진단 로그: 토큰 부착 여부(앞 10자만)
  if (typeof window !== 'undefined') {
    const short = token ? token.slice(0, 10) + '…' : '(no token)'
    const method = (config.method || 'GET').toUpperCase()
    const fullUrl = `${config.baseURL ?? ''}${config.url ?? ''}`
    // eslint-disable-next-line no-console
    console.info('[TokFriends Admin] ->', method, fullUrl, '| auth =', short)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const status = error.response?.status
    const message = (error.response?.data as any)?.message || error.message || ''

    // 안전하게 전체 URL 구성 (strict 모드 대응)
    const fullUrl = `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`

    if (status === 401) {
      // eslint-disable-next-line no-console
      console.warn('[TokFriends Admin] 401 from', fullUrl, '| message =', message)
      // refresh 플로우가 없다면 즉시 재로그인
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

// 공통 POST 헬퍼들
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

export function saveLoginResult(payload: any) {
  const token = payload?.token || payload?.access_token
  const refresh = payload?.refresh_token
  const user = payload?.user

  if (token) setAccessToken(token)
  if (refresh) setRefreshToken(refresh)
  if (typeof window !== 'undefined' && user) {
    localStorage.setItem('user', JSON.stringify(user))
  }
}

// 대시보드 메트릭스
export async function getDashboardMetrics() {
  const route = buildRoutePath('dashboard.metrics')
  const res = await api.get(route)
  return res.data
}

// ---------------------------------------------------------------------------
// 인증 & 헬스체크
// ---------------------------------------------------------------------------

export interface LoginWithEmailRequest {
  email: string
  password: string
}

export interface LoginWithEmailResponse {
  access_token?: string
  token?: string
  refresh_token?: string
  user?: unknown
  [key: string]: unknown
}

export async function loginWithEmail(payload: LoginWithEmailRequest) {
  const route = buildRoutePath('auth.login.email')
  try {
    const response = await postJson<LoginWithEmailResponse>(route, payload)
    return response.data
  } catch (error) {
    if (isAxiosError(error)) {
      try {
        const result = authenticateAdminAccount(payload.email, payload.password)
        return {
          token: result.accessToken,
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
          user: {
            id: result.account.id,
            email: result.account.email,
            name: result.account.name,
            role: result.account.role,
            permissions: result.account.permissions,
            lastLoginAt: result.account.lastLoginAt,
          },
        }
      } catch (authError) {
        if (authError instanceof AdminAuthError) {
          throw authError
        }
      }
    }
    throw error
  }
}

export async function checkHealth() {
  const route = buildRoutePath('auth.health')
  const response = await api.get(route)
  return response.data
}

// ---------------------------------------------------------------------------
// 유틸리티
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 사용자
// ---------------------------------------------------------------------------

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
  const searchTerms = [query, phoneNumber, nickname]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length > 0)

  const mapped: Record<string, unknown> = { ...rest }

  if (searchTerms.length > 0) {
    mapped.search = searchTerms.join(' ')
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
  const response = await api.put(route, { status })
  const normalized = normalizeAdminUserDetail(response.data, userId)
  return normalized as UserDetail
}

// ---------------------------------------------------------------------------
// 신고 / 차단
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
// 토픽 / 게시글
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
// 공지 / 배너
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
// 선물 / 아이템
// ---------------------------------------------------------------------------

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
// 약관 / 정책 문서
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
// 휴대폰 인증
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
// 포인트 상품
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
// 매칭 & 탐색
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
// 채팅 & 안전
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
// 분석 & 리포트
// ---------------------------------------------------------------------------

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
// 설정 & 통합
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

function adaptAccountToTeamMember(account: AdminAccount): AdminTeamMember {
  return {
    id: account.id,
    email: account.email,
    username: account.username,
    name: account.name,
    role: account.role,
    status: account.status,
    twoFactor: account.twoFactorEnabled,
    permissions: [...account.permissions],
    lastLoginAt: account.lastLoginAt,
  }
}

export async function getAdminSettingsSnapshot(params: Record<string, unknown> = {}) {
  try {
    const response = await api.get('/admin/settings/snapshot', { params })
    return normalizeAdminSettings(response.data)
  } catch (error) {
    if (isAxiosError(error)) {
      ensureDefaultSuperAdminAccount()
      const accounts = listAdminAccounts()
      return {
        members: accounts.map((account) => adaptAccountToTeamMember(account)),
        featureFlags: [],
        integrations: [],
        auditMemo: getAuditMemoSnapshot(),
      }
    }
    throw error
  }
}

export async function createAdminTeamMember(payload: Record<string, unknown>) {
  try {
    const response = await api.post('/admin/settings/team', payload)
    return normalizeAdminSettings({ members: [response.data] }).members[0]
  } catch (error) {
    if (isAxiosError(error)) {
      try {
        const rawRole = typeof payload.role === 'string' ? payload.role.toUpperCase() : undefined
        const rawStatus = typeof payload.status === 'string' ? payload.status.toUpperCase() : undefined
        const created = createAdminAccount({
          email: String(payload.email ?? payload.username ?? ''),
          name: typeof payload.name === 'string' ? payload.name : String(payload.displayName ?? payload.email ?? ''),
          role: (rawRole as any) ?? 'MANAGER',
          status: (rawStatus as any) ?? 'ACTIVE',
          password: String(payload.password ?? ''),
          permissions: Array.isArray(payload.permissions)
            ? (payload.permissions as unknown[]).map((value) => String(value))
            : undefined,
          twoFactorEnabled: Boolean(payload.twoFactor ?? payload.twoFactorEnabled ?? false),
        })
        return adaptAccountToTeamMember(created)
      } catch (fallbackError) {
        throw fallbackError
      }
    }
    throw error
  }
}

export async function updateAdminTeamMember(memberId: string, payload: Record<string, unknown>) {
  try {
    const response = await api.patch(`/admin/settings/team/${memberId}`, payload)
    return normalizeAdminSettings({ members: [response.data] }).members[0]
  } catch (error) {
    if (isAxiosError(error)) {
      const updated = updateAdminAccount(memberId, {
        name: typeof payload.name === 'string' ? payload.name : undefined,
        role: typeof payload.role === 'string' ? (payload.role as string).toUpperCase() as any : undefined,
        status: typeof payload.status === 'string' ? (payload.status as string).toUpperCase() as any : undefined,
        permissions: Array.isArray(payload.permissions)
          ? (payload.permissions as unknown[]).map((value) => String(value))
          : undefined,
        twoFactorEnabled: typeof payload.twoFactor === 'boolean' ? payload.twoFactor : undefined,
        email: typeof payload.email === 'string' ? payload.email : undefined,
      })
      return adaptAccountToTeamMember(updated)
    }
    throw error
  }
}

export async function deleteAdminTeamMember(memberId: string) {
  try {
    await api.delete(`/admin/settings/team/${memberId}`)
  } catch (error) {
    if (isAxiosError(error)) {
      deleteAdminAccount(memberId)
    } else {
      throw error
    }
  }
  return { success: true }
}

export async function updateAdminTeamMemberPassword(memberId: string, payload: { password: string }) {
  try {
    const response = await api.patch(`/admin/settings/team/${memberId}/password`, payload)
    return normalizeAdminSettings({ members: [response.data] }).members[0]
  } catch (error) {
    if (isAxiosError(error)) {
      updateAdminPassword(memberId, payload.password)
      const account = listAdminAccounts().find((candidate) => candidate.id === memberId)
      return account ? adaptAccountToTeamMember(account) : undefined
    }
    throw error
  }
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
  try {
    const response = await api.post('/admin/settings/audit-log', payload)
    return (response.data as { memo?: string } | undefined)?.memo ?? payload.memo
  } catch (error) {
    if (isAxiosError(error)) {
      saveAuditMemoSnapshot(payload.memo)
      return payload.memo
    }
    throw error
  }
}

function normalizeAdminOverrideCodes(input: unknown): string[] {
  if (!input) {
    return []
  }

  if (Array.isArray(input)) {
    return input.map((code) => String(code).trim()).filter((code) => code.length > 0)
  }

  if (typeof input === 'string') {
    return input
      .split(',')
      .map((code) => code.trim())
      .filter((code) => code.length > 0)
  }

  if (typeof input === 'object' && input) {
    const candidate = (input as Record<string, unknown>).codes
    return normalizeAdminOverrideCodes(candidate)
  }

  return []
}

export async function getAdminOverrideCodes() {
  const route = buildRoutePath('admin.overrideCodes.list')
  const response = await api.get(route)
  return normalizeAdminOverrideCodes(response.data)
}

export async function updateAdminOverrideCodes(codes: string[]) {
  const route = buildRoutePath('admin.overrideCodes.update')
  const response = await api.put(route, { codes })
  return normalizeAdminOverrideCodes(response.data)
}
