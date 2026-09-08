import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const EXTENSIONS_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

type UploadFile = {
  buffer?: Buffer;
  mimetype?: string;
  size?: number;
};

@Injectable()
export class MediaService {
  async uploadAvatar(userId: string, file?: UploadFile) {
    const normalizedUserId = String(userId || '')
      .replace(/[^0-9a-zA-Z_-]/g, '');

    if (!normalizedUserId) {
      throw new BadRequestException('Authenticated user is required.');
    }

    if (!file?.buffer || !file?.mimetype || !file?.size) {
      throw new BadRequestException('Image file is required.');
    }

    const extension = EXTENSIONS_BY_CONTENT_TYPE[file.mimetype];

    if (!extension) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP images are supported.',
      );
    }

    if (file.size > MAX_AVATAR_BYTES) {
      throw new PayloadTooLargeException(
        'Avatar image must be 5 MB or smaller.',
      );
    }

    const region = process.env.AWS_REGION || 'ap-northeast-2';
    const bucket = process.env.S3_MEDIA_BUCKET?.trim();
    const publicBaseUrl =
      process.env.S3_MEDIA_PUBLIC_BASE_URL?.trim().replace(/\/+$/, '');

    if (!bucket || !publicBaseUrl) {
      throw new ServiceUnavailableException(
        'Media storage is not configured.',
      );
    }

    const key =
      `avatars/${normalizedUserId}/${randomUUID()}.${extension}`;

    const client = new S3Client({ region });

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return {
      ok: true,
      data: {
        key,
        url: `${publicBaseUrl}/${key}`,
        contentType: file.mimetype,
        size: file.size,
      },
    };
  }
}
