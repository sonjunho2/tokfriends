import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateAdvertisementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsString()
  @IsOptional()
  targetUrl?: string;

  @IsString()
  @IsOptional()
  placement?: string; // 'HOME_BANNER' | 'SHOP_BANNER' | 'LIVE_BANNER' | 'POPUP'

  @IsInt()
  @IsOptional()
  priority?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  rewardPoints?: number;

  @IsOptional()
  startsAt?: string | Date;

  @IsOptional()
  endsAt?: string | Date;
}

export class UpdateAdvertisementDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  targetUrl?: string;

  @IsString()
  @IsOptional()
  placement?: string;

  @IsInt()
  @IsOptional()
  priority?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  rewardPoints?: number;

  @IsOptional()
  startsAt?: string | Date;

  @IsOptional()
  endsAt?: string | Date;
}
