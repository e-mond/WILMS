import dynamic from 'next/dynamic';
import { PageShell } from '@/components/layout/PageShell';
import { PageLoadingFallback } from '@/components/layout/PageLoadingFallback';

const SettingsPanel = dynamic(
  () =>
    import('@/features/settings/components/SettingsPanel').then((module) => ({
      default: module.SettingsPanel,
    })),
  { loading: () => <PageLoadingFallback label="Loading settings" /> },
);

export default function SettingsPage() {
  return (
    <PageShell variant="executive">
      <SettingsPanel />
    </PageShell>
  );
}
