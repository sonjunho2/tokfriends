'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, PhoneCall, RefreshCcw, ShieldCheck, TimerReset } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  approvePhoneVerification,
  completePhoneVerificationProfile,
  expirePhoneVerificationSession,
  getPendingPhoneVerifications,
  getPhoneOtpLogs,
  resendPhoneOtp,
  type ManualProfileCompletionPayload,
  type PhoneOtpLog,
  type PhoneVerificationSession,
} from '@/lib/api'

const FALLBACK_LOGS: PhoneOtpLog[] = [
  {
    id: 'log-001',
    phoneNumber: '+82-10-1234-5678',
    requestedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    status: 'SUCCESS',
    failureReason: null,
    verificationId: 'ver-001',
  },
  {
    id: 'log-002',
    phoneNumber: '+82-10-8765-4321',
    requestedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    status: 'FAILED',
    failureReason: 'OTP 시도 횟수 초과',
    verificationId: 'ver-002',
  },
  {
    id: 'log-003',
    phoneNumber: '+82-10-2222-3333',
    requestedAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    status: 'SUCCESS',
    failureReason: null,
    verificationId: 'ver-003',
  },
]

const FALLBACK_SESSIONS: PhoneVerificationSession[] = [
  {
    verificationId: 'ver-001',
    phoneNumber: '+82-10-1234-5678',
    lastOtpSentAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    verifiedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
    profileCompleted: false,
    attempts: 2,
    metadata: { device: 'iPhone 15 Pro', carrier: 'KT' },
  },
  {
    verificationId: 'ver-004',
    phoneNumber: '+82-10-7777-8888',
    lastOtpSentAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    verifiedAt: null,
    expiresAt: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
    profileCompleted: false,
    attempts: 4,
    metadata: { device: 'Galaxy S24', carrier: 'SKT' },
  },
]

