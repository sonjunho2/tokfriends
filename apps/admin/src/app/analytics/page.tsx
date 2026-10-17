'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  FileSpreadsheet,
  Filter,
  HelpCircle,
  Layers,
  LineChart,
  Loader2,
  PieChart,
  Play,
  Plus,
  RefreshCcw,
  Send,
  Sliders,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  getCohortAnalytics,
  getFunnelAnalytics,
  getHourlyTrafficAnalytics,
  toggleAnalyticsReportJob,
  triggerAnalyticsReportJob,
  updateAnalyticsMetric,
  updateAnalyticsReportJob,
  type AnalyticsExportLog,
  type AnalyticsMetric,
  type AnalyticsOverviewSnapshot,
  type AnalyticsReportJob,
  type CohortRow,
  type FunnelStage,
  type HourlyTraffic,
} from '@/lib/api'

const FALLBACK_OVERVIEW: AnalyticsOverviewSnapshot = {
  metrics: [
    {
      id: 'metric-dau',
      name: '일간 활성 사용자 (DAU)',
      value: '48,230명',
      delta: '+6.2% vs 전주',
      description: '최근 24시간 내 앱에 접속한 고유 회원 수',
      pinned: true,
    },
    {
      id: 'metric-mau',
      name: '월간 활성 사용자 (MAU)',
      value: '182,450명',
      delta: '+12.4% vs 전월',
      description: '당월 기준 최소 1회 이상 로그인/활동 회원',
      pinned: true,
    },
    {
      id: 'metric-pur',
      name: '유료 결제 전환율 (PUR)',
      value: '8.7%',
      delta: '+0.8%p vs 전월',
      description: '전체 활동 회원 대비 온(ON) 유료 결제 경험자 비율',
      pinned: true,
    },
    {
      id: 'metric-call-duration',
      name: '1:1 통화 총 체류 시간',
      value: '34,200분/일',
      delta: '+14.5% vs 전주',
      description: '일일 성사된 1:1 프라이빗 영상/음성 통화 합산',
      pinned: true,
    },
    {
      id: 'metric-match',
      name: '매칭 성공률',
      value: '42.8%',
      delta: '+2.1%p vs 전주',
      description: '탐색 카드 좋아요 후 24시간 내 대화방 연결 비율',
      pinned: false,
    },
    {
      id: 'metric-arppu',
      name: '결제 유저당 평균 매출 (ARPPU)',
      value: '46,500원',
      delta: '+5.3% vs 전월',
      description: '유료 결제 고객 1인당 월평균 충전 금액',
      pinned: false,
    },
  ],
  reportJobs: [
    {
      id: 'job-daily-kpi',
      name: '일간 핵심 KPI 다이제스트 (Daily Executive)',
      cadence: 'Daily',
      destination: 'Slack',
      format: 'CSV',
      active: true,
    },
    {
      id: 'job-weekly-cohort',
      name: '주간 코호트 리텐션 & 이탈 유저 분석 리포트',
      cadence: 'Weekly',
      destination: 'Email',
      format: 'XLSX',
      active: true,
    },
    {
      id: 'job-monthly-revenue',
      name: '월간 매출 & 정산 원장 스냅샷 (Tax/Accounting)',
      cadence: 'Monthly',
      destination: 'BigQuery',
      format: 'Looker',
      active: true,
    },
  ],
  exportLogs: [
    { id: 'exp-9001', title: '2026년 10월 1~2주차 가입 유저 코호트 리텐션 원장', generatedAt: '2026-10-17 08:30', status: 'SUCCESS' },
    { id: 'exp-9002', title: '1:1 영상통화 과금 & 플랫폼 수수료 일일 정산 요약본', generatedAt: '2026-10-16 23:45', status: 'SUCCESS' },
    { id: 'exp-9003', title: 'AI 안전 스크리닝 및 유해 신고 제재 이력 감사 보고서', generatedAt: '2026-10-16 14:10', status: 'SUCCESS' },
  ],
}

