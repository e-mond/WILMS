/**
 * P14.3A.1 — Database-backed verification (requires DATABASE_URL).
 */
import { randomUUID } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';
import { isDatabaseEnabled, getDb } from '../db/client.js';
import { decimalToPesewas } from '../domain/money.js';
import { loanDisbursements } from '../db/schema/loan-disbursements.js';
import { ledgerEntries } from '../db/schema/ledger-entries.js';
import { loanSchedules } from '../db/schema/loan-schedules.js';
import { loans } from '../db/schema/loans.js';
import { payments } from '../db/schema/payments.js';
import * as loanService from '../modules/loans/service.js';
import * as paymentService from '../modules/payments/service.js';
import { SEED_LOAN_IDS } from './cert-financial-prep.js';
import type { VerificationResult } from './unit-checks.js';

function resolveScheduleP95BudgetMs(): number {
  const override = process.env.WILMS_VERIFY_SCHEDULE_P95_MS?.trim();
  if (override) {
    return Number(override);
  }
  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (databaseUrl.includes('neon.tech') || databaseUrl.includes('neon.')) {
    return 3500;
  }
  return 300;
}

function resolveLoanListP95BudgetMs(): number {
  const override = process.env.WILMS_VERIFY_LOAN_LIST_P95_MS?.trim();
  if (override) {
    return Number(override);
  }
  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (databaseUrl.includes('neon.tech') || databaseUrl.includes('neon.')) {
    return 3500;
  }
  return 250;
}

export async function runLedgerConsistencyChecks(): Promise<VerificationResult[]> {
  const db = getDb();
  const results: VerificationResult[] = [];

  for (const loanId of SEED_LOAN_IDS) {
    const [loan] = await db.select().from(loans).where(eq(loans.id, loanId)).limit(1);
    if (!loan) {
      results.push({
        name: `ledger-loan-exists-${loanId.slice(-4)}`,
        passed: false,
        detail: 'seed loan missing — run db:seed',
      });
      continue;
    }

    const principalPesewas = decimalToPesewas(loan.principalAmount);
    const balancePesewas = decimalToPesewas(loan.loanBalance);

    const disbursementRows = await db
      .select()
      .from(loanDisbursements)
      .where(eq(loanDisbursements.loanId, loanId));
    const disbursementTotal = disbursementRows.reduce(
      (sum, row) => sum + decimalToPesewas(row.disbursedAmount),
      0,
    );

    if (disbursementRows.length > 0) {
      results.push({
        name: `disbursement-equals-principal-${loanId.slice(-4)}`,
        passed: disbursementTotal === principalPesewas,
        detail: `disbursed ${disbursementTotal} vs principal ${principalPesewas}`,
      });
    }

    const ledgerRows = await db
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.loanId, loanId));

    const repaymentLedgerTotal = ledgerRows
      .filter((row) => row.entryType === 'REPAYMENT')
      .reduce((sum, row) => sum + decimalToPesewas(row.amount), 0);

    const paymentRows = await db
      .select()
      .from(payments)
      .where(eq(payments.loanId, loanId));
    const paymentTotal = paymentRows.reduce((sum, row) => sum + row.amountPesewas, 0);

    results.push({
      name: `repayment-ledger-matches-payments-${loanId.slice(-4)}`,
      passed: repaymentLedgerTotal === paymentTotal,
      detail: `ledger ${repaymentLedgerTotal} vs payments ${paymentTotal}`,
    });

    const expectedBalance = Math.max(principalPesewas - paymentTotal, 0);
    results.push({
      name: `balance-reconciles-${loanId.slice(-4)}`,
      passed: balancePesewas === expectedBalance,
      detail: `stored ${balancePesewas} vs expected ${expectedBalance}`,
    });

    results.push({
      name: `no-negative-balance-${loanId.slice(-4)}`,
      passed: balancePesewas >= 0,
      detail: `balance ${balancePesewas}`,
    });

    const scheduleRows = await db
      .select()
      .from(loanSchedules)
      .where(eq(loanSchedules.loanId, loanId));
    const scheduleTotal = scheduleRows.reduce(
      (sum, row) => sum + decimalToPesewas(row.installmentAmount),
      0,
    );
    results.push({
      name: `schedule-sum-equals-principal-${loanId.slice(-4)}`,
      passed: scheduleTotal === principalPesewas,
      detail: `schedule ${scheduleTotal} vs principal ${principalPesewas}`,
    });

    const paidWeeks = scheduleRows.filter((row) => row.status === 'PAID').length;
    results.push({
      name: `paid-weeks-match-payments-${loanId.slice(-4)}`,
      passed: paidWeeks === paymentRows.length,
      detail: `paid weeks ${paidWeeks} vs payments ${paymentRows.length}`,
    });

    const orphanLedger = ledgerRows.filter(
      (row) => row.entryType === 'REPAYMENT' && row.paymentId && !paymentRows.some((p) => p.id === row.paymentId),
    );
    results.push({
      name: `no-orphan-repayment-ledger-${loanId.slice(-4)}`,
      passed: orphanLedger.length === 0,
      detail: `orphans ${orphanLedger.length}`,
    });
  }

  return results;
}

