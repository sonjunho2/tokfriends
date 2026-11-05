'use client'

import React, { useEffect, useState } from 'react'
import {
  Store,
  ShieldCheck,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Eye,
  Sliders,
  AlertTriangle,
  Building2,
  FileCheck2,
  FileX2,
  Radio,
  Video,
  Sparkles,
  UserCheck,
  UserX,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/lib/api'

export interface CreatorAppItem {
  id: string
  userId: string
  channelName: string
  category: string
  introduction: string
  socialLinks?: string
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'
  commissionRate: number
  appliedAt: string
}

interface MerchantItem {
  id: string
  userId: string
  businessName: string
  businessNumber: string
  representative: string
  onlineOrderNumber?: string
  businessCertUrl?: string
  onlineOrderUrl?: string
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  feeRate: number
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  createdAt: string
  updatedAt?: string
  productCount?: number
}

const FALLBACK_MERCHANTS: MerchantItem[] = [
  {
    id: 'mer-01',
    userId: 'u-mocco-jeju',
    businessName: '모꼬 제주직송 영농조합',
    businessNumber: '616-81-99881',
    representative: '고원석',
    onlineOrderNumber: '2026-제주애월-0142호',
    businessCertUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
    onlineOrderUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600',
    status: 'APPROVED',
    feeRate: 8.5,
    bankName: '농협은행',
    accountNumber: '302-0921-8841-11',
    accountHolder: '모꼬 제주직송 영농조합',
    createdAt: '2026-10-15 11:20',
    productCount: 14,
  },
  {
    id: 'mer-02',
    userId: 'u-seller-02',
    businessName: '안동 참마 & 한우 프라임',
    businessNumber: '508-85-12345',
    representative: '김도훈',
    onlineOrderNumber: '2026-경북안동-0089호',
    businessCertUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
    onlineOrderUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600',
    status: 'PENDING_REVIEW',
    feeRate: 10.0,
    bankName: '신한은행',
    accountNumber: '110-384-991204',
    accountHolder: '안동 참마 & 한우',
    createdAt: '2026-11-04 14:10',
    productCount: 8,
  },
  {
    id: 'mer-03',
    userId: 'u-seller-03',
    businessName: '디지털라이프 케어솔루션',
    businessNumber: '214-88-77610',
    representative: '박서현',
    onlineOrderNumber: '2026-서울강남-0311호',
    businessCertUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
    onlineOrderUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600',
    status: 'APPROVED',
    feeRate: 11.0,
    bankName: '국민은행',
    accountNumber: '841501-04-129388',
    accountHolder: '디지털라이프 케어솔루션',
    createdAt: '2026-10-22 09:30',
    productCount: 22,
  },
  {
    id: 'mer-04',
    userId: 'u-seller-04',
    businessName: '태안 보령 갯벌 해산물유통',
    businessNumber: '312-90-55412',
    representative: '최태식',
    onlineOrderNumber: '',
    businessCertUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
    onlineOrderUrl: '',
    status: 'REJECTED',
    feeRate: 10.0,
    bankName: '기업은행',
    accountNumber: '010-9941-8821',
    accountHolder: '최태식',
    createdAt: '2026-10-29 16:45',
    productCount: 0,
  },
]

const INITIAL_CREATOR_APPS: CreatorAppItem[] = [
  {
    id: 'cr-app-01',
    userId: 'u-creator-1',
    channelName: '정크리에이터 LIVE',
    category: '푸드/먹방/산지직송',
    introduction: '제주 및 전국 농축수산물 산지직송 전문 라이브 쇼호스트입니다. 평균 동시시청자 1,200명 이상 유지.',
    socialLinks: 'https://youtube.com/@mocco_live_jeju',
    status: 'APPROVED',
    commissionRate: 15.0,
    appliedAt: '2026-10-25 14:20',
  },
  {
    id: 'cr-app-02',
    userId: 'u-creator-2',
    channelName: '테크잇슈 IT리뷰',
    category: '디지털/가전/얼리어답터',
    introduction: '헤드폰, 노트북, 스마트 음향기기 전문 리뷰어입니다. 진정성 있는 언박싱과 특가 딜 라이브 진행.',
    socialLinks: 'https://instagram.com/tech_mocco',
    status: 'PENDING_REVIEW',
    commissionRate: 12.0,
    appliedAt: '2026-11-04 11:30',
  },
  {
    id: 'cr-app-03',
    userId: 'u-creator-3',
    channelName: '뷰티풀데이즈 민지',
    category: '뷰티/코스메틱/스킨케어',
    introduction: '비건 뷰티 및 민감성 피부 스킨케어 큐레이션 전문 크리에이터. 누적 팔로워 8.4만명 보유.',
    socialLinks: 'https://instagram.com/minji_beauty',
    status: 'APPROVED',
    commissionRate: 14.0,
    appliedAt: '2026-10-28 17:00',
  },
]

export default function MerchantsPage() {
  const { toast } = useToast()
  const [merchants, setMerchants] = useState<MerchantItem[]>(FALLBACK_MERCHANTS)
  const [activeMainTab, setActiveMainTab] = useState<'MERCHANTS' | 'CREATORS'>('MERCHANTS')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  // Creator state
  const [creatorApps, setCreatorApps] = useState<CreatorAppItem[]>(INITIAL_CREATOR_APPS)
  const [creatorSearchQuery, setCreatorSearchQuery] = useState('')
  const [creatorFilterStatus, setCreatorFilterStatus] = useState<string>('ALL')
  const [selectedCreatorApp, setSelectedCreatorApp] = useState<CreatorAppItem | null>(null)
  const [isCreatorReviewOpen, setIsCreatorReviewOpen] = useState(false)
  const [creatorCommissionInput, setCreatorCommissionInput] = useState<number>(12.0)
  const [creatorMemoInput, setCreatorMemoInput] = useState('')

  // Merchant Review Dialog State
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantItem | null>(null)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [feeRateInput, setFeeRateInput] = useState<number>(10.0)
  const [adminMemoInput, setAdminMemoInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Document View Modal State
  const [docModalUrl, setDocModalUrl] = useState<string | null>(null)
  const [docModalTitle, setDocModalTitle] = useState<string>('')

  useEffect(() => {
    loadMerchants()
  }, [])

  const loadMerchants = async () => {
    setLoading(true)
    try {
      const res = await api.get('/merchants/admin/list')
      let baseList = FALLBACK_MERCHANTS
      if (res.data?.items && Array.isArray(res.data.items) && res.data.items.length > 0) {
        baseList = res.data.items
      }

      if (typeof window !== 'undefined') {
        try {
          const localApps = JSON.parse(localStorage.getItem('mocco_merchant_applications') || '[]')
          if (Array.isArray(localApps) && localApps.length > 0) {
            const mapped: MerchantItem[] = localApps.map((a: any) => ({
              id: a.id || `mer-${Date.now()}`,
              userId: a.userId || 'u-applicant',
              businessName: a.businessName,
              businessNumber: a.businessNumber,
              representative: a.representative,
              onlineOrderNumber: a.onlineOrderNumber,
              businessCertUrl: a.businessCertUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
              onlineOrderUrl: a.onlineOrderUrl || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600',
              status: a.status || 'PENDING_REVIEW',
              feeRate: Number(a.feeRate || 10.0),
              bankName: a.bankName || '신한은행',
              accountNumber: a.accountNumber || '110-123-456789',
              accountHolder: a.accountHolder || a.representative,
              createdAt: a.createdAt || '2026-11-05 09:00',
              updatedAt: a.updatedAt || '2026-11-05 09:00',
              productCount: 0,
            }))
            const ids = new Set(mapped.map((m) => m.id))
            baseList = [...mapped, ...baseList.filter((m) => !ids.has(m.id))]
          }
        } catch {}

        try {
          const creatorLocal = JSON.parse(localStorage.getItem('mocco_creator_applications') || '[]')
          if (Array.isArray(creatorLocal) && creatorLocal.length > 0) {
            setCreatorApps((prev) => {
              const prevIds = new Set(prev.map((p) => p.id))
              const newItems = creatorLocal.filter((c: any) => !prevIds.has(c.id))
              return [...newItems, ...prev]
            })
          }
        } catch {}
      }

      setMerchants(baseList)
    } catch {
      // Use fallback
    } finally {
      setLoading(false)
    }
  }

  const handleOpenReview = (m: MerchantItem) => {
    setSelectedMerchant(m)
    setFeeRateInput(m.feeRate || 10.0)
    setAdminMemoInput('')
    setIsReviewOpen(true)
  }

  const handleExecuteReview = async (newStatus: 'APPROVED' | 'REJECTED') => {
    if (!selectedMerchant) return
    setSubmitting(true)

    try {
      await api.patch(`/merchants/${selectedMerchant.id}/status`, {
        status: newStatus,
        feeRate: feeRateInput,
        memo: adminMemoInput,
      })
    } catch {
      // Local fallback
    }

    setMerchants((prev) => {
      const updated = prev.map((m) =>
        m.id === selectedMerchant.id
          ? {
              ...m,
              status: newStatus,
              feeRate: feeRateInput,
              updatedAt: new Date().toISOString(),
            }
          : m
      )
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('mocco_merchant_applications', JSON.stringify(updated))
        } catch {}
      }
      return updated
    })

    toast({
      title: newStatus === 'APPROVED' ? '✅ 입점사 심사 승인 완료' : '🚫 입점 신청 반려 처리',
      description: `[${selectedMerchant.businessName}] 상태가 ${newStatus}으로 확정되었습니다. (수수료율: ${feeRateInput}%)`,
    })

    setSubmitting(false)
    setIsReviewOpen(false)
    setSelectedMerchant(null)
  }

  // Creator Review Handlers
  const handleOpenCreatorReview = (app: CreatorAppItem) => {
    setSelectedCreatorApp(app)
    setCreatorCommissionInput(app.commissionRate || 12.0)
    setCreatorMemoInput('')
    setIsCreatorReviewOpen(true)
  }

  const handleExecuteCreatorReview = (newStatus: 'APPROVED' | 'REJECTED') => {
    if (!selectedCreatorApp) return
    setCreatorApps((prev) => {
      const updated = prev.map((c) =>
        c.id === selectedCreatorApp.id
          ? { ...c, status: newStatus, commissionRate: creatorCommissionInput }
          : c
      )
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('mocco_creator_applications', JSON.stringify(updated))
        } catch {}
      }
      return updated
    })
    toast({
      title: newStatus === 'APPROVED' ? '🎙️ 크리에이터 라이브 자격 승인' : '❌ 크리에이터 자격 반려',
      description: `[${selectedCreatorApp.channelName}] 상태가 ${newStatus}으로 확정되었습니다. (제휴 요율: ${creatorCommissionInput}%)`,
    })
    setIsCreatorReviewOpen(false)
    setSelectedCreatorApp(null)
  }

  // Filtered Merchant List
  const filteredList = merchants.filter((m) => {
    if (filterStatus !== 'ALL' && m.status !== filterStatus) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      return (
        m.businessName.toLowerCase().includes(q) ||
        m.businessNumber.includes(q) ||
        m.representative.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Filtered Creator List
  const filteredCreatorList = creatorApps.filter((c) => {
    if (creatorFilterStatus !== 'ALL' && c.status !== creatorFilterStatus) return false
    if (creatorSearchQuery.trim()) {
      const q = creatorSearchQuery.toLowerCase().trim()
      return (
        c.channelName.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.introduction.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Merchant Metrics
  const totalCount = merchants.length
  const pendingCount = merchants.filter((m) => m.status === 'PENDING_REVIEW').length
  const approvedCount = merchants.filter((m) => m.status === 'APPROVED').length
  const rejectedCount = merchants.filter((m) => m.status === 'REJECTED' || m.status === 'SUSPENDED').length

  // Creator Metrics
  const creatorTotalCount = creatorApps.length
  const creatorPendingCount = creatorApps.filter((c) => c.status === 'PENDING_REVIEW').length
  const creatorApprovedCount = creatorApps.filter((c) => c.status === 'APPROVED').length
  const creatorRejectedCount = creatorApps.filter((c) => c.status === 'REJECTED').length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30">⏳ 심사 대기</Badge>
      case 'APPROVED':
        return <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">✅ 승인 완료</Badge>
      case 'REJECTED':
        return <Badge className="bg-rose-500/15 text-rose-500 border-rose-500/30">❌ 심사 반려</Badge>
      case 'SUSPENDED':
        return <Badge className="bg-muted text-muted-foreground">⛔ 운영 정지</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            전국 모꼬 파트너 승인 & 수수료 심사 센터
          </h1>
          <p className="text-sm text-muted-foreground">
            전자상거래법 제10조에 의거하여 사업자등록증, 통신판매업신고증 및 크리에이터 방송 자격을 공정하게 심사하고 제휴 요율을 확정합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadMerchants} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* Main Mode Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveMainTab('MERCHANTS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeMainTab === 'MERCHANTS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Store className="w-4 h-4" />
          공식 입점사(Merchant) 서류 심사 ({merchants.length}개사)
        </button>
        <button
          onClick={() => setActiveMainTab('CREATORS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeMainTab === 'CREATORS'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Radio className="w-4 h-4" />
          크리에이터 방송 & 제휴 자격 심사 ({creatorApps.length}명)
        </button>
      </div>

      {activeMainTab === 'MERCHANTS' ? (
        <>
          {/* Merchant KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">총 신청 입점사</p>
                    <h3 className="text-2xl font-bold mt-1">{totalCount}개사</h3>
                  </div>
                  <Building2 className="w-8 h-8 text-primary/40" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-amber-500">서류 심사 대기</p>
                    <h3 className="text-2xl font-bold mt-1 text-amber-500">{pendingCount}개사</h3>
                  </div>
                  <Clock className="w-8 h-8 text-amber-500/40" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-emerald-500">정상 승인/영업</p>
                    <h3 className="text-2xl font-bold mt-1 text-emerald-500">{approvedCount}개사</h3>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">반려 / 거래정지</p>
                    <h3 className="text-2xl font-bold mt-1">{rejectedCount}개사</h3>
                  </div>
                  <XCircle className="w-8 h-8 text-rose-500/40" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter and Search Bar */}
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="상호명, 사업자번호, 대표자명 검색..."
                    className="pl-9 bg-background/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-44 bg-background/50">
                      <SelectValue placeholder="상태 필터" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">전체 상태 보기</SelectItem>
                      <SelectItem value="PENDING_REVIEW">⏳ 심사 대기중</SelectItem>
                      <SelectItem value="APPROVED">✅ 승인 완료</SelectItem>
                      <SelectItem value="REJECTED">❌ 심사 반려</SelectItem>
                      <SelectItem value="SUSPENDED">⛔ 운영 정지</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Merchants Table */}
          <Card className="border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">입점사 / 상호</th>
                    <th className="px-5 py-3.5 font-semibold">사업자 정보</th>
                    <th className="px-5 py-3.5 font-semibold">제출 서류 검수</th>
                    <th className="px-5 py-3.5 font-semibold text-center">등록 상품</th>
                    <th className="px-5 py-3.5 font-semibold text-center">계약 수수료율</th>
                    <th className="px-5 py-3.5 font-semibold text-center">상태</th>
                    <th className="px-5 py-3.5 font-semibold text-right">심사 집행</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredList.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <Store className="w-4 h-4 text-primary" />
                          {m.businessName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          대표자: {m.representative} | ID: {m.id}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs">{m.businessNumber}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {m.onlineOrderNumber || '통신판매업 미기재'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs h-7"
                            onClick={() => {
                              setDocModalUrl(m.businessCertUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600')
                              setDocModalTitle(`[사업자등록증] ${m.businessName}`)
                            }}
                          >
                            <FileCheck2 className="w-3.5 h-3.5 text-blue-500" />
                            사업자등록증
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs h-7"
                            onClick={() => {
                              setDocModalUrl(m.onlineOrderUrl || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600')
                              setDocModalTitle(`[통신판매업신고증] ${m.businessName}`)
                            }}
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-500" />
                            통신판매신고
                          </Button>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center font-semibold">
                        <Badge variant="outline" className="font-mono">
                          {m.productCount || 0}개
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="font-bold text-primary font-mono">{m.feeRate}%</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {getStatusBadge(m.status)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant={m.status === 'PENDING_REVIEW' ? 'default' : 'outline'}
                          className="gap-1.5"
                          onClick={() => handleOpenReview(m)}
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          심사 / 수수료 확정
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        일치하는 입점사 정보가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <>
          {/* Creator KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">총 신청 크리에이터</p>
                    <h3 className="text-2xl font-bold mt-1 text-purple-600">{creatorTotalCount}명</h3>
                  </div>
                  <Radio className="w-8 h-8 text-purple-500/40" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-amber-500">라이브 심사 대기</p>
                    <h3 className="text-2xl font-bold mt-1 text-amber-500">{creatorPendingCount}명</h3>
                  </div>
                  <Clock className="w-8 h-8 text-amber-500/40" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-emerald-500">활동 승인 쇼호스트</p>
                    <h3 className="text-2xl font-bold mt-1 text-emerald-500">{creatorApprovedCount}명</h3>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">심사 반려 / 보류</p>
                    <h3 className="text-2xl font-bold mt-1">{creatorRejectedCount}명</h3>
                  </div>
                  <XCircle className="w-8 h-8 text-rose-500/40" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter and Search Bar for Creators */}
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="채널명, 방송 카테고리, 소개 키워드 검색..."
                    className="pl-9 bg-background/50"
                    value={creatorSearchQuery}
                    onChange={(e) => setCreatorSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Select value={creatorFilterStatus} onValueChange={setCreatorFilterStatus}>
                    <SelectTrigger className="w-full sm:w-44 bg-background/50">
                      <SelectValue placeholder="상태 필터" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">전체 크리에이터 보기</SelectItem>
                      <SelectItem value="PENDING_REVIEW">⏳ 심사 대기중</SelectItem>
                      <SelectItem value="APPROVED">✅ 활동 승인</SelectItem>
                      <SelectItem value="REJECTED">❌ 심사 반려</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Creators Table */}
          <Card className="border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">채널명 / 크리에이터</th>
                    <th className="px-5 py-3.5 font-semibold">전문 방송 카테고리</th>
                    <th className="px-5 py-3.5 font-semibold">채널 & SNS</th>
                    <th className="px-5 py-3.5 font-semibold">활동 계획 및 방송 소개</th>
                    <th className="px-5 py-3.5 font-semibold text-center">제휴 수수료율</th>
                    <th className="px-5 py-3.5 font-semibold text-center">심사 상태</th>
                    <th className="px-5 py-3.5 font-semibold text-right">자격 심사</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCreatorList.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <Radio className="w-4 h-4 text-purple-600" />
                          {c.channelName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          UID: {c.userId} | 신청: {c.appliedAt}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="secondary" className="text-xs font-normal">
                          {c.category}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        {c.socialLinks ? (
                          <a
                            href={c.socialLinks}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-500 hover:underline flex items-center gap-1 font-mono"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            채널 바로가기
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">링크 미기재</span>
                        )}
                      </td>
                      <td className="px-5 py-4 max-w-xs truncate text-xs text-muted-foreground">
                        {c.introduction}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="font-bold text-purple-600 font-mono">{c.commissionRate}%</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {getStatusBadge(c.status)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant={c.status === 'PENDING_REVIEW' ? 'default' : 'outline'}
                          className="gap-1.5"
                          onClick={() => handleOpenCreatorReview(c)}
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          자격 / 요율 심사
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredCreatorList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        일치하는 크리에이터 지원 내역이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Merchant Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              입점사 승인 심사 & 계약 수수료율 확정
            </DialogTitle>
            <DialogDescription>
              사업자 서류 진위 여부를 대조하고 플랫폼 계약 수수료율(권장: 8.0% ~ 12.0%)을 확정합니다.
            </DialogDescription>
          </DialogHeader>

          {selectedMerchant && (
            <div className="space-y-4 py-3">
              <div className="p-3 bg-muted/40 rounded-lg space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">상호명:</span>
                  <span className="font-semibold">{selectedMerchant.businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">사업자등록번호:</span>
                  <span className="font-mono">{selectedMerchant.businessNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">대표자:</span>
                  <span>{selectedMerchant.representative}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">정산 계좌:</span>
                  <span>
                    {selectedMerchant.bankName} {selectedMerchant.accountNumber} ({selectedMerchant.accountHolder})
                  </span>
                </div>
              </div>

              {/* Fee Rate Setting */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold">플랫폼 계약 수수료율 (%)</label>
                  <span className="text-sm font-bold text-primary font-mono">{feeRateInput}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="20"
                    step="0.5"
                    value={feeRateInput}
                    onChange={(e) => setFeeRateInput(parseFloat(e.target.value))}
                    className="flex-1 accent-primary cursor-pointer"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    min="5"
                    max="20"
                    value={feeRateInput}
                    onChange={(e) => setFeeRateInput(parseFloat(e.target.value) || 10.0)}
                    className="w-20 text-center font-mono font-bold"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  * 플랫폼 표준 가이드라인: <strong>일반 상품 10.0%</strong>, 대형 직영 파트너사 8.0 ~ 9.5%.
                </p>
              </div>

              {/* Admin Memo */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">심사 소견 및 관리자 메모</label>
                <Input
                  placeholder="예: 홈택스 사업자등록 및 통신판매업 정상 확인 완료"
                  value={adminMemoInput}
                  onChange={(e) => setAdminMemoInput(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
            <Button
              type="button"
              variant="destructive"
              disabled={submitting}
              onClick={() => handleExecuteReview('REJECTED')}
              className="gap-1.5"
            >
              <FileX2 className="w-4 h-4" />
              반려 처리
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsReviewOpen(false)}>
                취소
              </Button>
              <Button
                type="button"
                variant="default"
                disabled={submitting}
                onClick={() => handleExecuteReview('APPROVED')}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                <FileCheck2 className="w-4 h-4" />
                {feeRateInput}% 수수료 승인 완료
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Creator Review Dialog */}
      <Dialog open={isCreatorReviewOpen} onOpenChange={setIsCreatorReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-purple-600" />
              크리에이터 라이브 자격 심사 & 제휴 요율 승인
            </DialogTitle>
            <DialogDescription>
              크리에이터의 방송 이력 및 채널 건전성을 검토하고 라이브 커머스 판매 수수료율(10.0% ~ 15.0%)을 승인합니다.
            </DialogDescription>
          </DialogHeader>

          {selectedCreatorApp && (
            <div className="space-y-4 py-3">
              <div className="p-3 bg-muted/40 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">채널명:</span>
                  <span className="font-semibold">{selectedCreatorApp.channelName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">전문 방송 카테고리:</span>
                  <Badge variant="outline">{selectedCreatorApp.category}</Badge>
                </div>
                {selectedCreatorApp.socialLinks && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">채널/SNS:</span>
                    <a
                      href={selectedCreatorApp.socialLinks}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-500 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {selectedCreatorApp.socialLinks}
                    </a>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">소개 및 라이브 계획:</span>
                  <p className="text-xs bg-background/60 p-2.5 rounded border border-border/50 text-foreground leading-relaxed">
                    {selectedCreatorApp.introduction}
                  </p>
                </div>
              </div>

              {/* Commission Rate Setting */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold">라이브 판매 제휴 수수료율 (%)</label>
                  <span className="text-sm font-bold text-purple-600 font-mono">{creatorCommissionInput}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="20"
                    step="0.5"
                    value={creatorCommissionInput}
                    onChange={(e) => setCreatorCommissionInput(parseFloat(e.target.value))}
                    className="flex-1 accent-purple-600 cursor-pointer"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    min="5"
                    max="20"
                    value={creatorCommissionInput}
                    onChange={(e) => setCreatorCommissionInput(parseFloat(e.target.value) || 12.0)}
                    className="w-20 text-center font-mono font-bold"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  * 플랫폼 표준 제휴 가이드라인: <strong>일반 크리에이터 10.0% ~ 15.0%</strong> (PB상품은 15% 이상 우대).
                </p>
              </div>

              {/* Admin Memo */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">심사 소견 및 승인 코멘트</label>
                <Input
                  placeholder="예: 채널 구독자 및 이전 방송 모니터링 완료, 라이브 커머스 송출 권한 승인"
                  value={creatorMemoInput}
                  onChange={(e) => setCreatorMemoInput(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={() => handleExecuteCreatorReview('REJECTED')}
              className="gap-1.5"
            >
              <UserX className="w-4 h-4" />
              라이브 자격 반려
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreatorReviewOpen(false)}>
                취소
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={() => handleExecuteCreatorReview('APPROVED')}
                className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <UserCheck className="w-4 h-4" />
                {creatorCommissionInput}% 제휴 승인 & 라이브 권한 부여
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document View Modal */}
      <Dialog open={Boolean(docModalUrl)} onOpenChange={() => setDocModalUrl(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {docModalTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="border border-border rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center p-4 min-h-[300px]">
              {docModalUrl && (
                <img
                  src={docModalUrl}
                  alt={docModalTitle}
                  className="max-h-[450px] object-contain rounded shadow"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocModalUrl(null)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
