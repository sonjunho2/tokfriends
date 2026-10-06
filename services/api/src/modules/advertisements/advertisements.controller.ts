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
import { AdvertisementsService } from './advertisements.service';
import { CreateAdvertisementDto, UpdateAdvertisementDto } from './dto';

@ApiTags('advertisements')
@Controller('advertisements')
export class AdvertisementsController {
  constructor(private readonly adsService: AdvertisementsService) {}

  @Public()
  @Get()
  async listActive(@Query('placement') placement?: string) {
    const items = await this.adsService.listActive(placement);
    return { ok: true, data: items, items };
  }

  @Public()
  @Post(':id/click')
  async recordClick(@Param('id') id: string) {
    await this.adsService.recordClick(id);
    return { ok: true };
  }

  @Public()
  @Post(':id/impression')
  async recordImpression(@Param('id') id: string) {
    await this.adsService.recordImpression(id);
    return { ok: true };
  }

  // ===== 어드민(Admin) 전용 엔드포인트 =====
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @AdminPermissions('content.manage')
  @Get('admin/list')
  async listAdmin(@Query('placement') placement?: string) {
    const items = await this.adsService.listAllForAdmin(placement);
    return { ok: true, data: items, items };
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @AdminPermissions('content.manage')
  @Get('admin/stats')
  async statsAdmin() {
    const data = await this.adsService.getStats();
    return { ok: true, data };
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @AdminPermissions('content.manage')
  @Post('admin')
  async createAdmin(@Body() dto: CreateAdvertisementDto) {
    const item = await this.adsService.create(dto);
    return { ok: true, data: item };
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @AdminPermissions('content.manage')
  @Patch('admin/:id')
  async updateAdmin(
    @Param('id') id: string,
    @Body() dto: UpdateAdvertisementDto,
  ) {
    const item = await this.adsService.update(id, dto);
    return { ok: true, data: item };
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @AdminPermissions('content.manage')
  @Delete('admin/:id')
  async deleteAdmin(@Param('id') id: string) {
    await this.adsService.delete(id);
    return { ok: true, message: '광고가 삭제되었습니다.' };
  }
}
