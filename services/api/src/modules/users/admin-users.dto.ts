import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class AdminUserNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  note: string;
}

export class AdminUserActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
export class AdminUserStatusDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  status: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}
export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  interests?: string[];

  @IsOptional()
  badges?: string[];

  @IsOptional()
  marketingOptIn?: boolean | string;

  @IsOptional()
  verified?: boolean | string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  subscriptionPlan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  lang?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  riskLevel?: string;
}