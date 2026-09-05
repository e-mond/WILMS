'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/data-display';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PERMISSION } from '@/constants/permissions';
import { SettingsHolidaysIcon } from '@/features/settings/components/SettingsSectionIcons';
import { SettingsSectionCard } from '@/features/settings/components/SettingsSectionCard';
import { organizationHolidaysService } from '@/services/organizationHolidaysService';
import type { OrganizationHoliday } from '@/types/enterprise';
import { formatDisplayDate } from '@/utils/format-date';
import { useToast } from '@/hooks/useToast';

const holidaysQueryKey = ['organization-holidays'] as const;

export function SettingsHolidaysSection() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: holidaysQueryKey,
    queryFn: () => organizationHolidaysService.listHolidays(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      organizationHolidaysService.createHoliday({
        name: name.trim(),
        holidayDate: holidayDate.trim(),
      }),
    onSuccess: async () => {
      setName('');
      setHolidayDate('');
      await queryClient.invalidateQueries({ queryKey: holidaysQueryKey });
      toast.success('Holiday added');
    },
    onError: (err: unknown) => {
      toast.error('Unable to add holiday', {
        message: err instanceof Error ? err.message : 'Try again shortly.',
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => organizationHolidaysService.syncGhanaHolidays(),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: holidaysQueryKey });
      toast.success(
        `Ghana holidays synced (${result.inserted} new, ${result.updated} updated for ${result.year})`,
      );
    },
    onError: (err: unknown) => {
      toast.error('Unable to sync Ghana holidays', {
        message: err instanceof Error ? err.message : 'Try again shortly.',
      });
    },
  });

  if (isLoading) {
    return <InlinePanelSkeleton />;
  }

  if (isError) {
    return (
      <QueryErrorState
        title="Unable to load holidays"
        description={error instanceof Error ? error.message : 'Try again shortly.'}
        onRetry={() => void refetch()}
      />
    );
  }

  const holidays = data?.holidays ?? [];

  return (
    <div className="space-y-wilms-4">
      <SettingsSectionCard
        title="Organisation holidays"
        description="Non-working days that shift loan repayment schedules. Add national or branch holidays used by the schedule engine."
        icon={<SettingsHolidaysIcon />}
      >
        <PermissionGate permission={PERMISSION.MANAGE_SYSTEM_SETTINGS}>
          <div className="mb-wilms-4 flex flex-wrap gap-wilms-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={syncMutation.isPending}
              onClick={() => void syncMutation.mutateAsync()}
            >
              {syncMutation.isPending ? 'Syncing…' : 'Sync Ghana public holidays'}
            </Button>
          </div>
          <form
            className="mb-wilms-4 grid gap-wilms-3 sm:grid-cols-[1fr_10rem_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim() || !holidayDate.trim()) {
                toast.error('Name and date are required');
                return;
              }
              void createMutation.mutateAsync();
            }}
          >
            <Input
              aria-label="Holiday name"
              placeholder="Holiday name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Input
              aria-label="Holiday date"
              type="date"
              value={holidayDate}
              onChange={(event) => setHolidayDate(event.target.value)}
            />
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding…' : 'Add holiday'}
            </Button>
          </form>
        </PermissionGate>

        {holidays.length === 0 ? (
          <p className="text-small text-text-muted">No organisation holidays configured yet.</p>
        ) : (
          <DataTable<OrganizationHoliday>
            variant="executive"
            layout="auto"
            caption="Organisation holidays"
            data={holidays}
            getRowId={(row) => row.id}
            columns={[
              { id: 'name', header: 'Name', cell: (row) => row.name },
              {
                id: 'date',
                header: 'Date',
                cell: (row) => formatDisplayDate(row.holidayDate),
              },
              { id: 'scope', header: 'Scope', cell: (row) => row.scope },
              {
                id: 'source',
                header: 'Source',
                cell: (row) => row.source ?? 'MANUAL',
              },
              {
                id: 'branch',
                header: 'Branch',
                cell: (row) => row.branch ?? '—',
              },
            ]}
          />
        )}
      </SettingsSectionCard>
    </div>
  );
}
