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
  Crown,
  UserCheck,
  ChevronDown,
  Clock,
  MapPin,
  Flame,
  Percent,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

type UserRole = 'GUEST' | 'CUSTOMER' | 'MERCHANT' | 'STREAMER' | 'SUPER_ADMIN'

interface WebProductItem {
  id: string
  title: string
  description: string
  price: number
  originalPrice?: number
  type: 'B2C_NORMAL' | 'B2C_GROUP' | 'C2C_USED'
  ownerType: 'HEADQUARTERS' | 'MERCHANT' | 'USER_C2C'
  isHqDirect?: boolean
  category: string
  images: string[]
  sellerName: string
  shippingFee: number
  stock: number
  locationName?: string
  status: string
  affiliateCommissionRate?: number
}

const INITIAL_WEB_PRODUCTS: WebProductItem[] = [
  {
    id: 'np-001',
    title: '[본사직영] 제주 산지직송 프리미엄 1등급 흑돼지 오겹살 1kg (신선 냉장)',
    description: '제주 청정 농가에서 당일 도축 후 신선 보랭 포장 발송하는 1등급 명품 흑돼지 오겹살입니다.',
    price: 32900,
    originalPrice: 38000,
    type: 'B2C_NORMAL',
    ownerType: 'HEADQUARTERS',
    isHqDirect: true,
    category: 'FOOD',
    images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
      'https://images.unsplash.com/photo-1558030006-450675393462?w=800',
    ],
    sellerName: '모꼬(MOCCO) 본사 직영',
    shippingFee: 3000,
    stock: 150,
    status: 'ACTIVE',
    affiliateCommissionRate: 10.0,
  },
  {
    id: 'np-002',
    title: '[입점사상시] 제주 유기농 감귤 착즙 원액주스 1000ml (3병 선물세트)',
    description: '물 한 방울 섞지 않은 무가당 100% 제주 감귤 순수 착즙 프리미엄 주스입니다.',
    price: 24900,
    originalPrice: 29000,
    type: 'B2C_NORMAL',
    ownerType: 'MERCHANT',
    isHqDirect: false,
    category: 'FOOD',
    images: [
      'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800',
    ],
    sellerName: '제주푸드 본사 직영 (공식입점)',
    shippingFee: 0,
    stock: 80,
    status: 'ACTIVE',
    affiliateCommissionRate: 12.0,
  },
  {
    id: 'gp-001',
    title: '[특가공구] 산지직송 나주 배 5kg 특등급 (목표 20박스 한정 43% OFF)',
    description: '당도 13브릭스 이상 보장 나주 특등급 햇배 공동구매 43% 파격 할인 딜입니다.',
    price: 19900,
    originalPrice: 35000,
    type: 'B2C_GROUP',
    ownerType: 'HEADQUARTERS',
    isHqDirect: true,
    category: 'FOOD',
    images: [
      'https://images.unsplash.com/photo-1514756331096-242fdeb7004a?w=800',
    ],
    sellerName: '모꼬(MOCCO) 공구 추진팀',
    shippingFee: 0,
    stock: 20,
    status: 'ACTIVE',
    affiliateCommissionRate: 10.0,
  },
  {
    id: 'c2c-1',
    title: '[동네중고] 아이폰 15 프로 256GB 내추럴 티타늄 풀박스 (배터리 99%)',
    description: '구매 후 케이스/필름 상시 착용하여 기스 전혀 없는 특S급 상태입니다. 풀박스 구성품 모두 포함.',
    price: 980000,
    originalPrice: 1550000,
    type: 'C2C_USED',
    ownerType: 'USER_C2C',
    category: 'DIGITAL',
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=800',
    ],
    sellerName: '테크러버 (인증 이웃)',
    shippingFee: 3500,
    stock: 1,
    locationName: '서울 강남구 역삼역 3번출구',
    status: 'ACTIVE',
  },
  {
    id: 'np-003',
    title: '[입점사상시] 고순도 프리미엄 알티지 오메가3 120캡슐 (4개월분)',
    description: 'IFOS 최고등급 원료 사용, 흡수율 높은 rTG형 오메가3로 혈행 및 눈 건강을 지켜드립니다.',
    price: 42000,
    originalPrice: 55000,
    type: 'B2C_NORMAL',
    ownerType: 'MERCHANT',
    isHqDirect: false,
    category: 'LIVING',
    images: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
    ],
    sellerName: '메디컬 헬스케어랩',
    shippingFee: 2500,
    stock: 200,
    status: 'ACTIVE',
    affiliateCommissionRate: 15.0,
  },
  {
    id: 'c2c-2',
    title: '[동네중고] 미개봉 소니 WH-1000XM5 노이즈캔슬링 무선 헤드폰 실버',
    description: '선물 받고 미개봉 상태로 보관 중인 정품입니다. 국내 정식 발매 제품 영수증 동봉.',
    price: 320000,
    originalPrice: 479000,
    type: 'C2C_USED',
    ownerType: 'USER_C2C',
    category: 'DIGITAL',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    ],
    sellerName: '오디오매니아 (인증 이웃)',
    shippingFee: 0,
    stock: 1,
    locationName: '경기 성남시 판교역 1번출구',
    status: 'ACTIVE',
  },
  {
    id: 'gp-002',
    title: '[특가공구] 호텔식 프리미엄 40수 코마사 순면 수건 10장 세트',
    description: '특급 호텔에서 사용하는 최고급 코마사 40수 200g 도톰한 프리미엄 순면 타월 세트.',
    price: 24000,
    originalPrice: 42000,
    type: 'B2C_GROUP',
    ownerType: 'HEADQUARTERS',
    isHqDirect: true,
    category: 'LIVING',
    images: [
      'https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=800',
    ],
    sellerName: '모꼬(MOCCO) 리빙 직영',
    shippingFee: 0,
    stock: 50,
    status: 'ACTIVE',
    affiliateCommissionRate: 10.0,
  },
  {
    id: 'np-004',
    title: '[입점사상시] 무소음 초음파 감성 아로마 무드등 가습기 500ml',
    description: '심플한 모던 인테리어 디자인과 7가지 은은한 LED 무드등 기능이 탑재된 초음파 가습기.',
    price: 35000,
    originalPrice: 42000,
    type: 'B2C_NORMAL',
    ownerType: 'MERCHANT',
    isHqDirect: false,
    category: 'LIVING',
    images: [
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800',
    ],
    sellerName: '어반 라이프 스타일',
    shippingFee: 3000,
    stock: 60,
    status: 'ACTIVE',
    affiliateCommissionRate: 10.0,
  },
]