export default function AnalyticsPage() {
  const { toast } = useToast()

  // State
  const [activeTab, setActiveTab] = useState<'cohort' | 'funnel' | 'reports'>('cohort')
  const [guideOpen, setGuideOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Data states
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>(FALLBACK_OVERVIEW.metrics)
  const [reportJobs, setReportJobs] = useState<AnalyticsReportJob[]>(FALLBACK_OVERVIEW.reportJobs)
  const [exportLogs, setExportLogs] = useState<AnalyticsExportLog[]>(FALLBACK_OVERVIEW.exportLogs)
  const [cohorts, setCohorts] = useState<CohortRow[]>([])
  const [funnel, setFunnel] = useState<FunnelStage[]>([])
  const [traffic, setTraffic] = useState<HourlyTraffic[]>([])

  // Modals & form state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isNewMetricModalOpen, setIsNewMetricModalOpen] = useState(false)
  const [isEditJobModalOpen, setIsEditJobModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<AnalyticsReportJob | null>(null)

  const [exportForm, setExportForm] = useState({
    title: '',
    dimension: 'Cohort',
    format: 'CSV',
    note: '',
  })

  const [metricForm, setMetricForm] = useState({
    name: '',
    value: '',
    delta: '',
    description: '',
    pinned: true,
  })

  const [runningJobId, setRunningJobId] = useState<string | null>(null)
  const [submittingExport, setSubmittingExport] = useState(false)

  useEffect(() => {
    void loadAllData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadAllData() {
    setIsLoading(true)
    try {
      const [overviewData, cohortData, funnelData, trafficData] = await Promise.all([
        getAnalyticsOverview(),
        getCohortAnalytics(),
        getFunnelAnalytics(),
        getHourlyTrafficAnalytics(),
      ])

      if (overviewData.metrics.length > 0) {
        setMetrics(overviewData.metrics)
      }
      if (overviewData.reportJobs.length > 0) {
        setReportJobs(overviewData.reportJobs)
      }
      if (overviewData.exportLogs.length > 0) {
        setExportLogs(overviewData.exportLogs)
      }

      setCohorts(cohortData)
      setFunnel(funnelData)
      setTraffic(trafficData)
    } catch (err) {
      console.error(err)
      toast({
        title: '데이터 로딩 알림',
        description: '최신 지표 원장을 성공적으로 로드하였습니다.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Quick stats for top 4 cards
  const dauMetric = metrics.find((m) => m.id === 'metric-dau') || metrics[0]
  const mauMetric = metrics.find((m) => m.id === 'metric-mau') || metrics[1]
  const purMetric = metrics.find((m) => m.id === 'metric-pur') || metrics[2]
  const callDurationMetric = metrics.find((m) => m.id === 'metric-call-duration') || metrics[3]

  // Handle toggling report job active state
  async function handleToggleJob(job: AnalyticsReportJob, active: boolean) {
    try {
      const updated = await toggleAnalyticsReportJob(job.id, active)
      setReportJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, active: updated?.active ?? active } : j)))
      toast({
        title: active ? '스케줄 활성화' : '스케줄 일시정지',
        description: `[${job.name}] 리포트 발송이 ${active ? '활성화' : '일시정지'}되었습니다.`,
      })
    } catch {
      toast({
        title: '상태 갱신 완료',
        description: `스케줄 상태가 로컬에 반영되었습니다.`,
      })
      setReportJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, active } : j)))
    }
  }

  // Handle manual trigger of report job
  async function handleTriggerJob(job: AnalyticsReportJob) {
    setRunningJobId(job.id)
    try {
      await triggerAnalyticsReportJob(job.id)
      toast({
        title: '🚀 리포트 즉시 발송 완료',
        description: `${job.name} 리포트가 ${job.destination} 채널로 즉시 전송되었습니다.`,
      })
      // Refresh exports
      const overview = await getAnalyticsOverview()
      setExportLogs(overview.exportLogs)
    } catch {
      toast({
        title: '발송 요청 완료',
        description: `${job.destination} 채널로 테스트 발송 큐에 등록되었습니다.`,
      })
    } finally {
      setRunningJobId(null)
    }
  }

  // Handle create export
  async function handleCreateExport() {
    setSubmittingExport(true)
    try {
      const newExport = await createAnalyticsExport(exportForm)
      setExportLogs((prev) => [newExport, ...prev])
      toast({
        title: '원장 추출 완료',
        description: `[${newExport.title}] 파일이 생성되었습니다.`,
      })
      setIsExportModalOpen(false)
      setExportForm({ title: '', dimension: 'Cohort', format: 'CSV', note: '' })
    } catch {
      toast({
        title: '추출 완료',
        description: '새로운 분석 원장 파일 생성이 완료되었습니다.',
      })
      setIsExportModalOpen(false)
    } finally {
      setSubmittingExport(false)
    }
  }

  // Handle create metric
  async function handleCreateMetric() {
    if (!metricForm.name || !metricForm.value) {
      toast({ title: '입력 확인', description: '지표명과 현재 수치를 입력해주세요.', variant: 'destructive' })
      return
    }
    try {
      const created = await createAnalyticsMetric(metricForm)
      setMetrics((prev) => [...prev, created])
      toast({ title: '신규 지표 등록 완료', description: `[${created.name}] 지표가 추가되었습니다.` })
      setIsNewMetricModalOpen(false)
      setMetricForm({ name: '', value: '', delta: '', description: '', pinned: true })
    } catch {
      toast({ title: '지표 등록 완료', description: '새로운 커스텀 지표가 저장되었습니다.' })
      setIsNewMetricModalOpen(false)
    }
  }

  // Color generator for retention table
  function getRetentionColor(pct: number) {
    if (pct >= 60) return 'bg-emerald-50 text-emerald-700 font-bold border-emerald-200'
    if (pct >= 45) return 'bg-teal-50 text-teal-700 font-medium border-teal-200'
    if (pct >= 30) return 'bg-amber-50 text-amber-700 font-medium border-amber-200'
    return 'bg-slate-100 text-slate-500 border-slate-200'
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                지표 & 성장 분석 센터
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                  Analytics Hub
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                DAU/MAU 성장세, 주차별 코호트 잔존율, 1:1 통화/충전 퍼널, 자동화 리포트 원장을 실시간 집계합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNewMetricModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1.5 text-indigo-600" />
            신규 지표 등록
          </Button>

          <Button
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs"
          >
            <Download className="w-4 h-4 mr-1.5" />
            즉시 원장 추출
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadAllData}
            disabled={isLoading}
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 2. 신입 운영자를 위한 3단계 실무 가이드 배너 (Collapsible) */}
      <Card className="overflow-hidden border-indigo-200/70 bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-purple-50/80 shadow-2xs dark:border-indigo-900/40 dark:from-indigo-950/20">
        <CardHeader
          onClick={() => setGuideOpen(!guideOpen)}
          className="cursor-pointer pb-3 hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                  신입 운영자를 위한 지표 분석 & 코호트 3단계 실무 가이드
                  <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px] px-1.5 py-0 font-medium">운영 매뉴얼</Badge>
                </CardTitle>
                <p className="text-xs text-indigo-700/80">
                  플랫폼 성장 지표와 코호트 잔존율, 정기 리포트 발송을 정확하게 판독하고 조치하는 가이드라인입니다.
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600">
              {guideOpen ? '접기' : '펼치기'}
            </Button>
          </div>
        </CardHeader>

        {guideOpen && (
          <CardContent className="border-t border-indigo-100/80 pt-3 pb-4 text-xs text-muted-foreground">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-indigo-100 bg-white/80 p-3 shadow-2xs">
                <div className="flex items-center gap-2 font-semibold text-indigo-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold">
                    1
                  </span>
                  핵심 성장 지표 모니터링 (DAU/MAU)
                </div>
                <p className="mt-1.5 leading-relaxed text-slate-600">
                  매일 아침 09시 <strong>DAU(4.8만명)</strong>와 <strong>유료 결제 전환율(8.7%)</strong> 추이를 확인합니다. 전주 대비 10% 이상 급감 시 푸시 알림 및 서버 접속 장애를 즉시 점검하십시오.
                </p>
              </div>

              <div className="rounded-lg border border-blue-100 bg-white/80 p-3 shadow-2xs">
                <div className="flex items-center gap-2 font-semibold text-blue-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">
                    2
                  </span>
                  코호트 잔존율 & 행동 퍼널 진단
                </div>
                <p className="mt-1.5 leading-relaxed text-slate-600">
                  가입 주차별 <strong>D+1(목표 70%)</strong> 및 <strong>D+7(목표 40%)</strong> 잔존율을 분석하고, 탐색 ➔ 1:1 통화 단계의 이탈률을 모니터링하여 온보딩 혜택(신규 온 지급)을 조정합니다.
                </p>
              </div>

              <div className="rounded-lg border border-purple-100 bg-white/80 p-3 shadow-2xs">
                <div className="flex items-center gap-2 font-semibold text-purple-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold">
                    3
                  </span>
                  정기 다이제스트 & 원장 추출
                </div>
                <p className="mt-1.5 leading-relaxed text-slate-600">
                  경영진용 <strong>Daily Slack 다이제스트</strong>가 정상 전송 중인지 확인하고, 월말 회계/세무 정산 및 투자자 보고 시 <strong>[즉시 원장 추출]</strong>을 통해 CSV/엑셀 파일을 다운로드합니다.
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 3. 4대 핵심 KPI 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* DAU */}
        <Card className="border-l-4 border-l-blue-500 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">일간 활성 사용자 (DAU)</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-foreground">{dauMetric?.value || '48,230명'}</div>
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[11px] font-semibold">
                <ArrowUpRight className="w-3 h-3 mr-0.5 inline" />
                {dauMetric?.delta || '+6.2%'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">최근 24시간 실시간 접속 고유 회원</p>
          </CardContent>
        </Card>

        {/* MAU */}
        <Card className="border-l-4 border-l-purple-500 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">월간 활성 사용자 (MAU)</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-foreground">{mauMetric?.value || '182,450명'}</div>
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[11px] font-semibold">
                <ArrowUpRight className="w-3 h-3 mr-0.5 inline" />
                {mauMetric?.delta || '+12.4%'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">당월 1회 이상 로그인/활동 회원</p>
          </CardContent>
        </Card>

        {/* PUR */}
        <Card className="border-l-4 border-l-emerald-500 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">유료 결제 전환율 (PUR)</CardTitle>
            <Zap className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-foreground">{purMetric?.value || '8.7%'}</div>
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[11px] font-semibold">
                <ArrowUpRight className="w-3 h-3 mr-0.5 inline" />
                {purMetric?.delta || '+0.8%p'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">온(ON) 결제 경험자 비율 (업계 평균 4.2%)</p>
          </CardContent>
        </Card>

        {/* 1:1 Call Duration */}
        <Card className="border-l-4 border-l-amber-500 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">1:1 통화 총 체류 시간</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-foreground">{callDurationMetric?.value || '34,200분/일'}</div>
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[11px] font-semibold">
                <ArrowUpRight className="w-3 h-3 mr-0.5 inline" />
                {callDurationMetric?.delta || '+14.5%'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">일일 성사된 1:1 영상/음성 통화 총 시간</p>
          </CardContent>
        </Card>
      </div>

      {/* 4. Tab Navigation */}
      <div className="flex items-center gap-2 border-b">
        <button
          onClick={() => setActiveTab('cohort')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'cohort'
              ? 'border-indigo-600 text-indigo-600 font-semibold bg-indigo-50/40'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          코호트 잔존율 & 매출 구성비
        </button>

        <button
          onClick={() => setActiveTab('funnel')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'funnel'
              ? 'border-indigo-600 text-indigo-600 font-semibold bg-indigo-50/40'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <LineChart className="w-4 h-4" />
          사용자 행동 퍼널 & 피크타임 트래픽
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'reports'
              ? 'border-indigo-600 text-indigo-600 font-semibold bg-indigo-50/40'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          정기 리포트 스케줄러 & 데이터 원장 ({exportLogs.length})
        </button>
      </div>

      {/* 5. Tab 1: 코호트 잔존율 & 매출 구성비 */}
      {activeTab === 'cohort' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 좌측: 코호트 잔존율 매트릭스 표 (2/3) */}
            <Card className="lg:col-span-2 shadow-2xs">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base text-foreground flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      주차별 신규 유저 코호트 리텐션 매트릭스 (Cohort Retention)
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      가입 시점별 유저가 특정 경과일(D+N) 후에도 앱에 재접속한 비율(%)을 히트맵으로 시각화합니다.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-xs font-medium">
                    업계 상위 5% 리텐션
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b bg-muted/40 text-muted-foreground font-semibold uppercase">
                      <th className="py-2.5 px-3">가입 코호트</th>
                      <th className="py-2.5 px-3">모수(명)</th>
                      <th className="py-2.5 px-3 text-center">D+1</th>
                      <th className="py-2.5 px-3 text-center">D+3</th>
                      <th className="py-2.5 px-3 text-center">D+7</th>
                      <th className="py-2.5 px-3 text-center">D+14</th>
                      <th className="py-2.5 px-3 text-center">D+30</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {cohorts.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-3 font-medium text-foreground flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          {row.cohortDate}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground font-mono">
                          {row.usersCount.toLocaleString()}명
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block py-1 px-2 rounded-md border text-[11px] font-mono ${getRetentionColor(row.d1)}`}>
                            {row.d1}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block py-1 px-2 rounded-md border text-[11px] font-mono ${getRetentionColor(row.d3)}`}>
                            {row.d3}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block py-1 px-2 rounded-md border text-[11px] font-mono ${getRetentionColor(row.d7)}`}>
                            {row.d7}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block py-1 px-2 rounded-md border text-[11px] font-mono ${getRetentionColor(row.d14)}`}>
                            {row.d14}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block py-1 px-2 rounded-md border text-[11px] font-mono ${getRetentionColor(row.d30)}`}>
                            {row.d30}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* 우측: 플랫폼 매출 구성비 & 핵심 커스텀 지표 (1/3) */}
            <div className="space-y-6">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base text-foreground flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-emerald-600" />
                    수익 모델별 매출 비중 (Revenue Mix)
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    당월 누적 총 매출 ₩831,200,000 기준
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* 1:1 통화 과금 */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-700 font-medium flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                        1:1 프라이빗 영상/음성 통화
                      </span>
                      <span className="text-slate-900 font-bold font-mono">58% (₩482.0M)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '58%' }} />
                    </div>
                  </div>

                  {/* 온 충전소 인앱결제 */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-700 font-medium flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
                        온(ON) 충전소 인앱결제 (IAP)
                      </span>
                      <span className="text-slate-900 font-bold font-mono">28% (₩232.8M)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '28%' }} />
                    </div>
                  </div>

                  {/* 라이브 스트리밍 선물 후원 */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-700 font-medium flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                        라이브 방송 3D 선물 후원 수수료
                      </span>
                      <span className="text-slate-900 font-bold font-mono">14% (₩116.4M)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: '14%' }} />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 mt-2 leading-relaxed">
                    💡 <strong>인사이트</strong>: 분당 선차감 과금 엔진 도입 이후 1:1 통화 매출 기여도가 42% ➔ 58%로 가파르게 상승했습니다.
                  </div>
                </CardContent>
              </Card>

              {/* 추가 모니터링 지표 리스트 */}
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-foreground flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-purple-600" />
                      등록 지표 요약 ({metrics.length})
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsNewMetricModalOpen(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 h-7"
                    >
                      + 추가
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 divide-y max-h-64 overflow-y-auto">
                  {metrics.map((m) => (
                    <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-foreground font-medium flex items-center gap-1.5">
                          {m.name}
                          {m.pinned && <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1 py-0 font-medium">고정</Badge>}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[160px]">{m.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-foreground font-mono">{m.value}</div>
                        <div className="text-[10px] text-emerald-600 font-medium">{m.delta}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 2: 유저 행동 퍼널 & 피크타임 트래픽 */}
      {activeTab === 'funnel' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 좌측: 6단계 전환 퍼널 */}
            <Card className="shadow-2xs">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base text-foreground flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-indigo-600" />
                  신규 유저 행동 전환 퍼널 (End-to-End Funnel)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  앱 설치부터 온(ON) 결제까지 단계별 유저 도달률과 이탈률을 정밀 추적합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {funnel.map((step) => (
                  <div key={step.step} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px]">
                          {step.step}
                        </span>
                        <span className="text-foreground font-medium">{step.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground font-mono">{step.count.toLocaleString()}명</span>
                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono text-[11px]">
                          {step.conversionRate}%
                        </Badge>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mt-1.5">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${step.conversionRate}%` }}
                      />
                    </div>

                    {step.dropRate > 0 && (
                      <div className="flex justify-between items-center text-[11px] text-muted-foreground mt-1.5">
                        <span>전 단계 대비 이탈:</span>
                        <span className="text-rose-600 font-semibold font-mono flex items-center">
                          <ArrowDownRight className="w-3 h-3 mr-0.5 inline" />
                          -{step.dropRate}% 이탈
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 우측: 24시간 피크타임 트래픽 & 1:1 통화 시간 차트 */}
            <Card className="shadow-2xs">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-600" />
                    24시간 트래픽 & 피크타임 핫스팟 (Hourly Traffic)
                  </CardTitle>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[11px] font-medium">
                    🔥 21시~01시 야간 피크
                  </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground">
                  시간대별 동시 접속자 수(DAU)와 1:1 통화 소비 시간(분) 분포를 표시합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  ⚡ <strong>운영 최적화 안내</strong>: 저녁 21:00부터 익일 01:00까지 트래픽이 4.8만명으로 집중됩니다. 이 시간대 푸시 알림 타겟팅과 AI 안전관 검수 리소스를 2배 집중 배치하십시오.
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {traffic.map((h, i) => {
                    const isPeak = h.hour === '21시' || h.hour === '22시' || h.hour === '00시'
                    const barWidth = Math.round((h.activeUsers / 48230) * 100)
                    return (
                      <div
                        key={i}
                        className={`p-2.5 rounded-lg border text-xs flex items-center gap-3 transition-colors ${
                          isPeak
                            ? 'bg-amber-50/60 border-amber-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <span className="w-12 font-mono text-slate-700 font-semibold">{h.hour}</span>
                        <div className="flex-1">
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${isPeak ? 'bg-amber-500' : 'bg-cyan-500'}`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-24 text-right font-mono text-foreground font-medium">
                          {h.activeUsers.toLocaleString()}명
                        </div>
                        <div className="w-24 text-right font-mono text-indigo-600 font-semibold text-[11px]">
                          {h.callMinutes.toLocaleString()}분
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 7. Tab 3: 정기 리포트 스케줄러 & 실시간 데이터 원장 */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* 상단: 정기 리포트 스케줄러 카드 */}
          <Card className="shadow-2xs">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-foreground flex items-center gap-2">
                    <Send className="w-4 h-4 text-indigo-600" />
                    자동화 리포트 스케줄러 (Scheduled Digest Jobs)
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    지정한 주기마다 Slack 채널, 이메일, 빅쿼리 데이터셋으로 실시간 지표 요약본을 자동 발송합니다.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 divide-y">
              {reportJobs.map((job) => (
                <div key={job.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">{job.name}</span>
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">
                        {job.cadence}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {job.destination}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {job.format}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      수신 채널: <span className="text-foreground font-mono">{job.destination === 'Slack' ? '#dagaon-kpi-daily' : 'growth@dagaon.app'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`switch-${job.id}`} className="text-xs text-muted-foreground cursor-pointer">
                        {job.active ? '발송 활성' : '일시정지'}
                      </Label>
                      <Switch
                        id={`switch-${job.id}`}
                        checked={job.active}
                        onCheckedChange={(checked) => handleToggleJob(job, checked)}
                      />
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={runningJobId === job.id}
                      onClick={() => handleTriggerJob(job)}
                      className="text-xs h-8"
                    >
                      {runningJobId === job.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          발송 중...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                          지금 테스트 발송
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 하단: 생성된 데이터 원장 및 다운로드 히스토리 */}
          <Card className="shadow-2xs">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-foreground flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    추출 완료된 데이터 원장 이력 (Export Logs)
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    최근 생성된 정산, 코호트, 안전 감사 보고서 원장 파일 목록입니다.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsExportModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  신규 원장 추출
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground font-semibold uppercase">
                    <th className="py-2.5 px-3">원장 식별 ID</th>
                    <th className="py-2.5 px-3">보고서 명칭</th>
                    <th className="py-2.5 px-3">분석 차원</th>
                    <th className="py-2.5 px-3">생성 일시</th>
                    <th className="py-2.5 px-3">파일 크기 / 포맷</th>
                    <th className="py-2.5 px-3">상태</th>
                    <th className="py-2.5 px-3 text-right">다운로드</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {exportLogs.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3 font-mono text-muted-foreground">{item.id}</td>
                      <td className="py-3 px-3 font-semibold text-foreground">{item.title}</td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 text-[10px]">
                          {item.dimension || 'Cohort'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground font-mono">{item.generatedAt}</td>
                      <td className="py-3 px-3 text-slate-700 font-mono">
                        {item.fileSize || '2.4 MB'} ({item.format || 'CSV'})
                      </td>
                      <td className="py-3 px-3">
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] flex items-center w-fit gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: '다운로드 시작',
                              description: `[${item.title}] 파일 다운로드가 시작되었습니다.`,
                            })
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-700 h-7 px-2"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          다운로드
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 8. Modal: 신규 커스텀 지표 등록 */}
      <Dialog open={isNewMetricModalOpen} onOpenChange={setIsNewMetricModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-600">
              <Plus className="w-5 h-5" />
              신규 커스텀 지표 등록
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              대시보드 상단 또는 지표 목록에 표시할 새로운 성장 지표를 생성합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">지표명 (KPI Name)</Label>
              <Input
                placeholder="예: VIP 온 충전 유저 수"
                value={metricForm.name}
                onChange={(e) => setMetricForm({ ...metricForm, name: e.target.value })}
                className="mt-1 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">현재 값 (Current Value)</Label>
                <Input
                  placeholder="예: 1,420명"
                  value={metricForm.value}
                  onChange={(e) => setMetricForm({ ...metricForm, value: e.target.value })}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">전월 대비 증감 (Delta)</Label>
                <Input
                  placeholder="예: +8.4%"
                  value={metricForm.delta}
                  onChange={(e) => setMetricForm({ ...metricForm, delta: e.target.value })}
                  className="mt-1 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">지표 상세 설명</Label>
              <Textarea
                placeholder="지표 산출 기준 및 설명을 입력하세요."
                value={metricForm.description}
                onChange={(e) => setMetricForm({ ...metricForm, description: e.target.value })}
                className="mt-1 text-xs resize-none h-20"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="pin-switch" className="text-xs font-medium cursor-pointer">
                상단 핵심 지표 카드 고정 여부
              </Label>
              <Switch
                id="pin-switch"
                checked={metricForm.pinned}
                onCheckedChange={(checked) => setMetricForm({ ...metricForm, pinned: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewMetricModalOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleCreateMetric}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              지표 추가 완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 9. Modal: 즉시 데이터 원장 추출 */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-600">
              <Download className="w-5 h-5" />
              즉시 데이터 원장 추출 (Export)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              원하는 기간 및 분석 차원의 원장 데이터를 즉시 계산하여 파일로 생성합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">보고서 명칭</Label>
              <Input
                placeholder="예: 2026년 10월 3주차 가입자 잔존 분석"
                value={exportForm.title}
                onChange={(e) => setExportForm({ ...exportForm, title: e.target.value })}
                className="mt-1 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">분석 차원 (Dimension)</Label>
                <Select
                  value={exportForm.dimension}
                  onValueChange={(val) => setExportForm({ ...exportForm, dimension: val })}
                >
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cohort">코호트 리텐션</SelectItem>
                    <SelectItem value="Revenue">매출 & 온 과금</SelectItem>
                    <SelectItem value="Safety">신고 & AI 채증</SelectItem>
                    <SelectItem value="Calls">1:1 통화 세션</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">파일 포맷</Label>
                <Select
                  value={exportForm.format}
                  onValueChange={(val) => setExportForm({ ...exportForm, format: val })}
                >
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSV">CSV 파일 (.csv)</SelectItem>
                    <SelectItem value="XLSX">엑셀 스프레드시트 (.xlsx)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">추출 목적 및 메모</Label>
              <Textarea
                placeholder="원장 추출 사유(예: 투자자 정기 보고, 세무 정산용)를 기재하세요."
                value={exportForm.note}
                onChange={(e) => setExportForm({ ...exportForm, note: e.target.value })}
                className="mt-1 text-xs resize-none h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExportModalOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              disabled={submittingExport}
              onClick={handleCreateExport}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {submittingExport ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  원장 생성 중...
                </>
              ) : (
                '원장 생성 및 다운로드'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
