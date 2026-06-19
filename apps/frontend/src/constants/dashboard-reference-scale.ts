/** Target values derived from WILMSSuperAdminDashboard.jpeg (authoritative reference). */

export const DASHBOARD_DEMO_SEED = 2_026_050_8;

export const DASHBOARD_REFERENCE_BORROWER_SEGMENTS = {
  total: 2_714,
  active: 1_842,
  atRisk: 312,
  defaulted: 89,
  blacklisted: 42,
  pending: 429,
} as const;

export const DASHBOARD_REFERENCE_KPIS = {
  poolPesewas: 482_000_000,
  disbursedPesewas: 361_420_000,
  collectedPesewas: 298_054_000,
  outstandingPesewas: 63_366_000,
  poolTrendLabel: '+12.4% vs last month',
  disbursedTrendLabel: '+8.7% vs last month',
  collectedTrendLabel: '+5.1% vs last month',
  outstandingTrendLabel: '+18.3% vs last month',
} as const;

export const DASHBOARD_REFERENCE_CYCLE_METRICS = {
  activeGroups: 148,
  newLoansMtd: 214,
  avgLoanPesewas: 168_000,
  repaymentRatePercent: 82.4,
  pendingApplications: 37,
  overdueOver30d: 62,
} as const;

export const DASHBOARD_REFERENCE_GROUP_COUNT = 100;

export const DASHBOARD_REFERENCE_GROUP_RISK_DISTRIBUTION = {
  low: 58,
  atRisk: 22,
  flagged: 13,
  suspended: 7,
} as const;

export const DASHBOARD_REFERENCE_COLLECTOR_COUNT = 36;

/** Top 5 collector rows shown on the dashboard table (reference image). */
export const DASHBOARD_REFERENCE_TABLE_COLLECTOR_COUNT = 5;

export const DASHBOARD_REFERENCE_TABLE_COLLECTORS = [
  {
    name: 'Kwame Asante',
    expectedPesewas: 5_000_000,
    actualPesewas: 5_200_000,
    collectionRatePercent: 100,
    variancePesewas: 200_000,
  },
  {
    name: 'Abena Mensah',
    expectedPesewas: 4_800_000,
    actualPesewas: 4_670_000,
    collectionRatePercent: 97.3,
    variancePesewas: -130_000,
  },
  {
    name: 'Yaw Owusu',
    expectedPesewas: 4_200_000,
    actualPesewas: 3_402_000,
    collectionRatePercent: 81,
    variancePesewas: -80_000,
  },
  {
    name: 'Ama Boateng',
    expectedPesewas: 3_900_000,
    actualPesewas: 2_964_000,
    collectionRatePercent: 76,
    variancePesewas: -190_000,
  },
  {
    name: 'Akosua Poku',
    expectedPesewas: 3_500_000,
    actualPesewas: 2_254_000,
    collectionRatePercent: 64.4,
    variancePesewas: -250_000,
  },
] as const;
