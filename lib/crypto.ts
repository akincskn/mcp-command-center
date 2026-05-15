import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error('ENCRYPTION_KEY environment variable is not set');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes (base64-encoded)');
  return key;
}

// Returns "<iv_base64>:<authTag_base64>:<ciphertext_base64>"
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
}

export function decrypt(encrypted: string): string {
  const key = getKey();
  const parts = encrypted.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted format');

  const [ivB64, authTagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64!, 'base64');
  const authTag = Buffer.from(authTagB64!, 'base64');
  const ciphertext = Buffer.from(ciphertextB64!, 'base64');

  if (authTag.length !== AUTH_TAG_BYTES) throw new Error('Invalid auth tag length');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return decipher.update(ciphertext).toString('utf8') + decipher.final('utf8');
}
