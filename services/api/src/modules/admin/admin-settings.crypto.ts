import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const FORMAT_VERSION = 'v1';
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

function getEncryptionKey(): Buffer {
  const encoded = process.env.ADMIN_SETTINGS_ENCRYPTION_KEY?.trim();

  if (!encoded) {
    throw new Error('ADMIN_SETTINGS_ENCRYPTION_KEY is required');
  }

  if (!BASE64_PATTERN.test(encoded)) {
    throw new Error('ADMIN_SETTINGS_ENCRYPTION_KEY must be valid Base64');
  }

  let key: Buffer;

  try {
    key = Buffer.from(encoded, 'base64');
  } catch {
    throw new Error('ADMIN_SETTINGS_ENCRYPTION_KEY must be valid Base64');
  }

  if (key.toString('base64') !== encoded) {
    throw new Error('ADMIN_SETTINGS_ENCRYPTION_KEY must be valid Base64');
  }

  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `ADMIN_SETTINGS_ENCRYPTION_KEY must decode to ${KEY_LENGTH} bytes`,
    );
  }

  return key;
}

export function encryptAdminSettingValue(value: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    FORMAT_VERSION,
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
}

export function decryptAdminSettingValue(payload: string): string {
  const [version, ivEncoded, authTagEncoded, encryptedEncoded] =
    payload.split(':');

  if (
    version !== FORMAT_VERSION ||
    !ivEncoded ||
    !authTagEncoded ||
    encryptedEncoded === undefined
  ) {
    throw new Error('Invalid encrypted admin setting format');
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivEncoded, 'base64');
  const authTag = Buffer.from(authTagEncoded, 'base64');
  const encrypted = Buffer.from(encryptedEncoded, 'base64');

  if (iv.length !== IV_LENGTH) {
    throw new Error('Invalid encrypted admin setting IV');
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
