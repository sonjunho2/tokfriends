import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { StoreService } from './store.service';
import { ConfirmPurchaseDto } from './dto/confirm-purchase.dto';

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

  @Post('purchases/confirm')
  confirmPurchase(@CurrentUser() user: any, @Body() dto: ConfirmPurchaseDto) {
    const userId = user?.sub ?? user?.id;
    return this.store.confirmPointPurchase(userId, dto);
  }
}
