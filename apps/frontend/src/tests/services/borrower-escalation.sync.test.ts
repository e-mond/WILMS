import { beforeEach, describe, expect, it } from 'vitest';
import { SCHEDULE_WEEK_STATUS, type LoanScheduleWeek } from '@/types/loan-schedule';
import { syncBorrowerAndLoanEscalation } from '@/services/mock/borrower-escalation.sync';
import { getBorrowerRegistryEntry, resetBorrowerRegistry } from '@/services/mock/borrower-registry.store';
import { resetMockLoans, getAllMockLoans } from '@/services/mock/loanService.mock';
import {
  getMockNotificationDeliveries,
  resetMockNotifications,
} from '@/services/mock/notificationService.mock';
import { resetLoanSchedules } from '@/services/mock/loan-schedule.store';
import { BORROWER_STATUS } from '@/types/borrower';
import { LOAN_STATUS } from '@/types/loan';
import { NOTIFICATION_EVENT } from '@/types/notification';

function week(status: LoanScheduleWeek['status']): LoanScheduleWeek {
  return {
    weekNumber: 1,
    dueDate: '2026-05-01',
    amountPesewas: 5000,
    status,
  };
}

describe('borrower-escalation.sync', () => {
  beforeEach(() => {
    resetBorrowerRegistry();
    resetMockLoans();
    resetLoanSchedules();
    resetMockNotifications();
  });

  it('escalates borrower to at risk after one missed week', async () => {
    const weeks = [week(SCHEDULE_WEEK_STATUS.PAID), week(SCHEDULE_WEEK_STATUS.MISSED)];

    await syncBorrowerAndLoanEscalation('loan-001', weeks);

    expect(getBorrowerRegistryEntry('borrower-001')?.status).toBe(BORROWER_STATUS.AT_RISK);
    expect(
      getMockNotificationDeliveries().some(
        (delivery) => delivery.event === NOTIFICATION_EVENT.MISSED_PAYMENT,
      ),
    ).toBe(true);
  });

  it('escalates borrower to defaulted and notifies guarantor after two missed weeks', async () => {
    const weeks = [
      week(SCHEDULE_WEEK_STATUS.PAID),
      week(SCHEDULE_WEEK_STATUS.MISSED),
      week(SCHEDULE_WEEK_STATUS.MISSED),
    ];

    await syncBorrowerAndLoanEscalation('loan-001', weeks);

    expect(getBorrowerRegistryEntry('borrower-001')?.status).toBe(BORROWER_STATUS.DEFAULTED);
    expect(getAllMockLoans().find((loan) => loan.id === 'loan-001')?.status).toBe(
      LOAN_STATUS.DEFAULTED,
    );
    expect(
      getMockNotificationDeliveries().some(
        (delivery) => delivery.event === NOTIFICATION_EVENT.GUARANTOR_ALERT,
      ),
    ).toBe(true);
    expect(
      getMockNotificationDeliveries().some(
        (delivery) => delivery.event === NOTIFICATION_EVENT.DEFAULTER_STATUS,
      ),
    ).toBe(true);
  });
});
