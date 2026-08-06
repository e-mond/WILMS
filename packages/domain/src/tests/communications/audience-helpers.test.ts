import { describe, expect, it } from 'vitest';
import { isWithinQuietHours } from '../../modules/notifications/quiet-hours.js';
import { mergeRecipients, audienceFilterHelpers } from '../../modules/communications/audience.js';
import type { AudienceRecipient } from '../../modules/communications/audience.js';

describe('quiet-hours', () => {
  it('detects overnight quiet window in UTC', () => {
    expect(
      isWithinQuietHours(
        {
          quietHoursEnabled: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '06:00',
          quietHoursTimezone: 'UTC',
        },
        new Date('2026-08-06T23:30:00Z'),
      ),
    ).toBe(true);
  });
});

describe('audience helpers', () => {
  it('merges recipients by identity', () => {
    const a: AudienceRecipient[] = [{ userId: 'u1', displayName: 'A', email: 'a@x.com' }];
    const b: AudienceRecipient[] = [
      { userId: 'u1', displayName: 'A', phone: '1' },
      { borrowerId: 'b1', displayName: 'B', phone: '2' },
    ];
    expect(mergeRecipients([a, b])).toHaveLength(2);
  });

  it('normalizes filter arrays', () => {
    expect(audienceFilterHelpers.asStringArray(['x', ' y '])).toEqual(['x', 'y']);
  });
});
