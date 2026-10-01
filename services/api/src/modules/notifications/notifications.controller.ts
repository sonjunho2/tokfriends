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
} from "@nestjs/common";
import { ApiBearerAuth, ApiQuery, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "nestjs-prisma";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { NotificationsService } from "./notifications.service";
import { RegisterDeviceTokenDto } from "./dto";
import { Roles, RolesGuard } from "../../common/roles.guard";
import { AdminPermissions } from "../../common/admin-permissions.guard";

type CurrentRequestUser = { id?: string; activityAccountId?: string | null };

@ApiTags("notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

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

  @Get("activity")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getActivityNotifications(@CurrentUser() user: any) {
    const userId = user?.sub ?? user?.id;
    if (!userId) throw new BadRequestException("Missing authenticated user");
    const data = await this.notificationsService.getActivityNotifications(userId);
    return { ok: true, data };
  }

  // Admin: broadcast push
  @Post("broadcast")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @AdminPermissions("users.manage")
  @ApiBearerAuth()
  @ApiQuery({ name: "role", required: false, description: "Filter by user role" })
  @ApiQuery({ name: "limit", required: false, description: "Max device count (default 5000)" })
  async broadcastPush(
    @Body() dto: { title: string; body: string; data?: Record<string, string> },
    @Query("role") role?: string,
    @Query("limit") limit?: string,
  ) {
    if (!dto.title?.trim() || !dto.body?.trim()) {
      throw new BadRequestException("title and body are required");
    }
    return this.notificationsService.sendBroadcast(
      { title: dto.title.trim(), body: dto.body.trim(), data: dto.data },
      { role: role || undefined, limit: limit ? parseInt(limit, 10) : undefined },
    );
  }

  // Admin: broadcast history (device stats for broadcast targeting)
  @Get("broadcast/history")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @AdminPermissions("users.manage")
  @ApiBearerAuth()
  async getBroadcastHistory() {
    const [totalDevices, platformBreakdown] = await Promise.all([
      this.prisma.device.count(),
      this.prisma.device.groupBy({
        by: ["platform"],
        _count: { platform: true },
      }),
    ]);
    return {
      ok: true,
      data: {
        totalRegisteredDevices: totalDevices,
        platformBreakdown: platformBreakdown.map((p: any) => ({
          platform: p.platform,
          count: p._count.platform,
        })),
      },
    };
  }
}
