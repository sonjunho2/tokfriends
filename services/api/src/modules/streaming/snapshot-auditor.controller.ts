import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Get,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { SnapshotAuditorService } from './snapshot-auditor.service';
import { Public } from '../auth/public.decorator';

@ApiTags('streaming')
@Controller('streaming')
export class SnapshotAuditorController {
  constructor(private readonly snapshotAuditor: SnapshotAuditorService) {}

  /**
   * Agora Cloud Recording Image Capture 웹훅 수신 핸들러 (평시 20초 주기)
   */
  @Public()
  @Post('webhook/snapshot')
  @UseInterceptors(FileInterceptor('image'))
  async handleAgoraSnapshot(
    @UploadedFile() file: { buffer: Buffer; mimetype: string } | any,
    @Body() body: { channelId: string; hostId: string },
  ) {
    const channelId = body.channelId || 'default_channel';
    const hostId = body.hostId || 'default_host';
    const buffer = file ? file.buffer : Buffer.from('');
    const mimeType = file ? file.mimetype : 'image/jpeg';

    const result = await this.snapshotAuditor.handleSnapshotWebhook({
      channelId,
      hostId,
      imageBuffer: buffer,
      mimeType,
    });

    return {
      ok: true,
      data: result,
      currentIntervalSec: this.snapshotAuditor.getChannelCaptureInterval(channelId),
    };
  }

  /**
   * 채널의 현재 캡처 주기 조회
   */
  @Public()
  @Get('channel/:channelId/interval')
  getInterval(@Param('channelId') channelId: string) {
    return {
      ok: true,
      intervalSec: this.snapshotAuditor.getChannelCaptureInterval(channelId),
    };
  }
}
