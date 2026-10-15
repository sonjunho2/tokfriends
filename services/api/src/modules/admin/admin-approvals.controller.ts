import {
  BadRequestException,
  Body,
  Controller,
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
import { CurrentUser } from '../auth/current-user.decorator';
import { Prisma } from '@prisma/client';

export class CreateApprovalDto {
  action: string;
  target: string;
  reason?: string;
  metadata?: any;
  context?: any;
}

export class DecideApprovalDto {
  decision: 'APPROVED' | 'REJECTED';
  reason?: string;
}

export class UpdateProfileDto {
  role?: string;
  permissions?: string[];
  status?: string;
}

@ApiTags('admin-approvals')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('admin')
@Controller('admin/approvals')
export class AdminApprovalsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getApprovals(@Query('status') status?: any) {
    const where: Prisma.AdminApprovalRequestWhereInput = {};
    if (status) {
      where.status = status;
    }
    const items = await this.prisma.adminApprovalRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return items;
  }

  @Post()
  async createApproval(
    @CurrentUser() user: any,
    @Body() dto: CreateApprovalDto,
  ) {
    const requestedById = user?.id ?? user?.sub ?? 'system';
    if (!dto.action || !dto.target) {
      throw new BadRequestException('action과 target은 필수 항목입니다.');
    }

    const item = await this.prisma.adminApprovalRequest.create({
      data: {
        action: dto.action,
        target: dto.target,
        reason: dto.reason,
        requestedById,
        status: 'PENDING',
        metadata: dto.metadata ?? Prisma.JsonNull,
        context: dto.context ?? Prisma.JsonNull,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: requestedById,
        target: `approval:${item.id}`,
        action: 'APPROVAL_REQUESTED',
        notes: `action=${dto.action};target=${dto.target}`,
      },
    }).catch(() => null);

    return item;
  }

  @Patch(':id/decision')
  async decideApproval(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: DecideApprovalDto,
  ) {
    const decidedById = user?.id ?? user?.sub ?? 'admin';
    const existing = await this.prisma.adminApprovalRequest.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('결재 요청을 찾을 수 없습니다.');
    }

    const nextStatus = dto.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    const updated = await this.prisma.adminApprovalRequest.update({
      where: { id },
      data: {
        status: nextStatus,
        decidedById,
        decidedAt: new Date(),
        decisionReason: dto.reason,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: decidedById,
        target: `approval:${id}`,
        action: `APPROVAL_${nextStatus}`,
        notes: `reason=${dto.reason ?? ''}`,
      },
    }).catch(() => null);

    return updated;
  }

  @Get('audit-logs')
  async getAuditLogs(@Query('limit') limitRaw?: string) {
    const take = Math.min(Math.max(1, parseInt(limitRaw || '50', 10) || 50), 200);

    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            displayName: true,
            nickname: true,
          },
        },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      actorId: log.actorId,
      actorEmail: log.actor?.email ?? log.actor?.displayName ?? log.actor?.nickname ?? null,
      target: log.target,
      action: log.action,
      context: log.context as Record<string, unknown> | null,
      notes: log.notes,
      createdAt: log.createdAt.toISOString(),
    }));
  }

  @Get('profiles')
  async getProfiles() {
    const profiles = await this.prisma.adminProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            nickname: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return profiles.map((p) => ({
      userId: p.userId,
      email: p.user.email ?? null,
      displayName: p.user.displayName ?? p.user.nickname ?? null,
      role: p.role,
      status: p.status,
      twoFactorEnabled: p.twoFactorEnabled,
      permissions: p.permissions,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  @Patch('profiles/:userId')
  async updateProfile(
    @CurrentUser() user: any,
    @Param('userId') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const actorId = user?.id ?? user?.sub;
    const existing = await this.prisma.adminProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            displayName: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('관리자 프로필을 찾을 수 없습니다.');
    }

    const data: Prisma.AdminProfileUpdateInput = {};
    if (dto.role) data.role = dto.role;
    if (dto.status) data.status = dto.status;
    if (dto.permissions) data.permissions = dto.permissions;

    const updated = await this.prisma.adminProfile.update({
      where: { userId },
      data,
      include: {
        user: {
          select: {
            email: true,
            displayName: true,
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        target: `admin-profile:${userId}`,
        action: 'ADMIN_PROFILE_UPDATED',
        notes: `role=${updated.role};status=${updated.status}`,
      },
    }).catch(() => null);

    return {
      userId: updated.userId,
      email: updated.user.email ?? null,
      displayName: updated.user.displayName ?? null,
      role: updated.role,
      status: updated.status,
      twoFactorEnabled: updated.twoFactorEnabled,
      permissions: updated.permissions,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
