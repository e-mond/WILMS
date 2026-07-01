import { API_ERROR_CODE, ApiError } from '@/types/api';
import type { PaymentEntryContext } from '@/types/payment-entry';
import { AUDIT_ACTION, AUDIT_TARGET_ENTITY } from '@/constants/audit';
import {
  PAYMENT_TRANSACTION_STATUS,
  type EditPaymentInput,
  type PaymentTransaction,
  type RecordPaymentInput,
} from '@/types/payment';
import type { IPaymentService } from '@/types/services';
import {
  applyPaymentToOldestObligation,
  buildPaymentEntryContext,
  isOverpaymentAttempt,
  validatePaymentSubmission,
} from '@/features/payment-collection/payment-entry.utils';
import overpaymentReviewServiceMock from '@/services/mock/overpaymentReviewService.mock';
import { getBorrowerRegistryEntry } from '@/services/mock/borrower-registry.store';
import {
  getStoredLoanSchedule,
  saveLoanSchedule,
} from '@/services/mock/loan-schedule.store';
import {
  applyLoanRepayment,
  getActiveLoanForBorrower,
  getAllMockLoans,
} from '@/services/mock/loanService.mock';
import { notifyLoanCompletedIfNeeded } from '@/services/mock/loan-notifications.sync';
import auditServiceMock from '@/services/mock/auditService.mock';
import notificationServiceMock from '@/services/mock/notificationService.mock';
import { NOTIFICATION_CHANNEL, NOTIFICATION_EVENT } from '@/types/notification';
import {
  appendPaymentTransaction,
  findPaymentTransaction,
  findSameDayPayment,
  getPaymentTransactions,
  resetPaymentTransactions,
  updatePaymentTransaction,
} from '@/services/mock/payment-transaction.store';
import { appendFinancialTransaction } from '@/services/mock/transaction-log.store';
import { TRANSACTION_TYPE } from '@/types/transaction';
import { captureGps, GpsCaptureError } from '@/utils/captureGps';
import { isPaymentEditable } from '@/utils/payment-same-day';
import { simulateDelay } from '@/services/mock/delay';

let transactions: PaymentTransaction[] = [...getPaymentTransactions()];

function findDuplicate(input: RecordPaymentInput): PaymentTransaction | undefined {
  return transactions.find(
    (transaction) =>
      transaction.borrowerId === input.borrowerId &&
      transaction.paymentDate === input.paymentDate &&
      transaction.amountPesewas === input.amountPesewas,
  );
}

async function resolveGps(input: RecordPaymentInput): Promise<PaymentTransaction['gps']> {
  if (input.gps) {
    return input.gps;
  }

  return captureGps();
}

async function buildContextForBorrower(
  borrowerId: string,
  referenceDate: string,
): Promise<PaymentEntryContext> {
  const borrower = getBorrowerRegistryEntry(borrowerId);

  if (!borrower) {
    throw new ApiError('Borrower not found.', API_ERROR_CODE.NOT_FOUND, 404);
  }

  const loan = getActiveLoanForBorrower(borrowerId);

  if (!loan) {
    throw new ApiError('Borrower does not have an active loan.', API_ERROR_CODE.VALIDATION, 422);
  }

  const scheduleWeeks = getStoredLoanSchedule(loan.id, referenceDate);

  if (!scheduleWeeks?.length) {
    throw new ApiError('Loan schedule not found.', API_ERROR_CODE.NOT_FOUND, 404);
  }

  return buildPaymentEntryContext({
    borrowerId,
    borrowerName: borrower.fullName,
    phone: borrower.phone,
    community: borrower.community,
    loanId: loan.id,
    paymentDay: loan.paymentDay,
    weeklyPaymentPesewas: loan.weeklyPaymentPesewas,
    scheduleWeeks,
    referenceDate,
  });
}

