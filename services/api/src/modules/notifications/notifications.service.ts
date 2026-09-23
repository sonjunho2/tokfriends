import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "nestjs-prisma";
import * as admin from "firebase-admin";
import { RegisterDeviceTokenDto } from "./dto";

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

    if (!this.messaging) {
      this.logger.debug(
        `[Fallback Push] Recipient: ${userId}, Title: "${payload.title}", Body: "${payload.body}", Devices: ${devices.length}`,
      );
      return { sent: devices.length, failed: 0, reason: "fallback_mode" };
    }

    const tokens = devices.map((d) => d.token);
    try {
      const response = await this.messaging.sendEachForMulticast({
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
}
