export const COLLECTION_PERIOD = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY: 'YEARLY',
} as const;

export type CollectionPeriod = (typeof COLLECTION_PERIOD)[keyof typeof COLLECTION_PERIOD];

export const COLLECTION_SCOPE = {
  COLLECTOR: 'COLLECTOR',
  GROUP: 'GROUP',
  REGION: 'REGION',
  ZONE: 'ZONE',
  POOL: 'POOL',
  ORGANISATION: 'ORGANISATION',
} as const;

export type CollectionScope = (typeof COLLECTION_SCOPE)[keyof typeof COLLECTION_SCOPE];

export interface CollectionMetricSnapshot {
  period: CollectionPeriod;
  scope: CollectionScope;
  scopeId: string;
  scopeLabel: string;
  expectedPesewas: number;
  collectedPesewas: number;
  collectionRatePercent: number;
  transactionCount: number;
  periodStart: string;
  periodEnd: string;
}

export interface CollectionMetricsQuery {
  period: CollectionPeriod;
  scope?: CollectionScope;
  scopeId?: string;
  referenceDate?: string;
}

export interface CollectionMetricsResponse {
  metrics: CollectionMetricSnapshot[];
  organisationTotal: CollectionMetricSnapshot;
}
