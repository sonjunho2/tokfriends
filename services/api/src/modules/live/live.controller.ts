// services/api/src/modules/live/live.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LiveService } from './live.service';
import { CreateLiveRoomDto, SendLiveGiftDto, SendLiveMessageDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('live')
@Controller('live')
export class LiveController {
  constructor(private readonly liveService: LiveService) {}

  @Post('rooms/:id/gift')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async sendGift(
    @CurrentUser() user: any,
    @Param('id') roomId: string,
    @Body() dto: SendLiveGiftDto,
  ) {
    const currentUserId = user?.id ?? user?.sub;
    const data = await this.liveService.sendGiftToRoom(currentUserId, roomId, dto);
    return {
      ok: true,
      data,
    };
  }

  @Get('rooms')
  async listActiveRooms() {
    const data = await this.liveService.listActiveRooms();
    return {
      ok: true,
      data,
    };
  }

  @Get('rooms/:id')
  async getRoom(@Param('id') roomId: string) {
    const data = await this.liveService.getRoom(roomId);
    return {
      ok: true,
      data,
    };
  }

  @Post('rooms')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createRoom(
    @CurrentUser() user: any,
    @Body() dto: CreateLiveRoomDto,
  ) {
    const currentUserId = user?.id ?? user?.sub;
    const data = await this.liveService.createRoom(currentUserId, dto);
    return {
      ok: true,
      data,
    };
  }

  @Post('rooms/:id/end')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async endRoom(
    @CurrentUser() user: any,
    @Param('id') roomId: string,
  ) {
    const currentUserId = user?.id ?? user?.sub;
    const data = await this.liveService.endRoom(currentUserId, roomId);
    return {
      ok: true,
      data,
    };
  }

  @Post('rooms/:id/join')
  async joinRoom(
    @Param('id') roomId: string,
    @Query('viewerKey') viewerKey?: string,
  ) {
    const data = await this.liveService.joinRoom(roomId, viewerKey);
    return {
      ok: true,
      data,
    };
  }

  @Post('rooms/:id/leave')
  async leaveRoom(
    @Param('id') roomId: string,
    @Query('viewerKey') viewerKey?: string,
  ) {
    const data = await this.liveService.leaveRoom(roomId, viewerKey);
    return {
      ok: true,
      data,
    };
  }

  @Get('rooms/:id/agora-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getAgoraToken(
    @CurrentUser() user: any,
    @Param('id') roomId: string,
    @Query('role') role?: string,
  ) {
    const currentUserId = user?.id ?? user?.sub;
    const data = await this.liveService.getAgoraToken(
      roomId,
      currentUserId,
      role,
    );
    return {
      ok: true,
      data,
    };
  }

  @Get('rooms/:id/messages')
  async listMessages(
    @Param('id') roomId: string,
    @Query('limit') limit?: string,
  ) {
    const takeNum = limit ? parseInt(limit, 10) : 40;
    const data = await this.liveService.listMessages(roomId, takeNum);
    return {
      ok: true,
      data,
    };
  }

  @Post('rooms/:id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async sendMessage(
    @CurrentUser() user: any,
    @Param('id') roomId: string,
    @Body() dto: SendLiveMessageDto,
  ) {
    const currentUserId = user?.id ?? user?.sub;
    const data = await this.liveService.sendMessage(currentUserId, roomId, dto);
    return {
      ok: true,
      data,
    };
  }

  @Get('admin/summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getAdminSummary() {
    const data = await this.liveService.getAdminSummary();
    return {
      ok: true,
      data,
    };
  }

  @Get('admin/rooms')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async listAdminRooms(
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (p - 1) * take;
    const data = await this.liveService.listAdminRooms({ status, skip, take });
    return {
      ok: true,
      page: p,
      limit: take,
      total: data.total,
      totalPages: Math.ceil(data.total / take) || 1,
      items: data.items,
    };
  }

  @Post('admin/rooms/:id/force-end')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async forceEndRoom(
    @CurrentUser() user: any,
    @Param('id') roomId: string,
    @Body('reason') reason?: string,
  ) {
    const adminId = user?.id ?? user?.sub;
    const data = await this.liveService.forceEndRoom(adminId, roomId, reason);
    return {
      ok: true,
      data,
    };
  }
}
