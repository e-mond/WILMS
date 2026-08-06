'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/data-display';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
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

export function ExportCenterPanel() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [entityType, setEntityType] = useState<string>(EXPORT_ENTITIES[0]);
  const [format, setFormat] = useState<ExportJobFormat>('CSV');

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
      void queryClient.invalidateQueries({ queryKey: ['exports', 'jobs'] });
    },
    onError: (error) => {
      toast.error('Unable to create export', {
        message: error instanceof ApiError ? error.message : 'Try again shortly.',
      });
    },
  });

  return (
    <div className="space-y-wilms-6" data-testid="export-center">
      <div className="border-b border-border pb-wilms-4">
        <h1 className="text-heading-2 font-semibold text-text-primary">Export Center</h1>
        <p className="mt-wilms-1 max-w-2xl text-small text-text-muted">
          Create async export jobs and review recent results. Jobs return a preview and row count
          when available.
        </p>
      </div>

      <PermissionGate
        permissions={[PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.VIEW_REPORTS]}
        fallback={
          <p className="text-small text-text-muted" role="status">
            You do not have permission to manage exports.
          </p>
        }
      >
        <section
          aria-labelledby="create-export-heading"
          className="rounded-sm border border-border bg-card p-wilms-4"
        >
          <h2 id="create-export-heading" className="text-heading-3 font-semibold text-text-primary">
            Create export job
          </h2>
          <div className="mt-wilms-3 flex flex-wrap items-end gap-wilms-3">
            <label className="block text-small text-text-muted">
              Entity
              <Select
                className="mt-1 w-48"
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
                className="mt-1 w-32"
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
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating…' : 'Create job'}
            </Button>
          </div>
        </section>

        <section aria-labelledby="recent-exports-heading" className="space-y-wilms-3">
          <div className="flex flex-wrap items-center justify-between gap-wilms-2">
            <h2
              id="recent-exports-heading"
              className="text-heading-3 font-semibold text-text-primary"
            >
              Recent jobs
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
            isEmpty={!jobsQuery.isLoading && (jobsQuery.data?.length ?? 0) === 0}
            emptyTitle="No export jobs yet"
            emptyDescription="Create a job above to generate an export."
            onRetry={() => void jobsQuery.refetch()}
            variant="table"
          >
            {jobsQuery.data && jobsQuery.data.length > 0 ? (
              <DataTable<ExportJob>
                variant="executive"
                caption="Export jobs"
                data={jobsQuery.data}
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
                    id: 'file',
                    header: 'File',
                    cell: (row) => row.fileName ?? '—',
                  },
                  {
                    id: 'created',
                    header: 'Created',
                    cell: (row) =>
                      row.createdAt ? new Date(row.createdAt).toLocaleString() : '—',
                  },
                ]}
              />
            ) : null}
          </QueryStatePanel>
        </section>
      </PermissionGate>
    </div>
  );
}
