import { describe, expect, it } from 'vitest';
import { USER_ROLE } from '@/constants/roles';
import {
  decodeSessionPayload,
  encodeSessionPayload,
  isSessionPayloadValid,
  parseSessionCookie,
  parseSessionCookieState,
} from '@/lib/auth/session';

describe('session', () => {
  it('encodes and decodes a valid session payload', () => {
    const payload = {
      userId: 'user-1',
      role: USER_ROLE.COLLECTOR,
      displayName: 'Ama Collector',
      expiresAt: Date.now() + 60_000,
    };

    const encoded = encodeSessionPayload(payload);
    const decoded = decodeSessionPayload(encoded);

    expect(decoded).toEqual(payload);
  });

  it('rejects expired sessions', () => {
    const payload = {
      userId: 'user-1',
      role: USER_ROLE.COLLECTOR,
      expiresAt: Date.now() - 1,
    };

    expect(isSessionPayloadValid(payload)).toBe(false);
    expect(parseSessionCookie(encodeSessionPayload(payload))).toBeNull();
  });

  it('rejects malformed cookie values', () => {
    expect(parseSessionCookie('not-valid')).toBeNull();
    expect(parseSessionCookie(undefined)).toBeNull();
  });

  it('distinguishes expired cookies from missing cookies', () => {
    const expiredPayload = {
      userId: 'user-1',
      role: USER_ROLE.COLLECTOR,
      expiresAt: Date.now() - 1,
    };
    const encoded = encodeSessionPayload(expiredPayload);

    expect(parseSessionCookieState(encoded)).toEqual({
      status: 'expired',
      payload: expiredPayload,
    });
    expect(parseSessionCookieState(undefined)).toEqual({ status: 'missing' });
  });
});
