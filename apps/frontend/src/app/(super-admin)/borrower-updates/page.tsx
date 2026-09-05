import { PageShell } from '@/components/layout/PageShell';
import { RequestsCentrePanel } from '@/features/requests/components/RequestsCentrePanel';

export default function AdminRequestsPage() {
  return (
    <PageShell variant="executive">
      <RequestsCentrePanel />
    </PageShell>
  );
}
