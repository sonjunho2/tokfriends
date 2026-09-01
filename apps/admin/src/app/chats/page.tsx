'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCcw } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  getChatSafetySnapshot,
  resolveChatReport,
  saveChatSafetyMemo,
  updateChatPolicyRule,
  updateChatRoom,
  type ChatPolicyRule,
  type ChatRoomSummary,
  type ChatSafetyReport,
} from '@/lib/api'
import type { AxiosError } from 'axios'

const FALLBACK_SNAPSHOT = {
  rooms: [
    {
      id: 'ROOM001',
      title: '서울 20대 친목방',
      category: '친목',
      region: '서울 강남구',
      distanceKm: 2,
      unread: 4,
      newMessages: 12,
      participants: 58,
      status: 'ACTIVE',
      isFallback: false,
      createdAt: '2024-03-10 14:22',
      lastMessageAt: '2024-03-14 11:12',
    },
    {
      id: 'ROOM002',
      title: '부산 맛집 공유',
      category: '취향',
      region: '부산 해운대구',
      distanceKm: 5,
      unread: 0,
      newMessages: 3,
      participants: 34,
      status: 'ACTIVE',
      isFallback: true,
      createdAt: '2024-03-11 09:10',
      lastMessageAt: '2024-03-13 22:45',
    },
    {
      id: 'ROOM003',
      title: '경기 북부 하이킹',
      category: '액티비티',
      region: '경기 의정부',
      distanceKm: 18,
      unread: 9,
      newMessages: 21,
      participants: 42,
      status: 'NEEDS_REVIEW',
      isFallback: false,
      createdAt: '2024-03-08 19:34',
      lastMessageAt: '2024-03-14 07:02',
    },
    {
      id: 'ROOM004',
      title: '전북 여행 정보',
      category: '지역',
      region: '전북 전주',
      distanceKm: 62,
      unread: 2,
      newMessages: 4,
      participants: 25,
      status: 'ARCHIVED',
      isFallback: false,
      createdAt: '2024-02-28 08:44',
      lastMessageAt: '2024-03-02 12:18',
    },
  ] satisfies ChatRoomSummary[],
  reports: [
    {
      id: 'REP-1001',
      roomId: 'ROOM003',
      reporter: '010-3210-1101',
      reason: '부적절한 언어 사용',
      status: 'PENDING',
      createdAt: '2024-03-14 08:12',
    },
    {
      id: 'REP-1002',
      roomId: 'ROOM002',
      reporter: '010-5624-2202',
      reason: '홍보성 메시지',
      status: 'IN_PROGRESS',
      createdAt: '2024-03-13 15:48',
    },
  ] satisfies ChatSafetyReport[],
  policyRules: [
    {
      id: 'rule-keyword',
      name: '금칙어 자동 경고',
      description: 'AI 금칙어 3회 이상 감지 시 24시간 채팅 제한',
      enabled: true,
      autoAction: '제한 + 감사 로그 기록',
    },
    {
      id: 'rule-repeat-report',
      name: '반복 신고 자동 제재',
      description: '7일 이내 동일 사용자 신고 5건 발생 시 즉시 계정 정지',
      enabled: true,
      autoAction: '정지 + 슬랙 #safety-alert 전송',
    },
    {
      id: 'rule-media-scan',
      name: '첨부 미디어 스캔',
      description: '이미지·영상 업로드 시 Vision API로 유해성 감지',
      enabled: false,
      autoAction: '감지 시 모더레이터 알림',
    },
  ] satisfies ChatPolicyRule[],
  memo: '',
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '운영 중',
  ARCHIVED: '종료',
  NEEDS_REVIEW: '검토 필요',
}

const SEGMENT_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'UNREAD', label: '읽지 않음' },
  { value: 'NEW', label: '신규' },
  { value: 'FAVORITE', label: '즐겨찾기' },
] as const

type SegmentFilter = (typeof SEGMENT_OPTIONS)[number]['value']

