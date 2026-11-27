import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, Min, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarketProductType, ProductStatus } from '@prisma/client';

export class CreateMarketProductDto {
  @ApiProperty({ enum: ['C2C_USED', 'B2C_GROUP'], default: 'C2C_USED' })
  @IsEnum(MarketProductType)
  type: MarketProductType;

  @ApiProperty({ description: '상품명', example: '아이폰 15 프로 256GB' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '상품 상세 설명' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: '카테고리', example: 'DIGITAL' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: 'ON 포인트 가격 (1 ON = 1원)', example: 980000 })
  @IsNumber()
  @Min(100)
  price: number;

  @ApiPropertyOptional({ description: 'B2C 공구 시 정가 (원)', example: 1200000 })
  @IsOptional()
  @IsNumber()
  originalPrice?: number;

  @ApiPropertyOptional({ description: '공구 목표 인원', default: 1 })
  @IsOptional()
  @IsNumber()
  targetQuantity?: number;

  @ApiProperty({ description: '사진 URL 목록 (최대 10장)', type: [String] })
  @IsArray()
  images: string[];

  @ApiPropertyOptional({ description: '희망 거래 동네/장소명', example: '역삼1동' })
  @IsOptional()
  @IsString()
  locationName?: string;

  @ApiPropertyOptional({ description: '위도' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: '경도' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: '배송비' })
  @IsOptional()
  @IsNumber()
  shippingFee?: number;

  @ApiPropertyOptional({ description: '재고' })
  @IsOptional()
  @IsNumber()
  stock?: number;

  @ApiPropertyOptional({ description: '소유자 유형' })
  @IsOptional()
  @IsString()
  ownerType?: string;

  @ApiPropertyOptional({ description: '상세 이미지 목록', type: [String] })
  @IsOptional()
  @IsArray()
  detailImages?: string[];

  @ApiPropertyOptional({ description: '상세 공지사항' })
  @IsOptional()
  @IsString()
  detailNotice?: string;

  @ApiPropertyOptional({ description: '제조사' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ description: '원산지' })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiPropertyOptional({ description: '고객센터 연락처' })
  @IsOptional()
  @IsString()
  csPhone?: string;

  @ApiPropertyOptional({ description: '판매자 닉네임' })
  @IsOptional()
  @IsString()
  sellerName?: string;
}

export class CreateEscrowOrderDto {
  @ApiProperty({ description: '구매할 상품 ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ description: '배송지 또는 직거래 메모' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class DisputeOrderDto {
  @ApiProperty({ description: '분쟁 사유' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class UpdateMyProductStatusDto {
  @ApiProperty({ enum: ['ACTIVE', 'RESERVED', 'COMPLETED', 'CANCELLED'] })
  @IsEnum(ProductStatus)
  status: ProductStatus;
}

export class ToggleWishlistDto {
  @ApiProperty({ description: '찜할 상품 ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ description: '상품 유형 (MARKET_PRODUCT | NORMAL_PRODUCT)', default: 'MARKET_PRODUCT' })
  @IsOptional()
  @IsString()
  productType?: string;
}
