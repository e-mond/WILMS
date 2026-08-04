import bcrypt from 'bcrypt';

const BCRYPT_HASH_PREFIX = '$2';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith(BCRYPT_HASH_PREFIX)) {
    return bcrypt.compare(password, storedHash);
  }

  return storedHash === password;
}
