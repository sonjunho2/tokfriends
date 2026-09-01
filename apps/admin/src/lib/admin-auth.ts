// tokfriends-admin/admin-web/src/lib/admin-auth.ts
// Lightweight client-side persistence layer for admin accounts when the API is unavailable.

export type AdminRole = 'SUPER_ADMIN' | 'MANAGER' | 'MODERATOR' | 'EDITOR' | 'SUPPORT' | 'VIEWER'
export type AdminStatus = 'ACTIVE' | 'SUSPENDED'

export interface AdminAccount {
  id: string
  email: string
  username: string
  name: string
  role: AdminRole
  status: AdminStatus
  password: string
  permissions: string[]
  twoFactorEnabled: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

const STORAGE_KEY = 'tokfriends_admin_accounts_v1'
const AUDIT_STORAGE_KEY = 'tokfriends_admin_audit_memo_v1'
const TOKEN_STORAGE_KEY = 'tokfriends_admin_last_token_v1'

const DEFAULT_SUPER_ADMIN: AdminAccount = {
  id: 'admin-super',
  email: 'admin@example.com',
  username: 'admin@example.com',
  name: '슈퍼 관리자',
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
  password: 'Admin123!',
  permissions: ['users.manage', 'reports.view', 'content.manage', 'settings.manage'],
  twoFactorEnabled: false,
  createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
  updatedAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
  lastLoginAt: undefined,
}

let memoryAccounts: AdminAccount[] | null = null
let memoryAuditMemo: string | null = null
let memoryTokenSeed = ''

function nowIso() {
  return new Date().toISOString()
}

function cloneAccount(account: AdminAccount): AdminAccount {
  return {
    ...account,
    permissions: [...account.permissions],
  }
}

function cloneAccounts(accounts: AdminAccount[]): AdminAccount[] {
  return accounts.map((account) => cloneAccount(account))
}

function loadFromStorage(): AdminAccount[] | null {
  if (typeof window === 'undefined') {
    return memoryAccounts ? cloneAccounts(memoryAccounts) : null
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AdminAccount[]
    if (!Array.isArray(parsed)) return null
    return parsed
      .filter((item) => typeof item?.id === 'string' && typeof item?.email === 'string')
      .map((item) => ({
        ...DEFAULT_SUPER_ADMIN,
        ...item,
        permissions: Array.isArray(item.permissions) ? item.permissions.map(String) : DEFAULT_SUPER_ADMIN.permissions,
      }))
  } catch {
    return null
  }
}

function writeToStorage(accounts: AdminAccount[]) {
  memoryAccounts = cloneAccounts(accounts)
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
  } catch {
    // ignore persistence failures in fallback mode
  }
}

function ensureSeededAccounts(): AdminAccount[] {
  const existing = loadFromStorage()
  if (existing && existing.length > 0) {
    memoryAccounts = cloneAccounts(existing)
    return existing
  }

  const seeded = [cloneAccount(DEFAULT_SUPER_ADMIN)]
  memoryAccounts = cloneAccounts(seeded)
  writeToStorage(seeded)
  return seeded
}

function persistAccounts(accounts: AdminAccount[]): AdminAccount[] {
  const normalized = cloneAccounts(accounts).map((account) => ({
    ...account,
    updatedAt: nowIso(),
    permissions: Array.from(new Set(account.permissions.map((value) => value.trim()).filter((value) => value.length > 0))),
  }))
  writeToStorage(normalized)
  return cloneAccounts(normalized)
}

export function ensureDefaultSuperAdminAccount(): AdminAccount {
  const accounts = ensureSeededAccounts()
  const found = accounts.find((account) => account.email.toLowerCase() === DEFAULT_SUPER_ADMIN.email.toLowerCase())
  if (found) {
    return cloneAccount(found)
  }
  const seeded = cloneAccount(DEFAULT_SUPER_ADMIN)
  const next = persistAccounts([seeded, ...accounts])
  return cloneAccount(next[0])
}

export function listAdminAccounts(): AdminAccount[] {
  const accounts = memoryAccounts ?? ensureSeededAccounts()
  return cloneAccounts(accounts)
}

function randomId(prefix: string) {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  return `${prefix}-${random}`
}

export interface CreateAdminAccountPayload {
  email: string
  name: string
  role: AdminRole
  status?: AdminStatus
  password: string
  permissions?: string[]
  twoFactorEnabled?: boolean
}

export function createAdminAccount(payload: CreateAdminAccountPayload): AdminAccount {
  ensureDefaultSuperAdminAccount()
  const accounts = listAdminAccounts()
  const normalizedEmail = payload.email.trim().toLowerCase()
  if (!normalizedEmail) {
    throw new AdminAuthError('DUPLICATE', '관리자 아이디(이메일)을 입력해주세요.')
  }
  if (accounts.some((account) => account.email.toLowerCase() === normalizedEmail)) {
    throw new AdminAuthError('DUPLICATE', '이미 등록된 관리자 아이디입니다.')
  }

  const trimmedPassword = payload.password.trim()
  if (!trimmedPassword) {
    throw new AdminAuthError('INVALID_PASSWORD', '초기 비밀번호를 입력해주세요.')
  }

  const now = nowIso()
  const account: AdminAccount = {
    id: randomId('admin'),
    email: normalizedEmail,
    username: normalizedEmail,
    name: payload.name.trim() || normalizedEmail,
    role: payload.role,
    status: payload.status ?? 'ACTIVE',
    password: trimmedPassword,
    permissions: Array.isArray(payload.permissions)
      ? Array.from(new Set(payload.permissions.map((value) => value.trim()).filter((value) => value.length > 0)))
      : ['reports.view'],
    twoFactorEnabled: Boolean(payload.twoFactorEnabled),
    createdAt: now,
    updatedAt: now,
    lastLoginAt: undefined,
  }

  const next = [account, ...accounts]
  persistAccounts(next)
  return cloneAccount(account)
}

