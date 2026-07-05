import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';
import { ReviewedApplicationsPanel } from '@/features/approval-workflow/components/ReviewedApplicationsPanel';

export default function ReviewedApplicationsPage() {
  return (
    <PageShell variant="executive">
      <ModulePageIntro guidanceKey="approverReviewed" />
      <ReviewedApplicationsPanel />
    </PageShell>
  );
}