const paymentServiceMock: IPaymentService = {
  async getPaymentEntryContext(borrowerId: string, referenceDate?: string) {
    await simulateDelay();
    return buildContextForBorrower(borrowerId, referenceDate ?? new Date().toISOString().slice(0, 10));
  },

  async getSameDayPayment(borrowerId: string, collectorId: string, referenceDate?: string) {
    await simulateDelay();

    const paymentDate = referenceDate ?? new Date().toISOString().slice(0, 10);
    const payment = findSameDayPayment(borrowerId, collectorId, paymentDate);

    return payment ?? null;
  },

  async editPayment(paymentId: string, input: EditPaymentInput): Promise<PaymentTransaction> {
    await simulateDelay();

    const existing = findPaymentTransaction(paymentId);

    if (!existing) {
      throw new ApiError('Payment not found.', API_ERROR_CODE.NOT_FOUND, 404);
    }

    if (existing.collectorId !== input.collectorId) {
      throw new ApiError('Only the recording collector may edit this payment.', API_ERROR_CODE.VALIDATION, 403);
    }

    if (!isPaymentEditable(existing.paymentDate, existing.recordedAt)) {
      throw new ApiError(
        'Same-day edits are locked after the payment day ends.',
        API_ERROR_CODE.VALIDATION,
        422,
      );
    }

    let gps: PaymentTransaction['gps'];

    try {
      gps = input.gps ?? (await captureGps());
    } catch (error) {
      if (error instanceof GpsCaptureError) {
        throw new ApiError(error.message, API_ERROR_CODE.VALIDATION, 422);
      }

      throw error;
    }

    const updated =
      updatePaymentTransaction(paymentId, {
        gps,
        editReason: input.reason,
        editedAt: new Date().toISOString(),
        editedBy: input.collectorId,
      }) ?? existing;

    await auditServiceMock.createEntry({
      action: AUDIT_ACTION.PAYMENT_EDITED,
      actorId: input.collectorId,
      targetEntityId: paymentId,
      targetEntityType: AUDIT_TARGET_ENTITY.PAYMENT,
      reason: input.reason,
    });

    await notificationServiceMock.sendSupervisorAlert({
      message: `Collector edited payment ${paymentId} — ${input.reason}`,
      collectorId: input.collectorId,
      paymentId,
    });

    return updated;
  },

  async recordPayment(input: RecordPaymentInput): Promise<PaymentTransaction> {
    await simulateDelay();

    if (findDuplicate(input)) {
      throw new ApiError(
        'This payment was already recorded for this borrower, date, and amount.',
        API_ERROR_CODE.DUPLICATE_TRANSACTION,
        409,
      );
    }

    let gps: PaymentTransaction['gps'];

    try {
      gps = await resolveGps(input);
    } catch (error) {
      if (error instanceof GpsCaptureError) {
        throw new ApiError(error.message, API_ERROR_CODE.VALIDATION, 422);
      }

      throw error;
    }

    const context = await buildContextForBorrower(input.borrowerId, input.paymentDate);
    const scheduleWeeks = getStoredLoanSchedule(context.loanId, input.paymentDate);

    if (!scheduleWeeks?.length) {
      throw new ApiError('Loan schedule not found.', API_ERROR_CODE.NOT_FOUND, 404);
    }

    if (
      isOverpaymentAttempt(input.amountPesewas, context.weeklyPaymentPesewas)
    ) {
      await overpaymentReviewServiceMock.queueReview({
        borrowerId: input.borrowerId,
        borrowerName: context.borrowerName,
        loanId: context.loanId,
        collectorId: input.collectorId,
        paymentDate: input.paymentDate,
        attemptedAmountPesewas: input.amountPesewas,
        expectedAmountPesewas: context.weeklyPaymentPesewas,
      });

      throw new ApiError(
        'Overpayment is not allowed. This attempt has been flagged for Super Admin review.',
        API_ERROR_CODE.OVERPAYMENT,
        422,
      );
    }

    const validationError = validatePaymentSubmission({
      amountPesewas: input.amountPesewas,
      weeklyPaymentPesewas: context.weeklyPaymentPesewas,
      paymentDay: context.paymentDay,
      referenceDate: input.paymentDate,
      scheduleWeeks,
    });

    if (validationError) {
      throw new ApiError(validationError, API_ERROR_CODE.VALIDATION, 422);
    }

    const updatedSchedule = applyPaymentToOldestObligation(scheduleWeeks, input.paymentDate);
    saveLoanSchedule(context.loanId, updatedSchedule);
    void import('@/services/mock/borrower-escalation.sync').then((module) => {
      void module.syncBorrowerAndLoanEscalation(context.loanId, updatedSchedule);
    });
    const loanBefore = getAllMockLoans().find((entry) => entry.id === context.loanId);
    applyLoanRepayment(context.loanId, input.amountPesewas);

    if (loanBefore) {
      await notifyLoanCompletedIfNeeded(context.loanId, loanBefore.status);
    }

    const transaction: PaymentTransaction = {
      id: crypto.randomUUID(),
      borrowerId: input.borrowerId,
      amountPesewas: input.amountPesewas,
      paymentDate: input.paymentDate,
      gps,
      collectorId: input.collectorId,
      recordedAt: new Date().toISOString(),
      status: PAYMENT_TRANSACTION_STATUS.CONFIRMED,
    };

    transactions = [...transactions, transaction];
    appendPaymentTransaction(transaction);

    appendFinancialTransaction({
      type: TRANSACTION_TYPE.REPAYMENT,
      borrowerId: input.borrowerId,
      loanId: context.loanId,
      amountPesewas: input.amountPesewas,
      collectorId: input.collectorId,
      recordedAt: new Date().toISOString(),
    });

    const borrower = getBorrowerRegistryEntry(input.borrowerId);

    if (borrower) {
      await notificationServiceMock.sendNotification({
        event: NOTIFICATION_EVENT.PAYMENT_RECEIVED,
        channels: [NOTIFICATION_CHANNEL.SMS],
        recipientPhone: borrower.phone,
        borrowerId: borrower.id,
        loanId: context.loanId,
        message: `WILMS: Payment received for ${borrower.fullName}. Thank you for your weekly repayment.`,
      });
    }

    return transaction;
  },

  async getPayment(paymentId: string) {
    await simulateDelay();
    const payment = findPaymentTransaction(paymentId);
    if (!payment) {
      throw new ApiError('Payment not found.', API_ERROR_CODE.NOT_FOUND, 404);
    }
    return payment;
  },

  async reversePayment(paymentId: string) {
    await simulateDelay();
    return this.getPayment(paymentId);
  },
};

export function resetMockPaymentTransactions(): void {
  resetPaymentTransactions();
  transactions = [...getPaymentTransactions()];
}

export default paymentServiceMock;
