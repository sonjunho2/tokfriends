import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { RolesGuard, Roles } from '../../common/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { AdsRewardsService, AdvertisementItem } from './ads-rewards.service';

@ApiTags('advertisements & ads')
@Controller(['ads', 'advertisements'])
export class AdvertisementsController {
  constructor(private readonly adsRewardsService: AdsRewardsService) {}

  /**
   * 활성화된 배너 광고 조회 (HOME_BANNER, MARKET_BANNER, LIVE_BANNER 등)
   */
  @Public()
  @Get('placements/:placement')
  @ApiOperation({ summary: '구좌별 활성화된 배너 광고 목록 조회' })
  async getPlacements(@Param('placement') placement: string) {
    const list = await this.adsRewardsService.getPlacements(placement);
    return { ok: true, data: list, items: list };
  }

  /**
   * 보상형 광고 시청 완료 콜백 시 유저 지갑에 10 ON 지급 및 WalletLedger 기록 (일일 5회 제한)
   */
  @Public()
  @Post('reward/claim')
  @ApiOperation({ summary: '보상형 광고 시청 완료 콜백 및 10 ON 리워드 지급 (일일 5회 제한)' })
  async claimAdReward(
    @Req() req: any,
    @CurrentUser() user: any,
    @Body() body: { userId?: string; userNickname?: string },
  ) {
    const effectiveUserId = user?.id || user?.sub || body?.userId || req.user?.id || 'usr_guest';
    const effectiveNickname = user?.nickname || user?.displayName || body?.userNickname || '회원';

    return this.adsRewardsService.claimAdReward(effectiveUserId, effectiveNickname);
  }

  /**
   * 광고 노출 수 증가
   */
  @Public()
  @Post(':id/impression')
  @ApiOperation({ summary: '광고 노출(Impression) 카운트 기록' })
  async recordImpression(@Param('id') id: string) {
    return this.adsRewardsService.recordImpression(id);
  }

  /**
   * 광고 클릭 수 증가
   */
  @Public()
  @Post(':id/click')
  @ApiOperation({ summary: '광고 클릭(Click) 카운트 기록' })
  async recordClick(@Param('id') id: string) {
    return this.adsRewardsService.recordClick(id);
  }

  // ==========================================
  // 관리자 전용 배너 광고 관리 API
  // ==========================================

  @Get('admin/list')
  @Public()
  async getAdminAds(@Query('placement') placement?: string) {
    const list = await this.adsRewardsService.getAdvertisements(placement);
    return { ok: true, data: list, items: list };
  }

  @Get('admin/stats')
  @Public()
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
