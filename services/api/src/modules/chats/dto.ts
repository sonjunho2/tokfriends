import { Type } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  clientMessageId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  type?: string;
}

export class DirectChatDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  targetAccountId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  targetUserId?: string;
}

export class ChatMessagesQueryDto {
  @IsOptional()
  @IsString()
  cursorCreatedAt?: string;

  @IsOptional()
  @IsString()
  cursorId?: string;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class SendGiftDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  giftId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  clientMessageId?: string;
}
