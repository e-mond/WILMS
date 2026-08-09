'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/data-display';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SettingsSectionCard } from '@/features/settings/components/SettingsSectionCard';
import { automationService } from '@/services/automationService';
import { useToast } from '@/hooks/useToast';

const rulesQueryKey = ['automation-rules'] as const;
const tasksQueryKey = ['automation-tasks'] as const;

export function SettingsAutomationSection() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const rulesQuery = useQuery({
    queryKey: rulesQueryKey,
    queryFn: () => automationService.listRules(),
  });

  const tasksQuery = useQuery({
    queryKey: tasksQueryKey,
    queryFn: () => automationService.listTasks(false),
  });

  const runMutation = useMutation({
    mutationFn: () => automationService.runDailyPass(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: rulesQueryKey }),
        queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
      ]);
      toast.success('Daily automation pass recorded');
    },
    onError: (err: unknown) => {
      toast.error('Unable to run automation pass', {
        message: err instanceof Error ? err.message : 'Try again shortly.',
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      automationService.setRuleEnabled(id, enabled),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rulesQueryKey });
      toast.success('Automation rule updated');
    },
    onError: (err: unknown) => {
      toast.error('Unable to update rule', {
        message: err instanceof Error ? err.message : 'Try again shortly.',
      });
    },
  });

  if (rulesQuery.isLoading || tasksQuery.isLoading) {
    return <InlinePanelSkeleton />;
  }

  if (rulesQuery.isError) {
    return (
      <QueryErrorState
        title="Unable to load automation rules"
        description={rulesQuery.error instanceof Error ? rulesQuery.error.message : 'Try again shortly.'}
        onRetry={() => void rulesQuery.refetch()}
      />
    );
  }

  const rules = rulesQuery.data?.rules ?? [];
  const tasks = tasksQuery.data?.tasks ?? [];

  return (
    <div className="space-y-wilms-4">
      <SettingsSectionCard
        title="Automation engine"
        description="Scheduled payment reminders, overdue escalations, collector follow-ups, and executive report cadences."
      >
        <div className="mb-wilms-3 flex flex-wrap items-center justify-between gap-wilms-2">
          <p className="text-small text-text-muted">
            Default rules seed on first load. Cron can also call the scheduler automation endpoint.
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={runMutation.isPending}
            onClick={() => void runMutation.mutateAsync()}
          >
            {runMutation.isPending ? 'Running…' : 'Run daily pass'}
          </Button>
        </div>
        <DataTable
          columns={[
            { id: 'name', header: 'Rule', cell: (row) => row.name },
            {
              id: 'category',
              header: 'Category',
              cell: (row) => <Badge variant="primary">{row.category}</Badge>,
            },
            { id: 'trigger', header: 'Trigger', cell: (row) => row.triggerType },
            {
              id: 'enabled',
              header: 'Status',
              cell: (row) => (row.enabled === false ? 'Disabled' : 'Enabled'),
            },
            {
              id: 'schedule',
              header: 'Schedule',
              cell: (row) => row.scheduleCron ?? 'Event-driven',
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (row) => (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={toggleMutation.isPending || row.id.startsWith('memory-')}
                  onClick={() =>
                    void toggleMutation.mutateAsync({
                      id: row.id,
                      enabled: row.enabled === false,
                    })
                  }
                >
                  {row.enabled === false ? 'Enable' : 'Disable'}
                </Button>
              ),
            },
          ]}
          data={rules}
          getRowId={(row) => row.id}
          emptyMessage="No automation rules configured."
        />
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Open automation tasks"
        description="Follow-ups created by the automation engine for collectors and operators."
      >
        {tasksQuery.isError ? (
          <QueryErrorState
            title="Unable to load automation tasks"
            description={
              tasksQuery.error instanceof Error ? tasksQuery.error.message : 'Try again shortly.'
            }
            onRetry={() => void tasksQuery.refetch()}
          />
        ) : (
          <DataTable
            columns={[
              { id: 'title', header: 'Task', cell: (row) => row.title },
              {
                id: 'category',
                header: 'Category',
                cell: (row) => <Badge variant="default">{row.category}</Badge>,
              },
              { id: 'status', header: 'Status', cell: (row) => row.status ?? 'OPEN' },
              {
                id: 'entity',
                header: 'Related',
                cell: (row) =>
                  row.relatedEntityType
                    ? `${row.relatedEntityType}${row.relatedEntityId ? ` · ${row.relatedEntityId}` : ''}`
                    : '—',
              },
            ]}
            data={tasks}
            getRowId={(row) => row.id}
            emptyMessage="No open automation tasks."
          />
        )}
      </SettingsSectionCard>
    </div>
  );
}
