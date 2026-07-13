import { PageShell } from '@/components/layout/PageShell';
import { CollectorMessagesPanel } from '@/features/messaging/components/CollectorMessagesPanel';

export default function CollectorMessagesPage() {
  return (
    <PageShell description="Read and reply to supervisor messages.">
      <h1 className="text-heading-1 font-semibold text-text-primary">Messages</h1>
      <p className="mt-wilms-2 text-body text-text-muted">
        New messages trigger notification bell alerts, optional sounds, and push notifications when enabled.
      </p>
      <div className="mt-wilms-6">
        <CollectorMessagesPanel />
      </div>
    </PageShell>
  );
}
