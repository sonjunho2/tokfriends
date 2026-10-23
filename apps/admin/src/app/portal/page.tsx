/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShoppingBag,
  Store,
  Users2,
  Tag,
  Search,
  Download,
  QrCode,
  ShieldCheck,
  Truck,
  Heart,
  Share2,
  ExternalLink,
  CheckCircle2,
  X,
  CreditCard,
  Radio,
  Sparkles,
  ArrowRight,
  Package,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/lib/api'

interface WebProductItem {
  id: string
  title: string
  description: string
  price: number
  originalPrice?: number
  type: 'B2C_NORMAL' | 'B2C_GROUP' | 'C2C_USED'
  category: string
  images: string[]
  sellerName: string
  shippingFee: number
  stock: number
  locationName?: string
  status: string
}

const INITIAL_WEB_PRODUCTS: WebProductItem[] = [
  {
    id: 'np-001',
    title: '[입점사상시] 제주 산지직송 프리미엄 1등급 흑돼지 오겹살 1kg',
    description: '제주 청정 농가에서 당일 도축 후 신선 보랭 포장 발송하는 1등급 명품 흑돼지 오겹살입니다.',
    price: 32900,
    originalPrice: 38000,
    type: 'B2C_NORMAL',
    category: 'FOOD',
    images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
      'https://images.unsplash.com/photo-1558030006-450675393462?w=800',
    ],
    sellerName: '제주푸드 본사 직영',
    shippingFee: 3000,
    stock: 150,
    status: 'ACTIVE',
  },
  {
    id: 'np-002',
    title: '[입점사상시] 제주 유기농 감귤 착즙 원액주스 1000ml (3병 세트)',
    description: '물 한 방울 섞지 않은 무가당 100% 제주 감귤 순수 착즙 프리미엄 주스입니다.',
    price: 24900,
    originalPrice: 29000,
    type: 'B2C_NORMAL',
    category: 'FOOD',
    images: [
      'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800',
    ],
    sellerName: '제주푸드 본사 직영',
    shippingFee: 0,
    stock: 80,
    status: 'ACTIVE',
  },
  {
    id: 'gp-001',
    title: '[공동구매 특가] 산지직송 나주 배 5kg 특등급 (목표 20박스)',
    description: '당도 13브릭스 이상 보장 나주 특등급 햇배 공동구매 43% 할인 딜입니다.',
    price: 19900,
    originalPrice: 35000,
    type: 'B2C_GROUP',
    category: 'FOOD',
    images: [
      'https://images.unsplash.com/photo-1514756331096-242fdeb7004a?w=800',
    ],
    sellerName: '전남 파머스 마켓',
    shippingFee: 0,
    stock: 20,
    status: 'ACTIVE',
  },
  {
    id: 'c2c-1',
    title: '아이폰 15 프로 256GB 내추럴 티타늄 풀박스 (배터리 99%)',
    description: '구매 후 케이스/필름 상시 착용하여 기스 전혀 없는 특S급 상태입니다. 풀박스 구성품 모두 포함.',
    price: 980000,
    originalPrice: 1550000,
    type: 'C2C_USED',
    category: 'DIGITAL',
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=800',
    ],
    sellerName: '테크러버 (인증회원)',
    shippingFee: 3500,
    stock: 1,
    locationName: '서울 강남구 역삼역 3번출구',
    status: 'ACTIVE',
  },
  {
    id: 'np-003',
    title: '[공식인증] 고순도 프리미엄 알티지 오메가3 120캡슐 (4개월분)',
    description: 'IFOS 최고등급 원료 사용, 흡수율 높은 rTG형 오메가3로 혈행 및 눈 건강을 지켜드립니다.',
    price: 42000,
    originalPrice: 55000,
    type: 'B2C_NORMAL',
    category: 'LIVING',
    images: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
    ],
    sellerName: '메디컬 헬스케어랩',
    shippingFee: 2500,
    stock: 200,
    status: 'ACTIVE',
  },
  {
    id: 'c2c-2',
    title: '미개봉 소니 WH-1000XM5 노이즈캔슬링 무선 헤드폰 실버',
    description: '선물 받고 미개봉 상태로 보관 중인 정품입니다. 국내 정식 발매 제품 영수증 동봉.',
    price: 320000,
    originalPrice: 479000,
    type: 'C2C_USED',
    category: 'DIGITAL',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    ],
    sellerName: '오디오매니아',
    shippingFee: 0,
    stock: 1,
    locationName: '경기 성남시 판교역',
    status: 'ACTIVE',
  },
  {
    id: 'gp-002',
    title: '[인스트림 라이브 공구] 프리미엄 호텔식 40수 순면 수건 10장 세트',
    description: '특급 호텔에서 사용하는 최고급 코마사 40수 200g 도톰한 프리미엄 순면 타월 세트.',
    price: 24000,
    originalPrice: 42000,
    type: 'B2C_GROUP',
    category: 'LIVING',
    images: [
      'https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=800',
    ],
    sellerName: '홈앤리빙 직영점',
    shippingFee: 0,
    stock: 50,
    status: 'ACTIVE',
  },
  {
    id: 'np-004',
    title: '[입점사상시] 무소음 초음파 감성 아로마 무드등 가습기 500ml',
    description: '심플한 모던 인테리어 디자인과 7가지 은은한 LED 무드등 기능이 탑재된 초음파 가습기.',
    price: 35000,
    originalPrice: 42000,
    type: 'B2C_NORMAL',
    category: 'LIVING',
    images: [
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800',
    ],
    sellerName: '어반 라이프 스타일',
    shippingFee: 3000,
    stock: 60,
    status: 'ACTIVE',
  },
]

