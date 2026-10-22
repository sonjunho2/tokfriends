'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'

interface MockEscrowOrder {
  id: string
  orderNumber: string
  productTitle: string
  productType: 'C2C_USED' | 'B2C_GROUP'
  buyerName: string
  sellerName: string
  amount: number
  platformFee: number
  sellerPayout: number
  status: 'ESCROW_HOLD' | 'SHIPPED' | 'CONFIRMED' | 'DISPUTED' | 'REFUNDED'
  createdAt: string
  disputeReason?: string
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
    amount: 450000,
    platformFee: 22500,
    sellerPayout: 427500,
    status: 'DISPUTED',
    disputeReason: '물품 설명과 달리 본체 하단에 깊은 스크래치 다수 존재',
    createdAt: '2026-10-19 14:05',
  },
]

export default function MarketEscrowAdminPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<MockEscrowOrder[]>(INITIAL_ORDERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  const totalEscrowHold = orders
    .filter((o) => o.status === 'ESCROW_HOLD' || o.status === 'SHIPPED')
    .reduce((acc, cur) => acc + cur.amount, 0)

  const totalCompletedVolume = orders
    .filter((o) => o.status === 'CONFIRMED')
    .reduce((acc, cur) => acc + cur.amount, 0)

  const disputeCount = orders.filter((o) => o.status === 'DISPUTED').length

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

  // 판매자 정산용 은행 대량이체(CMS) 표준 CSV 다운로드
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

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.sellerName.toLowerCase().includes(searchQuery.toLowerCase())
    if (filterStatus === 'ALL') return matchesSearch
    return matchesSearch && o.status === filterStatus
  })

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            마켓 & 에스크로 안전결제 관리
          </h1>
          <p className="text-sm text-slate-500">
            DAGAON C2C 중고거래 및 B2C 공동구매 에스크로 펀드(1 ON = 1원) 보관 및 분쟁 중재
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCmsCsv}>
            <Download className="mr-2 h-4 w-4" /> 은행 이체 CMS 다운로드
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast({ title: '최신 거래 정보 갱신 완료' })}>
            <RefreshCw className="mr-2 h-4 w-4" /> 새로고침
          </Button>
        </div>
      </div>

      {/* 상단 핵심 KPI 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">에스크로 보관 잔액</CardTitle>
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700">
              {totalEscrowHold.toLocaleString()} <span className="text-sm font-semibold">ON</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">1:1 원화 가치 안전 보관 중</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">누적 거래 완료액</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {totalCompletedVolume.toLocaleString()} <span className="text-sm font-semibold">ON</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">수수료(5%) 수익 정산 완료</p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-gradient-to-br from-amber-50/50 to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">분쟁(Dispute) 대기</CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              {disputeCount} <span className="text-sm font-semibold">건</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">관리자 신속 중재 필요</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-gradient-to-br from-blue-50/50 to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">총 주문 건수</CardTitle>
            <Store className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {orders.length} <span className="text-sm font-semibold">건</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">C2C & B2C 통합 집계</p>
          </CardContent>
        </Card>
      </div>

      {/* 에스크로 주문 목록 카드 */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-bold">에스크로 주문 & 분쟁 중재 내역</CardTitle>
              <CardDescription>
                주문 상태별 실시간 모니터링 및 구매확정/환불 집행
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="주문번호, 상품명, 회원명 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 상태 필터 탭 */}
          <div className="mb-4 flex flex-wrap gap-2 border-b pb-3">
            {[
              { id: 'ALL', label: '전체' },
              { id: 'ESCROW_HOLD', label: '에스크로 보관중' },
              { id: 'SHIPPED', label: '발송/배송중' },
              { id: 'CONFIRMED', label: '구매확정 완료' },
              { id: 'DISPUTED', label: '분쟁 접수' },
              { id: 'REFUNDED', label: '환불 완료' },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={filterStatus === tab.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterStatus(tab.id)}
                className="h-8 rounded-full text-xs"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* 테이블 */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">주문번호 / 일시</th>
                  <th className="px-4 py-3">구분</th>
                  <th className="px-4 py-3">물품 정보</th>
                  <th className="px-4 py-3">구매자 / 판매자</th>
                  <th className="px-4 py-3">결제금액 (1:1 ON)</th>
                  <th className="px-4 py-3">에스크로 상태</th>
                  <th className="px-4 py-3 text-right">중재 조치</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const isDisputed = order.status === 'DISPUTED'
                  return (
                    <tr
                      key={order.id}
                      className={isDisputed ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50/60'}
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        <div className="font-semibold text-slate-900">{order.orderNumber}</div>
                        <div className="text-slate-400">{order.createdAt}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold ${
                            order.productType === 'C2C_USED'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {order.productType === 'C2C_USED' ? '중고거래' : '공동구매'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div>{order.productTitle}</div>
                        {order.disputeReason && (
                          <div className="mt-1 text-xs text-rose-600">
                            🚨 사유: {order.disputeReason}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div>구매: <span className="font-semibold">{order.buyerName}</span></div>
                        <div>판매: <span className="font-semibold">{order.sellerName}</span></div>
                      </td>
                      <td className="px-4 py-3 font-bold text-indigo-700">
                        {order.amount.toLocaleString()} ON
                        <div className="text-[11px] font-normal text-slate-400">
                          수수료: {order.platformFee.toLocaleString()} ON
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {order.status === 'ESCROW_HOLD' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                            <Clock className="h-3 w-3" /> 보관중
                          </span>
                        )}
                        {order.status === 'SHIPPED' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200">
                            <Package className="h-3 w-3" /> 배송중
                          </span>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> 확정완료
                          </span>
                        )}
                        {order.status === 'DISPUTED' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-300">
                            <AlertTriangle className="h-3 w-3" /> 분쟁접수
                          </span>
                        )}
                        {order.status === 'REFUNDED' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-300">
                            환불완료
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isDisputed ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 bg-emerald-600 hover:bg-emerald-700 text-xs px-2.5"
                              onClick={() => handleForceConfirm(order.id)}
                            >
                              정상확정
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs px-2.5"
                              onClick={() => handleRefundBuyer(order.id)}
                            >
                              구매자환불
                            </Button>
                          </div>
                        ) : order.status === 'ESCROW_HOLD' || order.status === 'SHIPPED' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handleForceConfirm(order.id)}
                          >
                            강제확정
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">조치 완료</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
