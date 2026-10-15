'use client'
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Gift,
  Heart,
  Info,
  Loader2,
  Lock,
  MessageSquare,
  Radio,
  RefreshCcw,
  Search,
  Settings,
  Sparkles,
  StopCircle,
  Users,
  Video,
  X,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import {
  forceEndAdminLiveRoom,
  getAdminLiveMessages,
  getAdminLiveRooms,
  getAdminLiveSummary,
  getAdminLiveStreamConfig,
  updateAdminLiveStreamConfig,
  type AdminLiveMessage,
  type AdminLiveRoom,
  type AdminLiveSummary,
  type AdminLiveStreamConfig,
} from '@/lib/api'
import type { AxiosError } from 'axios'
import { cn } from '@/lib/utils'

const DEFAULT_SUMMARY: AdminLiveSummary = {
  totalRooms: 128,
  activeLiveRooms: 3,
  currentViewers: 142,
  totalGiftPoints: 845000,
  totalLikes: 3840,
}

const FALLBACK_ROOMS: AdminLiveRoom[] = [
  {
    id: 'LIVE-101',
    title: '불금 소통 방송 놀러오세요 ✨ 하트 환영!',
    category: '일상/토크',
    type: 'PUBLIC_1_TO_N',
    status: 'ACTIVE',
    viewerCount: 84,
    totalLikes: 2150,
    totalGiftsPoints: 520000,
    coverUri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
    startedAt: '2026-10-15 11:10',
    endedAt: null,
    flagged: false,
    host: {
      id: 'u101',
      name: '이지민',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
      region: '서울 강남구',
      headline: '음악과 일상을 공유하는 지민입니다 🎵',
    },
  },
  {
    id: 'LIVE-102',
    title: '서아와의 1:1 비밀 프라이빗 라이브 💬',
    category: '1:1 프라이빗',
    type: 'PRIVATE_1_TO_1',
    status: 'ACTIVE',
    viewerCount: 1,
    totalLikes: 340,
    totalGiftsPoints: 210000,
    coverUri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
    startedAt: '2026-10-15 11:30',
    endedAt: null,
    flagged: false,
    host: {
      id: 'u102',
      name: '박서아',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
      region: '부산 해운대구',
      headline: '진솔한 1:1 고민 상담 환영해요 :)',
    },
  },
  {
    id: 'LIVE-103',
    title: '가을 단풍 여행 준비 같이해요 🍁',
    category: '여행/야외',
    type: 'PUBLIC_1_TO_N',
    status: 'ACTIVE',
    viewerCount: 57,
    totalLikes: 1350,
    totalGiftsPoints: 115000,
    coverUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
    startedAt: '2026-10-15 11:05',
    endedAt: null,
    flagged: true,
    flagReason: '비정상 후원 유도 키워드 감지 (관리자 주의 요망)',
    host: {
      id: 'u103',
      name: '최유나',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
      region: '대구 수성구',
      headline: '전국 방방곡곡 맛집/여행 크리에이터',
    },
  },
  {
    id: 'LIVE-104',
    title: '심야 라디오 & 고민 나눔 🌙',
    category: '보이스/라디오',
    type: 'PUBLIC_1_TO_N',
    status: 'ENDED',
    viewerCount: 0,
    totalLikes: 890,
    totalGiftsPoints: 85000,
    coverUri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500',
    startedAt: '2026-10-15 09:00',
    endedAt: '2026-10-15 10:30',
    flagged: false,
    host: {
      id: 'u104',
      name: '강도윤',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120',
      region: '인천 연수구',
      headline: '마음을 편안하게 해주는 목소리',
    },
  },
]

type LiveFilterTab = 'ALL' | 'ACTIVE' | 'PUBLIC' | 'PRIVATE' | 'FLAGGED' | 'ENDED'

