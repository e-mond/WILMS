import { listPayments } from '../../db/persistence.js';
import { isDatabaseEnabled } from '../../db/client.js';
import * as paymentRepo from '../../repositories/payment.repository.js';

export interface CollectionMetricsQuery {
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  scope?: 'COLLECTOR' | 'GROUP' | 'REGION' | 'ZONE' | 'POOL' | 'ORGANISATION';
  scopeId?: string;
  referenceDate?: string;
}

export interface CollectionMetricSnapshot {
  period: CollectionMetricsQuery['period'];
  scope: NonNullable<CollectionMetricsQuery['scope']> | 'ORGANISATION';
  scopeId: string;
  scopeLabel: string;
  expectedPesewas: number;
  collectedPesewas: number;
  collectionRatePercent: number;
  transactionCount: number;
  periodStart: string;
  periodEnd: string;
}

export interface CollectionMetricsResponse {
  metrics: CollectionMetricSnapshot[];
  organisationTotal: CollectionMetricSnapshot;
}

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

function resolvePeriodBounds(period: CollectionMetricsQuery['period'], referenceDate: Date) {
  const end = endOfDay(referenceDate);

  switch (period) {
    case 'WEEKLY': {
      const start = startOfDay(referenceDate);
      start.setDate(start.getDate() - 6);
      return { start, end };
    }
    case 'MONTHLY':
      return {
        start: startOfDay(new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)),
        end,
      };
    case 'QUARTERLY': {
      const quarter = Math.floor(referenceDate.getMonth() / 3);
      return {
        start: startOfDay(new Date(referenceDate.getFullYear(), quarter * 3, 1)),
        end,
      };
    }
    case 'YEARLY':
      return {
        start: startOfDay(new Date(referenceDate.getFullYear(), 0, 1)),
        end,
      };
    default:
      return { start: startOfDay(referenceDate), end };
  }
}

function buildSnapshot(input: {
  period: CollectionMetricsQuery['period'];
  scope: CollectionMetricSnapshot['scope'];
  scopeId: string;
  scopeLabel: string;
  start: Date;
  end: Date;
  payments: Awaited<ReturnType<typeof listPayments>>;
  collectorId?: string;
}): CollectionMetricSnapshot {
  const filtered = input.payments.filter((payment) => {
    const recordedAt = new Date(payment.recordedAt);
    if (recordedAt < input.start || recordedAt > input.end) {
      return false;
    }
    if (input.collectorId && payment.collectorId !== input.collectorId) {
      return false;
    }
    return true;
  });

  const collectedPesewas = filtered.reduce((sum, payment) => sum + payment.amountPesewas, 0);
  const expectedPesewas = collectedPesewas;

  return {
    period: input.period,
    scope: input.scope,
    scopeId: input.scopeId,
    scopeLabel: input.scopeLabel,
    expectedPesewas,
    collectedPesewas,
    collectionRatePercent:
      expectedPesewas === 0 ? (collectedPesewas > 0 ? 100 : 0) : Math.round((collectedPesewas / expectedPesewas) * 100),
    transactionCount: filtered.length,
    periodStart: input.start.toISOString(),
    periodEnd: input.end.toISOString(),
  };
}

export async function getCollectionMetrics(
  query: CollectionMetricsQuery,
): Promise<CollectionMetricsResponse> {
  const referenceDate = new Date(query.referenceDate ?? new Date().toISOString().slice(0, 10));
  const { start, end } = resolvePeriodBounds(query.period, referenceDate);
  const scope = query.scope ?? 'ORGANISATION';

  if (isDatabaseEnabled()) {
    const buildSqlSnapshot = (
      snapshotScope: CollectionMetricSnapshot['scope'],
      scopeId: string,
      scopeLabel: string,
      collected: number,
      count: number,
    ): CollectionMetricSnapshot => {
      const expected = collected;
      return {
        period: query.period,
        scope: snapshotScope,
        scopeId,
        scopeLabel,
        expectedPesewas: expected,
        collectedPesewas: collected,
        collectionRatePercent:
          expected === 0 ? (collected > 0 ? 100 : 0) : Math.round((collected / expected) * 100),
        transactionCount: count,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
      };
    };

    const [orgCollected, orgCount] = await Promise.all([
      paymentRepo.sumConfirmedPaymentsInRecordedAtRangePesewas(start, end),
      paymentRepo.countConfirmedPaymentsInRecordedAtRange(start, end),
    ]);
    const organisationTotal = buildSqlSnapshot(
      'ORGANISATION',
      'organisation',
      'Organisation',
      orgCollected,
      orgCount,
    );

    if (scope === 'COLLECTOR' && query.scopeId) {
      const [collected, count] = await Promise.all([
        paymentRepo.sumConfirmedPaymentsInRecordedAtRangePesewas(start, end, {
          collectorId: query.scopeId,
        }),
        paymentRepo.countConfirmedPaymentsInRecordedAtRange(start, end, {
          collectorId: query.scopeId,
        }),
      ]);
      return {
        metrics: [buildSqlSnapshot('COLLECTOR', query.scopeId, query.scopeId, collected, count)],
        organisationTotal,
      };
    }

    return { metrics: [organisationTotal], organisationTotal };
  }

  const payments = await listPayments();

  const organisationTotal = buildSnapshot({
    period: query.period,
    scope: 'ORGANISATION',
    scopeId: 'organisation',
    scopeLabel: 'Organisation',
    start,
    end,
    payments,
  });

  if (scope === 'COLLECTOR' && query.scopeId) {
    const snapshot = buildSnapshot({
      period: query.period,
      scope: 'COLLECTOR',
      scopeId: query.scopeId,
      scopeLabel: query.scopeId,
      start,
      end,
      payments,
      collectorId: query.scopeId,
    });
    return { metrics: [snapshot], organisationTotal };
  }

  return { metrics: [organisationTotal], organisationTotal };
}
