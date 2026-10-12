import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { AdminSettingsService } from '../admin/admin-settings.service';
import { StartCallDto } from './dto';

@Injectable()
export class CallsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminSettings: AdminSettingsService,
  ) {}

  /**
   * 호스트의 1:1 통화 단가를 조회합니다.
   * 호스트에게 개별 설정 단가(callRatePerMinute)가 없으면 시스템 기본 단가를 fallback으로 반환합니다.
   */
  async getCallRate(hostUserId: string): Promise<{
    hostUserId: string;
    hostName: string | null;
    ratePerMinute: number;
    isCustomRate: boolean;
  }> {
    const host = await this.prisma.user.findUnique({
      where: { id: hostUserId },
      select: {
        id: true,
        displayName: true,
        callRatePerMinute: true,
        status: true,
      },
    });

    if (!host || host.status !== 'active') {
      throw new NotFoundException('호스트 사용자를 찾을 수 없습니다.');
    }

    const isCustom =
      typeof host.callRatePerMinute === 'number' && host.callRatePerMinute > 0;

    let ratePerMinute = host.callRatePerMinute;
    if (!isCustom || !ratePerMinute) {
      const defaultSetting = await this.adminSettings.getCallRateSetting();
      ratePerMinute = defaultSetting.ratePerMinute;
    }

    return {
      hostUserId: host.id,
      hostName: host.displayName,
      ratePerMinute,
      isCustomRate: isCustom,
    };
  }

  /**
   * 1:1 통화 시작 처리
   * 호스트의 개별 단가 확인 후, 미설정 시 SystemSetting(DEFAULT_CALL_RATE_PER_MINUTE) fallback을 적용하여 포인트를 차감합니다.
   */
  async startCall(callerUserId: string, dto: StartCallDto) {
    if (!callerUserId) {
      throw new BadRequestException('로그인이 필요합니다.');
    }

    if (callerUserId === dto.hostUserId) {
      throw new BadRequestException('자기 자신과 1:1 통화를 시작할 수 없습니다.');
    }

    const caller = await this.prisma.user.findUnique({
      where: { id: callerUserId },
      select: { id: true, pointsBalance: true, status: true },
    });

    if (!caller || caller.status !== 'active') {
      throw new ForbiddenException('활성 사용자 계정이 필요합니다.');
    }

    const rateInfo = await this.getCallRate(dto.hostUserId);
    const durationMinutes = Math.max(1, dto.durationMinutes ?? 1);
    const totalPoints = rateInfo.ratePerMinute * durationMinutes;

    if (caller.pointsBalance < totalPoints) {
      throw new BadRequestException(
        `포인트가 부족합니다. (필요: ${totalPoints}P, 보유: ${caller.pointsBalance}P)`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. 포인트 차감 (지갑 및 원장 동기화 포함)
      const deduction = await this.adminSettings.deductUserPoints(
        tx,
        callerUserId,
        totalPoints,
        'private_call_start',
        `call_${callerUserId}_${dto.hostUserId}_${Date.now()}`,
        {
          hostUserId: dto.hostUserId,
          ratePerMinute: rateInfo.ratePerMinute,
          durationMinutes,
          isCustomRate: rateInfo.isCustomRate,
        },
      );

      // 2. 1:1 통화 세션 레코드 생성
      const session = await tx.callSession.create({
        data: {
          callerId: callerUserId,
          hostId: dto.hostUserId,
          status: 'active',
          ratePerMinute: rateInfo.ratePerMinute,
          durationMinutes,
          totalPoints,
        },
        include: {
          host: {
            select: { id: true, displayName: true },
          },
          caller: {
            select: { id: true, displayName: true, pointsBalance: true },
          },
        },
      });

      return {
        callSessionId: session.id,
        callerId: callerUserId,
        hostId: dto.hostUserId,
        hostName: session.host?.displayName,
        ratePerMinute: rateInfo.ratePerMinute,
        durationMinutes,
        chargedPoints: totalPoints,
        isCustomRate: rateInfo.isCustomRate,
        remainingPoints: deduction.remainingBalance,
        startedAt: session.startedAt,
        status: session.status,
      };
    });
  }

  /**
   * 1:1 통화 종료 처리
   */
  async endCall(userId: string, sessionId: string) {
    const session = await this.prisma.callSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('통화 세션을 찾을 수 없습니다.');
    }

    if (session.callerId !== userId && session.hostId !== userId) {
      throw new ForbiddenException('해당 통화의 참여자가 아닙니다.');
    }

    if (session.status === 'ended') {
      return session;
    }

    return this.prisma.callSession.update({
      where: { id: sessionId },
      data: {
        status: 'ended',
        endedAt: new Date(),
      },
    });
  }
}
