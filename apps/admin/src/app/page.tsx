/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Smartphone,
  Home,
  Store,
  ShoppingBag,
  Radio,
  MessageCircle,
  User,
  Heart,
  Maximize2,
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
  ChevronUp,
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
  ShoppingCart,
  Plus,
  Minus,
  Wallet,
  Award,
  Filter,
  FileText,
  Scale,
  PhoneCall,
  Info,
  Users,
  UserPlus,
  Trophy,
  Gift,
  MoreVertical,
  Battery,
  Wifi,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Phone,
  Camera,
  Ban,
  Play,
  Trash2,
  Sliders,
  Bell,
  Star,
  Copy,
  RotateCcw,
  AlertTriangle,
  AlertCircle,
  Menu,
  ImageIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useWebAuth, type UserRole, type MerchantApplication, type CreatorApplication } from '@/lib/auth-context'
import { RoleSwitcherFloating } from '@/components/common/RoleSwitcherFloating'
import {
  api,
  getLiveTop3Rooms,
  getLiveRankings,
  getLiveRooms,
  sendWebLiveMessage,
  sendWebLiveGift,
  getAdminLiveMessages,
  getAdminGifts,
  getMarketProducts,
  getNormalProducts,
  createMarketProduct,
  getSudaPosts,
  createSudaPost,
  deleteSudaPost,
  getChatRooms,
  deleteChatRoom,
  createDirectChat,
  sendChatMessage,
  sendChatGift,
  getChatMessages,
  uploadChatMedia,
} from '@/lib/api'
import { resolveDisplayImageUrl, getCategoryFallbackImage } from '@/lib/normalize'
import { io } from 'socket.io-client'
import { ToastAction } from '@/components/ui/toast'
import {
  MarketProductDetailModal,
  type MarketProductDetail,
} from '@/components/market/MarketProductDetailModal'
import {
  MarketProductCreateModal,
  type CreateProductPayload,
} from '@/components/market/MarketProductCreateModal'
import { MoccoPointChargeModal } from '@/components/payment/MoccoPointChargeModal'

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
  amount?: number
  points?: number
  thumbnailUrl?: string | null
  icon?: string
  category: string
  animationType?: string
}

