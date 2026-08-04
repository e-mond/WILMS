/**
 * P14.3B Phase 3C.2 — Reversal ledger integrity certification.
 *
 * Usage: npm run cert:reversal:ledger -w @wilms/api
 */
import '../config/load-env.js';
import { and, eq, isNull } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import { financialReversals } from '../db/schema/financial-reversals.js';
import { ledgerEntries } from '../db/schema/ledger-entries.js';
import { loans } from '../db/schema/loans.js';
import { payments } from '../db/schema/payments.js';
import { decimalToPesewas } from '../domain/money.js';

export interface LedgerCertResult {
  name: string;
  passed: boolean;
  detail: string;
}

export async function runReversalLedgerCertification(): Promise<LedgerCertResult[]> {
  const db = getDb();
  const results: LedgerCertResult[] = [];

  const executed = await db
    .select()
    .from(financialReversals)
    .where(eq(financialReversals.status, 'EXECUTED'));

  for (const reversal of executed) {
    const suffix = reversal.id.slice(-4);

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, reversal.sourceId))
      .limit(1);

    const reversalLedger = await db
      .select()
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.reversalId, reversal.id),
          eq(ledgerEntries.entryType, 'REVERSAL'),
        ),
      );

    const repaymentLedger = payment
      ? await db
          .select()
          .from(ledgerEntries)
          .where(
            and(
              eq(ledgerEntries.paymentId, payment.id),
              eq(ledgerEntries.entryType, 'REPAYMENT'),
            ),
          )
      : [];

    const netPesewas =
      (payment ? payment.amountPesewas : 0) -
      reversalLedger.reduce((sum, row) => sum + decimalToPesewas(row.amount), 0);

    results.push({
      name: `ledger-net-zero-${suffix}`,
      passed: netPesewas === 0 && reversalLedger.length === 1,
      detail: `payment=${payment?.amountPesewas ?? 'missing'} reversalLedger=${reversalLedger.length} net=${netPesewas}`,
    });

    results.push({
      name: `ledger-links-repayment-${suffix}`,
      passed:
        reversalLedger.length === 1 &&
        reversalLedger[0]!.reversesLedgerEntryId === (repaymentLedger[0]?.id ?? null),
      detail: `reverses=${reversalLedger[0]?.reversesLedgerEntryId ?? 'null'}`,
    });

    results.push({
      name: `payment-reversed-flag-${suffix}`,
      passed: payment?.status === 'REVERSED' && payment.reversalId === reversal.id,
      detail: `status=${payment?.status ?? 'missing'}`,
    });
  }

  const orphanReversalLedger = await db
    .select()
    .from(ledgerEntries)
    .where(and(eq(ledgerEntries.entryType, 'REVERSAL'), isNull(ledgerEntries.reversalId)));

  results.push({
    name: 'no-orphan-reversal-ledger-without-id',
    passed: orphanReversalLedger.length === 0,
    detail: `rows=${orphanReversalLedger.length}`,
  });

  const duplicateExecuted = await db
    .select({
      sourceType: financialReversals.sourceType,
      sourceId: financialReversals.sourceId,
    })
    .from(financialReversals)
    .where(eq(financialReversals.status, 'EXECUTED'));

  const sourceCounts = new Map<string, number>();
  for (const row of duplicateExecuted) {
    const key = `${row.sourceType}:${row.sourceId}`;
    sourceCounts.set(key, (sourceCounts.get(key) ?? 0) + 1);
  }
  const duplicates = [...sourceCounts.entries()].filter(([, count]) => count > 1);

  results.push({
    name: 'no-duplicate-executed-reversals',
    passed: duplicates.length === 0,
    detail: duplicates.length ? duplicates.map(([key]) => key).join(',') : 'none',
  });

  for (const reversal of executed) {
    if (!reversal.loanId) {
      continue;
    }
    const [loan] = await db.select().from(loans).where(eq(loans.id, reversal.loanId)).limit(1);
    if (!loan || reversal.afterBalancePesewas == null || reversal.beforeBalancePesewas == null) {
      continue;
    }
    const expectedDelta = reversal.afterBalancePesewas - reversal.beforeBalancePesewas;
    results.push({
      name: `reversal-balance-delta-${reversal.id.slice(-4)}`,
      passed: expectedDelta === reversal.deltaPesewas,
      detail: `delta=${reversal.deltaPesewas}`,
    });
  }

  return results;
}

async function main(): Promise<void> {
  console.log('P14.3B.3C.2 Ledger Integrity Certification');

  if (!isDatabaseEnabled()) {
    console.error('DATABASE_URL required.');
    process.exit(1);
  }

  const results = await runReversalLedgerCertification();
  let passed = 0;
  for (const result of results) {
    const icon = result.passed ? '✓' : '✗';
    console.log(`  ${icon} ${result.name}: ${result.detail}`);
    if (result.passed) {
      passed += 1;
    }
  }
  console.log(`\nPassed: ${passed}/${results.length}`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
