import { calculateExpectedDuePesewas, calculateSystemRecordedPesewas } from './expected-cash.js';
import type {
  ExpectedDueLoanInput,
  ScheduleDueInstallmentInput,
  SystemRecordedPaymentInput,
} from './expected-cash.js';
import { RECONCILIATION_STATUS, type ReconciliationSnapshot } from './types.js';
import {
  calculateCollectionDeltaPesewas,
  calculatePrimaryVariancePesewas,
  classifyVariance,
  isVarianceFlagged,
} from './variance.js';

export function buildReconciliationSnapshot(input: {
  collectorUserId: string;
  reconciliationDate: string;
  physicalCashPesewas: number;
  dueLoans: ExpectedDueLoanInput[];
  payments: SystemRecordedPaymentInput[];
  scheduleDues?: ScheduleDueInstallmentInput[];
  /** Same-day admin fees collected by this collector (included in expected + system recorded). */
  adminFeePesewas?: number;
  thresholdPercent: number;
  comment: string | null;
  submittedAt: Date;
}): ReconciliationSnapshot {
  const adminFeePesewas = Math.max(0, input.adminFeePesewas ?? 0);
  const expectedDuePesewas =
    calculateExpectedDuePesewas(
      input.dueLoans,
      input.reconciliationDate,
      input.scheduleDues ?? [],
    ) + adminFeePesewas;
  const systemRecordedPesewas = calculateSystemRecordedPesewas(input.payments) + adminFeePesewas;
  const primaryVariancePesewas = calculatePrimaryVariancePesewas(
    input.physicalCashPesewas,
    expectedDuePesewas,
  );
  const collectionDeltaPesewas = calculateCollectionDeltaPesewas(
    input.physicalCashPesewas,
    systemRecordedPesewas,
  );
  const varianceClass = classifyVariance(primaryVariancePesewas);
  const varianceFlagged = isVarianceFlagged(
    primaryVariancePesewas,
    expectedDuePesewas,
    input.thresholdPercent,
    collectionDeltaPesewas,
  );

  return {
    collectorUserId: input.collectorUserId,
    reconciliationDate: input.reconciliationDate,
    expectedDuePesewas,
    systemRecordedPesewas,
    physicalCashPesewas: input.physicalCashPesewas,
    primaryVariancePesewas,
    collectionDeltaPesewas,
    varianceClass,
    varianceFlagged,
    thresholdPercent: input.thresholdPercent,
    comment: input.comment,
    status: varianceFlagged
      ? RECONCILIATION_STATUS.PENDING_REVIEW
      : RECONCILIATION_STATUS.APPROVED,
    submittedAt: input.submittedAt.toISOString(),
  };
}
