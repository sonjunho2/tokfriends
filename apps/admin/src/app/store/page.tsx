'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
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
    name: '5,000 온 충전',
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
      if (remote.length > 0) {
        setProducts(sortProducts(remote))
      } else {
        setProducts(sortProducts(FALLBACK_PRODUCTS))
      }
    } catch {
      setProducts(sortProducts(FALLBACK_PRODUCTS))
      toast({
        title: '온(ON) 상품 불러오기 실패',
        description: '서버 연결에 실패하여 기본 캐시 상품 목록을 표시합니다.',
        variant: 'destructive',
      })
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

  function addNewProduct() {
    const tempId = `temp-${Date.now().toString(36)}`
    const nextOrder = (products[products.length - 1]?.order ?? products.length) + 1
    setProducts((prev) => [
      ...prev,
      {
        id: tempId,
        name: '',
        points: 1000,
        price: 1100,
        isRecommended: false,
        isActive: true,
        androidProductId: 'com.tokfriends.point.',
        iosProductId: 'tokfriends.point.',
        order: nextOrder,
        isNew: true,
        isDirty: true,
      },
    ])
    setOrderDirty(true)
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
      toast({ title: '삭제 실패', description: '상품 삭제 중 오류가 발생했습니다.', variant: 'destructive' })
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
      toast({ title: '저장 실패', description: '온(ON) 상품 저장 중 오류가 발생했습니다.', variant: 'destructive' })
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
            온(ON) 상점 상품 관리
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            사용자가 모바일 앱에서 현금(KRW)으로 충전하는 인앱 온(ON) 패키지 상품, 스토어 상품 ID, 판매 가격 및 노출 순서를 관리합니다.
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
          <Button size="sm" onClick={addNewProduct} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            상품 추가
          </Button>
        </div>
      </div>

      {/* 2. 신입 운영자를 위한 온(ON) 상점 실무 가이드 3단계 (아코디언) */}
      <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
        <CardHeader
          className="py-3 px-4 flex flex-row items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() => setGuideExpanded((prev) => !prev)}
        >
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Info className="h-4 w-4" />
            💡 신입 운영자를 위한 온(ON) 상점 상품 관리 3단계 실무 가이드
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
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">1</span>
                  스토어 상품 ID 일치 (필수)
                </div>
                <p className="text-[11px] text-foreground font-medium">
                  Google Play 및 Apple Store IAP 매핑
                </p>
                <p className="text-[11px] text-muted-foreground">
                  구글 플레이 콘솔 / 앱스토어 커넥트에 등록된 인앱 상품 ID(예: <code className="font-mono bg-muted px-1 rounded">com.tokfriends.point.5000</code>)와 100% 일치해야 실제 모바일 결제창이 작동합니다.
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-primary/10 shadow-sm space-y-1">
                <div className="font-semibold text-primary flex items-center gap-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">2</span>
                  가격 책정 및 추천 상품 지정
                </div>
                <p className="text-[11px] text-foreground font-medium">
                  기본 부가세(10%) 및 보너스 설계
                </p>
                <p className="text-[11px] text-muted-foreground">
                  기본 1 온 ≈ 1.1원(부가세 포함) 기준입니다. 가장 인기가 많거나 구매를 유도할 패키지에 <b>[추천 상품]</b> 스위치를 켜면 앱 상점에서 강조 뱃지로 돋보입니다.
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-primary/10 shadow-sm space-y-1">
                <div className="font-semibold text-primary flex items-center gap-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">3</span>
                  노출 순서 및 안전한 판매 관리
                </div>
                <p className="text-[11px] text-foreground font-medium">
                  순서 변경 후 저장 필수 &amp; 숨김 처리
                </p>
                <p className="text-[11px] text-muted-foreground">
                  ▲/▼ 버튼으로 순서를 변경한 뒤 반드시 <b>[순서 저장]</b>을 눌러야 앱에 반영됩니다. 판매를 중단할 상품은 삭제 대신 <b>[노출 여부]</b> 스위치만 끄면 안전합니다.
                </p>
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5 text-primary" />
              <span>선물 아이템(3D 이펙트) 설정은 좌측 사이드바의 <b>[선물 마스터 관리]</b> 전용 메뉴에서 별도로 운영됩니다.</span>
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
                <p className="text-xs text-muted-foreground mt-0.5">인앱 결제 패키지</p>
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
              등록된 온(ON) 상품이 없습니다. 상단의 [상품 추가] 버튼을 눌러 인앱 충전 상품을 등록하세요.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
