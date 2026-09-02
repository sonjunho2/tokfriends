import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

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
  @IsString()
  @IsNotEmpty()
  targetUserId: string;
}