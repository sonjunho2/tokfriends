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
import { CreateCommentDto } from './dto/create-comment.dto';
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

  @Get('posts/:id/comments')
  async listComments(
    @CurrentUser() user: any,
    @Param('id') postId: string,
  ) {
    const currentUserId = user?.id ?? user?.sub;
    const comments = await this.postsService.listComments(postId, currentUserId);
    return {
      ok: true,
      data: comments,
    };
  }

  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createComment(
    @CurrentUser() user: any,
    @Param('id') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    const currentUserId = user?.id ?? user?.sub;
    const comment = await this.postsService.createComment(
      currentUserId,
      postId,
      dto.content,
    );
    return {
      ok: true,
      data: comment,
    };
  }

  @Delete('posts/:id/comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deleteComment(
    @CurrentUser() user: any,
    @Param('id') postId: string,
    @Param('commentId') commentId: string,
  ) {
    const currentUserId = user?.id ?? user?.sub;
    const result = await this.postsService.deleteComment(
      currentUserId,
      postId,
      commentId,
    );
    return {
      ok: true,
      data: result,
    };
  }
}
