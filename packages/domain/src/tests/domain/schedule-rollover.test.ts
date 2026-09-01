import { describe, expect, it } from 'vitest';
import {
  buildRolloverWeekDrafts,
  resolveNextScheduleDueDate,
} from '../../domain/loan/schedule-rollover.js';

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

describe('buildRolloverWeekDrafts', () => {
  it('appends one rollover week per missed week when rollovers are enabled', () => {
    const existingWeeks = Array.from({ length: 12 }, (_, index) => ({
      weekNumber: index + 1,
      dueDate: addDays('2026-08-16', index * 7),
      status: index < 2 ? 'MISSED' : 'PENDING',
    }));

    const drafts = buildRolloverWeekDrafts({
      existingWeeks,
      durationWeeks: 12,
      weeklyPaymentPesewas: 250_000,
      allowRollovers: true,
    });

    expect(drafts).toHaveLength(2);
    expect(drafts[0]).toMatchObject({ weekNumber: 13, status: 'PENDING', amountPesewas: 250_000 });
    expect(drafts[1]?.weekNumber).toBe(14);
  });

  it('does nothing when rollovers are disabled', () => {
    const drafts = buildRolloverWeekDrafts({
      existingWeeks: [{ weekNumber: 1, dueDate: '2026-08-16', status: 'MISSED' }],
      durationWeeks: 12,
      weeklyPaymentPesewas: 250_000,
      allowRollovers: false,
    });

    expect(drafts).toEqual([]);
  });

  it('backfills rollover weeks for short schedules already in arrears', () => {
    const drafts = buildRolloverWeekDrafts({
      existingWeeks: [
        { weekNumber: 1, dueDate: '2026-08-16', status: 'MISSED' },
        { weekNumber: 2, dueDate: '2026-08-23', status: 'MISSED' },
      ],
      durationWeeks: 2,
      weeklyPaymentPesewas: 250_000,
      allowRollovers: true,
    });

    expect(drafts).toHaveLength(2);
    expect(drafts.map((week) => week.weekNumber)).toEqual([3, 4]);
    expect(drafts[1]?.dueDate).toBe('2026-09-06');
  });
});

describe('resolveNextScheduleDueDate', () => {
  it('returns the earliest unpaid week on or after effective from', () => {
    const nextDueDate = resolveNextScheduleDueDate({
      effectiveFrom: '2026-09-01',
      weeks: [
        { weekNumber: 1, dueDate: '2026-08-16', status: 'MISSED' },
        { weekNumber: 3, dueDate: '2026-08-30', status: 'PENDING' },
        { weekNumber: 4, dueDate: '2026-09-06', status: 'PENDING' },
      ],
    });

    expect(nextDueDate).toBe('2026-09-06');
  });
});
