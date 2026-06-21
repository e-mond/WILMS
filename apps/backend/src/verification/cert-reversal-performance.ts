/**
 * P14.3B Phase 3C.2 — Reversal performance certification (measured only).
 *
 * Usage: npm run cert:reversal:perf -w @wilms/api
 *
 * Prerequisites: fresh seed (`npm run db:seed -w @wilms/api`) and env probe pass.
 */
import '../config/load-env.js';
import { eq } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import { users } from '../db/schema/users.js';
import { reversePayment } from '../modules/payments/payment-reversal.service.js';
import { resolveCertPaymentTarget } from './cert-reversal-prep.js';

const DEMO_ADMIN_EMAIL = 'admin@wilms.demo';
const DEMO_COLLECTOR_EMAIL = 'collector@wilms.demo';
const BATCHES = [100, 500, 1000] as const;

export interface PerfBatchResult {
  batch: number;
  samples: number;
  avgMs: number;
  p95Ms: number;
  p99Ms: number;
  paymentSetupFailures: number;
  reversalFailures: number;
  lockContention: number;
  rollbacks: number;
  otherFailures: number;
}

function percentile(sorted: number[], ratio: number): number {
  const index = Math.ceil(sorted.length * ratio) - 1;
  return sorted[Math.max(0, index)] ?? sorted[0] ?? 0;
}

function classifyFailure(message: string): 'lock' | 'rollback' | 'other' {
  if (message.startsWith('CONFLICT')) {
    return 'lock';
  }
  if (message === 'REVERSAL_DUPLICATE' || message === 'DUPLICATE') {
    return 'rollback';
  }
  return 'other';
}

async function resolveActors() {
  const db = getDb();
  const [admin] = await db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .where(eq(users.email, DEMO_ADMIN_EMAIL))
    .limit(1);
  const [collector] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, DEMO_COLLECTOR_EMAIL))
    .limit(1);
  if (!admin || !collector) {
    throw new Error('Demo users missing — run db:seed');
  }
  return {
    actorId: admin.id,
    actorDisplayName: admin.displayName,
    collectorId: collector.id,
  };
}

export async function runPerformanceBatch(
  count: number,
  actors: Awaited<ReturnType<typeof resolveActors>>,
): Promise<PerfBatchResult> {
  const timings: number[] = [];
  let paymentSetupFailures = 0;
  let reversalFailures = 0;
  let lockContention = 0;
  let rollbacks = 0;
  let otherFailures = 0;

  for (let index = 0; index < count; index += 1) {
    let paymentId: string;
    try {
      const target = await resolveCertPaymentTarget(
        actors.collectorId,
        actors.actorId,
        `cert-perf-${count}-${index}-${Date.now()}`,
        { preferExisting: false },
      );
      paymentId = target.paymentId;
    } catch {
      paymentSetupFailures += 1;
      continue;
    }

    const start = performance.now();
    try {
      await reversePayment(
        paymentId,
        {
          reason: `P14.3B.3C.2 performance certification batch ${count} index ${index}`,
          actorId: actors.actorId,
          actorDisplayName: actors.actorDisplayName,
        },
        `cert-perf-reversal-${count}-${index}-${Date.now()}`,
      );
      timings.push(performance.now() - start);
    } catch (error) {
      reversalFailures += 1;
      const message = error instanceof Error ? error.message : String(error);
      const kind = classifyFailure(message);
      if (kind === 'lock') {
        lockContention += 1;
      } else if (kind === 'rollback') {
        rollbacks += 1;
      } else {
        otherFailures += 1;
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
    paymentSetupFailures,
    reversalFailures,
    lockContention,
    rollbacks,
    otherFailures,
  };
}

async function main(): Promise<void> {
  console.log('P14.3B.3C.2 Performance Certification');
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('Methodology: record payment (setup) + timed reversePayment() per iteration; fresh payment each index');

  if (!isDatabaseEnabled()) {
    process.exit(1);
  }

  const actors = await resolveActors();
  console.log(
    '\n| Batch | Samples | Avg (ms) | P95 (ms) | P99 (ms) | Setup Fail | Rev Fail | Lock | Rollback | Other |',
  );
  console.log(
    '|-------|---------|----------|----------|----------|------------|----------|------|----------|-------|',
  );

  for (const batch of BATCHES) {
    const result = await runPerformanceBatch(batch, actors);
    console.log(
      `| ${result.batch} | ${result.samples} | ${result.avgMs.toFixed(1)} | ${result.p95Ms.toFixed(1)} | ${result.p99Ms.toFixed(1)} | ${result.paymentSetupFailures} | ${result.reversalFailures} | ${result.lockContention} | ${result.rollbacks} | ${result.otherFailures} |`,
    );
  }

  console.log(`Finished: ${new Date().toISOString()}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
