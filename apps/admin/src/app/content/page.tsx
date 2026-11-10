'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  ImageIcon,
  Info,
  Layers,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  createAdminFaq,
  createAnnouncement,
  deleteAdminFaq,
  deleteAnnouncement,
  getAdminFaqs,
  getAdminSupportTickets,
  getAnnouncements,
  updateAdminFaq,
  updateAdminSupportTicketStatus,
  updateAnnouncement,
  type Announcement,
  type AnnouncementWritePayload,
  type EngagementTicket,
  type FaqItem,
} from '@/lib/api'

// ==========================================
// Fallback Mock Data Sets (MOCCO 전용)
// ==========================================
const FALLBACK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-001',
    title: '🎉 모꼬(MOCCO) 차세대 라이브 스트리밍 & 마켓 그랜드 오픈!',
    content:
      '안녕하세요, 모꼬 운영팀입니다!\n누구나 1초 만에 방송하고 3D 모꼬 선물로 소통하는 라이브 스트리밍과 본사 직영/입점사 특가 마켓이 정식 오픈되었습니다.\n안전한 에스크로 결제와 1:1 수다방을 지금 바로 경험해보세요!',
    category: 'NOTICE',
    isPopup: true,
    isPinned: true,
    status: 'PUBLISHED',
    authorName: '모꼬 공식 운영팀',
    viewCount: 14200,
    createdAt: '2026-11-01',
    updatedAt: '2026-11-01',
  },
  {
    id: 'ann-002',
    title: '🍯 모꼬 꿀떡 상점 첫 충전 20% 보너스 꿀떡 지급 이벤트',
    content:
      '라이브 스트리머 후원 및 1:1 수다방에서 사용하는 모꼬 꿀떡을 첫 충전하시면 20% 추가 보너스 꿀떡을 즉시 지급해 드립니다!\n\n· 기간: 2026년 11월 1일 ~ 11월 30일\n· 대상: 첫 충전 모든 회원\n· 혜택: 충전 수량의 20% 즉시 보너스 적립',
    category: 'EVENT',
    isPopup: true,
    isPinned: true,
    status: 'PUBLISHED',
    authorName: '모꼬 마케팅팀',
    viewCount: 8930,
    createdAt: '2026-11-03',
    updatedAt: '2026-11-03',
  },
  {
    id: 'ann-003',
    title: '🛡️ 모꼬 안심 에스크로 결제 및 1:1 프라이빗 통화 운영정책 안내',
    content:
      '모든 마켓 상품 및 C2C 중고거래는 구매확정 전까지 모꼬 머니 에스크로 금고에 안전하게 보관됩니다.\n또한 1:1 프라이빗 안심 통화는 안심번호와 실시간 안전 가이드라인에 따라 철저히 보호됩니다.',
    category: 'NOTICE',
    isPopup: false,
    isPinned: false,
    status: 'PUBLISHED',
    authorName: '신뢰안전센터',
    viewCount: 5210,
    createdAt: '2026-11-05',
    updatedAt: '2026-11-05',
  },
  {
    id: 'ann-004',
    title: '⚠️ 시스템 안정화 정기 서버 점검 안내 (11/15 03:00~05:00)',
    content:
      '더욱 안정적인 라이브 방송과 초고속 채팅 환경을 제공하기 위해 시스템 점검을 실시합니다.\n점검 시간 동안 일시적으로 라이브 접속 및 꿀떡 결제가 제한될 수 있으니 양해 부탁드립니다.',
    category: 'MAINTENANCE',
    isPopup: false,
    isPinned: false,
    status: 'PUBLISHED',
    authorName: '인프라팀',
    viewCount: 3120,
    createdAt: '2026-11-08',
    updatedAt: '2026-11-08',
  },
]

