import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

type UpdateUserRequest = {
  displayName?: string;
  nickname?: string;
  bio?: string;
  region1?: string;
  region2?: string;
  interests?: string[] | string;
  marketingOptIn?: boolean | string;
  headline?: string;
  avatarUri?: string;
};

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // 내 정보 조회 (JWT 토큰 기반)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    const userId = user?.sub ?? user?.id;
    const userData = userId ? await this.users.byId(userId) : null;
    if (!userData) throw new NotFoundException('User not found');
    return { ok: true, data: this.serializeUser(userData) };
  }

  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @ApiQuery({ name: 'phone', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @Get('search')
  async search(
    @Query('q') q: string = '',
    @Query('limit') limit?: string,
    @Query('keyword') keyword?: string,
    @Query('phone') phone?: string,
    @Query('status') status?: string,
  ) {
    const take = Math.min(50, Math.max(1, Number(limit ?? 20) || 20));
    const hasFilters =
      Boolean(keyword?.trim()) || Boolean(phone?.trim()) || Boolean(status?.trim());
    if (hasFilters) {
      const users = await this.users.searchUsers({ keyword, phone, status, limit: take });
      return { ok: true, data: users, items: users };
    }
    const results = await this.users.search(q ?? '', take);
    const items = results.map((item) => ({
      id: item.id,
      email: item.email,
      displayName: item.displayName,
      nickname: item.profile?.nickname ?? null,
      status: item.status,
      createdAt: item.createdAt,
      bio: item.profile?.bio ?? null,
      interests: item.profile?.interests ?? [],
    }));
    return { ok: true, data: items, items };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: UpdateUserRequest,
  ) {
    const authId = user?.sub ?? user?.id;
    if (!authId || authId !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const interests = this.normalizeInterests(body.interests);
    const marketingOptIn = this.normalizeBoolean(body.marketingOptIn);

    const bioValue = typeof body.bio === 'string' ? body.bio.trim() : undefined;
    const headlineValue = typeof body.headline === 'string' ? body.headline.trim() : undefined;
    const avatarUriValue = typeof body.avatarUri === 'string' ? body.avatarUri.trim() : undefined;
    
    const updated = await this.users.updateProfile(id, {
      displayName: body.displayName?.trim() || undefined,
      nickname: body.nickname?.trim() || undefined,
      bio: bioValue === undefined ? undefined : bioValue.length ? bioValue : null,
      region1: body.region1?.trim() || undefined,
      region2: body.region2?.trim() || undefined,
      interests,
      marketingOptIn,
      headline:
        headlineValue === undefined ? undefined : headlineValue.length ? headlineValue : null,
      avatarUri:
        avatarUriValue === undefined ? undefined : avatarUriValue.length ? avatarUriValue : null,
    });

    return { ok: true, data: this.serializeUser(updated) };
  }

  // 공용/모바일에서 단건 조회 시 사용 예시
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.users.byId(id);
    if (!user) throw new NotFoundException('User not found');
    return { ok: true, data: this.serializeUser(user) };
  }

  private serializeUser(user: any) {
    const visibility = user?.profile?.visibility as Record<string, any> | undefined;
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName ?? null,
      status: user.status,
      provider: user.provider,
      region1: user.region1 ?? null,
      region2: user.region2 ?? null,
      pointsBalance: user.pointsBalance ?? 0,
      createdAt: user.createdAt,
      profile: user.profile
        ? {
            nickname: user.profile.nickname,
            bio: user.profile.bio,
            headline: user.profile.headline ?? null,
            avatarUri: user.profile.avatarUri ?? null,
            interests: user.profile.interests ?? [],
            badges: user.profile.badges ?? [],
            marketingOptIn: visibility?.marketingOptIn ?? false,
          }
        : null,
      counts: user._count
        ? {
            posts: user._count.posts ?? 0,
            reports: user._count.reportsToMe ?? 0,
            messages: user._count.messages ?? 0,
          }
        : undefined,
    };
  }

  private normalizeInterests(value: UpdateUserRequest['interests']) {
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0);
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }

    return undefined;
  }

  private normalizeBoolean(value: UpdateUserRequest['marketingOptIn']) {
    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return ['true', '1', 'yes', 'y'].includes(value.toLowerCase());
    }
    return undefined;
  }
}
