import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { PrismaService } from 'nestjs-prisma';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('broadcast/stats')
  async getBroadcastStats() {
    const data = await this.notificationsService.getDeviceStats();
    return { ok: true, data };
  }

  @Get('broadcast/history')
  async getBroadcastHistory() {
    const [history, deviceStats] = await Promise.all([
      this.notificationsService.getBroadcastHistory(),
      this.notificationsService.getDeviceStats(),
    ]);
    return {
      ok: true,
      data: {
        ...deviceStats,
        history,
      },
      history,
    };
  }

  @Post('broadcast')
  async sendBroadcast(
    @CurrentUser() actor: any,
    @Body() dto: any,
    @Query('role') role?: string,
  ) {
    const actorId = actor?.id ?? actor?.sub;
    const result = await this.notificationsService.sendBroadcast({
      ...dto,
      role: role || dto.role,
      actorId,
    });

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          target: `broadcast:${result.item.id}`,
          action: 'PUSH_BROADCAST_SENT',
          notes: `title=${dto.title};total=${result.total};sent=${result.sent}`,
        },
      })
      .catch(() => null);

    return {
      ok: true,
      sent: result.sent,
      failed: result.failed,
      total: result.total,
      item: result.item,
    };
  }

  @Get('templates')
  async getTemplates() {
    const list = this.notificationsService.getTemplates();
    return { ok: true, data: list, templates: list };
  }

  @Post('templates')
  async createTemplate(
    @CurrentUser() actor: any,
    @Body() dto: any,
  ) {
    const actorId = actor?.id ?? actor?.sub;
    const item = this.notificationsService.createTemplate(dto);

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          target: `push-template:${item.id}`,
          action: 'PUSH_TEMPLATE_CREATED',
          notes: `label=${item.label}`,
        },
      })
      .catch(() => null);

    return { ok: true, data: item };
  }

  @Delete('templates/:id')
  async deleteTemplate(
    @CurrentUser() actor: any,
    @Param('id') id: string,
  ) {
    const actorId = actor?.id ?? actor?.sub;
    const res = this.notificationsService.deleteTemplate(id);

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          target: `push-template:${id}`,
          action: 'PUSH_TEMPLATE_DELETED',
          notes: `id=${id}`,
        },
      })
      .catch(() => null);

    return { ok: true, data: res };
  }
}