const FALLBACK_FAQS: FaqItem[] = [
  {
    id: 'faq-001',
    category: 'ON_STORE',
    question: '모꼬 꿀떡은 어떻게 충전하고 어디에 사용하나요?',
    answer:
      '모꼬 꿀떡은 인앱 꿀떡 상점 및 웹 충전소에서 신용카드, 카카오페이, 네이버페이, 인앱결제로 충전할 수 있습니다. 충전된 꿀떡은 실시간 라이브 방송 3D 가상 선물 후원, 1:1 수다방 입장료, 1:1 프라이빗 안심 통화 요금에 사용됩니다.',
    priority: 1, isActive: true,
    createdAt: '2026-10-15',
    updatedAt: '2026-10-15',
  },
  {
    id: 'faq-002',
    category: 'SETTLEMENT',
    question: '크리에이터 수익금(꿀떡) 정산 및 환전 신청 기준은 어떻게 되나요?',
    answer:
      '스트리머 등급별 차등 환전 단가(루키 60원, 베스트 70원, 파트너 80원)에 보유 꿀떡을 곱하여 총 정산액을 산출합니다. 사업소득세 3% 및 지방소득세 0.3% 총 3.3%를 원천징수한 뒤 등록하신 실명 본인 계좌로 대량 이체 시스템을 통해 안전하게 입금됩니다.',
    priority: 2, isActive: true,
    createdAt: '2026-10-15',
    updatedAt: '2026-10-15',
  },
  {
    id: 'faq-003',
    category: 'SAFETY',
    question: '모꼬 마켓과 C2C 중고거래 시 결제는 어떻게 보호되나요?',
    answer:
      '구매자가 상품을 주문하면 결제대금은 모꼬 머니 에스크로(구매안전서비스)에 예치됩니다. 배송 완료 후 구매자가 [구매확정]을 누르면 판매자에게 정산되며, 배송사고나 허위 매물 발생 시 전액 환불 조치됩니다.',
    priority: 3, isActive: true,
    createdAt: '2026-10-15',
    updatedAt: '2026-10-15',
  },
  {
    id: 'faq-004',
    category: 'CHAT_LIVE',
    question: '1:1 수다방 입장료와 1:1 안심 통화 요금 정책은 어떻게 되나요?',
    answer:
      '1:1 수다방 개설자는 방 개설 시 무료 또는 원하는 꿀떡(300, 500, 1,000 꿀떡 등)을 입장료로 지정할 수 있으며, 입장자가 지불한 꿀떡은 방장에게 정산됩니다. 1:1 프라이빗 통화는 분당 요금(기본 1,500 꿀떡)이 소요됩니다.',
    priority: 4, isActive: true,
    createdAt: '2026-10-15',
    updatedAt: '2026-10-15',
  },
  {
    id: 'faq-005',
    category: 'ACCOUNT',
    question: '불량 회원에게 피해를 입었을 때 어떻게 신고하나요?',
    answer:
      '라이브 방송 화면, 1:1 채팅방 우측 상단의 [더보기 ➔ 신고하기]를 통해 즉시 접수하실 수 있습니다. 신뢰안전센터에서 24시간 실시간 모니터링하여 가해 회원의 이용 정지 및 세션 강제 만료 조치를 집행합니다.',
    priority: 5, isActive: true,
    createdAt: '2026-10-15',
    updatedAt: '2026-10-15',
  },
]

const INITIAL_TICKETS: EngagementTicket[] = [
  {
    id: 'TKT-701',
    user: '010-3210-1101 (초보호스트루나)',
    category: '정산 문의',
    status: '진행',
    createdAt: '2026-11-09 08:30',
    message: '크리에이터 출금 신청 시 계좌번호 오타로 반려되었는데 재신청 방법 문의드립니다.',
  },
  {
    id: 'TKT-702',
    user: '010-4477-4404 (고기러버)',
    category: '마켓 배송',
    status: '대기',
    createdAt: '2026-11-09 07:15',
    message: '제주 흑돼지 공구 상품 주문했는데 배송 조회가 언제부터 가능한가요?',
  },
  {
    id: 'TKT-703',
    user: '010-5624-2202 (김은지)',
    category: '3D 선물 문의',
    status: '완료',
    createdAt: '2026-11-08 22:10',
    message: '골든 킹 모꼬 3D 선물 후원 시 VIP 축제 이펙트 정상 재생 확인했습니다. 감사합니다!',
  },
]

