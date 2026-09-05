import { PageShell } from '@/components/layout/PageShell';
import { HolidayRequestReviewQueue } from '@/features/holidays/components/HolidayRequestReviewQueue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export default function ApproverRequestsPage() {
  return (
    <PageShell variant="executive">
      <div className="space-y-wilms-4">
        <header className="space-y-wilms-2 border-b border-border/80 pb-wilms-4">
          <p className="text-small font-semibold uppercase tracking-wide text-brand-primary">
            Operations
          </p>
          <h1 className="text-heading-1 font-semibold text-text-primary">Requests</h1>
          <p className="max-w-2xl text-body text-text-muted">
            Review collector holiday requests. Approved days apply to the organisation calendar.
          </p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Holiday requests</CardTitle>
            <CardDescription>
              Collector leave requests awaiting approval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HolidayRequestReviewQueue />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
