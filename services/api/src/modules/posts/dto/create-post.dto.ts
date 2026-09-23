// services/api/src/modules/posts/dto/create-post.dto.ts
import { IsString, IsNotEmpty, Length, IsOptional } from 'class-validator';

export class CreatePostDto {
 @IsString()
 @IsOptional()
 topicId?: string;

 @IsString()
 @IsNotEmpty()
 @Length(1, 1000)
 content: string;
}