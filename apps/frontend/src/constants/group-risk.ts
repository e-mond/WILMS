/** Collection-rate bands for automatic group risk calculation (BRD §7.2). */
export const GROUP_RISK_COLLECTION_RATE = {
  LOW_RISK_MIN: 85,
  AT_RISK_MIN: 70,
  SUSPENDED_MAX: 60,
} as const;

/** Active-member participation floor before escalating to At Risk. */
export const GROUP_RISK_PARTICIPATION_MIN_PERCENT = 75;
