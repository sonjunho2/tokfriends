import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FriendshipsService } from './friendships.service';

@ApiTags('friendships')
@ApiBearerAuth()
@Controller('friendships')
export class FriendshipsController {
  constructor(private readonly friendships: FriendshipsService) {}

  @Post()
  async send(@Body() body: { requesterId: string; addresseeId: string }) {
    const { requesterId, addresseeId } = body;
    return { ok: true, data: await this.friendships.sendRequest(requesterId, addresseeId) };
  }

  @Post(':id/accept')
  async accept(@Param('id') id: string) {
    return { ok: true, data: await this.friendships.acceptRequest(id) };
  }

  @Post(':id/decline')
  async decline(@Param('id') id: string) {
    return { ok: true, data: await this.friendships.declineRequest(id) };
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return { ok: true, data: await this.friendships.cancelRequest(id) };
  }

  @Get()
  @ApiQuery({ name: 'userId', required: true, type: String })
  async list(@Query('userId') userId: string) {
    return { ok: true, data: await this.friendships.listRequests(userId) };
  }
}