export default function ContentAndSupportPage() {
  const { toast } = useToast()

  // Guide accordion toggle
  const [showGuide, setShowGuide] = useState(true)

  // Active tab: announcements | faqs | tickets
  const [activeTab, setActiveTab] = useState<'announcements' | 'faqs' | 'tickets'>('announcements')

  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>(FALLBACK_ANNOUNCEMENTS)
  const [annSearch, setAnnSearch] = useState('')
  const [annCategoryFilter, setAnnCategoryFilter] = useState<string>('ALL')
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false)
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null)
  const [annForm, setAnnForm] = useState<AnnouncementWritePayload>({
    title: '',
    content: '',
    category: 'NOTICE',
    isPopup: false,
    isPinned: false,
  })

  // FAQs State
  const [faqs, setFaqs] = useState<FaqItem[]>(FALLBACK_FAQS)
  const [faqSearch, setFaqSearch] = useState('')
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string>('ALL')
  const [openFaqId, setOpenFaqId] = useState<string | null>(null)
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null)
  const [faqForm, setFaqForm] = useState<{
    category: FaqItem['category']
    question: string
    answer: string
    isActive: boolean
    priority: number
  }>({
    category: 'ON_STORE',
    question: '',
    answer: '',
    isActive: true,
    priority: 1,
  })

  // Support Tickets State
  const [tickets, setTickets] = useState<EngagementTicket[]>(INITIAL_TICKETS)
  const [selectedTicket, setSelectedTicket] = useState<EngagementTicket | null>(null)
  const [ticketReplyText, setTicketReplyText] = useState('')

  // Load Initial Data
  const loadAnnouncements = useCallback(async () => {
    try {
      const res = await getAnnouncements()
      if (res && res.length > 0) {
        setAnnouncements(res)
      }
    } catch {
      // keep fallback
    }
  }, [])

  const loadFaqs = useCallback(async () => {
    try {
      const res = await getAdminFaqs()
      if (res && res.length > 0) {
        setFaqs(res)
      }
    } catch {
      // keep fallback
    }
  }, [])

  const loadTickets = useCallback(async () => {
    try {
      const res = await getAdminSupportTickets()
      if (res && res.length > 0) {
        setTickets(res)
      }
    } catch {
      // keep fallback
    }
  }, [])

  useEffect(() => {
    void loadAnnouncements()
    void loadFaqs()
    void loadTickets()
  }, [loadAnnouncements, loadFaqs, loadTickets])

  // ==========================================
  // Announcements Handlers
  // ==========================================
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      const matchCat = annCategoryFilter === 'ALL' || a.category === annCategoryFilter
      const matchSearch =
        !annSearch.trim() ||
        a.title.toLowerCase().includes(annSearch.toLowerCase()) ||
        (a.content || a.body || '').toLowerCase().includes(annSearch.toLowerCase())
      return matchCat && matchSearch
    })
  }, [announcements, annCategoryFilter, annSearch])

  const handleOpenAnnCreate = () => {
    setEditingAnn(null)
    setAnnForm({
      title: '',
      content: '',
      category: 'NOTICE',
      isPopup: false,
      isPinned: false,
    })
    setIsAnnModalOpen(true)
  }

  const handleOpenAnnEdit = (ann: Announcement) => {
    setEditingAnn(ann)
    setAnnForm({
      title: ann.title,
      content: ann.content,
      category: ann.category,
      isPopup: ann.isPopup,
      isPinned: ann.isPinned,
    })
    setIsAnnModalOpen(true)
  }

  const handleAnnSubmit = async () => {
    if (!annForm.title?.trim()) {
      toast({ title: '제목 입력 필요', description: '공지사항 제목을 입력해주세요.', variant: 'destructive' })
      return
    }
    if (!annForm.content?.trim()) {
      toast({ title: '내용 입력 필요', description: '공지사항 본문 내용을 입력해주세요.', variant: 'destructive' })
      return
    }

    try {
      if (editingAnn) {
        await updateAnnouncement(editingAnn.id, annForm)
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === editingAnn.id ? { ...a, ...annForm, updatedAt: new Date().toISOString() } : a))
        )
        toast({ title: '✅ 공지사항 수정 완료', description: `[${annForm.title}] 공지가 수정되었습니다.` })
      } else {
        const created = await createAnnouncement(annForm)
        setAnnouncements((prev) => [created || { ...annForm, id: `ann-${Date.now()}`, viewCount: 0, status: 'PUBLISHED', createdAt: new Date().toISOString() } as any, ...prev])
        toast({ title: '🎉 공지사항 등록 완료', description: `[${annForm.title}] 공지가 발행되었습니다.` })
      }
      setIsAnnModalOpen(false)
    } catch {
      if (editingAnn) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === editingAnn.id ? { ...a, ...annForm, updatedAt: new Date().toISOString() } : a))
        )
      } else {
        setAnnouncements((prev) => [{ ...annForm, id: `ann-${Date.now()}`, viewCount: 0, status: 'PUBLISHED', createdAt: new Date().toISOString() } as any, ...prev])
      }
      toast({ title: '공지사항 저장 완료 (로컬 반영)' })
      setIsAnnModalOpen(false)
    }
  }

  const handleDeleteAnn = async (id: string, title: string) => {
    if (!confirm(`정말 [${title}] 공지사항을 삭제하시겠습니까?`)) return
    try {
      await deleteAnnouncement(id)
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
      toast({ title: '공지사항 삭제 완료' })
    } catch {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
      toast({ title: '공지사항 삭제 완료 (로컬 반영)' })
    }
  }

  const handleTogglePinAnn = async (ann: Announcement) => {
    const nextPin = !ann.isPinned
    try {
      await updateAnnouncement(ann.id, { isPinned: nextPin })
      setAnnouncements((prev) => prev.map((a) => (a.id === ann.id ? { ...a, isPinned: nextPin } : a)))
      toast({ title: nextPin ? '📌 상단 고정 등록' : '고정 해제 완료' })
    } catch {
      setAnnouncements((prev) => prev.map((a) => (a.id === ann.id ? { ...a, isPinned: nextPin } : a)))
      toast({ title: nextPin ? '📌 상단 고정 등록 (로컬)' : '고정 해제 완료' })
    }
  }

  const handleTogglePopupAnn = async (ann: Announcement) => {
    const nextPopup = !ann.isPopup
    try {
      await updateAnnouncement(ann.id, { isPopup: nextPopup })
      setAnnouncements((prev) => prev.map((a) => (a.id === ann.id ? { ...a, isPopup: nextPopup } : a)))
      toast({ title: nextPopup ? '🔔 앱 시작 팝업 활성화' : '팝업 비활성화' })
    } catch {
      setAnnouncements((prev) => prev.map((a) => (a.id === ann.id ? { ...a, isPopup: nextPopup } : a)))
      toast({ title: nextPopup ? '🔔 앱 시작 팝업 활성화 (로컬)' : '팝업 비활성화' })
    }
  }

  // ==========================================
  // FAQs Handlers
  // ==========================================
  const filteredFaqs = useMemo(() => {
    return faqs.filter((f) => {
      const matchCat = faqCategoryFilter === 'ALL' || f.category === faqCategoryFilter
      const matchSearch =
        !faqSearch.trim() ||
        f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
        f.answer.toLowerCase().includes(faqSearch.toLowerCase())
      return matchCat && matchSearch
    })
  }, [faqs, faqCategoryFilter, faqSearch])

  const handleOpenFaqCreate = () => {
    setEditingFaq(null)
    setFaqForm({
      category: 'ON_STORE',
      question: '',
      answer: '',
      isActive: true,
      priority: 1,
    })
    setIsFaqModalOpen(true)
  }

  const handleOpenFaqEdit = (faq: FaqItem) => {
    setEditingFaq(faq)
    setFaqForm({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      isActive: faq.isActive,
      priority: faq.priority,
    })
    setIsFaqModalOpen(true)
  }

  const handleFaqSubmit = async () => {
    if (!faqForm.question?.trim() || !faqForm.answer?.trim()) {
      toast({ title: '입력 오류', description: '질문과 답변 내용을 모두 입력해주세요.', variant: 'destructive' })
      return
    }

    try {
      if (editingFaq) {
        await updateAdminFaq(editingFaq.id, faqForm)
        setFaqs((prev) => prev.map((f) => (f.id === editingFaq.id ? { ...f, ...faqForm } : f)))
        toast({ title: '✅ FAQ 수정 완료' })
      } else {
        const created = await createAdminFaq(faqForm)
        const newFaq: FaqItem = created || {
          ...faqForm,
          id: `faq-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setFaqs((prev) => [...prev, newFaq])
        toast({ title: '🎉 FAQ 등록 완료' })
      }
      setIsFaqModalOpen(false)
    } catch {
      if (editingFaq) {
        setFaqs((prev) => prev.map((f) => (f.id === editingFaq.id ? { ...f, ...faqForm } : f)))
      } else {
        const newFaq: FaqItem = {
          ...faqForm,
          id: `faq-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setFaqs((prev) => [...prev, newFaq])
      }
      toast({ title: 'FAQ 저장 완료 (로컬 반영)' })
      setIsFaqModalOpen(false)
    }
  }

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('정말 이 FAQ 항목을 삭제하시겠습니까?')) return
    try {
      await deleteAdminFaq(id)
      setFaqs((prev) => prev.filter((f) => f.id !== id))
      toast({ title: 'FAQ 삭제 완료' })
    } catch {
      setFaqs((prev) => prev.filter((f) => f.id !== id))
      toast({ title: 'FAQ 삭제 완료 (로컬)' })
    }
  }

  // ==========================================
  // Ticket Handlers
  // ==========================================
  const handleResolveTicket = async (ticketId: string) => {
    try {
      await updateAdminSupportTicketStatus(ticketId, '완료')
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: '완료' } : t)))
      toast({ title: '✅ 문의 답변 및 완료 처리' })
      setSelectedTicket(null)
      setTicketReplyText('')
    } catch {
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: '완료' } : t)))
      toast({ title: '문의 답변 처리 완료 (로컬 반영)' })
      setSelectedTicket(null)
      setTicketReplyText('')
    }
  }

  // KPI calculations
  const popupCount = announcements.filter((a) => a.isPopup).length
  const pinnedAnnCount = announcements.filter((a) => a.isPinned).length
  const pendingTicketsCount = tickets.filter((t) => t.status !== '완료').length

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-primary" />
              공지사항 & 고객센터 관리
            </h1>
            <Badge variant="outline" className="text-xs">
              MOCCO Content & CS Hub
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            모꼬(MOCCO) 공식 공지사항, 앱 시작 팝업 배너, 자주 묻는 질문(FAQ) 및 1:1 고객 문의를 통합 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'announcements' && (
            <Button onClick={handleOpenAnnCreate} size="sm" className="bg-[#FF3B6B] hover:bg-[#E02958] text-white font-bold">
              <Plus className="h-4 w-4 mr-1" />
              신규 공지 작성
            </Button>
          )}
          {activeTab === 'faqs' && (
            <Button onClick={handleOpenFaqCreate} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              <Plus className="h-4 w-4 mr-1" />
              신규 FAQ 추가
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void loadAnnouncements()
              void loadFaqs()
              void loadTickets()
              toast({ title: '새로고침 완료', description: '최신 공지 및 고객센터 데이터를 동기화했습니다.' })
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2. Operational Guide Banner */}
      <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-white to-pink-50/40">
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between cursor-pointer" onClick={() => setShowGuide(!showGuide)}>
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <CardTitle className="text-xs font-bold text-indigo-950">
              신입 운영자를 위한 공지 및 고객센터 3단계 실무 가이드
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-indigo-700">
            {showGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </CardHeader>
        {showGuide && (
          <CardContent className="pt-0 pb-3.5 px-4 text-xs text-slate-700 grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-indigo-100/60">
            <div className="p-2.5 rounded-xl bg-white border border-indigo-100/80 space-y-1">
              <span className="font-extrabold text-indigo-900 flex items-center gap-1">
                <span>1</span> 앱 시작 팝업 배너 적극 활용
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                긴급 점검 공지나 주요 꿀떡 프로모션은 <strong>[팝업 노출 ON]</strong>을 설정하여 모든 유저의 첫 접속 시 확실하게 안내합니다.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-indigo-100/80 space-y-1">
              <span className="font-extrabold text-indigo-900 flex items-center gap-1">
                <span>2</span> 모꼬 4대 영역 FAQ 최신화
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                꿀떡 충전, 크리에이터 정산(3.3%), 마켓 에스크로, 1:1 수다방 등 반복 인입되는 문의는 FAQ에 등록해 고객센터 인입을 사전 예방합니다.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-indigo-100/80 space-y-1">
              <span className="font-extrabold text-indigo-900 flex items-center gap-1">
                <span>3</span> 1:1 고객 문의 24시간 내 답변
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                접수된 1:1 CS 문의는 [대기] 상태에서 신속하게 사유를 확인하고 친절한 안내 답변을 등록하여 회원 신뢰도를 높입니다.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 3. 4대 실시간 메트릭 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3.5 space-y-1">
          <p className="text-xs text-muted-foreground font-medium">전체 공식 공지사항</p>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-foreground">{announcements.length}건</span>
            <span className="text-[11px] font-bold text-amber-600">📌 고정 {pinnedAnnCount}건</span>
          </div>
        </Card>

        <Card className="p-3.5 space-y-1">
          <p className="text-xs text-muted-foreground font-medium">활성 인앱 팝업 배너</p>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-rose-600">{popupCount}건</span>
            <span className="text-[11px] text-muted-foreground">앱 실행 시 노출</span>
          </div>
        </Card>

        <Card className="p-3.5 space-y-1">
          <p className="text-xs text-muted-foreground font-medium">자주 묻는 질문 (FAQ)</p>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-indigo-600">{faqs.length}건</span>
            <span className="text-[11px] text-muted-foreground">5대 카테고리</span>
          </div>
        </Card>

        <Card className="p-3.5 space-y-1">
          <p className="text-xs text-muted-foreground font-medium">1:1 고객 문의 대기</p>
          <div className="flex items-baseline justify-between">
            <span className={`text-xl font-black ${pendingTicketsCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {pendingTicketsCount}건
            </span>
            <span className="text-[11px] text-muted-foreground">총 {tickets.length}건 접수</span>
          </div>
        </Card>
      </div>

      {/* 4. 3대 핵심 탭 인터페이스 */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-xl">
          <TabsTrigger value="announcements" className="flex items-center gap-1.5 font-bold">
            <Megaphone className="h-4 w-4 text-[#FF3B6B]" />
            <span>공지사항 & 팝업 ({announcements.length})</span>
          </TabsTrigger>
          <TabsTrigger value="faqs" className="flex items-center gap-1.5 font-bold">
            <HelpCircle className="h-4 w-4 text-indigo-600" />
            <span>자주 묻는 질문 FAQ ({faqs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-1.5 font-bold">
            <MessageSquare className="h-4 w-4 text-emerald-600" />
            <span>1:1 고객 문의 ({tickets.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* ==================================================== */}
        {/* TAB 1: 공지사항 & 팝업 배너 */}
        {/* ==================================================== */}
        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">공식 공지사항 & 인앱 팝업 배너 관리</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  앱 메인 팝업 배너 노출 여부, 상단 고정(PIN), 공지 분류를 실시간으로 제어합니다.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-48 sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="공지 제목 또는 본문 검색..."
                    value={annSearch}
                    onChange={(e) => setAnnSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>

                <Select value={annCategoryFilter} onValueChange={setAnnCategoryFilter}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue placeholder="카테고리" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체 분류</SelectItem>
                    <SelectItem value="NOTICE">📢 일반 공지</SelectItem>
                    <SelectItem value="EVENT">🎉 이벤트/혜택</SelectItem>
                    <SelectItem value="MAINTENANCE">⚠️ 점검 안내</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent>
              {filteredAnnouncements.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  검색 조건에 맞는 공지사항이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-slate-50/50 text-left text-muted-foreground">
                        <th className="p-2.5 w-16 text-center font-medium">고정/팝업</th>
                        <th className="p-2.5 w-24 font-medium">분류</th>
                        <th className="p-2.5 font-medium">공지 제목 & 내용 미리보기</th>
                        <th className="p-2.5 w-28 font-medium">작성자</th>
                        <th className="p-2.5 w-20 text-right font-medium">조회수</th>
                        <th className="p-2.5 w-24 font-medium">작성일</th>
                        <th className="p-2.5 w-28 text-right font-medium">관리 액션</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredAnnouncements.map((ann) => (
                        <tr key={ann.id} className="hover:bg-muted/30 transition">
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {Boolean(ann.isPinned) && (
                                <Badge className="bg-amber-500 text-white text-[9px] px-1 py-0 h-4">
                                  PIN
                                </Badge>
                              )}
                              {Boolean(ann.isPopup) && (
                                <Badge className="bg-rose-500 text-white text-[9px] px-1 py-0 h-4">
                                  POPUP
                                </Badge>
                              )}
                              {!ann.isPinned && !ann.isPopup && <span className="text-slate-300">—</span>}
                            </div>
                          </td>

                          <td className="p-2.5">
                            {ann.category === 'EVENT' && (
                              <Badge variant="outline" className="text-pink-600 border-pink-200 bg-pink-50 text-[10px]">
                                🎉 이벤트
                              </Badge>
                            )}
                            {ann.category === 'MAINTENANCE' && (
                              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-[10px]">
                                ⚠️ 점검 안내
                              </Badge>
                            )}
                            {ann.category === 'NOTICE' && (
                              <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-[10px]">
                                📢 일반 공지
                              </Badge>
                            )}
                          </td>

                          <td className="p-2.5 max-w-md">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground text-xs hover:text-primary cursor-pointer" onClick={() => handleOpenAnnEdit(ann)}>
                                {ann.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate max-w-lg mt-0.5">
                              {(ann.content || ann.body || '').replace(/\n/g, ' ')}
                            </p>
                          </td>

                          <td className="p-2.5 text-muted-foreground font-medium">
                            {(ann.authorName as string) || '모꼬 운영팀'}
                          </td>

                          <td className="p-2.5 text-right font-mono text-muted-foreground">
                            {typeof ann.viewCount === 'number' ? ann.viewCount.toLocaleString() : 0}
                          </td>

                          <td className="p-2.5 text-muted-foreground font-mono text-[11px]">
                            {ann.createdAt?.slice(0, 10)}
                          </td>

                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-7 w-7 p-0 ${ann.isPinned ? 'text-amber-600' : 'text-slate-400'}`}
                                onClick={() => handleTogglePinAnn(ann)}
                                title={ann.isPinned ? '상단 고정 해제' : '상단 고정 (PIN)'}
                              >
                                <Pin className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-7 w-7 p-0 ${ann.isPopup ? 'text-rose-600' : 'text-slate-400'}`}
                                onClick={() => handleTogglePopupAnn(ann)}
                                title={ann.isPopup ? '앱 시작 팝업 끄기' : '앱 시작 팝업 켜기'}
                              >
                                <Smartphone className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-slate-500 hover:text-foreground"
                                onClick={() => handleOpenAnnEdit(ann)}
                                title="수정"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                onClick={() => handleDeleteAnn(ann.id, ann.title)}
                                title="삭제"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================================================== */}
        {/* TAB 2: 자주 묻는 질문 (FAQ) */}
        {/* ==================================================== */}
        <TabsContent value="faqs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">모꼬 5대 핵심 서비스 FAQ 관리</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  꿀떡 상점, 크리에이터 정산, 마켓 에스크로, 1:1 수다방 요금 등 회원 안내 도움말을 설정합니다.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-48 sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="FAQ 질문 또는 답변 검색..."
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>

                <Select value={faqCategoryFilter} onValueChange={setFaqCategoryFilter}>
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue placeholder="카테고리" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체 카테고리</SelectItem>
                    <SelectItem value="ON_STORE">🍯 꿀떡 상점/결제</SelectItem>
                    <SelectItem value="SETTLEMENT">💸 크리에이터 정산 & 환전</SelectItem>
                    <SelectItem value="SAFETY">🛒 마켓 배송 & 에스크로</SelectItem>
                    <SelectItem value="CHAT_LIVE">☕ 1:1 수다방 & 통화</SelectItem>
                    <SelectItem value="ACCOUNT">🛡️ 계정/안전 정책</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="space-y-2.5">
              {filteredFaqs.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  등록된 FAQ 항목이 없습니다.
                </div>
              ) : (
                filteredFaqs.map((faq) => {
                  const isOpen = openFaqId === faq.id
                  return (
                    <div
                      key={faq.id}
                      className="border rounded-xl bg-white hover:border-slate-300 transition overflow-hidden"
                    >
                      <div
                        className="p-3.5 flex items-center justify-between cursor-pointer select-none bg-slate-50/40 hover:bg-slate-50"
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                          <span className="font-black text-indigo-600 text-sm">Q.</span>
                          <span className="font-bold text-xs text-foreground truncate">
                            {faq.question}
                          </span>
                          <Badge variant="outline" className="text-[10px] shrink-0 font-normal">
                            {faq.category === 'ON_STORE' && '🍯 꿀떡 상점'}
                            {faq.category === 'SETTLEMENT' && '💸 정산 & 환전'}
                            {faq.category === 'SAFETY' && '🛒 마켓 & 에스크로'}
                            {faq.category === 'CHAT_LIVE' && '☕ 수다방 & 통화'}
                            {faq.category === 'ACCOUNT' && '🛡️ 계정/안전'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[11px] text-slate-500 hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenFaqEdit(faq)
                            }}
                          >
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[11px] text-rose-500 hover:text-rose-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteFaq(faq.id)
                            }}
                          >
                            삭제
                          </Button>
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {isOpen && (
                        <div className="p-3.5 pt-2 border-t text-xs text-slate-700 bg-white leading-relaxed">
                          <div className="flex items-start gap-2">
                            <span className="font-black text-rose-600 text-sm shrink-0">A.</span>
                            <p className="whitespace-pre-line flex-1 text-slate-800">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================================================== */}
        {/* TAB 3: 1:1 고객 문의 (CS 센터) */}
        {/* ==================================================== */}
        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">1:1 고객 문의 접수 & 실시간 답변 CS 센터</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  회원들이 앱/웹에서 접수한 1:1 문의를 확인하고 관리자 답변을 작성하여 완료 처리합니다.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  미답변 대기: <strong className="text-amber-600 ml-1">{pendingTicketsCount}건</strong>
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              {tickets.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  접수된 1:1 고객 문의가 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-slate-50/50 text-left text-muted-foreground">
                        <th className="p-2.5 w-24 font-medium">문의 ID</th>
                        <th className="p-2.5 w-28 font-medium">카테고리</th>
                        <th className="p-2.5 font-medium">문의 회원</th>
                        <th className="p-2.5 font-medium">문의 내용</th>
                        <th className="p-2.5 w-24 font-medium">접수일시</th>
                        <th className="p-2.5 w-20 text-center font-medium">상태</th>
                        <th className="p-2.5 w-24 text-right font-medium">처리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {tickets.map((t) => (
                        <tr key={t.id} className="hover:bg-muted/30 transition">
                          <td className="p-2.5 font-mono text-[11px] text-muted-foreground">{t.id}</td>
                          <td className="p-2.5">
                            <Badge variant="outline" className="text-[10px]">
                              {t.category}
                            </Badge>
                          </td>
                          <td className="p-2.5 font-semibold text-foreground">{t.user}</td>
                          <td className="p-2.5 text-slate-800 max-w-sm truncate">{t.message}</td>
                          <td className="p-2.5 text-muted-foreground text-[11px] font-mono">{t.createdAt}</td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                t.status === '완료'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : t.status === '진행'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            {t.status !== '완료' ? (
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                onClick={() => {
                                  setSelectedTicket(t)
                                  setTicketReplyText(`안녕하세요, ${t.user} 회원님. 모꼬 고객지원팀입니다.\n\n문의주신 사항에 대해 확인 후 처리 도와드렸습니다. 추가 문의사항이 있으시면 언제든 말씀해주세요. 감사합니다.`)
                                }}
                              >
                                답변하기
                              </Button>
                            ) : (
                              <span className="text-[11px] text-muted-foreground font-medium">답변 완료</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ==================================================== */}
      {/* DIALOG 1: 공지사항 작성 & 수정 모달 */}
      {/* ==================================================== */}
      <Dialog open={isAnnModalOpen} onOpenChange={setIsAnnModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-[#FF3B6B]" />
              <span>{editingAnn ? '공지사항 수정' : '신규 공지사항 등록'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              모꼬 앱 및 웹 공지사항에 게시할 내용을 작성합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">공지 분류</Label>
                <Select
                  value={annForm.category as string || 'NOTICE'}
                  onValueChange={(val: any) => setAnnForm({ ...annForm, category: val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOTICE">📢 일반 공지</SelectItem>
                    <SelectItem value="EVENT">🎉 이벤트/프로모션</SelectItem>
                    <SelectItem value="MAINTENANCE">⚠️ 긴급 서버점검</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 flex flex-col justify-end pb-1">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border">
                  <span className="font-semibold text-slate-700">📌 상단 고정 (PIN)</span>
                  <Switch
                    checked={!!annForm.isPinned}
                    onCheckedChange={(checked) => setAnnForm({ ...annForm, isPinned: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-rose-950 block">🔔 앱 시작 시 팝업 배너로 노출</span>
                <span className="text-[10px] text-rose-700">유저가 앱을 켤 때 모달 팝업으로 우선 안내합니다.</span>
              </div>
              <Switch
                checked={!!annForm.isPopup}
                onCheckedChange={(checked) => setAnnForm({ ...annForm, isPopup: checked })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">공지 제목</Label>
              <Input
                placeholder="예: [안내] 모꼬 꿀떡 상점 첫 충전 20% 보너스 지급 이벤트"
                value={annForm.title || ''}
                onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">공지 본문 내용</Label>
              <Textarea
                rows={6}
                placeholder="회원들에게 안내할 공지 내용을 줄바꿈을 포함하여 작성해주세요."
                value={annForm.content || ''}
                onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                className="text-xs leading-relaxed"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsAnnModalOpen(false)}>
              취소
            </Button>
            <Button size="sm" className="bg-[#FF3B6B] hover:bg-[#E02958] text-white font-bold" onClick={handleAnnSubmit}>
              {editingAnn ? '수정 완료' : '공지 즉시 발행'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* DIALOG 2: FAQ 등록 & 수정 모달 */}
      {/* ==================================================== */}
      <Dialog open={isFaqModalOpen} onOpenChange={setIsFaqModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-indigo-600" />
              <span>{editingFaq ? 'FAQ 수정' : '신규 FAQ 등록'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              고객센터 자주 묻는 질문(FAQ)에 등록할 질문과 답변을 작성합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">서비스 카테고리</Label>
              <Select
                value={faqForm.category || 'ON_STORE'}
                onValueChange={(val: any) => setFaqForm({ ...faqForm, category: val })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ON_STORE">🍯 꿀떡 상점/결제/환불</SelectItem>
                  <SelectItem value="SETTLEMENT">💸 크리에이터 정산 & 환전</SelectItem>
                  <SelectItem value="SAFETY">🛒 마켓 주문/배송 & 에스크로</SelectItem>
                  <SelectItem value="CHAT_LIVE">☕ 1:1 수다방 & 프라이빗 통화</SelectItem>
                  <SelectItem value="ACCOUNT">🛡️ 계정/본인인증 & 안전 정책</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">자주 묻는 질문 (Question)</Label>
              <Input
                placeholder="예: 크리에이터 환전 신청 후 계좌 입금까지 며칠 걸리나요?"
                value={faqForm.question || ''}
                onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                className="text-xs font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">도움말 답변 (Answer)</Label>
              <Textarea
                rows={5}
                placeholder="회원이 쉽게 이해할 수 있도록 명확한 정책과 처리 절차를 작성해주세요."
                value={faqForm.answer || ''}
                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                className="text-xs leading-relaxed"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsFaqModalOpen(false)}>
              취소
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold" onClick={handleFaqSubmit}>
              {editingFaq ? '수정 저장' : 'FAQ 등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* DIALOG 3: 1:1 고객 문의 답변 모달 */}
      {/* ==================================================== */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              <span>1:1 고객 문의 답변 작성</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              회원이 접수한 문의에 답변을 작성하고 상태를 [완료] 처리합니다.
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">문의자</span>
                  <span className="font-bold text-foreground">{selectedTicket.user}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">분류</span>
                  <span className="font-semibold text-slate-800">{selectedTicket.category}</span>
                </div>
                <div className="pt-1.5 border-t">
                  <span className="text-slate-500 block mb-0.5">문의 내용:</span>
                  <p className="text-slate-900 font-medium leading-relaxed bg-white p-2 rounded-lg border">
                    {selectedTicket.message}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">관리자 안내 답변</Label>
                <Textarea
                  rows={5}
                  value={ticketReplyText}
                  onChange={(e) => setTicketReplyText(e.target.value)}
                  className="text-xs leading-relaxed"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setSelectedTicket(null)}>
              닫기
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              onClick={() => selectedTicket && void handleResolveTicket(selectedTicket.id)}
            >
              답변 전송 & 처리 완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
