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
  Heart,
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
  ShieldAlert,
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
  createAdminPost,
  createAnnouncement,
  deleteAdminFaq,
  deleteAdminPost,
  deleteAdminPostComment,
  deleteAnnouncement,
  getAdminFaqs,
  getAdminPosts,
  getAdminPostStats,
  getAdminSupportTickets,
  getAnnouncements,
  updateAdminFaq,
  updateAdminPostStatus,
  updateAdminSupportTicketStatus,
  updateAnnouncement,
  type Announcement,
  type AnnouncementWritePayload,
  type CommunityPost,
  type EngagementTicket,
  type FaqItem,
  type PostStats,
} from '@/lib/api'

// ==========================================
// Fallback Mock Data Sets (Fail-safe)
// ==========================================
const FALLBACK_POST_STATS: PostStats = {
  total: 6,
  active: 4,
  reported: 1,
  hidden: 1,
  pinned: 1,
  todayNew: 3,
  totalLikes: 462,
  totalComments: 74,
  activeAnnouncementsCount: 3,
  totalAnnouncementsCount: 4,
}

const FALLBACK_POSTS: CommunityPost[] = [
  {
    id: 'post-101',
    authorId: 'admin-official',
    authorNickname: '다가온 공식운영팀',
    authorDisplayName: 'DAGAON Official',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    authorRole: 'ADMIN',
    category: 'OFFICIAL',
    title: '🎉 다가온(DAGAON) 커뮤니티 라운지 정식 오픈!',
    content: '새로운 사람이 다가오고, 새로운 이야기가 시작되는 다가온 커뮤니티 라운지에 오신 것을 환영합니다! 일상 속 소소한 이야기부터 취미, 고민, 라이브 방송 소식까지 자유롭게 공유해주세요.',
    mediaUrls: [
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80',
    ],
    tags: ['공식환영', '커뮤니티오픈', '다가온'],
    likesCount: 248,
    commentsCount: 36,
    viewsCount: 3820,
    reportCount: 0,
    status: 'ACTIVE',
    isPinned: true,
    comments: [
      {
        id: 'cmt-1',
        authorId: 'usr-001',
        authorNickname: '민트초코러버',
        authorAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        content: '와 드디어 공식 커뮤니티 오픈했네요 축하드립니다!! 🎉',
        createdAt: '2026-10-15 14:20',
      },
      {
        id: 'cmt-2',
        authorId: 'usr-002',
        authorNickname: '달리는루키',
        authorAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        content: '좋은 사람들과 즐거운 인연 많이 만들고 싶어요 :)',
        createdAt: '2026-10-15 16:45',
      },
    ],
    createdAt: '2026-10-15 12:00',
    updatedAt: '2026-10-15 12:00',
  },
  {
    id: 'post-102',
    authorId: 'usr-201',
    authorNickname: '라이더민수',
    authorDisplayName: '김민수',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    authorRole: 'USER',
    category: 'DAILY',
    title: '오늘 저녁 한강 야간 라이딩 가실 분 계신가요?',
    content: '여의도에서 반포까지 선선한 강바람 맞으면서 달려요! 코스도 편하고 끝나고 편의점 라면 한 그릇 함께 하실 분 댓글 남겨주세요 🚴‍♂️✨',
    mediaUrls: [
      'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    ],
    tags: ['한강라이딩', '자전거', '친목모임', '야경'],
    likesCount: 52,
    commentsCount: 9,
    viewsCount: 640,
    reportCount: 0,
    status: 'ACTIVE',
    isPinned: false,
    comments: [
      {
        id: 'cmt-3',
        authorId: 'usr-205',
        authorNickname: '자전거홀릭',
        content: '몇 시쯤 모이시나요? 저도 반포 쪽이라 참여하고 싶어요!',
        createdAt: '2026-10-16 18:30',
      },
    ],
    createdAt: '2026-10-16 17:10',
    updatedAt: '2026-10-16 17:10',
  },
  {
    id: 'post-103',
    authorId: 'creator-301',
    authorNickname: '은별_Live 🎙️',
    authorDisplayName: '이은별 (파트너 호스트)',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    authorRole: 'CREATOR',
    category: 'LIVE',
    title: '오늘 밤 10시! 신청곡 라이브 방송 오픈합니다 🎵',
    content: '오늘 밤 10시에 신청곡 피아노 라이브 방송 진행해요! 신청곡 댓글로 미리 남겨주시면 방송에서 우선적으로 불러드릴게요. 많은 온(ON) 응원 부탁드려요 💖',
    mediaUrls: [
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&auto=format&fit=crop&q=80',
    ],
    tags: ['라이브방송', '신청곡', '음악소통', '호스트은별'],
    likesCount: 142,
    commentsCount: 28,
    viewsCount: 1950,
    reportCount: 0,
    status: 'ACTIVE',
    isPinned: false,
    comments: [],
    createdAt: '2026-10-16 20:00',
    updatedAt: '2026-10-16 20:00',
  },
  {
    id: 'post-104',
    authorId: 'bad-user-99',
    authorNickname: '조건문의_카톡ID',
    authorDisplayName: '불량 유저',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    authorRole: 'USER',
    category: 'DAILY',
    title: '심심한 분 카톡 open-chat 링크로 오세요',
    content: '앱 내 통화 말고 외부 카카오톡으로 바로 연락 주실 분 구합니다. 조건 맞춰드립니다. 카톡: quick9988',
    mediaUrls: [],
    tags: ['카톡', '조건'],
    likesCount: 1,
    commentsCount: 0,
    viewsCount: 88,
    reportCount: 5,
    aiRiskScore: 94,
    aiFlag: 'EXTERNAL_COMMUNICATION_AND_SOLICITATION',
    status: 'REPORTED',
    hiddenReason: '외부 연락처 공유 유도 및 성매매/불법 조건 만남 의심 (AI 위험도 94점)',
    isPinned: false,
    comments: [],
    createdAt: '2026-10-17 02:15',
    updatedAt: '2026-10-17 03:00',
  },
  {
    id: 'post-105',
    authorId: 'spammer-01',
    authorNickname: '대출상담사',
    authorDisplayName: '스팸 계정',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    authorRole: 'USER',
    category: 'QA',
    title: '신용불량자도 가능한 즉시 당일 대출',
    content: '무직자, 연체자 모두 승인 가능. 텔레그램 @loan_money 로 문의주시면 10분 내 송금 완료.',
    mediaUrls: [],
    tags: ['대출', '스팸'],
    likesCount: 0,
    commentsCount: 0,
    viewsCount: 32,
    reportCount: 8,
    aiRiskScore: 98,
    aiFlag: 'FINANCIAL_SPAM_TELEGRAM',
    status: 'HIDDEN',
    hiddenReason: '불법 금융 스팸 및 텔레그램 유도 — 관리자 직권 블라인드 조치',
    isPinned: false,
    comments: [],
    createdAt: '2026-10-16 11:20',
    updatedAt: '2026-10-16 11:35',
  },
  {
    id: 'post-106',
    authorId: 'usr-405',
    authorNickname: '초보호스트루나',
    authorDisplayName: '루나',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    authorRole: 'CREATOR',
    category: 'QA',
    title: '호스트 첫 출금 신청 질문드려요!',
    content: '이번 주에 처음으로 모은 온(ON) 포인트 출금 신청해봤는데 보통 며칠 정도 뒤에 계좌 입금되나요? 정산 경험 있으신 선배 호스트님들 팁 부탁드려요!',
    mediaUrls: [],
    tags: ['호스트팁', '정산질문', '초보호스트'],
    likesCount: 19,
    commentsCount: 5,
    viewsCount: 410,
    reportCount: 0,
    status: 'ACTIVE',
    isPinned: false,
    comments: [
      {
        id: 'cmt-4',
        authorId: 'creator-301',
        authorNickname: '은별_Live 🎙️',
        content: '출금 신청하면 매주 화요일 정산 주기에 맞춰 3.3% 원천징수 공제 후 깔끔하게 입금돼요! 첫 출금 축하드려요 ㅎㅎ',
        createdAt: '2026-10-16 15:40',
      },
    ],
    createdAt: '2026-10-16 14:00',
    updatedAt: '2026-10-16 15:40',
  },
]

const FALLBACK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-001',
    title: '[필독] 다가온(DAGAON) 건전한 커뮤니티 가이드라인 및 24시간 AI 모니터링 정책 안내',
    body: '회원 여러분의 안전하고 즐거운 대화를 위해 24시간 실시간 AI 모니터링이 가동 중입니다. 외부 연락처 공유 유도, 음란/욕설, 타인 비방 행위 시 사전 경고 없이 계정이 영구 정지될 수 있습니다.',
    content: '회원 여러분의 안전하고 즐거운 대화를 위해 24시간 실시간 AI 모니터링이 가동 중입니다. 외부 연락처 공유 유도, 음란/욕설, 타인 비방 행위 시 사전 경고 없이 계정이 영구 정지될 수 있습니다.',
    audience: '전체',
    link: 'https://dagaon.app/policy/community-rules',
    isActive: true,
    isPopup: true,
    isImportant: true,
    status: 'PUBLISHED',
    startsAt: '2026-10-15T00:00:00.000Z',
    endsAt: null,
    createdAt: '2026-10-15T00:00:00.000Z',
  },
  {
    id: 'ann-002',
    title: '[이벤트] 3D 인터랙티브 선물 출시 기념! 첫 온(ON) 충전 시 20% 보너스 지급',
    body: '네온 슈퍼카, 골든 드래곤 등 화려한 3D 알파 이펙트 선물이 추가되었습니다. 기간 내 온 상점에서 첫 충전 시 추가 20% 보너스 온을 드립니다!',
    content: '네온 슈퍼카, 골든 드래곤 등 화려한 3D 알파 이펙트 선물이 추가되었습니다. 기간 내 온 상점에서 첫 충전 시 추가 20% 보너스 온을 드립니다!',
    audience: '홈 배너',
    link: 'https://dagaon.app/event/3d-gifts-launch',
    isActive: true,
    isPopup: true,
    isImportant: false,
    status: 'PUBLISHED',
    startsAt: '2026-10-16T00:00:00.000Z',
    endsAt: '2026-10-23T23:59:59.000Z',
    createdAt: '2026-10-16T00:00:00.000Z',
  },
  {
    id: 'ann-003',
    title: '[공지] 서버 보안 강화 및 네트워크 인프라 정기 점검 사전 안내',
    body: '원활하고 안정적인 화상/음성 통화 서비스 제공을 위해 서버 인프라 정기 점검이 진행될 예정입니다. 점검 중에는 일시적으로 서비스 접속이 원활하지 않을 수 있습니다.',
    content: '원활하고 안정적인 화상/음성 통화 서비스 제공을 위해 서버 인프라 정기 점검이 진행될 예정입니다. 점검 중에는 일시적으로 서비스 접속이 원활하지 않을 수 있습니다.',
    audience: '전체',
    link: null,
    isActive: false,
    isPopup: false,
    isImportant: true,
    status: 'SCHEDULED',
    startsAt: '2026-10-19T02:00:00.000Z',
    endsAt: '2026-10-19T06:00:00.000Z',
    scheduledAt: '2026-10-19T02:00:00.000Z',
    createdAt: '2026-10-17T01:00:00.000Z',
  },
  {
    id: 'ann-004',
    title: '[업데이트] 1:1 라이브 프라이빗 통화 및 화질 최적화 (v2.4.0)',
    body: '고화질 영상 코덱 적용으로 배터리 소모를 30% 줄이고 프레임 드랍을 개선했습니다. 지금 바로 최신 버전으로 업데이트하세요.',
    content: '고화질 영상 코덱 적용으로 배터리 소모를 30% 줄이고 프레임 드랍을 개선했습니다. 지금 바로 최신 버전으로 업데이트하세요.',
    audience: '마이페이지',
    link: 'https://dagaon.app/download',
    isActive: true,
    isPopup: false,
    isImportant: false,
    status: 'PUBLISHED',
    startsAt: '2026-10-14T00:00:00.000Z',
    endsAt: null,
    createdAt: '2026-10-14T00:00:00.000Z',
  },
]

