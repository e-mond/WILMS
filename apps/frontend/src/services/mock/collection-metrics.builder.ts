import {
  COLLECTION_PERIOD,
  COLLECTION_SCOPE,
  type CollectionMetricSnapshot,
  type CollectionMetricsQuery,
  type CollectionMetricsResponse,
  type CollectionPeriod,
} from '@/types/collection-metrics';
import { TRANSACTION_TYPE, type FinancialTransaction } from '@/types/transaction';
import { getFinancialTransactions } from '@/services/mock/transaction-log.store';
import { getCollectorsDemoDataset } from '@/services/mock/factories/collectors-demo.factory';
import { getGroupsDemoDataset } from '@/services/mock/factories/groups-demo.factory';
import { getDashboardDemoDataset } from '@/services/mock/factories/dashboard-demo.factory';

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function resolvePeriodBounds(period: CollectionPeriod, referenceDate: Date): { start: Date; end: Date } {
  const end = endOfDay(referenceDate);

  switch (period) {
    case COLLECTION_PERIOD.DAILY:
      return { start: startOfDay(referenceDate), end };
    case COLLECTION_PERIOD.WEEKLY: {
      const start = startOfDay(referenceDate);
      start.setDate(start.getDate() - 6);
      return { start, end };
    }
    case COLLECTION_PERIOD.MONTHLY: {
      const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
      return { start: startOfDay(start), end };
    }
    case COLLECTION_PERIOD.QUARTERLY: {
      const quarter = Math.floor(referenceDate.getMonth() / 3);
      const start = new Date(referenceDate.getFullYear(), quarter * 3, 1);
      return { start: startOfDay(start), end };
    }
    case COLLECTION_PERIOD.YEARLY: {
      const start = new Date(referenceDate.getFullYear(), 0, 1);
      return { start: startOfDay(start), end };
    }
    default:
      return { start: startOfDay(referenceDate), end };
  }
}

function sumRepayments(
  transactions: readonly FinancialTransaction[],
  start: Date,
  end: Date,
  predicate?: (transaction: FinancialTransaction) => boolean,
): { collectedPesewas: number; transactionCount: number } {
  let collectedPesewas = 0;
  let transactionCount = 0;

  for (const transaction of transactions) {
    if (transaction.type !== TRANSACTION_TYPE.REPAYMENT) {
      continue;
    }

    const recordedAt = new Date(transaction.recordedAt);

    if (recordedAt < start || recordedAt > end) {
      continue;
    }

    if (predicate && !predicate(transaction)) {
      continue;
    }

    collectedPesewas += transaction.amountPesewas;
    transactionCount += 1;
  }

  return { collectedPesewas, transactionCount };
}

function buildSnapshot(
  period: CollectionPeriod,
  scope: CollectionMetricSnapshot['scope'],
  scopeId: string,
  scopeLabel: string,
  expectedPesewas: number,
  collectedPesewas: number,
  transactionCount: number,
  start: Date,
  end: Date,
): CollectionMetricSnapshot {
  const collectionRatePercent =
    expectedPesewas > 0 ? Math.round((collectedPesewas / expectedPesewas) * 1000) / 10 : 0;

  return {
    period,
    scope,
    scopeId,
    scopeLabel,
    expectedPesewas,
    collectedPesewas,
    collectionRatePercent,
    transactionCount,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
  };
}

function scaleExpected(baseExpected: number, period: CollectionPeriod): number {
  switch (period) {
    case COLLECTION_PERIOD.DAILY:
      return Math.round(baseExpected / 5);
    case COLLECTION_PERIOD.WEEKLY:
      return baseExpected;
    case COLLECTION_PERIOD.MONTHLY:
      return baseExpected * 4;
    case COLLECTION_PERIOD.QUARTERLY:
      return baseExpected * 12;
    case COLLECTION_PERIOD.YEARLY:
      return baseExpected * 48;
    default:
      return baseExpected;
  }
}

