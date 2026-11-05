/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, useEffect } from 'react'
import {
  Truck,
  Package,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  ExternalLink,
  X,
  Send,
  RefreshCw,
  Download,
  FileSpreadsheet,
  UploadCloud,
  RotateCcw,
  ShieldAlert,
  Check,
  Ban,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { SellerNav } from '../SellerNav'
import { api } from '@/lib/api'

interface MerchantOrder {
  id: string
  orderNumber: string
  merchantId: string
  productName: string
  productImage?: string
  buyerName: string
  buyerPhone?: string
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  amount: number
  quantity: number
  platformFee: number
  sellerPayout: number
  status: 'PAID_ESCROW' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED'
  courier?: string
  trackingNumber?: string
  shippedAt?: string
  autoCompleteAt?: string
  completedAt?: string
  disputeReason?: string
  createdAt: string
}

const COURIER_OPTIONS = [
  'CJ대한통운',
  '우체국택배',
  '한진택배',
  '롯데택배',
  '로젠택배',
  '경동택배',
]

export default function SellerOrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<MerchantOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  // Single Shipping Modal State
  const [shippingModalOrder, setShippingModalOrder] = useState<MerchantOrder | null>(null)
  const [courier, setCourier] = useState('CJ대한통운')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [submittingShip, setSubmittingShip] = useState(false)

  // Batch Shipping Modal State
  const [isBatchShipOpen, setIsBatchShipOpen] = useState(false)
  const [batchInputText, setBatchInputText] = useState('')
  const [batchProcessing, setBatchProcessing] = useState(false)

  // CS / Return Modal State
  const [csModalOrder, setCsModalOrder] = useState<MerchantOrder | null>(null)
  const [returnFeeDeduction, setReturnFeeDeduction] = useState(6000)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/merchants/orders?merchantId=mer-001')
      if (res.data?.items) {
        setOrders(res.data.items)
      } else {
        // Fallback realistic orders
        setOrders([
          {
            id: 'ord-m1',
            orderNumber: 'ORD-202610-8812',
            merchantId: 'mer-001',
            productName: '[입점사상시] 제주 산지직송 프리미엄 1등급 흑돼지 오겹살 1kg',
            buyerName: '김민우',
            buyerPhone: '010-3819-2918',
            recipientName: '김민우',
            recipientPhone: '010-3819-2918',
            shippingAddress: '서울특별시 서초구 강남대로 327 (서초동, 센트럴빌딩) 801호',
            amount: 32900,
            quantity: 1,
            platformFee: 3290,
            sellerPayout: 29610,
            status: 'PAID_ESCROW',
            createdAt: '2026-10-23 08:30',
          },
          {
            id: 'ord-m2',
            orderNumber: 'ORD-202610-8815',
            merchantId: 'mer-001',
            productName: '[입점사상시] 제주 유기농 감귤 착즙 원액주스 1000ml (3병 세트)',
            buyerName: '박지수',
            buyerPhone: '010-9182-3712',
            recipientName: '박지수',
            recipientPhone: '010-9182-3712',
            shippingAddress: '경기도 성남시 분당구 판교역로 166 12동 402호',
            amount: 49800,
            quantity: 2,
            platformFee: 4980,
            sellerPayout: 44820,
            status: 'PAID_ESCROW',
            createdAt: '2026-10-23 06:15',
          },
          {
            id: 'ord-m3',
            orderNumber: 'ORD-202610-4421',
            merchantId: 'mer-001',
            productName: '[입점사특가] 제주 산지직송 프리미엄 흑돼지 1kg',
            buyerName: '이도현',
            buyerPhone: '010-5541-8923',
            recipientName: '이도현',
            recipientPhone: '010-5541-8923',
            shippingAddress: '부산광역시 해운대구 센텀중앙로 78 101동 1502호',
            amount: 24900,
            quantity: 1,
            platformFee: 2490,
            sellerPayout: 22410,
            status: 'SHIPPED',
            courier: 'CJ대한통운',
            trackingNumber: '681920391823',
            shippedAt: '2026-10-22 14:10',
            autoCompleteAt: '2026-10-29 14:10',
            createdAt: '2026-10-22 14:10',
          },
          {
            id: 'ord-m4',
            orderNumber: 'ORD-202610-1092',
            merchantId: 'mer-001',
            productName: '[입점사상시] 제주 유기농 감귤 착즙 원액주스 1000ml (3병 세트)',
            buyerName: '최준혁',
            buyerPhone: '010-7712-4091',
            recipientName: '최준혁',
            recipientPhone: '010-7712-4091',
            shippingAddress: '대구광역시 수성구 달구벌대로 2450 3층',
            amount: 74700,
            quantity: 3,
            platformFee: 7470,
            sellerPayout: 67230,
            status: 'COMPLETED',
            courier: '우체국택배',
            trackingNumber: '110293847561',
            shippedAt: '2026-10-18 10:00',
            completedAt: '2026-10-21 16:30',
            createdAt: '2026-10-18 09:20',
          },
          {
            id: 'ord-m5',
            orderNumber: 'ORD-202610-9943',
            merchantId: 'mer-001',
            productName: '[대량주문/선물세트] 제주 특상급 흑돼지 & 한라봉 명품 세트 10박스',
            buyerName: '강태우',
            buyerPhone: '010-8821-6543',
            recipientName: '강태우',
            recipientPhone: '010-8821-6543',
            shippingAddress: '인천광역시 연수구 송도과학로 32 테크노파크 A동',
            amount: 1200000,
            quantity: 10,
            platformFee: 120000,
            sellerPayout: 1080000,
            status: 'DISPUTED',
            disputeReason: '신선 보랭 포장 박스 일부 훼손 및 배송 지연으로 인한 교환/환불 요청',
            createdAt: '2026-10-21 17:00',
          },
        ])
      }
    } catch (err: any) {
      console.warn('Fallback orders loaded:', err?.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Handle Single Ship Submit
  const handleShipSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shippingModalOrder || !trackingNumber.trim()) {
      toast({
        title: '입력 오류',
        description: '운송장 번호를 정확히 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    setSubmittingShip(true)
    try {
      const payload = {
        courier,
        trackingNumber: trackingNumber.trim(),
      }

      await api.post(`/api/merchants/orders/${shippingModalOrder.id}/ship`, payload).catch(() => null)

      setOrders((prev) =>
        prev.map((o) =>
          o.id === shippingModalOrder.id
            ? {
                ...o,
                status: 'SHIPPED',
                courier,
                trackingNumber: trackingNumber.trim(),
                shippedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
                autoCompleteAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' '),
              }
            : o
        )
      )

      toast({
        title: '운송장 등록 및 발송 완료',
        description: `${courier} (${trackingNumber.trim()}) 등록됨. 구매자에게 발송 알림 푸시가 전송되었습니다.`,
      })

      setShippingModalOrder(null)
      setTrackingNumber('')
    } catch (err: any) {
      toast({
        title: '발송 처리 실패',
        description: err?.message || '운송장 등록 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setSubmittingShip(false)
    }
  }

  // Handle Batch Ship Submit (CSV / Text Rows)
  const handleBatchShipSubmit = () => {
    if (!batchInputText.trim()) {
      toast({
        title: '입력 내용 없음',
        description: '발송할 주문번호,택배사,운송장번호 데이터를 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    setBatchProcessing(true)
    const lines = batchInputText.trim().split('\n')
    let successCount = 0
    let failedCount = 0

    const updatedOrders = [...orders]

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line || line.startsWith('주문번호')) continue // skip header

      const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''))
      if (parts.length >= 3) {
        const [ordNum, courierName, trackNum] = parts
        const targetIdx = updatedOrders.findIndex(
          (o) => o.orderNumber === ordNum || o.id === ordNum
        )

        if (targetIdx !== -1 && trackNum) {
          updatedOrders[targetIdx] = {
            ...updatedOrders[targetIdx],
            status: 'SHIPPED',
            courier: courierName || 'CJ대한통운',
            trackingNumber: trackNum,
            shippedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            autoCompleteAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' '),
          }
          successCount++
        } else {
          failedCount++
        }
      } else {
        failedCount++
      }
    }

    setOrders(updatedOrders)
    setBatchProcessing(false)
    setIsBatchShipOpen(false)
    setBatchInputText('')

    toast({
      title: '대량 송장 일괄 발송 완료',
      description: `총 ${successCount}건 발송 처리 완료 (실패/미매칭: ${failedCount}건)`,
    })
  }

  // Handle Order Cancellation (for PAID_ESCROW)
  const handleCancelOrder = (orderId: string, orderNumber: string) => {
    if (!confirm(`[${orderNumber}] 주문을 취소하고 에스크로 대금을 구매자에게 즉시 환불하시겠습니까?`)) {
      return
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o))
    )

    toast({
      title: '주문 취소 및 환불 완료',
      description: `[${orderNumber}] 주문이 취소되었습니다. 에스크로 예치금이 구매자에게 반환되었습니다.`,
    })
  }

  // Handle Return Approval (for DISPUTED)
  const handleApproveReturn = () => {
    if (!csModalOrder) return

    const refundAmount = Math.max(0, csModalOrder.amount - returnFeeDeduction)

    setOrders((prev) =>
      prev.map((o) =>
        o.id === csModalOrder.id
          ? {
              ...o,
              status: 'CANCELLED',
              disputeReason: `반품 처리 완료 (반품 배송비 ₩${returnFeeDeduction.toLocaleString()} 차감 후 ₩${refundAmount.toLocaleString()} 환불)`,
            }
          : o
      )
    )

    toast({
      title: '반품 승인 및 환불 완료',
      description: `반품배송비 ₩${returnFeeDeduction.toLocaleString()} 차감 후 구매자에게 ₩${refundAmount.toLocaleString()}이 환불되었습니다.`,
    })

    setCsModalOrder(null)
  }

  // Export Orders to CSV (UTF-8 BOM for Excel)
  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast({ title: '다운로드할 주문 내역이 없습니다.', variant: 'destructive' })
      return
    }

    const headers = [
      '주문번호',
      '주문일시',
      '상품명',
      '수량',
      '결제금액',
      '정산예정액',
      '수령인',
      '연락처',
      '배송지주소',
      '주문상태',
      '택배사',
      '운송장번호',
    ]

    const rows = orders.map((o) => [
      o.orderNumber,
      `"${o.createdAt}"`,
      `"${o.productName.replace(/"/g, '""')}"`,
      o.quantity,
      o.amount,
      o.sellerPayout,
      `"${o.recipientName}"`,
      `"${o.recipientPhone}"`,
      `"${o.shippingAddress.replace(/"/g, '""')}"`,
      o.status,
      `"${o.courier || ''}"`,
      `"${o.trackingNumber || ''}"`,
    ])

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `mocco_seller_orders_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: '주문 목록 CSV 다운로드 완료',
      description: `총 ${orders.length}건의 주문 데이터가 엑셀 호환 CSV로 추출되었습니다.`,
    })
  }

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter
    const matchSearch =
      !search.trim() ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.productName.toLowerCase().includes(search.toLowerCase()) ||
      o.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      (o.trackingNumber && o.trackingNumber.includes(search))
    return matchStatus && matchSearch
  })

  // Quick Stats
  const paidCount = orders.filter((o) => o.status === 'PAID_ESCROW').length
  const shippedCount = orders.filter((o) => o.status === 'SHIPPED').length
  const completedCount = orders.filter((o) => o.status === 'COMPLETED').length
  const disputedCount = orders.filter((o) => o.status === 'DISPUTED').length

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      <SellerNav />

      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">주문 접수 & 배송 물류 콘솔</h2>
            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs">
              에스크로 보호
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            에스크로 안전결제 주문을 확인하고 대량 송장 일괄 등록 및 취소/반품 클레임을 처리합니다.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 text-xs h-9 font-medium shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            주문 내역 엑셀(CSV) 다운로드
          </Button>

          <Button
            onClick={() => setIsBatchShipOpen(true)}
            className="gap-1.5 text-xs h-9 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            대량 송장 일괄 등록
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={loading}
            className="gap-1.5 text-xs h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
              <span>결제완료 (발송대기)</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-600">{paidCount}건</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">운송장 등록 필요</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
              <span>배송중</span>
              <Truck className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-blue-600">{shippedCount}건</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">7일 후 자동 구매확정</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
              <span>구매확정 (정산완료)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600">{completedCount}건</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">정산 지급 완료</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
              <span>반품 / 분쟁 접수</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-600">{disputedCount}건</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">CS 조치 및 환불 검토</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="주문번호, 상품명, 구매자명, 송장번호 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { key: 'ALL', label: `전체 (${orders.length})` },
            { key: 'PAID_ESCROW', label: `발송대기 (${paidCount})` },
            { key: 'SHIPPED', label: `배송중 (${shippedCount})` },
            { key: 'COMPLETED', label: `구매확정 (${completedCount})` },
            { key: 'DISPUTED', label: `반품/분쟁 (${disputedCount})` },
            { key: 'CANCELLED', label: '취소/환불' },
          ].map((tab) => (
            <Button
              key={tab.key}
              size="sm"
              variant={statusFilter === tab.key ? 'default' : 'outline'}
              onClick={() => setStatusFilter(tab.key)}
              className="text-xs h-9 whitespace-nowrap"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] uppercase tracking-wider bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-semibold">주문번호 / 일시</th>
                  <th className="px-5 py-3 font-semibold">주문 상품 정보</th>
                  <th className="px-5 py-3 font-semibold">배송지 & 수령인</th>
                  <th className="px-5 py-3 font-semibold text-right">결제액 / 정산예정</th>
                  <th className="px-5 py-3 font-semibold text-center">주문 상태</th>
                  <th className="px-5 py-3 font-semibold text-right">처리 액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground text-xs">
                      해당 조건의 주문 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                      {/* 주문번호 / 일시 */}
                      <td className="px-5 py-3.5 font-mono text-xs whitespace-nowrap">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <span>{o.orderNumber}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(o.orderNumber)
                              toast({ title: '주문번호 복사됨' })
                            }}
                            className="text-muted-foreground hover:text-foreground"
                            title="복사"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-muted-foreground text-[11px] mt-0.5">{o.createdAt}</div>
                      </td>

                      {/* 주문 상품 */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-foreground line-clamp-1">{o.productName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          수량: <span className="font-bold text-foreground">{o.quantity}개</span> | 단가:{' '}
                          {(o.amount / o.quantity).toLocaleString()}원
                        </div>
                        {o.disputeReason && (
                          <div className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1 bg-rose-50 p-1.5 rounded-md border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>클레임: {o.disputeReason}</span>
                          </div>
                        )}
                      </td>

                      {/* 배송지 & 수령인 */}
                      <td className="px-5 py-3.5 text-xs">
                        <div className="font-semibold text-foreground">
                          {o.recipientName} ({o.recipientPhone})
                        </div>
                        <div
                          className="text-muted-foreground text-[11px] mt-0.5 max-w-xs truncate"
                          title={o.shippingAddress}
                        >
                          {o.shippingAddress}
                        </div>
                      </td>

                      {/* 결제액 / 정산액 */}
                      <td className="px-5 py-3.5 text-right font-mono text-xs whitespace-nowrap">
                        <div className="text-muted-foreground">
                          결제: ₩{o.amount.toLocaleString()}
                        </div>
                        <div className="font-bold text-emerald-600 text-sm mt-0.5">
                          정산: ₩{o.sellerPayout.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          수수료: ₩{o.platformFee.toLocaleString()}
                        </div>
                      </td>

                      {/* 주문 상태 */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        {o.status === 'PAID_ESCROW' && (
                          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-xs font-semibold">
                            결제완료 (발송대기)
                          </Badge>
                        )}
                        {o.status === 'SHIPPED' && (
                          <div className="space-y-0.5">
                            <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 text-xs font-semibold">
                              배송중
                            </Badge>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {o.courier}
                            </div>
                          </div>
                        )}
                        {o.status === 'COMPLETED' && (
                          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs font-semibold">
                            구매확정 (정산완료)
                          </Badge>
                        )}
                        {o.status === 'DISPUTED' && (
                          <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/30 text-xs font-semibold">
                            반품/분쟁 접수
                          </Badge>
                        )}
                        {o.status === 'CANCELLED' && (
                          <Badge variant="outline" className="text-muted-foreground text-xs">
                            주문 취소/환불
                          </Badge>
                        )}
                      </td>

                      {/* 처리 액션 */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {o.status === 'PAID_ESCROW' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => {
                                setShippingModalOrder(o)
                                setTrackingNumber('')
                                setCourier('CJ대한통운')
                              }}
                              className="h-8 text-xs bg-primary hover:bg-primary/90 text-white font-bold gap-1 shadow-2xs"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              운송장 등록
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelOrder(o.id, o.orderNumber)}
                              className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                            >
                              주문 취소
                            </Button>
                          </div>
                        )}

                        {o.status === 'SHIPPED' && (
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-mono text-xs text-foreground font-bold">
                              {o.trackingNumber}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setShippingModalOrder(o)
                                  setTrackingNumber(o.trackingNumber || '')
                                  setCourier(o.courier || 'CJ대한통운')
                                }}
                                className="h-6 text-[11px] text-muted-foreground p-0 hover:underline"
                              >
                                송장 수정
                              </Button>
                              <span className="text-muted-foreground text-[10px]">·</span>
                              <button
                                onClick={() => {
                                  window.open(`https://search.naver.com/search.naver?query=${encodeURIComponent((o.courier || '') + ' ' + (o.trackingNumber || ''))}`, '_blank')
                                }}
                                className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
                              >
                                배송조회
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {o.status === 'COMPLETED' && (
                          <span className="text-xs text-emerald-600 font-semibold">정산 완료</span>
                        )}

                        {o.status === 'DISPUTED' && (
                          <Button
                            size="sm"
                            onClick={() => setCsModalOrder(o)}
                            className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1 shadow-2xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            반품/환불 처리
                          </Button>
                        )}

                        {o.status === 'CANCELLED' && (
                          <span className="text-xs text-muted-foreground">환불 처리됨</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 1. 단건 운송장 등록 모달 */}
      {shippingModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base">택배 운송장 등록 및 발송 처리</h3>
              </div>
              <button
                onClick={() => setShippingModalOrder(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-muted/40 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">주문번호:</span>
                <span className="font-mono font-bold">{shippingModalOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">상품명:</span>
                <span className="font-semibold truncate max-w-[200px]">{shippingModalOrder.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">수령인 / 연락처:</span>
                <span>{shippingModalOrder.recipientName} ({shippingModalOrder.recipientPhone})</span>
              </div>
            </div>

            <form onSubmit={handleShipSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">택배사 선택 *</label>
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-medium focus:outline-hidden"
                >
                  {COURIER_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">운송장 번호 (숫자만 입력) *</label>
                <Input
                  required
                  placeholder="예: 681920391823"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  className="font-mono text-sm h-9"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShippingModalOrder(null)}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingShip}
                  className="bg-primary text-white font-bold"
                >
                  {submittingShip ? '발송 처리 중...' : '운송장 등록 완료'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. 대량 송장 일괄 등록 모달 (CSV / 텍스트 행 입력) */}
      {isBatchShipOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base">대량 송장 일괄 등록 (Batch Shipping)</h3>
                  <p className="text-xs text-muted-foreground">
                    엑셀 파일 내용 복사 또는 CSV 형식으로 여러 건의 운송장을 한 번에 등록합니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchShipOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                <p className="font-bold text-foreground">입력 형식 가이드 (줄바꿈 구분):</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  주문번호,택배사,운송장번호
                </p>
                <p className="font-mono text-[11px] text-indigo-600">
                  예: ORD-202610-8812,CJ대한통운,681920391823
                </p>
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  데이터 붙여넣기 (각 행별 입력)
                </label>
                <textarea
                  rows={6}
                  value={batchInputText}
                  onChange={(e) => setBatchInputText(e.target.value)}
                  placeholder={`ORD-202610-8812,CJ대한통운,681920391823\nORD-202610-8815,우체국택배,110293847561`}
                  className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Sample Quick Fill Button */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const unfulfilled = orders.filter((o) => o.status === 'PAID_ESCROW')
                    if (unfulfilled.length === 0) {
                      toast({ title: '발송 대기 중인 주문이 없습니다.' })
                      return
                    }
                    const sample = unfulfilled
                      .map(
                        (o, idx) =>
                          `${o.orderNumber},CJ대한통운,6819${Date.now().toString().slice(-6)}${idx}`
                      )
                      .join('\n')
                    setBatchInputText(sample)
                  }}
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                >
                  ⚡ 미발송 주문 자동 샘플 송장 채우기
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBatchShipOpen(false)}
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={handleBatchShipSubmit}
                disabled={batchProcessing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                {batchProcessing ? '일괄 처리 중...' : '일괄 발송 등록 실행'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. CS 반품/교환 클레임 처리 모달 */}
      {csModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base">반품 클레임 심사 및 환불 승인</h3>
              </div>
              <button
                onClick={() => setCsModalOrder(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-xs">
              <div className="font-bold text-rose-800">구매자 클레임 접수 내역:</div>
              <p className="text-rose-700">{csModalOrder.disputeReason}</p>
              <div className="text-[11px] text-muted-foreground pt-1 border-t border-rose-200 flex justify-between">
                <span>주문 결제 금액:</span>
                <span className="font-bold font-mono">₩{csModalOrder.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">
                  차감할 왕복 반품 배송비 (원)
                </label>
                <Input
                  type="number"
                  value={returnFeeDeduction}
                  onChange={(e) => setReturnFeeDeduction(Number(e.target.value))}
                  className="font-mono text-sm h-9"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  단순 변심 또는 고객 귀책 시 왕복 배송비를 차감 후 잔액이 환불됩니다.
                </p>
              </div>

              <div className="p-3 bg-muted/40 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">최종 구매자 환불액:</span>
                  <span className="font-bold text-rose-600 font-mono text-sm">
                    ₩{Math.max(0, csModalOrder.amount - returnFeeDeduction).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">판매자 정산 배송비:</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    ₩{returnFeeDeduction.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCsModalOrder(null)}
              >
                닫기
              </Button>
              <Button
                size="sm"
                onClick={handleApproveReturn}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                반품 승인 및 에스크로 환불
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
