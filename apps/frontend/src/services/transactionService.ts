import { apiClient } from '@/utils/apiClient';
import type { ITransactionService } from '@/types/services';
import type {
  AdminFeeStatus,
  AwaitingAdminFeeBorrower,
  CollectedAdminFeeRecord,
  FinancialTransaction,
  RecordAdminFeeInput,
} from '@/types/transaction';
import { financialMutation } from '@/utils/financialMutation';

const transactionService: ITransactionService = {
  async recordAdminFee(input: RecordAdminFeeInput): Promise<FinancialTransaction> {
    const { result } = await financialMutation(
      (headers) =>
        apiClient.post<FinancialTransaction>('/transactions/admin-fee', input, { headers }),
      { domain: 'generic' },
    );
    return result;
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
