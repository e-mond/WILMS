import { describe, expect, it } from 'vitest';
import {
  applyPaymentToSchedule,
  computeGraceAndEscalation,
  getOldestPayableWeeks,
  getPayableWeeks,
  validatePaymentSubmission,
} from '../../domain/payment/allocation.js';
import type { ScheduleWeekDto } from '../../domain/loan/mappers.js';

function week(
  weekNumber: number,
  dueDate: string,
  status: ScheduleWeekDto['status'],
  amountPesewas = 12_000,
): ScheduleWeekDto {
  return { weekNumber, dueDate, status, amountPesewas };
}

describe('payment allocation multi-week', () => {
  const schedule: ScheduleWeekDto[] = [
    week(30, '2026-07-01', 'MISSED'),
    week(31, '2026-07-08', 'MISSED'),
    week(32, '2026-07-15', 'PENDING'),
    week(33, '2026-07-22', 'PENDING'),
  ];

  it('lists payable weeks oldest first', () => {
    const payable = getPayableWeeks(schedule, '2026-07-15');
    expect(payable.map((entry) => entry.weekNumber)).toEqual([30, 31, 32]);
  });

  it('allocates double payment to two oldest weeks', () => {
    const allocation = applyPaymentToSchedule(schedule, '2026-07-15', 2);
    expect(allocation.weekNumbers).toEqual([30, 31]);
    expect(allocation.weeks.find((entry) => entry.weekNumber === 32)?.status).toBe('PENDING');
  });

  it('accepts amount equal to N weekly installments', () => {
    expect(
      validatePaymentSubmission({
        amountPesewas: 24_000,
        weeklyPaymentPesewas: 12_000,
        paymentDay: 'Wednesday',
        referenceDate: '2026-07-15',
        scheduleWeeks: schedule,
        weeksCount: 2,
      }),
    ).toBeUndefined();
  });

  it('rejects weeksCount greater than payable weeks', () => {
    expect(
      validatePaymentSubmission({
        amountPesewas: 48_000,
        weeklyPaymentPesewas: 12_000,
        paymentDay: 'Wednesday',
        referenceDate: '2026-07-15',
        scheduleWeeks: schedule,
        weeksCount: 4,
      }),
    ).toMatch(/Only 3 payable/);
  });

  it('selects oldest N payable weeks', () => {
    expect(getOldestPayableWeeks(schedule, '2026-07-15', 3).map((w) => w.weekNumber)).toEqual([
      30, 31, 32,
    ]);
  });
});

describe('grace and escalation', () => {
  it('marks due day as DUE', () => {
    expect(
      computeGraceAndEscalation({
        referenceDate: '2026-07-15',
        oldestPayableDueDate: '2026-07-15',
        graceDays: 3,
      }).escalationLevel,
    ).toBe('DUE');
  });

  it('marks within grace as GRACE', () => {
    expect(
      computeGraceAndEscalation({
        referenceDate: '2026-07-17',
        oldestPayableDueDate: '2026-07-15',
        graceDays: 3,
      }).escalationLevel,
    ).toBe('GRACE');
  });

  it('marks after grace as OVERDUE then ESCALATED', () => {
    expect(
      computeGraceAndEscalation({
        referenceDate: '2026-07-19',
        oldestPayableDueDate: '2026-07-15',
        graceDays: 3,
      }).escalationLevel,
    ).toBe('OVERDUE');
    expect(
      computeGraceAndEscalation({
        referenceDate: '2026-07-22',
        oldestPayableDueDate: '2026-07-15',
        graceDays: 3,
      }).escalationLevel,
    ).toBe('ESCALATED');
  });
});
