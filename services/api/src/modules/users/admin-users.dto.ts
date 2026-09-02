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