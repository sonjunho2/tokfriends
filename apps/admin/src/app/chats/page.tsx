'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  ExternalLink,
  Gift,
  HelpCircle,
  Info,
  Loader2,
  Lock,
  MessageSquare,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface ChatUser {
  id: string
  nickname: string
  age?: number
  gender?: string
  region?: string
  avatar?: string
}

interface MessageItem {
  id: string
  senderId: string
  senderName: string
  type?: 'TEXT' | 'GIFT' | 'IMAGE'
  text?: string
  giftName?: string
  time: string
  isFlagged?: boolean
  flagNotice?: string
}

interface DetailedChatRoom extends ChatRoomSummary {
  userA?: ChatUser
  userB?: ChatUser
  lastMessage?: string
  flaggedReason?: string
  messages?: MessageItem[]
}

const FALLBACK_1ON1_ROOMS: DetailedChatRoom[] = [
  {
    id: 'CHAT-101',
    title: '이지민 ↔ 김철수',
    category: '1:1 대화',
    region: '서울 강남구',
    distanceKm: 1.2,
    unread: 0,
    newMessages: 18,
    participants: 2,
    status: 'NEEDS_REVIEW',
    createdAt: '2026-10-15 10:12',
    lastMessageAt: '10:45',
    lastMessage: '카톡으로 연락하실래요? 제 아이디는 chulsoo_99 입니다!',
    flaggedReason: '외부 연락처(카카오톡 ID) 유도 감지',
    userA: {
      id: 'u1',
      nickname: '이지민',
      age: 24,
      gender: '여',
      region: '서울 강남구',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
    },
    userB: {
      id: 'u2',
      nickname: '김철수',
      age: 28,
      gender: '남',
      region: '서울 서초구',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    },
    messages: [
      { id: 'm1', senderId: 'u1', senderName: '이지민', text: '안녕하세요 철수님! 오늘 강남 쪽 날씨 좋네요 :)', time: '10:15', isFlagged: false },
      { id: 'm2', senderId: 'u2', senderName: '김철수', text: '네 지민님! 프로필 사진 분위기 너무 좋으세요!', time: '10:18', isFlagged: false },
      { id: 'm3', senderId: 'u2', senderName: '김철수', type: 'GIFT', giftName: '하트 10개 (1,000온)', time: '10:20', isFlagged: false },
      { id: 'm4', senderId: 'u1', senderName: '이지민', text: '앗 하트 선물 감사합니다 ㅎㅎ 퇴근하고 보통 뭐 하세요?', time: '10:25', isFlagged: false },
      {
        id: 'm5',
        senderId: 'u2',
        senderName: '김철수',
        text: '혹시 여기서 대화하기 불편한데 카톡으로 연락하실래요? 제 아이디는 chulsoo_99 입니다!',
        time: '10:45',
        isFlagged: true,
        flagNotice: '외부 메신저(카카오톡 ID) 유도 감지',
      },
    ],
  },
  {
    id: 'CHAT-102',
    title: '박민수 ↔ 서연',
    category: '1:1 대화',
    region: '부산 해운대구',
    distanceKm: 2.8,
    unread: 0,
    newMessages: 42,
    participants: 2,
    status: 'ACTIVE',
    createdAt: '2026-10-14 18:30',
    lastMessageAt: '09:20',
    lastMessage: '네! 저도 그 밴드 음악 좋아해요 :) 다음에 공연 있으면 가보려구요',
    userA: {
      id: 'u3',
      nickname: '박민수',
      age: 27,
      gender: '남',
      region: '부산 해운대구',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
    },
    userB: {
      id: 'u4',
      nickname: '서연',
      age: 25,
      gender: '여',
      region: '부산 수영구',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
    },
    messages: [
      { id: 'm201', senderId: 'u3', senderName: '박민수', text: '서연님 피드에 올리신 인디밴드 공연 영상 잘 봤어요!', time: '어제 18:30', isFlagged: false },
      { id: 'm202', senderId: 'u4', senderName: '서연', text: '어 정말요? 그 밴드 아시는 분 드문데 너무 반가워요!', time: '어제 18:35', isFlagged: false },
      { id: 'm203', senderId: 'u3', senderName: '박민수', text: '네! 저도 그 밴드 음악 좋아해요 :) 다음에 공연 있으면 가보려구요', time: '09:20', isFlagged: false },
    ],
  },
  {
    id: 'CHAT-103',
    title: '최유진 ↔ 정우성',
    category: '1:1 대화',
    region: '대구 수성구',
    distanceKm: 3.5,
    unread: 0,
    newMessages: 8,
    participants: 2,
    status: 'NEEDS_REVIEW',
    createdAt: '2026-10-15 08:20',
    lastMessageAt: '09:12',
    lastMessage: '신한 110-382-XXXXXX 계좌로 먼저 입금해주시면...',
    flaggedReason: '금전 및 사기 계좌 요구 의심',
    userA: {
      id: 'u5',
      nickname: '최유진',
      age: 23,
      gender: '여',
      region: '대구 수성구',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120',
    },
    userB: {
      id: 'u6',
      nickname: '정우성',
      age: 31,
      gender: '남',
      region: '대구 중구',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120',
    },
    messages: [
      { id: 'm301', senderId: 'u5', senderName: '최유진', text: '프로필에 라이브 방송 보러오시라고 적혀있어서 연락드렸어요!', time: '08:20', isFlagged: false },
      { id: 'm302', senderId: 'u6', senderName: '정우성', text: '아 네 환영합니다! 혹시 비공개 이벤트 참여 원하시면 티켓비 지원해주셔야 해요', time: '08:35', isFlagged: false },
      {
        id: 'm303',
        senderId: 'u6',
        senderName: '정우성',
        text: '신한 110-382-XXXXXX 계좌로 먼저 입금해주시면 VIP 초대 링크 보내드릴게요',
        time: '09:12',
        isFlagged: true,
        flagNotice: '외부 계좌번호 및 금전 입금 요구 탐지',
      },
    ],
  },
  {
    id: 'CHAT-104',
    title: '강도윤 ↔ 한수아',
    category: '1:1 대화',
    region: '인천 연수구',
    distanceKm: 4.1,
    unread: 0,
    newMessages: 0,
    participants: 2,
    status: 'ARCHIVED',
    createdAt: '2026-10-14 11:00',
    lastMessageAt: '14:20',
    lastMessage: '관리자에 의해 [24시간 1:1 대화 정지] 조치가 적용되었습니다.',
    flaggedReason: '비속어 사용으로 제재 완료',
    userA: {
      id: 'u7',
      nickname: '강도윤',
      age: 29,
      gender: '남',
      region: '인천 연수구',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120',
    },
    userB: {
      id: 'u8',
      nickname: '한수아',
      age: 26,
      gender: '여',
      region: '인천 남동구',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
    },
    messages: [
      { id: 'm401', senderId: 'u7', senderName: '강도윤', text: '야 말귀 못 알아듣냐? ㅋㅋㅋ', time: '14:15', isFlagged: true, flagNotice: '비속어/모욕성 표현 감지' },
      {
        id: 'm402',
        senderId: 'system',
        senderName: '시스템',
        text: '🚨 운영 원칙 위반으로 인해 해당 계정의 1:1 대화 전송이 24시간 동안 정지되었습니다.',
        time: '14:20',
        isFlagged: false,
      },
    ],
  },
]

