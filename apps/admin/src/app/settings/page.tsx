'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  Flag,
  LayoutGrid,
  PlugZap,
  ShieldCheck,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Key,
  CreditCard,
  Bell,
  Sparkles,
  Video,
  Coins,
  Copy,
  Download,
  Bot,
  Database,
  FileText,
  Check,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  createAdminTeamMember,
  deleteAdminTeamMember,
  getAdminSettingsSnapshot,
  saveAdminAuditMemo,
  updateActionPointPolicy,
  updateAdminFeatureFlag,
  updateAdminIntegrationSetting,
  updateAdminTeamMember,
  updateAdminTeamMemberPassword,
  type ActionPointPolicy,
  type AdminFeatureFlag,
  type AdminIntegrationSetting,
  type AdminTeamMember,
  type CallRateSetting,
} from '@/lib/api'
import { CallRateSettingCard } from '@/components/CallRateSettingCard'
import type { AxiosError } from 'axios'
import { cn } from '@/lib/utils'

const PERMISSION_HINT = 'users.manage, reports.view'

type SettingsSection = 'overview' | 'team' | 'security' | 'product' | 'integrations' | 'pointPolicy'

type IntegrationCategory = 'oauth' | 'pg' | 'push' | 'streaming' | 'ai_storage'

interface DefaultIntegrationItemDef {
  id: string
  label: string
  placeholder: string
  envKey: string
  category: IntegrationCategory
}

const DEFAULT_INTEGRATION_ITEMS: DefaultIntegrationItemDef[] = [
  // 1. 소셜 로그인 (OAuth)
  { id: 'oauth_kakao_client_id', label: '카카오 REST API 키', placeholder: '카카오 디벨로퍼스 앱 키 > REST API 키', envKey: 'KAKAO_CLIENT_ID', category: 'oauth' },
  { id: 'oauth_kakao_client_secret', label: '카카오 Client Secret', placeholder: '카카오 로그인 > 보안 > Client Secret', envKey: 'KAKAO_CLIENT_SECRET', category: 'oauth' },
  { id: 'oauth_naver_client_id', label: '네이버 Client ID', placeholder: '네이버 디벨로퍼스 Client ID', envKey: 'NAVER_CLIENT_ID', category: 'oauth' },
  { id: 'oauth_naver_client_secret', label: '네이버 Client Secret', placeholder: '네이버 디벨로퍼스 Client Secret', envKey: 'NAVER_CLIENT_SECRET', category: 'oauth' },
  { id: 'oauth_google_client_id', label: '구글 OAuth Web Client ID', placeholder: 'Google Cloud Console OAuth 클라이언트 ID', envKey: 'GOOGLE_CLIENT_ID', category: 'oauth' },
  { id: 'oauth_google_client_secret', label: '구글 OAuth Client Secret', placeholder: 'Google Cloud Console 클라이언트 보안 비밀', envKey: 'GOOGLE_CLIENT_SECRET', category: 'oauth' },
  { id: 'oauth_apple_service_id', label: 'Apple Service ID (로그인 식별자)', placeholder: '예: com.sonjunho.ddakchin.signin', envKey: 'APPLE_SERVICE_ID', category: 'oauth' },
  { id: 'oauth_apple_team_id', label: 'Apple Team ID', placeholder: '10자리 Apple Developer Team ID', envKey: 'APPLE_TEAM_ID', category: 'oauth' },
  { id: 'oauth_apple_key_id', label: 'Apple Key ID', placeholder: '10자리 Sign in with Apple Key ID', envKey: 'APPLE_KEY_ID', category: 'oauth' },
  { id: 'oauth_apple_private_key', label: 'Apple AuthKey (.p8 내용)', placeholder: '-----BEGIN PRIVATE KEY----- ...', envKey: 'APPLE_PRIVATE_KEY', category: 'oauth' },

  // 2. 결제 및 PG 연동
  { id: 'toss_payments_client_key', label: '토스페이먼츠 클라이언트 키', placeholder: 'live_ck_... 또는 test_ck_...', envKey: 'TOSS_CLIENT_KEY', category: 'pg' },
  { id: 'toss_payments_secret_key', label: '토스페이먼츠 시크릿 키', placeholder: 'live_sk_... 또는 test_sk_...', envKey: 'TOSS_SECRET_KEY', category: 'pg' },
  { id: 'portone_store_id', label: '포트원(아임포트) Store ID', placeholder: '예: store-1234abcd-...', envKey: 'PORTONE_STORE_ID', category: 'pg' },
  { id: 'portone_api_key', label: '포트원 REST API Key', placeholder: '포트원 콘솔 V1/V2 API Key', envKey: 'PORTONE_API_KEY', category: 'pg' },
  { id: 'portone_api_secret', label: '포트원 API Secret', placeholder: '포트원 콘솔 V1/V2 API Secret', envKey: 'PORTONE_API_SECRET', category: 'pg' },
  { id: 'iap_apple_shared_secret', label: 'Apple 인앱결제 Shared Secret', placeholder: 'App Store Connect 앱 전용 공유 암호', envKey: 'APPLE_IAP_SHARED_SECRET', category: 'pg' },
  { id: 'iap_google_service_account', label: 'Google 인앱결제 Service Account JSON', placeholder: 'Google Play Console 서비스 계정 키 JSON 전체', envKey: 'GOOGLE_IAP_SERVICE_ACCOUNT', category: 'pg' },

  // 3. 실시간 푸시 알림
  { id: 'firebase_project_id', label: 'Firebase 프로젝트 ID', placeholder: '예: dagaon-firebase-prod', envKey: 'FIREBASE_PROJECT_ID', category: 'push' },
  { id: 'firebase_service_account_json', label: 'Firebase 서비스 계정 비공개 키 JSON', placeholder: 'Firebase Console 서비스 계정 키 JSON 전체', envKey: 'FIREBASE_SERVICE_ACCOUNT', category: 'push' },
  { id: 'apns_team_id', label: 'Apple APNs Team ID', placeholder: '10자리 Apple Developer Team ID', envKey: 'APNS_TEAM_ID', category: 'push' },
  { id: 'apns_key_id', label: 'Apple APNs Key ID', placeholder: '10자리 APNs 인증키 Key ID', envKey: 'APNS_KEY_ID', category: 'push' },
  { id: 'apns_auth_key', label: 'Apple APNs AuthKey (.p8 내용)', placeholder: '-----BEGIN PRIVATE KEY----- ...', envKey: 'APNS_AUTH_KEY', category: 'push' },
  { id: 'apns_bundle_id', label: 'Apple APNs Bundle ID', placeholder: '예: com.sonjunho.ddakchin', envKey: 'APNS_BUNDLE_ID', category: 'push' },

  // 4. 실시간 라이브 스트리밍
  { id: 'agora_app_id', label: 'Agora 라이브 App ID', placeholder: 'Agora 콘솔 > 프로젝트 관리 > App ID', envKey: 'AGORA_APP_ID', category: 'streaming' },
  { id: 'agora_app_certificate', label: 'Agora 라이브 App Certificate', placeholder: 'Agora 콘솔 > Primary Certificate', envKey: 'AGORA_APP_CERTIFICATE', category: 'streaming' },
  { id: 'live_stream_mode', label: '라이브 스트리밍 송출 방식 (AGORA_RTC / CDN_HLS)', placeholder: 'AGORA_RTC', envKey: 'LIVE_STREAM_MODE', category: 'streaming' },
  { id: 'live_cdn_hls_url_pattern', label: 'CDN HLS 재생 URL 템플릿', placeholder: 'https://live-cdn.dagaon.app/live/{roomId}/index.m3u8', envKey: 'LIVE_CDN_HLS_URL_PATTERN', category: 'streaming' },
  { id: 'live_cdn_rtmp_push_url', label: 'Agora Media Push RTMP 수신 주소', placeholder: 'rtmp://live-push.dagaon.app/live/{roomId}', envKey: 'LIVE_CDN_RTMP_PUSH_URL', category: 'streaming' },

  // 5. 제브 AI (Zev AI) 및 AI 직원 거버넌스 & 클라우드 스토리지
  { id: 'gemini_api_key', label: 'Google Gemini API Key (실시간 영상 채증 및 법률 대조)', placeholder: 'AIzaSy... (채증/법률 대조/AI 직원)', envKey: 'GEMINI_API_KEY', category: 'ai_storage' },
  { id: 'zev_ai_model', label: '제브 AI (Zev AI) 수석 판정관 LLM 모델', placeholder: 'gemini-2.5-flash (권장) 또는 gemini-1.5-pro', envKey: 'ZEV_AI_MODEL', category: 'ai_storage' },
  { id: 'zev_ai_prompt_policy', label: '제브 AI 법률/약관 대조 기준 지침', placeholder: '정보통신망법 제44조의7 및 다가온 운영원칙 준용', envKey: 'ZEV_AI_PROMPT_POLICY', category: 'ai_storage' },
  { id: 'ai_staff_models', label: 'AI 직원별 LLM 모델 지정 (JSON)', placeholder: '{"director":"gemini-2.5-flash",...}', envKey: 'AI_STAFF_MODELS', category: 'ai_storage' },
  { id: 'supabase_url', label: 'Supabase 프로젝트 URL', placeholder: 'https://xxxx.supabase.co', envKey: 'SUPABASE_URL', category: 'ai_storage' },
  { id: 'supabase_service_role_key', label: 'Supabase Service Role Key', placeholder: 'eyJhbGciOiJIUzI1Ni... (스토리지/채증 관리자 키)', envKey: 'SUPABASE_SERVICE_ROLE_KEY', category: 'ai_storage' },
]

