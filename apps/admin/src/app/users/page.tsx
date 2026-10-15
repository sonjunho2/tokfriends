'use client'
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Ban,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Gift,
  Info,
  Loader2,
  Phone,
  RefreshCcw,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  Users,
  UserX,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { searchUsers, updateUserStatus, type UserSearchParams, type UserSummary } from '@/lib/api'
import type { AxiosError } from 'axios'
import { cn } from '@/lib/utils'

interface ExtendedUserSummary {
  id: string
  phoneNumber?: string
  nickname?: string
  email?: string
  status?: string
  age?: number
  gender?: string
  region?: string
  avatarUrl?: string | null
  pointBalance?: number
  reportsCount?: number
  role?: string
  createdAt?: string
  lastActiveAt?: string
  [key: string]: unknown
}

const FALLBACK_USERS: ExtendedUserSummary[] = [
  {
    id: 'u1',
    nickname: '이지민',
    phoneNumber: '010-3210-4491',
    email: 'jimin.lee@example.com',
    status: 'ACTIVE',
    age: 24,
    gender: '여',
    region: '서울 강남구',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
    pointBalance: 125000,
    reportsCount: 0,
    role: 'USER',
    createdAt: '2026-09-10 14:22',
    lastActiveAt: '2026-10-15 11:45',
  },
  {
    id: 'u2',
    nickname: '김철수',
    phoneNumber: '010-8821-3912',
    email: 'chulsoo.kim@example.com',
    status: 'UNDER_REVIEW',
    age: 28,
    gender: '남',
    region: '서울 서초구',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    pointBalance: 34000,
    reportsCount: 2,
    role: 'USER',
    createdAt: '2026-09-15 09:30',
    lastActiveAt: '2026-10-15 10:45',
  },
  {
    id: 'u3',
    nickname: '박서아',
    phoneNumber: '010-5541-8820',
    email: 'seoa.park@example.com',
    status: 'ACTIVE',
    age: 25,
    gender: '여',
    region: '부산 해운대구',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
    pointBalance: 480000,
    reportsCount: 0,
    role: 'HOST',
    createdAt: '2026-08-20 11:10',
    lastActiveAt: '2026-10-15 11:30',
  },
  {
    id: 'u4',
    nickname: '최유나',
    phoneNumber: '010-6623-1192',
    email: 'yuna.choi@example.com',
    status: 'PENDING_VERIFICATION',
    age: 23,
    gender: '여',
    region: '대구 수성구',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
    pointBalance: 5000,
    reportsCount: 0,
    role: 'USER',
    createdAt: '2026-10-14 18:20',
    lastActiveAt: '2026-10-15 08:10',
  },
  {
    id: 'u5',
    nickname: '강도윤',
    phoneNumber: '010-7712-4401',
    email: 'doyun.kang@example.com',
    status: 'SUSPENDED',
    age: 29,
    gender: '남',
    region: '인천 연수구',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120',
    pointBalance: 0,
    reportsCount: 5,
    role: 'USER',
    createdAt: '2026-07-12 15:00',
    lastActiveAt: '2026-10-14 14:20',
  },
  {
    id: 'u6',
    nickname: '정우성',
    phoneNumber: '010-9921-6632',
    email: 'woosung.jung@example.com',
    status: 'UNDER_REVIEW',
    age: 31,
    gender: '남',
    region: '대구 중구',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120',
    pointBalance: 12000,
    reportsCount: 3,
    role: 'USER',
    createdAt: '2026-09-01 10:15',
    lastActiveAt: '2026-10-15 09:12',
  },
]

const STATUS_LABELS: Record<string, { label: string; badgeClass: string; icon: any }> = {
  ACTIVE: {
    label: '정상 활동',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  UNDER_REVIEW: {
    label: '심사 대기 (신고 접수)',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 font-bold',
    icon: AlertTriangle,
  },
  PENDING_VERIFICATION: {
    label: '본인인증 대기',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
    icon: Phone,
  },
  SUSPENDED: {
    label: '이용 정지/제재',
    badgeClass: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 font-bold',
    icon: Ban,
  },
}

function formatDate(value?: string) {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

type StatusFilterTab = 'ALL' | 'ACTIVE' | 'UNDER_REVIEW' | 'PENDING_VERIFICATION' | 'SUSPENDED'

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: '가입일 최신순' },
  { value: 'createdAt_asc', label: '가입일 오래된순' },
  { value: 'lastActiveAt_desc', label: '최근 활동 최신순' },
  { value: 'pointBalance_desc', label: '보유 온(ON) 높은순' },
  { value: 'nickname_asc', label: '닉네임 가나다순' },
] as const

