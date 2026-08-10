import type { ExpenseRecord } from '@/types/expense';
import type { IExpenseService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';
import { financialMutation } from '@/utils/financialMutation';

const expenseService: IExpenseService = {
  listExpenses() {
    return apiClient.get('/expenses');
  },

  async createExpense(input) {
    const { result } = await financialMutation(
      (headers) => apiClient.post<ExpenseRecord>('/expenses', input, { headers }),
      { domain: 'generic' },
    );
    return result;
  },

  reviewExpense(id, input) {
    return apiClient.patch(`/expenses/${id}`, input);
  },

  getExpenseSummary() {
    return apiClient.get('/expenses/summary');
  },
};

export default expenseService;
