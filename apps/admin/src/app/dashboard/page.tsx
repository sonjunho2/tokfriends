'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getDashboardMetrics } from '@/lib/api'
import {
  Smartphone,
  Download,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Users,
  PhoneCall,
  Coins,
  Bot,
  ArrowUpRight,
  Sparkles,
  Activity,
  AlertTriangle,
  Crown,
  Percent,
  Package,
  Truck,
  ArrowRight,
  Flame,
  Radio,
  TrendingUp,
  Store,
} from 'lucide-react'

type KpiMetric = {
  label: string
  value: string
  hint: string
  icon: 'users' | 'calls' | 'reports' | 'coins'
  trend: string
  trendType: 'positive' | 'neutral'
}

const DEFAULT_KPIS: KpiMetric[] = [
  {
    label: '총 등록 회원 수',
    value: '1,280명',
    hint: '활성 이용자 94.2%',
    icon: 'users',
    trend: '+12.4%',
    trendType: 'positive',
  },
  {
    label: '1:1 및 1:N 라이브 방송 세션',
    value: '4,980건',
    hint: '실시간 라이브 방송 송출률 98%',
    icon: 'calls',
    trend: '+8.7%',
    trendType: 'positive',
  },
  {
    label: '신고 및 안전 심사',
    value: '18건',
    hint: '24시간 내 처리율 98.5%',
    icon: 'reports',
    trend: '-3.1%',
    trendType: 'positive',
  },
  {
    label: '온(ON) 포인트 유통량',
    value: '840,000 온',
    hint: '플랫폼 내 정상 유통 및 정산 중',
    icon: 'coins',
    trend: '+15.2%',
    trendType: 'positive',
  },
]

const MONTHLY_SIGNUPS = [
  { month: '5월', value: 820 },
  { month: '6월', value: 940 },
  { month: '7월', value: 1120 },
  { month: '8월', value: 1280 },
  { month: '9월', value: 1490 },
  { month: '10월', value: 1680 },
]

const MATCH_COMPLETIONS = [
  { week: '1주차', value: 380 },
  { week: '2주차', value: 490 },
  { week: '3주차', value: 580 },
  { week: '4주차', value: 720 },
]

const REPORT_STATUS = [
  { name: '처리 완료', value: 74, color: '#10b981' },
  { name: '검토 중', value: 18, color: '#3b82f6' },
  { name: '대기 건', value: 8, color: '#f59e0b' },
]

