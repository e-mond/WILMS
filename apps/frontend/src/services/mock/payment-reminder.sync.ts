import { getBorrowerRegistryEntry } from '@/services/mock/borrower-registry.store';
import { getAllMockLoans } from '@/services/mock/loanService.mock';
import notificationServiceMock from '@/services/mock/notificationService.mock';
import { LOAN_STATUS } from '@/types/loan';
import { SCHEDULE_WEEK_STATUS, type LoanScheduleWeek } from '@/types/loan-schedule';
import {
  NOTIFICATION_CHANNEL,
  NOTIFICATION_EVENT,
} from '@/types/notification';
import { addIsoDays } from '@/utils/date-iso';
import { formatPesewasAsGhs } from '@/utils/currency';

const sentReminderKeys = new Set<string>();

export function resetPaymentReminderState(): void {
  sentReminderKeys.clear();
}

export async function syncPaymentReminders(input: {
  loanId: string;
  weeks: LoanScheduleWeek[];
  referenceDate: string;
}): Promise<void> {
  const loan = getAllMockLoans().find((entry) => entry.id === input.loanId);

  if (!loan || loan.status !== LOAN_STATUS.ACTIVE) {
    return;
  }

  const borrower = getBorrowerRegistryEntry(loan.borrowerId);

  if (!borrower) {
    return;
  }

  const reminderDueDate = addIsoDays(input.referenceDate, 1);

  for (const week of input.weeks) {
    if (week.status !== SCHEDULE_WEEK_STATUS.PENDING) {
      continue;
    }

    if (week.dueDate !== reminderDueDate) {
      continue;
    }

    const reminderKey = `${input.loanId}:${week.weekNumber}:${week.dueDate}`;

    if (sentReminderKeys.has(reminderKey)) {
      continue;
    }

    sentReminderKeys.add(reminderKey);

    const amountLabel = formatPesewasAsGhs(week.amountPesewas);

    await notificationServiceMock.sendNotification({
      event: NOTIFICATION_EVENT.PAYMENT_REMINDER,
      channels: [NOTIFICATION_CHANNEL.SMS],
      recipientPhone: borrower.phone,
      borrowerId: borrower.id,
      loanId: input.loanId,
      message: `WILMS: Reminder for ${borrower.fullName} — weekly payment of ${amountLabel} is due tomorrow (${week.dueDate}).`,
    });
  }
}
