/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Home,
  Store,
  ShoppingBag,
  Radio,
  MessageCircle,
  User,
  Heart,
  Share2,
  ExternalLink,
  CheckCircle2,
  X,
  CreditCard,
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
  ShieldCheck,
  Truck,
  Search,
  Download,
  QrCode,
  ThumbsUp,
  Coins,
  Wallet,
  Award,
  Filter,
  FileText,
  Scale,
  PhoneCall,
  Info,
  Users,
  Trophy,
  Gift,
  MoreVertical,
  Battery,
  Wifi,
  ArrowLeft,
  Phone,
  Camera,
  Ban,
  Play,
  Trash2,
  Sliders,
  Bell,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useWebAuth, type UserRole, type MerchantApplication, type CreatorApplication } from '@/lib/auth-context'
import { RoleSwitcherFloating } from '@/components/common/RoleSwitcherFloating'
import { getLiveTop3Rooms, getLiveRankings } from '@/lib/api'

function RankBadgeImage({ rank, className = 'w-24 h-auto' }: { rank: 1 | 2 | 3; className?: string }) {
  return (
    <img
      src={`/images/rank-badge-${rank}.png`}
      alt={`Rank ${rank}`}
      className={`pointer-events-none drop-shadow-xl shrink-0 object-contain ${className}`}
    />
  )
}

// ==========================================
// 1. Data Models

export interface MoccoChatGiftItem {
  id: string
  name: string
  description: string
  pricePoints: number
  icon: string
  category: 'all' | 'mocco_special' | 'mocco_vip'
}

const MOCCO_CHAT_GIFTS: MoccoChatGiftItem[] = [
  {
    id: 'gift-mocco-1',
    name: '볼빨간 모꼬',
    description: '모꼬가 부끄러워하며 화면에 핑크빛 하트 구름 방울을 퐁퐁 뿜어냅니다 ☁️💖',
    pricePoints: 1000,
    icon: '☁️💖',
    category: 'mocco_special',
  },
  {
    id: 'gift-mocco-2',
    name: '구름카 탄 모꼬',
    description: '모꼬가 핑크빛 오픈카를 타고 화면을 가로지르며 꽃가루 폭죽을 쏘아 올립니다 🚗🎉',
    pricePoints: 5000,
    icon: '🚗🎉',
    category: 'mocco_special',
  },
  {
    id: 'gift-mocco-3',
    name: '골든 킹 모꼬의 축제',
    description: '황금 왕관을 쓴 거대 황금 모꼬가 나타나 화면 전체에 골드 코인과 축제 폭죽을 쏟아붓습니다 👑🪙🎆',
    pricePoints: 30000,
    icon: '👑🪙',
    category: 'mocco_vip',
  },
  {
    id: 'gift-cafe-1',
    name: '달콤 마카롱 세트',
    description: '따뜻한 대화에 달콤한 활력을 주는 5색 프리미엄 마카롱 세트 🍬',
    pricePoints: 3000,
    icon: '🍬',
    category: 'all',
  },
  {
    id: 'gift-cafe-2',
    name: '스타벅스 아메리카노',
    description: '기분 좋은 하루를 응원하는 모바일 커피 쿠폰 ☕',
    pricePoints: 4500,
    icon: '☕',
    category: 'all',
  },
]


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
  isOfficialCreator?: boolean
  rank?: number
  pinnedProduct?: {
    id: string
    title: string
    price: number
    originalPrice?: number
    image: string
  }
}

export interface LiveChatMessageItem {
  sender: string
  text: string
  isSystem?: boolean
  isHost?: boolean
  isGift?: boolean
  gift?: {
    id: string
    name: string
    amount: number
    description: string
    icon?: string
  }
  time?: string
}

export interface ChatMessageItem {
  id: string
  senderId: string
  senderNickname: string
  senderAvatar?: string
  text: string
  time: string
  isMe?: boolean
  gift?: {
    id: string
    name: string
    amount: number
    description: string
    icon?: string
  }
}

export interface ChatRoomItem {
  id: string
  type: 'SUDA' | 'MARKET'
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
  // 실제 서비스 집계 및 랭킹 산출 메트릭
  salesCount?: number        // 누적 실시간 판매량
  orderCount?: number        // 최근 실시간 주문 건수
  rating?: number            // 고객 만족 평점 (예: 4.9)
  reviewCount?: number       // 구매 후기 건수
  deadline?: string          // 공구 마감일/시간 (예: "마감 D-1")
}

export interface SudaPostItem {
  id: string
  nickname: string
  avatar: string
  region: string
  distance?: string
  content: string
  time: string
  likes: number
  comments: number
  isLiked?: boolean
}

export interface NeighborFriendItem {
  id: string
  nickname: string
  avatar: string
  region: string
  distance: string
  mannerTemp: number
  statusMessage: string
  isOnline: boolean
  gender: string
  age: number
}

// ==========================================
// 2. Initial Sample Data (모꼬 리브랜딩)
// ==========================================

const INITIAL_HERO_BANNERS = [
  {
    id: 'hero-1',
    badge: '산지직송 핫딜',
    title: '제주 청정 흑돼지 1등급 오겹살 & 목살 산지직송 라이브 특가',
    desc: '당일 도축 후 신선 보랭 포장 발송! 모꼬 LIVE 단독 35% 파격 할인',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200',
    linkTab: 'LIVE' as const,
  },
  {
    id: 'hero-2',
    badge: '특가 공동구매',
    title: '당도 13Brix 보장 나주 특등급 햇배 5kg 공동구매 오픈!',
    desc: '목표 수량 20박스 달성 시 43% 할인 혜택! 모꼬 이웃 전원 무료배송',
    image: 'https://images.unsplash.com/photo-1514756331096-242fdeb7004a?w=1200',
    linkTab: 'MARKET' as const,
  },
  {
    id: 'hero-3',
    badge: '웰컴 이벤트',
    title: '모꼬 신규 가입 시 웰컴 10,000 ON 포인트 즉시 지급!',
    desc: '라이브 방송 후원, 1:1 대화 입장, 마켓 안전결제 시 현금처럼 사용 가능',
    image: 'https://images.unsplash.com/photo-1556742049-0a67e557224f?w=1200',
    linkTab: 'MY' as const,
  },
]

const INITIAL_LIVES: LiveRoomItem[] = [
  {
    id: 'live-01',
    rank: 1,
    title: '🔴 [본사특가] 당일 도축 제주 흑돼지 1등급 오겹살 & 목살 실시간 구이 먹방 라이브!',
    category: '쇼핑/커머스',
    hostNickname: '제주푸드 본사 직영',
    hostAvatar: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500',
    viewerCount: 2480,
    coverUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    hasCommerce: true,
    isOfficialCreator: true,
    pinnedProduct: {
      id: 'np-001',
      title: '[모꼬 LIVE 단독특가] 제주 흑돼지 1등급 오겹살 1kg (산지직송 냉장)',
      price: 28900,
      originalPrice: 38000,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
    },
  },
  {
    id: 'live-02',
    rank: 2,
    title: '✨ [이웃소통] 오늘 밤 판교 직장인의 힐링 토크 & 인생 음향기기 솔직 리뷰',
    category: '토크/소통',
    hostNickname: '별빛소통_민지 (크리에이터)',
    hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500',
    viewerCount: 1350,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
    hasCommerce: true,
    isOfficialCreator: true,
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
    rank: 3,
    title: '🍊 제주 유기농 감귤 순수 착즙 원액주스 1000ml 현장 맛보기 방송!',
    category: '쇼핑/커머스',
    hostNickname: '제주푸드 공식몰',
    hostAvatar: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500',
    viewerCount: 890,
    coverUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800',
    hasCommerce: true,
    isOfficialCreator: true,
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
    rank: 4,
    title: '☕ [일반회원 자유방송] 동네 카페 투어 라이브 & 홈카페 감성 소통!',
    category: '일상/토크',
    hostNickname: '카페라떼러버 (모꼬 이웃)',
    hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
    viewerCount: 620,
    coverUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    hasCommerce: false,
    isOfficialCreator: false,
  },
  {
    id: 'live-05',
    rank: 5,
    title: '🎤 화이팅 노래 라이브 & 신청곡 어쿠스틱 감성 버스킹',
    category: '음악/소통',
    hostNickname: '혜니',
    hostAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500',
    viewerCount: 556,
    coverUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
    hasCommerce: false,
    isOfficialCreator: true,
  },
  {
    id: 'live-06',
    rank: 6,
    title: '🎮 모바일 배틀그라운드 신맵 탐방 & 동네 이웃 스쿼드 대전',
    category: '게임/e스포츠',
    hostNickname: '게이머_준호',
    hostAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=500',
    viewerCount: 480,
    coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    hasCommerce: false,
    isOfficialCreator: true,
  },
  {
    id: 'live-07',
    rank: 7,
    title: '🍐 나주 햇배 특등급 당도 선별 실시간 패킹 현장 직송',
    category: '산지직송/특가',
    hostNickname: '로컬푸드_나주',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
    viewerCount: 438,
    coverUrl: 'https://images.unsplash.com/photo-1514756331096-242fdeb7004a?w=800',
    hasCommerce: true,
    isOfficialCreator: false,
    pinnedProduct: {
      id: 'gp-001',
      title: '나주 특등급 햇배 5kg (당도 13Brix 보장)',
      price: 19900,
      originalPrice: 35000,
      image: 'https://images.unsplash.com/photo-1514756331096-242fdeb7004a?w=600',
    },
  },
  {
    id: 'live-08',
    rank: 8,
    title: '👗 가을 데일리룩 코디 & 동네 직거래 옷장 털기 라이브',
    category: '패션/뷰티',
    hostNickname: '패션_은지',
    hostAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
    viewerCount: 324,
    coverUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
    hasCommerce: false,
    isOfficialCreator: true,
  },
]

interface LiveRankingItem {
  rank: number
  nickname: string
  avatar: string
  badgeText: string
  scoreText: string
  isLive: boolean
  liveId?: string
}

const LIVE_RANKINGS: LiveRankingItem[] = [
  {
    rank: 1,
    nickname: '별빛소통_민지',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500',
    badgeText: '공식 크리에이터',
    scoreText: '7,006,391 P',
    isLive: true,
    liveId: 'live-02',
  },
  {
    rank: 2,
    nickname: '제주푸드 본사 직영',
    avatar: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500',
    badgeText: '공식 입점사',
    scoreText: '6,568,816 P',
    isLive: true,
    liveId: 'live-01',
  },
  {
    rank: 3,
    nickname: '혜니',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500',
    badgeText: '음악 크리에이터',
    scoreText: '6,403,437 P',
    isLive: true,
    liveId: 'live-05',
  },
  {
    rank: 4,
    nickname: '테크러버',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500',
    badgeText: '인증 이웃',
    scoreText: '6,101,965 P',
    isLive: false,
  },
  {
    rank: 5,
    nickname: '카페라떼러버',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
    badgeText: '모꼬 이웃',
    scoreText: '5,869,450 P',
    isLive: true,
    liveId: 'live-04',
  },
  {
    rank: 6,
    nickname: '게이머_준호',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=500',
    badgeText: '게임 스트리머',
    scoreText: '5,030,438 P',
    isLive: true,
    liveId: 'live-06',
  },
  {
    rank: 7,
    nickname: '로컬푸드_나주',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
    badgeText: '공식 입점사',
    scoreText: '4,520,098 P',
    isLive: true,
    liveId: 'live-07',
  },
  {
    rank: 8,
    nickname: '패션_은지',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
    badgeText: '패션 크리에이터',
    scoreText: '4,049,562 P',
    isLive: true,
    liveId: 'live-08',
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
    title: '[모꼬직영] 제주 산지직송 프리미엄 1등급 흑돼지 오겹살 1kg (신선 냉장)',
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
    salesCount: 3420,
    orderCount: 820,
    rating: 4.9,
    reviewCount: 1280,
  },
  {
    id: 'np-002',
    title: '제주 유기농 감귤 착즙 원액주스 1000ml (3병 선물세트)',
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
    sellerName: '제주푸드 본사 직영',
    shippingFee: 0,
    stock: 80,
    status: 'ACTIVE',
    affiliateCommissionRate: 12.0,
    salesCount: 2890,
    orderCount: 640,
    rating: 4.8,
    reviewCount: 950,
  },
  {
    id: 'gp-003',
    title: '[특가공구] 당일 도축 제주 1++ 한우 꽃등심 500g (냉장 구이용)',
    description: '입에서 사르르 녹는 마블링 No.9 프리미엄 1++ 제주 한우 등심 산지 직송 공구 45% 할인.',
    price: 48900,
    originalPrice: 89000,
    type: 'B2C_GROUP',
    ownerType: 'HEADQUARTERS',
    isHqDirect: true,
    category: '식품/신선',
    images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    ],
    sellerName: '모꼬(MOCCO) 축산 직영',
    shippingFee: 0,
    stock: 50,
    targetQuantity: 50,
    currentQuantity: 46,
    status: 'ACTIVE',
    affiliateCommissionRate: 10.0,
    salesCount: 46,
    orderCount: 46,
    rating: 4.9,
    reviewCount: 38,
    deadline: '마감 D-1',
  },
  {
    id: 'np-003',
    title: '고순도 프리미엄 알티지 오메가3 120캡슐 (4개월분)',
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
    salesCount: 1940,
    orderCount: 480,
    rating: 4.9,
    reviewCount: 710,
  },
  {
    id: 'gp-004',
    title: '[특가공구] 지리산 100% 천연 벌꿀 1.2kg 튜브형 1+1 기획',
    description: '물 한 방울 섞이지 않은 지리산 깊은 숲 자연 숙성 천연 벌꿀 튜브형 공동구매 42% 할인.',
    price: 28000,
    originalPrice: 48000,
    type: 'B2C_GROUP',
    ownerType: 'HEADQUARTERS',
    isHqDirect: true,
    category: '식품/건강',
    images: [
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800',
    ],
    sellerName: '지리산 농가 협동조합',
    shippingFee: 0,
    stock: 40,
    targetQuantity: 40,
    currentQuantity: 34,
    status: 'ACTIVE',
    affiliateCommissionRate: 12.0,
    salesCount: 34,
    orderCount: 34,
    rating: 4.8,
    reviewCount: 29,
    deadline: '마감 D-2',
  },
  {
    id: 'np-004',
    title: '무소음 초음파 감성 아로마 무드등 가습기 500ml',
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
    salesCount: 1350,
    orderCount: 320,
    rating: 4.7,
    reviewCount: 430,
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
    salesCount: 22,
    orderCount: 22,
    rating: 4.8,
    reviewCount: 19,
    deadline: '마감 D-3',
  },
  {
    id: 'np-005',
    title: '[모꼬직영] 지리산 흑돼지 고추장 불고기 밀키트 600g (2인분)',
    description: '국내산 지리산 흑돼지에 특제 비법 고추장 양념을 버무린 초간편 신선 밀키트입니다.',
    price: 16900,
    originalPrice: 24000,
    type: 'B2C_NORMAL',
    ownerType: 'HEADQUARTERS',
    isHqDirect: true,
    category: '식품/신선',
    images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    ],
    sellerName: '모꼬(MOCCO) 본사 직영',
    shippingFee: 3000,
    stock: 120,
    status: 'ACTIVE',
    affiliateCommissionRate: 10.0,
    salesCount: 980,
    orderCount: 260,
    rating: 4.9,
    reviewCount: 320,
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
    salesCount: 14,
    orderCount: 14,
    rating: 4.9,
    reviewCount: 12,
    deadline: '마감 D-2',
  },
  {
    id: 'gp-005',
    title: '[특가공구] 완도 활전복 1kg 10~12미 당일 산지직송 (특가 41% OFF)',
    description: '청정 완도 바다에서 당일 채취하여 해수 산소포장으로 살아있는 채로 배송되는 명품 활전복.',
    price: 34900,
    originalPrice: 59000,
    type: 'B2C_GROUP',
    ownerType: 'MERCHANT',
    isHqDirect: false,
    category: '식품/신선',
    images: [
      'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=800',
    ],
    sellerName: '완도 수산 협동조합',
    shippingFee: 0,
    stock: 60,
    targetQuantity: 60,
    currentQuantity: 38,
    status: 'ACTIVE',
    affiliateCommissionRate: 10.0,
    salesCount: 38,
    orderCount: 38,
    rating: 4.9,
    reviewCount: 25,
    deadline: '마감 D-4',
  },
]

const INITIAL_SUDA_POSTS: SudaPostItem[] = [
  {
    id: 'suda-sua',
    nickname: '수아',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    region: '역삼1동',
    distance: '0.6km',
    time: '5분 전',
    content: '선선해서 양재천 산책하기 딱 좋은 날씨네요! 같이 가벼운 커피 한잔 하실 이웃 계실까요? ☕🌿',
    likes: 8,
    comments: 2,
  },
  {
    id: 'suda-dohyun',
    nickname: '도현',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    region: '역삼2동',
    distance: '1.1km',
    time: '12분 전',
    content: '오늘 야식 메뉴 고민인데 치킨 vs 매운 떡볶이 골라주세요! 추천해주시면 감사해요 🍗🔥',
    likes: 14,
    comments: 5,
  },
  {
    id: 'suda-yujin',
    nickname: '유진',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
    region: '도곡동',
    distance: '1.8km',
    time: '25분 전',
    content: '강아지랑 매봉산 둘레길 가려고 하는데 오늘 산책로 상태 괜찮은가요? 댕댕이 친구 환영! 🐶',
    likes: 19,
    comments: 7,
  },
  {
    id: 'suda-jiwoo',
    nickname: '지우',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    region: '논현1동',
    distance: '2.2km',
    time: '42분 전',
    content: '퇴근길에 예쁜 노을 사진 찍었어요 🌇 다들 오늘 하루도 고생 많으셨습니다 화이팅!',
    likes: 23,
    comments: 3,
  },
]

const INITIAL_FRIENDS: NeighborFriendItem[] = [
  {
    id: 'friend-1',
    nickname: '민지 (모꼬지)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    region: '서울 강남구',
    distance: '0.4km',
    mannerTemp: 39.2,
    statusMessage: '오늘 날씨 너무 좋아요 ☀️ 실시간 소통 환영...',
    isOnline: true,
    gender: '여',
    age: 26,
  },
  {
    id: 'friend-2',
    nickname: '준호',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    region: '전남 여수시',
    distance: '1.2km',
    mannerTemp: 38.5,
    statusMessage: '여수 밤바다 보며 일상 수다 나눌 친구 찾아요 ...',
    isOnline: true,
    gender: '남',
    age: 29,
  },
  {
    id: 'friend-3',
    nickname: '지은',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    region: '전북 전주시',
    distance: '1.8km',
    mannerTemp: 37.8,
    statusMessage: '한옥마을 카페 투어 & 음악 감상 좋아합니다 ☕',
    isOnline: true,
    gender: '여',
    age: 24,
  },
  {
    id: 'friend-4',
    nickname: '도윤',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    region: '부산 해운대구',
    distance: '3.1km',
    mannerTemp: 36.5,
    statusMessage: '비즈니스 & 맛집 정보 공유해요 ✨',
    isOnline: true,
    gender: '남',
    age: 34,
  },
  {
    id: 'friend-5',
    nickname: '하은',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
    region: '경기 성남시 분당',
    distance: '2.5km',
    mannerTemp: 37.2,
    statusMessage: '퇴근 후 소소한 대화 신청 환영해요!',
    isOnline: true,
    gender: '여',
    age: 31,
  },
  {
    id: 'friend-6',
    nickname: '승우',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300',
    region: '대구 수성구',
    distance: '3.4km',
    mannerTemp: 38.2,
    statusMessage: '주말 테니스 & 러닝 함께할 운동 메이트 구해요 🎾',
    isOnline: true,
    gender: '남',
    age: 28,
  },
]

