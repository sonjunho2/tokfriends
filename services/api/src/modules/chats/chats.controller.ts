// services/api/src/modules/chats/chats.controller.ts
import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ChatsService } from "./chats.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { ChatMessagesQueryDto, DirectChatDto, SendGiftDto, SendMessageDto } from "./dto";

type CurrentRequestUser = { id?: string; activityAccountId?: string | null };

@ApiTags("chats")
@Controller("chats")
export class ChatsController {
  constructor(private readonly chats: ChatsService) {}

  @Get()
  list(@CurrentUser() user: CurrentRequestUser) {
    return this.chats.list(user?.id, user?.activityAccountId);
  }

  @Get(":chatId/messages")
  history(
    @CurrentUser() user: CurrentRequestUser,
    @Param("chatId") chatId: string,
    @Query() query: ChatMessagesQueryDto,
  ) {
    return this.chats.history(user?.id, user?.activityAccountId, chatId, query);
  }

  @Post("message")
  send(@CurrentUser() user: CurrentRequestUser, @Body() dto: SendMessageDto) {
    return this.chats.send(user?.id, user?.activityAccountId, dto);
  }

  @Post("gift")
  sendGift(@CurrentUser() user: CurrentRequestUser, @Body() dto: SendGiftDto) {
    return this.chats.sendGift(user?.id, user?.activityAccountId, dto);
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

  @Post(":chatId/read")
  markRead(
    @CurrentUser() user: CurrentRequestUser,
    @Param("chatId") chatId: string,
  ) {
    return this.chats.markAsRead(user?.id, user?.activityAccountId, chatId);
  }
}
