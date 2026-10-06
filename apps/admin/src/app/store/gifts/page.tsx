'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ChevronRight,
  Coins,
  Edit2,
  Film,
  Gift,
  Loader2,
  Plus,
  RefreshCcw,
  Sparkles,
  Trash2,
  Video,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import {
  createAdminGift,
  deleteAdminGift,
  getAdminGifts,
  getAdminGiftStats,
  updateAdminGift,
  type AdminGiftItem,
  type AdminGiftStats,
} from '@/lib/api'

export default function AdminGiftsPage() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [gifts, setGifts] = useState<AdminGiftItem[]>([])
  const [stats, setStats] = useState<AdminGiftStats>({
    totalGifts: 0,
    activeGifts: 0,
    totalTransactions: 0,
    totalPointsSent: 0,
  })

  // Modal State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AdminGiftItem | null>(null)
  const [saving, setSaving] = useState(false)

  // Form Fields
  const [formCode, setFormCode] = useState('')
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPricePoints, setFormPricePoints] = useState(100)
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('')
  const [formAnimationUrl, setFormAnimationUrl] = useState('')
  const [formAnimationType, setFormAnimationType] = useState('alpha_video')
  const [formCategory, setFormCategory] = useState('general')
  const [formSortOrder, setFormSortOrder] = useState(0)
  const [formChatEnabled, setFormChatEnabled] = useState(true)
  const [formLiveEnabled, setFormLiveEnabled] = useState(true)
  const [formIsNew, setFormIsNew] = useState(false)
  const [formIsActive, setFormIsActive] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [listRes, statsRes] = await Promise.all([
        getAdminGifts(),
        getAdminGiftStats(),
      ])
      setGifts(listRes)
      setStats(statsRes)
    } catch {
      toast({
        title: '선물 데이터 로드 실패',
        description: '서버에서 선물 목록을 가져오지 못했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const openCreateDialog = () => {
    setEditingItem(null)
    setFormCode(`gift-${Date.now().toString(36)}`)
    setFormName('')
    setFormDescription('')
    setFormPricePoints(100)
    setFormThumbnailUrl('')
    setFormAnimationUrl('')
    setFormAnimationType('alpha_video')
    setFormCategory('general')
    setFormSortOrder(gifts.length + 1)
    setFormChatEnabled(true)
    setFormLiveEnabled(true)
    setFormIsNew(true)
    setFormIsActive(true)
    setDialogOpen(true)
  }

  const openEditDialog = (item: AdminGiftItem) => {
    setEditingItem(item)
    setFormCode(item.code)
    setFormName(item.name)
    setFormDescription(item.description || '')
    setFormPricePoints(item.pricePoints)
    setFormThumbnailUrl(item.thumbnailUrl || '')
    setFormAnimationUrl(item.animationUrl || '')
    setFormAnimationType(item.animationType || 'none')
    setFormCategory(item.category || 'general')
    setFormSortOrder(item.sortOrder || 0)
    setFormChatEnabled(item.chatEnabled)
    setFormLiveEnabled(item.liveEnabled)
    setFormIsNew(item.isNew)
    setFormIsActive(item.isActive)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formName.trim() || !formCode.trim()) {
      toast({
        title: '입력 확인',
        description: '선물명과 고유 코드는 필수 입력 항목입니다.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const payload: Partial<AdminGiftItem> = {
        code: formCode.trim(),
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        pricePoints: Number(formPricePoints) || 100,
        thumbnailUrl: formThumbnailUrl.trim() || undefined,
        animationUrl: formAnimationUrl.trim() || undefined,
        animationType: formAnimationType,
        category: formCategory,
        sortOrder: Number(formSortOrder) || 0,
        chatEnabled: formChatEnabled,
        liveEnabled: formLiveEnabled,
        isNew: formIsNew,
        isActive: formIsActive,
      }

      if (editingItem) {
        await updateAdminGift(editingItem.id, payload)
        toast({ title: '수정 완료', description: `${formName} 선물이 성공적으로 수정되었습니다.` })
      } else {
        await createAdminGift(payload)
        toast({ title: '등록 완료', description: `${formName} 신규 선물이 등록되었습니다.` })
      }

      setDialogOpen(false)
      void loadData()
    } catch {
      toast({
        title: '저장 실패',
        description: '선물 정보 저장 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (item: AdminGiftItem) => {
    try {
      await updateAdminGift(item.id, { isActive: !item.isActive })
      setGifts((prev) =>
        prev.map((g) => (g.id === item.id ? { ...g, isActive: !g.isActive } : g))
      )
      toast({
        title: '상태 변경 완료',
        description: `${item.name}의 노출 상태가 ${!item.isActive ? '활성' : '비활성'}으로 변경되었습니다.`,
      })
    } catch {
      toast({
        title: '상태 변경 실패',
        description: '선물 상태 업데이트에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (item: AdminGiftItem) => {
    if (!window.confirm(`정말로 "${item.name}" 선물을 삭제하시겠습니까?\n이미 발생한 거래 기록에는 영향을 주지 않습니다.`)) {
      return
    }

    try {
      await deleteAdminGift(item.id)
      toast({ title: '삭제 완료', description: '선물이 삭제되었습니다.' })
      void loadData()
    } catch {
      toast({
        title: '삭제 실패',
        description: '선물 삭제에 실패했습니다. (이미 거래된 이력이 있는 경우 비활성화를 권장합니다.)',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Link href="/store" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> 상점 운영
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">선물 마스터 관리</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            선물 마스터 & 3D 이펙트 센터
          </h1>
          <p className="text-sm text-muted-foreground">
            채팅방과 라이브 방송에서 후원하는 선물 아이템, 온(ON) 가격 및 3D 투명 알파 비디오 이펙트를 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => void loadData()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            새로고침
          </Button>
          <Button size="sm" onClick={openCreateDialog} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            신규 선물 등록
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">전체 등록 선물</p>
                <p className="text-2xl font-bold mt-1">{stats.totalGifts}종</p>
                <p className="text-xs text-muted-foreground mt-0.5">활성 {stats.activeGifts}종</p>
              </div>
              <Gift className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">3D 알파 비디오 선물</p>
                <p className="text-2xl font-bold mt-1 text-purple-600">
                  {gifts.filter((g) => g.animationType === 'alpha_video').length}종
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">실시간 셰이더 합성</p>
              </div>
              <Film className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">누적 선물 후원 건수</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">
                  {stats.totalTransactions.toLocaleString()}건
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">채팅 및 라이브 합산</p>
              </div>
              <Sparkles className="h-8 w-8 text-emerald-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">누적 후원 온(ON)</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">
                  {stats.totalPointsSent.toLocaleString()} 온
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">창작자 후원 총액</p>
              </div>
              <Coins className="h-8 w-8 text-amber-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gift Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">선물 아이템 목록</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              정렬 순서(sortOrder)에 따라 모바일 선물 시트에 순차 노출됩니다.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">순서</TableHead>
                <TableHead className="w-16">아이콘</TableHead>
                <TableHead>선물 정보</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>가격</TableHead>
                <TableHead>이펙트 타입</TableHead>
                <TableHead>노출 채널</TableHead>
                <TableHead>노출 상태</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin mb-2" />
                    선물 목록을 불러오는 중입니다...
                  </TableCell>
                </TableRow>
              ) : gifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    등록된 선물이 없습니다. [신규 선물 등록] 버튼을 눌러 추가하세요.
                  </TableCell>
                </TableRow>
              ) : (
                gifts.map((gift) => (
                  <TableRow key={gift.id}>
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {gift.sortOrder}
                    </TableCell>
                    <TableCell>
                      {gift.thumbnailUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={gift.thumbnailUrl}
                          alt={gift.name}
                          className="h-10 w-10 rounded-lg object-cover border"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center border">
                          <Gift className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-sm flex items-center gap-1.5">
                        {gift.name}
                        {gift.isNew && <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-primary/10 text-primary">NEW</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">{gift.code}</div>
                      {gift.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                          {gift.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {gift.category === 'vip' ? 'VIP' : gift.category === 'special' ? '스페셜' : '일반'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-sm text-primary">
                      {gift.pricePoints.toLocaleString()} 온
                    </TableCell>
                    <TableCell>
                      {gift.animationType === 'alpha_video' ? (
                        <Badge className="bg-purple-600 text-white flex items-center gap-1 w-fit text-[11px]">
                          <Video className="h-3 w-3" /> 3D 알파 비디오
                        </Badge>
                      ) : gift.animationType === 'lottie' ? (
                        <Badge variant="secondary" className="text-[11px]">Lottie</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">기본 효과</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 text-xs">
                        {gift.chatEnabled && <Badge variant="outline" className="text-[10px]">채팅</Badge>}
                        {gift.liveEnabled && <Badge variant="outline" className="text-[10px] text-rose-500 border-rose-200">라이브</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={gift.isActive}
                          onCheckedChange={() => void handleToggleActive(gift)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {gift.isActive ? '노출 중' : '숨김'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(gift)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => void handleDelete(gift)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? `선물 수정: ${editingItem.name}` : '신규 선물 등록'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs">
                  고유 식별 코드 (영문/하이픈) *
                </Label>
                <Input
                  id="code"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="gift-dragon"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">
                  선물 이름 *
                </Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="골든 드래곤 (3D)"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs">
                선물 설명 (선택)
              </Label>
              <Input
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="화면 전체를 압도하는 3D 황금 드래곤 이펙트"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-xs">
                  가격 (온/ON) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  min={1}
                  value={formPricePoints}
                  onChange={(e) => setFormPricePoints(Number(e.target.value))}
                  className="text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs">
                  카테고리
                </Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger id="category" className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">일반 (General)</SelectItem>
                    <SelectItem value="special">스페셜 (Special)</SelectItem>
                    <SelectItem value="vip">VIP (High-End)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sortOrder" className="text-xs">
                  정렬 순서 (낮을수록 앞)
                </Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(Number(e.target.value))}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="thumbnailUrl" className="text-xs">
                썸네일/아이콘 이미지 URL
              </Label>
              <Input
                id="thumbnailUrl"
                value={formThumbnailUrl}
                onChange={(e) => setFormThumbnailUrl(e.target.value)}
                placeholder="https://.../thumbnail.png"
                className="font-mono text-xs"
              />
            </div>

            {/* 3D Animation Settings */}
            <div className="p-3 bg-muted/40 rounded-lg space-y-3 border">
              <div className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                <Video className="h-4 w-4 text-purple-600" />
                3D 알파 비디오 및 애니메이션 이펙트 설정
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="animType" className="text-xs">
                    이펙트 렌더러 타입
                  </Label>
                  <Select value={formAnimationType} onValueChange={setFormAnimationType}>
                    <SelectTrigger id="animType" className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alpha_video">3D 투명 알파 비디오 (Alpha MP4)</SelectItem>
                      <SelectItem value="lottie">Lottie JSON 벡터</SelectItem>
                      <SelectItem value="none">단순 아이콘 팝업 (기본)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="animUrl" className="text-xs">
                    비디오 리소스 URL (MP4)
                  </Label>
                  <Input
                    id="animUrl"
                    value={formAnimationUrl}
                    onChange={(e) => setFormAnimationUrl(e.target.value)}
                    placeholder="https://.../dragon_alpha.mp4"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                * Alpha MP4: 왼쪽 절반은 컬러(RGB), 오른쪽 절반은 알파 마스크(Grayscale)로 인코딩된 소스를 셰이더로 실시간 합성해 렌더링합니다.
              </p>
            </div>

            {/* Switches */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium">1:1 채팅방 노출</div>
                  <div className="text-[11px] text-muted-foreground">채팅 선물 시트에 표시</div>
                </div>
                <Switch checked={formChatEnabled} onCheckedChange={setFormChatEnabled} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium">라이브 방송 노출</div>
                  <div className="text-[11px] text-muted-foreground">라이브 후원 시트에 표시</div>
                </div>
                <Switch checked={formLiveEnabled} onCheckedChange={setFormLiveEnabled} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium">NEW 뱃지 표시</div>
                  <div className="text-[11px] text-muted-foreground">신규 선물 강조</div>
                </div>
                <Switch checked={formIsNew} onCheckedChange={setFormIsNew} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium">선물 즉시 활성화</div>
                  <div className="text-[11px] text-muted-foreground">앱 전역 판매 활성</div>
                </div>
                <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingItem ? '수정 완료' : '선물 등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
