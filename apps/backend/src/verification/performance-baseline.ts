/**
 * P14.3B Phase 0 — Performance baseline (requires DATABASE_URL / Neon).
 *
 * Usage: npm run perf:baseline -w @wilms/api
 */
import '../config/load-env.js';
import { eq } from 'drizzle-orm';
import { isDatabaseEnabled, getDb } from '../db/client.js';
import { borrowers } from '../db/schema/borrowers.js';
import { loans } from '../db/schema/loans.js';
import { payments } from '../db/schema/payments.js';
import * as loanService from '../modules/loans/service.js';
import * as paymentRepo from '../repositories/payment.repository.js';

const SEED_LOAN_ID = '01930002-0001-7000-8000-000000000001';
const SEED_BORROWER_ID = '01930001-0001-7000-8000-000000000001';
const SEED_GROUP_NAME = 'Sunrise Group';
const SAMPLE_COUNT = 20;
const WARMUP_COUNT = 2;

export interface BaselineMeasurement {
  category: string;
  operation: string;
  samples: number;
  avgMs: number;
  p95Ms: number;
  p99Ms: number;
  minMs: number;
  maxMs: number;
  estimatedDbQueries: number;
  notes: string;
}

function percentile(sorted: number[], ratio: number): number {
  const index = Math.ceil(sorted.length * ratio) - 1;
  return sorted[Math.max(0, index)] ?? sorted[0] ?? 0;
}

function summarizeTimings(
  category: string,
  operation: string,
  timings: number[],
  estimatedDbQueries: number,
  notes: string,
): BaselineMeasurement {
  const sorted = [...timings].sort((left, right) => left - right);
  const sum = sorted.reduce((total, value) => total + value, 0);
  return {
    category,
    operation,
    samples: sorted.length,
    avgMs: sorted.length ? sum / sorted.length : 0,
    p95Ms: percentile(sorted, 0.95),
    p99Ms: percentile(sorted, 0.99),
    minMs: sorted[0] ?? 0,
    maxMs: sorted[sorted.length - 1] ?? 0,
    estimatedDbQueries,
    notes,
  };
}

async function measure<T>(
  fn: () => Promise<T>,
  warmup = WARMUP_COUNT,
  samples = SAMPLE_COUNT,
): Promise<number[]> {
  for (let index = 0; index < warmup; index += 1) {
    await fn();
  }

  const timings: number[] = [];
  for (let index = 0; index < samples; index += 1) {
    const start = performance.now();
    await fn();
    timings.push(performance.now() - start);
  }
  return timings;
}

async function runGroupPortfolioQuery(): Promise<void> {
  const db = getDb();
  const groupBorrowers = await db
    .select({ id: borrowers.id })
    .from(borrowers)
    .where(eq(borrowers.groupName, SEED_GROUP_NAME));

  for (const borrower of groupBorrowers) {
    await loanService.listBorrowerLoans(borrower.id);
  }
}

async function runRepaymentSummaryQuery(): Promise<void> {
  const allPayments = await paymentRepo.listPayments();
  const today = new Date().toISOString().slice(0, 10);
  allPayments.filter((payment) => payment.paymentDate === today);
}

