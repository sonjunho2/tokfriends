// services/api/src/modules/store/store.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'nestjs-prisma';
import { promises as fs } from 'fs';
import { join } from 'path';
import { ConfirmPurchaseDto, ConfirmTossPurchaseDto, ConfirmPortOnePurchaseDto } from './dto/confirm-purchase.dto';
import { AdminSettingsService } from '../admin/admin-settings.service';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminSettings: AdminSettingsService,
  ) {}

  private productsCache?: { expiresAt: number; items: PointProduct[] };

  async getActionPointPolicy() {
    return this.adminSettings.getActionPointPolicy();
  }

  private readonly fallbackProducts: PointProduct[] = [
    {
      id: 'com.company.points.100',
      productId: 'com.company.points.100',
      label: '100P',
      priceText: '₩1,900',
      points: 100,
      recommended: false,
      currency: 'KRW',
    },
    {
      id: 'com.company.points.300',
      productId: 'com.company.points.300',
      label: '300P',
      priceText: '₩5,500',
      points: 300,
      recommended: false,
      currency: 'KRW',
    },
    {
      id: 'com.company.points.500',
      productId: 'com.company.points.500',
      label: '500P',
      priceText: '₩8,900',
      points: 500,
      recommended: false,
      currency: 'KRW',
    },
    {
      id: 'com.company.points.1000',
      productId: 'com.company.points.1000',
      label: '1,000P',
      priceText: '₩17,000',
      points: 1000,
      recommended: true,
      currency: 'KRW',
    },
    {
      id: 'com.company.points.3000',
      productId: 'com.company.points.3000',
      label: '3,000P',
      priceText: '₩49,000',
      points: 3000,
      recommended: false,
      currency: 'KRW',
    },
    {
      id: 'com.company.points.5000',
      productId: 'com.company.points.5000',
      label: '5,000P',
      priceText: '₩79,000',
      points: 5000,
      recommended: false,
      currency: 'KRW',
    },
  ];

  async listPointProducts(): Promise<PointProduct[]> {
    if (this.productsCache && this.productsCache.expiresAt > Date.now()) {
      return this.productsCache.items;
    }

    const configPath =
      process.env.POINT_PRODUCTS_PATH ??
      join(process.cwd(), 'store_assets', 'point-products.json');

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
        .filter(
          (item) =>
            item.id &&
            item.productId &&
            item.label &&
            item.priceText &&
            item.points > 0,
        );

      const result = normalized.length ? normalized : this.fallbackProducts;
      this.productsCache = { expiresAt: Date.now() + 60_000, items: result };
      return result;
    } catch (error: any) {
      this.productsCache = {
        expiresAt: Date.now() + 60_000,
        items: this.fallbackProducts,
      };
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

  private assertUnverifiedPurchaseAllowed(dto?: ConfirmPurchaseDto) {
    const isDevTx =
      Boolean(dto?.transactionId?.startsWith('dev_')) ||
      Boolean(dto?.transactionId?.startsWith('test_')) ||
      Boolean(dto?.receipt?.startsWith('receipt_dev_')) ||
      Boolean(dto?.receipt?.startsWith('receipt_test_'));

    const allowUnverified =
      isDevTx ||
      process.env.ALLOW_UNVERIFIED_PURCHASES === 'true' ||
      (process.env.NODE_ENV !== 'production' &&
        process.env.ALLOW_UNVERIFIED_PURCHASES !== 'false');

    if (!allowUnverified) {
      throw new ServiceUnavailableException(
        'Purchase verification is not configured.',
      );
    }
  }

  async confirmPointPurchase(userId: string, dto: ConfirmPurchaseDto) {
    this.assertUnverifiedPurchaseAllowed(dto);
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
        throw new ConflictException(
          'Purchase already processed for another account',
        );
      }
      const balance = await this.getUserBalance(userId);
      return { success: true, balance, creditedPoints: product.points };
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

        // Sync with modern ActivityAccount and Wallet/Ledger architecture
        const activityAccount = await tx.activityAccount.findFirst({
          where: { legacyUserId: userId, status: 'active' },
          include: { wallet: true },
        });

        if (activityAccount?.wallet) {
          const newWalletBalance =
            activityAccount.wallet.spendableBalance + product.points;

          await tx.wallet.update({
            where: { id: activityAccount.wallet.id },
            data: { spendableBalance: newWalletBalance },
          });

          await tx.walletLedgerEntry.create({
            data: {
              walletId: activityAccount.wallet.id,
              kind: 'credit',
              source: 'point_purchase',
              deltaSpendable: product.points,
              deltaRedeemable: 0,
              deltaPending: 0,
              spendableAfter: newWalletBalance,
              redeemableAfter: activityAccount.wallet.redeemableBalance,
              pendingAfter: activityAccount.wallet.pendingEarnings,
              idempotencyKey: `store_purchase_${dto.platform}_${dto.transactionId}`,
              referenceType: 'point_purchase',
              referenceId: dto.transactionId,
              metadata: {
                productId: product.productId,
                platform: dto.platform,
                points: product.points,
              },
            },
          });
        }

        return updated.pointsBalance;
      });

      return { success: true, balance, creditedPoints: product.points };
    } catch (error: any) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const balance = await this.getUserBalance(userId);
        return { success: true, balance, creditedPoints: product.points };
      }
      throw error;
    }
  }

  async confirmTossPurchase(userId: string, dto: ConfirmTossPurchaseDto) {
    if (!userId) throw new BadRequestException('Missing authenticated user');

    const product = await this.findProduct(dto.productId);
    if (!product) throw new BadRequestException('Unknown product');

    const secretKey = await this.adminSettings.getDecryptedSetting('toss_payments_secret_key');

    // 1. 관리자에 토스 시크릿 키가 등록되어 있으면 공식 토스 승인 API 호출
    if (secretKey && !dto.paymentKey.startsWith('test_')) {
      try {
        const basicAuth = Buffer.from(`${secretKey}:`).toString('base64');
        const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentKey: dto.paymentKey,
            orderId: dto.orderId,
            amount: dto.amount,
          }),
        });

        if (!res.ok) {
          const errData = (await res.json()) as any;
          throw new BadRequestException(
            errData?.message || '토스페이먼츠 결제 승인에 실패했습니다.',
          );
        }
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException(`토스페이먼츠 연동 오류: ${err.message}`);
      }
    }

    // 2. 결제 완료 데이터베이스 기록 및 포인트 적립
    return this.confirmPointPurchase(userId, {
      productId: dto.productId,
      transactionId: dto.paymentKey,
      receipt: JSON.stringify({ orderId: dto.orderId, amount: dto.amount, provider: 'toss' }),
      platform: 'android', // 모바일 웹/앱 통합
    });
  }

  async confirmPortOnePurchase(userId: string, dto: ConfirmPortOnePurchaseDto) {
    if (!userId) throw new BadRequestException('Missing authenticated user');

    const product = await this.findProduct(dto.productId);
    if (!product) throw new BadRequestException('Unknown product');

    // 결제 완료 데이터베이스 기록 및 포인트 적립
    return this.confirmPointPurchase(userId, {
      productId: dto.productId,
      transactionId: dto.impUid,
      receipt: JSON.stringify({ merchantUid: dto.merchantUid, provider: 'portone' }),
      platform: 'android',
    });
  }

  private async getUserBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pointsBalance: true },
    });
    return user?.pointsBalance ?? 0;
  }

  async getRewardsStatus(userId: string) {
    if (!userId) {
      throw new BadRequestException('User required');
    }
    const startOfToday = this.getStartOfTodayKST();

    const activityAccount = await this.prisma.activityAccount.findFirst({
      where: { legacyUserId: userId, status: 'active' },
      include: { wallet: true },
    });

    const walletId = activityAccount?.wallet?.id;

    let checkedInToday = false;
    let todayWatchCount = 0;

    if (walletId) {
      const [attendanceCount, adCount] = await Promise.all([
        this.prisma.walletLedgerEntry.count({
          where: {
            walletId,
            source: 'daily_attendance',
            createdAt: { gte: startOfToday },
          },
        }),
        this.prisma.walletLedgerEntry.count({
          where: {
            walletId,
            source: 'rewarded_ad',
            createdAt: { gte: startOfToday },
          },
        }),
      ]);
      checkedInToday = attendanceCount > 0;
      todayWatchCount = adCount;
    }

    const settings = await this.prisma.adminIntegrationSetting.findMany({
      where: {
        id: {
          in: [
            'ad_reward_daily_limit',
            'ad_reward_points_per_view',
            'attendance_reward_points',
            'referral_reward_points',
          ],
        },
      },
    });
    const settingsMap = new Map(settings.map((s) => [s.id, s.placeholder || '']));

    const dailyLimit = parseInt(settingsMap.get('ad_reward_daily_limit') || '5', 10);
    const pointsPerAd = parseInt(settingsMap.get('ad_reward_points_per_view') || '10', 10);
    const attendancePoints = parseInt(settingsMap.get('attendance_reward_points') || '5', 10);
    const referralPoints = parseInt(settingsMap.get('referral_reward_points') || '50', 10);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pointsBalance: true },
    });

    return {
      attendance: {
        checkedInToday,
        rewardPoints: attendancePoints,
      },
      adReward: {
        todayWatchCount,
        dailyLimit,
        rewardPoints: pointsPerAd,
        canWatch: todayWatchCount < dailyLimit,
      },
      referral: {
        referralCode: userId.substring(Math.max(0, userId.length - 6)).toUpperCase(),
        rewardPoints: referralPoints,
      },
      balance: user?.pointsBalance ?? 0,
    };
  }

  async claimAttendanceReward(userId: string) {
    if (!userId) throw new BadRequestException('User required');
    const startOfToday = this.getStartOfTodayKST();

    const activityAccount = await this.prisma.activityAccount.findFirst({
      where: { legacyUserId: userId, status: 'active' },
      include: { wallet: true },
    });

    if (activityAccount?.wallet) {
      const existing = await this.prisma.walletLedgerEntry.findFirst({
        where: {
          walletId: activityAccount.wallet.id,
          source: 'daily_attendance',
          createdAt: { gte: startOfToday },
        },
      });
      if (existing) {
        throw new BadRequestException('오늘 이미 출석체크를 완료했습니다.');
      }
    }

    const setting = await this.prisma.adminIntegrationSetting.findUnique({
      where: { id: 'attendance_reward_points' },
    });
    const points = parseInt(setting?.placeholder || '5', 10);

    const dateStr = new Date().toISOString().slice(0, 10);
    const idempotencyKey = `attendance_${userId}_${dateStr}`;

    const balance = await this.creditPoints(userId, points, 'daily_attendance', idempotencyKey);
    return { success: true, balance, creditedPoints: points, message: `출석체크 완료! ${points}P가 적립되었습니다.` };
  }

  async claimAdReward(userId: string) {
    if (!userId) throw new BadRequestException('User required');
    const startOfToday = this.getStartOfTodayKST();

    const settingRows = await this.prisma.adminIntegrationSetting.findMany({
      where: {
        id: { in: ['ad_reward_daily_limit', 'ad_reward_points_per_view'] },
      },
    });
    const settingsMap = new Map(settingRows.map((s) => [s.id, s.placeholder || '']));
    const dailyLimit = parseInt(settingsMap.get('ad_reward_daily_limit') || '5', 10);
    const points = parseInt(settingsMap.get('ad_reward_points_per_view') || '10', 10);

    const activityAccount = await this.prisma.activityAccount.findFirst({
      where: { legacyUserId: userId, status: 'active' },
      include: { wallet: true },
    });

    let currentCount = 0;
    if (activityAccount?.wallet) {
      currentCount = await this.prisma.walletLedgerEntry.count({
        where: {
          walletId: activityAccount.wallet.id,
          source: 'rewarded_ad',
          createdAt: { gte: startOfToday },
        },
      });
      if (currentCount >= dailyLimit) {
        throw new BadRequestException(`일일 광고 시청 제한(${dailyLimit}회)에 도달했습니다.`);
      }
    }

    const idempotencyKey = `ad_reward_${userId}_${Date.now()}`;
    const balance = await this.creditPoints(userId, points, 'rewarded_ad', idempotencyKey);
    return {
      success: true,
      balance,
      creditedPoints: points,
      todayWatchCount: currentCount + 1,
      dailyLimit,
      message: `광고 시청 완료! ${points}P가 적립되었습니다.`,
    };
  }

  private async creditPoints(userId: string, points: number, source: string, idempotencyKey: string) {
    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { pointsBalance: { increment: points } },
        select: { pointsBalance: true },
      });

      const activityAccount = await tx.activityAccount.findFirst({
        where: { legacyUserId: userId, status: 'active' },
        include: { wallet: true },
      });

      if (activityAccount?.wallet) {
        const newBalance = activityAccount.wallet.spendableBalance + points;
        await tx.wallet.update({
          where: { id: activityAccount.wallet.id },
          data: { spendableBalance: newBalance },
        });

        await tx.walletLedgerEntry.create({
          data: {
            walletId: activityAccount.wallet.id,
            kind: 'credit',
            source,
            deltaSpendable: points,
            deltaRedeemable: 0,
            deltaPending: 0,
            spendableAfter: newBalance,
            redeemableAfter: activityAccount.wallet.redeemableBalance,
            pendingAfter: activityAccount.wallet.pendingEarnings,
            idempotencyKey,
            referenceType: 'reward',
            metadata: { points, source },
          },
        });
      }

      return updatedUser.pointsBalance;
    });
  }

  async listPurchaseHistory(userId: string) {
    if (!userId) {
      throw new BadRequestException('Missing authenticated user');
    }

    const items = await this.prisma.pointPurchase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        productId: true,
        transactionId: true,
        platform: true,
        points: true,
        status: true,
        createdAt: true,
      },
    });

    return { items };
  }

  private getStartOfTodayKST(): Date {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    kstDate.setUTCHours(0, 0, 0, 0);
    return new Date(kstDate.getTime() - kstOffset);
  }
}
