// services/api/src/modules/posts/dto/create-post.dto.ts
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CreatePostDto {
 @IsString()
 @IsNotEmpty()
 topicId: string;

 @IsString()
 @IsNotEmpty()
 @Length(1, 1000)
 content: string;
}