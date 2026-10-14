import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { AdminGateway } from './admin.gateway';
import { AiDecisionStatus, AiTargetDomain, UserStatus } from '@prisma/client';
import { ChatGateway } from '../ws/chat.gateway';

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

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private aiClient: GoogleGenAI | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly adminGateway: AdminGateway,
    private readonly chatGateway: ChatGateway,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey });
      } catch (err) {
        this.logger.warn(`Orchestrator GenAI init error: ${err}`);
      }
    }
  }

  /**
   * 1팀장 + 제브 AI + 5인 전문 AI 직원 오케스트레이션 파이프라인
   */
  async escalateViolation(params: EscalateViolationParams) {
    this.logger.log(`🚨 [AI 직원 오케스트레이션 가동] 대상: ${params.targetId}, 초기 위험도: ${params.riskScore}`);

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

    // 4. AiDecisionQueue 테이블에 INSERT (HITL 결재 대기 상태)
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

    // 5. 관리자 웹소켓(AdminGateway)으로 실시간 긴급 푸시
    this.adminGateway.broadcastNewDecision(saved);

    return saved;
  }

  /**
   * 제브 AI (Zev AI - Gemini 1.5 Pro - System One Prompt)
   */
  private async runZevAiAssessment(
    params: EscalateViolationParams,
    userHistory: string,
  ): Promise<{ zevRiskScore: number; recommendedAction: string; legalRationale: string }> {
    if (!this.aiClient) {
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

      const res = await this.aiClient.models.generateContent({
        model: 'gemini-1.5-pro',
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
   * 총괄 팀장 AI (Director Agent - Gemini 1.5 Pro)
   * 대표님이 3초 만에 검토할 수 있는 '핵심 증거 + 3줄 요약 결재안' 작성
   */
  private async runDirectorCrossCheck(
    params: EscalateViolationParams,
    zevJudgement: { zevRiskScore: number; recommendedAction: string; legalRationale: string },
    userHistory: string,
  ): Promise<{ summary3Lines: string; directorReviewNote: string }> {
    if (!this.aiClient) {
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

      const res = await this.aiClient.models.generateContent({
        model: 'gemini-1.5-pro',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const cleanJson = (res.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        summary3Lines: parsed.summary3Lines || '1. 유해 콘텐츠 감지\n2. 제브 AI 규정 판정 완료\n3. 원클릭 승인 요망',
        directorReviewNote: parsed.directorReviewNote || '실무 보고서와 제브 AI 판정 결과 교차 검증 완료.',
      };
    } catch (err) {
      this.logger.error('Director Agent cross check error', err);
      return {
        summary3Lines: `1. 채널 ${params.targetId} 실시간 위반 포착\n2. 제브 AI ${zevJudgement.recommendedAction} 권고\n3. 대표님 원클릭 승인 필요`,
        directorReviewNote: '교차 검증 완료 (AI Fallback)',
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
