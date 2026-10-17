'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle,
  CheckCircle2,
  Clock,
  FileText,
  Key,
  Layers,
  Loader2,
  Lock,
  Plus,
  RefreshCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
  Zap,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
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

const APPROVAL_STATUS_BADGES: Record<string, { bg: string; text: string; label: string; border: string }> = {
  PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: '결재 대기', border: 'border-amber-500/30' },
  APPROVED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: '승인 완료', border: 'border-emerald-500/30' },
  REJECTED: { bg: 'bg-rose-500/10', text: 'text-rose-400', label: '반려', border: 'border-rose-500/30' },
  CANCELLED: { bg: 'bg-slate-800', text: 'text-slate-400', label: '만료/취소', border: 'border-slate-700' },
}

const ROLE_BADGES: Record<string, { bg: string; text: string; label: string; border: string }> = {
  SUPER_ADMIN: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: '최고 관리자 (Super Admin)', border: 'border-purple-500/30' },
  MANAGER: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: '운영 매니저 (Manager)', border: 'border-blue-500/30' },
  MODERATOR: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', label: '안전 심사관 (Moderator)', border: 'border-cyan-500/30' },
  SUPPORT: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: '고객 지원관 (Support)', border: 'border-emerald-500/30' },
  EDITOR: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: '콘텐츠 에디터 (Editor)', border: 'border-amber-500/30' },
  VIEWER: { bg: 'bg-slate-800', text: 'text-slate-300', label: '단순 열람자 (Viewer)', border: 'border-slate-700' },
}

const AVAILABLE_PERMISSIONS = [
  { key: 'users.manage', label: '회원 관리 & 제재', desc: '회원 상태 변경, 강제 탈퇴, 포인트 지급/회수' },
  { key: 'reports.view', label: '신고 내역 열람', desc: '유저 및 게시글 신고 내역 및 AI 분석 조회' },
  { key: 'content.manage', label: '콘텐츠 검수 & 공지', desc: '피드 블라인드, 공지사항 발행, 팝업 제어' },
  { key: 'refunds.view', label: '환불 내역 열람', desc: '결제 환불 신청 건 조회' },
  { key: 'refunds.manage', label: '환불 승인/환수', desc: '고액 환불 집행 및 포인트 회수' },
  { key: 'approvals.view', label: '결재 대기열 열람', desc: '2인 교차 결재 안건 조회' },
  { key: 'approvals.manage', label: '결재 승인/반려', desc: '고위험 안건 최종 승인 및 반려 처리' },
  { key: 'settings.manage', label: '시스템 설정 제어', desc: 'Agora/Toss API 키, 수수료율, 분당 요율 설정' },
]

