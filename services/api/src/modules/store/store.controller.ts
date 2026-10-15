import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { StoreService } from './store.service';

@ApiTags('store')
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Public()
  @Get('point-products')
  async listPointProducts() {
    const products = await this.storeService.listAll();
    return { ok: true, data: products, items: products };
  }

  @Public()
  @Post('point-products')
  async createPointProduct(@Body() body: any) {
    const created = await this.storeService.create(body);
    return created;
  }

  @Public()
  @Put('point-products/:id')
  async updatePointProduct(@Param('id') id: string, @Body() body: any) {
    const updated = await this.storeService.update(id, body);
    return updated;
  }

  @Public()
  @Delete('point-products/:id')
  async deletePointProduct(@Param('id') id: string) {
    await this.storeService.delete(id);
    return { ok: true, id };
  }

  @Public()
  @Post('point-products/reorder')
  async reorderPointProducts(@Body() body: { items: { id: string; order: number }[] }) {
    await this.storeService.reorder(body.items || []);
    return { ok: true };
  }
}
