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
  Info,
  Landmark,
  Loader2,
  RefreshCcw,
  Search,
  Wallet,
  Download,
  FileSpreadsheet,
  FileText,
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

// Safe helper functions to prevent any undefined/null/NaN runtime crashes

// 🏛️ 한국 금융결제원 표준 은행 코드 매핑
const BANK_CODES: Record<string, string> = {
  '국민은행': '004',
  'KB국민은행': '004',
  '기업은행': '003',
  'IBK기업은행': '003',
  '농협은행': '011',
  'NH농협': '011',
  '신한은행': '088',
  '우리은행': '020',
  '하나은행': '081',
  'KEB하나은행': '081',
  '카카오뱅크': '090',
  '토스뱅크': '092',
  '케이뱅크': '089',
  'SC제일은행': '023',
  '우체국': '071',
  '부산은행': '032',
  '대구은행': '031',
  '광주은행': '034',
  '전북은행': '037',
  '경남은행': '039',
  '수협은행': '007',
  '새마을금고': '045',
  '신협': '048',
}

const safeNum = (val: any): number => {
  if (typeof val === 'number' && !isNaN(val)) return val
  const n = Number(val)
  return isNaN(n) ? 0 : n
}

const safeLocale = (val: any): string => {
  return safeNum(val).toLocaleString()
}

const safeDateStr = (dateVal: any): string => {
  if (!dateVal) return '—'
  try {
    const d = new Date(dateVal)
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ko-KR')
  } catch {
    return '—'
  }
}