type AdminIntegrationDraft = AdminIntegrationSetting & {
  draftValue?: string
  dirty?: boolean
  clearRequested?: boolean
}

function mergeWithDefaultIntegrations(incoming: AdminIntegrationSetting[] = []): AdminIntegrationDraft[] {
  const existingMap = new Map((incoming || []).map((item) => [item.id, item]))

  return DEFAULT_INTEGRATION_ITEMS.map((def) => {
    const found = existingMap.get(def.id)
    return {
      id: def.id,
      label: def.label,
      placeholder: def.placeholder,
      value: found?.value ?? '',
      draftValue: '',
      dirty: false,
      clearRequested: false,
    }
  })
}

function generateEnvProductionText(integrations: AdminIntegrationDraft[]): string {
  const byId = new Map(integrations.map((i) => [i.id, i]))
  const lines: string[] = [
    '# ==============================================================================',
    '# 다가온 (DAGAON) 본서버 실서비스 환경설정 (.env.production)',
    `# 내보내기 일시: ${new Date().toLocaleString('ko-KR')}`,
    '# 본 파일의 내용을 본서버(Render / Vercel / Docker / 자체 서버)의 환경변수에 주입하세요.',
    '# ==============================================================================',
    '',
    '# --- 1. 소셜 로그인 (OAuth) ---',
  ]

  const categories: { key: IntegrationCategory; title: string }[] = [
    { key: 'oauth', title: '1. 소셜 로그인 (OAuth)' },
    { key: 'pg', title: '2. 결제 및 PG 연동 (온(ON) 상점)' },
    { key: 'push', title: '3. 실시간 푸시 알림 (FCM & APNs)' },
    { key: 'streaming', title: '4. 실시간 라이브 스트리밍 (Agora & CDN)' },
    { key: 'ai_storage', title: '5. AI 직원 & 클라우드 스토리지 (Gemini & Supabase)' },
  ]

  for (const cat of categories) {
    lines.push(`\n# --- ${cat.title} ---`)
    const items = DEFAULT_INTEGRATION_ITEMS.filter((item) => item.category === cat.key)
    for (const item of items) {
      const draft = byId.get(item.id)
      const val = draft?.draftValue?.trim() || (draft?.value && draft.value !== '********' ? draft.value : '')
      lines.push(`${item.envKey}=${val}`)
    }
  }

  lines.push('\n# --- 시스템 공통 설정 ---')
  lines.push('NODE_ENV=production')
  lines.push('PORT=4000')
  lines.push('API_PREFIX=v1')
  lines.push('MOBILE_BUNDLE_SCHEME=tokfriends')

  return lines.join('\n')
}

