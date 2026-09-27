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
  UpdateAdminFeatureFlagDto,
  UpdateAdminIntegrationSettingDto,
  UpdateAdminTeamMemberDto,
  UpdateAdminTeamMemberPasswordDto,
} from './dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminSettingsService } from './admin-settings.service';

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
    ]);

    return {
      ok: true,
      data: {
        totalPurchasesCount,
        totalPointsPurchased: totalPurchasesSum._sum.points ?? 0,
        pendingRefundsCount,
        totalWallets: walletsStats._count.id,
        totalSpendableBalance: walletsStats._sum.spendableBalance ?? 0,
        totalRedeemableBalance: walletsStats._sum.redeemableBalance ?? 0,
        totalPendingEarnings: walletsStats._sum.pendingEarnings ?? 0,
        recentPurchases,
      },
    };
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
}
