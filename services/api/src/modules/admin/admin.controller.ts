import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'nestjs-prisma';
import { RolesGuard, Roles } from '../../common/roles.guard';
import { AdminPermissions } from '../../common/admin-permissions.guard';
import {
  CreateAdminTeamMemberDto,
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

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('admin')
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
    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role as any },
    });
  }

  // ==========================================
  // [사람 운영자 필수 관리 기능: 회원 관리]
  // ==========================================
  @Get('users')
  async searchUsers(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const page = Math.max(1, parseInt(pageRaw || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitRaw || '20', 10) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search && search.trim().length > 0) {
      const term = search.trim();
      where.OR = [
        { nickname: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { displayName: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          photos: { take: 1, orderBy: { sortOrder: 'asc' } },
        },
      }),
    ]);

    return {
      items: users.map((u) => ({
        id: u.id,
        nickname: u.nickname,
        displayName: u.displayName,
        email: u.email,
        avatarUrl: u.avatarUrl || u.photos?.[0]?.url || null,
        pointBalance: u.pointBalance,
        callRatePerMinute: u.callRatePerMinute,
        status: u.status,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('users/:userId')
  async getUserDetail(@Param('userId') userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        adminProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }

    const [hostedCount, guestCount, giftsSent, giftsReceived] = await Promise.all([
      this.prisma.privateCallSession.count({ where: { hostId: userId } }).catch(() => 0),
      this.prisma.privateCallSession.count({ where: { guestId: userId } }).catch(() => 0),
      this.prisma.giftTransaction.count({ where: { senderId: userId } }).catch(() => 0),
      this.prisma.giftTransaction.count({ where: { receiverId: userId } }).catch(() => 0),
    ]);

    return {
      id: user.id,
      nickname: user.nickname,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      pointBalance: user.pointBalance,
      callRatePerMinute: user.callRatePerMinute,
      status: user.status,
      role: user.role,
      photos: user.photos.map((p) => ({ id: p.id, url: p.url, order: p.sortOrder })),
      createdAt: user.createdAt.toISOString(),
      stats: {
        hostedCalls: hostedCount,
        guestCalls: guestCount,
        giftsSent,
        giftsReceived,
      },
    };
  }

  @Patch('users/:userId')
  async updateUser(
    @CurrentUser() actor: any,
    @Param('userId') userId: string,
    @Body() dto: {
      nickname?: string;
      displayName?: string;
      bio?: string;
      callRatePerMinute?: number;
      pointBalance?: number;
      status?: string;
      role?: string;
      auditMemo?: string;
    },
  ) {
    const actorId = actor?.id ?? actor?.sub;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('회원을 찾을 수 없습니다.');

    const data: any = {};
    if (dto.nickname !== undefined) data.nickname = dto.nickname;
    if (dto.displayName !== undefined) data.displayName = dto.displayName;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.callRatePerMinute !== undefined) data.callRatePerMinute = dto.callRatePerMinute;
    if (dto.pointBalance !== undefined) data.pointBalance = dto.pointBalance;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.role !== undefined) data.role = dto.role;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        target: `user:${userId}`,
        action: 'ADMIN_USER_UPDATED',
        notes: dto.auditMemo || `status=${updated.status};points=${updated.pointBalance}`,
      },
    }).catch(() => null);

    return updated;
  }

  @Patch('users/:userId/status')
  async updateUserStatus(
    @CurrentUser() actor: any,
    @Param('userId') userId: string,
    @Body() dto: { status: string; reason?: string },
  ) {
    const actorId = actor?.id ?? actor?.sub;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('회원을 찾을 수 없습니다.');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: dto.status.toLowerCase() },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        target: `user:${userId}`,
        action: `USER_STATUS_${dto.status.toUpperCase()}`,
        notes: dto.reason || `Admin changed status to ${dto.status}`,
      },
    }).catch(() => null);

    return updated;
  }

  @Post('users/:userId/adjust-points')
  async adjustUserPoints(
    @CurrentUser() actor: any,
    @Param('userId') userId: string,
    @Body() dto: { amount: number; reason: string },
  ) {
    const actorId = actor?.id ?? actor?.sub;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('회원을 찾을 수 없습니다.');

    const currentPoints = user.pointBalance ?? 0;
    const nextPoints = Math.max(0, currentPoints + dto.amount);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { pointBalance: nextPoints },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        target: `user:${userId}:points`,
        action: dto.amount >= 0 ? 'POINTS_GRANTED' : 'POINTS_DEDUCTED',
        notes: `amount=${dto.amount};reason=${dto.reason};prev=${currentPoints};now=${nextPoints}`,
      },
    }).catch(() => null);

    return {
      userId,
      previousBalance: currentPoints,
      pointBalance: updated.pointBalance,
      delta: dto.amount,
    };
  }

  // ==========================================
  // [사람 운영자 필수 관리 기능: 신고 관리]
  // ==========================================
  @Get('reports')
  async getReports(@Query('status') status?: string) {
    try {
      const reports = await (this.prisma as any).report.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
      return reports;
    } catch {
      return [];
    }
  }

  @Get('reports/recent')
  async getRecentReports() {
    try {
      const reports = await (this.prisma as any).report.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      return reports;
    } catch {
      return [];
    }
  }

  // ==========================================
  // [사람 운영자 필수 관리 기능: 정산 & 환불]
  // ==========================================
  @Get('settlements')
  async getSettlements() {
    try {
      const list = await (this.prisma as any).settlementRequest.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
      return list;
    } catch {
      return [];
    }
  }

  @Get('refunds')
  async getRefunds() {
    try {
      const list = await (this.prisma as any).refundRequest.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
      return list;
    } catch {
      return [];
    }
  }
}
