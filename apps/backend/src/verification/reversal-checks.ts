/**
 * P14.3B Phase 3C.1 — Payment reversal verification checks.
 */
import { and, eq, notExists } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import { financialAdjustments } from '../db/schema/financial-adjustments.js';
import { financialReversals, reversalHistory } from '../db/schema/financial-reversals.js';
import { ledgerEntries } from '../db/schema/ledger-entries.js';
import { loanSchedules } from '../db/schema/loan-schedules.js';
import { payments } from '../db/schema/payments.js';
import { users } from '../db/schema/users.js';
import { ADJUSTMENT_TYPE } from '../domain/adjustment/types.js';
import { LOAN_LIFECYCLE } from '../domain/loan/lifecycle.js';
import { decimalToPesewas } from '../domain/money.js';
import {
  approveAdjustment,
  createAdjustment,
} from '../modules/adjustments/service.js';
import { reversePayment } from '../modules/payments/payment-reversal.service.js';
import * as paymentService from '../modules/payments/service.js';
import * as loanRepo from '../repositories/loan.repository.js';
import * as paymentRepo from '../repositories/payment.repository.js';
import * as reversalRepo from '../repositories/reversal.repository.js';
import type { VerificationResult } from './unit-checks.js';

const DEMO_ADMIN_EMAIL = 'admin@wilms.demo';
const DEMO_COLLECTOR_EMAIL = 'collector@wilms.demo';

async function resolveDemoActor(): Promise<{ actorId: string; actorDisplayName: string }> {
  const db = getDb();
  const [row] = await db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .where(eq(users.email, DEMO_ADMIN_EMAIL))
    .limit(1);

  if (!row) {
    throw new Error('Super admin demo user missing — run db:seed');
  }

  return { actorId: row.id, actorDisplayName: row.displayName };
}

const REVERSIBLE_LIFECYCLES = [LOAN_LIFECYCLE.ACTIVE, LOAN_LIFECYCLE.COMPLETED] as const;

async function isReversibleLoan(loanId: string): Promise<boolean> {
  const loan = await loanRepo.findLoanById(loanId);
  if (!loan) {
    return false;
  }
  return REVERSIBLE_LIFECYCLES.includes(loan.lifecycleStatus as (typeof REVERSIBLE_LIFECYCLES)[number]);
}

async function resolveCollectorId(): Promise<string> {
  const db = getDb();
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, DEMO_COLLECTOR_EMAIL))
    .limit(1);

  if (!row) {
    throw new Error('Collector demo user missing — run db:seed');
  }

  return row.id;
}

