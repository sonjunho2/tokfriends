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

export class ConfirmTossPurchaseDto {
  @IsString()
  @IsNotEmpty()
  paymentKey: string;

  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  productId: string;
}

export class ConfirmPortOnePurchaseDto {
  @IsString()
  @IsNotEmpty()
  impUid: string;

  @IsString()
  @IsNotEmpty()
  merchantUid: string;

  @IsString()
  @IsNotEmpty()
  productId: string;
}
