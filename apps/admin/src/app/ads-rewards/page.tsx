'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  BadgeDollarSign,
  CalendarCheck,
  CheckCircle,
  Coins,
  CreditCard,
  Edit2,
  Gift,
  History,
  Image as ImageIcon,
  Layers,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Settings,
  Share2,
  Trash2,
  Tv,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  createAdminAd,
  deleteAdminAd,
  getAdminAds,
  getAdsRewardsOverview,
  updateAdminAd,
  updateAdsRewardsPolicies,
  type AdminAdvertisementItem,
  type AdsRewardsOverviewResponse,
  type AdsRewardsPolicies,
} from '@/lib/api'
import type { AxiosError } from 'axios'

export default function AdsRewardsPage() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AdsRewardsOverviewResponse | null>(null)

  // Policy Form State
  const [dailyAdLimit, setDailyAdLimit] = useState(5)
  const [pointsPerAd, setPointsPerAd] = useState(10)
  const [admobAppId, setAdmobAppId] = useState('')
  const [admobUnitId, setAdmobUnitId] = useState('')
  const [attendancePoints, setAttendancePoints] = useState(5)
  const [referralPoints, setReferralPoints] = useState(50)
  const [savingPolicies, setSavingPolicies] = useState(false)

  // In-House Banner Ads State
  const [inhouseAds, setInhouseAds] = useState<AdminAdvertisementItem[]>([])
  const [loadingAds, setLoadingAds] = useState(false)
  const [adFilterPlacement, setAdFilterPlacement] = useState('ALL')
  const [adDialogOpen, setAdDialogOpen] = useState(false)
  const [editingAd, setEditingAd] = useState<AdminAdvertisementItem | null>(null)
  const [savingAd, setSavingAd] = useState(false)

  // Ad Form Fields
  const [adTitle, setAdTitle] = useState('')
  const [adDescription, setAdDescription] = useState('')
  const [adImageUrl, setAdImageUrl] = useState('')
  const [adTargetUrl, setAdTargetUrl] = useState('')
  const [adPlacement, setAdPlacement] = useState('HOME_BANNER')
  const [adPriority, setAdPriority] = useState(5)
  const [adRewardPoints, setAdRewardPoints] = useState(0)
  const [adIsActive, setAdIsActive] = useState(true)

  const loadInhouseAds = useCallback(async (placement?: string) => {
    setLoadingAds(true)
    try {
      const items = await getAdminAds(placement)
      setInhouseAds(items)
    } catch {
      toast({
        title: '자체 배너 로드 실패',
        description: '자체 등록 광고 목록을 불러오지 못했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoadingAds(false)
    }
  }, [toast])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdsRewardsOverview()
      setData(res)
      setDailyAdLimit(res.policies.dailyAdLimit)
      setPointsPerAd(res.policies.pointsPerAd)
      setAdmobAppId(res.policies.admobAppId)
      setAdmobUnitId(res.policies.admobUnitId)
      setAttendancePoints(res.policies.attendancePoints)
      setReferralPoints(res.policies.referralPoints)
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '광고 & 리워드 데이터 로드 실패',
        description: (ax?.response?.data as any)?.message || '지표를 불러오지 못했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadData()
    void loadInhouseAds()
  }, [loadData, loadInhouseAds])

  const handleSavePolicies = async () => {
    setSavingPolicies(true)
    try {
      await updateAdsRewardsPolicies({
        dailyAdLimit,
        pointsPerAd,
        admobAppId: admobAppId.trim(),
        admobUnitId: admobUnitId.trim(),
        attendancePoints,
        referralPoints,
      })
      toast({ title: '정책 저장 완료', description: '광고 네트워크 및 리워드 적립 정책이 저장되었습니다.' })
      void loadData()
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '정책 저장 실패',
        description: (ax?.response?.data as any)?.message || '저장에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setSavingPolicies(false)
    }
  }

  const openCreateAdDialog = () => {
    setEditingAd(null)
    setAdTitle('')
    setAdDescription('')
    setAdImageUrl('')
    setAdTargetUrl('')
    setAdPlacement('HOME_BANNER')
    setAdPriority(5)
    setAdRewardPoints(0)
    setAdIsActive(true)
    setAdDialogOpen(true)
  }

  const openEditAdDialog = (item: AdminAdvertisementItem) => {
    setEditingAd(item)
    setAdTitle(item.title)
    setAdDescription(item.description || '')
    setAdImageUrl(item.imageUrl)
    setAdTargetUrl(item.targetUrl || '')
    setAdPlacement(item.placement)
    setAdPriority(item.priority)
    setAdRewardPoints(item.rewardPoints || 0)
    setAdIsActive(item.isActive)
    setAdDialogOpen(true)
  }

  const handleSaveAd = async () => {
    if (!adTitle.trim() || !adImageUrl.trim()) {
      toast({
        title: '입력 확인',
        description: '광고 제목과 이미지 URL은 필수입니다.',
        variant: 'destructive',
      })
      return
    }

    setSavingAd(true)
    try {
      const payload: Partial<AdminAdvertisementItem> = {
        title: adTitle.trim(),
        description: adDescription.trim() || undefined,
        imageUrl: adImageUrl.trim(),
        targetUrl: adTargetUrl.trim() || undefined,
        placement: adPlacement,
        priority: Number(adPriority) || 0,
        rewardPoints: Number(adRewardPoints) || 0,
        isActive: adIsActive,
      }

      if (editingAd) {
        await updateAdminAd(editingAd.id, payload)
        toast({ title: '수정 완료', description: '배너 광고가 성공적으로 수정되었습니다.' })
      } else {
        await createAdminAd(payload)
        toast({ title: '등록 완료', description: '신규 배너 광고가 등록되었습니다.' })
      }

      setAdDialogOpen(false)
      void loadInhouseAds(adFilterPlacement)
    } catch {
      toast({
        title: '저장 실패',
        description: '배너 광고 저장 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setSavingAd(false)
    }
  }

  const handleToggleAdActive = async (item: AdminAdvertisementItem) => {
    try {
      await updateAdminAd(item.id, { isActive: !item.isActive })
      setInhouseAds((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, isActive: !a.isActive } : a))
      )
      toast({
        title: '상태 변경 완료',
        description: `광고가 ${!item.isActive ? '노출 활성' : '숨김'} 처리되었습니다.`,
      })
    } catch {
      toast({ title: '오류', description: '상태 변경에 실패했습니다.', variant: 'destructive' })
    }
  }

  const handleDeleteAd = async (item: AdminAdvertisementItem) => {
    if (!window.confirm(`정말로 "${item.title}" 광고를 삭제하시겠습니까?`)) return
    try {
      await deleteAdminAd(item.id)
      toast({ title: '삭제 완료', description: '배너 광고가 삭제되었습니다.' })
      void loadInhouseAds(adFilterPlacement)
    } catch {
      toast({ title: '삭제 실패', description: '광고 삭제에 실패했습니다.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BadgeDollarSign className="h-6 w-6 text-amber-500" />
            광고 캠페인 및 리워드 운영 센터
          </h1>
          <p className="text-sm text-muted-foreground">
            보상형 광고(AdMob) 네트워크 연동, 일일 시청 한도 및 서비스 자체 배너 광고를 설정합니다.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void loadData()} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
          새로고침
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">총 지급 리워드 포인트</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">
                  {loading ? '—' : `${data?.stats.totalPointsDistributed.toLocaleString()}P`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">사용자 지갑 충전 누적액</p>
              </div>
              <Coins className="h-8 w-8 text-amber-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">누적 보상 지급 건수</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">
                  {loading ? '—' : `${data?.stats.totalRewardEvents.toLocaleString()}회`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">광고 시청 및 미션 완료</p>
              </div>
              <Gift className="h-8 w-8 text-emerald-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">리워드 대상 회원 수</p>
                <p className="text-2xl font-bold mt-1">
                  {loading ? '—' : `${data?.stats.totalEligibleUsers.toLocaleString()}명`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">지갑 보유 사용자 총합</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">자체 배너 등록 광고</p>
                <p className="text-2xl font-bold mt-1 text-primary">
                  {inhouseAds.length}개
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">홈/충전소/라이브 노출</p>
              </div>
              <Layers className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="policies" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="policies" className="flex items-center gap-1.5">
            <Settings className="h-4 w-4" />
            리워드 적립 정책
          </TabsTrigger>
          <TabsTrigger value="inhouse-ads" className="flex items-center gap-1.5 font-semibold text-primary">
            <ImageIcon className="h-4 w-4" />
            자체 배너 광고 관리
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-1.5">
            <Tv className="h-4 w-4" />
            AdMob 캠페인 현황
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-1.5">
            <History className="h-4 w-4" />
            리워드 지급 로그
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Policies */}
        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">보상형 광고 및 리워드 정책 설정</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                광고 시청 횟수 제한, 광고 시청당 지급 포인트, 출석체크 및 친구 초대 보상 정책을 관리합니다.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* AdMob Settings */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                  <Tv className="h-4 w-4 text-amber-500" />
                  Google AdMob 보상형 광고 네트워크 설정
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">AdMob 앱 ID (App ID)</label>
                    <Input
                      value={admobAppId}
                      onChange={(e) => setAdmobAppId(e.target.value)}
                      placeholder="ca-app-pub-xxxxxxxx~yyyyyyyy"
                      className="font-mono text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      보상형 동영상 광고 단위 ID (Rewarded Unit ID)
                    </label>
                    <Input
                      value={admobUnitId}
                      onChange={(e) => setAdmobUnitId(e.target.value)}
                      placeholder="ca-app-pub-xxxxxxxx/zzzzzzzz"
                      className="font-mono text-xs h-8"
                    />
                  </div>
                </div>
              </div>

              {/* Reward Rate Settings */}
              <div className="space-y-3 pt-3 border-t">
                <h3 className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                  <Coins className="h-4 w-4 text-emerald-500" />
                  보상 지급 단가 및 일일 한도 설정
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">일일 광고 시청 제한 (회/일)</label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={dailyAdLimit}
                      onChange={(e) => setDailyAdLimit(Number(e.target.value))}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">광고 1회당 지급 포인트 (P)</label>
                    <Input
                      type="number"
                      min={1}
                      value={pointsPerAd}
                      onChange={(e) => setPointsPerAd(Number(e.target.value))}
                      className="text-xs h-8 font-semibold text-amber-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">출석체크 지급 포인트 (P)</label>
                    <Input
                      type="number"
                      min={1}
                      value={attendancePoints}
                      onChange={(e) => setAttendancePoints(Number(e.target.value))}
                      className="text-xs h-8 font-semibold text-blue-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">친구초대 1인당 포인트 (P)</label>
                    <Input
                      type="number"
                      min={1}
                      value={referralPoints}
                      onChange={(e) => setReferralPoints(Number(e.target.value))}
                      className="text-xs h-8 font-semibold text-purple-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button onClick={handleSavePolicies} disabled={savingPolicies}>
                  {savingPolicies ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  정책 저장하기
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: In-House Ads */}
        <TabsContent value="inhouse-ads" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  서비스 자체 배너 및 프로모션 광고
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  홈 화면 슬라이드, 무료충전소 배너, 라이브 방송 배너 등 앱 내 배치(Placement)별 광고를 등록하고 관리합니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={adFilterPlacement}
                  onValueChange={(val) => {
                    setAdFilterPlacement(val)
                    void loadInhouseAds(val)
                  }}
                >
                  <SelectTrigger className="w-36 text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체 위치</SelectItem>
                    <SelectItem value="HOME_BANNER">홈 배너</SelectItem>
                    <SelectItem value="SHOP_BANNER">충전소 배너</SelectItem>
                    <SelectItem value="LIVE_BANNER">라이브 배너</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={openCreateAdDialog} className="flex items-center gap-1.5 h-8">
                  <Plus className="h-3.5 w-3.5" />
                  배너 등록
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">이미지</TableHead>
                    <TableHead>광고 제목 / 설명</TableHead>
                    <TableHead>노출 위치</TableHead>
                    <TableHead>우선순위</TableHead>
                    <TableHead>클릭수</TableHead>
                    <TableHead>노출 상태</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAds ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin mb-1" />
                        배너 광고를 불러오는 중입니다...
                      </TableCell>
                    </TableRow>
                  ) : inhouseAds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                        등록된 배너 광고가 없습니다. [배너 등록] 버튼을 눌러 추가하세요.
                      </TableCell>
                    </TableRow>
                  ) : (
                    inhouseAds.map((ad) => (
                      <TableRow key={ad.id}>
                        <TableCell>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={ad.imageUrl}
                            alt={ad.title}
                            className="h-12 w-20 rounded object-cover border"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-sm">{ad.title}</div>
                          {ad.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-sm">
                              {ad.description}
                            </div>
                          )}
                          {ad.targetUrl && (
                            <div className="text-[11px] text-primary underline truncate max-w-sm mt-0.5">
                              {ad.targetUrl}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {ad.placement === 'HOME_BANNER'
                              ? '홈 배너'
                              : ad.placement === 'SHOP_BANNER'
                              ? '충전소 배너'
                              : ad.placement === 'LIVE_BANNER'
                              ? '라이브 배너'
                              : ad.placement}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{ad.priority}</TableCell>
                        <TableCell className="font-semibold text-xs text-muted-foreground">
                          {ad.clickCount.toLocaleString()}회
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={ad.isActive}
                              onCheckedChange={() => void handleToggleAdActive(ad)}
                            />
                            <span className="text-xs text-muted-foreground">
                              {ad.isActive ? '노출' : '숨김'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditAdDialog(ad)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => void handleDeleteAd(ad)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Campaigns */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Tv className="h-4 w-4 text-amber-500" />
                  AdMob 보상형 동영상 광고
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">시청 단가:</span>
                  <span className="font-bold text-amber-600">{pointsPerAd}P / 회</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">일일 한도:</span>
                  <span className="font-semibold">{dailyAdLimit}회 / 일</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">네트워크 상태:</span>
                  <span className="text-emerald-600 font-semibold">정상 운영</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <CalendarCheck className="h-4 w-4 text-blue-500" />
                  매일 출석체크 미션
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">출석 보상:</span>
                  <span className="font-bold text-blue-600">+{attendancePoints}P</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">지급 주기:</span>
                  <span>매일 자정(KST) 초기화</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">어뷰징 방지:</span>
                  <span className="text-emerald-600 font-semibold">당일 중복 차단</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Share2 className="h-4 w-4 text-purple-500" />
                  친구 초대 추천인 리워드
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">추천인 보상:</span>
                  <span className="font-bold text-purple-600">+{referralPoints}P</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">피추천인 혜택:</span>
                  <span>가입 시 50P 즉시 지급</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">상태:</span>
                  <span className="text-emerald-600 font-semibold">활성화</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                최근 리워드 적립 원장 기록 (실시간 20건)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data?.recentRewards?.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  지급된 리워드 기록이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 border-b">
                      <tr className="text-left text-muted-foreground">
                        <th className="p-2.5">일시 (KST)</th>
                        <th className="p-2.5">수령 회원</th>
                        <th className="p-2.5">유형</th>
                        <th className="p-2.5">출처 (Source)</th>
                        <th className="p-2.5 text-right">지급액</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(data?.recentRewards ?? []).map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30">
                          <td className="p-2.5 whitespace-nowrap text-muted-foreground">
                            {new Date(item.createdAt).toLocaleString('ko-KR')}
                          </td>
                          <td className="p-2.5 font-medium">
                            {item.wallet?.activityAccount?.displayName ||
                              item.wallet?.activityAccount?.handle ||
                              '회원'}
                          </td>
                          <td className="p-2.5 font-semibold text-foreground uppercase">{item.kind}</td>
                          <td className="p-2.5 font-mono text-muted-foreground">{item.source}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-600">
                            +{item.deltaSpendable.toLocaleString()}P
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ad Modal Dialog */}
      <Dialog open={adDialogOpen} onOpenChange={setAdDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAd ? '배너 광고 수정' : '신규 배너 광고 등록'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label className="text-xs">광고 제목 *</Label>
              <Input
                value={adTitle}
                onChange={(e) => setAdTitle(e.target.value)}
                placeholder="다가온 첫 만남 이벤트"
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">광고 설명 (선택)</Label>
              <Input
                value={adDescription}
                onChange={(e) => setAdDescription(e.target.value)}
                placeholder="프로필 완성하고 50포인트를 즉시 받아가세요"
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">배너 이미지 URL *</Label>
              <Input
                value={adImageUrl}
                onChange={(e) => setAdImageUrl(e.target.value)}
                placeholder="https://.../banner.png"
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">클릭 시 이동할 경로/URL</Label>
              <Input
                value={adTargetUrl}
                onChange={(e) => setAdTargetUrl(e.target.value)}
                placeholder="/shop 또는 https://..."
                className="font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">노출 위치</Label>
                <Select value={adPlacement} onValueChange={setAdPlacement}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOME_BANNER">홈 화면 상단 배너</SelectItem>
                    <SelectItem value="SHOP_BANNER">무료충전소 배너</SelectItem>
                    <SelectItem value="LIVE_BANNER">라이브 방송 배너</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">우선순위 (높을수록 앞)</Label>
                <Input
                  type="number"
                  value={adPriority}
                  onChange={(e) => setAdPriority(Number(e.target.value))}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <div className="text-xs font-medium">배너 즉시 노출 활성화</div>
                <div className="text-[11px] text-muted-foreground">앱 클라이언트에 실시간 노출</div>
              </div>
              <Switch checked={adIsActive} onCheckedChange={setAdIsActive} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdDialogOpen(false)} disabled={savingAd}>
              취소
            </Button>
            <Button onClick={handleSaveAd} disabled={savingAd}>
              {savingAd && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingAd ? '수정 완료' : '등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
