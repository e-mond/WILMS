import { apiClient } from '@/utils/apiClient';
import type { ITransactionService } from '@/types/services';
import type {
  AdminFeeStatus,
  AwaitingAdminFeeBorrower,
  CollectedAdminFeeRecord,
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

  listCollectedAdminFees(filter?: { collectorId?: string }): Promise<CollectedAdminFeeRecord[]> {
    const query = filter?.collectorId
      ? `?collectorId=${encodeURIComponent(filter.collectorId)}`
      : '';
    return apiClient.get<CollectedAdminFeeRecord[]>(`/transactions/admin-fees${query}`);
  },
};

export default transactionService;
