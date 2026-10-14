import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    const userId = user?.id || user?.sub;
    const data = await this.usersService.getMe(userId);
    return { ok: true, data };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(
    @CurrentUser() user: any,
    @Body() body: { nickname?: string; bio?: string; avatarUrl?: string; callRatePerMinute?: number },
  ) {
    const userId = user?.id || user?.sub;
    const data = await this.usersService.updateProfile(userId, body);
    return { ok: true, data };
  }

  @Post('me/photos')
  @UseGuards(JwtAuthGuard)
  async addPhoto(
    @CurrentUser() user: any,
    @Body() body: { imageUrl: string; order?: number },
  ) {
    const userId = user?.id || user?.sub;
    if (!body?.imageUrl) throw new BadRequestException('사진 URL이 필요합니다.');
    const photo = await this.usersService.addPhoto(userId, body.imageUrl, body.order);
    return { ok: true, data: photo };
  }

  @Delete('me/photos/:photoId')
  @UseGuards(JwtAuthGuard)
  async deletePhoto(
    @CurrentUser() user: any,
    @Param('photoId') photoId: string,
  ) {
    const userId = user?.id || user?.sub;
    await this.usersService.deletePhoto(userId, photoId);
    return { ok: true, message: '사진이 삭제되었습니다.' };
  }

  @Get(':id')
  async getUserPublicProfile(@Param('id') id: string) {
    const data = await this.usersService.byPublicId(id);
    if (!data) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return { ok: true, data };
  }

  @Get()
  async searchUsers(@Query('keyword') keyword?: string) {
    const data = await this.usersService.searchUsers({ keyword });
    return { ok: true, data };
  }
}
