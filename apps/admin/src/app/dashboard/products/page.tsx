/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Crown,
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  TrendingUp,
  Percent,
  Coins,
  Radio,
  Truck,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  X,
  Flame,
  Users2,
  Boxes,
  Upload,
  Camera,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/lib/api'
import { uploadMultipleImageFiles } from '@/lib/uploadHelper'

export interface HqDirectProduct {
  id: string
  name: string
  subTitle?: string
  description?: string
  category: 'FOOD' | 'BEAUTY' | 'DIGITAL' | 'LIVING' | 'FASHION'
  planType: 'PB' | 'SPECIAL_DEAL' | 'GROUP_BUY'
  costPriceKrw: number
  priceKrw: number
  salePriceKrw: number
  stock: number
  shippingFee: number
  images: string[]
  detailImages?: string[]
  status: 'ACTIVE' | 'OUT_OF_STOCK' | 'HIDDEN'
  allowAffiliate: boolean
  affiliateCommissionRate: number
  salesCount: number
  viewCount: number
  isHqDirect: true
  createdAt: string
  groupTargetCount?: number
  groupCurrentCount?: number
}

const INITIAL_HQ_PRODUCTS: HqDirectProduct[] = [
  {
    id: 'hq-p-001',
    name: '[본사 PB] 모꼬 프리미엄 나주 특등급 햇배 5kg 명품 선물세트',
    subTitle: '산지 직접 계약 검수 100% 당도 보증 프리미엄 햇배',
    description: '본사 바이어가 산지에서 직접 엄선한 13브릭스 이상 특등급 나주배 선물세트입니다.',
    category: 'FOOD',
    planType: 'PB',
    costPriceKrw: 17500,
    priceKrw: 45000,
    salePriceKrw: 32900,
    stock: 240,
    shippingFee: 0,
    images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=800'],
    status: 'ACTIVE',
    allowAffiliate: true,
    affiliateCommissionRate: 10.0,
    salesCount: 840,
    viewCount: 6520,
    isHqDirect: true,
    createdAt: '2026-10-22',
  },
  {
    id: 'hq-p-002',
    name: '[본사 PB] 모꼬 100% 제주 유기농 착즙 NFC 감귤 원액주스 1000ml (3병 세트)',
    subTitle: '무가당 무색소 산지 직배송 프리미엄 순수 감귤즙',
    description: '물 한 방울 섞지 않은 무가당 100% 제주 감귤 순수 착즙 프리미엄 주스입니다.',
    category: 'FOOD',
    planType: 'PB',
    costPriceKrw: 12000,
    priceKrw: 35000,
    salePriceKrw: 24900,
    stock: 180,
    shippingFee: 0,
    images: ['https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800'],
    status: 'ACTIVE',
    allowAffiliate: true,
    affiliateCommissionRate: 12.0,
    salesCount: 1420,
    viewCount: 9140,
    isHqDirect: true,
    createdAt: '2026-10-20',
  },
  {
    id: 'hq-p-003',
    name: '[직영 특가] 산지직송 제주 프리미엄 1등급 흑돼지 오겹살 1kg (신선냉장)',
    subTitle: '본사 단독 기획 당일 도축 진공보냉 신선 배송',
    description: '본사 단독 콜라보로 산지 직송 당일 도축 후 신선 보랭 발송하는 최고급 흑돼지 오겹살입니다.',
    category: 'FOOD',
    planType: 'SPECIAL_DEAL',
    costPriceKrw: 22000,
    priceKrw: 48000,
    salePriceKrw: 35900,
    stock: 95,
    shippingFee: 0,
    images: ['https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800'],
    status: 'ACTIVE',
    allowAffiliate: true,
    affiliateCommissionRate: 9.0,
    salesCount: 620,
    viewCount: 4320,
    isHqDirect: true,
    createdAt: '2026-10-18',
  },
  {
    id: 'hq-p-004',
    name: '[공식 공구] 모꼬 1차 무선 액티브 노이즈캔슬링 프로 헤드폰 (스마트 센서 탑재)',
    subTitle: '본사 공식 기획 100명 목표 특별 공동구매',
    description: '본사 다이렉트 OEM 발주를 통해 유통 마진을 뺀 프리미엄 노이즈 캔슬링 블루투스 헤드폰입니다.',
    category: 'DIGITAL',
    planType: 'GROUP_BUY',
    costPriceKrw: 68000,
    priceKrw: 169000,
    salePriceKrw: 109000,
    stock: 150,
    shippingFee: 0,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
    status: 'ACTIVE',
    allowAffiliate: true,
    affiliateCommissionRate: 10.0,
    salesCount: 84,
    viewCount: 7180,
    groupTargetCount: 100,
    groupCurrentCount: 84,
    isHqDirect: true,
    createdAt: '2026-10-15',
  },
  {
    id: 'hq-p-005',
    name: '[본사 PB] 모꼬 올인데이 고농축 rTG 오메가3 6개월분 (360캡슐 대용량)',
    subTitle: '순도 80% 이상 IFOS 최고등급 본사 헬스케어 PB',
    description: '흡수율 높은 rTG형 오메가3에 비타민D/E를 황금 비율로 배합한 본사 공식 PB 영양제입니다.',
    category: 'LIVING',
    planType: 'PB',
    costPriceKrw: 16500,
    priceKrw: 59000,
    salePriceKrw: 39000,
    stock: 310,
    shippingFee: 0,
    images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800'],
    status: 'ACTIVE',
    allowAffiliate: true,
    affiliateCommissionRate: 15.0,
    salesCount: 980,
    viewCount: 5410,
    isHqDirect: true,
    createdAt: '2026-10-12',
  },
]

