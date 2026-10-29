'use client'

import React, { useState } from 'react'
import {
  X,
  ShieldCheck,
  Truck,
  RotateCcw,
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Share2,
  Heart,
  Store,
  Sparkles,
  ExternalLink,
} from 'lucide-react'

export interface MarketProductDetail {
  id: string
  name: string
  category: string
  type: 'C2C_USED' | 'B2C_NORMAL' | 'B2C_GROUP'
  price: number
  originalPrice?: number
  images: string[]
  description: string
  detailHtml?: string
  stock?: number
  shippingFee?: number
  isFreeShipping?: boolean
  freeShippingThreshold?: number

  // 1. 입점사(판매자) 사업자 정보 고시 (전자상거래법 제10조)
  merchantInfo?: {
    businessName: string
    representative: string
    businessNumber: string
    onlineOrderNumber: string
    address: string
    contactPhone: string
    customerServiceHours: string
  }

  // 2. 전자상거래 등에서의 상품 등의 정보제공에 관한 고시 (공정위 표준 고시)
  noticeInfo?: {
    itemModelName: string // 품명 및 모델명
    certification: string // 허가 및 인증사항
    origin: string // 제조국 (원산지)
    manufacturer: string // 제조자 / 수입자
    expirationDate: string // 소비기한 / 유통기한
    asContact: string // A/S 책임자와 전화번호
  }

  // 3. 배송 및 교환/반품 안내
  shippingInfo?: {
    courierName: string
    deliveryDays: string
    returnFee: number
    exchangeFee: number
    returnAddress: string
    nonReturnableReasons: string[]
  }

  // C2C 중고 전용 정보
  usedCondition?: 'S' | 'A' | 'B'
  isLiveSellLinked?: boolean
  sellerNickname?: string
  sellerAvatar?: string
  sellerLocation?: string
}

interface MarketProductDetailModalProps {
  product: MarketProductDetail | null
  isOpen: boolean
  onClose: () => void
  onBuy: (product: MarketProductDetail, quantity: number) => void
  onShare?: (product: MarketProductDetail) => void
  onLiveLinkedSell?: (product: MarketProductDetail) => void
}

