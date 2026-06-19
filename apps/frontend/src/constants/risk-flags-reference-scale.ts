import { FLAG_TYPE, type FlagType } from '@/types/risk-flag';

/** Target values derived from RiskFlags.jpeg (authoritative reference). */

export const RISK_FLAGS_DEMO_SEED = 2_026_050_9;

export const RISK_FLAGS_LIST_PAGE_SIZE = 8;

export const RISK_FLAGS_REFERENCE_SUMMARY = {
  openFlags: 47,
  blacklisted: 23,
  outstandingArrearsPesewas: 18_400_000,
  highRiskBorrowers: 112,
} as const;

export const RISK_FLAGS_REFERENCE_TYPE_COUNTS: Record<FlagType, number> = {
  [FLAG_TYPE.MISSED_PAYMENT]: 29,
  [FLAG_TYPE.DEFAULT]: 18,
  [FLAG_TYPE.FRAUD_SUSPICION]: 6,
  [FLAG_TYPE.DUPLICATE_ID]: 8,
  [FLAG_TYPE.BLACKLISTED]: 3,
};

export const RISK_FLAGS_REFERENCE_COUNT = Object.values(RISK_FLAGS_REFERENCE_TYPE_COUNTS).reduce(
  (total, count) => total + count,
  0,
);
