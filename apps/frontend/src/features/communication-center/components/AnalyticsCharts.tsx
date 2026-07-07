'use client';

import { useMemo } from 'react';
import type { DeliveryAnalytics } from '@/types/communication';

interface AnalyticsChartsProps {
  analytics?: DeliveryAnalytics;
}

export function AnalyticsCharts({ analytics }: AnalyticsChartsProps) {
  const series = useMemo(() => analytics?.timeSeries ?? [], [analytics?.timeSeries]);
  const maxSent = useMemo(() => Math.max(...series.map((entry) => entry.sent), 1), [series]);

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-wilms-6">
      <div className="grid gap-wilms-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Delivery rate" value={`${analytics.deliveryRate ?? 0}%`} />
        <Metric label="Bounce rate" value={`${analytics.bounceRate ?? 0}%`} />
        <Metric label="Open rate" value={`${analytics.openRate}%`} />
        <Metric label="Click rate (CTR)" value={`${analytics.clickRate}%`} />
      </div>

      <section>
        <h4 className="mb-wilms-3 text-body font-semibold text-text-primary">Engagement trends</h4>
        {series.length === 0 ? (
          <p className="text-small text-text-muted">No delivery data yet.</p>
        ) : (
          <div className="space-y-wilms-2">
            {series.map((entry) => (
              <div key={entry.date} className="grid grid-cols-[88px_1fr] items-center gap-wilms-3">
                <span className="text-small text-text-muted">{entry.date}</span>
                <div className="flex h-6 items-center gap-wilms-1">
                  <div
                    className="h-full rounded-sm bg-brand-primary"
                    style={{ width: `${(entry.sent / maxSent) * 100}%` }}
                    title={`Sent: ${entry.sent}`}
                  />
                  <span className="text-small text-text-muted">
                    {entry.sent} sent · {entry.opened} opened · {entry.clicked} clicked
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-wilms-6 lg:grid-cols-2">
        <RankingList
          title="Top recipients"
          items={(analytics.topRecipients ?? []).map((entry) => ({
            label: entry.recipient,
            value: entry.count,
          }))}
        />
        <RankingList
          title="Top campaigns"
          items={(analytics.topTemplates ?? []).map((entry) => ({
            label: entry.name,
            value: entry.count,
          }))}
        />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-wilms-4">
      <p className="text-small text-text-muted">{label}</p>
      <p className="text-h2 font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function RankingList({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: number }>;
}) {
  return (
    <section>
      <h4 className="mb-wilms-3 text-body font-semibold text-text-primary">{title}</h4>
      {items.length === 0 ? (
        <p className="text-small text-text-muted">No data yet.</p>
      ) : (
        <ol className="space-y-wilms-2">
          {items.map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between rounded-md border border-border px-wilms-3 py-wilms-2"
            >
              <span className="truncate text-body text-text-primary">{item.label}</span>
              <span className="text-small font-semibold text-text-muted">{item.value}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
