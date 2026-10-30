'use client'

import React, { useState } from 'react'
import {
  X,
  Upload,
  Building2,
  Store,
  Sparkles,
  ShieldCheck,
  Check,
  Radio,
  AlertCircle,
  Video,
} from 'lucide-react'
import { type UserRole } from '@/lib/auth-context'

export interface CreateProductPayload {
  name: string
  category: string
  type: 'C2C_USED' | 'B2C_NORMAL' | 'B2C_GROUP'
  price: number
  originalPrice?: number
  stock: number
  description: string
  images: string[]
  shippingFee: number
  isFreeShipping: boolean
  freeShippingThreshold?: number

  // B2C 통신판매 고시 정보
  noticeInfo?: {
    itemModelName: string
    certification: string
    origin: string
    manufacturer: string
    expirationDate: string
    asContact: string
  }

  // C2C 중고 전용
  usedCondition?: 'S' | 'A' | 'B'
  isLiveSellLinked?: boolean
}

interface MarketProductCreateModalProps {
  isOpen: boolean
  onClose: () => void
  userRole: UserRole
  onSubmit: (data: CreateProductPayload) => void
}

export function MarketProductCreateModal({
  isOpen,
  onClose,
  userRole,
  onSubmit,
}: MarketProductCreateModalProps) {
  const isMerchant = userRole === 'MERCHANT' || userRole === 'ADMIN'

  // Form states
  const [productType, setProductType] = useState<'C2C_USED' | 'B2C_NORMAL' | 'B2C_GROUP'>(
    isMerchant ? 'B2C_NORMAL' : 'C2C_USED'
  )
  const [name, setName] = useState('')
  const [category, setCategory] = useState('신선식품/농축수산')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [stock, setStock] = useState('10')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [shippingFee, setShippingFee] = useState('3000')
  const [isFreeShipping, setIsFreeShipping] = useState(false)

  // C2C 중고 필드
  const [usedCondition, setUsedCondition] = useState<'S' | 'A' | 'B'>('S')
  const [isLiveSellLinked, setIsLiveSellLinked] = useState(true)

  // B2C 고시 필드
  const [noticeItemModel, setNoticeItemModel] = useState('')
  const [noticeOrigin, setNoticeOrigin] = useState('대한민국 (국산)')
  const [noticeManufacturer, setNoticeManufacturer] = useState('')
  const [noticeExpiration, setNoticeExpiration] = useState('제조일로부터 12개월 (포장별도표기)')
  const [noticeAsContact, setNoticeAsContact] = useState('1588-0923')
  const [noticeCert, setNoticeCert] = useState('해당사항 없음')

  if (!isOpen) return null

  const handleAddImage = () => {
    if (!imageUrl.trim()) return
    setImages((prev) => [...prev, imageUrl.trim()])
    setImageUrl('')
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return alert('상품명을 입력해주세요.')
    if (!price || Number(price) <= 0) return alert('판매가격을 정확히 입력해주세요.')
    if (images.length === 0) {
      // Default fallback sample image
      images.push('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800')
    }

    const payload: CreateProductPayload = {
      name: name.trim(),
      category,
      type: productType,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      stock: Number(stock) || 1,
      description: description.trim(),
      images,
      shippingFee: isFreeShipping ? 0 : Number(shippingFee) || 0,
      isFreeShipping,
      freeShippingThreshold: isFreeShipping ? 0 : 50000,
    }

    if (productType === 'C2C_USED') {
      payload.usedCondition = usedCondition
      payload.isLiveSellLinked = isLiveSellLinked
    } else {
      payload.noticeInfo = {
        itemModelName: noticeItemModel || name,
        certification: noticeCert,
        origin: noticeOrigin,
        manufacturer: noticeManufacturer || '본사 공식 제조원',
        expirationDate: noticeExpiration,
        asContact: noticeAsContact,
      }
    }

    onSubmit(payload)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur z-10">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Store className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isMerchant ? '🏢 입점사 상품 등록 시스템' : '📦 모꼬 중고마켓 상품 등록'}
              </h2>
              <p className="text-xs text-slate-400">
                {isMerchant
                  ? '대한민국 통신판매 규정에 맞춘 공식 마켓/공구 등록'
                  : '이웃 간 C2C 안전거래 및 라이브 판매 연동 등록'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm">
          
          {/* 1. 상품 판매 유형 선택 (입점사인 경우 일반마켓 vs 공구 선택 가능) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">상품 판매 유형</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProductType('C2C_USED')}
                className={`p-3 rounded-2xl border text-left transition ${
                  productType === 'C2C_USED'
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm">C2C 중고거래</div>
                <div className="text-[11px] text-slate-400 mt-0.5">이웃 간 직거래/택배</div>
              </button>

              {isMerchant && (
                <>
                  <button
                    type="button"
                    onClick={() => setProductType('B2C_NORMAL')}
                    className={`p-3 rounded-2xl border text-left transition ${
                      productType === 'B2C_NORMAL'
                        ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs sm:text-sm">B2C 일반 마켓</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">신선식품/가전/뷰티</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProductType('B2C_GROUP')}
                    className={`p-3 rounded-2xl border text-left transition ${
                      productType === 'B2C_GROUP'
                        ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs sm:text-sm">🔥 특가 공동구매</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">대량할인 프로모션</div>
                  </button>
                </>
              )}
            </div>
            {!isMerchant && (
              <p className="text-[11px] text-slate-400">
                * B2C 마켓 및 공구 등록은 <strong>[입점사 승인]</strong>을 받은 사업자 회원만 가능합니다.
              </p>
            )}
          </div>

          {/* 2. 기본 정보 (상품명, 카테고리) */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300">
                상품명 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: [제주산지직송] 1+등급 제주 흑돼지 오겹살 600g"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
              >
                <option value="신선식품/농축수산">신선식품 / 농축수산</option>
                <option value="디지털/가전">디지털 / 가전</option>
                <option value="패션/의류">패션 / 의류</option>
                <option value="뷰티/미용">뷰티 / 미용</option>
                <option value="생활/주방">생활 / 주방용품</option>
                <option value="취미/게임">취미 / 게임</option>
                <option value="도서/음반">도서 / 음반</option>
                <option value="기타">기타 중고용품</option>
              </select>
            </div>

            {/* C2C 전용: 상태등급 / B2C 전용: 재고수량 */}
            {productType === 'C2C_USED' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">중고 상태 등급</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setUsedCondition('S')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      usedCondition === 'S'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    S급 (새상품급)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsedCondition('A')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      usedCondition === 'A'
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    A급 (사용감적음)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsedCondition('B')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      usedCondition === 'B'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    B급 (일반중고)
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">재고 수량</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="예: 50"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
            )}
          </div>

          {/* 3. 가격 설정 */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                실제 판매가격 (원) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="예: 25000"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-bold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">정상 소비자가 (할인 전 금액)</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="예: 35000 (할인율 표시용)"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* 4. C2C 일반회원 전용: 내 라이브 방송 연동 옵션 */}
          {productType === 'C2C_USED' && (
            <div className="p-4 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video className="w-6 h-6 text-purple-400 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-purple-200">
                    내 모바일 라이브 방송 핀 상품으로 연동
                  </div>
                  <div className="text-xs text-slate-400">
                    모바일 앱에서 라이브 방송을 켤 때 이 중고물품을 화면에 핀으로 띄워 실시간 판매할 수 있습니다.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isLiveSellLinked}
                onChange={(e) => setIsLiveSellLinked(e.target.checked)}
                className="w-5 h-5 accent-purple-500 rounded cursor-pointer"
              />
            </div>
          )}

          {/* 5. 상품 이미지 등록 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">상품 이미지 URL (최소 1장 이상)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition"
              >
                이미지 추가
              </button>
            </div>

            {images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-700 shrink-0 group">
                    <img src={img} alt={`상품 ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. 상세 설명 */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              상세 설명 <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="상품의 특장점, 상세 스펙, 보관 방법 등을 자세히 적어주세요."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm leading-relaxed"
              required
            />
          </div>

          {/* 7. 입점사 전용: 대한민국 통신판매 상품정보제공고시 필수 6대 항목 입력 */}
          {productType !== 'C2C_USED' && (
            <div className="p-4 bg-slate-800/60 border border-indigo-500/30 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Building2 className="w-4 h-4" />
                <span>대한민국 통신판매 상품정보고시 필수 기재사항 (공정위 규격)</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400">품명 및 모델명</span>
                  <input
                    type="text"
                    value={noticeItemModel}
                    onChange={(e) => setNoticeItemModel(e.target.value)}
                    placeholder="상단 상품명과 동일 시 비워둠"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400">제조국 (원산지)</span>
                  <input
                    type="text"
                    value={noticeOrigin}
                    onChange={(e) => setNoticeOrigin(e.target.value)}
                    placeholder="예: 대한민국 (국산)"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400">제조자 / 수입자</span>
                  <input
                    type="text"
                    value={noticeManufacturer}
                    onChange={(e) => setNoticeManufacturer(e.target.value)}
                    placeholder="예: (주)모꼬 본사 직영 생산라인"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400">소비기한 또는 유통기한</span>
                  <input
                    type="text"
                    value={noticeExpiration}
                    onChange={(e) => setNoticeExpiration(e.target.value)}
                    placeholder="예: 제조일로부터 12개월 (포장별도표기)"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400">소비자상담 관련 전화번호</span>
                  <input
                    type="text"
                    value={noticeAsContact}
                    onChange={(e) => setNoticeAsContact(e.target.value)}
                    placeholder="예: 1588-0923"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400">허가 / 인증 사항</span>
                  <input
                    type="text"
                    value={noticeCert}
                    onChange={(e) => setNoticeCert(e.target.value)}
                    placeholder="예: HACCP 인증 / 해당없음"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 8. 배송비 정책 */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">기본 배송비 (원)</label>
              <input
                type="number"
                disabled={isFreeShipping}
                value={isFreeShipping ? 0 : shippingFee}
                onChange={(e) => setShippingFee(e.target.value)}
                placeholder="예: 3000"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm disabled:opacity-50"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="freeShipping"
                checked={isFreeShipping}
                onChange={(e) => setIsFreeShipping(e.target.checked)}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
              <label htmlFor="freeShipping" className="text-xs text-slate-300 font-medium cursor-pointer">
                전국 무료배송 상품으로 등록
              </label>
            </div>
          </div>

          {/* Footer Submit Button */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition active:scale-95 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>상품 등록 완료</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}

