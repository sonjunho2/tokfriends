import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

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
const ADMIN_TEAM_ROLES = [
  'SUPER_ADMIN',
  'MANAGER',
  'MODERATOR',
  'SUPPORT',
  'EDITOR',
  'VIEWER',
] as const;

const ADMIN_TEAM_STATUSES = ['ACTIVE', 'SUSPENDED'] as const;

export class CreateAdminTeamMemberDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsIn(ADMIN_TEAM_ROLES)
  role?: (typeof ADMIN_TEAM_ROLES)[number];

  @IsOptional()
  @IsIn(ADMIN_TEAM_STATUSES)
  status?: (typeof ADMIN_TEAM_STATUSES)[number];

  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsBoolean()
  twoFactor?: boolean;
}

export class UpdateAdminTeamMemberDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsIn(ADMIN_TEAM_ROLES)
  role?: (typeof ADMIN_TEAM_ROLES)[number];

  @IsOptional()
  @IsIn(ADMIN_TEAM_STATUSES)
  status?: (typeof ADMIN_TEAM_STATUSES)[number];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsBoolean()
  twoFactor?: boolean;
}

export class UpdateAdminTeamMemberPasswordDto {
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
export class UpdateAdminFeatureFlagDto {
  @IsBoolean()
  enabled: boolean;
}

export class UpdateAdminIntegrationSettingDto {
  @IsString()
  @MaxLength(10000)
  value: string;
}

export class SaveAdminAuditMemoDto {
  @IsString()
  @MaxLength(5000)
  memo: string;
}
