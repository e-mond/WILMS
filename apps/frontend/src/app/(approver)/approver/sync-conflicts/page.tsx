import { PageGuidanceTip } from '@/components/feedback/PageGuidanceTip';
import { PageShell } from '@/components/layout/PageShell';
import { SyncConflictPanel } from '@/features/sync-conflicts/components/SyncConflictPanel';

export default function SyncConflictsPage() {
  return (
    <PageShell variant="executive">
      <PageGuidanceTip
        title="Offline sync review"
        body="Approve or reject financial operations captured while collectors were offline."
        className="mb-wilms-4"
      />
      <SyncConflictPanel />
    </PageShell>
  );
}
