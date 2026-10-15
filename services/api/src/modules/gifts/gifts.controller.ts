import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { Public } from '../auth/public.decorator';
import { GiftsService } from './gifts.service';

@ApiTags('gifts')
@Controller('gifts')
export class GiftsController {
  constructor(private readonly gifts: GiftsService) {}

  @Public()
  @Get()
  async list(
    @Query('category') category?: string,
    @Query('context') context?: 'chat' | 'live',
  ) {
    const items = await this.gifts.listActive({ category, context });
    return { ok: true, data: items, items };
  }

  // ===== 관리자(Admin) 전용 엔드포인트 =====
  @Public()
  @Get('admin/list')
  async listAdmin() {
    const items = await this.gifts.listAllForAdmin();
    return { ok: true, data: items, items };
  }

  @Public()
  @Get('admin/stats')
  async statsAdmin() {
    const stats = await this.gifts.getGiftStats();
    return { ok: true, data: stats };
  }

  @Public()
  @Post('admin')
  async createAdmin(@Body() dto: any) {
    const item = await this.gifts.createGift(dto);
    return { ok: true, data: item };
  }

  @Public()
  @Patch('admin/:id')
  async updateAdmin(@Param('id') id: string, @Body() dto: any) {
    const item = await this.gifts.updateGift(id, dto);
    return { ok: true, data: item };
  }

  @Public()
  @Delete('admin/:id')
  async deleteAdmin(@Param('id') id: string) {
    await this.gifts.deleteGift(id);
    return { ok: true, message: '선물이 삭제되었습니다.' };
  }

  /**
   * 3D MP4 영상 및 썸네일 이미지 파일 업로드 엔드포인트
   */
  @Public()
  @Post('admin/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      return { ok: false, message: '파일이 제공되지 않았습니다.' };
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'gifts');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.originalname) || (file.mimetype.includes('video') ? '.mp4' : '.png');
    const safeName = `gift_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = path.join(uploadDir, safeName);

    fs.writeFileSync(filePath, file.buffer);

    // 정적 서빙 경로 URL 반환
    const publicUrl = `/uploads/gifts/${safeName}`;

    return {
      ok: true,
      url: publicUrl,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
