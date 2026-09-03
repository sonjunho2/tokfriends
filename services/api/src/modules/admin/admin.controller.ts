import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
import { RolesGuard, Roles } from '../../common/roles.guard';
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

const prisma = new PrismaClient();

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminSettings: AdminSettingsService) {}

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
  @Patch('users/:id/role')
  async setRole(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: SetUserRoleDto,
  ) {
    const actorId = user?.id ?? user?.sub;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: dto.role },
    });

    await prisma.auditLog.create({
      data: {
        actorId,
        target: `user:${id}`,
        action: `SET_ROLE:${dto.role}`,
      },
    });

    return updatedUser;
  }
  @Get('refunds')
  async listRefunds() {
    return prisma.refundRequest.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Post('refunds')
  async createRefund(@Body() dto: CreateRefundDto) {
    return prisma.refundRequest.create({ data: dto });
  }

  @Patch('refunds/:id/approve')
  async approve(@Param('id') id: string) {
    return prisma.refundRequest.update({ where: { id }, data: { status: 'approved', decidedAt: new Date() } });
  }

  @Patch('refunds/:id/deny')
  async deny(@Param('id') id: string) {
    return prisma.refundRequest.update({ where: { id }, data: { status: 'denied', decidedAt: new Date() } });
  }
}
