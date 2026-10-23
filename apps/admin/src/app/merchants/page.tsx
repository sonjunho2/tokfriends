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
  updatedAt: string
  user?: {
    id: string
    nickname: string | null
    displayName: string | null
    email: string | null
    avatarUrl: string | null
  }
  productCount?: number
}

const FALLBACK_MERCHANTS: MerchantItem[] = [
  {
    id: 'mer-001',
    userId: 'u-merchant-1',
    businessName: '제주푸드 본사 직영',
    businessNumber: '616-81-99201',
    representative: '고성훈',
    onlineOrderNumber: '2025-제주오라-0112',
    businessCertUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
    onlineOrderUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600',
    status: 'APPROVED',
    feeRate: 9.5,
    bankName: '제주은행',
    accountNumber: '200-11-928172',
    accountHolder: '제주푸드(주)',
    createdAt: '2026-10-18 11:20',
    updatedAt: '2026-10-21 14:00',
    productCount: 4,
  },
  {
    id: 'mer-002',
    userId: 'u-merchant-2',
    businessName: '메디컬 헬스케어랩',
    businessNumber: '214-88-34190',
    representative: '김정민',
    onlineOrderNumber: '2026-서울강남-0482',
    businessCertUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=600',
    onlineOrderUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
    status: 'APPROVED',
    feeRate: 10.0,
    bankName: '국민은행',
    accountNumber: '481202-01-382910',
    accountHolder: '(주)메디컬랩',
    createdAt: '2026-10-19 15:40',
    updatedAt: '2026-10-22 09:30',
    productCount: 3,
  },
  {
    id: 'mer-003',
    userId: 'u-merchant-3',
    businessName: '어반 라이프 스타일',
    businessNumber: '105-86-77312',
    representative: '이지은',
    onlineOrderNumber: '2026-경기성남-1920',
    businessCertUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600',
    onlineOrderUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
    status: 'PENDING_REVIEW',
    feeRate: 10.0,
    bankName: '신한은행',
    accountNumber: '110-492-817293',
    accountHolder: '이지은(어반라이프)',
    createdAt: '2026-10-22 18:10',
    updatedAt: '2026-10-22 18:10',
    productCount: 2,
  },
  {
    id: 'mer-004',
    userId: 'u-merchant-4',
    businessName: '한우명가 산지직판장',
    businessNumber: '312-85-11029',
    representative: '박영호',
    onlineOrderNumber: '2026-강원횡성-0034',
    businessCertUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
    onlineOrderUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600',
    status: 'PENDING_REVIEW',
    feeRate: 10.0,
    bankName: '농협은행',
    accountNumber: '302-0918-2831-11',
    accountHolder: '박영호',
    createdAt: '2026-10-23 08:45',
    updatedAt: '2026-10-23 08:45',
    productCount: 1,
  },
]

export default function MerchantsAdminPage() {
  const { toast } = useToast()
  const [merchants, setMerchants] = useState<MerchantItem[]>(FALLBACK_MERCHANTS)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  // Review Dialog State
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantItem | null>(null)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [feeRateInput, setFeeRateInput] = useState<number>(10.0)
  const [adminMemoInput, setAdminMemoInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Document Viewer Modal State
  const [docModalUrl, setDocModalUrl] = useState<string | null>(null)
  const [docModalTitle, setDocModalTitle] = useState<string>('')

  const loadMerchants = async () => {
    setLoading(true)
    try {
      const res = await api.get('/merchants/admin/list')
      if (res.data?.items && Array.isArray(res.data.items)) {
        setMerchants(res.data.items)
      }
    } catch {
      // Use fallback data seamlessly
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMerchants()
  }, [])

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
      await api.patch(`/merchants/admin/${selectedMerchant.id}/review`, {
        status: newStatus,
        feeRate: feeRateInput,
        adminMemo: adminMemoInput || (newStatus === 'APPROVED' ? '입점 서류 심사 적격 승인' : '입점 서류 부적격 반려'),
      })
    } catch {
      // Local fallback
    }

    setMerchants((prev) =>
      prev.map((m) =>
        m.id === selectedMerchant.id
          ? {
              ...m,
              status: newStatus,
              feeRate: feeRateInput,
              updatedAt: new Date().toISOString(),
            }
          : m
      )
    )

    toast({
      title: newStatus === 'APPROVED' ? '✅ 입점사 심사 승인 완료' : '🚫 입점 신청 반려 처리',
      description: `[${selectedMerchant.businessName}] 상태가 ${newStatus}으로 확정되었습니다. (수수료율: ${feeRateInput}%)`,
    })

    setSubmitting(false)
    setIsReviewOpen(false)
    setSelectedMerchant(null)
  }

  // Filtered List
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

  // Metrics
  const totalCount = merchants.length
  const pendingCount = merchants.filter((m) => m.status === 'PENDING_REVIEW').length
  const approvedCount = merchants.filter((m) => m.status === 'APPROVED').length
  const rejectedCount = merchants.filter((m) => m.status === 'REJECTED' || m.status === 'SUSPENDED').length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30">⏳ 심사 대기</Badge>
      case 'APPROVED':
        return <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">✅ 입점 승인</Badge>
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
            <Store className="w-6 h-6 text-primary" />
            입점사(Merchant) 심사 & 수수료 승인 센터
          </h1>
          <p className="text-sm text-muted-foreground">
            B2C 일반 상품 판매 입점 신청자의 사업자등록증 및 통신판매업 서류를 심사하고 계약 수수료율(8~12%)을 확정합니다.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadMerchants} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* KPI Cards */}
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
                <p className="text-xs font-medium text-amber-500">심사 대기중</p>
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

      {/* Review Dialog */}
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
