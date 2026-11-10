'use client'

import React, { useState, useRef, useEffect } from 'react'
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
  Loader2,
  Camera,
  Image as ImageIcon,
  Star,
  ChevronLeft,
  ChevronRight,
  FileText,
  Smartphone,
  Edit2,
  Trash2,
  Eye,
  Plus,
} from 'lucide-react'
import { uploadMultipleImageFiles } from '@/lib/uploadHelper'
import { type UserRole } from '@/lib/auth-context'
import type { MarketProductDetail } from './MarketProductDetailModal'

export interface CreateProductPayload {
  name: string
  category: string
  type: 'C2C_USED' | 'B2C_NORMAL' | 'B2C_GROUP'
  price: number
  originalPrice?: number
  stock: number
  description: string
  images: string[]
  detailImages?: string[]
  detailNotice?: string
  manufacturer?: string
  origin?: string
  csPhone?: string
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
  editProduct?: MarketProductDetail | null
  onSubmit: (data: CreateProductPayload, editProductId?: string) => void
}

const DETAIL_TEMPLATES: Record<string, string> = {
  food: `■ 상품 특장점
1. 100% 산지직송 프리미엄 원물 엄선 (신선도 최상)
2. HACCP 인증 시설 위생 가공 및 안심 포장
3. 모꼬 고객만을 위한 단독 기획 특가 구성

■ 보관 및 섭취/사용 방법
- 수령 즉시 내용물을 확인하시고 냉장/냉동 보관해 주세요.
- 조리 전 충분히 자연 해동하시면 본연의 육즙과 풍미를 즐기실 수 있습니다.`,
  digital: `■ 제품 주요 스펙 및 특장점
1. 최신 고성능 칩셋 탑재 및 고속 충전 완벽 지원
2. 국립전파연구원 KC 인증 정품 안전 설계
3. 구매일로부터 1년 무상 품질보증 A/S 제공

■ 사용 시 주의사항
- 정격 충전기를 사용해 주시고, 직사광선 및 고온 다습한 환경을 피해 주세요.`,
  fashion: `■ 상품 소재 및 디자인 포인트
1. 피부 저자극 인증 및 고품질 원단/성분 배합
2. 어떤 스타일에도 어울리는 감각적인 트렌드 디자인
3. 꼼꼼한 봉제 마감 및 엄격한 품질 검수 완료

■ 세탁 및 관리 요령
- 첫 세탁은 단독 세탁 또는 드라이클리닝을 권장합니다.`,
  shipping: `■ 배송 및 교환/반품 안내
1. 당일 14시 이전 결제 완료 시 당일 안심 출고 (우체국/CJ대한통운)
2. 파손 방지 에어캡 및 신선 보냉재 완벽 포장 발송
3. 상품 수령 후 파손 및 오배송 시 1:1 고객센터로 사진과 함께 접수해 주시면 즉시 교환/환불해 드립니다.`,
}

