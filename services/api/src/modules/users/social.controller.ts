import {
  Body,
  Controller,
  Delete,
  Get,
  OnModuleInit,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'nestjs-prisma';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('social')
@Controller()
export class SocialController implements OnModuleInit {
  private friendsStore: any[] = [
    {
      id: 'fr-1',
      status: 'accepted',
      friend: {
        id: 'u-seed-1',
        nickname: '박서연',
        displayName: '박서연',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        online: true,
        region: '서울시 강남구',
      },
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'fr-2',
      status: 'accepted',
      friend: {
        id: 'u-seed-2',
        nickname: '김도현',
        displayName: '김도현',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
        online: true,
        region: '서울시 서초구',
      },
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
      id: 'fr-3',
      status: 'pending_received',
      friend: {
        id: 'u-seed-3',
        nickname: '이지수',
        displayName: '이지수',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
        online: true,
        region: '서울시 송파구',
      },
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ];

  private followersStore: any[] = [
    {
      id: 'u-seed-1',
      userId: 'u-seed-1',
      nickname: '박서연',
      displayName: '박서연',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      avatarUri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      headline: '전시회랑 분위기 좋은 카페 투어 좋아하는 직장인 ☕',
      age: 25,
      gender: '여',
      region1: '서울특별시',
      region2: '강남구 역삼동',
      online: true,
      isLive: true,
      liveRoomId: 'live-def-3',
      liveTitle: '🎨 드로잉 일러스트 & 소통',
    },
    {
      id: 'u-seed-2',
      userId: 'u-seed-2',
      nickname: '김도현',
      displayName: '김도현',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
      avatarUri: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
      headline: '퇴근하고 러닝이나 헬스 함께할 메이트 🏃',
      age: 28,
      gender: '남',
      region1: '서울특별시',
      region2: '서초구 반포동',
      online: true,
      isLive: false,
    },
    {
      id: 'u-seed-3',
      userId: 'u-seed-3',
      nickname: '이지수',
      displayName: '이지수',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
      avatarUri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
      headline: '역삼동 카페에서 소소하게 수다 떨어요 ✨',
      age: 24,
      gender: '여',
      region1: '서울특별시',
      region2: '송파구 잠실동',
      online: true,
      isLive: true,
      liveRoomId: 'live-def-2',
      liveTitle: '☕ 역삼동 카페에서 소소한 수다방',
    },
  ];

  private followingStore: any[] = [
    {
      id: 'u-seed-1',
      userId: 'u-seed-1',
      nickname: '박서연',
      displayName: '박서연',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      avatarUri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      headline: '전시회랑 분위기 좋은 카페 투어 ☕',
      age: 25,
      gender: '여',
      region1: '서울특별시',
      region2: '강남구 역삼동',
      online: true,
      isLive: true,
      liveRoomId: 'live-def-3',
      liveTitle: '🎨 드로잉 일러스트 & 소통',
    },
    {
      id: 'u-seed-3',
      userId: 'u-seed-3',
      nickname: '이지수',
      displayName: '이지수',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
      avatarUri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
      headline: '역삼동 카페에서 소소하게 수다 떨어요 ✨',
      age: 24,
      gender: '여',
      region1: '서울특별시',
      region2: '송파구 잠실동',
      online: true,
      isLive: true,
      liveRoomId: 'live-def-2',
      liveTitle: '☕ 역삼동 카페에서 소소한 수다방',
    },
  ];

  private visitsStore = [
    {
      id: 'vis-1',
      visitor: {
        id: 'u-seed-1',
        nickname: '박서연',
        displayName: '박서연',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        region: '강남구 역삼동',
      },
      visitedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'vis-2',
      visitor: {
        id: 'u-seed-3',
        nickname: '이지수',
        displayName: '이지수',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
        region: '송파구 잠실동',
      },
      visitedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'vis-3',
      visitor: {
        id: 'u-seed-2',
        nickname: '김도현',
        displayName: '김도현',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
        region: '서초구 반포동',
      },
      visitedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ];

  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly blockedFilePath = path.join(this.dataDir, 'blocked-users.json');
  private blockedStore: any[] = [];

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.loadBlockedUsers();
  }

  private loadBlockedUsers() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.blockedFilePath)) {
        const raw = fs.readFileSync(this.blockedFilePath, 'utf-8');
        this.blockedStore = JSON.parse(raw);
      }
    } catch {
      this.blockedStore = [];
    }
  }

  private saveBlockedUsers() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.blockedFilePath, JSON.stringify(this.blockedStore, null, 2), 'utf-8');
    } catch {
      // silent
    }
  }

  // ==========================================
  // Friendships
  // ==========================================
  @Public()
  @Get('friendships')
  async getFriendships(@CurrentUser() user?: any) {
    return { ok: true, data: this.friendsStore, items: this.friendsStore };
  }

  @Public()
  @Get('friendships/status')
  async getFriendshipStatus(
    @Query('targetUserId') targetUserId?: string,
    @Query('targetAccountId') targetAccountId?: string,
  ) {
    const id = targetUserId || targetAccountId;
    const found = this.friendsStore.find((f) => f.friend?.id === id);
    return { ok: true, status: found ? found.status : 'none' };
  }

  @Public()
  @Post('friendships/request')
  async sendFriendRequest(@CurrentUser() user: any, @Body() body: any) {
    const targetId = body.targetUserId || body.targetAccountId;
    const item = {
      id: `fr-${Date.now()}`,
      status: 'pending_sent',
      friend: {
        id: targetId,
        nickname: '회원',
        displayName: '회원',
        avatarUrl: null,
      },
      createdAt: new Date().toISOString(),
    };
    this.friendsStore.unshift(item);
    return { ok: true, data: item, status: 'pending_sent' };
  }

  @Public()
  @Post('friendships/:id/accept')
  async acceptFriendRequest(@Param('id') id: string) {
    const item = this.friendsStore.find((f) => f.id === id);
    if (item) item.status = 'accepted';
    return { ok: true, status: 'accepted' };
  }

  @Public()
  @Post('friendships/:id/decline')
  async declineFriendRequest(@Param('id') id: string) {
    const idx = this.friendsStore.findIndex((f) => f.id === id);
    if (idx !== -1) this.friendsStore.splice(idx, 1);
    return { ok: true };
  }

  @Public()
  @Post('friendships/:id/cancel')
  async cancelFriendRequest(@Param('id') id: string) {
    const idx = this.friendsStore.findIndex((f) => f.id === id);
    if (idx !== -1) this.friendsStore.splice(idx, 1);
    return { ok: true };
  }

  @Public()
  @Post('friendships/:id/remove')
  async removeFriend(@Param('id') id: string) {
    const idx = this.friendsStore.findIndex((f) => f.id === id);
    if (idx !== -1) this.friendsStore.splice(idx, 1);
    return { ok: true };
  }

  // ==========================================
  // Follows
  // ==========================================
  @Public()
  @Get(['accounts/:id/followers', 'users/:id/followers'])
  async getFollowers(@Param('id') id: string) {
    return { ok: true, data: this.followersStore, items: this.followersStore };
  }

  @Public()
  @Get(['accounts/:id/following', 'users/:id/following'])
  async getFollowing(@Param('id') id: string) {
    return { ok: true, data: this.followingStore, items: this.followingStore };
  }

  @Public()
  @Post(['accounts/:id/follow', 'users/:id/follow'])
  async followUser(@Param('id') id: string) {
    if (!this.followingStore.some((u) => u.id === id)) {
      this.followingStore.unshift({
        id,
        nickname: '인연',
        displayName: '인연',
        avatarUrl: null,
        headline: '새로운 이웃',
        online: true,
      });
    }
    return { ok: true, following: true, message: '팔로우했습니다.' };
  }

  @Public()
  @Delete(['accounts/:id/follow', 'users/:id/follow'])
  async unfollowUser(@Param('id') id: string) {
    const idx = this.followingStore.findIndex((u) => u.id === id);
    if (idx !== -1) this.followingStore.splice(idx, 1);
    return { ok: true, following: false, message: '팔로우를 취소했습니다.' };
  }

  @Public()
  @Get(['accounts/:id/follow-status', 'users/:id/follow-status'])
  async getFollowStatus(@Param('id') id: string) {
    const isFollowing = this.followingStore.some((u) => u.id === id);
    return { ok: true, following: isFollowing };
  }

  // ==========================================
  // Profile Visits
  // ==========================================
  @Public()
  @Get(['profile/visits', 'social/visits'])
  async getProfileVisits() {
    return { ok: true, data: this.visitsStore, items: this.visitsStore };
  }

  @Public()
  @Post(['profile/visits', 'social/visits'])
  async recordProfileVisit(@CurrentUser() user: any, @Body() body: any) {
    return { ok: true };
  }

  // ==========================================
  // Blocks
  // ==========================================
  @Public()
  @Get(['community/blocks', 'community/block', 'users/me/blocks'])
  async getBlockedUsers() {
    return { ok: true, data: this.blockedStore, items: this.blockedStore };
  }

  @Public()
  @Post(['community/blocks', 'community/block', 'users/me/blocks'])
  async blockUser(@Body() body: any) {
    const blockedUserId = body.blockedUserId || body.targetAccountId;
    if (blockedUserId && !this.blockedStore.some((b) => b.id === blockedUserId)) {
      this.blockedStore.push({
        id: blockedUserId,
        nickname: body.nickname || '차단된 회원',
        blockedAt: new Date().toISOString(),
      });
      this.saveBlockedUsers();
    }
    return { ok: true, message: '회원을 차단했습니다.' };
  }

  @Public()
  @Delete(['community/blocks/:id', 'community/block/:id', 'users/me/blocks/:id'])
  async unblockUser(@Param('id') id: string) {
    this.blockedStore = this.blockedStore.filter((b) => b.id !== id);
    this.saveBlockedUsers();
    return { ok: true, message: '차단을 해제했습니다.' };
  }
}
