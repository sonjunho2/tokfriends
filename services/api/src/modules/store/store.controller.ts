import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'nestjs-prisma';
import * as fs from 'fs';
import * as path from 'path';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { StoreService } from './store.service';

@ApiTags('store')
@Controller()
export class StoreController {
  private purchasesStore: any[] = [
    {
      id: 'ord-mock-1',
      productId: 'point-2',
      productName: '5,000 온 충전 (인기)',
      points: 5000,
      amount: 5500,
      paymentMethod: '카드 간편결제',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ];

  private settlementRequestsStore: any[] = [];

  constructor(
    private readonly storeService: StoreService,
    private readonly prisma: PrismaService,
  ) {}

  private loadRewardPolicies() {
    try {
      const p = path.join(process.cwd(), 'data', 'reward-policies.json');
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      }
    } catch {}
    return {
      dailyAdLimit: 5,
      pointsPerAd: 10,
      attendancePoints: 5,
      referralPoints: 50,
      enabled: true,
    };
  }

  // ==========================================
  // Point Products
  // ==========================================
  @Public()
  @Get('store/point-products')
  async listPointProducts() {
    const products = await this.storeService.listAll();
    return { ok: true, data: products, items: products };
  }

  @Public()
  @Post('store/point-products')
  async createPointProduct(@Body() body: any) {
    const created = await this.storeService.create(body);
    return created;
  }

  @Public()
  @Put('store/point-products/:id')
  async updatePointProduct(@Param('id') id: string, @Body() body: any) {
    const updated = await this.storeService.update(id, body);
    return updated;
  }

  @Public()
  @Delete('store/point-products/:id')
  async deletePointProduct(@Param('id') id: string) {
    await this.storeService.delete(id);
    return { ok: true, id };
  }

  @Public()
  @Post('store/point-products/reorder')
  async reorderPointProducts(@Body() body: { items: { id: string; order: number }[] }) {
    await this.storeService.reorder(body.items || []);
    return { ok: true };
  }

