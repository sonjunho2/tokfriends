import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from 'nestjs-prisma';
import { Public } from '../auth/public.decorator';

const MOCK_ACTIVE_NEIGHBORS = [
  {
    id: 'neighbor-1',
    nickname: '민지 (모꼬지)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    neighborhood: '역삼1동',
    statusMessage: '오늘 날씨 너무 좋아요 ☀️',
    isOnline: true,
    lastActiveAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'neighbor-2',
    nickname: '준호',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    neighborhood: '서초2동',
    statusMessage: '저녁에 한강 러닝하실 분 🏃',
    isOnline: true,
    lastActiveAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  {
    id: 'neighbor-3',
    nickname: '수아맘',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    neighborhood: '대치동',
    statusMessage: '공구 특가 구경 중 🛍️',
    isOnline: true,
    lastActiveAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
  },
  {
    id: 'neighbor-4',
    nickname: '도윤',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    neighborhood: '역삼2동',
    statusMessage: '커피 한잔의 여유 ☕',
    isOnline: true,
    lastActiveAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'neighbor-5',
    nickname: '하은',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    neighborhood: '삼성동',
    statusMessage: '동네 수다방 환영해요 ✨',
    isOnline: true,
    lastActiveAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: 'neighbor-6',
    nickname: '현우',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
    neighborhood: '논현1동',
    statusMessage: '모꼬 LIVE 시청 중 🔴',
    isOnline: true,
    lastActiveAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  },
];

@ApiTags('Community (동네 모꼬지)')
@Controller('community')
export class CommunityController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('active-users')
  @ApiOperation({ summary: '최근 10분 이내 접속 및 활동 중인 동네 이웃 목록' })
  async getActiveUsers(@Query('neighborhood') neighborhood?: string) {
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const dbUsers = await this.prisma.user.findMany({
        where: {
          updatedAt: { gte: tenMinutesAgo },
        },
        take: 20,
        select: {
          id: true,
          nickname: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          updatedAt: true,
        },
      });

      const formattedDbUsers = dbUsers.map((u) => ({
        id: u.id,
        nickname: u.nickname || u.displayName || '이웃',
        avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        neighborhood: '역삼동',
        statusMessage: u.bio || '방금 접속함 ✨',
        isOnline: true,
        lastActiveAt: u.updatedAt.toISOString(),
      }));

      // DB 유저와 시뮬레이션 이웃 목록 병합
      const combined = [...formattedDbUsers, ...MOCK_ACTIVE_NEIGHBORS];
      const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());

      return {
        ok: true,
        count: unique.length,
        items: unique,
      };
    } catch {
      return {
        ok: true,
        count: MOCK_ACTIVE_NEIGHBORS.length,
        items: MOCK_ACTIVE_NEIGHBORS,
      };
    }
  }
}
