'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  Gift,
  Heart,
  Loader2,
  MessageSquare,
  Radio,
  RefreshCcw,
  Search,
  StopCircle,
  Users,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import {
  forceEndAdminLiveRoom,
  getAdminLiveMessages,
  getAdminLiveRooms,
  getAdminLiveSummary,
  type AdminLiveMessage,
  type AdminLiveRoom,
  type AdminLiveSummary,
} from '@/lib/api'
import type { AxiosError } from 'axios'

export default function LivePage() {
  const { toast } = useToast()

  // Summary
  const [summary, setSummary] = useState<AdminLiveSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)

  // Rooms
  const [rooms, setRooms] = useState<AdminLiveRoom[]>([])
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRooms, setTotalRooms] = useState(0)

  // Selected Room for Messages
  const [selectedRoom, setSelectedRoom] = useState<AdminLiveRoom | null>(null)
  const [messages, setMessages] = useState<AdminLiveMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  // Force End Modal
  const [forceEndTarget, setForceEndTarget] = useState<AdminLiveRoom | null>(null)
  const [forceEndReason, setForceEndReason] = useState('')
  const [forceEnding, setForceEnding] = useState(false)

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true)
    try {
      const data = await getAdminLiveSummary()
      setSummary(data)
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '라이브 요약 로드 실패',
        description: (ax?.response?.data as any)?.message || '지표를 불러오지 못했습니다.',
        variant: 'destructive',
      })
    } finally {
      setSummaryLoading(false)
    }
  }, [toast])

  const loadRooms = useCallback(
    async (p: number, st: string) => {
      setRoomsLoading(true)
      try {
        const res = await getAdminLiveRooms({
          page: p,
          limit: 15,
          status: st === 'all' ? undefined : st,
        })
        setRooms(res.items)
        setTotalRooms(res.total)
        setTotalPages(res.totalPages)
      } catch (error) {
        const ax = error as AxiosError | undefined
        toast({
          title: '라이브 목록 로드 실패',
          description: (ax?.response?.data as any)?.message || '목록을 불러오지 못했습니다.',
          variant: 'destructive',
        })
      } finally {
        setRoomsLoading(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    void loadSummary()
    void loadRooms(page, statusFilter)
  }, [loadSummary, loadRooms, page, statusFilter])

  const handleOpenMessages = async (room: AdminLiveRoom) => {
    setSelectedRoom(room)
    setMessagesLoading(true)
    try {
      const msgs = await getAdminLiveMessages(room.id, 50)
      setMessages(msgs)
    } catch {
      toast({ title: '메시지 로드 실패', description: '채팅 내역을 불러오지 못했습니다.', variant: 'destructive' })
      setMessages([])
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleForceEndConfirm = async () => {
    if (!forceEndTarget) return
    setForceEnding(true)
    try {
      const updated = await forceEndAdminLiveRoom(forceEndTarget.id, forceEndReason.trim() || undefined)
      setRooms((prev) => prev.map((r) => (r.id === forceEndTarget.id ? updated : r)))
      toast({ title: '방송 강제 종료 완료', description: `방 "${forceEndTarget.title}" 방송이 종료되었습니다.` })
      setForceEndTarget(null)
      setForceEndReason('')
      void loadSummary()
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '강제 종료 실패',
        description: (ax?.response?.data as any)?.message || '종료 처리에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setForceEnding(false)
    }
  }

  const filteredRooms = rooms.filter((r) => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      r.id.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.host.name.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Radio className="h-6 w-6 text-rose-500" />
            라이브 방송 관리 및 모니터링
          </h1>
          <p className="text-sm text-muted-foreground">
            실시간 스트리밍 모니터링, 비정상 방송 강제 종료, 선물 및 채팅 내역을 관리합니다.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            void loadSummary()
            void loadRooms(page, statusFilter)
          }}
          disabled={summaryLoading || roomsLoading}
        >
          {summaryLoading || roomsLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 h-4 w-4" />
          )}
          새로고침
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-rose-200/50">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  진행 중인 라이브
                </p>
                <p className="text-2xl font-bold mt-1 text-rose-600">
                  {summaryLoading ? '—' : `${summary?.activeLiveRooms.toLocaleString()}개`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  누적 {summary?.totalRooms.toLocaleString() ?? 0}개 방송
                </p>
              </div>
              <Video className="h-8 w-8 text-rose-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">현재 실시간 시청자 수</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">
                  {summaryLoading ? '—' : `${summary?.currentViewers.toLocaleString()}명`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">라이브 룸 동시 접속</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">누적 선물 포인트</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">
                  {summaryLoading ? '—' : `${summary?.totalGiftPoints.toLocaleString()}P`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">시청자 후원 총액</p>
              </div>
              <Gift className="h-8 w-8 text-amber-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">누적 라이브 하트 수</p>
                <p className="text-2xl font-bold mt-1 text-pink-600">
                  {summaryLoading ? '—' : `${summary?.totalLikes.toLocaleString()}개`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">시청자 반응 총합</p>
              </div>
              <Heart className="h-8 w-8 text-pink-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Rooms Card */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
          <div>
            <CardTitle className="text-lg">라이브 룸 목록</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              전체 및 실시간 방송 현황을 조회하고 부적절한 방송을 즉각 제재합니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="방송 제목, 호스트, 카테고리..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 방송</SelectItem>
                <SelectItem value="live">라이브 중</SelectItem>
                <SelectItem value="ended">종료됨</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => void loadRooms(page, statusFilter)}
              disabled={roomsLoading}
            >
              {roomsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {roomsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRooms.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">조회된 라이브 룸이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {filteredRooms.map((room) => {
                const isLive = room.status === 'live'

                return (
                  <div
                    key={room.id}
                    className="rounded-lg border p-4 transition-colors hover:bg-muted/40 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {isLive ? (
                          <span className="flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-700 px-2.5 py-0.5 text-xs font-bold">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                            LIVE
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-xs font-semibold">
                            종료됨
                          </span>
                        )}
                        <span className="font-bold text-base">{room.title}</span>
                        <span className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground uppercase">
                          {room.category}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        시작: {new Date(room.startedAt).toLocaleString('ko-KR')}
                        {room.endedAt && (
                          <span className="ml-2">
                            | 종료: {new Date(room.endedAt).toLocaleString('ko-KR')}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Stats & Host Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground pt-1 border-t">
                      <div>
                        <span className="font-medium text-foreground">호스트: </span>
                        {room.host.name} ({room.host.region})
                      </div>
                      <div>
                        <span className="font-medium text-foreground">시청자: </span>
                        <span className={isLive ? 'font-bold text-rose-600' : ''}>
                          {room.viewerCount.toLocaleString()}명
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-foreground">선물 포인트: </span>
                        <span className="font-bold text-amber-600">{room.totalGiftsPoints.toLocaleString()}P</span>
                      </div>
                      <div>
                        <span className="font-medium text-foreground">좋아요: </span>
                        <span className="font-bold text-pink-600">{room.totalLikes.toLocaleString()}개</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => void handleOpenMessages(room)}
                      >
                        <MessageSquare className="h-3.5 w-3.5 mr-1" />
                        채팅 로그 보기
                      </Button>
                      {isLive && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 text-xs"
                          onClick={() => {
                            setForceEndTarget(room)
                            setForceEndReason('')
                          }}
                        >
                          <StopCircle className="h-3.5 w-3.5 mr-1" />
                          방송 강제 종료
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-muted-foreground">
                총 {totalRooms.toLocaleString()}개 방송 중 {rooms.length}개 표시
              </p>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={page <= 1 || roomsLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  이전
                </Button>
                <span className="px-2 text-xs flex items-center">
                  {page} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={page >= totalPages || roomsLoading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Messages Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-bold flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  라이브 채팅 로그
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  방: {selectedRoom.title} (호스트: {selectedRoom.host.name})
                </p>
              </div>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSelectedRoom(null)}>
                ✕
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {messagesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">기록된 메시지가 없습니다.</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="rounded border p-2 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {m.sender.name}
                        {m.type === 'gift' && (
                          <span className="ml-1.5 text-amber-600 font-bold">
                            🎁 선물 {m.giftPoints}P
                          </span>
                        )}
                        {m.type === 'like' && (
                          <span className="ml-1.5 text-pink-600 font-bold">
                            ❤️ 좋아요
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(m.createdAt).toLocaleTimeString('ko-KR')}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{m.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button size="sm" variant="outline" onClick={() => setSelectedRoom(null)}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Force End Confirmation Modal */}
      {forceEndTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              라이브 방송 강제 종료 확인
            </h2>
            <p className="text-sm text-muted-foreground">
              방 <strong>&quot;{forceEndTarget.title}&quot;</strong> (호스트: {forceEndTarget.host.name}) 방송을 즉시 종료합니다.
              시청자 접속이 끊어지고 방 상태가 &apos;ended&apos;로 전환됩니다.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">종료 사유 (관리자 감사 로그에 기록됨)</label>
              <Input
                placeholder="예: 운영정책 위반, 부적절한 콘텐츠 방송"
                value={forceEndReason}
                onChange={(e) => setForceEndReason(e.target.value)}
                className="text-xs h-8"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                disabled={forceEnding}
                onClick={() => setForceEndTarget(null)}
              >
                취소
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={forceEnding}
                onClick={() => void handleForceEndConfirm()}
              >
                {forceEnding ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <StopCircle className="mr-1 h-3.5 w-3.5" />}
                강제 종료 실행
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
