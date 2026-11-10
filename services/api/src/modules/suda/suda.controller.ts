import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SudaService } from './suda.service';
import { CreateSudaPostDto } from './dto/suda.dto';
import { Public } from '../auth/public.decorator';

@ApiTags('Suda (실시간 1줄 동네 토크)')
@Controller(['suda', 'posts'])
export class SudaController {
  constructor(private readonly sudaService: SudaService) {}

  @Public()
  @Get('topics')
  @ApiOperation({ summary: '동네 수다 토픽 카테고리 목록' })
  async getTopics() {
    const list = [
      { id: 'topic_daily', name: '일상 / 수다 ☕', postsCount: 14 },
      { id: 'topic_friend', name: '동네 친구 찾기 🤝', postsCount: 9 },
      { id: 'topic_hobby', name: '취미 / 운동 🎨', postsCount: 8 },
      { id: 'topic_hot', name: '인기 이야기 🔥', postsCount: 12 },
    ];
    return { ok: true, data: list, items: list };
  }

  @Public()
  @Get(['', 'posts'])
  @ApiOperation({ summary: '1줄 수다 토크 목록 조회' })
  async listPosts(
    @Query('neighborhood') neighborhood?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sudaService.listPosts({
      neighborhood,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 30,
    });
  }

  @Public()
  @Get('posts/:id')
  @ApiOperation({ summary: '1줄 수다 토크 단건 상세 조회' })
  async getPost(@Param('id') id: string) {
    return this.sudaService.getPost(id);
  }

  @Post('posts')
  @ApiBearerAuth()
  @ApiOperation({ summary: '1줄 수다 토크 작성' })
  async createPost(@Req() req: any, @Body() dto: CreateSudaPostDto) {
    const userId = req.user?.id || req.user?.sub;
    return this.sudaService.createPost(userId, dto);
  }

  @Public()
  @Post('posts/:id/like')
  @ApiOperation({ summary: '1줄 수다 토크 공감(+1) 클릭' })
  async likePost(@Param('id') id: string) {
    return this.sudaService.likePost(id);
  }

  @Delete('posts/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '1줄 수다 토크 삭제 (작성자 본인)' })
  async deletePost(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id || req.user?.sub;
    return this.sudaService.deletePost(userId, id);
  }
}
