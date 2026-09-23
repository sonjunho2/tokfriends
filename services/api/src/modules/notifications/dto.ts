import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class RegisterDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  token: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  platform: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  locale?: string;
}

export class UnregisterDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  token: string;
}
