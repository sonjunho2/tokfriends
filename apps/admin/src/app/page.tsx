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
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useWebAuth, type UserRole, type MerchantApplication, type CreatorApplication } from '@/lib/auth-context'
import { RoleSwitcherFloating } from '@/components/common/RoleSwitcherFloating'

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
  const [liveCategoryFilter, setLiveCategoryFilter] = useState<string>('전체')
  const [marketCategoryFilter, setMarketCategoryFilter] = useState<string>('전체')
  const [friendRegionFilter, setFriendRegionFilter] = useState<string>('전체')

  // 3. Location State (동네 설정)
  const [currentLocation, setCurrentLocation] = useState('서울 강남구 역삼1동')
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)

  // 4. Data States
  const [lives, setLives] = useState<LiveRoomItem[]>(INITIAL_LIVES)
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
  const [liveChatMessages, setLiveChatMessages] = useState<{ sender: string; text: string; isHost?: boolean }[]>([
    { sender: '시스템', text: '모꼬(MOCCO) 실시간 라이브 방송에 오신 것을 환영합니다!' },
    { sender: '고기러버', text: '오겹살 때깔 미쳤네요 바로 주문합니다!' },
    { sender: '제주도민', text: '당일 도축이라 진짜 신선해요 추천!' },
  ])

  // New Live Creation Modal (일반 회원 누구나 방송 가능, 크리에이터는 상품 핀 연결 가능)
  const [isStartLiveModalOpen, setIsStartLiveModalOpen] = useState(false)
  const [newLiveTitle, setNewLiveTitle] = useState('')
  const [newLiveCategory, setNewLiveCategory] = useState('토크/소통')

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

  // Live Donation (Heart/Gift)
  const handleSendLiveGift = () => {
    requireAuth(() => {
      toast({
        title: '💖 모꼬 선물 후원 완료!',
        description: `1,000 P가 방송자(${activeLiveModal?.hostNickname})에게 전송되었습니다.`,
      })
      setLiveChatMessages((prev) => [
        ...prev,
        { sender: '시스템', text: `✨ [${user?.nickname}] 님이 1,000 포인트를 후원하셨습니다!` },
      ])
    })
  }

  // Start New Live (일반 회원 누구나 방송 가능, 크리에이터는 상품 핀 혜택)
  const handleCreateLiveRoom = () => {
    if (!newLiveTitle.trim()) {
      toast({ title: '오류', description: '방송 제목을 입력해주세요.', variant: 'destructive' })
      return
    }

    const isCreator = role === 'CREATOR' || role === 'ADMIN'

    const newRoom: LiveRoomItem = {
      id: 'live-' + Date.now(),
      title: `🔴 ${newLiveTitle.trim()}`,
      category: newLiveCategory,
      hostNickname: user?.nickname || '모꼬이웃',
      hostAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
      viewerCount: 1,
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
      hasCommerce: isCreator,
      isOfficialCreator: isCreator,
      pinnedProduct: isCreator
        ? {
            id: 'np-001',
            title: '[방송특가] 제주 흑돼지 1등급 오겹살 1kg',
            price: 28900,
            originalPrice: 38000,
            image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
          }
        : undefined,
    }

    setLives([newRoom, ...lives])
    setIsStartLiveModalOpen(false)
    setNewLiveTitle('')
    toast({
      title: isCreator ? '🎉 공식 라이브 커머스 방송 시작!' : '🎉 모꼬 실시간 소통 방송 시작!',
      description: '실시간 방송이 개설되어 라이브 목록 최상단에 온에어로 노출됩니다.',
    })
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

              {/* 2) 🔴 인기 라이브 & 🏆 랭킹 (2열 분할 레이아웃) */}
              <section className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Left (3 cols): 인기 라이브 그리드 */}
                  <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center justify-between">
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
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

                  {/* Right (1 col): 랭킹 (단일 순위 목록, beans/views 나누지 않음) */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between">
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

                    <div className="bg-white rounded-3xl border border-slate-200/80 p-3 shadow-xs space-y-1 divide-y divide-slate-100">
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
                              className="w-full h-8 text-xs font-bold bg-rose-50 text-[#FF3B6B] hover:bg-[#FF3B6B] hover:text-white border border-rose-200 rounded-xl transition-all"
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
                      본사직영 · 공식 입점사
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
                            {item.isHqDirect ? '본사직영' : '공식입점'}
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
              {/* Market Sub-nav Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    🏪 모꼬마켓
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    동네 이웃 간 C2C 에스크로 중고거래부터 본사 직영 신선식품, 특가 공동구매까지!
                  </p>
                </div>

                {/* 3 Subtabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold border border-slate-200/60">
                  <button
                    onClick={() => setMarketSubTab('C2C_USED')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                      marketSubTab === 'C2C_USED' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <span>🥕 동네 중고거래</span>
                  </button>
                  <button
                    onClick={() => setMarketSubTab('B2C_NORMAL')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                      marketSubTab === 'B2C_NORMAL' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <span>🛒 상시 입점 상품</span>
                  </button>
                  <button
                    onClick={() => setMarketSubTab('B2C_GROUP')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                      marketSubTab === 'B2C_GROUP' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <span>🔥 특가 공동구매</span>
                  </button>
                </div>
              </div>

              {/* Action Bar: Category filter & Register Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {['전체', '디지털/가전', '가구/인테리어', '패션/의류', '생활/리빙', '식품/신선'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setMarketCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-colors ${
                        marketCategoryFilter === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      requireAuth(() => setIsNewUsedModalOpen(true))
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold h-8 shadow-xs rounded-xl"
                  >
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    중고 물품 판매 등록
                  </Button>
                  {(role === 'MERCHANT' || role === 'ADMIN') && (
                    <Button
                      asChild
                      variant="outline"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-bold h-8 rounded-xl"
                    >
                      <Link href="/seller">
                        <Store className="h-3.5 w-3.5 mr-1" />
                        셀러 센터 상품 등록
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

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
              ) : (
                /* 2) B2C Normal or Group Buy Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {marketProducts
                    .filter((p) => {
                      if (marketSubTab === 'B2C_NORMAL') return p.type === 'B2C_NORMAL'
                      if (marketSubTab === 'B2C_GROUP') return p.type === 'B2C_GROUP'
                      return true
                    })
                    .filter((p) => {
                      const matchCategory = marketCategoryFilter === '전체' ? true : p.category.includes(marketCategoryFilter)
                      const matchSearch = !searchQuery.trim() ? true : (p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()) || p.sellerName.toLowerCase().includes(searchQuery.toLowerCase()))
                      return matchCategory && matchSearch
                    })
                    .map((item) => (
                      <Card
                        key={item.id}
                        onClick={() => setSelectedProduct(item)}
                        className="group overflow-hidden rounded-3xl cursor-pointer hover:shadow-lg transition-all border border-slate-200/80"
                      >
                        <div className="aspect-square w-full bg-slate-100 overflow-hidden relative">
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {item.type === 'B2C_GROUP' ? (
                            <Badge className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold border-none">
                              🔥 공동구매 특가
                            </Badge>
                          ) : (
                            <Badge className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold border-none">
                              {item.isHqDirect ? '본사 직영' : '공식 입점'}
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-3.5 space-y-2">
                          <span className="text-[10px] text-muted-foreground font-semibold block truncate">
                            {item.sellerName}
                          </span>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                            {item.title}
                          </h4>
                          <div className="flex items-baseline gap-2">
                            <span className="font-extrabold text-sm sm:text-base text-slate-900">
                              {item.price.toLocaleString()}원
                            </span>
                            {item.originalPrice && (
                              <span className="text-xs text-slate-400 line-through">
                                {item.originalPrice.toLocaleString()}원
                              </span>
                            )}
                          </div>
                          {item.type === 'B2C_GROUP' && item.targetQuantity && (
                            <div className="space-y-1 pt-1">
                              <div className="flex justify-between text-[11px] font-semibold text-rose-600">
                                <span>공구 달성률</span>
                                <span>
                                  {Math.round(((item.currentQuantity || 0) / item.targetQuantity) * 100)}% ({item.currentQuantity}/{item.targetQuantity}명)
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-rose-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-rose-600 rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.round(((item.currentQuantity || 0) / item.targetQuantity) * 100)
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
              )}
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 3: 🔴 모꼬 LIVE (LIVE) - 실시간 핫 라이브 & 방송하기  */}
          {/* ======================================================= */}
          {activeTab === 'LIVE' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Live Banner & Broadcast Starter (일반 회원 누구나 방송 가능) */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-900 via-purple-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
                <div className="relative z-10 max-w-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-ping" />
                    <Badge className="bg-rose-500 text-white font-bold px-2 py-0.5 border-none">
                      MOCCO LIVE ON-AIR
                    </Badge>
                    <span className="text-xs text-rose-200">
                      실시간 시청 중인 이웃 5,420명
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    이웃과 나누는 실시간 소통 방송 & 단독 핫딜 라이브
                  </h1>
                  <p className="text-sm text-slate-300">
                    모꼬에서는 일반 회원도 누구나 동네 이웃과 자유롭게 소통 라이브를 열 수 있습니다. 공식 크리에이터로 승격되면 방송 중에 상품을 연결하여 판매하고 커미션 정산을 받을 수 있습니다.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button
                      onClick={() => {
                        requireAuth(() => setIsStartLiveModalOpen(true))
                      }}
                      className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs sm:text-sm shadow-lg h-9 rounded-xl"
                    >
                      <Video className="h-4 w-4 mr-1.5" />
                      내 라이브 방송 시작하기 (누구나 가능)
                    </Button>

                    {role !== 'CREATOR' && role !== 'ADMIN' && (
                      <Button
                        onClick={() => {
                          requireAuth(() => openCreatorModal())
                        }}
                        variant="outline"
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs sm:text-sm font-semibold h-9 rounded-xl"
                      >
                        <Mic className="h-4 w-4 mr-1.5 text-purple-300" />
                        공식 크리에이터 승격 신청 (커머스 핀 판매)
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {['전체', '쇼핑/커머스', '토크/소통', '음악/노래', '일상', '취미'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setLiveCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-colors ${
                      liveCategoryFilter === cat
                        ? 'bg-rose-600 text-white'
                        : 'bg-white border text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Live Rooms Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {lives
                  .filter((live) => (liveCategoryFilter === '전체' ? true : live.category.includes(liveCategoryFilter)))
                  .map((live, idx) => (
                    <Card
                      key={live.id}
                      onClick={() => setActiveLiveModal(live)}
                      className="group overflow-hidden rounded-3xl cursor-pointer hover:shadow-xl transition-all border border-slate-200/80"
                    >
                      <div className="aspect-video w-full bg-slate-900 overflow-hidden relative">
                        <img
                          src={live.coverUrl}
                          alt={live.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Live viewer count */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                          LIVE · {live.viewerCount.toLocaleString()}명
                        </div>

                        {live.isOfficialCreator && (
                          <Badge className="absolute top-2.5 left-2.5 bg-purple-600 text-white text-[10px] font-bold border-none">
                            🎙️ 공식 크리에이터
                          </Badge>
                        )}

                        {/* Pinned product preview */}
                        {live.pinnedProduct && (
                          <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 rounded-xl bg-white/95 p-1.5 text-slate-900 shadow-md">
                            <img
                              src={live.pinnedProduct.image}
                              alt="pin"
                              className="h-7 w-7 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold truncate">
                                {live.pinnedProduct.title}
                              </p>
                            </div>
                            <span className="text-[11px] font-black text-rose-600 pr-1">
                              {live.pinnedProduct.price.toLocaleString()}원
                            </span>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-4 space-y-2">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-rose-600 transition-colors">
                          {live.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <img
                              src={live.hostAvatar}
                              alt="avatar"
                              className="h-5 w-5 rounded-full object-cover"
                            />
                            <span className="font-semibold text-slate-700 truncate max-w-[120px]">
                              {live.hostNickname}
                            </span>
                          </div>
                          <span className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                            {live.category}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 4: 💬 모꼬쳇 (CHAT) - 동네 친구들 + 1줄수다 + 대화함   */}
          {/* ======================================================= */}
          {activeTab === 'CHAT' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Chat Sub-nav Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    💬 모꼬쳇
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    우리 동네 이웃 찾기부터 실시간 1줄 수다 타임라인, 1:1 거래 톡까지!
                  </p>
                </div>

                {/* 3 Subtabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold border border-slate-200/60">
                  <button
                    onClick={() => setChatSubTab('FRIENDS')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                      chatSubTab === 'FRIENDS' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>👥 동네 친구들</span>
                  </button>
                  <button
                    onClick={() => setChatSubTab('SUDA')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                      chatSubTab === 'SUDA' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>💬 전체 수다</span>
                  </button>
                  <button
                    onClick={() => setChatSubTab('CHATS')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                      chatSubTab === 'CHATS' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>📩 대화함</span>
                  </button>
                </div>
              </div>

              {/* Subtab 1: 동네 친구들 (FRIENDS) */}
              {chatSubTab === 'FRIENDS' && (
                <div className="space-y-4">
                  {/* Region Filter */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {['전체', '서울', '경기', '인천', '부산', '대구', '대전', '광주', '전남', '전북', '제주'].map((reg) => (
                      <button
                        key={reg}
                        onClick={() => setFriendRegionFilter(reg)}
                        className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-colors ${
                          friendRegionFilter === reg
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {reg}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {friends
                      .filter((f) => (friendRegionFilter === '전체' ? true : f.region.includes(friendRegionFilter)))
                      .map((friend) => (
                        <Card
                          key={friend.id}
                          className="rounded-3xl border border-slate-200/80 p-4 space-y-3 hover:shadow-md transition-shadow text-center flex flex-col items-center"
                        >
                          <div className="relative">
                            <img
                              src={friend.avatar}
                              alt="avatar"
                              className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-xs"
                            />
                            {friend.isOnline && (
                              <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" />
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-sm text-slate-900">{friend.nickname}</h4>
                            <p className="text-[11px] text-muted-foreground">
                              {friend.region} · {friend.distance}
                            </p>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50 px-2 py-1.5 rounded-lg w-full">
                            &quot;{friend.statusMessage}&quot;
                          </p>
                          <div className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-1 border-t">
                            <span>온도 {friend.mannerTemp}℃</span>
                            <span>{friend.gender} · {friend.age}세</span>
                          </div>
                          <Button
                            onClick={() => handleStartNeighborChat(friend)}
                            size="sm"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 shadow-xs rounded-xl"
                          >
                            <MessageCircle className="h-3.5 w-3.5 mr-1" />
                            1:1 대화 신청하기
                          </Button>
                        </Card>
                      ))}
                  </div>
                </div>
              )}

              {/* Subtab 2: 전체 수다 (SUDA) */}
              {chatSubTab === 'SUDA' && (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {/* Suda Post Input Bar */}
                  <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                    <Input
                      value={sudaInputText}
                      onChange={(e) => setSudaInputText(e.target.value)}
                      placeholder="우리 동네 이웃들에게 따뜻한 한 줄 이야기를 전하세요! (Enter로 전송)"
                      className="text-xs border-none shadow-none focus-visible:ring-0"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handlePostSuda()
                      }}
                    />
                    <Button
                      onClick={handlePostSuda}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-4 shrink-0 rounded-xl"
                    >
                      <Send className="h-3.5 w-3.5 mr-1" />
                      등록
                    </Button>
                  </div>

                  {/* Suda Timeline Stream */}
                  <div className="space-y-3">
                    {sudaPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-2xs space-y-2 hover:border-blue-200 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={post.avatar}
                              alt="avatar"
                              className="h-9 w-9 rounded-full object-cover"
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
                          <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-100">
                            모꼬 수다
                          </Badge>
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

              {/* Subtab 3: 📩 대화함 (CHATS) - Desktop 2-Column Split View */}
              {chatSubTab === 'CHATS' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[620px] rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
                  {/* Left Column: Chat Room List (4 cols) */}
                  <div className="md:col-span-4 border-r flex flex-col h-full bg-slate-50/50">
                    <div className="p-3.5 border-b bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-sm text-slate-900">대화 목록</h4>
                        <span className="text-[11px] text-muted-foreground">
                          {chatRooms.length}개의 대화방
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold">
                        <button
                          onClick={() => setChatBoxFilter('ALL')}
                          className={`px-2 py-0.5 rounded ${
                            chatBoxFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          전체
                        </button>
                        <button
                          onClick={() => setChatBoxFilter('SUDA')}
                          className={`px-2 py-0.5 rounded ${
                            chatBoxFilter === 'SUDA' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          수다 톡
                        </button>
                        <button
                          onClick={() => setChatBoxFilter('MARKET')}
                          className={`px-2 py-0.5 rounded ${
                            chatBoxFilter === 'MARKET' ? 'bg-orange-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          거래 톡
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y">
                      {chatRooms
                        .filter((r) => (chatBoxFilter === 'ALL' ? true : r.type === chatBoxFilter))
                        .map((room) => {
                          const isActive = activeChatRoom?.id === room.id
                          return (
                            <button
                              key={room.id}
                              onClick={() => setActiveChatRoom(room)}
                              className={`w-full p-3 flex items-start gap-3 text-left transition-colors ${
                                isActive ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-slate-100/70'
                              }`}
                            >
                              <img
                                src={room.targetAvatar}
                                alt="avatar"
                                className="h-10 w-10 rounded-full object-cover shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="font-bold text-xs text-slate-900 truncate">
                                    {room.targetNickname}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">{room.lastTime}</span>
                                </div>
                                <p className="text-xs text-slate-600 truncate">{room.lastMessage}</p>
                                {room.productInfo && (
                                  <div className="flex items-center gap-1.5 mt-1.5 p-1 bg-white rounded border text-[10px] text-slate-700">
                                    <span className="font-semibold text-orange-600 shrink-0">거래물품:</span>
                                    <span className="truncate">{room.productInfo.title}</span>
                                  </div>
                                )}
                              </div>
                            </button>
                          )
                        })}
                    </div>
                  </div>

                  {/* Right Column: Active Chat Stream (8 cols) */}
                  <div className="md:col-span-8 flex flex-col h-full bg-white">
                    {activeChatRoom ? (
                      <>
                        {/* Chat Header */}
                        <div className="p-3.5 border-b flex items-center justify-between bg-white">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={activeChatRoom.targetAvatar}
                              alt="avatar"
                              className="h-8 w-8 rounded-full object-cover"
                            />
                            <div>
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                                {activeChatRoom.targetNickname}
                              </h4>
                              <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                실시간 접속 중
                              </span>
                            </div>
                          </div>

                          {activeChatRoom.productInfo && (
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
                              className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs h-8 rounded-xl"
                            >
                              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                              안전결제 요청
                            </Button>
                          )}
                        </div>

                        {/* Product Bar if exists */}
                        {activeChatRoom.productInfo && (
                          <div className="flex items-center justify-between p-2.5 bg-orange-50/50 border-b text-xs">
                            <div className="flex items-center gap-2">
                              <img
                                src={activeChatRoom.productInfo.image}
                                alt="prod"
                                className="h-9 w-9 rounded-lg object-cover"
                              />
                              <div>
                                <span className="font-bold text-slate-900 line-clamp-1">
                                  {activeChatRoom.productInfo.title}
                                </span>
                                <span className="font-extrabold text-orange-600">
                                  {activeChatRoom.productInfo.price.toLocaleString()}원
                                </span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-700">
                              에스크로 보호 거래
                            </Badge>
                          </div>
                        )}

                        {/* Message Stream */}
                        <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
                          {activeChatRoom.messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                                  msg.isMe
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white text-slate-900 border rounded-tl-none shadow-2xs'
                                }`}
                              >
                                {msg.text}
                              </div>
                              <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                                {msg.time}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Chat Input Bar */}
                        <div className="p-3 border-t bg-white flex items-center gap-2">
                          <Input
                            value={chatInputText}
                            onChange={(e) => setChatInputText(e.target.value)}
                            placeholder="메시지를 입력하세요 (Enter로 전송)"
                            className="text-xs"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSendMessage()
                            }}
                          />
                          <Button
                            onClick={handleSendMessage}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 shrink-0 rounded-xl"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                        대화방을 선택해주세요.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 5: 👤 마이모꼬 (MY) - 프로필, ON포인트, 승격신청, 관리자 */}
          {/* ======================================================= */}
          {activeTab === 'MY' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              {/* Profile Card */}
              <div className="rounded-3xl bg-white p-6 border border-slate-200/80 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'}
                      alt="avatar"
                      className="h-16 w-16 rounded-full object-cover border-2 border-pink-200 shadow-sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-extrabold text-slate-900">
                          {user?.nickname || '모꼬이웃'}
                        </h3>
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
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {currentLocation} · 매너온도 36.5℃
                      </p>
                      <p className="text-xs text-slate-600 italic mt-1">
                        &quot;동네 친구들과 따뜻하고 즐거운 소통 나누고 싶어요 ✨&quot;
                      </p>
                    </div>
                  </div>

                  {!isAuthenticated ? (
                    <Button
                      onClick={() => openLoginModal()}
                      className="bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold text-xs rounded-xl"
                    >
                      <LogIn className="h-4 w-4 mr-1.5" />
                      로그인 / 회원가입
                    </Button>
                  ) : (
                    <Button
                      onClick={logout}
                      variant="outline"
                      size="sm"
                      className="text-xs text-slate-600 hover:text-rose-600 rounded-xl"
                    >
                      <LogOut className="h-3.5 w-3.5 mr-1" />
                      로그아웃
                    </Button>
                  )}
                </div>

                {/* Point & Settlement Balance Dashboard */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-pink-50/70 p-4 rounded-2xl border border-pink-100 space-y-1">
                    <span className="text-xs font-bold text-pink-700 flex items-center gap-1">
                      <Coins className="h-4 w-4" />
                      내 보유 ON 포인트
                    </span>
                    <p className="text-xl font-black text-pink-900">
                      {(user?.pointBalance || 0).toLocaleString()} P
                    </p>
                    <span className="text-[10px] text-pink-600 block">
                      라이브 후원 & 1:1 대화 & 마켓 결제 사용 가능
                    </span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border space-y-1">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Wallet className="h-4 w-4" />
                      판매 정산금 잔액
                    </span>
                    <p className="text-xl font-black text-slate-900">
                      185,000 원
                    </p>
                    <span className="text-[10px] text-muted-foreground block">
                      중고거래 및 마켓 판매 정산금 (출금 신청 가능)
                    </span>
                  </div>
                </div>
              </div>

              {/* Core Role Promotion & Dedicated Admin Gateways */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  회원 권한 승격 & 전용 관리자 바로가기
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Merchant Promotion / Access Card */}
                  <div className="p-4 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                        🏪
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-slate-900">
                          모꼬 입점사(판매자)
                        </h5>
                        <p className="text-[11px] text-muted-foreground">
                          자체 상품 등록, 주문 배송 관리 및 판매 정산
                        </p>
                      </div>
                    </div>

                    {role === 'MERCHANT' || role === 'ADMIN' ? (
                      <Button
                        asChild
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 shadow-xs rounded-xl"
                      >
                        <Link href="/seller">
                          <Store className="h-3.5 w-3.5 mr-1.5" />
                          🏪 입점사 셀러 센터 이동하기
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => requireAuth(() => openMerchantModal())}
                        variant="outline"
                        className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold text-xs h-9 rounded-xl"
                      >
                        <Building2 className="h-3.5 w-3.5 mr-1.5" />
                        입점사 신청하기 (사업자 등록)
                      </Button>
                    )}
                  </div>

                  {/* Creator Promotion / Access Card */}
                  <div className="p-4 rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50/60 to-white space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold">
                        🎙️
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-slate-900">
                          공식 크리에이터
                        </h5>
                        <p className="text-[11px] text-muted-foreground">
                          라이브커머스 핀 상품 연동 및 판매 커미션 정산
                        </p>
                      </div>
                    </div>

                    {role === 'CREATOR' || role === 'ADMIN' ? (
                      <Button
                        asChild
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 shadow-xs rounded-xl"
                      >
                        <Link href="/streamer">
                          <Radio className="h-3.5 w-3.5 mr-1.5" />
                          🎙️ 크리에이터 스튜디오 이동하기
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => requireAuth(() => openCreatorModal())}
                        variant="outline"
                        className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 font-bold text-xs h-9 rounded-xl"
                      >
                        <Mic className="h-3.5 w-3.5 mr-1.5" />
                        크리에이터 신청하기 (소통·커머스)
                      </Button>
                    )}
                  </div>
                </div>

                {/* Company Super Admin Console Card (Admins Only) */}
                {role === 'ADMIN' && (
                  <div className="p-4 rounded-3xl border border-amber-300 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-amber-600" />
                        <div>
                          <h5 className="font-bold text-sm text-slate-900">
                            👑 회사 총괄 운영진 관리자 콘솔
                          </h5>
                          <p className="text-[11px] text-muted-foreground">
                            전체 회원 권한 심사, 입점 승인, 크리에이터 심사 및 결제 정산 통합 관리
                          </p>
                        </div>
                      </div>
                      <Button
                        asChild
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-8 rounded-xl"
                      >
                        <Link href="/dashboard">
                          콘솔 접속
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* My Sales Management */}
              <div className="rounded-3xl bg-white p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-orange-500" />
                    내 중고 판매 관리
                  </h4>
                  <Button
                    onClick={() => {
                      requireAuth(() => setIsNewUsedModalOpen(true))
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-orange-600 font-bold"
                  >
                    + 새 상품 등록
                  </Button>
                </div>

                <div className="space-y-3">
                  {mySalesList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl border bg-slate-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt="item"
                          className="h-12 w-12 rounded-xl object-cover"
                        />
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
              </div>
            </div>
          )}
        </main>

        {/* ========================================================= */}
        {/* 3. Official Korean Legal Compliance Footer                */}
        {/* 전자상거래 등에서의 소비자보호에 관한 법률 제10조 제1항 및 제20조 제2항 준수 */}
        {/* ========================================================= */}
        <footer className="mt-16 border-t border-slate-800 bg-slate-950 text-slate-300 text-xs">
          {/* Top Customer Center & Guarantee Row */}
          <div className="border-b border-slate-800">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Customer Center */}
                <div className="space-y-2 md:col-span-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    모꼬 고객감동센터
                  </span>
                  <p className="text-2xl font-black text-white">1588-0000</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    운영시간: 평일 09:00 ~ 18:00<br />
                    점심시간: 12:00 ~ 13:00<br />
                    (토·일·공휴일 휴무)
                  </p>
                  <div className="pt-1">
                    <Button
                      onClick={() => {
                        setActiveTab('CHAT')
                        setChatSubTab('CHATS')
                      }}
                      variant="outline"
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800 text-white border-slate-700 text-xs h-8 rounded-xl"
                    >
                      <PhoneCall className="h-3.5 w-3.5 mr-1" />
                      1:1 온라인 고객문의
                    </Button>
                  </div>
                </div>

                {/* 100% Escrow Guarantee Notice */}
                <div className="space-y-2 md:col-span-2 bg-slate-900/90 p-5 rounded-3xl border border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <ShieldCheck className="h-4 w-4" />
                    <span>토스페이먼츠 구매안전(에스크로) 서비스 적용</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    모꼬(MOCCO)는 고객님의 안전한 전자상거래를 위해 전자상거래법에 의거, 결제대금예치(에스크로) 서비스를 적용하고 있습니다. 구매자가 물품을 수령하고 최종 구매확정하기 전까지 결제 대금이 제3자 에스크로 계좌에 안전하게 보관되므로 사기 및 미배송 피해를 원천 차단합니다.
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                    <span>인허가 보증보험 증권번호: 100-24-91823091</span>
                    <a
                      href="https://www.ftc.go.kr"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 underline hover:text-emerald-300"
                    >
                      서비스 가입사실 확인 &gt;
                    </a>
                  </div>
                </div>

                {/* Quick App Download */}
                <div className="space-y-2 md:col-span-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    모바일 모꼬 앱
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    실시간 라이브 방송 알림과 1:1 대화 푸시 메시지를 스마트폰 앱에서 즉시 받아보세요.
                  </p>
                  <Button
                    onClick={() => setIsAppDownloadOpen(true)}
                    size="sm"
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs h-8 rounded-xl shadow-md"
                  >
                    <QrCode className="h-3.5 w-3.5 mr-1" />
                    모바일 앱 QR 다운로드
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Policy Navigation Links Bar */}
          <div className="border-b border-slate-800 bg-slate-950/70">
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                <button
                  onClick={() => {
                    setSelectedLegalSlug('terms-of-service')
                    setLegalModalOpen(true)
                  }}
                  className="hover:text-white transition-colors"
                >
                  서비스 이용약관
                </button>
                <button
                  onClick={() => {
                    setSelectedLegalSlug('privacy-policy')
                    setLegalModalOpen(true)
                  }}
                  className="font-extrabold text-white underline hover:text-pink-400 transition-colors"
                >
                  개인정보처리방침
                </button>
                <button
                  onClick={() => {
                    setSelectedLegalSlug('financial-terms')
                    setLegalModalOpen(true)
                  }}
                  className="hover:text-white transition-colors"
                >
                  전자금융거래 이용약관
                </button>
                <button
                  onClick={() => {
                    setSelectedLegalSlug('youth-protection')
                    setLegalModalOpen(true)
                  }}
                  className="hover:text-white transition-colors"
                >
                  청소년보호정책
                </button>
                <a
                  href="https://www.ftc.go.kr"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  사업자정보확인
                  <ExternalLink className="h-3 w-3" />
                </a>
                <button
                  onClick={() => {
                    setActiveTab('MY')
                  }}
                  className="hover:text-white transition-colors"
                >
                  입점 및 제휴 문의
                </button>
              </div>
            </div>
          </div>

          {/* Legal Business Information Section (전자상거래법 제10조 제1항 완벽 준수) */}
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-4">
            <div className="text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-bold text-slate-200">주식회사 모꼬글로벌 (MOCCO Global Inc.)</span>
                <span>대표이사: 손준호</span>
                <span>개인정보보호책임자: 손준호 (privacy@mocco.kr)</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>사업자등록번호: 123-86-12345</span>
                <span>통신판매업신고번호: 제 2026-서울강남-0123 호</span>
                <span>호스팅 서비스 제공자: 주식회사 모꼬글로벌</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>사업장 소재지: 서울특별시 강남구 테헤란로 152 강남파이낸스센터 12층</span>
                <span>대표전화: 1588-0000</span>
                <span>팩스: 02-123-4567</span>
                <span>대표 이메일: support@mocco.kr</span>
              </div>
            </div>

            {/* 통신판매중개자 법적 고지 (전자상거래법 제20조 제2항 준수) */}
            <div className="rounded-2xl bg-slate-900 p-4 border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
              <span className="font-bold text-slate-300 block mb-0.5">
                [통신판매중개자 법적 고지 및 면책 안내]
              </span>
              (주)모꼬글로벌은 통신판매중개자로서 회원 상호 간의 자유로운 상품 매매 및 라이브 방송 거래를 위한 시스템 플랫폼을 운영 및 관리, 제공할 뿐이며, 입점 판매자 및 개별 회원이 등록한 상품/중고물품의 정보, 거래 조건 및 방송 내용에 대하여 일체의 책임을 지지 않습니다. 등록된 모든 재화의 판매 당사자는 등록 회원(판매자) 본인입니다. 단, (주)모꼬글로벌이 직접 매입하여 공급하는 [본사 직영] 표시 상품의 경우 통신판매당사자로서 책임을 부담합니다.
            </div>

            {/* Copyright */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
              <p>Copyright © 2026 MOCCO Global Inc. All rights reserved.</p>
              <p className="text-[10px] text-slate-500 mt-1 sm:mt-0">
                모꼬(MOCCO)는 특허청에 상표 등록된 고유 지식재산권 플랫폼입니다.
              </p>
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
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border space-y-5">
            <button
              onClick={closeLoginModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white font-bold text-xl shadow-md">
                M
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                모꼬 (MOCCO) 로그인
              </h3>
              <p className="text-xs text-muted-foreground">
                라이브 방송 시청, 1:1 대화, 중고거래 및 마켓 안전결제를 이용하세요.
              </p>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                onClick={() => setLoginTab('QUICK')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  loginTab === 'QUICK' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                1초 닉네임 간편가입
              </button>
              <button
                onClick={() => setLoginTab('EMAIL')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  loginTab === 'EMAIL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
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
                    className="text-xs rounded-xl"
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
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs shadow-md rounded-xl"
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
                    className="text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">비밀번호</label>
                  <Input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="비밀번호 입력"
                    className="text-xs rounded-xl"
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
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
                >
                  로그인
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

      {/* 5) Start Live Modal (일반 회원 누구나 방송 가능, 크리에이터는 상품 핀 연결 가능) */}
      {isStartLiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border space-y-4">
            <button
              onClick={() => setIsStartLiveModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Radio className="h-4 w-4 text-rose-600" />
                모꼬 실시간 라이브 방송 개설
              </h3>
              <p className="text-xs text-muted-foreground">
                누구나 스마트폰 및 웹캠으로 동네 이웃과 소통 방송을 즉시 시작할 수 있습니다.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">방송 제목</label>
                <Input
                  value={newLiveTitle}
                  onChange={(e) => setNewLiveTitle(e.target.value)}
                  placeholder="예: 저녁 퇴근길 이웃과 소소한 커피 수다방 ☕"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">방송 카테고리</label>
                <select
                  value={newLiveCategory}
                  onChange={(e) => setNewLiveCategory(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
                >
                  <option value="토크/소통">토크 / 소통</option>
                  <option value="쇼핑/커머스">쇼핑 / 커머스 (크리에이터 권장)</option>
                  <option value="일상">일상</option>
                  <option value="취미">취미</option>
                  <option value="음악/노래">음악 / 노래</option>
                </select>
              </div>

              {role === 'CREATOR' || role === 'ADMIN' ? (
                <div className="rounded-2xl bg-purple-50 p-3.5 border border-purple-100 text-purple-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                    공식 크리에이터 커머스 핀 혜택 적용
                  </div>
                  <p className="text-[11px] text-purple-700">
                    방송 개설 시 모꼬 인기 상품(제주 흑돼지 등)이 자동으로 핀 상품으로 연결되어 실시간 판매 수수료가 적립됩니다.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-3.5 border text-slate-600 text-[11px]">
                  💡 일반 회원은 자유 소통 방송이 가능하며, 커머스 상품 판매를 원하시면 크리에이터 신청을 진행해주세요.
                </div>
              )}
            </div>

            <Button
              onClick={handleCreateLiveRoom}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 rounded-xl"
            >
              온에어 방송 송출 시작하기
            </Button>
          </div>
        </div>
      )}

      {/* 6) Live Room Viewer Modal */}
      {activeLiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl rounded-3xl bg-slate-950 text-white shadow-2xl border-2 border-[#FF3B6B]/40 shadow-[#FF3B6B]/20 overflow-hidden flex flex-col md:flex-row h-[85vh] max-h-[700px]">
            <button
              onClick={() => setActiveLiveModal(null)}
              className="absolute right-3 top-3 z-20 rounded-full bg-black/60 p-1.5 text-white/80 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left Stream Area (Desktop Wide View) */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
              <img
                src={activeLiveModal.coverUrl}
                alt="stream"
                className="h-full w-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

              {/* Stream Overlay Header */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <Badge className="bg-rose-600 text-white font-bold border-none text-[10px]">
                  LIVE ON-AIR
                </Badge>
                <span className="text-xs text-white/90 font-medium">
                  시청자 {activeLiveModal.viewerCount.toLocaleString()}명
                </span>
              </div>

              {/* Pinned Product In-Stream Overlay */}
              {activeLiveModal.pinnedProduct && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl bg-white/95 p-2.5 text-slate-900 shadow-xl backdrop-blur-md">
                  <img
                    src={activeLiveModal.pinnedProduct.image}
                    alt="product"
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-rose-600">
                      🔴 방송 단독 핀 특가 상품
                    </span>
                    <h4 className="text-xs font-bold truncate">
                      {activeLiveModal.pinnedProduct.title}
                    </h4>
                    <span className="text-sm font-black text-slate-900">
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
                    className="bg-gradient-to-r from-[#FF3B6B] to-[#8B5CF6] hover:opacity-90 text-white font-bold text-xs h-9 px-3 shrink-0 shadow-md shadow-[#FF3B6B]/25 rounded-xl"
                  >
                    즉시 구매
                  </Button>
                </div>
              )}
            </div>

            {/* Right Live Chat Stream (Desktop Split View) */}
            <div className="w-full md:w-80 flex flex-col bg-slate-900 border-l border-slate-800">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={activeLiveModal.hostAvatar}
                    alt="host"
                    className="h-7 w-7 rounded-full object-cover"
                  />
                  <span className="font-bold text-xs text-slate-200">
                    {activeLiveModal.hostNickname}
                  </span>
                </div>
                <Button
                  onClick={handleSendLiveGift}
                  size="sm"
                  className="bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold text-[11px] h-7 px-2.5 rounded-lg"
                >
                  <Heart className="h-3 w-3 mr-1 fill-white" />
                  1,000 P 선물
                </Button>
              </div>

              {/* Chat Log */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
                {liveChatMessages.map((m, i) => (
                  <div key={i} className="flex items-start gap-1.5 leading-snug">
                    <span className="font-bold text-pink-400 shrink-0">{m.sender}:</span>
                    <span className="text-slate-300 break-all">{m.text}</span>
                  </div>
                ))}
              </div>

              {/* Live Chat Input */}
              <div className="p-3 border-t border-slate-800 flex items-center gap-2">
                <Input
                  value={liveChatInput}
                  onChange={(e) => setLiveChatInput(e.target.value)}
                  placeholder="실시간 댓글 남기기..."
                  className="text-xs bg-slate-800 border-slate-700 text-white rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendLiveChat()
                  }}
                />
                <Button
                  onClick={handleSendLiveChat}
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-9 rounded-xl"
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