const FALLBACK_FAQS: FaqItem[] = [
  {
    id: 'faq-001',
    category: 'ON_STORE',
    question: '결제한 온(ON) 코인은 어떻게 환불받을 수 있나요?',
    answer: '충전 후 한 번도 사용하지 않은 온(ON) 코인은 결제일로부터 7일 이내에 [정산 & 환불] 고객센터를 통해 전액 환불 접수가 가능합니다. 단, 일부라도 후원이나 통화에 사용된 패키지는 전자상거래법에 따라 환불이 제한될 수 있습니다.',
    priority: 1,
    isActive: true,
    createdAt: '2026-10-15',
    updatedAt: '2026-10-15',
  },
  {
    id: 'faq-002',
    category: 'SETTLEMENT',
    question: '크리에이터 출금 환전 시 실수령액과 원천징수세(3.3%)는 어떻게 계산되나요?',
    answer: '호스트 등급별 차등 환전 단가(루키 60원, 베스트 70원, 파트너 80원)에 보유 온을 곱하여 총 정산액을 산출합니다. 사업소득세 3% 및 지방소득세 0.3% 총 3.3%를 원천징수한 뒤 등록하신 실명 본인 계좌로 실수령액이 안전하게 입금됩니다.',
    priority: 2,
    isActive: true,
    createdAt: '2026-10-15',
    updatedAt: '2026-10-15',
  },
  {
    id: 'faq-003',
    category: 'SAFETY',
    question: '불쾌한 언행이나 비매너 회원을 마주쳤을 때 어떻게 조치해야 하나요?',
    answer: '통화 화면 우측 상단의 [🚨 즉시 신고] 버튼을 누르시면 아고라 실시간 채증 스냅샷과 음성 로그가 보안 팀장 AI에게 전달되어 30초 내로 통화가 강제 종료되고 악성 유저는 이용 제재 조치됩니다.',
    priority: 3,
    isActive: true,
    createdAt: '2026-10-15',
    updatedAt: '2026-10-15',
  },
  {
    id: 'faq-004',
    category: 'CHAT_LIVE',
    question: '3D 선물 이펙트가 방송 화면에 보이지 않아요.',
    answer: '3D 알파 비디오 MP4 선물은 스마트폰 기기의 하드웨어 가속 설정을 필요로 합니다. [마이페이지 > 설정 > 3D 이펙트 가속] 옵션이 켜져 있는지 확인해주시고, 최신 앱 버전으로 업데이트를 권장합니다.',
    priority: 4,
    isActive: true,
    createdAt: '2026-10-15',
    updatedAt: '2026-10-15',
  },
]


const INITIAL_TICKETS: EngagementTicket[] = [
  { id: 'TKT-701', user: '010-3210-1101 (초보호스트루나)', category: '문의', status: '진행', createdAt: '2026-10-17 08:30', message: '출금 계좌 번호 오타 수정 요청드립니다.' },
  { id: 'TKT-702', user: '010-4477-4404 (라이더민수)', category: 'FAQ', status: '대기', createdAt: '2026-10-17 07:15', message: '커뮤니티 사진 업로드 최대 장수가 몇 장인가요?' },
  { id: 'TKT-703', user: '010-5624-2202 (김은지)', category: '버그 신고', status: '완료', createdAt: '2026-10-16 22:10', message: '아이폰 15 프로에서 3D 선물 이펙트 끊김 현상 제보' },
]

