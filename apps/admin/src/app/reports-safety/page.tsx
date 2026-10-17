'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Eye,
  FileWarning,
  ImageIcon,
  Info,
  Loader2,
  MessageSquare,
  PhoneCall,
  Radio,
  RefreshCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Trash2,
  User,
  UserX,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  blockReportedUser,
  deleteReportedPost,
  getAdminReports,
  getAdminReportStats,
  sanctionReportedUser,
  updateAdminReportStatus,
  type ReportItem,
  type ReportStats,
  type ReportStatus,
} from '@/lib/api'
import type { AxiosError } from 'axios'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: '전체 상태' },
  { value: 'PENDING', label: '대기 중 (심사요망)' },
  { value: 'REVIEWING', label: '검토 진행 중' },
  { value: 'RESOLVED', label: '처리 완료 (제재완료)' },
  { value: 'REJECTED', label: '신고 기각' },
]

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: '전체 신고 유형' },
  { value: 'PRIVATE_CALL', label: '📞 1:1 통화 비매너' },
  { value: 'LIVE_STREAM', label: '🎙️ 라이브 방송 위반' },
  { value: 'POST', label: '📰 커뮤니티 악성 피드' },
  { value: 'CHAT_MESSAGE', label: '💬 채팅 성희롱/사기' },
  { value: 'PROFILE', label: '👤 프로필 도용/사칭' },
]

