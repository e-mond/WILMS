import dynamic from 'next/dynamic';
import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';
import { PageLoadingFallback } from '@/components/layout/PageLoadingFallback';

const LoanPoolsPanel = dynamic(
  () =>
    import('@/features/loan-pools/components/LoanPoolsPanel').then((module) => ({
      default: module.LoanPoolsPanel,
    })),
  { loading: () => <PageLoadingFallback label="Loading loan pools" /> },
);

export default function LoanPoolsPage() {
  return (
    <PageShell variant="executive">
      <ModulePageIntro guidanceKey="loanPools" />
      <LoanPoolsPanel />
    </PageShell>
  );
}
