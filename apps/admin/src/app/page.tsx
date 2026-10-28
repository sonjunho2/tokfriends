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
  gender: '여성' | '남성'
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
    title: '☕ [일반회원 자유방송] 동네 카페 투어 라이브 & 홈카페 감성 소통!',
    category: '일상',
    hostNickname: '카페라떼러버 (모꼬 이웃)',
    hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
    viewerCount: 620,
    coverUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    hasCommerce: false,
    isOfficialCreator: false,
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

const INITIAL_SUDA_POSTS: SudaPostItem[] = [
  {
    id: 'suda-1',
    nickname: '민지 (모꼬이웃)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    region: '역삼1동',
    content: '오늘 역삼역 앞 벚꽃 산책로 날씨 진짜 화창하네요! 다들 점심 맛있게 드셨나요? ☀️',
    time: '5분 전',
    likes: 12,
    comments: 4,
  },
  {
    id: 'suda-2',
    nickname: '준호',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    region: '판교 백현동',
    content: '퇴근 후 저녁 8시에 탄천 러닝 같이 뛰실 이웃 크루 구해요! 🏃‍♂️ 편하게 댓글 주세요.',
    time: '18분 전',
    likes: 8,
    comments: 6,
  },
  {
    id: 'suda-3',
    nickname: '지은',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    region: '서초동',
    content: '모꼬 LIVE 제주 흑돼지 방송 보고 주문했는데 당일 발송 바로 떠서 너무 신나요 🥩',
    time: '34분 전',
    likes: 15,
    comments: 2,
  },
  {
    id: 'suda-4',
    nickname: '도윤',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    region: '삼성동',
    content: '동네 조용하고 콘센트 많은 카공 카페 아시는 분 추천 부탁드립니다 ☕',
    time: '1시간 전',
    likes: 9,
    comments: 5,
  },
]

