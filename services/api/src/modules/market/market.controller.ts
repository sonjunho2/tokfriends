import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MarketService } from './market.service';
import { CreateMarketProductDto, CreateEscrowOrderDto, DisputeOrderDto } from './dto/market.dto';
import { Public } from '../auth/public.decorator';
import { MarketProductType, ProductStatus } from '@prisma/client';
import { MerchantsService } from '../merchants/merchants.service';

@ApiTags('Market (커머스 & 에스크로 안전결제)')
@Controller('market')
export class MarketController {
  constructor(
    private readonly marketService: MarketService,
    private readonly merchantsService: MerchantsService,
  ) {}

  @Public()
  @Get('products')
  @ApiOperation({ summary: '마켓 상품 목록 조회 (C2C 중고 & B2C 공동구매)' })
  @ApiQuery({ name: 'type', enum: MarketProductType, required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listProducts(
    @Query('type') type?: MarketProductType,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketService.listProducts({
      type,
      category,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Public()
  @Get('products/:id')
  @ApiOperation({ summary: '마켓 상품 상세 조회' })
  async getProduct(@Param('id') id: string) {
    return this.marketService.getProduct(id);
  }

  @Post('products')
  @ApiBearerAuth()
  @ApiOperation({ summary: '마켓 상품 등록 (C2C 중고 물품 또는 B2C 공구)' })
  async createProduct(@Req() req: any, @Body() dto: CreateMarketProductDto) {
    const userId = req.user?.id || req.user?.sub;
    return this.marketService.createProduct(userId, dto);
  }

  @Post('orders')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ON 포인트 에스크로 안전결제 주문 생성 (대금 안전 예치)' })
  async createEscrowOrder(@Req() req: any, @Body() dto: CreateEscrowOrderDto) {
    const buyerId = req.user?.id || req.user?.sub;
    return this.marketService.createEscrowOrder(buyerId, dto);
  }

  @Post('orders/:id/confirm')
  @ApiBearerAuth()
  @ApiOperation({ summary: '에스크로 구매 확정 (판매자 지갑으로 대금 자동 정산)' })
  async confirmEscrowOrder(@Req() req: any, @Param('id') orderId: string) {
    const buyerId = req.user?.id || req.user?.sub;
    return this.marketService.confirmEscrowOrder(buyerId, orderId);
  }

  @Post('orders/:id/dispute')
  @ApiBearerAuth()
  @ApiOperation({ summary: '거래 분쟁 접수' })
  async disputeOrder(
    @Req() req: any,
    @Param('id') orderId: string,
    @Body() dto: DisputeOrderDto,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.marketService.disputeOrder(userId, orderId, dto);
  }

  @Get('my-orders')
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 에스크로 구매/판매 내역 조회' })
  @ApiQuery({ name: 'role', enum: ['buyer', 'seller'], required: false })
  async listMyOrders(@Req() req: any, @Query('role') role?: 'buyer' | 'seller') {
    const userId = req.user?.id || req.user?.sub;
    return this.marketService.listUserOrders(userId, role || 'buyer');
  }

  // ==========================================
  // B2C 상시 일반 상품 (NormalProduct) 엔드포인트
  // ==========================================

  @Public()
  @Get('normal-products')
  @ApiOperation({ summary: '마켓 탭에서 입점사 상시 일반 상품 목록 조회 (카테고리, 정렬 필터)' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sort', enum: ['recent', 'priceAsc', 'priceDesc', 'popular'], required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listNormalProducts(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: 'recent' | 'priceAsc' | 'priceDesc' | 'popular',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.merchantsService.listNormalProducts({
      category,
      search,
      sort,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Public()
  @Get('normal-products/:id')
  @ApiOperation({ summary: '입점사 상시 일반 상품 상세 조회' })
  async getNormalProduct(@Param('id') id: string) {
    return this.merchantsService.getNormalProductById(id);
  }

  // ==========================================
  // 관리자 전용 마켓 검수 엔드포인트
  // ==========================================

  @Public()
  @Get('admin/normal-products')
  @ApiOperation({ summary: '관리자용 입점사 일반 상품 검수 목록' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getAdminNormalProducts(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.merchantsService.getAllNormalProductsForAdmin({ category, status, search });
  }

  @Public()
  @Patch('admin/normal-products/:id/status')
  @ApiOperation({ summary: '관리자용 일반 상품 상태 통제 (ACTIVE, HIDDEN, OUT_OF_STOCK)' })
  async updateAdminNormalProductStatus(
    @Param('id') id: string,
    @Body() body: { status: any },
  ) {
    return this.merchantsService.updateNormalProduct('admin', id, { status: body.status });
  }

  @Public()
  @Get('admin/products')
  @ApiOperation({ summary: '관리자용 C2C 중고/B2C 공구 검수 목록' })
  @ApiQuery({ name: 'type', enum: MarketProductType, required: false })
  @ApiQuery({ name: 'status', enum: ProductStatus, required: false })
  @ApiQuery({ name: 'search', required: false })
  async getAdminMarketProducts(
    @Query('type') type?: MarketProductType,
    @Query('status') status?: ProductStatus,
    @Query('search') search?: string,
  ) {
    return this.marketService.getAllProductsForAdmin(type, status, search);
  }

  @Public()
  @Patch('admin/products/:id/status')
  @ApiOperation({ summary: '관리자용 C2C/공구 상품 상태 변경 (승인 / 숨김 / 판매종료)' })
  async updateAdminMarketProductStatus(
    @Param('id') id: string,
    @Body() body: { status: ProductStatus },
  ) {
    return this.marketService.updateProductStatus(id, body.status);
  }
}
