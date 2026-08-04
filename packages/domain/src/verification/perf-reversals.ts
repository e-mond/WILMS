/**
 * P14.3B Phase 3C.1 — Payment reversal performance simulation.
 *
 * Usage: npm run perf:reversals -w @wilms/api
 */
import '../config/load-env.js';
import { eq } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import { users } from '../db/schema/users.js';
import { reversePayment } from '../modules/payments/payment-reversal.service.js';
import { recordReversiblePayment } from './reversal-checks.js';

const DEMO_ADMIN_EMAIL = 'admin@wilms.demo';
const DEMO_COLLECTOR_EMAIL = 'collector@wilms.demo';
const BATCHES = [100, 500, 1000] as const;

function percentile(sorted: number[], ratio: number): number {
  const index = Math.ceil(sorted.length * ratio) - 1;
  return sorted[Math.max(0, index)] ?? sorted[0] ?? 0;
}

async function resolveActors(): Promise<{
  actorId: string;
  actorDisplayName: string;
  collectorId: string;
}> {
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

async function simulateBatch(
  count: number,
  actors: Awaited<ReturnType<typeof resolveActors>>,
): Promise<{ avgMs: number; p95Ms: number; failures: number }> {
  const timings: number[] = [];
  let failures = 0;

  for (let index = 0; index < count; index += 1) {
    let paymentId: string;
    try {
      const target = await recordReversiblePayment(
        actors.collectorId,
        `perf-${count}-${index}-${Date.now()}`,
        { preferExisting: false },
      );
      paymentId = target.paymentId;
    } catch {
      failures += 1;
      continue;
    }

    const start = performance.now();
    try {
      await reversePayment(
        paymentId,
        {
          reason: `Performance simulation reversal batch ${count} index ${index}`,
          actorId: actors.actorId,
          actorDisplayName: actors.actorDisplayName,
        },
        `perf-reversal-${count}-${index}-${Date.now()}`,
      );
      timings.push(performance.now() - start);
    } catch {
      failures += 1;
    }
  }

  const sorted = [...timings].sort((left, right) => left - right);
  const sum = sorted.reduce((total, value) => total + value, 0);

  return {
    avgMs: sorted.length ? sum / sorted.length : 0,
    p95Ms: percentile(sorted, 0.95),
    failures,
  };
}

async function main(): Promise<void> {
  console.log('P14.3B Payment Reversal Performance Simulation');

  if (!isDatabaseEnabled()) {
    console.error('DATABASE_URL required.');
    process.exit(1);
  }

  const actors = await resolveActors();
  console.log('\n| Batch | Avg (ms) | P95 (ms) | Failures |');
  console.log('|-------|----------|----------|----------|');

  for (const batch of BATCHES) {
    const result = await simulateBatch(batch, actors);
    console.log(
      `| ${batch} | ${result.avgMs.toFixed(1)} | ${result.p95Ms.toFixed(1)} | ${result.failures} |`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
