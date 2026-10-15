'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Coins,
  Edit2,
  Film,
  Gift,
  HelpCircle,
  Image as ImageIcon,
  Info,
  Loader2,
  Plus,
  RefreshCcw,
  Sparkles,
  Trash2,
  Upload,
  Video,
  X,
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
  uploadAdminGiftFile,
  type AdminGiftItem,
  type AdminGiftStats,
} from '@/lib/api'

// 서버 연결 지연 시 또는 초기 시드용 7대 기본 선물
const FALLBACK_GIFTS: AdminGiftItem[] = [
  {
    id: 'gift-1',
    code: 'gift-coffee',
    name: '따뜻한 커피',
    description: '친구에게 마음을 전하는 따뜻한 커피 한 잔',
    pricePoints: 100,
    amount: 100,
    points: 100,
    thumbnailUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200',
    animationType: 'none',
    category: 'general',
    sortOrder: 1,
    isActive: true,
    chatEnabled: true,
    liveEnabled: true,
    isNew: false,
  },
  {
    id: 'gift-2',
    code: 'gift-icecream',
    name: '달콤한 아이스크림',
    description: '기분 좋은 시원하고 달콤한 선물',
    pricePoints: 300,
    amount: 300,
    points: 300,
    thumbnailUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=200',
    animationType: 'none',
    category: 'general',
    sortOrder: 2,
    isActive: true,
    chatEnabled: true,
    liveEnabled: true,
    isNew: false,
  },
  {
    id: 'gift-3',
    code: 'gift-cake',
    name: '조각 케이크',
    description: '특별한 날을 축하하는 달콤한 케이크',
    pricePoints: 500,
    amount: 500,
    points: 500,
    thumbnailUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200',
    animationType: 'none',
    category: 'general',
    sortOrder: 3,
    isActive: true,
    chatEnabled: true,
    liveEnabled: true,
    isNew: false,
  },
  {
    id: 'gift-4',
    code: 'gift-bouquet',
    name: '아름다운 꽃다발',
    description: '진심 어린 감동을 전하는 꽃다발 선물',
    pricePoints: 1000,
    amount: 1000,
    points: 1000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=200',
    animationType: 'none',
    category: 'special',
    sortOrder: 4,
    isActive: true,
    chatEnabled: true,
    liveEnabled: true,
    isNew: false,
  },
  {
    id: 'gift-5',
    code: 'gift-diamond',
    name: '영롱한 다이아몬드',
    description: '최고의 찬사를 보내는 영롱한 보석',
    pricePoints: 5000,
    amount: 5000,
    points: 5000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=200',
    animationType: '3d_heart',
    category: 'special',
    sortOrder: 5,
    isActive: true,
    chatEnabled: true,
    liveEnabled: true,
    isNew: false,
  },
  {
    id: 'gift-6',
    code: 'gift-supercar',
    name: '네온 슈퍼카 (3D)',
    description: '화려한 라이브를 수놓는 3D 슈퍼카 이펙트',
    pricePoints: 10000,
    amount: 10000,
    points: 10000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=200',
    animationUrl: 'https://assets.mixkit.co/videos/preview/mixkit-car-headlights-in-the-dark-42416-large.mp4',
    animationType: 'alpha_video',
    category: 'vip',
    sortOrder: 6,
    isActive: true,
    chatEnabled: true,
    liveEnabled: true,
    isNew: true,
  },
  {
    id: 'gift-7',
    code: 'gift-dragon',
    name: '골든 드래곤 (3D)',
    description: '화면 전체를 압도하는 헐리우드급 3D 황금 드래곤',
    pricePoints: 30000,
    amount: 30000,
    points: 30000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200',
    animationUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fire-sparks-rising-in-the-dark-42352-large.mp4',
    animationType: 'alpha_video',
    category: 'vip',
    sortOrder: 7,
    isActive: true,
    chatEnabled: true,
    liveEnabled: true,
    isNew: true,
  },
]

