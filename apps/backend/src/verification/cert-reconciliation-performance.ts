/**
 * P14.3B Phase 4C.4 — Reconciliation performance certification (measured only).
 *
 * Usage: npm run cert:reconciliation:perf -w @wilms/api
 */
import '../config/load-env.js';
import { eq } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import { users } from '../db/schema/users.js';
import { calculateExpectedDuePesewas } from '../domain/reconciliation/expected-cash.js';
import * as loanRepo from '../repositories/loan.repository.js';
import { submitReconciliation } from '../modules/reconciliation/service.js';
import { certDateForIndex, DEMO_COLLECTOR_EMAIL, ensureCertCollectorPortfolio } from './cert-reconciliation-prep.js';

const BATCHES = [100, 500, 1000] as const;
const EARLY_STOP_SAMPLE = 25;
const EARLY_STOP_FAILURE_RATE = 0.25;

export interface PerfBatchResult {
  batch: number;
  samples: number;
  avgMs: number;
  p95Ms: number;
  p99Ms: number;
  submitFailures: number;
  rollbacks: number;
  otherFailures: number;
  stoppedEarly: boolean;
  stopReason?: string;
}

function percentile(sorted: number[], ratio: number): number {
  const index = Math.ceil(sorted.length * ratio) - 1;
  return sorted[Math.max(0, index)] ?? sorted[0] ?? 0;
}

function classifyFailure(message: string): 'rollback' | 'other' {
  if (
    message.includes('VALIDATION:Reconciliation already submitted') ||
    message.startsWith('DUPLICATE:') ||
    message === 'IDEMPOTENCY_IN_PROGRESS'
  ) {
    return 'rollback';
  }
  return 'other';
}

async function resolveCollector() {
  const db = getDb();
  const [collector] = await db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .where(eq(users.email, DEMO_COLLECTOR_EMAIL))
    .limit(1);
  if (!collector) {
    throw new Error('Demo collector missing — run db:seed');
  }
  return collector;
}

export async function runPerformanceBatch(
  count: number,
  collector: { id: string; displayName: string | null },
  batchOffset: number,
): Promise<PerfBatchResult> {
  const timings: number[] = [];
  let submitFailures = 0;
  let rollbacks = 0;
  let otherFailures = 0;
  let stoppedEarly = false;
  let stopReason: string | undefined;

  for (let index = 0; index < count; index += 1) {
    const certDate = certDateForIndex(batchOffset + index);
    const dueLoans = await loanRepo.listPortfolioLoansForCollector(collector.id);
    const expectedDue = calculateExpectedDuePesewas(
      dueLoans.map((loan) => ({
        paymentDay: loan.paymentDay,
        weeklyPaymentPesewas: loan.weeklyPaymentPesewas,
      })),
      certDate,
    );
    const start = performance.now();
    try {
      await submitReconciliation(
        {
          collectorId: collector.id,
          reconciliationDate: certDate,
          physicalCashPesewas: expectedDue,
          actorId: collector.id,
          actorDisplayName: collector.displayName ?? undefined,
        },
        `cert-reconciliation-perf-${count}-${index}-${Date.now()}`,
      );
      timings.push(performance.now() - start);
    } catch (error) {
      submitFailures += 1;
      const message = error instanceof Error ? error.message : String(error);
      if (classifyFailure(message) === 'rollback') {
        rollbacks += 1;
      } else {
        otherFailures += 1;
      }
    }

    const attempts = index + 1;
    if (attempts === EARLY_STOP_SAMPLE) {
      const failureRate = submitFailures / attempts;
      if (timings.length === 0) {
        stoppedEarly = true;
        stopReason = 'No successful submissions within first 25 attempts';
        break;
      }
      if (failureRate > EARLY_STOP_FAILURE_RATE) {
        stoppedEarly = true;
        stopReason = `Failure rate ${(failureRate * 100).toFixed(1)}% exceeds 25% threshold`;
        break;
      }
    }
  }

  const sorted = [...timings].sort((left, right) => left - right);
  const sum = sorted.reduce((total, value) => total + value, 0);

  return {
    batch: count,
    samples: sorted.length,
    avgMs: sorted.length ? sum / sorted.length : 0,
    p95Ms: percentile(sorted, 0.95),
    p99Ms: percentile(sorted, 0.99),
    submitFailures,
    rollbacks,
    otherFailures,
    stoppedEarly,
    stopReason,
  };
}

async function main(): Promise<void> {
  const cliBatches = process.argv
    .slice(2)
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value) && value > 0);
  const batches = cliBatches.length > 0 ? cliBatches : [...BATCHES];

  console.log('P14.3B.4C.4 Performance Certification');
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('Methodology: timed submitReconciliation() per iteration; unique cert date per index');
  console.log(`Batches: ${batches.join(', ')}`);

  if (!isDatabaseEnabled()) {
    process.exit(1);
  }

  const collector = await resolveCollector();
  await ensureCertCollectorPortfolio(collector.id);
  let batchOffset = 20_000;

  console.log(
    '\n| Batch | Samples | Avg (ms) | P95 (ms) | P99 (ms) | Fail | Rollback | Other |',
  );
  console.log('|-------|---------|----------|----------|----------|------|----------|-------|');

  for (const batch of batches) {
    const result = await runPerformanceBatch(batch, collector, batchOffset);
    batchOffset += batch + 100;
    console.log(
      `| ${result.batch} | ${result.samples} | ${result.avgMs.toFixed(1)} | ${result.p95Ms.toFixed(1)} | ${result.p99Ms.toFixed(1)} | ${result.submitFailures} | ${result.rollbacks} | ${result.otherFailures} |${result.stoppedEarly ? ` STOP: ${result.stopReason}` : ''}`,
    );
  }

  console.log(`Finished: ${new Date().toISOString()}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
