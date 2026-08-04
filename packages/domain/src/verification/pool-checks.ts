/**
 * P14.3B Phase 1 — Loan pool verification checks.
 */
import { isDatabaseEnabled } from '../db/client.js';
import * as poolService from '../modules/loan-pools/service.js';
import { verifySeededPoolIntegrity } from '../db/seed/seed-loan-pools.js';
import * as poolRepo from '../repositories/loan-pool.repository.js';
import type { VerificationResult } from './unit-checks.js';

export function poolChecksAvailable(): boolean {
  return isDatabaseEnabled();
}

export async function runPoolIntegrityChecks(): Promise<VerificationResult[]> {
  const errors = await verifySeededPoolIntegrity();
  return [
    {
      name: 'pool-balance-integrity',
      passed: errors.length === 0,
      detail: errors.length === 0 ? 'all pools reconcile' : errors.join('; '),
    },
  ];
}

export async function runPoolApiChecks(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];
  const list = await poolService.listLoanPools();

  results.push({
    name: 'pool-list-non-empty',
    passed: list.pools.length >= 3,
    detail: `pools=${list.pools.length}`,
  });

  results.push({
    name: 'pool-list-summary-math',
    passed:
      list.summary.totalDisbursedPesewas ===
      list.pools.reduce((sum, pool) => sum + pool.disbursedPesewas, 0),
    detail: `summaryDisbursed=${list.summary.totalDisbursedPesewas}`,
  });

  const firstPoolId = list.pools[0]?.id;
  if (firstPoolId) {
    const detail = await poolService.getLoanPool(firstPoolId);
    results.push({
      name: 'pool-detail-retrieval',
      passed: detail.id === firstPoolId && detail.recentActivity.length >= 1,
      detail: `activity=${detail.recentActivity.length}`,
    });

    const totals = await poolRepo.sumAllocationTotals(firstPoolId);
    results.push({
      name: 'pool-allocation-aggregation',
      passed: totals.disbursedPesewas >= 0,
      detail: `disbursed=${totals.disbursedPesewas} collected=${totals.collectedPesewas}`,
    });
  } else {
    results.push({
      name: 'pool-detail-retrieval',
      passed: false,
      detail: 'no pools available',
    });
  }

  return results;
}
