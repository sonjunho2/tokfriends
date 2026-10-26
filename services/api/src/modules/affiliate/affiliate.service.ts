import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { PickAffiliateProductDto, QueryAffiliateProductsDto } from './dto/affiliate.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AffiliateService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 스트리머가 방송 판매용으로 고를 수 있는 '제휴 허용 상품' 목록 조회 (본사 직영 + 입점사 상품)
   */
  async getAffiliateProducts(query: QueryAffiliateProductsDto) {
    const { search, category, ownerType, limit = 50, offset = 0 } = query;

    const where: Prisma.NormalProductWhereInput = {
      status: 'ACTIVE',
      allowAffiliate: true,
    };

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (ownerType && ownerType !== 'ALL') {
      where.ownerType = ownerType as any;
    }

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { merchant: { businessName: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    const total = await this.prisma.normalProduct.count({ where });
    const items = await this.prisma.normalProduct.findMany({
      where,
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
            representative: true,
            status: true,
          },
        },
      },
      orderBy: [{ isHqDirect: 'desc' }, { createdAt: 'desc' }],
      take: Number(limit),
      skip: Number(offset),
    });

    const formatted = items.map((product) => {
      const commRate = Number(product.affiliateCommissionRate || 10.0);
      const effectivePrice = product.salePriceKrw || product.priceKrw;
      const estimatedCommissionKrw = Math.floor((effectivePrice * commRate) / 100);

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        priceKrw: product.priceKrw,
        salePriceKrw: product.salePriceKrw,
        effectivePrice,
        stock: product.stock,
        images: product.images,
        category: product.category,
        shippingFee: product.shippingFee,
        ownerType: product.ownerType,
        isHqDirect: product.isHqDirect,
        allowAffiliate: product.allowAffiliate,
        commissionRate: commRate,
        estimatedCommissionKrw,
        merchantId: product.merchantId,
        merchantName: product.merchant?.businessName || (product.isHqDirect ? '본사 공식 직영' : '입점사'),
        createdAt: product.createdAt,
      };
    });

    return {
      success: true,
      total,
      count: formatted.length,
      data: formatted,
    };
  }

  /**
   * 특정 상품을 스트리머의 [내 방송 판매 상품]으로 바구니에 담기
   */
  async pickProduct(streamerId: string, dto: PickAffiliateProductDto) {
    const product = await this.prisma.normalProduct.findUnique({
      where: { id: dto.productId },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('해당 상품을 찾을 수 없습니다.');
    }

    if (!product.allowAffiliate) {
      throw new BadRequestException('해당 상품은 스트리머 제휴 판매가 허용되지 않았습니다.');
    }

    const rate = dto.commissionRate !== undefined && dto.commissionRate !== null
      ? new Prisma.Decimal(dto.commissionRate)
      : product.affiliateCommissionRate;

    const picked = await this.prisma.streamerAffiliateProduct.upsert({
      where: {
        streamerId_productId: {
          streamerId,
          productId: dto.productId,
        },
      },
      update: {
        commissionRate: rate,
      },
      create: {
        streamerId,
        productId: dto.productId,
        commissionRate: rate,
      },
      include: {
        product: {
          include: {
            merchant: {
              select: {
                id: true,
                businessName: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      message: '방송 판매 상품으로 등록되었습니다.',
      data: {
        id: picked.id,
        streamerId: picked.streamerId,
        productId: picked.productId,
        commissionRate: Number(picked.commissionRate),
        product: {
          id: picked.product.id,
          name: picked.product.name,
          priceKrw: picked.product.priceKrw,
          salePriceKrw: picked.product.salePriceKrw,
          images: picked.product.images,
          stock: picked.product.stock,
          ownerType: picked.product.ownerType,
          isHqDirect: picked.product.isHqDirect,
          merchantName: picked.product.merchant?.businessName || '본사/입점사',
        },
        createdAt: picked.createdAt,
      },
    };
  }

  /**
   * 스트리머 본인이 담아둔 제휴 판매 상품 목록 조회 (D LIVE 방송 시 핀 목록에 우선 노출)
   */
  async getMyProducts(streamerId: string) {
    const picks = await this.prisma.streamerAffiliateProduct.findMany({
      where: { streamerId },
      include: {
        product: {
          include: {
            merchant: {
              select: {
                id: true,
                businessName: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = picks.map((item) => {
      const p = item.product;
      const commRate = Number(item.commissionRate);
      const effectivePrice = p.salePriceKrw || p.priceKrw;
      const estimatedCommissionKrw = Math.floor((effectivePrice * commRate) / 100);

      return {
        id: item.id,
        streamerId: item.streamerId,
        productId: item.productId,
        commissionRate: commRate,
        estimatedCommissionKrw,
        product: {
          id: p.id,
          name: p.name,
          description: p.description,
          priceKrw: p.priceKrw,
          salePriceKrw: p.salePriceKrw,
          effectivePrice,
          stock: p.stock,
          images: p.images,
          category: p.category,
          shippingFee: p.shippingFee,
          status: p.status,
          ownerType: p.ownerType,
          isHqDirect: p.isHqDirect,
          merchantId: p.merchantId,
          merchantName: p.merchant?.businessName || (p.isHqDirect ? '본사 공식 직영' : '입점사'),
        },
        createdAt: item.createdAt,
      };
    });

    return {
      success: true,
      count: data.length,
      data,
    };
  }

  /**
   * 제휴 바구니에서 상품 제거
   */
  async unpickProduct(streamerId: string, productId: string) {
    try {
      await this.prisma.streamerAffiliateProduct.delete({
        where: {
          streamerId_productId: {
            streamerId,
            productId,
          },
        },
      });
      return { success: true, message: '제휴 상품 바구니에서 제거되었습니다.' };
    } catch {
      return { success: true, message: '이미 제거되었거나 존재하지 않는 항목입니다.' };
    }
  }
}
