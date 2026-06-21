/**
 * P14.3B Phase 3C.2 — Reversal concurrency certification.
 *
 * Usage: npm run cert:reversal:concurrency -w @wilms/api
 */
import '../config/load-env.js';
import { and, eq } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import { financialReversals } from '../db/schema/financial-reversals.js';
import { users } from '../db/schema/users.js';
import { reversePayment } from '../modules/payments/payment-reversal.service.js';
import { resolveCertPaymentTarget } from './cert-reversal-prep.js';

const DEMO_ADMIN_EMAIL = 'admin@wilms.demo';
const DEMO_COLLECTOR_EMAIL = 'collector@wilms.demo';
const CONCURRENCY_LEVELS = [10, 25, 50] as const;

export interface ConcurrencyCertResult {
  level: number;
  successes: number;
  executedRows: number;
  lockRejections: number;
  otherRejections: number;
  passed: boolean;
  detail: string;
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

export async function runConcurrencyLevel(
  level: number,
  actors: Awaited<ReturnType<typeof resolveActors>>,
): Promise<ConcurrencyCertResult> {
  const target = await resolveCertPaymentTarget(
    actors.collectorId,
    actors.actorId,
    `cert-concurrency-${level}-${Date.now()}`,
    { preferExisting: false },
  );

  const samePaymentAttempts = await Promise.allSettled(
    Array.from({ length: level }, (_, index) =>
      reversePayment(target.paymentId, {
        reason: `Concurrent same-payment attempt ${index} at level ${level}`,
        actorId: actors.actorId,
        actorDisplayName: actors.actorDisplayName,
      }),
    ),
  );

  let lockRejections = 0;
  let otherRejections = 0;
  for (const outcome of samePaymentAttempts) {
    if (outcome.status === 'rejected') {
      const message =
        outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason);
      if (message.startsWith('CONFLICT') || message === 'REVERSAL_DUPLICATE') {
        lockRejections += 1;
      } else {
        otherRejections += 1;
      }
    }
  }

  const successes = samePaymentAttempts.filter((outcome) => outcome.status === 'fulfilled').length;
  const db = getDb();
  const executedRows = await db
    .select()
    .from(financialReversals)
    .where(
      and(
        eq(financialReversals.sourceType, 'PAYMENT'),
        eq(financialReversals.sourceId, target.paymentId),
        eq(financialReversals.status, 'EXECUTED'),
      ),
    );

  const passed = successes === 1 && executedRows.length === 1 && otherRejections === 0;

  return {
    level,
    successes,
    executedRows: executedRows.length,
    lockRejections,
    otherRejections,
    passed,
    detail: `successes=${successes} executed=${executedRows.length} lockRejections=${lockRejections}`,
  };
}

async function main(): Promise<void> {
  console.log('P14.3B.3C.2 Concurrency Certification');
  console.log(`Started: ${new Date().toISOString()}`);

  if (!isDatabaseEnabled()) {
    process.exit(1);
  }

  const actors = await resolveActors();
  let allPassed = true;

  console.log('\n| Level | Successes | Executed | Lock Rejections | Other | Pass |');
  console.log('|-------|-----------|----------|-----------------|-------|------|');

  for (const level of CONCURRENCY_LEVELS) {
    const result = await runConcurrencyLevel(level, actors);
    console.log(
      `| ${result.level} | ${result.successes} | ${result.executedRows} | ${result.lockRejections} | ${result.otherRejections} | ${result.passed ? 'YES' : 'NO'} |`,
    );
    if (!result.passed) {
      allPassed = false;
    }
  }

  console.log(`Finished: ${new Date().toISOString()}`);
  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
