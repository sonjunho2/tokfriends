// services/api/src/modules/posts/posts.controller.ts
import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('posts')
@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@Request() req: any, @Body() dto: CreatePostDto) {
    return this.postsService.create(req.user.id, dto);
  }

  @Get('posts')
  async listAllPosts(
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    const takeNum = take ? parseInt(take, 10) : 20;
    return this.postsService.listAll(cursor, takeNum);
  }

  @Get('topics/:id/posts')
  async listByTopic(
    @Param('id') topicId: string,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    const takeNum = take ? parseInt(take, 10) : 20;
    return this.postsService.listByTopic(topicId, cursor, takeNum);
  }
}
