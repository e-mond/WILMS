/**
 * P14.5A — RC-059: reset seed financial state before verify:financial.
 *
 * Removes harness pollution on the four canonical seed loans and re-applies seed snapshots.
 *
 * Usage: npm run cert:financial:prep -w @wilms/api
 */
import '../config/load-env.js';
import { inArray } from 'drizzle-orm';
import { isDatabaseEnabled, getDb } from '../db/client.js';
import { financialAdjustments, adjustmentHistory } from '../db/schema/financial-adjustments.js';
import { financialReversals, reversalHistory } from '../db/schema/financial-reversals.js';
import { ledgerEntries } from '../db/schema/ledger-entries.js';
import { poolAllocations } from '../db/schema/loan-pools.js';
import { loanDisbursements } from '../db/schema/loan-disbursements.js';
import { loanSchedules } from '../db/schema/loan-schedules.js';
import { loans } from '../db/schema/loans.js';
import { payments } from '../db/schema/payments.js';
import { seedFinancialCore } from '../db/seed/seed-financial.js';

export const SEED_LOAN_IDS = [
  '01930002-0001-7000-8000-000000000001',
  '01930002-0001-7000-8000-000000000002',
  '01930002-0001-7000-8000-000000000003',
  '01930002-0001-7000-8000-000000000004',
] as const;

export async function resetSeedFinancialState(): Promise<void> {
  if (!isDatabaseEnabled()) {
    throw new Error('DATABASE_URL required for cert financial prep');
  }

  const db = getDb();
  const seedLoanIds = [...SEED_LOAN_IDS];

  const reversalRows = await db
    .select({ id: financialReversals.id })
    .from(financialReversals)
    .where(inArray(financialReversals.loanId, seedLoanIds));

  if (reversalRows.length > 0) {
    const reversalIds = reversalRows.map((row) => row.id);
    await db.delete(reversalHistory).where(inArray(reversalHistory.reversalId, reversalIds));
    await db.delete(financialReversals).where(inArray(financialReversals.id, reversalIds));
  }

  const adjustmentRows = await db
    .select({ id: financialAdjustments.id })
    .from(financialAdjustments)
    .where(inArray(financialAdjustments.loanId, seedLoanIds));

  if (adjustmentRows.length > 0) {
    const adjustmentIds = adjustmentRows.map((row) => row.id);
    await db.delete(adjustmentHistory).where(inArray(adjustmentHistory.adjustmentId, adjustmentIds));
    await db.delete(financialAdjustments).where(inArray(financialAdjustments.id, adjustmentIds));
  }

  await db.delete(poolAllocations).where(inArray(poolAllocations.loanId, seedLoanIds));

  const paymentRows = await db
    .select({ id: payments.id })
    .from(payments)
    .where(inArray(payments.loanId, seedLoanIds));
  const paymentIds = paymentRows.map((row) => row.id);

  if (paymentIds.length > 0) {
    await db.delete(poolAllocations).where(inArray(poolAllocations.paymentId, paymentIds));
    await db.delete(ledgerEntries).where(inArray(ledgerEntries.paymentId, paymentIds));
  }

  await db.delete(ledgerEntries).where(inArray(ledgerEntries.loanId, seedLoanIds));
  await db.delete(payments).where(inArray(payments.loanId, seedLoanIds));
  await db.delete(loanSchedules).where(inArray(loanSchedules.loanId, seedLoanIds));
  await db.delete(loanDisbursements).where(inArray(loanDisbursements.loanId, seedLoanIds));
  await db.delete(loans).where(inArray(loans.id, seedLoanIds));

  await seedFinancialCore();
}

async function main(): Promise<void> {
  await resetSeedFinancialState();
  console.log('cert:financial:prep PASS — seed financial state reset');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
