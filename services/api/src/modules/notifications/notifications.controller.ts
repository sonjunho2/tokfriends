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
  @ApiQuery({ name: "isMarketing", required: false, description: "마케팅/광고성 정보 여부 (정보통신망법 제50조 준수)" })
  async broadcastPush(
    @Body() dto: { title: string; body: string; data?: Record<string, string>; isMarketing?: boolean },
    @Query("role") role?: string,
    @Query("limit") limit?: string,
    @Query("isMarketing") isMarketing?: string,
  ) {
    if (!dto.title?.trim() || !dto.body?.trim()) {
      throw new BadRequestException("title and body are required");
    }

    const marketingFlag = dto.isMarketing ?? isMarketing === 'true';

    // 정보통신망법 제50조 제2항: 야간 시간(21시 ~ 익일 08시) 광고성 정보 발송 제한 확인
    if (marketingFlag) {
      const now = new Date();
      // KST (UTC+9) 기준 시간 계산
      const kstHour = (now.getUTCHours() + 9) % 24;
      if (kstHour >= 21 || kstHour < 8) {
        throw new BadRequestException(
          '대한민국 정보통신망법 제50조 제2항에 따라 야간(21시~08시)에는 광고성 정보 푸시를 발송할 수 없습니다.',
        );
      }
    }

    return this.notificationsService.sendBroadcast(
      { title: dto.title.trim(), body: dto.body.trim(), data: dto.data },
      {
        role: role || undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        isMarketing: marketingFlag,
      },
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
