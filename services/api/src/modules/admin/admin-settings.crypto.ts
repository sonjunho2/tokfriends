import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const LEGACY_FORMAT_VERSION = 'v1';
const FORMAT_VERSION = 'v2';
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

function getEncryptionKey(envName: 'ADMIN_SETTINGS_ENCRYPTION_KEY'): Buffer;
function getEncryptionKey(envName: 'ADMIN_SETTINGS_ENCRYPTION_KEY_PREVIOUS'): Buffer | null;
function getEncryptionKey(envName: 'ADMIN_SETTINGS_ENCRYPTION_KEY' | 'ADMIN_SETTINGS_ENCRYPTION_KEY_PREVIOUS'): Buffer | null {
  const encoded = process.env[envName]?.trim();

  if (!encoded) {
    if (envName === 'ADMIN_SETTINGS_ENCRYPTION_KEY') {
      throw new Error('ADMIN_SETTINGS_ENCRYPTION_KEY is required');
    }

    return null;
  }

  if (!BASE64_PATTERN.test(encoded)) {
    throw new Error(`${envName} must be valid Base64`);
  }

  const key = Buffer.from(encoded, 'base64');

  if (key.toString('base64') !== encoded) {
    throw new Error(`${envName} must be valid Base64`);
  }

  if (key.length !== KEY_LENGTH) {
    throw new Error(`${envName} must decode to ${KEY_LENGTH} bytes`);
  }

  return key;
}

function getAdditionalAuthenticatedData(settingId: string): Buffer {
  if (!settingId) {
    throw new Error('Admin integration setting id is required');
  }

  return Buffer.from(`admin-integration:${settingId}`, 'utf8');
}

function decryptWithKey(
  key: Buffer,
  version: string,
  iv: Buffer,
  authTag: Buffer,
  encrypted: Buffer,
  settingId: string,
): string {
  const decipher = createDecipheriv(ALGORITHM, key, iv);

  if (version === FORMAT_VERSION) {
    decipher.setAAD(getAdditionalAuthenticatedData(settingId));
  }

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function encryptAdminSettingValue(
  value: string,
  settingId: string,
): string {
  const key = getEncryptionKey('ADMIN_SETTINGS_ENCRYPTION_KEY');
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  cipher.setAAD(getAdditionalAuthenticatedData(settingId));

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

export function decryptAdminSettingValue(
  payload: string,
  settingId: string,
): string {
  const [version, ivEncoded, authTagEncoded, encryptedEncoded] =
    payload.split(':');

  if (
    (version !== LEGACY_FORMAT_VERSION && version !== FORMAT_VERSION) ||
    !ivEncoded ||
    !authTagEncoded ||
    encryptedEncoded === undefined
  ) {
    throw new Error('Invalid encrypted admin setting format');
  }

  const currentKey = getEncryptionKey('ADMIN_SETTINGS_ENCRYPTION_KEY');
  const iv = Buffer.from(ivEncoded, 'base64');
  const authTag = Buffer.from(authTagEncoded, 'base64');
  const encrypted = Buffer.from(encryptedEncoded, 'base64');

  if (iv.length !== IV_LENGTH) {
    throw new Error('Invalid encrypted admin setting IV');
  }

  try {
    return decryptWithKey(
      currentKey,
      version,
      iv,
      authTag,
      encrypted,
      settingId,
    );
  } catch (currentKeyError) {
    const previousKey = getEncryptionKey(
      'ADMIN_SETTINGS_ENCRYPTION_KEY_PREVIOUS',
    );

    if (!previousKey) {
      throw currentKeyError;
    }

    return decryptWithKey(
      previousKey,
      version,
      iv,
      authTag,
      encrypted,
      settingId,
    );
  }
}
