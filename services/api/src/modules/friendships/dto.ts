import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendFriendRequestDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  addresseeId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  targetAccountId?: string;
}