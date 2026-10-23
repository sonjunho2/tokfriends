import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MerchantsService } from './merchants.service';
import {
  RegisterMerchantDto,
  CreateNormalProductDto,
  UpdateNormalProductDto,
  ReviewMerchantDto,
} from './dto/merchant.dto';
import { Public } from '../auth/public.decorator';

@ApiTags('Merchants (입점사 & B2C 상시 일반 상품)')
@Controller(['merchants', 'api/merchants'])
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Post('register')
  @Public() // Can authenticate with Bearer or body fallback for frictionless flow
  @ApiOperation({ summary: '입점사 신청 및 사업자 정보 등록' })
  async registerMerchant(@Req() req: any, @Body() dto: RegisterMerchantDto) {
    const userId = req.user?.id || req.user?.sub || req.body?.userId || 'u-merchant-current';
    return this.merchantsService.registerMerchant(userId, dto);
  }

  @Get('my')
  @Public()
  @ApiOperation({ summary: '로그인한 입점사 프로필 및 등록 상품 목록 조회' })
  async getMyMerchant(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub || req.query?.userId || 'u-merchant-1';
    return this.merchantsService.getMyMerchant(userId);
  }

  @Post('products')
  @Public()
  @ApiOperation({ summary: '입점사 일반 상품 등록 (가격, 재고, 배송비)' })
  async createProduct(@Req() req: any, @Body() dto: CreateNormalProductDto) {
    // If merchantId passed in body/query or derived from user
    const merchantId = req.body?.merchantId || req.query?.merchantId || 'mer-001';
    return this.merchantsService.createNormalProduct(merchantId, dto);
  }

  @Put('products/:id')
  @Public()
  @ApiOperation({ summary: '입점사 일반 상품 정보 및 재고 수정' })
  async updateProduct(
    @Req() req: any,
    @Param('id') productId: string,
    @Body() dto: UpdateNormalProductDto,
  ) {
    const merchantId = req.body?.merchantId || req.query?.merchantId || 'admin';
    return this.merchantsService.updateNormalProduct(merchantId, productId, dto);
  }

  @Delete('products/:id')
  @Public()
  @ApiOperation({ summary: '입점사 일반 상품 삭제' })
  async deleteProduct(@Req() req: any, @Param('id') productId: string) {
    const merchantId = req.body?.merchantId || req.query?.merchantId || 'admin';
    return this.merchantsService.deleteNormalProduct(merchantId, productId);
  }

  // ==========================================
  // 관리자 전용 엔드포인트
  // ==========================================

  @Get('admin/list')
  @Public()
  @ApiOperation({ summary: '관리자용 입점사 신청/등록 목록 조회 (필터 및 통계)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getAdminMerchants(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.merchantsService.getAdminMerchants(status, search);
  }

  @Patch('admin/:id/review')
  @Public()
  @ApiOperation({ summary: '관리자용 입점사 심사 승인/반려 및 계약 수수료율 확정' })
  async reviewMerchant(
    @Param('id') merchantId: string,
    @Body() dto: ReviewMerchantDto,
  ) {
    return this.merchantsService.reviewMerchant(merchantId, dto);
  }
}
