export const COLLECTOR_PAYMENT_STATUS = {
  COLLECTED: 'COLLECTED',
  PENDING: 'PENDING',
  MISSED: 'MISSED',
} as const;

export type CollectorPaymentStatus =
  (typeof COLLECTOR_PAYMENT_STATUS)[keyof typeof COLLECTOR_PAYMENT_STATUS];

export const RECONCILIATION_STATUS = {
  PENDING: 'PENDING',
  COMPLETE: 'COMPLETE',
  VARIANCE: 'VARIANCE',
} as const;

export type ReconciliationStatus =
  (typeof RECONCILIATION_STATUS)[keyof typeof RECONCILIATION_STATUS];

export interface CollectorDashboardHero {
  targetPesewas: number;
  progressPercent: number;
  groupsToday: number;
  paidBorrowers: number;
  pendingBorrowers: number;
  overdueBorrowers: number;
  streakDays: number;
  weeklyTrendPercent: number;
}

export interface CollectorDashboardAlert {
  id: string;
  message: string;
  tone: 'warning' | 'error' | 'info';
}

export interface CollectorTodayGroup {
  groupId: string;
  groupName: string;
  community: string;
  leaderName: string;
  groupPhotoUrl: string;
  collectedCount: number;
  expectedCount: number;
  pendingCount: number;
  expectedPesewas: number;
  amountCollectedPesewas: number;
  progressPercent: number;
  status: string;
}

export interface CollectorRecentPayment {
  borrowerId: string;
  borrowerName: string;
  borrowerPhotoUrl: string;
  groupName: string;
  amountPesewas: number;
  recordedAt: string;
  status: CollectorPaymentStatus;
}

export interface CollectorDashboardStats {
  paymentsRecorded: number;
  collectionRatePercent: number;
  borrowersManaged: number;
  groupsAssigned: number;
}

export interface CollectorDashboardSummary {
  date: string;
  paymentDayLabel: string;
  borrowersDueCount: number;
  expectedPesewas: number;
  collectedPesewas: number;
  outstandingPesewas: number;
  paidTodayCount: number;
  pendingTodayCount: number;
  missedTodayCount: number;
  collectionRatePercent: number;
  missedAlertsCount: number;
  reconciliationStatus: ReconciliationStatus;
  reconciliationVariancePesewas: number;
}

export interface CollectorDashboardBorrower {
  borrowerId: string;
  borrowerName: string;
  borrowerPhotoUrl?: string;
  phone: string;
  community: string;
  groupName: string;
  loanId: string;
  expectedPesewas: number;
  collectedPesewas: number;
  paymentStatus: CollectorPaymentStatus;
}

export interface CollectorMissedAlert {
  borrowerId: string;
  borrowerName: string;
  loanId: string;
  missedWeeks: number;
}

export interface CollectorDashboard {
  summary: CollectorDashboardSummary;
  hero: CollectorDashboardHero;
  alerts: CollectorDashboardAlert[];
  todayGroups: CollectorTodayGroup[];
  recentPayments: CollectorRecentPayment[];
  stats: CollectorDashboardStats;
  borrowers: CollectorDashboardBorrower[];
  missedAlerts: CollectorMissedAlert[];
}
