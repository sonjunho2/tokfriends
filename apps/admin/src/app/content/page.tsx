'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  createAnnouncement,
  getActiveAnnouncements,
  getAnnouncements,
  updateAnnouncement as patchAnnouncement,
  type Announcement,
  type AnnouncementWritePayload,
} from '@/lib/api'
import type { AxiosError } from 'axios'

interface CampaignChannel {
  id: string
  title: string
  description: string
  audience: string
  enabled: boolean
}

interface CampaignDraft {
  name: string
  target: string
  schedule: string
  message: string
  deepLink: string
}

interface EngagementTicket {
  id: string
  user: string
  category: 'FAQ' | '문의' | '버그 신고'
  status: '대기' | '진행' | '완료'
  createdAt: string
}

function normalizeAnnouncement(raw: Partial<Announcement> & Record<string, any>): Announcement {
  const scheduled = raw.scheduledAt ?? raw.startsAt ?? raw.startAt ?? null
  const activeFlag =
    typeof raw.isActive === 'boolean'
      ? raw.isActive
      : Boolean(raw.active ?? raw.enabled ?? (raw.status === 'PUBLISHED'))
  const title = raw.title ?? raw.name ?? '(제목 없음)'
  const body = raw.body ?? raw.content ?? raw.message ?? ''
  const link = raw.link ?? raw.url ?? raw.href ?? undefined
  const audience = raw.audience ?? raw.target ?? raw.channel ?? '전체'
  const idValue = raw.id ?? raw.uuid ?? raw._id ?? `ann-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`

  return {
    id: String(idValue),
    title,
    body,
    content: raw.content ?? body,
    audience,
    link,
    isActive: activeFlag,
    status: raw.status ?? (activeFlag ? 'PUBLISHED' : scheduled ? 'SCHEDULED' : 'DRAFT'),
    scheduledAt: scheduled,
    startsAt: raw.startsAt ?? raw.startAt ?? scheduled,
    endsAt: raw.endsAt ?? raw.endAt ?? raw.expiresAt ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
  }
}

function normalizeAnnouncements(payload: unknown): Announcement[] {
  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeAnnouncement(item as any))
  }

  if (payload && typeof payload === 'object') {
    for (const key of ['announcements', 'items', 'results', 'data', 'records']) {
      const value = (payload as Record<string, unknown>)[key]
      if (Array.isArray(value)) {
        return value.map((item) => normalizeAnnouncement(item as any))
      }
    }
  }

  return []
}

