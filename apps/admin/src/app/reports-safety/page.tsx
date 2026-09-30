'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Loader2, RefreshCcw, ShieldAlert, ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import {
  blockReportedUser,
  getAdminReports,
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
  PENDING:   { bg: 'bg-amber-100',  text: 'text-amber-700',  label: '대기 중' },
  REVIEWING: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: '검토 중' },
  RESOLVED:  { bg: 'bg-emerald-100',text: 'text-emerald-700',label: '처리 완료' },
  REJECTED:  { bg: 'bg-slate-100',  text: 'text-slate-600',  label: '기각' },
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
  const [confirmBlock, setConfirmBlock] = useState<ReportItem | null>(null)
  const [blockReason, setBlockReason] = useState('')

  const loadReports = useCallback(async (p: number, status: string) => {
    setIsLoading(true)
    try {
      const res = await getAdminReports({ status: status || undefined, page: p, limit: PAGE_SIZE })
      setReports(res.items)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } catch (error) {
      const ax = error as AxiosError | undefined
      const msg = (ax?.response?.data as any)?.message || ax?.message || '신고 목록을 불러오지 못했습니다.'
      toast({ title: '로드 실패', description: String(msg), variant: 'destructive' })
      setReports([])
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadReports(page, statusFilter)
  }, [loadReports, page, statusFilter])

  const handleStatusChange = (filter: string) => {
    setStatusFilter(filter)
    setPage(1)
  }

  const handleUpdateStatus = async (report: ReportItem, status: Exclude<ReportStatus, 'PENDING'>) => {
    setActioningId(report.id)
    try {
      const updated = await updateAdminReportStatus(report.id, status)
      setReports((prev) => prev.map((r) => (r.id === report.id ? updated : r)))
      toast({ title: '상태 변경', description: `신고 #${report.id} — ${STATUS_STYLE[status].label}로 변경됐습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const msg = (ax?.response?.data as any)?.message || ax?.message || '상태 변경에 실패했습니다.'
      toast({ title: '실패', description: String(msg), variant: 'destructive' })
    } finally {
      setActioningId(null)
    }
  }

  const handleBlockConfirm = async () => {
    if (!confirmBlock) return
    setActioningId(confirmBlock.id)
    setConfirmBlock(null)
    try {
      await blockReportedUser(confirmBlock.id, blockReason.trim() || undefined)
      setReports((prev) =>
        prev.map((r) => (r.id === confirmBlock.id ? { ...r, status: 'RESOLVED' as ReportStatus } : r)),
      )
      toast({ title: '유저 차단 완료', description: `신고 #${confirmBlock.id}의 피신고자가 차단되고 신고가 처리됐습니다.` })
      setBlockReason('')
    } catch (error) {
      const ax = error as AxiosError | undefined
      const msg = (ax?.response?.data as any)?.message || ax?.message || '차단에 실패했습니다.'
      toast({ title: '실패', description: String(msg), variant: 'destructive' })
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
          r.reported?.email?.toLowerCase().includes(q)
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
                <p className="text-xs text-muted-foreground">전체 신고 (이 페이지)</p>
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
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          <span className="ml-1">새로고침</span>
        </Button>
      </div>

      {/* 신고 목록 */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              신고 목록
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              신고를 검토하고 상태를 변경하거나 피신고자를 차단하세요.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              className="w-full sm:w-[200px]"
              placeholder="ID, 이유, 유저 검색..."
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
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : displayReports.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">신고 내역이 없습니다.</p>
          ) : (
            displayReports.map((report) => {
              const st = STATUS_STYLE[report.status] ?? STATUS_STYLE.PENDING
              const isActioning = actioningId === report.id
              return (
                <div key={report.id} className="rounded-md border p-4 space-y-3">
                  {/* 헤더 */}
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-muted-foreground">#{report.id}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(report.createdAt).toLocaleString('ko-KR')}
                    </span>
                  </div>

                  {/* 신고 내용 */}
                  <p className="text-sm font-medium">{report.reason}</p>

                  {/* 신고자 / 피신고자 */}
                  <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
                    <div>
                      <span className="font-semibold text-foreground">신고자: </span>
                      {report.reporter
                        ? `${report.reporter.displayName ?? '—'} (${report.reporter.email ?? report.reporter.id})`
                        : '알 수 없음'}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">피신고자: </span>
                      {report.reported
                        ? `${report.reported.displayName ?? '—'} (${report.reported.email ?? report.reported.id})`
                        : '없음'}
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex flex-wrap gap-2">
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
                          disabled={isActioning}
                          onClick={() => void handleUpdateStatus(report, 'RESOLVED')}
                        >
                          {isActioning && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                          처리 완료
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isActioning}
                          onClick={() => void handleUpdateStatus(report, 'REJECTED')}
                        >
                          {isActioning && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                          기각
                        </Button>
                        {report.reported && (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isActioning}
                            onClick={() => {
                              setConfirmBlock(report)
                              setBlockReason('')
                            }}
                          >
                            <ShieldOff className="mr-1 h-3 w-3" />
                            피신고자 차단
                          </Button>
                        )}
                      </>
                    )}
                    {(report.status === 'RESOLVED' || report.status === 'REJECTED') && (
                      <span className="text-xs text-muted-foreground self-center">처리가 완료된 신고입니다.</span>
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
                {total.toLocaleString()}건 중 {((page - 1) * PAGE_SIZE + 1)}–{Math.min(page * PAGE_SIZE, total)}
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

      {/* 차단 확인 다이얼로그 (인라인) */}
      {confirmBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-md rounded-lg border bg-background p-6 shadow-xl space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-destructive" />
              피신고자 차단 확인
            </h2>
            <p className="text-sm text-muted-foreground">
              신고 #{confirmBlock.id}의 피신고자{' '}
              <strong>
                {confirmBlock.reported?.displayName ?? confirmBlock.reported?.email ?? confirmBlock.reported?.id}
              </strong>
              를 차단하고 신고를 처리 완료로 표시합니다.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">차단 사유 (선택)</label>
              <Input
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="예: 반복적인 악성 행위"
              />
            </div>
            <div className="flex justify-end gap-2">
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