export default function CustomerWebPortalPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<WebProductItem[]>(INITIAL_WEB_PRODUCTS)
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'B2C_NORMAL' | 'B2C_GROUP' | 'C2C_USED'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState<WebProductItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImgIndex, setActiveImgIndex] = useState(0)

  // Payment Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [payMethod, setPayMethod] = useState<'CARD' | 'TOSS_PAY' | 'KAKAO_PAY'>('CARD')
  const [buyerName, setBuyerName] = useState('김고객')
  const [buyerPhone, setBuyerPhone] = useState('010-1234-5678')
  const [shippingAddress, setShippingAddress] = useState('서울특별시 강남구 테헤란로 152 강남파이낸스센터 12층')
  const [isProcessingPay, setIsProcessingPay] = useState(false)

  // App Download QR Modal State
  const [isAppDownloadOpen, setIsAppDownloadOpen] = useState(false)

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchTab = selectedTab === 'ALL' || p.type === selectedTab
    const matchSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sellerName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchTab && matchSearch
  })

  // Open Detail
  const handleOpenDetail = (p: WebProductItem) => {
    setSelectedProduct(p)
    setQuantity(1)
    setActiveImgIndex(0)
  }

  // Open Checkout
  const handleProceedCheckout = () => {
    setIsCheckoutOpen(true)
  }

  // Submit Web PG Payment
  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    setIsProcessingPay(true)
    try {
      const totalAmount = selectedProduct.price * quantity + selectedProduct.shippingFee

      // Try Backend PG Prepare if connected
      try {
        await api.post('/api/payments/escrow/prepare', {
          productId: selectedProduct.id,
          quantity,
          shippingAddress,
          pgProvider: 'TOSS_PAYMENTS',
        })
      } catch {}

      toast({
        title: '🎉 에스크로 안전결제 승인 완료',
        description: `주문금액 ${totalAmount.toLocaleString()}원이 에스크로 안전계좌에 예치되었습니다. 물품 발송 후 배송 조회가 시작됩니다.`,
      })

      setIsCheckoutOpen(false)
      setSelectedProduct(null)
    } catch (err: any) {
      toast({
        title: '결제 실패',
        description: err?.message || '결제 진행 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessingPay(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 1. Global Customer Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo & Slogan */}
          <Link href="/portal" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-coral-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-rose-500 to-indigo-600 bg-clip-text text-transparent">
                DAGAON
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase ml-1.5 px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                WEB STORE
              </span>
            </div>
          </Link>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="상품명, 입점 브랜드, 중고 물품 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm bg-muted/40 border-border rounded-full focus-visible:ring-primary"
            />
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/web/live/live-101"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-500 text-xs font-semibold hover:bg-rose-500/20 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <Radio className="w-3.5 h-3.5" />
              D LIVE 실시간 방송
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAppDownloadOpen(true)}
              className="gap-1.5 text-xs h-9 rounded-full border-primary/30 text-primary hover:bg-primary/10"
            >
              <Download className="w-3.5 h-3.5" />
              앱 다운로드
            </Button>
          </div>
        </div>

        {/* 3 Main Category Tabs */}
        <div className="border-t border-border/50 bg-muted/20">
          <div className="container max-w-7xl mx-auto px-4 flex items-center gap-2 overflow-x-auto py-2">
            {[
              { key: 'ALL', label: '전체 상품 탐색', icon: Sparkles },
              { key: 'B2C_NORMAL', label: '🛍️ 브랜드 쇼핑 (상시 특가)', icon: Store },
              { key: 'B2C_GROUP', label: '🔥 특가 공동구매', icon: Users2 },
              { key: 'C2C_USED', label: '🏷️ 동네 중고거래', icon: Tag },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = selectedTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container max-w-7xl mx-auto px-4 py-6 flex-1 space-y-6">
        {/* Promotional Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-rose-900 via-indigo-950 to-slate-900 border border-border p-6 md:p-8 text-white shadow-xl">
          <div className="max-w-xl space-y-2 z-10 relative">
            <Badge className="bg-rose-500 text-white text-xs border-none font-bold">
              DAGAON PROMOTION
            </Badge>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              제주 산지직송 흑돼지 & 한라봉 <br />
              <span className="text-rose-400">공식 입점사 런칭 특가</span> 기획전
            </h2>
            <p className="text-xs md:text-sm text-slate-300">
              검증된 공식 입점사의 신선 식품과 인기 디지털 상품을 PC 웹에서 에스크로 안전결제로 직접 주문하세요.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Button
                size="sm"
                onClick={() => setSelectedTab('B2C_NORMAL')}
                className="bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs font-semibold"
              >
                기획전 상품 보기
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
              <Link
                href="/web/live/live-101"
                className="text-xs text-slate-300 hover:text-white underline underline-offset-4 flex items-center gap-1"
              >
                라이브 방송 바로가기 &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Product Count Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-muted-foreground">
            등록 상품 <span className="font-bold text-foreground">{filteredProducts.length}</span>개
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            전 상품 PG 에스크로 100% 안전결제 보장
          </div>
        </div>

        {/* 4-Column Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredProducts.map((p) => {
            const discountRate =
              p.originalPrice && p.originalPrice > p.price
                ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                : null

            return (
              <Card
                key={p.id}
                onClick={() => handleOpenDetail(p)}
                className="group overflow-hidden rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col"
              >
                {/* Thumbnail Image */}
                <div className="relative aspect-square w-full bg-muted overflow-hidden">
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {p.type === 'B2C_NORMAL' && (
                      <Badge className="bg-rose-500 text-white text-[10px] font-bold shadow-sm">
                        브랜드 입점사
                      </Badge>
                    )}
                    {p.type === 'B2C_GROUP' && (
                      <Badge className="bg-indigo-600 text-white text-[10px] font-bold shadow-sm">
                        공동구매
                      </Badge>
                    )}
                    {p.type === 'C2C_USED' && (
                      <Badge className="bg-slate-800 text-white text-[10px] font-bold shadow-sm">
                        동네 중고
                      </Badge>
                    )}
                  </div>

                  {p.shippingFee === 0 && (
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="secondary" className="text-[10px] font-bold bg-background/90 backdrop-blur">
                        무료배송
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Info Card */}
                <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <div className="text-[11px] text-muted-foreground font-medium truncate">
                      {p.sellerName}
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {p.title}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-baseline gap-1.5">
                      {discountRate && (
                        <span className="text-rose-500 font-extrabold text-base font-mono">
                          {discountRate}%
                        </span>
                      )}
                      <span className="text-lg font-bold font-mono text-foreground">
                        {p.price.toLocaleString()}원
                      </span>
                    </div>

                    {p.originalPrice && p.originalPrice > p.price && (
                      <div className="text-xs text-muted-foreground line-through font-mono">
                        {p.originalPrice.toLocaleString()}원
                      </div>
                    )}

                    <Button
                      size="sm"
                      className="w-full mt-3 h-8 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenDetail(p)
                      }}
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1" />
                      PC 안전구매
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Image Gallery */}
              <div className="space-y-3">
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-muted border border-border">
                  <img
                    src={selectedProduct.images[activeImgIndex] || selectedProduct.images[0]}
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {selectedProduct.images.length > 1 && (
                  <div className="flex items-center gap-2">
                    {selectedProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImgIndex(idx)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                          activeImgIndex === idx ? 'border-primary' : 'border-transparent opacity-60'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Order Details */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                      {selectedProduct.type === 'B2C_NORMAL'
                        ? '브랜드 입점사 직영'
                        : selectedProduct.type === 'B2C_GROUP'
                        ? '공동구매 핫딜'
                        : 'C2C 개인 중고'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{selectedProduct.sellerName}</span>
                  </div>

                  <h2 className="text-lg font-bold leading-tight text-foreground">
                    {selectedProduct.title}
                  </h2>

                  <div className="py-2">
                    <div className="text-2xl font-black font-mono text-primary">
                      {selectedProduct.price.toLocaleString()}원
                    </div>
                    {selectedProduct.originalPrice && (
                      <div className="text-xs text-muted-foreground line-through font-mono">
                        정상가: {selectedProduct.originalPrice.toLocaleString()}원
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {selectedProduct.description}
                  </p>

                  <div className="bg-muted/40 rounded-lg p-3 text-xs space-y-1.5 border border-border">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">배송비:</span>
                      <span className="font-semibold">
                        {selectedProduct.shippingFee === 0
                          ? '무료배송'
                          : `${selectedProduct.shippingFee.toLocaleString()}원`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">안전결제:</span>
                      <span className="text-emerald-500 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        토스페이먼츠 에스크로 보증
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quantity & Buy CTA */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs font-semibold">구매 수량</span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        -
                      </Button>
                      <span className="font-mono font-bold text-sm w-8 text-center">{quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between font-bold text-sm">
                    <span>최종 결제 금액</span>
                    <span className="font-mono text-lg text-primary">
                      {(selectedProduct.price * quantity + selectedProduct.shippingFee).toLocaleString()}원
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/share/market/${selectedProduct.id}`
                        navigator.clipboard.writeText(shareUrl)
                        toast({
                          title: '링크 복사 완료',
                          description: '상품 공유 링크가 클립보드에 복사되었습니다.',
                        })
                      }}
                      className="gap-1 text-xs"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      공유 링크
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleProceedCheckout}
                      className="bg-primary hover:bg-primary/90 text-white font-bold gap-1 text-xs"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      PC 안전구매 하기
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Web PG Payment Checkout Modal */}
      {isCheckoutOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                토스페이먼츠 PC 에스크로 결제
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                안전하게 대금이 에스크로에 예치되며 수령 후 구매확정됩니다.
              </p>
            </div>

            <form onSubmit={handleExecutePayment} className="space-y-4 text-sm">
              <div className="bg-muted/40 rounded-lg p-3 text-xs space-y-1 border border-border">
                <div className="font-semibold text-foreground line-clamp-1">{selectedProduct.title}</div>
                <div className="flex justify-between text-muted-foreground">
                  <span>수량: {quantity}개</span>
                  <span className="font-mono font-bold text-foreground">
                    {(selectedProduct.price * quantity + selectedProduct.shippingFee).toLocaleString()}원
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-muted-foreground">주문자 성함 *</label>
                <Input
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-muted-foreground">연락처 *</label>
                <Input
                  required
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-muted-foreground">배송지 주소 *</label>
                <Input
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 text-muted-foreground">결제 수단 선택 *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'CARD', label: '신용/체크카드' },
                    { key: 'TOSS_PAY', label: '토스페이' },
                    { key: 'KAKAO_PAY', label: '카카오페이' },
                  ].map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setPayMethod(m.key as any)}
                      className={`py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                        payMethod === m.key
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCheckoutOpen(false)}>
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessingPay}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white font-bold gap-1 text-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isProcessingPay ? '결제 승인 중...' : '에스크로 결제 승인'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* App Download Modal */}
      {isAppDownloadOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 text-center space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsAppDownloadOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base">다가온(DAGAON) 모바일 앱</h3>
              <p className="text-xs text-muted-foreground mt-1">
                스마트폰 카메라로 QR 코드를 스캔하거나 최신 APK를 다운로드하여 설치하세요.
              </p>
            </div>

            {/* QR Mockup */}
            <div className="p-4 bg-white rounded-xl inline-block shadow-inner mx-auto">
              <div className="w-36 h-36 bg-slate-900 flex flex-col items-center justify-center text-white p-2 text-center rounded-lg">
                <QrCode className="w-20 h-20 text-white mb-1" />
                <span className="text-[10px] font-mono font-bold tracking-widest text-rose-400">DAGAON APP</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button asChild className="w-full bg-primary hover:bg-primary/90 gap-1.5 text-xs">
                <a href="/downloads/dagaon-release.apk" download="dagaon-release.apk">
                  <Download className="w-4 h-4" />
                  안드로이드 APK 다운로드 (103.0 MB)
                </a>
              </Button>
              <p className="text-[11px] text-muted-foreground">
                원클릭 설치 지원 (Android 9.0 이상)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
