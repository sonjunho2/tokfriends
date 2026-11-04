/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Share2,
  Heart,
  MessageCircle,
  ShieldCheck,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Flag,
  Sparkles,
  ExternalLink,
  Store,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react'
import { useWebAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Sample Used Products Mock Database
const SAMPLE_USED_ITEMS: Record<string, any> = {
  'c2c-1': {
    id: 'c2c-1',
    title: '아이폰 15 프로 256GB 내추럴 티타늄 풀박스 (배터리 99%)',
    category: '디지털/가전',
    price: 980000,
    originalPrice: 1550000,
    locationName: '서울 강남구 역삼역 3번출구',
    mannerTemp: 39.2,
    sellerId: 'user-c2c-1',
    sellerNickname: '테크러버 (역삼동)',
    sellerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500',
    verifiedNeighborhood: '서울 강남구 역삼1동 (인증 12회)',
    responseRate: '10분 이내 응답 (98%)',
    usedCondition: 'S급 (미세 사용감 외 흠집 없음)',
    canProposePrice: false,
    tradeType: '직거래 / 안전택배 둘 다 가능',
    tradeLocationDetail: '역삼역 3번 출구 개찰구 또는 GFC 타워 로비',
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=800',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800',
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800',
    ],
    description: '작년 11월 애플스토어 여의도에서 정품 자급제로 구매한 아이폰 15 프로 256GB 내추럴 티타늄 모델입니다. 찍힘이나 기스 전혀 없는 특S급 상태입니다.',
    likesCount: 28,
    chatsCount: 9,
    viewsCount: 384,
    createdAt: '15분 전',
    otherItems: [],
  },
  'c2c-2': {
    id: 'c2c-2',
    title: '미개봉 소니 WH-1000XM5 헤드폰 노이즈캔슬링 실버',
    category: '디지털/가전',
    price: 320000,
    originalPrice: 479000,
    locationName: '서울 서초구 교대역',
    mannerTemp: 37.8,
    sellerId: 'user-c2c-2',
    sellerNickname: '사운드마니아',
    sellerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
    verifiedNeighborhood: '서울 서초구 서초3동 (인증 8회)',
    responseRate: '30분 이내 응답 (95%)',
    usedCondition: '미개봉 새상품 (미개봉 씰 부착)',
    canProposePrice: true,
    tradeType: '직거래 / 택배거래',
    tradeLocationDetail: '교대역 8번 출구 또는 서초역 인근',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800',
    ],
    description: '이벤트 경품으로 수령한 소니 정품 헤드폰 미개봉 새상품입니다.',
    likesCount: 19,
    chatsCount: 5,
    viewsCount: 210,
    createdAt: '1시간 전',
    otherItems: [],
  },
  'c2c-3': {
    id: 'c2c-3',
    title: '캠핑용 롤 우드 테이블 120cm + 가방 포함',
    category: '스포츠/레저',
    price: 45000,
    originalPrice: 89000,
    locationName: '서울 송파구 잠실새내',
    mannerTemp: 41.0,
    sellerId: 'user-c2c-3',
    sellerNickname: '캠퍼정',
    sellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
    verifiedNeighborhood: '서울 송파구 잠실본동 (인증 15회)',
    responseRate: '5분 이내 응답 (99%)',
    usedCondition: 'A급 (실사용 2회)',
    canProposePrice: false,
    tradeType: '직거래 우선',
    tradeLocationDetail: '잠실새내역 4번 출구 앞',
    images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800'],
    description: '실사용 2회로 상판 스크래치 전혀 없습니다. 부피가 있어 직거래 선호합니다.',
    likesCount: 15,
    chatsCount: 7,
    viewsCount: 280,
    createdAt: '35분 전',
    otherItems: [],
  },
  'c2c-4': {
    id: 'c2c-4',
    title: '아크테릭스 아톰LT 후디 블랙 남성용 (M사이즈)',
    category: '패션/의류',
    price: 135000,
    originalPrice: 280000,
    locationName: '서울 마포구 연남동',
    mannerTemp: 38.5,
    sellerId: 'user-c2c-4',
    sellerNickname: '고프코어룩',
    sellerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500',
    verifiedNeighborhood: '서울 마포구 연남동 (인증 9회)',
    responseRate: '20분 이내 응답 (96%)',
    usedCondition: 'A급 (드라이클리닝 완료)',
    canProposePrice: true,
    tradeType: '직거래 / 편의점 택배',
    tradeLocationDetail: '홍대입구역 3번 출구 연트럴파크',
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800'],
    description: '작년 겨울 백화점 매장에서 구매 후 4~5회 착용 후 드라이클리닝 완료하여 보관 중입니다.',
    likesCount: 42,
    chatsCount: 14,
    viewsCount: 620,
    createdAt: '2시간 전',
    otherItems: [],
  },
  'used-001': {
    id: 'used-001',
    title: '[S급 풀박스] 애플 아이패드 프로 11인치 M2 128GB 스페이스그레이',
    category: '디지털/가전',
    price: 850000,
    originalPrice: 1240000,
    locationName: '서울 강남구 역삼동',
    mannerTemp: 42.5,
    sellerId: 'user-used-1',
    sellerNickname: '애플러버_민우',
    sellerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500',
    verifiedNeighborhood: '서울 강남구 역삼동 (인증 21회)',
    responseRate: '5분 이내 응답 (99%)',
    usedCondition: 'S급 (미세 사용감)',
    canProposePrice: false,
    tradeType: '직거래 / 안전택배',
    tradeLocationDetail: '역삼역 부근 또는 강남역 스타벅스',
    images: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=1000',
      'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=1000',
    ],
    description: '작년 가을에 구매해서 영상 시청용으로만 가끔 실내에서 사용한 아이패드 프로 11인치 M2 모델입니다.',
    likesCount: 34,
    chatsCount: 12,
    viewsCount: 450,
    createdAt: '3시간 전',
    otherItems: [],
  },
};