function resolveAnnouncementStatus(record: Announcement) {
  if (record.status) return record.status
  if (record.isActive) return 'PUBLISHED'
  if (record.startsAt || record.scheduledAt) return 'SCHEDULED'
  return 'DRAFT'
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

const INITIAL_CHANNELS: CampaignChannel[] = [
  {
    id: 'channel-push',
    title: '푸시 캠페인',
    description: 'FCM 푸시로 전체 또는 세그먼트 대상 알림 발송',
    audience: '세그먼트',
    enabled: true,
  },
  {
    id: 'channel-broadcast',
    title: '앱 내 브로드캐스트',
    description: '홈/탐색 상단 배너를 통한 공지',
    audience: '전체',
    enabled: true,
  },
  {
    id: 'channel-sms',
    title: 'SMS 캠페인',
    description: '긴급 공지 및 OTP 재전송용 단문 메시지',
    audience: '휴면/위험',
    enabled: false,
  },
]

const FALLBACK_ANNOUNCEMENTS: Announcement[] = normalizeAnnouncements([
  {
    id: 'ann-101',
    title: '새로운 안전 정책 안내',
    audience: '전체',
    status: 'PUBLISHED',
    isActive: true,
    link: 'https://tokfriends.app/guide/policy',
    body: '커뮤니티 안전 정책이 업데이트되었습니다. 즉시 확인해주세요.',
  },
  {
    id: 'ann-102',
    title: '주말 한정 매칭 부스트',
    audience: '홈 배너',
    status: 'SCHEDULED',
    isActive: false,
    scheduledAt: '2024-03-16T10:00:00+09:00',
    body: '서울/경기 지역 사용자에게 매칭 부스트를 적용합니다.',
  },
])

const INITIAL_TICKETS: EngagementTicket[] = [
  { id: 'ENG-5001', user: '010-3210-1101', category: '문의', status: '대기', createdAt: '2024-03-13 21:44' },
  { id: 'ENG-5002', user: '010-4477-4404', category: 'FAQ', status: '진행', createdAt: '2024-03-14 09:12' },
  { id: 'ENG-5003', user: '010-5624-2202', category: '버그 신고', status: '완료', createdAt: '2024-03-14 08:22' },
]

export default function ContentPage() {
  const { toast } = useToast()
  
  const [channels, setChannels] = useState(INITIAL_CHANNELS)
  const [announcements, setAnnouncements] = useState<Announcement[]>(FALLBACK_ANNOUNCEMENTS)
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(
    FALLBACK_ANNOUNCEMENTS[0]?.id ?? null
  )
  const [tickets, setTickets] = useState(INITIAL_TICKETS)
  const [campaignDraft, setCampaignDraft] = useState<CampaignDraft>({
    name: '',
    target: '전체',
    schedule: '',
    message: '',
    deepLink: '',
  })
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    audience: '전체' as NonNullable<Announcement['audience']> | '홈 배너' | '마이페이지',
    body: '',
    link: '',
  })
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false)
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false)
  
  const selectedAnnouncement = useMemo(
    () => announcements.find((announcement) => announcement.id === selectedAnnouncementId) ?? null,
    [announcements, selectedAnnouncementId]
  )

    const activeAnnouncements = useMemo(
    () => announcements.filter((announcement) => announcement.isActive),
    [announcements]
  )

  const loadAnnouncements = useCallback(async () => {
    setIsLoadingAnnouncements(true)
    try {
      const [all, active] = await Promise.all([
        getAnnouncements().catch(() => []),
        getActiveAnnouncements().catch(() => []),
      ])
      const normalizedAll = normalizeAnnouncements(all)
      const normalizedActive = normalizeAnnouncements(active)

      const baseList = normalizedAll.length > 0 ? normalizedAll : FALLBACK_ANNOUNCEMENTS
      const activeSet = new Set(normalizedActive.map((item) => item.id))
      const merged = baseList.map((item) =>
        activeSet.has(item.id)
          ? { ...item, isActive: true, status: item.status ?? 'PUBLISHED' }
          : item
      )

      setAnnouncements(merged)
      setSelectedAnnouncementId((prev) => prev ?? (merged[0]?.id ?? null))
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message
      toast({
        title: '공지 불러오기 실패',
        description:
          message !== undefined
            ? Array.isArray(message)
              ? message.join(', ')
              : String(message)
            : '공지 데이터를 불러오지 못했습니다. 기본 템플릿을 표시합니다.',
        variant: 'destructive',
      })
      setAnnouncements(FALLBACK_ANNOUNCEMENTS)
      setSelectedAnnouncementId((prev) => prev ?? (FALLBACK_ANNOUNCEMENTS[0]?.id ?? null))
    } finally {
      setIsLoadingAnnouncements(false)
    }
  }, [toast])

  useEffect(() => {
    void loadAnnouncements()
  }, [loadAnnouncements])

  const toggleChannel = (id: string) => {
    setChannels((prev) => prev.map((channel) => (channel.id === id ? { ...channel, enabled: !channel.enabled } : channel)))
  }

  const submitCampaign = () => {
    if (!campaignDraft.name.trim() || !campaignDraft.message.trim()) {
      toast({ title: '입력 오류', description: '캠페인 이름과 메시지를 입력해주세요.', variant: 'destructive' })
      return
    }
    toast({
      title: '캠페인 예약',
      description: `${campaignDraft.target} 대상 캠페인이 예약되었습니다. (${campaignDraft.schedule || '즉시 발송'})`,
    })
    setCampaignDraft({ name: '', target: '전체', schedule: '', message: '', deepLink: '' })
  }

  const addAnnouncement = async () => {
    if (!newAnnouncement.title.trim()) {
      toast({ title: '입력 오류', description: '공지 제목을 입력해주세요.', variant: 'destructive' })
      return
    }

    const payload: AnnouncementWritePayload = {
      title: newAnnouncement.title.trim(),
      body: newAnnouncement.body.trim() || '',
      content: newAnnouncement.body.trim() || '',
      audience: newAnnouncement.audience,
      link: newAnnouncement.link.trim() ? newAnnouncement.link.trim() : null,
      isActive: false,
      status: 'DRAFT',
    }
  
    setIsSavingAnnouncement(true)
    try {
      const created = await createAnnouncement(payload)
      const normalized = normalizeAnnouncement({ ...payload, ...created })
      setAnnouncements((prev) => [normalized, ...prev.filter((item) => item.id !== normalized.id)])
      setSelectedAnnouncementId(normalized.id)
      setNewAnnouncement({ title: '', audience: '전체', body: '', link: '' })
      toast({ title: '공지 초안 생성', description: `${normalized.title} 공지가 생성되었습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '공지 생성에 실패했습니다.'
      toast({
        title: '공지 생성 실패',
        description: Array.isArray(message) ? message.join(', ') : String(message),
        variant: 'destructive',
      })
    } finally {
      setIsSavingAnnouncement(false)
    }
  }

  const handleAnnouncementUpdate = async (payload: Partial<Announcement>) => {
    if (!selectedAnnouncement) return

    const id = selectedAnnouncement.id
    const patch: AnnouncementWritePayload = {}

    if (payload.title !== undefined) patch.title = payload.title
    if (payload.body !== undefined) {
      patch.body = payload.body ?? ''
      patch.content = payload.body ?? ''
    }
    if (payload.content !== undefined) patch.content = payload.content ?? ''
    if (payload.audience !== undefined) patch.audience = payload.audience ?? null
    if (payload.link !== undefined) patch.link = payload.link ?? null
    if (payload.isActive !== undefined) patch.isActive = payload.isActive
    if (payload.startsAt !== undefined || payload.scheduledAt !== undefined) {
      patch.startsAt = payload.startsAt ?? payload.scheduledAt ?? null
    }
    if (payload.endsAt !== undefined) patch.endsAt = payload.endsAt
    if (payload.status !== undefined) patch.status = payload.status ?? null

    setIsSavingAnnouncement(true)
    try {
      const updated = await patchAnnouncement(id, patch)
      const normalized = normalizeAnnouncement({ ...selectedAnnouncement, ...updated })
      setAnnouncements((prev) => prev.map((item) => (item.id === id ? normalized : item)))
      setSelectedAnnouncementId(normalized.id)
      toast({ title: '공지 저장', description: '변경 사항이 저장되었습니다.' })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '공지 업데이트에 실패했습니다.'
      toast({
        title: '공지 업데이트 실패',
        description: Array.isArray(message) ? message.join(', ') : String(message),
        variant: 'destructive',
      })
    } finally {
      setIsSavingAnnouncement(false)
    }
  }

  const updateTicketStatus = (id: string, status: EngagementTicket['status']) => {
    setTickets((prev) => prev.map((ticket) => (ticket.id === id ? { ...ticket, status } : ticket)))
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>캠페인 채널 & 토글</CardTitle>
            <p className="text-sm text-muted-foreground">
              활성화된 채널만 자동 스케줄러가 사용합니다. 비활성화하면 즉시 전파가 중단됩니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {channels.map((channel) => (
              <div key={channel.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{channel.title}</p>
                    <p className="text-xs text-muted-foreground">{channel.description}</p>
                    <p className="text-xs text-muted-foreground">대상: {channel.audience}</p>
                  </div>
                  <Switch checked={channel.enabled} onCheckedChange={() => toggleChannel(channel.id)} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>푸시/브로드캐스트 작성</CardTitle>
            <p className="text-sm text-muted-foreground">대상 세그먼트, 발송 시점, 메시지를 작성하고 예약합니다.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>캠페인 이름</Label>
                <Input value={campaignDraft.name} onChange={(event) => setCampaignDraft((prev) => ({ ...prev, name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>타겟</Label>
                <Select value={campaignDraft.target} onValueChange={(value) => setCampaignDraft((prev) => ({ ...prev, target: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="전체">전체</SelectItem>
                    <SelectItem value="재방문">재방문</SelectItem>
                    <SelectItem value="휴면">휴면</SelectItem>
                    <SelectItem value="위험 사용자">위험 사용자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>발송 시점</Label>
                <Input
                  type="datetime-local"
                  value={campaignDraft.schedule}
                  onChange={(event) => setCampaignDraft((prev) => ({ ...prev, schedule: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>딥링크</Label>
                <Input
                  placeholder="tokfriends://path"
                  value={campaignDraft.deepLink}
                  onChange={(event) => setCampaignDraft((prev) => ({ ...prev, deepLink: event.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>메시지</Label>
                <Textarea
                  rows={4}
                  value={campaignDraft.message}
                  onChange={(event) => setCampaignDraft((prev) => ({ ...prev, message: event.target.value }))}
                  placeholder="캠페인 메시지를 작성하세요."
                />
              </div>
            </div>
            <Button size="sm" onClick={submitCampaign}>
              캠페인 예약
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>공지 & 배너 관리</CardTitle>
              <p className="text-sm text-muted-foreground">
                `GET /announcements/active`, `GET /announcements?isActive=true`를 기반으로 공지를 동기화하고 생성/수정합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => void loadAnnouncements()} disabled={isLoadingAnnouncements}>
                {isLoadingAnnouncements ? '동기화 중...' : '공지 다시 불러오기'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>제목</Label>
                <Input value={newAnnouncement.title} onChange={(event) => setNewAnnouncement((prev) => ({ ...prev, title: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>대상</Label>
                <Select value={newAnnouncement.audience} onValueChange={(value: typeof newAnnouncement.audience) => setNewAnnouncement((prev) => ({ ...prev, audience: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="전체">전체</SelectItem>
                    <SelectItem value="홈 배너">홈 배너</SelectItem>
                    <SelectItem value="마이페이지">마이페이지</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>본문</Label>
                <Textarea
                  value={newAnnouncement.body}
                  onChange={(event) => setNewAnnouncement((prev) => ({ ...prev, body: event.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>링크 (선택)</Label>
                <Input value={newAnnouncement.link} onChange={(event) => setNewAnnouncement((prev) => ({ ...prev, link: event.target.value }))} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={addAnnouncement} disabled={isSavingAnnouncement}>
                {isSavingAnnouncement ? '저장 중...' : '공지 초안 추가'}
              </Button>
            </div>

            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">활성 공지</p>
              {activeAnnouncements.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs">
                  {activeAnnouncements.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{item.title}</span>
                      <span className="text-muted-foreground">{formatDateTime(item.startsAt ?? item.scheduledAt)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">활성화된 공지가 없습니다.</p>
              )}
            </div>

            <div className="max-h-[320px] overflow-y-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">제목</th>
                    <th className="px-3 py-2 font-medium">대상</th>
                    <th className="px-3 py-2 font-medium">상태</th>
                    <th className="px-3 py-2 font-medium">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((announcement) => (
                    <tr
                      key={announcement.id}
                      className={`border-t ${announcement.id === selectedAnnouncementId ? 'bg-accent/40' : ''}`}
                    >
                      <td className="px-3 py-2 font-semibold">{announcement.title}</td>
                      <td className="px-3 py-2">{announcement.audience ?? '전체'}</td>
                      <td className="px-3 py-2 text-xs">
                        {announcement.isActive
                          ? '발행'
                          : resolveAnnouncementStatus(announcement) === 'SCHEDULED'
                          ? `예약 (${formatDateTime(announcement.startsAt ?? announcement.scheduledAt)})`
                          : '초안'}
                      </td>
                      <td className="px-3 py-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedAnnouncementId(announcement.id)}>
                          편집
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {announcements.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                        등록된 공지가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedAnnouncement && (
              <div className="space-y-3 rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={resolveAnnouncementStatus(selectedAnnouncement)}
                    onValueChange={(value) => handleAnnouncementUpdate({ status: value })}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">초안</SelectItem>
                      <SelectItem value="SCHEDULED">예약</SelectItem>
                      <SelectItem value="PUBLISHED">발행</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 text-xs">
                    <Switch
                      checked={selectedAnnouncement.isActive ?? false}
                      onCheckedChange={(checked) => handleAnnouncementUpdate({ isActive: checked })}
                    />
                    <span>활성</span>
                  </div>
                  <Input
                    type="datetime-local"
                    value={selectedAnnouncement.startsAt ?? selectedAnnouncement.scheduledAt ?? ''}
                    onChange={(event) => handleAnnouncementUpdate({ startsAt: event.target.value || null })}
                  />
                  <Button size="sm" variant="outline" onClick={() => handleAnnouncementUpdate({ link: null })}>
                    링크 제거
                  </Button>
                </div>
                <Textarea
                  rows={4}
                  value={selectedAnnouncement.body ?? ''}
                  onChange={(event) => handleAnnouncementUpdate({ body: event.target.value })}
                />
                  <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">공지 ID</p>
                    <p className="font-semibold break-all">{selectedAnnouncement.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">링크</p>
                    <p className="font-semibold break-all">{selectedAnnouncement.link ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">시작</p>
                    <p className="font-semibold">{formatDateTime(selectedAnnouncement.startsAt ?? selectedAnnouncement.scheduledAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">종료</p>
                    <p className="font-semibold">{formatDateTime(selectedAnnouncement.endsAt)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>FAQ · 문의 응답 현황</CardTitle>
            <p className="text-sm text-muted-foreground">콘텐츠 큐레이션과 고객지원 티켓을 한 화면에서 추적합니다.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{ticket.createdAt}</span>
                  <span>{ticket.category}</span>
                </div>
                <p className="mt-1 font-semibold text-foreground">{ticket.user}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Select
                    value={ticket.status}
                    onValueChange={(value: EngagementTicket['status']) => updateTicketStatus(ticket.id, value)}
                  >
                    <SelectTrigger className="w-[140px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="대기">대기</SelectItem>
                      <SelectItem value="진행">진행</SelectItem>
                      <SelectItem value="완료">완료</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast({ title: '히스토리 열기', description: `${ticket.user} 문의 기록을 확인했습니다.` })}
                  >
                    히스토리 보기
                  </Button>
                </div>
              </div>
            ))}
            {tickets.length === 0 && <p className="text-muted-foreground">처리할 항목이 없습니다.</p>}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
