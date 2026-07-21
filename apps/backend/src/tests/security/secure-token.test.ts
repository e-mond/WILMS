import { describe, expect, it } from 'vitest';
import { generateRawToken, hashToken, secureCompare } from '../../lib/secure-token.js';

describe('secure-token helpers', () => {
  it('hashes and compares in constant-time style', () => {
    const raw = generateRawToken(16);
    const hashed = hashToken(raw);
    expect(secureCompare(hashed, hashToken(raw))).toBe(true);
    expect(secureCompare(hashed, hashToken(`${raw}x`))).toBe(false);
  });
});
