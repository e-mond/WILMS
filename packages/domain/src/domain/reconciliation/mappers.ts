import type { ReconciliationSummary } from '../../domain/reconciliation/types.js';

export function mapReconciliationRowToSummary(row: {
  id: string;
  collectorUserId: string;
  reconciliationDate: string;
  expectedDuePesewas: number;
  systemRecordedPesewas: number;
  physicalCashPesewas: number;
  primaryVariancePesewas: number;
  varianceFlagged: boolean;
  status: string;
  submittedAt: Date;
  reviewedByUserId?: string | null;
  reviewedAt?: Date | null;
  resolutionNotes?: string | null;
}): ReconciliationSummary {
  return {
    id: row.id,
    collectorId: row.collectorUserId,
    date: row.reconciliationDate,
    expectedPesewas: row.expectedDuePesewas,
    actualPesewas: row.systemRecordedPesewas,
    physicalCashPesewas: row.physicalCashPesewas,
    variancePesewas: row.primaryVariancePesewas,
    varianceFlagged: row.varianceFlagged,
    submitted: true,
    submittedAt: row.submittedAt.toISOString(),
    status: row.status as ReconciliationSummary['status'],
    submittedById: row.collectorUserId,
    reviewedById: row.reviewedByUserId ?? undefined,
    reviewedAt: row.reviewedAt?.toISOString(),
    resolutionNotes: row.resolutionNotes ?? undefined,
  };
}

export function mapSnapshotToSummary(
  snapshot: {
    collectorUserId: string;
    reconciliationDate: string;
    expectedDuePesewas: number;
    systemRecordedPesewas: number;
    physicalCashPesewas: number;
    primaryVariancePesewas: number;
    varianceFlagged: boolean;
    status?: string;
    submittedAt: string;
  },
  submitted: boolean,
): ReconciliationSummary {
  return {
    collectorId: snapshot.collectorUserId,
    date: snapshot.reconciliationDate,
    expectedPesewas: snapshot.expectedDuePesewas,
    actualPesewas: snapshot.systemRecordedPesewas,
    physicalCashPesewas: snapshot.physicalCashPesewas,
    variancePesewas: snapshot.primaryVariancePesewas,
    varianceFlagged: snapshot.varianceFlagged,
    submitted,
    submittedAt: submitted ? snapshot.submittedAt : undefined,
    status: snapshot.status as ReconciliationSummary['status'],
    submittedById: snapshot.collectorUserId,
  };
}
