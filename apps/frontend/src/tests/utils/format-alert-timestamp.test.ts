import { describe, expect, it } from 'vitest';
import { formatAlertTimestamp } from '@/utils/format-alert-timestamp';

describe('formatAlertTimestamp', () => {
  it('formats recent alerts with relative and absolute labels', () => {
    const now = new Date('2026-06-08T12:00:00.000Z');
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60_000).toISOString();

    expect(formatAlertTimestamp(twoMinutesAgo, now)).toEqual({
      relative: '2 mins ago',
      absolute: expect.stringMatching(/^Today /),
    });
  });

  it('labels yesterday alerts', () => {
    const now = new Date('2026-06-08T12:00:00.000Z');
    const yesterday = new Date('2026-06-07T10:15:00.000Z').toISOString();

    expect(formatAlertTimestamp(yesterday, now)).toMatchObject({
      relative: 'Yesterday',
      absolute: expect.stringContaining('Yesterday'),
    });
  });
});
