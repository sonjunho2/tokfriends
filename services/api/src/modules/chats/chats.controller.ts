// services/api/src/modules/chats/chats.controller.ts
import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ChatsService } from "./chats.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { DirectChatDto, SendMessageDto } from "./dto";

type CurrentRequestUser = { id?: string; activityAccountId?: string | null };

@ApiTags("chats")
@Controller("chats")
export class ChatsController {
  constructor(private readonly chats: ChatsService) {}

  @Get()
  list(@CurrentUser() user: CurrentRequestUser) {
    return this.chats.list(user?.id, user?.activityAccountId);
  }

  @Post("message")
  send(@CurrentUser() user: CurrentRequestUser, @Body() dto: SendMessageDto) {
    return this.chats.send(user?.id, user?.activityAccountId, dto);
  }

  @Post("direct")
  ensureDirect(
    @CurrentUser() user: CurrentRequestUser,
    @Body() dto: DirectChatDto,
  ) {
    const currentUserId = user?.id;
    return this.chats.ensureDirectRoom(
      currentUserId,
      user?.activityAccountId,
      dto,
    );
  }
}
