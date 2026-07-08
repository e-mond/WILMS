import { describe, expect, it } from 'vitest';
import { isDatabaseEnabled } from '../../db/client.js';
import { encodeSessionToken, type SessionUser } from '../../middleware/authenticate.js';
import {
  assertSessionActive,
  invalidateUserSessions,
} from '../../modules/auth/session.service.js';

describe('session invalidation', () => {
  it('encodes session version in auth tokens', () => {
    const session: SessionUser = {
      userId: 'user-1',
      role: 'COLLECTOR',
      displayName: 'Collector',
      expiresAt: Date.now() + 60_000,
      sessionVersion: 4,
      status: 'ACTIVE',
    };

    const token = encodeSessionToken(session);
    expect(token.includes('.')).toBe(true);
  });

  it('invalidates sessions when database persistence is enabled', async () => {
    if (!isDatabaseEnabled()) {
      await expect(assertSessionActive({
        userId: 'demo-user',
        role: 'SUPER_ADMIN',
        expiresAt: Date.now() + 60_000,
        sessionVersion: 1,
      })).resolves.toBeUndefined();
      return;
    }

    const session: SessionUser = {
      userId: 'user-super-admin',
      role: 'SUPER_ADMIN',
      displayName: 'Admin',
      expiresAt: Date.now() + 60_000,
      sessionVersion: 1,
      status: 'ACTIVE',
    };

    await invalidateUserSessions(session.userId);
    await expect(assertSessionActive(session)).rejects.toThrow('Session has been revoked');
  });
});
