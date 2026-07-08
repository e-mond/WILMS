export const REPAYMENT_CADENCE = {
  WEEKLY: 'WEEKLY',
  BIWEEKLY: 'BIWEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  BALLOON: 'BALLOON',
  GRADUATED: 'GRADUATED',
} as const;

export type RepaymentCadence = (typeof REPAYMENT_CADENCE)[keyof typeof REPAYMENT_CADENCE];

const CADENCE_DAY_OFFSET: Record<RepaymentCadence, number> = {
  WEEKLY: 7,
  BIWEEKLY: 14,
  MONTHLY: 30,
  QUARTERLY: 90,
  BALLOON: 7,
  GRADUATED: 7,
};

export function getCadenceDayOffset(cadence: RepaymentCadence): number {
  return CADENCE_DAY_OFFSET[cadence] ?? 7;
}

export function isInterestFreeCadence(_cadence: RepaymentCadence): boolean {
  return true;
}
