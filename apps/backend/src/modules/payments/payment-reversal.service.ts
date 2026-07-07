/**
 * P14.3B Phase 3C.1 — Payment reversal service.
 *
 * Atomic transaction (per approved architecture):
 * reversal row → payment REVERSED → schedule revert → loan balance credit → ledger REVERSAL → history.
 * Pool allocation reversal explicitly out of scope for 3C.1 MVP.
 */
import { z } from 'zod';
import { isDatabaseEnabled, runInTransaction } from '../../db/client.js';
import { computePaymentReversalBalance } from '../../domain/reversal/balance-effect.js';
import { mapReversalToPaymentResult } from '../../domain/reversal/mappers.js';
import { LOAN_LIFECYCLE, type LoanLifecycleStatus } from '../../domain/loan/lifecycle.js';
import { decimalToPesewas, pesewasToDecimal } from '../../domain/money.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import { notifyPaymentReversal } from '../../infrastructure/notifications/event-dispatch.js';
import { runWithIdempotency } from '../../infrastructure/idempotency/run-with-idempotency.js';
import * as ledgerRepo from '../../repositories/ledger.repository.js';
import * as loanRepo from '../../repositories/loan.repository.js';
import * as paymentRepo from '../../repositories/payment.repository.js';
import * as scheduleRepo from '../../repositories/loan-schedule.repository.js';
import * as reversalRepo from '../../repositories/reversal.repository.js';
import * as borrowerRepo from '../../repositories/borrower.repository.js';

const AUDIT_ACTION = {
  REVERSAL_REQUESTED: 'reversal.requested',
  REVERSAL_EXECUTED: 'reversal.executed',
} as const;

export const reversePaymentSchema = z.object({
  reason: z.string().min(10),
  actorId: z.string().min(1),
  actorDisplayName: z.string().min(1),
});

function requireDatabase(): void {
  if (!isDatabaseEnabled()) {
    throw new Error('VALIDATION:Database persistence is required for payment reversal.');
  }
}

/**
 * Reverses a confirmed payment with compensating ledger entry and balance restoration.
 */
export async function reversePayment(
  paymentId: string,
  input: z.infer<typeof reversePaymentSchema>,
  idempotencyKey?: string,
) {
  requireDatabase();

  return runWithIdempotency({
    scope: 'REVERSAL_EXECUTE',
    actorUserId: input.actorId,
    idempotencyKey,
    responseStatus: 200,
    execute: async () => executePaymentReversal(paymentId, input),
  });
}

