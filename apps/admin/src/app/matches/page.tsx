'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  activateMatchPreset,
  createMatchQuickFilter,
  deleteMatchQuickFilter,
  duplicateMatchPreset,
  getMatchControlPanelSnapshot,
  saveMatchHeatMemo,
  updateMatchPreset,
  updateMatchRecommendationPool,
  type MatchControlPanelSnapshot,
  type MatchHeatRegion,
  type MatchPreset,
  type MatchQuickFilter,
  type MatchQueueStat,
  type MatchRecommendationPool,
} from '@/lib/api'
import type { AxiosError } from 'axios'

const FALLBACK_SNAPSHOT: MatchControlPanelSnapshot = {
  queueStats: [
    { id: 'SEG-1', segment: '서울 20대', waiting: 128, medianWait: '00:42', dropOffRate: '4.2%' },
    { id: 'SEG-2', segment: '부산 취향 모임', waiting: 76, medianWait: '01:18', dropOffRate: '6.8%' },
    { id: 'SEG-3', segment: '야간 이용자', waiting: 54, medianWait: '02:05', dropOffRate: '8.1%' },
    { id: 'SEG-4', segment: '신규 가입자', waiting: 192, medianWait: '00:58', dropOffRate: '5.6%' },
  ],
  presets: [
    {
      id: 'preset-balanced',
      name: '표준 밸런스',
      isActive: true,
      weights: { distance: 30, interest: 30, aiAffinity: 25, recency: 15 },
      createdAt: '2024-03-01',
      author: '이한별',
    },
    {
      id: 'preset-high-affinity',
      name: '관심사 우선',
      isActive: false,
      weights: { distance: 20, interest: 40, aiAffinity: 30, recency: 10 },
      createdAt: '2024-02-21',
      author: '박지원',
    },
  ],
  quickFilters: [
    { id: 'F1', label: '지금 접속중', segment: '접속중', description: '최근 5분 내 접속' },
    { id: 'F2', label: '근처 친구', segment: '가까운 거리', description: '5km 이내 사용자' },
    { id: 'F3', label: '20대 추천', segment: '연령대', description: '출생연도 1995~2005' },
    { id: 'F4', label: '같이 운동', segment: '의도', description: '관심사=운동, 등산' },
  ],
  recommendationPools: [
    {
      id: 'POOL1',
      title: 'HOT 추천',
      sortRule: '관심·대화수·포인트 지표',
      metrics: 'CTR 18.2%',
      owner: '추천팀',
    },
    {
      id: 'POOL2',
      title: '접속중',
      sortRule: '최근 접속 순',
      metrics: '세션 유지율 72%',
      owner: '플랫폼',
    },
    {
      id: 'POOL3',
      title: '가까운 친구',
      sortRule: '거리 ASC + 활성도',
      metrics: '첫 메시지 전환 9%',
      owner: '추천팀',
    },
  ],
  heatRegions: [
    { id: 'HR-1', name: '서울 강남·서초', activeUsers: 1832, flagged: 6, trend: 'UP' },
    { id: 'HR-2', name: '부산 해운대', activeUsers: 684, flagged: 4, trend: 'FLAT' },
    { id: 'HR-3', name: '대구 수성', activeUsers: 412, flagged: 9, trend: 'DOWN' },
  ],
  memo: '',
}

const SEGMENT_OPTIONS = [
  { value: '접속중', label: '접속중' },
  { value: '가까운 거리', label: '가까운 거리' },
  { value: '연령대', label: '연령대' },
  { value: '의도', label: '의도' },
] as const

type SegmentValue = (typeof SEGMENT_OPTIONS)[number]['value']

type NewFilterState = {
  label: string
  segment: SegmentValue
  description: string
}

function formatNumber(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0'
  return value.toLocaleString()
}

function sumWeights(preset: MatchPreset | null | undefined) {
  if (!preset) return 0
  return Object.values(preset.weights ?? {}).reduce<number>((total, current) => {
    if (typeof current === 'number') {
      return total + current
    }
    return total
  }, 0)
}

function trendLabel(value?: string) {
  switch (value) {
    case 'UP':
      return '상승'
    case 'DOWN':
      return '하락'
    default:
      return '유지'
  }
}

