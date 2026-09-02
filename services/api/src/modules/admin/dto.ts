import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SetUserRoleDto {
  @IsIn(['user', 'moderator', 'admin'])
  role: 'user' | 'moderator' | 'admin';
}

export class CreateRefundDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  receiptId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}