const INITIAL_CHAT_ROOMS: ChatRoomItem[] = [
  {
    id: 'chat-01',
    type: 'MARKET',
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
    type: 'MARKET',
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
  {
    id: 'chat-03',
    type: 'SUDA',
    targetNickname: '민지 (모꼬이웃)',
    targetAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    lastMessage: '안녕하세요! 역삼동 근처 사시나봐요 반가워요 😊',
    lastTime: '어제',
    unreadCount: 0,
    messages: [
      {
        id: 'msg-5',
        senderId: 'target',
        senderNickname: '민지',
        text: '안녕하세요! 역삼동 근처 사시나봐요 반가워요 😊',
        time: '어제 오후 5:10',
      },
    ],
  },
]

// Legal Documents Dictionary for Modal
const LEGAL_DOCUMENTS = {
  'terms-of-service': {
    title: '주식회사 모꼬글로벌 서비스 이용약관',
    category: '전자상거래법 & 약관규제법 준수',
    body: `제1조 (목적)
본 약관은 주식회사 모꼬글로벌(이하 "회사")이 운영하는 모꼬(MOCCO) 웹사이트 및 모바일 애플리케이션(이하 "몰" 또는 "서비스")에서 제공하는 전자상거래 및 실시간 스트리밍, 동네 커뮤니티 서비스를 이용함에 있어 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (통신판매중개자로서의 지위 및 면책)
1. 회사는 통신판매중개자로서 이용자 간의 자유로운 재화 또는 용역의 거래 및 라이브 방송 후원을 위한 전자상거래 시스템을 운영 및 관리, 제공할 뿐입니다.
2. 개별 판매자 및 회원이 등록한 상품의 정보, 배송, 교환, 환불 및 라이브 방송 내용에 대한 책임은 해당 정보를 등록한 당사자에게 있습니다.
3. 단, 회사는 전자상거래 등에서의 소비자보호에 관한 법률(전자상거래법)에 따라 구매자의 안전한 거래를 보장하기 위해 100% 에스크로(매매보호) 서비스를 제공합니다.

제3조 (서비스의 제공 및 변경)
1. 회사는 다음과 같은 서비스를 제공합니다:
  - 동네 기반 실시간 라이브 스트리밍 및 라이브커머스 중개
  - 개인 간 중고물품 매매 중개 (에스크로 안전결제)
  - 본사 직영 및 공식 입점사의 상품 판매 및 공동구매 중개
  - 동네 1줄 수다(SUDA) 및 1:1 대화방 커뮤니티

제4조 (청약철회 및 환불)
1. 회사 및 입점사 상품을 구매한 이용자는 전자상거래법 제17조에 따라 상품 수령 후 7일 이내에 청약철회를 요청할 수 있습니다.
2. 단, 소비자의 귀책사유로 상품이 멸실/훼손된 경우 또는 신선식품 등 시간의 경과에 의해 재판매가 불가능한 상품은 청약철회가 제한될 수 있습니다.`,
  },
  'privacy-policy': {
    title: '주식회사 모꼬글로벌 개인정보처리방침',
    category: '개인정보 보호법 제30조 준수',
    body: `주식회사 모꼬글로벌(이하 "회사")은 정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여, 적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다.

1. 개인정보의 수집 및 이용 목적
- 회원 가입 및 본인 확인, 부정이용 방지
- 상품 주문, 에스크로 결제 이행, 배송 및 정산금 지급
- 위치기반 동네 이웃 추천 및 지역 라이브 방송 추천
- 고객 불만 처리 및 분쟁 조정을 위한 기록 보존

2. 수집하는 개인정보 항목
- 필수 항목: 휴대전화번호, 닉네임, 성별, 연령, 계좌번호(판매자 및 크리에이터)
- 선택 항목: 프로필 사진, 관심사, 행정동 단위 위치정보(동 단위 마스킹)

3. 개인정보의 보유 및 이용 기간
- 회원 탈퇴 시 지체 없이 5일 이내 파기 원칙.
- 관계 법령에 따른 보존:
  • 대금결제 및 재화공급에 관한 기록: 5년 (전자상거래법)
  • 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)
  • 소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)
  • 웹사이트 접속 기록: 3개월 (통신비밀보호법)

4. 개인정보보호책임자
- 성명: 손준호
- 직책: 대표이사 / 개인정보보호책임자 (CPO)
- 문의처: privacy@mocco.kr / 1588-0000`,
  },
  'financial-terms': {
    title: '전자금융거래 이용약관',
    category: '전자금융거래법 준수',
    body: `제1조 (목적)
본 약관은 주식회사 모꼬글로벌(이하 "회사")이 제공하는 전자지급결제대행서비스, 선불전자지급수단(ON 포인트) 발행 및 관리서비스, 결제대금예치(에스크로) 서비스를 이용자가 이용함에 있어 회사와 이용자 간의 전자금융거래의 법률관계를 정하는 것을 목적으로 합니다.

제2조 (결제대금예치서비스 - 에스크로)
1. 회사는 전자상거래 등에서의 소비자보호에 관한 법률 제24조에 따라 선지급식 통신판매에 있어서 소비자가 요청하는 경우 토스페이먼츠 및 제휴 금융기관을 통한 결제대금예치(에스크로) 서비스를 제공합니다.
2. 구매자가 물품을 정상 수령하고 [구매확정]을 완료한 후 또는 법정 기한 내에 이의 제기가 없는 경우에 한하여 판매자에게 대금을 정산 지급합니다.

제3조 (선불전자지급수단 - ON 포인트)
1. 이용자는 계좌이체, 신용카드, 이벤트 리워드 등을 통해 모꼬 ON 포인트를 충전하거나 적립받을 수 있습니다.
2. 적립 및 충전된 포인트는 라이브 방송 후원, 1:1 대화방 입장, 상품 결제에 1 P = 1원의 가치로 사용됩니다.`,
  },
  'youth-protection': {
    title: '청소년보호정책',
    category: '청소년 보호법 준수',
    body: `주식회사 모꼬글로벌은 청소년이 유해한 환경으로부터 보호받고 유익한 매체를 이용할 수 있도록 「청소년 보호법」 및 정보통신윤리위원회 심의규정을 준수하고 있습니다.

1. 유해정보에 대한 청소년접근제한 및 관리조치
회사는 청소년이 아무런 제약 없이 유해미디어 및 성인물에 접근하지 못하도록 별도의 연령인증 장치를 마련하고 있습니다.

2. 청소년보호책임자 및 담당자
- 청소년보호책임자: 손준호 대표이사
- 연락처: youth@mocco.kr / 1588-0000`,
  },
}

// 5 Mobile App Equivalent Tabs
type ActiveTab = 'HOME' | 'MARKET' | 'LIVE' | 'CHAT' | 'MY'

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
    socialLogin,
    emailLogin,
    switchRole,
    applyMerchant,
    applyCreator,
    logout,
    requireAuth,
  } = useWebAuth()

  // 1. Navigation Active Tab (모바일 앱 5대 구조와 100% 동일)
  const [activeTab, setActiveTab] = useState<ActiveTab>('HOME')

  // 2. Sub-tab Filters
  const [marketSubTab, setMarketSubTab] = useState<'C2C_USED' | 'B2C_NORMAL' | 'B2C_GROUP'>('C2C_USED')
  const [chatSubTab, setChatSubTab] = useState<'FRIENDS' | 'SUDA' | 'CHATS'>('FRIENDS')
  const [chatBoxFilter, setChatBoxFilter] = useState<'ALL' | 'SUDA' | 'MARKET'>('ALL')
  const [isGiftPickerOpen, setIsGiftPickerOpen] = useState(false)
  const [activeGiftCategory, setActiveGiftCategory] = useState<'all' | 'mocco_special' | 'mocco_vip'>('all')
  const [activeGiftEffect, setActiveGiftEffect] = useState<{ name: string; icon: string; text: string } | null>(null)
  const [myPoints, setMyPoints] = useState(15000)
  const [friendGenderFilter, setFriendGenderFilter] = useState('전체')
  const [friendAgeFilter, setFriendAgeFilter] = useState('전체')
  const [liveCategoryFilter, setLiveCategoryFilter] = useState<string>('전체')
  const [marketCategoryFilter, setMarketCategoryFilter] = useState<string>('전체')
  const [friendRegionFilter, setFriendRegionFilter] = useState<string>('전체')

  // 3. Location State (동네 설정)
  const [currentLocation, setCurrentLocation] = useState('서울 강남구 역삼1동')
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)

  // 4. Data States
  const [lives, setLives] = useState<LiveRoomItem[]>(INITIAL_LIVES)
  const [top3Lives, setTop3Lives] = useState<LiveRoomItem[]>(INITIAL_LIVES.slice(0, 3))
  const [rankingsList, setRankingsList] = useState<LiveRankingItem[]>(LIVE_RANKINGS)
  const [usedProducts, setUsedProducts] = useState<UsedProductItem[]>(INITIAL_USED_PRODUCTS)
  const [marketProducts, setMarketProducts] = useState<MarketProductItem[]>(INITIAL_MARKET_PRODUCTS)
  const [sudaPosts, setSudaPosts] = useState<SudaPostItem[]>(INITIAL_SUDA_POSTS)
  const [friends, setFriends] = useState<NeighborFriendItem[]>(INITIAL_FRIENDS)
  const [chatRooms, setChatRooms] = useState<ChatRoomItem[]>(INITIAL_CHAT_ROOMS)
  const [activeChatRoom, setActiveChatRoom] = useState<ChatRoomItem | null>(INITIAL_CHAT_ROOMS[0])
  const [chatInputText, setChatInputText] = useState('')
  const [sudaInputText, setSudaInputText] = useState('')
  const [heroIndex, setHeroIndex] = useState(0)

  // 5. Legal Policy Modal State
  const [legalModalOpen, setLegalModalOpen] = useState(false)
  const [selectedLegalSlug, setSelectedLegalSlug] = useState<keyof typeof LEGAL_DOCUMENTS>('privacy-policy')

  // 6. Modals
  // Live Viewer Modal
  const [activeLiveModal, setActiveLiveModal] = useState<LiveRoomItem | null>(null)
  const [liveChatInput, setLiveChatInput] = useState('')
  const [liveChatMessages, setLiveChatMessages] = useState<LiveChatMessageItem[]>([
    { sender: '시스템', text: '모꼬(MOCCO) 실시간 라이브 방송에 오신 것을 환영합니다!', isSystem: true, time: '12:00' },
    { sender: '고기러버', text: '오겹살 때깔 미쳤네요 바로 주문합니다!', time: '12:01' },
    { sender: '제주도민', text: '당일 도축이라 진짜 신선해요 추천!', time: '12:02' },
  ])

  // Live Stream Viewer & 3D Gift States
  const [liveGiftEffect, setLiveGiftEffect] = useState<{
    name: string
    icon: string
    description: string
    sender: string
    amount: number
  } | null>(null)
  const [isLiveGiftPickerOpen, setIsLiveGiftPickerOpen] = useState(false)
  const [liveGiftCategory, setLiveGiftCategory] = useState<'all' | 'mocco_special' | 'mocco_vip'>('all')
  const [isLiveMuted, setIsLiveMuted] = useState(false)
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; color: string; left: number }[]>([])

  // ==========================================
  // 마이모꼬 (MY) 모바일 완전 동기화 상태들
  // ==========================================
  const [sellerRevenue, setSellerRevenue] = useState(185000)
  const [userAge, setUserAge] = useState(26)
  const [userGender, setUserGender] = useState<'여' | '남'>('여')
  const [userHeadline, setUserHeadline] = useState('동네 친구들과 따뜻하고 즐거운 소통 나누고 싶어요 ✨')
  const [chatRoomRate, setChatRoomRate] = useState(300)
  const [videoCallRate, setVideoCallRate] = useState(1000)
  const [notifyChat, setNotifyChat] = useState(true)
  const [notifyLive, setNotifyLive] = useState(true)
  const [notifyNightLimit, setNotifyNightLimit] = useState(false)
  const [cacheSize, setCacheSize] = useState('24.5 MB')
  const [blockedUsers, setBlockedUsers] = useState(['광고스팸러99', '불량유저01'])

  // 마이모꼬 모달 상태
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false)
  const [isRateSettingOpen, setIsRateSettingOpen] = useState(false)
  const [isNotifySettingOpen, setIsNotifySettingOpen] = useState(false)
  const [isBlockedUsersOpen, setIsBlockedUsersOpen] = useState(false)
  const [isSafetyCenterOpen, setIsSafetyCenterOpen] = useState(false)
  const [isCustomerInquiryOpen, setIsCustomerInquiryOpen] = useState(false)
  const [isRewardAdOpen, setIsRewardAdOpen] = useState(false)
  const [rewardAdCountdown, setRewardAdCountdown] = useState(3)
  const [myTradeTab, setMyTradeTab] = useState<'WISHLIST' | 'SALES' | 'ORDERS'>('SALES')

  // 1:1 고객문의 폼
  const [inquiryType, setInquiryType] = useState('거래/결제/정산 문의')
  const [inquiryContact, setInquiryContact] = useState('010-9876-5432')
  const [inquiryContent, setInquiryContent] = useState('')

  // 환전/출금 폼
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const [withdrawBank, setWithdrawBank] = useState('국민은행')
  const [withdrawAccount, setWithdrawAccount] = useState('123-45-678901')
  const [withdrawHolder, setWithdrawHolder] = useState('김모꼬')
  const [withdrawAmount, setWithdrawAmount] = useState('100000')

  // 관심목록 & 구매내역
  const [myWishlist, setMyWishlist] = useState([
    {
      id: 'w-1',
      title: '소니 WH-1000XM5 노이즈캔슬링 무선 헤드폰',
      price: 320000,
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400',
      category: '디지털/가전',
      seller: '헤드폰마니아',
    },
    {
      id: 'w-2',
      title: '[산지직송] 제주도 특급 흑돼지 & 한라봉 세트',
      price: 49900,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
      category: '신선식품',
      seller: '제주푸드 본사 직영',
    },
  ])

  const [myOrdersList, setMyOrdersList] = useState([
    {
      id: 'ord-101',
      title: '소니 WH-1000XM5 노이즈캔슬링 무선 헤드폰',
      price: 320000,
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400',
      statusText: '에스크로 결제완료 (배송준비중)',
      date: '2026-10-29',
      seller: '헤드폰마니아',
    },
  ])

  // 대표 갤러리 슬롯 (최대 9장)
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500',
  ])

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
  const [loginTab, setLoginTab] = useState<'QUICK' | 'EMAIL' | 'QR'>('QUICK')
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

  // My Page Selling Management State
  const [mySalesList, setMySalesList] = useState([
    {
      id: 'my-1',
      title: '소니 WH-1000XM5 노이즈캔슬링 헤드폰 실버 풀박스',
      price: 320000,
      status: 'ACTIVE' as const,
      statusLabel: '판매중',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    },
    {
      id: 'my-2',
      title: 'M2 맥북 에어 15인치 16GB 512GB 스페이스그레이',
      price: 1480000,
      status: 'RESERVED' as const,
      statusLabel: '예약중',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    },
  ])

  // Search query
  const [searchQuery, setSearchQuery] = useState('')

  // Auto scroll chat
  const chatScrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [activeChatRoom?.messages])

  // Load real-time live top 3 and rankings from API
  useEffect(() => {
    getLiveTop3Rooms()
      .then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          const formatted: LiveRoomItem[] = items.map((item, idx) => ({
            id: item.id || `live-top-${idx + 1}`,
            title: item.title,
            category: item.category || '일상/토크',
            hostNickname: item.hostNickname || item.host?.displayName || item.host?.name || '호스트',
            hostAvatar:
              item.hostAvatar ||
              item.host?.avatarUrl ||
              item.host?.avatar ||
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500',
            viewerCount: Number(item.viewerCount || 0),
            coverUrl:
              item.coverUrl ||
              item.coverUri ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
            hasCommerce: Boolean(item.hasCommerce || item.pinnedProduct),
            isOfficialCreator: Boolean(item.isOfficialCreator ?? true),
            rank: item.rank || idx + 1,
            pinnedProduct: item.pinnedProduct,
          }))
          setTop3Lives(formatted)
        }
      })
      .catch(() => {})

    getLiveRankings()
      .then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          setRankingsList(items)
        }
      })
      .catch(() => {})
  }, [])

  // Hero auto-slide
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % INITIAL_HERO_BANNERS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

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

  // Live Donation: Send 3D Mocco Gift with full screen animation and chat sync
  const handleSendLiveGiftItem = (gift: MoccoChatGiftItem) => {
    requireAuth(() => {
      if (!activeLiveModal) return
      if (myPoints < gift.pricePoints) {
        toast({
          title: '포인트 부족',
          description: `보유 온(ON) 포인트가 부족합니다. (필요: ${gift.pricePoints.toLocaleString()} P, 보유: ${myPoints.toLocaleString()} P)`,
          variant: 'destructive',
        })
        return
      }

      setMyPoints((prev) => prev - gift.pricePoints)
      setIsLiveGiftPickerOpen(false)

      const senderName = user?.nickname || '나 (시청자)'
      const giftMsg: LiveChatMessageItem = {
        sender: senderName,
        text: `🎁 [선물] ${gift.name} (${gift.pricePoints.toLocaleString()} ON 후원)`,
        isGift: true,
        gift: {
          id: gift.id,
          name: gift.name,
          amount: gift.pricePoints,
          description: gift.description,
          icon: gift.icon,
        },
        time: '방금',
      }

      setLiveChatMessages((prev) => [...prev, giftMsg])

      // 3D Gift Effect Overlay on Video Player
      setLiveGiftEffect({
        name: gift.name,
        icon: gift.icon,
        description: gift.description,
        sender: senderName,
        amount: gift.pricePoints,
      })
      setTimeout(() => {
        setLiveGiftEffect(null)
      }, 4000)

      toast({
        title: '🎉 모꼬 3D 선물 후원 완료!',
        description: `${gift.name} (${gift.pricePoints.toLocaleString()} ON)을 ${activeLiveModal.hostNickname}님께 선물했습니다!`,
      })
    })
  }

  // Floating Hearts on Tap Cheer
  const handleSendFloatingHeart = () => {
    const colors = ['#FF3B6B', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981']
    const heart = {
      id: Date.now() + Math.random(),
      color: colors[Math.floor(Math.random() * colors.length)],
      left: 50 + Math.random() * 35,
    }
    setFloatingHearts((prev) => [...prev.slice(-15), heart])
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== heart.id))
    }, 1800)
  }

  // Quick 1,000 P gift handler
  const handleSendLiveGift = () => {
    const defaultGift = MOCCO_CHAT_GIFTS[0] // 볼빨간 모꼬 (1,000 P)
    handleSendLiveGiftItem(defaultGift)
  }

  // Post Suda (한 줄 수다)
  const handlePostSuda = () => {
    requireAuth(() => {
      if (!sudaInputText.trim()) return
      const newSuda: SudaPostItem = {
        id: 'suda-' + Date.now(),
        nickname: user?.nickname || '모꼬이웃',
        avatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        region: '역삼1동',
        content: sudaInputText.trim(),
        time: '방금 전',
        likes: 0,
        comments: 0,
      }
      setSudaPosts([newSuda, ...sudaPosts])
      setSudaInputText('')
      toast({
        title: '💬 동네 1줄 수다 등록 완료',
        description: '동네 타임라인에 한 줄 이야기가 등록되었습니다.',
      })
    })
  }

  // Like Suda Post
  const handleLikeSuda = (postId: string) => {
    requireAuth(() => {
      setSudaPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const nextLiked = !p.isLiked
            return {
              ...p,
              isLiked: nextLiked,
              likes: nextLiked ? p.likes + 1 : p.likes - 1,
            }
          }
          return p
        })
      )
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

  // Send Gift inside Mobile Phone Mockup Chat
  const handleSendGift = (gift: MoccoChatGiftItem) => {
    requireAuth(() => {
      if (!activeChatRoom) return
      if (myPoints < gift.pricePoints) {
        toast({
          title: '포인트 부족',
          description: `보유 온(ON) 포인트가 부족합니다. (필요: ${gift.pricePoints.toLocaleString()} P, 보유: ${myPoints.toLocaleString()} P)`,
          variant: 'destructive',
        })
        return
      }

      setMyPoints((prev) => prev - gift.pricePoints)
      setIsGiftPickerOpen(false)

      const giftMsg: ChatMessageItem = {
        id: 'msg-gift-' + Date.now(),
        senderId: user?.id || 'me',
        senderNickname: user?.nickname || '나',
        text: `🎁 [선물] ${gift.name} (${gift.pricePoints.toLocaleString()} P)`,
        time: '방금',
        isMe: true,
        gift: {
          id: gift.id,
          name: gift.name,
          amount: gift.pricePoints,
          description: gift.description,
          icon: gift.icon,
        },
      }

      const updatedRoom: ChatRoomItem = {
        ...activeChatRoom,
        lastMessage: `🎁 ${gift.name} 선물을 보냈습니다!`,
        lastTime: '방금',
        messages: [...activeChatRoom.messages, giftMsg],
      }

      setActiveChatRoom(updatedRoom)
      setChatRooms((prev) => prev.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)))

      // 화려한 3D 축제 이펙트 발동!
      setActiveGiftEffect({
        name: gift.name,
        icon: gift.icon,
        text: gift.description,
      })
      setTimeout(() => {
        setActiveGiftEffect(null)
      }, 3500)

      toast({
        title: '🎉 모꼬 선물 전송 완료!',
        description: `${gift.name} (${gift.pricePoints.toLocaleString()} P)을 ${activeChatRoom.targetNickname}님께 보냈습니다!`,
      })
    })
  }

  // Start chat with neighbor (친구)
  const handleStartNeighborChat = (friend: NeighborFriendItem) => {
    requireAuth(() => {
      const existing = chatRooms.find((r) => r.targetNickname.includes(friend.nickname))
      if (existing) {
        setActiveChatRoom(existing)
      } else {
        const newRoom: ChatRoomItem = {
          id: 'chat-n-' + Date.now(),
          type: 'SUDA',
          targetNickname: friend.nickname,
          targetAvatar: friend.avatar,
          lastMessage: '대화가 시작되었습니다.',
          lastTime: '방금',
          unreadCount: 0,
          messages: [
            {
              id: 'init-1',
              senderId: 'target',
              senderNickname: friend.nickname,
              text: `안녕하세요! ${friend.region}에 사는 ${friend.nickname}입니다. 반가워요! ✨`,
              time: '방금',
            },
          ],
        }
        setChatRooms([newRoom, ...chatRooms])
        setActiveChatRoom(newRoom)
      }
      setActiveTab('CHAT')
      setChatSubTab('CHATS')
      toast({
        title: '💬 대화방 연결',
        description: `${friend.nickname} 님과의 1:1 대화방으로 이동했습니다.`,
      })
    })
  }

  // Start chat from Suda post (전체수다)
  const handleStartSudaChat = (post: SudaPostItem) => {
    requireAuth(() => {
      const existing = chatRooms.find((r) => r.targetNickname.includes(post.nickname))
      if (existing) {
        setActiveChatRoom(existing)
      } else {
        const newRoom: ChatRoomItem = {
          id: 'chat-s-' + Date.now(),
          type: 'SUDA',
          targetNickname: post.nickname,
          targetAvatar: post.avatar,
          lastMessage: post.content,
          lastTime: '방금',
          unreadCount: 0,
          messages: [
            {
              id: 'init-1',
              senderId: 'target',
              senderNickname: post.nickname,
              text: `안녕하세요! "${post.content}" 수다글 보고 대화 신청 드려요 😊`,
              time: '방금',
            },
          ],
        }
        setChatRooms([newRoom, ...chatRooms])
        setActiveChatRoom(newRoom)
      }
      setActiveTab('CHAT')
      setChatSubTab('CHATS')
      toast({
        title: '💬 대화방 연결',
        description: `${post.nickname} 님과의 1:1 대화방으로 이동했습니다.`,
      })
    })
  }

  // Checkout Execution
  const handleExecutePayment = () => {
    setIsProcessingPay(true)
    setTimeout(() => {
      setIsProcessingPay(false)
      setIsCheckoutOpen(false)
      toast({
        title: '🎉 에스크로 안전결제 주문 완료!',
        description: `주문이 정상 접수되었습니다. 판매자가 발송하고 고객님이 구매확정할 때까지 결제 대금이 안전하게 예치됩니다.`,
      })
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between pb-20 md:pb-0">
      <div>
        {/* ========================================================= */}
        {/* 1. Global Navigation Bar (GNB) Header                     */}
        {/* Clean, Unified Mocco Design System                        */}
        {/* ========================================================= */}
        <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            {/* Logo & Brand Name: Bold & Prominent MOCCO */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab('HOME')}
                className="flex items-center group text-left cursor-pointer"
              >
                <span className="font-black text-3xl sm:text-4xl tracking-tighter bg-gradient-to-r from-[#FF3B6B] via-[#E11D48] to-[#8B5CF6] bg-clip-text text-transparent hover:opacity-95 transition-opacity select-none">
                  MOCCO
                </span>
              </button>

              {/* 5 Core App Tabs Navigation (Desktop) */}
              <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
                {/* 1. 모꼬홈 */}
                <button
                  onClick={() => setActiveTab('HOME')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'HOME'
                      ? 'bg-white text-[#FF3B6B] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Home className={`h-4 w-4 ${activeTab === 'HOME' ? 'text-[#FF3B6B]' : 'text-slate-500'}`} />
                  <span>모꼬홈</span>
                </button>

                {/* 2. 모꼬마켓 */}
                <button
                  onClick={() => setActiveTab('MARKET')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'MARKET'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Store className={`h-4 w-4 ${activeTab === 'MARKET' ? 'text-emerald-600' : 'text-slate-500'}`} />
                  <span>모꼬마켓</span>
                </button>

                {/* 3. 모꼬 LIVE (Central Signature Pill) */}
                <button
                  onClick={() => setActiveTab('LIVE')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === 'LIVE'
                      ? 'bg-gradient-to-r from-[#FF3B6B] to-[#8B5CF6] text-white shadow-md shadow-[#FF3B6B]/20'
                      : 'bg-rose-50 text-[#FF3B6B] hover:bg-rose-100'
                  }`}
                >
                  <Radio className={`h-4 w-4 animate-pulse ${activeTab === 'LIVE' ? 'text-white' : 'text-[#FF3B6B]'}`} />
                  <span>모꼬 LIVE</span>
                  <span className={`flex h-2 w-2 rounded-full ${activeTab === 'LIVE' ? 'bg-white animate-ping' : 'bg-[#FF3B6B]'}`} />
                </button>

                {/* 4. 모꼬쳇 */}
                <button
                  onClick={() => setActiveTab('CHAT')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'CHAT'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageCircle className={`h-4 w-4 ${activeTab === 'CHAT' ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>모꼬쳇</span>
                  {isAuthenticated && <span className="rounded-full bg-blue-500 px-1 text-[9px] text-white">1</span>}
                </button>

                {/* 5. 마이모꼬 */}
                <button
                  onClick={() => setActiveTab('MY')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'MY'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className={`h-4 w-4 ${activeTab === 'MY' ? 'text-purple-600' : 'text-slate-500'}`} />
                  <span>마이모꼬</span>
                </button>
              </nav>
            </div>

            {/* Right Area: Search Bar + Clean User Status & Admin Direct Console */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search Bar in GNB Header (replacing App Download button) */}
              <div className="relative flex items-center w-40 sm:w-56 md:w-64 lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && activeTab !== 'MARKET' && activeTab !== 'LIVE') {
                      setActiveTab('MARKET')
                    }
                  }}
                  placeholder="중고 매물, 라이브 방송, 마켓 검색"
                  className="pl-8 pr-3 text-xs h-9 bg-slate-100/90 hover:bg-slate-100 focus:bg-white border-slate-200/80 rounded-full transition-all focus:ring-1 focus:ring-[#FF3B6B]/40"
                />
              </div>

              {!isAuthenticated ? (
                /* Guest State */
                <Button
                  onClick={() => openLoginModal()}
                  className="bg-gradient-to-r from-[#FF3B6B] to-[#8B5CF6] hover:opacity-90 text-white text-xs font-semibold shadow-xs rounded-xl h-9 px-3.5 shrink-0"
                  size="sm"
                >
                  <LogIn className="h-3.5 w-3.5 mr-1" />
                  로그인 / 가입
                </Button>
              ) : (
                /* Authenticated State */
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Dedicated Super Admin Console Button for ADMIN role only */}
                  {role === 'ADMIN' && (
                    <Button
                      asChild
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs h-8 rounded-xl px-3 shrink-0"
                    >
                      <Link href="/dashboard">
                        <Crown className="h-3.5 w-3.5 mr-1 text-amber-400" />
                        회사 총괄 관리자 콘솔
                        <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
                      </Link>
                    </Button>
                  )}

                  {/* User Profile Info & Logout */}
                  <div className="flex items-center gap-2 pl-2 border-l">
                    <button
                      onClick={() => setActiveTab('MY')}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
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
                    </button>

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
            </div>
          </div>
        </header>

        {/* ========================================================= */}
        {/* 2. Main Content Area (5 Mobile-Parity Tabs)               */}
        {/* ========================================================= */}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {/* ======================================================= */}
          {/* TAB 1: 🏠 모꼬홈 (HOME) - 앱 HomeScreen과 100% 일치     */}
          {/* ======================================================= */}
          {activeTab === 'HOME' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* 1) Hero Promotional Carousel */}
              <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl min-h-[220px] sm:min-h-[260px] flex items-center">
                <img
                  src={INITIAL_HERO_BANNERS[heroIndex].image}
                  alt="banner"
                  className="absolute inset-0 h-full w-full object-cover opacity-40 transition-opacity duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
                <div className="relative z-10 p-6 sm:p-10 max-w-2xl space-y-3">
                  <Badge className="bg-pink-500 text-white font-bold border-none text-[11px]">
                    {INITIAL_HERO_BANNERS[heroIndex].badge}
                  </Badge>
                  <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                    {INITIAL_HERO_BANNERS[heroIndex].title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    {INITIAL_HERO_BANNERS[heroIndex].desc}
                  </p>
                  <div className="pt-2">
                    <Button
                      onClick={() => setActiveTab(INITIAL_HERO_BANNERS[heroIndex].linkTab)}
                      className="bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs h-8 sm:h-9 shadow-md rounded-xl"
                    >
                      자세히 보러가기
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Carousel Dots */}
                <div className="absolute bottom-4 right-6 z-10 flex items-center gap-1.5">
                  {INITIAL_HERO_BANNERS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setHeroIndex(i)}
                      className={`h-2 rounded-full transition-all ${
                        heroIndex === i ? 'w-6 bg-pink-500' : 'w-2 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* 2) 🔴 인기 라이브 & 🏆 랭킹 (좌우 높이 및 수직 비율 완벽 동기화 레이아웃) */}
              <section className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
                  {/* Left (3 cols): 인기 라이브 그리드 (2행 4열) */}
                  <div className="lg:col-span-3 space-y-4 flex flex-col">
                    <div className="flex items-center justify-between min-h-[36px]">
                      <div className="flex items-center gap-2">
                        <Radio className="h-5 w-5 text-[#FF3B6B] animate-pulse" />
                        <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">
                          인기 라이브
                        </h3>
                        <Badge className="bg-rose-50 text-[#FF3B6B] border border-rose-200 text-[10px] font-bold">
                          실시간 온에어
                        </Badge>
                      </div>
                      <Button
                        onClick={() => setActiveTab('LIVE')}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
                      >
                        LIVE 전체보기
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>

                    {/* 8-Card Live Grid (2 rows x 4 cols) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 flex-1">
                      {lives.slice(0, 8).map((live) => (
                        <div
                          key={live.id}
                          onClick={() => setActiveLiveModal(live)}
                          className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-rose-200 transition-all cursor-pointer"
                        >
                          {/* Live Cover Photo */}
                          <div className="relative aspect-square w-full bg-slate-950 overflow-hidden">
                            <img
                              src={live.coverUrl}
                              alt={live.title}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                            {/* Live Viewer Badge */}
                            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#FF3B6B] animate-ping" />
                              <Users className="h-3 w-3 text-slate-300" />
                              <span>{live.viewerCount.toLocaleString()}</span>
                            </div>

                            {/* Official Creator Badge */}
                            {live.isOfficialCreator && (
                              <Badge className="absolute top-2 left-2 bg-[#8B5CF6] text-white text-[9px] font-bold border-none px-1.5 py-0">
                                🎙️ 크리에이터
                              </Badge>
                            )}

                            {/* Pinned Product Mini Badge if any */}
                            {live.pinnedProduct && (
                              <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 rounded-xl bg-white/95 p-1 text-slate-900 backdrop-blur-xs shadow-xs">
                                <img
                                  src={live.pinnedProduct.image}
                                  alt="pin"
                                  className="h-5 w-5 rounded-md object-cover shrink-0"
                                />
                                <span className="text-[10px] font-bold text-[#FF3B6B] truncate">
                                  {live.pinnedProduct.price.toLocaleString()}원
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Live Info Underneath */}
                          <div className="p-2.5 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <img
                                src={live.hostAvatar}
                                alt="avatar"
                                className="h-4 w-4 rounded-full object-cover shrink-0 border border-slate-200"
                              />
                              <span className="text-[11px] font-bold text-slate-700 truncate">
                                {live.hostNickname}
                              </span>
                            </div>
                            <h4 className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-[#FF3B6B] transition-colors leading-tight">
                              {live.title}
                            </h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right (1 col): 랭킹 (좌측 8개 카드와 상단선 및 하단 끝선 100% 매칭 & 세로 비율 균등 분할) */}
                  <div className="lg:col-span-1 space-y-4 flex flex-col h-full">
                    <div className="flex items-center justify-between min-h-[36px]">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">
                          랭킹
                        </h3>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-semibold">
                        실시간 Top 8
                      </span>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200/80 p-3.5 shadow-xs divide-y divide-slate-100 flex-1 flex flex-col justify-between">
                      {LIVE_RANKINGS.map((item) => {
                        const isGold = item.rank === 1
                        const isSilver = item.rank === 2
                        const isBronze = item.rank === 3

                        return (
                          <div
                            key={item.rank}
                            onClick={() => {
                              if (item.liveId) {
                                const target = lives.find((l) => l.id === item.liveId)
                                if (target) setActiveLiveModal(target)
                              } else {
                                setActiveTab('LIVE')
                              }
                            }}
                            className="flex-1 flex items-center justify-between py-2 px-2 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Rank Medal / Number */}
                              <div className="w-5 flex items-center justify-center shrink-0">
                                {isGold ? (
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600 font-black text-xs shadow-xs">
                                    <Crown className="h-3 w-3 fill-amber-400 text-amber-500" />
                                  </div>
                                ) : isSilver ? (
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-black text-[11px]">
                                    2
                                  </div>
                                ) : isBronze ? (
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-700/10 text-amber-800 font-black text-[11px]">
                                    3
                                  </div>
                                ) : (
                                  <span className="text-xs font-bold text-slate-400">
                                    {item.rank}
                                  </span>
                                )}
                              </div>

                              {/* Avatar with Online/Live Indicator */}
                              <div className="relative shrink-0">
                                <img
                                  src={item.avatar}
                                  alt={item.nickname}
                                  className={`h-9 w-9 rounded-full object-cover border-2 ${
                                    isGold
                                      ? 'border-amber-400'
                                      : isSilver
                                      ? 'border-slate-300'
                                      : isBronze
                                      ? 'border-amber-600/40'
                                      : 'border-slate-200'
                                  }`}
                                />
                                {item.isLive && (
                                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF3B6B] border border-white" />
                                  </span>
                                )}
                              </div>

                              {/* Nickname & Badge */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-bold text-slate-900 truncate group-hover:text-[#FF3B6B] transition-colors">
                                    {item.nickname}
                                  </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground block truncate">
                                  {item.badgeText}
                                </span>
                              </div>
                            </div>

                            {/* Score / ON Points */}
                            <div className="text-right shrink-0 pl-2">
                              <span className="text-xs font-extrabold text-slate-900 group-hover:text-[#FF3B6B] transition-colors block">
                                {item.scoreText}
                              </span>
                              {item.isLive ? (
                                <span className="text-[9px] font-bold text-[#FF3B6B] bg-rose-50 px-1.5 py-0.2 rounded">
                                  ON AIR
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-400">
                                  오프라인
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {/* 1) 🔥 특가공구 (4칸 - 내용 실시간 연동/갱신) */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-[#FF3B6B]" />
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                      특가공구
                    </h3>
                    <Badge className="bg-rose-50 text-[#FF3B6B] border border-rose-200 text-[10px] font-bold">
                      실시간 달성 중 · 파격 할인 & 무료배송
                    </Badge>
                  </div>
                  <Button
                    onClick={() => {
                      setActiveTab('MARKET')
                      setMarketSubTab('B2C_GROUP')
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-[#FF3B6B] hover:text-[#FF3B6B] hover:bg-rose-50 font-semibold"
                  >
                    공구 더보기
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {marketProducts
                    .filter((p) => p.type === 'B2C_GROUP')
                    .slice(0, 4)
                    .map((item) => {
                      const target = item.targetQuantity || 30
                      const current = item.currentQuantity || 22
                      const rate = Math.round((current / target) * 100)
                      const discountRate = item.originalPrice
                        ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                        : 35

                      return (
                        <Card
                          key={item.id}
                          onClick={() => setSelectedProduct(item)}
                          className="group overflow-hidden rounded-3xl cursor-pointer hover:shadow-lg transition-all border border-slate-200/80 bg-white flex flex-col justify-between"
                        >
                          <div>
                            <div className="aspect-square w-full bg-slate-100 overflow-hidden relative">
                              <img
                                src={item.images[0]}
                                alt={item.title}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                <span className="bg-[#FF3B6B] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                                  공구특가
                                </span>
                                <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  {discountRate}% OFF
                                </span>
                              </div>
                            </div>
                            <CardContent className="p-4 space-y-2">
                              <span className="text-[10px] text-muted-foreground font-semibold block truncate">
                                {item.sellerName}
                              </span>
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-[#FF3B6B] transition-colors">
                                {item.title}
                              </h4>
                              <div className="flex items-baseline gap-2">
                                <span className="font-extrabold text-base text-slate-900">
                                  {item.price.toLocaleString()}원
                                </span>
                                {item.originalPrice && (
                                  <span className="text-xs text-slate-400 line-through">
                                    {item.originalPrice.toLocaleString()}원
                                  </span>
                                )}
                              </div>

                              {/* Progress bar */}
                              <div className="space-y-1 pt-1">
                                <div className="flex items-center justify-between text-[11px] font-semibold">
                                  <span className="text-slate-500">
                                    목표 {target}개 중 {current}개
                                  </span>
                                  <span className="text-[#FF3B6B] font-bold">
                                    {rate}% 달성
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-[#FF3B6B] to-[#8B5CF6] rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, rate)}%` }}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </div>

                          <div className="p-4 pt-0">
                            <Button
                              size="sm"
                              className="w-full h-9 text-xs font-bold bg-rose-50 text-[#FF3B6B] border border-rose-200 hover:bg-gradient-to-r hover:from-[#FF3B6B] hover:to-[#8B5CF6] hover:text-white hover:border-transparent rounded-xl shadow-2xs hover:shadow-md transition-all duration-300"
                            >
                              공구 참여하기
                            </Button>
                          </div>
                        </Card>
                      )
                    })}
                </div>
              </section>

              {/* 2) 👥 좌측 친구들 (50%) & 💬 우측 전체수다 (50%) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* 2-A) 좌측: 친구들 (6명 목록 형식, 우측 수다 카드와 높이 및 비율 완벽 동기화) */}
                <div className="flex flex-col h-full space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#8B5CF6]" />
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                        친구들
                      </h3>
                      <Badge className="bg-purple-50 text-[#8B5CF6] border border-purple-200 text-[10px] font-bold">
                        실시간 접속 이웃
                      </Badge>
                    </div>
                    <Button
                      onClick={() => {
                        setActiveTab('CHAT')
                        setChatSubTab('FRIENDS')
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-purple-50 font-semibold"
                    >
                      친구 더보기
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>

                  <div className="flex-1 bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs divide-y divide-slate-100 flex flex-col justify-between">
                    {friends.slice(0, 6).map((friend) => (
                      <div
                        key={friend.id}
                        className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Round Avatar with Online Status */}
                          <div className="relative shrink-0">
                            <img
                              src={friend.avatar}
                              alt={friend.nickname}
                              className="h-12 w-12 rounded-full object-cover border border-slate-100"
                            />
                            {friend.isOnline && (
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" />
                            )}
                          </div>

                          {/* Info Block */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-sm text-slate-900 truncate">
                                {friend.nickname}
                              </span>
                              <span className="bg-indigo-50 text-indigo-700 text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0">
                                {friend.gender} · {friend.age}세
                              </span>
                              <span className="bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded-md truncate">
                                {friend.region}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 truncate">
                              {friend.statusMessage}
                            </p>
                          </div>
                        </div>

                        {/* Pink Pill Chat Request Button */}
                        <button
                          onClick={() => handleStartNeighborChat(friend)}
                          className="shrink-0 flex items-center gap-1.5 border border-rose-200 text-[#FF3B6B] bg-rose-50/70 hover:bg-rose-100 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all shadow-2xs"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-[#FF3B6B]" />
                          대화신청
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2-B) 우측: 전체수다 (입력창 삭제, 실시간 연동 카드형, 카드 간격 비율 최적화) */}
                <div className="flex flex-col h-full space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-[#FF3B6B]" />
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                        전체수다
                      </h3>
                      <Badge className="bg-rose-50 text-[#FF3B6B] border border-rose-200 text-[10px] font-bold">
                        실시간 타임라인
                      </Badge>
                    </div>
                    <Button
                      onClick={() => {
                        setActiveTab('CHAT')
                        setChatSubTab('SUDA')
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-[#FF3B6B] hover:text-[#FF3B6B] hover:bg-rose-50 font-semibold"
                    >
                      수다 더보기
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>

                  {/* Suda Feed Cards (간격 및 카드 높이 균등 분할) */}
                  <div className="flex-1 flex flex-col justify-between gap-3">
                    {sudaPosts.slice(0, 4).map((post) => (
                      <div
                        key={post.id}
                        className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs hover:border-rose-200 transition-colors space-y-2 flex-1 flex flex-col justify-center"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={post.avatar}
                              alt="avatar"
                              className="h-10 w-10 rounded-full object-cover shrink-0 border border-slate-100"
                            />
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                              <span className="font-bold text-sm text-slate-900 truncate">
                                {post.nickname}
                              </span>
                              <span className="bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded-md font-medium">
                                {post.region}
                              </span>
                              <span className="text-xs text-slate-400">
                                · {post.distance || '0.6km'}
                              </span>
                              <span className="text-xs text-slate-400">
                                {post.time}
                              </span>
                            </div>
                          </div>

                          {/* Pink Pill Chat Request Button */}
                          <button
                            onClick={() => handleStartSudaChat(post)}
                            className="shrink-0 flex items-center gap-1.5 border border-rose-200 text-[#FF3B6B] bg-rose-50/70 hover:bg-rose-100 rounded-full px-3.5 py-1 text-xs font-bold transition-all shadow-2xs"
                          >
                            <MessageCircle className="h-3.5 w-3.5 text-[#FF3B6B]" />
                            대화신청
                          </button>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-1">
                          {post.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3) 🥕 중고거래 (4칸 - 실시간 서버 연동) */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-orange-500" />
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                      중고거래
                    </h3>
                    <Badge className="bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold">
                      100% 에스크로 안전 직거래
                    </Badge>
                  </div>
                  <Button
                    onClick={() => {
                      setActiveTab('MARKET')
                      setMarketSubTab('C2C_USED')
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-orange-700 hover:text-orange-900 hover:bg-orange-50 font-semibold"
                  >
                    중고 더보기
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {usedProducts.slice(0, 4).map((item) => (
                    <Card
                      key={item.id}
                      onClick={() => setSelectedUsedItem(item)}
                      className="group overflow-hidden rounded-3xl cursor-pointer hover:shadow-md transition-shadow border border-slate-200/80 bg-white"
                    >
                      <div className="aspect-square w-full bg-slate-100 overflow-hidden relative">
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <Badge className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] font-semibold border-none">
                          {item.locationName.split(' ')[1] || item.locationName}
                        </Badge>
                      </div>
                      <CardContent className="p-3.5 space-y-1">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                          {item.title}
                        </h4>
                        <p className="font-extrabold text-sm sm:text-base text-slate-900">
                          {item.price.toLocaleString()}원
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                          <span>매너 {item.mannerTemp}℃</span>
                          <span>채팅 {item.chatsCount}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* 4) 🏪 모꼬마켓 (4칸 - 실시간 서버 연동) */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                      모꼬마켓
                    </h3>
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      100% 품질보장 · 신선 산지직송
                    </Badge>
                  </div>
                  <Button
                    onClick={() => {
                      setActiveTab('MARKET')
                      setMarketSubTab('B2C_NORMAL')
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 font-semibold"
                  >
                    마켓 더보기
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {marketProducts
                    .filter((p) => p.type === 'B2C_NORMAL')
                    .slice(0, 4)
                    .map((item) => (
                      <Card
                        key={item.id}
                        onClick={() => setSelectedProduct(item)}
                        className="group overflow-hidden rounded-3xl cursor-pointer hover:shadow-md transition-shadow border border-slate-200/80 bg-white"
                      >
                        <div className="aspect-square w-full bg-slate-100 overflow-hidden relative">
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <Badge className="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] font-bold border-none">
                            {item.isHqDirect ? '본사직영' : '모꼬인증'}
                          </Badge>
                        </div>
                        <CardContent className="p-3.5 space-y-1">
                          <span className="text-[10px] text-muted-foreground font-semibold block truncate">
                            {item.sellerName}
                          </span>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                            {item.title}
                          </h4>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-extrabold text-sm sm:text-base text-slate-900">
                              {item.price.toLocaleString()}원
                            </span>
                            {item.originalPrice && (
                              <span className="text-[10px] text-slate-400 line-through">
                                {item.originalPrice.toLocaleString()}원
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </section>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 2: 🏪 모꼬마켓 (MARKET) - C2C 중고 + B2C 일반 + 공구  */}
          {/* ======================================================= */}
          {activeTab === 'MARKET' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 1) Hero Promotional Carousel (모꼬홈과 동일한 상단 광고 배너 배치) */}
              <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl min-h-[220px] sm:min-h-[260px] flex items-center">
                <img
                  src={INITIAL_HERO_BANNERS[heroIndex].image}
                  alt="banner"
                  className="absolute inset-0 h-full w-full object-cover opacity-40 transition-opacity duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
                <div className="relative z-10 p-6 sm:p-10 max-w-2xl space-y-3">
                  <Badge className="bg-pink-500 text-white font-bold border-none text-[11px]">
                    {INITIAL_HERO_BANNERS[heroIndex].badge}
                  </Badge>
                  <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                    {INITIAL_HERO_BANNERS[heroIndex].title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    {INITIAL_HERO_BANNERS[heroIndex].desc}
                  </p>
                  <div className="pt-2">
                    <Button
                      onClick={() => setActiveTab(INITIAL_HERO_BANNERS[heroIndex].linkTab)}
                      className="bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs h-8 sm:h-9 shadow-md rounded-xl"
                    >
                      자세히 보러가기
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Carousel Indicators */}
                <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5">
                  {INITIAL_HERO_BANNERS.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setHeroIndex(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        heroIndex === idx ? 'w-6 bg-pink-500' : 'w-1.5 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* 2) Market Sub-nav Header (좌측 대형 탭: 중고거래 / 마켓상품 / 공동구매) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                {/* 3 Subtabs on the Left (더 크고 직관적인 좌측 버튼) */}
                <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
                  <button
                    onClick={() => setMarketSubTab('C2C_USED')}
                    className={`flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-extrabold transition-all ${
                      marketSubTab === 'C2C_USED'
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🥕 중고거래</span>
                  </button>
                  <button
                    onClick={() => setMarketSubTab('B2C_NORMAL')}
                    className={`flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-extrabold transition-all ${
                      marketSubTab === 'B2C_NORMAL'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🛒 마켓상품</span>
                  </button>
                  <button
                    onClick={() => setMarketSubTab('B2C_GROUP')}
                    className={`flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-extrabold transition-all ${
                      marketSubTab === 'B2C_GROUP'
                        ? 'bg-white text-rose-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🔥 공동구매</span>
                  </button>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2">
                  {marketSubTab === 'C2C_USED' && (
                    <Button
                      onClick={() => {
                        requireAuth(() => setIsNewUsedModalOpen(true))
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold h-9 sm:h-10 px-4 shadow-sm rounded-xl"
                    >
                      <PlusCircle className="h-4 w-4 mr-1.5" />
                      중고 물품 판매 등록
                    </Button>
                  )}
                  {(role === 'MERCHANT' || role === 'ADMIN') && (
                    <Button
                      asChild
                      variant="outline"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm font-bold h-9 sm:h-10 px-4 rounded-xl"
                    >
                      <Link href="/seller">
                        <Store className="h-4 w-4 mr-1.5" />
                        셀러 센터 상품 등록
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {/* 3) Category Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {['전체', '디지털/가전', '가구/인테리어', '패션/의류', '생활/리빙', '식품/신선'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMarketCategoryFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-full font-semibold shrink-0 transition-colors ${
                      marketCategoryFilter === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* 4-1) 🏆 실시간 인기 마켓상품 (마켓상품 탭 전용: 실시간 주문수 50% + 누적판매량 30% + 고객평점 20% 기준 랭킹 TOP 5) */}
              {marketSubTab === 'B2C_NORMAL' && (
                <section className="bg-gradient-to-b from-purple-50/60 via-white to-white rounded-3xl p-5 sm:p-6 border border-purple-100 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-purple-100/70 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🏆</span>
                        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                          실시간 인기 마켓상품
                        </h3>
                        <span className="bg-purple-100 text-[#8B5CF6] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          LIVE BEST
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        최근 24시간 실시간 주문수(50%) 및 누적 판매량(30%), 고객 만족도(20%) 기준 공식 집계
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      실시간 자동 업데이트 됨
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
                    {marketProducts
                      .filter((p) => p.type === 'B2C_NORMAL')
                      .sort((a, b) => {
                        const scoreA = (a.orderCount || 0) * 0.5 + (a.salesCount || 0) * 0.3 + (a.rating || 0) * 20
                        const scoreB = (b.orderCount || 0) * 0.5 + (b.salesCount || 0) * 0.3 + (b.rating || 0) * 20
                        return scoreB - scoreA
                      })
                      .slice(0, 5)
                      .map((item, idx) => {
                        const rank = idx + 1
                        const discountRate = item.originalPrice
                          ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                          : 20
                        const badges = [
                          '🔥 실시간 주문 1위',
                          '⭐ 재구매 BEST',
                          '🚚 당일 신선출고',
                          '💬 리뷰 만족도 99%',
                          '🎁 모꼬 단독특가',
                        ]
                        const badgeText = badges[idx] || '인기 마켓'

                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedProduct(item)}
                            className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between group"
                          >
                            <div>
                              <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-100 relative mb-2.5">
                                <img
                                  src={item.images[0]}
                                  alt={item.title}
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <span className={`absolute top-2 left-2 text-white text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-2xs ${
                                  idx === 0 ? 'bg-[#FF3B6B]' : 'bg-[#8B5CF6]'
                                }`}>
                                  {badgeText}
                                </span>
                              </div>

                              <div className="flex items-start gap-1.5">
                                <span className={`text-lg sm:text-xl font-black shrink-0 leading-tight ${
                                  idx === 0 ? 'text-[#FF3B6B]' : 'text-slate-900'
                                }`}>
                                  {rank}
                                </span>
                                <h5 className="font-bold text-xs text-slate-800 line-clamp-2 leading-snug group-hover:text-[#FF3B6B] transition-colors">
                                  {item.title}
                                </h5>
                              </div>

                              <div className="flex items-baseline gap-1.5 pt-1 pl-4">
                                <span className="font-extrabold text-xs sm:text-sm text-[#FF3B6B]">
                                  {discountRate}%
                                </span>
                                <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                                  {item.price.toLocaleString()}원
                                </span>
                              </div>

                              {/* 실 서비스 메트릭: 주문건수 및 평점 */}
                              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                                <span>주문 {item.orderCount ? item.orderCount.toLocaleString() : '800+'}건</span>
                                <span className="text-amber-500 font-bold">★ {item.rating || '4.9'}</span>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedProduct(item)
                              }}
                              className="w-full mt-3 py-1.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1 transition-all"
                            >
                              <ShoppingBag className="h-3 w-3 text-slate-500 group-hover:text-purple-600" />
                              <span>담기</span>
                            </button>
                          </div>
                        )
                      })}
                  </div>
                </section>
              )}

              {/* 4-2) 🔥 실시간 인기 공구상품 (공동구매 탭 전용: 목표 달성률 60% + 참여자 수 30% + 마감임박 10% 기준 랭킹 TOP 5) */}
              {marketSubTab === 'B2C_GROUP' && (
                <section className="bg-gradient-to-b from-rose-50/60 via-white to-white rounded-3xl p-5 sm:p-6 border border-rose-100 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-rose-100/70 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🔥</span>
                        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                          실시간 인기 공구상품
                        </h3>
                        <span className="bg-rose-100 text-[#FF3B6B] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          CLOSING SOON
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        목표 수량 달성률(60%) 및 실시간 참여 인원(30%), 마감 잔여시간(10%) 기준 긴급 특가 랭킹
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-rose-500 animate-pulse">
                      ⏰ 목표 달성 시 즉시 마감
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
                    {marketProducts
                      .filter((p) => p.type === 'B2C_GROUP')
                      .sort((a, b) => {
                        const rateA = (a.currentQuantity || 0) / (a.targetQuantity || 1)
                        const rateB = (b.currentQuantity || 0) / (b.targetQuantity || 1)
                        return rateB - rateA
                      })
                      .slice(0, 5)
                      .map((item, idx) => {
                        const rank = idx + 1
                        const discountRate = item.originalPrice
                          ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                          : 35
                        const target = item.targetQuantity || 50
                        const current = item.currentQuantity || 45
                        const progress = Math.min(100, Math.round((current / target) * 100))

                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedProduct(item)}
                            className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between group"
                          >
                            <div>
                              <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-100 relative mb-2.5">
                                <img
                                  src={item.images[0]}
                                  alt={item.title}
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-2 left-2 flex flex-col gap-1">
                                  <span className="bg-[#FF3B6B] text-white text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-2xs">
                                    {item.deadline || '마감임박'}
                                  </span>
                                </div>
                                <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  {progress}% 달성
                                </span>
                              </div>

                              <div className="flex items-start gap-1.5">
                                <span className={`text-lg sm:text-xl font-black shrink-0 leading-tight ${
                                  idx === 0 ? 'text-[#FF3B6B]' : 'text-slate-900'
                                }`}>
                                  {rank}
                                </span>
                                <h5 className="font-bold text-xs text-slate-800 line-clamp-2 leading-snug group-hover:text-[#FF3B6B] transition-colors">
                                  {item.title}
                                </h5>
                              </div>

                              <div className="flex items-baseline gap-1.5 pt-1 pl-4">
                                <span className="font-extrabold text-xs sm:text-sm text-[#FF3B6B]">
                                  {discountRate}%
                                </span>
                                <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                                  {item.price.toLocaleString()}원
                                </span>
                              </div>

                              {/* 실 서비스 공구 달성률 프로그레스 바 */}
                              <div className="mt-2.5 space-y-1">
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-orange-400 to-[#FF3B6B] h-full rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                                  <span>{current}/{target}명 참여</span>
                                  <span className="text-[#FF3B6B] font-extrabold">{progress}%</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedProduct(item)
                              }}
                              className="w-full mt-3 py-1.5 rounded-xl bg-rose-50 text-[#FF3B6B] border border-rose-200 hover:bg-gradient-to-r hover:from-[#FF3B6B] hover:to-[#8B5CF6] hover:text-white hover:border-transparent text-[11px] font-bold flex items-center justify-center gap-1 transition-all duration-300 shadow-2xs hover:shadow-md"
                            >
                              <Flame className="h-3 w-3" />
                              <span>공구 참여</span>
                            </button>
                          </div>
                        )
                      })}
                  </div>
                </section>
              )}

              {/* Market Products Display */}
              {marketSubTab === 'C2C_USED' ? (
                /* 1) C2C Used Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {usedProducts
                    .filter((item) => {
                      const matchCategory = marketCategoryFilter === '전체' ? true : item.category.includes(marketCategoryFilter)
                      const matchSearch = !searchQuery.trim() ? true : (item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase()))
                      return matchCategory && matchSearch
                    })
                    .map((item) => (
                      <Card
                        key={item.id}
                        onClick={() => setSelectedUsedItem(item)}
                        className="group overflow-hidden rounded-3xl cursor-pointer hover:shadow-lg transition-all border border-slate-200/80"
                      >
                        <div className="aspect-square w-full bg-slate-100 overflow-hidden relative">
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <Badge className="absolute top-2 left-2 bg-orange-600 text-white text-[10px] font-bold border-none">
                            🥕 중고
                          </Badge>
                          <Badge className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-semibold border-none">
                            {item.locationName}
                          </Badge>
                        </div>
                        <CardContent className="p-3.5 space-y-2">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                            {item.title}
                          </h4>
                          <div className="flex items-baseline justify-between">
                            <span className="font-extrabold text-sm sm:text-base text-slate-900">
                              {item.price.toLocaleString()}원
                            </span>
                            <span className="text-[11px] text-muted-foreground">{item.createdAt}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                            <span className="font-semibold text-slate-700">매너 {item.mannerTemp}℃</span>
                            <div className="flex items-center gap-2">
                              <span>♥ {item.likesCount}</span>
                              <span>💬 {item.chatsCount}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : marketSubTab === 'B2C_GROUP' ? (
                /* 2) 🔥 공동구매 그리드 (홈 화면의 특가공구 프리미엄 박스 디자인과 100% 동일한 완성도) */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {marketProducts
                    .filter((p) => p.type === 'B2C_GROUP')
                    .filter((p) => {
                      const matchCategory = marketCategoryFilter === '전체' ? true : p.category.includes(marketCategoryFilter)
                      const matchSearch = !searchQuery.trim() ? true : (p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()) || p.sellerName.toLowerCase().includes(searchQuery.toLowerCase()))
                      return matchCategory && matchSearch
                    })
                    .map((item) => {
                      const target = item.targetQuantity || 30
                      const current = item.currentQuantity || 22
                      const rate = Math.round((current / target) * 100)
                      const discountRate = item.originalPrice
                        ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                        : 35

                      return (
                        <Card
                          key={item.id}
                          onClick={() => setSelectedProduct(item)}
                          className="group overflow-hidden rounded-3xl cursor-pointer hover:shadow-lg transition-all border border-slate-200/80 bg-white flex flex-col justify-between"
                        >
                          <div>
                            <div className="aspect-square w-full bg-slate-100 overflow-hidden relative">
                              <img
                                src={item.images[0]}
                                alt={item.title}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                <span className="bg-[#FF3B6B] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                                  공구특가
                                </span>
                                <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  {discountRate}% OFF
                                </span>
                              </div>
                            </div>
                            <CardContent className="p-4 space-y-2">
                              <span className="text-[10px] text-muted-foreground font-semibold block truncate">
                                {item.sellerName}
                              </span>
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-[#FF3B6B] transition-colors">
                                {item.title}
                              </h4>
                              <div className="flex items-baseline gap-2">
                                <span className="font-extrabold text-base text-slate-900">
                                  {item.price.toLocaleString()}원
                                </span>
                                {item.originalPrice && (
                                  <span className="text-xs text-slate-400 line-through">
                                    {item.originalPrice.toLocaleString()}원
                                  </span>
                                )}
                              </div>

                              {/* Progress bar */}
                              <div className="space-y-1 pt-1">
                                <div className="flex items-center justify-between text-[11px] font-semibold">
                                  <span className="text-slate-500">
                                    목표 {target}개 중 {current}개
                                  </span>
                                  <span className="text-[#FF3B6B] font-bold">
                                    {rate}% 달성
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-[#FF3B6B] to-[#8B5CF6] rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, rate)}%` }}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </div>

                          <div className="p-4 pt-0">
                            <Button
                              size="sm"
                              className="w-full h-9 text-xs font-bold bg-rose-50 text-[#FF3B6B] border border-rose-200 hover:bg-gradient-to-r hover:from-[#FF3B6B] hover:to-[#8B5CF6] hover:text-white hover:border-transparent rounded-xl shadow-2xs hover:shadow-md transition-all duration-300"
                            >
                              공구 참여하기
                            </Button>
                          </div>
                        </Card>
                      )
                    })}
                </div>
              ) : (
                /* 3) 🛍️ 일반 마켓상품 그리드 (B2C_NORMAL) */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {marketProducts
                    .filter((p) => p.type === 'B2C_NORMAL')
                    .filter((p) => {
                      const matchCategory = marketCategoryFilter === '전체' ? true : p.category.includes(marketCategoryFilter)
                      const matchSearch = !searchQuery.trim() ? true : (p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()) || p.sellerName.toLowerCase().includes(searchQuery.toLowerCase()))
                      return matchCategory && matchSearch
                    })
                    .map((item) => {
                      const discountRate = item.originalPrice
                        ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                        : 20

                      return (
                        <Card
                          key={item.id}
                          onClick={() => setSelectedProduct(item)}
                          className="group overflow-hidden rounded-3xl cursor-pointer hover:shadow-lg transition-all border border-slate-200/80 bg-white flex flex-col justify-between"
                        >
                          <div>
                            <div className="aspect-square w-full bg-slate-100 overflow-hidden relative">
                              <img
                                src={item.images[0]}
                                alt={item.title}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                <span className="bg-[#8B5CF6] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                                  모꼬특가
                                </span>
                                {discountRate > 0 && (
                                  <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {discountRate}% OFF
                                  </span>
                                )}
                              </div>
                            </div>
                            <CardContent className="p-4 space-y-2">
                              <span className="text-[10px] text-muted-foreground font-semibold block truncate">
                                {item.sellerName}
                              </span>
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-[#FF3B6B] transition-colors">
                                {item.title}
                              </h4>
                              <div className="flex items-baseline gap-2">
                                <span className="font-extrabold text-base text-slate-900">
                                  {item.price.toLocaleString()}원
                                </span>
                                {item.originalPrice && (
                                  <span className="text-xs text-slate-400 line-through">
                                    {item.originalPrice.toLocaleString()}원
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                                <span>주문 {item.orderCount || 500}+건</span>
                                <span className="text-amber-500 font-bold">★ {item.rating || '4.9'}</span>
                              </div>
                            </CardContent>
                          </div>

                          <div className="p-4 pt-0">
                            <Button
                              size="sm"
                              className="w-full h-9 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                            >
                              <ShoppingBag className="h-3.5 w-3.5" />
                              <span>장바구니 담기</span>
                            </Button>
                          </div>
                        </Card>
                      )
                    })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 3: 🔴 모꼬 LIVE (LIVE) - 실시간 핫 라이브 & 베스트 순위 1·2·3위 포디움 & 통합 랭킹 */}
          {/* ======================================================= */}
          {activeTab === 'LIVE' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 1) Live Top Smart Banner (방송 시작 & 크리에이터 신청) */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950 via-purple-950 to-slate-950 p-6 sm:p-7 text-white shadow-xl border border-rose-900/40">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
                      <Badge className="bg-rose-600 text-white font-bold px-2.5 py-0.5 border-none text-[11px] shadow-sm">
                        MOCCO LIVE ON-AIR
                      </Badge>
                      <span className="text-xs text-rose-300 font-medium">
                        실시간 방송 중인 이웃과 함께하는 온에어 라이브
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                      실시간 소통 방송 & 모꼬 특가 단독 핫딜 라이브
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300">
                      모꼬 모바일 앱에서 누구나 손쉽게 라이브 방송을 송출할 수 있으며, 웹에서는 최고화질 시청과 실시간 채팅, 3D 선물 후원을 쾌적하게 즐길 수 있습니다.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-white/20 text-xs">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-slate-200 font-semibold">📱 방송 송출은 모바일 앱 전용입니다</span>
                    </div>

                    {role !== 'CREATOR' && role !== 'ADMIN' && (
                      <Button
                        onClick={() => {
                          requireAuth(() => openCreatorModal())
                        }}
                        variant="outline"
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs sm:text-sm font-semibold h-10 px-3.5 rounded-xl transition-all"
                      >
                        <Mic className="h-4 w-4 mr-1.5 text-purple-300" />
                        크리에이터 승격 신청
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* 2) Main Integrated Grid (좌측 3열: 베스트 123위 + 라이브목록 / 우측 1열: 랭킹) */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* [좌측 메인 영역: lg:col-span-3] */}
                <div className="lg:col-span-3 space-y-7 flex flex-col">
                  {/* (A) 👑 실시간 HOT 모꼬 LIVE BEST TOP 3 (가운데 1위, 좌측 2위, 우측 3위 포디움 시상대) */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">
                          실시간 HOT 모꼬 LIVE BEST TOP 3
                        </h3>
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold">
                          실시간 시청자 + 후원 집계
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        1위 ~ 3위 명예의 전당
                      </span>
                    </div>

                    {/* 포디움 그리드: 상단 엠블럼 오버랩 공간을 확보하기 위해 pt-12 적용 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-end pt-12 sm:pt-14">
                      {/* --- [좌측: 2위 (Silver & Blue)] --- */}
                      {(() => {
                        const item = top3Lives[1] || top3Lives[0] || lives[1] || lives[0]
                        if (!item) return null
                        return (
                          <div
                            onClick={() => setActiveLiveModal(item)}
                            className="group relative flex flex-col rounded-3xl bg-gradient-to-b from-sky-50/90 via-white to-sky-50/30 border-2 border-sky-300 shadow-md hover:shadow-xl hover:border-sky-400 transition-all cursor-pointer overflow-visible order-2 md:order-1"
                          >
                            {/* 상단 2위 배지: 박스 상단 중앙에 오버랩 돌출 배치 (배경 완전 투명) */}
                            <div className="absolute -top-10 sm:-top-11 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
                              <RankBadgeImage rank={2} className="w-22 sm:w-24 h-auto" />
                              <Badge className="bg-sky-600 text-white text-[10px] font-black px-2 py-0.5 border-none shadow-xs -mt-1.5">
                                🥈 실시간 2위
                              </Badge>
                            </div>

                            {/* 박스 상단을 좌우 끝까지 100% 꽉 채우는 Full-Bleed 커버 이미지 */}
                            <div className="relative w-full aspect-[4/3] rounded-t-[22px] overflow-hidden bg-slate-950">
                              <img
                                src={item.coverUrl}
                                alt={item.title}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF3B6B] animate-ping" />
                                <Users className="h-3 w-3 text-slate-300" />
                                <span>{item.viewerCount.toLocaleString()}</span>
                              </div>

                              {item.pinnedProduct && (
                                <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 rounded-xl bg-white/95 p-1 text-slate-900 backdrop-blur-xs shadow-xs">
                                  <img
                                    src={item.pinnedProduct.image}
                                    alt="pin"
                                    className="h-5 w-5 rounded-md object-cover shrink-0"
                                  />
                                  <span className="text-[10px] font-bold text-[#FF3B6B] truncate">
                                    {item.pinnedProduct.price.toLocaleString()}원
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* 호스트 & 정보 패널 */}
                            <div className="p-3.5 space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <img
                                  src={item.hostAvatar}
                                  alt={item.hostNickname}
                                  className="h-5 w-5 rounded-full object-cover border border-sky-200"
                                />
                                <span className="text-xs font-bold text-slate-800 truncate">
                                  {item.hostNickname}
                                </span>
                              </div>
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-sky-600 transition-colors leading-tight">
                                {item.title}
                              </h4>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                                  {item.category}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[11px] px-2.5 rounded-lg border-sky-300 text-sky-700 hover:bg-sky-100 font-bold"
                                >
                                  입장하기
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })()}

                      {/* --- [가운데: 1위 (Gold & Red - The Champion - 가장 높고 돋보임!)] --- */}
                      {(() => {
                        const item = top3Lives[0] || lives[0]
                        if (!item) return null
                        return (
                          <div
                            onClick={() => setActiveLiveModal(item)}
                            className="group relative flex flex-col rounded-3xl bg-gradient-to-b from-amber-500/15 via-white to-rose-500/10 border-2 border-amber-400 shadow-xl shadow-amber-500/15 hover:shadow-2xl hover:border-amber-500 transition-all cursor-pointer overflow-visible order-1 md:order-2 md:-translate-y-2 z-10"
                          >
                            {/* 상단 1위 왕관 배지: 박스 상단 중앙에 오버랩 돌출 배치 (배경 완전 투명) */}
                            <div className="absolute -top-12 sm:-top-14 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
                              <div className="relative">
                                <RankBadgeImage rank={1} className="w-28 sm:w-32 h-auto" />
                                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                                </span>
                              </div>
                              <Badge className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-[11px] font-black px-2.5 py-0.5 border-none shadow-md -mt-2">
                                👑 실시간 1위 · 베스트 LIVE
                              </Badge>
                            </div>

                            {/* 박스 상단을 좌우 끝까지 100% 꽉 채우는 Full-Bleed 커버 이미지 */}
                            <div className="relative w-full aspect-[4/3] rounded-t-[22px] overflow-hidden bg-slate-950">
                              <img
                                src={item.coverUrl}
                                alt={item.title}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25" />

                              {/* 시청자 수 */}
                              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-bold shadow-md">
                                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                                <span>LIVE {item.viewerCount.toLocaleString()}명</span>
                              </div>

                              {item.isOfficialCreator && (
                                <Badge className="absolute top-2.5 left-2.5 bg-[#8B5CF6] text-white text-[10px] font-bold border-none px-2 py-0.5 shadow-sm">
                                  🎙️ 공식 크리에이터
                                </Badge>
                              )}

                              {item.pinnedProduct && (
                                <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 rounded-xl bg-white/95 p-1.5 text-slate-900 backdrop-blur-xs shadow-md">
                                  <img
                                    src={item.pinnedProduct.image}
                                    alt="pin"
                                    className="h-6 w-6 rounded-lg object-cover shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-bold text-slate-800 truncate">
                                      {item.pinnedProduct.title}
                                    </p>
                                  </div>
                                  <span className="text-[11px] font-black text-rose-600 shrink-0">
                                    {item.pinnedProduct.price.toLocaleString()}원
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* 호스트 & 정보 패널 */}
                            <div className="p-3.5 space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <img
                                    src={item.hostAvatar}
                                    alt={item.hostNickname}
                                    className="h-6 w-6 rounded-full object-cover border-2 border-amber-400 shadow-xs"
                                  />
                                  <Crown className="h-3 w-3 absolute -top-1 -right-1 text-amber-500 fill-amber-400" />
                                </div>
                                <span className="text-xs font-extrabold text-slate-900 truncate">
                                  {item.hostNickname}
                                </span>
                              </div>
                              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-rose-600 transition-colors leading-tight">
                                {item.title}
                              </h4>
                              <div className="flex items-center justify-between pt-1">
                                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold text-[10px]">
                                  {item.category}
                                </span>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs px-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold shadow-sm"
                                >
                                  실시간 시청하기
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })()}

                      {/* --- [우측: 3위 (Bronze & Orange)] --- */}
                      {(() => {
                        const item = top3Lives[2] || top3Lives[0] || lives[2] || lives[0]
                        if (!item) return null
                        return (
                          <div
                            onClick={() => setActiveLiveModal(item)}
                            className="group relative flex flex-col rounded-3xl bg-gradient-to-b from-orange-50/90 via-white to-amber-50/30 border-2 border-amber-500/40 shadow-md hover:shadow-xl hover:border-amber-500 transition-all cursor-pointer overflow-visible order-3"
                          >
                            {/* 상단 3위 배지: 박스 상단 중앙에 오버랩 돌출 배치 (배경 완전 투명) */}
                            <div className="absolute -top-10 sm:-top-11 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
                              <RankBadgeImage rank={3} className="w-22 sm:w-24 h-auto" />
                              <Badge className="bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 border-none shadow-xs -mt-1.5">
                                🥉 실시간 3위
                              </Badge>
                            </div>

                            {/* 박스 상단을 좌우 끝까지 100% 꽉 채우는 Full-Bleed 커버 이미지 */}
                            <div className="relative w-full aspect-[4/3] rounded-t-[22px] overflow-hidden bg-slate-950">
                              <img
                                src={item.coverUrl}
                                alt={item.title}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF3B6B] animate-ping" />
                                <Users className="h-3 w-3 text-slate-300" />
                                <span>{item.viewerCount.toLocaleString()}</span>
                              </div>

                              {item.pinnedProduct && (
                                <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 rounded-xl bg-white/95 p-1 text-slate-900 backdrop-blur-xs shadow-xs">
                                  <img
                                    src={item.pinnedProduct.image}
                                    alt="pin"
                                    className="h-5 w-5 rounded-md object-cover shrink-0"
                                  />
                                  <span className="text-[10px] font-bold text-[#FF3B6B] truncate">
                                    {item.pinnedProduct.price.toLocaleString()}원
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* 호스트 & 정보 패널 */}
                            <div className="p-3.5 space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <img
                                  src={item.hostAvatar}
                                  alt={item.hostNickname}
                                  className="h-5 w-5 rounded-full object-cover border border-orange-200"
                                />
                                <span className="text-xs font-bold text-slate-800 truncate">
                                  {item.hostNickname}
                                </span>
                              </div>
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors leading-tight">
                                {item.title}
                              </h4>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                <span className="bg-orange-100 text-orange-900 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                                  {item.category}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[11px] px-2.5 rounded-lg border-orange-300 text-orange-700 hover:bg-orange-100 font-bold"
                                >
                                  입장하기
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </section>

                  {/* (B) 🔴 실시간 온에어 라이브 방송 목록 (하단: 4칸 그리드로 확대 & 이미지 꽉 차게) */}
                  <section className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Radio className="h-5 w-5 text-[#FF3B6B] animate-pulse" />
                        <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">
                          실시간 라이브 방송 목록
                        </h3>
                        <Badge className="bg-rose-50 text-[#FF3B6B] border border-rose-200 text-[10px] font-bold">
                          온에어 {lives.length}개
                        </Badge>
                      </div>

                      {/* Category Filter Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
                        {['전체', '쇼핑/커머스', '토크/소통', '음악/노래', '일상', '취미'].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setLiveCategoryFilter(cat)}
                            className={`px-3 py-1 rounded-full font-semibold shrink-0 transition-colors text-xs ${
                              liveCategoryFilter === cat
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-white border text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live Rooms Grid: 옆으로 퍼져보이지 않도록 4칸(grid-cols-2 sm:grid-cols-3 xl:grid-cols-4)으로 확대 & 이미지가 박스에 꽉 차는 aspect-square */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
                      {lives
                        .filter((live) => (liveCategoryFilter === '전체' ? true : live.category.includes(liveCategoryFilter)))
                        .map((live) => (
                          <Card
                            key={live.id}
                            onClick={() => setActiveLiveModal(live)}
                            className="group overflow-hidden rounded-2xl cursor-pointer hover:shadow-xl transition-all border border-slate-200/80 bg-white flex flex-col"
                          >
                            {/* 이미지가 박스에 100% 꽉 차는 정사각형(aspect-square) 라이브 커버 */}
                            <div className="aspect-square w-full bg-slate-950 overflow-hidden relative">
                              <img
                                src={live.coverUrl}
                                alt={live.title}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                              {/* Live viewer count */}
                              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF3B6B] animate-ping" />
                                <Users className="h-3 w-3 text-slate-300" />
                                <span>{live.viewerCount.toLocaleString()}</span>
                              </div>

                              {live.isOfficialCreator && (
                                <Badge className="absolute top-2 left-2 bg-[#8B5CF6] text-white text-[9px] font-bold border-none px-1.5 py-0 shadow-xs">
                                  🎙️ 크리에이터
                                </Badge>
                              )}

                              {/* Pinned product preview */}
                              {live.pinnedProduct && (
                                <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 rounded-xl bg-white/95 p-1 text-slate-900 shadow-xs backdrop-blur-xs">
                                  <img
                                    src={live.pinnedProduct.image}
                                    alt="pin"
                                    className="h-5 w-5 rounded-md object-cover shrink-0"
                                  />
                                  <span className="text-[10px] font-bold text-[#FF3B6B] truncate">
                                    {live.pinnedProduct.price.toLocaleString()}원
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* 하단 정보 패널 */}
                            <div className="p-2.5 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <img
                                  src={live.hostAvatar}
                                  alt={live.hostNickname}
                                  className="h-4 w-4 rounded-full object-cover shrink-0 border border-slate-200"
                                />
                                <span className="text-[11px] font-bold text-slate-700 truncate">
                                  {live.hostNickname}
                                </span>
                              </div>
                              <h4 className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-[#FF3B6B] transition-colors leading-tight">
                                {live.title}
                              </h4>
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium truncate max-w-[90px]">
                                  {live.category}
                                </span>
                              </div>
                            </div>
                          </Card>
                        ))}
                    </div>
                  </section>
                </div>

                {/* [우측 사이드바: 1 col - 🏆 실시간 크리에이터 랭킹 (홈화면과 동일한 디자인 & 연동)] */}
                <div className="lg:col-span-1 space-y-4 flex flex-col sticky top-20">
                  <div className="flex items-center justify-between min-h-[36px]">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">
                        실시간 랭킹
                      </h3>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-semibold">
                      실시간 Top 8
                    </span>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200/80 p-3.5 shadow-sm divide-y divide-slate-100 flex flex-col space-y-1">
                    {rankingsList.slice(0, 8).map((item) => {
                      const isGold = item.rank === 1
                      const isSilver = item.rank === 2
                      const isBronze = item.rank === 3

                      return (
                        <div
                          key={item.rank}
                          onClick={() => {
                            if (item.liveId) {
                              const target = lives.find((l) => l.id === item.liveId) || top3Lives.find((l) => l.id === item.liveId)
                              if (target) {
                                setActiveLiveModal(target)
                              } else {
                                setActiveLiveModal({
                                  id: item.liveId,
                                  title: `🔴 ${item.nickname}의 실시간 라이브 방송`,
                                  category: '일상/토크',
                                  hostNickname: item.nickname,
                                  hostAvatar: item.avatar,
                                  viewerCount: 450,
                                  coverUrl: item.avatar,
                                  hasCommerce: true,
                                })
                              }
                            }
                          }}
                          className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Rank Medal / Number */}
                            <div className="w-5 flex items-center justify-center shrink-0">
                              {isGold ? (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600 font-black text-xs shadow-xs">
                                  <Crown className="h-3 w-3 fill-amber-400 text-amber-500" />
                                </div>
                              ) : isSilver ? (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-black text-[11px]">
                                  2
                                </div>
                              ) : isBronze ? (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-700/10 text-amber-800 font-black text-[11px]">
                                  3
                                </div>
                              ) : (
                                <span className="text-xs font-bold text-slate-400">
                                  {item.rank}
                                </span>
                              )}
                            </div>

                            {/* Avatar with Online/Live Indicator */}
                            <div className="relative shrink-0">
                              <img
                                src={item.avatar}
                                alt={item.nickname}
                                className={`h-9 w-9 rounded-full object-cover border ${
                                  item.isLive
                                    ? 'border-[#FF3B6B] ring-2 ring-[#FF3B6B]/30'
                                    : 'border-slate-200'
                                }`}
                              />
                              {item.isLive && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF3B6B] opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF3B6B]"></span>
                                </span>
                              )}
                            </div>

                            {/* Nickname & Badge */}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-900 truncate group-hover:text-[#FF3B6B] transition-colors">
                                {item.nickname}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-muted-foreground font-medium truncate">
                                  {item.badgeText}
                                </span>
                                {item.isLive && (
                                  <span className="bg-rose-100 text-rose-600 text-[9px] font-bold px-1 rounded leading-tight">
                                    LIVE
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Score Text */}
                          <div className="text-right shrink-0 pl-2">
                            <span className="text-[11px] font-extrabold text-[#FF3B6B]">
                              {item.scoreText}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 💬 모꼬쳇 (CHAT) - 상단 광고배너 + 좌측 친구들/전체수다/대화함 + 우측 휴대폰 모바일 채팅방 & 선물 */}
          {/* ======================================================= */}
          {activeTab === 'CHAT' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 1) 상단 와이드 광고 배너 (첨부 헤더 이미지 삭제 후 실시간 인터랙티브 광고 배너 배치) */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 p-6 sm:p-7 text-white shadow-xl border border-blue-900/50">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-blue-400 animate-ping" />
                      <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-2.5 py-0.5 border-none text-[11px] shadow-sm">
                        MOCCO CHAT EVENT
                      </Badge>
                      <span className="text-xs text-blue-300 font-medium">
                        동네 친구들과 따뜻한 소통 & 3D 선물 페이백 페스티벌
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                      <span>친구와 나누는 실시간 1:1 대화 & 3D 모꼬 선물하기</span>
                      <span className="text-lg">🎁✨</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300">
                      내 주변 이웃을 찾아 즉시 대화를 시작하세요. 채팅 중에 모꼬 전용 3D 선물을 보내면 화면 가득 축제 이펙트가 펼쳐지며 100% 포인트 페이백 혜택을 드립니다!
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-white/20 text-right">
                      <span className="text-[10px] text-blue-200 block font-semibold">내 보유 포인트</span>
                      <span className="text-sm font-black text-amber-300">
                        {myPoints.toLocaleString()} ON
                      </span>
                    </div>
                    <Button
                      onClick={() => {
                        setMyPoints((prev) => prev + 10000)
                        toast({
                          title: '🎉 모꼬 포인트 10,000 ON 즉시 충전 완료!',
                          description: '채팅방에서 모꼬 선물을 자유롭게 보내보세요.',
                        })
                      }}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs h-10 px-4 rounded-xl shadow-lg transition-all"
                    >
                      <Coins className="h-4 w-4 mr-1.5" />
                      포인트 무료 충전
                    </Button>
                  </div>
                </div>

                {/* 은은한 배경 글로우 장식 */}
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
              </div>

              {/* 2) 2-Column Integrated Layout (좌측: 앱과 동일한 친구들/전체수다/대화함 / 우측: 스마트폰 목업 채팅방) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* [좌측 영역: lg:col-span-7 xl:col-span-7] 앱과 똑같은 3대 탭 & 리스트 */}
                <div className="lg:col-span-7 xl:col-span-7 space-y-4 flex flex-col">
                  {/* 상단 3대 서브탭 버튼 (동네친구들이 아니라 앱과 똑같이 "친구들" / "전체수다" / "대화함") */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold border border-slate-200/80 shadow-xs">
                    <button
                      onClick={() => setChatSubTab('FRIENDS')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl transition-all ${
                        chatSubTab === 'FRIENDS'
                          ? 'bg-white text-blue-700 shadow-sm font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-xs sm:text-sm">친구들</span>
                    </button>
                    <button
                      onClick={() => setChatSubTab('SUDA')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl transition-all ${
                        chatSubTab === 'SUDA'
                          ? 'bg-white text-indigo-700 shadow-sm font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <MessageCircle className="h-4 w-4 text-indigo-600" />
                      <span className="text-xs sm:text-sm">전체수다</span>
                    </button>
                    <button
                      onClick={() => setChatSubTab('CHATS')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl transition-all ${
                        chatSubTab === 'CHATS'
                          ? 'bg-white text-purple-700 shadow-sm font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Send className="h-4 w-4 text-purple-600" />
                      <span className="text-xs sm:text-sm">대화함</span>
                      {chatRooms.some((r) => r.unreadCount > 0) && (
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                      )}
                    </button>
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* SUBTAB 1: 👥 친구들 (앱과 100% 동일한 필터 바 + 리스트)        */}
                  {/* ------------------------------------------------------------- */}
                  {chatSubTab === 'FRIENDS' && (
                    <div className="space-y-4">
                      {/* 앱 스타일 3대 필터 바 (지역 / 성별 / 연령) */}
                      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                        {/* 지역 필터 */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs flex-1 min-w-[200px]">
                          <span className="text-[11px] font-bold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-rose-500" />
                            지역:
                          </span>
                          {['전체', '서울', '전남', '전북', '경기', '부산', '대구', '인천', '광주', '대전', '강원', '제주'].map((reg) => (
                            <button
                              key={reg}
                              onClick={() => setFriendRegionFilter(reg)}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                                friendRegionFilter === reg
                                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                              }`}
                            >
                              {reg}
                            </button>
                          ))}
                        </div>

                        {/* 성별 필터 */}
                        <div className="flex items-center gap-1 shrink-0 text-xs pl-2 border-l border-slate-200">
                          {['전체', '여성', '남성'].map((gender) => (
                            <button
                              key={gender}
                              onClick={() => setFriendGenderFilter(gender)}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                                friendGenderFilter === gender
                                  ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                              }`}
                            >
                              {gender}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 친구 카드 목록 (앱과 100% 동일한 Row Card) */}
                      <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                        {friends
                          .filter((f) => (friendRegionFilter === '전체' ? true : f.region.includes(friendRegionFilter)))
                          .filter((f) => (friendGenderFilter === '전체' ? true : (f.gender && f.gender.includes(friendGenderFilter === '여성' ? '여' : '남'))))
                          .map((friend) => (
                            <div
                              key={friend.id}
                              onClick={() => handleStartNeighborChat(friend)}
                              className="group flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer gap-3"
                            >
                              {/* 좌측 아바타 + 접속상태 */}
                              <div className="relative shrink-0">
                                <img
                                  src={friend.avatar}
                                  alt={friend.nickname}
                                  className="h-12 w-12 rounded-full object-cover border border-slate-200 group-hover:scale-105 transition-transform"
                                />
                                {friend.isOnline && (
                                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" />
                                )}
                              </div>

                              {/* 중앙 텍스트 정보 */}
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-sm text-slate-900 truncate">
                                    {friend.nickname}
                                  </span>
                                  <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                    {friend.gender ? `${friend.gender} · ${friend.age}세` : `${friend.age}세`}
                                  </span>
                                  <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                    {friend.region}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 truncate">
                                  {friend.statusMessage || '반가워요! 편하게 대화 걸어주세요 ✨'}
                                </p>
                              </div>

                              {/* 우측 [대화신청] 버튼 */}
                              <div className="shrink-0">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStartNeighborChat(friend)
                                  }}
                                  className="bg-rose-50 hover:bg-rose-100 text-[#FF3B6B] border border-rose-200 font-bold text-xs h-8 px-3 rounded-xl shadow-2xs flex items-center gap-1"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  <span>대화신청</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* SUBTAB 2: 💬 전체수다 (앱과 100% 동일한 수다 타임라인)          */}
                  {/* ------------------------------------------------------------- */}
                  {chatSubTab === 'SUDA' && (
                    <div className="space-y-4">
                      {/* 수다 입력창 */}
                      <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                        <Input
                          value={sudaInputText}
                          onChange={(e) => setSudaInputText(e.target.value)}
                          placeholder="이웃들에게 따뜻한 이야기를 전해보세요! (Enter로 등록)"
                          className="text-xs border-none shadow-none focus-visible:ring-0"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handlePostSuda()
                          }}
                        />
                        <Button
                          onClick={handlePostSuda}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 px-4 shrink-0 rounded-xl"
                        >
                          <Send className="h-3.5 w-3.5 mr-1" />
                          등록
                        </Button>
                      </div>

                      {/* 수다 타임라인 스트림 */}
                      <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                        {sudaPosts.map((post) => (
                          <div
                            key={post.id}
                            className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-2xs space-y-2 hover:border-indigo-200 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={post.avatar}
                                  alt="avatar"
                                  className="h-9 w-9 rounded-full object-cover border border-slate-200"
                                />
                                <div>
                                  <span className="font-bold text-xs text-slate-900 block">
                                    {post.nickname}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {post.region} · {post.time}
                                  </span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const authorFriend: NeighborFriendItem = {
                                    id: 'friend-' + post.id,
                                    nickname: post.nickname,
                                    avatar: post.avatar,
                                    region: post.region,
                                    distance: '이웃',
                                    mannerTemp: 36.5,
                                    statusMessage: post.content,
                                    isOnline: true,
                                    gender: '회원',
                                    age: 26,
                                  }
                                  handleStartNeighborChat(authorFriend)
                                }}
                                className="h-7 text-xs px-2.5 rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold"
                              >
                                대화하기
                              </Button>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed pl-11">
                              {post.content}
                            </p>
                            <div className="flex items-center gap-4 pt-1 pl-11 text-xs text-muted-foreground border-t">
                              <button
                                onClick={() => handleLikeSuda(post.id)}
                                className={`flex items-center gap-1 hover:text-rose-600 transition-colors ${
                                  post.isLiked ? 'text-rose-600 font-bold' : ''
                                }`}
                              >
                                <Heart className={`h-3.5 w-3.5 ${post.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                                <span>공감 {post.likes}</span>
                              </button>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3.5 w-3.5" />
                                <span>댓글 {post.comments}</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* SUBTAB 3: 📩 대화함 (앱과 100% 동일한 수다톡/거래톡 대화방 목록) */}
                  {/* ------------------------------------------------------------- */}
                  {chatSubTab === 'CHATS' && (
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[620px]">
                      {/* 상단 서브 세그먼트: 수다 톡 vs 거래 톡 */}
                      <div className="p-3.5 border-b bg-slate-50/60 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <button
                            onClick={() => setChatBoxFilter('ALL')}
                            className={`px-3 py-1.5 rounded-xl transition-all ${
                              chatBoxFilter === 'ALL'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-white border text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            전체 대화 ({chatRooms.length})
                          </button>
                          <button
                            onClick={() => setChatBoxFilter('SUDA')}
                            className={`px-3 py-1.5 rounded-xl transition-all ${
                              chatBoxFilter === 'SUDA'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white border text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            수다 톡
                          </button>
                          <button
                            onClick={() => setChatBoxFilter('MARKET')}
                            className={`px-3 py-1.5 rounded-xl transition-all ${
                              chatBoxFilter === 'MARKET'
                                ? 'bg-orange-600 text-white shadow-xs'
                                : 'bg-white border text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            거래 톡
                          </button>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          우측 폰에서 실시간 대화
                        </span>
                      </div>

                      {/* 대화방 리스트 */}
                      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {chatRooms
                          .filter((r) => (chatBoxFilter === 'ALL' ? true : r.type === chatBoxFilter))
                          .map((room) => {
                            const isActive = activeChatRoom?.id === room.id
                            return (
                              <div
                                key={room.id}
                                onClick={() => setActiveChatRoom(room)}
                                className={`p-3.5 flex items-start gap-3.5 transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-blue-50/80 border-l-4 border-blue-600 shadow-2xs'
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                <div className="relative shrink-0">
                                  <img
                                    src={room.targetAvatar}
                                    alt={room.targetNickname}
                                    className="h-11 w-11 rounded-full object-cover border border-slate-200"
                                  />
                                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                      {room.targetNickname}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">{room.lastTime}</span>
                                  </div>
                                  <p className="text-xs text-slate-600 truncate">{room.lastMessage}</p>
                                  {room.productInfo && (
                                    <div className="flex items-center gap-1.5 mt-1.5 p-1 px-1.5 bg-orange-50/80 rounded-lg border border-orange-200/60 text-[10px] text-slate-700">
                                      <span className="font-bold text-orange-600 shrink-0">📌 거래물품:</span>
                                      <span className="truncate">{room.productInfo.title}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}
                </div>

                {/* [우측 영역: lg:col-span-5 xl:col-span-5] 📱 휴대폰 모양 디바이스 & 앱 채팅방 (선물기능 포함) */}
                <div className="lg:col-span-5 xl:col-span-5 flex flex-col items-center sticky top-20">
                  {/* 스마트폰 목업 프레임 */}
                  <div className="relative w-full max-w-[380px] h-[720px] rounded-[48px] bg-slate-950 p-2.5 shadow-2xl ring-1 ring-slate-800/80 border-[5px] border-slate-700/80 flex flex-col overflow-hidden">
                    {/* 상단 다이나믹 아일랜드 노치 */}
                    <div className="w-24 h-4.5 rounded-full bg-black mx-auto mt-1 mb-1 flex items-center justify-center shrink-0">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-900 border border-slate-800" />
                    </div>

                    {/* 스마트폰 내부 스크린 */}
                    <div className="rounded-[36px] bg-white flex-1 flex flex-col overflow-hidden relative border border-slate-200/40">
                      {/* (A) 상단 모바일 상태바 */}
                      <div className="h-6 bg-slate-900 text-white px-5 flex items-center justify-between text-[10px] font-semibold shrink-0">
                        <span>14:44</span>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <span className="text-[9px]">5G</span>
                          <Wifi className="h-3 w-3" />
                          <Battery className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      {/* (B) 앱 채팅방 헤더 (뒤로가기, 프로필, 온라인 표시, 통화 아이콘) */}
                      {activeChatRoom ? (
                        <>
                          <div className="p-2.5 px-3 border-b bg-white flex items-center justify-between shrink-0 shadow-2xs">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setChatSubTab('CHATS')}
                                className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-700"
                              >
                                <ArrowLeft className="h-4 w-4" />
                              </button>
                              <div className="relative">
                                <img
                                  src={activeChatRoom.targetAvatar}
                                  alt={activeChatRoom.targetNickname}
                                  className="h-8 w-8 rounded-full object-cover border border-slate-200"
                                />
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs text-slate-900 truncate max-w-[130px]">
                                  {activeChatRoom.targetNickname}
                                </h4>
                                <span className="text-[9px] text-emerald-600 flex items-center gap-1 leading-tight">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                                  실시간 온라인
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 text-slate-600">
                              <button
                                onClick={() =>
                                  toast({
                                    title: '📞 1:1 보이스톡 연결',
                                    description: `${activeChatRoom.targetNickname}님께 안전 안심통화를 요청합니다.`,
                                  })
                                }
                                className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-slate-100 text-blue-600"
                              >
                                <Phone className="h-3.5 w-3.5" />
                              </button>
                              <button className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* 거래 물품 상단 바 (MARKET 톡인 경우) */}
                          {activeChatRoom.productInfo && (
                            <div className="flex items-center justify-between p-2 bg-orange-50/80 border-b text-xs shrink-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={activeChatRoom.productInfo.image}
                                  alt="prod"
                                  className="h-8 w-8 rounded-lg object-cover shrink-0"
                                />
                                <div className="min-w-0">
                                  <span className="font-bold text-[11px] text-slate-900 line-clamp-1">
                                    {activeChatRoom.productInfo.title}
                                  </span>
                                  <span className="font-black text-[11px] text-orange-600 block">
                                    {activeChatRoom.productInfo.price.toLocaleString()}원
                                  </span>
                                </div>
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
                                className="h-6 text-[10px] px-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold shrink-0"
                              >
                                안전결제
                              </Button>
                            </div>
                          )}

                          {/* (C) 모바일 채팅 메시지 스트림 */}
                          <div
                            ref={chatScrollRef}
                            className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-[#F4F6F9]"
                          >
                            {/* 날짜 구분선 */}
                            <div className="flex items-center justify-center my-1">
                              <span className="bg-slate-200/80 text-slate-600 text-[9px] px-2.5 py-0.5 rounded-full font-semibold">
                                2026년 10월 29일 목요일
                              </span>
                            </div>

                            {activeChatRoom.messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
                              >
                                {/* 선물 메시지인 경우: 화려한 3D 모꼬 선물 카드 */}
                                {msg.gift ? (
                                  <div
                                    className={`max-w-[85%] rounded-2xl p-3 border shadow-md space-y-1.5 ${
                                      msg.isMe
                                        ? 'bg-gradient-to-br from-pink-500 via-rose-500 to-amber-500 text-white border-pink-300 rounded-tr-none'
                                        : 'bg-white text-slate-900 border-amber-300 rounded-tl-none'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-2xl">{msg.gift.icon || '🎁'}</span>
                                      <div className="min-w-0">
                                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block">
                                          MOCCO 3D GIFT
                                        </span>
                                        <h5 className="font-extrabold text-xs truncate">
                                          {msg.gift.name}
                                        </h5>
                                      </div>
                                    </div>
                                    <p className="text-[10px] leading-snug opacity-95">
                                      {msg.gift.description}
                                    </p>
                                    <div className="pt-1 border-t border-white/20 flex items-center justify-between text-[10px] font-black">
                                      <span>후원 포인트</span>
                                      <span className="bg-white/25 px-1.5 py-0.5 rounded text-white">
                                        {msg.gift.amount.toLocaleString()} ON
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  /* 일반 텍스트 말풍선 */
                                  <div
                                    className={`max-w-[78%] rounded-2xl px-3 py-1.5 text-xs leading-relaxed ${
                                      msg.isMe
                                        ? 'bg-blue-600 text-white rounded-tr-none shadow-xs'
                                        : 'bg-white text-slate-900 border border-slate-200/80 rounded-tl-none shadow-2xs'
                                    }`}
                                  >
                                    {msg.text}
                                  </div>
                                )}
                                <span className="text-[9px] text-muted-foreground mt-0.5 px-1">
                                  {msg.time} {msg.isMe && <span className="text-blue-600 font-bold">1</span>}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* (D) 모바일 채팅 입력 툴바 (사진, 선물, 텍스트, 전송) */}
                          <div className="p-2 border-t bg-white flex items-center gap-1.5 shrink-0">
                            {/* 사진 첨부 버튼 */}
                            <button
                              onClick={() =>
                                toast({
                                  title: '📷 사진 전송',
                                  description: '채팅 사진/이미지 첨부 창이 열립니다.',
                                })
                              }
                              className="h-8 w-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 shrink-0"
                            >
                              <PlusCircle className="h-4 w-4" />
                            </button>

                            {/* 🎁 선물하기 버튼 (핑크/골드 네온 버튼) */}
                            <button
                              onClick={() => setIsGiftPickerOpen(true)}
                              className="h-8 px-2.5 rounded-full flex items-center gap-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-[10px] shadow-xs hover:from-pink-600 hover:to-rose-600 shrink-0 transition-transform active:scale-95"
                            >
                              <Gift className="h-3.5 w-3.5" />
                              <span>선물</span>
                            </button>

                            {/* 메시지 인풋 */}
                            <Input
                              value={chatInputText}
                              onChange={(e) => setChatInputText(e.target.value)}
                              placeholder="메시지 입력..."
                              className="h-8 text-xs bg-slate-100 border-none focus-visible:ring-0 rounded-full px-3"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSendMessage()
                              }}
                            />

                            {/* 전송 버튼 */}
                            <button
                              onClick={handleSendMessage}
                              disabled={!chatInputText.trim()}
                              className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                chatInputText.trim()
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-200 text-slate-400'
                              }`}
                            >
                              <Send className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* (E) 🎁 폰 내부 선물 선택 바텀시트 (GiftPickerSheet) */}
                          {isGiftPickerOpen && (
                            <div className="absolute inset-x-0 bottom-0 top-16 bg-black/50 z-40 flex flex-col justify-end animate-in fade-in duration-150">
                              <div className="bg-white rounded-t-3xl p-3.5 pb-4 space-y-3 shadow-2xl border-t border-slate-200 max-h-[85%] flex flex-col animate-in slide-in-from-bottom duration-200">
                                {/* 바텀시트 헤더 */}
                                <div className="flex items-center justify-between pb-1 border-b">
                                  <div className="flex items-center gap-1.5">
                                    <Gift className="h-4 w-4 text-pink-500" />
                                    <span className="font-extrabold text-xs text-slate-900">
                                      모꼬 3D 선물상자
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                      보유 {myPoints.toLocaleString()} ON
                                    </span>
                                    <button
                                      onClick={() => setIsGiftPickerOpen(false)}
                                      className="h-6 w-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* 카테고리 탭 */}
                                <div className="flex items-center gap-1 text-[10px] font-bold">
                                  {[
                                    { key: 'all', label: '전체' },
                                    { key: 'mocco_special', label: '3D 모꼬' },
                                    { key: 'mocco_vip', label: 'VIP 모꼬' },
                                  ].map((cat) => (
                                    <button
                                      key={cat.key}
                                      onClick={() => setActiveGiftCategory(cat.key as any)}
                                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                                        activeGiftCategory === cat.key
                                          ? 'bg-pink-600 text-white'
                                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                      }`}
                                    >
                                      {cat.label}
                                    </button>
                                  ))}
                                </div>

                                {/* 선물 그리드 리스트 */}
                                <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[260px] pr-1">
                                  {MOCCO_CHAT_GIFTS
                                    .filter((g) => (activeGiftCategory === 'all' ? true : g.category === activeGiftCategory))
                                    .map((gift) => (
                                      <div
                                        key={gift.id}
                                        onClick={() => handleSendGift(gift)}
                                        className="group p-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-pink-50/60 hover:border-pink-300 transition-all cursor-pointer text-left space-y-1 flex flex-col justify-between"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="text-2xl group-hover:scale-110 transition-transform">{gift.icon}</span>
                                          <span className="text-[10px] font-black text-pink-600 bg-pink-100 px-1.5 py-0.2 rounded">
                                            {gift.pricePoints.toLocaleString()} ON
                                          </span>
                                        </div>
                                        <div>
                                          <h6 className="font-bold text-[11px] text-slate-900 truncate">
                                            {gift.name}
                                          </h6>
                                          <p className="text-[9px] text-slate-500 line-clamp-1">
                                            {gift.description}
                                          </p>
                                        </div>
                                        <Button
                                          size="sm"
                                          className="w-full h-5 text-[9px] bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-lg mt-1"
                                        >
                                          선물하기
                                        </Button>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* (F) ✨ 폰 내부 풀스크린 축제 선물 애니메이션 (GiftEffectOverlay) */}
                          {activeGiftEffect && (
                            <div className="absolute inset-0 z-50 bg-black/60 flex flex-col items-center justify-center p-4 text-center pointer-events-none animate-in fade-in zoom-in-75 duration-300">
                              <div className="relative">
                                <span className="text-6xl animate-bounce block">
                                  {activeGiftEffect.icon || '🎁'}
                                </span>
                                <span className="absolute -top-3 -right-3 text-3xl animate-spin">
                                  ✨
                                </span>
                                <span className="absolute -bottom-2 -left-3 text-3xl animate-ping">
                                  💖
                                </span>
                              </div>
                              <h3 className="font-black text-base text-amber-300 mt-2 drop-shadow-md">
                                {activeGiftEffect.name}
                              </h3>
                              <p className="text-xs text-white/90 mt-1 max-w-[220px] drop-shadow-sm leading-snug">
                                {activeGiftEffect.text}
                              </p>
                              <Badge className="mt-3 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-[10px] px-3 py-1 border-none shadow-lg">
                                🎉 특별 선물 이펙트 발동 중!
                              </Badge>
                            </div>
                          )}
                        </>
                      ) : (
                        /* 대화방 미선택 상태 */
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                          <MessageCircle className="h-10 w-10 text-slate-300 animate-pulse" />
                          <p className="text-xs font-bold text-slate-600">
                            좌측에서 대화할 친구나 대화방을 선택하세요
                          </p>
                          <p className="text-[10px] text-slate-400">
                            선택하면 스마트폰 안에서 실시간 1:1 채팅과 3D 선물을 보낼 수 있습니다.
                          </p>
                        </div>
                      )}

                      {/* 하단 홈 인디케이터 바 */}
                      <div className="h-4 bg-white flex items-center justify-center shrink-0">
                        <div className="w-28 h-1 bg-slate-300 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: 👤 마이모꼬 (MY) - 모바일 앱 기능 100% 동기화 + 웹 전용 4대 비즈니스/크리에이터 센터 */}
          {/* ======================================================= */}
          {activeTab === 'MY' && (
            <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
              
              {/* [🌟 웹 전용 4대 비즈니스 & 크리에이터 센터] - 웹만의 전용 기능 */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-7 text-white shadow-xl border border-indigo-900/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-pink-500 animate-ping" />
                      <Badge className="bg-gradient-to-r from-[#FF3B6B] to-[#8B5CF6] text-white font-extrabold px-2.5 py-0.5 border-none text-[11px] shadow-sm">
                        WEB ONLY SPECIAL
                      </Badge>
                      <span className="text-xs text-indigo-300 font-semibold">
                        비즈니스 파트너 & 공식 크리에이터 전용 웹 게이트웨이
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <span>모꼬 비즈니스 파트너 & 크리에이터 센터</span>
                      <Sparkles className="h-4 w-4 text-amber-400" />
                    </h3>
                  </div>

                  {role === 'ADMIN' && (
                    <Button
                      asChild
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs h-9 px-3.5 rounded-xl shadow-lg shrink-0"
                    >
                      <Link href="/dashboard">
                        <Crown className="h-4 w-4 mr-1.5 text-slate-950" />
                        👑 회사 총괄 운영진 콘솔
                        <ExternalLink className="h-3 w-3 ml-1 opacity-80" />
                      </Link>
                    </Button>
                  )}
                </div>

                {/* 4대 전용 기능 그리드 (1. 입점사신청 / 2. 크리에이터신청 / 3. 입점사관리자 / 4. 크리에이터관리자) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                  {/* (1) 🏪 입점사 신청 */}
                  <div className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 transition-all flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">🏪</span>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
                          입점 파트너
                        </Badge>
                      </div>
                      <h4 className="font-extrabold text-sm text-white">입점사 신청</h4>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        사업자 등록 후 공식 입점사 승격! 대량 직영 상품 판매 및 에스크로 정산 혜택
                      </p>
                    </div>
                    <Button
                      onClick={() => requireAuth(() => openMerchantModal())}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 rounded-xl shadow-sm"
                    >
                      <Building2 className="h-3.5 w-3.5 mr-1" />
                      입점사 신청하기
                    </Button>
                  </div>

                  {/* (2) 🎙️ 크리에이터 신청 */}
                  <div className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 transition-all flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">🎙️</span>
                        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-bold">
                          인플루언서
                        </Badge>
                      </div>
                      <h4 className="font-extrabold text-sm text-white">크리에이터 신청</h4>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        라이브 방송 송출, 실시간 커머스 상품 핀 연동 및 판매 수수료 커미션 획득
                      </p>
                    </div>
                    <Button
                      onClick={() => requireAuth(() => openCreatorModal())}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-8 rounded-xl shadow-sm"
                    >
                      <Mic className="h-3.5 w-3.5 mr-1" />
                      크리에이터 신청하기
                    </Button>
                  </div>

                  {/* (3) 💼 입점사 관리자 (셀러 센터) */}
                  <div className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 transition-all flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">💼</span>
                        <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-bold">
                          셀러 콘솔
                        </Badge>
                      </div>
                      <h4 className="font-extrabold text-sm text-white">입점사 관리자</h4>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        입점 상품 등록/수정, 주문 배송 처리, 송장 입력, 매출 정산금 출금 관리
                      </p>
                    </div>
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold text-xs h-8 rounded-xl shadow-sm"
                    >
                      <Link href="/seller">
                        <Store className="h-3.5 w-3.5 mr-1" />
                        셀러센터 바로가기
                        <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
                      </Link>
                    </Button>
                  </div>

                  {/* (4) 🎬 크리에이터 관리자 (스튜디오 콘솔) */}
                  <div className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 transition-all flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">🎬</span>
                        <Badge className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[9px] font-bold">
                          스튜디오
                        </Badge>
                      </div>
                      <h4 className="font-extrabold text-sm text-white">크리에이터 관리자</h4>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        라이브 방송 편성, 단독 핀 특가 상품 매칭, 실시간 시청자/선물 후원 분석
                      </p>
                    </div>
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs h-8 rounded-xl shadow-sm"
                    >
                      <Link href="/streamer">
                        <Radio className="h-3.5 w-3.5 mr-1" />
                        스튜디오 바로가기
                        <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* [모바일 앱 100% 동일] (1) 프로필 카드 */}
              <div className="rounded-3xl bg-white p-6 border border-slate-200/80 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative group cursor-pointer" onClick={() => setIsProfileEditOpen(true)}>
                      <img
                        src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'}
                        alt="avatar"
                        className="h-16 w-16 rounded-full object-cover border-2 border-pink-300 shadow-sm"
                      />
                      <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-slate-900 border-2 border-white text-white flex items-center justify-center">
                        <Camera className="h-3 w-3" />
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900">
                          {user?.nickname || '모꼬이웃'}
                        </h3>
                        <Badge className="bg-pink-100 text-pink-700 border-pink-200 font-extrabold text-[10px] px-2 py-0">
                          {userAge}세 · {userGender === '여' ? '여성' : '남성'}
                        </Badge>
                        <Badge
                          className={`text-[10px] font-bold ${
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
                            ? '운영진 관리자'
                            : role === 'MERCHANT'
                            ? '공식 입점사'
                            : role === 'CREATOR'
                            ? '공식 크리에이터'
                            : '일반회원'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <MapPin className="h-3 w-3 text-rose-500" />
                          {currentLocation}
                        </span>
                        <span>·</span>
                        <span className="text-rose-600 font-bold">매너온도 36.5℃</span>
                      </div>

                      <p className="text-xs text-slate-600 italic">
                        &quot;{userHeadline}&quot;
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      onClick={() => setIsProfileEditOpen(true)}
                      variant="outline"
                      size="sm"
                      className="text-xs h-9 px-3.5 rounded-xl border-slate-300 font-bold"
                    >
                      프로필 수정
                    </Button>

                    {!isAuthenticated ? (
                      <Button
                        onClick={() => openLoginModal()}
                        className="bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold text-xs rounded-xl h-9 px-4"
                      >
                        <LogIn className="h-4 w-4 mr-1.5" />
                        로그인 / 가입
                      </Button>
                    ) : (
                      <Button
                        onClick={logout}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-500 hover:text-rose-600 h-9 rounded-xl"
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        로그아웃
                      </Button>
                    )}
                  </div>
                </div>

                {/* [모바일 앱 100% 동일] (2) 지갑 대시보드 (모꼬 포인트 & 판매 정산금) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {/* 🪙 모꼬 포인트 지갑 */}
                  <div className="bg-pink-50/70 p-4 rounded-2xl border border-pink-100 space-y-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🪙</span>
                        <span className="text-xs font-black text-pink-900">모꼬 포인트</span>
                        <Badge className="bg-pink-200/60 text-pink-800 text-[9px] px-1.5 py-0 font-bold">
                          소통·후원
                        </Badge>
                      </div>
                      <Button
                        onClick={() => {
                          setMyPoints((prev) => prev + 10000)
                          toast({
                            title: '🎉 모꼬 포인트 10,000 ON 무료 충전 완료!',
                            description: '채팅 및 라이브 3D 선물에 자유롭게 사용하세요.',
                          })
                        }}
                        size="sm"
                        className="bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-[11px] h-7 px-3 rounded-lg shadow-xs"
                      >
                        + 충전하기
                      </Button>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-pink-950">
                          {myPoints.toLocaleString()}
                        </span>
                        <span className="text-sm font-bold text-pink-800">P</span>
                      </div>
                      <p className="text-[10px] text-pink-700 mt-0.5">
                        라이브 방송 후원, 1:1 대화 및 3D 모꼬 선물 교환 시 사용
                      </p>
                    </div>

                    <div className="pt-1 border-t border-pink-200/60 flex items-center justify-end">
                      <button
                        onClick={() => setIsWithdrawOpen(true)}
                        className="text-[11px] font-bold text-pink-700 hover:underline flex items-center"
                      >
                        환전 신청 ›
                      </button>
                    </div>
                  </div>

                  {/* 💵 판매 정산금 지갑 */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">💵</span>
                        <span className="text-xs font-black text-slate-800">판매 정산금 (원)</span>
                        <Badge className="bg-slate-200 text-slate-700 text-[9px] px-1.5 py-0 font-bold">
                          안전정산
                        </Badge>
                      </div>
                      <Button
                        onClick={() => setIsWithdrawOpen(true)}
                        size="sm"
                        variant="outline"
                        className="border-slate-300 text-slate-700 hover:bg-slate-100 font-extrabold text-[11px] h-7 px-3 rounded-lg"
                      >
                        정산 / 출금
                      </Button>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900">
                          {sellerRevenue.toLocaleString()}
                        </span>
                        <span className="text-sm font-bold text-slate-600">원</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        중고거래 및 마켓 상품 판매 완료 시 계좌로 출금 가능
                      </p>
                    </div>

                    <div className="pt-1 border-t border-slate-200 flex items-center justify-end">
                      <button
                        onClick={() => setIsWithdrawOpen(true)}
                        className="text-[11px] font-bold text-slate-600 hover:underline flex items-center"
                      >
                        계좌 출금 신청 ›
                      </button>
                    </div>
                  </div>
                </div>

                {/* [모바일 앱 100% 동일] (3) 🎬 무료 모꼬 포인트 충전소 (리워드 광고) */}
                <div
                  onClick={() => {
                    setIsRewardAdOpen(true)
                    setRewardAdCountdown(3)
                    const timer = setInterval(() => {
                      setRewardAdCountdown((prev) => {
                        if (prev <= 1) {
                          clearInterval(timer)
                          setMyPoints((p) => p + 10)
                          toast({
                            title: '🎉 리워드 보상 적립 완료!',
                            description: '스폰서 광고 시청 보상으로 +10 ON이 충전되었습니다.',
                          })
                          setTimeout(() => setIsRewardAdOpen(false), 500)
                          return 0
                        }
                        return prev - 1
                      })
                    }, 1000)
                  }}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white shadow-md cursor-pointer hover:shadow-lg transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                      🎬
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-extrabold text-xs sm:text-sm">무료 모꼬 포인트 충전소</h5>
                        <Badge className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0 border-none">
                          +10 P
                        </Badge>
                      </div>
                      <p className="text-[11px] text-violet-100 mt-0.5">
                        스폰서 광고를 시청하고 실시간 선물용 무료 포인트를 충전하세요!
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-white text-indigo-700 hover:bg-slate-100 font-black text-xs h-8 px-3.5 rounded-xl shrink-0"
                  >
                    <Play className="h-3 w-3 mr-1 fill-indigo-700" />
                    충전
                  </Button>
                </div>

                {/* [모바일 앱 100% 동일] (4) 소셜 팔로워 / 팔로잉 듀얼 카드 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl border bg-slate-50/70 text-center hover:bg-slate-100 transition-colors cursor-pointer">
                    <span className="text-lg font-black text-slate-900 block">128</span>
                    <span className="text-xs font-semibold text-slate-500">팔로워</span>
                  </div>
                  <div className="p-3.5 rounded-2xl border bg-slate-50/70 text-center hover:bg-slate-100 transition-colors cursor-pointer">
                    <span className="text-lg font-black text-slate-900 block">42</span>
                    <span className="text-xs font-semibold text-slate-500">팔로잉</span>
                  </div>
                </div>
              </div>

              {/* [모바일 앱 100% 동일] (5) 🛍️ 마켓 & 중고거래 관리 (3대 세그먼트) */}
              <div className="rounded-3xl bg-white p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-orange-500" />
                    🛍️ 마켓 & 중고거래 관리
                  </h4>

                  {/* 세그먼트 탭 버튼 */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setMyTradeTab('WISHLIST')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        myTradeTab === 'WISHLIST'
                          ? 'bg-white text-pink-600 shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      관심목록 ({myWishlist.length})
                    </button>
                    <button
                      onClick={() => setMyTradeTab('SALES')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        myTradeTab === 'SALES'
                          ? 'bg-white text-orange-600 shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      판매관리 ({mySalesList.length})
                    </button>
                    <button
                      onClick={() => setMyTradeTab('ORDERS')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        myTradeTab === 'ORDERS'
                          ? 'bg-white text-indigo-600 shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      구매/예약내역 ({myOrdersList.length})
                    </button>
                  </div>
                </div>

                {/* 탭별 내용 */}
                {myTradeTab === 'WISHLIST' && (
                  <div className="space-y-2.5">
                    {myWishlist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-2xl border bg-slate-50/50 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img src={item.image} alt="wish" className="h-12 w-12 rounded-xl object-cover" />
                          <div>
                            <span className="text-[10px] text-muted-foreground block">{item.seller}</span>
                            <h5 className="font-bold text-xs text-slate-900 line-clamp-1">{item.title}</h5>
                            <span className="font-black text-xs text-slate-900">{item.price.toLocaleString()}원</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setCheckoutTarget({
                              title: item.title,
                              price: item.price,
                              shippingFee: 3000,
                              image: item.image,
                            })
                            setIsCheckoutOpen(true)
                          }}
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-8 px-3 rounded-xl"
                        >
                          바로구매
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {myTradeTab === 'SALES' && (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <Button
                        onClick={() => requireAuth(() => setIsNewUsedModalOpen(true))}
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-8 px-3 rounded-xl"
                      >
                        + 새 중고 물품 등록
                      </Button>
                    </div>
                    {mySalesList.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl border bg-slate-50/50"
                      >
                        <div className="flex items-center gap-3">
                          <img src={item.image} alt="sale" className="h-12 w-12 rounded-xl object-cover" />
                          <div>
                            <h5 className="font-bold text-xs text-slate-900">{item.title}</h5>
                            <span className="font-extrabold text-xs text-slate-900">
                              {item.price.toLocaleString()}원
                            </span>
                          </div>
                        </div>
                        <Badge
                          className={`text-[10px] font-bold ${
                            item.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.statusLabel}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {myTradeTab === 'ORDERS' && (
                  <div className="space-y-2.5">
                    {myOrdersList.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 rounded-2xl border bg-slate-50/50"
                      >
                        <div className="flex items-center gap-3">
                          <img src={order.image} alt="order" className="h-12 w-12 rounded-xl object-cover" />
                          <div>
                            <span className="text-[10px] text-emerald-600 font-bold block">{order.statusText}</span>
                            <h5 className="font-bold text-xs text-slate-900 line-clamp-1">{order.title}</h5>
                            <span className="font-black text-xs text-slate-900">{order.price.toLocaleString()}원 · {order.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => {
                              setActiveTab('CHAT')
                              setChatSubTab('CHATS')
                            }}
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 px-3 rounded-xl font-bold"
                          >
                            판매자와 대화
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* [모바일 앱 100% 동일] (6) 소셜 & 크리에이터 설정 (3대 메뉴) */}
              <div className="rounded-3xl bg-white p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b pb-3">
                  <Sliders className="h-4 w-4 text-purple-600" />
                  소셜 & 크리에이터 설정
                </h4>

                <div className="divide-y divide-slate-100">
                  {/* 대표 갤러리 관리 */}
                  <div className="py-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-xs text-slate-900">대표 갤러리 관리 (최대 9장)</h5>
                        <p className="text-[11px] text-muted-foreground">매칭 및 바텀시트에 노출될 대표 프로필 사진</p>
                      </div>
                      <span className="text-xs font-bold text-pink-600">{galleryPhotos.length} / 9장</span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {galleryPhotos.map((url, i) => (
                        <div key={i} className="relative h-16 w-16 rounded-xl overflow-hidden border shrink-0 group">
                          <img src={url} alt="gal" className="h-full w-full object-cover" />
                          <button
                            onClick={() => setGalleryPhotos((p) => p.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 h-4 w-4 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                      {galleryPhotos.length < 9 && (
                        <button
                          onClick={() => {
                            setGalleryPhotos((p) => [
                              ...p,
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
                            ])
                            toast({ title: '사진 추가 완료', description: '대표 갤러리에 새 사진이 추가되었습니다.' })
                          }}
                          className="h-16 w-16 rounded-xl border-2 border-dashed border-slate-200 hover:border-pink-300 flex flex-col items-center justify-center text-slate-400 hover:text-pink-600 shrink-0 transition-colors"
                        >
                          <PlusCircle className="h-5 w-5" />
                          <span className="text-[9px] font-bold mt-0.5">추가</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 1:1 대화 및 영상 단가설정 */}
                  <div className="py-3.5 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">1:1 대화 및 영상 단가설정</h5>
                      <p className="text-[11px] text-muted-foreground">
                        현재 설정: 채팅 건당 {chatRoomRate} P / 영상 분당 {videoCallRate} P
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsRateSettingOpen(true)}
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 px-3 rounded-xl font-bold"
                    >
                      단가 설정
                    </Button>
                  </div>

                  {/* 알림 수신 설정 */}
                  <div className="py-3.5 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">알림 수신 설정</h5>
                      <p className="text-[11px] text-muted-foreground">
                        채팅 알림({notifyChat ? 'ON' : 'OFF'}), 관심 LIVE({notifyLive ? 'ON' : 'OFF'}), 야간 알림 제한({notifyNightLimit ? 'ON' : 'OFF'})
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsNotifySettingOpen(true)}
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 px-3 rounded-xl font-bold"
                    >
                      알림 맞춤설정
                    </Button>
                  </div>
                </div>
              </div>

              {/* [모바일 앱 100% 동일] (7) 안심 보호 & 고객지원 (4대 메뉴) */}
              <div className="rounded-3xl bg-white p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b pb-3">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  안심 보호 & 고객지원
                </h4>

                <div className="divide-y divide-slate-100">
                  {/* 내가 차단한 회원 관리 */}
                  <div className="py-3.5 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">내가 차단한 회원 관리</h5>
                      <p className="text-[11px] text-muted-foreground">
                        차단 회원 목록 ({blockedUsers.length}명) 및 차단 해제 설정
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsBlockedUsersOpen(true)}
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 px-3 rounded-xl font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      차단 목록 관리
                    </Button>
                  </div>

                  {/* 임시 캐시 및 저장공간 정리 */}
                  <div className="py-3.5 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">임시 캐시 및 저장공간 정리</h5>
                      <p className="text-[11px] text-muted-foreground">현재 캐시 사용량: {cacheSize}</p>
                    </div>
                    <Button
                      onClick={() => {
                        setCacheSize('0 B')
                        toast({
                          title: '🧹 캐시 정리 완료',
                          description: '임시 저장 데이터 및 미디어 캐시가 깨끗하게 비워졌습니다.',
                        })
                      }}
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 px-3 rounded-xl font-bold"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      캐시 정리
                    </Button>
                  </div>

                  {/* AI 안심 케어 센터 */}
                  <div className="py-3.5 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">AI 안심 케어 센터</h5>
                      <p className="text-[11px] text-muted-foreground">
                        실시간 비전 AI 방송 감시, 클린 텍스트 사기 필터링 및 개인정보 보호
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsSafetyCenterOpen(true)}
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 px-3 rounded-xl font-bold text-purple-700 border-purple-200 hover:bg-purple-50"
                    >
                      안심 케어 보기
                    </Button>
                  </div>

                  {/* 고객센터 및 1:1 문의 */}
                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-xs text-slate-900">고객센터 & 1:1 상담</h5>
                        <span className="font-extrabold text-xs text-pink-600">TEL. 1588-0000</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        평일 09:00 ~ 18:00 / 1:1 온라인 고객문의 상시 접수 지원
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsCustomerInquiryOpen(true)}
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-8 px-3.5 rounded-xl"
                    >
                      <PhoneCall className="h-3.5 w-3.5 mr-1" />
                      1:1 고객문의 접수
                    </Button>
                  </div>
                </div>

                {/* 약관 버튼들 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSelectedLegalSlug('terms-of-service')
                      setLegalModalOpen(true)
                    }}
                    className="p-2.5 rounded-xl border border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/50 text-[11px] font-bold text-slate-700 text-center transition-all"
                  >
                    서비스 이용약관
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLegalSlug('privacy-policy')
                      setLegalModalOpen(true)
                    }}
                    className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50 text-[11px] font-bold text-[#FF3B6B] text-center transition-all"
                  >
                    개인정보처리방침
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLegalSlug('financial-terms')
                      setLegalModalOpen(true)
                    }}
                    className="p-2.5 rounded-xl border border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/50 text-[11px] font-bold text-slate-700 text-center transition-all"
                  >
                    전자금융거래 약관
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLegalSlug('youth-protection')
                      setLegalModalOpen(true)
                    }}
                    className="p-2.5 rounded-xl border border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/50 text-[11px] font-bold text-slate-700 text-center transition-all"
                  >
                    청소년보호정책
                  </button>
                </div>
              </div>
            </div>
          )}</main>

        {/* ========================================================= */}
        {/* 3. Sleek & Minimal Footer (타사 Buzzworks 스타일 준수)       */}
        {/* ========================================================= */}
        <footer className="mt-16 bg-[#111111] text-slate-400 text-xs">
          <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
              {/* Left Side: Brand & Company Details */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black tracking-tight text-white">MOCCO</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-[#FF3B6B]">
                      모꼬
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-200 mt-1">주식회사 모꼬글로벌</p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 leading-relaxed font-light">
                  <p>서울시 강남구 테헤란로 152 강남파이낸스센터 12층</p>
                  <p>TEL. 1588-0000 / FAX. 02-123-4567</p>
                  <p>E-MAIL. SUPPORT@MOCCO.KR</p>
                  <p className="text-[11px] text-slate-500 pt-1">
                    사업자등록번호: 123-86-12345 | 대표: 손준호 | 통신판매업신고: 제 2026-서울강남-0123 호
                  </p>
                </div>
              </div>

              {/* Right Side: Copyright */}
              <div className="md:text-right shrink-0 space-y-1 text-slate-500 text-xs tracking-wider font-medium">
                <p>COPYRIGHT (C) MOCCO GLOBAL INC.</p>
                <p>ALL RIGHTS RESERVED.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* ========================================================= */}
      {/* 4. Mobile Bottom Navigation Bar (md:hidden)               */}
      {/* 100% Matching apps/mobile TabNavigator                     */}
      {/* ========================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t shadow-lg px-2 py-1.5 flex items-center justify-around">
        {/* 1. 홈 */}
        <button
          onClick={() => setActiveTab('HOME')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 ${
            activeTab === 'HOME' ? 'text-pink-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px]">모꼬홈</span>
        </button>

        {/* 2. 마켓 */}
        <button
          onClick={() => setActiveTab('MARKET')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 ${
            activeTab === 'MARKET' ? 'text-emerald-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Store className="h-5 w-5" />
          <span className="text-[10px]">모꼬마켓</span>
        </button>

        {/* 3. 라이브 (중앙 돌출 라운드 그라디언트 FAB) */}
        <button
          onClick={() => setActiveTab('LIVE')}
          className="relative -top-3 flex flex-col items-center group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#FF3B6B] to-[#8B5CF6] text-white shadow-lg shadow-[#FF3B6B]/30 group-active:scale-95 transition-transform">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <span className="text-[10px] font-extrabold text-[#FF3B6B] mt-0.5">
            모꼬 LIVE
          </span>
        </button>

        {/* 4. 채팅 */}
        <button
          onClick={() => setActiveTab('CHAT')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 ${
            activeTab === 'CHAT' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-[10px]">모꼬쳇</span>
        </button>

        {/* 5. 마이 */}
        <button
          onClick={() => setActiveTab('MY')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 ${
            activeTab === 'MY' ? 'text-purple-600 font-bold' : 'text-slate-500'
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px]">마이모꼬</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 5. Global Modals Section                                  */}
      {/* ========================================================= */}

      {/* 0) Location Selector Modal (동네 변경) */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border space-y-4">
            <button
              onClick={() => setIsLocationModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                <MapPin className="h-5 w-5 text-pink-600" />
                동네 위치 설정
              </h3>
              <p className="text-xs text-muted-foreground">
                이웃을 검색하고 소통할 기준 동네를 선택해주세요.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {[
                '서울 강남구 역삼1동 (현재 위치)',
                '경기 성남시 분당구 정자동',
                '서울 서초구 서초2동',
                '서울 송파구 잠실본동',
                '서울 마포구 공덕동',
                '부산 해운대구 우동',
                '전남 여수시 학동',
                '전북 전주시 완산구 효자동',
              ].map((loc) => {
                const isCurrent = loc.startsWith(currentLocation.split(' ')[1] || '역삼1동')
                return (
                  <button
                    key={loc}
                    onClick={() => {
                      const cleanName = loc.replace(' (현재 위치)', '')
                      setCurrentLocation(cleanName)
                      setIsLocationModalOpen(false)
                      toast({
                        title: '📍 동네 설정 완료',
                        description: `${cleanName}(으)로 동네가 성공적으로 변경되었습니다.`,
                      })
                    }}
                    className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                      isCurrent
                        ? 'bg-pink-50 text-pink-700 border border-pink-200'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{loc}</span>
                    {isCurrent && <Check className="h-4 w-4 text-pink-600" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 1) Legal Document Viewer Modal (전자상거래법/개인정보보호법 전문 열람) */}
      {legalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border space-y-4 max-h-[85vh] flex flex-col">
            <button
              onClick={() => setLegalModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1 pr-8">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-slate-700" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {LEGAL_DOCUMENTS[selectedLegalSlug]?.title}
                </h3>
              </div>
              <Badge variant="secondary" className="text-[10px] font-bold">
                {LEGAL_DOCUMENTS[selectedLegalSlug]?.category}
              </Badge>
            </div>

            {/* Document Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
              <button
                onClick={() => setSelectedLegalSlug('terms-of-service')}
                className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
                  selectedLegalSlug === 'terms-of-service' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                이용약관
              </button>
              <button
                onClick={() => setSelectedLegalSlug('privacy-policy')}
                className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
                  selectedLegalSlug === 'privacy-policy' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                개인정보처리방침
              </button>
              <button
                onClick={() => setSelectedLegalSlug('financial-terms')}
                className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
                  selectedLegalSlug === 'financial-terms' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                전자금융거래약관
              </button>
              <button
                onClick={() => setSelectedLegalSlug('youth-protection')}
                className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
                  selectedLegalSlug === 'youth-protection' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                청소년보호정책
              </button>
            </div>

            {/* Body Scroll */}
            <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-slate-50 border text-xs text-slate-700 whitespace-pre-line leading-relaxed font-sans">
              {LEGAL_DOCUMENTS[selectedLegalSlug]?.body}
            </div>

            <div className="pt-2">
              <Button
                onClick={() => setLegalModalOpen(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 rounded-xl"
              >
                확인 및 닫기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2) Login & Register Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border space-y-5">
            <button
              onClick={closeLoginModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 rounded-full p-1"
            >
              <X className="h-5 w-5" />
            </button>

            {/* 헤더: 모꼬 로고 & 앱/웹 공용 고객 DB 연동 안내 */}
            <div className="text-center space-y-1.5">
              <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 text-white font-black text-2xl shadow-lg shadow-pink-500/25">
                M
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                모꼬 (MOCCO) 로그인
              </h3>
              <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[11px] font-bold border border-blue-200">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                📱 모바일 앱과 100% 동일한 고객 DB로 실시간 연동
              </div>
              <p className="text-xs text-muted-foreground pt-0.5">
                앱에서 쓰던 포인트, 대화함, 찜 목록이 웹에서도 그대로 유지됩니다.
              </p>
            </div>

            {/* [1] 4대 소셜 간편 로그인 (카카오, 네이버, 구글, 애플 - 가장 빠르고 직관적인 로그인) */}
            <div className="space-y-2 pt-1">
              {/* 카카오 로그인 */}
              <button
                onClick={async () => {
                  const ok = await socialLogin('kakao', {
                    email: 'kakao_user@kakao.com',
                    nickname: '카카오이웃_행복',
                    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
                  })
                  if (ok) {
                    toast({
                      title: '🟡 카카오 로그인 완료!',
                      description: '모바일 앱과 연동된 카카오 계정으로 로그인되었습니다.',
                    })
                  }
                }}
                className="w-full h-11 rounded-2xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black text-xs flex items-center justify-center gap-2.5 shadow-xs transition-all active:scale-[0.99]"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 3c-5.52 0-10 3.48-10 7.78 0 2.76 1.83 5.18 4.6 6.53l-.93 3.44c-.08.31.25.56.51.39l4.13-2.73c.55.08 1.11.12 1.69.12 5.52 0 10-3.48 10-7.78 0-4.3-4.48-7.78-10-7.78z" />
                </svg>
                <span>카카오로 1초 시작하기</span>
              </button>

              {/* 네이버 로그인 */}
              <button
                onClick={async () => {
                  const ok = await socialLogin('naver', {
                    email: 'naver_user@naver.com',
                    nickname: '네이버쇼퍼_단골',
                    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
                  })
                  if (ok) {
                    toast({
                      title: '🟢 네이버 로그인 완료!',
                      description: '모바일 앱과 연동된 네이버 계정으로 로그인되었습니다.',
                    })
                  }
                }}
                className="w-full h-11 rounded-2xl bg-[#03C75A] hover:bg-[#02b350] text-white font-black text-xs flex items-center justify-center gap-2.5 shadow-xs transition-all active:scale-[0.99]"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
                </svg>
                <span>네이버로 시작하기</span>
              </button>

              {/* 구글 & 애플 2열 분할 */}
              <div className="grid grid-cols-2 gap-2">
                {/* 구글 로그인 */}
                <button
                  onClick={async () => {
                    const ok = await socialLogin('google', {
                      email: 'google_user@gmail.com',
                      nickname: '구글이웃_스마트',
                      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500',
                    })
                    if (ok) {
                      toast({
                        title: '⚪ Google 로그인 완료!',
                        description: '모바일 앱과 연동된 Google 계정으로 로그인되었습니다.',
                      })
                    }
                  }}
                  className="h-10 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-[0.99]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                {/* 애플 로그인 */}
                <button
                  onClick={async () => {
                    const ok = await socialLogin('apple', {
                      email: 'apple_user@privaterelay.appleid.com',
                      nickname: '애플이웃_프리미엄',
                      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
                    })
                    if (ok) {
                      toast({
                        title: '⚫ Apple 로그인 완료!',
                        description: '모바일 앱과 연동된 Apple 계정으로 로그인되었습니다.',
                      })
                    }
                  }}
                  className="h-10 rounded-2xl bg-black hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-[0.99]"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.66-.82 1.11-1.96.99-3.1-.96.04-2.12.64-2.8 1.44-.6.69-1.12 1.83-.98 2.94 1.07.08 2.14-.56 2.79-1.28z" />
                  </svg>
                  <span>Apple</span>
                </button>
              </div>
            </div>

            {/* 구분선 */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-semibold">
                또는 간편 로그인 방식 선택
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            {/* [2] 서브 탭: 닉네임 간편가입 / 이메일·관리자 / 앱 QR코드 로그인 */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                onClick={() => setLoginTab('QUICK')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  loginTab === 'QUICK' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
                }`}
              >
                1초 닉네임
              </button>
              <button
                onClick={() => setLoginTab('EMAIL')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  loginTab === 'EMAIL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
                }`}
              >
                이메일/관리자
              </button>
              <button
                onClick={() => setLoginTab('QR')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  loginTab === 'QR' ? 'bg-white text-indigo-700 shadow-2xs font-black' : 'text-slate-500'
                }`}
              >
                <QrCode className="h-3 w-3" />
                앱 QR로그인
              </button>
            </div>

            {/* 탭별 폼 */}
            {loginTab === 'QUICK' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    사용할 닉네임 입력
                  </label>
                  <Input
                    value={quickNickInput}
                    onChange={(e) => setQuickNickInput(e.target.value)}
                    placeholder="예: 강남이웃_행복 (미입력 시 자동생성)"
                    className="text-xs rounded-xl h-9"
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
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs shadow-md rounded-xl h-9"
                >
                  1초 만에 시작하기
                </Button>
              </div>
            )}

            {loginTab === 'EMAIL' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">이메일</label>
                  <Input
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="admin@tokfriends.com"
                    className="text-xs rounded-xl h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">비밀번호</label>
                  <Input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="비밀번호 입력"
                    className="text-xs rounded-xl h-9"
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
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl h-9 shadow-md mt-1"
                >
                  로그인
                </Button>
              </div>
            )}

            {loginTab === 'QR' && (
              <div className="space-y-3.5 text-center animate-in fade-in duration-150 py-1">
                <div className="mx-auto w-36 h-36 bg-slate-50 border-2 border-indigo-200 rounded-2xl flex flex-col items-center justify-center p-2 shadow-inner relative group">
                  <QrCode className="h-28 w-28 text-slate-900" />
                  <span className="absolute bottom-1 bg-indigo-600 text-white font-mono text-[9px] px-2 py-0.2 rounded-full font-bold">
                    02:59
                  </span>
                </div>

                <div className="space-y-1">
                  <h5 className="font-bold text-xs text-slate-900">
                    스마트폰 모꼬 앱의 [QR 스캔]으로 촬영하세요
                  </h5>
                  <p className="text-[11px] text-muted-foreground">
                    앱에서 승인하면 비밀번호 입력 없이 PC 웹 브라우저에 즉시 로그인됩니다.
                  </p>
                </div>

                <Button
                  onClick={async () => {
                    await socialLogin('kakao', {
                      email: 'mobile_qr_user@tokfriends.com',
                      nickname: '모바일앱_연동이웃',
                      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
                    })
                    toast({
                      title: '🎉 모바일 앱 QR 승인 완료!',
                      description: '모바일 앱과 동일한 회원 DB 계정으로 로그인되었습니다.',
                    })
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl"
                >
                  📱 모바일 앱에서 승인 시뮬레이션
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3) Merchant Application Modal (입점 신청) */}
      {isMerchantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeMerchantModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                  🏪
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  모꼬 입점사(판매자) 등록 신청
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
                    className="text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">사업자등록번호</label>
                  <Input
                    value={merchantForm.businessNumber}
                    onChange={(e) => setMerchantForm({ ...merchantForm, businessNumber: e.target.value })}
                    placeholder="123-45-67890"
                    className="text-xs rounded-xl"
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
                    className="text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">대표 연락처</label>
                  <Input
                    value={merchantForm.contactPhone}
                    onChange={(e) => setMerchantForm({ ...merchantForm, contactPhone: e.target.value })}
                    placeholder="010-1234-5678"
                    className="text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">통신판매업신고번호</label>
                <Input
                  value={merchantForm.onlineOrderNumber}
                  onChange={(e) => setMerchantForm({ ...merchantForm, onlineOrderNumber: e.target.value })}
                  placeholder="예: 제 2024-서울강남-1234호"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">정산 은행</label>
                  <Input
                    value={merchantForm.bankName}
                    onChange={(e) => setMerchantForm({ ...merchantForm, bankName: e.target.value })}
                    placeholder="국민은행"
                    className="text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="font-semibold text-slate-700">정산 계좌번호</label>
                  <Input
                    value={merchantForm.accountNumber}
                    onChange={(e) => setMerchantForm({ ...merchantForm, accountNumber: e.target.value })}
                    placeholder="계좌번호 (- 없이 입력)"
                    className="text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">예금주</label>
                <Input
                  value={merchantForm.accountHolder}
                  onChange={(e) => setMerchantForm({ ...merchantForm, accountHolder: e.target.value })}
                  placeholder="예금주 성명"
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            <Button
              onClick={async () => {
                await applyMerchant(merchantForm)
                toast({
                  title: '🎉 모꼬 공식 입점사 승격 완료!',
                  description: '상단 우측에 [🏪 입점사 셀러 센터] 바로가기 버튼이 활성화되었습니다.',
                })
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl"
            >
              입점사 승격 신청 및 셀러 센터 활성화
            </Button>
          </div>
        </div>
      )}

      {/* 4) Creator Application Modal (크리에이터 신청) */}
      {isCreatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border space-y-4">
            <button
              onClick={closeCreatorModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold">
                  🎙️
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  모꼬 공식 크리에이터 신청
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                크리에이터로 승격되면 방송 중에 마켓 상품을 핀(Pin)하여 실시간 판매하고 커미션 정산을 받을 수 있습니다.
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">활동 채널명 / 닉네임</label>
                <Input
                  value={creatorForm.channelName}
                  onChange={(e) => setCreatorForm({ ...creatorForm, channelName: e.target.value })}
                  placeholder="예: 별빛소통_민지"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">주요 방송 카테고리</label>
                <select
                  value={creatorForm.category}
                  onChange={(e) => setCreatorForm({ ...creatorForm, category: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
                >
                  <option value="소통/일상">소통 / 일상</option>
                  <option value="라이브커머스/푸드">라이브커머스 / 푸드</option>
                  <option value="IT/테크기기">IT / 테크기기</option>
                  <option value="패션/뷰티">패션 / 뷰티</option>
                  <option value="음악/노래">음악 / 라이브 버스킹</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">주 활동 시간대</label>
                <Input
                  value={creatorForm.activeTime}
                  onChange={(e) => setCreatorForm({ ...creatorForm, activeTime: e.target.value })}
                  placeholder="예: 매일 저녁 8시 ~ 10시"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">채널 소개 및 포부</label>
                <Input
                  value={creatorForm.bio}
                  onChange={(e) => setCreatorForm({ ...creatorForm, bio: e.target.value })}
                  placeholder="이웃들과 진솔한 소통 및 신선한 흑돼지 산지직송을 소개하고 싶습니다!"
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            <Button
              onClick={async () => {
                await applyCreator(creatorForm)
                toast({
                  title: '🎉 모꼬 공식 크리에이터 승격 완료!',
                  description: '상단 우측에 [🎙️ 크리에이터 스튜디오] 바로가기 버튼이 활성화되었습니다.',
                })
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 rounded-xl"
            >
              크리에이터 승격 및 스튜디오 활성화
            </Button>
          </div>
        </div>
      )}

      {/* (A) 프로필 수정 모달 */}
      {isProfileEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-extrabold text-sm text-slate-900">프로필 정보 수정</h4>
              <button onClick={() => setIsProfileEditOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">나이</label>
                <Input
                  type="number"
                  value={userAge}
                  onChange={(e) => setUserAge(Number(e.target.value) || 20)}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">성별</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUserGender('여')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      userGender === '여' ? 'bg-pink-600 text-white border-pink-600' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    여성
                  </button>
                  <button
                    onClick={() => setUserGender('남')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      userGender === '남' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    남성
                  </button>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">자기소개 한마디</label>
                <Input
                  value={userHeadline}
                  onChange={(e) => setUserHeadline(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <Button
              onClick={() => {
                setIsProfileEditOpen(false)
                toast({ title: '프로필 수정 완료', description: '프로필 정보가 성공적으로 반영되었습니다.' })
              }}
              className="w-full bg-[#FF3B6B] hover:bg-[#e0345e] text-white font-bold text-xs h-9 rounded-xl shadow-md"
            >
              저장하기
            </Button>
          </div>
        </div>
      )}

      {/* (B) 환전/출금 신청 모달 */}
      {isWithdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-extrabold text-sm text-slate-900">정산금 계좌 출금 신청</h4>
              <button onClick={() => setIsWithdrawOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border space-y-1">
                <span className="text-[11px] text-muted-foreground">출금 가능 정산 잔액</span>
                <p className="text-lg font-black text-slate-900">{sellerRevenue.toLocaleString()} 원</p>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">입금 은행</label>
                <select
                  value={withdrawBank}
                  onChange={(e) => setWithdrawBank(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
                >
                  <option value="국민은행">국민은행</option>
                  <option value="신한은행">신한은행</option>
                  <option value="카카오뱅크">카카오뱅크</option>
                  <option value="토스뱅크">토스뱅크</option>
                  <option value="우리은행">우리은행</option>
                  <option value="하나은행">하나은행</option>
                  <option value="농협은행">농협은행</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">계좌번호</label>
                <Input
                  value={withdrawAccount}
                  onChange={(e) => setWithdrawAccount(e.target.value)}
                  placeholder="'-' 없이 입력"
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">예금주</label>
                <Input
                  value={withdrawHolder}
                  onChange={(e) => setWithdrawHolder(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">출금 신청 금액 (원)</label>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <Button
              onClick={() => {
                const amt = Number(withdrawAmount) || 0
                if (amt <= 0 || amt > sellerRevenue) {
                  toast({ title: '금액 오류', description: '정산 가능 잔액 내에서 입력해주세요.', variant: 'destructive' })
                  return
                }
                setSellerRevenue((prev) => prev - amt)
                setIsWithdrawOpen(false)
                toast({
                  title: '🎉 출금 신청 접수 완료!',
                  description: `${amt.toLocaleString()}원이 등록 계좌로 안전 출금 처리됩니다.`,
                })
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 rounded-xl shadow-md"
            >
              출금 신청하기
            </Button>
          </div>
        </div>
      )}

      {/* (C) 1:1 대화 및 영상 단가설정 모달 */}
      {isRateSettingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-extrabold text-sm text-slate-900">1:1 대화 및 영상 단가설정</h4>
              <button onClick={() => setIsRateSettingOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">💬 1:1 대화방 입장 단가 (건당 P)</label>
                <p className="text-[11px] text-muted-foreground">이웃이 나와 1:1 대화를 시작할 때 소모되는 포인트입니다.</p>
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[100, 300, 500, 1000].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setChatRoomRate(rate)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        chatRoomRate === rate ? 'bg-pink-600 text-white border-pink-600' : 'bg-slate-50 text-slate-700'
                      }`}
                    >
                      {rate} P
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">🎥 1:1 영상/LIVE 단가 (분당 P)</label>
                <p className="text-[11px] text-muted-foreground">1:1 영상 통화 진행 시 분당 차감되는 포인트입니다.</p>
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[500, 1000, 2000, 3000].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setVideoCallRate(rate)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        videoCallRate === rate ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-700'
                      }`}
                    >
                      {rate} P
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Button
              onClick={() => {
                setIsRateSettingOpen(false)
                toast({ title: '단가 설정 저장 완료', description: '새로운 대화/영상 단가가 적용되었습니다.' })
              }}
              className="w-full bg-[#FF3B6B] hover:bg-[#e0345e] text-white font-bold text-xs h-9 rounded-xl shadow-md"
            >
              설정 완료
            </Button>
          </div>
        </div>
      )}

      {/* (D) 알림 수신 설정 모달 */}
      {isNotifySettingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-extrabold text-sm text-slate-900">알림 수신 설정</h4>
              <button onClick={() => setIsNotifySettingOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs divide-y divide-slate-100">
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <h6 className="font-bold text-slate-900">1:1 대화 알림</h6>
                  <p className="text-[11px] text-muted-foreground">새로운 메시지가 도착했을 때 푸시 알림</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyChat}
                  onChange={(e) => setNotifyChat(e.target.checked)}
                  className="h-4 w-4 rounded accent-pink-600"
                />
              </div>
              <div className="pt-3 flex items-center justify-between">
                <div>
                  <h6 className="font-bold text-slate-900">관심 크리에이터 LIVE 알림</h6>
                  <p className="text-[11px] text-muted-foreground">팔로우한 크리에이터가 방송을 시작할 때 알림</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyLive}
                  onChange={(e) => setNotifyLive(e.target.checked)}
                  className="h-4 w-4 rounded accent-purple-600"
                />
              </div>
              <div className="pt-3 flex items-center justify-between">
                <div>
                  <h6 className="font-bold text-slate-900">야간 알림 제한 (22:00 ~ 08:00)</h6>
                  <p className="text-[11px] text-muted-foreground">수면 시간 동안 소리/진동을 차단합니다</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyNightLimit}
                  onChange={(e) => setNotifyNightLimit(e.target.checked)}
                  className="h-4 w-4 rounded accent-slate-800"
                />
              </div>
            </div>
            <Button
              onClick={() => {
                setIsNotifySettingOpen(false)
                toast({ title: '알림 설정 저장', description: '알림 수신 환경이 맞춤 설정되었습니다.' })
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 rounded-xl shadow-md"
            >
              완료
            </Button>
          </div>
        </div>
      )}

      {/* (E) 차단 회원 관리 모달 */}
      {isBlockedUsersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-extrabold text-sm text-slate-900">내가 차단한 회원 관리</h4>
              <button onClick={() => setIsBlockedUsersOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
              {blockedUsers.length === 0 ? (
                <p className="text-center text-slate-400 py-6">차단된 회원이 없습니다.</p>
              ) : (
                blockedUsers.map((user) => (
                  <div key={user} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border">
                    <span className="font-bold text-slate-800">{user}</span>
                    <Button
                      onClick={() => {
                        setBlockedUsers((p) => p.filter((u) => u !== user))
                        toast({ title: '차단 해제', description: `${user}님의 차단이 해제되었습니다.` })
                      }}
                      size="sm"
                      variant="outline"
                      className="text-[11px] h-7 px-2.5 rounded-lg border-slate-300"
                    >
                      차단 해제
                    </Button>
                  </div>
                ))
              )}
            </div>
            <Button
              onClick={() => setIsBlockedUsersOpen(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 rounded-xl shadow-md"
            >
              닫기
            </Button>
          </div>
        </div>
      )}

      {/* (F) AI 안심 케어 센터 모달 */}
      {isSafetyCenterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                AI 안심 케어 센터
              </h4>
              <button onClick={() => setIsSafetyCenterOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs leading-relaxed text-slate-600">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-900 space-y-1">
                <span className="font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  실시간 비전 AI 방송 감시
                </span>
                <p className="text-[11px] text-emerald-800">
                  방송 중 유해 영상이나 불법 콘텐츠 감지 시 즉시 블라인드 처리 및 계정 자동 차단이 실행됩니다.
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-blue-900 space-y-1">
                <span className="font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                  클린 텍스트 사기 필터링
                </span>
                <p className="text-[11px] text-blue-800">
                  비방, 욕설, 금전 사기 유도 문구를 실시간 마스킹하고 안전 결제만을 유도합니다.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border text-slate-700 space-y-1">
                <span className="font-bold text-xs">철저한 개인정보 보호</span>
                <p className="text-[11px] text-slate-500">
                  휴대폰 번호 및 실제 상세 위치는 상대방에게 절대 노출되지 않으며 안심 번호로 중개됩니다.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsSafetyCenterOpen(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 rounded-xl shadow-md"
            >
              확인
            </Button>
          </div>
        </div>
      )}

      {/* (G) 1:1 고객문의 접수 모달 */}
      {isCustomerInquiryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-extrabold text-sm text-slate-900">1:1 고객 문의 접수</h4>
              <button onClick={() => setIsCustomerInquiryOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">문의 유형</label>
                <select
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
                >
                  <option value="거래/결제/정산 문의">거래 / 결제 / 정산 문의</option>
                  <option value="사기/불량 이용자 신고">사기 / 불량 이용자 신고</option>
                  <option value="계정/로그인 문의">계정 / 로그인 문의</option>
                  <option value="입점/크리에이터 제휴 문의">입점 / 크리에이터 제휴 문의</option>
                  <option value="기타 제안 및 오류 제보">기타 제안 및 오류 제보</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">연락처 또는 이메일</label>
                <Input
                  value={inquiryContact}
                  onChange={(e) => setInquiryContact(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">문의 내용</label>
                <textarea
                  value={inquiryContent}
                  onChange={(e) => setInquiryContent(e.target.value)}
                  rows={4}
                  placeholder="문의 내용을 상세히 작성해주세요."
                  className="w-full rounded-xl border border-input bg-background p-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
                />
              </div>
            </div>
            <Button
              onClick={() => {
                if (!inquiryContent.trim()) {
                  toast({ title: '내용 입력', description: '문의 내용을 입력해주세요.', variant: 'destructive' })
                  return
                }
                setIsCustomerInquiryOpen(false)
                setInquiryContent('')
                toast({
                  title: '🎉 고객문의 접수 완료',
                  description: '운영팀에서 확인 후 신속하게 연락드리겠습니다.',
                })
              }}
              className="w-full bg-[#FF3B6B] hover:bg-[#e0345e] text-white font-bold text-xs h-9 rounded-xl shadow-md"
            >
              접수하기
            </Button>
          </div>
        </div>
      )}

      {/* (H) 리워드 광고 무료 충전 모달 */}
      {isRewardAdOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-950 text-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 border border-violet-500/40 text-center">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <Badge className="bg-violet-600 text-white font-bold text-[10px]">SPONSORED AD</Badge>
              <span>{rewardAdCountdown}초 후 적립</span>
            </div>
            <div className="py-6 space-y-2">
              <span className="text-5xl animate-bounce block">✨🎁</span>
              <h4 className="font-black text-lg text-white">모꼬 라이프 프리미엄</h4>
              <p className="text-xs text-slate-300">
                광고 시청을 완료하면 모꼬 포인트 +10 ON이 즉시 무료 지급됩니다!
              </p>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-1000"
                style={{ width: `${((3 - rewardAdCountdown) / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 6) Live Room Viewer Modal (최대 화면비율 영상 & 우측 채팅방 & 3D 선물 시스템) */}
      {activeLiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-[1360px] h-[92vh] max-h-[920px] rounded-3xl bg-slate-950 text-white shadow-2xl border border-slate-800/90 overflow-hidden flex flex-col md:flex-row">
            
            {/* [좌측: 최대 영상 비율 라이브 비디오 플레이어 화면] */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden h-full select-none">
              {/* 은은한 앰비언트 백그라운드 블러 글로우 */}
              <div
                className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-30 scale-125 pointer-events-none"
                style={{ backgroundImage: `url(${activeLiveModal.coverUrl})` }}
              />
              <div className="absolute inset-0 bg-black/60 pointer-events-none" />

              {/* 9:16 모바일 라이브 본래 비율을 온전히 살린 대형 비디오 캔버스 컨테이너 */}
              <div className="relative h-full aspect-[9/16] max-w-full flex items-center justify-center overflow-hidden bg-slate-950 shadow-2xl ring-1 ring-white/10">
                <img
                  src={activeLiveModal.coverUrl}
                  alt="stream"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none" />

                {/* 상단 오버레이 헤더 (LIVE 배지, 시청자 수, 방송자) */}
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-20">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-rose-600 text-white font-extrabold border-none text-[10px] px-2.5 py-1 shadow-md flex items-center gap-1.5">
                      <span className="flex h-2 w-2 rounded-full bg-white animate-ping" />
                      LIVE ON-AIR
                    </Badge>
                    <span className="text-xs text-white/95 font-bold bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-rose-400" />
                      시청자 {activeLiveModal.viewerCount.toLocaleString()}명
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-black/50 text-slate-300 font-bold px-2 py-0.5 rounded-md border border-white/10">
                      HD 1080p
                    </span>
                    <button
                      onClick={() => setIsLiveMuted((prev) => !prev)}
                      className="h-7 w-7 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white/90 border border-white/10 transition-colors"
                    >
                      {isLiveMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* ✨ 3D 모꼬 선물 전체 화면 애니메이션 이펙트 (GiftEffectOverlay) */}
                {liveGiftEffect && (
                  <div className="absolute inset-0 z-30 bg-black/65 flex flex-col items-center justify-center p-6 text-center pointer-events-none animate-in fade-in zoom-in-75 duration-300">
                    <div className="relative mb-3">
                      <span className="text-7xl sm:text-8xl animate-bounce block drop-shadow-2xl">
                        {liveGiftEffect.icon}
                      </span>
                      <span className="absolute -top-4 -right-4 text-4xl animate-spin">✨</span>
                      <span className="absolute -bottom-3 -left-4 text-4xl animate-ping">💖</span>
                      <span className="absolute -top-2 -left-3 text-3xl animate-bounce">🪙</span>
                    </div>

                    <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-amber-400/40 mb-2 shadow-lg">
                      <span className="text-[11px] font-extrabold text-amber-300">
                        🎉 {liveGiftEffect.sender}님의 특별 모꼬 선물!
                      </span>
                    </div>

                    <h3 className="font-black text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-rose-400 drop-shadow-lg">
                      {liveGiftEffect.name}
                    </h3>

                    <p className="text-xs sm:text-sm text-white/95 mt-1.5 max-w-xs drop-shadow-md leading-snug font-medium">
                      {liveGiftEffect.description}
                    </p>

                    <Badge className="mt-3 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-black text-xs px-4 py-1 border-none shadow-xl">
                      +{liveGiftEffect.amount.toLocaleString()} ON 후원 완료
                    </Badge>
                  </div>
                )}

                {/* 플로팅 하트 애니메이션 (응원 터치 시) */}
                {floatingHearts.map((h) => (
                  <div
                    key={h.id}
                    style={{ left: `${h.left}%`, color: h.color }}
                    className="absolute bottom-28 text-3xl pointer-events-none animate-float-heart drop-shadow-md z-25"
                  >
                    💖
                  </div>
                ))}

                {/* 🔴 방송 단독 핀 특가 상품 (In-stream Pinned Commerce Card) */}
                {activeLiveModal.pinnedProduct && (
                  <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center gap-3 rounded-2xl bg-white/95 p-3 text-slate-900 shadow-2xl backdrop-blur-md border border-white/50">
                    <img
                      src={activeLiveModal.pinnedProduct.image}
                      alt="product"
                      className="h-13 w-13 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        방송 단독 핀 특가 상품
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {activeLiveModal.pinnedProduct.title}
                      </h4>
                      <span className="text-sm font-black text-slate-950">
                        {activeLiveModal.pinnedProduct.price.toLocaleString()}원
                      </span>
                    </div>
                    <Button
                      onClick={() => {
                        requireAuth(() => {
                          setCheckoutTarget({
                            title: activeLiveModal.pinnedProduct!.title,
                            price: activeLiveModal.pinnedProduct!.price,
                            shippingFee: 3000,
                            image: activeLiveModal.pinnedProduct!.image,
                          })
                          setIsCheckoutOpen(true)
                        })
                      }}
                      className="bg-gradient-to-r from-[#FF3B6B] to-[#8B5CF6] hover:opacity-95 text-white font-black text-xs h-9 px-3.5 shrink-0 shadow-md shadow-[#FF3B6B]/25 rounded-xl"
                    >
                      즉시 구매
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* [우측: 실시간 라이브 채팅방 & 3D 선물 후원 시스템] */}
            <div className="w-full md:w-[380px] lg:w-[420px] flex flex-col bg-slate-900/98 border-l border-slate-800 shrink-0 h-full relative">
              {/* (1) 채팅 헤더: 호스트 정보 & 내 보유 포인트 & 닫기(X) 버튼 (충돌 없이 깔끔 분리) */}
              <div className="p-3.5 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <img
                      src={activeLiveModal.hostAvatar}
                      alt="host"
                      className="h-9 w-9 rounded-full object-cover border-2 border-pink-500/60"
                    />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-slate-900" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-white truncate max-w-[140px]">
                        {activeLiveModal.hostNickname}
                      </span>
                      <Badge className="bg-purple-900/60 text-purple-300 border border-purple-500/40 text-[9px] px-1.5 py-0 font-bold">
                        크리에이터
                      </Badge>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {activeLiveModal.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60 text-right">
                    <span className="text-[9px] text-slate-400 block font-semibold leading-tight">내 포인트</span>
                    <span className="text-[11px] font-black text-amber-300 leading-tight">
                      {myPoints.toLocaleString()} ON
                    </span>
                  </div>

                  {/* 닫기 버튼: 헤더 우측에 단독 배치하여 어떤 요소와도 겹치지 않음 */}
                  <button
                    onClick={() => setActiveLiveModal(null)}
                    className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* (2) 실시간 채팅 메시지 스트림 (선물 카드 포함) */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 text-xs bg-slate-950/60">
                {liveChatMessages.map((m, i) => (
                  <div key={i} className="animate-in fade-in duration-150">
                    {m.isGift && m.gift ? (
                      /* 선물 전송 카드 말풍선 */
                      <div className="rounded-2xl p-2.5 bg-gradient-to-r from-pink-950/80 via-rose-950/80 to-slate-900 border border-pink-500/40 text-white shadow-md flex items-center justify-between gap-2 my-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-2xl shrink-0">{m.gift.icon}</span>
                          <div className="min-w-0">
                            <span className="text-[10px] text-pink-300 font-bold block truncate">
                              {m.sender}
                            </span>
                            <span className="text-xs font-black text-amber-300 block truncate">
                              {m.gift.name} 선물!
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black bg-pink-500/30 text-pink-200 px-2 py-0.5 rounded-full shrink-0 border border-pink-400/30">
                          +{m.gift.amount.toLocaleString()} ON
                        </span>
                      </div>
                    ) : m.isSystem ? (
                      /* 시스템 공지 */
                      <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-2 text-blue-300 text-[11px] leading-relaxed">
                        <span className="font-bold text-blue-400 mr-1.5">[공지]</span>
                        {m.text}
                      </div>
                    ) : (
                      /* 일반 유저 채팅 */
                      <div className="flex items-start gap-1.5 leading-snug">
                        <span className="font-bold text-pink-400 shrink-0">{m.sender}:</span>
                        <span className="text-slate-200 break-all">{m.text}</span>
                        {m.time && <span className="text-[9px] text-slate-500 shrink-0 ml-auto">{m.time}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* (3) 🎁 폰 선물함과 100% 동일한 3D 선물 선택 바텀 트레이 */}
              {isLiveGiftPickerOpen && (
                <div className="absolute inset-x-0 bottom-16 bg-slate-950/95 border-t border-pink-500/30 p-3.5 space-y-3 z-40 backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom duration-200">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Gift className="h-4 w-4 text-pink-400" />
                      <span className="font-extrabold text-xs text-white">
                        모꼬 3D 라이브 선물상자
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                        보유 {myPoints.toLocaleString()} ON
                      </span>
                      <button
                        onClick={() => setIsLiveGiftPickerOpen(false)}
                        className="h-6 w-6 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 카테고리 탭 */}
                  <div className="flex items-center gap-1 text-[10px] font-bold">
                    {[
                      { key: 'all', label: '전체' },
                      { key: 'mocco_special', label: '3D 모꼬' },
                      { key: 'mocco_vip', label: 'VIP 모꼬' },
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => setLiveGiftCategory(cat.key as any)}
                        className={`px-2.5 py-1 rounded-lg transition-colors ${
                          liveGiftCategory === cat.key
                            ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* 선물 그리드 */}
                  <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[220px] pr-1">
                    {MOCCO_CHAT_GIFTS
                      .filter((g) => (liveGiftCategory === 'all' ? true : g.category === liveGiftCategory))
                      .map((gift) => (
                        <div
                          key={gift.id}
                          onClick={() => handleSendLiveGiftItem(gift)}
                          className="group p-2.5 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-pink-950/40 hover:border-pink-500/60 transition-all cursor-pointer text-left space-y-1 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-2xl group-hover:scale-110 transition-transform">{gift.icon}</span>
                            <span className="text-[10px] font-black text-amber-300 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/20">
                              {gift.pricePoints.toLocaleString()} ON
                            </span>
                          </div>
                          <div>
                            <h6 className="font-bold text-[11px] text-white truncate">
                              {gift.name}
                            </h6>
                            <p className="text-[9px] text-slate-400 line-clamp-1">
                              {gift.description}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="w-full h-5 text-[9px] bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold rounded-lg mt-1"
                          >
                            선물하기
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* (4) 하단 실시간 채팅 & 선물 & 응원 툴바 */}
              <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2 shrink-0">
                {/* 🎁 선물하기 버튼 (선물함 열기) */}
                <Button
                  onClick={() => setIsLiveGiftPickerOpen((prev) => !prev)}
                  size="sm"
                  className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs h-9 px-3 rounded-xl shrink-0 shadow-md flex items-center gap-1"
                >
                  <Gift className="h-3.5 w-3.5" />
                  <span>선물</span>
                </Button>

                {/* 💖 라이브 응원 하트 버튼 */}
                <button
                  onClick={handleSendFloatingHeart}
                  className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-rose-400 hover:text-rose-300 border border-slate-700/60 shrink-0 transition-transform active:scale-90"
                  title="라이브 응원하기"
                >
                  <Heart className="h-4 w-4 fill-rose-500" />
                </button>

                {/* 채팅 입력창 */}
                <Input
                  value={liveChatInput}
                  onChange={(e) => setLiveChatInput(e.target.value)}
                  placeholder="실시간 댓글 남기기..."
                  className="text-xs bg-slate-800/90 border-slate-700 text-white rounded-xl h-9 placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-pink-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendLiveChat()
                  }}
                />

                {/* 전송 버튼 */}
                <Button
                  onClick={handleSendLiveChat}
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-9 w-9 p-0 shrink-0 rounded-xl shadow-md"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7) Used Product Detail Modal */}
      {selectedUsedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedUsedItem(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-100">
              <img
                src={selectedUsedItem.images[0]}
                alt={selectedUsedItem.title}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={selectedUsedItem.sellerAvatar}
                  alt="avatar"
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    {selectedUsedItem.sellerNickname}
                  </h4>
                  <span className="text-[10px] text-muted-foreground">
                    {selectedUsedItem.locationName}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-bold text-orange-600 border-orange-200">
                매너온도 {selectedUsedItem.mannerTemp}℃
              </Badge>
            </div>

            <div className="space-y-1 pt-1 border-t">
              <h3 className="text-base font-bold text-slate-900">{selectedUsedItem.title}</h3>
              <p className="text-xl font-black text-slate-900">
                {selectedUsedItem.price.toLocaleString()}원
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-700">상품 상세 설명</h4>
              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed bg-slate-50/50 p-3 rounded-xl border">
                {selectedUsedItem.description}
              </p>
            </div>

            {/* Korean Legal & Escrow Guide Banner */}
            <div className="rounded-xl bg-orange-50/70 p-3 border border-orange-200/60 text-[11px] text-orange-950 space-y-1">
              <div className="font-bold text-orange-800 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-orange-600" />
                동네 중고 에스크로 안심거래 안내
              </div>
              <p>• 직거래 시 유동인구가 많은 안전한 장소에서 거래하시고, 택배 거래 시에는 에스크로 안전결제를 이용해주세요.</p>
              <p>• 에스크로 안전결제 이용 시 구매자가 최종 물품을 확인하고 [구매확정]을 완료해야 판매자에게 정산금이 전달됩니다.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                onClick={() => {
                  requireAuth(() => {
                    const target = selectedUsedItem
                    setSelectedUsedItem(null)
                    // Open Chat with seller
                    const existing = chatRooms.find((r) => r.targetNickname.includes(target.sellerNickname))
                    if (existing) {
                      setActiveChatRoom(existing)
                    } else {
                      const newRoom: ChatRoomItem = {
                        id: 'chat-used-' + Date.now(),
                        type: 'MARKET',
                        targetNickname: target.sellerNickname,
                        targetAvatar: target.sellerAvatar,
                        lastMessage: '상품 문의드립니다!',
                        lastTime: '방금',
                        unreadCount: 0,
                        productInfo: {
                          id: target.id,
                          title: target.title,
                          price: target.price,
                          image: target.images[0],
                        },
                        messages: [
                          {
                            id: 'msg-used-1',
                            senderId: 'me',
                            senderNickname: '나',
                            text: `안녕하세요! 등록하신 '${target.title}' 상품 문의드립니다.`,
                            time: '방금',
                            isMe: true,
                          },
                        ],
                      }
                      setChatRooms([newRoom, ...chatRooms])
                      setActiveChatRoom(newRoom)
                    }
                    setActiveTab('CHAT')
                    setChatSubTab('CHATS')
                    toast({
                      title: '💬 1:1 대화방 연결',
                      description: `${target.sellerNickname} 님과의 대화창으로 이동했습니다.`,
                    })
                  })
                }}
                variant="outline"
                className="text-xs font-bold h-10 border-blue-200 text-blue-700 bg-blue-50/50 rounded-xl"
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
                className="bg-gradient-to-r from-[#FF3B6B] to-[#8B5CF6] hover:opacity-90 text-white font-bold text-xs h-10 shadow-md shadow-[#FF3B6B]/20 rounded-xl"
              >
                <ShieldCheck className="h-4 w-4 mr-1.5" />
                에스크로 안전구매
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 8) Market Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-100">
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

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border">
              {selectedProduct.description}
            </p>

            {/* Korean E-commerce Law Notice */}
            <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-200/60 text-[11px] text-emerald-950 space-y-1">
              <div className="font-bold text-emerald-800 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                전자상거래법 소비자 보호 규정 준수
              </div>
              <p>• 전자상거래법 제17조에 따라 상품 수령 후 7일 이내 청약철회(반품/환불)가 가능합니다. (단, 신선식품 등 시간 경과 시 재판매가 곤란한 재화는 예외 적용)</p>
              <p>• 결제 대금은 구매자가 구매확정 시까지 토스페이먼츠 에스크로 계좌에 안전하게 예치됩니다.</p>
            </div>

            <div className="flex items-center justify-between py-2 border-y text-xs">
              <span className="font-semibold text-slate-700">주문 수량</span>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-lg"
                >
                  -
                </Button>
                <span className="font-bold text-sm">{quantity}</span>
                <Button
                  onClick={() => setQuantity(quantity + 1)}
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-lg"
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
              className="w-full bg-gradient-to-r from-[#FF3B6B] to-[#8B5CF6] hover:opacity-90 text-white font-bold text-xs h-10 shadow-md shadow-[#FF3B6B]/20 rounded-xl"
            >
              에스크로 안전결제 주문하기 (총 {(selectedProduct.price * quantity + selectedProduct.shippingFee).toLocaleString()}원)
            </Button>
          </div>
        </div>
      )}

      {/* 9) Checkout Modal (에스크로 결제 & 미성년자 고지 포함) */}
      {isCheckoutOpen && checkoutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border space-y-4">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                모꼬 에스크로 안전결제 주문
              </h3>
              <p className="text-xs text-muted-foreground">
                구매 확정 시까지 결제 대금이 플랫폼(토스페이먼츠)에 안전하게 보관됩니다.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border">
              <img
                src={checkoutTarget.image}
                alt="target"
                className="h-12 w-12 rounded-xl object-cover"
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

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">받는 분 성함</label>
                  <Input
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">연락처</label>
                  <Input
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">배송지 주소</label>
                <Input
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="text-xs rounded-xl"
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
                    className="text-xs h-8 rounded-xl"
                  >
                    신용/체크카드
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setPayMethod('TOSS_PAY')}
                    variant={payMethod === 'TOSS_PAY' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-8 rounded-xl"
                  >
                    토스페이
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setPayMethod('KAKAO_PAY')}
                    variant={payMethod === 'KAKAO_PAY' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-8 rounded-xl"
                  >
                    카카오페이
                  </Button>
                </div>
              </div>

              {/* Korean Consumer Protection Notice */}
              <div className="rounded-xl bg-slate-50 p-2.5 border text-[10px] text-slate-500 space-y-0.5">
                <p>• <strong>에스크로 보호</strong>: 구매확정 전까지 결제 대금이 안전하게 예치됩니다.</p>
                <p>• <strong>미성년자 결제 안내</strong>: 미성년자가 법정대리인의 동의 없이 구매한 경우 취소할 수 있습니다.</p>
              </div>
            </div>

            <Button
              onClick={handleExecutePayment}
              disabled={isProcessingPay}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-10 rounded-xl"
            >
              {isProcessingPay ? '안전결제 승인 진행 중...' : `총 ${(checkoutTarget.price + checkoutTarget.shippingFee).toLocaleString()}원 결제하기`}
            </Button>
          </div>
        </div>
      )}

      {/* 10) New Used Item Modal */}
      {isNewUsedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border space-y-4">
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
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">희망 판매가격 (원)</label>
                  <Input
                    value={newUsedPrice}
                    onChange={(e) => setNewUsedPrice(e.target.value)}
                    placeholder="예: 450000"
                    className="text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">카테고리</label>
                  <select
                    value={newUsedCategory}
                    onChange={(e) => setNewUsedCategory(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
                  >
                    <option value="디지털/가전">디지털/가전</option>
                    <option value="가구/인테리어">가구/인테리어</option>
                    <option value="패션/의류">패션/의류</option>
                    <option value="생활/리빙">생활/리빙</option>
                    <option value="식품/신선">식품/신선</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">희망 거래 동네</label>
                <Input
                  value={newUsedLocation}
                  onChange={(e) => setNewUsedLocation(e.target.value)}
                  placeholder="예: 서울 강남구 역삼역 3번출구"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">상품 상세 설명</label>
                <Input
                  value={newUsedDesc}
                  onChange={(e) => setNewUsedDesc(e.target.value)}
                  placeholder="상태, 구매 시기, 네고 여부 등"
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            <Button
              onClick={handleRegisterUsedProduct}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs h-9 rounded-xl"
            >
              판매글 등록하기
            </Button>
          </div>
        </div>
      )}

      {/* 11) App Download QR Modal */}
      {isAppDownloadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border text-center space-y-4">
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
                모꼬 (MOCCO) 모바일 앱
              </h3>
              <p className="text-xs text-muted-foreground">
                스마트폰 카메라로 QR 코드를 스캔하여 안드로이드 및 iOS 앱을 즉시 다운로드하세요.
              </p>
            </div>

            <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-2xl bg-slate-50 border p-2">
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

      {/* ========================================================= */}
      {/* 6. 시연/검수용 플로팅 역할 스위처 (헤더 레이아웃 침범 방지)    */}
      {/* 나중에 삭제 시 아래 한 줄만 지우면 깔끔하게 제거됩니다.        */}
      {/* ========================================================= */}
      <RoleSwitcherFloating />
    </div>
  )
}
