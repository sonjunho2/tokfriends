import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/current-user.decorator';
import { MediaService } from './media.service';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

@ApiTags('media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        files: 1,
        fileSize: MAX_AVATAR_BYTES,
      },
    }),
  )
  uploadAvatar(
    @CurrentUser() user: any,
    @UploadedFile() file: any,
  ) {
    const userId = user?.sub ?? user?.id;
    return this.media.uploadAvatar(userId, file);
  }
}
