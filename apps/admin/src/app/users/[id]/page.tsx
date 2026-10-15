'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  Gift,
  ImageIcon,
  Mail,
  MinusCircle,
  Phone,
  PhoneCall,
  PlusCircle,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sparkles,
  User as UserIcon,
  Video,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  adjustUserPoints,
  getUserById,
  updateUserProfile,
  updateUserStatus,
  type StreamerTier,
  type UserDetail,
} from '@/lib/api'
import type { AxiosError } from 'axios'

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '정상 이용 (ACTIVE)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'PENDING_VERIFICATION', label: '인증 대기 (PENDING)', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { value: 'UNDER_REVIEW', label: '심사 진행 중 (REVIEW)', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { value: 'SUSPENDED', label: '이용 정지 (SUSPENDED)', color: 'text-rose-700 bg-rose-50 border-rose-200' },
] as const

const STREAMER_TIER_OPTIONS: { value: StreamerTier; label: string; baseRate: number; feePercent: number }[] = [
  { value: 'ROOKIE', label: '루키 호스트 (ROOKIE)', baseRate: 60, feePercent: 40 },
  { value: 'BEST', label: '베스트 스트리머 (BEST)', baseRate: 70, feePercent: 30 },
  { value: 'PARTNER', label: '파트너 스트리머 (PARTNER)', baseRate: 80, feePercent: 20 },
]

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='100%' height='100%' fill='%23f1f5f9'/><circle cx='100' cy='78' r='36' fill='%23cbd5f5'/><rect x='45' y='125' width='110' height='50' rx='25' fill='%2394a3b8'/></svg>"

function normalizeDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('ko-KR')
}

