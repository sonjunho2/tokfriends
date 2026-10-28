/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  MessageCircle,
  Video,
  Send,
  PlusCircle,
  LogIn,
  LogOut,
  Building2,
  Mic,
  Settings,
  HelpCircle,
  Layers,
  Check,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useWebAuth, type UserRole, type MerchantApplication, type CreatorApplication } from '@/lib/auth-context'

// ==========================================
// 1. Data Models
// ==========================================

export interface LiveRoomItem {
  id: string
  title: string
  category: string
  hostNickname: string
  hostAvatar: string
  viewerCount: number
  coverUrl: string
  hasCommerce: boolean
  pinnedProduct?: {
    id: string
    title: string
    price: number
    originalPrice?: number
    image: string
  }
}

export interface ChatMessageItem {
  id: string
  senderId: string
  senderNickname: string
  senderAvatar?: string
  text: string
  time: string
  isMe?: boolean
}

export interface ChatRoomItem {
  id: string
  targetNickname: string
  targetAvatar: string
  lastMessage: string
  lastTime: string
  unreadCount: number
  productInfo?: {
    id: string
    title: string
    price: number
    image: string
  }
  messages: ChatMessageItem[]
}

export interface UsedProductItem {
  id: string
  title: string
  description: string
  price: number
  category: string
  locationName: string
  sellerNickname: string
  sellerAvatar: string
  mannerTemp: number
  images: string[]
  likesCount: number
  chatsCount: number
  createdAt: string
  status: 'ACTIVE' | 'RESERVED' | 'COMPLETED'
}

export interface MarketProductItem {
  id: string
  title: string
  description: string
  price: number
  originalPrice?: number
  type: 'B2C_NORMAL' | 'B2C_GROUP'
  ownerType: 'HEADQUARTERS' | 'MERCHANT'
  isHqDirect?: boolean
  category: string
  images: string[]
  sellerName: string
  shippingFee: number
  stock: number
  status: string
  targetQuantity?: number
  currentQuantity?: number
  affiliateCommissionRate?: number
}

// ==========================================
// 2. Initial Sample Data
// ==========================================

const INITIAL_LIVES: LiveRoomItem[] = [
  {
    id: 'live-01',
    title: '🔴 [본사특가] 당일 도축 제주 흑돼지 1등급 오겹살 & 목살 실시간 구이 먹방 라이브!',
    category: '푸드/라이브커머스',
    hostNickname: '제주푸드 본사 직영',
    hostAvatar: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500',
    viewerCount: 2480,
    coverUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    hasCommerce: true,
    pinnedProduct: {
      id: 'np-001',
      title: '[D LIVE 단독특가] 제주 흑돼지 1등급 오겹살 1kg (산지직송 냉장)',
      price: 28900,
      originalPrice: 38000,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
    },
  },
  {
    id: 'live-02',
    title: '✨ [소통방송] 오늘 밤 판교 직장인의 힐링 토크 & 인생 음향기기 솔직 리뷰',
    category: '소통/토크/IT',
    hostNickname: '별빛소통_민지',
    hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500',
    viewerCount: 1350,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
    hasCommerce: true,
    pinnedProduct: {
      id: 'c2c-1',
      title: '소니 WH-1000XM5 노이즈캔슬링 무선 헤드폰',
      price: 320000,
      originalPrice: 479000,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
    },
  },
  {
    id: 'live-03',
    title: '🍊 제주 유기농 감귤 순수 착즙 원액주스 1000ml 현장 맛보기 방송!',
    category: '건강/신선식품',
    hostNickname: '제주푸드 공식몰',
    hostAvatar: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500',
    viewerCount: 890,
    coverUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800',
    hasCommerce: true,
    pinnedProduct: {
      id: 'np-002',
      title: '제주 유기농 감귤 착즙 원액주스 1000ml 3병 세트',
      price: 24900,
      originalPrice: 29000,
      image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600',
    },
  },
  {
    id: 'live-04',
    title: '☕ 동네 카페 투어 라이브 & 홈카페 감성 인테리어 소품 나눔!',
    category: '일상/취미',
    hostNickname: '카페라떼러버',
    hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
    viewerCount: 620,
    coverUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    hasCommerce: false,
  },
]

const INITIAL_USED_PRODUCTS: UsedProductItem[] = [
  {
    id: 'c2c-1',
    title: '아이폰 15 프로 256GB 내추럴 티타늄 풀박스 (배터리 99%)',
    description: '구매 직후 케이스와 강화유리를 상시 착용하여 흠집 전혀 없는 특S급 상태입니다. 충전 케이블 미사용 풀박스입니다. 역삼역 인근 직거래 또는 안전결제 택배 가능합니다.',
    price: 980000,
    category: '디지털/가전',
    locationName: '서울 강남구 역삼역 3번출구',
    sellerNickname: '테크러버 (인증 이웃)',
    sellerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500',
    mannerTemp: 39.2,
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=800',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800',
    ],
    likesCount: 28,
    chatsCount: 9,
    createdAt: '10분 전',
    status: 'ACTIVE',
  },
  {
    id: 'c2c-2',
    title: '미개봉 소니 WH-1000XM5 노이즈캔슬링 무선 헤드폰 실버',
    description: '선물 받고 비닐도 뜯지 않은 새상품입니다. 국내 정식 발매 정품 영수증 포함입니다.',
    price: 320000,
    category: '디지털/가전',
    locationName: '경기 성남시 판교역 1번출구',
    sellerNickname: '오디오매니아',
    sellerAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=500',
    mannerTemp: 38.5,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    ],
    likesCount: 19,
    chatsCount: 6,
    createdAt: '35분 전',
    status: 'ACTIVE',
  },
  {
    id: 'c2c-3',
    title: '캠핑 감성 우드 롤테이블 120cm + 전용 보관가방',
    description: '실사용 2회로 상판 스크래치 없이 깨끗합니다. 부피가 있어 직접 오셔서 수령 부탁드립니다.',
    price: 45000,
    category: '가구/인테리어',
    locationName: '서울 송파구 잠실새내역',
    sellerNickname: '주말캠퍼',
    sellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
    mannerTemp: 37.8,
    images: [
      'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800',
    ],
    likesCount: 14,
    chatsCount: 4,
    createdAt: '1시간 전',
    status: 'ACTIVE',
  },
  {
    id: 'c2c-4',
    title: '파타고니아 레트로X 후리스 자켓 아이보리 (M사이즈)',
    description: '작년 겨울 백화점에서 구매 후 4~5회 착용 후 드라이 완료하여 보관 중입니다. 보풀 없습니다.',
    price: 135000,
    category: '패션/의류',
    locationName: '서울 마포구 공덕역',
    sellerNickname: '옷장정리중',
    sellerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500',
    mannerTemp: 36.9,
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
    ],
    likesCount: 22,
    chatsCount: 8,
    createdAt: '2시간 전',
    status: 'ACTIVE',
  },
]

