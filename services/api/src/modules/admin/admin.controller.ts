import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'nestjs-prisma';
import { RolesGuard, Roles } from '../../common/roles.guard';
import { AdminPermissions } from '../../common/admin-permissions.guard';
import {
  ApproveRefundDto,
  CreateAdminTeamMemberDto,
  CreateRefundDto,
  DenyRefundDto,
  SaveAdminAuditMemoDto,
  SetUserRoleDto,
  UpdateActionPointPolicyDto,
  UpdateAdminFeatureFlagDto,
  UpdateAdminIntegrationSettingDto,
  UpdateAdminTeamMemberDto,
  UpdateAdminTeamMemberPasswordDto,
  UpdateCallRateSettingDto,
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

  @Get('settings/call-rate')
  async getCallRateSetting() {
    return this.adminSettings.getCallRateSetting();
  }

  @Patch('settings/call-rate')
  async updateCallRateSetting(
    @CurrentUser() user: any,
    @Body() dto: UpdateCallRateSettingDto,
  ) {
    const actorId = user?.id ?? user?.sub;
    return this.adminSettings.updateCallRateSetting(actorId, dto);
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
    @Body() dto?: ApproveRefundDto,
  ) {
    const actorId = user?.id ?? user?.sub;

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.refundRequest.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!existing) {
        throw new NotFoundException('해당 환불 요청을 찾을 수 없습니다.');
      }

      if (existing.status !== 'pending') {
        throw new BadRequestException('이미 처리되었거나 대기 중이 아닌 환불 요청입니다.');
      }

      // 연결된 포인트 결제 내역 확인
      const purchase = await tx.pointPurchase.findFirst({
        where: {
          userId: existing.userId,
          OR: [
            { transactionId: existing.receiptId },
            { productId: existing.productId, status: 'completed' },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      const refundPoints = purchase?.points ?? 0;
      const targetUser = existing.user;

      if (!targetUser) {
        throw new NotFoundException('환불 대상 사용자를 찾을 수 없습니다.');
      }

      // 유저의 잔여 포인트 검증 (단, forceDeduct가 아닐 때 잔여 포인트가 부족하면 차단)
      if (refundPoints > 0 && targetUser.pointsBalance < refundPoints && !dto?.forceDeduct) {
        throw new BadRequestException(
          `회원의 잔여 온(ON) 포인트가 부족합니다. (현재 보유: ${targetUser.pointsBalance.toLocaleString()} 온, 회수 필요: ${refundPoints.toLocaleString()} 온). 이미 사용된 포인트는 전자상거래법에 따라 환불이 제한될 수 있습니다. 강제 회수 승인이 필요한 경우 관리자 옵션을 사용하세요.`,
        );
      }

      const deductAmount = Math.min(targetUser.pointsBalance, refundPoints > 0 ? refundPoints : targetUser.pointsBalance);

      // 1. 유저 보유 포인트 차감
      if (deductAmount > 0) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            pointsBalance: { decrement: deductAmount },
          },
        });

        // 2. 활동 계정 및 지갑 원장 회수 기록
        const activityAccount = await tx.activityAccount.findFirst({
          where: { legacyUserId: existing.userId, status: 'active' },
          include: { wallet: true },
        });

        if (activityAccount?.wallet) {
          const wallet = activityAccount.wallet;
          const actualWalletDeduct = Math.min(wallet.spendableBalance, deductAmount);

          if (actualWalletDeduct > 0) {
            const updatedWallet = await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                spendableBalance: { decrement: actualWalletDeduct },
              },
            });

            await tx.walletLedgerEntry.create({
              data: {
                walletId: wallet.id,
                kind: 'debit',
                source: 'refund_clawback',
                deltaSpendable: -actualWalletDeduct,
                deltaRedeemable: 0,
                deltaPending: 0,
                spendableAfter: updatedWallet.spendableBalance,
                redeemableAfter: updatedWallet.redeemableBalance,
                pendingAfter: updatedWallet.pendingEarnings,
                idempotencyKey: `refund_clawback_${existing.id}`,
                referenceType: 'refund_request',
                referenceId: existing.id,
                metadata: {
                  refundRequestId: existing.id,
                  productId: existing.productId,
                  platform: existing.platform,
                  receiptId: existing.receiptId,
                  approvedBy: actorId,
                  memo: dto?.memo ?? null,
                },
              },
            });
          }
        }
      }

      // 3. 결제 상태 업데이트 (환불 완료)
      if (purchase) {
        await tx.pointPurchase.update({
          where: { id: purchase.id },
          data: { status: 'refunded' },
        });
      }

      // 4. 환불 요청 상태 변경
      const updated = await tx.refundRequest.update({
        where: { id },
        data: {
          status: 'approved',
          decidedAt: new Date(),
        },
      });

      // 5. 감사 로그 작성
      await tx.auditLog.create({
        data: {
          actorId,
          target: `refund:${id}`,
          action: 'REFUND_REQUEST_APPROVED',
          reason: dto?.memo ?? '환불 승인 및 포인트 회수 완료',
          context: {
            previousStatus: existing.status,
            nextStatus: 'approved',
            userId: existing.userId,
            deductedPoints: deductAmount,
            purchaseId: purchase?.id ?? null,
            platform: existing.platform,
          },
        },
      });

      return {
        ok: true,
        data: updated,
        clawback: {
          deductedPoints: deductAmount,
          originalPoints: refundPoints,
        },
      };
    });
  }

  @AdminPermissions('refunds.manage')
  @Patch('refunds/:id/deny')
  async deny(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto?: DenyRefundDto,
  ) {
    const actorId = user?.id ?? user?.sub;

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.refundRequest.findUnique({
        where: { id },
        select: { status: true, userId: true },
      });

      if (!existing) {
        throw new NotFoundException('해당 환불 요청을 찾을 수 없습니다.');
      }

      if (existing.status !== 'pending') {
        throw new BadRequestException('이미 처리되었거나 대기 중이 아닌 환불 요청입니다.');
      }

      const updated = await tx.refundRequest.update({
        where: { id },
        data: {
          status: 'denied',
          decidedAt: new Date(),
          reason: dto?.reason ?? undefined,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          target: `refund:${id}`,
          action: 'REFUND_REQUEST_DENIED',
          reason: dto?.reason ?? '환불 요청 반려',
          context: {
            previousStatus: existing.status,
            nextStatus: 'denied',
            userId: existing.userId,
          },
        },
      });

      return { ok: true, data: updated };
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
