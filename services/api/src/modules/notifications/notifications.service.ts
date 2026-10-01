import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "nestjs-prisma";
import * as admin from "firebase-admin";
import { RegisterDeviceTokenDto } from "./dto";
import { AdminSettingsService } from "../admin/admin-settings.service";

export interface SendPushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface SendChatPushOptions {
  recipientUserId: string;
  senderDisplayName: string;
  content: string;
  type?: string;
  chatId: string;
  messageId?: string;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private messaging: admin.messaging.Messaging | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly adminSettings: AdminSettingsService,
  ) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      if (admin.apps.length > 0) {
        this.messaging = admin.messaging(admin.apps[0]!);
        this.logger.log("Firebase Admin already initialized, attached messaging.");
        return;
      }

      const serviceAccountJson = this.configService.get<string>("FIREBASE_SERVICE_ACCOUNT");
      const projectId = this.configService.get<string>("FIREBASE_PROJECT_ID");
      const clientEmail = this.configService.get<string>("FIREBASE_CLIENT_EMAIL");
      const privateKey = this.configService.get<string>("FIREBASE_PRIVATE_KEY");

      let credential: admin.credential.Credential | null = null;

      if (serviceAccountJson) {
        try {
          const parsed = JSON.parse(serviceAccountJson);
          credential = admin.credential.cert(parsed);
        } catch (err: unknown) {
          this.logger.warn(`Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: ${err instanceof Error ? err.message : err}`);
        }
      } else if (projectId && clientEmail && privateKey) {
        const formattedKey = privateKey.includes("\\n")
          ? privateKey.replace(/\\n/g, "\n")
          : privateKey;
        credential = admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formattedKey,
        });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        credential = admin.credential.applicationDefault();
      }

      if (credential) {
        const app = admin.initializeApp({ credential });
        this.messaging = admin.messaging(app);
        this.logger.log("Firebase Admin messaging initialized successfully.");
      } else {
        this.logger.warn(
          "Firebase credentials not configured (FIREBASE_PROJECT_ID or FIREBASE_SERVICE_ACCOUNT). Push notifications running in fallback mode.",
        );
      }
    } catch (error: unknown) {
      this.logger.warn(
        `Firebase Admin initialization failed: ${error instanceof Error ? error.message : error}. Push notifications running in fallback mode.`,
      );
      this.messaging = null;
    }
  }

  private async getMessagingInstance(): Promise<admin.messaging.Messaging | null> {
    if (this.messaging) return this.messaging;

    // 관리자 페이지에 등록된 Firebase 서비스 계정 JSON 확인
    const dynamicKeyJson = await this.adminSettings.getDecryptedSetting('firebase_service_account_json');
    if (dynamicKeyJson) {
      try {
        const parsed = JSON.parse(dynamicKeyJson);
        const app = admin.apps.length > 0 ? admin.apps[0]! : admin.initializeApp({
          credential: admin.credential.cert(parsed),
        });
        this.messaging = admin.messaging(app);
        this.logger.log('Firebase messaging initialized with dynamic Admin Integration Setting.');
        return this.messaging;
      } catch (err: any) {
        this.logger.warn(`Failed to parse dynamic firebase_service_account_json: ${err.message}`);
      }
    }

    return null;
  }

  async registerDeviceToken(
    userId: string,
    dto: RegisterDeviceTokenDto,
  ): Promise<{ success: boolean; deviceId: string }> {
    const record = await this.prisma.device.upsert({
      where: { token: dto.token },
      update: {
        userId,
        platform: dto.platform,
        locale: dto.locale ?? null,
        updatedAt: new Date(),
      },
      create: {
        userId,
        token: dto.token,
        platform: dto.platform,
        locale: dto.locale ?? null,
      },
      select: { id: true },
    });

    return { success: true, deviceId: record.id };
  }

  async unregisterDeviceToken(
    userId: string,
    token: string,
  ): Promise<{ success: boolean; deletedCount: number }> {
    const result = await this.prisma.device.deleteMany({
      where: {
        token,
        userId,
      },
    });

    return { success: true, deletedCount: result.count };
  }

  async listUserDevices(userId: string) {
    return this.prisma.device.findMany({
      where: { userId },
      select: {
        id: true,
        platform: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async sendPushToUser(
    userId: string,
    payload: SendPushPayload,
  ): Promise<{ sent: number; failed: number; reason?: string }> {
    const devices = await this.prisma.device.findMany({
      where: { userId },
      select: { token: true },
    });

    if (devices.length === 0) {
      return { sent: 0, failed: 0, reason: "no_registered_devices" };
    }

    const messaging = await this.getMessagingInstance();

    if (!messaging) {
      this.logger.debug(
        `[Fallback Push] Recipient: ${userId}, Title: "${payload.title}", Body: "${payload.body}", Devices: ${devices.length}`,
      );
      return { sent: devices.length, failed: 0, reason: "fallback_mode" };
    }

    const tokens = devices.map((d) => d.token);
    try {
      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data ?? {},
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "chat_messages",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      });

      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          const code = resp.error.code;
          if (
            code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token"
          ) {
            invalidTokens.push(tokens[idx]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        await this.prisma.device.deleteMany({
          where: { token: { in: invalidTokens } },
        });
      }

      return { sent: response.successCount, failed: response.failureCount };
    } catch (err: unknown) {
      this.logger.error(
        `Failed to send multicast push to user ${userId}: ${err instanceof Error ? err.message : err}`,
      );
      return { sent: 0, failed: tokens.length, reason: "fcm_send_error" };
    }
  }

  async sendChatPush(opts: SendChatPushOptions): Promise<{ sent: number; failed: number; reason?: string }> {
    let bodyText = opts.content || "";
    if (opts.type === "image") {
      bodyText = "사진을 보냈습니다.";
    } else if (opts.type === "video") {
      bodyText = "동영상을 보냈습니다.";
    } else if (bodyText.length > 100) {
      bodyText = bodyText.substring(0, 97) + "...";
    }

    return this.sendPushToUser(opts.recipientUserId, {
      title: opts.senderDisplayName || "새 메시지",
      body: bodyText,
      data: {
        type: "chat_message",
        chatId: opts.chatId,
        messageId: opts.messageId ?? "",
      },
    });
  }

  async sendBroadcast(
    payload: SendPushPayload,
    opts?: { role?: string; limit?: number },
  ): Promise<{ sent: number; failed: number; total: number; reason?: string }> {
    const where: Record<string, any> = {};
    if (opts?.role) {
      where.user = { role: opts.role };
    }

    const devices = await this.prisma.device.findMany({
      where,
      select: { userId: true, token: true },
      take: opts?.limit ?? 5000,
      orderBy: { updatedAt: "desc" },
    });

    const total = devices.length;
    if (total === 0) {
      return { sent: 0, failed: 0, total: 0, reason: "no_registered_devices" };
    }

    if (!this.messaging) {
      this.logger.debug(
        `[Broadcast Fallback] Title: "${payload.title}", Devices: ${total}`,
      );
      return { sent: total, failed: 0, total, reason: "fallback_mode" };
    }

    const tokens = devices.map((d) => d.token);
    const CHUNK_SIZE = 500;
    let sent = 0;
    let failed = 0;
    const invalidTokens: string[] = [];

    for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
      const chunk = tokens.slice(i, i + CHUNK_SIZE);
      try {
        const response = await this.messaging.sendEachForMulticast({
          tokens: chunk,
          notification: { title: payload.title, body: payload.body },
          data: payload.data ?? {},
          android: { priority: "high", notification: { sound: "default", channelId: "general" } },
          apns: { payload: { aps: { sound: "default", badge: 1 } } },
        });
        sent += response.successCount;
        failed += response.failureCount;
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const code = resp.error.code;
            if (
              code === "messaging/registration-token-not-registered" ||
              code === "messaging/invalid-registration-token"
            ) {
              invalidTokens.push(chunk[idx]);
            }
          }
        });
      } catch (err: unknown) {
        this.logger.error(
          `Broadcast chunk ${i / CHUNK_SIZE} failed: ${err instanceof Error ? err.message : err}`,
        );
        failed += chunk.length;
      }
    }

    if (invalidTokens.length > 0) {
      await this.prisma.device.deleteMany({ where: { token: { in: invalidTokens } } });
    }

    return { sent, failed, total };
  }

  async getActivityNotifications(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { activityAccountBridge: { select: { id: true } } },
    });

    const accountId = user?.activityAccountBridge?.id;
    if (!accountId) return [];

    const [gifts, settlements, visits] = await Promise.all([
      this.prisma.giftTransaction.findMany({
        where: { recipientAccountId: accountId },
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: {
          gift: { select: { name: true, thumbnailUrl: true } },
          senderAccount: {
            select: {
              displayName: true,
              legacyUser: {
                select: {
                  profile: { select: { nickname: true, avatarUri: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.settlementRequest.findMany({
        where: { activityAccountId: accountId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.profileVisit.findMany({
        where: { visitedAccountId: accountId },
        orderBy: { visitedAt: 'desc' },
        take: 15,
        include: {
          visitorAccount: {
            select: {
              id: true,
              displayName: true,
              legacyUser: {
                select: {
                  id: true,
                  profile: { select: { nickname: true, avatarUri: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    const items: Array<{
      id: string;
      type: 'gift' | 'settlement' | 'visit';
      title: string;
      body: string;
      createdAt: Date;
      avatar?: string | null;
      data?: any;
    }> = [];

    for (const g of gifts) {
      const senderName =
        g.senderAccount.legacyUser?.profile?.nickname ||
        g.senderAccount.displayName ||
        '어떤 이웃';
      items.push({
        id: `gift-${g.id}`,
        type: 'gift',
        title: `🎁 ${senderName}님에게서 선물이 도착했어요!`,
        body: `[${g.gift.name}] 선물 (+${g.points.toLocaleString()}P)이 적립되었습니다.`,
        createdAt: g.createdAt,
        avatar: g.senderAccount.legacyUser?.profile?.avatarUri || null,
        data: { points: g.points, giftName: g.gift.name },
      });
    }

    for (const s of settlements) {
      const statusText =
        s.status === 'APPROVED'
          ? '승인 및 송금 완료'
          : s.status === 'REJECTED'
          ? '반려됨'
          : '심사 진행 중';
      items.push({
        id: `settle-${s.id}`,
        type: 'settlement',
        title: `💳 출금 신청 상태 안내 (${statusText})`,
        body:
          s.status === 'APPROVED'
            ? `${s.pointsAmount.toLocaleString()}P 출금 신청이 승인되어 ${s.netAmount.toLocaleString()}원이 입금되었습니다.`
            : s.status === 'REJECTED'
            ? `출금 신청이 반려되었습니다. (사유: ${s.adminMemo || '정보 불일치'})`
            : `${s.pointsAmount.toLocaleString()}P 출금 심사가 접수되어 대기 중입니다.`,
        createdAt: s.updatedAt || s.createdAt,
        data: { status: s.status, amount: s.netAmount },
      });
    }

    for (const v of visits) {
      const visitorName =
        v.visitorAccount.legacyUser?.profile?.nickname ||
        v.visitorAccount.displayName ||
        '새로운 이웃';
      items.push({
        id: `visit-${v.id}`,
        type: 'visit',
        title: `👀 ${visitorName}님이 회원님의 프로필을 확인했어요!`,
        body: '회원님의 프로필에 관심을 보이고 있어요. 먼저 반갑게 인사를 건네보세요!',
        createdAt: v.visitedAt,
        avatar: v.visitorAccount.legacyUser?.profile?.avatarUri || null,
        data: { visitorId: v.visitorAccount.legacyUser?.id },
      });
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return items;
  }
}
