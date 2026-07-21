import { afterEach, describe, expect, it } from 'vitest';
import {
  __resetInvitationTokensForTests,
  consumeInvitationToken,
  issueInvitationToken,
  revokeInvitationTokensForUser,
} from '../../modules/auth/invitation-token.service.js';
import { hashToken } from '../../lib/secure-token.js';

describe('invitation tokens', () => {
  afterEach(() => {
    __resetInvitationTokensForTests();
  });

  it('issues a raw token that can be consumed once', async () => {
    const issued = await issueInvitationToken({ userId: 'user-1' });
    expect(issued.rawToken.length).toBeGreaterThanOrEqual(64);
    expect(hashToken(issued.rawToken)).toMatch(/^[a-f0-9]{64}$/);

    const first = await consumeInvitationToken({ token: issued.rawToken });
    expect(first.userId).toBe('user-1');

    await expect(consumeInvitationToken({ token: issued.rawToken })).rejects.toThrow(/VALIDATION:/);
  });

  it('rejects revoked tokens', async () => {
    const issued = await issueInvitationToken({ userId: 'user-2' });
    await revokeInvitationTokensForUser('user-2');
    await expect(consumeInvitationToken({ token: issued.rawToken })).rejects.toThrow(/VALIDATION:/);
  });

  it('rejects malformed tokens', async () => {
    await expect(consumeInvitationToken({ token: 'short' })).rejects.toThrow(/VALIDATION:/);
  });

  it('resend revokes prior outstanding tokens', async () => {
    const first = await issueInvitationToken({ userId: 'user-3' });
    const second = await issueInvitationToken({ userId: 'user-3' });
    await expect(consumeInvitationToken({ token: first.rawToken })).rejects.toThrow(/VALIDATION:/);
    const ok = await consumeInvitationToken({ token: second.rawToken });
    expect(ok.userId).toBe('user-3');
  });
});
