'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { getDashboardMetrics } from '@/lib/api'
import { Smartphone, Download, CheckCircle, ExternalLink, ShieldCheck } from 'lucide-react'
import type { AxiosError } from 'axios'

type KpiMetric = {
  label: string
  value: string
  hint: string
}

const FALLBACK_KPIS: KpiMetric[] = [
  { label: '가입자 수', value: '128,420명', hint: '전월 대비 +3.2%' },
  { label: '매칭 요청 수', value: '24,980건', hint: '전일 대비 +4.1%' },
  { label: '신고 건수', value: '312건', hint: '24시간 내 처리율 92%' },
]

const MONTHLY_SIGNUPS = [
  { month: '1월', value: 8200 },
  { month: '2월', value: 9100 },
  { month: '3월', value: 11200 },
  { month: '4월', value: 12800 },
  { month: '5월', value: 14900 },
  { month: '6월', value: 16100 },
]

const MATCH_COMPLETIONS = [
  { week: '1주', value: 1820 },
  { week: '2주', value: 2040 },
  { week: '3주', value: 2210 },
  { week: '4주', value: 2430 },
]

const REPORT_STATUS = [
  { name: '처리 완료', value: 68 },
  { name: '검토 중', value: 22 },
  { name: '대기', value: 10 },
]

export default function DashboardPage() {
  const { toast } = useToast()
  const [kpis, setKpis] = useState(FALLBACK_KPIS)

  useEffect(() => {
    async function loadMetrics() {
      try {
        const metrics = await getDashboardMetrics()
        if (metrics) {
          setKpis([
            {
              label: '가입자 수',
              value: metrics.totalUsers ? `${metrics.totalUsers.toLocaleString()}명` : FALLBACK_KPIS[0].value,
              hint: metrics.userGrowth ? `전월 대비 ${metrics.userGrowth}` : FALLBACK_KPIS[0].hint,
            },
            {
              label: '매칭 요청 수',
              value: metrics.matchRequests
                ? `${metrics.matchRequests.toLocaleString()}건`
                : FALLBACK_KPIS[1].value,
              hint: metrics.matchGrowth ? `전일 대비 ${metrics.matchGrowth}` : FALLBACK_KPIS[1].hint,
            },
            {
              label: '신고 건수',
              value: metrics.reports ? `${metrics.reports.toLocaleString()}건` : FALLBACK_KPIS[2].value,
              hint: metrics.reportSla ? `24시간 내 처리율 ${metrics.reportSla}` : FALLBACK_KPIS[2].hint,
            },
          ])
        }
      } catch (error) {
        const ax = error as AxiosError | undefined
        const status = ax?.response?.status
        const fallbackMessage = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
        const message =
          status && [404, 500].includes(status)
            ? fallbackMessage
            : ((ax?.response?.data as any)?.message || ax?.message || fallbackMessage)
        toast({
          title: '대시보드 지표 불러오기 실패',
          description: Array.isArray(message) ? message.join(', ') : String(message),
          variant: 'destructive',
        })
        setKpis(FALLBACK_KPIS)
      }
    }

    void loadMetrics()
  }, [toast])

  const summaryTitle = useMemo(() => kpis.map((kpi) => kpi.label).join(', '), [kpis])

  return (
    <div className="space-y-6">
      {/* Mobile App APK Download Banner */}
      <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 shadow-sm">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-200">
              <Smartphone className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-foreground">
                  다가온(DAGAON) 모바일 앱 독립 실행형 (APK)
                </h3>
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] px-2">
                  <CheckCircle className="h-3 w-3 mr-1 inline" />
                  실서버 연동 v1.2.0
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Render 프로덕션 백엔드 및 Vercel 관리자 콘솔과 100% 실시간 연동되는 안드로이드 릴리즈 설치 파일입니다. 스마트폰에 다운로드하여 즉시 설치 및 테스트하실 수 있습니다.
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-1">
                <span><strong className="text-foreground">백엔드:</strong> Render API (LIVE)</span>
                <span>•</span>
                <span><strong className="text-foreground">재화:</strong> 온 (ON) 표준화</span>
                <span>•</span>
                <span><strong className="text-foreground">용량:</strong> 약 59.8 MB</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-2 px-5"
              asChild
            >
              <a href="/downloads/dagaon-release.apk" download="dagaon-release.apk">
                <Download className="h-4 w-4" />
                <span>APK 파일 다운로드</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {kpis.map((metric) => (
          <Card key={metric.label} className="border-muted">
            <CardHeader>
              <CardTitle className="text-base">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-primary">{metric.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{metric.hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>월간 가입자 추세</CardTitle>
            <p className="text-sm text-muted-foreground">최근 6개월 가입자 수 증감 추이를 확인합니다.</p>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_SIGNUPS} margin={{ left: 8, right: 8, top: 10 }}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <Tooltip formatter={(value: number) => `${value.toLocaleString()}명`} />
                <Line type="monotone" dataKey="value" stroke="#1d4ed8" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>신고 처리 상태</CardTitle>
            <p className="text-sm text-muted-foreground">24시간 내 신고 처리 현황을 비율로 보여줍니다.</p>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Pie
                  data={REPORT_STATUS}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={4}
                  fill="#334155"
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>매칭 완료 추세</CardTitle>
            <p className="text-sm text-muted-foreground">주간 매칭 완료 건수를 비교합니다.</p>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MATCH_COMPLETIONS} margin={{ left: 8, right: 8, top: 10 }}>
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <Tooltip formatter={(value: number) => `${value.toLocaleString()}건`} />
                <Bar dataKey="value" fill="#0f172a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>핵심 KPI 요약</CardTitle>
            <p className="text-sm text-muted-foreground">{summaryTitle}를 중심으로 대시보드를 구성했습니다.</p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {kpis.map((metric) => (
              <div key={metric.label} className="rounded-lg border p-4">
                <h3 className="text-sm font-semibold">{metric.label}</h3>
                <p className="mt-2 text-lg font-semibold text-primary">{metric.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{metric.hint}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
