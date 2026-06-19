import { EXPENSE_CATEGORY, type ExpenseCategory } from '@/types/expense';

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [EXPENSE_CATEGORY.FUEL]: 'Fuel',
  [EXPENSE_CATEGORY.TRANSPORT]: 'Transport',
  [EXPENSE_CATEGORY.AIRTIME]: 'Airtime',
  [EXPENSE_CATEGORY.FIELD_OPERATIONS]: 'Field Operations',
  [EXPENSE_CATEGORY.OFFICE]: 'Office',
  [EXPENSE_CATEGORY.COMMUNITY_MEETINGS]: 'Community Meetings',
  [EXPENSE_CATEGORY.OTHER]: 'Other',
};

export const EXPENSE_CATEGORY_OPTIONS = Object.values(EXPENSE_CATEGORY).map((category) => ({
  value: category,
  label: EXPENSE_CATEGORY_LABELS[category],
}));