export function MarketProductCreateModal({
  isOpen,
  onClose,
  userRole,
  editProduct,
  onSubmit,
}: MarketProductCreateModalProps) {
  const isMerchant = userRole === 'MERCHANT' || userRole === 'ADMIN'
  const isEditMode = Boolean(editProduct)

  // Form states
  const [productType, setProductType] = useState<'C2C_USED' | 'B2C_NORMAL' | 'B2C_GROUP'>(
    isMerchant ? 'B2C_NORMAL' : 'C2C_USED'
  )
  const [name, setName] = useState('')
  const [category, setCategory] = useState('신선식품/농축수산')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [stock, setStock] = useState('50')
  const [description, setDescription] = useState('')
  const [shippingFee, setShippingFee] = useState('3000')
  const [isFreeShipping, setIsFreeShipping] = useState(false)

  // Images: Thumbnail / Gallery
  const [images, setImages] = useState<string[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [isUploadingThumbnails, setIsUploadingThumbnails] = useState(false)
  const [isDraggingThumbnails, setIsDraggingThumbnails] = useState(false)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  // Images: Detail Page Images
  const [detailImages, setDetailImages] = useState<string[]>([])
  const [isUploadingDetailImages, setIsUploadingDetailImages] = useState(false)
  const [isDraggingDetail, setIsDraggingDetail] = useState(false)
  const detailInputRef = useRef<HTMLInputElement>(null)
  const [detailTab, setDetailTab] = useState<'EDIT' | 'PREVIEW'>('EDIT')

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

  // Pre-fill fields on Edit Mode
  useEffect(() => {
    if (editProduct && isOpen) {
      setName(editProduct.name || '')
      setCategory(editProduct.category || '신선식품/농축수산')
      setProductType(editProduct.type || (isMerchant ? 'B2C_NORMAL' : 'C2C_USED'))
      setPrice(editProduct.price ? String(editProduct.price) : '')
      setOriginalPrice(editProduct.originalPrice ? String(editProduct.originalPrice) : '')
      setStock(editProduct.stock ? String(editProduct.stock) : '50')
      setDescription(editProduct.description || '')
      setImages(editProduct.images && editProduct.images.length > 0 ? editProduct.images : [])
      setDetailImages((editProduct as any).detailImages || [])
      setShippingFee(editProduct.shippingFee ? String(editProduct.shippingFee) : '3000')
      setIsFreeShipping(Boolean(editProduct.isFreeShipping || editProduct.shippingFee === 0))
      if (editProduct.usedCondition) {
        setUsedCondition(editProduct.usedCondition)
      }
      if (typeof editProduct.isLiveSellLinked === 'boolean') {
        setIsLiveSellLinked(editProduct.isLiveSellLinked)
      }
      if (editProduct.noticeInfo) {
        setNoticeItemModel(editProduct.noticeInfo.itemModelName || '')
        setNoticeOrigin(editProduct.noticeInfo.origin || '대한민국 (국산)')
        setNoticeManufacturer(editProduct.noticeInfo.manufacturer || '')
        setNoticeExpiration(editProduct.noticeInfo.expirationDate || '제조일로부터 12개월 (포장별도표기)')
        setNoticeAsContact(editProduct.noticeInfo.asContact || '1588-0923')
        setNoticeCert(editProduct.noticeInfo.certification || '해당사항 없음')
      }
    } else if (!editProduct && isOpen) {
      // Reset for creation
      setName('')
      setCategory('신선식품/농축수산')
      setProductType(isMerchant ? 'B2C_NORMAL' : 'C2C_USED')
      setPrice('')
      setOriginalPrice('')
      setStock('50')
      setDescription(DETAIL_TEMPLATES.food)
      setImages([])
      setDetailImages([])
      setShippingFee('3000')
      setIsFreeShipping(false)
      setUsedCondition('S')
      setIsLiveSellLinked(true)
      setNoticeItemModel('')
      setNoticeOrigin('대한민국 (국산)')
      setNoticeManufacturer('')
      setNoticeExpiration('제조일로부터 12개월 (포장별도표기)')
      setNoticeAsContact('1588-0923')
      setNoticeCert('해당사항 없음')
    }
  }, [editProduct, isOpen, isMerchant])

  if (!isOpen) return null

  // Thumbnail File Upload Handler
  const handleThumbnailFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (fileArray.length === 0) {
      alert('JPG, PNG, WEBP 등 이미지 형식의 파일만 선택해 주세요.')
      return
    }
    if (images.length + fileArray.length > 10) {
      alert(`대표 및 추가 이미지는 최대 10장까지 등록할 수 있습니다. (현재 ${images.length}장)`)
      return
    }

    try {
      setIsUploadingThumbnails(true)
      const urls = await uploadMultipleImageFiles(fileArray)
      setImages((prev) => [...prev, ...urls].slice(0, 10))
    } catch {
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploadingThumbnails(false)
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = ''
    }
  }

  // Detail Images File Upload Handler
  const handleDetailFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (fileArray.length === 0) {
      alert('JPG, PNG, WEBP 등 이미지 파일만 업로드할 수 있습니다.')
      return
    }

    try {
      setIsUploadingDetailImages(true)
      const urls = await uploadMultipleImageFiles(fileArray)
      setDetailImages((prev) => [...prev, ...urls].slice(0, 15))
    } catch {
      alert('상세페이지 이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploadingDetailImages(false)
      if (detailInputRef.current) detailInputRef.current.value = ''
    }
  }

  // Set as Primary Thumbnail
  const handleSetPrimary = (index: number) => {
    if (index === 0) return
    setImages((prev) => {
      const selected = prev[index]
      const rest = prev.filter((_, i) => i !== index)
      return [selected, ...rest]
    })
  }

  // Move Thumbnail Order
  const handleMoveThumbnail = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return
    setImages((prev) => {
      const copy = [...prev]
      const [item] = copy.splice(from, 1)
      copy.splice(to, 0, item)
      return copy
    })
  }

  const handleAddImageUrl = () => {
    if (!imageUrl.trim()) return
    setImages((prev) => [...prev, imageUrl.trim()].slice(0, 10))
    setImageUrl('')
    setShowUrlInput(false)
  }

  const handleRemoveThumbnail = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveDetailImage = (index: number) => {
    setDetailImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return alert('상품명을 입력해주세요.')
    if (!price || Number(price) <= 0) return alert('판매가격을 정확히 입력해주세요.')

    const finalImages = images.length > 0 ? images : ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800']

    const payload: CreateProductPayload = {
      name: name.trim(),
      category,
      type: productType,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      stock: Number(stock) || 1,
      description: description.trim(),
      images: finalImages,
      detailImages,
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

    onSubmit(payload, editProduct?.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              {isEditMode ? <Edit2 className="w-5 h-5" /> : <Store className="w-5 h-5" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {isEditMode
                    ? `✏️ 상품 정보 수정 (${name || '상품'})`
                    : isMerchant
                    ? '🏢 입점사 상품 등록 시스템'
                    : '📦 모꼬 중고마켓 상품 등록'}
                </h2>
                {isEditMode && (
                  <span className="bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    수정 모드
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEditMode
                  ? '내 PC의 사진 파일 변경, 상세페이지 이미지 추가, 가격 및 재고를 즉시 수정합니다.'
                  : '내 PC 사진 직접 첨부, 상세페이지 디자인 컷 및 공정위 고시 규격을 완벽 지원합니다.'}
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
          
          {/* 1. 상품 판매 유형 선택 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">상품 판매 유형</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProductType('C2C_USED')}
                className={`p-3 rounded-2xl border text-left transition ${
                  productType === 'C2C_USED'
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs sm:text-sm">🥕 C2C 중고거래</div>
                <div className="text-[11px] text-slate-400 mt-0.5">이웃 간 직거래/택배</div>
              </button>

              {isMerchant && (
                <>
                  <button
                    type="button"
                    onClick={() => setProductType('B2C_NORMAL')}
                    className={`p-3 rounded-2xl border text-left transition ${
                      productType === 'B2C_NORMAL'
                        ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300 font-bold'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs sm:text-sm">🛒 B2C 일반 마켓</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">신선식품/가전/뷰티</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProductType('B2C_GROUP')}
                    className={`p-3 rounded-2xl border text-left transition ${
                      productType === 'B2C_GROUP'
                        ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 font-bold'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs sm:text-sm">🔥 특가 공동구매</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">대량할인 프로모션</div>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 2. 대표 및 추가 상품 사진 업로드 (내 PC 파일 선택 + 드래그 앤 드롭) */}
          <div className="space-y-3 bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-700/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-400" />
                <span>상품 썸네일 사진 등록 (내 PC 파일 직접 업로드)</span>
                <span className="text-rose-400">*</span>
              </label>
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                {images.length}/10장 등록됨
              </span>
            </div>

            {/* 숨겨진 파일 Input */}
            <input
              type="file"
              ref={thumbnailInputRef}
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && handleThumbnailFiles(e.target.files)}
            />

            {/* 드래그 앤 드롭 및 파일 선택 영역 */}
            <div
              onClick={() => thumbnailInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDraggingThumbnails(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setIsDraggingThumbnails(false)
              }}
              onDrop={(e) => {
                e.preventDefault()
                setIsDraggingThumbnails(false)
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleThumbnailFiles(e.dataTransfer.files)
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                isDraggingThumbnails
                  ? 'border-indigo-400 bg-indigo-500/20 scale-[1.01]'
                  : 'border-slate-600 hover:border-indigo-400 bg-slate-800/70 hover:bg-slate-800'
              }`}
            >
              {isUploadingThumbnails ? (
                <div className="flex flex-col items-center gap-2 text-indigo-400 py-2">
                  <Loader2 className="w-7 h-7 animate-spin" />
                  <span className="text-xs font-bold">내 PC 사진 파일 업로드 중...</span>
                </div>
              ) : (
                <>
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white">
                    <span className="text-indigo-400 underline">내 PC에서 상품 사진 파일 선택</span> 또는 여기로 드래그하세요
                  </div>
                  <p className="text-[11px] text-slate-400">
                    JPG, PNG, WEBP 지원 · 복수 파일 한 번에 선택 가능 · 첫 번째 사진이 마켓 대표 썸네일
                  </p>
                </>
              )}
            </div>

            {/* 등록된 썸네일 갤러리 */}
            {images.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-[11px] text-slate-400">
                  * 사진을 클릭하여 대표 사진으로 지정하거나 순서를 변경할 수 있습니다.
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative aspect-square rounded-xl overflow-hidden border bg-slate-800 group shadow-sm transition ${
                        idx === 0 ? 'border-indigo-400 ring-2 ring-indigo-500/30' : 'border-slate-700'
                      }`}
                    >
                      <img src={img} alt={`상품컷 ${idx + 1}`} className="w-full h-full object-cover" />
                      
                      {/* 대표 뱃지 또는 대표 지정 버튼 */}
                      {idx === 0 ? (
                        <span className="absolute top-1 left-1 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-white" /> 대표
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSetPrimary(idx)
                          }}
                          className="absolute top-1 left-1 bg-black/70 hover:bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition shadow"
                        >
                          대표로 지정
                        </button>
                      )}

                      {/* 삭제 버튼 */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveThumbnail(idx)
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition shadow opacity-0 group-hover:opacity-100"
                        title="사진 삭제"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      {/* 좌우 이동 */}
                      <div className="absolute bottom-1 inset-x-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition bg-black/70 rounded px-1 py-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMoveThumbnail(idx, idx - 1)
                          }}
                          className="text-white hover:text-indigo-300 disabled:opacity-30"
                          title="왼쪽 이동"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <span className="text-[9px] text-white font-mono">{idx + 1}</span>
                        <button
                          type="button"
                          disabled={idx === images.length - 1}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMoveThumbnail(idx, idx + 1)
                          }}
                          className="text-white hover:text-indigo-300 disabled:opacity-30"
                          title="오른쪽 이동"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 보조 URL 입력 (접힘) */}
            <div className="pt-2 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1.5 transition"
              >
                <span>{showUrlInput ? '▲ URL 직접 입력 닫기' : '🔗 웹 이미지 URL 주소로 추가하기 (선택)'}</span>
              </button>

              {showUrlInput && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... 이미지 웹 주소 입력"
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition"
                  >
                    추가
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 3. 기본 정보 (상품명, 카테고리, 가격, 재고) */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300">
                상품명 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: [제주산지직송] 1+등급 제주 흑돼지 오겹살 1kg"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-semibold"
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                실제 판매가격 (원) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="예: 32900"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-bold text-amber-300"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">정상 소비자가 (할인 전 금액)</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="예: 45000 (할인율 자동 계산)"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* 4. 상세페이지 디자인 통 이미지 & 설명 에디터 */}
          <div className="space-y-4 bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-700/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/70 pb-3">
              <div>
                <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>상세페이지 디자인 컷 이미지 & 본문 설명</span>
                  <span className="text-rose-400">*</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  포토샵, 캔바 등으로 만든 세로형 상세페이지 이미지와 텍스트 설명을 함께 등록합니다.
                </p>
              </div>

              {/* 편집 / 미리보기 탭 전환 */}
              <div className="flex items-center bg-slate-800 p-1 rounded-xl w-fit border border-slate-700">
                <button
                  type="button"
                  onClick={() => setDetailTab('EDIT')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    detailTab === 'EDIT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ✏️ 본문 편집
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('PREVIEW')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                    detailTab === 'PREVIEW' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  미리보기
                </button>
              </div>
            </div>

            {detailTab === 'EDIT' ? (
              <div className="space-y-4">
                {/* 파트 A: 상세페이지 전용 디자인 통 이미지 직접 업로드 */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                      상세페이지 디자인 컷 파일 직접 첨부 (선택)
                    </span>
                    <span className="text-xs font-bold text-purple-400">
                      {detailImages.length}개 등록됨
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={detailInputRef}
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && handleDetailFiles(e.target.files)}
                  />

                  <div
                    onClick={() => detailInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDraggingDetail(true)
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault()
                      setIsDraggingDetail(false)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDraggingDetail(false)
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleDetailFiles(e.dataTransfer.files)
                      }
                    }}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                      isDraggingDetail
                        ? 'border-purple-400 bg-purple-500/20'
                        : 'border-slate-600 hover:border-purple-400 bg-slate-800/40 hover:bg-slate-800'
                    }`}
                  >
                    {isUploadingDetailImages ? (
                      <div className="flex items-center gap-2 text-purple-400 text-xs py-1">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>상세 이미지 업로드 중...</span>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5 text-purple-400" />
                        <div className="text-xs font-bold text-white">
                          <span className="text-purple-400 underline">내 PC에서 상세페이지 이미지 파일 추가</span> 또는 드래그
                        </div>
                        <p className="text-[10px] text-slate-400">
                          캔바/망고보드 세로 통 이미지, 제품 인증서, 성분표 등 고화질 이미지 순서대로 노출
                        </p>
                      </>
                    )}
                  </div>

                  {/* 등록된 상세페이지 이미지 목록 */}
                  {detailImages.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto py-1">
                      {detailImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative w-16 h-20 rounded-lg overflow-hidden border border-slate-700 bg-slate-800 shrink-0 group"
                        >
                          <img src={img} alt={`상세컷 ${idx + 1}`} className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[9px] text-center py-0.5">
                            {idx + 1}번 컷
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDetailImage(idx)}
                            className="absolute top-1 right-1 p-0.5 bg-black/70 hover:bg-rose-600 text-white rounded-full transition shadow"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 파트 B: 상세 텍스트 작성 & 빠른 템플릿 버튼 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      상세 안내 본문 작성 <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 mr-1">빠른 템플릿:</span>
                      <button
                        type="button"
                        onClick={() => setDescription(DETAIL_TEMPLATES.food)}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] border border-slate-700"
                      >
                        신선식품
                      </button>
                      <button
                        type="button"
                        onClick={() => setDescription(DETAIL_TEMPLATES.digital)}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] border border-slate-700"
                      >
                        디지털
                      </button>
                      <button
                        type="button"
                        onClick={() => setDescription(DETAIL_TEMPLATES.fashion)}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] border border-slate-700"
                      >
                        뷰티/패션
                      </button>
                      <button
                        type="button"
                        onClick={() => setDescription((prev) => `${prev}\n\n${DETAIL_TEMPLATES.shipping}`)}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] border border-slate-700"
                      >
                        +배송안내
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    placeholder="소비자에게 상품의 특장점, 원재료, 규격 및 섭취/사용 주의사항을 자세히 안내해 주세요."
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs sm:text-sm leading-relaxed font-sans"
                    required
                  />
                </div>
              </div>
            ) : (
              /* PREVIEW TAB */
              <div className="space-y-4 p-4 bg-slate-950/60 rounded-xl border border-slate-800 max-h-[360px] overflow-y-auto">
                <div className="text-xs text-indigo-400 font-bold flex items-center gap-1.5 pb-2 border-b border-slate-800">
                  <Smartphone className="w-4 h-4" />
                  실제 모바일/웹 고객 상세페이지 화면 미리보기
                </div>

                {/* 1. 디자인 이미지 컷 스택 */}
                {detailImages.length > 0 ? (
                  <div className="space-y-2">
                    {detailImages.map((img, i) => (
                      <img key={i} src={img} alt={`detail-${i}`} className="w-full rounded-lg shadow-sm" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                    등록된 상세 디자인 컷이 없습니다. (텍스트 본문만 노출됩니다)
                  </div>
                )}

                {/* 2. 텍스트 본문 렌더링 */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                  {description || '상세 설명이 비어있습니다.'}
                </div>
              </div>
            )}
          </div>

          {/* 5. C2C 일반회원 전용: 내 라이브 방송 연동 옵션 */}
          {productType === 'C2C_USED' && (
            <div className="p-4 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video className="w-6 h-6 text-purple-400 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-purple-200">
                    내 모바일 라이브 방송 핀 상품으로 연동
                  </div>
                  <div className="text-xs text-slate-400">
                    모바일 앱에서 라이브 방송을 켤 때 이 물품을 화면에 핀으로 띄워 실시간 판매할 수 있습니다.
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

          {/* 6. 입점사 전용: 대한민국 통신판매 상품정보제공고시 필수 6대 항목 입력 */}
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
                    placeholder="예: (주)모꼬 본사 공식 제조원"
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

          {/* 7. 배송비 정책 */}
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
              <span>{isEditMode ? '상품 수정 내용 저장하기' : '상품 등록 완료'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
