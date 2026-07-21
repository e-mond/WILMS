import { describe, expect, it } from 'vitest';
import {
  computeInvitationExpiresAt,
  INVITATION_EXPIRY_DAYS,
  isInvitationExpired,
} from '../../lib/invitation-expiry.js';

describe('invitation expiry', () => {
  it(`expires invitations after ${INVITATION_EXPIRY_DAYS} days`, () => {
    const invitedAt = new Date('2026-01-01T00:00:00.000Z');
    const expires = computeInvitationExpiresAt(invitedAt);
    expect(expires.toISOString()).toBe('2026-01-08T00:00:00.000Z');
    expect(isInvitationExpired(invitedAt, new Date('2026-01-07T23:59:59.000Z'))).toBe(false);
    expect(isInvitationExpired(invitedAt, new Date('2026-01-08T00:00:01.000Z'))).toBe(true);
  });

  it('treats missing invitedAt as expired (fail closed)', () => {
    expect(isInvitationExpired(null)).toBe(true);
    expect(isInvitationExpired(undefined)).toBe(true);
  });
});
