'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Loader2, Plus, RefreshCcw, Save, ShieldCheck, Trash2 } from 'lucide-react'

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
    name: '1,000P 충전',
    points: 1000,
    price: 1900,
    isRecommended: false,
    isActive: true,
    androidProductId: 'com.tokfriends.point.1000',
    iosProductId: 'tokfriends.point.1000',
    order: 1,
  },
  {
    id: 'point-2',
    name: '5,000P 충전',
    points: 5000,
    price: 7900,
    isRecommended: true,
    isActive: true,
    androidProductId: 'com.tokfriends.point.5000',
    iosProductId: 'tokfriends.point.5000',
    order: 2,
  },
  {
    id: 'point-3',
    name: '10,000P 충전',
    points: 10000,
    price: 14900,
    isRecommended: false,
    isActive: false,
    androidProductId: 'com.tokfriends.point.10000',
    iosProductId: 'tokfriends.point.10000',
    order: 3,
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

export default function PointProductsPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<EditablePointProduct[]>(sortProducts(FALLBACK_PRODUCTS))
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [orderDirty, setOrderDirty] = useState(false)
  const guideline =
    'App Store Connect / Google Play Console 에 등록된 상품 ID와 가격이 정확히 일치하는지 반드시 확인하세요.'

  const sortedProducts = useMemo(() => sortProducts(products), [products])

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
    } catch (error) {
      setProducts(sortProducts(FALLBACK_PRODUCTS))
      toast({
        title: '포인트 상품 불러오기 실패',
        description: '네트워크 오류로 기본 상품 목록을 표시합니다.',
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
        points: 0,
        price: 0,
        isRecommended: false,
        isActive: true,
        androidProductId: '',
        iosProductId: '',
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
    if (!window.confirm(`${product.name ?? '상품'}을 삭제하시겠습니까?`)) return
    setProductSaving(product.id, true)
    try {
      await deletePointProduct(product.id)
      setProducts((prev) => prev.filter((item) => item.id !== product.id))
      toast({ title: '삭제 완료', description: '포인트 상품이 삭제되었습니다.' })
    } catch (error) {
      toast({ title: '삭제 실패', description: '상품 삭제 중 오류가 발생했습니다.', variant: 'destructive' })
    } finally {
      setProductSaving(product.id, false)
    }
  }

  async function handleSave(product: EditablePointProduct) {
    if (!product.name?.trim()) {
      toast({ title: '상품명 필요', description: '노출 이름을 입력하세요.', variant: 'destructive' })
      return
    }
    if (!product.androidProductId?.trim() || !product.iosProductId?.trim()) {
      toast({
        title: '상품 ID 필요',
        description: 'Android/iOS 상품 ID를 모두 입력해야 저장할 수 있습니다.',
        variant: 'destructive',
      })
      return
    }
    if (!product.points || product.points <= 0) {
      toast({ title: '포인트 값 확인', description: '포인트 양을 1 이상으로 설정하세요.', variant: 'destructive' })
      return
    }
    if (!product.price || product.price <= 0) {
      toast({ title: '가격 확인', description: '판매가를 1원 이상으로 입력하세요.', variant: 'destructive' })
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
      note: product.note ?? (product as any).note ?? undefined,
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
      toast({ title: '저장 완료', description: `${product.name} 상품이 업데이트되었습니다.` })
      setOrderDirty(true)
    } catch (error) {
      toast({ title: '저장 실패', description: '포인트 상품 저장 중 오류가 발생했습니다.', variant: 'destructive' })
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
      toast({ title: '순서 저장 완료', description: '노출 순서를 업데이트했습니다.' })
      setProducts((prev) => sortProducts(prev).map((item, index) => ({ ...item, order: index + 1 })))
      setOrderDirty(false)
    } catch (error) {
      toast({ title: '순서 저장 실패', description: '순서를 저장하는 중 오류가 발생했습니다.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">포인트 상품 관리</h1>
        <p className="text-sm text-muted-foreground">
          노출 순서를 조정하고, 추천 여부 및 판매가를 관리해 앱 내 결제 경험을 개선하세요. 저장 시 /store/point-products 데이터 소스와 동기화됩니다.
        </p>
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
          <p className="font-semibold text-amber-900">상품 ID / 가격 검증 안내</p>
          <p>{guideline}</p>
        </div>
      </header>

      <section className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={addNewProduct}>
          <Plus className="mr-2 h-4 w-4" /> 상품 추가
        </Button>
        <Button size="sm" variant="outline" onClick={loadProducts} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
          새로고침
        </Button>
        <Button size="sm" variant={orderDirty ? 'default' : 'outline'} onClick={handleSyncOrder}>
          <Save className="mr-2 h-4 w-4" /> 순서 저장
        </Button>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>상품 목록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedProducts.map((product, index) => {
            const isSaving = Boolean(saving[product.id])
            return (
              <div key={product.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>#{product.order ?? index + 1}</span>
                    {product.isRecommended && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">추천</span>}
                    {product.isNew && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">신규</span>}
                    {product.isDirty && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">미저장</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleReorder(product.id, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleReorder(product.id, 'down')}
                      disabled={index === sortedProducts.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label>노출 이름</Label>
                    <Input
                      value={product.name ?? ''}
                      onChange={(event) => handleFieldChange(product.id, 'name', event.target.value)}
                      placeholder="예: 5,000P 충전"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>포인트 양</Label>
                    <Input
                      value={product.points?.toString() ?? ''}
                      onChange={(event) =>
                        handleFieldChange(product.id, 'points', normalizeNumber(event.target.value, product.points ?? 0))
                      }
                      inputMode="numeric"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>판매가 (원)</Label>
                    <Input
                      value={product.price?.toString() ?? ''}
                      onChange={(event) =>
                        handleFieldChange(product.id, 'price', normalizeNumber(event.target.value, product.price ?? 0))
                      }
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Android 스토어 상품 ID</Label>
                    <Input
                      value={product.androidProductId ?? ''}
                      onChange={(event) => handleFieldChange(product.id, 'androidProductId', event.target.value)}
                      placeholder="com.example.app.point1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>iOS 스토어 상품 ID</Label>
                    <Input
                      value={product.iosProductId ?? ''}
                      onChange={(event) => handleFieldChange(product.id, 'iosProductId', event.target.value)}
                      placeholder="example.point.1000"
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span>노출 여부</span>
                    <Switch
                      checked={Boolean(product.isActive)}
                      onCheckedChange={(checked) => handleFieldChange(product.id, 'isActive', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span>추천 상품 표시</span>
                    <Switch
                      checked={Boolean(product.isRecommended)}
                      onCheckedChange={(checked) => handleFieldChange(product.id, 'isRecommended', checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>메모 (선택)</Label>
                    <Textarea
                      value={product.note ?? ''}
                      onChange={(event) => handleFieldChange(product.id, 'note', event.target.value)}
                      placeholder="예: 주말 프로모션 대상"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button onClick={() => handleSave(product)} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    {product.isNew ? '상품 생성' : '변경 사항 저장'}
                  </Button>
                  <Button variant="outline" onClick={() => handleDelete(product)} disabled={isSaving}>
                    <Trash2 className="mr-2 h-4 w-4" /> 삭제
                  </Button>
                </div>
              </div>
            )
          })}
          {sortedProducts.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">등록된 포인트 상품이 없습니다. 상품을 추가하세요.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
