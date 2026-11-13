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
    const age = user.age !== undefined ? user.age : (ext.age !== undefined ? ext.age : 26);
    const gender = user.gender || ext.gender || '여';
    const chatEntryFee = ext.chatEntryFee !== undefined ? Number(ext.chatEntryFee) : 30;
    const liveEntryFee = ext.liveEntryFee !== undefined ? Number(ext.liveEntryFee) : 0;

    const pointBal = user.pointBalance ?? 0;

    return {
      ...user,
      pointBalance: pointBal,
      pointsBalance: pointBal,
      points: pointBal,
      balance: pointBal,
      spendableBalance: pointBal,
      chatEntryFee,
      liveEntryFee,
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
      age,
      gender,
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
        age,
        gender,
        chatEntryFee,
        liveEntryFee,
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
      ...(data.age !== undefined ? { age: Number(data.age) } : {}),
      ...(data.gender !== undefined ? { gender: data.gender } : {}),
      ...(data.chatEntryFee !== undefined ? { chatEntryFee: Math.max(0, Number(data.chatEntryFee)) } : {}),
      ...(data.liveEntryFee !== undefined ? { liveEntryFee: Math.max(0, Number(data.liveEntryFee)) } : {}),
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
        id: 'friend-1',
        name: '민지 (모꼬지)',
        nickname: '민지 (모꼬지)',
        displayName: '민지 (모꼬지)',
        gender: 'female',
        age: 26,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        region: '서울 강남구',
        region1: '서울',
        region2: '강남구',
        distance: 0.4,
        mannerTemp: 39.2,
        statusMessage: '오늘 날씨 너무 좋아요 ☀️ 실시간 소통 환영해요!',
        headline: '오늘 날씨 너무 좋아요 ☀️ 실시간 소통 환영해요!',
        bio: '오늘 날씨 너무 좋아요 ☀️ 실시간 소통 환영해요!',
        isOnline: true,
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
      },
      {
        id: 'friend-2',
        name: '준호',
        nickname: '준호',
        displayName: '준호',
        gender: 'male',
        age: 29,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
        region: '전남 여수시',
        region1: '전남',
        region2: '여수시',
        distance: 1.2,
        mannerTemp: 38.5,
        statusMessage: '여수 밤바다 보며 일상 수다 나눌 친구 찾아요 🌊',
        headline: '여수 밤바다 보며 일상 수다 나눌 친구 찾아요 🌊',
        bio: '여수 밤바다 보며 일상 수다 나눌 친구 찾아요 🌊',
        isOnline: true,
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
      },
      {
        id: 'friend-3',
        name: '지은',
        nickname: '지은',
        displayName: '지은',
        gender: 'female',
        age: 24,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
        region: '전북 전주시',
        region1: '전북',
        region2: '전주시',
        distance: 1.8,
        mannerTemp: 37.8,
        statusMessage: '한옥마을 카페 투어 & 음악 감상 좋아합니다 ☕',
        headline: '한옥마을 카페 투어 & 음악 감상 좋아합니다 ☕',
        bio: '한옥마을 카페 투어 & 음악 감상 좋아합니다 ☕',
        isOnline: true,
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
      },
      {
        id: 'friend-4',
        name: '도윤',
        nickname: '도윤',
        displayName: '도윤',
        gender: 'male',
        age: 34,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
        region: '부산 해운대구',
        region1: '부산',
        region2: '해운대구',
        distance: 3.1,
        mannerTemp: 36.5,
        statusMessage: '비즈니스 & 맛집 정보 공유해요 ✨',
        headline: '비즈니스 & 맛집 정보 공유해요 ✨',
        bio: '비즈니스 & 맛집 정보 공유해요 ✨',
        isOnline: true,
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
      },
      {
        id: 'friend-5',
        name: '하은',
        nickname: '하은',
        displayName: '하은',
        gender: 'female',
        age: 31,
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
        region: '경기 성남시 분당',
        region1: '경기',
        region2: '성남시 분당',
        distance: 2.5,
        mannerTemp: 37.2,
        statusMessage: '퇴근 후 소소한 대화 신청 환영해요!',
        headline: '퇴근 후 소소한 대화 신청 환영해요!',
        bio: '퇴근 후 소소한 대화 신청 환영해요!',
        isOnline: true,
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
      },
      {
        id: 'friend-6',
        name: '태우',
        nickname: '태우',
        displayName: '태우',
        gender: 'male',
        age: 42,
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
        region: '인천 송도',
        region1: '인천',
        region2: '송도',
        distance: 4.8,
        mannerTemp: 36.8,
        statusMessage: '골프 & 등산 취미 나누실 분 계신가요 ⛳',
        headline: '골프 & 등산 취미 나누실 분 계신가요 ⛳',
        bio: '골프 & 등산 취미 나누실 분 계신가요 ⛳',
        isOnline: false,
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
      },
      {
        id: 'friend-7',
        name: '지수',
        nickname: '지수',
        displayName: '지수',
        gender: 'female',
        age: 27,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
        region: '대구 수성구',
        region1: '대구',
        region2: '수성구',
        distance: 5.2,
        mannerTemp: 38.9,
        statusMessage: '수성못 산책 같이 걸어요 🌸',
        headline: '수성못 산책 같이 걸어요 🌸',
        bio: '수성못 산책 같이 걸어요 🌸',
        isOnline: true,
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
      },
      {
        id: 'friend-8',
        name: '현우',
        nickname: '현우',
        displayName: '현우',
        gender: 'male',
        age: 33,
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300',
        region: '대전 유성구',
        region1: '대전',
        region2: '유성구',
        distance: 3.8,
        mannerTemp: 37.0,
        statusMessage: '온천 & 맛집 탐방 좋아합니다 ♨️',
        headline: '온천 & 맛집 탐방 좋아합니다 ♨️',
        bio: '온천 & 맛집 탐방 좋아합니다 ♨️',
        isOnline: true,
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
      },
      {
        id: 'friend-9',
        name: '다은',
        nickname: '다은',
        displayName: '다은',
        gender: 'female',
        age: 25,
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300',
        avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300',
        region: '광주 서구',
        region1: '광주',
        region2: '서구',
        distance: 2.9,
        mannerTemp: 39.5,
        statusMessage: '상무지구 예쁜 카페 같이 가요 🍰',
        headline: '상무지구 예쁜 카페 같이 가요 🍰',
        bio: '상무지구 예쁜 카페 같이 가요 🍰',
        isOnline: true,
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
      },
      {
        id: 'friend-10',
        name: '시우',
        nickname: '시우',
        displayName: '시우',
        gender: 'male',
        age: 36,
        avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300',
        avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300',
        region: '울산 남구',
        region1: '울산',
        region2: '남구',
        distance: 6.4,
        mannerTemp: 36.9,
        statusMessage: '대왕암공원 드라이브 같이해요 🚗',
        headline: '대왕암공원 드라이브 같이해요 🚗',
        bio: '대왕암공원 드라이브 같이해요 🚗',
        isOnline: true,
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
      },
      {
        id: 'friend-11',
        name: '유나',
        nickname: '유나',
        displayName: '유나',
        gender: 'female',
        age: 28,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        region: '세종 보람동',
        region1: '세종',
        region2: '보람동',
        distance: 1.5,
        mannerTemp: 38.1,
        statusMessage: '호수공원 라이딩 메이트 구해요 🚴',
        headline: '호수공원 라이딩 메이트 구해요 🚴',
        bio: '호수공원 라이딩 메이트 구해요 🚴',
        isOnline: true,
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
      },
      {
        id: 'friend-12',
        name: '동현',
        nickname: '동현',
        displayName: '동현',
        gender: 'male',
        age: 30,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
        region: '강원 춘천시',
        region1: '강원',
        region2: '춘천시',
        distance: 7.2,
        mannerTemp: 37.4,
        statusMessage: '춘천 소양강 바람 쐬러 오세요 ⛵',
        headline: '춘천 소양강 바람 쐬러 오세요 ⛵',
        bio: '춘천 소양강 바람 쐬러 오세요 ⛵',
        isOnline: true,
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
      },
      {
        id: 'friend-13',
        name: '서연',
        nickname: '서연',
        displayName: '서연',
        gender: 'female',
        age: 23,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
        region: '충북 청주시',
        region1: '충북',
        region2: '청주시',
        distance: 4.1,
        mannerTemp: 38.6,
        statusMessage: '수암골 벽화마을 야경 추천해요 🌃',
        headline: '수암골 벽화마을 야경 추천해요 🌃',
        bio: '수암골 벽화마을 야경 추천해요 🌃',
        isOnline: true,
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
      },
      {
        id: 'friend-14',
        name: '민재',
        nickname: '민재',
        displayName: '민재',
        gender: 'male',
        age: 35,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
        region: '충남 천안시',
        region1: '충남',
        region2: '천안시',
        distance: 3.3,
        mannerTemp: 37.1,
        statusMessage: '천안 아산 소통 친구 환영합니다 🌿',
        headline: '천안 아산 소통 친구 환영합니다 🌿',
        bio: '천안 아산 소통 친구 환영합니다 🌿',
        isOnline: true,
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
      },
      {
        id: 'friend-15',
        name: '수빈',
        nickname: '수빈',
        displayName: '수빈',
        gender: 'female',
        age: 29,
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
        region: '경북 포항시',
        region1: '경북',
        region2: '포항시',
        distance: 8.5,
        mannerTemp: 38.3,
        statusMessage: '호미곶 일출 드라이브 가실 분 🌅',
        headline: '호미곶 일출 드라이브 가실 분 🌅',
        bio: '호미곶 일출 드라이브 가실 분 🌅',
        isOnline: true,
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
      },
      {
        id: 'friend-16',
        name: '정우',
        nickname: '정우',
        displayName: '정우',
        gender: 'male',
        age: 38,
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
        region: '경남 창원시',
        region1: '경남',
        region2: '창원시',
        distance: 6.9,
        mannerTemp: 37.7,
        statusMessage: '귀산 마창대교 야경 보며 차 한잔 🌉',
        headline: '귀산 마창대교 야경 보며 차 한잔 🌉',
        bio: '귀산 마창대교 야경 보며 차 한잔 🌉',
        isOnline: true,
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
      },
      {
        id: 'friend-17',
        name: '예린',
        nickname: '예린',
        displayName: '예린',
        gender: 'female',
        age: 26,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
        region: '제주 제주시',
        region1: '제주',
        region2: '제주시',
        distance: 12.0,
        mannerTemp: 39.1,
        statusMessage: '제주 해안도로 드라이브 같이해요 🍊',
        headline: '제주 해안도로 드라이브 같이해요 🍊',
        bio: '제주 해안도로 드라이브 같이해요 🍊',
        isOnline: true,
        pointsPerMinute: 1500,
        lastSeenAt: new Date().toISOString(),
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
            interests: (seed as any).interests || [],
            lastSeenAt: seed.lastSeenAt,
          },
        });
      }
    }

    return result;
  }
}
