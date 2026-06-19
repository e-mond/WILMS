import type { IExpenseService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';

const expenseService: IExpenseService = {
  listExpenses() {
    return apiClient.get('/expenses');
  },

  createExpense(input) {
    return apiClient.post('/expenses', input);
  },

  reviewExpense(id, input) {
    return apiClient.patch(`/expenses/${id}`, input);
  },

  getExpenseSummary() {
    return apiClient.get('/expenses/summary');
  },
};

export default expenseService;
