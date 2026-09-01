'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  createAnalyticsExport,
  createAnalyticsMetric,
  getAnalyticsOverview,
  toggleAnalyticsReportJob,
  updateAnalyticsMetric,
  updateAnalyticsReportJob,
  type AnalyticsExportLog,
  type AnalyticsMetric,
  type AnalyticsOverviewSnapshot,
  type AnalyticsReportJob,
} from '@/lib/api'
import type { AxiosError } from 'axios'

const FALLBACK_OVERVIEW: AnalyticsOverviewSnapshot = {
  metrics: [
    {
      id: 'metric-dau',
      name: 'DAU',
      value: '48,230',
      delta: '+6.2% vs LW',
      description: '일간 활성 사용자 (24시간)',
      pinned: true,
    },
    {
      id: 'metric-match',
      name: '매칭 성공률',
      value: '41%',
      delta: '+3.1pt',
      description: '매칭 후 24시간 내 1:1 채팅 시작 비율',
      pinned: true,
    },
    {
      id: 'metric-support',
      name: '지원 SLA',
      value: '18분',
      delta: '-5분',
      description: '최근 7일 문의 평균 응답 시간',
      pinned: false,
    },
    {
      id: 'metric-churn',
      name: '주간 이탈률',
      value: '8.4%',
      delta: '-0.6pt',
      description: '지난주 대비 잔존 변화',
      pinned: false,
    },
  ],
  reportJobs: [
    {
      id: 'job-daily-kpi',
      name: 'Daily KPI Digest',
      cadence: 'Daily',
      destination: 'Slack',
      format: 'CSV',
      active: true,
    },
    {
      id: 'job-weekly-cohort',
      name: 'Weekly Cohort',
      cadence: 'Weekly',
      destination: 'Email',
      format: 'XLSX',
      active: true,
    },
    {
      id: 'job-monthly-revenue',
      name: 'Monthly Revenue Snapshot',
      cadence: 'Monthly',
      destination: 'BigQuery',
      format: 'Looker',
      active: false,
    },
  ],
  exportLogs: [
    { id: 'exp-9001', title: 'Retention Cohort 2024-03-14', generatedAt: '2024-03-14 09:10', status: 'SUCCESS' },
    { id: 'exp-9002', title: 'Safety Incidents Breakdown', generatedAt: '2024-03-13 20:45', status: 'PENDING' },
  ],
}

const CADENCE_OPTIONS = [
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Monthly', label: 'Monthly' },
] as const

const DESTINATION_OPTIONS = [
  { value: 'Email', label: 'Email' },
  { value: 'Slack', label: 'Slack' },
  { value: 'BigQuery', label: 'BigQuery' },
] as const

const FORMAT_OPTIONS = [
  { value: 'CSV', label: 'CSV' },
  { value: 'XLSX', label: 'XLSX' },
  { value: 'Looker', label: 'Looker Studio' },
] as const

