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
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  X,
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
    images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000',
      'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1000',
    ],
    description: '제주 청정 자연에서 자란 1+등급 무항생제 제주 흑돼지 오겹살입니다.',
    merchantInfo: {
      businessName: '(주)제주푸드 본사 직영',
      representative: '김제주',
      businessNumber: '123-45-67890',
      onlineOrderNumber: '제2026-제주-0123호',
      address: '제주특별자치도 제주시 청풍로 45',
      contactPhone: '064-700-1234',
      customerServiceHours: '평일 09:30 ~ 18:00',
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
    targetQuantity: 50,
    currentQuantity: 38,
    shippingFee: 0,
    isFreeShipping: true,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=1000',
    ],
    description: '소니 코리아 정품 WH-1000XM5 플래그십 무선 노이즈 캔슬링 헤드폰입니다.',
    merchantInfo: {
      businessName: '(주)사운드코리아 공식수입원',
      representative: '박음향',
      businessNumber: '214-88-77665',
      onlineOrderNumber: '제2026-서울용산-0456호',
      address: '서울특별시 용산구 청파로 109',
      contactPhone: '1544-7788',
      customerServiceHours: '평일 10:00 ~ 17:00',
    },
    orderCount: 890,
    rating: 5.0,
    reviewCount: 194,
  },
  'np-001': {
    id: 'np-001',
    name: '[모꼬직영] 제주 산지직송 프리미엄 1등급 흑돼지 오겹살 1kg (신선 냉장)',
    category: '식품/신선',
    type: 'B2C_NORMAL',
    price: 32900,
    originalPrice: 38000,
    stock: 150,
    shippingFee: 3000,
    images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
      'https://images.unsplash.com/photo-1558030006-450675393462?w=800',
    ],
    description: '제주 청정 농가에서 당일 도축 후 신선 보랭 포장 발송하는 1등급 명품 흑돼지 오겹살입니다.',
    merchantInfo: { businessName: '모꼬(MOCCO) 본사 직영', representative: '김모꼬', businessNumber: '123-86-12345', address: '제주특별자치도 제주시 청풍로 45' },
    orderCount: 820,
    rating: 4.9,
    reviewCount: 1280,
  },
  'np-002': {
    id: 'np-002',
    name: '제주 유기농 감귤 착즙 원액주스 1000ml (3병 선물세트)',
    category: '식품/음료',
    type: 'B2C_NORMAL',
    price: 24900,
    originalPrice: 29000,
    stock: 80,
    shippingFee: 0,
    images: ['https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800'],
    description: '물 한 방울 섞지 않은 무가당 100% 제주 감귤 순수 착즙 프리미엄 주스입니다.',
    merchantInfo: { businessName: '제주푸드 본사 직영', representative: '정농부', businessNumber: '321-45-98765', address: '제주 서귀포시 감귤로 12' },
    orderCount: 640,
    rating: 4.8,
    reviewCount: 950,
  },
  'gp-003': {
    id: 'gp-003',
    name: '[특가공구] 당일 도축 제주 1++ 한우 꽃등심 500g (냉장 구이용)',
    category: '식품/신선',
    type: 'B2C_GROUP',
    price: 48900,
    originalPrice: 89000,
    stock: 50,
    targetQuantity: 50,
    currentQuantity: 46,
    shippingFee: 0,
    images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=800'],
    description: '입에서 사르르 녹는 마블링 No.9 프리미엄 1++ 제주 한우 등심 산지 직송 공구 45% 할인.',
    merchantInfo: { businessName: '모꼬(MOCCO) 축산 직영', representative: '이한우', businessNumber: '555-12-34567', address: '제주 제주시 축산로 99' },
    orderCount: 46,
    rating: 4.9,
    reviewCount: 38,
  },
  'np-003': {
    id: 'np-003',
    name: '고순도 프리미엄 알티지 오메가3 120캡슐 (4개월분)',
    category: '건강/헬스',
    type: 'B2C_NORMAL',
    price: 42000,
    originalPrice: 55000,
    stock: 200,
    shippingFee: 2500,
    images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800'],
    description: 'IFOS 최고등급 원료 사용, 흡수율 높은 rTG형 오메가3로 혈행 및 눈 건강을 지켜드립니다.',
    merchantInfo: { businessName: '메디컬 헬스케어랩', representative: '최건강', businessNumber: '678-90-12345', address: '서울 강남구 역삼로 45' },
    orderCount: 480,
    rating: 4.9,
    reviewCount: 710,
  },
  'gp-004': {
    id: 'gp-004',
    name: '[특가공구] 지리산 100% 천연 벌꿀 1.2kg 튜브형 1+1 기획',
    category: '식품/건강',
    type: 'B2C_GROUP',
    price: 28000,
    originalPrice: 48000,
    stock: 40,
    targetQuantity: 40,
    currentQuantity: 34,
    shippingFee: 0,
    images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800'],
    description: '물 한 방울 섞이지 않은 지리산 깊은 숲 자연 숙성 천연 벌꿀 튜브형 공동구매 42% 할인.',
    merchantInfo: { businessName: '지리산 농가 협동조합', representative: '박꿀벌', businessNumber: '444-22-11111', address: '전남 구례군 지리산로 10' },
    orderCount: 34,
    rating: 4.8,
    reviewCount: 29,
  },
  'np-004': {
    id: 'np-004',
    name: '무소음 초음파 감성 아로마 무드등 가습기 500ml',
    category: '생활/가전',
    type: 'B2C_NORMAL',
    price: 35000,
    originalPrice: 42000,
    stock: 60,
    shippingFee: 3000,
    images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800'],
    description: '심플한 모던 인테리어 디자인과 7가지 은은한 LED 무드등 기능이 탑재된 초음파 가습기.',
    merchantInfo: { businessName: '어반 라이프 스타일', representative: '윤감성', businessNumber: '777-88-99999', address: '서울 마포구 독막로 33' },
    orderCount: 320,
    rating: 4.7,
    reviewCount: 430,
  },
  'gp-001': {
    id: 'gp-001',
    name: '[특가공구] 산지직송 나주 배 5kg 특등급 (목표 20박스 한정 43% OFF)',
    category: '식품/과일',
    type: 'B2C_GROUP',
    price: 19900,
    originalPrice: 35000,
    stock: 20,
    targetQuantity: 20,
    currentQuantity: 14,
    shippingFee: 0,
    images: ['https://images.unsplash.com/photo-1514756331096-242fdeb7004a?w=800'],
    description: '당도 13브릭스 이상 보장 나주 특등급 햇배 공동구매 43% 파격 할인 딜입니다.',
    merchantInfo: { businessName: '모꼬(MOCCO) 공구 추진팀', representative: '김나주', businessNumber: '111-22-33333', address: '전남 나주시 배향로 88' },
    orderCount: 14,
    rating: 4.9,
    reviewCount: 12,
  },
  'gp-002': {
    id: 'gp-002',
    name: '[특가공구] 호텔식 프리미엄 40수 코마사 순면 수건 10장 세트',
    category: '생활/리빙',
    type: 'B2C_GROUP',
    price: 24000,
    originalPrice: 42000,
    stock: 50,
    targetQuantity: 30,
    currentQuantity: 22,
    shippingFee: 0,
    images: ['https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=800'],
    description: '특급 호텔에서 사용하는 최고급 코마사 40수 200g 도톰한 프리미엄 순면 타월 세트.',
    merchantInfo: { businessName: '모꼬(MOCCO) 리빙 직영', representative: '정타월', businessNumber: '222-33-44444', address: '대구 중구 섬유로 55' },
    orderCount: 22,
    rating: 4.8,
    reviewCount: 19,
  },
  'gp-005': {
    id: 'gp-005',
    name: '[특가공구] 완도 활전복 1kg 10~12미 당일 산지직송 (특가 41% OFF)',
    category: '식품/신선',
    type: 'B2C_GROUP',
    price: 34900,
    originalPrice: 59000,
    stock: 30,
    targetQuantity: 30,
    currentQuantity: 21,
    shippingFee: 0,
    images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=800'],
    description: '청정 완도 바다에서 당일 채취하여 해수 산소포장으로 살아있는 채로 배송되는 명품 활전복.',
    merchantInfo: { businessName: '완도전복 직판장', representative: '강완도', businessNumber: '333-44-55555', address: '전남 완도군 해변로 12' },
    orderCount: 21,
    rating: 4.9,
    reviewCount: 28,
  },
};

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
  const [isGroupJoinedModalOpen, setIsGroupJoinedModalOpen] = useState(false)
  const [selectedOptionId, setSelectedOptionId] = useState<string>('')

  // 장바구니 Drawer 상태 및 아이템 목록
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState<Array<{
    id: string
    name: string
    price: number
    quantity: number
    image: string
    shippingFee: number
  }>>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('mocco_cart') || '[]')
        setCartItems(stored)
      } catch (e) {
        console.warn('Failed to load cart', e)
      }
    }
  }, [])

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  // 중고거래 매물인 경우 C2C 중고거래 전용 상세페이지로 즉시 리다이렉트
  useEffect(() => {
    if (productId && (productId.startsWith('c2c') || productId.startsWith('used') || productId.startsWith('u-'))) {
      router.replace('/market/used/' + productId)
    }
  }, [productId, router])

  // 관심목록(찜) 상태 체크
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

  // 관심목록(찜) 토글 함수 (마이모꼬 관심목록 저장 및 해제)
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
          description: `"${product.name}" 상품이 마이모꼬 관심목록에서 삭제되었습니다.`,
        })
      } else {
        const newItem = {
          id: product.id,
          title: product.name,
          price: product.price,
          image: product.images[0],
          category: product.category,
          seller: product.merchantInfo?.businessName || '공식 마켓',
          type: product.type || 'B2C_NORMAL',
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

  useEffect(() => {
    // 1. Check local samples
    let found = SAMPLE_MARKET_PRODUCTS[productId]

    // 2. Check localStorage for custom products (merchant registered & HQ PB)
    if (!found && typeof window !== 'undefined') {
      try {
        const customProds = JSON.parse(localStorage.getItem('mocco_custom_products') || '[]')
        const matchCustom = Array.isArray(customProds)
          ? customProds.find((p: any) => p.id === productId)
          : null
        if (matchCustom) found = matchCustom

        if (!found) {
          const hqProds = JSON.parse(localStorage.getItem('mocco_hq_direct_products') || '[]')
          const matchHq = Array.isArray(hqProds)
            ? hqProds.find((p: any) => p.id === productId)
            : null
          if (matchHq) found = matchHq
        }
      } catch (e) {
        console.warn('Failed to parse custom products', e)
      }
    }

    if (found) {
      setProduct(found)
      if (found.hasOptions && Array.isArray(found.options) && found.options.length > 0) {
        setSelectedOptionId(found.options[0].id)
      }
      setLoading(false)
    } else {
      // Fallback default item
      const isGroupFallback = productId.startsWith('gp') || productId.includes('group');
      setProduct({
        id: productId,
        name: isGroupFallback ? `[특가공구] 모꼬 한정 수량 공동구매 특가 (${productId})` : `[모꼬 엄선] 마켓 프리미엄 상품 (${productId})`,
        category: isGroupFallback ? '특가/공구' : '일반/생활',
        type: isGroupFallback ? 'B2C_GROUP' : 'B2C_NORMAL',
        price: isGroupFallback ? 29000 : 49000,
        originalPrice: isGroupFallback ? 49000 : 65000,
        stock: 50,
        targetQuantity: isGroupFallback ? 50 : undefined,
        currentQuantity: isGroupFallback ? 38 : undefined,
        shippingFee: isGroupFallback ? 0 : 3000,
        images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000'],
        description: isGroupFallback
          ? '한정 수량 목표 인원 달성 시 파격 특가로 일괄 배송되는 모꼬 단독 공동구매 상품입니다. 미달성 시 100% 자동 전액 환불됩니다.'
          : '대한민국 전자상거래법 및 모꼬 안심 에스크로 100% 안전결제로 보호되는 공식 등록 상품입니다.',
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
          deliveryDays: isGroupFallback ? '목표 달성 시 당일 일괄 출고' : '오후 2시 이전 주문 시 당일 발송',
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

  const selectedOption =
    product.hasOptions && Array.isArray(product.options)
      ? product.options.find((o: any) => o.id === selectedOptionId) || product.options[0]
      : null

  const unitPrice =
    (product.price || 0) + (selectedOption ? Number(selectedOption.additionalPrice) || 0 : 0)

  const totalPrice = unitPrice * quantity
  const shippingFee =
    product.isFreeShipping || (product.freeShippingThreshold && totalPrice >= product.freeShippingThreshold)
      ? 0
      : product.shippingFee || 3000
  const grandTotal = totalPrice + shippingFee

  // 구매 버튼 클릭 (게스트는 즉시 로그인 유도)
  const handleBuyNow = () => {
    requireAuth(() => {
      const optionLabel = selectedOption ? ` [옵션: ${selectedOption.name}]` : ''
      if (isGroup) {
        setIsGroupJoinedModalOpen(true)
        toast({
          title: '🎉 특가 공동구매 참여(선결제) 완료!',
          description: `총 ${grandTotal.toLocaleString()}원이 모꼬 안심 에스크로에 예치되었습니다. 목표 달성 시 즉시 출고됩니다.`,
        })
      } else {
        toast({
          title: '🛡️ 토스페이먼츠 PG 에스크로 안전결제 주문 생성',
          description: `${product.name}${optionLabel} (${quantity}개) 총 ${grandTotal.toLocaleString()}원이 에스크로 안전 금고에 예치되었습니다. 수령 후 [구매확정]을 누르면 판매자에게 정산됩니다.`,
        })
      }
    })
  }

  // 장바구니 수량 변경
  const updateCartQuantity = (id: string, delta: number) => {
    const updated = cartItems
      .map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta
          return newQty > 0 ? { ...item, quantity: newQty } : null
        }
        return item
      })
      .filter(Boolean) as typeof cartItems

    setCartItems(updated)
    localStorage.setItem('mocco_cart', JSON.stringify(updated))
  }

  // 장바구니 아이템 삭제
  const removeCartItem = (id: string) => {
    const updated = cartItems.filter((item) => item.id !== id)
    setCartItems(updated)
    localStorage.setItem('mocco_cart', JSON.stringify(updated))
    toast({ title: '🗑️ 상품이 장바구니에서 삭제되었습니다.' })
  }

  // 장바구니 담기
  const handleAddToCart = () => {
    requireAuth(() => {
      const optionLabel = selectedOption ? ` [옵션: ${selectedOption.name}]` : ''
      const cartItemId = selectedOption ? `${product.id}_${selectedOption.id}` : product.id
      const idx = cartItems.findIndex((item) => item.id === cartItemId)
      let updated: typeof cartItems = []
      if (idx > -1) {
        updated = cartItems.map((item, i) =>
          i === idx ? { ...item, quantity: item.quantity + quantity } : item
        )
      } else {
        updated = [
          ...cartItems,
          {
            id: cartItemId,
            name: `${product.name}${optionLabel}`,
            price: unitPrice,
            quantity: quantity,
            image: product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
            shippingFee: product.shippingFee || 3000,
          },
        ]
      }
      setCartItems(updated)
      localStorage.setItem('mocco_cart', JSON.stringify(updated))
      toast({
        title: '🛒 장바구니에 담겼습니다!',
        description: `${product.name}${optionLabel} (${quantity}개)가 추가되었습니다. 장바구니를 확인해보세요.`,
      })
      setIsCartOpen(true)
    })
  }

  // 중고거래 판매자와 1:1 거래톡 연결
  const handleChatWithSeller = () => {
    requireAuth(() => {
      const sellerName = product.seller?.nickname || product.sellerNickname || product.merchantInfo?.businessName || '판매자'
      const tradeInfo = {
        id: product.id,
        title: product.name,
        price: product.price,
        image: product.images?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
        seller: sellerName,
        condition: product.conditionText || '중고 A급',
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('mocco_active_trade_chat', JSON.stringify(tradeInfo))
      }
      toast({
        title: '💬 거래톡으로 연결됩니다',
        description: `${sellerName}님과의 1:1 거래톡 방으로 이동합니다.`,
      })
      router.push(`/?tab=CHAT&sub=CHATS&tradeId=${product.id}`)
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
            {/* 장바구니 버튼 (마켓/공구 상품일 때만 노출) */}
            {!isUsed && !isGroup && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition"
                title="장바구니 보기"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

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

            {/* 🔥 특가 공동구매 전용 타임어택 & 달성률 위젯 */}
            {isGroup && (
              <div className="rounded-3xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 p-5 text-white shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    타임어택 공동구매
                  </span>
                  <span className="font-extrabold text-xs bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                    ⏰ 마감까지 18시간 24분 남음
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline justify-between text-xs mb-1.5">
                    <span className="font-extrabold text-sm">
                      목표 50명 중 <strong className="text-amber-300 font-black text-base">38명</strong> 참여 완료
                    </span>
                    <span className="font-black text-amber-300 text-sm">76% 달성</span>
                  </div>
                  <div className="w-full bg-black/25 rounded-full h-3 overflow-hidden p-0.5">
                    <div
                      className="bg-gradient-to-r from-amber-300 to-yellow-400 h-full rounded-full transition-all duration-500"
                      style={{ width: '76%' }}
                    />
                  </div>
                  <p className="text-[11px] text-rose-100 mt-2 flex items-center justify-between">
                    <span>⚡ <strong>12명</strong> 더 모이면 공구 성공 & 일괄 즉시 출고!</span>
                    <span className="underline opacity-90">미달성 시 100% 자동 전액 환불</span>
                  </p>
                </div>
              </div>
            )}

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

            {/* 옵션 선택 드롭다운 (옵션 매트릭스 활성화 상품) */}
            {product.hasOptions && Array.isArray(product.options) && product.options.length > 0 && (
              <div className="space-y-1.5 py-2.5 bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>상품 옵션 선택 <strong className="text-rose-500">*</strong></span>
                  <Badge variant="outline" className="text-[10px] bg-white text-indigo-700 border-indigo-200">
                    {product.options.length}개 규격
                  </Badge>
                </div>
                <select
                  value={selectedOptionId}
                  onChange={(e) => setSelectedOptionId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {product.options.map((opt: any) => (
                    <option key={opt.id} value={opt.id} disabled={opt.stock <= 0}>
                      {opt.name} {opt.additionalPrice > 0 ? `(+${opt.additionalPrice.toLocaleString()}원)` : opt.additionalPrice < 0 ? `(-${Math.abs(opt.additionalPrice).toLocaleString()}원)` : '(추가금 없음)'} {opt.stock <= 0 ? '[품절]' : `[재고 ${opt.stock}개]`}
                    </option>
                  ))}
                </select>
                {selectedOption && (
                  <div className="text-[11px] text-slate-600 flex justify-between items-center pt-1 px-1">
                    <span>선택: <strong className="text-slate-900">{selectedOption.name}</strong></span>
                    <span className="font-bold text-indigo-600">단가 {unitPrice.toLocaleString()}원</span>
                  </div>
                )}
              </div>
            )}

            {/* 수량 선택기 (C2C 중고는 수량 1개 고정) */}
            {!isUsed && !isGroup && (
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

            {/* 구매 액션 버튼 그리드 (타입별 이원화: 공구 vs 일반마켓 vs 중고) */}
            <div className="space-y-2.5 pt-2">
              {isGroup ? (
                /* 🔥 특가 공동구매: [❤️ 찜] + [🔥 특가 공구 참여하기] (장바구니 없음) */
                <div className="flex gap-2">
                  <button
                    onClick={handleToggleWishlist}
                    className={`p-3 rounded-2xl border transition shrink-0 ${
                      isLiked
                        ? 'bg-rose-50 border-rose-300 text-rose-500'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                    title="관심상품 등록"
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  <Button
                    onClick={handleBuyNow}
                    className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 hover:opacity-90 text-white font-black text-base shadow-lg shadow-rose-500/25 active:scale-98 transition flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300" />
                    <span>특가 공구 참여하기</span>
                  </Button>
                </div>
              ) : isUsed ? (
                /* 🥕 C2C 중고거래: [❤️ 찜] + [거래톡] + [안전구매] */
                <div className="flex gap-2">
                  <button
                    onClick={handleToggleWishlist}
                    className={`p-3 rounded-2xl border transition shrink-0 ${
                      isLiked
                        ? 'bg-rose-50 border-rose-300 text-rose-500'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                    title="관심상품 등록"
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                  <Button
                    onClick={handleChatWithSeller}
                    variant="outline"
                    className="flex-1 h-12 rounded-2xl border-orange-300 bg-orange-50/70 hover:bg-orange-100/80 text-orange-700 font-extrabold text-sm shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    거래톡
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-extrabold text-sm shadow-md"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    안전구매
                  </Button>
                </div>
              ) : (
                /* 🛒 일반 B2C 마켓: [❤️ 찜] + [장바구니 담기] + [바로구매] */
                <div className="space-y-2.5">
                  <div className="flex gap-2">
                    <button
                      onClick={handleToggleWishlist}
                      className={`p-3 rounded-2xl border transition shrink-0 ${
                        isLiked
                          ? 'bg-rose-50 border-rose-300 text-rose-500'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                      title="관심상품 등록"
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>

                    <Button
                      onClick={handleAddToCart}
                      variant="outline"
                      className="flex-1 h-12 rounded-2xl border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-700 font-extrabold text-sm shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      장바구니 담기
                    </Button>
                  </div>

                  <Button
                    onClick={handleBuyNow}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-base shadow-md active:scale-98 transition flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-5 h-5 text-emerald-300" />
                    <span>바로구매</span>
                  </Button>
                </div>
              )}
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

                {/* 상세 본문 디자인 이미지 갤러리 */}
                {((product as any).detailImages && (product as any).detailImages.length > 0) ? (
                  <div className="space-y-3">
                    {(product as any).detailImages.map((img: string, idx: number) => (
                      <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                        <img src={img} alt={`상세페이지 디자인 컷 ${idx + 1}`} className="w-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {product.images.map((img: string, idx: number) => (
                      <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                        <img src={img} alt={`상세 이미지 ${idx + 1}`} className="w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
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
                        <div 
                          className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 shadow-xs shrink-0 bg-slate-100"
                          style={{ width: '48px', height: '48px', minWidth: '48px', minHeight: '48px', maxWidth: '48px', maxHeight: '48px' }}
                        >
                          <img
                            src={product.sellerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500'}
                            alt={product.sellerNickname}
                            className="w-full h-full object-cover block"
                            style={{ width: '48px', height: '48px', minWidth: '48px', minHeight: '48px', objectFit: 'cover' }}
                          />
                        </div>
                        <div>
                          <div className="font-extrabold text-base text-slate-900">{product.sellerNickname} (이웃 회원)</div>
                          <div className="text-xs text-slate-500">{product.sellerLocation || '모꼬 지역인증 완료'}</div>
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
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200/90 p-3 sm:hidden z-30 shadow-lg flex items-center justify-between gap-2.5">
        <div>
          <span className="text-[10px] text-slate-400 block">총 결제금액</span>
          <span className="text-base font-black text-slate-900">{grandTotal.toLocaleString()}원</span>
        </div>
        <div className="flex items-center gap-1.5 flex-1 max-w-[280px] justify-end">
          <button
            onClick={handleToggleWishlist}
            className={`p-2.5 rounded-xl border transition shrink-0 ${
              isLiked
                ? 'bg-rose-50 border-rose-300 text-rose-500'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
            title="관심상품 등록"
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
          {isGroup ? (
            <Button
              onClick={handleBuyNow}
              className="flex-1 h-10 rounded-xl text-white font-black text-xs shadow-md bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 px-2 flex items-center justify-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>특가 공구 참여</span>
            </Button>
          ) : isUsed ? (
            <>
              <Button
                onClick={handleChatWithSeller}
                variant="outline"
                className="flex-1 h-10 rounded-xl text-xs font-extrabold border-orange-300 text-orange-700 bg-orange-50/60 px-2"
              >
                거래톡
              </Button>
              <Button
                onClick={handleBuyNow}
                className="flex-1 h-10 rounded-xl text-white font-extrabold text-xs bg-orange-600 px-2"
              >
                안전구매
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleAddToCart}
                variant="outline"
                className="flex-1 h-10 rounded-xl text-xs font-extrabold border-indigo-200 text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100 px-2"
              >
                장바구니 담기
              </Button>
              <Button
                onClick={handleBuyNow}
                className="flex-1 h-10 rounded-xl text-white font-extrabold text-xs shadow-xs bg-indigo-600 hover:bg-indigo-700 px-2"
              >
                바로구매
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 4. 장바구니 우측 슬라이드 패널 (Cart Drawer) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-extrabold text-base text-slate-900">
                    내 장바구니 ({cartCount})
                  </h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">장바구니가 비어 있습니다.</p>
                    <p className="text-xs text-slate-400">마음에 드는 마켓 상품을 담아보세요!</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover border shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-2">
                            {item.name}
                          </h4>
                          <span className="text-xs font-black text-slate-900 block mt-1">
                            {item.price.toLocaleString()}원
                          </span>
                        </div>
                        <button
                          onClick={() => removeCartItem(item.id)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                        <span className="text-slate-500 font-medium">수량</span>
                        <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                          <button
                            onClick={() => updateCartQuantity(item.id, -1)}
                            className="p-1 text-slate-600 hover:bg-slate-100 rounded-l-md"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 font-bold text-slate-800 text-xs">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.id, 1)}
                            className="p-1 text-slate-600 hover:bg-slate-100 rounded-r-md"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Summary & Checkout */}
              {cartItems.length > 0 && (
                <div className="p-5 border-t border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>상품 금액</span>
                      <span className="font-bold text-slate-900">
                        {cartItems
                          .reduce((acc, item) => acc + item.price * item.quantity, 0)
                          .toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>기본 배송비</span>
                      <span className="font-bold text-slate-900">3,000원</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>총 결제 예정 금액</span>
                      <span className="text-indigo-600 text-base">
                        {(
                          cartItems.reduce(
                            (acc, item) => acc + item.price * item.quantity,
                            0
                          ) + 3000
                        ).toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setIsCartOpen(false)
                      requireAuth(() => {
                        toast({
                          title: '🛡️ 장바구니 에스크로 주문서 작성',
                          description: `총 ${cartCount}건의 상품에 대한 통합 에스크로 주문 결제창으로 이동합니다.`,
                        })
                      })
                    }}
                    className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md"
                  >
                    총 {cartCount}건 주문하기
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. 특가 공동구매 참여 완료 & 바이럴 공유 모달 */}
      {isGroupJoinedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 text-center">
            <button
              onClick={() => setIsGroupJoinedModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mx-auto shadow-inner">
              🎉
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                특가 공동구매 참여(선결제) 완료!
              </h3>
              <p className="text-xs text-slate-500">
                결제 대금은 모꼬 안심 에스크로에 안전하게 예치되었습니다.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 text-left space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-bold">현재 공구 달성률</span>
                <span className="font-black text-rose-600 text-sm">76% (38/50명)</span>
              </div>
              <div className="w-full bg-rose-200/80 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-rose-500 to-pink-600 h-full rounded-full" style={{ width: '76%' }} />
              </div>
              <p className="text-[11px] text-rose-700 font-medium pt-1">
                앞으로 <strong>12명</strong>만 더 모이면 공구가 최종 성사되어 일괄 배송됩니다!
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                onClick={() => {
                  handleShare()
                  setIsGroupJoinedModalOpen(false)
                }}
                className="w-full h-11 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90 text-white font-extrabold text-sm shadow-md shadow-rose-500/20"
              >
                친구 초대 링크 복사하기
              </Button>
              <Button
                onClick={() => {
                  setIsGroupJoinedModalOpen(false)
                  router.push('/?tab=MY')
                }}
                variant="outline"
                className="w-full h-10 rounded-2xl border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50"
              >
                마이모꼬 참여 내역 확인
              </Button>
            </div>

            <p className="text-[10px] text-slate-400 pt-1">
              * 24시간 내 목표 미달성 시 결제 금액은 100% 전액 자동 환불됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

