'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, Loader2, RefreshCcw, Send, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  getAdminBroadcastStats,
  sendAdminBroadcast,
  type BroadcastDeviceStats,
  type BroadcastResult,
} from '@/lib/api'
import type { AxiosError } from 'axios'

const TARGET_ROLES = [
  { value: 'ALL', label: '전체 사용자' },
  { value: 'user', label: '일반 회원' },
  { value: 'admin', label: '관리자' },
]

const TEMPLATE_MESSAGES = [
  { label: '서비스 점검 안내', title: '서비스 점검 안내', body: '오늘 밤 02:00~04:00 사이 서비스 점검이 진행됩니다. 이용에 불편을 드려 죄송합니다.' },
  { label: '새 기능 출시', title: '새로운 기능이 추가되었어요! 🎉', body: '프로필에 관심사 태그를 추가하고 더 잘 맞는 사람들을 만나보세요.' },
  { label: '이벤트 알림', title: '특별 이벤트 진행 중! 🎁', body: '지금 앱을 열면 무료 온(ON)을 드립니다. 이벤트 기간을 놓치지 마세요!' },
]

interface SendHistoryEntry {
  id: string
  title: string
  body: string
  role: string
  sentAt: string
  result: BroadcastResult
}

export default function NotificationsPage() {
  const { toast } = useToast()

  const [stats, setStats] = useState<BroadcastDeviceStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const [form, setForm] = useState({
    title: '',
    body: '',
    role: 'ALL',
  })
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<SendHistoryEntry[]>([])

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const data = await getAdminBroadcastStats()
      setStats(data)
    } catch {
      setStats({ totalRegisteredDevices: 0, platformBreakdown: [] })
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  const applyTemplate = (tpl: typeof TEMPLATE_MESSAGES[number]) => {
    setForm((prev) => ({ ...prev, title: tpl.title, body: tpl.body }))
  }

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast({ title: '입력 필요', description: '제목과 내용을 모두 입력하세요.', variant: 'destructive' })
      return
    }
    setSending(true)
    try {
      const result = await sendAdminBroadcast({
        title: form.title.trim(),
        body: form.body.trim(),
        role: form.role === 'ALL' || !form.role ? undefined : form.role,
      })
      const entry: SendHistoryEntry = {
        id: `hist-${Date.now()}`,
        title: form.title.trim(),
        body: form.body.trim(),
        role: form.role === 'ALL' || !form.role ? '전체' : form.role,
        sentAt: new Date().toLocaleString('ko-KR'),
        result,
      }
      setHistory((prev) => [entry, ...prev])
      toast({
        title: '브로드캐스트 완료',
        description: `${result.total}개 기기 대상 — 성공 ${result.sent}, 실패 ${result.failed}${result.reason === 'fallback_mode' ? ' (테스트 모드)' : ''}`,
      })
      setForm((prev) => ({ ...prev, title: '', body: '' }))
      void loadStats()
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '발송에 실패했습니다.'
      toast({ title: '발송 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
      {/* 왼쪽: 발송 폼 */}
      <section className="space-y-4">
        {/* 통계 카드 */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">등록된 기기</p>
                  <p className="text-2xl font-bold">
                    {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (stats?.totalRegisteredDevices ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          {(stats?.platformBreakdown ?? []).map((p) => (
            <Card key={p.platform}>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground capitalize">{p.platform}</p>
                    <p className="text-2xl font-bold">{p.count.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadStats()}
            disabled={statsLoading}
            className="self-end h-9"
          >
            {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            <span className="ml-1">새로고침</span>
          </Button>
        </div>

        {/* 메시지 작성 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              브로드캐스트 발송
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              FCM을 통해 등록된 모든 기기로 푸시 알림을 전송합니다. 500개 단위 청크로 분할 발송됩니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 템플릿 */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">빠른 템플릿 선택</Label>
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_MESSAGES.map((tpl) => (
                  <Button
                    key={tpl.label}
                    size="sm"
                    variant="outline"
                    onClick={() => applyTemplate(tpl)}
                  >
                    {tpl.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>대상 역할</Label>
              <Select value={form.role} onValueChange={(v) => setForm((prev) => ({ ...prev, role: v }))}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>알림 제목</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="예: 새로운 기능이 추가됐어요!"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground text-right">{form.title.length}/100</p>
            </div>

            <div className="space-y-2">
              <Label>알림 내용</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                placeholder="본문 내용을 입력하세요..."
                rows={4}
                maxLength={512}
              />
              <p className="text-xs text-muted-foreground text-right">{form.body.length}/512</p>
            </div>

            <Button onClick={() => void handleSend()} disabled={sending} className="w-full sm:w-auto">
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {sending ? '발송 중...' : '브로드캐스트 발송'}
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* 오른쪽: 발송 히스토리 */}
      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>발송 기록</CardTitle>
            <p className="text-sm text-muted-foreground">
              이 세션의 발송 내역입니다. 페이지를 새로고침하면 초기화됩니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">아직 발송 기록이 없습니다.</p>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="rounded-md border p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{entry.title}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                        entry.result.failed > 0
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {entry.result.reason === 'fallback_mode' ? '테스트' : `${entry.result.sent}/${entry.result.total}`}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{entry.body}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>대상: {entry.role}</span>
                    <span>·</span>
                    <span>{entry.sentAt}</span>
                  </div>
                  {entry.result.failed > 0 && (
                    <p className="text-xs text-destructive">실패: {entry.result.failed}건</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 발송 가이드 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">발송 주의사항</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• 브로드캐스트는 등록된 모든 기기(최대 5,000개/회)로 전송됩니다.</p>
            <p>• Firebase FCM 인증 정보가 설정되지 않은 경우 테스트 모드로 동작합니다.</p>
            <p>• 유효하지 않은 토큰은 자동으로 정리됩니다.</p>
            <p>• 개인화 푸시 발송은 사용자 상세 페이지에서 진행하세요.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
