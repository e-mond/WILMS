/**
 * P14.3B Phase 4C.4 — Reconciliation environment probe.
 *
 * Usage: npm run cert:reconciliation:env -w @wilms/api
 */
import '../config/load-env.js';
import { eq } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import { financialReconciliations } from '../db/schema/financial-reconciliations.js';
import * as loanRepo from '../repositories/loan.repository.js';
import {
  certDateForIndex,
  resolveCertActors,
  CERT_TUESDAY_DATE,
  ensureCertCollectorPortfolio,
} from './cert-reconciliation-prep.js';

async function main(): Promise<void> {
  console.log('P14.3B.4C.4 Reconciliation Environment Probe');
  console.log(`Started: ${new Date().toISOString()}`);

  if (!isDatabaseEnabled()) {
    console.error('FAIL: Database not enabled');
    process.exit(1);
  }

  const actors = await resolveCertActors();
  const portfolioCount = await ensureCertCollectorPortfolio(actors.collectorId);
  const loans = await loanRepo.listPortfolioLoansForCollector(actors.collectorId);
  const dueOnTuesday = loans.filter((loan) => loan.paymentDay === 'Tuesday');

  const probeDate = certDateForIndex(5000);
  const db = getDb();
  const [existing] = await db
    .select()
    .from(financialReconciliations)
    .where(eq(financialReconciliations.collectorUserId, actors.collectorId))
    .limit(1);

  console.log(`Collector ID: ${actors.collectorId}`);
  console.log(`Portfolio loans: ${loans.length} (after cert setup: ${portfolioCount})`);
  console.log(`Tuesday loans: ${dueOnTuesday.length}`);
  console.log(`Cert Tuesday anchor: ${CERT_TUESDAY_DATE}`);
  console.log(`Probe date available: ${probeDate}`);
  console.log(`Sample existing reconciliation: ${existing ? existing.id : 'none'}`);

  if (loans.length === 0) {
    console.error('FAIL: Collector has no portfolio loans — run db:seed');
    process.exit(1);
  }

  console.log('PASS: Environment ready for reconciliation certification');
  console.log(`Finished: ${new Date().toISOString()}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