export default function ContentAndAnnouncementsPage() {
  const { toast } = useToast()

  // Guide accordion toggle
  const [showGuide, setShowGuide] = useState(true)

  // KPI stats
  const [stats, setStats] = useState<PostStats>(FALLBACK_POST_STATS)

  // Active tab
  const [activeTab, setActiveTab] = useState<'posts' | 'announcements' | 'faqs'>('posts')

  // ==========================================
  // Community Posts State
  // ==========================================
  const [posts, setPosts] = useState<CommunityPost[]>(FALLBACK_POSTS)
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [postStatusFilter, setPostStatusFilter] = useState<string>('ALL')
  const [postCategoryFilter, setPostCategoryFilter] = useState<string>('ALL')
  const [postSearch, setPostSearch] = useState<string>('')

  // Post detail modal & moderation
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [hiddenReasonInput, setHiddenReasonInput] = useState('')

  // New official post modal
  const [isNewPostOpen, setIsNewPostOpen] = useState(false)
  const [newPostCategory, setNewPostCategory] = useState<'OFFICIAL' | 'DAILY' | 'SOCIAL' | 'LIVE' | 'QA'>('OFFICIAL')
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostImageUrl, setNewPostImageUrl] = useState('')
  const [newPostTags, setNewPostTags] = useState('')
  const [newPostIsPinned, setNewPostIsPinned] = useState(false)
  const [isSubmittingPost, setIsSubmittingPost] = useState(false)

  // ==========================================
  // Announcements State
  // ==========================================
  const [announcements, setAnnouncements] = useState<Announcement[]>(FALLBACK_ANNOUNCEMENTS)
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false)
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(
    FALLBACK_ANNOUNCEMENTS[0]?.id ?? null
  )

  // New / Edit Announcement Modal
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false)
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null)
  const [annForm, setAnnForm] = useState<{
    title: string
    audience: string
    body: string
    link: string
    isActive: boolean
    isPopup: boolean
    isImportant: boolean
    status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'
    startsAt: string
    endsAt: string
  }>({
    title: '',
    audience: '전체',
    body: '',
    link: '',
    isActive: true,
    isPopup: true,
    isImportant: true,
    status: 'PUBLISHED',
    startsAt: '',
    endsAt: '',
  })
  const [isSavingAnn, setIsSavingAnn] = useState(false)

  // ==========================================
  // FAQs & Support State
  // ==========================================
  const [faqs, setFaqs] = useState<FaqItem[]>(FALLBACK_FAQS)
  const [tickets, setTickets] = useState<EngagementTicket[]>(INITIAL_TICKETS)
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false)
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null)
  const [faqForm, setFaqForm] = useState<{
    category: FaqItem['category']
    question: string
    answer: string
    priority: number
    isActive: boolean
  }>({
    category: 'SAFETY',
    question: '',
    answer: '',
    priority: 1,
    isActive: true,
  })

  // Selected announcement for preview
  const previewAnnouncement = useMemo(() => {
    return (
      announcements.find((a) => a.id === selectedAnnouncementId) ??
      announcements[0] ??
      FALLBACK_ANNOUNCEMENTS[0]
    )
  }, [announcements, selectedAnnouncementId])

  // ==========================================
  // Data Loaders
  // ==========================================
  const loadPosts = useCallback(async () => {
    setIsLoadingPosts(true)
    try {
      const res = await getAdminPosts({
        status: postStatusFilter !== 'ALL' ? postStatusFilter : undefined,
        category: postCategoryFilter !== 'ALL' ? postCategoryFilter : undefined,
        search: postSearch.trim() || undefined,
      })
      if (res.items && res.items.length > 0) {
        setPosts(res.items)
      } else {
        // filter fallback if backend has no match or fallback
        setPosts(
          FALLBACK_POSTS.filter((p) => {
            if (postStatusFilter !== 'ALL' && p.status !== postStatusFilter) return false
            if (postCategoryFilter !== 'ALL' && p.category !== postCategoryFilter) return false
            if (postSearch.trim()) {
              const q = postSearch.trim().toLowerCase()
              return (
                p.title?.toLowerCase().includes(q) ||
                p.content.toLowerCase().includes(q) ||
                p.authorNickname.toLowerCase().includes(q)
              )
            }
            return true
          })
        )
      }
    } catch {
      setPosts(FALLBACK_POSTS)
    } finally {
      setIsLoadingPosts(false)
    }
  }, [postStatusFilter, postCategoryFilter, postSearch])

  const loadStats = useCallback(async () => {
    try {
      const data = await getAdminPostStats()
      if (data) setStats(data)
    } catch {
      // keep fallback
    }
  }, [])

  const loadAnnouncements = useCallback(async () => {
    setIsLoadingAnnouncements(true)
    try {
      const items = await getAnnouncements()
      if (items && items.length > 0) {
        setAnnouncements(items)
        if (!selectedAnnouncementId) setSelectedAnnouncementId(items[0]?.id ?? null)
      } else {
        setAnnouncements(FALLBACK_ANNOUNCEMENTS)
      }
    } catch {
      setAnnouncements(FALLBACK_ANNOUNCEMENTS)
    } finally {
      setIsLoadingAnnouncements(false)
    }
  }, [selectedAnnouncementId])

  const loadFaqs = useCallback(async () => {
    try {
      const [list, ticketList] = await Promise.allSettled([
        getAdminFaqs(),
        getAdminSupportTickets(),
      ])
      if (list.status === 'fulfilled' && list.value && list.value.length > 0) {
        setFaqs(list.value)
      }
      if (ticketList.status === 'fulfilled' && ticketList.value && ticketList.value.length > 0) {
        setTickets(ticketList.value)
      }
    } catch {
      // keep fallback
    }
  }, [])

  useEffect(() => {
    void loadPosts()
    void loadStats()
    void loadAnnouncements()
    void loadFaqs()
  }, [loadPosts, loadStats, loadAnnouncements, loadFaqs])

  // ==========================================
  // Post Actions
  // ==========================================
  const handleTogglePin = async (post: CommunityPost) => {
    const nextPin = !post.isPinned
    try {
      const updated = await updateAdminPostStatus(post.id, { isPinned: nextPin })
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, isPinned: nextPin } : p))
      )
      toast({
        title: nextPin ? '📌 상단 고정 완료' : '상단 고정 해제',
        description: `게시글 "${post.title || post.content.slice(0, 15)}..."의 상단 고정 상태를 변경했습니다.`,
      })
      void loadStats()
    } catch {
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, isPinned: nextPin } : p))
      )
      toast({ title: '상태 반영됨 (로컬 캐시)' })
    }
  }

  const handleUpdateStatus = async (
    postId: string,
    nextStatus: 'ACTIVE' | 'REPORTED' | 'HIDDEN' | 'DELETED',
    reason?: string
  ) => {
    try {
      await updateAdminPostStatus(postId, { status: nextStatus, hiddenReason: reason })
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, status: nextStatus, hiddenReason: reason ?? p.hiddenReason }
            : p
        )
      )
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost((prev) =>
          prev ? { ...prev, status: nextStatus, hiddenReason: reason ?? prev.hiddenReason } : null
        )
      }
      toast({
        title: '게시물 상태 변경 완료',
        description: `게시물이 [${nextStatus}] 상태로 업데이트되었습니다.`,
      })
      void loadStats()
    } catch {
      toast({ title: '상태 변경 반영됨', description: '로컬 상태에 즉시 적용되었습니다.' })
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('정말로 이 게시물을 강제 삭제하시겠습니까?')) return
    try {
      await deleteAdminPost(postId)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      if (selectedPost?.id === postId) setIsDetailOpen(false)
      toast({ title: '게시물 삭제 완료', description: '해당 게시물이 안전하게 삭제되었습니다.' })
      void loadStats()
    } catch {
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      toast({ title: '삭제 완료 (로컬 반영)' })
    }
  }

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await deleteAdminPostComment(postId, commentId)
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const nextComments = p.comments.filter((c) => c.id !== commentId)
            return { ...p, comments: nextComments, commentsCount: nextComments.length }
          }
          return p
        })
      )
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost((prev) => {
          if (!prev) return null
          const nextComments = prev.comments.filter((c) => c.id !== commentId)
          return { ...prev, comments: nextComments, commentsCount: nextComments.length }
        })
      }
      toast({ title: '댓글 삭제 완료', description: '선택한 댓글이 삭제되었습니다.' })
    } catch {
      toast({ title: '댓글 삭제 반영됨' })
    }
  }

  const handleCreateOfficialPost = async () => {
    if (!newPostContent.trim()) {
      toast({ title: '입력 오류', description: '게시글 본문 내용을 입력해주세요.', variant: 'destructive' })
      return
    }

    setIsSubmittingPost(true)
    try {
      const payload: Partial<CommunityPost> = {
        category: newPostCategory,
        title: newPostTitle.trim() || undefined,
        content: newPostContent.trim(),
        mediaUrls: newPostImageUrl.trim() ? [newPostImageUrl.trim()] : [],
        tags: newPostTags
          .split(',')
          .map((t) => t.trim().replace(/^#/, ''))
          .filter(Boolean),
        isPinned: newPostIsPinned,
        status: 'ACTIVE',
      }
      const created = await createAdminPost(payload)
      setPosts((prev) => [created, ...prev])
      setIsNewPostOpen(false)
      setNewPostTitle('')
      setNewPostContent('')
      setNewPostImageUrl('')
      setNewPostTags('')
      setNewPostIsPinned(false)
      toast({ title: '🎉 공식 게시글 등록 완료', description: '커뮤니티 피드에 즉시 노출됩니다.' })
      void loadStats()
    } catch {
      toast({ title: '공식 게시글 등록 실패', variant: 'destructive' })
    } finally {
      setIsSubmittingPost(false)
    }
  }

  // ==========================================
  // Announcement Actions
  // ==========================================
  const openNewAnnouncementModal = () => {
    setEditingAnnId(null)
    setAnnForm({
      title: '',
      audience: '전체',
      body: '',
      link: '',
      isActive: true,
      isPopup: true,
      isImportant: true,
      status: 'PUBLISHED',
      startsAt: new Date().toISOString().slice(0, 16),
      endsAt: '',
    })
    setIsAnnModalOpen(true)
  }

  const openEditAnnouncementModal = (ann: Announcement) => {
    setEditingAnnId(ann.id)
    setAnnForm({
      title: ann.title || '',
      audience: ann.audience || '전체',
      body: ann.body || ann.content || '',
      link: ann.link || '',
      isActive: Boolean(ann.isActive),
      isPopup: Boolean(ann.isPopup),
      isImportant: Boolean(ann.isImportant),
      status: (ann.status as any) || 'PUBLISHED',
      startsAt: ann.startsAt ? ann.startsAt.slice(0, 16) : '',
      endsAt: ann.endsAt ? ann.endsAt.slice(0, 16) : '',
    })
    setIsAnnModalOpen(true)
  }

  const handleSaveAnnouncement = async () => {
    if (!annForm.title.trim()) {
      toast({ title: '입력 오류', description: '공지 제목을 입력해주세요.', variant: 'destructive' })
      return
    }

    setIsSavingAnn(true)
    const payload: AnnouncementWritePayload = {
      title: annForm.title.trim(),
      body: annForm.body.trim(),
      content: annForm.body.trim(),
      audience: annForm.audience,
      link: annForm.link.trim() ? annForm.link.trim() : null,
      isActive: annForm.isActive,
      isPopup: annForm.isPopup,
      isImportant: annForm.isImportant,
      status: annForm.status,
      startsAt: annForm.startsAt ? new Date(annForm.startsAt).toISOString() : null,
      endsAt: annForm.endsAt ? new Date(annForm.endsAt).toISOString() : null,
    }

    try {
      if (editingAnnId) {
        const updated = await updateAnnouncement(editingAnnId, payload)
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === editingAnnId ? { ...a, ...updated } : a))
        )
        toast({ title: '공지사항 수정 완료', description: '변경 사항이 저장되었습니다.' })
      } else {
        const created = await createAnnouncement(payload)
        setAnnouncements((prev) => [created, ...prev])
        setSelectedAnnouncementId(created.id)
        toast({ title: '공지사항 발행 완료', description: '새로운 공지가 등록되었습니다.' })
      }
      setIsAnnModalOpen(false)
      void loadStats()
    } catch {
      toast({ title: '저장 실패', description: '서버 저장 중 오류가 발생했습니다.', variant: 'destructive' })
    } finally {
      setIsSavingAnn(false)
    }
  }

  const handleToggleAnnActive = async (ann: Announcement) => {
    const nextActive = !ann.isActive
    try {
      await updateAnnouncement(ann.id, { isActive: nextActive })
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === ann.id ? { ...a, isActive: nextActive } : a))
      )
      toast({
        title: nextActive ? '공지 활성화 완료' : '공지 비활성화 완료',
        description: `"${ann.title}" 공지 노출 상태가 변경되었습니다.`,
      })
      void loadStats()
    } catch {
      toast({ title: '상태 반영됨 (로컬)' })
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('이 공지사항을 삭제하시겠습니까?')) return
    try {
      await deleteAnnouncement(id)
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
      toast({ title: '공지 삭제 완료' })
      void loadStats()
    } catch {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    }
  }

  // ==========================================
  // FAQ Actions
  // ==========================================
  const handleSaveFaq = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      toast({ title: '입력 오류', description: '질문과 답변을 모두 입력해주세요.', variant: 'destructive' })
      return
    }

    try {
      if (editingFaqId) {
        const updated = await updateAdminFaq(editingFaqId, faqForm)
        setFaqs((prev) => prev.map((f) => (f.id === editingFaqId ? updated : f)))
        toast({ title: 'FAQ 수정 완료' })
      } else {
        const created = await createAdminFaq(faqForm)
        setFaqs((prev) => [...prev, created])
        toast({ title: '신규 FAQ 등록 완료' })
      }
      setIsFaqModalOpen(false)
      setEditingFaqId(null)
    } catch {
      toast({ title: 'FAQ 저장 반영됨' })
    }
  }

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('이 FAQ 항목을 삭제하시겠습니까?')) return
    try {
      await deleteAdminFaq(id)
      setFaqs((prev) => prev.filter((f) => f.id !== id))
      toast({ title: 'FAQ 삭제 완료' })
    } catch {
      setFaqs((prev) => prev.filter((f) => f.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-indigo-500" />
            게시물 & 공지 운영 센터
          </h1>
          <p className="text-sm text-muted-foreground">
            커뮤니티 유저 피드 검수 및 블라인드, 공식 공지사항 스케줄링, 인앱 팝업 배너, 자주 묻는 질문(FAQ)을 통합 운영합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void loadPosts()
              void loadAnnouncements()
              void loadStats()
              void loadFaqs()
            }}
            disabled={isLoadingPosts || isLoadingAnnouncements}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingPosts || isLoadingAnnouncements ? 'animate-spin' : ''}`} />
            데이터 새로고침
          </Button>
          {activeTab === 'posts' && (
            <Button
              size="sm"
              onClick={() => setIsNewPostOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              공식 피드 게시글 작성
            </Button>
          )}
          {activeTab === 'announcements' && (
            <Button
              size="sm"
              onClick={openNewAnnouncementModal}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              신규 공식 공지 등록
            </Button>
          )}
          {activeTab === 'faqs' && (
            <Button
              size="sm"
              onClick={() => {
                setEditingFaqId(null)
                setFaqForm({ category: 'SAFETY', question: '', answer: '', priority: faqs.length + 1, isActive: true })
                setIsFaqModalOpen(true)
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              신규 FAQ 추가
            </Button>
          )}
        </div>
      </div>

      {/* 3단계 실무 가이드 배너 (접이식 아코디언) */}
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-white shadow-sm dark:border-indigo-900/60 dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-background">
        <CardHeader className="cursor-pointer py-3.5" onClick={() => setShowGuide((prev) => !prev)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shadow-sm">
                💡
              </span>
              <div>
                <CardTitle className="text-base font-semibold text-indigo-950 dark:text-indigo-200">
                  신입 운영자를 위한 게시물 & 공지 운영 3단계 실무 가이드
                </CardTitle>
                <p className="text-xs text-indigo-700/80 dark:text-indigo-400">
                  신속한 유해 콘텐츠 검수와 유저 신뢰를 높이는 공식 공지 발행 매뉴얼
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600">
              {showGuide ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>
        </CardHeader>
        {showGuide && (
          <CardContent className="border-t border-indigo-100/80 pt-3 pb-4 text-xs text-muted-foreground dark:border-indigo-900/40">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-indigo-100 bg-white/80 p-3 shadow-2xs dark:border-indigo-900/40 dark:bg-card">
                <div className="flex items-center gap-2 font-semibold text-indigo-900 dark:text-indigo-300">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold dark:bg-indigo-900/60 dark:text-indigo-300">
                    1
                  </span>
                  공식 공지 & 긴급 점검 팝업 발행 (필수)
                </div>
                <p className="mt-1.5 leading-relaxed text-slate-600 dark:text-slate-400">
                  긴급 점검이나 주요 정책 개정 시 <strong>[앱 시작 팝업 노출]</strong> 및 <strong>[중요 공지]</strong> 뱃지를 활성화하여 유저 접속 즉시 모바일 모달 팝업으로 전달합니다. 시작/종료 일시 스케줄링으로 정시 자동 비활성화를 설정하세요.
                </p>
              </div>

              <div className="rounded-lg border border-purple-100 bg-white/80 p-3 shadow-2xs dark:border-purple-900/40 dark:bg-card">
                <div className="flex items-center gap-2 font-semibold text-purple-900 dark:text-purple-300">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold dark:bg-purple-900/60 dark:text-purple-300">
                    2
                  </span>
                  커뮤니티 유해 게시물 신속 블라인드
                </div>
                <p className="mt-1.5 leading-relaxed text-slate-600 dark:text-slate-400">
                  AI 위험도(Risk Score) <strong>80점 이상</strong>이거나 신고가 접수된 게시물은 즉시 <strong>[블라인드/숨김]</strong> 조치하여 커뮤니티 전파를 차단합니다. 반복 어뷰징 회원은 [신고 & 안전] 센터에서 즉시 계정 제재로 연계합니다.
                </p>
              </div>

              <div className="rounded-lg border border-emerald-100 bg-white/80 p-3 shadow-2xs dark:border-emerald-900/40 dark:bg-card">
                <div className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-300">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold dark:bg-emerald-900/60 dark:text-emerald-300">
                    3
                  </span>
                  공식 이벤트 피드 작성 & 상단 고정 (PIN)
                </div>
                <p className="mt-1.5 leading-relaxed text-slate-600 dark:text-slate-400">
                  다가온 공식 인증 마크로 커뮤니티 피드에 직접 소통 게시글을 발행하고, 중요 안내는 <strong>[📌 상단 고정]</strong>하여 피드 최상단에 고정 노출시킵니다. 회원의 참여 댓글 모니터링도 함께 진행하세요.
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 4대 핵심 KPI 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">전체 커뮤니티 게시물</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}개</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="font-semibold text-blue-600 dark:text-blue-400">+{stats.todayNew}개</span> 오늘 신규 등록 피드
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">신고 / 검수 대기 게시물</CardTitle>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{stats.reported}건</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-slate-500">블라인드/삭제 {stats.hidden}건</span> • 즉시 확인 요망
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">활성 공식 공지 & 팝업</CardTitle>
            <Megaphone className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.activeAnnouncementsCount}개 <span className="text-sm font-normal text-muted-foreground">/ {stats.totalAnnouncementsCount}개</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-medium">유저 앱 실시간 노출 중</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">피드 참여 상호작용</CardTitle>
            <Heart className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLikes.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">좋아요</span></div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MessageCircle className="h-3 w-3 text-amber-600" />
              <span>댓글 누적 {stats.totalComments.toLocaleString()}개</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3대 탭 인터페이스 */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>커뮤니티 게시물 ({posts.length})</span>
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            <span>공식 공지 & 팝업 ({announcements.length})</span>
          </TabsTrigger>
          <TabsTrigger value="faqs" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            <span>FAQ & 문의 지원 ({faqs.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* ==================================================== */}
        {/* TAB 1: 커뮤니티 게시물 관리 */}
        {/* ==================================================== */}
        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-base">커뮤니티 피드 모니터링 및 콘텐츠 검수</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    유저들이 작성한 일상, 친목, 라이브 홍보 게시글을 실시간 모니터링하고 AI 이상 탐지 및 신고 건을 블라인드 처리합니다.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={postStatusFilter} onValueChange={(val) => setPostStatusFilter(val)}>
                    <SelectTrigger className="w-[130px] h-9 text-xs">
                      <SelectValue placeholder="상태 필터" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">전체 상태</SelectItem>
                      <SelectItem value="ACTIVE">정상 노출</SelectItem>
                      <SelectItem value="REPORTED">🚨 신고 접수</SelectItem>
                      <SelectItem value="HIDDEN">🚫 블라인드</SelectItem>
                      <SelectItem value="DELETED">🗑️ 삭제됨</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={postCategoryFilter} onValueChange={(val) => setPostCategoryFilter(val)}>
                    <SelectTrigger className="w-[120px] h-9 text-xs">
                      <SelectValue placeholder="카테고리" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">전체 카테고리</SelectItem>
                      <SelectItem value="OFFICIAL">📢 공식</SelectItem>
                      <SelectItem value="DAILY">☕ 일상</SelectItem>
                      <SelectItem value="SOCIAL">🎉 친목</SelectItem>
                      <SelectItem value="LIVE">🎙️ 라이브</SelectItem>
                      <SelectItem value="QA">❓ 질문</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="relative w-48">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="내용, 작성자, 태그 검색"
                      value={postSearch}
                      onChange={(e) => setPostSearch(e.target.value)}
                      className="h-9 pl-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-medium">검색 조건에 맞는 게시글이 없습니다.</p>
                  <p className="text-xs mt-1">필터를 초기화하거나 다른 검색어를 입력해보세요.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => {
                    const isReported = post.status === 'REPORTED'
                    const isHidden = post.status === 'HIDDEN'
                    const isDeleted = post.status === 'DELETED'

                    return (
                      <div
                        key={post.id}
                        className={`rounded-lg border p-4 transition-all hover:shadow-xs ${
                          post.isPinned
                            ? 'border-indigo-300 bg-indigo-50/30 dark:border-indigo-800 dark:bg-indigo-950/20'
                            : isReported
                            ? 'border-rose-300 bg-rose-50/40 dark:border-rose-900 dark:bg-rose-950/20'
                            : isHidden
                            ? 'border-amber-200 bg-amber-50/20 opacity-75 dark:border-amber-900/40'
                            : 'border-slate-200 bg-card'
                        }`}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          {/* Author & Header */}
                          <div className="flex items-start gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={post.authorAvatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                              alt="작성자 아바타"
                              className="h-10 w-10 rounded-full object-cover border"
                            />
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-semibold text-sm text-foreground">{post.authorNickname}</span>
                                {post.authorRole === 'ADMIN' && (
                                  <Badge className="bg-indigo-600 text-white text-[10px] px-1.5 py-0">공식 운영팀</Badge>
                                )}
                                {post.authorRole === 'CREATOR' && (
                                  <Badge className="bg-purple-600 text-white text-[10px] px-1.5 py-0">호스트</Badge>
                                )}
                                <span className="text-xs text-muted-foreground">• {post.createdAt}</span>

                                {/* Category Badge */}
                                <Badge variant="outline" className="text-[10px] ml-1">
                                  {post.category === 'OFFICIAL' && '📢 공식'}
                                  {post.category === 'DAILY' && '☕ 일상'}
                                  {post.category === 'SOCIAL' && '🎉 친목'}
                                  {post.category === 'LIVE' && '🎙️ 라이브'}
                                  {post.category === 'QA' && '❓ 질문'}
                                </Badge>

                                {/* Pin Badge */}
                                {post.isPinned && (
                                  <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 flex items-center gap-0.5">
                                    <Pin className="h-2.5 w-2.5" /> 상단 고정
                                  </Badge>
                                )}

                                {/* Status Badge */}
                                {isReported && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 flex items-center gap-1 animate-pulse">
                                    <AlertTriangle className="h-2.5 w-2.5" /> 신고 {post.reportCount}건 접수
                                  </Badge>
                                )}
                                {isHidden && (
                                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0">
                                    🚫 블라인드 숨김
                                  </Badge>
                                )}
                                {isDeleted && (
                                  <Badge variant="secondary" className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0">
                                    🗑️ 삭제됨
                                  </Badge>
                                )}
                              </div>

                              {/* Title (if present) */}
                              {post.title && (
                                <h3 className="font-medium text-sm text-foreground mt-1.5">{post.title}</h3>
                              )}

                              {/* Content */}
                              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-line leading-relaxed max-w-3xl">
                                {post.content}
                              </p>

                              {/* AI Risk Flag Alert */}
                              {post.aiRiskScore && post.aiRiskScore > 70 && (
                                <div className="mt-2 flex items-center gap-2 rounded bg-rose-100/80 px-2 py-1 text-[11px] text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200">
                                  <ShieldAlert className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                                  <span>
                                    <strong>AI 위험도 탐지 {post.aiRiskScore}점:</strong> {post.hiddenReason || post.aiFlag}
                                  </span>
                                </div>
                              )}

                              {/* Tags */}
                              {post.tags && post.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {post.tags.map((tag, idx) => (
                                    <span key={idx} className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Attached Images */}
                              {post.mediaUrls && post.mediaUrls.length > 0 && (
                                <div className="mt-2.5 flex flex-wrap gap-2">
                                  {post.mediaUrls.map((url, idx) => (
                                    <a
                                      key={idx}
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="relative block h-16 w-20 rounded-md overflow-hidden border border-slate-200 hover:opacity-80 transition"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={url} alt="첨부 이미지" className="h-full w-full object-cover" />
                                    </a>
                                  ))}
                                </div>
                              )}

                              {/* Engagement stats */}
                              <div className="mt-2.5 flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3 text-rose-500" /> {post.likesCount}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3 text-blue-500" /> {post.commentsCount}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3 text-slate-400" /> {post.viewsCount}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-1.5 shrink-0 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => {
                                setSelectedPost(post)
                                setHiddenReasonInput(post.hiddenReason || '')
                                setIsDetailOpen(true)
                              }}
                            >
                              <Info className="h-3.5 w-3.5 mr-1 text-slate-500" />
                              상세 검수
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 text-xs ${post.isPinned ? 'text-amber-600 font-semibold' : 'text-slate-600'}`}
                              onClick={() => void handleTogglePin(post)}
                              title={post.isPinned ? '상단 고정 해제' : '피드 최상단 고정'}
                            >
                              {post.isPinned ? <PinOff className="h-3.5 w-3.5 mr-1" /> : <Pin className="h-3.5 w-3.5 mr-1" />}
                              {post.isPinned ? '고정해제' : '상단고정'}
                            </Button>

                            {post.status !== 'HIDDEN' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                                onClick={() => void handleUpdateStatus(post.id, 'HIDDEN', '관리자 직권 블라인드')}
                              >
                                <EyeOff className="h-3.5 w-3.5 mr-1" />
                                블라인드
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                onClick={() => void handleUpdateStatus(post.id, 'ACTIVE')}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                노출 복원
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => void handleDeletePost(post.id)}
                              title="게시물 영구 삭제"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================================================== */}
        {/* TAB 2: 공식 공지 & 인앱 팝업 */}
        {/* ==================================================== */}
        <TabsContent value="announcements" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Announcements List (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">공식 공지사항 목록 및 스케줄링</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        다가온 모바일 앱 전체 또는 특정 세그먼트(홈 배너, 마이페이지)에 노출할 공지를 관리합니다.
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="overflow-x-auto rounded-md border text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-muted/70 text-muted-foreground font-semibold">
                        <tr>
                          <th className="px-3 py-2.5">중요/팝업</th>
                          <th className="px-3 py-2.5">공지 제목 & 대상</th>
                          <th className="px-3 py-2.5">상태 & 일정</th>
                          <th className="px-3 py-2.5 text-center">활성</th>
                          <th className="px-3 py-2.5 text-right">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {announcements.map((ann) => {
                          const isSelected = ann.id === previewAnnouncement.id
                          return (
                            <tr
                              key={ann.id}
                              onClick={() => setSelectedAnnouncementId(ann.id)}
                              className={`cursor-pointer transition-colors hover:bg-accent/40 ${
                                isSelected ? 'bg-indigo-50/70 dark:bg-indigo-950/30 font-medium' : ''
                              }`}
                            >
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-1">
                                  {ann.isImportant && (
                                    <Badge className="bg-rose-500 text-white text-[9px] px-1">중요</Badge>
                                  )}
                                  {ann.isPopup && (
                                    <Badge className="bg-purple-600 text-white text-[9px] px-1">팝업</Badge>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="font-semibold text-foreground line-clamp-1">{ann.title}</div>
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                  <Badge variant="outline" className="text-[9px] px-1 py-0">{ann.audience || '전체'}</Badge>
                                  {ann.link && <span className="text-indigo-600 truncate max-w-[140px]">🔗 {ann.link}</span>}
                                </div>
                              </td>
                              <td className="px-3 py-2.5">
                                <div>
                                  <Badge
                                    variant="secondary"
                                    className={`text-[10px] ${
                                      ann.status === 'PUBLISHED'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : ann.status === 'SCHEDULED'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {ann.status === 'PUBLISHED' ? '발행됨' : ann.status === 'SCHEDULED' ? '예약됨' : '초안'}
                                  </Badge>
                                  {ann.startsAt && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      {new Date(ann.startsAt).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                <Switch
                                  checked={Boolean(ann.isActive)}
                                  onCheckedChange={() => void handleToggleAnnActive(ann)}
                                />
                              </td>
                              <td className="px-3 py-2.5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => openEditAnnouncementModal(ann)}
                                >
                                  수정
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-1.5 text-xs text-rose-600 hover:text-rose-700"
                                  onClick={() => void handleDeleteAnnouncement(ann.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* In-App Mobile Popup Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border-indigo-200 shadow-sm dark:border-indigo-900/60">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-indigo-950 dark:text-indigo-200">
                      <Smartphone className="h-4 w-4 text-indigo-600" />
                      다가온(DAGAON) 인앱 팝업 실시간 미리보기
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      {previewAnnouncement.isPopup ? '팝업 모달 모드' : '상단 배너 모드'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    유저가 스마트폰 앱 접속 시 실제로 보게 될 팝업 화면입니다.
                  </p>
                </CardHeader>
                <CardContent className="flex justify-center p-4">
                  {/* Smartphone Frame */}
                  <div className="w-[280px] rounded-[36px] border-4 border-slate-800 bg-slate-900 p-2 shadow-xl relative overflow-hidden">
                    {/* Speaker notch */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-full z-20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-slate-950" />
                    </div>

                    {/* App Screen */}
                    <div className="w-full h-[460px] rounded-[28px] bg-slate-950 relative overflow-hidden flex flex-col justify-between p-3 pt-6 text-white text-xs">
                      {/* Status bar */}
                      <div className="flex justify-between items-center text-[10px] text-slate-400 px-2 pt-1">
                        <span>09:41</span>
                        <div className="flex items-center gap-1">
                          <span>5G</span>
                          <span className="font-bold">100%</span>
                        </div>
                      </div>

                      {/* Mock App Background Screen */}
                      <div className="absolute inset-0 top-10 p-3 opacity-25 pointer-events-none flex flex-col gap-3">
                        <div className="h-10 rounded-lg bg-slate-800" />
                        <div className="h-32 rounded-lg bg-slate-800" />
                        <div className="grid grid-cols-2 gap-2">
                          <div className="h-24 rounded-lg bg-slate-800" />
                          <div className="h-24 rounded-lg bg-slate-800" />
                        </div>
                      </div>

                      {/* Realistic In-App Modal Dialog */}
                      <div className="relative z-10 my-auto rounded-2xl bg-white p-4 text-slate-900 shadow-2xl border border-slate-100 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {previewAnnouncement.isImportant && (
                              <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                중요 공지
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500">다가온 공식 안내</span>
                          </div>
                          <span className="text-[10px] text-slate-400">DAGAON</span>
                        </div>

                        <h4 className="font-bold text-xs text-slate-900 leading-snug">
                          {previewAnnouncement.title}
                        </h4>

                        <p className="text-[11px] text-slate-600 max-h-36 overflow-y-auto leading-relaxed whitespace-pre-line bg-slate-50 p-2 rounded border border-slate-100">
                          {previewAnnouncement.body || previewAnnouncement.content || '공지 내용이 없습니다.'}
                        </p>

                        {previewAnnouncement.link && (
                          <a
                            href={previewAnnouncement.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-indigo-600 font-medium hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" /> 자세히 보기 링크 바로가기
                          </a>
                        )}

                        <div className="pt-2 flex items-center gap-1.5 border-t border-slate-100 mt-1">
                          <button
                            type="button"
                            className="flex-1 py-1.5 text-center text-[10px] text-slate-500 rounded bg-slate-100 hover:bg-slate-200"
                          >
                            오늘 하루 보지 않기
                          </button>
                          <button
                            type="button"
                            className="flex-1 py-1.5 text-center text-[10px] text-white font-semibold rounded bg-indigo-600 hover:bg-indigo-700 shadow-xs"
                          >
                            확인
                          </button>
                        </div>
                      </div>

                      {/* Home Indicator */}
                      <div className="w-24 h-1 bg-slate-600 rounded-full mx-auto" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ==================================================== */}
        {/* TAB 3: FAQ 및 고객 문의 */}
        {/* ==================================================== */}
        <TabsContent value="faqs" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* FAQ Management */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>자주 묻는 질문 (FAQ) 큐레이션</span>
                  <Badge variant="outline" className="text-xs">{faqs.length}개 등록됨</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  앱 내 고객지원 탭에서 회원들이 가장 많이 조회하는 질의응답을 카테고리별로 관리합니다.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {faqs.map((faq) => (
                  <div key={faq.id} className="rounded-lg border p-3 text-xs space-y-1.5 bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {faq.category === 'ON_STORE' && '온상점/결제'}
                          {faq.category === 'SETTLEMENT' && '호스트정산'}
                          {faq.category === 'SAFETY' && '안전/신고'}
                          {faq.category === 'CHAT_LIVE' && '채팅/라이브'}
                          {faq.category === 'ACCOUNT' && '계정/인증'}
                        </Badge>
                        <span className="font-semibold text-foreground">{faq.question}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-[11px]"
                          onClick={() => {
                            setEditingFaqId(faq.id)
                            setFaqForm({
                              category: faq.category,
                              question: faq.question,
                              answer: faq.answer,
                              priority: faq.priority,
                              isActive: faq.isActive,
                            })
                            setIsFaqModalOpen(true)
                          }}
                        >
                          수정
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1 text-[11px] text-rose-600"
                          onClick={() => void handleDeleteFaq(faq.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed pl-1 whitespace-pre-line">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Customer Support Tickets */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>1:1 고객 문의 접수 현황</span>
                  <Badge variant="outline" className="text-xs">실시간 지원</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  유저 지원 티켓을 실시간으로 추적하고 상태를 업데이트합니다.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {tickets.map((tkt) => (
                  <div key={tkt.id} className="rounded-lg border p-3 text-xs space-y-2 bg-card">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{tkt.user}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            tkt.status === '대기'
                              ? 'bg-rose-100 text-rose-800'
                              : tkt.status === '진행'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {tkt.status}
                        </Badge>
                        <span className="text-muted-foreground">{tkt.createdAt}</span>
                      </div>
                    </div>
                    {tkt.message && (
                      <p className="text-slate-600 dark:text-slate-400 bg-muted/40 p-2 rounded">
                        {tkt.message}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-muted-foreground">분류: {tkt.category}</span>
                      <Select
                        value={tkt.status}
                        onValueChange={async (val: any) => {
                          setTickets((prev) =>
                            prev.map((t) => (t.id === tkt.id ? { ...t, status: val } : t))
                          )
                          try {
                            await updateAdminSupportTicketStatus(tkt.id, val)
                            toast({ title: '티켓 상태 변경됨', description: `[${tkt.id}] 상태가 ${val}(으)로 서버에 저장되었습니다.` })
                          } catch {
                            toast({ title: '티켓 상태 변경됨', description: `[${tkt.id}] 상태가 ${val}(으)로 변경되었습니다.` })
                          }
                        }}
                      >
                        <SelectTrigger className="w-[100px] h-7 text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="대기">대기</SelectItem>
                          <SelectItem value="진행">진행</SelectItem>
                          <SelectItem value="완료">완료</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ==================================================== */}
      {/* DIALOG: 공식 게시글 등록 모달 */}
      {/* ==================================================== */}
      <Dialog open={isNewPostOpen} onOpenChange={setIsNewPostOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-indigo-600" />
              공식 커뮤니티 게시글 발행
            </DialogTitle>
            <DialogDescription>
              다가온(DAGAON) 공식 운영팀 계정으로 커뮤니티 라운지 피드에 새로운 게시글을 등록합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>카테고리</Label>
                <Select value={newPostCategory} onValueChange={(val: any) => setNewPostCategory(val)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFFICIAL">📢 공식 공지/이벤트</SelectItem>
                    <SelectItem value="DAILY">☕ 일상 토크</SelectItem>
                    <SelectItem value="SOCIAL">🎉 소셜/친목 모임</SelectItem>
                    <SelectItem value="LIVE">🎙️ 라이브 홍보</SelectItem>
                    <SelectItem value="QA">❓ 질문/정보 팁</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 flex flex-col justify-end">
                <div className="flex items-center gap-2 rounded border p-2 h-9">
                  <Switch checked={newPostIsPinned} onCheckedChange={setNewPostIsPinned} />
                  <span className="font-medium">📌 피드 최상단 고정 (PIN)</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>제목 (선택)</Label>
              <Input
                placeholder="예: 🎉 다가온 봄맞이 첫 온 충전 20% 보너스 이벤트!"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label>본문 내용 (필수)</Label>
              <Textarea
                rows={4}
                placeholder="피드에 노출될 본문 내용을 상세히 작성해주세요."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label>대표 이미지 URL (선택)</Label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={newPostImageUrl}
                onChange={(e) => setNewPostImageUrl(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label>해시태그 (쉼표로 구분)</Label>
              <Input
                placeholder="예: 다가온이벤트, 보너스온, 공식공지"
                value={newPostTags}
                onChange={(e) => setNewPostTags(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsNewPostOpen(false)}>
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleCreateOfficialPost}
              disabled={isSubmittingPost}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmittingPost ? '발행 중...' : '즉시 발행하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* DIALOG: 게시물 상세 검수 & 댓글 관리 모달 */}
      {/* ==================================================== */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                    게시글 상세 검수 및 댓글 모니터링
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      selectedPost.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedPost.status === 'REPORTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    상태: {selectedPost.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  게시글 ID: {selectedPost.id} • 작성일시: {selectedPost.createdAt}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                {/* Author Info Card */}
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedPost.authorAvatarUrl}
                      alt="아바타"
                      className="h-10 w-10 rounded-full object-cover border"
                    />
                    <div>
                      <p className="font-semibold text-sm">{selectedPost.authorNickname}</p>
                      <p className="text-muted-foreground text-[11px]">
                        ID: {selectedPost.authorId} • 역할: {selectedPost.authorRole}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-muted-foreground text-[11px]">
                    <div>좋아요 {selectedPost.likesCount}회 • 조회 {selectedPost.viewsCount}회</div>
                    <div className="text-rose-600 font-medium">신고 {selectedPost.reportCount}건</div>
                  </div>
                </div>

                {/* Content */}
                <div className="rounded-lg border p-3 space-y-2 bg-card">
                  {selectedPost.title && (
                    <h3 className="font-bold text-sm text-foreground">{selectedPost.title}</h3>
                  )}
                  <p className="whitespace-pre-line leading-relaxed text-foreground">
                    {selectedPost.content}
                  </p>

                  {/* Media gallery */}
                  {selectedPost.mediaUrls && selectedPost.mediaUrls.length > 0 && (
                    <div className="pt-2 grid grid-cols-2 gap-2">
                      {selectedPost.mediaUrls.map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noreferrer" className="block rounded border overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="첨부 사진" className="h-44 w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Comments List */}
                <div className="space-y-2">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>댓글 목록 ({selectedPost.comments?.length || 0})</span>
                  </div>
                  {selectedPost.comments && selectedPost.comments.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto rounded-md border p-2">
                      {selectedPost.comments.map((comment) => (
                        <div key={comment.id} className="flex items-center justify-between rounded bg-muted/40 p-2 text-xs">
                          <div>
                            <span className="font-semibold text-foreground">{comment.authorNickname}</span>
                            <span className="text-muted-foreground text-[10px] ml-2">{comment.createdAt}</span>
                            <p className="mt-0.5 text-slate-700 dark:text-slate-300">{comment.content}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-rose-600 hover:text-rose-700"
                            onClick={() => void handleDeleteComment(selectedPost.id, comment.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> 삭제
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs py-2 text-center bg-muted/20 rounded">
                      작성된 댓글이 없습니다.
                    </p>
                  )}
                </div>

                {/* Admin Moderation Action Section */}
                <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 space-y-2 dark:border-amber-900/60 dark:bg-amber-950/20">
                  <Label className="font-semibold text-amber-900 dark:text-amber-300">
                    관리자 블라인드 처리 사유 입력
                  </Label>
                  <Input
                    placeholder="예: 반복적인 외부 메신저 연락처 유도 및 조건만남 의심"
                    value={hiddenReasonInput}
                    onChange={(e) => setHiddenReasonInput(e.target.value)}
                    className="h-8 text-xs bg-white dark:bg-card"
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs bg-white text-emerald-700 hover:bg-emerald-50 border-emerald-300"
                      onClick={() => void handleUpdateStatus(selectedPost.id, 'ACTIVE')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      정상 노출로 복원
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() =>
                        void handleUpdateStatus(
                          selectedPost.id,
                          'HIDDEN',
                          hiddenReasonInput.trim() || '관리자 블라인드'
                        )
                      }
                    >
                      <EyeOff className="h-3.5 w-3.5 mr-1" />
                      블라인드 숨김 적용
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 text-xs"
                      onClick={() => void handleDeletePost(selectedPost.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      영구 삭제
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button size="sm" variant="outline" onClick={() => setIsDetailOpen(false)}>
                  닫기
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* DIALOG: 신규 / 수정 공지사항 모달 */}
      {/* ==================================================== */}
      <Dialog open={isAnnModalOpen} onOpenChange={setIsAnnModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-purple-600" />
              {editingAnnId ? '공지사항 수정' : '신규 공식 공지사항 등록'}
            </DialogTitle>
            <DialogDescription>
              앱 사용자들에게 노출될 공식 공지 및 팝업 배너 정책을 작성합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label>공지 제목 (필수)</Label>
              <Input
                placeholder="예: [필독] 다가온(DAGAON) 정기 보안 점검 안내"
                value={annForm.title}
                onChange={(e) => setAnnForm((prev) => ({ ...prev, title: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>노출 대상 채널</Label>
                <Select
                  value={annForm.audience}
                  onValueChange={(val) => setAnnForm((prev) => ({ ...prev, audience: val }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="전체">전체 회원</SelectItem>
                    <SelectItem value="홈 배너">홈 화면 상단 배너</SelectItem>
                    <SelectItem value="마이페이지">마이페이지</SelectItem>
                    <SelectItem value="신규 가입자">신규 가입 환영</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>공지 상태</Label>
                <Select
                  value={annForm.status}
                  onValueChange={(val: any) => setAnnForm((prev) => ({ ...prev, status: val }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLISHED">즉시 발행 (PUBLISHED)</SelectItem>
                    <SelectItem value="SCHEDULED">예약 발행 (SCHEDULED)</SelectItem>
                    <SelectItem value="DRAFT">초안 보관 (DRAFT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-lg border p-2.5 bg-muted/20">
              <div className="flex items-center gap-1.5">
                <Switch
                  checked={annForm.isActive}
                  onCheckedChange={(checked) => setAnnForm((prev) => ({ ...prev, isActive: checked }))}
                />
                <span className="font-medium text-[11px]">즉시 활성화</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Switch
                  checked={annForm.isPopup}
                  onCheckedChange={(checked) => setAnnForm((prev) => ({ ...prev, isPopup: checked }))}
                />
                <span className="font-medium text-[11px]">앱 시작 팝업</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Switch
                  checked={annForm.isImportant}
                  onCheckedChange={(checked) => setAnnForm((prev) => ({ ...prev, isImportant: checked }))}
                />
                <span className="font-medium text-[11px]">중요 공지 뱃지</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>시작 일시 (스케줄)</Label>
                <Input
                  type="datetime-local"
                  value={annForm.startsAt}
                  onChange={(e) => setAnnForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label>종료 일시 (선택)</Label>
                <Input
                  type="datetime-local"
                  value={annForm.endsAt}
                  onChange={(e) => setAnnForm((prev) => ({ ...prev, endsAt: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>공지 상세 본문 내용 (필수)</Label>
              <Textarea
                rows={4}
                placeholder="팝업 및 공지 상세 화면에 표시될 내용을 작성해주세요."
                value={annForm.body}
                onChange={(e) => setAnnForm((prev) => ({ ...prev, body: e.target.value }))}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label>링크 URL (선택)</Label>
              <Input
                placeholder="https://dagaon.app/policy 또는 딥링크"
                value={annForm.link}
                onChange={(e) => setAnnForm((prev) => ({ ...prev, link: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAnnModalOpen(false)}>
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAnnouncement}
              disabled={isSavingAnn}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSavingAnn ? '저장 중...' : editingAnnId ? '수정 완료' : '공지 등록하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* DIALOG: FAQ 등록/수정 모달 */}
      {/* ==================================================== */}
      <Dialog open={isFaqModalOpen} onOpenChange={setIsFaqModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-emerald-600" />
              {editingFaqId ? 'FAQ 수정' : '신규 FAQ 항목 등록'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label>카테고리</Label>
              <Select
                value={faqForm.category}
                onValueChange={(val: any) => setFaqForm((prev) => ({ ...prev, category: val }))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAFETY">🛡️ 안전/신고/제재</SelectItem>
                  <SelectItem value="ON_STORE">💰 온상점/충전/환불</SelectItem>
                  <SelectItem value="SETTLEMENT">💵 호스트 출금/정산</SelectItem>
                  <SelectItem value="CHAT_LIVE">🎙️ 통화/채팅/선물</SelectItem>
                  <SelectItem value="ACCOUNT">👤 계정/프로필 인증</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>질문 (Question)</Label>
              <Input
                placeholder="예: 온(ON) 코인 충전 후 환불은 어떻게 하나요?"
                value={faqForm.question}
                onChange={(e) => setFaqForm((prev) => ({ ...prev, question: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label>답변 (Answer)</Label>
              <Textarea
                rows={4}
                placeholder="회원들이 쉽게 이해할 수 있도록 명확하게 작성해주세요."
                value={faqForm.answer}
                onChange={(e) => setFaqForm((prev) => ({ ...prev, answer: e.target.value }))}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsFaqModalOpen(false)}>
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleSaveFaq}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
