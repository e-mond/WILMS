import { PageShell } from '@/components/layout/PageShell';
import { LoanPortfolioList } from '@/features/loan-management/components/LoanPortfolioList';

export default function LoansPage() {
  return (
    <PageShell variant="executive">
      <LoanPortfolioList />
    </PageShell>
  );
}
