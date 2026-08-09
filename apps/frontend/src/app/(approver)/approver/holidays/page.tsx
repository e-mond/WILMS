import { HolidayRequestReviewQueue } from '@/features/holidays/components/HolidayRequestReviewQueue';
import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';

export default function ApproverHolidaysPage() {
  return (
    <PageShell description="Review collector holiday requests with maker-checker controls.">
      <ModulePageIntro guidanceKey="approverHolidays" />
      <h1 className="text-heading-1 font-semibold text-text-primary">Holiday requests</h1>
      <HolidayRequestReviewQueue />
    </PageShell>
  );
}
