'use client'

import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Store,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Download,
  Eye,
  EyeOff,
  ShoppingBag,
  Users2,
  Tag,
  Truck,
  Layers,
  Scale,
  X,
  Crown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/lib/api'

interface MockEscrowOrder {
  id: string
  orderNumber: string
  productTitle: string
  productType: 'C2C_USED' | 'B2C_GROUP' | 'B2C_NORMAL'
  buyerName: string
  sellerName: string
  amount: number
  platformFee: number
  sellerPayout: number
  status: 'ESCROW_HOLD' | 'SHIPPED' | 'CONFIRMED' | 'DISPUTED' | 'REFUNDED'
  createdAt: string
  disputeReason?: string
  makerCheckerPending?: boolean
  makerCheckerApproved?: boolean
}

interface C2CProductItem {
  id: string
  title: string
  sellerName: string
  price: number
  category: string
  locationName: string
  status: 'ACTIVE' | 'RESERVED' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  imageUrl?: string
}

interface NormalProductItem {
  id: string
  merchantId: string
  merchantName: string
  name: string
  priceKrw: number
  salePriceKrw?: number
  stock: number
  shippingFee: number
  category: string
  status: 'ACTIVE' | 'HIDDEN' | 'OUT_OF_STOCK'
  createdAt: string
  isHqDirect?: boolean
  ownerType?: 'HEADQUARTERS' | 'MERCHANT' | 'USER_C2C'
  allowAffiliate?: boolean
  affiliateCommissionRate?: number
}

interface GroupBuyProductItem {
  id: string
  title: string
  merchantName: string
  price: number
  originalPrice: number
  targetQuantity: number
  currentQuantity: number
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
}

const INITIAL_ORDERS: MockEscrowOrder[] = [
  {
    id: 'ord-1',
    orderNumber: 'ORD-202610-8812',
    productTitle: '아이폰 15 프로 256GB 내추럴 티타늄',
    productType: 'C2C_USED',
    buyerName: '민우',
    sellerName: '테크러버',
    amount: 980000,
    platformFee: 49000,
    sellerPayout: 931000,
    status: 'ESCROW_HOLD',
    createdAt: '2026-10-22 09:15',
  },
  {
    id: 'ord-2',
    orderNumber: 'ORD-202610-4421',
    productTitle: '[입점사특가] 제주 산지직송 프리미엄 흑돼지 1kg',
    productType: 'B2C_GROUP',
    buyerName: '지수',
    sellerName: '제주푸드 본사 직영',
    amount: 24900,
    platformFee: 1245,
    sellerPayout: 23655,
    status: 'SHIPPED',
    createdAt: '2026-10-21 16:40',
  },
  {
    id: 'ord-3',
    orderNumber: 'ORD-202610-1092',
    productTitle: '미개봉 소니 WH-1000XM5 노이즈캔슬링 헤드폰',
    productType: 'C2C_USED',
    buyerName: '도현',
    sellerName: '오디오매니아',
    amount: 320000,
    platformFee: 16000,
    sellerPayout: 304000,
    status: 'CONFIRMED',
    createdAt: '2026-10-20 11:20',
  },
  {
    id: 'ord-4',
    orderNumber: 'ORD-202610-9943',
    productTitle: '플레이스테이션 5 디스크 에디션 + 듀얼센스',
    productType: 'C2C_USED',
    buyerName: '준호',
    sellerName: '겜돌이',
    amount: 1250000,
    platformFee: 62500,
    sellerPayout: 1187500,
    status: 'DISPUTED',
    disputeReason: '물품 설명과 달리 본체 하단에 깊은 스크래치 다수 존재',
    createdAt: '2026-10-19 14:05',
  },
  {
    id: 'ord-5',
    orderNumber: 'ORD-202610-7731',
    productTitle: '고순도 프리미엄 알티지 오메가3 120캡슐 (4개월분)',
    productType: 'B2C_NORMAL',
    buyerName: '서연',
    sellerName: '메디컬 헬스케어랩',
    amount: 42000,
    platformFee: 2100,
    sellerPayout: 39900,
    status: 'DISPUTED',
    disputeReason: '배송 중 박스 파손 및 밀봉 씰 훼손으로 교환/환불 요청',
    createdAt: '2026-10-21 15:30',
  },

]