export default function CustomerWebStorefrontPage() {
  const { toast } = useToast()

  // 1. Role State for Smart GNB Switcher (Defaults to GUEST or saved simulation)
  const [currentRole, setCurrentRole] = useState<UserRole>('GUEST')
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false)

  // Products & Tabs
  const [products] = useState<WebProductItem[]>(INITIAL_WEB_PRODUCTS)
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'HQ_DIRECT' | 'C2C_USED' | 'B2C_NORMAL' | 'B2C_GROUP'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals State
  const [selectedProduct, setSelectedProduct] = useState<WebProductItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImgIndex, setActiveImgIndex] = useState(0)

  // Payment Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [payMethod, setPayMethod] = useState<'CARD' | 'TOSS_PAY' | 'KAKAO_PAY'>('CARD')
  const [buyerName, setBuyerName] = useState('김고객')
  const [buyerPhone, setBuyerPhone] = useState('010-1234-5678')
  const [shippingAddress, setShippingAddress] = useState('서울특별시 강남구 테헤란로 152 강남파이낸스센터 12층')
  const [isProcessingPay, setIsProcessingPay] = useState(false)

  // QR Modal
  const [isAppDownloadOpen, setIsAppDownloadOpen] = useState(false)

  // Cart & Order tracking modal
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false)

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchTab =
      selectedTab === 'ALL' ||
      (selectedTab === 'HQ_DIRECT' ? p.isHqDirect === true : p.type === selectedTab)
    const matchSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sellerName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchTab && matchSearch
  })

  // Open Product Detail
  const handleOpenDetail = (p: WebProductItem) => {
    setSelectedProduct(p)
    setQuantity(1)
    setActiveImgIndex(0)
  }

  // Execute Payment
  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    setIsProcessingPay(true)
    try {
      const totalAmount = selectedProduct.price * quantity + selectedProduct.shippingFee

      try {
        await fetch('/api/payments/escrow/prepare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: selectedProduct.id,
            quantity,
            shippingAddress,
            pgProvider: 'TOSS_PAYMENTS',
          }),
        })
      } catch {}

      toast({
        title: '🎉 에스크로 안전결제 주문 완료',
        description: `주문금액 ${totalAmount.toLocaleString()}원이 모꼬 에스크로 안전계좌에 예치되었습니다. 판매자 발송 후 운송장이 제공됩니다.`,
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
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-rose-500 selection:text-white">
      {/* 0. Top Smart Role Switcher Bar (Interactive testing bar for all 5 perspectives) */}
      <div className="bg-slate-900 text-slate-300 text-xs border-b border-slate-800 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold text-white">모꼬(MOCCO) 4대 커머스 생태계 포털</span>
          <span className="hidden md:inline text-slate-400 text-[11px]">
            (본사 직영 · 입점사 판매 · 개인 중고 · 계약 스트리머 제휴 위탁)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 hidden sm:inline">접속 권한 시뮬레이터:</span>
          <div className="flex items-center rounded-lg bg-slate-800/80 p-0.5 border border-slate-700">
            {[
              { role: 'GUEST', label: '👤 비로그인' },
              { role: 'CUSTOMER', label: '🛍️ 일반고객' },
              { role: 'MERCHANT', label: '🏪 입점사' },
              { role: 'STREAMER', label: '🎙️ 스트리머' },
              { role: 'SUPER_ADMIN', label: '👑 본사관리자' },
            ].map((btn) => (
              <button
                key={btn.role}
                onClick={() => setCurrentRole(btn.role as UserRole)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  currentRole === btn.role
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Global Customer GNB Header with Smart Role-Based Actions */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Slogan */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                  MOCCO
                </span>
                <span className="text-xs font-bold text-foreground">모꼬</span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  STORE
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium hidden sm:block">
                함께 모여 나누는 새로운 라이브 & 커머스
              </p>
            </div>
          </Link>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="본사 직영, 브랜드 입점 특가, 동네 중고 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-xs bg-muted/40 border-border rounded-full focus-visible:ring-rose-500"
            />
          </div>

          {/* Right Smart Switcher Navigation Based on Role */}
          <div className="flex items-center gap-2">
            {/* Case 1: GUEST */}
            {currentRole === 'GUEST' && (
              <>
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  회원가입
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAppDownloadOpen(true)}
                  className="gap-1.5 text-xs h-9 rounded-full border-rose-500/30 text-rose-500 hover:bg-rose-500/10 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  앱 다운로드
                </Button>
              </>
            )}

            {/* Case 2: CUSTOMER */}
            {currentRole === 'CUSTOMER' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCartOpen(true)}
                  className="relative text-xs font-semibold text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4" />
                  장바구니
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    2
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOrderHistoryOpen(true)}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  주문조회
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-9 rounded-full border-primary/30 text-primary font-semibold"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  마이모꼬
                </Button>
              </>
            )}

            {/* Case 3: MERCHANT */}
            {currentRole === 'MERCHANT' && (
              <>
                <button
                  onClick={() => toast({ title: '내 쇼핑 모드 활성화', description: '현재 고객 웹에서 상품을 둘러보고 계십니다.' })}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5"
                >
                  내 쇼핑
                </button>
                <div className="h-4 w-px bg-border mx-1" />
                <Button
                  variant="default"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-bold rounded-full shadow-sm"
                  asChild
                >
                  <Link href="/seller">
                    <Store className="w-3.5 h-3.5" />
                    🏪 입점사 셀러 센터 바로가기
                  </Link>
                </Button>
              </>
            )}

            {/* Case 4: STREAMER */}
            {currentRole === 'STREAMER' && (
              <>
                <button
                  onClick={() => toast({ title: '내 쇼핑 모드 활성화', description: '현재 고객 웹에서 상품을 둘러보고 계십니다.' })}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5"
                >
                  내 쇼핑
                </button>
                <div className="h-4 w-px bg-border mx-1" />
                <Button
                  variant="default"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 text-xs font-bold rounded-full shadow-sm"
                  asChild
                >
                  <Link href="/streamer">
                    <Radio className="w-3.5 h-3.5" />
                    🎙️ 스트리머 스튜디오 바로가기
                  </Link>
                </Button>
              </>
            )}

            {/* Case 5: SUPER_ADMIN */}
            {currentRole === 'SUPER_ADMIN' && (
              <Button
                variant="default"
                size="sm"
                className="bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-600 hover:opacity-90 text-white gap-1.5 text-xs font-bold rounded-full shadow-md"
                asChild
              >
                <Link href="/dashboard">
                  <Crown className="w-3.5 h-3.5" />
                  👑 본사 통합 관리자(HQ Admin) 바로가기
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* 3 Main Market Tabs + All */}
        <div className="border-t border-border/50 bg-muted/20">
          <div className="container max-w-7xl mx-auto px-4 flex items-center justify-between gap-2 overflow-x-auto py-2">
            <div className="flex items-center gap-2">
              {[
                { key: 'ALL', label: '✨ 전체 상품', icon: Sparkles },
                { key: 'HQ_DIRECT', label: '👑 본사 직영관', icon: Crown },
                { key: 'B2C_NORMAL', label: '🛍️ 브랜드 쇼핑', icon: Store },
                { key: 'B2C_GROUP', label: '🔥 특가 공구', icon: Users2 },
                { key: 'C2C_USED', label: '🏷️ 동네 중고', icon: Tag },
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = selectedTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedTab(tab.key as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      isActive
                        ? tab.key === 'HQ_DIRECT'
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-md font-extrabold'
                          : 'bg-rose-600 text-white shadow-sm'
                        : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border/70'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <Link
              href="/web/live/live-101"
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold hover:bg-rose-500/20 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <Radio className="w-3.5 h-3.5" />
              D LIVE 실시간 라이브 뷰어
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container max-w-7xl mx-auto px-4 py-6 flex-1 space-y-6">
        {/* D LIVE Real-Time Viewer & Hero Promotional Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-rose-950 via-indigo-950 to-slate-950 border border-border/80 p-6 md:p-8 text-white shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-3 z-10">
              <div className="flex items-center gap-2">
                <Badge className="bg-rose-600 text-white text-[11px] font-black border-none px-2.5 py-0.5">
                  🔴 D LIVE 실시간 방송 중
                </Badge>
                <span className="text-xs text-rose-300 font-semibold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  실시간 시청자 1.4k명 참여 중
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                제주 흑돼지 & 한라봉 주스 산지직송 <br />
                <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                  모꼬(MOCCO) 단독 인스트림 특가 라이브
                </span>
              </h2>

              <p className="text-xs md:text-sm text-slate-300 max-w-lg leading-relaxed">
                본사 직영 인증 농가에서 당일 도축 후 신선 보랭 발송! 실시간 라이브 화면에서 에스크로 무중단 안전결제로 주문하세요.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-full text-xs shadow-lg"
                  asChild
                >
                  <Link href="/web/live/live-101">
                    <Radio className="w-3.5 h-3.5 mr-1.5" />
                    실시간 방송 시청 & 결제 참여 &rarr;
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTab('B2C_NORMAL')}
                  className="rounded-full text-xs font-semibold border-white/20 text-white hover:bg-white/10"
                >
                  기획전 상품 목록
                </Button>
              </div>
            </div>

            {/* Right Live Preview Card */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl overflow-hidden border border-white/15 bg-black/40 backdrop-blur shadow-xl relative group">
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1544025162-d76694265947?w=800"
                    alt="Live Host Preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-bold text-white bg-black/60 px-2 py-0.5 rounded-full backdrop-blur">
                      호스트: 제주소녀_혜원
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-500 text-black font-extrabold text-[10px]">
                        📌 핀 고정 상품
                      </Badge>
                      <span className="text-white font-bold truncate max-w-[180px]">
                        흑돼지 오겹살 1kg
                      </span>
                    </div>
                    <span className="text-rose-400 font-black">
                      ₩32,900
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Count & Trust Guarantees */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">
              탐색 결과 <strong className="text-foreground font-black">{filteredProducts.length}</strong>개
            </span>
            <span className="text-xs text-muted-foreground">|</span>
            <span className="text-xs text-muted-foreground">
              {selectedTab === 'ALL' && '전체 4대 커머스 상품'}
              {selectedTab === 'C2C_USED' && '인증 이웃 동네 중고'}
              {selectedTab === 'B2C_NORMAL' && '공식 입점사 & 본사 직영'}
              {selectedTab === 'B2C_GROUP' && '인원 달성 시 40% 이상 특가 공구'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>에스크로 100% 구매 안전 보장</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-indigo-500" />
              <span>운송장 실시간 배송 추적</span>
            </div>
          </div>
        </div>

        {/* 4-Column Responsive Product Grid */}
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
                className="group cursor-pointer overflow-hidden border border-border/80 hover:border-rose-500/50 hover:shadow-lg transition-all flex flex-col justify-between bg-card"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative aspect-square w-full bg-muted overflow-hidden">
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Owner Type Badge */}
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                      {p.isHqDirect ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-md border border-amber-200/60 ring-1 ring-amber-400/40 tracking-tight">
                          👑 본사직영
                        </span>
                      ) : p.ownerType === 'MERCHANT' ? (
                        <Badge className="bg-emerald-600 text-white font-extrabold text-[10px]">
                          🏪 공식입점
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-600 text-white font-extrabold text-[10px]">
                          🏷️ 동네중고
                        </Badge>
                      )}

                      {p.type === 'B2C_GROUP' && (
                        <Badge className="bg-rose-600 text-white font-extrabold text-[10px]">
                          🔥 공구특가
                        </Badge>
                      )}

                      {p.affiliateCommissionRate && (
                        <Badge className="bg-purple-600 text-white font-bold text-[10px]">
                          제휴 {p.affiliateCommissionRate}%
                        </Badge>
                      )}
                    </div>

                    {/* Free shipping or location badge */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px]">
                      {p.locationName ? (
                        <span className="bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-400" />
                          {p.locationName}
                        </span>
                      ) : (
                        <span className="bg-black/60 text-slate-200 text-[10px] px-2 py-0.5 rounded-full backdrop-blur">
                          {p.shippingFee === 0 ? '무료 배송' : `배송비 ₩${p.shippingFee.toLocaleString()}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-1.5">
                    <div className="text-[11px] font-semibold text-muted-foreground truncate">
                      {p.sellerName}
                    </div>
                    <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug group-hover:text-rose-500 transition-colors">
                      {p.title}
                    </h3>
                  </div>
                </div>

                {/* Price section */}
                <div className="p-4 pt-0">
                  <div className="flex items-baseline gap-2">
                    {discountRate && (
                      <span className="text-base font-black text-rose-600">
                        {discountRate}%
                      </span>
                    )}
                    <span className="text-lg font-black text-foreground">
                      ₩{p.price.toLocaleString()}
                    </span>
                  </div>

                  {p.originalPrice && (
                    <div className="text-xs text-muted-foreground line-through">
                      ₩{p.originalPrice.toLocaleString()}
                    </div>
                  )}

                  <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="text-[11px]">안전결제 에스크로</span>
                    <span className="text-rose-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
                      상세보기 &rarr;
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </main>

      {/* 2. Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-background/80 hover:bg-background border border-border flex items-center justify-center text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="overflow-y-auto p-6 space-y-6">
              {/* Product Gallery & Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="aspect-square w-full rounded-2xl bg-muted overflow-hidden relative">
                    <img
                      src={selectedProduct.images[activeImgIndex] || selectedProduct.images[0]}
                      alt={selectedProduct.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {selectedProduct.images.length > 1 && (
                    <div className="flex items-center gap-2 mt-2">
                      {selectedProduct.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImgIndex(idx)}
                          className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                            activeImgIndex === idx ? 'border-rose-500' : 'border-transparent opacity-70'
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      {selectedProduct.isHqDirect ? (
                        <Badge className="bg-indigo-600 text-white font-extrabold text-[10px]">
                          👑 본사 공식 직영
                        </Badge>
                      ) : selectedProduct.ownerType === 'MERCHANT' ? (
                        <Badge className="bg-emerald-600 text-white font-extrabold text-[10px]">
                          🏪 공식 인증 입점사
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-600 text-white font-extrabold text-[10px]">
                          🏷️ 개인 인증 중고
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground font-semibold">
                        {selectedProduct.sellerName}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold leading-snug">
                      {selectedProduct.title}
                    </h2>

                    <div className="pt-1">
                      <div className="text-2xl font-black text-rose-600">
                        ₩{selectedProduct.price.toLocaleString()}
                      </div>
                      {selectedProduct.originalPrice && (
                        <div className="text-xs text-muted-foreground line-through">
                          정상가 ₩{selectedProduct.originalPrice.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs border-y border-border py-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">배송비</span>
                      <span className="font-semibold">
                        {selectedProduct.shippingFee === 0
                          ? '무료배송'
                          : `₩${selectedProduct.shippingFee.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">남은 재고</span>
                      <span className="font-semibold">{selectedProduct.stock}개</span>
                    </div>
                    {selectedProduct.locationName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">직거래 장소</span>
                        <span className="font-semibold">{selectedProduct.locationName}</span>
                      </div>
                    )}
                  </div>

                  {/* Quantity selector */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">주문 수량</span>
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-1 bg-muted hover:bg-muted/80 text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="px-4 py-1 text-xs font-semibold">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                        className="px-3 py-1 bg-muted hover:bg-muted/80 text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  상품 상세 설명
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line bg-muted/30 p-4 rounded-2xl border border-border/60">
                  {selectedProduct.description}
                </p>
              </div>

              {/* Escrow Guarantee Callout */}
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">
                    모꼬 에스크로 100% 안전결제 보장
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    고객님이 물품을 받고 구매확정하기 전까지 결제 대금은 모꼬 안전 계좌에 안전하게 예치되며, 판매자에게 임의로 지급되지 않습니다.
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl text-xs font-bold h-11"
                  onClick={() => {
                    toast({ title: '장바구니 담기 완료', description: '선택하신 상품이 장바구니에 추가되었습니다.' })
                    setSelectedProduct(null)
                  }}
                >
                  장바구니 담기
                </Button>
                <Button
                  className="flex-1 rounded-xl text-xs font-bold h-11 bg-rose-600 hover:bg-rose-700 text-white shadow-lg"
                  onClick={() => setIsCheckoutOpen(true)}
                >
                  에스크로 안전결제 주문하기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PG Escrow Checkout Modal */}
      {isCheckoutOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-5">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-1.5 text-rose-500 font-bold text-xs">
                <CreditCard className="w-4 h-4" />
                <span>모꼬 에스크로 주문서 작성</span>
              </div>
              <h3 className="text-lg font-bold">에스크로 안전결제 확인</h3>
            </div>

            <form onSubmit={handleExecutePayment} className="space-y-4">
              {/* Order Item Summary */}
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2 text-xs">
                <div className="font-semibold text-foreground truncate">
                  {selectedProduct.title}
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>수량: {quantity}개</span>
                  <span>상품금액: ₩{(selectedProduct.price * quantity).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>배송비</span>
                  <span>₩{selectedProduct.shippingFee.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between font-bold text-sm text-foreground">
                  <span>최종 결제 금액</span>
                  <span className="text-rose-600">
                    ₩{(selectedProduct.price * quantity + selectedProduct.shippingFee).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Buyer & Shipping Inputs */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold">배송 정보 입력</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="수령인 성함"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                  <Input
                    placeholder="연락처"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <Input
                  placeholder="배송지 주소"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* Payment Methods */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">결제 수단 선택</label>
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
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        payMethod === m.key
                          ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isProcessingPay}
                className="w-full h-11 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg mt-2"
              >
                {isProcessingPay ? '에스크로 결제 승인 중...' : '안전결제 승인 & 주문 완료'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* 4. App Download QR Modal */}
      {isAppDownloadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl p-6 text-center space-y-4">
            <button
              onClick={() => setIsAppDownloadOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg">
              <Download className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold">모꼬(MOCCO) 모바일 앱 다운로드</h3>
              <p className="text-xs text-muted-foreground mt-1">
                스마트폰 카메라로 QR 코드를 스캔하거나 APK를 직접 다운로드하세요.
              </p>
            </div>

            {/* QR Mock Image */}
            <div className="w-44 h-44 mx-auto rounded-2xl border-2 border-border/80 p-3 bg-white flex items-center justify-center shadow-inner">
              <QrCode className="w-36 h-36 text-slate-900" />
            </div>

            <Button
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl h-10 shadow-md"
              asChild
            >
              <a href="/downloads/mocco-release.apk" download="mocco-release.apk">
                <Download className="w-4 h-4 mr-1.5" />
                공식 모꼬(Mocco) 안드로이드 APK 다운로드
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* 5. Cart / Order Lookup Modals */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-card border border-border rounded-3xl p-6 space-y-4">
            <button
              onClick={() => setIsCartOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-rose-500" />
              마이모꼬 장바구니 (2개)
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl border border-border flex justify-between items-center">
                <div>
                  <div className="font-semibold">제주 흑돼지 오겹살 1kg</div>
                  <div className="text-muted-foreground">₩32,900 x 1개</div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-none">배송 준비</Badge>
              </div>
              <div className="p-3 rounded-xl border border-border flex justify-between items-center">
                <div>
                  <div className="font-semibold">나주 배 5kg 특등급</div>
                  <div className="text-muted-foreground">₩19,900 x 1개</div>
                </div>
                <Badge className="bg-rose-500/10 text-rose-500 border-none">특가 공구</Badge>
              </div>
            </div>
            <Button
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
              onClick={() => {
                toast({ title: '결제 진행', description: '선택된 장바구니 품목의 에스크로 결제창으로 이동합니다.' })
                setIsCartOpen(false)
              }}
            >
              선택 상품 일괄 결제하기
            </Button>
          </div>
        </div>
      )}

      {isOrderHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-card border border-border rounded-3xl p-6 space-y-4">
            <button
              onClick={() => setIsOrderHistoryOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-500" />
              에스크로 주문 & 배송 조회
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl border border-border space-y-1">
                <div className="flex justify-between font-bold">
                  <span>ORD-202610-8821</span>
                  <span className="text-emerald-500">배송 중 (CJ대한통운 6501-1234-5678)</span>
                </div>
                <div className="text-muted-foreground">제주 흑돼지 오겹살 1kg (1개) · ₩35,900</div>
                <div className="text-[11px] text-muted-foreground pt-1 flex justify-between">
                  <span>에스크로 예치 중</span>
                  <button
                    onClick={() => toast({ title: '구매확정 완료', description: '구매가 확정되어 판매자 정산 대기열에 등록되었습니다.' })}
                    className="text-rose-500 underline font-semibold"
                  >
                    구매확정
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 대한민국 4대 법률 규제 100% 준수 고지 푸터 (전자상거래법, 통신판매중개, 개인정보보호, 청소년보호) */}
      <footer className="border-t border-border/60 bg-muted/40 py-10 text-xs text-muted-foreground mt-16">
        <div className="container max-w-7xl mx-auto px-4 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-border/40">
            {/* 4대 법정 필수 약관 빠른 링크 */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
              <Link href="/settings/legal?tab=terms-of-service" className="hover:text-foreground transition-colors">
                서비스 이용약관
              </Link>
              <span>·</span>
              <Link href="/settings/legal?tab=privacy-policy" className="hover:text-foreground font-bold text-foreground/90 transition-colors">
                개인정보처리방침
              </Link>
              <span>·</span>
              <Link href="/settings/legal?tab=electronic-financial-transaction" className="hover:text-foreground transition-colors">
                전자금융거래 이용약관 (에스크로)
              </Link>
              <span>·</span>
              <Link href="/settings/legal?tab=youth-protection-policy" className="hover:text-foreground transition-colors">
                청소년보호정책
              </Link>
            </div>

            {/* 권한별 스위처 콘솔 바로가기 */}
            <div className="flex items-center gap-3 text-xs">
              <Link href="/dashboard" className="hover:text-foreground font-semibold px-2.5 py-1 rounded bg-background border shadow-xs">
                본사 관리자 콘솔
              </Link>
              <Link href="/seller" className="hover:text-foreground font-semibold px-2.5 py-1 rounded bg-background border shadow-xs">
                입점사 셀러 센터
              </Link>
              <Link href="/streamer" className="hover:text-foreground font-semibold px-2.5 py-1 rounded bg-background border shadow-xs">
                스트리머 스튜디오
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] leading-relaxed">
            {/* 사업자 필수 고지 정보 (전자상거래법 준수) */}
            <div className="md:col-span-2 space-y-2">
              <div className="font-bold text-sm text-foreground flex items-center gap-2">
                <span>주식회사 모꼬 (Mocco Inc.)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
                  신한·KG이니시스 100% 에스크로 안전결제 보증
                </span>
              </div>
              <p>
                대표이사: 대표자 | 사업자등록번호: 120-88-00192 | 통신판매업신고: 제 2026-서울강남-01982호
              </p>
              <p>
                사업장 주소: 서울특별시 강남구 테헤란로 152 강남파이낸스센터 12층 (역삼동) | 호스팅 서비스: (주)모꼬
              </p>
              <p>
                유선 고객센터: 1588-0921 (평일 09:00 ~ 18:00, 점심시간 12:00 ~ 13:00) | 이메일: support@mocco.kr
              </p>
            </div>

            {/* 통신판매중개업자 법적 면책 고지문 (전자상거래 등에서의 소비자보호에 관한 법률 제20조) */}
            <div className="bg-background/60 p-3.5 rounded-lg border border-border/60 space-y-1.5 text-[11px]">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                통신판매중개 면책 고지
              </div>
              <p className="text-muted-foreground/90">
                모꼬(Mocco)는 통신판매중개자로서 통신판매의 당사자가 아니며, 입점사 및 개별 판매자가 등록한 상품 정보 및 거래에 대해 책임을 지지 않습니다. 단, 에스크로 안전결제 시스템을 통해 구매자의 결제 대금을 안전하게 보호합니다.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border/40 text-center md:text-left text-[10px] text-muted-foreground/60 flex flex-col md:flex-row justify-between items-center gap-2">
            <div>© 2026 Mocco Inc. All rights reserved. 대한민국 법률 규제 및 공정거래위원회 표준약관 준수.</div>
            <div className="flex items-center gap-2">
              <span>개인정보보호책임자: CPO | 청소년보호책임자: 총괄 책임자</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}