/**
 * One-shot pool latency sample for P14.3B Phase 1 certification.
 * Usage: npx tsx src/verification/pool-perf-sample.ts
 */
import '../config/load-env.js';
import { isDatabaseEnabled } from '../db/client.js';
import * as poolService from '../modules/loan-pools/service.js';

async function measure(fn: () => Promise<unknown>, samples = 8, warmup = 2) {
  for (let i = 0; i < warmup; i += 1) await fn();
  const timings: number[] = [];
  for (let i = 0; i < samples; i += 1) {
    const start = performance.now();
    await fn();
    timings.push(performance.now() - start);
  }
  timings.sort((a, b) => a - b);
  const sum = timings.reduce((t, v) => t + v, 0);
  return {
    samples: timings.length,
    avgMs: sum / timings.length,
    p95Ms: timings[Math.ceil(timings.length * 0.95) - 1] ?? timings[0],
    minMs: timings[0],
    maxMs: timings[timings.length - 1],
  };
}

async function main(): Promise<void> {
  if (!isDatabaseEnabled()) {
    console.error('DATABASE_URL required');
    process.exit(1);
  }

  const list = await measure(() => poolService.listLoanPools());
  const snapshot = await poolService.listLoanPools();
  const poolId = snapshot.pools[0]?.id;
  if (!poolId) {
    console.error('No pools seeded');
    process.exit(1);
  }
  const detail = await measure(() => poolService.getLoanPool(poolId));

  console.log(
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        poolId,
        listLoanPools: { ...list, estimatedQueries: 1 },
        getLoanPool: { ...detail, estimatedQueries: 2 },
        poolCreationAllocation: {
          note: 'No public HTTP write API in Phase 1; seed uses runInTransaction with insertPool + appendAllocation per pool',
          estimatedQueriesPerSeedPool: '1 insert + N allocations + loan updates',
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
