import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import { NotificationsService } from "./notifications.service";
import { RegisterDeviceTokenDto } from "./dto";

type CurrentRequestUser = { id?: string; activityAccountId?: string | null };

@ApiTags("notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post("token")
  registerToken(
    @CurrentUser() user: CurrentRequestUser,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    if (!user?.id) throw new BadRequestException("Missing authenticated user");
    return this.notificationsService.registerDeviceToken(user.id, dto);
  }

  @Delete("token/:token")
  unregisterToken(
    @CurrentUser() user: CurrentRequestUser,
    @Param("token") token: string,
  ) {
    if (!user?.id) throw new BadRequestException("Missing authenticated user");
    return this.notificationsService.unregisterDeviceToken(user.id, token);
  }

  @Get("devices")
  listDevices(@CurrentUser() user: CurrentRequestUser) {
    if (!user?.id) throw new BadRequestException("Missing authenticated user");
    return this.notificationsService.listUserDevices(user.id);
  }
}
