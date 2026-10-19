import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CallsService } from './calls.service';
import { PrivateCallService } from './private-call.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';

export class RequestCallDto {
  hostId: string;
}

export class EndCallDto {
  reason?: string;
}

@ApiTags('calls')
@Controller('calls')
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
