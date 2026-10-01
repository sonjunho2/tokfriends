// services/api/src/modules/posts/dto/create-post.dto.ts
import { IsArray, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsOptional()
  topicId?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)
  content: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mediaUrls?: string[];
}