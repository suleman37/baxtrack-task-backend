import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function comparePassword(
  password: string,
  storedPassword: string,
): Promise<boolean> {
  if (!storedPassword.includes(':')) {
    return storedPassword === password;
  }

  const [salt, storedHash] = storedPassword.split(':');
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return derivedKey.toString('hex') === storedHash;
}