export async function runConcurrentRepaymentCheck(concurrency: number): Promise<VerificationResult> {
  const loanId = SEED_LOAN_IDS[0]!;
  const db = getDb();
  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId)).limit(1);

  if (!loan) {
    return {
      name: `concurrent-repayment-${concurrency}`,
      passed: false,
      detail: 'seed active loan missing',
    };
  }

  const [collector] = await db
    .select({ id: payments.collectorUserId })
    .from(payments)
    .where(eq(payments.loanId, loanId))
    .limit(1);

  const scheduleRows = await db
    .select()
    .from(loanSchedules)
    .where(eq(loanSchedules.loanId, loanId));

  const nextPayable = scheduleRows.find((row) => row.status !== 'PAID');
  if (!nextPayable) {
    return {
      name: `concurrent-repayment-${concurrency}`,
      passed: true,
      detail: 'skipped — no payable week on seed loan',
    };
  }

  const paymentDate = nextPayable.dueDate;
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(
    new Date(`${paymentDate}T00:00:00.000Z`),
  );
  if (weekday !== loan.paymentDay) {
    return {
      name: `concurrent-repayment-${concurrency}`,
      passed: true,
      detail: `skipped — ${paymentDate} is ${weekday}, loan payment day is ${loan.paymentDay}`,
    };
  }

  const amountPesewas = decimalToPesewas(loan.installmentAmount);
  const beforePayments = (
    await db.select().from(payments).where(eq(payments.loanId, loanId))
  ).length;

  const collectorId = collector?.id ?? loan.disbursedByUserId;
  if (!collectorId) {
    return {
      name: `concurrent-repayment-${concurrency}`,
      passed: false,
      detail: 'no collector id available',
    };
  }

  const runToken = randomUUID();
  const attempts = Array.from({ length: concurrency }, (_, index) =>
    paymentService
      .recordPayment(
        {
          borrowerId: loan.borrowerId,
          amountPesewas,
          paymentDate,
          collectorId,
        },
        collectorId,
        `concurrency-test-${concurrency}-${runToken}-${index}`,
      )
      .then(() => 'success' as const)
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        if (message.startsWith('CONFLICT') || message === 'DUPLICATE' || message.startsWith('VALIDATION')) {
          return 'rejected' as const;
        }
        return `error:${message}` as const;
      }),
  );

  const outcomes = await Promise.all(attempts);
  const afterPayments = (
    await db.select().from(payments).where(eq(payments.loanId, loanId))
  ).length;

  const successes = outcomes.filter((outcome) => outcome === 'success').length;
  const passed = successes <= 1 && afterPayments - beforePayments <= 1;

  return {
    name: `concurrent-repayment-${concurrency}`,
    passed,
    detail: `successes=${successes}, newPayments=${afterPayments - beforePayments}, outcomes=${outcomes.join('|')}`,
  };
}

