// services/api/src/modules/posts/posts.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('posts')
@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@CurrentUser() user: any, @Body() dto: CreatePostDto) {
    const currentUserId = user?.id ?? user?.sub;
    const post = await this.postsService.create(currentUserId, dto);
    return {
      ok: true,
      data: post,
    };
  }

  @Get('posts')
  async listAllPosts(
    @CurrentUser() user: any,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    const currentUserId = user?.id ?? user?.sub;
    const takeNum = take ? parseInt(take, 10) : 20;
    const result = await this.postsService.listAll(currentUserId, cursor, takeNum);
    return {
      ok: true,
      data: result,
    };
  }

  @Get('topics/:id/posts')
  async listByTopic(
    @CurrentUser() user: any,
    @Param('id') topicId: string,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    const currentUserId = user?.id ?? user?.sub;
    const takeNum = take ? parseInt(take, 10) : 20;
    const result = await this.postsService.listByTopic(
      topicId,
      currentUserId,
      cursor,
      takeNum,
    );
    return {
      ok: true,
      data: result,
    };
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async delete(@CurrentUser() user: any, @Param('id') postId: string) {
    const currentUserId = user?.id ?? user?.sub;
    const result = await this.postsService.delete(currentUserId, postId);
    return {
      ok: true,
      data: result,
    };
  }
}
