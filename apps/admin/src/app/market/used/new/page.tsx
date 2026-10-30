/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Camera,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MapPin,
  Truck,
  ShieldCheck,
  Radio,
  Tag,
  DollarSign,
  FileText,
  Info,
} from 'lucide-react'
import { useWebAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const CATEGORIES = [
  '디지털/가전',
  '패션/잡화',
  '의류',
  '가구/인테리어',
  '유아동/출산',
  '스포츠/레저',
  '취미/게임/음반',
  '도서/티켓',
  '뷰티/미용',
  '반려동물용품',
  '기타 중고물품',
]

const CONDITIONS = [
  { value: 'NEW', label: '미개봉 새상품', desc: '박스도 뜯지 않은 완전 미사용 새제품' },
  { value: 'LIKE_NEW', label: '거의 새것 (S급)', desc: '사용감이 거의 없고 외관상 흠집이 없는 상태' },
  { value: 'USED_GOOD', label: '사용감 적음 (A급)', desc: '정상 작동하며 약간의 자연스러운 생활 기스 수준' },
  { value: 'USED_NORMAL', label: '사용감 있음 (B급)', desc: '외관상 사용 흔적이나 잔기스가 눈에 띄는 상태' },
  { value: 'FOR_PARTS', label: '고장/부품용', desc: '수리가 필요하거나 부품 추출용 상태' },
]

export default function UsedItemRegisterPage() {
  const router = useRouter()
  const { user, openLoginModal } = useWebAuth()
  const { toast } = useToast()

  // Form State
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800',
  ])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('디지털/가전')
  const [condition, setCondition] = useState('LIKE_NEW')
  const [price, setPrice] = useState('')
  const [isFreeShare, setIsFreeShare] = useState(false)
  const [canProposePrice, setCanProposePrice] = useState(true)

  // Delivery & Location
  const [allowDirect, setAllowDirect] = useState(true)
  const [directLocation, setDirectLocation] = useState('서울 강남역 11번 출구 앞 또는 역삼동 일대')
  const [allowShipping, setAllowShipping] = useState(true)
  const [isShippingFree, setIsShippingFree] = useState(false)
  const [shippingFee, setShippingFee] = useState('3500')

  // Description
  const [description, setDescription] = useState('')

  // Live Broadcast Pin Linkage
  const [enableLivePin, setEnableLivePin] = useState(true)

  // Add Image URL
  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return
    if (images.length >= 10) {
      toast({
        title: '사진 등록 한도 초과',
        description: '사진은 최대 10장까지만 등록할 수 있습니다.',
        variant: 'destructive',
      })
      return
    }
    setImages([...images, newImageUrl.trim()])
    setNewImageUrl('')
  }

  // Remove Image
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  // Handle Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      openLoginModal?.()
      toast({
        title: '로그인이 필요합니다',
        description: '중고 물품을 등록하려면 먼저 모꼬 회원으로 로그인해 주세요.',
        variant: 'destructive',
      })
      return
    }

    if (images.length === 0) {
      toast({
        title: '사진을 최소 1장 이상 등록해주세요',
        description: '구매자가 물품 상태를 확인할 수 있는 실물 사진이 필요합니다.',
        variant: 'destructive',
      })
      return
    }

    if (!title.trim()) {
      toast({
        title: '제목을 입력해주세요',
        description: '물품의 정확한 브랜드와 품명을 포함해주시면 더 빨리 판매됩니다.',
        variant: 'destructive',
      })
      return
    }

    if (!isFreeShare && (!price || parseInt(price, 10) <= 0)) {
      toast({
        title: '판매 가격을 입력해주세요',
        description: '무료 나눔을 원하시면 "나눔하기" 체크박스를 선택해주세요.',
        variant: 'destructive',
      })
      return
    }

    if (!description.trim()) {
      toast({
        title: '상세 설명을 입력해주세요',
        description: '구입 시기, 사용 빈도, 하자 및 구성품 유무를 기재해주세요.',
        variant: 'destructive',
      })
      return
    }

    const newId = `used-${Date.now()}`
    const finalPrice = isFreeShare ? 0 : parseInt(price.replace(/,/g, ''), 10)

    const newProduct = {
      id: newId,
      name: title.trim(),
      category,
      type: 'C2C_USED',
      price: finalPrice,
      originalPrice: finalPrice,
      stock: 1,
      shippingFee: allowShipping ? (isShippingFree ? 0 : parseInt(shippingFee, 10) || 3500) : 0,
      isFreeShipping: isShippingFree,
      images,
      description,
      isUsed: true,
      conditionText: CONDITIONS.find((c) => c.value === condition)?.label,
      allowDirect,
      directLocation: allowDirect ? directLocation : undefined,
      allowShipping,
      enableLivePin,
      seller: {
        id: user?.id || 'usr-me',
        nickname: user?.nickname || '내 모꼬 상점',
        avatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        mannerTemp: 38.5,
        dealCount: 14,
        responseRate: '100%',
        verified: true,
      },
      createdAt: new Date().toISOString(),
    }

    // Save to localStorage for mock session persistence
    try {
      const existing = JSON.parse(localStorage.getItem('mocco_custom_products') || '[]')
      localStorage.setItem('mocco_custom_products', JSON.stringify([newProduct, ...existing]))
    } catch (err) {
      console.warn('Failed to save in localStorage', err)
    }

    toast({
      title: '중고물품이 성공적으로 등록되었습니다!',
      description: enableLivePin
        ? '내 모바일 라이브 방송 판매 핀 목록에도 자동 연동되었습니다.'
        : '상세 페이지로 이동합니다.',
    })

    // Navigate to the newly created product detail page
    setTimeout(() => {
      router.push(`/market/${newId}`)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <span>내 중고물품 판매 등록</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                  C2C 안심 직거래 & 에스크로
                </Badge>
              </h1>
              <p className="text-xs text-neutral-400">
                일반 회원 누구나 간편하게 등록하고 모바일 라이브 방송 핀으로도 바로 판매하세요
              </p>
            </div>
          </div>
          <Link
            href="/market"
            className="text-xs text-neutral-400 hover:text-white border border-neutral-700 px-3 py-1.5 rounded-lg transition"
          >
            마켓 목록으로
          </Link>
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Photos */}
          <section className="bg-neutral-800/60 border border-neutral-700/60 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-indigo-400" />
                  <span>상품 실물 사진 등록</span>
                  <span className="text-xs font-normal text-neutral-400">({images.length}/10)</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  첫 번째 사진이 마켓 목록과 방송 핀의 대표 썸네일로 노출됩니다.
                </p>
              </div>
            </div>

            {/* Thumbnail Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900 group"
                >
                  <img src={img} alt={`사진 ${idx + 1}`} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      대표사진
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 p-1 bg-black/70 hover:bg-red-600 text-white rounded-full transition opacity-90 group-hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add Image Slot */}
              {images.length < 10 && (
                <div className="aspect-square rounded-xl border-2 border-dashed border-neutral-700 hover:border-indigo-500 bg-neutral-900/40 flex flex-col items-center justify-center p-3 text-center transition">
                  <Upload className="w-6 h-6 text-neutral-400 mb-1" />
                  <span className="text-xs text-neutral-400 font-medium">사진 추가</span>
                  <span className="text-[10px] text-neutral-500">최대 10장</span>
                </div>
              )}
            </div>

            {/* Quick URL or File Input for Web Test */}
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="고화질 이미지 웹 주소(URL)를 입력하여 추가해보세요 (예: https://...)"
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              />
              <Button
                type="button"
                onClick={handleAddImageUrl}
                variant="outline"
                className="border-neutral-700 text-xs px-4"
              >
                사진 추가
              </Button>
            </div>
          </section>

          {/* Section 2: Basic Info */}
          <section className="bg-neutral-800/60 border border-neutral-700/60 rounded-2xl p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                상품 제목 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="물품명, 브랜드, 모델명을 명확하게 입력해주세요 (예: 아이폰 15 프로 256GB 블루티타늄)"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                maxLength={60}
              />
              <p className="text-right text-[11px] text-neutral-500 mt-1">{title.length}/60자</p>
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                카테고리 선택 <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      category === cat
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                        : 'bg-neutral-900 border border-neutral-700 text-neutral-300 hover:border-neutral-500'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Item Condition */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                상품 상태 등급 <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CONDITIONS.map((cond) => (
                  <label
                    key={cond.value}
                    onClick={() => setCondition(cond.value)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                      condition === cond.value
                        ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                        : 'bg-neutral-900/60 border-neutral-700 hover:border-neutral-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="condition"
                      checked={condition === cond.value}
                      onChange={() => setCondition(cond.value)}
                      className="mt-1 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{cond.label}</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">{cond.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* Section 3: Pricing */}
          <section className="bg-neutral-800/60 border border-neutral-700/60 rounded-2xl p-6 space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>판매 가격 설정</span>
            </h2>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 border border-neutral-700 px-4 py-2.5 rounded-xl">
                <input
                  type="checkbox"
                  checked={isFreeShare}
                  onChange={(e) => {
                    setIsFreeShare(e.target.checked)
                    if (e.target.checked) setPrice('0')
                  }}
                  className="rounded text-emerald-600 focus:ring-0"
                />
                <span className="text-xs font-bold text-emerald-400">따뜻한 무료나눔 ❤️</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 border border-neutral-700 px-4 py-2.5 rounded-xl">
                <input
                  type="checkbox"
                  checked={canProposePrice}
                  onChange={(e) => setCanProposePrice(e.target.checked)}
                  disabled={isFreeShare}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span className="text-xs text-neutral-300">구매자 가격 제안(흥정) 받기</span>
              </label>
            </div>

            {!isFreeShare && (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-base">
                  ₩
                </span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="판매 희망 금액을 입력해주세요 (원 단위)"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-9 pr-14 py-3 text-base font-bold text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                  원
                </span>
              </div>
            )}
          </section>

          {/* Section 4: Trade Methods */}
          <section className="bg-neutral-800/60 border border-neutral-700/60 rounded-2xl p-6 space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>거래 방식 & 희망 장소</span>
            </h2>

            {/* Direct Deal */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowDirect}
                  onChange={(e) => setAllowDirect(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  대면 직거래 가능
                </span>
              </label>

              {allowDirect && (
                <input
                  type="text"
                  value={directLocation}
                  onChange={(e) => setDirectLocation(e.target.value)}
                  placeholder="예: 서울 강남역 11번 출구 앞, 역삼초등학교 정문 등"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
              )}
            </div>

            {/* Shipping */}
            <div className="space-y-3 pt-3 border-t border-neutral-700/60">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowShipping}
                  onChange={(e) => setAllowShipping(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-indigo-400" />
                  택배 거래 가능 (에스크로 안전결제 적용)
                </span>
              </label>

              {allowShipping && (
                <div className="flex items-center gap-4 pl-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shippingType"
                      checked={isShippingFree}
                      onChange={() => setIsShippingFree(true)}
                    />
                    <span className="text-xs text-neutral-300">배송비 포함 (판매자 부담)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shippingType"
                      checked={!isShippingFree}
                      onChange={() => setIsShippingFree(false)}
                    />
                    <span className="text-xs text-neutral-300">배송비 별도</span>
                  </label>
                  {!isShippingFree && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={shippingFee}
                        onChange={(e) => setShippingFee(e.target.value)}
                        className="w-20 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-right text-white"
                      />
                      <span className="text-xs text-neutral-400">원</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Section 5: Description */}
          <section className="bg-neutral-800/60 border border-neutral-700/60 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>상세 설명</span> <span className="text-red-400">*</span>
            </h2>
            <textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`구매자에게 물품의 상태를 솔직하게 알려주세요.
- 구입 시기 및 실 사용 기간
- 눈에 띄는 흠집, 스크래치, 고장 여부
- 박스, 충전기, 보증서 등 동봉 구성품 유무
- 판매하는 솔직한 이유`}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-4 text-xs leading-relaxed text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </section>

          {/* Section 6: ★ Mobile Live Streaming Pin Linkage */}
          <section className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-700/50 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      내 모바일 라이브 방송 판매 핀(PIN) 자동 연동
                    </h3>
                    <Badge className="bg-red-500 text-white text-[10px] font-bold">모꼬 특허 기능</Badge>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    모꼬에서는 일반 회원도 누구나 모바일 앱으로 실시간 방송을 켤 수 있습니다!
                    <br />이 옵션을 켜두시면 방송 진행 시{' '}
                    <span className="text-amber-300 font-bold">&apos;내 중고물품&apos;</span> 목록에서 이 상품을 화면에
                    핀으로 고정하여 시청자들과 실시간 소통 및 즉석 라이브 판매를 하실 수 있습니다.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={enableLivePin}
                  onChange={(e) => setEnableLivePin(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          </section>

          {/* Section 7: Safe Deal Notice */}
          <div className="bg-neutral-800/40 border border-neutral-800 rounded-xl p-4 text-xs text-neutral-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              모꼬는 전자상거래 등에서의 소비자보호에 관한 법률 및 안전거래 가이드를 준수합니다.
              주류, 담배, 의약품, 가품/위조품 등 관련 법령상 거래가 금지된 품목은 등록 시 통보 없이 즉시 삭제 및 계정 제한 조치될 수 있습니다.
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-neutral-700 text-neutral-300 hover:text-white px-6"
            >
              취소
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-8 shadow-lg shadow-indigo-600/30"
            >
              중고물품 등록 완료
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}

