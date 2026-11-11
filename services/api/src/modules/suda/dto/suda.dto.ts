import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsNumber } from 'class-validator';

export class CreateSudaPostDto {
  @ApiPropertyOptional({ description: '수다방 제목', example: '오늘 퇴근 후 강남역 맥주 한잔 🍺' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: '1줄 수다 본문 (최대 200자)', example: '오늘 날씨가 정말 화창하네요! 커피 한잔 어떠세요?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  content!: string;

  @ApiPropertyOptional({ description: '수다방 입장료 (꿀떡)', example: 500 })
  @IsOptional()
  @IsNumber()
  entryFee?: number;

  @ApiProperty({ description: '작성자 동네 (예: 역삼동)', example: '역삼1동' })
  @IsString()
  @IsNotEmpty()
  neighborhood!: string;

  @ApiPropertyOptional({ description: '위도', example: 37.4979 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: '경도', example: 127.0276 })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
