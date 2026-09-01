import { PendingScheduleChangeQueue } from '@/features/ops/components/PendingScheduleChangeQueue';
import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';

export default function ApproverScheduleChangesPage() {
  return (
    <PageShell description="Review payment day change requests before Super Admin approval.">
      <ModulePageIntro guidanceKey="approverScheduleChanges" />
      <h1 className="text-heading-1 font-semibold text-text-primary">Payment day changes</h1>
      <PendingScheduleChangeQueue />
    </PageShell>
  );
}
