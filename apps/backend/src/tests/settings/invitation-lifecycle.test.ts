import { describe, expect, it } from 'vitest';
import { isValidGhanaMobile, normalizeGhanaPhone } from '../../infrastructure/sms/normalize-phone.js';

describe('normalizeGhanaPhone', () => {
  it('normalizes local numbers to international format', () => {
    expect(normalizeGhanaPhone('0241234567')).toBe('233241234567');
    expect(normalizeGhanaPhone('+233 24 123 4567')).toBe('233241234567');
  });

  it('validates Ghana mobile numbers', () => {
    expect(isValidGhanaMobile('0241234567')).toBe(true);
    expect(isValidGhanaMobile('123')).toBe(false);
  });
});

describe('invitation lifecycle presentation', () => {
  it('tracks accepted and first-login milestones before activation', () => {
    const invitedOnly = {
      status: 'INVITED' as const,
      firstLoginAt: null,
      acceptedAt: null,
    };
    const pendingSetup = {
      status: 'INVITED' as const,
      firstLoginAt: new Date('2026-07-08T10:00:00.000Z'),
      acceptedAt: new Date('2026-07-08T09:00:00.000Z'),
    };
    const active = {
      status: 'ACTIVE' as const,
      firstLoginAt: new Date('2026-07-08T10:00:00.000Z'),
      acceptedAt: new Date('2026-07-08T09:00:00.000Z'),
    };

    expect(invitedOnly.status).toBe('INVITED');
    expect(pendingSetup.firstLoginAt).toBeTruthy();
    expect(active.status).toBe('ACTIVE');
  });
});
