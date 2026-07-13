import {
  DEFAULT_RECONCILIATION_THRESHOLD_PERCENT,
  RECONCILIATION_VARIANCE_CLASS,
  type ReconciliationVarianceClass,
} from './types.js';

/** Primary variance v1: physical_cash − expected_due */
export function calculatePrimaryVariancePesewas(
  physicalCashPesewas: number,
  expectedDuePesewas: number,
): number {
  return physicalCashPesewas - expectedDuePesewas;
}

/** Diagnostic delta: physical_cash − system_recorded */
export function calculateCollectionDeltaPesewas(
  physicalCashPesewas: number,
  systemRecordedPesewas: number,
): number {
  return physicalCashPesewas - systemRecordedPesewas;
}

export function calculateVariancePercentage(
  primaryVariancePesewas: number,
  expectedDuePesewas: number,
): number {
  if (expectedDuePesewas === 0) {
    return primaryVariancePesewas === 0 ? 0 : 100;
  }

  return (Math.abs(primaryVariancePesewas) / expectedDuePesewas) * 100;
}

export function classifyVariance(primaryVariancePesewas: number): ReconciliationVarianceClass {
  if (primaryVariancePesewas === 0) {
    return RECONCILIATION_VARIANCE_CLASS.BALANCED;
  }

  if (primaryVariancePesewas < 0) {
    return RECONCILIATION_VARIANCE_CLASS.SHORTAGE;
  }

  return RECONCILIATION_VARIANCE_CLASS.OVERAGE;
}

export function isVarianceFlagged(
  primaryVariancePesewas: number,
  expectedDuePesewas: number,
  thresholdPercent: number = DEFAULT_RECONCILIATION_THRESHOLD_PERCENT,
): boolean {
  if (expectedDuePesewas === 0) {
    return false;
  }

  return calculateVariancePercentage(primaryVariancePesewas, expectedDuePesewas) > thresholdPercent;
}