const INITIAL_C2C_PRODUCTS: C2CProductItem[] = [
  {
    id: 'c2c-1',
    title: '아이폰 15 프로 256GB 내추럴 티타늄 풀박스',
    sellerName: '테크러버 (usr_4821)',
    price: 980000,
    category: 'DIGITAL',
    locationName: '역삼역 3번출구',
    status: 'ACTIVE',
    createdAt: '2026-10-22 08:30',
  },
  {
    id: 'c2c-2',
    title: '미개봉 소니 WH-1000XM5 노이즈캔슬링 헤드폰 (블랙)',
    sellerName: '오디오매니아 (usr_1932)',
    price: 320000,
    category: 'DIGITAL',
    locationName: '잠실새내역 직거래',
    status: 'ACTIVE',
    createdAt: '2026-10-21 14:10',
  },
  {
    id: 'c2c-3',
    title: '맥북 에어 M2 16GB / 512GB 스페이스그레이 배터리 99%',
    sellerName: '코딩꿈나무 (usr_5501)',
    price: 1150000,
    category: 'DIGITAL',
    locationName: '판교역 1번출구',
    status: 'RESERVED',
    createdAt: '2026-10-20 18:25',
  },
  {
    id: 'c2c-4',
    title: '캠핑용 파세코 난로 PKH-3100G (가방/상판망 포함)',
    sellerName: '캠퍼정 (usr_8274)',
    price: 140000,
    category: 'LIVING',
    locationName: '남양주 다산동',
    status: 'ACTIVE',
    createdAt: '2026-10-19 10:05',
  },
]

const INITIAL_NORMAL_PRODUCTS: NormalProductItem[] = [
  {
    id: 'np-hq-001',
    merchantId: 'mer-hq',
    merchantName: '모꼬(MOCCO) 본사 공식 직영관',
    name: '[본사직영] 프리미엄 나주 특등급 햇배 5kg 선물세트 (산지직송)',
    priceKrw: 39000,
    salePriceKrw: 32900,
    stock: 200,
    shippingFee: 0,
    category: 'FOOD',
    status: 'ACTIVE',
    createdAt: '2026-10-22 10:00',
    isHqDirect: true,
    ownerType: 'HEADQUARTERS',
    allowAffiliate: true,
    affiliateCommissionRate: 10.0,
  },
  {
    id: 'np-001',
    merchantId: 'mer-001',
    merchantName: '제주푸드 본사 직영',
    name: '[입점사상시] 제주 산지직송 프리미엄 1등급 흑돼지 오겹살 1kg',
    priceKrw: 38000,
    salePriceKrw: 32900,
    stock: 150,
    shippingFee: 3000,
    category: 'FOOD',
    status: 'ACTIVE',
    createdAt: '2026-10-21 15:00',
    isHqDirect: false,
    ownerType: 'MERCHANT',
    allowAffiliate: true,
    affiliateCommissionRate: 12.0,
  },
  {
    id: 'np-002',
    merchantId: 'mer-001',
    merchantName: '제주푸드 본사 직영',
    name: '[입점사상시] 제주 유기농 감귤 착즙 원액주스 1000ml (3병 세트)',
    priceKrw: 29000,
    salePriceKrw: 24900,
    stock: 80,
    shippingFee: 0,
    category: 'FOOD',
    status: 'ACTIVE',
    createdAt: '2026-10-20 12:30',
  },
  {
    id: 'np-003',
    merchantId: 'mer-002',
    merchantName: '메디컬 헬스케어랩',
    name: '[공식인증] 고순도 프리미엄 알티지 오메가3 120캡슐 (4개월분)',
    priceKrw: 55000,
    salePriceKrw: 42000,
    stock: 200,
    shippingFee: 2500,
    category: 'LIVING',
    status: 'ACTIVE',
    createdAt: '2026-10-19 16:20',
  },
  {
    id: 'np-004',
    merchantId: 'mer-003',
    merchantName: '어반 라이프 스타일',
    name: '[입점사상시] 무소음 초음파 감성 아로마 무드등 가습기 500ml',
    priceKrw: 42000,
    salePriceKrw: 35000,
    stock: 60,
    shippingFee: 3000,
    category: 'LIVING',
    status: 'ACTIVE',
    createdAt: '2026-10-18 11:45',
  },
]

const INITIAL_GROUP_PRODUCTS: GroupBuyProductItem[] = [
  {
    id: 'gp-001',
    title: '[공동구매 특가] 산지직송 나주 배 5kg 특등급 (목표 20박스)',
    merchantName: '전남 파머스 마켓',
    price: 19900,
    originalPrice: 35000,
    targetQuantity: 20,
    currentQuantity: 17,
    status: 'ACTIVE',
    createdAt: '2026-10-22 10:00',
  },
  {
    id: 'gp-002',
    title: '[인스트림 라이브 공구] 호텔식 40수 순면 수건 10장 세트',
    merchantName: '홈앤리빙 직영점',
    price: 24000,
    originalPrice: 42000,
    targetQuantity: 50,
    currentQuantity: 50,
    status: 'COMPLETED',
    createdAt: '2026-10-21 20:00',
  },
]

