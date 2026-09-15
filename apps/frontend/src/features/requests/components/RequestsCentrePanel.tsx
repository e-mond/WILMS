'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Inbox } from 'lucide-react';
import { PendingBorrowerUpdateQueue } from '@/features/borrower-updates/components/PendingBorrowerUpdateQueue';
import { HolidayRequestReviewQueue } from '@/features/holidays/components/HolidayRequestReviewQueue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { organizationHolidaysService } from '@/services/organizationHolidaysService';
import { formatDisplayDate } from '@/utils/format-date';
import { localIsoDate } from '@/utils/weekday';

type RequestsTab = 'borrower-updates' | 'holidays';

/**
 * Centralised operational request inbox for Super Admin (and shared review queues).
 */
export function RequestsCentrePanel({
  defaultTab = 'borrower-updates',
}: {
  defaultTab?: RequestsTab;
}) {
  const today = localIsoDate();
  const holidaysQuery = useQuery({
    queryKey: ['organization-holidays', 'requests-upcoming'] as const,
    queryFn: () => organizationHolidaysService.listHolidays(),
  });

  const upcomingHolidays = useMemo(() => {
    const holidays = holidaysQuery.data?.holidays ?? [];
    return holidays
      .filter((holiday) => holiday.enabled !== false && holiday.holidayDate >= today)
      .sort((a, b) => a.holidayDate.localeCompare(b.holidayDate))
      .slice(0, 8);
  }, [holidaysQuery.data?.holidays, today]);

  return (
    <div className="space-y-wilms-5" data-testid="requests-centre">
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div className="bg-gradient-to-br from-brand-primary/[0.08] via-transparent to-sky-500/[0.05] px-wilms-5 py-wilms-5 sm:px-wilms-6">
          <div className="flex flex-col gap-wilms-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-small font-semibold uppercase tracking-wide text-brand-primary">
                Operations
              </p>
              <h1 className="mt-wilms-1 text-heading-1 font-semibold text-text-primary">Requests</h1>
              <p className="mt-wilms-1 max-w-2xl text-small text-text-muted">
                Review borrower information updates and collector holiday requests. Approvals are
                audited and notify the requester.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3 py-2 text-small text-text-muted">
              <Inbox className="h-4 w-4 text-brand-primary" aria-hidden="true" />
              Shared review queues
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList aria-label="Request types" className="w-full justify-start sm:w-auto">
          <TabsTrigger value="borrower-updates">Borrower updates</TabsTrigger>
          <TabsTrigger value="holidays">Holiday requests</TabsTrigger>
        </TabsList>

        <TabsContent value="borrower-updates" className="mt-wilms-4">
          <section className="overflow-hidden rounded-2xl border border-border/80 bg-card">
            <div className="border-b border-border/70 px-wilms-5 py-wilms-4">
              <h2 className="text-heading-3 font-semibold text-text-primary">
                Borrower information updates
              </h2>
              <p className="mt-0.5 text-small text-text-muted">
                Collector-submitted profile corrections awaiting review.
              </p>
            </div>
            <div className="p-wilms-4">
              <PendingBorrowerUpdateQueue />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="holidays" className="mt-wilms-4 space-y-wilms-4">
          <section className="overflow-hidden rounded-2xl border border-border/80 bg-card">
            <div className="flex items-start gap-wilms-3 border-b border-border/70 px-wilms-5 py-wilms-4">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-400">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-heading-3 font-semibold text-text-primary">
                  Upcoming organisation holidays
                </h2>
                <p className="text-small text-text-muted">
                  Calendar days already on the organisation schedule (next 8).
                </p>
              </div>
            </div>
            <div className="p-wilms-4">
              {holidaysQuery.isLoading ? (
                <p className="text-small text-text-muted">Loading upcoming holidays…</p>
              ) : upcomingHolidays.length === 0 ? (
                <p className="text-small text-text-muted">No upcoming holidays on the calendar.</p>
              ) : (
                <ul className="space-y-wilms-2">
                  {upcomingHolidays.map((holiday) => (
                    <li
                      key={holiday.id}
                      className="flex flex-wrap items-baseline justify-between gap-wilms-2 rounded-xl border border-border/70 bg-background/60 px-wilms-3 py-wilms-3"
                    >
                      <div>
                        <p className="font-semibold text-text-primary">{holiday.name}</p>
                        <p className="text-small text-text-muted">
                          {holiday.scope}
                          {holiday.branch ? ` · ${holiday.branch}` : ''}
                        </p>
                      </div>
                      <p className="text-small font-semibold text-text-primary">
                        {formatDisplayDate(holiday.holidayDate)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-border/80 bg-card">
            <div className="border-b border-border/70 px-wilms-5 py-wilms-4">
              <h2 className="text-heading-3 font-semibold text-text-primary">Holiday requests</h2>
              <p className="mt-0.5 text-small text-text-muted">
                Collector leave requests. Approved days are applied to the organisation calendar and
                shift repayment schedules.
              </p>
            </div>
            <div className="min-w-0 p-wilms-4">
              <HolidayRequestReviewQueue />
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