const INITIAL_FRIENDS: NeighborFriendItem[] = [
  {
    id: 'friend-1',
    nickname: '민지 (모꼬지)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    region: '서울 강남구 역삼동',
    distance: '0.4km',
    mannerTemp: 39.2,
    statusMessage: '오늘 날씨 너무 좋아요 ☀️ 실시간 소통 환영해요!',
    isOnline: true,
    gender: '여성',
    age: 26,
  },
  {
    id: 'friend-2',
    nickname: '준호',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    region: '경기 성남시 판교',
    distance: '1.2km',
    mannerTemp: 38.5,
    statusMessage: 'IT 개발 & 음악 이야기 나누실 분 환영해요 🎧',
    isOnline: true,
    gender: '남성',
    age: 29,
  },
  {
    id: 'friend-3',
    nickname: '지은',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    region: '서울 서초구',
    distance: '1.8km',
    mannerTemp: 37.8,
    statusMessage: '카페 투어 & 전시회 감상 좋아합니다 ☕',
    isOnline: true,
    gender: '여성',
    age: 25,
  },
  {
    id: 'friend-4',
    nickname: '도윤',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    region: '서울 송파구 잠실',
    distance: '3.1km',
    mannerTemp: 36.5,
    statusMessage: '주말 한강 자전거 라이딩 메이트 찾습니다 🚴',
    isOnline: false,
    gender: '남성',
    age: 32,
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

  // 3. Data States
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

  // 4. Modals
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
    }, 4500)
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

  // Start chat with neighbor
  const handleStartNeighborChat = (friend: NeighborFriendItem) => {
    requireAuth(() => {
      // Find or create chat room
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between pb-20 md:pb-6">
      <div>
        {/* ========================================================= */}
        {/* 1. Global Navigation Bar (GNB) Header                     */}
        {/* ========================================================= */}
        <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur-md shadow-xs">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            {/* Logo & Brand Name: MOCCO (모꼬) */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab('HOME')}
                className="flex items-center gap-2.5 group text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
                  M
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 bg-clip-text text-transparent">
                      MOCCO
                    </span>
                    <Badge variant="secondary" className="text-[10px] bg-pink-50 text-pink-700 font-bold border-pink-200">
                      모꼬 웹 포털
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground hidden sm:block">
                    실시간 라이브 · 채팅 · 동네 중고거래 · 마켓
                  </p>
                </div>
              </button>

              {/* 5 Core App Tabs Navigation (Desktop) */}
              <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {/* 1. 모꼬홈 */}
                <button
                  onClick={() => setActiveTab('HOME')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'HOME'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Home className={`h-4 w-4 ${activeTab === 'HOME' ? 'text-pink-600' : 'text-slate-500'}`} />
                  <span>모꼬홈</span>
                </button>

                {/* 2. 모꼬마켓 */}
                <button
                  onClick={() => setActiveTab('MARKET')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'MARKET'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Store className={`h-4 w-4 ${activeTab === 'MARKET' ? 'text-emerald-600' : 'text-slate-500'}`} />
                  <span>모꼬마켓</span>
                </button>

                {/* 3. 모꼬 LIVE (Central Signature Protruding Pill) */}
                <button
                  onClick={() => setActiveTab('LIVE')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    activeTab === 'LIVE'
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <Radio className={`h-4 w-4 animate-pulse ${activeTab === 'LIVE' ? 'text-white' : 'text-rose-600'}`} />
                  <span>모꼬 LIVE</span>
                  <span className={`flex h-2 w-2 rounded-full ${activeTab === 'LIVE' ? 'bg-white animate-ping' : 'bg-rose-500'}`} />
                </button>

                {/* 4. 모꼬쳇 */}
                <button
                  onClick={() => setActiveTab('CHAT')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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

            {/* Right Area: Clean User Status & Admin Shortcuts */}
            <div className="flex items-center gap-2 sm:gap-3">
              {!isAuthenticated ? (
                /* Guest State */
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
                    className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-semibold shadow-xs"
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

                  {/* Promotion Buttons for Normal User */}
                  {role === 'USER' && (
                    <div className="hidden lg:flex items-center gap-1.5">
                      <Button
                        onClick={() => openMerchantModal()}
                        variant="outline"
                        size="sm"
                        className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold h-8"
                      >
                        <Building2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                        🏪 입점 신청
                      </Button>
                      <Button
                        onClick={() => openCreatorModal()}
                        variant="outline"
                        size="sm"
                        className="border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold h-8"
                      >
                        <Mic className="h-3.5 w-3.5 mr-1 text-purple-600" />
                        🎙️ 크리에이터 신청
                      </Button>
                    </div>
                  )}

                  {/* Dedicated Seller Admin Button for Merchant */}
                  {role === 'MERCHANT' && (
                    <Button
                      asChild
                      size="sm"
                      className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold shadow-xs h-8"
                    >
                      <Link href="/seller">
                        <Store className="h-3.5 w-3.5 mr-1" />
                        🏪 입점사 셀러 센터
                        <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
                      </Link>
                    </Button>
                  )}

                  {/* Dedicated Streamer Studio Button for Creator */}
                  {role === 'CREATOR' && (
                    <Button
                      asChild
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white text-xs font-bold shadow-xs h-8"
                    >
                      <Link href="/streamer">
                        <Radio className="h-3.5 w-3.5 mr-1" />
                        🎙️ 크리에이터 스튜디오
                        <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
                      </Link>
                    </Button>
                  )}

                  {/* Dedicated Super Admin Console Button */}
                  {role === 'ADMIN' && (
                    <Button
                      asChild
                      size="sm"
                      className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white text-xs font-bold shadow-xs h-8"
                    >
                      <Link href="/dashboard">
                        <Crown className="h-3.5 w-3.5 mr-1" />
                        👑 회사 총괄 관리자 콘솔
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
              {/* Home Subheader: Location & Live Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 text-pink-600">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
                      <span>서울 강남구 역삼1동</span>
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400 cursor-pointer" />
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
                        동네 인증 완료
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      현재 반경 3km 내 온라인 접속 이웃 1,842명
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="중고 매물, 라이브 방송, 마켓 검색"
                      className="pl-8 text-xs h-8 bg-slate-50"
                    />
                  </div>
                  <Button
                    onClick={() => setIsAppDownloadOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold gap-1 text-slate-700"
                  >
                    <QrCode className="h-3.5 w-3.5 text-pink-500" />
                    앱 QR
                  </Button>
                </div>
              </div>

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
                      className="bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs h-8 sm:h-9 shadow-md"
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

              {/* 2) 🔥 실시간 LIVE Top 3 (모바일 앱의 화려한 왕관 엠블럼 연계) */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-rose-500" />
                    <h3 className="font-extrabold text-lg text-slate-900">
                      실시간 HOT 모꼬 LIVE Top 3
                    </h3>
                    <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-200 bg-rose-50 font-bold">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {lives.slice(0, 3).map((live, idx) => {
                    const rankNum = idx + 1
                    const isGold = rankNum === 1
                    const isSilver = rankNum === 2

                    return (
                      <Card
                        key={live.id}
                        onClick={() => setActiveLiveModal(live)}
                        className={`group relative overflow-hidden rounded-2xl cursor-pointer border hover:shadow-lg transition-all ${
                          isGold ? 'border-amber-300 ring-2 ring-amber-400/20' : isSilver ? 'border-slate-300' : 'border-orange-200'
                        }`}
                      >
                        <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                          <img
                            src={live.coverUrl}
                            alt={live.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                          {/* Top Rank Crown Emblem */}
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-md font-black text-xs text-white backdrop-blur-xs border bg-slate-950/80">
                            <Crown
                              className={`h-3.5 w-3.5 ${
                                isGold ? 'text-amber-400' : isSilver ? 'text-slate-300' : 'text-orange-400'
                              }`}
                            />
                            <span className={isGold ? 'text-amber-300' : isSilver ? 'text-slate-200' : 'text-orange-300'}>
                              No.{rankNum}
                            </span>
                            <span className="text-[9px] text-amber-400">★★★</span>
                          </div>

                          {/* Live Viewer Badge */}
                          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600/90 text-white text-[10px] font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                            LIVE · {live.viewerCount.toLocaleString()}명
                          </div>

                          {/* Pinned Product Preview */}
                          {live.pinnedProduct && (
                            <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 rounded-xl bg-white/95 p-1.5 text-slate-900 shadow-md backdrop-blur-xs">
                              <img
                                src={live.pinnedProduct.image}
                                alt="pin"
                                className="h-8 w-8 rounded-lg object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="block text-[10px] text-rose-600 font-bold">
                                  방송 단독 핀 특가
                                </span>
                                <p className="text-[11px] font-bold truncate">
                                  {live.pinnedProduct.title}
                                </p>
                              </div>
                              <span className="text-xs font-black text-slate-900 pr-1">
                                {live.pinnedProduct.price.toLocaleString()}원
                              </span>
                            </div>
                          )}
                        </div>

                        <CardContent className="p-3.5 space-y-2">
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
                            <span className="text-[11px] font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                              {live.category}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </section>

              {/* 3) 💬 실시간 동네 1줄 수다 (SUDA Feed & Quick Post) */}
              <section className="rounded-2xl bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-purple-50/50 p-5 border border-blue-100/70 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                      실시간 동네 1줄 수다 (SUDA)
                    </h3>
                    <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-800 font-bold border-none">
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
                    className="text-xs text-blue-700 hover:text-blue-900 font-semibold"
                  >
                    수다방 가기
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>

                {/* Quick Suda Input */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border shadow-2xs">
                  <Input
                    value={sudaInputText}
                    onChange={(e) => setSudaInputText(e.target.value)}
                    placeholder="우리 동네 이웃들에게 가볍게 한 줄 수다를 건네보세요! (비로그인 시 로그인 유도)"
                    className="text-xs border-none shadow-none focus-visible:ring-0"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePostSuda()
                    }}
                  />
                  <Button
                    onClick={handlePostSuda}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-3 shrink-0"
                  >
                    <Send className="h-3.5 w-3.5 mr-1" />
                    남기기
                  </Button>
                </div>

                {/* Suda Feed Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sudaPosts.slice(0, 4).map((post) => (
                    <div
                      key={post.id}
                      className="flex items-start gap-3 bg-white p-3 rounded-xl border shadow-2xs hover:border-blue-200 transition-colors"
                    >
                      <img
                        src={post.avatar}
                        alt="avatar"
                        className="h-9 w-9 rounded-full object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">{post.nickname}</span>
                          <span className="text-[10px] text-muted-foreground">{post.time}</span>
                        </div>
                        <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                          <button
                            onClick={() => handleLikeSuda(post.id)}
                            className={`flex items-center gap-1 hover:text-rose-600 transition-colors ${
                              post.isLiked ? 'text-rose-600 font-bold' : ''
                            }`}
                          >
                            <Heart className={`h-3 w-3 ${post.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                            <span>{post.likes}</span>
                          </button>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            <span>{post.comments}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 4) 🥕 동네 중고거래 핫 아이템 & 🛒 특가 공동구매 2열 섹션 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 4-1) 동네 중고거래 인기 매물 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="h-5 w-5 text-orange-500" />
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                        동네 인기 중고거래
                      </h3>
                      <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] font-bold">
                        에스크로 안전
                      </Badge>
                    </div>
                    <Button
                      onClick={() => {
                        setActiveTab('MARKET')
                        setMarketSubTab('C2C_USED')
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-orange-700 hover:text-orange-900 font-semibold"
                    >
                      중고 더보기
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {usedProducts.slice(0, 2).map((item) => (
                      <Card
                        key={item.id}
                        onClick={() => setSelectedUsedItem(item)}
                        className="group overflow-hidden rounded-2xl cursor-pointer hover:shadow-md transition-shadow border"
                      >
                        <div className="aspect-square w-full bg-slate-100 overflow-hidden relative">
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <Badge className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] font-semibold border-none">
                            {item.locationName.split(' ')[1] || item.locationName}
                          </Badge>
                        </div>
                        <CardContent className="p-3 space-y-1">
                          <h4 className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                            {item.title}
                          </h4>
                          <p className="font-extrabold text-sm text-slate-900">
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
                </div>

                {/* 4-2) 마켓 & 특가 공동구매 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-emerald-600" />
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                        모꼬 마켓 & 특가 공구
                      </h3>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                        본사직영 · 입점사
                      </Badge>
                    </div>
                    <Button
                      onClick={() => {
                        setActiveTab('MARKET')
                        setMarketSubTab('B2C_GROUP')
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
                    >
                      마켓 더보기
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {marketProducts.slice(0, 2).map((item) => (
                      <Card
                        key={item.id}
                        onClick={() => setSelectedProduct(item)}
                        className="group overflow-hidden rounded-2xl cursor-pointer hover:shadow-md transition-shadow border"
                      >
                        <div className="aspect-square w-full bg-slate-100 overflow-hidden relative">
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                          {item.type === 'B2C_GROUP' && (
                            <Badge className="absolute top-2 left-2 bg-rose-600 text-white text-[9px] font-bold border-none">
                              공구특가
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-3 space-y-1">
                          <span className="text-[10px] text-muted-foreground block truncate">
                            {item.sellerName}
                          </span>
                          <h4 className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                            {item.title}
                          </h4>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-extrabold text-sm text-slate-900">
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
                </div>
              </div>

              {/* 5) 👥 동네 이웃 추천 (Neighbour Recommendations) */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-purple-600" />
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                      내 주변 추천 동네 이웃
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      가까운 거리의 인증된 이웃들과 친구가 되어보세요.
                    </span>
                  </div>
                  <Button
                    onClick={() => {
                      setActiveTab('CHAT')
                      setChatSubTab('FRIENDS')
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-purple-700 hover:text-purple-900 font-semibold"
                  >
                    이웃 목록 전체보기
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {friends.map((friend) => (
                    <Card
                      key={friend.id}
                      className="rounded-2xl border p-4 space-y-3 hover:shadow-md transition-shadow text-center flex flex-col items-center"
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
                      <p className="text-xs text-slate-600 line-clamp-1 italic bg-slate-50 px-2 py-1 rounded w-full">
                        &quot;{friend.statusMessage}&quot;
                      </p>
                      <div className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-1 border-t">
                        <span>온도 {friend.mannerTemp}℃</span>
                        <span>{friend.gender} · {friend.age}세</span>
                      </div>
                      <Button
                        onClick={() => handleStartNeighborChat(friend)}
                        size="sm"
                        variant="outline"
                        className="w-full text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50 h-8"
                      >
                        <MessageCircle className="h-3.5 w-3.5 mr-1" />
                        1:1 대화 신청
                      </Button>
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
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setMarketSubTab('C2C_USED')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      marketSubTab === 'C2C_USED' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <span>🥕 동네 중고거래</span>
                  </button>
                  <button
                    onClick={() => setMarketSubTab('B2C_NORMAL')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      marketSubTab === 'B2C_NORMAL' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <span>🛒 상시 입점 상품</span>
                  </button>
                  <button
                    onClick={() => setMarketSubTab('B2C_GROUP')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
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
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold h-8 shadow-xs"
                  >
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    중고 물품 판매 등록
                  </Button>
                  {(role === 'MERCHANT' || role === 'ADMIN') && (
                    <Button
                      asChild
                      variant="outline"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-bold h-8"
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
                    .filter((item) =>
                      marketCategoryFilter === '전체' ? true : item.category.includes(marketCategoryFilter)
                    )
                    .map((item) => (
                      <Card
                        key={item.id}
                        onClick={() => setSelectedUsedItem(item)}
                        className="group overflow-hidden rounded-2xl cursor-pointer hover:shadow-lg transition-all border"
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
                    .filter((p) => (marketCategoryFilter === '전체' ? true : p.category.includes(marketCategoryFilter)))
                    .map((item) => (
                      <Card
                        key={item.id}
                        onClick={() => setSelectedProduct(item)}
                        className="group overflow-hidden rounded-2xl cursor-pointer hover:shadow-lg transition-all border"
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
                      className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs sm:text-sm shadow-lg h-9"
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
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs sm:text-sm font-semibold h-9"
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
                      className="group overflow-hidden rounded-2xl cursor-pointer hover:shadow-xl transition-all border"
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

                      <CardContent className="p-3.5 space-y-2">
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
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setChatSubTab('FRIENDS')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      chatSubTab === 'FRIENDS' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>👥 동네 친구들</span>
                  </button>
                  <button
                    onClick={() => setChatSubTab('SUDA')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      chatSubTab === 'SUDA' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>💬 전체 수다</span>
                  </button>
                  <button
                    onClick={() => setChatSubTab('CHATS')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
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
                          className="rounded-2xl border p-4 space-y-3 hover:shadow-md transition-shadow text-center flex flex-col items-center"
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
                          <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50 px-2 py-1.5 rounded w-full">
                            &quot;{friend.statusMessage}&quot;
                          </p>
                          <div className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-1 border-t">
                            <span>온도 {friend.mannerTemp}℃</span>
                            <span>{friend.gender} · {friend.age}세</span>
                          </div>
                          <Button
                            onClick={() => handleStartNeighborChat(friend)}
                            size="sm"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 shadow-xs"
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
                  <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border shadow-xs">
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
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-4 shrink-0"
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
                        className="bg-white p-4 rounded-2xl border shadow-2xs space-y-2 hover:border-blue-200 transition-colors"
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
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[620px] rounded-2xl bg-white border shadow-sm overflow-hidden">
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
                              className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs h-8"
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
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 shrink-0"
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
              <div className="rounded-3xl bg-white p-6 border shadow-sm space-y-5">
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
                        서울 강남구 역삼1동 · 매너온도 36.5℃
                      </p>
                      <p className="text-xs text-slate-600 italic mt-1">
                        &quot;동네 친구들과 따뜻하고 즐거운 소통 나누고 싶어요 ✨&quot;
                      </p>
                    </div>
                  </div>

                  {!isAuthenticated ? (
                    <Button
                      onClick={() => openLoginModal()}
                      className="bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold text-xs"
                    >
                      <LogIn className="h-4 w-4 mr-1.5" />
                      로그인 / 회원가입
                    </Button>
                  ) : (
                    <Button
                      onClick={logout}
                      variant="outline"
                      size="sm"
                      className="text-xs text-slate-600 hover:text-rose-600"
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
                  <div className="p-4 rounded-2xl border bg-gradient-to-br from-emerald-50/60 to-white space-y-3">
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
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 shadow-xs"
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
                        className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold text-xs h-9"
                      >
                        <Building2 className="h-3.5 w-3.5 mr-1.5" />
                        입점사 신청하기 (사업자 등록)
                      </Button>
                    )}
                  </div>

                  {/* Creator Promotion / Access Card */}
                  <div className="p-4 rounded-2xl border bg-gradient-to-br from-purple-50/60 to-white space-y-3">
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
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 shadow-xs"
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
                        className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 font-bold text-xs h-9"
                      >
                        <Mic className="h-3.5 w-3.5 mr-1.5" />
                        크리에이터 신청하기 (소통·커머스)
                      </Button>
                    )}
                  </div>
                </div>

                {/* Company Super Admin Console Card (Admins Only) */}
                {role === 'ADMIN' && (
                  <div className="p-4 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 space-y-2">
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
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-8"
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
              <div className="rounded-3xl bg-white p-6 border shadow-sm space-y-4">
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
                      className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt="item"
                          className="h-12 w-12 rounded-lg object-cover"
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
      </div>

      {/* ========================================================= */}
      {/* 3. Mobile Bottom Navigation Bar (md:hidden)               */}
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
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/30 group-active:scale-95 transition-transform">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <span className="text-[10px] font-extrabold text-rose-600 mt-0.5">
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
      {/* 4. Global Modals Section                                  */}
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
                <label className="font-semibold text-slate-700">통신판매업신고번호</label>
                <Input
                  value={merchantForm.onlineOrderNumber}
                  onChange={(e) => setMerchantForm({ ...merchantForm, onlineOrderNumber: e.target.value })}
                  placeholder="예: 제 2024-서울강남-1234호"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">정산 은행</label>
                  <Input
                    value={merchantForm.bankName}
                    onChange={(e) => setMerchantForm({ ...merchantForm, bankName: e.target.value })}
                    placeholder="국민은행"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="font-semibold text-slate-700">정산 계좌번호</label>
                  <Input
                    value={merchantForm.accountNumber}
                    onChange={(e) => setMerchantForm({ ...merchantForm, accountNumber: e.target.value })}
                    placeholder="계좌번호 (- 없이 입력)"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">예금주</label>
                <Input
                  value={merchantForm.accountHolder}
                  onChange={(e) => setMerchantForm({ ...merchantForm, accountHolder: e.target.value })}
                  placeholder="예금주 성명"
                  className="text-xs"
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              입점사 승격 신청 및 셀러 센터 활성화
            </Button>
          </div>
        </div>
      )}

      {/* 3) Creator Application Modal (크리에이터 신청) */}
      {isCreatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border space-y-4">
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
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">주요 방송 카테고리</label>
                <select
                  value={creatorForm.category}
                  onChange={(e) => setCreatorForm({ ...creatorForm, category: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
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
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">채널 소개 및 포부</label>
                <Input
                  value={creatorForm.bio}
                  onChange={(e) => setCreatorForm({ ...creatorForm, bio: e.target.value })}
                  placeholder="이웃들과 진솔한 소통 및 신선한 흑돼지 산지직송을 소개하고 싶습니다!"
                  className="text-xs"
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
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
            >
              크리에이터 승격 및 스튜디오 활성화
            </Button>
          </div>
        </div>
      )}

      {/* 4) Start Live Modal (일반 회원 누구나 방송 가능, 크리에이터는 상품 핀 연결 가능) */}
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
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">방송 카테고리</label>
                <select
                  value={newLiveCategory}
                  onChange={(e) => setNewLiveCategory(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                >
                  <option value="토크/소통">토크 / 소통</option>
                  <option value="쇼핑/커머스">쇼핑 / 커머스 (크리에이터 권장)</option>
                  <option value="일상">일상</option>
                  <option value="취미">취미</option>
                  <option value="음악/노래">음악 / 노래</option>
                </select>
              </div>

              {role === 'CREATOR' || role === 'ADMIN' ? (
                <div className="rounded-xl bg-purple-50 p-3 border border-purple-100 text-purple-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                    공식 크리에이터 커머스 핀 혜택 적용
                  </div>
                  <p className="text-[11px] text-purple-700">
                    방송 개설 시 모꼬 인기 상품(제주 흑돼지 등)이 자동으로 핀 상품으로 연결되어 실시간 판매 수수료가 적립됩니다.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 p-3 border text-slate-600 text-[11px]">
                  💡 일반 회원은 자유 소통 방송이 가능하며, 커머스 상품 판매를 원하시면 크리에이터 신청을 진행해주세요.
                </div>
              )}
            </div>

            <Button
              onClick={handleCreateLiveRoom}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              온에어 방송 송출 시작하기
            </Button>
          </div>
        </div>
      )}

      {/* 5) Live Room Viewer Modal */}
      {activeLiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl rounded-2xl bg-slate-950 text-white shadow-2xl border border-slate-800 overflow-hidden flex flex-col md:flex-row h-[85vh] max-h-[700px]">
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
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 px-3 shrink-0 shadow-md"
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
                  className="bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold text-[11px] h-7 px-2.5"
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
                  className="text-xs bg-slate-800 border-slate-700 text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendLiveChat()
                  }}
                />
                <Button
                  onClick={handleSendLiveChat}
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-9"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6) Used Product Detail Modal */}
      {selectedUsedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedUsedItem(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-100">
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
              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed bg-slate-50/50 p-3 rounded-lg border">
                {selectedUsedItem.description}
              </p>
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
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs h-10 shadow-xs"
              >
                <ShieldCheck className="h-4 w-4 mr-1.5" />
                에스크로 안전구매
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7) Market Product Detail Modal */}
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 shadow-xs"
            >
              에스크로 안전결제 주문하기 (총 {(selectedProduct.price * quantity + selectedProduct.shippingFee).toLocaleString()}원)
            </Button>
          </div>
        </div>
      )}

      {/* 8) Checkout Modal */}
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
                모꼬 에스크로 안전결제 주문
              </h3>
              <p className="text-xs text-muted-foreground">
                구매 확정 시까지 결제 대금이 플랫폼에 안전하게 보관됩니다.
              </p>
            </div>

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

      {/* 9) New Used Item Modal */}
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
                모꼬 (MOCCO) 모바일 앱
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

      {/* ========================================================= */}
      {/* 5. 시연/검수용 플로팅 역할 스위처 (헤더 레이아웃 침범 방지)    */}
      {/* 나중에 삭제 시 아래 한 줄만 지우면 깔끔하게 제거됩니다.        */}
      {/* ========================================================= */}
      <RoleSwitcherFloating />
    </div>
  )
}
