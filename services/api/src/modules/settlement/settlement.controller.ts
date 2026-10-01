import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { SettlementService } from './settlement.service';
import { CreateSettlementRequestDto } from './dto/create-settlement-request.dto';

@ApiTags('settlement')
@ApiBearerAuth()
@Controller('settlement')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Get('overview')
  async getOverview(@CurrentUser() user: any) {
    const userId = user?.sub ?? user?.id;
    const data = await this.settlementService.getUserOverview(userId);
    return { ok: true, data };
  }

  @Post('requests')
  async createRequest(
    @CurrentUser() user: any,
    @Body() dto: CreateSettlementRequestDto,
  ) {
    const userId = user?.sub ?? user?.id;
    const request = await this.settlementService.createRequest(userId, dto);
    return { ok: true, data: request };
  }
}
