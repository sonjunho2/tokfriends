// services/api/src/modules/live/dto.ts
import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateLiveRoomDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 80)
  title: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  coverUri?: string;
}

export class SendLiveMessageDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  content: string;

  @IsString()
  @IsOptional()
  type?: 'chat' | 'gift' | 'like' | 'join';

  @IsInt()
  @IsOptional()
  @Min(1)
  giftPoints?: number;
}
