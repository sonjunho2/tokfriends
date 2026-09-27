'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  BadgeDollarSign,
  CalendarCheck,
  CheckCircle,
  Coins,
  CreditCard,
  Gift,
  History,
  Layers,
  Loader2,
  RefreshCcw,
  Save,
  Settings,
  Share2,
  Tv,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  getAdsRewardsOverview,
  updateAdsRewardsPolicies,
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
  }, [loadData])

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
            보상형 광고(AdMob) 네트워크 연동, 일일 시청 한도 및 출석/추천 리워드 정책을 설정합니다.
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
                <p className="text-xs text-muted-foreground">활성 리워드 캠페인</p>
                <p className="text-2xl font-bold mt-1 text-primary">
                  {loading ? '—' : `${data?.stats.activeCampaignsCount ?? 3}개`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">광고/출석/추천 운영 중</p>
              </div>
              <Layers className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="policies" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="policies" className="flex items-center gap-1.5">
            <Settings className="h-4 w-4" />
            리워드 적립 정책
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-1.5">
            <Tv className="h-4 w-4" />
            광고 캠페인 현황
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
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={dailyAdLimit}
                        onChange={(e) => setDailyAdLimit(parseInt(e.target.value, 10) || 1)}
                        className="text-xs h-8 font-bold"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">회</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">광고 1회 시청 보상 (P)</label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        max={1000}
                        value={pointsPerAd}
                        onChange={(e) => setPointsPerAd(parseInt(e.target.value, 10) || 1)}
                        className="text-xs h-8 font-bold text-amber-600"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">P</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">출석체크 일일 보상 (P)</label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        max={1000}
                        value={attendancePoints}
                        onChange={(e) => setAttendancePoints(parseInt(e.target.value, 10) || 1)}
                        className="text-xs h-8 font-bold text-emerald-600"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">P</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">친구 초대 가입 보상 (P)</label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        max={5000}
                        value={referralPoints}
                        onChange={(e) => setReferralPoints(parseInt(e.target.value, 10) || 1)}
                        className="text-xs h-8 font-bold text-blue-600"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">P</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-end pt-3 border-t">
                <Button onClick={() => void handleSavePolicies()} disabled={savingPolicies}>
                  {savingPolicies ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  정책 저장 및 적용
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Campaigns Overview */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-amber-200/60">
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="rounded-full bg-amber-100 p-2 text-amber-700">
                    <Tv className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-bold">
                    운영 중
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm">보상형 동영상 광고</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    AdMob 비디오 광고 30초 시청 시 {pointsPerAd}P 즉시 지급 (일 최대 {dailyAdLimit}회)
                  </p>
                </div>
                <div className="text-xs text-muted-foreground border-t pt-2 space-y-0.5">
                  <p>• 플랫폼: Android, iOS</p>
                  <p>• 최대 일일 적립: {dailyAdLimit * pointsPerAd}P</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200/60">
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-bold">
                    운영 중
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm">일일 출석체크 챌린지</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    앱 최초 접속 시 매일 {attendancePoints}P 지갑 자동 충전
                  </p>
                </div>
                <div className="text-xs text-muted-foreground border-t pt-2 space-y-0.5">
                  <p>• 7일 연속 출석 시 2배 보너스</p>
                  <p>• 초기화 시간: 매일 00:00 KST</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200/60">
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="rounded-full bg-blue-100 p-2 text-blue-700">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-bold">
                    운영 중
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm">친구 초대 리워드</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    초대 코드로 친구 가입 시 초대한 사람과 가입한 친구 모두에게 {referralPoints}P 지급
                  </p>
                </div>
                <div className="text-xs text-muted-foreground border-t pt-2 space-y-0.5">
                  <p>• 피추천인 번호인증 완료 시 지급</p>
                  <p>• 추천 횟수 제한 없음</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Recent Reward Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">최근 리워드 적립 내역</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                광고 시청, 출석체크, 친구 초대 등으로 지급된 지갑 원장(WalletLedger) 실시간 스트림입니다.
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (data?.recentRewards ?? []).length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">최근 지급된 리워드 기록이 없습니다.</p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 border-b text-muted-foreground font-medium">
                      <tr>
                        <th className="p-2.5">일시</th>
                        <th className="p-2.5">수령 사용자</th>
                        <th className="p-2.5">적립 유형</th>
                        <th className="p-2.5">소스</th>
                        <th className="p-2.5 text-right">지급 포인트</th>
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
    </div>
  )
}
