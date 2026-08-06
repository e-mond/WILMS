import dynamic from 'next/dynamic';
import { PageShell } from '@/components/layout/PageShell';
import { PageLoadingFallback } from '@/components/layout/PageLoadingFallback';

const ExecutiveIntelligencePanel = dynamic(
  () =>
    import('@/features/intelligence/components/ExecutiveIntelligencePanel').then((module) => ({
      default: module.ExecutiveIntelligencePanel,
    })),
  { loading: () => <PageLoadingFallback label="Loading executive intelligence" /> },
);

export default function ExecutiveIntelligencePage() {
  return (
    <PageShell variant="executive">
      <ExecutiveIntelligencePanel />
    </PageShell>
  );
}
