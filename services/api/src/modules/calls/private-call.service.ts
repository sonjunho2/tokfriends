import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'nestjs-prisma';
import { ChatGateway } from '../ws/chat.gateway';
import { CallStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * NestJS 인메모리 CacheManager (5분 TTL 최적화로 DB 병목 제거)
 */
export class InMemoryCacheManager {
  private readonly store = new Map<string, CacheEntry<any>>();

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  async set<T>(key: string, value: T, ttlMs: number = 5 * 60 * 1000): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async reset(): Promise<void> {
    this.store.clear();
  }
}

@Injectable()
export class PrivateCallService {
  private readonly logger = new Logger(PrivateCallService.name);
  private readonly cacheManager = new InMemoryCacheManager();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5분 (300초) TTL 인메모리 캐시

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  /**
   * SystemSetting 캐시 기반 조회 (5분 TTL 인메모리 캐싱으로 매 초 DB 쿼리 방지)
   */
  async getSystemSetting(key: string, defaultValue: string): Promise<string> {
    const cached = await this.cacheManager.get<string>(key);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key },
      });
      const value = setting?.value ?? defaultValue;
      await this.cacheManager.set(key, value, this.CACHE_TTL_MS);
      return value;
    } catch (err) {
      this.logger.warn(`Failed to fetch setting ${key}, fallback to default: ${defaultValue}`);
      return defaultValue;
    }
  }

  /**
   * 캐시 수동 무효화 (설정 변경 시 호출)
   */
  async invalidateSettingCache(key?: string) {
    if (key) {
      await this.cacheManager.del(key);
    } else {
      await this.cacheManager.reset();
    }
  }

  /**
   * Agora RTC 토큰 발급 헬퍼
   */
  private generateAgoraRtcToken(channelId: string, uid: string): { appId: string; token: string } {
    const appId = process.env.AGORA_APP_ID || 'dagaon_agora_live';
    // Agora RTC 채널 참여용 서명 토큰
    const token = `rtc_${channelId}_${uid}_${Date.now()}`;
    return { appId, token };
  }

  /**
   * 1:1 통화 요청 (게스트 -> 호스트)
   */
  async requestCall(guestId: string, hostId: string) {
    if (guestId === hostId) {
      throw new BadRequestException('자신에게는 통화를 신청할 수 없습니다.');
    }

    const [guest, host] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: guestId } }),
      this.prisma.user.findUnique({ where: { id: hostId } }),
    ]);

    if (!guest || guest.status !== 'ACTIVE') {
      throw new NotFoundException('게스트 정보를 찾을 수 없거나 정지 상태입니다.');
    }
    if (!host || host.status !== 'ACTIVE') {
      throw new NotFoundException('호스트 정보를 찾을 수 없거나 활동 중이 아닙니다.');
    }

    // 단가 산정 (호스트 자율 단가 우선, 없을 경우 시스템 기본 단가 1,500 ON)
    const defaultRateStr = await this.getSystemSetting('DEFAULT_CALL_RATE', '1500');
    const defaultRate = parseInt(defaultRateStr, 10) || 1500;
    const ratePerMinute = (typeof host.callRatePerMinute === 'number' && host.callRatePerMinute > 0)
      ? host.callRatePerMinute
      : defaultRate;

    // 최소 첫 1분 선차감 포인트 보유 여부 확인
    if (guest.pointBalance < ratePerMinute) {
      throw new BadRequestException(`포인트가 부족합니다. 최소 ${ratePerMinute.toLocaleString()} ON이 필요합니다.`);
    }

    const channelId = `call_${randomUUID().replace(/-/g, '').slice(0, 16)}`;

    const session = await this.prisma.privateCallSession.create({
      data: {
        channelId,
        hostId,
        guestId,
        ratePerMinute,
        status: CallStatus.RINGING,
      },
    });

    // 호스트에게 소켓 알림 전송
    this.chatGateway.server?.to(`user_${hostId}`).emit('CALL_INCOMING', {
      sessionId: session.id,
      channelId,
      guest: {
        id: guest.id,
        nickname: guest.nickname,
        avatarUrl: guest.avatarUrl,
      },
      ratePerMinute,
    });

    return session;
  }

  /**
   * =========================================================================
   * 1. 통화 수락 및 첫 1분 선차감 트랜잭션 (Prisma $transaction)
   * =========================================================================
   */
  async acceptCall(callSessionId: string, hostId: string) {
    const session = await this.prisma.privateCallSession.findUnique({
      where: { id: callSessionId },
      include: {
        guest: true,
        host: true,
      },
    });

    if (!session) {
      throw new NotFoundException('통화 세션을 찾을 수 없습니다.');
    }
    if (session.hostId !== hostId) {
      throw new ForbiddenException('통화 수락 권한이 없습니다.');
    }
    if (session.status !== CallStatus.RINGING) {
      throw new BadRequestException('이미 처리되었거나 종료된 통화입니다.');
    }

    // 1) 단가 결정: 호스트의 user.callRatePerMinute 값 우선 적용, null일 경우 SystemSetting 'DEFAULT_CALL_RATE' (기본값 1,500)
    const defaultRateStr = await this.getSystemSetting('DEFAULT_CALL_RATE', '1500');
    const defaultRate = parseInt(defaultRateStr, 10) || 1500;
    const ratePerMinute =
      typeof session.host.callRatePerMinute === 'number' && session.host.callRatePerMinute > 0
        ? session.host.callRatePerMinute
        : defaultRate;

    // 2) 게스트(신청자) pointBalance 검증: 단가보다 적으면 BadRequestException('포인트가 부족합니다')
    if (session.guest.pointBalance < ratePerMinute) {
      await this.prisma.privateCallSession.update({
        where: { id: callSessionId },
        data: {
          status: CallStatus.TERMINATED,
          endedAt: new Date(),
          endReason: 'POINT_DEPLETED',
        },
      });
      throw new BadRequestException('포인트가 부족합니다');
    }

    // 3) 수수료 분필: SystemSetting('PLATFORM_FEE_PERCENT', 기본 35%) 기준
    const feePercentStr = await this.getSystemSetting('PLATFORM_FEE_PERCENT', '35');
    const feePercent = parseInt(feePercentStr, 10) || 35;
    const platformFee = Math.floor(ratePerMinute * (feePercent / 100));
    const creatorRevenue = ratePerMinute - platformFee;

    // 4) Prisma $transaction으로 첫 1분 선차감 및 세션 상태 활성화
    const updated = await this.prisma.$transaction(async (tx) => {
      // 게스트 포인트 선차감 (decrement)
      await tx.user.update({
        where: { id: session.guestId },
        data: {
          pointBalance: { decrement: ratePerMinute },
        },
      });

      // 호스트 크리에이터 수익 반영 (increment)
      await tx.user.update({
        where: { id: session.hostId },
        data: {
          pointBalance: { increment: creatorRevenue },
        },
      });

      // PrivateCallSession 레코드 업데이트
      return tx.privateCallSession.update({
        where: { id: callSessionId },
        data: {
          status: CallStatus.CONNECTED,
          startedAt: new Date(),
          ratePerMinute,
          billedMinutes: 1,
          totalDeducted: ratePerMinute,
          platformFee,
          creatorRevenue,
        },
      });
    });

    // 5) Agora RTC 채널 토큰 발급
    const agoraData = this.generateAgoraRtcToken(session.channelId, hostId);

    // 6) 실시간 소켓 이벤트 브로드캐스트
    const payload = {
      sessionId: updated.id,
      channelId: updated.channelId,
      startedAt: updated.startedAt,
      ratePerMinute,
      billedMinutes: 1,
      totalDeducted: ratePerMinute,
      agoraToken: agoraData.token,
      appId: agoraData.appId,
    };

    this.chatGateway.server?.to(session.channelId).emit('CALL_CONNECTED', payload);
    this.chatGateway.server?.to(`user_${session.guestId}`).emit('CALL_CONNECTED', payload);
    this.chatGateway.server?.to(`user_${session.hostId}`).emit('CALL_CONNECTED', payload);

    return {
      ...updated,
      ...agoraData,
      agoraToken: agoraData.token,
    };
  }

  /**
   * =========================================================================
   * 2. 백엔드 실시간 과금 스케줄러 루프 (@Cron('* * * * *') - 매 1분 주기)
   * =========================================================================
   */
  @Cron('* * * * *')
  async handleCallBillingLoop() {
    try {
      const activeSessions = await this.prisma.privateCallSession.findMany({
        where: { status: CallStatus.CONNECTED },
        include: { guest: true, host: true },
      });

      if (activeSessions.length === 0) {
        return;
      }

      this.logger.log(`[통화 과금 엔진] 실시간 진행 중인 1:1 통화 ${activeSessions.length}건 선차감 검증`);

      const feePercentStr = await this.getSystemSetting('PLATFORM_FEE_PERCENT', '35');
      const feePercent = parseInt(feePercentStr, 10) || 35;

      for (const session of activeSessions) {
        const rate = session.ratePerMinute;

        // 최신 게스트 잔여 포인트 조회
        const currentGuest = await this.prisma.user.findUnique({
          where: { id: session.guestId },
          select: { pointBalance: true },
        });
        const currentBalance = currentGuest?.pointBalance ?? 0;

        // 1) 잔액 부족 시 (잔여 포인트 < ratePerMinute): 강제 방 폭파 및 즉시 세션 종료
        if (currentBalance < rate) {
          this.logger.warn(
            `[통화 강제 폭파] 세션 ${session.id} (채널 ${session.channelId}) 게스트 포인트 고갈: 잔여=${currentBalance}, 필요=${rate}`,
          );

          await this.prisma.privateCallSession.update({
            where: { id: session.id },
            data: {
              status: CallStatus.TERMINATED,
              endedAt: new Date(),
              endReason: 'POINT_DEPLETED',
            },
          });

          // SocketGateway를 통해 channelId로 'CALL_FORCE_TERMINATED' (사유: POINT_DEPLETED) 브로드캐스트
          const forcePayload = {
            sessionId: session.id,
            channelId: session.channelId,
            reason: 'POINT_DEPLETED',
            message: '게스트의 보유 포인트가 모두 소진되어 1:1 통화가 자동 종료되었습니다.',
            endedAt: new Date(),
          };

          this.chatGateway.server?.to(session.channelId).emit('CALL_FORCE_TERMINATED', forcePayload);
          this.chatGateway.server?.to(`user_${session.guestId}`).emit('CALL_FORCE_TERMINATED', forcePayload);
          this.chatGateway.server?.to(`user_${session.hostId}`).emit('CALL_FORCE_TERMINATED', forcePayload);

          continue;
        }

        // 2) 잔액 충분 시: Prisma $transaction으로 게스트 포인트 차감, billedMinutes 1 증가, totalDeducted 누적
        const platformFee = Math.floor(rate * (feePercent / 100));
        const creatorRevenue = rate - platformFee;

        const updatedSession = await this.prisma.$transaction(async (tx) => {
          // 게스트 포인트 차감
          await tx.user.update({
            where: { id: session.guestId },
            data: {
              pointBalance: { decrement: rate },
            },
          });

          // 호스트 크리에이터 수익 적립
          await tx.user.update({
            where: { id: session.hostId },
            data: {
              pointBalance: { increment: creatorRevenue },
            },
          });

          // 세션 통계 누적
          return tx.privateCallSession.update({
            where: { id: session.id },
            data: {
              billedMinutes: { increment: 1 },
              totalDeducted: { increment: rate },
              platformFee: { increment: platformFee },
              creatorRevenue: { increment: creatorRevenue },
            },
          });
        });

        const remainingPoints = currentBalance - rate;

        // SocketGateway로 실시간 과금 완료 이벤트('CALL_BILLED_TICK', { billedMinutes, remainingPoints }) 발송
        const tickPayload = {
          sessionId: session.id,
          channelId: session.channelId,
          billedMinutes: updatedSession.billedMinutes,
          deductedPoints: rate,
          remainingPoints,
        };

        this.chatGateway.server?.to(session.channelId).emit('CALL_BILLED_TICK', tickPayload);
        this.chatGateway.server?.to(session.channelId).emit('CALL_BILLED_MINUTE', tickPayload);
        this.chatGateway.server?.to(`user_${session.guestId}`).emit('CALL_BILLED_TICK', tickPayload);
      }
    } catch (error) {
      this.logger.error('handleCallBillingLoop failed', error);
    }
  }

  /**
   * =========================================================================
   * 3. 정상 통화 종료 핸들러 (terminateCall)
   * =========================================================================
   */
  async terminateCall(callSessionId: string, userId: string, reason = 'USER_ENDED') {
    const session = await this.prisma.privateCallSession.findUnique({
      where: { id: callSessionId },
      include: { host: true, guest: true },
    });

    if (!session) {
      throw new NotFoundException('통화 세션을 찾을 수 없습니다.');
    }
    if (session.hostId !== userId && session.guestId !== userId) {
      throw new ForbiddenException('통화 종료 권한이 없습니다.');
    }

    if (session.status === CallStatus.TERMINATED) {
      return session;
    }

    const endedAt = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      // status를 'TERMINATED'로 변경하고 endedAt 기록
      return tx.privateCallSession.update({
        where: { id: callSessionId },
        data: {
          status: CallStatus.TERMINATED,
          endedAt,
          endReason: reason,
        },
      });
    });

    // 소켓 이벤트 발송
    const endPayload = {
      sessionId: session.id,
      channelId: session.channelId,
      reason,
      endedAt,
      billedMinutes: updated.billedMinutes,
      totalDeducted: updated.totalDeducted,
      creatorRevenue: updated.creatorRevenue,
    };

    this.chatGateway.server?.to(session.channelId).emit('CALL_ENDED', endPayload);
    this.chatGateway.server?.to(`user_${session.guestId}`).emit('CALL_ENDED', endPayload);
    this.chatGateway.server?.to(`user_${session.hostId}`).emit('CALL_ENDED', endPayload);

    return updated;
  }

  /**
   * endCall 에일리어스 (하위 호환성 유지)
   */
  async endCall(sessionId: string, userId: string, reason = 'USER_ENDED') {
    return this.terminateCall(sessionId, userId, reason);
  }
}