function formatDate(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function formatStatus(status: PhoneOtpLog['status']) {
  if (status === 'SUCCESS') return '성공'
  if (status === 'FAILED') return '실패'
  return status
}

export default function PhoneVerificationPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<PhoneOtpLog[]>(FALLBACK_LOGS)
  const [sessions, setSessions] = useState<PhoneVerificationSession[]>(FALLBACK_SESSIONS)
  const [searchPhone, setSearchPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionBusy, setSessionBusy] = useState<Record<string, string | null>>({})
  const [manualPayload, setManualPayload] = useState<ManualProfileCompletionPayload>({ verificationId: '' })
  const [manualLoading, setManualLoading] = useState(false)

  const filteredLogs = useMemo(() => {
    const keyword = searchPhone.trim()
    if (!keyword) return logs
    return logs.filter((log) => log.phoneNumber.includes(keyword) || log.verificationId?.includes(keyword))
  }, [logs, searchPhone])

  useEffect(() => {
    void refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function refreshAll() {
    setLoading(true)
    try {
      const [remoteLogs, remoteSessions] = await Promise.all([
        getPhoneOtpLogs().catch(() => FALLBACK_LOGS),
        getPendingPhoneVerifications().catch(() => FALLBACK_SESSIONS),
      ])
      setLogs(remoteLogs.length > 0 ? remoteLogs : FALLBACK_LOGS)
      setSessions(remoteSessions.length > 0 ? remoteSessions : FALLBACK_SESSIONS)
      toast({
        title: '휴대폰 인증 현황 동기화',
        description: '최근 OTP 로그와 미완료 세션을 불러왔습니다.',
      })
    } catch (error) {
      toast({
        title: '데이터를 불러오지 못했습니다',
        description: '네트워크 문제로 인해 기본 데이터를 표시합니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  function setBusy(verificationId: string, action: string | null) {
    setSessionBusy((prev) => ({ ...prev, [verificationId]: action }))
  }

  async function handleExpire(session: PhoneVerificationSession) {
    if (!window.confirm(`[만료] ${session.phoneNumber} 세션을 만료하시겠습니까?`)) return
    setBusy(session.verificationId, 'expire')
    try {
      await expirePhoneVerificationSession(session.verificationId)
      setSessions((prev) => prev.filter((item) => item.verificationId !== session.verificationId))
      toast({ title: '세션 만료 완료', description: `${session.phoneNumber} 세션을 만료했습니다.` })
    } catch (error) {
      toast({ title: '만료 실패', description: '세션 만료 중 오류가 발생했습니다.', variant: 'destructive' })
    } finally {
      setBusy(session.verificationId, null)
    }
  }

  async function handleResend(session: PhoneVerificationSession) {
    setBusy(session.verificationId, 'resend')
    try {
      await resendPhoneOtp(session.verificationId)
      setSessions((prev) =>
        prev.map((item) =>
          item.verificationId === session.verificationId
            ? { ...item, lastOtpSentAt: new Date().toISOString(), attempts: (item.attempts ?? 0) + 1 }
            : item
        )
      )
      toast({ title: 'OTP 재전송 완료', description: `${session.phoneNumber} 로 OTP를 다시 전송했습니다.` })
    } catch (error) {
      toast({ title: '재전송 실패', description: 'OTP 재전송 중 오류가 발생했습니다.', variant: 'destructive' })
    } finally {
      setBusy(session.verificationId, null)
    }
  }

  async function handleApprove(session: PhoneVerificationSession) {
    if (!window.confirm(`[수동 승인] ${session.phoneNumber}의 인증을 승인하시겠습니까?`)) return
    setBusy(session.verificationId, 'approve')
    try {
      await approvePhoneVerification(session.verificationId)
      setSessions((prev) =>
        prev.map((item) =>
          item.verificationId === session.verificationId
            ? { ...item, verifiedAt: new Date().toISOString() }
            : item
        )
      )
      toast({ title: '수동 승인 완료', description: `${session.phoneNumber} 세션을 승인했습니다.` })
    } catch (error) {
      toast({ title: '승인 실패', description: '수동 승인 중 오류가 발생했습니다.', variant: 'destructive' })
    } finally {
      setBusy(session.verificationId, null)
    }
  }

  async function handleManualComplete() {
    const verificationId = manualPayload.verificationId?.trim()
    if (!verificationId) {
      toast({ title: 'Verification ID 필요', description: '수동 완료할 verificationId를 입력하세요.', variant: 'destructive' })
      return
    }
    setManualLoading(true)
    try {
      await completePhoneVerificationProfile({
        verificationId,
        nickname: manualPayload.nickname?.trim(),
        note: manualPayload.note?.trim(),
      })
      toast({
        title: '임시 프로필 생성 완료',
        description: 'verificationId 기반 가입 완료 처리가 실행되었습니다.',
      })
      setManualPayload({ verificationId: '', nickname: '', note: '' })
      setSessions((prev) => prev.filter((item) => item.verificationId !== verificationId))
    } catch (error) {
      toast({ title: '수동 완료 실패', description: '임시 프로필 생성 중 오류가 발생했습니다.', variant: 'destructive' })
    } finally {
      setManualLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">휴대폰 인증</h1>
        <p className="text-sm text-muted-foreground">
          OTP 인증 성공 여부와 미완료 세션을 모니터링하고, 필요한 경우 만료·재전송·수동 승인을 처리하세요.
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><PhoneCall className="h-3.5 w-3.5" /> verificationId 기준 관리</span>
          <Button size="sm" variant="outline" onClick={refreshAll} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            새로고침
          </Button>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>최근 OTP 요청/검증 로그</CardTitle>
              <p className="text-sm text-muted-foreground">전화번호, 요청 시각, 결과 및 실패 사유를 확인하세요.</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="전화번호 또는 verificationId 검색"
                value={searchPhone}
                onChange={(event) => setSearchPhone(event.target.value)}
                className="h-9 w-[260px]"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-[320px] overflow-y-auto rounded-md border">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="sticky top-0 bg-muted/80 text-xs">
                  <tr>
                    <th className="px-3 py-2 font-medium">전화번호</th>
                    <th className="px-3 py-2 font-medium">요청 시각</th>
                    <th className="px-3 py-2 font-medium">결과</th>
                    <th className="px-3 py-2 font-medium">실패 사유</th>
                    <th className="px-3 py-2 font-medium">Verification ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id ?? `${log.phoneNumber}-${log.requestedAt}`} className="border-t">
                      <td className="px-3 py-2 font-semibold">{log.phoneNumber}</td>
                      <td className="px-3 py-2">{formatDate(log.requestedAt)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {log.status === 'SUCCESS' ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          )}
                          {formatStatus(log.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {log.failureReason ? log.failureReason : '-'}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{log.verificationId ?? '-'}</td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td className="px-3 py-8 text-center text-xs text-muted-foreground" colSpan={5}>
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              실패 로그는 시도 횟수, SMS 발송 오류, 인증 제한 사유 등을 함께 확인해 고객 응대에 활용하세요.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>수동 가입 완료</CardTitle>
            <p className="text-sm text-muted-foreground">
              verificationId 기준으로 프로필을 강제 완료하거나 임시 회원을 생성합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-2">
              <Label htmlFor="manual-verification-id">Verification ID</Label>
              <Input
                id="manual-verification-id"
                value={manualPayload.verificationId ?? ''}
                onChange={(event) =>
                  setManualPayload((prev) => ({ ...prev, verificationId: event.target.value }))
                }
                placeholder="예: ver-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-nickname">임시 닉네임 (선택)</Label>
              <Input
                id="manual-nickname"
                value={manualPayload.nickname ?? ''}
                onChange={(event) => setManualPayload((prev) => ({ ...prev, nickname: event.target.value }))}
                placeholder="예: 운영자-123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-note">메모 (선택)</Label>
              <Textarea
                id="manual-note"
                value={manualPayload.note ?? ''}
                onChange={(event) => setManualPayload((prev) => ({ ...prev, note: event.target.value }))}
                placeholder="예: 고객센터 문의에 따라 임시 승인 처리"
                rows={3}
              />
            </div>
            <Button onClick={handleManualComplete} disabled={manualLoading}>
              {manualLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              수동 가입 완료 처리
            </Button>
            <p className="text-xs text-muted-foreground">
              처리 후에는 미완료 세션 목록에서 제거되며, 백엔드 세션도 /verifications/phone 엔드포인트를 통해 만료됩니다.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>미완료 세션 목록</CardTitle>
          <p className="text-sm text-muted-foreground">
            인증에는 성공했지만 프로필 입력을 완료하지 않은 세션입니다. 필요 시 만료하거나 수동 승인하세요.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted/80 text-xs">
                <tr>
                  <th className="px-3 py-2 font-medium">전화번호</th>
                  <th className="px-3 py-2 font-medium">Verification ID</th>
                  <th className="px-3 py-2 font-medium">OTP 발송</th>
                  <th className="px-3 py-2 font-medium">인증 성공</th>
                  <th className="px-3 py-2 font-medium">만료 예정</th>
                  <th className="px-3 py-2 font-medium">시도 횟수</th>
                  <th className="px-3 py-2 font-medium">액션</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const busy = sessionBusy[session.verificationId ?? '']
                  return (
                    <tr key={session.verificationId} className="border-t">
                      <td className="px-3 py-2 font-semibold">{session.phoneNumber}</td>
                      <td className="px-3 py-2 font-mono text-xs">{session.verificationId}</td>
                      <td className="px-3 py-2">{formatDate(session.lastOtpSentAt)}</td>
                      <td className="px-3 py-2">{session.verifiedAt ? formatDate(session.verifiedAt) : '-'}</td>
                      <td className="px-3 py-2">{formatDate(session.expiresAt)}</td>
                      <td className="px-3 py-2">{session.attempts ?? 0}회</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResend(session)}
                            disabled={busy === 'resend'}
                          >
                            {busy === 'resend' ? (
                              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCcw className="mr-1 h-3.5 w-3.5" />
                            )}
                            재전송
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleApprove(session)} disabled={busy === 'approve'}>
                            {busy === 'approve' ? (
                              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                            )}
                            승인
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleExpire(session)} disabled={busy === 'expire'}>
                            {busy === 'expire' ? (
                              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <TimerReset className="mr-1 h-3.5 w-3.5" />
                            )}
                            만료
                          </Button>
                        </div>
                        {session.metadata && (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            디바이스: {(session.metadata as any).device ?? '-'} / 통신사: {(session.metadata as any).carrier ?? '-'}
                          </p>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {sessions.length === 0 && (
                  <tr>
                    <td className="px-3 py-8 text-center text-xs text-muted-foreground" colSpan={7}>
                      미완료 세션이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            프로필 미완료 세션은 일정 시간 이후 자동 만료됩니다. 즉시 만료가 필요하면 만료 버튼을 사용하고, 고객센터에서 요청 시 재전송/승인을 진행하세요.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
