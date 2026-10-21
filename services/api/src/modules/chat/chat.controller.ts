import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Public } from '../auth/public.decorator';

@ApiTags('chats')
@ApiBearerAuth()
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Public()
  @Get()
  async getChats(@CurrentUser() user?: any) {
    const userId = user?.id || user?.sub || 'guest';
    const list = await this.chatService.getChats(userId);
    return { ok: true, data: list, items: list };
  }

  @Public()
  @Post('direct')
  async ensureDirectRoom(@CurrentUser() user: any, @Body() body: any) {
    const userId = user?.id || user?.sub || body.userId || body.senderAccountId || 'guest';
    const targetUserId = body.targetUserId || body.targetAccountId;
    const room = await this.chatService.ensureDirectRoom(userId, targetUserId);
    return { ok: true, data: room, room };
  }

  @Public()
  @Post('rooms')
  async createChatRoom(@CurrentUser() user: any, @Body() body: any) {
    const userId = user?.id || user?.sub || body.userId || body.creatorId || 'guest';
    const room = await this.chatService.createChatRoom(userId, body);
    return { ok: true, data: room, room };
  }

  @Public()
  @Get(':id')
  async getChatRoom(@Param('id') id: string) {
    const room = await this.chatService.getRoomById(id);
    return { ok: true, data: room, room };
  }

  @Public()
  @Get(':id/messages')
  async getChatMessages(@Param('id') id: string, @Query('limit') limit?: string) {
    const res = await this.chatService.getMessages(id, limit ? Number(limit) : 50);
    return { ok: true, data: res.items, items: res.items, pageInfo: res.pageInfo };
  }

  @Public()
  @Post('message')
  async sendChatMessage(@CurrentUser() user: any, @Body() body: any) {
    const userId = user?.id || user?.sub || body.senderAccountId || body.senderId || body.userId || 'guest';
    const msg = await this.chatService.sendMessage(userId, body);
    return { ok: true, data: msg, message: msg };
  }

  @Public()
  @Delete(':id')
  async deleteChat(@CurrentUser() user: any, @Param('id') id: string) {
    const userId = user?.id || user?.sub || 'guest';
    const res = await this.chatService.deleteChat(userId, id);
    return { ok: true, ...res };
  }

  @Public()
  @Post('gift')
  async sendChatGift(@CurrentUser() user: any, @Body() body: any) {
    const userId = user?.id || user?.sub || body.senderAccountId || body.senderId || body.userId || 'guest';
    const points = Number(body.points || body.amount || body.pricePoints || 100);
    const giftName = body.giftName || body.name || '선물';
    const giftIcon = body.icon || body.thumbnailUrl || null;

    // 수신자(상대방/방주인) 확인 및 자가 선물 방지
    const room = this.chatService.getRoom(body.chatId);
    let receiverId = body.receiverId || body.targetUserId;
    if (!receiverId && room) {
      if (room.counterpart?.id && room.counterpart.id !== userId) {
        receiverId = room.counterpart.id;
      } else {
        receiverId = room.participantIds.find((id) => id !== userId);
      }
    }

    if (!receiverId || receiverId === userId || room?.isWaiting) {
      throw new BadRequestException(
        '대화 상대방이 없거나 본인에게는 선물을 보낼 수 없습니다. 상대방이 입장한 후 호감 표시로 선물을 보내주세요.',
      );
    }

    const updatedBalance = await this.chatService.deductPoints(userId, points);
    // 상대방(수신자)에게 선물 포인트 적립
    if (receiverId) {
      await this.chatService.addPoints(receiverId, points).catch(() => {});
    }

    const msg = await this.chatService.sendMessage(userId, {
      chatId: body.chatId,
      content: `🎁 [선물] ${giftName} (${points} ON)을 보냈습니다!`,
      type: 'gift',
      clientMessageId: body.clientMessageId,
      giftPoints: points,
      giftName,
      giftIcon,
    });
    return {
      ok: true,
      data: msg,
      message: msg,
      spendableBalance: updatedBalance !== null ? updatedBalance : Math.max(0, 10000 - points),
      transactionId: `gift-tx-${Date.now()}`,
    };
  }
}


