/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  AlertCircle,
  Building2,
  CheckCircle2,
  Share2,
  Heart,
  Store,
  Sparkles,
  ExternalLink,
  MessageCircle,
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  Lock,
  ThumbsUp,
  HelpCircle,
} from 'lucide-react'
import { useWebAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Sample product database for mock fallback & real match
const SAMPLE_MARKET_PRODUCTS: Record<string, any> = {
  'prod-001': {
    id: 'prod-001',
    name: '[제주산지직송] 1+등급 제주 흑돼지 오겹살 600g (냉장/당일도축)',
    category: '식품/신선',
    type: 'B2C_NORMAL',
    price: 28900,
    originalPrice: 38000,
    stock: 85,
    shippingFee: 3000,
    isFreeShipping: false,
    freeShippingThreshold: 50000,
    images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000',
      'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1000',
      'https://images.unsplash.com/photo-1558030006-450675393462?w=1000',
    ],
    description: `제주 청정 자연에서 자란 1+등급 무항생제 제주 흑돼지 오겹살입니다.
당일 새벽 도축 후 산소 신선포장(MAP)하여 직배송하므로 고기 본연의 풍미와 쫄깃한 식감을 그대로 느끼실 수 있습니다.

■ 상품 특장점
1. 100% 제주도 본사 직영 산지직송 (중간 유통 마진 제거)
2. HACCP 인증 시설에서 위생적으로 가공 및 안심 포장
3. 쫀득한 껍질과 고소한 육즙의 황금비율 오겹살
4. 보냉팩 및 친환경 에코 아이스박스 안심 배송`,
    merchantInfo: {
      businessName: '(주)제주푸드 본사 직영',
      representative: '김제주',
      businessNumber: '123-45-67890',
      onlineOrderNumber: '제2026-제주-0123호',
      address: '제주특별자치도 제주시 청풍로 45 (첨단과학기술단지)',
      contactPhone: '064-700-1234',
      customerServiceHours: '평일 09:30 ~ 18:00 (점심시간 12:30~13:30, 주말/공휴일 휴무)',
    },
    noticeInfo: {
      itemModelName: '1+등급 제주 흑돼지 오겹살 600g',
      certification: 'HACCP 위생안전인증 및 축산물이력제 등록 (이력번호 포장표기)',
      origin: '대한민국 (제주산 100%)',
      manufacturer: '(주)제주푸드 청정가공센터',
      expirationDate: '도축일로부터 냉장 7일, 냉동 6개월 (포장별도표기)',
      asContact: '064-700-1234 또는 모꼬 1:1 고객지원 안심톡',
    },
    shippingInfo: {
      courierName: '우체국택배 안심신선특송',
      deliveryDays: '오후 2시 이전 결제 완료 시 당일 출발 (익일 도착 보장)',
      returnFee: 4000,
      exchangeFee: 8000,
      returnAddress: '제주특별자치도 제주시 청풍로 45 제주푸드 물류센터',
      nonReturnableReasons: [
        '신선식품 특성상 단순 변심에 의한 반품/교환은 불가합니다.',
        '소비자의 수령 후 보관 부주의(상온 방치 등)로 변질된 경우',
        '상품 수령일로부터 24시간이 경과하여 파손/하자 접수가 된 경우 (수령 즉시 사진 촬영 필요)',
      ],
    },
    orderCount: 1420,
    rating: 4.9,
    reviewCount: 328,
  },
  'prod-002': {
    id: 'prod-002',
    name: '[공구특가] 소니 WH-1000XM5 프리미엄 무선 노이즈캔슬링 헤드폰',
    category: '디지털/가전',
    type: 'B2C_GROUP',
    price: 369000,
    originalPrice: 479000,
    stock: 24,
    shippingFee: 0,
    isFreeShipping: true,
    freeShippingThreshold: 0,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=1000',
    ],
    description: `소니 코리아 정품 WH-1000XM5 플래그십 무선 노이즈 캔슬링 헤드폰입니다.
모꼬 단독 특가 공동구매 프로모션으로 진행되며 소니 공식 A/S 1년 무상 보증이 적용됩니다.

■ 핵심 스펙
- 8개의 마이크와 Auto NC Optimizer로 구현한 세계 최고 수준의 노이즈 캔슬링
- 신개발 30mm 드라이버 유닛으로 왜곡 없는 고해상도 사운드
- 최대 30시간 연속 재생 & 고속 충전 (3분 충전 시 3시간 사용)
- 멀티포인트 연결로 스마트폰과 노트북 동시 연결 지원`,
    merchantInfo: {
      businessName: '(주)사운드코리아 공식수입원',
      representative: '박음향',
      businessNumber: '214-88-77665',
      onlineOrderNumber: '제2026-서울용산-0456호',
      address: '서울특별시 용산구 청파로 109 나진전자월드 5층',
      contactPhone: '1544-7788',
      customerServiceHours: '평일 10:00 ~ 17:00 (주말/공휴일 휴무)',
    },
    noticeInfo: {
      itemModelName: '소니 WH-1000XM5 (Black / Silver)',
      certification: 'KC 전파인증 필 (R-R-SNY-WH1000XM5)',
      origin: '말레이시아 / 중국 (소니 글로벌 생산기지)',
      manufacturer: 'Sony Corporation / (주)사운드코리아 수입',
      expirationDate: '해당사항 없음 (공식 보증기간 1년)',
      asContact: '소니코리아 고객지원센터 1588-0911',
    },
    shippingInfo: {
      courierName: 'CJ대한통운 프리미엄 택배',
      deliveryDays: '오후 3시 이전 주문 시 당일 발송',
      returnFee: 3000,
      exchangeFee: 6000,
      returnAddress: '서울특별시 용산구 청파로 109 사운드코리아 물류부',
      nonReturnableReasons: [
        '제품 포장 밀봉(씰)을 훼손하거나 개봉하여 재판매가 불가능한 경우',
        '소비자의 과실로 인하여 외관 파손 또는 부속품 분실이 발생한 경우',
        '수령 후 7일이 경과한 경우',
      ],
    },
    orderCount: 890,
    rating: 5.0,
    reviewCount: 194,
  },
  'used-001': {
    id: 'used-001',
    name: '[S급 풀박스] 애플 아이패드 프로 11인치 M2 128GB 스페이스그레이',
    category: '디지털/가전',
    type: 'C2C_USED',
    price: 850000,
    originalPrice: 1240000,
    stock: 1,
    shippingFee: 3500,
    isFreeShipping: false,
    images: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=1000',
      'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=1000',
    ],
    description: `작년 가을에 구매해서 영상 시청용으로만 가끔 실내에서 사용한 아이패드 프로 11인치 M2 모델입니다.
구매 직후 종이질감 필름과 케이스를 장착하여 본체에 기스나 찍힘 전혀 없는 S급 새상품 상태입니다.

- 배터리 성능 98% (사이클 42회)
- 정품 충전기 및 케이블 미사용 풀박스 보관 중
- 신지모루 마그네틱 케이스 함께 드립니다.

강남역 또는 역삼역 부근에서 직거래 가능하며, 모꼬 에스크로 안전결제 택배거래도 환영합니다!`,
    sellerNickname: '애플러버_민우',
    sellerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500',
    sellerLocation: '서울 강남구 역삼동 (동네인증 완료)',
    mannerTemp: 42.5,
    usedCondition: 'S',
    isLiveSellLinked: true,
    shippingInfo: {
      courierName: '우체국택배 안심포장',
      deliveryDays: '결제 완료 후 익일 오전 우체국 접수',
      returnFee: 5000,
      exchangeFee: 10000,
      returnAddress: '서울 강남구 역삼동',
      nonReturnableReasons: [
        '개인 간 C2C 중고거래 특성상 단순 변심에 의한 환불은 불가합니다.',
        '직거래 수령 후 또는 설명에 기재된 상태와 동일한 경우',
      ],
    },
    orderCount: 1,
    rating: 5.0,
    reviewCount: 14,
  },
}

