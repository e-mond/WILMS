import type { DashboardCycleMetric } from '@/types/dashboard';

export interface DashboardCycleSnapshotProps {
  metrics: DashboardCycleMetric[];
}

export function DashboardCycleSnapshot({ metrics }: DashboardCycleSnapshotProps) {
  return (
    <section className="rounded-sm border border-border bg-card p-wilms-4">
      <h2 className="text-heading-2 font-semibold text-text-primary">Cycle Snapshot</h2>
      <dl className="mt-wilms-4 grid grid-cols-1 gap-wilms-3 sm:grid-cols-2">
        {metrics.map((item) => (
          <div
            key={item.label}
            className="flex min-h-[72px] flex-col justify-center rounded-sm border border-border/60 bg-background px-wilms-3 py-wilms-3"
          >
            <dt className="text-small text-text-muted">{item.label}</dt>
            <dd className="mt-wilms-1 text-body font-semibold text-text-primary">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
