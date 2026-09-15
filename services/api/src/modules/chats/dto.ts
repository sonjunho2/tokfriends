import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content: string;
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
