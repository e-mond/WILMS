import { PageShell } from '@/components/layout/PageShell';
import { MissedPaymentReportPanel } from '@/features/reports/components/MissedPaymentReportPanel';

export default function MissedPaymentReportPage() {
  return (
    <PageShell variant="executive">
      <MissedPaymentReportPanel />
    </PageShell>
  );
}