export default function MarketEscrowAdminPage() {
  const { toast } = useToast()
  const [activeMainTab, setActiveMainTab] = useState<'c2c' | 'b2c_normal' | 'b2c_group' | 'escrow'>('c2c')

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Data states
  const [c2cProducts, setC2cProducts] = useState<C2CProductItem[]>(INITIAL_C2C_PRODUCTS)
  const [normalProducts, setNormalProducts] = useState<NormalProductItem[]>(INITIAL_NORMAL_PRODUCTS)
  const [groupProducts, setGroupProducts] = useState<GroupBuyProductItem[]>(INITIAL_GROUP_PRODUCTS)
  const [orders, setOrders] = useState<MockEscrowOrder[]>(INITIAL_ORDERS)

  // Dispute Arbitration Modal State
  const [arbitrationModalOrder, setArbitrationModalOrder] = useState<MockEscrowOrder | null>(null)
  const [arbitrationDecision, setArbitrationDecision] = useState<'REFUND' | 'FORCE_SETTLE'>('REFUND')
  const [arbitrationReason, setArbitrationReason] = useState('')
  const [secondApproverConfirmed, setSecondApproverConfirmed] = useState(false)
  const [submittingArbitration, setSubmittingArbitration] = useState(false)

  const handleOpenArbitration = (order: MockEscrowOrder) => {
    setArbitrationModalOrder(order)
    setArbitrationDecision('REFUND')
    setArbitrationReason('')
    setSecondApproverConfirmed(order.makerCheckerPending ? true : false)
  }

  const handleExecuteArbitration = async () => {
    if (!arbitrationModalOrder || !arbitrationReason.trim()) {
      toast({
        title: '중재 사유 입력 필요',
        description: '판정 근거 및 중재 사유를 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    const isHighAmount = arbitrationModalOrder.amount >= 1000000
    if (isHighAmount && !secondApproverConfirmed) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === arbitrationModalOrder.id
            ? { ...o, makerCheckerPending: true }
            : o
        )
      )
      toast({
        title: '⚖️ Maker-Checker 2인 결재 상신',
        description: '100만 원 이상 고액 분쟁 판정으로 2차 운영책임자 승인 요청이 상신되었습니다.',
      })
      setArbitrationModalOrder(null)
      return
    }

    setSubmittingArbitration(true)
    try {
      await api.post('/api/payments/escrow/arbitrate', {
        orderId: arbitrationModalOrder.orderNumber,
        decision: arbitrationDecision,
        reason: arbitrationReason.trim(),
        forceApproveHighAmount: secondApproverConfirmed,
      })
    } catch {}

    const nextStatus = arbitrationDecision === 'REFUND' ? 'REFUNDED' : 'CONFIRMED'
    setOrders((prev) =>
      prev.map((o) =>
        o.id === arbitrationModalOrder.id
          ? {
              ...o,
              status: nextStatus,
              makerCheckerPending: false,
              makerCheckerApproved: isHighAmount,
              disputeReason: `[중재 판정: ${arbitrationDecision === 'REFUND' ? '구매자 전액 환불' : '판매자 강제 정산'}] ${arbitrationReason.trim()}`,
            }
          : o
      )
    )

    toast({
      title: arbitrationDecision === 'REFUND' ? '구매자 전액 환불 판정 집행' : '판매자 강제 정산 판정 집행',
      description: arbitrationDecision === 'REFUND'
        ? 'PG 결제가 취소되고 구매자에게 전액 환불되었습니다.'
        : '물품 이상 없음 판정으로 즉시 구매확정 및 판매자 정산 대기열에 등록되었습니다.',
    })

    setSubmittingArbitration(false)
    setArbitrationModalOrder(null)
  }

  // HQ Direct Product Modal State
  const [isHqModalOpen, setIsHqModalOpen] = useState(false)
  const [hqForm, setHqForm] = useState({
    name: '',
    priceKrw: 39000,
    salePriceKrw: 32900,
    stock: 100,
    shippingFee: 0,
    category: 'FOOD',
    isHqDirect: true,
    ownerType: 'HEADQUARTERS' as const,
    allowAffiliate: true,
    affiliateCommissionRate: 10.0,
  })

  const handleRegisterHqProduct = async () => {
    if (!hqForm.name.trim()) {
      toast({
        title: '상품명 입력 필요',
        description: '본사 공식 직영 상품명을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    try {
      const payload = {
        name: hqForm.name.trim(),
        priceKrw: Number(hqForm.priceKrw),
        salePriceKrw: Number(hqForm.salePriceKrw || hqForm.priceKrw),
        stock: Number(hqForm.stock),
        shippingFee: Number(hqForm.shippingFee),
        category: hqForm.category,
        isHqDirect: hqForm.isHqDirect,
        ownerType: hqForm.ownerType,
        allowAffiliate: hqForm.allowAffiliate,
        affiliateCommissionRate: Number(hqForm.affiliateCommissionRate),
        status: 'ACTIVE',
      }

      await api.post('/market/admin/normal-products', payload).catch(() => null)

      const newProduct: NormalProductItem = {
        id: `np-hq-${Date.now().toString().slice(-6)}`,
        merchantId: 'mer-hq',
        merchantName: '모꼬(MOCCO) 본사 공식 직영관',
        name: payload.name,
        priceKrw: payload.priceKrw,
        salePriceKrw: payload.salePriceKrw,
        stock: payload.stock,
        shippingFee: payload.shippingFee,
        category: payload.category,
        status: 'ACTIVE',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        isHqDirect: payload.isHqDirect,
        ownerType: payload.ownerType,
        allowAffiliate: payload.allowAffiliate,
        affiliateCommissionRate: payload.affiliateCommissionRate,
      }

      setNormalProducts([newProduct, ...normalProducts])
      setIsHqModalOpen(false)
      setHqForm({
        name: '',
        priceKrw: 39000,
        salePriceKrw: 32900,
        stock: 100,
        shippingFee: 0,
        category: 'FOOD',
        isHqDirect: true,
        ownerType: 'HEADQUARTERS',
        allowAffiliate: true,
        affiliateCommissionRate: 10.0,
      })

      toast({
        title: '👑 본사 공식 직영 상품 등록 완료',
        description: `'${payload.name}' 상품이 골드 메탈릭 뱃지와 함께 마켓 및 스트리머 제휴 센터에 즉시 노출됩니다.`,
      })
    } catch {
      toast({
        title: '등록 실패',
        description: '상품 등록 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }


  // Load backend data if available
  const loadBackendData = async () => {
    try {
      const [npRes, c2cRes] = await Promise.all([
        api.get('/market/admin/normal-products').catch(() => null),
        api.get('/market/admin/products').catch(() => null),
      ])
      if (npRes?.data?.items && Array.isArray(npRes.data.items)) {
        setNormalProducts(npRes.data.items)
      }
      if (c2cRes?.data?.items && Array.isArray(c2cRes.data.items)) {
        const c2cList = c2cRes.data.items.filter((p: any) => p.type === 'C2C_USED')
        const groupList = c2cRes.data.items.filter((p: any) => p.type === 'B2C_GROUP')
        if (c2cList.length > 0) {
          setC2cProducts(
            c2cList.map((p: any) => ({
              id: p.id,
              title: p.title,
              sellerName: p.seller?.nickname || p.seller?.displayName || '판매자',
              price: p.price,
              category: p.category,
              locationName: p.locationName || '동네 인증',
              status: p.status,
              createdAt: p.createdAt?.slice(0, 16) || '',
            }))
          )
        }
        if (groupList.length > 0) {
          setGroupProducts(
            groupList.map((p: any) => ({
              id: p.id,
              title: p.title,
              merchantName: p.seller?.displayName || '공구 파트너',
              price: p.price,
              originalPrice: p.originalPrice || p.price * 1.3,
              targetQuantity: p.targetQuantity || 20,
              currentQuantity: p.currentQuantity || 10,
              status: p.status,
              createdAt: p.createdAt?.slice(0, 16) || '',
            }))
          )
        }
      }
    } catch {}
  }

  useEffect(() => {
    loadBackendData()
  }, [])

  // Actions for C2C Products
  const toggleC2cStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'CANCELLED' : 'ACTIVE'
    setC2cProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: nextStatus as any } : p))
    )
    try {
      await api.patch(`/market/admin/products/${id}/status`, { status: nextStatus })
    } catch {}
    toast({
      title: nextStatus === 'ACTIVE' ? '물품 승인 완료' : '물품 강제 숨김 처리',
      description: `상품 상태가 [${nextStatus === 'ACTIVE' ? '정상 노출' : '숨김(비노출)'}] 처리되었습니다.`,
    })
  }

  // Actions for Normal Products (B2C)
  const toggleNormalProductStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE'
    setNormalProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: nextStatus as any } : p))
    )
    try {
      await api.patch(`/market/admin/normal-products/${id}/status`, { status: nextStatus })
    } catch {}
    toast({
      title: nextStatus === 'ACTIVE' ? '일반 상품 승인 노출' : '일반 상품 판매 숨김',
      description: `입점사 상품 상태가 [${nextStatus === 'ACTIVE' ? '판매중(승인)' : '숨김'}] 처리되었습니다.`,
    })
  }

  // Actions for Escrow Orders
  const handleForceConfirm = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'CONFIRMED' } : o))
    )
    toast({
      title: '구매확정 처리 완료',
      description: '판매자 지갑으로 판매 대금이 에스크로 정산 입금되었습니다.',
    })
  }

  const handleRefundBuyer = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'REFUNDED' } : o))
    )
    toast({
      title: '구매자 전액 환불 완료',
      description: '에스크로 보관 포인트가 구매자 지갑으로 전액 환불되었습니다.',
    })
  }

  // Export CMS CSV
  const handleExportCmsCsv = () => {
    const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED')
    if (confirmedOrders.length === 0) {
      toast({
        title: '정산 대상 없음',
        description: '구매 확정 완료된 정산 대상 주문이 없습니다.',
        variant: 'destructive',
      })
      return
    }

    const headers = ['주문번호,판매자,상품명,원거래금액,수수료(3.5%),실송금지급액,은행명,가상계좌번호,정산상태']
    const rows = confirmedOrders.map((o) =>
      `"${o.orderNumber}","${o.sellerName}","${o.productTitle}",${o.amount},${o.platformFee},${o.sellerPayout},"카카오뱅크","3333-01-***","PAID"`
    )
    const csvContent = '\uFEFF' + [headers, ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `DAGAON_Settlement_CMS_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: '📊 정산 CMS 엑셀(CSV) 다운로드 완료',
      description: `${confirmedOrders.length}건의 판매자 정산 송금 내역이 다운로드되었습니다.`,
    })
  }

  // KPI Calculations
  const totalEscrowHold = orders
    .filter((o) => o.status === 'ESCROW_HOLD' || o.status === 'SHIPPED')
    .reduce((acc, cur) => acc + cur.amount, 0)
  const totalCompletedVolume = orders
    .filter((o) => o.status === 'CONFIRMED')
    .reduce((acc, cur) => acc + cur.amount, 0)
  const disputeCount = orders.filter((o) => o.status === 'DISPUTED').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            마켓 상품 통합 검수 & 에스크로 안전결제
          </h1>
          <p className="text-sm text-muted-foreground">
            C2C 개인 중고 물품, B2C 입점사 상시 일반 상품, 공동구매 상품 3대 영역을 통합 검수하고 에스크로 펀드를 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCmsCsv} className="gap-1.5">
            <Download className="w-4 h-4" /> 은행 이체 CMS 다운로드
          </Button>
          <Button variant="outline" size="sm" onClick={loadBackendData} className="gap-1.5">
            <RefreshCw className="w-4 h-4" /> 새로고침
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">C2C 중고 등록물품</p>
                <h3 className="text-2xl font-bold mt-1">{c2cProducts.length}건</h3>
              </div>
              <ShoppingBag className="w-8 h-8 text-primary/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-500">B2C 입점사 일반상품</p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-500">{normalProducts.length}건</h3>
              </div>
              <Store className="w-8 h-8 text-emerald-500/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-indigo-500">B2C 공동구매 상품</p>
                <h3 className="text-2xl font-bold mt-1 text-indigo-500">{groupProducts.length}건</h3>
              </div>
              <Users2 className="w-8 h-8 text-indigo-500/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-500">에스크로 보관잔액</p>
                <h3 className="text-2xl font-bold mt-1 text-amber-500 font-mono">
                  {totalEscrowHold.toLocaleString()} <span className="text-sm">ON</span>
                </h3>
              </div>
              <ShieldCheck className="w-8 h-8 text-amber-500/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main 4-Tab Navigation */}
      <Tabs value={activeMainTab} onValueChange={(v) => setActiveMainTab(v as any)} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-muted/60">
          <TabsTrigger value="c2c" className="gap-2">
            <ShoppingBag className="w-4 h-4" />
            1. C2C 중고 물품 ({c2cProducts.length})
          </TabsTrigger>
          <TabsTrigger value="b2c_normal" className="gap-2">
            <Store className="w-4 h-4" />
            2. B2C 일반 상품 ({normalProducts.length})
          </TabsTrigger>
          <TabsTrigger value="b2c_group" className="gap-2">
            <Users2 className="w-4 h-4" />
            3. B2C 공동구매 ({groupProducts.length})
          </TabsTrigger>
          <TabsTrigger value="escrow" className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            4. 에스크로 주문 & 분쟁 ({orders.length})
          </TabsTrigger>
        </TabsList>

        {/* ======================================================== */}
        {/* TAB 1: C2C 중고 물품 검수 */}
        {/* ======================================================== */}
        <TabsContent value="c2c" className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">C2C 개인 중고 거래 물품 검수</CardTitle>
              <CardDescription>
                회원이 등록한 중고 거래 물품의 불법/유해물 여부를 검수하고 노출 승인 및 숨김 처리를 통제합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/40 border-b border-border">
                    <tr>
                      <th className="px-5 py-3 font-semibold">물품명</th>
                      <th className="px-5 py-3 font-semibold">판매자</th>
                      <th className="px-5 py-3 font-semibold text-right">가격 (ON)</th>
                      <th className="px-5 py-3 font-semibold">희망 거래 지역</th>
                      <th className="px-5 py-3 font-semibold text-center">상태</th>
                      <th className="px-5 py-3 font-semibold text-right">검수 통제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {c2cProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/20">
                        <td className="px-5 py-3.5 font-medium">
                          {p.title}
                          <div className="text-xs text-muted-foreground mt-0.5">
                            카테고리: {p.category} | 등록: {p.createdAt}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">{p.sellerName}</td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-primary">
                          {p.price.toLocaleString()} ON
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">{p.locationName}</td>
                        <td className="px-5 py-3.5 text-center">
                          {p.status === 'ACTIVE' && (
                            <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
                              판매중 (승인)
                            </Badge>
                          )}
                          {p.status === 'RESERVED' && (
                            <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30">
                              예약중
                            </Badge>
                          )}
                          {p.status === 'CANCELLED' && (
                            <Badge className="bg-rose-500/15 text-rose-500 border-rose-500/30">
                              숨김 (비노출)
                            </Badge>
                          )}
                          {p.status === 'COMPLETED' && (
                            <Badge variant="outline">거래 완료</Badge>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            size="sm"
                            variant={p.status === 'ACTIVE' ? 'destructive' : 'outline'}
                            onClick={() => toggleC2cStatus(p.id, p.status)}
                            className="gap-1"
                          >
                            {p.status === 'ACTIVE' ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                숨김 처리
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                승인 노출
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 2: B2C 입점사 상시 일반 상품 검수 */}
        {/* ======================================================== */}
        <TabsContent value="b2c_normal" className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">B2C 입점사 & 본사 직영 일반 상품(NormalProduct) 검수</CardTitle>
                <CardDescription>
                  본사 공식 직영 상품 등록 및 입점사 상시 상품의 가격, 재고, 배송비, 제휴 위탁 설정과 노출 상태를 관리합니다.
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsHqModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 font-bold shadow-sm"
              >
                <Crown className="w-4 h-4 text-amber-200" />
                👑 본사 공식 직영 상품 등록
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/40 border-b border-border">
                    <tr>
                      <th className="px-5 py-3 font-semibold">입점사 / 상품명</th>
                      <th className="px-5 py-3 font-semibold text-right">정상가 (KRW)</th>
                      <th className="px-5 py-3 font-semibold text-right">판매가 (할인가)</th>
                      <th className="px-5 py-3 font-semibold text-center">재고 수량</th>
                      <th className="px-5 py-3 font-semibold text-center">기본 배송비</th>
                      <th className="px-5 py-3 font-semibold text-center">노출 상태</th>
                      <th className="px-5 py-3 font-semibold text-right">상태 통제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {normalProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/20">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {p.isHqDirect && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black shadow-sm">
                                👑 본사직영
                              </span>
                            )}
                            {p.allowAffiliate && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30">
                                🎙️ 제휴위탁 ({p.affiliateCommissionRate || 10}%)
                              </span>
                            )}
                            <div className="font-semibold text-foreground">{p.name}</div>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Store className="w-3.5 h-3.5 text-primary" />
                            {p.merchantName} | 카테고리: {p.category}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-muted-foreground line-through text-xs">
                          {p.priceKrw.toLocaleString()}원
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-primary">
                          {(p.salePriceKrw ?? p.priceKrw).toLocaleString()}원
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono font-semibold">
                          {p.stock > 0 ? (
                            <span>{p.stock}개</span>
                          ) : (
                            <Badge variant="destructive">품절</Badge>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center text-xs font-mono">
                          {p.shippingFee === 0 ? (
                            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                              무료배송
                            </Badge>
                          ) : (
                            `${p.shippingFee.toLocaleString()}원`
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {p.status === 'ACTIVE' && (
                            <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
                              판매중 (승인)
                            </Badge>
                          )}
                          {p.status === 'HIDDEN' && (
                            <Badge className="bg-rose-500/15 text-rose-500 border-rose-500/30">
                              숨김 (미노출)
                            </Badge>
                          )}
                          {p.status === 'OUT_OF_STOCK' && (
                            <Badge variant="outline">일시 품절</Badge>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            size="sm"
                            variant={p.status === 'ACTIVE' ? 'destructive' : 'default'}
                            onClick={() => toggleNormalProductStatus(p.id, p.status)}
                            className="gap-1"
                          >
                            {p.status === 'ACTIVE' ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                숨김
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                승인 노출
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 3: B2C 공동구매 상품 검수 */}
        {/* ======================================================== */}
        <TabsContent value="b2c_group" className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">B2C 공동구매(GroupBuy) 특가 검수</CardTitle>
              <CardDescription>
                인원 달성형 공구 상품의 목표 인원 모집 현황 및 특가 할인율 검수 통제
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/40 border-b border-border">
                    <tr>
                      <th className="px-5 py-3 font-semibold">공구 상품명</th>
                      <th className="px-5 py-3 font-semibold">제공사</th>
                      <th className="px-5 py-3 font-semibold text-right">공구가격 (KRW)</th>
                      <th className="px-5 py-3 font-semibold text-center">공구 달성률</th>
                      <th className="px-5 py-3 font-semibold text-center">상태</th>
                      <th className="px-5 py-3 font-semibold text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {groupProducts.map((p) => {
                      const rate = Math.round((p.currentQuantity / p.targetQuantity) * 100)
                      return (
                        <tr key={p.id} className="hover:bg-muted/20">
                          <td className="px-5 py-3.5 font-medium">{p.title}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{p.merchantName}</td>
                          <td className="px-5 py-3.5 text-right font-mono font-bold text-primary">
                            {p.price.toLocaleString()}원
                            <span className="text-xs text-muted-foreground line-through block font-normal">
                              {p.originalPrice.toLocaleString()}원
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <div className="font-mono text-xs font-bold text-indigo-500">
                              {p.currentQuantity} / {p.targetQuantity}명 ({rate}%)
                            </div>
                            <div className="w-24 h-1.5 bg-muted rounded-full mx-auto mt-1 overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${Math.min(100, rate)}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {p.status === 'ACTIVE' && (
                              <Badge className="bg-indigo-500/15 text-indigo-500 border-indigo-500/30">
                                모집 진행중
                              </Badge>
                            )}
                            {p.status === 'COMPLETED' && (
                              <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
                                공구 마감 (성공)
                              </Badge>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Button size="sm" variant="outline" className="gap-1">
                              상세 모니터링
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 4: 에스크로 주문 & 분쟁 관리 (기존 고도화 유지) */}
        {/* ======================================================== */}
        <TabsContent value="escrow" className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">에스크로 안전결제 주문 & 분쟁 중재</CardTitle>
              <CardDescription>
                PG 안전결제 주문의 예치 상태 모니터링 및 분쟁(Dispute) 구매확정 / 환불 집행
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/40 border-b border-border">
                    <tr>
                      <th className="px-5 py-3 font-semibold">주문번호 / 일시</th>
                      <th className="px-5 py-3 font-semibold">상품명</th>
                      <th className="px-5 py-3 font-semibold">구매자 / 판매자</th>
                      <th className="px-5 py-3 font-semibold text-right">결제금액 (ON)</th>
                      <th className="px-5 py-3 font-semibold text-center">에스크로 상태</th>
                      <th className="px-5 py-3 font-semibold text-right">중재 조치</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-muted/20">
                        <td className="px-5 py-3.5">
                          <div className="font-mono font-medium">{o.orderNumber}</div>
                          <div className="text-xs text-muted-foreground">{o.createdAt}</div>
                        </td>
                        <td className="px-5 py-3.5 font-medium">
                          {o.productTitle}
                          {o.disputeReason && (
                            <div className="text-xs text-rose-500 font-normal mt-0.5">
                              🚨 분쟁 사유: {o.disputeReason}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground">
                          구매: {o.buyerName} <br />
                          판매: {o.sellerName}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-primary">
                          {o.amount.toLocaleString()} ON
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {o.status === 'ESCROW_HOLD' && (
                            <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30">
                              에스크로 예치중
                            </Badge>
                          )}
                          {o.status === 'SHIPPED' && (
                            <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/30">
                              배송중
                            </Badge>
                          )}
                          {o.status === 'CONFIRMED' && (
                            <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
                              구매확정 완료
                            </Badge>
                          )}
                          {o.status === 'DISPUTED' && (
                            <Badge className="bg-rose-500/15 text-rose-500 border-rose-500/30">
                              분쟁 접수
                            </Badge>
                          )}
                          {o.status === 'REFUNDED' && (
                            <Badge variant="outline">환불 완료</Badge>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {o.status === 'DISPUTED' ? (
                            <div className="flex flex-col items-end gap-1">
                              {o.makerCheckerPending && (
                                <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px]">
                                  Maker-Checker 2인 결재 대기
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-indigo-600 hover:bg-indigo-700 h-7 text-xs gap-1 shadow-sm font-semibold"
                                onClick={() => handleOpenArbitration(o)}
                              >
                                <Scale className="w-3.5 h-3.5" />
                                ⚖️ 분쟁 중재
                              </Button>
                            </div>
                          ) : o.status === 'ESCROW_HOLD' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs"
                                onClick={() => handleForceConfirm(o.id)}
                              >
                                정산 승인
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs"
                                onClick={() => handleRefundBuyer(o.id)}
                              >
                                환불 집행
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">처리 완료</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 👑 본사 공식 직영 상품 등록 모달 */}
      {isHqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black shadow">
                  <Crown className="w-4 h-4 font-black" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">본사 공식 직영(HQ Direct) 상품 등록</h3>
                  <p className="text-xs text-muted-foreground">
                    골드 메탈릭 뱃지와 함께 마켓 직영관 및 스트리머 제휴 센터에 등록됩니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHqModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="text-xs font-semibold block mb-1">상품명 *</label>
                <Input
                  placeholder="예: [본사직영] 프리미엄 나주 특등급 햇배 5kg 세트"
                  value={hqForm.name}
                  onChange={(e) => setHqForm({ ...hqForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">정상가 (KRW) *</label>
                  <Input
                    type="number"
                    value={hqForm.priceKrw}
                    onChange={(e) => setHqForm({ ...hqForm, priceKrw: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">판매가 (할인가) *</label>
                  <Input
                    type="number"
                    value={hqForm.salePriceKrw}
                    onChange={(e) => setHqForm({ ...hqForm, salePriceKrw: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">초기 재고 수량 *</label>
                  <Input
                    type="number"
                    value={hqForm.stock}
                    onChange={(e) => setHqForm({ ...hqForm, stock: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">기본 배송비 (0원=무료)</label>
                  <Input
                    type="number"
                    value={hqForm.shippingFee}
                    onChange={(e) => setHqForm({ ...hqForm, shippingFee: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-500 text-xs">
                  <input
                    type="checkbox"
                    checked={hqForm.isHqDirect}
                    onChange={(e) => setHqForm({ ...hqForm, isHqDirect: e.target.checked })}
                    className="rounded border-amber-500 text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>👑 본사 공식 직영 상품으로 지정 (골드 메탈릭 뱃지 부착)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-500 text-xs">
                  <input
                    type="checkbox"
                    checked={hqForm.allowAffiliate}
                    onChange={(e) => setHqForm({ ...hqForm, allowAffiliate: e.target.checked })}
                    className="rounded border-rose-500 text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span>🎙️ 스트리머 D LIVE 제휴 위탁 판매 허용 (수익 쉐어)</span>
                </label>

                {hqForm.allowAffiliate && (
                  <div className="pl-6 pt-1">
                    <label className="text-xs font-semibold block mb-1 text-muted-foreground">
                      스트리머 지급 커미션율 (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.5"
                        value={hqForm.affiliateCommissionRate}
                        onChange={(e) =>
                          setHqForm({ ...hqForm, affiliateCommissionRate: Number(e.target.value) })
                        }
                        className="w-28 text-right font-bold"
                      />
                      <span className="text-xs font-semibold">%</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        건당 예상 수수료: ₩
                        {Math.floor(
                          (hqForm.salePriceKrw * hqForm.affiliateCommissionRate) / 100
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setIsHqModalOpen(false)}>
                취소
              </Button>
              <Button
                onClick={handleRegisterHqProduct}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 shadow-sm"
              >
                <Crown className="w-4 h-4 text-amber-200" />
                직영 상품 등록 승인
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