export function MarketProductDetailModal({
  product,
  isOpen,
  onClose,
  onBuy,
  onShare,
  onLiveLinkedSell,
}: MarketProductDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'DETAIL' | 'NOTICE' | 'SHIPPING' | 'MERCHANT'>('DETAIL')
  const [currentImageIdx, setCurrentImageIdx] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isLiked, setIsLiked] = useState(false)

  if (!isOpen || !product) return null

  const isB2C = product.type === 'B2C_NORMAL' || product.type === 'B2C_GROUP'
  const isGroup = product.type === 'B2C_GROUP'
  const discountRate =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0

  const images = product.images && product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800']

  // Default merchant info fallback for B2C
  const merchant = product.merchantInfo || {
    businessName: '(주)모꼬 파트너스 공식인증사',
    representative: '홍길동',
    businessNumber: '123-86-78901',
    onlineOrderNumber: '제2026-서울강남-0123호',
    address: '서울특별시 강남구 테헤란로 152 강남파이낸스센터 18층',
    contactPhone: '1588-0923',
    customerServiceHours: '평일 09:30 ~ 18:00 (점심시간 12:30~13:30, 주말/공휴일 휴무)',
  }

  // Default notice info fallback
  const notice = product.noticeInfo || {
    itemModelName: product.name,
    certification: '해당사항 없음 (KC안전인증/식품위생법 안전검사 적합)',
    origin: '대한민국 (국산 100%)',
    manufacturer: '제휴 공식 제조원 및 본사 직영 생산시설',
    expirationDate: '제조일로부터 12개월 (포장별도표기, 신선 보장)',
    asContact: `${merchant.contactPhone} 또는 모꼬 고객센터 1:1 안심톡`,
  }

  // Default shipping info fallback
  const shipping = product.shippingInfo || {
    courierName: 'CJ대한통운 / 우체국택배 안심특송',
    deliveryDays: '오후 2시 이전 주문 시 당일 발송 (평균 1~2일 소요)',
    returnFee: 3000,
    exchangeFee: 6000,
    returnAddress: '경기도 이천시 물류센터로 45 모꼬안심물류센터 B동 3호',
    nonReturnableReasons: [
      '소비자의 책임 있는 사유로 상품 등이 멸실 또는 훼손된 경우',
      '소비자의 사용 또는 일부 소비로 상품의 가치가 현저히 감소한 경우',
      '시간의 경과에 의하여 재판매가 곤란할 정도로 상품의 가치가 현저히 감소한 경우 (신선식품 등)',
      '복제가 가능한 상품 등의 포장을 훼손한 경우',
    ],
  }

  const handlePrevImage = () => {
    setCurrentImageIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  const totalPrice = product.price * quantity
  const shippingCost = product.isFreeShipping || (product.freeShippingThreshold && totalPrice >= product.freeShippingThreshold) ? 0 : (product.shippingFee || 3000)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur z-10">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                product.type === 'C2C_USED'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : product.type === 'B2C_GROUP'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              }`}
            >
              {product.type === 'C2C_USED' ? 'C2C 중고마켓' : product.type === 'B2C_GROUP' ? '특가 공동구매' : '본사직영 마켓'}
            </span>
            <span className="text-xs text-slate-400 font-medium">카테고리: {product.category}</span>
          </div>

          <div className="flex items-center gap-2">
            {onShare && (
              <button
                onClick={() => onShare(product)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
                title="공유하기"
              >
                <Share2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm">
          
          {/* 1. Gallery Image Carousel */}
          <div className="relative w-full aspect-video sm:aspect-[16/9] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner group">
            <img
              src={images[currentImageIdx]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs font-semibold text-white">
                  {currentImageIdx + 1} / {images.length}
                </div>
              </>
            )}

            {/* Escrow Badge Tag */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-semibold shadow-lg backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>토스페이먼츠 PG 에스크로 100% 안심결제</span>
            </div>
          </div>

          {/* 2. Title & Pricing Section */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                {product.name}
              </h1>
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`p-2.5 rounded-2xl border transition ${
                  isLiked
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            {/* Price Row */}
            <div className="flex items-baseline gap-3 pt-1">
              {discountRate > 0 && (
                <span className="text-2xl sm:text-3xl font-extrabold text-rose-500">
                  {discountRate}%
                </span>
              )}
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {product.price.toLocaleString()}원
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-base text-slate-500 line-through">
                  {product.originalPrice.toLocaleString()}원
                </span>
              )}
            </div>

            {/* Group purchase banner */}
            {isGroup && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  🔥 <strong>특가 공동구매 진행중!</strong> 모꼬 회원 전용 즉시 할인가 적용 (남은 재고:{' '}
                  {product.stock || 50}개)
                </span>
              </div>
            )}
          </div>

          {/* 3. Escrow Guarantee Banner */}
          <div className="flex items-center gap-3 p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-semibold text-emerald-200">모꼬 안전 에스크로 100% 보증 상품</div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                상품을 정상 수령하고 [구매 확정]을 누르기 전까지 결제 대금이 플랫폼 금고에 안전하게 보관됩니다.
              </div>
            </div>
          </div>

          {/* 4. Tab Navigation */}
          <div className="flex border-b border-slate-800 pt-2 gap-2">
            <button
              onClick={() => setActiveTab('DETAIL')}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
                activeTab === 'DETAIL'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              상품 상세 설명
            </button>
            <button
              onClick={() => setActiveTab('NOTICE')}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'NOTICE'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>상품정보고시</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">공정위 규정</span>
            </button>
            <button
              onClick={() => setActiveTab('SHIPPING')}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
                activeTab === 'SHIPPING'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              배송/교환/반품 안내
            </button>
            <button
              onClick={() => setActiveTab('MERCHANT')}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'MERCHANT'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>판매자 정보</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-900/60 text-indigo-300">전자상거래법</span>
            </button>
          </div>

          {/* Tab Content 1: DETAIL */}
          {activeTab === 'DETAIL' && (
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60 whitespace-pre-line text-sm">
                {product.description || '상세 설명이 등록되지 않았습니다.'}
              </div>

              {/* Sub-Images inside description */}
              {images.slice(1).map((img, idx) => (
                <div key={idx} className="rounded-2xl overflow-hidden border border-slate-800 shadow-md">
                  <img src={img} alt={`상세 이미지 ${idx + 2}`} className="w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Tab Content 2: NOTICE (공정위 통신판매 상품정보제공고시 35대 표준 규격) */}
          {activeTab === 'NOTICE' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-slate-800/60 rounded-xl text-xs text-slate-300 border border-slate-700">
                <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  전자상거래 등에서의 상품 등의 정보제공에 관한 고시(공정거래위원회 고시)에 따라 작성되었습니다.
                </span>
              </div>

              <div className="border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 text-xs">
                <div className="grid grid-cols-3 bg-slate-900/60">
                  <div className="p-3 bg-slate-800/60 text-slate-400 font-semibold border-r border-slate-800">
                    품명 및 모델명
                  </div>
                  <div className="col-span-2 p-3 text-slate-200">{notice.itemModelName}</div>
                </div>
                <div className="grid grid-cols-3 bg-slate-900/60">
                  <div className="p-3 bg-slate-800/60 text-slate-400 font-semibold border-r border-slate-800">
                    인증 / 허가 사항
                  </div>
                  <div className="col-span-2 p-3 text-slate-200">{notice.certification}</div>
                </div>
                <div className="grid grid-cols-3 bg-slate-900/60">
                  <div className="p-3 bg-slate-800/60 text-slate-400 font-semibold border-r border-slate-800">
                    제조국 (원산지)
                  </div>
                  <div className="col-span-2 p-3 text-slate-200 font-medium text-indigo-300">
                    {notice.origin}
                  </div>
                </div>
                <div className="grid grid-cols-3 bg-slate-900/60">
                  <div className="p-3 bg-slate-800/60 text-slate-400 font-semibold border-r border-slate-800">
                    제조자 / 수입자
                  </div>
                  <div className="col-span-2 p-3 text-slate-200">{notice.manufacturer}</div>
                </div>
                <div className="grid grid-cols-3 bg-slate-900/60">
                  <div className="p-3 bg-slate-800/60 text-slate-400 font-semibold border-r border-slate-800">
                    소비기한 / 유통기한
                  </div>
                  <div className="col-span-2 p-3 text-slate-200">{notice.expirationDate}</div>
                </div>
                <div className="grid grid-cols-3 bg-slate-900/60">
                  <div className="p-3 bg-slate-800/60 text-slate-400 font-semibold border-r border-slate-800">
                    소비자상담 관련 전화번호
                  </div>
                  <div className="col-span-2 p-3 text-slate-200">{notice.asContact}</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3: SHIPPING (배송 / 교환 / 반품 안내) */}
          {activeTab === 'SHIPPING' && (
            <div className="space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Truck className="w-4 h-4" />
                    <span>배송 정보</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    • 택배사: <strong>{shipping.courierName}</strong>
                    <br />
                    • 발송일정: {shipping.deliveryDays}
                    <br />
                    • 기본 배송비:{' '}
                    {shippingCost === 0 ? (
                      <span className="text-emerald-400 font-bold">무료배송</span>
                    ) : (
                      `${shippingCost.toLocaleString()}원`
                    )}
                  </p>
                </div>

                <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <RotateCcw className="w-4 h-4" />
                    <span>반품 / 교환 배송비</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    • 반품 배송비: 편도 {shipping.returnFee.toLocaleString()}원 (최초 무료배송 시 6,000원)
                    <br />
                    • 교환 배송비: 왕복 {shipping.exchangeFee.toLocaleString()}원
                    <br />
                    • 반품 회수지: {shipping.returnAddress}
                  </p>
                </div>
              </div>

              {/* 청약철회 기준 (전자상거래법 제17조) */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <div className="font-bold text-slate-200">청약철회 및 교환/반품 불가 사유 (전자상거래법 준수)</div>
                <ul className="space-y-1 text-slate-400 list-disc pl-4 leading-relaxed">
                  {shipping.nonReturnableReasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tab Content 4: MERCHANT (판매자 사업자 정보 고시 - 전자상거래법 제10조) */}
          {activeTab === 'MERCHANT' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-indigo-400" />
                    <span className="font-bold text-sm text-white">{merchant.businessName}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    공식인증 입점사
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-y-2 gap-x-4 text-slate-300">
                  <div>
                    <span className="text-slate-500">대표자:</span> {merchant.representative}
                  </div>
                  <div>
                    <span className="text-slate-500">사업자등록번호:</span> {merchant.businessNumber}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500">통신판매업신고:</span> {merchant.onlineOrderNumber}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500">사업장 소재지:</span> {merchant.address}
                  </div>
                  <div>
                    <span className="text-slate-500">고객센터 문의:</span>{' '}
                    <strong className="text-indigo-400">{merchant.contactPhone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">운영시간:</span> {merchant.customerServiceHours}
                  </div>
                </div>
              </div>

              {/* 중고거래인 경우 판매자 프로필 표시 */}
              {product.type === 'C2C_USED' && product.sellerNickname && (
                <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.sellerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'}
                      alt={product.sellerNickname}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <div className="font-bold text-white text-sm">{product.sellerNickname} (이웃)</div>
                      <div className="text-slate-400">지역: {product.sellerLocation || '모꼬 동네인증 완료'}</div>
                    </div>
                  </div>
                  {product.isLiveSellLinked && onLiveLinkedSell && (
                    <button
                      onClick={() => onLiveLinkedSell(product)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold hover:bg-rose-500/30 transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>라이브 판매 연결</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Fixed Action Bar: 수량 조절 + 에스크로 안전구매 버튼 */}
        <div className="border-t border-slate-800 bg-slate-900/95 p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 z-10 backdrop-blur">
          
          {/* Quantity selector */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">수량</span>
              <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 text-slate-300 hover:bg-slate-700 transition font-bold"
                >
                  -
                </button>
                <span className="px-3 py-1.5 text-sm font-bold text-white min-w-[32px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="px-3 py-1.5 text-slate-300 hover:bg-slate-700 transition font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="text-right sm:text-left">
              <div className="text-xs text-slate-400">총 결제금액 (배송비 포함)</div>
              <div className="text-lg sm:text-xl font-extrabold text-white">
                {(totalPrice + shippingCost).toLocaleString()}원
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => onBuy(product, quantity)}
            className="w-full sm:w-auto flex-1 max-w-sm py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-base shadow-lg shadow-indigo-500/25 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
            <span>토스페이먼츠 에스크로 안전구매</span>
          </button>
        </div>

      </div>
    </div>
  )
}