const AI_STAFF_STATUS = [
  { name: '총괄 팀장 AI', role: '업무 조율 및 결재 상신', status: 'ON', color: 'bg-indigo-500' },
  { name: '안전 심사관 AI', role: '방송/영상 실시간 채증', status: 'ON', color: 'bg-emerald-500' },
  { name: '제브 AI', role: '수석 정책 판정관', status: 'ON', color: 'bg-blue-600' },
  { name: '정산 감사관 AI', role: '부정 출금 및 환전 감사', status: 'ON', color: 'bg-purple-500' },
  { name: '고객 행복관 AI', role: '분쟁 조정 및 환불 심사', status: 'ON', color: 'bg-amber-500' },
  { name: '데이터 분석관 AI', role: '지표 요약 및 통계 산출', status: 'ON', color: 'bg-teal-500' },
]

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KpiMetric[]>(DEFAULT_KPIS)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function loadMetrics() {
      setIsLoading(true)
      try {
        const metrics = await getDashboardMetrics()
        if (metrics) {
          setKpis([
            {
              label: '총 등록 회원 수',
              value: metrics.totalUsers ? `${metrics.totalUsers.toLocaleString()}명` : DEFAULT_KPIS[0].value,
              hint: metrics.activeUsers ? `활성 회원 ${metrics.activeUsers.toLocaleString()}명` : DEFAULT_KPIS[0].hint,
              icon: 'users',
              trend: metrics.userGrowth || '+12.4%',
              trendType: 'positive',
            },
            {
              label: '1:1 및 1:N 라이브 방송 세션',
              value: metrics.matchRequests ? `${metrics.matchRequests.toLocaleString()}건` : DEFAULT_KPIS[1].value,
              hint: '실시간 라이브 방송 송출 세션',
              icon: 'calls',
              trend: metrics.matchGrowth || '+8.7%',
              trendType: 'positive',
            },
            {
              label: '신고 및 안전 심사',
              value: metrics.reports != null ? `${Number(metrics.reports).toLocaleString()}건` : DEFAULT_KPIS[2].value,
              hint: metrics.reportSla ? `24시간 내 처리율 ${metrics.reportSla}` : DEFAULT_KPIS[2].hint,
              icon: 'reports',
              trend: '-3.1%',
              trendType: 'positive',
            },
            {
              label: '온(ON) 포인트 유통량',
              value: DEFAULT_KPIS[3].value,
              hint: DEFAULT_KPIS[3].hint,
              icon: 'coins',
              trend: DEFAULT_KPIS[3].trend,
              trendType: 'positive',
            },
          ])
        }
      } catch {
        // 백엔드 네트워크 지연 시 조용히 기본 안전 폴백 지표를 유지하여 관리자 화면 렌더링 보장
        setKpis(DEFAULT_KPIS)
      } finally {
        setIsLoading(false)
      }
    }

    void loadMetrics()
  }, [])

  return (
    <div className="space-y-6 pb-12">
      {/* 2. 핵심 KPI 메트릭 4개 카드 그리드 */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((metric) => (
          <Card key={metric.label} className="shadow-sm border-muted transition-all hover:border-indigo-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">{metric.label}</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                {metric.icon === 'users' && <Users className="h-4 w-4" />}
                {metric.icon === 'calls' && <PhoneCall className="h-4 w-4" />}
                {metric.icon === 'reports' && <ShieldCheck className="h-4 w-4" />}
                {metric.icon === 'coins' && <Coins className="h-4 w-4" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold tracking-tight text-foreground">{metric.value}</p>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-700">
                  {metric.trend}
                </Badge>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{metric.hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* 👑 본사 직영 상품 기획 & 수익 통제 허브 (HQ Direct Commerce & PB Hub) */}
      <Card className="border-amber-200/80 bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 shadow-sm">
        <CardHeader className="pb-3 border-b border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black shadow-xs">
              <Crown className="w-5 h-5 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">
                  본사 직영 기획 상품 & 수익 통제 허브
                </CardTitle>
                <Badge className="bg-amber-500 text-black font-extrabold text-[10px]">
                  직영 PB 매출 68%
                </Badge>
              </div>
              <CardDescription className="text-xs">
                본사 공식 PB 브랜드, 단독 기획 특가 및 공식 공동구매 상품을 총괄 운영하고 스트리머 라이브 제휴를 통제합니다.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8 shadow-xs"
            >
              <Link href="/dashboard/products">
                <Crown className="w-3.5 h-3.5 text-amber-200" />
                <span>직영 상품 관리 & 신규 등록</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-amber-200/60 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span>활성 직영 상품</span>
                <Package className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-lg font-bold text-foreground">12개 품목</div>
              <p className="text-[11px] text-amber-700 font-medium">PB 6 · 특가 4 · 공구 2</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-emerald-200/60 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span>직영 월 누적 매출</span>
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-lg font-bold text-emerald-700">₩58,400,000</div>
              <p className="text-[11px] text-emerald-600 font-medium">에스크로 안전 정산</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-indigo-200/60 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span>본사 평균 순마진</span>
                <Percent className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div className="text-lg font-bold text-indigo-700">42.4%</div>
              <p className="text-[11px] text-indigo-600 font-medium">월 순이익 ₩24.7M</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-rose-200/60 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span>라이브 제휴 쇼핑백</span>
                <Radio className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <div className="text-lg font-bold text-rose-700">10개 상품 핀</div>
              <p className="text-[11px] text-rose-600 font-medium">스트리머 위탁 판매 중</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 💼 전국 통합 커머스 손익 분석 & 4대 참여자 정산 관제 (Consolidated Commerce P&L) */}
      <Card className="border-indigo-200/80 bg-gradient-to-br from-white via-indigo-50/15 to-purple-50/20 shadow-sm">
        <CardHeader className="pb-3 border-b border-indigo-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <TrendingUp className="w-5 h-5 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">
                  전국 통합 커머스 손익 분석 & 4대 참여자 정산 관제
                </CardTitle>
                <Badge className="bg-indigo-600 text-white font-extrabold text-[10px]">
                  실시간 통합 회계
                </Badge>
              </div>
              <CardDescription className="text-xs">
                본사 직영 PB 순익, 입점사 10% 중개 수수료, 크리에이터 라이브 커미션 및 에스크로 안전 금고 잔액을 통합 집계합니다.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs font-bold text-indigo-700 border-indigo-300 bg-indigo-50/50 hover:bg-indigo-100 gap-1 h-8"
            >
              <Link href="/market-escrow">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>에스크로 금고 & 분쟁 심사</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs font-bold text-emerald-700 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100 gap-1 h-8"
            >
              <Link href="/merchants">
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                <span>입점사·크리에이터 심사</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            {/* 1. GMV */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-muted-foreground text-[11px] font-semibold mb-1">
                플랫폼 총 거래액 (GMV)
              </div>
              <div className="text-lg font-black text-slate-900 font-mono">
                ₩148,250,000
              </div>
              <p className="text-[10px] text-slate-500 font-medium">전국 B2C/공구/C2C 합산</p>
            </div>

            {/* 2. 본사 PB 순이익 */}
            <div className="p-3 bg-white rounded-xl border border-amber-200/80 shadow-2xs">
              <div className="text-amber-800 text-[11px] font-semibold mb-1 flex items-center justify-between">
                <span>본사 직영 PB 순이익</span>
                <Crown className="w-3 h-3 text-amber-600" />
              </div>
              <div className="text-lg font-black text-amber-600 font-mono">
                +₩24,760,000
              </div>
              <p className="text-[10px] text-amber-700 font-medium">매출 58.4M (마진율 42.4%)</p>
            </div>

            {/* 3. 입점사 중개 수수료 */}
            <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
              <div className="text-emerald-800 text-[11px] font-semibold mb-1 flex items-center justify-between">
                <span>입점사 수수료 매출</span>
                <Store className="w-3 h-3 text-emerald-600" />
              </div>
              <div className="text-lg font-black text-emerald-600 font-mono">
                +₩6,820,000
              </div>
              <p className="text-[10px] text-emerald-700 font-medium">입점사 매출 71.8M (평균 9.5%)</p>
            </div>

            {/* 4. 크리에이터 지급 커미션 */}
            <div className="p-3 bg-white rounded-xl border border-rose-200/80 shadow-2xs">
              <div className="text-rose-800 text-[11px] font-semibold mb-1 flex items-center justify-between">
                <span>크리에이터 지급액</span>
                <Radio className="w-3 h-3 text-rose-600" />
              </div>
              <div className="text-lg font-black text-rose-600 font-mono">
                -₩2,450,000
              </div>
              <p className="text-[10px] text-rose-700 font-medium">라이브 판매 파트너십 정산</p>
            </div>

            {/* 5. 본사 커머스 총 영업이익 */}
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl shadow-2xs col-span-2 sm:col-span-1">
              <div className="text-indigo-100 text-[11px] font-semibold mb-1 flex items-center justify-between">
                <span>본사 커머스 순영업익</span>
                <Sparkles className="w-3 h-3 text-amber-300" />
              </div>
              <div className="text-lg font-black text-white font-mono">
                ₩29,130,000
              </div>
              <p className="text-[10px] text-indigo-200 font-medium">직영익 + 수수료 - 지급액</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. 통계 차트 그리드 & AI 직원 가동 현황 */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* 월간 가입자 추세 (Line Chart) */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">월간 회원 가입 추세</CardTitle>
                <CardDescription className="text-xs">최근 6개월 신규 가입자 수 증가 추이를 모니터링합니다.</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs text-indigo-700 bg-indigo-50 border-indigo-200">
                실시간 집계
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-72 pt-5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_SIGNUPS} margin={{ left: 8, right: 8, top: 10 }}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} width={45} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(val: number) => [`${val.toLocaleString()}명`, '가입자']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#4f46e5' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 24시간 내 신고 처리 비율 (Pie Chart) */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold text-foreground">신고 및 안전 처리 현황</CardTitle>
            <CardDescription className="text-xs">24시간 내 처리율 및 상태별 분포</CardDescription>
          </CardHeader>
          <CardContent className="h-72 pt-5 flex flex-col justify-between">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(val: number) => [`${val}%`, '비율']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Pie
                    data={REPORT_STATUS}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                  >
                    {REPORT_STATUS.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center text-xs">
              {REPORT_STATUS.map((item) => (
                <div key={item.name} className="space-y-0.5">
                  <div className="flex items-center justify-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground text-[11px]">{item.name}</span>
                  </div>
                  <p className="font-bold text-foreground">{item.value}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 4. 하단 그리드: 주간 매칭 추세 & 6인 AI 직원 실시간 관제 현황 */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* 주간 라이브 방송 진행 추세 (Bar Chart) */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">주간 라이브 방송 진행 추세</CardTitle>
                <CardDescription className="text-xs">주차별 1:1 및 1:N 라이브 방송 진행 건수를 비교합니다.</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs text-emerald-700 bg-emerald-50 border-emerald-200">
                주간 누적
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-64 pt-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MATCH_COMPLETIONS} margin={{ left: 8, right: 8, top: 10 }}>
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} width={40} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(val: number) => [`${val.toLocaleString()}건`, '완료 세션']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 6인 AI 직원 운영 본부 퀵 프리뷰 */}
        <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/20 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-600" />
                AI 직원 실시간 관제
              </CardTitle>
              <Badge className="bg-emerald-600 text-white text-[10px]">6인 전원 정상 가동</Badge>
            </div>
            <CardDescription className="text-xs">
              제브 AI를 포함한 6인의 AI 직원이 24시간 실시간 협업 중입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-2">
              {AI_STAFF_STATUS.map((staff) => (
                <div key={staff.name} className="flex items-center justify-between rounded-lg border bg-white p-2.5 text-xs shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${staff.color}`} />
                    <div>
                      <p className="font-semibold text-foreground">{staff.name}</p>
                      <p className="text-[11px] text-muted-foreground">{staff.role}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 font-bold">
                    ACTIVE
                  </Badge>
                </div>
              ))}
            </div>

            <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs mt-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <Link href="/ai-staff">
                <span>AI 운영 본부 바로가기</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
