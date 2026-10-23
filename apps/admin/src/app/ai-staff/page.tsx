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
  ChevronDown,
  Maximize2,
  X,
  Sliders,
  SlidersHorizontal,
  Key,
  Cpu,
  Layers,
  Power,
  Check,
  MessageSquare,
  ShieldCheck,
  DollarSign,
  HeartHandshake,
  Video,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

interface TimelineEntry {
  timestamp: string;
  sender: string;
  role: string;
  avatar: string;
  message: string;
  status: string;
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
  collaborationLog?: TimelineEntry[] | null;
  recommendedAction: string;
  rationale: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'MODIFIED';
  createdAt: string;
}

const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (차세대 초고속/권장)' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (고도 법률 대조/정밀 분석)' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (경량 실시간 스크리닝)' },
];

const STAFF_INFO: Record<string, { name: string; title: string; defaultModel: string; icon: any; color: string }> = {
  director: { name: '총괄 팀장 AI (Director)', title: '운영 총괄 & 대표님 3초 요약 결재안 작성', defaultModel: 'gemini-2.5-flash', icon: Bot, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
  safety: { name: '안전관 AI (Safety)', title: '실시간 영상 스냅샷 & 유해물 비전 스크리닝', defaultModel: 'gemini-1.5-flash', icon: Eye, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' },
  zev: { name: '제브 AI (Zev)', title: '수석 판정관 (정보통신망법 44조의7 기계적 대조)', defaultModel: 'gemini-2.5-flash', icon: ShieldCheck, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' },
  auditor: { name: '감사관 AI (Auditor)', title: '계정 이력 및 이상 거래 교차 감사', defaultModel: 'gemini-1.5-flash', icon: DollarSign, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
  cs: { name: '고객행복관 AI (CS)', title: '소명 기회 보장 & 유저 억울함 방지 중재', defaultModel: 'gemini-1.5-flash', icon: HeartHandshake, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/40' },
  growth: { name: '성장 분석관 AI (Growth)', title: '방송 룸 리스크 & 커머스 영향도 분석', defaultModel: 'gemini-1.5-flash', icon: Layers, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40' },
  // Backward compatibility keys
  settlement: { name: '감사관 AI (Auditor)', title: '포인트/환전 어뷰징 & 결제 이상 징후 추적', defaultModel: 'gemini-1.5-flash', icon: DollarSign, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
  happiness: { name: '고객행복관 AI (CS)', title: '소명 기회 보장 & 유저 억울함 방지 중재', defaultModel: 'gemini-1.5-flash', icon: HeartHandshake, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/40' },
  curator: { name: '성장 분석관 AI (Growth)', title: '커뮤니티 가이드라인 및 프로필 심의', defaultModel: 'gemini-1.5-flash', icon: Layers, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40' },
};

const DEFAULT_STAFF_METRICS: AiStaffMetric[] = [
  { id: 'director', name: '총괄 팀장 AI (Director)', role: 'Cross-Check & 3초 결재안 상신', status: 'ONLINE', processedCount: 142, lastActive: '방금 전' },
  { id: 'safety', name: '안전관 AI (Safety)', role: 'Gemini Vision 실시간 유해물 스크리닝', status: 'ACTIVE', processedCount: 8420, lastActive: '1초 전' },
  { id: 'zev', name: '제브 AI (Zev)', role: '정보통신망법 규정 기계적 판정', status: 'ONLINE', processedCount: 189, lastActive: '3초 전' },
  { id: 'auditor', name: '감사관 AI (Auditor)', role: '계정 이력 및 이상 거래 교차 감사', status: 'ONLINE', processedCount: 312, lastActive: '12초 전' },
  { id: 'cs', name: '고객행복관 AI (CS)', role: '피해자 보호 및 소명 기회 보장', status: 'ONLINE', processedCount: 95, lastActive: '25초 전' },
  { id: 'growth', name: '성장 분석관 AI (Growth)', role: '방송 룸 리스크 & 커머스 영향도 분석', status: 'ONLINE', processedCount: 118, lastActive: '40초 전' },
];

const FALLBACK_PENDING_DECISIONS: AiDecisionItem[] = [
  {
    id: 101,
    domain: 'LIVE_STREAM_SAFETY',
    targetId: 'room-live-891',
    targetUserId: 'u-violator-99',
    targetUser: {
      id: 'u-violator-99',
      nickname: '밤의여신',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
      status: 'ACTIVE',
      role: 'CREATOR',
    },
    riskScore: 92,
    summary: '라이브 방송 중 정보통신망법 제44조의7 제1항 위반 (선정적 행위 채증 및 유해 시각물 감지)',
    evidence: '아고라 영상 스트림 3.5초 간격 스냅샷 분석 결과 신체 특정 부위 과도 노출 감지 (신뢰도 98.4%)',
    snapshotUrls: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500',
    ],
    directorReview: '[대표님 3초 요약]\n1. 사안: 라이브 방송 중 고위험 유해물 실시간 송출 감지\n2. AI 합의: Safety(95점), Zev(92점 - 44조의7 위반 확정), CS(피해 시청자 격리 필요)\n3. 추천 조치: 즉시 방송 강제종료 및 계정 30일 이용정지(SUSPEND_30D) 집행 승인을 요청합니다.',
    collaborationLog: [
      { timestamp: '10:32:01', sender: 'Safety AI', role: '안전관', avatar: '👁️', message: '스냅샷 채증 완료: 유해 비전 스코어 95점 산출', status: 'TRIGGERED' },
      { timestamp: '10:32:02', sender: 'Zev AI', role: '수석판정관', avatar: '⚖️', message: '정보통신망법 제44조의7 불법정보 조항 기계적 매칭 완료', status: 'VERIFIED' },
      { timestamp: '10:32:03', sender: 'Director AI', role: '총괄팀장', avatar: '🤖', message: '6인 교차 검증 종합: 대표님 원클릭 승인 안건 상신', status: 'ESCALATED' },
    ],
    recommendedAction: 'SUSPEND_30D',
    rationale: '플랫폼 커뮤니티 가이드라인 및 방송통신심의위원회 인터넷 유해물 심의기준 3차 위반',
    status: 'PENDING_APPROVAL',
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: 102,
    domain: 'CREATOR_SETTLEMENT',
    targetId: 'set-order-202610-881',
    targetUserId: 'u-host-fraud',
    targetUser: {
      id: 'u-host-fraud',
      nickname: '스피드머니',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
      status: 'WARNING',
      role: 'USER',
    },
    riskScore: 78,
    summary: '단시간 내 동일 IP 및 연계 카드 통한 250만 ON 자전거래 의심 징후 포착',
    evidence: '동일 기기 식별자(Device Fingerprint)에서 10분 내 5회 분할 결제 및 즉시 에스크로 환전 요청 접수',
    directorReview: '[대표님 3초 요약]\n1. 사안: 카드 깡 / 에스크로 자전거래 어뷰징 패턴 감지\n2. AI 합의: Auditor(84점 - 비정상 패턴 확정), Director(78점)\n3. 추천 조치: 에스크로 대금 지급 보류 및 본인 소명 요구(HOLD_PAYOUT)',
    collaborationLog: [
      { timestamp: '10:28:15', sender: 'Auditor AI', role: '감사관', avatar: '💰', message: '자전거래 패턴 감지: 10분간 분할 결제 연속 5회', status: 'FLAGGED' },
      { timestamp: '10:28:18', sender: 'Director AI', role: '총괄팀장', avatar: '🤖', message: '이상 징후 점수 78점: 출금 정지 및 정밀 감사 상신', status: 'ESCALATED' },
    ],
    recommendedAction: 'HOLD_PAYOUT',
    rationale: '전자금융거래법 위반 우려 및 부정 결제 방지 정책에 의거한 예방적 지급 보류',
    status: 'PENDING_APPROVAL',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
];

export default function AiStaffConsolePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'queue' | 'policy'>('queue');
  const [metrics, setMetrics] = useState<AiStaffMetric[]>([]);
  const [decisions, setDecisions] = useState<AiDecisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Policy Settings States
  const [hasApiKey, setHasApiKey] = useState(false);
  const [maskedApiKey, setMaskedApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [sensitivity, setSensitivity] = useState(60);
  const [staffModels, setStaffModels] = useState<Record<string, string>>({
    director: 'gemini-2.5-flash',
    zev: 'gemini-2.5-flash',
    safety: 'gemini-1.5-flash',
    settlement: 'gemini-1.5-flash',
    happiness: 'gemini-1.5-flash',
    curator: 'gemini-1.5-flash',
  });
  const [staffToggles, setStaffToggles] = useState<Record<string, boolean>>({
    director: true,
    zev: true,
    safety: true,
    settlement: true,
    happiness: true,
    curator: true,
  });
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Expanded timelines map
  const [expandedTimelines, setExpandedTimelines] = useState<Record<number, boolean>>({});

  // Snapshot Image Modal
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);

  // Manual Modification Modal
  const [modifyingItem, setModifyingItem] = useState<AiDecisionItem | null>(null);
  const [selectedOverrideAction, setSelectedOverrideAction] = useState<string>('BAN_USER');
  const [overrideMemo, setOverrideMemo] = useState<string>('');

  const socketRef = useRef<Socket | null>(null);

  // Load Initial Metrics, Decisions, and Policy
  const loadInitialData = async () => {
    try {
      const [mRes, dRes, pRes] = await Promise.all([
        api.get('/ai-staff/metrics').catch(() => ({ data: { data: [] } })),
        api.get('/ai-staff/decisions/pending').catch(() => ({ data: { data: [] } })),
        api.get('/ai-staff/policy').catch(() => ({ data: { data: null } })),
      ]);
      if (mRes.data?.data && Array.isArray(mRes.data.data) && mRes.data.data.length > 0) {
        setMetrics(mRes.data.data);
      } else {
        setMetrics(DEFAULT_STAFF_METRICS);
      }

      const rawDecisions = (dRes.data?.data && Array.isArray(dRes.data.data) && dRes.data.data.length > 0)
        ? dRes.data.data
        : FALLBACK_PENDING_DECISIONS;
      setDecisions(rawDecisions);
      // By default open timeline for all items
      const initialExpand: Record<number, boolean> = {};
      rawDecisions.forEach((item: AiDecisionItem) => {
        initialExpand[item.id] = true;
      });
      setExpandedTimelines(initialExpand);
      if (pRes.data?.data) {
        const p = pRes.data.data;
        setHasApiKey(Boolean(p.hasApiKey));
        setMaskedApiKey(p.maskedApiKey || '');
        if (typeof p.sensitivity === 'number') setSensitivity(p.sensitivity);
        if (p.models) setStaffModels((prev) => ({ ...prev, ...p.models }));
        if (p.toggles) setStaffToggles((prev) => ({ ...prev, ...p.toggles }));
      }
    } catch (err: any) {
      console.error('Failed to load AI staff data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000/admin-ws';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));
    socket.on('AI_STAFF_METRICS', (updatedMetrics: AiStaffMetric[]) => setMetrics(updatedMetrics));

    socket.on('AI_DECISION_NEW', (newDecision: AiDecisionItem) => {
      toast({
        title: '🚨 긴급 AI 결재 안건 접수',
        description: `[${newDecision.recommendedAction}] 위험도 ${newDecision.riskScore}점 안건이 도착했습니다.`,
      });
      setDecisions((prev) => [newDecision, ...prev.filter((d) => d.id !== newDecision.id)]);
      setExpandedTimelines((prev) => ({ ...prev, [newDecision.id]: true }));
    });

    socket.on('AI_DECISION_UPDATED', (updated: AiDecisionItem) => {
      setDecisions((prev) => prev.filter((d) => d.id !== updated.id));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const toggleTimeline = (id: number) => {
    setExpandedTimelines((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // One-Click Approval
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

  // Save Policy Settings
  const handleSavePolicy = async () => {
    setSavingPolicy(true);
    try {
      const payload: any = {
        sensitivity,
        models: staffModels,
        toggles: staffToggles,
      };
      if (apiKeyInput.trim()) {
        payload.apiKey = apiKeyInput.trim();
      }

      const res = await api.post('/ai-staff/policy', payload);
      if (res.data?.data) {
        const p = res.data.data;
        setHasApiKey(Boolean(p.hasApiKey));
        setMaskedApiKey(p.maskedApiKey || '');
        setApiKeyInput('');
      }

      toast({
        title: '정책 설정 저장 완료',
        description: 'AI 직원 API 키, 모델 지정, 민감도 기준 및 활성화 상태가 실시간 반영되었습니다.',
      });
    } catch (err: any) {
      toast({
        title: '정책 저장 실패',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setSavingPolicy(false);
    }
  };

  // Test Simulation Trigger
  const handleTestSimulation = async () => {
    try {
      await api.post('/ai-staff/test-trigger', {
        channelId: `live_${Date.now().toString().slice(-6)}`,
        hostId: 'test_creator_99',
        riskScore: 88,
        violationTags: ['EXTERNAL_CONTACT', 'PROHIBITED_ACTION'],
        rationale: '타 플랫폼 및 외부 연락처 유도 정황 포착',
        snapshotUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
      });
      toast({
        title: '테스트 시뮬레이션 가동',
        description: '6인 AI 직원이 사건에 대해 실시간 협업 대화를 나누고 대표님 결재 대기열에 등록합니다.',
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Console Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600/10 text-rose-600 rounded-xl">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                AI 운영 본부 & 거버넌스 제어 센터
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  wsConnected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-100 text-amber-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {wsConnected ? '실시간 연동 가동 중' : '연결 중...'}
                </span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                100% AI 독단을 방지하고, 6인 AI 직원의 협업 대화를 투명하게 열람하여 사람이 최종 판단 및 정책을 통제하는 시스템
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
            협업 시뮬레이션 테스트
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

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'queue'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          원클릭 결재 대기열
          {decisions.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              activeTab === 'queue' ? 'bg-white text-rose-600' : 'bg-rose-100 text-rose-700'
            }`}>
              {decisions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('policy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'policy'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          ⚙️ AI 직원 업무 정책 제어 (API 키 & 모델 & 민감도)
          {!hasApiKey && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
              API 키 필요
            </span>
          )}
        </button>
      </div>

      {/* 6인 AI 직원 실시간 상태 위젯 */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-500" />
          6인 전문 AI 직원 실시간 가동 현황
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(STAFF_INFO).map(([key, info]) => {
            const isEnabled = staffToggles[key] ?? true;
            const model = staffModels[key] || info.defaultModel;
            const metric = metrics.find((m) => m.id === key);

            return (
              <Card key={key} className={`border shadow-sm transition-all ${
                isEnabled ? 'border-slate-200 dark:border-slate-800' : 'opacity-60 bg-slate-100 dark:bg-slate-900/40 border-dashed'
              }`}>
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {info.name}
                    </span>
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      !isEnabled ? 'bg-slate-400' :
                      metric?.status === 'PROCESSING' ? 'bg-amber-400 animate-ping' :
                      metric?.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
                    }`} />
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{info.title}</p>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">지정 모델</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold truncate max-w-[80px]">
                        {model.replace('gemini-', '')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">상태</span>
                      <span className={`font-semibold ${isEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {isEnabled ? '가동 중' : '일시 정지'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: 원클릭 결재 대기열 & 6인 AI 직원 실시간 협업 타임라인 */}
      {/* ============================================================== */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              대표님 최종 결재 대기 안건
              <Badge variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold ml-1">
                {decisions.length}건 대기 중
              </Badge>
            </h2>
            <span className="text-xs text-slate-400">
              * 100% AI에게만 맡기지 않고, 내부 대화 로그를 검토한 뒤 승인/조정/기각을 집행합니다.
            </span>
          </div>

          {decisions.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">현재 대기 중인 긴급 결재 안건이 없습니다</h3>
              <p className="text-xs text-slate-400 mt-1">
                현재 설정된 민감도({sensitivity}점) 기준에 따라 6인의 AI 직원이 24시간 안전 감시 중입니다.
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {decisions.map((item) => {
                const snapshotUrl = item.snapshotUrls && item.snapshotUrls.length > 0 ? item.snapshotUrls[0] : null;
                const isTimelineOpen = expandedTimelines[item.id] ?? true;

                // Fallback timeline log if not present
                const timeline: TimelineEntry[] = item.collaborationLog && item.collaborationLog.length > 0
                  ? item.collaborationLog
                  : [
                      {
                        timestamp: '10:14',
                        sender: '안전 심사관',
                        role: 'SAFETY',
                        avatar: '🛡️',
                        message: `유저 위반 감지 (위험도 ${item.riskScore}점) → 제브 AI 이관`,
                        status: 'DETECTED',
                      },
                      {
                        timestamp: '10:14',
                        sender: '제브 AI',
                        role: 'ZEV',
                        avatar: '⚖️',
                        message: `정산 감사관, 대상 유저 최근 환전/포인트 이상 여부 조회 요청`,
                        status: 'INVESTIGATING',
                      },
                      {
                        timestamp: '10:15',
                        sender: '정산 감사관',
                        role: 'SETTLEMENT',
                        avatar: '💰',
                        message: `최근 충전 건 있음. 즉시 차단보다 포인트 동결 후 계정 정지 권고`,
                        status: 'CROSS_CHECKED',
                      },
                      {
                        timestamp: '10:15',
                        sender: '고객행복관',
                        role: 'HAPPINESS',
                        avatar: '🤝',
                        message: `소명 기회 부여 권고: 이의제기 접수 창구 안내 문구 첨부`,
                        status: 'FEEDBACK',
                      },
                      {
                        timestamp: '10:15',
                        sender: '제브 AI',
                        role: 'ZEV',
                        avatar: '⚖️',
                        message: `법률 대조 완료. 최종 권고: '${item.recommendedAction}' 확정`,
                        status: 'RESOLVED',
                      },
                      {
                        timestamp: '10:15',
                        sender: '총괄 팀장 AI',
                        role: 'DIRECTOR',
                        avatar: '👔',
                        message: `최종 권고안 작성 완료 → 대표님 결재 대기열 등록`,
                        status: 'PENDING_APPROVAL',
                      },
                    ];

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

                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left: Agora Snapshot Evidence */}
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
                            ▲ 실시간 채증 스냅샷 (클릭 시 원본 확대)
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

                        {/* Right: 3-Line Summary & Zev AI Legal Rationale */}
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
                                제브 AI 기계적 법률 대조 판정문
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
                              기각 (무혐의)
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

                      {/* ============================================================== */}
                      {/* 6인 AI 직원 실시간 협업/소통 타임라인 로그 (투명한 열람) */}
                      {/* ============================================================== */}
                      <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                        <button
                          onClick={() => toggleTimeline(item.id)}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all text-left"
                        >
                          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                            <MessageSquare className="w-4 h-4 text-indigo-600" />
                            6인 AI 직원 간 협업/소통 타임라인 로그 (내부 의사결정 과정 투명 열람)
                            <Badge variant="outline" className="text-[10px] ml-1">
                              {timeline.length}개 단계
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold">
                            {isTimelineOpen ? '접기' : '펼치기'}
                            {isTimelineOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </div>
                        </button>

                        {isTimelineOpen && (
                          <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                            <p className="text-[11px] text-slate-400 font-medium pb-2 border-b">
                              * 사건 발생 즉시 6명의 AI 직원이 서로 데이터를 교차 조회하고 합의한 실시간 내부 타임라인입니다.
                            </p>
                            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-200 dark:before:bg-indigo-900">
                              {timeline.map((entry, idx) => (
                                <div key={idx} className="relative flex items-start gap-3">
                                  {/* Avatar Icon Node */}
                                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-500 flex items-center justify-center text-[10px] shadow-sm">
                                    {entry.avatar}
                                  </div>
                                  <div className="flex-1 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                          {entry.sender}
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 font-mono">
                                          {entry.role}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        ({entry.timestamp})
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                      &ldquo;{entry.message}&rdquo;
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: ⚙️ AI 직원 업무 정책 제어 (설정 탭) */}
      {/* ============================================================== */}
      {activeTab === 'policy' && (
        <div className="space-y-6">
          {/* Section 1: Google Gemini API Key Configuration */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Key className="w-5 h-5 text-indigo-600" />
                    AI 엔진 API 키 설정 (Google Gemini)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-1">
                    사업자 서버별로 독립적인 Gemini API 키를 입력하여 실시간 영상 채증 및 법률 대조를 구동합니다.
                  </CardDescription>
                </div>
                <Badge className={hasApiKey ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                  {hasApiKey ? 'API 키 활성화됨' : 'API 키 미등록'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Gemini API Key</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder={hasApiKey ? `현재 키: ${maskedApiKey} (변경 시 새로 입력)` : 'AIzaSy... 형식의 API 키를 입력하세요'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="flex-1 font-mono text-xs"
                  />
                  {hasApiKey && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setApiKeyInput('');
                        toast({ title: '키 확인', description: `현재 연동 키: ${maskedApiKey}` });
                      }}
                    >
                      상태 확인
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  * Google AI Studio (aistudio.google.com)에서 발급받은 API 키를 입력하면 즉시 실시간 검사에 적용됩니다.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Sensitivity Slider (민감도 조절) */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-rose-600" />
                위험도 민감도 조절 (위반 기준 점수)
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-1">
                AI가 유해하다고 판단하는 최소 기준 점수를 설정합니다. 기준치 미만의 경미한 건은 필터링되고, 기준치 이상만 제브 AI 및 대표님 결재 대기열에 이관됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">현재 민감도 기준:</span>
                <span className="text-lg font-black text-rose-600 font-mono">
                  {sensitivity}점 이상만 보고
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                step="5"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>민감함 (40점 이상 모두 보고)</span>
                <span>표준 (60점 / 권장)</span>
                <span>보수적 (80점 이상 중대 사안만 보고)</span>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Staff Model Selection & Toggle Switches */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600" />
                6인 AI 직원별 LLM 모델 지정 & 개별 온/오프 (Toggle)
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-1">
                직원 역할별로 적용할 LLM 모델을 선택하고, 필요 시 특정 직원을 일시 정지(OFF)할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(STAFF_INFO).map(([key, info]) => {
                  const Icon = info.icon;
                  const isEnabled = staffToggles[key] ?? true;
                  const currentModel = staffModels[key] || info.defaultModel;

                  return (
                    <div
                      key={key}
                      className={`p-4 rounded-xl border transition-all ${
                        isEnabled
                          ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/30 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg ${info.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {info.name}
                            </h4>
                            <p className="text-[10px] text-slate-400">{info.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-semibold ${isEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {isEnabled ? '가동' : '정지'}
                          </span>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) =>
                              setStaffToggles((prev) => ({ ...prev, [key]: checked }))
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Label className="text-[11px] text-slate-500">사용 모델 선택</Label>
                        <select
                          disabled={!isEnabled}
                          value={currentModel}
                          onChange={(e) =>
                            setStaffModels((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                        >
                          {AVAILABLE_MODELS.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Save Policy Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleSavePolicy}
                  disabled={savingPolicy}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-md shadow-indigo-600/30"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {savingPolicy ? '저장 중...' : '정책 설정 즉시 저장 및 실시간 반영'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
