'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, ImageIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { getUserById, updateUserStatus, type UserDetail } from '@/lib/api'
import type { AxiosError } from 'axios'

const STATUS_OPTIONS = ['ACTIVE', 'PENDING_VERIFICATION', 'UNDER_REVIEW', 'SUSPENDED'] as const

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
