import { IsNotEmpty, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PickAffiliateProductDto {
  @ApiProperty({ description: '제휴할 상품 ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ description: '스트리머 ID (미전달 시 로그인 유저)' })
  @IsString()
  @IsOptional()
  streamerId?: string;

  @ApiPropertyOptional({ description: '커미션 요율 (기본 상품 설정 요율)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  commissionRate?: number;
}

export class QueryAffiliateProductsDto {
  @ApiPropertyOptional({ description: '검색어 (상품명, 입점사명)' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: '카테고리' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '상품 소유자 유형 (HEADQUARTERS, MERCHANT, ALL)' })
  @IsString()
  @IsOptional()
  ownerType?: string;

  @ApiPropertyOptional({ description: '페이지당 개수', default: 50 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: '오프셋', default: 0 })
  @IsOptional()
  offset?: number;
}
