import { MOCK_EXPENSES } from '@/mocks/expenses';
import type { IExpenseService } from '@/types/services';
import type { CreateExpenseInput, ExpenseRecord } from '@/types/expense';
import { EXPENSE_STATUS } from '@/types/expense';
import { simulateDelay } from '@/services/mock/delay';

let expenses: ExpenseRecord[] = MOCK_EXPENSES.map((entry) => ({ ...entry }));
let nextExpenseSequence = expenses.length + 1;

function buildSummary() {
  const pending = expenses.filter((entry) => entry.status === EXPENSE_STATUS.PENDING);
  const approved = expenses.filter((entry) => entry.status === EXPENSE_STATUS.APPROVED);

  return {
    pendingCount: pending.length,
    approvedTotalPesewas: approved.reduce((sum, entry) => sum + entry.amountPesewas, 0),
    pendingTotalPesewas: pending.reduce((sum, entry) => sum + entry.amountPesewas, 0),
  };
}

const expenseServiceMock: IExpenseService = {
  async listExpenses() {
    await simulateDelay();
    return {
      expenses: expenses.map((entry) => ({ ...entry })),
      summary: buildSummary(),
    };
  },

  async createExpense(input: CreateExpenseInput) {
    await simulateDelay();
    const created: ExpenseRecord = {
      id: `EXP-${String(nextExpenseSequence).padStart(3, '0')}`,
      category: input.category,
      categoryLabel: input.category.replace(/_/g, ' '),
      amountPesewas: input.amountPesewas,
      expenseDate: input.expenseDate,
      reason: input.reason,
      notes: input.notes,
      receiptFileName: input.receiptFileName,
      gpsLabel: input.gpsLabel,
      recordedById: input.recordedById,
      recordedByName: input.recordedByName,
      status: EXPENSE_STATUS.PENDING,
      createdAt: new Date().toISOString(),
    };

    nextExpenseSequence += 1;
    expenses = [created, ...expenses];
    return { ...created };
  },

  async reviewExpense(id, input) {
    await simulateDelay();
    const index = expenses.findIndex((entry) => entry.id === id);

    if (index === -1) {
      throw new Error('Expense not found');
    }

    const current = expenses[index]!;
    if (current.status !== EXPENSE_STATUS.PENDING) {
      if (current.status === input.status) {
        return { ...current };
      }
      throw new Error('Only pending expenses can be reviewed.');
    }

    if (input.status === EXPENSE_STATUS.REJECTED && !input.reviewNote?.trim()) {
      throw new Error('A rejection reason is required.');
    }

    const updated = { ...current, status: input.status };
    expenses = [...expenses.slice(0, index), updated, ...expenses.slice(index + 1)];
    return { ...updated };
  },

  async getExpenseSummary() {
    await simulateDelay();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const sumSince = (date: Date) =>
      expenses
        .filter((entry) => entry.status === EXPENSE_STATUS.APPROVED)
        .filter((entry) => new Date(entry.expenseDate) >= date)
        .reduce((total, entry) => total + entry.amountPesewas, 0);

    return {
      todayPesewas: sumSince(startOfDay),
      weekPesewas: sumSince(startOfWeek),
      monthPesewas: sumSince(startOfMonth),
      yearPesewas: sumSince(startOfYear),
    };
  },
};

export default expenseServiceMock;
