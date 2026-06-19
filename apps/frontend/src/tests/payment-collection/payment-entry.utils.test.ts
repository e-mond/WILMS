import { describe, expect, it } from 'vitest';
import { SCHEDULE_WEEK_STATUS } from '@/types/loan-schedule';
import {
  applyPaymentToOldestObligation,
  buildPaymentEntryContext,
  getOldestPayableWeek,
  validatePaymentAmount,
  validatePaymentSubmission,
} from '@/features/payment-collection/payment-entry.utils';

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
    status: SCHEDULE_WEEK_STATUS.MISSED,
  },
  {
    weekNumber: 5,
    dueDate: '2026-05-29',
    amountPesewas: 5000,
    status: SCHEDULE_WEEK_STATUS.PENDING,
  },
];

describe('payment-entry.utils', () => {
  it('selects the oldest payable week first', () => {
    expect(getOldestPayableWeek(SCHEDULE, '2026-05-29')?.weekNumber).toBe(4);
  });

  it('blocks partial and overpayments', () => {
    expect(validatePaymentAmount(2500, 5000)).toContain('Partial');
    expect(validatePaymentAmount(7500, 5000)).toContain('Overpayment');
  });

  it('blocks payments on the wrong day and advance payments', () => {
    expect(
      validatePaymentSubmission({
        amountPesewas: 5000,
        weeklyPaymentPesewas: 5000,
        paymentDay: 'Friday',
        referenceDate: '2026-05-30',
        scheduleWeeks: SCHEDULE,
      }),
    ).toContain('payment day');

    expect(
      validatePaymentSubmission({
        amountPesewas: 5000,
        weeklyPaymentPesewas: 5000,
        paymentDay: 'Friday',
        referenceDate: '2026-05-01',
        scheduleWeeks: SCHEDULE.map((week) => ({ ...week, status: SCHEDULE_WEEK_STATUS.PAID })),
      }),
    ).toContain('Advance');
  });

  it('builds payment entry context with arrears totals', () => {
    const context = buildPaymentEntryContext({
      borrowerId: 'borrower-001',
      borrowerName: 'Ama Mensah',
      phone: '+233241234567',
      community: 'Madina',
      loanId: 'loan-001',
      paymentDay: 'Friday',
      weeklyPaymentPesewas: 5000,
      scheduleWeeks: SCHEDULE,
      referenceDate: '2026-05-29',
    });

    expect(context.canAcceptPayment).toBe(true);
    expect(context.obligationWeeks).toHaveLength(2);
    expect(context.totalOutstandingObligationsPesewas).toBe(10000);
    expect(context.oldestObligation?.weekNumber).toBe(4);
  });

  it('marks the oldest obligation paid when applying a payment', () => {
    const updated = applyPaymentToOldestObligation(SCHEDULE, '2026-05-29');
    expect(updated[3]?.status).toBe(SCHEDULE_WEEK_STATUS.PAID);
    expect(updated[4]?.status).toBe(SCHEDULE_WEEK_STATUS.PENDING);
  });
});
