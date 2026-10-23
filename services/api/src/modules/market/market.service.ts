import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { MarketProductType, ProductStatus, EscrowStatus } from '@prisma/client';
import { CreateMarketProductDto, CreateEscrowOrderDto, DisputeOrderDto } from './dto/market.dto';

@Injectable()
export class MarketService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 상품 목록 조회 (필터 및 검색)
   */
  async listProducts(params: {
    type?: MarketProductType;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, category, search, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      status: { in: [ProductStatus.ACTIVE, ProductStatus.RESERVED] },
    };

    if (type) {
      where.type = type;
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { locationName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.marketProduct.count({ where }),
      this.prisma.marketProduct.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 상품 상세 조회
   */
  async getProduct(id: string) {
    const product = await this.prisma.marketProduct.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            bio: true,
            role: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    return product;
  }

  /**
   * 상품 등록
   */
  async createProduct(userId: string, dto: CreateMarketProductDto) {
    return this.prisma.marketProduct.create({
      data: {
        sellerId: userId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        price: dto.price,
        originalPrice: dto.originalPrice,
        targetQuantity: dto.targetQuantity || 1,
        images: dto.images,
        locationName: dto.locationName || '동네 인증 완료',
        latitude: dto.latitude,
        longitude: dto.longitude,
        status: ProductStatus.ACTIVE,
      },
    });
  }

  /**
   * 에스크로 안전결제 주문 생성 (원자적 ACID 트랜잭션)
   * 1 ON = 1 KRW 정책 적용
   */
  async createEscrowOrder(buyerId: string, dto: CreateEscrowOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. 상품 확인
      const product = await tx.marketProduct.findUnique({
        where: { id: dto.productId },
      });

      if (!product) {
        throw new NotFoundException('상품이 존재하지 않습니다.');
      }

      if (product.status !== ProductStatus.ACTIVE) {
        throw new BadRequestException('현재 거래 가능한 상태가 아닙니다.');
      }

      if (product.sellerId === buyerId) {
        throw new BadRequestException('자신이 등록한 물품은 구매할 수 없습니다.');
      }

      // 2. 구매자 포인트 잔액 확인
      const buyer = await tx.user.findUnique({
        where: { id: buyerId },
        select: { id: true, pointBalance: true, nickname: true },
      });

      if (!buyer || buyer.pointBalance < product.price) {
        throw new BadRequestException(
          `포인트가 부족합니다. (필요: ${product.price.toLocaleString()} ON, 보유: ${(buyer?.pointBalance || 0).toLocaleString()} ON)`
        );
      }

      // 3. 수수료 계산 (C2C: 2.5%, B2C: 10%)
      const isC2C = product.type === MarketProductType.C2C_USED;
      const platformFeeRate = isC2C ? 0.025 : 0.1;
      const platformFee = Math.round(product.price * platformFeeRate);
      const sellerPayout = product.price - platformFee;

      // 4. 구매자 포인트 차감 (플랫폼 에스크로 금고로 예치)
      await tx.user.update({
        where: { id: buyerId },
        data: { pointBalance: { decrement: product.price } },
      });

      // 5. 상품 상태 업데이트
      if (isC2C) {
        await tx.marketProduct.update({
          where: { id: product.id },
          data: { status: ProductStatus.RESERVED },
        });
      } else {
        await tx.marketProduct.update({
          where: { id: product.id },
          data: { currentQuantity: { increment: 1 } },
        });
      }

      // 6. 에스크로 주문 생성
      const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const order = await tx.escrowOrder.create({
        data: {
          orderNumber,
          productId: product.id,
          buyerId,
          sellerId: product.sellerId,
          amount: product.price,
          platformFeeRate,
          platformFee,
          sellerPayout,
          status: EscrowStatus.ESCROW_HOLD,
        },
      });

      // 7. 보안 감사 로그 기록
      await tx.auditLog.create({
        data: {
          actorId: buyerId,
          target: `EscrowOrder:${order.id}`,
          action: 'ESCROW_PAYMENT_HOLD',
          context: {
            orderNumber,
            amount: product.price,
            sellerId: product.sellerId,
          },
          notes: `ON 포인트 에스크로 안전결제 예치 완료 (수수료율 ${platformFeeRate * 100}%)`,
        },
      });

      return {
        ok: true,
        order,
        message: '에스크로 안전결제가 완료되어 대금이 안전하게 보호됩니다.',
      };
    });
  }

  /**
   * 에스크로 구매 확정 & 판매자 자동 정산 (원자적 ACID 트랜잭션)
   */
  async confirmEscrowOrder(buyerId: string, orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.escrowOrder.findUnique({
        where: { id: orderId },
        include: { product: true },
      });

      if (!order) {
        throw new NotFoundException('주문 정보를 찾을 수 없습니다.');
      }

      if (order.buyerId !== buyerId) {
        throw new ForbiddenException('본인이 결제한 주문만 구매 확정할 수 있습니다.');
      }

      if (order.status !== EscrowStatus.ESCROW_HOLD && order.status !== EscrowStatus.SHIPPED) {
        throw new BadRequestException('구매 확정 가능한 상태가 아닙니다.');
      }

      // 1. 주문 상태를 CONFIRMED로 변경
      await tx.escrowOrder.update({
        where: { id: orderId },
        data: {
          status: EscrowStatus.CONFIRMED,
          confirmedAt: new Date(),
        },
      });

      // 2. 판매자 지갑에 정산 대금(sellerPayout) 입금
      await tx.user.update({
        where: { id: order.sellerId },
        data: { pointBalance: { increment: order.sellerPayout } },
      });

      // 3. 상품 상태를 완료(COMPLETED)로 변경
      await tx.marketProduct.update({
        where: { id: order.productId },
        data: { status: ProductStatus.COMPLETED },
      });

      // 4. 감사 로그
      await tx.auditLog.create({
        data: {
          actorId: buyerId,
          target: `EscrowOrder:${order.id}`,
          action: 'ESCROW_PAYMENT_CONFIRMED',
          context: {
            sellerId: order.sellerId,
            payout: order.sellerPayout,
            fee: order.platformFee,
          },
          notes: `구매 확정 및 판매자 정산 완료 (${order.sellerPayout} ON 지급)`,
        },
      });

      return {
        ok: true,
        message: '구매 확정이 완료되었으며 판매자에게 안전하게 정산되었습니다.',
      };
    });
  }

  /**
   * 거래 분쟁 접수
   */
  async disputeOrder(userId: string, orderId: string, dto: DisputeOrderDto) {
    const order = await this.prisma.escrowOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException('해당 거래 당사자만 분쟁을 신청할 수 있습니다.');
    }

    return this.prisma.escrowOrder.update({
      where: { id: orderId },
      data: {
        status: EscrowStatus.DISPUTED,
        disputeReason: dto.reason,
      },
    });
  }

  /**
   * 내 에스크로 주문/판매 목록 조회
   */
  async listUserOrders(userId: string, role: 'buyer' | 'seller') {
    const where = role === 'buyer' ? { buyerId: userId } : { sellerId: userId };
    return this.prisma.escrowOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            type: true,
          },
        },
      },
    });
  }

  /**
   * 관리자용 상품 상태 변경 (승인 / 숨김 / 판매종료)
   */
  async updateProductStatus(productId: string, status: ProductStatus) {
    const product = await this.prisma.marketProduct.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    return this.prisma.marketProduct.update({
      where: { id: productId },
      data: { status },
    });
  }

  /**
   * 관리자용 상품 전체 검수 목록 (C2C, B2C_GROUP)
   */
  async getAllProductsForAdmin(type?: MarketProductType, status?: ProductStatus, search?: string) {
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }
    const items = await this.prisma.marketProduct.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: {
            id: true,
            nickname: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
    return { ok: true, items, total: items.length };
  }
}
