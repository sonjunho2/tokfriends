import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateGiftDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  pricePoints: number;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  animationUrl?: string;

  @IsOptional()
  @IsString()
  animationType?: string; // 'alpha_video' | 'lottie' | 'sprite' | 'none'

  @IsOptional()
  @IsString()
  category?: string; // 'general' | 'special' | 'event' | 'vip'

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  chatEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  liveEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isNew?: boolean;
}

export class UpdateGiftDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  pricePoints?: number;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  animationUrl?: string;

  @IsOptional()
  @IsString()
  animationType?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  chatEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  liveEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isNew?: boolean;
}
