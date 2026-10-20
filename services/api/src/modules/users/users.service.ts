import { BadRequestException, Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { UserRole, UserStatus } from '../../common/user-types';
import * as fs from 'fs';
import * as path from 'path';

export type UserSearchFilters = {
  keyword?: string;
  status?: UserStatus;
  limit?: number;
};

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly profilesFilePath = path.join(this.dataDir, 'user-profiles.json');
  private extendedProfiles: Record<string, any> = {};

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.loadExtendedProfiles();
  }

  private loadExtendedProfiles() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.profilesFilePath)) {
        const raw = fs.readFileSync(this.profilesFilePath, 'utf-8');
        this.extendedProfiles = JSON.parse(raw);
      }
    } catch (e: any) {
      this.logger.warn(`Failed to read user-profiles.json: ${e?.message}`);
      this.extendedProfiles = {};
    }
  }

  private saveExtendedProfiles() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.profilesFilePath, JSON.stringify(this.extendedProfiles, null, 2), 'utf-8');
    } catch (e: any) {
      this.logger.error(`Failed to save user-profiles.json: ${e?.message}`);
    }
  }

  private normalizeUser(user: any) {
    if (!user) return null;
    const ext = this.extendedProfiles[user.id] || {};
    const nickname = user.nickname || ext.nickname || user.displayName || '회원';
    const displayName = user.displayName || user.nickname || ext.nickname || '회원';
    const avatarUrl = user.avatarUrl || ext.avatarUrl || ext.avatarUri || user.photos?.[0]?.url || null;
    const headline = ext.headline || user.bio || '새로운 인연을 기다려요 ✨';
    const bio = user.bio !== undefined ? user.bio : (ext.bio || '');
    const region1 = ext.region1 || '서울특별시';
    const region2 = ext.region2 || '강남구 역삼동';
    const interests = Array.isArray(ext.interests) ? ext.interests : ['소통', '일상', '친구'];

    const pointBal = user.pointBalance ?? 0;

    return {
      ...user,
      pointBalance: pointBal,
      pointsBalance: pointBal,
      points: pointBal,
      balance: pointBal,
      spendableBalance: pointBal,
      nickname,
      displayName,
      avatarUrl,
      avatarUri: avatarUrl,
      headline,
      bio,
      region1,
      region2,
      location: `${region1} ${region2}`.trim(),
      interests,
      profile: {
        id: user.id,
        nickname,
        displayName,
        name: nickname,
        avatarUri: avatarUrl,
        avatarUrl,
        headline,
        bio,
        region1,
        region2,
        interests,
      },
      photos: (user.photos || []).map((p: any) => ({
        ...p,
        imageUrl: p.url,
        order: p.sortOrder,
      })),
    };
  }

  async byId(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        photos: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!user) return null;
    return this.normalizeUser(user);
  }

  async byPublicId(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, status: { in: ['ACTIVE', 'active'] } },
      select: {
        id: true,
        nickname: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        callRatePerMinute: true,
        role: true,
        photos: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            url: true,
            sortOrder: true,
            isPrimary: true,
          },
        },
      },
    });
    if (!user) return null;
    return this.normalizeUser(user);
  }

  async getMe(userId: string) {
    const user = await this.byId(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  async updateProfile(userId: string, data: any) {
    if (data.nickname) {
      const existing = await this.prisma.user.findUnique({
        where: { nickname: data.nickname },
      });
      if (existing && existing.id !== userId) {
        throw new BadRequestException('이미 사용 중인 닉네임입니다.');
      }
    }

    const currentExt = this.extendedProfiles[userId] || {};
    this.extendedProfiles[userId] = {
      ...currentExt,
      ...(data.nickname ? { nickname: data.nickname } : {}),
      ...(data.region1 !== undefined ? { region1: data.region1 } : {}),
      ...(data.region2 !== undefined ? { region2: data.region2 } : {}),
      ...(data.headline !== undefined ? { headline: data.headline } : {}),
      ...(data.bio !== undefined ? { bio: data.bio } : {}),
      ...(data.interests !== undefined ? { interests: data.interests } : {}),
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      ...(data.avatarUri !== undefined ? { avatarUrl: data.avatarUri, avatarUri: data.avatarUri } : {}),
    };
    this.saveExtendedProfiles();

    const avatar = data.avatarUrl || data.avatarUri;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.nickname ? { nickname: data.nickname, displayName: data.nickname } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(avatar !== undefined ? { avatarUrl: avatar } : {}),
        ...(data.callRatePerMinute !== undefined ? { callRatePerMinute: data.callRatePerMinute } : {}),
      },
      include: {
        photos: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return this.normalizeUser(updated);
  }

  async checkNickname(nickname: string) {
    const trimmed = String(nickname || '').trim();
    if (!trimmed) {
      return { ok: false, available: false, message: '닉네임을 입력해 주세요.' };
    }
    const existing = await this.prisma.user.findUnique({
      where: { nickname: trimmed },
    });
    return {
      ok: true,
      available: !existing,
      message: existing ? '이미 사용 중인 닉네임입니다.' : '사용 가능한 닉네임입니다.',
    };
  }

  async getUserPhotos(userId: string) {
    const photos = await this.prisma.userPhoto.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' },
    });
    return photos.map((p) => ({
      ...p,
      imageUrl: p.url,
      order: p.sortOrder,
    }));
  }

  async setPrimaryPhoto(userId: string, photoId: string) {
    await this.prisma.userPhoto.updateMany({
      where: { userId },
      data: { isPrimary: false },
    });
    const updated = await this.prisma.userPhoto.updateMany({
      where: { id: photoId, userId },
      data: { isPrimary: true },
    });
    return { ok: true, count: updated.count };
  }

  async addPhoto(userId: string, imageUrl: string, order?: number, isPrimary = false) {
    const count = await this.prisma.userPhoto.count({ where: { userId } });
    if (count >= 9) {
      throw new BadRequestException('사진은 최대 9장까지만 등록 가능합니다.');
    }

    if (isPrimary || count === 0) {
      await this.prisma.userPhoto.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });
    }

    const created = await this.prisma.userPhoto.create({
      data: {
        userId,
        url: imageUrl,
        sortOrder: order !== undefined ? order : count + 1,
        isPrimary: isPrimary || count === 0,
      },
    });

    return {
      ...created,
      imageUrl: created.url,
      order: created.sortOrder,
    };
  }

  async deletePhoto(userId: string, photoId: string) {
    return this.prisma.userPhoto.deleteMany({
      where: { id: photoId, userId },
    });
  }

  async searchUsers(filters: UserSearchFilters) {
    const limit = filters.limit ? Math.min(filters.limit, 50) : 20;
    const users = await this.prisma.user.findMany({
      where: {
        ...(filters.keyword ? { nickname: { contains: filters.keyword } } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        photos: {
          take: 3,
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return users.map((u) => ({
      ...u,
      photos: (u.photos || []).map((p) => ({
        ...p,
        imageUrl: p.url,
        order: p.sortOrder,
      })),
    }));
  }

  async getDiscoverRecommendations(currentUserId?: string) {
    const dbUsers = await this.prisma.user.findMany({
      where: {
        ...(currentUserId ? { id: { not: currentUserId } } : {}),
        status: { in: ['active', 'ACTIVE'] },
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        photos: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    const seeds = [
      {
        id: 'u-seed-1',
        name: '박서연',
        displayName: '박서연',
        age: 26,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
        region1: '서울시',
        region2: '강남구 역삼동',
        distance: 1.2,
        headline: '전시회랑 분위기 좋은 카페 투어 좋아하는 직장인입니다 ☕',
        bio: '주말에 가볍게 커피 한잔하면서 편안하게 이야기 나눌 동네 친구 찾아요! ✨',
        interests: ['카페', '전시회', '음악', '산책'],
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
        photos: [
          { id: 'p1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600', isPrimary: true },
          { id: 'p2', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600' },
          { id: 'p3', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600' },
        ],
      },
      {
        id: 'u-seed-2',
        name: '김도현',
        displayName: '김도현',
        age: 28,
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600',
        region1: '서울시',
        region2: '서초구 반포동',
        distance: 2.1,
        headline: '퇴근하고 러닝이나 헬스 함께할 메이트 구해요 🏃',
        bio: '운동과 맛있는 음식 좋아하는 긍정적인 사람입니다! 서로에게 좋은 에너지를 줄 수 있는 인연을 찾고 있어요.',
        interests: ['운동', '러닝', '헬스', '맛집'],
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
        photos: [
          { id: 'p1', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600', isPrimary: true },
          { id: 'p2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600' },
        ],
      },
      {
        id: 'u-seed-3',
        name: '이지수',
        displayName: '이지수',
        age: 25,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600',
        region1: '서울시',
        region2: '송파구 잠실동',
        distance: 1.8,
        headline: '강아지 산책이나 한강 피크닉 같이 가요 🐶',
        bio: '골든리트리버 키우고 있어요. 반려동물 사랑하시는 분 언제든 환영합니다!',
        interests: ['반려견', '피크닉', '사진', '카페'],
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
        photos: [
          { id: 'p1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600', isPrimary: true },
          { id: 'p2', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600' },
        ],
      },
      {
        id: 'u-seed-4',
        name: '정민우',
        displayName: '정민우',
        age: 29,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
        region1: '서울시',
        region2: '마포구 연남동',
        distance: 3.4,
        headline: '어쿠스틱 기타 & 인디음악 좋아해요 🎸',
        bio: '소소하게 버스킹도 하고 라이브 방송도 진행합니다. 음악 얘기 나누실 분 편하게 연락주세요!',
        interests: ['음악', '기타', '공연', '여행'],
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
        photos: [
          { id: 'p1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', isPrimary: true },
        ],
      },
      {
        id: 'u-seed-5',
        name: '한유진',
        displayName: '한유진',
        age: 24,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
        region1: '서울시',
        region2: '강남구 논현동',
        distance: 0.8,
        headline: '디저트 카페 탐방 좋아해요 🍰',
        bio: '밝고 긍정적인 성격이에요. 주말에 가볍게 차 한잔해요!',
        interests: ['카페', '디저트', '패션', '영화'],
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
        photos: [
          { id: 'p1', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600', isPrimary: true },
        ],
      },
    ];

    const mappedDb = dbUsers.map((u, i) => ({
      id: u.id,
      name: u.nickname || u.displayName || '회원',
      displayName: u.displayName || u.nickname || '회원',
      age: 26,
      avatar: u.avatarUrl || (u.photos?.[0]?.url ?? null),
      region1: '서울시',
      region2: '강남구',
      distance: Number((0.8 + (i * 0.4)).toFixed(1)),
      headline: u.bio || '새로운 인연을 기다려요 ✨',
      bio: u.bio || '반갑습니다!',
      interests: ['소통', '일상', '친구'],
      pointsPerMinute: u.callRatePerMinute || 1500,
      lastSeenAt: new Date().toISOString(),
      photos: (u.photos || []).map((p) => ({
        id: p.id,
        url: p.url,
        isPrimary: p.isPrimary,
      })),
      profile: {
        nickname: u.nickname || u.displayName || '회원',
        avatarUri: u.avatarUrl || (u.photos?.[0]?.url ?? null),
        headline: u.bio || '새로운 인연을 기다려요 ✨',
        bio: u.bio || '반갑습니다!',
        interests: ['소통', '일상', '친구'],
        lastSeenAt: new Date().toISOString(),
      },
    }));

    const result: any[] = [...mappedDb];
    for (const seed of seeds) {
      if (!result.some((r) => r.id === seed.id)) {
        result.push({
          ...seed,
          profile: {
            nickname: seed.name,
            avatarUri: seed.avatar,
            headline: seed.headline,
            bio: seed.bio,
            interests: seed.interests,
            lastSeenAt: seed.lastSeenAt,
          },
        });
      }
    }

    return result;
  }
}
