import { apiClient } from '@/utils/apiClient';
import type { ITransactionService } from '@/types/services';
import type {
  AdminFeeStatus,
  AwaitingAdminFeeBorrower,
  FinancialTransaction,
  RecordAdminFeeInput,
} from '@/types/transaction';

const transactionService: ITransactionService = {
  recordAdminFee(input: RecordAdminFeeInput): Promise<FinancialTransaction> {
    return apiClient.post<FinancialTransaction>('/transactions/admin-fee', input);
  },

  getAdminFeeStatus(borrowerId: string): Promise<AdminFeeStatus> {
    return apiClient.get<AdminFeeStatus>(`/borrowers/${borrowerId}/admin-fee-status`);
  },

  listBorrowersAwaitingAdminFee(): Promise<AwaitingAdminFeeBorrower[]> {
    return apiClient.get<AwaitingAdminFeeBorrower[]>('/borrowers/awaiting-admin-fee');
  },
};

export default transactionService;
