'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, ImageIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { getUserById, updateUserProfile, updateUserStatus, type StreamerTier, type UserDetail } from '@/lib/api'
import type { AxiosError } from 'axios'

const STATUS_OPTIONS = ['ACTIVE', 'PENDING_VERIFICATION', 'UNDER_REVIEW', 'SUSPENDED'] as const

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
  const [isUpdating, setIsUpdating] = useState(false)

  // 스트리머 등급 및 환전 단가 계약
  const [tierDraft, setTierDraft] = useState<StreamerTier>('ROOKIE')
  const [customRateDraft, setCustomRateDraft] = useState<string>('')
  const [contractMemoDraft, setContractMemoDraft] = useState<string>('')
  const [isUpdatingContract, setIsUpdatingContract] = useState(false)

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
      setStatusDraft(detail.status ?? 'ACTIVE')
      setTierDraft((detail.streamerTier as StreamerTier) ?? 'ROOKIE')
      setCustomRateDraft(detail.customExchangeRate != null ? String(detail.customExchangeRate) : '')
      setContractMemoDraft(detail.contractMemo ?? '')
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
    setIsUpdating(true)
    try {
      const updated = await updateUserStatus(userId, statusDraft)
      setUser(updated)
      toast({ title: '상태 업데이트 완료', description: '사용자 상태가 갱신되었습니다.' })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const status = ax?.response?.status
      const fallbackMessage = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
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
      setIsUpdating(false)
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
      setUser(updated)
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

  const activityItems = useMemo(() => {
    if (!user) return []
    return [
      { label: '가입일', value: normalizeDate(user.createdAt) },
      { label: '최근 활동', value: normalizeDate(user.lastActiveAt) },
      { label: '마케팅 수신', value: user.marketingOptIn ? '수신 동의' : '미동의' },
    ]
  }, [user])

  const profileImage = (user as any)?.profileImage || (user as any)?.avatarUrl || PLACEHOLDER_IMAGE

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">사용자 상세</p>
          <h1 className="text-xl font-semibold">{user?.nickname ?? '사용자 정보'}</h1>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/users">
            <ArrowLeft className="mr-2 h-4 w-4" /> 목록으로
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>프로필 이미지</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-center rounded-xl border bg-muted/40 p-6">
              {profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileImage} alt="프로필 이미지" className="h-40 w-40 rounded-full object-cover" />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-full bg-muted">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">프로필 이미지가 없으면 기본 placeholder가 표시됩니다.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">닉네임</p>
                <p className="font-semibold">{user?.nickname ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">전화번호</p>
                <p className="font-semibold break-all">{user?.phoneNumber ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">상태</p>
                <p className="font-semibold uppercase tracking-wide">{user?.status ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">가입일</p>
                <p className="font-semibold">{normalizeDate(user?.createdAt)}</p>
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <Label htmlFor="status-select" className="text-xs text-muted-foreground">
                상태 변경
              </Label>
              <div className="mt-2 flex flex-wrap gap-2">
                <Select value={statusDraft} onValueChange={(value) => setStatusDraft(value)}>
                  <SelectTrigger id="status-select" className="w-[200px]">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleStatusUpdate} disabled={isUpdating || isLoading}>
                  {isUpdating ? '저장 중...' : '상태 업데이트'}
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                활성화/비활성화 및 정지 상태를 변경하면 `PUT /users/{'{id}'}/status`로 요청됩니다.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>스트리머 등급 및 정산 환급율 설정</span>
              <span className="text-xs font-normal text-muted-foreground">
                현재 실적용:{' '}
                <strong className="text-indigo-600">
                  {user?.customExchangeRate
                    ? `${user.customExchangeRate}원/온 (개별계약, 회사 ${100 - user.customExchangeRate}%)`
                    : `${
                        user?.streamerTier === 'PARTNER'
                          ? '80원/온 (파트너, 회사 20%)'
                          : user?.streamerTier === 'BEST'
                          ? '70원/온 (베스트, 회사 30%)'
                          : '60원/온 (루키, 회사 40%)'
                      }`}
                </strong>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="streamer-tier-select" className="text-xs font-medium">
                  회원/스트리머 등급
                </Label>
                <Select
                  value={tierDraft}
                  onValueChange={(value) => setTierDraft(value as StreamerTier)}
                >
                  <SelectTrigger id="streamer-tier-select">
                    <SelectValue placeholder="등급 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {STREAMER_TIER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label} ({opt.baseRate}원/온, 회사 {opt.feePercent}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  가입 시 기본값은 루키(ROOKIE, 60원)이며, 전속 계약 시 파트너(PARTNER, 80원)로 승급할 수 있습니다.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="custom-exchange-rate" className="text-xs font-medium">
                  개별 계약 환전 단가 (원/온, 선택사항)
                </Label>
                <Input
                  id="custom-exchange-rate"
                  type="number"
                  placeholder="비워둘 시 등급 기본값 적용 (예: 75, 85)"
                  value={customRateDraft}
                  onChange={(e) => setCustomRateDraft(e.target.value)}
                  min={1}
                  max={100}
                />
                <p className="text-[11px] text-muted-foreground">
                  특별 계약이 있는 경우 1온당 직접 지급할 KRW 금액(1~100)을 입력하세요.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contract-memo" className="text-xs font-medium">
                계약 및 파트너십 메모
              </Label>
              <Input
                id="contract-memo"
                placeholder="예: 2026-10 전속 파트너 계약 체결, MCN 제휴 우대 단가 적용"
                value={contractMemoDraft}
                onChange={(e) => setContractMemoDraft(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                ※ 스트리머가 앱에서 출금 신청 시 설정된 단가로 실지급액과 회사 수수료가 즉시 자동 계산됩니다.
              </p>
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleContractUpdate}
                disabled={isUpdatingContract || isLoading}
              >
                {isUpdatingContract ? '저장 중...' : '계약 및 등급 저장'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">요약</TabsTrigger>
          <TabsTrigger value="activity">활동 이력</TabsTrigger>
          <TabsTrigger value="raw">원본 데이터</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>요약 카드</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {activityItems.map((item) => (
                <div key={item.label} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold">{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" /> 활동 로그
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">최근 활동일</p>
                <p className="font-semibold">{normalizeDate(user?.lastActiveAt)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">가입일</p>
                <p className="font-semibold">{normalizeDate(user?.createdAt)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">상태 메모</p>
                <p className="font-semibold">{user?.memo ?? '등록된 메모가 없습니다.'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="raw">
          <Card>
            <CardHeader>
              <CardTitle>원본 응답</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap break-words text-xs">
                {user ? JSON.stringify(user, null, 2) : '로딩 중...'}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
