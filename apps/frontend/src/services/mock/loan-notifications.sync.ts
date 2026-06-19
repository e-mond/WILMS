import { getBorrowerRegistryEntry } from '@/services/mock/borrower-registry.store';
import { getAllMockLoans } from '@/services/mock/loanService.mock';
import notificationServiceMock from '@/services/mock/notificationService.mock';
import { LOAN_STATUS, type LoanDetail, type LoanStatus } from '@/types/loan';
import {
  NOTIFICATION_CHANNEL,
  NOTIFICATION_EVENT,
} from '@/types/notification';
import { formatPesewasAsGhs } from '@/utils/currency';

export async function notifyLoanDisbursed(loan: LoanDetail): Promise<void> {
  const borrower = getBorrowerRegistryEntry(loan.borrowerId);

  if (!borrower) {
    return;
  }

  const amountLabel = formatPesewasAsGhs(loan.amountPesewas);

  await notificationServiceMock.sendNotification({
    event: NOTIFICATION_EVENT.LOAN_DISBURSED,
    channels: [NOTIFICATION_CHANNEL.SMS, NOTIFICATION_CHANNEL.EMAIL],
    recipientPhone: borrower.phone,
    recipientEmail: borrower.profile.email,
    borrowerId: borrower.id,
    loanId: loan.id,
    message: `WILMS: ${borrower.fullName}, your interest-free loan of ${amountLabel} has been disbursed. Weekly repayments are due on ${loan.paymentDay}.`,
  });
}

export async function notifyLoanCompletedIfNeeded(
  loanId: string,
  previousStatus: LoanStatus,
): Promise<void> {
  if (previousStatus !== LOAN_STATUS.ACTIVE) {
    return;
  }

  const loan = getAllMockLoans().find((entry) => entry.id === loanId);

  if (!loan || loan.status !== LOAN_STATUS.COMPLETED) {
    return;
  }

  const borrower = getBorrowerRegistryEntry(loan.borrowerId);

  if (!borrower) {
    return;
  }

  await notificationServiceMock.sendNotification({
    event: NOTIFICATION_EVENT.LOAN_COMPLETED,
    channels: [NOTIFICATION_CHANNEL.SMS, NOTIFICATION_CHANNEL.EMAIL],
    recipientPhone: borrower.phone,
    recipientEmail: borrower.profile.email,
    borrowerId: borrower.id,
    loanId: loan.id,
    message: `WILMS: Congratulations ${borrower.fullName}! Your loan ${loan.id} is fully repaid. Thank you for completing your repayments.`,
  });
}
