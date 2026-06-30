import type { CollectorSummary } from '../../modules/collectors/service.js';

export interface CollectorPerformanceReportRow {
  collectorId: string;
  collectorName: string;
  expectedPesewas: number;
  collectedPesewas: number;
  collectionRatePercent: number;
  missedBorrowers: number;
  reconciliationVariancePesewas: number;
}

export interface CollectorPerformanceReport {
  generatedAt: string;
  rows: CollectorPerformanceReportRow[];
}

export function buildCollectorPerformanceReport(
  collectors: CollectorSummary[],
): CollectorPerformanceReport {
  const rows: CollectorPerformanceReportRow[] = collectors.map((collector) => ({
    collectorId: collector.id,
    collectorName: collector.displayName,
    expectedPesewas: collector.expectedPesewas,
    collectedPesewas: collector.collectedPesewas,
    collectionRatePercent: collector.collectionRatePercent,
    missedBorrowers: collector.collectionRatePercent < 100 ? 1 : 0,
    reconciliationVariancePesewas: Math.max(
      collector.collectedPesewas - collector.expectedPesewas,
      0,
    ),
  }));

  return {
    generatedAt: new Date().toISOString(),
    rows,
  };
}
