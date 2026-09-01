import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'nestjs-prisma';
import { promises as fs } from 'fs';
import { join } from 'path';
import { ConfirmPurchaseDto } from './dto/confirm-purchase.dto';

export type PointProduct = {
  id: string;
  productId: string;
  label: string;
  priceText: string;
  points: number;
  recommended?: boolean;
  currency?: string;
};

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  private productsCache?: { expiresAt: number; items: PointProduct[] };

  private readonly fallbackProducts: PointProduct[] = [
    {
      id: 'pkg300',
      productId: 'com.company.points.300',
      label: '300P',
      priceText: '₩5,900',
      points: 300,
      recommended: false,
      currency: 'KRW',
    },
    {
      id: 'pkg1000',
      productId: 'com.company.points.1000',
      label: '1,000P',
      priceText: '₩17,900',
      points: 1000,
      recommended: true,
      currency: 'KRW',
    },
  ];

  async listPointProducts(): Promise<PointProduct[]> {
    if (this.productsCache && this.productsCache.expiresAt > Date.now()) {
      return this.productsCache.items;
    }

    const configPath = process.env.POINT_PRODUCTS_PATH ?? join(process.cwd(), 'store_assets', 'point-products.json');

    try {
      const raw = await fs.readFile(configPath, 'utf8');
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed.items)
        ? parsed.items
        : Array.isArray(parsed)
        ? parsed
        : [];

      const normalized = items
        .map((item: any) => ({
          id: String(item.id ?? item.productId ?? ''),
          productId: String(item.productId ?? item.id ?? ''),
          label: String(item.label ?? item.title ?? ''),
          priceText: String(item.priceText ?? item.price ?? ''),
          points: Number(item.points ?? item.amount ?? 0),
          recommended: item.recommended === true,
          currency: item.currency ? String(item.currency) : undefined,
        }))
        .filter((item) => item.id && item.productId && item.label && item.priceText && item.points > 0);

      const result = normalized.length ? normalized : this.fallbackProducts;
      this.productsCache = { expiresAt: Date.now() + 60_000, items: result };
      return result;
    } catch (error: any) {
      this.productsCache = { expiresAt: Date.now() + 60_000, items: this.fallbackProducts };
      return this.fallbackProducts;
    }
  }

  private async findProduct(productId: string) {
    const items = await this.listPointProducts();
    return items.find(
      (item) => item.productId === productId || item.id === productId,
    );
  }

  private validateReceipt(dto: ConfirmPurchaseDto) {
    if (!dto.receipt || dto.receipt.trim().length < 10) {
      throw new BadRequestException('Invalid receipt payload');
    }
  }

  async confirmPointPurchase(userId: string, dto: ConfirmPurchaseDto) {
    if (!userId) {
      throw new BadRequestException('Missing authenticated user');
    }

    const product = await this.findProduct(dto.productId);
    if (!product) {
      throw new BadRequestException('Unknown product');
    }

    this.validateReceipt(dto);

    const uniqueKey = {
      platform: dto.platform,
      transactionId: dto.transactionId,
    } as const;

    const existing = await this.prisma.pointPurchase.findUnique({
      where: { platform_transactionId: uniqueKey },
    });

    if (existing) {
      if (existing.userId !== userId) {
        throw new ConflictException('Purchase already processed for another account');
      }
      const balance = await this.getUserBalance(userId);
      return { success: true, balance };
    }

    try {
      const balance = await this.prisma.$transaction(async (tx) => {
        await tx.pointPurchase.create({
          data: {
            userId,
            productId: product.productId,
            transactionId: dto.transactionId,
            platform: dto.platform,
            receipt: dto.receipt,
            points: product.points,
            status: 'completed',
          },
        });

        const updated = await tx.user.update({
          where: { id: userId },
          data: { pointsBalance: { increment: product.points } },
          select: { pointsBalance: true },
        });

        return updated.pointsBalance;
      });

      return { success: true, balance };
    } catch (error: any) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        const balance = await this.getUserBalance(userId);
        return { success: true, balance };
      }
      throw error;
    }
  }

  private async getUserBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pointsBalance: true },
    });
    return user?.pointsBalance ?? 0;
  }
}