const FALLBACK_REPORTS: ChatSafetyReport[] = [
  {
    id: 'REP-1001',
    roomId: 'CHAT-101',
    reporter: '이지민 (010-3210-XXXX)',
    target: '김철수 (010-8821-XXXX)',
    reason: '외부 메신저(카카오톡) 연락처 유도 및 집요한 요구',
    status: 'PENDING',
    createdAt: '2026-10-15 10:46',
  },
  {
    id: 'REP-1002',
    roomId: 'CHAT-103',
    reporter: '최유진 (010-5624-XXXX)',
    target: '정우성 (010-7712-XXXX)',
    reason: '타계좌 입금 유도 및 금전 사기 의심',
    status: 'IN_PROGRESS',
    createdAt: '2026-10-15 09:15',
  },
]

const FALLBACK_RULES: ChatPolicyRule[] = [
  {
    id: 'rule-keyword',
    name: '금칙어 및 욕설 자동 감지',
    description: '비속어, 성희롱 키워드 감지 시 실시간 마스킹(***) 및 경고 발송',
    enabled: true,
    autoAction: '자동 마스킹 + AI 경고 알림',
  },
  {
    id: 'rule-contact-leak',
    name: '외부 연락처 및 계좌번호 탐지',
    description: '전화번호, 카카오톡 ID, 은행 계좌 형태의 텍스트 감지 시 관리자 큐 전송',
    enabled: true,
    autoAction: '관리자 신고 큐 자동 상신',
  },
  {
    id: 'rule-repeat-report',
    name: '신고 누적 회원 자동 이용 제한',
    description: '동일 회원 대상 신고 3회 누적 시 24시간 1:1 대화 전송 차단',
    enabled: true,
    autoAction: '24시간 1:1 채팅 차단',
  },
  {
    id: 'rule-media-scan',
    name: '첨부 미디어 AI 유해성 스캔',
    description: '사진 전송 시 Vision API를 통해 음란물/불법 콘텐츠 자동 차단',
    enabled: true,
    autoAction: '유해 이미지 즉시 블러 및 관리자 알림',
  },
]

type FilterTab = 'ALL' | 'FLAGGED' | 'ACTIVE' | 'ARCHIVED'