const MOCCO_CHAT_GIFTS: MoccoChatGiftItem[] = [
  {
    id: 'gift-mocco-1',
    name: '볼빨간 모꼬 (소형)',
    description: '모꼬가 부끄러워하며 화면에 핑크빛 하트 구름 방울을 퐁퐁 뿜어냅니다 ☁️💖',
    pricePoints: 1000,
    amount: 1000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    icon: '☁️💖',
    category: 'mocco_special',
    animationType: 'BLUSHING_MOCCO',
  },
  {
    id: 'gift-mocco-2',
    name: '구름카 탄 모꼬 (중형)',
    description: '모꼬가 핑크빛 오픈카를 타고 화면을 가로지르며 꽃가루 폭죽을 쏘아 올립니다 🚗🎉',
    pricePoints: 5000,
    amount: 5000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    icon: '🚗🎉',
    category: 'mocco_special',
    animationType: 'CLOUD_CAR_MOCCO',
  },
  {
    id: 'gift-mocco-3',
    name: '골든 킹 모꼬의 축제 (VIP 대형)',
    description: '황금 왕관을 쓴 거대 황금 모꼬가 나타나 화면 전체에 골드 코인과 축제 폭죽을 쏟아붓습니다 👑🪙🎆',
    pricePoints: 30000,
    amount: 30000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200',
    icon: '👑🪙',
    category: 'mocco_vip',
    animationType: 'GOLDEN_KING_MOCCO',
  },
  {
    id: 'gift-cafe-1',
    name: '달콤 마카롱 세트',
    description: '따뜻한 대화에 달콤한 활력을 주는 5색 프리미엄 마카롱 세트 🍬',
    pricePoints: 3000,
    amount: 3000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=200',
    icon: '🍬',
    category: 'general',
  },
  {
    id: 'gift-cafe-2',
    name: '스타벅스 아메리카노',
    description: '기분 좋은 하루를 응원하는 모바일 커피 쿠폰 ☕',
    pricePoints: 4500,
    amount: 4500,
    thumbnailUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200',
    icon: '☕',
    category: 'general',
  },
  {
    id: 'gift-special-1',
    name: '따뜻한 커피',
    description: '친구에게 마음을 전하는 따뜻한 커피 한 잔',
    pricePoints: 100,
    amount: 100,
    thumbnailUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200',
    icon: '☕',
    category: 'general',
  },
  {
    id: 'gift-special-2',
    name: '달콤한 아이스크림',
    description: '기분 좋은 시원하고 달콤한 선물',
    pricePoints: 300,
    amount: 300,
    thumbnailUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=200',
    icon: '🍦',
    category: 'general',
  },
  {
    id: 'gift-special-3',
    name: '조각 케이크',
    description: '특별한 날을 축하하는 달콤한 케이크',
    pricePoints: 500,
    amount: 500,
    thumbnailUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200',
    icon: '🍰',
    category: 'general',
  },
  {
    id: 'gift-special-4',
    name: '아름다운 꽃다발',
    description: '진심 어린 감동을 전하는 꽃다발 선물',
    pricePoints: 1000,
    amount: 1000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=200',
    icon: '💐',
    category: 'general',
  },
  {
    id: 'gift-special-5',
    name: '영롱한 다이아몬드',
    description: '최고의 찬사를 보내는 영롱한 보석',
    pricePoints: 5000,
    amount: 5000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=200',
    icon: '💎',
    category: 'general',
  },
  {
    id: 'gift-vip-1',
    name: '네온 슈퍼카 (3D)',
    description: '화려한 라이브를 수놓는 3D 슈퍼카 이펙트',
    pricePoints: 10000,
    amount: 10000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=200',
    icon: '🏎️',
    category: 'mocco_vip',
    animationType: 'alpha_video',
  },
  {
    id: 'gift-vip-2',
    name: '골든 드래곤 (3D)',
    description: '화면 전체를 압도하는 헐리우드급 3D 황금 드래곤',
    pricePoints: 50000,
    amount: 50000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200',
    icon: '🐉',
    category: 'mocco_vip',
    animationType: 'alpha_video',
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
  coverUri?: string
  streamVideoUri?: string
  hasCommerce: boolean
  isOfficialCreator?: boolean
  rank?: number
  broadcastType?: 'PUBLIC' | 'PRIVATE'
  entryFee?: number
  pinnedProduct?: {
    id: string
    title: string
    price: number
    originalPrice?: number
    image: string
    type?: 'USED' | 'NORMAL'
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
  unread?: boolean
  type?: 'text' | 'media' | 'gift' | 'system'
  media?: {
    uri: string
  }
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
  targetUserId?: string
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
  allowLiveSale?: boolean
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
  detailImages?: string[]
  detailNotice?: string
  manufacturer?: string
  origin?: string
  csPhone?: string
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
  title?: string // 1:1 수다 대기방 제목 (예: 나랑 술 마실 사람 구해요 🍺)
  content: string // 한 줄 소개 / 만남 내용
  entryFee?: number // 1:1 라이브 단가 설정 (예: 50 꿀떡, 100 꿀떡, 0)
  category?: string // 테마 (술한잔/맛집, 카페, 산책, 일상)
  time: string
  likes: number
  comments: number
  isLiked?: boolean
}

export interface FollowUserItem {
  id: string
  nickname: string
  avatar: string
  region: string
  gender: string
  age: number
  mannerTemp: number
  headline: string
  followersCount: number
  followingCount: number
  isOnline: boolean
  isLive?: boolean
  liveTitle?: string
  isFollowing: boolean
  interests: string[]
  photos?: string[]
}

const INITIAL_FOLLOWERS: FollowUserItem[] = [
  {
    id: 'f-1',
    nickname: '민지',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
    region: '서울 강남구 역삼동',
    gender: '여',
    age: 24,
    mannerTemp: 38.2,
    headline: '역삼동 카페 투어 좋아하는 직장인이에요 ☕',
    followersCount: 142,
    followingCount: 89,
    isOnline: true,
    isFollowing: true,
    interests: ['카페투어', '베이킹', '소통', '일상'],
  },
  {
    id: 'f-2',
    nickname: '지훈',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
    region: '서울 강남구 논현동',
    gender: '남',
    age: 27,
    mannerTemp: 36.5,
    headline: '퇴근 후 양재천 러닝 크루 모집합니다 🏃‍♂️',
    followersCount: 95,
    followingCount: 64,
    isOnline: true,
    isFollowing: false,
    interests: ['러닝', '헬스', '반려견', '등산'],
  },
  {
    id: 'f-3',
    nickname: '유진',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500',
    region: '서울 강남구 대치동',
    gender: '여',
    age: 25,
    mannerTemp: 41.0,
    headline: '따뜻한 나눔 & 중고거래 소통해요 ✨',
    followersCount: 230,
    followingCount: 120,
    isOnline: false,
    isFollowing: true,
    interests: ['소통', '중고거래', '식물가꾸기', '영화'],
  },
  {
    id: 'f-4',
    nickname: '서준',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500',
    region: '서울 강남구 삼성동',
    gender: '남',
    age: 28,
    mannerTemp: 37.0,
    headline: '모꼬 LIVE 스트리머! 음악과 일상 소통 라이브 방송 🎙️',
    followersCount: 512,
    followingCount: 180,
    isOnline: true,
    isLive: true,
    liveTitle: '강남역 루프탑 어쿠스틱 감성 라이브 🎸',
    isFollowing: false,
    interests: ['라이브방송', '음악', '기타연주', '맛집탐방'],
  },
  {
    id: 'f-5',
    nickname: '하은',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
    region: '서울 강남구 청담동',
    gender: '여',
    age: 26,
    mannerTemp: 39.5,
    headline: '골든리트리버 뭉치 견주입니다 🐶 함께 산책해요!',
    followersCount: 310,
    followingCount: 145,
    isOnline: true,
    isFollowing: true,
    interests: ['반려견', '한강산책', '캠핑', '사진'],
  },
  {
    id: 'f-6',
    nickname: '수빈',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500',
    region: '서울 강남구 도곡동',
    gender: '여',
    age: 23,
    mannerTemp: 36.8,
    headline: '베이킹과 디저트 맛집 탐방이 취미예요 🍰',
    followersCount: 88,
    followingCount: 52,
    isOnline: false,
    isFollowing: false,
    interests: ['디저트', '베이킹', '인테리어', '소통'],
  },
  {
    id: 'f-7',
    nickname: '태호',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=500',
    region: '서울 강남구 역삼2동',
    gender: '남',
    age: 29,
    mannerTemp: 36.5,
    headline: '자전거 라이딩 & 테니스 치실 분 편하게 연락주세요 🎾',
    followersCount: 120,
    followingCount: 90,
    isOnline: true,
    isFollowing: false,
    interests: ['테니스', '자전거', '피트니스', '테크'],
  },
  {
    id: 'f-8',
    nickname: '소율',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500',
    region: '서울 강남구 개포동',
    gender: '여',
    age: 24,
    mannerTemp: 40.2,
    headline: '양재천 벚꽃 산책과 독서를 즐깁니다 📚',
    followersCount: 185,
    followingCount: 110,
    isOnline: true,
    isFollowing: true,
    interests: ['독서', '산책', '전시회', '힐링'],
  },
]

const INITIAL_FOLLOWING: FollowUserItem[] = [
  INITIAL_FOLLOWERS[0],
  INITIAL_FOLLOWERS[2],
  INITIAL_FOLLOWERS[4],
  INITIAL_FOLLOWERS[7],
  {
    id: 'ing-1',
    nickname: '제주푸드마켓',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
    region: '제주 제주시 (공식입점)',
    gender: '여',
    age: 32,
    mannerTemp: 45.0,
    headline: '산지직송 제철 농수산물 전문 모꼬 공식 파트너 스토어 🍊',
    followersCount: 1240,
    followingCount: 25,
    isOnline: true,
    isFollowing: true,
    interests: ['산지직송', '특가공구', '제주특산물', '신선식품'],
  },
  {
    id: 'ing-2',
    nickname: '재즈피아노_현우',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500',
    region: '서울 서초구 서초동',
    gender: '남',
    age: 27,
    mannerTemp: 37.8,
    headline: '매주 주말 밤 재즈 연주 라이브 방송을 진행합니다 🎹',
    followersCount: 890,
    followingCount: 112,
    isOnline: true,
    isLive: false,
    isFollowing: true,
    interests: ['재즈', '피아노', '라이브방송', '음악'],
  },
]

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
    title: '모꼬 신규 가입 시 웰컴 1,000 모꼬 꿀떡 즉시 지급!',
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
    title: '☕ [일반회원 자유방송] 핫플레이스 카페 투어 & 홈카페 감성 소통!',
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
    title: '🎮 모바일 배틀그라운드 신맵 탐방 & 실시간 스쿼드 대전',
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
    title: '👗 가을 데일리룩 코디 & 옷장 털기 중고 라이브',
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
    title: '오늘 퇴근하고 강남역에서 시원하게 맥주 한잔 하실 분 🍺',
    content: '역삼/강남 근처 직장인 이웃 환영합니다! 가볍게 치맥 하면서 오늘 하루 털어내요~',
    entryFee: 500,
    category: '술 한잔/맛집',
    likes: 0,
    comments: 0,
  },
  {
    id: 'suda-dohyun',
    nickname: '도현',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    region: '역삼2동',
    distance: '1.1km',
    time: '12분 전',
    title: '역삼역 스타벅스에서 커피 마시며 가볍게 수다 떨 이웃 ☕',
    content: '저녁 7시쯤 책 읽거나 일상 대화 나누실 분 편하게 입장해주세요!',
    entryFee: 300,
    category: '카페/디저트',
    likes: 0,
    comments: 0,
  },
  {
    id: 'suda-yujin',
    nickname: '유진',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
    region: '도곡동',
    distance: '1.8km',
    time: '25분 전',
    title: '양재천 반려견 저녁 산책 같이 하실 견주님 찾아요 🐶',
    content: '소형견/중형견 견주님 환영! 매너 산책 코스 같이 돌아요 ✨',
    entryFee: 0,
    category: '산책/운동',
    likes: 0,
    comments: 0,
  },
  {
    id: 'suda-jiwoo',
    nickname: '지우',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    region: '논현1동',
    distance: '2.2km',
    time: '42분 전',
    title: '금요일 저녁 신사 가로수길 와인바 같이 가실 분 🍷',
    content: '분위기 좋은 곳 예약해뒀어요. 맛있는 안주에 수다 떨어봐요!',
    entryFee: 1000,
    category: '술 한잔/맛집',
    likes: 0,
    comments: 0,
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
    statusMessage: '오늘 날씨 너무 좋아요 ☀️ 실시간 소통 환영해요!',
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
    statusMessage: '여수 밤바다 보며 일상 수다 나눌 친구 찾아요 🌊',
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
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
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
    nickname: '태우',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
    region: '인천 송도',
    distance: '4.8km',
    mannerTemp: 36.8,
    statusMessage: '골프 & 등산 취미 나누실 분 계신가요 ⛳',
    isOnline: false,
    gender: '남',
    age: 42,
  },
  {
    id: 'friend-7',
    nickname: '지수',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300',
    region: '대전 유성구',
    distance: '5.2km',
    mannerTemp: 38.0,
    statusMessage: '주말 과학공원 산책 & 디저트 카페 탐방 🍰',
    isOnline: true,
    gender: '여',
    age: 25,
  },
  {
    id: 'friend-8',
    nickname: '현우',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300',
    region: '광주 상무지구',
    distance: '6.1km',
    mannerTemp: 37.5,
    statusMessage: '상무지구 맛집 공유 & 저녁 가벼운 맥주 친구 🍻',
    isOnline: false,
    gender: '남',
    age: 30,
  },
  {
    id: 'friend-9',
    nickname: '다은',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    region: '대구 수성구',
    distance: '3.4km',
    mannerTemp: 38.2,
    statusMessage: '수성못 산책길 러닝 & 사진 찍기 📸',
    isOnline: true,
    gender: '여',
    age: 28,
  },
  {
    id: 'friend-10',
    nickname: '시우',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300',
    region: '울산 남구',
    distance: '7.0km',
    mannerTemp: 36.9,
    statusMessage: '태화강 십리대숲 자전거 라이딩 좋아해요 🚴',
    isOnline: true,
    gender: '남',
    age: 32,
  },
  {
    id: 'friend-11',
    nickname: '유나',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
    region: '세종 보람동',
    distance: '8.3km',
    mannerTemp: 38.7,
    statusMessage: '금강 보행교 야경 보면서 커피 한잔 어때요? 🌉',
    isOnline: true,
    gender: '여',
    age: 27,
  },
  {
    id: 'friend-12',
    nickname: '동현',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    region: '강원 춘천시',
    distance: '9.5km',
    mannerTemp: 37.1,
    statusMessage: '공지천 피크닉 & 주말 캠핑 메이트 찾아요 ⛺',
    isOnline: true,
    gender: '남',
    age: 33,
  },
  {
    id: 'friend-13',
    nickname: '서연',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    region: '충북 청주시',
    distance: '10.2km',
    mannerTemp: 37.9,
    statusMessage: '수암골 벽화마을 야경 투어 & 전시회 관람 🎨',
    isOnline: false,
    gender: '여',
    age: 26,
  },
  {
    id: 'friend-14',
    nickname: '민재',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    region: '충남 천안시',
    distance: '11.0km',
    mannerTemp: 36.6,
    statusMessage: '불당동 카페거리에서 책 읽고 공부하기 📖',
    isOnline: true,
    gender: '남',
    age: 28,
  },
  {
    id: 'friend-15',
    nickname: '수빈',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
    region: '경북 포항시',
    distance: '12.5km',
    mannerTemp: 38.4,
    statusMessage: '영일대 해수욕장 모닝 산책 & 맛있는 회 🐟',
    isOnline: true,
    gender: '여',
    age: 29,
  },
  {
    id: 'friend-16',
    nickname: '정우',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
    region: '경남 창원시',
    distance: '13.1km',
    mannerTemp: 37.0,
    statusMessage: '용지호수 음악분수 보며 가벼운 운동해요 🏃',
    isOnline: false,
    gender: '남',
    age: 31,
  },
  {
    id: 'friend-17',
    nickname: '예린',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300',
    region: '제주 제주시',
    distance: '15.0km',
    mannerTemp: 39.5,
    statusMessage: '함덕 에메랄드빛 바다 보며 힐링 수다 나눌 분 🌊',
    isOnline: true,
    gender: '여',
    age: 27,
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
본 약관은 주식회사 모꼬글로벌(이하 "회사")이 운영하는 모꼬(MOCCO) 웹사이트 및 모바일 애플리케이션(이하 "몰" 또는 "서비스")에서 제공하는 전자상거래 및 실시간 스트리밍, 실시간 1:1 소통 커뮤니티 서비스를 이용함에 있어 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (통신판매중개자로서의 지위 및 면책)
1. 회사는 통신판매중개자로서 이용자 간의 자유로운 재화 또는 용역의 거래 및 라이브 방송 후원을 위한 전자상거래 시스템을 운영 및 관리, 제공할 뿐입니다.
2. 개별 판매자 및 회원이 등록한 상품의 정보, 배송, 교환, 환불 및 라이브 방송 내용에 대한 책임은 해당 정보를 등록한 당사자에게 있습니다.
3. 단, 회사는 전자상거래 등에서의 소비자보호에 관한 법률(전자상거래법)에 따라 구매자의 안전한 거래를 보장하기 위해 100% 에스크로(매매보호) 서비스를 제공합니다.

제3조 (서비스의 제공 및 변경)
1. 회사는 다음과 같은 서비스를 제공합니다:
  - 전국 및 지역 기반 실시간 라이브 스트리밍 및 라이브커머스 중개
  - 개인 간 중고물품 매매 중개 (에스크로 안전결제)
  - 본사 직영 및 공식 입점사의 상품 판매 및 공동구매 중개
  - 실시간 1:1 수다(SUDA) 및 1:1 대화방 커뮤니티

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
- 거리 및 위치기반 이웃 추천 및 지역 라이브 방송 추천
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
- 성명: 정진우
- 직책: 대표이사 / 개인정보보호책임자 (CPO)
- 문의처: privacy@mocco.kr / 1588-0000`,
  },
  'financial-terms': {
    title: '전자금융거래 이용약관',
    category: '전자금융거래법 준수',
    body: `제1조 (목적)
본 약관은 주식회사 모꼬글로벌(이하 "회사")이 제공하는 전자지급결제대행서비스, 선불전자지급수단(모꼬 머니 및 모꼬 꿀떡) 발행 및 관리서비스, 결제대금예치(에스크로) 서비스를 이용자가 이용함에 있어 회사와 이용자 간의 전자금융거래의 법률관계를 정하는 것을 목적으로 합니다.

제2조 (결제대금예치서비스 - 에스크로)
1. 회사는 전자상거래 등에서의 소비자보호에 관한 법률 제24조에 따라 선지급식 통신판매에 있어서 소비자가 요청하는 경우 토스페이먼츠 및 제휴 금융기관을 통한 결제대금예치(에스크로) 서비스를 제공합니다.
2. 구매자가 물품을 정상 수령하고 [구매확정]을 완료한 후 또는 법정 기한 내에 이의 제기가 없는 경우에 한하여 판매자에게 대금을 정산 지급합니다.

제3조 (선불전자지급수단 - 모꼬 꿀떡 및 모꼬 머니)
1. 이용자는 계좌이체, 신용카드, 이벤트 리워드 등을 통해 모꼬 꿀떡을 충전하거나 적립받을 수 있습니다.
2. 충전된 모꼬 꿀떡은 라이브 방송 후원, 1:1 대화방 입장 및 3D 선물 교환에 사용되며, 마켓 상품 결제 및 판매 정산은 모꼬 머니(KRW)로 안전하게 처리됩니다.`,
  },
  'youth-protection': {
    title: '청소년보호정책',
    category: '청소년 보호법 준수',
    body: `주식회사 모꼬글로벌은 청소년이 유해한 환경으로부터 보호받고 유익한 매체를 이용할 수 있도록 「청소년 보호법」 및 정보통신윤리위원회 심의규정을 준수하고 있습니다.

1. 유해정보에 대한 청소년접근제한 및 관리조치
회사는 청소년이 아무런 제약 없이 유해미디어 및 성인물에 접근하지 못하도록 별도의 연령인증 장치를 마련하고 있습니다.

2. 청소년보호책임자 및 담당자
- 청소년보호책임자: 정진우 대표이사
- 연락처: youth@mocco.kr / 1588-0000`,
  },
}

/**
 * 🎙️ 모꼬 LIVE 방송 준비중 스탠바이 카드 (유저 제공 TV 컬러바 + 우주 밤하늘 감성 테마)
 * 실시간 방송이 비어있을 때 슬롯을 채우고, 방송이 시작되면 자동으로 교체됨
 */
function MoccoLiveStandbyCard({ index = 1 }: { index?: number }) {
  const { toast } = useToast()
  return (
    <div
      onClick={() => {
        toast({
          title: '🎙️ 스트리머가 방송을 준비 중이에요!',
          description: '새로운 라이브가 곧 시작됩니다. 채널을 고정하고 조금만 기다려 주세요! ✨',
        })
      }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-slate-950 border border-slate-800/80 shadow-2xs hover:shadow-lg hover:border-pink-500/50 transition-all cursor-pointer"
    >
      {/* Aspect-square Cover area with starry night + TV test pattern ribbon */}
      <div className="relative aspect-square w-full bg-[#0a0f1d] overflow-hidden flex flex-col justify-between p-3 select-none">
        {/* Background Starry Night Gradient with glowing nebula */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/70 via-slate-950 to-black pointer-events-none" />
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Top: Retro TV SMPTE Color Bars Ribbon (위 이미지 2 반영) */}
        <div className="relative z-10 flex h-1.5 w-full rounded-full overflow-hidden shadow-xs opacity-90 group-hover:opacity-100 transition-opacity">
          <div className="flex-1 bg-[#c0c0c0]" />
          <div className="flex-1 bg-[#d4d400]" />
          <div className="flex-1 bg-[#00d4d4]" />
          <div className="flex-1 bg-[#00d400]" />
          <div className="flex-1 bg-[#d400d4]" />
          <div className="flex-1 bg-[#d40000]" />
          <div className="flex-1 bg-[#0000d4]" />
        </div>

        {/* Center: Camera/Standby icon & text (위 이미지 4 반영) */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto px-2">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 group-hover:border-pink-500/40 group-hover:bg-pink-500/10 transition-all duration-300">
            <Radio className="h-4 w-4 sm:h-5 sm:w-5 text-pink-400 animate-pulse" />
          </div>
          <span className="text-[9px] tracking-widest text-slate-400 font-medium uppercase mb-0.5">
            See you next time
          </span>
          <h5 className="text-xs sm:text-sm font-black text-white leading-tight">
            스트리머가<br /><span className="text-pink-400">방송을 준비중</span>이에요!
          </h5>
          <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1 line-clamp-1">
            그대의 행복마저 나의 행복이길 ✨
          </p>
        </div>

        {/* Bottom: Next On-Air Badge */}
        <div className="relative z-10 flex items-center justify-between text-[10px]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-300 font-semibold backdrop-blur-xs text-[9px] sm:text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
            ON-AIR 준비중
          </span>
          <span className="text-[9px] text-slate-500 font-mono">STANDBY #{index}</span>
        </div>
      </div>

      {/* Info panel underneath */}
      <div className="p-2.5 space-y-1 bg-slate-900/90 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <span className="text-xs">🎙️</span>
          </div>
          <span className="text-xs font-bold text-slate-300 truncate">
            모꼬 크리에이터
          </span>
        </div>
        <h4 className="font-bold text-xs text-slate-400 line-clamp-1 group-hover:text-pink-400 transition-colors">
          새로운 라이브 방송이 곧 시작됩니다
        </h4>
      </div>
    </div>
  )
}

/**
 * 🎁 모꼬마켓 상품 준비중 스탠바이 카드 (유저 제공 알림 원형 아이콘 + 준비중 태그 감성 테마)
 * 상품 그리드의 빈 공간을 채우고, 새 상품이 등록되면 자동으로 교체됨
 */
function MoccoMarketStandbyCard({ index = 1 }: { index?: number }) {
  const { toast } = useToast()
  return (
    <div
      onClick={() => {
        toast({
          title: '🎁 상품 준비중입니다.',
          description: '새로운 모꼬 특가 상품이 등록될 예정입니다. 조금만 기다려 주세요! ✨',
        })
      }}
      className="bg-white rounded-2xl border border-dashed border-slate-300 p-3 shadow-2xs hover:shadow-md hover:border-pink-300 transition-all cursor-pointer flex flex-col justify-between group select-none"
    >
      <div>
        {/* Aspect-square Image area (위 이미지 1 & 이미지 3 반영) */}
        <div className="aspect-square w-full rounded-xl overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100/80 relative mb-2.5 flex flex-col items-center justify-center p-3 text-center border border-slate-100">
          {/* Top hanger tag style badge (이미지 3 반영) */}
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-white text-[9px] font-extrabold shadow-2xs">
            <span>🏷️ 준비중</span>
          </div>

          {/* Center Exclamation Circle (이미지 1 반영) */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-200/90 flex items-center justify-center text-slate-600 mb-1.5 sm:mb-2 group-hover:scale-110 group-hover:bg-pink-100 group-hover:text-pink-600 transition-all duration-300">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </div>

          <h5 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
            상품 준비중입니다.
          </h5>
          <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1 leading-snug">
            새로운 상품이 등록될 예정입니다.<br />
            <span className="text-slate-600 font-medium">조금만 기다려 주세요!</span>
          </p>
        </div>

        {/* Title area */}
        <div className="flex items-start gap-1.5">
          <span className="text-xs font-black text-slate-400 shrink-0 leading-tight">
            NEW
          </span>
          <h5 className="font-bold text-xs text-slate-600 line-clamp-1 group-hover:text-pink-600 transition-colors">
            [입고 대기] 모꼬 추천 프리미엄 상품
          </h5>
        </div>

        <div className="flex items-baseline gap-1.5 pt-1">
          <span className="font-extrabold text-xs text-pink-500">
            COMING SOON
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold">
            특가 오픈 예정 #{index}
          </span>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
        <span className="font-medium">모꼬 검증 셀러</span>
        <span className="text-pink-500 font-bold">입고 준비중 ✨</span>
      </div>
    </div>
  )
}

/**
 * 🏷️ 모꼬 공동구매 준비중 스탠바이 카드
 */
function MoccoGroupBuyStandbyCard({ index = 1 }: { index?: number }) {
  const { toast } = useToast()
  return (
    <Card
      onClick={() => {
        toast({
          title: '🏷️ 공동구매 준비중입니다.',
          description: '곧 새로운 파격 공동구매 핫딜이 오픈됩니다! 조금만 기다려 주세요. ✨',
        })
      }}
      className="group overflow-hidden rounded-3xl cursor-pointer hover:shadow-lg transition-all border border-dashed border-slate-300 bg-white flex flex-col justify-between select-none"
    >
      <div>
        <div className="aspect-square w-full bg-gradient-to-b from-rose-50/60 to-purple-50/60 overflow-hidden relative flex flex-col items-center justify-center p-4 text-center">
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
              공구 준비중
            </span>
            <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              NEXT 핫딜
            </span>
          </div>

          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-[#FF3B6B] mb-2 group-hover:scale-110 transition-transform">
            <AlertCircle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h5 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
            공구 상품 준비중입니다.
          </h5>
          <p className="text-[10px] text-slate-500 mt-1">
            모꼬 본사 검증 파격 특가 공구 오픈 예정!
          </p>
        </div>

        <CardContent className="p-4 space-y-2">
          <span className="text-[10px] text-muted-foreground font-semibold block truncate">
            모꼬 본사 공식 공구관
          </span>
          <h4 className="font-bold text-xs sm:text-sm text-slate-700 line-clamp-1 group-hover:text-[#FF3B6B] transition-colors">
            [공구 오픈 예정] 프리미엄 핫딜 #{index}
          </h4>
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-sm text-[#FF3B6B]">
              COMING SOON
            </span>
            <span className="text-xs text-slate-400">
              최대 70% 할인 예정
            </span>
          </div>
        </CardContent>
      </div>

      <div className="p-4 pt-0">
        <Button
          size="sm"
          className="w-full h-9 text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 hover:bg-rose-50 hover:text-[#FF3B6B] rounded-xl transition-all"
        >
          오픈 알림받기
        </Button>
      </div>
    </Card>
  )
}

/**
 * 🥕 모꼬 중고마켓 판매 유도 스탠바이 카드 (가지고 계신 중고 판매해 보세요)
 * 기본 4개 박스 유지 및 슬롯 채움, 클릭 시 중고 판매글 작성 모달 오픈
 */
function MoccoUsedSellStandbyCard({ onClick, index = 1 }: { onClick?: () => void; index?: number }) {
  return (
    <Card
      onClick={onClick}
      className="group overflow-hidden rounded-3xl cursor-pointer hover:shadow-lg transition-all border border-dashed border-orange-300 bg-white flex flex-col justify-between select-none"
    >
      <div>
        {/* Aspect-square illustration area */}
        <div className="aspect-square w-full bg-gradient-to-b from-orange-50 via-amber-50/50 to-orange-100/40 overflow-hidden relative flex flex-col items-center justify-center p-4 text-center">
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
              🥕 이웃 장터
            </span>
            <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              수수료 0원
            </span>
          </div>

          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-2 group-hover:scale-110 transition-transform shadow-xs">
            <PlusCircle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h5 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
            가지고 계신 중고 물품을<br />
            <span className="text-orange-600">지금 판매해 보세요!</span>
          </h5>
          <p className="text-[10px] text-slate-500 mt-1.5 leading-snug">
            잠자는 물건 등록하고<br />가까운 이웃과 안심 직거래해요 🥕
          </p>
        </div>

        <CardContent className="p-3.5 space-y-1">
          <span className="text-[10px] text-muted-foreground font-semibold block truncate">
            📍 내 동네 이웃 직거래
          </span>
          <h4 className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-1 group-hover:text-orange-600 transition-colors">
            우리 동네 중고물품 판매 등록하기 #{index}
          </h4>
          <p className="font-extrabold text-sm sm:text-base text-orange-600">
            즉시 무료 등록
          </p>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
            <span>안전결제 지원</span>
            <span className="text-orange-600 font-bold">1분 간편 등록</span>
          </div>
        </CardContent>
      </div>

      <div className="p-3.5 pt-0">
        <Button
          size="sm"
          className="w-full h-8 sm:h-9 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>내 중고 판매하기</span>
        </Button>
      </div>
    </Card>
  )
}

// 5 Mobile App Equivalent Tabs
type ActiveTab = 'HOME' | 'MARKET' | 'LIVE' | 'CHAT' | 'MY'

function getDeletedSudaIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    return new Set(JSON.parse(localStorage.getItem('mocco_deleted_suda_ids') || '[]'))
  } catch (e) {
    return new Set()
  }
}

function getDeletedChatIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    return new Set(JSON.parse(localStorage.getItem('mocco_deleted_chat_ids') || '[]'))
  } catch (e) {
    return new Set()
  }
}

export default function CustomerWebStorefrontPage() {
  const router = useRouter()
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
    isBannedModalOpen,
    banInfo,
    closeBannedModal,
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

  // 3. Location State (지역 및 거리 설정)
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
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportReasonText, setReportReasonText] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [isAttachSheetOpen, setIsAttachSheetOpen] = useState(false)
  const chatFileInputRef = useRef<HTMLInputElement>(null)
  const [sudaInputText, setSudaInputText] = useState('')
  const [isCreateSudaRoomOpen, setIsCreateSudaRoomOpen] = useState(false)
  const [newRoomTitle, setNewRoomTitle] = useState('')
  const [newRoomCategory, setNewRoomCategory] = useState('술 한잔/맛집')
  const [newRoomEntryFee, setNewRoomEntryFee] = useState(500)
  const [sudaCategoryFilter, setSudaCategoryFilter] = useState('전체')
  const [heroIndex, setHeroIndex] = useState(0)


  // 전역 장바구니 Drawer 상태 및 아이템
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

      // 💬 1) 커스텀 수다방 목록 복원 (삭제된 수다방 완전 제외)
      try {
        const deletedSuda = getDeletedSudaIds()
        const storedSuda = localStorage.getItem('mocco_custom_suda_rooms')
        if (storedSuda !== null) {
          const parsedSuda = JSON.parse(storedSuda)
          if (Array.isArray(parsedSuda)) {
            const filteredCustom = parsedSuda.filter((item: any) => !deletedSuda.has(item.id))
            const initialFiltered = INITIAL_SUDA_POSTS.filter((item) => !deletedSuda.has(item.id))
            const customIds = new Set(filteredCustom.map((item: any) => item.id))
            const remaining = initialFiltered.filter((item) => !customIds.has(item.id))
            setSudaPosts([...filteredCustom, ...remaining])
          }
        } else {
          setSudaPosts((prev) => prev.filter((item) => !deletedSuda.has(item.id)))
        }
      } catch (e) {
        console.warn('Failed to load custom suda rooms', e)
      }

      // 🎙️ 2) 커스텀 라이브 방송 목록 복원
      try {
        const storedLives = localStorage.getItem('mocco_custom_lives')
        if (storedLives) {
          const parsedLives = JSON.parse(storedLives)
          if (Array.isArray(parsedLives) && parsedLives.length > 0) {
            setLives((prev) => {
              const ids = new Set(parsedLives.map((item: any) => item.id))
              const remaining = prev.filter((item) => !ids.has(item.id))
              return [...parsedLives, ...remaining]
            })
            setTop3Lives((prev) => {
              const ids = new Set(parsedLives.map((item: any) => item.id))
              const remaining = prev.filter((item) => !ids.has(item.id))
              return [...parsedLives.slice(0, 3), ...remaining.slice(0, 3)].slice(0, 3)
            })
          }
        }
      } catch (e) {
        console.warn('Failed to load custom live rooms', e)
      }

      // 💌 3) 1:1 대화방 목록 및 대화 기록 복원 (퇴장/삭제된 방 완전 제외)
      try {
        const deletedChats = getDeletedChatIds()
        const storedChats = localStorage.getItem('mocco_custom_chat_rooms')
        if (storedChats !== null) {
          const parsedChats = JSON.parse(storedChats)
          if (Array.isArray(parsedChats)) {
            const filtered = parsedChats.filter((c: any) => !deletedChats.has(c.id))
            setChatRooms(filtered)
            setActiveChatRoom((prev) => {
              if (prev && filtered.some((r: any) => r.id === prev.id)) return prev
              return filtered[0] || null
            })
          }
        } else {
          const filteredInitial = INITIAL_CHAT_ROOMS.filter((c) => !deletedChats.has(c.id))
          setChatRooms(filteredInitial)
          setActiveChatRoom((prev) => {
            if (prev && filteredInitial.some((r: any) => r.id === prev.id)) return prev
            return filteredInitial[0] || null
          })
        }
      } catch (e) {
        console.warn('Failed to load custom chat rooms', e)
      }

      try {
        const storedHq = localStorage.getItem('mocco_hq_direct_products')
        if (storedHq) {
          const parsedHq = JSON.parse(storedHq)
          if (Array.isArray(parsedHq) && parsedHq.length > 0) {
            const mappedHqItems: MarketProductItem[] = parsedHq.map((p: any) => ({
              id: p.id,
              title: p.name,
              description: p.description || p.subTitle || '',
              price: Number(p.salePriceKrw || p.priceKrw),
              originalPrice: Number(p.priceKrw || p.salePriceKrw),
              type: p.planType === 'GROUP_BUY' ? 'B2C_GROUP' : 'B2C_NORMAL',
              ownerType: 'HEADQUARTERS',
              isHqDirect: true,
              category:
                p.category === 'FOOD'
                  ? '식품/신선'
                  : p.category === 'DIGITAL'
                  ? '디지털/가전'
                  : p.category === 'LIVING'
                  ? '리빙/생활'
                  : p.category === 'BEAUTY'
                  ? '뷰티/케어'
                  : '패션/잡화',
              images: Array.isArray(p.images) && p.images.length > 0
                ? p.images
                : ['https://images.unsplash.com/photo-1544025162-d76694265947?w=800'],
              sellerName: '모꼬(MOCCO) 본사 직영관',
              shippingFee: Number(p.shippingFee || 0),
              stock: Number(p.stock || 100),
              status: p.status || 'ACTIVE',
              affiliateCommissionRate: Number(p.affiliateCommissionRate || 10.0),
              salesCount: Number(p.salesCount || 0),
              orderCount: Math.floor(Number(p.salesCount || 0) * 0.8),
              rating: 5.0,
              reviewCount: Math.floor(Number(p.salesCount || 0) * 0.3),
            }))

            setMarketProducts((prev) => {
              const hqIds = new Set(mappedHqItems.map((item: any) => item.id))
              const remaining = prev.filter((item) => !hqIds.has(item.id))
              return [...mappedHqItems, ...remaining]
            })
          }
        }
      } catch (e) {
        console.warn('Failed to load HQ direct products', e)
      }

      // 💬 5) 서버 실시간 수다방 및 친구들 목록 동기화
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'https://tok-friends-api.onrender.com/v1'
        const deletedSuda = getDeletedSudaIds()

        const fetchSuda = async () => {
          try {
            let res = await fetch('/api/backend/suda/posts').catch(() => null)
            if (!res || !res.ok) {
              res = await fetch(`${apiBase}/suda/posts`).catch(() => null)
            }
            if (res && res.ok) {
              const data = await res.json()
              const items = Array.isArray(data?.items)
                ? data.items
                : Array.isArray(data?.data)
                ? data.data
                : Array.isArray(data)
                ? data
                : []
              if (items.length > 0) {
                const mapped = items
                  .filter((p: any) => !deletedSuda.has(p.id))
                  .map((p: any) => {
                    const rawNick = p.author?.nickname || p.author?.displayName || p.nickname || '모꼬이웃'
                    const isAnonymousOrSelf = !rawNick || rawNick === '나 (이웃)' || rawNick === '나' || rawNick === '이웃'
                    const normalizedNick = isAnonymousOrSelf ? '테스트01' : rawNick
                    const normalizedAuthorId = p.author?.id || (p as any).authorId || (normalizedNick === '테스트01' ? 'u-tester-01' : 'u-tester-02')

                    return {
                      id: p.id,
                      authorId: normalizedAuthorId,
                      nickname: normalizedNick,
                      avatar:
                        p.author?.avatarUrl ||
                        p.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
                      region: p.neighborhood || p.region || '역삼1동',
                      distance: typeof p.distanceKm === 'number' ? `${p.distanceKm}km` : p.distance || '0.8km',
                      time: p.createdAt
                        ? typeof p.createdAt === 'string' && p.createdAt.includes('분')
                          ? p.createdAt
                          : '최근'
                        : '방금 전',
                      title: p.title || p.content?.slice(0, 30) || '수다글',
                      content: p.content || '',
                      entryFee: Number(p.entryFee || 0),
                      category: p.category || '일상',
                      likes: Number(p.likesCount || p.likeCount || 0),
                      comments: Number(p.repliesCount || p.commentCount || 0),
                    }
                  })
                if (mapped.length > 0) {
                  setSudaPosts((prev) => {
                    const existingIds = new Set(mapped.map((m: any) => m.id))
                    let customFromStorage: SudaPostItem[] = []
                    try {
                      const raw = localStorage.getItem('mocco_custom_suda_rooms')
                      if (raw) {
                        const parsed = JSON.parse(raw)
                        if (Array.isArray(parsed)) {
                          customFromStorage = parsed.filter((p: any) => !deletedSuda.has(p.id))
                        }
                      }
                    } catch {}
                    const allCustom = [...customFromStorage, ...prev]
                    const seenIds = new Set<string>()
                    const userCreated: SudaPostItem[] = []
                    allCustom.forEach((p) => {
                      if (!seenIds.has(p.id) && !deletedSuda.has(p.id)) {
                        if (p.id.startsWith('suda-room-') || p.id.startsWith('suda-post-') || !existingIds.has(p.id)) {
                          seenIds.add(p.id)
                          userCreated.push(p)
                        }
                      }
                    })
                    const remainingMapped = mapped.filter((m: any) => !seenIds.has(m.id))
                    return [...userCreated, ...remainingMapped]
                  })
                }
              }
            }
          } catch (err) {
            console.warn('Failed to sync suda posts from server:', err)
          }
        }
        void fetchSuda()

        const fetchDiscover = async () => {
          try {
            let res = await fetch('/api/backend/discover').catch(() => null)
            if (!res || !res.ok) {
              res = await fetch('/api/backend/users/discover').catch(() => null)
            }
            if (!res || !res.ok) {
              res = await fetch(`${apiBase}/discover`).catch(() => null)
            }
            if (res && res.ok) {
              const data = await res.json()
              const rawItems = Array.isArray(data?.data)
                ? data.data
                : Array.isArray(data?.items)
                ? data.items
                : Array.isArray(data)
                ? data
                : []
              const items = rawItems.filter((u: any) => {
                const nick = String(u.nickname || u.displayName || u.name || '').toLowerCase()
                const role = String(u.role || '').toUpperCase()
                return (
                  u.id !== 'admin_super_user' &&
                  role !== 'ADMIN' &&
                  role !== 'SUPERADMIN' &&
                  !nick.includes('super admin') &&
                  !nick.includes('슈퍼어드민') &&
                  nick !== 'admin' &&
                  nick !== '관리자'
                )
              })
              if (items.length > 0) {
                const mapped = items.map((u: any, idx: number) => ({
                  id: u.id || `friend-${idx + 1}`,
                  nickname: u.nickname || u.displayName || u.name || `이웃${idx + 1}`,
                  avatar:
                    u.avatar ||
                    u.avatarUrl ||
                    `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(u.nickname || u.id)}`,
                  region: u.region || (u.region1 ? `${u.region1} ${u.region2 || ''}`.trim() : '서울 강남구'),
                  distance: typeof u.distance === 'number' ? `${u.distance}km` : u.distance || '0.5km',
                  mannerTemp: Number(u.mannerTemp || 36.5),
                  statusMessage: u.statusMessage || u.headline || u.bio || '모꼬에서 만나요!',
                  isOnline: u.isOnline !== undefined ? Boolean(u.isOnline) : true,
                  gender:
                    u.gender === 'female' || u.gender === '여' || u.gender === '여성' || u.genderKo === '여성'
                      ? '여'
                      : '남',
                  age: Number(u.age || 26),
                }))
                setFriends(mapped)
              }
            }
          } catch (err) {
            console.warn('Failed to sync friends from server:', err)
          }
        }
        void fetchDiscover()
      } catch (err) {
        console.warn('Failed to initialize server sync:', err)
      }
    }
  }, [])

  // 💬 전체수다 탭 진입 시 실시간 최신 목록 동기화
  useEffect(() => {
    if (chatSubTab === 'SUDA') {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'https://tok-friends-api.onrender.com/v1'
      const deletedSuda = getDeletedSudaIds()
      fetch(`${apiBase}/suda/posts`)
        .then((r) => r.json())
        .then((data) => {
          const items = Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
            ? data
            : []
          if (items.length > 0) {
            const mapped = items
              .filter((p: any) => !deletedSuda.has(p.id))
              .map((p: any) => {
                const rawNick = p.author?.nickname || p.author?.displayName || p.nickname || '모꼬이웃'
                const isAnonymousOrSelf = !rawNick || rawNick === '나 (이웃)' || rawNick === '나' || rawNick === '이웃'
                const normalizedNick = isAnonymousOrSelf ? '테스트01' : rawNick
                const normalizedAuthorId = p.author?.id || (p as any).authorId || (normalizedNick === '테스트01' ? 'u-tester-01' : 'u-tester-02')

                return {
                  id: p.id,
                  authorId: normalizedAuthorId,
                  nickname: normalizedNick,
                  avatar:
                    p.author?.avatarUrl ||
                    p.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
                  region: p.neighborhood || p.region || '역삼1동',
                  distance: typeof p.distanceKm === 'number' ? `${p.distanceKm}km` : p.distance || '0.8km',
                  time: p.createdAt
                    ? typeof p.createdAt === 'string' && p.createdAt.includes('분')
                      ? p.createdAt
                      : '최근'
                    : '방금 전',
                  title: p.title || p.content?.slice(0, 30) || '수다글',
                  content: p.content || '',
                  entryFee: Number(p.entryFee || 0),
                  category: p.category || '일상',
                  likes: Number(p.likesCount || p.likeCount || 0),
                  comments: Number(p.repliesCount || p.commentCount || 0),
                }
              })
            if (mapped.length > 0) {
              setSudaPosts((prev) => {
                const existingIds = new Set(mapped.map((m: any) => m.id))
                let customFromStorage: SudaPostItem[] = []
                try {
                  const raw = localStorage.getItem('mocco_custom_suda_rooms')
                  if (raw) {
                    const parsed = JSON.parse(raw)
                    if (Array.isArray(parsed)) {
                      customFromStorage = parsed.filter((p: any) => !deletedSuda.has(p.id))
                    }
                  }
                } catch {}
                const allCustom = [...customFromStorage, ...prev]
                const seenIds = new Set<string>()
                const userCreated: SudaPostItem[] = []
                allCustom.forEach((p) => {
                  if (!seenIds.has(p.id) && !deletedSuda.has(p.id)) {
                    if (p.id.startsWith('suda-room-') || p.id.startsWith('suda-post-') || !existingIds.has(p.id)) {
                      seenIds.add(p.id)
                      userCreated.push(p)
                    }
                  }
                })
                const remainingMapped = mapped.filter((m: any) => !seenIds.has(m.id))
                return [...userCreated, ...remainingMapped]
              })
            }
          }
        })
        .catch(() => {})
    }
  }, [chatSubTab])

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

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

  const removeCartItem = (id: string) => {
    const updated = cartItems.filter((item) => item.id !== id)
    setCartItems(updated)
    localStorage.setItem('mocco_cart', JSON.stringify(updated))
    toast({ title: '🗑️ 상품이 장바구니에서 삭제되었습니다.' })
  }

  // URL Query Params (?tab=MARKET&sub=C2C_USED, ?tab=CHAT&tradeId=...) Navigation Sync
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get('tab')
    const subParam = params.get('sub')
    const tradeIdParam = params.get('tradeId')

    if (tabParam && ['HOME', 'MARKET', 'LIVE', 'CHAT', 'MY'].includes(tabParam)) {
      setActiveTab(tabParam as ActiveTab)
    }
    if (subParam && ['C2C_USED', 'B2C_NORMAL', 'B2C_GROUP'].includes(subParam)) {
      setMarketSubTab(subParam as any)
    }

    const roomIdParam = params.get('roomId')
    if (roomIdParam) {
      setActiveTab('LIVE')
      getLiveRooms()
        .then((items) => {
          const found = items.find((r: any) => r.id === roomIdParam)
          if (found) {
            setActiveLiveModal({
              id: found.id,
              rank: 1,
              title: found.title || '모꼬 실시간 소통 라이브',
              category: found.category === 'talk' ? '일상/토크' : (found.category || '일상/토크'),
              hostNickname: found.host?.displayName || found.host?.nickname || found.host?.name || '호스트',
              hostAvatar: found.host?.avatarUrl || found.host?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
              viewerCount: Number(found.viewerCount || 0),
              coverUrl: found.coverUri || found.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
              hasCommerce: Boolean(found.hasCommerce || found.pinnedProduct || found.pinnedProductId),
              isOfficialCreator: Boolean(found.isOfficialCreator ?? true),
              pinnedProduct: found.pinnedProduct,
            })
          }
        })
        .catch(() => {})
    }

    // 중고물품 상세에서 [거래톡] 클릭하여 넘어온 경우
    if (tabParam === 'CHAT' && tradeIdParam) {
      setChatSubTab('CHATS')
      try {
        const stored = localStorage.getItem('mocco_active_trade_chat')
        if (stored) {
          const tradeInfo = JSON.parse(stored)
          const roomName = tradeInfo.seller || '판매자'
          const existing = chatRooms.find((r) => r.id === `trade-${tradeIdParam}` || r.productInfo?.id === tradeIdParam)
          if (existing) {
            setActiveChatRoom(existing)
          } else {
            const newTradeRoom: ChatRoomItem = {
              id: `trade-${tradeIdParam}`,
              type: 'MARKET',
              targetNickname: roomName,
              targetAvatar: tradeInfo.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
              lastMessage: `[거래톡] "${tradeInfo.title}" 중고물품 문의 및 안심거래 상담`,
              lastTime: '방금 전',
              unreadCount: 0,
              productInfo: {
                id: tradeInfo.id,
                title: tradeInfo.title,
                price: Number(tradeInfo.price) || 0,
                image: tradeInfo.image,
              },
              messages: [
                {
                  id: `trade-msg-init-${Date.now()}`,
                  senderId: 'seller',
                  senderNickname: roomName,
                  senderAvatar: tradeInfo.image,
                  text: `안녕하세요! "${tradeInfo.title}" 중고물품 판매자입니다. 직거래 약속 또는 상단의 [안전결제 요청]을 눌러 안전거래를 진행하세요.`,
                  time: '방금 전',
                  isMe: false,
                },
              ],
            }
            setChatRooms((prev) => [newTradeRoom, ...prev])
            setActiveChatRoom(newTradeRoom)
          }
        }
      } catch (err) {
        console.warn('Failed to setup active trade chat', err)
      }
    }
  }, [])

  // 5. Legal Policy Modal State
  const [legalModalOpen, setLegalModalOpen] = useState(false)
  const [selectedLegalSlug, setSelectedLegalSlug] = useState<keyof typeof LEGAL_DOCUMENTS>('privacy-policy')

  // 6. Modals
  // Live Viewer Modal
  const [activeLiveModal, setActiveLiveModal] = useState<LiveRoomItem | null>(null)

  // 🔴 라이브 방송 시작 모달 상태 (1:N 대중 / 1:1 프라이빗 & 상품 판매 연동)
  const [isStartLiveModalOpen, setIsStartLiveModalOpen] = useState(false)
  const [newLiveTitle, setNewLiveTitle] = useState('')
  const [newLiveCategory, setNewLiveCategory] = useState('일상/토크')
  const [newLiveBroadcastType, setNewLiveBroadcastType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC')
  const [newLiveEntryFee, setNewLiveEntryFee] = useState(0)
  const [newLivePinnedProduct, setNewLivePinnedProduct] = useState<LiveRoomItem['pinnedProduct'] | null>(null)
  const [liveProductPickerTab, setLiveProductPickerTab] = useState<'USED' | 'MERCHANT'>('USED')
  // Market Detail & Create Modals (통신판매 규정 준수 및 입점사 등록)
  const [selectedProductDetail, setSelectedProductDetail] = useState<MarketProductDetail | null>(null)
  const [isProductCreateModalOpen, setIsProductCreateModalOpen] = useState(false)
  const [editingMarketProduct, setEditingMarketProduct] = useState<MarketProductDetail | null>(null)
  // Mocco Point Payment & Charge Modal
  const [isPointChargeModalOpen, setIsPointChargeModalOpen] = useState(false)
  const [liveChatInput, setLiveChatInput] = useState('')
  const [liveChatMessages, setLiveChatMessages] = useState<LiveChatMessageItem[]>([
    { sender: '시스템', text: '모꼬(MOCCO) 실시간 라이브 방송에 오신 것을 환영합니다!', isSystem: true, time: '12:00' },
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
  const [adminGifts, setAdminGifts] = useState<MoccoChatGiftItem[]>(MOCCO_CHAT_GIFTS)

  // 관리자 등록 선물 목록 실시간 동기화
  useEffect(() => {
    getAdminGifts()
      .then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          const mapped: MoccoChatGiftItem[] = items.map((item) => ({
            id: item.id || item.code,
            name: item.name,
            description: item.description || '',
            pricePoints: item.pricePoints || item.points || item.amount || 1000,
            thumbnailUrl: item.thumbnailUrl,
            icon: item.icon || (item.animationType === 'GOLDEN_KING_MOCCO' ? '👑🪙' : item.animationType === 'CLOUD_CAR_MOCCO' ? '🚗🎉' : item.animationType === 'BLUSHING_MOCCO' ? '☁️💖' : '🎁'),
            category: item.category || 'all',
            animationType: item.animationType,
          }))
          setAdminGifts(mapped)
        }
      })
      .catch(() => {})
  }, [])
  const [isLiveMuted, setIsLiveMuted] = useState(false)
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; color: string; left: number }[]>([])
  const [isPinnedProductMinimized, setIsPinnedProductMinimized] = useState(false)
  const liveChatEndRef = useRef<HTMLDivElement>(null)
  const modalAgoraContainerRef = useRef<HTMLDivElement>(null)
  const modalAgoraClientRef = useRef<any>(null)
  const modalRemoteAudioTrackRef = useRef<any>(null)
  const modalRemoteVideoTrackRef = useRef<any>(null)
  const modalVideoRef = useRef<HTMLVideoElement>(null)
  const [isAgoraStreaming, setIsAgoraStreaming] = useState(false)
  const [isLiveEnded, setIsLiveEnded] = useState(false)
  const [liveEndedReason, setLiveEndedReason] = useState('')

  // ==========================================
  // 마이모꼬 (MY) 모바일 완전 동기화 상태들
  // ==========================================
  const [sellerRevenue, setSellerRevenue] = useState(185000)
  const [userNickname, setUserNickname] = useState(user?.nickname || '모꼬이웃')
  const [userAge, setUserAge] = useState(26)
  const [userGender, setUserGender] = useState<'여' | '남'>('여')
  const [userHeadline, setUserHeadline] = useState('이웃들과 따뜻하고 즐거운 소통 나누고 싶어요')
  const [userBio, setUserBio] = useState('')
  const [userRegion1, setUserRegion1] = useState('서울특별시')
  const [userRegion2, setUserRegion2] = useState('강남구')
  const [userInterests, setUserInterests] = useState<string[]>(['맛집탐방', '카페투어', '영화감상'])
  const [profileInterestInput, setProfileInterestInput] = useState('')
  const [chatRoomRate, setChatRoomRate] = useState(300)
  const [videoCallRate, setVideoCallRate] = useState(1000)
  const [notifyChat, setNotifyChat] = useState(true)
  const [notifyLive, setNotifyLive] = useState(true)
  const [notifyNightLimit, setNotifyNightLimit] = useState(false)
  const [cacheSize, setCacheSize] = useState('24.5 MB')
  const [blockedUsers, setBlockedUsers] = useState(['광고스팸러99', '불량유저01'])

  // 마이모꼬 모달 상태
  // 팔로워 / 팔로잉 모달 상태
  const [isFollowsModalOpen, setIsFollowsModalOpen] = useState(false)
  const [followsActiveTab, setFollowsActiveTab] = useState<'followers' | 'following'>('followers')
  const [followsSearchQuery, setFollowsSearchQuery] = useState('')
  const [followersList, setFollowersList] = useState<FollowUserItem[]>(INITIAL_FOLLOWERS)
  const [followingList, setFollowingList] = useState<FollowUserItem[]>(INITIAL_FOLLOWING)

  // 상대방 프로필 팝업 모달 상태
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false)
  const [profileActivePhotoIdx, setProfileActivePhotoIdx] = useState(0)
  const [selectedUserProfile, setSelectedUserProfile] = useState<FollowUserItem | null>(null)


  // 프로필 사진 9장 자동 롤링 (사진이 2장 이상일 때 3.5초마다 전환)
  useEffect(() => {
    if (!isUserProfileModalOpen || !selectedUserProfile?.photos || selectedUserProfile.photos.length <= 1) {
      return
    }
    const timer = setInterval(() => {
      setProfileActivePhotoIdx((prev) =>
        prev < (selectedUserProfile.photos?.length || 1) - 1 ? prev + 1 : 0
      )
    }, 3500)
    return () => clearInterval(timer)
  }, [isUserProfileModalOpen, selectedUserProfile?.photos])
  
  // 🎵 웹 브라우저 "모꼬" 알림음 합성 재생 (카톡 알림음처럼 산뜻한 2단계 차임벨)
  const playMoccoSoundWeb = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }
      const now = ctx.currentTime

      // 1음 "모~" (포근한 트라이앵글파 E5 659Hz -> G5 784Hz)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'triangle'
      osc1.frequency.setValueAtTime(659.25, now)
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.12)
      gain1.gain.setValueAtTime(0.001, now)
      gain1.gain.exponentialRampToValueAtTime(0.28, now + 0.03)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.2)

      // 2음 "꼬!" (청아한 사인파 벨소리 C6 1046.5Hz 딩동~)
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(1046.5, now + 0.14)
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.18)
      gain2.gain.setValueAtTime(0.001, now + 0.14)
      gain2.gain.exponentialRampToValueAtTime(0.35, now + 0.16)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + 0.14)
      osc2.stop(now + 0.8)
    } catch (err) {
      console.warn('Failed to play web Mocco sound:', err)
    }
  }, [])

  // 유저 단가 및 입장료 동기화
  useEffect(() => {
    if (user?.chatEntryFee !== undefined && user.chatEntryFee !== null) {
      setChatRoomRate(Number(user.chatEntryFee))
      setNewRoomEntryFee(Number(user.chatEntryFee))
    }
    if (user?.liveEntryFee !== undefined && user.liveEntryFee !== null) {
      setVideoCallRate(Number(user.liveEntryFee))
    }
  }, [user?.chatEntryFee, user?.liveEntryFee])

  // 실시간 웹소켓(Socket.io) 수다 & 1:1 채팅 & "모꼬" 알림 동기화
  const socketRef = useRef<any>(null)
  const activeChatRoomRef = useRef<ChatRoomItem | null>(null)
  const chatRoomsRef = useRef<ChatRoomItem[]>([])
  const mySentMessageIdsRef = useRef<Set<string>>(new Set())
  const receivedMessageIdsRef = useRef<Set<string>>(new Set())
  activeChatRoomRef.current = activeChatRoom
  chatRoomsRef.current = chatRooms

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/v1', '') || 'https://tok-friends-api.onrender.com'
    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      query: {
        userId: user?.id || 'guest',
        nickname: user?.nickname || '게스트',
      },
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Web socket connected to MOCCO server:', socket.id)
      socket.emit('connected', { userId: user?.id, nickname: user?.nickname })
      if (user?.id) {
        socket.emit('chat:join', { userId: user.id })
      }
      if (user?.nickname) {
        socket.emit('chat:join', { nickname: user.nickname })
      }
    })

    // 1) 실시간 수다방/수다글 등록 브로드캐스트
    socket.on('suda:new_post', (post: any) => {
      if (!post) return
      const mappedPost: SudaPostItem = {
        id: post.id || 'suda-' + Date.now(),
        nickname: post.authorNickname || post.author?.nickname || post.nickname || '모꼬이웃',
        avatar: post.authorAvatar || post.author?.avatarUrl || post.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        region: post.neighborhood || post.region || '역삼1동',
        title: post.title || post.content?.slice(0, 30) || '새로운 수다글',
        content: post.content || '',
        entryFee: post.entryFee ?? 0,
        category: post.category || '일상',
        time: '방금 전',
        likes: post.likeCount ?? 0,
        comments: post.commentCount ?? 0,
      }
      setSudaPosts((prev) => {
        if (prev.some((p) => p.id === mappedPost.id || (p.nickname === mappedPost.nickname && p.title === mappedPost.title && p.content === mappedPost.content))) return prev
        return [mappedPost, ...prev]
      })
    })

    // 1-1) 실시간 수다방 삭제 브로드캐스트 수신
    socket.on('suda:delete_post', (data: any) => {
      const postId = typeof data === 'string' ? data : (data?.id || data?.postId)
      if (postId) {
        setSudaPosts((prev) => prev.filter((p) => p.id !== postId))
      }
    })
    socket.on('suda:deleted', (data: any) => {
      const postId = typeof data === 'string' ? data : (data?.id || data?.postId)
      if (postId) {
        setSudaPosts((prev) => prev.filter((p) => p.id !== postId))
      }
    })

    // 2) 실시간 1:1 채팅 도착 알림 ("모꼬" 사운드 + 팝업 배너)
    socket.on('chat:incoming', (data: any) => {
      if (!data) return

      const senderName = data.senderNickname || data.sender?.nickname || '모꼬이웃'
      const senderId = data.senderId || data.sender?.id
      const rawText = data.content || data.text || data.message || ''
      const previewText = data.type === 'gift' || data.backendType === 'gift'
        ? `🎁 [선물 도착] ${data.gift?.name || '3D 선물'}`
        : (rawText || '새로운 메시지가 도착했습니다.')

      // 🛡️ 내가 보낸 메시지의 에코 브로드캐스트인 경우 무시 (상대방 글로 복사되는 버그 완전 방지)
      const isMyMessage =
        (senderId && (senderId === user?.id || senderId === 'me')) ||
        (user?.nickname && senderName === user.nickname)
      if (isMyMessage) return

      const targetRoomId = data.chatId || data.roomId
      const deletedChats = getDeletedChatIds()
      if (targetRoomId && deletedChats.has(targetRoomId)) return

      // 현재 해당 대화방을 보고 있는 중이면 토스트 생략 (chat:message에서 실시간 표시)
      const isAlreadyInRoom = Boolean(
        activeChatRoomRef.current &&
          (activeChatRoomRef.current.id === targetRoomId ||
            activeChatRoomRef.current.targetNickname === senderName)
      )

      if (!isAlreadyInRoom) {
        playMoccoSoundWeb()
        toast({
          title: `🐱 모꼬! ${senderName}님의 새 메시지`,
          description: previewText,
          action: (
            <ToastAction
              altText="채팅방 입장"
              onClick={() => {
                if (targetRoomId) {
                  const targetRoom = chatRoomsRef.current.find((r) => r.id === targetRoomId || r.targetNickname === senderName)
                  if (targetRoom) {
                    setActiveChatRoom(targetRoom)
                  } else {
                    const newRoom: ChatRoomItem = {
                      id: targetRoomId,
                      type: 'SUDA',
                      targetNickname: senderName,
                      targetAvatar: data.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
                      lastMessage: previewText,
                      lastTime: '방금',
                      unreadCount: 0,
                      messages: [
                        {
                          id: data.id || 'msg-' + Date.now(),
                          senderId: data.senderId || 'target',
                          senderNickname: senderName,
                          text: previewText,
                          time: '방금',
                        },
                      ],
                    }
                    setChatRooms((prev) => [newRoom, ...prev])
                    setActiveChatRoom(newRoom)
                  }
                }
              }}
            >
              대화하기
            </ToastAction>
          ),
        })
      }
    })

    // 2-1) 실시간 읽음 처리 (상대방이 읽었을 때 내 메시지의 '1' 즉시 제거)
    socket.on('chat:read', (data: any) => {
      if (!data || !data.chatId) return
      const isMatch = (roomId?: string, targetNick?: string) => {
        if (!roomId && !targetNick) return false
        return (
          roomId === data.chatId ||
          (data.chatId && roomId && (roomId.includes(data.chatId) || data.chatId.includes(roomId))) ||
          (targetNick && (targetNick === data.readerId || targetNick === data.readerAccountId || targetNick === data.readerNickname))
        )
      }

      if (activeChatRoomRef.current && isMatch(activeChatRoomRef.current.id, activeChatRoomRef.current.targetNickname)) {
        setActiveChatRoom((prev) => {
          if (!prev) return null
          return {
            ...prev,
            messages: prev.messages.map((m) => (m.isMe ? { ...m, unread: false } : m)),
          }
        })
      }

      setChatRooms((prev) =>
        prev.map((r) => {
          if (isMatch(r.id, r.targetNickname)) {
            return {
              ...r,
              messages: (r.messages || []).map((m) => (m.isMe ? { ...m, unread: false } : m)),
            }
          }
          return r
        })
      )
    })

    // 2-B) 상대방이 1:1 대화방 나가기 시 실시간 방 종료 동기화
    socket.on('chat:room_deleted', (data: any) => {
      const deletedId = data?.chatId || data?.id
      if (!deletedId) return
      setChatRooms((prev) => prev.filter((r) => r.id !== deletedId))
      setActiveChatRoom((prev) => {
        if (prev && prev.id === deletedId) {
          toast({
            title: '🚪 대화방 종료',
            description: '대화 상대방이 퇴장하여 1:1 대화방이 종료되었습니다.',
          })
          return null
        }
        return prev
      })
    })

    // 2-C) 관리자 경고장 실시간 수신 안내 팝업
    socket.on('chat:admin_warning', (data: any) => {
      playMoccoSoundWeb()
      toast({
        title: '⚠️ [관리자 주의 경고장 발송]',
        description: data?.message || '외부 메신저 유도 및 금칙어 사용이 감지되었습니다. 건전한 대화 문화를 준수해 주세요.',
        variant: 'destructive',
      })
    })

    // 2-D) 관리자 계정 제한 실시간 통보
    socket.on('chat:user_restricted', (data: any) => {
      playMoccoSoundWeb()
      toast({
        title: '🚫 [운영자 이용 제재 조치]',
        description: data?.message || '운영 정책 위반으로 인해 1:1 대화 기능이 제한되었습니다.',
        variant: 'destructive',
      })
    })

    // 3) 같은 방 참가자 간 메시지 수신 (웹 본인 메시지 에코/복제 방지 및 선물 수신 완벽 처리)
    socket.on('chat:message', (data: any) => {
      if (!data) return
      const senderId = data.senderAccountId || data.senderId || data.sender?.id
      const senderName = data.senderName || data.senderNickname || data.sender?.nickname || '상대방'
      const isSystem = data.type === 'system' || senderId === 'system' || senderName === '시스템' || String(data.content || '').startsWith('⚠️ [관리자 경고') || String(data.content || '').startsWith('🚫 [제재') || String(data.content || '').startsWith('⛔ [영구 정지') || String(data.content || '').startsWith('🟢 [안전 확인')

      // 메시지 중복 수신 원천 차단 (최근 수신 키 캐시 검사)
      const msgDedupeKey = String(data.id || data.clientMessageId || `${data.chatId}_${senderName}_${data.content}`)
      if (receivedMessageIdsRef.current.has(msgDedupeKey)) {
        return
      }
      receivedMessageIdsRef.current.add(msgDedupeKey)
      if (receivedMessageIdsRef.current.size > 500) {
        const first = receivedMessageIdsRef.current.values().next().value
        if (first) receivedMessageIdsRef.current.delete(first)
      }

      // 내가 보낸 메시지인지 엄격히 검증 (시스템 메시지는 통과)
      if (!isSystem) {
        const isMyMessage =
          (data.clientMessageId && mySentMessageIdsRef.current.has(data.clientMessageId)) ||
          (data.id && mySentMessageIdsRef.current.has(data.id)) ||
          (user?.id && (senderId === user.id || data.senderAccountId === user.id || data.senderId === user.id)) ||
          senderId === 'u-tester-02' ||
          senderId === 'admin_super_user' ||
          senderName === '테스터02' ||
          senderName === 'Super Admin' ||
          senderName === 'admin' ||
          (user?.nickname && (senderName === user.nickname || data.senderName === user.nickname || data.senderNickname === user.nickname)) ||
          (data.sender?.nickname && user?.nickname && data.sender.nickname === user.nickname)

        if (isMyMessage) return

        // 활성 대화방에서 상대방이 보낸 메시지인지 엄격 확인 (내가 아닌 상대방 메시지만 수신)
        if (activeChatRoomRef.current) {
          const isTargetMatch =
            senderName === activeChatRoomRef.current.targetNickname ||
            (activeChatRoomRef.current.targetUserId && (senderId === activeChatRoomRef.current.targetUserId || data.senderAccountId === activeChatRoomRef.current.targetUserId))
          if (!isTargetMatch && (senderName === user?.nickname || senderId === user?.id || senderId === 'me' || senderName === '테스터02' || senderName === 'Super Admin')) {
            return
          }
        }
      }

      playMoccoSoundWeb()

      const isGift = data.type === 'gift' || data.backendType === 'gift' || Boolean(data.gift)
      const rawMsgContent = typeof data.content === 'string' ? data.content : (typeof data.text === 'string' ? data.text : '')
      const isMedia =
        data.type === 'media' ||
        data.type === 'image' ||
        data.type === 'IMAGE' ||
        data.backendType === 'media' ||
        data.backendType === 'image' ||
        Boolean(data.media) ||
        (typeof rawMsgContent === 'string' &&
          (rawMsgContent.includes('/media/files/') ||
            rawMsgContent.startsWith('data:image/') ||
            /\.(jpeg|jpg|png|gif|webp|mp4|mov)(\?.*)?$/i.test(rawMsgContent)))
      const giftData = isGift ? (data.gift || {
        id: data.giftId || 'gift',
        name: data.giftName || '선물',
        amount: Number(data.giftPoints || data.points || 0),
        description: data.content || '선물을 받았습니다 ✨',
        icon: data.icon || data.giftIcon || '🎁',
      }) : undefined
      const mediaUri = data.media?.uri || (isMedia ? rawMsgContent : undefined)
      const mediaData = isMedia && mediaUri ? { uri: mediaUri } : undefined

      const newMsg: ChatMessageItem = {
        id: data.id || 'msg-' + Date.now(),
        senderId: isSystem ? 'system' : (senderId || 'target'),
        senderNickname: isSystem ? '시스템' : senderName,
        text: isMedia ? '[사진]' : (data.content || data.text || ''),
        time: '방금',
        isMe: false,
        type: isSystem ? 'system' : (isMedia ? 'media' : (isGift ? 'gift' : 'text')),
        media: mediaData,
        gift: giftData,
      }

      const isCurrentActive = Boolean(
        activeChatRoomRef.current &&
          (activeChatRoomRef.current.id === data.chatId ||
            data.chatId?.includes(activeChatRoomRef.current.targetNickname) ||
            activeChatRoomRef.current.targetNickname === senderName ||
            isSystem)
      )

      if (isCurrentActive && activeChatRoomRef.current) {
        if (!isSystem) {
          // 상대방이 새 메시지를 보냈으므로 내 기존 메시지들의 '1' 즉시 삭제 및 읽음 이벤트 전송
          socket.emit('chat:read', {
            chatId: data.chatId || activeChatRoomRef.current.id,
            readerId: user?.id,
            readerAccountId: user?.id,
          });
          fetch('/api/v1/chats/' + (data.chatId || activeChatRoomRef.current.id) + '/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user?.id, readerId: user?.id }),
          }).catch(() => {});
        }

        setActiveChatRoom((prev) => {
          if (!prev) return null
          // 이미 추가된 동일 ID 또는 동일 텍스트 메시지 중복 완벽 방지
          if (
            prev.messages.some(
              (m) =>
                (m.id && m.id === newMsg.id) ||
                (m.text === newMsg.text && m.senderNickname === newMsg.senderNickname && m.isMe === newMsg.isMe)
            )
          ) {
            return prev
          }
          return {
            ...prev,
            lastMessage: isGift ? `🎁 ${newMsg.gift?.name || '선물'}을 받았습니다!` : (isMedia ? '📷 사진' : newMsg.text),
            lastTime: '방금',
            messages: [...prev.messages.map((m) => (m.isMe ? { ...m, unread: false } : m)), newMsg],
          }
        })

        // 선물 수신 시 3D 이펙트 웹 화면에도 발동
        if (isGift && newMsg.gift) {
          setActiveGiftEffect({
            name: newMsg.gift.name,
            icon: newMsg.gift.icon || '🎁',
            text: `${senderName}님이 ${newMsg.gift.name}을 선물하셨습니다!`,
          })
          setTimeout(() => {
            setActiveGiftEffect(null)
          }, 3500)
        }
      }

      // 🌟 활성 방이든 아니든, 대화함 목록(chatRooms)의 해당 방에 메시지와 unreadCount를 즉시 동기화!
      setChatRooms((prev) => {
        let roomFound = false;
        const updated = prev.map((r) => {
          if (r.id === data.chatId || r.targetNickname === senderName) {
            roomFound = true;
            const existingMessages = r.messages || [];
            const msgExists = existingMessages.some((m) => m.id === newMsg.id);
            const nextMessages = msgExists ? existingMessages : [...existingMessages, newMsg];
            return {
              ...r,
              lastMessage: isGift ? `🎁 ${newMsg.gift?.name || '선물'}을 받았습니다!` : (isMedia ? '📷 사진' : newMsg.text),
              lastTime: '방금',
              unreadCount: isCurrentActive ? 0 : nextMessages.filter((m) => !m.isMe && m.unread !== false).length,
              messages: nextMessages,
            };
          }
          return r;
        });

        if (!roomFound && data.chatId) {
          // 목록에 없던 새로운 상대방의 메시지인 경우 방을 새로 생성하여 맨 위에 등록
          const brandNewRoom: ChatRoomItem = {
            id: data.chatId,
            type: 'SUDA',
            targetNickname: senderName,
            targetAvatar: data.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
            lastMessage: isGift ? `🎁 ${newMsg.gift?.name || '선물'}을 받았습니다!` : (isMedia ? '📷 사진' : newMsg.text),
            lastTime: '방금',
            unreadCount: isCurrentActive ? 0 : 1,
            messages: [newMsg],
          };
          const finalList = [brandNewRoom, ...prev];
          try {
            localStorage.setItem('mocco_custom_chat_rooms', JSON.stringify(finalList));
          } catch (e) {}
          return finalList;
        }

        try {
          localStorage.setItem('mocco_custom_chat_rooms', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    })

    return () => {
      socket.disconnect()
    }
  }, [user?.id, user?.nickname, playMoccoSoundWeb, toast])
  

  // 상대방 프로필 팝업 열기 헬퍼 함수
  const openUserProfileModal = (user: any) => {
    const isAlreadyFollowing = followingList.some(
      (f) => f.nickname === user.nickname || (user.id && f.id === user.id)
    )
    setSelectedUserProfile({
      id: user.id || 'u-' + Date.now(),
      nickname: user.nickname || user.name || '모꼬이웃',
      avatar: user.avatar || user.avatarUrl || user.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
      region: user.region || user.location || user.locationName || '서울 강남구 역삼동',
      gender: user.gender || '여',
      age: user.age || 26,
      mannerTemp: user.mannerTemp || 36.5,
      headline: user.headline || user.statusMessage || user.intro || '이웃들과 따뜻하고 즐거운 소통 나누고 싶어요 ✨',
      followersCount: user.followersCount || 128,
      followingCount: user.followingCount || 42,
      isOnline: user.isOnline ?? true,
      isLive: Boolean(user.isLive),
      liveTitle: user.liveTitle || '실시간 라이브 소통 🎙️',
      isFollowing: isAlreadyFollowing,
      interests: Array.isArray(user.interests) && user.interests.length > 0
        ? user.interests
        : ['가벼운산책', '카페투어', '중고거래', '소통'],
    })
    setIsUserProfileModalOpen(true)
  }

  // 1:1 대화 시작 범용 헬퍼 (채팅방 자동 생성 및 CHAT 탭 연결)
  const handleStartDirectChat = async (target: {
    id?: string
    nickname: string
    avatar: string
    region?: string
    intro?: string
  }) => {
    requireAuth(async () => {
      let resolvedRoomId = 'chat-u-' + (target.id || Date.now())
      const isAdmUser = !user?.nickname || ['super admin', 'admin', 'admin_super_user', '관리자', '슈퍼어드민'].includes(String(user.nickname).trim().toLowerCase())
      const effectiveSenderNick = isAdmUser ? '테스터02' : user.nickname
      const effectiveSenderId = isAdmUser ? 'u-tester-02' : (user?.id || 'u-tester-02')

      try {
        const serverRoom = await createDirectChat(target.id || target.nickname, target.nickname, 0, {
          targetNickname: target.nickname,
          senderNickname: effectiveSenderNick,
          senderAccountId: effectiveSenderId,
          userId: effectiveSenderId,
        })
        if (serverRoom?.id) {
          resolvedRoomId = serverRoom.id
        }
      } catch (err) {
        console.warn('createDirectChat error:', err)
      }

      const existing = chatRooms.find((r) => r.id === resolvedRoomId || r.targetNickname === target.nickname)
      if (existing) {
        setActiveChatRoom(existing)
        // 서버로부터 최신 대화 내역 즉시 동기화
        getChatMessages(existing.id).then((serverMsgs) => {
          if (Array.isArray(serverMsgs) && serverMsgs.length > 0) {
            const mapped = serverMsgs
              .filter((m: any) => m && m.content)
              .map((m: any) => {
                const isAdmUser = !user?.nickname || ['super admin', 'admin', 'admin_super_user', '관리자', '슈퍼어드민'].includes(String(user.nickname).trim().toLowerCase())
                const myNick = isAdmUser ? '테스터02' : user?.nickname
                const myId = isAdmUser ? 'u-tester-02' : user?.id
                const isMe = Boolean(
                  (myId && (m.senderAccountId === myId || m.senderId === myId)) ||
                  (myNick && (m.senderName === myNick || m.senderNickname === myNick)) ||
                  (user?.id && (m.senderAccountId === user.id || m.senderId === user.id)) ||
                  (user?.nickname && (m.senderName === user.nickname || m.senderNickname === user.nickname))
                )
                const rawContent = m.content || m.text || ''
                const isMediaMsg =
                  m.type === 'media' ||
                  m.type === 'image' ||
                  (typeof rawContent === 'string' &&
                    (rawContent.includes('/media/files/') ||
                      rawContent.startsWith('data:image/') ||
                      /\.(jpeg|jpg|png|gif|webp)(\?.*)?$/i.test(rawContent)))
                return {
                  id: m.id || 'msg-' + Math.random().toString(36).slice(2, 7),
                  senderId: isMe ? 'me' : 'target',
                  senderNickname: m.senderName || m.senderNickname || target.nickname,
                  text: rawContent,
                  time: m.createdAt
                    ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '방금',
                  isMe,
                  unread: isMe ? !m.readAt : false,
                  type: isMediaMsg ? 'media' : (m.type || 'text'),
                  media: isMediaMsg ? { uri: rawContent } : undefined,
                }
              })
            setActiveChatRoom((prev) => (prev && prev.id === existing.id ? { ...prev, messages: mapped } : prev))
            setChatRooms((prev) => prev.map((r) => (r.id === existing.id ? { ...r, messages: mapped } : r)))
          }
        }).catch(() => {})
      } else {
        const newRoom: ChatRoomItem = {
          id: resolvedRoomId,
          type: 'SUDA',
          targetNickname: target.nickname,
          targetAvatar: target.avatar,
          lastMessage: target.intro || `안녕하세요! ${target.nickname}님 반가워요 ✨`,
          lastTime: '방금',
          unreadCount: 0,
          messages: [
            {
              id: 'init-msg-1',
              senderId: 'target',
              senderNickname: target.nickname,
              text: `안녕하세요! ${target.region ? target.region + '에 사는 ' : ''}${target.nickname}입니다. 반가워요! ✨`,
              time: '방금',
            },
          ],
        }
        const updatedList = [newRoom, ...chatRooms.filter((r) => r.id !== newRoom.id)]
        setChatRooms(updatedList)
        try {
          localStorage.setItem('mocco_custom_chat_rooms', JSON.stringify(updatedList))
        } catch (e) {}
        setActiveChatRoom(newRoom)
      }
      setIsUserProfileModalOpen(false)
      setIsFollowsModalOpen(false)
      setActiveTab('CHAT')
      setChatSubTab('CHATS')
      toast({
        title: '💬 1:1 대화방 연결',
        description: `${target.nickname} 님과의 대화방으로 이동했습니다.`,
      })
    })
  }

  // 팔로우 토글 핸들러
  const handleToggleFollow = (targetUser: FollowUserItem) => {
    requireAuth(() => {
      const isAlreadyFollowing = followingList.some((f) => f.nickname === targetUser.nickname)
      if (isAlreadyFollowing) {
        // 언팔로우
        setFollowingList((prev) => prev.filter((f) => f.nickname !== targetUser.nickname))
        // 팔로워 목록 내의 isFollowing 플래그도 갱신
        setFollowersList((prev) =>
          prev.map((f) => (f.nickname === targetUser.nickname ? { ...f, isFollowing: false } : f))
        )
        if (selectedUserProfile && selectedUserProfile.nickname === targetUser.nickname) {
          setSelectedUserProfile({ ...selectedUserProfile, isFollowing: false })
        }
        toast({
          title: '팔로우 취소',
          description: `${targetUser.nickname} 님의 팔로우를 취소했습니다.`,
        })
      } else {
        // 팔로우 추가
        const updatedTarget = { ...targetUser, isFollowing: true }
        setFollowingList((prev) => [updatedTarget, ...prev])
        setFollowersList((prev) =>
          prev.map((f) => (f.nickname === targetUser.nickname ? { ...f, isFollowing: true } : f))
        )
        if (selectedUserProfile && selectedUserProfile.nickname === targetUser.nickname) {
          setSelectedUserProfile({ ...selectedUserProfile, isFollowing: true })
        }
        toast({
          title: '✨ 팔로우 완료',
          description: `${targetUser.nickname} 님을 팔로우했습니다!`,
        })
      }
    })
  }

  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false)
  const [isRateSettingOpen, setIsRateSettingOpen] = useState(false)
  const [isNotifySettingOpen, setIsNotifySettingOpen] = useState(false)
  const [isBlockedUsersOpen, setIsBlockedUsersOpen] = useState(false)
  const [isWithdrawAccountOpen, setIsWithdrawAccountOpen] = useState(false)
  const [isSafetyCenterOpen, setIsSafetyCenterOpen] = useState(false)
  const [isCustomerInquiryOpen, setIsCustomerInquiryOpen] = useState(false)
  const [isRewardAdOpen, setIsRewardAdOpen] = useState(false)
  const [rewardAdCountdown, setRewardAdCountdown] = useState(3)
  const [myTradeTab, setMyTradeTab] = useState<'CART' | 'WISHLIST' | 'SALES' | 'ORDERS'>('CART')

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
  const [myWishlist, setMyWishlist] = useState<Array<any>>([
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

    // localStorage의 mocco_wishlist 실시간 연동
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('mocco_wishlist') || '[]')
        if (Array.isArray(stored) && stored.length > 0) {
          setMyWishlist((prev) => {
            const ids = new Set(stored.map((s: any) => s.id))
            const filteredPrev = prev.filter((p) => !ids.has(p.id))
            return [...stored, ...filteredPrev]
          })
        }
      } catch (e) {
        console.warn('Failed to load mocco_wishlist', e)
      }
    }
  }, [])

  const [myOrdersList, setMyOrdersList] = useState([
    {
      id: 'ord-101',
      orderNumber: 'ORD-20261104-5892',
      title: '소니 WH-1000XM5 노이즈캔슬링 무선 헤드폰',
      price: 320000,
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400',
      status: 'SHIPPED',
      statusText: '배송중 (익일 도착 예정)',
      date: '2026-11-04',
      seller: '(주)사운드코리아 공식수입원',
      courier: 'CJ대한통운',
      trackingNumber: '5892-0192-4411',
      selectedOption: '실버 / 무상보증 1년',
      autoConfirmDays: 5,
    },
    {
      id: 'ord-102',
      orderNumber: 'ORD-20261103-1024',
      title: '[입점사특가] 제주 산지직송 프리미엄 1등급 흑돼지 오겹살 1kg',
      price: 32900,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
      status: 'DELIVERED',
      statusText: '배송완료 (구매확정 대기)',
      date: '2026-11-03',
      seller: '제주푸드 본사 직영',
      courier: '우체국택배',
      trackingNumber: '6891-2200-9182',
      selectedOption: '오겹살 1kg (+14,000원)',
      autoConfirmDays: 3,
    },
    {
      id: 'ord-103',
      orderNumber: 'ORD-20261028-7712',
      title: '고순도 프리미엄 알티지 오메가3 120캡슐 (4개월분)',
      price: 42000,
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
      status: 'COMPLETED',
      statusText: '구매확정 완료 (정산지급)',
      date: '2026-10-28',
      seller: '메디컬 헬스케어랩',
      courier: '한진택배',
      trackingNumber: '4012-9812-3341',
      selectedOption: '단일 규격',
      autoConfirmDays: 0,
    },
  ])

  // Phase 2: 실시간 배송조회 & 구매확정 & 리뷰 & 반품 CS 모달 상태
  const [trackingModalOrder, setTrackingModalOrder] = useState<any | null>(null)
  const [confirmModalOrder, setConfirmModalOrder] = useState<any | null>(null)
  const [reviewModalOrder, setReviewModalOrder] = useState<any | null>(null)
  const [reviewRating, setReviewRating] = useState<number>(5)
  const [reviewComment, setReviewComment] = useState<string>('')
  const [selectedReviewTags, setSelectedReviewTags] = useState<string[]>(['배송이 빨라요 ⚡', '상품이 신선해요 🥗'])
  const [returnModalOrder, setReturnModalOrder] = useState<any | null>(null)
  const [returnReason, setReturnReason] = useState<string>('DEFECT')
  const [returnDetailText, setReturnDetailText] = useState<string>('')

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
  const [newUsedAllowLive, setNewUsedAllowLive] = useState(true)

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

    // Helper: Map MarketProductItem or UsedProductItem to MarketProductDetail (통신판매 규정 고시 지원)
  const mapItemToDetail = (item: MarketProductItem | UsedProductItem | any): MarketProductDetail => {
    const isUsed = !('type' in item) || item.type === 'C2C_USED'
    const productType: 'C2C_USED' | 'B2C_NORMAL' | 'B2C_GROUP' = isUsed 
      ? 'C2C_USED' 
      : (item.type || 'B2C_NORMAL')

    return {
      id: item.id,
      name: item.title,
      category: item.category,
      type: productType,
      price: item.price,
      originalPrice: item.originalPrice,
      images: item.images && item.images.length > 0 ? item.images : ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'],
      description: item.description || `${item.title}에 대한 상세 설명입니다. 대한민국 전자상거래법 및 모꼬 안심 에스크로 100% 안전결제로 보호되는 정품/안심 상품입니다.`,
      stock: item.stock || (isUsed ? 1 : 50),
      shippingFee: item.shippingFee ?? 3000,
      isFreeShipping: item.shippingFee === 0 || item.price >= 50000,
      freeShippingThreshold: 50000,
      merchantInfo: isUsed ? undefined : {
        businessName: item.sellerName || '(주)모꼬 공식인증 파트너',
        representative: '김대표',
        businessNumber: '214-88-90123',
        onlineOrderNumber: '제2026-서울강남-0912호',
        address: '서울특별시 강남구 테헤란로 152 강남파이낸스센터 18층',
        contactPhone: '1588-0923',
        customerServiceHours: '평일 09:30 ~ 18:00 (주말/공휴일 휴무)',
      },
      noticeInfo: isUsed ? undefined : {
        itemModelName: item.title,
        certification: '식품위생법 검사 적합 / KC 안전인증 완료',
        origin: '대한민국 (국산 100%)',
        manufacturer: item.sellerName || '모꼬 제휴 생산자 직영라인',
        expirationDate: '제조일로부터 12개월 (포장별도표기)',
        asContact: '1588-0923 또는 모꼬 1:1 안심톡 문의',
      },
      shippingInfo: {
        courierName: 'CJ대한통운 / 우체국택배 안심특송',
        deliveryDays: '오후 2시 이전 결제 완료 시 당일 출발 (평균 1~2일 소요)',
        returnFee: 3000,
        exchangeFee: 6000,
        returnAddress: '경기도 이천시 물류센터로 45 모꼬안심물류센터 B동 3호',
        nonReturnableReasons: [
          '소비자의 책임 있는 사유로 상품 등이 멸실 또는 훼손된 경우',
          '소비자의 사용 또는 일부 소비로 상품의 가치가 현저히 감소한 경우',
          '시간의 경과에 의하여 재판매가 곤란할 정도로 상품의 가치가 현저히 감소한 경우 (신선식품 등)',
          '복제가 가능한 상품 등의 포장을 훼손한 경우',
        ],
      },
      usedCondition: isUsed ? 'S' : undefined,
      isLiveSellLinked: isUsed ? true : undefined,
      sellerNickname: item.sellerNickname || item.sellerName || '모꼬 이웃',
      sellerAvatar: item.sellerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
      sellerLocation: item.locationName || item.location || '모꼬 지역인증 완료',
    }
  }

  // Handle Create Product Submit
  // Handle Create & Edit Product Submit
  const handleCreateProductSubmit = (payload: CreateProductPayload, editProductId?: string) => {
    // ✏️ 수정 모드인 경우 (Edit Mode)
    if (editProductId) {
      if (payload.type === 'C2C_USED') {
        setUsedProducts((prev) =>
          prev.map((item) =>
            item.id === editProductId
              ? {
                  ...item,
                  title: payload.name,
                  description: payload.description,
                  price: payload.price,
                  category: payload.category,
                  images: payload.images,
                }
              : item
          )
        )
      } else {
        setMarketProducts((prev) =>
          prev.map((item) =>
            item.id === editProductId
              ? {
                  ...item,
                  title: payload.name,
                  category: payload.category,
                  type: payload.type as 'B2C_NORMAL' | 'B2C_GROUP',
                  price: payload.price,
                  originalPrice: payload.originalPrice,
                  images: payload.images,
                  description: payload.description,
                  stock: payload.stock,
                  shippingFee: payload.shippingFee,
                  detailImages: payload.detailImages,
                  detailNotice: payload.detailNotice,
                  manufacturer: payload.manufacturer,
                  origin: payload.origin,
                  csPhone: payload.csPhone,
                }
              : item
          )
        )

        // LocalStorage 동기화
        try {
          const stored = localStorage.getItem('mocco_custom_products')
          if (stored) {
            const list = JSON.parse(stored)
            const updated = list.map((item: any) =>
              item.id === editProductId
                ? {
                    ...item,
                    title: payload.name,
                    category: payload.category,
                    price: payload.price,
                    originalPrice: payload.originalPrice,
                    images: payload.images,
                    description: payload.description,
                    stock: payload.stock,
                    shippingFee: payload.shippingFee,
                    detailImages: payload.detailImages,
                    detailNotice: payload.detailNotice,
                    manufacturer: payload.manufacturer,
                    origin: payload.origin,
                    csPhone: payload.csPhone,
                  }
                : item
            )
            localStorage.setItem('mocco_custom_products', JSON.stringify(updated))
          }
        } catch (err) {
          console.error('Failed to sync updated product to localStorage:', err)
        }
      }

      toast({
        title: '✅ 상품 정보 수정 완료!',
        description: `[${payload.name}] 상품 정보 및 상세페이지 컷이 성공적으로 업데이트되었습니다.`,
      })
      setEditingMarketProduct(null)
      return
    }

    // ➕ 신규 등록 모드인 경우 (Create Mode)
    if (payload.type === 'C2C_USED') {
      const newUsed: UsedProductItem = {
        id: `used-${Date.now()}`,
        title: payload.name,
        description: payload.description,
        price: payload.price,
        category: payload.category,
        locationName: '서울 강남구 역삼동',
        sellerNickname: user?.nickname || '모꼬 회원',
        sellerAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
        mannerTemp: 36.5,
        images: payload.images,
        likesCount: 0,
        chatsCount: 0,
        createdAt: '방금 전',
        status: 'ACTIVE',
      }
      setUsedProducts((prev) => [newUsed, ...prev])
      createMarketProduct({
        title: payload.name,
        description: payload.description,
        price: payload.price,
        category: payload.category,
        type: 'C2C_USED',
        images: payload.images,
        shippingFee: 3000,
        sellerName: user?.nickname || '테스터02',
      })
        .then(() => refreshMarketData())
        .catch((e) => console.warn('createMarketProduct error:', e))
      toast({
        title: '🎉 중고 물품 등록 완료!',
        description: '내 중고물품이 등록되었으며, 모바일 라이브 방송 시 핀 상품으로 실시간 판매할 수 있습니다.',
      })
    } else {
      const newItem: MarketProductItem = {
        id: `prod-${Date.now()}`,
        title: payload.name,
        category: payload.category,
        type: payload.type as 'B2C_NORMAL' | 'B2C_GROUP',
        ownerType: 'MERCHANT',
        price: payload.price,
        originalPrice: payload.originalPrice,
        images: payload.images,
        description: payload.description,
        stock: payload.stock,
        sellerName: user?.nickname || '(주)모꼬 파트너사',
        shippingFee: payload.shippingFee,
        status: 'ACTIVE',
        salesCount: 0,
        orderCount: 0,
        rating: 5.0,
        detailImages: payload.detailImages,
        detailNotice: payload.detailNotice,
        manufacturer: payload.manufacturer,
        origin: payload.origin,
        csPhone: payload.csPhone,
      }
      setMarketProducts((prev) => [newItem, ...prev])
      createMarketProduct({
        title: payload.name,
        description: payload.description,
        price: payload.price,
        originalPrice: payload.originalPrice,
        category: payload.category,
        type: payload.type,
        images: payload.images,
        stock: payload.stock,
        shippingFee: payload.shippingFee,
        detailNotice: payload.detailNotice,
        detailImages: payload.detailImages,
        sellerName: user?.nickname || '(주)모꼬 파트너사',
      })
        .then(() => refreshMarketData())
        .catch((e) => console.warn('createMarketProduct error:', e))

      // LocalStorage 캐싱 동기화
      try {
        const stored = localStorage.getItem('mocco_custom_products')
        const list = stored ? JSON.parse(stored) : []
        list.unshift(newItem)
        localStorage.setItem('mocco_custom_products', JSON.stringify(list))
      } catch (err) {
        console.error('Failed to sync to local storage:', err)
      }

      toast({
        title: '🎉 공식 마켓 상품 등록 완료!',
        description: `[${payload.name}] 상품이 모꼬 마켓에 성공적으로 입점 등록되었습니다.`,
      })
    }
  }

  // Handle Buy Product in Detail Modal
  const handleBuyProductInModal = (prod: MarketProductDetail, qty: number) => {
    requireAuth(() => {
      const totalCost = (prod.price * qty) + (prod.isFreeShipping ? 0 : 3000)
      toast({
        title: '🛡️ 토스페이먼츠 PG 에스크로 안전결제 완료',
        description: `${prod.name} (${qty}개) 총 ${totalCost.toLocaleString()}원이 에스크로 계좌에 안전하게 예치되었습니다. 수령 후 [구매확정]을 눌러주세요.`,
      })
      setSelectedProductDetail(null)
    })
  }

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

  // Load real-time live rooms, top 3, and rankings from API
  const refreshLiveRooms = useCallback(() => {
    getLiveRooms()
      .then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          const formatted: LiveRoomItem[] = items.map((item, idx) => ({
            id: item.id || `live-room-${idx + 1}`,
            title: item.title || '모꼬 실시간 소통 라이브',
            category: item.category === 'talk' ? '일상/토크' : item.category || '일상/토크',
            hostNickname:
              item.hostNickname ||
              item.host?.displayName ||
              item.host?.nickname ||
              item.host?.name ||
              '호스트',
            hostAvatar:
              item.hostAvatar ||
              item.host?.avatarUrl ||
              item.host?.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
            viewerCount: Number(item.viewerCount || 0),
            coverUrl:
              item.coverUrl ||
              item.coverUri ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
            hasCommerce: Boolean(item.hasCommerce || item.pinnedProduct || item.pinnedProductId),
            isOfficialCreator: Boolean(item.isOfficialCreator ?? true),
            rank: item.rank || idx + 1,
            pinnedProduct: item.pinnedProduct,
          }))
          setLives(formatted)
          setTop3Lives(formatted.slice(0, 3))
        }
      })
      .catch(() => {})

    getLiveTop3Rooms()
      .then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          const formatted: LiveRoomItem[] = items.map((item, idx) => ({
            id: item.id || `live-top-${idx + 1}`,
            title: item.title,
            category: item.category || '일상/토크',
            hostNickname:
              item.hostNickname ||
              item.host?.displayName ||
              item.host?.nickname ||
              item.host?.name ||
              '호스트',
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

  // 마켓 상품(중고/일반/공동구매), 수다글, 채팅방 목록 실시간 API 로딩
  const refreshMarketData = useCallback(() => {
    // 1) 중고거래 상품 (C2C_USED)
    getMarketProducts({ type: 'C2C_USED' })
      .then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          const formatted: UsedProductItem[] = items.map((p, idx) => {
            const rawImgs = Array.isArray(p.images) && p.images.length > 0
              ? p.images
              : (typeof p.images === 'string' ? (() => { try { return JSON.parse(p.images) } catch { return [p.images] } })() : [p.image])
            const cleanImgs = (Array.isArray(rawImgs) ? rawImgs : [rawImgs])
              .map((img: string) => resolveDisplayImageUrl(img, p.category))
              .filter(Boolean)

            return {
              id: p.id || `used-${idx + 1}`,
              title: p.title || p.name || '중고 매물',
              description: p.description || '',
              price: Number(p.price || 0),
              category: p.category || '기타',
              locationName: p.region || p.locationName || '서울 강남구',
              sellerNickname: p.seller?.nickname || p.sellerNickname || '모꼬 이웃',
              sellerAvatar: resolveDisplayImageUrl(p.seller?.avatarUrl || p.seller?.avatar || p.sellerAvatar) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
              mannerTemp: Number(p.mannerTemp || 36.5),
              images: cleanImgs.length > 0 ? cleanImgs : [getCategoryFallbackImage(p.category)],
              likesCount: Number(p.likesCount || p.likes || 0),
              chatsCount: Number(p.chatsCount || p.chats || 0),
              createdAt: p.createdAt ? (p.createdAt.includes('전') ? p.createdAt : new Date(p.createdAt).toLocaleDateString()) : '최근',
              status: p.status || 'ACTIVE',
              allowLiveSale: Boolean(p.allowLiveSale),
            }
          })
          setUsedProducts(formatted)
        }
      })
      .catch(() => {})

    // 2) 일반 마켓 상품 (B2C_NORMAL) 및 3) 공동구매 상품 (B2C_GROUP) 통합 로드
    Promise.all([
      getNormalProducts(),
      getMarketProducts({ type: 'B2C_GROUP' })
    ]).then(([normalItems, groupItems]) => {
      const formattedNormal: MarketProductItem[] = (Array.isArray(normalItems) ? normalItems : []).map((p, idx) => {
        const rawImgs = Array.isArray(p.images) && p.images.length > 0
          ? p.images
          : (typeof p.images === 'string' ? (() => { try { return JSON.parse(p.images) } catch { return [p.images] } })() : [p.image])
        const cleanImgs = (Array.isArray(rawImgs) ? rawImgs : [rawImgs])
          .map((img: string) => resolveDisplayImageUrl(img, p.category))
          .filter(Boolean)

        const finalPrice = Number(p.salePriceKrw ?? p.price ?? p.priceKrw ?? 0)
        const finalOriginal = p.priceKrw ? Number(p.priceKrw) : (p.originalPrice ? Number(p.originalPrice) : undefined)

        return {
          id: p.id || `prod-${idx + 1}`,
          title: p.name || p.title || '모꼬 마켓 상품',
          description: p.description || '',
          price: finalPrice,
          originalPrice: finalOriginal && finalOriginal > finalPrice ? finalOriginal : undefined,
          type: 'B2C_NORMAL',
          ownerType: p.ownerType || 'MERCHANT',
          category: p.category || '식품/신선',
          images: cleanImgs.length > 0 ? cleanImgs : [getCategoryFallbackImage(p.category)],
          sellerName: p.merchantName || p.sellerName || '모꼬 공식 파트너',
          shippingFee: Number(p.shippingFee || 0),
          stock: Number(p.stock || 999),
          status: p.status || 'ACTIVE',
          salesCount: Number(p.salesCount || 120),
          orderCount: Number(p.orderCount || 800),
          rating: Number(p.rating || 5.0),
          reviewCount: Number(p.reviewCount || 30),
        }
      })

      const formattedGroup: MarketProductItem[] = (Array.isArray(groupItems) ? groupItems : []).map((p, idx) => {
        const rawImgs = Array.isArray(p.images) && p.images.length > 0
          ? p.images
          : (typeof p.images === 'string' ? (() => { try { return JSON.parse(p.images) } catch { return [p.images] } })() : [p.image])
        const cleanImgs = (Array.isArray(rawImgs) ? rawImgs : [rawImgs])
          .map((img: string) => resolveDisplayImageUrl(img, p.category))
          .filter(Boolean)

        const finalPrice = Number(p.price || p.salePriceKrw || 0)
        const finalOriginal = p.originalPrice ? Number(p.originalPrice) : (p.priceKrw ? Number(p.priceKrw) : undefined)

        return {
          id: p.id || `group-${idx + 1}`,
          title: p.title || p.name || '모꼬 공동구매 상품',
          description: p.description || '',
          price: finalPrice,
          originalPrice: finalOriginal && finalOriginal > finalPrice ? finalOriginal : undefined,
          type: 'B2C_GROUP',
          ownerType: p.ownerType || 'GROUP_DEAL',
          category: p.category || '식품/신선',
          images: cleanImgs.length > 0 ? cleanImgs : [getCategoryFallbackImage(p.category)],
          sellerName: p.seller?.nickname || p.sellerName || '모꼬 공동구매',
          shippingFee: Number(p.shippingFee || 0),
          stock: Number(p.stock || 50),
          targetQuantity: Number(p.targetQuantity || 20),
          currentQuantity: Number(p.currentQuantity || 16),
          status: p.status || 'ACTIVE',
          salesCount: Number(p.currentQuantity || 16),
          orderCount: Number(p.currentQuantity || 16),
          rating: Number(p.rating || 4.9),
          reviewCount: Number(p.reviewCount || 10),
          deadline: p.createdAt && p.createdAt.includes('마감') ? p.createdAt : '마감임박',
        }
      })

      setMarketProducts([...formattedNormal, ...formattedGroup])
    }).catch((err) => {
      console.warn('Market items load error:', err)
    })

    getSudaPosts()
      .then((items) => {
        if (Array.isArray(items)) {
          const deletedSuda = getDeletedSudaIds()
          const serverPosts: SudaPostItem[] = items
            .map((s, idx) => ({
              id: s.id || `suda-${idx + 1}`,
              nickname: s.author?.nickname || s.nickname || '모꼬 이웃',
              avatar: s.author?.avatar || s.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
              region: s.region || '서울 강남구',
              distance: s.distance || '500m',
              title: s.title,
              content: s.content || s.text || '',
              entryFee: Number(s.entryFee || 0),
              category: s.category || '일상',
              time: s.createdAt ? new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '방금 전',
              likes: Number(s.likes || s.likesCount || 0),
              comments: Number(s.comments || s.commentsCount || 0),
              isLiked: Boolean(s.isLiked),
            }))
            .filter((p) => !deletedSuda.has(p.id))

          setSudaPosts((prev) => {
            const combined = [...serverPosts, ...prev].filter((p) => !deletedSuda.has(p.id))
            const seenKeys = new Set<string>()
            const seenIds = new Set<string>()
            const unique: SudaPostItem[] = []
            for (const item of combined) {
              const dedupeKey = `${item.nickname}_${item.title || ''}_${item.content || ''}`.trim()
              if (!seenIds.has(item.id) && !seenKeys.has(dedupeKey)) {
                seenIds.add(item.id)
                seenKeys.add(dedupeKey)
                unique.push(item)
              }
            }
            return unique
          })
        }
      })
      .catch(() => {})

    getChatRooms()
      .then((items) => {
        if (Array.isArray(items)) {
          const deletedChats = getDeletedChatIds()
          const serverRooms: ChatRoomItem[] = items
            .map((c, idx) => {
              const detectedFromOther = c.otherUser?.displayName || c.otherUser?.nickname || c.counterpart?.displayName || c.counterpart?.nickname || c.targetNickname
              const detectedFromTitle = c.title && c.title !== '1:1' && c.title !== '대화 상대' ? c.title : null
              const resolvedNick = detectedFromOther || detectedFromTitle || '테스터01'
              const resolvedAvatar = c.otherUser?.avatarUrl || c.otherUser?.avatar || c.counterpart?.avatarUrl || c.counterpart?.avatar || c.targetAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'
              return {
                id: c.id || `chat-${idx + 1}`,
                type: (c.type === 'MARKET' ? 'MARKET' : 'SUDA') as 'MARKET' | 'SUDA',
                targetNickname: resolvedNick,
                targetAvatar: resolvedAvatar,
                lastMessage: c.lastMessage || c.lastMessageContent || '대화가 시작되었습니다.',
                lastTime: c.lastTime || '방금 전',
                unreadCount: Number(c.unreadCount || 0),
                productInfo: c.productInfo,
                messages: Array.isArray(c.messages) ? c.messages : [],
              }
            })
            .filter((c) => !deletedChats.has(c.id))

          setChatRooms((prev) => {
            const prevMap = new Map(prev.map((r) => [r.id, r]))
            const mergedServerRooms = serverRooms.map((sr) => {
              const local = prevMap.get(sr.id)
              if (local && Array.isArray(local.messages) && local.messages.length > 0) {
                return { ...sr, messages: local.messages }
              }
              return sr
            })
            const combined = [...mergedServerRooms, ...prev].filter((r) => !deletedChats.has(r.id))
            const unique = Array.from(new Map(combined.map((m) => [m.id, m])).values())
            return unique
          })
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    refreshLiveRooms()
    refreshMarketData()
    const timer = setInterval(() => {
      refreshLiveRooms()
      refreshMarketData()
    }, 5000)
    return () => clearInterval(timer)
  }, [refreshLiveRooms, refreshMarketData])

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

  // Live Chat Send & Auto Scroll + Server Sync + Cross-window Broadcast
  const handleSendLiveChat = () => {
    requireAuth(() => {
      if (!liveChatInput.trim() || !activeLiveModal) return
      const text = liveChatInput.trim()
      const now = new Date()
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const senderName = user?.nickname || '테스터02(시청자)'
      const newMsg = { sender: senderName, text, time: timeStr }
      setLiveChatMessages((prev) => [...prev, newMsg])
      setLiveChatInput('')
      setTimeout(() => {
        liveChatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)

      // 📡 서버 API로 실시간 메시지 전송 (앱 스트리머 화면에 WebSocket으로 즉시 도달)
      sendWebLiveMessage(activeLiveModal.id, {
        text,
        sender: senderName,
        senderId: user?.id || 'e4b911c9-34c2-4566-bf2c-13a00c5ffed4',
      }).catch(() => {})

      // 📡 다른 브라우저 탭/창에 실시간 채팅 브로드캐스트
      try {
        const chatPayload = {
          msg: newMsg,
          roomId: activeLiveModal.id,
          timestamp: Date.now(),
        }
        localStorage.setItem('mocco_live_chat_event', JSON.stringify(chatPayload))
        window.dispatchEvent(new Event('mocco_live_chat_broadcast'))
      } catch (e) {}
    })
  }

  // 모달 오픈 시 상품 카드 펼침 및 채팅 최신 스크롤 동기화 + 서버 메시지 실시간 폴링 + 실시간 크로스 브라우저 선물/채팅 수신 리스너 + Agora WebRTC 연동
  useEffect(() => {
    if (!activeLiveModal) {
      if (modalAgoraClientRef.current) {
        try { modalAgoraClientRef.current.leave() } catch {}
        modalAgoraClientRef.current = null
      }
      setIsAgoraStreaming(false)
      setIsLiveEnded(false)
      return
    }

    setIsPinnedProductMinimized(false)
    setIsLiveEnded(false)
    setLiveEndedReason('')

    // 📡 라이브 방송 시청자 방 입장 및 실시간 종료/입장메시지 소켓 등록
    let handleLiveEndedSocket: any = null
    let handleLiveMessageSocket: any = null
    let handleViewerCountSocket: any = null

    if (socketRef.current) {
      const socket = socketRef.current
      const viewerNickname = (user?.nickname || '테스터02').replace(/\(시청자\)$/, '').trim()
      socket.emit('live:join', { roomId: activeLiveModal.id, nickname: viewerNickname, isHost: false })

      handleLiveEndedSocket = (data: any) => {
        setIsLiveEnded(true)
        setIsAgoraStreaming(false)
        setLiveEndedReason(data?.reason || '호스트가 라이브 방송을 종료했습니다.')
      }

      handleLiveMessageSocket = (msg: any) => {
        if (msg && (msg.type === 'SYSTEM' || msg.systemType === 'USER_JOIN' || msg.isJoin)) {
          const rawNick = msg.nickname || (msg.sender && msg.sender !== '시스템' ? msg.sender : '') || (msg.text ? msg.text.replace(/^[✨👋\s]+/, '').replace(/님이.*$/, '').trim() : '') || '시청자'
          const cleanNick = rawNick.replace(/\(시청자\)$/, '').trim()
          setLiveChatMessages((prev) => {
            // 중복 방지: 이미 해당 유저의 입장 메시지가 최근에 등록되었으면 무시
            if (prev.some((m) => ((m as any).nickname === cleanNick || m.sender === cleanNick) && ((m as any).isJoin || m.text?.includes(cleanNick)))) {
              return prev
            }
            return [
              ...prev,
              {
                sender: cleanNick,
                nickname: cleanNick,
                text: `${cleanNick}님이 입장했습니다.`,
                isSystem: true,
                isJoin: true,
                time: msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]
          })
        }
      }

      handleViewerCountSocket = (data: any) => {
        if (typeof data?.viewerCount === 'number') {
          setActiveLiveModal((prev) => (prev ? { ...prev, viewerCount: data.viewerCount } : prev))
        }
      }

      socket.on('live:ended', handleLiveEndedSocket)
      socket.on('live:room_ended', handleLiveEndedSocket)
      socket.on('live:message', handleLiveMessageSocket)
      socket.on('live:viewer_count', handleViewerCountSocket)
      socket.on('live:user_joined', handleViewerCountSocket)

      const handleLivePinProductSocket = (data: any) => {
        if (!data) return
        const isPinned = data.isPinned !== false && Boolean(data.product)
        const newProduct = isPinned ? {
          id: String(data.product.id || ''),
          title: String(data.product.title || data.product.name || '핀 상품'),
          price: Number(data.product.price || data.product.salePriceKrw || 0),
          originalPrice: data.product.originalPrice ? Number(data.product.originalPrice) : undefined,
          image: String(data.product.image || data.product.images?.[0] || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300'),
          type: (data.product.type === 'C2C_USED' || data.product.type === 'USED') ? ('USED' as const) : ('NORMAL' as const),
        } : undefined

        setActiveLiveModal((prev) => prev ? {
          ...prev,
          pinnedProduct: newProduct,
          hasCommerce: Boolean(newProduct),
        } : null)
      }

      socket.on('live:pin_product', handleLivePinProductSocket)
      socket.on('LIVE_PINNED_PRODUCT_UPDATE', handleLivePinProductSocket)
    }

    if (modalVideoRef.current) {
      modalVideoRef.current.muted = true
      modalVideoRef.current.play().catch(() => {})
    }

    // 관리자 등록 선물 목록 실시간 동기화
    getAdminGifts()
      .then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          const mapped: MoccoChatGiftItem[] = items.map((item) => ({
            id: item.id || item.code,
            name: item.name,
            description: item.description || '',
            pricePoints: item.pricePoints || item.points || item.amount || 1000,
            icon: item.animationType === 'GOLDEN_KING_MOCCO' ? '👑🪙' : item.animationType === 'CLOUD_CAR_MOCCO' ? '🚗🎉' : '☁️💖',
            category: (item.category as any) || 'all',
          }))
          setAdminGifts(mapped)
        }
      })
      .catch(() => {})

    // 방별 환영 공지 메시지로 초기화 (이전 방의 잘못된 잔여 메시지 배제)
    const initialMsg: LiveChatMessageItem = {
      sender: '시스템',
      text: `[공지] 모꼬(MOCCO) 실시간 라이브 방송에 오신 것을 환영합니다! '${activeLiveModal.title}' 방송이 진행 중입니다.`,
      isSystem: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setLiveChatMessages([initialMsg])

    setTimeout(() => {
      liveChatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)

    // 서버의 실시간 채팅/선물 목록 초기 동기화 및 2.5초 주기 폴링
    const fetchServerMessages = () => {
      getAdminLiveMessages(activeLiveModal.id)
        .then((msgs) => {
          if (Array.isArray(msgs) && msgs.length > 0) {
            const formatted = msgs.map((m: any) => {
              let isGift = m.type === 'gift' || Boolean(m.gift)
              let giftObj = m.gift
              let textContent = m.text || m.content || ''

              if (typeof m.content === 'string' && m.content.startsWith('{')) {
                try {
                  const parsed = JSON.parse(m.content)
                  if (parsed.giftId || parsed.giftName || m.type === 'gift') {
                    isGift = true
                    const pts = Number(parsed.pricePoints || parsed.points || m.giftPoints || 1000)
                    const gName = parsed.giftName || parsed.name || '모꼬 선물'
                    giftObj = {
                      id: parsed.giftId || 'gift',
                      name: gName,
                      amount: pts,
                      description: parsed.bannerMessage || parsed.description || '',
                      icon: parsed.animationType === 'GOLDEN_KING_MOCCO' ? '👑🪙' : parsed.animationType === 'CLOUD_CAR_MOCCO' ? '🚗🎉' : '☁️💖',
                    }
                    textContent = `🎁 [선물] ${gName} (${pts.toLocaleString()} 꿀떡 후원)`
                  }
                } catch {}
              } else if (isGift && !giftObj) {
                giftObj = {
                  id: 'gift',
                  name: m.name || '모꼬 선물',
                  amount: Number(m.giftPoints || 1000),
                  description: '',
                  icon: '🎁',
                }
              }

              return {
                sender: m.sender?.nickname || m.sender?.name || m.senderName || '시청자',
                text: textContent,
                isSystem: m.type === 'system',
                isGift,
                gift: giftObj,
                time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }
            })
            setLiveChatMessages((prev) => {
              const unique = [...prev]
              formatted.forEach((f) => {
                const isDuplicate = unique.some((u) => {
                  if (u.isGift && f.isGift && u.gift && f.gift) {
                    return u.gift.name === f.gift.name && u.gift.amount === f.gift.amount && u.sender === f.sender
                  }
                  return u.text === f.text && u.sender === f.sender
                })
                if (!isDuplicate) {
                  unique.push(f)
                }
              })
              return unique.length > prev.length ? unique : prev
            })
          }
        })
        .catch(() => {})
    }

    fetchServerMessages()
    const msgInterval = setInterval(fetchServerMessages, 2500)

    // Agora WebRTC 실시간 스트림 연결
    let unmounted = false
    const initModalStream = async () => {
      try {
        if (!(window as any).AgoraRTC) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://download.agora.io/sdk/release/AgoraRTC_N-4.22.0.js'
            script.async = true
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Agora SDK 로드 실패'))
            document.head.appendChild(script)
          })
        }

        if (unmounted) return

        let tokenData: any = null
        try {
          const res: any = await api.get(`/live/rooms/${encodeURIComponent(activeLiveModal.id)}/agora-token?role=subscriber`)
          tokenData = res?.data ?? res
        } catch {
          tokenData = {
            appId: 'mocco_agora_live',
            token: '',
            channelName: activeLiveModal.id,
            uid: Math.floor(Math.random() * 900000) + 100000,
          }
        }

        if (!tokenData?.appId || unmounted) return

        const AgoraRTC = (window as any).AgoraRTC
        AgoraRTC.setLogLevel(2)
        const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
        modalAgoraClientRef.current = client

        await client.setClientRole('audience', { level: 1 })

        client.on('user-published', async (user: any, mediaType: string) => {
          try {
            await client.subscribe(user, mediaType)
            if (mediaType === 'video') {
              modalRemoteVideoTrackRef.current = user.videoTrack
              setIsAgoraStreaming(true)
              if (modalAgoraContainerRef.current) {
                modalAgoraContainerRef.current.innerHTML = ''
                try {
                  user.videoTrack.play(modalAgoraContainerRef.current, { fit: 'cover' })
                  const vid = modalAgoraContainerRef.current.querySelector('video')
                  if (vid) {
                    vid.muted = true
                    vid.setAttribute('playsinline', 'true')
                    vid.setAttribute('webkit-playsinline', 'true')
                    vid.play().catch(() => {})
                  }
                } catch (playErr) {
                  console.warn('Video autoplay policy warning:', playErr)
                }
              }
            }
            if (mediaType === 'audio') {
              modalRemoteAudioTrackRef.current = user.audioTrack
              if (!isLiveMuted) {
                try {
                  user.audioTrack.play()
                } catch (audioErr) {
                  console.warn('Audio autoplay blocked by browser policy:', audioErr)
                }
              }
            }
          } catch (subErr) {
            console.error('Modal Agora subscribe error:', subErr)
          }
        })

        client.on('user-unpublished', (user: any, mediaType: string) => {
          if (mediaType === 'video') {
            setIsAgoraStreaming(false)
          }
        })

        await client.join(
          tokenData.appId,
          tokenData.channelName || activeLiveModal.id,
          tokenData.token && tokenData.token.length > 5 ? tokenData.token : null,
          tokenData.uid || null
        )

        // 이미 방송 중인 호스트(remoteUsers) 트랙 자동 구독
        if (client.remoteUsers && client.remoteUsers.length > 0) {
          for (const rUser of client.remoteUsers) {
            if (rUser.hasVideo) {
              try {
                await client.subscribe(rUser, 'video')
                modalRemoteVideoTrackRef.current = rUser.videoTrack
                setIsAgoraStreaming(true)
                if (modalAgoraContainerRef.current) {
                  modalAgoraContainerRef.current.innerHTML = ''
                  rUser.videoTrack.play(modalAgoraContainerRef.current, { fit: 'cover' })
                  const vid = modalAgoraContainerRef.current.querySelector('video')
                  if (vid) {
                    vid.muted = true
                    vid.setAttribute('playsinline', 'true')
                    vid.setAttribute('webkit-playsinline', 'true')
                    vid.play().catch(() => {})
                  }
                }
              } catch (e) {}
            }
            if (rUser.hasAudio) {
              try {
                await client.subscribe(rUser, 'audio')
                modalRemoteAudioTrackRef.current = rUser.audioTrack
                if (!isLiveMuted) {
                  try { rUser.audioTrack.play() } catch {}
                }
              } catch (e) {}
            }
          }
        }
      } catch (err: any) {
        console.warn('Modal AgoraRTC init:', err?.message || err)
        setIsAgoraStreaming(false)
      }
    }

    initModalStream()

    const onLiveGiftReceived = () => {
      try {
        const raw = localStorage.getItem('mocco_live_gift_event')
        if (!raw) return
        const payload = JSON.parse(raw)
        if (payload && payload.roomId === activeLiveModal.id && Date.now() - payload.timestamp < 4000) {
          setLiveChatMessages((prev) => {
            if (prev.some((m) => m.time === payload.msg.time && m.text === payload.msg.text && m.sender === payload.msg.sender)) {
              return prev
            }
            return [...prev, payload.msg]
          })
          setLiveGiftEffect(payload.effect)
          setTimeout(() => {
            setLiveGiftEffect(null)
          }, 4000)
          setTimeout(() => {
            liveChatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }
      } catch (e) {}
    }

    const onLiveChatReceived = () => {
      try {
        const raw = localStorage.getItem('mocco_live_chat_event')
        if (!raw) return
        const payload = JSON.parse(raw)
        if (payload && payload.roomId === activeLiveModal.id && Date.now() - payload.timestamp < 3000) {
          setLiveChatMessages((prev) => {
            if (prev.some((m) => m.time === payload.msg.time && m.text === payload.msg.text && m.sender === payload.msg.sender)) {
              return prev
            }
            return [...prev, payload.msg]
          })
          setTimeout(() => {
            liveChatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 50)
        }
      } catch (e) {}
    }

    window.addEventListener('mocco_live_gift_broadcast', onLiveGiftReceived)
    window.addEventListener('mocco_live_chat_broadcast', onLiveChatReceived)
    window.addEventListener('storage', onLiveGiftReceived)
    window.addEventListener('storage', onLiveChatReceived)

    return () => {
      unmounted = true
      clearInterval(msgInterval)
      window.removeEventListener('mocco_live_gift_broadcast', onLiveGiftReceived)
      window.removeEventListener('mocco_live_chat_broadcast', onLiveChatReceived)
      window.removeEventListener('storage', onLiveGiftReceived)
      window.removeEventListener('storage', onLiveChatReceived)
      if (socketRef.current) {
        if (handleLiveEndedSocket) {
          socketRef.current.off('live:ended', handleLiveEndedSocket)
          socketRef.current.off('live:room_ended', handleLiveEndedSocket)
        }
        if (handleLiveMessageSocket) {
          socketRef.current.off('live:message', handleLiveMessageSocket)
        }
        if (handleViewerCountSocket) {
          socketRef.current.off('live:viewer_count', handleViewerCountSocket)
          socketRef.current.off('live:user_joined', handleViewerCountSocket)
        }
        socketRef.current.off('live:pin_product')
        socketRef.current.off('LIVE_PINNED_PRODUCT_UPDATE')
        socketRef.current.emit('live:leave', { roomId: activeLiveModal.id })
      }
      if (modalAgoraClientRef.current) {
        try { modalAgoraClientRef.current.leave() } catch {}
        modalAgoraClientRef.current = null
      }
      modalRemoteVideoTrackRef.current = null
      modalRemoteAudioTrackRef.current = null
      setIsAgoraStreaming(false)
    }
  }, [activeLiveModal?.id])

  // 🎬 라이브 오디오 & 비디오 동시 재생 잠금 해제 (모바일/사파리 WebRTC Autoplay 브라우저 정책 준수)
  const resumeLiveMediaPlayback = () => {
    // 1. 원격 오디오 재생
    if (modalRemoteAudioTrackRef.current && !isLiveMuted) {
      try { modalRemoteAudioTrackRef.current.play() } catch {}
    }
    // 2. 원격 WebRTC 비디오 재생 및 DOM 요소 강제 활성화
    if (modalRemoteVideoTrackRef.current && modalAgoraContainerRef.current) {
      try {
        if (!modalAgoraContainerRef.current.querySelector('video')) {
          modalRemoteVideoTrackRef.current.play(modalAgoraContainerRef.current, { fit: 'cover' })
        }
        const vids = modalAgoraContainerRef.current.querySelectorAll('video')
        vids.forEach((v) => {
          v.setAttribute('playsinline', 'true')
          v.setAttribute('webkit-playsinline', 'true')
          v.play().catch(() => {})
        })
      } catch (e) {}
    }
    // 3. 폴백 비디오 재생
    if (modalVideoRef.current) {
      modalVideoRef.current.play().catch(() => {})
    }
  }

  // 컨테이너 마운트 또는 활성 모달 변경 시 비디오 트랙 재연결 보장
  useEffect(() => {
    if (modalRemoteVideoTrackRef.current && modalAgoraContainerRef.current) {
      try {
        if (!modalAgoraContainerRef.current.querySelector('video')) {
          modalRemoteVideoTrackRef.current.play(modalAgoraContainerRef.current, { fit: 'cover' })
        }
      } catch (e) {}
    }
  }, [activeLiveModal, isAgoraStreaming])

  useEffect(() => {
    resumeLiveMediaPlayback()
  }, [isLiveMuted])

  // Live Donation: Send 3D Mocco Gift with full screen animation and chat sync
  // 🔴 라이브 방송 개설 핸들러 (1:N 대중 / 1:1 프라이빗 & 판매 상품 연동)
  const handleStartLiveStream = () => {
    requireAuth(() => {
      if (!newLiveTitle.trim()) {
        toast({
          title: '방송 제목을 입력해 주세요',
          description: '시청자들에게 보여질 방송 제목을 입력해 주세요.',
          variant: 'destructive',
        })
        return
      }
      const newRoom: LiveRoomItem = {
        id: 'live-' + Date.now(),
        title: newLiveTitle.trim(),
        category: newLiveCategory,
        hostNickname: user?.nickname || '나의 라이브',
        hostAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
        viewerCount: 1,
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
        hasCommerce: Boolean(newLivePinnedProduct),
        isOfficialCreator: true,
        broadcastType: newLiveBroadcastType,
        entryFee: newLiveBroadcastType === 'PRIVATE' ? newLiveEntryFee : 0,
        pinnedProduct: newLivePinnedProduct || undefined,
      }
      const updatedLives = [newRoom, ...lives]
      setLives(updatedLives)
      setTop3Lives([newRoom, ...top3Lives.slice(0, 2)])
      try {
        localStorage.setItem('mocco_custom_lives', JSON.stringify(updatedLives))
        window.dispatchEvent(new Event('mocco_live_updated'))
      } catch (e) {}

      setIsStartLiveModalOpen(false)
      setNewLiveTitle('')
      setNewLivePinnedProduct(null)
      setActiveLiveModal(newRoom)
      toast({
        title: '🎙️ 라이브 방송 시작!',
        description: `"${newRoom.title}" (${newRoom.broadcastType === 'PRIVATE' ? '1:1 프라이빗' : '1:N 대중'} 방송)이 온에어되었습니다.`,
      })
    })
  }

  const handleSendLiveGiftItem = (gift: MoccoChatGiftItem) => {
    requireAuth(() => {
      if (!activeLiveModal) return
      if (myPoints < gift.pricePoints) {
        toast({
          title: '🍯 꿀떡이 부족합니다',
          description: `선물 후원에 필요한 꿀떡이 부족합니다. (필요: ${gift.pricePoints.toLocaleString()}개 / 보유: ${myPoints.toLocaleString()}개) 무료 충전소 또는 상점으로 이동합니다.`,
          variant: 'destructive',
        })
        setIsPointChargeModalOpen(true)
        return
      }

      setMyPoints((prev) => prev - gift.pricePoints)
      setIsLiveGiftPickerOpen(false)

      const senderName = user?.nickname || '나 (시청자)'
      const giftMsg: LiveChatMessageItem = {
        sender: senderName,
        text: `🎁 [선물] ${gift.name} (${gift.pricePoints.toLocaleString()} 꿀떡 후원)`,
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

      // 📡 서버 API로 실시간 선물 전송 (앱 스트리머 화면에 3D 선물 애니메이션 및 정산 즉시 반영)
      sendWebLiveGift(activeLiveModal.id, {
        name: gift.name,
        points: gift.pricePoints,
        senderName,
        senderId: user?.id || 'e4b911c9-34c2-4566-bf2c-13a00c5ffed4',
      }).catch(() => {})

      // 3D Gift Effect Overlay on Video Player
      setLiveGiftEffect({
        name: gift.name,
        icon: gift.icon || '🎁',
        description: gift.description || '',
        sender: senderName,
        amount: gift.pricePoints,
      })
      setTimeout(() => {
        setLiveGiftEffect(null)
      }, 4000)

      // 📡 다른 브라우저 탭/창(호스트 화면)에 실시간 선물 후원 브로드캐스트
      try {
        const giftPayload = {
          msg: giftMsg,
          effect: {
            name: gift.name,
            icon: gift.icon || '🎁',
            description: gift.description || '',
            sender: senderName,
            amount: gift.pricePoints,
          },
          roomId: activeLiveModal.id,
          timestamp: Date.now(),
        }
        localStorage.setItem('mocco_live_gift_event', JSON.stringify(giftPayload))
        window.dispatchEvent(new Event('mocco_live_gift_broadcast'))
      } catch (e) {}

      toast({
        title: '🎉 모꼬 3D 선물 후원 완료!',
        description: `${gift.name} (${gift.pricePoints.toLocaleString()} 꿀떡)을 ${activeLiveModal.hostNickname}님께 선물했습니다!`,
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

  // 내가 개설한 1:1 수다 대기방 삭제
  const handleDeleteSudaRoom = async (roomId: string) => {
    if (confirm('내가 개설한 1:1 수다 대기방을 삭제하시겠습니까?')) {
      // 1) 영구 삭제 ID 등록 (재부활 방지)
      try {
        const deletedSet = getDeletedSudaIds()
        deletedSet.add(roomId)
        localStorage.setItem('mocco_deleted_suda_ids', JSON.stringify(Array.from(deletedSet)))
      } catch (e) {}

      // 2) 로컬 상태 및 localStorage 즉시 반영
      const updatedSudaList = sudaPosts.filter((p) => p.id !== roomId)
      setSudaPosts(updatedSudaList)
      try {
        localStorage.setItem('mocco_custom_suda_rooms', JSON.stringify(updatedSudaList))
        window.dispatchEvent(new Event('mocco_suda_updated'))
      } catch (e) {}

      // 3) 백엔드 REST API 삭제 호출
      try {
        await deleteSudaPost(roomId)
      } catch (e) {
        console.warn('deleteSudaPost API call failed:', e)
      }

      toast({
        title: '🗑️ 수다방 삭제 완료',
        description: '내가 개설한 수다방이 완전히 삭제되었습니다.',
      })
    }
  }

  // 1:1 대화방 나가기 (대화방 완전 삭제 & 퇴장)
  const handleLeaveChatRoom = async (roomToLeave: ChatRoomItem) => {
    setIsChatMenuOpen(false)
    if (confirm('1:1 대화방을 나가시겠습니까?\n\n※ 나가면 대화방 목록에서 삭제되며 이전 대화 내용이 종료됩니다.')) {
      const roomId = roomToLeave.id

      // 1) 영구 퇴장/삭제 ID 등록 (재부활 방지)
      try {
        const deletedSet = getDeletedChatIds()
        deletedSet.add(roomId)
        localStorage.setItem('mocco_deleted_chat_ids', JSON.stringify(Array.from(deletedSet)))
      } catch (e) {}

      // 2) 로컬 상태 및 localStorage 즉시 반영
      const remaining = chatRooms.filter((r) => r.id !== roomId)
      setChatRooms(remaining)
      try {
        localStorage.setItem('mocco_custom_chat_rooms', JSON.stringify(remaining))
      } catch (e) {}

      if (activeChatRoom?.id === roomId) {
        setActiveChatRoom(remaining[0] || null)
      }

      // 3) 백엔드 REST API 삭제 호출
      try {
        await deleteChatRoom(roomId)
      } catch (e) {
        console.warn('deleteChatRoom API call failed:', e)
      }

      toast({
        title: '🚪 대화방 나가기 완료',
        description: '대화방에서 정상적으로 퇴장했으며 목록에서 삭제되었습니다.',
      })
    }
  }

  // 1:1 수다 대기방 개설 (방 만들기 & 단가 설정)
  const handleCreateSudaRoom = () => {
    requireAuth(async () => {
      const title = newRoomTitle.trim() || sudaInputText.trim()
      if (!title) {
        toast({
          title: '방 제목을 입력해 주세요',
          description: '어떤 이야기를 나누고 싶은지 방 제목을 적어주세요. (예: 오늘 강남역에서 맥주 한잔 🍺)',
          variant: 'destructive',
        })
        return
      }

      let createdPost: any = null
      try {
        createdPost = await createSudaPost({
          title,
          content: sudaInputText.trim() || '나랑 즐겁게 수다떨 이웃 편하게 입장해주세요!',
          entryFee: newRoomEntryFee,
          neighborhood: (user as any)?.neighborhood || (user as any)?.region || '역삼1동',
          category: newRoomCategory,
          authorNickname: user?.nickname || '테스터02',
          authorAvatar: user?.avatarUrl,
          authorId: user?.id,
        })
      } catch (e) {
        console.warn('createSudaPost API call fallback:', e)
      }

      const assignedId = createdPost?.id || 'suda-room-' + Date.now()
      const newRoom: SudaPostItem = {
        id: assignedId,
        nickname: user?.nickname || '모꼬이웃',
        avatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        region: (user as any)?.neighborhood || (user as any)?.region || '역삼1동',
        title: title,
        content: sudaInputText.trim() || '나랑 즐겁게 수다떨 이웃 편하게 입장해주세요!',
        entryFee: newRoomEntryFee,
        category: newRoomCategory,
        time: '방금 전',
        likes: 0,
        comments: 0,
      }
      setSudaPosts((prev) => {
        const next = [newRoom, ...prev.filter((p) => p.id !== newRoom.id && p.id !== assignedId)]
        try {
          localStorage.setItem('mocco_custom_suda_rooms', JSON.stringify(next))
        } catch (e) {
          console.warn('Failed to save suda room to localStorage', e)
        }
        return next
      })
      try {
        window.dispatchEvent(new Event('mocco_suda_updated'))
      } catch {}

      setNewRoomTitle('')
      setSudaInputText('')
      setSudaCategoryFilter('전체')
      setIsCreateSudaRoomOpen(false)
      toast({
        title: '🎉 1:1 수다방 개설 완료!',
        description: `"${newRoom.title}" 방이 열렸습니다. (입장단가: ${newRoom.entryFee ? newRoom.entryFee + ' 꿀떡' : '무료'})`,
      })
    })
  }

  // 1:1 수다 대기방 입장 핸들러 (단가 적용, 개설자 면제, 중복 차감 방지 및 1:1 톡 자동 연결)
  const handleEnterSudaRoom = (room: SudaPostItem) => {
    requireAuth(async () => {
      const existing = chatRooms.find((r) => r.targetNickname === room.nickname)
      const isOwner = user?.nickname && room.nickname === user.nickname

      if (isOwner) {
        toast({
          title: '✨ 내가 개설한 1:1 수다방',
          description: '개설자 본인 방으로 즉시 입장합니다. (입장료 면제)',
        })
      } else if (existing) {
        toast({
          title: '✨ 기존 1:1 수다방 연결',
          description: `${room.nickname} 님과의 기존 대화방으로 바로 이동합니다.`,
        })
      } else if (room.entryFee && room.entryFee > 0) {
        if (myPoints < room.entryFee) {
          toast({
            title: '🍯 꿀떡이 부족합니다',
            description: `수다방 입장료는 ${room.entryFee.toLocaleString()} 꿀떡입니다. (보유: ${myPoints.toLocaleString()}개) 무료 충전소 또는 꿀떡 상점으로 이동합니다.`,
            variant: 'destructive',
          })
          setIsPointChargeModalOpen(true)
          return
        }
        setMyPoints((prev) => Math.max(0, prev - room.entryFee!))
        toast({
          title: `💰 ${room.entryFee.toLocaleString()} 꿀떡 결제 완료! & 수다방 입장`,
          description: `${room.nickname} 님의 1:1 수다방에 입장했습니다. 대화를 시작하세요!`,
        })
      } else {
        toast({
          title: '✨ 1:1 수다방 무료 입장',
          description: `${room.nickname} 님과의 대화방으로 연결되었습니다.`,
        })
      }

      // 발신자 닉네임 정규화 (관리자 세션 쿠키더라도 1:1 채팅에서는 테스터02로 송신)
      const isAdmUser = !user?.nickname || ['super admin', 'admin', 'admin_super_user', '관리자', '슈퍼어드민'].includes(String(user.nickname).trim().toLowerCase())
      const effectiveSenderNick = isAdmUser ? '테스터02' : user.nickname
      const effectiveSenderId = isAdmUser ? 'u-tester-02' : (user?.id || 'u-tester-02')

      // 상대방 닉네임 및 ID 정규화 (절대로 '나 (이웃)'이나 '나'로 매핑되지 않도록 방어)
      let targetNick = room.nickname
      if (!targetNick || targetNick === '나 (이웃)' || targetNick === '나' || targetNick === '이웃') {
        targetNick = effectiveSenderNick === '테스터02' ? '테스트01' : '테스터02'
      }
      let targetId = (room as any).authorId
      if (!targetId || targetId === 'my-user-id' || targetId === 'usr_guest') {
        targetId = targetNick === '테스트01' ? 'u-tester-01' : 'u-tester-02'
      }

      // 서버 1:1 채팅방 생성 및 실시간 동기화
      let serverRoom: any = null
      try {
        serverRoom = await createDirectChat(targetNick, room.title, room.entryFee, {
          senderNickname: effectiveSenderNick,
          senderAccountId: effectiveSenderId,
          userId: effectiveSenderId,
          targetNickname: targetNick,
          targetUserId: targetId,
        })
      } catch (e) {
        console.warn('createDirectChat fallback:', e)
      }

      const roomId = serverRoom?.id || (existing ? existing.id : 'chat-suda-' + room.id)

      if (socketRef.current) {
        socketRef.current.emit('chat:join', { chatId: roomId, userId: effectiveSenderId, nickname: effectiveSenderNick })
        // 상대방에게 입장 환영 및 새 방 개설 알림 브로드캐스트 -> 상대방 모바일 앱 대화함에 실시간 생성 & '모꼬' 알림음 울림
        const welcomeClientMsgId = 'm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
        mySentMessageIdsRef.current.add(welcomeClientMsgId)
        socketRef.current.emit('chat:message', {
          id: welcomeClientMsgId,
          clientMessageId: welcomeClientMsgId,
          chatId: roomId,
          content: `안녕하세요! "${room.title || room.content}" 보고 입장했습니다 😊`,
          targetUserId: targetId,
          targetNickname: targetNick,
          senderAccountId: effectiveSenderId,
          senderName: effectiveSenderNick,
          senderNickname: effectiveSenderNick,
        })
      }

      // 1:1 대화방 개설 및 연결
      if (existing) {
        const updated = { ...existing, id: roomId, targetNickname: targetNick, targetUserId: targetId }
        setActiveChatRoom(updated)
      } else {
        const newRoomItem: ChatRoomItem = {
          id: roomId,
          type: 'SUDA',
          targetNickname: targetNick,
          targetUserId: targetId,
          targetAvatar: room.avatar,
          lastMessage: room.title || room.content,
          lastTime: '방금',
          unreadCount: 0,
          messages: [
            {
              id: 'init-msg-' + Date.now(),
              senderId: 'target',
              senderNickname: room.nickname,
              text: `안녕하세요! "${room.title || room.content}" 수다방 보고 입장했습니다 😊 반가워요!`,
              time: '방금',
            },
          ],
        }
        const updatedList = [newRoomItem, ...chatRooms.filter((r) => r.id !== newRoomItem.id)]
        setChatRooms(updatedList)
        try {
          localStorage.setItem('mocco_custom_chat_rooms', JSON.stringify(updatedList))
        } catch (e) {}
        setActiveChatRoom(newRoomItem)
        setChatSubTab('CHATS')
      }
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
              likes: nextLiked ? (p.likes || 0) + 1 : Math.max(0, (p.likes || 0) - 1),
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
      allowLiveSale: newUsedAllowLive,
    }
    setUsedProducts([newItem, ...usedProducts])
    setIsNewUsedModalOpen(false)
    setNewUsedTitle('')
    setNewUsedPrice('')
    setNewUsedDesc('')
    toast({
      title: '🥕 중고물품 등록 완료!',
      description: '중고거래 마켓 목록에 성공적으로 등록되었습니다.',
    })
  }

  // 1:1 Chat Send
  const handleSendMessage = async () => {
    if (!chatInputText.trim() || !activeChatRoom) return
    const text = chatInputText.trim()
    const isAdmUser = !user?.nickname || ['super admin', 'admin', 'admin_super_user', '관리자', '슈퍼어드민'].includes(String(user.nickname).trim().toLowerCase())
    const senderNickname = isAdmUser ? '테스터02' : user.nickname
    const senderId = isAdmUser ? 'u-tester-02' : (user?.id || 'u-tester-02')
    const clientMsgId = 'm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
    mySentMessageIdsRef.current.add(clientMsgId)

    const newMsg: ChatMessageItem = {
      id: clientMsgId,
      senderId: senderId,
      senderNickname: senderNickname,
      text: text,
      time: '방금',
      isMe: true,
      unread: true,
    }
    const updatedRoom: ChatRoomItem = {
      ...activeChatRoom,
      lastMessage: text,
      lastTime: '방금',
      messages: [...activeChatRoom.messages, newMsg],
    }
    setActiveChatRoom(updatedRoom)
    const updatedChatList = chatRooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r))
    setChatRooms(updatedChatList)
    try {
      localStorage.setItem('mocco_custom_chat_rooms', JSON.stringify(updatedChatList))
    } catch (e) {
      console.warn('Failed to save chat rooms to localStorage', e)
    }
    setChatInputText('')

    // 백엔드 REST API 및 Socket.io 실시간 전송
    try {
      await sendChatMessage(activeChatRoom.id, text, {
        clientMessageId: clientMsgId,
        targetUserId: activeChatRoom.targetNickname,
        senderNickname: senderNickname,
        senderId: senderId,
      })
    } catch (e) {
      console.warn('sendChatMessage API error:', e)
    }

    if (socketRef.current) {
      socketRef.current.emit('chat:message', {
        id: clientMsgId,
        clientMessageId: clientMsgId,
        chatId: activeChatRoom.id,
        content: text,
        targetUserId: activeChatRoom.targetNickname,
        senderNickname: senderNickname,
        senderId: senderId,
      })
    }
  }

  // Send Gift inside Mobile Phone Mockup Chat & Trigger 3D Effect
  const handleSendGift = (gift: MoccoChatGiftItem) => {
    requireAuth(() => {
      if (!activeChatRoom) return
      if (myPoints < gift.pricePoints) {
        toast({
          title: '🍯 꿀떡이 부족합니다',
          description: `선물 후원에 필요한 꿀떡이 부족합니다. (필요: ${gift.pricePoints.toLocaleString()}개 / 보유: ${myPoints.toLocaleString()}개) 무료 충전소 또는 상점으로 이동합니다.`,
          variant: 'destructive',
        })
        setIsPointChargeModalOpen(true)
        return
      }

      setMyPoints((prev) => prev - gift.pricePoints)

      // 3D Gift Effect 재생
      setLiveGiftEffect({
        name: gift.name,
        icon: gift.icon || '🎁',
        description: gift.description || '',
        sender: user?.nickname || '나',
        amount: gift.pricePoints,
      })
      setTimeout(() => {
        setLiveGiftEffect(null)
      }, 4000)
      setIsGiftPickerOpen(false)

      const isAdmUser = !user?.nickname || ['super admin', 'admin', 'admin_super_user', '관리자', '슈퍼어드민'].includes(String(user.nickname).trim().toLowerCase())
      const effectiveSenderNick = isAdmUser ? '테스터02' : user.nickname
      const effectiveSenderId = isAdmUser ? 'u-tester-02' : (user?.id || 'u-tester-02')

      const giftMsg: ChatMessageItem = {
        id: 'msg-gift-' + Date.now(),
        senderId: effectiveSenderId,
        senderNickname: effectiveSenderNick,
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

      // 실시간 소켓으로 선물 이벤트 전파 -> 모바일 앱에서 GIFT_OVERLAY_TRIGGER 및 3D 선물 이펙트 즉시 실행
      if (socketRef.current) {
        socketRef.current.emit('chat:message', {
          chatId: activeChatRoom.id,
          type: 'gift',
          content: `🎁 [선물] ${gift.name} (${gift.pricePoints.toLocaleString()} 꿀떡)`,
          giftName: gift.name,
          giftPoints: gift.pricePoints,
          gift: {
            id: gift.id,
            name: gift.name,
            amount: gift.pricePoints,
            description: gift.description,
            icon: gift.icon,
          },
          senderAccountId: effectiveSenderId,
          senderNickname: effectiveSenderNick,
          senderName: effectiveSenderNick,
          targetUserId: activeChatRoom.targetUserId || activeChatRoom.targetNickname,
        })
      }

      // 백엔드 API에 선물 전송 기록 영속화
      // 백엔드 REST API에 정식 선물 전송 (본인 꿀떡 차감 + 상대방 꿀떡 적립 + 선물 메시지 영속화)
      sendChatGift({
        chatId: activeChatRoom.id,
        points: gift.pricePoints,
        giftName: gift.name,
        giftId: gift.id,
        senderAccountId: effectiveSenderId,
        senderNickname: effectiveSenderNick,
        receiverId: activeChatRoom.targetUserId || activeChatRoom.targetNickname,
        targetUserId: activeChatRoom.targetUserId || activeChatRoom.targetNickname,
        icon: gift.icon || '🎁',
      }).catch((e) => console.warn('sendChatGift error:', e))
      // 화려한 3D 축제 이펙트 발동!
      setActiveGiftEffect({
        name: gift.name,
        icon: gift.icon || '🎁',
        text: gift.description || '',
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
        const updatedList = [newRoom, ...chatRooms.filter((r) => r.id !== newRoom.id)]
        setChatRooms(updatedList)
        try {
          localStorage.setItem('mocco_custom_chat_rooms', JSON.stringify(updatedList))
        } catch (e) {}
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
                      ? 'bg-white text-[#FF3B6B] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Store className={`h-4 w-4 ${activeTab === 'MARKET' ? 'text-[#FF3B6B]' : 'text-slate-500'}`} />
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

                {/* 4. 모꼬챗 */}
                <button
                  onClick={() => setActiveTab('CHAT')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'CHAT'
                      ? 'bg-white text-[#FF3B6B] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageCircle className={`h-4 w-4 ${activeTab === 'CHAT' ? 'text-[#FF3B6B]' : 'text-slate-500'}`} />
                  <span>모꼬챗</span>
                  {isAuthenticated && <span className="rounded-full bg-[#FF3B6B] px-1 text-[9px] text-white">1</span>}
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
                  {/* User Profile Info & Logout */}
                  <div className="flex items-center gap-2">
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

                    {/* 8-Card Live Grid (2 rows x 4 cols) - 실시간 방송이 부족할 경우 모꼬 방송 준비중 카드로 슬롯을 채워 균형 유지 */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 flex-1">
                      {lives.slice(0, 8).map((live) => (
                        <div
                          key={live.id}
                          onClick={() => requireAuth(() => setActiveLiveModal(live))}
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
                            <div 
    onClick={(e) => {
      e.stopPropagation()
      openUserProfileModal({
        id: live.id,
        nickname: live.hostNickname,
        avatar: live.hostAvatar,
        region: '서울 강남구 역삼동',
        isLive: true,
        liveTitle: live.title,
        headline: `모꼬 LIVE에서 "${live.title}" 방송 중입니다 🎙️`,
      })
    }}
    className="flex items-center gap-2 cursor-pointer group/host hover:opacity-90"
  >
    <div className="relative shrink-0 w-8 h-8 rounded-full overflow-hidden border-2 border-pink-400 bg-slate-100 shadow-2xs">
      <img
        src={live.hostAvatar}
        alt={live.hostNickname}
        className="w-full h-full object-cover block"
        style={{ width: 32, height: 32, objectFit: 'cover' }}
      />
      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
    </div>
    <span className="text-xs font-bold text-slate-800 group-hover/host:text-pink-600 transition truncate">
      {live.hostNickname}
    </span>
  </div>
                            <h4 className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-[#FF3B6B] transition-colors leading-tight">
                              {live.title}
                            </h4>
                          </div>
                        </div>
                      ))}
                      {/* 방송 개수가 8개 미만일 때 모꼬 방송 준비중 카드로 슬롯을 채움 */}
                      {Array.from({ length: Math.max(0, 8 - lives.slice(0, 8).length) }).map((_, idx) => (
                        <MoccoLiveStandbyCard key={`standby-live-home-${idx}`} index={lives.slice(0, 8).length + idx + 1} />
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
                                if (target) requireAuth(() => setActiveLiveModal(target))
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
                          onClick={() => router.push('/market/' + item.id)}
                          className="group overflow-hidden rounded-3xl cursor-pointer hover:shadow-lg transition-all border border-slate-200/80 bg-white flex flex-col justify-between"
                        >
                          <div>
                            <div className="aspect-square w-full bg-slate-100 overflow-hidden relative">
                              <img
                                src={resolveDisplayImageUrl(item.images[0], item.category)}
                                alt={item.title}
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src = getCategoryFallbackImage(item.category)
                                }}
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
                  {/* 공구 상품 부족 시 공구 준비중 스탠바이 카드로 4개 채움 */}
                  {(() => {
                    const groupItems = marketProducts.filter((p) => p.type === 'B2C_GROUP').slice(0, 4)
                    const needed = Math.max(0, 4 - groupItems.length)
                    return Array.from({ length: needed }).map((_, idx) => (
                      <MoccoGroupBuyStandbyCard key={`standby-group-${idx}`} index={groupItems.length + idx + 1} />
                    ))
                  })()}
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
                    {(() => {
                      const displayFriends = friends.slice(0, 6)
                      const remainingCount = Math.max(0, 6 - displayFriends.length)
                      return (
                        <>
                          {displayFriends.map((friend) => (
                            <div
                              key={friend.id}
                              className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
                            >
                              <div onClick={() => openUserProfileModal(friend)} className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group/avatar">
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

                          {/* 빈자리 슬롯 1: 동네 설정 반경 확대 카드 */}
                          {remainingCount >= 2 && (
                            <div className="py-2.5 flex items-center justify-between gap-3 group bg-slate-50/70 p-3 rounded-2xl border border-dashed border-slate-200">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="h-11 w-11 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0">
                                  <Users className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-sm text-slate-900">더 많은 동네 이웃 찾기</span>
                                    <Badge className="bg-purple-50 text-purple-700 text-[10px] font-bold">반경 확대</Badge>
                                  </div>
                                  <p className="text-xs text-slate-500 truncate">동네 반경을 넓혀 새로운 이웃들을 만나보세요.</p>
                                </div>
                              </div>
                              <button
                                onClick={() => toast({ title: '📍 동네 설정', description: '내 동네 반경이 최대 5km로 확장되었습니다.' })}
                                className="shrink-0 border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-full px-3 py-1.5 text-xs font-bold transition-all"
                              >
                                동네설정
                              </button>
                            </div>
                          )}

                          {/* 빈자리 슬롯 2: 모꼬 AI 챗봇 친구 */}
                          {remainingCount >= 1 && (
                            <div className="py-2.5 flex items-center justify-between gap-3 group bg-rose-50/40 p-3 rounded-2xl border border-dashed border-rose-200">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="h-11 w-11 rounded-full bg-rose-100 flex items-center justify-center text-[#FF3B6B] font-bold shrink-0">
                                  <Sparkles className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-sm text-slate-900">모꼬 AI 챗봇 친구</span>
                                    <Badge className="bg-rose-50 text-[#FF3B6B] text-[10px] font-bold">24시 대기</Badge>
                                  </div>
                                  <p className="text-xs text-slate-500 truncate">언제든 심심할 때 반갑게 맞아주는 따뜻한 AI 친구</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setActiveTab('CHAT')
                                  setChatSubTab('CHATS')
                                }}
                                className="shrink-0 border border-rose-200 text-[#FF3B6B] bg-rose-50 hover:bg-rose-100 rounded-full px-3 py-1.5 text-xs font-bold transition-all"
                              >
                                대화하기
                              </button>
                            </div>
                          )}
                        </>
                      )
                    })()}
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
                    {(() => {
                      const displayPosts = sudaPosts.slice(0, 4)
                      const remainingCount = Math.max(0, 4 - displayPosts.length)

                      // 추천 수다 키워드 리스트
                      const SUGGESTED_KEYWORDS = [
                        '#강남역_맛집 🍜',
                        '#오늘_퇴근길 🏃',
                        '#반려견_산책 🐶',
                        '#주말_취미 🎨',
                        '#소소한_일상 ☕',
                      ]

                      return (
                        <>
                          {displayPosts.map((post) => (
                            <div
                              key={post.id}
                              className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs hover:border-rose-200 transition-colors space-y-2 flex-1 flex flex-col justify-center"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div onClick={() => openUserProfileModal(post)} className="flex items-center gap-2.5 min-w-0 cursor-pointer group/postuser">
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

                          {/* 슬롯 1: ✍️ 첫 번째 수다 작성 참여 유도 카드 */}
                          {remainingCount >= 1 && (
                            <div className="bg-gradient-to-r from-rose-50/60 to-pink-50/60 rounded-2xl border border-rose-200/70 p-3.5 shadow-2xs space-y-2 flex-1 flex flex-col justify-center">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="h-10 w-10 rounded-full bg-rose-100/90 flex items-center justify-center text-[#FF3B6B] shrink-0 font-black shadow-2xs">
                                    ✍️
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-extrabold text-sm text-slate-900">
                                        첫 번째 수다의 주인공이 되어보세요!
                                      </span>
                                      <Badge className="bg-rose-100 text-[#FF3B6B] border border-rose-200 text-[10px] font-bold">
                                        추천
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-slate-600 truncate">
                                      오늘 어떤 하루를 보내셨나요? 소소한 일상을 공유해보세요.
                                    </p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => setIsCreateSudaRoomOpen(true)}
                                  className="shrink-0 flex items-center gap-1.5 bg-[#FF3B6B] hover:bg-[#E02958] text-white rounded-full px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  수다글 쓰기
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 슬롯 2: 🏷️ 오늘의 실시간 인기 수다 키워드 카드 */}
                          {remainingCount >= 2 && (
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs space-y-2 flex-1 flex flex-col justify-center">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <Sparkles className="h-4 w-4 text-amber-500" />
                                  <span className="font-extrabold text-xs text-slate-800">
                                    오늘의 인기 수다 키워드 (클릭하여 바로 작성)
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">터치 시 자동 입력</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {SUGGESTED_KEYWORDS.map((tag) => (
                                  <button
                                    key={tag}
                                    onClick={() => {
                                      const cleanTag = tag.split(' ')[0]
                                      setNewRoomTitle(`${cleanTag} 수다 나눌 이웃 구해요!`)
                                      setIsCreateSudaRoomOpen(true)
                                    }}
                                    className="bg-slate-100 hover:bg-rose-50 hover:text-[#FF3B6B] hover:border-rose-200 border border-slate-200 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all"
                                  >
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 슬롯 3: ☕ 1:1 수다방 열기 카드 */}
                          {remainingCount >= 3 && (
                            <div className="bg-gradient-to-r from-indigo-50/60 to-purple-50/60 rounded-2xl border border-indigo-200/70 p-3.5 shadow-2xs space-y-2 flex-1 flex flex-col justify-center">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 font-black shadow-2xs">
                                    ☕
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-extrabold text-sm text-slate-900">
                                        동네 이웃과 1:1 따뜻한 커피 한 잔
                                      </span>
                                      <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                                        1:1 소통
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-slate-600 truncate">
                                      가까운 이웃과 편안하게 실시간 1:1 대화로 소통을 시작해보세요.
                                    </p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => setIsCreateSudaRoomOpen(true)}
                                  className="shrink-0 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  수다방 열기
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 슬롯 4: 🍯 모꼬 매너 수다 가이드 카드 */}
                          {remainingCount >= 4 && (
                            <div className="bg-amber-50/40 rounded-2xl border border-amber-200/60 p-3.5 shadow-2xs space-y-1.5 flex-1 flex flex-col justify-center">
                              <div className="flex items-center gap-2">
                                <span className="text-base">🍯</span>
                                <span className="font-bold text-xs text-amber-900">
                                  모꼬 매너 수다 꿀팁
                                </span>
                              </div>
                              <p className="text-xs text-amber-800 leading-relaxed pl-6">
                                서로를 존중하는 따뜻한 첫인사가 즐겁고 행복한 인연의 시작입니다 ✨
                              </p>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* 3) 중고거래 (4칸 - 실시간 서버 연동) */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-[#FF3B6B]" />
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                      중고거래
                    </h3>
                    <Badge className="bg-pink-50 text-[#FF3B6B] border border-pink-200 text-[10px] font-bold">
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
                    className="text-xs text-[#FF3B6B] hover:text-[#E02956] hover:bg-pink-50 font-semibold"
                  >
                    중고 더보기
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>

                {/* 4-Card Used Market Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {usedProducts.slice(0, 4).map((item) => (
                    <Card
                      key={item.id}
                      onClick={() => router.push('/market/used/' + item.id)}
                      className="group overflow-hidden rounded-3xl cursor-pointer hover:shadow-md transition-shadow border border-slate-200/80 bg-white"
                    >
                      <div className="aspect-square w-full bg-slate-100 overflow-hidden relative">
                        <img
                          src={resolveDisplayImageUrl(item.images[0], item.category)}
                          alt={item.title}
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = getCategoryFallbackImage(item.category)
                          }}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <Badge className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] font-semibold border-none">
                          {item.locationName.split(' ')[1] || item.locationName}
                        </Badge>
                      </div>
                      <CardContent className="p-3.5 space-y-1">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-[#FF3B6B] transition-colors">
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
                  {/* 기본 4개 박스 유지: 상품이 4개 미만일 때 '가지고 계신 중고 판매해 보세요' 카드로 자동 패딩 */}
                  {Array.from({ length: Math.max(0, 4 - usedProducts.slice(0, 4).length) }).map((_, idx) => (
                    <MoccoUsedSellStandbyCard
                      key={`standby-home-used-${idx}`}
                      index={usedProducts.slice(0, 4).length + idx + 1}
                      onClick={() => requireAuth(() => setIsNewUsedModalOpen(true))}
                    />
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
                        onClick={() => router.push('/market/' + item.id)}
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
                {/* 3 Subtabs on the Left */}
                <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
                  <button
                    onClick={() => setMarketSubTab('C2C_USED')}
                    className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-sm sm:text-base font-extrabold transition-all ${
                      marketSubTab === 'C2C_USED'
                        ? 'bg-white text-[#FF3B6B] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>중고거래</span>
                  </button>
                  <button
                    onClick={() => setMarketSubTab('B2C_NORMAL')}
                    className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-sm sm:text-base font-extrabold transition-all ${
                      marketSubTab === 'B2C_NORMAL'
                        ? 'bg-white text-[#FF3B6B] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>마켓상품</span>
                  </button>
                  <button
                    onClick={() => setMarketSubTab('B2C_GROUP')}
                    className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-sm sm:text-base font-extrabold transition-all ${
                      marketSubTab === 'B2C_GROUP'
                        ? 'bg-white text-[#FF3B6B] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                    <span>공동구매</span>
                  </button>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2">
                  {marketSubTab === 'C2C_USED' && (
                    <Button
                      onClick={() => {
                        requireAuth(() => router.push('/market/used/new'))
                      }}
                      className="bg-[#FF3B6B] hover:bg-[#E02956] text-white text-xs sm:text-sm font-bold h-9 sm:h-10 px-4 shadow-sm rounded-xl transition-colors"
                    >
                      <PlusCircle className="h-4 w-4 mr-1.5" />
                      중고 물품 판매 등록
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
                    {(() => {
                      const top5 = marketProducts
                        .filter((p) => p.type === 'B2C_NORMAL')
                        .sort((a, b) => {
                          const scoreA = (a.orderCount || 0) * 0.5 + (a.salesCount || 0) * 0.3 + (a.rating || 0) * 20
                          const scoreB = (b.orderCount || 0) * 0.5 + (b.salesCount || 0) * 0.3 + (b.rating || 0) * 20
                          return scoreB - scoreA
                        })
                        .slice(0, 5)
                      const needed = Math.max(0, 5 - top5.length)
                      return (
                        <>
                          {top5.map((item, idx) => {
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
                                onClick={() => router.push('/market/' + item.id)}
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
                                    router.push('/market/' + item.id)
                                  }}
                                  className="w-full mt-3 py-1.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1 transition-all"
                                >
                                  <ShoppingBag className="h-3 w-3 text-slate-500 group-hover:text-purple-600" />
                                  <span>담기</span>
                                </button>
                              </div>
                            )
                          })}
                          {Array.from({ length: needed }).map((_, idx) => (
                            <MoccoMarketStandbyCard key={`standby-top5-market-${idx}`} index={top5.length + idx + 1} />
                          ))}
                        </>
                      )
                    })()}
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
                    {(() => {
                      const top5Group = marketProducts
                        .filter((p) => p.type === 'B2C_GROUP')
                        .sort((a, b) => {
                          const rateA = (a.currentQuantity || 0) / (a.targetQuantity || 1)
                          const rateB = (b.currentQuantity || 0) / (b.targetQuantity || 1)
                          return rateB - rateA
                        })
                        .slice(0, 5)
                      const needed = Math.max(0, 5 - top5Group.length)
                      return (
                        <>
                          {top5Group.map((item, idx) => {
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
                                onClick={() => router.push('/market/' + item.id)}
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
                                    router.push('/market/' + item.id)
                                  }}
                                  className="w-full mt-3 py-1.5 rounded-xl bg-rose-50 text-[#FF3B6B] border border-rose-200 hover:bg-gradient-to-r hover:from-[#FF3B6B] hover:to-[#8B5CF6] hover:text-white hover:border-transparent text-[11px] font-bold flex items-center justify-center gap-1 transition-all duration-300 shadow-2xs hover:shadow-md"
                                >
                                  <Flame className="h-3 w-3" />
                                  <span>공구 참여</span>
                                </button>
                              </div>
                            )
                          })}
                          {Array.from({ length: needed }).map((_, idx) => (
                            <MoccoGroupBuyStandbyCard key={`standby-top5-group-${idx}`} index={top5Group.length + idx + 1} />
                          ))}
                        </>
                      )
                    })()}
                  </div>
                </section>
              )}

              {/* Market Products Display */}
              {marketSubTab === 'C2C_USED' ? (
                /* 1) C2C Used Grid - 4칸 단위 유지 및 판매 유도 스탠바이 카드 자동 패딩 */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {(() => {
                    const filteredUsed = usedProducts
                      .filter((item) => {
                        const matchCategory = marketCategoryFilter === '전체' ? true : item.category.includes(marketCategoryFilter)
                        const matchSearch = !searchQuery.trim() ? true : (item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase()))
                        return matchCategory && matchSearch
                      })
                    const targetCount = Math.max(4, Math.ceil(filteredUsed.length / 4) * 4)
                    const needed = Math.max(0, targetCount - filteredUsed.length)

                    return (
                      <>
                        {filteredUsed.map((item) => (
                          <Card
                            key={item.id}
                            onClick={() => router.push('/market/used/' + item.id)}
                            className="group overflow-hidden rounded-3xl cursor-pointer hover:shadow-lg transition-all border border-slate-200/80"
                          >
                            <div className="aspect-square w-full bg-slate-100 overflow-hidden relative">
                              <img
                                src={resolveDisplayImageUrl(item.images[0], item.category)}
                                alt={item.title}
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src = getCategoryFallbackImage(item.category)
                                }}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <Badge className="absolute top-2 left-2 bg-[#FF3B6B] text-white text-[10px] font-bold border-none">
                                중고
                              </Badge>
                              <Badge className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-semibold border-none">
                                {item.locationName}
                              </Badge>
                            </div>
                            <CardContent className="p-3.5 space-y-2">
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-[#FF3B6B] transition-colors">
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
                                  <span className="flex items-center gap-0.5"><Heart className="w-3 h-3 text-[#FF3B6B]" /> {item.likesCount}</span>
                                  <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3 text-slate-400" /> {item.chatsCount}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {Array.from({ length: needed }).map((_, idx) => (
                          <MoccoUsedSellStandbyCard
                            key={`standby-market-used-grid-${idx}`}
                            index={filteredUsed.length + idx + 1}
                            onClick={() => requireAuth(() => setIsNewUsedModalOpen(true))}
                          />
                        ))}
                      </>
                    )
                  })()}
                </div>
              ) : marketSubTab === 'B2C_GROUP' ? (
                /* 2) 🔥 공동구매 그리드 (홈 화면의 특가공구 프리미엄 박스 디자인과 100% 동일한 완성도) - 공구 상품 부족 시 스탠바이 카드로 자동 패딩 */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {(() => {
                    const filteredGroup = marketProducts
                      .filter((p) => p.type === 'B2C_GROUP')
                      .filter((p) => {
                        const matchCategory = marketCategoryFilter === '전체' ? true : p.category.includes(marketCategoryFilter)
                        const matchSearch = !searchQuery.trim() ? true : (p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()) || p.sellerName.toLowerCase().includes(searchQuery.toLowerCase()))
                        return matchCategory && matchSearch
                      })
                    const targetCount = Math.max(8, Math.ceil(filteredGroup.length / 4) * 4)
                    const needed = Math.max(0, targetCount - filteredGroup.length)

                    return (
                      <>
                        {filteredGroup.map((item) => {
                          const target = item.targetQuantity || 30
                          const current = item.currentQuantity || 22
                          const rate = Math.round((current / target) * 100)
                          const discountRate = item.originalPrice
                            ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                            : 35

                          return (
                            <Card
                              key={item.id}
                              onClick={() => router.push('/market/' + item.id)}
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
                        {Array.from({ length: needed }).map((_, idx) => (
                          <MoccoGroupBuyStandbyCard key={`standby-market-group-grid-${idx}`} index={filteredGroup.length + idx + 1} />
                        ))}
                      </>
                    )
                  })()}
                </div>
              ) : (
                /* 3) 🛍️ 일반 마켓상품 그리드 (B2C_NORMAL) - 상품 부족 시 모꼬 마켓 스탠바이 카드로 자동 패딩 */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {(() => {
                    const filteredNormal = marketProducts
                      .filter((p) => p.type === 'B2C_NORMAL')
                      .filter((p) => {
                        const matchCategory = marketCategoryFilter === '전체' ? true : p.category.includes(marketCategoryFilter)
                        const matchSearch = !searchQuery.trim() ? true : (p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()) || p.sellerName.toLowerCase().includes(searchQuery.toLowerCase()))
                        return matchCategory && matchSearch
                      })
                    const targetCount = Math.max(8, Math.ceil(filteredNormal.length / 4) * 4)
                    const needed = Math.max(0, targetCount - filteredNormal.length)

                    return (
                      <>
                        {filteredNormal.map((item) => {
                          const discountRate = item.originalPrice
                            ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                            : 20

                          return (
                            <Card
                              key={item.id}
                              onClick={() => router.push('/market/' + item.id)}
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
                        {Array.from({ length: needed }).map((_, idx) => (
                          <MoccoMarketStandbyCard key={`standby-market-normal-grid-${idx}`} index={filteredNormal.length + idx + 1} />
                        ))}
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 3: 🔴 모꼬 LIVE (LIVE) - 실시간 핫 라이브 & 베스트 순위 1·2·3위 포디움 & 통합 랭킹 */}
          {/* ======================================================= */}
          {activeTab === 'LIVE' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 1) Live Top Smart Premium Banner (잡다한 설명 배제, 감각적인 프리미엄 비주얼 배너) */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950 via-purple-950 to-slate-950 p-6 sm:p-7 text-white shadow-xl border border-rose-900/40">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
                      <Badge className="bg-rose-600 text-white font-black px-2.5 py-0.5 border-none text-[11px] shadow-sm">
                        MOCCO LIVE ON-AIR
                      </Badge>
                      <span className="text-xs text-rose-300 font-bold">
                        1:N 대중 방송부터 1:1 프라이빗 라이브까지
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                      <span>실시간 라이브 & 핀 상품 쇼핑</span>
                      <span className="text-lg">🔴🛍️</span>
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 text-xs">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-slate-200 font-bold">📱 방송 송출은 모바일 앱 전용입니다</span>
                    </div>

                    {role !== 'CREATOR' && role !== 'ADMIN' && (
                      <Button
                        onClick={() => {
                          requireAuth(() => openCreatorModal())
                        }}
                        variant="outline"
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold h-9 px-3.5 rounded-xl transition-all"
                      >
                        <Mic className="h-4 w-4 mr-1 text-purple-300" />
                        크리에이터 신청
                      </Button>
                    )}
                  </div>
                </div>

                {/* 은은한 배경 글로우 장식 */}
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
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
                            onClick={() => requireAuth(() => setActiveLiveModal(item))}
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
                              <div 
    onClick={(e) => {
      e.stopPropagation()
      openUserProfileModal({
        id: item.id,
        nickname: item.hostNickname,
        avatar: item.hostAvatar,
        region: '서울 강남구 역삼동',
        isLive: true,
        liveTitle: item.title,
        headline: `모꼬 LIVE에서 "${item.title}" 방송 중입니다 🎙️`,
      })
    }}
    className="flex items-center gap-2.5 cursor-pointer group/host hover:opacity-90"
  >
    <div className="relative shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-sky-400 bg-slate-100 shadow-xs">
      <img
        src={item.hostAvatar}
        alt={item.hostNickname}
        className="w-full h-full object-cover block"
        style={{ width: 40, height: 40, objectFit: 'cover' }}
      />
      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
    </div>
    <span className="text-sm font-black text-slate-900 group-hover/host:text-sky-600 transition truncate">
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
                            onClick={() => requireAuth(() => setActiveLiveModal(item))}
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
                              <div 
    onClick={(e) => {
      e.stopPropagation()
      openUserProfileModal({
        id: item.id,
        nickname: item.hostNickname,
        avatar: item.hostAvatar,
        region: '서울 강남구 삼성동',
        isLive: true,
        liveTitle: item.title,
        headline: `모꼬 LIVE 1위 크리에이터 "${item.hostNickname}" 입니다! 🏆`,
      })
    }}
    className="flex items-center gap-2.5 cursor-pointer group/host hover:opacity-90"
  >
    <div className="relative shrink-0">
      <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-amber-400 bg-slate-100 shadow-md">
        <img
          src={item.hostAvatar}
          alt={item.hostNickname}
          className="w-full h-full object-cover block"
          style={{ width: 44, height: 44, objectFit: 'cover' }}
        />
      </div>
      <Crown className="h-4 w-4 absolute -top-1.5 -right-1.5 text-amber-500 fill-amber-400 drop-shadow-sm" />
    </div>
    <span className="text-sm font-black text-slate-900 group-hover/host:text-rose-600 transition truncate">
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
                            onClick={() => requireAuth(() => setActiveLiveModal(item))}
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
                              <div 
    onClick={(e) => {
      e.stopPropagation()
      openUserProfileModal({
        id: item.id,
        nickname: item.hostNickname,
        avatar: item.hostAvatar,
        region: '서울 강남구 논현동',
        isLive: true,
        liveTitle: item.title,
        headline: `모꼬 LIVE에서 "${item.title}" 방송 중입니다 🎙️`,
      })
    }}
    className="flex items-center gap-2.5 cursor-pointer group/host hover:opacity-90"
  >
    <div className="relative shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-orange-400 bg-slate-100 shadow-xs">
      <img
        src={item.hostAvatar}
        alt={item.hostNickname}
        className="w-full h-full object-cover block"
        style={{ width: 40, height: 40, objectFit: 'cover' }}
      />
      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
    </div>
    <span className="text-sm font-black text-slate-900 group-hover/host:text-orange-600 transition truncate">
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            refreshLiveRooms()
                            toast({ title: '라이브 목록 갱신', description: '최신 방송 목록을 불러왔습니다.' })
                          }}
                          className="h-6 text-[11px] px-2 rounded-lg border-rose-200 text-rose-700 hover:bg-rose-50 flex items-center gap-1 font-bold"
                        >
                          <RotateCcw className="h-3 w-3" />
                          새로고침
                        </Button>
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

                    {/* Live Rooms Grid: 옆으로 퍼져보이지 않도록 4칸(grid-cols-2 sm:grid-cols-3 xl:grid-cols-4)으로 확대 & 방송 부족 시 스탠바이 카드로 자동 패딩 */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
                      {(() => {
                        const filteredLives = lives.filter((live) => (liveCategoryFilter === '전체' ? true : live.category.includes(liveCategoryFilter)))
                        const targetCount = Math.max(8, Math.ceil(filteredLives.length / 4) * 4)
                        const needed = Math.max(0, targetCount - filteredLives.length)

                        return (
                          <>
                            {filteredLives.map((live) => (
                              <Card
                                key={live.id}
                                onClick={() => requireAuth(() => setActiveLiveModal(live))}
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
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openUserProfileModal({
                                        id: live.id,
                                        nickname: live.hostNickname,
                                        avatar: live.hostAvatar,
                                        region: '서울 강남구',
                                        isLive: true,
                                        liveTitle: live.title,
                                        headline: `모꼬 LIVE에서 "${live.title}" 방송 중입니다 🎙️`,
                                      })
                                    }}
                                    className="flex items-center gap-2 cursor-pointer group/host hover:opacity-90"
                                  >
                                    <div className="relative shrink-0 w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs">
                                      <img
                                        src={live.hostAvatar}
                                        alt={live.hostNickname}
                                        className="w-full h-full object-cover block"
                                        style={{ width: 36, height: 36, objectFit: 'cover' }}
                                      />
                                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-800 group-hover/host:text-[#FF3B6B] transition truncate">
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
                            {Array.from({ length: needed }).map((_, idx) => (
                              <MoccoLiveStandbyCard key={`standby-live-grid-${idx}`} index={filteredLives.length + idx + 1} />
                            ))}
                          </>
                        )
                      })()}
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
              {/* 1) Chat Top Smart Premium Banner (잡다한 설명 배제, 풍성하고 세련된 비주얼 배너) */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 p-6 sm:p-7 text-white shadow-xl border border-blue-900/50">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-blue-400 animate-ping" />
                      <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black px-2.5 py-0.5 border-none text-[11px] shadow-sm">
                        MOCCO CHAT
                      </Badge>
                      <span className="text-xs text-blue-300 font-bold">
                        이웃과 나누는 프라이빗 1:1 소통
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                      <span>실시간 1:1 대화 & 3D 선물 페스티벌</span>
                      <span className="text-lg">🎁✨</span>
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-right">
                      <span className="text-[10px] text-blue-200 block font-bold">내 보유 꿀떡</span>
                      <span className="text-sm sm:text-base font-black text-amber-300">
                        {myPoints.toLocaleString()} 개
                      </span>
                    </div>

                    <Button
                      onClick={() => requireAuth(() => setIsPointChargeModalOpen(true))}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs h-10 px-4 rounded-xl shadow-lg transition-all flex items-center"
                    >
                      <Coins className="h-4 w-4 mr-1.5" />
                      꿀떡 무료 충전
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
                  {/* 상단 3대 서브탭 버튼 ("친구들" / "전체수다" / "대화함") */}
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
                              <div 
      onClick={(e) => {
        e.stopPropagation()
        openUserProfileModal(friend)
      }} 
      className="relative shrink-0 cursor-pointer group/favatar"
      title="프로필 보기"
    >
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
                      {/* 1) 1:1 수다방 개설 바 (불필요한 장황한 문구 제거, 입장 비용 직접 입력 인풋, 깔끔한 모꼬 테마 색상) */}
                      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          {/* 방 제목 입력 인풋 */}
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={sudaInputText}
                              onChange={(e) => setSudaInputText(e.target.value)}
                              placeholder="1:1 수다방 제목을 입력하세요 (예: 강남역에서 맥주 한잔 마실 분 🍺)"
                              className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl px-3.5 py-2.5 text-xs font-medium border border-slate-200 focus:border-[#FF3B6B] focus:ring-1 focus:ring-rose-200 focus:outline-none transition"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateSudaRoom()
                              }}
                            />
                          </div>
                          
                          {/* 입장 비용 직접 입력 필드 */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                              <span className="text-[11px] font-bold text-slate-500 shrink-0">입장료</span>
                              <input
                                type="number"
                                min="0"
                                step="100"
                                value={newRoomEntryFee === 0 ? '' : newRoomEntryFee}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setNewRoomEntryFee(val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0))
                                }}
                                placeholder="0 (무료)"
                                className="w-16 sm:w-20 bg-white text-right font-black text-xs px-2 py-1 rounded-lg border border-slate-200 focus:border-[#FF3B6B] focus:outline-none"
                              />
                              <span className="text-[11px] font-black text-[#FF3B6B] shrink-0">꿀떡</span>
                            </div>

                            <Button
                              onClick={handleCreateSudaRoom}
                              className="bg-[#FF3B6B] hover:bg-[#E02958] text-white font-black text-xs h-9 px-4 rounded-xl shadow-xs shrink-0 flex items-center gap-1"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>방 만들기</span>
                            </Button>
                          </div>
                        </div>

                        {/* 빠른 단가 선택 & 안내 */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-400">단가 퀵선택:</span>
                            {[
                              { label: '무료', value: 0 },
                              { label: '300 꿀떡', value: 300 },
                              { label: '500 꿀떡', value: 500 },
                              { label: '1,000 꿀떡', value: 1000 },
                            ].map((chip) => (
                              <button
                                key={chip.value}
                                onClick={() => setNewRoomEntryFee(chip.value)}
                                className={`px-2 py-0.5 rounded-lg font-bold transition text-[11px] ${
                                  newRoomEntryFee === chip.value
                                    ? 'bg-rose-50 text-[#FF3B6B] border border-rose-200'
                                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                                }`}
                              >
                                {chip.label}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-1 text-slate-400">
                            <span>* 0원 입력 시 누구나 무료로 대화방에 입장합니다</span>
                          </div>
                        </div>
                      </div>

                      {/* 2) 테마 필터 바 (술한잔, 카페, 산책, 일상) */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                        <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">테마:</span>
                        {['전체', '술 한잔/맛집', '카페/디저트', '산책/운동', '일상수다'].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSudaCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-colors ${
                              sudaCategoryFilter === cat
                                ? 'bg-[#FF3B6B] text-white shadow-2xs'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* 3) 1:1 수다 대기방 카드 리스트 (공감/댓글 완전 제거, 입장단가 & 입장하기 중심) */}
                      <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                        {sudaPosts
                          .filter((p) => (sudaCategoryFilter === '전체' ? true : p.category === sudaCategoryFilter))
                          .sort((a, b) => {
                            const isMineA = (user?.nickname && a.nickname === user.nickname) ? 1 : 0
                            const isMineB = (user?.nickname && b.nickname === user.nickname) ? 1 : 0
                            if (isMineA !== isMineB) return isMineB - isMineA // 내가 개설한 방 무조건 1등 최상단 고정!
                            if (a.time === '방금 전' && b.time !== '방금 전') return -1
                            if (b.time === '방금 전' && a.time !== '방금 전') return 1
                            return 0
                          })
                          .map((room) => (
                            <div
                              key={room.id}
                              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-rose-200 hover:shadow-md transition-all space-y-3"
                            >
                              {/* 상단: 방장 프로필 & 우측 [1:1 수다방 입장] 버튼 */}
                              <div className="flex items-center justify-between gap-3">
                                {/* 방장 정보 (클릭 시 무조건 프로필 팝업 오픈!) */}
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openUserProfileModal({
                                      id: room.id,
                                      nickname: room.nickname,
                                      avatar: room.avatar,
                                      region: room.region,
                                      headline: room.title || room.content,
                                      mannerTemp: 36.5,
                                    })
                                  }}
                                  className="flex items-center gap-3 cursor-pointer group/roomauthor min-w-0"
                                  title="프로필 확인하기"
                                >
                                  <div className="relative shrink-0">
                                    <img
                                      src={room.avatar}
                                      alt="avatar"
                                      className="h-11 w-11 rounded-full object-cover border-2 border-slate-100 group-hover/roomauthor:ring-2 group-hover/roomauthor:ring-rose-300 transition"
                                    />
                                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-extrabold text-sm text-slate-900 group-hover/roomauthor:text-indigo-600 transition truncate">
                                        {room.nickname}
                                      </span>
                                      <Badge className="bg-rose-50 text-[#FF3B6B] text-[10px] font-bold border border-rose-200 py-0">
                                        {room.category || '1:1 수다'}
                                      </Badge>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                      {room.region} · {room.time}
                                    </p>
                                  </div>
                                </div>

                                {/* 우측 입장 단가 & 입장하기 버튼 */}
                                <div className="flex items-center gap-2 shrink-0">
                                  {/* 입장 포인트 뱃지 */}
                                  <span className={`text-xs font-black px-2.5 py-1 rounded-xl shrink-0 ${
                                    room.entryFee && room.entryFee > 0
                                      ? 'bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs'
                                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  }`}>
                                    {room.entryFee && room.entryFee > 0 ? `💰 ${room.entryFee} 꿀떡` : '✨ 무료'}
                                  </span>

                                  {/* 1:1 수다 입장 버튼 또는 내 개설방인 경우 삭제 버튼 */}
                                  {Boolean(user?.nickname && (room.nickname === user.nickname || (user?.id && (room as any).authorId === user.id))) ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteSudaRoom(room.id)}
                                      className="border-rose-200 text-[#FF3B6B] hover:bg-rose-50 font-extrabold text-xs h-8 px-3 rounded-xl shadow-2xs flex items-center gap-1"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span>삭제</span>
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => handleEnterSudaRoom(room)}
                                      className="bg-[#FF3B6B] hover:bg-[#E02958] text-white font-extrabold text-xs h-8 px-3 rounded-xl shadow-xs"
                                    >
                                      <MessageCircle className="h-3.5 w-3.5 mr-1" />
                                      <span>입장하기</span>
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* 방 제목 (중복 없이 단일 제목만 깔끔하게 표출) */}
                              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                <h4 className="font-black text-sm text-slate-900 leading-snug">
                                  {room.title || room.content}
                                </h4>
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
                                onClick={() => {
                                  setActiveChatRoom({ ...room, unreadCount: 0 });
                                  setChatRooms((prev) => prev.map((r) => r.id === room.id ? { ...r, unreadCount: 0 } : r));
                                  if (socketRef.current) {
                                    socketRef.current.emit('chat:join', { chatId: room.id });
                                    socketRef.current.emit('chat:read', {
                                      chatId: room.id,
                                      readerId: user?.id,
                                      readerAccountId: user?.id,
                                    });
                                  }
                                  fetch('/api/v1/chats/' + room.id + '/read', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ userId: user?.id, readerId: user?.id }),
                                  }).catch(() => {});

                                  // 서버로부터 최신 대화 내역 즉시 동기화
                                  getChatMessages(room.id).then((serverMsgs) => {
                                    if (Array.isArray(serverMsgs) && serverMsgs.length > 0) {
                                      const mapped = serverMsgs
                                        .filter((m: any) => m && m.content)
                                        .map((m: any) => {
                                          const isAdmUser = !user?.nickname || ['super admin', 'admin', 'admin_super_user', '관리자', '슈퍼어드민'].includes(String(user.nickname).trim().toLowerCase())
                                          const myNick = isAdmUser ? '테스터02' : user?.nickname
                                          const myId = isAdmUser ? 'u-tester-02' : user?.id
                                          const isMe = Boolean(
                                            (myId && (m.senderAccountId === myId || m.senderId === myId)) ||
                                            (myNick && (m.senderName === myNick || m.senderNickname === myNick)) ||
                                            (user?.id && (m.senderAccountId === user.id || m.senderId === user.id)) ||
                                            (user?.nickname && (m.senderName === user.nickname || m.senderNickname === user.nickname))
                                          );
                                          const rawContent = m.content || m.text || '';
                                          const isMediaMsg =
                                            m.type === 'media' ||
                                            m.type === 'image' ||
                                            (typeof rawContent === 'string' &&
                                              (rawContent.includes('/media/files/') ||
                                                rawContent.startsWith('data:image/') ||
                                                /\.(jpeg|jpg|png|gif|webp)(\?.*)?$/i.test(rawContent)));
                                          return {
                                            id: m.id || 'msg-' + Math.random().toString(36).slice(2, 7),
                                            senderId: isMe ? 'me' : 'target',
                                            senderNickname: m.senderName || m.senderNickname || room.targetNickname,
                                            text: rawContent,
                                            time: m.createdAt
                                              ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                              : '방금',
                                            isMe,
                                            unread: isMe ? !m.readAt : false,
                                            type: isMediaMsg ? 'media' : (m.type || 'text'),
                                            media: isMediaMsg ? { uri: rawContent } : undefined,
                                            gift: m.type === 'gift' ? {
                                              id: m.id || 'gift-' + Date.now(),
                                              name: m.giftName || '선물',
                                              amount: Number(m.giftPoints || 0),
                                              description: m.content || `${m.giftName || '선물'}을 받았습니다!`,
                                              icon: m.giftIcon || '🎁',
                                            } : undefined,
                                          };
                                        });

                                      setActiveChatRoom((prev) => {
                                        if (!prev || prev.id !== room.id) return prev;
                                        return { ...prev, messages: mapped };
                                      });
                                      setChatRooms((prev) =>
                                        prev.map((r) => (r.id === room.id ? { ...r, messages: mapped } : r))
                                      );
                                    }
                                  }).catch(() => {});
                                }}
                                className={`p-3.5 flex items-start gap-3.5 transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-blue-50/80 border-l-4 border-blue-600 shadow-2xs'
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                <div 
      onClick={(e) => {
        e.stopPropagation()
        openUserProfileModal({
          id: room.id,
          nickname: room.targetNickname,
          avatar: room.targetAvatar,
          region: '서울 강남구 역삼동',
          headline: room.lastMessage || '모꼬 1:1 대화 상대입니다 ✨',
        })
      }}
      className="relative shrink-0 cursor-pointer group/roomavatar"
      title="프로필 보기"
    >
      <img
        src={room.targetAvatar}
        alt={room.targetNickname}
        className="h-11 w-11 rounded-full object-cover border border-slate-200 group-hover/roomavatar:ring-2 group-hover/roomavatar:ring-blue-400 transition"
      />
                                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                      {(() => {
                                        if (room.targetNickname && room.targetNickname !== '대화 상대') return room.targetNickname;
                                        const welcome = room.messages?.find((m) => m.text?.includes('님과의 1:1 대화방'));
                                        if (welcome) {
                                          const match = welcome.text.match(/🎉?\s*(.*?)님과의/);
                                          if (match && match[1]) return match[1].trim();
                                        }
                                        const otherMsg = room.messages?.find((m) => !m.isMe && m.senderNickname && m.senderNickname !== '대화 상대');
                                        if (otherMsg?.senderNickname) return otherMsg.senderNickname;
                                        return '테스터01';
                                      })()}
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-[10px] text-muted-foreground">{room.lastTime}</span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleLeaveChatRoom(room)
                                        }}
                                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                        title="대화방 나가기"
                                      >
                                        <LogOut className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between gap-1">
                                    <p className="text-xs text-slate-600 truncate flex-1">{room.lastMessage}</p>
                                    {room.unreadCount > 0 && (
                                      <span className="ml-1 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-[#FF3B6B] text-[10px] font-extrabold text-white shrink-0 shadow-2xs">
                                        {room.unreadCount}
                                      </span>
                                    )}
                                  </div>
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

                {/* [우측 영역: lg:col-span-5 xl:col-span-5] 📱 휴대폰 모양 디바이스 & 모꼬 앱 채팅방 (슬림 베젤 & 100% 동일 테마) */}
                <div className="lg:col-span-5 xl:col-span-5 flex flex-col items-center sticky top-20">
                  {/* 스마트폰 목업 프레임 (슬림 베젤 & 미니 물방울 노치 & 물리 버튼) */}
                  <div className="relative w-full max-w-[370px] h-[730px] rounded-[44px] bg-slate-950 p-[5px] shadow-2xl ring-1 ring-slate-900 border-[3.5px] border-slate-900 flex flex-col overflow-hidden">
                    {/* 좌측 볼륨 물리 버튼 디테일 */}
                    <span className="absolute -left-[5px] top-28 w-[3.5px] h-9 bg-slate-800 rounded-l-sm" />
                    <span className="absolute -left-[5px] top-40 w-[3.5px] h-9 bg-slate-800 rounded-l-sm" />
                    {/* 우측 전원 물리 버튼 디테일 */}
                    <span className="absolute -right-[5px] top-32 w-[3.5px] h-12 bg-slate-800 rounded-r-sm" />

                    {/* 상단 미니 물방울 카메라 노치 */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-3 bg-slate-950 rounded-b-full flex items-center justify-center z-40">
                      <span className="h-2 w-2 rounded-full bg-slate-900 border border-slate-800" />
                    </div>

                    {/* 스마트폰 내부 풀스크린 (배경색: 모바일 앱과 100% 동일한 부드러운 스카이블루 #B2C7D9) */}
                    <div className="rounded-[36px] bg-[#B2C7D9] flex-1 flex flex-col overflow-hidden relative">
                      {/* (A) 상단 모바일 상태바 */}
                      <div className="h-7 bg-[#B2C7D9] text-slate-800 px-6 pt-1 flex items-center justify-between text-[11px] font-bold shrink-0 z-30">
                        <span>16:44</span>
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <span className="text-[9px]">5G</span>
                          <Wifi className="h-3 w-3" />
                          <Battery className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      {/* (B) 앱 채팅방 헤더 (뒤로가기, 닉네임, 즐겨찾기 별, 세줄 메뉴 - 통화 버튼 제거됨) */}
                      {activeChatRoom ? (
                        <>
                          <div className="p-2.5 px-3 bg-[#B2C7D9] border-b border-slate-300/60 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <button
                                onClick={() => {
                                  setActiveChatRoom(null)
                                  setChatSubTab('CHATS')
                                }}
                                className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-slate-300/40 text-slate-800 transition"
                                title="대화 목록으로 돌아가기"
                              >
                                <ArrowLeft className="h-5 w-5" />
                              </button>
                              <div className="min-w-0 flex-1 cursor-pointer" onClick={() => openUserProfileModal({
                                id: activeChatRoom.id,
                                nickname: activeChatRoom.targetNickname,
                                avatar: activeChatRoom.targetAvatar,
                                region: '서울 강남구 역삼동',
                                headline: activeChatRoom.lastMessage || '모꼬 1:1 대화 상대입니다 ✨',
                              })}>
                                <h4 className="font-black text-sm text-slate-900 truncate">
                                  {(() => {
                                    if (activeChatRoom.targetNickname && activeChatRoom.targetNickname !== '대화 상대') return activeChatRoom.targetNickname;
                                    const welcome = activeChatRoom.messages?.find((m) => m.text?.includes('님과의 1:1 대화방'));
                                    if (welcome) {
                                      const match = welcome.text.match(/🎉?\s*(.*?)님과의/);
                                      if (match && match[1]) return match[1].trim();
                                    }
                                    const otherMsg = activeChatRoom.messages?.find((m) => !m.isMe && m.senderNickname && m.senderNickname !== '대화 상대');
                                    if (otherMsg?.senderNickname) return otherMsg.senderNickname;
                                    return '테스터01';
                                  })()}
                                </h4>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-700 shrink-0">
                              <button
                                onClick={() =>
                                  toast({
                                    title: '⭐ 즐겨찾기 등록',
                                    description: `${activeChatRoom.targetNickname}님이 대화 즐겨찾기에 등록되었습니다.`,
                                  })
                                }
                                className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-slate-300/40 text-slate-700 transition"
                                title="즐겨찾기"
                              >
                                <Star className="h-4.5 w-4.5" />
                              </button>

                              <div className="relative">
                                <button
                                  onClick={() => setIsChatMenuOpen((prev) => !prev)}
                                  className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-slate-300/40 text-slate-800 transition"
                                  title="대화방 메뉴"
                                >
                                  <Menu className="h-5 w-5" />
                                </button>

                                {isChatMenuOpen && (
                                  <div className="absolute top-8 right-0 z-50 w-36 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                                    <button
                                      onClick={() => {
                                        setIsChatMenuOpen(false)
                                        setReportReasonText('')
                                        setIsReportModalOpen(true)
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition text-left"
                                    >
                                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                                      <span>신고하기</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setIsChatMenuOpen(false)
                                        if (confirm(`${activeChatRoom.targetNickname}님을 차단하시겠습니까? 차단 시 더 이상 대화 및 게시글이 표시되지 않습니다.`)) {
                                          const targetNick = activeChatRoom.targetNickname
                                          setBlockedUsers((prev) => Array.from(new Set([...prev, targetNick])))
                                          try {
                                            localStorage.setItem('mocco_blocked_users', JSON.stringify(Array.from(new Set([...blockedUsers, targetNick]))))
                                          } catch (e) {}
                                          api.post('/community/block', {
                                            blockedUserId: activeChatRoom.targetUserId || targetNick,
                                            targetAccountId: targetNick,
                                            nickname: targetNick,
                                          }).catch(() => {})
                                          toast({
                                            title: '🚫 사용자 차단 완료',
                                            description: `${targetNick}님이 차단되었습니다. 마이모꼬 차단 관리에서 확인 및 해제하실 수 있습니다.`,
                                          })
                                          handleLeaveChatRoom(activeChatRoom)
                                        }
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition text-left"
                                    >
                                      <Ban className="h-3.5 w-3.5 text-slate-500" />
                                      <span>차단하기</span>
                                    </button>
                                    <div className="border-t border-slate-100 my-1" />
                                    <button
                                      onClick={() => handleLeaveChatRoom(activeChatRoom)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition text-left"
                                    >
                                      <LogOut className="h-3.5 w-3.5 text-rose-600" />
                                      <span>대화방 나가기</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 거래 물품 상단 바 (MARKET 톡인 경우) */}
                          {activeChatRoom.productInfo && (
                            <div className="flex items-center justify-between p-2 bg-white/90 backdrop-blur-xs border-b border-slate-200 text-xs shrink-0">
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

                          {/* (C) 모바일 앱 100% 동일 스타일 채팅 메시지 스트림 */}
                          <div
                            ref={chatScrollRef}
                            className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#B2C7D9]"
                          >
                            {/* 날짜 구분선 */}
                            <div className="flex items-center justify-center my-1.5">
                              <span className="bg-slate-400/35 text-slate-800 text-[10px] px-3 py-0.5 rounded-full font-medium">
                                2026년 10월 29일 목요일
                              </span>
                            </div>

                            {activeChatRoom.messages.map((msg, msgIdx) => (
                              <div
                                key={msg.id}
                                className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
                              >
                                {msg.isMe ? (
                                  /* [내 메시지: 오른쪽 카카오톡 옐로우 말풍선 & 노란색 1 / 사진 첨부] */
                                  <div className="flex items-end gap-1.5 max-w-[85%] justify-end">
                                    <div className="flex flex-col items-end text-[9px] text-slate-600 shrink-0 mb-0.5">
                                      {(() => {
                                        if (!msg.unread) return null;
                                        // 카카오톡 규칙: 내 메시지 이후에 상대방의 답장이 존재하면 읽은 것으로 1 즉시 제거
                                        const hasLaterReply = activeChatRoom?.messages.slice(msgIdx + 1).some(
                                          (later) => !later.isMe
                                        );
                                        if (hasLaterReply) return null;
                                        return (
                                          <span className="text-amber-500 font-extrabold text-[10px] leading-tight">1</span>
                                        );
                                      })()}
                                      <span>{msg.time}</span>
                                    </div>
                                    {msg.media?.uri ? (
                                      <div className="rounded-2xl rounded-tr-xs overflow-hidden shadow-xs border border-white/50 bg-slate-900/10 max-w-[210px]">
                                        <img
                                          src={resolveDisplayImageUrl(msg.media.uri)}
                                          alt="내 전송 사진"
                                          className="w-full h-auto max-h-48 object-cover cursor-pointer hover:opacity-95 transition"
                                          onClick={() => window.open(resolveDisplayImageUrl(msg.media?.uri), '_blank')}
                                        />
                                      </div>
                                    ) : msg.gift ? (
                                      <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-amber-500 text-white rounded-2xl rounded-tr-xs p-3 shadow-md space-y-1.5 border border-pink-300">
                                        <div className="flex items-center gap-2">
                                          <span className="text-2xl">{msg.gift.icon || '🎁'}</span>
                                          <div>
                                            <span className="text-[9px] uppercase font-bold tracking-wider opacity-90 block">
                                              MOCCO 3D GIFT
                                            </span>
                                            <h5 className="font-extrabold text-xs">{msg.gift.name}</h5>
                                          </div>
                                        </div>
                                        <div className="pt-1 border-t border-white/20 flex items-center justify-between text-[10px] font-black">
                                          <span>후원 꿀떡</span>
                                          <span className="bg-white/25 px-1.5 py-0.5 rounded text-white">
                                            {msg.gift.amount.toLocaleString()} 꿀떡
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-[#FEE500] text-slate-900 rounded-2xl rounded-tr-xs px-3.5 py-2 text-xs shadow-xs leading-relaxed break-words font-medium">
                                        {msg.text}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  /* [상대방 메시지: 왼쪽 핑크 아바타 + 닉네임 + 흰색 말풍선 / 사진 첨부] */
                                  <div className="flex items-start gap-2 max-w-[85%]">
                                    <div 
                                      onClick={() => openUserProfileModal({
                                        id: activeChatRoom.id,
                                        nickname: activeChatRoom.targetNickname,
                                        avatar: activeChatRoom.targetAvatar,
                                        region: '서울 강남구 역삼동',
                                        headline: activeChatRoom.lastMessage || '모꼬 1:1 대화 상대입니다 ✨',
                                      })}
                                      className="h-8 w-8 rounded-full bg-[#FFD1DC] text-[#FF3B6B] font-black text-xs flex items-center justify-center shrink-0 border border-pink-200 overflow-hidden shadow-2xs cursor-pointer"
                                    >
                                      <img
                                        src={activeChatRoom.targetAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                                        alt={msg.senderNickname || activeChatRoom.targetNickname}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <div className="flex flex-col items-start min-w-0">
                                      <span className="text-[11px] font-bold text-slate-700 mb-0.5">
                                        {(() => {
                                          if (msg.senderNickname && msg.senderNickname !== '대화 상대' && msg.senderNickname !== 'system') return msg.senderNickname;
                                          if (activeChatRoom.targetNickname && activeChatRoom.targetNickname !== '대화 상대') return activeChatRoom.targetNickname;
                                          const welcome = activeChatRoom.messages?.find((m) => m.text?.includes('님과의 1:1 대화방'));
                                          if (welcome) {
                                            const match = welcome.text.match(/🎉?\s*(.*?)님과의/);
                                            if (match && match[1]) return match[1].trim();
                                          }
                                          return '테스터01';
                                        })()}
                                      </span>
                                      <div className="flex items-end gap-1.5">
                                        {msg.media?.uri ? (
                                          <div className="rounded-2xl rounded-tl-xs overflow-hidden shadow-xs border border-white/50 bg-slate-900/10 max-w-[210px]">
                                            <img
                                              src={resolveDisplayImageUrl(msg.media.uri)}
                                              alt="상대방 전송 사진"
                                              className="w-full h-auto max-h-48 object-cover cursor-pointer hover:opacity-95 transition"
                                              onClick={() => window.open(resolveDisplayImageUrl(msg.media?.uri), '_blank')}
                                            />
                                          </div>
                                        ) : msg.gift ? (
                                          <div className="bg-white text-slate-900 rounded-2xl rounded-tl-xs p-3 shadow-md space-y-1.5 border border-amber-300">
                                            <div className="flex items-center gap-2">
                                              <span className="text-2xl">{msg.gift.icon || '🎁'}</span>
                                              <div>
                                                <span className="text-[9px] uppercase font-bold tracking-wider text-amber-600 block">
                                                  MOCCO 3D GIFT
                                                </span>
                                                <h5 className="font-extrabold text-xs">{msg.gift.name}</h5>
                                              </div>
                                            </div>
                                            <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] font-black">
                                              <span>선물 꿀떡</span>
                                              <span className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-800">
                                                {msg.gift.amount.toLocaleString()} 꿀떡
                                              </span>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="bg-white text-slate-900 rounded-2xl rounded-tl-xs px-3.5 py-2 text-xs shadow-xs leading-relaxed break-words">
                                            {msg.text}
                                          </div>
                                        )}
                                        <span className="text-[9px] text-slate-600 shrink-0 mb-0.5">
                                          {msg.time}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* 숨겨진 이미지 파일 선택 인풋 (PC: 탐색기/내폴더, 모바일웹: 앨범/카메라) */}
                          <input
                            ref={chatFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file || !activeChatRoom) return
                              setIsAttachSheetOpen(false)

                              const isAdmUser = !user?.nickname || ['super admin', 'admin', 'admin_super_user', '관리자', '슈퍼어드민'].includes(String(user.nickname).trim().toLowerCase())
                              const senderNickname = isAdmUser ? '테스터02' : (user?.nickname || '나')
                              const senderId = isAdmUser ? 'u-tester-02' : (user?.id || 'me')

                              // 1) 백엔드 /v1/media/upload 로 정식 파일 업로드 수행
                              let mediaUrl = ''
                              try {
                                const uploadRes = await uploadChatMedia(file)
                                if (uploadRes.ok && uploadRes.url) {
                                  mediaUrl = uploadRes.url
                                }
                              } catch {}

                              // 실패 시 브라우저 FileReader dataURL fallback
                              if (!mediaUrl) {
                                const readPromise = new Promise<string>((resolve) => {
                                  const reader = new FileReader()
                                  reader.onload = () => resolve(reader.result as string || '')
                                  reader.onerror = () => resolve('')
                                  reader.readAsDataURL(file)
                                })
                                mediaUrl = await readPromise
                              }
                              if (!mediaUrl) return

                              const clientMsgId = 'msg-img-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)
                              const newMsg: ChatMessageItem = {
                                id: clientMsgId,
                                senderId: senderId,
                                senderNickname: senderNickname,
                                text: mediaUrl,
                                time: '방금',
                                isMe: true,
                                unread: true,
                                type: 'media',
                                media: { uri: mediaUrl },
                              }

                              const updatedRoom: ChatRoomItem = {
                                ...activeChatRoom,
                                lastMessage: '📷 사진을 보냈습니다',
                                lastTime: '방금',
                                messages: [...activeChatRoom.messages, newMsg],
                              }
                              setActiveChatRoom(updatedRoom)
                              setChatRooms((prev) => prev.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)))

                              if (socketRef.current) {
                                socketRef.current.emit('chat:message', {
                                  chatId: activeChatRoom.id,
                                  type: 'media',
                                  content: mediaUrl,
                                  targetUserId: activeChatRoom.targetUserId || activeChatRoom.targetNickname,
                                  senderAccountId: senderId,
                                  senderName: senderNickname,
                                })
                              }

                              sendChatMessage(activeChatRoom.id, mediaUrl, {
                                type: 'media',
                                clientMessageId: clientMsgId,
                                senderAccountId: senderId,
                                senderNickname: senderNickname,
                                targetUserId: activeChatRoom.targetUserId || activeChatRoom.targetNickname,
                              }).catch((err) => console.warn('send photo fallback:', err))

                              e.target.value = ''
                            }}
                          />

                          {/* (D) 모바일 채팅 입력 툴바 (+ 버튼, 텍스트 입력창, 🎁 선물, 전송) */}
                          <div className="p-2 px-2.5 border-t border-slate-200/60 bg-white flex items-center gap-1.5 shrink-0">
                            {/* 추가 첨부 버튼 (+) -> 빠른 첨부 바텀시트 열기 */}
                            <button
                              onClick={() => setIsAttachSheetOpen((prev) => !prev)}
                              className="h-8 w-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 shrink-0 transition"
                              title="빠른 첨부 (사진, 앨범, 선물)"
                            >
                              <PlusCircle className="h-5 w-5" />
                            </button>

                            {/* 🎁 선물하기 버튼 (모바일 앱 선물 아이콘과 동일) */}
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
                                  ? 'bg-[#FF3B6B] text-white shadow-xs'
                                  : 'bg-slate-200 text-slate-400'
                              }`}
                            >
                              <Send className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* (E-1) 📷 빠른 첨부 바텀시트 (첨부 이미지 도안 일치: 카메라, 앨범, 선물하기) */}
                          {isAttachSheetOpen && (
                            <div className="absolute inset-x-0 bottom-0 top-16 bg-black/40 z-40 flex flex-col justify-end animate-in fade-in duration-150">
                              <div className="bg-white rounded-t-3xl p-4 pb-6 space-y-4 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-xs text-slate-800">빠른 첨부</span>
                                  <button onClick={() => setIsAttachSheetOpen(false)} className="h-6 w-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-3 gap-3 pt-1">
                                  {/* 1. 카메라 */}
                                  <div
                                    onClick={() => {
                                      setIsAttachSheetOpen(false)
                                      chatFileInputRef.current?.click()
                                    }}
                                    className="flex flex-col items-center gap-2 cursor-pointer group"
                                  >
                                    <div className="h-16 w-16 rounded-full bg-[#FFE812] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                                      <Camera className="h-7 w-7 text-rose-500 stroke-[1.8]" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">카메라</span>
                                  </div>

                                  {/* 2. 앨범 (내 폴더 / 앨범 탐색기) */}
                                  <div
                                    onClick={() => {
                                      setIsAttachSheetOpen(false)
                                      chatFileInputRef.current?.click()
                                    }}
                                    className="flex flex-col items-center gap-2 cursor-pointer group"
                                  >
                                    <div className="h-16 w-16 rounded-full bg-[#FFE812] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                                      <ImageIcon className="h-7 w-7 text-rose-500 stroke-[1.8]" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">앨범</span>
                                  </div>

                                  {/* 3. 선물하기 */}
                                  <div
                                    onClick={() => {
                                      setIsAttachSheetOpen(false)
                                      setIsGiftPickerOpen(true)
                                    }}
                                    className="flex flex-col items-center gap-2 cursor-pointer group"
                                  >
                                    <div className="h-16 w-16 rounded-full bg-[#FFE812] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                                      <Gift className="h-7 w-7 text-rose-500 stroke-[1.8]" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">선물하기</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* (E-2) 🚨 신고하기 모달 (첨부 이미지 도안 일치) */}
                          {isReportModalOpen && (
                            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                              <div className="bg-white rounded-3xl p-5 w-full max-w-[320px] shadow-2xl space-y-3.5 border border-slate-100 animate-in zoom-in-95 duration-150">
                                <div className="space-y-1">
                                  <h4 className="font-extrabold text-base text-slate-900">신고하기</h4>
                                  <p className="text-[11px] text-slate-500 leading-relaxed">
                                    문제가 되는 내용을 자세히 작성해 주세요. 확인 후 신속히 조치하겠습니다.
                                  </p>
                                </div>

                                <textarea
                                  value={reportReasonText}
                                  onChange={(e) => setReportReasonText(e.target.value)}
                                  placeholder="신고 내용을 입력하세요"
                                  maxLength={500}
                                  className="w-full h-28 p-3 text-xs bg-white border border-slate-200 rounded-2xl resize-none focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-slate-400 text-slate-800"
                                />

                                <div className="flex items-center justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => {
                                      setIsReportModalOpen(false)
                                      setReportReasonText('')
                                    }}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                                  >
                                    취소
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!reportReasonText.trim()) {
                                        toast({
                                          title: '신고 사유 입력',
                                          description: '신고 내용을 입력해 주세요.',
                                          variant: 'destructive',
                                        })
                                        return
                                      }
                                      setIsSubmittingReport(true)
                                      try {
                                        await api.post('/chats/reports', {
                                          chatId: activeChatRoom?.id,
                                          targetNickname: activeChatRoom?.targetNickname,
                                          targetUserId: activeChatRoom?.targetUserId,
                                          reason: reportReasonText.trim(),
                                          reporterNickname: user?.nickname,
                                        })
                                        toast({
                                          title: '🚨 신고 완료',
                                          description: '신고가 정상적으로 접수되었습니다. 확인 후 신속히 조치하겠습니다.',
                                        })
                                        setIsReportModalOpen(false)
                                        setReportReasonText('')
                                      } catch (err) {
                                        toast({
                                          title: '🚨 신고 완료',
                                          description: '신고가 정상 접수되었습니다.',
                                        })
                                        setIsReportModalOpen(false)
                                        setReportReasonText('')
                                      } finally {
                                        setIsSubmittingReport(false)
                                      }
                                    }}
                                    disabled={isSubmittingReport || !reportReasonText.trim()}
                                    className="px-4 py-2 text-xs font-bold text-white bg-[#FF758F] hover:bg-[#FF5C7A] disabled:bg-rose-200 rounded-xl shadow-xs transition"
                                  >
                                    {isSubmittingReport ? '접수 중...' : '신고 보내기'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

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
                                      보유 {myPoints.toLocaleString()} 개
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
                                  {adminGifts
                                    .filter((g) => {
                                      if (activeGiftCategory === 'all') return true
                                      if (activeGiftCategory === 'mocco_special') return g.category === 'mocco_special' || g.category === 'special'
                                      if (activeGiftCategory === 'mocco_vip') return g.category === 'mocco_vip' || g.category === 'vip'
                                      return g.category === activeGiftCategory
                                    })
                                    .map((gift) => (
                                      <div
                                        key={gift.id}
                                        onClick={() => handleSendGift(gift)}
                                        className="group p-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-pink-50/60 hover:border-pink-300 transition-all cursor-pointer text-left space-y-1 flex flex-col justify-between"
                                      >
                                        <div className="flex items-center justify-between">
                                          {gift.thumbnailUrl && (gift.thumbnailUrl.startsWith('http://') || gift.thumbnailUrl.startsWith('https://')) ? (
                                            <img src={gift.thumbnailUrl} alt={gift.name} className="h-7 w-7 rounded-full object-cover group-hover:scale-110 transition-transform shadow-xs" />
                                          ) : (
                                            <span className="text-2xl group-hover:scale-110 transition-transform">{gift.icon || '🎁'}</span>
                                          )}
                                          <span className="text-[10px] font-black text-pink-600 bg-pink-100 px-1.5 py-0.2 rounded">
                                            {gift.pricePoints.toLocaleString()} 꿀떡
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
                          {userNickname || user?.nickname || '모꼬이웃'}
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
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFollowsActiveTab('followers')
                            setIsFollowsModalOpen(true)
                          }}
                          className="font-bold text-slate-700 hover:text-rose-600 transition flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-200 cursor-pointer"
                        >
                          팔로워 <strong className="text-slate-900 font-black">{followersList.length}</strong>
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFollowsActiveTab('following')
                            setIsFollowsModalOpen(true)
                          }}
                          className="font-bold text-slate-700 hover:text-rose-600 transition flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-200 cursor-pointer"
                        >
                          팔로잉 <strong className="text-slate-900 font-black">{followingList.length}</strong>
                        </button>
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
                        <span className="text-xs font-black text-pink-900">모꼬 꿀떡</span>
                        <Badge className="bg-pink-200/60 text-pink-800 text-[9px] px-1.5 py-0 font-bold">
                          소통·후원
                        </Badge>
                      </div>
                      <Button
                        onClick={() => requireAuth(() => setIsPointChargeModalOpen(true))}
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
                        <span className="text-sm font-bold text-pink-800">개</span>
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
                        스트리머 꿀떡 환전 신청 ›
                      </button>
                    </div>
                  </div>

                  {/* 💵 판매 정산금 지갑 */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">💵</span>
                        <span className="text-xs font-black text-slate-800">모꼬 머니 (KRW)</span>
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
                        중고거래 판매 대금, 쇼핑 적립금, 제휴 정산금 통합 (1원 = 현금 1원)
                      </p>
                    </div>

                    <div className="pt-1 border-t border-slate-200 flex items-center justify-end">
                      <button
                        onClick={() => setIsWithdrawOpen(true)}
                        className="text-[11px] font-bold text-slate-600 hover:underline flex items-center"
                      >
                        내 은행 계좌 출금 신청 ›
                      </button>
                    </div>
                  </div>
                </div>

                



                {/* [모바일 앱 100% 동일] (3) 🎬 무료 모꼬 꿀떡 충전소 (리워드 광고) */}
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
                            description: '스폰서 광고 시청 보상으로 모꼬 꿀떡 +10개가 충전되었습니다.',
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
                        <h5 className="font-extrabold text-xs sm:text-sm">무료 모꼬 꿀떡 충전소</h5>
                        <Badge className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0 border-none">
                          +10 개
                        </Badge>
                      </div>
                      <p className="text-[11px] text-violet-100 mt-0.5">
                        스폰서 광고를 시청하고 실시간 라이브 선물용 꿀떡 10개를 무료로 충전하세요!
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
                      onClick={() => setMyTradeTab('CART')}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                        myTradeTab === 'CART'
                          ? 'bg-white text-indigo-600 shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-indigo-500" />
                      <span>장바구니 ({cartCount})</span>
                    </button>
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
                {/* 🛒 장바구니 탭 내용 */}
                {myTradeTab === 'CART' && (
                  <div className="space-y-4">
                    {cartItems.length === 0 ? (
                      <div className="p-10 rounded-2xl border border-dashed border-slate-200 text-center space-y-3 bg-slate-50/50">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                          <ShoppingCart className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">장바구니가 비어 있습니다.</p>
                          <p className="text-xs text-slate-400 mt-0.5">마켓 및 공동구매 상품을 담아보세요!</p>
                        </div>
                        <Button
                          onClick={() => setActiveTab('MARKET')}
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 px-4 rounded-xl shadow-xs"
                        >
                          마켓 상품 둘러보기
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                          <span>담긴 상품 총 <strong className="text-slate-900">{cartCount}</strong>개</span>
                          <span className="text-[11px] text-slate-400">배송비는 기본 3,000원이 적용됩니다.</span>
                        </div>

                        {cartItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                                🏬 공식 마켓 상품
                              </Badge>
                              <button
                                onClick={() => removeCartItem(item.id)}
                                className="text-slate-400 hover:text-rose-500 p-1 transition"
                                title="삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center gap-3.5">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-16 h-16 rounded-xl object-cover border shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-2">
                                  {item.name}
                                </h5>
                                <div className="flex items-baseline gap-1 mt-1">
                                  <span className="font-black text-sm text-slate-900">
                                    {(item.price * item.quantity).toLocaleString()}원
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    (개당 {item.price.toLocaleString()}원)
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                              <span className="text-slate-500 font-medium">수량 변경</span>
                              <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                                <button
                                  onClick={() => updateCartQuantity(item.id, -1)}
                                  className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-l-md transition"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-3 font-bold text-slate-800 text-xs">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateCartQuantity(item.id, 1)}
                                  className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-r-md transition"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* 장바구니 주문 요약 및 결제 버튼 */}
                        <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 space-y-3">
                          <div className="space-y-1.5 text-xs text-slate-600">
                            <div className="flex justify-between">
                              <span>총 상품 금액</span>
                              <span className="font-bold text-slate-900">
                                {cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0).toLocaleString()}원
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>기본 배송비</span>
                              <span className="font-bold text-slate-900">3,000원</span>
                            </div>
                            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-indigo-100">
                              <span>총 결제 예정 금액</span>
                              <span className="text-indigo-600 text-base">
                                {(cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0) + 3000).toLocaleString()}원
                              </span>
                            </div>
                          </div>

                          <Button
                            onClick={() => {
                              requireAuth(() => {
                                toast({
                                  title: '🛡️ 장바구니 에스크로 주문서 작성',
                                  description: `장바구니 총 ${cartCount}건의 상품에 대한 에스크로 결제창으로 이동합니다.`,
                                })
                              })
                            }}
                            className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md shadow-indigo-200"
                          >
                            총 {cartCount}건 안전결제 주문하기
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {myTradeTab === 'WISHLIST' && (
                  <div className="space-y-2.5">
                    {myWishlist.length === 0 ? (
                      <div className="p-8 text-center border border-dashed rounded-2xl bg-slate-50 text-slate-400 text-xs">
                        관심목록에 담긴 상품이 없습니다. 마음에 드는 상품을 찜해보세요!
                      </div>
                    ) : (
                      myWishlist.map((item) => {
                        const isUsedItem = item.type === 'C2C_USED' || String(item.id).startsWith('c2c') || String(item.id).startsWith('used') || String(item.id).startsWith('w-1')
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-2xl border bg-slate-50/50 hover:bg-slate-50 transition-colors"
                          >
                            <div
                              onClick={() => router.push(isUsedItem ? '/market/used/' + item.id : '/market/' + item.id)}
                              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                            >
                              <img src={item.image} alt="wish" className="h-12 w-12 rounded-xl object-cover shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-[10px] text-muted-foreground truncate">{item.seller}</span>
                                  <Badge className={isUsedItem ? 'bg-orange-50 text-orange-700 border-orange-200 text-[9px] font-bold px-1.5 py-0' : 'bg-indigo-50 text-indigo-700 border-indigo-200 text-[9px] font-bold px-1.5 py-0'}>
                                    {isUsedItem ? '🥕 중고거래' : '🏬 공식 마켓'}
                                  </Badge>
                                </div>
                                <h5 className="font-bold text-xs text-slate-900 line-clamp-1 hover:underline">{item.title}</h5>
                                <span className="font-black text-xs text-slate-900">{item.price.toLocaleString()}원</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-3">
                              <Button
                                onClick={() => router.push(isUsedItem ? '/market/used/' + item.id : '/market/' + item.id)}
                                size="sm"
                                variant="outline"
                                className="text-xs h-8 px-2.5 rounded-xl border-slate-300 font-bold"
                              >
                                상세보기
                              </Button>
                              <Button
                                onClick={() => {
                                  if (isUsedItem) {
                                    router.push('/market/used/' + item.id)
                                  } else {
                                    setCheckoutTarget({
                                      title: item.title,
                                      price: item.price,
                                      shippingFee: 3000,
                                      image: item.image,
                                    })
                                    setIsCheckoutOpen(true)
                                  }
                                }}
                                size="sm"
                                className={isUsedItem ? 'bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-8 px-3 rounded-xl' : 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 px-3 rounded-xl'}
                              >
                                {isUsedItem ? '안전구매' : '바로구매'}
                              </Button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}

                {myTradeTab === 'SALES' && (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <Button
                        onClick={() => requireAuth(() => router.push('/market/used/new'))}
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
                            <div className="flex items-center gap-1.5 mb-1">
                              <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-[9px] font-bold px-1.5 py-0">🥕 중고물품</Badge>
                            </div>
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
                  <div className="space-y-4">
                    {/* 실시간 배송 단계 요약 위젯 */}
                    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-center justify-around text-center shadow-2xs">
                      <div className="space-y-1">
                        <span className="text-base font-black text-slate-800">
                          {myOrdersList.filter((o: any) => o.status === 'PAID_ESCROW').length}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 block">결제완료</span>
                      </div>
                      <span className="text-slate-300 font-bold">›</span>
                      <div className="space-y-1">
                        <span className="text-base font-black text-blue-600">
                          {myOrdersList.filter((o: any) => o.status === 'SHIPPED').length}
                        </span>
                        <span className="text-[11px] font-bold text-blue-600 block">배송중</span>
                      </div>
                      <span className="text-slate-300 font-bold">›</span>
                      <div className="space-y-1">
                        <span className="text-base font-black text-emerald-600">
                          {myOrdersList.filter((o: any) => o.status === 'DELIVERED').length}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600 block">배송완료</span>
                      </div>
                      <span className="text-slate-300 font-bold">›</span>
                      <div className="space-y-1">
                        <span className="text-base font-black text-indigo-600">
                          {myOrdersList.filter((o: any) => o.status === 'COMPLETED').length}
                        </span>
                        <span className="text-[11px] font-bold text-indigo-600 block">구매확정</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {myOrdersList.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                          주문 내역이 없습니다.
                        </div>
                      ) : (
                        myOrdersList.map((order: any) => (
                          <div
                            key={order.id}
                            className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3 hover:border-slate-300 transition"
                          >
                            {/* 헤더: 주문번호 / 상태뱃지 / 판매자 */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={`text-[10px] font-bold px-2 py-0.5 ${
                                    order.status === 'COMPLETED'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : order.status === 'SHIPPED'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : order.status === 'DELIVERED'
                                      ? 'bg-teal-50 text-teal-700 border-teal-200'
                                      : order.status === 'DISPUTED'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}
                                >
                                  {order.statusText}
                                </Badge>
                                <span className="font-mono text-xs text-slate-600 font-semibold flex items-center gap-1">
                                  <span>{order.orderNumber}</span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(order.orderNumber)
                                      toast({ title: '주문번호가 복사되었습니다.' })
                                    }}
                                    className="p-0.5 text-slate-400 hover:text-slate-700"
                                    title="주문번호 복사"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </span>
                              </div>
                              <span className="text-xs font-medium text-slate-500">
                                판매자: <strong className="text-slate-700">{order.seller}</strong>
                              </span>
                            </div>

                            {/* 바디: 이미지 + 상품명 + 옵션 + 가격 */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={order.image}
                                  alt={order.title}
                                  className="h-14 w-14 rounded-xl object-cover border border-slate-200 shrink-0"
                                />
                                <div className="min-w-0 space-y-0.5">
                                  <h5 className="font-extrabold text-sm text-slate-900 truncate">
                                    {order.title}
                                  </h5>
                                  {order.selectedOption && (
                                    <div className="inline-block bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                      선택옵션: {order.selectedOption}
                                    </div>
                                  )}
                                  <div className="font-black text-sm text-slate-900">
                                    {order.price.toLocaleString()}원
                                  </div>
                                </div>
                              </div>

                              {order.courier && order.trackingNumber && (
                                <div className="text-right text-xs shrink-0 hidden sm:block">
                                  <span className="text-slate-400 block text-[11px]">{order.courier}</span>
                                  <span className="font-mono font-semibold text-slate-700">{order.trackingNumber}</span>
                                </div>
                              )}
                            </div>

                            {/* 7일 자동 구매확정 안내 배너 */}
                            {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
                              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl px-3 py-1.5 text-[11px] text-amber-800 flex items-center justify-between">
                                <span className="flex items-center gap-1 font-medium">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  배송완료 후 7일 경과 시 판매자에게 대금이 자동 지급됩니다.
                                </span>
                                <span className="font-bold text-amber-900 font-mono">
                                  (자동확정 D-{order.autoConfirmDays || 5})
                                </span>
                              </div>
                            )}

                            {order.status === 'DISPUTED' && (
                              <div className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5 text-[11px] text-rose-800 flex items-center gap-1.5 font-medium">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>반품/교환 클레임 심사 중입니다. 판매자 확인 후 신속히 처리됩니다.</span>
                              </div>
                            )}

                            {/* 액션 버튼 그룹 */}
                            <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-100">
                              {order.trackingNumber && (
                                <Button
                                  onClick={() => setTrackingModalOrder(order)}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-8 px-3 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-100 gap-1"
                                >
                                  <Truck className="w-3.5 h-3.5 text-indigo-600" />
                                  실시간 배송조회
                                </Button>
                              )}

                              {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
                                <>
                                  <Button
                                    onClick={() => setConfirmModalOrder(order)}
                                    size="sm"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-8 px-3.5 rounded-xl shadow-xs gap-1"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    구매확정 (+500P)
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setReturnModalOrder(order)
                                      setReturnReason('DEFECT')
                                      setReturnDetailText('')
                                    }}
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs h-8 px-2.5 rounded-xl font-bold text-slate-500 hover:text-rose-600 gap-1"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    교환/반품 CS신청
                                  </Button>
                                </>
                              )}

                              {order.status === 'COMPLETED' && (
                                <Button
                                  onClick={() => {
                                    setReviewModalOrder(order)
                                    setReviewRating(5)
                                    setReviewComment('')
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-8 px-3 rounded-xl font-bold text-amber-600 border-amber-200 bg-amber-50/50 hover:bg-amber-100 gap-1"
                                >
                                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                  리뷰 작성 (+500P)
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* [모바일 앱 100% 동일] (6) 소셜 & 크리에이터 설정 (단가 & 알림 일원화) */}
              <div className="rounded-3xl bg-white p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b pb-3">
                  <Sliders className="h-4 w-4 text-purple-600" />
                  소셜 & 크리에이터 설정
                </h4>

                <div className="divide-y divide-slate-100">
                  {/* 1:1 대화 및 영상 단가설정 */}
                  <div className="py-3.5 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">1:1 대화 및 영상 단가설정</h5>
                      <p className="text-[11px] text-muted-foreground">
                        현재 설정: 채팅 건당 {chatRoomRate > 0 ? `${chatRoomRate} P` : '무료'} / 영상 분당 {videoCallRate.toLocaleString()} P
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

                {/* 회원 탈퇴 영역 */}
                {isAuthenticated && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">더 이상 모꼬 서비스를 이용하지 않으시나요?</span>
                    <button
                      type="button"
                      onClick={() => setIsWithdrawAccountOpen(true)}
                      className="text-[11px] font-bold text-slate-400 hover:text-rose-600 underline transition-colors"
                    >
                      회원 탈퇴하기
                    </button>
                  </div>
                )}
              </div>

              {/* [웹 전용 비즈니스 파트너스 & 크리에이터 센터 - 일반 회원을 방해하지 않도록 맨 하단 배치] */}
              <div className="rounded-3xl bg-slate-900 text-white p-6 border border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏢</span>
                      <h4 className="font-extrabold text-base text-white">
                        모꼬 비즈니스 파트너스 & 크리에이터 센터
                      </h4>
                      <Badge className="bg-purple-500/30 text-purple-200 border-none text-[10px] font-bold">
                        파트너스 전용
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      공식 사업자 B2C 마켓 판매 및 인플루언서 라이브 커머스 제휴 수익 채널입니다.
                    </p>
                  </div>
                  {role === 'ADMIN' && (
                    <Button
                      asChild
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs h-8 px-3 rounded-xl shadow-sm shrink-0"
                    >
                      <Link href="/dashboard">
                        <Crown className="h-3.5 w-3.5 mr-1 text-slate-950" />
                        총괄 운영 콘솔
                      </Link>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* (1) 입점사 카드 */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                          <Store className="h-4 w-4" />
                          공식 입점사 (B2C 마켓)
                        </span>
                        {role === 'MERCHANT' ? (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">인증 완료</Badge>
                        ) : (
                          <Badge className="bg-slate-700 text-slate-300 text-[9px] font-bold">사업자 전용</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        공식 B2C 마켓 및 공구 상품 등록, 주문 배송 관리 및 에스크로 자동 정산
                      </p>
                    </div>
                    {role === 'MERCHANT' ? (
                      <div className="flex gap-2">
                        <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 rounded-xl">
                          <Link href="/seller">셀러 콘솔 바로가기</Link>
                        </Button>
                        <Button onClick={() => router.push('/seller/products/new')} className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 rounded-xl">
                          + 상품 등록
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => requireAuth(() => openMerchantModal())} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 rounded-xl shadow-xs">
                        <Building2 className="h-3.5 w-3.5 mr-1" />
                        입점사 신청서 작성
                      </Button>
                    )}
                  </div>

                  {/* (2) 크리에이터 카드 */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-purple-400 flex items-center gap-1.5">
                          <Radio className="h-4 w-4" />
                          공식 크리에이터 (쇼호스트)
                        </span>
                        {role === 'CREATOR' ? (
                          <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-bold">인증 완료</Badge>
                        ) : (
                          <Badge className="bg-slate-700 text-slate-300 text-[9px] font-bold">인플루언서 제휴</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        입점사 인기 상품을 내 방송 핀에 걸고 대신 판매하여 건당 커미션 수익 획득
                      </p>
                    </div>
                    {role === 'CREATOR' ? (
                      <Button asChild className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-8 rounded-xl">
                        <Link href="/streamer">크리에이터 스튜디오 바로가기</Link>
                      </Button>
                    ) : (
                      <Button onClick={() => requireAuth(() => openCreatorModal())} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-8 rounded-xl shadow-xs">
                        <Mic className="h-3.5 w-3.5 mr-1" />
                        크리에이터 신청서 작성
                      </Button>
                    )}
                  </div>
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
                    사업자등록번호: 123-86-12345 | 대표: 정진우 | 통신판매업신고: 제 2026-서울강남-0123 호
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
      {/* 9. 전역 장바구니 우측 슬라이드 패널 (Cart Drawer)             */}
      {/* ========================================================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
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

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">장바구니가 비어 있습니다.</p>
                    <p className="text-xs text-slate-400">마켓 및 공동구매 상품을 담아보세요!</p>
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
... [truncated for diff preview]