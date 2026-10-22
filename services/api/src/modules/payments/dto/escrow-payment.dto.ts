import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class PrepareEscrowPaymentDto {
  @ApiProperty({ description: '마켓 상품 ID', example: 'prod-b2c-1' })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiPropertyOptional({ description: 'D LIVE 방송 ID (라이브 방송 중 구매 시)', example: 'live-room-101' })
  @IsOptional()
  @IsString()
  liveId?: string;

  @ApiPropertyOptional({ description: '수량 (기본 1)', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: '배송지 주소', example: '서울특별시 강남구 테헤란로 152 12층' })
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiPropertyOptional({ description: 'PG 결제 대행사', example: 'TOSS_PAYMENTS' })
  @IsOptional()
  @IsString()
  pgProvider?: string;
}

export class ConfirmEscrowPaymentDto {
  @ApiProperty({ description: '주문 고유 UUID 또는 주문번호', example: 'ORD-KRW-202610-8812' })
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty({ description: 'PG사 결제 승인 키 (paymentKey)', example: 'tviva20261022123456789' })
  @IsString()
  @IsNotEmpty()
  paymentKey!: string;

  @ApiProperty({ description: '실제 결제된 원화 금액', example: 25770 })
  @IsNumber()
  @Min(100)
  amount!: number;
}

export class CompleteEscrowOrderDto {
  @ApiProperty({ description: '주문 ID', example: 'ord-uuid-1234' })
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiPropertyOptional({ description: '판매자 정산 은행', example: '카카오뱅크' })
  @IsOptional()
  @IsString()
  sellerBankName?: string;

  @ApiPropertyOptional({ description: '판매자 정산 계좌번호', example: '3333-01-1234567' })
  @IsOptional()
  @IsString()
  sellerAccountNumber?: string;

  @ApiPropertyOptional({ description: '판매자 예금주명', example: '홍길동' })
  @IsOptional()
  @IsString()
  sellerAccountHolder?: string;
}

export class DisputeEscrowOrderDto {
  @ApiProperty({ description: '주문 ID', example: 'ord-uuid-1234' })
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty({ description: '분쟁 제기 사유', example: '상품 파손 및 설명과 다른 하자가 있습니다.' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
