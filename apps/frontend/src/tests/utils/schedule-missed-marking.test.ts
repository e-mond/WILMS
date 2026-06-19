import { describe, expect, it } from 'vitest';
import { SCHEDULE_WEEK_STATUS } from '@/types/loan-schedule';
import {
  applyMissedWeekAutoMarking,
  countArrearsWeeks,
  countMissedWeeks,
} from '@/utils/schedule-missed-marking';

const SCHEDULE = [
  {
    weekNumber: 1,
    dueDate: '2026-05-01',
    amountPesewas: 5000,
    status: SCHEDULE_WEEK_STATUS.PAID,
  },
  {
    weekNumber: 2,
    dueDate: '2026-05-08',
    amountPesewas: 5000,
    status: SCHEDULE_WEEK_STATUS.PAID,
  },
  {
    weekNumber: 3,
    dueDate: '2026-05-15',
    amountPesewas: 5000,
    status: SCHEDULE_WEEK_STATUS.PAID,
  },
  {
    weekNumber: 4,
    dueDate: '2026-05-22',
    amountPesewas: 5000,
    status: SCHEDULE_WEEK_STATUS.PENDING,
  },
  {
    weekNumber: 5,
    dueDate: '2026-05-29',
    amountPesewas: 5000,
    status: SCHEDULE_WEEK_STATUS.PENDING,
  },
];

describe('schedule-missed-marking', () => {
  it('auto-marks overdue pending weeks as missed', () => {
    const synced = applyMissedWeekAutoMarking(SCHEDULE, '2026-06-01');

    expect(synced[3]?.status).toBe(SCHEDULE_WEEK_STATUS.MISSED);
    expect(synced[4]?.status).toBe(SCHEDULE_WEEK_STATUS.MISSED);
    expect(countMissedWeeks(synced)).toBe(2);
  });

  it('counts arrears weeks for carry-forward display', () => {
    const synced = applyMissedWeekAutoMarking(SCHEDULE, '2026-05-29');
    expect(countArrearsWeeks(synced, '2026-05-29')).toBe(1);
  });
});
