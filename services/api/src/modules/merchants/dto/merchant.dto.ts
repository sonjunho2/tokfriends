import { IsString, IsOptional, IsNumber, IsArray, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MerchantStatus, NormalProductStatus } from '@prisma/client';

export class RegisterMerchantDto {
  @ApiProperty({ description: '상호명 (사업자 등록명)' })
  @IsString()
  businessName: string;

  @ApiProperty({ description: '사업자등록번호 (10자리)' })
  @IsString()
  businessNumber: string;

  @ApiProperty({ description: '대표자명' })
  @IsString()
  representative: string;

  @ApiPropertyOptional({ description: '통신판매업신고번호' })
  @IsOptional()
  @IsString()
  onlineOrderNumber?: string;

  @ApiPropertyOptional({ description: '사업자등록증 사본 이미지 URL' })
  @IsOptional()
  @IsString()
  businessCertUrl?: string;

  @ApiPropertyOptional({ description: '통신판매업신고증 사본 이미지 URL' })
  @IsOptional()
  @IsString()
  onlineOrderUrl?: string;

  @ApiPropertyOptional({ description: '정산 은행명' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: '정산 계좌번호' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ description: '예금주' })
  @IsOptional()
  @IsString()
  accountHolder?: string;
}

export class CreateNormalProductDto {
  @ApiProperty({ description: '상품명' })
  @IsString()
  name: string;

  @ApiProperty({ description: '상품 상세 설명' })
  @IsString()
  description: string;

  @ApiProperty({ description: '정상가 (KRW)' })
  @IsNumber()
  @Min(0)
  priceKrw: number;

  @ApiPropertyOptional({ description: '할인가/판매가 (KRW)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salePriceKrw?: number;

  @ApiProperty({ description: '재고 수량' })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ description: '상품 이미지 URL 배열', type: [String] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ description: '카테고리 (FOOD, FASHION, DIGITAL, LIVING, BEAUTY 등)' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ description: '기본 배송비 (KRW, 기본 0원)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingFee?: number;
}

export class UpdateNormalProductDto {
  @ApiPropertyOptional({ description: '상품명' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '상품 상세 설명' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '정상가 (KRW)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceKrw?: number;

  @ApiPropertyOptional({ description: '할인가/판매가 (KRW)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salePriceKrw?: number;

  @ApiPropertyOptional({ description: '재고 수량' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ description: '상품 이미지 URL 배열', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: '카테고리' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '상품 상태', enum: NormalProductStatus })
  @IsOptional()
  @IsEnum(NormalProductStatus)
  status?: NormalProductStatus;

  @ApiPropertyOptional({ description: '기본 배송비 (KRW)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingFee?: number;
}

export class ReviewMerchantDto {
  @ApiProperty({ description: '심사 상태', enum: MerchantStatus })
  @IsEnum(MerchantStatus)
  status: MerchantStatus;

  @ApiPropertyOptional({ description: '확정 계약 수수료율 (8.0 ~ 12.0%)' })
  @IsOptional()
  @IsNumber()
  @Min(5.0)
  @Max(25.0)
  feeRate?: number;

  @ApiPropertyOptional({ description: '관리자 심사 메모 / 사유' })
  @IsOptional()
  @IsString()
  adminMemo?: string;
}
