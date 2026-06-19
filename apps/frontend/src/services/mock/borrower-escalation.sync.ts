import type { BorrowerRegistryEntry } from '@/mocks/borrower-registry';
import {
  getBorrowerRegistryEntry,
  updateBorrowerRegistryStatus,
} from '@/services/mock/borrower-registry.store';
import notificationServiceMock from '@/services/mock/notificationService.mock';
import { BORROWER_STATUS, type BorrowerStatus } from '@/types/borrower';
import { LOAN_STATUS } from '@/types/loan';
import type { LoanScheduleWeek } from '@/types/loan-schedule';
import {
  NOTIFICATION_CHANNEL,
  NOTIFICATION_EVENT,
} from '@/types/notification';
import {
  resolveBorrowerRepaymentStatus,
  resolveEscalatedLoanStatus,
} from '@/utils/defaulter-escalation';

const ESCALATABLE_STATUSES: readonly BorrowerStatus[] = [
  BORROWER_STATUS.APPROVED,
  BORROWER_STATUS.AT_RISK,
  BORROWER_STATUS.DEFAULTED,
];

async function dispatchEscalationNotifications(input: {
  borrower: BorrowerRegistryEntry;
  loanId: string;
  previousStatus: BorrowerStatus;
  nextStatus: BorrowerStatus;
}): Promise<void> {
  const { borrower, loanId, previousStatus, nextStatus } = input;

  if (
    nextStatus === BORROWER_STATUS.AT_RISK &&
    previousStatus === BORROWER_STATUS.APPROVED
  ) {
    await notificationServiceMock.sendNotification({
      event: NOTIFICATION_EVENT.MISSED_PAYMENT,
      channels: [NOTIFICATION_CHANNEL.SMS],
      recipientPhone: borrower.phone,
      borrowerId: borrower.id,
      loanId,
      message: `WILMS: Hi ${borrower.fullName}, you missed a weekly payment and are now marked At Risk. Please contact your collector.`,
    });

    await notificationServiceMock.sendSupervisorAlert({
      message: `Borrower ${borrower.fullName} (${borrower.id}) is now At Risk on loan ${loanId}.`,
      collectorId: 'user-collector',
      paymentId: `escalation-${loanId}`,
    });
  }

  if (nextStatus === BORROWER_STATUS.DEFAULTED && previousStatus !== BORROWER_STATUS.DEFAULTED) {
    await notificationServiceMock.sendNotification({
      event: NOTIFICATION_EVENT.DEFAULTER_STATUS,
      channels: [NOTIFICATION_CHANNEL.SMS, NOTIFICATION_CHANNEL.EMAIL],
      recipientPhone: borrower.phone,
      recipientEmail: borrower.profile.email,
      borrowerId: borrower.id,
      loanId,
      message: `WILMS: ${borrower.fullName}, your loan is now in Defaulted status after consecutive missed payments. Immediate action is required.`,
    });

    await notificationServiceMock.sendNotification({
      event: NOTIFICATION_EVENT.GUARANTOR_ALERT,
      channels: [NOTIFICATION_CHANNEL.SMS],
      recipientPhone: borrower.profile.guarantorPhone,
      borrowerId: borrower.id,
      loanId,
      message: `WILMS: Guarantor alert for ${borrower.profile.guarantorName}. Borrower ${borrower.fullName} has defaulted on loan ${loanId}. Please follow up immediately.`,
    });

    await notificationServiceMock.sendSupervisorAlert({
      message: `Borrower ${borrower.fullName} (${borrower.id}) has defaulted on loan ${loanId}. Guarantor notified.`,
      collectorId: 'user-collector',
      paymentId: `default-${loanId}`,
    });
  }
}

export async function syncBorrowerAndLoanEscalation(
  loanId: string,
  weeks: LoanScheduleWeek[],
): Promise<void> {
  const { getAllMockLoans, updateLoanStatusInMock } = await import(
    '@/services/mock/loanService.mock'
  );

  const loan = getAllMockLoans().find((entry) => entry.id === loanId);

  if (!loan) {
    return;
  }

  const borrower = getBorrowerRegistryEntry(loan.borrowerId);

  if (!borrower || !ESCALATABLE_STATUSES.includes(borrower.status)) {
    return;
  }

  const previousBorrowerStatus = borrower.status;
  const nextBorrowerStatus = resolveBorrowerRepaymentStatus(weeks);

  if (nextBorrowerStatus !== previousBorrowerStatus) {
    updateBorrowerRegistryStatus(loan.borrowerId, nextBorrowerStatus);
    await dispatchEscalationNotifications({
      borrower,
      loanId,
      previousStatus: previousBorrowerStatus,
      nextStatus: nextBorrowerStatus,
    });
  }

  const escalatedLoanStatus = resolveEscalatedLoanStatus(weeks);

  if (escalatedLoanStatus === LOAN_STATUS.DEFAULTED && loan.status !== LOAN_STATUS.DEFAULTED) {
    updateLoanStatusInMock(loanId, LOAN_STATUS.DEFAULTED);
    return;
  }

  if (
    escalatedLoanStatus === null &&
    loan.status === LOAN_STATUS.DEFAULTED &&
    nextBorrowerStatus === BORROWER_STATUS.APPROVED
  ) {
    updateLoanStatusInMock(loanId, LOAN_STATUS.ACTIVE);
  }
}