export async function runIdempotencyChecks(actorId: string): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];
  const pendingLoanId = SEED_LOAN_IDS[2]!;
  const db = getDb();
  const [loan] = await db.select().from(loans).where(eq(loans.id, pendingLoanId)).limit(1);

  if (!loan || loan.externalStatus !== 'PENDING_DISBURSEMENT') {
    results.push({
      name: 'disburse-idempotency-replay',
      passed: true,
      detail: 'skipped — pending seed loan already disbursed',
    });
    return results;
  }

  const key = `idempotency-audit-${pendingLoanId}`;
  const first = await loanService.disburseLoan(pendingLoanId, actorId, key);
  const second = await loanService.disburseLoan(pendingLoanId, actorId, key);

  results.push({
    name: 'disburse-idempotency-replay',
    passed: first.id === second.id,
    detail: `first=${first.id} second=${second.id}`,
  });

  const disbursementCount = (
    await db
      .select()
      .from(loanDisbursements)
      .where(eq(loanDisbursements.loanId, pendingLoanId))
  ).length;

  results.push({
    name: 'disburse-single-record',
    passed: disbursementCount === 1,
    detail: `disbursements=${disbursementCount}`,
  });

  return results;
}

export async function runPerformanceChecks(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];
  const loanId = SEED_LOAN_IDS[0]!;

  const samples = 5;
  await loanService.listLoans('ACTIVE');
  await loanService.getLoanSchedule(loanId);

  const listTimes: number[] = [];
  for (let index = 0; index < samples; index += 1) {
    const start = performance.now();
    await loanService.listLoans('ACTIVE');
    listTimes.push(performance.now() - start);
  }
  listTimes.sort((left, right) => left - right);
  const listP95 = listTimes[Math.ceil(samples * 0.95) - 1] ?? listTimes[0]!;
  const listBudgetMs = resolveLoanListP95BudgetMs();
  results.push({
    name: 'loan-list-p95-ms',
    passed: listP95 < listBudgetMs,
    detail: `p95=${listP95.toFixed(1)}ms (target <${listBudgetMs}ms)`,
  });

  const scheduleTimes: number[] = [];
  for (let index = 0; index < samples; index += 1) {
    const start = performance.now();
    await loanService.getLoanSchedule(loanId);
    scheduleTimes.push(performance.now() - start);
  }
  scheduleTimes.sort((left, right) => left - right);
  const scheduleP95 = scheduleTimes[Math.ceil(samples * 0.95) - 1] ?? scheduleTimes[0]!;
  const scheduleBudgetMs = resolveScheduleP95BudgetMs();
  results.push({
    name: 'schedule-retrieval-p95-ms',
    passed: scheduleP95 < scheduleBudgetMs,
    detail: `p95=${scheduleP95.toFixed(1)}ms (target <${scheduleBudgetMs}ms)`,
  });

  return results;
}

