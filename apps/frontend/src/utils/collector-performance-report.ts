import { DEMO_ACCOUNTS } from '@/constants/demo-accounts';
import { USER_ROLE } from '@/constants/roles';
import type { CollectorPerformanceReport, CollectorPerformanceReportRow } from '@/types/reports';
import type { FinancialTransaction } from '@/types/transaction';
import { TRANSACTION_TYPE } from '@/types/transaction';
import { buildCollectorSummaries } from '@/utils/collector-management-list';

export function buildCollectorPerformanceReport(
  transactions: readonly FinancialTransaction[],
): CollectorPerformanceReport {
  const collectors = buildCollectorSummaries(transactions);
  const collectorNames = Object.fromEntries(
    DEMO_ACCOUNTS.filter((account) => account.role === USER_ROLE.COLLECTOR).map((account) => [
      account.id,
      account.displayName,
    ]),
  );

  const rows: CollectorPerformanceReportRow[] = collectors.map((collector) => ({
    collectorId: collector.id,
    collectorName: collectorNames[collector.id] ?? collector.displayName,
    expectedPesewas: collector.expectedPesewas,
    collectedPesewas: collector.collectedPesewas,
    collectionRatePercent: collector.collectionRatePercent,
    missedBorrowers: collector.collectionRatePercent < 100 ? 1 : 0,
    reconciliationVariancePesewas: Math.max(collector.collectedPesewas - collector.expectedPesewas, 0),
  }));

  return {
    generatedAt: new Date().toISOString(),
    rows,
  };
}

export function sumRepaymentsForCollector(
  transactions: readonly FinancialTransaction[],
  collectorId: string,
): number {
  return transactions
    .filter(
      (transaction) =>
        transaction.type === TRANSACTION_TYPE.REPAYMENT &&
        transaction.collectorId === collectorId,
    )
    .reduce((total, transaction) => total + transaction.amountPesewas, 0);
}