export default function UsedProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user, isAuthenticated, requireAuth } = useWebAuth()

  const productId = (params?.id as string) || 'c2c-1'
  const [product, setProduct] = useState<any>(null)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isSafeBuyModalOpen, setIsSafeBuyModalOpen] = useState(false)
  const [safeBuyStep, setSafeBuyStep] = useState<'CONFIRM' | 'SUCCESS'>('CONFIRM')

  // Load product data
  useEffect(() => {
    const found = SAMPLE_USED_ITEMS[productId]
    if (found) {
      setProduct(found)
    } else {
      // Fallback
      setProduct({
        id: productId,
        title: `[중고매물] 직거래 안심 중고물품 (${productId})`,
        category: '디지털/생활',
        price: 350000,
        originalPrice: 500000,
        locationName: '서울 강남구 역삼동',
        mannerTemp: 36.5,
        sellerId: 'user-unknown',
        sellerNickname: '모꼬이웃',
        sellerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500',
        verifiedNeighborhood: '서울 강남구 역삼1동 (인증 완료)',
        responseRate: '15분 이내 응답',
        usedCondition: 'A급 (정상 작동)',
        canProposePrice: false,
        tradeType: '직거래 / 안전택배',
        tradeLocationDetail: '역삼역 부근 협의',
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=800'],
        description: `상태 양호하며 직거래 또는 모꼬 에스크로 안전결제로 거래 가능합니다.
궁금하신 점은 거래톡으로 편하게 문의주세요!`,
        likesCount: 12,
        chatsCount: 3,
        viewsCount: 154,
        createdAt: '방금 전',
        otherItems: [],
      })
    }
  }, [productId])

  // Check wishlist state
  useEffect(() => {
    if (typeof window !== 'undefined' && product) {
      try {
        const stored = JSON.parse(localStorage.getItem('mocco_wishlist') || '[]')
        const exists = stored.some((item: any) => item.id === product.id)
        setIsLiked(exists)
      } catch (e) {
        console.warn('Failed to read wishlist', e)
      }
    }
  }, [product])

  // Toggle wishlist (마이모꼬 관심목록 저장 및 해제)
  const handleToggleWishlist = () => {
    if (!product) return
    try {
      const stored = JSON.parse(localStorage.getItem('mocco_wishlist') || '[]')
      let updated = []
      if (isLiked) {
        updated = stored.filter((i: any) => i.id !== product.id)
        setIsLiked(false)
        toast({
          title: '💔 관심목록에서 제거되었습니다.',
          description: `"${product.title}" 물품이 마이모꼬 관심목록에서 삭제되었습니다.`,
        })
      } else {
        const newItem = {
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.images[0],
          category: product.category,
          seller: product.sellerNickname,
          type: 'C2C_USED',
        }
        updated = [newItem, ...stored.filter((i: any) => i.id !== product.id)]
        setIsLiked(true)
        toast({
          title: '❤️ 관심목록에 추가되었습니다!',
          description: '마이모꼬 > 마켓 & 중고거래 관리 > [관심목록] 탭에서 확인하실 수 있습니다.',
        })
      }
      localStorage.setItem('mocco_wishlist', JSON.stringify(updated))
    } catch (e) {
      console.warn('Failed to update wishlist', e)
    }
  }

  // 거래톡 시작 (실제 채팅방 생성 및 이동)
  const handleStartTradeChat = () => {
    if (!product) return
    requireAuth(() => {
      try {
        const tradeInfo = {
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.images[0],
          seller: product.sellerNickname,
          sellerAvatar: product.sellerAvatar,
        }
        localStorage.setItem('mocco_active_trade_chat', JSON.stringify(tradeInfo))
        toast({
          title: '💬 거래톡 채팅방으로 연결합니다.',
          description: `판매자 "${product.sellerNickname}"님과 1:1 대화를 시작합니다.`,
        })
        router.push(`/?tab=CHAT&sub=CHATS&tradeId=${product.id}`)
      } catch (e) {
        console.warn('Failed to route to trade chat', e)
      }
    })
  }

  // 안전구매 에스크로 결제 실행
  const handleSafeBuy = () => {
    requireAuth(() => {
      setIsSafeBuyModalOpen(true)
      setSafeBuyStep('CONFIRM')
    })
  }

  const handleConfirmEscrowPayment = () => {
    setSafeBuyStep('SUCCESS')
    toast({
      title: '🎉 에스크로 안전결제 승인 완료!',
      description: '결제 대금이 안전하게 모꼬 안심 계좌에 예치되었습니다.',
    })
  }

  // 공유하기
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href)
      toast({
        title: '🔗 링크 복사 완료!',
        description: '중고거래 상세 페이지 주소가 클립보드에 복사되었습니다.',
      })
    }
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">중고 매물 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28 sm:pb-16">
      {/* 1. 상단 심플 GNB 헤더 (당근마켓 스타일) */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition"
              title="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5">
              <Badge className="bg-orange-500 text-white font-extrabold text-[11px] px-2 py-0.5 border-none shadow-xs">
                🥕 C2C 중고거래
              </Badge>
              <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                {product.locationName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handleShare}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition"
              title="공유하기"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <Link
              href="/?tab=MARKET&sub=C2C_USED"
              className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold transition flex items-center gap-1"
            >
              <Store className="w-3.5 h-3.5" />
              <span>중고마켓 홈</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. 메인 컨텐츠 영역 (당근마켓형 1컬럼 집중 뷰 + 모바일/PC 반응형 패널) */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* (1) 실물 사진 슬라이더 (어떤 비율/해상도의 사진이 와도 뷰포트 창 크기가 100% 고정됨) */}
        <div 
          className="relative w-full h-[360px] sm:h-[460px] rounded-3xl overflow-hidden bg-slate-950 shadow-sm border border-slate-200 group flex items-center justify-center"
          style={{ height: '460px', maxHeight: '460px', minHeight: '360px' }}
        >
          {/* 배경 은은한 블러 레이어 (여백이 생겨도 미려하고 어색하지 않음) */}
          <img
            src={product.images[activeImageIdx]}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20 scale-110 pointer-events-none"
          />

          {/* 메인 실물 사진 (고정 프레임 안에서 왜곡/비율 깨짐 없이 항상 정비율 핏) */}
          <img
            src={product.images[activeImageIdx]}
            alt={product.title}
            className="relative z-10 max-w-full max-h-full object-contain transition-transform duration-300"
          />

          {/* 좌우 이미지 넘김 버튼 */}
          {product.images.length > 1 && (
            <>
              <button
                onClick={() => setActiveImageIdx((p) => (p > 0 ? p - 1 : product.images.length - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-sm transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveImageIdx((p) => (p < product.images.length - 1 ? p + 1 : 0))}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-sm transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-bold backdrop-blur-sm">
                {activeImageIdx + 1} / {product.images.length}
              </div>
            </>
          )}

          {/* 에스크로 안전거래 안내 뱃지 */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/90 text-white text-xs font-bold shadow-md backdrop-blur-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>모꼬 안심 에스크로 100% 보호</span>
          </div>
        </div>

        {/* 썸네일 바 */}
        {product.images.length > 1 && (
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {product.images.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImageIdx(idx)}
                className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 transition shrink-0 ${
                  activeImageIdx === idx
                    ? 'border-orange-500 ring-2 ring-orange-200'
                    : 'border-slate-200 opacity-70 hover:opacity-100'
                }`}
                style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px' }}
              >
                <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* (2) 판매자 프로필 & 매너온도 카드 (아바타 48px 엄격 고정 및 비율 보정) */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* 48px 정원형 아바타 컨테이너 (어떤 원본 사진이라도 48px를 1픽셀도 벗어날 수 없도록 락킹) */}
            <div 
              className="relative shrink-0" 
              style={{ width: '48px', height: '48px', minWidth: '48px', minHeight: '48px', maxWidth: '48px', maxHeight: '48px' }}
            >
              <div 
                className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-100 shadow-2xs bg-slate-100"
                style={{ width: '48px', height: '48px' }}
              >
                <img
                  src={product.sellerAvatar}
                  alt={product.sellerNickname}
                  className="w-full h-full object-cover block"
                  style={{ width: '48px', height: '48px', minWidth: '48px', minHeight: '48px', objectFit: 'cover' }}
                />
              </div>
              {/* 온라인 상태 표시 녹색 인디케이터 (아바타 우측 하단에 정위치) */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs z-10" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                  {product.sellerNickname}
                </h3>
                <Badge className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-1.5 py-0 border-none shrink-0">
                  개인판매자
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                <span className="truncate">{product.verifiedNeighborhood}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ⚡ {product.responseRate}
              </p>
            </div>
          </div>

          {/* 매너온도 게이지 */}
          <div className="text-right shrink-0">
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-lg sm:text-xl font-black text-orange-600">
                {product.mannerTemp}℃
              </span>
              <span className="text-base">😄</span>
            </div>
            <div className="w-24 sm:w-28 bg-slate-100 rounded-full h-2 mt-1 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (product.mannerTemp / 60) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">매너온도</span>
          </div>
        </div>

        {/* (3) 중고 물품 핵심 정보 & 본문 내용 */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-6">
          
          {/* 타이틀 및 카테고리/시간 */}
          <div className="space-y-2 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-orange-600">{product.category}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {product.createdAt}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              {product.title}
            </h1>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {product.price.toLocaleString()}원
              </span>
              {product.canProposePrice ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold">
                  가격 제안(네고) 가능
                </Badge>
              ) : (
                <span className="text-xs text-slate-400 font-medium">가격 제안 불가</span>
              )}
            </div>
          </div>

          {/* 중고 거래 속성 뱃지 그룹 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                ✨
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-bold block">상품 상태</span>
                <span className="text-xs font-extrabold text-slate-800">{product.usedCondition}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                🤝
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-bold block">거래 방식</span>
                <span className="text-xs font-extrabold text-slate-800">{product.tradeType}</span>
              </div>
            </div>
          </div>

          {/* 직거래 희망 장소 */}
          {product.tradeLocationDetail && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3 text-xs">
              <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-slate-900 block">직거래 희망 장소</span>
                <span className="text-slate-600 mt-0.5 block">{product.tradeLocationDetail}</span>
              </div>
            </div>
          )}

          {/* 판매자 설명글 본문 */}
          <div className="space-y-2 pt-2">
            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">물품 상세 설명</h4>
            <p className="text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* 거래 통계 & 신고 */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <span>관심 {product.likesCount + (isLiked ? 1 : 0)}</span>
              <span>·</span>
              <span>채팅 {product.chatsCount}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {product.viewsCount}
              </span>
            </div>
            <button
              onClick={() => {
                toast({
                  title: '🚨 게시글 신고 접수',
                  description: '운영진과 안전관 AI에게 해당 중고 매물이 전달되었습니다.',
                })
              }}
              className="text-slate-400 hover:text-rose-500 flex items-center gap-1 transition"
            >
              <Flag className="w-3 h-3" />
              <span>신고하기</span>
            </button>
          </div>
        </div>

        {/* (4) 모꼬 안심 에스크로 뱃지 바 (잡다한 설명문 배제, 슬림 & 미니멀) */}
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200/80 px-4 py-3 flex items-center justify-between text-xs text-emerald-950 font-bold shadow-2xs">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>모꼬 에스크로 100% 안전결제 보호 매물</span>
          </span>
          <span className="text-[11px] text-emerald-700 font-medium hidden sm:inline">
            구매확정 시까지 결제 대금 안전 예치
          </span>
        </div>

        {/* (5) 이 판매자의 다른 판매 물품 */}
        {product.otherItems && product.otherItems.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900">
                {product.sellerNickname}님의 다른 판매 물품
              </h4>
              <span className="text-xs text-slate-400">총 {product.otherItems.length}개</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {product.otherItems.map((item: any) => (
                <Link
                  key={item.id}
                  href={`/market/used/${item.id}`}
                  className="group rounded-2xl border border-slate-200/80 p-3 hover:border-orange-300 transition bg-slate-50/50"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full aspect-square rounded-xl object-cover mb-2 group-hover:scale-102 transition"
                  />
                  <h5 className="font-bold text-xs text-slate-900 line-clamp-1">{item.title}</h5>
                  <span className="font-black text-xs text-orange-600 mt-1 block">
                    {item.price.toLocaleString()}원
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* 3. 하단 고정 바 (PC / 모바일 공통: [❤️ 찜] + [거래톡] + [안전구매]) */}
      {/* 절대 쇼핑몰 정보(장바구니, 사업자번호 등) 없음 */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:py-3.5 z-40 shadow-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          
          {/* 가격 정보 */}
          <div className="pl-1">
            <span className="text-[10px] text-slate-400 block font-medium">거래 희망 가격</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-2xl font-black text-slate-900">
                {product.price.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-600">원</span>
            </div>
          </div>

          {/* 액션 버튼 3종: [❤️ 찜] + [거래톡] + [안전구매] */}
          <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
            
            {/* 1) 찜(관심상품 등록) 버튼 */}
            <button
              onClick={handleToggleWishlist}
              className={`p-3 rounded-2xl border transition shrink-0 ${
                isLiked
                  ? 'bg-rose-50 border-rose-300 text-rose-500'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
              title="관심목록 등록"
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>

            {/* 2) 거래톡 버튼 (실제 판매자 채팅 연결) */}
            <Button
              onClick={handleStartTradeChat}
              variant="outline"
              className="flex-1 h-11 sm:h-12 rounded-2xl border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-700 font-black text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              <span>거래톡</span>
            </Button>

            {/* 3) 안전구매 버튼 (토스 에스크로 안전결제) */}
            <Button
              onClick={handleSafeBuy}
              className="flex-1 h-11 sm:h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-black text-xs sm:text-sm shadow-md shadow-orange-500/20 active:scale-98 transition flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>안전구매</span>
            </Button>
          </div>

        </div>
      </div>

      {/* 4. 안전구매(에스크로) 결제 모달 다이얼로그 */}
      {isSafeBuyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <button
              onClick={() => setIsSafeBuyModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {safeBuyStep === 'CONFIRM' ? (
              <>
                <div className="space-y-1">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl mb-2">
                    🛡️
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    모꼬 안심 에스크로 안전결제
                  </h3>
                  <p className="text-xs text-slate-500">
                    대금은 모꼬 안심 계좌에 안전하게 예치되며, 물품 수령 후 [구매 확정]을 누르셔야 판매자에게 정산됩니다.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">거래 물품</span>
                    <span className="font-bold text-slate-900 truncate max-w-[200px]">{product.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">판매자</span>
                    <span className="font-bold text-slate-900">{product.sellerNickname}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                    <span>안전결제 예치금액</span>
                    <span className="text-orange-600">{product.price.toLocaleString()}원</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleConfirmEscrowPayment}
                    className="w-full h-11 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-90 text-white font-extrabold text-sm shadow-md"
                  >
                    토스페이먼츠 안전결제 진행하기
                  </Button>
                  <Button
                    onClick={() => setIsSafeBuyModalOpen(false)}
                    variant="ghost"
                    className="w-full h-9 rounded-2xl text-slate-500 font-bold text-xs"
                  >
                    취소
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mx-auto">
                  🎉
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  안전결제(에스크로) 예치 완료!
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  결제 대금이 안전하게 예치되었습니다.<br />
                  판매자에게 배송/직거래 요청 알림이 전송되었습니다.
                </p>
                <Button
                  onClick={() => {
                    setIsSafeBuyModalOpen(false)
                    handleStartTradeChat()
                  }}
                  className="w-full h-11 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm"
                >
                  판매자와 거래톡으로 약속 잡기
                </Button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
