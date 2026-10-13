import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { RolesGuard, Roles } from '../../common/roles.guard';
import { AdminPermissions } from '../../common/admin-permissions.guard';
import { StoreService } from './store.service';
import { ConfirmPurchaseDto, ConfirmTossPurchaseDto, ConfirmPortOnePurchaseDto } from './dto/confirm-purchase.dto';

@ApiTags('store')
@ApiBearerAuth()
@Controller('store')
export class StoreController {
  constructor(private readonly store: StoreService) {}

  @Public()
  @Get('point-products')
  async listPointProducts() {
    const items = await this.store.listPointProducts();
    return { items };
  }

  // ===== 관리자(Admin) 전용 포인트 상품 관리 CUD API =====
  @UseGuards(RolesGuard)
  @Roles('admin')
  @AdminPermissions('settings.manage')
  @Post('point-products')
  async createPointProduct(@Body() dto: any) {
    const item = await this.store.createPointProduct(dto);
    return item;
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @AdminPermissions('settings.manage')
  @Put('point-products/:id')
  async updatePointProduct(@Param('id') id: string, @Body() dto: any) {
    const item = await this.store.updatePointProduct(id, dto);
    return item;
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @AdminPermissions('settings.manage')
  @Delete('point-products/:id')
  async deletePointProduct(@Param('id') id: string) {
    return this.store.deletePointProduct(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @AdminPermissions('settings.manage')
  @Post('point-products/reorder')
  async reorderPointProducts(@Body() body: { items: { id: string; order: number }[] }) {
    const items = await this.store.reorderPointProducts(body?.items ?? []);
    return { ok: true, items };
  }

  @Public()
  @Get('action-points')
  async getActionPoints() {
    return this.store.getActionPointPolicy();
  }

  @Post('purchases/confirm')
  confirmPurchase(@CurrentUser() user: any, @Body() dto: ConfirmPurchaseDto) {
    const userId = user?.sub ?? user?.id;
    return this.store.confirmPointPurchase(userId, dto);
  }

  @Post('purchases/toss/confirm')
  confirmTossPurchase(@CurrentUser() user: any, @Body() dto: ConfirmTossPurchaseDto) {
    const userId = user?.sub ?? user?.id;
    return this.store.confirmTossPurchase(userId, dto);
  }

  @Post('purchases/portone/confirm')
  confirmPortOnePurchase(@CurrentUser() user: any, @Body() dto: ConfirmPortOnePurchaseDto) {
    const userId = user?.sub ?? user?.id;
    return this.store.confirmPortOnePurchase(userId, dto);
  }

  @Get('purchases/history')
  getPurchaseHistory(@CurrentUser() user: any) {
    const userId = user?.sub ?? user?.id;
    return this.store.listPurchaseHistory(userId);
  }

  @Get('rewards/status')
  getRewardsStatus(@CurrentUser() user: any) {
    const userId = user?.sub ?? user?.id;
    return this.store.getRewardsStatus(userId);
  }

  @Post('rewards/attendance')
  claimAttendance(@CurrentUser() user: any) {
    const userId = user?.sub ?? user?.id;
    return this.store.claimAttendanceReward(userId);
  }

  @Post('rewards/ad-watch')
  claimAdWatch(@CurrentUser() user: any) {
    const userId = user?.sub ?? user?.id;
    return this.store.claimAdReward(userId);
  }
}
