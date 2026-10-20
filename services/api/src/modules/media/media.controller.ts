import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  Req,
  Res,
  Body,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../auth/public.decorator';
import type { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);
  private readonly uploadDir = path.join(process.cwd(), 'data', 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  @Public()
  @Post(['avatar', 'chat', 'post', 'upload'])
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile() file: any,
    @Body() body: any,
    @Req() req: Request,
  ) {
    let filename = `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;

    if (file && file.buffer) {
      if (file.originalname) {
        const ext = path.extname(file.originalname) || '.jpg';
        filename = `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
      }
      fs.writeFileSync(path.join(this.uploadDir, filename), file.buffer);
      this.logger.log(`Uploaded media file saved: ${filename} (${file.size || file.buffer.length} bytes)`);
    } else if (body?.url || body?.uri || body?.imageUrl) {
      const directUrl = body.url || body.uri || body.imageUrl;
      return {
        ok: true,
        url: directUrl,
        data: { url: directUrl },
      };
    }

    const host = req.get('host') || 'localhost:4000';
    const protocol = req.protocol || 'http';
    const fileUrl = `${protocol}://${host}/v1/media/files/${filename}`;

    return {
      ok: true,
      url: fileUrl,
      data: {
        url: fileUrl,
        filename,
      },
    };
  }

  @Public()
  @Get('files/:filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.join(this.uploadDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ ok: false, message: '파일을 찾을 수 없습니다.' });
    }
    return res.sendFile(filePath);
  }
}
