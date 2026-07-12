import { CurrencyAmount, DataTable } from '@/components/data-display';
import type { DashboardCollectorPerformanceRow } from '@/types/dashboard';
import { cn } from '@/utils/cn';
import { resolveUserDisplayId } from '@/utils/entity-display-id';

function collectorLabel(row: DashboardCollectorPerformanceRow): string {
  return row.collectorDisplayId || resolveUserDisplayId(row.collectorId);
}

function collectionRateClass(rate: number): string {
  if (rate >= 100) {
    return 'font-semibold text-status-active';
  }

  if (rate >= 95) {
    return 'font-semibold text-brand-primary';
  }

  if (rate >= 70) {
    return 'font-semibold text-status-at-risk';
  }

  return 'font-semibold text-danger';
}

function varianceClass(variancePesewas: number): string {
  if (variancePesewas > 0) {
    return 'font-semibold text-status-active';
  }

  if (variancePesewas < 0) {
    return 'font-semibold text-danger';
  }

  return 'text-text-muted';
}

export interface DashboardCollectorPerformanceProps {
  rows: DashboardCollectorPerformanceRow[];
}

export function DashboardCollectorPerformance({ rows }: DashboardCollectorPerformanceProps) {
  if (rows.length === 0) {
    return <p className="text-body text-text-muted">No collector repayments recorded yet.</p>;
  }

  return (
    <>
      <ul className="grid gap-wilms-3 lg:hidden">
        {rows.map((row) => (
          <li
            key={row.collectorId}
            className="min-w-0 overflow-hidden rounded-sm border border-border bg-card p-wilms-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-wilms-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-text-primary">{row.name}</p>
                <p className="truncate text-small font-semibold text-executive-gold">{collectorLabel(row)}</p>
              </div>
              <span className={cn('text-body', collectionRateClass(row.collectionRatePercent))}>
                {row.collectionRatePercent}%
              </span>
            </div>
            <dl className="mt-wilms-3 grid grid-cols-2 gap-wilms-3 text-small">
              <div>
                <dt className="text-text-muted">Expected</dt>
                <dd className="font-semibold">
                  <CurrencyAmount value={row.expectedPesewas} />
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Actual</dt>
                <dd className="font-semibold">
                  <CurrencyAmount value={row.actualPesewas} />
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-text-muted">Variance</dt>
                <dd className={varianceClass(row.variancePesewas)}>
                  {row.variancePesewas === 0 ? (
                    '—'
                  ) : (
                    <CurrencyAmount value={Math.abs(row.variancePesewas)} />
                  )}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <div className="hidden lg:block">
        <DataTable
          variant="executive"
          caption="Collector performance"
          data={rows}
          getRowId={(row) => row.collectorId}
          columns={[
            {
              id: 'name',
              header: 'Collector',
              cell: (row) => (
                <div>
                  <p className="font-semibold text-text-primary">{row.name}</p>
                  <p className="text-small font-semibold text-executive-gold">{collectorLabel(row)}</p>
                </div>
              ),
            },
            {
              id: 'expected',
              header: 'Expected',
              cell: (row) => <CurrencyAmount value={row.expectedPesewas} />,
            },
            {
              id: 'actual',
              header: 'Actual',
              cell: (row) => <CurrencyAmount value={row.actualPesewas} />,
            },
            {
              id: 'rate',
              header: 'Rate %',
              cell: (row) => (
                <span className={collectionRateClass(row.collectionRatePercent)}>
                  {row.collectionRatePercent}%
                </span>
              ),
            },
            {
              id: 'variance',
              header: 'Variance',
              cell: (row) => (
                <span className={varianceClass(row.variancePesewas)}>
                  {row.variancePesewas === 0 ? (
                    '—'
                  ) : (
                    <CurrencyAmount value={Math.abs(row.variancePesewas)} />
                  )}
                </span>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}