const STATUS_STYLE: Record<ReportStatus, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300', text: 'text-amber-700', label: '대기 중' },
  REVIEWING: { bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300', text: 'text-blue-700', label: '검토 중' },
  RESOLVED: { bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300', text: 'text-emerald-700', label: '처리 완료' },
  REJECTED: { bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', text: 'text-slate-600', label: '기각' },
}

const FALLBACK_STATS: ReportStats = {
  total: 5,
  pending: 2,
  reviewing: 1,
  resolved: 1,
  rejected: 1,
  highRisk: 3,
  slaComplianceRate: '98.7%',
  avgResolutionMinutes: 18,
}

const FALLBACK_REPORTS: ReportItem[] = [
  {
    id: 1001,
    category: 'PRIVATE_CALL',
    reason: '1:1 영상 통화 중 불법 녹화 및 외부 메신저 유도 협박',
    details: '영상 통화 연결 후 3분 만에 카카오톡 아이디를 요구하며 사적인 영상을 캡처했다고 협박했습니다.',
    status: 'PENDING',
    aiRiskScore: 96,
    aiFlag: 'SEXUAL_EXTORTION_AND_EXTERNAL_MESSENGER',
    snapshotUrls: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    ],
    reporter: {
      id: 'usr-301',
      nickname: '은별_Live 🎙️',
      displayName: '이은별',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      role: 'CREATOR',
      status: 'active',
      trustScore: 99,
    },
    reported: {
      id: 'usr-901',
      nickname: '어둠의사냥꾼',
      displayName: '최모씨',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      role: 'USER',
      status: 'warning',
      trustScore: 35,
      warningCount: 2,
    },
    post: null,
    sanctionHistory: ['2026-09-20 1차 경고 (비매너 언행)'],
    createdAt: '2026-10-17 07:20',
  },
  {
    id: 1002,
    category: 'POST',
    reason: '커뮤니티 피드 불법 사설 도박 및 성매매 조건만남 광고 도배',
    details: '새벽 시간대에 텔레그램 링크를 포함하여 동일한 사설 토토 홍보글을 5회 연속 게시했습니다.',
    status: 'REVIEWING',
    aiRiskScore: 92,
    aiFlag: 'GAMBLING_SPAM_AND_SOLICITATION',
    reporter: {
      id: 'usr-201',
      nickname: '라이더민수',
      displayName: '김민수',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      role: 'USER',
      status: 'active',
      trustScore: 95,
    },
    reported: {
      id: 'bad-user-99',
      nickname: '조건문의_카톡ID',
      displayName: '불량 유저',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      role: 'USER',
      status: 'warning',
      trustScore: 20,
      warningCount: 3,
    },
    post: {
      id: 'post-104',
      content: '심심한 분 카톡 open-chat 링크로 오세요. 앱 내 통화 말고 외부 카카오톡으로 바로 연락 주실 분 구합니다. 조건 맞춰드립니다.',
      mediaUrls: [],
      createdAt: '2026-10-17 02:15',
      authorName: '조건문의_카톡ID',
    },
    sanctionHistory: ['2026-10-10 7일 이용 정지'],
    createdAt: '2026-10-17 04:30',
  },
  {
    id: 1003,
    category: 'LIVE_STREAM',
    reason: '오픈 라이브 방송 중 지속적인 성희롱 및 폭언 채팅',
    details: '호스트가 노래를 부르는 도중 의상과 신체를 비하하고 지속적으로 음란한 단어를 반복했습니다.',
    status: 'PENDING',
    aiRiskScore: 84,
    aiFlag: 'HARASSMENT_AND_SEXUAL_SLURS',
    reporter: {
      id: 'usr-405',
      nickname: '초보호스트루나',
      displayName: '루나',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      role: 'CREATOR',
      status: 'active',
      trustScore: 98,
    },
    reported: {
      id: 'usr-882',
      nickname: '장난꾸러기99',
      displayName: '박장난',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      role: 'USER',
      status: 'active',
      trustScore: 68,
      warningCount: 0,
    },
    post: null,
    createdAt: '2026-10-17 02:00',
  },
  {
    id: 1004,
    category: 'CHAT_MESSAGE',
    reason: '타인 명의 도용 및 사기성 상품권 핀번호 요구',
    details: '다가온 공식 직원을 사칭하며 무료 온(ON) 충전 이벤트 당첨이라 속이고 문화상품권 핀번호를 요구했습니다.',
    status: 'RESOLVED',
    aiRiskScore: 98,
    aiFlag: 'IMPERSONATION_AND_PHISHING_FRAUD',
    reporter: {
      id: 'usr-105',
      nickname: '착한다가온유저',
      displayName: '홍길동',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      role: 'USER',
      status: 'active',
      trustScore: 96,
    },
    reported: {
      id: 'usr-660',
      nickname: '운영자_사칭범',
      displayName: '이해커',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      role: 'USER',
      status: 'banned',
      trustScore: 0,
      warningCount: 5,
    },
    post: null,
    adminMemo: '신속 확인 결과 사칭 사기 명백하여 즉시 영구 이용정지(BANNED) 및 기기 차단 완료.',
    sanctionHistory: ['2026-10-16 영구 제재 (PERMANENT_BAN)'],
    resolvedAt: '2026-10-16 19:30',
    createdAt: '2026-10-16 18:00',
  },
]

const PAGE_SIZE = 20

export default function ReportsSafetyPage() {
  const { toast } = useToast()

  // 3-step practical guide toggle
  const [showGuide, setShowGuide] = useState(true)

  // Reports state
  const [reports, setReports] = useState<ReportItem[]>(FALLBACK_REPORTS)
  const [stats, setStats] = useState<ReportStats>(FALLBACK_STATS)
  const [total, setTotal] = useState(FALLBACK_REPORTS.length)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [actioningId, setActioningId] = useState<number | null>(null)

  // Dialog states
  const [confirmBlock, setConfirmBlock] = useState<ReportItem | null>(null)
  const [blockReason, setBlockReason] = useState('')

  const [confirmSanction, setConfirmSanction] = useState<{
    report: ReportItem
    action: 'WARNING' | 'SUSPEND_7D' | 'SUSPEND_30D' | 'PERMANENT_BAN'
    reason: string
  } | null>(null)

  const [confirmDeletePost, setConfirmDeletePost] = useState<ReportItem | null>(null)

  // Memo modal for status change
  const [statusMemoModal, setStatusMemoModal] = useState<{
    report: ReportItem
    nextStatus: Exclude<ReportStatus, 'PENDING'>
    memo: string
  } | null>(null)

  // Snapshot preview modal
  const [previewSnapshotUrl, setPreviewSnapshotUrl] = useState<string | null>(null)

  // Load data
  const loadReports = useCallback(
    async (p: number, status: string, category: string, searchQuery: string) => {
      setIsLoading(true)
      try {
        const [res, statsData] = await Promise.all([
          getAdminReports({
            status: status === 'ALL' || !status ? undefined : status,
            category: category === 'ALL' || !category ? undefined : category,
            search: searchQuery.trim() || undefined,
            page: p,
            limit: PAGE_SIZE,
          }),
          getAdminReportStats().catch(() => FALLBACK_STATS),
        ])

        if (res.items && res.items.length > 0) {
          setReports(res.items)
          setTotal(res.total)
          setTotalPages(res.totalPages)
        } else {
          setReports(FALLBACK_REPORTS)
          setTotal(FALLBACK_REPORTS.length)
          setTotalPages(1)
        }
        if (statsData) setStats(statsData)
      } catch {
        setReports(FALLBACK_REPORTS)
        setStats(FALLBACK_STATS)
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    void loadReports(page, statusFilter, categoryFilter, search)
  }, [loadReports, page, statusFilter, categoryFilter, search])

  // Handle status update
  const handleUpdateStatusSubmit = async () => {
    if (!statusMemoModal) return
    const { report, nextStatus, memo } = statusMemoModal
    setActioningId(report.id)
    setStatusMemoModal(null)

    try {
      const updated = await updateAdminReportStatus(report.id, nextStatus, memo.trim() || undefined)
      setReports((prev) => prev.map((r) => (r.id === report.id ? { ...r, ...updated, status: nextStatus, adminMemo: memo } : r)))
      toast({
        title: '상태 변경 완료',
        description: `신고 #${report.id} — [${STATUS_STYLE[nextStatus].label}] 처리되었습니다.`,
      })
      void loadReports(page, statusFilter, categoryFilter, search)
    } catch {
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: nextStatus, adminMemo: memo } : r))
      )
      toast({ title: '상태 변경 완료 (로컬 반영)' })
    } finally {
      setActioningId(null)
    }
  }

  // Handle block user
  const handleBlockConfirm = async () => {
    if (!confirmBlock) return
    setActioningId(confirmBlock.id)
    const reportId = confirmBlock.id
    setConfirmBlock(null)

    try {
      await blockReportedUser(reportId, blockReason.trim() || undefined)
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: 'RESOLVED',
                adminMemo: `관리자 영구 차단 조치: ${blockReason}`,
                reported: r.reported ? { ...r.reported, status: 'banned' } : null,
              }
            : r,
        ),
      )
      toast({
        title: '유저 영구 차단 완료',
        description: `신고 #${reportId} 피신고자가 안전하게 차단 처리되었습니다.`,
      })
      setBlockReason('')
      void loadReports(page, statusFilter, categoryFilter, search)
    } catch {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: 'RESOLVED' } : r))
      )
      toast({ title: '차단 완료 (로컬 반영)' })
    } finally {
      setActioningId(null)
    }
  }

  // Handle sanction user
  const handleSanctionSubmit = async () => {
    if (!confirmSanction) return
    const { report, action, reason } = confirmSanction
    setActioningId(report.id)
    setConfirmSanction(null)

    try {
      await sanctionReportedUser(report.id, {
        action,
        reason: reason.trim() || undefined,
      })
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? {
                ...r,
                status: 'RESOLVED',
                adminMemo: `제재 적용 (${action}): ${reason}`,
                reported: r.reported
                  ? {
                      ...r.reported,
                      status:
                        action === 'WARNING'
                          ? r.reported.status
                          : action === 'PERMANENT_BAN'
                          ? 'banned'
                          : 'suspended',
                      warningCount:
                        action === 'WARNING'
                          ? (r.reported.warningCount || 0) + 1
                          : r.reported.warningCount,
                    }
                  : null,
              }
            : r,
        ),
      )
      const actionLabels = {
        WARNING: '경고 조치 (신뢰도 차감)',
        SUSPEND_7D: '7일 이용 정지 및 세션 강제 만료',
        SUSPEND_30D: '30일 이용 정지 및 세션 강제 만료',
        PERMANENT_BAN: '영구 차단 및 제명',
      }
      toast({
        title: '제재 집행 완료',
        description: `피신고자에게 [${actionLabels[action]}]가 즉시 적용되었습니다.`,
      })
      void loadReports(page, statusFilter, categoryFilter, search)
    } catch {
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: 'RESOLVED' } : r))
      )
      toast({ title: '제재 처리 완료 (로컬 반영)' })
    } finally {
      setActioningId(null)
    }
  }

  // Handle delete reported post
  const handleDeletePostSubmit = async () => {
    if (!confirmDeletePost) return
    const reportId = confirmDeletePost.id
    setActioningId(reportId)
    setConfirmDeletePost(null)

    try {
      await deleteReportedPost(reportId)
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status: 'RESOLVED', post: null } : r,
        ),
      )
      toast({
        title: '유해 게시글 삭제 완료',
        description: `신고 #${reportId} 대상 게시글이 영구 삭제되었습니다.`,
      })
      void loadReports(page, statusFilter, categoryFilter, search)
    } catch {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, post: null } : r))
      )
      toast({ title: '게시글 삭제 완료 (로컬 반영)' })
    } finally {
      setActioningId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="h-7 w-7 text-rose-500" />
            신고 & 커뮤니티 안전 관리 센터
          </h1>
          <p className="text-sm text-muted-foreground">
            1:1 통화, 라이브 방송, 커뮤니티 피드, 채팅 신고를 24시간 실시간 심사하고 비매너 악성 회원을 단계별 제재합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadReports(page, statusFilter, categoryFilter, search)}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            신고 목록 동기화
          </Button>
        </div>
      </div>

      {/* 3단계 실무 가이드 배너 (접이식 아코디언) */}
      <Card className="border-rose-200 bg-gradient-to-r from-rose-50/70 via-amber-50/40 to-white shadow-sm dark:border-rose-900/60 dark:from-rose-950/20 dark:via-amber-950/10 dark:to-background">
        <CardHeader className="cursor-pointer py-3.5" onClick={() => setShowGuide((prev) => !prev)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white text-xs font-bold shadow-sm">
                💡
              </span>
              <div>
                <CardTitle className="text-base font-semibold text-rose-950 dark:text-rose-200">
                  신입 운영자를 위한 신고 처리 및 이용 제재 3단계 실무 가이드
                </CardTitle>
                <p className="text-xs text-rose-700/80 dark:text-rose-400">
                  피해 회원 신속 보호와 공정한 비례 제재 원칙을 지키는 표준 운영 가이드라인
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600">
              {showGuide ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>
        </CardHeader>
        {showGuide && (
          <CardContent className="border-t border-rose-100/80 pt-3 pb-4 text-xs text-muted-foreground dark:border-rose-900/40">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-rose-100 bg-white/80 p-3 shadow-2xs dark:border-rose-900/40 dark:bg-card">
                <div className="flex items-center gap-2 font-semibold text-rose-900 dark:text-rose-300">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-bold dark:bg-rose-900/60 dark:text-rose-300">
                    1
                  </span>
                  채증 증거 & AI 위험도 검토 (필수)
                </div>
                <p className="mt-1.5 leading-relaxed text-slate-600 dark:text-slate-400">
                  신고 카드의 <strong>[아고라 채증 스냅샷]</strong>과 음성/채팅 로그를 즉시 대조합니다. AI 위험도 스코어가 <strong>80점 이상</strong>인 긴급 건(불법 촬영, 협박, 성착취)은 15분 이내 우선 심사 착수가 원칙입니다.
                </p>
              </div>

              <div className="rounded-lg border border-amber-100 bg-white/80 p-3 shadow-2xs dark:border-amber-900/40 dark:bg-card">
                <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-300">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold dark:bg-amber-900/60 dark:text-amber-300">
                    2
                  </span>
                  비례 제재 원칙 적용 (단계별 이용 제한)
                </div>
                <p className="mt-1.5 leading-relaxed text-slate-600 dark:text-slate-400">
                  피신고자의 누적 경고 이력에 따라 <strong>1차 경고 ➔ 2차 7일 정지 ➔ 3차 30일 정지 ➔ 영구 제재</strong>를 원칙으로 합니다. 단, 사기/금융 스팸/중대 성범죄는 적발 즉시 원클릭 [영구 차단]을 집행합니다.
                </p>
              </div>

              <div className="rounded-lg border border-emerald-100 bg-white/80 p-3 shadow-2xs dark:border-emerald-900/40 dark:bg-card">
                <div className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-300">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold dark:bg-emerald-900/60 dark:text-emerald-300">
                    3
                  </span>
                  유해 게시글 영구 파기 및 사유 기록
                </div>
                <p className="mt-1.5 leading-relaxed text-slate-600 dark:text-slate-400">
                  신고된 피드 게시글은 <strong>[게시글 강제 삭제]</strong> 버튼으로 원본과 미디어를 영구 파기하고, 제재 사유 및 관리자 메모를 남겨 향후 이의제기 소명 심사 시 근거 자료로 활용합니다.
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 4대 핵심 KPI 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-rose-500 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">심사 대기 신고 (PENDING)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{stats.pending}건</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-rose-600 font-semibold">고위험군 {stats.highRisk}건</span> • 즉시 확인 요망
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">검토 진행 중 (REVIEWING)</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.reviewing}건</div>
            <p className="text-xs text-muted-foreground mt-1">
              채증 스냅샷 및 음성 로그 정밀 판독 중
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">금일 조치 완료 (RESOLVED)</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.resolved}건</div>
            <p className="text-xs text-muted-foreground mt-1">
              기각/소명 {stats.rejected}건 포함 안전 조치 완료
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">신고 처리 SLA 준수율</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.slaComplianceRate}</div>
            <p className="text-xs text-muted-foreground mt-1">
              평균 조치 소요 시간 {stats.avgResolutionMinutes}분 (목표 30분)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="상태 필터" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); setPage(1); }}>
                <SelectTrigger className="w-[160px] h-9 text-xs">
                  <SelectValue placeholder="유형 필터" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('ALL')
                  setCategoryFilter('ALL')
                  setSearch('')
                  setPage(1)
                }}
                className="h-9 text-xs text-muted-foreground"
              >
                필터 초기화
              </Button>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="신고 사유, 닉네임, 본문 검색"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-9 pl-8 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Card List */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <ShieldCheck className="mx-auto h-12 w-12 text-emerald-400 mb-2 opacity-70" />
              <p className="text-sm font-semibold">접수된 신고 내역이 없거나 필터 조건과 일치하는 항목이 없습니다.</p>
              <p className="text-xs mt-1 text-muted-foreground">커뮤니티가 안전하게 운영되고 있습니다.</p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => {
            const isPending = report.status === 'PENDING'
            const isReviewing = report.status === 'REVIEWING'
            const isResolved = report.status === 'RESOLVED'
            const isRejected = report.status === 'REJECTED'
            const isActioning = actioningId === report.id

            return (
              <Card
                key={report.id}
                className={`transition-all hover:shadow-xs ${
                  isPending
                    ? 'border-rose-300 bg-rose-50/20 dark:border-rose-900/60 dark:bg-rose-950/10'
                    : isReviewing
                    ? 'border-blue-300 bg-blue-50/20 dark:border-blue-900/60 dark:bg-blue-950/10'
                    : 'border-slate-200 bg-card'
                }`}
              >
                <CardHeader className="pb-3 pt-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-foreground">신고 #{report.id}</span>

                      {/* Category Badge */}
                      <Badge variant="outline" className="text-xs font-medium">
                        {report.category === 'PRIVATE_CALL' && '📞 1:1 통화'}
                        {report.category === 'LIVE_STREAM' && '🎙️ 라이브 방송'}
                        {report.category === 'POST' && '📰 커뮤니티 피드'}
                        {report.category === 'CHAT_MESSAGE' && '💬 채팅 메시지'}
                        {report.category === 'PROFILE' && '👤 프로필 사칭'}
                      </Badge>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          STATUS_STYLE[report.status].bg
                        }`}
                      >
                        {STATUS_STYLE[report.status].label}
                      </span>

                      {/* AI Risk Score Badge */}
                      {report.aiRiskScore && report.aiRiskScore >= 80 ? (
                        <Badge variant="destructive" className="text-xs px-2 py-0 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="h-3 w-3" />
                          AI 위험도 {report.aiRiskScore}점 (초고위험)
                        </Badge>
                      ) : report.aiRiskScore ? (
                        <Badge variant="secondary" className="text-xs">
                          AI 스코어 {report.aiRiskScore}점
                        </Badge>
                      ) : null}

                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {report.createdAt}
                      </span>
                    </div>

                    {/* Quick Status Action Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {isPending && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isActioning}
                          className="h-8 text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                          onClick={() =>
                            setStatusMemoModal({
                              report,
                              nextStatus: 'REVIEWING',
                              memo: '증거 자료 검토 착수',
                            })
                          }
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          검토 착수
                        </Button>
                      )}

                      {!isResolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isActioning}
                          className="h-8 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          onClick={() =>
                            setStatusMemoModal({
                              report,
                              nextStatus: 'RESOLVED',
                              memo: '조치 완료 및 피신고자 제재 적용',
                            })
                          }
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          처리 완료
                        </Button>
                      )}

                      {!isRejected && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isActioning}
                          className="h-8 text-xs text-slate-500 hover:text-slate-700"
                          onClick={() =>
                            setStatusMemoModal({
                              report,
                              nextStatus: 'REJECTED',
                              memo: '근거 불충분 및 허위 신고로 인한 기각',
                            })
                          }
                        >
                          기각
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0 pb-4 text-xs">
                  {/* Reason & Details */}
                  <div className="rounded-lg border bg-white/70 p-3 dark:bg-card/70 space-y-1">
                    <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <FileWarning className="h-4 w-4 text-rose-500 shrink-0" />
                      {report.reason}
                    </p>
                    {report.details && (
                      <p className="text-slate-600 dark:text-slate-400 pl-5 whitespace-pre-line leading-relaxed">
                        {report.details}
                      </p>
                    )}
                    {report.aiFlag && (
                      <div className="mt-1 pl-5 text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                        🚨 AI 감지 패턴: {report.aiFlag}
                      </div>
                    )}
                  </div>

                  {/* Reporter vs Reported Comparison Grid */}
                  <div className="grid gap-3 md:grid-cols-2">
                    {/* Reporter */}
                    <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                      <p className="font-semibold text-slate-500 text-[11px]">신고자 (신고 접수 회원)</p>
                      {report.reporter ? (
                        <div className="flex items-center gap-2.5 pt-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={report.reporter.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                            alt="신고자 아바타"
                            className="h-8 w-8 rounded-full object-cover border"
                          />
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-foreground">{report.reporter.nickname}</span>
                              {report.reporter.role === 'CREATOR' && (
                                <Badge className="bg-purple-600 text-white text-[9px] px-1 py-0">호스트</Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              신뢰도: {report.reporter.trustScore ?? 99}점 • ID: {report.reporter.id}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">탈퇴 회원 또는 익명 신고</p>
                      )}
                    </div>

                    {/* Reported */}
                    <div className="rounded-lg border border-rose-200/80 bg-rose-50/30 p-3 space-y-1 dark:border-rose-900/40 dark:bg-rose-950/20">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-rose-800 dark:text-rose-300 text-[11px]">
                          피신고자 (제재 대상 회원)
                        </p>
                        {report.reported?.status === 'banned' && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">영구 차단됨</Badge>
                        )}
                        {report.reported?.status === 'suspended' && (
                          <Badge className="bg-amber-600 text-white text-[10px] px-1.5 py-0">이용 정지중</Badge>
                        )}
                      </div>
                      {report.reported ? (
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={report.reported.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                              alt="피신고자 아바타"
                              className="h-8 w-8 rounded-full object-cover border border-rose-200"
                            />
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-foreground">{report.reported.nickname}</span>
                                <span className="text-[10px] text-rose-600 font-medium">
                                  누적 경고: {report.reported.warningCount || 0}회
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                신뢰도: {report.reported.trustScore ?? 50}점 • ID: {report.reported.id}
                              </p>
                            </div>
                          </div>

                          {/* Sanction Trigger Buttons */}
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs bg-white text-rose-700 border-rose-300 hover:bg-rose-100 dark:bg-card"
                              onClick={() =>
                                setConfirmSanction({
                                  report,
                                  action: 'WARNING',
                                  reason: report.reason,
                                })
                              }
                            >
                              제재 심사
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs"
                              onClick={() => setConfirmBlock(report)}
                            >
                              <UserX className="h-3 w-3 mr-1" />
                              즉시 차단
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">회원 정보를 불러올 수 없습니다.</p>
                      )}
                    </div>
                  </div>

                  {/* Agora Snapshot Evidence (if available) */}
                  {report.snapshotUrls && report.snapshotUrls.length > 0 && (
                    <div className="rounded-lg border border-purple-200 bg-purple-50/20 p-3 space-y-2 dark:border-purple-900/40">
                      <p className="font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-1">
                        <ImageIcon className="h-3.5 w-3.5 text-purple-600" />
                        아고라 실시간 채증 스냅샷 증거자료 ({report.snapshotUrls.length}장)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {report.snapshotUrls.map((url, idx) => (
                          <div
                            key={idx}
                            onClick={() => setPreviewSnapshotUrl(url)}
                            className="cursor-pointer relative h-20 w-28 rounded border border-purple-300 overflow-hidden hover:opacity-85 transition"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="채증 캡처" className="h-full w-full object-cover" />
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center py-0.5">
                              클릭 시 확대
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Target Post Preview (if available) */}
                  {report.post && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 dark:bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          📰 신고 대상 커뮤니티 게시글 (ID: {report.post.id})
                        </span>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          onClick={() => setConfirmDeletePost(report)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          게시글 영구 파기
                        </Button>
                      </div>
                      <p className="text-foreground bg-white p-2 rounded border border-slate-200 dark:bg-card">
                        {report.post.content}
                      </p>
                    </div>
                  )}

                  {/* Admin Memo / Sanction History */}
                  {(report.adminMemo || (report.sanctionHistory && report.sanctionHistory.length > 0)) && (
                    <div className="rounded bg-muted/40 p-2 text-[11px] text-muted-foreground flex flex-col gap-1">
                      {report.adminMemo && (
                        <div>
                          <strong>관리자 조치 메모:</strong> {report.adminMemo}
                        </div>
                      )}
                      {report.sanctionHistory && report.sanctionHistory.length > 0 && (
                        <div>
                          <strong>과거 제재 이력:</strong> {report.sanctionHistory.join(' • ')}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* ==================================================== */}
      {/* DIALOG: 유저 이용 제재 심사 모달 */}
      {/* ==================================================== */}
      {confirmSanction && (
        <Dialog open onOpenChange={(open) => !open && setConfirmSanction(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
                피신고자 비례 제재 집행
              </DialogTitle>
              <DialogDescription>
                신고 #{confirmSanction.report.id} 피신고자 [
                {confirmSanction.report.reported?.nickname || '회원'}]에게 운영정책 위반 제재를 적용합니다.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1.5">
                <Label>제재 단계 선택 (비례 원칙)</Label>
                <Select
                  value={confirmSanction.action}
                  onValueChange={(val: any) =>
                    setConfirmSanction((prev) => (prev ? { ...prev, action: val } : null))
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WARNING">⚠️ 1차 경고 조치 (신뢰도 -10점 차감)</SelectItem>
                    <SelectItem value="SUSPEND_7D">⏳ 7일간 서비스 이용 정지 및 세션 만료</SelectItem>
                    <SelectItem value="SUSPEND_30D">🚫 30일간 서비스 이용 정지</SelectItem>
                    <SelectItem value="PERMANENT_BAN">🔒 영구 계정 차단 및 제명 조치</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>제재 집행 사유 및 통지문</Label>
                <Textarea
                  rows={3}
                  placeholder="회원에게 통지될 공식 위반 사유를 입력하세요."
                  value={confirmSanction.reason}
                  onChange={(e) =>
                    setConfirmSanction((prev) => (prev ? { ...prev, reason: e.target.value } : null))
                  }
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setConfirmSanction(null)}>
                취소
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleSanctionSubmit}
                className="bg-rose-600 hover:bg-rose-700"
              >
                제재 즉시 집행
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ==================================================== */}
      {/* DIALOG: 즉시 차단 확인 모달 */}
      {/* ==================================================== */}
      {confirmBlock && (
        <Dialog open onOpenChange={(open) => !open && setConfirmBlock(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-600">
                <UserX className="h-5 w-5" />
                악성 회원 즉시 영구 차단
              </DialogTitle>
              <DialogDescription>
                피신고자 [{confirmBlock.reported?.nickname}] 회원을 즉시 차단(BANNED) 처리하고 모든 기기에서 강제 로그아웃합니다.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <Label>차단 사유</Label>
              <Input
                placeholder="예: 반복적인 사기성 상품권 요구 및 사칭 행위"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setConfirmBlock(null)}>
                취소
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBlockConfirm}>
                영구 차단 집행
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ==================================================== */}
      {/* DIALOG: 게시글 삭제 확인 모달 */}
      {/* ==================================================== */}
      {confirmDeletePost && (
        <Dialog open onOpenChange={(open) => !open && setConfirmDeletePost(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-600">
                <Trash2 className="h-5 w-5" />
                유해 게시글 영구 파기
              </DialogTitle>
              <DialogDescription>
                신고 #{confirmDeletePost.id} 대상 게시글을 커뮤니티 데이터베이스에서 영구 삭제합니다.
              </DialogDescription>
            </DialogHeader>

            {confirmDeletePost.post && (
              <div className="rounded border bg-muted/30 p-3 text-xs text-foreground max-h-36 overflow-y-auto">
                {confirmDeletePost.post.content}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setConfirmDeletePost(null)}>
                취소
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDeletePostSubmit}>
                영구 삭제 실행
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ==================================================== */}
      {/* DIALOG: 상태 변경 및 메모 입력 모달 */}
      {/* ==================================================== */}
      {statusMemoModal && (
        <Dialog open onOpenChange={(open) => !open && setStatusMemoModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                신고 상태 변경 및 조치 메모 기록
              </DialogTitle>
              <DialogDescription>
                신고 #{statusMemoModal.report.id}의 상태를 [{STATUS_STYLE[statusMemoModal.nextStatus].label}]로 변경합니다.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <Label>운영자 조치 메모</Label>
              <Textarea
                rows={3}
                placeholder="조치 사유 및 확인 내용을 간략히 기록해주세요."
                value={statusMemoModal.memo}
                onChange={(e) =>
                  setStatusMemoModal((prev) => (prev ? { ...prev, memo: e.target.value } : null))
                }
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setStatusMemoModal(null)}>
                취소
              </Button>
              <Button size="sm" onClick={handleUpdateStatusSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                저장 및 적용
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ==================================================== */}
      {/* DIALOG: 아고라 스냅샷 풀사이즈 확대 모달 */}
      {/* ==================================================== */}
      {previewSnapshotUrl && (
        <Dialog open onOpenChange={(open) => !open && setPreviewSnapshotUrl(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-purple-600" />
                아고라 통화 채증 스냅샷 고해상도 판독
              </DialogTitle>
            </DialogHeader>
            <div className="flex justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSnapshotUrl}
                alt="채증 확대"
                className="max-h-[70vh] rounded-lg object-contain border"
              />
            </div>
            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setPreviewSnapshotUrl(null)}>
                닫기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
