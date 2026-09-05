'use client';

import { PendingBorrowerUpdateQueue } from '@/features/borrower-updates/components/PendingBorrowerUpdateQueue';
import { HolidayRequestReviewQueue } from '@/features/holidays/components/HolidayRequestReviewQueue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

type RequestsTab = 'borrower-updates' | 'holidays';

/**
 * Centralised operational request inbox for Super Admin (and shared review queues).
 */
export function RequestsCentrePanel({
  defaultTab = 'borrower-updates',
}: {
  defaultTab?: RequestsTab;
}) {
  return (
    <div className="space-y-wilms-4" data-testid="requests-centre">
      <header className="space-y-wilms-2 border-b border-border/80 pb-wilms-4">
        <p className="text-small font-semibold uppercase tracking-wide text-brand-primary">
          Operations
        </p>
        <h1 className="text-heading-1 font-semibold text-text-primary">Requests</h1>
        <p className="max-w-2xl text-body text-text-muted">
          Review borrower information updates and collector holiday requests in one place. Approvals
          are audited and notify the requester.
        </p>
      </header>

      <Tabs defaultValue={defaultTab}>
        <TabsList aria-label="Request types">
          <TabsTrigger value="borrower-updates">Borrower updates</TabsTrigger>
          <TabsTrigger value="holidays">Holiday requests</TabsTrigger>
        </TabsList>

        <TabsContent value="borrower-updates" className="mt-wilms-4">
          <Card>
            <CardHeader>
              <CardTitle>Borrower information updates</CardTitle>
              <CardDescription>
                Collector-submitted profile corrections awaiting review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PendingBorrowerUpdateQueue />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holidays" className="mt-wilms-4">
          <Card>
            <CardHeader>
              <CardTitle>Holiday requests</CardTitle>
              <CardDescription>
                Collector leave requests. Approved days are applied to the organisation calendar and
                shift repayment schedules.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-w-0">
              <HolidayRequestReviewQueue />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
