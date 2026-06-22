export const RECONCILIATION_VARIANCE_CLASS = {
  BALANCED: 'BALANCED',
  SHORTAGE: 'SHORTAGE',
  OVERAGE: 'OVERAGE',
} as const;

export type ReconciliationVarianceClass =
  (typeof RECONCILIATION_VARIANCE_CLASS)[keyof typeof RECONCILIATION_VARIANCE_CLASS];

export const RECONCILIATION_STATUS = {
  SUBMITTED: 'SUBMITTED',
} as const;

export type ReconciliationStatus =
  (typeof RECONCILIATION_STATUS)[keyof typeof RECONCILIATION_STATUS];

/** Default variance threshold — matches frontend RECONCILIATION_VARIANCE_THRESHOLD_PERCENT. */
export const DEFAULT_RECONCILIATION_THRESHOLD_PERCENT = 10;

export interface ReconciliationSnapshot {
  collectorUserId: string;
  reconciliationDate: string;
  expectedDuePesewas: number;
  systemRecordedPesewas: number;
  physicalCashPesewas: number;
  primaryVariancePesewas: number;
  collectionDeltaPesewas: number;
  varianceClass: ReconciliationVarianceClass;
  varianceFlagged: boolean;
  thresholdPercent: number;
  comment: string | null;
  status: ReconciliationStatus;
  submittedAt: string;
}

export interface ReconciliationSummary {
  collectorId: string;
  date: string;
  expectedPesewas: number;
  actualPesewas: number;
  physicalCashPesewas?: number;
  variancePesewas?: number;
  varianceFlagged?: boolean;
  submitted: boolean;
  submittedAt?: string;
}
