/**
 * P14.3B Phase 2 — Financial adjustment verification checks.
 */
import { eq } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import { adjustmentHistory, financialAdjustments } from '../db/schema/financial-adjustments.js';
import { ledgerEntries } from '../db/schema/ledger-entries.js';
import { users } from '../db/schema/users.js';
import { decimalToPesewas } from '../domain/money.js';
import * as borrowerRepo from '../repositories/borrower.repository.js';
import * as adjustmentHistoryRepo from '../repositories/adjustment-history.repository.js';
import * as adjustmentRepo from '../repositories/adjustment.repository.js';
import * as loanRepo from '../repositories/loan.repository.js';
import {
  approveAdjustment,
  createAdjustment,
  listPendingAdjustments,
  rejectAdjustment,
} from '../modules/adjustments/service.js';
import { ADJUSTMENT_TYPE } from '../domain/adjustment/types.js';
import type { VerificationResult } from './unit-checks.js';

const DEMO_ACTOR_EMAIL = 'admin@wilms.demo';

async function resolveDemoActor(): Promise<{ actorId: string; actorDisplayName: string }> {
  const db = getDb();
  const [row] = await db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .where(eq(users.email, DEMO_ACTOR_EMAIL))
    .limit(1);

  if (!row) {
    throw new Error('Super admin demo user missing — run db:seed');
  }

  return { actorId: row.id, actorDisplayName: row.displayName };
}

async function findActiveLoanBorrower(): Promise<{ borrowerId: string; borrowerName: string; loanId: string } | null> {
  const loans = await loanRepo.listLoans({ externalStatus: 'ACTIVE' });
  const loan = loans[0];
  if (!loan) {
    return null;
  }
  const borrower = await borrowerRepo.getBorrower(loan.borrowerId);
  return {
    borrowerId: loan.borrowerId,
    borrowerName: borrower?.fullName ?? 'Seed Borrower',
    loanId: loan.id,
  };
}

export function adjustmentChecksAvailable(): boolean {
  return isDatabaseEnabled();
}

export async function runAdjustmentWorkflowChecks(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];
  const { actorId, actorDisplayName } = await resolveDemoActor();
  const target = await findActiveLoanBorrower();

  if (!target) {
    return [
      {
        name: 'adjustment-workflow-seed-loan',
        passed: false,
        detail: 'No ACTIVE seed loan available',
      },
    ];
  }

  const created = await createAdjustment({
    type: ADJUSTMENT_TYPE.BALANCE_ADJUSTMENT,
    borrowerId: target.borrowerId,
    borrowerName: target.borrowerName,
    loanId: target.loanId,
    amountPesewas: 1000,
    reason: 'Verification harness balance correction',
    actorId,
    actorDisplayName,
  });

  results.push({
    name: 'adjustment-create-pending',
    passed: created.status === 'PENDING',
    detail: `id=${created.id}`,
  });

  const pending = await listPendingAdjustments();
  results.push({
    name: 'adjustment-list-pending',
    passed: pending.requests.some((row) => row.id === created.id),
    detail: `pendingCount=${pending.pendingCount}`,
  });

  const loanBefore = await loanRepo.findLoanById(target.loanId);
  const beforeBalance = loanBefore ? decimalToPesewas(loanBefore.loanBalance) : 0;

  const approved = await approveAdjustment(created.id, actorId, actorDisplayName);
  results.push({
    name: 'adjustment-approve-status',
    passed: approved.status === 'APPROVED',
    detail: `status=${approved.status}`,
  });

  const loanAfter = await loanRepo.findLoanById(target.loanId);
  const afterBalance = loanAfter ? decimalToPesewas(loanAfter.loanBalance) : 0;
  results.push({
    name: 'adjustment-balance-reduced',
    passed: afterBalance === Math.max(beforeBalance - 1000, 0),
    detail: `before=${beforeBalance} after=${afterBalance}`,
  });

  const db = getDb();
  const ledgerRows = await db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.loanId, target.loanId));
  const adjustmentLedger = ledgerRows.filter((row) => row.entryType === 'ADJUSTMENT');
  results.push({
    name: 'adjustment-ledger-entry',
    passed: adjustmentLedger.length >= 1,
    detail: `adjustmentLedgerRows=${adjustmentLedger.length}`,
  });

  const history = await adjustmentHistoryRepo.listHistoryForAdjustment(created.id);
  results.push({
    name: 'adjustment-history-trail',
    passed: history.length >= 3,
    detail: `events=${history.length}`,
  });

  const rejectTarget = await createAdjustment({
    type: ADJUSTMENT_TYPE.PAYMENT_CORRECTION,
    borrowerId: target.borrowerId,
    borrowerName: target.borrowerName,
    loanId: target.loanId,
    amountPesewas: 500,
    reason: 'Verification harness reject path',
    actorId,
    actorDisplayName,
  });

  const rejected = await rejectAdjustment(
    rejectTarget.id,
    'Rejected by verification harness',
    actorId,
    actorDisplayName,
  );
  results.push({
    name: 'adjustment-reject-status',
    passed: rejected.status === 'REJECTED',
    detail: `status=${rejected.status}`,
  });

  return results;
}

export async function runAdjustmentIntegrityChecks(): Promise<VerificationResult[]> {
  const db = getDb();
  const results: VerificationResult[] = [];

  const approvedRows = await db
    .select()
    .from(financialAdjustments)
    .where(eq(financialAdjustments.status, 'APPROVED'));

  for (const row of approvedRows) {
    if (row.beforeBalancePesewas == null || row.afterBalancePesewas == null || row.deltaPesewas == null) {
      results.push({
        name: `adjustment-approved-has-delta-${row.id.slice(-4)}`,
        passed: false,
        detail: 'missing before/after/delta snapshot',
      });
      continue;
    }

    results.push({
      name: `adjustment-approved-has-delta-${row.id.slice(-4)}`,
      passed: row.afterBalancePesewas - row.beforeBalancePesewas === row.deltaPesewas,
      detail: `delta=${row.deltaPesewas}`,
    });
  }

  const historyRows = await db.select().from(adjustmentHistory);
  results.push({
    name: 'adjustment-history-non-empty',
    passed: historyRows.length > 0,
    detail: `rows=${historyRows.length}`,
  });

  const reasonRows = await adjustmentRepo.listAllAdjustments();
  results.push({
    name: 'adjustment-table-readable',
    passed: reasonRows.length >= 0,
    detail: `adjustments=${reasonRows.length}`,
  });

  return results;
}