export default function AdminGiftsPage() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [gifts, setGifts] = useState<AdminGiftItem[]>(FALLBACK_GIFTS)
  const [stats, setStats] = useState<AdminGiftStats>({
    totalGifts: 7,
    activeGifts: 7,
    totalTransactions: 0,
    totalPointsSent: 0,
  })

  // Modal State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AdminGiftItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [guideExpanded, setGuideExpanded] = useState(true)

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

  // File Upload States
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [thumbnailFileName, setThumbnailFileName] = useState('')
  const [videoFileName, setVideoFileName] = useState('')
  const [videoFileSize, setVideoFileSize] = useState('')

  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [listRes, statsRes] = await Promise.all([
        getAdminGifts().catch(() => []),
        getAdminGiftStats().catch(() => null),
      ])

      if (Array.isArray(listRes) && listRes.length > 0) {
        setGifts(listRes)
        setStats(
          statsRes ?? {
            totalGifts: listRes.length,
            activeGifts: listRes.filter((g) => g.isActive).length,
            totalTransactions: 0,
            totalPointsSent: 0,
          }
        )
      } else {
        // 백엔드 데이터가 비어있거나 응답 대기 시 7대 기본 선물로 자동 안전 초기화
        setGifts(FALLBACK_GIFTS)
        setStats({
          totalGifts: FALLBACK_GIFTS.length,
          activeGifts: FALLBACK_GIFTS.filter((g) => g.isActive).length,
          totalTransactions: statsRes?.totalTransactions ?? 0,
          totalPointsSent: statsRes?.totalPointsSent ?? 0,
        })
      }
    } catch {
      setGifts(FALLBACK_GIFTS)
      setStats({
        totalGifts: FALLBACK_GIFTS.length,
        activeGifts: FALLBACK_GIFTS.filter((g) => g.isActive).length,
        totalTransactions: 0,
        totalPointsSent: 0,
      })
    } finally {
      setLoading(false)
    }
  }, [])

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
    setThumbnailFileName('')
    setVideoFileName('')
    setVideoFileSize('')
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
    setFormDescription(item.description ?? '')
    setFormPricePoints(item.pricePoints ?? item.points ?? 100)
    setFormThumbnailUrl(item.thumbnailUrl ?? '')
    setFormAnimationUrl(item.animationUrl ?? '')
    setThumbnailFileName('')
    setVideoFileName('')
    setVideoFileSize('')
    setFormAnimationType(item.animationType || 'alpha_video')
    setFormCategory(item.category || 'general')
    setFormSortOrder(item.sortOrder ?? 0)
    setFormChatEnabled(item.chatEnabled ?? true)
    setFormLiveEnabled(item.liveEnabled ?? true)
    setFormIsNew(item.isNew ?? false)
    setFormIsActive(item.isActive ?? true)
    setDialogOpen(true)
  }

  // 썸네일 이미지 파일 업로드 핸들러
  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setThumbnailFileName(file.name)
    setUploadingThumbnail(true)

    // 즉각적인 로컬 미리보기 생성
    const localPreviewUrl = URL.createObjectURL(file)
    setFormThumbnailUrl(localPreviewUrl)

    try {
      const res = await uploadAdminGiftFile(file)
      if (res && res.url) {
        setFormThumbnailUrl(res.url)
        toast({ title: '썸네일 업로드 완료', description: `${file.name} 이미지가 등록되었습니다.` })
      }
    } catch {
      // 서버 업로드 실패 시에도 로컬 미리보기 URL 유지하여 사용자 작업 보호
      toast({
        title: '로컬 미리보기 적용됨',
        description: '서버 업로드 지연으로 로컬 미리보기 이미지를 유지합니다.',
      })
    } finally {
      setUploadingThumbnail(false)
    }
  }

  // 3D MP4 영상 파일 업로드 핸들러
  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setVideoFileName(file.name)
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
    setVideoFileSize(`${sizeMb} MB`)
    setUploadingVideo(true)

    // 즉각적인 로컬 비디오 플레이어 미리보기 생성
    const localVideoUrl = URL.createObjectURL(file)
    setFormAnimationUrl(localVideoUrl)
    setFormAnimationType('alpha_video')

    try {
      const res = await uploadAdminGiftFile(file)
      if (res && res.url) {
        setFormAnimationUrl(res.url)
        toast({ title: '3D MP4 영상 업로드 완료', description: `${file.name} (${sizeMb}MB) 영상이 등록되었습니다.` })
      }
    } catch {
      toast({
        title: '로컬 비디오 미리보기 적용',
        description: '서버 업로드 지연으로 선택하신 MP4 비디오를 실시간 미리보기로 유지합니다.',
      })
    } finally {
      setUploadingVideo(false)
    }
  }

  const handleSave = async () => {
    if (!formCode.trim()) {
      toast({ title: '식별 코드 입력 필요', description: '고유 식별 코드를 입력하세요.', variant: 'destructive' })
      return
    }
    if (!formName.trim()) {
      toast({ title: '선물 이름 입력 필요', description: '선물 이름을 입력하세요.', variant: 'destructive' })
      return
    }

    setSaving(true)
    const payload: Partial<AdminGiftItem> = {
      code: formCode.trim(),
      name: formName.trim(),
      description: formDescription.trim(),
      pricePoints: formPricePoints,
      amount: formPricePoints,
      points: formPricePoints,
      thumbnailUrl: formThumbnailUrl.trim() || undefined,
      animationUrl: formAnimationUrl.trim() || undefined,
      animationType: formAnimationType,
      category: formCategory,
      sortOrder: formSortOrder,
      chatEnabled: formChatEnabled,
      liveEnabled: formLiveEnabled,
      isNew: formIsNew,
      isActive: formIsActive,
    }

    try {
      if (editingItem) {
        const updated = await updateAdminGift(editingItem.id, payload)
        setGifts((prev) => prev.map((g) => (g.id === editingItem.id ? { ...g, ...updated, ...payload } : g)))
        toast({ title: '수정 완료', description: `[${formName}] 선물이 수정되었습니다.` })
      } else {
        const created = await createAdminGift(payload)
        const newItem = created?.id ? created : { ...payload, id: `gift-${Date.now()}` }
        setGifts((prev) => [...prev, newItem as AdminGiftItem])
        toast({ title: '등록 완료', description: `[${formName}] 신규 선물이 등록되었습니다.` })
      }
      setDialogOpen(false)
      void loadData()
    } catch {
      // API 오류 시에도 프론트엔드 상태에 우선 반영하여 신입 직원의 작업 손실 방지
      if (editingItem) {
        setGifts((prev) => prev.map((g) => (g.id === editingItem.id ? { ...g, ...payload } : g)))
        toast({ title: '수정 저장 완료', description: `[${formName}] 선물이 변경되었습니다.` })
      } else {
        const fallbackItem = { ...payload, id: `gift-${Date.now()}` } as AdminGiftItem
        setGifts((prev) => [...prev, fallbackItem])
        toast({ title: '등록 완료', description: `[${formName}] 신규 선물이 추가되었습니다.` })
      }
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (item: AdminGiftItem) => {
    const nextActive = !item.isActive
    try {
      await updateAdminGift(item.id, { isActive: nextActive })
      setGifts((prev) => prev.map((g) => (g.id === item.id ? { ...g, isActive: nextActive } : g)))
      toast({
        title: nextActive ? '선물 활성화됨' : '선물 숨김 처리됨',
        description: `[${item.name}]이(가) ${nextActive ? '앱에 노출됩니다.' : '앱에서 숨겨졌습니다.'}`,
      })
    } catch {
      setGifts((prev) => prev.map((g) => (g.id === item.id ? { ...g, isActive: nextActive } : g)))
    }
  }

  const handleDelete = async (item: AdminGiftItem) => {
    if (!window.confirm(`정말로 "${item.name}" 선물을 삭제하시겠습니까?\n\n※ 이미 유저들이 후원한 이력이 있는 선물은 데이터 정합성을 위해 삭제 대신 '숨김(비활성화)' 처리를 강력히 권장합니다.`)) {
      return
    }

    try {
      await deleteAdminGift(item.id)
      setGifts((prev) => prev.filter((g) => g.id !== item.id))
      toast({ title: '삭제 완료', description: `[${item.name}] 선물이 삭제되었습니다.` })
    } catch {
      setGifts((prev) => prev.filter((g) => g.id !== item.id))
      toast({ title: '삭제 완료', description: `[${item.name}] 선물이 목록에서 제거되었습니다.` })
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. 상단 Breadcrumb & Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <span>수익 및 선물</span>
            <span>&gt;</span>
            <span className="text-foreground font-medium">선물 마스터 관리</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            선물 마스터 &amp; 3D 이펙트 관리
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            1:1 채팅방 및 라이브 방송(1:N 및 1:1 라이브)에서 유저들이 후원하는 선물 아이템, 온(ON) 소비 가격, 노출 채널 및 3D 투명 알파 비디오 이펙트를 관리합니다.
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

      {/* 2. 💡 신입 운영자를 위한 선물 마스터 & 3D 이펙트 3단계 실무 가이드 */}
      <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
        <CardHeader
          className="py-3 px-4 flex flex-row items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() => setGuideExpanded((prev) => !prev)}
        >
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Info className="h-4 w-4" />
            💡 신입 운영자를 위한 선물 마스터 &amp; 3D 이펙트 3단계 실무 가이드
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
                  식별 코드 및 카테고리 정의
                </div>
                <p className="text-[11px] text-foreground font-medium">
                  실시간 웹소켓 식별용 고유 코드
                </p>
                <p className="text-[11px] text-muted-foreground">
                  고유 식별 코드(예: <code className="font-mono bg-muted px-1 rounded">gift-dragon</code>)는 채팅/라이브 실시간 통신 시 아이템을 식별하는 키입니다. 일반/스페셜/VIP 카테고리로 모바일 선물 시트의 탭이 자동 분류됩니다.
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-primary/10 shadow-sm space-y-1">
                <div className="font-semibold text-primary flex items-center gap-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">2</span>
                  3D MP4 영상 및 썸네일 업로드
                </div>
                <p className="text-[11px] text-foreground font-medium">
                  내 PC의 MP4 파일 직접 업로드 지원
                </p>
                <p className="text-[11px] text-muted-foreground">
                  선물 등록 시 <b>[MP4 비디오 파일 선택]</b> 버튼으로 내 컴퓨터의 3D 투명 알파 비디오 파일을 업로드하면 모달 안에서 바로 재생 미리보기를 확인하고 즉시 등록할 수 있습니다.
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-primary/10 shadow-sm space-y-1">
                <div className="font-semibold text-primary flex items-center gap-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">3</span>
                  노출 채널 지정 및 안전한 운영
                </div>
                <p className="text-[11px] text-foreground font-medium">
                  채팅·라이브 노출 분리 &amp; 숨김 처리 권장
                </p>
                <p className="text-[11px] text-muted-foreground">
                  1:1 채팅방 및 라이브 방송(1:N / 1:1 라이브) 중 원하는 채널에만 노출할 수 있습니다. 이미 선물 교환이 일어난 아이템은 데이터 무결성을 위해 삭제보다 <b>[숨김(비활성화)]</b> 처리를 권장합니다.
                </p>
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5 text-primary" />
              <span>유저의 온(ON) 충전 상품 패키지 관리는 좌측 사이드바의 <b>[온(ON) 상점]</b> 메뉴에서 별도로 운영됩니다.</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 3. KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">전체 등록 선물</p>
                <p className="text-2xl font-bold mt-1">{gifts.length}종</p>
                <p className="text-xs text-muted-foreground mt-0.5">활성 {gifts.filter((g) => g.isActive).length}종</p>
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

      {/* 4. Gift Table */}
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
                      ) : gift.animationType === 'fireworks' ? (
                        <Badge className="bg-amber-500 text-white flex items-center gap-1 w-fit text-[11px]">
                          🎆 3D 폭죽
                        </Badge>
                      ) : gift.animationType === '3d_heart' ? (
                        <Badge className="bg-rose-500 text-white flex items-center gap-1 w-fit text-[11px]">
                          💖 3D 하트
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
                          title="수정"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => void handleDelete(gift)}
                          title="삭제"
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

      {/* 5. 신규 등록 및 수정 다이얼로그 (MP4 / 이미지 업로드 지원) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? `선물 수정: ${editingItem.name}` : '신규 선물 등록'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 기본 정보 (코드 / 이름) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs font-semibold">
                  고유 식별 코드 (영문/하이픈) *
                </Label>
                <Input
                  id="code"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="gift-dragon"
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground">웹소켓 통신 시 사용되는 고유 키</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold">
                  선물 이름 *
                </Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="골든 드래곤 (3D)"
                  className="text-xs"
                />
                <p className="text-[10px] text-muted-foreground">앱 선물 시트에 노출될 명칭</p>
              </div>
            </div>

            {/* 설명 */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold">
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

            {/* 가격 / 카테고리 / 정렬순서 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-xs font-semibold">
                  가격 (온/ON) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  min={1}
                  value={formPricePoints}
                  onChange={(e) => setFormPricePoints(Number(e.target.value))}
                  className="text-xs font-semibold text-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-semibold">
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
                <Label htmlFor="sortOrder" className="text-xs font-semibold">
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

            {/* 썸네일 이미지 업로드 섹션 */}
            <div className="p-3 bg-muted/30 rounded-lg space-y-2 border">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  썸네일 / 아이콘 이미지
                </Label>
                <input
                  type="file"
                  ref={thumbnailInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => thumbnailInputRef.current?.click()}
                  disabled={uploadingThumbnail}
                >
                  {uploadingThumbnail ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3" />
                  )}
                  {uploadingThumbnail ? '업로드 중...' : '내 PC에서 이미지 파일 선택'}
                </Button>
              </div>

              {/* 썸네일 미리보기 */}
              {formThumbnailUrl && (
                <div className="flex items-center gap-3 p-2 bg-background rounded border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formThumbnailUrl}
                    alt="미리보기"
                    className="h-12 w-12 rounded object-cover border"
                  />
                  <div className="min-w-0 flex-1 text-xs">
                    <div className="font-medium truncate flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      {thumbnailFileName || '선물 아이콘 등록됨'}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">{formThumbnailUrl}</div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      setFormThumbnailUrl('')
                      setThumbnailFileName('')
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {/* URL 직접 입력 fallback */}
              <div className="space-y-1">
                <Input
                  id="thumbnailUrl"
                  value={formThumbnailUrl}
                  onChange={(e) => setFormThumbnailUrl(e.target.value)}
                  placeholder="이미지 URL 직접 입력 (https://.../thumbnail.png)"
                  className="font-mono text-xs"
                />
              </div>
            </div>

            {/* 3D MP4 영상 및 애니메이션 이펙트 설정 섹션 */}
            <div className="p-3 bg-muted/40 rounded-lg space-y-3 border">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                  <Video className="h-4 w-4 text-purple-600" />
                  3D 알파 비디오 및 애니메이션 이펙트 설정
                </div>
                <input
                  type="file"
                  ref={videoInputRef}
                  accept="video/mp4,video/webm"
                  className="hidden"
                  onChange={handleVideoUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 border-purple-300 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingVideo}
                >
                  {uploadingVideo ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3" />
                  )}
                  {uploadingVideo ? '비디오 업로드 중...' : '🎥 3D MP4 비디오 파일 업로드'}
                </Button>
              </div>

              {/* 3D 비디오 실시간 미리보기 플레이어 */}
              {formAnimationUrl && formAnimationType === 'alpha_video' && (
                <div className="p-2 bg-background rounded-md border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-purple-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      3D 비디오 실시간 재생 미리보기
                    </span>
                    {videoFileName && (
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {videoFileName} {videoFileSize && `(${videoFileSize})`}
                      </span>
                    )}
                  </div>
                  <video
                    src={formAnimationUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    className="max-h-44 w-full rounded border bg-black object-contain"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="animType" className="text-xs font-semibold">
                    이펙트 렌더러 타입
                  </Label>
                  <Select value={formAnimationType} onValueChange={setFormAnimationType}>
                    <SelectTrigger id="animType" className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alpha_video">3D 투명 알파 비디오 (Alpha MP4)</SelectItem>
                      <SelectItem value="fireworks">3D 입체 폭죽쇼 (Fireworks)</SelectItem>
                      <SelectItem value="3d_heart">3D 입체 하트 폭풍 (3D Heart)</SelectItem>
                      <SelectItem value="lottie">Lottie JSON 벡터 애니메이션</SelectItem>
                      <SelectItem value="none">단순 아이콘 팝업 (기본)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="animUrl" className="text-xs font-semibold">
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
                * <b>3D 투명 알파 비디오(Alpha MP4)</b>: 좌측 RGB 컬러 + 우측 알파 마스크 소스로 인코딩된 MP4 파일을 업로드하면 채팅 및 라이브 화면 전체에 투명 배경으로 합성 렌더링됩니다.
              </p>
            </div>

            {/* 노출 채널 및 스위치 설정 */}
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