export default function MatchesPage() {
  const { toast } = useToast()

  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false)
  const [queueStats, setQueueStats] = useState<MatchQueueStat[]>(FALLBACK_SNAPSHOT.queueStats)
  const [presets, setPresets] = useState<MatchPreset[]>(FALLBACK_SNAPSHOT.presets)
  const [quickFilters, setQuickFilters] = useState<MatchQuickFilter[]>(FALLBACK_SNAPSHOT.quickFilters)
  const [recommendationPools, setRecommendationPools] = useState<MatchRecommendationPool[]>(
    FALLBACK_SNAPSHOT.recommendationPools
  )
  const [heatRegions, setHeatRegions] = useState<MatchHeatRegion[]>(FALLBACK_SNAPSHOT.heatRegions)
  const [heatSummaryMemo, setHeatSummaryMemo] = useState(FALLBACK_SNAPSHOT.memo ?? '')
  const [initialHeatMemo, setInitialHeatMemo] = useState(FALLBACK_SNAPSHOT.memo ?? '')

  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    FALLBACK_SNAPSHOT.presets.find((preset) => preset.isActive)?.id ?? FALLBACK_SNAPSHOT.presets[0]?.id ?? ''
  )
  const [newFilter, setNewFilter] = useState<NewFilterState>({
    label: '',
    segment: SEGMENT_OPTIONS[0]?.value ?? '접속중',
    description: '',
  })

  const [isSavingPreset, setIsSavingPreset] = useState(false)
  const [isActivatingPreset, setIsActivatingPreset] = useState(false)
  const [isDuplicatingPreset, setIsDuplicatingPreset] = useState(false)
  const [isAddingFilter, setIsAddingFilter] = useState(false)
  const [removingFilterId, setRemovingFilterId] = useState<string | null>(null)
  const [updatingPoolId, setUpdatingPoolId] = useState<string | null>(null)
  const [isSavingHeatMemo, setIsSavingHeatMemo] = useState(false)

  const selectedPreset = useMemo(
    () => presets.find((item) => item.id === selectedPresetId) ?? presets[0] ?? null,
    [presets, selectedPresetId]
  )

  useEffect(() => {
    void loadSnapshot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadSnapshot() {
    setIsLoadingSnapshot(true)
    try {
      const snapshot = await getMatchControlPanelSnapshot()
      const nextQueue = snapshot.queueStats.length > 0 ? snapshot.queueStats : FALLBACK_SNAPSHOT.queueStats
      const nextPresets = snapshot.presets.length > 0 ? snapshot.presets : FALLBACK_SNAPSHOT.presets
      const nextFilters = snapshot.quickFilters.length > 0 ? snapshot.quickFilters : FALLBACK_SNAPSHOT.quickFilters
      const nextPools =
        snapshot.recommendationPools.length > 0 ? snapshot.recommendationPools : FALLBACK_SNAPSHOT.recommendationPools
      const nextRegions = snapshot.heatRegions.length > 0 ? snapshot.heatRegions : FALLBACK_SNAPSHOT.heatRegions

      setQueueStats(nextQueue)
      setPresets(nextPresets)
      setQuickFilters(nextFilters)
      setRecommendationPools(nextPools)
      setHeatRegions(nextRegions)
      setHeatSummaryMemo(snapshot.memo ?? '')
      setInitialHeatMemo(snapshot.memo ?? '')

      const activePreset = nextPresets.find((preset) => preset.isActive) ?? nextPresets[0]
      if (activePreset) {
        setSelectedPresetId(activePreset.id)
      }
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message =
        (ax?.response?.data as any)?.message ||
        ax?.message ||
        '매칭 정보를 불러오지 못했습니다. 기본 안내 데이터로 대체합니다.'
      toast({
        title: '매칭 패널 불러오기 실패',
        description: Array.isArray(message) ? message.join(', ') : String(message),
        variant: 'destructive',
      })
      setQueueStats(FALLBACK_SNAPSHOT.queueStats)
      setPresets(FALLBACK_SNAPSHOT.presets)
      setQuickFilters(FALLBACK_SNAPSHOT.quickFilters)
      setRecommendationPools(FALLBACK_SNAPSHOT.recommendationPools)
      setHeatRegions(FALLBACK_SNAPSHOT.heatRegions)
      setHeatSummaryMemo(FALLBACK_SNAPSHOT.memo ?? '')
      setInitialHeatMemo(FALLBACK_SNAPSHOT.memo ?? '')
    } finally {
      setIsLoadingSnapshot(false)
    }
  }

  const updatePresetWeight = (key: keyof MatchPreset['weights'], value: number) => {
    if (!selectedPreset) return
    const nextValue = Math.max(0, Math.min(100, Number.isNaN(value) ? 0 : value))
    setPresets((prev) =>
      prev.map((preset) =>
        preset.id === selectedPreset.id
          ? {
              ...preset,
              weights: {
                ...preset.weights,
                [key]: nextValue,
              },
            }
          : preset
      )
    )
  }

  const handleSavePreset = async () => {
    if (!selectedPreset) return
    setIsSavingPreset(true)
    try {
      const updated = await updateMatchPreset(selectedPreset.id, {
        name: selectedPreset.name,
        weights: selectedPreset.weights,
      })
      setPresets((prev) => prev.map((preset) => (preset.id === updated.id ? { ...preset, ...updated } : preset)))
      toast({ title: '프리셋 저장 완료', description: `${updated.name ?? '매칭 프리셋'} 설정이 저장되었습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '프리셋 저장 중 오류가 발생했습니다.'
      toast({ title: '프리셋 저장 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setIsSavingPreset(false)
    }
  }

  const handleActivatePreset = async (presetId: string) => {
    setIsActivatingPreset(true)
    try {
      const activated = await activateMatchPreset(presetId)
      setPresets((prev) => prev.map((preset) => ({ ...preset, isActive: preset.id === activated.id })))
      setSelectedPresetId(activated.id)
      toast({ title: '프리셋 활성화', description: `${activated.name ?? '선택한 프리셋'}이 실 서비스에 적용되었습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message =
        (ax?.response?.data as any)?.message || ax?.message || '프리셋 활성화 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
      toast({ title: '프리셋 활성화 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setIsActivatingPreset(false)
    }
  }

  const handleDuplicatePreset = async () => {
    if (!selectedPreset) return
    setIsDuplicatingPreset(true)
    try {
      const cloned = await duplicateMatchPreset(selectedPreset.id)
      setPresets((prev) => [...prev, cloned])
      setSelectedPresetId(cloned.id)
      toast({ title: '프리셋 사본 생성', description: `${cloned.name ?? '새 프리셋'}이 목록에 추가되었습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message =
        (ax?.response?.data as any)?.message || ax?.message || '프리셋을 복제하지 못했습니다. 권한을 확인한 뒤 다시 시도하세요.'
      toast({ title: '프리셋 복제 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setIsDuplicatingPreset(false)
    }
  }

  const handleAddFilter = async () => {
    if (!newFilter.label.trim()) {
      toast({ title: '필터 이름 필요', description: '슬롯에 표시할 문구를 입력해주세요.', variant: 'destructive' })
      return
    }
    setIsAddingFilter(true)
    try {
      const created = await createMatchQuickFilter({
        label: newFilter.label.trim(),
        segment: newFilter.segment,
        description: newFilter.description.trim() || undefined,
      })
      setQuickFilters((prev) => [created, ...prev])
      setNewFilter({ label: '', segment: newFilter.segment as SegmentValue, description: '' })
      toast({ title: '빠른 필터 추가', description: `${created.label ?? '새 필터'}가 홈 탐색에 노출될 준비가 되었습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message =
        (ax?.response?.data as any)?.message || ax?.message || '필터를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.'
      toast({ title: '필터 추가 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setIsAddingFilter(false)
    }
  }

  const handleRemoveFilter = async (filterId: string) => {
    setRemovingFilterId(filterId)
    try {
      await deleteMatchQuickFilter(filterId)
      setQuickFilters((prev) => prev.filter((filter) => filter.id !== filterId))
      toast({ title: '필터 삭제', description: '해당 빠른 필터가 탐색 화면에서 제거됩니다.' })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '필터 삭제에 실패했습니다.'
      toast({ title: '필터 삭제 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setRemovingFilterId(null)
    }
  }

  const handleUpdatePool = async (id: string, payload: Partial<MatchRecommendationPool>) => {
    setUpdatingPoolId(id)
    try {
      const updated = await updateMatchRecommendationPool(id, payload)
      setRecommendationPools((prev) => prev.map((pool) => (pool.id === updated.id ? { ...pool, ...updated } : pool)))
      toast({ title: '추천 풀 저장', description: `${updated.title ?? '추천 풀'} 설정이 업데이트되었습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '추천 풀 정보를 저장하지 못했습니다.'
      toast({ title: '추천 풀 저장 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setUpdatingPoolId(null)
    }
  }

  const handleHeatMemoBlur = async () => {
    if (heatSummaryMemo.trim() === initialHeatMemo.trim()) return
    setIsSavingHeatMemo(true)
    try {
      const saved = await saveMatchHeatMemo({ memo: heatSummaryMemo })
      setInitialHeatMemo(saved)
      toast({ title: '지역 메모 저장', description: '히트맵 메모가 저장되었습니다.' })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '메모를 저장하지 못했습니다.'
      toast({ title: '메모 저장 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setIsSavingHeatMemo(false)
    }
  }

  const presetTotal = sumWeights(selectedPreset)

  return (
    <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
      <section className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>실시간 매칭 대기열</CardTitle>
              <p className="text-sm text-muted-foreground">
                세그먼트별 대기 시간과 이탈률을 확인해 누구나 쉽게 운영 대응을 결정할 수 있도록 정리했습니다.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => void loadSnapshot()} disabled={isLoadingSnapshot}>
              {isLoadingSnapshot ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              새로고침
            </Button>
          </CardHeader>
          <CardContent>
            <div className="max-h-[320px] overflow-y-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">세그먼트</th>
                    <th className="px-4 py-2 font-medium">대기 인원</th>
                    <th className="px-4 py-2 font-medium">중앙값 대기</th>
                    <th className="px-4 py-2 font-medium">이탈률</th>
                  </tr>
                </thead>
                <tbody>
                  {queueStats.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-4 py-2 font-semibold">{row.segment ?? '미지정'}</td>
                      <td className="px-4 py-2">{formatNumber(row.waiting)}명</td>
                      <td className="px-4 py-2">{row.medianWait ?? '-'}</td>
                      <td className="px-4 py-2 text-red-600">{row.dropOffRate ?? '-'}</td>
                    </tr>
                  ))}
                  {queueStats.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                        표시할 대기열 데이터가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI 추천 가중치 프리셋</CardTitle>
            <p className="text-sm text-muted-foreground">
              거리·관심사·AI 적합도·최근 활동 비중을 슬라이더 대신 숫자로 조정해 가중치를 쉽게 비교하세요.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex flex-col gap-2 md:flex-row">
              <Select value={selectedPresetId} onValueChange={setSelectedPresetId}>
                <SelectTrigger className="md:w-[220px]">
                  <SelectValue placeholder="프리셋 선택" />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name ?? '이름 없는 프리셋'} {preset.isActive ? '(사용 중)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={handleDuplicatePreset} disabled={isDuplicatingPreset}>
                  {isDuplicatingPreset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  프리셋 복제
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleActivatePreset(selectedPreset?.id ?? '')}
                  disabled={!selectedPreset || isActivatingPreset}
                >
                  {isActivatingPreset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  활성화
                </Button>
                <Button size="sm" onClick={handleSavePreset} disabled={!selectedPreset || isSavingPreset}>
                  {isSavingPreset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  저장
                </Button>
              </div>
            </div>

            {selectedPreset ? (
              <div className="grid gap-3 md:grid-cols-2">
                {(
                  [
                    { key: 'distance', label: '거리 가중치' },
                    { key: 'interest', label: '관심사 적합도' },
                    { key: 'aiAffinity', label: 'AI 추천 점수' },
                    { key: 'recency', label: '최근 활동' },
                  ] as const
                ).map((item) => (
                  <div key={item.key} className="space-y-2">
                    <Label>{item.label}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={selectedPreset.weights[item.key] ?? 0}
                      onChange={(event) => updatePresetWeight(item.key, Number(event.target.value))}
                    />
                  </div>
                ))}
                <div className="md:col-span-2 rounded-md border p-3 text-xs text-muted-foreground">
                  <p>작성자: {selectedPreset.author ?? '미지정'}</p>
                  <p>생성일: {selectedPreset.createdAt ?? '-'}</p>
                  <p>총합: {presetTotal} (권장 100)</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">편집할 프리셋이 없습니다. 먼저 프리셋을 추가해주세요.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>홈 탐색 빠른 필터</CardTitle>
            <p className="text-sm text-muted-foreground">
              탐색 화면에 표시되는 버튼을 손쉽게 추가·삭제하여 누구나 원하는 실험을 진행할 수 있습니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>라벨</Label>
                <Input
                  value={newFilter.label}
                  onChange={(event) => setNewFilter((prev) => ({ ...prev, label: event.target.value }))}
                  placeholder="예: 지금 대화하기"
                />
              </div>
              <div className="space-y-2">
                <Label>세그먼트</Label>
                <Select
                  value={newFilter.segment}
                  onValueChange={(value: SegmentValue) => setNewFilter((prev) => ({ ...prev, segment: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEGMENT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>설명</Label>
                <Textarea
                  value={newFilter.description}
                  onChange={(event) => setNewFilter((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <Button size="sm" onClick={handleAddFilter} disabled={isAddingFilter}>
              {isAddingFilter && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              빠른 필터 추가
            </Button>

            <div className="max-h-[280px] overflow-y-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">라벨</th>
                    <th className="px-3 py-2 font-medium">세그먼트</th>
                    <th className="px-3 py-2 font-medium">설명</th>
                    <th className="px-3 py-2 font-medium">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {quickFilters.map((filter) => (
                    <tr key={filter.id} className="border-t">
                      <td className="px-3 py-2 font-semibold">{filter.label ?? '이름 없음'}</td>
                      <td className="px-3 py-2">{filter.segment ?? '-'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{filter.description ?? '-'}</td>
                      <td className="px-3 py-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleRemoveFilter(filter.id)}
                          disabled={removingFilterId === filter.id}
                        >
                          {removingFilterId === filter.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          삭제
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {quickFilters.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                        등록된 필터가 없습니다. 위에서 필터를 추가해보세요.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>추천 풀 현황</CardTitle>
            <p className="text-sm text-muted-foreground">
              HOT/Hype/근접 등 추천 풀의 정렬 기준과 대표 지표를 수정하면 즉시 추천 결과에 반영됩니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {recommendationPools.map((pool) => (
              <div key={pool.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{pool.title ?? '추천 풀'}</span>
                  <span className="text-muted-foreground">{pool.owner ?? '-'}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{pool.sortRule ?? '-'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                    {pool.metrics ?? '지표 준비 중'}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleUpdatePool(pool.id, { metrics: '업데이트 대기' })}
                    disabled={updatingPoolId === pool.id}
                  >
                    {updatingPoolId === pool.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    지표 새로고침
                  </Button>
                </div>
              </div>
            ))}
            {recommendationPools.length === 0 && (
              <p className="text-center text-muted-foreground">등록된 추천 풀이 없습니다.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>지역별 활성도 메모</CardTitle>
            <p className="text-sm text-muted-foreground">
              히트맵에 반영할 지역별 특이사항을 기록해 팀원 누구나 동일한 정보를 공유할 수 있도록 돕습니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="max-h-[220px] overflow-y-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">지역</th>
                    <th className="px-3 py-2 font-medium">활성 인원</th>
                    <th className="px-3 py-2 font-medium">플래그</th>
                    <th className="px-3 py-2 font-medium">추세</th>
                  </tr>
                </thead>
                <tbody>
                  {heatRegions.map((region) => (
                    <tr key={region.id} className="border-t">
                      <td className="px-3 py-2 font-semibold">{region.name ?? '미지정 지역'}</td>
                      <td className="px-3 py-2">{formatNumber(region.activeUsers)}명</td>
                      <td className="px-3 py-2 text-red-600">{formatNumber(region.flagged)}건</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{trendLabel(region.trend)}</td>
                    </tr>
                  ))}
                  {heatRegions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                        표시할 지역 데이터가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Textarea
              value={heatSummaryMemo}
              onChange={(event) => setHeatSummaryMemo(event.target.value)}
              onBlur={() => void handleHeatMemoBlur()}
              rows={3}
              placeholder="히트맵에 반영할 추가 메모를 남겨주세요."
            />
            {isSavingHeatMemo && <p className="text-xs text-muted-foreground">메모를 저장하고 있습니다…</p>}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
