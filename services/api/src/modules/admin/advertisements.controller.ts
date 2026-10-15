import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard, Roles } from '../../common/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdsRewardsService, AdvertisementItem } from './ads-rewards.service';

@ApiTags('advertisements')
@Controller('advertisements')
export class AdvertisementsController {
  constructor(private readonly adsRewardsService: AdsRewardsService) {}

  @Get('admin/list')
  async getAdminAds(@Query('placement') placement?: string) {
    const list = await this.adsRewardsService.getAdvertisements(placement);
    return { ok: true, data: list, items: list };
  }

  @Get('admin/stats')
  async getAdminAdStats() {
    const stats = await this.adsRewardsService.getAdStats();
    return { ok: true, data: stats };
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Post('admin')
  async createAdminAd(
    @CurrentUser() actor: any,
    @Body() dto: Partial<AdvertisementItem>,
  ) {
    const created = await this.adsRewardsService.createAdvertisement(dto);
    return { ok: true, data: created };
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Patch('admin/:id')
  async updateAdminAd(
    @CurrentUser() actor: any,
    @Param('id') id: string,
    @Body() dto: Partial<AdvertisementItem>,
  ) {
    const updated = await this.adsRewardsService.updateAdvertisement(id, dto);
    return { ok: true, data: updated };
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Delete('admin/:id')
  async deleteAdminAd(@CurrentUser() actor: any, @Param('id') id: string) {
    await this.adsRewardsService.deleteAdvertisement(id);
    return { ok: true, id };
  }
}
