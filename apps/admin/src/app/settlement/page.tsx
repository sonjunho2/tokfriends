'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  Building,
  Check,
  CheckCircle,
  Coins,
  CreditCard,
  History,
  Landmark,
  Loader2,
  RefreshCcw,
  Search,
  Wallet,
  X,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import {
  approveAdminRefund,
  approveSettlementRequest,
  denyAdminRefund,
  getAdminRefunds,
  getSettlementLedger,
  getSettlementPurchases,
  getSettlementRequests,
  getSettlementSummary,
  rejectSettlementRequest,
  type AdminRefundRequest,
  type PointPurchaseItem,
  type SettlementRequestItem,
  type SettlementSummary,
  type WalletLedgerItem,
} from '@/lib/api'
import type { AxiosError } from 'axios'

const REFUND_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: '대기 중' },
  approved: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '환불 승인' },
  denied: { bg: 'bg-rose-100', text: 'text-rose-700', label: '환불 거절' },
}

const SETTLEMENT_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', label: '대기 중' },
  APPROVED: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '승인 / 송금 완료' },
  REJECTED: { bg: 'bg-rose-100', text: 'text-rose-700', label: '반려됨' },
  CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-700', label: '취소됨' },
}

export default function SettlementPage() {
  const { toast } = useToast()

  // Overview Summary
  const [summary, setSummary] = useState<SettlementSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)

  // Tab: Settlement Requests (크리에이터 출금 신청)
  const [requests, setRequests] = useState<SettlementRequestItem[]>([])
  const [requestsTotal, setRequestsTotal] = useState(0)
  const [requestsPage, setRequestsPage] = useState(1)
  const [requestsTotalPages, setRequestsTotalPages] = useState(1)
  const [requestsStatus, setRequestsStatus] = useState('all')
  const [requestsSearch, setRequestsSearch] = useState('')
  const [requestsLoading, setRequestsLoading] = useState(false)

  // Settlement Action Dialogs
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [selectedRequestForApprove, setSelectedRequestForApprove] = useState<SettlementRequestItem | null>(null)
  const [approveMemo, setApproveMemo] = useState('')

  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedRequestForReject, setSelectedRequestForReject] = useState<SettlementRequestItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)

  // Tab: Refunds
  const [refunds, setRefunds] = useState<AdminRefundRequest[]>([])
  const [refundsLoading, setRefundsLoading] = useState(false)
  const [refundStatusFilter, setRefundStatusFilter] = useState('all')
  const [refundSearch, setRefundSearch] = useState('')
  const [actioningRefundId, setActioningRefundId] = useState<string | null>(null)

  // Tab 2: Purchases
  const [purchases, setPurchases] = useState<PointPurchaseItem[]>([])
  const [purchasesTotal, setPurchasesTotal] = useState(0)
  const [purchasesPage, setPurchasesPage] = useState(1)
  const [purchasesTotalPages, setPurchasesTotalPages] = useState(1)
  const [purchasesPlatform, setPurchasesPlatform] = useState('all')
  const [purchasesLoading, setPurchasesLoading] = useState(false)

  // Tab 3: Ledger
  const [ledger, setLedger] = useState<WalletLedgerItem[]>([])
  const [ledgerLoading, setLedgerLoading] = useState(false)

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true)
    try {
      const data = await getSettlementSummary()
      setSummary(data)
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '정산 요약 로드 실패',
        description: (ax?.response?.data as any)?.message || '지표를 불러오지 못했습니다.',
        variant: 'destructive',
      })
    } finally {
      setSummaryLoading(false)
    }
  }, [toast])

  const loadRefunds = useCallback(async () => {
    setRefundsLoading(true)
    try {
      const data = await getAdminRefunds()
      setRefunds(data)
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '환불 요청 로드 실패',
        description: (ax?.response?.data as any)?.message || '환불 요청을 불러오지 못했습니다.',
        variant: 'destructive',
      })
    } finally {
      setRefundsLoading(false)
    }
  }, [toast])

  const loadPurchases = useCallback(
    async (page: number, platform: string) => {
      setPurchasesLoading(true)
      try {
        const res = await getSettlementPurchases({
          page,
          limit: 15,
          platform: platform === 'all' ? undefined : platform,
        })
        setPurchases(res.items)
        setPurchasesTotal(res.total)
        setPurchasesTotalPages(res.totalPages)
      } catch (error) {
        const ax = error as AxiosError | undefined
        toast({
          title: '결제 내역 로드 실패',
          description: (ax?.response?.data as any)?.message || '결제 내역을 불러오지 못했습니다.',
          variant: 'destructive',
        })
      } finally {
        setPurchasesLoading(false)
      }
    },
    [toast],
  )

  const loadLedger = useCallback(async () => {
    setLedgerLoading(true)
    try {
      const items = await getSettlementLedger(25)
      setLedger(items)
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '원장 로그 로드 실패',
        description: (ax?.response?.data as any)?.message || '원장 로그를 불러오지 못했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLedgerLoading(false)
    }
  }, [toast])

  const loadRequests = useCallback(
    async (page: number, status: string, search: string) => {
      setRequestsLoading(true)
      try {
        const res = await getSettlementRequests({
          page,
          limit: 15,
          status: status === 'all' ? undefined : status,
          search: search.trim() || undefined,
        })
        setRequests(res.items)
        setRequestsTotal(res.total)
        setRequestsTotalPages(res.totalPages)
      } catch (error) {
        const ax = error as AxiosError | undefined
        toast({
          title: '출금 요청 로드 실패',
          description: (ax?.response?.data as any)?.message || '출금 요청 목록을 불러오지 못했습니다.',
          variant: 'destructive',
        })
      } finally {
        setRequestsLoading(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    void loadSummary()
    void loadRequests(requestsPage, requestsStatus, requestsSearch)
    void loadRefunds()
    void loadPurchases(purchasesPage, purchasesPlatform)
    void loadLedger()
  }, [
    loadSummary,
    loadRequests,
    loadRefunds,
    loadPurchases,
    loadLedger,
    requestsPage,
    requestsStatus,
    requestsSearch,
    purchasesPage,
    purchasesPlatform,
  ])

  const handleApproveRefund = async (id: string) => {
    setActioningRefundId(id)
    try {
      const updated = await approveAdminRefund(id)
      setRefunds((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)))
      toast({ title: '환불 승인 완료', description: '환불 요청이 승인되었습니다.' })
      void loadSummary()
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '환불 승인 실패',
        description: (ax?.response?.data as any)?.message || '승인 처리에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setActioningRefundId(null)
    }
  }

  const handleDenyRefund = async (id: string) => {
    setActioningRefundId(id)
    try {
      const updated = await denyAdminRefund(id)
      setRefunds((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)))
      toast({ title: '환불 거절 처리', description: '환불 요청이 거절되었습니다.' })
      void loadSummary()
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '환불 거절 실패',
        description: (ax?.response?.data as any)?.message || '거절 처리에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setActioningRefundId(null)
    }
  }

  const handleApproveSettlement = async () => {
    if (!selectedRequestForApprove) return
    setSubmittingAction(true)
    try {
      await approveSettlementRequest(selectedRequestForApprove.id, approveMemo.trim() || undefined)
      toast({ title: '출금 승인 완료', description: '출금 요청이 승인 및 송금 완료 처리되었습니다.' })
      setApproveModalOpen(false)
      setSelectedRequestForApprove(null)
      setApproveMemo('')
      void loadRequests(requestsPage, requestsStatus, requestsSearch)
      void loadSummary()
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '승인 처리 실패',
        description: (ax?.response?.data as any)?.message || '승인 처리에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setSubmittingAction(false)
    }
  }

  const handleRejectSettlement = async () => {
    if (!selectedRequestForReject) return
    if (!rejectReason.trim()) {
      toast({ title: '반려 사유 입력 필요', description: '반려 사유를 입력해 주세요.', variant: 'destructive' })
      return
    }
    setSubmittingAction(true)
    try {
      await rejectSettlementRequest(selectedRequestForReject.id, rejectReason.trim())
      toast({ title: '출금 반려 처리', description: '출금 요청이 반려되고 포인트가 환원되었습니다.' })
      setRejectModalOpen(false)
      setSelectedRequestForReject(null)
      setRejectReason('')
      void loadRequests(requestsPage, requestsStatus, requestsSearch)
      void loadSummary()
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '반려 처리 실패',
        description: (ax?.response?.data as any)?.message || '반려 처리에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setSubmittingAction(false)
    }
  }

  const filteredRefunds = refunds.filter((r) => {
    const matchStatus = refundStatusFilter === 'all' || r.status.toLowerCase() === refundStatusFilter.toLowerCase()
    const q = refundSearch.toLowerCase().trim()
    const matchSearch =
      !q ||
      r.id.toLowerCase().includes(q) ||
      r.productId.toLowerCase().includes(q) ||
      r.receiptId.toLowerCase().includes(q) ||
      (r.user?.displayName?.toLowerCase() || '').includes(q) ||
      (r.user?.email?.toLowerCase() || '').includes(q)
    return matchStatus && matchSearch
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Landmark className="h-6 w-6 text-primary" />
            정산 및 환불 관리
          </h1>
          <p className="text-sm text-muted-foreground">
            인앱 결제 내역, 지갑 원장 로그, 환불 요청 승인/거절을 통합 관리합니다.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            void loadSummary()
            void loadRequests(requestsPage, requestsStatus, requestsSearch)
            void loadRefunds()
            void loadPurchases(purchasesPage, purchasesPlatform)
            void loadLedger()
          }}
          disabled={summaryLoading}
        >
          {summaryLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
          전체 새로고침
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">총 결제 온(ON) / 건수</p>
                <p className="text-2xl font-bold mt-1">
                  {summaryLoading ? '—' : `${summary?.totalPointsPurchased.toLocaleString()} 온`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  총 {summary?.totalPurchasesCount.toLocaleString() ?? 0}건 결제
                </p>
              </div>
              <Coins className="h-8 w-8 text-amber-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">대기 중인 환불 요청</p>
                <p className="text-2xl font-bold mt-1 text-rose-600">
                  {summaryLoading ? '—' : `${summary?.pendingRefundsCount.toLocaleString()}건`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">승인/거절 필요</p>
              </div>
              <AlertCircle className="h-8 w-8 text-rose-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">사용자 보유 온(ON) 총합</p>
                <p className="text-2xl font-bold mt-1">
                  {summaryLoading ? '—' : `${summary?.totalSpendableBalance.toLocaleString()} 온`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  활성 지갑 {summary?.totalWallets.toLocaleString() ?? 0}개
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">출금 가능 잔액 / 대기액</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">
                  {summaryLoading ? '—' : `${summary?.totalRedeemableBalance.toLocaleString()} 온`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  정산 대기 {summary?.totalPendingEarnings.toLocaleString() ?? 0} 온
                  {(summary?.pendingSettlementsCount ?? 0) > 0 && (
                    <span className="ml-1.5 font-semibold text-amber-600">
                      ({summary?.pendingSettlementsCount}건 대기)
                    </span>
                  )}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-emerald-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 bg-indigo-50/20">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-indigo-700">회사 누적 수수료 수익</p>
                <p className="text-2xl font-bold mt-1 text-indigo-900">
                  {summaryLoading ? '—' : `${(summary?.totalPlatformRevenueKrw ?? 0).toLocaleString()}원`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">승인 정산 플랫폼 마진</p>
              </div>
              <Building className="h-8 w-8 text-indigo-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="requests" className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" />
            출금 신청
            {summary && (summary.pendingSettlementsCount ?? 0) > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] text-white">
                {summary.pendingSettlementsCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="refunds" className="flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" />
            환불 요청
            {summary && summary.pendingRefundsCount > 0 && (
              <span className="ml-1 rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] text-white">
                {summary.pendingRefundsCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="purchases" className="flex items-center gap-1.5">
            <Coins className="h-4 w-4" />
            결제 내역
          </TabsTrigger>
          <TabsTrigger value="ledger" className="flex items-center gap-1.5">
            <History className="h-4 w-4" />
            원장 로그
          </TabsTrigger>
        </TabsList>

        {/* Tab 0: Settlement Requests */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
              <div>
                <CardTitle className="text-lg">크리에이터 출금 신청 내역</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  수익금 환전 신청을 검토하고 원천징수 세금(3.3%) 확인 후 승인(송금) 또는 반려 처리합니다.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-48 sm:w-60">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="예금주, 은행명, 계좌번호, 닉네임..."
                    value={requestsSearch}
                    onChange={(e) => setRequestsSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <Select value={requestsStatus} onValueChange={setRequestsStatus}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue placeholder="상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 상태</SelectItem>
                    <SelectItem value="PENDING">대기 중</SelectItem>
                    <SelectItem value="APPROVED">승인 완료</SelectItem>
                    <SelectItem value="REJECTED">반려됨</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => void loadRequests(requestsPage, requestsStatus, requestsSearch)}
                  disabled={requestsLoading}
                >
                  {requestsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : requests.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  접수된 출금 신청 내역이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="p-2.5 font-medium">신청일시 / ID</th>
                        <th className="p-2.5 font-medium">호스트 / 등급</th>
                        <th className="p-2.5 font-medium">입금 계좌 정보</th>
                        <th className="p-2.5 font-medium text-right">신청 온(ON)</th>
                        <th className="p-2.5 font-medium text-right">적용 단가</th>
                        <th className="p-2.5 font-medium text-right">회사 수수료</th>
                        <th className="p-2.5 font-medium text-right">세금(3.3%)</th>
                        <th className="p-2.5 font-medium text-right">실지급액(KRW)</th>
                        <th className="p-2.5 font-medium text-center">상태</th>
                        <th className="p-2.5 font-medium">처리 정보 / 메모</th>
                        <th className="p-2.5 font-medium text-right">관리 액션</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {requests.map((item) => {
                        const style = SETTLEMENT_STATUS_STYLES[item.status] ?? {
                          bg: 'bg-slate-100',
                          text: 'text-slate-700',
                          label: item.status,
                        }
                        const tier = item.tier || item.activityAccount?.owner?.legacyUser?.streamerTier || 'ROOKIE'
                        const effectiveRate = item.exchangeRate ?? (tier === 'PARTNER' ? 80 : tier === 'BEST' ? 70 : 60)
                        const platformFee = item.platformFeeKrw != null ? item.platformFeeKrw : Math.max(0, (item.pointsAmount * 100) - item.krwAmount)

                        return (
                          <tr key={item.id} className="hover:bg-muted/30">
                            <td className="p-2.5">
                              <p className="font-medium text-foreground">
                                {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(item.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="font-mono text-[9px] text-muted-foreground truncate max-w-[90px]">
                                {item.id}
                              </p>
                            </td>
                            <td className="p-2.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-foreground">
                                  {item.activityAccount?.displayName ?? '미지정'}
                                </span>
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                    tier === 'PARTNER'
                                      ? 'bg-purple-100 text-purple-700'
                                      : tier === 'BEST'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {tier === 'PARTNER' ? '파트너' : tier === 'BEST' ? '베스트' : '루키'}
                                </span>
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                @{item.activityAccount?.handle ?? item.activityAccountId.slice(0, 8)}
                              </div>
                            </td>
                            <td className="p-2.5">
                              <div className="flex items-center gap-1 font-semibold text-foreground">
                                <Building className="h-3 w-3 text-muted-foreground" />
                                {item.bankName}
                              </div>
                              <div className="font-mono text-[11px] text-muted-foreground">
                                {item.accountNumber}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                예금주: <span className="font-medium text-foreground">{item.accountHolder}</span>
                              </div>
                            </td>
                            <td className="p-2.5 text-right font-medium text-foreground">
                              {item.pointsAmount.toLocaleString()} 온
                            </td>
                            <td className="p-2.5 text-right font-semibold text-foreground">
                              {effectiveRate}원/온
                            </td>
                            <td className="p-2.5 text-right font-semibold text-indigo-600">
                              +{platformFee.toLocaleString()}원
                            </td>
                            <td className="p-2.5 text-right text-rose-600 font-medium">
                              -{item.taxAmount.toLocaleString()}원
                            </td>
                            <td className="p-2.5 text-right font-bold text-emerald-600">
                              {item.netAmount.toLocaleString()}원
                            </td>
                            <td className="p-2.5 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${style.bg} ${style.text}`}
                              >
                                {style.label}
                              </span>
                            </td>
                            <td className="p-2.5 text-muted-foreground max-w-[160px]">
                              {item.adminMemo ? (
                                <p className="truncate text-foreground font-medium text-[11px]" title={item.adminMemo}>
                                  {item.adminMemo}
                                </p>
                              ) : (
                                <p className="text-[11px] text-muted-foreground">—</p>
                              )}
                              {item.processedAt && (
                                <p className="text-[9px] text-muted-foreground">
                                  {new Date(item.processedAt).toLocaleDateString('ko-KR')} 처리
                                </p>
                              )}
                            </td>
                            <td className="p-2.5 text-right">
                              {item.status === 'PENDING' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px]"
                                    onClick={() => {
                                      setSelectedRequestForApprove(item)
                                      setApproveMemo('')
                                      setApproveModalOpen(true)
                                    }}
                                  >
                                    <Check className="mr-1 h-3 w-3" />
                                    송금 승인
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px]"
                                    onClick={() => {
                                      setSelectedRequestForReject(item)
                                      setRejectReason('')
                                      setRejectModalOpen(true)
                                    }}
                                  >
                                    <X className="mr-1 h-3 w-3" />
                                    반려
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">처리 완료</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {requestsTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4 text-xs">
                  <span className="text-muted-foreground">
                    총 {requestsTotal}건 중 {(requestsPage - 1) * 15 + 1}~{Math.min(requestsPage * 15, requestsTotal)}건
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2"
                      onClick={() => setRequestsPage((p) => Math.max(1, p - 1))}
                      disabled={requestsPage <= 1}
                    >
                      이전
                    </Button>
                    <span className="px-2">
                      {requestsPage} / {requestsTotalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2"
                      onClick={() => setRequestsPage((p) => Math.min(requestsTotalPages, p + 1))}
                      disabled={requestsPage >= requestsTotalPages}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 1: Refunds */}
        <TabsContent value="refunds" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
              <div>
                <CardTitle className="text-lg">환불 요청 목록</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  접수된 인앱 결제 환불 요청을 검토하고 승인 또는 거절 처리합니다.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-48 sm:w-60">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="사용자명, 이메일, 영수증 ID..."
                    value={refundSearch}
                    onChange={(e) => setRefundSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <Select value={refundStatusFilter} onValueChange={setRefundStatusFilter}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue placeholder="상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 상태</SelectItem>
                    <SelectItem value="pending">대기 중</SelectItem>
                    <SelectItem value="approved">승인 완료</SelectItem>
                    <SelectItem value="denied">거절</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="h-8" onClick={() => void loadRefunds()} disabled={refundsLoading}>
                  {refundsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {refundsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredRefunds.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">조회된 환불 요청이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {filteredRefunds.map((refund) => {
                    const st = REFUND_STATUS_STYLES[refund.status.toLowerCase()] ?? {
                      bg: 'bg-muted',
                      text: 'text-muted-foreground',
                      label: refund.status,
                    }
                    const isPending = refund.status.toLowerCase() === 'pending'
                    const isActioning = actioningRefundId === refund.id

                    return (
                      <div
                        key={refund.id}
                        className="rounded-lg border p-4 transition-colors hover:bg-muted/40 space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.bg} ${st.text}`}>
                              {st.label}
                            </span>
                            <span className="font-semibold text-sm">
                              {refund.user?.displayName || refund.user?.email || refund.userId}
                            </span>
                            {refund.user?.pointsBalance !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                (잔여: {refund.user.pointsBalance.toLocaleString()}P)
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            요청일: {new Date(refund.createdAt).toLocaleString('ko-KR')}
                            {refund.decidedAt && (
                              <span className="ml-2">
                                | 처리일: {new Date(refund.decidedAt).toLocaleString('ko-KR')}
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground pt-1 border-t">
                          <div>
                            <span className="font-medium text-foreground">플랫폼: </span>
                            {refund.platform.toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-foreground">상품 ID: </span>
                            {refund.productId}
                          </div>
                          <div className="col-span-2 truncate">
                            <span className="font-medium text-foreground">영수증/주문 ID: </span>
                            <span className="font-mono">{refund.receiptId}</span>
                          </div>
                        </div>

                        {refund.reason && (
                          <div className="text-xs bg-muted/60 rounded px-2.5 py-1.5 text-foreground">
                            <span className="font-semibold text-muted-foreground">환불 사유: </span>
                            {refund.reason}
                          </div>
                        )}

                        {isPending && (
                          <div className="flex justify-end gap-2 pt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              disabled={isActioning}
                              onClick={() => void handleDenyRefund(refund.id)}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              환불 거절
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              disabled={isActioning}
                              onClick={() => void handleApproveRefund(refund.id)}
                            >
                              {isActioning ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              )}
                              환불 승인
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Purchases */}
        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
              <div>
                <CardTitle className="text-lg">포인트 결제 내역</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  앱 내 포인트 상품 충전/구매 내역 및 거래 ID를 조회합니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={purchasesPlatform}
                  onValueChange={(val) => {
                    setPurchasesPlatform(val)
                    setPurchasesPage(1)
                  }}
                >
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue placeholder="플랫폼" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 플랫폼</SelectItem>
                    <SelectItem value="android">Android</SelectItem>
                    <SelectItem value="ios">iOS</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => void loadPurchases(purchasesPage, purchasesPlatform)}
                  disabled={purchasesLoading}
                >
                  {purchasesLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {purchasesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : purchases.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">결제 내역이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 border-b text-muted-foreground font-medium">
                        <tr>
                          <th className="p-2.5">거래 일시</th>
                          <th className="p-2.5">사용자</th>
                          <th className="p-2.5">플랫폼</th>
                          <th className="p-2.5">상품 ID</th>
                          <th className="p-2.5">충전 포인트</th>
                          <th className="p-2.5">상태</th>
                          <th className="p-2.5">거래 ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {purchases.map((p) => (
                          <tr key={p.id} className="hover:bg-muted/30">
                            <td className="p-2.5 whitespace-nowrap text-muted-foreground">
                              {new Date(p.createdAt).toLocaleString('ko-KR')}
                            </td>
                            <td className="p-2.5 font-medium">
                              {p.user?.displayName || p.user?.email || p.userId}
                            </td>
                            <td className="p-2.5 uppercase font-semibold text-muted-foreground">
                              {p.platform}
                            </td>
                            <td className="p-2.5 font-mono text-muted-foreground">{p.productId}</td>
                            <td className="p-2.5 font-bold text-amber-600">+{p.points.toLocaleString()}P</td>
                            <td className="p-2.5">
                              <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
                                {p.status}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-muted-foreground truncate max-w-[150px]">
                              {p.transactionId}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {purchasesTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-muted-foreground">
                        총 {purchasesTotal.toLocaleString()}건 중 {purchases.length}개 표시
                      </p>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={purchasesPage <= 1 || purchasesLoading}
                          onClick={() => setPurchasesPage((p) => Math.max(1, p - 1))}
                        >
                          이전
                        </Button>
                        <span className="px-2 text-xs flex items-center">
                          {purchasesPage} / {purchasesTotalPages}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={purchasesPage >= purchasesTotalPages || purchasesLoading}
                          onClick={() => setPurchasesPage((p) => p + 1)}
                        >
                          다음
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Ledger */}
        <TabsContent value="ledger" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
              <div>
                <CardTitle className="text-lg">지갑 원장 (Wallet Ledger) 스트림</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  불변 원장(Immutable Ledger)에 기록된 최근 지갑 잔액 변동 내역입니다.
                </p>
              </div>
              <Button size="sm" variant="outline" className="h-8" onClick={() => void loadLedger()} disabled={ledgerLoading}>
                {ledgerLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
              </Button>
            </CardHeader>
            <CardContent>
              {ledgerLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : ledger.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">기록된 원장 로그가 없습니다.</p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 border-b text-muted-foreground font-medium">
                      <tr>
                        <th className="p-2.5">일시</th>
                        <th className="p-2.5">계정 / 지갑</th>
                        <th className="p-2.5">종류 / 소스</th>
                        <th className="p-2.5 text-right">보유 포인트 변동</th>
                        <th className="p-2.5 text-right">변동 후 잔액</th>
                        <th className="p-2.5 text-right">출금 가능 변동</th>
                        <th className="p-2.5">멱등성 키</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {ledger.map((item) => {
                        const isPositive = item.deltaSpendable >= 0
                        return (
                          <tr key={item.id} className="hover:bg-muted/30">
                            <td className="p-2.5 whitespace-nowrap text-muted-foreground">
                              {new Date(item.createdAt).toLocaleString('ko-KR')}
                            </td>
                            <td className="p-2.5 font-medium">
                              {item.wallet?.activityAccount?.displayName ||
                                item.wallet?.activityAccount?.handle ||
                                item.walletId.substring(0, 10)}
                            </td>
                            <td className="p-2.5">
                              <span className="font-semibold text-foreground">{item.kind}</span>
                              <span className="text-muted-foreground ml-1 text-[10px]">({item.source})</span>
                            </td>
                            <td className={`p-2.5 text-right font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                              <span className="inline-flex items-center gap-0.5">
                                {isPositive ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                                {isPositive ? `+${item.deltaSpendable}` : item.deltaSpendable}P
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-medium text-foreground">
                              {item.spendableAfter.toLocaleString()}P
                            </td>
                            <td className="p-2.5 text-right text-muted-foreground">
                              {item.deltaRedeemable !== 0 ? `${item.deltaRedeemable > 0 ? '+' : ''}${item.deltaRedeemable}P` : '—'}
                            </td>
                            <td className="p-2.5 font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
                              {item.idempotencyKey}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              출금 요청 승인 및 송금 완료
            </DialogTitle>
            <DialogDescription>
              아래 송금 정보를 확인 후 승인 처리하세요. 크리에이터의 정산 대기 잔액이 정산 완료로 소진됩니다.
            </DialogDescription>
          </DialogHeader>

          {selectedRequestForApprove && (
            <div className="space-y-3 py-2 text-xs">
              <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">호스트 / 등급:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">
                      {selectedRequestForApprove.activityAccount?.displayName ?? '미지정'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                      {selectedRequestForApprove.tier === 'PARTNER'
                        ? '파트너'
                        : selectedRequestForApprove.tier === 'BEST'
                        ? '베스트'
                        : '루키'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">입금 은행:</span>
                  <span className="font-semibold text-foreground">{selectedRequestForApprove.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">계좌번호:</span>
                  <span className="font-mono font-semibold text-foreground">{selectedRequestForApprove.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">예금주:</span>
                  <span className="font-semibold text-foreground">{selectedRequestForApprove.accountHolder}</span>
                </div>
                <div className="border-t pt-1.5 flex justify-between">
                  <span className="text-muted-foreground">신청 수량:</span>
                  <span className="font-medium text-foreground">{selectedRequestForApprove.pointsAmount.toLocaleString()} 온</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">적용 환전 단가:</span>
                  <span className="font-semibold text-foreground">{selectedRequestForApprove.exchangeRate ?? 60}원/온</span>
                </div>
                <div className="flex justify-between text-indigo-700 font-medium">
                  <span>플랫폼 수수료 (회사 수익):</span>
                  <span>
                    +{(selectedRequestForApprove.platformFeeKrw != null
                      ? selectedRequestForApprove.platformFeeKrw
                      : Math.max(0, (selectedRequestForApprove.pointsAmount * 100) - selectedRequestForApprove.krwAmount)
                    ).toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>원천징수세(3.3%):</span>
                  <span>-{selectedRequestForApprove.taxAmount.toLocaleString()}원</span>
                </div>
                <div className="border-t pt-1.5 flex justify-between text-sm font-bold text-emerald-600">
                  <span>실 지급 송금액:</span>
                  <span>{selectedRequestForApprove.netAmount.toLocaleString()}원</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">관리자 송금 메모 (선택)</label>
                <Input
                  placeholder="예: 기업은행 송금 완료 (이체번호: 20261001-001)"
                  value={approveMemo}
                  onChange={(e) => setApproveMemo(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setApproveModalOpen(false)} disabled={submittingAction}>
              취소
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => void handleApproveSettlement()}
              disabled={submittingAction}
            >
              {submittingAction ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-2 h-3.5 w-3.5" />}
              승인 및 송금 완료 처리
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <XCircle className="h-5 w-5" />
              출금 요청 반려
            </DialogTitle>
            <DialogDescription>
              요청을 반려하면 대기 잔액에서 차감되었던{' '}
              <strong className="text-foreground">
                {selectedRequestForReject?.pointsAmount.toLocaleString()}P
              </strong>
              가 크리에이터의 출금 가능 잔액으로 즉시 환원됩니다.
            </DialogDescription>
          </DialogHeader>

          {selectedRequestForReject && (
            <div className="space-y-3 py-2 text-xs">
              <div className="rounded-lg border bg-rose-50/50 border-rose-100 p-3 space-y-1">
                <p className="text-muted-foreground">
                  신청자: <span className="font-semibold text-foreground">{selectedRequestForReject.activityAccount?.displayName}</span> (
                  {selectedRequestForReject.bankName} {selectedRequestForReject.accountNumber})
                </p>
                <p className="text-muted-foreground">
                  신청 포인트: <span className="font-bold text-rose-600">{selectedRequestForReject.pointsAmount.toLocaleString()}P</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">
                  반려 사유 <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="예: 예금주명과 본인 확인 명의 불일치 / 계좌번호 오류"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setRejectModalOpen(false)} disabled={submittingAction}>
              취소
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => void handleRejectSettlement()}
              disabled={submittingAction || !rejectReason.trim()}
            >
              {submittingAction ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <X className="mr-2 h-3.5 w-3.5" />}
              반려 및 포인트 환원
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
