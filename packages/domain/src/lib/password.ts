import bcryptjs from './vendor/bcryptjs/index.js';

const BCRYPT_HASH_PREFIX = '$2';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith(BCRYPT_HASH_PREFIX)) {
    return bcryptjs.compare(password, storedHash);
  }

  return storedHash === password;
}
