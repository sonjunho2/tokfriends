'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import {
  blockReportedUser,
  deleteReportedPost,
  getAdminReports,
  sanctionReportedUser,
  updateAdminReportStatus,
  type ReportItem,
  type ReportStatus,
} from '@/lib/api'
import type { AxiosError } from 'axios'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'PENDING', label: '대기 중' },
  { value: 'REVIEWING', label: '검토 중' },
  { value: 'RESOLVED', label: '처리 완료' },
  { value: 'REJECTED', label: '기각' },
]

const STATUS_STYLE: Record<ReportStatus, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', label: '대기 중' },
  REVIEWING: { bg: 'bg-blue-100', text: 'text-blue-700', label: '검토 중' },
  RESOLVED: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '처리 완료' },
  REJECTED: { bg: 'bg-slate-100', text: 'text-slate-600', label: '기각' },
}

const PAGE_SIZE = 20

export default function ReportsSafetyPage() {
  const { toast } = useToast()

  const [reports, setReports] = useState<ReportItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
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

  const loadReports = useCallback(
    async (p: number, status: string) => {
      setIsLoading(true)
      try {
        const res = await getAdminReports({
          status: status || undefined,
          page: p,
          limit: PAGE_SIZE,
        })
        setReports(res.items)
        setTotal(res.total)
        setTotalPages(res.totalPages)
      } catch (error) {
        const ax = error as AxiosError | undefined
        const msg =
          (ax?.response?.data as any)?.message ||
          ax?.message ||
          '신고 목록을 불러오지 못했습니다.'
        toast({ title: '로드 실패', description: String(msg), variant: 'destructive' })
        setReports([])
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    void loadReports(page, statusFilter)
  }, [loadReports, page, statusFilter])

  const handleStatusChange = (filter: string) => {
    setStatusFilter(filter)
    setPage(1)
  }

  const handleUpdateStatus = async (
    report: ReportItem,
    status: Exclude<ReportStatus, 'PENDING'>,
  ) => {
    setActioningId(report.id)
    try {
      const updated = await updateAdminReportStatus(report.id, status)
      setReports((prev) => prev.map((r) => (r.id === report.id ? updated : r)))
      toast({
        title: '상태 변경 완료',
        description: `신고 #${report.id} — ${STATUS_STYLE[status].label}로 변경되었습니다.`,
      })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const msg =
        (ax?.response?.data as any)?.message ||
        ax?.message ||
        '상태 변경에 실패했습니다.'
      toast({ title: '실패', description: String(msg), variant: 'destructive' })
    } finally {
      setActioningId(null)
    }
  }

  const handleBlockConfirm = async () => {
    if (!confirmBlock) return
    setActioningId(confirmBlock.id)
    const reportId = confirmBlock.id
    setConfirmBlock(null)
    try {
      await blockReportedUser(reportId, blockReason.trim() || undefined)
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status: 'RESOLVED' as ReportStatus } : r,
        ),
      )
      toast({
        title: '유저 차단 완료',
        description: `신고 #${reportId} 피신고자가 차단 처리되었습니다.`,
      })
      setBlockReason('')
    } catch (error) {
      const ax = error as AxiosError | undefined
      const msg =
        (ax?.response?.data as any)?.message || ax?.message || '차단에 실패했습니다.'
      toast({ title: '실패', description: String(msg), variant: 'destructive' })
    } finally {
      setActioningId(null)
    }
  }

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
                status: 'RESOLVED' as ReportStatus,
                reported: r.reported
                  ? {
                      ...r.reported,
                      status:
                        action === 'WARNING'
                          ? r.reported.status
                          : action === 'PERMANENT_BAN'
                          ? 'banned'
                          : 'suspended',
                    }
                  : null,
              }
            : r,
        ),
      )
      const actionLabels = {
        WARNING: '경고 조치 (신뢰도 차감)',
        SUSPEND_7D: '7일 이용 정지 및 강제 로그아웃',
        SUSPEND_30D: '30일 이용 정지 및 강제 로그아웃',
        PERMANENT_BAN: '영구 차단 및 제명',
      }
      toast({
        title: '제재 처리 완료',
        description: `피신고자에게 [${actionLabels[action]}]가 즉시 적용되었습니다.`,
      })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const msg =
        (ax?.response?.data as any)?.message || ax?.message || '제재 처리에 실패했습니다.'
      toast({ title: '제재 실패', description: String(msg), variant: 'destructive' })
    } finally {
      setActioningId(null)
    }
  }

  const handleDeletePostSubmit = async () => {
    if (!confirmDeletePost) return
    const reportId = confirmDeletePost.id
    setActioningId(reportId)
    setConfirmDeletePost(null)
    try {
      await deleteReportedPost(reportId)
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: 'RESOLVED' as ReportStatus, post: null }
            : r,
        ),
      )
      toast({
        title: '유해 게시글 삭제 완료',
        description: `신고 #${reportId} 대상 게시글이 영구 삭제되었습니다.`,
      })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const msg =
        (ax?.response?.data as any)?.message ||
        ax?.message ||
        '게시글 삭제에 실패했습니다.'
      toast({ title: '삭제 실패', description: String(msg), variant: 'destructive' })
    } finally {
      setActioningId(null)
    }
  }

  const displayReports = search.trim()
    ? reports.filter((r) => {
        const q = search.toLowerCase()
        return (
          String(r.id).includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.reporter?.displayName?.toLowerCase().includes(q) ||
          r.reporter?.email?.toLowerCase().includes(q) ||
          r.reported?.displayName?.toLowerCase().includes(q) ||
          r.reported?.email?.toLowerCase().includes(q) ||
          r.post?.content?.toLowerCase().includes(q)
        )
      })
    : reports

  const pendingCount = reports.filter((r) => r.status === 'PENDING').length

  return (
    <div className="space-y-6">
      {/* 요약 통계 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">미처리 신고</p>
                <p className="text-2xl font-bold">{isLoading ? '—' : pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">전체 신고 건수</p>
                <p className="text-2xl font-bold">{isLoading ? '—' : total.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void loadReports(page, statusFilter)}
          disabled={isLoading}
          className="self-end h-9"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          <span className="ml-1">새로고침</span>
        </Button>
      </div>

      {/* 신고 목록 */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              신고 및 안전 센터 (Safety Center)
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              신고된 게시글과 피신고자를 실시간 검토하고 원클릭 제재/삭제 처리를 진행하세요.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              className="w-full sm:w-[220px]"
              placeholder="ID, 사유, 유저, 내용 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : displayReports.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              신고 내역이 없습니다.
            </p>
          ) : (
            displayReports.map((report) => {
              const st = STATUS_STYLE[report.status] ?? STATUS_STYLE.PENDING
              const isActioning = actioningId === report.id
              const isReportedActive =
                report.reported?.status === 'active' || !report.reported?.status

              return (
                <div key={report.id} className="rounded-lg border p-4 space-y-3 bg-card shadow-sm">
                  {/* 헤더 */}
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-muted-foreground">
                        신고 #{report.id}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${st.bg} ${st.text}`}
                      >
                        {st.label}
                      </span>
                      {report.post && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700">
                          피드 게시글 신고
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(report.createdAt).toLocaleString('ko-KR')}
                    </span>
                  </div>

                  {/* 신고 사유 */}
                  <div className="bg-muted/40 p-2.5 rounded-md border text-sm">
                    <span className="font-semibold text-destructive mr-1.5">[신고 사유]</span>
                    <span className="font-medium text-foreground">{report.reason}</span>
                  </div>

                  {/* 신고된 게시글 내용 (존재 시) */}
                  {report.post && (
                    <div className="rounded-md border border-purple-200 bg-purple-50/50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-900 flex items-center gap-1">
                          <ImageIcon className="h-3.5 w-3.5" />
                          신고된 게시글 내용
                        </span>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs px-2"
                          disabled={isActioning}
                          onClick={() => setConfirmDeletePost(report)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          게시글 강제 삭제
                        </Button>
                      </div>
                      <p className="text-sm text-foreground bg-white/80 p-2.5 rounded border border-purple-100">
                        {report.post.content || '(사진 첨부 게시물)'}
                      </p>
                      {Array.isArray(report.post.mediaUrls) &&
                        report.post.mediaUrls.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {report.post.mediaUrls.map((url, idx) => (
                              <a
                                key={`post-img-${idx}`}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="block relative rounded border overflow-hidden hover:opacity-80 transition"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={url}
                                  alt="첨부 사진"
                                  className="h-16 w-16 object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        )}
                    </div>
                  )}

                  {/* 신고자 / 피신고자 메타 */}
                  <div className="grid gap-2 sm:grid-cols-2 text-xs bg-muted/20 p-2.5 rounded-md">
                    <div>
                      <span className="font-semibold text-muted-foreground">신고자: </span>
                      <span className="font-medium text-foreground">
                        {report.reporter
                          ? `${report.reporter.displayName ?? report.reporter.nickname ?? '—'} (${report.reporter.email ?? report.reporter.id})`
                          : '알 수 없음'}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-muted-foreground">피신고자: </span>
                      {report.reported ? (
                        <span className="font-medium text-foreground">
                          {report.reported.displayName ?? report.reported.nickname ?? '—'}{' '}
                          ({report.reported.email ?? report.reported.id})
                          <span
                            className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isReportedActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isReportedActive ? '정상' : report.reported.status}
                          </span>
                          {typeof report.reported.trustScore === 'number' && (
                            <span className="ml-1 text-muted-foreground font-normal">
                              (신뢰도: {report.reported.trustScore}점)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">없음</span>
                      )}
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {report.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isActioning}
                        onClick={() => void handleUpdateStatus(report, 'REVIEWING')}
                      >
                        {isActioning && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        검토 시작
                      </Button>
                    )}

                    {(report.status === 'PENDING' || report.status === 'REVIEWING') && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          disabled={isActioning}
                          onClick={() => void handleUpdateStatus(report, 'RESOLVED')}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          처리 완료
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isActioning}
                          onClick={() => void handleUpdateStatus(report, 'REJECTED')}
                        >
                          기각
                        </Button>

                        {report.reported && (
                          <>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="bg-amber-600 hover:bg-amber-700 text-white"
                              disabled={isActioning}
                              onClick={() => {
                                setConfirmSanction({
                                  report,
                                  action: 'WARNING',
                                  reason: report.reason,
                                })
                              }}
                            >
                              <UserX className="mr-1 h-3.5 w-3.5" />
                              유저 제재하기
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isActioning}
                              onClick={() => {
                                setConfirmBlock(report)
                                setBlockReason('')
                              }}
                            >
                              <ShieldOff className="mr-1 h-3.5 w-3.5" />
                              피신고자 차단
                            </Button>
                          </>
                        )}
                      </>
                    )}

                    {(report.status === 'RESOLVED' || report.status === 'REJECTED') && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        처리가 완료된 신고입니다.
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                {total.toLocaleString()}건 중 {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, total)}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => p - 1)}
                >
                  이전
                </Button>
                <span className="px-2 text-sm self-center">
                  {page} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 유저 제재 다이얼로그 */}
      {confirmSanction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 border-b pb-3">
              <UserX className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-bold">피신고자 제재 조치 적용</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              신고 대상자{' '}
              <strong className="text-foreground">
                {confirmSanction.report.reported?.displayName ??
                  confirmSanction.report.reported?.nickname ??
                  confirmSanction.report.reported?.id}
              </strong>
              에게 적용할 제재 수위를 선택하세요.
            </p>

            <div className="space-y-3">
              <label className="text-xs font-bold text-foreground">제재 수위 선택</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  {
                    action: 'WARNING' as const,
                    title: '⚠️ 경고 조치',
                    desc: '신뢰도 -5점 및 주의',
                    border: 'border-amber-300',
                  },
                  {
                    action: 'SUSPEND_7D' as const,
                    title: '⏱️ 7일 이용 정지',
                    desc: '세션 즉시 만료 및 차단',
                    border: 'border-orange-300',
                  },
                  {
                    action: 'SUSPEND_30D' as const,
                    title: '🛑 30일 이용 정지',
                    desc: '세션 즉시 만료 및 차단',
                    border: 'border-red-300',
                  },
                  {
                    action: 'PERMANENT_BAN' as const,
                    title: '🚫 영구 제명 (Ban)',
                    desc: '영구 차단 및 계정 박탈',
                    border: 'border-rose-500',
                  },
                ].map((item) => (
                  <button
                    key={item.action}
                    type="button"
                    onClick={() =>
                      setConfirmSanction({ ...confirmSanction, action: item.action })
                    }
                    className={`rounded-lg border p-3 text-left transition ${
                      confirmSanction.action === item.action
                        ? `bg-primary/5 ${item.border} border-2 ring-1 ring-primary`
                        : 'border-border hover:bg-muted/40'
                    }`}
                  >
                    <p className="text-sm font-bold">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">제재 사유 및 메모</label>
              <Input
                value={confirmSanction.reason}
                onChange={(e) =>
                  setConfirmSanction({ ...confirmSanction, reason: e.target.value })
                }
                placeholder="예: 반복적인 유해 게시물 및 비매너 행위"
              />
              <p className="text-[11px] text-muted-foreground">
                * 정지 및 영구 제명 시 대상자의 모든 활성 기기 세션이 즉시 만료(강제 로그아웃)됩니다.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setConfirmSanction(null)}>
                취소
              </Button>
              <Button
                variant="destructive"
                className="bg-amber-600 hover:bg-amber-700"
                onClick={() => void handleSanctionSubmit()}
              >
                제재 적용하기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 게시글 삭제 확인 다이얼로그 */}
      {confirmDeletePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 border-b pb-3">
              <Trash2 className="h-5 w-5 text-destructive" />
              <h2 className="text-lg font-bold">유해 게시글 강제 삭제</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              신고 #{confirmDeletePost.id} 대상 게시글을 영구 삭제하시겠습니까?
            </p>
            {confirmDeletePost.post && (
              <div className="p-3 bg-muted rounded border text-sm text-foreground">
                {confirmDeletePost.post.content}
              </div>
            )}
            <p className="text-xs text-destructive">
              * 삭제된 게시글과 연관된 댓글, 좋아요는 즉시 영구 삭제되며 복구할 수 없습니다.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setConfirmDeletePost(null)}>
                취소
              </Button>
              <Button variant="destructive" onClick={() => void handleDeletePostSubmit()}>
                영구 삭제
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 단순 피신고자 차단 확인 다이얼로그 */}
      {confirmBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-destructive" />
              피신고자 차단 확인
            </h2>
            <p className="text-sm text-muted-foreground">
              신고 #{confirmBlock.id}의 피신고자{' '}
              <strong>
                {confirmBlock.reported?.displayName ??
                  confirmBlock.reported?.nickname ??
                  confirmBlock.reported?.email ??
                  confirmBlock.reported?.id}
              </strong>
              를 차단하고 신고를 처리 완료로 표시합니다.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">차단 사유 (선택)</label>
              <Input
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="예: 신고 접수 건에 따른 차단 조치"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setConfirmBlock(null)}>
                취소
              </Button>
              <Button variant="destructive" onClick={() => void handleBlockConfirm()}>
                차단 확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
