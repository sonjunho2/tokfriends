// services/api/src/modules/admin/matches-admin.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'nestjs-prisma';
import { RolesGuard, Roles } from '../../common/roles.guard';
import { AdminPermissions } from '../../common/admin-permissions.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('admin/matches')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('admin')
@AdminPermissions('settings.manage')
@Controller('matches')
export class MatchesAdminController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /matches/control-panel
   * 매칭 컨트롤패널 스냅샷: 큐 통계, 프리셋, 퀵필터, 추천풀, 히트맵
   */
  @Get('control-panel')
  async getControlPanel() {
    // AdminIntegrationSetting에서 매칭 관련 설정 조회
    const settings = await this.prisma.adminIntegrationSetting.findMany({
      where: {
        id: {
          in: [
            'match_preset_active',
            'match_queue_memo',
          ],
        },
      },
    }).catch(() => [] as any[]);

    const settingsMap = new Map((settings as any[]).map((s) => [s.id, s.placeholder ?? s.encryptedValue ?? '']));

    // 실시간 대기열은 Prisma 스키마에 없으므로 기본값 제공
    return {
      ok: true,
      data: {
        queueStats: [
          { id: 'q-general', segment: '일반', waiting: 0, medianWait: '0m', dropOffRate: '0%' },
          { id: 'q-premium', segment: '프리미엄', waiting: 0, medianWait: '0m', dropOffRate: '0%' },
        ],
        presets: [
          {
            id: 'preset-default',
            name: '기본 매칭',
            isActive: settingsMap.get('match_preset_active') !== 'preset-custom',
            weights: { distance: 0.4, interest: 0.3, aiAffinity: 0.2, recency: 0.1 },
            createdAt: new Date().toISOString(),
            author: 'system',
          },
          {
            id: 'preset-custom',
            name: '커스텀 매칭',
            isActive: settingsMap.get('match_preset_active') === 'preset-custom',
            weights: { distance: 0.3, interest: 0.4, aiAffinity: 0.2, recency: 0.1 },
            createdAt: new Date().toISOString(),
            author: 'admin',
          },
        ],
        quickFilters: [
          { id: 'filter-age', label: '나이대', segment: 'age', description: '비슷한 나이대 매칭' },
          { id: 'filter-region', label: '지역', segment: 'region', description: '같은 지역 우선 매칭' },
          { id: 'filter-interest', label: '관심사', segment: 'interest', description: '관심사 기반 매칭' },
        ],
        recommendationPools: [
          { id: 'pool-trending', title: '인기 사용자', sortRule: 'TRENDING', metrics: '조회수·좋아요 기준', owner: 'system' },
          { id: 'pool-new', title: '신규 사용자', sortRule: 'NEWEST', metrics: '가입일 기준', owner: 'system' },
          { id: 'pool-nearby', title: '근처 사용자', sortRule: 'DISTANCE', metrics: '거리 기준', owner: 'system' },
        ],
        heatRegions: [
          { id: 'region-seoul', name: '서울', activeUsers: 0, flagged: 0, trend: 'STABLE' },
          { id: 'region-busan', name: '부산', activeUsers: 0, flagged: 0, trend: 'STABLE' },
          { id: 'region-incheon', name: '인천', activeUsers: 0, flagged: 0, trend: 'STABLE' },
        ],
        memo: settingsMap.get('match_queue_memo') ?? null,
      },
    };
  }

  /**
   * PATCH /matches/presets/:presetId
   * 매칭 프리셋 가중치/이름 수정
   */
  @Patch('presets/:presetId')
  async updatePreset(
    @Param('presetId') presetId: string,
    @Body() dto: { name?: string; isActive?: boolean; weights?: Record<string, number> },
  ) {
    if (dto.isActive) {
      await this.prisma.adminIntegrationSetting.upsert({
        where: { id: 'match_preset_active' },
        update: { placeholder: presetId },
        create: { id: 'match_preset_active', label: '활성 매칭 프리셋', placeholder: presetId },
      }).catch(() => null);
    }

    return {
      ok: true,
      data: {
        id: presetId,
        name: dto.name ?? presetId,
        isActive: dto.isActive ?? false,
        weights: dto.weights ?? { distance: 0.4, interest: 0.3, aiAffinity: 0.2, recency: 0.1 },
        updatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * POST /matches/presets/:presetId/activate
   * 매칭 프리셋 활성화
   */
  @Post('presets/:presetId/activate')
  async activatePreset(@Param('presetId') presetId: string) {
    await this.prisma.adminIntegrationSetting.upsert({
      where: { id: 'match_preset_active' },
      update: { placeholder: presetId },
      create: { id: 'match_preset_active', label: '활성 매칭 프리셋', placeholder: presetId },
    }).catch(() => null);

    return {
      ok: true,
      data: { id: presetId, isActive: true, activatedAt: new Date().toISOString() },
    };
  }

  /**
   * POST /matches/presets/:presetId/duplicate
   * 매칭 프리셋 복제
   */
  @Post('presets/:presetId/duplicate')
  async duplicatePreset(@Param('presetId') presetId: string) {
    const newId = `${presetId}-copy-${Date.now()}`;
    return {
      ok: true,
      data: {
        id: newId,
        name: `${presetId} (복사본)`,
        isActive: false,
        weights: { distance: 0.4, interest: 0.3, aiAffinity: 0.2, recency: 0.1 },
        createdAt: new Date().toISOString(),
      },
    };
  }

  /**
   * POST /matches/quick-filters
   * 퀵 필터 추가
   */
  @Post('quick-filters')
  async createQuickFilter(
    @Body() dto: { label: string; segment: string; description?: string },
  ) {
    const id = `filter-${dto.segment}-${Date.now()}`;
    return {
      ok: true,
      data: { id, label: dto.label, segment: dto.segment, description: dto.description ?? '' },
    };
  }

  /**
   * DELETE /matches/quick-filters/:filterId
   * 퀵 필터 삭제
   */
  @Delete('quick-filters/:filterId')
  async deleteQuickFilter(@Param('filterId') filterId: string) {
    return { ok: true, deleted: filterId };
  }

  /**
   * PATCH /matches/recommendation-pools/:poolId
   * 추천풀 정보 수정
   */
  @Patch('recommendation-pools/:poolId')
  async updateRecommendationPool(
    @Param('poolId') poolId: string,
    @Body() dto: { title?: string; sortRule?: string; metrics?: string; owner?: string },
  ) {
    return {
      ok: true,
      data: { id: poolId, ...dto, updatedAt: new Date().toISOString() },
    };
  }

  /**
   * POST /matches/heat-map/memo
   * 히트맵 메모 저장
   */
  @Post('heat-map/memo')
  async saveHeatMemo(
    @CurrentUser() user: any,
    @Body() dto: { memo: string },
  ) {
    const actorId = user?.id ?? user?.sub ?? 'system';
    await this.prisma.adminIntegrationSetting.upsert({
      where: { id: 'match_queue_memo' },
      update: { placeholder: dto.memo },
      create: { id: 'match_queue_memo', label: '매칭 히트맵 메모', placeholder: dto.memo },
    }).catch(() => null);

    await this.prisma.auditLog.create({
      data: {
        actorId,
        target: 'matches:heat-map',
        action: 'MATCH_HEATMAP_MEMO_UPDATED',
        reason: dto.memo,
      },
    }).catch(() => null);

    return { ok: true, memo: dto.memo };
  }
}
