import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from 'nestjs-prisma';

export interface GiftItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  animationUrl?: string | null;
  animationType: string;
  category: string;
  sortOrder: number;
  amount: number;
  points: number;
  pricePoints: number;
  isActive: boolean;
  chatEnabled: boolean;
  liveEnabled: boolean;
  isNew: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const INITIAL_SEED_GIFTS: GiftItem[] = [
  {
    id: 'gift-1',
    code: 'gift-coffee',
    name: '따뜻한 커피',
    description: '친구에게 마음을 전하는 따뜻한 커피 한 잔',
    pricePoints: 100,
    amount: 100,
    points: 100,
    thumbnailUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200',
    animationType: 'none',
    category: 'general',
    sortOrder: 1,
    isActive: true,
    chatEnabled: true,
    liveEnabled: true,
    isNew: false,
  },
  {
    id: 'gift-2',
    code: 'gift-icecream',
    name: '달콤한 아이스크림',
    description: '기분 좋은 시원하고 달콤한 선물',
    pricePoints: 300,
    amount: 300,
    points: 300,
    thumbnailUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=200',
    animationType: 'none',
    category: 'general',
    sortOrder: 2,
    isActive: true,
    chatEnabled: true,
    liveEnabled: true,
    isNew: false,
  },
  {
    id: 'gift-3',
    code: 'gift-cake',
    name: '조각 케이크',
    description: '특별한 날을 축하하는 달콤한 케이크',
    pricePoints: 500,
    amount: 500,
    points: 500,
    thumbnailUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200',
    animationType: 'none',
    category: 'general',
    sortOrder: 3,
    isActive: true,
    chatEnabled: true,
    liveEnabled: true,
    isNew: false,
  },
  {
    id: 'gift-4',
    code: 'gift-bouquet',
    name: '아름다운 꽃다발',
    description: '진심 어린 감동을 전하는 꽃다발 선물',
    pricePoints: 1000,
    amount: 1000,
    points: 1000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=200',
    animationType: 'none',
    category: 'special',
    sortOrder: 4,
    isActive: true,
    chatEnabled: true,
    liveEnabled: true,
    isNew: false,
  },
  {
    id: 'gift-5',
    code: 'gift-diamond',
    name: '영롱한 다이아몬드',
    description: '최고의 찬사를 보내는 영롱한 보석',
    pricePoints: 5000,
    amount: 5000,
    points: 5000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=200',
    animationType: '3d_heart',
    category: 'special',
    sortOrder: 5,
    isActive: true,
    chatEnabled: true,
    liveEnabled: true,
    isNew: false,
  },
  {
    id: 'gift-6',
    code: 'gift-supercar',
    name: '네온 슈퍼카 (3D)',
    description: '화려한 라이브를 수놓는 3D 슈퍼카 이펙트',
    pricePoints: 10000,
    amount: 10000,
    points: 10000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=200',
    animationUrl: 'https://assets.mixkit.co/videos/preview/mixkit-car-headlights-in-the-dark-42416-large.mp4',
    animationType: 'alpha_video',
    category: 'vip',
    sortOrder: 6,
    isActive: true,
    chatEnabled: true,
    liveEnabled: true,
    isNew: true,
  },
  {
    id: 'gift-7',
    code: 'gift-dragon',
    name: '골든 드래곤 (3D)',
    description: '화면 전체를 압도하는 헐리우드급 3D 황금 드래곤',
    pricePoints: 30000,
    amount: 30000,
    points: 30000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200',
    animationUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fire-sparks-rising-in-the-dark-42352-large.mp4',
    animationType: 'alpha_video',
    category: 'vip',
    sortOrder: 7,
    isActive: true,
    chatEnabled: true,
    liveEnabled: true,
    isNew: true,
  },
];

