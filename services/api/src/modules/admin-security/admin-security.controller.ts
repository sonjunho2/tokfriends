import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminApprovalStatus, AdminTeamRole, AdminTeamStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { AdminPermissions } from '../../common/admin-permissions.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  CreateAdminApprovalRequestDto,
  DecideAdminApprovalRequestDto,
} from './admin-security.dto';
import { AdminSecurityService } from './admin-security.service';

@ApiTags('admin/approvals')
@ApiBearerAuth()
@Controller('admin/approvals')
export class AdminSecurityController {
  constructor(
    private readonly adminSecurity: AdminSecurityService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @AdminPermissions('approvals.view')
  async list(@Query('status') status?: string) {
    let normalizedStatus: AdminApprovalStatus | undefined;

    if (status) {
      const candidate = status.trim().toUpperCase();

      if (
        !Object.values(AdminApprovalStatus).includes(
          candidate as AdminApprovalStatus,
        )
      ) {
        throw new BadRequestException('Invalid approval status');
      }

      normalizedStatus = candidate as AdminApprovalStatus;
    }

    const items = await this.adminSecurity.listApprovals(normalizedStatus);

    return {
      ok: true,
      total: items.length,
      data: items,
      items,
    };
  }

  @Post()
  @AdminPermissions('approvals.manage')
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateAdminApprovalRequestDto,
  ) {
    const actorId = user?.id ?? user?.sub;

    let expiresAt: Date | undefined;

    if (dto.expiresAt) {
      expiresAt = new Date(dto.expiresAt);

      if (Number.isNaN(expiresAt.getTime())) {
        throw new BadRequestException('Invalid expiresAt');
      }
    }

    const request = await this.adminSecurity.requestApproval({
      requestedById: actorId,
      action: dto.action.trim(),
      target: dto.target.trim(),
      reason: dto.reason,
      context: dto.context as Prisma.InputJsonValue | undefined,
      metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      idempotencyKey: dto.idempotencyKey?.trim() || undefined,
      expiresAt,
    });

    return {
      ok: true,
      data: request,
    };
  }

  @Patch(':id/decision')
  @AdminPermissions('approvals.manage')
  async decide(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: DecideAdminApprovalRequestDto,
  ) {
    const actorId = user?.id ?? user?.sub;

    const request = await this.adminSecurity.decideApproval(
      id,
      actorId,
      dto.decision,
      dto.reason,
    );

    return {
      ok: true,
      data: request,
    };
  }

  @Get('audit-logs')
  @AdminPermissions('approvals.view')
  async listAuditLogs(@Query('limit') limit?: string) {
    const take = Math.min(100, Math.max(1, parseInt(limit || '50', 10)));
    const items = await this.prisma.auditLog.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { id: true, email: true, displayName: true },
        },
      },
    });
    return { ok: true, total: items.length, items };
  }

  @Get('profiles')
  @AdminPermissions('approvals.view')
  async listAdminProfiles() {
    const items = await this.prisma.adminProfile.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { id: true, email: true, displayName: true, status: true, role: true },
        },
      },
    });
    return { ok: true, total: items.length, items };
  }

  @Patch('profiles/:userId')
  @AdminPermissions('approvals.manage')
  async updateAdminProfile(
    @CurrentUser() user: any,
    @Param('userId') targetUserId: string,
    @Body() dto: { role?: AdminTeamRole; status?: AdminTeamStatus; permissions?: string[] },
  ) {
    const actorId = user?.id ?? user?.sub;
    const data: any = {};
    if (dto.role) data.role = dto.role;
    if (dto.status) data.status = dto.status;
    if (dto.permissions) data.permissions = dto.permissions;

    const updated = await this.prisma.adminProfile.update({
      where: { userId: targetUserId },
      data,
      include: {
        user: {
          select: { id: true, email: true, displayName: true, status: true, role: true },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        target: `adminProfile:${targetUserId}`,
        action: 'ADMIN_PROFILE_UPDATED',
        reason: 'Admin role/permissions updated',
        context: {
          role: dto.role,
          status: dto.status,
          permissions: dto.permissions,
        },
      },
    });

    return { ok: true, data: updated };
  }
}