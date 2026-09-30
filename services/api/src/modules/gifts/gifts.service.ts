import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateGiftDto, UpdateGiftDto } from './dto';

export type GiftItem = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  animationUrl?: string | null;
  animationType: string;
  category: string;
  sortOrder: number;
  amount: number; // point cost (client compatibility)
  points: number; // point cost alias
  pricePoints: number;
  isActive: boolean;
  chatEnabled: boolean;
  liveEnabled: boolean;
  isNew: boolean;
};

@Injectable()
export class GiftsService implements OnModuleInit {
  private readonly logger = new Logger(GiftsService.name);

  private readonly initialSeedGifts = [
    {
      code: 'gift-coffee',
      name: '따뜻한 커피',
      description: '친구에게 마음을 전하는 따뜻한 커피 한 잔',
      pricePoints: 100,
      thumbnailUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150',
      animationType: 'none',
      category: 'general',
      sortOrder: 1,
    },
    {
      code: 'gift-icecream',
      name: '달콤한 아이스크림',
      description: '기분 좋은 시원하고 달콤한 선물',
      pricePoints: 300,
      thumbnailUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=150',
      animationType: 'none',
      category: 'general',
      sortOrder: 2,
    },
    {
      code: 'gift-cake',
      name: '조각 케이크',
      description: '특별한 날을 축하하는 달콤한 케이크',
      pricePoints: 500,
      thumbnailUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=150',
      animationType: 'none',
      category: 'general',
      sortOrder: 3,
    },
    {
      code: 'gift-bouquet',
      name: '아름다운 꽃다발',
      description: '진심 어린 감동을 전하는 꽃다발 선물',
      pricePoints: 1000,
      thumbnailUrl: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=150',
      animationType: 'none',
      category: 'special',
      sortOrder: 4,
    },
    {
      code: 'gift-diamond',
      name: '영롱한 다이아몬드',
      description: '최고의 찬사를 보내는 영롱한 보석',
      pricePoints: 5000,
      thumbnailUrl: 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=150',
      animationType: 'none',
      category: 'special',
      sortOrder: 5,
    },
    {
      code: 'gift-supercar',
      name: '네온 슈퍼카 (3D)',
      description: '화려한 라이브를 수놓는 3D 슈퍼카 이펙트',
      pricePoints: 10000,
      thumbnailUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=150',
      animationUrl: 'https://assets.mixkit.co/videos/preview/mixkit-car-headlights-in-the-dark-42416-large.mp4',
      animationType: 'alpha_video',
      category: 'vip',
      sortOrder: 6,
      isNew: true,
    },
    {
      code: 'gift-dragon',
      name: '골든 드래곤 (3D)',
      description: '화면 전체를 압도하는 헐리우드급 3D 황금 드래곤',
      pricePoints: 30000,
      thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150',
      animationUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fire-sparks-rising-in-the-dark-42352-large.mp4',
      animationType: 'alpha_video',
      category: 'vip',
      sortOrder: 7,
      isNew: true,
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultsIfEmpty();
  }

  async seedDefaultsIfEmpty() {
    try {
      const count = await this.prisma.gift.count();
      if (count === 0) {
        this.logger.log('Seeding initial gifts into database...');
        for (const item of this.initialSeedGifts) {
          await this.prisma.gift.upsert({
            where: { code: item.code },
            update: {},
            create: {
              code: item.code,
              name: item.name,
              description: item.description,
              pricePoints: item.pricePoints,
              thumbnailUrl: item.thumbnailUrl,
              animationUrl: item.animationUrl,
              animationType: item.animationType,
              category: item.category,
              sortOrder: item.sortOrder,
              isActive: true,
              chatEnabled: true,
              liveEnabled: true,
              isNew: item.isNew ?? false,
            },
          });
        }
        this.logger.log('Initial gifts seeded successfully.');
      }
    } catch (err: any) {
      this.logger.warn(`Failed to seed default gifts: ${err?.message ?? err}`);
    }
  }

  private mapGift(gift: any): GiftItem {
    return {
      id: gift.id,
      code: gift.code,
      name: gift.name,
      description: gift.description,
      thumbnailUrl: gift.thumbnailUrl,
      animationUrl: gift.animationUrl,
      animationType: gift.animationType,
      category: gift.category,
      sortOrder: gift.sortOrder,
      amount: gift.pricePoints,
      points: gift.pricePoints,
      pricePoints: gift.pricePoints,
      isActive: gift.isActive,
      chatEnabled: gift.chatEnabled,
      liveEnabled: gift.liveEnabled,
      isNew: gift.isNew,
    };
  }

  async listActive(params?: {
    category?: string;
    context?: 'chat' | 'live';
  }): Promise<GiftItem[]> {
    const where: any = { isActive: true };

    if (params?.category && params.category !== 'all') {
      where.category = params.category;
    }
    if (params?.context === 'chat') {
      where.chatEnabled = true;
    } else if (params?.context === 'live') {
      where.liveEnabled = true;
    }

    const gifts = await this.prisma.gift.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { pricePoints: 'asc' }],
    });

    return gifts.map((g) => this.mapGift(g));
  }

  async getGiftById(idOrCode: string): Promise<GiftItem | null> {
    const gift = await this.prisma.gift.findFirst({
      where: {
        OR: [{ id: idOrCode }, { code: idOrCode }],
      },
    });
    return gift ? this.mapGift(gift) : null;
  }

  // ===== 관리자(Admin) 전용 메서드 =====
  async listAllForAdmin(): Promise<GiftItem[]> {
    const gifts = await this.prisma.gift.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return gifts.map((g) => this.mapGift(g));
  }

  async createGift(dto: CreateGiftDto): Promise<GiftItem> {
    const created = await this.prisma.gift.create({
      data: {
        code: dto.code.trim(),
        name: dto.name.trim(),
        description: dto.description?.trim(),
        pricePoints: dto.pricePoints,
        thumbnailUrl: dto.thumbnailUrl?.trim(),
        animationUrl: dto.animationUrl?.trim(),
        animationType: dto.animationType ?? 'alpha_video',
        category: dto.category ?? 'general',
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive !== false,
        chatEnabled: dto.chatEnabled !== false,
        liveEnabled: dto.liveEnabled !== false,
        isNew: dto.isNew ?? false,
      },
    });
    return this.mapGift(created);
  }

  async updateGift(id: string, dto: UpdateGiftDto): Promise<GiftItem> {
    const updated = await this.prisma.gift.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() }),
        ...(dto.pricePoints !== undefined && { pricePoints: dto.pricePoints }),
        ...(dto.thumbnailUrl !== undefined && { thumbnailUrl: dto.thumbnailUrl?.trim() }),
        ...(dto.animationUrl !== undefined && { animationUrl: dto.animationUrl?.trim() }),
        ...(dto.animationType !== undefined && { animationType: dto.animationType }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.chatEnabled !== undefined && { chatEnabled: dto.chatEnabled }),
        ...(dto.liveEnabled !== undefined && { liveEnabled: dto.liveEnabled }),
        ...(dto.isNew !== undefined && { isNew: dto.isNew }),
      },
    });
    return this.mapGift(updated);
  }

  async deleteGift(id: string): Promise<boolean> {
    await this.prisma.gift.delete({ where: { id } });
    return true;
  }

  async getGiftStats() {
    const [totalGifts, activeGifts, transactionStats] = await Promise.all([
      this.prisma.gift.count(),
      this.prisma.gift.count({ where: { isActive: true } }),
      this.prisma.giftTransaction.aggregate({
        _count: { id: true },
        _sum: { points: true },
      }),
    ]);

    return {
      totalGifts,
      activeGifts,
      totalTransactions: transactionStats._count.id,
      totalPointsSent: transactionStats._sum.points ?? 0,
    };
  }
}
