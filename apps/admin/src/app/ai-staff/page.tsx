'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  ShieldAlert,
  Bot,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Eye,
  RefreshCw,
  Zap,
  Radio,
  FileText,
  UserX,
  PlayCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Maximize2,
  X,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

interface AiStaffMetric {
  id: string;
  name: string;
  role: string;
  status: 'ONLINE' | 'ACTIVE' | 'PROCESSING' | 'IDLE';
  processedCount: number;
  lastActive: string;
}

interface TargetUser {
  id: string;
  nickname: string;
  avatarUrl?: string | null;
  status: string;
  role: string;
}

interface AiDecisionItem {
  id: number;
  domain: string;
  targetId: string;
  targetUserId?: string | null;
  targetUser?: TargetUser | null;
  riskScore: number;
  summary: string;
  evidence?: string | null;
  snapshotUrls?: string[] | null;
  directorReview?: string | null;
  recommendedAction: string;
  rationale: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'MODIFIED';
  createdAt: string;
}

export default function AiStaffConsolePage() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<AiStaffMetric[]>([]);
  const [decisions, setDecisions] = useState<AiDecisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Snapshot Image Modal
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);

  // Manual Modification Modal
  const [modifyingItem, setModifyingItem] = useState<AiDecisionItem | null>(null);
  const [selectedOverrideAction, setSelectedOverrideAction] = useState<string>('BAN_USER');
  const [overrideMemo, setOverrideMemo] = useState<string>('');

  const socketRef = useRef<Socket | null>(null);

  // Load Initial Metrics and Pending Decisions
  const loadInitialData = async () => {
    try {
      const [mRes, dRes] = await Promise.all([
        api.get('/ai-staff/metrics'),
        api.get('/ai-staff/decisions/pending'),
      ]);
      if (mRes.data?.data) setMetrics(mRes.data.data);
      if (dRes.data?.data) setDecisions(dRes.data.data);
    } catch (err: any) {
      console.error('Failed to load AI staff data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Connect WebSocket
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000/admin-ws';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setWsConnected(true);
    });

    socket.on('disconnect', () => {
      setWsConnected(false);
    });

    socket.on('AI_STAFF_METRICS', (updatedMetrics: AiStaffMetric[]) => {
      setMetrics(updatedMetrics);
    });

    // Real-time Push of New AI Decision
    socket.on('AI_DECISION_NEW', (newDecision: AiDecisionItem) => {
      toast({
        title: '🚨 긴급 AI 결재 안건 접수',
        description: `[${newDecision.recommendedAction}] 위험도 ${newDecision.riskScore}점 안건이 도착했습니다.`,
      });
      setDecisions((prev) => [newDecision, ...prev.filter((d) => d.id !== newDecision.id)]);
    });

    // Real-time Decision Update
    socket.on('AI_DECISION_UPDATED', (updated: AiDecisionItem) => {
      setDecisions((prev) => prev.filter((d) => d.id !== updated.id));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // One-Click Approval (30-day suspension + terminate call)
  const handleApprove = async (item: AiDecisionItem) => {
    setProcessingId(item.id);
    try {
      await api.post(`/ai-staff/decisions/${item.id}/review`, {
        action: 'APPROVED',
        overrideAction: item.recommendedAction,
        adminMemo: '대표님 원클릭 승인 집행',
      });

      toast({
        title: '원클릭 결재 승인 완료',
        description: `안건 #${item.id}에 대해 [${item.recommendedAction}] 제재가 즉시 집행되었습니다.`,
      });

      setDecisions((prev) => prev.filter((d) => d.id !== item.id));
    } catch (err: any) {
      toast({
        title: '승인 처리 실패',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Reject Decision
  const handleReject = async (item: AiDecisionItem) => {
    setProcessingId(item.id);
    try {
      await api.post(`/ai-staff/decisions/${item.id}/review`, {
        action: 'REJECTED',
        adminMemo: '관리자 검토 결과 위반 불충분으로 기각',
      });

      toast({
        title: '안건 기각 완료',
        description: `안건 #${item.id}이 기각 처리되었습니다.`,
      });

      setDecisions((prev) => prev.filter((d) => d.id !== item.id));
    } catch (err: any) {
      toast({
        title: '기각 처리 실패',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Submit Manual Modification
  const handleConfirmModification = async () => {
    if (!modifyingItem) return;
    setProcessingId(modifyingItem.id);
    try {
      await api.post(`/ai-staff/decisions/${modifyingItem.id}/review`, {
        action: 'MODIFIED',
        overrideAction: selectedOverrideAction,
        adminMemo: overrideMemo || '관리자 수동 처분 변경',
      });

      toast({
        title: '처분 수위 변경 완료',
        description: `[${selectedOverrideAction}]으로 변경 집행되었습니다.`,
      });

      setDecisions((prev) => prev.filter((d) => d.id !== modifyingItem.id));
      setModifyingItem(null);
    } catch (err: any) {
      toast({
        title: '처리 실패',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Test Simulation Trigger
  const handleTestSimulation = async () => {
    try {
      await api.post('/ai-staff/test-trigger', {
        channelId: `live_${Date.now().toString().slice(-6)}`,
        hostId: 'test_creator_99',
        riskScore: 88,
        violationTags: ['NUDITY', 'PROHIBITED_ACTION'],
        rationale: '아고라 스트림 화면 내 신체 노출 및 유해 행위 포착',
        snapshotUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
      });
      toast({
        title: '테스트 시뮬레이션 가동',
        description: '안전관 -> 제브 AI -> 팀장 AI 파이프라인이 가동되어 잠시 후 실시간 안건이 도착합니다.',
      });
    } catch (err: any) {
      toast({
        title: '시뮬레이션 실패',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Console Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600/10 text-rose-600 rounded-xl">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                AI 운영 본부 & HITL 원클릭 결재 센터
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  wsConnected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-100 text-amber-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {wsConnected ? '실시간 웹소켓 연결됨' : '연결 시도 중...'}
                </span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                1팀장 + 제브 AI + 5인 전문 AI 직원이 실시간 채증한 유해 안건을 대표님이 3초 만에 검토하고 원클릭 집행하는 콘솔
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestSimulation}
            className="flex items-center gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
          >
            <PlayCircle className="w-4 h-4" />
            실시간 시뮬레이션 테스트
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadInitialData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* 5인 AI 직원 현황 위젯 */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-500" />
          5인 전문 AI 직원 & 1팀장 실시간 가동 상태
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map((staff) => (
            <Card key={staff.id} className="border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-900">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {staff.name}
                  </span>
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    staff.status === 'PROCESSING' ? 'bg-amber-400 animate-ping' :
                    staff.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' :
                    staff.status === 'ONLINE' ? 'bg-blue-500' : 'bg-slate-400'
                  }`} />
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">{staff.role}</p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                  <span className="text-[10px] text-slate-400 font-semibold">처리 건수</span>
                  <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                    {staff.processedCount.toLocaleString()}건
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 결재 대기 카드 리스트 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            원클릭 결재 대기 안건
            <Badge variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold ml-1">
              {decisions.length}건 대기 중
            </Badge>
          </h2>
          <span className="text-xs text-slate-400">
            * 승인 시 방송 강제 종료 및 계정 제재가 1초 내로 실시간 집행됩니다.
          </span>
        </div>

        {decisions.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">현재 대기 중인 긴급 안건이 없습니다</h3>
            <p className="text-xs text-slate-400 mt-1">
              안전관(Gemini Flash Vision)과 제브 AI가 실시간으로 방송을 24시간 안전 감시 중입니다.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {decisions.map((item) => {
              const snapshotUrl = item.snapshotUrls && item.snapshotUrls.length > 0 ? item.snapshotUrls[0] : null;

              return (
                <Card
                  key={item.id}
                  className="border-slate-300 dark:border-slate-700 shadow-md hover:shadow-lg transition-all overflow-hidden border-l-4 border-l-rose-500"
                >
                  <CardHeader className="bg-slate-50/70 dark:bg-slate-900/40 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-rose-600 text-white font-black text-xs px-2.5 py-1">
                          위험도 {item.riskScore}점
                        </Badge>
                        <Badge variant="outline" className="text-xs font-mono">
                          {item.domain}
                        </Badge>
                        <span className="text-xs font-bold text-slate-500">
                          채널: {item.targetId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(item.createdAt).toLocaleTimeString()} 접수
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: Agora Snapshot Evidence Viewer */}
                      <div className="lg:col-span-4 flex flex-col items-center">
                        <div className="w-full relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700 aspect-video group">
                          {snapshotUrl ? (
                            <>
                              <img
                                src={snapshotUrl}
                                alt="채증 스냅샷"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                                onClick={() => setActiveImageModal(snapshotUrl)}
                              />
                              <button
                                onClick={() => setActiveImageModal(snapshotUrl)}
                                className="absolute bottom-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-lg opacity-80 hover:opacity-100 transition-opacity"
                                title="원본 확대"
                              >
                                <Maximize2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                              <Eye className="w-8 h-8 mb-1" />
                              <span className="text-xs">스냅샷 이미지 없음</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-2 font-medium">
                          ▲ 아고라 실시간 채증 이미지 (클릭 시 원본 확대)
                        </span>

                        {/* Target User Mini Profile */}
                        {item.targetUser && (
                          <div className="w-full mt-4 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                            {item.targetUser.avatarUrl ? (
                              <img
                                src={item.targetUser.avatarUrl}
                                alt={item.targetUser.nickname}
                                className="w-10 h-10 rounded-full object-cover border"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
                                {item.targetUser.nickname.slice(0, 1)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {item.targetUser.nickname}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                상태: {item.targetUser.status} • 역할: {item.targetUser.role}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: 3-Line Summary & Zev AI Legal Decision */}
                      <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
                        {/* Director Agent's 3-Line Summary */}
                        <div className="bg-amber-50/70 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50">
                          <h4 className="text-xs font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            총괄 팀장 AI 3초 결재안 (3줄 요약)
                          </h4>
                          <div className="space-y-1.5 text-xs text-amber-950 dark:text-amber-200 font-medium whitespace-pre-line leading-relaxed">
                            {item.summary}
                          </div>
                        </div>

                        {/* Zev AI (System One) Legal Rationale */}
                        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                              <Bot className="w-4 h-4 text-indigo-600" />
                              제브 AI (Zev) 기계적 법률 대조 판정문
                            </h4>
                            <Badge className="bg-indigo-600 text-white font-extrabold text-[10px]">
                              권고: {item.recommendedAction}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono">
                            {item.rationale}
                          </p>
                          {item.directorReview && (
                            <p className="text-[11px] text-slate-500 mt-2 border-t pt-2 italic">
                              * 팀장 교차검증 소견: {item.directorReview}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={processingId === item.id}
                            onClick={() => handleReject(item)}
                            className="text-slate-600 border-slate-300 hover:bg-slate-100"
                          >
                            <XCircle className="w-4 h-4 mr-1 text-slate-400" />
                            기각
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={processingId === item.id}
                            onClick={() => {
                              setModifyingItem(item);
                              setSelectedOverrideAction('BAN_USER');
                              setOverrideMemo('');
                            }}
                            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                          >
                            처분 수위 수동 변경
                          </Button>

                          <Button
                            size="sm"
                            disabled={processingId === item.id}
                            onClick={() => handleApprove(item)}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/30"
                          >
                            <Zap className="w-4 h-4 mr-1" />
                            {processingId === item.id ? '집행 중...' : `원클릭 승인 (${item.recommendedAction} 즉시 집행)`}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* High-Res Snapshot Modal */}
      {activeImageModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 p-2">
            <button
              onClick={() => setActiveImageModal(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeImageModal}
              alt="증거 원본"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Manual Action Modification Modal */}
      {modifyingItem && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                처분 수위 수동 변경 (안건 #{modifyingItem.id})
              </h3>
              <button onClick={() => setModifyingItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-500">집행 조치 선택</label>
              <select
                value={selectedOverrideAction}
                onChange={(e) => setSelectedOverrideAction(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              >
                <option value="BAN_USER">BAN_USER (영구 계정 제재 및 플랫폼 퇴출)</option>
                <option value="SUSPEND_30D">SUSPEND_30D (30일 활동 정지 및 방송 종료)</option>
                <option value="TERMINATE_CALL">TERMINATE_CALL (통화/방송 즉시 강제 종료만 집행)</option>
                <option value="DISMISS">DISMISS (주의 조치 후 기각)</option>
              </select>

              <label className="text-xs font-semibold text-slate-500">관리자 사유 메모</label>
              <textarea
                rows={3}
                value={overrideMemo}
                onChange={(e) => setOverrideMemo(e.target.value)}
                placeholder="수동 처분 변경 사유를 입력하세요."
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setModifyingItem(null)}>
                취소
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmModification}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                수정 집행
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
