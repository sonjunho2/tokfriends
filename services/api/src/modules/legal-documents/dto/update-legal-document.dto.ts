import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateLegalDocumentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  updatedBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  memo?: string;
}