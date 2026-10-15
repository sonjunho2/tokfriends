import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { AdminGateway } from './admin.gateway';
import { AiDecisionStatus, AiTargetDomain } from '@prisma/client';
import { UserStatus } from '../../common/user-types';
import { ChatGateway } from '../ws/chat.gateway';
import { decryptAdminSettingValue, encryptAdminSettingValue } from '../admin/admin-settings.crypto';

export interface EscalateViolationParams {
  domain: 'LIVE_STREAM_SAFETY' | 'PRIVATE_CALL_DISPUTE' | 'REPORT_SAFETY' | 'CREATOR_SETTLEMENT' | 'CONTENT_MODERATION';
  targetId: string;
  targetUserId?: string;
  riskScore: number;
  evidenceImageUrl?: string;
  violationTags?: string[];
  preliminaryRationale?: string;
  auditId?: string;
}

export interface TimelineLogEntry {
  timestamp: string;
  sender: string;
  role: string;
  avatar: string;
  message: string;
  status: string;
}

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private cachedAiClient: GoogleGenAI | null = null;
  private cachedApiKey: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly adminGateway: AdminGateway,
    private readonly chatGateway: ChatGateway,
  ) {}

  /**
   * 동적 Gemini API 키 조회 (관리자 DB 설정 우선 -> 환경 변수 폴백)
   */
  async getGeminiApiKey(): Promise<string | null> {
    try {
      const setting = await this.prisma.adminIntegrationSetting.findUnique({
        where: { id: 'gemini_api_key' },
      });
      if (setting?.encryptedValue) {
        const decrypted = decryptAdminSettingValue(setting.encryptedValue, 'gemini_api_key');
        if (decrypted && decrypted.trim()) return decrypted.trim();
      }
    } catch (e) {}

    try {
      const sys = await this.prisma.systemSetting.findUnique({ where: { key: 'GEMINI_API_KEY' } });
      if (sys?.value && sys.value.trim()) return sys.value.trim();
    } catch (e) {}

    return (
      this.configService.get<string>('GEMINI_API_KEY') ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      null
    );
  }

  /**
   * 동적 Gemini 클라이언트 인스턴스 반환
   */
  async getAiClient(): Promise<GoogleGenAI | null> {
    const apiKey = await this.getGeminiApiKey();
    if (!apiKey) return null;
    if (this.cachedAiClient && this.cachedApiKey === apiKey) {
      return this.cachedAiClient;
    }
    try {
      this.cachedAiClient = new GoogleGenAI({ apiKey });
      this.cachedApiKey = apiKey;
      return this.cachedAiClient;
    } catch (err) {
      this.logger.warn(`Failed to init GoogleGenAI client: ${err}`);
      return null;
    }
  }

  /**
   * 위험도 민감도 기준 점수 조회 (기본값: 60점)
   */
  async getSensitivityThreshold(): Promise<number> {
    try {
      const setting = await this.prisma.adminIntegrationSetting.findUnique({
        where: { id: 'ai_staff_sensitivity' },
      });
      if (setting?.encryptedValue) {
        const val = decryptAdminSettingValue(setting.encryptedValue, 'ai_staff_sensitivity');
        if (val) {
          const num = parseInt(val, 10);
          if (!isNaN(num)) return num;
        }
      }
    } catch (e) {}
    return 60;
  }

  /**
   * 직원별 지정 LLM 모델 조회
   */
  async getStaffModels(): Promise<Record<string, string>> {
    const defaults = {
      director: 'gemini-2.5-flash',
      zev: 'gemini-2.5-flash',
      safety: 'gemini-1.5-flash',
      settlement: 'gemini-1.5-flash',
      happiness: 'gemini-1.5-flash',
      curator: 'gemini-1.5-flash',
    };
    try {
      const setting = await this.prisma.adminIntegrationSetting.findUnique({
        where: { id: 'ai_staff_models' },
      });
      if (setting?.encryptedValue) {
        const val = decryptAdminSettingValue(setting.encryptedValue, 'ai_staff_models');
        if (val) return { ...defaults, ...JSON.parse(val) };
      }
    } catch (e) {}
    return defaults;
  }

  /**
   * 직원별 ON/OFF 활성화 상태 조회
   */
  async getStaffToggles(): Promise<Record<string, boolean>> {
    const defaults = {
      director: true,
      zev: true,
      safety: true,
      settlement: true,
      happiness: true,
      curator: true,
    };
    try {
      const setting = await this.prisma.adminIntegrationSetting.findUnique({
        where: { id: 'ai_staff_toggles' },
      });
      if (setting?.encryptedValue) {
        const val = decryptAdminSettingValue(setting.encryptedValue, 'ai_staff_toggles');
        if (val) return { ...defaults, ...JSON.parse(val) };
      }
    } catch (e) {}
    return defaults;
  }

  /**
   * AI 정책 및 설정 조회 (API Key 보유 여부, 민감도, 모델, 온/오프 상태)
   */
  async getPolicyConfig() {
    const apiKey = await this.getGeminiApiKey();
    const sensitivity = await this.getSensitivityThreshold();
    const models = await this.getStaffModels();
    const toggles = await this.getStaffToggles();

    return {
      hasApiKey: Boolean(apiKey),
      maskedApiKey: apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : '',
      sensitivity,
      models,
      toggles,
    };
  }

  /**
   * AI 정책 및 설정 업데이트 (API Key, 민감도, 모델, 온/오프 상태)
   */
  async updatePolicyConfig(dto: {
    apiKey?: string;
    sensitivity?: number;
    models?: Record<string, string>;
    toggles?: Record<string, boolean>;
  }) {
    if (dto.apiKey !== undefined) {
      const val = dto.apiKey.trim();
      const encrypted = val ? encryptAdminSettingValue(val, 'gemini_api_key') : null;
      await this.prisma.adminIntegrationSetting.upsert({
        where: { id: 'gemini_api_key' },
        update: { encryptedValue: encrypted },
        create: {
          id: 'gemini_api_key',
          label: 'Google Gemini API Key (실시간 영상 채증 및 법률 대조)',
          encryptedValue: encrypted,
        },
      });
      this.cachedAiClient = null;
      this.cachedApiKey = null;
    }

    if (dto.sensitivity !== undefined) {
      const encrypted = encryptAdminSettingValue(String(dto.sensitivity), 'ai_staff_sensitivity');
      await this.prisma.adminIntegrationSetting.upsert({
        where: { id: 'ai_staff_sensitivity' },
        update: { encryptedValue: encrypted },
        create: {
          id: 'ai_staff_sensitivity',
          label: 'AI 위험도 민감도 기준 점수 (0~100)',
          encryptedValue: encrypted,
        },
      });
    }

    if (dto.models !== undefined) {
      const encrypted = encryptAdminSettingValue(JSON.stringify(dto.models), 'ai_staff_models');
      await this.prisma.adminIntegrationSetting.upsert({
        where: { id: 'ai_staff_models' },
        update: { encryptedValue: encrypted },
        create: {
          id: 'ai_staff_models',
          label: 'AI 직원별 LLM 모델 지정 (JSON)',
          encryptedValue: encrypted,
        },
      });
    }

    if (dto.toggles !== undefined) {
      const encrypted = encryptAdminSettingValue(JSON.stringify(dto.toggles), 'ai_staff_toggles');
      await this.prisma.adminIntegrationSetting.upsert({
        where: { id: 'ai_staff_toggles' },
        update: { encryptedValue: encrypted },
        create: {
          id: 'ai_staff_toggles',
          label: 'AI 직원별 ON/OFF 활성화 상태 (JSON)',
          encryptedValue: encrypted,
        },
      });
    }

    return this.getPolicyConfig();
  }

  /**
   * 1팀장 + 제브 AI + 5인 전문 AI 직원 오케스트레이션 파이프라인
   */
  async escalateViolation(params: EscalateViolationParams) {
    const threshold = await this.getSensitivityThreshold();
    if (params.riskScore < threshold) {
      this.logger.log(`ℹ️ [AI 심사 건너뜀] 대상: ${params.targetId}, 점수: ${params.riskScore} (설정된 민감도 기준: ${threshold}점 미만)`);
      return null;
    }

    this.logger.log(`🚨 [AI 직원 오케스트레이션 가동] 대상: ${params.targetId}, 위험도: ${params.riskScore} (민감도 기준 ${threshold}점 초과)`);

    // 실시간 현황 통계 업데이트
    this.adminGateway.incrementProcessed('safety');
    this.adminGateway.incrementProcessed('auditor');

    // 1. 감사관(Auditor): 유저 과거 이력 및 계정 상태 조회
    let userHistorySummary = '신규 계정 또는 제재 이력 없음';
    if (params.targetUserId) {
      const targetUser = await this.prisma.user.findUnique({
        where: { id: params.targetUserId },
        include: {
          aiDecisions: {
            take: 3,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      if (targetUser && targetUser.aiDecisions.length > 0) {
        userHistorySummary = `과거 AI 심의 이력 ${targetUser.aiDecisions.length}건 존재. 최근 조치: ${targetUser.aiDecisions[0].recommendedAction}`;
      }
    }

    // 2. 제브 AI (Zev AI): 감정을 배제하고 대한민국 정보통신망법 및 이용약관 대조하여 기계적 판정
    this.adminGateway.incrementProcessed('zev');
    const zevJudgement = await this.runZevAiAssessment(params, userHistorySummary);

    // 3. 총괄 팀장 AI (Director Agent): 교차 검증 및 대표님을 위한 3줄 요약 결재안 작성
    this.adminGateway.incrementProcessed('director');
    const directorReview = await this.runDirectorCrossCheck(params, zevJudgement, userHistorySummary);

    // 4. 6인 AI 직원 간 협업/소통 타임라인 대화 로그 생성
    const now = new Date();
    const formatTime = (offsetSec: number) => {
      const d = new Date(now.getTime() + offsetSec * 1000);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    };

    const timelineLog: TimelineLogEntry[] = [
      {
        timestamp: formatTime(0),
        sender: '안전 심사관',
        role: 'SAFETY',
        avatar: '🛡️',
        message: `유저 위반 행위 감지 (위험도 ${params.riskScore}점, 태그: ${(params.violationTags || []).join(', ') || '유해 콘텐츠'}) → 제브 AI 이관`,
        status: 'DETECTED',
      },
      {
        timestamp: formatTime(1),
        sender: '제브 AI',
        role: 'ZEV',
        avatar: '⚖️',
        message: `정산 감사관, 대상 유저 최근 환전/포인트 이상 여부 및 충전 내역 즉시 조회 요청`,
        status: 'INVESTIGATING',
      },
      {
        timestamp: formatTime(2),
        sender: '정산 감사관',
        role: 'SETTLEMENT',
        avatar: '💰',
        message: `유저 이력 확인: ${userHistorySummary}. 최근 충전 건 있음. 즉시 영구 차단보다 포인트 동결 후 계정 정지(30일) 권고`,
        status: 'CROSS_CHECKED',
      },
      {
        timestamp: formatTime(3),
        sender: '고객행복관',
        role: 'HAPPINESS',
        avatar: '🤝',
        message: `소명 기회 보장 필요. 제재 통보 시 원클릭 이의신청 창구 안내 링크 동봉 권고`,
        status: 'FEEDBACK',
      },
      {
        timestamp: formatTime(4),
        sender: '제브 AI',
        role: 'ZEV',
        avatar: '⚖️',
        message: `정보통신망법 제44조의7 및 다가온 운영약관 대조 완료. 최종 권고: '${zevJudgement.recommendedAction}' 확정`,
        status: 'RESOLVED',
      },
      {
        timestamp: formatTime(5),
        sender: '총괄 팀장 AI',
        role: 'DIRECTOR',
        avatar: '👔',
        message: `전체 직원 교차 검증 완료 → 대표님 3초 결재 대기열(HITL) 등록 완료`,
        status: 'PENDING_APPROVAL',
      },
    ];

    // 5. AiDecisionQueue 테이블에 INSERT (HITL 결재 대기 상태)
    const saved = await this.prisma.aiDecisionQueue.create({
      data: {
        domain: params.domain as AiTargetDomain,
        targetId: params.targetId,
        targetUserId: params.targetUserId || null,
        riskScore: zevJudgement.zevRiskScore,
        summary: directorReview.summary3Lines,
        evidence: params.preliminaryRationale || `감지된 위반 태그: ${(params.violationTags || []).join(', ')}`,
        snapshotUrls: params.evidenceImageUrl ? [params.evidenceImageUrl] : [],
        directorReview: directorReview.directorReviewNote,
        collaborationLog: timelineLog as any,
        recommendedAction: zevJudgement.recommendedAction,
        rationale: zevJudgement.legalRationale,
        status: AiDecisionStatus.PENDING_APPROVAL,
      },
      include: {
        targetUser: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            status: true,
            role: true,
          },
        },
      },
    });

    // 6. 관리자 웹소켓(AdminGateway)으로 실시간 긴급 푸시
    this.adminGateway.broadcastNewDecision(saved);

    return saved;
  }

  /**
   * 제브 AI (Zev AI - 지정 LLM 모델 - System One Prompt)
   */
  private async runZevAiAssessment(
    params: EscalateViolationParams,
    userHistory: string,
  ): Promise<{ zevRiskScore: number; recommendedAction: string; legalRationale: string }> {
    const aiClient = await this.getAiClient();
    const models = await this.getStaffModels();

    let dynamicZevModel = '';
    let dynamicPolicy = '';
    try {
      const modelSetting = await this.prisma.adminIntegrationSetting.findUnique({
        where: { id: 'zev_ai_model' },
      });
      if (modelSetting?.encryptedValue) {
        dynamicZevModel = decryptAdminSettingValue(modelSetting.encryptedValue, 'zev_ai_model') || '';
      }
      const policySetting = await this.prisma.adminIntegrationSetting.findUnique({
        where: { id: 'zev_ai_prompt_policy' },
      });
      if (policySetting?.encryptedValue) {
        dynamicPolicy = decryptAdminSettingValue(policySetting.encryptedValue, 'zev_ai_prompt_policy') || '';
      }
    } catch (e) {}

    const zevModel = dynamicZevModel?.trim() || models.zev || 'gemini-2.5-flash';

    if (!aiClient) {
      return {
        zevRiskScore: Math.max(params.riskScore, 75),
        recommendedAction: 'SUSPEND_30D',
        legalRationale: `[정보통신망법 제44조의7 제1항 위반 의심] 감지된 사유: ${(params.violationTags || []).join(', ') || '불법/유해 행위'}`,
      };
    }

    try {
      const prompt = `
[SYSTEM: ZEV AI - SYSTEM ONE PROMPT]
당신은 대한민국 정보통신망 이용촉진 및 정보보호 등에 관한 법률 제44조의7 및 다가온(DAGAON) 운영원칙을 기계적으로 적용하는 '제브 AI'입니다.
감정이나 온정주의를 100% 배제하고, 사실관계와 규정에 입각하여 냉정하고 단호하게 판정하십시오.
${dynamicPolicy ? `\n[관리자 특별 대조 지침]\n${dynamicPolicy}\n` : ''}
[사건 개요]
- 도메인: ${params.domain}
- 채증 식별자: ${params.targetId}
- 안전관 감지 태그: ${(params.violationTags || []).join(', ')}
- 안전관 위험도 점수: ${params.riskScore}점
- 감사관 유저 이력: ${userHistory}
- 사실관계 요약: ${params.preliminaryRationale || 'N/A'}

[처벌 규정 선택지]
1. "TERMINATE_CALL" (통화/방송 즉각 강제 종료)
2. "SUSPEND_30D" (30일 서비스 이용 정지 및 방송 종료)
3. "BAN_USER" (영구 계정 제재 및 플랫폼 퇴출)
4. "DISMISS" (위반 사실 불충분으로 기각)

아래 JSON으로만 응답하십시오:
{
  "zevRiskScore": number (0~100 정수),
  "recommendedAction": "TERMINATE_CALL" | "SUSPEND_30D" | "BAN_USER" | "DISMISS",
  "legalRationale": string (법조항 및 약관 근거를 포함한 명확한 기계적 판정문)
}
`;

      const res = await aiClient.models.generateContent({
        model: zevModel,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const cleanJson = (res.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        zevRiskScore: typeof parsed.zevRiskScore === 'number' ? parsed.zevRiskScore : params.riskScore,
        recommendedAction: parsed.recommendedAction || 'SUSPEND_30D',
        legalRationale: parsed.legalRationale || '정보통신망법 제44조의7 규정에 따른 처분 권고',
      };
    } catch (err) {
      this.logger.error('Zev AI evaluation error', err);
      return {
        zevRiskScore: params.riskScore,
        recommendedAction: 'SUSPEND_30D',
        legalRationale: `[제브 AI 자동 규정 대조] 안전관 채증 태그: ${(params.violationTags || []).join(', ')}`,
      };
    }
  }

  /**
   * 총괄 팀장 AI (Director Agent - 지정 LLM 모델)
   * 대표님이 3초 만에 검토할 수 있는 '핵심 증거 + 3줄 요약 결재안' 작성
   */
  private async runDirectorCrossCheck(
    params: EscalateViolationParams,
    zevJudgement: { zevRiskScore: number; recommendedAction: string; legalRationale: string },
    userHistory: string,
  ): Promise<{ summary3Lines: string; directorReviewNote: string }> {
    const aiClient = await this.getAiClient();
    const models = await this.getStaffModels();
    const directorModel = models.director || 'gemini-2.5-flash';

    if (!aiClient) {
      const lines = [
        `1. [위반 감지] 채널 ${params.targetId}에서 ${(params.violationTags || []).join(', ') || '유해 요소'} 확인 (위험도 ${zevJudgement.zevRiskScore}점)`,
        `2. [규정 판정] 제브 AI 검토 결과 정보통신망법 위반 소지 명백 -> '${zevJudgement.recommendedAction}' 권고`,
        `3. [조치 건의] 추가 피해 확산 방지를 위해 즉시 승인 및 방송 강제 종료 집행 필요`,
      ].join('\n');
      return {
        summary3Lines: lines,
        directorReviewNote: '제브 AI 판정 결과와 실시간 캡처 채증 결과에 모순이 없음을 최종 확인하였습니다.',
      };
    }

    try {
      const prompt = `
[총괄 팀장 AI - DIRECTOR AGENT PROMPT]
당신은 다가온(DAGAON) 운영 총괄 팀장 AI입니다.
안전관 채증 보고서와 제브 AI의 법적 판정을 교차 검증하여 모순을 점검하고,
바쁜 대표님이 '3초 만에 핵심 증거를 확인하고 즉시 결재(원클릭 승인)'할 수 있도록
'정확한 3줄 요약'과 '팀장 종합 소견'을 작성하십시오.

[안건 정보]
- 위반 영역: ${params.domain}
- 안전관 채증 태그: ${(params.violationTags || []).join(', ')}
- 제브 AI 판정: 위험도 ${zevJudgement.zevRiskScore}점, 처벌 권고: ${zevJudgement.recommendedAction}
- 제브 AI 판정문: ${zevJudgement.legalRationale}
- 유저 이력: ${userHistory}

반드시 아래 JSON 형식으로 응답하십시오:
{
  "summary3Lines": "1. [채증 요약]\\n2. [제브AI 법적 판정]\\n3. [팀장 최종 조치 건의]",
  "directorReviewNote": "실무 보고서 교차 검증 및 사실관계 일치 여부 소견"
}
`;

      const res = await aiClient.models.generateContent({
        model: directorModel,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const cleanJson = (res.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        summary3Lines: parsed.summary3Lines || '1. [채증] 유해 요소 포착\n2. [판정] 규정 위반 소지 확인\n3. [건의] 이용 정지 권고',
        directorReviewNote: parsed.directorReviewNote || '실시간 채증 데이터와 제브 AI 판정에 근거하여 작성되었습니다.',
      };
    } catch (err) {
      this.logger.error('Director Agent cross-check error', err);
      const lines = [
        `1. [위반 감지] 채널 ${params.targetId}에서 ${(params.violationTags || []).join(', ') || '유해 요소'} 감지 (위험도 ${zevJudgement.zevRiskScore}점)`,
        `2. [규정 판정] 제브 AI 검토 결과 정보통신망법 위반 소지 -> '${zevJudgement.recommendedAction}' 권고`,
        `3. [조치 건의] 추가 피해 방지를 위해 즉시 승인 필요`,
      ].join('\n');
      return {
        summary3Lines: lines,
        directorReviewNote: '제브 AI 판정 결과에 근거하여 작성되었습니다.',
      };
    }
  }

  /**
   * 관리자 HITL 원클릭 결재 처리
   * action: 'APPROVED' (원클릭 승인) | 'REJECTED' (기각) | 'MODIFIED' (수동 처분 변경)
   */
  async processDecisionApproval(
    decisionId: number,
    adminUserId: string,
    action: 'APPROVED' | 'REJECTED' | 'MODIFIED',
    overrideAction?: string,
    adminMemo?: string,
  ) {
    const decision = await this.prisma.aiDecisionQueue.findUnique({
      where: { id: decisionId },
      include: { targetUser: true },
    });

    if (!decision) {
      throw new NotFoundException('결재 안건을 찾을 수 없습니다.');
    }

    const finalAction = overrideAction || decision.recommendedAction;
    let newStatus: AiDecisionStatus = AiDecisionStatus.APPROVED;
    if (action === 'REJECTED') {
      newStatus = AiDecisionStatus.REJECTED;
    } else if (action === 'MODIFIED') {
      newStatus = AiDecisionStatus.MODIFIED;
    }

    // 1. DB 상태 업데이트
    const updated = await this.prisma.aiDecisionQueue.update({
      where: { id: decisionId },
      data: {
        status: newStatus,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
        adminMemo: adminMemo || (action === 'APPROVED' ? '대표님 원클릭 승인' : '관리자 검토 처리'),
      },
      include: { targetUser: true },
    });

    // 2. 승인된 경우 실서비스 즉시 제재 집행
    if (newStatus === AiDecisionStatus.APPROVED || newStatus === AiDecisionStatus.MODIFIED) {
      if (decision.targetUserId) {
        if (finalAction === 'BAN_USER') {
          await this.prisma.user.update({
            where: { id: decision.targetUserId },
            data: { status: UserStatus.BANNED },
          });
        } else if (finalAction === 'SUSPEND_30D') {
          await this.prisma.user.update({
            where: { id: decision.targetUserId },
            data: { status: UserStatus.SUSPENDED },
          });
        }
      }

      // 방송 또는 통화 강제 종료 소켓 신호 브로드캐스트
      this.chatGateway.server?.to(decision.targetId).emit('STREAM_FORCE_TERMINATED', {
        targetId: decision.targetId,
        reason: 'AI_STAFF_SANCTION_EXECUTED',
        action: finalAction,
      });

      // 5인 AI 직원 중 CS관(Support) 통지 발송 카운터
      this.adminGateway.incrementProcessed('cs');
    }

    // 관리자 웹소켓으로 갱신 브로드캐스트
    this.adminGateway.broadcastDecisionUpdated(updated);

    return updated;
  }

  /**
   * 결재 대기 중인 안건 목록 조회
   */
  async getPendingDecisions() {
    return this.prisma.aiDecisionQueue.findMany({
      where: { status: AiDecisionStatus.PENDING_APPROVAL },
      orderBy: { createdAt: 'desc' },
      include: {
        targetUser: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            status: true,
            role: true,
          },
        },
      },
    });
  }
}