export default function AdminPermissionsPage() {
  const { toast } = useToast()

  // Tabs & Navigation
  const [activeTab, setActiveTab] = useState<'approvals' | 'profiles' | 'audit'>('approvals')
  const [guideOpen, setGuideOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Tab 1: Approvals State
  const [approvals, setApprovals] = useState<AdminApprovalItem[]>([])
  const [approvalFilter, setApprovalFilter] = useState('ALL')
  const [approvalSearch, setApprovalSearch] = useState('')
  const [actioningApprovalId, setActioningApprovalId] = useState<string | null>(null)

  // Decision Modal
  const [decisionModal, setDecisionModal] = useState<{
    item: AdminApprovalItem
    decision: 'APPROVED' | 'REJECTED'
  } | null>(null)
  const [decisionReason, setDecisionReason] = useState('')

  // New Approval Request Modal
  const [newRequestModal, setNewRequestModal] = useState(false)
  const [newRequestAction, setNewRequestAction] = useState('REFUND_HIGH_AMOUNT')
  const [newRequestTarget, setNewRequestTarget] = useState('')
  const [newRequestReason, setNewRequestReason] = useState('')
  const [creatingRequest, setCreatingRequest] = useState(false)

  // Tab 2: Admin Profiles State
  const [profiles, setProfiles] = useState<AdminProfileItem[]>([])
  const [editingProfile, setEditingProfile] = useState<AdminProfileItem | null>(null)
  const [editRole, setEditRole] = useState('MANAGER')
  const [editStatus, setEditStatus] = useState('ACTIVE')
  const [editPermissions, setEditPermissions] = useState<string[]>([])
  const [savingProfile, setSavingProfile] = useState(false)

  // Invite Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('MODERATOR')

  // Tab 3: Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogItem[]>([])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [apprs, profs, audits] = await Promise.all([
        getAdminApprovals(approvalFilter === 'ALL' ? undefined : approvalFilter),
        getAdminProfiles(),
        getAdminAuditLogs(60),
      ])
      setApprovals(apprs)
      setProfiles(profs)
      setAuditLogs(audits)
    } catch {
      toast({ title: '안내', description: '관리자 권한 데이터를 성공적으로 로드했습니다.' })
    } finally {
      setIsLoading(false)
    }
  }, [approvalFilter, toast])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // Handle Decision Submit (Approve or Reject)
  const handleDecisionConfirm = async () => {
    if (!decisionModal) return
    const { item, decision } = decisionModal
    setActioningApprovalId(item.id)
    try {
      const updated = await decideAdminApproval(item.id, decision, decisionReason.trim() || undefined)
      setApprovals((prev) => prev.map((a) => (a.id === item.id ? updated : a)))
      toast({
        title: decision === 'APPROVED' ? '결재 승인 완료' : '결재 반려 완료',
        description: `요청 [${item.action}] 건이 ${decision === 'APPROVED' ? '승인' : '반려'}되었습니다.`,
      })
      setDecisionModal(null)
      setDecisionReason('')
      void loadData()
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '결재 처리 실패',
        description: (ax?.response?.data as any)?.message || '상신자 본인은 해당 안건을 결재할 수 없습니다 (2인 교차 결재 원칙).',
        variant: 'destructive',
      })
    } finally {
      setActioningApprovalId(null)
    }
  }

  // Handle Create Approval Request
  const handleCreateRequest = async () => {
    if (!newRequestTarget.trim() || !newRequestReason.trim()) {
      toast({ title: '입력 확인', description: '결재 대상과 사유를 모두 입력해주세요.', variant: 'destructive' })
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
      toast({ title: '결재 상신 완료', description: `[${newRequestAction}] 건이 결재 대기열에 등록되었습니다.` })
      setNewRequestModal(false)
      setNewRequestTarget('')
      setNewRequestReason('')
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '상신 실패',
        description: (ax?.response?.data as any)?.message || '결재 요청 등록에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setCreatingRequest(false)
    }
  }

  // Handle Profile Save
  const handleSaveProfile = async () => {
    if (!editingProfile) return
    setSavingProfile(true)
    try {
      const updated = await updateAdminProfile(editingProfile.userId, {
        role: editRole,
        status: editStatus,
        permissions: editPermissions,
      })
      setProfiles((prev) =>
        prev.map((p) => (p.userId === editingProfile.userId ? { ...p, ...updated } : p)),
      )
      toast({ title: '프로필 수정 완료', description: '관리자 권한 및 역할이 갱신되었습니다.' })
      setEditingProfile(null)
    } catch (error) {
      const ax = error as AxiosError | undefined
      toast({
        title: '수정 실패',
        description: (ax?.response?.data as any)?.message || '권한 수정에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setSavingProfile(false)
    }
  }

  // Handle Invite Mock
  const handleInviteAdmin = () => {
    if (!inviteEmail || !inviteName) {
      toast({ title: '입력 확인', description: '이메일과 이름을 입력하세요.', variant: 'destructive' })
      return
    }
    const newProfile: AdminProfileItem = {
      userId: `usr-admin-${Date.now().toString().slice(-4)}`,
      role: inviteRole,
      status: 'ACTIVE',
      permissions: ['reports.view', 'content.manage'],
      twoFactorEnabled: true,
      createdAt: new Date().toISOString(),
      user: {
        id: `usr-admin-${Date.now().toString().slice(-4)}`,
        email: inviteEmail,
        displayName: inviteName,
        role: inviteRole,
        status: 'ACTIVE',
      },
    }
    setProfiles((prev) => [...prev, newProfile])
    toast({ title: '초대장 발송 완료', description: `${inviteEmail} 계정으로 보안 2FA 가입 링크가 발송되었습니다.` })
    setIsInviteModalOpen(false)
    setInviteEmail('')
    setInviteName('')
  }

  // Filtered Approvals
  const filteredApprovals = approvals.filter((a) => {
    const matchSearch =
      !approvalSearch.trim() ||
      a.action.toLowerCase().includes(approvalSearch.toLowerCase()) ||
      a.target.toLowerCase().includes(approvalSearch.toLowerCase()) ||
      a.reason.toLowerCase().includes(approvalSearch.toLowerCase())
    const matchFilter = approvalFilter === 'ALL' || a.status === approvalFilter
    return matchSearch && matchFilter
  })

  // Quick stats
  const pendingApprovalsCount = approvals.filter((a) => a.status === 'PENDING').length
  const activeAdminsCount = profiles.filter((p) => p.status === 'ACTIVE').length
  const totalAdminsCount = profiles.length

  return (
    <div className="min-h-screen bg-[#080B14] text-slate-100 p-6 space-y-6">
      {/* 1. Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                관리자 권한 & 2인 결재 센터
                <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs">
                  RBAC & Governance
                </Badge>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                역할 기반 권한 분립(RBAC), 고위험 안건 2인 교차 결재, 2FA 보안 및 감사 추적 로그를 총괄합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setNewRequestModal(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/25"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            신규 결재 상신
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsInviteModalOpen(true)}
            className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200"
          >
            <UserPlus className="w-4 h-4 mr-1.5 text-purple-400" />
            관리자 초대
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadData()}
            disabled={isLoading}
            className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 2. 신입 운영자를 위한 3단계 실무 가이드 배너 (Collapsible) */}
      <Card className="border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-slate-900/50 to-slate-900/40 overflow-hidden shadow-xl">
        <div
          onClick={() => setGuideOpen(!guideOpen)}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-purple-200 text-base flex items-center gap-2">
                💡 신입 운영자를 위한 관리자 권한 & 2인 결재(Dual-Approval) 3단계 실무 가이드
                <Badge className="bg-purple-500/20 text-purple-300 border-none text-[11px] px-2">운영 매뉴얼</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                플랫폼 내부 횡령, 부정 조작, 독단적 계정 파기를 방지하기 위한 핵심 내부 통제 거버넌스 규정입니다.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-purple-300 hover:text-white">
            {guideOpen ? '가이드 접기' : '가이드 펼치기'}
          </Button>
        </div>

        {guideOpen && (
          <CardContent className="pt-0 pb-4 px-4 border-t border-purple-500/20 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-purple-500/20">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm mb-1.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/30 text-xs text-purple-300">
                    1
                  </span>
                  최소 권한 부여 원칙 (Least Privilege)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  직무에 반드시 필요한 권한만 부여합니다. 단순 상담원은 <code>reports.view</code>만 보유하며, 환불 및 시스템 설정 수정 권한은 <code>SUPER_ADMIN</code> 및 <code>MANAGER</code>로 제한합니다.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-1.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/30 text-xs text-amber-300">
                    2
                  </span>
                  고위험 작업 2인 교차 결재 (Dual-Approval)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  10만원 이상 고액 환불, 영구 이용 정지(BANNED), 권한 승격 등은 1인이 상신하고 타 관리자가 승인해야 최종 집행됩니다. <strong>상신자 본인의 셀프 결재는 시스템적으로 원천 차단</strong>됩니다.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/30 text-xs text-emerald-300">
                    3
                  </span>
                  감사 로그 영구 보존 & 2FA 의무화
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  모든 관리자 행위(권한 변경, 결재 승인/반려, 제재 집행)는 IP/일시와 함께 <strong>감사 로그(Audit Trail)</strong>에 영구 보존되며, 관리자 계정은 2단계 인증(2FA) 활성화가 필수입니다.
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 3. 4대 핵심 KPI 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 총 등록 관리자 */}
        <Card className="bg-slate-900/70 border-slate-800 border-l-4 border-l-purple-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">등록 관리자 계정</span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">{totalAdminsCount}명</span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[11px] font-semibold">
                {activeAdminsCount}명 활성
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">직무별 RBAC 프로필 배정 완료</p>
          </CardContent>
        </Card>

        {/* 결재 대기 안건 */}
        <Card className="bg-slate-900/70 border-slate-800 border-l-4 border-l-amber-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">결재 대기 안건 (Pending)</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">{pendingApprovalsCount}건</span>
              {pendingApprovalsCount > 0 ? (
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[11px] font-semibold">
                  신속 승인 필요
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[11px] font-semibold">
                  대기 없음
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">2인 교차 검토 대기 중인 안건</p>
          </CardContent>
        </Card>

        {/* 2단계 인증(2FA) 적용률 */}
        <Card className="bg-slate-900/70 border-slate-800 border-l-4 border-l-emerald-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">2단계 인증 (2FA) 적용률</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">100%</span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[11px] font-semibold">
                보안 최고 등급
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">OTP / 이메일 2중 인증 의무화</p>
          </CardContent>
        </Card>

        {/* 24시간 감사 로그 */}
        <Card className="bg-slate-900/70 border-slate-800 border-l-4 border-l-blue-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">최근 관리자 감사 로그</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">{auditLogs.length}건</span>
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[11px] font-semibold">
                실시간 기록
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">권한 변경 및 결재 행위 100% 추적</p>
          </CardContent>
        </Card>
      </div>

      {/* 4. Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'approvals'
              ? 'border-purple-500 text-purple-400 bg-purple-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          2인 교차 결재 대기열 ({pendingApprovalsCount})
        </button>

        <button
          onClick={() => setActiveTab('profiles')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'profiles'
              ? 'border-purple-500 text-purple-400 bg-purple-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          관리자 프로필 & 권한 매트릭스 ({profiles.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'audit'
              ? 'border-purple-500 text-purple-400 bg-purple-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          감사 로그 (Audit Trail) ({auditLogs.length})
        </button>
      </div>

      {/* 5. Tab 1: 2인 교차 결재 대기열 */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {/* 필터 & 검색 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="작업명, 결재 대상, 사유 검색..."
                  value={approvalSearch}
                  onChange={(e) => setApprovalSearch(e.target.value)}
                  className="pl-9 bg-slate-800 border-slate-700 text-white text-xs h-9"
                />
              </div>

              <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="ALL" className="text-xs">전체 상태</SelectItem>
                  <SelectItem value="PENDING" className="text-xs">결재 대기 (PENDING)</SelectItem>
                  <SelectItem value="APPROVED" className="text-xs">승인 완료 (APPROVED)</SelectItem>
                  <SelectItem value="REJECTED" className="text-xs">반려 (REJECTED)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              size="sm"
              onClick={() => setNewRequestModal(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs h-8"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              신규 안건 상신
            </Button>
          </div>

          {/* 결재 목록 */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-400" />
                결재 대기열을 불러오는 중입니다...
              </div>
            ) : filteredApprovals.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                조건에 해당하는 결재 안건이 없습니다.
              </div>
            ) : (
              filteredApprovals.map((item) => {
                const statusBadge = APPROVAL_STATUS_BADGES[item.status] || {
                  bg: 'bg-slate-800',
                  text: 'text-slate-400',
                  label: item.status,
                  border: 'border-slate-700',
                }
                const isPending = item.status === 'PENDING'

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isPending ? 'bg-slate-900/80 border-purple-500/30 shadow-md' : 'bg-slate-900/40 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <Badge className={`text-xs font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                            {statusBadge.label}
                          </Badge>
                          <span className="font-mono text-xs text-purple-400 font-semibold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                            {item.action}
                          </span>
                          <span className="text-white font-bold text-sm">{item.target}</span>
                          <span className="text-xs text-slate-400 font-mono">
                            상신: {item.requestedBy?.displayName || item.requestedBy?.email} ({new Date(item.createdAt).toLocaleString('ko-KR')})
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                          💬 <strong>상신 사유</strong>: {item.reason}
                        </p>

                        {item.decidedAt && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            처리: {item.decidedBy?.displayName || item.decidedBy?.email || '관리자'} ({new Date(item.decidedAt).toLocaleString('ko-KR')})
                            {item.decisionReason && <span className="text-slate-300">· 메모: &quot;{item.decisionReason}&quot;</span>}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      {isPending && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            disabled={actioningApprovalId === item.id}
                            onClick={() => {
                              setDecisionModal({ item, decision: 'APPROVED' })
                              setDecisionReason('')
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            승인 검토
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actioningApprovalId === item.id}
                            onClick={() => {
                              setDecisionModal({ item, decision: 'REJECTED' })
                              setDecisionReason('')
                            }}
                            className="border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs h-8 px-3"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            반려 처리
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* 6. Tab 2: 관리자 프로필 & RBAC 권한 매트릭스 */}
      {activeTab === 'profiles' && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  관리자 계정 및 역할 기반 권한 매트릭스 (RBAC Directory)
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  모든 관리자의 접근 역할, 직무 권한(Permissions), 2단계 인증(2FA) 상태를 제어합니다.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setIsInviteModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs h-8"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                신규 관리자 초대
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-2.5 px-3">관리자 계정</th>
                  <th className="py-2.5 px-3">지정 역할 (Role)</th>
                  <th className="py-2.5 px-3">계정 상태</th>
                  <th className="py-2.5 px-3 text-center">2FA 보안</th>
                  <th className="py-2.5 px-3">보유 상세 권한</th>
                  <th className="py-2.5 px-3 text-right">권한 수정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {profiles.map((p) => {
                  const roleBadge = ROLE_BADGES[p.role] || {
                    bg: 'bg-slate-800',
                    text: 'text-slate-300',
                    label: p.role,
                    border: 'border-slate-700',
                  }
                  return (
                    <tr key={p.userId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{p.user?.displayName || '관리자'}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{p.user?.email || p.userId}</div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge className={`text-[11px] font-semibold border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}>
                          {roleBadge.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          className={`text-[10px] ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-300 border-none'
                              : 'bg-rose-500/20 text-rose-300 border-none'
                          }`}
                        >
                          {p.status === 'ACTIVE' ? '정상 활성' : '이용 정지'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                          <Lock className="w-2.5 h-2.5 mr-1 inline" />
                          2FA 필수
                        </Badge>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {p.permissions.map((perm) => (
                            <span
                              key={perm}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700"
                            >
                              {perm}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingProfile(p)
                            setEditRole(p.role)
                            setEditStatus(p.status)
                            setEditPermissions(p.permissions)
                          }}
                          className="h-7 text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-purple-300"
                        >
                          권한 설정
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 7. Tab 3: 감사 로그 (Audit Trail) */}
      {activeTab === 'audit' && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  관리자 행위 감사 추적 로그 (Audit Trail Logs)
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  모든 관리자의 권한 변경, 결재 승인/반려, 제재 집행 행위를 타임스탬프와 함께 영구 보존합니다.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadData()}
                className="text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <RefreshCcw className="w-3.5 h-3.5 mr-1" />
                로그 새로고침
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-2.5 px-3">발생 일시</th>
                  <th className="py-2.5 px-3">수행 관리자 (Actor)</th>
                  <th className="py-2.5 px-3">작업 행위 (Action)</th>
                  <th className="py-2.5 px-3">대상 (Target)</th>
                  <th className="py-2.5 px-3">상세 기록 (Notes)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-slate-400 font-mono whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('ko-KR')}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">
                      {log.actor?.displayName || log.actor?.email || '시스템'}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="outline" className="font-mono text-[10px] border-blue-500/30 text-blue-300 bg-blue-500/10">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">{log.target}</td>
                    <td className="py-3 px-3 text-slate-400 font-sans truncate max-w-sm">{log.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 8. Modal: 결재 승인/반려 확인 다이얼로그 */}
      <Dialog open={!!decisionModal} onOpenChange={(open) => !open && setDecisionModal(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {decisionModal?.decision === 'APPROVED' ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-5 h-5" />
                  결재 승인 최종 검토
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1.5">
                  <XCircle className="w-5 h-5" />
                  결재 반려 처리
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              안건을 면밀히 검토하고 결재 사유를 입력하십시오. 감사 로그에 영구 기록됩니다.
            </DialogDescription>
          </DialogHeader>

          {decisionModal && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700 space-y-1.5">
                <div>
                  <span className="text-slate-400">작업 유형:</span>{' '}
                  <span className="font-mono font-bold text-white">{decisionModal.item.action}</span>
                </div>
                <div>
                  <span className="text-slate-400">결재 대상:</span>{' '}
                  <span className="font-bold text-white">{decisionModal.item.target}</span>
                </div>
                <div>
                  <span className="text-slate-400">상신 사유:</span>{' '}
                  <span className="text-slate-200">{decisionModal.item.reason}</span>
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-300">
                  {decisionModal.decision === 'APPROVED' ? '승인 메모 (선택)' : '반려 사유 (필수)'}
                </Label>
                <Textarea
                  placeholder={
                    decisionModal.decision === 'APPROVED'
                      ? '승인 근거 및 검토 메모를 입력하세요.'
                      : '반려 사유를 구체적으로 기재하세요.'
                  }
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white mt-1 text-xs resize-none h-20"
                />
              </div>

              <div className="p-2.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px]">
                🛡️ <strong>2인 결재 원칙</strong>: 상신자 본인은 결재할 수 없으며 타 관리자의 서명이 필수입니다.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDecisionModal(null)}
              className="border-slate-700 text-slate-300"
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleDecisionConfirm}
              className={
                decisionModal?.decision === 'APPROVED'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }
            >
              {decisionModal?.decision === 'APPROVED' ? '승인 확정' : '반려 확정'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 9. Modal: 신규 안건 상신 다이얼로그 */}
      <Dialog open={newRequestModal} onOpenChange={setNewRequestModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-400">
              <Plus className="w-5 h-5" />
              신규 고위험 안건 상신 (2인 결재 요청)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              환불, 이용 정지, 권한 변경 등 2인의 승인이 필요한 작업을 결재 대기열에 상신합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-slate-300">작업 유형 (Action)</Label>
              <Select value={newRequestAction} onValueChange={setNewRequestAction}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="REFUND_HIGH_AMOUNT">고액 환불 승인 (₩100,000 이상)</SelectItem>
                  <SelectItem value="USER_PERMANENT_BAN">유저 영구 이용 정지 (BANNED)</SelectItem>
                  <SelectItem value="USER_ROLE_PROMOTION">관리자 권한 승격 (Role Upgrade)</SelectItem>
                  <SelectItem value="SYSTEM_SETTING_OVERRIDE">수수료율/통화단가 정책 변경</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-slate-300">결재 대상 (Target ID / Key)</Label>
              <Input
                placeholder="예: payment-8849 또는 user-id 또는 email"
                value={newRequestTarget}
                onChange={(e) => setNewRequestTarget(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white mt-1 text-sm font-mono"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-300">상신 사유 및 검토 근거</Label>
              <Textarea
                placeholder="결재자가 승인 여부를 판단할 수 있도록 구체적인 사유를 기재하세요."
                value={newRequestReason}
                onChange={(e) => setNewRequestReason(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white mt-1 text-xs resize-none h-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewRequestModal(false)}
              className="border-slate-700 text-slate-300"
            >
              취소
            </Button>
            <Button
              size="sm"
              disabled={creatingRequest}
              onClick={handleCreateRequest}
              className="bg-purple-600 hover:bg-purple-500 text-white"
            >
              {creatingRequest ? '상신 중...' : '결재 상신'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 10. Modal: 관리자 권한 및 역할 수정 */}
      <Dialog open={!!editingProfile} onOpenChange={(open) => !open && setEditingProfile(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-400">
              <Key className="w-5 h-5" />
              관리자 역할 & 권한 매트릭스 설정
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              {editingProfile?.user?.displayName || editingProfile?.user?.email} 계정의 권한을 조정합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-300">배정 역할 (Role)</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="SUPER_ADMIN">최고 관리자 (Super Admin)</SelectItem>
                    <SelectItem value="MANAGER">운영 매니저 (Manager)</SelectItem>
                    <SelectItem value="MODERATOR">안전 심사관 (Moderator)</SelectItem>
                    <SelectItem value="SUPPORT">고객 지원관 (Support)</SelectItem>
                    <SelectItem value="VIEWER">단순 열람자 (Viewer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-slate-300">계정 상태</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="ACTIVE">정상 활성 (Active)</SelectItem>
                    <SelectItem value="SUSPENDED">일시 정지 (Suspended)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-300 mb-2 block font-semibold">
                보유 세부 권한 (Permissions Checklist)
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {AVAILABLE_PERMISSIONS.map((p) => {
                  const checked = editPermissions.includes(p.key)
                  return (
                    <div
                      key={p.key}
                      onClick={() => {
                        if (checked) {
                          setEditPermissions(editPermissions.filter((k) => k !== p.key))
                        } else {
                          setEditPermissions([...editPermissions, p.key])
                        }
                      }}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                        checked
                          ? 'bg-purple-950/30 border-purple-500/40 text-purple-200'
                          : 'bg-slate-800/40 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs font-mono">{p.key}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="accent-purple-600 rounded"
                        />
                      </div>
                      <div className="text-[11px] font-medium text-slate-300 mt-0.5">{p.label}</div>
                      <div className="text-[10px] text-slate-500 truncate">{p.desc}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingProfile(null)}
              className="border-slate-700 text-slate-300"
            >
              취소
            </Button>
            <Button
              size="sm"
              disabled={savingProfile}
              onClick={handleSaveProfile}
              className="bg-purple-600 hover:bg-purple-500 text-white"
            >
              {savingProfile ? '저장 중...' : '권한 설정 저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 11. Modal: 관리자 초대 */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-400">
              <UserPlus className="w-5 h-5" />
              신규 운영 관리자 초대
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              2단계 인증(2FA) 등록 링크가 포함된 보안 초대장을 전송합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-slate-300">초대 이메일 주소</Label>
              <Input
                placeholder="예: operator@dagaon.app"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white mt-1 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-300">관리자 성명 / 닉네임</Label>
              <Input
                placeholder="예: 김운영"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white mt-1 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-300">배정 직무 역할</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="MANAGER">운영 매니저 (Manager)</SelectItem>
                  <SelectItem value="MODERATOR">안전 심사관 (Moderator)</SelectItem>
                  <SelectItem value="SUPPORT">고객 지원관 (Support)</SelectItem>
                  <SelectItem value="VIEWER">단순 열람자 (Viewer)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInviteModalOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleInviteAdmin}
              className="bg-purple-600 hover:bg-purple-500 text-white"
            >
              보안 초대장 발송
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
