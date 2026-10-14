import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrchestratorService } from './orchestrator.service';
import { AdminGateway } from './admin.gateway';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';

export class ReviewDecisionDto {
  action: 'APPROVED' | 'REJECTED' | 'MODIFIED';
  overrideAction?: string;
  adminMemo?: string;
}

export class TestTriggerDto {
  channelId: string;
  hostId: string;
  riskScore?: number;
  violationTags?: string[];
  rationale?: string;
  snapshotUrl?: string;
}

@ApiTags('ai-staff')
@Controller('ai-staff')
export class AiStaffController {
  constructor(
    private readonly orchestratorService: OrchestratorService,
    private readonly adminGateway: AdminGateway,
  ) {}

  /**
   * 5인 AI 직원 실시간 현황 및 처리 건수 조회
   */
  @Get('metrics')
  getMetrics() {
    return {
      ok: true,
      data: this.adminGateway.getStaffMetrics(),
    };
  }

  /**
   * 대표님 결재 대기 안건 목록 조회
   */
  @Get('decisions/pending')
  async getPendingDecisions() {
    const data = await this.orchestratorService.getPendingDecisions();
    return {
      ok: true,
      data,
    };
  }

  /**
   * 대표님 원클릭 승인 / 기각 / 처분 수위 변경
   */
  @Post('decisions/:id/review')
  @UseGuards(JwtAuthGuard)
  async reviewDecision(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewDecisionDto,
    @CurrentUser() admin: any,
  ) {
    const adminId = admin?.id || admin?.sub || 'SYSTEM_ADMIN';
    const data = await this.orchestratorService.processDecisionApproval(
      id,
      adminId,
      dto.action,
      dto.overrideAction,
      dto.adminMemo,
    );
    return {
      ok: true,
      data,
    };
  }

  /**
   * 실시간 파이프라인 테스트 트리거
   */
  @Post('test-trigger')
  async testTrigger(@Body() dto: TestTriggerDto) {
    const result = await this.orchestratorService.escalateViolation({
      domain: 'LIVE_STREAM_SAFETY',
      targetId: dto.channelId || 'test_channel_001',
      targetUserId: dto.hostId || 'test_host_001',
      riskScore: dto.riskScore || 85,
      evidenceImageUrl: dto.snapshotUrl || 'https://picsum.photos/800/450',
      violationTags: dto.violationTags || ['NUDITY', 'PROHIBITED_ACTION'],
      preliminaryRationale: dto.rationale || '성인용 선정적 행위 및 신체 노출 포착',
    });

    return {
      ok: true,
      data: result,
    };
  }
}
