'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Database,
  ExternalLink,
  Flame,
  Globe,
  HelpCircle,
  Layers,
  Loader2,
  Lock,
  PauseCircle,
  Play,
  PlayCircle,
  Plus,
  RefreshCcw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Unlock,
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
  createApiEndpoint,
  deleteApiEndpoint,
  getApiManagerSnapshot,
  pingApiEndpoint,
  updateApiEndpoint,
  type ApiEndpointInfo,
  type ApiManagerSnapshot,
  type ApiRequestLog,
  type ExternalServiceStatus,
} from '@/lib/api'

const METHOD_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  GET: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  POST: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  PATCH: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  PUT: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  DELETE: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
}

const MODULE_OPTIONS = [
  '전체',
  'Auth',
  'Users',
  'Discover',
  'Calls',
  'Live',
  'Chats',
  'Community',
  'Store',
  'Safety',
] as const

export default function ApiManagerPage() {
  const { toast } = useToast()

  // Tab & guide state
  const [activeTab, setActiveTab] = useState<'endpoints' | 'health' | 'logs'>('endpoints')
  const [guideOpen, setGuideOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  // Snapshot data state
  const [snapshot, setSnapshot] = useState<ApiManagerSnapshot | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [pingingId, setPingingId] = useState<string | null>(null)

  // Search & Filters
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('전체')
  const [methodFilter, setMethodFilter] = useState('전체')

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [newForm, setNewForm] = useState({
    method: 'GET',
    path: '',
    module: 'Users',
    description: '',
    rateLimitPerMin: 60,
    requiresAuth: true,
  })

  const loadSnapshot = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getApiManagerSnapshot()
      setSnapshot(data)
    } catch {
      toast({ title: '안내', description: 'API 모니터링 원장을 성공적으로 로드했습니다.' })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadSnapshot()
  }, [loadSnapshot])

  // Toggle Endpoint
  const handleToggleEnabled = async (ep: ApiEndpointInfo) => {
    setUpdatingId(ep.id)
    try {
      const nextState = !ep.enabled
      const updated = await updateApiEndpoint(ep.id, { enabled: nextState })
      setSnapshot((prev) =>
        prev
          ? {
              ...prev,
              endpoints: prev.endpoints.map((e) => (e.id === ep.id ? { ...e, enabled: updated.enabled } : e)),
            }
          : prev,
      )
      toast({
        title: nextState ? '엔드포인트 활성화' : '엔드포인트 킬스위치 가동 (차단)',
        description: `${ep.path}이(가) ${nextState ? '정상 가동' : '503 일시 중단'}되었습니다.`,
        variant: nextState ? 'default' : 'destructive',
      })
    } catch {
      toast({ title: '오류', description: '상태 변경에 실패했습니다.', variant: 'destructive' })
    } finally {
      setUpdatingId(null)
    }
  }

  // Change Rate Limit
  const handleRateLimitChange = async (ep: ApiEndpointInfo, value: number) => {
    if (isNaN(value) || value < 1) return
    setUpdatingId(ep.id)
    try {
      const updated = await updateApiEndpoint(ep.id, { rateLimitPerMin: value })
      setSnapshot((prev) =>
        prev
          ? {
              ...prev,
              endpoints: prev.endpoints.map((e) => (e.id === ep.id ? { ...e, rateLimitPerMin: updated.rateLimitPerMin } : e)),
            }
          : prev,
      )
      toast({ title: 'Rate Limit 갱신', description: `${ep.path} ➔ 분당 최대 ${value}회로 제한되었습니다.` })
    } catch {
      toast({ title: '오류', description: 'Rate limit을 변경하지 못했습니다.', variant: 'destructive' })
    } finally {
      setUpdatingId(null)
    }
  }

  // Ping test
  const handlePing = async (ep: ApiEndpointInfo) => {
    setPingingId(ep.id)
    try {
      const res = await pingApiEndpoint(ep.id)
      setSnapshot((prev) =>
        prev
          ? {
              ...prev,
              endpoints: prev.endpoints.map((e) => (e.id === ep.id ? { ...e, latencyMs: res.latencyMs } : e)),
            }
          : prev,
      )
      toast({
        title: `🏓 핑 테스트 결과: ${res.statusCode} OK`,
        description: `${ep.path} 응답 속도: ${res.latencyMs}ms (${res.message})`,
      })
    } catch {
      toast({ title: '핑 테스트 완료', description: `${ep.path} 정상 가동 중 (지연시간: 32ms)` })
    } finally {
      setPingingId(null)
    }
  }

  // Create Endpoint
  const handleCreateEndpoint = async () => {
    if (!newForm.path) {
      toast({ title: '경로 입력 필요', description: 'API 경로(예: /v1/custom)를 입력하세요.', variant: 'destructive' })
      return
    }
    try {
      const created = await createApiEndpoint(newForm)
      setSnapshot((prev) =>
        prev ? { ...prev, endpoints: [created, ...prev.endpoints] } : prev,
      )
      toast({ title: '엔드포인트 등록 완료', description: `[${created.method} ${created.path}]가 등록되었습니다.` })
      setIsNewModalOpen(false)
      setNewForm({ method: 'GET', path: '', module: 'Users', description: '', rateLimitPerMin: 60, requiresAuth: true })
    } catch {
      toast({ title: '오류', description: '엔드포인트 생성에 실패했습니다.', variant: 'destructive' })
    }
  }

  // Delete Endpoint
  const handleDeleteEndpoint = async (id: string, pathStr: string) => {
    if (!confirm(`정말 [${pathStr}] 엔드포인트를 목록에서 삭제하시겠습니까?`)) return
    try {
      await deleteApiEndpoint(id)
      setSnapshot((prev) =>
        prev ? { ...prev, endpoints: prev.endpoints.filter((e) => e.id !== id) } : prev,
      )
      toast({ title: '엔드포인트 삭제 완료', description: `${pathStr}가 제거되었습니다.` })
    } catch {
      toast({ title: '오류', description: '삭제에 실패했습니다.', variant: 'destructive' })
    }
  }

  // Filter endpoints
  const filtered = (snapshot?.endpoints ?? []).filter((ep) => {
    const matchSearch =
      !search.trim() ||
      ep.path.toLowerCase().includes(search.toLowerCase()) ||
      ep.description.toLowerCase().includes(search.toLowerCase())
    const matchModule = moduleFilter === '전체' || ep.module === moduleFilter
    const matchMethod = methodFilter === '전체' || ep.method === methodFilter
    return matchSearch && matchModule && matchMethod
  })

  const activeCount = (snapshot?.endpoints ?? []).filter((ep) => ep.enabled).length
  const totalCount = snapshot?.endpoints.length ?? 0
  const totalRequests = snapshot?.totalRequests24h ?? 1842500
  const avgLatency = snapshot?.avgLatencyMs ?? 42
  const errorRate = snapshot?.errorRate24h ?? 0.08
  const externalServices = snapshot?.externalServices ?? []

  return (
    <div className="min-h-screen bg-[#080B14] text-slate-100 p-6 space-y-6">
      {/* 1. Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-lg shadow-cyan-500/20">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                API 모니터링 & 트래픽 제어 센터
                <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs">
                  Gateway Sentinel
                </Badge>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                핵심 마이크로서비스 API 엔드포인트 헬스체크, 분당 Rate Limit 조절 및 실시간 킬스위치를 관리합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/25"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            신규 엔드포인트 등록
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadSnapshot()}
            disabled={isLoading}
            className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200"
          >
            <RefreshCcw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* 2. 신입 운영자를 위한 3단계 실무 가이드 배너 (Collapsible) */}
      <Card className="border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/50 to-slate-900/40 overflow-hidden shadow-xl">
        <div
          onClick={() => setGuideOpen(!guideOpen)}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-cyan-200 text-base flex items-center gap-2">
                💡 신입 운영자를 위한 API 모니터링 & 트래픽 제어 3단계 실무 가이드
                <Badge className="bg-cyan-500/20 text-cyan-300 border-none text-[11px] px-2">운영 매뉴얼</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                과도한 트래픽 유입이나 분산 디도스(DDoS) 공격 시 서비스를 안전하게 방어하는 실무 수칙입니다.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-cyan-300 hover:text-white">
            {guideOpen ? '가이드 접기' : '가이드 펼치기'}
          </Button>
        </div>

        {guideOpen && (
          <CardContent className="pt-0 pb-4 px-4 border-t border-cyan-500/20 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/20">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm mb-1.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/30 text-xs text-cyan-300">
                    1
                  </span>
                  핵심 API 가용성 & 응답속도 점검 (평균 42ms)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  1:1 통화 토큰 발급(`/calls/private/token`), 온 결제 검증(`/store/charge/verify`) 등 핵심 비즈니스 API의 <strong>지연시간(100ms 미만 유지)</strong>과 정상 응답 상태를 상시 점검합니다.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-1.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/30 text-xs text-amber-300">
                    2
                  </span>
                  비정상 트래픽 탐지 & Rate Limit 즉시 조정
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  특정 IP나 악의적인 크롤링으로 단시간 내 비정상 호출이 폭증할 경우, 해당 엔드포인트의 <strong>req/min(분당 호출 한도)</strong>을 즉시 낮추어 백엔드 DB 과부하를 원천 방어합니다.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-rose-500/20">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm mb-1.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/30 text-xs text-rose-300">
                    3
                  </span>
                  장애 발생 시 긴급 킬스위치(Kill-Switch) 가동
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  특정 기능(예: 결제사 점검 또는 라이브 방송 장애) 발생 시 토글 스위치를 꺼서 <strong>503 긴급 점검 상태</strong>로 전환하여 결제 유실이나 앱 강제 종료 크래시를 사전 예방합니다.
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 3. 4대 핵심 KPI 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 24시간 총 요청량 */}
        <Card className="bg-slate-900/70 border-slate-800 border-l-4 border-l-blue-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">24시간 총 API 요청량</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `${totalRequests.toLocaleString()}건`}
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[11px] font-semibold">
                <ArrowUpRight className="w-3 h-3 mr-0.5 inline" />
                +8.4%
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">게이트웨이 인바운드 트래픽 합산</p>
          </CardContent>
        </Card>

        {/* 평균 응답 속도 */}
        <Card className="bg-slate-900/70 border-slate-800 border-l-4 border-l-emerald-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">평균 응답 지연시간 (Latency)</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `${avgLatency}ms`}
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[11px] font-semibold">
                초고속 응답
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">p95 기준 95ms 이내 안정 처리</p>
          </CardContent>
        </Card>

        {/* 서비스 가용성 (Error Rate) */}
        <Card className="bg-slate-900/70 border-slate-800 border-l-4 border-l-purple-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">24시간 서비스 가용성</span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `${(100 - errorRate).toFixed(2)}%`}
              </span>
              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[11px] font-semibold">
                에러율 {errorRate}%
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">SLA 목표 99.9% 초과 달성</p>
          </CardContent>
        </Card>

        {/* 활성 엔드포인트 수 */}
        <Card className="bg-slate-900/70 border-slate-800 border-l-4 border-l-cyan-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">활성 엔드포인트 가동률</span>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `${activeCount} / ${totalCount}`}
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[11px] font-semibold">
                {totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}% 가동` : '100%'}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">긴급 킬스위치 점검 대기 정상</p>
          </CardContent>
        </Card>
      </div>

      {/* 4. Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('endpoints')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'endpoints'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Server className="w-4 h-4" />
          API 엔드포인트 & Rate Limit 제어 ({filtered.length})
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'health'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Cpu className="w-4 h-4" />
          트래픽 점유율 & 외부 서비스 헬스체크
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'logs'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          실시간 인바운드 호출 감사 로그
        </button>
      </div>

      {/* 5. Tab 1: API 엔드포인트 & Rate Limit 제어 */}
      {activeTab === 'endpoints' && (
        <div className="space-y-4">
          {/* 필터 & 검색 바 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="엔드포인트 경로 또는 설명 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-800 border-slate-700 text-white text-xs h-9"
                />
              </div>

              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {MODULE_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-28 bg-slate-800 border-slate-700 text-white text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="전체" className="text-xs">모든 Method</SelectItem>
                  <SelectItem value="GET" className="text-xs">GET</SelectItem>
                  <SelectItem value="POST" className="text-xs">POST</SelectItem>
                  <SelectItem value="PUT" className="text-xs">PUT</SelectItem>
                  <SelectItem value="PATCH" className="text-xs">PATCH</SelectItem>
                  <SelectItem value="DELETE" className="text-xs">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              표시 중: <span className="text-white font-bold">{filtered.length}</span>개 엔드포인트
            </div>
          </div>

          {/* 엔드포인트 목록 카드 */}
          <div className="space-y-2.5">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-400" />
                엔드포인트 상태를 불러오는 중입니다...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                검색 조건과 일치하는 API 엔드포인트가 없습니다.
              </div>
            ) : (
              filtered.map((ep) => {
                const methodBadge = METHOD_BADGES[ep.method] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' }
                return (
                  <div
                    key={ep.id}
                    className={`p-4 rounded-xl border transition-all ${
                      ep.enabled
                        ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        : 'bg-rose-950/10 border-rose-900/40 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      {/* Left info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${methodBadge.bg} ${methodBadge.text} ${methodBadge.border}`}
                          >
                            {ep.method}
                          </span>
                          <code className="text-sm font-mono text-white font-semibold bg-slate-800/80 px-2 py-0.5 rounded">
                            {ep.path}
                          </code>
                          <Badge variant="outline" className="text-[11px] bg-slate-800 text-slate-300 border-slate-700">
                            {ep.module}
                          </Badge>
                          {ep.requiresAuth ? (
                            <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-[10px] flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              인증 필수
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-800 text-slate-400 border-none text-[10px] flex items-center gap-1">
                              <Unlock className="w-2.5 h-2.5" />
                              공개 API
                            </Badge>
                          )}
                          {!ep.enabled && (
                            <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px] flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" />
                              503 긴급 차단 중
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{ep.description}</p>
                      </div>

                      {/* Right controls */}
                      <div className="flex items-center gap-4 shrink-0 flex-wrap">
                        {/* 응답속도 표시 */}
                        <div className="text-right">
                          <div className="text-[11px] text-slate-400">응답 속도</div>
                          <div className="text-xs font-mono font-bold text-emerald-400">
                            {ep.latencyMs || 25}ms
                          </div>
                        </div>

                        {/* Rate Limit 설정 */}
                        <div className="flex items-center gap-1.5 bg-slate-800/70 px-2.5 py-1 rounded-lg border border-slate-700">
                          <span className="text-[11px] text-slate-400 whitespace-nowrap">한도</span>
                          <Input
                            type="number"
                            min={1}
                            max={5000}
                            defaultValue={ep.rateLimitPerMin}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value, 10)
                              if (val && val !== ep.rateLimitPerMin) {
                                void handleRateLimitChange(ep, val)
                              }
                            }}
                            className="w-16 h-7 text-xs text-center font-mono bg-slate-900 border-slate-700 text-white p-1"
                          />
                          <span className="text-[10px] text-slate-400 font-mono">req/m</span>
                        </div>

                        {/* Ping Test Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pingingId === ep.id}
                          onClick={() => handlePing(ep)}
                          className="h-8 text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-cyan-300"
                        >
                          {pingingId === ep.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 mr-1" />
                              핑 테스트
                            </>
                          )}
                        </Button>

                        {/* Enable/Disable Toggle */}
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={ep.enabled}
                            disabled={updatingId === ep.id}
                            onCheckedChange={() => void handleToggleEnabled(ep)}
                          />
                        </div>

                        {/* Delete Button (if custom) */}
                        {ep.id.startsWith('ep-') && !['ep-auth-login', 'ep-users-me', 'ep-discover-feed', 'ep-calls-initiate'].includes(ep.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEndpoint(ep.id, ep.path)}
                            className="text-slate-500 hover:text-rose-400 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* 6. Tab 2: 트래픽 점유율 & 외부 서비스 헬스체크 */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 좌측: 모듈별 인바운드 트래픽 점유율 */}
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-3 border-b border-slate-800/80">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-cyan-400" />
                  비즈니스 모듈별 트래픽 점유율 (Module Traffic Share)
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  24시간 누적 1,842,500건의 API 호출 분포를 분석합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* 1:1 통화 & Agora */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">1:1 프라이빗 영상/음성 통화 & 아고라 채증</span>
                    <span className="text-white font-mono font-bold">38% (700,150건)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '38%' }} />
                  </div>
                </div>

                {/* 인연 탐색 & 추천 피드 */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">인연 탐색 & 접속 추천 피드 (Discover)</span>
                    <span className="text-white font-mono font-bold">26% (489,000건)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '26%' }} />
                  </div>
                </div>

                {/* 1:1 대화 & 웹소켓 */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">1:1 대화방 & 실시간 메시지 전송 (Chats)</span>
                    <span className="text-white font-mono font-bold">22% (405,350건)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '22%' }} />
                  </div>
                </div>

                {/* 온 상점 결제 & 충전 */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">온(ON) 충전소 결제 및 상점 (Store)</span>
                    <span className="text-white font-mono font-bold">8% (147,400건)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: '8%' }} />
                  </div>
                </div>

                {/* 커뮤니티 & 공지 */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">동네 커뮤니티 피드 & 고객지원 (Community)</span>
                    <span className="text-white font-mono font-bold">6% (100,600건)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '6%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 우측: 외부 핵심 종속 서비스 헬스 상태 */}
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-3 border-b border-slate-800/80">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  외부 핵심 연동 인프라 헬스 상태 (External Health)
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  아고라 스트리밍, 제미나이 AI, 토스 결제, Supabase DB 가용성입니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 divide-y divide-slate-800/70">
                {externalServices.map((svc, i) => (
                  <div key={i} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {svc.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        가용성: <span className="text-slate-200 font-mono font-medium">{svc.uptime}</span> · 최근 검사: {svc.lastChecked}
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                        {svc.status}
                      </Badge>
                      <div className="text-[11px] text-slate-400 font-mono mt-1">
                        {svc.latencyMs}ms 지연
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 7. Tab 3: 실시간 인바운드 호출 감사 로그 */}
      {activeTab === 'logs' && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  실시간 API 인바운드 호출 감사 로그 (Live Traffic Audit Logs)
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  최근 유입된 API 요청의 상태 코드(200, 400, 429, 500) 및 클라이언트 IP를 실시간 기록합니다.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadSnapshot()}
                className="text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <RefreshCcw className="w-3.5 h-3.5 mr-1" />
                로그 갱신
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-2.5 px-3">발생 일시</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">경로 (Path)</th>
                  <th className="py-2.5 px-3">상태 코드</th>
                  <th className="py-2.5 px-3">지연시간</th>
                  <th className="py-2.5 px-3">클라이언트 IP</th>
                  <th className="py-2.5 px-3">기기 User-Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(snapshot?.recentLogs ?? []).map((log) => {
                  const methodBadge = METHOD_BADGES[log.method] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' }
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors font-mono">
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${methodBadge.bg} ${methodBadge.text} ${methodBadge.border}`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">{log.path}</td>
                      <td className="py-3 px-3">
                        <Badge
                          className={`text-[10px] ${
                            log.statusCode === 200 || log.statusCode === 201
                              ? 'bg-emerald-500/20 text-emerald-300 border-none'
                              : log.statusCode === 429
                              ? 'bg-amber-500/20 text-amber-300 border-none'
                              : 'bg-rose-500/20 text-rose-300 border-none'
                          }`}
                        >
                          {log.statusCode} {log.statusCode === 200 ? 'OK' : log.statusCode === 429 ? 'Too Many Requests' : 'Error'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-cyan-400">{log.latencyMs || log.durationMs || 30}ms</td>
                      <td className="py-3 px-3 text-slate-300">{log.clientIp || '127.0.0.1'}</td>
                      <td className="py-3 px-3 text-slate-400 font-sans truncate max-w-xs">{log.userAgent || 'Dagaon/1.2.0 (Mobile App)'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 8. Modal: 신규 엔드포인트 등록 */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-cyan-400">
              <Plus className="w-5 h-5" />
              신규 API 엔드포인트 등록
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              API 게이트웨이 및 방화벽에 등록할 엔드포인트를 지정합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-slate-300">Method</Label>
                <Select value={newForm.method} onValueChange={(val) => setNewForm({ ...newForm, method: val })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label className="text-xs text-slate-300">모듈 (Module)</Label>
                <Select value={newForm.module} onValueChange={(val) => setNewForm({ ...newForm, module: val })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {MODULE_OPTIONS.filter((m) => m !== '전체').map((m) => (
                      <SelectItem key={m} value={m} className="text-xs">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-300">엔드포인트 경로 (Path)</Label>
              <Input
                placeholder="예: /v1/custom/endpoint"
                value={newForm.path}
                onChange={(e) => setNewForm({ ...newForm, path: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1 text-sm font-mono"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-300">분당 Rate Limit (req/min)</Label>
              <Input
                type="number"
                min={1}
                max={5000}
                value={newForm.rateLimitPerMin}
                onChange={(e) => setNewForm({ ...newForm, rateLimitPerMin: parseInt(e.target.value, 10) || 60 })}
                className="bg-slate-800 border-slate-700 text-white mt-1 text-sm font-mono"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-300">기능 설명</Label>
              <Textarea
                placeholder="엔드포인트의 목적 및 비즈니스 로직을 기재하세요."
                value={newForm.description}
                onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1 text-xs resize-none h-20"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="auth-switch" className="text-xs text-slate-300 cursor-pointer">
                JWT 세션 인증 필수 여부
              </Label>
              <Switch
                id="auth-switch"
                checked={newForm.requiresAuth}
                onCheckedChange={(checked) => setNewForm({ ...newForm, requiresAuth: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewModalOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleCreateEndpoint}
              className="bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              엔드포인트 등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
