'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { opsService, type OpsStatusReport, type OpsSurfaceState } from '@/services/opsService';
import { ApiError } from '@/types/api';
import { cn } from '@/utils/cn';

function stateLabel(state: OpsSurfaceState): string {
  switch (state) {
    case 'ok':
      return 'OK';
    case 'degraded':
      return 'Degraded';
    case 'unavailable':
      return 'Unavailable';
    case 'external':
      return 'External';
    case 'not_applicable':
      return 'N/A';
    default:
      return state;
  }
}

function stateClass(state: OpsSurfaceState): string {
  switch (state) {
    case 'ok':
      return 'text-success border-success/30 bg-success/10';
    case 'degraded':
      return 'text-warning border-warning/30 bg-warning/10';
    case 'unavailable':
      return 'text-danger border-danger/30 bg-danger/10';
    case 'external':
      return 'text-text-muted border-border bg-background';
    case 'not_applicable':
      return 'text-text-muted border-border bg-background';
    default:
      return 'text-text-muted border-border bg-background';
  }
}

function formatPesewas(pesewas: number): string {
  return `GH¢ ${(pesewas / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function OperationsDashboardPanel() {
  const [report, setReport] = useState<OpsStatusReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      setError(null);
      try {
        const next = await opsService.getStatus();
        setReport(next);
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Unable to load operations status.';
        setError(message);
      }
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-wilms-6" data-tour="operations-dashboard">
      <div className="flex flex-wrap items-end justify-between gap-wilms-3 border-b border-border pb-wilms-4">
        <div>
          <h1 className="text-heading-2 font-semibold text-text-primary">Operations</h1>
          <p className="mt-wilms-1 max-w-2xl text-small text-text-muted">
            Platform control centre — system health, workers, queues, migrations, and runtime
            status. This is separate from the executive Dashboard. Values come from authenticated
            API health and financial snapshots — no secrets are exposed.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={load} disabled={isPending}>
          {isPending ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      {error ? (
        <p className="text-small text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {report ? (
        <>
          <section aria-labelledby="ops-deployment-heading" className="space-y-wilms-2">
            <h2 id="ops-deployment-heading" className="text-heading-3 font-semibold text-text-primary">
              Deployment
            </h2>
            <dl className="grid gap-wilms-2 text-small sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-text-muted">Version</dt>
                <dd className="font-medium text-text-primary">{report.deployment.version}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Environment</dt>
                <dd className="font-medium text-text-primary">{report.deployment.environment}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Git commit</dt>
                <dd className="font-mono text-xs text-text-primary">
                  {report.deployment.gitCommit?.slice(0, 12) ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Node</dt>
                <dd className="font-medium text-text-primary">{report.deployment.nodeVersion}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Health</dt>
                <dd className="font-medium text-text-primary">{report.health.status}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Generated</dt>
                <dd className="font-medium text-text-primary">
                  {new Date(report.generatedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
            {report.health.degradedReasons.length > 0 ? (
              <p className="text-small text-warning">
                Degraded: {report.health.degradedReasons.join('; ')}
              </p>
            ) : null}
          </section>

          <section aria-labelledby="ops-surfaces-heading" className="space-y-wilms-3">
            <h2 id="ops-surfaces-heading" className="text-heading-3 font-semibold text-text-primary">
              System surfaces
            </h2>
            <ul className="divide-y divide-border border-y border-border">
              {report.surfaces.map((surface) => (
                <li
                  key={surface.id}
                  className="flex flex-col gap-wilms-1 py-wilms-3 sm:flex-row sm:items-start sm:justify-between sm:gap-wilms-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary">{surface.label}</p>
                    <p className="text-small text-text-muted">{surface.detail}</p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 self-start rounded border px-wilms-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
                      stateClass(surface.state),
                    )}
                  >
                    {stateLabel(surface.state)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="ops-workers-heading" className="space-y-wilms-2">
            <h2 id="ops-workers-heading" className="text-heading-3 font-semibold text-text-primary">
              Workers
            </h2>
            <p className="text-small text-text-muted">{report.workers.note}</p>
            <dl className="grid gap-wilms-2 text-small sm:grid-cols-3">
              <div>
                <dt className="text-text-muted">Redis</dt>
                <dd className="font-medium text-text-primary">{report.workers.redis}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Queue</dt>
                <dd className="font-medium text-text-primary">{report.workers.queue}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Scheduler</dt>
                <dd className="font-medium text-text-primary">{report.workers.scheduler}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="ops-financial-heading" className="space-y-wilms-2">
            <h2 id="ops-financial-heading" className="text-heading-3 font-semibold text-text-primary">
              Financial snapshot
            </h2>
            {report.financial ? (
              <>
                <dl className="grid gap-wilms-2 text-small sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-text-muted">Available capital</dt>
                    <dd className="font-medium text-text-primary">
                      {formatPesewas(report.financial.availableCapitalPesewas)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Collected</dt>
                    <dd className="font-medium text-text-primary">
                      {formatPesewas(report.financial.totalCollectedPesewas)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Outstanding</dt>
                    <dd className="font-medium text-text-primary">
                      {formatPesewas(report.financial.outstandingPesewas)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Expenses</dt>
                    <dd className="font-medium text-text-primary">
                      {formatPesewas(report.financial.totalExpensesPesewas)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Net operating cash</dt>
                    <dd className="font-medium text-text-primary">
                      {formatPesewas(report.financial.netOperatingCashPesewas)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Collection rate</dt>
                    <dd className="font-medium text-text-primary">
                      {report.financial.collectionRatePercent}%
                    </dd>
                  </div>
                </dl>
                {report.financial.alerts.length > 0 ? (
                  <p className="text-small text-warning" role="status">
                    Alerts: {report.financial.alerts.join(', ')}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-small text-text-muted">
                Financial snapshot unavailable (database disabled or query failed).
              </p>
            )}
          </section>

          <section aria-labelledby="ops-backups-heading" className="space-y-wilms-2">
            <h2 id="ops-backups-heading" className="text-heading-3 font-semibold text-text-primary">
              Backups
            </h2>
            <p className="text-small text-text-muted">{report.backups.detail}</p>
          </section>
        </>
      ) : !error ? (
        <p className="text-small text-text-muted">Loading operations status…</p>
      ) : null}
    </div>
  );
}