export function buildCollectionMetrics(query: CollectionMetricsQuery): CollectionMetricsResponse {
  const referenceDate = query.referenceDate ? new Date(query.referenceDate) : new Date('2026-06-09T12:00:00.000Z');
  const { start, end } = resolvePeriodBounds(query.period, referenceDate);
  const transactions = getFinancialTransactions();
  const collectors = getCollectorsDemoDataset().collectors;
  const groups = getGroupsDemoDataset().groups;
  const dashboard = getDashboardDemoDataset();
  const collectedKpiAmount =
    dashboard.referenceKpis.find((kpi) => kpi.id === 'collected')?.amountPesewas ?? 0;

  const metrics: CollectionMetricSnapshot[] = [];

  if (!query.scope || query.scope === COLLECTION_SCOPE.COLLECTOR) {
    for (const collector of collectors.slice(0, 12)) {
      const { collectedPesewas, transactionCount } = sumRepayments(
        transactions,
        start,
        end,
        (transaction) => transaction.collectorId === collector.id,
      );
      const expectedPesewas = scaleExpected(collector.expectedPesewas, query.period);

      metrics.push(
        buildSnapshot(
          query.period,
          COLLECTION_SCOPE.COLLECTOR,
          collector.id,
          collector.displayName,
          expectedPesewas,
          collectedPesewas,
          transactionCount,
          start,
          end,
        ),
      );
    }
  }

  if (!query.scope || query.scope === COLLECTION_SCOPE.GROUP) {
    for (const group of groups.slice(0, 8)) {
      const outstandingPesewas = Math.max(group.disbursedPesewas - group.collectedPesewas, 0);
      const share =
        outstandingPesewas /
        Math.max(
          groups.reduce((sum, entry) => sum + Math.max(entry.disbursedPesewas - entry.collectedPesewas, 0), 0),
          1,
        );
      const expectedPesewas = Math.round(
        scaleExpected(collectedKpiAmount, query.period) * share,
      );
      const { collectedPesewas, transactionCount } = sumRepayments(transactions, start, end);

      metrics.push(
        buildSnapshot(
          query.period,
          COLLECTION_SCOPE.GROUP,
          group.id,
          group.name,
          expectedPesewas,
          Math.round(collectedPesewas * share),
          transactionCount,
          start,
          end,
        ),
      );
    }
  }

  if (!query.scope || query.scope === COLLECTION_SCOPE.REGION) {
    const regions = Array.from(new Set(groups.map((group) => group.community)));

    for (const region of regions) {
      const regionGroups = groups.filter((group) => group.community === region);
      const share =
        regionGroups.reduce(
          (sum, group) => sum + Math.max(group.disbursedPesewas - group.collectedPesewas, 0),
          0,
        ) /
        Math.max(
          groups.reduce((sum, group) => sum + Math.max(group.disbursedPesewas - group.collectedPesewas, 0), 0),
          1,
        );
      const expectedPesewas = Math.round(
        scaleExpected(collectedKpiAmount, query.period) * share,
      );
      const { collectedPesewas, transactionCount } = sumRepayments(transactions, start, end);

      metrics.push(
        buildSnapshot(
          query.period,
          COLLECTION_SCOPE.REGION,
          region,
          region,
          expectedPesewas,
          Math.round(collectedPesewas * share),
          transactionCount,
          start,
          end,
        ),
      );
    }
  }

  if (!query.scope || query.scope === COLLECTION_SCOPE.POOL) {
    const poolExpected = scaleExpected(collectedKpiAmount, query.period);
    const { collectedPesewas, transactionCount } = sumRepayments(transactions, start, end);

    metrics.push(
      buildSnapshot(
        query.period,
        COLLECTION_SCOPE.POOL,
        'pool-core',
        'Core Pool',
        poolExpected,
        collectedPesewas,
        transactionCount,
        start,
        end,
      ),
    );
  }

  const orgExpected = scaleExpected(collectedKpiAmount, query.period);
  const orgCollected = sumRepayments(transactions, start, end);

  const organisationTotal = buildSnapshot(
    query.period,
    COLLECTION_SCOPE.ORGANISATION,
    'wilms-org',
    'WILMS Organisation',
    orgExpected,
    orgCollected.collectedPesewas,
    orgCollected.transactionCount,
    start,
    end,
  );

  const filteredMetrics =
    query.scope && query.scopeId
      ? metrics.filter((metric) => metric.scope === query.scope && metric.scopeId === query.scopeId)
      : metrics;

  return {
    metrics: filteredMetrics,
    organisationTotal,
  };
}
