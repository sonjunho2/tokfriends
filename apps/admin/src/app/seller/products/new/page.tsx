/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  Package,
  Store,
  Sparkles,
  Camera,
  Upload,
  X,
  FileText,
  Truck,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Users,
  Radio,
  Percent,
  HelpCircle,
  Eye,
} from 'lucide-react'
import { useWebAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const CATEGORIES = [
  '식품/신선',
  '디지털/가전',
  '패션/뷰티',
  '리빙/생활',
  '키즈/유아동',
  '스포츠/레저',
  '반려동물용품',
  '문구/취미',
]

const NOTICE_TEMPLATES: Record<string, { [key: string]: string }> = {
  '식품/신선': {
    itemModelName: '1+등급 한우/신선 가공식품 (상세표기)',
    certification: 'HACCP 위생안전인증 및 축산물이력제 등록',
    origin: '대한민국 (국내산 100%)',
    manufacturer: '(주)모꼬 파트너스 신선가공센터',
    expirationDate: '제조일로부터 냉장 7일 (포장 별도표기)',
    asContact: '입점사 고객센터 또는 1:1 안심상담톡',
  },
  '디지털/가전': {
    itemModelName: '스마트 음향/무선 가전 기기',
    certification: '국립전파연구원 KC 안전인증 완료 (R-R-MCK-2026)',
    origin: '대한민국 또는 정식 수입품',
    manufacturer: '(주)제조사 본사 / 공식 수입원',
    expirationDate: '해당 없음 (무상 보증 1년 제공)',
    asContact: '공식 서비스센터 및 모꼬 고객지원팀',
  },
  '패션/뷰티': {
    itemModelName: '트렌드 패션의류 / 저자극 기능성 화장품',
    certification: '화장품법 / 섬유제품 안전기준 적합 확인',
    origin: '대한민국',
    manufacturer: '(주)화장품 제조판매업 등록사',
    expirationDate: '개봉 전 36개월, 개봉 후 12개월',
    asContact: '02-1588-0000 모꼬 뷰티케어센터',
  },
  '리빙/생활': {
    itemModelName: '프리미엄 리빙 생활용품',
    certification: 'KC 안전기준 적합확인 안전인증',
    origin: '대한민국',
    manufacturer: '협력사 파트너 물류센터',
    expirationDate: '해당 없음 (반영구)',
    asContact: '1588-0000',
  },
}

export default function SellerProductRegisterPage() {
  const router = useRouter()
  const { user } = useWebAuth()
  const { toast } = useToast()

  // Form States
  const [saleType, setSaleType] = useState<'B2C_NORMAL' | 'B2C_GROUP'>('B2C_NORMAL')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('식품/신선')
  const [regularPrice, setRegularPrice] = useState('45000')
  const [price, setPrice] = useState('32900')
  const [stock, setStock] = useState('150')

  // Group Buy Settings
  const [groupTargetCount, setGroupTargetCount] = useState('50')
  const [groupDiscountRate, setGroupDiscountRate] = useState('25')
  const [groupDays, setGroupDays] = useState('3')

  // Creator Commission
  const [allowCreatorSales, setAllowCreatorSales] = useState(true)
  const [creatorCommissionRate, setCreatorCommissionRate] = useState('15')

  // Images
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000',
  ])
  const [newImageUrl, setNewImageUrl] = useState('')

  // Detailed Description
  const [description, setDescription] = useState(`■ 상품 특장점
1. 100% 산지직송 프리미엄 원물 엄선 (신선도 최상)
2. HACCP 인증 시설 위생 가공 및 안심 포장
3. 모꼬 고객만을 위한 단독 기획 특가 구성

■ 보관 및 섭취/사용 방법
- 수령 즉시 내용물을 확인하시고 냉장/냉동 보관해 주세요.`)

  // Fair Trade Commission Mandatory Notice
  const [notice, setNotice] = useState(NOTICE_TEMPLATES['식품/신선'])

  // Shipping & Return
  const [courierName, setCourierName] = useState('CJ대한통운')
  const [shippingFeeType, setShippingFeeType] = useState<'FREE' | 'PAID' | 'CONDITIONAL'>('CONDITIONAL')
  const [baseShippingFee, setBaseShippingFee] = useState('3000')
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('50000')
  const [returnFee, setReturnFee] = useState('3500')
  const [exchangeFee, setExchangeFee] = useState('7000')
  const [dispatchDays, setDispatchDays] = useState('평일 오후 2시 이전 결제 완료 시 당일 발송 (익일 도착 보장)')

  // Seller Business Info (전자상거래법 제10조 필수 표기)
  const [businessInfo, setBusinessInfo] = useState({
    businessName: '(주)모꼬글로벌 파트너스',
    representative: '정진우',
    businessNumber: '123-86-12345',
    onlineOrderNumber: '제 2026-서울강남-0123 호',
    address: '서울특별시 강남구 테헤란로 152 강남파이낸스센터 12층',
    contactPhone: '1588-0000',
    customerServiceHours: '평일 09:30 ~ 18:00 (점심시간 12:30~13:30 / 주말 공휴일 휴무)',
  })

  // Handle Category Change
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat)
    if (NOTICE_TEMPLATES[newCat]) {
      setNotice(NOTICE_TEMPLATES[newCat])
    }
  }

  // Handle Add Image
  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return
    if (images.length >= 10) {
      toast({
        title: '이미지 초과',
        description: '이미지는 최대 10장까지만 등록 가능합니다.',
        variant: 'destructive',
      })
      return
    }
    setImages([...images, newImageUrl.trim()])
    setNewImageUrl('')
  }

  // Handle Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: '상품명을 입력해주세요',
        variant: 'destructive',
      })
      return
    }

    if (!price || parseInt(price, 10) <= 0) {
      toast({
        title: '판매가를 올바르게 입력해주세요',
        variant: 'destructive',
      })
      return
    }

    const newId = `prod-${Date.now()}`
    const finalPrice = parseInt(price.replace(/,/g, ''), 10)
    const original = parseInt(regularPrice.replace(/,/g, ''), 10) || finalPrice

    const newProduct = {
      id: newId,
      name: name.trim(),
      category,
      type: saleType,
      price: finalPrice,
      originalPrice: original,
      stock: parseInt(stock, 10) || 50,
      shippingFee: shippingFeeType === 'FREE' ? 0 : parseInt(baseShippingFee, 10) || 3000,
      isFreeShipping: shippingFeeType === 'FREE',
      freeShippingThreshold:
        shippingFeeType === 'CONDITIONAL' ? parseInt(freeShippingThreshold, 10) || 50000 : 0,
      images,
      description,
      creatorCommissionRate: allowCreatorSales ? parseInt(creatorCommissionRate, 10) : 0,
      allowCreatorSales,
      groupBuy:
        saleType === 'B2C_GROUP'
          ? {
              targetCount: parseInt(groupTargetCount, 10) || 30,
              currentCount: 0,
              discountRate: parseInt(groupDiscountRate, 10) || 20,
              endTime: new Date(Date.now() + parseInt(groupDays, 10) * 86400000).toISOString(),
            }
          : undefined,
      merchantInfo: businessInfo,
      noticeInfo: notice,
      shippingInfo: {
        courierName,
        deliveryDays: dispatchDays,
        returnFee: parseInt(returnFee, 10) || 3500,
        exchangeFee: parseInt(exchangeFee, 10) || 7000,
        returnAddress: '경기도 이천시 모꼬 풀필먼트 제1센터 (입점사 반품 접수처)',
        nonReturnableReasons: [
          '신선/냉장/냉동 식품의 경우 단순 변심에 의한 반품 불가',
          '개봉 후 상품 가치가 훼손되었거나 사용 흔적이 있는 경우',
          '고객 부주의로 인한 파손 및 멸실의 경우',
        ],
      },
      createdAt: new Date().toISOString(),
      orderCount: 0,
      rating: 5.0,
      reviewCount: 0,
    }

    // Save to localStorage mock
    try {
      const existing = JSON.parse(localStorage.getItem('mocco_custom_products') || '[]')
      localStorage.setItem('mocco_custom_products', JSON.stringify([newProduct, ...existing]))
    } catch (err) {
      console.warn('Failed to save product in storage', err)
    }

    toast({
      title: '상품이 정식 승인 등록되었습니다!',
      description: '대한민국 전자상거래 규격에 맞게 상세페이지가 즉시 오픈됩니다.',
    })

    setTimeout(() => {
      router.push(`/market/${newId}`)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
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
                <span>입점사 셀러 센터 | 신규 상품 등록</span>
                <Badge className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs">
                  B2C 마켓 & 공구 표준
                </Badge>
              </h1>
              <p className="text-xs text-neutral-400">
                대한민국 공정거래위원회 35대 표준 상품고시 및 전자상거래 규정을 완벽하게 지원합니다
              </p>
            </div>
          </div>
          <Link
            href="/seller/products"
            className="text-xs text-neutral-400 hover:text-white border border-neutral-700 px-3 py-1.5 rounded-lg transition"
          >
            내 상품 목록 관리
          </Link>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Sales Type */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Store className="w-5 h-5 text-indigo-400" />
              <span>판매 유형 선택</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                onClick={() => setSaleType('B2C_NORMAL')}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                  saleType === 'B2C_NORMAL'
                    ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <input
                  type="radio"
                  name="saleType"
                  checked={saleType === 'B2C_NORMAL'}
                  onChange={() => setSaleType('B2C_NORMAL')}
                  className="mt-1 text-indigo-600 focus:ring-0"
                />
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>일반 마켓 정규 판매</span>
                    <Badge className="bg-blue-500/20 text-blue-400 text-[10px]">상시 판매</Badge>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    상시 재고를 보유하고 주문 즉시 당일/익일 출고되는 일반 B2C 오픈마켓 판매 방식입니다.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setSaleType('B2C_GROUP')}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                  saleType === 'B2C_GROUP'
                    ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <input
                  type="radio"
                  name="saleType"
                  checked={saleType === 'B2C_GROUP'}
                  onChange={() => setSaleType('B2C_GROUP')}
                  className="mt-1 text-amber-600 focus:ring-0"
                />
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>목표 달성형 공동구매(공구)</span>
                    <Badge className="bg-amber-500 text-black font-bold text-[10px]">공구 파격할인</Badge>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    일정 인원/수량이 모이면 파격적인 할인 가격으로 일괄 생산 및 배송되는 공구 방식입니다.
                  </p>
                </div>
              </label>
            </div>

            {/* Conditional Group Buy Configuration */}
            {saleType === 'B2C_GROUP' && (
              <div className="mt-5 p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1">
                    최소 공구 달성 목표 인원
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={groupTargetCount}
                      onChange={(e) => setGroupTargetCount(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                    <span className="text-xs text-neutral-400">명</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1">공구 특별 할인율</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={groupDiscountRate}
                      onChange={(e) => setGroupDiscountRate(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                    <span className="text-xs text-neutral-400">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1">공구 진행 기간</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={groupDays}
                      onChange={(e) => setGroupDays(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                    <span className="text-xs text-neutral-400">일간 진행</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Section 2: Basic Product Details */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" />
              <span>상품 기본 정보</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-2">
                상품명 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="브랜드명과 규격, 핵심 특장점을 포함하여 입력해주세요 (예: [제주산지직송] 1+등급 제주 흑돼지 오겹살 600g)"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-2">
                카테고리 분류 <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      category === cat
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price & Stock Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  정상 소비자가격 (정가)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={regularPrice}
                    onChange={(e) => setRegularPrice(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                    원
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  실제 판매가 (할인가) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs font-bold text-emerald-400 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                    원
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  판매 가능 재고 수량 <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                    개
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Creator Affiliate Commission */}
          <section className="bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/30 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">크리에이터 라이브 판매 파트너십 허용</h3>
                    <Badge className="bg-purple-600 text-white text-[10px] font-bold">매출 증대 핵심</Badge>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    모꼬의 검증된 인플루언서 및 전문 쇼호스트들이 본인 라이브 방송에 이 상품을 등록하고
                    열정적으로 판매할 수 있도록 허용합니다. 판매 발생 시 설정한 커미션(수수료)이 크리에이터에게 자동 정산됩니다.
                  </p>

                  {allowCreatorSales && (
                    <div className="mt-4 flex items-center gap-3">
                      <span className="text-xs font-bold text-purple-300">크리에이터 판매 보상 요율:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={creatorCommissionRate}
                          onChange={(e) => setCreatorCommissionRate(e.target.value)}
                          className="w-20 bg-neutral-950 border border-purple-500/50 rounded-lg px-2.5 py-1 text-xs text-center font-bold text-white"
                          min={5}
                          max={50}
                        />
                        <span className="text-xs text-neutral-300">% (권장 10~20%)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={allowCreatorSales}
                  onChange={(e) => setAllowCreatorSales(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </section>

          {/* Section 4: Images */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-400" />
              <span>상품 이미지 (대표 및 추가 컷)</span>
              <span className="text-xs text-neutral-400 font-normal">({images.length}/10)</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border border-neutral-700 bg-neutral-950 group"
                >
                  <img src={img} alt={`상품 컷 ${idx + 1}`} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      대표 썸네일
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-2 right-2 p-1 bg-black/70 hover:bg-red-600 text-white rounded-full transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="고화질 이미지 URL을 입력하여 추가하세요 (예: https://...)"
                className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              />
              <Button
                type="button"
                onClick={handleAddImageUrl}
                variant="outline"
                className="border-neutral-700 text-xs px-4"
              >
                이미지 추가
              </Button>
            </div>
          </section>

          {/* Section 5: Detailed Page Description */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>상세페이지 본문 작성 (상세설명)</span> <span className="text-red-400">*</span>
            </h2>
            <p className="text-xs text-neutral-400">
              소비자에게 상품의 특장점, 원재료, 규격 및 섭취/사용 주의사항을 자세히 안내해 주세요.
            </p>
            <textarea
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-4 text-xs leading-relaxed text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </section>

          {/* Section 6: ★ 공정위 전자상거래 상품정보제공고시 (35대 표준 규격 의무기재) */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>공정거래위원회 상품정보제공고시 (전자상거래법 필수)</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  전자상거래 등에서의 상품 등의 정보제공에 관한 고시에 따른 법적 의무 기재 항목입니다.
                </p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                공정위 표준 양식
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  1. 품명 및 모델명
                </label>
                <input
                  type="text"
                  value={notice.itemModelName || ''}
                  onChange={(e) => setNotice({ ...notice, itemModelName: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  2. 법에 의한 인증·허가 사항
                </label>
                <input
                  type="text"
                  value={notice.certification || ''}
                  onChange={(e) => setNotice({ ...notice, certification: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  3. 제조국 또는 원산지
                </label>
                <input
                  type="text"
                  value={notice.origin || ''}
                  onChange={(e) => setNotice({ ...notice, origin: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  4. 제조자 / 수입원
                </label>
                <input
                  type="text"
                  value={notice.manufacturer || ''}
                  onChange={(e) => setNotice({ ...notice, manufacturer: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  5. 유통기한 또는 사용기한
                </label>
                <input
                  type="text"
                  value={notice.expirationDate || ''}
                  onChange={(e) => setNotice({ ...notice, expirationDate: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  6. 소비자상담 관련 전화번호
                </label>
                <input
                  type="text"
                  value={notice.asContact || ''}
                  onChange={(e) => setNotice({ ...notice, asContact: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          </section>

          {/* Section 7: Shipping & Exchange/Return Policy */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-400" />
              <span>배송 및 교환/반품 규정</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">지정 택배사</label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="CJ대한통운">CJ대한통운</option>
                  <option value="우체국택배">우체국택배</option>
                  <option value="한진택배">한진택배</option>
                  <option value="롯데택배">롯데택배</option>
                  <option value="로젠택배">로젠택배</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">배송비 유형</label>
                <select
                  value={shippingFeeType}
                  onChange={(e) => setShippingFeeType(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="CONDITIONAL">조건부 무료배송</option>
                  <option value="PAID">유료배송</option>
                  <option value="FREE">전면 무료배송</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">기본 배송비</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={baseShippingFee}
                    onChange={(e) => setBaseShippingFee(e.target.value)}
                    disabled={shippingFeeType === 'FREE'}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                  <span className="text-xs text-neutral-400">원</span>
                </div>
              </div>
            </div>

            {shippingFeeType === 'CONDITIONAL' && (
              <div className="flex items-center gap-2 pl-1">
                <span className="text-xs text-neutral-400">무료 배송 최소 구매 금액:</span>
                <input
                  type="number"
                  value={freeShippingThreshold}
                  onChange={(e) => setFreeShippingThreshold(e.target.value)}
                  className="w-28 bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white"
                />
                <span className="text-xs text-neutral-400">원 이상 결제 시 무료</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  반품 배송비 (편도)
                </label>
                <input
                  type="number"
                  value={returnFee}
                  onChange={(e) => setReturnFee(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  교환 배송비 (왕복)
                </label>
                <input
                  type="number"
                  value={exchangeFee}
                  onChange={(e) => setExchangeFee(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          </section>

          {/* Section 8: Seller Business Information (전자상거래법 제10조 필수) */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span>판매자 사업자 정보 (전자상거래법 제10조 제1항)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">상호명</label>
                <input
                  type="text"
                  value={businessInfo.businessName}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, businessName: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">대표자명</label>
                <input
                  type="text"
                  value={businessInfo.representative}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, representative: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">사업자등록번호</label>
                <input
                  type="text"
                  value={businessInfo.businessNumber}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, businessNumber: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">통신판매업신고번호</label>
                <input
                  type="text"
                  value={businessInfo.onlineOrderNumber}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, onlineOrderNumber: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-neutral-400 mb-1">사업장 주소지</label>
                <input
                  type="text"
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </section>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-neutral-800">
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
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 shadow-lg shadow-indigo-600/30"
            >
              정식 마켓 상품 등록 완료
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}

