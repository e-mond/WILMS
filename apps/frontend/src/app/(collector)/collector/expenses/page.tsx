import { CollectorExpenseForm } from '@/features/expenses/components/CollectorExpenseForm';
import { CollectorExpenseHistoryPanel } from '@/features/expenses/components/CollectorExpenseHistoryPanel';
import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';

export default function CollectorExpensesPage() {
  return (
    <PageShell description="Record field expenses and review your expense history.">
      <ModulePageIntro guidanceKey="collectorExpenses" />
      <h1 className="text-heading-1 font-semibold text-text-primary">Expenses</h1>
      <div className="space-y-wilms-8">
        <section aria-labelledby="collector-record-expense-heading">
          <h2 id="collector-record-expense-heading" className="mb-wilms-4 text-heading-2 font-semibold text-text-primary">
            Record Expense
          </h2>
          <CollectorExpenseForm />
        </section>
        <CollectorExpenseHistoryPanel />
      </div>
    </PageShell>
  );
}
