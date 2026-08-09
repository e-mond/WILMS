'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { holidayRequestsService } from '@/services/holidayRequestsService';
import { organizationHolidaysService } from '@/services/organizationHolidaysService';
import type { HolidayRequest } from '@/types/holiday-requests';
import { formatDisplayDate } from '@/utils/format-date';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/utils/cn';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useOfflineQueueStore } from '@/state/offlineQueueStore';

const requestsQueryKey = ['holiday-requests', 'mine'] as const;
const orgHolidaysQueryKey = ['organization-holidays'] as const;

function statusTone(status: HolidayRequest['status']): string {
  switch (status) {
    case 'APPLIED':
    case 'APPROVED':
      return 'text-status-active';
    case 'REJECTED':
      return 'text-danger';
    case 'SUBMITTED':
      return 'text-status-info';
    default:
      return 'text-text-muted';
  }
}

export function CollectorHolidayRequestsPanel() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOffline } = useOfflineStatus();
  const enqueueHolidayRequest = useOfflineQueueStore((state) => state.enqueueHolidayRequest);
  const [name, setName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const requestsQuery = useQuery({
    queryKey: requestsQueryKey,
    queryFn: () => holidayRequestsService.listRequests({ mine: true }),
  });
  const holidaysQuery = useQuery({
    queryKey: orgHolidaysQueryKey,
    queryFn: () => organizationHolidaysService.listHolidays(),
  });

  const createMutation = useMutation({
    mutationFn: async (submit: boolean) => {
      const payload = {
        name: name.trim(),
        holidayDate: holidayDate.trim(),
        endDate: endDate.trim() || null,
        reason: reason.trim() || null,
        submit,
      };

      if (isOffline) {
        enqueueHolidayRequest(payload);
        return { offline: true as const, submit };
      }

      return {
        offline: false as const,
        request: await holidayRequestsService.createRequest(payload),
      };
    },
    onSuccess: async (result) => {
      setName('');
      setHolidayDate('');
      setEndDate('');
      setReason('');
      await queryClient.invalidateQueries({ queryKey: requestsQueryKey });
      if (result.offline) {
        toast.success(
          result.submit
            ? 'Holiday request queued for sync'
            : 'Holiday draft saved offline',
        );
        return;
      }
      toast.success(
        result.request.status === 'SUBMITTED' ? 'Holiday request submitted' : 'Draft saved',
      );
    },
    onError: (err: unknown) => {
      toast.error('Unable to save holiday request', {
        message: err instanceof Error ? err.message : 'Try again shortly.',
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => holidayRequestsService.submit(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: requestsQueryKey });
      toast.success('Holiday request submitted');
    },
    onError: (err: unknown) => {
      toast.error('Unable to submit', {
        message: err instanceof Error ? err.message : 'Try again shortly.',
      });
    },
  });

  const calendarDays = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    if (!year || !month) {
      return [];
    }
    const first = new Date(Date.UTC(year, month - 1, 1));
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const startPad = first.getUTCDay();
    const orgDates = new Set((holidaysQuery.data?.holidays ?? []).map((h) => h.holidayDate));
    const requestByDate = new Map<string, HolidayRequest[]>();
    for (const request of requestsQuery.data?.requests ?? []) {
      const list = requestByDate.get(request.holidayDate) ?? [];
      list.push(request);
      requestByDate.set(request.holidayDate, list);
    }

    const cells: Array<{
      key: string;
      label: string;
      iso: string | null;
      isOrgHoliday: boolean;
      requests: HolidayRequest[];
    }> = [];

    for (let i = 0; i < startPad; i += 1) {
      cells.push({ key: `pad-${i}`, label: '', iso: null, isOrgHoliday: false, requests: [] });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        key: iso,
        label: String(day),
        iso,
        isOrgHoliday: orgDates.has(iso),
        requests: requestByDate.get(iso) ?? [],
      });
    }
    return cells;
  }, [holidaysQuery.data?.holidays, requestsQuery.data?.requests, selectedMonth]);

  if (requestsQuery.isLoading || holidaysQuery.isLoading) {
    return <InlinePanelSkeleton />;
  }

  if (requestsQuery.isError) {
    return (
      <QueryErrorState
        title="Unable to load holiday requests"
        description={
          requestsQuery.error instanceof Error
            ? requestsQuery.error.message
            : 'Try again shortly.'
        }
        onRetry={() => void requestsQuery.refetch()}
      />
    );
  }

  const requests = requestsQuery.data?.requests ?? [];

  return (
    <div className="space-y-wilms-6">
      <section className="space-y-wilms-3 rounded-sm border border-border bg-card p-wilms-4">
        <h2 className="text-heading-3 font-semibold text-text-primary">Request a holiday</h2>
        <p className="text-small text-text-muted">
          Draft or submit a holiday that shifts repayment schedules after approval.
        </p>
        <form
          className="grid gap-wilms-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim() || !holidayDate.trim()) {
              toast.error('Name and date are required');
              return;
            }
            void createMutation.mutateAsync(true);
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
          <Input
            aria-label="End date (optional)"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
          <Textarea
            aria-label="Reason"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="sm:col-span-2"
          />
          <div className="flex flex-wrap gap-wilms-2 sm:col-span-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={createMutation.isPending}
              onClick={() => {
                if (!name.trim() || !holidayDate.trim()) {
                  toast.error('Name and date are required');
                  return;
                }
                void createMutation.mutateAsync(false);
              }}
            >
              Save draft
            </Button>
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving…' : 'Submit for approval'}
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-wilms-3 rounded-sm border border-border bg-card p-wilms-4">
        <div className="flex flex-wrap items-center justify-between gap-wilms-2">
          <h2 className="text-heading-3 font-semibold text-text-primary">Holiday calendar</h2>
          <input
            aria-label="Calendar month"
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="h-10 w-auto rounded-sm border border-border bg-card px-wilms-3 text-body text-text-primary"
          />
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-caption text-text-muted">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
            <div key={label} className="py-1 font-semibold">
              {label}
            </div>
          ))}
          {calendarDays.map((cell) => (
            <div
              key={cell.key}
              className={cn(
                'min-h-14 rounded-sm border border-transparent p-1 text-left',
                cell.iso && 'border-border bg-surface',
                cell.isOrgHoliday && 'border-brand-primary/40 bg-brand-primary-light',
                cell.requests.length > 0 && 'ring-1 ring-status-info/40',
              )}
            >
              <div className="text-caption font-semibold text-text-primary">{cell.label}</div>
              {cell.isOrgHoliday ? (
                <div className="text-[10px] font-medium text-brand-primary">Org</div>
              ) : null}
              {cell.requests[0] ? (
                <div className={cn('truncate text-[10px] font-medium', statusTone(cell.requests[0].status))}>
                  {cell.requests[0].status}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-wilms-3 rounded-sm border border-border bg-card p-wilms-4">
        <h2 className="text-heading-3 font-semibold text-text-primary">My requests</h2>
        {requests.length === 0 ? (
          <p className="text-small text-text-muted">No holiday requests yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {requests.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-wilms-2 py-wilms-3"
              >
                <div>
                  <p className="font-semibold text-text-primary">{request.name}</p>
                  <p className="text-small text-text-muted">
                    {formatDisplayDate(request.holidayDate)}
                    {request.endDate ? ` – ${formatDisplayDate(request.endDate)}` : ''}
                    {' · '}
                    <span className={statusTone(request.status)}>{request.status}</span>
                  </p>
                </div>
                {request.status === 'DRAFT' ? (
                  <Button
                    size="sm"
                    disabled={submitMutation.isPending}
                    onClick={() => void submitMutation.mutateAsync(request.id)}
                  >
                    Submit
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