@Injectable()
export class GiftsService implements OnModuleInit {
  private readonly logger = new Logger(GiftsService.name);
  private gifts: GiftItem[] = [];
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly dataFilePath = path.join(this.dataDir, 'gifts.json');

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.loadPersistedGifts();
  }

  private loadPersistedGifts() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.gifts = parsed;
          this.logger.log(`Loaded ${this.gifts.length} gifts from persistent file storage.`);
          return;
        }
      }

      // 기본 시드 데이터 저장
      this.gifts = [...INITIAL_SEED_GIFTS];
      this.savePersistedGifts();
      this.logger.log(`Initialized and saved ${this.gifts.length} default gifts.`);
    } catch (err: any) {
      this.logger.warn(`Failed to read gifts from disk: ${err?.message}, using in-memory seeds.`);
      this.gifts = [...INITIAL_SEED_GIFTS];
    }
  }

  private savePersistedGifts() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.dataFilePath, JSON.stringify(this.gifts, null, 2), 'utf-8');
    } catch (err: any) {
      this.logger.error(`Failed to save gifts to disk: ${err?.message}`);
    }
  }

  async listAllForAdmin(): Promise<GiftItem[]> {
    return [...this.gifts].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  async listActive(params?: { category?: string; context?: 'chat' | 'live' }): Promise<GiftItem[]> {
    let list = this.gifts.filter((g) => g.isActive);
    if (params?.category && params.category !== 'all') {
      list = list.filter((g) => g.category === params.category);
    }
    if (params?.context === 'chat') {
      list = list.filter((g) => g.chatEnabled);
    } else if (params?.context === 'live') {
      list = list.filter((g) => g.liveEnabled);
    }
    return list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  async createGift(payload: Partial<GiftItem>): Promise<GiftItem> {
    const id = `gift-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const pricePoints = Number(payload.pricePoints ?? payload.points ?? 100);

    const newGift: GiftItem = {
      id,
      code: payload.code?.trim() || `gift-${Date.now().toString(36)}`,
      name: payload.name?.trim() || '신규 선물',
      description: payload.description?.trim() || '',
      pricePoints,
      amount: pricePoints,
      points: pricePoints,
      thumbnailUrl: payload.thumbnailUrl || null,
      animationUrl: payload.animationUrl || null,
      animationType: payload.animationType || 'alpha_video',
      category: payload.category || 'general',
      sortOrder: Number(payload.sortOrder ?? this.gifts.length + 1),
      isActive: payload.isActive !== false,
      chatEnabled: payload.chatEnabled !== false,
      liveEnabled: payload.liveEnabled !== false,
      isNew: Boolean(payload.isNew),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.gifts.push(newGift);
    this.savePersistedGifts();
    return newGift;
  }

  async updateGift(id: string, payload: Partial<GiftItem>): Promise<GiftItem> {
    const index = this.gifts.findIndex((g) => g.id === id);
    if (index === -1) {
      throw new Error(`선물 ID ${id}를 찾을 수 없습니다.`);
    }

    const current = this.gifts[index];
    const pricePoints = payload.pricePoints !== undefined ? Number(payload.pricePoints) : current.pricePoints;

    const updated: GiftItem = {
      ...current,
      ...payload,
      id: current.id,
      pricePoints,
      amount: pricePoints,
      points: pricePoints,
      updatedAt: new Date().toISOString(),
    };

    this.gifts[index] = updated;
    this.savePersistedGifts();
    return updated;
  }

  async deleteGift(id: string): Promise<boolean> {
    const index = this.gifts.findIndex((g) => g.id === id);
    if (index !== -1) {
      this.gifts.splice(index, 1);
      this.savePersistedGifts();
    }
    return true;
  }

  async getGiftStats() {
    let totalTransactions = 0;
    let totalPointsSent = 0;

    try {
      const agg = await this.prisma.giftTransaction.aggregate({
        _count: { id: true },
        _sum: { points: true },
      });
      totalTransactions = agg._count.id;
      totalPointsSent = agg._sum.points ?? 0;
    } catch {
      // 거래 내역이 없거나 연결 지연 시 0으로 안전 반환
    }

    return {
      totalGifts: this.gifts.length,
      activeGifts: this.gifts.filter((g) => g.isActive).length,
      totalTransactions,
      totalPointsSent,
    };
  }
}