async function main(): Promise<void> {
  console.log('P14.3B Phase 0 — Performance Baseline');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`DATABASE_URL: ${isDatabaseEnabled() ? 'configured (Neon)' : 'NOT configured'}`);

  if (!isDatabaseEnabled()) {
    console.error('Baseline requires DATABASE_URL.');
    process.exit(1);
  }

  const db = getDb();
  const [collectorRow] = await db
    .select({ id: payments.collectorUserId })
    .from(payments)
    .limit(1);

  const collectorId = collectorRow?.id ?? '';
  const measurements: BaselineMeasurement[] = [];

  measurements.push(
    summarizeTimings(
      'Loan Queries',
      'listLoans(ACTIVE)',
      await measure(() => loanService.listLoans('ACTIVE')),
      1,
      'Full table scan; status filtered in application code (loan.repository.ts)',
    ),
  );

  measurements.push(
    summarizeTimings(
      'Loan Queries',
      'getLoan(detail)',
      await measure(() => loanService.getLoan(SEED_LOAN_ID)),
      1,
      'Single loan by PK',
    ),
  );

  measurements.push(
    summarizeTimings(
      'Loan Queries',
      'getLoanSchedule',
      await measure(() => loanService.getLoanSchedule(SEED_LOAN_ID)),
      3,
      'findLoan + applyMissedWeekMarking (read/write) + listScheduleWeeks',
    ),
  );

  measurements.push(
    summarizeTimings(
      'Loan Queries',
      'listLoanPaymentLog',
      await measure(() => loanService.listLoanPaymentLog(SEED_LOAN_ID)),
      3,
      'findLoan + disbursement + ledger list',
    ),
  );

  measurements.push(
    summarizeTimings(
      'Portfolio Queries',
      'listPortfolioEntries',
      await measure(() => loanService.listPortfolioEntries()),
      1,
      '1 loan query + 2 borrower lookups per loan (N+1)',
    ),
  );

  const loanCount = (await db.select({ id: loans.id }).from(loans)).length;
  const portfolioMeasurement = measurements[measurements.length - 1];
  if (portfolioMeasurement) {
    portfolioMeasurement.estimatedDbQueries = 1 + loanCount * 2;
  }

  measurements.push(
    summarizeTimings(
      'Portfolio Queries',
      'listBorrowerLoans',
      await measure(() => loanService.listBorrowerLoans(SEED_BORROWER_ID)),
      1,
      'Filtered loan list by borrower_id',
    ),
  );

  if (collectorId) {
    measurements.push(
      summarizeTimings(
        'Portfolio Queries',
        'collectorPaymentsScan',
        await measure(async () => {
          const rows = await paymentRepo.listPayments();
          rows.filter((row) => row.collectorId === collectorId);
        }),
        1,
        'Full payments table scan; no collector index',
      ),
    );
  }

  const groupBorrowerCount = (
    await db
      .select({ id: borrowers.id })
      .from(borrowers)
      .where(eq(borrowers.groupName, SEED_GROUP_NAME))
  ).length;

  measurements.push(
    summarizeTimings(
      'Portfolio Queries',
      'groupPortfolio (borrowers + loans)',
      await measure(() => runGroupPortfolioQuery()),
      1 + groupBorrowerCount,
      `${groupBorrowerCount} borrower(s) in "${SEED_GROUP_NAME}" + 1 query each for loans`,
    ),
  );

  measurements.push(
    summarizeTimings(
      'Reporting Queries',
      'repaymentSummary (daily filter)',
      await measure(() => runRepaymentSummaryQuery()),
      1,
      'Full payments scan + in-memory date filter (reports/daily-collection pattern)',
    ),
  );

  measurements.push(
    summarizeTimings(
      'Reporting Queries',
      'outstandingBalances (ACTIVE loans)',
      await measure(() => loanService.listLoans('ACTIVE')),
      1,
      'Same path as listLoans(ACTIVE); report route is stub today',
    ),
  );

  measurements.push(
    summarizeTimings(
      'Reporting Queries',
      'defaultedLoans (DEFAULTED filter)',
      await measure(() => loanService.listLoans('DEFAULTED')),
      1,
      'Full scan + JS filter; report route is stub today',
    ),
  );

  console.log('\n=== BASELINE MEASUREMENTS ===');
  console.log(
    JSON.stringify(
      {
        environment: 'Neon (remote)',
        sampleCount: SAMPLE_COUNT,
        warmupCount: WARMUP_COUNT,
        seedLoanId: SEED_LOAN_ID,
        measurements,
      },
      null,
      2,
    ),
  );

  console.log('\n=== TABLE ===');
  console.log(
    '| Category | Operation | Avg (ms) | P95 (ms) | P99 (ms) | Est. queries |',
  );
  console.log('|----------|-----------|----------|----------|----------|--------------|');
  for (const row of measurements) {
    console.log(
      `| ${row.category} | ${row.operation} | ${row.avgMs.toFixed(1)} | ${row.p95Ms.toFixed(1)} | ${row.p99Ms.toFixed(1)} | ${row.estimatedDbQueries} |`,
    );
  }

  const harnessTargets = [
    { name: 'loan-list-p95-ms', target: 250, actual: measurements.find((m) => m.operation === 'listLoans(ACTIVE)')?.p95Ms },
    {
      name: 'schedule-retrieval-p95-ms',
      target: 300,
      actual: measurements.find((m) => m.operation === 'getLoanSchedule')?.p95Ms,
    },
  ];

  console.log('\n=== HARNESS SLO COMPARISON ===');
  for (const item of harnessTargets) {
    const status = item.actual !== undefined && item.actual < item.target ? 'PASS' : 'FAIL';
    console.log(
      `  ${item.name}: p95=${item.actual?.toFixed(1) ?? 'n/a'}ms target <${item.target}ms [${status}]`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
