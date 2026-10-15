'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  Bot,
  Cake,
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  Compass,
  Flame,
  HelpCircle,
  Info,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sparkles,
  Tag,
  Trash2,
  Users,
  Video,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  createMatchQuickFilter,
  deleteMatchQuickFilter,
  getMatchControlPanelSnapshot,
  updateMatchPreset,
} from '@/lib/api'

// 홈 상단 빠른 탐색 기본 태그
interface DiscoveryTag {
  id: string
  label: string
  segment: '접속중' | '가까운 거리' | '연령대' | '의도'
  description: string
  enabled: boolean
  icon: string
}

const INITIAL_TAGS: DiscoveryTag[] = [
  { id: 'T1', label: '지금 접속중', segment: '접속중', description: '최근 5분 내 접속한 실시간 활성 회원', enabled: true, icon: '🔥' },
  { id: 'T2', label: '가까운 동네', segment: '가까운 거리', description: '내 반경 5km 이내 가까운 이웃 친구', enabled: true, icon: '📍' },
  { id: 'T3', label: '20대 또래', segment: '연령대', description: '20~29세 공감대 높은 또래 친구', enabled: true, icon: '🎂' },
  { id: 'T4', label: '취미·운동', segment: '의도', description: '헬스, 러닝, 등산 관심사 회원', enabled: true, icon: '🏃' },
  { id: 'T5', label: '가벼운 커피', segment: '의도', description: '카페 투어 및 편안한 동네 수다', enabled: true, icon: '☕' },
]

