import dynamic from 'next/dynamic';
import { PageShell } from '@/components/layout/PageShell';
import { PageLoadingFallback } from '@/components/layout/PageLoadingFallback';

const SettingsExpensesSection = dynamic(
  () =>
    import('@/features/settings/components/SettingsExpensesSection').then((module) => ({
      default: module.SettingsExpensesSection,
    })),
  { loading: () => <PageLoadingFallback label="Loading expense management" /> },
);

export default function ExpensesPage() {
  return (
    <PageShell variant="executive" description="Review, approve, and track field and office expenses.">
      <SettingsExpensesSection />
    </PageShell>
  );
}
