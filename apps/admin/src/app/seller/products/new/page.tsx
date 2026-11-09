/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
  Plus,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Star,
  Trash2,
  Smartphone,
  Layers,
  Loader2,
  Edit2,
} from 'lucide-react'
import { useWebAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { uploadMultipleImageFiles } from '@/lib/uploadHelper'

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

export interface ProductOption {
  id: string
  name: string
  additionalPrice: number
  stock: number
}

function SellerProductRegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const isEditMode = Boolean(editId)
  const { user } = useWebAuth()
  const { toast } = useToast()

  // Form States
  const [saleType, setSaleType] = useState<'B2C_NORMAL' | 'B2C_GROUP'>('B2C_NORMAL')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('식품/신선')
  const [regularPrice, setRegularPrice] = useState('45000')
  const [price, setPrice] = useState('32900')
  const [stock, setStock] = useState('150')

  // Option Matrix States
  const [hasOptions, setHasOptions] = useState(false)
  const [options, setOptions] = useState<ProductOption[]>([
    { id: 'opt-1', name: '기본단량 500g', additionalPrice: 0, stock: 100 },
    { id: 'opt-2', name: '대용량 1kg (+12,000원)', additionalPrice: 12000, stock: 50 },
  ])

  const handleAddOption = () => {
    setOptions((prev) => [
      ...prev,
      {
        id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: '',
        additionalPrice: 0,
        stock: 50,
      },
    ])
  }

  const handleRemoveOption = (id: string) => {
    if (options.length <= 1) {
      toast({
        title: '옵션 삭제 불가',
        description: '최소 1개 이상의 옵션 행이 유지되어야 합니다.',
        variant: 'destructive',
      })
      return
    }
    setOptions((prev) => prev.filter((o) => o.id !== id))
  }

  const handleOptionChange = (id: string, field: keyof ProductOption, value: any) => {
    setOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    )
  }

  // Group Buy Settings
  const [groupTargetCount, setGroupTargetCount] = useState('50')
  const [groupDiscountRate, setGroupDiscountRate] = useState('25')
  const [groupDays, setGroupDays] = useState('3')

  // Creator Commission
  const [allowCreatorSales, setAllowCreatorSales] = useState(true)
  const [creatorCommissionRate, setCreatorCommissionRate] = useState('15')

  // Images (Thumbnail & Gallery)
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000',
  ])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [isUploadingThumbnails, setIsUploadingThumbnails] = useState(false)
  const [thumbnailUploadStatus, setThumbnailUploadStatus] = useState('')
  const [isDraggingThumbnails, setIsDraggingThumbnails] = useState(false)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  // Detail Page & Design Cut Images
  const [detailImages, setDetailImages] = useState<string[]>([])
  const [isUploadingDetailImages, setIsUploadingDetailImages] = useState(false)
  const [detailUploadStatus, setDetailUploadStatus] = useState('')
  const [isDraggingDetail, setIsDraggingDetail] = useState(false)
  const detailInputRef = useRef<HTMLInputElement>(null)
  const [detailViewTab, setDetailViewTab] = useState<'EDIT' | 'PREVIEW'>('EDIT')

  // Detailed Description
  const [description, setDescription] = useState(`■ 상품 특장점
1. 100% 산지직송 프리미엄 원물 엄선 (신선도 최상)
2. HACCP 인증 시설 위생 가공 및 안심 포장
3. 모꼬 고객만을 위한 단독 기획 특가 구성

■ 보관 및 섭취/사용 방법
- 수령 즉시 내용물을 확인하시고 냉장/냉동 보관해 주세요.`)

  // 템플릿 모음
  const DETAIL_TEMPLATES: Record<string, string> = {
    food: `■ 상품 특장점
1. 100% 산지직송 프리미엄 원물 엄선 (신선도 최상)
2. HACCP 인증 시설 위생 가공 및 안심 포장
3. 모꼬 고객만을 위한 단독 기획 특가 구성

■ 보관 및 섭취/사용 방법
- 수령 즉시 내용물을 확인하시고 냉장/냉동 보관해 주세요.
- 조리 전 충분히 해동하시면 본연의 육즙과 풍미를 즐기실 수 있습니다.`,
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

  // 썸네일 파일 업로드 핸들러
  const handleThumbnailFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (fileArray.length === 0) {
      toast({
        title: '이미지 파일 선택 필요',
        description: 'JPG, PNG, WEBP, GIF 등 이미지 형식의 파일만 업로드할 수 있습니다.',
        variant: 'destructive',
      })
      return
    }

    if (images.length + fileArray.length > 10) {
      toast({
        title: '최대 이미지 개수 초과',
        description: `대표 및 추가 이미지는 최대 10장까지만 등록 가능합니다. (현재 ${images.length}장 등록됨)`,
        variant: 'destructive',
      })
      return
    }

    try {
      setIsUploadingThumbnails(true)
      setThumbnailUploadStatus(`0/${fileArray.length} 업로드 중...`)
      const uploadedUrls = await uploadMultipleImageFiles(fileArray, (done, total) => {
        setThumbnailUploadStatus(`${done}/${total} 업로드 중...`)
      })
      setImages((prev) => [...prev, ...uploadedUrls].slice(0, 10))
      toast({
        title: '상품 이미지 등록 완료',
        description: `${uploadedUrls.length}장의 사진이 성공적으로 등록되었습니다.`,
      })
    } catch {
      toast({
        title: '업로드 오류',
        description: '이미지 업로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingThumbnails(false)
      setThumbnailUploadStatus('')
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = ''
      }
    }
  }

  // 대표 썸네일로 설정
  const handleSetPrimaryThumbnail = (idx: number) => {
    if (idx === 0) return
    setImages((prev) => {
      const selected = prev[idx]
      const filtered = prev.filter((_, i) => i !== idx)
      return [selected, ...filtered]
    })
    toast({
      title: '대표 썸네일 변경',
      description: '선택하신 이미지가 상품의 대표 썸네일로 지정되었습니다.',
    })
  }

  // 썸네일 순서 변경
  const handleMoveThumbnail = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return
    setImages((prev) => {
      const updated = [...prev]
      const [item] = updated.splice(from, 1)
      updated.splice(to, 0, item)
      return updated
    })
  }

  // 상세페이지 디자인 이미지 업로드 핸들러
  const handleDetailFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (fileArray.length === 0) {
      toast({
        title: '이미지 파일 선택 필요',
        description: 'JPG, PNG, WEBP 등 상세페이지 이미지 파일만 업로드할 수 있습니다.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsUploadingDetailImages(true)
      setDetailUploadStatus(`0/${fileArray.length} 업로드 중...`)
      const uploadedUrls = await uploadMultipleImageFiles(fileArray, (done, total) => {
        setDetailUploadStatus(`${done}/${total} 업로드 중...`)
      })
      setDetailImages((prev) => [...prev, ...uploadedUrls])
      toast({
        title: '상세페이지 이미지 등록 완료',
        description: `${uploadedUrls.length}장의 상세페이지 이미지가 추가되었습니다.`,
      })
    } catch {
      toast({
        title: '업로드 오류',
        description: '상세 이미지 업로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingDetailImages(false)
      setDetailUploadStatus('')
      if (detailInputRef.current) {
        detailInputRef.current.value = ''
      }
    }
  }

  // 상세페이지 이미지 순서 변경
  const handleMoveDetailImage = (from: number, to: number) => {
    if (to < 0 || to >= detailImages.length) return
    setDetailImages((prev) => {
      const updated = [...prev]
      const [item] = updated.splice(from, 1)
      updated.splice(to, 0, item)
      return updated
    })
  }

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

  // Load Product Details if in Edit Mode
  useEffect(() => {
    if (!editId) return

    try {
      // 1. Check custom products
      const customProducts = JSON.parse(localStorage.getItem('mocco_custom_products') || '[]')
      let target = customProducts.find((p: any) => p.id === editId)

      // 2. Fallback to normal products mock
      if (!target) {
        const normalProducts = JSON.parse(localStorage.getItem('mocco_normal_products') || '[]')
        target = normalProducts.find((p: any) => p.id === editId)
      }

      // 3. Fallback to default mock list
      if (!target) {
        if (editId === 'np-001') {
          target = {
            id: 'np-001',
            name: '[입점사상시] 제주 산지직송 프리미엄 1등급 흑돼지 오겹살 1kg',
            description: '제주 청정 농가에서 당일 도축 후 신선 포장 발송하는 1등급 명품 흑돼지 오겹살입니다.',
            price: 32900,
            originalPrice: 38000,
            stock: 150,
            images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=600'],
            category: '식품/신선',
            shippingFee: 3000,
            hasOptions: true,
            options: [
              { id: 'opt-1', name: '오겹살 500g', additionalPrice: 0, stock: 90 },
              { id: 'opt-2', name: '오겹살 1kg (+14,000원)', additionalPrice: 14000, stock: 60 },
            ],
          }
        } else if (editId === 'np-002') {
          target = {
            id: 'np-002',
            name: '[입점사상시] 제주 유기농 감귤 착즙 원액주스 1000ml (3병 세트)',
            description: '물 한 방울 섞지 않은 무가당 100% 제주 감귤 순수 착즙 프리미엄 주스입니다.',
            price: 24900,
            originalPrice: 29000,
            stock: 80,
            images: ['https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600'],
            category: '식품/신선',
            shippingFee: 0,
          }
        }
      }

      if (target) {
        setName(target.name || '')
        if (target.category) setCategory(target.category)
        if (target.type === 'B2C_GROUP') setSaleType('B2C_GROUP')
        else setSaleType('B2C_NORMAL')

        setPrice(String(target.price || target.salePriceKrw || ''))
        setRegularPrice(String(target.originalPrice || target.priceKrw || target.price || ''))
        setStock(String(target.stock ?? '100'))

        if (target.hasOptions && target.options && target.options.length > 0) {
          setHasOptions(true)
          setOptions(target.options)
        } else {
          setHasOptions(false)
        }

        if (target.images && target.images.length > 0) {
          setImages(target.images)
        }
        if (target.detailImages && target.detailImages.length > 0) {
          setDetailImages(target.detailImages)
        }
        if (target.description) {
          setDescription(target.description)
        }
        if (target.shippingFee !== undefined) {
          if (target.shippingFee === 0) {
            setShippingFeeType('FREE')
            setBaseShippingFee('0')
          } else {
            setShippingFeeType('PAID')
            setBaseShippingFee(String(target.shippingFee))
          }
        }
        if (target.creatorCommissionRate !== undefined) {
          setCreatorCommissionRate(String(target.creatorCommissionRate))
        }
        if (target.allowCreatorSales !== undefined) {
          setAllowCreatorSales(Boolean(target.allowCreatorSales))
        }
        if (target.noticeInfo) {
          setNotice((prev) => ({ ...prev, ...target.noticeInfo }))
        }
        if (target.shippingInfo?.courierName) {
          setCourierName(target.shippingInfo.courierName)
        }
        if (target.shippingInfo?.deliveryDays) {
          setDispatchDays(target.shippingInfo.deliveryDays)
        }
        if (target.shippingInfo?.returnFee) {
          setReturnFee(String(target.shippingInfo.returnFee))
        }
        if (target.shippingInfo?.exchangeFee) {
          setExchangeFee(String(target.shippingInfo.exchangeFee))
        }

        toast({
          title: '기존 상품 정보 로드 완료',
          description: `[${target.name}] 상품의 정보가 수정 폼에 채워졌습니다.`,
        })
      }
    } catch (e) {
      console.warn('Failed to load product for edit', e)
    }
  }, [editId, toast])

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

    if (hasOptions) {
      const emptyOption = options.find((o) => !o.name.trim())
      if (emptyOption) {
        toast({
          title: '옵션명을 모두 입력해주세요',
          description: '옵션 항목 중 이름이 비어있는 항목이 있습니다.',
          variant: 'destructive',
        })
        return
      }
    }

    const targetId = isEditMode && editId ? editId : `prod-${Date.now()}`
    const finalPrice = parseInt(price.replace(/,/g, ''), 10)
    const original = parseInt(regularPrice.replace(/,/g, ''), 10) || finalPrice
    const calculatedStock = hasOptions
      ? options.reduce((sum, o) => sum + (Number(o.stock) || 0), 0)
      : parseInt(stock, 10) || 50

    const productPayload = {
      id: targetId,
      name: name.trim(),
      category,
      type: saleType,
      price: finalPrice,
      originalPrice: original,
      stock: calculatedStock,
      hasOptions,
      options: hasOptions
        ? options.map((opt) => ({
            id: opt.id,
            name: opt.name.trim(),
            additionalPrice: Number(opt.additionalPrice) || 0,
            stock: Number(opt.stock) || 0,
          }))
        : [],
      shippingFee: shippingFeeType === 'FREE' ? 0 : parseInt(baseShippingFee, 10) || 3000,
      isFreeShipping: shippingFeeType === 'FREE',
      freeShippingThreshold:
        shippingFeeType === 'CONDITIONAL' ? parseInt(freeShippingThreshold, 10) || 50000 : 0,
      images,
      detailImages,
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
      updatedAt: new Date().toISOString(),
    }

    // Save to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('mocco_custom_products') || '[]')
      if (isEditMode) {
        const idx = existing.findIndex((p: any) => p.id === targetId)
        if (idx >= 0) {
          existing[idx] = { ...existing[idx], ...productPayload }
        } else {
          existing.unshift({
            ...productPayload,
            createdAt: new Date().toISOString(),
            orderCount: 0,
            rating: 5.0,
            reviewCount: 0,
          })
        }
        localStorage.setItem('mocco_custom_products', JSON.stringify(existing))
      } else {
        const fullNewProduct = {
          ...productPayload,
          createdAt: new Date().toISOString(),
          orderCount: 0,
          rating: 5.0,
          reviewCount: 0,
        }
        localStorage.setItem('mocco_custom_products', JSON.stringify([fullNewProduct, ...existing]))
      }
    } catch (err) {
      console.warn('Failed to save product in storage', err)
    }

    if (isEditMode) {
      toast({
        title: '✏️ 상품 정보 수정 완료',
        description: '변경된 상품 정보, 대표 사진 및 상세페이지가 즉시 반영되었습니다.',
      })
      setTimeout(() => {
        router.push('/seller/products')
      }, 500)
    } else {
      toast({
        title: '🎉 상품이 정식 승인 등록되었습니다!',
        description: '대한민국 전자상거래 규격에 맞게 상세페이지가 즉시 오픈됩니다.',
      })
      setTimeout(() => {
        router.push(`/market/${targetId}`)
      }, 600)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      {/* 1. 상단 GNB 헤더 (화이트 라이트 모드) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/seller/products')}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition flex items-center gap-1"
              aria-label="입점사 상품 관리로 뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  {isEditMode ? (
                    <>
                      <Edit2 className="w-5 h-5 text-indigo-600" />
                      <span>입점사 셀러 센터 | 상품 정보 수정</span>
                    </>
                  ) : (
                    <span>입점사 셀러 센터 | 신규 상품 등록</span>
                  )}
                </h1>
                <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                  {isEditMode ? '수정 모드' : 'B2C 마켓 & 공구 표준'}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {isEditMode
                  ? '기존 등록된 상품의 대표 사진, 상세페이지 컷, 판매가, 재고 및 배송 정보를 수정합니다.'
                  : '대한민국 공정거래위원회 35대 표준 상품고시 및 전자상거래 규정을 완벽하게 지원합니다'}
              </p>
            </div>
          </div>
          <Link
            href="/seller/products"
            className="text-xs text-slate-700 hover:text-slate-900 font-bold bg-slate-100 hover:bg-slate-200 border border-slate-200/80 px-3.5 py-1.5 rounded-xl transition shadow-2xs"
          >
            내 상품 목록 관리
          </Link>
        </div>
      </header>

      {/* 2. 메인 폼 컨테이너 */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Sales Type */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2">
              <Store className="w-5 h-5 text-indigo-600" />
              <span>판매 유형 선택</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                onClick={() => setSaleType('B2C_NORMAL')}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                  saleType === 'B2C_NORMAL'
                    ? 'bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500 shadow-2xs'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
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
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>일반 마켓 정규 판매</span>
                    <Badge className="bg-blue-100 text-blue-700 text-[10px] font-bold">상시 판매</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    상시 재고를 보유하고 주문 즉시 당일/익일 출고되는 일반 B2C 오픈마켓 판매 방식입니다.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setSaleType('B2C_GROUP')}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                  saleType === 'B2C_GROUP'
                    ? 'bg-amber-50/70 border-amber-500 ring-1 ring-amber-500 shadow-2xs'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
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
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>목표 달성형 공동구매(공구)</span>
                    <Badge className="bg-amber-400 text-slate-950 font-bold text-[10px]">공구 파격할인</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    일정 인원/수량이 모이면 파격적인 할인 가격으로 일괄 생산 및 배송되는 공구 방식입니다.
                  </p>
                </div>
              </label>
            </div>

            {/* Conditional Group Buy Configuration */}
            {saleType === 'B2C_GROUP' && (
              <div className="mt-5 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    최소 공구 달성 목표 인원
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={groupTargetCount}
                      onChange={(e) => setGroupTargetCount(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                    />
                    <span className="text-xs text-amber-800 font-semibold">명</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">공구 특별 할인율</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={groupDiscountRate}
                      onChange={(e) => setGroupDiscountRate(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                    />
                    <span className="text-xs text-amber-800 font-semibold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">공구 진행 기간</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={groupDays}
                      onChange={(e) => setGroupDays(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                    />
                    <span className="text-xs text-amber-800 font-semibold">일간 진행</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Section 2: Basic Product Details */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-6">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              <span>상품 기본 정보</span>
            </h2>

            <div>
              <label className="block text-xs sm:text-sm font-extrabold text-slate-900 mb-2">
                상품명 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="브랜드명과 규격, 핵심 특장점을 포함하여 입력해주세요 (예: [제주산지직송] 1+등급 제주 흑돼지 오겹살 600g)"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs sm:text-sm font-extrabold text-slate-900 mb-2">
                카테고리 분류 <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      category === cat
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/70'
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  정상 소비자가격 (정가)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={regularPrice}
                    onChange={(e) => setRegularPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold pr-8 focus:bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    원
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  실제 판매가 (할인가) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-emerald-600 pr-8 focus:bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    원
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  판매 가능 재고 수량 <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={hasOptions ? options.reduce((sum, o) => sum + (Number(o.stock) || 0), 0) : stock}
                    onChange={(e) => setStock(e.target.value)}
                    disabled={hasOptions}
                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold pr-8 focus:bg-white ${
                      hasOptions ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    개
                  </span>
                </div>
                {hasOptions && (
                  <p className="text-[10px] text-indigo-600 mt-1 font-semibold">
                    * 옵션 매트릭스 사용 시 개별 옵션 재고의 합으로 자동 산출됩니다.
                  </p>
                )}
              </div>
            </div>

            {/* Option Matrix Section */}
            <div className="pt-5 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span>규격 / 사이즈 / 단량별 옵션 설정</span>
                    <Badge variant={hasOptions ? 'default' : 'outline'} className="text-[10px]">
                      {hasOptions ? '옵션 매트릭스 사용' : '단일 상품 (옵션 미사용)'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    사이즈, 용량, 색상별 추가 가격(+/-)과 개별 재고를 분리 관리할 수 있습니다.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasOptions}
                    onChange={(e) => setHasOptions(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {hasOptions && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      등록된 옵션 목록 ({options.length}개)
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddOption}
                      className="text-xs h-8 gap-1 bg-white hover:bg-slate-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      옵션 행 추가
                    </Button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">옵션명 (규격/사이즈/단량)</th>
                          <th className="py-2.5 px-3 w-40">추가금 (+/- 원)</th>
                          <th className="py-2.5 px-3 w-32">개별 재고(개)</th>
                          <th className="py-2.5 px-2 text-center w-12">삭제</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {options.map((opt, idx) => (
                          <tr key={opt.id} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={opt.name}
                                onChange={(e) => handleOptionChange(opt.id, 'name', e.target.value)}
                                placeholder={`예: 단량 1kg (+12,000원), L 사이즈 (옵션 ${idx + 1})`}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <div className="relative">
                                <input
                                  type="number"
                                  value={opt.additionalPrice}
                                  onChange={(e) =>
                                    handleOptionChange(opt.id, 'additionalPrice', Number(e.target.value) || 0)
                                  }
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-900 pr-6 focus:bg-white focus:border-indigo-500"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                                  원
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="relative">
                                <input
                                  type="number"
                                  value={opt.stock}
                                  onChange={(e) =>
                                    handleOptionChange(opt.id, 'stock', Number(e.target.value) || 0)
                                  }
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-900 pr-6 focus:bg-white focus:border-indigo-500"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                                  개
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(opt.id)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
                                title="옵션 삭제"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                    <span>* 옵션 추가금은 기본 판매가에 합산되어 구매자 결제창에 표기됩니다.</span>
                    <span className="font-semibold text-indigo-600">
                      총 재고 합계: {options.reduce((sum, o) => sum + (Number(o.stock) || 0), 0)}개
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Creator Affiliate Commission */}
          <section className="bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border border-purple-200 rounded-3xl p-6 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-purple-600/10 text-purple-700 rounded-2xl border border-purple-200">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      크리에이터 라이브 판매 파트너십 허용
                    </h3>
                    <Badge className="bg-purple-600 text-white text-[10px] font-bold">매출 증대 핵심</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    모꼬의 검증된 인플루언서 및 전문 쇼호스트들이 본인 라이브 방송에 이 상품을 등록하고
                    열정적으로 판매할 수 있도록 허용합니다. 판매 발생 시 설정한 커미션(수수료)이 크리에이터에게 자동 정산됩니다.
                  </p>

                  {allowCreatorSales && (
                    <div className="mt-4 flex items-center gap-3">
                      <span className="text-xs font-bold text-purple-900">크리에이터 판매 보상 요율:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={creatorCommissionRate}
                          onChange={(e) => setCreatorCommissionRate(e.target.value)}
                          className="w-20 bg-white border border-purple-300 rounded-lg px-2.5 py-1 text-xs text-center font-bold text-purple-900"
                          min={5}
                          max={50}
                        />
                        <span className="text-xs text-slate-600 font-semibold">% (권장 10~20%)</span>
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
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </section>

          {/* Section 4: Images (대표 및 추가 컷 파일 직접 업로드) */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600" />
                <span>상품 이미지 (대표 및 추가 컷)</span>
                <span className="text-xs text-slate-500 font-normal">({images.length}/10)</span>
              </h2>
              <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 flex items-center gap-1 w-fit">
                <Upload className="w-3 h-3" /> 내 PC 파일 선택 & 드래그 앤 드롭 지원
              </span>
            </div>

            {/* 숨겨진 파일 선택 Input */}
            <input
              type="file"
              ref={thumbnailInputRef}
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => e.target.files && handleThumbnailFiles(e.target.files)}
            />

            {/* 대형 드래그 & 드롭 영역 (Dropzone) */}
            <div
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
              onClick={() => thumbnailInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDraggingThumbnails
                  ? 'border-indigo-500 bg-indigo-50/80 scale-[1.01]'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-slate-50'
              }`}
            >
              {isUploadingThumbnails ? (
                <div className="flex flex-col items-center gap-2 text-indigo-600">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-bold">{thumbnailUploadStatus || '사진 업로드 중...'}</span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800">
                    <span className="text-indigo-600 hover:underline">내 PC에서 상품 사진 파일 선택</span> 또는 여기로 드래그하세요
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    권장 규격: 1:1 정방형 (800×800px 이상) | JPG, PNG, WEBP, GIF | 최대 10장 (첫 번째 사진이 대표 썸네일)
                  </p>
                </>
              )}
            </div>

            {/* 등록된 썸네일 갤러리 */}
            {images.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>등록된 상품 이미지 순서 (원하는 사진을 클릭하여 대표 썸네일로 변경할 수 있습니다)</span>
                  <span>{images.length}/10장</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative aspect-square rounded-2xl overflow-hidden border bg-slate-100 group shadow-2xs transition-all ${
                        idx === 0 ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200'
                      }`}
                    >
                      <img src={img} alt={`상품 컷 ${idx + 1}`} className="w-full h-full object-cover" />
                      
                      {/* 대표 썸네일 배지 */}
                      {idx === 0 ? (
                        <span className="absolute top-2 left-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-white" /> 대표 썸네일
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSetPrimaryThumbnail(idx)
                          }}
                          className="absolute top-2 left-2 bg-black/70 hover:bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow opacity-0 group-hover:opacity-100 transition"
                        >
                          대표로 지정
                        </button>
                      )}

                      {/* 삭제 버튼 */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setImages(images.filter((_, i) => i !== idx))
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-full transition shadow"
                        title="이미지 삭제"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {/* 순서 이동 버튼 */}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition bg-black/60 rounded-lg p-1 backdrop-blur-xs">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMoveThumbnail(idx, idx - 1)
                          }}
                          className="text-white hover:text-indigo-300 disabled:opacity-30 p-0.5"
                          title="왼쪽으로 이동"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] text-white font-mono">{idx + 1}</span>
                        <button
                          type="button"
                          disabled={idx === images.length - 1}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMoveThumbnail(idx, idx + 1)
                          }}
                          className="text-white hover:text-indigo-300 disabled:opacity-30 p-0.5"
                          title="오른쪽으로 이동"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 보조: 웹 이미지 링크(URL)로 추가 옵션 */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 font-medium transition"
              >
                <span>{showUrlInput ? '▲ 링크 입력창 접기' : '🔗 웹 이미지 URL 주소로 직접 추가하기'}</span>
              </button>

              {showUrlInput && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="고화질 이미지 URL을 입력하여 추가하세요 (예: https://...)"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                  <Button
                    type="button"
                    onClick={handleAddImageUrl}
                    variant="outline"
                    className="border-slate-300 text-slate-700 text-xs px-4 h-9 rounded-xl font-bold"
                  >
                    이미지 추가
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Section 5: 상세페이지 본문 및 이미지 제작 (Detail Page Builder) */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
            {/* 헤더 & 모드 스위처 (작성 모드 vs 실시간 고객 미리보기) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>상세페이지 본문 및 디자인 이미지 제작</span> <span className="text-rose-500">*</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  디자인 통 이미지 업로드와 텍스트 설명을 결합하여 실제 쇼핑몰 고품질 상세페이지를 제작합니다.
                </p>
              </div>

              {/* 탭 전환 버튼 */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setDetailViewTab('EDIT')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    detailViewTab === 'EDIT'
                      ? 'bg-white text-indigo-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ✏️ 상세페이지 편집
                </button>
                <button
                  type="button"
                  onClick={() => setDetailViewTab('PREVIEW')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                    detailViewTab === 'PREVIEW'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  실제 상세페이지 미리보기
                </button>
              </div>
            </div>

            {/* 1) EDIT MODE: 상세페이지 작성 및 이미지 업로드 */}
            {detailViewTab === 'EDIT' && (
              <div className="space-y-6">
                
                {/* 파트 A: 상세페이지 전용 디자인/통 이미지 직접 업로드 */}
                <div className="space-y-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-purple-600" />
                        <span>상세페이지 디자인 통 이미지 / 인증서 파일 업로드</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        캔바, 망고보드, 포토샵 등으로 제작한 세로형 상세페이지 이미지나 원재료/인증서 사진을 직접 업로드하세요.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-purple-700 bg-purple-100/60 px-2.5 py-0.5 rounded-full">
                      {detailImages.length}개 등록됨
                    </span>
                  </div>

                  {/* 숨겨진 상세 이미지 파일 Input */}
                  <input
                    type="file"
                    ref={detailInputRef}
                    multiple
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => e.target.files && handleDetailFiles(e.target.files)}
                  />

                  {/* 상세 이미지 전용 드롭존 */}
                  <div
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
                    onClick={() => detailInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-white ${
                      isDraggingDetail
                        ? 'border-purple-500 bg-purple-50/50 scale-[1.01]'
                        : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50/80'
                    }`}
                  >
                    {isUploadingDetailImages ? (
                      <div className="flex flex-col items-center gap-1.5 text-purple-600 py-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-xs font-bold">{detailUploadStatus || '상세 이미지 업로드 중...'}</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-slate-800">
                          <span className="text-purple-600 hover:underline">내 PC에서 상세페이지 디자인 파일 선택</span> 또는 파일 드래그
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          세로형 통 이미지(최대 1200px 폭 권장), 홍보 배너, 시험성적서 등 복수 선택 가능
                        </p>
                      </>
                    )}
                  </div>

                  {/* 등록된 상세페이지 이미지 목록 및 정렬 */}
                  {detailImages.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-bold text-slate-700">상세페이지 이미지 노출 순서 (위에서 아래로 순차 노출):</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {detailImages.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative rounded-xl overflow-hidden border border-slate-200 bg-white group shadow-2xs"
                          >
                            <div className="aspect-[3/4] overflow-hidden bg-slate-100">
                              <img src={img} alt={`상세컷 ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                            <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-700">{idx + 1}번 상세 컷</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveDetailImage(idx, idx - 1)}
                                  className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                                  title="위로 이동"
                                >
                                  <ChevronUp className="w-3 h-3 text-slate-700" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === detailImages.length - 1}
                                  onClick={() => handleMoveDetailImage(idx, idx + 1)}
                                  className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                                  title="아래로 이동"
                                >
                                  <ChevronDown className="w-3 h-3 text-slate-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDetailImages(detailImages.filter((_, i) => i !== idx))}
                                  className="p-1 hover:bg-rose-100 text-rose-600 rounded ml-1"
                                  title="삭제"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 파트 B: 상세 설명 텍스트 작성 & 원클릭 서식 템플릿 */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs sm:text-sm font-bold text-slate-800">
                      상세 설명 텍스트 안내문 (스펙, 성분, 주의사항)
                    </label>

                    {/* 원클릭 서식 템플릿 버튼 */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-400">서식 템플릿:</span>
                      <button
                        type="button"
                        onClick={() => setDescription(DETAIL_TEMPLATES.food)}
                        className="text-[11px] px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold transition"
                      >
                        신선식품
                      </button>
                      <button
                        type="button"
                        onClick={() => setDescription(DETAIL_TEMPLATES.digital)}
                        className="text-[11px] px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold transition"
                      >
                        디지털/가전
                      </button>
                      <button
                        type="button"
                        onClick={() => setDescription(DETAIL_TEMPLATES.fashion)}
                        className="text-[11px] px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-bold transition"
                      >
                        패션/뷰티
                      </button>
                      <button
                        type="button"
                        onClick={() => setDescription(DETAIL_TEMPLATES.shipping)}
                        className="text-[11px] px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg font-bold transition"
                      >
                        배송/안심안내
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={8}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="소비자에게 상품의 특장점, 원재료, 규격 및 섭취/사용 주의사항을 자세히 안내해 주세요."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm leading-relaxed text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 font-sans"
                  />
                </div>
              </div>
            )}

            {/* 2) PREVIEW MODE: 실제 쇼핑몰 상세페이지 실시간 렌더링 */}
            {detailViewTab === 'PREVIEW' && (
              <div className="bg-slate-100 rounded-2xl p-4 sm:p-8 flex flex-col items-center">
                <div className="text-xs text-slate-500 mb-3 flex items-center gap-1 font-semibold">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  고객이 실제 모바일 및 웹 쇼핑몰에서 보게 될 상세페이지 화면입니다
                </div>

                {/* 스마트폰 비율 미리보기 컨테이너 */}
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden text-slate-900">
                  {/* 상단 대표 이미지 */}
                  <div className="aspect-square bg-slate-100 relative">
                    {images[0] ? (
                      <img src={images[0]} alt="대표 썸네일" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        등록된 대표 이미지가 없습니다
                      </div>
                    )}
                    <span className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-xs">
                      1 / {images.length || 1}
                    </span>
                  </div>

                  {/* 상품 기본 정보 */}
                  <div className="p-4 border-b border-slate-100">
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {category}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 mt-1">
                      {name || '상품명을 입력하세요'}
                    </h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-rose-600 font-black text-lg">
                        {regularPrice && price && parseInt(regularPrice, 10) > parseInt(price, 10)
                          ? `${Math.round(((parseInt(regularPrice, 10) - parseInt(price, 10)) / parseInt(regularPrice, 10)) * 100)}%`
                          : ''}
                      </span>
                      <span className="text-xl font-black text-slate-900">
                        {parseInt(price, 10) ? `${parseInt(price, 10).toLocaleString()}원` : '0원'}
                      </span>
                      {regularPrice && parseInt(regularPrice, 10) > parseInt(price, 10) && (
                        <span className="text-xs text-slate-400 line-through">
                          {parseInt(regularPrice, 10).toLocaleString()}원
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 상세 탭 헤더 시뮬레이션 */}
                  <div className="flex border-b border-slate-200 text-xs font-bold bg-slate-50 text-slate-600">
                    <div className="flex-1 py-3 text-center border-b-2 border-indigo-600 text-indigo-600 bg-white">
                      상세 정보
                    </div>
                    <div className="flex-1 py-3 text-center text-slate-400">상품 정보 고시</div>
                    <div className="flex-1 py-3 text-center text-slate-400">배송/환불 안내</div>
                  </div>

                  {/* 상세 본문 영역 (텍스트 + 디자인 통 이미지 세로 연결) */}
                  <div className="p-4 space-y-4">
                    {/* 텍스트 설명 박스 */}
                    {description && (
                      <div className="p-3.5 bg-slate-50 rounded-xl text-xs leading-relaxed text-slate-700 whitespace-pre-line border border-slate-100">
                        {description}
                      </div>
                    )}

                    {/* 업로드된 상세 디자인 이미지들 (세로로 매끄럽게 연결) */}
                    {detailImages.length > 0 ? (
                      <div className="space-y-2 pt-2">
                        {detailImages.map((dImg, idx) => (
                          <div key={idx} className="rounded-xl overflow-hidden shadow-2xs border border-slate-100">
                            <img
                              src={dImg}
                              alt={`상세페이지 디자인 컷 ${idx + 1}`}
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                        상세페이지 디자인 이미지가 등록되지 않았습니다.<br />
                        [상세페이지 편집] 탭에서 디자인 통 이미지를 추가해 보세요.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Section 6: ★ 공정위 전자상거래 상품정보제공고시 */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>공정거래위원회 상품정보제공고시 (전자상거래법 필수)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  전자상거래 등에서의 상품 등의 정보제공에 관한 고시에 따른 법적 의무 기재 항목입니다.
                </p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                공정위 표준 양식
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. 품명 및 모델명
                </label>
                <input
                  type="text"
                  value={notice.itemModelName || ''}
                  onChange={(e) => setNotice({ ...notice, itemModelName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. 법에 의한 인증·허가 사항
                </label>
                <input
                  type="text"
                  value={notice.certification || ''}
                  onChange={(e) => setNotice({ ...notice, certification: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. 제조국 또는 원산지
                </label>
                <input
                  type="text"
                  value={notice.origin || ''}
                  onChange={(e) => setNotice({ ...notice, origin: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4. 제조자 / 수입원
                </label>
                <input
                  type="text"
                  value={notice.manufacturer || ''}
                  onChange={(e) => setNotice({ ...notice, manufacturer: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  5. 유통기한 또는 사용기한
                </label>
                <input
                  type="text"
                  value={notice.expirationDate || ''}
                  onChange={(e) => setNotice({ ...notice, expirationDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  6. 소비자상담 관련 전화번호
                </label>
                <input
                  type="text"
                  value={notice.asContact || ''}
                  onChange={(e) => setNotice({ ...notice, asContact: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white"
                />
              </div>
            </div>
          </section>

          {/* Section 7: Shipping & Exchange/Return Policy */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              <span>배송 및 교환/반품 규정</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">지정 택배사</label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                >
                  <option value="CJ대한통운">CJ대한통운</option>
                  <option value="우체국택배">우체국택배</option>
                  <option value="한진택배">한진택배</option>
                  <option value="롯데택배">롯데택배</option>
                  <option value="로젠택배">로젠택배</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">배송비 유형</label>
                <select
                  value={shippingFeeType}
                  onChange={(e) => setShippingFeeType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                >
                  <option value="CONDITIONAL">조건부 무료배송</option>
                  <option value="PAID">유료배송</option>
                  <option value="FREE">전면 무료배송</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">기본 배송비</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={baseShippingFee}
                    onChange={(e) => setBaseShippingFee(e.target.value)}
                    disabled={shippingFeeType === 'FREE'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                  />
                  <span className="text-xs text-slate-500">원</span>
                </div>
              </div>
            </div>

            {shippingFeeType === 'CONDITIONAL' && (
              <div className="flex items-center gap-2 pl-1">
                <span className="text-xs text-slate-600">무료 배송 최소 구매 금액:</span>
                <input
                  type="number"
                  value={freeShippingThreshold}
                  onChange={(e) => setFreeShippingThreshold(e.target.value)}
                  className="w-28 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-900 font-bold"
                />
                <span className="text-xs text-slate-500">원 이상 결제 시 무료</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  반품 배송비 (편도)
                </label>
                <input
                  type="number"
                  value={returnFee}
                  onChange={(e) => setReturnFee(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  교환 배송비 (왕복)
                </label>
                <input
                  type="number"
                  value={exchangeFee}
                  onChange={(e) => setExchangeFee(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                />
              </div>
            </div>
          </section>

          {/* Section 8: Seller Business Information */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>판매자 사업자 정보 (전자상거래법 제10조 제1항)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1 font-semibold">상호명</label>
                <input
                  type="text"
                  value={businessInfo.businessName}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, businessName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1 font-semibold">대표자명</label>
                <input
                  type="text"
                  value={businessInfo.representative}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, representative: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1 font-semibold">사업자등록번호</label>
                <input
                  type="text"
                  value={businessInfo.businessNumber}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, businessNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1 font-semibold">통신판매업신고번호</label>
                <input
                  type="text"
                  value={businessInfo.onlineOrderNumber}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, onlineOrderNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-500 mb-1 font-semibold">사업장 주소지</label>
                <input
                  type="text"
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium"
                />
              </div>
            </div>
          </section>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/seller/products')}
              className="border-slate-300 text-slate-700 hover:bg-slate-100 px-6 h-11 rounded-2xl font-bold"
            >
              취소
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-8 h-11 rounded-2xl shadow-md shadow-indigo-600/25"
            >
              {isEditMode ? '상품 수정 내용 저장하기' : '정식 마켓 상품 등록 완료'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default function SellerProductRegisterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>상품 등록/수정 페이지를 불러오는 중입니다...</span>
          </div>
        </div>
      }
    >
      <SellerProductRegisterForm />
    </React.Suspense>
  )
}
