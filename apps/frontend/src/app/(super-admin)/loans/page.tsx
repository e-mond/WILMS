import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';
import { LoanPortfolioList } from '@/features/loan-management/components/LoanPortfolioList';

export default function LoansPage() {
  return (
    <PageShell variant="executive">
      <ModulePageIntro guidanceKey="loans" />
      <LoanPortfolioList />
    </PageShell>
  );
}