async function loanHasApprovedPaymentCorrection(loanId: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: financialAdjustments.id })
    .from(financialAdjustments)
    .where(
      and(
        eq(financialAdjustments.loanId, loanId),
        eq(financialAdjustments.type, 'PAYMENT_CORRECTION'),
        eq(financialAdjustments.status, 'APPROVED'),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

/**
 * Finds a confirmed payment without an executed reversal, or records a new one.
 */
export async function recordReversiblePayment(
  collectorId: string,
  suffix: string,
  options: { preferExisting?: boolean; excludeLoansWithPaymentCorrection?: boolean } = {},
): Promise<{ paymentId: string; loanId: string; borrowerId: string; amountPesewas: number }> {
  const db = getDb();
  const preferExisting = options.preferExisting ?? true;
  const excludeLoansWithPaymentCorrection = options.excludeLoansWithPaymentCorrection ?? false;

  if (preferExisting) {
    const candidates = await db
    .select({
      paymentId: payments.id,
      loanId: payments.loanId,
      borrowerId: payments.borrowerId,
      amountPesewas: payments.amountPesewas,
    })
    .from(payments)
    .where(
      and(
        eq(payments.status, 'CONFIRMED'),
        notExists(
          db
            .select({ id: financialReversals.id })
            .from(financialReversals)
            .where(
              and(
                eq(financialReversals.sourceType, 'PAYMENT'),
                eq(financialReversals.sourceId, payments.id),
                eq(financialReversals.status, 'EXECUTED'),
              ),
            ),
        ),
      ),
    );

  for (const existing of candidates) {
    if (!existing.loanId) {
      continue;
    }

    const ledger = await db
      .select({ id: ledgerEntries.id })
      .from(ledgerEntries)
      .where(
        and(eq(ledgerEntries.paymentId, existing.paymentId), eq(ledgerEntries.entryType, 'REPAYMENT')),
      )
      .limit(1);

    if (ledger.length === 0) {
      continue;
    }

    const conflict = await reversalRepo.hasApprovedPaymentCorrectionConflict({
      borrowerId: existing.borrowerId,
      loanId: existing.loanId,
      amountPesewas: existing.amountPesewas,
    });
    if (conflict) {
      continue;
    }

    if (!(await isReversibleLoan(existing.loanId))) {
      continue;
    }

    return {
      paymentId: existing.paymentId,
      loanId: existing.loanId,
      borrowerId: existing.borrowerId,
      amountPesewas: existing.amountPesewas,
    };
    }
  }

  const activeLoans = await loanRepo.listLoans({ externalStatus: 'ACTIVE' });

  for (const loanRow of activeLoans) {
    if (excludeLoansWithPaymentCorrection && (await loanHasApprovedPaymentCorrection(loanRow.id))) {
      continue;
    }

    const scheduleRows = await db
      .select()
      .from(loanSchedules)
      .where(eq(loanSchedules.loanId, loanRow.id));

    const nextPayableWeeks = scheduleRows.filter((row) => row.status !== 'PAID');

    for (const nextPayable of nextPayableWeeks) {
      const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(
        new Date(`${nextPayable.dueDate}T00:00:00.000Z`),
      );
      if (weekday !== loanRow.paymentDay) {
        continue;
      }

      const amountPesewas = decimalToPesewas(nextPayable.installmentAmount);
      const correctionConflict = await reversalRepo.hasApprovedPaymentCorrectionConflict({
        borrowerId: loanRow.borrowerId,
        loanId: loanRow.id,
        amountPesewas,
      });
      if (correctionConflict) {
        continue;
      }

      try {
        const recorded = await paymentService.recordPayment(
          {
            borrowerId: loanRow.borrowerId,
            amountPesewas,
            paymentDate: nextPayable.dueDate,
            collectorId,
          },
          collectorId,
          `reversal-verify-payment-${suffix}-${loanRow.id}-${nextPayable.weekNumber}`,
        );

        return {
          paymentId: recorded.id,
          loanId: loanRow.id,
          borrowerId: loanRow.borrowerId,
          amountPesewas,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message === 'DUPLICATE' || message.startsWith('VALIDATION')) {
          continue;
        }
        throw error;
      }
    }
  }

  throw new Error('No confirmed payment or payable obligation available for reversal verification');
}

export function reversalChecksAvailable(): boolean {
  return isDatabaseEnabled();
}

export async function runPaymentReversalWorkflowChecks(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];
  const { actorId, actorDisplayName } = await resolveDemoActor();
  const collectorId = await resolveCollectorId();
  const suffix = Date.now().toString(36);

  let target: Awaited<ReturnType<typeof recordReversiblePayment>>;
  try {
    target = await recordReversiblePayment(collectorId, suffix, {
      excludeLoansWithPaymentCorrection: true,
    });
  } catch (error) {
    return [
      {
        name: 'reversal-workflow-seed-payment',
        passed: false,
        detail: error instanceof Error ? error.message : String(error),
      },
    ];
  }

  const loanBefore = await loanRepo.findLoanById(target.loanId);
  const balanceBefore = loanBefore ? decimalToPesewas(loanBefore.loanBalance) : 0;

  let reversed: Awaited<ReturnType<typeof reversePayment>>;
  try {
    reversed = await reversePayment(
      target.paymentId,
      {
        reason: 'Verification harness payment reversal test',
        actorId,
        actorDisplayName,
      },
      `reversal-verify-execute-${suffix}`,
    );
  } catch (error) {
    return [
      ...results,
      {
        name: 'reversal-execute-status',
        passed: false,
        detail: error instanceof Error ? error.message : String(error),
      },
    ];
  }

  results.push({
    name: 'reversal-execute-status',
    passed: reversed.status === 'EXECUTED',
    detail: `reversalId=${reversed.id}`,
  });

  const paymentRow = await paymentRepo.findPaymentById(target.paymentId);
  results.push({
    name: 'reversal-payment-status',
    passed: paymentRow?.status === 'REVERSED',
    detail: `status=${paymentRow?.status ?? 'missing'}`,
  });

  const loanAfter = await loanRepo.findLoanById(target.loanId);
  const balanceAfter = loanAfter ? decimalToPesewas(loanAfter.loanBalance) : 0;
  results.push({
    name: 'reversal-balance-restored',
    passed: balanceAfter === balanceBefore + target.amountPesewas,
    detail: `before=${balanceBefore} after=${balanceAfter}`,
  });

  const db = getDb();
  const reversalLedger = await db
    .select()
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.paymentId, target.paymentId),
        eq(ledgerEntries.entryType, 'REVERSAL'),
      ),
    );

  results.push({
    name: 'reversal-ledger-entry',
    passed: reversalLedger.length === 1 && reversalLedger[0]!.reversesLedgerEntryId != null,
    detail: `rows=${reversalLedger.length}`,
  });

  const history = await db
    .select()
    .from(reversalHistory)
    .where(eq(reversalHistory.reversalId, reversed.id));

  results.push({
    name: 'reversal-history-trail',
    passed: history.length >= 3,
    detail: `events=${history.length}`,
  });

  let duplicateBlocked = false;
  try {
    await reversePayment(target.paymentId, {
      reason: 'Duplicate reversal attempt should fail',
      actorId,
      actorDisplayName,
    });
  } catch (error) {
    duplicateBlocked =
      error instanceof Error &&
      (error.message === 'REVERSAL_DUPLICATE' ||
        error.message.includes('already been reversed'));
  }

  results.push({
    name: 'reversal-duplicate-blocked',
    passed: duplicateBlocked,
    detail: duplicateBlocked ? 'REVERSAL_DUPLICATE' : 'expected block',
  });

  const conflictPayment = await recordReversiblePayment(collectorId, `${suffix}-conflict`, {
    preferExisting: false,
    excludeLoansWithPaymentCorrection: true,
  });
  const conflictContext = await paymentService.getPaymentEntryContext(conflictPayment.borrowerId);

  const correction = await createAdjustment({
    type: ADJUSTMENT_TYPE.PAYMENT_CORRECTION,
    borrowerId: conflictPayment.borrowerId,
    borrowerName: conflictContext.borrowerName,
    loanId: conflictPayment.loanId,
    amountPesewas: conflictPayment.amountPesewas,
    reason: 'Verification harness correction conflict path',
    actorId,
    actorDisplayName,
  });

  await approveAdjustment(correction.id, actorId, actorDisplayName);

  let correctionBlocked = false;
  try {
    await reversePayment(conflictPayment.paymentId, {
      reason: 'Should fail due to approved payment correction',
      actorId,
      actorDisplayName,
    });
  } catch (error) {
    correctionBlocked =
      error instanceof Error &&
      error.message.includes('approved payment correction adjustment exists');
  }

  results.push({
    name: 'reversal-correction-conflict-blocked',
    passed: correctionBlocked,
    detail: correctionBlocked ? 'blocked' : 'expected block',
  });

  return results;
}

