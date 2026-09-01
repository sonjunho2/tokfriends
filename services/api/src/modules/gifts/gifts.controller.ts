import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { GiftsService } from './gifts.service';

@ApiTags('gifts')
@Controller('gifts')
export class GiftsController {
  constructor(private readonly gifts: GiftsService) {}

  @Public()
  @Get()
  async list() {
    const items = await this.gifts.listActive();
    return { ok: true, data: items, items };
  }
}
