import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { MerchantStatus, NormalProductStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import {
  RegisterMerchantDto,
  CreateNormalProductDto,
  UpdateNormalProductDto,
  ReviewMerchantDto,
} from './dto/merchant.dto';

export interface MerchantItem {
  id: string;
  userId: string;
  businessName: string;
  businessNumber: string;
  representative: string;
  onlineOrderNumber?: string;
  businessCertUrl?: string;
  onlineOrderUrl?: string;
  status: MerchantStatus;
  feeRate: number;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    nickname: string | null;
    displayName: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
  productCount?: number;
}

export interface NormalProductItem {
  id: string;
  merchantId: string;
  merchantName?: string;
  name: string;
  description: string;
  priceKrw: number;
  salePriceKrw?: number | null;
  stock: number;
  images: string[];
  category: string;
  status: NormalProductStatus;
  shippingFee: number;
  createdAt: string;
  updatedAt: string;
}

const INITIAL_MERCHANTS: MerchantItem[] = [
  {
    id: 'mer-001',
    userId: 'u-merchant-1',
    businessName: '제주푸드 본사 직영',
    businessNumber: '616-81-99201',
    representative: '고성훈',
    onlineOrderNumber: '2025-제주오라-0112',
    businessCertUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
    onlineOrderUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600',
    status: MerchantStatus.APPROVED,
    feeRate: 9.5,
    bankName: '제주은행',
    accountNumber: '200-11-928172',
    accountHolder: '제주푸드(주)',
    createdAt: new Date(Date.now() - 3600000 * 240).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    user: {
      id: 'u-merchant-1',
      nickname: '제주흑돈직영',
      displayName: '제주푸드 본사 직영',
      email: 'jeju_food@example.com',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
    },
    productCount: 4,
  },
  {
    id: 'mer-002',
    userId: 'u-merchant-2',
    businessName: '메디컬 헬스케어랩',
    businessNumber: '214-88-34190',
    representative: '김정민',
    onlineOrderNumber: '2026-서울강남-0482',
    businessCertUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=600',
    onlineOrderUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
    status: MerchantStatus.APPROVED,
    feeRate: 10.0,
    bankName: '국민은행',
    accountNumber: '481202-01-382910',
    accountHolder: '(주)메디컬랩',
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    user: {
      id: 'u-merchant-2',
      nickname: '메디케어몰',
      displayName: '메디컬 헬스케어랩',
      email: 'medical_care@example.com',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    },
    productCount: 3,
  },
  {
    id: 'mer-003',
    userId: 'u-merchant-3',
    businessName: '어반 라이프 스타일',
    businessNumber: '105-86-77312',
    representative: '이지은',
    onlineOrderNumber: '2026-경기성남-1920',
    businessCertUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600',
    onlineOrderUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
    status: MerchantStatus.PENDING_REVIEW,
    feeRate: 10.0,
    bankName: '신한은행',
    accountNumber: '110-492-817293',
    accountHolder: '이지은(어반라이프)',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    user: {
      id: 'u-merchant-3',
      nickname: '어반스타일',
      displayName: '어반 라이프 스타일',
      email: 'urban_life@example.com',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
    },
    productCount: 2,
  },
];

const INITIAL_NORMAL_PRODUCTS: NormalProductItem[] = [
  {
    id: 'np-001',
    merchantId: 'mer-001',
    merchantName: '제주푸드 본사 직영',
    name: '[입점사상시] 제주 산지직송 프리미엄 1등급 흑돼지 오겹살 1kg',
    description: '제주 청정 농가에서 당일 도축 후 신선 포장 발송하는 1등급 명품 흑돼지 오겹살입니다.',
    priceKrw: 38000,
    salePriceKrw: 32900,
    stock: 150,
    images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'FOOD',
    status: NormalProductStatus.ACTIVE,
    shippingFee: 3000,
    createdAt: new Date(Date.now() - 3600000 * 180).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'np-002',
    merchantId: 'mer-001',
    merchantName: '제주푸드 본사 직영',
    name: '[입점사상시] 제주 유기농 감귤 착즙 원액주스 1000ml (3병 세트)',
    description: '물 한 방울 섞지 않은 무가당 100% 제주 감귤 순수 착즙 프리미엄 주스입니다.',
    priceKrw: 29000,
    salePriceKrw: 24900,
    stock: 80,
    images: [
      'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'FOOD',
    status: NormalProductStatus.ACTIVE,
    shippingFee: 0,
    createdAt: new Date(Date.now() - 3600000 * 150).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 'np-003',
    merchantId: 'mer-002',
    merchantName: '메디컬 헬스케어랩',
    name: '[공식인증] 고순도 프리미엄 알티지 오메가3 120캡슐 (4개월분)',
    description: 'IFOS 최고등급 원료 사용, 흡수율 높은 rTG형 오메가3로 혈행 및 눈 건강을 지켜드립니다.',
    priceKrw: 55000,
    salePriceKrw: 42000,
    stock: 200,
    images: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'LIVING',
    status: NormalProductStatus.ACTIVE,
    shippingFee: 2500,
    createdAt: new Date(Date.now() - 3600000 * 90).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: 'np-004',
    merchantId: 'mer-003',
    merchantName: '어반 라이프 스타일',
    name: '[입점사상시] 무소음 초음파 감성 아로마 무드등 가습기 500ml',
    description: '심플한 모던 인테리어 디자인과 7가지 은은한 LED 무드등 기능이 탑재된 초음파 가습기.',
    priceKrw: 42000,
    salePriceKrw: 35000,
    stock: 60,
    images: [
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'LIVING',
    status: NormalProductStatus.ACTIVE,
    shippingFee: 3000,
    createdAt: new Date(Date.now() - 3600000 * 40).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

@Injectable()
export class MerchantsService implements OnModuleInit {
  private readonly logger = new Logger(MerchantsService.name);
  private readonly dataDir = path.join(process.cwd(), 'data');
  private merchants: MerchantItem[] = [];
  private normalProducts: NormalProductItem[] = [];

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.loadData();
  }

  private loadData() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      const mPath = path.join(this.dataDir, 'merchants.json');
      if (fs.existsSync(mPath)) {
        this.merchants = JSON.parse(fs.readFileSync(mPath, 'utf-8'));
      } else {
        this.merchants = [...INITIAL_MERCHANTS];
        this.saveFile(mPath, this.merchants);
      }

      const pPath = path.join(this.dataDir, 'normal-products.json');
      if (fs.existsSync(pPath)) {
        this.normalProducts = JSON.parse(fs.readFileSync(pPath, 'utf-8'));
      } else {
        this.normalProducts = [...INITIAL_NORMAL_PRODUCTS];
        this.saveFile(pPath, this.normalProducts);
      }

      this.logger.log(`Merchants loaded (${this.merchants.length}), NormalProducts loaded (${this.normalProducts.length}).`);
    } catch (err: any) {
      this.logger.warn(`Failed to load merchant data: ${err?.message}, using defaults.`);
      this.merchants = [...INITIAL_MERCHANTS];
      this.normalProducts = [...INITIAL_NORMAL_PRODUCTS];
    }
  }

  private saveFile(filePath: string, data: any) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err: any) {
      this.logger.error(`Error saving ${filePath}: ${err?.message}`);
    }
  }

  // ==========================================
  // 1. 입점사 신청 & 내 정보
  // ==========================================

  async registerMerchant(userId: string, dto: RegisterMerchantDto) {
    if (!userId) {
      throw new BadRequestException('로그인 사용자가 확인되지 않았습니다.');
    }

    // 1. Check existing merchant
    const existing = this.merchants.find((m) => m.userId === userId || m.businessNumber === dto.businessNumber);
    if (existing) {
      if (existing.businessNumber === dto.businessNumber && existing.userId !== userId) {
        throw new BadRequestException('이미 등록된 사업자등록번호입니다.');
      }
      return { ok: true, message: '이미 등록된 입점사 계정이 있습니다.', merchant: existing };
    }

    const merchantId = `mer-${Date.now()}`;
    const newMerchant: MerchantItem = {
      id: merchantId,
      userId,
      businessName: dto.businessName,
      businessNumber: dto.businessNumber,
      representative: dto.representative,
      onlineOrderNumber: dto.onlineOrderNumber,
      businessCertUrl: dto.businessCertUrl,
      onlineOrderUrl: dto.onlineOrderUrl,
      status: MerchantStatus.PENDING_REVIEW,
      feeRate: 10.0,
      bankName: dto.bankName,
      accountNumber: dto.accountNumber,
      accountHolder: dto.accountHolder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      productCount: 0,
    };

    // Try DB write if possible
    try {
      await this.prisma.merchant.create({
        data: {
          id: merchantId,
          userId,
          businessName: dto.businessName,
          businessNumber: dto.businessNumber,
          representative: dto.representative,
          onlineOrderNumber: dto.onlineOrderNumber,
          businessCertUrl: dto.businessCertUrl,
          onlineOrderUrl: dto.onlineOrderUrl,
          status: MerchantStatus.PENDING_REVIEW,
          feeRate: 10.0,
          bankName: dto.bankName,
          accountNumber: dto.accountNumber,
          accountHolder: dto.accountHolder,
        },
      });
    } catch (dbErr: any) {
      this.logger.warn(`Prisma merchant create fallback: ${dbErr?.message}`);
    }

    this.merchants.unshift(newMerchant);
    this.saveFile(path.join(this.dataDir, 'merchants.json'), this.merchants);

    return {
      ok: true,
      message: '입점사 신청이 정상 접수되었습니다. 관리자 심사 후 승인됩니다.',
      merchant: newMerchant,
    };
  }

  async getMyMerchant(userId: string) {
    let merchant = this.merchants.find((m) => m.userId === userId);
    
    // Fallback: If demo/guest user without merchant, pick the first approved one for preview
    if (!merchant && this.merchants.length > 0) {
      merchant = this.merchants[0];
    }

    if (!merchant) {
      return { ok: false, merchant: null, products: [] };
    }

    const products = this.normalProducts.filter((p) => p.merchantId === merchant?.id);
    return {
      ok: true,
      merchant: {
        ...merchant,
        productCount: products.length,
      },
      products,
    };
  }

  // ==========================================
  // 2. 일반 상품 등록 & 수정
  // ==========================================

  async createNormalProduct(merchantId: string, dto: CreateNormalProductDto) {
    const merchant = this.merchants.find((m) => m.id === merchantId);
    if (!merchant) {
      throw new NotFoundException('등록된 입점사 정보를 찾을 수 없습니다.');
    }

    const productId = `np-${Date.now()}`;
    const newProduct: NormalProductItem = {
      id: productId,
      merchantId,
      merchantName: merchant.businessName,
      name: dto.name,
      description: dto.description,
      priceKrw: dto.priceKrw,
      salePriceKrw: dto.salePriceKrw ?? dto.priceKrw,
      stock: dto.stock,
      images: dto.images && dto.images.length > 0 ? dto.images : ['https://images.unsplash.com/photo-1544025162-d76694265947?w=600'],
      category: dto.category || 'FOOD',
      status: NormalProductStatus.ACTIVE,
      shippingFee: dto.shippingFee ?? 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Try DB write if possible
    try {
      await this.prisma.normalProduct.create({
        data: {
          id: productId,
          merchantId,
          name: dto.name,
          description: dto.description,
          priceKrw: dto.priceKrw,
          salePriceKrw: dto.salePriceKrw ?? dto.priceKrw,
          stock: dto.stock,
          images: newProduct.images,
          category: dto.category || 'FOOD',
          status: NormalProductStatus.ACTIVE,
          shippingFee: dto.shippingFee ?? 0,
        },
      });
    } catch (dbErr: any) {
      this.logger.warn(`Prisma normalProduct create fallback: ${dbErr?.message}`);
    }

    this.normalProducts.unshift(newProduct);
    this.saveFile(path.join(this.dataDir, 'normal-products.json'), this.normalProducts);

    return {
      ok: true,
      message: '일반 상품이 성공적으로 등록되었습니다.',
      product: newProduct,
    };
  }

  async updateNormalProduct(merchantId: string, productId: string, dto: UpdateNormalProductDto) {
    const product = this.normalProducts.find((p) => p.id === productId);
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    // If merchantId provided, check authorization (allow admin override)
    if (merchantId && merchantId !== 'admin' && product.merchantId !== merchantId) {
      throw new ForbiddenException('본인 입점사의 상품만 수정할 수 있습니다.');
    }

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.priceKrw !== undefined) product.priceKrw = dto.priceKrw;
    if (dto.salePriceKrw !== undefined) product.salePriceKrw = dto.salePriceKrw;
    if (dto.stock !== undefined) product.stock = dto.stock;
    if (dto.images !== undefined) product.images = dto.images;
    if (dto.category !== undefined) product.category = dto.category;
    if (dto.status !== undefined) product.status = dto.status;
    if (dto.shippingFee !== undefined) product.shippingFee = dto.shippingFee;
    product.updatedAt = new Date().toISOString();

    // Try DB update
    try {
      await this.prisma.normalProduct.update({
        where: { id: productId },
        data: {
          name: dto.name,
          description: dto.description,
          priceKrw: dto.priceKrw,
          salePriceKrw: dto.salePriceKrw,
          stock: dto.stock,
          images: dto.images,
          category: dto.category,
          status: dto.status,
          shippingFee: dto.shippingFee,
        },
      });
    } catch (dbErr: any) {
      this.logger.warn(`Prisma normalProduct update fallback: ${dbErr?.message}`);
    }

    this.saveFile(path.join(this.dataDir, 'normal-products.json'), this.normalProducts);

    return {
      ok: true,
      message: '상품 정보가 성공적으로 수정되었습니다.',
      product,
    };
  }

  async deleteNormalProduct(merchantId: string, productId: string) {
    const index = this.normalProducts.findIndex((p) => p.id === productId);
    if (index === -1) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    if (merchantId && merchantId !== 'admin' && this.normalProducts[index].merchantId !== merchantId) {
      throw new ForbiddenException('본인 입점사의 상품만 삭제할 수 있습니다.');
    }

    this.normalProducts.splice(index, 1);
    this.saveFile(path.join(this.dataDir, 'normal-products.json'), this.normalProducts);

    try {
      await this.prisma.normalProduct.delete({ where: { id: productId } });
    } catch {}

    return { ok: true, message: '상품이 삭제되었습니다.', id: productId };
  }

  // ==========================================
  // 3. 마켓 탭 상시 일반 상품 목록 조회
  // ==========================================

  async listNormalProducts(params: {
    category?: string;
    search?: string;
    sort?: 'recent' | 'priceAsc' | 'priceDesc' | 'popular' | string;
    page?: number;
    limit?: number;
  }) {
    const { category, search, sort = 'recent', page = 1, limit = 20 } = params;
    let list = [...this.normalProducts].filter((p) => p.status === NormalProductStatus.ACTIVE);

    if (category && category !== 'ALL' && category !== 'all') {
      const cat = category.toUpperCase();
      list = list.filter((p) => p.category.toUpperCase() === cat);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.merchantName && p.merchantName.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sort === 'priceAsc') {
      list.sort((a, b) => (a.salePriceKrw ?? a.priceKrw) - (b.salePriceKrw ?? b.priceKrw));
    } else if (sort === 'priceDesc') {
      list.sort((a, b) => (b.salePriceKrw ?? b.priceKrw) - (a.salePriceKrw ?? a.priceKrw));
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = list.length;
    const start = (page - 1) * limit;
    const items = list.slice(start, start + limit);

    return {
      ok: true,
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getNormalProductById(id: string) {
    const product = this.normalProducts.find((p) => p.id === id);
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    const merchant = this.merchants.find((m) => m.id === product.merchantId);
    return {
      ok: true,
      product: {
        ...product,
        merchant,
      },
    };
  }

  // ==========================================
  // 4. 관리자용 입점사 심사 & 검수
  // ==========================================

  async getAdminMerchants(status?: string, search?: string) {
    let list = [...this.merchants];

    if (status && status !== 'ALL' && status !== 'all') {
      list = list.filter((m) => m.status === status);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.businessName.toLowerCase().includes(q) ||
          m.businessNumber.includes(q) ||
          m.representative.toLowerCase().includes(q)
      );
    }

    // Attach product count
    const enriched = list.map((m) => {
      const pCount = this.normalProducts.filter((p) => p.merchantId === m.id).length;
      return {
        ...m,
        productCount: pCount,
      };
    });

    return {
      ok: true,
      items: enriched,
      total: enriched.length,
      stats: {
        totalMerchants: this.merchants.length,
        pendingReview: this.merchants.filter((m) => m.status === MerchantStatus.PENDING_REVIEW).length,
        approved: this.merchants.filter((m) => m.status === MerchantStatus.APPROVED).length,
        suspended: this.merchants.filter((m) => m.status === MerchantStatus.SUSPENDED).length,
      },
    };
  }

  async reviewMerchant(merchantId: string, dto: ReviewMerchantDto) {
    const merchant = this.merchants.find((m) => m.id === merchantId);
    if (!merchant) {
      throw new NotFoundException('입점사 정보를 찾을 수 없습니다.');
    }

    merchant.status = dto.status;
    if (dto.feeRate !== undefined) {
      merchant.feeRate = Number(dto.feeRate);
    }
    merchant.updatedAt = new Date().toISOString();

    try {
      await this.prisma.merchant.update({
        where: { id: merchantId },
        data: {
          status: dto.status,
          feeRate: dto.feeRate !== undefined ? Number(dto.feeRate) : undefined,
        },
      });
    } catch (dbErr: any) {
      this.logger.warn(`Prisma merchant review fallback: ${dbErr?.message}`);
    }

    this.saveFile(path.join(this.dataDir, 'merchants.json'), this.merchants);

    return {
      ok: true,
      message: `입점사 상태가 [${dto.status}]으로 업데이트되었습니다. (확정 수수료율: ${merchant.feeRate}%)`,
      merchant,
    };
  }

  async getAllNormalProductsForAdmin(params?: { category?: string; status?: string; search?: string }) {
    let list = [...this.normalProducts];

    if (params?.category && params.category !== 'ALL') {
      list = list.filter((p) => p.category.toUpperCase() === params.category?.toUpperCase());
    }

    if (params?.status && params.status !== 'ALL') {
      list = list.filter((p) => p.status === params.status);
    }

    if (params?.search?.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.merchantName && p.merchantName.toLowerCase().includes(q))
      );
    }

    return {
      ok: true,
      items: list,
      total: list.length,
    };
  }
}
