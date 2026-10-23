import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CallsService } from './calls.service';
import { PrivateCallService } from './private-call.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';

export class RequestCallDto {
  hostId: string;
}

export class EndCallDto {
  reason?: string;
}

@ApiTags('calls')
@Controller(['calls', 'api/calls'])
export class CallsController {
  constructor(
    private readonly callsService: CallsService,
    private readonly privateCallService: PrivateCallService,
  ) {}

  /**
   * 호스트의 1:1 통화 단가 조회 (호스트 개별 단가 또는 시스템 기본값, 인메모리 캐시 적용)
   */
  @Get('rate/:hostUserId')
  async getCallRate(@Param('hostUserId') hostUserId: string) {
    const data = await this.callsService.getCallRate(hostUserId);
    return {
      ok: true,
      data,
    };
  }

  /**
   * 1:1 프라이빗 통화 요청 (게스트 -> 호스트)
   */
  /**
   * 1:1 유료 통화 세션 개설 (호출자의 최소 1,500 ON 이상 잔액 검증)
   */
  @Post('start')
  @Public()
  async startCall(@Req() req: any, @Body() dto: { hostId: string; callerId?: string }) {
    const callerId = req.user?.id || req.user?.sub || dto.callerId || 'u-caller-1';
    const session = await this.privateCallService.startCall(callerId, dto.hostId);
    return {
      ok: true,
      message: '1:1 프라이빗 유료 통화 세션이 개설되었습니다. (기본 분당 1,500 ON)',
      data: session,
    };
  }

  @Post('request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async requestCall(@CurrentUser() user: any, @Body() dto: RequestCallDto) {
    const guestId = user?.id ?? user?.sub;
    const session = await this.privateCallService.requestCall(guestId, dto.hostId);
    return {
      ok: true,
      data: session,
    };
  }

  /**
   * 1:1 통화 수락 시: 첫 1분 분량 선차감 DB 트랜잭션($transaction) 처리
   */
  @Post(':sessionId/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async acceptCall(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string,
  ) {
    const hostId = user?.id ?? user?.sub;
    const session = await this.privateCallService.acceptCall(sessionId, hostId);
    return {
      ok: true,
      data: session,
    };
  }

  /**
   * 1:1 통화 종료
   */
  @Post(':sessionId/end')
  @Public()
  async endCall(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string,
    @Body() dto?: EndCallDto,
  ) {
    const userId = user?.id ?? user?.sub;
    const data = await this.privateCallService.terminateCall(sessionId, userId, dto?.reason);
    return {
      ok: true,
      data,
    };
  }

  /**
   * 1:1 통화 강제/정상 종료 (terminateCall)
   */
  @Post(':sessionId/terminate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async terminateCall(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string,
    @Body() dto?: EndCallDto,
  ) {
    const userId = user?.id ?? user?.sub;
    const data = await this.privateCallService.terminateCall(sessionId, userId, dto?.reason);
    return {
      ok: true,
      data,
    };
  }
}
