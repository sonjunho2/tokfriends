import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'nestjs-prisma';
import { RolesGuard, Roles } from '../../common/roles.guard';
import { AdminPermissions } from '../../common/admin-permissions.guard';
import {
  CreateAdminTeamMemberDto,
  CreateRefundDto,
  SaveAdminAuditMemoDto,
  SetUserRoleDto,
  UpdateActionPointPolicyDto,
  UpdateAdminFeatureFlagDto,
  UpdateAdminIntegrationSettingDto,
  UpdateAdminTeamMemberDto,
  UpdateAdminTeamMemberPasswordDto,
} from './dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminSettingsService } from './admin-settings.service';
import { SettlementService } from '../settlement/settlement.service';
import {
  AdminApproveSettlementDto,
  AdminRejectSettlementDto,
} from '../settlement/dto/create-settlement-request.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('admin')
@AdminPermissions('settings.manage')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminSettings: AdminSettingsService,
    private readonly prisma: PrismaService,
    private readonly settlementService: SettlementService,
  ) {}

  @Get('settings/snapshot')
  async getSettingsSnapshot(@CurrentUser() user: any) {
    const actorId = user?.id ?? user?.sub;
    return this.adminSettings.getSnapshot(actorId);
  }

  @Post('settings/team')
  async createSettingsTeamMember(
    @CurrentUser() user: any,
    @Body() dto: CreateAdminTeamMemberDto,
  ) {
    const actorId = user?.id ?? user?.sub;
    return this.adminSettings.createTeamMember(actorId, dto);
  }

  @Patch('settings/team/:memberId')
  async updateSettingsTeamMember(
    @CurrentUser() user: any,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateAdminTeamMemberDto,
  ) {
    const actorId = user?.id ?? user?.sub;
    return this.adminSettings.updateTeamMember(actorId, memberId, dto);
  }

  @Patch('settings/team/:memberId/password')
  async updateSettingsTeamMemberPassword(
    @CurrentUser() user: any,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateAdminTeamMemberPasswordDto,
  ) {
    const actorId = user?.id ?? user?.sub;
    return this.adminSettings.updateTeamMemberPassword(actorId, memberId, dto);
  }

  @Delete('settings/team/:memberId')
  async deleteSettingsTeamMember(
    @CurrentUser() user: any,
    @Param('memberId') memberId: string,
  ) {
    const actorId = user?.id ?? user?.sub;
    return this.adminSettings.deleteTeamMember(actorId, memberId);
  }

  @Patch('settings/feature-flags/:flagId')
  async updateSettingsFeatureFlag(
    @CurrentUser() user: any,
    @Param('flagId') flagId: string,
    @Body() dto: UpdateAdminFeatureFlagDto,
  ) {
    const actorId = user?.id ?? user?.sub;
    return this.adminSettings.updateFeatureFlag(actorId, flagId, dto);
  }

  @Patch('settings/integrations/:settingId')
  async updateSettingsIntegration(
    @CurrentUser() user: any,
    @Param('settingId') settingId: string,
    @Body() dto: UpdateAdminIntegrationSettingDto,
  ) {
    const actorId = user?.id ?? user?.sub;
    return this.adminSettings.updateIntegrationSetting(actorId, settingId, dto);
  }

  @Post('settings/audit-log')
  async saveSettingsAuditMemo(
    @CurrentUser() user: any,
    @Body() dto: SaveAdminAuditMemoDto,
  ) {
    const actorId = user?.id ?? user?.sub;
    return this.adminSettings.saveAuditMemo(actorId, dto);
  }

  @Get('settings/action-points')
  async getActionPointPolicy() {
    return this.adminSettings.getActionPointPolicy();
  }

  @Patch('settings/action-points')
  async updateActionPointPolicy(
    @CurrentUser() user: any,
    @Body() dto: UpdateActionPointPolicyDto,
  ) {
    const actorId = user?.id ?? user?.sub;
    return this.adminSettings.updateActionPointPolicy(actorId, dto);
  }
  @AdminPermissions('users.manage')
  @Patch('users/:id/role')
  async setRole(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: SetUserRoleDto,
  ) {
    const actorId = user?.id ?? user?.sub;

    return this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { id },
        select: { role: true },
      });

      const updatedUser = await tx.user.update({
        where: { id },
        data: { role: dto.role },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          target: `user:${id}`,
          action: 'USER_ROLE_CHANGED',
          context: {
            previousRole: existingUser?.role ?? null,
            nextRole: dto.role,
          },
        },
      });

      return updatedUser;
    });
  }
  @AdminPermissions('refunds.view')
  @Get('refunds')
  async listRefunds() {
    return this.prisma.refundRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            pointsBalance: true,
          },
        },
      },
    });
  }

  @AdminPermissions('refunds.view')
  @Get('settlement/summary')
  async getSettlementSummary() {
    const [
      totalPurchasesCount,
      totalPurchasesSum,
      pendingRefundsCount,
      walletsStats,
      recentPurchases,
      pendingSettlementsCount,
      pendingSettlementsSum,
      approvedSettlementsSum,
    ] = await Promise.all([
      this.prisma.pointPurchase.count(),
      this.prisma.pointPurchase.aggregate({ _sum: { points: true } }),
      this.prisma.refundRequest.count({ where: { status: 'pending' } }),
      this.prisma.wallet.aggregate({
        _sum: {
          spendableBalance: true,
          redeemableBalance: true,
          pendingEarnings: true,
        },
        _count: { id: true },
      }),
      this.prisma.pointPurchase.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, displayName: true },
          },
        },
      }),
      this.prisma.settlementRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.settlementRequest.aggregate({
        where: { status: 'PENDING' },
        _sum: { pointsAmount: true, netAmount: true },
      }),
      this.prisma.settlementRequest.aggregate({
        where: { status: 'APPROVED' },
        _sum: { platformFeeKrw: true, krwAmount: true, netAmount: true },
      }),
    ]);

    return {
      ok: true,
      data: {
        totalPurchasesCount,
        totalPointsPurchased: totalPurchasesSum._sum.points ?? 0,
        pendingRefundsCount,
        pendingSettlementsCount,
        pendingSettlementsPoints: pendingSettlementsSum._sum.pointsAmount ?? 0,
        pendingSettlementsNetAmount: pendingSettlementsSum._sum.netAmount ?? 0,
        totalPlatformRevenueKrw: approvedSettlementsSum._sum.platformFeeKrw ?? 0,
        totalWallets: walletsStats._count.id,
        totalSpendableBalance: walletsStats._sum.spendableBalance ?? 0,
        totalRedeemableBalance: walletsStats._sum.redeemableBalance ?? 0,
        totalPendingEarnings: walletsStats._sum.pendingEarnings ?? 0,
        recentPurchases,
      },
    };
  }

  @AdminPermissions('refunds.view')
  @Get('settlement/requests')
  async listSettlementRequests(
    @Query('page') page = '1',
    @Query('limit') limit = '15',
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.settlementService.adminListRequests({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 15,
      status,
      search,
    });
  }

  @AdminPermissions('refunds.manage')
  @Post('settlement/requests/:id/approve')
  async approveSettlementRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AdminApproveSettlementDto,
  ) {
    const actorId = user?.id ?? user?.sub;
    return this.settlementService.adminApproveRequest(actorId, id, dto);
  }

  @AdminPermissions('refunds.manage')
  @Post('settlement/requests/:id/reject')
  async rejectSettlementRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AdminRejectSettlementDto,
  ) {
    const actorId = user?.id ?? user?.sub;
    return this.settlementService.adminRejectRequest(actorId, id, dto);
  }

  @AdminPermissions('refunds.view')
  @Get('settlement/purchases')
  async listPurchases(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('platform') platform?: string,
  ) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (p - 1) * take;
    const where: any = {};
    if (platform) where.platform = platform;

    const [total, items] = await Promise.all([
      this.prisma.pointPurchase.count({ where }),
      this.prisma.pointPurchase.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, displayName: true },
          },
        },
      }),
    ]);

    return {
      ok: true,
      page: p,
      limit: take,
      total,
      totalPages: Math.ceil(total / take) || 1,
      items,
    };
  }

  @AdminPermissions('refunds.view')
  @Get('settlement/ledger')
  async listLedger(@Query('take') take = '20') {
    const n = Math.min(50, Math.max(1, parseInt(take, 10) || 20));
    const items = await this.prisma.walletLedgerEntry.findMany({
      take: n,
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: {
          select: {
            id: true,
            activityAccountId: true,
            activityAccount: {
              select: {
                displayName: true,
                handle: true,
              },
            },
          },
        },
      },
    });
    return { ok: true, items };
  }

  @AdminPermissions('refunds.manage')
  @Post('refunds')
  async createRefund(
    @CurrentUser() user: any,
    @Body() dto: CreateRefundDto,
  ) {
    const actorId = user?.id ?? user?.sub;

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.refundRequest.create({ data: dto });

      await tx.auditLog.create({
        data: {
          actorId,
          target: `refund:${created.id}`,
          action: 'REFUND_REQUEST_CREATED',
          reason: dto.reason ?? null,
          context: {
            userId: dto.userId,
            platform: dto.platform,
            productId: dto.productId,
          },
        },
      });

      return created;
    });
  }

  @AdminPermissions('refunds.manage')
  @Patch('refunds/:id/approve')
  async approve(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const actorId = user?.id ?? user?.sub;

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.refundRequest.findUnique({
        where: { id },
        select: { status: true },
      });

      const updated = await tx.refundRequest.update({
        where: { id },
        data: {
          status: 'approved',
          decidedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          target: `refund:${id}`,
          action: 'REFUND_REQUEST_APPROVED',
          context: {
            previousStatus: existing?.status ?? null,
            nextStatus: 'approved',
          },
        },
      });

      return updated;
    });
  }

  @AdminPermissions('refunds.manage')
  @Patch('refunds/:id/deny')
  async deny(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const actorId = user?.id ?? user?.sub;

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.refundRequest.findUnique({
        where: { id },
        select: { status: true },
      });

      const updated = await tx.refundRequest.update({
        where: { id },
        data: {
          status: 'denied',
          decidedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          target: `refund:${id}`,
          action: 'REFUND_REQUEST_DENIED',
          context: {
            previousStatus: existing?.status ?? null,
            nextStatus: 'denied',
          },
        },
      });

      return updated;
    });
  }

  @AdminPermissions('settings.manage')
  @Get('ads-rewards/overview')
  async getAdsRewardsOverview() {
    const [rewardEntries, totalPointsDistributed, totalUsersRewarded, recentRewards] = await Promise.all([
      this.prisma.walletLedgerEntry.count({
        where: {
          OR: [
            { kind: { contains: 'reward', mode: 'insensitive' } },
            { source: { contains: 'reward', mode: 'insensitive' } },
            { source: { contains: 'ad', mode: 'insensitive' } },
          ],
        },
      }),
      this.prisma.walletLedgerEntry.aggregate({
        where: {
          OR: [
            { kind: { contains: 'reward', mode: 'insensitive' } },
            { source: { contains: 'reward', mode: 'insensitive' } },
            { source: { contains: 'ad', mode: 'insensitive' } },
          ],
        },
        _sum: { deltaSpendable: true },
      }),
      this.prisma.wallet.count(),
      this.prisma.walletLedgerEntry.findMany({
        where: {
          OR: [
            { kind: { contains: 'reward', mode: 'insensitive' } },
            { source: { contains: 'reward', mode: 'insensitive' } },
            { source: { contains: 'ad', mode: 'insensitive' } },
          ],
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: {
            select: {
              activityAccountId: true,
              activityAccount: {
                select: { displayName: true, handle: true },
              },
            },
          },
        },
      }),
    ]);

    const settingRows = await this.prisma.adminIntegrationSetting.findMany({
      where: {
        id: {
          in: [
            'ad_reward_daily_limit',
            'ad_reward_points_per_view',
            'ad_network_admob_app_id',
            'ad_network_admob_unit_id',
            'attendance_reward_points',
            'referral_reward_points',
          ],
        },
      },
    });

    const settingsMap = new Map(settingRows.map((r) => [r.id, r.placeholder || r.encryptedValue || '']));

    return {
      ok: true,
      data: {
        stats: {
          totalRewardEvents: rewardEntries,
          totalPointsDistributed: totalPointsDistributed._sum.deltaSpendable ?? 0,
          totalEligibleUsers: totalUsersRewarded,
          activeCampaignsCount: 3,
        },
        policies: {
          dailyAdLimit: parseInt(settingsMap.get('ad_reward_daily_limit') || '5', 10),
          pointsPerAd: parseInt(settingsMap.get('ad_reward_points_per_view') || '10', 10),
          admobAppId: settingsMap.get('ad_network_admob_app_id') || 'ca-app-pub-3940256099942544~3347511713',
          admobUnitId: settingsMap.get('ad_network_admob_unit_id') || 'ca-app-pub-3940256099942544/5224354917',
          attendancePoints: parseInt(settingsMap.get('attendance_reward_points') || '5', 10),
          referralPoints: parseInt(settingsMap.get('referral_reward_points') || '50', 10),
          enabled: true,
        },
        recentRewards,
      },
    };
  }

  @AdminPermissions('settings.manage')
  @Patch('ads-rewards/policies')
  async updateAdsRewardsPolicies(
    @CurrentUser() user: any,
    @Body() dto: {
      dailyAdLimit?: number;
      pointsPerAd?: number;
      admobAppId?: string;
      admobUnitId?: string;
      attendancePoints?: number;
      referralPoints?: number;
    },
  ) {
    const actorId = user?.id ?? user?.sub;

    const upserts = [];
    if (dto.dailyAdLimit !== undefined) {
      upserts.push(
        this.prisma.adminIntegrationSetting.upsert({
          where: { id: 'ad_reward_daily_limit' },
          update: { placeholder: String(dto.dailyAdLimit) },
          create: { id: 'ad_reward_daily_limit', label: '일일 광고 시청 제한', placeholder: String(dto.dailyAdLimit) },
        }),
      );
    }
    if (dto.pointsPerAd !== undefined) {
      upserts.push(
        this.prisma.adminIntegrationSetting.upsert({
          where: { id: 'ad_reward_points_per_view' },
          update: { placeholder: String(dto.pointsPerAd) },
          create: { id: 'ad_reward_points_per_view', label: '광고 1회 시청 보상 포인트', placeholder: String(dto.pointsPerAd) },
        }),
      );
    }
    if (dto.admobAppId !== undefined) {
      upserts.push(
        this.prisma.adminIntegrationSetting.upsert({
          where: { id: 'ad_network_admob_app_id' },
          update: { placeholder: dto.admobAppId },
          create: { id: 'ad_network_admob_app_id', label: 'AdMob 앱 ID', placeholder: dto.admobAppId },
        }),
      );
    }
    if (dto.admobUnitId !== undefined) {
      upserts.push(
        this.prisma.adminIntegrationSetting.upsert({
          where: { id: 'ad_network_admob_unit_id' },
          update: { placeholder: dto.admobUnitId },
          create: { id: 'ad_network_admob_unit_id', label: 'AdMob 보상형 광고 단위 ID', placeholder: dto.admobUnitId },
        }),
      );
    }
    if (dto.attendancePoints !== undefined) {
      upserts.push(
        this.prisma.adminIntegrationSetting.upsert({
          where: { id: 'attendance_reward_points' },
          update: { placeholder: String(dto.attendancePoints) },
          create: { id: 'attendance_reward_points', label: '출석체크 보상 포인트', placeholder: String(dto.attendancePoints) },
        }),
      );
    }
    if (dto.referralPoints !== undefined) {
      upserts.push(
        this.prisma.adminIntegrationSetting.upsert({
          where: { id: 'referral_reward_points' },
          update: { placeholder: String(dto.referralPoints) },
          create: { id: 'referral_reward_points', label: '친구 초대 보상 포인트', placeholder: String(dto.referralPoints) },
        }),
      );
    }

    await Promise.all(upserts);

    await this.prisma.auditLog.create({
      data: {
        actorId,
        target: 'settings:ads-rewards',
        action: 'UPDATE_ADS_REWARDS_POLICIES',
        reason: 'Updated ads & rewards policies',
        context: dto,
      },
    });

    return { ok: true, data: dto };
  }
}
