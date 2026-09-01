'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { searchUsers, type UserSearchParams, type UserSummary } from '@/lib/api'
import type { AxiosError } from 'axios'

const STATUS_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'PENDING_VERIFICATION', label: 'PENDING_VERIFICATION' },
  { value: 'UNDER_REVIEW', label: 'UNDER_REVIEW' },
  { value: 'SUSPENDED', label: 'SUSPENDED' },
] as const

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: '가입일 최신순' },
  { value: 'createdAt_asc', label: '가입일 오래된순' },
  { value: 'lastActiveAt_desc', label: '최근 활동 최신순' },
  { value: 'lastActiveAt_asc', label: '최근 활동 오래된순' },
  { value: 'nickname_asc', label: '닉네임 가나다순' },
] as const

const DATE_TYPE_OPTIONS = [
  { value: 'createdAt', label: '가입일' },
  { value: 'lastActiveAt', label: '최근 활동일' },
] as const

const PAGE_SIZE = 20

type StatusFilter = (typeof STATUS_OPTIONS)[number]['value']
type SortOption = (typeof SORT_OPTIONS)[number]['value']
type DateType = (typeof DATE_TYPE_OPTIONS)[number]['value']

function normalizeDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('ko-KR')
}

function compareValues(a?: string, b?: string) {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  return a.localeCompare(b)
}

function parseDate(value?: string) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export default function UsersPage() {
  const { toast } = useToast()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [dateType, setDateType] = useState<DateType>('createdAt')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('createdAt_desc')
  
  const [users, setUsers] = useState<UserSummary[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const filteredUsers = useMemo(() => {
    let result = [...users]

    if (statusFilter !== 'ALL') {
      result = result.filter((user) => user.status?.toUpperCase() === statusFilter)
    }

    const start = dateStart ? new Date(dateStart) : null
    const end = dateEnd ? new Date(dateEnd) : null
    if (start || end) {
      result = result.filter((user) => {
        const target = dateType === 'createdAt' ? user.createdAt : user.lastActiveAt
        const parsed = parseDate(target)
        if (!parsed) return false
        if (start && parsed < start) return false
        if (end && parsed > end) return false
        return true
      })
    }

    return result
  }, [users, statusFilter, dateStart, dateEnd, dateType])

  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers]
    const [field, direction] = sortOption.split('_') as [string, string]

    sorted.sort((a, b) => {
      if (field === 'nickname') {
        return compareValues(a.nickname, b.nickname) * (direction === 'asc' ? 1 : -1)
      }
      if (field === 'lastActiveAt') {
        return compareValues(a.lastActiveAt, b.lastActiveAt) * (direction === 'asc' ? 1 : -1)
      }
      return compareValues(a.createdAt, b.createdAt) * (direction === 'asc' ? 1 : -1)
    })

    return sorted
  }, [filteredUsers, sortOption])

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / PAGE_SIZE))

  const visibleUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return sortedUsers.slice(startIndex, startIndex + PAGE_SIZE)
  }, [currentPage, sortedUsers])

  useEffect(() => {
    void performSearch(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function performSearch(initial = false) {
    const params: UserSearchParams = {}
    if (searchKeyword.trim()) params.query = searchKeyword.trim()
    if (statusFilter !== 'ALL') params.status = statusFilter
    if (dateStart) params.startDate = dateStart
    if (dateEnd) params.endDate = dateEnd
    if (dateType) params.dateType = dateType
    
    setIsSearching(true)
    try {
      const results = await searchUsers(params)
      setUsers(results)
      setCurrentPage(1)
      if (results.length === 0 && !initial) {
        toast({ title: '검색 결과 없음', description: '조건에 해당하는 사용자가 없습니다.' })
      }
    } catch (error) {
      const ax = error as AxiosError | undefined
      const status = ax?.response?.status
      const fallbackMessage = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
      const message =
        status && [404, 500].includes(status)
          ? fallbackMessage
          : ((ax?.response?.data as any)?.message || ax?.message || fallbackMessage)
      toast({
        title: '사용자 조회 실패',
        description: Array.isArray(message) ? message.join(', ') : String(message),
        variant: 'destructive',
      })
      if (initial) {
        setUsers([])
      }
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" /> 사용자 검색
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            전화번호, 닉네임, 이메일 키워드와 상태/기간 필터로 사용자 목록을 찾습니다. 검색은 `GET /users/search`
            엔드포인트와 연동됩니다.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="user-keyword">검색어</Label>
              <Input
                id="user-keyword"
                placeholder="전화번호, 닉네임, 이메일"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-status">상태</Label>
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger id="user-status">
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-type">기간 기준</Label>
              <Select value={dateType} onValueChange={(value: DateType) => setDateType(value)}>
                <SelectTrigger id="date-type">
                  <SelectValue placeholder="기간 기준" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date-start">시작일</Label>
              <Input
                id="date-start"
                type="date"
                value={dateStart}
                onChange={(event) => setDateStart(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-end">종료일</Label>
              <Input
                id="date-end"
                type="date"
                value={dateEnd}
                onChange={(event) => setDateEnd(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => performSearch()} disabled={isSearching}>
              {isSearching ? '검색 중...' : '검색'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearchKeyword('')
                setStatusFilter('ALL')
                setDateStart('')
                setDateEnd('')
                setDateType('createdAt')
                void performSearch()
              }}
              disabled={isSearching}
            >
              초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>사용자 목록</CardTitle>
            <p className="text-sm text-muted-foreground">페이지당 20명씩 정렬/페이징 처리된 결과를 확인합니다.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>
                페이지 {currentPage} / {totalPages}
              </span>
            </div>
            <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="정렬 기준" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">총 {sortedUsers.length}명</div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
              >
                이전
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
              >
                다음
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">전화번호</th>
                  <th className="px-3 py-2 font-medium">닉네임</th>
                  <th className="px-3 py-2 font-medium">상태</th>
                  <th className="px-3 py-2 font-medium">가입일</th>
                  <th className="px-3 py-2 font-medium">최근 활동일</th>
                  <th className="px-3 py-2 font-medium">상세</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id} className="border-t hover:bg-accent/40">
                    <td className="px-3 py-2 font-medium">{user.phoneNumber ?? '-'}</td>
                    <td className="px-3 py-2">{user.nickname ?? '-'}</td>
                    <td className="px-3 py-2 text-xs uppercase tracking-wide">{user.status ?? '-'}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{normalizeDate(user.createdAt)}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{normalizeDate(user.lastActiveAt)}</td>
                    <td className="px-3 py-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/users/${user.id}`}>상세 보기</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {visibleUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                      표시할 사용자가 없습니다. 조건을 바꾸고 다시 검색해주세요.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
