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
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

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
  const [activeTab, setActiveTab] = useState<'MY_PICKS' | 'EXPLORE'>('MY_PICKS')
  const [searchQuery, setSearchQuery] = useState('')
  const [ownerFilter, setOwnerFilter] = useState<'ALL' | 'HEADQUARTERS' | 'MERCHANT'>('ALL')
  const [availableProducts, setAvailableProducts] = useState<AffiliateProductItem[]>(INITIAL_AFFILIATE_PRODUCTS)
  const [myPicks, setMyPicks] = useState<AffiliateProductItem[]>([INITIAL_AFFILIATE_PRODUCTS[0], INITIAL_AFFILIATE_PRODUCTS[1]])
  const [isLoading, setIsLoading] = useState(false)

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
        setMyPicks([product, ...myPicks])
      }
      toast({
        title: '🎉 제휴 상품 바구니 담기 완료',
        description: `'${product.name}' 상품이 내 방송 판매 목록에 등록되었습니다. D LIVE 방송 시 핀 목록에 우선 노출됩니다.`,
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

      setMyPicks(myPicks.filter((p) => p.id !== productId))
      toast({
        title: '상품 제거 완료',
        description: '내 방송 판매 바구니에서 상품이 제거되었습니다.',
      })
    } catch {}
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur px-6 py-4">
        <div className="container max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-rose-500 to-indigo-500 bg-clip-text text-transparent">
                  모꼬(MOCCO) 스트리머 스튜디오
                </h1>
                <Badge className="bg-rose-500/15 text-rose-500 border-rose-500/30 text-xs font-bold">
                  공식 계약 스트리머
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                제주소녀_혜원 (creator@dagaon.app) | D LIVE 라이브 커머스 제휴 위탁 판매 센터
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
                🛒 고객 웹 둘러보기
              </Link>
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 text-xs font-semibold shadow-md"
              asChild
            >
              <Link href="/web/live/live-101">
                <Radio className="w-4 h-4" />
                🔴 D LIVE 방송 시작 & 핀 연결
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
                <span>이번 달 제휴 커미션 정산 예정</span>
                <Coins className="w-4 h-4 text-amber-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-black text-rose-500">
                ₩458,000
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground">
                구매 확정 완료된 제휴 판매 주문 14건 기준
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
      </main>
    </div>
  )
}