export async function runPaymentReversalSafetyChecks(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];
  const { actorId, actorDisplayName } = await resolveDemoActor();
  const collectorId = await resolveCollectorId();
  const suffix = `${Date.now().toString(36)}-safety`;

  let target: Awaited<ReturnType<typeof recordReversiblePayment>>;
  try {
    target = await recordReversiblePayment(collectorId, suffix);
  } catch (error) {
    return [
      {
        name: 'reversal-safety-seed-payment',
        passed: false,
        detail: error instanceof Error ? error.message : String(error),
      },
    ];
  }

  try {
    const idempotencyKey = `reversal-idempotency-${suffix}`;
    const first = await reversePayment(
      target.paymentId,
      {
        reason: 'Idempotency verification for payment reversal',
        actorId,
        actorDisplayName,
      },
      idempotencyKey,
    );

    const second = await reversePayment(
      target.paymentId,
      {
        reason: 'Idempotency verification for payment reversal',
        actorId,
        actorDisplayName,
      },
      idempotencyKey,
    );

    results.push({
      name: 'reversal-idempotency-replay',
      passed: first.id === second.id,
      detail: `first=${first.id} second=${second.id}`,
    });
  } catch (error) {
    results.push({
      name: 'reversal-idempotency-replay',
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const concurrentTarget = await recordReversiblePayment(
      collectorId,
      `${suffix}-concurrent`,
      { preferExisting: false, excludeLoansWithPaymentCorrection: true },
    );
    const concurrentAttempts = await Promise.allSettled([
      reversePayment(concurrentTarget.paymentId, {
        reason: 'Concurrent reversal attempt A',
        actorId,
        actorDisplayName,
      }),
      reversePayment(concurrentTarget.paymentId, {
        reason: 'Concurrent reversal attempt B',
        actorId,
        actorDisplayName,
      }),
    ]);

    const successes = concurrentAttempts.filter((outcome) => outcome.status === 'fulfilled').length;
    const rejectionMessages = concurrentAttempts
      .filter((outcome): outcome is PromiseRejectedResult => outcome.status === 'rejected')
      .map((outcome) => (outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason)));
    const executedRows = await getDb()
      .select()
      .from(financialReversals)
      .where(
        and(
          eq(financialReversals.sourceType, 'PAYMENT'),
          eq(financialReversals.sourceId, concurrentTarget.paymentId),
          eq(financialReversals.status, 'EXECUTED'),
        ),
      );

    results.push({
      name: 'reversal-concurrency-single-execute',
      passed: successes === 1 && executedRows.length === 1,
      detail: `successes=${successes} executedRows=${executedRows.length} rejections=${rejectionMessages.join('|') || 'none'}`,
    });
  } catch (error) {
    results.push({
      name: 'reversal-concurrency-single-execute',
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  return results;
}

export async function runPaymentReversalIntegrityChecks(): Promise<VerificationResult[]> {
  const db = getDb();
  const results: VerificationResult[] = [];

  const executedRows = await db
    .select()
    .from(financialReversals)
    .where(eq(financialReversals.status, 'EXECUTED'));

  for (const row of executedRows) {
    if (
      row.beforeBalancePesewas == null ||
      row.afterBalancePesewas == null ||
      row.deltaPesewas == null
    ) {
      results.push({
        name: `reversal-executed-has-delta-${row.id.slice(-4)}`,
        passed: false,
        detail: 'missing before/after/delta snapshot',
      });
      continue;
    }

    results.push({
      name: `reversal-executed-has-delta-${row.id.slice(-4)}`,
      passed: row.afterBalancePesewas - row.beforeBalancePesewas === row.deltaPesewas,
      detail: `delta=${row.deltaPesewas}`,
    });
  }

  const reversedPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.status, 'REVERSED'));

  results.push({
    name: 'reversal-payments-linked',
    passed: reversedPayments.every((row) => row.reversalId != null && row.reversedAt != null),
    detail: `reversedCount=${reversedPayments.length}`,
  });

  const historyRows = await db.select().from(reversalHistory);
  results.push({
    name: 'reversal-history-non-empty',
    passed: historyRows.length > 0,
    detail: `rows=${historyRows.length}`,
  });

  return results;
}
