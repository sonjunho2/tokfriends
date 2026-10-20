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
  // Action Points Policy
  // ==========================================
  @Public()
  @Get('store/action-points')
  async getActionPointsPolicy() {
    return {
      chatRoomCreate: { enabled: true, amount: 10 },
      chatRoomJoin: { enabled: false, amount: 0 },
      directMessageRequest: { enabled: true, amount: 5 },
      liveRoomCreate: { enabled: true, amount: 50 },
      liveRoomJoin: { enabled: false, amount: 0 },
    };
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
  @Post(['store/purchase', 'store/confirm-purchase'])
  async confirmPurchase(@CurrentUser() user: any, @Body() body: any) {
    const userId = user?.id || user?.sub;
    const points = Number(body.points || body.pointsAmount || 1000);
    const amount = Number(body.amount || 1100);
    const productId = body.productId || 'point-custom';
    const orderId = body.orderId || `ord-${Date.now()}`;

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
  // Daily Rewards (Attendance & Ads)
  // ==========================================
  @Public()
  @Get('store/rewards/status')
  async getRewardsStatus() {
    return {
      ok: true,
      data: {
        attendanceClaimedToday: false,
        adRewardCountToday: 2,
        maxAdRewardsDaily: 5,
        availableAdRewardsRemaining: 3,
        streakDays: 4,
      },
    };
  }

  @Public()
  @Post('store/rewards/attendance')
  async claimAttendanceReward(@CurrentUser() user?: any) {
    const userId = user?.id || user?.sub;
    const points = 50;
    let balance = 1300;
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
      message: '출석체크 보상 +50 ON이 지급되었습니다! ✨',
    };
  }

  @Public()
  @Post('store/rewards/ad')
  async claimAdReward(@CurrentUser() user?: any) {
    const userId = user?.id || user?.sub;
    const points = 30;
    let balance = 1280;
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
      message: '광고 시청 리워드 +30 ON이 적립되었습니다! 🎬',
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