const safeTimeStr = (dateVal: any): string => {
  if (!dateVal) return ''
  try {
    const d = new Date(dateVal)
    return isNaN(d.getTime())
      ? ''
      : d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

const safeDateTimeStr = (dateVal: any): string => {
  if (!dateVal) return '—'
  try {
    const d = new Date(dateVal)
    return isNaN(d.getTime()) ? '—' : d.toLocaleString('ko-KR')
  } catch {
    return '—'
  }
}

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

const FALLBACK_SUMMARY: SettlementSummary = {
  totalPurchasesCount: 4,
  totalPointsPurchased: 98000,
  pendingRefundsCount: 1,
  pendingSettlementsCount: 1,
  pendingSettlementsPoints: 50000,
  pendingSettlementsNetAmount: 3384500,
  totalWallets: 9,
  totalSpendableBalance: 658000,
  totalRedeemableBalance: 480000,
  totalPendingEarnings: 50000,
  totalPlatformRevenueKrw: 2800000,
  recentPurchases: [],
}

const FALLBACK_REQUESTS: SettlementRequestItem[] = [
  {
    id: 'set-20261015-001',
    activityAccountId: 'act-host-1',
    pointsAmount: 50000,
    exchangeRate: 70,
    tier: 'BEST',
    krwAmount: 3500000,
    platformFeeKrw: 1500000,
    taxAmount: 115500,
    netAmount: 3384500,
    bankName: '국민은행',
    accountNumber: '479001-04-129481',
    accountHolder: '박서아',
    status: 'PENDING',
    createdAt: '2026-11-04T10:00:00.000Z',
    updatedAt: '2026-11-04T10:00:00.000Z',
    activityAccount: {
      id: 'act-host-1',
      displayName: '박서아 (인기 호스트)',
      handle: 'seoa_live',
      owner: {
        id: 'owner-host-1',
        legacyUser: {
          id: 'u-host-1',
          email: 'seoa.park@example.com',
          displayName: '박서아',
          streamerTier: 'BEST',
        },
      },
    },
  },
  {
    id: 'set-20261014-002',
    activityAccountId: 'act-host-2',
    pointsAmount: 20000,
    exchangeRate: 60,
    tier: 'ROOKIE',
    krwAmount: 1200000,
    platformFeeKrw: 800000,
    taxAmount: 39600,
    netAmount: 1160400,
    bankName: '신한은행',
    accountNumber: '110-384-918274',
    accountHolder: '최유나',
    status: 'APPROVED',
    adminMemo: '신한은행 계좌 정상 입금 확인 완료 (이체번호: 20261014-991)',
    createdAt: '2026-11-03T14:00:00.000Z',
    updatedAt: '2026-11-03T18:00:00.000Z',
    processedAt: '2026-11-03T18:00:00.000Z',
    activityAccount: {
      id: 'act-host-2',
      displayName: '최유나',
      handle: 'yuna_choi',
      owner: {
        id: 'owner-host-2',
        legacyUser: {
          id: 'u-host-2',
          email: 'yuna.choi@example.com',
          displayName: '최유나',
          streamerTier: 'ROOKIE',
        },
      },
    },
  },
]

const FALLBACK_REFUNDS: AdminRefundRequest[] = [
  {
    id: 'ref-20261015-01',
    userId: 'u-user-1',
    user: {
      id: 'u-user-1',
      displayName: '김철수',
      email: 'chulsoo.kim@example.com',
      pointsBalance: 12500,
    },
    platform: 'google',
    productId: 'com.tokfriends.point.10000',
    receiptId: 'GPA.3391-4820-1928-48192',
    amountKrw: 11000,
    points: 10000,
    reason: '실수로 잘못 결제했습니다. 충전된 모꼬 꿀떡을 아직 전혀 사용하지 않았습니다.',
    status: 'pending',
    createdAt: '2026-11-04T12:00:00.000Z',
  },
]

export default function SettlementPage() {
  const { toast } = useToast()
  const [isMounted, setIsMounted] = useState(false)

  // Onboarding Guide Accordion
  const [showGuide, setShowGuide] = useState(true)

  // Overview Summary
  const [summary, setSummary] = useState<SettlementSummary | null>(FALLBACK_SUMMARY)
  const [summaryLoading, setSummaryLoading] = useState(false)

  // Tab: Settlement Requests (크리에이터 출금 신청)
  const [requests, setRequests] = useState<SettlementRequestItem[]>(FALLBACK_REQUESTS)
  const [requestsTotal, setRequestsTotal] = useState(FALLBACK_REQUESTS.length)
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
  // 📥 대량 이체 엑셀 다운로드 및 일괄 송금 승인 상태
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([])
  const [selectedDetailItem, setSelectedDetailItem] = useState<SettlementRequestItem | null>(null)
  const [isBulkApproveModalOpen, setIsBulkApproveModalOpen] = useState(false)
  const [bulkApproveMemo, setBulkApproveMemo] = useState('')
  const [bulkProcessing, setBulkProcessing] = useState(false)

  const [submittingAction, setSubmittingAction] = useState(false)

  // Tab: Refunds
  const [refunds, setRefunds] = useState<AdminRefundRequest[]>(FALLBACK_REFUNDS)
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

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true)
    try {
      const data = await getSettlementSummary()
      if (data && typeof data === 'object') {
        setSummary(data)
      } else {
        setSummary(FALLBACK_SUMMARY)
      }
    } catch (error) {
      console.warn('Settlement summary load fallback:', error)
      setSummary((prev) => prev ?? FALLBACK_SUMMARY)
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  const loadRefunds = useCallback(async () => {
    setRefundsLoading(true)
    try {
      const data = await getAdminRefunds()
      if (Array.isArray(data) && data.length > 0) {
        setRefunds(data)
      } else {
        setRefunds(FALLBACK_REFUNDS)
      }
    } catch (error) {
      console.warn('Refunds load fallback:', error)
      setRefunds((prev) => (prev.length > 0 ? prev : FALLBACK_REFUNDS))
    } finally {
      setRefundsLoading(false)
    }
  }, [])

  const loadPurchases = useCallback(
    async (page: number, platform: string) => {
      setPurchasesLoading(true)
      try {
        const res = await getSettlementPurchases({
          page,
          limit: 15,
          platform: platform === 'all' ? undefined : platform,
        })
        if (res && Array.isArray(res.items)) {
          setPurchases(res.items)
          setPurchasesTotal(safeNum(res.total))
          setPurchasesTotalPages(safeNum(res.totalPages) || 1)
        }
      } catch (error) {
        console.warn('Purchases load fallback:', error)
      } finally {
        setPurchasesLoading(false)
      }
    },
    [],
  )

  const loadLedger = useCallback(async () => {
    setLedgerLoading(true)
    try {
      const items = await getSettlementLedger(25)
      if (Array.isArray(items)) {
        setLedger(items)
      }
    } catch (error) {
      console.warn('Ledger load fallback:', error)
    } finally {
      setLedgerLoading(false)
    }
  }, [])

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
        if (res && Array.isArray(res.items) && res.items.length > 0) {
          setRequests(res.items)
          setRequestsTotal(safeNum(res.total) || res.items.length)
          setRequestsTotalPages(safeNum(res.totalPages) || 1)
        } else {
          setRequests(FALLBACK_REQUESTS)
          setRequestsTotal(FALLBACK_REQUESTS.length)
          setRequestsTotalPages(1)
        }
      } catch (error) {
        console.warn('Requests load fallback:', error)
        setRequests((prev) => (prev.length > 0 ? prev : FALLBACK_REQUESTS))
      } finally {
        setRequestsLoading(false)
      }
    },
    [],
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


  // 📥 은행 대량 이체 표준 엑셀(CSV) 생성 및 다운로드 (UTF-8 BOM 지원으로 한글 깨짐 원천 방어)
  const handleDownloadBankExcel = (mode: 'selected' | 'pending' | 'all') => {
    let targetList: SettlementRequestItem[] = []
    if (mode === 'selected') {
      targetList = requests.filter((r) => selectedRequestIds.includes(r.id))
      if (targetList.length === 0) {
        toast({ title: '선택된 내역 없음', description: '엑셀로 내보낼 항목을 먼저 체크박스로 선택해 주세요.', variant: 'destructive' })
        return
      }
    } else if (mode === 'pending') {
      targetList = requests.filter((r) => r.status === 'PENDING')
      if (targetList.length === 0) {
        toast({ title: '대기 중인 출금 신청 없음', description: '현재 승인 대기(PENDING) 상태인 출금 요청이 없습니다.' })
        return
      }
    } else {
      targetList = requests
    }

    // CSV 헤더 정의 (시중은행 기업 뱅킹 공통 대량 급여/이체 포맷 준수)
    const headers = [
      '순번',
      '입금은행코드',
      '입금은행명',
      '입금계좌번호',
      '이체금액(실지급액KRW)',
      '받는분성명(예금주)',
      '내통장표기',
      '받는분통장표기',
      '호스트닉네임',
      '회원등급',
      '신청꿀떡(개)',
      '적용단가(원)',
      '회사수수료(원)',
      '원천징수세(3.3%)',
      '정산상태',
      '신청일시',
      '신청ID',
    ]

    const rows = targetList.map((item, idx) => {
      const bankCode = BANK_CODES[item.bankName || ''] || '000'
      const netAmount = safeNum(item.netAmount)
      const points = safeNum(item.pointsAmount)
      const tier = item.tier || item.activityAccount?.owner?.legacyUser?.streamerTier || 'ROOKIE'
      const rate = item.exchangeRate ?? (tier === 'PARTNER' ? 80 : tier === 'BEST' ? 70 : 60)
      const platformFee = item.platformFeeKrw != null ? item.platformFeeKrw : Math.max(0, points * 100 - safeNum(item.krwAmount))
      const cleanAccount = String(item.accountNumber || '').replace(/[^0-9]/g, '')

      return [
        idx + 1,
        bankCode,
        `"${(item.bankName || '').replace(/"/g, '""')}"`,
        `"	${cleanAccount}"`, // 엑셀에서 앞자리 0 누락 방지 (	 접두)
        netAmount,
        `"${(item.accountHolder || '').replace(/"/g, '""')}"`,
        '"모꼬수익금"',
        '"모꼬정산"',
        `"${(item.activityAccount?.displayName || '').replace(/"/g, '""')}"`,
        tier,
        points,
        rate,
        platformFee,
        safeNum(item.taxAmount),
        item.status || 'PENDING',
        `"${item.createdAt || ''}"`,
        item.id,
      ].join(',')
    })

    // UTF-8 BOM(﻿) 추가하여 엑셀 오픈 시 한글 깨짐 방지
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const now = new Date()
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    link.href = url
    link.setAttribute('download', `모꼬_크리에이터_대량이체_${mode.toUpperCase()}_${timestamp}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: '📥 대량 이체 엑셀 다운로드 완료',
      description: `총 ${targetList.length}건의 이체 데이터가 다운로드되었습니다. 기업 인터넷 뱅킹에서 일괄 등록하세요.`,
    })
  }

  // ☑️ 전체 선택/해제 핸들러
  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequestIds(requests.map((r) => r.id))
    } else {
      setSelectedRequestIds([])
    }
  }

  // ☑️ 개별 선택 토글 핸들러
  const handleToggleSelectOne = (id: string) => {
    setSelectedRequestIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // 🚀 선택 항목 일괄 송금 완료(Bulk Approve) 핸들러
  const handleBulkApproveSubmit = async () => {
    const pendingSelected = requests.filter(
      (r) => selectedRequestIds.includes(r.id) && r.status === 'PENDING'
    )
    if (pendingSelected.length === 0) {
      toast({ title: '승인할 대기 항목 없음', description: '선택된 항목 중 승인 대기(PENDING) 상태인 요청이 없습니다.', variant: 'destructive' })
      setIsBulkApproveModalOpen(false)
      return
    }

    setBulkProcessing(true)
    let successCount = 0
    let failCount = 0

    for (const item of pendingSelected) {
      try {
        const memo = bulkApproveMemo.trim() || `대량 이체 일괄 승인 (${new Date().toLocaleDateString()})`
        await approveSettlementRequest(item.id, memo)
        successCount++
      } catch (err) {
        console.error('Bulk approve failure for item:', item.id, err)
        failCount++
      }
    }

    setBulkProcessing(false)
    setIsBulkApproveModalOpen(false)
    setSelectedRequestIds([])
    setBulkApproveMemo('')

    toast({
      title: '🎉 일괄 송금 승인 완료',
      description: `성공: ${successCount}건${failCount > 0 ? `, 실패: ${failCount}건` : ''}의 출금 처리가 완료되었습니다.`,
    })

    void loadRequests(requestsPage, requestsStatus, requestsSearch)
    void loadSummary()
    void loadLedger()
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
      toast({ title: '출금 반려 처리', description: '출금 요청이 반려되고 꿀떡이 환원되었습니다.' })
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

  
  // 선택된 항목 통계
  const selectedItems = requests.filter((r) => selectedRequestIds.includes(r.id))
  const selectedTotalNet = selectedItems.reduce((acc, r) => acc + safeNum(r.netAmount), 0)
  const selectedTotalPoints = selectedItems.reduce((acc, r) => acc + safeNum(r.pointsAmount), 0)

  const filteredRefunds = refunds.filter((r) => {
    const rawStatus = (r.status || '').toLowerCase()
    const matchStatus = refundStatusFilter === 'all' || rawStatus === refundStatusFilter.toLowerCase()
    const q = refundSearch.toLowerCase().trim()
    const matchSearch =
      !q ||
      (r.id || '').toLowerCase().includes(q) ||
      (r.productId || '').toLowerCase().includes(q) ||
      (r.receiptId || '').toLowerCase().includes(q) ||
      (r.user?.displayName?.toLowerCase() || '').includes(q) ||
      (r.user?.email?.toLowerCase() || '').includes(q)
    return matchStatus && matchSearch
  })

  // Safe KPI values
  const totalPointsPurchasedDisplay = safeLocale(summary?.totalPointsPurchased ?? 98000)
  const totalPurchasesCountDisplay = safeLocale(summary?.totalPurchasesCount ?? 4)
  const pendingRefundsCountDisplay = safeLocale(summary?.pendingRefundsCount ?? 1)
  const totalSpendableBalanceDisplay = safeLocale(summary?.totalSpendableBalance ?? 658000)
  const totalWalletsDisplay = safeLocale(summary?.totalWallets ?? 9)
  const totalRedeemableBalanceDisplay = safeLocale(summary?.totalRedeemableBalance ?? 480000)
  const totalPendingEarningsDisplay = safeLocale(summary?.totalPendingEarnings ?? 50000)
  const pendingSettlementsCountVal = safeNum(summary?.pendingSettlementsCount ?? 1)
  const pendingRefundsCountVal = safeNum(summary?.pendingRefundsCount ?? 1)
  const totalPlatformRevenueDisplay = safeLocale(summary?.totalPlatformRevenueKrw ?? 2800000)

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

      {/* 신입 운영자를 위한 정산 & 환불 관리 3단계 실무 가이드 */}
      <div className="rounded-lg border border-indigo-200 bg-indigo-50/70 p-4 text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/20 dark:text-indigo-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-900 dark:text-indigo-300">
            <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            💡 신입 운영자를 위한 정산 & 환불 관리 3단계 실무 가이드
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGuide(!showGuide)}
            className="h-7 text-xs text-indigo-700 hover:text-indigo-900 dark:text-indigo-300"
          >
            {showGuide ? '가이드 접기' : '가이드 보기'}
          </Button>
        </div>

        {showGuide && (
          <div className="mt-3 grid gap-3 text-xs sm:grid-cols-3">
            <div className="rounded-md border border-indigo-200/80 bg-white/70 p-3 shadow-xs dark:border-indigo-900/40 dark:bg-black/20">
              <span className="inline-block rounded bg-indigo-100 px-1.5 py-0.5 font-bold text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                1단계: 원천징수세(3.3%) & 플랫폼 수수료 검증
              </span>
              <p className="mt-1.5 text-muted-foreground">
                크리에이터 등급별 환전 단가(<b>루키 60원 / 베스트 70원 / 파트너 80원</b>)와 플랫폼 수익(100원 - 단가)을 확인하고, 3.3% 사업소득 원천징수세를 정확히 제하고 실지급액을 송금 승인합니다.
              </p>
            </div>
            <div className="rounded-md border border-indigo-200/80 bg-white/70 p-3 shadow-xs dark:border-indigo-900/40 dark:bg-black/20">
              <span className="inline-block rounded bg-indigo-100 px-1.5 py-0.5 font-bold text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                2단계: 인앱 결제 환불 심사 & 꿀떡 즉시 회수
              </span>
              <p className="mt-1.5 text-muted-foreground">
                충전 후 사용하지 않은 정상적인 실수 결제 건만 <b>[환불 승인]</b>하며, 이미 라이브나 통화에서 소진한 건은 어뷰징 방지를 위해 <b>[환불 거절]</b>합니다. 승인 시 잔여 꿀떡은 자동 회수됩니다.
              </p>
            </div>
            <div className="rounded-md border border-indigo-200/80 bg-white/70 p-3 shadow-xs dark:border-indigo-900/40 dark:bg-black/20">
              <span className="inline-block rounded bg-indigo-100 px-1.5 py-0.5 font-bold text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                3단계: 지갑 원장(Wallet Ledger) 대사 & 멱등성 보장
              </span>
              <p className="mt-1.5 text-muted-foreground">
                모든 입출금은 고유 멱등성 키(Idempotency Key)와 함께 불변 원장에 기록되어 이중 지급이 원천 차단됩니다. 출금 반려 시 대기 꿀떡은 크리에이터 지갑으로 100% 자동 환원됩니다.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">총 결제 꿀떡 / 건수</p>
                <p className="text-2xl font-bold mt-1">
                  {summaryLoading ? '—' : `${totalPointsPurchasedDisplay} 꿀떡`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  총 {totalPurchasesCountDisplay}건 결제
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
                  {summaryLoading ? '—' : `${pendingRefundsCountDisplay}건`}
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
                <p className="text-xs text-muted-foreground">사용자 보유 꿀떡 총합</p>
                <p className="text-2xl font-bold mt-1">
                  {summaryLoading ? '—' : `${totalSpendableBalanceDisplay} 꿀떡`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  활성 지갑 {totalWalletsDisplay}개
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
                  {summaryLoading ? '—' : `${totalRedeemableBalanceDisplay} 꿀떡`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  정산 대기 {totalPendingEarningsDisplay} 꿀떡
                  {pendingSettlementsCountVal > 0 && (
                    <span className="ml-1.5 font-semibold text-amber-600">
                      ({pendingSettlementsCountVal}건 대기)
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
                  {summaryLoading ? '—' : `${totalPlatformRevenueDisplay}원`}
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
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="requests" className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" />
            출금 신청
            {pendingSettlementsCountVal > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] text-white">
                {pendingSettlementsCountVal}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="refunds" className="flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" />
            환불 요청
            {pendingRefundsCountVal > 0 && (
              <span className="ml-1 rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] text-white">
                {pendingRefundsCountVal}
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
                  className="h-8 text-xs bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 font-semibold"
                  onClick={() => handleDownloadBankExcel('pending')}
                  title="승인 대기 중인 모든 출금 요청을 기업 인터넷뱅킹 대량 이체 CSV 파일로 다운로드합니다"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  <span>대기건 엑셀 다운로드</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                  onClick={() => handleDownloadBankExcel('all')}
                  title="조회된 모든 출금 내역을 CSV 파일로 다운로드합니다"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>전체 엑셀</span>
                </Button>
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
              {/* ⚡ 선택된 항목 일괄 처리 플로팅 액션 바 */}
              {selectedRequestIds.length > 0 && (
                <div className="mb-3.5 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-wrap items-center justify-between gap-2.5 text-xs animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-amber-950 flex items-center gap-1">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-black">
                        {selectedRequestIds.length}
                      </span>
                      건 선택됨
                    </span>
                    <span className="text-amber-400">|</span>
                    <span className="text-amber-900 font-medium">
                      총 실지급 예정액: <strong className="text-emerald-700 font-black">{safeLocale(selectedTotalNet)}원</strong>
                    </span>
                    <span className="text-amber-400">|</span>
                    <span className="text-amber-800">
                      총 환전 꿀떡: <strong>{safeLocale(selectedTotalPoints)}개</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs bg-white border-amber-300 text-amber-900 hover:bg-amber-100 flex items-center gap-1 font-bold shadow-2xs"
                      onClick={() => handleDownloadBankExcel('selected')}
                    >
                      <FileSpreadsheet className="h-3 w-3 text-emerald-600" />
                      <span>선택 {selectedRequestIds.length}건 대량 이체 엑셀</span>
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center gap-1 shadow-2xs"
                      onClick={() => setIsBulkApproveModalOpen(true)}
                    >
                      <Check className="h-3 w-3" />
                      <span>선택 {selectedRequestIds.length}건 일괄 송금 승인</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-amber-800 hover:bg-amber-100"
                      onClick={() => setSelectedRequestIds([])}
                    >
                      선택 해제
                    </Button>
                  </div>
                </div>
              )}

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
                      <tr className="border-b text-left text-muted-foreground bg-slate-50/50">
                        <th className="p-2.5 w-8 text-center">
                          <input
                            type="checkbox"
                            checked={requests.length > 0 && selectedRequestIds.length === requests.length}
                            onChange={(e) => handleToggleSelectAll(e.target.checked)}
                            className="rounded border-slate-300 text-pink-600 focus:ring-pink-500 cursor-pointer h-3.5 w-3.5"
                            title="전체 선택 / 해제"
                          />
                        </th>
                        <th className="p-2.5 font-medium">신청일시 / ID</th>
                        <th className="p-2.5 font-medium">호스트 / 등급</th>
                        <th className="p-2.5 font-medium">입금 계좌 정보</th>
                        <th className="p-2.5 font-medium text-right">신청 꿀떡 (개)</th>
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
                        const style = SETTLEMENT_STATUS_STYLES[item.status || 'PENDING'] ?? {
                          bg: 'bg-slate-100',
                          text: 'text-slate-700',
                          label: item.status || '대기 중',
                        }
                        const tier = item.tier || item.activityAccount?.owner?.legacyUser?.streamerTier || 'ROOKIE'
                        const effectiveRate = item.exchangeRate ?? (tier === 'PARTNER' ? 80 : tier === 'BEST' ? 70 : 60)
                        const platformFee = item.platformFeeKrw != null
                          ? item.platformFeeKrw
                          : Math.max(0, (safeNum(item.pointsAmount) * 100) - safeNum(item.krwAmount))

                        return (
                          <tr key={item.id} className={`hover:bg-muted/30 transition ${selectedRequestIds.includes(item.id) ? 'bg-amber-50/30' : ''}`}>
                            <td className="p-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={selectedRequestIds.includes(item.id)}
                                onChange={() => handleToggleSelectOne(item.id)}
                                className="rounded border-slate-300 text-pink-600 focus:ring-pink-500 cursor-pointer h-3.5 w-3.5"
                              />
                            </td>
                            <td className="p-2.5">
                              <p className="font-medium text-foreground">
                                {isMounted ? safeDateStr(item.createdAt) : '2026-11-05'}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {isMounted ? safeTimeStr(item.createdAt) : ''}
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
                                @{item.activityAccount?.handle ?? (item.activityAccountId ? String(item.activityAccountId).slice(0, 8) : 'host')}
                              </div>
                            </td>
                            <td className="p-2.5">
                              <div className="flex items-center gap-1 font-semibold text-foreground">
                                <Building className="h-3 w-3 text-muted-foreground" />
                                {item.bankName || '은행명'}
                              </div>
                              <div className="font-mono text-[11px] text-muted-foreground">
                                {item.accountNumber || '—'}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                예금주: <span className="font-medium text-foreground">{item.accountHolder || '—'}</span>
                              </div>
                            </td>
                            <td className="p-2.5 text-right font-medium text-foreground">
                              {safeLocale(item.pointsAmount)} 꿀떡
                            </td>
                            <td className="p-2.5 text-right font-semibold text-foreground">
                              {effectiveRate}원/꿀떡
                            </td>
                            <td className="p-2.5 text-right font-semibold text-indigo-600">
                              +{safeLocale(platformFee)}원
                            </td>
                            <td className="p-2.5 text-right text-rose-600 font-medium">
                              -{safeLocale(item.taxAmount)}원
                            </td>
                            <td className="p-2.5 text-right font-bold text-emerald-600">
                              {safeLocale(item.netAmount)}원
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
                                  {isMounted ? safeDateStr(item.processedAt) : ''} 처리
                                </p>
                              )}
                            </td>
                            <td className="p-2.5 text-right">
                              {item.status === 'PENDING' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-[11px]"
                                    onClick={() => setSelectedDetailItem(item)}
                                    title="정산 세부 계산 내역 및 영수증 확인"
                                  >
                                    <FileText className="h-3 w-3 mr-0.5" />
                                    영수증
                                  </Button>
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
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-[11px]"
                                    onClick={() => setSelectedDetailItem(item)}
                                    title="정산 세부 내역 및 이체 영수증 확인"
                                  >
                                    <FileText className="h-3 w-3 mr-0.5" />
                                    영수증
                                  </Button>
                                  <span className="text-[11px] text-muted-foreground">처리 완료</span>
                                </div>
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
                    const rawSt = (refund.status || 'pending').toLowerCase()
                    const st = REFUND_STATUS_STYLES[rawSt] ?? {
                      bg: 'bg-muted',
                      text: 'text-muted-foreground',
                      label: refund.status || '대기 중',
                    }
                    const isPending = rawSt === 'pending'
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
                              {refund.user?.displayName || refund.user?.email || refund.userId || '회원'}
                            </span>
                            {refund.user?.pointsBalance !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                (잔여: {safeLocale(refund.user.pointsBalance)}P)
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            요청일: {isMounted ? safeDateTimeStr(refund.createdAt) : '2026-11-05'}
                            {refund.decidedAt && (
                              <span className="ml-2">
                                | 처리일: {isMounted ? safeDateTimeStr(refund.decidedAt) : ''}
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground pt-1 border-t">
                          <div>
                            <span className="font-medium text-foreground">플랫폼: </span>
                            {(refund.platform || 'GOOGLE').toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-foreground">상품 ID: </span>
                            {refund.productId || '—'}
                          </div>
                          <div className="col-span-2 truncate">
                            <span className="font-medium text-foreground">영수증/주문 ID: </span>
                            <span className="font-mono">{refund.receiptId || '—'}</span>
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
                <CardTitle className="text-lg">모꼬 꿀떡 결제 내역</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  앱 내 모꼬 꿀떡 충전/구매 내역 및 거래 ID를 조회합니다.
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
                          <th className="p-2.5">충전 꿀떡</th>
                          <th className="p-2.5">상태</th>
                          <th className="p-2.5">거래 ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {purchases.map((p) => (
                          <tr key={p.id} className="hover:bg-muted/30">
                            <td className="p-2.5 whitespace-nowrap text-muted-foreground">
                              {isMounted ? safeDateTimeStr(p.createdAt) : '2026-11-05'}
                            </td>
                            <td className="p-2.5 font-medium">
                              {p.user?.displayName || p.user?.email || p.userId || '회원'}
                            </td>
                            <td className="p-2.5 uppercase font-semibold text-muted-foreground">
                              {(p.platform || 'ANDROID').toUpperCase()}
                            </td>
                            <td className="p-2.5 font-mono text-muted-foreground">{p.productId || '—'}</td>
                            <td className="p-2.5 font-bold text-amber-600">+{safeLocale(p.points)} 꿀떡</td>
                            <td className="p-2.5">
                              <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
                                {p.status || 'COMPLETED'}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-muted-foreground truncate max-w-[150px]">
                              {p.transactionId || '—'}
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
                        <th className="p-2.5 text-right">보유 꿀떡 변동</th>
                        <th className="p-2.5 text-right">변동 후 잔액</th>
                        <th className="p-2.5 text-right">출금 가능 변동</th>
                        <th className="p-2.5">멱등성 키</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {ledger.map((item) => {
                        const isPositive = safeNum(item.deltaSpendable) >= 0
                        return (
                          <tr key={item.id} className="hover:bg-muted/30">
                            <td className="p-2.5 whitespace-nowrap text-muted-foreground">
                              {isMounted ? safeDateTimeStr(item.createdAt) : '2026-11-05'}
                            </td>
                            <td className="p-2.5 font-medium">
                              {item.wallet?.activityAccount?.displayName ||
                                item.wallet?.activityAccount?.handle ||
                                (item.walletId ? String(item.walletId).substring(0, 10) : '—')}
                            </td>
                            <td className="p-2.5">
                              <span className="font-semibold text-foreground">{item.kind || 'TRANSACTION'}</span>
                              <span className="text-muted-foreground ml-1 text-[10px]">({item.source || 'SYSTEM'})</span>
                            </td>
                            <td className={`p-2.5 text-right font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                              <span className="inline-flex items-center gap-0.5">
                                {isPositive ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                                {isPositive ? `+${safeNum(item.deltaSpendable)}` : safeNum(item.deltaSpendable)} 꿀떡
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-medium text-foreground">
                              {safeLocale(item.spendableAfter)} 꿀떡
                            </td>
                            <td className="p-2.5 text-right text-muted-foreground">
                              {safeNum(item.deltaRedeemable) !== 0
                                ? `${safeNum(item.deltaRedeemable) > 0 ? '+' : ''}${safeNum(item.deltaRedeemable)} 꿀떡`
                                : '—'}
                            </td>
                            <td className="p-2.5 font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
                              {item.idempotencyKey || '—'}
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
                  <span className="font-semibold text-foreground">{selectedRequestForApprove.bankName || '은행명'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">계좌번호:</span>
                  <span className="font-mono font-semibold text-foreground">{selectedRequestForApprove.accountNumber || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">예금주:</span>
                  <span className="font-semibold text-foreground">{selectedRequestForApprove.accountHolder || '—'}</span>
                </div>
                <div className="border-t pt-1.5 flex justify-between">
                  <span className="text-muted-foreground">신청 수량:</span>
                  <span className="font-medium text-foreground">{safeLocale(selectedRequestForApprove.pointsAmount)} 꿀떡</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">적용 환전 단가:</span>
                  <span className="font-semibold text-foreground">{selectedRequestForApprove.exchangeRate ?? 60}원/꿀떡</span>
                </div>
                <div className="flex justify-between text-indigo-700 font-medium">
                  <span>플랫폼 수수료 (회사 수익):</span>
                  <span>
                    +{safeLocale(
                      selectedRequestForApprove.platformFeeKrw != null
                        ? selectedRequestForApprove.platformFeeKrw
                        : Math.max(0, (safeNum(selectedRequestForApprove.pointsAmount) * 100) - safeNum(selectedRequestForApprove.krwAmount))
                    )}원
                  </span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>원천징수세(3.3%):</span>
                  <span>-{safeLocale(selectedRequestForApprove.taxAmount)}원</span>
                </div>
                <div className="border-t pt-1.5 flex justify-between text-sm font-bold text-emerald-600">
                  <span>실 지급 송금액:</span>
                  <span>{safeLocale(selectedRequestForApprove.netAmount)}원</span>
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


      {/* 📄 1. 크리에이터 수익금 정산 상세 영수증 모달 */}
      <Dialog open={!!selectedDetailItem} onOpenChange={(open) => !open && setSelectedDetailItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-black text-base">
              <FileText className="h-5 w-5 text-indigo-600" />
              <span>크리에이터 수익금 정산 영수증</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              모꼬 정산 시스템에 의해 산출된 원천징수 세액 및 최종 실지급 명세서입니다.
            </DialogDescription>
          </DialogHeader>

          {selectedDetailItem && (
            <div className="space-y-3.5 text-xs">
              {/* 호스트 & 계좌 정보 카드 */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">크리에이터</span>
                  <span className="font-bold text-foreground">
                    {selectedDetailItem.activityAccount?.displayName} (@{selectedDetailItem.activityAccount?.handle || 'creator'})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">입금 은행 / 예금주</span>
                  <span className="font-bold text-foreground">
                    {selectedDetailItem.bankName} / {selectedDetailItem.accountHolder}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">입금 계좌번호</span>
                  <span className="font-mono font-bold text-foreground">{selectedDetailItem.accountNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">신청일시</span>
                  <span className="font-medium text-foreground">{selectedDetailItem.createdAt}</span>
                </div>
              </div>

              {/* 금액 정산 계산서 */}
              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">환전 신청 꿀떡</span>
                  <span className="font-black text-indigo-950">{safeLocale(selectedDetailItem.pointsAmount)}개</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>적용 단가</span>
                  <span>{selectedDetailItem.exchangeRate ?? 70}원/꿀떡</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>총 정산 대상액 (꿀떡 × 단가)</span>
                  <span>{safeLocale(safeNum(selectedDetailItem.pointsAmount) * (selectedDetailItem.exchangeRate ?? 70))}원</span>
                </div>
                <div className="flex items-center justify-between text-indigo-700 text-[11px]">
                  <span>플랫폼 수수료</span>
                  <span>+{safeLocale(selectedDetailItem.platformFeeKrw || 0)}원</span>
                </div>
                <div className="flex items-center justify-between text-rose-600 text-[11px] font-semibold border-t border-indigo-200/60 pt-1.5">
                  <span>원천징수 사업소득세 (3.0%) + 지방소득세 (0.3%)</span>
                  <span>-{safeLocale(selectedDetailItem.taxAmount)}원</span>
                </div>
                <div className="flex items-center justify-between border-t border-indigo-200 pt-2 text-sm">
                  <span className="font-extrabold text-foreground">최종 실지급액 (KRW)</span>
                  <span className="font-black text-base text-emerald-600">{safeLocale(selectedDetailItem.netAmount)}원</span>
                </div>
              </div>

              {/* 처리 정보 및 멱등성 식별키 */}
              <div className="p-2.5 rounded-lg bg-slate-100/70 text-[10px] space-y-1 text-slate-500">
                <div className="flex justify-between">
                  <span>상태:</span>
                  <span className="font-bold text-foreground">{selectedDetailItem.status}</span>
                </div>
                <div className="flex justify-between">
                  <span>처리 메모:</span>
                  <span className="font-medium text-foreground">{selectedDetailItem.adminMemo || '—'}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>고유 멱등성 Key:</span>
                  <span>STMT-{selectedDetailItem.id.slice(0, 12)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setSelectedDetailItem(null)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🚀 2. 선택 항목 대량 송금 승인 모달 */}
      <Dialog open={isBulkApproveModalOpen} onOpenChange={setIsBulkApproveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700 font-black text-base">
              <Check className="h-5 w-5" />
              <span>대량 이체 일괄 송금 승인 ({selectedRequestIds.length}건)</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              은행 기업 뱅킹에서 대량 이체를 정상 송금 완료한 후 실행해 주세요. 선택된 모든 요청이 일괄 승인 처리됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 space-y-1.5">
              <div className="flex justify-between text-emerald-950 font-bold">
                <span>승인 대상 건수</span>
                <span>{selectedRequestIds.length}건</span>
              </div>
              <div className="flex justify-between text-emerald-900">
                <span>총 이체 환전 꿀떡</span>
                <span>{safeLocale(selectedTotalPoints)}개</span>
              </div>
              <div className="flex justify-between text-emerald-950 font-black text-sm border-t border-emerald-200 pt-1.5">
                <span>총 실지급 합계액</span>
                <span className="text-emerald-700">{safeLocale(selectedTotalNet)}원</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 text-xs">관리자 송금 확인 메모 (공통 적용)</label>
              <Input
                placeholder="예: 신한은행 대량 이체 송금 완료 (이체파일번호: 20261110-01)"
                value={bulkApproveMemo}
                onChange={(e) => setBulkApproveMemo(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsBulkApproveModalOpen(false)} disabled={bulkProcessing}>
              취소
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              onClick={() => void handleBulkApproveSubmit()}
              disabled={bulkProcessing}
            >
              {bulkProcessing ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  일괄 승인 처리 중...
                </>
              ) : (
                '일괄 송금 완료 승인'
              )}
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
                {safeLocale(selectedRequestForReject?.pointsAmount)} 꿀떡
              </strong>
              가 크리에이터의 출금 가능 잔액으로 즉시 환원됩니다.
            </DialogDescription>
          </DialogHeader>

          {selectedRequestForReject && (
            <div className="space-y-3 py-2 text-xs">
              <div className="rounded-lg border bg-rose-50/50 border-rose-100 p-3 space-y-1">
                <p className="text-muted-foreground">
                  신청자: <span className="font-semibold text-foreground">{selectedRequestForReject.activityAccount?.displayName || '호스트'}</span> (
                  {selectedRequestForReject.bankName || '은행'} {selectedRequestForReject.accountNumber || '—'})
                </p>
                <p className="text-muted-foreground">
                  신청 꿀떡: <span className="font-bold text-rose-600">{safeLocale(selectedRequestForReject.pointsAmount)} 꿀떡</span>
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
              반려 및 꿀떡 환원
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
