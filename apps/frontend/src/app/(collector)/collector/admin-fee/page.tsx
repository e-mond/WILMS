import { PageShell } from '@/components/layout/PageShell';
import { AwaitingAdminFeeList } from '@/features/admin-fee/components/AwaitingAdminFeeList';

export default function CollectorAdminFeePage() {
  return (
    <PageShell variant="executive">
      <AwaitingAdminFeeList />
    </PageShell>
  );
}