export interface UpdateAdminAccountPayload {
  name?: string
  role?: AdminRole
  status?: AdminStatus
  permissions?: string[]
  twoFactorEnabled?: boolean
  email?: string
}

export function updateAdminAccount(accountId: string, payload: UpdateAdminAccountPayload): AdminAccount {
  const accounts = listAdminAccounts()
  const index = accounts.findIndex((account) => account.id === accountId)
  if (index === -1) {
    throw new AdminAuthError('NOT_FOUND', '관리자 계정을 찾을 수 없습니다.')
  }
  const current = accounts[index]
  const updated: AdminAccount = {
    ...current,
    name: typeof payload.name === 'string' && payload.name.trim().length > 0 ? payload.name.trim() : current.name,
    role: payload.role ?? current.role,
    status: payload.status ?? current.status,
    permissions: Array.isArray(payload.permissions)
      ? Array.from(new Set(payload.permissions.map((value) => value.trim()).filter((value) => value.length > 0)))
      : current.permissions,
    twoFactorEnabled: typeof payload.twoFactorEnabled === 'boolean' ? payload.twoFactorEnabled : current.twoFactorEnabled,
    email:
      typeof payload.email === 'string' && payload.email.trim().length > 0 ? payload.email.trim().toLowerCase() : current.email,
    username:
      typeof payload.email === 'string' && payload.email.trim().length > 0
        ? payload.email.trim().toLowerCase()
        : current.username,
    updatedAt: nowIso(),
  }
  accounts[index] = updated
  persistAccounts(accounts)
  return cloneAccount(updated)
}

export function deleteAdminAccount(accountId: string) {
  const accounts = listAdminAccounts().filter((account) => account.id !== accountId)
  persistAccounts(accounts)
}

export function updateAdminPassword(accountId: string, nextPassword: string) {
  const accounts = listAdminAccounts()
  const index = accounts.findIndex((account) => account.id === accountId)
  if (index === -1) {
    throw new AdminAuthError('NOT_FOUND', '관리자 계정을 찾을 수 없습니다.')
  }
  accounts[index] = {
    ...accounts[index],
    password: nextPassword,
    updatedAt: nowIso(),
  }
  persistAccounts(accounts)
}

export function touchAdminLogin(accountId: string) {
  const accounts = listAdminAccounts()
  const index = accounts.findIndex((account) => account.id === accountId)
  if (index === -1) {
    return
  }
  accounts[index] = {
    ...accounts[index],
    lastLoginAt: nowIso(),
    updatedAt: nowIso(),
  }
  persistAccounts(accounts)
}

export type AdminAuthErrorReason = 'NOT_FOUND' | 'INVALID_PASSWORD' | 'INACTIVE' | 'DUPLICATE'

export class AdminAuthError extends Error {
  readonly reason: AdminAuthErrorReason

  constructor(reason: AdminAuthErrorReason, message: string) {
    super(message)
    this.name = 'AdminAuthError'
    this.reason = reason
  }
}

export interface LocalAuthResult {
  account: AdminAccount
  accessToken: string
  refreshToken: string
}

function nextTokenSeed() {
  if (!memoryTokenSeed) {
    memoryTokenSeed = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? '' : ''
  }
  const fragment = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  memoryTokenSeed = `${Date.now().toString(36)}-${fragment}`
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, memoryTokenSeed)
    } catch {
      // ignore
    }
  }
  return memoryTokenSeed
}

export function authenticateAdminAccount(identifier: string, password: string): LocalAuthResult {
  ensureDefaultSuperAdminAccount()
  const accounts = listAdminAccounts()
  const normalized = identifier.trim().toLowerCase()
  const account = accounts.find(
    (item) => item.email.toLowerCase() === normalized || item.username.toLowerCase() === normalized || item.name.toLowerCase() === normalized
  )
  if (!account) {
    throw new AdminAuthError('NOT_FOUND', '등록되지 않은 관리자 아이디입니다.')
  }
  if (account.status !== 'ACTIVE') {
    throw new AdminAuthError('INACTIVE', '비활성화된 관리자 계정입니다. 슈퍼 관리자에게 문의하세요.')
  }
  if (account.password !== password) {
    throw new AdminAuthError('INVALID_PASSWORD', '아이디 또는 비밀번호가 일치하지 않습니다.')
  }
  touchAdminLogin(account.id)
  const refreshed = listAdminAccounts().find((item) => item.id === account.id) ?? account
  const token = `local-admin-${nextTokenSeed()}`
  const refresh = `local-refresh-${nextTokenSeed()}`
  return {
    account: cloneAccount(refreshed),
    accessToken: token,
    refreshToken: refresh,
  }
}

export function getAuditMemoSnapshot(): string {
  if (typeof window === 'undefined') {
    return memoryAuditMemo ?? ''
  }
  try {
    const stored = window.localStorage.getItem(AUDIT_STORAGE_KEY)
    memoryAuditMemo = stored ?? ''
    return memoryAuditMemo ?? ''
  } catch {
    return memoryAuditMemo ?? ''
  }
}

export function saveAuditMemoSnapshot(memo: string) {
  memoryAuditMemo = memo
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(AUDIT_STORAGE_KEY, memo)
    } catch {
      // ignore persistence failure
    }
  }
}