export default function AnalyticsPage() {
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>(FALLBACK_OVERVIEW.metrics)
  const [reportJobs, setReportJobs] = useState<AnalyticsReportJob[]>(FALLBACK_OVERVIEW.reportJobs)
  const [exportLogs, setExportLogs] = useState<AnalyticsExportLog[]>(FALLBACK_OVERVIEW.exportLogs)
  const [selectedJobId, setSelectedJobId] = useState<string>(FALLBACK_OVERVIEW.reportJobs[0]?.id ?? '')
  const [quickExport, setQuickExport] = useState({
    title: '',
    dimension: '',
    format: 'CSV',
    note: '',
  })

  const [savingMetricId, setSavingMetricId] = useState<string | null>(null)
  const [savingJobId, setSavingJobId] = useState<string | null>(null)
  const [runningExport, setRunningExport] = useState(false)

  const selectedJob = useMemo(() => reportJobs.find((job) => job.id === selectedJobId) ?? null, [reportJobs, selectedJobId])

  useEffect(() => {
    void loadOverview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadOverview() {
    setIsLoading(true)
    try {
      const snapshot = await getAnalyticsOverview()
      setMetrics(snapshot.metrics.length > 0 ? snapshot.metrics : FALLBACK_OVERVIEW.metrics)
      setReportJobs(snapshot.reportJobs.length > 0 ? snapshot.reportJobs : FALLBACK_OVERVIEW.reportJobs)
      setExportLogs(snapshot.exportLogs.length > 0 ? snapshot.exportLogs : FALLBACK_OVERVIEW.exportLogs)
      if (snapshot.reportJobs.length > 0) {
        setSelectedJobId(snapshot.reportJobs[0].id)
      }
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message =
        (ax?.response?.data as any)?.message || ax?.message || '지표 정보를 불러오지 못했습니다. 기본 예시 데이터를 보여드립니다.'
      toast({
        title: '분석 데이터 불러오기 실패',
        description: Array.isArray(message) ? message.join(', ') : String(message),
        variant: 'destructive',
      })
      setMetrics(FALLBACK_OVERVIEW.metrics)
      setReportJobs(FALLBACK_OVERVIEW.reportJobs)
      setExportLogs(FALLBACK_OVERVIEW.exportLogs)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMetricPin = async (id: string) => {
    setSavingMetricId(id)
    try {
      const target = metrics.find((metric) => metric.id === id)
      const updated = await updateAnalyticsMetric(id, { pinned: !target?.pinned })
      setMetrics((prev) => prev.map((metric) => (metric.id === id ? { ...metric, ...updated } : metric)))
      toast({ title: '지표 고정 상태 변경', description: `${updated.name ?? '지표'} 표시 설정을 저장했습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '지표 고정 상태를 변경하지 못했습니다.'
      toast({ title: '지표 업데이트 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingMetricId(null)
    }
  }

  const addMetric = async () => {
    const title = prompt('추가할 지표 이름을 입력하세요.')
    if (!title) return
    setSavingMetricId('new')
    try {
      const created = await createAnalyticsMetric({ name: title, pinned: false })
      setMetrics((prev) => [...prev, created])
      toast({ title: '지표 추가', description: `${created.name ?? title} 지표가 위젯에 추가되었습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '새 지표를 추가하지 못했습니다.'
      toast({ title: '지표 추가 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingMetricId(null)
    }
  }

  const toggleJobActive = async (id: string, active: boolean) => {
    setSavingJobId(id)
    try {
      const updated = await toggleAnalyticsReportJob(id, !active)
      setReportJobs((prev) => prev.map((job) => (job.id === id ? { ...job, ...updated } : job)))
      toast({ title: '보고서 스케줄 업데이트', description: `${updated.name ?? '보고서'} 전달 상태를 변경했습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '보고서 전달 상태를 변경하지 못했습니다.'
      toast({ title: '보고서 업데이트 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingJobId(null)
    }
  }

  const updateSelectedJob = async (payload: Partial<AnalyticsReportJob>) => {
    if (!selectedJob) return
    const id = selectedJob.id
    setSavingJobId(id)
    try {
      const updated = await updateAnalyticsReportJob(id, payload)
      setReportJobs((prev) => prev.map((job) => (job.id === id ? { ...job, ...updated } : job)))
      toast({ title: '보고서 설정 저장', description: `${updated.name ?? '보고서'} 정보가 저장되었습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '보고서 설정을 저장하지 못했습니다.'
      toast({ title: '보고서 저장 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingJobId(null)
    }
  }

  const runQuickExport = async () => {
    if (!quickExport.title.trim() || !quickExport.dimension.trim()) {
      toast({ title: '입력 필요', description: '제목과 Dimension을 입력해주세요.', variant: 'destructive' })
      return
    }
    setRunningExport(true)
    try {
      const created = await createAnalyticsExport({
        title: quickExport.title.trim(),
        dimension: quickExport.dimension.trim(),
        format: quickExport.format,
        note: quickExport.note.trim() || undefined,
      })
      setExportLogs((prev) => [created, ...prev])
      toast({ title: '익스포트 요청', description: `${created.title ?? quickExport.title} 보고서를 생성 큐에 등록했습니다.` })
      setQuickExport({ title: '', dimension: '', format: quickExport.format, note: '' })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '데이터 내보내기를 시작하지 못했습니다.'
      toast({ title: '익스포트 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setRunningExport(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
      <section className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>핵심 KPI 패널</CardTitle>
              <p className="text-sm text-muted-foreground">
                고정된 지표는 대시보드 상단에 표시됩니다. 누구나 의미를 이해할 수 있도록 설명을 함께 정리해 두세요.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => void loadOverview()} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              새로고침
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => void addMetric()} disabled={savingMetricId === 'new'}>
                {savingMetricId === 'new' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                지표 추가
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {metrics.map((metric) => (
                <div key={metric.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{metric.name ?? '이름 없는 지표'}</p>
                      <p className="text-xs text-muted-foreground">{metric.description ?? '설명이 아직 입력되지 않았습니다.'}</p>
                    </div>
                    <Switch
                      checked={Boolean(metric.pinned)}
                      disabled={savingMetricId === metric.id}
                      onCheckedChange={() => void toggleMetricPin(metric.id)}
                    />
                  </div>
                  <div className="mt-3 text-2xl font-semibold">{metric.value ?? '-'}</div>
                  <div className="text-xs text-emerald-600">{metric.delta ?? '변화량 준비 중'}</div>
                </div>
              ))}
              {metrics.length === 0 && (
                <p className="text-center text-muted-foreground">표시할 지표가 없습니다. 위에서 지표를 추가해보세요.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>보고서 스케줄러</CardTitle>
            <p className="text-sm text-muted-foreground">
              코호트, 매칭 퍼널, 안전 지표를 자동으로 공유합니다. 대상 채널과 주기를 바꾸면 즉시 다음 실행부터 반영됩니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger className="md:w-[240px]">
                <SelectValue placeholder="보고서 선택" />
              </SelectTrigger>
              <SelectContent>
                {reportJobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.name ?? '이름 없는 보고서'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedJob ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>주기</Label>
                  <Select
                    value={selectedJob.cadence ?? ''}
                    onValueChange={(value: AnalyticsReportJob['cadence']) =>
                      void updateSelectedJob({ cadence: value })
                    }
                    disabled={savingJobId === selectedJob.id}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CADENCE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>전달 채널</Label>
                  <Select
                    value={selectedJob.destination ?? ''}
                    onValueChange={(value: AnalyticsReportJob['destination']) =>
                      void updateSelectedJob({ destination: value })
                    }
                    disabled={savingJobId === selectedJob.id}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DESTINATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>포맷</Label>
                  <Select
                    value={selectedJob.format ?? ''}
                    onValueChange={(value: AnalyticsReportJob['format']) => void updateSelectedJob({ format: value })}
                    disabled={savingJobId === selectedJob.id}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-md border p-3 text-xs">
                  <span>전송 중</span>
                  <Switch
                    checked={Boolean(selectedJob.active)}
                    disabled={savingJobId === selectedJob.id}
                    onCheckedChange={() => void toggleJobActive(selectedJob.id, Boolean(selectedJob.active))}
                  />
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">관리할 보고서를 먼저 선택해주세요.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>즉시 데이터 추출</CardTitle>
            <p className="text-sm text-muted-foreground">
              필요한 지표를 바로 내려받고 싶은 경우 제목과 기준을 입력한 뒤 추출을 실행하세요. 완료되면 아래 기록에 추가됩니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>보고서 제목</Label>
                <Input
                  value={quickExport.title}
                  onChange={(event) => setQuickExport((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="예: 주간 매칭 퍼널"
                />
              </div>
              <div className="space-y-2">
                <Label>Dimension / 기준</Label>
                <Input
                  value={quickExport.dimension}
                  onChange={(event) => setQuickExport((prev) => ({ ...prev, dimension: event.target.value }))}
                  placeholder="예: 지역·성별"
                />
              </div>
              <div className="space-y-2">
                <Label>포맷</Label>
                <Select
                  value={quickExport.format}
                  onValueChange={(value) => setQuickExport((prev) => ({ ...prev, format: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>추가 메모</Label>
                <Textarea
                  value={quickExport.note}
                  onChange={(event) => setQuickExport((prev) => ({ ...prev, note: event.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <Button size="sm" onClick={() => void runQuickExport()} disabled={runningExport}>
              {runningExport && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              추출 실행
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 추출 기록</CardTitle>
            <p className="text-sm text-muted-foreground">
              새로 생성되는 보고서는 상단에 추가됩니다. 상태가 PENDING이면 백엔드에서 처리 중이니 잠시 후 다시 확인해주세요.
            </p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {exportLogs.length === 0 ? (
              <p className="text-muted-foreground">아직 생성된 내역이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {exportLogs.map((log) => (
                  <div key={log.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>{log.title ?? '제목 없음'}</span>
                      <span className="text-xs text-muted-foreground">{log.generatedAt ?? '-'}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">상태: {log.status ?? 'UNKNOWN'}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