export async function runPortfolioReconciliationChecks(): Promise<VerificationResult[]> {
  const db = getDb();
  const results: VerificationResult[] = [];
  const seedLoans = await db
    .select()
    .from(loans)
    .where(inArray(loans.id, [...SEED_LOAN_IDS]));

  let totalDisbursedPesewas = 0;
  let totalRepaidPesewas = 0;
  let activeBalancePesewas = 0;

  for (const loan of seedLoans) {
    totalDisbursedPesewas += decimalToPesewas(loan.disbursedAmount);

    const loanPayments = await db.select().from(payments).where(eq(payments.loanId, loan.id));
    const repaid = loanPayments.reduce((sum, row) => sum + row.amountPesewas, 0);
    totalRepaidPesewas += repaid;

    if (loan.externalStatus === 'ACTIVE' || loan.externalStatus === 'DEFAULTED') {
      activeBalancePesewas += decimalToPesewas(loan.loanBalance);
    }

    if (loan.externalStatus === 'COMPLETED') {
      results.push({
        name: `completed-zero-balance-${loan.id.slice(-4)}`,
        passed: decimalToPesewas(loan.loanBalance) === 0,
        detail: `balance=${loan.loanBalance}`,
      });
    }
  }

  const expectedOutstanding = Math.max(totalDisbursedPesewas - totalRepaidPesewas, 0);
  results.push({
    name: 'portfolio-disbursements-minus-repayments',
    passed: expectedOutstanding === activeBalancePesewas,
    detail: `expected=${expectedOutstanding} activeSum=${activeBalancePesewas} (disbursed=${totalDisbursedPesewas} repaid=${totalRepaidPesewas})`,
  });

  return results;
}

export async function runDatabaseIntegrityChecks(): Promise<VerificationResult[]> {
  const db = getDb();
  const results: VerificationResult[] = [];

  const seedLoans = await db
    .select()
    .from(loans)
    .where(inArray(loans.id, [...SEED_LOAN_IDS]));
  const seedSchedules = await db
    .select()
    .from(loanSchedules)
    .where(inArray(loanSchedules.loanId, [...SEED_LOAN_IDS]));
  const seedPayments = await db
    .select()
    .from(payments)
    .where(inArray(payments.loanId, [...SEED_LOAN_IDS]));
  const seedLedger = await db
    .select()
    .from(ledgerEntries)
    .where(inArray(ledgerEntries.loanId, [...SEED_LOAN_IDS]));
  const seedDisbursements = await db
    .select()
    .from(loanDisbursements)
    .where(inArray(loanDisbursements.loanId, [...SEED_LOAN_IDS]));

  const loanIds = new Set(seedLoans.map((row) => row.id));
  const paymentIds = new Set(seedPayments.map((row) => row.id));

  const orphanSchedules = seedSchedules.filter((row) => !loanIds.has(row.loanId));
  results.push({
    name: 'no-schedules-without-loans',
    passed: orphanSchedules.length === 0,
    detail: `orphans=${orphanSchedules.length}`,
  });

  const orphanLedgerPayments = seedLedger.filter(
    (row) => row.paymentId && !paymentIds.has(row.paymentId),
  );
  results.push({
    name: 'no-orphan-ledger-payment-refs',
    passed: orphanLedgerPayments.length === 0,
    detail: `orphans=${orphanLedgerPayments.length}`,
  });

  const paymentKey = (row: typeof payments.$inferSelect) =>
    `${row.borrowerId}|${row.paymentDate}|${row.amountPesewas}`;
  const paymentKeys = seedPayments.map(paymentKey);
  const duplicatePayments = paymentKeys.length - new Set(paymentKeys).size;
  results.push({
    name: 'no-duplicate-payment-tuples',
    passed: duplicatePayments === 0,
    detail: `duplicates=${duplicatePayments} (seed loans only)`,
  });

  const disbursementByLoan = new Map<string, number>();
  for (const row of seedDisbursements) {
    disbursementByLoan.set(row.loanId, (disbursementByLoan.get(row.loanId) ?? 0) + 1);
  }
  const duplicateDisbursements = [...disbursementByLoan.values()].filter((count) => count > 1).length;
  results.push({
    name: 'no-duplicate-disbursements-per-loan',
    passed: duplicateDisbursements === 0,
    detail: `loansWithMultiple=${duplicateDisbursements}`,
  });

  const negativeBalances = seedLoans.filter((row) => decimalToPesewas(row.loanBalance) < 0);
  results.push({
    name: 'no-negative-loan-balances',
    passed: negativeBalances.length === 0,
    detail: `count=${negativeBalances.length}`,
  });

  return results;
}

export function databaseChecksAvailable(): boolean {
  return isDatabaseEnabled();
}
