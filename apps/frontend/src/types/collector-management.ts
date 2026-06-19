export const COLLECTOR_STATUS = {
  ACTIVE: 'ACTIVE',
  AWAY: 'AWAY',
} as const;

export type CollectorStatus = (typeof COLLECTOR_STATUS)[keyof typeof COLLECTOR_STATUS];

export interface CollectorSummary {
  id: string;
  displayName: string;
  photoUrl?: string | null;
  zone: string;
  groupCount: number;
  borrowerCount: number;
  expectedPesewas: number;
  collectedPesewas: number;
  collectionRatePercent: number;
  recoveryRatePercent: number;
  reconciliationCount: number;
  expensesSubmittedCount: number;
  status: CollectorStatus;
  streakWeeks: number;
  cycleLabel: string;
  joinedAt: string;
  lastActiveAt: string;
  rateTrend: number[];
  monthlyPerformance: CollectorMonthlyPerformance[];
}

export interface CollectorListSummary {
  totalCollectors: number;
  avgCollectionRatePercent: number;
  belowSeventyPercent: number;
  activeToday: number;
}

export interface CollectorRateDistribution {
  topPerformers: number;
  onTrack: number;
  needsAttention: number;
}

export interface CollectorAlert {
  id: string;
  severity: 'danger' | 'warning' | 'success';
  message: string;
  createdAt: string;
}

export interface CollectorListResponse {
  generatedAt: string;
  summary: CollectorListSummary;
  rateDistribution: CollectorRateDistribution;
  collectors: CollectorSummary[];
  alerts: CollectorAlert[];
}

export interface CollectorMonthlyPerformance {
  monthLabel: string;
  collectionRatePercent: number;
}

export interface CollectorProfileGroupPerformance {
  id: string;
  name: string;
  memberCount: number;
  repaymentTrend: string;
  riskLevel: string;
}

export interface CollectorProfileActivityEntry {
  id: string;
  message: string;
  tone: 'default' | 'danger' | 'muted';
}

export interface CollectorDetail extends CollectorSummary {
  assignedGroups: CollectorProfileGroupPerformance[];
  recentCollections: CollectorProfileActivityEntry[];
  flagsRaised: CollectorProfileActivityEntry[];
  activityHistory: CollectorProfileActivityEntry[];
}