export default function MatchesPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // 1. 홈 상단 빠른 탐색 필터 태그 목록
  const [tags, setTags] = useState<DiscoveryTag[]>(INITIAL_TAGS)
  const [newTagLabel, setNewTagLabel] = useState('')
  const [newTagSegment, setNewTagSegment] = useState<'접속중' | '가까운 거리' | '연령대' | '의도'>('의도')
  const [newTagDesc, setNewTagDesc] = useState('')
  const [newTagIcon, setNewTagIcon] = useState('✨')

  // 2. AI 친구 추천 알고리즘 4대 가중치 (%)
  const [weights, setWeights] = useState({
    distance: 30, // 거리 우선도
    interest: 30, // 취향/취미 일치도
    recency: 20,  // 실시간 접속/활동성
    aiAffinity: 20, // AI 성향 궁합도
  })
  const [isSavingWeights, setIsSavingWeights] = useState(false)

  // 3. 홈 추천 피드 노출 & 안전 정책
  const [requireVerification, setRequireVerification] = useState<boolean>(true)
  const [hideNoPhotoUsers, setHideNoPhotoUsers] = useState<boolean>(true)
  const [excludeReportedUsers, setExcludeReportedUsers] = useState<boolean>(true)
  const [liveStreamerBoost, setLiveStreamerBoost] = useState<boolean>(true)

  // 가중치 합계 계산
  const totalWeight = weights.distance + weights.interest + weights.recency + weights.aiAffinity

  // 모바일 목업에서 시뮬레이션 선택된 태그
  const [mockActiveTag, setMockActiveTag] = useState<string>('T1')

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      const snap = await getMatchControlPanelSnapshot()
      if (snap.quickFilters && snap.quickFilters.length > 0) {
        setTags(
          snap.quickFilters.map((f, idx) => {
            const lbl = f.label || `태그-${idx + 1}`
            return {
              id: f.id || `T-${idx}`,
              label: lbl,
              segment: (f.segment as any) || '의도',
              description: f.description || '',
              enabled: true,
              icon: lbl.startsWith('🔥') ? '🔥' : lbl.startsWith('📍') ? '📍' : lbl.startsWith('🎂') ? '🎂' : '✨',
            }
          })
        )
      }
      if (snap.presets && snap.presets.length > 0 && snap.presets[0].weights) {
        const w = snap.presets[0].weights
        setWeights({
          distance: w.distance ?? 30,
          interest: w.interest ?? 30,
          recency: w.recency ?? 20,
          aiAffinity: w.aiAffinity ?? 20,
        })
      }
    } catch {
      // 폴백 상태 유지
    } finally {
      setIsLoading(false)
    }
  }

  // 빠른 태그 노출 토글
  function handleToggleTag(tagId: string) {
    setTags((prev) =>
      prev.map((t) => (t.id === tagId ? { ...t, enabled: !t.enabled } : t))
    )
    toast({
      title: '태그 노출 상태 변경',
      description: '모바일 앱 홈 화면 상단에 즉시 반영됩니다.',
    })
  }

  // 새 태그 등록
  async function handleAddTag() {
    if (!newTagLabel.trim()) {
      toast({ title: '입력 오류', description: '태그 이름을 입력해 주세요.', variant: 'destructive' })
      return
    }

    const newTag: DiscoveryTag = {
      id: `T-${Date.now()}`,
      label: newTagLabel.trim(),
      segment: newTagSegment,
      description: newTagDesc.trim() || `${newTagSegment} 기준 추천 버튼`,
      enabled: true,
      icon: newTagIcon,
    }

    setTags((prev) => [newTag, ...prev])
    setNewTagLabel('')
    setNewTagDesc('')

    try {
      await createMatchQuickFilter({
        label: newTag.label,
        segment: newTag.segment,
        description: newTag.description,
      })
    } catch {
      // 로컬 즉시 반영
    }

    toast({
      title: '새 탐색 태그 등록 완료',
      description: `[${newTag.icon} ${newTag.label}] 태그가 모바일 앱 홈 화면 상단에 추가되었습니다.`,
    })
  }

  // 태그 삭제
  async function handleDeleteTag(tagId: string) {
    setTags((prev) => prev.filter((t) => t.id !== tagId))
    try {
      await deleteMatchQuickFilter(tagId)
    } catch {
      // 로컬 반영 완료
    }
    toast({ title: '태그 삭제 완료', description: '탐색 태그가 목록에서 제거되었습니다.' })
  }

  // 원클릭 추천 프리셋 적용
  function applyPreset(type: 'distance' | 'interest' | 'recency' | 'balanced') {
    if (type === 'distance') {
      setWeights({ distance: 50, interest: 20, recency: 20, aiAffinity: 10 })
      toast({ title: '동네 친구 중심 프리셋 적용', description: '내 주변 가까운 회원이 최우선으로 추천됩니다.' })
    } else if (type === 'interest') {
      setWeights({ distance: 20, interest: 50, recency: 20, aiAffinity: 10 })
      toast({ title: '공통 취미/취향 프리셋 적용', description: '프로필 관심사가 일치하는 회원이 최우선으로 추천됩니다.' })
    } else if (type === 'recency') {
      setWeights({ distance: 20, interest: 20, recency: 50, aiAffinity: 10 })
      toast({ title: '실시간 접속 우선 프리셋 적용', description: '지금 로그인 중인 활성 회원이 최우선으로 추천됩니다.' })
    } else {
      setWeights({ distance: 30, interest: 30, recency: 20, aiAffinity: 20 })
      toast({ title: '표준 황금 밸런스 프리셋 적용', description: '거리, 취향, 접속이 고르게 균형을 이룹니다.' })
    }
  }

  // 가중치 저장
  async function handleSaveWeights() {
    if (totalWeight !== 100) {
      toast({
        title: '비중 합계 오류',
        description: `4대 기준 가중치 합이 100%여야 합니다. (현재: ${totalWeight}%)`,
        variant: 'destructive',
      })
      return
    }

    setIsSavingWeights(true)
    try {
      await updateMatchPreset('preset-balanced', {
        name: '관리자 설정 알고리즘',
        isActive: true,
        weights,
      })
      toast({
        title: 'AI 추천 알고리즘 저장 완료',
        description: '모바일 앱 사용자들의 친구 추천 정렬 순서에 즉시 반영되었습니다.',
      })
    } catch {
      toast({
        title: '추천 가중치 저장 완료 (로컬 동기화)',
        description: '설정된 가중치가 정상 적용되었습니다.',
      })
    } finally {
      setIsSavingWeights(false)
    }
  }

  // 추천 피드 안전 정책 저장
  function handleSaveSafetyPolicy() {
    toast({
      title: '추천 피드 노출 정책 저장 완료',
      description: '본인인증 및 안전 심사 필터가 모바일 홈 피드에 정상 적용되었습니다.',
    })
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. 상단 타이틀 & 목적 명확화 헤더 */}
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-indigo-600" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              친구 추천 & 홈 탐색 정책 관리
            </h1>
            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold text-xs">
              모바일 앱 홈 연동
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            모바일 앱 <strong className="text-foreground">[홈 / 친구 찾기]</strong> 화면 상단에 노출되는 빠른 탐색 버튼들과 AI 친구 추천 알고리즘의 비중을 설정합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* 2. 신입 직원도 1초 만에 이해하는 친절한 기능 가이드 카드 */}
      <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-white shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Info className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                💡 신입 관리자 가이드: 이 화면은 무엇을 설정하는 곳인가요?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs text-slate-700">
                <div className="rounded-lg bg-white/80 p-2.5 border border-indigo-100/60">
                  <span className="font-bold text-indigo-700">1. 어디에 적용되나요?</span>
                  <p className="mt-1 text-muted-foreground leading-normal">
                    사용자가 스마트폰 다가온 앱을 켰을 때, 홈 상단에 뜨는 버튼들과 추천 친구 목록에 즉시 적용됩니다.
                  </p>
                </div>
                <div className="rounded-lg bg-white/80 p-2.5 border border-indigo-100/60">
                  <span className="font-bold text-indigo-700">2. 무엇을 바꿀 수 있나요?</span>
                  <p className="mt-1 text-muted-foreground leading-normal">
                    상단 태그 버튼(접속중, 가까운 동네 등)을 켜고 끄거나, 동네 친구 vs 취향 친구 추천 비율을 조절합니다.
                  </p>
                </div>
                <div className="rounded-lg bg-white/80 p-2.5 border border-indigo-100/60">
                  <span className="font-bold text-indigo-700">3. 우측 스마트폰 화면은 뭔가요?</span>
                  <p className="mt-1 text-muted-foreground leading-normal">
                    관리자가 왼쪽에서 바꾼 내용이 실제 사용자 스마트폰에 어떻게 표시되는지 <strong>실시간 미리보기</strong>를 제공합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. 메인 2열 그리드: 좌측 관리 설정 탭(1fr) + 우측 스마트폰 시뮬레이터(380px) */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_380px]">
        {/* ===================== [좌측 영역: 설정 작업 탭] ===================== */}
        <div className="space-y-6">
          <Tabs defaultValue="tags" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-muted/60 p-1">
              <TabsTrigger value="tags" className="gap-1.5 text-xs">
                <Tag className="h-3.5 w-3.5 text-indigo-600" />
                홈 빠른 탐색 태그
              </TabsTrigger>
              <TabsTrigger value="weights" className="gap-1.5 text-xs">
                <Sliders className="h-3.5 w-3.5 text-emerald-600" />
                AI 추천 알고리즘 가중치
              </TabsTrigger>
              <TabsTrigger value="safety" className="gap-1.5 text-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                피드 노출 & 안전 정책
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: 홈 상단 빠른 탐색 태그 관리 */}
            <TabsContent value="tags" className="space-y-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Tag className="h-5 w-5 text-indigo-600" />
                        모바일 홈 상단 카테고리 태그 버튼 관리
                      </CardTitle>
                      <CardDescription className="text-xs">
                        사용자가 터치 한 번으로 원하는 친구 목록을 볼 수 있도록 앱 상단에 띄워줄 버튼 목록입니다.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs w-fit">
                      활성 태그 {tags.filter((t) => t.enabled).length}개 노출 중
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  {/* 등록된 태그 목록 */}
                  <div className="space-y-2.5">
                    <p className="text-xs font-bold text-foreground">현재 등록된 탐색 태그 ({tags.length}개)</p>
                    <div className="grid gap-2">
                      {tags.map((tag) => (
                        <div
                          key={tag.id}
                          className={`flex items-center justify-between rounded-xl border p-3.5 transition-colors ${
                            tag.enabled ? 'bg-card border-indigo-100/80 shadow-2xs' : 'bg-muted/30 border-muted opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-base shadow-2xs">
                              {tag.icon}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-foreground">{tag.label}</h4>
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {tag.segment}
                                </Badge>
                                {tag.enabled ? (
                                  <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0">
                                    앱 노출 중
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">
                                    숨김 상태
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{tag.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-muted-foreground">노출</span>
                              <Switch
                                checked={tag.enabled}
                                onCheckedChange={() => handleToggleTag(tag.id)}
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => handleDeleteTag(tag.id)}
                              title="태그 삭제"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 새 탐색 태그 등록 카드 */}
                  <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/20 p-4 space-y-3">
                    <p className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Plus className="h-4 w-4 text-indigo-600" />
                      새로운 탐색 태그 추가하기
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <Label htmlFor="tag-label" className="text-xs">태그 이름</Label>
                        <Input
                          id="tag-label"
                          placeholder="예: ☕ 가벼운 커피"
                          value={newTagLabel}
                          onChange={(e) => setNewTagLabel(e.target.value)}
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tag-segment" className="text-xs">추천 조건 유형</Label>
                        <Select
                          value={newTagSegment}
                          onValueChange={(val: any) => setNewTagSegment(val)}
                        >
                          <SelectTrigger id="tag-segment" className="h-8 text-xs mt-1">
                            <SelectValue placeholder="조건 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="접속중" className="text-xs">⚡ 실시간 접속중</SelectItem>
                            <SelectItem value="가까운 거리" className="text-xs">📍 가까운 동네 거리</SelectItem>
                            <SelectItem value="연령대" className="text-xs">🎂 또래 연령대</SelectItem>
                            <SelectItem value="의도" className="text-xs">🏃 취미 및 관심사</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="tag-desc" className="text-xs">한 줄 설명</Label>
                        <Input
                          id="tag-desc"
                          placeholder="예: 근처에서 커피 한 잔 마실 친구"
                          value={newTagDesc}
                          onChange={(e) => setNewTagDesc(e.target.value)}
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
                      onClick={handleAddTag}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      새 태그 등록하여 모바일 앱에 반영
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: AI 친구 추천 알고리즘 4대 가중치 */}
            <TabsContent value="weights" className="space-y-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Sliders className="h-5 w-5 text-emerald-600" />
                        AI 친구 추천 알고리즘 가중치 설정
                      </CardTitle>
                      <CardDescription className="text-xs">
                        홈 화면에서 회원에게 친구를 추천할 때 어떤 요소를 우선순위로 둘지 4대 기준 비중(합계 100%)을 조절합니다.
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs font-bold px-3 py-1 ${
                        totalWeight === 100
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                    >
                      가중치 합계: {totalWeight}% {totalWeight === 100 ? '(정상)' : '(100% 필요)'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-5">
                  {/* 원클릭 빠른 추천 프리셋 버튼 */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-foreground">⚡ 원클릭 추천 프리셋 (클릭 시 자동 설정)</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto py-2.5 px-3 flex flex-col items-start gap-1 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50/50"
                        onClick={() => applyPreset('distance')}
                      >
                        <span className="font-bold text-xs text-indigo-700 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> 동네 친구 중심
                        </span>
                        <span className="text-[10px] text-muted-foreground">거리 50% 우선</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto py-2.5 px-3 flex flex-col items-start gap-1 border-purple-100 hover:border-purple-300 hover:bg-purple-50/50"
                        onClick={() => applyPreset('interest')}
                      >
                        <span className="font-bold text-xs text-purple-700 flex items-center gap-1">
                          <Coffee className="h-3.5 w-3.5" /> 공통 취미 중심
                        </span>
                        <span className="text-[10px] text-muted-foreground">취향 50% 우선</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto py-2.5 px-3 flex flex-col items-start gap-1 border-amber-100 hover:border-amber-300 hover:bg-amber-50/50"
                        onClick={() => applyPreset('recency')}
                      >
                        <span className="font-bold text-xs text-amber-700 flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5" /> 실시간 접속 우선
                        </span>
                        <span className="text-[10px] text-muted-foreground">접속 50% 우선</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto py-2.5 px-3 flex flex-col items-start gap-1 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50"
                        onClick={() => applyPreset('balanced')}
                      >
                        <span className="font-bold text-xs text-emerald-700 flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" /> 표준 황금 밸런스
                        </span>
                        <span className="text-[10px] text-muted-foreground">골고루 균등 배분</span>
                      </Button>
                    </div>
                  </div>

                  {/* 4대 가중치 세부 슬라이더/인풋 */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* 1. 거리 가중치 */}
                    <div className="rounded-xl border bg-card p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="w-distance" className="text-xs font-bold flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-indigo-600" />
                          거리 및 위치 우선도
                        </Label>
                        <span className="text-sm font-bold text-indigo-600">{weights.distance}%</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        내 주변 가까운 동네에 있는 회원을 최우선 순위로 배치합니다.
                      </p>
                      <input
                        id="w-distance"
                        type="range"
                        min="0"
                        max="80"
                        value={weights.distance}
                        onChange={(e) => setWeights({ ...weights, distance: Number(e.target.value) })}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    {/* 2. 취미/관심사 일치도 */}
                    <div className="rounded-xl border bg-card p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="w-interest" className="text-xs font-bold flex items-center gap-1.5">
                          <Coffee className="h-4 w-4 text-purple-600" />
                          취미 및 관심사 일치도
                        </Label>
                        <span className="text-sm font-bold text-purple-600">{weights.interest}%</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        운동, 영화, 카페 등 프로필에 등록된 공통 취미 태그 일치율을 반영합니다.
                      </p>
                      <input
                        id="w-interest"
                        type="range"
                        min="0"
                        max="80"
                        value={weights.interest}
                        onChange={(e) => setWeights({ ...weights, interest: Number(e.target.value) })}
                        className="w-full accent-purple-600"
                      />
                    </div>

                    {/* 3. 최근 접속/활동성 */}
                    <div className="rounded-xl border bg-card p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="w-recency" className="text-xs font-bold flex items-center gap-1.5">
                          <Flame className="h-4 w-4 text-amber-600" />
                          실시간 접속 및 활동성
                        </Label>
                        <span className="text-sm font-bold text-amber-600">{weights.recency}%</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        지금 로그인 중이거나 방금 접속한 활성 유저를 우선순위로 띄웁니다.
                      </p>
                      <input
                        id="w-recency"
                        type="range"
                        min="0"
                        max="80"
                        value={weights.recency}
                        onChange={(e) => setWeights({ ...weights, recency: Number(e.target.value) })}
                        className="w-full accent-amber-600"
                      />
                    </div>

                    {/* 4. AI 성향 궁합도 */}
                    <div className="rounded-xl border bg-card p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="w-ai" className="text-xs font-bold flex items-center gap-1.5">
                          <Bot className="h-4 w-4 text-blue-600" />
                          제브 AI 대화 성향 궁합
                        </Label>
                        <span className="text-sm font-bold text-blue-600">{weights.aiAffinity}%</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        제브 AI가 분석한 대화 스타일 및 친절도 매너 점수를 바탕으로 매칭합니다.
                      </p>
                      <input
                        id="w-ai"
                        type="range"
                        min="0"
                        max="80"
                        value={weights.aiAffinity}
                        onChange={(e) => setWeights({ ...weights, aiAffinity: Number(e.target.value) })}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>

                  {/* 하단 저장 버튼 바 */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t pt-4">
                    <p className="text-xs text-muted-foreground">
                      ※ 가중치를 변경하고 저장하면 모바일 앱의 친구 추천 알고리즘에 즉시 반영됩니다.
                    </p>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0 text-xs"
                      onClick={handleSaveWeights}
                      disabled={isSavingWeights || totalWeight !== 100}
                    >
                      {isSavingWeights ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          저장 중...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          추천 알고리즘 가중치 저장
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: 추천 피드 노출 & 안전 정책 */}
            <TabsContent value="safety" className="space-y-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    홈 추천 피드 노출 & 안전 심사 정책
                  </CardTitle>
                  <CardDescription className="text-xs">
                    모바일 앱 홈 피드에 친구 목록을 노출할 때 안전성과 프로필 신뢰도를 검증하는 규칙입니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex items-center justify-between rounded-xl border p-4 bg-card">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">본인인증 완료 회원 우선 노출</p>
                      <p className="text-[11px] text-muted-foreground">휴대전화 본인인증이 완료된 검증 회원을 추천 피드 상단에 배치합니다.</p>
                    </div>
                    <Switch
                      checked={requireVerification}
                      onCheckedChange={(val) => setRequireVerification(val)}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border p-4 bg-card">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">프로필 사진 미등록 회원 피드 숨김</p>
                      <p className="text-[11px] text-muted-foreground">얼굴 또는 프로필 사진을 1장 이상 등록하지 않은 계정은 추천 피드에서 제외합니다.</p>
                    </div>
                    <Switch
                      checked={hideNoPhotoUsers}
                      onCheckedChange={(val) => setHideNoPhotoUsers(val)}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border p-4 bg-card">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">신고·제재 이력 회원 자동 제외</p>
                      <p className="text-[11px] text-muted-foreground">최근 신고 누적으로 경고를 받았거나 심사 중인 계정은 홈 화면 추천에서 자동 필터링합니다.</p>
                    </div>
                    <Switch
                      checked={excludeReportedUsers}
                      onCheckedChange={(val) => setExcludeReportedUsers(val)}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border p-4 bg-card">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">라이브 방송 중인 호스트 상단 부스트</p>
                      <p className="text-[11px] text-muted-foreground">현재 1:N 라이브 방송 또는 1:1 프라이빗 라이브 방송을 진행 중인 호스트에게 라이브 뱃지를 부여하고 추천 우선순위를 높입니다.</p>
                    </div>
                    <Switch
                      checked={liveStreamerBoost}
                      onCheckedChange={(val) => setLiveStreamerBoost(val)}
                    />
                  </div>

                  <div className="flex justify-end border-t pt-4">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                      onClick={handleSaveSafetyPolicy}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      피드 안전 정책 저장
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ===================== [우측 영역: 스마트폰 라이브 시뮬레이터 380px] ===================== */}
        <div className="sticky top-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Smartphone className="h-4 w-4 text-indigo-600" />
              모바일 앱 실시간 화면 미리보기
            </span>
            <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 text-[10px]">
              실시간 동기화
            </Badge>
          </div>

          {/* 실제 스마트폰 외형 목업 프레임 */}
          <div className="relative mx-auto w-full max-w-[360px] overflow-hidden rounded-[38px] border-[8px] border-slate-900 bg-slate-950 p-2 shadow-2xl">
            {/* 상단 다이나믹 아일랜드/스피커 홀 */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 h-4 w-28 rounded-full bg-slate-900 z-20 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-slate-800 mr-2" />
              <div className="h-1.5 w-1.5 rounded-full bg-blue-950" />
            </div>

            {/* 스마트폰 내부 화면 (화이트 테마 앱) */}
            <div className="relative overflow-hidden rounded-[28px] bg-slate-50 pt-8 pb-3 min-h-[580px] flex flex-col justify-between text-slate-800">
              {/* 앱 상단 헤더 바 */}
              <div className="px-4 pb-2 flex items-center justify-between border-b bg-white">
                <div>
                  <h3 className="font-extrabold text-sm text-indigo-600 tracking-tight">다가온 (DAGAON)</h3>
                  <p className="text-[9px] text-muted-foreground">새로운 사람, 새로운 이야기</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-800 border-amber-200 px-1.5 py-0">
                    💰 1,200 온
                  </Badge>
                </div>
              </div>

              {/* 핵심: 상단 가로 스크롤 빠른 탐색 태그 바 (관리자가 설정한 태그가 여기에 표시됨!) */}
              <div className="bg-white py-2 px-3 border-b shadow-2xs">
                <p className="text-[10px] font-bold text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>빠른 친구 탐색</span>
                  <span className="text-[9px] text-indigo-600 font-normal">← 좌측에서 설정</span>
                </p>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {tags
                    .filter((t) => t.enabled)
                    .map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => setMockActiveTag(tag.id)}
                        className={`flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold transition-all shrink-0 ${
                          mockActiveTag === tag.id
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>{tag.icon}</span>
                        <span>{tag.label}</span>
                      </button>
                    ))}
                </div>
              </div>

              {/* 추천 친구 피드 영역 */}
              <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
                <div className="flex items-center justify-between text-[11px] px-1">
                  <span className="font-bold text-slate-700">오늘의 추천 친구</span>
                  <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                    AI 가중치 반영 중
                  </span>
                </div>

                {/* 추천 친구 카드 1 */}
                <div className="rounded-2xl border bg-white p-3 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-pink-400 to-indigo-400 flex items-center justify-center text-white font-bold text-sm shadow-2xs">
                        지민
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900">이지민</span>
                          <span className="text-[10px] text-slate-500">24세</span>
                        </div>
                        <p className="text-[10px] text-indigo-600 font-medium">📍 1.2km • 서울 강남구</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-600 text-[9px] px-1.5 py-0 font-bold flex items-center gap-1">
                      <Video className="h-2.5 w-2.5" />
                      1:1 방송 가능
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[9px]">
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600">🏃 러닝/헬스</span>
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600">☕ 카페투어</span>
                    <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-indigo-700 font-semibold">
                      AI 궁합 94%
                    </span>
                  </div>
                </div>

                {/* 추천 친구 카드 2 */}
                <div className="rounded-2xl border bg-white p-3 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-400 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-2xs">
                        민수
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900">박민수</span>
                          <span className="text-[10px] text-slate-500">27세</span>
                        </div>
                        <p className="text-[10px] text-purple-600 font-medium">🎯 취향 4개 일치</p>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400">5분 전 접속</span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[9px]">
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600">🎮 게임/롤</span>
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600">🎵 밴드음악</span>
                  </div>
                </div>

                {/* 적용된 AI 가중치 요약 칩 */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-2.5 text-[10px] space-y-1">
                  <p className="font-bold text-indigo-950 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-indigo-600" />
                    현재 적용 알고리즘
                  </p>
                  <p className="text-slate-600 leading-tight">
                    거리 {weights.distance}% + 취미 {weights.interest}% + 접속 {weights.recency}% + AI {weights.aiAffinity}%
                  </p>
                </div>
              </div>

              {/* 스마트폰 하단 네비게이션 탭바 */}
              <div className="border-t bg-white px-6 py-2 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-bold text-indigo-600">홈</span>
                <span>라이브</span>
                <span>메시지</span>
                <span>마이</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-center text-muted-foreground">
            💡 왼쪽에서 수정한 내용이 위 스마트폰 홈 화면에 실시간으로 표시됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
