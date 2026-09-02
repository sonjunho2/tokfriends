import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FriendshipsService } from './friendships.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { SendFriendRequestDto } from './dto';

@ApiTags('friendships')
@ApiBearerAuth()
@Controller('friendships')
export class FriendshipsController {
  constructor(private readonly friendships: FriendshipsService) {}

  @Post()
  async send(
    @CurrentUser() user: any,
    @Body() dto: SendFriendRequestDto,
  ) {
    const currentUserId = user?.id ?? user?.sub;

    return {
      ok: true,
      data: await this.friendships.sendRequest(
        currentUserId,
        dto.addresseeId,
      ),
    };
  }

  @Post(':id/accept')
  async accept(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const currentUserId = user?.id ?? user?.sub;

    return {
      ok: true,
      data: await this.friendships.acceptRequest(currentUserId, id),
    };
  }

  @Post(':id/decline')
  async decline(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const currentUserId = user?.id ?? user?.sub;

    return {
      ok: true,
      data: await this.friendships.declineRequest(currentUserId, id),
    };
  }

  @Post(':id/cancel')
  async cancel(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const currentUserId = user?.id ?? user?.sub;

    return {
      ok: true,
      data: await this.friendships.cancelRequest(currentUserId, id),
    };
  }

  @Get()
  async list(@CurrentUser() user: any) {
    const currentUserId = user?.id ?? user?.sub;

    return {
      ok: true,
      data: await this.friendships.listRequests(currentUserId),
    };
  }
}