/**
 * Deterministic PIN hash keyed by user id — avoids storing plaintext PINs in localStorage.
 * Uses FNV-1a for synchronous use in tests and Zustand actions.
 */
export function hashPinSync(pin: string, userId: string): string {
  const input = `${userId}:${pin}`;
  let hash = 2_166_136_261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function verifyPinSync(pin: string, userId: string, storedHash: string): boolean {
  return hashPinSync(pin, userId) === storedHash;
}
