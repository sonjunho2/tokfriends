import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AffiliateService } from './affiliate.service';
import { PickAffiliateProductDto, QueryAffiliateProductsDto } from './dto/affiliate.dto';
import { Public } from '../auth/public.decorator';

@ApiTags('Affiliate (스트리머 제휴 위탁 판매)')
@Controller(['affiliate', 'api/affiliate'])
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  @Get('products')
  @Public()
  @ApiOperation({ summary: '스트리머 방송 판매용 제휴 허용 상품 목록 조회 (본사 직영 + 입점사 상품)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'ownerType', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async getAffiliateProducts(@Query() query: QueryAffiliateProductsDto) {
    return this.affiliateService.getAffiliateProducts(query);
  }

  @Post('products/pick')
  @Public()
  @ApiOperation({ summary: '스트리머가 특정 상품을 [내 방송 판매 상품]으로 바구니에 담기' })
  async pickProduct(@Req() req: any, @Body() dto: PickAffiliateProductDto) {
    const streamerId =
      dto.streamerId ||
      req.user?.id ||
      req.user?.sub ||
      req.query?.streamerId ||
      'streamer-default';
    return this.affiliateService.pickProduct(streamerId, dto);
  }

  @Get('my-products')
  @Public()
  @ApiOperation({ summary: '스트리머 본인이 담아둔 제휴 판매 상품 목록 조회 (D LIVE 방송 시 핀 목록에 우선 노출)' })
  @ApiQuery({ name: 'streamerId', required: false })
  async getMyProducts(@Req() req: any, @Query('streamerId') queryStreamerId?: string) {
    const streamerId =
      queryStreamerId ||
      req.user?.id ||
      req.user?.sub ||
      req.query?.streamerId ||
      'streamer-default';
    return this.affiliateService.getMyProducts(streamerId);
  }

  @Delete('my-products/:productId')
  @Public()
  @ApiOperation({ summary: '스트리머 방송 판매 제휴 바구니에서 상품 제거' })
  async unpickProduct(@Req() req: any, @Param('productId') productId: string) {
    const streamerId =
      req.query?.streamerId ||
      req.user?.id ||
      req.user?.sub ||
      'streamer-default';
    return this.affiliateService.unpickProduct(streamerId, productId);
  }

  @Get('stats')
  @Public()
  @ApiOperation({ summary: '스트리머 제휴 판매 실적 및 정산 통계 조회' })
  async getStreamerStats(@Req() req: any, @Query('streamerId') queryStreamerId?: string) {
    const streamerId =
      queryStreamerId ||
      req.user?.id ||
      req.user?.sub ||
      req.query?.streamerId ||
      'streamer-default';
    return this.affiliateService.getStreamerStats(streamerId);
  }
}
