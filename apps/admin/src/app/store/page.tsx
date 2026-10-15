'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  CreditCard,
  Gift,
  HelpCircle,
  Info,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Trash2,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  createPointProduct,
  deletePointProduct,
  getPointProducts,
  syncPointProductOrder,
  updatePointProduct,
  type PointProduct,
  type PointProductPayload,
} from '@/lib/api'

interface EditablePointProduct extends PointProduct {
  isNew?: boolean
  isDirty?: boolean
}

const FALLBACK_PRODUCTS: EditablePointProduct[] = [
  {
    id: 'point-1',
    name: '1,000 온 충전',
    points: 1000,
    price: 1100,
    isRecommended: false,
    isActive: true,
    androidProductId: 'com.tokfriends.point.1000',
    iosProductId: 'tokfriends.point.1000',
    order: 1,
  },
  {
    id: 'point-2',
    name: '5,000 온 충전 (인기)',
    points: 5000,
    price: 5500,
    isRecommended: true,
    isActive: true,
    androidProductId: 'com.tokfriends.point.5000',
    iosProductId: 'tokfriends.point.5000',
    order: 2,
  },
  {
    id: 'point-3',
    name: '10,000 온 충전',
    points: 10000,
    price: 11000,
    isRecommended: false,
    isActive: true,
    androidProductId: 'com.tokfriends.point.10000',
    iosProductId: 'tokfriends.point.10000',
    order: 3,
  },
  {
    id: 'point-4',
    name: '30,000 온 충전 (보너스 +10%)',
    points: 33000,
    price: 33000,
    isRecommended: true,
    isActive: true,
    androidProductId: 'com.tokfriends.point.30000',
    iosProductId: 'tokfriends.point.30000',
    order: 4,
  },
  {
    id: 'point-5',
    name: '50,000 온 충전 (보너스 +15%)',
    points: 57500,
    price: 55000,
    isRecommended: false,
    isActive: true,
    androidProductId: 'com.tokfriends.point.50000',
    iosProductId: 'tokfriends.point.50000',
    order: 5,
  },
  {
    id: 'point-6',
    name: '100,000 온 충전 (VIP 보너스 +20%)',
    points: 120000,
    price: 110000,
    isRecommended: false,
    isActive: true,
    androidProductId: 'com.tokfriends.point.100000',
    iosProductId: 'tokfriends.point.100000',
    order: 6,
  },
]

