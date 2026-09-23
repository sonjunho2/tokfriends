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
import { CreateLiveRoomDto, SendLiveMessageDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('live')
@Controller('live')
export class LiveController {
  constructor(private readonly liveService: LiveService) {}

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
  async joinRoom(@Param('id') roomId: string) {
    const data = await this.liveService.joinRoom(roomId);
    return {
      ok: true,
      data,
    };
  }

  @Post('rooms/:id/leave')
  async leaveRoom(@Param('id') roomId: string) {
    const data = await this.liveService.leaveRoom(roomId);
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
}
