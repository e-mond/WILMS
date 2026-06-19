import { beforeEach, describe, expect, it } from 'vitest';
import { LOAN_STATUS } from '@/types/loan';
import { SCHEDULE_WEEK_STATUS } from '@/types/loan-schedule';
import { NOTIFICATION_CHANNEL, NOTIFICATION_EVENT } from '@/types/notification';
import {
  notifyLoanCompletedIfNeeded,
} from '@/services/mock/loan-notifications.sync';
import {
  resetPaymentReminderState,
  syncPaymentReminders,
} from '@/services/mock/payment-reminder.sync';
import loanServiceMock, {
  applyLoanRepayment,
  resetMockLoans,
} from '@/services/mock/loanService.mock';
import {
  getMockNotificationDeliveries,
  resetMockNotifications,
} from '@/services/mock/notificationService.mock';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import { resetMockTransactions } from '@/services/mock/transactionService.mock';
import transactionServiceMock from '@/services/mock/transactionService.mock';

describe('NF-02 notification triggers', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
    resetMockLoans();
    resetMockNotifications();
    resetPaymentReminderState();
  });

  it('sends LOAN_DISBURSED when a pending loan is disbursed', async () => {
    await transactionServiceMock.recordAdminFee({
      borrowerId: 'borrower-002',
      collectorId: 'user-collector',
    });

    await loanServiceMock.disburseLoan('loan-pending-001');

    const deliveries = getMockNotificationDeliveries();
    const disbursed = deliveries.find(
      (delivery) => delivery.event === NOTIFICATION_EVENT.LOAN_DISBURSED,
    );

    expect(disbursed).toBeDefined();
    expect(disbursed?.borrowerId).toBe('borrower-002');
    expect(disbursed?.loanId).toBe('loan-pending-001');
    expect(disbursed?.channels).toEqual([
      NOTIFICATION_CHANNEL.SMS,
      NOTIFICATION_CHANNEL.EMAIL,
    ]);
  });

  it('sends PAYMENT_REMINDER the day before a pending obligation is due', async () => {
    await syncPaymentReminders({
      loanId: 'loan-001',
      referenceDate: '2026-06-05',
      weeks: [
        {
          weekNumber: 5,
          dueDate: '2026-06-06',
          amountPesewas: 5000,
          status: SCHEDULE_WEEK_STATUS.PENDING,
        },
      ],
    });

    const reminder = getMockNotificationDeliveries().find(
      (delivery) => delivery.event === NOTIFICATION_EVENT.PAYMENT_REMINDER,
    );

    expect(reminder).toBeDefined();
    expect(reminder?.loanId).toBe('loan-001');
    expect(reminder?.message).toContain('due tomorrow');
  });

  it('does not duplicate payment reminders for the same obligation', async () => {
    const weeks = [
      {
        weekNumber: 5,
        dueDate: '2026-06-06',
        amountPesewas: 5000,
        status: SCHEDULE_WEEK_STATUS.PENDING,
      },
    ];

    await syncPaymentReminders({ loanId: 'loan-001', referenceDate: '2026-06-05', weeks });
    await syncPaymentReminders({ loanId: 'loan-001', referenceDate: '2026-06-05', weeks });

    expect(
      getMockNotificationDeliveries().filter(
        (delivery) => delivery.event === NOTIFICATION_EVENT.PAYMENT_REMINDER,
      ),
    ).toHaveLength(1);
  });

  it('sends LOAN_COMPLETED when an active loan is fully repaid', async () => {
    applyLoanRepayment('loan-001', 35000);
    await notifyLoanCompletedIfNeeded('loan-001', LOAN_STATUS.ACTIVE);

    const completed = getMockNotificationDeliveries().find(
      (delivery) => delivery.event === NOTIFICATION_EVENT.LOAN_COMPLETED,
    );

    expect(completed).toBeDefined();
    expect(completed?.loanId).toBe('loan-001');
    expect(completed?.message).toContain('fully repaid');
  });
});
