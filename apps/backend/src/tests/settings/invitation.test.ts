import { describe, expect, it } from 'vitest';
import { isUniqueViolation, mapDatabaseError } from '../../lib/db-errors.js';
import { buildUserInvitationEmail } from '../../infrastructure/notifications/templates.js';

describe('db-errors', () => {
  it('detects unique violations', () => {
    expect(isUniqueViolation({ code: '23505', detail: 'Key (email)=(a@b.com) already exists.' })).toBe(
      true,
    );
  });

  it('maps email unique violations to validation errors', () => {
    const mapped = mapDatabaseError({
      code: '23505',
      detail: 'Key (email)=(user@example.com) already exists.',
    });
    expect(mapped?.message).toContain('email already exists');
  });
});

describe('buildUserInvitationEmail', () => {
  it('includes expiry and support details', () => {
    const expiresAt = new Date('2026-07-14T00:00:00.000Z');
    const template = buildUserInvitationEmail({
      displayName: 'Ama Serwaa',
      email: 'ama@example.com',
      temporaryPassword: 'ChangeMe1!',
      expiresAt,
    });

    expect(template.subject).toContain('invited');
    expect(template.text).toContain('2026-07-14');
    expect(template.html).toContain('support@wilms.org');
    expect(template.html).toContain('Accept Invitation');
  });
});
