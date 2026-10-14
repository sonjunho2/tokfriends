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

interface CachedSetting {
  value: string;
  expiresAt: number;
}

@Injectable()
export class PrivateCallService {
  private readonly logger = new Logger(PrivateCallService.name);
  private readonly settingCache = new Map<string, CachedSetting>();
  private readonly CACHE_TTL_MS = 60 * 1000; // 60초 인메모리 캐시

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  /**
   * SystemSetting 캐시 기반 조회 (인메모리 최적화로 DB 병목 제거)
   */
  async getSystemSetting(key: string, defaultValue: string): Promise<string> {
    const now = Date.now();
    const cached = this.settingCache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key },
      });
      const value = setting?.value ?? defaultValue;
      this.settingCache.set(key, {
        value,
        expiresAt: now + this.CACHE_TTL_MS,
      });
      return value;
    } catch (err) {
      this.logger.warn(`Failed to fetch setting ${key}, fallback to default: ${defaultValue}`);
      return defaultValue;
    }
  }

  /**
   * 캐시 수동 무효화 (설정 변경 시 호출)
   */
  invalidateSettingCache(key?: string) {
    if (key) {
      this.settingCache.delete(key);
    } else {
      this.settingCache.clear();
    }
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

    // 단가 산정 (호스트 자율 단가 우선, 없을 경우 시스템 기본 단가)
    const defaultRateStr = await this.getSystemSetting('DEFAULT_CALL_RATE', '1200');
    const defaultRate = parseInt(defaultRateStr, 10) || 1200;
    const ratePerMinute = host.callRatePerMinute ?? defaultRate;

    // 최소 첫 1분 선차감 포인트 보유 여부 확인
    if (guest.pointBalance < ratePerMinute) {
      throw new BadRequestException(`포인트가 부족합니다. 최소 ${ratePerMinute} ON이 필요합니다.`);
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
   * 1:1 통화 수락 시: 첫 1분 분량 선차감 DB 트랜잭션($transaction) 처리
   */
  async acceptCall(sessionId: string, hostUserId: string) {
    const session = await this.prisma.privateCallSession.findUnique({
      where: { id: sessionId },
      include: {
        guest: true,
        host: true,
      },
    });

    if (!session) {
      throw new NotFoundException('통화 세션을 찾을 수 없습니다.');
    }
    if (session.hostId !== hostUserId) {
      throw new ForbiddenException('통화 수락 권한이 없습니다.');
    }
    if (session.status !== CallStatus.RINGING) {
      throw new BadRequestException('이미 처리되었거나 종료된 통화입니다.');
    }

    const ratePerMinute = session.ratePerMinute;
    if (session.guest.pointBalance < ratePerMinute) {
      // 잔액 부족으로 취소 처리
      await this.prisma.privateCallSession.update({
        where: { id: sessionId },
        data: {
          status: CallStatus.TERMINATED,
          endedAt: new Date(),
          endReason: 'INSUFFICIENT_GUEST_BALANCE_ON_ACCEPT',
        },
      });
      throw new BadRequestException('게스트의 포인트가 부족하여 통화를 시작할 수 없습니다.');
    }

    // 플랫폼 수수료율 (기본 30%)
    const feePercentStr = await this.getSystemSetting('PLATFORM_FEE_PERCENT', '30');
    const feePercent = parseInt(feePercentStr, 10) || 30;
    const platformFee = Math.floor(ratePerMinute * (feePercent / 100));
    const creatorRevenue = ratePerMinute - platformFee;

    // 첫 1분 선차감 및 세션 상태 활성화 DB 트랜잭션
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. 게스트 포인트 선차감
      await tx.user.update({
        where: { id: session.guestId },
        data: {
          pointBalance: { decrement: ratePerMinute },
        },
      });

      // 2. 호스트 수익 적립
      await tx.user.update({
        where: { id: session.hostId },
        data: {
          pointBalance: { increment: creatorRevenue },
        },
      });

      // 3. 통화 세션 CONNECTED 변경 및 1분 과금 기록
      return tx.privateCallSession.update({
        where: { id: sessionId },
        data: {
          status: CallStatus.CONNECTED,
          startedAt: new Date(),
          billedMinutes: 1,
          totalDeducted: ratePerMinute,
          platformFee,
          creatorRevenue,
        },
      });
    });

    // 게스트와 호스트 모두에게 연결 성공 소켓 이벤트 발송
    this.chatGateway.server?.to(session.channelId).emit('CALL_CONNECTED', {
      sessionId: updated.id,
      channelId: updated.channelId,
      startedAt: updated.startedAt,
      billedMinutes: 1,
      ratePerMinute,
    });

    return updated;
  }

  /**
   * 통화 정상/수동 종료
   */
  async endCall(sessionId: string, userId: string, reason = 'USER_ENDED') {
    const session = await this.prisma.privateCallSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('통화 세션을 찾을 수 없습니다.');
    }
    if (session.hostId !== userId && session.guestId !== userId) {
      throw new ForbiddenException('종료 권한이 없습니다.');
    }

    if (session.status === CallStatus.TERMINATED) {
      return session;
    }

    const updated = await this.prisma.privateCallSession.update({
      where: { id: sessionId },
      data: {
        status: CallStatus.TERMINATED,
        endedAt: new Date(),
        endReason: reason,
      },
    });

    this.chatGateway.server?.to(session.channelId).emit('CALL_ENDED', {
      sessionId,
      channelId: session.channelId,
      endReason: reason,
      billedMinutes: updated.billedMinutes,
      totalDeducted: updated.totalDeducted,
    });

    return updated;
  }

  /**
   * 백엔드 분당 스케줄러: CONNECTED 상태인 모든 통화의 다음 1분 포인트 차감 검증
   * 잔액 부족 시 SocketGateway로 'CALL_FORCE_TERMINATED' 발송 및 강제 세션 종료
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleEveryMinuteCallBilling() {
    try {
      const activeSessions = await this.prisma.privateCallSession.findMany({
        where: { status: CallStatus.CONNECTED },
        include: { guest: true },
      });

      if (activeSessions.length === 0) {
        return;
      }

      this.logger.log(`[분당 과금 엔진] 진행 중인 1:1 통화 ${activeSessions.length}건 선차감 검증 시작`);

      const feePercentStr = await this.getSystemSetting('PLATFORM_FEE_PERCENT', '30');
      const feePercent = parseInt(feePercentStr, 10) || 30;

      for (const session of activeSessions) {
        const rate = session.ratePerMinute;

        // 잔액 부족 판별
        if (session.guest.pointBalance < rate) {
          this.logger.warn(
            `[통화 강제 종료] 세션 ${session.id} (채널 ${session.channelId}) 게스트 잔액 부족: 보유=${session.guest.pointBalance}, 필요=${rate}`,
          );

          await this.prisma.privateCallSession.update({
            where: { id: session.id },
            data: {
              status: CallStatus.TERMINATED,
              endedAt: new Date(),
              endReason: 'INSUFFICIENT_BALANCE',
            },
          });

          // 소켓 강제 종료 이벤트 브로드캐스트 (클라이언트 아고라 채널 폐쇄 유도)
          this.chatGateway.server?.to(session.channelId).emit('CALL_FORCE_TERMINATED', {
            sessionId: session.id,
            channelId: session.channelId,
            reason: 'INSUFFICIENT_BALANCE',
            message: '게스트의 보유 온(ON) 포인트가 부족하여 1:1 통화가 자동 종료되었습니다.',
          });

          continue;
        }

        // 잔액 충분: 다음 1분 선차감 트랜잭션 실행
        const platformFee = Math.floor(rate * (feePercent / 100));
        const creatorRevenue = rate - platformFee;

        await this.prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: session.guestId },
            data: {
              pointBalance: { decrement: rate },
            },
          });

          await tx.user.update({
            where: { id: session.hostId },
            data: {
              pointBalance: { increment: creatorRevenue },
            },
          });

          await tx.privateCallSession.update({
            where: { id: session.id },
            data: {
              billedMinutes: { increment: 1 },
              totalDeducted: { increment: rate },
              platformFee: { increment: platformFee },
              creatorRevenue: { increment: creatorRevenue },
            },
          });
        });

        // 갱신 이벤트 전송
        this.chatGateway.server?.to(session.channelId).emit('CALL_BILLED_MINUTE', {
          sessionId: session.id,
          billedMinutes: session.billedMinutes + 1,
          deductedPoints: rate,
        });
      }
    } catch (error) {
      this.logger.error('handleEveryMinuteCallBilling failed', error);
    }
  }
}