function parsePermissionInput(input: string | string[]): string[] {
  if (Array.isArray(input)) {
    return input.map((value) => value.trim()).filter((value) => value.length > 0)
  }
  return input
    .split(/[,\n]/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}

function formatDateTime(value?: string) {
  if (!value) return '기록 없음'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '기록 없음'
  const pad = (num: number) => num.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function SettingsPage() {
  const { toast } = useToast()

  const defaultPermissionText = PERMISSION_HINT

  const [isLoading, setIsLoading] = useState(false)
  const [members, setMembers] = useState<AdminTeamMember[]>([])
  const [flags, setFlags] = useState<AdminFeatureFlag[]>([])
  const [integrations, setIntegrations] = useState<AdminIntegrationDraft[]>([])
  const [auditLog, setAuditLog] = useState('')
  const [initialAuditLog, setInitialAuditLog] = useState('')
  
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null)
  const [savingFlagId, setSavingFlagId] = useState<string | null>(null)
  const [savingIntegrationId, setSavingIntegrationId] = useState<string | null>(null)
  const [savingAuditLog, setSavingAuditLog] = useState(false)
  const [pointPolicy, setPointPolicy] = useState<ActionPointPolicy>({
    chatRoomCreate: { enabled: false, amount: 0 },
    chatRoomJoin: { enabled: false, amount: 0 },
    directMessageRequest: { enabled: false, amount: 0 },
    liveRoomCreate: { enabled: false, amount: 0 },
    liveRoomJoin: { enabled: false, amount: 0 },
  })
  const [savingPointPolicy, setSavingPointPolicy] = useState(false)
  const [callRate, setCallRate] = useState<CallRateSetting | null>(null)

  const [activeSection, setActiveSection] = useState<SettingsSection>('overview')

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false)
  const [permissionDraft, setPermissionDraft] = useState('')
  const [permissionTarget, setPermissionTarget] = useState<AdminTeamMember | null>(null)

  const [passwordTarget, setPasswordTarget] = useState<AdminTeamMember | null>(null)
  const [passwordDraft, setPasswordDraft] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    role: 'MANAGER',
    status: 'ACTIVE',
    password: '',
    permissions: defaultPermissionText,
    twoFactor: false,
  })

  const resetNewAdmin = () => {
    setNewAdmin({
      name: '',
      email: '',
      role: 'MANAGER',
      status: 'ACTIVE',
      password: '',
      permissions: defaultPermissionText,
      twoFactor: false,
    })
  }

  const sectionFilters = useMemo(
    () =>
      [
        {
          id: 'overview' as SettingsSection,
          label: '전체 보기',
          description: '모든 설정을 한 화면에서 살펴봅니다.',
          icon: LayoutGrid,
        },
        {
          id: 'team' as SettingsSection,
          label: '팀 & 권한',
          description: '부관리자 계정과 역할, 권한을 관리합니다.',
          icon: Users,
        },
        {
          id: 'security' as SettingsSection,
          label: '보안 & 감사',
          description: '2단계 인증과 감사 로그를 점검합니다.',
          icon: ShieldCheck,
        },
        {
          id: 'product' as SettingsSection,
          label: '기능 제어',
          description: '실험과 단계적 롤아웃 상태를 조정합니다.',
          icon: Flag,
        },
        {
          id: 'integrations' as SettingsSection,
          label: '외부 연동',
          description: '푸시 · 모니터링 · AI 키를 관리합니다.',
          icon: PlugZap,
        },
        {
          id: 'pointPolicy' as SettingsSection,
          label: '온(ON) 소모 & 통화 요금',
          description: '1:1 통화 기본 요금, 채팅, 대화신청, 라이브방송 온(ON) 설정',
          icon: Coins,
        },
      ] satisfies { id: SettingsSection; label: string; description: string; icon: LucideIcon }[],
    []
  )

  const activeMemberCount = useMemo(
    () => members.filter((member) => (member.status ?? 'ACTIVE') !== 'SUSPENDED').length,
    [members]
  )
  const suspendedMemberCount = useMemo(
    () => members.filter((member) => member.status === 'SUSPENDED').length,
    [members]
  )
  const twoFactorEnabledCount = useMemo(() => members.filter((member) => member.twoFactor).length, [members])
  const enabledFlagCount = useMemo(() => flags.filter((flag) => flag.enabled).length, [flags])
  const configuredIntegrationCount = useMemo(
    () => integrations.filter((integration) => (integration.value ?? '').trim().length > 0).length,
    [integrations]
  )

  const quickStats = useMemo(
    () =>
      [
        {
          id: 'team' as SettingsSection,
          label: '활성 관리자',
          value: `${activeMemberCount}명`,
          helper: `일시중지 ${suspendedMemberCount}명`,
          icon: Users,
        },
        {
          id: 'security' as SettingsSection,
          label: '보안 상태',
          value: `2FA ${twoFactorEnabledCount}명`,
          helper: '보안 · 감사 상태',
          icon: ShieldCheck,
        },
        {
          id: 'product' as SettingsSection,
          label: '활성 플래그',
          value: `${enabledFlagCount}/${flags.length}`,
          helper: '실험 · 베타 기능',
          icon: Flag,
        },
        {
          id: 'integrations' as SettingsSection,
          label: '연동 완료',
          value: `${configuredIntegrationCount}/${integrations.length}`,
          helper: '푸시 · 모니터링 키',
          icon: PlugZap,
        },
        {
          id: 'pointPolicy' as SettingsSection,
          label: '통화 & 온(ON) 정책',
          value: `${callRate?.ratePerMinute ? callRate.ratePerMinute.toLocaleString() : '1,500'} P/분`,
          helper: `1:1 통화 요금 & 정책`,
          icon: Video,
        },
      ] satisfies {
        id: SettingsSection
        label: string
        value: string
        helper: string
        icon: LucideIcon
      }[],
    [
      activeMemberCount,
      callRate,
      configuredIntegrationCount,
      enabledFlagCount,
      flags.length,
      integrations.length,
      suspendedMemberCount,
      twoFactorEnabledCount,
    ]
  )

  const isSectionVisible = (section: SettingsSection) => activeSection === 'overview' || activeSection === section

  const focusSection = (section: SettingsSection) => {
    setActiveSection(section)
    if (typeof window !== 'undefined') {
      const element = document.getElementById(`settings-${section}`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const resolveRoleLabel = (value?: string) => teamRoles.find((role) => role.value === value)?.label ?? value ?? '역할 미정'
  const resolveStatusLabel = (value?: string) =>
    statusOptions.find((status) => status.value === value)?.label ?? value ?? '상태 미정'

  const teamRoles = useMemo(
    () => [
      { value: 'SUPER_ADMIN', label: '슈퍼 관리자' },
      { value: 'MANAGER', label: '운영 매니저' },
      { value: 'MODERATOR', label: '모더레이터' },
      { value: 'SUPPORT', label: '고객 지원' },
      { value: 'EDITOR', label: '콘텐츠 에디터' },
      { value: 'VIEWER', label: '조회 전용' },
    ],
    []
  )

  const statusOptions = useMemo(
    () => [
      { value: 'ACTIVE', label: '활성' },
      { value: 'SUSPENDED', label: '일시중지' },
    ],
    []
  )

  useEffect(() => {
    void loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadSettings() {
    setIsLoading(true)
    try {
      const snapshot = await getAdminSettingsSnapshot()
      setMembers(snapshot.members || [])
      setFlags(snapshot.featureFlags || [])
      setIntegrations(mergeWithDefaultIntegrations(snapshot.integrations || []))
      setAuditLog(snapshot.auditMemo ?? '')
      setInitialAuditLog(snapshot.auditMemo ?? '')
      if (snapshot.actionPointPolicy) {
        setPointPolicy(snapshot.actionPointPolicy)
      }
      if (snapshot.callRate) {
        setCallRate(snapshot.callRate)
      }
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message =
        (ax?.response?.data as any)?.message || ax?.message || '설정 정보를 불러오지 못했습니다. 기본 입력 폼을 상시 제공합니다.'
      toast({
        title: '연결 지연 안내 (기본 폼 상시 표시)',
        description: Array.isArray(message) ? message.join(', ') : String(message),
        variant: 'default',
      })
      setMembers([])
      setFlags([])
      setIntegrations(mergeWithDefaultIntegrations([]))
      setAuditLog('')
      setInitialAuditLog('')
    } finally {
      setIsLoading(false)
    }
  }


  const createMember = async () => {
    const email = newAdmin.email.trim()
    const password = newAdmin.password.trim()
    if (!email || !password) {
      toast({ title: '아이디와 비밀번호 필요', description: '부관리자 아이디(이메일)와 초기 비밀번호를 입력하세요.', variant: 'destructive' })
      return
    }
    setSavingMemberId('create')
    try {
      const created = await createAdminTeamMember({
        email,
        name: newAdmin.name.trim() || email,
        role: newAdmin.role,
        status: newAdmin.status,
        password,
        permissions: parsePermissionInput(newAdmin.permissions),
        twoFactor: newAdmin.twoFactor,
      })
      setMembers((prev) => [created, ...prev])
      toast({
        title: '부관리자 생성',
        description: `${created.name ?? created.email ?? email} 계정을 추가했습니다.`,
      })
      resetNewAdmin()
      setIsCreateDialogOpen(false)
    } catch (error) {
        const ax = error as AxiosError | undefined
        const message = (ax?.response?.data as any)?.message || ax?.message || '운영자 계정을 추가하지 못했습니다.'
        toast({ title: '추가 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingMemberId(null)
    }
  }

  const updateMemberRole = async (id: string, role: AdminTeamMember['role']) => {
    setSavingMemberId(id)
    try {
      const updated = await updateAdminTeamMember(id, { role })
      const nextRole = updated?.role ?? (typeof role === 'string' ? role : undefined)
      setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, ...updated, role: nextRole } : member)))
      toast({
        title: '역할 변경',
        description: `${updated?.name ?? updated?.email ?? '운영자'}의 역할을 ${resolveRoleLabel(nextRole)}로 저장했습니다.`,
      })
    } catch (error) {
        const ax = error as AxiosError | undefined
        const message = (ax?.response?.data as any)?.message || ax?.message || '역할을 변경하지 못했습니다.'
        toast({ title: '역할 변경 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingMemberId(null)
    }
  }

  const updateMemberStatus = async (id: string, status: AdminTeamMember['status']) => {
    setSavingMemberId(id)
    try {
      const updated = await updateAdminTeamMember(id, { status })
      const nextStatus = updated?.status ?? (typeof status === 'string' ? status : undefined)
      setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, ...updated, status: nextStatus } : member)))
      toast({ title: '상태 변경', description: `${updated?.name ?? updated?.email ?? '운영자'}의 상태를 ${resolveStatusLabel(nextStatus)}로 저장했습니다.` })
    } catch (error) {
        const ax = error as AxiosError | undefined
        const message = (ax?.response?.data as any)?.message || ax?.message || '상태를 변경하지 못했습니다.'
        toast({ title: '상태 변경 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingMemberId(null)
    }
  }

  const toggleTwoFactor = async (id: string, enabled: boolean) => {
    setSavingMemberId(id)
    try {
      const updated = await updateAdminTeamMember(id, { twoFactor: enabled })
      setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, ...updated, twoFactor: enabled } : member)))

      toast({
        title: '2단계 인증 업데이트',
        description: `${updated?.name ?? updated?.email ?? '운영자'}의 2FA 설정이 ${updated?.twoFactor ? '활성화' : '비활성화'}되었습니다.`,
      })
    } catch (error) {
        const ax = error as AxiosError | undefined
        const message = (ax?.response?.data as any)?.message || ax?.message || '2FA 상태를 변경하지 못했습니다.'
        toast({ title: '2FA 변경 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingMemberId(null)
    }
  }

  const removeMember = async (member: AdminTeamMember) => {
    if (member.role === 'SUPER_ADMIN') {
      toast({ title: '삭제 불가', description: '최초 슈퍼 관리자는 삭제할 수 없습니다.', variant: 'destructive' })
      return
    }
    if (typeof window !== 'undefined') {
      const label = member.name ?? member.email ?? '운영자'
      if (!window.confirm(`${label} 계정을 삭제하시겠습니까?`)) {
        return
      }
    }
    setSavingMemberId(member.id)
    try {
      await deleteAdminTeamMember(member.id)
      setMembers((prev) => prev.filter((item) => item.id !== member.id))
      toast({ title: '계정 삭제', description: `${member.name ?? member.email ?? '운영자'} 계정을 삭제했습니다.` })
    } catch (error) {
        const ax = error as AxiosError | undefined
        const message = (ax?.response?.data as any)?.message || ax?.message || '계정을 삭제하지 못했습니다.'
        toast({ title: '삭제 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingMemberId(null)
    }
  }

  const openPermissionDialog = (member: AdminTeamMember) => {
    setPermissionTarget(member)
    const text = (member.permissions ?? []).join(', ')
    setPermissionDraft(text || defaultPermissionText)
    setIsPermissionDialogOpen(true)
  }

  const savePermissions = async () => {
    if (!permissionTarget) return
    const permissions = parsePermissionInput(permissionDraft)
    setSavingMemberId(permissionTarget.id)
    try {
      const updated = await updateAdminTeamMember(permissionTarget.id, { permissions })
      setMembers((prev) =>
        prev.map((member) =>
          member.id === permissionTarget.id
            ? { ...member, ...updated, permissions }
            : member
        )
      )
      toast({ title: '권한 업데이트', description: `${permissionTarget.name ?? permissionTarget.email ?? '운영자'}의 권한을 저장했습니다.` })
      setIsPermissionDialogOpen(false)
      setPermissionTarget(null)
    } catch (error) {
        const ax = error as AxiosError | undefined
        const message = (ax?.response?.data as any)?.message || ax?.message || '권한을 저장하지 못했습니다.'
        toast({ title: '권한 저장 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingMemberId(null)
    }
  }

  const closePermissionDialog = () => {
    setIsPermissionDialogOpen(false)
    setPermissionTarget(null)
    setPermissionDraft('')
  }

  const openPasswordDialog = (member: AdminTeamMember) => {
    setPasswordTarget(member)
    setPasswordDraft('')
  }

  const closePasswordDialog = () => {
    setPasswordTarget(null)
    setPasswordDraft('')
    setSavingPassword(false)
  }

  const savePassword = async () => {
    if (!passwordTarget) return
    const password = passwordDraft.trim()
    if (password.length < 8) {
      toast({ title: '비밀번호 조건 미달', description: '비밀번호는 최소 8자 이상이어야 합니다.', variant: 'destructive' })
      return
    }
    setSavingPassword(true)
    try {
      const updated = await updateAdminTeamMemberPassword(passwordTarget.id, { password })
      toast({
        title: '비밀번호 재설정 완료',
        description: `${passwordTarget.name ?? passwordTarget.email ?? '운영자'}의 비밀번호를 업데이트했습니다.`,
      })
      if (updated) {
        setMembers((prev) => prev.map((member) => (member.id === passwordTarget.id ? { ...member, ...updated } : member)))
      }
      closePasswordDialog()
    } catch (error) {
        const ax = error as AxiosError | undefined
        const message = (ax?.response?.data as any)?.message || ax?.message || '비밀번호를 변경하지 못했습니다.'
        toast({ title: '비밀번호 변경 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingPassword(false)
    }
  }

  const toggleFlag = async (id: string, enabled: boolean) => {
    setSavingFlagId(id)
    try {
      const updated = await updateAdminFeatureFlag(id, { enabled })
      setFlags((prev) => prev.map((flag) => (flag.id === id ? { ...flag, ...updated } : flag)))
      toast({ title: '기능 플래그 변경', description: `${updated.name ?? '플래그'} 상태가 업데이트되었습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '플래그 상태를 변경하지 못했습니다.'
      toast({ title: '플래그 변경 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingFlagId(null)
    }
  }

  const updateIntegration = (id: string, value: string) => {
    setIntegrations((prev) =>
      prev.map((integration) => (integration.id === id ? { ...integration, draftValue: value, dirty: value.length > 0, clearRequested: false } : integration))
    )
  }

  const clearIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((integration) => integration.id === id ? { ...integration, draftValue: '', dirty: !integration.clearRequested, clearRequested: !integration.clearRequested } : integration)
    )
  }

  const [copiedEnv, setCopiedEnv] = useState(false)

  const handleCopyEnv = async () => {
    try {
      const text = generateEnvProductionText(integrations)
      await navigator.clipboard.writeText(text)
      setCopiedEnv(true)
      toast({
        title: '.env.production 복사 완료',
        description: '본서버 환경설정 내용이 클립보드에 복사되었습니다. 서버 .env 파일에 붙여넣으세요.',
      })
      setTimeout(() => setCopiedEnv(false), 2000)
    } catch {
      toast({
        title: '복사 실패',
        description: '클립보드 접근 권한이 없어 복사하지 못했습니다. 다운로드 버튼을 이용해주세요.',
        variant: 'destructive',
      })
    }
  }

  const handleDownloadEnv = () => {
    try {
      const text = generateEnvProductionText(integrations)
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '.env.production'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({
        title: '.env.production 다운로드 완료',
        description: '.env.production 파일이 다운로드되었습니다.',
      })
    } catch {
      toast({
        title: '다운로드 실패',
        description: '파일 생성 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  const saveIntegrations = async () => {
    const dirtyIntegrations = integrations.filter((integration) => integration.dirty)
    if (dirtyIntegrations.length === 0) {
      toast({ title: '변경 사항 없음', description: '저장할 외부 서비스 키 변경이 없습니다.' })
      return
    }

    setSavingIntegrationId('bulk')
    try {
      const updatedIntegrations = await Promise.all(
        dirtyIntegrations.map((integration) => updateAdminIntegrationSetting(integration.id, { value: integration.draftValue ?? '' }))
      )
      const updatedById = new Map(updatedIntegrations.map((integration) => [integration.id, integration]))
      setIntegrations((prev) => prev.map((integration) => updatedById.get(integration.id) ?? integration))
      toast({ title: '통합 설정 저장', description: '변경한 외부 서비스 키가 안전하게 암호화 저장되었습니다.' })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '통합 설정 변경사항을 저장하지 못했습니다.'
      toast({ title: '통합 저장 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingIntegrationId(null)
    }
  }

  const saveAuditLog = async () => {
    if (auditLog.trim() === initialAuditLog.trim()) {
      toast({ title: '변경 사항 없음', description: '새로운 메모가 없어 저장하지 않았습니다.' })
      return
    }
    setSavingAuditLog(true)
    try {
      const saved = await saveAdminAuditMemo({ memo: auditLog })
      setInitialAuditLog(saved ?? '')
      toast({ title: '감사 메모 저장', description: '변경 사항을 기록했습니다.' })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '감사 메모를 저장하지 못했습니다.'
      toast({ title: '감사 메모 저장 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingAuditLog(false)
    }
  }

  const handleSavePointPolicy = async () => {
    setSavingPointPolicy(true)
    try {
      const updated = await updateActionPointPolicy(pointPolicy)
      setPointPolicy(updated)
      toast({
        title: '온(ON) 소모 정책 저장 완료',
        description: '채팅방, 대화신청, 라이브방송 온(ON) 정책이 정상적으로 반영되었습니다.',
      })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message =
        (ax?.response?.data as any)?.message ||
        ax?.message ||
        '온(ON) 정책을 저장하지 못했습니다.'
      toast({
        title: '저장 실패',
        description: Array.isArray(message) ? message.join(', ') : String(message),
        variant: 'destructive',
      })
    } finally {
      setSavingPointPolicy(false)
    }
  }


  return (
    <div className="space-y-6">
    <section id="settings-overview">
      <Card className="border-primary/40 bg-primary/5">
        <CardHeader className="space-y-2">
          <CardTitle>설정 센터</CardTitle>
          <p className="text-sm text-muted-foreground">
            팀 운영부터 보안, 실험 설정까지 필요한 항목을 빠르게 찾아 수정할 수 있습니다.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickStats.map((stat) => {
              const StatIcon = stat.icon
              return (
                <button
                  key={stat.id}
                  type="button"
                  onClick={() => focusSection(stat.id)}
                  className={cn(
                    'group flex w-full items-center justify-between gap-3 rounded-lg border bg-background/70 px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                    activeSection === stat.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/40 hover:bg-primary/5'
                  )}
                  aria-pressed={activeSection === stat.id}
                >
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground">{stat.helper}</p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex h-10 w-10 items-center justify-center rounded-md border text-sm transition',
                      activeSection === stat.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground'
                    )}
                    aria-hidden
                  >
                    <StatIcon className="h-5 w-5" />
                  </span>
                </button>
              )
            })}
          </div>

          <div className="grid gap-2 md:grid-cols-5">
            {sectionFilters.map((section) => {
              const FilterIcon = section.icon
              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => focusSection(section.id)}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-lg border px-3 py-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                    isActive
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/40 hover:bg-muted/60'
                  )}
                  aria-pressed={isActive}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <FilterIcon className="h-4 w-4" />
                    {section.label}
                  </div>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </section>

    {isSectionVisible('team') && (
      <section id="settings-team" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>팀 관리 & 권한</CardTitle>
              <p className="text-sm text-muted-foreground">
                관리자 아이디와 권한을 이메일 기반으로 관리하고, 부관리자 계정을 생성하거나 비밀번호를 재설정하세요.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={(open) => {
                  setIsCreateDialogOpen(open)
                  if (!open) {
                    resetNewAdmin()
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm" disabled={savingMemberId === 'create'}>
                    새 부관리자 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>부관리자 계정 생성</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3 text-sm">
                    <div className="grid gap-1.5">
                      <Label htmlFor="new-admin-name">이름</Label>
                      <Input
                        id="new-admin-name"
                        value={newAdmin.name}
                        onChange={(event) => setNewAdmin((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="홍길동"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="new-admin-email">아이디 (이메일)</Label>
                      <Input
                        id="new-admin-email"
                        type="email"
                        value={newAdmin.email}
                        onChange={(event) => setNewAdmin((prev) => ({ ...prev, email: event.target.value }))}
                        placeholder="manager@example.com"
                        autoComplete="off"
                      />
                    </div>
                    <div className="grid gap-1.5 md:grid-cols-2 md:gap-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="new-admin-role">역할</Label>
                        <Select
                          value={newAdmin.role}
                          onValueChange={(value) => setNewAdmin((prev) => ({ ...prev, role: value }))}
                        >
                          <SelectTrigger id="new-admin-role" className="text-xs">
                            <SelectValue placeholder="역할 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {teamRoles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="new-admin-status">상태</Label>
                        <Select
                          value={newAdmin.status}
                          onValueChange={(value) => setNewAdmin((prev) => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger id="new-admin-status" className="text-xs">
                            <SelectValue placeholder="상태 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="new-admin-password">초기 비밀번호</Label>
                      <Input
                        id="new-admin-password"
                        type="password"
                        value={newAdmin.password}
                        onChange={(event) => setNewAdmin((prev) => ({ ...prev, password: event.target.value }))}
                        placeholder="최소 8자 이상"
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="new-admin-permissions">권한 (콤마 또는 줄바꿈으로 구분)</Label>
                      <Textarea
                        id="new-admin-permissions"
                        value={newAdmin.permissions}
                        onChange={(event) => setNewAdmin((prev) => ({ ...prev, permissions: event.target.value }))}
                        rows={3}
                        placeholder={PERMISSION_HINT}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                      <div>
                        <div className="font-medium">2단계 인증</div>
                        <p className="text-muted-foreground">보안 강화를 위해 SMS 또는 OTP 추가 인증을 요구합니다.</p>
                      </div>
                      <Switch
                        checked={newAdmin.twoFactor}
                        onCheckedChange={(value) => setNewAdmin((prev) => ({ ...prev, twoFactor: value }))}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          resetNewAdmin()
                          setIsCreateDialogOpen(false)
                        }}
                      >
                        취소
                      </Button>
                      <Button type="button" onClick={() => void createMember()} disabled={savingMemberId === 'create'}>
                        {savingMemberId === 'create' ? '생성 중…' : '계정 생성'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button size="sm" variant="outline" onClick={() => void loadSettings()} disabled={isLoading}>
                새로고침
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">이름 / 아이디</th>
                    <th className="px-3 py-2 font-medium">역할</th>
                    <th className="px-3 py-2 font-medium">상태</th>
                    <th className="px-3 py-2 font-medium">권한</th>
                    <th className="px-3 py-2 font-medium">2FA</th>
                    <th className="px-3 py-2 font-medium">최근 로그인</th>
                    <th className="px-3 py-2 font-medium text-right">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-xs text-muted-foreground" colSpan={7}>
                        아직 등록된 관리자가 없습니다. &quot;새 부관리자 추가&quot; 버튼으로 첫 계정을 생성하세요.
                      </td>
                    </tr>
                  )}
                  {members.map((member) => (
                    <tr key={member.id} className="border-t align-top">
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="font-semibold">{member.name ?? member.email ?? '이름 미등록'}</span>
                          <span className="text-xs text-muted-foreground">{member.email ?? '이메일 미등록'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={member.role ?? 'VIEWER'}
                          onValueChange={(value: AdminTeamMember['role']) => void updateMemberRole(member.id, value)}
                          disabled={savingMemberId === member.id}
                        >
                          <SelectTrigger className="w-[180px] text-xs">
                            <SelectValue placeholder="역할 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {teamRoles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={member.status ?? 'ACTIVE'}
                          onValueChange={(value: AdminTeamMember['status']) => void updateMemberStatus(member.id, value)}
                          disabled={savingMemberId === member.id}
                        >
                          <SelectTrigger className="w-[130px] text-xs">
                            <SelectValue placeholder="상태" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">
                            {member.permissions && member.permissions.length > 0
                              ? member.permissions.join(', ')
                              : '권한 미설정'}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPermissionDialog(member)}
                            disabled={savingMemberId === member.id}
                            className="w-fit text-xs"
                          >
                            권한 편집
                          </Button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <Switch
                          checked={Boolean(member.twoFactor)}
                          disabled={savingMemberId === member.id}
                          onCheckedChange={(value) => void toggleTwoFactor(member.id, value)}
                        />
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{formatDateTime(member.lastLoginAt)}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPasswordDialog(member)}
                            disabled={savingPassword && passwordTarget?.id === member.id}
                            className="text-xs"
                          >
                            비밀번호 초기화
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => void removeMember(member)}
                            disabled={savingMemberId === member.id || member.role === 'SUPER_ADMIN'}
                          >
                            삭제
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">* 권한은 콤마(,) 또는 줄바꿈으로 여러 개를 입력할 수 있습니다.</p>
            <Dialog
              open={isPermissionDialogOpen}
              onOpenChange={(open) => {
                if (!open) {
                  closePermissionDialog()
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {permissionTarget?.name ?? permissionTarget?.email ?? '운영자'} 권한 편집
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 text-sm">
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-permissions">권한 목록</Label>
                    <Textarea
                      id="edit-permissions"
                      value={permissionDraft}
                      onChange={(event) => setPermissionDraft(event.target.value)}
                      rows={4}
                      placeholder={PERMISSION_HINT}
                    />
                    <p className="text-xs text-muted-foreground">
                      권한 키는 콤마(,) 또는 줄바꿈으로 구분합니다. 예: users.manage, reports.view
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => closePermissionDialog()}>
                      취소
                    </Button>
                    <Button type="button" onClick={() => void savePermissions()} disabled={!permissionTarget}>
                      저장
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog
              open={Boolean(passwordTarget)}
              onOpenChange={(open) => {
                if (!open) {
                  closePasswordDialog()
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {passwordTarget?.name ?? passwordTarget?.email ?? '운영자'} 비밀번호 재설정
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 text-sm">
                  <div className="grid gap-1.5">
                    <Label htmlFor="reset-password">새 비밀번호</Label>
                    <Input
                      id="reset-password"
                      type="password"
                      value={passwordDraft}
                      onChange={(event) => setPasswordDraft(event.target.value)}
                      placeholder="영문, 숫자 조합 8자 이상"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => closePasswordDialog()}>
                      취소
                    </Button>
                    <Button type="button" onClick={() => void savePassword()} disabled={savingPassword}>
                      {savingPassword ? '저장 중…' : '비밀번호 저장'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </section>
    )}

      {isSectionVisible('security') && (
      <section id="settings-security" className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>감사 로그 메모</CardTitle>
            <p className="text-sm text-muted-foreground">권한 변경이나 플래그 조정 시 메모를 남겨두세요.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Textarea
              value={auditLog}
              onChange={(event) => setAuditLog(event.target.value)}
              rows={4}
              placeholder="예: 2024-03-14 운영자 role 변경, 보안팀 승인 등"
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void saveAuditLog()} disabled={savingAuditLog}>
                {savingAuditLog ? '저장 중…' : '감사 메모 저장'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setAuditLog(initialAuditLog)
                }}
              >
                되돌리기
              </Button>
            </div>
          </CardContent>
        </Card>

      </section>
    )}

    {isSectionVisible('product') && (
      <section id="settings-product" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>기능 플래그</CardTitle>
            <p className="text-sm text-muted-foreground">
              환경별 기능 활성 여부를 토글하면 즉시 API에 반영되어 배포 팀이 한눈에 확인할 수 있습니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {flags.map((flag) => (
              <div key={flag.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{flag.name ?? '플래그'}</p>
                    <p className="text-xs text-muted-foreground">{flag.description ?? '설명이 등록되지 않았습니다.'}</p>
                    <p className="text-xs text-muted-foreground">환경: {flag.environment ?? '-'}</p>
                  </div>
                  <Switch
                    checked={Boolean(flag.enabled)}
                    disabled={savingFlagId === flag.id}
                    onCheckedChange={(value) => void toggleFlag(flag.id, value)}
                  />
                </div>
              </div>
            ))}
            {flags.length === 0 && <p className="text-muted-foreground">등록된 기능 플래그가 없습니다.</p>}
          </CardContent>
        </Card>
      </section>
    )}

    {isSectionVisible('integrations') && (
      <section id="settings-integrations" className="space-y-6">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-background">
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <PlugZap className="h-5 w-5 text-primary" />
                  실서비스 외부 연동 관리 (소셜 로그인 · 결제/PG · 푸시)
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  사업자 등록 및 제휴 승인 후 발급받은 키를 등록하면, <strong>서버 재배포 없이 즉시 실서비스와 안전하게 연동</strong>됩니다.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyEnv}
                  className="gap-1.5 text-xs font-semibold border-border hover:bg-accent"
                >
                  {copiedEnv ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>복사됨!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-primary" />
                      <span>.env.production 복사</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadEnv}
                  className="gap-1.5 text-xs font-semibold border-border hover:bg-accent"
                >
                  <Download className="h-3.5 w-3.5 text-primary" />
                  <span>.env 파일 다운로드</span>
                </Button>

                <Button
                  onClick={() => void saveIntegrations()}
                  disabled={savingIntegrationId === 'bulk'}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 shadow-sm text-xs h-9"
                >
                  {savingIntegrationId === 'bulk' ? '암호화 저장 중…' : '모든 변경사항 즉시 저장'}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 mt-2 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <strong>금융급 보안 암호화 (AES-256-GCM) 적용:</strong> 등록하신 모든 시크릿 키는 데이터베이스에 강력한 양방향 암호화로 보관되며, 화면에는 절대 원본이 노출되지 않습니다.
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 1. 소셜 로그인 연동 */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-amber-500" />
                  <h3 className="font-bold text-base text-foreground">1. 소셜 로그인 연동 (OAuth)</h3>
                  <span className="text-xs text-muted-foreground">카카오, 네이버, 구글, 애플 간편로그인</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <a
                    href="https://developers.kakao.com/console/app"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    카카오 콘솔 <ExternalLink className="h-3 w-3" />
                  </a>
                  <span className="text-muted-foreground">·</span>
                  <a
                    href="https://developers.naver.com/apps/#/list"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    네이버 콘솔 <ExternalLink className="h-3 w-3" />
                  </a>
                  <span className="text-muted-foreground">·</span>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    구글 콘솔 <ExternalLink className="h-3 w-3" />
                  </a>
                  <span className="text-muted-foreground">·</span>
                  <a
                    href="https://developer.apple.com/account/resources/identifiers/list"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    애플 개발자 <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {integrations
                  .filter((item) => item.id.startsWith('oauth_'))
                  .map((integration) => {
                    const isConfigured = Boolean((integration.value ?? '').length > 0);
                    return (
                      <div key={integration.id} className="rounded-lg border bg-background/50 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            {integration.label ?? integration.id}
                          </Label>
                          {isConfigured ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" /> 등록됨
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded-full border border-zinc-500/20">
                              <AlertCircle className="h-3 w-3" /> 미등록
                            </span>
                          )}
                        </div>
                        <Input
                          type="password"
                          value={integration.draftValue ?? ''}
                          placeholder={isConfigured ? '••••••••  (등록 완료됨, 변경 시 입력)' : (integration.placeholder ?? '발급받은 키를 입력하세요')}
                          autoComplete="new-password"
                          onChange={(event) => updateIntegration(integration.id, event.target.value)}
                          disabled={savingIntegrationId === 'bulk'}
                          className="text-xs h-9 font-mono"
                        />
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="truncate max-w-[240px]">{integration.placeholder}</span>
                          {isConfigured && (
                            <button
                              type="button"
                              onClick={() => clearIntegration(integration.id)}
                              disabled={savingIntegrationId === 'bulk'}
                              className="text-red-500 hover:text-red-600 underline font-medium"
                            >
                              {integration.clearRequested ? '삭제 취소' : '저장값 초기화'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 2. 결제 및 PG 연동 */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-500" />
                  <h3 className="font-bold text-base text-foreground">2. 결제 및 PG 연동 (온(ON) 상점)</h3>
                  <span className="text-xs text-muted-foreground">토스페이먼츠, 포트원(아임포트), 구글/애플 인앱결제</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <a
                    href="https://app.tosspayments.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    토스 콘솔 <ExternalLink className="h-3 w-3" />
                  </a>
                  <span className="text-muted-foreground">·</span>
                  <a
                    href="https://admin.portone.io"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    포트원 콘솔 <ExternalLink className="h-3 w-3" />
                  </a>
                  <span className="text-muted-foreground">·</span>
                  <a
                    href="https://appstoreconnect.apple.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    App Store Connect <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {integrations
                  .filter((item) => item.id.startsWith('toss_') || item.id.startsWith('portone_') || item.id.startsWith('iap_'))
                  .map((integration) => {
                    const isConfigured = Boolean((integration.value ?? '').length > 0);
                    return (
                      <div key={integration.id} className="rounded-lg border bg-background/50 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            {integration.label ?? integration.id}
                          </Label>
                          {isConfigured ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" /> 등록됨
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded-full border border-zinc-500/20">
                              <AlertCircle className="h-3 w-3" /> 미등록
                            </span>
                          )}
                        </div>
                        <Input
                          type="password"
                          value={integration.draftValue ?? ''}
                          placeholder={isConfigured ? '••••••••  (등록 완료됨, 변경 시 입력)' : (integration.placeholder ?? '발급받은 키를 입력하세요')}
                          autoComplete="new-password"
                          onChange={(event) => updateIntegration(integration.id, event.target.value)}
                          disabled={savingIntegrationId === 'bulk'}
                          className="text-xs h-9 font-mono"
                        />
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="truncate max-w-[240px]">{integration.placeholder}</span>
                          {isConfigured && (
                            <button
                              type="button"
                              onClick={() => clearIntegration(integration.id)}
                              disabled={savingIntegrationId === 'bulk'}
                              className="text-red-500 hover:text-red-600 underline font-medium"
                            >
                              {integration.clearRequested ? '삭제 취소' : '저장값 초기화'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 3. 실시간 푸시 알림 연동 */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-rose-500" />
                  <h3 className="font-bold text-base text-foreground">3. 실시간 푸시 알림 (Push Notifications)</h3>
                  <span className="text-xs text-muted-foreground">Firebase Cloud Messaging(FCM) & Apple APNs</span>
                </div>
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
                >
                  Firebase Console <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {integrations
                  .filter((item) => item.id.startsWith('firebase_') || item.id.startsWith('apns_'))
                  .map((integration) => {
                    const isConfigured = Boolean((integration.value ?? '').length > 0);
                    return (
                      <div key={integration.id} className="rounded-lg border bg-background/50 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            {integration.label ?? integration.id}
                          </Label>
                          {isConfigured ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" /> 등록됨
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded-full border border-zinc-500/20">
                              <AlertCircle className="h-3 w-3" /> 미등록
                            </span>
                          )}
                        </div>
                        <Input
                          type="password"
                          value={integration.draftValue ?? ''}
                          placeholder={isConfigured ? '••••••••  (등록 완료됨, 변경 시 입력)' : (integration.placeholder ?? '발급받은 키를 입력하세요')}
                          autoComplete="new-password"
                          onChange={(event) => updateIntegration(integration.id, event.target.value)}
                          disabled={savingIntegrationId === 'bulk'}
                          className="text-xs h-9 font-mono"
                        />
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="truncate max-w-[240px]">{integration.placeholder}</span>
                          {isConfigured && (
                            <button
                              type="button"
                              onClick={() => clearIntegration(integration.id)}
                              disabled={savingIntegrationId === 'bulk'}
                              className="text-red-500 hover:text-red-600 underline font-medium"
                            >
                              {integration.clearRequested ? '삭제 취소' : '저장값 초기화'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 4. 실시간 라이브 스트리밍 연동 (Agora RTC & CDN HLS) */}
            <div className="rounded-xl border bg-card p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-sky-500" />
                  <h3 className="font-bold text-base text-foreground">4. 실시간 라이브 스트리밍 (Agora RTC & CDN HLS)</h3>
                  <span className="text-xs text-muted-foreground">초저지연 양방향 RTC 또는 대규모 비용 절감 CDN 중계 송출 방식 선택</span>
                </div>
                <a
                  href="https://console.agora.io"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
                >
                  Agora Console <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* 송출 방식 선택 탭 / 카드 */}
              {(() => {
                const modeItem = integrations.find((i) => i.id === 'live_stream_mode');
                const currentMode = (modeItem?.draftValue || modeItem?.value || 'AGORA_RTC').toUpperCase();
                const isCdn = currentMode === 'CDN_HLS';

                return (
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-foreground">
                      스트리밍 송출 아키텍처 선택 (전체 라이브 방송 적용)
                    </Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div
                        onClick={() => updateIntegration('live_stream_mode', 'AGORA_RTC')}
                        className={cn(
                          'cursor-pointer rounded-xl border p-4 transition-all',
                          !isCdn
                            ? 'border-sky-500 bg-sky-500/10 ring-1 ring-sky-500 shadow-sm'
                            : 'border-border bg-background/50 hover:border-zinc-400'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-foreground flex items-center gap-2">
                            <span className={cn('h-2.5 w-2.5 rounded-full', !isCdn ? 'bg-sky-500 animate-pulse' : 'bg-zinc-400')} />
                            Agora RTC 단독 모드
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-600">
                            초저지연 ~200ms
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                          시청자도 Agora RTC 채널에 직접 입장하여 양방향 딜레이 없는 실시간 방송 진행.
                        </p>
                        <p className="mt-1 text-[11px] text-zinc-500 font-medium">
                          과금: 전체 시청 시간 합산 (Agora RTC 분당 요율)
                        </p>
                      </div>

                      <div
                        onClick={() => updateIntegration('live_stream_mode', 'CDN_HLS')}
                        className={cn(
                          'cursor-pointer rounded-xl border p-4 transition-all',
                          isCdn
                            ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500 shadow-sm'
                            : 'border-border bg-background/50 hover:border-zinc-400'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-foreground flex items-center gap-2">
                            <span className={cn('h-2.5 w-2.5 rounded-full', isCdn ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400')} />
                            CDN 중계 (HLS / LL-HLS) 모드
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600">
                            대규모 비용 80%+ 절감
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                          호스트 송출을 Agora Media Push로 CDN에 전송하고, 시청자는 HLS URL로 재생.
                        </p>
                        <p className="mt-1 text-[11px] text-emerald-600 font-medium">
                          과금: 시청자 수 무관 Agora 시청료 0원 (CDN 트래픽 요금만 발생)
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid gap-4 md:grid-cols-2">
                {integrations
                  .filter((item) => item.id.startsWith('agora_') || item.id.startsWith('live_cdn_'))
                  .map((integration) => {
                    const isConfigured = Boolean((integration.value ?? '').length > 0);
                    const isPasswordType =
                      integration.id.includes('secret') ||
                      integration.id.includes('certificate') ||
                      integration.id.includes('key');
                    return (
                      <div key={integration.id} className="rounded-lg border bg-background/50 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            {integration.label ?? integration.id}
                          </Label>
                          {isConfigured ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" /> 등록됨
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded-full border border-zinc-500/20">
                              <AlertCircle className="h-3 w-3" /> 미등록
                            </span>
                          )}
                        </div>
                        <Input
                          type={isPasswordType ? 'password' : 'text'}
                          value={integration.draftValue ?? ''}
                          placeholder={
                            isConfigured
                              ? isPasswordType
                                ? '••••••••  (등록 완료됨, 변경 시 입력)'
                                : integration.value ?? ''
                              : integration.placeholder ?? '설정값을 입력하세요'
                          }
                          autoComplete="off"
                          onChange={(event) => updateIntegration(integration.id, event.target.value)}
                          disabled={savingIntegrationId === 'bulk'}
                          className="text-xs h-9 font-mono"
                        />
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="truncate max-w-[240px]">{integration.placeholder}</span>
                          {isConfigured && (
                            <button
                              type="button"
                              onClick={() => clearIntegration(integration.id)}
                              disabled={savingIntegrationId === 'bulk'}
                              className="text-red-500 hover:text-red-600 underline font-medium"
                            >
                              {integration.clearRequested ? '삭제 취소' : '저장값 초기화'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 5. AI 직원 엔진 & 클라우드 스토리지 (Google Gemini & Supabase) */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-500" />
                  <h3 className="font-bold text-base text-foreground">5. 제브 AI (Zev AI) & AI 직원 거버넌스 및 클라우드 스토리지</h3>
                  <span className="text-xs text-muted-foreground">실시간 채증, 법률 대조, 수석 판정관 제브 AI 및 증거 스토리지 연동</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Google AI Studio <ExternalLink className="h-3 w-3" />
                  </a>
                  <span className="text-muted-foreground">·</span>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Supabase Console <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {integrations
                  .filter((item) => item.id.startsWith('gemini_') || item.id.startsWith('zev_') || item.id.startsWith('ai_staff_') || item.id.startsWith('supabase_'))
                  .map((integration) => {
                    const isConfigured = Boolean((integration.value ?? '').length > 0);
                    const isPasswordType =
                      integration.id.includes('secret') ||
                      integration.id.includes('key');
                    return (
                      <div key={integration.id} className="rounded-lg border bg-background/50 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            {integration.label ?? integration.id}
                          </Label>
                          {isConfigured ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" /> 등록됨
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded-full border border-zinc-500/20">
                              <AlertCircle className="h-3 w-3" /> 미등록
                            </span>
                          )}
                        </div>
                        <Input
                          type={isPasswordType ? 'password' : 'text'}
                          value={integration.draftValue ?? ''}
                          placeholder={
                            isConfigured
                              ? isPasswordType
                                ? '••••••••  (등록 완료됨, 변경 시 입력)'
                                : integration.value ?? ''
                              : integration.placeholder ?? '설정값을 입력하세요'
                          }
                          autoComplete="off"
                          onChange={(event) => updateIntegration(integration.id, event.target.value)}
                          disabled={savingIntegrationId === 'bulk'}
                          className="text-xs h-9 font-mono"
                        />
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="truncate max-w-[240px]">{integration.placeholder}</span>
                          {isConfigured && (
                            <button
                              type="button"
                              onClick={() => clearIntegration(integration.id)}
                              disabled={savingIntegrationId === 'bulk'}
                              className="text-red-500 hover:text-red-600 underline font-medium"
                            >
                              {integration.clearRequested ? '삭제 취소' : '저장값 초기화'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button asChild size="sm" variant="link" className="text-xs">
                <Link href="/settings/legal">약관 및 정책 문서 관리로 이동 &rarr;</Link>
              </Button>
              <Button
                onClick={() => void saveIntegrations()}
                disabled={savingIntegrationId === 'bulk'}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-sm"
              >
                {savingIntegrationId === 'bulk' ? '암호화 저장 중…' : '모든 변경사항 즉시 저장'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    )}

    {/* 포인트 소모 및 통화 요금 정책 섹션 */}
    {isSectionVisible('pointPolicy') && (
      <section id="settings-pointPolicy" className="space-y-6">
        {/* 1:1 영상 통화 기본 분당 요금(포인트) 동적 설정 카드 */}
        <CallRateSettingCard
          initialData={callRate}
          onUpdated={(updated) => setCallRate(updated)}
        />

        <Card className="border-amber-200/70 dark:border-amber-900/50 shadow-sm">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-amber-500/5 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600">
                  <Coins className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg font-bold">액션별 온(ON) 소모 정책</CardTitle>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                사용자가 1:1 채팅방 개설, 1:1 대화/친구 신청, 라이브 방송 개설 및 입장 시 소모될 온(ON)을 설정합니다.
                활성화된 항목은 앱에서 사용자에게 사전에 확인 안내창이 표시되며 승인 시에만 소모됩니다.
              </p>
            </div>
            <Button
              onClick={handleSavePointPolicy}
              disabled={savingPointPolicy}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-sm px-5"
            >
              {savingPointPolicy ? '저장 중...' : '온(ON) 정책 저장'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            <div className="grid gap-5 md:grid-cols-2">
              {/* 1. 1:1 채팅방 개설 */}
              <div className="rounded-xl border p-4.5 transition bg-card hover:border-amber-400/50 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold text-foreground">1:1 채팅방 개설</Label>
                    <p className="text-xs text-muted-foreground">새로운 1:1 대화방을 최초 개설할 때 소모</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-semibold', pointPolicy.chatRoomCreate.enabled ? 'text-amber-600' : 'text-muted-foreground')}>
                      {pointPolicy.chatRoomCreate.enabled ? '소모 활성' : '무료 (비활성)'}
                    </span>
                    <Switch
                      checked={pointPolicy.chatRoomCreate.enabled}
                      onCheckedChange={(checked) =>
                        setPointPolicy((prev) => ({
                          ...prev,
                          chatRoomCreate: { ...prev.chatRoomCreate, enabled: checked },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2.5 border-t">
                  <Label className="text-sm font-medium whitespace-nowrap text-muted-foreground">소모 금액:</Label>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min={0}
                      value={pointPolicy.chatRoomCreate.amount}
                      disabled={!pointPolicy.chatRoomCreate.enabled}
                      onChange={(e) =>
                        setPointPolicy((prev) => ({
                          ...prev,
                          chatRoomCreate: {
                            ...prev.chatRoomCreate,
                            amount: Math.max(0, parseInt(e.target.value, 10) || 0),
                          },
                        }))
                      }
                      className="pr-8 font-mono text-right"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">온</span>
                  </div>
                  <div className="flex gap-1">
                    {[10, 50, 100].map((inc) => (
                      <Button
                        key={inc}
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!pointPolicy.chatRoomCreate.enabled}
                        onClick={() =>
                          setPointPolicy((prev) => ({
                            ...prev,
                            chatRoomCreate: {
                              ...prev.chatRoomCreate,
                              amount: prev.chatRoomCreate.amount + inc,
                            },
                          }))
                        }
                        className="px-2 text-xs"
                      >
                        +{inc}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. 1:1 채팅방 참여 (입장) */}
              <div className="rounded-xl border p-4.5 transition bg-card hover:border-amber-400/50 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold text-foreground">1:1 채팅방 참여 (기본값 / 개설자 자율 설정)</Label>
                    <p className="text-xs text-muted-foreground">대화방 개설자가 설정한 입장료가 우선 적용되며, 미설정 시 적용되는 관리자 기본값</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-semibold', pointPolicy.chatRoomJoin.enabled ? 'text-amber-600' : 'text-muted-foreground')}>
                      {pointPolicy.chatRoomJoin.enabled ? '소모 활성' : '무료 (비활성)'}
                    </span>
                    <Switch
                      checked={pointPolicy.chatRoomJoin.enabled}
                      onCheckedChange={(checked) =>
                        setPointPolicy((prev) => ({
                          ...prev,
                          chatRoomJoin: { ...prev.chatRoomJoin, enabled: checked },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2.5 border-t">
                  <Label className="text-sm font-medium whitespace-nowrap text-muted-foreground">소모 금액:</Label>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min={0}
                      value={pointPolicy.chatRoomJoin.amount}
                      disabled={!pointPolicy.chatRoomJoin.enabled}
                      onChange={(e) =>
                        setPointPolicy((prev) => ({
                          ...prev,
                          chatRoomJoin: {
                            ...prev.chatRoomJoin,
                            amount: Math.max(0, parseInt(e.target.value, 10) || 0),
                          },
                        }))
                      }
                      className="pr-8 font-mono text-right"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">온</span>
                  </div>
                  <div className="flex gap-1">
                    {[10, 50, 100].map((inc) => (
                      <Button
                        key={inc}
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!pointPolicy.chatRoomJoin.enabled}
                        onClick={() =>
                          setPointPolicy((prev) => ({
                            ...prev,
                            chatRoomJoin: {
                              ...prev.chatRoomJoin,
                              amount: prev.chatRoomJoin.amount + inc,
                            },
                          }))
                        }
                        className="px-2 text-xs"
                      >
                        +{inc}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. 1:1 대화/친구 신청 */}
              <div className="rounded-xl border p-4.5 transition bg-card hover:border-amber-400/50 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold text-foreground">1:1 대화/친구 신청</Label>
                    <p className="text-xs text-muted-foreground">상대방에게 친구 또는 1:1 대화 요청을 전송할 때 소모</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-semibold', pointPolicy.directMessageRequest.enabled ? 'text-amber-600' : 'text-muted-foreground')}>
                      {pointPolicy.directMessageRequest.enabled ? '소모 활성' : '무료 (비활성)'}
                    </span>
                    <Switch
                      checked={pointPolicy.directMessageRequest.enabled}
                      onCheckedChange={(checked) =>
                        setPointPolicy((prev) => ({
                          ...prev,
                          directMessageRequest: { ...prev.directMessageRequest, enabled: checked },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2.5 border-t">
                  <Label className="text-sm font-medium whitespace-nowrap text-muted-foreground">소모 금액:</Label>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min={0}
                      value={pointPolicy.directMessageRequest.amount}
                      disabled={!pointPolicy.directMessageRequest.enabled}
                      onChange={(e) =>
                        setPointPolicy((prev) => ({
                          ...prev,
                          directMessageRequest: {
                            ...prev.directMessageRequest,
                            amount: Math.max(0, parseInt(e.target.value, 10) || 0),
                          },
                        }))
                      }
                      className="pr-8 font-mono text-right"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">온</span>
                  </div>
                  <div className="flex gap-1">
                    {[10, 50, 100].map((inc) => (
                      <Button
                        key={inc}
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!pointPolicy.directMessageRequest.enabled}
                        onClick={() =>
                          setPointPolicy((prev) => ({
                            ...prev,
                            directMessageRequest: {
                              ...prev.directMessageRequest,
                              amount: prev.directMessageRequest.amount + inc,
                            },
                          }))
                        }
                        className="px-2 text-xs"
                      >
                        +{inc}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. 라이브 방송 개설 */}
              <div className="rounded-xl border p-4.5 transition bg-card hover:border-amber-400/50 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold text-foreground">라이브 방송 개설 (호스트)</Label>
                    <p className="text-xs text-muted-foreground">호스트가 새로운 실시간 라이브 방송을 시작할 때 소모</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-semibold', pointPolicy.liveRoomCreate.enabled ? 'text-amber-600' : 'text-muted-foreground')}>
                      {pointPolicy.liveRoomCreate.enabled ? '소모 활성' : '무료 (비활성)'}
                    </span>
                    <Switch
                      checked={pointPolicy.liveRoomCreate.enabled}
                      onCheckedChange={(checked) =>
                        setPointPolicy((prev) => ({
                          ...prev,
                          liveRoomCreate: { ...prev.liveRoomCreate, enabled: checked },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2.5 border-t">
                  <Label className="text-sm font-medium whitespace-nowrap text-muted-foreground">소모 금액:</Label>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min={0}
                      value={pointPolicy.liveRoomCreate.amount}
                      disabled={!pointPolicy.liveRoomCreate.enabled}
                      onChange={(e) =>
                        setPointPolicy((prev) => ({
                          ...prev,
                          liveRoomCreate: {
                            ...prev.liveRoomCreate,
                            amount: Math.max(0, parseInt(e.target.value, 10) || 0),
                          },
                        }))
                      }
                      className="pr-8 font-mono text-right"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">온</span>
                  </div>
                  <div className="flex gap-1">
                    {[50, 100, 300].map((inc) => (
                      <Button
                        key={inc}
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!pointPolicy.liveRoomCreate.enabled}
                        onClick={() =>
                          setPointPolicy((prev) => ({
                            ...prev,
                            liveRoomCreate: {
                              ...prev.liveRoomCreate,
                              amount: prev.liveRoomCreate.amount + inc,
                            },
                          }))
                        }
                        className="px-2 text-xs"
                      >
                        +{inc}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. 라이브 방송 참여 (시청자 입장) */}
              <div className="rounded-xl border p-4.5 transition bg-card hover:border-amber-400/50 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold text-foreground">라이브 방송 입장/시청 (기본값 / 호스트 자율 설정)</Label>
                    <p className="text-xs text-muted-foreground">호스트가 개설 시 지정한 입장료가 우선 적용되며, 미설정 시 적용되는 관리자 기본값</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-semibold', pointPolicy.liveRoomJoin.enabled ? 'text-amber-600' : 'text-muted-foreground')}>
                      {pointPolicy.liveRoomJoin.enabled ? '소모 활성' : '무료 (비활성)'}
                    </span>
                    <Switch
                      checked={pointPolicy.liveRoomJoin.enabled}
                      onCheckedChange={(checked) =>
                        setPointPolicy((prev) => ({
                          ...prev,
                          liveRoomJoin: { ...prev.liveRoomJoin, enabled: checked },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2.5 border-t">
                  <Label className="text-sm font-medium whitespace-nowrap text-muted-foreground">소모 금액:</Label>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min={0}
                      value={pointPolicy.liveRoomJoin.amount}
                      disabled={!pointPolicy.liveRoomJoin.enabled}
                      onChange={(e) =>
                        setPointPolicy((prev) => ({
                          ...prev,
                          liveRoomJoin: {
                            ...prev.liveRoomJoin,
                            amount: Math.max(0, parseInt(e.target.value, 10) || 0),
                          },
                        }))
                      }
                      className="pr-8 font-mono text-right"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">온</span>
                  </div>
                  <div className="flex gap-1">
                    {[10, 50, 100].map((inc) => (
                      <Button
                        key={inc}
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!pointPolicy.liveRoomJoin.enabled}
                        onClick={() =>
                          setPointPolicy((prev) => ({
                            ...prev,
                            liveRoomJoin: {
                              ...prev.liveRoomJoin,
                              amount: prev.liveRoomJoin.amount + inc,
                            },
                          }))
                        }
                        className="px-2 text-xs"
                      >
                        +{inc}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    )}
    </div>
  )
}
