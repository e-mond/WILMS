import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';
import { PendingApplicationsQueue } from '@/features/approval-workflow/components/PendingApplicationsQueue';

export default function PendingApplicationsPage() {
  return (
    <PageShell variant="executive">
      <ModulePageIntro guidanceKey="approverPending" />
      <PendingApplicationsQueue />
    </PageShell>
  );
}
