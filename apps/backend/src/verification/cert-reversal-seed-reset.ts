/**
 * P14.3B Phase 3C.2 — Certification environment seed reset (tooling only).
 *
 * Resets harness pollution on shared Neon without modifying product seed code.
 * Removes approved PAYMENT_CORRECTION rows created by verification harnesses
 * so cert scripts can record fresh reversible payments.
 *
 * Usage: npm run cert:reversal:seed-reset -w @wilms/api
 */
import '../config/load-env.js';
import { and, eq, like, or } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import { financialAdjustments } from '../db/schema/financial-adjustments.js';
import { loans } from '../db/schema/loans.js';
import { users } from '../db/schema/users.js';
import * as loanService from '../modules/loans/service.js';
import * as loanRepo from '../repositories/loan.repository.js';
import { resolveCertPaymentTarget } from './cert-reversal-prep.js';

const SEED_LOAN_IDS = [
  '01930002-0001-7000-8000-000000000001',
  '01930002-0001-7000-8000-000000000002',
  '01930002-0001-7000-8000-000000000003',
  '01930002-0001-7000-8000-000000000004',
] as const;

const HARNESS_CORRECTION_REASON_PATTERNS = [
  '%Verification harness%',
  '%harness correction%',
  '%cert-3c2%',
] as const;

async function resolveActors() {
  const db = getDb();
  const [admin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, 'admin@wilms.demo'))
    .limit(1);
  const [collector] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, 'collector@wilms.demo'))
    .limit(1);
  if (!admin || !collector) {
    throw new Error('Demo users missing — run db:seed');
  }
  return { adminId: admin.id, collectorId: collector.id };
}

async function neutralizeHarnessPaymentCorrections(): Promise<number> {
  const db = getDb();
  const patternFilters = HARNESS_CORRECTION_REASON_PATTERNS.map((pattern) =>
    like(financialAdjustments.reason, pattern),
  );

  const neutralized = await db
    .update(financialAdjustments)
    .set({ status: 'REJECTED', updatedAt: new Date() })
    .where(
      and(
        eq(financialAdjustments.type, 'PAYMENT_CORRECTION'),
        eq(financialAdjustments.status, 'APPROVED'),
        or(...patternFilters),
      ),
    )
    .returning({ id: financialAdjustments.id });

  return neutralized.length;
}

async function disbursePendingCertLoans(adminId: string): Promise<string[]> {
  const disbursed: string[] = [];
  for (const loanId of ['01930002-0001-7000-8000-000000000003', '01930002-0001-7000-8000-000000000004'] as const) {
    const loan = await loanRepo.findLoanById(loanId);
    if (loan?.externalStatus === 'PENDING_DISBURSEMENT') {
      try {
        await loanService.disburseLoan(loanId, adminId, `cert-3c2-seed-reset-disburse-${loanId}`);
        disbursed.push(loanId);
      } catch {
        // Concurrent disburse is acceptable.
      }
    }
  }
  return disbursed;
}

async function logSeedLoanStatus(): Promise<void> {
  const db = getDb();
  console.log('\nSeed loan status after reset:');
  for (const loanId of SEED_LOAN_IDS) {
    const [loan] = await db.select().from(loans).where(eq(loans.id, loanId)).limit(1);
    if (!loan) {
      console.log(`  ${loanId}: MISSING`);
      continue;
    }
    const corrections = await db
      .select({ id: financialAdjustments.id })
      .from(financialAdjustments)
      .where(
        and(
          eq(financialAdjustments.loanId, loanId),
          eq(financialAdjustments.type, 'PAYMENT_CORRECTION'),
          eq(financialAdjustments.status, 'APPROVED'),
        ),
      );
    console.log(
      `  ${loanId}: external=${loan.externalStatus} lifecycle=${loan.lifecycleStatus} approvedCorrections=${corrections.length}`,
    );
  }
}

async function main(): Promise<void> {
  console.log('P14.3B.3C.2 Certification Seed Reset');
  console.log('Method: neutralize harness PAYMENT_CORRECTION rows + disburse pending cert loans');
  console.log(`Started: ${new Date().toISOString()}`);

  if (!isDatabaseEnabled()) {
    process.exit(1);
  }

  const actors = await resolveActors();
  const neutralized = await neutralizeHarnessPaymentCorrections();
  console.log(`Neutralized harness PAYMENT_CORRECTION rows: ${neutralized}`);

  const disbursed = await disbursePendingCertLoans(actors.adminId);
  if (disbursed.length > 0) {
    console.log(`Disbursed loans: ${disbursed.join(', ')}`);
  }

  await logSeedLoanStatus();

  try {
    const target = await resolveCertPaymentTarget(
      actors.collectorId,
      actors.adminId,
      `cert-seed-reset-${Date.now()}`,
      { preferExisting: true },
    );
    console.log(
      `\nOutcome: SUCCESS — reversal-capable payment paymentId=${target.paymentId} loanId=${target.loanId}`,
    );
  } catch (error) {
    console.error(
      `\nOutcome: STILL BLOCKED — ${error instanceof Error ? error.message : String(error)}`,
    );
    console.error(
      'Recommendation: create a fresh Neon branch or manually reset transactional seed data.',
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