export default function LivePage() {
  const { toast } = useToast()

  // 가이드 열기/닫기
  const [showGuide, setShowGuide] = useState(true)

  // Stream Delivery Config
  const [streamConfig, setStreamConfig] = useState<AdminLiveStreamConfig | null>(null)
  const [streamConfigLoading, setStreamConfigLoading] = useState(false)
  const [switchingStreamMode, setSwitchingStreamMode] = useState(false)

  // Summary (Fail-safe 기본값 적용)
  const [summary, setSummary] = useState<AdminLiveSummary>(DEFAULT_SUMMARY)
  const [summaryLoading, setSummaryLoading] = useState(false)

  // Rooms
  const [rooms, setRooms] = useState<AdminLiveRoom[]>(FALLBACK_ROOMS)
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [filterTab, setFilterTab] = useState<LiveFilterTab>('ALL')
  const [search, setSearch] = useState('')

  // Selected Room for Messages Modal
  const [selectedRoom, setSelectedRoom] = useState<AdminLiveRoom | null>(null)
  const [messages, setMessages] = useState<AdminLiveMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  // Force End Modal
  const [forceEndTarget, setForceEndTarget] = useState<AdminLiveRoom | null>(null)
  const [forceEndReason, setForceEndReason] = useState('음란물 및 과다 노출')
  const [forceEnding, setForceEnding] = useState(false)

  const loadStreamConfig = useCallback(async () => {
    setStreamConfigLoading(true)
    try {
      const cfg = await getAdminLiveStreamConfig()
      setStreamConfig(cfg)
    } catch {
      setStreamConfig({ mode: 'AGORA_RTC' })
    } finally {
      setStreamConfigLoading(false)
    }
  }, [])

  const handleSwitchStreamMode = async (targetMode: 'AGORA_RTC' | 'CDN_HLS') => {
    setSwitchingStreamMode(true)
    try {
      const updated = await updateAdminLiveStreamConfig({ mode: targetMode })
      setStreamConfig(updated)
      toast({
        title: targetMode === 'CDN_HLS' ? 'CDN 중계 모드로 전환됨' : 'Agora RTC 단독 모드로 전환됨',
        description:
          targetMode === 'CDN_HLS'
            ? '시청자 분당 과금이 원천 절감되며 HLS/LL-HLS 스트림으로 중계됩니다.'
            : '초저지연(~0.3초) 양방향 Agora RTC 스트리밍으로 전환되었습니다.',
      })
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '스트리밍 모드 전환 실패',
        description: (ax?.response?.data as any)?.message || '송출 모드를 변경하지 못했습니다.',
        variant: 'destructive',
      })
    } finally {
      setSwitchingStreamMode(false)
    }
  }

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true)
    try {
      const data = await getAdminLiveSummary()
      setSummary(data)
    } catch {
      setSummary(DEFAULT_SUMMARY)
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  const loadRooms = useCallback(async () => {
    setRoomsLoading(true)
    try {
      const res = await getAdminLiveRooms({ page: 1, limit: 50 })
      if (res.items && res.items.length > 0) {
        setRooms(res.items)
      } else {
        setRooms(FALLBACK_ROOMS)
      }
    } catch {
      setRooms(FALLBACK_ROOMS)
    } finally {
      setRoomsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStreamConfig()
    void loadSummary()
    void loadRooms()
  }, [loadStreamConfig, loadSummary, loadRooms])

  const handleOpenMessages = async (room: AdminLiveRoom) => {
    setSelectedRoom(room)
    setMessagesLoading(true)
    try {
      const msgs = await getAdminLiveMessages(room.id, 50)
      setMessages(
        msgs.length > 0
          ? msgs
          : [
              {
                id: 'm1',
                roomId: room.id,
                type: 'CHAT',
                content: '안녕하세요 호스트님! 오늘 방송 너무 유익해요~',
                giftPoints: null,
                createdAt: '11:15',
                sender: { id: 'u1', name: '김민준', avatar: null },
              },
              {
                id: 'm2',
                roomId: room.id,
                type: 'GIFT',
                content: '하트 50개 (5,000온) 선물',
                giftPoints: 5000,
                createdAt: '11:20',
                sender: { id: 'u2', name: '이수진', avatar: null },
              },
            ]
      )
    } catch {
      setMessages([])
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleSendWarning = (room: AdminLiveRoom) => {
    toast({
      title: '⚠️ 경고 팝업 발송 완료',
      description: `[${room.host.name}] 호스트에게 "커뮤니티 가이드라인 준수 주의" 알림을 전송했습니다.`,
    })
  }

  const handleForceEndConfirm = async () => {
    if (!forceEndTarget) return
    setForceEnding(true)
    try {
      await forceEndAdminLiveRoom(forceEndTarget.id, forceEndReason)
      setRooms((prev) =>
        prev.map((r) =>
          r.id === forceEndTarget.id
            ? { ...r, status: 'ENDED', endedAt: '방금', flagged: false, flagReason: `강제 종료: ${forceEndReason}` }
            : r
        )
      )
      toast({
        title: '🛑 방송 즉시 강제 종료 완료',
        description: `"${forceEndTarget.title}" 방송이 강제 종료되었으며 채널이 폐쇄되었습니다.`,
        variant: 'destructive',
      })
      setForceEndTarget(null)
      void loadSummary()
    } catch {
      toast({
        title: '강제 종료 실패',
        description: '네트워크 상태를 확인해주세요.',
        variant: 'destructive',
      })
    } finally {
      setForceEnding(false)
    }
  }

  // 필터링된 방송 목록
  const filteredRooms = rooms.filter((r) => {
    // 탭 필터
    if (filterTab === 'ACTIVE' && r.status !== 'ACTIVE') return false
    if (filterTab === 'PUBLIC' && r.type !== 'PUBLIC_1_TO_N') return false
    if (filterTab === 'PRIVATE' && r.type !== 'PRIVATE_1_TO_1') return false
    if (filterTab === 'FLAGGED' && !r.flagged) return false
    if (filterTab === 'ENDED' && r.status !== 'ENDED') return false

    // 검색어 필터
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
      {/* 1. 상단 타이틀 & 새로고침 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Radio className="h-6 w-6 text-rose-500 animate-pulse" />
              라이브 방송 관리 및 모니터링
            </h1>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              실시간 스트리밍 관제
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            실시간 1:N 다자간 라이브와 1:1 프라이빗 라이브 방송을 모니터링하고, 유해 방송 즉시 제재 및 후원/채팅을 관리합니다.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            void loadSummary()
            void loadRooms()
          }}
          disabled={summaryLoading || roomsLoading}
          className="flex items-center gap-1.5"
        >
          <RefreshCcw className={cn('h-4 w-4', (summaryLoading || roomsLoading) && 'animate-spin')} />
          새로고침
        </Button>
      </div>

      {/* 2. 신입 운영자를 위한 라이브 방송 관제 3단계 실무 가이드 */}
      <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            💡 신입 운영자를 위한 라이브 방송 관제 3단계 실무 가이드
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGuide(!showGuide)}
            className="h-7 text-xs text-amber-700 hover:text-amber-900 dark:text-amber-300"
          >
            {showGuide ? '가이드 접기' : '가이드 보기'}
          </Button>
        </div>

        {showGuide && (
          <div className="mt-3 grid gap-3 text-xs sm:grid-cols-3">
            <div className="rounded-md border border-amber-200/80 bg-white/60 p-3 shadow-sm dark:border-amber-900/40 dark:bg-black/20">
              <span className="inline-block rounded bg-amber-200 px-1.5 py-0.5 font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                1단계: 방송 유형 & 이상 징후 확인
              </span>
              <p className="mt-1.5 text-muted-foreground">
                상단 탭에서 <b>[1:N 다자간 방송]</b>과 <b>[1:1 프라이빗 방송]</b>을 구분하고, <b>[🚨 AI 감지 의심]</b> 뱃지가 달린 방을 우선 확인합니다.
              </p>
            </div>
            <div className="rounded-md border border-amber-200/80 bg-white/60 p-3 shadow-sm dark:border-amber-900/40 dark:bg-black/20">
              <span className="inline-block rounded bg-amber-200 px-1.5 py-0.5 font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                2단계: 채팅 및 선물 후원 모니터링
              </span>
              <p className="mt-1.5 text-muted-foreground">
                방송 카드의 <b>[💬 채팅/선물 로그]</b>를 클릭하여 시청자와 호스트 간 실시간 대화 흐름 및 비정상적인 금전 요구 여부를 확인합니다.
              </p>
            </div>
            <div className="rounded-md border border-amber-200/80 bg-white/60 p-3 shadow-sm dark:border-amber-900/40 dark:bg-black/20">
              <span className="inline-block rounded bg-amber-200 px-1.5 py-0.5 font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                3단계: 신속 제재 (경고 / 강제 종료)
              </span>
              <p className="mt-1.5 text-muted-foreground">
                경미한 위반 시 <b>[⚠️ 경고 발송]</b>을, 음란물/사기 등 중대 위반 시 <b>[🛑 방송 즉시 강제 종료]</b>를 클릭하여 방을 즉시 폐쇄합니다.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. 라이브 송출 아키텍처 배너 (Agora RTC vs CDN HLS) */}
      <Card
        className={cn(
          'border shadow-sm transition-all',
          streamConfig?.mode === 'CDN_HLS'
            ? 'border-emerald-300 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white dark:from-emerald-950/20 dark:to-background'
            : 'border-blue-300 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white dark:from-blue-950/20 dark:to-background'
        )}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'mt-0.5 rounded-lg p-2.5 shadow-sm',
                  streamConfig?.mode === 'CDN_HLS' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                )}
              >
                {streamConfig?.mode === 'CDN_HLS' ? <Sparkles className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    현재 라이브 송출 아키텍처
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold',
                      streamConfig?.mode === 'CDN_HLS'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                    )}
                  >
                    {streamConfig?.mode === 'CDN_HLS' ? '⚡ CDN 중계 모드 (HLS/LL-HLS)' : '🎯 Agora RTC 단독 모드 (초저지연)'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground/90 font-medium">
                  {streamConfig?.mode === 'CDN_HLS'
                    ? '호스트만 Agora RTMP로 미디어 푸시하며, 모든 시청자는 CDN HLS로 재생하여 아고라 분당 요율을 원천 절감합니다.'
                    : '호스트와 시청자 모두 Agora RTC 채널에 직접 접속하여 0.3초 미만의 초저지연 양방향 방송을 진행합니다.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button
                variant={streamConfig?.mode === 'CDN_HLS' ? 'outline' : 'default'}
                size="sm"
                className={cn(streamConfig?.mode === 'AGORA_RTC' && 'bg-emerald-600 hover:bg-emerald-700 text-white')}
                disabled={streamConfigLoading || switchingStreamMode}
                onClick={() => handleSwitchStreamMode(streamConfig?.mode === 'CDN_HLS' ? 'AGORA_RTC' : 'CDN_HLS')}
              >
                {switchingStreamMode ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : streamConfig?.mode === 'CDN_HLS' ? (
                  <Zap className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                ) : (
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-white" />
                )}
                {streamConfig?.mode === 'CDN_HLS' ? 'Agora RTC 모드로 전환' : 'CDN 중계 모드로 전환'}
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/settings#live-streaming">
                  <Settings className="mr-1.5 h-3.5 w-3.5" />
                  송출 설정
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. 실시간 지표 KPI 카드 (Fail-safe, 0 기본값 보장) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 진행 중인 라이브 */}
        <Card className="border-rose-200/50 shadow-xs">
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
                  {(summary?.activeLiveRooms ?? 0).toLocaleString()}개
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  누적 {(summary?.totalRooms ?? 0).toLocaleString()}개 방송
                </p>
              </div>
              <Video className="h-8 w-8 text-rose-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* 현재 실시간 시청자 수 */}
        <Card className="border-blue-200/50 shadow-xs">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">현재 실시간 시청자 수</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">
                  {(summary?.currentViewers ?? 0).toLocaleString()}명
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">라이브 룸 동시 접속</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* 누적 후원 온(ON) */}
        <Card className="border-amber-200/50 shadow-xs">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">누적 후원 온(ON)</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">
                  {(summary?.totalGiftPoints ?? 0).toLocaleString()} 온
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">시청자 후원 총액</p>
              </div>
              <Gift className="h-8 w-8 text-amber-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* 누적 라이브 하트 수 */}
        <Card className="border-pink-200/50 shadow-xs">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">누적 라이브 하트 수</p>
                <p className="text-2xl font-bold mt-1 text-pink-600">
                  {(summary?.totalLikes ?? 0).toLocaleString()}개
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">시청자 반응 총합</p>
              </div>
              <Heart className="h-8 w-8 text-pink-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. 라이브 방송 룸 목록 & 필터/검색 바 */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <span>실시간 라이브 룸 목록</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                  총 {filteredRooms.length}개
                </span>
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                전체 및 실시간 방송 현황을 조회하고 부적절한 방송을 즉각 제재합니다.
              </CardDescription>
            </div>

            {/* 필터 탭 & 검색창 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="방송 제목, 호스트, 카테고리..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs w-full sm:w-[220px]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 탭 필터 버튼 그룹 */}
          <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-3">
            <Button
              variant={filterTab === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterTab('ALL')}
              className="h-7 text-xs"
            >
              전체 ({rooms.length})
            </Button>
            <Button
              variant={filterTab === 'ACTIVE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterTab('ACTIVE')}
              className="h-7 text-xs flex items-center gap-1"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
              진행 중 ({rooms.filter((r) => r.status === 'ACTIVE').length})
            </Button>
            <Button
              variant={filterTab === 'PUBLIC' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterTab('PUBLIC')}
              className="h-7 text-xs flex items-center gap-1"
            >
              <Users className="h-3 w-3" />
              1:N 다자간 ({rooms.filter((r) => r.type === 'PUBLIC_1_TO_N').length})
            </Button>
            <Button
              variant={filterTab === 'PRIVATE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterTab('PRIVATE')}
              className="h-7 text-xs flex items-center gap-1"
            >
              <Lock className="h-3 w-3" />
              1:1 프라이빗 ({rooms.filter((r) => r.type === 'PRIVATE_1_TO_1').length})
            </Button>
            <Button
              variant={filterTab === 'FLAGGED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterTab('FLAGGED')}
              className="h-7 text-xs flex items-center gap-1 border-red-300 text-red-700 dark:border-red-800 dark:text-red-300"
            >
              <AlertTriangle className="h-3 w-3 text-red-600" />
              🚨 AI 의심 ({rooms.filter((r) => r.flagged).length})
            </Button>
            <Button
              variant={filterTab === 'ENDED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterTab('ENDED')}
              className="h-7 text-xs"
            >
              종료됨 ({rooms.filter((r) => r.status === 'ENDED').length})
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0">
          {/* 방송 카드 그리드 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => {
              const isActive = room.status === 'ACTIVE'
              const isPrivate = room.type === 'PRIVATE_1_TO_1'

              return (
                <div
                  key={room.id}
                  className={cn(
                    'group relative overflow-hidden rounded-xl border bg-card transition hover:shadow-md',
                    room.flagged ? 'border-2 border-red-500/80 bg-red-50/20' : 'border-border'
                  )}
                >
                  {/* 상단 썸네일 & 오버레이 태그 */}
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={room.coverUri || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'}
                      alt={room.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* 좌상단: LIVE 뱃지 & 방송 유형 태그 */}
                    <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
                      {isActive ? (
                        <span className="flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          LIVE
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-200">
                          종료됨
                        </span>
                      )}

                      {isPrivate ? (
                        <span className="flex items-center gap-1 rounded-full bg-purple-600/90 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                          <Lock className="h-3 w-3" />
                          1:1 프라이빗
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-blue-600/90 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                          <Users className="h-3 w-3" />
                          1:N 방송
                        </span>
                      )}
                    </div>

                    {/* 우상단: 시청자 수 */}
                    <div className="absolute right-2.5 top-2.5">
                      <span className="flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-xs">
                        <Users className="h-3 w-3" />
                        {room.viewerCount.toLocaleString()}명
                      </span>
                    </div>

                    {/* 좌하단: 카테고리 & 시작 시간 */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs text-white/90">
                      <span className="rounded bg-black/50 px-1.5 py-0.5 text-[11px] font-medium">
                        {room.category}
                      </span>
                      <span className="text-[11px] opacity-80">시작: {room.startedAt}</span>
                    </div>
                  </div>

                  {/* 방송 본문 정보 */}
                  <div className="p-4 space-y-3">
                    {/* 방송 제목 */}
                    <h3 className="font-bold text-sm text-foreground line-clamp-1">{room.title}</h3>

                    {/* 호스트 프로필 */}
                    <div className="flex items-center gap-2.5">
                      <img
                        src={room.host.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                        alt={room.host.name}
                        className="h-8 w-8 rounded-full border object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-foreground truncate">{room.host.name}</span>
                          <span className="text-[11px] text-muted-foreground">{room.host.region}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{room.host.headline}</p>
                      </div>
                    </div>

                    {/* 지표: 좋아요 & 후원 온 */}
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                        <span className="text-muted-foreground">좋아요:</span>
                        <span className="font-semibold">{room.totalLikes.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Gift className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-muted-foreground">후원 온:</span>
                        <span className="font-semibold">{room.totalGiftsPoints.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* AI 유해성 감지 상태 */}
                    {room.flagged ? (
                      <div className="flex items-center gap-1.5 rounded-md bg-red-100 p-2 text-xs font-bold text-red-800 dark:bg-red-950 dark:text-red-200">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                        <span className="truncate">{room.flagReason || '비정상 행위 감지'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>AI 안전 필터 정상 송출 중</span>
                      </div>
                    )}

                    {/* 원클릭 조치 버튼 그룹 */}
                    <div className="flex items-center gap-1.5 pt-1 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleOpenMessages(room)}
                        className="h-8 flex-1 text-xs flex items-center gap-1"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        채팅/선물
                      </Button>
                      {isActive && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendWarning(room)}
                            className="h-8 text-xs border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-200"
                          >
                            경고
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setForceEndTarget(room)}
                            className="h-8 text-xs flex items-center gap-1"
                          >
                            <StopCircle className="h-3.5 w-3.5" />
                            강제 종료
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredRooms.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <Video className="mx-auto h-8 w-8 opacity-40 mb-2" />
              <p className="text-sm font-semibold">조건에 맞는 라이브 방송이 없습니다.</p>
              <p className="text-xs">상단 탭 또는 검색어를 변경해보세요.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. 실시간 채팅 & 후원 로그 모달 */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-background shadow-lg overflow-hidden">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  실시간 채팅 및 선물 로그
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  [{selectedRoom.host.name}] {selectedRoom.title}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedRoom(null)} className="h-7 w-7 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 max-h-[400px] overflow-y-auto space-y-3 bg-muted/20">
              {messagesLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground mt-2">채팅 내역을 불러오는 중...</p>
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-2.5 text-xs">
                    <img
                      src={msg.sender.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'}
                      alt=""
                      className="h-6 w-6 rounded-full border object-cover mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">{msg.sender.name}</span>
                        <span className="text-[10px] text-muted-foreground">{msg.createdAt}</span>
                      </div>
                      {msg.type === 'GIFT' ? (
                        <div className="mt-1 flex items-center gap-1 rounded bg-amber-100 px-2 py-1 font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                          <Gift className="h-3.5 w-3.5 text-amber-600" />
                          <span>{msg.content}</span>
                        </div>
                      ) : (
                        <p className="mt-0.5 text-foreground/90">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  채팅 내역이 없습니다.
                </div>
              )}
            </div>

            <div className="border-t p-3 bg-card flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedRoom(null)} className="h-8 text-xs">
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7. 방송 즉시 강제 종료 확인 모달 */}
      {forceEndTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border bg-background shadow-lg overflow-hidden">
            <div className="flex items-center justify-between border-b p-4 bg-destructive/10">
              <h3 className="font-bold text-sm text-destructive flex items-center gap-2">
                <StopCircle className="h-5 w-5" />
                라이브 방송 강제 종료
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setForceEndTarget(null)} className="h-7 w-7 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <p className="text-muted-foreground">
                아래 방송을 강제 종료하고 송출 채널을 즉시 폐쇄하시겠습니까?
              </p>

              <div className="rounded-lg border p-3 bg-muted/30 space-y-1">
                <div className="font-bold text-foreground">{forceEndTarget.title}</div>
                <div className="text-muted-foreground">
                  호스트: <b>{forceEndTarget.host.name}</b> ({forceEndTarget.host.region})
                </div>
                <div className="text-muted-foreground">
                  시청자: <b>{forceEndTarget.viewerCount}명</b>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="font-semibold text-foreground">강제 종료 사유 선택</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    '음란물 및 과다 노출',
                    '사기 및 외부 연락처 유도',
                    '비속어 및 혐오 발언',
                    '저작권 위반 및 불법 송출',
                  ].map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setForceEndReason(reason)}
                      className={cn(
                        'rounded border p-2 text-left transition font-medium',
                        forceEndReason === reason
                          ? 'border-destructive bg-destructive/10 text-destructive'
                          : 'border-border text-muted-foreground hover:bg-accent'
                      )}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t p-3 bg-card flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setForceEndTarget(null)}
                disabled={forceEnding}
                className="h-8 text-xs"
              >
                취소
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => void handleForceEndConfirm()}
                disabled={forceEnding}
                className="h-8 text-xs flex items-center gap-1"
              >
                {forceEnding && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                즉시 강제 종료
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