export default function MarketProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { role, user, requireAuth, isAuthenticated } = useWebAuth()

  const productId = String(params?.id || 'prod-001')
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isLiked, setIsLiked] = useState(false)
  const [activeTab, setActiveTab] = useState<'DETAIL' | 'NOTICE' | 'SHIPPING' | 'MERCHANT' | 'REVIEW'>('DETAIL')

  useEffect(() => {
    // 1. Check local samples
    const found = SAMPLE_MARKET_PRODUCTS[productId]
    if (found) {
      setProduct(found)
      setLoading(false)
    } else {
      // Fallback default item
      setProduct({
        id: productId,
        name: `[모꼬 엄선] 마켓 프리미엄 상품 (${productId})`,
        category: '일반/생활',
        type: productId.startsWith('used') ? 'C2C_USED' : 'B2C_NORMAL',
        price: 49000,
        originalPrice: 65000,
        stock: 50,
        shippingFee: 3000,
        images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000'],
        description: '대한민국 전자상거래법 및 모꼬 안심 에스크로 100% 안전결제로 보호되는 공식 등록 상품입니다.',
        merchantInfo: {
          businessName: '(주)모꼬 파트너스 공식인증사',
          representative: '정진우',
          businessNumber: '123-86-12345',
          onlineOrderNumber: '제2026-서울강남-0123호',
          address: '서울시 강남구 테헤란로 152 강남파이낸스센터 12층',
          contactPhone: '1588-0000',
          customerServiceHours: '평일 09:30 ~ 18:00',
        },
        noticeInfo: {
          itemModelName: `모꼬 프리미엄 상품 (${productId})`,
          certification: 'KC안전인증 또는 식품위생법 안전검사 적합',
          origin: '대한민국 (국산 100%)',
          manufacturer: '모꼬 제휴 공식 제조라인',
          expirationDate: '제조일로부터 12개월 (포장별도표기)',
          asContact: '1588-0000 고객센터',
        },
        shippingInfo: {
          courierName: 'CJ대한통운 안심택배',
          deliveryDays: '오후 2시 이전 주문 시 당일 발송',
          returnFee: 3000,
          exchangeFee: 6000,
          returnAddress: '경기도 이천시 모꼬안심물류센터',
          nonReturnableReasons: [
            '소비자의 책임 있는 사유로 상품 등이 멸실 또는 훼손된 경우',
            '포장을 훼손하여 상품 가치가 현저히 상실된 경우',
          ],
        },
        orderCount: 120,
        rating: 4.8,
        reviewCount: 35,
      })
      setLoading(false)
    }
  }, [productId])

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">상품 상세 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    )
  }

  const isUsed = product.type === 'C2C_USED'
  const isGroup = product.type === 'B2C_GROUP'
  const discountRate =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0

  const totalPrice = product.price * quantity
  const shippingFee = product.isFreeShipping || (product.freeShippingThreshold && totalPrice >= product.freeShippingThreshold) ? 0 : (product.shippingFee || 3000)
  const grandTotal = totalPrice + shippingFee

  // 구매 버튼 클릭 (게스트는 즉시 로그인 유도)
  const handleBuyNow = () => {
    requireAuth(() => {
      toast({
        title: '🛡️ 토스페이먼츠 PG 에스크로 안전결제 주문 생성',
        description: `${product.name} (${quantity}개) 총 ${grandTotal.toLocaleString()}원이 에스크로 안전 금고에 예치되었습니다. 수령 후 [구매확정]을 누르면 판매자에게 정산됩니다.`,
      })
    })
  }

  // 장바구니 담기
  const handleAddToCart = () => {
    requireAuth(() => {
      toast({
        title: '🛒 장바구니에 담겼습니다!',
        description: `${product.name} ${quantity}개가 장바구니에 추가되었습니다.`,
      })
    })
  }

  // 판매자와 1:1 채팅하기 (중고/마켓 공통)
  const handleChatWithSeller = () => {
    requireAuth(() => {
      toast({
        title: '💬 판매자와의 1:1 안심 대화방 연결',
        description: `${product.sellerNickname || product.merchantInfo?.businessName || '판매자'}님과의 대화방이 열렸습니다.`,
      })
      router.push('/?tab=CHAT')
    })
  }

  // SNS 공유하기
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href)
      toast({
        title: '🔗 상품 링크가 복사되었습니다!',
        description: '카카오톡, 문자, SNS에 링크를 공유하여 상품을 소개해보세요.',
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24">
      
      {/* 1. 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  router.back()
                } else {
                  router.push(product.type === 'C2C_USED' ? '/?tab=MARKET&sub=C2C_USED' : '/?tab=MARKET')
                }
              }}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition"
              title="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link href="/" className="hover:text-indigo-600 font-semibold transition">
                모꼬 홈
              </Link>
              <span>/</span>
              <Link
                href={product.type === 'C2C_USED' ? '/?tab=MARKET&sub=C2C_USED' : '/?tab=MARKET'}
                className="hover:text-indigo-600 font-semibold transition"
              >
                모꼬 마켓
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-bold truncate max-w-[150px] sm:max-w-[280px]">
                {product.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition"
              title="공유하기"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <Link
              href={product.type === 'C2C_USED' ? '/?tab=MARKET&sub=C2C_USED' : '/?tab=MARKET'}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1"
            >
              <Store className="w-3.5 h-3.5" />
              <span>마켓 목록</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. 메인 컨테이너 (타사 표준 2컬럼 레이아웃: 좌측 갤러리/본문 + 우측 고정 구매 패널) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* 상단 2컬럼: 좌측 이미지 갤러리 + 우측 상품 핵심 정보 & 구매 액션 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          
          {/* 좌측: 대형 이미지 갤러리 (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            {/* 메인 대표 이미지 */}
            <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-slate-900 shadow-md border border-slate-200 group">
              <img
                src={product.images[activeImageIdx]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* 이미지 전환 버튼 */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : product.images.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/75 text-white transition backdrop-blur-sm"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveImageIdx((prev) => (prev < product.images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/75 text-white transition backdrop-blur-sm"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-bold backdrop-blur-sm">
                    {activeImageIdx + 1} / {product.images.length}
                  </div>
                </>
              )}

              {/* 에스크로 뱃지 */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/90 text-white text-xs font-bold shadow-lg backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>토스페이먼츠 PG 에스크로 100% 안전결제</span>
              </div>
            </div>

            {/* 썸네일 리스트 */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition shrink-0 ${
                      activeImageIdx === idx
                        ? 'border-indigo-600 shadow-md ring-2 ring-indigo-200'
                        : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`썸네일 ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 우측: 상품 타이틀, 가격, 배송, 구매 패널 (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm sticky top-20">
            
            {/* 판매자 및 카테고리 헤더 */}
            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                    isUsed
                      ? 'bg-amber-100 text-amber-800'
                      : isGroup
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {isUsed ? '🥕 C2C 중고마켓' : isGroup ? '🔥 특가 공동구매' : '🛒 본사직영 마켓'}
                </span>
                <span className="text-slate-400">·</span>
                <span className="font-semibold text-slate-600">{product.category}</span>
              </div>

              {/* 평점 / 리뷰 */}
              <div className="flex items-center gap-1 text-slate-700 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{product.rating || 5.0}</span>
                <span className="text-slate-400 font-normal">({product.reviewCount || 0})</span>
              </div>
            </div>

            {/* 상품 타이틀 */}
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {product.name}
              </h1>
              {isUsed && (
                <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{product.sellerLocation || '서울 강남구 역삼동'}</span>
                  <span>·</span>
                  <span className="text-emerald-600 font-bold">매너온도 {product.mannerTemp || 36.5}℃</span>
                </div>
              )}
            </div>

            {/* 가격 섹션 */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-baseline gap-2.5">
                {discountRate > 0 && (
                  <span className="text-2xl sm:text-3xl font-black text-rose-500">
                    {discountRate}%
                  </span>
                )}
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {product.price.toLocaleString()}원
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-slate-400 line-through">
                    {product.originalPrice.toLocaleString()}원
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>토스페이먼츠 PG 에스크로 결제로 구매확정 전까지 100% 안전 보관</span>
              </p>
            </div>

            {/* 배송 정보 요약 카드 */}
            <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">배송방법</span>
                <span className="font-bold text-slate-800">{product.shippingInfo?.courierName || 'CJ대한통운 / 우체국택배'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">배송비</span>
                <span className="font-bold text-slate-800">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-600 font-extrabold">무료배송</span>
                  ) : (
                    `${shippingFee.toLocaleString()}원`
                  )}
                </span>
              </div>
              {product.freeShippingThreshold && (
                <div className="text-[11px] text-slate-400 text-right">
                  ({product.freeShippingThreshold.toLocaleString()}원 이상 구매 시 무료배송)
                </div>
              )}
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500 font-medium">출고일정</span>
                <span className="font-semibold text-indigo-600">{product.shippingInfo?.deliveryDays || '당일 발송'}</span>
              </div>
            </div>

            {/* 수량 선택기 (C2C 중고는 수량 1개 고정) */}
            {!isUsed && (
              <div className="flex items-center justify-between py-2">
                <span className="text-xs font-bold text-slate-700">구매 수량</span>
                <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 transition font-black text-sm"
                  >
                    -
                  </button>
                  <span className="px-3 py-1.5 text-xs font-extrabold text-slate-900 min-w-[36px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((prev) => Math.min(product.stock || 99, prev + 1))}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 transition font-black text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* 총 결제 예정 금액 */}
            <div className="flex items-baseline justify-between pt-2">
              <span className="text-xs font-bold text-slate-600">총 결제예정금액</span>
              <span className="text-2xl font-black text-slate-900">
                {grandTotal.toLocaleString()}원
              </span>
            </div>

            {/* 구매 액션 버튼 그리드 */}
            <div className="space-y-2.5 pt-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`p-3 rounded-2xl border transition shrink-0 ${
                    isLiked
                      ? 'bg-rose-50 border-rose-300 text-rose-500'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                  title="관심상품 등록"
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>

                {isUsed ? (
                  <Button
                    onClick={handleChatWithSeller}
                    variant="outline"
                    className="flex-1 h-12 rounded-2xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-sm shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4 mr-1.5" />
                    판매자와 1:1 채팅
                  </Button>
                ) : (
                  <Button
                    onClick={handleAddToCart}
                    variant="outline"
                    className="flex-1 h-12 rounded-2xl border-slate-200 hover:bg-slate-50 font-bold text-sm text-slate-700 shadow-xs"
                  >
                    장바구니 담기
                  </Button>
                )}
              </div>

              {/* 메인 에스크로 즉시구매 버튼 */}
              <Button
                onClick={handleBuyNow}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-base shadow-md shadow-indigo-200 active:scale-98 transition flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
                <span>토스페이먼츠 에스크로 바로구매</span>
              </Button>
            </div>

            {/* 라이브 판매 연동 뱃지 */}
            {product.isLiveSellLinked && (
              <div className="p-3 bg-purple-50 border border-purple-200/80 rounded-2xl text-[11px] text-purple-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  이 상품은 판매자의 <strong>모바일 라이브 방송 시 핀 상품으로 연동</strong>되어 방송 중 실시간으로도 판매됩니다.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 하단 탭 영역 (타사 표준 5대 탭 네비게이션) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden mt-8">
          
          {/* 탭 헤더 */}
          <div className="flex border-b border-slate-200 bg-slate-50/70 overflow-x-auto text-xs sm:text-sm font-bold">
            <button
              onClick={() => setActiveTab('DETAIL')}
              className={`py-4 px-6 border-b-2 transition shrink-0 ${
                activeTab === 'DETAIL'
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              상품 상세 설명
            </button>
            <button
              onClick={() => setActiveTab('NOTICE')}
              className={`py-4 px-6 border-b-2 transition shrink-0 flex items-center gap-1.5 ${
                activeTab === 'NOTICE'
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>상품정보고시</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-700">공정위 규정</span>
            </button>
            <button
              onClick={() => setActiveTab('SHIPPING')}
              className={`py-4 px-6 border-b-2 transition shrink-0 ${
                activeTab === 'SHIPPING'
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              배송 / 교환 / 반품 안내
            </button>
            <button
              onClick={() => setActiveTab('MERCHANT')}
              className={`py-4 px-6 border-b-2 transition shrink-0 flex items-center gap-1.5 ${
                activeTab === 'MERCHANT'
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>판매자 정보 고시</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-100 text-indigo-700">전자상거래법</span>
            </button>
            <button
              onClick={() => setActiveTab('REVIEW')}
              className={`py-4 px-6 border-b-2 transition shrink-0 flex items-center gap-1.5 ${
                activeTab === 'REVIEW'
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>구매후기 & Q&A</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800">
                {product.reviewCount || 0}
              </span>
            </button>
          </div>

          {/* 탭 본문 내용 */}
          <div className="p-6 sm:p-10 text-sm">
            
            {/* 1) DETAIL: 상세 설명 본문 및 고화질 이미지 */}
            {activeTab === 'DETAIL' && (
              <div className="space-y-8 max-w-3xl mx-auto">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-line text-sm sm:text-base font-normal">
                  {product.description}
                </div>

                {/* 상세 본문 이미지 갤러리 */}
                <div className="space-y-4">
                  {product.images.map((img: string, idx: number) => (
                    <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                      <img src={img} alt={`상세 이미지 ${idx + 1}`} className="w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2) NOTICE: 대한민국 공정위 통신판매 상품정보제공고시 35대 표준 규격 표 */}
            {activeTab === 'NOTICE' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-2.5 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs text-indigo-900">
                  <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0" />
                  <span>
                    본 상품 정보는 <strong>「전자상거래 등에서의 상품 등의 정보제공에 관한 고시」(공정거래위원회 고시)</strong>에 따라 등록된 공식 필수 기재사항입니다.
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200 text-xs sm:text-sm">
                  <div className="grid grid-cols-3 sm:grid-cols-4 bg-slate-50/50">
                    <div className="p-3.5 bg-slate-100 text-slate-700 font-bold border-r border-slate-200">
                      품명 및 모델명
                    </div>
                    <div className="col-span-2 sm:col-span-3 p-3.5 text-slate-900 font-medium">
                      {product.noticeInfo?.itemModelName || product.name}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 bg-white">
                    <div className="p-3.5 bg-slate-100 text-slate-700 font-bold border-r border-slate-200">
                      인증 / 허가 사항
                    </div>
                    <div className="col-span-2 sm:col-span-3 p-3.5 text-slate-800">
                      {product.noticeInfo?.certification || 'KC안전인증 또는 식품위생법 안전검사 적합'}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 bg-slate-50/50">
                    <div className="p-3.5 bg-slate-100 text-slate-700 font-bold border-r border-slate-200">
                      제조국 (원산지)
                    </div>
                    <div className="col-span-2 sm:col-span-3 p-3.5 text-indigo-700 font-bold">
                      {product.noticeInfo?.origin || '대한민국 (국산 100%)'}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 bg-white">
                    <div className="p-3.5 bg-slate-100 text-slate-700 font-bold border-r border-slate-200">
                      제조자 / 수입자
                    </div>
                    <div className="col-span-2 sm:col-span-3 p-3.5 text-slate-800">
                      {product.noticeInfo?.manufacturer || product.merchantInfo?.businessName || '본사 공식 직영'}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 bg-slate-50/50">
                    <div className="p-3.5 bg-slate-100 text-slate-700 font-bold border-r border-slate-200">
                      소비기한 또는 유통기한
                    </div>
                    <div className="col-span-2 sm:col-span-3 p-3.5 text-slate-800">
                      {product.noticeInfo?.expirationDate || '제조일로부터 12개월 (포장별도표기)'}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 bg-white">
                    <div className="p-3.5 bg-slate-100 text-slate-700 font-bold border-r border-slate-200">
                      A/S 책임자 및 소비자상담 번호
                    </div>
                    <div className="col-span-2 sm:col-span-3 p-3.5 text-slate-900 font-bold">
                      {product.noticeInfo?.asContact || '1588-0000'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3) SHIPPING: 배송, 교환, 반품, 청약철회 기준 안내 (전자상거래법 제17조) */}
            {activeTab === 'SHIPPING' && (
              <div className="max-w-4xl mx-auto space-y-6 text-xs sm:text-sm">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-sm sm:text-base">
                      <Truck className="w-5 h-5" />
                      <span>배송 정보 안내</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-600 leading-relaxed">
                      <li>• 배송사: <strong>{product.shippingInfo?.courierName || 'CJ대한통운 / 우체국택배'}</strong></li>
                      <li>• 기본 배송비: {product.shippingFee === 0 ? '무료배송' : `${product.shippingFee?.toLocaleString()}원`}</li>
                      <li>• 출고 일정: {product.shippingInfo?.deliveryDays || '오후 2시 이전 결제 완료 시 당일 발송'}</li>
                      <li>• 도서산간/제주지역: 추가 배송비 3,000원 발생</li>
                    </ul>
                  </div>

                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm sm:text-base">
                      <RotateCcw className="w-5 h-5" />
                      <span>교환 / 반품 배송비 안내</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-600 leading-relaxed">
                      <li>• 반품 배송비: 편도 {(product.shippingInfo?.returnFee || 3000).toLocaleString()}원 (최초 무료배송 시 6,000원)</li>
                      <li>• 교환 배송비: 왕복 {(product.shippingInfo?.exchangeFee || 6000).toLocaleString()}원</li>
                      <li>• 반품 회수지: {product.shippingInfo?.returnAddress || '경기도 이천시 모꼬안심물류센터'}</li>
                    </ul>
                  </div>
                </div>

                {/* 청약철회 기준 (법적 필수 고시) */}
                <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">
                    교환 / 반품 및 청약철회 기준 안내 (전자상거래 등에서의 소비자보호에 관한 법률 준수)
                  </h4>
                  <ul className="space-y-1.5 text-slate-600 list-disc pl-5 leading-relaxed">
                    {(product.shippingInfo?.nonReturnableReasons || [
                      '소비자의 책임 있는 사유로 상품 등이 멸실 또는 훼손된 경우',
                      '소비자의 사용 또는 일부 소비로 상품의 가치가 현저히 감소한 경우',
                      '시간의 경과에 의하여 재판매가 곤란할 정도로 상품의 가치가 현저히 감소한 경우 (신선식품 등)',
                      '복제가 가능한 상품 등의 포장을 훼손한 경우',
                    ]).map((reason: string, idx: number) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 4) MERCHANT: 판매자(입점사) 사업자 정보 고시 (전자상거래법 제10조) */}
            {activeTab === 'MERCHANT' && (
              <div className="max-w-4xl mx-auto space-y-6">
                {isUsed ? (
                  /* C2C 중고 판매자 정보 */
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.sellerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500'}
                          alt={product.sellerNickname}
                          className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-xs"
                        />
                        <div>
                          <div className="font-extrabold text-base text-slate-900">{product.sellerNickname} (이웃 회원)</div>
                          <div className="text-xs text-slate-500">{product.sellerLocation || '모꼬 동네인증 완료'}</div>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold">
                        매너온도 {product.mannerTemp || 36.5}℃
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      * 본 상품은 개인 판매자가 등록한 중고거래 물품입니다. 모꼬 에스크로 안전결제를 통해 결제하시면 수령 후 구매확정 전까지 대금이 안전하게 보관됩니다.
                    </p>
                  </div>
                ) : (
                  /* B2C 공식 입점사 정보 (전자상거래법 제10조 필수 기재사항) */
                  <div className="p-6 sm:p-8 bg-slate-50 border border-slate-200 rounded-3xl space-y-5 text-xs sm:text-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-6 h-6 text-indigo-600" />
                        <div>
                          <h3 className="font-black text-base sm:text-lg text-slate-900">
                            {product.merchantInfo?.businessName || '(주)모꼬글로벌'}
                          </h3>
                          <span className="text-xs text-slate-500">모꼬 플랫폼 공식 승인 및 인증 입점 파트너사</span>
                        </div>
                      </div>
                      <Badge className="bg-emerald-600 text-white font-extrabold px-3 py-1">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" />
                        공식 인증 셀러
                      </Badge>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-y-3 gap-x-6 text-slate-700">
                      <div><strong className="text-slate-900">대표자:</strong> {product.merchantInfo?.representative || '정진우'}</div>
                      <div><strong className="text-slate-900">사업자등록번호:</strong> {product.merchantInfo?.businessNumber || '123-86-12345'}</div>
                      <div className="sm:col-span-2">
                        <strong className="text-slate-900">통신판매업신고번호:</strong> {product.merchantInfo?.onlineOrderNumber || '제 2026-서울강남-0123 호'}
                      </div>
                      <div className="sm:col-span-2">
                        <strong className="text-slate-900">사업장 소재지:</strong> {product.merchantInfo?.address || '서울특별시 강남구 테헤란로 152 강남파이낸스센터 12층'}
                      </div>
                      <div>
                        <strong className="text-slate-900">고객센터 문의전화:</strong>{' '}
                        <span className="text-indigo-600 font-bold">{product.merchantInfo?.contactPhone || '1588-0000'}</span>
                      </div>
                      <div><strong className="text-slate-900">운영시간:</strong> {product.merchantInfo?.customerServiceHours || '평일 09:30 ~ 18:00'}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5) REVIEW: 구매 후기 및 Q&A */}
            {activeTab === 'REVIEW' && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black text-slate-900">{product.rating || 4.9}</span>
                    <div>
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500 mt-0.5 block">전체 구매고객 99% 만족</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      requireAuth(() => {
                        toast({
                          title: '✍️ 후기 작성',
                          description: '에스크로 구매확정 완료 고객만 구매 후기를 작성하실 수 있습니다.',
                        })
                      })
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs"
                  >
                    구매 후기 작성
                  </Button>
                </div>

                {/* 샘플 리뷰 리스트 */}
                <div className="divide-y divide-slate-100 space-y-4">
                  <div className="pt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">모꼬단골_이웃 (구매자)</span>
                      <span className="text-slate-400">2026.10.28</span>
                    </div>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      산지직송이라 그런지 고기 신선도가 마트에서 사는 것과 비교가 안 되네요. 포장도 꼼꼼하고 에스크로 결제라 더 안심하고 샀습니다. 재구매 의사 100%입니다!
                    </p>
                  </div>

                  <div className="pt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">캠핑매니아 (구매자)</span>
                      <span className="text-slate-400">2026.10.26</span>
                    </div>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      배송 진짜 빠르고 상품 설명이랑 완전 똑같습니다. 다음 주 캠핑 때 또 주문할게요!
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </main>

      {/* 3. 모바일 하단 고정 바로구매 바 (스마트폰 접속 시 화면 최하단에 구매 바 고정) */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200/90 p-3 sm:hidden z-30 shadow-lg flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-400 block">총 결제금액</span>
          <span className="text-lg font-black text-slate-900">{grandTotal.toLocaleString()}원</span>
        </div>
        <div className="flex items-center gap-2 flex-1 max-w-[240px]">
          <Button
            onClick={isUsed ? handleChatWithSeller : handleAddToCart}
            variant="outline"
            className="flex-1 h-10 rounded-xl text-xs font-bold"
          >
            {isUsed ? '채팅' : '장바구니'}
          </Button>
          <Button
            onClick={handleBuyNow}
            className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs"
          >
            안전구매
          </Button>
        </div>
      </div>

    </div>
  )
}

