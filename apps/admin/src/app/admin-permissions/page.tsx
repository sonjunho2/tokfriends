'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Key,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  createAdminApprovalRequest,
  decideAdminApproval,
  getAdminApprovals,
  getAdminAuditLogs,
  getAdminProfiles,
  updateAdminProfile,
  type AdminApprovalItem,
  type AdminAuditLogItem,
  type AdminProfileItem,
} from '@/lib/api'
import type { AxiosError } from 'axios'

const APPROVAL_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', label: '결재 대기' },
  APPROVED: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '승인 완료' },
  REJECTED: { bg: 'bg-rose-100', text: 'text-rose-700', label: '반려' },
  CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-600', label: '만료/취소' },
}

const AVAILABLE_PERMISSIONS = [
  'users.manage',
  'reports.view',
  'content.manage',
  'refunds.view',
  'refunds.manage',
  'approvals.view',
  'approvals.manage',
  'settings.manage',
]

const ROLE_OPTIONS = [
  'SUPER_ADMIN',
  'MANAGER',
  'MODERATOR',
  'SUPPORT',
  'EDITOR',
  'VIEWER',
]

export default function AdminPermissionsPage() {
  const { toast } = useToast()

  // Tab 1: Approvals
  const [approvals, setApprovals] = useState<AdminApprovalItem[]>([])
  const [approvalsLoading, setApprovalsLoading] = useState(false)
  const [approvalFilter, setApprovalFilter] = useState('ALL')
  const [approvalSearch, setApprovalSearch] = useState('')
  const [actioningApprovalId, setActioningApprovalId] = useState<string | null>(null)

  // Decision Modal
  const [decisionModal, setDecisionModal] = useState<{
    item: AdminApprovalItem
    decision: 'APPROVED' | 'REJECTED'
  } | null>(null)
  const [decisionReason, setDecisionReason] = useState('')

  // New Request Modal
  const [newRequestModal, setNewRequestModal] = useState(false)
  const [newRequestAction, setNewRequestAction] = useState('USER_ROLE_CHANGE')
  const [newRequestTarget, setNewRequestTarget] = useState('')
  const [newRequestReason, setNewRequestReason] = useState('')
  const [creatingRequest, setCreatingRequest] = useState(false)

  // Tab 2: Admin Profiles
  const [profiles, setProfiles] = useState<AdminProfileItem[]>([])
  const [profilesLoading, setProfilesLoading] = useState(false)
  const [editingProfile, setEditingProfile] = useState<AdminProfileItem | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editPermissions, setEditPermissions] = useState<string[]>([])
  const [savingProfile, setSavingProfile] = useState(false)

  // Tab 3: Audit Logs
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogItem[]>([])
  const [auditLoading, setAuditLoading] = useState(false)

  const loadApprovals = useCallback(async (status?: string) => {
    setApprovalsLoading(true)
    try {
      const data = await getAdminApprovals(status === 'ALL' ? undefined : status)
      setApprovals(data)
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '결재 목록 로드 실패',
        description: (ax?.response?.data as any)?.message || '목록을 불러오지 못했습니다.',
        variant: 'destructive',
      })
    } finally {
      setApprovalsLoading(false)
    }
  }, [toast])

  const loadProfiles = useCallback(async () => {
    setProfilesLoading(true)
    try {
      const data = await getAdminProfiles()
      setProfiles(data)
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '관리자 프로필 로드 실패',
        description: (ax?.response?.data as any)?.message || '관리자 목록을 불러오지 못했습니다.',
        variant: 'destructive',
      })
    } finally {
      setProfilesLoading(false)
    }
  }, [toast])

  const loadAuditLogs = useCallback(async () => {
    setAuditLoading(true)
    try {
      const data = await getAdminAuditLogs(60)
      setAuditLogs(data)
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '감사 로그 로드 실패',
        description: (ax?.response?.data as any)?.message || '감사 로그를 불러오지 못했습니다.',
        variant: 'destructive',
      })
    } finally {
      setAuditLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadApprovals(approvalFilter)
    void loadProfiles()
    void loadAuditLogs()
  }, [loadApprovals, loadProfiles, loadAuditLogs, approvalFilter])

  const handleDecisionConfirm = async () => {
    if (!decisionModal) return
    const { item, decision } = decisionModal
    setActioningApprovalId(item.id)
    try {
      const updated = await decideAdminApproval(item.id, decision, decisionReason.trim() || undefined)
      setApprovals((prev) => prev.map((a) => (a.id === item.id ? updated : a)))
      toast({
        title: decision === 'APPROVED' ? '결재 승인 완료' : '결재 반려 완료',
        description: `요청 "${item.action}" 건이 ${decision === 'APPROVED' ? '승인' : '반려'}되었습니다.`,
      })
      setDecisionModal(null)
      setDecisionReason('')
      void loadAuditLogs()
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '결재 처리 실패',
        description: (ax?.response?.data as any)?.message || '처리에 실패했습니다. (자신이 요청한 건은 결재할 수 없습니다)',
        variant: 'destructive',
      })
    } finally {
      setActioningApprovalId(null)
    }
  }

  const handleCreateRequest = async () => {
    if (!newRequestTarget.trim() || !newRequestReason.trim()) {
      toast({ title: '입력 필요', description: '대상과 사유를 모두 입력해주세요.', variant: 'destructive' })
      return
    }
    setCreatingRequest(true)
    try {
      const created = await createAdminApprovalRequest({
        action: newRequestAction,
        target: newRequestTarget.trim(),
        reason: newRequestReason.trim(),
      })
      setApprovals((prev) => [created, ...prev])
      toast({ title: '결재 요청 등록 완료', description: '동료 관리자의 승인을 기다립니다.' })
      setNewRequestModal(false)
      setNewRequestTarget('')
      setNewRequestReason('')
      void loadAuditLogs()
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '결재 요청 실패',
        description: (ax?.response?.data as any)?.message || '요청 생성에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setCreatingRequest(false)
    }
  }

  const handleOpenEditProfile = (p: AdminProfileItem) => {
    setEditingProfile(p)
    setEditRole(p.role)
    setEditStatus(p.status)
    setEditPermissions([...p.permissions])
  }

  const handleSaveProfile = async () => {
    if (!editingProfile) return
    setSavingProfile(true)
    try {
      const updated = await updateAdminProfile(editingProfile.userId, {
        role: editRole,
        status: editStatus,
        permissions: editPermissions,
      })
      setProfiles((prev) => prev.map((p) => (p.userId === editingProfile.userId ? updated : p)))
      toast({ title: '권한 설정 저장 완료', description: `${editingProfile.user?.displayName || '관리자'}의 역할/권한이 저장되었습니다.` })
      setEditingProfile(null)
      void loadAuditLogs()
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '저장 실패',
        description: (ax?.response?.data as any)?.message || '권한 저장에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const togglePermission = (perm: string) => {
    setEditPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    )
  }

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'PENDING').length
  const activeAdminsCount = profiles.filter((p) => p.status === 'ACTIVE').length
  const superAdminsCount = profiles.filter((p) => p.role === 'SUPER_ADMIN').length

  const filteredApprovals = approvals.filter((a) => {
    const q = approvalSearch.toLowerCase().trim()
    if (!q) return true
    return (
      a.action.toLowerCase().includes(q) ||
      a.target.toLowerCase().includes(q) ||
      a.reason.toLowerCase().includes(q) ||
      a.requestedBy.email.toLowerCase().includes(q) ||
      (a.requestedBy.displayName || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            관리자 권한 및 4-Eyes 결재 센터
          </h1>
          <p className="text-sm text-muted-foreground">
            관리자 역할(RBAC), 2인 결재(Dual-Control) 승인 워크플로우, 보안 감사 로그를 통합 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setNewRequestModal(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            결재 요청 등록
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void loadApprovals(approvalFilter)
              void loadProfiles()
              void loadAuditLogs()
            }}
            disabled={approvalsLoading || profilesLoading || auditLoading}
          >
            {approvalsLoading || profilesLoading || auditLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={pendingApprovalsCount > 0 ? 'border-amber-300' : ''}>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">대기 중인 결재 요청</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">
                  {approvalsLoading ? '—' : `${pendingApprovalsCount}건`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">상호 교차 승인 필요</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">활성 관리자 계정</p>
                <p className="text-2xl font-bold mt-1">
                  {profilesLoading ? '—' : `${activeAdminsCount}명`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">전체 {profiles.length}명 중</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">슈퍼 관리자 (Super Admin)</p>
                <p className="text-2xl font-bold mt-1 text-primary">
                  {profilesLoading ? '—' : `${superAdminsCount}명`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">모든 권한 보유</p>
              </div>
              <Shield className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">기록된 감사 로그</p>
                <p className="text-2xl font-bold mt-1">
                  {auditLoading ? '—' : `${auditLogs.length}건`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">최근 보안 활동 기록</p>
              </div>
              <FileText className="h-8 w-8 text-emerald-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="approvals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="approvals" className="flex items-center gap-1.5">
            <UserCheck className="h-4 w-4" />
            결재 승인 (Dual-Control)
            {pendingApprovalsCount > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] text-white">
                {pendingApprovalsCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="profiles" className="flex items-center gap-1.5">
            <Key className="h-4 w-4" />
            관리자 역할 및 권한
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4" />
            감사 로그 스트림
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Approvals */}
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
              <div>
                <CardTitle className="text-lg">4-Eyes 결재 승인 요청 목록</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  고위험 작업(권한 변경, 환불, 환경 설정 등)은 요청자 본인 외 다른 관리자의 승인이 필수입니다.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-48 sm:w-60">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="작업, 대상, 사유, 요청자..."
                    value={approvalSearch}
                    onChange={(e) => setApprovalSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue placeholder="상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체 상태</SelectItem>
                    <SelectItem value="PENDING">결재 대기</SelectItem>
                    <SelectItem value="APPROVED">승인 완료</SelectItem>
                    <SelectItem value="REJECTED">반려됨</SelectItem>
                    <SelectItem value="CANCELLED">취소/만료</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {approvalsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredApprovals.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">조회된 결재 요청이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {filteredApprovals.map((item) => {
                    const st = APPROVAL_STATUS_STYLES[item.status] ?? {
                      bg: 'bg-muted',
                      text: 'text-muted-foreground',
                      label: item.status,
                    }
                    const isPending = item.status === 'PENDING'
                    const isActioning = actioningApprovalId === item.id

                    return (
                      <div
                        key={item.id}
                        className="rounded-lg border p-4 transition-colors hover:bg-muted/40 space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${st.bg} ${st.text}`}>
                              {st.label}
                            </span>
                            <span className="font-bold text-sm text-foreground">{item.action}</span>
                            <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                              {item.target}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            요청: {new Date(item.createdAt).toLocaleString('ko-KR')}
                            {item.decidedAt && (
                              <span className="ml-2">
                                | 결재: {new Date(item.decidedAt).toLocaleString('ko-KR')}
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="text-xs bg-muted/60 rounded p-2.5 text-foreground space-y-1">
                          <div>
                            <span className="font-semibold text-muted-foreground">요청 사유: </span>
                            {item.reason}
                          </div>
                          {item.decisionReason && (
                            <div>
                              <span className="font-semibold text-muted-foreground">결재 코멘트: </span>
                              {item.decisionReason}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground pt-1">
                          <div className="flex items-center gap-4">
                            <span>
                              <span className="font-medium text-foreground">요청자: </span>
                              {item.requestedBy.displayName || item.requestedBy.email}
                            </span>
                            {item.decidedBy && (
                              <span>
                                <span className="font-medium text-foreground">결재자: </span>
                                {item.decidedBy.displayName || item.decidedBy.email}
                              </span>
                            )}
                          </div>

                          {isPending && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                disabled={isActioning}
                                onClick={() => setDecisionModal({ item, decision: 'REJECTED' })}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                반려
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={isActioning}
                                onClick={() => setDecisionModal({ item, decision: 'APPROVED' })}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                승인
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Admin Profiles */}
        <TabsContent value="profiles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
              <div>
                <CardTitle className="text-lg">관리자 계정 및 역할/권한 관리</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  관리자 역할(Role)과 세부 API 접근 권한(Permission)을 부여하고 2차 인증(2FA) 현황을 확인합니다.
                </p>
              </div>
              <Button size="sm" variant="outline" className="h-8" onClick={() => void loadProfiles()} disabled={profilesLoading}>
                {profilesLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
              </Button>
            </CardHeader>
            <CardContent>
              {profilesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : profiles.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">등록된 관리자 계정이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {profiles.map((p) => {
                    const isSuper = p.role === 'SUPER_ADMIN'
                    const isActive = p.status === 'ACTIVE'

                    return (
                      <div
                        key={p.userId}
                        className="rounded-lg border p-4 transition-colors hover:bg-muted/40 space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                isSuper ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {p.role}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.2 text-[10px] font-semibold ${
                                isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {p.status}
                            </span>
                            <span className="font-bold text-sm">
                              {p.user?.displayName || p.user?.email || p.userId}
                            </span>
                            <span className="text-xs text-muted-foreground">({p.user?.email})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              2FA: {p.twoFactorEnabled ? '활성화' : '미설정'}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleOpenEditProfile(p)}
                            >
                              권한 설정
                            </Button>
                          </div>
                        </div>

                        {/* Permissions Tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1 border-t text-xs">
                          <span className="font-semibold text-muted-foreground mr-1 self-center text-[11px]">
                            보유 권한:
                          </span>
                          {isSuper ? (
                            <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold">
                              ALL_PERMISSIONS (슈퍼 관리자 바이패스)
                            </span>
                          ) : p.permissions.length === 0 ? (
                            <span className="text-muted-foreground text-[11px] self-center">부여된 세부 권한 없음</span>
                          ) : (
                            p.permissions.map((perm) => (
                              <span
                                key={perm}
                                className="rounded bg-muted border px-2 py-0.5 text-[11px] font-mono text-muted-foreground"
                              >
                                {perm}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Audit Logs */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
              <div>
                <CardTitle className="text-lg">보안 감사 로그 (Audit Logs)</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  관리자 권한 변경, 결재 승인/반려, 환불 처리 등 보안 활동의 불변 감사 기록입니다.
                </p>
              </div>
              <Button size="sm" variant="outline" className="h-8" onClick={() => void loadAuditLogs()} disabled={auditLoading}>
                {auditLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
              </Button>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">기록된 감사 로그가 없습니다.</p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 border-b text-muted-foreground font-medium">
                      <tr>
                        <th className="p-2.5">일시</th>
                        <th className="p-2.5">작업 (Action)</th>
                        <th className="p-2.5">대상 (Target)</th>
                        <th className="p-2.5">수행 관리자</th>
                        <th className="p-2.5">사유 / 메모</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/30">
                          <td className="p-2.5 whitespace-nowrap text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString('ko-KR')}
                          </td>
                          <td className="p-2.5 font-bold font-mono text-foreground">{log.action}</td>
                          <td className="p-2.5 font-mono text-muted-foreground">{log.target}</td>
                          <td className="p-2.5 font-medium">
                            {log.actor?.displayName || log.actor?.email || '시스템'}
                          </td>
                          <td className="p-2.5 text-muted-foreground max-w-[200px] truncate">
                            {log.reason || log.notes || '—'}
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

      {/* Decision Confirmation Modal */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              {decisionModal.decision === 'APPROVED' ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-rose-600" />
              )}
              결재 {decisionModal.decision === 'APPROVED' ? '승인' : '반려'} 확인
            </h2>
            <p className="text-sm text-muted-foreground">
              작업: <strong>{decisionModal.item.action}</strong> (대상: {decisionModal.item.target})
              <br />
              요청 사유: {decisionModal.item.reason}
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">결재 코멘트 (감사 로그에 영구 기록됨)</label>
              <Input
                placeholder="결재 승인 또는 반려 사유를 입력하세요"
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                className="text-xs h-8"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setDecisionModal(null)
                  setDecisionReason('')
                }}
              >
                취소
              </Button>
              <Button
                size="sm"
                className={
                  decisionModal.decision === 'APPROVED'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }
                onClick={() => void handleDecisionConfirm()}
              >
                {decisionModal.decision === 'APPROVED' ? '승인 확정' : '반려 확정'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New Approval Request Modal */}
      {newRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              신규 4-Eyes 결재 승인 요청
            </h2>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">작업 유형</label>
                <Select value={newRequestAction} onValueChange={setNewRequestAction}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER_ROLE_CHANGE">회원 역할 변경 (USER_ROLE_CHANGE)</SelectItem>
                    <SelectItem value="REFUND_APPROVE">고액 환불 승인 (REFUND_APPROVE)</SelectItem>
                    <SelectItem value="ADMIN_SETTINGS_UPDATE">보안 설정 변경 (ADMIN_SETTINGS_UPDATE)</SelectItem>
                    <SelectItem value="USER_DATA_EXPORT">회원 데이터 추출 (USER_DATA_EXPORT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">대상 (Target 식별자)</label>
                <Input
                  placeholder="예: user:cuid_1234 또는 refund:ref_5678"
                  value={newRequestTarget}
                  onChange={(e) => setNewRequestTarget(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">요청 사유</label>
                <Input
                  placeholder="구체적인 사유를 작성하세요"
                  value={newRequestReason}
                  onChange={(e) => setNewRequestReason(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" disabled={creatingRequest} onClick={() => setNewRequestModal(false)}>
                취소
              </Button>
              <Button size="sm" disabled={creatingRequest} onClick={() => void handleCreateRequest()}>
                {creatingRequest ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                요청 등록
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              관리자 권한 설정: {editingProfile.user?.displayName || editingProfile.user?.email}
            </h2>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">관리자 역할 (Role)</label>
                  <Select value={editRole} onValueChange={setEditRole}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">계정 상태 (Status)</label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE (활성)</SelectItem>
                      <SelectItem value="SUSPENDED">SUSPENDED (정지)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t">
                <label className="font-semibold text-foreground">세부 권한 (Permissions)</label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = editPermissions.includes(perm)
                    return (
                      <label
                        key={perm}
                        className={`flex items-center gap-2 rounded border p-2 cursor-pointer transition-colors ${
                          isChecked ? 'bg-primary/10 border-primary/40 font-semibold' : 'bg-muted/30'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(perm)}
                          className="rounded text-primary"
                        />
                        <span className="font-mono text-[11px]">{perm}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button size="sm" variant="outline" disabled={savingProfile} onClick={() => setEditingProfile(null)}>
                취소
              </Button>
              <Button size="sm" disabled={savingProfile} onClick={() => void handleSaveProfile()}>
                {savingProfile ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                설정 저장
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
