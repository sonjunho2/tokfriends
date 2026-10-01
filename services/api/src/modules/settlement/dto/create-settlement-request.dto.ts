import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSettlementRequestDto {
  @ApiProperty({ description: '출금 신청 포인트 (1P = 1원, 최소 10,000P)', example: 50000 })
  @IsInt()
  @Min(10000, { message: '최소 출금 신청 포인트는 10,000P입니다.' })
  pointsAmount!: number;

  @ApiProperty({ description: '은행명', example: '국민은행' })
  @IsString()
  @IsNotEmpty({ message: '은행명을 입력해 주세요.' })
  bankName!: string;

  @ApiProperty({ description: '계좌번호 (숫자 또는 하이픈 포함)', example: '123-456-789012' })
  @IsString()
  @IsNotEmpty({ message: '계좌번호를 입력해 주세요.' })
  accountNumber!: string;

  @ApiProperty({ description: '예금주명', example: '홍길동' })
  @IsString()
  @IsNotEmpty({ message: '예금주명을 입력해 주세요.' })
  accountHolder!: string;

  @ApiPropertyOptional({ description: '주민등록번호 앞자리 또는 마스킹 정보', example: '950101' })
  @IsOptional()
  @IsString()
  idCardNumberHash?: string;
}

export class AdminRejectSettlementDto {
  @ApiProperty({ description: '반려 사유', example: '예금주명과 본인 확인 명의가 일치하지 않습니다.' })
  @IsString()
  @IsNotEmpty({ message: '반려 사유를 입력해 주세요.' })
  reason!: string;
}

export class AdminApproveSettlementDto {
  @ApiPropertyOptional({ description: '송금 또는 승인 관리자 메모', example: '기업은행 송금 완료 (송금번호: 20261001-001)' })
  @IsOptional()
  @IsString()
  adminMemo?: string;
}
