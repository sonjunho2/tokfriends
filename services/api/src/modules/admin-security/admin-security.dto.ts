import {
  IsIn,
  IsNotEmpty,
  IsDateString,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAdminApprovalRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  action: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  target: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reason: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  idempotencyKey?: string;

  @IsOptional()
  @IsDateString()
  @MaxLength(100)
  expiresAt?: string;
}

export class DecideAdminApprovalRequestDto {
  @IsIn(['APPROVED', 'REJECTED'])
  decision: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}