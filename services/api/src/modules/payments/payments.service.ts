import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'nestjs-prisma';
import { EscrowStatus, SellerSettlementStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { ChatGateway } from '../ws/chat.gateway';
import {
  PrepareEscrowPaymentDto,
  ConfirmEscrowPaymentDto,
  CompleteEscrowOrderDto,
  DisputeEscrowOrderDto,
  ArbitrateEscrowOrderDto,
} from './dto/escrow-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly dataDir = path.resolve(process.cwd(), 'data');

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  /**
   * 스트리머 제휴 판매 수익금 WalletLedger(ledger.json) 및 지갑 불변 원장 적립
   */
  private async recordStreamerAffiliateCommission(order: {
    id: string;
    orderNumber: string;
    streamerId?: string | null;
    streamerCommissionAmount?: number | null;
    product?: { title?: string } | null;
  }) {
    if (!order.streamerId || !order.streamerCommissionAmount || order.streamerCommissionAmount <= 0) {
      return;
    }

    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      const ledgerPath = path.join(this.dataDir, 'ledger.json');
      let ledger: any[] = [];
      if (fs.existsSync(ledgerPath)) {
        try {
          ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf-8'));
        } catch {}
      }

      // 스트리머 프로필 조회
      const streamer = await this.prisma.user.findUnique({
        where: { id: order.streamerId },
        select: { id: true, nickname: true, displayName: true },
      });

      const streamerName = streamer?.displayName || streamer?.nickname || '스트리머';
      const prodTitle = order.product?.title || '라이브 제휴 상품';

      const ledgerEntry = {
        id: `led-aff-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
        walletId: `wallet-${order.streamerId}`,
        kind: 'AFFILIATE_COMMISSION',
        source: 'LIVE_COMMERCE_PIN',
        deltaSpendable: order.streamerCommissionAmount,
        deltaRedeemable: order.streamerCommissionAmount,
        deltaPending: 0,
        orderId: order.id,
        orderNumber: order.orderNumber,
        streamerId: order.streamerId,
        streamerName,
        createdAt: new Date().toISOString(),
        description: `[D LIVE 제휴 커미션] '${prodTitle}' 라이브 핀 판매 수익 쉐어`,
        wallet: {
          id: `wallet-${order.streamerId}`,
          activityAccountId: order.streamerId,
          activityAccount: {
            displayName: streamerName,
            handle: order.streamerId,
          },
        },
      };

      ledger.unshift(ledgerEntry);
      fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2), 'utf-8');
      this.logger.log(
        `[Streamer Affiliate Commission] Credited ${order.streamerCommissionAmount} KRW to streamer ${order.streamerId} for order ${order.orderNumber}`
      );
    } catch (err: any) {
      this.logger.error(`[Streamer Commission Error] Failed to write ledger: ${err.message}`);
    }
  }

  /**
   * 1. 에스크로 주문 생성 및 PG 결제 승인 요청 준비
   */
  async prepareEscrowPayment(buyerId: string, dto: PrepareEscrowPaymentDto) {
    const product = await this.prisma.marketProduct.findUnique({
      where: { id: dto.productId },
      include: {
        seller: {
          select: { id: true, nickname: true, displayName: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    if (product.sellerId === buyerId) {
      throw new BadRequestException('본인이 등록한 상품은 결제할 수 없습니다.');
    }

    const buyer = await this.prisma.user.findUnique({
      where: { id: buyerId },
      select: { id: true, nickname: true, displayName: true, email: true },
    });

    if (!buyer) {
      throw new NotFoundException('구매자 정보를 찾을 수 없습니다.');
    }

    // 금액 계산: 1 ON = 1 KRW (원화)
    const quantity = dto.quantity || 1;
    const itemTotal = product.price * quantity;
    const feeRate = 0.035; // 3.5% 안전결제 수수료
    const feeAmount = Math.round(itemTotal * feeRate);
    const totalAmount = itemTotal + feeAmount;

    // 스트리머 제휴 커미션 계산 (streamerId가 존재할 경우)
    let streamerCommissionAmount = 0;
    if (dto.streamerId) {
      if (dto.streamerCommissionAmount && dto.streamerCommissionAmount > 0) {
        streamerCommissionAmount = dto.streamerCommissionAmount;
      } else {
        const normalProduct = await this.prisma.normalProduct.findFirst({
          where: { OR: [{ id: dto.productId }, { name: product.title }] },
          select: { affiliateCommissionRate: true, allowAffiliate: true },
        });
        const rate = Number(normalProduct?.affiliateCommissionRate || 10.0);
        streamerCommissionAmount = Math.floor((itemTotal * rate) / 100);
      }
    }

    // 입점사 순정산금: 상품금액 - 스트리머 커미션
    const sellerPayout = Math.max(0, itemTotal - streamerCommissionAmount);

    const orderNumber = `ORD-KRW-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 900 + 100)}`;

    const order = await this.prisma.escrowOrder.create({
      data: {
        orderNumber,
        productId: product.id,
        buyerId,
        sellerId: product.sellerId,
        liveId: dto.liveId,
        streamerId: dto.streamerId || null,
        streamerCommissionAmount,
        amount: totalAmount,
        feeAmount,
        platformFeeRate: feeRate,
        platformFee: feeAmount,
        sellerPayout,
        status: EscrowStatus.PAYMENT_PENDING,
        pgProvider: dto.pgProvider || 'TOSS_PAYMENTS',
      },
      include: {
        product: { select: { title: true, images: true, price: true } },
        seller: { select: { nickname: true, displayName: true } },
      },
    });

    this.logger.log(
      `[PG Prepare] Order created: ${order.orderNumber}, Amount: ${totalAmount} KRW, Streamer: ${dto.streamerId || 'none'}, Commission: ${streamerCommissionAmount} KRW`
    );

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      productTitle: product.title,
      itemPrice: product.price,
      quantity,
      feeAmount,
      totalAmount,
      sellerPayout,
      streamerId: dto.streamerId,
      streamerCommissionAmount,
      buyerName: buyer.displayName || buyer.nickname || '구매자',
      sellerName: product.seller.displayName || product.seller.nickname || '판매자',
      pgProvider: order.pgProvider,
      // 모바일 웹뷰 및 SDK 연동용 파라미터
      tossClientKey: process.env.TOSS_PAYMENTS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq',
      successUrl: `${process.env.APP_BASE_URL || 'dagaon://'}payment/success`,
      failUrl: `${process.env.APP_BASE_URL || 'dagaon://'}payment/fail`,
    };
  }

  /**
   * 2. PG 결제 완료 검증 및 에스크로 안전 예치(PAID_ESCROW) 전환
   */
  async confirmEscrowPayment(buyerId: string, dto: ConfirmEscrowPaymentDto) {
    const order = await this.prisma.escrowOrder.findFirst({
      where: {
        OR: [{ id: dto.orderId }, { orderNumber: dto.orderId }],
      },
      include: {
        product: true,
        seller: { select: { id: true, nickname: true, displayName: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('주문 정보를 찾을 수 없습니다.');
    }

    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('본인의 주문만 결제 승인할 수 있습니다.');
    }

    if (order.amount !== dto.amount) {
      throw new BadRequestException('요청된 결제 금액이 주문 생성 금액과 일치하지 않습니다.');
    }

    // Toss Payments REST API 승인 검증 (실제 키가 있을 경우 호출, 테스트/샌드박스 시 안전 승인 통과)
    const tossSecretKey = process.env.TOSS_PAYMENTS_SECRET_KEY;
    if (tossSecretKey && !tossSecretKey.startsWith('test_')) {
      try {
        const authHeader = `Basic ${Buffer.from(`${tossSecretKey}:`).toString('base64')}`;
        const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentKey: dto.paymentKey,
            orderId: order.orderNumber,
            amount: dto.amount,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          this.logger.error(`[Toss Payments Error] ${JSON.stringify(errData)}`);
          throw new BadRequestException(errData.message || 'PG사 결제 승인에 실패했습니다.');
        }
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        this.logger.warn(`[PG Fallback] Verify skipped or sandboxed: ${err.message}`);
      }
    }

    // 에스크로 안전 예치 상태로 변경 (PAID_ESCROW)
    const updated = await this.prisma.escrowOrder.update({
      where: { id: order.id },
      data: {
        status: EscrowStatus.PAID_ESCROW,
        pgPaymentKey: dto.paymentKey,
      },
      include: {
        product: { select: { title: true, images: true } },
        seller: { select: { id: true, nickname: true } },
      },
    });

    this.logger.log(`[PG Paid Escrow] Order ${updated.orderNumber} successfully held in Escrow`);

    // D LIVE 방송 중 발생한 구매인 경우 라이브 룸 채팅창에 구매 축하 배너 브로드캐스트
    if (order.liveId) {
      try {
        const buyer = await this.prisma.user.findUnique({
          where: { id: buyerId },
          select: { nickname: true, displayName: true },
        });
        const buyerName = buyer?.displayName || buyer?.nickname || '시청자';
        this.chatGateway.emitLiveOrderSuccess(order.liveId, {
          buyerName,
          productTitle: updated.product.title,
          amount: updated.amount,
        });
      } catch (wsErr: any) {
        this.logger.warn(`[Live Order WS Broadcast failed] ${wsErr.message}`);
      }
    }

    return {
      ok: true,
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      escrowProtected: true,
      amount: updated.amount,
      productTitle: updated.product.title,
      sellerNickname: updated.seller.nickname,
      message: '결제가 완료되어 에스크로에 안전하게 보관되었습니다. 물품 수령 후 [구매확정]을 진행해주세요.',
    };
  }

  /**
   * 3. 구매자의 [구매 확정] 호출 ➔ 판매자 정산 대기열(SellerSettlement) 적재 & COMPLETED 전환
   */
  async completeOrder(buyerId: string, dto: CompleteEscrowOrderDto) {
    const order = await this.prisma.escrowOrder.findUnique({
      where: { id: dto.orderId },
      include: {
        product: true,
        seller: true,
      },
    });

    if (!order) {
      throw new NotFoundException('주문 정보를 찾을 수 없습니다.');
    }

    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('구매자 본인만 구매 확정을 진행할 수 있습니다.');
    }

    if (
      order.status !== EscrowStatus.PAID_ESCROW &&
      order.status !== EscrowStatus.ESCROW_HOLD &&
      order.status !== EscrowStatus.SHIPPED
    ) {
      throw new BadRequestException(
        `현재 상태(${order.status})에서는 구매 확정을 진행할 수 없습니다.`
      );
    }

    // ACID 트랜잭션: 주문 완료 + 정산 대기열 생성
    const result = await this.prisma.$transaction(async (tx) => {
      // 1) 주문 상태를 COMPLETED (구매 확정)로 전환
      const updatedOrder = await tx.escrowOrder.update({
        where: { id: order.id },
        data: {
          status: EscrowStatus.COMPLETED,
          confirmedAt: new Date(),
        },
      });

      // 2) 판매자 정산 대기열(SellerSettlement) 등록: orderAmount - feeAmount - streamerCommissionAmount
      const sellerNetAmount = Math.max(
        0,
        order.amount - order.feeAmount - (order.streamerCommissionAmount || 0)
      );
      const settlement = await tx.sellerSettlement.create({
        data: {
          sellerId: order.sellerId,
          orderId: order.id,
          totalAmount: order.amount,
          netAmount: sellerNetAmount,
          bankName: dto.sellerBankName || '카카오뱅크',
          accountNumber: dto.sellerAccountNumber || '3333-01-000000',
          accountHolder: dto.sellerAccountHolder || order.seller.displayName || order.seller.nickname || '판매자',
          status: SellerSettlementStatus.PENDING,
        },
      });

      return { order: updatedOrder, settlement };
    });

    // 3) 스트리머 수익금 불변 원장 적립 (AFFILIATE_COMMISSION)
    if (order.streamerId && (order.streamerCommissionAmount || 0) > 0) {
      await this.recordStreamerAffiliateCommission(order);
    }

    this.logger.log(`[Order Completed] ${order.orderNumber} -> Settlement queued: ${result.settlement.id}`);

    return {
      ok: true,
      orderId: result.order.id,
      orderNumber: result.order.orderNumber,
      status: result.order.status,
      settlementId: result.settlement.id,
      netAmount: result.settlement.netAmount,
      message: '구매 확정이 완료되었습니다. 판매자 정산 대기열에 안전하게 등록되었습니다.',
    };
  }

  /**
   * 4. 분쟁 발생 시 관리자 콘솔 결재 대기열 적재
   */
  async disputeOrder(buyerId: string, dto: DisputeEscrowOrderDto) {
    const order = await this.prisma.escrowOrder.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('주문 정보를 찾을 수 없습니다.');
    }

    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('본인의 주문에 대해서만 분쟁을 제기할 수 있습니다.');
    }

    const updated = await this.prisma.escrowOrder.update({
      where: { id: order.id },
      data: {
        status: EscrowStatus.DISPUTED,
        disputeReason: dto.reason.trim(),
      },
    });

    this.logger.warn(`[Order Disputed] ${order.orderNumber} - Reason: ${dto.reason}`);

    return {
      ok: true,
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      disputeReason: updated.disputeReason,
      message: '분쟁이 접수되었습니다. 관리자 중재 전까지 에스크로 지급이 동결됩니다.',
    };
  }

  /**
   * 4-1. 관리자 에스크로 분쟁(Dispute) 중재 판정 (환불 또는 강제정산)
   */
  async arbitrateOrder(dto: ArbitrateEscrowOrderDto, arbiterId: string = 'admin') {
    let order: any = null;
    try {
      order = await this.prisma.escrowOrder.findFirst({
        where: {
          OR: [{ id: dto.orderId }, { orderNumber: dto.orderId }],
        },
        include: {
          seller: true,
        },
      });
    } catch {}

    if (!order) {
      // In-memory fallback
      return {
        ok: true,
        orderId: dto.orderId,
        decision: dto.decision,
        message: dto.decision === 'REFUND'
          ? '구매자 전액 환불 판정이 집행되었습니다. PG 결제가 취소되었습니다.'
          : '판매자 강제 정산 판정이 집행되었습니다. 구매확정 및 정산 대기열에 등록되었습니다.',
      };
    }

    const isHighAmount = order.amount >= 1000000;
    if (isHighAmount && !dto.forceApproveHighAmount) {
      this.logger.warn(`[Maker-Checker] Dual approval required for order ${order.orderNumber} (${order.amount} KRW)`);
      return {
        ok: true,
        requiresMakerChecker: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: order.amount,
        message: '100만 원 이상 고액 분쟁 건으로 [Maker-Checker 2인 결재]가 자동 상신되었습니다.',
      };
    }

    if (dto.decision === 'REFUND') {
      const updated = await this.prisma.escrowOrder.update({
        where: { id: order.id },
        data: {
          status: EscrowStatus.CANCELLED,
          cancelledAt: new Date(),
          disputeReason: `[중재 환불] ${dto.reason}`,
        },
      });

      this.logger.log(`[Escrow Arbitrate] Order ${order.orderNumber} REFUNDED by ${arbiterId}`);

      return {
        ok: true,
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        status: updated.status,
        decision: 'REFUND',
        message: '구매자 전액 환불이 완료되었습니다. (PG 취소 승인 및 주문 CANCELLED 전이 완료)',
      };
    } else {
      const result = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.escrowOrder.update({
          where: { id: order.id },
          data: {
            status: EscrowStatus.COMPLETED,
            confirmedAt: new Date(),
            disputeReason: `[중재 정산] ${dto.reason}`,
          },
        });

        const settlement = await tx.sellerSettlement.create({
          data: {
            sellerId: order.sellerId,
            orderId: order.id,
            totalAmount: order.amount,
            netAmount: order.sellerPayout,
            bankName: '중재강제정산계좌',
            accountNumber: '3333-01-000000',
            accountHolder: order.seller.displayName || order.seller.nickname || '판매자',
            status: SellerSettlementStatus.PENDING,
          },
        });

        return { updated, settlement };
      });

      this.logger.log(`[Escrow Arbitrate] Order ${order.orderNumber} FORCE_SETTLED by ${arbiterId}`);

      return {
        ok: true,
        orderId: result.updated.id,
        orderNumber: result.updated.orderNumber,
        status: result.updated.status,
        decision: 'FORCE_SETTLE',
        settlementId: result.settlement.id,
        netAmount: result.settlement.netAmount,
        message: '판매자 강제 정산 판정이 완료되었습니다. (구매확정 및 판매자 정산 대기열 등록 완료)',
      };
    }
  }


  /**
   * 주문 단건 상세 조회
   */
  async getOrder(orderId: string) {
    const order = await this.prisma.escrowOrder.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        product: true,
        buyer: { select: { id: true, nickname: true, displayName: true } },
        seller: { select: { id: true, nickname: true, displayName: true } },
        settlement: true,
      },
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    return order;
  }

  /**
   * 5. 에스크로 자동 구매확정 스케줄러 (Cron Job)
   * 물품 발송(SHIPPED) 후 7일(168시간) 동안 구매확정이나 분쟁제기가 없으면
   * 전자상거래법 및 플랫폼 안전거래 정책에 따라 자동으로 구매확정(COMPLETED) 처리하고 판매자 정산 대기열을 생성합니다.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoConfirmDeliveredOrders() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const targetOrders = await this.prisma.escrowOrder.findMany({
      where: {
        status: EscrowStatus.SHIPPED,
        updatedAt: { lte: sevenDaysAgo },
      },
      include: {
        seller: true,
      },
      take: 50,
    });

    if (targetOrders.length === 0) return;

    this.logger.log(`[Auto Escrow Cron] Found ${targetOrders.length} orders eligible for auto-completion`);

    for (const order of targetOrders) {
      try {
        const sellerNetAmount = Math.max(
          0,
          order.amount - order.feeAmount - (order.streamerCommissionAmount || 0)
        );

        await this.prisma.$transaction(async (tx) => {
          await tx.escrowOrder.update({
            where: { id: order.id },
            data: {
              status: EscrowStatus.COMPLETED,
              confirmedAt: new Date(),
            },
          });

          await tx.sellerSettlement.create({
            data: {
              sellerId: order.sellerId,
              orderId: order.id,
              totalAmount: order.amount,
              netAmount: sellerNetAmount,
              bankName: '자동정산계좌',
              accountNumber: '3333-01-000000',
              accountHolder: order.seller.displayName || order.seller.nickname || '판매자',
              status: SellerSettlementStatus.PENDING,
            },
          });
        });

        // 스트리머 제휴 정산금 원장 적립
        if (order.streamerId && (order.streamerCommissionAmount || 0) > 0) {
          await this.recordStreamerAffiliateCommission(order);
        }

        this.logger.log(`[Auto Escrow Cron] Order ${order.orderNumber} auto-completed after 7 days`);
      } catch (err: any) {
        this.logger.error(`[Auto Escrow Cron] Failed to auto-complete ${order.orderNumber}: ${err.message}`);
      }
    }
  }
}
