import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

export type GiftItem = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  amount: number; // point cost
  points?: number; // alias for mobile client
  priceCents?: number;
  currency?: string;
  isActive?: boolean;
};

type CachedGifts = { expiresAt: number; data: GiftItem[] };

@Injectable()
export class GiftsService {
  private readonly logger = new Logger(GiftsService.name);
  private cache?: CachedGifts;

  private readonly fallback: GiftItem[] = [
    {
      id: 'gift-coffee',
      name: '따뜻한 커피',
      description: '친구에게 마음을 전하는 따뜻한 커피 한 잔',
      amount: 100,
      points: 100,
      priceCents: 1000,
      currency: 'KRW',
      isActive: true,
    },
    {
      id: 'gift-icecream',
      name: '달콤한 아이스크림',
      description: '더위를 식혀주는 시원하고 달콤한 선물',
      amount: 300,
      points: 300,
      priceCents: 3000,
      currency: 'KRW',
      isActive: true,
    },
    {
      id: 'gift-cake',
      name: '조각 케이크',
      description: '기분 좋은 하루를 선물하는 달콤한 케이크',
      amount: 500,
      points: 500,
      priceCents: 5000,
      currency: 'KRW',
      isActive: true,
    },
    {
      id: 'gift-bouquet',
      name: '아름다운 꽃다발',
      description: '진심 어린 감동을 전하는 꽃다발 선물',
      amount: 1000,
      points: 1000,
      priceCents: 10000,
      currency: 'KRW',
      isActive: true,
    },
    {
      id: 'gift-diamond',
      name: '다이아몬드',
      description: '최고의 찬사를 보내는 영롱한 다이아몬드',
      amount: 5000,
      points: 5000,
      priceCents: 50000,
      currency: 'KRW',
      isActive: true,
    },
  ];

  async listActive(): Promise<GiftItem[]> {
    if (this.cache && this.cache.expiresAt > Date.now()) {
      return this.cache.data;
    }

    const filePath =
      process.env.GIFTS_CONFIG_PATH ??
      join(process.cwd(), 'store_assets', 'gifts.json');

    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      const normalized: GiftItem[] = Array.isArray(parsed)
        ? parsed
            .map((item: any) => {
              const amount = Number(
                item.amount ?? item.points ?? item.priceCents ?? 0,
              );
              return {
                id: String(item.id ?? item.slug ?? ''),
                name: String(item.name ?? item.title ?? ''),
                description: item.description
                  ? String(item.description)
                  : undefined,
                imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
                amount,
                points: amount,
                priceCents: item.priceCents ? Number(item.priceCents) : undefined,
                currency: item.currency ? String(item.currency) : 'KRW',
                isActive: item.isActive !== false,
              };
            })
            .filter((item) => item.id && item.name && item.isActive !== false)
        : [];

      const data = normalized.length > 0 ? normalized : this.fallback;
      this.cache = { expiresAt: Date.now() + 60_000, data };
      return data;
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        this.logger.warn(
          `Failed to load gifts configuration: ${error?.message ?? error}`,
        );
      }
      this.cache = { expiresAt: Date.now() + 60_000, data: this.fallback };
      return this.fallback;
    }
  }

  async getGiftById(id: string): Promise<GiftItem | null> {
    const list = await this.listActive();
    return list.find((item) => item.id === id) ?? null;
  }
}
