import { PageShell } from '@/components/layout/PageShell';
import { LoanPortfolioReportPanel } from '@/features/reports/components/LoanPortfolioReportPanel';

export default function LoanPortfolioReportPage() {
  return (
    <PageShell variant="executive">
      <LoanPortfolioReportPanel />
    </PageShell>
  );
}
