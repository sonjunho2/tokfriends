import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class ConfirmPurchaseDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsString()
  @IsNotEmpty()
  receipt: string;

  @IsIn(['ios', 'android'])
  platform: 'ios' | 'android';
}
