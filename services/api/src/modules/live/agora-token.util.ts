// services/api/src/modules/live/agora-token.util.ts
import * as crypto from 'crypto';

export enum AgoraRole {
  PUBLISHER = 1, // Host (Video + Audio publish & subscribe)
  SUBSCRIBER = 2, // Viewer (Subscribe only)
}

export enum AgoraPrivilege {
  JOIN_CHANNEL = 1,
  PUBLISH_AUDIO = 2,
  PUBLISH_VIDEO = 3,
  PUBLISH_DATA_STREAM = 4,
}

export interface AgoraTokenOptions {
  appId: string;
  appCertificate?: string;
  channelName: string;
  uid: number;
  role: AgoraRole;
  expireSeconds?: number;
}

export interface AgoraTokenResult {
  appId: string;
  channelName: string;
  uid: number;
  role: 'publisher' | 'subscriber';
  token: string;
  expiresAt: number;
  isFallback: boolean;
}

/**
 * Maps a string/UUID user ID to a deterministic 32-bit positive integer for Agora RTC.
 */
export function userIdToAgoraUid(userId: string): number {
  if (!userId) return 100001;
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  // Keep within positive 32-bit integer range [1, 2147483647]
  const positive = Math.abs(hash);
  return positive === 0 ? 100001 : positive;
}

function crc32(buf: Buffer): number {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (~crc) >>> 0;
}

class ByteBuf {
  private buffer: Buffer;
  private position: number;

  constructor(initialSize = 1024) {
    this.buffer = Buffer.alloc(initialSize);
    this.position = 0;
  }

  putUint16(v: number): this {
    this.ensureCapacity(2);
    this.buffer.writeUInt16LE(v, this.position);
    this.position += 2;
    return this;
  }

  putUint32(v: number): this {
    this.ensureCapacity(4);
    this.buffer.writeUInt32LE(v, this.position);
    this.position += 4;
    return this;
  }

  putBytes(bytes: Buffer): this {
    this.putUint16(bytes.length);
    this.ensureCapacity(bytes.length);
    bytes.copy(this.buffer, this.position);
    this.position += bytes.length;
    return this;
  }

  putString(str: string): this {
    return this.putBytes(Buffer.from(str, 'utf8'));
  }

  putTreeMap(map: Record<number, number>): this {
    const keys = Object.keys(map)
      .map(Number)
      .sort((a, b) => a - b);
    this.putUint16(keys.length);
    for (const k of keys) {
      this.putUint16(k);
      this.putUint32(map[k]);
    }
    return this;
  }

  private ensureCapacity(size: number) {
    if (this.position + size > this.buffer.length) {
      const newBuf = Buffer.alloc(
        Math.max(this.buffer.length * 2, this.position + size),
      );
      this.buffer.copy(newBuf);
      this.buffer = newBuf;
    }
  }

  pack(): Buffer {
    return this.buffer.subarray(0, this.position);
  }
}

/**
 * Builds an official Agora AccessToken (006) using native Node.js crypto.
 * When appCertificate is missing or dummy, generates a deterministic development token.
 */
export function buildAgoraToken(options: AgoraTokenOptions): AgoraTokenResult {
  const {
    appId,
    appCertificate,
    channelName,
    uid,
    role,
    expireSeconds = 86400, // 24 hours
  } = options;

  const currentTs = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTs + expireSeconds;
  const roleName: 'publisher' | 'subscriber' =
    role === AgoraRole.PUBLISHER ? 'publisher' : 'subscriber';

  // Fallback mode if certificate is not provided or set to dummy
  if (!appCertificate || !appId || appCertificate === 'dummy' || appId === 'dummy') {
    const fallbackPayload = {
      channelName,
      uid,
      role: roleName,
      issuedAt: currentTs,
      expiresAt: privilegeExpiredTs,
      fallback: true,
    };
    const fallbackToken = `006_dev_${Buffer.from(
      JSON.stringify(fallbackPayload),
    ).toString('base64')}`;

    return {
      appId: appId || 'dagaon_agora_live',
      channelName,
      uid,
      role: roleName,
      token: fallbackToken,
      expiresAt: privilegeExpiredTs,
      isFallback: true,
    };
  }

  // Define privileges based on role
  const privileges: Record<number, number> = {
    [AgoraPrivilege.JOIN_CHANNEL]: privilegeExpiredTs,
  };

  if (role === AgoraRole.PUBLISHER) {
    privileges[AgoraPrivilege.PUBLISH_AUDIO] = privilegeExpiredTs;
    privileges[AgoraPrivilege.PUBLISH_VIDEO] = privilegeExpiredTs;
    privileges[AgoraPrivilege.PUBLISH_DATA_STREAM] = privilegeExpiredTs;
  }

  // Pack message buffer
  const salt = crypto.randomBytes(4).readUInt32LE(0);
  const msgBuf = new ByteBuf()
    .putUint32(salt)
    .putUint32(currentTs)
    .putTreeMap(privileges)
    .pack();

  // Pack signature content: appId + channelName + uid + message
  const signContent = Buffer.concat([
    Buffer.from(appId, 'utf8'),
    Buffer.from(channelName, 'utf8'),
    Buffer.from(String(uid), 'utf8'),
    msgBuf,
  ]);

  const signature = crypto
    .createHmac('sha256', appCertificate)
    .update(signContent)
    .digest();

  const crcChannel = crc32(Buffer.from(channelName, 'utf8'));
  const crcUid = crc32(Buffer.from(String(uid), 'utf8'));

  const packed = new ByteBuf()
    .putBytes(signature)
    .putUint32(crcChannel)
    .putUint32(crcUid)
    .putBytes(msgBuf)
    .pack();

  const token = `006${appId}${packed.toString('base64')}`;

  return {
    appId,
    channelName,
    uid,
    role: roleName,
    token,
    expiresAt: privilegeExpiredTs,
    isFallback: false,
  };
}
