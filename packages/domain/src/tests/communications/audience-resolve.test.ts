import { describe, expect, it } from 'vitest';
import { audienceFilterHelpers, mergeRecipients } from '../../modules/communications/audience.js';
import type { AudienceRecipient } from '../../modules/communications/audience.js';
import { isWithinQuietHours } from '../../modules/notifications/quiet-hours.js';
import { DEDUPE } from '../../infrastructure/notifications/payment-notifications.js';
import { OPS_DEDUPE } from '../../infrastructure/notifications/ops-notifications.js';

describe('audience merge and filters', () => {
  it('merges staff and borrower recipients without duplicates', () => {
    const staff: AudienceRecipient[] = [
      { userId: 'u1', email: 'a@wilms.demo', displayName: 'Admin', phone: '233200000001' },
    ];
    const borrowers: AudienceRecipient[] = [
      { borrowerId: 'b1', displayName: 'Ama', phone: '233200000002', email: 'ama@example.com' },
      { userId: 'u1', email: 'a@wilms.demo', displayName: 'Admin' },
    ];

    const merged = mergeRecipients([staff, borrowers]);
    expect(merged).toHaveLength(2);
    expect(merged.find((row) => row.userId === 'u1')?.phone).toBe('233200000001');
    expect(merged.find((row) => row.borrowerId === 'b1')?.email).toBe('ama@example.com');
  });

  it('parses string arrays from audience filters', () => {
    expect(audienceFilterHelpers.asStringArray(['a', ' b ', '', 3])).toEqual(['a', 'b', '3']);
    expect(audienceFilterHelpers.asStringArray('nope')).toEqual([]);
  });

  it('reads profile email safely', () => {
    expect(audienceFilterHelpers.profileEmail({ email: 'x@y.com' })).toBe('x@y.com');
    expect(audienceFilterHelpers.profileEmail({})).toBeUndefined();
    expect(audienceFilterHelpers.profileEmail(null)).toBeUndefined();
  });
});

describe('quiet hours', () => {
  it('detects quiet window that crosses midnight', () => {
    const prefs = {
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '06:00',
      quietHoursTimezone: 'UTC',
    };
    expect(isWithinQuietHours(prefs, new Date('2026-08-06T23:30:00Z'))).toBe(true);
    expect(isWithinQuietHours(prefs, new Date('2026-08-06T12:00:00Z'))).toBe(false);
  });

  it('ignores quiet hours when disabled', () => {
    expect(
      isWithinQuietHours(
        {
          quietHoursEnabled: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '06:00',
          quietHoursTimezone: 'UTC',
        },
        new Date('2026-08-06T23:30:00Z'),
      ),
    ).toBe(false);
  });
});

describe('notification dedupe keys', () => {
  it('keeps due-soon and due-today distinct', () => {
    expect(DEDUPE.paymentDueSoon('loan-1', '2026-08-06')).not.toBe(
      DEDUPE.paymentDueToday('loan-1', '2026-08-06'),
    );
  });

  it('builds operational dedupe keys', () => {
    expect(OPS_DEDUPE.reconReminder('c1', '2026-08-06')).toContain('recon-reminder');
    expect(OPS_DEDUPE.highVariance('r1')).toContain('high-variance');
  });
});
