'use client'

import { useCallback, useEffect, useState } from 'react'
import { Activity, Loader2, RefreshCcw, Shield, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import {
  getApiManagerSnapshot,
  updateApiEndpoint,
  type ApiEndpointInfo,
  type ApiManagerSnapshot,
} from '@/lib/api'
import type { AxiosError } from 'axios'

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700',
  POST: 'bg-blue-100 text-blue-700',
  PATCH: 'bg-amber-100 text-amber-700',
  PUT: 'bg-violet-100 text-violet-700',
  DELETE: 'bg-red-100 text-red-700',
}

const MODULE_OPTIONS = ['전체', 'Discover', 'Users', 'Posts', 'Chats', 'Follows', 'Interests', 'Live', 'Notifications', 'Store']

export default function ApiManagerPage() {
  const { toast } = useToast()

  const [snapshot, setSnapshot] = useState<ApiManagerSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('전체')

  const loadSnapshot = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getApiManagerSnapshot()
      setSnapshot(data)
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '데이터를 불러오지 못했습니다.'
      toast({ title: '로드 실패', description: String(message), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadSnapshot()
  }, [loadSnapshot])

  const handleToggleEnabled = async (ep: ApiEndpointInfo) => {
    setUpdatingId(ep.id)
    try {
      const updated = await updateApiEndpoint(ep.id, { enabled: !ep.enabled })
      setSnapshot((prev) =>
        prev
          ? {
              ...prev,
              endpoints: prev.endpoints.map((e) => (e.id === ep.id ? updated : e)),
            }
          : prev,
      )
      toast({ title: '엔드포인트 상태 변경', description: `${ep.path} — ${updated.enabled ? '활성화' : '비활성화'}됐습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '변경에 실패했습니다.'
      toast({ title: '변경 실패', description: String(message), variant: 'destructive' })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRateLimitChange = async (ep: ApiEndpointInfo, value: number) => {
    if (isNaN(value) || value < 1) return
    setUpdatingId(ep.id)
    try {
      const updated = await updateApiEndpoint(ep.id, { rateLimitPerMin: value })
      setSnapshot((prev) =>
        prev
          ? { ...prev, endpoints: prev.endpoints.map((e) => (e.id === ep.id ? updated : e)) }
          : prev,
      )
      toast({ title: 'Rate Limit 변경', description: `${ep.path} — ${value}req/min으로 설정됐습니다.` })
    } catch {
      toast({ title: '변경 실패', description: 'Rate limit을 변경하지 못했습니다.', variant: 'destructive' })
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = (snapshot?.endpoints ?? []).filter((ep) => {
    const matchSearch =
      !search.trim() ||
      ep.path.toLowerCase().includes(search.toLowerCase()) ||
      ep.description.toLowerCase().includes(search.toLowerCase())
    const matchModule = moduleFilter === '전체' || ep.module === moduleFilter
    return matchSearch && matchModule
  })

  const activeCount = (snapshot?.endpoints ?? []).filter((ep) => ep.enabled).length
  const totalCount = snapshot?.endpoints.length ?? 0

  return (
    <div className="space-y-6">
      {/* 상단 통계 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">활성 엔드포인트</p>
                <p className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : `${activeCount} / ${totalCount}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">24시간 총 요청</p>
                <p className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (snapshot?.totalRequests24h ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">24시간 에러율</p>
                <p className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : `${snapshot?.errorRate24h ?? 0}%`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 엔드포인트 테이블 */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>API 엔드포인트 관리</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              각 엔드포인트의 활성 상태와 Rate Limit을 관리합니다.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => void loadSnapshot()} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            새로고침
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 필터 */}
          <div className="flex flex-wrap gap-3">
            <Input
              className="w-full sm:w-[240px]"
              placeholder="경로 또는 설명 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODULE_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 엔드포인트 목록 */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">검색 결과가 없습니다.</p>
            ) : (
              filtered.map((ep) => (
                <div
                  key={ep.id}
                  className={`rounded-md border p-3 transition-opacity ${!ep.enabled ? 'opacity-60' : ''}`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 text-xs font-mono font-bold ${METHOD_COLORS[ep.method] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {ep.method}
                      </span>
                      <code className="text-sm font-mono">{ep.path}</code>
                      <span className="rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {ep.module}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Rate Limit 입력 */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">req/min</span>
                        <Input
                          type="number"
                          min={1}
                          max={1000}
                          className="h-7 w-20 text-xs text-center"
                          defaultValue={ep.rateLimitPerMin}
                          onBlur={(e) => {
                            const v = parseInt(e.target.value, 10)
                            if (v !== ep.rateLimitPerMin) void handleRateLimitChange(ep, v)
                          }}
                          disabled={updatingId === ep.id}
                        />
                      </div>
                      {/* Enable/Disable 토글 */}
                      <div className="flex items-center gap-1">
                        {ep.enabled ? (
                          <ToggleRight className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Switch
                          checked={ep.enabled}
                          disabled={updatingId === ep.id}
                          onCheckedChange={() => void handleToggleEnabled(ep)}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{ep.description}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 안내 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">관리 안내</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• <strong>Rate Limit</strong>: 분당 최대 요청 수를 조정합니다. 실제 적용은 API 서버 재시작 후 반영됩니다.</p>
          <p>• <strong>활성 토글</strong>: 비활성화하면 해당 엔드포인트가 503을 반환합니다. (실서버 적용 필요)</p>
          <p>• 엔드포인트 목록은 현재 정적으로 관리됩니다. 동적 관리 기능은 추후 구현 예정입니다.</p>
        </CardContent>
      </Card>
    </div>
  )
}
