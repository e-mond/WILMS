/**
 * Remove demo financial seed rows from production (fixed UUID prefixes only).
 *
 * Usage:
 *   node apps/backend/scripts/cleanup-demo-financial-data.mjs          # dry-run
 *   node apps/backend/scripts/cleanup-demo-financial-data.mjs --execute  # delete
 *
 * Requires: DATABASE_URL
 */
import { sql } from 'drizzle-orm';
import '../src/config/load-env.js';
import { getDb, isDatabaseEnabled } from '../src/db/client.js';

const DEMO_BORROWER_PREFIX = '01930001-%';
const DEMO_LOAN_PREFIX = '01930002-%';
const DEMO_POOL_PREFIX = '01930003-%';

const DELETE_STEPS = [
  {
    label: 'reversal_history',
    sql: sql`
      DELETE FROM reversal_history
      WHERE reversal_id IN (
        SELECT id FROM financial_reversals
        WHERE borrower_id::text LIKE ${DEMO_BORROWER_PREFIX}
           OR loan_id::text LIKE ${DEMO_LOAN_PREFIX}
      )
    `,
  },
  {
    label: 'financial_reversals',
    sql: sql`
      DELETE FROM financial_reversals
      WHERE borrower_id::text LIKE ${DEMO_BORROWER_PREFIX}
         OR loan_id::text LIKE ${DEMO_LOAN_PREFIX}
    `,
  },
  {
    label: 'pool_allocations',
    sql: sql`
      DELETE FROM pool_allocations
      WHERE pool_id::text LIKE ${DEMO_POOL_PREFIX}
         OR loan_id::text LIKE ${DEMO_LOAN_PREFIX}
         OR borrower_id::text LIKE ${DEMO_BORROWER_PREFIX}
    `,
  },
  {
    label: 'pool_memberships',
    sql: sql`
      DELETE FROM pool_memberships
      WHERE pool_id::text LIKE ${DEMO_POOL_PREFIX}
    `,
  },
  {
    label: 'payments',
    sql: sql`
      DELETE FROM payments
      WHERE borrower_id::text LIKE ${DEMO_BORROWER_PREFIX}
         OR loan_id::text LIKE ${DEMO_LOAN_PREFIX}
    `,
  },
  {
    label: 'ledger_entries',
    sql: sql`
      DELETE FROM ledger_entries
      WHERE borrower_id::text LIKE ${DEMO_BORROWER_PREFIX}
         OR loan_id::text LIKE ${DEMO_LOAN_PREFIX}
    `,
  },
  {
    label: 'loan_disbursements',
    sql: sql`
      DELETE FROM loan_disbursements
      WHERE loan_id::text LIKE ${DEMO_LOAN_PREFIX}
    `,
  },
  {
    label: 'loan_schedules',
    sql: sql`
      DELETE FROM loan_schedules
      WHERE loan_id::text LIKE ${DEMO_LOAN_PREFIX}
    `,
  },
  {
    label: 'loans',
    sql: sql`DELETE FROM loans WHERE id::text LIKE ${DEMO_LOAN_PREFIX}`,
  },
  {
    label: 'borrowers',
    sql: sql`DELETE FROM borrowers WHERE id::text LIKE ${DEMO_BORROWER_PREFIX}`,
  },
  {
    label: 'loan_pools',
    sql: sql`DELETE FROM loan_pools WHERE id::text LIKE ${DEMO_POOL_PREFIX}`,
  },
];

async function countCandidates(db: ReturnType<typeof getDb>) {
  const [borrowers, loans, pools] = await Promise.all([
    db.execute(sql`SELECT COUNT(*)::int AS count FROM borrowers WHERE id::text LIKE ${DEMO_BORROWER_PREFIX}`),
    db.execute(sql`SELECT COUNT(*)::int AS count FROM loans WHERE id::text LIKE ${DEMO_LOAN_PREFIX}`),
    db.execute(sql`SELECT COUNT(*)::int AS count FROM loan_pools WHERE id::text LIKE ${DEMO_POOL_PREFIX}`),
  ]);

  const readCount = (result: { rows?: { count: number }[] }) =>
    Number(result.rows?.[0]?.count ?? 0);

  return {
    borrowers: readCount(borrowers),
    loans: readCount(loans),
    loanPools: readCount(pools),
  };
}

async function main(): Promise<void> {
  if (!isDatabaseEnabled()) {
    throw new Error('DATABASE_URL is required.');
  }

  const execute = process.argv.includes('--execute');
  const db = getDb();
  const candidates = await countCandidates(db);

  console.log('Demo financial cleanup');
  console.log(`Mode: ${execute ? 'EXECUTE' : 'dry-run'}`);
  console.log(`Candidates: borrowers=${candidates.borrowers} loans=${candidates.loans} loan_pools=${candidates.loanPools}`);

  if (!execute) {
    console.log('No rows deleted. Re-run with --execute to apply deletions.');
    return;
  }

  for (const step of DELETE_STEPS) {
    const result = await db.execute(step.sql);
    const deleted = Number(result.rowCount ?? 0);
    console.log(`  deleted ${step.label}: ${deleted}`);
  }

  const remaining = await countCandidates(db);
  console.log(
    `Remaining demo rows: borrowers=${remaining.borrowers} loans=${remaining.loans} loan_pools=${remaining.loanPools}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