const INITIAL_MARKET_PRODUCTS: MarketProductItem[] = [
  {
    id: 'np-001',
    title: '[본사직영] 제주 산지직송 프리미엄 1등급 흑돼지 오겹살 1kg (신선 냉장)',
    description: '제주 청정 농가에서 당일 도축 후 신선 보랭 포장 발송하는 1등급 명품 흑돼지 오겹살입니다.',
    price: 32900,
    originalPrice: 38000,
    type: 'B2C_NORMAL',
    ownerType: 'HEADQUARTERS',
    isHqDirect: true,
    category: '식품/신선',
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
    category: '식품/음료',
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
    category: '식품/과일',
    images: [
      'https://images.unsplash.com/photo-1514756331096-242fdeb7004a?w=800',
    ],
    sellerName: '모꼬(MOCCO) 공구 추진팀',
    shippingFee: 0,
    stock: 20,
    targetQuantity: 20,
    currentQuantity: 14,
    status: 'ACTIVE',
    affiliateCommissionRate: 10.0,
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
    category: '건강/헬스',
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
    id: 'gp-002',
    title: '[특가공구] 호텔식 프리미엄 40수 코마사 순면 수건 10장 세트',
    description: '특급 호텔에서 사용하는 최고급 코마사 40수 200g 도톰한 프리미엄 순면 타월 세트.',
    price: 24000,
    originalPrice: 42000,
    type: 'B2C_GROUP',
    ownerType: 'HEADQUARTERS',
    isHqDirect: true,
    category: '생활/리빙',
    images: [
      'https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=800',
    ],
    sellerName: '모꼬(MOCCO) 리빙 직영',
    shippingFee: 0,
    stock: 50,
    targetQuantity: 30,
    currentQuantity: 22,
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
    category: '생활/가전',
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

const INITIAL_CHAT_ROOMS: ChatRoomItem[] = [
  {
    id: 'chat-01',
    targetNickname: '테크러버 (아이폰 판매자)',
    targetAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500',
    lastMessage: '네! 역삼역 3번출구에서 오늘 저녁 7시 직거래 가능합니다.',
    lastTime: '오후 1:20',
    unreadCount: 1,
    productInfo: {
      id: 'c2c-1',
      title: '아이폰 15 프로 256GB 내추럴 티타늄 풀박스',
      price: 980000,
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=400',
    },
    messages: [
      {
        id: 'msg-1',
        senderId: 'target',
        senderNickname: '테크러버',
        text: '안녕하세요! 등록하신 아이폰 15 프로 상품 문의주셨죠?',
        time: '오후 1:15',
      },
      {
        id: 'msg-2',
        senderId: 'me',
        senderNickname: '나',
        text: '네 오늘 역삼역에서 직거래 가능하신가요? 에스크로 안전결제도 가능할까요?',
        time: '오후 1:18',
        isMe: true,
      },
      {
        id: 'msg-3',
        senderId: 'target',
        senderNickname: '테크러버',
        text: '네! 역삼역 3번출구에서 오늘 저녁 7시 직거래 가능합니다. 에스크로 안전결제 신청해주시면 승인해 드릴게요!',
        time: '오후 1:20',
      },
    ],
  },
  {
    id: 'chat-02',
    targetNickname: '제주푸드 본사 직영',
    targetAvatar: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500',
    lastMessage: '고객님 주문하신 흑돼지 신선 냉장 상품 오늘 정상 출고되었습니다!',
    lastTime: '오전 11:40',
    unreadCount: 0,
    messages: [
      {
        id: 'msg-4',
        senderId: 'target',
        senderNickname: '제주푸드',
        text: '고객님 주문하신 흑돼지 신선 냉장 상품 오늘 정상 출고되었습니다! 송장번호는 CJ 681920391823 입니다.',
        time: '오전 11:40',
      },
    ],
  },
]

type ActiveTab = 'LIVE' | 'CHAT' | 'USED' | 'MARKET'

export default function CustomerWebStorefrontPage() {
  const { toast } = useToast()
  const {
    user,
    role,
    isAuthenticated,
    isLoginModalOpen,
    openLoginModal,
    closeLoginModal,
    isMerchantModalOpen,
    openMerchantModal,
    closeMerchantModal,
    isCreatorModalOpen,
    openCreatorModal,
    closeCreatorModal,
    quickLogin,
    emailLogin,
    switchRole,
    applyMerchant,
    applyCreator,
    logout,
    requireAuth,
  } = useWebAuth()

  // 1. Navigation Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('LIVE')

  // 2. Data States
  const [lives, setLives] = useState<LiveRoomItem[]>(INITIAL_LIVES)
  const [usedProducts, setUsedProducts] = useState<UsedProductItem[]>(INITIAL_USED_PRODUCTS)
  const [marketProducts, setMarketProducts] = useState<MarketProductItem[]>(INITIAL_MARKET_PRODUCTS)
  const [chatRooms, setChatRooms] = useState<ChatRoomItem[]>(INITIAL_CHAT_ROOMS)
  const [activeChatRoom, setActiveChatRoom] = useState<ChatRoomItem | null>(INITIAL_CHAT_ROOMS[0])
  const [chatInputText, setChatInputText] = useState('')

  // 3. Modals
  // Live Viewer Modal
  const [activeLiveModal, setActiveLiveModal] = useState<LiveRoomItem | null>(null)
  const [liveChatInput, setLiveChatInput] = useState('')
  const [liveChatMessages, setLiveChatMessages] = useState<{ sender: string; text: string; isHost?: boolean }[]>([
    { sender: '시스템', text: '다가온 D LIVE 실시간 방송에 오신 것을 환영합니다!' },
    { sender: '고기러버', text: '오겹살 때깔 미쳤네요 바로 주문합니다!' },
    { sender: '제주도민', text: '당일 도축이라 진짜 신선해요 추천!' },
  ])

  // New Live Creation Modal (Creator only)
  const [isStartLiveModalOpen, setIsStartLiveModalOpen] = useState(false)
  const [newLiveTitle, setNewLiveTitle] = useState('')
  const [newLiveCategory, setNewLiveCategory] = useState('소통/토크')

  // Used Product Register Modal
  const [isNewUsedModalOpen, setIsNewUsedModalOpen] = useState(false)
  const [newUsedTitle, setNewUsedTitle] = useState('')
  const [newUsedPrice, setNewUsedPrice] = useState('')
  const [newUsedCategory, setNewUsedCategory] = useState('디지털/가전')
  const [newUsedLocation, setNewUsedLocation] = useState('서울 강남구 역삼역')
  const [newUsedDesc, setNewUsedDesc] = useState('')

  // Product Detail Modal
  const [selectedProduct, setSelectedProduct] = useState<MarketProductItem | null>(null)
  const [selectedUsedItem, setSelectedUsedItem] = useState<UsedProductItem | null>(null)
  const [quantity, setQuantity] = useState(1)

  // Payment Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [checkoutTarget, setCheckoutTarget] = useState<{
    title: string
    price: number
    shippingFee: number
    image: string
    isUsed?: boolean
  } | null>(null)
  const [payMethod, setPayMethod] = useState<'CARD' | 'TOSS_PAY' | 'KAKAO_PAY'>('CARD')
  const [buyerName, setBuyerName] = useState(user?.nickname || '모꼬이웃')
  const [buyerPhone, setBuyerPhone] = useState('010-1234-5678')
  const [shippingAddress, setShippingAddress] = useState('서울특별시 강남구 테헤란로 152 강남파이낸스센터 12층')
  const [isProcessingPay, setIsProcessingPay] = useState(false)

  // QR Modal
  const [isAppDownloadOpen, setIsAppDownloadOpen] = useState(false)

  // Form states for login modal
  const [loginTab, setLoginTab] = useState<'QUICK' | 'EMAIL'>('QUICK')
  const [quickNickInput, setQuickNickInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')

  // Form states for Merchant apply modal
  const [merchantForm, setMerchantForm] = useState<MerchantApplication>({
    businessName: '',
    businessNumber: '',
    representative: '',
    onlineOrderNumber: '',
    contactPhone: '',
    bankName: '국민은행',
    accountNumber: '',
    accountHolder: '',
  })

  // Form states for Creator apply modal
  const [creatorForm, setCreatorForm] = useState<CreatorApplication>({
    channelName: '',
    category: '소통/라이프',
    bio: '',
    activeTime: '매일 저녁 8시',
  })

  // Filter States
  const [marketSubTab, setMarketSubTab] = useState<'ALL' | 'HQ' | 'MERCHANT' | 'GROUP'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Auto scroll chat
  const chatScrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [activeChatRoom?.messages])

  // ==========================================
  // Handlers
  // ==========================================

  // Live Chat Send
  const handleSendLiveChat = () => {
    requireAuth(() => {
      if (!liveChatInput.trim()) return
      setLiveChatMessages((prev) => [
        ...prev,
        { sender: user?.nickname || '나', text: liveChatInput.trim() },
      ])
      setLiveChatInput('')
    })
  }

  // Live Donation (Heart/Gift)
  const handleSendLiveGift = () => {
    requireAuth(() => {
      toast({
        title: '💖 선물 후원 완료!',
        description: `1,000 P가 방송자(${activeLiveModal?.hostNickname})에게 전송되었습니다.`,
      })
      setLiveChatMessages((prev) => [
        ...prev,
        { sender: '시스템', text: `✨ [${user?.nickname}] 님이 1,000 포인트를 후원하셨습니다!` },
      ])
    })
  }

  // Start New Live (Creator only)
  const handleCreateLiveRoom = () => {
    if (!newLiveTitle.trim()) {
      toast({ title: '오류', description: '방송 제목을 입력해주세요.', variant: 'destructive' })
      return
    }
    const newRoom: LiveRoomItem = {
      id: 'live-' + Date.now(),
      title: `🔴 ${newLiveTitle.trim()}`,
      category: newLiveCategory,
      hostNickname: user?.nickname || '크리에이터',
      hostAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500',
      viewerCount: 1,
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
      hasCommerce: true,
      pinnedProduct: {
        id: 'np-001',
        title: '[방송특가] 제주 흑돼지 1등급 오겹살 1kg',
        price: 28900,
        originalPrice: 38000,
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
      },
    }
    setLives([newRoom, ...lives])
    setIsStartLiveModalOpen(false)
    setNewLiveTitle('')
    toast({
      title: '🎉 라이브 방송 시작!',
      description: '실시간 방송이 정상 개설되어 라이브 목록 최상단에 노출됩니다.',
    })
  }

  // Register New Used Product
  const handleRegisterUsedProduct = () => {
    if (!newUsedTitle.trim() || !newUsedPrice) {
      toast({ title: '입력 오류', description: '상품명과 가격을 정확히 입력해주세요.', variant: 'destructive' })
      return
    }
    const numPrice = parseInt(newUsedPrice.replace(/\D/g, ''), 10) || 10000
    const newItem: UsedProductItem = {
      id: 'c2c-' + Date.now(),
      title: newUsedTitle.trim(),
      description: newUsedDesc.trim() || '상태 깨끗하고 좋습니다. 직거래 및 안전결제 환영합니다.',
      price: numPrice,
      category: newUsedCategory,
      locationName: newUsedLocation.trim(),
      sellerNickname: user?.nickname || '인증이웃',
      sellerAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500',
      mannerTemp: 36.5,
      images: [
        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800',
      ],
      likesCount: 0,
      chatsCount: 0,
      createdAt: '방금 전',
      status: 'ACTIVE',
    }
    setUsedProducts([newItem, ...usedProducts])
    setIsNewUsedModalOpen(false)
    setNewUsedTitle('')
    setNewUsedPrice('')
    setNewUsedDesc('')
    toast({
      title: '🥕 중고물품 등록 완료!',
      description: '동네 중고거래 목록에 성공적으로 등록되었습니다.',
    })
  }

  // 1:1 Chat Send
  const handleSendMessage = () => {
    if (!chatInputText.trim() || !activeChatRoom) return
    const newMsg: ChatMessageItem = {
      id: 'm-' + Date.now(),
      senderId: user?.id || 'me',
      senderNickname: user?.nickname || '나',
      text: chatInputText.trim(),
      time: '방금',
      isMe: true,
    }
    const updatedRoom: ChatRoomItem = {
      ...activeChatRoom,
      lastMessage: chatInputText.trim(),
      lastTime: '방금',
      messages: [...activeChatRoom.messages, newMsg],
    }
    setActiveChatRoom(updatedRoom)
    setChatRooms(chatRooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)))
    setChatInputText('')
  }

  // Checkout Execution
  const handleExecutePayment = () => {
    setIsProcessingPay(true)
    setTimeout(() => {
      setIsProcessingPay(false)
      setIsCheckoutOpen(false)
      toast({
        title: '🎉 에스크로 안전결제 주문 완료!',
        description: `주문이 정상 접수되었습니다. 판매자가 발송할 때까지 결제 대금이 안전하게 예치됩니다.`,
      })
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ========================================================= */}
      {/* 1. Global Navigation Bar (GNB) Header                     */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                D
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 bg-clip-text text-transparent">
                    DAGAON
                  </span>
                  <Badge variant="secondary" className="text-[10px] bg-pink-50 text-pink-700 font-semibold border-pink-200">
                    모꼬 웹 포털
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground hidden sm:block">
                  라이브 · 채팅 · 중고거래 · 마켓
                </p>
              </div>
            </Link>

            {/* 4 Core Service Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('LIVE')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'LIVE'
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Radio className="h-4 w-4 animate-pulse text-rose-500" />
                <span>라이브</span>
                <span className="flex h-2 w-2 rounded-full bg-rose-500" />
              </button>

              <button
                onClick={() => setActiveTab('CHAT')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'CHAT'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageCircle className="h-4 w-4 text-blue-500" />
                <span>채팅(1:1톡)</span>
                {isAuthenticated && <span className="rounded-full bg-blue-500 px-1 text-[10px] text-white">1</span>}
              </button>

              <button
                onClick={() => setActiveTab('USED')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'USED'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="h-4 w-4 text-orange-500" />
                <span>동네 중고거래</span>
              </button>

              <button
                onClick={() => setActiveTab('MARKET')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'MARKET'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="h-4 w-4 text-emerald-500" />
                <span>마켓&공구</span>
              </button>
            </nav>
          </div>

          {/* Right Area: User Status, Promotion/Management Buttons, Login */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Guest State */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsAppDownloadOpen(true)}
                  variant="outline"
                  size="sm"
                  className="hidden lg:flex items-center gap-1.5 text-xs text-slate-700"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  앱 다운로드
                </Button>
                <Button
                  onClick={() => openLoginModal()}
                  className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-semibold shadow-sm"
                  size="sm"
                >
                  <LogIn className="h-3.5 w-3.5 mr-1" />
                  로그인 / 가입
                </Button>
              </div>
            ) : (
              /* Authenticated State */
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Point Balance */}
                <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-pink-50 px-2.5 py-1 border border-pink-100">
                  <span className="text-[11px] font-semibold text-pink-600">ON</span>
                  <span className="text-xs font-bold text-pink-700">
                    {(user?.pointBalance || 0).toLocaleString()} P
                  </span>
                </div>

                {/* Role Specific Action & Promotion Buttons */}
                {role === 'USER' && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      onClick={openMerchantModal}
                      variant="outline"
                      size="sm"
                      className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold h-8"
                    >
                      <Building2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                      🏪 입점 신청
                    </Button>
                    <Button
                      onClick={openCreatorModal}
                      variant="outline"
                      size="sm"
                      className="border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold h-8"
                    >
                      <Mic className="h-3.5 w-3.5 mr-1 text-purple-600" />
                      🎙️ 크리에이터 신청
                    </Button>
                  </div>
                )}

                {/* Merchant Role: Dedicated Seller Admin Button */}
                {role === 'MERCHANT' && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      asChild
                      size="sm"
                      className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold shadow h-8"
                    >
                      <Link href="/seller">
                        <Store className="h-3.5 w-3.5 mr-1" />
                        🏪 입점사 셀러 센터
                        <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
                      </Link>
                    </Button>
                    <Button
                      onClick={openCreatorModal}
                      variant="outline"
                      size="sm"
                      className="hidden xl:flex text-xs h-8 border-purple-200 text-purple-700 bg-purple-50"
                    >
                      크리에이터 추가 신청
                    </Button>
                  </div>
                )}

                {/* Creator Role: Dedicated Streamer Studio Button */}
                {role === 'CREATOR' && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      asChild
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white text-xs font-bold shadow h-8"
                    >
                      <Link href="/streamer">
                        <Radio className="h-3.5 w-3.5 mr-1" />
                        🎙️ 크리에이터 스튜디오
                        <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
                      </Link>
                    </Button>
                    <Button
                      onClick={openMerchantModal}
                      variant="outline"
                      size="sm"
                      className="hidden xl:flex text-xs h-8 border-emerald-200 text-emerald-700 bg-emerald-50"
                    >
                      입점사 추가 신청
                    </Button>
                  </div>
                )}

                {/* Admin Role: Company Operations Console */}
                {role === 'ADMIN' && (
                  <Button
                    asChild
                    size="sm"
                    className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white text-xs font-bold shadow h-8"
                  >
                    <Link href="/dashboard">
                      <Crown className="h-3.5 w-3.5 mr-1" />
                      👑 회사 총괄 관리자 콘솔
                      <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
                    </Link>
                  </Button>
                )}

                {/* User Info Avatar & Dropdown */}
                <div className="flex items-center gap-2 pl-1 border-l">
                  <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-slate-600">
                        {user?.nickname?.slice(0, 1) || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold leading-tight truncate max-w-[100px]">
                        {user?.nickname}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-[9px] px-1 py-0 ${
                          role === 'ADMIN'
                            ? 'bg-amber-100 text-amber-800'
                            : role === 'MERCHANT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : role === 'CREATOR'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {role === 'ADMIN'
                          ? '운영진'
                          : role === 'MERCHANT'
                          ? '입점사'
                          : role === 'CREATOR'
                          ? '크리에이터'
                          : '일반회원'}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    onClick={logout}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                    title="로그아웃"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Simulation/Role Quick Switcher (For user testing & inspection) */}
            <div className="hidden 2xl:flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-[11px]">
              <span className="text-muted-foreground mr-1">시연역할:</span>
              <button
                onClick={() => switchRole('GUEST')}
                className={`px-1.5 py-0.5 rounded ${role === 'GUEST' ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-500'}`}
              >
                게스트
              </button>
              <button
                onClick={() => switchRole('USER')}
                className={`px-1.5 py-0.5 rounded ${role === 'USER' ? 'bg-white font-bold text-blue-700 shadow-xs' : 'text-slate-500'}`}
              >
                일반회원
              </button>
              <button
                onClick={() => switchRole('MERCHANT')}
                className={`px-1.5 py-0.5 rounded ${role === 'MERCHANT' ? 'bg-white font-bold text-emerald-700 shadow-xs' : 'text-slate-500'}`}
              >
                입점사
              </button>
              <button
                onClick={() => switchRole('CREATOR')}
                className={`px-1.5 py-0.5 rounded ${role === 'CREATOR' ? 'bg-white font-bold text-purple-700 shadow-xs' : 'text-slate-500'}`}
              >
                크리에이터
              </button>
              <button
                onClick={() => switchRole('ADMIN')}
                className={`px-1.5 py-0.5 rounded ${role === 'ADMIN' ? 'bg-white font-bold text-amber-700 shadow-xs' : 'text-slate-500'}`}
              >
                운영진
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Sub Navigation Bar */}
        <div className="flex md:hidden border-t px-2 py-1.5 bg-slate-50/80 justify-around text-xs font-semibold">
          <button
            onClick={() => setActiveTab('LIVE')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${activeTab === 'LIVE' ? 'text-rose-600 bg-white font-bold shadow-xs' : 'text-slate-600'}`}
          >
            <Radio className="h-3.5 w-3.5 text-rose-500" />
            라이브
          </button>
          <button
            onClick={() => setActiveTab('CHAT')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${activeTab === 'CHAT' ? 'text-blue-600 bg-white font-bold shadow-xs' : 'text-slate-600'}`}
          >
            <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
            채팅
          </button>
          <button
            onClick={() => setActiveTab('USED')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${activeTab === 'USED' ? 'text-orange-600 bg-white font-bold shadow-xs' : 'text-slate-600'}`}
          >
            <Store className="h-3.5 w-3.5 text-orange-500" />
            중고거래
          </button>
          <button
            onClick={() => setActiveTab('MARKET')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${activeTab === 'MARKET' ? 'text-emerald-600 bg-white font-bold shadow-xs' : 'text-slate-600'}`}
          >
            <ShoppingBag className="h-3.5 w-3.5 text-emerald-500" />
            마켓·공구
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. Main Content Area According to Active Tab              */}
      {/* ========================================================= */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* --------------------------------------------------------- */}
        {/* TAB 1: 🔴 라이브 방송 (D LIVE)                            */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'LIVE' && (
          <section className="space-y-6">
            {/* Live Banner & Creator Broadcast Starter */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-900 via-purple-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-ping" />
                  <Badge className="bg-rose-500 text-white font-bold px-2 py-0.5 border-none">
                    D LIVE ON-AIR
                  </Badge>
                  <span className="text-xs text-rose-200">
                    실시간 시청 중인 이웃 5,420명
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  이웃과 나누는 실시간 소통 방송 & 단독 핫딜 라이브
                </h1>
                <p className="text-sm text-slate-300">
                  앱과 웹 어디서든 끊김 없이 실시간 방송을 시청하고, 1:1 인스트림 채팅 참여 및 에스크로 안전결제로 방송 특가 상품을 바로 구매하세요.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {role === 'CREATOR' || role === 'ADMIN' ? (
                    <Button
                      onClick={() => setIsStartLiveModalOpen(true)}
                      className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs sm:text-sm shadow-lg"
                    >
                      <Video className="h-4 w-4 mr-1.5" />
                      내 라이브 방송 시작하기 (스케줄/송출)
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        requireAuth(() => openCreatorModal())
                      }}
                      variant="outline"
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs sm:text-sm font-semibold"
                    >
                      <Mic className="h-4 w-4 mr-1.5 text-purple-300" />
                      나도 크리에이터 신청하고 방송하기
                    </Button>
                  )}

                  <Button
                    onClick={() => setIsAppDownloadOpen(true)}
                    variant="ghost"
                    className="text-slate-300 hover:text-white text-xs sm:text-sm"
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    모바일 앱으로 보기
                  </Button>
                </div>
              </div>

              {/* Background Glow */}
              <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-rose-500/20 blur-3xl" />
              <div className="absolute -bottom-10 right-20 h-72 w-72 rounded-full bg-purple-500/20 blur-2xl" />
            </div>

            {/* Live Rooms Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Radio className="h-5 w-5 text-rose-600" />
                    현재 실시간 진행 중인 라이브 ({lives.length})
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    화면을 클릭하면 웹 라이브 플레이어로 즉시 입장합니다.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {lives.map((room) => (
                  <Card
                    key={room.id}
                    onClick={() => setActiveLiveModal(room)}
                    className="group cursor-pointer overflow-hidden border border-slate-200/80 hover:border-rose-300 hover:shadow-lg transition-all rounded-xl bg-white"
                  >
                    {/* Cover Thumbnail with LIVE badges */}
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                      <img
                        src={room.coverUrl}
                        alt={room.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                      />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <Badge className="bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 border-none shadow-sm flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          LIVE
                        </Badge>
                        <Badge variant="secondary" className="bg-black/60 backdrop-blur-xs text-white text-[10px] border-none">
                          {room.category}
                        </Badge>
                      </div>

                      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 text-white text-xs bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md">
                        <Users2 className="h-3 w-3" />
                        <span>{room.viewerCount.toLocaleString()}명 시청 중</span>
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-3">
                      {/* Host info */}
                      <div className="flex items-center gap-2">
                        <img
                          src={room.hostAvatar}
                          alt={room.hostNickname}
                          className="h-7 w-7 rounded-full object-cover border"
                        />
                        <span className="text-xs font-semibold text-slate-700 truncate">
                          {room.hostNickname}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-rose-600 transition-colors">
                        {room.title}
                      </h3>

                      {/* Pinned Product Link */}
                      {room.pinnedProduct && (
                        <div className="flex items-center gap-2 rounded-lg bg-rose-50/60 p-2 border border-rose-100">
                          <img
                            src={room.pinnedProduct.image}
                            alt={room.pinnedProduct.title}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tight">
                              방송 특가 고정 상품
                            </span>
                            <p className="text-xs font-medium text-slate-800 truncate">
                              {room.pinnedProduct.title}
                            </p>
                            <span className="text-xs font-extrabold text-slate-900">
                              {room.pinnedProduct.price.toLocaleString()}원
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* --------------------------------------------------------- */}
        {/* TAB 2: 💬 실시간 채팅 & 1:1 대화 (CHAT)                   */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'CHAT' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  실시간 1:1 대화 & 중고거래 톡
                </h2>
                <p className="text-xs text-muted-foreground">
                  판매자와 이웃 간 안전거래 및 상품 문의를 웹과 앱에서 실시간으로 대화합니다.
                </p>
              </div>
            </div>

            {/* If Guest: Prompt Login to Use Chat */}
            {!isAuthenticated ? (
              <Card className="p-12 text-center space-y-4 bg-white border-dashed border-2">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <MessageCircle className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">
                    로그인 후 실시간 대화에 참여하세요
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    이웃과의 중고거래 채팅, 라이브 방송자 1:1 문의 등 모든 대화 내역이 모바일 앱과 즉시 동기화됩니다.
                  </p>
                </div>
                <Button
                  onClick={() => openLoginModal()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
                >
                  <LogIn className="h-3.5 w-3.5 mr-1" />
                  간편 로그인하고 대화 시작하기
                </Button>
              </Card>
            ) : (
              /* Authenticated Chat Interface */
              <div className="grid grid-cols-1 md:grid-cols-3 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm h-[650px]">
                {/* Left: Chat Rooms List */}
                <div className="border-r border-slate-100 flex flex-col h-full bg-slate-50/50">
                  <div className="p-3.5 border-b bg-white">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        placeholder="대화 상대 또는 상품명 검색"
                        className="pl-8 text-xs bg-slate-50 h-8"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {chatRooms.map((room) => {
                      const isSelected = activeChatRoom?.id === room.id
                      return (
                        <div
                          key={room.id}
                          onClick={() => setActiveChatRoom(room)}
                          className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-100/70'
                          }`}
                        >
                          <img
                            src={room.targetAvatar}
                            alt={room.targetNickname}
                            className="h-10 w-10 rounded-full object-cover border"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {room.targetNickname}
                              </h4>
                              <span className="text-[10px] text-slate-400">{room.lastTime}</span>
                            </div>
                            <p className="text-xs text-slate-600 truncate mt-0.5">
                              {room.lastMessage}
                            </p>
                            {room.productInfo && (
                              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-blue-600 font-medium bg-blue-50/80 px-2 py-0.5 rounded w-fit">
                                <span>연결상품:</span>
                                <span className="truncate max-w-[140px]">{room.productInfo.title}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Right: Active Chat Conversation */}
                <div className="md:col-span-2 flex flex-col h-full bg-white">
                  {activeChatRoom ? (
                    <>
                      {/* Chat Room Header with Linked Product Card */}
                      <div className="p-3.5 border-b flex items-center justify-between bg-slate-50/40">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={activeChatRoom.targetAvatar}
                            alt={activeChatRoom.targetNickname}
                            className="h-9 w-9 rounded-full object-cover border"
                          />
                          <div>
                            <h3 className="text-xs font-bold text-slate-900">
                              {activeChatRoom.targetNickname}
                            </h3>
                            <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              대화 가능 (온라인)
                            </span>
                          </div>
                        </div>

                        {activeChatRoom.productInfo && (
                          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border shadow-2xs">
                            <img
                              src={activeChatRoom.productInfo.image}
                              alt={activeChatRoom.productInfo.title}
                              className="h-7 w-7 rounded object-cover"
                            />
                            <div className="text-left">
                              <p className="text-[11px] font-bold text-slate-800">
                                {activeChatRoom.productInfo.price.toLocaleString()}원
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                {activeChatRoom.productInfo.title}
                              </p>
                            </div>
                            <Button
                              onClick={() => {
                                setCheckoutTarget({
                                  title: activeChatRoom.productInfo!.title,
                                  price: activeChatRoom.productInfo!.price,
                                  shippingFee: 0,
                                  image: activeChatRoom.productInfo!.image,
                                  isUsed: true,
                                })
                                setIsCheckoutOpen(true)
                              }}
                              size="sm"
                              className="h-6 text-[10px] bg-orange-600 hover:bg-orange-700 text-white font-bold ml-1 px-2"
                            >
                              안전구매
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Messages Stream */}
                      <div
                        ref={chatScrollRef}
                        className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30"
                      >
                        {activeChatRoom.messages.map((m) => {
                          const isMine = m.isMe || m.senderId === user?.id
                          return (
                            <div
                              key={m.id}
                              className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                            >
                              <div className="flex items-end gap-1.5 max-w-[80%]">
                                {!isMine && (
                                  <span className="text-[10px] text-slate-500 font-semibold mb-1">
                                    {m.senderNickname}
                                  </span>
                                )}
                                <div
                                  className={`rounded-2xl px-3.5 py-2 text-xs ${
                                    isMine
                                      ? 'bg-blue-600 text-white rounded-br-xs'
                                      : 'bg-white border text-slate-800 rounded-bl-xs shadow-2xs'
                                  }`}
                                >
                                  {m.text}
                                </div>
                                <span className="text-[9px] text-slate-400 mb-0.5">{m.time}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Chat Input Bar */}
                      <div className="p-3 border-t bg-white flex items-center gap-2">
                        <Input
                          value={chatInputText}
                          onChange={(e) => setChatInputText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="메시지를 입력하세요 (Shift + Enter 줄바꿈)"
                          className="text-xs h-9"
                        />
                        <Button
                          onClick={handleSendMessage}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-3"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                      대화할 채팅방을 좌측에서 선택해주세요.
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* --------------------------------------------------------- */}
        {/* TAB 3: 🥕 동네 중고거래 (C2C USED MARKET)                 */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'USED' && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Store className="h-5 w-5 text-orange-600" />
                  동네 이웃과 믿고 거래하는 중고마켓
                </h2>
                <p className="text-xs text-muted-foreground">
                  직거래 약속부터 에스크로 안전결제 택배 거래까지 안심하고 이용하세요.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    requireAuth(() => setIsNewUsedModalOpen(true))
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm h-9"
                >
                  <PlusCircle className="h-4 w-4 mr-1.5" />
                  중고물품 판매글 작성
                </Button>
              </div>
            </div>

            {/* Used Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {usedProducts.map((item) => (
                <Card
                  key={item.id}
                  onClick={() => setSelectedUsedItem(item)}
                  className="group cursor-pointer overflow-hidden border border-slate-200/80 hover:border-orange-300 hover:shadow-lg transition-all rounded-xl bg-white"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] border-none">
                      {item.category}
                    </Badge>
                  </div>

                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1 truncate max-w-[140px]">
                        <MapPin className="h-3 w-3 text-orange-500" />
                        {item.locationName}
                      </span>
                      <span>{item.createdAt}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {item.title}
                    </h3>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-base font-extrabold text-slate-900">
                        {item.price.toLocaleString()}원
                      </span>
                      <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                        에스크로 안전거래
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t text-[11px] text-slate-500">
                      <span className="truncate">{item.sellerNickname}</span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-0.5">
                          <Heart className="h-3 w-3 text-rose-400" />
                          {item.likesCount}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <MessageCircle className="h-3 w-3 text-blue-400" />
                          {item.chatsCount}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* --------------------------------------------------------- */}
        {/* TAB 4: 🛒 마켓 & 공동구매 (B2C & GROUP)                   */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'MARKET' && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-emerald-600" />
                  본사직영관 · 공식입점사관 · 공동구매 핫딜
                </h2>
                <p className="text-xs text-muted-foreground">
                  검증된 산지직송 식품부터 생활 꿀템까지 공식 보증으로 안심 쇼핑하세요.
                </p>
              </div>

              {/* Sub Filter */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setMarketSubTab('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${marketSubTab === 'ALL' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600'}`}
                >
                  전체보기
                </button>
                <button
                  onClick={() => setMarketSubTab('HQ')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${marketSubTab === 'HQ' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600'}`}
                >
                  본사직영
                </button>
                <button
                  onClick={() => setMarketSubTab('MERCHANT')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${marketSubTab === 'MERCHANT' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600'}`}
                >
                  공식입점사
                </button>
                <button
                  onClick={() => setMarketSubTab('GROUP')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${marketSubTab === 'GROUP' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600'}`}
                >
                  공동구매특가
                </button>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {marketProducts
                .filter((p) => {
                  if (marketSubTab === 'HQ') return p.isHqDirect
                  if (marketSubTab === 'MERCHANT') return p.ownerType === 'MERCHANT'
                  if (marketSubTab === 'GROUP') return p.type === 'B2C_GROUP'
                  return true
                })
                .map((product) => (
                  <Card
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="group cursor-pointer overflow-hidden border border-slate-200/80 hover:border-emerald-300 hover:shadow-lg transition-all rounded-xl bg-white"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        {product.isHqDirect ? (
                          <Badge className="bg-amber-600 text-white font-bold text-[10px] border-none shadow-xs">
                            본사직영
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-600 text-white font-bold text-[10px] border-none shadow-xs">
                            공식입점
                          </Badge>
                        )}
                        {product.type === 'B2C_GROUP' && (
                          <Badge className="bg-rose-600 text-white font-bold text-[10px] border-none">
                            공동구매
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-2">
                      <div className="text-[11px] font-semibold text-slate-500 truncate">
                        {product.sellerName}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                        {product.title}
                      </h3>

                      <div className="pt-1">
                        {product.originalPrice && (
                          <span className="text-xs text-slate-400 line-through mr-1.5">
                            {product.originalPrice.toLocaleString()}원
                          </span>
                        )}
                        <div className="flex items-baseline gap-1.5">
                          {product.originalPrice && (
                            <span className="text-sm font-extrabold text-rose-600">
                              {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                            </span>
                          )}
                          <span className="text-base font-extrabold text-slate-900">
                            {product.price.toLocaleString()}원
                          </span>
                        </div>
                      </div>

                      {product.type === 'B2C_GROUP' && product.targetQuantity && (
                        <div className="pt-2">
                          <div className="flex justify-between text-[11px] mb-1 font-medium">
                            <span className="text-rose-600 font-bold">
                              목표 {product.targetQuantity}박스 중 {product.currentQuantity}박스 달성
                            </span>
                            <span className="text-slate-500">
                              {Math.round(((product.currentQuantity || 0) / product.targetQuantity) * 100)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rose-500 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round(((product.currentQuantity || 0) / product.targetQuantity) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>
        )}
      </main>

      {/* ========================================================= */}
      {/* 3. Global Modals Section                                  */}
      {/* ========================================================= */}

      {/* 1) Login & Register Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border space-y-5">
            <button
              onClick={closeLoginModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white font-bold text-xl shadow-md">
                D
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                다가온(DAGAON) 로그인
              </h3>
              <p className="text-xs text-muted-foreground">
                라이브 방송 시청, 1:1 대화, 중고거래 및 마켓 안전결제를 이용하세요.
              </p>
            </div>

            {/* Quick Login / Email Login Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                onClick={() => setLoginTab('QUICK')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  loginTab === 'QUICK' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                1초 닉네임 간편가입
              </button>
              <button
                onClick={() => setLoginTab('EMAIL')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  loginTab === 'EMAIL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                이메일 / 관리자 계정
              </button>
            </div>

            {loginTab === 'QUICK' ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    사용할 닉네임 입력
                  </label>
                  <Input
                    value={quickNickInput}
                    onChange={(e) => setQuickNickInput(e.target.value)}
                    placeholder="예: 강남이웃_행복 (미입력 시 자동생성)"
                    className="text-xs"
                    autoFocus
                  />
                  <p className="text-[11px] text-muted-foreground">
                    가입 즉시 신규 회원 웰컴 10,000 P가 증정됩니다.
                  </p>
                </div>

                <Button
                  onClick={async () => {
                    await quickLogin(quickNickInput)
                    toast({
                      title: '🎉 회원가입 및 로그인 완료!',
                      description: '일반 회원으로 로그인되었습니다. 웰컴 10,000 P가 지급되었습니다.',
                    })
                  }}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs shadow-md"
                >
                  1초 만에 시작하기
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">이메일</label>
                  <Input
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="admin@tokfriends.com"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">비밀번호</label>
                  <Input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="비밀번호 입력"
                    className="text-xs"
                  />
                </div>

                <Button
                  onClick={async () => {
                    const res = await emailLogin(emailInput, passwordInput)
                    if (res.success) {
                      toast({
                        title: '로그인 성공',
                        description: '성공적으로 인증되었습니다.',
                      })
                    }
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                >
                  로그인
                </Button>
              </div>
            )}

            {/* Quick Demonstration Role Picker */}
            <div className="pt-3 border-t space-y-2 text-center">
              <span className="text-[11px] text-muted-foreground font-semibold">
                원클릭 역할 체험 (개발·검수용):
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                <Button
                  onClick={() => {
                    switchRole('USER')
                    closeLoginModal()
                    toast({ title: '일반 회원 전환', description: '일반 고객 권한으로 로그인되었습니다.' })
                  }}
                  variant="outline"
                  size="sm"
                  className="text-[11px] px-1 h-8 text-blue-700 border-blue-200"
                >
                  일반회원
                </Button>
                <Button
                  onClick={() => {
                    switchRole('MERCHANT')
                    closeLoginModal()
                    toast({ title: '입점사(셀러) 전환', description: '입점사 셀러 센터 버튼이 활성화되었습니다.' })
                  }}
                  variant="outline"
                  size="sm"
                  className="text-[11px] px-1 h-8 text-emerald-700 border-emerald-200"
                >
                  입점사
                </Button>
                <Button
                  onClick={() => {
                    switchRole('CREATOR')
                    closeLoginModal()
                    toast({ title: '크리에이터 전환', description: '크리에이터 스튜디오 버튼이 활성화되었습니다.' })
                  }}
                  variant="outline"
                  size="sm"
                  className="text-[11px] px-1 h-8 text-purple-700 border-purple-200"
                >
                  크리에이터
                </Button>
                <Button
                  onClick={() => {
                    switchRole('ADMIN')
                    closeLoginModal()
                    toast({ title: '본사 운영진 전환', description: '총괄 관리자 콘솔 버튼이 활성화되었습니다.' })
                  }}
                  variant="outline"
                  size="sm"
                  className="text-[11px] px-1 h-8 text-amber-700 border-amber-200"
                >
                  운영진
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2) Merchant Application Modal (입점 신청) */}
      {isMerchantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeMerchantModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold">
                  🏪
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  입점사(판매자) 등록 신청
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                사업자 정보를 입력하고 입점사로 승격되면 즉시 [입점사 셀러 센터]에서 상품을 등록하고 주문을 관리할 수 있습니다.
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">상호명 (법인/개인)</label>
                  <Input
                    value={merchantForm.businessName}
                    onChange={(e) => setMerchantForm({ ...merchantForm, businessName: e.target.value })}
                    placeholder="예: 제주푸드 주식회사"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">사업자등록번호</label>
                  <Input
                    value={merchantForm.businessNumber}
                    onChange={(e) => setMerchantForm({ ...merchantForm, businessNumber: e.target.value })}
                    placeholder="123-45-67890"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">대표자명</label>
                  <Input
                    value={merchantForm.representative}
                    onChange={(e) => setMerchantForm({ ...merchantForm, representative: e.target.value })}
                    placeholder="홍길동"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">대표 연락처</label>
                  <Input
                    value={merchantForm.contactPhone}
                    onChange={(e) => setMerchantForm({ ...merchantForm, contactPhone: e.target.value })}
                    placeholder="010-1234-5678"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">통신판매업 신고번호 (선택)</label>
                <Input
                  value={merchantForm.onlineOrderNumber}
                  onChange={(e) => setMerchantForm({ ...merchantForm, onlineOrderNumber: e.target.value })}
                  placeholder="제2026-서울강남-0123호"
                  className="text-xs"
                />
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border space-y-2">
                <span className="font-bold text-slate-800">정산 계좌 정보</span>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    value={merchantForm.bankName}
                    onChange={(e) => setMerchantForm({ ...merchantForm, bankName: e.target.value })}
                    placeholder="은행명 (국민)"
                    className="text-xs"
                  />
                  <Input
                    value={merchantForm.accountNumber}
                    onChange={(e) => setMerchantForm({ ...merchantForm, accountNumber: e.target.value })}
                    placeholder="계좌번호 (-포함)"
                    className="text-xs col-span-2"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-emerald-50 p-3 text-[11px] text-emerald-800 border border-emerald-200">
                ✅ 입점 신청 즉시 승격 처리되며, 상단에 <strong>[🏪 입점사 셀러 센터]</strong> 버튼이 활성화되어 바로 관리자 화면으로 진입할 수 있습니다.
              </div>
            </div>

            <Button
              onClick={async () => {
                if (!merchantForm.businessName || !merchantForm.businessNumber) {
                  toast({ title: '입력 오류', description: '상호명과 사업자번호를 입력해주세요.', variant: 'destructive' })
                  return
                }
                await applyMerchant(merchantForm)
                toast({
                  title: '🎉 입점사 승격 완료!',
                  description: '상단 네비게이션에 [🏪 입점사 셀러 센터] 버튼이 활성화되었습니다.',
                })
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              입점 신청 및 승격 완료하기
            </Button>
          </div>
        </div>
      )}

      {/* 3) Creator Application Modal (크리에이터 신청) */}
      {isCreatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border space-y-4">
            <button
              onClick={closeCreatorModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 font-bold">
                  🎙️
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  크리에이터(스트리머) 활동 신청
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                크리에이터로 승격되면 누구나 실시간 라이브 소통 방송을 진행하고, 본사 및 입점사 상품을 내 방송에서 위탁 판매하여 커미션을 정산받을 수 있습니다.
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">활동 채널명 / 방송 닉네임</label>
                <Input
                  value={creatorForm.channelName}
                  onChange={(e) => setCreatorForm({ ...creatorForm, channelName: e.target.value })}
                  placeholder="예: 별빛소통 민지 채널"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">방송 주 분야 / 카테고리</label>
                <select
                  value={creatorForm.category}
                  onChange={(e) => setCreatorForm({ ...creatorForm, category: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                >
                  <option value="소통/라이프">소통/일상/힐링 토크</option>
                  <option value="푸드/먹방">푸드/신선식품 라이브커머스</option>
                  <option value="패션/뷰티">패션/뷰티/스타일링</option>
                  <option value="IT/전자기기">IT/전자기기/언박싱</option>
                  <option value="취미/음악">취미/악기/음악 방송</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">채널 소개글</label>
                <Input
                  value={creatorForm.bio}
                  onChange={(e) => setCreatorForm({ ...creatorForm, bio: e.target.value })}
                  placeholder="이웃들과 진솔하게 소통하며 솔직한 리뷰를 전합니다 ✨"
                  className="text-xs"
                />
              </div>

              <div className="rounded-lg bg-purple-50 p-3 text-[11px] text-purple-800 border border-purple-200">
                ✨ 크리에이터 승격 즉시 상단에 <strong>[🎙️ 크리에이터 스튜디오]</strong> 버튼이 활성화되어 방송 개설, 제휴 판매 핀 상품 설정, 커미션 정산을 이용하실 수 있습니다.
              </div>
            </div>

            <Button
              onClick={async () => {
                if (!creatorForm.channelName) {
                  toast({ title: '입력 오류', description: '활동 채널명을 입력해주세요.', variant: 'destructive' })
                  return
                }
                await applyCreator(creatorForm)
                toast({
                  title: '🎉 크리에이터 승격 완료!',
                  description: '상단 네비게이션에 [🎙️ 크리에이터 스튜디오] 버튼이 활성화되었습니다.',
                })
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
            >
              크리에이터 신청 및 승격 완료하기
            </Button>
          </div>
        </div>
      )}

      {/* 4) Interactive Live Viewer Modal */}
      {activeLiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl h-[85vh] rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex flex-col md:flex-row">
            <button
              onClick={() => setActiveLiveModal(null)}
              className="absolute right-4 top-4 z-20 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Left: Video Player Simulation */}
            <div className="relative flex-1 bg-black flex flex-col justify-between p-4 overflow-hidden">
              <img
                src={activeLiveModal.coverUrl}
                alt="stream"
                className="absolute inset-0 h-full w-full object-cover opacity-60"
              />

              {/* Stream Header */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-full text-white">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-bold">LIVE</span>
                  <span className="text-xs text-slate-300">
                    {activeLiveModal.viewerCount.toLocaleString()}명 시청 중
                  </span>
                </div>
              </div>

              {/* Bottom: Floating Pinned Product Card */}
              <div className="relative z-10 space-y-2">
                {activeLiveModal.pinnedProduct && (
                  <div className="flex items-center justify-between rounded-xl bg-black/70 backdrop-blur-md p-3 border border-white/10 text-white">
                    <div className="flex items-center gap-3">
                      <img
                        src={activeLiveModal.pinnedProduct.image}
                        alt="pin"
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div>
                        <span className="text-[10px] font-bold text-rose-400">
                          🔴 방송 단독 특가 상품
                        </span>
                        <h4 className="text-xs font-bold truncate max-w-[200px] sm:max-w-xs">
                          {activeLiveModal.pinnedProduct.title}
                        </h4>
                        <span className="text-sm font-extrabold text-white">
                          {activeLiveModal.pinnedProduct.price.toLocaleString()}원
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        requireAuth(() => {
                          setCheckoutTarget({
                            title: activeLiveModal.pinnedProduct!.title,
                            price: activeLiveModal.pinnedProduct!.price,
                            shippingFee: 0,
                            image: activeLiveModal.pinnedProduct!.image,
                          })
                          setIsCheckoutOpen(true)
                        })
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                      size="sm"
                    >
                      바로구매
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Live Chat & Donation Sidebar */}
            <div className="w-full md:w-80 h-72 md:h-full bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col text-white">
              {/* Host Profile */}
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={activeLiveModal.hostAvatar}
                    alt="host"
                    className="h-8 w-8 rounded-full object-cover border border-slate-700"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {activeLiveModal.hostNickname}
                    </h4>
                    <span className="text-[10px] text-slate-400">{activeLiveModal.category}</span>
                  </div>
                </div>

                <Button
                  onClick={handleSendLiveGift}
                  size="sm"
                  className="h-7 text-[11px] bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold"
                >
                  <Heart className="h-3 w-3 mr-1 fill-white" />
                  선물후원
                </Button>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
                {liveChatMessages.map((msg, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <span className="font-semibold text-rose-400 text-[11px]">
                      {msg.sender}:
                    </span>
                    <span className="text-slate-200 ml-1.5">{msg.text}</span>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-slate-800 flex items-center gap-2">
                <Input
                  value={liveChatInput}
                  onChange={(e) => setLiveChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendLiveChat()}
                  placeholder={isAuthenticated ? '실시간 응원 채팅 입력...' : '로그인 후 채팅 가능'}
                  className="bg-slate-800 border-slate-700 text-white text-xs h-8"
                />
                <Button
                  onClick={handleSendLiveChat}
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white h-8 px-2.5"
                >
                  전송
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5) Used Item Detail Modal */}
      {selectedUsedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedUsedItem(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100">
              <img
                src={selectedUsedItem.images[0]}
                alt={selectedUsedItem.title}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {selectedUsedItem.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {selectedUsedItem.createdAt}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900">
                {selectedUsedItem.title}
              </h2>

              <p className="text-xl font-extrabold text-slate-900">
                {selectedUsedItem.price.toLocaleString()}원
              </p>
            </div>

            {/* Seller Info */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border">
              <div className="flex items-center gap-2.5">
                <img
                  src={selectedUsedItem.sellerAvatar}
                  alt="avatar"
                  className="h-10 w-10 rounded-full object-cover border"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {selectedUsedItem.sellerNickname}
                  </h4>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-orange-500" />
                    {selectedUsedItem.locationName}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-orange-600">
                  {selectedUsedItem.mannerTemp}°C
                </span>
                <p className="text-[10px] text-muted-foreground">매너온도</p>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-700">상품 상세 설명</h4>
              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed bg-slate-50/50 p-3 rounded-lg border">
                {selectedUsedItem.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                onClick={() => {
                  requireAuth(() => {
                    setSelectedUsedItem(null)
                    setActiveTab('CHAT')
                    toast({
                      title: '💬 1:1 대화방 연결',
                      description: `${selectedUsedItem.sellerNickname} 님과의 대화창으로 이동했습니다.`,
                    })
                  })
                }}
                variant="outline"
                className="text-xs font-bold h-10 border-blue-200 text-blue-700 bg-blue-50/50"
              >
                <MessageCircle className="h-4 w-4 mr-1.5" />
                판매자와 1:1 채팅
              </Button>

              <Button
                onClick={() => {
                  requireAuth(() => {
                    setCheckoutTarget({
                      title: selectedUsedItem.title,
                      price: selectedUsedItem.price,
                      shippingFee: 0,
                      image: selectedUsedItem.images[0],
                      isUsed: true,
                    })
                    setSelectedUsedItem(null)
                    setIsCheckoutOpen(true)
                  })
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs h-10 shadow-sm"
              >
                <ShieldCheck className="h-4 w-4 mr-1.5" />
                에스크로 안전구매
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6) Market Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-100">
              <img
                src={selectedProduct.images[0]}
                alt={selectedProduct.title}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{selectedProduct.sellerName}</span>
              <h2 className="text-base font-bold text-slate-900">{selectedProduct.title}</h2>
              <div className="flex items-baseline gap-2 pt-1">
                {selectedProduct.originalPrice && (
                  <span className="text-xs text-slate-400 line-through">
                    {selectedProduct.originalPrice.toLocaleString()}원
                  </span>
                )}
                <span className="text-xl font-extrabold text-slate-900">
                  {selectedProduct.price.toLocaleString()}원
                </span>
                <span className="text-xs text-muted-foreground">
                  배송비: {selectedProduct.shippingFee === 0 ? '무료' : `${selectedProduct.shippingFee.toLocaleString()}원`}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border">
              {selectedProduct.description}
            </p>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between py-2 border-y text-xs">
              <span className="font-semibold text-slate-700">주문 수량</span>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                >
                  -
                </Button>
                <span className="font-bold text-sm">{quantity}</span>
                <Button
                  onClick={() => setQuantity(quantity + 1)}
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                >
                  +
                </Button>
              </div>
            </div>

            <Button
              onClick={() => {
                requireAuth(() => {
                  setCheckoutTarget({
                    title: selectedProduct.title,
                    price: selectedProduct.price * quantity,
                    shippingFee: selectedProduct.shippingFee,
                    image: selectedProduct.images[0],
                  })
                  setSelectedProduct(null)
                  setIsCheckoutOpen(true)
                })
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 shadow-sm"
            >
              에스크로 안전결제 주문하기 (총 {(selectedProduct.price * quantity + selectedProduct.shippingFee).toLocaleString()}원)
            </Button>
          </div>
        </div>
      )}

      {/* 7) Checkout Modal */}
      {isCheckoutOpen && checkoutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border space-y-4">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                에스크로 안전결제 주문
              </h3>
              <p className="text-xs text-muted-foreground">
                구매 확정 시까지 결제 대금이 플랫폼에 안전하게 보관됩니다.
              </p>
            </div>

            {/* Target Item Summary */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border">
              <img
                src={checkoutTarget.image}
                alt="target"
                className="h-12 w-12 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {checkoutTarget.title}
                </h4>
                <p className="text-sm font-extrabold text-slate-900">
                  {(checkoutTarget.price + checkoutTarget.shippingFee).toLocaleString()}원
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">받는 분 성함</label>
                  <Input
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">연락처</label>
                  <Input
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">배송지 주소</label>
                <Input
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">결제 수단</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    onClick={() => setPayMethod('CARD')}
                    variant={payMethod === 'CARD' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-8"
                  >
                    신용/체크카드
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setPayMethod('TOSS_PAY')}
                    variant={payMethod === 'TOSS_PAY' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-8"
                  >
                    토스페이
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setPayMethod('KAKAO_PAY')}
                    variant={payMethod === 'KAKAO_PAY' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-8"
                  >
                    카카오페이
                  </Button>
                </div>
              </div>
            </div>

            <Button
              onClick={handleExecutePayment}
              disabled={isProcessingPay}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-10"
            >
              {isProcessingPay ? '안전결제 승인 진행 중...' : `총 ${(checkoutTarget.price + checkoutTarget.shippingFee).toLocaleString()}원 결제하기`}
            </Button>
          </div>
        </div>
      )}

      {/* 8) New Used Item Modal */}
      {isNewUsedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border space-y-4">
            <button
              onClick={() => setIsNewUsedModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                🥕 중고물품 판매글 작성
              </h3>
              <p className="text-xs text-muted-foreground">
                이웃과 거래할 물품의 정보를 등록하면 즉시 중고마켓에 게시됩니다.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">상품명</label>
                <Input
                  value={newUsedTitle}
                  onChange={(e) => setNewUsedTitle(e.target.value)}
                  placeholder="예: 아이폰 14 128GB 블루"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">희망 판매가격 (원)</label>
                  <Input
                    value={newUsedPrice}
                    onChange={(e) => setNewUsedPrice(e.target.value)}
                    placeholder="예: 450000"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">카테고리</label>
                  <select
                    value={newUsedCategory}
                    onChange={(e) => setNewUsedCategory(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                  >
                    <option value="디지털/가전">디지털/가전</option>
                    <option value="가구/인테리어">가구/인테리어</option>
                    <option value="패션/의류">패션/의류</option>
                    <option value="생활/주방">생활/주방</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">희망 거래 동네</label>
                <Input
                  value={newUsedLocation}
                  onChange={(e) => setNewUsedLocation(e.target.value)}
                  placeholder="예: 서울 강남구 역삼역 3번출구"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">상품 상세 설명</label>
                <Input
                  value={newUsedDesc}
                  onChange={(e) => setNewUsedDesc(e.target.value)}
                  placeholder="상태, 구매 시기, 네고 여부 등"
                  className="text-xs"
                />
              </div>
            </div>

            <Button
              onClick={handleRegisterUsedProduct}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
            >
              판매글 등록하기
            </Button>
          </div>
        </div>
      )}

      {/* 9) Start Live Modal (Creator Only) */}
      {isStartLiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border space-y-4">
            <button
              onClick={() => setIsStartLiveModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Video className="h-5 w-5 text-rose-600" />
                새 라이브 방송 시작하기
              </h3>
              <p className="text-xs text-muted-foreground">
                방송 제목과 카테고리를 설정하면 라이브 탭에 온에어로 노출됩니다.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">방송 제목</label>
                <Input
                  value={newLiveTitle}
                  onChange={(e) => setNewLiveTitle(e.target.value)}
                  placeholder="예: 오늘 밤 이웃들과 함께하는 소통 & 꿀템 소개"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">카테고리</label>
                <select
                  value={newLiveCategory}
                  onChange={(e) => setNewLiveCategory(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                >
                  <option value="소통/토크">소통/토크</option>
                  <option value="푸드/라이브커머스">푸드/라이브커머스</option>
                  <option value="패션/뷰티">패션/뷰티</option>
                  <option value="일상/취미">일상/취미</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleCreateLiveRoom}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              지금 온에어 방송 시작하기
            </Button>
          </div>
        </div>
      )}

      {/* 10) App Download QR Modal */}
      {isAppDownloadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border text-center space-y-4">
            <button
              onClick={() => setIsAppDownloadOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
              <QrCode className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                모꼬(MOCCO) 모바일 앱
              </h3>
              <p className="text-xs text-muted-foreground">
                스마트폰 카메라로 QR 코드를 스캔하여 안드로이드 및 iOS 앱을 즉시 다운로드하세요.
              </p>
            </div>

            <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-xl bg-slate-50 border p-2">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://tokfriends.vercel.app/"
                alt="QR Code"
                className="h-full w-full object-contain"
              />
            </div>

            <p className="text-[11px] text-slate-500">
              라이브 방송 알림 및 1:1 푸시 메시지를 놓치지 마세요!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
