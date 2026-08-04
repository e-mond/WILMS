/**
 * P14.3B Phase 4C.4 — Reset certification reconciliation rows on shared Neon.
 *
 * Usage: npm run cert:reconciliation:seed-reset -w @wilms/api
 */
import '../config/load-env.js';
import { and, eq, gte, lte } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import {
  financialReconciliations,
  reconciliationHistory,
} from '../db/schema/financial-reconciliations.js';
import { resolveCertActors, CERT_TUESDAY_DATE, ensureCertCollectorPortfolio } from './cert-reconciliation-prep.js';

const CERT_DATE_END = '2031-12-31';

async function main(): Promise<void> {
  console.log('P14.3B.4C.4 Reconciliation Certification Seed Reset');
  console.log(`Started: ${new Date().toISOString()}`);

  if (!isDatabaseEnabled()) {
    console.error('Database not enabled');
    process.exit(1);
  }

  const actors = await resolveCertActors();
  const portfolioCount = await ensureCertCollectorPortfolio(actors.collectorId);
  console.log(`Cert collector portfolio loans: ${portfolioCount}`);
  const db = getDb();

  const targets = await db
    .select({ id: financialReconciliations.id })
    .from(financialReconciliations)
    .where(
      and(
        eq(financialReconciliations.collectorUserId, actors.collectorId),
        gte(financialReconciliations.reconciliationDate, CERT_TUESDAY_DATE),
        lte(financialReconciliations.reconciliationDate, CERT_DATE_END),
      ),
    );

  let historyDeleted = 0;
  for (const target of targets) {
    const removed = await db
      .delete(reconciliationHistory)
      .where(eq(reconciliationHistory.reconciliationId, target.id))
      .returning({ id: reconciliationHistory.id });
    historyDeleted += removed.length;
  }

  const reconciliationsRemoved = await db
    .delete(financialReconciliations)
    .where(
      and(
        eq(financialReconciliations.collectorUserId, actors.collectorId),
        gte(financialReconciliations.reconciliationDate, CERT_TUESDAY_DATE),
        lte(financialReconciliations.reconciliationDate, CERT_DATE_END),
      ),
    )
    .returning({ id: financialReconciliations.id });

  console.log(`Removed reconciliations: ${reconciliationsRemoved.length}`);
  console.log(`Removed history rows: ${historyDeleted}`);
  console.log(`Date range: ${CERT_TUESDAY_DATE} — ${CERT_DATE_END}`);
  console.log(`Finished: ${new Date().toISOString()}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
