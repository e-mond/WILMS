import { CollectorHolidayRequestsPanel } from '@/features/holidays/components/CollectorHolidayRequestsPanel';
import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';

export default function CollectorHolidaysPage() {
  return (
    <PageShell description="Request organisation holidays and track approval status.">
      <ModulePageIntro guidanceKey="collectorHolidays" />
      <h1 className="text-heading-1 font-semibold text-text-primary">Holidays</h1>
      <CollectorHolidayRequestsPanel />
    </PageShell>
  );
}
