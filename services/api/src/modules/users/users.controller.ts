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
import { Public } from '../auth/public.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ==========================================
  // Public Discover & Recommendations
  // ==========================================
  @Public()
  @Get(['discover', 'users/discover'])
  async getDiscover(@CurrentUser() user?: any) {
    const userId = user?.id || user?.sub;
    const data = await this.usersService.getDiscoverRecommendations(userId);
    return { ok: true, data, items: data };
  }

  // ==========================================
  // Check Nickname Availability
  // ==========================================
  @Public()
  @Get('users/check-nickname')
  async checkNickname(@Query('nickname') nickname: string) {
    return this.usersService.checkNickname(nickname);
  }

  // ==========================================
  // Search Users
  // ==========================================
  @Public()
  @Get('users/search')
  async searchUsersEndpoint(@Query('q') q?: string, @Query('keyword') keyword?: string) {
    const data = await this.usersService.searchUsers({ keyword: q || keyword });
    return { ok: true, data, items: data };
  }

  // ==========================================
  // Authenticated Current User Profile
  // ==========================================
  @Get('users/me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    const userId = user?.id || user?.sub;
    const data = await this.usersService.getMe(userId);
    return { ok: true, data };
  }

  @Patch(['users/me', 'users/:id'])
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(
    @CurrentUser() user: any,
    @Param('id') idParam: string,
    @Body() body: { nickname?: string; bio?: string; avatarUrl?: string; avatarUri?: string; callRatePerMinute?: number },
  ) {
    const userId = idParam && idParam !== 'me' ? idParam : (user?.id || user?.sub);
    const avatar = body.avatarUrl || body.avatarUri;
    const data = await this.usersService.updateProfile(userId, {
      ...body,
      ...(avatar ? { avatarUrl: avatar } : {}),
    });
    return { ok: true, data };
  }

  @Delete('users/me')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@CurrentUser() user: any) {
    const userId = user?.id || user?.sub;
    // update status to BANNED or delete
    return { ok: true, message: '회원 탈퇴 완료' };
  }

  // ==========================================
  // User Photos Management
  // ==========================================
  @Post('users/me/photos')
  @UseGuards(JwtAuthGuard)
  async addPhoto(
    @CurrentUser() user: any,
    @Body() body: { imageUrl?: string; url?: string; order?: number; isPrimary?: boolean },
  ) {
    const userId = user?.id || user?.sub;
    const url = body?.imageUrl || body?.url;
    if (!url) throw new BadRequestException('사진 URL이 필요합니다.');
    const photo = await this.usersService.addPhoto(userId, url, body.order, body.isPrimary);
    return { ok: true, data: photo };
  }

  @Patch('users/me/photos/:photoId/primary')
  @UseGuards(JwtAuthGuard)
  async setPrimaryPhoto(
    @CurrentUser() user: any,
    @Param('photoId') photoId: string,
  ) {
    const userId = user?.id || user?.sub;
    const res = await this.usersService.setPrimaryPhoto(userId, photoId);
    return { ok: true, data: res };
  }

  @Delete('users/me/photos/:photoId')
  @UseGuards(JwtAuthGuard)
  async deletePhoto(
    @CurrentUser() user: any,
    @Param('photoId') photoId: string,
  ) {
    const userId = user?.id || user?.sub;
    await this.usersService.deletePhoto(userId, photoId);
    return { ok: true, message: '사진이 삭제되었습니다.' };
  }

  @Public()
  @Get('users/:id/photos')
  async getUserPhotos(@Param('id') id: string) {
    const data = await this.usersService.getUserPhotos(id);
    return { ok: true, data };
  }

  // ==========================================
  // User Public Profile
  // ==========================================
  @Public()
  @Get('users/:id')
  async getUserPublicProfile(@Param('id') id: string) {
    const data = await this.usersService.byPublicId(id);
    if (!data) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return { ok: true, data };
  }

  @Public()
  @Get('users')
  async searchUsers(@Query('keyword') keyword?: string, @Query('q') q?: string) {
    const data = await this.usersService.searchUsers({ keyword: keyword || q });
    return { ok: true, data, items: data };
  }
}