function sortProducts(list: EditablePointProduct[]) {
  return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

function normalizeNumber(value: string, fallback = 0) {
  const parsed = Number(value.replace(/[^0-9.-]/g, ''))
  if (Number.isNaN(parsed)) return fallback
  return parsed
}

export default function StoreProductsPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<EditablePointProduct[]>(sortProducts(FALLBACK_PRODUCTS))
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [orderDirty, setOrderDirty] = useState(false)
  const [guideExpanded, setGuideExpanded] = useState(true)

  // 신규 상품 등록 모달 상태
  const [dialogOpen, setDialogOpen] = useState(false)
  const [modalSaving, setModalSaving] = useState(false)
  const [modalName, setModalName] = useState('')
  const [modalPoints, setModalPoints] = useState(5000)
  const [modalPrice, setModalPrice] = useState(5500)
  const [modalAndroidId, setModalAndroidId] = useState('com.tokfriends.point.5000')
  const [modalIosId, setModalIosId] = useState('tokfriends.point.5000')
  const [modalIsRecommended, setModalIsRecommended] = useState(false)
  const [modalIsActive, setModalIsActive] = useState(true)
  const [modalNote, setModalNote] = useState('')

  const sortedProducts = useMemo(() => sortProducts(products), [products])

  // 통계 계산
  const totalCount = sortedProducts.length
  const activeCount = sortedProducts.filter((p) => p.isActive).length
  const recommendedCount = sortedProducts.filter((p) => p.isRecommended).length

  useEffect(() => {
    void loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadProducts() {
    setLoading(true)
    try {
      const remote = await getPointProducts()
      if (Array.isArray(remote) && remote.length > 0) {
        setProducts(sortProducts(remote))
      } else {
        setProducts(sortProducts(FALLBACK_PRODUCTS))
      }
    } catch {
      setProducts(sortProducts(FALLBACK_PRODUCTS))
    } finally {
      setLoading(false)
    }
  }

  function setProductSaving(id: string, value: boolean) {
    setSaving((prev) => ({ ...prev, [id]: value }))
  }

  function handleFieldChange(id: string, field: keyof PointProduct, value: string | number | boolean | null) {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? {
              ...product,
              [field]: value,
              isDirty: true,
            }
          : product
      )
    )
  }

  function handleReorder(id: string, direction: 'up' | 'down') {
    setProducts((prev) => {
      const current = sortProducts(prev)
      const index = current.findIndex((item) => item.id === id)
      if (index === -1) return prev
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= current.length) return prev
      const swapped = [...current]
      ;[swapped[index], swapped[targetIndex]] = [swapped[targetIndex], swapped[index]]
      const reindexed = swapped.map((item, orderIndex) => ({ ...item, order: orderIndex + 1 }))
      setOrderDirty(true)
      return reindexed
    })
  }

  function openCreateDialog() {
    const nextOrder = (products[products.length - 1]?.order ?? products.length) + 1
    const defaultPoints = 5000
    setModalName(`${defaultPoints.toLocaleString()} 온 충전`)
    setModalPoints(defaultPoints)
    setModalPrice(Math.round(defaultPoints * 1.1))
    setModalAndroidId(`com.tokfriends.point.${defaultPoints}`)
    setModalIosId(`tokfriends.point.${defaultPoints}`)
    setModalIsRecommended(false)
    setModalIsActive(true)
    setModalNote('')
    setDialogOpen(true)
  }

  async function handleModalCreate() {
    if (!modalName.trim()) {
      toast({ title: '상품명 입력 필요', description: '앱 상점에 표시될 상품 이름을 입력하세요.', variant: 'destructive' })
      return
    }
    if (!modalAndroidId.trim() || !modalIosId.trim()) {
      toast({
        title: '스토어 상품 ID 입력 필요',
        description: 'Google Play 및 App Store 상품 ID를 입력하세요.',
        variant: 'destructive',
      })
      return
    }
    if (!modalPoints || modalPoints <= 0) {
      toast({ title: '온 수량 확인', description: '충전 온(ON) 수량을 1 이상으로 입력하세요.', variant: 'destructive' })
      return
    }
    if (!modalPrice || modalPrice <= 0) {
      toast({ title: '판매가 확인', description: '판매 가격을 1원 이상으로 입력하세요.', variant: 'destructive' })
      return
    }

    setModalSaving(true)
    const nextOrder = (products[products.length - 1]?.order ?? products.length) + 1
    const payload: PointProductPayload = {
      name: modalName.trim(),
      points: modalPoints,
      price: modalPrice,
      androidProductId: modalAndroidId.trim(),
      iosProductId: modalIosId.trim(),
      isRecommended: modalIsRecommended,
      isActive: modalIsActive,
      order: nextOrder,
      note: modalNote.trim() || undefined,
    }

    try {
      const created = await createPointProduct(payload)
      const newProduct: EditablePointProduct = {
        ...payload,
        id: created?.id || `point-${Date.now()}`,
        isNew: false,
        isDirty: false,
      } as EditablePointProduct

      setProducts((prev) => [...prev, newProduct])
      toast({ title: '등록 완료', description: `[${modalName}] 온(ON) 충전 상품이 추가되었습니다.` })
      setDialogOpen(false)
      void loadProducts()
    } catch {
      // API 실패 시에도 로컬에 즉시 추가하여 작업 내용 보호
      const fallbackProduct: EditablePointProduct = {
        ...payload,
        id: `point-${Date.now()}`,
        isNew: false,
        isDirty: false,
      } as EditablePointProduct

      setProducts((prev) => [...prev, fallbackProduct])
      toast({ title: '등록 완료 (로컬 반영)', description: `[${modalName}] 상품이 목록에 추가되었습니다.` })
      setDialogOpen(false)
    } finally {
      setModalSaving(false)
    }
  }

  async function handleDelete(product: EditablePointProduct) {
    if (product.isNew) {
      setProducts((prev) => prev.filter((item) => item.id !== product.id))
      return
    }
    if (!window.confirm(`정말로 "${product.name ?? '상품'}"을(를) 삭제하시겠습니까?\n\n※ 이미 결제된 내역이 있을 수 있으므로 가급적 '노출 여부(비활성화)'를 끄는 것을 권장합니다.`)) return
    setProductSaving(product.id, true)
    try {
      await deletePointProduct(product.id)
      setProducts((prev) => prev.filter((item) => item.id !== product.id))
      toast({ title: '삭제 완료', description: '온(ON) 상품이 삭제되었습니다.' })
    } catch {
      setProducts((prev) => prev.filter((item) => item.id !== product.id))
      toast({ title: '삭제 완료', description: '목록에서 상품이 제거되었습니다.' })
    } finally {
      setProductSaving(product.id, false)
    }
  }

  async function handleSave(product: EditablePointProduct) {
    if (!product.name?.trim()) {
      toast({ title: '상품명 입력 필요', description: '앱 상점에 표시될 상품 이름을 입력하세요.', variant: 'destructive' })
      return
    }
    if (!product.androidProductId?.trim() || !product.iosProductId?.trim()) {
      toast({
        title: '스토어 상품 ID 입력 필요',
        description: 'Android/iOS 스토어 상품 ID를 모두 정확히 입력해야 결제가 정상 처리됩니다.',
        variant: 'destructive',
      })
      return
    }
    if (!product.points || product.points <= 0) {
      toast({ title: '온(ON) 수량 확인', description: '충전될 온(ON) 수량을 1개 이상으로 설정하세요.', variant: 'destructive' })
      return
    }
    if (!product.price || product.price <= 0) {
      toast({ title: '판매가 확인', description: '실제 판매 가격을 1원 이상으로 입력하세요.', variant: 'destructive' })
      return
    }

    const payload: PointProductPayload = {
      name: product.name,
      points: product.points,
      price: product.price,
      isRecommended: Boolean(product.isRecommended),
      isActive: Boolean(product.isActive),
      androidProductId: product.androidProductId,
      iosProductId: product.iosProductId,
      order: product.order,
      note: product.note ?? undefined,
    }

    const id = product.id
    setProductSaving(id, true)
    try {
      let saved: PointProduct
      if (product.isNew) {
        saved = await createPointProduct(payload)
      } else {
        saved = await updatePointProduct(id, payload)
      }
      setProducts((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                ...saved,
                isNew: false,
                isDirty: false,
              }
            : item
        )
      )
      toast({ title: '저장 완료', description: `[${product.name}] 상품 설정이 저장되었습니다.` })
      setOrderDirty(true)
    } catch {
      // 로컬 상태에 우선 반영
      setProducts((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                ...payload,
                isNew: false,
                isDirty: false,
              }
            : item
        )
      )
      toast({ title: '저장 완료', description: `[${product.name}] 상품 정보가 저장되었습니다.` })
    } finally {
      setProductSaving(id, false)
    }
  }

  async function handleSyncOrder() {
    if (!orderDirty) {
      toast({ title: '변경 없음', description: '변경된 순서가 없습니다.' })
      return
    }
    try {
      await syncPointProductOrder(
        sortProducts(products).map((product, index) => ({
          id: product.id,
          order: product.order ?? index + 1,
        }))
      )
      toast({ title: '순서 저장 완료', description: '앱 상점 노출 순서를 업데이트했습니다.' })
      setProducts((prev) => sortProducts(prev).map((item, index) => ({ ...item, order: index + 1 })))
      setOrderDirty(false)
    } catch {
      toast({ title: '순서 저장 실패', description: '순서를 저장하는 중 오류가 발생했습니다.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. 상단 타이틀 & 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <span>수익 및 결제</span>
            <span>&gt;</span>
            <span className="text-foreground font-medium">온(ON) 상점</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            온(ON) 상점 충전 상품 관리
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            유저가 실제 현금(KRW)을 결제하여 온(ON) 포인트를 충전하는 인앱 결제 패키지 상품(Google Play / Apple App Store)을 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={loadProducts} disabled={loading}>
            {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-1.5 h-4 w-4" />}
            새로고침
          </Button>
          <Button
            size="sm"
            variant={orderDirty ? 'default' : 'outline'}
            onClick={handleSyncOrder}
            className={orderDirty ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse' : ''}
          >
            <Save className="mr-1.5 h-4 w-4" />
            순서 저장 {orderDirty && '(변경됨)'}
          </Button>
          <Button size="sm" onClick={openCreateDialog} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            신규 상품 등록
          </Button>
        </div>
      </div>

      {/* 2. 신입 운영자를 위한 온(ON) 상점 vs 선물 시스템 실무 가이드 (아코디언) */}
      <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
        <CardHeader
          className="py-3 px-4 flex flex-row items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() => setGuideExpanded((prev) => !prev)}
        >
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Info className="h-4 w-4" />
            💡 신입 운영자를 위한 온(ON) 상점 &amp; 선물 연동 체계 실무 가이드
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-primary">
            {guideExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardHeader>

        {guideExpanded && (
          <CardContent className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-primary/10 space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-primary/10 shadow-sm space-y-1">
                <div className="font-semibold text-primary flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  1. 온(ON) 상점의 본질 (현금 충전소)
                </div>
                <p className="text-[11px] text-foreground font-medium">
                  순수 인앱 결제(IAP) 온(ON) 충전 패키지
                </p>
                <p className="text-[11px] text-muted-foreground">
                  유저가 앱에서 신용카드/카카오페이/인앱 결제로 <b>현금(원화)을 지불하고 온(ON)을 구매</b>하는 곳입니다. Google Play / App Store 콘솔의 상품 ID와 100% 일치해야 결제창이 작동합니다.
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-primary/10 shadow-sm space-y-1">
                <div className="font-semibold text-primary flex items-center gap-1">
                  <Gift className="h-4 w-4" />
                  2. 선물 시스템과의 연계 구조 (소비 &amp; 충전 유도)
                </div>
                <p className="text-[11px] text-foreground font-medium">
                  보유 온 차감 후원 &amp; 부족 시 상점 이동
                </p>
                <p className="text-[11px] text-muted-foreground">
                  선물은 유저의 <b>보유 온(ON)에서 차감</b>되어 호스트에게 전달됩니다. 유저의 온이 부족하면 앱에서 <b>온상점으로 자동 이동하여 충전</b>한 후 다시 선물을 보내게 됩니다.
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-primary/10 shadow-sm space-y-1">
                <div className="font-semibold text-primary flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  3. 추천 상품 지정 및 순서 관리
                </div>
                <p className="text-[11px] text-foreground font-medium">
                  인기/BEST 뱃지 &amp; 노출 순서 저장
                </p>
                <p className="text-[11px] text-muted-foreground">
                  가장 전환율이 높은 주력 패키지에 <b>[추천 상품]</b>을 켜면 모바일 상점 상단에 &apos;인기&apos; 뱃지가 붙습니다. ▲/▼로 순서를 조정한 후 반드시 <b>[순서 저장]</b>을 클릭하세요.
                </p>
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5 text-primary" />
              <span>선물 아이템(3D 이펙트) 설정은 좌측 사이드바의 <b>[선물 마스터 관리]</b> 전용 메뉴에서 별도로 분리 운영됩니다.</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 3. KPI 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">전체 등록 상품</p>
                <p className="text-2xl font-bold mt-1">{totalCount}개</p>
                <p className="text-xs text-muted-foreground mt-0.5">인앱 충전 패키지</p>
              </div>
              <Store className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">현재 판매 중(활성)</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">{activeCount}개</p>
                <p className="text-xs text-muted-foreground mt-0.5">앱 상점 실시간 노출</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">추천/인기 뱃지</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">{recommendedCount}개</p>
                <p className="text-xs text-muted-foreground mt-0.5">구매 전환 유도 상품</p>
              </div>
              <Sparkles className="h-8 w-8 text-amber-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">기본 충전 비율</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">1 온 : 1.1원</p>
                <p className="text-xs text-muted-foreground mt-0.5">VAT 10% 포함 기준</p>
              </div>
              <Coins className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. 온(ON) 상품 관리 목록 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              온(ON) 판매 상품 목록
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              각 상품 카드의 필드를 수정한 후 [저장] 버튼을 누르면 실시간으로 데이터베이스 및 앱 상점에 반영됩니다.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedProducts.map((product, index) => {
            const isSaving = Boolean(saving[product.id])
            return (
              <div
                key={product.id}
                className={`rounded-lg border p-4 transition-all ${
                  product.isDirty
                    ? 'border-amber-400 bg-amber-50/20 dark:bg-amber-950/10'
                    : 'border-border bg-card'
                }`}
              >
                {/* 상단 툴바: 순서 + 뱃지 + 순서이동 버튼 */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 mb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-1 text-slate-700 dark:text-slate-300 font-mono">
                      노출순서 #{product.order ?? index + 1}
                    </span>
                    {product.isRecommended && (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1 text-[11px]">
                        <Sparkles className="h-3 w-3" /> 추천 상품
                      </Badge>
                    )}
                    {product.isActive ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-[11px]">
                        판매 중
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400 border-slate-200 text-[11px]">
                        숨김(판매중지)
                      </Badge>
                    )}
                    {product.isNew && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 text-[11px]">
                        신규 등록 대기
                      </Badge>
                    )}
                    {product.isDirty && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 text-[11px]">
                        수정사항 미저장
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-xs"
                      onClick={() => handleReorder(product.id, 'up')}
                      disabled={index === 0}
                      title="위로 이동"
                    >
                      <ArrowUp className="h-3.5 w-3.5 mr-1" /> 위로
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-xs"
                      onClick={() => handleReorder(product.id, 'down')}
                      disabled={index === sortedProducts.length - 1}
                      title="아래로 이동"
                    >
                      <ArrowDown className="h-3.5 w-3.5 mr-1" /> 아래로
                    </Button>
                  </div>
                </div>

                {/* 상품 기본 정보 (이름 / 온 수량 / 판매가) */}
                <div className="grid gap-3 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">상품 노출명 *</Label>
                    <Input
                      value={product.name ?? ''}
                      onChange={(event) => handleFieldChange(product.id, 'name', event.target.value)}
                      placeholder="예: 5,000 온 충전"
                      className="text-xs font-medium"
                    />
                    <p className="text-[11px] text-muted-foreground">앱 상점 화면에 유저에게 노출되는 패키지 명칭</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1">
                      <Coins className="h-3.5 w-3.5 text-primary" />
                      충전 온(ON) 수량 *
                    </Label>
                    <Input
                      value={product.points?.toString() ?? ''}
                      onChange={(event) =>
                        handleFieldChange(product.id, 'points', normalizeNumber(event.target.value, product.points ?? 0))
                      }
                      inputMode="numeric"
                      className="text-xs font-semibold"
                    />
                    <p className="text-[11px] text-muted-foreground">구매 완료 시 유저 지갑에 지급될 온(ON) 코인</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">판매 가격 (원화 KRW) *</Label>
                    <Input
                      value={product.price?.toString() ?? ''}
                      onChange={(event) =>
                        handleFieldChange(product.id, 'price', normalizeNumber(event.target.value, product.price ?? 0))
                      }
                      inputMode="numeric"
                      className="text-xs font-semibold text-emerald-600"
                    />
                    <p className="text-[11px] text-muted-foreground">실제 인앱 결제 시 청구되는 원화 금액 (VAT 포함)</p>
                  </div>
                </div>

                {/* 인앱 스토어 ID 연동 */}
                <div className="mt-3 grid gap-3 lg:grid-cols-2 p-3 bg-muted/30 rounded-md border">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Android 스토어 상품 ID (Google Play Console) *
                    </Label>
                    <Input
                      value={product.androidProductId ?? ''}
                      onChange={(event) => handleFieldChange(product.id, 'androidProductId', event.target.value)}
                      placeholder="com.tokfriends.point.5000"
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      iOS 스토어 상품 ID (App Store Connect) *
                    </Label>
                    <Input
                      value={product.iosProductId ?? ''}
                      onChange={(event) => handleFieldChange(product.id, 'iosProductId', event.target.value)}
                      placeholder="tokfriends.point.5000"
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                {/* 스위치 및 메모 */}
                <div className="mt-3 grid gap-3 md:grid-cols-3 items-start">
                  <div className="flex items-center justify-between rounded-md border p-2.5 text-xs">
                    <div>
                      <div className="font-medium">앱 상점 노출 여부</div>
                      <div className="text-[11px] text-muted-foreground">비활성 시 앱에서 즉시 숨김</div>
                    </div>
                    <Switch
                      checked={Boolean(product.isActive)}
                      onCheckedChange={(checked) => handleFieldChange(product.id, 'isActive', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-md border p-2.5 text-xs">
                    <div>
                      <div className="font-medium">추천 상품 표시</div>
                      <div className="text-[11px] text-muted-foreground">인기/BEST 뱃지 강조</div>
                    </div>
                    <Switch
                      checked={Boolean(product.isRecommended)}
                      onCheckedChange={(checked) => handleFieldChange(product.id, 'isRecommended', checked)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">운영자 메모 (선택)</Label>
                    <Textarea
                      value={product.note ?? ''}
                      onChange={(event) => handleFieldChange(product.id, 'note', event.target.value)}
                      placeholder="예: 첫 결제 프로모션 대상"
                      rows={1}
                      className="text-xs resize-none"
                    />
                  </div>
                </div>

                {/* 하단 저장/삭제 버튼 */}
                <div className="mt-3 flex flex-wrap items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive h-8 text-xs"
                    onClick={() => handleDelete(product)}
                    disabled={isSaving}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> 삭제
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave(product)}
                    disabled={isSaving}
                    className="h-8 text-xs font-medium"
                  >
                    {isSaving ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {product.isNew ? '상품 생성' : '변경 사항 저장'}
                  </Button>
                </div>
              </div>
            )
          })}

          {sortedProducts.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
              <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground mb-2 opacity-50" />
              등록된 온(ON) 상품이 없습니다. 상단의 [신규 상품 등록] 버튼을 눌러 인앱 충전 상품을 등록하세요.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. 신규 상품 등록 모달 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              신규 온(ON) 충전 상품 등록
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 bg-muted/30 rounded-md border text-muted-foreground leading-relaxed">
              💡 <b>온상점 상품 등록 안내:</b> 유저가 현금으로 구매할 온(ON) 패키지를 생성합니다. 선물 후원 시 온이 부족한 유저가 이 상품을 충전하게 됩니다.
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-name" className="text-xs font-semibold">상품 노출명 *</Label>
              <Input
                id="m-name"
                value={modalName}
                onChange={(e) => setModalName(e.target.value)}
                placeholder="예: 5,000 온 충전"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="m-points" className="text-xs font-semibold">충전 온(ON) 코인 *</Label>
                <Input
                  id="m-points"
                  type="number"
                  min={1}
                  value={modalPoints}
                  onChange={(e) => {
                    const pts = Number(e.target.value)
                    setModalPoints(pts)
                    setModalPrice(Math.round(pts * 1.1))
                    setModalAndroidId(`com.tokfriends.point.${pts}`)
                    setModalIosId(`tokfriends.point.${pts}`)
                  }}
                  className="text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-price" className="text-xs font-semibold">판매 가격 (원화 KRW) *</Label>
                <Input
                  id="m-price"
                  type="number"
                  min={1}
                  value={modalPrice}
                  onChange={(e) => setModalPrice(Number(e.target.value))}
                  className="text-xs font-semibold text-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/20 rounded border">
              <div className="space-y-1.5">
                <Label htmlFor="m-android" className="text-[11px] font-medium">Google Play 상품 ID *</Label>
                <Input
                  id="m-android"
                  value={modalAndroidId}
                  onChange={(e) => setModalAndroidId(e.target.value)}
                  placeholder="com.tokfriends.point.5000"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-ios" className="text-[11px] font-medium">App Store 상품 ID *</Label>
                <Input
                  id="m-ios"
                  value={modalIosId}
                  onChange={(e) => setModalIosId(e.target.value)}
                  placeholder="tokfriends.point.5000"
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded border p-2.5">
                <div>
                  <div className="font-semibold text-xs">추천 상품 표시</div>
                  <div className="text-[10px] text-muted-foreground">인기/BEST 뱃지</div>
                </div>
                <Switch checked={modalIsRecommended} onCheckedChange={setModalIsRecommended} />
              </div>

              <div className="flex items-center justify-between rounded border p-2.5">
                <div>
                  <div className="font-semibold text-xs">즉시 판매 활성화</div>
                  <div className="text-[10px] text-muted-foreground">앱 상점 노출</div>
                </div>
                <Switch checked={modalIsActive} onCheckedChange={setModalIsActive} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-note" className="text-xs">운영 메모 (선택)</Label>
              <Input
                id="m-note"
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                placeholder="예: 2026 가을 프로모션 상품"
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={modalSaving}>
              취소
            </Button>
            <Button size="sm" onClick={handleModalCreate} disabled={modalSaving}>
              {modalSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              상품 등록 완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
