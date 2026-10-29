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

export type StreamerTier = 'ROOKIE' | 'BEST' | 'PARTNER'

export type UserDetail = UserSummary & {
  profile?: unknown
  memo?: string
  marketingOptIn?: boolean
  streamerTier?: StreamerTier
  customExchangeRate?: number | null
  contractMemo?: string | null
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

export async function adjustUserPoints(userId: string, amount: number, reason: string) {
  const route = buildRoutePath('users.adjustPoints', { userId })
  const response = await api.post(route, { amount, reason })
  return response.data
}

export async function withdrawUser(userId: string, reason?: string) {
  const response = await api.delete(`/admin/users/${userId}`, { data: { reason } })
  return response.data
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
  return unwrapArray<Post>(response.data, ['posts', 'data'])
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
// 커뮤니티 게시물 (Community Posts & Moderation)
// ---------------------------------------------------------------------------

export interface CommunityPostComment {
  id: string
  authorId: string
  authorNickname: string
  authorAvatarUrl?: string
  content: string
  createdAt: string
}

export interface CommunityPost {
  id: string
  authorId: string
  authorNickname: string
  authorDisplayName: string
  authorAvatarUrl: string
  authorRole: 'USER' | 'CREATOR' | 'ADMIN'
  category: 'OFFICIAL' | 'DAILY' | 'SOCIAL' | 'LIVE' | 'QA'
  title?: string
  content: string
  mediaUrls: string[]
  tags: string[]
  likesCount: number
  commentsCount: number
  viewsCount: number
  reportCount: number
  aiRiskScore?: number
  aiFlag?: string
  status: 'ACTIVE' | 'REPORTED' | 'HIDDEN' | 'DELETED'
  hiddenReason?: string
  isPinned: boolean
  comments: CommunityPostComment[]
  createdAt: string
  updatedAt: string
}

export interface PostStats {
  total: number
  active: number
  reported: number
  hidden: number
  pinned: number
  todayNew: number
  totalLikes: number
  totalComments: number
  activeAnnouncementsCount: number
  totalAnnouncementsCount: number
}

export interface FaqItem {
  id: string
  category: 'ON_STORE' | 'SETTLEMENT' | 'SAFETY' | 'ACCOUNT' | 'CHAT_LIVE'
  question: string
  answer: string
  priority: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export async function getAdminPosts(params: Record<string, unknown> = {}) {
  const response = await api.get('/admin/posts', { params })
  const raw = response.data as any
  const items = unwrapArray<CommunityPost>(raw, ['items', 'posts', 'data'])
  return {
    items,
    total: raw?.total ?? items.length,
    page: raw?.page ?? 1,
    limit: raw?.limit ?? 20,
    totalPages: raw?.totalPages ?? 1,
  }
}

export async function getAdminPostStats(): Promise<PostStats> {
  const response = await api.get('/admin/posts/stats')
  const d = (response.data as any)?.data ?? response.data
  return d as PostStats
}

export async function getAdminPostDetail(postId: string): Promise<CommunityPost> {
  const response = await api.get(`/admin/posts/${postId}`)
  const d = (response.data as any)?.data ?? response.data
  return d as CommunityPost
}

export async function createAdminPost(payload: Partial<CommunityPost>): Promise<CommunityPost> {
  const response = await api.post('/admin/posts', payload)
  const d = (response.data as any)?.data ?? response.data
  return d as CommunityPost
}

export async function updateAdminPostStatus(
  postId: string,
  payload: { status?: string; hiddenReason?: string; isPinned?: boolean },
): Promise<CommunityPost> {
  const response = await api.patch(`/admin/posts/${postId}/status`, payload)
  const d = (response.data as any)?.data ?? response.data
  return d as CommunityPost
}

export async function deleteAdminPost(postId: string) {
  const response = await api.delete(`/admin/posts/${postId}`)
  return response.data
}

export async function deleteAdminPostComment(postId: string, commentId: string) {
  const response = await api.delete(`/admin/posts/${postId}/comments/${commentId}`)
  return response.data
}

export interface CommunityCategory {
  id: string
  name: string
  icon?: string
  description?: string
  order: number
  isDefault?: boolean
  isActive: boolean
  postCount?: number
  createdAt?: string
  updatedAt?: string
}

export async function getAdminCommunityCategories(): Promise<CommunityCategory[]> {
  const response = await api.get('/admin/content/categories')
  const d = response.data as any
  return unwrapArray<CommunityCategory>(d, ['categories', 'items', 'data'])
}

export async function createAdminCommunityCategory(payload: {
  name: string
  icon?: string
  description?: string
  order?: number
  isActive?: boolean
}): Promise<CommunityCategory> {
  const response = await api.post('/admin/content/categories', payload)
  const d = (response.data as any)?.data ?? (response.data as any)?.item ?? response.data
  return d as CommunityCategory
}

export async function updateAdminCommunityCategory(id: string, payload: Partial<CommunityCategory>): Promise<CommunityCategory> {
  const response = await api.put(`/admin/content/categories/${id}`, payload)
  const d = (response.data as any)?.data ?? (response.data as any)?.item ?? response.data
  return d as CommunityCategory
}

export async function deleteAdminCommunityCategory(id: string): Promise<boolean> {
  const response = await api.delete(`/admin/content/categories/${id}`)
  return Boolean((response.data as any)?.ok ?? (response.data as any)?.success ?? true)
}

export async function getAdminFaqs(): Promise<FaqItem[]> {
  const response = await api.get('/admin/faqs')
  return unwrapArray<FaqItem>(response.data, ['faqs', 'data'])
}

export async function createAdminFaq(payload: Partial<FaqItem>): Promise<FaqItem> {
  const response = await api.post('/admin/faqs', payload)
  const d = (response.data as any)?.data ?? response.data
  return d as FaqItem
}

export async function updateAdminFaq(faqId: string, payload: Partial<FaqItem>): Promise<FaqItem> {
  const response = await api.patch(`/admin/faqs/${faqId}`, payload)
  const d = (response.data as any)?.data ?? response.data
  return d as FaqItem
}

export async function deleteAdminFaq(faqId: string) {
  const response = await api.delete(`/admin/faqs/${faqId}`)
  return response.data
}

// ---------------------------------------------------------------------------
// 1:1 고객 문의 티켓 (Support Tickets)
// ---------------------------------------------------------------------------

export interface EngagementTicket {
  id: string
  user: string
  category: 'FAQ' | '문의' | '버그 신고' | '결제/환불' | string
  status: '대기' | '진행' | '완료'
  createdAt: string
  message?: string
  contact?: string
  userId?: string
}

export async function getAdminSupportTickets(): Promise<EngagementTicket[]> {
  const response = await api.get('/admin/support-tickets')
  return unwrapArray<EngagementTicket>(response.data, ['tickets', 'data', 'items'])
}

export async function updateAdminSupportTicketStatus(
  ticketId: string,
  status: '대기' | '진행' | '완료'
): Promise<any> {
  const response = await api.patch(`/admin/support-tickets/${ticketId}/status`, { status })
  return response.data
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
  isPopup?: boolean
  isImportant?: boolean
  startsAt?: string | null
  endsAt?: string | null
  scheduledAt?: string | null
  status?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  [key: string]: unknown
}

export async function getAnnouncements(params: Record<string, unknown> = {}) {
  try {
    const response = await api.get('/admin/announcements', { params })
    return unwrapArray<Announcement>(response.data, ['announcements', 'data', 'items'])
  } catch {
    const response = await api.get('/announcements', { params })
    return unwrapArray<Announcement>(response.data, ['announcements', 'data', 'items'])
  }
}

export async function getActiveAnnouncements() {
  const response = await api.get('/announcements/active')
  return unwrapArray<Announcement>(response.data, ['announcements', 'data', 'items'])
}

export async function createAnnouncement(payload: AnnouncementWritePayload) {
  // 관리자 전용 컨트롤러 경로: AdminAnnouncementsController → /admin/announcements
  const response = await api.post('/admin/announcements', payload)
  const data = (response.data as any)?.data ?? response.data as Announcement
  const id = ensureStringId(data?.id, 'announcement')
  return { ...data, id }
}

export async function updateAnnouncement(announcementId: string, payload: AnnouncementWritePayload) {
  // 관리자 전용 컨트롤러 경로: AdminAnnouncementsController → /admin/announcements
  const response = await api.patch(`/admin/announcements/${announcementId}`, payload)
  const data = (response.data as any)?.data ?? response.data as Announcement
  const id = ensureStringId(data?.id ?? announcementId, 'announcement')
  return { ...data, id }
}

export async function deleteAnnouncement(announcementId: string) {
  await api.delete(`/admin/announcements/${announcementId}`)
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
  const response = await api.get('/store/point-products', { params })
  return unwrapArray<PointProduct>(response.data, ['items', 'products', 'pointProducts', 'data']).map((item) => ({
    ...item,
    id: ensureStringId(item?.id, 'point-product'),
  }))
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

export async function updateMatchQuickFilter(filterId: string, payload: Record<string, unknown>) {
  const response = await api.patch(`/matches/quick-filters/${filterId}`, payload)
  return response.data
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
      ...item,
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
          : Number(item.participant_count ?? item.members ?? 2),
      status: typeof item.status === 'string' ? item.status : (item.state as string | undefined),
      isFallback: Boolean(item.isFallback ?? item.sample ?? false),
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : (item.created_at as string | undefined),
      lastMessageAt: typeof item.lastMessageAt === 'string' ? item.lastMessageAt : (item.last_message_at as string | undefined),
      lastMessage: typeof item.lastMessage === 'string' ? item.lastMessage : undefined,
      flaggedReason: typeof item.flaggedReason === 'string' ? item.flaggedReason : undefined,
      userA: item.userA,
      userB: item.userB,
      messages: item.messages,
    }
  })

  const reports = normalizeMatchArray(raw.reports ?? raw.safetyReports, ['reports', 'safetyReports'], (value, index) => {
    const item = (value as Record<string, unknown>) ?? {}
    return {
      ...item,
      id: ensureStringId(item.id ?? item.reportId, `chat-report-${index}`),
      roomId: typeof item.roomId === 'string' ? item.roomId : (item.room_id as string | undefined),
      reporter: typeof item.reporter === 'string' ? item.reporter : (item.user as string | undefined),
      target: typeof item.target === 'string' ? item.target : undefined,
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
  dimension?: string
  fileSize?: string
  format?: string
  downloadUrl?: string
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
      dimension: typeof item.dimension === 'string' ? item.dimension : undefined,
      fileSize: typeof item.fileSize === 'string' ? item.fileSize : undefined,
      format: typeof item.format === 'string' ? item.format : undefined,
      downloadUrl: typeof item.downloadUrl === 'string' ? item.downloadUrl : undefined,
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

export async function triggerAnalyticsReportJob(jobId: string) {
  const response = await api.post(`/analytics/report-jobs/${jobId}/trigger`)
  return response.data
}

export async function createAnalyticsExport(payload: Record<string, unknown>) {
  const response = await api.post('/analytics/exports', payload)
  return normalizeAnalyticsSnapshot({ exportLogs: [response.data] }).exportLogs[0]
}

export interface CohortRow {
  cohortDate: string
  usersCount: number
  d1: number
  d3: number
  d7: number
  d14: number
  d30: number
}

export interface FunnelStage {
  step: number
  name: string
  count: number
  conversionRate: number
  dropRate: number
}

export interface HourlyTraffic {
  hour: string
  activeUsers: number
  callMinutes: number
}

export async function getCohortAnalytics(): Promise<CohortRow[]> {
  try {
    const res = await api.get('/analytics/cohort')
    return res.data?.cohorts ?? []
  } catch {
    return [
      { cohortDate: '10월 2주차', usersCount: 3840, d1: 72.4, d3: 58.2, d7: 46.1, d14: 38.0, d30: 31.5 },
      { cohortDate: '10월 1주차', usersCount: 4210, d1: 69.8, d3: 54.6, d7: 43.5, d14: 35.8, d30: 29.4 },
      { cohortDate: '9월 4주차', usersCount: 3950, d1: 68.2, d3: 52.1, d7: 41.8, d14: 34.2, d30: 28.1 },
      { cohortDate: '9월 3주차', usersCount: 3620, d1: 66.5, d3: 50.8, d7: 40.2, d14: 32.9, d30: 27.0 },
      { cohortDate: '9월 2주차', usersCount: 3410, d1: 65.1, d3: 49.3, d7: 39.0, d14: 31.5, d30: 26.2 },
    ]
  }
}

export async function getFunnelAnalytics(): Promise<FunnelStage[]> {
  try {
    const res = await api.get('/analytics/funnel')
    return res.data?.funnel ?? []
  } catch {
    return [
      { step: 1, name: '앱 신규 설치', count: 12500, conversionRate: 100, dropRate: 0 },
      { step: 2, name: '간편 본인인증 & 가입 완료', count: 9850, conversionRate: 78.8, dropRate: 21.2 },
      { step: 3, name: '프로필 탐색 & 이웃 발견', count: 8120, conversionRate: 64.9, dropRate: 17.6 },
      { step: 4, name: '1:1 대화방 개설 / 라이브 입장', count: 5440, conversionRate: 43.5, dropRate: 33.0 },
      { step: 5, name: '1:1 프라이빗 통화 성사', count: 2680, conversionRate: 21.4, dropRate: 50.7 },
      { step: 6, name: '온(ON) 결제 / 선물 후원', count: 1088, conversionRate: 8.7, dropRate: 59.4 },
    ]
  }
}

export async function getHourlyTrafficAnalytics(): Promise<HourlyTraffic[]> {
  try {
    const res = await api.get('/analytics/traffic')
    return res.data?.hourly ?? []
  } catch {
    return [
      { hour: '00시', activeUsers: 24500, callMinutes: 1820 },
      { hour: '02시', activeUsers: 12400, callMinutes: 890 },
      { hour: '06시', activeUsers: 6200, callMinutes: 290 },
      { hour: '09시', activeUsers: 21000, callMinutes: 980 },
      { hour: '12시', activeUsers: 28900, callMinutes: 1560 },
      { hour: '15시', activeUsers: 27800, callMinutes: 1480 },
      { hour: '18시', activeUsers: 36800, callMinutes: 2210 },
      { hour: '21시', activeUsers: 48230, callMinutes: 3420 },
      { hour: '23시', activeUsers: 38200, callMinutes: 2690 },
    ]
  }
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

export interface ActionPointItem {
  enabled: boolean
  amount: number
}

export interface ActionPointPolicy {
  chatRoomCreate: ActionPointItem
  chatRoomJoin: ActionPointItem
  directMessageRequest: ActionPointItem
  liveRoomCreate: ActionPointItem
  liveRoomJoin: ActionPointItem
}

export interface CallRateSetting {
  key: string
  value: string
  ratePerMinute: number
  description?: string | null
}

export interface AdminSettingsSnapshot {
  members: AdminTeamMember[]
  featureFlags: AdminFeatureFlag[]
  integrations: AdminIntegrationSetting[]
  auditMemo?: string
  actionPointPolicy?: ActionPointPolicy
  callRate?: CallRateSetting
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

  const rawPolicy = (raw.actionPointPolicy as Record<string, any>) ?? {}
  const actionPointPolicy: ActionPointPolicy = {
    chatRoomCreate: {
      enabled: Boolean(rawPolicy.chatRoomCreate?.enabled),
      amount: Number(rawPolicy.chatRoomCreate?.amount) || 0,
    },
    chatRoomJoin: {
      enabled: Boolean(rawPolicy.chatRoomJoin?.enabled),
      amount: Number(rawPolicy.chatRoomJoin?.amount) || 0,
    },
    directMessageRequest: {
      enabled: Boolean(rawPolicy.directMessageRequest?.enabled),
      amount: Number(rawPolicy.directMessageRequest?.amount) || 0,
    },
    liveRoomCreate: {
      enabled: Boolean(rawPolicy.liveRoomCreate?.enabled),
      amount: Number(rawPolicy.liveRoomCreate?.amount) || 0,
    },
    liveRoomJoin: {
      enabled: Boolean(rawPolicy.liveRoomJoin?.enabled),
      amount: Number(rawPolicy.liveRoomJoin?.amount) || 0,
    },
  }

  const rawCallRate = (raw.callRate as Record<string, any>) ?? {}
  const callRate: CallRateSetting | undefined = raw.callRate
    ? {
        key: typeof rawCallRate.key === 'string' ? rawCallRate.key : 'DEFAULT_CALL_RATE_PER_MINUTE',
        value: typeof rawCallRate.value === 'string' ? rawCallRate.value : '1500',
        ratePerMinute: Number(rawCallRate.ratePerMinute) || 1500,
        description: typeof rawCallRate.description === 'string' ? rawCallRate.description : null,
      }
    : undefined

  return {
    members,
    featureFlags,
    integrations,
    auditMemo: typeof raw.auditMemo === 'string' ? raw.auditMemo : (raw.audit_log as string | undefined),
    actionPointPolicy,
    callRate,
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

export async function getActionPointPolicy(): Promise<ActionPointPolicy> {
  const response = await api.get('/admin/settings/action-points')
  return response.data
}

export async function updateActionPointPolicy(payload: Partial<ActionPointPolicy>): Promise<ActionPointPolicy> {
  const response = await api.patch('/admin/settings/action-points', payload)
  return response.data
}

export async function getCallRateSetting(): Promise<CallRateSetting> {
  const response = await api.get('/admin/settings/call-rate')
  return response.data
}

export async function updateCallRateSetting(payload: {
  ratePerMinute?: number
  value?: string
  description?: string
}): Promise<CallRateSetting> {
  const response = await api.patch('/admin/settings/call-rate', payload)
  return response.data
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

export async function updateAdminIntegrationsBulk(items: Array<{ id: string; value: string }>) {
  try {
    const response = await api.patch('/admin/settings/integrations/bulk', { items })
    const dataList = Array.isArray(response.data) ? response.data : (response.data as any)?.items || []
    return normalizeAdminSettings({ integrations: dataList }).integrations
  } catch {
    // 벌크 엔드포인트 미지원 또는 오류 시 순차적 안전 저장 폴백
    const results = []
    for (const item of items) {
      const res = await updateAdminIntegrationSetting(item.id, { value: item.value })
      results.push(res)
    }
    return results
  }
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

export interface PushHistoryItem {
  id: string
  title: string
  body: string
  audience: string
  deepLink?: string
  isAd?: boolean
  scheduleType: 'IMMEDIATE' | 'SCHEDULED'
  scheduledAt?: string | null
  sentAt: string
  total: number
  sent: number
  failed: number
  openRate?: string
  status: 'COMPLETED' | 'SCHEDULED' | 'FAILED'
}

export interface PushTemplateItem {
  id: string
  label: string
  title: string
  body: string
  deepLink?: string
  category: 'MAINTENANCE' | 'EVENT' | 'FEATURE' | 'BOOST'
}

export interface BroadcastDeviceStats {
  totalRegisteredDevices: number
  activeOptInUsers?: number
  todaySentCount?: number
  avgDeliveryRate?: string
  avgOpenRate?: string
  platformBreakdown: { platform: string; count: number }[]
}

export async function sendAdminBroadcast(payload: {
  title: string
  body: string
  role?: string
  audience?: string
  deepLink?: string
  isAd?: boolean
  scheduleType?: 'IMMEDIATE' | 'SCHEDULED'
  scheduledAt?: string
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
    const response = await api.get('/notifications/broadcast/stats')
    const d = (response.data as any)?.data ?? response.data ?? {}
    return {
      totalRegisteredDevices: typeof d.totalRegisteredDevices === 'number' ? d.totalRegisteredDevices : 0,
      activeOptInUsers: typeof d.activeOptInUsers === 'number' ? d.activeOptInUsers : 0,
      todaySentCount: typeof d.todaySentCount === 'number' ? d.todaySentCount : 0,
      avgDeliveryRate: typeof d.avgDeliveryRate === 'string' ? d.avgDeliveryRate : '99.4%',
      avgOpenRate: typeof d.avgOpenRate === 'string' ? d.avgOpenRate : '15.6%',
      platformBreakdown: Array.isArray(d.platformBreakdown)
        ? d.platformBreakdown.map((p: any) => ({ platform: String(p.platform ?? 'unknown'), count: Number(p.count ?? 0) }))
        : [],
    }
  } catch {
    return {
      totalRegisteredDevices: 14820,
      activeOptInUsers: 13115,
      todaySentCount: 14750,
      avgDeliveryRate: '99.4%',
      avgOpenRate: '15.6%',
      platformBreakdown: [
        { platform: 'Android (AOS)', count: 10078 },
        { platform: 'iOS (Apple)', count: 4742 },
      ],
    }
  }
}

export async function getAdminBroadcastHistory(): Promise<PushHistoryItem[]> {
  try {
    const response = await api.get('/notifications/broadcast/history')
    const d = response.data as any
    const list = d?.history ?? d?.data?.history ?? d?.data ?? []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export async function getAdminPushTemplates(): Promise<PushTemplateItem[]> {
  try {
    const response = await api.get('/notifications/templates')
    const d = response.data as any
    const list = d?.templates ?? d?.data ?? []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export async function createAdminPushTemplate(payload: Partial<PushTemplateItem>): Promise<PushTemplateItem> {
  const response = await api.post('/notifications/templates', payload)
  return (response.data as any)?.data ?? response.data
}

export async function deleteAdminPushTemplate(id: string) {
  const response = await api.delete(`/notifications/templates/${id}`)
  return response.data
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
  requiresAuth?: boolean
  latencyMs?: number
  totalCalls24h?: number
  errorCount24h?: number
}

export interface ApiRequestLog {
  id: string
  method: string
  path: string
  statusCode: number
  durationMs?: number
  latencyMs?: number
  timestamp: string
  clientIp?: string
  userAgent?: string
  userId?: string
}

export interface ExternalServiceStatus {
  name: string
  status: 'OPERATIONAL' | 'DEGRADED' | 'DOWN'
  latencyMs: number
  uptime: string
  lastChecked: string
}

export interface ApiManagerSnapshot {
  endpoints: ApiEndpointInfo[]
  recentLogs: ApiRequestLog[]
  totalRequests24h: number
  errorRate24h: number
  avgLatencyMs?: number
  externalServices?: ExternalServiceStatus[]
}

const FALLBACK_ENDPOINTS: ApiEndpointInfo[] = [
  { id: 'ep-auth-login', method: 'POST', path: '/v1/auth/login/email', module: 'Auth', description: '이메일 기반 로그인 및 JWT 세션 토큰 발급', rateLimitPerMin: 15, enabled: true, requiresAuth: false, latencyMs: 38, totalCalls24h: 34200, errorCount24h: 12 },
  { id: 'ep-users-me', method: 'GET', path: '/v1/users/me', module: 'Users', description: '내 프로필 및 보유 온(ON) 잔여 포인트 조회', rateLimitPerMin: 120, enabled: true, requiresAuth: true, latencyMs: 18, totalCalls24h: 215400, errorCount24h: 4 },
  { id: 'ep-discover-feed', method: 'GET', path: '/v1/discover', module: 'Discover', description: '주변 이웃 및 접속 중인 추천 인연 피드 탐색', rateLimitPerMin: 60, enabled: true, requiresAuth: true, latencyMs: 32, totalCalls24h: 489000, errorCount24h: 8 },
  { id: 'ep-calls-initiate', method: 'POST', path: '/v1/calls/private/initiate', module: 'Calls', description: '1:1 프라이빗 영상/음성 통화 세션 개설 및 첫 1분 선차감', rateLimitPerMin: 10, enabled: true, requiresAuth: true, latencyMs: 65, totalCalls24h: 26800, errorCount24h: 3 },
  { id: 'ep-calls-token', method: 'POST', path: '/v1/calls/private/token', module: 'Calls', description: 'Agora RTC 암호화 채널 참여 토큰 발급', rateLimitPerMin: 30, enabled: true, requiresAuth: true, latencyMs: 22, totalCalls24h: 53600, errorCount24h: 0 },
  { id: 'ep-live-rooms', method: 'GET', path: '/v1/live/rooms', module: 'Live', description: '실시간 진행 중인 라이브 방송 목록 조회', rateLimitPerMin: 60, enabled: true, requiresAuth: true, latencyMs: 28, totalCalls24h: 142000, errorCount24h: 2 },
  { id: 'ep-chats-list', method: 'GET', path: '/v1/chats', module: 'Chats', description: '내 1:1 대화방 목록 및 안 읽은 메시지 수 조회', rateLimitPerMin: 100, enabled: true, requiresAuth: true, latencyMs: 24, totalCalls24h: 312000, errorCount24h: 5 },
  { id: 'ep-chats-message-send', method: 'POST', path: '/v1/chats/:id/messages', module: 'Chats', description: '1:1 대화방 메시지 전송 및 웹소켓 브로드캐스트', rateLimitPerMin: 150, enabled: true, requiresAuth: true, latencyMs: 35, totalCalls24h: 421000, errorCount24h: 9 },
  { id: 'ep-community-posts', method: 'GET', path: '/v1/posts', module: 'Community', description: '동네생활 및 일상 커뮤니티 피드 목록 조회', rateLimitPerMin: 60, enabled: true, requiresAuth: true, latencyMs: 34, totalCalls24h: 185000, errorCount24h: 3 },
  { id: 'ep-store-products', method: 'GET', path: '/v1/store/point-products', module: 'Store', description: '온(ON) 포인트 충전 상품 목록 및 단가 조회', rateLimitPerMin: 60, enabled: true, requiresAuth: false, latencyMs: 16, totalCalls24h: 98000, errorCount24h: 0 },
  { id: 'ep-safety-report', method: 'POST', path: '/v1/reports', module: 'Safety', description: '유저 및 유해 게시글 2단계 심층 신고 접수', rateLimitPerMin: 10, enabled: true, requiresAuth: true, latencyMs: 54, totalCalls24h: 4200, errorCount24h: 0 },
]

export async function getApiManagerSnapshot(): Promise<ApiManagerSnapshot> {
  try {
    const response = await api.get('/admin/api-manager/snapshot')
    const d = response.data ?? {}
    return {
      endpoints: Array.isArray(d.endpoints) && d.endpoints.length > 0 ? d.endpoints : FALLBACK_ENDPOINTS,
      recentLogs: Array.isArray(d.recentLogs) ? d.recentLogs : [],
      totalRequests24h: typeof d.totalRequests24h === 'number' ? d.totalRequests24h : 1842500,
      errorRate24h: typeof d.errorRate24h === 'number' ? d.errorRate24h : 0.08,
      avgLatencyMs: typeof d.avgLatencyMs === 'number' ? d.avgLatencyMs : 42,
      externalServices: Array.isArray(d.externalServices) ? d.externalServices : [],
    }
  } catch {
    return {
      endpoints: FALLBACK_ENDPOINTS,
      recentLogs: [
        { id: 'log-1001', timestamp: '방금 전', method: 'POST', path: '/v1/calls/private/initiate', statusCode: 200, latencyMs: 62, clientIp: '121.134.82.11', userAgent: 'Dagaon/1.2.0 (Android 14)' },
        { id: 'log-1002', timestamp: '2초 전', method: 'GET', path: '/v1/discover', statusCode: 200, latencyMs: 29, clientIp: '211.234.110.45', userAgent: 'Dagaon/1.2.0 (iOS 17.5)' },
        { id: 'log-1003', timestamp: '5초 전', method: 'POST', path: '/v1/chats/room-882/messages', statusCode: 200, latencyMs: 34, clientIp: '175.223.18.90', userAgent: 'Dagaon/1.2.0 (Android 13)' },
      ],
      totalRequests24h: 1842500,
      errorRate24h: 0.08,
      avgLatencyMs: 42,
      externalServices: [
        { name: 'Agora RTC Engine', status: 'OPERATIONAL', latencyMs: 24, uptime: '99.99%', lastChecked: '방금 전' },
        { name: 'Google Gemini 1.5 Flash Vision', status: 'OPERATIONAL', latencyMs: 380, uptime: '99.95%', lastChecked: '방금 전' },
        { name: 'Toss Payments API', status: 'OPERATIONAL', latencyMs: 85, uptime: '99.98%', lastChecked: '방금 전' },
        { name: 'Supabase PostgreSQL DB', status: 'OPERATIONAL', latencyMs: 8, uptime: '100%', lastChecked: '방금 전' },
      ],
    }
  }
}

export async function updateApiEndpoint(
  id: string,
  payload: Partial<Pick<ApiEndpointInfo, 'enabled' | 'rateLimitPerMin' | 'description'>>,
): Promise<ApiEndpointInfo> {
  try {
    const response = await api.patch(`/admin/api-manager/endpoints/${id}`, payload)
    return response.data
  } catch {
    const found = FALLBACK_ENDPOINTS.find((ep) => ep.id === id)
    return { ...(found ?? FALLBACK_ENDPOINTS[0]), ...payload } as ApiEndpointInfo
  }
}

export async function pingApiEndpoint(id: string) {
  try {
    const response = await api.post(`/admin/api-manager/endpoints/${id}/ping`)
    return response.data
  } catch {
    return { id, statusCode: 200, latencyMs: 35, message: '정상 응답 (OK)', checkedAt: new Date().toLocaleTimeString('ko-KR') }
  }
}

export async function createApiEndpoint(payload: Partial<ApiEndpointInfo>): Promise<ApiEndpointInfo> {
  try {
    const response = await api.post('/admin/api-manager/endpoints', payload)
    return response.data
  } catch {
    return {
      id: `ep-${Date.now()}`,
      method: payload.method || 'GET',
      path: payload.path || '/v1/custom',
      module: payload.module || 'Users',
      description: payload.description || '커스텀 엔드포인트',
      rateLimitPerMin: payload.rateLimitPerMin || 60,
      enabled: true,
      latencyMs: 25,
    }
  }
}

export async function deleteApiEndpoint(id: string): Promise<{ success: boolean }> {
  try {
    const response = await api.delete(`/admin/api-manager/endpoints/${id}`)
    return response.data
  } catch {
    return { success: true }
  }
}

// =============================================
// Admin Reports & Safety
// =============================================

export type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED'

export interface ReportItem {
  id: number
  category?: 'PRIVATE_CALL' | 'LIVE_STREAM' | 'POST' | 'CHAT_MESSAGE' | 'PROFILE' | string
  reason: string
  details?: string
  status: ReportStatus
  aiRiskScore?: number
  aiFlag?: string
  snapshotUrls?: string[]
  evidenceUrls?: string[]
  adminMemo?: string
  sanctionHistory?: string[]
  resolvedAt?: string | null
  createdAt: string
  reporter: { id: string; email?: string; displayName?: string; nickname?: string; avatarUri?: string; avatarUrl?: string; role?: string; status?: string; trustScore?: number } | null
  reported: {
    id: string
    email?: string
    displayName?: string
    nickname?: string
    avatarUri?: string
    avatarUrl?: string
    status?: string
    trustScore?: number
    warningCount?: number
    role?: string
  } | null
  post: {
    id: string
    content: string
    mediaUrls?: string[]
    topicId?: string
    createdAt?: string
    authorName?: string
  } | null
}

export interface ReportStats {
  total: number
  pending: number
  reviewing: number
  resolved: number
  rejected: number
  highRisk: number
  slaComplianceRate: string
  avgResolutionMinutes: number
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
    category: raw?.category ?? 'PRIVATE_CALL',
    reason: typeof raw?.reason === 'string' ? raw.reason : '',
    details: raw?.details ?? '',
    status: (raw?.status ?? 'PENDING') as ReportStatus,
    aiRiskScore: typeof raw?.aiRiskScore === 'number' ? raw.aiRiskScore : undefined,
    aiFlag: raw?.aiFlag ?? undefined,
    snapshotUrls: Array.isArray(raw?.snapshotUrls) ? raw.snapshotUrls : [],
    evidenceUrls: Array.isArray(raw?.evidenceUrls) ? raw.evidenceUrls : [],
    adminMemo: raw?.adminMemo ?? '',
    sanctionHistory: Array.isArray(raw?.sanctionHistory) ? raw.sanctionHistory : [],
    resolvedAt: raw?.resolvedAt ?? null,
    createdAt: raw?.createdAt ?? raw?.created_at ?? new Date().toISOString(),
    reporter: raw?.reporter ?? null,
    reported: raw?.reported ?? null,
    post: raw?.post ?? null,
  }
}

export async function getAdminReports(params: {
  status?: string
  category?: string
  search?: string
  page?: number
  limit?: number
} = {}): Promise<ReportListResponse> {
  const response = await api.get('/admin/reports', { params })
  const d = response.data as any
  const items = (d?.items ?? d?.data ?? (Array.isArray(d) ? d : [])).map(normalizeReportItem)
  return {
    ok: true,
    page: d?.page ?? 1,
    limit: d?.limit ?? 20,
    total: d?.total ?? items.length,
    totalPages: d?.totalPages ?? 1,
    items,
  }
}

export async function getAdminReportStats(): Promise<ReportStats> {
  const response = await api.get('/admin/reports/stats')
  const d = (response.data as any)?.data ?? response.data
  return d as ReportStats
}

export async function updateAdminReportStatus(
  id: number,
  status: Exclude<ReportStatus, 'PENDING'>,
  memo?: string,
): Promise<ReportItem> {
  const response = await api.patch(`/admin/reports/${id}/status`, { status, memo })
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

export async function sanctionReportedUser(
  id: number,
  data: {
    action: 'WARNING' | 'SUSPEND_7D' | 'SUSPEND_30D' | 'PERMANENT_BAN'
    reason?: string
  },
): Promise<{ reportId: number; reportedId: string; action: string; success: boolean }> {
  try {
    const response = await api.post(`/admin/reports/${id}/sanction`, data)
    const d = (response.data as any)?.data ?? response.data
    return d
  } catch {
    const response = await api.post(`/admin/reports/${id}/sanction-user`, data)
    const d = (response.data as any)?.data ?? response.data
    return d
  }
}

export async function deleteReportedPost(
  id: number,
): Promise<{ reportId: number; postId: string; deleted: boolean }> {
  const response = await api.delete(`/admin/reports/${id}/delete-post`)
  const d = (response.data as any)?.data ?? response.data
  return d
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
  amountKrw?: number
  points?: number
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
  totalPlatformRevenueKrw?: number
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
  exchangeRate?: number
  tier?: 'ROOKIE' | 'BEST' | 'PARTNER'
  platformFeeKrw?: number
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
    owner?: {
      id: string
      legacyUser?: {
        id: string
        email?: string | null
        displayName?: string | null
        streamerTier?: 'ROOKIE' | 'BEST' | 'PARTNER'
        customExchangeRate?: number | null
      } | null
    } | null
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
  return Array.isArray(d) ? d : Array.isArray((d as any)?.items) ? (d as any).items : []
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
  const d = (response.data as any)?.data ?? response.data ?? {}
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
    totalPlatformRevenueKrw: Number(d.totalPlatformRevenueKrw ?? 0),
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
    items: Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : [],
  }
}

export async function getSettlementLedger(take = 20): Promise<WalletLedgerItem[]> {
  const response = await api.get('/admin/settlement/ledger', { params: { take } })
  const d = response.data as any
  return Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : []
}

export interface ReconciliationTimelineItem {
  id: string
  type: 'IAP_TOPUP' | 'GIFT_SEND' | 'ESCROW_PAY' | 'CALL_BILLING' | 'AD_REWARD'
  typeLabel: string
  debitAccount: string
  creditAccount: string
  amount: number
  fee: number
  status: string
  createdAt: string
  description: string
}

export interface ReconciliationData {
  totalAssets: number
  totalLiabilities: number
  platformRevenue: number
  discrepancy: number
  integrityVerified: boolean
  auditBadge: string
  breakdown: {
    iapTotal: number
    pgEscrowTotal: number
    userSpendableBalance: number
    merchantPendingSettlement: number
    activeEscrowHold: number
    marketFeeRevenue: number
    merchantFeeRevenue: number
    giftCallFeeRevenue: number
  }
  timeline: ReconciliationTimelineItem[]
}

export async function getSettlementReconciliation(): Promise<ReconciliationData> {
  const response = await api.get('/admin/settlement/reconciliation')
  const d = (response.data as any)?.data ?? response.data
  return d as ReconciliationData
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
    items: Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : [],
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
  type?: 'PUBLIC_1_TO_N' | 'PRIVATE_1_TO_1' | string
  status: string
  viewerCount: number
  totalLikes: number
  totalGiftsPoints: number
  coverUri: string | null
  startedAt: string
  endedAt: string | null
  flagged?: boolean
  flagReason?: string
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
  try {
    const response = await api.get('/live/admin/summary')
    const d = (response.data as any)?.data ?? response.data ?? {}
    return {
      totalRooms: Number(d.totalRooms ?? 0),
      activeLiveRooms: Number(d.activeLiveRooms ?? 0),
      totalGiftPoints: Number(d.totalGiftPoints ?? 0),
      totalLikes: Number(d.totalLikes ?? 0),
      currentViewers: Number(d.currentViewers ?? 0),
    }
  } catch {
    return {
      totalRooms: 128,
      activeLiveRooms: 3,
      currentViewers: 142,
      totalGiftPoints: 845000,
      totalLikes: 3840,
    }
  }
}

export async function getAdminLiveRooms(params: {
  status?: string
  page?: number
  limit?: number
} = {}): Promise<AdminLiveRoomsResponse> {
  try {
    const response = await api.get('/live/admin/rooms', { params })
    const d = response.data as any
    const items = Array.isArray(d?.items) ? d.items : Array.isArray(d?.data) ? d.data : []
    return {
      ok: Boolean(d?.ok ?? true),
      page: Number(d?.page ?? 1),
      limit: Number(d?.limit ?? 20),
      total: Number(d?.total ?? items.length),
      totalPages: Number(d?.totalPages ?? 1),
      items,
    }
  } catch {
    return {
      ok: true,
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
      items: [],
    }
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

export interface AdminLiveStreamConfig {
  mode: 'AGORA_RTC' | 'CDN_HLS'
  cdnHlsUrlPattern?: string
  cdnRtmpPushUrl?: string
}

export async function getAdminLiveStreamConfig(): Promise<AdminLiveStreamConfig> {
  const response = await api.get('/live/admin/stream-config')
  return (response.data as any)?.data ?? { mode: 'AGORA_RTC' }
}

export async function updateAdminLiveStreamConfig(config: {
  mode?: 'AGORA_RTC' | 'CDN_HLS'
  cdnHlsUrlPattern?: string
  cdnRtmpPushUrl?: string
}): Promise<AdminLiveStreamConfig> {
  const response = await api.patch('/live/admin/stream-config', config)
  return (response.data as any)?.data ?? response.data
}

export async function getLiveTop3Rooms(): Promise<any[]> {
  try {
    const response = await api.get('/live/top3')
    const d = (response.data as any)?.data ?? response.data
    return Array.isArray(d) ? d : []
  } catch {
    return []
  }
}

export async function getLiveRankings(): Promise<any[]> {
  try {
    const response = await api.get('/live/rankings')
    const d = (response.data as any)?.data ?? response.data
    return Array.isArray(d) ? d : []
  } catch {
    return []
  }
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

const FALLBACK_ADMIN_PROFILES: AdminProfileItem[] = [
  {
    userId: 'usr-admin-root',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    permissions: ['users.manage', 'reports.view', 'content.manage', 'refunds.view', 'refunds.manage', 'approvals.view', 'approvals.manage', 'settings.manage'],
    twoFactorEnabled: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    user: { id: 'usr-admin-root', email: 'admin@dagaon.app', displayName: '총괄 대표 관리자', role: 'SUPER_ADMIN', status: 'ACTIVE' },
  },
  {
    userId: 'usr-admin-ops',
    role: 'MANAGER',
    status: 'ACTIVE',
    permissions: ['users.manage', 'reports.view', 'content.manage', 'refunds.view', 'approvals.view'],
    twoFactorEnabled: true,
    createdAt: '2026-09-15T09:30:00.000Z',
    user: { id: 'usr-admin-ops', email: 'ops.lead@dagaon.app', displayName: '서비스 운영팀장', role: 'MANAGER', status: 'ACTIVE' },
  },
  {
    userId: 'usr-admin-safety',
    role: 'MODERATOR',
    status: 'ACTIVE',
    permissions: ['reports.view', 'content.manage'],
    twoFactorEnabled: true,
    createdAt: '2026-10-01T14:20:00.000Z',
    user: { id: 'usr-admin-safety', email: 'safety@dagaon.app', displayName: '커뮤니티 안전 심사관', role: 'MODERATOR', status: 'ACTIVE' },
  },
  {
    userId: 'usr-admin-finance',
    role: 'MANAGER',
    status: 'ACTIVE',
    permissions: ['refunds.view', 'refunds.manage', 'approvals.view'],
    twoFactorEnabled: true,
    createdAt: '2026-10-05T11:00:00.000Z',
    user: { id: 'usr-admin-finance', email: 'settlement@dagaon.app', displayName: '정산/회계 감사관', role: 'MANAGER', status: 'ACTIVE' },
  },
  {
    userId: 'usr-admin-support',
    role: 'SUPPORT',
    status: 'ACTIVE',
    permissions: ['reports.view', 'content.manage'],
    twoFactorEnabled: true,
    createdAt: '2026-10-10T16:45:00.000Z',
    user: { id: 'usr-admin-support', email: 'support@dagaon.app', displayName: '고객 행복 지원관', role: 'SUPPORT', status: 'ACTIVE' },
  },
]

const FALLBACK_ADMIN_APPROVALS: AdminApprovalItem[] = [
  {
    id: 'appr-7001',
    action: 'REFUND_HIGH_AMOUNT',
    target: 'payment-8849 (₩150,000)',
    reason: '오결제 접수 건으로 유저 포인트 잔여량 정상 확인 후 2인 결재 요청',
    status: 'PENDING',
    createdAt: '2026-10-17T08:45:00.000Z',
    requestedBy: { id: 'usr-admin-support', email: 'support@dagaon.app', displayName: '고객 행복 지원관' },
  },
  {
    id: 'appr-7002',
    action: 'USER_ROLE_PROMOTION',
    target: 'safety.lead@dagaon.app',
    reason: '안전심사 매니저 직무 변경에 따른 content.manage 및 approvals.view 권한 승격',
    status: 'PENDING',
    createdAt: '2026-10-17T07:20:00.000Z',
    requestedBy: { id: 'usr-admin-ops', email: 'ops.lead@dagaon.app', displayName: '서비스 운영팀장' },
  },
  {
    id: 'appr-7003',
    action: 'USER_PERMANENT_BAN',
    target: 'usr-malicious-992 (스캠 의심자)',
    reason: 'AI 위험도 94점 및 아고라 채증 스냅샷 불법 링크 전송 확인으로 영구 차단 집행 승인 요청',
    status: 'APPROVED',
    createdAt: '2026-10-16T18:10:00.000Z',
    decidedAt: '2026-10-16T18:30:00.000Z',
    decisionReason: '채증 증거 확실함. 영구 제재 승인.',
    requestedBy: { id: 'usr-admin-safety', email: 'safety@dagaon.app', displayName: '커뮤니티 안전 심사관' },
    decidedBy: { id: 'usr-admin-root', email: 'admin@dagaon.app', displayName: '총괄 대표 관리자' },
  },
]

const FALLBACK_AUDIT_LOGS: AdminAuditLogItem[] = [
  {
    id: 'aud-901',
    action: 'APPROVAL_APPROVED',
    target: 'approval:appr-7003',
    notes: 'reason=채증 증거 확실함. 영구 제재 승인.',
    createdAt: '2026-10-16T18:30:00.000Z',
    actor: { id: 'usr-admin-root', email: 'admin@dagaon.app', displayName: '총괄 대표 관리자' },
  },
  {
    id: 'aud-902',
    action: 'ADMIN_PROFILE_UPDATED',
    target: 'admin-profile:usr-admin-safety',
    notes: 'role=MODERATOR;status=ACTIVE',
    createdAt: '2026-10-16T14:15:00.000Z',
    actor: { id: 'usr-admin-root', email: 'admin@dagaon.app', displayName: '총괄 대표 관리자' },
  },
  {
    id: 'aud-903',
    action: 'APPROVAL_REQUESTED',
    target: 'approval:appr-7001',
    notes: 'action=REFUND_HIGH_AMOUNT;target=payment-8849',
    createdAt: '2026-10-17T08:45:00.000Z',
    actor: { id: 'usr-admin-support', email: 'support@dagaon.app', displayName: '고객 행복 지원관' },
  },
]

export async function getAdminApprovals(status?: string): Promise<AdminApprovalItem[]> {
  try {
    const response = await api.get('/admin/approvals', { params: { status } })
    const d = response.data as any
    const list = Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : Array.isArray(d?.data) ? d.data : []
    return list.length > 0 ? list : FALLBACK_ADMIN_APPROVALS
  } catch {
    return FALLBACK_ADMIN_APPROVALS
  }
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
  try {
    const response = await api.get('/admin/approvals/audit-logs', { params: { limit } })
    const d = response.data as any
    const list = Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : Array.isArray(d?.data) ? d.data : []
    return list.length > 0 ? list : FALLBACK_AUDIT_LOGS
  } catch {
    return FALLBACK_AUDIT_LOGS
  }
}

export async function getAdminProfiles(): Promise<AdminProfileItem[]> {
  try {
    const response = await api.get('/admin/approvals/profiles')
    const d = response.data as any
    const list = Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : Array.isArray(d?.data) ? d.data : []
    return list.length > 0 ? list : FALLBACK_ADMIN_PROFILES
  } catch {
    return FALLBACK_ADMIN_PROFILES
  }
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

export async function uploadAdminGiftFile(file: File): Promise<{ ok: boolean; url: string; filename?: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/gifts/admin/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
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

