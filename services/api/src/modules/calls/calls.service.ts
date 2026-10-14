import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { PrivateCallService } from './private-call.service';
import { UserStatus } from '@prisma/client';

@Injectable()
export class CallsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privateCallService: PrivateCallService,
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
        nickname: true,
        callRatePerMinute: true,
        status: true,
      },
    });

    if (!host || host.status !== UserStatus.ACTIVE) {
      throw new NotFoundException('호스트 사용자를 찾을 수 없거나 활동 중이 아닙니다.');
    }

    const isCustom =
      typeof host.callRatePerMinute === 'number' && host.callRatePerMinute > 0;

    let ratePerMinute = host.callRatePerMinute;
    if (!isCustom || !ratePerMinute) {
      const defaultRateStr = await this.privateCallService.getSystemSetting('DEFAULT_CALL_RATE', '1200');
      ratePerMinute = parseInt(defaultRateStr, 10) || 1200;
    }

    return {
      hostUserId: host.id,
      hostName: host.nickname,
      ratePerMinute,
      isCustomRate: isCustom,
    };
  }
}
