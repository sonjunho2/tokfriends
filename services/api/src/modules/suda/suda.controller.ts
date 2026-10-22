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
@Controller('suda')
export class SudaController {
  constructor(private readonly sudaService: SudaService) {}

  @Public()
  @Get('posts')
  @ApiOperation({ summary: '1줄 수다 토크 목록 조회' })
  @ApiQuery({ name: 'neighborhood', required: false, description: '동네 필터 (예: 역삼동)' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 크기' })
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
