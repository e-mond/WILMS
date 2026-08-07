'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/data-display';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { PERMISSION } from '@/constants/permissions';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { useToast } from '@/hooks/useToast';
import { intelligenceService } from '@/services/intelligenceService';
import { ApiError } from '@/types/api';
import type { ExportJob, ExportJobFormat } from '@/types/intelligence';

const EXPORT_ENTITIES = [
  'borrowers',
  'groups',
  'collectors',
  'loans',
  'payments',
  'reconciliations',
  'expenses',
  'reports',
  'notifications',
  'communications',
  'audit',
] as const;

const EXPORT_FORMATS: ExportJobFormat[] = ['CSV', 'EXCEL', 'PDF'];

function expiresInLabel(expiresAt?: string | null): string {
  if (!expiresAt) return '—';
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return '—';
  if (ms <= 0) return 'Expired';
  const days = Math.ceil(ms / 86_400_000);
  return days === 1 ? '1 day' : `${days} days`;
}

function downloadPreviewCsv(job: ExportJob) {
  const rows = job.previewRows ?? [];
  const headers = rows.length > 0 ? Object.keys(rows[0]!) : ['message'];
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = String(row[header] ?? '');
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(','),
    ),
  ];
  if (rows.length === 0) {
    lines.push('"No preview rows"');
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = job.fileName ?? `${job.entityType}-export.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExportCenterPanel() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [entityType, setEntityType] = useState<string>(EXPORT_ENTITIES[0]);
  const [format, setFormat] = useState<ExportJobFormat>('CSV');
  const [composerOpen, setComposerOpen] = useState(false);
  const [previewJob, setPreviewJob] = useState<ExportJob | null>(null);

  const jobsQuery = useQuery({
    queryKey: ['exports', 'jobs'] as const,
    queryFn: () => intelligenceService.listExportJobs(),
  });

  const { showLoading, isTimedOut, isForbidden } = useQueryLoadingPolicy({
    isLoading: jobsQuery.isLoading,
    isError: jobsQuery.isError,
    error: jobsQuery.error,
  });

  const createMutation = useMutation({
    mutationFn: () => intelligenceService.createExportJob({ entityType, format }),
    onSuccess: (job) => {
      toast.success('Export job created', {
        message: job.fileName ?? `${job.entityType} (${job.format})`,
      });
      setComposerOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['exports', 'jobs'] });
    },
    onError: (error) => {
      toast.error('Unable to create export', {
        message: error instanceof ApiError ? error.message : 'Try again shortly.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => intelligenceService.deleteExportJob(id),
    onSuccess: () => {
      toast.success('Export deleted');
      void queryClient.invalidateQueries({ queryKey: ['exports', 'jobs'] });
    },
    onError: (error) => {
      toast.error('Unable to delete export', {
        message: error instanceof ApiError ? error.message : 'Try again shortly.',
      });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: (id: string) => intelligenceService.regenerateExportJob(id),
    onSuccess: (job) => {
      toast.success('Export regenerated', { message: job.fileName ?? job.id });
      void queryClient.invalidateQueries({ queryKey: ['exports', 'jobs'] });
    },
    onError: (error) => {
      toast.error('Unable to regenerate export', {
        message: error instanceof ApiError ? error.message : 'Try again shortly.',
      });
    },
  });

  const jobs = useMemo(() => jobsQuery.data ?? [], [jobsQuery.data]);

  const copyLink = async (job: ExportJob) => {
    const url = `${window.location.origin}/exports?job=${encodeURIComponent(job.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Download link copied');
    } catch {
      toast.error('Unable to copy link');
    }
  };

  const shareJob = async (job: ExportJob) => {
    const url = `${window.location.origin}/exports?job=${encodeURIComponent(job.id)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: job.fileName ?? 'WILMS export',
          text: `WILMS export · ${job.entityType} · ${job.format}`,
          url,
        });
        return;
      } catch {
        // fall through to copy
      }
    }
    await copyLink(job);
  };

  return (
    <div className="space-y-wilms-6" data-testid="export-center">
      <div className="flex flex-wrap items-end justify-between gap-wilms-3 border-b border-border pb-wilms-4">
        <div>
          <h1 className="text-heading-2 font-semibold text-text-primary">Export Center</h1>
          <p className="mt-wilms-1 max-w-2xl text-small text-text-muted">
            Create branded exports, download results, and manage job history with expiry.
          </p>
        </div>
        <PermissionGate permissions={[PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.VIEW_REPORTS]}>
          <Button type="button" onClick={() => setComposerOpen(true)}>
            New Export
          </Button>
        </PermissionGate>
      </div>

      <PermissionGate
        permissions={[PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.VIEW_REPORTS]}
        fallback={
          <p className="text-small text-text-muted" role="status">
            You do not have permission to manage exports.
          </p>
        }
      >
        <section aria-labelledby="recent-exports-heading" className="space-y-wilms-3">
          <div className="flex flex-wrap items-center justify-between gap-wilms-2">
            <h2
              id="recent-exports-heading"
              className="text-heading-3 font-semibold text-text-primary"
            >
              Job history
            </h2>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void jobsQuery.refetch()}
              disabled={jobsQuery.isFetching}
            >
              {jobsQuery.isFetching ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>

          <QueryStatePanel
            isLoading={jobsQuery.isLoading}
            showLoading={showLoading}
            isTimedOut={isTimedOut}
            isError={jobsQuery.isError}
            error={jobsQuery.error}
            errorMessage="Unable to load export jobs."
            isForbidden={isForbidden}
            isEmpty={!jobsQuery.isLoading && jobs.length === 0}
            emptyTitle="No export jobs yet"
            emptyDescription="Use New Export to generate your first file."
            onRetry={() => void jobsQuery.refetch()}
            variant="table"
          >
            {jobs.length > 0 ? (
              <DataTable<ExportJob>
                variant="executive"
                caption="Export jobs"
                data={jobs}
                getRowId={(row) => row.id}
                columns={[
                  { id: 'entity', header: 'Entity', cell: (row) => row.entityType },
                  { id: 'format', header: 'Format', cell: (row) => row.format },
                  { id: 'status', header: 'Status', cell: (row) => row.status },
                  {
                    id: 'rows',
                    header: 'Rows',
                    cell: (row) => row.rowCount ?? '—',
                  },
                  {
                    id: 'generatedAt',
                    header: 'Generated at',
                    cell: (row) =>
                      row.completedAt || row.createdAt
                        ? new Date(String(row.completedAt ?? row.createdAt)).toLocaleString()
                        : '—',
                  },
                  {
                    id: 'generatedBy',
                    header: 'Generated by',
                    cell: (row) => row.requestedByUserId?.slice(0, 8) ?? '—',
                  },
                  {
                    id: 'expires',
                    header: 'Expires in',
                    cell: (row) => expiresInLabel(row.expiresAt),
                  },
                  {
                    id: 'actions',
                    header: 'Actions',
                    cell: (row) => (
                      <div className="flex flex-wrap gap-wilms-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => downloadPreviewCsv(row)}
                        >
                          Download
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setPreviewJob(row)}
                        >
                          Preview
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={regenerateMutation.isPending}
                          onClick={() => regenerateMutation.mutate(row.id)}
                        >
                          Regenerate
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => void shareJob(row)}
                        >
                          Share
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => void copyLink(row)}
                        >
                          Copy link
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(row.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            ) : null}
          </QueryStatePanel>
        </section>
      </PermissionGate>

      <Drawer
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        title="New Export"
        side="right"
        width="w-full max-w-md"
      >
        <div className="space-y-wilms-4">
          <label className="block text-small text-text-muted">
            Entity
            <Select
              className="mt-1 w-full"
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
            >
              {EXPORT_ENTITIES.map((entity) => (
                <option key={entity} value={entity}>
                  {entity}
                </option>
              ))}
            </Select>
          </label>
          <label className="block text-small text-text-muted">
            Format
            <Select
              className="mt-1 w-full"
              value={format}
              onChange={(event) => setFormat(event.target.value as ExportJobFormat)}
            >
              {EXPORT_FORMATS.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </Select>
          </label>
          <Button
            type="button"
            className="w-full"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating…' : 'Create export'}
          </Button>
        </div>
      </Drawer>

      <Drawer
        isOpen={Boolean(previewJob)}
        onClose={() => setPreviewJob(null)}
        title={previewJob?.fileName ?? 'Export preview'}
        side="right"
        width="w-full max-w-lg"
      >
        {previewJob ? (
          <div className="space-y-wilms-3">
            <p className="text-small text-text-muted">
              {previewJob.entityType} · {previewJob.format} · {previewJob.rowCount ?? 0} rows ·
              expires {expiresInLabel(previewJob.expiresAt)}
            </p>
            <pre className="max-h-[60vh] overflow-auto rounded-sm border border-border bg-background p-wilms-3 text-small">
              {JSON.stringify(previewJob.previewRows ?? [], null, 2)}
            </pre>
            <Button type="button" onClick={() => downloadPreviewCsv(previewJob)}>
              Download CSV preview
            </Button>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