export default function ChatsPage() {
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'MONITOR' | 'POLICY'>('MONITOR')
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showGuide, setShowGuide] = useState(true)

  const [isLoading, setIsLoading] = useState(false)
  const [rooms, setRooms] = useState<DetailedChatRoom[]>(FALLBACK_1ON1_ROOMS)
  const [reports, setReports] = useState<ChatSafetyReport[]>(FALLBACK_REPORTS)
  const [policyRules, setPolicyRules] = useState<ChatPolicyRule[]>(FALLBACK_RULES)
  const [safetyMemo, setSafetyMemo] = useState('2026-10-15 오전: 외부 메신저 유도 의심 대화 2건 집중 모니터링 중')
  const [initialMemo, setInitialMemo] = useState('2026-10-15 오전: 외부 메신저 유도 의심 대화 2건 집중 모니터링 중')

  // 금칙어 관리 리스트
  const [bannedKeywords, setBannedKeywords] = useState<string[]>([
    '카톡',
    '카카오톡',
    '오픈채팅',
    '텔레그램',
    '라인',
    '계좌',
    '입금',
    '선입금',
    '수수료',
    '스폰',
    '조건',
  ])
  const [newKeywordInput, setNewKeywordInput] = useState('')

  const [selectedRoomId, setSelectedRoomId] = useState<string>(FALLBACK_1ON1_ROOMS[0]?.id ?? '')
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [auditNote, setAuditNote] = useState('')

  useEffect(() => {
    void loadSnapshot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadSnapshot() {
    setIsLoading(true)
    try {
      const snapshot = await getChatSafetySnapshot()
      if (snapshot.rooms && snapshot.rooms.length > 0) {
        setRooms(snapshot.rooms as DetailedChatRoom[])
        setSelectedRoomId((prev) => (snapshot.rooms.some((r) => r.id === prev) ? prev : snapshot.rooms[0].id))
      } else {
        setRooms(FALLBACK_1ON1_ROOMS)
      }

      if (snapshot.reports && snapshot.reports.length > 0) {
        setReports(snapshot.reports)
      } else {
        setReports(FALLBACK_REPORTS)
      }

      if (snapshot.policyRules && snapshot.policyRules.length > 0) {
        setPolicyRules(snapshot.policyRules)
      } else {
        setPolicyRules(FALLBACK_RULES)
      }

      if (typeof snapshot.memo === 'string') {
        setSafetyMemo(snapshot.memo)
        setInitialMemo(snapshot.memo)
      }
    } catch {
      setRooms(FALLBACK_1ON1_ROOMS)
      setReports(FALLBACK_REPORTS)
      setPolicyRules(FALLBACK_RULES)
    } finally {
      setIsLoading(false)
    }
  }

  // 필터링된 대화방 목록
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // 탭 필터
      if (filterTab === 'FLAGGED' && room.status !== 'NEEDS_REVIEW' && !room.flaggedReason) return false
      if (filterTab === 'ACTIVE' && room.status !== 'ACTIVE') return false
      if (filterTab === 'ARCHIVED' && room.status !== 'ARCHIVED') return false

      // 검색어 필터 (닉네임, 메시지, 지역, 방ID)
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase()
        const titleMatch = room.title?.toLowerCase().includes(q)
        const nickAMatch = room.userA?.nickname?.toLowerCase().includes(q)
        const nickBMatch = room.userB?.nickname?.toLowerCase().includes(q)
        const lastMsgMatch = room.lastMessage?.toLowerCase().includes(q)
        const regionMatch = room.region?.toLowerCase().includes(q)
        const idMatch = room.id.toLowerCase().includes(q)
        return titleMatch || nickAMatch || nickBMatch || lastMsgMatch || regionMatch || idMatch
      }
      return true
    })
  }, [rooms, filterTab, searchKeyword])

  const selectedRoom = useMemo(() => {
    return rooms.find((r) => r.id === selectedRoomId) ?? filteredRooms[0] ?? rooms[0] ?? null
  }, [rooms, selectedRoomId, filteredRooms])

  // 현재 선택된 대화방에 연결된 신고 정보
  const activeReport = useMemo(() => {
    if (!selectedRoom) return null
    return reports.find((rep) => rep.roomId === selectedRoom.id) ?? null
  }, [selectedRoom, reports])

  // 원클릭 제재 액션 핸들러
  const handleTakeAction = async (
    actionType: 'WARN' | 'SUSPEND_24H' | 'BAN_PERMANENT' | 'DISMISS_NORMAL'
  ) => {
    if (!selectedRoom) return
    const targetNickname = selectedRoom.userB?.nickname ?? '피신고자'
    setActionInProgress(actionType)

    try {
      if (actionType === 'WARN') {
        // 1. 주의 경고장 발송
        await updateChatRoom(selectedRoom.id, {
          cannedMessage: `[관리자 경고] ${targetNickname} 회원님, 외부 연락처 유도 및 불건전 대화 시 계정이 정지될 수 있습니다.`,
          status: 'ACTIVE',
        })
        if (activeReport) {
          await resolveChatReport(activeReport.id, { action: 'WARN_ISSUED', note: auditNote })
          setReports((prev) => prev.map((r) => (r.id === activeReport.id ? { ...r, status: 'RESOLVED' } : r)))
        }
        setRooms((prev) =>
          prev.map((r) =>
            r.id === selectedRoom.id
              ? {
                  ...r,
                  status: 'ACTIVE',
                  flaggedReason: undefined,
                  messages: [
                    ...(r.messages ?? []),
                    {
                      id: `sys-${Date.now()}`,
                      senderId: 'system',
                      senderName: '시스템',
                      text: `⚠️ [관리자 경고 발송] ${targetNickname} 회원님에게 커뮤니티 가이드라인 준수 주의 조치가 전달되었습니다.`,
                      time: '방금',
                    },
                  ],
                }
              : r
          )
        )
        toast({
          title: '⚠️ 경고장 발송 완료',
          description: `${targetNickname} 회원에게 주의 알림을 전송하고 상태를 정상으로 복귀했습니다.`,
        })
      } else if (actionType === 'SUSPEND_24H') {
        // 2. 24시간 1:1 대화 제한
        await updateChatRoom(selectedRoom.id, {
          allowEntry: false,
          status: 'ARCHIVED',
          cannedMessage: `[이용 제한] ${targetNickname} 회원의 1:1 대화 기능이 24시간 동안 정지되었습니다.`,
        })
        if (activeReport) {
          await resolveChatReport(activeReport.id, { action: 'SUSPEND_24H', note: auditNote })
          setReports((prev) => prev.map((r) => (r.id === activeReport.id ? { ...r, status: 'RESOLVED' } : r)))
        }
        setRooms((prev) =>
          prev.map((r) =>
            r.id === selectedRoom.id
              ? {
                  ...r,
                  status: 'ARCHIVED',
                  flaggedReason: '24시간 1:1 대화 정지 조치 완료',
                  messages: [
                    ...(r.messages ?? []),
                    {
                      id: `sys-${Date.now()}`,
                      senderId: 'system',
                      senderName: '시스템',
                      text: `🚫 [제재 적용] ${targetNickname} 회원의 1:1 대화 전송 권한이 24시간 동안 차단되었습니다.`,
                      time: '방금',
                    },
                  ],
                }
              : r
          )
        )
        toast({
          title: '🚫 24시간 채팅 정지 적용',
          description: `${targetNickname} 회원의 1:1 대화 전송 기능이 즉시 정지되었습니다.`,
          variant: 'destructive',
        })
      } else if (actionType === 'BAN_PERMANENT') {
        // 3. 계정 영구 정지
        await updateChatRoom(selectedRoom.id, {
          allowEntry: false,
          status: 'ARCHIVED',
          cannedMessage: `[계정 영구 정지] 불법 행위(사기/스캠)로 인해 ${targetNickname} 계정이 영구 정지되었습니다.`,
        })
        if (activeReport) {
          await resolveChatReport(activeReport.id, { action: 'BAN_PERMANENT', note: auditNote })
          setReports((prev) => prev.map((r) => (r.id === activeReport.id ? { ...r, status: 'RESOLVED' } : r)))
        }
        setRooms((prev) =>
          prev.map((r) =>
            r.id === selectedRoom.id
              ? {
                  ...r,
                  status: 'ARCHIVED',
                  flaggedReason: '불법 사기/유도 행위로 영구 정지됨',
                  messages: [
                    ...(r.messages ?? []),
                    {
                      id: `sys-${Date.now()}`,
                      senderId: 'system',
                      senderName: '시스템',
                      text: `⛔ [영구 정지] ${targetNickname} 계정이 영구 정지되어 모든 서비스 이용이 차단되었습니다.`,
                      time: '방금',
                    },
                  ],
                }
              : r
          )
        )
        toast({
          title: '⛔ 계정 영구 정지 완료',
          description: `${targetNickname} 회원의 계정이 영구 제재 처리되었습니다.`,
          variant: 'destructive',
        })
      } else if (actionType === 'DISMISS_NORMAL') {
        // 4. 정상 대화 종결 (무혐의)
        await updateChatRoom(selectedRoom.id, { status: 'ACTIVE' })
        if (activeReport) {
          await resolveChatReport(activeReport.id, { action: 'DISMISSED_NORMAL', note: auditNote })
          setReports((prev) => prev.map((r) => (r.id === activeReport.id ? { ...r, status: 'RESOLVED' } : r)))
        }
        setRooms((prev) =>
          prev.map((r) =>
            r.id === selectedRoom.id
              ? {
                  ...r,
                  status: 'ACTIVE',
                  flaggedReason: undefined,
                }
              : r
          )
        )
        toast({
          title: '✅ 무혐의 종결 완료',
          description: `정상 대화로 확인되어 심사 대기 상태를 해제했습니다.`,
        })
      }
      setAuditNote('')
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '조치 적용에 실패했습니다.'
      toast({
        title: '조치 처리 실패',
        description: Array.isArray(message) ? message.join(', ') : String(message),
        variant: 'destructive',
      })
    } finally {
      setActionInProgress(null)
    }
  }

  // 정책 스위치 토글
  const handleTogglePolicyRule = async (rule: ChatPolicyRule) => {
    try {
      const updated = await updateChatPolicyRule(rule.id, { enabled: !rule.enabled })
      setPolicyRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, ...updated, enabled: !rule.enabled } : r)))
      toast({
        title: '정책 변경 완료',
        description: `${rule.name} 정책이 ${!rule.enabled ? '활성화' : '비활성화'}되었습니다.`,
      })
    } catch {
      toast({ title: '정책 변경 실패', variant: 'destructive' })
    }
  }

  // 금칙어 추가
  const handleAddKeyword = () => {
    if (!newKeywordInput.trim()) return
    const kw = newKeywordInput.trim()
    if (bannedKeywords.includes(kw)) {
      toast({ title: '이미 등록된 금칙어입니다.', variant: 'destructive' })
      return
    }
    setBannedKeywords([...bannedKeywords, kw])
    setNewKeywordInput('')
    toast({ title: '금칙어 등록 완료', description: `[${kw}] 단어가 실시간 필터 목록에 추가되었습니다.` })
  }

  // 금칙어 삭제
  const handleRemoveKeyword = (target: string) => {
    setBannedKeywords(bannedKeywords.filter((k) => k !== target))
    toast({ title: '금칙어 삭제 완료', description: `[${target}] 단어가 제거되었습니다.` })
  }

  // 안전 운영 메모 저장
  const handleSaveMemo = async () => {
    if (safetyMemo.trim() === initialMemo.trim()) return
    try {
      await saveChatSafetyMemo({ memo: safetyMemo })
      setInitialMemo(safetyMemo)
      toast({ title: '안전 운영 메모 저장', description: '팀 인수인계 메모가 저장되었습니다.' })
    } catch {
      toast({ title: '메모 저장 실패', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. 상단 안내 헤더 & 탭 바 */}
      <div className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              1:1 대화 & 안전 모니터링
            </h1>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              실시간 쪽지 관제
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            회원 간 1:1 쪽지/메시지 내역을 실시간으로 확인하고, 이상 대화(외부 연락처 유도, 금전 요구, 성희롱 등) 및 신고를
            신속히 심사·제재하는 공간입니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={activeTab === 'MONITOR' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('MONITOR')}
            className="flex items-center gap-2"
          >
            <ShieldAlert className="h-4 w-4" />
            1:1 대화 & 신고 심사
          </Button>
          <Button
            variant={activeTab === 'POLICY' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('POLICY')}
            className="flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            AI 금칙어 & 안전 정책
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadSnapshot()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* 2. 신입 직원을 위한 3단계 실무 가이드 (접기/펼치기 가능) */}
      <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            💡 신입 운영자를 위한 1:1 대화 검토 3단계 실무 가이드
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
                1단계: 이상 대화 선택
              </span>
              <p className="mt-1.5 text-muted-foreground">
                좌측 목록에서 <b>[🚨 이상/신고]</b> 탭을 클릭하여 빨간색/주황색 의심 배지가 달린 1:1 대화 세션을 확인합니다.
              </p>
            </div>
            <div className="rounded-md border border-amber-200/80 bg-white/60 p-3 shadow-sm dark:border-amber-900/40 dark:bg-black/20">
              <span className="inline-block rounded bg-amber-200 px-1.5 py-0.5 font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                2단계: 대화 맥락 검토
              </span>
              <p className="mt-1.5 text-muted-foreground">
                우측 카카오톡 스타일 화면에서 <b>노란색 AI 하이라이트 문장</b>과 이전/이후 대화 흐름, 선물(하트) 내역을 확인합니다.
              </p>
            </div>
            <div className="rounded-md border border-amber-200/80 bg-white/60 p-3 shadow-sm dark:border-amber-900/40 dark:bg-black/20">
              <span className="inline-block rounded bg-amber-200 px-1.5 py-0.5 font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                3단계: 원클릭 신속 조치
              </span>
              <p className="mt-1.5 text-muted-foreground">
                하단의 <b>[경고장 발송]</b>, <b>[24시간 채팅 정지]</b>, <b>[계정 영구 정지]</b>, <b>[무혐의 종결]</b> 버튼 중 하나를
                클릭합니다.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. 탭 1: 1:1 대화 모니터링 & 신고 심사 */}
      {activeTab === 'MONITOR' && (
        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          {/* 좌측: 1:1 대화 세션 목록 & 신고 큐 */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span>대화 세션 목록</span>
                  <span className="text-xs font-normal text-muted-foreground">총 {rooms.length}건</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  회원 간 실시간 1:1 메시지 및 이상 대화 감지 현황
                </CardDescription>

                {/* 탭 필터 */}
                <div className="mt-3 grid grid-cols-4 gap-1 rounded-md bg-muted p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterTab('ALL')}
                    className={`rounded py-1.5 font-medium transition ${
                      filterTab === 'ALL' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    전체 ({rooms.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('FLAGGED')}
                    className={`rounded py-1.5 font-medium transition flex items-center justify-center gap-1 ${
                      filterTab === 'FLAGGED' ? 'bg-destructive/15 text-destructive font-bold shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    <span>🚨</span>
                    <span>이상 ({rooms.filter((r) => r.status === 'NEEDS_REVIEW' || r.flaggedReason).length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('ACTIVE')}
                    className={`rounded py-1.5 font-medium transition ${
                      filterTab === 'ACTIVE' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    정상 ({rooms.filter((r) => r.status === 'ACTIVE').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('ARCHIVED')}
                    className={`rounded py-1.5 font-medium transition ${
                      filterTab === 'ARCHIVED' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    완료 ({rooms.filter((r) => r.status === 'ARCHIVED').length})
                  </button>
                </div>

                {/* 검색창 */}
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="닉네임, 메시지, 지역, ID 검색..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                  {searchKeyword && (
                    <button
                      type="button"
                      onClick={() => setSearchKeyword('')}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-2 pt-0">
                <div className="max-h-[580px] space-y-2 overflow-y-auto pr-1">
                  {filteredRooms.map((room) => {
                    const isSelected = selectedRoom?.id === room.id
                    const isFlagged = room.status === 'NEEDS_REVIEW' || Boolean(room.flaggedReason)
                    const relatedReport = reports.find((rep) => rep.roomId === room.id)

                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoomId(room.id)}
                        className={`group relative cursor-pointer rounded-lg border p-3 transition ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border bg-card hover:border-primary/50 hover:bg-accent/40'
                        }`}
                      >
                        {/* 상단: 두 유저 아바타 겹침 & 닉네임 */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            {/* 겹쳐진 아바타 2개 */}
                            <div className="relative flex h-8 w-12 items-center">
                              <img
                                src={room.userA?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80'}
                                alt={room.userA?.nickname ?? '유저A'}
                                className="absolute left-0 h-7 w-7 rounded-full border-2 border-background object-cover shadow-xs"
                              />
                              <img
                                src={room.userB?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80'}
                                alt={room.userB?.nickname ?? '유저B'}
                                className="absolute left-4.5 h-7 w-7 rounded-full border-2 border-background object-cover shadow-xs"
                              />
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-xs text-foreground">
                                  {room.userA?.nickname ?? '회원A'}
                                </span>
                                <span className="text-[10px] text-muted-foreground">↔</span>
                                <span className="font-semibold text-xs text-foreground">
                                  {room.userB?.nickname ?? '회원B'}
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {room.region} · {room.distanceKm ? `약 ${room.distanceKm}km` : '인근'}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] text-muted-foreground">{room.lastMessageAt ?? '-'}</span>
                          </div>
                        </div>

                        {/* 이상 징후 배지 또는 상태 */}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {isFlagged ? (
                            <span className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
                              <AlertTriangle className="h-3 w-3" />
                              {room.flaggedReason || '이상 대화 의심'}
                            </span>
                          ) : room.status === 'ARCHIVED' ? (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              <Lock className="h-3 w-3" />
                              조치 완료/종료
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              정상 대화
                            </span>
                          )}

                          {relatedReport && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                              🚨 신고 접수 #{relatedReport.id}
                            </span>
                          )}
                        </div>

                        {/* 마지막 메시지 미리보기 */}
                        <p className="mt-1.5 line-clamp-1 text-xs text-muted-foreground">
                          {room.lastMessage || '대화 내용 없음'}
                        </p>
                      </div>
                    )
                  })}

                  {filteredRooms.length === 0 && (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      조건에 맞는 1:1 대화 세션이 없습니다.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 우측: 카카오톡 스타일 1:1 말풍선 대화 뷰어 & 신속 조치 바 */}
          <div className="space-y-4">
            {selectedRoom ? (
              <Card className="flex h-full flex-col">
                {/* 뷰어 상단: 두 유저 정보 & 신고 배너 */}
                <CardHeader className="border-b p-4 pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* 대화 상대방 2명 정보 */}
                    <div className="flex items-center gap-4">
                      {/* 유저 A */}
                      <div className="flex items-center gap-2">
                        <img
                          src={selectedRoom.userA?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                          alt={selectedRoom.userA?.nickname ?? ''}
                          className="h-10 w-10 rounded-full border object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-1 font-bold text-sm">
                            <span>{selectedRoom.userA?.nickname}</span>
                            <span className="text-xs text-muted-foreground font-normal">
                              ({selectedRoom.userA?.age}세·{selectedRoom.userA?.gender})
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">{selectedRoom.userA?.region}</div>
                          <Link
                            href={`/users/${selectedRoom.userA?.id ?? 'u1'}`}
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                          >
                            회원 상세 <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        </div>
                      </div>

                      <div className="text-center font-bold text-muted-foreground text-sm">↔</div>

                      {/* 유저 B */}
                      <div className="flex items-center gap-2">
                        <img
                          src={selectedRoom.userB?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                          alt={selectedRoom.userB?.nickname ?? ''}
                          className="h-10 w-10 rounded-full border object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-1 font-bold text-sm">
                            <span>{selectedRoom.userB?.nickname}</span>
                            <span className="text-xs text-muted-foreground font-normal">
                              ({selectedRoom.userB?.age}세·{selectedRoom.userB?.gender})
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">{selectedRoom.userB?.region}</div>
                          <Link
                            href={`/users/${selectedRoom.userB?.id ?? 'u2'}`}
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                          >
                            회원 상세 <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* 세션 상태 */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">세션 ID: {selectedRoom.id}</span>
                        {selectedRoom.status === 'NEEDS_REVIEW' ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            ⚠️ 심사 대기
                          </span>
                        ) : selectedRoom.status === 'ARCHIVED' ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            🔒 조치 완료
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            운영 중
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        생성: {selectedRoom.createdAt ?? '-'} · 최근 메시지: {selectedRoom.lastMessageAt ?? '-'}
                      </span>
                    </div>
                  </div>

                  {/* 신고 정보가 있을 경우 강조 배너 */}
                  {activeReport && (
                    <div className="mt-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-bold flex items-center justify-between">
                          <span>신고 접수: #{activeReport.id} ({activeReport.createdAt})</span>
                          <span className="rounded bg-red-200 px-1.5 py-0.2 text-[10px] text-red-800 dark:bg-red-900 dark:text-red-200">
                            {activeReport.status === 'PENDING' ? '미처리 접수' : '처리 중'}
                          </span>
                        </div>
                        <div className="mt-0.5">
                          신고자: <b>{String(activeReport.reporter ?? '')}</b> ➡️ 피신고자: <b>{String(activeReport.target ?? selectedRoom.userB?.nickname ?? '')}</b>
                        </div>
                        <div className="mt-0.5 text-red-700 dark:text-red-300 font-medium">
                          신고 사유: &quot;{String(activeReport.reason ?? '')}&quot;
                        </div>
                      </div>
                    </div>
                  )}
                </CardHeader>

                {/* 중앙: 카카오톡 스타일 말풍선 스트림 */}
                <CardContent className="flex-1 p-4 bg-slate-50/60 dark:bg-slate-900/40">
                  <div className="max-h-[380px] min-h-[300px] space-y-4 overflow-y-auto px-2 py-3">
                    {/* 날짜 구분선 */}
                    <div className="flex items-center justify-center">
                      <span className="rounded-full bg-muted/80 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-2xs">
                        2026년 10월 15일 목요일
                      </span>
                    </div>

                    {selectedRoom.messages && selectedRoom.messages.length > 0 ? (
                      selectedRoom.messages.map((msg) => {
                        // 시스템 메시지인 경우 (가운데 안내)
                        if (msg.senderId === 'system') {
                          return (
                            <div key={msg.id} className="flex justify-center">
                              <div className="rounded-lg border border-red-200 bg-red-100/70 px-4 py-2 text-center text-xs font-semibold text-red-800 shadow-xs dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
                                {msg.text}
                              </div>
                            </div>
                          )
                        }

                        // 선물(하트/온) 이벤트인 경우 (가운데 카드)
                        if (msg.type === 'GIFT') {
                          return (
                            <div key={msg.id} className="flex justify-center">
                              <div className="flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100/80 px-4 py-1.5 text-xs font-bold text-amber-900 shadow-xs dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
                                <Gift className="h-4 w-4 text-amber-600 animate-bounce" />
                                <span>
                                  🎁 <b>[{msg.senderName}]</b> 님이 <b>[{msg.giftName}]</b> 을 선물했습니다!
                                </span>
                                <span className="text-[10px] text-amber-700 font-normal">{msg.time}</span>
                              </div>
                            </div>
                          )
                        }

                        // 일반 회원 메시지: UserA는 좌측, UserB는 우측 말풍선
                        const isUserA = msg.senderId === selectedRoom.userA?.id || msg.senderName === selectedRoom.userA?.nickname

                        return (
                          <div
                            key={msg.id}
                            className={`flex items-end gap-2 ${isUserA ? 'justify-start' : 'justify-end'}`}
                          >
                            {/* UserA 아바타 */}
                            {isUserA && (
                              <img
                                src={selectedRoom.userA?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60'}
                                alt=""
                                className="h-7 w-7 rounded-full border object-cover self-start mt-1"
                              />
                            )}

                            {/* UserB 시간 (우측일 때는 시간이 왼쪽에 표시) */}
                            {!isUserA && (
                              <span className="text-[10px] text-muted-foreground pb-0.5">{msg.time}</span>
                            )}

                            <div className="max-w-[75%] space-y-1">
                              {/* 발신자 닉네임 */}
                              <div className={`text-[11px] text-muted-foreground font-medium ${isUserA ? 'text-left' : 'text-right'}`}>
                                {msg.senderName}
                              </div>

                              {/* 말풍선 본체 */}
                              <div
                                className={`rounded-2xl px-3.5 py-2.5 text-xs shadow-xs ${
                                  msg.isFlagged
                                    ? 'border-2 border-red-500 bg-red-50 text-red-900 font-semibold dark:bg-red-950 dark:text-red-100'
                                    : isUserA
                                    ? 'rounded-tl-xs border bg-background text-foreground'
                                    : 'rounded-tr-xs bg-amber-400 text-amber-950 font-medium dark:bg-amber-500 dark:text-black'
                                }`}
                              >
                                <div>{msg.text}</div>

                                {/* AI 유해 키워드 감지 경고 칩 */}
                                {msg.isFlagged && (
                                  <div className="mt-2 flex items-center gap-1 rounded bg-red-200/80 px-2 py-1 text-[11px] font-bold text-red-900 dark:bg-red-900 dark:text-red-200">
                                    <ShieldAlert className="h-3 w-3 shrink-0" />
                                    <span>[AI 심사관 감지] {msg.flagNotice || '외부 연락처 또는 유해 키워드 탐지됨'}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* UserA 시간 (좌측일 때는 시간이 오른쪽에 표시) */}
                            {isUserA && (
                              <span className="text-[10px] text-muted-foreground pb-0.5">{msg.time}</span>
                            )}

                            {/* UserB 아바타 */}
                            {!isUserA && (
                              <img
                                src={selectedRoom.userB?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60'}
                                alt=""
                                className="h-7 w-7 rounded-full border object-cover self-start mt-1"
                              />
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="py-12 text-center text-xs text-muted-foreground">
                        대화 내역이 없습니다.
                      </div>
                    )}
                  </div>
                </CardContent>

                {/* 하단: 신입 직원도 1초 만에 이해하는 원클릭 제재 조치 패널 */}
                <div className="border-t p-4 bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                      <Shield className="h-4 w-4 text-primary" />
                      신속 제재 & 신고 처리 컨트롤
                      <span className="text-[11px] font-normal text-muted-foreground">
                        (피신고자: <b>{selectedRoom.userB?.nickname}</b> 대상)
                      </span>
                    </div>
                    {actionInProgress && (
                      <div className="flex items-center gap-1.5 text-xs text-primary animate-pulse font-medium">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        조치 적용 중...
                      </div>
                    )}
                  </div>

                  {/* 4개의 원클릭 조치 버튼 */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {/* 1. 경고장 발송 */}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={Boolean(actionInProgress)}
                      onClick={() => void handleTakeAction('WARN')}
                      className="flex flex-col h-auto py-2 border-amber-300 bg-amber-50/60 hover:bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                    >
                      <span className="flex items-center gap-1 font-bold text-xs">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        경고장 발송
                      </span>
                      <span className="text-[10px] text-muted-foreground">주의 팝업 푸시 알림</span>
                    </Button>

                    {/* 2. 24시간 1:1 대화 제한 */}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={Boolean(actionInProgress)}
                      onClick={() => void handleTakeAction('SUSPEND_24H')}
                      className="flex flex-col h-auto py-2 border-orange-300 bg-orange-50/60 hover:bg-orange-100 text-orange-900 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-200"
                    >
                      <span className="flex items-center gap-1 font-bold text-xs">
                        <UserX className="h-3.5 w-3.5 text-orange-600" />
                        24시간 대화 제한
                      </span>
                      <span className="text-[10px] text-muted-foreground">메시지 전송 1일 차단</span>
                    </Button>

                    {/* 3. 계정 영구 정지 */}
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={Boolean(actionInProgress)}
                      onClick={() => void handleTakeAction('BAN_PERMANENT')}
                      className="flex flex-col h-auto py-2"
                    >
                      <span className="flex items-center gap-1 font-bold text-xs">
                        <Ban className="h-3.5 w-3.5" />
                        계정 영구 정지
                      </span>
                      <span className="text-[10px] opacity-80">사기/스캠 즉시 강퇴</span>
                    </Button>

                    {/* 4. 무혐의 정상 종결 */}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={Boolean(actionInProgress)}
                      onClick={() => void handleTakeAction('DISMISS_NORMAL')}
                      className="flex flex-col h-auto py-2 border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                    >
                      <span className="flex items-center gap-1 font-bold text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        무혐의 종결
                      </span>
                      <span className="text-[10px] text-muted-foreground">정상 대화로 확인</span>
                    </Button>
                  </div>

                  {/* 관리자 감사 메모 입력 */}
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="조치 사유 또는 인수인계 메모 (예: 외부 연락처 유도로 1차 경고 발송)"
                      value={auditNote}
                      onChange={(e) => setAuditNote(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="flex h-full min-h-[400px] items-center justify-center p-8 text-center text-muted-foreground">
                <div>
                  <MessageSquare className="mx-auto h-8 w-8 opacity-40 mb-2" />
                  <p className="text-sm font-semibold">선택된 1:1 대화방이 없습니다.</p>
                  <p className="text-xs">왼쪽 목록에서 검토할 대화 세션을 클릭해주세요.</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* 4. 탭 2: AI 금칙어 & 안전 자동화 정책 */}
      {activeTab === 'POLICY' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* 카드 1: 실시간 자동 제재 룰 스위치 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                AI 안전 심사 및 자동 제재 정책
              </CardTitle>
              <CardDescription className="text-xs">
                모든 1:1 대화에 실시간으로 적용되는 자동 감지 엔진 스위치입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {policyRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-start justify-between gap-3 rounded-lg border p-3 bg-card"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">{rule.name}</span>
                        {rule.enabled ? (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            동작 중
                          </span>
                        ) : (
                          <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            꺼짐
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{rule.description}</p>
                      <p className="text-[11px] font-medium text-primary">자동 조치: {rule.autoAction}</p>
                    </div>

                    <Switch
                      checked={Boolean(rule.enabled)}
                      onCheckedChange={() => void handleTogglePolicyRule(rule)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 카드 2: 금칙어 실시간 태그 관리 & 운영 메모 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Ban className="h-5 w-5 text-destructive" />
                  실시간 금칙어 / 마스킹 키워드
                </CardTitle>
                <CardDescription className="text-xs">
                  회원이 1:1 대화 입력 시 실시간으로 *** 마스킹 처리되거나 관리자 큐로 전달되는 단어 목록입니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 금칙어 태그 리스트 */}
                <div className="flex flex-wrap gap-1.5 min-h-[80px] rounded-md border p-3 bg-muted/20">
                  {bannedKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground"
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* 새 금칙어 추가 인풋 */}
                <div className="flex gap-2">
                  <Input
                    placeholder="새 금칙어 입력 (예: 오픈톡, 텔레, 코인)"
                    value={newKeywordInput}
                    onChange={(e) => setNewKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddKeyword()
                      }
                    }}
                    className="h-8 text-xs"
                  />
                  <Button size="sm" onClick={handleAddKeyword} className="h-8 flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    추가
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 카드 3: 안전팀 인수인계 메모 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  안전팀 인수인계 & 운영 메모
                </CardTitle>
                <CardDescription className="text-xs">
                  교대 근무자 및 신입 운영자가 숙지해야 할 오늘의 공지사항을 기록합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={safetyMemo}
                  onChange={(e) => setSafetyMemo(e.target.value)}
                  rows={3}
                  placeholder="예: 금일 20시 이후 카카오톡 ID 유도 의심 대화가 증가할 수 있으니 모니터링 강화 바랍니다."
                  className="text-xs"
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => void handleSaveMemo()} className="h-8">
                    메모 저장
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
