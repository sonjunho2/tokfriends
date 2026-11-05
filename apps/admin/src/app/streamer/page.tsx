/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Radio,
  ShoppingBag,
  Sparkles,
  Search,
  CheckCircle2,
  Trash2,
  TrendingUp,
  Percent,
  PlusCircle,
  Package,
  Store,
  Crown,
  ExternalLink,
  Coins,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Truck,
  Building2,
  Download,
  CreditCard,
  Wallet,
  FileText,
  Check,
  X,
  Info,
  Calendar,
  Receipt,
  Edit2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useWebAuth } from '@/lib/auth-context'

interface AffiliateProductItem {
  id: string
  name: string
  description: string
  priceKrw: number
  salePriceKrw?: number
  effectivePrice: number
  stock: number
  images: string[]
  category: string
  shippingFee: number
  ownerType: 'HEADQUARTERS' | 'MERCHANT' | 'USER_C2C'
  isHqDirect: boolean
  commissionRate: number
  estimatedCommissionKrw: number
  merchantName: string
  isPicked?: boolean
}

const INITIAL_AFFILIATE_PRODUCTS: AffiliateProductItem[] = [
  {
    id: 'np-001',
    name: '[본사직영] 제주 프리미엄 1등급 흑돼지 오겹살 1kg (산지직송 냉장)',
    description: '제주 청정 농가에서 당일 도축 후 신선 보랭 포장 발송하는 1등급 명품 흑돼지 오겹살입니다.',
    priceKrw: 38000,
    salePriceKrw: 32900,
    effectivePrice: 32900,
    stock: 150,
    images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=800'],
    category: 'FOOD',
    shippingFee: 3000,
    ownerType: 'HEADQUARTERS',
    isHqDirect: true,
    commissionRate: 10.0,
    estimatedCommissionKrw: 3290,
    merchantName: '모꼬(MOCCO) 본사 직영',
  },
  {
    id: 'np-002',
    name: '[입점사상시] 제주 유기농 감귤 착즙 원액주스 1000ml (3병 세트)',
    description: '물 한 방울 섞지 않은 무가당 100% 제주 감귤 순수 착즙 프리미엄 주스입니다.',
    priceKrw: 29000,
    salePriceKrw: 24900,
    effectivePrice: 24900,
    stock: 80,
    images: ['https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800'],
    category: 'FOOD',
    shippingFee: 0,
    ownerType: 'MERCHANT',
    isHqDirect: false,
    commissionRate: 12.0,
    estimatedCommissionKrw: 2988,
    merchantName: '제주푸드 본사 직영',
  },
  {
    id: 'gp-001',
    name: '[본사공구] 프리미엄 나주 특등급 햇배 5kg (목표 20박스 한정)',
    description: '당도 13브릭스 이상 보장 나주 특등급 햇배 공동구매 43% 할인 딜입니다.',
    priceKrw: 35000,
    salePriceKrw: 19900,
    effectivePrice: 19900,
    stock: 20,
    images: ['https://images.unsplash.com/photo-1514756331096-242fdeb7004a?w=800'],
    category: 'FOOD',
    shippingFee: 0,
    ownerType: 'HEADQUARTERS',
    isHqDirect: true,
    commissionRate: 10.0,
    estimatedCommissionKrw: 1990,
    merchantName: '모꼬(MOCCO) 본사 직영',
  },
  {
    id: 'np-003',
    name: '[공식인증] 고순도 프리미엄 알티지 오메가3 120캡슐 (4개월분)',
    description: 'IFOS 최고등급 원료 사용, 흡수율 높은 rTG형 오메가3로 혈행 및 눈 건강을 지켜드립니다.',
    priceKrw: 55000,
    salePriceKrw: 42000,
    effectivePrice: 42000,
    stock: 200,
    images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800'],
    category: 'LIVING',
    shippingFee: 2500,
    ownerType: 'MERCHANT',
    isHqDirect: false,
    commissionRate: 15.0,
    estimatedCommissionKrw: 6300,
    merchantName: '메디컬 헬스케어랩',
  },
  {
    id: 'np-004',
    name: '[입점사상시] 무소음 초음파 감성 아로마 무드등 가습기 500ml',
    description: '심플한 모던 인테리어 디자인과 7가지 은은한 LED 무드등 기능이 탑재된 초음파 가습기.',
    priceKrw: 42000,
    salePriceKrw: 35000,
    effectivePrice: 35000,
    stock: 60,
    images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800'],
    category: 'LIVING',
    shippingFee: 3000,
    ownerType: 'MERCHANT',
    isHqDirect: false,
    commissionRate: 10.0,
    estimatedCommissionKrw: 3500,
    merchantName: '어반 라이프 스타일',
  },
]

