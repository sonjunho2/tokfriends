import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  headline?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  avatarUri?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  callRatePerMinute?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  liveRatePerMinute?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  region1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  region2?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  chatEntryFee?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  liveEntryFee?: number;

  @IsOptional()
  @IsBoolean()
  notifyChat?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyLive?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyNightLimit?: boolean;
}

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  notifyChat?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyLive?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyNightLimit?: boolean;
}
