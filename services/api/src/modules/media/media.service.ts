import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MAX_CHAT_MEDIA_BYTES = 20 * 1024 * 1024;

const EXTENSIONS_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const CHAT_MEDIA_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

type UploadFile = {
  buffer?: Buffer;
  mimetype?: string;
  size?: number;
};

type CloudinaryUploadResponse = {
  public_id?: string;
  secure_url?: string;
  bytes?: number;
  format?: string;
};

@Injectable()
export class MediaService {
  private async uploadToSupabaseStorage(
    folder: string,
    filename: string,
    file: { buffer: Buffer; mimetype: string; size: number },
  ): Promise<{ key: string; url: string } | null> {
    const supabaseUrl = process.env.SUPABASE_URL?.trim()?.replace(/\/+$/, '');
    const serviceRoleKey = (
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
    )?.trim();
    const bucket = (process.env.SUPABASE_STORAGE_BUCKET || 'media').trim();

    if (!supabaseUrl || !serviceRoleKey) {
      return null;
    }

    const objectPath = `${folder}/${filename}`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath}`;

    let response: Response;
    try {
      response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          'Content-Type': file.mimetype,
          'x-upsert': 'true',
        },
        body: new Uint8Array(file.buffer),
      });
    } catch (err: any) {
      throw new ServiceUnavailableException(
        `Supabase Storage is unavailable: ${err?.message || err}`,
      );
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new ServiceUnavailableException(
        `Supabase Storage upload failed (${response.status}): ${errText || response.statusText}`,
      );
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${objectPath}`;
    return {
      key: `${bucket}/${objectPath}`,
      url: publicUrl,
    };
  }

  async uploadAvatar(userId: string, file?: UploadFile) {
    const normalizedUserId = String(userId || '').replace(
      /[^0-9a-zA-Z_-]/g,
      '',
    );

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

    // 1. Supabase Storage 우선 처리
    const filename = `${randomUUID()}.${extension}`;
    const supabaseResult = await this.uploadToSupabaseStorage(
      `avatars/${normalizedUserId}`,
      filename,
      { buffer: file.buffer, mimetype: file.mimetype, size: file.size },
    );

    if (supabaseResult) {
      return {
        ok: true,
        data: {
          key: supabaseResult.key,
          url: supabaseResult.url,
          contentType: file.mimetype,
          size: file.size,
        },
      };
    }

    // 2. Cloudinary 폴백
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException(
        'Media storage is not configured.',
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const publicId =
      `tokfriends/avatars/${normalizedUserId}/${randomUUID()}`;

    const signaturePayload =
      `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;

    const signature = createHash('sha1')
      .update(signaturePayload)
      .digest('hex');

    const body = new URLSearchParams({
      file:
        `data:${file.mimetype};base64,` +
        file.buffer.toString('base64'),
      api_key: apiKey,
      timestamp: String(timestamp),
      public_id: publicId,
      signature,
    });

    let response: Response;

    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(
          cloudName,
        )}/image/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        },
      );
    } catch {
      throw new ServiceUnavailableException(
        'Media storage is unavailable.',
      );
    }

    let uploaded: CloudinaryUploadResponse;

    try {
      uploaded = (await response.json()) as CloudinaryUploadResponse;
    } catch {
      throw new ServiceUnavailableException(
        'Media storage returned an invalid response.',
      );
    }

    if (
      !response.ok ||
      !uploaded.public_id ||
      !uploaded.secure_url
    ) {
      throw new ServiceUnavailableException(
        'Media upload failed.',
      );
    }

    return {
      ok: true,
      data: {
        key: uploaded.public_id,
        url: uploaded.secure_url,
        contentType: file.mimetype,
        size: uploaded.bytes ?? file.size,
      },
    };
  }

  async uploadChatMedia(userId: string, file?: UploadFile) {
    const normalizedUserId = String(userId || '').replace(
      /[^0-9a-zA-Z_-]/g,
      '',
    );

    if (!normalizedUserId) {
      throw new BadRequestException('Authenticated user is required.');
    }

    if (!file?.buffer || !file?.mimetype || !file?.size) {
      throw new BadRequestException('Media file is required.');
    }

    const extension = CHAT_MEDIA_EXTENSIONS[file.mimetype.toLowerCase()];
    if (!extension) {
      throw new BadRequestException(
        'Supported formats: JPEG, PNG, WebP, GIF, MP4, QuickTime, WebM.',
      );
    }

    if (file.size > MAX_CHAT_MEDIA_BYTES) {
      throw new PayloadTooLargeException(
        'Chat media must be 20 MB or smaller.',
      );
    }

    const isVideo = file.mimetype.toLowerCase().startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

    // 1. Supabase Storage 우선 처리
    const filename = `${randomUUID()}.${extension}`;
    const supabaseResult = await this.uploadToSupabaseStorage(
      `chat/${normalizedUserId}`,
      filename,
      { buffer: file.buffer, mimetype: file.mimetype, size: file.size },
    );

    if (supabaseResult) {
      return {
        ok: true,
        data: {
          key: supabaseResult.key,
          url: supabaseResult.url,
          contentType: file.mimetype,
          size: file.size,
          mediaType: resourceType,
        },
      };
    }

    // 2. Cloudinary 폴백
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    if (!cloudName || !apiKey || !apiSecret) {
      const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      return {
        ok: true,
        data: {
          key: `local-${randomUUID()}`,
          url: dataUri,
          contentType: file.mimetype,
          size: file.size,
          mediaType: resourceType,
        },
      };
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `tokfriends/chat/${normalizedUserId}/${randomUUID()}`;

    const signaturePayload = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = createHash('sha1').update(signaturePayload).digest('hex');

    const body = new URLSearchParams({
      file: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      api_key: apiKey,
      timestamp: String(timestamp),
      public_id: publicId,
      signature,
    });

    let response: Response;
    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(
          cloudName,
        )}/${resourceType}/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        },
      );
    } catch {
      throw new ServiceUnavailableException('Media storage is unavailable.');
    }

    let uploaded: CloudinaryUploadResponse;
    try {
      uploaded = (await response.json()) as CloudinaryUploadResponse;
    } catch {
      throw new ServiceUnavailableException('Media storage returned an invalid response.');
    }

    if (!response.ok || !uploaded.public_id || !uploaded.secure_url) {
      throw new ServiceUnavailableException('Media upload failed.');
    }

    return {
      ok: true,
      data: {
        key: uploaded.public_id,
        url: uploaded.secure_url,
        contentType: file.mimetype,
        size: uploaded.bytes ?? file.size,
        mediaType: resourceType,
      },
    };
  }
}