const IMAGE_PRESETS = [
  { label: '청과/선물', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800' },
  { label: '음료/주스', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800' },
  { label: '정육/축산', url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800' },
  { label: '디지털/IT', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800' },
  { label: '건강/영양', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800' },
]

export default function HqProductsPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<HqDirectProduct[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [planTypeFilter, setPlanTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Register / Edit Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<HqDirectProduct | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    subTitle: '',
    description: '',
    category: 'FOOD' as HqDirectProduct['category'],
    planType: 'PB' as HqDirectProduct['planType'],
    costPriceKrw: 18000,
    priceKrw: 42000,
    salePriceKrw: 32900,
    stock: 100,
    shippingFee: 0,
    images: [IMAGE_PRESETS[0].url] as string[],
    detailImages: [] as string[],
    allowAffiliate: true,
    affiliateCommissionRate: 10.0,
    groupTargetCount: 100,
  })

  // Image Upload States
  const [isUploadingThumbnails, setIsUploadingThumbnails] = useState(false)
  const [thumbnailUploadStatus, setThumbnailUploadStatus] = useState('')
  const thumbnailInputRef = React.useRef<HTMLInputElement>(null)

  const [isUploadingDetailImages, setIsUploadingDetailImages] = useState(false)
  const [detailUploadStatus, setDetailUploadStatus] = useState('')
  const detailInputRef = React.useRef<HTMLInputElement>(null)

  const handleThumbnailFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (fileArray.length === 0) return
    try {
      setIsUploadingThumbnails(true)
      setThumbnailUploadStatus(`0/${fileArray.length} 업로드 중...`)
      const uploadedUrls = await uploadMultipleImageFiles(fileArray, (done, total) => {
        setThumbnailUploadStatus(`${done}/${total} 업로드 중...`)
      })
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls].slice(0, 10),
      }))
      toast({
        title: '대표 썸네일 이미지 등록 완료',
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
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = ''
    }
  }

  const handleDetailFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (fileArray.length === 0) return
    try {
      setIsUploadingDetailImages(true)
      setDetailUploadStatus(`0/${fileArray.length} 업로드 중...`)
      const uploadedUrls = await uploadMultipleImageFiles(fileArray, (done, total) => {
        setDetailUploadStatus(`${done}/${total} 업로드 중...`)
      })
      setFormData((prev) => ({
        ...prev,
        detailImages: [...prev.detailImages, ...uploadedUrls].slice(0, 15),
      }))
      toast({
        title: '상세페이지 이미지 등록 완료',
        description: `${uploadedUrls.length}장의 상세페이지 컷이 성공적으로 등록되었습니다.`,
      })
    } catch {
      toast({
        title: '업로드 오류',
        description: '상세페이지 이미지 업로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingDetailImages(false)
      setDetailUploadStatus('')
      if (detailInputRef.current) detailInputRef.current.value = ''
    }
  }

  const handleOpenCreateModal = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      subTitle: '',
      description: '■ 본사 직영 프리미엄 기획 상품\n- 본사 전문 바이어가 산지 및 제조사와 직접 계약하여 최고의 품질을 보증합니다.\n- 철저한 위생 검수 및 안심 포장으로 당일/익일 신속 발송됩니다.',
      category: 'FOOD',
      planType: 'PB',
      costPriceKrw: 18000,
      priceKrw: 42000,
      salePriceKrw: 32900,
      stock: 100,
      shippingFee: 0,
      images: [IMAGE_PRESETS[0].url],
      detailImages: [],
      allowAffiliate: true,
      affiliateCommissionRate: 10.0,
      groupTargetCount: 100,
    })
    setIsCreateModalOpen(true)
  }

  const handleOpenEditModal = (p: HqDirectProduct) => {
    setEditingProduct(p)
    setFormData({
      name: p.name,
      subTitle: p.subTitle || '',
      description: p.description || '',
      category: p.category,
      planType: p.planType,
      costPriceKrw: p.costPriceKrw,
      priceKrw: p.priceKrw,
      salePriceKrw: p.salePriceKrw,
      stock: p.stock,
      shippingFee: p.shippingFee,
      images: p.images && p.images.length > 0 ? p.images : [IMAGE_PRESETS[0].url],
      detailImages: p.detailImages || [],
      allowAffiliate: p.allowAffiliate,
      affiliateCommissionRate: p.affiliateCommissionRate,
      groupTargetCount: p.groupTargetCount || 100,
    })
    setIsCreateModalOpen(true)
  }

  // Quick Stock Edit State
  const [quickStockTarget, setQuickStockTarget] = useState<HqDirectProduct | null>(null)
  const [quickStockValue, setQuickStockValue] = useState<number>(0)

  // Load from localStorage or Fallback
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mocco_hq_direct_products')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed)
          setIsLoaded(true)
          return
        }
      }
    } catch {
      // ignore
    }
    setProducts(INITIAL_HQ_PRODUCTS)
    setIsLoaded(true)
  }, [])

  // Save to localStorage when changed
  const saveProducts = (updated: HqDirectProduct[]) => {
    setProducts(updated)
    try {
      localStorage.setItem('mocco_hq_direct_products', JSON.stringify(updated))
    } catch {
      // ignore
    }
  }

  // Calculated Real-Time Metrics
  const metrics = useMemo(() => {
    const totalCount = products.length
    const activeCount = products.filter((p) => p.status === 'ACTIVE').length
    const totalSalesRevenue = products.reduce((acc, p) => acc + p.salePriceKrw * p.salesCount, 0)
    const totalCost = products.reduce((acc, p) => acc + p.costPriceKrw * p.salesCount, 0)
    const totalNetProfit = totalSalesRevenue - totalCost
    const avgMarginRate =
      totalSalesRevenue > 0 ? ((totalNetProfit / totalSalesRevenue) * 100).toFixed(1) : '0.0'
    const affiliateLinkedCount = products.filter((p) => p.allowAffiliate).length
    const affiliateRate =
      totalCount > 0 ? ((affiliateLinkedCount / totalCount) * 100).toFixed(1) : '0.0'

    return {
      totalCount,
      activeCount,
      totalSalesRevenue,
      totalNetProfit,
      avgMarginRate,
      affiliateLinkedCount,
      affiliateRate,
    }
  }, [products])

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false
      if (planTypeFilter !== 'ALL' && p.planType !== planTypeFilter) return false
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = p.name.toLowerCase().includes(q)
        const matchSub = p.subTitle?.toLowerCase().includes(q) ?? false
        const matchId = p.id.toLowerCase().includes(q)
        if (!matchName && !matchSub && !matchId) return false
      }
      return true
    })
  }, [products, categoryFilter, planTypeFilter, statusFilter, searchQuery])

  // Create or Update Product Handler
  const handleSaveProduct = async () => {
    if (!formData.name.trim()) {
      toast({
        title: '상품명 입력 필요',
        description: '본사 직영 기획 상품명을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    if (formData.salePriceKrw <= 0 || formData.costPriceKrw < 0) {
      toast({
        title: '금액 설정 확인 필요',
        description: '판매가와 본사 원가를 올바르게 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    if (editingProduct) {
      // EDIT MODE
      const updated = products.map((p) => {
        if (p.id !== editingProduct.id) return p
        return {
          ...p,
          name: formData.name.trim(),
          subTitle: formData.subTitle.trim(),
          description: formData.description.trim() || formData.name.trim(),
          category: formData.category,
          planType: formData.planType,
          costPriceKrw: Number(formData.costPriceKrw),
          priceKrw: Number(formData.priceKrw || formData.salePriceKrw),
          salePriceKrw: Number(formData.salePriceKrw),
          stock: Number(formData.stock),
          shippingFee: Number(formData.shippingFee),
          images: formData.images.length > 0 ? formData.images : [IMAGE_PRESETS[0].url],
          detailImages: formData.detailImages,
          allowAffiliate: formData.allowAffiliate,
          affiliateCommissionRate: Number(formData.affiliateCommissionRate),
          groupTargetCount: Number(formData.groupTargetCount || 100),
        }
      })
      saveProducts(updated)
      setIsCreateModalOpen(false)
      setEditingProduct(null)
      toast({
        title: '✏️ 직영 상품 정보 수정 완료',
        description: `[${formData.name}] 상품의 정보가 성공적으로 변경되었습니다.`,
      })
    } else {
      // CREATE MODE
      const newProduct: HqDirectProduct = {
        id: `hq-p-${Date.now().toString().slice(-6)}`,
        name: formData.name.trim(),
        subTitle: formData.subTitle.trim(),
        description: formData.description.trim() || formData.name.trim(),
        category: formData.category,
        planType: formData.planType,
        costPriceKrw: Number(formData.costPriceKrw),
        priceKrw: Number(formData.priceKrw || formData.salePriceKrw),
        salePriceKrw: Number(formData.salePriceKrw),
        stock: Number(formData.stock),
        shippingFee: Number(formData.shippingFee),
        images: formData.images.length > 0 ? formData.images : [IMAGE_PRESETS[0].url],
        detailImages: formData.detailImages,
        status: 'ACTIVE',
        allowAffiliate: formData.allowAffiliate,
        affiliateCommissionRate: Number(formData.affiliateCommissionRate),
        salesCount: 0,
        viewCount: 1,
        isHqDirect: true,
        createdAt: new Date().toISOString().slice(0, 10),
        ...(formData.planType === 'GROUP_BUY'
          ? {
              groupTargetCount: Number(formData.groupTargetCount || 100),
              groupCurrentCount: 0,
            }
          : {}),
      }

      // Background sync to backend if API is live
      api.post('/market/admin/normal-products', {
        ...newProduct,
        ownerType: 'HEADQUARTERS',
        merchantId: 'mer-hq',
        merchantName: '모꼬(MOCCO) 본사 직영관',
      }).catch(() => null)

      const updated = [newProduct, ...products]
      saveProducts(updated)
      setIsCreateModalOpen(false)
      setEditingProduct(null)

      toast({
        title: '👑 본사 직영 상품 기획 등록 완료',
        description: `[${newProduct.name}]이 본사 직영 마켓 및 스트리머 제휴 센터에 즉시 노출됩니다.`,
      })
    }
  }

  // Toggle Status Handler
  const handleToggleStatus = (id: string, currentStatus: HqDirectProduct['status']) => {
    let nextStatus: HqDirectProduct['status'] = 'ACTIVE'
    if (currentStatus === 'ACTIVE') nextStatus = 'HIDDEN'
    else if (currentStatus === 'HIDDEN') nextStatus = 'ACTIVE'
    else nextStatus = 'ACTIVE'

    const updated = products.map((p) => (p.id === id ? { ...p, status: nextStatus } : p))
    saveProducts(updated)
    toast({
      title: '노출 상태 변경',
      description: `상품 상태가 [${nextStatus === 'ACTIVE' ? '판매중 (노출)' : '숨김 (미노출)'}]으로 전환되었습니다.`,
    })
  }

  // Quick Stock Save
  const handleSaveQuickStock = () => {
    if (!quickStockTarget) return
    const updated = products.map((p) =>
      p.id === quickStockTarget.id
        ? {
            ...p,
            stock: quickStockValue,
            status: quickStockValue <= 0 ? ('OUT_OF_STOCK' as const) : p.status === 'OUT_OF_STOCK' ? ('ACTIVE' as const) : p.status,
          }
        : p
    )
    saveProducts(updated)
    setQuickStockTarget(null)
    toast({
      title: '재고 수량 수정 완료',
      description: `${quickStockTarget.name}의 재고가 ${quickStockValue}개로 변경되었습니다.`,
    })
  }

  // Delete Handler
  const handleDeleteProduct = (id: string, name: string) => {
    if (!confirm(`[${name}] 직영 기획 상품을 삭제하시겠습니까?`)) return
    const updated = products.filter((p) => p.id !== id)
    saveProducts(updated)
    toast({
      title: '직영 상품 삭제 완료',
      description: '해당 기획 상품이 카탈로그에서 제거되었습니다.',
    })
  }

  // Form Margin Calculations
  const calculatedMarginKrw = Math.max(0, formData.salePriceKrw - formData.costPriceKrw)
  const calculatedMarginRate =
    formData.salePriceKrw > 0
      ? ((calculatedMarginKrw / formData.salePriceKrw) * 100).toFixed(1)
      : '0.0'
  const calculatedStreamerCommission = formData.allowAffiliate
    ? Math.floor((formData.salePriceKrw * formData.affiliateCommissionRate) / 100)
    : 0
  const calculatedHqNetProfit = calculatedMarginKrw - calculatedStreamerCommission

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header & Navigation Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-black shadow-md">
              <Crown className="w-5 h-5 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  본사 직영 상품 기획 및 관리 (HQ Direct PB & Deals)
                </h1>
                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold text-[11px] shadow-xs">
                  플랫폼 핵심 수익원
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                본사 공식 PB 브랜드, 기획 특가 및 공식 공동구매 상품을 직접 등록하고 실시간 마진율과 라이브 커머스 제휴를 총괄합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <Button
            onClick={handleOpenCreateModal}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            + 본사 직영 상품 기획 등록
          </Button>
          <Button asChild variant="outline" size="sm" className="text-xs gap-1.5">
            <Link href="/dashboard">
              <span>통합 대시보드</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Key Metrics 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              총 직영 기획 상품
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-foreground">{metrics.totalCount}개</p>
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-[11px] font-semibold text-amber-700">
                활성 {metrics.activeCount}개
              </Badge>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              PB 브랜드 및 직영 특가 라인업
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              직영 상품 누적 매출
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-foreground">
                ₩{metrics.totalSalesRevenue.toLocaleString()}
              </p>
              <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-[11px] font-semibold text-emerald-700">
                정상 정산
              </Badge>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              에스크로 보호 직영 실매출 합계
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              본사 순수익 & 평균 마진율
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-indigo-600">
                ₩{metrics.totalNetProfit.toLocaleString()}
              </p>
              <Badge className="bg-indigo-600 text-white text-[11px] font-bold">
                평균 {metrics.avgMarginRate}%
              </Badge>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              매입 원가 공제 후 본사 영업이익
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              라이브 제휴 쇼핑백 연동
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-rose-600">{metrics.affiliateRate}%</p>
              <Badge variant="outline" className="border-rose-300 bg-rose-50 text-[11px] font-semibold text-rose-700">
                {metrics.affiliateLinkedCount}개 연동
              </Badge>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              스트리머 라이브 장바구니 위탁 판매 중
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-card border border-border rounded-xl">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="상품명, 상품 ID, 서브 카피 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Plan Type Filter */}
          <select
            value={planTypeFilter}
            onChange={(e) => setPlanTypeFilter(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-border bg-background text-xs font-medium focus:outline-hidden"
          >
            <option value="ALL">기획 유형 (전체)</option>
            <option value="PB">👑 본사 PB 브랜드</option>
            <option value="SPECIAL_DEAL">🔥 타임 기획 특가</option>
            <option value="GROUP_BUY">🤝 공식 공동구매</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-border bg-background text-xs font-medium focus:outline-hidden"
          >
            <option value="ALL">카테고리 (전체)</option>
            <option value="FOOD">식품/산지직송</option>
            <option value="DIGITAL">디지털/가전</option>
            <option value="LIVING">리빙/헬스</option>
            <option value="BEAUTY">뷰티/케어</option>
            <option value="FASHION">패션/잡화</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-border bg-background text-xs font-medium focus:outline-hidden"
          >
            <option value="ALL">노출 상태 (전체)</option>
            <option value="ACTIVE">판매중 (노출)</option>
            <option value="OUT_OF_STOCK">일시 품절</option>
            <option value="HIDDEN">숨김 (미노출)</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setCategoryFilter('ALL')
              setPlanTypeFilter('ALL')
              setStatusFilter('ALL')
            }}
            className="h-9 text-xs"
          >
            초기화
          </Button>
        </div>
      </div>

      {/* 4. Products Table */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 flex flex-row items-center justify-between border-b">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              본사 직영 상품 카탈로그 ({filteredProducts.length}개)
            </CardTitle>
            <CardDescription className="text-xs">
              등록된 본사 직영 상품은 고객 웹 스토어 상단 직영관 및 라이브 방송 장바구니에 실시간 우선 노출됩니다.
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>본사 품질 보증 및 직발송</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] uppercase tracking-wider bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-semibold">상품 정보</th>
                  <th className="px-5 py-3 font-semibold text-center">기획 유형</th>
                  <th className="px-5 py-3 font-semibold text-right">정상가 / 판매가</th>
                  <th className="px-5 py-3 font-semibold text-right">본사 원가 / 마진율</th>
                  <th className="px-5 py-3 font-semibold text-center">재고 수량</th>
                  <th className="px-5 py-3 font-semibold text-center">라이브 제휴</th>
                  <th className="px-5 py-3 font-semibold text-center">노출 상태</th>
                  <th className="px-5 py-3 font-semibold text-right">통제 액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((p) => {
                  const marginKrw = Math.max(0, p.salePriceKrw - p.costPriceKrw)
                  const marginRate =
                    p.salePriceKrw > 0 ? ((marginKrw / p.salePriceKrw) * 100).toFixed(1) : '0'

                  return (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      {/* 1. 상품 정보 */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-12 h-12 rounded-lg object-cover border border-border shadow-2xs shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-2xs">
                                👑 본사직영
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {p.category} · ID: {p.id}
                              </span>
                            </div>
                            <p className="font-semibold text-foreground text-xs sm:text-sm truncate mt-0.5 max-w-xs sm:max-w-md">
                              {p.name}
                            </p>
                            {p.subTitle && (
                              <p className="text-[11px] text-muted-foreground truncate">
                                {p.subTitle}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. 기획 유형 */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        {p.planType === 'PB' && (
                          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[11px] font-bold">
                            👑 PB 브랜드
                          </Badge>
                        )}
                        {p.planType === 'SPECIAL_DEAL' && (
                          <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/30 text-[11px] font-bold">
                            🔥 기획 특가
                          </Badge>
                        )}
                        {p.planType === 'GROUP_BUY' && (
                          <div className="space-y-0.5">
                            <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 text-[11px] font-bold">
                              🤝 공식 공구
                            </Badge>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {p.groupCurrentCount}/{p.groupTargetCount}명
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3. 정상가 / 판매가 */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="font-mono text-xs text-muted-foreground line-through">
                          ₩{p.priceKrw.toLocaleString()}
                        </div>
                        <div className="font-mono font-bold text-sm text-foreground">
                          ₩{p.salePriceKrw.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {p.shippingFee === 0 ? '무료배송' : `배송비 ₩${p.shippingFee.toLocaleString()}`}
                        </div>
                      </td>

                      {/* 4. 본사 원가 / 마진율 */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="font-mono text-xs text-muted-foreground">
                          원가 ₩{p.costPriceKrw.toLocaleString()}
                        </div>
                        <div className="font-mono font-bold text-xs text-indigo-600 flex items-center justify-end gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>+{marginRate}%</span>
                        </div>
                        <div className="text-[10px] text-indigo-700/80 font-mono">
                          (이익 ₩{marginKrw.toLocaleString()})
                        </div>
                      </td>

                      {/* 5. 재고 수량 */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`font-mono font-bold text-xs ${
                              p.stock <= 10 ? 'text-rose-600' : 'text-foreground'
                            }`}
                          >
                            {p.stock.toLocaleString()}개
                          </span>
                          <button
                            onClick={() => {
                              setQuickStockTarget(p)
                              setQuickStockValue(p.stock)
                            }}
                            className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                            title="재고 빠른 수정"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {p.stock <= 10 && p.stock > 0 && (
                          <div className="text-[10px] text-rose-500 font-semibold">품절 임박</div>
                        )}
                        {p.stock <= 0 && (
                          <div className="text-[10px] text-rose-600 font-bold">품절 상태</div>
                        )}
                      </td>

                      {/* 6. 라이브 제휴 */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        {p.allowAffiliate ? (
                          <div className="space-y-0.5">
                            <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px] font-bold">
                              🎙️ 제휴 {p.affiliateCommissionRate}%
                            </Badge>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              수수료 ₩{Math.floor((p.salePriceKrw * p.affiliateCommissionRate) / 100).toLocaleString()}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[10px]">
                            제휴 미연동
                          </Badge>
                        )}
                      </td>

                      {/* 7. 노출 상태 */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        {p.status === 'ACTIVE' && (
                          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[11px] font-semibold">
                            판매중 (노출)
                          </Badge>
                        )}
                        {p.status === 'OUT_OF_STOCK' && (
                          <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/30 text-[11px] font-semibold">
                            일시 품절
                          </Badge>
                        )}
                        {p.status === 'HIDDEN' && (
                          <Badge variant="outline" className="text-muted-foreground text-[11px]">
                            숨김 (미노출)
                          </Badge>
                        )}
                      </td>

                      {/* 8. 통제 액션 */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditModal(p)}
                            className="h-8 text-xs gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>수정</span>
                          </Button>

                          <Button
                            size="sm"
                            variant={p.status === 'ACTIVE' ? 'outline' : 'default'}
                            onClick={() => handleToggleStatus(p.id, p.status)}
                            className="h-8 text-xs gap-1"
                          >
                            {p.status === 'ACTIVE' ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>숨김</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>노출</span>
                              </>
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground text-xs">
                      검색 조건과 일치하는 본사 직영 상품이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 5. 본사 직영 상품 기획 등록 및 수정 모달 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in-50 zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black shadow">
                  <Crown className="w-5 h-5 font-black" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {editingProduct ? '👑 본사 직영 상품 정보 수정' : '신규 본사 직영 상품 기획 등록'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {editingProduct
                      ? '등록된 직영 상품의 이미지, 상세 설명, 가격, 재고 및 제휴 수수료를 실시간 수정합니다.'
                      : '골드 메탈릭 뱃지와 함께 본사 직영관 및 라이브 쇼핑백에 등록됩니다.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setEditingProduct(null)
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
              {/* 기획 유형 라디오 카드 */}
              <div>
                <label className="font-semibold block mb-1.5 text-foreground">
                  기획 유형 선택 *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, planType: 'PB' })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      formData.planType === 'PB'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 font-bold shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs">본사 PB 브랜드</span>
                    </div>
                    <p className="text-[10px] mt-0.5 text-muted-foreground">자체 기획 고마진</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, planType: 'SPECIAL_DEAL' })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      formData.planType === 'SPECIAL_DEAL'
                        ? 'border-rose-500 bg-rose-500/10 text-rose-700 font-bold shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-xs">타임 기획 특가</span>
                    </div>
                    <p className="text-[10px] mt-0.5 text-muted-foreground">한정수량 프로모션</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, planType: 'GROUP_BUY' })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      formData.planType === 'GROUP_BUY'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-700 font-bold shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Users2 className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs">공식 공동구매</span>
                    </div>
                    <p className="text-[10px] mt-0.5 text-muted-foreground">목표인원 달성형</p>
                  </button>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-semibold block mb-1">상품명 *</label>
                  <Input
                    placeholder="예: [본사 PB] 모꼬 프리미엄 샤인머스캣 2kg 세트"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">카테고리</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as HqDirectProduct['category'],
                      })
                    }
                    className="w-full h-9 px-2.5 rounded-md border border-border bg-background text-xs font-medium focus:outline-hidden"
                  >
                    <option value="FOOD">식품/산지</option>
                    <option value="DIGITAL">디지털/가전</option>
                    <option value="LIVING">리빙/헬스</option>
                    <option value="BEAUTY">뷰티/케어</option>
                    <option value="FASHION">패션/잡화</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">핵심 서브 카피 / 요약 설명</label>
                <Input
                  placeholder="예: 산지 직송 당일 도축 1등급 신선 냉장 보랭 배송"
                  value={formData.subTitle}
                  onChange={(e) => setFormData({ ...formData, subTitle: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              {/* 상품 썸네일 이미지 파일 직접 업로드 (내 PC 파일 선택 / 드래그 앤 드롭) */}
              <div className="p-3.5 bg-muted/30 rounded-xl border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-500" />
                    <label className="font-bold text-foreground">
                      대표 및 추가 썸네일 이미지 ({formData.images.length}/10) *
                    </label>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={isUploadingThumbnails}
                    className="h-7 text-xs gap-1 border-amber-300 text-amber-800 hover:bg-amber-50"
                  >
                    {isUploadingThumbnails ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>{thumbnailUploadStatus || '업로드 중...'}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3" />
                        <span>내 PC 사진 업로드</span>
                      </>
                    )}
                  </Button>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) handleThumbnailFiles(e.target.files)
                    }}
                  />
                </div>

                {/* 이미지 미리보기 썸네일 목록 */}
                {formData.images.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {formData.images.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative w-16 h-16 rounded-lg border border-border overflow-hidden shrink-0 group bg-card"
                      >
                        <img src={url} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute bottom-0 inset-x-0 bg-amber-500 text-black text-[9px] font-black text-center py-0.5">
                            대표
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== idx),
                            }))
                          }}
                          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 프리셋 선택 바 */}
                <div className="pt-1 border-t border-border/60 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-muted-foreground font-medium">빠른 프리셋 추가:</span>
                  {IMAGE_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        if (!formData.images.includes(p.url)) {
                          setFormData({ ...formData, images: [...formData.images, p.url].slice(0, 10) })
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-[10px] font-medium transition-colors"
                    >
                      +{p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 상세페이지 컷 이미지 등록 (선택) */}
              <div className="p-3.5 bg-muted/30 rounded-xl border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                    <div>
                      <label className="font-bold text-foreground">
                        상세페이지 디자인 컷 이미지 ({formData.detailImages.length}/15)
                      </label>
                      <p className="text-[10px] text-muted-foreground">
                        소비자 상세페이지에 고화질로 세로 스택 연결되어 노출됩니다.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => detailInputRef.current?.click()}
                    disabled={isUploadingDetailImages}
                    className="h-7 text-xs gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    {isUploadingDetailImages ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>{detailUploadStatus || '업로드 중...'}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3" />
                        <span>상세 이미지 업로드</span>
                      </>
                    )}
                  </Button>
                  <input
                    ref={detailInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) handleDetailFiles(e.target.files)
                    }}
                  />
                </div>

                {formData.detailImages.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {formData.detailImages.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative w-14 h-14 rounded-lg border border-border overflow-hidden shrink-0 group bg-card"
                      >
                        <img src={url} alt={`detail-${idx}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center py-0.5">
                          {idx + 1}번 컷
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              detailImages: prev.detailImages.filter((_, i) => i !== idx),
                            }))
                          }}
                          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 상세 설명 텍스트 에디터 */}
              <div>
                <label className="font-semibold block mb-1">상세페이지 설명 본문</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="상품 특장점, 규격, 보관방법, 인증 정보 등을 기재해 주세요."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-hidden font-sans leading-relaxed"
                />
              </div>

              {/* 가격 및 수익성 설정 */}
              <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-3">
                <div className="font-bold text-foreground flex items-center justify-between">
                  <span>💰 가격 및 본사 수익성 시뮬레이션</span>
                  <Badge variant="outline" className="text-[10px] text-indigo-700 bg-indigo-50 border-indigo-200">
                    실시간 계산
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold block mb-1 text-muted-foreground">
                      정상 소비자가 (KRW)
                    </label>
                    <Input
                      type="number"
                      value={formData.priceKrw}
                      onChange={(e) =>
                        setFormData({ ...formData, priceKrw: Number(e.target.value) })
                      }
                      className="text-xs h-9 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold block mb-1 text-foreground">
                      본사 판매가 (할인가) *
                    </label>
                    <Input
                      type="number"
                      value={formData.salePriceKrw}
                      onChange={(e) =>
                        setFormData({ ...formData, salePriceKrw: Number(e.target.value) })
                      }
                      className="text-xs h-9 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold block mb-1 text-foreground">
                      본사 매입 원가 *
                    </label>
                    <Input
                      type="number"
                      value={formData.costPriceKrw}
                      onChange={(e) =>
                        setFormData({ ...formData, costPriceKrw: Number(e.target.value) })
                      }
                      className="text-xs h-9 font-mono"
                    />
                  </div>
                </div>

                {/* 실시간 마진율 박스 */}
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-amber-800 font-semibold">건당 본사 영업이익: </span>
                    <span className="font-bold font-mono text-amber-900">
                      ₩{calculatedMarginKrw.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-800 font-bold">
                    <span>마진율:</span>
                    <Badge className="bg-amber-600 text-white font-extrabold text-[11px]">
                      {calculatedMarginRate}%
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 재고 및 배송 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">재고 수량 *</label>
                  <Input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="text-xs h-9 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">기본 배송비 (0원=무료배송)</label>
                  <Input
                    type="number"
                    value={formData.shippingFee}
                    onChange={(e) =>
                      setFormData({ ...formData, shippingFee: Number(e.target.value) })
                    }
                    className="text-xs h-9 font-mono"
                  />
                </div>
              </div>

              {/* 라이브 스트리머 제휴 위탁 설정 */}
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-600">
                  <input
                    type="checkbox"
                    checked={formData.allowAffiliate}
                    onChange={(e) =>
                      setFormData({ ...formData, allowAffiliate: e.target.checked })
                    }
                    className="rounded border-rose-500 text-rose-600 w-4 h-4"
                  />
                  <span>🎙️ 스트리머 라이브 방송 제휴 위탁 판매 허용 (라이브 쇼핑백 연동)</span>
                </label>

                {formData.allowAffiliate && (
                  <div className="pl-6 pt-1 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">스트리머 수수료율:</span>
                      <Input
                        type="number"
                        step="0.5"
                        value={formData.affiliateCommissionRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            affiliateCommissionRate: Number(e.target.value),
                          })
                        }
                        className="w-20 text-right font-bold text-xs h-8"
                      />
                      <span>%</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      스트리머 건당 ₩{calculatedStreamerCommission.toLocaleString()} 지급 → 본사 최종 순마진 ₩
                      {calculatedHqNetProfit.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setEditingProduct(null)
                }}
              >
                취소
              </Button>
              <Button
                onClick={handleSaveProduct}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 shadow-sm text-xs"
              >
                <Crown className="w-4 h-4 text-amber-200" />
                {editingProduct ? '상품 수정 내용 저장하기' : '직영 기획 상품 즉시 등록'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Quick Stock Edit Modal */}
      {quickStockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-sm">재고 빠른 수정</h4>
              <button
                onClick={() => setQuickStockTarget(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">상품명</p>
              <p className="text-xs font-semibold">{quickStockTarget.name}</p>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">변경할 재고 수량 (개)</label>
              <Input
                type="number"
                value={quickStockValue}
                onChange={(e) => setQuickStockValue(Number(e.target.value))}
                className="text-sm font-mono"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setQuickStockTarget(null)}>
                취소
              </Button>
              <Button size="sm" onClick={handleSaveQuickStock} className="bg-primary text-white font-bold">
                저장
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
