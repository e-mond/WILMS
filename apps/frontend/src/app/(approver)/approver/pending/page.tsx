import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';
import { PendingApplicationsQueue } from '@/features/approval-workflow/components/PendingApplicationsQueue';
import { ApproverWorkspaceHome } from '@/features/role-homes/components/ApproverWorkspaceHome';

export default function PendingApplicationsPage() {
  return (
    <PageShell variant="executive">
      <ApproverWorkspaceHome />
      <ModulePageIntro guidanceKey="approverPending" />
      <PendingApplicationsQueue />
    </PageShell>
  );
}
