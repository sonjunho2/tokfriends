import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

type GiftItem = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
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
      name: '따뜻한 커피 쿠폰',
      description: '친구에게 마음을 전할 수 있는 기본 선물 쿠폰',
      priceCents: 4500,
      currency: 'KRW',
      isActive: true,
    },
    {
      id: 'gift-icecream',
      name: '달콤한 아이스크림',
      description: '더운 날씨에 시원한 선물을 전달하세요',
      priceCents: 3900,
      currency: 'KRW',
      isActive: true,
    },
  ];

  async listActive(): Promise<GiftItem[]> {
    if (this.cache && this.cache.expiresAt > Date.now()) {
      return this.cache.data;
    }

    const filePath = process.env.GIFTS_CONFIG_PATH ?? join(process.cwd(), 'store_assets', 'gifts.json');

    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      const normalized = Array.isArray(parsed)
        ? parsed
            .map((item: any) => ({
              id: String(item.id ?? item.slug ?? ''),
              name: String(item.name ?? item.title ?? ''),
              description: item.description ? String(item.description) : undefined,
              imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
              priceCents: item.priceCents ? Number(item.priceCents) : undefined,
              currency: item.currency ? String(item.currency) : 'KRW',
              isActive: item.isActive !== false,
            }))
            .filter((item) => item.id && item.name && item.isActive !== false)
        : [];

      const data = normalized.length > 0 ? normalized : this.fallback;
      this.cache = { expiresAt: Date.now() + 60_000, data };
      return data;
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        this.logger.warn(`Failed to load gifts configuration: ${error?.message ?? error}`);
      }
      this.cache = { expiresAt: Date.now() + 60_000, data: this.fallback };
      return this.fallback;
    }
  }
}
