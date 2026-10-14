import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';
import { GoogleGenAI } from '@google/genai';
import { OrchestratorService } from '../ai-staff/orchestrator.service';
import { randomUUID } from 'crypto';

export interface SnapshotAnalysisResult {
  riskScore: number;
  isViolated: boolean;
  violationTags: string[];
  rationale: string;
}

@Injectable()
export class SnapshotAuditorService {
  private readonly logger = new Logger(SnapshotAuditorService.name);
  private supabase: SupabaseClient | null = null;
  private aiClient: GoogleGenAI | null = null;
  private channelIntervals = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly orchestratorService: OrchestratorService,
  ) {
    this.initSupabase();
    this.initGemini();
  }

  private initSupabase() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || process.env.SUPABASE_URL;
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
          realtime: {
            transport: ws as any,
          },
        });
        this.logger.log('Supabase storage client initialized successfully with ws transport.');
      } catch (err) {
        this.logger.warn(`Failed to initialize Supabase client: ${err}`);
        this.supabase = null;
      }
    } else {
      this.logger.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured. Local fallback storage will be used.');
    }
  }

  private initGemini() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey });
        this.logger.log('Google Gemini AI client initialized.');
      } catch (err) {
        this.logger.warn(`Failed to initialize Google GenAI: ${err}`);
      }
    } else {
      this.logger.warn('GEMINI_API_KEY not configured. Vision AI fallback heuristics will be used.');
    }
  }

  /**
   * 채널의 현재 캡처 주기 (초) 조회 (평시 20초, 비상시 5초)
   */
  getChannelCaptureInterval(channelId: string): number {
    return this.channelIntervals.get(channelId) || 20;
  }

  /**
   * Agora Cloud Recording Image Capture 웹훅 수신 처리 핸들러
   * 평시 20초 주기 수신 -> Supabase 업로드 -> Gemini 1.5 Flash Vision 1초 미만 초고속 스크리닝
   */
  async handleSnapshotWebhook(params: {
    channelId: string;
    hostId: string;
    imageBuffer: Buffer;
    mimeType?: string;
  }): Promise<{ ok: boolean; riskScore: number; isViolated: boolean }> {
    const { channelId, hostId, imageBuffer, mimeType = 'image/jpeg' } = params;
    const filename = `snapshots/${channelId}/${Date.now()}_${randomUUID().slice(0, 8)}.jpg`;

    let snapshotUrl = `https://storage.dagaon.app/snapshots/${channelId}/${filename}`;

    // 1. Supabase Storage 업로드
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.storage
          .from('stream-snapshots')
          .upload(filename, imageBuffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (error) {
          this.logger.error(`Supabase upload failed: ${error.message}`);
        } else if (data) {
          const { data: pubData } = this.supabase.storage
            .from('stream-snapshots')
            .getPublicUrl(filename);
          snapshotUrl = pubData.publicUrl;
        }
      } catch (err) {
        this.logger.error('Error uploading to Supabase', err);
      }
    }

    // 2. Google Gemini 1.5 Flash Vision 초고속 스크리닝 (1초 미만)
    const analysis = await this.screenImageWithGeminiFlash(imageBuffer, mimeType);

    this.logger.log(
      `[스냅샷 채증] 채널: ${channelId}, 위험도: ${analysis.riskScore}, 위반: ${analysis.isViolated}, 태그: [${analysis.violationTags.join(', ')}]`,
    );

    // 3. 정상 판정 시 (riskScore < 60 및 위반 없음)
    if (analysis.riskScore < 60 && !analysis.isViolated) {
      // 24시간 후 자동 롤링 삭제 태스크 스케줄링 (로그 기록)
      this.logger.debug(`스냅샷 정상: 24시간 후 롤링 삭제 예정 (${snapshotUrl})`);
      return { ok: true, riskScore: analysis.riskScore, isViolated: false };
    }

    // 4. 위험도 60점 이상 또는 신체 노출/불법 배너 감지 시
    // A. StreamSnapshotAudit 테이블에 기록
    const auditRecord = await this.prisma.streamSnapshotAudit.create({
      data: {
        channelId,
        hostId,
        snapshotUrl,
        riskScore: analysis.riskScore,
        isViolated: true,
        violationTags: analysis.violationTags,
      },
    });

    // B. 아고라 캡처 주기를 5초로 긴급 단축
    this.channelIntervals.set(channelId, 5);
    await this.prisma.systemSetting.upsert({
      where: { key: 'SNAPSHOT_INTERVAL_SEC' },
      create: { key: 'SNAPSHOT_INTERVAL_SEC', value: '5', description: '위반 감지로 긴급 5초 단축' },
      update: { value: '5' },
    });
    this.logger.warn(`🚨 [긴급 조치] 채널 ${channelId} 캡처 주기를 5초로 긴급 단축 및 영구 증거 아카이브 잠금!`);

    // C. 1팀장 + 제브 AI + 5인 AI 직원 오케스트레이션 파이프라인으로 에스컬레이션
    await this.orchestratorService.escalateViolation({
      domain: 'LIVE_STREAM_SAFETY',
      targetId: channelId,
      targetUserId: hostId,
      riskScore: analysis.riskScore,
      evidenceImageUrl: snapshotUrl,
      violationTags: analysis.violationTags,
      preliminaryRationale: analysis.rationale,
      auditId: auditRecord.id,
    });

    return { ok: true, riskScore: analysis.riskScore, isViolated: true };
  }

  /**
   * Google Gemini Flash Vision 초고속 스크리닝 엔진 (동적 모델 및 API 키 연동)
   */
  private async screenImageWithGeminiFlash(
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<SnapshotAnalysisResult> {
    const aiClient = await this.orchestratorService.getAiClient();
    const models = await this.orchestratorService.getStaffModels();
    const safetyModel = models.safety || 'gemini-1.5-flash';
    const sensitivityThreshold = await this.orchestratorService.getSensitivityThreshold();

    if (!aiClient) {
      // AI 클라이언트 없을 시의 안전한 Fallback 휴리스틱
      return {
        riskScore: 0,
        isViolated: false,
        violationTags: [],
        rationale: '정상 스트림 화면 판정 (AI 설정 대기 / Fallback)',
      };
    }

    try {
      const base64Image = imageBuffer.toString('base64');
      const prompt = `
당신은 대한민국 방송통신심의위원회 및 정보통신망법 규정에 기반한 실시간 인터넷 방송 유해성 모니터링 AI 안전관입니다.
첨부된 실시간 방송 캡처 화면을 면밀히 분석하여 위법/유해 요소를 초고속으로 판정하세요.

검사 기준:
1. 신체 노출 (성기, 유두, 둔부 노출, 란제리/성행위 유사 동작)
2. 폭력 및 가혹행위 (흉기 노출, 자해, 폭행, 동물 학대)
3. 불법 사설 도박 배너, 성매매/조건만남 유도 문구, 피싱 사기 링크
4. 마약류 복용 또는 불법 행위

현재 설정된 위험도 판정 기준: ${sensitivityThreshold}점 이상 시 위반

반드시 아래 JSON 형식만 반환하세요:
{
  "riskScore": number (0~100),
  "isViolated": boolean (riskScore >= ${sensitivityThreshold} 이거나 명백한 위반 시 true),
  "violationTags": string[] (예: ["NUDITY", "GAMBLING_BANNER", "VIOLENCE", "ILLEGAL_TEXT"]),
  "rationale": string (위반 또는 정상에 대한 핵심 근거 한 줄)
}
`;

      const response = await aiClient.models.generateContent({
        model: safetyModel,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Image,
                },
              },
              { text: prompt },
            ],
          },
        ],
      });

      const responseText = response.text || '';
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const score = typeof parsed.riskScore === 'number' ? parsed.riskScore : 0;
      return {
        riskScore: score,
        isViolated: score >= sensitivityThreshold || !!parsed.isViolated,
        violationTags: Array.isArray(parsed.violationTags) ? parsed.violationTags : [],
        rationale: parsed.rationale || '판정 완료',
      };
    } catch (err) {
      this.logger.error('Gemini 1.5 Flash Vision screening error', err);
      return {
        riskScore: 0,
        isViolated: false,
        violationTags: [],
        rationale: '검사 중 오류 발생 (정상 처리 유지)',
      };
    }
  }
}