export default function StreamerStudioPage() {
  const { toast } = useToast()
  const { user, role, openCreatorModal } = useWebAuth()
  const [activeTab, setActiveTab] = useState<'MY_PICKS' | 'EXPLORE' | 'REVENUE'>('MY_PICKS')

  // Creator Bank & Settlement States
  const [creatorBank, setCreatorBank] = useState({
    bankName: '카카오뱅크',
    accountNumber: '3333-01-9988221',
    accountHolder: '정크리에이터',
  })
  const [isBankModalOpen, setIsBankModalOpen] = useState(false)
  const [bankForm, setBankForm] = useState(creatorBank)

  // Creator Withdrawal Modal State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('300000')

  // Commission Ledger History
  const [commissionHistory, setCommissionHistory] = useState([
    {
      id: 'comm-101',
      date: '2026-11-04 20:30',
      liveTitle: '🔥 제주 특산물 초특가 먹방 & 라이브 특가',
      orderNumber: 'ORD-20261104-5892',
      productName: '[본사직영] 제주 프리미엄 1등급 흑돼지 오겹살 1kg',
      quantity: 3,
      saleTotalKrw: 98700,
      commissionRate: 10.0,
      commissionKrw: 9870,
      status: 'SETTLED',
      statusText: '정산 입금완료',
    },
    {
      id: 'comm-102',
      date: '2026-11-03 21:15',
      liveTitle: '🎧 음향기기 덕후의 소니 헤드폰 실사용 리뷰',
      orderNumber: 'ORD-20261103-1024',
      productName: '소니 WH-1000XM5 프리미엄 무선 노이즈캔슬링 헤드폰',
      quantity: 1,
      saleTotalKrw: 369000,
      commissionRate: 15.0,
      commissionKrw: 55350,
      status: 'PENDING',
      statusText: '구매확정 대기',
    },
    {
      id: 'comm-103',
      date: '2026-10-30 19:00',
      liveTitle: '🍎 제철 과일 산지직송 달콤 과일 라이브',
      orderNumber: 'ORD-20261030-8812',
      productName: '[본사공구] 프리미엄 나주 특등급 햇배 5kg',
      quantity: 5,
      saleTotalKrw: 99500,
      commissionRate: 10.0,
      commissionKrw: 9950,
      status: 'SETTLED',
      statusText: '정산 입금완료',
    },
  ])
  const [searchQuery, setSearchQuery] = useState('')
  const [ownerFilter, setOwnerFilter] = useState<'ALL' | 'HEADQUARTERS' | 'MERCHANT'>('ALL')
  const [availableProducts, setAvailableProducts] = useState<AffiliateProductItem[]>(INITIAL_AFFILIATE_PRODUCTS)
  const [myPicks, setMyPicks] = useState<AffiliateProductItem[]>([INITIAL_AFFILIATE_PRODUCTS[0], INITIAL_AFFILIATE_PRODUCTS[1]])
  const [isLoading, setIsLoading] = useState(false)
  const [settledCommission, setSettledCommission] = useState(458000)
  const [completedOrdersCount, setCompletedOrdersCount] = useState(14)

  // Fetch real affiliate products from backend API if available
  const fetchAffiliateData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/affiliate/products?limit=50', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setAvailableProducts(json.data)
        }
      }
      const myRes = await fetch('/api/affiliate/my-products', { cache: 'no-store' })
      if (myRes.ok) {
        const json = await myRes.json()
        if (json.data && Array.isArray(json.data)) {
          const mapped = json.data.map((item: any) => ({
            ...item.product,
            commissionRate: item.commissionRate,
            estimatedCommissionKrw: item.estimatedCommissionKrw,
          }))
          if (mapped.length > 0) setMyPicks(mapped)
        }
      }
      const statsRes = await fetch('/api/affiliate/stats', { cache: 'no-store' })
      if (statsRes.ok) {
        const json = await statsRes.json()
        if (json.totalSettledCommission !== undefined) {
          setSettledCommission(json.totalSettledCommission)
        }
        if (json.completedOrdersCount !== undefined) {
          setCompletedOrdersCount(json.completedOrdersCount)
        }
      }

      // Sync newly planned HQ Direct & Merchant custom products if affiliate is allowed
      if (typeof window !== 'undefined') {
        // 1) Load saved creator bank
        try {
          const savedBank = localStorage.getItem('mocco_creator_bank')
          if (savedBank) {
            const parsedBank = JSON.parse(savedBank)
            setCreatorBank(parsedBank)
            setBankForm(parsedBank)
          }
        } catch {}

        // 2) Load saved picks
        try {
          const savedPicks = localStorage.getItem('mocco_streamer_my_picks')
          if (savedPicks) {
            const parsedPicks = JSON.parse(savedPicks)
            if (Array.isArray(parsedPicks) && parsedPicks.length > 0) {
              setMyPicks(parsedPicks)
            }
          }
        } catch {}

        let dynamicAffiliates: AffiliateProductItem[] = []

        // HQ Direct Products
        const storedHq = localStorage.getItem('mocco_hq_direct_products')
        if (storedHq) {
          const parsedHq = JSON.parse(storedHq)
          if (Array.isArray(parsedHq)) {
            const hqAffiliates: AffiliateProductItem[] = parsedHq
              .filter((p: any) => p.allowAffiliate && p.status === 'ACTIVE')
              .map((p: any) => ({
                id: p.id,
                name: p.name,
                description: p.description || p.subTitle || '',
                priceKrw: Number(p.priceKrw || p.salePriceKrw),
                salePriceKrw: Number(p.salePriceKrw),
                effectivePrice: Number(p.salePriceKrw),
                stock: Number(p.stock || 100),
                images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ['https://images.unsplash.com/photo-1544025162-d76694265947?w=800'],
                category: p.category || 'FOOD',
                shippingFee: Number(p.shippingFee || 0),
                ownerType: 'HEADQUARTERS',
                isHqDirect: true,
                commissionRate: Number(p.affiliateCommissionRate || 10.0),
                estimatedCommissionKrw: Math.floor((Number(p.salePriceKrw) * Number(p.affiliateCommissionRate || 10.0)) / 100),
                merchantName: '모꼬(MOCCO) 본사 직영관',
              }))
            dynamicAffiliates = [...dynamicAffiliates, ...hqAffiliates]
          }
        }

        // Merchant Custom Products
        const storedMerchant = localStorage.getItem('mocco_custom_products')
        if (storedMerchant) {
          try {
            const parsedMerchant = JSON.parse(storedMerchant)
            if (Array.isArray(parsedMerchant)) {
              const merchantAffiliates: AffiliateProductItem[] = parsedMerchant
                .filter((p: any) => p.allowCreatorSales)
                .map((p: any) => {
                  const rate = Number(p.creatorCommissionRate || 10.0)
                  const effPrice = Number(p.price || 0)
                  return {
                    id: p.id,
                    name: p.name,
                    description: p.description || '',
                    priceKrw: Number(p.originalPrice || p.price),
                    salePriceKrw: effPrice,
                    effectivePrice: effPrice,
                    stock: Number(p.stock || 50),
                    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ['https://images.unsplash.com/photo-1544025162-d76694265947?w=800'],
                    category: p.category || 'FOOD',
                    shippingFee: Number(p.shippingFee || 0),
                    ownerType: 'MERCHANT',
                    isHqDirect: false,
                    commissionRate: rate,
                    estimatedCommissionKrw: Math.floor((effPrice * rate) / 100),
                    merchantName: p.merchantInfo?.businessName || '공식 제휴 입점사',
                  }
                })
              dynamicAffiliates = [...dynamicAffiliates, ...merchantAffiliates]
            }
          } catch {}
        }

        if (dynamicAffiliates.length > 0) {
          setAvailableProducts((prev) => {
            const newIds = new Set(dynamicAffiliates.map((item) => item.id))
            const remaining = prev.filter((item) => !newIds.has(item.id))
            return [...dynamicAffiliates, ...remaining]
          })
        }
      }
    } catch {}
    setIsLoading(false)
  }

  useEffect(() => {
    fetchAffiliateData()
  }, [])

  // Handle Pick Product
  const handlePickProduct = async (product: AffiliateProductItem) => {
    try {
      await fetch('/api/affiliate/products/pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, commissionRate: product.commissionRate }),
      }).catch(() => {})

      if (!myPicks.some((p) => p.id === product.id)) {
        const next = [product, ...myPicks]
        setMyPicks(next)
        if (typeof window !== 'undefined') {
          localStorage.setItem('mocco_streamer_my_picks', JSON.stringify(next))
        }
      }
      toast({
        title: '🎉 제휴 상품 바구니 담기 완료',
        description: `'${product.name}' 상품이 내 방송 판매 목록에 등록되었습니다. 모꼬 LIVE 방송 시 핀 목록에 우선 노출됩니다.`,
      })
    } catch {
      toast({
        title: '오류 발생',
        description: '상품을 담는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  // Handle Unpick Product
  const handleUnpickProduct = async (productId: string) => {
    try {
      await fetch(`/api/affiliate/my-products/${productId}`, {
        method: 'DELETE',
      }).catch(() => {})

      const next = myPicks.filter((p) => p.id !== productId)
      setMyPicks(next)
      if (typeof window !== 'undefined') {
        localStorage.setItem('mocco_streamer_my_picks', JSON.stringify(next))
      }
      toast({
        title: '상품 제거 완료',
        description: '내 방송 판매 바구니에서 상품이 제거되었습니다.',
      })
    } catch {}
  }


  // Handle Export Creator Revenue CSV
  const handleExportCreatorRevenueCSV = () => {
    if (!commissionHistory || commissionHistory.length === 0) {
      toast({
        title: '다운로드할 내역 없음',
        description: '정산 내역 데이터가 없습니다.',
        variant: 'destructive',
      })
      return
    }

    const headers = [
      '방송일시',
      '라이브방송제목',
      '주문번호',
      '판매상품명',
      '수량',
      '총판매액(원)',
      '커미션율(%)',
      '실수령수익금(원)',
      '정산상태',
    ]

    const rows = commissionHistory.map((h) => [
      `"${h.date}"`,
      `"${h.liveTitle.replace(/"/g, '""')}"`,
      `"${h.orderNumber}"`,
      `"${h.productName.replace(/"/g, '""')}"`,
      h.quantity,
      h.saleTotalKrw,
      `"${h.commissionRate}%"`,
      h.commissionKrw,
      `"${h.statusText}"`,
    ].join(','))

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `MOCCO_Creator_Revenue_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: '크리에이터 정산 내역서 CSV 다운로드 완료',
      description: '회계 증빙용 커머스 판매 커미션 정산 내역서가 다운로드되었습니다.',
    })
  }

  // Handle Request Withdrawal
  const handleRequestWithdrawal = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(withdrawAmount)
    if (!amount || amount < 10000) {
      toast({
        title: '출금 금액 오류',
        description: '최소 출금 가능 금액은 10,000원입니다.',
        variant: 'destructive',
      })
      return
    }
    if (amount > settledCommission) {
      toast({
        title: '출금 가능 잔액 초과',
        description: `현재 출금 가능 정산 잔액은 ₩${settledCommission.toLocaleString()}입니다.`,
        variant: 'destructive',
      })
      return
    }

    const taxAmount = Math.floor(amount * 0.033) // 3.3% 사업소득세 원천징수
    const netPayout = amount - taxAmount

    setSettledCommission((prev) => prev - amount)
    setIsWithdrawModalOpen(false)
    toast({
      title: '🎉 출금 신청이 성공적으로 접수되었습니다!',
      description: `원천세(3.3%) ₩${taxAmount.toLocaleString()} 공제 후 실수령액 ₩${netPayout.toLocaleString()}이 ${creatorBank.bankName} 계좌로 익일 송금됩니다.`,
    })
  }

  // Handle Save Bank Info
  const handleSaveBankInfo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bankForm.bankName.trim() || !bankForm.accountNumber.trim() || !bankForm.accountHolder.trim()) {
      toast({
        title: '계좌 정보 누락',
        description: '모든 항목을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }
    setCreatorBank(bankForm)
    if (typeof window !== 'undefined') {
      localStorage.setItem('mocco_creator_bank', JSON.stringify(bankForm))
    }
    setIsBankModalOpen(false)
    toast({
      title: '정산 입금 계좌 저장 완료',
      description: `${bankForm.bankName} ${bankForm.accountNumber} 계좌로 정산금이 송금됩니다.`,
    })
  }

    const filteredExplore = availableProducts.filter((p) => {
    const matchOwner = ownerFilter === 'ALL' || p.ownerType === ownerFilter
    const matchSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchOwner && matchSearch
  })

  // Estimated stats
  const totalCommissionPotential = myPicks.reduce((acc, cur) => acc + cur.estimatedCommissionKrw, 0)

  const isAuthorized = role === 'CREATOR' || role === 'ADMIN'
  const channelName = user?.creatorInfo?.channelName || user?.nickname || '크리에이터'
  const categoryDesc = user?.creatorInfo?.category || '모꼬 LIVE 소통 & 라이브 커머스'

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {!isAuthorized && (
        <div className="border-b border-amber-300 bg-amber-50 px-6 py-3 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">🎙️</span>
            <div>
              <p className="text-xs font-bold">크리에이터(Streamer) 전용 스튜디오입니다.</p>
              <p className="text-[11px] text-amber-700">현재 일반 회원 권한입니다. 크리에이터 신청을 완료하면 즉시 방송 및 제휴 판매 권한이 활성화됩니다.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={openCreatorModal}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold h-8"
            >
              🎙️ 지금 크리에이터 신청하기
            </Button>
            <Button asChild variant="outline" size="sm" className="text-xs h-8 bg-white">
              <Link href="/">홈으로 가기</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur px-6 py-4">
        <div className="container max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-purple-600 via-rose-500 to-indigo-600 bg-clip-text text-transparent">
                  {channelName}
                </h1>
                <Badge className="bg-purple-500/15 text-purple-700 border-purple-500/30 text-xs font-bold">
                  공식 크리에이터 스튜디오
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {categoryDesc} | 실시간 라이브 송출 & 제휴 커머스 핀 연동
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              className="border-primary/40 text-primary hover:bg-primary/10 gap-1.5 text-xs font-semibold"
              asChild
            >
              <Link href="/">
                <ShoppingBag className="w-4 h-4" />
                🛒 고객 웹 스토어
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-semibold border-emerald-300 text-emerald-700 bg-emerald-50"
              asChild
            >
              <Link href="/seller">
                <Truck className="w-4 h-4 text-emerald-600" />
                🏪 입점사 셀러 센터
              </Link>
            </Button>
            {role === 'ADMIN' && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs font-semibold border-amber-300 text-amber-700 bg-amber-50"
                asChild
              >
                <Link href="/dashboard">
                  👑 본사 총괄 관리자
                </Link>
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 text-xs font-semibold shadow-md"
              asChild
            >
              <Link href="/web/live/live-101">
                <Radio className="w-4 h-4" />
                🔴 모꼬 LIVE 방송 시작 & 핀 연결
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="container max-w-7xl mx-auto px-4 py-8 flex-1 space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-border/80 shadow-sm bg-card/60">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs flex items-center justify-between">
                <span>이번 달 제휴 커미션 정산 완료액</span>
                <Coins className="w-4 h-4 text-amber-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-black text-rose-500">
                ₩{settledCommission.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground">
                구매 확정 완료된 제휴 판매 주문 {completedOrdersCount}건 기준 실시간 정산
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/80 shadow-sm bg-card/60">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs flex items-center justify-between">
                <span>내 방송 판매 바구니 상품</span>
                <Package className="w-4 h-4 text-indigo-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-black">
                {myPicks.length}개 상품
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground">
                방송 중 1-클릭으로 시청자 화면에 핀 고정 가능
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/80 shadow-sm bg-card/60">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs flex items-center justify-between">
                <span>평균 스트리머 커미션율</span>
                <Percent className="w-4 h-4 text-emerald-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-black text-emerald-500">
                10.0% ~ 15.0%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground">
                본사 직영 10% / 입점사 10~15% 보장
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/80 shadow-sm bg-card/60">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs flex items-center justify-between">
                <span>바구니 건당 기대 수익 합계</span>
                <TrendingUp className="w-4 h-4 text-rose-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-black text-indigo-500">
                ₩{totalCommissionPotential.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground">
                담아둔 상품 각 1건씩 판매 시 예상 수익
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Operating Philosophy Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-rose-950/60 via-indigo-950/40 to-slate-900 border border-border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                모꼬 4대 참여자 커머스 모델
              </Badge>
              <span className="text-xs text-muted-foreground">
                본사 직영 · 입점사 판매 · 개인 중고 · <strong>계약 스트리머 제휴 위탁</strong>
              </span>
            </div>
            <h3 className="text-base font-bold">
              재고 부담 0원! 상품을 골라 방송 화면에 핀으로 걸고, 주문마다 10~15% 수익 쉐어를 받으세요.
            </h3>
            <p className="text-xs text-muted-foreground">
              결제부터 택배 발송, 반품, 고객 CS는 본사 및 인증 입점사가 100% 전담합니다.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setActiveTab('EXPLORE')}
            className="shrink-0 bg-primary hover:bg-primary/90 text-xs font-semibold gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            제휴 가능 상품 둘러보기
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('MY_PICKS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'MY_PICKS'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Package className="w-4 h-4" />
              내 방송 판매 바구니 ({myPicks.length})
            </button>
            <button
              onClick={() => setActiveTab('EXPLORE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'EXPLORE'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Search className="w-4 h-4" />
              제휴 가능 상품 탐색 ({availableProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('REVENUE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'REVENUE'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Coins className="w-4 h-4 text-amber-500" />
              💰 커머스 정산 & 계좌 관리
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAffiliateData}
            disabled={isLoading}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>

        {/* Tab 1: My Picks Basket */}
        {activeTab === 'MY_PICKS' && (
          <div className="space-y-4">
            {myPicks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
                <Package className="w-12 h-12 text-muted-foreground mx-auto" />
                <h3 className="text-base font-semibold">아직 담아둔 방송 판매 상품이 없습니다.</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  [제휴 가능 상품 탐색] 탭에서 마음에 드는 상품을 골라 내 방송 바구니에 담아보세요.
                </p>
                <Button
                  size="sm"
                  onClick={() => setActiveTab('EXPLORE')}
                  className="rounded-full text-xs font-semibold"
                >
                  상품 둘러보러 가기 &rarr;
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myPicks.map((item) => (
                  <Card key={item.id} className="overflow-hidden border border-border shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="relative aspect-video w-full bg-muted overflow-hidden">
                        <img
                          src={item.images?.[0] || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          {item.isHqDirect ? (
                            <Badge className="bg-indigo-600 text-white font-bold text-[10px]">
                              👑 본사 직영
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                              🏪 입점사 상품
                            </Badge>
                          )}
                          <Badge className="bg-rose-500 text-white font-bold text-[10px]">
                            {item.commissionRate}% 커미션
                          </Badge>
                        </div>
                      </div>

                      <CardHeader className="p-4 pb-2">
                        <div className="text-[11px] font-semibold text-muted-foreground">
                          {item.merchantName}
                        </div>
                        <CardTitle className="text-sm font-bold line-clamp-2 leading-snug">
                          {item.name}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="px-4 pb-3 space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-lg font-black">
                            ₩{item.effectivePrice.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            재고 {item.stock}개
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-between text-xs font-bold">
                          <span>내 판매 1건당 커미션 수익</span>
                          <span>+₩{item.estimatedCommissionKrw.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </div>

                    <div className="p-4 pt-0 border-t border-border/50 mt-2 flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold gap-1.5"
                        asChild
                      >
                        <Link href="/web/live/live-101">
                          <Radio className="w-3.5 h-3.5" />
                          방송에 핀(Pin) 고정
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnpickProduct(item.id)}
                        className="text-muted-foreground hover:text-destructive text-xs h-9 px-2.5"
                        title="바구니에서 제거"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Explore Available Affiliate Products */}
        {activeTab === 'EXPLORE' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {[
                  { key: 'ALL', label: '전체 상품' },
                  { key: 'HEADQUARTERS', label: '👑 본사 직영 상품' },
                  { key: 'MERCHANT', label: '🏪 공식 입점사 상품' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setOwnerFilter(f.key as any)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      ownerFilter === f.key
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-card text-muted-foreground hover:bg-muted border border-border'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="상품명, 입점사명 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredExplore.map((product) => {
                const isAlreadyPicked = myPicks.some((p) => p.id === product.id)

                return (
                  <Card key={product.id} className="overflow-hidden border border-border shadow-sm flex flex-col justify-between hover:border-primary/50 transition-colors">
                    <div>
                      <div className="relative aspect-video w-full bg-muted overflow-hidden">
                        <img
                          src={product.images?.[0] || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          {product.isHqDirect ? (
                            <Badge className="bg-indigo-600 text-white font-bold text-[10px]">
                              👑 본사직영
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                              🏪 입점사
                            </Badge>
                          )}
                          <Badge className="bg-rose-500 text-white font-bold text-[10px]">
                            {product.commissionRate}%
                          </Badge>
                        </div>
                      </div>

                      <CardHeader className="p-3.5 pb-1">
                        <div className="text-[11px] text-muted-foreground font-semibold truncate">
                          {product.merchantName}
                        </div>
                        <CardTitle className="text-xs font-bold line-clamp-2 leading-snug">
                          {product.name}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="px-3.5 pb-2 space-y-1.5">
                        <div className="flex items-baseline justify-between">
                          <span className="text-base font-extrabold">
                            ₩{product.effectivePrice.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            재고 {product.stock}개
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/60 text-xs font-semibold flex items-center justify-between text-muted-foreground">
                          <span className="text-[11px]">판매 수수료</span>
                          <span className="text-rose-500 font-bold">
                            +₩{product.estimatedCommissionKrw.toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </div>

                    <div className="p-3.5 pt-0 border-t border-border/40 mt-1">
                      {isAlreadyPicked ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled
                          className="w-full text-xs font-semibold gap-1 text-emerald-600 bg-emerald-500/10"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          바구니에 담김
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handlePickProduct(product)}
                          className="w-full text-xs font-semibold gap-1 bg-primary hover:bg-primary/90"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          내 방송 상품으로 담기
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      
        {/* Tab 3: Revenue & Settlement Management */}
        {activeTab === 'REVENUE' && (
          <div className="space-y-6">
            {/* Bank Card & Metrics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Creator Bank Info Card */}
              <Card className="border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-primary" />
                    정산 대금 입금 계좌
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBankForm(creatorBank)
                      setIsBankModalOpen(true)
                    }}
                    className="text-xs h-7 px-2 font-bold text-primary hover:text-primary gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    계좌 변경
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xl font-bold font-mono text-foreground">
                      {creatorBank.bankName}
                    </div>
                    <div className="text-sm font-mono text-foreground tracking-wide mt-1">
                      {creatorBank.accountNumber}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      예금주: {creatorBank.accountHolder}
                    </div>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl border border-border text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>
                      매주 화요일 정산 확정된 커머스 커미션이 등록된 본인 계좌로 자동 지급됩니다.
                    </span>
                  </div>
                  <Button
                    onClick={() => {
                      setWithdrawAmount(String(settledCommission))
                      setIsWithdrawModalOpen(true)
                    }}
                    className="w-full bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs h-9 shadow-xs gap-1.5"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    수익금 즉시 출금 신청
                  </Button>
                </CardContent>
              </Card>

              {/* Metric Cards (2 Col) */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border border-border/80 shadow-sm flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold">
                      출금 가능 확정 정산액
                    </CardDescription>
                    <CardTitle className="text-3xl font-black text-rose-500 font-mono">
                      ₩{settledCommission.toLocaleString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      구매확정 완료 건 기준 (언제든 1만원 이상 즉시 출금 가능)
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-border/80 shadow-sm flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold">
                      정산 대기 예정 커미션
                    </CardDescription>
                    <CardTitle className="text-3xl font-black text-indigo-500 font-mono">
                      ₩55,350
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      현재 배송 중 또는 구매확정 대기 중인 주문 커미션
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Commission Ledger Table Card */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    라이브 커머스 판매 & 커미션 정산 장부
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    내 방송 핀 상품을 통해 발생한 실시간 주문 및 건당 커미션 적립 내역입니다.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCreatorRevenueCSV}
                  className="gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  정산서 다운로드 (CSV/Excel)
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 uppercase tracking-wider text-muted-foreground border-b border-border">
                      <tr>
                        <th className="py-3 px-4 font-semibold">주문번호 / 일시</th>
                        <th className="py-3 px-4 font-semibold">방송 정보</th>
                        <th className="py-3 px-4 font-semibold">판매 상품</th>
                        <th className="py-3 px-4 text-center font-semibold">수량</th>
                        <th className="py-3 px-4 text-right font-semibold">결제액</th>
                        <th className="py-3 px-4 text-right font-semibold">요율</th>
                        <th className="py-3 px-4 text-right font-semibold">수익금</th>
                        <th className="py-3 px-4 text-center font-semibold">정산 상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {commissionHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/20">
                          <td className="py-3 px-4 font-mono">
                            <span className="font-bold text-foreground block">{item.orderNumber}</span>
                            <span className="text-[10px] text-muted-foreground">{item.date}</span>
                          </td>
                          <td className="py-3 px-4 max-w-[200px] truncate font-medium">
                            {item.liveTitle}
                          </td>
                          <td className="py-3 px-4 max-w-[220px] truncate font-semibold text-foreground">
                            {item.productName}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold">
                            {item.quantity}개
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                            ₩{item.saleTotalKrw.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600">
                            {item.commissionRate}%
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-rose-500 text-sm">
                            +₩{item.commissionKrw.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.status === 'SETTLED' ? (
                              <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]">
                                정산완료
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px]">
                                구매확정 대기
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal 1: Bank Account Edit */}
        {isBankModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <form
              onSubmit={handleSaveBankInfo}
              className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-extrabold">크리에이터 정산 계좌 변경</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">입금 은행</label>
                  <Input
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                    placeholder="예: 카카오뱅크, 신한은행, 토스뱅크"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">계좌번호 (하이픈 포함)</label>
                  <Input
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    placeholder="예: 3333-01-9988221"
                    className="text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">예금주명 (실명 일치 필수)</label>
                  <Input
                    value={bankForm.accountHolder}
                    onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                    placeholder="예: 정크리에이터"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  소득세 원천징수 신고를 위해 예금주 실명과 가입자 명의가 일치해야 정산금이 정상 입금됩니다.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBankModalOpen(false)}
                  className="text-xs"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  계좌 정보 저장
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Modal 2: Withdrawal Request */}
        {isWithdrawModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <form
              onSubmit={handleRequestWithdrawal}
              className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-rose-600" />
                  <h3 className="text-base font-extrabold">수익금 출금 신청</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">출금 가능 잔액</span>
                  <span className="font-bold text-slate-900 font-mono">₩{settledCommission.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">입금 예정 계좌</span>
                  <span className="font-semibold text-indigo-600 font-mono">{creatorBank.bankName} {creatorBank.accountNumber}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="block font-bold text-slate-700">출금 희망 금액 (최소 10,000원)</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="text-xs font-mono font-bold pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">원</span>
                </div>
              </div>

              {/* Tax Deduction Breakdown */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[11px] space-y-1 font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>출금 신청액</span>
                  <span>₩{(Number(withdrawAmount) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>원천세 3.3% (소득세 3% + 지방소득세 0.3%)</span>
                  <span>-₩{Math.floor((Number(withdrawAmount) || 0) * 0.033).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 text-xs pt-1 border-t border-slate-200">
                  <span>실제 입금 예정액</span>
                  <span className="text-emerald-600 font-extrabold">
                    ₩{Math.max(0, (Number(withdrawAmount) || 0) - Math.floor((Number(withdrawAmount) || 0) * 0.033)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="text-xs"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
                >
                  출금 신청하기
                </Button>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  )
}