export default function UserDetailPage() {
  const { toast } = useToast()
  const params = useParams<{ id: string }>()
  const userId = params?.id

  const [user, setUser] = useState<UserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [statusDraft, setStatusDraft] = useState<string>('ACTIVE')
  const [statusReason, setStatusReason] = useState<string>('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // 포인트 수동 지급 / 차감
  const [pointDeltaDraft, setPointDeltaDraft] = useState<string>('')
  const [pointReasonDraft, setPointReasonDraft] = useState<string>('')
  const [isUpdatingPoints, setIsUpdatingPoints] = useState(false)

  // 스트리머 등급 및 환전 단가 계약
  const [tierDraft, setTierDraft] = useState<StreamerTier>('ROOKIE')
  const [customRateDraft, setCustomRateDraft] = useState<string>('')
  const [contractMemoDraft, setContractMemoDraft] = useState<string>('')
  const [isUpdatingContract, setIsUpdatingContract] = useState(false)

  // 복사 피드백
  const [isCopiedId, setIsCopiedId] = useState(false)

  useEffect(() => {
    if (!userId) return
    void loadUserDetail(userId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function loadUserDetail(targetId: string) {
    setIsLoading(true)
    try {
      const detail = await getUserById(targetId)
      setUser(detail)
      setStatusDraft(detail.status?.toUpperCase() ?? 'ACTIVE')
      setTierDraft(((detail as any).streamerTier as StreamerTier) ?? 'ROOKIE')
      setCustomRateDraft((detail as any).customExchangeRate != null ? String((detail as any).customExchangeRate) : '')
      setContractMemoDraft((detail as any).contractMemo ?? '')
    } catch (error) {
      const ax = error as AxiosError | undefined
      const status = ax?.response?.status
      const fallbackMessage = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
      const message =
        status && [404, 500].includes(status)
          ? fallbackMessage
          : ((ax?.response?.data as any)?.message || ax?.message || fallbackMessage)
      toast({
        title: '사용자 상세 조회 실패',
        description: Array.isArray(message) ? message.join(', ') : String(message),
        variant: 'destructive',
      })
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStatusUpdate() {
    if (!userId) return
    setIsUpdatingStatus(true)
    try {
      const updated = await updateUserStatus(userId, statusDraft)
      setUser((prev) => ({ ...(prev || {}), ...updated, status: statusDraft }))
      toast({
        title: '상태 업데이트 완료',
        description: `회원 상태가 [${statusDraft}]로 성공적으로 변경되었습니다.`,
      })
      setStatusReason('')
    } catch (error) {
      const ax = error as AxiosError | undefined
      const status = ax?.response?.status
      const fallbackMessage = '상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.'
      const message =
        status && [404, 500].includes(status)
          ? fallbackMessage
          : ((ax?.response?.data as any)?.message || ax?.message || fallbackMessage)
      toast({
        title: '상태 업데이트 실패',
        description: Array.isArray(message) ? message.join(', ') : String(message),
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  async function handlePointsAdjust() {
    if (!userId) return
    const delta = Number(pointDeltaDraft)
    if (isNaN(delta) || delta === 0) {
      toast({
        title: '입력 오류',
        description: '지급(+) 또는 차감(-)할 올바른 정수 포인트를 입력해 주세요.',
        variant: 'destructive',
      })
      return
    }

    if (!pointReasonDraft.trim()) {
      toast({
        title: '사유 필수',
        description: '관리자 수동 포인트 변동 사유를 반드시 입력해 주세요 (감사 로그용).',
        variant: 'destructive',
      })
      return
    }

    setIsUpdatingPoints(true)
    try {
      const result = await adjustUserPoints(userId, delta, pointReasonDraft.trim())
      setUser((prev: any) => ({
        ...prev,
        pointBalance: result.pointBalance ?? (prev?.pointBalance ?? 0) + delta,
      }))
      toast({
        title: '포인트 변동 처리 완료',
        description: `${delta > 0 ? `+${delta.toLocaleString()} 온 지급` : `${delta.toLocaleString()} 온 차감`}이 정상 반영되었습니다.`,
      })
      setPointDeltaDraft('')
      setPointReasonDraft('')
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '포인트 조정 처리에 실패했습니다.'
      toast({
        title: '포인트 조정 실패',
        description: String(message),
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingPoints(false)
    }
  }

  async function handleContractUpdate() {
    if (!userId) return
    setIsUpdatingContract(true)
    try {
      const parsedRate = customRateDraft.trim() === '' ? null : Number(customRateDraft)
      if (parsedRate !== null && (isNaN(parsedRate) || parsedRate <= 0 || parsedRate > 100)) {
        toast({
          title: '입력 오류',
          description: '개별 환전 단가는 1 ~ 100 사이의 숫자여야 합니다.',
          variant: 'destructive',
        })
        setIsUpdatingContract(false)
        return
      }

      const updated = await updateUserProfile(userId, {
        streamerTier: tierDraft,
        customExchangeRate: parsedRate,
        contractMemo: contractMemoDraft.trim() || null,
      })
      setUser((prev: any) => ({
        ...prev,
        ...updated,
        streamerTier: tierDraft,
        customExchangeRate: parsedRate,
        contractMemo: contractMemoDraft.trim() || null,
      }))
      toast({
        title: '스트리머 계약 및 등급 설정 완료',
        description: '회원의 등급 및 환급율 단가가 성공적으로 갱신되었습니다.',
      })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const status = ax?.response?.status
      const fallbackMessage = '계약 정보를 저장하지 못했습니다.'
      const message =
        status && [404, 500].includes(status)
          ? fallbackMessage
          : ((ax?.response?.data as any)?.message || ax?.message || fallbackMessage)
      toast({
        title: '계약 설정 실패',
        description: Array.isArray(message) ? message.join(', ') : String(message),
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingContract(false)
    }
  }

  function handleCopyUserId() {
    if (!userId) return
    void navigator.clipboard.writeText(userId)
    setIsCopiedId(true)
    toast({ title: 'ID 복사됨', description: '회원 식별자가 클립보드에 복사되었습니다.' })
    setTimeout(() => setIsCopiedId(false), 2000)
  }

  const profileImage =
    (user as any)?.avatarUrl || (user as any)?.profileImage || PLACEHOLDER_IMAGE

  const photos: { id: string; url: string; order?: number }[] =
    (user as any)?.photos || []

  const stats = (user as any)?.stats || {
    hostedCalls: 0,
    guestCalls: 0,
    giftsSent: 0,
    giftsReceived: 0,
  }

  const effectiveRate = useMemo(() => {
    if (customRateDraft && !isNaN(Number(customRateDraft))) {
      return Number(customRateDraft)
    }
    const matched = STREAMER_TIER_OPTIONS.find((t) => t.value === tierDraft)
    return matched ? matched.baseRate : 60
  }, [tierDraft, customRateDraft])

  const statusConfig = useMemo(() => {
    const curStatus = (user?.status ?? 'ACTIVE').toUpperCase()
    return (
      STATUS_OPTIONS.find((s) => s.value === curStatus) || {
        value: curStatus,
        label: curStatus,
        color: 'text-slate-700 bg-slate-50 border-slate-200',
      }
    )
  }, [user?.status])

  return (
    <div className="space-y-6 pb-12">
      {/* 1. 상단 브레드크럼 & 회원 요약 헤더 바 */}
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm" className="h-9 w-9 p-0 shrink-0">
            <Link href="/users" title="회원 목록으로">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profileImage}
            alt={user?.nickname ?? '프로필'}
            className="h-12 w-12 rounded-full border object-cover shadow-sm shrink-0"
          />

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {user?.nickname || (user as any)?.displayName || '회원 상세 정보'}
              </h1>
              <Badge variant="outline" className={`font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </Badge>
              <Badge variant="outline" className="border-indigo-200 bg-indigo-50 font-medium text-indigo-700">
                {(user as any)?.streamerTier || tierDraft || 'ROOKIE'}
              </Badge>
              {(user as any)?.role === 'admin' && (
                <Badge variant="outline" className="border-purple-200 bg-purple-50 font-medium text-purple-700">
                  ADMIN
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={handleCopyUserId}
                className="inline-flex items-center gap-1 font-mono transition-colors hover:text-foreground"
                title="클릭하여 ID 복사"
              >
                <span>ID: {userId?.slice(0, 16)}...</span>
                {isCopiedId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              </button>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                가입일: {normalizeDate(user?.createdAt)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {(user as any)?.provider ? `${(user as any).provider} 연동` : '이메일 계정'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => userId && void loadUserDetail(userId)}
            disabled={isLoading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button asChild variant="secondary" size="sm" className="gap-1.5 text-xs">
            <Link href="/users">
              <ArrowLeft className="h-3.5 w-3.5" />
              목록으로
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. 핵심 4대 메트릭 KPI 카드 그리드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 온(ON) 포인트 */}
        <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50/40 via-white to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-amber-900">보유 온 (ON) 포인트</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Coins className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-amber-700">
              {((user as any)?.pointBalance ?? 0).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">온</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">현재 보유 중인 유료 충전 잔액</p>
          </CardContent>
        </Card>

        {/* 1분 통화 요율 */}
        <Card className="border-indigo-200/60 bg-gradient-to-br from-indigo-50/40 via-white to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-indigo-900">호스트 통화 요율</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <PhoneCall className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-indigo-700">
              {(user as any)?.callRatePerMinute ? (
                <>
                  {Number((user as any).callRatePerMinute).toLocaleString()}{' '}
                  <span className="text-sm font-normal text-muted-foreground">온/분</span>
                </>
              ) : (
                <span className="text-base text-muted-foreground font-normal">기본 (100 온/분)</span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">1:1 영상/음성 통화 분당 단가</p>
          </CardContent>
        </Card>

        {/* 통화 이용 실적 */}
        <Card className="border-blue-200/60 bg-gradient-to-br from-blue-50/40 via-white to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-blue-900">통화 이용 세션</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Video className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-blue-700">
              {stats.hostedCalls + stats.guestCalls} <span className="text-sm font-normal text-muted-foreground">회</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              호스트 {stats.hostedCalls}회 · 게스트 {stats.guestCalls}회
            </p>
          </CardContent>
        </Card>

        {/* 선물 후원 실적 */}
        <Card className="border-rose-200/60 bg-gradient-to-br from-rose-50/40 via-white to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-rose-900">선물 교환 실적</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <Gift className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-rose-700">
              {stats.giftsReceived + stats.giftsSent} <span className="text-sm font-normal text-muted-foreground">건</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              받은 선물 {stats.giftsReceived}건 · 보낸 선물 {stats.giftsSent}건
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. 메인 그리드 레이아웃 (좌측 고정 사이드바 340px, 우측 1fr 탭 콘텐츠) */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[340px_1fr]">
        {/* ===================== [좌측 컬럼: 프로필 & 퀵 운영 액션] ===================== */}
        <div className="space-y-6">
          {/* 프로필 이미지 및 신원 카드 */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-primary" />
                프로필 & 계정 식별
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center rounded-xl border bg-muted/20 p-5 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profileImage}
                  alt={user?.nickname ?? '프로필'}
                  className="h-28 w-28 rounded-full border-2 border-background object-cover shadow-md"
                />
                <h3 className="mt-3 text-base font-bold text-foreground">
                  {user?.nickname ?? '닉네임 미설정'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {(user as any)?.email || (user as any)?.phoneNumber || '연락처 없음'}
                </p>
                {(user as any)?.bio && (
                  <p className="mt-2 line-clamp-2 rounded-md bg-muted/40 p-2 text-xs italic text-muted-foreground">
                    &quot;{(user as any).bio}&quot;
                  </p>
                )}
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <span className="text-muted-foreground">회원 고유 ID</span>
                  <span className="font-mono font-medium text-foreground">{userId?.slice(0, 12)}...</span>
                </div>
                <div className="flex items-center justify-between border-b pb-1.5">
                  <span className="text-muted-foreground">가입 방식</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {(user as any)?.provider ?? '이메일'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between border-b pb-1.5">
                  <span className="text-muted-foreground">가입 일시</span>
                  <span className="text-foreground">{normalizeDate(user?.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">최근 정보 갱신</span>
                  <span className="text-foreground">{normalizeDate((user as any)?.updatedAt || user?.lastActiveAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 계정 상태 즉각 변경 카드 */}
          <Card className="border-rose-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  계정 상태 관리
                </span>
                <Badge variant="outline" className={`text-[10px] ${statusConfig.color}`}>
                  {statusConfig.label}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                회원의 서비스 이용 권한 및 제재 상태를 즉시 변경합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="status-select" className="text-xs font-medium">
                  변경할 상태
                </Label>
                <Select value={statusDraft} onValueChange={(val) => setStatusDraft(val)}>
                  <SelectTrigger id="status-select" className="h-9 text-xs">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status-reason" className="text-xs font-medium">
                  상태 변경 사유 (감사 로그용)
                </Label>
                <Input
                  id="status-reason"
                  placeholder="예: 신고 누적으로 인한 일시 정지"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <Button
                size="sm"
                className="w-full gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white"
                onClick={handleStatusUpdate}
                disabled={isUpdatingStatus || isLoading}
              >
                {isUpdatingStatus ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    회원 상태 즉시 저장
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 온(ON) 포인트 수동 지급 / 차감 카드 */}
          <Card className="border-amber-100 bg-gradient-to-br from-white to-amber-50/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-600" />
                  온(ON) 포인트 관리
                </span>
                <span className="text-xs font-bold text-amber-700">
                  {((user as any)?.pointBalance ?? 0).toLocaleString()} ON
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                관리자 권한으로 포인트를 직접 지급하거나 차감합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="point-amount" className="text-xs font-medium">
                  변동 수량 (양수: 지급, 음수: 차감)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="point-amount"
                    type="number"
                    placeholder="예: 500 또는 -200"
                    value={pointDeltaDraft}
                    onChange={(e) => setPointDeltaDraft(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-[11px] text-emerald-700"
                      onClick={() => setPointDeltaDraft('1000')}
                    >
                      +1천
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-[11px] text-rose-700"
                      onClick={() => setPointDeltaDraft('-1000')}
                    >
                      -1천
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="point-reason" className="text-xs font-medium">
                  지급/차감 사유 <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="point-reason"
                  placeholder="예: 신규 가입 이벤트 보상 지급"
                  value={pointReasonDraft}
                  onChange={(e) => setPointReasonDraft(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <Button
                size="sm"
                className="w-full gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handlePointsAdjust}
                disabled={isUpdatingPoints || isLoading}
              >
                {isUpdatingPoints ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    반영 중...
                  </>
                ) : (
                  <>
                    <Coins className="h-3.5 w-3.5" />
                    포인트 수동 조정 적용
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ===================== [우측 컬럼: 넓은 탭 상세 설정 & 계약 & 갤러리] ===================== */}
        <div className="space-y-6">
          <Tabs defaultValue="contract" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-muted/60 p-1">
              <TabsTrigger value="contract" className="gap-1.5 text-xs">
                <Award className="h-3.5 w-3.5 text-indigo-600" />
                스트리머 계약
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-1.5 text-xs">
                <UserIcon className="h-3.5 w-3.5 text-blue-600" />
                상세 프로필
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-1.5 text-xs">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                활동 & 감사로그
              </TabsTrigger>
              <TabsTrigger value="raw" className="gap-1.5 text-xs">
                <Copy className="h-3.5 w-3.5 text-slate-600" />
                원본 JSON
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: 스트리머 등급 및 정산 환급율 계약 (이전에 320px 좁은 박스에 찌그러져 있던 핵심 기능!) */}
            <TabsContent value="contract" className="space-y-4">
              <Card className="border-indigo-100 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-indigo-50/50 via-white to-white pb-4 border-b">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-indigo-950 flex items-center gap-2">
                        <Award className="h-5 w-5 text-indigo-600" />
                        스트리머 등급 및 정산 환급율 계약 관리
                      </CardTitle>
                      <CardDescription className="text-xs">
                        호스트의 등급을 부여하고, 출금 신청 시 적용될 1온당 KRW 환전 단가를 설정합니다.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="border-indigo-300 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 w-fit">
                      현재 실적용: {effectiveRate}원/온 (회사 수수료 {100 - effectiveRate}%)
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-5">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* 스트리머 등급 선택 */}
                    <div className="space-y-2 rounded-xl border bg-card p-4">
                      <Label htmlFor="streamer-tier-select" className="text-xs font-bold text-foreground">
                        회원 / 스트리머 공식 등급
                      </Label>
                      <Select
                        value={tierDraft}
                        onValueChange={(value) => setTierDraft(value as StreamerTier)}
                      >
                        <SelectTrigger id="streamer-tier-select" className="h-10 text-xs">
                          <SelectValue placeholder="등급 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {STREAMER_TIER_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label} ({opt.baseRate}원/온, 회사 {opt.feePercent}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        기본 가입 시 <strong className="text-foreground">루키(ROOKIE, 60원)</strong>이며, 전속 계약 시 <strong className="text-indigo-600">파트너(PARTNER, 80원)</strong>로 승급됩니다.
                      </p>
                    </div>

                    {/* 개별 계약 환전 단가 */}
                    <div className="space-y-2 rounded-xl border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="custom-exchange-rate" className="text-xs font-bold text-foreground">
                          개별 계약 환전 단가 (원/온, 선택사항)
                        </Label>
                        {customRateDraft && (
                          <span className="text-[11px] font-medium text-indigo-600">
                            등급 기본값 무시 (개별 우대 적용)
                          </span>
                        )}
                      </div>
                      <Input
                        id="custom-exchange-rate"
                        type="number"
                        placeholder="비워둘 시 등급 기본값 적용 (예: 75, 85)"
                        value={customRateDraft}
                        onChange={(e) => setCustomRateDraft(e.target.value)}
                        min={1}
                        max={100}
                        className="h-10 text-xs font-mono"
                      />
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        MCN 제휴사 특별 계약이 있는 경우에만 1온당 지급할 원화 금액(1~100)을 직접 입력하세요.
                      </p>
                    </div>
                  </div>

                  {/* 실시간 환전 수수료 시뮬레이션 카드 */}
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
                    <p className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 mb-2">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      실시간 정산 환전 시뮬레이션 (10,000 온 출금 신청 기준)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="rounded-lg bg-white p-3 border shadow-2xs">
                        <span className="text-muted-foreground text-[11px]">적용 환급율</span>
                        <p className="text-base font-bold text-indigo-600 mt-0.5">{effectiveRate} KRW / 1온</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 border shadow-2xs">
                        <span className="text-muted-foreground text-[11px]">스트리머 실수령액</span>
                        <p className="text-base font-bold text-emerald-600 mt-0.5">
                          {(10000 * effectiveRate).toLocaleString()} 원
                        </p>
                      </div>
                      <div className="rounded-lg bg-white p-3 border shadow-2xs">
                        <span className="text-muted-foreground text-[11px]">회사 플랫폼 수수료</span>
                        <p className="text-base font-bold text-slate-700 mt-0.5">
                          {(10000 * (100 - effectiveRate)).toLocaleString()} 원 ({100 - effectiveRate}%)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 계약 및 파트너십 메모 */}
                  <div className="space-y-2">
                    <Label htmlFor="contract-memo" className="text-xs font-bold text-foreground">
                      계약 및 파트너십 메모
                    </Label>
                    <Textarea
                      id="contract-memo"
                      placeholder="예: 2026-10 전속 파트너 계약 체결, MCN 제휴 우대 단가 적용 (담당자: 총괄운영팀)"
                      value={contractMemoDraft}
                      onChange={(e) => setContractMemoDraft(e.target.value)}
                      className="min-h-[80px] text-xs resize-none"
                    />
                  </div>

                  {/* 하단 저장 버튼 */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t pt-4">
                    <p className="text-xs text-muted-foreground">
                      ※ 스트리머가 앱에서 출금 신청 시 설정된 단가로 실지급액과 회사 수수료가 즉시 자동 계산됩니다.
                    </p>
                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shrink-0"
                      onClick={handleContractUpdate}
                      disabled={isUpdatingContract || isLoading}
                    >
                      {isUpdatingContract ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          계약 저장 중...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          계약 및 등급 저장
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: 상세 프로필 & 갤러리 사진 */}
            <TabsContent value="profile" className="space-y-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-blue-600" />
                    상세 계정 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">닉네임</p>
                      <p className="mt-1 text-sm font-semibold">{user?.nickname ?? '-'}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">표시 이름 (DisplayName)</p>
                      <p className="mt-1 text-sm font-semibold">{(user as any)?.displayName ?? '-'}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">이메일 주소</p>
                      <p className="mt-1 text-sm font-semibold">{(user as any)?.email ?? '-'}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">전화번호</p>
                      <p className="mt-1 text-sm font-semibold">{user?.phoneNumber ?? '-'}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">현재 상태</p>
                      <Badge variant="outline" className={`mt-1 font-semibold ${statusConfig.color}`}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">가입 일시</p>
                      <p className="mt-1 text-sm font-semibold">{normalizeDate(user?.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 추가 프로필 사진 갤러리 */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      등록된 프로필 사진 갤러리 ({photos.length}장)
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">앱 내 공개 프로필 이미지</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {photos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
                      {photos.map((photo, idx) => (
                        <div key={photo.id || idx} className="group relative overflow-hidden rounded-xl border bg-muted/30 aspect-square">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt={`프로필 ${idx + 1}`}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                            #{idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/60 mb-2" />
                      <p className="text-xs">등록된 추가 프로필 사진이 없습니다.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: 활동 통계 및 이용 내역 */}
            <TabsContent value="activity" className="space-y-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    활동 타임스탬프 및 메모
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">가입일</p>
                      <p className="mt-1 text-sm font-semibold">{normalizeDate(user?.createdAt)}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">최근 활동일</p>
                      <p className="mt-1 text-sm font-semibold">{normalizeDate(user?.lastActiveAt || (user as any)?.updatedAt)}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">마케팅 수신 동의</p>
                      <p className="mt-1 text-sm font-semibold">
                        {user?.marketingOptIn ? '동의 완료' : '미동의'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">계정 상태 메모</p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {user?.memo || (user as any)?.auditMemo || '등록된 관리자 메모가 없습니다.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: 시스템 원본 데이터 (JSON) */}
            <TabsContent value="raw" className="space-y-4">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                  <div>
                    <CardTitle className="text-sm font-semibold">원본 API 응답 데이터</CardTitle>
                    <CardDescription className="text-xs">
                      백엔드에서 전달된 원본 JSON 데이터 스냅샷입니다.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      if (!user) return
                      void navigator.clipboard.writeText(JSON.stringify(user, null, 2))
                      toast({ title: 'JSON 복사됨', description: '클립보드에 복사되었습니다.' })
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    JSON 복사
                  </Button>
                </CardHeader>
                <CardContent className="pt-4">
                  <pre className="max-h-[420px] overflow-auto rounded-lg bg-muted/60 p-4 font-mono text-xs leading-relaxed">
                    {user ? JSON.stringify(user, null, 2) : '로딩 중...'}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
