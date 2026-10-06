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
import { Public } from '../auth/public.decorator';
import { RolesGuard, Roles } from '../../common/roles.guard';
import { AdminPermissions } from '../../common/admin-permissions.guard';
import { GiftsService } from './gifts.service';
import { CreateGiftDto, UpdateGiftDto } from './dto';

@ApiTags('gifts')
@Controller('gifts')
export class GiftsController {
  constructor(private readonly gifts: GiftsService) {}

  @Public()
  @Get()
  async list(
    @Query('category') category?: string,
    @Query('context') context?: 'chat' | 'live',
  ) {
    const items = await this.gifts.listActive({ category, context });
    return { ok: true, data: items, items };
  }

  // ===== 관리자(Admin) 전용 엔드포인트 =====
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @AdminPermissions('content.manage')
  @Get('admin/list')
  async listAdmin() {
    const items = await this.gifts.listAllForAdmin();
    return { ok: true, data: items, items };
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @AdminPermissions('content.manage')
  @Get('admin/stats')
  async statsAdmin() {
    const stats = await this.gifts.getGiftStats();
    return { ok: true, data: stats };
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @AdminPermissions('content.manage')
  @Post('admin')
  async createAdmin(@Body() dto: CreateGiftDto) {
    const item = await this.gifts.createGift(dto);
    return { ok: true, data: item };
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @AdminPermissions('content.manage')
  @Patch('admin/:id')
  async updateAdmin(@Param('id') id: string, @Body() dto: UpdateGiftDto) {
    const item = await this.gifts.updateGift(id, dto);
    return { ok: true, data: item };
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @AdminPermissions('content.manage')
  @Delete('admin/:id')
  async deleteAdmin(@Param('id') id: string) {
    await this.gifts.deleteGift(id);
    return { ok: true, message: '선물이 삭제되었습니다.' };
  }
}
