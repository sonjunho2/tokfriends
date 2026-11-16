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

export const SEED_REPRESENTATIVE_USERS = [
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
  },
  {
    id: 'friend-9',
    name: '다은',
    nickname: '다은',
    displayName: '다은',
    gender: 'female',
    age: 25,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    region: '광주 상무지구',
    region1: '광주',
    region2: '상무지구',
    distance: 6.1,
    mannerTemp: 38.1,
    statusMessage: '상무시민공원 러닝 크루 메이트 구해요 🏃‍♀️',
    headline: '상무시민공원 러닝 크루 메이트 구해요 🏃‍♀️',
    bio: '상무시민공원 러닝 크루 메이트 구해요 🏃‍♀️',
    isOnline: true,
  },
  {
    id: 'friend-10',
    name: '시우',
    nickname: '시우',
    displayName: '시우',
    gender: 'male',
    age: 30,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    region: '울산 남구',
    region1: '울산',
    region2: '남구',
    distance: 7.4,
    mannerTemp: 36.9,
    statusMessage: '태화강 국가정원 산책 & 사진 📷',
    headline: '태화강 국가정원 산책 & 사진 📷',
    bio: '태화강 국가정원 산책 & 사진 📷',
    isOnline: false,
  },
  {
    id: 'friend-11',
    name: '유나',
    nickname: '유나',
    displayName: '유나',
    gender: 'female',
    age: 28,
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300',
    region: '세종시 보람동',
    region1: '세종시',
    region2: '보람동',
    distance: 4.2,
    mannerTemp: 39.5,
    statusMessage: '금강보행교 야경 보며 커피 한잔 ☕',
    headline: '금강보행교 야경 보며 커피 한잔 ☕',
    bio: '금강보행교 야경 보며 커피 한잔 ☕',
    isOnline: true,
  },
  {
    id: 'friend-12',
    name: '동현',
    nickname: '동현',
    displayName: '동현',
    gender: 'male',
    age: 36,
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300',
    region: '강원 춘천시',
    region1: '강원',
    region2: '춘천시',
    distance: 8.5,
    mannerTemp: 37.4,
    statusMessage: '의암호 카누 & 드라이브 추천해주세요 🛶',
    headline: '의암호 카누 & 드라이브 추천해주세요 🛶',
    bio: '의암호 카누 & 드라이브 추천해주세요 🛶',
    isOnline: true,
  },
  {
    id: 'friend-13',
    name: '서연',
    nickname: '서연',
    displayName: '서연',
    gender: 'female',
    age: 23,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    region: '충북 청주시',
    region1: '충북',
    region2: '청주시',
    distance: 6.7,
    mannerTemp: 38.3,
    statusMessage: '상당산성 피크닉 & 디저트 카페 투어 🧁',
    headline: '상당산성 피크닉 & 디저트 카페 투어 🧁',
    bio: '상당산성 피크닉 & 디저트 카페 투어 🧁',
    isOnline: true,
  },
  {
    id: 'friend-14',
    name: '민재',
    nickname: '민재',
    displayName: '민재',
    gender: 'male',
    age: 31,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
    region: '충남 천안시',
    region1: '충남',
    region2: '천안시',
    distance: 5.9,
    mannerTemp: 36.7,
    statusMessage: '불당동 맛집 함께 가실 이웃 찾아요 🍕',
    headline: '불당동 맛집 함께 가실 이웃 찾아요 🍕',
    bio: '불당동 맛집 함께 가실 이웃 찾아요 🍕',
    isOnline: false,
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
    distance: 9.8,
    mannerTemp: 39.0,
    statusMessage: '영일대 바다 보며 저녁 산책해요 🌊',
    headline: '영일대 바다 보며 저녁 산책해요 🌊',
    bio: '영일대 바다 보며 저녁 산책해요 🌊',
    isOnline: true,
  },
  {
    id: 'friend-16',
    name: '정우',
    nickname: '정우',
    displayName: '정우',
    gender: 'male',
    age: 35,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    region: '경남 창원시',
    region1: '경남',
    region2: '창원시',
    distance: 10.3,
    mannerTemp: 37.6,
    statusMessage: '용지호수 산책 & 주말 배드민턴 🏸',
    headline: '용지호수 산책 & 주말 배드민턴 🏸',
    bio: '용지호수 산책 & 주말 배드민턴 🏸',
    isOnline: false,
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
  },
];

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly profilesFilePath = path.join(this.dataDir, 'user-profiles.json');
  private extendedProfiles: Record<string, any> = {};

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.loadExtendedProfiles();
    await this.ensureRepresentativeUsers();
  }

  public getExtendedProfile(userId: string) {
    return this.extendedProfiles[userId] || null;
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

  async ensureRepresentativeUsers() {
    try {
      for (let i = 0; i < SEED_REPRESENTATIVE_USERS.length; i++) {
        const seed = SEED_REPRESENTATIVE_USERS[i];
        await this.prisma.user.upsert({
          where: { id: seed.id },
          update: {
            nickname: seed.nickname,
            displayName: seed.displayName,
            avatarUrl: seed.avatarUrl,
            bio: seed.statusMessage,
            status: 'active',
            role: 'user',
          },
          create: {
            id: seed.id,
            email: `friend-${i + 1}@mocco.app`,
            nickname: seed.nickname,
            displayName: seed.displayName,
            avatarUrl: seed.avatarUrl,
            bio: seed.statusMessage,
            status: 'active',
            role: 'user',
            pointBalance: 25000,
            callRatePerMinute: 1500,
          },
        });

        if (!this.extendedProfiles[seed.id]) {
          this.extendedProfiles[seed.id] = {
            nickname: seed.nickname,
            displayName: seed.displayName,
            avatarUrl: seed.avatarUrl,
            gender: seed.gender,
            age: seed.age,
            region1: seed.region1,
            region2: seed.region2,
            location: seed.region,
            headline: seed.headline,
            bio: seed.bio,
            mannerTemp: seed.mannerTemp,
            distance: seed.distance,
            isOnline: seed.isOnline,
          };
        }
      }
      this.saveExtendedProfiles();
    } catch (e: any) {
      this.logger.warn(`Failed to seed representative users: ${e?.message}`);
    }
  }

  async getDiscoverRecommendations(currentUserId?: string) {
    try {
      await this.ensureRepresentativeUsers();
    } catch {}

    const excludeIds = new Set(['admin_super_user']);
    if (currentUserId) excludeIds.add(currentUserId);

    const dbUsers = await this.prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludeIds) },
        role: { notIn: ['ADMIN', 'SUPERADMIN', 'admin'] },
        nickname: { notIn: ['Super Admin', 'admin', '슈퍼어드민', '관리자'] },
        status: { in: ['active', 'ACTIVE'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        photos: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return dbUsers
      .filter((u) => {
        const nick = (u.nickname || u.displayName || '').toLowerCase();
        return (
          u.id !== 'admin_super_user' &&
          u.role !== 'ADMIN' &&
          u.role !== 'SUPERADMIN' &&
          !nick.includes('super admin') &&
          !nick.includes('슈퍼어드민')
        );
      })
      .map((u, i) => {
      const ext = this.extendedProfiles[u.id] || {};
      const nickname = u.nickname || u.displayName || ext.nickname || '모꼬이웃';
      const displayName = u.displayName || u.nickname || ext.displayName || nickname;
      const avatarUrl =
        u.avatarUrl ||
        ext.avatarUrl ||
        u.photos?.[0]?.url ||
        `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(nickname)}`;

      const rawGender = ext.gender || (u.email?.includes('male') ? '남' : i % 2 === 0 ? '여' : '남');
      const isFemale = rawGender === 'female' || rawGender === '여성' || rawGender === '여';
      const gender = isFemale ? 'female' : 'male';
      const genderKo = isFemale ? '여성' : '남성';

      const age = typeof ext.age === 'number' ? ext.age : 23 + ((i * 2) % 15);
      const region1 = ext.region1 || (ext.location ? ext.location.split(' ')[0] : '서울');
      const region2 = ext.region2 || (ext.location ? ext.location.split(' ')[1] || '' : '강남구');
      const region = ext.location || `${region1} ${region2}`.trim();
      const distance = typeof ext.distance === 'number' ? ext.distance : Number((0.4 + (i * 0.3)).toFixed(1));
      const mannerTemp =
        typeof ext.mannerTemp === 'number' ? ext.mannerTemp : Number((36.5 + ((i * 0.4) % 3.5)).toFixed(1));
      const statusMessage = ext.headline || u.bio || '새로운 인연을 기다려요 ✨';

      return {
        id: u.id,
        name: nickname,
        nickname,
        displayName,
        gender,
        genderKo,
        age,
        avatar: avatarUrl,
        avatarUrl,
        region,
        region1,
        region2,
        distance,
        mannerTemp,
        statusMessage,
        headline: statusMessage,
        bio: u.bio || statusMessage,
        interests: ext.interests || ['소통', '일상', '친구'],
        isOnline: ext.isOnline !== undefined ? Boolean(ext.isOnline) : i % 2 === 0,
        pointsPerMinute: u.callRatePerMinute || 1500,
        lastSeenAt: new Date().toISOString(),
        photos: (u.photos || []).map((p) => ({
          id: p.id,
          url: p.url,
          isPrimary: p.isPrimary,
        })),
        profile: {
          id: u.id,
          nickname,
          displayName,
          name: nickname,
          avatarUri: avatarUrl,
          avatarUrl,
          headline: statusMessage,
          bio: u.bio || statusMessage,
          interests: ext.interests || ['소통', '일상', '친구'],
          region1,
          region2,
          age,
          gender,
          lastSeenAt: new Date().toISOString(),
        },
      };
    });
  }
}
