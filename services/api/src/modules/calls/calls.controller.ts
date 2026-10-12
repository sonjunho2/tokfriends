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
import { StartCallDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('calls')
@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  /**
   * 호스트의 1:1 통화 단가 조회 (개별 단가 없으면 기본값 fallback)
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
   * 1:1 프라이빗 통화 시작 및 포인트 차감
   */
  @Post('start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async startCall(@CurrentUser() user: any, @Body() dto: StartCallDto) {
    const callerUserId = user?.id ?? user?.sub;
    const data = await this.callsService.startCall(callerUserId, dto);
    return {
      ok: true,
      data,
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
  ) {
    const userId = user?.id ?? user?.sub;
    const data = await this.callsService.endCall(userId, sessionId);
    return {
      ok: true,
      data,
    };
  }
}
