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
    id: 'gift-mocco-1',
    code: 'gift-blushing-mocco',
    name: '볼빨간 모꼬 (소형)',
    description: '모꼬가 부끄러워하며 화면에 핑크빛 하트 구름 방울을 퐁퐁 뿜어냅니다 ☁️💖',
    pricePoints: 1000,
    amount: 1000,
    points: 1000,
    thumbnailUrl: '/images/mocco-mascot.png',
    animationType: 'BLUSHING_MOCCO',
    category: 'mocco_special',
    sortOrder: 1,
    isActive: true,
    chatEnabled: true,
    liveEnabled: true,
    isNew: true,
  },
  {
    id: 'gift-mocco-2',
    code: 'gift-cloud-car-mocco',
    name: '구름카 탄 모꼬 (중형)',
    description: '모꼬가 핑크빛 오픈카를 타고 화면을 가로지르며 꽃가루 폭죽을 쏘아 올립니다 🚗🎉',
    pricePoints: 5000,
    amount: 5000,
    points: 5000,
    thumbnailUrl: '/images/mocco-mascot.png',
    animationType: 'CLOUD_CAR_MOCCO',
    category: 'mocco_special',
    sortOrder: 2,
    isActive: true,
    chatEnabled: true,
    liveEnabled: true,
    isNew: true,
  },
  {
    id: 'gift-mocco-3',
    code: 'gift-golden-king-mocco',
    name: '골든 킹 모꼬의 축제 (VIP 대형)',
    description: '황금 왕관을 쓴 거대 황금 모꼬가 나타나 화면 전체에 골드 코인과 축제 폭죽을 쏟아붓습니다 👑🪙🎆',
    pricePoints: 30000,
    amount: 30000,
    points: 30000,
    thumbnailUrl: '/images/mocco-mascot.png',
    animationType: 'GOLDEN_KING_MOCCO',
    category: 'mocco_vip',
    sortOrder: 3,
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