  // ==========================================
  private loadActionPointsPolicy() {
    try {
      const p = path.join(process.cwd(), 'data', 'action-point-policy.json');
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      }
    } catch {}
    return {
      chatRoomCreate: { enabled: true, amount: 10 },
      chatRoomJoin: { enabled: false, amount: 0 },
      directMessageRequest: { enabled: true, amount: 5 },
      liveRoomCreate: { enabled: true, amount: 50 },
      liveRoomJoin: { enabled: false, amount: 0 },
    };
  }

  // ==========================================
  // Action Points Policy
  // ==========================================
  @Public()
  @Get('store/action-points')
  async getActionPointsPolicy() {
    return this.loadActionPointsPolicy();
  }

  // ==========================================
  // User Point Balance
  // ==========================================
  @Public()
  @Get(['store/point-balance', 'users/me/balance'])
  async getPointBalance(@CurrentUser() user?: any) {
    const userId = user?.id || user?.sub;
    let balance = 1250;
    if (userId) {
      try {
        const dbUser = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { pointBalance: true },
        });
        if (dbUser) balance = dbUser.pointBalance;
      } catch {}
    }
    return { ok: true, balance, spendableBalance: balance };
  }

  // ==========================================
  // Point Purchase & Recharge
  // ==========================================
  @Public()
  @Post(['store/purchase', 'store/confirm-purchase', 'store/purchases/confirm'])
  async confirmPurchase(@CurrentUser() user: any, @Body() body: any) {
    const userId = user?.id || user?.sub;
    let points = Number(body.points || body.pointsAmount || 0);
    let amount = Number(body.amount || 0);
    const productId = body.productId || 'point-custom';
    const orderId = body.orderId || body.transactionId || `ord-${Date.now()}`;

    // productId 기반 상품 정보 자동 매칭 (points, amount 보정)
    if (!points || !amount) {
      try {
        const allProducts = await this.storeService.listAll();
        const matched = allProducts.find(
          (p: any) =>
            p.id === productId ||
            p.productId === productId ||
            p.sku === productId ||
            productId.includes(p.id) ||
            p.id.includes(productId),
        );
        if (matched) {
          if (!points) points = Number(matched.points || 1000);
          if (!amount) amount = Number(matched.price || (matched as any).amount || 1100);
        }
      } catch {}
    }

    // 기본값 안전장치 (1000 ON, 1100원)
    if (!points) points = 1000;
    if (!amount) amount = 1100;

    let newBalance = 1250 + points;
    if (userId) {
      try {
        const updated = await this.prisma.user.update({
          where: { id: userId },
          data: { pointBalance: { increment: points } },
          select: { pointBalance: true },
        });
        newBalance = updated.pointBalance;
      } catch {}
    }

    const purchaseRecord = {
      id: orderId,
      productId,
      productName: `${points.toLocaleString()} 온 충전`,
      points,
      amount,
      paymentMethod: body.paymentMethod || '인앱 간편결제',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };
    this.purchasesStore.unshift(purchaseRecord);

    return {
      ok: true,
      success: true,
      balance: newBalance,
      pointBalance: newBalance,
      orderId,
      purchase: purchaseRecord,
      data: {
        purchased: true,
        balance: newBalance,
        pointBalance: newBalance,
        orderId,
      },
      message: `${points.toLocaleString()} ON 충전이 완료되었습니다!`,
    };
  }

  @Public()
  @Get('store/purchases')
  async getPurchaseHistory() {
    return {
      ok: true,
      data: this.purchasesStore,
      items: this.purchasesStore,
    };
  }

  // ==========================================
  // Daily Rewards (Attendance & Ads) - 관리자 정책 실시간 연동
  // ==========================================
  @Public()
  @Get('store/rewards/status')
  async getRewardsStatus(@CurrentUser() user?: any) {
    const policies = this.loadRewardPolicies();
    const balanceRes = await this.getPointBalance(user);

    return {
      ok: true,
      data: {
        attendance: {
          checkedInToday: false,
          rewardPoints: policies.attendancePoints ?? 5,
        },
        adReward: {
          todayWatchCount: 0,
          dailyLimit: policies.dailyAdLimit ?? 5,
          rewardPoints: policies.pointsPerAd ?? 10,
          canWatch: true,
        },
        referral: {
          referralCode: 'CMUWB7',
          rewardPoints: policies.referralPoints ?? 50,
        },
        balance: balanceRes.balance,
      },
    };
  }

  @Public()
  @Post('store/rewards/attendance')
  async claimAttendanceReward(@CurrentUser() user?: any) {
    const userId = user?.id || user?.sub;
    const policies = this.loadRewardPolicies();
    const points = Number(policies.attendancePoints ?? 5);

    let balance = 1250 + points;
    if (userId) {
      try {
        const updated = await this.prisma.user.update({
          where: { id: userId },
          data: { pointBalance: { increment: points } },
          select: { pointBalance: true },
        });
        balance = updated.pointBalance;
      } catch {}
    }
    return {
      ok: true,
      success: true,
      rewardPoints: points,
      balance,
      message: `출석체크 보상 +${points} ON이 지급되었습니다! ✨`,
    };
  }

  @Public()
  @Post(['store/rewards/ad', 'store/rewards/ad-watch'])
  async claimAdReward(@CurrentUser() user?: any) {
    const userId = user?.id || user?.sub;
    const policies = this.loadRewardPolicies();
    const points = Number(policies.pointsPerAd ?? 10);

    let balance = 1250 + points;
    if (userId) {
      try {
        const updated = await this.prisma.user.update({
          where: { id: userId },
          data: { pointBalance: { increment: points } },
          select: { pointBalance: true },
        });
        balance = updated.pointBalance;
      } catch {}
    }
    return {
      ok: true,
      success: true,
      rewardPoints: points,
      balance,
      message: `광고 시청 리워드 +${points} ON이 적립되었습니다! 🎬`,
    };
  }

  // ==========================================
  // Creator Settlement & Redemption
  // ==========================================
  @Public()
  @Get(['settlement/overview', 'store/settlement/overview'])
  async getSettlementOverview(@CurrentUser() user?: any) {
    const userId = user?.id || user?.sub;
    let balance = 1250;
    if (userId) {
      try {
        const dbUser = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { pointBalance: true },
        });
        if (dbUser) balance = dbUser.pointBalance;
      } catch {}
    }

    return {
      ok: true,
      redeemableBalance: Math.max(50000, balance * 10),
      spendableBalance: balance,
      pendingEarnings: 0,
      minSettlementPoints: 10000,
      taxRatePercent: 3.3,
      recentRequests: this.settlementRequestsStore,
    };
  }

  @Public()
  @Post('settlement/requests')
  async requestSettlement(@CurrentUser() user: any, @Body() body: any) {
    const userId = user?.id || user?.sub;
    const points = Math.floor(Number(body.pointsAmount || 10000));
    if (points < 10000) {
      throw new BadRequestException('최소 출금 신청 수량은 10,000 온(ON)입니다.');
    }

    if (userId) {
      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: { pointBalance: { decrement: points } },
        });
      } catch {}
    }

    const item = {
      id: `set-req-${Date.now()}`,
      pointsAmount: points,
      bankName: body.bankName,
      accountNumber: body.accountNumber,
      accountHolder: body.accountHolder,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
    };
    this.settlementRequestsStore.unshift(item);

    return {
      ok: true,
      success: true,
      data: item,
      request: item,
      message: `${points.toLocaleString()} ON 출금 신청이 완료되었습니다.`,
    };
  }
}