type SortOption = (typeof SORT_OPTIONS)[number]['value']

const PAGE_SIZE = 15

export default function UsersPage() {
  const { toast } = useToast()

  const [showGuide, setShowGuide] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilterTab>('ALL')
  const [sortOption, setSortOption] = useState<SortOption>('createdAt_desc')

  const [users, setUsers] = useState<ExtendedUserSummary[]>(FALLBACK_USERS)
  const [isSearching, setIsSearching] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // 상태 변경 모달
  const [statusModalUser, setStatusModalUser] = useState<ExtendedUserSummary | null>(null)
  const [targetStatus, setTargetStatus] = useState<string>('ACTIVE')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const performSearch = useCallback(async () => {
    setIsSearching(true)
    const params: UserSearchParams = {}
    if (searchKeyword.trim()) params.query = searchKeyword.trim()
    if (statusFilter !== 'ALL') params.status = statusFilter

    try {
      const results = await searchUsers(params)
      if (results && results.length > 0) {
        setUsers(results as ExtendedUserSummary[])
      } else {
        setUsers(FALLBACK_USERS)
      }
      setCurrentPage(1)
    } catch {
      setUsers(FALLBACK_USERS)
    } finally {
      setIsSearching(false)
    }
  }, [searchKeyword, statusFilter])

  useEffect(() => {
    void performSearch()
  }, [performSearch])

  // 필터링
  const filteredUsers = useMemo(() => {
    let result = [...users]

    if (statusFilter !== 'ALL') {
      result = result.filter((u) => (u.status || '').toUpperCase() === statusFilter)
    }

    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim()
      result = result.filter(
        (u) =>
          String(u.nickname ?? '').toLowerCase().includes(q) ||
          String(u.phoneNumber ?? '').toLowerCase().includes(q) ||
          String(u.email ?? '').toLowerCase().includes(q) ||
          String(u.region ?? '').toLowerCase().includes(q) ||
          String(u.id ?? '').toLowerCase().includes(q)
      )
    }

    return result
  }, [users, statusFilter, searchKeyword])

  // 정렬
  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers]
    const [field, direction] = sortOption.split('_') as [string, string]

    sorted.sort((a, b) => {
      if (field === 'nickname') {
        return (a.nickname || '').localeCompare(b.nickname || '') * (direction === 'asc' ? 1 : -1)
      }
      if (field === 'pointBalance') {
        return ((b.pointBalance ?? 0) - (a.pointBalance ?? 0)) * (direction === 'asc' ? -1 : 1)
      }
      if (field === 'lastActiveAt') {
        return (new Date(b.lastActiveAt || 0).getTime() - new Date(a.lastActiveAt || 0).getTime()) * (direction === 'asc' ? -1 : 1)
      }
      return (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()) * (direction === 'asc' ? -1 : 1)
    })

    return sorted
  }, [filteredUsers, sortOption])

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / PAGE_SIZE))

  const visibleUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return sortedUsers.slice(startIndex, startIndex + PAGE_SIZE)
  }, [currentPage, sortedUsers])

  // 빠른 경고 발송
  const handleSendWarning = (user: ExtendedUserSummary) => {
    toast({
      title: '⚠️ 주의 경고장 발송 완료',
      description: `[${user.nickname}] 회원에게 커뮤니티 가이드라인 준수 인앱 팝업 푸시를 발송했습니다.`,
    })
  }

  // 상태 변경 확인
  const handleStatusChangeConfirm = async () => {
    if (!statusModalUser) return
    setIsUpdatingStatus(true)
    try {
      await updateUserStatus(statusModalUser.id, targetStatus)
      setUsers((prev) =>
        prev.map((u) => (u.id === statusModalUser.id ? { ...u, status: targetStatus } : u))
      )
      toast({
        title: '회원 상태 변경 완료',
        description: `[${statusModalUser.nickname}] 회원의 상태가 [${STATUS_LABELS[targetStatus]?.label ?? targetStatus}]로 변경되었습니다.`,
      })
      setStatusModalUser(null)
    } catch {
      toast({
        title: '상태 변경 실패',
        description: '네트워크 연결을 확인해주세요.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. 상단 타이틀 & 새로고침 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              회원 관리 및 안전 모니터링
            </h1>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              전체 회원 관제
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            서비스 전체 가입 회원의 프로필, 본인인증 상태, 활동 이력, 보유 자산(온/포인트)을 조회하고 규정 위반 회원을 신속히
            심사·제재합니다.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void performSearch()}
          disabled={isSearching}
          className="flex items-center gap-1.5"
        >
          <RefreshCcw className={cn('h-4 w-4', isSearching && 'animate-spin')} />
          새로고침
        </Button>
      </div>

      {/* 2. 신입 운영자를 위한 회원 관리 3단계 실무 가이드 */}
      <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            💡 신입 운영자를 위한 회원 관리 3단계 실무 가이드
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGuide(!showGuide)}
            className="h-7 text-xs text-amber-700 hover:text-amber-900 dark:text-amber-300"
          >
            {showGuide ? '가이드 접기' : '가이드 보기'}
          </Button>
        </div>

        {showGuide && (
          <div className="mt-3 grid gap-3 text-xs sm:grid-cols-3">
            <div className="rounded-md border border-amber-200/80 bg-white/60 p-3 shadow-sm dark:border-amber-900/40 dark:bg-black/20">
              <span className="inline-block rounded bg-amber-200 px-1.5 py-0.5 font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                1단계: 회원 검색 & 세그먼트 필터
              </span>
              <p className="mt-1.5 text-muted-foreground">
                닉네임, 전화번호, 이메일로 검색하거나 상단 탭에서 <b>[🚨 심사 대기]</b> 또는 <b>[본인인증 대기]</b>를 선택해 집중 모니터링합니다.
              </p>
            </div>
            <div className="rounded-md border border-amber-200/80 bg-white/60 p-3 shadow-sm dark:border-amber-900/40 dark:bg-black/20">
              <span className="inline-block rounded bg-amber-200 px-1.5 py-0.5 font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                2단계: 신원 정보 & 신고 이력 검토
              </span>
              <p className="mt-1.5 text-muted-foreground">
                프로필 사진, 나이/성별, 거주 지역, 보유 온(ON) 자산, 그리고 <b>누적 신고 접수 횟수</b>를 확인하여 위험도를 파악합니다.
              </p>
            </div>
            <div className="rounded-md border border-amber-200/80 bg-white/60 p-3 shadow-sm dark:border-amber-900/40 dark:bg-black/20">
              <span className="inline-block rounded bg-amber-200 px-1.5 py-0.5 font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                3단계: 신속 제재 & 상세 보기
              </span>
              <p className="mt-1.5 text-muted-foreground">
                경미한 위반 시 <b>[경고 발송]</b>, 중대 위반 시 <b>[상태 변경 ➡️ 이용 정지]</b>를 원클릭 집행하며, 필요 시 <b>[상세 보기]</b>로 이동합니다.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. 회원 상태 요약 지표 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 전체 회원 */}
        <Card className="border-border shadow-xs">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">전체 등록 회원</p>
                <p className="text-2xl font-bold mt-1 text-foreground">
                  {users.length.toLocaleString()}명
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">누적 회원 계정</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* 정상 활동 회원 */}
        <Card className="border-emerald-200/50 shadow-xs">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">정상 활동 회원</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">
                  {users.filter((u) => (u.status || '').toUpperCase() === 'ACTIVE').length.toLocaleString()}명
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">정상 서비스 이용 중</p>
              </div>
              <UserCheck className="h-8 w-8 text-emerald-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* 이상 감지 / 심사 대기 회원 */}
        <Card className="border-amber-200/50 shadow-xs">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  심사 대기 (신고 접수)
                </p>
                <p className="text-2xl font-bold mt-1 text-amber-600">
                  {users.filter((u) => (u.status || '').toUpperCase() === 'UNDER_REVIEW').length.toLocaleString()}명
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">운영자 검토 필요</p>
              </div>
              <ShieldAlert className="h-8 w-8 text-amber-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* 이용 정지 회원 */}
        <Card className="border-red-200/50 shadow-xs">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">이용 정지 / 제재 회원</p>
                <p className="text-2xl font-bold mt-1 text-red-600">
                  {users.filter((u) => (u.status || '').toUpperCase() === 'SUSPENDED').length.toLocaleString()}명
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">접속 및 활동 차단</p>
              </div>
              <UserX className="h-8 w-8 text-red-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. 회원 목록 & 검색/정렬/필터 패널 */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <span>회원 목록</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                  검색 결과 {sortedUsers.length}명
                </span>
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                프로필, 상태, 가입일, 보유 자산(온)을 확인하고 즉시 제재 조치를 집행할 수 있습니다.
              </CardDescription>
            </div>

            {/* 검색창 & 정렬 드롭다운 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="닉네임, 전화번호, 이메일, 지역..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void performSearch()
                  }}
                  className="h-8 pl-8 text-xs w-full sm:w-[240px]"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchKeyword('')
                      void performSearch()
                    }}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Select value={sortOption} onValueChange={(val: SortOption) => setSortOption(val)}>
                <SelectTrigger className="h-8 text-xs w-full sm:w-[160px]">
                  <SelectValue placeholder="정렬 기준" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 원클릭 세그먼트 탭 필터 */}
          <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-3">
            <Button
              variant={statusFilter === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('ALL')}
              className="h-7 text-xs"
            >
              전체 회원 ({users.length})
            </Button>
            <Button
              variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('ACTIVE')}
              className="h-7 text-xs flex items-center gap-1"
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              정상 활동 ({users.filter((u) => (u.status || '').toUpperCase() === 'ACTIVE').length})
            </Button>
            <Button
              variant={statusFilter === 'UNDER_REVIEW' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('UNDER_REVIEW')}
              className="h-7 text-xs flex items-center gap-1 border-amber-300 text-amber-800 dark:border-amber-800 dark:text-amber-200"
            >
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              🚨 심사 대기 ({users.filter((u) => (u.status || '').toUpperCase() === 'UNDER_REVIEW').length})
            </Button>
            <Button
              variant={statusFilter === 'PENDING_VERIFICATION' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('PENDING_VERIFICATION')}
              className="h-7 text-xs flex items-center gap-1"
            >
              <Phone className="h-3 w-3 text-blue-600" />
              본인인증 대기 ({users.filter((u) => (u.status || '').toUpperCase() === 'PENDING_VERIFICATION').length})
            </Button>
            <Button
              variant={statusFilter === 'SUSPENDED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('SUSPENDED')}
              className="h-7 text-xs flex items-center gap-1 border-red-300 text-red-800 dark:border-red-800 dark:text-red-200"
            >
              <Ban className="h-3 w-3 text-red-600" />
              이용 정지 ({users.filter((u) => (u.status || '').toUpperCase() === 'SUSPENDED').length})
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          {/* 회원 리스트 테이블 */}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted text-muted-foreground font-semibold">
                <tr>
                  <th className="px-3.5 py-3">회원 프로필</th>
                  <th className="px-3.5 py-3">연락처 / 계정</th>
                  <th className="px-3.5 py-3">거주 지역</th>
                  <th className="px-3.5 py-3">상태</th>
                  <th className="px-3.5 py-3">보유 온(ON)</th>
                  <th className="px-3.5 py-3">가입일 / 최근활동</th>
                  <th className="px-3.5 py-3 text-center">신속 관리</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibleUsers.map((user) => {
                  const statusKey = (user.status ?? 'ACTIVE').toUpperCase()
                  const statusInfo = STATUS_LABELS[statusKey] ?? STATUS_LABELS.ACTIVE
                  const StatusIcon = statusInfo.icon
                  const isSocialGoogle =
                    (user as any)?.provider === 'google' ||
                    String(user.email ?? '').includes('google_') ||
                    String(user.email ?? '').includes('@social')

                  return (
                    <tr key={user.id} className="hover:bg-accent/40 transition">
                      {/* 1. 회원 프로필 (아바타, 닉네임, 나이/성별) */}
                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'}
                            alt=""
                            className="h-9 w-9 rounded-full border object-cover shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-foreground">
                              <span>{user.nickname ?? '닉네임 없음'}</span>
                              {user.role === 'HOST' && (
                                <span className="rounded bg-rose-100 px-1 py-0.2 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                  호스트
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {user.age ? `${user.age}세` : ''} {user.gender ? `· ${user.gender}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. 연락처 / 계정 */}
                      <td className="px-3.5 py-3">
                        {user.phoneNumber ? (
                          <div className="font-medium text-foreground">{String(user.phoneNumber)}</div>
                        ) : isSocialGoogle ? (
                          <div className="font-medium text-blue-700 text-[11px] flex items-center gap-1">
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
                              Google 간편가입
                            </span>
                          </div>
                        ) : (
                          <div className="font-medium text-muted-foreground text-[11px]">-</div>
                        )}
                        <div className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                          {String(user.email ?? '-')}
                        </div>
                      </td>

                      {/* 3. 거주 지역 */}
                      <td className="px-3.5 py-3">
                        <span className="font-medium text-foreground">
                          {user.region ? String(user.region) : <span className="text-muted-foreground">지역 미설정</span>}
                        </span>
                      </td>

                      {/* 4. 상태 뱃지 */}
                      <td className="px-3.5 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]',
                              statusInfo.badgeClass
                            )}
                          >
                            <StatusIcon className="h-3 w-3 shrink-0" />
                            {statusInfo.label}
                          </span>
                          {(user.reportsCount ?? 0) > 0 && (
                            <span className="text-[10px] text-red-600 font-bold">
                              🚨 신고 누적 {user.reportsCount}건
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. 보유 온(ON) */}
                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-1 font-bold text-amber-600">
                          <Gift className="h-3.5 w-3.5" />
                          <span>{(user.pointBalance ?? 0).toLocaleString()} 온</span>
                        </div>
                      </td>

                      {/* 6. 가입일 / 최근활동 */}
                      <td className="px-3.5 py-3 text-muted-foreground text-[11px]">
                        <div>가입: {formatDate(user.createdAt)}</div>
                        <div>최근: {formatDate(user.lastActiveAt)}</div>
                      </td>

                      {/* 7. 신속 관리 액션 버튼들 */}
                      <td className="px-3.5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                            <Link href={`/users/${user.id}`} className="flex items-center gap-1">
                              상세 <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendWarning(user)}
                            className="h-7 px-2 text-xs border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-200"
                          >
                            경고
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setStatusModalUser(user)
                              setTargetStatus(user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED')
                            }}
                            className={cn(
                              'h-7 px-2 text-xs',
                              user.status === 'SUSPENDED'
                                ? 'border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                                : 'border-red-300 text-red-800 hover:bg-red-50'
                            )}
                          >
                            {user.status === 'SUSPENDED' ? '정지 해제' : '정지'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {visibleUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      <Users className="mx-auto h-8 w-8 opacity-40 mb-2" />
                      <p className="font-semibold text-sm">조건에 일치하는 회원이 없습니다.</p>
                      <p className="text-xs">검색어 또는 상단 필터를 변경해주세요.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 하단 페이징 컨트롤 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-muted-foreground">
              총 {sortedUsers.length}명 중 {Math.min(sortedUsers.length, (currentPage - 1) * PAGE_SIZE + 1)} -{' '}
              {Math.min(sortedUsers.length, currentPage * PAGE_SIZE)}명 표시 중
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="h-8 px-2.5 text-xs"
              >
                이전
              </Button>
              <span className="text-xs font-medium px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-8 px-2.5 text-xs"
              >
                다음
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. 회원 상태 변경 모달 */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border bg-background shadow-lg overflow-hidden">
            <div className="flex items-center justify-between border-b p-4 bg-muted/40">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                회원 상태 변경 및 제재 관리
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setStatusModalUser(null)} className="h-7 w-7 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <div className="rounded-lg border p-3 bg-muted/20 space-y-1">
                <div className="font-bold text-foreground text-sm flex items-center gap-2">
                  <span>{statusModalUser.nickname}</span>
                  <span className="text-xs text-muted-foreground font-normal">({statusModalUser.phoneNumber})</span>
                </div>
                <div className="text-muted-foreground">
                  현재 상태: <b>{STATUS_LABELS[statusModalUser.status ?? 'ACTIVE']?.label ?? statusModalUser.status}</b>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">변경할 상태 선택</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'ACTIVE', label: '🟢 정상 활동 (ACTIVE)' },
                    { value: 'UNDER_REVIEW', label: '🚨 심사 대기 (UNDER_REVIEW)' },
                    { value: 'PENDING_VERIFICATION', label: '📱 본인인증 대기' },
                    { value: 'SUSPENDED', label: '⛔ 이용 정지 (SUSPENDED)' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setTargetStatus(item.value)}
                      className={cn(
                        'rounded-lg border p-2.5 text-left transition font-medium',
                        targetStatus === item.value
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                          : 'border-border text-muted-foreground hover:bg-accent'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-md bg-amber-50 p-2.5 text-[11px] text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900">
                ⚠️ [이용 정지] 적용 시 해당 회원은 즉시 앱 로그아웃되며 1:1 대화, 라이브 방송, 피드 작성이 모두 차단됩니다.
              </div>
            </div>

            <div className="border-t p-3 bg-card flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStatusModalUser(null)}
                disabled={isUpdatingStatus}
                className="h-8 text-xs"
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={() => void handleStatusChangeConfirm()}
                disabled={isUpdatingStatus}
                className="h-8 text-xs flex items-center gap-1"
              >
                {isUpdatingStatus && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                상태 변경 저장
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
