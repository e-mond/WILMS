import { describe, expect, it } from 'vitest';
import { SCHEDULE_WEEK_STATUS } from '@/types/loan-schedule';
import { TRANSACTION_TYPE } from '@/types/transaction';
import {
  calculateLoanProgress,
  sumConfirmedRepaymentsPesewas,
} from '@/features/loan-management/loan-progress.utils';

const SCHEDULE_WEEKS = [
  {
    weekNumber: 1,
    dueDate: '2026-05-09',
    amountPesewas: 5000,
    status: SCHEDULE_WEEK_STATUS.PAID,
  },
  {
    weekNumber: 2,
    dueDate: '2026-05-16',
    amountPesewas: 5000,
    status: SCHEDULE_WEEK_STATUS.PAID,
  },
  {
    weekNumber: 3,
    dueDate: '2026-05-23',
    amountPesewas: 5000,
    status: SCHEDULE_WEEK_STATUS.PAID,
  },
  {
    weekNumber: 4,
    dueDate: '2026-05-30',
    amountPesewas: 5000,
    status: SCHEDULE_WEEK_STATUS.PENDING,
  },
];

const REPAYMENTS = [
  {
    id: 'txn-1',
    type: TRANSACTION_TYPE.REPAYMENT,
    borrowerId: 'borrower-001',
    loanId: 'loan-001',
    amountPesewas: 5000,
    collectorId: 'user-collector',
    recordedAt: '2026-05-09T14:30:00.000Z',
  },
  {
    id: 'txn-2',
    type: TRANSACTION_TYPE.REPAYMENT,
    borrowerId: 'borrower-001',
    loanId: 'loan-001',
    amountPesewas: 5000,
    collectorId: 'user-collector',
    recordedAt: '2026-05-16T14:30:00.000Z',
  },
  {
    id: 'txn-3',
    type: TRANSACTION_TYPE.REPAYMENT,
    borrowerId: 'borrower-001',
    loanId: 'loan-001',
    amountPesewas: 5000,
    collectorId: 'user-collector',
    recordedAt: '2026-05-23T14:30:00.000Z',
  },
];

describe('loan-progress.utils', () => {
  it('sums confirmed repayments for a loan', () => {
    expect(sumConfirmedRepaymentsPesewas(REPAYMENTS, 'loan-001')).toBe(15000);
  });

  it('derives balances and progress metrics from transactions and schedule', () => {
    const progress = calculateLoanProgress({
      loanId: 'loan-001',
      amountPesewas: 50000,
      scheduleWeeks: SCHEDULE_WEEKS,
      transactions: REPAYMENTS,
      referenceDate: '2026-05-24',
    });

    expect(progress.totalPaidPesewas).toBe(15000);
    expect(progress.remainingBalancePesewas).toBe(35000);
    expect(progress.percentRepaid).toBe(30);
    expect(progress.weeksCompleted).toBe(3);
    expect(progress.weeksRemaining).toBe(1);
    expect(progress.elapsedWeeks).toBe(3);
    expect(progress.paymentConsistencyScore).toBe(100);
  });
});