export default function ChatsPage() {
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [rooms, setRooms] = useState<ChatRoomSummary[]>(FALLBACK_SNAPSHOT.rooms)
  const [reports, setReports] = useState<ChatSafetyReport[]>(FALLBACK_SNAPSHOT.reports)
  const [policyRules, setPolicyRules] = useState<ChatPolicyRule[]>(FALLBACK_SNAPSHOT.policyRules)
  const [segment, setSegment] = useState<SegmentFilter>('ALL')
  const [keyword, setKeyword] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState<string>(FALLBACK_SNAPSHOT.rooms[0]?.id ?? '')
  const [cannedMessage, setCannedMessage] = useState('')
  const [allowEntry, setAllowEntry] = useState(true)
  const [safetyMemo, setSafetyMemo] = useState(FALLBACK_SNAPSHOT.memo)
  const [initialMemo, setInitialMemo] = useState(FALLBACK_SNAPSHOT.memo)

  const [updatingRoomId, setUpdatingRoomId] = useState<string | null>(null)
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null)
  const [updatingRuleId, setUpdatingRuleId] = useState<string | null>(null)
  const [savingMemo, setSavingMemo] = useState(false)
  
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchKeyword =
        keyword.trim().length === 0 ||
        room.title?.includes(keyword) ||
        room.region?.includes(keyword) ||
        room.category?.includes(keyword)

      let matchSegment = true
      if (segment === 'UNREAD') matchSegment = (room.unread ?? 0) > 0
      if (segment === 'NEW') matchSegment = (room.newMessages ?? 0) > 0
      if (segment === 'FAVORITE') matchSegment = (room.participants ?? 0) > 40

      return matchKeyword && matchSegment
    })
  }, [rooms, keyword, segment])

  const selectedRoom = useMemo(() => {
    const found = filteredRooms.find((room) => room.id === selectedRoomId)
    return found ?? filteredRooms[0] ?? null
  }, [filteredRooms, selectedRoomId])

  useEffect(() => {
    if (selectedRoom) {
      setAllowEntry(Boolean((selectedRoom as Record<string, unknown>).allowEntry ?? true))
    }
  }, [selectedRoom])

  useEffect(() => {
    void loadSnapshot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadSnapshot() {
    setIsLoading(true)
    try {
      const snapshot = await getChatSafetySnapshot()
      setRooms(snapshot.rooms.length > 0 ? snapshot.rooms : FALLBACK_SNAPSHOT.rooms)
      setReports(snapshot.reports.length > 0 ? snapshot.reports : FALLBACK_SNAPSHOT.reports)
      setPolicyRules(snapshot.policyRules.length > 0 ? snapshot.policyRules : FALLBACK_SNAPSHOT.policyRules)
      setSafetyMemo(snapshot.memo ?? '')
      setInitialMemo(snapshot.memo ?? '')
      if (snapshot.rooms.length > 0) {
        setSelectedRoomId(snapshot.rooms[0].id)
      }
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message =
        (ax?.response?.data as any)?.message ||
        ax?.message ||
        '채팅 운영 정보를 불러오지 못했습니다. 기본 예시 데이터를 보여드립니다.'
      toast({
        title: '채팅 패널 불러오기 실패',
        description: Array.isArray(message) ? message.join(', ') : String(message),
        variant: 'destructive',
      })
      setRooms(FALLBACK_SNAPSHOT.rooms)
      setReports(FALLBACK_SNAPSHOT.reports)
      setPolicyRules(FALLBACK_SNAPSHOT.policyRules)
      setSafetyMemo(FALLBACK_SNAPSHOT.memo)
      setInitialMemo(FALLBACK_SNAPSHOT.memo)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFallback = async (room: ChatRoomSummary) => {
    setUpdatingRoomId(room.id)
    try {
      const updated = await updateChatRoom(room.id, { isFallback: !room.isFallback })
      setRooms((prev) => prev.map((item) => (item.id === room.id ? { ...item, ...updated } : item)))
      toast({ title: '폴백 설정 변경', description: `${room.title ?? '대화방'}의 백업 모드가 업데이트되었습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '폴백 상태를 변경하지 못했습니다.'
      toast({ title: '폴백 설정 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setUpdatingRoomId(null)
    }
  }

  const updateStatus = async (status: NonNullable<ChatRoomSummary['status']>) => {
    if (!selectedRoom) return
    setUpdatingRoomId(selectedRoom.id)
    try {
      const updated = await updateChatRoom(selectedRoom.id, { status })
      setRooms((prev) => prev.map((room) => (room.id === selectedRoom.id ? { ...room, ...updated } : room)))
      toast({ title: '대화방 상태 변경', description: `${selectedRoom.title ?? '대화방'} 상태가 업데이트되었습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '대화방 상태를 저장하지 못했습니다.'
      toast({ title: '상태 변경 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setUpdatingRoomId(null)
    }
  }

  const sendAnnouncement = async () => {
    if (!selectedRoom) return
    if (!cannedMessage.trim()) {
      toast({ title: '메시지 필요', description: '발송할 안내 문구를 입력해주세요.', variant: 'destructive' })
      return
    }
    setUpdatingRoomId(selectedRoom.id)
    try {
      const updated = await updateChatRoom(selectedRoom.id, { cannedMessage: cannedMessage.trim() })
      setRooms((prev) => prev.map((room) => (room.id === selectedRoom.id ? { ...room, ...updated } : room)))
      setCannedMessage('')
      toast({ title: '안전 공지 발송', description: `${selectedRoom.title ?? '대화방'}에 안내 메시지를 전송했습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '안내 메시지를 전송하지 못했습니다.'
      toast({ title: '공지 발송 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setUpdatingRoomId(null)
    }
  }

  const handleAllowEntryChange = async (value: boolean) => {
    if (!selectedRoom) return
    setAllowEntry(value)
    setUpdatingRoomId(selectedRoom.id)
    try {
      const updated = await updateChatRoom(selectedRoom.id, { allowEntry: value })
      setRooms((prev) => prev.map((room) => (room.id === selectedRoom.id ? { ...room, ...updated } : room)))
      toast({
        title: '입장 설정 변경',
        description: `${selectedRoom.title ?? '대화방'} 입장 제한이 ${value ? '해제' : '적용'}되었습니다.`,
      })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '입장 설정을 변경하지 못했습니다.'
      toast({ title: '입장 설정 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
      setAllowEntry(!value)
    } finally {
      setUpdatingRoomId(null)
    }
  }

  const escalateReport = async (report: ChatSafetyReport) => {
    setUpdatingReportId(report.id)
    try {
      const updated = await resolveChatReport(report.id, { action: 'ESCALATE' })
      setReports((prev) => prev.map((item) => (item.id === report.id ? { ...item, ...updated } : item)))
      toast({ title: '신고 이관 완료', description: `${report.id}번 신고를 안전 감사 큐로 전달했습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '신고를 이관하지 못했습니다.'
      toast({ title: '신고 이관 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setUpdatingReportId(null)
    }
  }

  const togglePolicyRule = async (rule: ChatPolicyRule) => {
    setUpdatingRuleId(rule.id)
    try {
      const updated = await updateChatPolicyRule(rule.id, { enabled: !rule.enabled })
      setPolicyRules((prev) => prev.map((item) => (item.id === rule.id ? { ...item, ...updated } : item)))
      toast({ title: '정책 활성화 변경', description: `${rule.name ?? '정책'} 상태를 업데이트했습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '정책 상태를 변경하지 못했습니다.'
      toast({ title: '정책 업데이트 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setUpdatingRuleId(null)
    }
  }

  const runPolicySync = async () => {
    setIsLoading(true)
    try {
      await Promise.all(policyRules.map((rule) => updateChatPolicyRule(rule.id, { enabled: rule.enabled })))
      toast({ title: '정책 동기화 완료', description: '자동 제재 규칙 구성이 백엔드와 동기화되었습니다.' })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '정책 구성을 동기화하지 못했습니다.'
      toast({ title: '동기화 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSafetyMemoBlur() {
    if (safetyMemo.trim() === initialMemo.trim()) return
    setSavingMemo(true)
    try {
      const saved = await saveChatSafetyMemo({ memo: safetyMemo })
      setInitialMemo(saved ?? '')
      toast({ title: '안전 메모 저장', description: '팀과 공유할 메모를 저장했습니다.' })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '메모를 저장하지 못했습니다.'
      toast({ title: '메모 저장 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingMemo(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[3fr_4fr]">
      <section className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>실시간 채팅 세그먼트</CardTitle>
              <p className="text-sm text-muted-foreground">
                읽지 않은 메시지와 신규 대화를 한눈에 보고, 누구나 즉시 대응할 수 있도록 정렬된 목록입니다.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => void loadSnapshot()} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              새로고침
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <Input placeholder="방 제목·카테고리·지역 검색" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
              <Select value={segment} onValueChange={(value: SegmentFilter) => setSegment(value)}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="세그먼트" />
                </SelectTrigger>
                <SelectContent>
                  {SEGMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="max-h-[440px] overflow-y-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">방 정보</th>
                    <th className="px-4 py-2 font-medium">미확인</th>
                    <th className="px-4 py-2 font-medium">지역/거리</th>
                    <th className="px-4 py-2 font-medium">상태</th>
                    <th className="px-4 py-2 font-medium">폴백</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.map((room) => {
                    const isActive = selectedRoom?.id === room.id
                    return (
                      <tr
                        key={room.id}
                        className={`cursor-pointer border-t transition hover:bg-accent/40 ${isActive ? 'bg-accent/60' : ''}`}
                        onClick={() => setSelectedRoomId(room.id)}
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col">
                            <span className="font-semibold">{room.title ?? '제목 없음'}</span>
                            <span className="text-xs text-muted-foreground">
                              {room.category ?? '카테고리 없음'} · 참여 {room.participants ?? 0}명 · 생성 {room.createdAt ?? '-'}
                            </span>
                            <span className="text-xs text-muted-foreground">마지막 메시지 {room.lastMessageAt ?? '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-1 text-xs">
                            <span>읽지 않음 {room.unread ?? 0}건</span>
                            <span>신규 메시지 {room.newMessages ?? 0}건</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-xs">
                          <div>{room.region ?? '-'}</div>
                          <div className="text-muted-foreground">약 {room.distanceKm ?? 0}km</div>
                        </td>
                        <td className="px-4 py-3 align-top text-xs">
                          <span className="rounded-full bg-primary/10 px-2 py-1 font-semibold text-primary">
                            {STATUS_LABEL[room.status ?? 'ACTIVE'] ?? room.status ?? '미지정'}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-xs">
                          {room.isFallback ? (
                            <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700">폴백</span>
                          ) : (
                            <span className="text-muted-foreground">API 성공</span>
                          )}
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void toggleFallback(room)}
                              disabled={updatingRoomId === room.id}
                            >
                              {updatingRoomId === room.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {room.isFallback ? '폴백 해제' : '폴백 전환'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredRooms.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>
                        조건에 맞는 대화방이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>신고 큐 & 안전 대응</CardTitle>
            <p className="text-sm text-muted-foreground">
              접수된 신고를 확인하고, 필요한 경우 안전 감사팀으로 즉시 이관할 수 있습니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">#{report.id}</span>
                  <span className="text-xs text-muted-foreground">{report.createdAt ?? '-'}</span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {report.reason ?? '사유 미기재'} · 신고자 {report.reporter ?? '알 수 없음'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">방 {report.roomId}</span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    {report.status === 'PENDING' ? '미처리' : report.status === 'IN_PROGRESS' ? '처리 중' : '완료'}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void escalateReport(report)}
                    disabled={updatingReportId === report.id}
                  >
                    {updatingReportId === report.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    조치 기록 열기
                  </Button>
                </div>
              </div>
            ))}
            {reports.length === 0 && <p className="text-sm text-muted-foreground">신고 내역이 없습니다.</p>}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>채팅 & 안전 제어 패널</CardTitle>
            <p className="text-sm text-muted-foreground">
              상담사 입장 여부, 방 정보 수정, 안전 공지 발송 등 운영자가 자주 사용하는 기능을 모았습니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {selectedRoom ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>방 제목</Label>
                    <Input
                      className="mt-1"
                      value={selectedRoom.title ?? ''}
                      onChange={(event) =>
                        setRooms((prev) =>
                          prev.map((room) =>
                            room.id === selectedRoom.id ? { ...room, title: event.target.value } : room
                          )
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>카테고리</Label>
                    <Input
                      className="mt-1"
                      value={selectedRoom.category ?? ''}
                      onChange={(event) =>
                        setRooms((prev) =>
                          prev.map((room) =>
                            room.id === selectedRoom.id ? { ...room, category: event.target.value } : room
                          )
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>지역</Label>
                    <Input
                      className="mt-1"
                      value={selectedRoom.region ?? ''}
                      onChange={(event) =>
                        setRooms((prev) =>
                          prev.map((room) =>
                            room.id === selectedRoom.id ? { ...room, region: event.target.value } : room
                          )
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>진입 허용</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <Switch
                        checked={allowEntry}
                        disabled={updatingRoomId === selectedRoom.id}
                        onCheckedChange={(value) => void handleAllowEntryChange(value)}
                      />
                      <span className="text-xs text-muted-foreground">
                        새로운 사용자가 방에 참여할 수 있도록 허용하거나 일시 차단합니다.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>안전 공지 / 상담사 안내</Label>
                  <Textarea
                    value={cannedMessage}
                    onChange={(event) => setCannedMessage(event.target.value)}
                    rows={3}
                    placeholder="예: 신고 다수 발생, 대화 예절 공지 발송"
                  />
                  <Button size="sm" onClick={() => void sendAnnouncement()} disabled={updatingRoomId === selectedRoom.id}>
                    {updatingRoomId === selectedRoom.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    안내 발송
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>대화방 상태</Label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { key: 'ACTIVE', label: '운영 중' },
                        { key: 'NEEDS_REVIEW', label: '검토 필요' },
                        { key: 'ARCHIVED', label: '종료' },
                      ] as const
                    ).map((option) => (
                      <Button
                        key={option.key}
                        size="sm"
                        variant={selectedRoom.status === option.key ? 'default' : 'outline'}
                        onClick={() => void updateStatus(option.key)}
                        disabled={updatingRoomId === selectedRoom.id}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">먼저 왼쪽 목록에서 대화방을 선택해주세요.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>자동 정책 & 감사 메모</CardTitle>
            <p className="text-sm text-muted-foreground">
              자동 제재 룰을 손쉽게 켜고 끄며, 동기화 버튼으로 백엔드 정책 엔진과 맞춰주세요. 추가로 남길 메모도 함께 관리합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-3">
              {policyRules.map((rule) => (
                <div key={rule.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{rule.name ?? '이름 없는 룰'}</p>
                      <p className="text-xs text-muted-foreground">{rule.description ?? '설명 없음'}</p>
                      <p className="text-xs text-muted-foreground">자동 조치: {rule.autoAction ?? '-'}</p>
                    </div>
                    <Switch
                      checked={Boolean(rule.enabled)}
                      disabled={updatingRuleId === rule.id}
                      onCheckedChange={() => void togglePolicyRule(rule)}
                    />
                  </div>
                </div>
              ))}
              {policyRules.length === 0 && <p className="text-muted-foreground">등록된 정책이 없습니다.</p>}
            </div>
            <Button size="sm" variant="outline" onClick={() => void runPolicySync()} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              정책 동기화
            </Button>

            <div className="space-y-2">
              <Label>안전 운영 메모</Label>
              <Textarea
                value={safetyMemo}
                onChange={(event) => setSafetyMemo(event.target.value)}
                onBlur={() => void handleSafetyMemoBlur()}
                rows={4}
                placeholder="예: 2024-03-14 신고 급증, 19시 이후 전담자 배정 등"
              />
              {savingMemo && <p className="text-xs text-muted-foreground">메모를 저장하는 중입니다…</p>}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
