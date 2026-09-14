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
import { AdminApprovalStatus, Prisma } from '@prisma/client';
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
  constructor(private readonly adminSecurity: AdminSecurityService) {}

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
}