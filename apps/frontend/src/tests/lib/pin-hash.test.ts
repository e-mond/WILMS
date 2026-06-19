import { describe, expect, it } from 'vitest';
import { hashPinSync, verifyPinSync } from '@/lib/security/pin-hash';

describe('pin-hash', () => {
  it('hashes deterministically per user', () => {
    const first = hashPinSync('123456', 'user-collector');
    const second = hashPinSync('123456', 'user-collector');

    expect(first).toBe(second);
    expect(first).not.toBe(hashPinSync('123456', 'user-officer'));
  });

  it('verifies matching pins', () => {
    const hash = hashPinSync('654321', 'user-collector');

    expect(verifyPinSync('654321', 'user-collector', hash)).toBe(true);
    expect(verifyPinSync('000000', 'user-collector', hash)).toBe(false);
  });
});