async function executePaymentReversal(
  paymentId: string,
  input: z.infer<typeof reversePaymentSchema>,
) {
  const payment = await paymentRepo.findPaymentById(paymentId);
  if (!payment) {
    throw new Error('NOT_FOUND');
  }

  const existing = await reversalRepo.findExecutedReversalBySource('PAYMENT', paymentId);
  if (existing) {
    throw new Error('REVERSAL_DUPLICATE');
  }

  if (payment.status !== 'CONFIRMED') {
    throw new Error('VALIDATION:Only confirmed payments can be reversed.');
  }
  if (!payment.loanId) {
    throw new Error('VALIDATION:Payment is not linked to a loan.');
  }

  const conflict = await reversalRepo.hasApprovedPaymentCorrectionConflict({
    borrowerId: payment.borrowerId,
    loanId: payment.loanId,
    amountPesewas: payment.amountPesewas,
  });
  if (conflict) {
    throw new Error('VALIDATION:An approved payment correction adjustment exists for this payment.');
  }

  const loan = await loanRepo.findLoanById(payment.loanId);
  if (!loan) {
    throw new Error('NOT_FOUND');
  }

  const allowedLifecycle: LoanLifecycleStatus[] = [LOAN_LIFECYCLE.ACTIVE, LOAN_LIFECYCLE.COMPLETED];
  if (!allowedLifecycle.includes(loan.lifecycleStatus as LoanLifecycleStatus)) {
    throw new Error('VALIDATION:Loan lifecycle does not allow payment reversal.');
  }

  const repaymentLedger = await reversalRepo.findRepaymentLedgerByPaymentId(paymentId);
  if (!repaymentLedger) {
    throw new Error('VALIDATION:No repayment ledger entry found for this payment.');
  }

  const effect = computePaymentReversalBalance(
    decimalToPesewas(loan.loanBalance),
    payment.amountPesewas,
    loan.lifecycleStatus as LoanLifecycleStatus,
  );

  const requestedAt = new Date();
  const referenceDate = new Date().toISOString().slice(0, 10);

  const executed = await runInTransaction(async (tx) => {
    const existingInTxn = await reversalRepo.findExecutedReversalBySource('PAYMENT', paymentId, tx);
    if (existingInTxn) {
      throw new Error('REVERSAL_DUPLICATE');
    }

    const reversal = await reversalRepo.insertReversal(
      {
        sourceType: 'PAYMENT',
        sourceId: paymentId,
        loanId: payment.loanId!,
        borrowerId: payment.borrowerId,
        amountPesewas: payment.amountPesewas,
        reason: input.reason.trim(),
        requestedByUserId: input.actorId,
        requestedAt,
      },
      tx,
    );

    await reversalRepo.appendReversalHistory(
      {
        reversalId: reversal.id,
        eventType: 'CREATED',
        actorUserId: input.actorId,
        actorDisplayName: input.actorDisplayName.trim(),
        reason: input.reason.trim(),
        recordedAt: requestedAt,
      },
      tx,
    );

    await paymentRepo.markPaymentReversed(
      {
        paymentId,
        expectedVersion: payment.version,
        reversedByUserId: input.actorId,
        reversalId: reversal.id,
      },
      tx,
    );

    if (payment.scheduleWeekNumber != null) {
      const weeks = await scheduleRepo.listScheduleWeeks(payment.loanId!, tx);
      const weekRow = weeks.find((row) => row.weekNumber === payment.scheduleWeekNumber);
      if (weekRow) {
        await scheduleRepo.revertWeekPaid(
          {
            loanId: payment.loanId!,
            weekNumber: payment.scheduleWeekNumber,
            expectedVersion: weekRow.version,
            referenceDate,
          },
          tx,
        );
      }
    }

    await loanRepo.updateLoanLifecycle(
      {
        loanId: payment.loanId!,
        expectedVersion: loan.version,
        lifecycleStatus: effect.lifecycleStatus,
        loanBalance: pesewasToDecimal(effect.afterBalancePesewas),
      },
      tx,
    );

    await ledgerRepo.appendLedgerEntry(
      {
        entryType: 'REVERSAL',
        loanId: payment.loanId!,
        borrowerId: payment.borrowerId,
        paymentId,
        reversesLedgerEntryId: repaymentLedger.id,
        reversalId: reversal.id,
        amountDecimal: pesewasToDecimal(payment.amountPesewas),
        description: `Payment reversal: ${paymentId}`,
        actorUserId: input.actorId,
        metadata: {
          sourcePaymentId: paymentId,
          sourceLedgerEntryId: repaymentLedger.id,
          weekNumber: payment.scheduleWeekNumber,
        },
      },
      tx,
    );

    const completed = await reversalRepo.executeReversalRow(
      {
        reversalId: reversal.id,
        expectedVersion: reversal.version,
        executedByUserId: input.actorId,
        beforeBalancePesewas: effect.beforeBalancePesewas,
        afterBalancePesewas: effect.afterBalancePesewas,
        deltaPesewas: effect.deltaPesewas,
      },
      tx,
    );

    await reversalRepo.appendReversalHistory(
      {
        reversalId: reversal.id,
        eventType: 'EXECUTED',
        actorUserId: input.actorId,
        actorDisplayName: input.actorDisplayName.trim(),
        reason: input.reason.trim(),
        beforeValuePesewas: effect.beforeBalancePesewas,
        afterValuePesewas: effect.afterBalancePesewas,
        deltaPesewas: effect.deltaPesewas,
      },
      tx,
    );

    await reversalRepo.appendReversalHistory(
      {
        reversalId: reversal.id,
        eventType: 'LEDGER_POSTED',
        actorUserId: input.actorId,
        actorDisplayName: input.actorDisplayName.trim(),
        beforeValuePesewas: effect.beforeBalancePesewas,
        afterValuePesewas: effect.afterBalancePesewas,
        deltaPesewas: effect.deltaPesewas,
        metadata: { ledgerEntryType: 'REVERSAL', reversesLedgerEntryId: repaymentLedger.id },
      },
      tx,
    );

    return completed;
  });

  appendAuditEntry({
    action: AUDIT_ACTION.REVERSAL_REQUESTED,
    actorId: input.actorId,
    actorDisplayName: input.actorDisplayName,
    targetEntityId: executed.id,
    targetEntityType: 'reversal',
    reason: input.reason.trim(),
  });

  appendAuditEntry({
    action: AUDIT_ACTION.REVERSAL_EXECUTED,
    actorId: input.actorId,
    actorDisplayName: input.actorDisplayName,
    targetEntityId: executed.id,
    targetEntityType: 'reversal',
    reason: input.reason.trim(),
  });

  const borrower = await borrowerRepo.getBorrower(payment.borrowerId);
  if (borrower && loan) {
    const loanDisplayId = loan.id;
    void notifyPaymentReversal({
      borrowerId: borrower.id,
      borrowerName: borrower.fullName,
      borrowerEmail: borrower.profile?.email,
      borrowerPhone: borrower.phone,
      amountPesewas: payment.amountPesewas,
      loanDisplayId,
      loanId: loan.id,
      reason: input.reason.trim(),
      reversalDate: new Date().toISOString().slice(0, 10),
    });
  }

  return mapReversalToPaymentResult(executed, input.actorDisplayName.trim());
}
