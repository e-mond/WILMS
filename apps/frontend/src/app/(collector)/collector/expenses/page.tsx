import { PageShell } from '@/components/layout/PageShell';
import { CollectorExpenseForm } from '@/features/expenses/components/CollectorExpenseForm';

export default function CollectorExpensesPage() {
  return (
    <PageShell description="Submit field expenses for admin review.">
      <h1 className="text-heading-1 font-semibold text-text-primary">Record Expense</h1>
      <CollectorExpenseForm />
    </PageShell>
  );
}
