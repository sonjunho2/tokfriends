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
}
