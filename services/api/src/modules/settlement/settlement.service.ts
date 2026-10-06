import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { SettlementStatus, StreamerTier } from '@prisma/client';
import { buildDefaultActivityAccountOrderBy } from '../../common/activity-account-selection';
import {
  CreateSettlementRequestDto,
  AdminRejectSettlementDto,
  AdminApproveSettlementDto,
} from './dto/create-settlement-request.dto';

const TAX_RATE = 0.033; // 3.3% 원천징수 세율 (사업소득세 3% + 지방소득세 0.3%)
const MIN_SETTLEMENT_POINTS = 10000;

export const DEFAULT_TIER_EXCHANGE_RATES: Record<StreamerTier, number> = {
  ROOKIE: 60,   // 루키 호스트: 1온당 60원 (60%)
  BEST: 70,     // 베스트 스트리머: 1온당 70원 (70%)
  PARTNER: 80,  // 파트너 스트리머: 1온당 80원 (80%)
};

@Injectable()
export class SettlementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 유저의 활성 활동 계정과 지갑을 찾거나 생성합니다.
   */
  private async getOrCreateUserAccountWithWallet(userId: string) {
    let account = await this.prisma.activityAccount.findFirst({
      where: {
        status: 'active',
        OR: [
          { legacyUserId: userId },
          { owner: { legacyUserId: userId } },
        ],
      },
      orderBy: buildDefaultActivityAccountOrderBy(),
      include: { wallet: true },
    });

    if (!account) {
      // 계정이 없을 경우 User를 기반으로 기본 ActivityAccount 생성
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }

      let owner = await this.prisma.owner.findUnique({
        where: { legacyUserId: userId },
      });
      if (!owner) {
        owner = await this.prisma.owner.create({
          data: { legacyUserId: userId, status: 'active' },
        });
      }

      account = await this.prisma.activityAccount.create({
        data: {
          ownerId: owner.id,
          legacyUserId: userId,
          displayName: user.displayName ?? '크리에이터',
          status: 'active',
          isPrimary: true,
        },
        include: { wallet: true },
      });
    }

    let wallet = account.wallet;
    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          activityAccountId: account.id,
          spendableBalance: 0,
          redeemableBalance: 0,
          pendingEarnings: 0,
          status: 'active',
        },
      });
    }

    return { account, wallet };
  }

  /**
   * 유저의 출금/정산 현황 및 최근 신청 내역 조회
   */
  async getUserOverview(userId: string) {
    const { account, wallet } = await this.getOrCreateUserAccountWithWallet(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { streamerTier: true, customExchangeRate: true },
    });

    const streamerTier: StreamerTier = user?.streamerTier ?? StreamerTier.ROOKIE;
    const exchangeRate = user?.customExchangeRate ?? DEFAULT_TIER_EXCHANGE_RATES[streamerTier] ?? 60;
    const estimatedKrw = Math.round(wallet.redeemableBalance * exchangeRate);

    const requests = await this.prisma.settlementRequest.findMany({
      where: { activityAccountId: account.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      redeemableBalance: wallet.redeemableBalance,
      pendingEarnings: wallet.pendingEarnings,
      spendableBalance: wallet.spendableBalance,
      minSettlementPoints: MIN_SETTLEMENT_POINTS,
      taxRatePercent: 3.3,
      streamerTier,
      exchangeRate,
      estimatedKrw,
      recentRequests: requests,
    };
  }

  /**
   * 유저의 출금 신청 등록
   */
  async createRequest(userId: string, dto: CreateSettlementRequestDto) {
    if (dto.pointsAmount < MIN_SETTLEMENT_POINTS) {
      throw new BadRequestException(`최소 출금 신청 수량은 ${MIN_SETTLEMENT_POINTS.toLocaleString()} 온(ON)입니다.`);
    }

    const { account, wallet } = await this.getOrCreateUserAccountWithWallet(userId);

    if (wallet.redeemableBalance < dto.pointsAmount) {
      throw new BadRequestException(
        `출금 가능한 온(ON)이 부족합니다. (현재 보유: ${wallet.redeemableBalance.toLocaleString()} 온, 신청: ${dto.pointsAmount.toLocaleString()} 온)`
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { streamerTier: true, customExchangeRate: true },
    });

    const streamerTier: StreamerTier = user?.streamerTier ?? StreamerTier.ROOKIE;
    const exchangeRate = user?.customExchangeRate ?? DEFAULT_TIER_EXCHANGE_RATES[streamerTier] ?? 60;

    const pointsAmount = dto.pointsAmount;
    const krwAmount = pointsAmount * exchangeRate;
    const taxAmount = Math.round(krwAmount * TAX_RATE);
    const netAmount = krwAmount - taxAmount;
    const platformFeeKrw = Math.max(0, (pointsAmount * 100) - krwAmount);

    return this.prisma.$transaction(async (tx) => {
      // 1. 출금 신청 레코드 생성
      const request = await tx.settlementRequest.create({
        data: {
          activityAccountId: account.id,
          pointsAmount,
          exchangeRate,
          tier: streamerTier,
          krwAmount,
          taxAmount,
          netAmount,
          platformFeeKrw,
          bankName: dto.bankName.trim(),
          accountNumber: dto.accountNumber.trim(),
          accountHolder: dto.accountHolder.trim(),
          idCardNumberHash: dto.idCardNumberHash ?? null,
          status: SettlementStatus.PENDING,
        },
      });

      // 2. 지갑 잔액 업데이트 (출금가능 잔액 차감 -> 정산대기 잔액 가산)
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          redeemableBalance: { decrement: pointsAmount },
          pendingEarnings: { increment: pointsAmount },
        },
      });

      // 3. 지갑 금융 원장 기록
      await tx.walletLedgerEntry.create({
        data: {
          walletId: wallet.id,
          kind: 'debit',
          source: 'settlement_request',
          deltaSpendable: 0,
          deltaRedeemable: -pointsAmount,
          deltaPending: pointsAmount,
          spendableAfter: updatedWallet.spendableBalance,
          redeemableAfter: updatedWallet.redeemableBalance,
          pendingAfter: updatedWallet.pendingEarnings,
          idempotencyKey: `settle:req:${request.id}`,
          referenceType: 'settlement_request',
          referenceId: request.id,
          metadata: {
            bankName: dto.bankName,
            accountHolder: dto.accountHolder,
            pointsAmount,
            netAmount,
            taxAmount,
          },
        },
      });

      return request;
    });
  }

  /**
   * 관리자: 출금 신청 목록 조회 (페이징, 상태 필터, 검색)
   */
  async adminListRequests(query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 15));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status && query.status !== 'all') {
      where.status = query.status.toUpperCase() as SettlementStatus;
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { accountHolder: { contains: s, mode: 'insensitive' } },
        { bankName: { contains: s, mode: 'insensitive' } },
        { accountNumber: { contains: s } },
        { activityAccount: { displayName: { contains: s, mode: 'insensitive' } } },
        { activityAccount: { handle: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.settlementRequest.count({ where }),
      this.prisma.settlementRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          activityAccount: {
            select: {
              id: true,
              displayName: true,
              handle: true,
              ownerId: true,
              legacyUserId: true,
              owner: {
                select: {
                  legacyUser: {
                    select: {
                      id: true,
                      email: true,
                      displayName: true,
                      streamerTier: true,
                      customExchangeRate: true,
                    },
                  },
                },
              },
            },
          },
          processedBy: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      ok: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      items,
    };
  }

  /**
   * 관리자: 출금 신청 승인 (송금 완료 처리 및 pendingEarnings 소진)
   */
  async adminApproveRequest(
    adminUserId: string,
    requestId: string,
    dto: AdminApproveSettlementDto,
  ) {
    const request = await this.prisma.settlementRequest.findUnique({
      where: { id: requestId },
      include: {
        activityAccount: {
          include: { wallet: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('해당 출금 신청 내역을 찾을 수 없습니다.');
    }

    if (request.status !== SettlementStatus.PENDING) {
      throw new BadRequestException('이미 처리되었거나 대기 중이 아닌 요청입니다.');
    }

    const wallet = request.activityAccount.wallet;
    if (!wallet) {
      throw new NotFoundException('신청자의 지갑 정보가 존재하지 않습니다.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. 대기 잔액 차감
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          pendingEarnings: { decrement: request.pointsAmount },
        },
      });

      // 2. 금융 원장 기록
      await tx.walletLedgerEntry.create({
        data: {
          walletId: wallet.id,
          kind: 'debit',
          source: 'settlement_approved',
          deltaSpendable: 0,
          deltaRedeemable: 0,
          deltaPending: -request.pointsAmount,
          spendableAfter: updatedWallet.spendableBalance,
          redeemableAfter: updatedWallet.redeemableBalance,
          pendingAfter: updatedWallet.pendingEarnings,
          idempotencyKey: `settle:appr:${request.id}`,
          referenceType: 'settlement_request',
          referenceId: request.id,
          metadata: {
            approvedBy: adminUserId,
            adminMemo: dto.adminMemo ?? '정산 송금 승인 완료',
          },
        },
      });

      // 3. 신청서 상태 변경
      const updatedRequest = await tx.settlementRequest.update({
        where: { id: requestId },
        data: {
          status: SettlementStatus.APPROVED,
          processedAt: new Date(),
          processedById: adminUserId,
          adminMemo: dto.adminMemo ?? '정산 송금 승인 완료',
        },
      });

      // 4. 감사 로그 기록
      await tx.auditLog.create({
        data: {
          actorId: adminUserId,
          target: `settlement:${requestId}`,
          action: 'SETTLEMENT_REQUEST_APPROVED',
          reason: dto.adminMemo ?? '출금 승인 및 송금 완료',
          context: {
            pointsAmount: request.pointsAmount,
            netAmount: request.netAmount,
            bankName: request.bankName,
            accountHolder: request.accountHolder,
          },
        },
      });

      return updatedRequest;
    });
  }

  /**
   * 관리자: 출금 신청 반려 (사유 기재 및 포인트를 출금 가능 잔액으로 원복)
   */
  async adminRejectRequest(
    adminUserId: string,
    requestId: string,
    dto: AdminRejectSettlementDto,
  ) {
    const request = await this.prisma.settlementRequest.findUnique({
      where: { id: requestId },
      include: {
        activityAccount: {
          include: { wallet: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('해당 출금 신청 내역을 찾을 수 없습니다.');
    }

    if (request.status !== SettlementStatus.PENDING) {
      throw new BadRequestException('이미 처리되었거나 대기 중이 아닌 요청입니다.');
    }

    const wallet = request.activityAccount.wallet;
    if (!wallet) {
      throw new NotFoundException('신청자의 지갑 정보가 존재하지 않습니다.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. 대기 잔액 차감 -> 출금 가능 잔액으로 복구
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          pendingEarnings: { decrement: request.pointsAmount },
          redeemableBalance: { increment: request.pointsAmount },
        },
      });

      // 2. 금융 원장에 환원 내역 기록
      await tx.walletLedgerEntry.create({
        data: {
          walletId: wallet.id,
          kind: 'credit',
          source: 'settlement_rejected_refund',
          deltaSpendable: 0,
          deltaRedeemable: request.pointsAmount,
          deltaPending: -request.pointsAmount,
          spendableAfter: updatedWallet.spendableBalance,
          redeemableAfter: updatedWallet.redeemableBalance,
          pendingAfter: updatedWallet.pendingEarnings,
          idempotencyKey: `settle:rej:${request.id}`,
          referenceType: 'settlement_request',
          referenceId: request.id,
          metadata: {
            rejectedBy: adminUserId,
            reason: dto.reason,
          },
        },
      });

      // 3. 신청서 상태 변경
      const updatedRequest = await tx.settlementRequest.update({
        where: { id: requestId },
        data: {
          status: SettlementStatus.REJECTED,
          processedAt: new Date(),
          processedById: adminUserId,
          adminMemo: dto.reason,
        },
      });

      // 4. 감사 로그 기록
      await tx.auditLog.create({
        data: {
          actorId: adminUserId,
          target: `settlement:${requestId}`,
          action: 'SETTLEMENT_REQUEST_REJECTED',
          reason: dto.reason,
          context: {
            pointsAmount: request.pointsAmount,
            bankName: request.bankName,
            accountHolder: request.accountHolder,
          },
        },
      });

      return updatedRequest;
    });
  }
}
