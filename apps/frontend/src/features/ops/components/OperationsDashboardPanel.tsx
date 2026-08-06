'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { PERMISSION } from '@/constants/permissions';
import { useToast } from '@/hooks/useToast';
import { intelligenceService } from '@/services/intelligenceService';
import { opsService, type OpsStatusReport, type OpsSurfaceState, type OpsWorkerLastRun } from '@/services/opsService';
import { ApiError } from '@/types/api';
import type { MaintenanceWindow, OperationalIncident } from '@/types/intelligence';
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

function WorkerLastRunCard({
  title,
  run,
}: {
  title: string;
  run: OpsWorkerLastRun | null;
}) {
  if (!run) {
    return (
      <div className="rounded-sm border border-border bg-card p-wilms-3">
        <p className="font-medium text-text-primary">{title}</p>
        <p className="mt-wilms-1 text-small text-text-muted">No run recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-border bg-card p-wilms-3">
      <div className="flex items-start justify-between gap-wilms-2">
        <p className="font-medium text-text-primary">{title}</p>
        <span
          className={cn(
            'inline-flex rounded border px-wilms-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
            run.success
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-danger/30 bg-danger/10 text-danger',
          )}
        >
          {run.success ? 'Success' : 'Failed'}
        </span>
      </div>
      <dl className="mt-wilms-2 space-y-wilms-1 text-small">
        <div className="flex justify-between gap-wilms-2">
          <dt className="text-text-muted">Finished</dt>
          <dd className="font-medium text-text-primary">
            {new Date(run.finishedAt).toLocaleString()}
          </dd>
        </div>
        <div className="flex justify-between gap-wilms-2">
          <dt className="text-text-muted">Duration</dt>
          <dd className="font-medium text-text-primary">{run.durationMs} ms</dd>
        </div>
        {run.error ? (
          <div>
            <dt className="text-text-muted">Error</dt>
            <dd className="mt-wilms-1 text-danger">{run.error}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
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
            Super Admin platform control centre for operators (health, workers, queues, migrations,
            runtime). Field staff and day-to-day lending work use the Dashboard and Daily Operations
            pages instead. Values come from authenticated API health and financial snapshots — no
            secrets are exposed.
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
            {report.workers.lastRuns ? (
              <div className="mt-wilms-3 grid gap-wilms-3 sm:grid-cols-2">
                <WorkerLastRunCard
                  title="Payment notifications"
                  run={report.workers.lastRuns.paymentNotifications}
                />
                <WorkerLastRunCard
                  title="Communications"
                  run={report.workers.lastRuns.communications}
                />
              </div>
            ) : null}
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

      <OpsIncidentsSection />
      <OpsMaintenanceSection />
    </div>
  );
}

function OpsIncidentsSection() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState('warning');
  const [summary, setSummary] = useState('');
  const [resolveDrafts, setResolveDrafts] = useState<Record<string, string>>({});

  const incidentsQuery = useQuery({
    queryKey: ['ops', 'incidents'] as const,
    queryFn: () => intelligenceService.listIncidents(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      intelligenceService.createIncident({
        title: title.trim(),
        severity,
        summary: summary.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Incident opened');
      setTitle('');
      setSummary('');
      void queryClient.invalidateQueries({ queryKey: ['ops', 'incidents'] });
    },
    onError: (error) => {
      toast.error('Unable to create incident', {
        message: error instanceof ApiError ? error.message : 'Try again shortly.',
      });
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => intelligenceService.acknowledgeIncident(id),
    onSuccess: () => {
      toast.success('Incident acknowledged');
      void queryClient.invalidateQueries({ queryKey: ['ops', 'incidents'] });
    },
    onError: (error) => {
      toast.error('Unable to acknowledge', {
        message: error instanceof ApiError ? error.message : 'Try again shortly.',
      });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) =>
      intelligenceService.resolveIncident(id, resolution),
    onSuccess: (_data, variables) => {
      toast.success('Incident resolved');
      setResolveDrafts((prev) => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
      void queryClient.invalidateQueries({ queryKey: ['ops', 'incidents'] });
    },
    onError: (error) => {
      toast.error('Unable to resolve', {
        message: error instanceof ApiError ? error.message : 'Try again shortly.',
      });
    },
  });

  return (
    <section aria-labelledby="ops-incidents-heading" className="space-y-wilms-3">
      <h2 id="ops-incidents-heading" className="text-heading-3 font-semibold text-text-primary">
        Incidents
      </h2>

      <PermissionGate permission={PERMISSION.MANAGE_SYSTEM_SETTINGS}>
        <form
          className="grid gap-wilms-3 rounded-sm border border-border bg-card p-wilms-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) return;
            createMutation.mutate();
          }}
        >
          <label className="block text-small text-text-muted sm:col-span-2">
            Title
            <Input
              className="mt-1"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>
          <label className="block text-small text-text-muted">
            Severity
            <Select
              className="mt-1"
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="danger">Danger</option>
              <option value="critical">Critical</option>
            </Select>
          </label>
          <div className="flex items-end">
            <Button type="submit" disabled={createMutation.isPending || !title.trim()}>
              {createMutation.isPending ? 'Opening…' : 'Open incident'}
            </Button>
          </div>
          <label className="block text-small text-text-muted sm:col-span-2">
            Summary
            <Textarea
              className="mt-1"
              rows={2}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
          </label>
        </form>
      </PermissionGate>

      {incidentsQuery.isError ? (
        <p className="text-small text-danger" role="alert">
          {incidentsQuery.error instanceof ApiError
            ? incidentsQuery.error.message
            : 'Unable to load incidents.'}
        </p>
      ) : null}

      {incidentsQuery.isLoading ? (
        <p className="text-small text-text-muted">Loading incidents…</p>
      ) : (incidentsQuery.data?.length ?? 0) === 0 ? (
        <p className="text-small text-text-muted">No incidents recorded.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {(incidentsQuery.data as OperationalIncident[]).map((incident) => (
            <li key={incident.id} className="space-y-wilms-2 py-wilms-3">
              <div className="flex flex-wrap items-start justify-between gap-wilms-2">
                <div>
                  <p className="font-medium text-text-primary">{incident.title}</p>
                  <p className="text-small text-text-muted">
                    {incident.severity} · {incident.status}
                    {incident.openedAt
                      ? ` · ${new Date(incident.openedAt).toLocaleString()}`
                      : ''}
                  </p>
                  {incident.summary ? (
                    <p className="mt-wilms-1 text-small text-text-muted">{incident.summary}</p>
                  ) : null}
                </div>
                <PermissionGate permission={PERMISSION.MANAGE_SYSTEM_SETTINGS}>
                  <div className="flex flex-wrap gap-wilms-2">
                    {incident.status === 'OPEN' ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => acknowledgeMutation.mutate(incident.id)}
                        disabled={acknowledgeMutation.isPending}
                      >
                        Acknowledge
                      </Button>
                    ) : null}
                    {incident.status !== 'RESOLVED' ? (
                      <div className="flex flex-wrap items-center gap-wilms-2">
                        <Input
                          className="w-48"
                          placeholder="Resolution note"
                          value={resolveDrafts[incident.id] ?? ''}
                          onChange={(event) =>
                            setResolveDrafts((prev) => ({
                              ...prev,
                              [incident.id]: event.target.value,
                            }))
                          }
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const resolution = (resolveDrafts[incident.id] ?? '').trim();
                            if (!resolution) return;
                            resolveMutation.mutate({ id: incident.id, resolution });
                          }}
                          disabled={
                            resolveMutation.isPending ||
                            !(resolveDrafts[incident.id] ?? '').trim()
                          }
                        >
                          Resolve
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </PermissionGate>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function OpsMaintenanceSection() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const maintenanceQuery = useQuery({
    queryKey: ['ops', 'maintenance'] as const,
    queryFn: () => intelligenceService.listMaintenanceWindows(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      intelligenceService.createMaintenanceWindow({
        title: title.trim(),
        message: message.trim(),
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      }),
    onSuccess: () => {
      toast.success('Maintenance window scheduled');
      setTitle('');
      setMessage('');
      setStartsAt('');
      setEndsAt('');
      void queryClient.invalidateQueries({ queryKey: ['ops', 'maintenance'] });
    },
    onError: (error) => {
      toast.error('Unable to schedule maintenance', {
        message: error instanceof ApiError ? error.message : 'Try again shortly.',
      });
    },
  });

  return (
    <section aria-labelledby="ops-maintenance-heading" className="space-y-wilms-3">
      <h2 id="ops-maintenance-heading" className="text-heading-3 font-semibold text-text-primary">
        Maintenance windows
      </h2>

      <PermissionGate permission={PERMISSION.MANAGE_SYSTEM_SETTINGS}>
        <form
          className="grid gap-wilms-3 rounded-sm border border-border bg-card p-wilms-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim() || !message.trim() || !startsAt || !endsAt) return;
            createMutation.mutate();
          }}
        >
          <label className="block text-small text-text-muted sm:col-span-2">
            Title
            <Input
              className="mt-1"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>
          <label className="block text-small text-text-muted">
            Starts
            <Input
              type="datetime-local"
              className="mt-1"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              required
            />
          </label>
          <label className="block text-small text-text-muted">
            Ends
            <Input
              type="datetime-local"
              className="mt-1"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              required
            />
          </label>
          <label className="block text-small text-text-muted sm:col-span-2">
            Message
            <Textarea
              className="mt-1"
              rows={2}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
            />
          </label>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Scheduling…' : 'Schedule window'}
          </Button>
        </form>
      </PermissionGate>

      {maintenanceQuery.isError ? (
        <p className="text-small text-danger" role="alert">
          {maintenanceQuery.error instanceof ApiError
            ? maintenanceQuery.error.message
            : 'Unable to load maintenance windows.'}
        </p>
      ) : null}

      {maintenanceQuery.isLoading ? (
        <p className="text-small text-text-muted">Loading maintenance windows…</p>
      ) : (maintenanceQuery.data?.length ?? 0) === 0 ? (
        <p className="text-small text-text-muted">No maintenance windows scheduled.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {(maintenanceQuery.data as MaintenanceWindow[]).map((entry) => (
            <li key={entry.id} className="py-wilms-3">
              <p className="font-medium text-text-primary">{entry.title}</p>
              <p className="text-small text-text-muted">{entry.message}</p>
              <p className="mt-wilms-1 text-small text-text-muted">
                {new Date(entry.startsAt).toLocaleString()} →{' '}
                {new Date(entry.endsAt).toLocaleString()}
                {entry.active === false ? ' · inactive' : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
