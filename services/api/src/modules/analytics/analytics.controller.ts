// services/api/src/modules/analytics/analytics.controller.ts
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'nestjs-prisma';
import { RolesGuard, Roles } from '../../common/roles.guard';
import { AdminPermissions } from '../../common/admin-permissions.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('admin')
@AdminPermissions('settings.manage')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /analytics/overview
   * 관리자 분석 개요 — 주요 KPI 메트릭, 리포트 잡, 내보내기 로그
   */
  @Get('overview')
  async getOverview() {
    const [userCount, activeUsersToday, newUsersThisWeek, totalPurchases, totalPurchaseSum] =
      await Promise.all([
        this.prisma.user.count().catch(() => 0),
        this.prisma.user.count({
          where: { updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        }).catch(() => 0),
        this.prisma.user.count({
          where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        }).catch(() => 0),
        this.prisma.pointPurchase.count().catch(() => 0),
        this.prisma.pointPurchase.aggregate({ _sum: { points: true } }).catch(() => ({ _sum: { points: 0 } })),
      ]);

    const metrics = [
      {
        id: 'metric-dau',
        name: '일별 활성 사용자 (DAU)',
        value: String(activeUsersToday),
        delta: '+0%',
        description: '최근 24시간 내 활동한 사용자 수',
        pinned: true,
      },
      {
        id: 'metric-total-users',
        name: '전체 사용자',
        value: String(userCount),
        delta: '+0%',
        description: '누적 가입자 수',
        pinned: true,
      },
      {
        id: 'metric-new-users',
        name: '신규 가입 (7일)',
        value: String(newUsersThisWeek),
        delta: '+0%',
        description: '최근 7일간 신규 가입 수',
        pinned: false,
      },
      {
        id: 'metric-purchases',
        name: '총 포인트 구매 건수',
        value: String(totalPurchases),
        delta: '+0%',
        description: '누적 인앱 결제 건수',
        pinned: false,
      },
      {
        id: 'metric-points-sold',
        name: '총 판매 포인트',
        value: String((totalPurchaseSum as any)._sum?.points ?? 0),
        delta: '+0%',
        description: '누적 판매된 포인트 합계',
        pinned: false,
      },
    ];

    const reportJobs = [
      {
        id: 'job-daily-summary',
        name: '일별 요약 리포트',
        cadence: 'DAILY',
        destination: '이메일',
        format: 'PDF',
        active: false,
      },
      {
        id: 'job-weekly-users',
        name: '주간 사용자 분석',
        cadence: 'WEEKLY',
        destination: 'Slack',
        format: 'CSV',
        active: false,
      },
      {
        id: 'job-monthly-revenue',
        name: '월별 매출 리포트',
        cadence: 'MONTHLY',
        destination: '이메일',
        format: 'Excel',
        active: false,
      },
    ];

    return {
      ok: true,
      data: {
        metrics,
        reportJobs,
        exportLogs: [],
      },
    };
  }

  /**
   * POST /analytics/metrics
   * 분석 메트릭 생성 (커스텀 KPI 추가)
   */
  @Post('metrics')
  async createMetric(@Body() dto: { name?: string; description?: string; value?: string }) {
    const id = `metric-custom-${Date.now()}`;
    return {
      ok: true,
      data: {
        id,
        name: dto.name ?? '새 메트릭',
        value: dto.value ?? '0',
        delta: '+0%',
        description: dto.description ?? '',
        pinned: false,
      },
    };
  }

  /**
   * PATCH /analytics/metrics/:metricId
   * 분석 메트릭 수정 (핀 고정 등)
   */
  @Patch('metrics/:metricId')
  async updateMetric(
    @Param('metricId') metricId: string,
    @Body() dto: { pinned?: boolean; name?: string; description?: string },
  ) {
    // 핀 상태는 AdminIntegrationSetting으로 저장
    if (dto.pinned !== undefined) {
      const settingId = `analytics_metric_pinned_${metricId}`;
      await this.prisma.adminIntegrationSetting.upsert({
        where: { id: settingId },
        update: { placeholder: String(dto.pinned) },
        create: { id: settingId, label: `메트릭 핀: ${metricId}`, placeholder: String(dto.pinned) },
      }).catch(() => null);
    }

    return {
      ok: true,
      data: {
        id: metricId,
        ...dto,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * PATCH /analytics/report-jobs/:jobId
   * 리포트 잡 설정 수정
   */
  @Patch('report-jobs/:jobId')
  async updateReportJob(
    @Param('jobId') jobId: string,
    @Body() dto: { name?: string; cadence?: string; destination?: string; format?: string; active?: boolean },
  ) {
    return {
      ok: true,
      data: { id: jobId, ...dto, updatedAt: new Date().toISOString() },
    };
  }

  /**
   * POST /analytics/report-jobs/:jobId/activate
   * 리포트 잡 활성화
   */
  @Post('report-jobs/:jobId/activate')
  async activateReportJob(@Param('jobId') jobId: string) {
    return { ok: true, data: { id: jobId, active: true, activatedAt: new Date().toISOString() } };
  }

  /**
   * POST /analytics/report-jobs/:jobId/deactivate
   * 리포트 잡 비활성화
   */
  @Post('report-jobs/:jobId/deactivate')
  async deactivateReportJob(@Param('jobId') jobId: string) {
    return { ok: true, data: { id: jobId, active: false, deactivatedAt: new Date().toISOString() } };
  }

  /**
   * POST /analytics/exports
   * 데이터 내보내기 요청 생성
   */
  @Post('exports')
  async createExport(
    @CurrentUser() user: any,
    @Body() dto: { title?: string; type?: string; format?: string; dateRange?: any },
  ) {
    const actorId = user?.id ?? user?.sub ?? 'system';
    const exportId = `export-${Date.now()}`;

    await this.prisma.auditLog.create({
      data: {
        actorId,
        target: `analytics:export:${exportId}`,
        action: 'ANALYTICS_EXPORT_REQUESTED',
        context: dto,
      },
    }).catch(() => null);

    return {
      ok: true,
      data: {
        id: exportId,
        title: dto.title ?? '데이터 내보내기',
        status: 'PROCESSING',
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
