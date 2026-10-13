import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "nestjs-prisma";
import { ChatsService } from "./chats.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { ChatMessagesQueryDto, DirectChatDto, SendGiftDto, SendMessageDto } from "./dto";
import { RolesGuard, Roles } from "../../common/roles.guard";
import { AdminPermissions } from "../../common/admin-permissions.guard";

type CurrentRequestUser = { id?: string; activityAccountId?: string | null };

@ApiTags("chats")
@Controller("chats")
export class ChatsController {
  constructor(
    private readonly chats: ChatsService,
    private readonly prisma: PrismaService,
  ) {}

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

  @Post("rooms")
  createCustomRoom(
    @CurrentUser() user: CurrentRequestUser,
    @Body() dto: { title: string; category?: string; entryFee?: number; isGroup?: boolean },
  ) {
    return this.chats.createCustomRoom(user?.id, user?.activityAccountId, dto);
  }

  @Post(":chatId/read")
  markRead(
    @CurrentUser() user: CurrentRequestUser,
    @Param("chatId") chatId: string,
  ) {
    return this.chats.markAsRead(user?.id, user?.activityAccountId, chatId);
  }

  // =============================================
  // 관리자(Admin) 채팅 컨트롤패널
  // =============================================

  private async getChatSettingJson<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const row = await this.prisma.adminIntegrationSetting.findUnique({
        where: { id: key },
      });
      if (row?.placeholder) {
        return JSON.parse(row.placeholder) as T;
      }
    } catch {
      /* noop */
    }
    return defaultValue;
  }

  private async saveChatSettingJson<T>(key: string, label: string, data: T): Promise<void> {
    const serialized = JSON.stringify(data);
    await this.prisma.adminIntegrationSetting.upsert({
      where: { id: key },
      update: { placeholder: serialized },
      create: { id: key, label, placeholder: serialized },
    });
  }

  @Get("control-panel")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @AdminPermissions("content.manage")
  @ApiBearerAuth()
  async getControlPanel() {
    const defaultRules = [
      { id: "rule-spam", name: "스팸 감지", description: "반복 메시지 자동 감지", enabled: true, autoAction: "WARN" },
      { id: "rule-profanity", name: "욕설 필터", description: "금칙어 자동 차단", enabled: true, autoAction: "DELETE" },
      { id: "rule-media", name: "미디어 검수", description: "부적절 이미지 차단", enabled: false, autoAction: "BLOCK" },
    ];

    const [chats, reports, savedRules, memoSetting, roomOverrides] = await Promise.all([
      this.prisma.chat.findMany({
        take: 30,
        orderBy: { lastMessageAt: "desc" },
        select: {
          id: true,
          lastMessageAt: true,
          _count: { select: { messages: true } },
        },
      }).catch(() => [] as any[]),
      this.prisma.report.findMany({
        where: { status: "PENDING" },
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          reason: true,
          status: true,
          createdAt: true,
          reporter: { select: { displayName: true } },
        },
      }).catch(() => [] as any[]),
      this.getChatSettingJson("chat_policy_rules", defaultRules),
      this.getChatSettingJson<string | null>("chat_control_memo", null),
      this.getChatSettingJson<Record<string, { status?: string; allowEntry?: boolean }>>("chat_room_overrides", {}),
    ]);

    const mappedRooms = (chats as any[]).map((r) => {
      const override = roomOverrides[String(r.id)] ?? {};
      return {
        id: String(r.id),
        status: override.status ?? "ACTIVE",
        allowEntry: override.allowEntry ?? true,
        participants: 2,
        newMessages: r._count?.messages ?? 0,
        createdAt: null,
        lastMessageAt: r.lastMessageAt?.toISOString?.() ?? null,
      };
    });

    const mappedReports = (reports as any[]).map((r) => ({
      id: String(r.id),
      reason: r.reason ?? "",
      status: r.status ?? "PENDING",
      reporter: (r.reporter as any)?.displayName ?? null,
      createdAt: r.createdAt?.toISOString?.() ?? null,
    }));

    return {
      ok: true,
      data: {
        rooms: mappedRooms,
        reports: mappedReports,
        policyRules: savedRules,
        cannedResponses: [
          "확인되었습니다. 운영 정책에 따라 조치하겠습니다.",
          "신고해 주셔서 감사합니다.",
          "해당 내용을 검토 후 빠르게 처리하겠습니다.",
        ],
        memo: memoSetting,
      },
    };
  }

  @Patch("rooms/:roomId")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @AdminPermissions("content.manage")
  @ApiBearerAuth()
  async updateRoom(
    @CurrentUser() user: CurrentRequestUser,
    @Param("roomId") roomId: string,
    @Body() dto: { allowEntry?: boolean; status?: string; cannedMessage?: string },
  ) {
    const overrides = await this.getChatSettingJson<Record<string, any>>("chat_room_overrides", {});
    overrides[roomId] = {
      ...(overrides[roomId] || {}),
      status: dto.status ?? overrides[roomId]?.status ?? "ACTIVE",
      allowEntry: dto.allowEntry !== undefined ? dto.allowEntry : overrides[roomId]?.allowEntry ?? true,
      updatedAt: new Date().toISOString(),
    };
    await this.saveChatSettingJson("chat_room_overrides", "채팅방 운영 상태 오버라이드", overrides);

    // cannedMessage가 있는 경우 시스템 안내 메시지로 등록
    if (dto.cannedMessage) {
      try {
        const chat = await this.prisma.chat.findUnique({
          where: { id: roomId },
          select: { id: true, userAId: true },
        });
        if (chat) {
          await this.prisma.message.create({
            data: {
              chatId: roomId,
              senderId: user?.id ?? chat.userAId,
              type: "system",
              content: `[관리자 안내] ${dto.cannedMessage}`,
            },
          });
        }
      } catch {
        /* noop */
      }
    }

    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: user?.id ?? "admin",
          target: `chats:room:${roomId}`,
          action: "ADMIN_CHAT_ROOM_UPDATED",
          reason: JSON.stringify(dto),
        },
      });
    } catch {
      /* noop */
    }

    return { ok: true, data: { id: roomId, status: overrides[roomId].status } };
  }

  @Post("reports/:reportId/resolve")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @AdminPermissions("content.manage")
  @ApiBearerAuth()
  async resolveReport(
    @CurrentUser() user: CurrentRequestUser,
    @Param("reportId") reportId: string,
    @Body() dto: { resolution?: string; action?: string },
  ) {
    try {
      const updated = await this.prisma.report.update({
        where: { id: Number(reportId) },
        data: { status: "RESOLVED" },
        select: { id: true, status: true },
      });

      await this.prisma.auditLog.create({
        data: {
          actorId: user?.id ?? "admin",
          target: `reports:${reportId}`,
          action: "ADMIN_REPORT_RESOLVED",
          reason: dto.resolution || dto.action || "RESOLVED",
        },
      });

      return { ok: true, data: { id: String(updated.id), status: updated.status } };
    } catch {
      return { ok: true, data: { id: reportId, status: "RESOLVED" } };
    }
  }

  @Patch("policy-rules/:ruleId")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @AdminPermissions("content.manage")
  @ApiBearerAuth()
  async updatePolicyRule(
    @CurrentUser() user: CurrentRequestUser,
    @Param("ruleId") ruleId: string,
    @Body() dto: { enabled?: boolean; autoAction?: string },
  ) {
    const defaultRules = [
      { id: "rule-spam", name: "스팸 감지", description: "반복 메시지 자동 감지", enabled: true, autoAction: "WARN" },
      { id: "rule-profanity", name: "욕설 필터", description: "금칙어 자동 차단", enabled: true, autoAction: "DELETE" },
      { id: "rule-media", name: "미디어 검수", description: "부적절 이미지 차단", enabled: false, autoAction: "BLOCK" },
    ];
    const rules: Array<{ id: string; name: string; description: string; enabled: boolean; autoAction: string }> =
      await this.getChatSettingJson("chat_policy_rules", defaultRules);
    const targetIdx = rules.findIndex((r) => r.id === ruleId);
    let updatedRule: { id: string; name: string; description: string; enabled: boolean; autoAction: string };
    if (targetIdx >= 0) {
      rules[targetIdx] = {
        ...rules[targetIdx],
        enabled: dto.enabled !== undefined ? dto.enabled : rules[targetIdx].enabled,
        autoAction: dto.autoAction !== undefined ? dto.autoAction : rules[targetIdx].autoAction,
      };
      updatedRule = rules[targetIdx];
    } else {
      updatedRule = {
        id: ruleId,
        name: ruleId,
        description: "운영 정책 규칙",
        enabled: dto.enabled ?? true,
        autoAction: dto.autoAction ?? "WARN",
      };
      rules.push(updatedRule);
    }

    await this.saveChatSettingJson("chat_policy_rules", "채팅 필터링 및 운영 정책", rules);

    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: user?.id ?? "admin",
          target: `chats:policy-rule:${ruleId}`,
          action: "CHAT_POLICY_RULE_UPDATED",
          reason: JSON.stringify(dto),
        },
      });
    } catch {
      /* noop */
    }

    return {
      ok: true,
      data: updatedRule,
    };
  }

  @Post("control-panel/memo")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @AdminPermissions("content.manage")
  @ApiBearerAuth()
  async saveMemo(
    @CurrentUser() user: CurrentRequestUser,
    @Body() dto: { memo: string }
  ) {
    await this.saveChatSettingJson("chat_control_memo", "채팅 컨트롤패널 메모", dto.memo);

    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: user?.id ?? "admin",
          target: "chats:control-panel",
          action: "CHAT_CONTROL_PANEL_MEMO_UPDATED",
          reason: dto.memo,
        },
      });
    } catch {
      /* noop */
    }
    return { ok: true, memo: dto.memo };
  }
}
