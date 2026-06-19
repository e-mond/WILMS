import { PageShell } from '@/components/layout/PageShell';
import { FinancialLedgerReportPanel } from '@/features/reports/components/FinancialLedgerReportPanel';

export default function FinancialLedgerReportPage() {
  return (
    <PageShell variant="executive">
      <FinancialLedgerReportPanel />
    </PageShell>
  );
}
