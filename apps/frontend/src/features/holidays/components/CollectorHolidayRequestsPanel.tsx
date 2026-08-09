'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Calendar } from '@/components/ui/Calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { holidayRequestsService } from '@/services/holidayRequestsService';
import { organizationHolidaysService } from '@/services/organizationHolidaysService';
import type { HolidayRequest } from '@/types/holiday-requests';
import { formatDisplayDate } from '@/utils/format-date';
import { useToast } from '@/hooks/useToast';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useOfflineQueueStore } from '@/state/offlineQueueStore';

const requestsQueryKey = ['holiday-requests', 'mine'] as const;
const orgHolidaysQueryKey = ['organization-holidays'] as const;

function statusVariant(status: HolidayRequest['status']): 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'pending' {
  switch (status) {
    case 'APPLIED':
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
    case 'CANCELLED':
      return 'danger';
    case 'SUBMITTED':
      return 'primary';
    default:
      return 'pending';
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
  const [notes, setNotes] = useState('');
  const [community, setCommunity] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const requestsQuery = useQuery({
    queryKey: requestsQueryKey,
    queryFn: () => holidayRequestsService.listRequests({ mine: true }),
  });
  const holidaysQuery = useQuery({
    queryKey: orgHolidaysQueryKey,
    queryFn: () => organizationHolidaysService.listHolidays(),
  });
  const impactQuery = useQuery({
    queryKey: ['holiday-impact', holidayDate, endDate],
    queryFn: () =>
      holidayRequestsService.previewImpact({
        holidayDate: holidayDate.trim(),
        endDate: endDate.trim() || null,
      }),
    enabled: Boolean(holidayDate.trim()) && !isOffline,
  });

  const createMutation = useMutation({
    mutationFn: async (submit: boolean) => {
      const payload = {
        name: name.trim(),
        holidayDate: holidayDate.trim(),
        endDate: endDate.trim() || null,
        reason: reason.trim() || null,
        notes: notes.trim() || null,
        community: community.trim() || null,
        evidenceUrl: evidenceUrl.trim() || null,
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
      setEndDate('');
      setReason('');
      setNotes('');
      setCommunity('');
      setEvidenceUrl('');
      await queryClient.invalidateQueries({ queryKey: requestsQueryKey });
      if (result.offline) {
        toast.success(result.submit ? 'Holiday request queued for sync' : 'Holiday draft saved offline');
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

  const cancelMutation = useMutation({
    mutationFn: (id: string) => holidayRequestsService.cancel(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: requestsQueryKey });
      toast.success('Holiday request cancelled');
    },
    onError: (err: unknown) => {
      toast.error('Unable to cancel', {
        message: err instanceof Error ? err.message : 'Try again shortly.',
      });
    },
  });

  const markers = useMemo(() => {
    const list: Array<{ iso: string; tone: 'brand' | 'info' | 'success' | 'warning' | 'danger' }> = [];
    for (const holiday of holidaysQuery.data?.holidays ?? []) {
      list.push({ iso: holiday.holidayDate, tone: 'brand' });
    }
    for (const request of requestsQuery.data?.requests ?? []) {
      list.push({
        iso: request.holidayDate,
        tone:
          request.status === 'REJECTED'
            ? 'danger'
            : request.status === 'SUBMITTED'
              ? 'info'
              : request.status === 'APPLIED' || request.status === 'APPROVED'
                ? 'success'
                : 'warning',
      });
    }
    return list;
  }, [holidaysQuery.data?.holidays, requestsQuery.data?.requests]);

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (holidaysQuery.data?.holidays ?? [])
      .filter((holiday) => holiday.holidayDate >= today)
      .slice(0, 6);
  }, [holidaysQuery.data?.holidays]);

  const requests = requestsQuery.data?.requests ?? [];
  const pending = requests.filter((request) => request.status === 'DRAFT' || request.status === 'SUBMITTED');
  const decided = requests.filter(
    (request) => request.status === 'APPROVED' || request.status === 'APPLIED' || request.status === 'REJECTED',
  );

  if (requestsQuery.isLoading || holidaysQuery.isLoading) {
    return <InlinePanelSkeleton />;
  }

  if (requestsQuery.isError) {
    return (
      <QueryErrorState
        title="Unable to load holiday requests"
        description={
          requestsQuery.error instanceof Error ? requestsQuery.error.message : 'Try again shortly.'
        }
        onRetry={() => void requestsQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-wilms-6">
      <div className="grid gap-wilms-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Calendar
          month={selectedMonth}
          selectedDate={holidayDate || null}
          onMonthChange={setSelectedMonth}
          onSelectDate={(iso) => {
            setHolidayDate(iso);
            setSelectedMonth(iso.slice(0, 7));
          }}
          markers={markers}
        />

        <div className="space-y-wilms-4">
          <Card className="rounded-2xl border-border/70 bg-card/90 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Request holiday</CardTitle>
              <CardDescription>
                Select a date on the calendar, then submit for maker-checker approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-wilms-3">
              <Input
                aria-label="Holiday name"
                placeholder="Holiday name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <div className="grid gap-wilms-3 sm:grid-cols-2">
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
              </div>
              <Textarea
                aria-label="Reason"
                placeholder="Reason (optional)"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <Input
                aria-label="Community"
                placeholder="Community (optional)"
                value={community}
                onChange={(event) => setCommunity(event.target.value)}
              />
              <Textarea
                aria-label="Notes"
                placeholder="Notes for approvers (optional)"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
              <Input
                aria-label="Evidence URL"
                placeholder="Evidence link or file reference (optional)"
                value={evidenceUrl}
                onChange={(event) => setEvidenceUrl(event.target.value)}
              />
              {impactQuery.data ? (
                <p className="rounded-xl border border-border/60 bg-background/60 px-wilms-3 py-wilms-2 text-small text-text-secondary">
                  Schedule preview: {impactQuery.data.affectedInstallments} installment
                  {impactQuery.data.affectedInstallments === 1 ? '' : 's'} may shift if this holiday is
                  applied.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-wilms-2">
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
                <Button
                  type="button"
                  size="sm"
                  disabled={createMutation.isPending}
                  onClick={() => {
                    if (!name.trim() || !holidayDate.trim()) {
                      toast.error('Name and date are required');
                      return;
                    }
                    void createMutation.mutateAsync(true);
                  }}
                >
                  {createMutation.isPending ? 'Saving…' : 'Submit for approval'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-card/90 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Upcoming holidays</CardTitle>
              <CardDescription>National and organisation calendar</CardDescription>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="text-small text-text-muted">No upcoming holidays loaded.</p>
              ) : (
                <ul className="space-y-wilms-2">
                  {upcoming.map((holiday) => (
                    <li key={holiday.id} className="flex items-center justify-between gap-wilms-2 text-small">
                      <span className="font-semibold text-text-primary">{holiday.name}</span>
                      <span className="text-text-muted">{formatDisplayDate(holiday.holidayDate)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-wilms-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Pending requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-wilms-3">
            {pending.length === 0 ? (
              <p className="text-small text-text-muted">No drafts or submissions waiting.</p>
            ) : (
              pending.map((request) => (
                <div key={request.id} className="flex items-center justify-between gap-wilms-2">
                  <div>
                    <p className="font-semibold text-text-primary">{request.name}</p>
                    <p className="text-small text-text-muted">{formatDisplayDate(request.holidayDate)}</p>
                  </div>
                  <div className="flex items-center gap-wilms-2">
                    <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
                    {request.status === 'DRAFT' ? (
                      <Button size="sm" onClick={() => void submitMutation.mutateAsync(request.id)}>
                        Submit
                      </Button>
                    ) : null}
                    {request.status === 'DRAFT' || request.status === 'SUBMITTED' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void cancelMutation.mutateAsync(request.id)}
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-wilms-3">
            {decided.length === 0 ? (
              <p className="text-small text-text-muted">No decided requests yet.</p>
            ) : (
              decided.map((request) => (
                <div key={request.id} className="flex items-center justify-between gap-wilms-2">
                  <div>
                    <p className="font-semibold text-text-primary">{request.name}</p>
                    <p className="text-small text-text-muted">{formatDisplayDate(request.holidayDate)}</p>
                  </div>
                  <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
