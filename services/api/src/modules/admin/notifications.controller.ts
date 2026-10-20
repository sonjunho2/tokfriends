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
import { Public } from '../auth/public.decorator';
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

  // ==========================================
  // Mobile Activity Notifications
  // ==========================================
  @Public()
  @Get('activity')
  async getActivityNotifications(@CurrentUser() user?: any) {
    const items = [
      {
        id: 'notif-1',
        type: 'gift',
        title: '🎁 이지수님에게서 선물이 도착했어요!',
        body: '[하트 팡팡] 선물 (+500 온)이 적립되었습니다.',
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
        data: { points: 500, giftName: '하트 팡팡', senderAccountId: 'u-seed-3' },
        isRead: false,
      },
      {
        id: 'notif-2',
        type: 'chat',
        title: '💬 박서연님이 새로운 메시지를 보냈습니다',
        body: '오늘 저녁에 혹시 시간 괜찮으신가요? 차 한잔 해요!',
        createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        data: { chatId: 'chat-mock-1', senderAccountId: 'u-seed-1', senderNickname: '박서연' },
        isRead: false,
      },
      {
        id: 'notif-3',
        type: 'follow',
        title: '✨ 김도현님이 회원님을 팔로우하기 시작했습니다',
        body: '새로운 소식과 일상을 공유하는 소중한 이웃이 생겼어요.',
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
        data: { senderAccountId: 'u-seed-2', senderNickname: '김도현' },
        isRead: true,
      },
      {
        id: 'notif-4',
        type: 'post_like',
        title: '❤️ 한유진님이 회원님의 일상 피드를 좋아합니다',
        body: '산책 스냅 게시물에 하트 공감을 남겼습니다.',
        createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
        data: { postId: 'post-def-1' },
        isRead: true,
      },
    ];
    return { ok: true, data: items, items };
  }

  @Public()
  @Post('read-all')
  async markAllAsRead() {
    return { ok: true, success: true };
  }

  @Public()
  @Post(['device-token', 'device-tokens'])
  async registerDeviceToken(@CurrentUser() user: any, @Body() body: any) {
    return { ok: true, success: true };
  }
}
