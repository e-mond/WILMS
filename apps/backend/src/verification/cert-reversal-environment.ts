/**
 * P14.3B Phase 3C.2 — Reversal certification environment probe.
 *
 * Usage: npm run cert:reversal:env -w @wilms/api
 */
import '../config/load-env.js';
import { eq } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import { loans } from '../db/schema/loans.js';
import { loanSchedules } from '../db/schema/loan-schedules.js';
import { users } from '../db/schema/users.js';
import * as loanService from '../modules/loans/service.js';
import { resolveCertPaymentTarget } from './cert-reversal-prep.js';

const SEED_LOAN_IDS = [
  '01930002-0001-7000-8000-000000000001',
  '01930002-0001-7000-8000-000000000002',
  '01930002-0001-7000-8000-000000000003',
  '01930002-0001-7000-8000-000000000004',
] as const;

const FALLBACK_DISBURSE = [
  '01930002-0001-7000-8000-000000000003',
  '01930002-0001-7000-8000-000000000004',
] as const;

function maskDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.password = '***';
    return parsed.toString();
  } catch {
    return 'configured (unparseable)';
  }
}

async function main(): Promise<void> {
  console.log('P14.3B.3C.2 Environment Certification Probe');
  console.log('---');

  const databaseUrl = process.env.DATABASE_URL ?? '';
  console.log(`DATABASE_URL: ${databaseUrl ? maskDatabaseUrl(databaseUrl) : 'NOT SET'}`);
  console.log(`DATABASE_ENABLED: ${isDatabaseEnabled()}`);

  if (!isDatabaseEnabled()) {
    process.exit(1);
  }

  const db = getDb();
  await db.select({ id: users.id }).from(users).limit(1);
  console.log('Neon connectivity: OK');

  const migrationTags = [
    '0000_init',
    '0001_tired_sir_ram',
    '0002_sad_bucky',
    '0003_loan_pools',
    '0004_financial_adjustments',
    '0005_financial_reversals',
  ];
  console.log(`Expected migrations (journal): ${migrationTags.join(', ')}`);

  const [admin] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, 'admin@wilms.demo'))
    .limit(1);
  const [collector] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, 'collector@wilms.demo'))
    .limit(1);

  console.log(`Seed admin: ${admin ? admin.id : 'MISSING'}`);
  console.log(`Seed collector: ${collector ? collector.id : 'MISSING'}`);

  if (admin) {
    for (const loanId of FALLBACK_DISBURSE) {
      const loan = await db.select().from(loans).where(eq(loans.id, loanId)).limit(1);
      if (loan[0]?.externalStatus === 'PENDING_DISBURSEMENT') {
        await loanService.disburseLoan(loanId, admin.id, `cert-3c2-disburse-${loanId}`);
        console.log(`Disbursed pending seed loan: ${loanId}`);
      }
    }
  }

  console.log('\nSeed loan status:');
  for (const loanId of SEED_LOAN_IDS) {
    const [loan] = await db.select().from(loans).where(eq(loans.id, loanId)).limit(1);
    if (!loan) {
      console.log(`  ${loanId}: MISSING`);
      continue;
    }
    const schedule = await db
      .select()
      .from(loanSchedules)
      .where(eq(loanSchedules.loanId, loanId));
    const unpaid = schedule.filter((week) => week.status !== 'PAID').length;
    console.log(
      `  ${loanId}: externalStatus=${loan.externalStatus} lifecycle=${loan.lifecycleStatus} unpaidWeeks=${unpaid}`,
    );
  }

  if (!collector || !admin) {
    process.exit(1);
  }

  try {
    const target = await resolveCertPaymentTarget(collector.id, admin.id, `cert-env-${Date.now()}`);
    console.log(`\nReversal-capable payment prepared: paymentId=${target.paymentId} loanId=${target.loanId}`);
  } catch (error) {
    console.error(
      `\nReversal-capable payment: FAILED — ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
